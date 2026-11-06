import assert from "node:assert/strict";
import test from "node:test";
import { isAppleTouch, mapAntialias, modelMotionRatio, modelRatioCap } from "./device";

test("an iPhone, an iPad and an iPadOS «Macintosh» with a touch screen are Apple touch devices; a Mac is not", () => {
  assert.equal(isAppleTouch("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1"), true);
  assert.equal(isAppleTouch("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15", 5), true);
  assert.equal(isAppleTouch("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15", 0), false);
  assert.equal(isAppleTouch("Mozilla/5.0 (Linux; Android 11; M2010J19SG) Chrome/118"), false);
});

test("while moving the viewer draws fewer pixels, never more than at rest", () => {
  assert.equal(modelMotionRatio(2, false), 1.5);
  assert.equal(modelMotionRatio(1.5, true), 1);
  assert.equal(modelMotionRatio(1, false), 1);
});

test("phones draw lighter: the map antialiases on a computer only; the 3D is 2 on a computer and an iPhone, 1.5 on other phones", () => {
  assert.equal(mapAntialias({ modest: false, touch: false }), true);
  assert.equal(mapAntialias({ modest: false, touch: true }), false);
  assert.equal(mapAntialias({ modest: true, touch: false }), false);
  assert.equal(modelRatioCap({ modest: false, apple: false, touch: false }), 2);
  assert.equal(modelRatioCap({ modest: false, apple: true, touch: true }), 2);
  assert.equal(modelRatioCap({ modest: false, apple: false, touch: true }), 1.5);
  assert.equal(modelRatioCap({ modest: true, apple: false, touch: true }), 1.25);
});
