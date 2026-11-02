import assert from "node:assert/strict";
import test from "node:test";
import { clampSheet, mapSheetStops, settleSheet, siteCardStops, toggleSheet } from "./bottom-sheet";

const map = mapSheetStops(112, 1000);

test("a sheet rests where it was left, except near its ends", () => {
  assert.equal(settleSheet(150, map), 112);
  assert.equal(settleSheet(500, map), 500);
  assert.equal(settleSheet(890, map), 920);
});

test("clampSheet keeps the sheet between its stops", () => {
  assert.equal(clampSheet(10, map), 112);
  assert.equal(clampSheet(5000, map), 920);
});

test("the map sheet's handle toggles between closed and half", () => {
  assert.equal(toggleSheet(112, map), 550);
  assert.equal(toggleSheet(550, map), 112);
});

test("a site's card opens all the way, to its content or 75 % of the screen", () => {
  const short = siteCardStops(194, 500, 844);
  assert.equal(short.highest, 500);
  assert.equal(toggleSheet(194, short), 500);
  assert.equal(toggleSheet(500, short), 194);
  const long = siteCardStops(194, 1400, 844);
  assert.equal(long.highest, 633);
  assert.equal(clampSheet(900, long), 633);
  // A card whose content is no taller than its top part does not move.
  assert.equal(siteCardStops(194, 150, 844).highest, 194);
});
