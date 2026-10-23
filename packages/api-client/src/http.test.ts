import test from "node:test";
import assert from "node:assert/strict";
import type { HeritageRoute, HeritageSite } from "@akar/domain";
import {
  ApiError,
  createHttpClient,
  httpStorageKey,
  type StorageAdapter,
} from "./index";

function storage(): StorageAdapter {
  const values = new Map<string, string>();
  return {
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => {
      values.set(k, v);
    },
    removeItem: (k) => {
      values.delete(k);
    },
  };
}

const media = (id: string, kind: string, extra = {}) => ({
  id,
  kind,
  url: `https://cdn.test/${id}`,
  alt: id,
  title: "",
  titleEn: null,
  description: "",
  license: "CC BY",
  sourceId: null,
  trust: "verified",
  parts: [],
  ...extra,
});
const detail = (id: string, extra = {}) => ({
  id,
  name: `Site ${id}`,
  nameEn: null,
  kind: "cami",
  city: { id: "bursa", name: "Bursa" },
  district: null,
  year: "1399",
  coordinates: [29.06, 40.18],
  minutes: 3,
  tier: "Hero",
  description: "d",
  descriptionEn: null,
  architect: "",
  patron: null,
  era: null,
  address: null,
  role: null,
  relatedSiteId: null,
  sourceSummary: "özet",
  editorVersion: null,
  coverMediaId: null,
  stories: [],
  cards: [],
  historyImages: [],
  media: [],
  sources: [],
  ...extra,
});

interface Call {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: unknown;
}
type Handler = (call: Call) => unknown | Response;

/** Fake API: handlers are keyed by "METHOD /path"; the response is JSON unless a Response is returned. */
function fakeApi(handlers: Record<string, Handler>) {
  const calls: Call[] = [];
  const fetch: typeof globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    const call: Call = {
      method: init?.method ?? "GET",
      path: url.pathname + url.search,
      headers: Object.fromEntries(
        Object.entries((init?.headers ?? {}) as Record<string, string>),
      ),
      body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
    };
    calls.push(call);
    const handler = handlers[`${call.method} ${url.pathname}`];
    if (!handler) throw new Error(`unexpected ${call.method} ${call.path}`);
    const out = handler(call);
    return out instanceof Response ? out : Response.json(out);
  };
  return { calls, fetch };
}

const siteA = () =>
  detail("a", {
    coverMediaId: "cover",
    stories: [
      {
        id: "s1",
        title: "t",
        text: "x",
        textEn: null,
        simple: "y",
        trust: "verified",
        photoId: "cover",
        sourceId: null,
        showCard: null,
        highlights: [],
      },
    ],
    cards: [{ mediaId: "card-img" }],
    historyImages: [{ mediaId: "old", presentMediaId: "new" }],
    media: [
      media("cover", "photo"),
      media("card-img", "photo"),
      media("old", "photo"),
      media("new", "photo"),
      media("extra", "photo"),
      media("glb", "model", { title: "Model", parts: ["kubbe"] }),
      media("voice", "audio"),
    ],
  });

const catalogHandlers = (): Record<string, Handler> => ({
  "GET /v1/site-details": (c) =>
    c.path.includes("cursor=p2")
      ? { items: [detail("b")], nextCursor: null }
      : { items: [siteA()], nextCursor: "p2" },
  "GET /v1/sites/a": () => siteA(),
  "GET /v1/sites/b": () => detail("b"),
  "GET /v1/admin/site-details": () => ({ items: [], nextCursor: null }),
  "GET /v1/admin/routes": () => ({ items: [], nextCursor: null }),
  "GET /v1/admin/sites/a": () => ({ ...siteA(), status: "published" }),
  "GET /v1/memories": () => ({ items: [], nextCursor: null }),
  "GET /v1/routes": () => ({
    items: [
      {
        id: "r1",
        name: "Rota",
        nameEn: null,
        description: "",
        minutes: 8,
        distance: "1 km",
        theme: "t",
        stops: [
          { site: { id: "b" }, quizId: "q1" },
          { site: { id: "a" }, quizId: null },
        ],
      },
    ],
  }),
  // Every signed-in load reads Rotam; an empty one unless a test says otherwise.
  "GET /v1/me/route": () => ({ siteIds: [] }),
});

test("snapshot maps site DTOs: coordinates order, photos without card/history media, model, route order, paging, no request per site", async () => {
  const api = fakeApi(catalogHandlers());
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    fetch: api.fetch,
  });
  const snap = await client.getSnapshot();
  assert.deepEqual(
    snap.sites.map((s) => s.id),
    ["a", "b"],
  );
  const a = snap.sites[0]!;
  assert.deepEqual(a.coordinates, [29.06, 40.18]);
  assert.deepEqual(
    a.photos?.map((p) => p.id),
    ["cover", "extra"],
  );
  assert.equal(a.coverPhotoId, "cover");
  assert.equal(a.model?.src, "https://cdn.test/glb");
  assert.deepEqual(a.model?.parts, ["kubbe"]);
  assert.equal(a.district, "");
  assert.equal(a.stories[0]?.photoId, "cover");
  assert.deepEqual(snap.catalogRoutes?.[0]?.siteIds, ["b", "a"]);
  assert.ok(
    !api.calls.some((c) => c.path.startsWith("/v1/sites/")),
    "the catalog loads in bulk",
  );
  const guest = api.calls.find((c) => c.path === "/v1/routes");
  assert.equal(guest?.headers.authorization, undefined);
  assert.match(guest?.headers["x-device-id"] ?? "", /^[0-9a-f-]{36}$/);
});

test("save toggle becomes an explicit PUT or DELETE from the current state", async () => {
  let saved: string[] = [];
  const api = fakeApi({
    ...catalogHandlers(),
    "GET /v1/me": () => ({ id: "u", role: "user", displayName: null }),
    "GET /v1/me/passport": () => ({
      points: 0,
      saved,
      read: [],
      visited: [],
      quizzesSolved: [],
    }),
    "GET /v1/me/memories": () => ({ items: [], nextCursor: null }),
    "PUT /v1/me/saved/a": () => {
      saved = ["a"];
      return { siteId: "a", saved: true };
    },
    "DELETE /v1/me/saved/a": () => {
      saved = [];
      return { siteId: "a", saved: false };
    },
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    getToken: () => "tok",
    fetch: api.fetch,
  });
  assert.deepEqual(
    (await client.dispatch({ type: "save", siteId: "a" })).savedIds,
    ["a"],
  );
  assert.deepEqual(
    (await client.dispatch({ type: "save", siteId: "a" })).savedIds,
    [],
  );
  const writes = api.calls.filter((c) => c.path.startsWith("/v1/me/saved"));
  assert.deepEqual(
    writes.map((c) => c.method),
    ["PUT", "DELETE"],
  );
  assert.ok(writes.every((c) => c.headers["idempotency-key"]));
});

