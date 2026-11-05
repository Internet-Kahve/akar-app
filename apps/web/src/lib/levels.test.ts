import assert from "node:assert/strict";
import test from "node:test";
import { LEVELS, levelOf } from "./levels";

test("levels climb with the score; the bar fills within each level", () => {
  assert.deepEqual(levelOf(0), { id: "yolcu", number: 1, have: 0, next: 60, fraction: 0 });
  assert.equal(levelOf(59).id, "yolcu");
  assert.deepEqual(levelOf(60), { id: "gezgin", number: 2, have: 0, next: 140, fraction: 0 });
  assert.equal(levelOf(130).fraction, 0.5);
  assert.equal(levelOf(450).id, "seyyah");
  assert.deepEqual(levelOf(5000), { id: "bilge", number: 5, have: 4200, next: null, fraction: 1 });
});

test("a bad score reads as zero, never a negative or broken bar", () => {
  assert.equal(levelOf(-25).id, "yolcu");
  assert.equal(levelOf(-25).fraction, 0);
  assert.equal(levelOf(Number.NaN).number, 1);
  assert.equal(levelOf(59.9).id, "yolcu");
  for (let i = 1; i < LEVELS.length; i++) assert.ok(LEVELS[i]!.min > LEVELS[i - 1]!.min);
});
