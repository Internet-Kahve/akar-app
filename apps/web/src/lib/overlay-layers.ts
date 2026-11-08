import * as THREE from "three";

/**
 * Thin decorations laid on a surface (Muhammed, 6 Nov 2026: Ulucami's arches flicker when the camera is dragged):
 * the arches' black line and orange band (`Kemer_Cizgi`, `Kemer_Bant`), carpet borders, lead seams, mortar joints,
 * calligraphy plates. They sit almost on the surface under them, so the depth test picks one or the other as the
 * camera moves. A polygon offset draws them a hair in front, once at load: nothing is computed per frame.
 */
export const OVERLAY_MATERIAL = /(Cizgi|Bant|Sinir|Bordur|Dikis|Derz|Serit|Levha|Kalem)/i;

export function isOverlayMaterial(name: string | undefined): boolean {
  return !!name && OVERLAY_MATERIAL.test(name);
}

/** Returns how many materials were given the offset. */
export function liftOverlays(root: THREE.Object3D): number {
  const done = new Set<THREE.Material>();
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      if (!m || done.has(m) || !isOverlayMaterial(m.name)) continue;
      // A ground layer already has its own offset (lib/ground-layers): it keeps it.
      if (!m.polygonOffset) {
        m.polygonOffset = true;
        m.polygonOffsetFactor = -1;
        m.polygonOffsetUnits = -4;
      }
      done.add(m);
    }
  });
  return done.size;
}