test("guest receipts are stored, redeemed after sign-in, dropped per answer and never resent", async () => {
  const store = storage();
  let tokenValue: string | null = null;
  let redeemStatus = 200;
  const api = fakeApi({
    ...catalogHandlers(),
    "POST /v1/stories/a/complete": () => ({ awarded: 0, receipt: "v1.ra.sig" }),
    "POST /v1/stories/b/complete": () => ({ awarded: 0, receipt: "v1.rb.sig" }),
    "GET /v1/me": () => ({ id: "u", role: "user", displayName: "Ada" }),
    "GET /v1/me/passport": () => ({
      points: 15,
      saved: [],
      read: ["a"],
      visited: [],
      quizzesSolved: [],
    }),
    "GET /v1/me/memories": () => ({ items: [], nextCursor: null }),
    "POST /v1/me/receipts": () =>
      redeemStatus === 200
        ? {
            results: [
              {
                ok: true,
                action: "story.complete",
                subjectId: "a",
                awarded: 15,
              },
              { ok: false, reason: "revealed" },
            ],
            awarded: 15,
            points: 15,
          }
        : Response.json(
            {
              error: {
                code: "INTERNAL",
                message: "Hata",
                fieldErrors: {},
                requestId: "r",
              },
            },
            { status: 500 },
          ),
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: store,
    getToken: () => tokenValue,
    fetch: api.fetch,
  });
  const guest = await client.dispatch({ type: "read", siteId: "a" });
  await client.dispatch({ type: "read", siteId: "b" });
  assert.deepEqual(guest.readIds, ["a"]);
  assert.equal(guest.points, 15);
  const stored = () =>
    (
      JSON.parse(store.getItem(httpStorageKey)!) as {
        receipts: { receipt: string }[];
      }
    ).receipts.map((r) => r.receipt);
  assert.deepEqual(stored(), ["v1.ra.sig", "v1.rb.sig"]);
  const redeems = () =>
    api.calls.filter((c) => c.path === "/v1/me/receipts").length;

  tokenValue = "tok";
  redeemStatus = 500;
  await client.getSnapshot();
  assert.deepEqual(
    stored(),
    ["v1.ra.sig", "v1.rb.sig"],
    "a failed request keeps the receipts",
  );

  redeemStatus = 200;
  const snap = await client.getSnapshot();
  assert.deepEqual(
    stored(),
    [],
    "accepted and rejected (revealed) receipts are both dropped",
  );
  assert.equal(snap.points, 15);
  const sent = api.calls
    .filter((c) => c.path === "/v1/me/receipts")
    .at(-1)?.body;
  assert.deepEqual(sent, { receipts: ["v1.ra.sig", "v1.rb.sig"] });
  const before = redeems();
  await client.getSnapshot();
  assert.equal(redeems(), before);
});

test("reset clears local guest state without calling a mutating endpoint", async () => {
  const store = storage();
  const api = fakeApi({
    ...catalogHandlers(),
    "POST /v1/stories/a/complete": () => ({ awarded: 0, receipt: "v1.ra.sig" }),
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: store,
    fetch: api.fetch,
  });
  await client.dispatch({ type: "read", siteId: "a" });
  await client.dispatch({ type: "save", siteId: "b" });
  const snap = await client.reset();
  assert.deepEqual([snap.readIds, snap.savedIds, snap.points], [[], [], 0]);
  const mutations = api.calls.filter((c) => c.method !== "GET");
  assert.equal(
    mutations.length,
    1,
    "only the earlier story completion; reset sent nothing",
  );
});

test("API errors keep status, code, field errors and request id; network failures are Turkish", async () => {
  const api = fakeApi({
    ...catalogHandlers(),
    "GET /v1/me/passport": () => ({
      points: 0,
      saved: [],
      read: [],
      visited: [],
      quizzesSolved: [],
    }),
    "GET /v1/me/memories": () => ({ items: [], nextCursor: null }),
    "GET /v1/me": () =>
      Response.json(
        {
          error: {
            code: "VALIDATION_FAILED",
            message: "Geçersiz istek.",
            fieldErrors: { text: ["Anın 1–280 karakter olmalı."] },
            requestId: "req-1",
          },
        },
        { status: 400 },
      ),
  });
  const failing = createHttpClient({
    baseUrl: "http://api.test",
    getToken: () => "tok",
    fetch: api.fetch,
  });
  await assert.rejects(failing.getSnapshot(), (e) => {
    assert.ok(e instanceof ApiError);
    assert.deepEqual(
      [e.status, e.code, e.requestId, e.fieldErrors.text?.[0]],
      [400, "VALIDATION_FAILED", "req-1", "Anın 1–280 karakter olmalı."],
    );
    return true;
  });
  const offline = createHttpClient({
    baseUrl: "http://api.test",
    fetch: async () => {
      throw new TypeError("fetch failed");
    },
  });
  await assert.rejects(offline.getSnapshot(), (e) => {
    assert.ok(e instanceof ApiError);
    assert.match(e.message, /Sunucuya ulaşılamadı/);
    return true;
  });
});

const unauthorized = () =>
  Response.json(
    {
      error: {
        code: "UNAUTHENTICATED",
        message: "Oturum geçersiz.",
        fieldErrors: {},
        requestId: "r",
      },
    },
    { status: 401 },
  );

test("a rejected token is reported and reads retry as guest; mutations with it fail", async () => {
  let rejected = 0;
  let tokenValue: string | null = "expired";
  // The server answers 401 to any request that carries a bad token, even public reads.
  const publicRead =
    (h: Handler): Handler =>
    (c) =>
      c.headers.authorization ? unauthorized() : h(c);
  const api = fakeApi({
    ...Object.fromEntries(
      Object.entries(catalogHandlers()).map(([k, h]) => [k, publicRead(h)]),
    ),
    ...accountHandlers({ "expired-again": { saved: [], points: 0 } }),
    "PUT /v1/me/saved/a": () => unauthorized(),
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    getToken: () => tokenValue,
    onUnauthorized: () => {
      rejected++;
      tokenValue = null;
    },
    fetch: api.fetch,
  });
  const snap = await client.getSnapshot();
  assert.equal(snap.sites.length, 2);
  assert.equal(rejected, 1);

  tokenValue = "expired-again";
  await assert.rejects(
    client.dispatch({ type: "save", siteId: "a" }),
    (e) => e instanceof ApiError && e.status === 401,
  );
});

test("overlapping dispatches run one at a time: one receipt per subject, both toggles applied", async () => {
  let reads = 0;
  const api = fakeApi({
    ...catalogHandlers(),
    "POST /v1/stories/a/complete": () => ({
      awarded: 0,
      receipt: `v1.r${++reads}.sig`,
    }),
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    fetch: async (input, init) => {
      await new Promise((r) => setTimeout(r, 2));
      return api.fetch(input, init);
    },
  });
  const [, , third] = await Promise.all([
    client.dispatch({ type: "read", siteId: "a" }),
    client.dispatch({ type: "read", siteId: "a" }),
    client.dispatch({ type: "save", siteId: "b" }),
  ]);
  const fourth = await client.dispatch({ type: "save", siteId: "b" });
  assert.equal(reads, 1);
  assert.deepEqual(
    [third.readIds, third.points, third.savedIds],
    [["a"], 15, ["b"]],
  );
  assert.deepEqual(fourth.savedIds, []);
});

