"use client";
import { useEffect, useRef, useState } from "react";
import type {
  CameraPose,
  CityScene,
  PhotoCamera,
  PartCard,
  SiteModel,
  SiteSource,
} from "@akar/domain";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, MousePointerClick, X } from "lucide-react";
import * as THREE from "three";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { useI18n } from "./i18n";
import { PartCardDialog, partLabel } from "./part-card";
import { liftGroundLayers } from "../lib/ground-layers";
import { PRESENTATION_PARTS } from "../lib/model-anchor";
import { addModelLights, DETAIL_LIGHT, groundShadow, saturate, setSceneLights } from "../lib/scene-light";
import { spreadOrder, type PartPoint } from "../lib/part-order";
import { companionPlace, flowArc, FLOW_COIN_MS, FLOW_DRAW_MS, textSprite, type FlowCompanion } from "../lib/flow-companion";
import { currentTheme, subscribeTheme } from "../lib/theme";
import {
  fitHalfAngle,
  NO_FRAME,
  tourCarriesOn,
  type SceneFrame,
} from "../lib/story-scene";
import {
  forgetDownload,
  rememberDownload,
  toDownloadProgress,
  type DownloadProgress,
} from "../lib/model-download";

const TWEEN_MS = 900;
/** One cover group's rise; the next group follows once the one before has passed `LIFT_GAP`. */
const LIFT_MS = 700;
const LIFT_GAP = 0.35;
/** "İçini göster" raises a low camera to this elevation so the inside is visible. */
const INSIDE_ELEVATION = 58;
/**
 * Part glow: hover (mouse) and the open card's parts. Gold by day; blue by night, where the night files' lit windows
 * and minarets are already gold and a gold glow did not stand out (Muhammed, 2 Nov 2026).
 */
const GLOW = { day: new THREE.Color(0xf2c230), night: new THREE.Color(0x6fdcff) };
const HOVER_GLOW = 0.28;
const PICK_GLOW = 0.55;
/** A press that moves less than this (px) and ends sooner (ms) is a tap, not a drag. */
const TAP_SLOP = 6;
const TAP_MS = 600;

/** How long each tappable part lights up when the visitor asks to see them. */
const PART_PULSE_MS = 900;
/** Overlap keeps a full pass under 3.5 seconds, even on models with many cards. */
const PART_STAGGER_MS = 250;
/** Frees a loaded model's geometry, materials and textures. */
const disposeObject = (root: THREE.Object3D) =>
  root.traverse((item) => {
    if (!(item instanceof THREE.Mesh)) return;
    item.geometry.dispose();
    for (const material of Array.isArray(item.material) ? item.material : [item.material]) {
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
      material.dispose();
    }
  });

/**
 * `pose` turns the camera to a story sentence's view (absent = keep the current view). Model axes:
 * x east, y up, z south; azimuth 0 = from the north, clockwise. `interior` (story) lifts the
 * model's cover groups or sets them down; absent = leave them as the visitor left them.
 * `highlight` lights those parts (the "Eser hakkında" chapter being read); a tapped part's glow
 * replaces it until the card or name closes. `tour` (a story sentence about the whole building) turns the
 * camera slowly once it has reached the pose, until the visitor touches the model; the next such sentence on
 * the same pose carries on instead of going back. `frame` keeps the model out of what covers the canvas.
 * Parts: with `partCards`, only their parts respond to a tap and open the card (all of a card's
 * parts glow together); without cards every part shows its name. `onPick` (a site task waiting for
 * a tap) makes every part answer and sends the tapped part to it instead of opening a card. `scene`
 * is the city's light (§11.42), the same light the map uses. The stage around it (`ModelStage`) owns the
 * background and the loading card: `onProgress` reports the bytes read, `onSettled` says whether the model came.
 */
