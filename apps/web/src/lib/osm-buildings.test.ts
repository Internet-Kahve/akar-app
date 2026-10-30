import test from "node:test";
import assert from "node:assert/strict";
import {
  footprintRing,
  hiddenBuildings,
  interiorPoint,
  isHidden,
  longestEdgeHeading,
  meanPoint,
  pointInRing,
  ringAreaM2,
  ringCentroid,
  setBuildingHidden,
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
  assert.deepEqual(features[0]!.properties, { h: 14, b: 3, i: 1 });
  assert.deepEqual(features[0]!.geometry.coordinates, [beside]);
  assert.equal(visibleBuildings(buildings, []).length, 2);
});

test("centroid of a ring follows its area, not its corner count", () => {
  // An L shape with an extra corner on the long side: the mean of the corners drifts, the centroid does not.
  const square = box(0, 0, 20, 10);
  const [cx, cy] = ringCentroid(square);
  assert.ok(Math.abs((cx - LNG) * M_LNG - 10) < 0.01);
  assert.ok(Math.abs((cy - LAT) * M_LAT - 5) < 0.01);
  const extra: Ring = [
    square[0]!,
    at(5, 0),
    at(20, 0),
    at(20, 10),
    at(0, 10),
    square[0]!,
  ];
  const [ex, ey] = ringCentroid(extra);
  assert.ok(Math.abs((ex - LNG) * M_LNG - 10) < 0.01);
  assert.ok(Math.abs((ey - LAT) * M_LAT - 5) < 0.01);
  assert.deepEqual(ringCentroid([at(0, 0), at(0, 0)]), at(0, 0));
});

test("heading of the longest edge is reduced to a right angle", () => {
  // Long side runs east-west: heading 90 → 0.
  assert.ok(Math.abs(longestEdgeHeading(box(0, 0, 30, 10))) < 0.01);
  // Long side runs north-south.
  assert.ok(Math.abs(longestEdgeHeading(box(0, 0, 10, 30))) < 0.01);
  // Turned 30° clockwise: the long side points 120° from north, which is 30° as a right-angle heading.
  const a = (30 * Math.PI) / 180;
  const turn = (east: number, north: number): LngLat =>
    at(
      east * Math.cos(a) + north * Math.sin(a),
      -east * Math.sin(a) + north * Math.cos(a),
    );
  const turned: Ring = [
    turn(0, 0),
    turn(30, 0),
    turn(30, 10),
    turn(0, 10),
    turn(0, 0),
  ];
  assert.ok(
    Math.abs(longestEdgeHeading(turned) - 30) < 0.1,
    String(longestEdgeHeading(turned)),
  );
  assert.equal(longestEdgeHeading([]), 0);
});

test("hiding and showing one building changes only the points that decide it", () => {
  const footprint = box(-20, -20, 40, 40);
  const rule: HideRule = { footprint, hiddenPoints: [], keptPoints: [] };
  const small = box(0, 0, 10, 10);
  const roof = box(-30, -30, 100, 100);
  // Under the model the automatic rule hides the small building; a big roof stays.
  assert.equal(isHidden(small, [rule]), true);
  assert.equal(isHidden(roof, [rule]), false);

  // Show the automatically hidden one: a kept point appears, no hidden point.
  const shown = setBuildingHidden(small, rule, false, at(5, 5));
  assert.deepEqual(shown.hiddenPoints, []);
  assert.equal(shown.keptPoints.length, 1);
  assert.equal(isHidden(small, [{ ...rule, ...shown }]), false);
  // Hide it again: the kept point goes away and the rule hides it, nothing is added.
  const back = setBuildingHidden(small, { ...rule, ...shown }, true, at(5, 5));
  assert.deepEqual(back, { hiddenPoints: [], keptPoints: [] });

  // Hide a roof by hand, then show it: the hidden point goes away, nothing is added.
  const hiddenRoof = setBuildingHidden(roof, rule, true, at(40, 40));
  assert.equal(hiddenRoof.hiddenPoints.length, 1);
  assert.equal(isHidden(roof, [{ ...rule, ...hiddenRoof }]), true);
  const shownRoof = setBuildingHidden(
    roof,
    { ...rule, ...hiddenRoof },
    false,
    at(40, 40),
  );
  assert.deepEqual(shownRoof, { hiddenPoints: [], keptPoints: [] });

  // A hand-hidden building under the model: showing it needs both the removal and a kept point.
  const both = setBuildingHidden(
    small,
    { ...rule, hiddenPoints: [point(2, 2)] },
    false,
    at(6, 6),
  );
  assert.deepEqual(both.hiddenPoints, []);
  assert.equal(both.keptPoints.length, 1);
  // Points inside other buildings stay.
  const other = setBuildingHidden(
    small,
    { ...rule, hiddenPoints: [point(200, 200)] },
    true,
    at(5, 5),
  );
  assert.equal(other.hiddenPoints.length, 1);
});

test("hiddenBuildings is the complement of visibleBuildings", () => {
  const rule: HideRule = {
    footprint: box(-20, -20, 40, 40),
    hiddenPoints: [],
    keptPoints: [],
  };
  const buildings = splitBuildings([
    tile(poly(box(0, 0, 10, 10))),
    tile(poly(box(-30, -30, 100, 100))),
    tile(poly(box(300, 300, 10, 10))),
  ]);
  assert.equal(hiddenBuildings(buildings, [rule]).length, 1);
  assert.equal(visibleBuildings(buildings, [rule]).length, 2);
});

test("an interior point lies inside bent shapes too", () => {
  assert.equal(
    pointInRing(interiorPoint(box(0, 0, 20, 10)), box(0, 0, 20, 10)),
    true,
  );
  // A "C": its centroid falls into the opening.
  const c: Ring = [
    at(0, 0),
    at(30, 0),
    at(30, 5),
    at(5, 5),
    at(5, 25),
    at(30, 25),
    at(30, 30),
    at(0, 30),
    at(0, 0),
  ];
  assert.equal(pointInRing(ringCentroid(c), c), false);
  assert.equal(pointInRing(interiorPoint(c), c), true);
});