const accountHandlers = (
  accounts: Record<string, { saved: string[]; points: number }>,
  role = "user",
): Record<string, Handler> => {
  const of = (c: Call) => accounts[c.headers.authorization?.slice(7) ?? ""]!;
  return {
    "GET /v1/me": () => ({ id: "u", role, displayName: "Ada" }),
    "GET /v1/me/passport": (c) => ({
      points: of(c).points,
      saved: of(c).saved,
      read: [],
      visited: [],
      quizzesSolved: [],
    }),
    "GET /v1/me/memories": () => ({ items: [], nextCursor: null }),
    "GET /v1/me/route": () => ({ siteIds: [] }),
    "PUT /v1/me/saved/a": () => ({ siteId: "a", saved: true }),
    "DELETE /v1/me/saved/a": () => ({ siteId: "a", saved: false }),
  };
};

test("the user cache follows the token: another account never inherits cached saves", async () => {
  let tokenValue: string | null = "A";
  const api = fakeApi({
    ...catalogHandlers(),
    ...accountHandlers({
      A: { saved: ["a"], points: 50 },
      B: { saved: [], points: 0 },
    }),
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    getToken: () => tokenValue,
    fetch: api.fetch,
  });
  assert.deepEqual((await client.getSnapshot()).savedIds, ["a"]);

  tokenValue = "B";
  await client.dispatch({ type: "save", siteId: "a" });
  const write = api.calls.filter((c) => c.path === "/v1/me/saved/a").at(-1);
  assert.deepEqual(
    [write?.method, write?.headers.authorization],
    ["PUT", "Bearer B"],
  );

  tokenValue = null;
  const guest = await client.dispatch({ type: "route", siteId: "a" });
  assert.deepEqual(
    [guest.savedIds, guest.points, guest.routeIds],
    [[], 0, ["a"]],
  );
});

test("sign-in moves the device's saves and Rotam into the account once; Rotam then lives in the account", async () => {
  const store = storage();
  let tokenValue: string | null = null;
  const account = { saved: ["b"], route: ["a"] };
  const api = fakeApi({
    ...catalogHandlers(),
    ...accountHandlers({ T: { saved: account.saved, points: 0 } }),
    "GET /v1/me/route": () => ({ siteIds: account.route }),
    "PUT /v1/me/route": (c) => {
      account.route = (c.body as { siteIds: string[] }).siteIds;
      return { siteIds: account.route };
    },
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: store,
    getToken: () => tokenValue,
    fetch: api.fetch,
  });
  await client.dispatch({ type: "save", siteId: "a" });
  await client.dispatch({ type: "save", siteId: "b" });
  await client.dispatch({ type: "set-route", siteIds: ["b", "a"] });
  assert.deepEqual(
    api.calls.filter((c) => c.method !== "GET"),
    [],
    "a guest writes nothing",
  );

  tokenValue = "T";
  const signedIn = await client.getSnapshot();
  assert.deepEqual(
    api.calls
      .filter((c) => c.method !== "GET")
      .map((c) => [c.method, c.path, c.body, c.headers.authorization]),
    [
      ["PUT", "/v1/me/saved/a", undefined, "Bearer T"],
      ["PUT", "/v1/me/route", { siteIds: ["a", "b"] }, "Bearer T"],
    ],
    "only the save the account lacks; the device's stops after the account's, each once",
  );
  assert.deepEqual(
    [signedIn.savedIds, signedIn.routeIds],
    [["a", "b"], ["a", "b"]],
  );
  const stored = JSON.parse(store.getItem(httpStorageKey) ?? "{}");
  assert.deepEqual([stored.saved, stored.route], [[], []]);

  const writes = api.calls.length;
  await client.getSnapshot();
  assert.ok(
    api.calls.slice(writes).every((c) => c.method === "GET"),
    "moved once",
  );

  const toggled = await client.dispatch({ type: "route", siteId: "a" });
  assert.deepEqual(api.calls.at(-1)?.body, { siteIds: ["b"] });
  assert.deepEqual(toggled.routeIds, ["b"]);

  tokenValue = null;
  assert.deepEqual(
    (await client.getSnapshot()).routeIds,
    [],
    "signed out, the device's Rotam was moved away",
  );
});

test("a failed move keeps the device's lists for the next load; a save unpublished since is skipped; Rotam stops at 100", async () => {
  const store = storage();
  let tokenValue: string | null = null;
  let routeStatus = 500;
  const full = Array.from({ length: 99 }, (_, i) => `x${i}`);
  const api = fakeApi({
    ...catalogHandlers(),
    ...accountHandlers({ T: { saved: [], points: 0 } }),
    "PUT /v1/me/saved/a": () =>
      Response.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Eser bulunamadı.",
            fieldErrors: {},
            requestId: "r",
          },
        },
        { status: 404 },
      ),
    "PUT /v1/me/saved/b": () => ({ siteId: "b", saved: true }),
    "GET /v1/me/route": () => ({ siteIds: full }),
    "PUT /v1/me/route": (c) =>
      routeStatus === 200
        ? c.body
        : Response.json(
            {
              error: {
                code: "INTERNAL",
                message: "Sunucu hatası.",
                fieldErrors: {},
                requestId: "r",
              },
            },
            { status: 500 },
          ),
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: store,
    getToken: () => tokenValue,
    fetch: api.fetch,
  });
  await client.dispatch({ type: "save", siteId: "a" });
  await client.dispatch({ type: "save", siteId: "b" });
  await client.dispatch({ type: "set-route", siteIds: ["a", "b"] });

  tokenValue = "T";
  const failed = await client.getSnapshot();
  assert.deepEqual(failed.routeIds, [], "the account's own (unpublished stops are not shown)");
  const kept = JSON.parse(store.getItem(httpStorageKey) ?? "{}");
  assert.deepEqual([kept.saved, kept.route], [["a", "b"], ["a", "b"]]);

  routeStatus = 200;
  await client.getSnapshot();
  const moved = JSON.parse(store.getItem(httpStorageKey) ?? "{}");
  assert.deepEqual([moved.saved, moved.route], [[], []]);
  assert.deepEqual(api.calls.filter((c) => c.method === "PUT" && c.path === "/v1/me/route").at(-1)?.body, {
    siteIds: [...full, "a"],
  });
});

