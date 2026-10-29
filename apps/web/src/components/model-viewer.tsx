"use client";
import { useEffect, useRef, useState } from "react";
import type { CameraPose, SiteModel } from "@akar/domain";
import { ChevronDown, ChevronUp } from "lucide-react";
import * as THREE from "three";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const TWEEN_MS = 900;
/** One cover group's rise; the next group follows once the one before has passed `LIFT_GAP`. */
const LIFT_MS = 700;
const LIFT_GAP = 0.35;
/** "İçini göster" raises a low camera to this elevation so the inside is visible. */
const INSIDE_ELEVATION = 58;

/**
 * `pose` turns the camera to a story sentence's view (absent = keep the current view). Model axes:
 * x east, y up, z south; azimuth 0 looks from the north, clockwise. `interior` (story) lifts the
 * model's cover groups or sets them down; absent = leave them as the visitor left them.
 */
export default function ModelViewer({
  model,
  name,
  pose,
  interior,
}: {
  model: SiteModel;
  name: string;
  pose?: CameraPose;
  interior?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const aim = useRef<((pose: CameraPose) => void) | null>(null);
  const lift = useRef<((open: boolean, raise: boolean) => void) | null>(null);
  const poseRef = useRef(pose);
  poseRef.current = pose;
  const interiorRef = useRef(interior);
  interiorRef.current = interior;
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
      setInside(null);
      cancelTween();
      cancelLift();
      observer?.disconnect();
      controls?.dispose();
      decoder?.dispose();
      if (object) disposeObject(object);
      renderer?.dispose();
      renderer?.forceContextLoss();
      renderer?.domElement.remove();
    };
  }, [model.src, name, heading, groupsKey]);
  useEffect(() => {
    if (pose) aim.current?.(pose);
  }, [pose]);
  useEffect(() => {
    if (interior === undefined || !lift.current) return;
    lift.current(interior, false);
    setInside(interior);
  }, [interior]);
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
    </div>
  );
}
