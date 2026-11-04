import assert from "node:assert/strict";
import test from "node:test";
import { isAppleTouch } from "./device";

test("an iPhone, an iPad and an iPadOS «Macintosh» with a touch screen are Apple touch devices; a Mac is not", () => {
  assert.equal(isAppleTouch("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1"), true);
  assert.equal(isAppleTouch("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15", 5), true);
  assert.equal(isAppleTouch("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15", 0), false);
  assert.equal(isAppleTouch("Mozilla/5.0 (Linux; Android 11; M2010J19SG) Chrome/118"), false);
});
