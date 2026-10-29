import {
  defaultCityScene,
  type CityScene,
  type HeritageSite,
  type SceneLight,
} from "@akar/domain";
import * as THREE from "three";

/** The scene of a site's city; the default when the city has none (§11.42). */
export function sceneOf(
  site: Pick<HeritageSite, "city">,
  scenes: Record<string, CityScene>,
): CityScene {
  return scenes[site.city] ?? defaultCityScene;
}

/**
 * Ambient, sun and fill lights, the same on the map and in the site viewer. Axes: x east, y up,
 * z south; the sun comes from `azimuthDeg` (clockwise from north) at `elevationDeg`.
 */
export function addSceneLights(scene: THREE.Scene, light: SceneLight) {
  const a = THREE.MathUtils.degToRad(light.azimuthDeg);
  const e = THREE.MathUtils.degToRad(light.elevationDeg);
  const sun = new THREE.Vector3(
    Math.sin(a) * Math.cos(e),
    Math.sin(e),
    -Math.cos(a) * Math.cos(e),
  );
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b0a2, light.ambient));
  const sunLight = new THREE.DirectionalLight(0xfff6ea, light.sun);
  sunLight.position.copy(sun);
  scene.add(sunLight);
  const fill = new THREE.DirectionalLight(0xdfe8f2, light.fill);
  fill.position.set(-sun.x, 0.5, -sun.z);
  scene.add(fill);
}

/** Multiplies every material colour's saturation once (capped at 1); materials are the loaded file's own. */
export function saturate(root: THREE.Object3D, factor: number) {
  if (factor === 1) return;
  const hsl = { h: 0, s: 0, l: 0 };
  root.traverse((item) => {
    if (!(item instanceof THREE.Mesh)) return;
    for (const material of Array.isArray(item.material)
      ? item.material
      : [item.material]) {
      const color = (material as THREE.MeshStandardMaterial).color;
      if (!color || material.userData.akarSaturated) continue;
      material.userData.akarSaturated = true;
      color.getHSL(hsl);
      color.setHSL(hsl.h, Math.min(1, hsl.s * factor), hsl.l);
    }
  });
}

let shadowTexture: THREE.Texture | null = null;
/** One blurred rounded square, drawn once; its dark core covers 76 of 128 px. */
function groundShadowTexture() {
  if (shadowTexture) return shadowTexture;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const g = canvas.getContext("2d")!;
  g.filter = "blur(13px)";
  g.fillStyle = "#000";
  g.beginPath();
  if (g.roundRect) g.roundRect(26, 26, 76, 76, 14);
  else g.rect(26, 26, 76, 76);
  g.fill();
  shadowTexture = new THREE.CanvasTexture(canvas);
  shadowTexture.colorSpace = THREE.SRGBColorSpace;
  return shadowTexture;
}

/**
 * Soft shadow under a building, a little larger than its footprint (`minX…maxZ` in the parent's
 * metres), lying at `y`. Never picked by taps; the texture is shared, so dispose only the mesh's own parts.
 */
export function groundShadow(
  footprint: { minX: number; maxX: number; minZ: number; maxZ: number },
  y: number,
  opacity: number,
  depthOffset: { factor: number; units: number },
): THREE.Mesh {
  const k = 1 / 0.59;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(
      (footprint.maxX - footprint.minX) * k + 2,
      (footprint.maxZ - footprint.minZ) * k + 2,
    ),
    new THREE.MeshBasicMaterial({
      map: groundShadowTexture(),
      transparent: true,
      opacity,
      depthWrite: false,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: depthOffset.factor,
      polygonOffsetUnits: depthOffset.units,
    }),
  );
  mesh.name = "akar-ground-shadow";
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(
    (footprint.minX + footprint.maxX) / 2,
    y,
    (footprint.minZ + footprint.maxZ) / 2,
  );
  mesh.raycast = () => {};
  return mesh;
}
