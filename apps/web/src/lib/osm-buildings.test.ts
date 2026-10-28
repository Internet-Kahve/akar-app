import test from "node:test";
import assert from "node:assert/strict";
import {
  footprintRing,
  isHidden,
  meanPoint,
  pointInRing,
  ringAreaM2,
  splitBuildings,
  visibleBuildings,
  type HideRule,
  type LngLat,
  type Ring,
} from "./osm-buildings";

const LAT = 40.184;
const LNG = 29.062;
const M_LNG = 111_320 * Math.cos((LAT * Math.PI) / 180);
const M_LAT = 110_540;
/** Closed square ring of `w` × `h` metres, its south-west corner `east`/`north` metres from the origin. */
const box = (east: number, north: number, w: number, h: number): Ring => {
  const ring: Ring = [
    [LNG + east / M_LNG, LAT + north / M_LAT],
    [LNG + (east + w) / M_LNG, LAT + north / M_LAT],
    [LNG + (east + w) / M_LNG, LAT + (north + h) / M_LAT],
    [LNG + east / M_LNG, LAT + (north + h) / M_LAT],
  ];
  return [...ring, ring[0]!];
};
const at = (east: number, north: number): LngLat => [
  LNG + east / M_LNG,
  LAT + north / M_LAT,
];
const point = (east: number, north: number) => {
  const [lng, lat] = at(east, north);
  return { lng, lat };
};
const poly = (ring: Ring) => ({ type: "Polygon", coordinates: [ring] });
const tile = (geometry: object, height = 12, base = 0) => ({
  geometry: geometry as { type: string; coordinates?: unknown },
  properties: { render_height: height, render_min_height: base },
});

test("point in ring", () => {
  const ring = box(0, 0, 20, 10);
  assert.equal(pointInRing(at(10, 5), ring), true);
  assert.equal(pointInRing(at(25, 5), ring), false);
  assert.equal(pointInRing(at(10, -1), ring), false);
  // Concave L shape: the notch is outside.
  const l: Ring = [
    at(0, 0),
    at(20, 0),
    at(20, 5),
    at(5, 5),
    at(5, 20),
    at(0, 20),
    at(0, 0),
  ];
  assert.equal(pointInRing(at(2, 15), l), true);
  assert.equal(pointInRing(at(12, 12), l), false);
});

test("area in square metres", () => {
  const area = ringAreaM2(box(0, 0, 30, 20));
  assert.ok(Math.abs(area - 600) < 6, `area ${area}`);
  assert.equal(ringAreaM2([]), 0);
});

test("mean point counts a closed ring's first point once", () => {
  const [x, y] = meanPoint(box(0, 0, 20, 10));
  const [ex, ey] = at(10, 5);
  assert.ok(Math.abs(x - ex) < 1e-9 && Math.abs(y - ey) < 1e-9);
});

test("footprint ring: size, padding, scale and heading", () => {
  const bounds = { minX: -10, maxX: 10, minZ: -5, maxZ: 5 };
  const base = { lng: LNG, lat: LAT, headingDeg: 0, scale: 1 };
  const area = (ring: Ring) => ringAreaM2(ring);
  // 20 × 10 m plus 3 m on every side.
  assert.ok(Math.abs(area(footprintRing(base, bounds)) - 26 * 16) < 4);
  assert.ok(Math.abs(area(footprintRing(base, bounds, 0)) - 200) < 3);
  assert.ok(
    Math.abs(area(footprintRing({ ...base, scale: 2 }, bounds, 0)) - 800) < 12,
  );
  // Unrotated: the long side runs east-west. At 90° it runs north-south.
  const span = (ring: Ring) => {
    const xs = ring.map((p) => p[0] * M_LNG);
    const ys = ring.map((p) => p[1] * M_LAT);
    return [
      Math.max(...xs) - Math.min(...xs),
      Math.max(...ys) - Math.min(...ys),
    ];
  };
  const [w0, h0] = span(footprintRing(base, bounds, 0));
  assert.ok(Math.abs(w0 - 20) < 0.1 && Math.abs(h0 - 10) < 0.1);
  const [w90, h90] = span(
    footprintRing({ ...base, headingDeg: 90 }, bounds, 0),
  );
  assert.ok(Math.abs(w90 - 10) < 0.1 && Math.abs(h90 - 20) < 0.1);
  // A body offset to the south-east of the base point turns clockwise with the heading: at 90° it lies south-west.
  const off = { minX: 10, maxX: 20, minZ: 10, maxZ: 20 };
  const [mx, my] = meanPoint(
    footprintRing({ ...base, headingDeg: 90 }, off, 0),
  );
  assert.ok(mx < LNG && my < LAT, `${mx} ${my}`);
});

