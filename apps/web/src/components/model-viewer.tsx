"use client";
import { useEffect, useRef, useState } from "react";
import type { SiteModel } from "@akar/domain";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export default function ModelViewer({
  model,
  name,
}: {
  model: SiteModel;
  name: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("3B model yükleniyor…");
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let disposed = false;
    let renderer: THREE.WebGLRenderer | undefined;
    let controls: OrbitControls | undefined;
    let observer: ResizeObserver | undefined;
    let object: THREE.Group | undefined;
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
      observer.observe(element);
      new GLTFLoader().load(
        model.src,
        (gltf) => {
          if (disposed) {
            disposeObject(gltf.scene);
            return;
          }
          object = gltf.scene;
          const box = new THREE.Box3().setFromObject(object);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          object.position.sub(center);
          scene.add(object);
          const radius = Math.max(size.x, size.y, size.z, 1);
          camera.near = radius / 1000;
          camera.far = radius * 20;
          camera.position.set(radius * 1.15, radius * 0.9, radius * 1.15);
          camera.updateProjectionMatrix();
          controls!.minDistance = radius * 0.35;
          controls!.maxDistance = radius * 4;
          controls!.target.set(0, 0, 0);
          controls!.update();
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
      observer?.disconnect();
      controls?.dispose();
      if (object) disposeObject(object);
      renderer?.dispose();
      renderer?.forceContextLoss();
      renderer?.domElement.remove();
    };
  }, [model.src, name]);
  return (
    <div className="model-viewer" ref={host}>
      {status && (
        <p className="model-status" role="status">
          {status}
        </p>
      )}
    </div>
  );
}
