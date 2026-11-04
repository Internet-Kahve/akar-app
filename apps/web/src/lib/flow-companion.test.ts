import assert from "node:assert/strict";
import test from "node:test";
import { companionPlace, flowArc } from "./flow-companion";

test("the companion stands beside the site, smaller, on the same ground, clear of it", () => {
  const place = companionPlace(10, -4, { x: 1, y: 0, z: 0 });
  assert.equal(place.sphere, 7);
  // Centre to centre more than both spheres: they never overlap.
  assert.ok(place.centre.x > 10 + 7);
  assert.equal(place.centre.z, 0);
  // Its centre above the shared ground by most of its own size.
  assert.ok(Math.abs(place.centre.y - (-4 + 7 * 0.7)) < 1e-9);
  // The camera's sphere takes in both.
  assert.ok(place.span >= (place.centre.x + 10 + 7) / 2 - 1e-9);
});

test("the income arc runs from the one that earns to the one it keeps, raised in the middle", () => {
  const arc = flowArc({ x: 20, y: 5, z: 0 }, { x: 0, y: 8, z: 0 }, 6);
  const start = arc.getPoint(0), end = arc.getPoint(1), middle = arc.getPoint(0.5);
  assert.deepEqual([start.x, start.y], [20, 5]);
  assert.deepEqual([end.x, end.y], [0, 8]);
  assert.ok(middle.y > Math.max(start.y, end.y));
});
