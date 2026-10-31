"use client";
import { useEffect, useRef, useState } from "react";
import type {
  CameraPose,
  CityScene,
  PartCard,
  SiteModel,
  SiteSource,
} from "@akar/domain";
import { ChevronDown, ChevronUp, MousePointerClick } from "lucide-react";
import * as THREE from "three";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { useI18n } from "./i18n";
import { PartCardDialog, partLabel } from "./part-card";
import { liftGroundLayers } from "../lib/ground-layers";
import { PRESENTATION_PARTS } from "../lib/model-anchor";
import { addSceneLights, groundShadow, saturate } from "../lib/scene-light";
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
/** Part glow: hover (mouse) and the open card's parts. */
const GLOW = new THREE.Color(0xf2c230);
const HOVER_GLOW = 0.28;
const PICK_GLOW = 0.55;
/** A press that moves less than this (px) and ends sooner (ms) is a tap, not a drag. */
const TAP_SLOP = 6;
const TAP_MS = 600;

/** How long each tappable part lights up when the visitor asks to see them. */
const PART_PULSE_MS = 700;
/** How long «show the parts» stays lit after a tap. */
const PARTS_PRESSED_MS = 650;
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
}) {
  const { t } = useI18n();
  const host = useRef<HTMLDivElement>(null);
  const aim = useRef<((pose: CameraPose) => void) | null>(null);
  const lift = useRef<((open: boolean, raise: boolean) => void) | null>(null);
  const [showingParts, setShowingParts] = useState(false);
  const select = useRef<((parts: string[]) => void) | null>(null);
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
    const disposeObject = (root: THREE.Object3D) =>
      root.traverse((item) => {
        if (!(item instanceof THREE.Mesh)) return;
        item.geometry.dispose();
        for (const material of Array.isArray(item.material)
          ? item.material
          : [item.material]) {
          for (const value of Object.values(material))
            if (value instanceof THREE.Texture) value.dispose();
          material.dispose();
        }
      });
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      if (detail) {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.shadowMap.enabled = true;
        // Three r186 removed PCFSoftShadowMap; its supported replacement is PCF.
        renderer.shadowMap.type = THREE.PCFShadowMap;
      }
      renderer.domElement.setAttribute("aria-label", labelRef.current);
      renderer.domElement.setAttribute("role", "img");
      element.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(detail ? 38 : 40, 1, 0.01, 10000);
      if (!detail) addSceneLights(scene, JSON.parse(lightKey));
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enablePan = false;
      controls.maxPolarAngle = Math.PI * 0.49;
      const render = () => {
        if (!disposed) renderer!.render(scene, camera);
      };
      controls.addEventListener("change", render);
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
          if (detail) {
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
          if (detail) {
            const R = size.length() / 2 * 1.3;
            scene.add(new THREE.HemisphereLight(0xf4f1ea, 0x8c948f, 1.15));
            const sun = new THREE.DirectionalLight(0xfff4e0, 2.1);
            const az = THREE.MathUtils.degToRad((model.placement?.frontDeg ?? 180) + 40);
            const el = THREE.MathUtils.degToRad(50);
            const target = new THREE.Vector3(0, size.y * 0.25, 0);
            sun.position.set(Math.sin(az)*Math.cos(el), Math.sin(el), -Math.cos(az)*Math.cos(el)).multiplyScalar(R*2.5).add(target);
            sun.target.position.copy(target);
            sun.castShadow = true;
            sun.shadow.mapSize.set(2048,2048);
            sun.shadow.bias = -0.0004;
            sun.shadow.normalBias = R / 2048;
            Object.assign(sun.shadow.camera, { left:-R, right:R, top:R, bottom:-R, near:R*0.5, far:R*5 });
            scene.add(sun, sun.target);
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
          aim.current = (next) => {
            // Distance at which the bounding sphere fits the narrower field of view of the free part.
            const { width, height } = element.getBoundingClientRect();
            const fit =
              sphere / Math.sin(fitHalfAngle(camera.fov, width, height, frameRef.current));
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
          const baseEmissive = new WeakMap<THREE.Material, THREE.Color>();
          let hovered: string[] = [];
          let selected: string[] = [];
          // Applied to the meshes' current materials: "İçini göster" swaps in its own copies later.
          const glow = () => {
            for (const [part, meshes] of meshesOf) {
              const level = selected.includes(part) ? PICK_GLOW : hovered.includes(part) ? HOVER_GLOW : 0;
              for (const mesh of meshes)
                for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
                  if (!(m instanceof THREE.MeshStandardMaterial)) continue;
                  if (!baseEmissive.has(m)) baseEmissive.set(m, m.emissive.clone());
                  m.emissive.copy(baseEmissive.get(m)!).lerp(GLOW, level);
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
              const materials = (hit.object as THREE.Mesh).material;
              const faded = (Array.isArray(materials) ? materials : [materials]).every(
                (m: THREE.Material) => m.transparent && m.opacity < 0.5,
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
      lift.current = null;
      select.current = null;
      spin.current = null;
      reframe.current = null;
      setInside(null);
      setPicked(null);
      cancelTween();
      cancelLift();
      detachPointer();
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
            setShowingParts(true);
            setTimeout(() => setShowingParts(false), PARTS_PRESSED_MS);
            partCards.forEach((card, i) =>
              setTimeout(
                () => select.current?.(card.parts),
                i * PART_PULSE_MS,
              ),
            );
            setTimeout(
              () => select.current?.(highlightRef.current ?? []),
              partCards.length * PART_PULSE_MS,
            );
          }}
        >
          <MousePointerClick size={18} />
        </button>
      )}
      {inside !== null && (
        <button
          className="btn secondary model-inside"
          aria-pressed={inside}
          onClick={() => {
            lift.current?.(!inside, true);
            setInside(!inside);
          }}
        >
          {inside ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          {inside ? t("site.showOutside") : t("site.showInside")}
        </button>
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
