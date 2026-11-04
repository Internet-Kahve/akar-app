import assert from "node:assert/strict";
import { test } from "node:test";
import { spreadOrder } from "./part-order";

/** A seeded random, so a failure can be repeated. */
const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

test("the show-parts order lights every card once", () => {
  for (let seed = 1; seed < 30; seed++) {
    const order = spreadOrder([{ x: 0, y: 0, z: 0 }, null, { x: 5, y: 0, z: 0 }, { x: 9, y: 1, z: 0 }], seeded(seed));
    assert.deepEqual([...order].sort(), [0, 1, 2, 3]);
  }
});

test("two neighbouring parts are not lit one after the other while a far one is left", () => {
  // Ten parts in a row, one metre apart.
  const row = Array.from({ length: 10 }, (_, i) => ({ x: i, y: 0, z: 0 }));
  for (let seed = 1; seed < 50; seed++) {
    const order = spreadOrder(row, seeded(seed));
    // Until only a few close ones are left, every step jumps more than a neighbour away.
    for (let i = 1; i < row.length - 3; i++) assert.ok(Math.abs(order[i] - order[i - 1]) > 1, `seed ${seed}: ${order}`);
  }
});

test("the order changes from one press to the next", () => {
  const row = Array.from({ length: 8 }, (_, i) => ({ x: i, y: 0, z: 0 }));
  const orders = new Set(Array.from({ length: 20 }, (_, seed) => spreadOrder(row, seeded(seed + 1)).join()));
  assert.ok(orders.size > 5);
});
