import {
  CITY_MARKER_MAX_ZOOM,
  defaultMapSettings,
  mapCloseSrc,
  mapModelSrc,
  type CityScene,
  type HeritageSite,
  type MapPlacement,
  type MapSettings,
  type SceneLight,
} from "@akar/domain";
import { modestDevice } from "./device";
import { mergeByMaterial } from "./model-merge";
import type {
  CustomLayerInterface,
  CustomRenderMethodInput,
  Map as MapLibreMap,
  MercatorCoordinate,
} from "maplibre-gl";
import * as THREE from "three";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { modelBase, BAKED_SHADOW, PRESENTATION_PARTS, type ModelBase } from "./model-anchor";
import { OsmBuildingLayer } from "./map-buildings";
import { pinLayersOn } from "./map-pins";
import { currentTheme, type Theme } from "./theme";
import { footprintRing, type HideRule, type Ring } from "./osm-buildings";
import {
  addMapLights,
  MAP_NIGHT_LIGHT,
  themeMapLights,
  aimMapSun,
  groundShadow,
  MAP_LIGHT,
  mapSunAzimuth,
  saturate,
  sceneOf,
  shadowFloor,
} from "./scene-light";

/** A site whose model is drawn on the map. */
export interface MapModelSite {
  id: string;
  src: string;
  placement: MapPlacement;
  /** The city's model light (§11.42); a change reloads the model. */
  light: SceneLight;
  /** Interior parts left out on the map (`SiteModel.interiorParts`). */
  interiorParts?: string[];
  /** The lit file a baked model gives way to close up (`CLOSE_ZOOM`); none for a model that is lit already. */
  closeSrc?: string;
}
interface Entry {
  site: MapModelSite;
  /** Lights and the placed model; drawn with its own matrix. */
  scene: THREE.Scene;
  /** Heading, scale and altitude; the model inside it is offset by the base point. */
  group: THREE.Group;
  model: THREE.Object3D;
  /** Model units (metres) → mercator coordinates. */
  matrix: THREE.Matrix4;
  footprint: Ring;
  /** The base point measured before the meshes were merged (they lose their part names), by anchor part. */
  bases: Map<string | null, ModelBase>;
  /** Soft ground shadow inside `group`; null when the city's light has none. */
  shadow: THREE.Mesh | null;
  /** A baked file: light and shadow are in its textures, so the sun casts nothing and the shadow floor stays off. */
  baked: boolean;
  /** The shadow-casting sun and the ground that shows its shadow, both in `scene` (world axes). */
  sun: THREE.DirectionalLight;
  floor: THREE.Mesh;
  /** The sun or the model moved: its shadow map is drawn again on the next frame, otherwise kept. */
  shadowDirty: boolean;
  /** 0–1: how far it has faded in (`FADE_MS`); `fadeTo` is where it is going. */
  fade: number;
  fadeTo: 0 | 1;
}

const LAYER_ID = "akar-models";
/** Models count as in view this far beyond the screen edge, as a share of the screen. */
const VIEW_MARGIN = 0.25;
/**
 * The map draws the building only: presentation files carry ground discs, trees and scale figures that
 * would cover the street and the OSM blocks around the model, and interior parts the map file of the prototype
 * does not have (they would add hidden faces and shadows). Removed before the first render, so nothing
 * of theirs reached the GPU; materials may be shared with the building and are left alone.
 */
function stripScenery(root: THREE.Object3D, interior: string[] = []) {
  const scenery: THREE.Object3D[] = [];
  root.traverse((node) => {
    if (node !== root && (PRESENTATION_PARTS.test(node.name) || interior.includes(node.name)))
      scenery.push(node);
  });
  for (const node of scenery) node.removeFromParent();
}
/** Every material unlit (`KHR_materials_unlit`): a baked file, needing no lights. */
function isBaked(root: THREE.Object3D) {
  let meshes = 0;
  let unlit = 0;
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    meshes++;
    if (node.material instanceof THREE.MeshBasicMaterial) unlit++;
  });
  return meshes > 0 && meshes === unlit;
}
/** A baked file's ground shadow lies on the map: under the building, untouchable, and clear of the ground's depth. */
function settleBakedShadow(root: THREE.Object3D) {
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh) || !BAKED_SHADOW.test((node.material as THREE.Material).name)) return;
    const material = node.material as THREE.Material;
    material.polygonOffset = true;
    material.polygonOffsetFactor = 2;
    material.polygonOffsetUnits = 8;
    node.renderOrder = -1;
    node.raycast = () => {};
  });
}
const disposeObject = (root: THREE.Object3D) =>
  root.traverse((item) => {
    if (!(item instanceof THREE.Mesh)) return;
    item.geometry.dispose();
    const materials: THREE.Material[] = Array.isArray(item.material)
      ? item.material
      : [item.material];
    for (const material of materials) {
      for (const value of Object.values(material))
        if (value instanceof THREE.Texture) value.dispose();
      material.dispose();
    }
  });

