import assert from "node:assert/strict";
import test from "node:test";
import { distanceM, nearestCity, nearestFirst } from "./nearby";

test("distanceM measures metres on the ground", () => {
  const metres = distanceM([29.06, 40.18], [29.07, 40.18]);
  assert.ok(metres > 840 && metres < 860, String(metres));
});

test("nearestFirst sorts without touching the input", () => {
  const sites = [
    { id: "far", coordinates: [29.2, 40.3] as [number, number] },
    { id: "near", coordinates: [29.06, 40.18] as [number, number] },
  ];
  assert.deepEqual(
    nearestFirst(sites, [29.06, 40.18]).map((s) => s.id),
    ["near", "far"],
  );
  assert.equal(sites[0]!.id, "far");
});

test("nearestCity skips cities with no map view", () => {
  const cities = [
    { id: "none", map: null },
    { id: "bursa", map: { center: [29.06, 40.18] as [number, number] } },
    { id: "konya", map: { center: [32.49, 37.87] as [number, number] } },
  ];
  assert.equal(nearestCity(cities, [29, 40])?.id, "bursa");
  assert.equal(nearestCity([{ id: "none", map: null }], [29, 40]), null);
});
