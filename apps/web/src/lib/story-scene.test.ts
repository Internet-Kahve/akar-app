import assert from "node:assert/strict";
import test from "node:test";
import type { PartCard } from "@akar/domain";
import {
  fitHalfAngle,
  NO_FRAME,
  storyCardFrame,
  treeBlocksView,
  clampCardScale,
  resizedCardScale,
  storyPartCard,
  tourCarriesOn,
  looksForFreeView,
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

test("the photo card's size stays between its bounds, and the model's frame grows with it", () => {
  assert.equal(clampCardScale(3), 1.6);
  assert.equal(clampCardScale(0.2), 0.75);
  assert.equal(storyCardFrame(true, 1.5).left, 20 + 480 + 12);
  assert.equal(storyCardFrame(false, 1.5).bottom, 12 + 144 + 12);
  // On a real phone the card is 22% of the screen: the camera reserves that, whatever the size step.
  assert.equal(storyCardFrame(false, 1.5, 800).bottom, 8 + 176 + 8);
  assert.equal(storyCardFrame(false, 1, 800).bottom, storyCardFrame(false, 1.6, 800).bottom);
  // Wide: the corner's horizontal move sets the width; 160 px more is half again.
  assert.equal(resizedCardScale(1, true, 160, 999, false), 1.5);
  // Phone strip at the bottom: dragging its corner up enlarges it; once moved, dragging down does.
  assert.equal(resizedCardScale(1, false, 0, -48, true), 1.5);
  assert.equal(resizedCardScale(1, false, 0, 48, false), 1.5);
});

test("a hand-placed camera is left alone; a file's close pose looks for a free view", () => {
  const pose = { target: "Mihrap", distance: 0.1 };
  assert.equal(looksForFreeView(pose, 0.4), true);
  assert.equal(looksForFreeView({ ...pose, exact: true }, 0.4), false);
  assert.equal(looksForFreeView({ ...pose, distance: 0.6 }, 0.4), false);
  assert.equal(looksForFreeView({ target: null, distance: 0.1 }, 0.4), false);
});

test("only a tree on the line of sight or around the camera stands aside", () => {
  const camera = { x: 0, y: 10, z: 50 };
  const target = { x: 0, y: 0, z: 0 };
  assert.equal(treeBlocksView(camera, target, { x: 0, y: 5, z: 25 }, 3), true);
  assert.equal(treeBlocksView(camera, target, { x: 0, y: 11, z: 51 }, 3), true);
  assert.equal(treeBlocksView(camera, target, { x: 20, y: 5, z: 25 }, 3), false);
  // Behind the camera or behind what it looks at: not in the way.
  assert.equal(treeBlocksView(camera, target, { x: 0, y: 12, z: 60 }, 3), false);
  assert.equal(treeBlocksView(camera, target, { x: 0, y: 0, z: -20 }, 3), false);
});