test("split: MultiPolygon into buildings, short rings skipped, tile duplicates dropped", () => {
  const a = box(0, 0, 10, 10);
  const b = box(30, 0, 10, 10);
  const buildings = splitBuildings([
    tile({ type: "MultiPolygon", coordinates: [[a], [b]] }, 20, 2),
    // The same building from the neighbouring tile.
    tile(poly(a), 20, 2),
    tile(poly([at(0, 0), at(1, 1), at(0, 0)])),
    tile({ type: "Point", coordinates: at(0, 0) }),
    { geometry: poly(box(60, 0, 10, 10)) },
  ]);
  assert.equal(buildings.length, 3);
  assert.deepEqual(
    buildings.map((x) => [x.height, x.base]),
    [
      [20, 2],
      [20, 2],
      [0, 0],
    ],
  );
  assert.deepEqual(buildings[0]!.polygon, [a]);
});

const model = (extra: Partial<HideRule> = {}): HideRule => ({
  footprint: box(0, 0, 40, 30),
  hiddenPoints: [],
  keptPoints: [],
  ...extra,
});

test("auto rule: mean inside the footprint and smaller than 1.6 × its area", () => {
  const rules = [model()];
  assert.equal(isHidden(box(10, 10, 15, 10), rules), true);
  // Centre outside the footprint.
  assert.equal(isHidden(box(50, 10, 10, 10), rules), false);
  // A bazaar roof 3 × the footprint: its centre is inside, it stays.
  assert.equal(isHidden(box(-40, -30, 120, 90), rules), false);
});

test("hiddenPoints hide a building the auto rule leaves", () => {
  const outer = box(100, 100, 20, 20);
  assert.equal(isHidden(outer, [model()]), false);
  assert.equal(
    isHidden(outer, [model({ hiddenPoints: [point(110, 110)] })]),
    true,
  );
  assert.equal(
    isHidden(outer, [model({ hiddenPoints: [point(300, 300)] })]),
    false,
  );
});

test("keptPoints bring back a building the auto rule hides, for their own model", () => {
  const outer = box(10, 10, 15, 10);
  const kept = [point(12, 12)];
  assert.equal(isHidden(outer, [model({ keptPoints: kept })]), false);
  // A point outside the building changes nothing.
  assert.equal(isHidden(outer, [model({ keptPoints: [point(80, 80)] })]), true);
  // Another model's footprint over the same building still hides it.
  assert.equal(isHidden(outer, [model({ keptPoints: kept }), model()]), true);
});

test("a hidden point wins over a kept point in the same building", () => {
  const outer = box(10, 10, 15, 10);
  const rules = [
    model({ hiddenPoints: [point(20, 15)], keptPoints: [point(12, 12)] }),
  ];
  assert.equal(isHidden(outer, rules), true);
});

test("visible buildings carry height and base for the extrusion", () => {
  const under = box(10, 10, 15, 10);
  const beside = box(100, 0, 10, 10);
  const buildings = splitBuildings([
    tile(poly(under), 9, 0),
    tile(poly(beside), 14, 3),
  ]);
  const features = visibleBuildings(buildings, [model()]);
  assert.equal(features.length, 1);
  assert.deepEqual(features[0]!.properties, { h: 14, b: 3 });
  assert.deepEqual(features[0]!.geometry.coordinates, [beside]);
  assert.equal(visibleBuildings(buildings, []).length, 2);
});
