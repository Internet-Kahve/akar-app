import assert from "node:assert/strict";
import { test } from "node:test";
import { consumeNativeBack, registerNativeBack } from "./native-back";

test("nested screens handle Android Back before root navigation, and cleanup restores navigation", () => {
  const calls: string[] = [];
  const child = registerNativeBack(() => {
    calls.push("camera");
    return true;
  }, 10);
  const root = registerNativeBack((canGoBack) => {
    calls.push(`root:${canGoBack}`);
    return canGoBack;
  });
  try {
    assert.equal(consumeNativeBack(true), true);
    assert.deepEqual(calls, ["camera"]);
    child();
    assert.equal(consumeNativeBack(true), true);
    assert.equal(consumeNativeBack(false), false);
    assert.deepEqual(calls, ["camera", "root:true", "root:false"]);
  } finally {
    child();
    root();
  }
  assert.equal(consumeNativeBack(true), false);
});
