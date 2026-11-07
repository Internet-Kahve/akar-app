import { test } from "node:test";
import assert from "node:assert/strict";
import { formatDistance, nearStop, stopDistance } from "./walk-position";

test("near a stop as the API decides: within 30 m once up to 50 m of the device's accuracy is forgiven", () => {
  assert.equal(nearStop(25, 5), true);
  assert.equal(nearStop(60, 40), true);
  assert.equal(nearStop(90, 200), false, "accuracy forgiven no further than 50 m");
  assert.equal(nearStop(45, 0), false);
});

test("the distance reads in tens of metres, then kilometres with one decimal", () => {
  assert.equal(formatDistance(3, "tr"), "10 m");
  assert.equal(formatDistance(124, "tr"), "120 m");
  assert.equal(formatDistance(1234, "tr"), "1,2 km");
  assert.equal(formatDistance(1234, "en"), "1.2 km");
  assert.equal(stopDistance(undefined, [29, 40]), null);
  assert.ok(Math.abs(stopDistance([29.0613, 40.1841], [29.0613, 40.1850])! - 100) < 2);
});
