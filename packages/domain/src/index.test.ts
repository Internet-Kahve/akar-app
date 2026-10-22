import test from "node:test";
import assert from "node:assert/strict";
import {
  reduceSnapshot,
  filterSites,
  validateSite,
  memoryPermissions,
  type Memory,
} from "./index";
import { createSeed } from "../../api-client/src/seed";
test("Turkish search normalizes dotted I and filters by type", () => {
  const state = createSeed();
  assert.equal(filterSites(state.sites, "KOZA HANI").length, 1);
  assert.equal(filterSites(state.sites, "çeşme", "cesme").length, 1);
  assert.equal(filterSites(state.sites, "", "cami", []).length, 0);
});
test("repeat visit and read commands never duplicate points", () => {
  let state = createSeed();
  for (let i = 0; i < 3; i++)
    for (const type of ["visit", "read"] as const)
      state = reduceSnapshot(state, { type, siteId: "ulu-cami" });
  assert.equal(state.points, 115);
  assert.equal(state.visitedIds.length, 1);
});
test("memory is pending, approval is idempotent, rejection requires a reason", () => {
  const memory: Memory = {
    id: "memory-1",
    siteId: "ulu-cami",
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
    siteId: "ulu-cami",
  });
  assert.equal(original.savedIds.length, 0);
  assert.equal(next.savedIds.length, 1);
  const route = reduceSnapshot(next, {
    type: "set-route",
    siteIds: ["bad", "ulu-cami", "ulu-cami"],
  });
  assert.deepEqual(route.routeIds, ["ulu-cami"]);
});

test("photo publications require valid cover, licenses and cue references; drafts remain editable", () => {
  const site = {
    ...createSeed().sites[0],
    editorVersion: 2 as const,
    status: "draft" as const,
    photos: [],
    sources: [],
  };
  assert.doesNotThrow(() =>
    validateSite({ ...site, name: "", description: "" }),
  );
  assert.throws(
    () => validateSite({ ...site, status: "published" }),
    /Kapak fotoğrafı/,
  );
  const source = {
    id: "source",
    title: "Demo archive",
    kind: "archive" as const,
    author: "",
    year: "",
    page: "",
    url: "",
    trust: "representative" as const,
  };
  const photo = {
    id: "photo",
    src: "data:image/png;base64,demo",
    alt: "Test photo",
    title: "",
    titleEn: "",
    description: "",
    license: "CC0",
    sourceId: source.id,
    trust: "representative" as const,
  };
  const complete = {
    ...site,
    status: "published" as const,
    coverPhotoId: photo.id,
    photos: [photo],
    sources: [source],
    stories: [{ ...site.stories[0], sourceId: source.id, photoId: photo.id }],
  };
  assert.doesNotThrow(() => validateSite(complete));
  assert.throws(
    () => validateSite({ ...complete, photos: [{ ...photo, license: "" }] }),
    /lisans/,
  );
  assert.throws(
    () =>
      validateSite({
        ...complete,
        stories: [{ ...complete.stories[0], sourceId: "missing" }],
      }),
    /kaynak bağla/,
  );
  assert.throws(
    () =>
      validateSite({
        ...complete,
        stories: [{ ...complete.stories[0], highlights: ["missing"] }],
      }),
    /vurgu/,
  );
});

test("inventory imports never publish or overwrite duplicates and fail atomically", () => {
  const initial = createSeed();
  const fresh = { ...initial.sites[0], id: "new", name: "Yeni eser" };
  const next = reduceSnapshot(initial, {
    type: "import-sites",
    sites: [fresh, { ...fresh, id: "duplicate" }],
  });
  assert.equal(next.sites.length, initial.sites.length + 1);
  assert.equal(next.sites.at(-1)?.status, "draft");
  assert.throws(
    () =>
      reduceSnapshot(initial, {
        type: "import-sites",
        sites: [
          fresh,
          { ...fresh, id: "invalid", name: "Bad", coordinates: [29, 91] },
        ],
      }),
    /enlem/,
  );
  assert.equal(initial.sites.length, 6);
});

