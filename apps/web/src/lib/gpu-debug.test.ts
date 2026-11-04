import assert from "node:assert/strict";
import test from "node:test";
import { gpuDebugWanted } from "./gpu-debug";

test("the diagnostics box shows only while ?akar-debug=gpu is in the address; the old ?debug=gpu shows nothing", () => {
  assert.equal(gpuDebugWanted("", "#view=story"), false);
  assert.equal(gpuDebugWanted("?debug=gpu", ""), false);
  assert.equal(gpuDebugWanted("?akar-debug=gpu", ""), true);
  assert.equal(gpuDebugWanted("", "#view=story&akar-debug=gpu"), true);
});