export default function ModelViewer({
  model,
  detail = false,
  name,
  scene: cityScene,
  pose,
  interior,
  highlight,
  tour,
  frame = NO_FRAME,
  partCards = [],
  onPick,
  sources = [],
  onProgress,
  onSettled,
  poseReader,
  views,
  onPoseChange,
  onInsideChange,
  companion,
}: {
  model: SiteModel;
  detail?: boolean;
  name: string;
  scene: CityScene;
  pose?: CameraPose;
  interior?: boolean;
  highlight?: string[];
  tour?: boolean;
  frame?: SceneFrame;
  partCards?: PartCard[];
  onPick?: (part: string) => void;
  sources?: SiteSource[];
  onProgress?: (progress: DownloadProgress) => void;
  onSettled?: (outcome: "ready" | "failed") => void;
  /**
   * Set once the model is drawn to a function that reads the camera as a pose (the panel's «Açıyı kaydet»): the part
   * last aimed at (null = the model's centre), the azimuth and elevation around it, and the distance against the one
   * at which the whole model fits. Back to null when the viewer goes.
   */
  poseReader?: { current: (() => CameraPose) | null };
  /**
   * Gallery photographs with an angle on this model (the site page): ← → beside «İçini göster» turn the camera to
   * each one's view and show the photograph small beside it, to compare; ✕ goes back to where the visitor was.
   */
  views?: Array<{ id: string; src: string; alt: string; title: string; camera: PhotoCamera }>;
  /** The visitor (the panel's editor) let go of the model after turning or zooming it: the view as a pose. */
  onPoseChange?: (pose: CameraPose) => void;
  /** The visitor opened or closed the model with «İçini göster». */
  onInsideChange?: (open: boolean) => void;
  /** A sentence about the waqf's income: the other building of the road beside this one, with the gold road. */
  companion?: FlowCompanion;
}) {
  const { t } = useI18n();
  const host = useRef<HTMLDivElement>(null);
  const aim = useRef<((pose: CameraPose) => void) | null>(null);
  const lift = useRef<((open: boolean, raise: boolean) => void) | null>(null);
  const [showingParts, setShowingParts] = useState(false);
  const select = useRef<((parts: string[]) => void) | null>(null);
  const pulse = useRef<((levels: Map<string, number>) => void) | null>(null);
  /** Centre of the given parts in the model's space (null when none is in the file): spreads the show-parts order. */
  const centreOf = useRef<((parts: string[]) => PartPoint) | null>(null);
  const pulseFrame = useRef(0);
  /** The drawn model's stage, for what is added to it later (the income road's companion). */
  const stage = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    render: () => void;
    decoder: DRACOLoader;
    sphere: number;
    ground: number;
    height: number;
  } | null>(null);
  const [stageReady, setStageReady] = useState(0);
  useEffect(() => () => cancelAnimationFrame(pulseFrame.current), [model.src]);
  // The income road (lib/flow-companion): the companion beside the site, the gold tube drawn from the one that earns
  // to the one it keeps with coins along it, its label at the middle, and the camera stepped back to take both in.
  // All of it goes, and the camera goes back, when the sentence changes.
  const companionKey = companion ? JSON.stringify(companion) : "";
  useEffect(() => {
    const st = stage.current;
    if (!st || !companionKey) return;
    const road = JSON.parse(companionKey) as FlowCompanion;
    const { scene, camera, controls, render } = st;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const group = new THREE.Group();
    scene.add(group);
    const look = controls.target.clone().sub(camera.position);
    look.y = 0;
    if (look.lengthSq() < 1e-6) look.set(0, 0, -1);
    look.normalize();
    const right = new THREE.Vector3().crossVectors(look, new THREE.Vector3(0, 1, 0)).normalize();
    const place = companionPlace(st.sphere, st.ground, right);
    const holder = new THREE.Group();
    holder.position.set(place.centre.x, st.ground, place.centre.z);
    group.add(holder);
    const owned: { dispose: () => void }[] = [];
    let disposed = false,
      frame = 0,
      roadDrawn = false;
    // The camera: back along its own direction until both stand in view, looking at their middle.
    const before = { position: camera.position.clone(), target: controls.target.clone() };
    // A little above the buildings' middle: the road arcs over them.
    const goalTarget = new THREE.Vector3(place.middle.x, st.ground + st.height * 0.5, place.middle.z);
    const fov = THREE.MathUtils.degToRad(camera.fov) / 2;
    const away = before.position.clone().sub(before.target).normalize();
    away.y = Math.max(away.y, 0.42);
    away.normalize();
    const goalPosition = goalTarget.clone().add(away.multiplyScalar((place.span / Math.sin(fov * Math.min(1, camera.aspect))) * 1.3));
    const cameraStart = performance.now();
    const drawRoad = (top: number) => {
      if (disposed || roadDrawn) return;
      roadDrawn = true;
      const there = new THREE.Vector3(place.centre.x, top, place.centre.z);
      const here = new THREE.Vector3(0, st.ground + st.height * 0.85, 0);
      const curve = flowArc(road.incoming ? there : here, road.incoming ? here : there, st.sphere * 0.7);
      const SEG = 64, RAD = 6;
      const tube = new THREE.TubeGeometry(curve, SEG, st.sphere * 0.012, RAD, false);
      const rim = new THREE.TubeGeometry(curve, SEG, st.sphere * 0.02, RAD, false);
      const gold = new THREE.MeshBasicMaterial({ color: "#E3BC5E" });
      const ink = new THREE.MeshBasicMaterial({ color: "#A8781F", side: THREE.BackSide });
      const coinGeo = new THREE.SphereGeometry(st.sphere * 0.024, 10, 6);
      const coinMat = new THREE.MeshBasicMaterial({ color: "#FFF1B8" });
      const coins = [0, 1, 2].map(() => new THREE.Mesh(coinGeo, coinMat));
      coins.forEach((c) => (c.visible = false));
      const label = textSprite(road.label, st.sphere * 0.09);
      label.position.copy(curve.getPoint(0.5)).add(new THREE.Vector3(0, st.sphere * 0.09, 0));
      label.visible = false;
      group.add(new THREE.Mesh(rim, ink), new THREE.Mesh(tube, gold), ...coins, label);
      owned.push(tube, rim, gold, ink, coinGeo, coinMat, label.material.map!, label.material);
      const start = performance.now();
      const step = (now: number) => {
        if (disposed) return;
        const k = reduced ? 1 : Math.min(1, (now - start) / FLOW_DRAW_MS);
        const n = Math.floor(k * SEG) * RAD * 6;
        tube.setDrawRange(0, n);
        rim.setDrawRange(0, n);
        label.visible = k >= 0.5;
        if (k >= 1 && !reduced)
          coins.forEach((c, i) => {
            c.visible = true;
            c.position.copy(curve.getPoint(((now - start - FLOW_DRAW_MS) / FLOW_COIN_MS + i / 3) % 1));
          });
        render();
        if (!reduced) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };
    const showPhoto = () => {
      if (!road.photo) {
        // A place outside the catalogue, with no photograph yet (Koza Han's income to Istanbul): its name stands at
        // the road's end. The panel can give it a photograph.
        const sign = textSprite(road.name, st.sphere * 0.1);
        sign.position.y = place.sphere * 0.9;
        holder.add(sign);
        owned.push(sign.material.map!, sign.material);
        return drawRoad(st.ground + place.sphere * 0.75);
      }
      new THREE.TextureLoader().load(
        road.photo,
        (texture) => {
          if (disposed) return texture.dispose();
          texture.colorSpace = THREE.SRGBColorSpace;
          const image = texture.image as { width: number; height: number };
          const h = place.sphere * 1.2;
          const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
          sprite.scale.set((h * image.width) / image.height, h, 1);
          sprite.position.y = h / 2;
          holder.add(sprite);
          owned.push(texture, sprite.material);
          drawRoad(st.ground + h);
        },
        undefined,
        () => drawRoad(st.ground + place.sphere),
      );
    };
    if (road.src)
      new GLTFLoader().setDRACOLoader(st.decoder).load(
        road.src,
        (gltf) => {
          if (disposed) return disposeObject(gltf.scene);
          const other = gltf.scene;
          other.traverse((item) => {
            for (let node: THREE.Object3D | null = item; node && node !== other; node = node.parent)
              if (/^Yer_Golgesi/.test(node.name) || PRESENTATION_PARTS.test(node.name)) item.visible = false;
          });
          const box = new THREE.Box3();
          other.traverse((item) => {
            if (item instanceof THREE.Mesh && item.visible) box.expandByObject(item);
          });
          if (box.isEmpty()) box.setFromObject(other);
          const size = box.getSize(new THREE.Vector3()),
            mid = box.getCenter(new THREE.Vector3());
          const scale = place.sphere / (size.length() / 2 || 1);
          other.scale.setScalar(scale);
          other.position.set(-mid.x * scale, -box.min.y * scale, -mid.z * scale);
          holder.add(other);
          owned.push({ dispose: () => disposeObject(other) });
          drawRoad(st.ground + size.y * scale);
        },
        undefined,
        showPhoto,
      );
    else showPhoto();
    // Camera: eased over 1.2 s (at once with reduced motion), the road appears as it goes.
    const glide = (now: number) => {
      if (disposed) return;
      const t = reduced ? 1 : Math.min(1, (now - cameraStart) / 1200);
      const k = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      camera.position.lerpVectors(before.position, goalPosition, k);
      controls.target.lerpVectors(before.target, goalTarget, k);
      controls.maxDistance = Math.max(controls.maxDistance, goalPosition.distanceTo(goalTarget) * 1.3);
      controls.update();
      render();
      if (t < 1) requestAnimationFrame(glide);
    };
    requestAnimationFrame(glide);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      scene.remove(group);
      owned.forEach((o) => o.dispose());
      camera.position.copy(before.position);
      controls.target.copy(before.target);
      controls.update();
      render();
    };
  }, [companionKey, stageReady]);
  const spin = useRef<((on: boolean) => void) | null>(null);
  const reframe = useRef<(() => void) | null>(null);
  /** The pose the running tour started from; empty once it stopped. */
  const tourPose = useRef("");
  /** The sentence pose the camera last went to; a sentence without its own camera reuses it and keeps the visitor's view. */
  const aimedPose = useRef<CameraPose | undefined>(undefined);
  // The canvas label follows the site language without rebuilding the renderer.
  const canvasLabel = t("site.modelCanvas", { name });
  const labelRef = useRef(canvasLabel);
  labelRef.current = canvasLabel;
  useEffect(() => {
    host.current?.querySelector("canvas")?.setAttribute("aria-label", canvasLabel);
  }, [canvasLabel]);
  const tourRef = useRef(tour);
  tourRef.current = tour;
  const frameRef = useRef(frame);
  frameRef.current = frame;
  const poseRef = useRef(pose);
  poseRef.current = pose;
  const interiorRef = useRef(interior);
  interiorRef.current = interior;
  const highlightRef = useRef(highlight);
  highlightRef.current = highlight;
  const cardsRef = useRef(partCards);
  cardsRef.current = partCards;
  const poseChangeRef = useRef(onPoseChange);
  poseChangeRef.current = onPoseChange;
  const insideChangeRef = useRef(onInsideChange);
  insideChangeRef.current = onInsideChange;
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const progressRef = useRef(onProgress);
  progressRef.current = onProgress;
  const settledRef = useRef(onSettled);
  settledRef.current = onSettled;
  /** The tapped part: its card, or only its name on a site without cards. */
  const [picked, setPicked] = useState<{ part: string; card?: PartCard } | null>(null);
  const partsKey = JSON.stringify([model.parts, partCards.map((c) => c.parts)]);
  /** Why there is no model, in the visitor's words; empty while it loads (the stage's card shows that) and once it is drawn. */
  /** null = the model has no usable cover groups (no button). */
  const [inside, setInside] = useState<boolean | null>(null);
  // The photograph whose view is shown (← →); null = the visitor's own view.
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const [viewLarge, setViewLarge] = useState(false);
  const readPose = useRef<(() => CameraPose) | null>(null);
  // Where the visitor was before the first arrow: ✕ goes back there.
  const beforeViews = useRef<{ pose: CameraPose | null; inside: boolean } | null>(null);
  const heading = model.placement?.headingDeg ?? 0;
  const groupsKey = JSON.stringify(model.coverGroups ?? []);
  const lightKey = JSON.stringify(cityScene.light);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let disposed = false;
    let renderer: THREE.WebGLRenderer | undefined;
    let controls: OrbitControls | undefined;
    let decoder: DRACOLoader | undefined;
    let observer: ResizeObserver | undefined;
    let object: THREE.Group | undefined;
    let cancelTween = () => {};
    let cancelLift = () => {};
    let detachPointer = () => {};
    let unfollowTheme = () => {};
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = DETAIL_LIGHT[currentTheme()].exposure;
        renderer.shadowMap.enabled = true;
        // Three r186 removed PCFSoftShadowMap; its supported replacement is PCF.
        renderer.shadowMap.type = THREE.PCFShadowMap;
      }
      renderer.domElement.setAttribute("aria-label", labelRef.current);
      renderer.domElement.setAttribute("role", "img");
      element.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(detail ? 38 : 40, 1, 0.01, 10000);
      controls = new OrbitControls(camera, renderer.domElement);
      // As the prototype's viewer: left drag turns, right drag (two fingers) moves, the wheel (pinch) zooms; turning
      // eases out after the hand lets go.
      controls.enableDamping = true;
      controls.dampingFactor = 0.09;
      controls.maxPolarAngle = Math.PI * 0.49;
      const render = () => {
        if (!disposed) renderer!.render(scene, camera);
      };
      controls.addEventListener("change", render);
      // Damped turning goes on after the hand lets go: the controls are stepped each frame until they come to rest.
      // At most two seconds: by then 0.91¹²⁰ of the motion is left, far below a pixel, though the controls still
      // report a change on a large model.
      let dampFrame = 0,
        dampLeft = 0;
      const damp = () => {
        dampFrame = !disposed && dampLeft-- > 0 && controls!.update() ? requestAnimationFrame(damp) : 0;
      };
      controls.addEventListener("start", () => cancelAnimationFrame(dampFrame));
      controls.addEventListener("end", () => {
        cancelAnimationFrame(dampFrame);
        dampLeft = 120;
        dampFrame = requestAnimationFrame(damp);
      });
      // Only a gesture ends a control: a camera moved by code (a sentence's pose) reports nothing.
      controls.addEventListener("end", () => {
        const pose = readPose.current?.();
        if (pose) poseChangeRef.current?.(pose);
      });
      // The canvas shows a window of a larger view, so the model's centre lands in the part left free.
      const applyFrame = () => {
        const { width, height } = element.getBoundingClientRect();
        if (!width || !height) return;
        const { left, bottom } = frameRef.current;
        if (left || bottom)
          camera.setViewOffset(width + left, height + bottom, 0, bottom, width, height);
        else {
          camera.clearViewOffset();
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        }
      };
      reframe.current = () => {
        applyFrame();
        render();
      };
      observer = new ResizeObserver(() => {
        const { width, height } = element.getBoundingClientRect();
        if (!width || !height) return;
        renderer!.setSize(width, height);
        reframe.current?.();
      });
      let frame = 0;
      let tweening = false;
      let turnFrame = 0;
      let turning = false;
      let turnWanted = false;
      let turnedAt = 0;
      const stopTurn = () => {
        turning = false;
        controls!.autoRotate = false;
        cancelAnimationFrame(turnFrame);
        element.dataset.tour = "off";
      };
      const turn = (now: number) => {
        // Clamped: a tab back from the background does not jump the model by the whole hidden time.
        controls!.update(Math.min(0.064, Math.max(0, (now - turnedAt) / 1000)));
        turnedAt = now;
        if (turning && !disposed) turnFrame = requestAnimationFrame(turn);
      };
      const startTurn = () => {
        // Not before the model is drawn: aim is set once it loads.
        if (
          turning ||
          tweening ||
          !turnWanted ||
          !aim.current ||
          matchMedia("(prefers-reduced-motion: reduce)").matches
        )
          return;
        turning = true;
        controls!.autoRotate = true;
        turnedAt = performance.now();
        turnFrame = requestAnimationFrame(turn);
        element.dataset.tour = "on";
      };
      spin.current = (on) => {
        turnWanted = on;
        if (on) startTurn();
        else stopTurn();
      };
      cancelTween = () => {
        cancelAnimationFrame(frame);
        cancelAnimationFrame(turnFrame);
      };
      // A drag stops the camera where the visitor took it.
      controls.addEventListener("start", () => {
        cancelAnimationFrame(frame);
        tweening = false;
        turnWanted = false;
        tourPose.current = "";
        stopTurn();
      });
      observer.observe(element);
      decoder = new DRACOLoader().setDecoderPath("/draco/").setWorkerLimit(2);
      new GLTFLoader().setDRACOLoader(decoder).load(
        model.src,
        (gltf) => {
          forgetDownload(model.src);
          if (disposed) {
            disposeObject(gltf.scene);
            return;
          }
          object = gltf.scene;
          const light: CityScene["light"] = JSON.parse(lightKey);
          saturate(object, light.saturation);
          // Turned like on the map, so a pose's azimuth (0 = from the north) means the real north.
          object.rotation.y = -THREE.MathUtils.degToRad(heading);
          object.updateMatrixWorld(true);
          const box = new THREE.Box3();
          {
            object.traverse(item => {
              if (!(item instanceof THREE.Mesh)) return;
              item.castShadow = item.receiveShadow = true;
              for (let node: THREE.Object3D | null = item; node && node !== object; node = node.parent) {
                if (/^Yer_Golgesi/.test(node.name)) { item.visible = false; return; }
                if (PRESENTATION_PARTS.test(node.name)) return;
              }
              box.expandByObject(item);
            });
          }
          // Coplanar ground surfaces keep one drawing order from every angle (no flicker on the courtyard).
          liftGroundLayers(object);
          if (box.isEmpty()) box.setFromObject(object);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          if (detail) center.y = box.min.y + size.y * 0.25;
          object.position.sub(center);
          {
            const R = size.length() / 2 * 1.3;
            addModelLights(scene, R, model.placement?.frontDeg ?? 180, currentTheme());
            // A theme switch relights the open model in place, without reloading it.
            unfollowTheme = subscribeTheme((theme) => {
              setSceneLights(scene, DETAIL_LIGHT[theme]);
              renderer!.toneMappingExposure = DETAIL_LIGHT[theme].exposure;
              render();
            });
          }
          scene.add(object);
          if (light.groundShadow > 0) {
            // Under the building only: the presentation ground disc and trees do not size it.
            object.updateMatrixWorld(true);
            const toModel = object.matrixWorld.clone().invert();
            const building = new THREE.Box3();
            object.traverse((item) => {
              if (!(item instanceof THREE.Mesh)) return;
              for (
                let node: THREE.Object3D | null = item;
                node && node !== object;
                node = node.parent
              )
                if (PRESENTATION_PARTS.test(node.name)) return;
              building.union(
                new THREE.Box3().setFromObject(item).applyMatrix4(toModel),
              );
            });
            if (!building.isEmpty()) {
              const shadow = groundShadow(
                {
                  minX: building.min.x,
                  maxX: building.max.x,
                  minZ: building.min.z,
                  maxZ: building.max.z,
                },
                building.min.y + 0.05,
                light.groundShadow,
                { factor: -6, units: -30 },
              );
              shadow.renderOrder = 1;
              object.add(shadow);
            }
          }
          const root = object;
          const radius = Math.max(size.x, size.y, size.z, 1);
          const sphere = size.length() / 2 || 1;
          // As the prototype: a near plane this far out keeps enough depth precision for surfaces millimetres apart.
          camera.near = sphere / 100;
          camera.far = sphere * 30;
          camera.position.set(radius * 1.15, radius * 0.9, radius * 1.15);
          camera.updateProjectionMatrix();
          controls!.minDistance = radius * 0.35;
          controls!.maxDistance = radius * 4;
          controls!.target.set(0, 0, 0);
          controls!.update();
          stage.current = {
            scene, camera, controls: controls!, render, decoder: decoder!, sphere,
            ground: box.min.y - center.y, height: size.y,
          };
          setStageReady((n) => n + 1);
          // The part the camera last went to: a pose read back keeps it, as the camera turns around it.
          let aimedTarget: string | null = null;
          const fitDistance = () => {
            const { width, height } = element.getBoundingClientRect();
            return sphere / Math.sin(fitHalfAngle(camera.fov, width, height, frameRef.current));
          };
          readPose.current = () => {
              const offset = camera.position.clone().sub(controls!.target);
              const length = offset.length() || 1;
              const round = (x: number, step: number) => Math.round(x / step) * step;
              return {
                target: aimedTarget,
                azimuthDeg: round((THREE.MathUtils.radToDeg(Math.atan2(offset.x, -offset.z)) + 360) % 360, 1),
                elevationDeg: round(THREE.MathUtils.radToDeg(Math.asin(offset.y / length)), 1),
                distance: round(length / fitDistance(), 0.01),
              };
            };
          if (poseReader) poseReader.current = readPose.current;
          aim.current = (next) => {
            aimedTarget = next.target;
            // Distance at which the bounding sphere fits the narrower field of view of the free part.
            const fit = fitDistance();
            controls!.maxDistance = Math.max(radius * 4, fit * 1.6);
            const part = next.target ? root.getObjectByName(next.target) : undefined;
            const goal = part
              ? new THREE.Box3().setFromObject(part).getCenter(new THREE.Vector3())
              : new THREE.Vector3();
            const az = THREE.MathUtils.degToRad(next.azimuthDeg);
            const el = THREE.MathUtils.degToRad(Math.max(5, Math.min(85, next.elevationDeg)));
            const d = fit * next.distance;
            const to = goal.clone().add(
              new THREE.Vector3(
                Math.sin(az) * Math.cos(el) * d,
                Math.sin(el) * d,
                -Math.cos(az) * Math.cos(el) * d,
              ),
            );
            cancelAnimationFrame(frame);
            stopTurn();
            if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
              camera.position.copy(to);
              controls!.target.copy(goal);
              controls!.update();
              render();
              return;
            }
            tweening = true;
            const from = camera.position.clone();
            const fromTarget = controls!.target.clone();
            const start = performance.now();
            const step = (now: number) => {
              const t = Math.min(1, (now - start) / TWEEN_MS);
              const k = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
              camera.position.lerpVectors(from, to, k);
              controls!.target.lerpVectors(fromTarget, goal, k);
              controls!.update();
              render();
              if (disposed) return;
              if (t < 1) frame = requestAnimationFrame(step);
              else {
                tweening = false;
                startTurn();
              }
            };
            frame = requestAnimationFrame(step);
          };
          // Parts that answer a tap: a card's parts, or every part when the site has no cards.
          const [partNames, cardParts] = JSON.parse(partsKey) as [string[], string[][]];
          const known = new Set(partNames);
          const tappable = cardParts.length ? new Set(cardParts.flat()) : known;
          /** Meshes of each part, each on its own material copy so a glow never spreads to a part sharing one. Every part can glow (a chapter's focus); only `tappable` ones answer a tap. */
          const meshesOf = new Map<string, THREE.Mesh[]>();
          for (const part of known) {
            const node = root.getObjectByName(part);
            if (!node) continue;
            const meshes: THREE.Mesh[] = [];
            node.traverse((item) => {
              if (!(item instanceof THREE.Mesh)) return;
              item.material = Array.isArray(item.material)
                ? item.material.map((m: THREE.Material) => m.clone())
                : item.material.clone();
              meshes.push(item);
            });
            meshesOf.set(part, meshes);
          }
          /** Each material's own emissive (lit) or colour (unlit), before any glow. */
          const baseColour = new WeakMap<THREE.Material, THREE.Color>();
          let hovered: string[] = [];
          let selected: string[] = [];
          let pulses = new Map<string, number>();
          // Applied to the meshes' current materials: "İçini göster" swaps in its own copies later.
          // The night files are unlit (KHR_materials_unlit → MeshBasicMaterial): no emissive, so their colour takes
          // the glow, or nothing lit up by night.
          const glow = () => {
            const night = currentTheme() === "night";
            // By night the glow is stronger: the unlit night colours are dark and a light blue at day strength is faint.
            const tint = GLOW[night ? "night" : "day"];
            for (const [part, meshes] of meshesOf) {
              const level = Math.max(pulses.get(part) ?? 0, selected.includes(part) ? PICK_GLOW : hovered.includes(part) ? HOVER_GLOW : 0);
              for (const mesh of meshes)
                for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
                  const colour =
                    m instanceof THREE.MeshStandardMaterial ? m.emissive : m instanceof THREE.MeshBasicMaterial ? m.color : null;
                  if (!colour) continue;
                  if (!baseColour.has(m)) baseColour.set(m, colour.clone());
                  colour.copy(baseColour.get(m)!).lerp(tint, night ? Math.min(0.85, level * 1.5) : level);
                }
            }
            render();
          };
          const groupOf = (part: string) =>
            pickRef.current
              ? [part]
              : cardParts.length
                ? (cardParts.find((parts) => parts.includes(part)) ?? [])
                : [part];
          const ray = new THREE.Raycaster();
          const partAt = (event: PointerEvent) => {
            const rect = renderer!.domElement.getBoundingClientRect();
            ray.setFromCamera(
              new THREE.Vector2(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -((event.clientY - rect.top) / rect.height) * 2 + 1,
              ),
              camera,
            );
            for (const hit of ray.intersectObject(root, true)) {
              // Lifted cover groups are hidden or fading: look through them.
              let node: THREE.Object3D | null = hit.object;
              let shown = true;
              let part: string | undefined;
              for (; node && node !== root; node = node.parent) {
                if (!node.visible) shown = false;
                if (!part && known.has(node.name)) part = node.name;
              }
              // Faded by the lift, not see-through by nature: glass (the open dome's) still answers a tap.
              const materials = (hit.object as THREE.Mesh).material;
              const faded = (Array.isArray(materials) ? materials : [materials]).every(
                (m: THREE.Material) => (m.userData.akarLift ?? 0) > 0.5,
              );
              if (!shown || faded) continue;
              // The nearest visible surface decides; a part that does not answer blocks the ones behind it.
              return part && (pickRef.current || tappable.has(part)) ? part : undefined;
            }
            return undefined;
          };
          let press: { x: number; y: number; at: number } | null = null;
          const canvas = renderer!.domElement;
          const onDown = (e: PointerEvent) => {
            press = { x: e.clientX, y: e.clientY, at: performance.now() };
          };
          const onUp = (e: PointerEvent) => {
            const tap =
              press &&
              Math.hypot(e.clientX - press.x, e.clientY - press.y) < TAP_SLOP &&
              performance.now() - press.at < TAP_MS;
            press = null;
            if (!tap) return;
            const part = partAt(e);
            if (!part) return;
            if (pickRef.current) {
              // Pick mode (site task): the tap goes to the task, no card opens; the tapped name shows briefly.
              selected = [part];
              glow();
              setPicked({ part });
              pickRef.current(part);
              return;
            }
            const card = cardsRef.current.find((c) => c.parts.includes(part));
            selected = groupOf(part);
            glow();
            setPicked(card ? { part, card } : { part });
          };
          let hoverFrame = 0;
          const onMove = (e: PointerEvent) => {
            if (e.pointerType !== "mouse" || e.buttons) return;
            cancelAnimationFrame(hoverFrame);
            hoverFrame = requestAnimationFrame(() => {
              const part = partAt(e);
              const next = part ? groupOf(part) : [];
              canvas.style.cursor = part ? "pointer" : "";
              if (next.join() === hovered.join()) return;
              hovered = next;
              glow();
            });
          };
          const onLeave = () => {
            cancelAnimationFrame(hoverFrame);
            canvas.style.cursor = "";
            if (!hovered.length) return;
            hovered = [];
            glow();
          };
          canvas.addEventListener("pointerdown", onDown);
          canvas.addEventListener("pointerup", onUp);
          canvas.addEventListener("pointermove", onMove);
          canvas.addEventListener("pointerleave", onLeave);
          detachPointer = () => {
            cancelAnimationFrame(hoverFrame);
            canvas.removeEventListener("pointerdown", onDown);
            canvas.removeEventListener("pointerup", onUp);
            canvas.removeEventListener("pointermove", onMove);
            canvas.removeEventListener("pointerleave", onLeave);
          };
          pulse.current = (levels) => { pulses = levels; glow(); };
          const centres = new Map<string, THREE.Vector3>();
          for (const part of meshesOf.keys()) {
            const node = root.getObjectByName(part);
            if (node) centres.set(part, new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3()));
          }
          centreOf.current = (parts) => {
            const found = parts.flatMap((part) => centres.get(part) ?? []);
            if (!found.length) return null;
            const sum = found.reduce((a, b) => a.clone().add(b), new THREE.Vector3()).divideScalar(found.length);
            return { x: sum.x, y: sum.y, z: sum.z };
          };
          select.current = (parts) => {
            selected = parts;
            glow();
          };
          // "İçini göster": every group must name at least one part of this model, else no button.
          const groups = (JSON.parse(groupsKey) as string[][]).map((names) =>
            names.flatMap((n) => root.getObjectByName(n) ?? []),
          );
          if (groups.length && groups.every((g) => g.length)) {
            const rise = size.y * 0.45;
            const parts = groups.map((g) =>
              g.map((node) => ({
                node,
                y: node.position.y,
                // World rise in the node's parent units.
                dy: rise / (node.parent?.getWorldScale(new THREE.Vector3()).y || 1),
              })),
            );
            // Lifted groups fade out as they rise; their own material copies, so other parts sharing one stay opaque.
            const fading = groups.map((g) => {
              const list: { material: THREE.Material; opacity: number; transparent: boolean }[] = [];
              for (const node of g)
                node.traverse((item) => {
                  if (!(item instanceof THREE.Mesh)) return;
                  const own = (Array.isArray(item.material) ? item.material : [item.material]).map((m: THREE.Material) => {
                    const copy = m.clone();
                    list.push({ material: copy, opacity: copy.opacity, transparent: copy.transparent });
                    return copy;
                  });
                  item.material = Array.isArray(item.material) ? own : own[0]!;
                });
              return list;
            });
            const progress = groups.map(() => 0);
            let goal = 0;
            let liftFrame = 0;
            let last = 0;
            cancelLift = () => cancelAnimationFrame(liftFrame);
            const place = () =>
              parts.forEach((g, i) => {
                const t = progress[i]!;
                // easeOutBack: a slight overshoot as the group settles.
                const k = t === 0 ? 0 : 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2;
                for (const p of g) {
                  p.node.position.y = p.y + p.dy * k;
                  p.node.visible = t < 0.999;
                }
                for (const f of fading[i]!) {
                  const transparent = t > 0 || f.transparent;
                  if (f.material.transparent !== transparent) {
                    f.material.transparent = transparent;
                    f.material.needsUpdate = true;
                  }
                  f.material.opacity = f.opacity * (1 - t);
                  f.material.depthWrite = t === 0;
                  // How far the group has lifted; taps look through a group more than half way gone.
                  f.material.userData.akarLift = t;
                }
              });
            const step = (now: number) => {
              const dt = Math.min(64, now - last) / LIFT_MS;
              last = now;
              let moving = false;
              progress.forEach((t, i) => {
                // Up: the top group first; down: the bottom group settles first.
                const ready =
                  goal === 1
                    ? i === 0 || progress[i - 1]! >= LIFT_GAP
                    : i === progress.length - 1 || progress[i + 1]! <= 1 - LIFT_GAP;
                if (t === goal) return;
                moving = true;
                if (ready)
                  progress[i] = goal === 1 ? Math.min(1, t + dt) : Math.max(0, t - dt);
              });
              place();
              render();
              if (moving && !disposed) liftFrame = requestAnimationFrame(step);
            };
            lift.current = (open, raise) => {
              goal = open ? 1 : 0;
              cancelAnimationFrame(liftFrame);
              if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
                progress.fill(goal);
                place();
                render();
              } else {
                last = performance.now();
                liftFrame = requestAnimationFrame(step);
              }
              // A low camera cannot see over the walls: rise, keeping the visitor's side.
              const offset = camera.position.clone().sub(controls!.target);
              const elevation = THREE.MathUtils.radToDeg(
                Math.asin(offset.y / (offset.length() || 1)),
              );
              if (open && raise && elevation < 45)
                aim.current?.({
                  target: null,
                  azimuthDeg: THREE.MathUtils.radToDeg(Math.atan2(offset.x, -offset.z)),
                  elevationDeg: INSIDE_ELEVATION,
                  distance: 0.95,
                });
            };
            const open = interiorRef.current ?? false;
            if (open) lift.current(true, false);
            setInside(open);
          }
          if (highlightRef.current?.length) select.current(highlightRef.current);
          reframe.current?.();
          if (poseRef.current) aim.current(poseRef.current);
          else if (detail) {
            const { width, height } = element.getBoundingClientRect();
            const fit = sphere / Math.sin(fitHalfAngle(camera.fov, width, height, frameRef.current));
            const d = Math.min(sphere * 4, fit * 0.95);
            const az = THREE.MathUtils.degToRad(30), el = THREE.MathUtils.degToRad(28);
            camera.position.set(Math.sin(az)*Math.cos(el)*d, Math.sin(el)*d, -Math.cos(az)*Math.cos(el)*d);
            controls!.target.set(0,0,0);
            controls!.update();
          }
          aimedPose.current = poseRef.current;
          spin.current?.(!!tourRef.current);
          tourPose.current = tourRef.current ? JSON.stringify(poseRef.current ?? null) : "";
          render();
          settledRef.current?.("ready");
        },
        // The bytes the browser has read of the response, for the stage's loading card (§11.49).
        (event) => {
          const next = toDownloadProgress(event);
          rememberDownload(model.src, next);
          if (!disposed) progressRef.current?.(next);
        },
        () => {
          forgetDownload(model.src);
          if (disposed) return;
          settledRef.current?.("failed");
        },
      );
    } catch {
      settledRef.current?.("failed");
    }
    return () => {
      disposed = true;
      aim.current = null;
      stage.current = null;
      if (poseReader) poseReader.current = null;
      readPose.current = null;
      beforeViews.current = null;
      setViewIndex(null);
      lift.current = null;
      select.current = null;
      pulse.current = null;
      centreOf.current = null;
      cancelAnimationFrame(pulseFrame.current);
      spin.current = null;
      reframe.current = null;
      setInside(null);
      setPicked(null);
      cancelTween();
      cancelLift();
      detachPointer();
      unfollowTheme();
      observer?.disconnect();
      controls?.dispose();
      decoder?.dispose();
      if (object) disposeObject(object);
      renderer?.dispose();
      renderer?.forceContextLoss();
      renderer?.domElement.remove();
    };
  }, [model.src, name, heading, model.placement?.frontDeg, groupsKey, partsKey, lightKey, detail]);
  // Before the pose: a sentence's camera is worked out for the frame of that sentence.
  useEffect(() => {
    reframe.current?.();
  }, [frame.left, frame.bottom]);
  useEffect(() => {
    const key = JSON.stringify(pose ?? null);
    if (pose && pose !== aimedPose.current && !tourCarriesOn(tour, tourPose.current, key))
      aim.current?.(pose);
    aimedPose.current = pose;
    spin.current?.(!!tour);
    tourPose.current = tour ? key : "";
  }, [pose, tour]);
  const highlightKey = (highlight ?? []).join("|");
  useEffect(() => {
    select.current?.(highlightRef.current ?? []);
  }, [highlightKey]);
  useEffect(() => {
    if (interior === undefined || !lift.current) return;
    lift.current(interior, false);
    setInside(interior);
  }, [interior]);
  // A bare part name fades after a moment; a card stays until closed.
  useEffect(() => {
    if (!picked || picked.card) return;
    const timer = setTimeout(() => {
      select.current?.(highlightRef.current ?? []);
      setPicked(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, [picked]);
  const insideButton = inside !== null && (
    <button
      className="btn secondary model-inside"
      aria-pressed={inside}
      onClick={() => {
        lift.current?.(!inside, true);
        setInside(!inside);
        insideChangeRef.current?.(!inside);
      }}
    >
      {inside ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      {inside ? t("site.showOutside") : t("site.showInside")}
    </button>
  );
  /** Turns to a photograph's view; the model opens for one taken inside and closes again for one taken outside. */
  const showView = (index: number) => {
    const view = views?.[index];
    if (!view || !aim.current) return;
    if (viewIndex === null) beforeViews.current = { pose: readPose.current?.() ?? null, inside: inside ?? false };
    const open = view.camera.interior ?? false;
    if (inside !== null && open !== inside) {
      lift.current?.(open, false);
      setInside(open);
    }
    aim.current(view.camera);
    setViewIndex(index);
  };
  const leaveViews = () => {
    const before = beforeViews.current;
    if (before && inside !== null && before.inside !== inside) {
      lift.current?.(before.inside, false);
      setInside(before.inside);
    }
    if (before?.pose) aim.current?.(before.pose);
    beforeViews.current = null;
    setViewIndex(null);
    setViewLarge(false);
  };
  return (
    <>
      <div className="model-canvas" ref={host} />
      {!!partCards?.length && !onPick && (
        <button
          className="model-show-parts"
          aria-label={t("site.showParts")}
          title={t("site.showParts")}
          aria-pressed={showingParts}
          onClick={() => {
            cancelAnimationFrame(pulseFrame.current);
            setShowingParts(true);
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const stagger = Math.min(PART_STAGGER_MS, 2600 / Math.max(1, partCards.length - 1));
            const duration = reduced ? 1000 : PART_PULSE_MS + (partCards.length - 1) * stagger;
            // Random, each card far from the one before (lib/part-order): neighbours lit in turn read as one part.
            const order = spreadOrder(partCards.map((card) => centreOf.current?.(card.parts) ?? null));
            const slot = new Map(order.map((card, at) => [card, at]));
            const start = performance.now();
            const animate = (now: number) => {
              const elapsed = now - start;
              const levels = new Map<string, number>();
              partCards.forEach((card, index) => {
                const progress = (elapsed - (slot.get(index) ?? index) * stagger) / PART_PULSE_MS;
                const level = reduced ? PICK_GLOW : progress > 0 && progress < 1 ? PICK_GLOW * Math.sin(Math.PI * progress) : 0;
                for (const part of card.parts) levels.set(part, Math.max(levels.get(part) ?? 0, level));
              });
              pulse.current?.(elapsed < duration ? levels : new Map());
              if (elapsed < duration) pulseFrame.current = requestAnimationFrame(animate);
              else setShowingParts(false);
            };
            pulseFrame.current = requestAnimationFrame(animate);
          }}
        >
          <MousePointerClick size={18} />
        </button>
      )}
      {views?.length ? (
        <div className="model-views">
          {viewIndex !== null && views[viewIndex] && (
            // The photograph small beside the model it was matched to; a tap shows it larger.
            <button
              className={`model-view-photo${viewLarge ? " large" : ""}`}
              onClick={() => setViewLarge(!viewLarge)}
              aria-label={views[viewIndex]!.title || views[viewIndex]!.alt}
            >
              <img src={views[viewIndex]!.src} alt={views[viewIndex]!.alt} />
              <span>
                {views[viewIndex]!.title}
                <small>{t("site.viewCount", { index: viewIndex + 1, total: views.length })}</small>
              </span>
            </button>
          )}
          {viewIndex !== null && (
            <button className="btn secondary model-view-btn" aria-label={t("site.viewsClose")} title={t("site.viewsClose")} onClick={leaveViews}>
              <X size={18} />
            </button>
          )}
          <button
            className="btn secondary model-view-btn"
            aria-label={t("site.viewPrev")}
            title={t("site.viewPrev")}
            onClick={() => showView(viewIndex === null ? views.length - 1 : (viewIndex - 1 + views.length) % views.length)}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="btn secondary model-view-btn"
            aria-label={t("site.viewNext")}
            title={t("site.viewNext")}
            onClick={() => showView(viewIndex === null ? 0 : (viewIndex + 1) % views.length)}
          >
            <ChevronRight size={18} />
          </button>
          {insideButton}
        </div>
      ) : (
        insideButton
      )}
      {picked && (
        <p className="model-part-name" role="status">
          {picked.card?.title ?? partLabel(picked.part)}
        </p>
      )}
      {picked?.card && (
        <PartCardDialog
          card={picked.card}
          sources={sources}
          onClose={() => {
            select.current?.(highlightRef.current ?? []);
            setPicked(null);
          }}
        />
      )}
    </>
  );
}
