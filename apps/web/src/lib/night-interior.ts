import * as THREE from "three";

/**
 * A night file's colours are baked into its vertices and it is unlit (`KHR_materials_unlit`), so no light in the scene
 * reaches it (5 Nov 2026: Bedesten and Orhan Bey Camii opened on a black interior; Ulucami's second bake is warm). The
 * interior's own vertex colours are raised until its bright parts stand at `TARGET`: the bake's shadows and corners
 * stay, and a file already bright enough is left as it is. No new file to bake, store or import.
 */
const TARGET = 0.4;
const MAX_GAIN = 14;
/** The lamps' warmth: red kept, blue held back. */
const WARM = [1, 0.8, 0.56] as const;

const luminance = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** How much to raise colours whose brightest tenth starts at `high`; 1 when they are bright enough or carry nothing. */
export function interiorGain(luminances: number[]): number {
  if (!luminances.length) return 1;
  const sorted = [...luminances].sort((a, b) => a - b);
  const high = sorted[Math.floor(sorted.length * 0.9)]!;
  if (high <= 0) return 1;
  return Math.min(MAX_GAIN, Math.max(1, TARGET / high));
}

/** Raises the vertex colours of the meshes under `parts`. Returns the gain used. */
export function warmNightInterior(root: THREE.Object3D, parts: string[]): number {
  const geometries = new Set<THREE.BufferGeometry>();
  for (const name of parts) {
    root.getObjectByName(name)?.traverse((node) => {
      if (!(node instanceof THREE.Mesh) || !node.geometry.attributes.color) return;
      const materials: THREE.Material[] = Array.isArray(node.material) ? node.material : [node.material];
      if (materials.every((m) => m instanceof THREE.MeshBasicMaterial)) geometries.add(node.geometry);
    });
  }
  const samples: number[] = [];
  for (const geometry of geometries) {
    const color = geometry.attributes.color as THREE.BufferAttribute;
    const step = Math.max(1, Math.floor(color.count / 2000));
    for (let i = 0; i < color.count; i += step) samples.push(luminance(color.getX(i), color.getY(i), color.getZ(i)));
  }
  const gain = interiorGain(samples);
  if (gain === 1) return 1;
  for (const geometry of geometries) {
    const color = geometry.attributes.color as THREE.BufferAttribute;
    // The bake's moonlight is blue: only its brightness is kept, in the lamps' colour.
    for (let i = 0; i < color.count; i++) {
      const level = luminance(color.getX(i), color.getY(i), color.getZ(i)) * gain;
      color.setXYZ(i, Math.min(1, level * WARM[0]), Math.min(1, level * WARM[1]), Math.min(1, level * WARM[2]));
    }
    color.needsUpdate = true;
  }
  return gain;
}
