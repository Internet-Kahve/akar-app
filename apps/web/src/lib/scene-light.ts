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

/**
 * The map's light, the prototype's (30 Oct 2026): ACES tone mapping, a warm sky light and one sun that casts real
 * shadows. The sun stands in front of the site's main façade (`frontDeg`), `acrossDeg` to the left of a visitor
 * facing it, so every site shows its lit front; high and soft so light façades do not burn out close up. Without a
 * façade direction the sun comes from the city's `azimuthDeg`.
 */
export const MAP_LIGHT = {
  exposure: 1.05,
  sky: 0xf4f1ea,
  ground: 0x8c948f,
  ambient: 1.15,
  colour: 0xfff4e0,
  sun: 1.5,
  elevationDeg: 62,
  acrossDeg: 20,
  shadowMapSize: 1024,
  /** Opacity of the cast shadow on the map's ground. */
  shadowOpacity: 0.3,
};
/** Where the map's sun comes from, degrees clockwise from north. */
export const mapSunAzimuth = (
  frontDeg: number | null | undefined,
  light: SceneLight,
) =>
  frontDeg == null || !Number.isFinite(frontDeg)
    ? light.azimuthDeg
    : (((frontDeg + MAP_LIGHT.acrossDeg) % 360) + 360) % 360;
/** Sky light and a shadow-casting sun in `scene`; aim the sun with `aimMapSun` once the model is placed. */
export function addMapLights(scene: THREE.Scene) {
  scene.add(
    new THREE.HemisphereLight(MAP_LIGHT.sky, MAP_LIGHT.ground, MAP_LIGHT.ambient),
  );
  const sun = new THREE.DirectionalLight(MAP_LIGHT.colour, MAP_LIGHT.sun);
  sun.castShadow = true;
  sun.shadow.mapSize.set(MAP_LIGHT.shadowMapSize, MAP_LIGHT.shadowMapSize);
  sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);
  return sun;
}
/** Puts the sun at `azimuthDeg`, looking at `centre`, its shadow camera covering `radius` metres around it. */
export function aimMapSun(
  sun: THREE.DirectionalLight,
  azimuthDeg: number,
  centre: THREE.Vector3,
  radius: number,
) {
  const a = THREE.MathUtils.degToRad(azimuthDeg);
  const e = THREE.MathUtils.degToRad(MAP_LIGHT.elevationDeg);
  sun.position
    .set(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e))
    .multiplyScalar(radius * 2.5)
    .add(centre);
  sun.target.position.copy(centre);
  sun.target.updateMatrixWorld();
  sun.shadow.normalBias = radius / MAP_LIGHT.shadowMapSize;
  Object.assign(sun.shadow.camera, {
    left: -radius,
    right: radius,
    top: radius,
    bottom: -radius,
    near: radius * 0.5,
    far: radius * 5,
  });
  sun.shadow.camera.updateProjectionMatrix();
}
/** A ground plane that shows only the shadows cast on it, `radius` metres around `centre`, just above the map. */
export function shadowFloor() {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShadowMaterial({
      opacity: MAP_LIGHT.shadowOpacity,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: 2,
      polygonOffsetUnits: 8,
    }),
  );
  mesh.name = "akar-shadow-floor";
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  mesh.renderOrder = -1;
  mesh.raycast = () => {};
  return mesh;
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
