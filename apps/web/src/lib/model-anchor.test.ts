import test from "node:test";
import assert from "node:assert/strict";
import { BoxGeometry, Group, Mesh } from "three";
import { modelBase } from "./model-anchor";

/** Vector → array with -0 turned into 0, so `deepEqual` compares values. */
const xyz = (v: { toArray(): number[] }) => v.toArray().map((n) => n + 0);
const part = (
  name: string,
  size: [number, number, number],
  at: [number, number, number],
) => {
  const mesh = new Mesh(new BoxGeometry(...size));
  mesh.name = name;
  mesh.position.set(...at);
  return mesh;
};
/** Main body 10 × 4 × 6 m centred at x = 20; a yard to the west and south; scenery that must not count. */
const scene = () => {
  const root = new Group();
  root.add(part("Govde", [10, 4, 6], [20, 2, 0]));
  root.add(part("Avlu", [8, 1, 8], [8, 0.5, 5]));
  root.add(part("Zemin", [200, 0.2, 200], [0, -1, 0]));
  const surroundings = new Group();
  surroundings.name = "Cevre_Agaclar";
  surroundings.add(part("Agac", [2, 30, 2], [-60, 15, 40]));
  root.add(surroundings);
  return root;
};

test("the centre comes from the anchor part and the bottom from the remaining parts", () => {
  const base = modelBase(scene(), "Govde");
  assert.deepEqual(xyz(base.offset), [-20, 0, 0]);
  // Relative to the anchor's centre: the yard sticks out, scenery counts for nothing.
  assert.deepEqual(base.footprint, { minX: -16, maxX: 5, minZ: -3, maxZ: 9 });
  assert.deepEqual(xyz(base.size), [21, 4, 12]);
});

test("without an anchor the centre is the middle of the remaining parts", () => {
  for (const anchor of [null, "", "YokBoyleParca"]) {
    const base = modelBase(scene(), anchor);
    assert.deepEqual(xyz(base.offset), [-14.5, 0, -3]);
    assert.equal(base.footprint.minX, -10.5);
    assert.equal(base.footprint.maxX, 10.5);
  }
});

test("a presentation part is never the anchor", () => {
  assert.deepEqual(xyz(modelBase(scene(), "Zemin").offset), [-14.5, 0, -3]);
});

test("the model rests on the ground even when its parts float or sink", () => {
  const root = new Group();
  root.add(part("Govde", [4, 2, 4], [0, 10, 0]));
  root.add(part("Zemin", [50, 1, 50], [0, -5, 0]));
  assert.equal(modelBase(root, "Govde").offset.y, -9);
});

test("parent transforms count", () => {
  const root = new Group();
  const wing = new Group();
  wing.position.set(100, 0, -50);
  wing.add(part("Govde", [10, 4, 10], [0, 2, 0]));
  root.add(wing);
  assert.deepEqual(xyz(modelBase(root, "Govde").offset), [-100, 0, 50]);
});

test("a model with nothing but scenery falls back to all of it; an empty one to the origin", () => {
  const root = new Group();
  root.add(part("Zemin", [10, 2, 10], [4, 1, 4]));
  assert.deepEqual(xyz(modelBase(root, null).offset), [-4, 0, -4]);
  assert.deepEqual(xyz(modelBase(new Group(), null).offset), [0, 0, 0]);
});
