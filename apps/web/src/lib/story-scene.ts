import type { PartCard } from "@akar/domain";

/** What covers the 3D canvas, in pixels from its left and bottom edges; the model stays in the rest. */
export type SceneFrame = { left: number; bottom: number };
export const NO_FRAME: SceneFrame = { left: 0, bottom: 0 };

/** The story's photo card: beside the model on a wide screen, a strip under it on a narrow one (`.story-photo-card`). */
const CARD_WIDTH = 320;
const CARD_STRIP_HEIGHT = 96;
const CARD_EDGE = 20;
const CARD_GAP = 12;

/**
 * On a phone the card is a photograph the screen's width, this share of the screen's height, 8 px off the foot
 * (design.css `.story-photo-card`, 4 Nov 2026). The camera reserves exactly that, or the model sinks behind it.
 */
export const PHONE_CARD_SHARE = 0.22;
export const PHONE_CARD_EDGE = 8;
/** What the admin's phone preview stands for (a 390 × 812 phone: the stage above the sheet is about 640 tall). */
export const PHONE_PREVIEW = { width: 360, height: 640, screenHeight: 812 };

/** The visitor sizes the photo card between these (Muhammed, 2 Nov 2026); 1 is the designed size. */
export const CARD_SCALE_MIN = 0.75;
export const CARD_SCALE_MAX = 1.6;
export const clampCardScale = (scale: number) =>
  Math.round(Math.min(CARD_SCALE_MAX, Math.max(CARD_SCALE_MIN, scale)) * 100) / 100;

/** What the card at its own place by default covers: the model is framed in the rest, at any size of the card. */
export function storyCardFrame(wide: boolean, scale = 1, screenHeight = 0): SceneFrame {
  if (wide) return { left: CARD_EDGE + Math.round(CARD_WIDTH * scale) + CARD_GAP, bottom: 0 };
  // A phone's card is not sized by the visitor: its height is a share of the screen.
  return screenHeight > 0
    ? { left: 0, bottom: PHONE_CARD_EDGE + Math.round(screenHeight * PHONE_CARD_SHARE) + PHONE_CARD_EDGE }
    : { left: 0, bottom: CARD_GAP + Math.round(CARD_STRIP_HEIGHT * scale) + CARD_GAP };
}

/**
 * The card's new size after its corner was dragged by (dx, dy): on a wide screen its width follows the pointer; on a
 * phone, where the card is a strip, its height does: upward while it sits at the bottom, downward once moved.
 */
export function resizedCardScale(scale: number, wide: boolean, dx: number, dy: number, anchoredBottom: boolean) {
  const grow = wide ? dx / CARD_WIDTH : (anchoredBottom ? -dy : dy) / CARD_STRIP_HEIGHT;
  return clampCardScale(scale + grow);
}

/**
 * Half of the narrower field of view (radians) of the part of the canvas `frame` leaves free, inside the larger
 * view the canvas is a window of. With no frame this is the camera's own field of view.
 */
export function fitHalfAngle(
  fovDeg: number,
  width: number,
  height: number,
  frame: SceneFrame,
): number {
  const perPixel =
    Math.tan((fovDeg * Math.PI) / 360) / ((height + frame.bottom) / 2);
  const free = Math.max(1, Math.min(height - frame.bottom, width - frame.left));
  return Math.atan((perPixel * free) / 2);
}

/** A close pose on a part looks for a free view around walls; one the panel's editor placed by hand stands as it is. */
export const looksForFreeView = (pose: { target?: string | null; distance: number; exact?: boolean }, closeBelow: number) =>
  !!pose.target && pose.distance < closeBelow && !pose.exact;
/** The next sentence about the whole building on the same pose goes on turning; the camera does not go back. */
export function tourCarriesOn(
  tour: boolean | undefined,
  tourPose: string,
  pose: string,
): boolean {
  return !!tour && tourPose === pose;
}

/** The part card of what the sentence highlights, if it has one; tapping the photo card opens it. */
export function storyPartCard(
  cards: PartCard[],
  highlights: string[],
): PartCard | undefined {
  return cards.find((card) => card.parts.some((p) => highlights.includes(p)));
}

type Point = { x: number; y: number; z: number };
/** Whether a tree (a sphere) stands on the line from the camera to what it looks at, or around the camera itself. */
export function treeBlocksView(camera: Point, target: Point, centre: Point, radius: number): boolean {
  const way = { x: target.x - camera.x, y: target.y - camera.y, z: target.z - camera.z };
  const to = { x: centre.x - camera.x, y: centre.y - camera.y, z: centre.z - camera.z };
  const length = way.x * way.x + way.y * way.y + way.z * way.z;
  const along = length ? Math.min(1, Math.max(0, (to.x * way.x + to.y * way.y + to.z * way.z) / length)) : 0;
  const dx = to.x - way.x * along,
    dy = to.y - way.y * along,
    dz = to.z - way.z * along;
  return dx * dx + dy * dy + dz * dz < radius * radius;
}
