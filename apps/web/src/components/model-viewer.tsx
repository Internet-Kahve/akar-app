"use client";
import { useEffect, useRef, useState } from "react";
import type { CameraPose, SiteModel } from "@akar/domain";
import * as THREE from "three";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const TWEEN_MS = 900;

/**
 * `pose` turns the camera to a story sentence's view (absent = keep the current view). Model axes:
 * x east, y up, z south; azimuth 0 looks from the north, clockwise.
 */
export default function ModelViewer({
  model,
  name,
  pose,
}: {
  model: SiteModel;
  name: string;
  pose?: CameraPose;
}) {
  const host = useRef<HTMLDivElement>(null);
  const aim = useRef<((pose: CameraPose) => void) | null>(null);
  const poseRef = useRef(pose);
  poseRef.current = pose;
  const [status, setStatus] = useState("3B model yükleniyor…");
  const heading = model.placement?.headingDeg ?? 0;
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
      cancelTween();
      observer?.disconnect();
      controls?.dispose();
      decoder?.dispose();
      if (object) disposeObject(object);
      renderer?.dispose();
      renderer?.forceContextLoss();
      renderer?.domElement.remove();
    };
  }, [model.src, name, heading]);
  useEffect(() => {
    if (pose) aim.current?.(pose);
  }, [pose]);
  return (
    <div className="model-viewer">
      <div className="model-canvas" ref={host} />
      {status && (
        <p className="model-status" role="status">
          {status}
        </p>
      )}
    </div>
  );
}
