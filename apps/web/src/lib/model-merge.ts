import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/**
 * Fewer draw calls for a model on the map (3 Nov 2026). Each mesh is one draw call, and three.js spends the phone's
 * CPU on each one every frame the map moves: Ulucami alone has about a hundred. On the map nobody taps a part (a tap
 * asks which site, not which part), so the meshes that share a material and the same attributes become one, in the
 * model's own coordinates. Meshes with several materials, or whose attributes differ, stay as they are.
 *
 * Measure what needs the parts' names (the base point, `modelBase`) before merging: the parts are gone after.
 * Returns the number of draw calls before and after.
 */
export function mergeByMaterial(root: THREE.Object3D): { before: number; after: number } {
  root.updateMatrixWorld(true);
  const toRoot = root.matrixWorld.clone().invert();
  const groups = new Map<string, { material: THREE.Material; meshes: THREE.Mesh[] }>();
  let before = 0;
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    before++;
    if (Array.isArray(node.material) || node instanceof THREE.InstancedMesh || node instanceof THREE.SkinnedMesh) return;
    const geometry = node.geometry as THREE.BufferGeometry;
    if (Object.keys(geometry.morphAttributes).length) return;
    const key = [node.material.uuid, geometry.index ? "i" : "n", ...Object.keys(geometry.attributes).sort()].join("|");
    const group = groups.get(key) ?? { material: node.material as THREE.Material, meshes: [] as THREE.Mesh[] };
    group.meshes.push(node);
    groups.set(key, group);
  });
  let merged = 0;
  const holder = new THREE.Group();
  holder.name = "akar-birlesik";
  for (const { material, meshes } of groups.values()) {
    if (meshes.length < 2) continue;
    const pieces = meshes.map((mesh) => mesh.geometry.clone().applyMatrix4(toRoot.clone().multiply(mesh.matrixWorld)));
    const one = mergeGeometries(pieces, false);
    pieces.forEach((g) => g.dispose());
    if (!one) continue;
    const mesh = new THREE.Mesh(one, material);
    mesh.castShadow = meshes.some((m) => m.castShadow);
    mesh.receiveShadow = meshes.some((m) => m.receiveShadow);
    holder.add(mesh);
    for (const old of meshes) {
      old.geometry.dispose();
      old.removeFromParent();
    }
    merged += meshes.length;
  }
  if (holder.children.length) root.add(holder);
  return { before, after: before - merged + holder.children.length };
}
