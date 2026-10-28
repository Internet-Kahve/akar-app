import test from "node:test";
import assert from "node:assert/strict";
import {
  arrowStep,
  defaultPlacement,
  normalizeHeading,
  nudge,
  rotate90,
  toDraft,
} from "./placement";

test("an unplaced model starts on the site, facing north, shown", () => {
  assert.deepEqual(defaultPlacement([29.06, 40.18]), {
    lng: 29.06,
    lat: 40.18,
    headingDeg: 0,
    scale: 1,
    altitudeM: 0,
    anchorNode: null,
    hiddenPoints: [],
    keptPoints: [],
    visible: true,
  });
  const public_ = { ...defaultPlacement([1, 2]) } as Partial<
    ReturnType<typeof defaultPlacement>
  >;
  delete public_.visible;
  assert.equal(toDraft(public_ as never).visible, true);
  assert.equal(
    toDraft({ ...defaultPlacement([1, 2]), visible: false }).visible,
    false,
  );
});

test("heading wraps to 0 ≤ x < 360 in half degrees", () => {
  assert.equal(normalizeHeading(360), 0);
  assert.equal(normalizeHeading(-90), 270);
  assert.equal(normalizeHeading(359.8), 0);
  assert.equal(normalizeHeading(12.3), 12.5);
  assert.equal(normalizeHeading(450), 90);
});

test("a quarter turn adds 90 and wraps", () => {
  const p = { ...defaultPlacement([29, 40]), headingDeg: 45 };
  assert.equal(rotate90(p).headingDeg, 135);
  assert.equal(rotate90(rotate90(rotate90(rotate90(p)))).headingDeg, 45);
  assert.equal(rotate90({ ...p, headingDeg: 300 }).headingDeg, 30);
});

test("a step moves the model by metres", () => {
  const p = defaultPlacement([29.062, 40.184]);
  const east = nudge(p, 0.5, 0);
  const north = nudge(p, 0, 0.5);
  assert.ok(
    Math.abs(
      (east.lng - p.lng) * 111_320 * Math.cos((40.184 * Math.PI) / 180) - 0.5,
    ) < 0.02,
  );
  assert.equal(east.lat, p.lat);
  assert.ok(Math.abs((north.lat - p.lat) * 110_540 - 0.5) < 0.02);
  assert.equal(north.lng, p.lng);
  // Back and forth lands on the same spot.
  assert.deepEqual(nudge(nudge(p, 0.5, 0.5), -0.5, -0.5), p);
});

test("arrow keys map to half-metre steps", () => {
  assert.deepEqual(arrowStep("ArrowLeft"), [-0.5, 0]);
  assert.deepEqual(arrowStep("ArrowUp"), [0, 0.5]);
  assert.equal(arrowStep("a"), null);
});
