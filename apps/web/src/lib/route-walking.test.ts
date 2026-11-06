import assert from "node:assert/strict";
import test from "node:test";
import type { HeritageRoute, RouteLeg } from "@akar/domain";
import { walkingLeg } from "./route-walking";

const ab: RouteLeg = { coordinates: [[29, 40], [29.001, 40.001]], meters: 150, seconds: 110 };
const route: HeritageRoute = {
  id: "r",
  name: "R",
  description: "",
  siteIds: ["a", "b", "c"],
  minutes: 10,
  distance: "300 m",
  theme: "",
  walking: "partial",
  legs: [ab, null],
};

test("a leg is used only for the pair it was computed for", () => {
  assert.equal(walkingLeg(route, "a", "b"), ab);
  // Not computed yet: schematic.
  assert.equal(walkingLeg(route, "b", "c"), null);
  // A hidden middle stop or another order joins different stops: the stored path does not fit.
  assert.equal(walkingLeg(route, "a", "c"), null);
  assert.equal(walkingLeg(route, "b", "a"), null);
  assert.equal(walkingLeg(undefined, "a", "b"), null);
});