const samePose = (a: MapPlacement, b: MapPlacement) =>
  a.lng === b.lng &&
  a.lat === b.lat &&
  a.headingDeg === b.headingDeg &&
  a.scale === b.scale &&
  a.altitudeM === b.altitudeM &&
  a.anchorNode === b.anchorNode;

const sameLight = (a: SceneLight, b: SceneLight) =>
  (Object.keys(a) as Array<keyof SceneLight>).every((k) => a[k] === b[k]);

/**
 * MapLibre custom layer that draws the sites' GLB models with three.js in the map's own GL context.
 * Models load only at `modelMinZoom` and above, at most `maxVisibleModels` of them, the ones nearest the
 * map centre among those in view; a model that leaves that set is disposed.
 */
/** How many models out of view are kept ready (`parked`). */
const PARKED_MAX = 8;
/** A model comes in and goes out over this long, not at once (Muhammed, 3 Nov 2026: «bir var bir yok»). */
const FADE_MS = 500;
/** Zoomed out this far below `modelMinZoom` the models go; they come back at `modelMinZoom` (no flicker at the line). */
const ZOOM_SLACK = 0.5;
/** A modest phone's sun: a smaller shadow map, drawn once like every other (`shadowDirty`). */
const MODEST_SHADOW_MAP = 512;
/**
 * Close up a baked model gives way to the site's own lit file (Muhammed, 4 Nov 2026: «tüm detayları öldürmüş»): a baked
 * atlas holds about 10 cm a pixel, and from here on a phone's pixel shows less than that, so lattices, masonry and lead
 * seams go. The sun is the same in both, so only the detail changes. Few models are on screen this close.
 */
const CLOSE_ZOOM = 17.5;
/** Back to the baked file this far below `CLOSE_ZOOM` (no flicker at the line). */
const CLOSE_SLACK = 0.5;
/** Lit close-up models at once, the nearest the centre. */
const CLOSE_MAX = 2;
/** The close-up file of a site is a site of its own in the layer, under this key. */
const CLOSE_KEY = "|yakin";
const baseKey = (key: string) => (key.endsWith(CLOSE_KEY) ? key.slice(0, -CLOSE_KEY.length) : key);
const partnerKey = (key: string) => (key.endsWith(CLOSE_KEY) ? baseKey(key) : key + CLOSE_KEY);

/** Whether the map is close enough for the lit file, given whether it was: in at `CLOSE_ZOOM`, out `CLOSE_SLACK` below. */
export const closeUpAt = (zoom: number, was: boolean) =>
  zoom >= CLOSE_ZOOM ? true : zoom < CLOSE_ZOOM - CLOSE_SLACK ? false : was;