test("shared photo updates all referencing sites and preserves unrelated media", () => {
  const state = createSeed();
  const source = {
    id: "s",
    title: "Archive",
    kind: "archive" as const,
    author: "",
    year: "",
    page: "",
    url: "",
    trust: "representative" as const,
  };
  const photo = {
    id: "p",
    src: "data:image/png;base64,test",
    alt: "Old alt",
    title: "",
    titleEn: "",
    description: "",
    sourceId: "s",
    license: "CC0",
    trust: "representative" as const,
  };
  state.sites[0].photos = [photo];
  state.sites[1].photos = [photo];
  const next = reduceSnapshot(state, {
    type: "photo",
    photo: { ...photo, alt: "New alt" },
    source,
  });
  assert.equal(next.sites[0].photos?.[0].alt, "New alt");
  assert.equal(next.sites[1].photos?.[0].alt, "New alt");
  assert.equal(state.sites[0].photos[0].alt, "Old alt");
});
function pendingMemory(photo?: string) {
  const memory: Memory = {
    id: "m1",
    siteId: "ulu-cami",
    text: "Avludaki şadırvanın sesi.",
    status: "pending",
    createdAt: "2026-10-22T10:00:00.000Z",
    author: "Gezgin",
    ...(photo && { photo }),
  };
  return reduceSnapshot(createSeed(), { type: "memory", memory });
}
test("taking down an approved memory keeps text and reason, drops the photo and takes the points back once", () => {
  let state = reduceSnapshot(pendingMemory("data:image/png;base64,AAAA"), {
    type: "moderate",
    id: "m1",
    status: "approved",
  });
  assert.equal(state.points, 25);
  assert.throws(
    () =>
      reduceSnapshot(state, {
        type: "moderate",
        id: "m1",
        status: "rejected",
        reason: "  ",
      }),
    /Ret nedeni/,
  );
  for (let i = 0; i < 2; i++)
    state = reduceSnapshot(state, {
      type: "moderate",
      id: "m1",
      status: "rejected",
      reason: " Uygunsuz içerik ",
    });
  const [m] = state.memories;
  assert.deepEqual(
    [m?.status, m?.reason, m?.photo, m?.text, state.points],
    ["rejected", "Uygunsuz içerik", undefined, "Avludaki şadırvanın sesi.", 0],
  );
  // Rejection is final: a later approval changes nothing and pays nothing.
  state = reduceSnapshot(state, {
    type: "moderate",
    id: "m1",
    status: "approved",
  });
  assert.deepEqual([state.memories[0]?.status, state.points], ["rejected", 0]);
});
test("deleting removes the record in any status and takes approval points back once", () => {
  for (const type of ["delete-memory", "admin-delete-memory"] as const) {
    let state = reduceSnapshot(pendingMemory(), {
      type: "moderate",
      id: "m1",
      status: "approved",
    });
    state = reduceSnapshot(state, { type: "visit", siteId: "ulu-cami" });
    assert.equal(state.points, 125);
    state = reduceSnapshot(state, { type, id: "m1" });
    assert.deepEqual([state.memories.length, state.points], [0, 100]);
    assert.throws(
      () => reduceSnapshot(state, { type, id: "m1" }),
      /bulunamadı/,
    );
    // A pending memory carries no points.
    const pending = reduceSnapshot(pendingMemory(), { type, id: "m1" });
    assert.deepEqual([pending.memories.length, pending.points], [0, 0]);
  }
});
test("memory permissions: a moderator never decides their own memory, an admin may, only an admin purges others'", () => {
  const none = { remove: false, decide: false, takedown: false, purge: false };
  assert.deepEqual(memoryPermissions("user", "approved", false), none);
  assert.deepEqual(memoryPermissions("editor", "pending", false), none);
  assert.deepEqual(memoryPermissions("user", "rejected", true), {
    ...none,
    remove: true,
  });
  assert.deepEqual(memoryPermissions("moderator", "pending", false), {
    ...none,
    decide: true,
  });
  assert.deepEqual(memoryPermissions("moderator", "approved", false), {
    ...none,
    takedown: true,
  });
  assert.deepEqual(memoryPermissions("moderator", "approved", true), {
    ...none,
    remove: true,
  });
  assert.deepEqual(memoryPermissions("moderator", "pending", true), {
    ...none,
    remove: true,
  });
  assert.deepEqual(memoryPermissions("admin", "approved", false), {
    ...none,
    takedown: true,
    purge: true,
  });
  assert.deepEqual(memoryPermissions("admin", "approved", true), {
    ...none,
    remove: true,
    takedown: true,
  });
  assert.deepEqual(memoryPermissions("admin", "pending", true), {
    ...none,
    remove: true,
    decide: true,
  });
});
