"use client";
import { useEffect, useRef, useState } from "react";
import type { CameraPose, PartCard, SiteModel, SiteSource } from "@akar/domain";
import { ChevronDown, ChevronUp } from "lucide-react";
import * as THREE from "three";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PartCardDialog, partLabel } from "./part-card";

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

/**
 * `pose` turns the camera to a story sentence's view (absent = keep the current view). Model axes:
 * x east, y up, z south; azimuth 0 looks from the north, clockwise. `interior` (story) lifts the
 * model's cover groups or sets them down; absent = leave them as the visitor left them.
 * Parts: with `partCards`, only their parts respond to a tap and open the card (all of a card's
 * parts glow together); without cards every part shows its name.
 */
export default function ModelViewer({
  model,
  name,
  pose,
  interior,
  partCards = [],
  sources = [],
}: {
  model: SiteModel;
  name: string;
  pose?: CameraPose;
  interior?: boolean;
  partCards?: PartCard[];
  sources?: SiteSource[];
}) {
  const host = useRef<HTMLDivElement>(null);
  const aim = useRef<((pose: CameraPose) => void) | null>(null);
  const lift = useRef<((open: boolean, raise: boolean) => void) | null>(null);
  const select = useRef<((parts: string[]) => void) | null>(null);
  const poseRef = useRef(pose);
  poseRef.current = pose;
  const interiorRef = useRef(interior);
  interiorRef.current = interior;
  const cardsRef = useRef(partCards);
  cardsRef.current = partCards;
  /** The tapped part: its card, or only its name on a site without cards. */
  const [picked, setPicked] = useState<{ part: string; card?: PartCard } | null>(null);
  const partsKey = JSON.stringify([model.parts, partCards.map((c) => c.parts)]);
  const [status, setStatus] = useState("3B model yükleniyor…");
  /** null = the model has no usable cover groups (no button). */
  const [inside, setInside] = useState<boolean | null>(null);
  const heading = model.placement?.headingDeg ?? 0;
  const groupsKey = JSON.stringify(model.coverGroups ?? []);
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
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.domElement.setAttribute(
        "aria-label",
        `${name} 3B modeli. Döndürmek için sürükle, yakınlaştırmak için iki parmağını kullan.`,
      );
      renderer.domElement.setAttribute("role", "img");
      element.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 10000);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x80715c, 2.4));
      const sunlight = new THREE.DirectionalLight(0xffffff, 3);
      sunlight.position.set(70, 100, 50);
      scene.add(sunlight);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enablePan = false;
      controls.maxPolarAngle = Math.PI * 0.49;
      const render = () => {
        if (!disposed) renderer!.render(scene, camera);
      };
      controls.addEventListener("change", render);
      observer = new ResizeObserver(() => {
        const { width, height } = element.getBoundingClientRect();
        if (!width || !height) return;
        renderer!.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        render();
      });
      let frame = 0;
      cancelTween = () => cancelAnimationFrame(frame);
      // A drag stops the camera where the visitor took it.
      controls.addEventListener("start", () => cancelAnimationFrame(frame));
      observer.observe(element);
      decoder = new DRACOLoader().setDecoderPath("/draco/").setWorkerLimit(2);
      new GLTFLoader().setDRACOLoader(decoder).load(
        model.src,
        (gltf) => {
          if (disposed) {
            disposeObject(gltf.scene);
            return;
          }
          object = gltf.scene;
          // Turned like on the map, so a pose's azimuth (0 = from the north) means the real north.
          object.rotation.y = -THREE.MathUtils.degToRad(heading);
          object.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(object);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          object.position.sub(center);
          scene.add(object);
          const root = object;
          const radius = Math.max(size.x, size.y, size.z, 1);
          const sphere = size.length() / 2 || 1;
          camera.near = radius / 1000;
          camera.far = radius * 20;
          camera.position.set(radius * 1.15, radius * 0.9, radius * 1.15);
          camera.updateProjectionMatrix();
          controls!.minDistance = radius * 0.35;
          controls!.maxDistance = radius * 4;
          controls!.target.set(0, 0, 0);
          controls!.update();
          aim.current = (next) => {
            // Distance at which the bounding sphere fits the narrower field of view.
            const vfov = THREE.MathUtils.degToRad(camera.fov);
            const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
            const fit = sphere / Math.sin(Math.min(vfov, hfov) / 2);
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
            if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
              camera.position.copy(to);
              controls!.target.copy(goal);
              controls!.update();
              render();
              return;
            }
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
              if (t < 1 && !disposed) frame = requestAnimationFrame(step);
            };
            frame = requestAnimationFrame(step);
          };
          // Parts that answer a tap: a card's parts, or every part when the site has no cards.
          const [partNames, cardParts] = JSON.parse(partsKey) as [string[], string[][]];
          const known = new Set(partNames);
          const tappable = cardParts.length ? new Set(cardParts.flat()) : known;
          /** Meshes of each tappable part, each on its own material copy so a glow never spreads to a part sharing one. */
          const meshesOf = new Map<string, THREE.Mesh[]>();
          for (const part of tappable) {
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
            cardParts.length ? (cardParts.find((parts) => parts.includes(part)) ?? []) : [part];
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
              return part && tappable.has(part) ? part : undefined;
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
          if (poseRef.current) aim.current(poseRef.current);
          render();
          setStatus("");
        },
        undefined,
        () => {
          if (!disposed)
            setStatus(
              "3B model yüklenemedi. Fotoğraflardan devam edebilirsin.",
            );
        },
      );
    } catch {
      setStatus(
        "Bu cihazda 3B görünüm açılamadı. Fotoğraflardan devam edebilirsin.",
      );
    }
    return () => {
      disposed = true;
      aim.current = null;
      lift.current = null;
      select.current = null;
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
  }, [model.src, name, heading, groupsKey, partsKey]);
  useEffect(() => {
    if (pose) aim.current?.(pose);
  }, [pose]);
  useEffect(() => {
    if (interior === undefined || !lift.current) return;
    lift.current(interior, false);
    setInside(interior);
  }, [interior]);
  // A bare part name fades after a moment; a card stays until closed.
  useEffect(() => {
    if (!picked || picked.card) return;
    const timer = setTimeout(() => {
      select.current?.([]);
      setPicked(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, [picked]);
  return (
    <div className="model-viewer">
      <div className="model-canvas" ref={host} />
      {status && (
        <p className="model-status" role="status">
          {status}
        </p>
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
          {inside ? "Dışını göster" : "İçini göster"}
        </button>
      )}
      {picked && !picked.card && (
        <p className="model-part-name" role="status">
          {partLabel(picked.part)}
        </p>
      )}
      {picked?.card && (
        <PartCardDialog
          card={picked.card}
          sources={sources}
          onClose={() => {
            select.current?.([]);
            setPicked(null);
          }}
        />
      )}
    </div>
  );
}
