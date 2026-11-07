import * as THREE from "three";

/**
 * How a model's textures are sampled (5 Nov 2026, «pixel pixel görünüyor»). Some exports carry NEAREST filters (Ulucami,
 * Orhan Bey Camii, the Hamam): each texel a hard square up close, sparkling at a distance. Every texture is read with
 * smooth filters here, and sharper at a slant with anisotropy, which three.js leaves at 1 (blurred ground and roofs).
 */
export const TEXTURE_ANISOTROPY = 8;
export const MODEST_ANISOTROPY = 2;

/** The upgrades for one texture; `null` when it is already as it should be. */
export function smoothedSampling(
  texture: Pick<THREE.Texture, "magFilter" | "minFilter" | "anisotropy">,
  anisotropy: number,
): { magFilter: THREE.MagnificationTextureFilter; minFilter: THREE.MinificationTextureFilter; anisotropy: number } | null {
  const next = {
    magFilter: THREE.LinearFilter as THREE.MagnificationTextureFilter,
    minFilter: THREE.LinearMipmapLinearFilter as THREE.MinificationTextureFilter,
    anisotropy: Math.max(texture.anisotropy, anisotropy),
  };
  return next.magFilter === texture.magFilter && next.minFilter === texture.minFilter && next.anisotropy === texture.anisotropy
    ? null
    : next;
}

/** Applies `smoothedSampling` to every texture under `root`, once each; `limit` is the GPU's own maximum. */
export function smoothTextures(root: THREE.Object3D, anisotropy: number, limit: number) {
  const seen = new Set<THREE.Texture>();
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      for (const value of Object.values(material as unknown as Record<string, unknown>)) {
        if (!(value instanceof THREE.Texture) || seen.has(value)) continue;
        seen.add(value);
        const next = smoothedSampling(value, Math.min(anisotropy, limit));
        if (!next) continue;
        Object.assign(value, next);
        value.needsUpdate = true;
      }
    }
  });
}