for (const failure of ["server", "network"] as const) {
  test(`a failed site re-read after an admin write surfaces and is reloaded later (${failure})`, async () => {
    let reread: "ok" | "fail" = "ok";
    const catalog = catalogHandlers();
    const api = fakeApi({
      ...catalog,
      ...accountHandlers({ T: { saved: [], points: 0 } }, "editor"),
      "GET /v1/admin/sites/a": (c) => {
        if (reread === "ok") return catalog["GET /v1/admin/sites/a"]!(c);
        if (failure === "network") throw new TypeError("offline");
        return Response.json(
          {
            error: {
              code: "INTERNAL",
              message: "Hata",
              fieldErrors: {},
              requestId: "r",
            },
          },
          { status: 500 },
        );
      },
      "PATCH /v1/admin/sites/a/info": () => ({}),
    });
    const client = createHttpClient({
      baseUrl: "http://api.test",
      storage: storage(),
      getToken: () => "T",
      fetch: api.fetch,
    });
    const site = (await client.getSnapshot()).sites.find((s) => s.id === "a")!;
    reread = "fail";
    await assert.rejects(
      client.dispatch({ type: "site", site: { ...site, description: "yeni" } }),
      (e) =>
        e instanceof ApiError &&
        (failure === "network" ? e.status === 0 : e.status === 500),
    );
    reread = "ok";
    const after = await client.getSnapshot();
    assert.ok(
      after.sites.some((s) => s.id === "a"),
      "the site is not dropped",
    );
    assert.equal(
      api.calls.filter((c) => c.path === "/v1/admin/sites/a").length,
      2,
      "reloaded by the next read",
    );
  });
}

test("editors see drafts at the city centre; an unmoved placeholder sends no location, a missing type is always sent; publish and unpublish move the site", async () => {
  // "a" and "b" are Bursa's published sites, both at (29.06, 40.18): their centre is the placeholder.
  const drafts: Record<string, Record<string, unknown>> = {
    d1: { ...detail("d1"), kind: null, coordinates: null, status: "draft" },
    d2: { ...detail("d2", { coordinates: [29.1, 40.2] }), status: "draft" },
  };
  const writes: Call[] = [];
  const write = (c: Call) => {
    writes.push(c);
    return {};
  };
  const api = fakeApi({
    ...catalogHandlers(),
    ...accountHandlers({ T: { saved: [], points: 0 } }, "editor"),
    "GET /v1/admin/site-details": (c) => {
      assert.ok(c.path.includes("status=draft"));
      return { items: Object.values(drafts), nextCursor: null };
    },
    "GET /v1/admin/sites/d1": () => drafts.d1,
    "GET /v1/admin/sites/d2": () => drafts.d2,
    "PATCH /v1/admin/sites/d1/info": write,
    "PUT /v1/admin/sites/d1/location": write,
    "POST /v1/admin/sites/d2/publish": (c) => {
      drafts.d2 = { ...drafts.d2, status: "published" };
      return write(c);
    },
    "POST /v1/admin/sites/d2/unpublish": (c) => {
      drafts.d2 = { ...drafts.d2, status: "draft" };
      return write(c);
    },
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    getToken: () => "T",
    fetch: api.fetch,
  });
  const snap = await client.getSnapshot();
  const d1 = snap.sites.find((s) => s.id === "d1")!;
  assert.deepEqual(
    [d1.status, d1.kind, d1.coordinates],
    ["draft", "cami", [29.06, 40.18]],
  );

  // Unmoved pin, type left at the shown "cami": no location, but the type goes out.
  await client.dispatch({ type: "site", site: { ...d1, year: "1400" } });
  assert.deepEqual(
    writes.map((c) => [c.method, c.path, c.body]),
    [["PATCH", "/v1/admin/sites/d1/info", { typeId: "cami", year: "1400" }]],
  );
  writes.length = 0;
  await client.dispatch({
    type: "site",
    site: { ...d1, coordinates: [29.07, 40.19] },
  });
  assert.deepEqual(
    writes.map((c) => [c.method, c.path, c.body]),
    [
      ["PATCH", "/v1/admin/sites/d1/info", { typeId: "cami" }],
      ["PUT", "/v1/admin/sites/d1/location", { coordinates: [29.07, 40.19] }],
    ],
  );

  writes.length = 0;
  const d2 = snap.sites.find((s) => s.id === "d2")!;
  const published = await client.dispatch({
    type: "site",
    site: { ...d2, status: "published" },
  });
  assert.deepEqual(
    writes.map((c) => c.path),
    ["/v1/admin/sites/d2/publish"],
  );
  assert.equal(published.sites.find((s) => s.id === "d2")?.status, "published");

  writes.length = 0;
  const unpublished = await client.dispatch({
    type: "site",
    site: { ...published.sites.find((s) => s.id === "d2")!, status: "draft" },
  });
  assert.deepEqual(
    writes.map((c) => c.path),
    ["/v1/admin/sites/d2/unpublish"],
  );
  assert.equal(
    unpublished.sites
      .filter((s) => s.id === "d2")
      .map((s) => s.status)
      .join(),
    "draft",
    "an unpublished site stays in the panel once, as a draft",
  );
});

