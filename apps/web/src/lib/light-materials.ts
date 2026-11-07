import * as THREE from "three";

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