export class MapModelLayer implements CustomLayerInterface {
  readonly id = LAYER_ID;
  readonly type = "custom" as const;
  readonly renderingMode = "3d" as const;
  private map: MapLibreMap | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private decoder: DRACOLoader | null = null;
  private loader: GLTFLoader | null = null;
  private readonly camera = new THREE.Camera();
  /** Where a pass that only refreshes shadow maps draws its throwaway picture. */
  private readonly offscreen = new THREE.WebGLRenderTarget(1, 1);
  private readonly projection = new THREE.Matrix4();
  private readonly clip = new THREE.Matrix4();
  private readonly eye = new THREE.Vector4();
  private rendered = false;
  private sites = new Map<string, MapModelSite>();
  private settings: MapSettings = { ...defaultMapSettings };
  private readonly loaded = new Map<string, Entry>();
  private readonly loading = new Map<
    string,
    { src: string; light: SceneLight; token: object }
  >();
  /** `site id` → source that failed to load; not retried until the source changes. */
  private readonly failed = new Map<string, string>();
  /**
   * Models that left the view (panned away, zoomed out) kept ready, not drawn: coming back they show at once
   * instead of being read, decoded and uploaded again (Muhammed, 3 Nov 2026: «gitti mi zor geliyor, geldi mi zor
   * geliyor»). The oldest goes beyond `PARKED_MAX`.
   */
  private readonly parked = new Map<string, Entry>();
  /** Models fading out (`fadeTo` 0); parked once gone. */
  private readonly leaving = new Map<string, Entry>();
  /** Near enough for the models, with `ZOOM_SLACK` on the way out. */
  private near = false;
  /** Close enough for the lit files (`CLOSE_ZOOM`). */
  private close = false;
  private lastFrame = 0;
  /**
   * A turning ring where a model is coming in (Muhammed, 3 Nov 2026: «modeller yüklenirken oldukları yerde dairesel
   * bir yükleme»): one small element per loading model over the map, placed at its point on every move.
   */
  private readonly rings = new Map<string, HTMLElement>();
  private readonly placeRings = () => {
    const map = this.map;
    if (!map) return;
    for (const [id, ring] of this.rings) {
      const p = this.sites.get(id)?.placement;
      if (!p) continue;
      const point = map.project([p.lng, p.lat]);
      ring.style.transform = `translate(${Math.round(point.x)}px, ${Math.round(point.y)}px)`;
    }
  };
  private ringOn(id: string) {
    const map = this.map;
    if (!map || this.rings.has(id) || typeof document === "undefined") return;
    const ring = document.createElement("div");
    ring.className = "model-ring";
    ring.setAttribute("aria-hidden", "true");
    map.getCanvasContainer().appendChild(ring);
    this.rings.set(id, ring);
    this.placeRings();
  }
  private ringOff(id: string) {
    const ring = this.rings.get(id);
    if (!ring) return;
    this.rings.delete(id);
    ring.classList.add("gone");
    setTimeout(() => ring.remove(), 300);
  }

  private opacity = 1;
  private theme: Theme = currentTheme();

  constructor(
    private readonly mercator: typeof MercatorCoordinate,
    /** Called after a model appeared, left or moved: the building layer follows. */
    private readonly onChange: () => void,
    /** Load the sites regardless of where the map looks (the panel preview). */
    private readonly everywhere = false,
  ) {}

