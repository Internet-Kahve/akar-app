import {
  CITY_MARKER_MAX_ZOOM,
  defaultMapSettings,
  type CityScene,
  type HeritageSite,
  type MapPlacement,
  type MapSettings,
  type SceneLight,
} from "@akar/domain";
import type {
  CustomLayerInterface,
  CustomRenderMethodInput,
  Map as MapLibreMap,
  MercatorCoordinate,
} from "maplibre-gl";
import * as THREE from "three";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { modelBase, PRESENTATION_PARTS, type ModelBase } from "./model-anchor";
import { OsmBuildingLayer } from "./map-buildings";
import { pinLayersOn } from "./map-pins";
import { footprintRing, type HideRule, type Ring } from "./osm-buildings";
import {
  addMapLights,
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
  /** Soft ground shadow inside `group`; null when the city's light has none. */
  shadow: THREE.Mesh | null;
  /** The shadow-casting sun and the ground that shows its shadow, both in `scene` (world axes). */
  sun: THREE.DirectionalLight;
  floor: THREE.Mesh;
  /** The sun or the model moved: its shadow map is drawn again on the next frame, otherwise kept. */
  shadowDirty: boolean;
}

const LAYER_ID = "akar-models";
/** Models count as in view this far beyond the screen edge, as a share of the screen. */
const VIEW_MARGIN = 0.25;
/**
 * The map draws the building only: presentation files carry ground discs, trees and scale figures that
 * would cover the street and the OSM blocks around the model. Removed before the first render, so nothing
 * of theirs reached the GPU; materials may be shared with the building and are left alone.
 */
