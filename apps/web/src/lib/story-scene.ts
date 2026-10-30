import type { PartCard } from "@akar/domain";

/** What covers the 3D canvas, in pixels from its left and bottom edges; the model stays in the rest. */
export type SceneFrame = { left: number; bottom: number };
export const NO_FRAME: SceneFrame = { left: 0, bottom: 0 };

/** The story's photo card: beside the model on a wide screen, a strip under it on a narrow one (`.story-photo-card`). */
const CARD_WIDTH = 320;
const CARD_STRIP_HEIGHT = 96;
const CARD_EDGE = 20;
const CARD_GAP = 12;

export function storyCardFrame(wide: boolean): SceneFrame {
  return wide
    ? { left: CARD_EDGE + CARD_WIDTH + CARD_GAP, bottom: 0 }
    : { left: 0, bottom: CARD_GAP + CARD_STRIP_HEIGHT + CARD_GAP };
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