test("a full editor save goes through the step endpoints in reference order: new files uploaded and their ids mapped, server-only story fields and source locators kept", async () => {
  const source1 = {
    id: "src-1",
    title: "Envanter",
    kind: "book",
    author: "",
    year: "",
    page: "",
    url: "",
    trust: "verified",
  };
  let model = "glb";
  let upload = 0;
  const published = () => ({ ...siteA(), sources: [source1] });
  const admin = () => {
    const base = published();
    return {
      ...base,
      status: "published",
      openingCamera: null,
      sourceLinks: [{ sourceId: "src-1", locator: "s. 42" }],
      stories: base.stories.map((s) => ({
        ...s,
        cardId: "card-1",
        camera: { azimuthDeg: 10, elevationDeg: 20, distanceM: 30 },
        audioMediaId: "voice",
        audioEnMediaId: null,
      })),
      media: [
        ...base.media.filter((m) => m.kind !== "model"),
        model === "glb"
          ? media("glb", "model", { title: "Model", parts: ["kubbe"] })
          : media(model, "model", { parts: ["kubbe", "minare"] }),
      ],
    };
  };
  const writes: Call[] = [];
  const write = (out: unknown = {}) => (c: Call) => {
    writes.push(c);
    return out;
  };
  const api = fakeApi({
    ...catalogHandlers(),
    ...accountHandlers({ T: { saved: [], points: 0 } }, "editor"),
    "GET /v1/site-details": () => ({ items: [published()], nextCursor: null }),
    "GET /v1/admin/sites/a": () => admin(),
    "PATCH /v1/admin/sites/a/info": write(),
    "PUT /v1/admin/sites/a/sources": write(),
    "POST /v1/media/uploads": (c) => {
      writes.push(c);
      upload++;
      return { uploadId: `up${upload}`, url: `/v1/media/uploads/up${upload}/content`, headers: {} };
    },
    "PUT /v1/media/uploads/up1/content": () => new Response(null, { status: 204 }),
    "PUT /v1/media/uploads/up2/content": () => new Response(null, { status: 204 }),
    "POST /v1/media/uploads/up1/complete": write({ id: "p-new" }),
    "POST /v1/media/uploads/up2/complete": write({ id: "m-new" }),
    "PATCH /v1/admin/media/cover": write(),
    "PUT /v1/admin/sites/a/model": (c) => {
      const body = c.body;
      if (body && typeof body === "object" && "mediaId" in body && typeof body.mediaId === "string")
        model = body.mediaId;
      return write()(c);
    },
    "PUT /v1/admin/sites/a/media": write(),
    "PUT /v1/admin/sites/a/stories": write(),
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    getToken: () => "T",
    fetch: api.fetch,
  });
  const site = (await client.getSnapshot()).sites.find((s) => s.id === "a")!;
  const newSource = { ...source1, id: "src-new", title: "Yeni kaynak" } as const;
  await client.dispatch({
    type: "site",
    site: {
      ...site,
      city: "Kütahya",
      sources: [...site.sources!, newSource],
      photos: [
        ...site.photos!.map((p) => (p.id === "cover" ? { ...p, title: "Kapak" } : p)),
        {
          id: "tmp-photo",
          src: "data:image/png;base64,iVBORw0KGgo=",
          alt: "Yeni",
          title: "Yeni",
          titleEn: "",
          description: "",
          sourceId: "src-new",
          license: "CC BY",
          trust: "verified",
        },
      ],
      coverPhotoId: "tmp-photo",
      model: {
        name: "yeni.glb",
        bytes: 8,
        src: "data:model/gltf-binary;base64,Z2xURgIAAAA=",
        parts: ["minare"],
        trust: "representative",
      },
      stories: [
        { ...site.stories[0]!, photoId: "tmp-photo", highlights: ["minare"] },
        { id: "s-new", title: "İki", text: "t", simple: "s", trust: "inferred", photoId: "extra", sourceId: "src-new" },
      ],
    },
  });

  assert.deepEqual(
    writes.map((c) => [c.method, c.path, c.body]),
    [
      ["PATCH", "/v1/admin/sites/a/info", { city: "Kütahya" }],
      [
        "PUT",
        "/v1/admin/sites/a/sources",
        { sources: [{ ...source1, locator: "s. 42" }, { ...newSource, locator: null }] },
      ],
      // Photos in list order: the edited cover first, then the new file.
      [
        "PATCH",
        "/v1/admin/media/cover",
        { alt: "cover", title: "Kapak", titleEn: null, description: "", license: "CC BY", sourceId: null, trust: "verified" },
      ],
      ["POST", "/v1/media/uploads", { kind: "photo", contentType: "image/png", bytes: 8 }],
      [
        "POST",
        "/v1/media/uploads/up1/complete",
        { alt: "Yeni", title: "Yeni", titleEn: null, description: "", license: "CC BY", sourceId: "src-new", trust: "verified" },
      ],
      ["POST", "/v1/media/uploads", { kind: "model", contentType: "model/gltf-binary", bytes: 8 }],
      ["POST", "/v1/media/uploads/up2/complete", { title: "yeni.glb", license: "Katkı sahibi izniyle", trust: "representative" }],
      ["PUT", "/v1/admin/sites/a/model", { mediaId: "m-new" }],
      ["PUT", "/v1/admin/sites/a/media", { photoIds: ["cover", "extra", "p-new"], coverPhotoId: "p-new" }],
      [
        "PUT",
        "/v1/admin/sites/a/stories",
        {
          blocks: [
            {
              id: "s1", title: "t", text: "x", textEn: null, simple: "y", trust: "verified",
              photoId: "p-new", sourceId: null, showCard: null, highlights: ["minare"],
              cardId: "card-1", camera: { azimuthDeg: 10, elevationDeg: 20, distanceM: 30 }, audioMediaId: "voice", audioEnMediaId: null,
            },
            {
              id: "s-new", title: "İki", text: "t", textEn: null, simple: "s", trust: "inferred",
              photoId: "extra", sourceId: "src-new", showCard: null, highlights: [],
              cardId: null, camera: null, audioMediaId: null, audioEnMediaId: null,
            },
          ],
        },
      ],
    ],
  );
  // The highlights wait for the new model's part names: read after the model is set, before the story.
  const order = api.calls.map((c) => `${c.method} ${c.path}`);
  const modelSet = order.indexOf("PUT /v1/admin/sites/a/model");
  assert.ok(order.slice(modelSet).indexOf("GET /v1/admin/sites/a") < order.slice(modelSet).indexOf("PUT /v1/admin/sites/a/stories"));
});

test("users and moderators never request drafts (sites or routes)", async () => {
  for (const role of ["user", "moderator"]) {
    const api = fakeApi({
      ...catalogHandlers(),
      ...accountHandlers({ T: { saved: [], points: 0 } }, role),
      "GET /v1/admin/memories": () => ({ items: [], nextCursor: null }),
    });
    await createHttpClient({
      baseUrl: "http://api.test",
      storage: storage(),
      getToken: () => "T",
      fetch: api.fetch,
    }).getSnapshot();
    assert.ok(
      !api.calls.some((c) => /^\/v1\/admin\/(site|routes)/.test(c.path)),
      role,
    );
  }
});

test("a new site is created once with its city and pin; later saves of the same panel id update it, publishing last", async () => {
  let server: Record<string, unknown> | undefined;
  const writes: Call[] = [];
  const write =
    (change: (body: Record<string, unknown>) => Record<string, unknown>) =>
    (c: Call) => {
      writes.push(c);
      server = { ...server, ...change(c.body as Record<string, unknown>) };
      return {};
    };
  const api = fakeApi({
    ...catalogHandlers(),
    ...accountHandlers({ T: { saved: [], points: 0 } }, "editor"),
    "POST /v1/admin/sites": (c) => {
      writes.push(c);
      const b = c.body as Record<string, unknown>;
      server = {
        ...detail("n1"),
        ...b,
        kind: b.typeId,
        city: { id: "bursa", name: "Bursa" },
        coordinates: null,
        status: "draft",
      };
      return server;
    },
    "GET /v1/admin/sites/n1": () => server,
    "PATCH /v1/admin/sites/n1/info": write((b) => b),
    "PUT /v1/admin/sites/n1/location": write((b) => b),
    "POST /v1/admin/sites/n1/publish": write(() => ({ status: "published" })),
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    getToken: () => "T",
    fetch: api.fetch,
  });
  await client.getSnapshot();
  const site: HeritageSite = {
    id: "panel-1",
    name: "Yeni Han",
    city: "Bursa",
    district: "Osmangazi",
    year: "1450",
    architect: "",
    kind: "han",
    coordinates: [29.07, 40.19],
    minutes: 15,
    description: "Bir han.",
    source: "",
    stories: [],
    status: "draft",
    tier: "Tier 1",
  };

  const drafted = await client.dispatch({ type: "site", site });
  assert.deepEqual(
    writes.map((c) => [c.method, c.path, c.body]),
    [
      [
        "POST",
        "/v1/admin/sites",
        {
          name: "Yeni Han",
          nameEn: null,
          typeId: "han",
          year: "1450",
          architect: "",
          patron: null,
          era: null,
          address: null,
          role: null,
          relatedSiteId: null,
          description: "Bir han.",
          descriptionEn: null,
          minutes: 15,
          district: "Osmangazi",
          tier: "Tier 1",
          city: "Bursa",
        },
      ],
      ["PUT", "/v1/admin/sites/n1/location", { coordinates: [29.07, 40.19] }],
    ],
  );
  assert.deepEqual(
    drafted.sites.filter((s) => s.name === "Yeni Han").map((s) => s.id),
    ["n1"],
  );

  // The editor stays open with its own id: no second site, only the change and the publish.
  writes.length = 0;
  const published = await client.dispatch({
    type: "site",
    site: { ...site, year: "1460", source: "Envanter", status: "published" },
  });
  assert.deepEqual(
    writes.map((c) => [c.method, c.path, c.body]),
    [
      ["PATCH", "/v1/admin/sites/n1/info", { year: "1460" }],
      ["POST", "/v1/admin/sites/n1/publish", undefined],
    ],
  );
  assert.equal(published.sites.find((s) => s.id === "n1")?.status, "published");
});