  onAdd(map: MapLibreMap, gl: WebGL2RenderingContext) {
    this.map = map;
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
      });
    } catch {
      // No usable GL for three.js: the map keeps working without models.
      this.renderer = null;
      return;
    }
    this.renderer.autoClear = false;
    // The prototype's look (§3 of the integration notes): filmic tone mapping and real shadows. Each model's
    // shadow map is drawn once, again only when it moves; the light stays put when the map turns.
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = (this.theme === "night" ? MAP_NIGHT_LIGHT : MAP_LIGHT).exposure;
    // Shadows are drawn once per model (`shadowDirty`), not each frame: a modest phone keeps them, smaller.
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    // Same decoder files as the story viewer (`public/draco`).
    this.decoder = new DRACOLoader()
      .setDecoderPath("/draco/")
      .setWorkerLimit(2);
    this.loader = new GLTFLoader().setDRACOLoader(this.decoder);
    map.on("moveend", this.reconcile);
    map.on("move", this.placeRings);
    this.reconcile();
  }

  onRemove(map: MapLibreMap) {
    map.off("moveend", this.reconcile);
    map.off("move", this.placeRings);
    for (const id of [...this.rings.keys()]) this.ringOff(id);
    this.loading.clear();
    for (const entry of [...this.loaded.values(), ...this.parked.values(), ...this.leaving.values()]) disposeObject(entry.scene);
    this.loaded.clear();
    this.parked.clear();
    this.leaving.clear();
    this.decoder?.dispose();
    this.renderer?.dispose();
    this.offscreen.dispose();
    this.decoder = this.loader = this.renderer = this.map = null;
    this.rendered = false;
  }

  setSites(sites: MapModelSite[]) {
    this.sites = new Map(
      sites.flatMap((s) => {
        const own: [string, MapModelSite] = [s.id, s];
        if (!s.closeSrc) return [own];
        const { closeSrc, ...site } = s;
        return [own, [s.id + CLOSE_KEY, { ...site, id: s.id + CLOSE_KEY, src: closeSrc }] as [string, MapModelSite]];
      }),
    );
    this.reconcile();
  }

  setSettings(settings: MapSettings) {
    this.settings = settings;
    this.reconcile();
  }

  /** Lights every model in `theme`; the night model files come with the sites (`setSites`). */
  setTheme(theme: Theme) {
    this.theme = theme;
    if (this.renderer)
      this.renderer.toneMappingExposure = (theme === "night" ? MAP_NIGHT_LIGHT : MAP_LIGHT).exposure;
    for (const entry of this.loaded.values()) {
      themeMapLights(entry.scene, theme);
      entry.shadowDirty = true;
    }
    this.map?.triggerRepaint();
  }

  /** 1 = as modelled, below 1 the models are see-through (the preview over a satellite picture). */
  setOpacity(opacity: number) {
    this.opacity = opacity;
    for (const entry of this.loaded.values()) this.applyOpacity(entry.model);
    this.map?.triggerRepaint();
  }

  /** What became of a site's model: still coming in, drawn, or unreadable. */
  status(id: string): "loading" | "ready" | "failed" {
    if (this.loaded.has(id)) return "ready";
    return this.failed.get(id) === this.sites.get(id)?.src
      ? "failed"
      : "loading";
  }

  private applyOpacity(root: THREE.Object3D) {
    root.traverse((item) => {
      if (!(item instanceof THREE.Mesh)) return;
      const materials: THREE.Material[] = Array.isArray(item.material)
        ? item.material
        : [item.material];
      for (const material of materials) {
        // Remember what the file said, so opacity 1 gives it back.
        const own = (material.userData.akarOwn ??= {
          opacity: material.opacity,
          transparent: material.transparent,
          depthWrite: material.depthWrite,
        }) as { opacity: number; transparent: boolean; depthWrite: boolean };
        material.opacity = own.opacity * this.opacity;
        material.transparent = own.transparent || this.opacity < 1;
        material.depthWrite = this.opacity < 1 ? false : own.depthWrite;
        material.needsUpdate = true;
      }
    });
  }

  /** What each drawn model says about the OSM buildings around it. */
  hideRules(): HideRule[] {
    return [...this.loaded.values()].map((e) => ({
      footprint: e.footprint,
      hiddenPoints: e.site.placement.hiddenPoints,
      keptPoints: e.site.placement.keptPoints,
    }));
  }

  render(gl: WebGL2RenderingContext, options: CustomRenderMethodInput) {
    const renderer = this.renderer;
    if (!renderer || !this.map || (!this.loaded.size && !this.leaving.size)) return;
    // Below the city threshold the map shows cities (globe view, §11.45), never models.
    const zoom = this.map.getZoom();
    if (!this.isNear(zoom) || zoom < CITY_MARKER_MAX_ZOOM) return;
    const fading = this.stepFades();
    // Mid globe-to-flat transition `mainMatrix` is the globe's; the Mercator fallback keeps models on the ground.
    const d = options.defaultProjectionData;
    this.projection.fromArray(
      d.projectionTransition > 0 ? d.fallbackMatrix : d.mainMatrix,
    );
    this.rendered = true;
    renderer.resetState();
    // three.js shades by the direction from each surface to the camera. The map hands over one matrix (model
    // metres → clip), so the camera is put where the map's eye is in the model's metres and the projection is the
    // rest of that matrix; with the camera left at the origin roofs and façades came out darker than the prototype.
    const aim = (entry: Entry) => {
      const clip = this.clip.multiplyMatrices(this.projection, entry.matrix);
      this.eye.set(0, 0, 1, 0).applyMatrix4(this.camera.projectionMatrixInverse.copy(clip).invert());
      if (Math.abs(this.eye.w) > 1e-12)
        this.camera.position.set(this.eye.x / this.eye.w, this.eye.y / this.eye.w, this.eye.z / this.eye.w);
      else this.camera.position.set(0, 0, 0);
      this.camera.updateMatrixWorld();
      this.camera.projectionMatrix.multiplyMatrices(clip, this.camera.matrixWorld);
      this.camera.projectionMatrixInverse
        .copy(this.camera.projectionMatrix)
        .invert();
    };
    // MapLibre narrows the depth range of a 3D custom layer, and three.js writes shadow maps as hardware depth, which
    // takes that range on: drawn inside it a shadow map shades every roof of its own model. So the shadow maps are
    // drawn off screen on the full range, and the map's range is given back for the models themselves.
    const dirty = [...this.loaded.values()].filter((e) => e.shadowDirty);
    if (dirty.length) {
      const range = gl.getParameter(gl.DEPTH_RANGE) as Float32Array;
      gl.depthRange(0, 1);
      renderer.setRenderTarget(this.offscreen);
      for (const entry of dirty) {
        aim(entry);
        renderer.shadowMap.needsUpdate = true;
        renderer.render(entry.scene, this.camera);
        entry.shadowDirty = false;
      }
      renderer.setRenderTarget(null);
      gl.depthRange(range[0]!, range[1]!);
      renderer.resetState();
    }
    // The map may have resized its canvas since three.js saw it.
    renderer.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    for (const entry of [...this.loaded.values(), ...this.leaving.values()]) {
      aim(entry);
      renderer.render(entry.scene, this.camera);
    }
    if (fading) this.map.triggerRepaint();
  }

  private isNear(zoom: number) {
    const min = this.settings.modelMinZoom;
    this.near = zoom >= min ? true : zoom < min - ZOOM_SLACK ? false : this.near;
    return this.near;
  }

  /** Moves each fading model on by the time since the last frame; a model faded out is parked. True while any fades. */
  private stepFades() {
    const now = performance.now();
    // The first frame of a fade moves it one frame's worth, not all the way.
    const step = (this.lastFrame ? Math.min(100, now - this.lastFrame) : 16) / FADE_MS;
    this.lastFrame = now;
    const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    let any = false;
    for (const [id, entry] of [...this.loaded, ...this.leaving]) {
      if (entry.fade === entry.fadeTo) continue;
      entry.fade = reduced
        ? entry.fadeTo
        : entry.fadeTo ? Math.min(1, entry.fade + step) : Math.max(0, entry.fade - step);
      this.applyFade(entry);
      if (entry.fade !== entry.fadeTo) any = true;
      // One of a baked and lit pair is all there: the other can go (`select`).
      else if (entry.fadeTo === 1 && this.hasPartner(id)) setTimeout(this.reconcile);
      else if (entry.fadeTo === 0) {
        this.leaving.delete(id);
        this.parked.delete(id);
        this.parked.set(id, entry);
      }
    }
    if (!any) this.lastFrame = 0;
    return any;
  }

  /** The other file of the same building is here: the two swap, one fading in over the other. */
  private hasPartner(key: string) {
    return this.sites.has(partnerKey(key)) && this.loaded.has(partnerKey(key));
  }

  /** A fading model is see-through (no depth writes meanwhile); faded in, it is as modelled again. */
  private applyFade(entry: Entry) {
    // Over its own other file it lies a hair in front, or the two would fight for the same surfaces.
    const over = entry.fade < 1 && this.hasPartner(entry.site.id);
    entry.floor.visible = !entry.baked && (entry.fade >= 1 || !over);
    entry.model.traverse((item) => {
      if (!(item instanceof THREE.Mesh)) return;
      for (const material of Array.isArray(item.material) ? item.material : [item.material]) {
        if (BAKED_SHADOW.test(material.name)) continue;
        material.polygonOffset = over;
        material.polygonOffsetFactor = over ? -1 : 0;
        material.polygonOffsetUnits = over ? -4 : 0;
      }
    });
    if (entry.fade >= 1) {
      this.applyOpacity(entry.model);
      return;
    }
    entry.model.traverse((item) => {
      if (!(item instanceof THREE.Mesh)) return;
      for (const material of Array.isArray(item.material) ? item.material : [item.material]) {
        const own = (material.userData.akarOwn ??= {
          opacity: material.opacity,
          transparent: material.transparent,
          depthWrite: material.depthWrite,
        }) as { opacity: number; transparent: boolean; depthWrite: boolean };
        if (!material.transparent) {
          material.transparent = true;
          material.depthWrite = false;
          material.needsUpdate = true;
        }
        material.opacity = own.opacity * this.opacity * entry.fade;
      }
    });
  }

  /** The site whose model is under the screen point (pixels from the map's top left), the nearest one on a hit. */
  pick(x: number, y: number): string | null {
    if (!this.map || !this.rendered) return null;
    const canvas = this.map.getCanvas();
    const ndcX = (x / canvas.clientWidth) * 2 - 1;
    const ndcY = 1 - (y / canvas.clientHeight) * 2;
    const raycaster = new THREE.Raycaster();
    let best: { id: string; distance: number } | null = null;
    for (const [key, entry] of this.loaded) {
      const id = baseKey(key);
      // Back to model space: the ray runs through the model's own metres.
      const inverse = new THREE.Matrix4()
        .multiplyMatrices(this.projection, entry.matrix)
        .invert();
      const near = new THREE.Vector3(ndcX, ndcY, -1).applyMatrix4(inverse);
      const far = new THREE.Vector3(ndcX, ndcY, 1).applyMatrix4(inverse);
      raycaster.set(near, far.sub(near).normalize());
      const hit = raycaster.intersectObject(entry.group, true)[0];
      if (hit && (!best || hit.distance < best.distance))
        best = { id, distance: hit.distance };
    }
    return best?.id ?? null;
  }

  /** At most `maxVisibleModels` at once; a modest phone draws 4 at most, the nearest the centre. */
  private visibleLimit() {
    // Kept ready out of view (`parked`), a modest phone can show twice as many as it did (8, not 4) without loading.
    return modestDevice() ? Math.min(8, this.settings.maxVisibleModels) : this.settings.maxVisibleModels;
  }

  /** The models that should be on screen now: in view, nearest the centre, at most `maxVisibleModels`. */
  private select(map: MapLibreMap): Map<string, MapModelSite> {
    if (!this.isNear(map.getZoom())) return new Map();
    this.close = closeUpAt(map.getZoom(), this.close);
    // The panel preview keeps its one model wherever the map is panned.
    if (this.everywhere)
      return new Map(
        [...this.sites.values()]
          .slice(0, Math.max(0, this.visibleLimit()))
          .map((site) => [site.id, site]),
      );
    const view = map.getBounds();
    const centre = map.getCenter();
    const padLng = (view.getEast() - view.getWest()) * VIEW_MARGIN;
    const padLat = (view.getNorth() - view.getSouth()) * VIEW_MARGIN;
    const cos = Math.cos((centre.lat * Math.PI) / 180);
    const wanted = new Map(
      [...this.sites.values()]
        .filter((site) => !site.id.endsWith(CLOSE_KEY))
        .filter(
          ({ placement: p }) =>
            p.lng >= view.getWest() - padLng &&
            p.lng <= view.getEast() + padLng &&
            p.lat >= view.getSouth() - padLat &&
            p.lat <= view.getNorth() + padLat,
        )
        .map((site) => ({
          site,
          distance: Math.hypot(
            (site.placement.lng - centre.lng) * cos,
            site.placement.lat - centre.lat,
          ),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, Math.max(0, this.visibleLimit()))
        .map(({ site }) => [site.id, site]),
    );
    // Each close-up file comes over its baked one, which stays until it is all there; and the same on the way back.
    let closeLeft = CLOSE_MAX;
    for (const [id, site] of [...wanted]) {
      if (!site.closeSrc) continue;
      const key = id + CLOSE_KEY;
      const closeUp = this.sites.get(key)!;
      if (this.close && closeLeft-- > 0) {
        wanted.set(key, closeUp);
        if (this.loaded.get(key)?.fade === 1) wanted.delete(id);
      } else if (this.loaded.has(key) && this.loaded.get(id)?.fade !== 1) wanted.set(key, closeUp);
    }
    return wanted;
  }

  private readonly reconcile = () => {
    const map = this.map;
    if (!map || !this.loader) return;
    const wanted = this.select(map);
    let changed = false;
    for (const [id, entry] of this.loaded) {
      const next = wanted.get(id);
      if (!next) {
        this.loaded.delete(id);
        if (this.loaded.get(partnerKey(id))?.fade === 1) {
          // Its other file stands all there in its place: nothing to see of this one fading, it goes at once.
          entry.fade = entry.fadeTo = 0;
          this.parked.delete(id);
          this.parked.set(id, entry);
        } else {
          // Out of view: it fades out (`leaving`), then is kept for a return (`parked`).
          entry.fadeTo = 0;
          this.leaving.set(id, entry);
        }
        changed = true;
      } else if (
        next.src !== entry.site.src ||
        !sameLight(next.light, entry.site.light)
      ) {
        disposeObject(entry.scene);
        this.loaded.delete(id);
        changed = true;
      } else if (!samePose(entry.site.placement, next.placement)) {
        this.place(entry, next);
        changed = true;
      } else if (entry.site !== next) {
        // Same pose: only the hand-picked building points may differ.
        entry.site = next;
        changed = true;
      }
    }
    for (const [id, pending] of this.loading) {
      const next = wanted.get(id);
      if (next?.src !== pending.src || !sameLight(next.light, pending.light)) {
        this.loading.delete(id);
        this.ringOff(id);
      }
    }
    // Back in view: a parked (or still fading out) model of the same file and light fades in again at once.
    for (const [id, site] of wanted) {
      const entry = this.leaving.get(id) ?? this.parked.get(id);
      if (!entry || this.loaded.has(id)) continue;
      this.parked.delete(id);
      this.leaving.delete(id);
      if (entry.site.src !== site.src || !sameLight(entry.site.light, site.light)) {
        disposeObject(entry.scene);
        continue;
      }
      themeMapLights(entry.scene, this.theme);
      this.applyOpacity(entry.model);
      if (!samePose(entry.site.placement, site.placement)) this.place(entry, site);
      else entry.site = site;
      entry.shadowDirty = true;
      entry.fadeTo = 1;
      this.loaded.set(id, entry);
      changed = true;
    }
    while (this.parked.size > PARKED_MAX) {
      const [oldest, entry] = this.parked.entries().next().value!;
      disposeObject(entry.scene);
      this.parked.delete(oldest);
    }
    for (const [id, site] of wanted)
      if (
        !this.loaded.has(id) &&
        !this.loading.has(id) &&
        this.failed.get(id) !== site.src
      )
        void this.load(site);
    if (changed) {
      map.triggerRepaint();
      this.onChange();
    }
  };

  private async load(site: MapModelSite) {
    const loader = this.loader;
    if (!loader) return;
    const token = {};
    this.loading.set(site.id, { src: site.src, light: site.light, token });
    this.ringOn(site.id);
    try {
      const gltf = await loader.loadAsync(site.src);
      if (this.loading.get(site.id)?.token !== token) {
        // Left the set, or the layer was removed, while the file came in.
        disposeObject(gltf.scene);
        if (!this.loading.has(site.id)) this.ringOff(site.id);
        return;
      }
      this.loading.delete(site.id);
      // Pose and building overrides can change while the same file is in flight. Reconcile keeps
      // that download, so place its result from the current catalog rather than the request's copy.
      site = this.sites.get(site.id)!;
      const modest = modestDevice();
      stripScenery(gltf.scene, site.interiorParts);
      const baked = isBaked(gltf.scene);
      if (!baked) saturate(gltf.scene, site.light.saturation);
      gltf.scene.traverse((node) => {
        if (node instanceof THREE.Mesh) node.castShadow = node.receiveShadow = !baked;
      });
      // On the visitor's map, one draw call per material instead of one per mesh (lib/model-merge). The base point
      // needs the parts, so it is measured first; the panel's preview, where the anchor part is edited, keeps them.
      const bases = new Map<string | null, ModelBase>();
      if (!this.everywhere) {
        gltf.scene.updateMatrixWorld(true);
        bases.set(site.placement.anchorNode ?? null, modelBase(gltf.scene, site.placement.anchorNode));
        mergeByMaterial(gltf.scene);
      }
      if (baked) settleBakedShadow(gltf.scene);
      const scene = new THREE.Scene();
      const group = new THREE.Group();
      group.add(gltf.scene);
      scene.add(group);
      const floor = shadowFloor();
      floor.visible = !baked;
      scene.add(floor);
      const entry: Entry = {
        site,
        scene,
        group,
        model: gltf.scene,
        baked,
        matrix: new THREE.Matrix4(),
        footprint: [],
        bases,
        shadow: null,
        sun: (() => {
          const sun = addMapLights(scene);
          if (modest) sun.shadow.mapSize.set(MODEST_SHADOW_MAP, MODEST_SHADOW_MAP);
          sun.castShadow = !baked;
          return sun;
        })(),
        floor,
        shadowDirty: true,
        fade: 0,
        fadeTo: 1,
      };
      themeMapLights(scene, this.theme);
      this.applyOpacity(entry.model);
      this.place(entry, site);
      this.loaded.set(site.id, entry);
      this.ringOff(site.id);
      this.map?.triggerRepaint();
      this.onChange();
    } catch {
      this.ringOff(site.id);
      if (this.loading.get(site.id)?.token !== token) return;
      this.loading.delete(site.id);
      // A model that cannot be read leaves the map as it is; its pin still opens the site.
      this.failed.set(site.id, site.src);
      this.onChange();
    }
  }

  /** Puts the model at its placement: base point from the model's parts, then heading, scale and altitude. */
  private place(entry: Entry, site: MapModelSite) {
    const p = site.placement;
    entry.site = site;
    // Measure the model on its own, then pose the group.
    entry.group.position.set(0, 0, 0);
    entry.group.rotation.set(0, 0, 0);
    entry.group.scale.setScalar(1);
    entry.model.position.set(0, 0, 0);
    entry.group.updateMatrixWorld(true);
    const base: ModelBase = entry.bases.get(p.anchorNode ?? null) ?? modelBase(entry.model, p.anchorNode);
    entry.model.position.copy(base.offset);
    entry.group.rotation.y = -THREE.MathUtils.degToRad(p.headingDeg);
    entry.group.scale.setScalar(p.scale);
    entry.group.position.y = p.altitudeM;
    entry.scene.updateMatrixWorld(true);
    const at = this.mercator.fromLngLat([p.lng, p.lat], 0);
    const k = at.meterInMercatorCoordinateUnits();
    entry.matrix
      .makeTranslation(at.x, at.y, at.z)
      .scale(new THREE.Vector3(k, -k, k))
      .multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
    entry.footprint = footprintRing(p, base.footprint);
    // The sun and its shadow: sized to the placed model (world metres of this scene), aimed at its façade.
    const box = new THREE.Box3().setFromObject(entry.group);
    const centre = box.getCenter(new THREE.Vector3());
    const radius = Math.max(4, box.getSize(new THREE.Vector3()).length() * 0.65);
    aimMapSun(entry.sun, mapSunAzimuth(p.frontDeg, site.light), centre, radius);
    entry.floor.scale.set(radius * 2, radius * 2, 1);
    entry.floor.position.set(centre.x, p.altitudeM + 0.02, centre.z);
    entry.shadowDirty = true;
    // The soft ground shadow turns and scales with the model, just above the map (§11.42).
    if (entry.shadow) {
      entry.group.remove(entry.shadow);
      entry.shadow.geometry.dispose();
      (entry.shadow.material as THREE.Material).dispose();
      entry.shadow = null;
    }
    if (!entry.baked && site.light.groundShadow > 0) {
      entry.shadow = groundShadow(
        base.footprint,
        0.03,
        site.light.groundShadow,
        { factor: 2, units: 8 },
      );
      entry.shadow.renderOrder = -1;
      entry.group.add(entry.shadow);
      entry.scene.updateMatrixWorld(true);
    }
  }
}

/**
 * The map's models: `update` follows the catalog and settings, `pick` names the site whose model is under a
 * screen point, `dispose` removes both layers.
 */
export interface MapModels {
  update(
    sites: HeritageSite[],
    settings: MapSettings,
    scenes: Record<string, CityScene>,
  ): void;
  pick(x: number, y: number): string | null;
  /** Relights the models for the page theme. */
  setTheme(theme: Theme): void;
  dispose(): void;
}

/**
 * Model layer and OSM building layer on one map, kept in step with the catalog; the models sit under the
 * site pins. Never throws into the map: a failing layer leaves the pins and base map as they were.
 */
export function createMapModels(
  map: MapLibreMap,
  mercator: typeof MercatorCoordinate,
): MapModels {
  let buildings: OsmBuildingLayer | null = null;
  const models = new MapModelLayer(mercator, () => buildings?.schedule());
  try {
    buildings = OsmBuildingLayer.install(map, () => models.hideRules());
    // Under the pins, whichever of them the map has by now.
    map.addLayer(models, pinLayersOn(map).at(-1));
  } catch {
    buildings?.dispose();
    buildings = null;
  }
  let last: Parameters<MapModels["update"]> | null = null;
  return {
    update(
      sites: HeritageSite[],
      settings: MapSettings,
      scenes: Record<string, CityScene>,
    ) {
      last = [sites, settings, scenes];
      const theme = currentTheme();
      models.setSettings(settings);
      models.setSites(
        sites.flatMap((s) =>
          s.model?.placement && s.model.placement.visible !== false
            ? [
                {
                  id: s.id,
                  // The baked file where there is one, the night file by night; a new source reloads it (`reconcile`).
                  src: mapModelSrc(s.model, theme),
                  ...(mapCloseSrc(s.model, theme) && { closeSrc: mapCloseSrc(s.model, theme) }),
                  placement: s.model.placement,
                  light: sceneOf(s, scenes).light,
                  ...(s.model.interiorParts?.length && {
                    interiorParts: s.model.interiorParts,
                  }),
                },
              ]
            : [],
        ),
      );
    },
    pick: (x, y) => models.pick(x, y),
    setTheme(theme) {
      models.setTheme(theme);
      if (last) this.update(...last);
    },
    dispose() {
      buildings?.dispose();
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
    },
  };
}
