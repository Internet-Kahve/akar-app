import * as THREE from "three";

/**
 * A waqf's income road in a site's own 3D scene (Muhammed, 2 Nov 2026; Kılıç Ali Paşa prototype, `story.js`
 * `flow`): on a sentence about the income, the other building of the road appears beside the site, smaller, and a gold
 * tube with coins runs from the one that earns (akar) to the one it keeps (hayrat). A building with no model shows as
 * a photograph standing in its place. The camera steps back to take both in.
 */
export interface FlowCompanion {
  /** The other building's model file, if it has one. */
  src?: string;
  /** Else (or while the model loads) a photograph of it. */
  photo?: string;
  name: string;
  /** The road's card text, as the source words it («Gelir → Ulucami»). */
  label: string;
  /** The income comes from the companion into this site (this site is the hayrat); else it goes out to it. */
  incoming: boolean;
}

export type Vec = { x: number; y: number; z: number };

/**
 * Where the companion stands: to the camera's right of the site, on the same ground, its bounding sphere `share` of
 * the site's, with a gap between them. `right` is the camera's right on the ground (unit, y = 0).
 */
export function companionPlace(siteSphere: number, siteBottom: number, right: Vec, share = 0.7) {
  const sphere = siteSphere * share;
  const distance = (siteSphere + sphere) * 1.15;
  return {
    sphere,
    centre: { x: right.x * distance, y: siteBottom + sphere * 0.7, z: right.z * distance },
    /** Where the camera looks while both are in view, and the sphere around both. */
    middle: { x: (right.x * distance) / 2, y: 0, z: (right.z * distance) / 2 },
    span: (distance + siteSphere + sphere) / 2,
  };
}

/** The road's arc: from the top of the one that earns to the top of the one it keeps, raised in its middle. */
export function flowArc(from: Vec, to: Vec, lift: number) {
  const a = new THREE.Vector3(from.x, from.y, from.z),
    b = new THREE.Vector3(to.x, to.y, to.z);
  const mid = a.clone().lerp(b, 0.5);
  mid.y += lift;
  return new THREE.QuadraticBezierCurve3(a, mid, b);
}

/** Time the tube takes to draw itself, then each coin's run along it (prototype: 2200 and 2600 ms). */
export const FLOW_DRAW_MS = 2200;
export const FLOW_COIN_MS = 2600;

/** A label drawn on a canvas, as a sprite that always faces the camera. */
export function textSprite(text: string, height: number) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const font = "600 44px system-ui, sans-serif";
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + 56;
  canvas.width = w;
  canvas.height = 76;
  ctx.font = font;
  ctx.fillStyle = "rgba(22, 52, 66, 0.92)";
  ctx.beginPath();
  ctx.roundRect(2, 2, w - 4, 72, 36);
  ctx.fill();
  ctx.strokeStyle = "#E3BC5E";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 28, 40);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true }));
  sprite.scale.set((height * w) / 76, height, 1);
  sprite.renderOrder = 10;
  return sprite;
}