test("a new route takes its first stop's city, stays a draft in the panel only, and is published under the server's id; deleting one is refused", async () => {
  const server: Record<string, Record<string, unknown>> = {};
  const writes: Call[] = [];
  const base = catalogHandlers();
  const api = fakeApi({
    ...base,
    ...accountHandlers({ T: { saved: [], points: 0 } }, "editor"),
    "GET /v1/routes": (c) => {
      const pub = base["GET /v1/routes"]!(c) as { items: unknown[] };
      const live = Object.values(server)
        .filter((r) => r.status === "published")
        .map((r) => ({ ...r, minutes: 20, distance: "1 km" }));
      return { items: [...pub.items, ...live] };
    },
    "GET /v1/admin/routes": (c) => {
      assert.ok(c.path.includes("status=draft"));
      return {
        items: Object.values(server).filter((r) => r.status === "draft"),
        nextCursor: null,
      };
    },
    "GET /v1/admin/routes/rt1": () => server.rt1,
    "POST /v1/admin/routes": (c) => {
      writes.push(c);
      server.rt1 = {
        ...(c.body as object),
        id: "rt1",
        status: "draft",
        stops: [],
      };
      return server.rt1;
    },
    "PUT /v1/admin/routes/rt1/stops": (c) => {
      writes.push(c);
      const { stops } = c.body as { stops: { siteId: string }[] };
      server.rt1!.stops = stops.map((s) => ({
        site: { id: s.siteId },
        quizId: null,
        historyImageId: null,
      }));
      return server.rt1;
    },
    "POST /v1/admin/routes/rt1/publish": (c) => {
      writes.push(c);
      server.rt1!.status = "published";
      return server.rt1;
    },
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    getToken: () => "T",
    fetch: api.fetch,
  });
  const snap = await client.getSnapshot();
  const existing = snap.catalogRoutes!;
  const route: HeritageRoute = {
    id: "panel-r",
    name: "Yeni Rota",
    nameEn: "",
    description: "Kısa",
    siteIds: [],
    minutes: 0,
    distance: "0 km",
    theme: "Bursa",
    status: "draft",
  };

  // No stop, no city: refused before anything is sent.
  await assert.rejects(
    client.dispatch({ type: "catalog-routes", routes: [...existing, route] }),
    { name: "UnsupportedCommandError" },
  );
  assert.deepEqual(writes, []);

  const drafted = await client.dispatch({
    type: "catalog-routes",
    routes: [...existing, { ...route, siteIds: ["a", "b"] }],
  });
  assert.deepEqual(
    writes.map((c) => [c.method, c.path, c.body]),
    [
      [
        "POST",
        "/v1/admin/routes",
        {
          name: "Yeni Rota",
          nameEn: null,
          description: "Kısa",
          theme: "Bursa",
          cityId: "bursa",
        },
      ],
      [
        "PUT",
        "/v1/admin/routes/rt1/stops",
        {
          stops: [
            { siteId: "a", quizId: null, historyImageId: null },
            { siteId: "b", quizId: null, historyImageId: null },
          ],
        },
      ],
    ],
  );
  assert.deepEqual(
    drafted.catalogRoutes?.map((r) => [r.id, r.status, r.siteIds]),
    [
      ["r1", "published", ["b", "a"]],
      ["rt1", "draft", ["a", "b"]],
    ],
  );

  // Saved again under the panel's id: the same route is published, nothing else is written.
  writes.length = 0;
  const published = await client.dispatch({
    type: "catalog-routes",
    routes: [
      ...existing,
      { ...route, siteIds: ["a", "b"], status: "published" },
    ],
  });
  assert.deepEqual(
    writes.map((c) => c.path),
    ["/v1/admin/routes/rt1/publish"],
  );
  assert.deepEqual(
    published.catalogRoutes?.map((r) => [r.id, r.status]),
    [
      ["r1", "published"],
      ["rt1", "published"],
    ],
  );

  writes.length = 0;
  await assert.rejects(
    client.dispatch({ type: "catalog-routes", routes: existing }),
    { name: "UnsupportedCommandError" },
  );
  assert.deepEqual(writes, []);
});

const quizState = (extra = {}) => ({
  id: "q1",
  siteId: "b",
  question: "Soru?",
  questionEn: null,
  options: ["A", "B", "C"],
  optionsEn: null,
  hint: "İpucu",
  hintAvailable: false,
  revealed: false,
  solved: false,
  ...extra,
});

test("quizzes of a site come from the route stops; the hint only after it was unlocked; no answer key anywhere", async () => {
  const api = fakeApi({
    ...catalogHandlers(),
    "GET /v1/quizzes/q1": () => quizState({ hint: "İpucu" }),
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    fetch: api.fetch,
  });
  const quizzes = await client.getQuizzes("b");
  assert.deepEqual(quizzes, [
    {
      id: "q1",
      siteId: "b",
      question: "Soru?",
      options: ["A", "B", "C"],
      hint: null,
      solved: false,
      revealed: false,
    },
  ]);
  assert.deepEqual(await client.getQuizzes("a"), []);
  assert.deepEqual(await client.getQuizzes("unknown"), []);
});

test("a guest's correct answer sends only the choice, stores a receipt and counts as pending points once", async () => {
  const store = storage();
  const api = fakeApi({
    ...catalogHandlers(),
    "POST /v1/quizzes/q1/submit": (c) =>
      (c.body as { choice: number }).choice === 1
        ? {
            correct: true,
            awarded: 0,
            receipt: "v1.q1.sig",
            explanation: { text: "Çünkü.", sourceId: null, trust: "verified" },
          }
        : { correct: false, awarded: 0, hint: "İpucu" },
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: store,
    fetch: api.fetch,
  });
  const wrong = await client.answerQuiz("q1", 0);
  assert.deepEqual(
    [wrong.correct, wrong.awarded, wrong.hint, wrong.explanation],
    [false, 0, "İpucu", null],
  );
  assert.equal(wrong.snapshot.points, 0);
  const right = await client.answerQuiz("q1", 1);
  assert.deepEqual(
    [right.correct, right.awarded, right.hint, right.explanation],
    [true, 20, null, "Çünkü."],
  );
  assert.equal(right.snapshot.points, 20);
  assert.deepEqual(right.snapshot.quizIds, ["b"]);
  const submits = api.calls.filter((c) => c.path.endsWith("/submit"));
  assert.deepEqual(
    submits.map((c) => c.body),
    [{ choice: 0 }, { choice: 1 }],
  );
  const saved = JSON.parse(store.getItem(httpStorageKey) ?? "{}");
  assert.deepEqual(saved.receipts, [
    { receipt: "v1.q1.sig", action: "quiz.correct", subjectId: "q1" },
  ]);
  // A later correct answer carries no receipt (nothing more to earn): no second pending award.
  api.calls.length = 0;
  const again = await createHttpClient({
    baseUrl: "http://api.test",
    storage: store,
    fetch: createApiWithoutReceipt(),
  }).answerQuiz("q1", 1);
  assert.equal(again.awarded, 0);
  assert.equal(again.snapshot.points, 20);
});

