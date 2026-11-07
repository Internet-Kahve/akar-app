import assert from "node:assert/strict";
import test from "node:test";
import { poseSummary, zoomText } from "./pose-summary";

test("the zoom the editor made shows in the summary, not only the distance word", () => {
  const pose = { target: null, azimuthDeg: 354.4, elevationDeg: 22, distance: 0.48 };
  assert.equal(poseSummary(pose), "Merkez · 354° · eğim 22° · yakın · yakınlaştırma 2,1×");
  // Two zooms the word lists the same («orta») are told apart.
  assert.notEqual(poseSummary({ ...pose, distance: 0.55 }), poseSummary({ ...pose, distance: 0.66 }));
});

test("zoom text: whole model is 1,0×, zoomed out below 1", () => {
  assert.equal(zoomText(1), "1,0×");
  assert.equal(zoomText(2), "0,5×");
  assert.equal(poseSummary(null), "");
});
