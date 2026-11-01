import * as THREE from "three";

/**
 * Ground layers (as the prototype's `zeminKatmanlari`, 28 Oct 2026). The models' ground surfaces (plinth, paving,
 * courtyard, ring, grass) lie only 2–6 mm above one another. Seen from a distance the depth buffer cannot tell them
 * apart, so which one is drawn in front changes pixel by pixel as the camera turns and the texture flickers
 * (z-fighting). Draco also rounds heights to ~7 mm steps, so this is needed even when the model itself is right.
 *
 * No site-specific names: every mesh resting on the base (top under 40 cm above the model's lowest point) and thinner
 * than 35 cm is a ground layer. Layers are ranked by the area-weighted mean height of their upward faces, and each
 * higher layer is drawn a few depth steps nearer the camera with a polygon offset, so the order is the same from every
 * angle. The lowest layer is left alone.
 */
export function groundLayerRanks(meshes: THREE.Mesh[]): Map<THREE.Mesh, number> {
  const box = new THREE.Box3();
  let base = Infinity;
  for (const mesh of meshes) {
    box.setFromObject(mesh);
    if (!box.isEmpty()) base = Math.min(base, box.min.y);
  }
  const a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    c = new THREE.Vector3(),
    ab = new THREE.Vector3(),
    ac = new THREE.Vector3();
  const layers: { mesh: THREE.Mesh; y: number }[] = [];
  for (const mesh of meshes) {
    box.setFromObject(mesh);
    if (box.isEmpty() || box.max.y - box.min.y > 0.35 || box.max.y - base > 0.4) continue;
    const position = mesh.geometry.attributes.position;
    if (!position) continue;
    const index = mesh.geometry.index;
    const count = index ? index.count : position.count;
    let area = 0,
      sum = 0;
    for (let i = 0; i + 2 < count; i += 3) {
      a.fromBufferAttribute(position, index ? index.getX(i) : i).applyMatrix4(mesh.matrixWorld);
      b.fromBufferAttribute(position, index ? index.getX(i + 1) : i + 1).applyMatrix4(mesh.matrixWorld);
      c.fromBufferAttribute(position, index ? index.getX(i + 2) : i + 2).applyMatrix4(mesh.matrixWorld);
      const normal = ab.subVectors(b, a).cross(ac.subVectors(c, a));
      const s = normal.length() / 2;
      if (s < 1e-6 || normal.y / (2 * s) < 0.95) continue;
      area += s;
      sum += (s * (a.y + b.y + c.y)) / 3;
    }
    if (area > 0) layers.push({ mesh, y: sum / area });
  }
  layers.sort((p, q) => p.y - q.y);
  const ranks = new Map<THREE.Mesh, number>();
  let rank = 0,
    previous = -Infinity;
  for (const { mesh, y } of layers) {
    if (y - previous > 0.0005) {
      if (previous > -Infinity) rank++;
      previous = y;
    }
    ranks.set(mesh, rank);
  }
  return ranks;
}

/** Applies the ranks: each raised layer gets its own material copy, so a shared material does not lift another mesh. */
export function liftGroundLayers(root: THREE.Object3D) {
  const meshes: THREE.Mesh[] = [];
  root.updateMatrixWorld(true);
  root.traverse((item) => {
    if (item instanceof THREE.Mesh && item.visible) meshes.push(item);
  });
  for (const [mesh, rank] of groundLayerRanks(meshes)) {
    if (!rank) continue;
    const lift = (m: THREE.Material) =>
      Object.assign(m.clone(), {
        polygonOffset: true,
        polygonOffsetFactor: -0.5 * rank,
        polygonOffsetUnits: -3 * rank,
      });
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(lift) : lift(mesh.material);
  }
}