function createApiWithoutReceipt(): typeof globalThis.fetch {
  return fakeApi({
    ...catalogHandlers(),
    "POST /v1/quizzes/q1/submit": () => ({ correct: true, awarded: 0 }),
  }).fetch;
}

test("a signed-in correct answer reports the server's award and re-reads the passport", async () => {
  let points = 0;
  const api = fakeApi({
    ...catalogHandlers(),
    "GET /v1/me": () => ({ id: "u", role: "user", displayName: "Ada" }),
    "GET /v1/me/passport": () => ({
      points,
      saved: [],
      read: [],
      visited: [],
      quizzesSolved: points ? ["q1"] : [],
    }),
    "GET /v1/me/memories": () => ({ items: [], nextCursor: null }),
    "POST /v1/quizzes/q1/submit": () => {
      points = 20;
      return { correct: true, awarded: 20 };
    },
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    fetch: api.fetch,
    getToken: () => "tok",
  });
  const res = await client.answerQuiz("q1", 2);
  assert.equal(res.awarded, 20);
  assert.equal(res.snapshot.points, 20);
  assert.deepEqual(res.snapshot.quizIds, ["b"]);
  assert.equal(
    api.calls.find((c) => c.path.endsWith("/submit"))?.headers.authorization,
    "Bearer tok",
  );
});

test("reveal returns the correct option and keeps the quiz out of pending points", async () => {
  const api = fakeApi({
    ...catalogHandlers(),
    "POST /v1/quizzes/q1/reveal": () => ({ correctOption: "B" }),
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    fetch: api.fetch,
  });
  const res = await client.revealQuiz("q1");
  assert.equal(res.correctOption, "B");
  assert.equal(res.snapshot.points, 0);
  assert.deepEqual(res.snapshot.quizIds, []);
});

const feedItem = (id: string, siteId: string, text = "Başkasının anısı") => ({
  id,
  siteId,
  text,
  authorName: "Veli",
  photo: null,
  createdAt: "2026-10-10T10:00:00.000Z",
});

test("the memory feed is read per 100 sites and all pages, and never overwrites an own entry", async () => {
  const feedPaths: string[] = [];
  const api = fakeApi({
    ...catalogHandlers(),
    "GET /v1/memories": (c) => {
      feedPaths.push(c.path);
      return c.path.includes("cursor=n2")
        ? { items: [feedItem("m3", "a")], nextCursor: null }
        : {
            items: [
              feedItem("m1", "a"),
              feedItem("own", "b", "yayındaki hâli"),
            ],
            nextCursor: "n2",
          };
    },
    "GET /v1/me": () => ({ id: "u", role: "user", displayName: "Ada" }),
    "GET /v1/me/passport": () => ({
      points: 0,
      saved: [],
      read: [],
      visited: [],
      quizzesSolved: [],
    }),
    "GET /v1/me/memories": () => ({
      items: [
        {
          id: "own",
          siteId: "b",
          text: "benim bekleyen anım",
          photo: null,
          status: "pending",
          reason: null,
          createdAt: "2026-10-11T10:00:00.000Z",
        },
      ],
      nextCursor: null,
    }),
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    fetch: api.fetch,
    getToken: () => "tok",
  });
  const snap = await client.getSnapshot();
  assert.equal(feedPaths.length, 2);
  assert.ok(feedPaths[0]?.includes("siteIds=a%2Cb"));
  // Own memories stay own; the feed's copy of the same id is not repeated.
  assert.deepEqual(
    snap.memories.map((m) => [m.id, m.status, m.author, m.text]),
    [["own", "pending", "Ada", "benim bekleyen anım"]],
  );
  assert.deepEqual(
    snap.publicMemories?.map((m) => [m.id, m.status, m.author]).sort(),
    [
      ["m1", "approved", "Veli"],
      ["m3", "approved", "Veli"],
    ],
  );
  assert.equal(snap.moderationQueue, undefined);
});

const userHandlers = (role: string): Record<string, Handler> => ({
  "GET /v1/me": () => ({ id: "u", role, displayName: "Ada" }),
  "GET /v1/me/passport": () => ({
    points: 0,
    saved: [],
    read: [],
    visited: [],
    quizzesSolved: [],
  }),
  "GET /v1/me/memories": () => ({ items: [], nextCursor: null }),
});
const pendingItem = (id: string, siteId: string) => ({
  id,
  siteId,
  siteName: `Site ${siteId}`,
  text: "bekleyen",
  photo: null,
  status: "pending",
  reason: null,
  createdAt: "2026-10-10T10:00:00.000Z",
  decidedAt: null,
  authorName: "Veli",
});

test("other people's memories are never the user's own: guest, signed-in user and moderator queue", async () => {
  const feed = (): Record<string, Handler> => ({
    "GET /v1/memories": () => ({
      items: [feedItem("m1", "a")],
      nextCursor: null,
    }),
  });
  const guest = await createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    fetch: fakeApi({ ...catalogHandlers(), ...feed() }).fetch,
  }).getSnapshot();
  assert.deepEqual(guest.memories, []);
  assert.deepEqual(
    guest.publicMemories?.map((m) => m.id),
    ["m1"],
  );
  assert.equal(guest.moderationQueue, undefined);

  const asRole = (role: string, extra: Record<string, Handler> = {}) =>
    createHttpClient({
      baseUrl: "http://api.test",
      storage: storage(),
      fetch: fakeApi({
        ...catalogHandlers(),
        ...feed(),
        ...userHandlers(role),
        ...extra,
      }).fetch,
      getToken: () => "tok",
    }).getSnapshot();
  const user = await asRole("user");
  assert.deepEqual(user.memories, []);
  assert.deepEqual(
    user.publicMemories?.map((m) => m.id),
    ["m1"],
  );
  assert.equal(user.moderationQueue, undefined);

  // The panel tabs need every status; the pending list repeats a reported approved memory.
  const byStatus: Record<string, object[]> = {
    pending: [pendingItem("q1", "b"), { ...pendingItem("r1", "a"), status: "approved" }],
    approved: [{ ...pendingItem("r1", "a"), status: "approved" }, { ...pendingItem("a1", "a"), status: "approved" }],
    rejected: [{ ...pendingItem("x1", "b"), status: "rejected", reason: "Uygunsuz" }],
  };
  const mod = await asRole("moderator", {
    "GET /v1/admin/memories": (c) => ({
      items: byStatus[new URL(c.path, "http://api.test").searchParams.get("status") ?? ""] ?? [],
      nextCursor: null,
    }),
  });
  assert.deepEqual(mod.memories, []);
  assert.deepEqual(
    mod.moderationQueue?.map((m) => [m.id, m.status]).sort(),
    [["a1", "approved"], ["q1", "pending"], ["r1", "approved"], ["x1", "rejected"]],
  );
  assert.deepEqual(
    mod.publicMemories?.map((m) => m.id),
    ["m1"],
  );
});

