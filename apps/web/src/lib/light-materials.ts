import * as THREE from "three";

/**
 * A lighter way to light the site's model (5 Nov 2026, trial): Lambert drops the specular sum of MeshStandardMaterial,
 * the most expensive part of each pixel. Colours, textures, ambient occlusion and shadows stay; only the sun's gleam on
 * lead and marble goes. The models have no normal or roughness maps and no environment map, so nothing else depends on it.
 */
export function lambertFrom(source: THREE.MeshStandardMaterial): THREE.MeshLambertMaterial {
  const material = new THREE.MeshLambertMaterial({
    name: source.name,
    // What a metal gives up in diffuse light under the standard model: kept, so a metal does not turn bright.
    color: source.color.clone().multiplyScalar(1 - source.metalness),
    map: source.map,
    aoMap: source.aoMap,
    aoMapIntensity: source.aoMapIntensity,
    emissive: source.emissive.clone(),
    emissiveMap: source.emissiveMap,
    emissiveIntensity: source.emissiveIntensity,
    alphaMap: source.alphaMap,
    alphaTest: source.alphaTest,
    transparent: source.transparent,
    opacity: source.opacity,
    side: source.side,
    depthWrite: source.depthWrite,
    vertexColors: source.vertexColors,
    flatShading: source.flatShading,
    toneMapped: source.toneMapped,
    polygonOffset: source.polygonOffset,
    polygonOffsetFactor: source.polygonOffsetFactor,
    polygonOffsetUnits: source.polygonOffsetUnits,
  });
  material.userData = { ...source.userData };
  return material;
}

/** Turns every standard material under `root` to Lambert, a shared one into one shared copy. */
export function useLambert(root: THREE.Object3D) {
  const copies = new Map<THREE.Material, THREE.Material>();
  const swap = (m: THREE.Material) => {
    if (!(m instanceof THREE.MeshStandardMaterial)) return m;
    let copy = copies.get(m);
    if (!copy) {
      copy = lambertFrom(m);
      copies.set(m, copy);
    }
    return copy;
  };
  root.traverse((node) => {
    if (node instanceof THREE.Mesh) node.material = Array.isArray(node.material) ? node.material.map(swap) : swap(node.material);
  });
  for (const original of copies.keys()) original.dispose();
}

/** Whether every mesh under `root` is unlit (a night file): no light reaches it, so it needs no shadow map. */
export function isAllUnlit(root: THREE.Object3D): boolean {
  let unlit = true;
  let any = false;
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    any = true;
    for (const m of Array.isArray(node.material) ? node.material : [node.material])
      if (!(m instanceof THREE.MeshBasicMaterial)) unlit = false;
  });
  return any && unlit;
}

/** The trial's switch: `?akar-malzeme=lambert` in the address. */
export function lambertWanted(search: string, hash: string): boolean {
  return [search, hash.replace(/^#/, "")].some((part) => new URLSearchParams(part).get("akar-malzeme") === "lambert");
}
