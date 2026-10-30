import assert from "node:assert/strict";
import test from "node:test";
import { clampSheet, settleSheet, toggleSheet } from "./bottom-sheet";

test("a sheet rests where it was left, except near its ends", () => {
  assert.equal(settleSheet(150, 112, 1000), 112);
  assert.equal(settleSheet(500, 112, 1000), 500);
  assert.equal(settleSheet(890, 112, 1000), 920);
});

test("clampSheet keeps the sheet between its stops", () => {
  assert.equal(clampSheet(10, 112, 1000), 112);
  assert.equal(clampSheet(5000, 112, 1000), 920);
});

test("the handle toggles between closed and half", () => {
  assert.equal(toggleSheet(112, 112, 1000), 550);
  assert.equal(toggleSheet(550, 112, 1000), 112);
});
