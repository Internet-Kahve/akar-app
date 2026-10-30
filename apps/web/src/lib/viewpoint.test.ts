import assert from "node:assert/strict";
import test from "node:test";
import type { HeritageSite } from "@akar/domain";
import { bearingTo, seenFrom, sees, viewCone } from "./viewpoint";

const view = { lng: 29, lat: 40, bearingDeg: 0, fieldDeg: 60, interior: false };

test("bearingTo reads clockwise from north", () => {
  assert.ok(Math.abs(bearingTo([29, 40], [29, 40.01])) < 1e-6);
  assert.ok(Math.abs(bearingTo([29, 40], [29.01, 40]) - 90) < 1e-6);
});

test("sees keeps to the field of view and the reach", () => {
  assert.equal(sees(view, [29, 40.005]), true);
  assert.equal(sees(view, [29.01, 40]), false);
  assert.equal(sees(view, [29, 40.1]), false);
  assert.equal(sees({ ...view, bearingDeg: 350 }, [29.0005, 40.005]), true);
});

test("the cone closes on its viewpoint", () => {
  const ring = viewCone(view);
  assert.deepEqual(ring[0], [29, 40]);
  assert.deepEqual(ring.at(-1), [29, 40]);
});

test("seenFrom lists other sites' outdoor photographs, nearest first", () => {
  const site = (id: string, images: unknown[]) =>
    ({ id, coordinates: [29, 40.005], historyImages: images }) as HeritageSite;
  const image = (id: string, lat: number, interior = false) => ({
    id,
    viewpoint: { ...view, lat, interior },
  });
  const found = seenFrom(site("here", [image("own", 40)]), [
    site("here", [image("own", 40)]),
    site("a", [image("far", 40), image("near", 40.004), image("inside", 40.004, true)]),
  ]);
  assert.deepEqual(found.map((f) => f.image.id), ["near", "far"]);
});
