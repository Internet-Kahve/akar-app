import assert from "node:assert/strict";
import { test } from "node:test";
import { hideableInterior, interiorNeeded } from "./interior";

test("a part the cover lifts stays the lift's, and an unknown site hides nothing", () => {
  assert.deepEqual(hideableInterior(["Mihrap", "Kubbe_Ici"], [["Kubbeler", "Kubbe_Ici"]]), ["Mihrap"]);
  assert.deepEqual(hideableInterior(undefined, undefined), []);
});

test("the interior is drawn when the cover opens, the camera goes in, or a sentence is about it", () => {
  const closed = { coverOpen: false, cameraInside: false, parts: ["Cati"], hidden: ["Mihrap"] };
  assert.equal(interiorNeeded(closed), false);
  assert.equal(interiorNeeded({ ...closed, coverOpen: true }), true);
  assert.equal(interiorNeeded({ ...closed, cameraInside: true }), true);
  assert.equal(interiorNeeded({ ...closed, parts: ["Mihrap"] }), true);
});
