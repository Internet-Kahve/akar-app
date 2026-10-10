import test from "node:test";
import assert from "node:assert/strict";
import {
  reduceSnapshot,
  filterSites,
  validateSite,
  type Memory,
} from "./index";
import { createSeed } from "../../api-client/src/seed";
test("Turkish search normalizes dotted I and filters by type", () => {
  const state = createSeed();
  assert.equal(filterSites(state.sites, "KILIC ALI").length, 2);
  assert.equal(filterSites(state.sites, "çeşme", "cesme").length, 2);
  assert.equal(filterSites(state.sites, "", "cami", []).length, 0);
});
test("repeat visit, read, and quiz commands never duplicate points", () => {
  let state = createSeed();
  for (let i = 0; i < 3; i++)
    for (const type of ["visit", "read", "quiz"] as const)
      state = reduceSnapshot(state, { type, siteId: "kilic-ali-pasa" });
  assert.equal(state.points, 135);
  assert.equal(state.visitedIds.length, 1);
});
test("memory is pending, approval is idempotent, rejection requires a reason", () => {
  const memory: Memory = {
    id: "memory-1",
    siteId: "kilic-ali-pasa",
    text: "Avluda güzel bir sabah.",
    status: "approved",
    createdAt: "2026-10-10",
    author: "Gezgin",
  };
  let state = reduceSnapshot(createSeed(), { type: "memory", memory });
  assert.equal(state.memories[0].status, "pending");
  assert.equal(state.points, 0);
  assert.throws(
    () =>
      reduceSnapshot(state, {
        type: "moderate",
        id: memory.id,
        status: "rejected",
      }),
    /Ret nedeni/,
  );
  for (let i = 0; i < 3; i++)
    state = reduceSnapshot(state, {
      type: "moderate",
      id: memory.id,
      status: "approved",
    });
  assert.equal(state.points, 25);
  assert.equal(state.memories[0].status, "approved");
});
test("draft may lack source, publishing and coordinates are validated", () => {
  const site = {
    ...createSeed().sites[0],
    source: "",
    status: "draft" as const,
  };
  assert.doesNotThrow(() => validateSite(site));
  assert.throws(() => validateSite({ ...site, status: "published" }), /kaynak/);
  assert.throws(
    () => validateSite({ ...site, coordinates: [28, 91] }),
    /enlem/,
  );
});
test("updates do not mutate previous snapshots; routes deduplicate and reject unknown sites", () => {
  const original = createSeed();
  const next = reduceSnapshot(original, {
    type: "save",
    siteId: "kilic-ali-pasa",
  });
  assert.equal(original.savedIds.length, 0);
  assert.equal(next.savedIds.length, 1);
  const route = reduceSnapshot(next, {
    type: "set-route",
    siteIds: ["bad", "kilic-ali-pasa", "kilic-ali-pasa"],
  });
  assert.deepEqual(route.routeIds, ["kilic-ali-pasa"]);
});
