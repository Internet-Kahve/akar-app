import assert from "node:assert/strict";
import test from "node:test";
import type { PartCard } from "@akar/domain";
import {
  fitHalfAngle,
  NO_FRAME,
  storyCardFrame,
  storyPartCard,
  tourCarriesOn,
} from "./story-scene";

const degrees = (radians: number) => (radians * 180) / Math.PI;

test("with no frame the fit is the camera's own narrower field of view", () => {
  assert.ok(
    Math.abs(degrees(fitHalfAngle(40, 800, 800, NO_FRAME)) - 20) < 1e-9,
  );
  const portrait = Math.atan(Math.tan((20 * Math.PI) / 180) * 0.5);
  assert.ok(Math.abs(fitHalfAngle(40, 400, 800, NO_FRAME) - portrait) < 1e-9);
});

test("a card takes its room from the field of view the model has to fit in", () => {
  const free = fitHalfAngle(40, 390, 400, NO_FRAME);
  const strip = fitHalfAngle(40, 390, 400, storyCardFrame(false));
  assert.ok(strip < free);
  const beside = fitHalfAngle(40, 900, 600, storyCardFrame(true));
  assert.ok(beside < fitHalfAngle(40, 900, 600, NO_FRAME) + 1e-9);
  // A card larger than the canvas still leaves a usable angle.
  assert.ok(fitHalfAngle(40, 100, 100, storyCardFrame(true)) > 0);
});

test("the card sits beside the model on a wide screen and under it on a narrow one", () => {
  assert.deepEqual(Object.keys(storyCardFrame(true)), ["left", "bottom"]);
  assert.equal(storyCardFrame(true).bottom, 0);
  assert.equal(storyCardFrame(false).left, 0);
});

test("a tour carries on only for a sentence about the whole building on the pose it started from", () => {
  assert.equal(tourCarriesOn(true, "a", "a"), true);
  assert.equal(tourCarriesOn(true, "a", "b"), false);
  assert.equal(tourCarriesOn(false, "a", "a"), false);
  assert.equal(
    tourCarriesOn(undefined, "", ""),
    false,
    "no highlightless pose yet",
  );
  assert.equal(tourCarriesOn(true, "", "a"), false, "a touch ended the tour");
});

test("the photo card opens the part card of what the sentence highlights", () => {
  const card = (id: string, parts: string[]) => ({ id, parts }) as PartCard;
  const cards = [card("a", ["Kubbe"]), card("b", ["Tac_Kapi", "Mihrap"])];
  assert.equal(storyPartCard(cards, ["Mihrap"])?.id, "b");
  assert.equal(storyPartCard(cards, ["Minare"]), undefined);
  assert.equal(storyPartCard(cards, []), undefined);
});