test("every moderation decision re-reads the feed: an approval appears, a rejection of a reported memory disappears", async () => {
  let phase: "empty" | "approved" | "pending" | "rejected" = "empty";
  let feedReads = 0;
  const api = fakeApi({
    ...catalogHandlers(),
    ...userHandlers("moderator"),
    "GET /v1/memories": () => {
      feedReads++;
      return {
        items: phase === "approved" ? [feedItem("m1", "a")] : [],
        nextCursor: null,
      };
    },
    "GET /v1/admin/memories": () => ({
      items: phase === "pending" ? [pendingItem("m1", "a")] : [],
      nextCursor: null,
    }),
    "POST /v1/admin/memories/m1/decision": (c) => {
      phase = (c.body as { status: "approved" | "rejected" }).status;
      return {};
    },
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    fetch: api.fetch,
    getToken: () => "tok",
  });
  assert.deepEqual((await client.getSnapshot()).publicMemories, []);
  assert.equal(feedReads, 1);
  phase = "pending";
  const approvedSnap = await client.dispatch({
    type: "moderate",
    id: "m1",
    status: "approved",
  });
  assert.equal(feedReads, 2);
  assert.deepEqual(
    approvedSnap.publicMemories?.map((m) => m.id),
    ["m1"],
  );
  // Reported after approval: it left the feed and sits in the queue again.
  phase = "pending";
  assert.deepEqual(
    (await client.getSnapshot()).moderationQueue?.map((m) => m.id),
    ["m1"],
  );
  const rejectedSnap = await client.dispatch({
    type: "moderate",
    id: "m1",
    status: "rejected",
    reason: "Uygunsuz içerik",
  });
  assert.equal(feedReads, 3);
  const later = await client.getSnapshot();
  for (const snap of [rejectedSnap, later]) {
    assert.deepEqual(snap.publicMemories, []);
    assert.deepEqual(snap.moderationQueue, []);
    assert.deepEqual(snap.memories, []);
  }
  assert.equal(feedReads, 3);
});

test("upload progress runs 0 → 1 and always ends with null, also on failure", async () => {
  const seen: Array<number | null> = [];
  let fail = false;
  const api = fakeApi({
    ...catalogHandlers(),
    "GET /v1/me": () => ({ id: "u", role: "user", displayName: "Ada" }),
    "GET /v1/me/passport": () => ({
      points: 0,
      saved: [],
      read: [],
      visited: [],
      quizzesSolved: [],
    }),
    "GET /v1/me/memories": () => ({ items: [], nextCursor: null }),
    "POST /v1/media/uploads": () => ({
      uploadId: "up1",
      url: "/v1/media/uploads/up1/content",
      headers: { "content-type": "image/png" },
    }),
    "PUT /v1/media/uploads/up1/content": () =>
      fail
        ? Response.json(
            { error: { code: "INTERNAL", message: "Hata" } },
            { status: 500 },
          )
        : new Response(null, { status: 204 }),
    "POST /v1/media/uploads/up1/complete": () => ({ id: "media1" }),
    "POST /v1/memories": () => ({}),
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    fetch: api.fetch,
    getToken: () => "tok",
    getMemoryConsent: () => ({ textVersion: "v1" }),
    onUploadProgress: (f) => seen.push(f),
  });
  const memory = {
    id: "x",
    siteId: "a",
    text: "Merhaba",
    status: "pending" as const,
    createdAt: "2026-10-10",
    author: "Ada",
    photo: "data:image/png;base64,iVBORw0KGgo=",
  };
  await client.dispatch({ type: "memory", memory });
  assert.deepEqual(seen, [0, 1, 1, null]);
  seen.length = 0;
  fail = true;
  await assert.rejects(client.dispatch({ type: "memory", memory }), ApiError);
  assert.deepEqual(seen, [0, null]);
});

test("removing a memory sends DELETE with an idempotency key and re-reads the feed past the HTTP cache and the points; the snapshot carries the role", async () => {
  const removed = new Set<string>();
  const feedCaches: Array<RequestCache | undefined> = [];
  const api = fakeApi({
    ...catalogHandlers(),
    "GET /v1/me": () => ({ id: "u", role: "admin", displayName: "Ada" }),
    "GET /v1/me/passport": () => ({
      points: removed.has("m1") ? 0 : 25,
      saved: [],
      read: [],
      visited: [],
      quizzesSolved: [],
    }),
    "GET /v1/me/memories": () => ({
      items: removed.has("m1")
        ? []
        : [
            {
              id: "m1",
              siteId: "a",
              text: "benim anım",
              photo: null,
              status: "approved",
              reason: null,
              createdAt: "2026-10-11T10:00:00.000Z",
            },
          ],
      nextCursor: null,
    }),
    "GET /v1/memories": () => ({
      items: ["m1", "m2"]
        .filter((id) => !removed.has(id))
        .map((id) => feedItem(id, "a")),
      nextCursor: null,
    }),
    "GET /v1/admin/memories": () => ({ items: [], nextCursor: null }),
    "DELETE /v1/me/memories/m1": () => {
      removed.add("m1");
      return new Response(null, { status: 204 });
    },
    "DELETE /v1/admin/memories/m2": () => {
      removed.add("m2");
      return new Response(null, { status: 204 });
    },
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    getToken: () => "tok",
    fetch: (input, init) => {
      if (String(input).includes("/v1/memories?")) feedCaches.push(init?.cache);
      return api.fetch(input, init);
    },
  });
  const before = await client.getSnapshot();
  assert.deepEqual(
    [before.role, before.points, before.memories.map((m) => m.id)],
    ["admin", 25, ["m1"]],
  );
  assert.deepEqual(
    before.publicMemories?.map((m) => m.id),
    ["m2"],
  );

  const afterOwn = await client.dispatch({ type: "delete-memory", id: "m1" });
  const del = api.calls.find(
    (c) => c.method === "DELETE" && c.path === "/v1/me/memories/m1",
  );
  assert.ok(del?.headers["idempotency-key"]);
  assert.deepEqual([afterOwn.points, afterOwn.memories], [0, []]);
  // The own copy is gone and the feed was re-read: it does not come back as somebody else's.
  assert.deepEqual(
    afterOwn.publicMemories?.map((m) => m.id),
    ["m2"],
  );
  assert.deepEqual(feedCaches, [undefined, "no-cache"]);

  const afterAdmin = await client.dispatch({
    type: "admin-delete-memory",
    id: "m2",
  });
  assert.ok(
    api.calls.some(
      (c) => c.method === "DELETE" && c.path === "/v1/admin/memories/m2",
    ),
  );
  assert.deepEqual(afterAdmin.publicMemories, []);
});
