import type { PartCard } from "@akar/domain";

/** What covers the 3D canvas, in pixels from its left and bottom edges; the model stays in the rest. */
export type SceneFrame = { left: number; bottom: number };
export const NO_FRAME: SceneFrame = { left: 0, bottom: 0 };

/** The story's photo card: beside the model on a wide screen, a strip under it on a narrow one (`.story-photo-card`). */
const CARD_WIDTH = 320;
const CARD_STRIP_HEIGHT = 96;
const CARD_EDGE = 20;
const CARD_GAP = 12;

/** The visitor sizes the photo card between these (Muhammed, 2 Nov 2026); 1 is the designed size. */
export const CARD_SCALE_MIN = 0.75;
export const CARD_SCALE_MAX = 1.6;
export const clampCardScale = (scale: number) =>
  Math.round(Math.min(CARD_SCALE_MAX, Math.max(CARD_SCALE_MIN, scale)) * 100) / 100;

/** What the card at its own place by default covers: the model is framed in the rest, at any size of the card. */
export function storyCardFrame(wide: boolean, scale = 1): SceneFrame {
  return wide
    ? { left: CARD_EDGE + Math.round(CARD_WIDTH * scale) + CARD_GAP, bottom: 0 }
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
