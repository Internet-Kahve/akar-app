import assert from "node:assert/strict";
import test from "node:test";
import { gpuDebugWanted } from "./gpu-debug";

test("the diagnostics box is asked for in the query or the hash, stays for the session, and goes with ?debug=off", () => {
  assert.equal(gpuDebugWanted("", "#view=story", null), false);
  assert.equal(gpuDebugWanted("?debug=gpu", "", null), true);
  assert.equal(gpuDebugWanted("", "#view=story&debug=gpu", null), true);
  assert.equal(gpuDebugWanted("", "#view=story", "1"), true);
  assert.equal(gpuDebugWanted("?debug=off", "", "1"), false);
});
