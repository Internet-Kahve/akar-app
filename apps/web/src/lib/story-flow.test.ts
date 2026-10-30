import assert from "node:assert/strict";
import test from "node:test";
import { distanceM } from "./nearby";
import { flowArc, flowEnd } from "./story-flow";

test("a near target is reached, a far one only pointed at", () => {
  const near: [number, number] = [29.06, 40.183];
  assert.deepEqual(flowEnd([29.06, 40.18], near), near);
  const end = flowEnd([29.06, 40.18], [28.95, 41.01]);
  assert.ok(Math.abs(distanceM([29.06, 40.18], end) - 240) < 2);
});

test("the arc starts and ends on its points and bows off the straight line", () => {
  const arc = flowArc([0, 0], [1, 0]);
  assert.deepEqual(arc[0], [0, 0]);
  assert.deepEqual(arc.at(-1), [1, 0]);
  assert.ok(arc[24]![1] > 0.2);
});