function stripScenery(root: THREE.Object3D) {
  const scenery: THREE.Object3D[] = [];
  root.traverse((node) => {
    if (node !== root && PRESENTATION_PARTS.test(node.name)) scenery.push(node);
  });
  for (const node of scenery) node.removeFromParent();
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
export class MapModelLayer implements CustomLayerInterface {
  readonly id = LAYER_ID;
  readonly type = "custom" as const;
  readonly renderingMode = "3d" as const;
  private map: MapLibreMap | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private decoder: DRACOLoader | null = null;
  private loader: GLTFLoader | null = null;
  private readonly camera = new THREE.Camera();
  private readonly projection = new THREE.Matrix4();
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

  private opacity = 1;

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
    this.renderer.toneMappingExposure = MAP_LIGHT.exposure;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    // Same decoder files as the story viewer (`public/draco`).
    this.decoder = new DRACOLoader()
      .setDecoderPath("/draco/")
      .setWorkerLimit(2);
    this.loader = new GLTFLoader().setDRACOLoader(this.decoder);
    map.on("moveend", this.reconcile);
    this.reconcile();
  }

  onRemove(map: MapLibreMap) {
    map.off("moveend", this.reconcile);
    this.loading.clear();
    for (const entry of this.loaded.values()) disposeObject(entry.scene);
    this.loaded.clear();
    this.decoder?.dispose();
    this.renderer?.dispose();
    this.decoder = this.loader = this.renderer = this.map = null;
    this.rendered = false;
  }

  setSites(sites: MapModelSite[]) {
    this.sites = new Map(sites.map((s) => [s.id, s]));
    this.reconcile();
  }

  setSettings(settings: MapSettings) {
    this.settings = settings;
    this.reconcile();
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
    if (!renderer || !this.map || !this.loaded.size) return;
    // Below the city threshold the map shows cities (globe view, §11.45), never models.
    const zoom = this.map.getZoom();
    if (zoom < this.settings.modelMinZoom || zoom < CITY_MARKER_MAX_ZOOM)
      return;
    // Mid globe-to-flat transition `mainMatrix` is the globe's; the Mercator fallback keeps models on the ground.
    const d = options.defaultProjectionData;
    this.projection.fromArray(
      d.projectionTransition > 0 ? d.fallbackMatrix : d.mainMatrix,
    );
    this.rendered = true;
    renderer.resetState();
    // The map may have resized its canvas since three.js saw it.
    renderer.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    for (const entry of this.loaded.values()) {
      this.camera.projectionMatrix.multiplyMatrices(
        this.projection,
        entry.matrix,
      );
      this.camera.projectionMatrixInverse
        .copy(this.camera.projectionMatrix)
        .invert();
      renderer.shadowMap.needsUpdate = entry.shadowDirty;
      entry.shadowDirty = false;
      renderer.render(entry.scene, this.camera);
    }
  }

  /** The site whose model is under the screen point (pixels from the map's top left), the nearest one on a hit. */
  pick(x: number, y: number): string | null {
    if (!this.map || !this.rendered) return null;
    const canvas = this.map.getCanvas();
    const ndcX = (x / canvas.clientWidth) * 2 - 1;
    const ndcY = 1 - (y / canvas.clientHeight) * 2;
    const raycaster = new THREE.Raycaster();
    let best: { id: string; distance: number } | null = null;
    for (const [id, entry] of this.loaded) {
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

  /** The models that should be on screen now: in view, nearest the centre, at most `maxVisibleModels`. */
  private select(map: MapLibreMap): Map<string, MapModelSite> {
    if (map.getZoom() < this.settings.modelMinZoom) return new Map();
    // The panel preview keeps its one model wherever the map is panned.
    if (this.everywhere)
      return new Map(
        [...this.sites.values()]
          .slice(0, Math.max(0, this.settings.maxVisibleModels))
          .map((site) => [site.id, site]),
      );
    const view = map.getBounds();
    const centre = map.getCenter();
    const padLng = (view.getEast() - view.getWest()) * VIEW_MARGIN;
    const padLat = (view.getNorth() - view.getSouth()) * VIEW_MARGIN;
    const cos = Math.cos((centre.lat * Math.PI) / 180);
    return new Map(
      [...this.sites.values()]
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
        .slice(0, Math.max(0, this.settings.maxVisibleModels))
        .map(({ site }) => [site.id, site]),
    );
  }

  private readonly reconcile = () => {
    const map = this.map;
    if (!map || !this.loader) return;
    const wanted = this.select(map);
    let changed = false;
    for (const [id, entry] of this.loaded) {
      const next = wanted.get(id);
      if (
        !next ||
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
      if (next?.src !== pending.src || !sameLight(next.light, pending.light))
        this.loading.delete(id);
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
    try {
      const gltf = await loader.loadAsync(site.src);
      if (this.loading.get(site.id)?.token !== token) {
        // Left the set, or the layer was removed, while the file came in.
        disposeObject(gltf.scene);
        return;
      }
      this.loading.delete(site.id);
      // Pose and building overrides can change while the same file is in flight. Reconcile keeps
      // that download, so place its result from the current catalog rather than the request's copy.
      site = this.sites.get(site.id)!;
      stripScenery(gltf.scene);
      saturate(gltf.scene, site.light.saturation);
      gltf.scene.traverse((node) => {
        if (node instanceof THREE.Mesh) node.castShadow = node.receiveShadow = true;
      });
      const scene = new THREE.Scene();
      const group = new THREE.Group();
      group.add(gltf.scene);
      scene.add(group);
      const floor = shadowFloor();
      scene.add(floor);
      const entry: Entry = {
        site,
        scene,
        group,
        model: gltf.scene,
        matrix: new THREE.Matrix4(),
        footprint: [],
        shadow: null,
        sun: addMapLights(scene),
        floor,
        shadowDirty: true,
      };
      this.applyOpacity(entry.model);
      this.place(entry, site);
      this.loaded.set(site.id, entry);
      this.map?.triggerRepaint();
      this.onChange();
    } catch {
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
    const base: ModelBase = modelBase(entry.model, p.anchorNode);
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
    if (site.light.groundShadow > 0) {
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
  return {
    update(
      sites: HeritageSite[],
      settings: MapSettings,
      scenes: Record<string, CityScene>,
    ) {
      models.setSettings(settings);
      models.setSites(
        sites.flatMap((s) =>
          s.model?.placement && s.model.placement.visible !== false
            ? [
                {
                  id: s.id,
                  src: s.model.src,
                  placement: s.model.placement,
                  light: sceneOf(s, scenes).light,
                },
              ]
            : [],
        ),
      );
    },
    pick: (x, y) => models.pick(x, y),
    dispose() {
      buildings?.dispose();
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
    },
  };
}
