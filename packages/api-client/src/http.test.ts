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
  displayOrder: null,
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
    [
      ["a", "b"],
      ["a", "b"],
    ],
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
  assert.deepEqual(
    failed.routeIds,
    [],
    "the account's own (unpublished stops are not shown)",
  );
  const kept = JSON.parse(store.getItem(httpStorageKey) ?? "{}");
  assert.deepEqual(
    [kept.saved, kept.route],
    [
      ["a", "b"],
      ["a", "b"],
    ],
  );

  routeStatus = 200;
  await client.getSnapshot();
  const moved = JSON.parse(store.getItem(httpStorageKey) ?? "{}");
  assert.deepEqual([moved.saved, moved.route], [[], ["b"]]);
  assert.deepEqual(
    api.calls
      .filter((c) => c.method === "PUT" && c.path === "/v1/me/route")
      .at(-1)?.body,
    {
      siteIds: [...full, "a"],
    },
  );
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
  const camera = { target: null, azimuthDeg: 10, elevationDeg: 20, distance: 0.6 };
  // The camera and the interior flag travel in the public detail and come back unchanged through the domain site.
  const published = () => {
    const site = siteA();
    return { ...site, sources: [source1], stories: site.stories.map((s) => ({ ...s, camera, interior: true })) };
  };
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
  const write =
    (out: unknown = {}) =>
    (c: Call) => {
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
      return {
        uploadId: `up${upload}`,
        url: `/v1/media/uploads/up${upload}/content`,
        headers: {},
      };
    },
    "PUT /v1/media/uploads/up1/content": () =>
      new Response(null, { status: 204 }),
    "PUT /v1/media/uploads/up2/content": () =>
      new Response(null, { status: 204 }),
    "POST /v1/media/uploads/up1/complete": write({ id: "p-new" }),
    "POST /v1/media/uploads/up2/complete": write({ id: "m-new" }),
    "PATCH /v1/admin/media/cover": write(),
    "PUT /v1/admin/sites/a/model": (c) => {
      const body = c.body;
      if (
        body &&
        typeof body === "object" &&
        "mediaId" in body &&
        typeof body.mediaId === "string"
      )
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
  const newSource = {
    ...source1,
    id: "src-new",
    title: "Yeni kaynak",
  } as const;
  await client.dispatch({
    type: "site",
    site: {
      ...site,
      city: "Kütahya",
      sources: [...site.sources!, newSource],
      photos: [
        ...site.photos!.map((p) =>
          p.id === "cover" ? { ...p, title: "Kapak" } : p,
        ),
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
        {
          id: "s-new",
          title: "İki",
          text: "t",
          simple: "s",
          trust: "inferred",
          photoId: "extra",
          sourceId: "src-new",
        },
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
        {
          sources: [
            { ...source1, locator: "s. 42" },
            { ...newSource, locator: null },
          ],
        },
      ],
      // Photos in list order: the edited cover first, then the new file.
      [
        "PATCH",
        "/v1/admin/media/cover",
        {
          alt: "cover",
          title: "Kapak",
          titleEn: null,
          description: "",
          license: "CC BY",
          sourceId: null,
          trust: "verified",
        },
      ],
      [
        "POST",
        "/v1/media/uploads",
        { kind: "photo", contentType: "image/png", bytes: 8 },
      ],
      [
        "POST",
        "/v1/media/uploads/up1/complete",
        {
          alt: "Yeni",
          title: "Yeni",
          titleEn: null,
          description: "",
          license: "CC BY",
          sourceId: "src-new",
          trust: "verified",
        },
      ],
      [
        "POST",
        "/v1/media/uploads",
        { kind: "model", contentType: "model/gltf-binary", bytes: 8 },
      ],
      [
        "POST",
        "/v1/media/uploads/up2/complete",
        {
          title: "yeni.glb",
          license: "Katkı sahibi izniyle",
          trust: "representative",
        },
      ],
      ["PUT", "/v1/admin/sites/a/model", { mediaId: "m-new" }],
      [
        "PUT",
        "/v1/admin/sites/a/media",
        { photoIds: ["cover", "extra", "p-new"], coverPhotoId: "p-new" },
      ],
      [
        "PUT",
        "/v1/admin/sites/a/stories",
        {
          blocks: [
            {
              id: "s1",
              title: "t",
              text: "x",
              textEn: null,
              simple: "y",
              trust: "verified",
              photoId: "p-new",
              sourceId: null,
              showCard: null,
              highlights: ["minare"],
              cardId: "card-1",
              camera: { target: null, azimuthDeg: 10, elevationDeg: 20, distance: 0.6 },
              interior: true,
              audioMediaId: "voice",
              audioEnMediaId: null,
            },
            {
              id: "s-new",
              title: "İki",
              text: "t",
              textEn: null,
              simple: "s",
              trust: "inferred",
              photoId: "extra",
              sourceId: "src-new",
              showCard: null,
              highlights: [],
              cardId: null,
              camera: null,
              interior: false,
              audioMediaId: null,
              audioEnMediaId: null,
            },
          ],
        },
      ],
    ],
  );
  // The highlights wait for the new model's part names: read after the model is set, before the story.
  const order = api.calls.map((c) => `${c.method} ${c.path}`);
  const modelSet = order.indexOf("PUT /v1/admin/sites/a/model");
  assert.ok(
    order.slice(modelSet).indexOf("GET /v1/admin/sites/a") <
      order.slice(modelSet).indexOf("PUT /v1/admin/sites/a/stories"),
  );
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
    pending: [
      pendingItem("q1", "b"),
      { ...pendingItem("r1", "a"), status: "approved" },
    ],
    approved: [
      { ...pendingItem("r1", "a"), status: "approved" },
      { ...pendingItem("a1", "a"), status: "approved" },
    ],
    rejected: [
      { ...pendingItem("x1", "b"), status: "rejected", reason: "Uygunsuz" },
    ],
  };
  const mod = await asRole("moderator", {
    "GET /v1/admin/memories": (c) => ({
      items:
        byStatus[
          new URL(c.path, "http://api.test").searchParams.get("status") ?? ""
        ] ?? [],
      nextCursor: null,
    }),
  });
  assert.deepEqual(mod.memories, []);
  assert.deepEqual(mod.moderationQueue?.map((m) => [m.id, m.status]).sort(), [
    ["q1", "pending"],
    ["r1", "approved"],
  ]);
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

for (const capacity of [99, 100]) {
  test(`sign-in preserves guest overflow when the account has ${capacity} stops`, async () => {
    const store = storage();
    let tokenValue: string | null = null;
    let accountRoute = Array.from({ length: capacity }, (_, i) => `full-${i}`);
    const api = fakeApi({
      ...catalogHandlers(),
      ...accountHandlers({ T: { saved: [], points: 0 } }),
      "GET /v1/site-details": () => ({
        items: [
          ...accountRoute.map((id) => detail(id)),
          detail("a"),
          detail("b"),
        ],
        nextCursor: null,
      }),
      "GET /v1/me/route": () => ({ siteIds: accountRoute }),
      "PUT /v1/me/route": (c) => {
        accountRoute = (c.body as { siteIds: string[] }).siteIds;
        return { siteIds: accountRoute };
      },
    });
    const client = createHttpClient({
      baseUrl: "http://api.test",
      storage: store,
      getToken: () => tokenValue,
      fetch: api.fetch,
    });
    await client.dispatch({ type: "set-route", siteIds: ["a", "b"] });
    tokenValue = "T";
    const first = await client.getSnapshot();
    const overflow = capacity === 99 ? ["b"] : ["a", "b"];
    assert.equal(first.routeIds.length, 100);
    assert.equal(first.pendingRouteCount, overflow.length);
    assert.deepEqual(
      JSON.parse(store.getItem(httpStorageKey)!).route,
      overflow,
    );
    await client.getSnapshot();
    assert.deepEqual(
      JSON.parse(store.getItem(httpStorageKey)!).route,
      overflow,
      "repeat sign-in keeps the remainder",
    );
    accountRoute = accountRoute.slice(2);
    const moved = await client.getSnapshot();
    assert.equal(moved.pendingRouteCount, 0);
    assert.ok(moved.routeIds.includes("a") && moved.routeIds.includes("b"));
    assert.equal(new Set(moved.routeIds).size, moved.routeIds.length);
    assert.deepEqual(JSON.parse(store.getItem(httpStorageKey)!).route, []);
  });
}

for (const failFirst of [false, true]) {
  test(`editor keeps canonical media and reuses uploads after partial failure=${failFirst}`, async () => {
    let uploads = 0;
    let fail = failFirst;
    let stored: any = {
      ...detail("d1"),
      status: "draft",
      sourceLinks: [],
      openingCamera: null,
      photoIds: [],
    };
    const api = fakeApi({
      ...catalogHandlers(),
      ...accountHandlers({ T: { saved: [], points: 0 } }, "editor"),
      "GET /v1/admin/site-details": () => ({
        items: [stored],
        nextCursor: null,
      }),
      "GET /v1/admin/sites/d1": () => stored,
      "POST /v1/media/uploads": () => ({
        uploadId: `up${++uploads}`,
        url: "http://api.test/upload",
        headers: {},
      }),
      "PUT /upload": () => new Response(null, { status: 204 }),
      "POST /v1/media/uploads/up1/complete": () => ({ id: "p1" }),
      "POST /v1/media/uploads/up2/complete": () => ({ id: "m1" }),
      "PATCH /v1/admin/media/p1": () => media("p1", "photo"),
      "PATCH /v1/admin/media/m1": () => media("m1", "model"),
      "PUT /v1/admin/sites/d1/model": () => {
        stored = {
          ...stored,
          media: [
            ...stored.media.filter((m: any) => m.kind !== "model"),
            media("m1", "model", { title: "New model" }),
          ],
        };
        return stored;
      },
      "PUT /v1/admin/sites/d1/media": (c) => {
        if (fail) {
          fail = false;
          return Response.json(
            {
              error: {
                code: "INTERNAL",
                message: "Retry",
                fieldErrors: {},
                requestId: "r",
              },
            },
            { status: 500 },
          );
        }
        const b = c.body as { photoIds: string[]; coverPhotoId: string | null };
        stored = {
          ...stored,
          photoIds: b.photoIds,
          coverMediaId: b.coverPhotoId,
          media: [
            ...stored.media.filter((m: any) => m.kind !== "photo"),
            ...b.photoIds.map((id) => media(id, "photo", { alt: "New photo" })),
          ],
        };
        return stored;
      },
      "PATCH /v1/admin/sites/d1/info": (c) => {
        stored = { ...stored, ...(c.body as object) };
        return stored;
      },
    });
    const client = createHttpClient({
      baseUrl: "http://api.test",
      storage: storage(),
      getToken: () => "T",
      fetch: api.fetch,
    });
    const site = (await client.getSnapshot()).sites.find((s) => s.id === "d1")!;
    const input: HeritageSite = {
      ...site,
      photos: [
        {
          id: "tmp-photo",
          src: "data:image/png;base64,iVBORw0KGgo=",
          alt: "New photo",
          title: "",
          titleEn: "",
          description: "",
          sourceId: "",
          license: "CC BY",
          trust: "verified",
        },
      ],
      coverPhotoId: "tmp-photo",
      model: {
        src: "data:model/gltf-binary;base64,Z2xURg==",
        name: "New model",
        bytes: 4,
        parts: [],
        trust: "verified",
      },
    };
    if (failFirst) await assert.rejects(client.saveSite(input), /Retry/);
    const saved = await client.saveSite(input);
    assert.equal(saved.site.coverPhotoId, "p1");
    assert.equal(saved.site.photos?.[0]?.src, "https://cdn.test/p1");
    assert.equal(saved.site.model?.src, "https://cdn.test/m1");
    await client.saveSite({ ...saved.site, name: "Changed title" });
    assert.equal(
      uploads,
      2,
      "exactly one photo and one model upload across retries and subsequent saves",
    );
    assert.equal(stored.name, "Changed title");
  });
}

test("explicit gallery ids preserve photos also used by cards and history across editor saves", async () => {
  let stored: any = {
    ...siteA(),
    status: "published",
    photoIds: ["cover", "card-img", "old", "extra"],
    sourceLinks: [],
    openingCamera: null,
  };
  const api = fakeApi({
    ...catalogHandlers(),
    ...accountHandlers({ T: { saved: [], points: 0 } }, "editor"),
    "GET /v1/site-details": () => ({ items: [stored], nextCursor: null }),
    "GET /v1/sites/a": () => stored,
    "GET /v1/admin/sites/a": () => stored,
    "PUT /v1/admin/sites/a/media": (c) => {
      const b = c.body as { photoIds: string[]; coverPhotoId: string };
      stored = {
        ...stored,
        photoIds: b.photoIds,
        coverMediaId: b.coverPhotoId,
      };
      return stored;
    },
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    getToken: () => "T",
    fetch: api.fetch,
  });
  const current = (await client.getSnapshot()).sites[0]!;
  assert.deepEqual(
    current.photos?.map((p) => p.id),
    ["cover", "card-img", "old", "extra"],
  );
  await client.saveSite({ ...current, coverPhotoId: "extra" });
  assert.deepEqual(stored.photoIds, ["cover", "card-img", "old", "extra"]);
});

test("moderation reads one bounded page per selected tab and forwards its cursor", async () => {
  const api = fakeApi({
    ...catalogHandlers(),
    ...accountHandlers({ T: { saved: [], points: 0 } }, "moderator"),
    "GET /v1/admin/memories": (c) => ({
      items: [pendingItem(c.path.includes("cursor=next") ? "q2" : "q1", "a")],
      nextCursor: c.path.includes("cursor=next") ? null : "next",
    }),
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    getToken: () => "T",
    fetch: api.fetch,
  });
  await client.getSnapshot();
  let reads = api.calls.filter((c) => c.path.startsWith("/v1/admin/memories"));
  assert.equal(reads.length, 1);
  assert.equal(
    new URL(reads[0]!.path, "http://api.test").searchParams.get("limit"),
    "25",
  );
  const first = await client.getModerationPage("rejected");
  const next = await client.getModerationPage("rejected", first.nextCursor!);
  reads = api.calls.filter((c) => c.path.startsWith("/v1/admin/memories"));
  assert.equal(reads.length, 3, "does not eagerly follow pagination");
  assert.ok(
    reads[2]!.path.includes("status=rejected") &&
      reads[2]!.path.includes("cursor=next"),
  );
  assert.equal(next.items[0]?.id, "q2");
});

test("draft route loading uses one page without detail requests for each route", async () => {
  const api = fakeApi({
    ...catalogHandlers(),
    ...accountHandlers({ T: { saved: [], points: 0 } }, "editor"),
    "GET /v1/admin/routes": () => ({
      items: Array.from({ length: 30 }, (_, i) => ({
        id: `draft-${i}`,
        name: "Route",
        nameEn: null,
        description: "",
        theme: "",
        status: "draft",
        stops: [{ site: { id: "a" }, quizId: null, historyImageId: null }],
      })),
      nextCursor: null,
    }),
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    getToken: () => "T",
    fetch: api.fetch,
  });
  const state = await client.getSnapshot();
  assert.equal(
    state.catalogRoutes?.filter((r) => r.status === "draft").length,
    30,
  );
  assert.equal(
    api.calls.filter((c) => c.path.startsWith("/v1/admin/routes")).length,
    1,
  );
});

test("archive attribution and story-only photographs reach the UI without becoming gallery entries", async () => {
  const d = siteA();
  const archive = {
    ...d,
    photoIds: ["extra"],
    historyImages: [
      {
        id: "h1",
        mediaId: "old",
        presentMediaId: null,
        caption: "Eski yapı",
        dateLabel: "1890–1900",
        sourceId: "archive-source",
        trust: "inferred",
      },
    ],
  };
  const transport = fakeApi({
    ...catalogHandlers(),
    "GET /v1/site-details": () => ({ items: [archive], nextCursor: null }),
  });
  const client = createHttpClient({
    baseUrl: "https://api.test",
    fetch: transport.fetch,
    storage: storage(),
  });
  const snapshot = await client.getSnapshot();
  const site = snapshot.sites[0]!;
  assert.deepEqual(
    site.photos?.map((p) => p.id),
    ["extra"],
  );
  assert.deepEqual(
    site.storyPhotos?.map((p) => p.id),
    ["cover"],
  );
  assert.equal(site.historyImages?.[0]?.dateLabel, "1890–1900");
  assert.equal(site.historyImages?.[0]?.photo.license, "CC BY");
  assert.equal(site.historyImages?.[0]?.sourceId, "archive-source");
  assert.equal(site.historyImages?.[0]?.presentPhoto, undefined);
});

test("«Eser hakkında» chapters, paragraph photos and the cover reach the UI; none of them become gallery photos; an older API has none", async () => {
  const chapter = {
    id: "ch1",
    title: "Tarihçe",
    kind: "history",
    summary: ["Bir cümle."],
    figures: [{ value: "1399", label: "açılış yılı", evidence: "1399 yılında" }],
    quotes: [{ text: "Alıntı", by: null }, { text: "Başka", by: "Evliya Çelebi" }],
    timeline: [{ year: "1399", evidence: "1399 yılında" }],
    terms: [{ word: "mihrap", definition: "Kıble yönünü gösteren niş" }],
    camera: { target: null, azimuthDeg: 0, elevationDeg: 30, distance: 1 },
    interior: true,
    focusParts: ["Kubbeler_19"],
  };
  const base = detail("about", {
    media: [
      media("cover", "photo"),
      media("book1", "photo"),
      media("book-missing", "model"),
    ],
    coverMediaId: "cover",
    photoIds: ["cover"],
    aboutCoverMediaId: "book1",
    chapters: [chapter],
    sections: [
      {
        id: "s1",
        kind: "history",
        title: "Tarihçe",
        body: "Metin.",
        trust: "verified",
        sourceId: null,
        chapterId: "ch1",
        photos: [
          { mediaId: "book1", aspect: 1.5, alt: "Kitap fotoğrafı" },
          { mediaId: "book-missing", aspect: null, alt: "Yok" },
        ],
      },
      {
        id: "s2",
        kind: "history",
        title: "Tarihçe",
        body: "Bağsız.",
        trust: "inferred",
        sourceId: null,
      },
    ],
  });
  const api = fakeApi({
    ...catalogHandlers(),
    "GET /v1/site-details": () => ({
      items: [base, detail("old")],
      nextCursor: null,
    }),
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    fetch: api.fetch,
  });
  const [site, old] = (await client.getSnapshot()).sites;
  assert.deepEqual(site!.chapters, [
    {
      ...chapter,
      quotes: [{ text: "Alıntı" }, { text: "Başka", by: "Evliya Çelebi" }],
      camera: chapter.camera,
    },
  ]);
  assert.equal(site!.aboutCover?.id, "book1");
  assert.deepEqual(
    site!.photos?.map((p) => p.id),
    ["cover"],
  );
  const [first, second] = site!.sections!;
  assert.equal(first!.chapterId, "ch1");
  assert.deepEqual(
    first!.photos?.map((p) => [p.photo.id, p.aspect, p.alt]),
    [["book1", 1.5, "Kitap fotoğrafı"]],
  );
  assert.equal(second!.chapterId, undefined);
  assert.equal(second!.photos, undefined);
  assert.equal(old!.chapters, undefined);
  assert.equal(old!.aboutCover, undefined);
});

test("a present-day pair keeps its credit line and angle word, İz Bırak samples reach the UI beside the archive images and are never gallery photos; an older API has none", async () => {
  const credit = "Fotoğraf: Bursa Vakıf Eserleri Envanteri";
  const base = detail("pairs", {
    coverMediaId: "cover",
    media: [
      media("cover", "photo"),
      media("old", "photo", { description: "Fotoğraf: Eski fotoğrafçı" }),
      media("now", "photo", { description: credit, license: "Proje için verildi" }),
      media("old-2", "photo"),
      media("iz", "photo", { description: `${credit} (örnek katkı olarak gösteriliyor)` }),
      media("iz-lost", "model"),
    ],
    historyImages: [
      { id: "h1", mediaId: "old", presentMediaId: "now", presentAngleMatch: "near", caption: "Eski", dateLabel: "1875–84", sourceId: null, trust: "verified" },
      { id: "h2", mediaId: "old-2", presentMediaId: null, presentAngleMatch: null, caption: "Eski 2", dateLabel: "1930", sourceId: null, trust: "verified" },
    ],
    sampleTraces: [
      { id: "iz1", author: "AKAR ekibi", text: "Aynı eksen.", mediaId: "iz", historyImageId: "h2", angleMatch: "same", addedOn: "2026-10-28" },
      { id: "iz2", author: "AKAR ekibi", text: "Avludan.", mediaId: "iz", historyImageId: null, angleMatch: null, addedOn: "2026-10-29" },
      { id: "iz3", author: "AKAR ekibi", text: "Fotoğrafı yok.", mediaId: "iz-lost", historyImageId: null, angleMatch: null, addedOn: "2026-10-30" },
    ],
  });
  // A version that sends samples but no gallery list leaves the gallery to the media list: a sample's photograph stays out of it.
  const legacy = detail("legacy", {
    coverMediaId: "cover",
    media: [media("cover", "photo"), media("iz", "photo")],
    sampleTraces: [{ id: "iz1", author: "AKAR ekibi", text: "Aynı eksen.", mediaId: "iz", historyImageId: null, angleMatch: null, addedOn: "2026-10-28" }],
  });
  const older = detail("old", { coverMediaId: "cover", media: [media("cover", "photo")] });
  const api = fakeApi({
    ...catalogHandlers(),
    "GET /v1/site-details": () => ({ items: [{ ...base, photoIds: ["cover"] }, legacy, older], nextCursor: null }),
  });
  const client = createHttpClient({ baseUrl: "http://api.test", storage: storage(), fetch: api.fetch });
  const [site, mid, old] = (await client.getSnapshot()).sites;
  const [paired, alone] = site!.historyImages!;
  assert.deepEqual([paired!.presentPhoto?.id, paired!.presentPhoto?.description, paired!.presentAngleMatch], ["now", credit, "near"]);
  assert.deepEqual([alone!.presentPhoto, alone!.presentAngleMatch], [undefined, undefined]);
  assert.deepEqual(
    site!.sampleTraces?.map((t) => [t.id, t.author, t.text, t.photo.id, t.photo.description, t.addedOn, t.historyImageId, t.angleMatch]),
    [
      ["iz1", "AKAR ekibi", "Aynı eksen.", "iz", `${credit} (örnek katkı olarak gösteriliyor)`, "2026-10-28", "h2", "same"],
      ["iz2", "AKAR ekibi", "Avludan.", "iz", `${credit} (örnek katkı olarak gösteriliyor)`, "2026-10-29", undefined, undefined],
    ],
    "a sample whose photograph is not in the media list is left out; empty links stay off the object",
  );
  assert.deepEqual(site!.photos?.map((p) => p.id), ["cover"], "pair and sample photographs are not gallery photos");
  assert.deepEqual(mid!.photos?.map((p) => p.id), ["cover"], "without a gallery list a sample's photograph is still not a gallery photo");
  assert.equal(mid!.sampleTraces?.length, 1);
  assert.equal(old!.sampleTraces, undefined);
});

test("member administration uses protected, uncached endpoints and sends the expected role", async () => {
  const member = {
    userId: "member-1",
    email: "uye@akar.test",
    displayName: null,
    role: "user",
    emailConfirmed: true,
    createdAt: "2026-10-01T00:00:00Z",
    lastSignInAt: null,
  };
  const api = fakeApi({
    "GET /v1/admin/users": () => ({ items: [member], page: 2, nextPage: 3 }),
    "PUT /v1/admin/users/member-1/role": () => ({ ...member, role: "admin" }),
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    getToken: () => "admin-token",
    fetch: async (input, init) => {
      if (init?.method === "GET") assert.equal(init.cache, "no-store");
      return api.fetch(input, init);
    },
  });
  const page = await client.getMembers("uye+test@akar.test", 2);
  assert.equal(page.nextPage, 3);
  const query = new URL(`http://api.test${api.calls[0]!.path}`).searchParams;
  assert.equal(query.get("query"), "uye+test@akar.test");
  assert.equal(query.get("page"), "2");
  assert.equal(query.get("pageSize"), "25");
  assert.equal(
    (await client.setMemberRole("member-1", "admin", "user")).role,
    "admin",
  );
  assert.deepEqual(api.calls[1]!.body, { role: "admin", expectedRole: "user" });
  assert.ok(api.calls[1]!.headers["idempotency-key"]);
  assert.ok(
    api.calls.every(
      (call) => call.headers.authorization === "Bearer admin-token",
    ),
  );
});

const placement = (extra = {}) => ({
  lng: 29.0619,
  lat: 40.184,
  headingDeg: 174,
  scale: 1,
  altitudeM: 0,
  anchorNode: "Govde",
  hiddenPoints: [{ lng: 29.06, lat: 40.18 }],
  keptPoints: [],
  ...extra,
});

test("a model carries its triangle count and the site's placement; both are null when the API has none", async () => {
  const api = fakeApi({
    ...catalogHandlers(),
    "GET /v1/site-details": () => ({
      items: [
        detail("placed", {
          media: [media("glb", "model", { triangles: 87280 })],
          placement: placement(),
        }),
        // An older API: neither field exists.
        detail("old", { media: [media("glb2", "model")] }),
        // Placement hidden or missing: the model is there, the map shows nothing.
        detail("hidden", {
          media: [media("glb3", "model", { triangles: null })],
          placement: null,
        }),
        detail("plain"),
      ],
      nextCursor: null,
    }),
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    fetch: api.fetch,
  });
  const [placed, old, hidden, plain] = (await client.getSnapshot()).sites;
  assert.equal(placed!.model?.triangles, 87280);
  assert.deepEqual(placed!.model?.placement, placement());
  assert.equal(old!.model?.triangles, null);
  assert.equal(old!.model?.placement, null);
  assert.equal(hidden!.model?.triangles, null);
  assert.equal(hidden!.model?.placement, null);
  assert.equal(plain!.model, undefined);
});

test("a site's displayOrder (eser.json sira) is mapped when it is a number and left out for null or an older API", async () => {
  const withoutField = () => {
    const { displayOrder: _omitted, ...rest } = detail("old");
    return rest;
  };
  const api = fakeApi({
    ...catalogHandlers(),
    "GET /v1/site-details": () => ({
      items: [
        detail("first", { displayOrder: 1 }),
        detail("seventh", { displayOrder: 7 }),
        detail("unranked", { displayOrder: null }),
        withoutField(),
      ],
      nextCursor: null,
    }),
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    fetch: api.fetch,
  });
  const [first, seventh, unranked, old] = (await client.getSnapshot()).sites;
  assert.equal(first!.displayOrder, 1);
  assert.equal(seventh!.displayOrder, 7);
  assert.ok(!("displayOrder" in unranked!), "null is unranked, not a value");
  assert.ok(!("displayOrder" in old!), "an older API has no field");
});

test("map settings come from GET /v1/map-settings; missing values fall back to the defaults", async () => {
  let body: unknown = { modelMinZoom: 15.5, maxVisibleModels: 8 };
  const api = fakeApi({ "GET /v1/map-settings": () => body });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    fetch: api.fetch,
  });
  assert.deepEqual(await client.getMapSettings(), {
    modelMinZoom: 15.5,
    maxVisibleModels: 8,
  });
  body = { maxVisibleModels: 0 };
  assert.deepEqual(await client.getMapSettings(), {
    modelMinZoom: 16,
    maxVisibleModels: 0,
  });
  body = Response.json(
    { code: "INTERNAL", message: "x", requestId: "r" },
    { status: 500 },
  );
  await assert.rejects(client.getMapSettings(), ApiError);
});

test("refreshCatalog re-reads the catalog, shares concurrent reads and keeps the old data when the read fails", async () => {
  let heading = 174;
  let fail = false;
  let reads = 0;
  const api = fakeApi({
    ...catalogHandlers(),
    "GET /v1/site-details": () => {
      reads++;
      if (fail) return Response.json({ message: "down" }, { status: 503 });
      return {
        items: [
          detail("a", {
            media: [media("glb", "model", { triangles: 10 })],
            placement: placement({ headingDeg: heading }),
          }),
        ],
        nextCursor: null,
      };
    },
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    fetch: api.fetch,
  });
  const first = await client.getSnapshot();
  assert.equal(first.sites[0]!.model?.placement?.headingDeg, 174);
  assert.equal(reads, 1);
  // The administrator moved the model; two triggers (timer and tab focus) arrive together.
  heading = 90;
  const [x, y] = await Promise.all([
    client.refreshCatalog(),
    client.refreshCatalog(),
  ]);
  assert.equal(reads, 2, "one read for both callers");
  assert.equal(x.sites[0]!.model?.placement?.headingDeg, 90);
  assert.deepEqual(y, x);
  // Later reads of the snapshot see the new catalog without another request.
  assert.equal(
    (await client.getSnapshot()).sites[0]!.model?.placement?.headingDeg,
    90,
  );
  assert.equal(reads, 2);
  // A failed refresh throws and leaves what the visitor already has.
  fail = true;
  heading = 45;
  await assert.rejects(client.refreshCatalog());
  fail = false;
  assert.equal(
    (await client.getSnapshot()).sites[0]!.model?.placement?.headingDeg,
    90,
  );
  assert.equal(
    (await client.refreshCatalog()).sites[0]!.model?.placement?.headingDeg,
    45,
  );
});

test("the placement command PUTs the whole placement with an Idempotency-Key, re-reads the site, and the panel read keeps a placement the catalog hides", async () => {
  let stored: Record<string, unknown> | null = null;
  const withModel = () =>
    detail("a", {
      coordinates: [29.06, 40.18],
      media: [media("glb", "model", { parts: ["Govde"], triangles: 100 })],
    });
  const api = fakeApi({
    ...catalogHandlers(),
    ...accountHandlers({ T: { saved: [], points: 0 } }, "editor"),
    "GET /v1/site-details": () => ({ items: [withModel()], nextCursor: null }),
    "GET /v1/admin/sites/a": () => ({
      ...withModel(),
      status: "published",
      openingCamera: null,
      sourceLinks: [],
      // What a visitor sees: nothing once `visible` is off.
      placement: stored && stored.visible ? { ...stored, lng: 29.0619 } : null,
      // What the panel sees: the saved values in every case; lng/lat null = the site's own location.
      mapPlacement: stored && {
        ...stored,
        lng: stored.lng ?? null,
        lat: stored.lat ?? null,
        updatedAt: "2026-10-28T10:00:00Z",
      },
    }),
    "PUT /v1/admin/sites/a/map-placement": (c) => {
      stored = c.body as Record<string, unknown>;
      return {};
    },
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    getToken: () => "T",
    fetch: api.fetch,
  });
  await client.getSnapshot();
  assert.equal(await client.getMapPlacement("a"), null);

  const hidden = {
    lng: 29.0625,
    lat: 40.1841,
    headingDeg: 90,
    scale: 1,
    altitudeM: 1.5,
    anchorNode: "Govde",
    hiddenPoints: [{ lng: 29.06, lat: 40.18 }],
    keptPoints: [],
    visible: false,
  };
  const snap = await client.dispatch({
    type: "map-placement",
    siteId: "a",
    placement: hidden,
  });
  const put = api.calls.find((c) => c.method === "PUT")!;
  assert.equal(put.path, "/v1/admin/sites/a/map-placement");
  assert.ok(put.headers["idempotency-key"]);
  assert.deepEqual(put.body, hidden);
  // The catalog re-read hides it from the map; the panel read still has every value.
  assert.equal(snap.sites.find((s) => s.id === "a")!.model?.placement, null);
  assert.deepEqual(await client.getMapPlacement("a"), hidden);

  // A placement without `visible` (the visitor view of one) is sent as shown; a bad value is refused before any request.
  const { visible: _visible, ...asPublic } = hidden;
  await client.dispatch({
    type: "map-placement",
    siteId: "a",
    placement: asPublic,
  });
  assert.equal(
    (
      api.calls.filter((c) => c.method === "PUT").at(-1)!.body as {
        visible: boolean;
      }
    ).visible,
    true,
  );
  const puts = api.calls.filter((c) => c.method === "PUT").length;
  await assert.rejects(
    client.dispatch({
      type: "map-placement",
      siteId: "a",
      placement: { ...hidden, headingDeg: 360 },
    }),
    /Yön/,
  );
  assert.equal(api.calls.filter((c) => c.method === "PUT").length, puts);
});

test("a placement is saved for a draft too, a model left unchanged is no model change, and API errors reach the editor with their field messages", async () => {
  const model = () => media("glb", "model", { parts: ["Govde"] });
  const draft = () => ({
    ...detail("d1", { media: [model()] }),
    status: "draft",
    openingCamera: null,
    sourceLinks: [],
    mapPlacement: {
      lng: null,
      lat: null,
      headingDeg: 10,
      scale: 1,
      altitudeM: 0,
      anchorNode: null,
      hiddenPoints: [],
      keptPoints: [],
      visible: true,
      updatedAt: "2026-10-28T10:00:00Z",
    },
  });
  let answer: Response | null = null;
  const api = fakeApi({
    ...catalogHandlers(),
    ...accountHandlers({ T: { saved: [], points: 0 } }, "editor"),
    "GET /v1/admin/site-details": () => ({
      items: [draft()],
      nextCursor: null,
    }),
    "GET /v1/admin/sites/d1": () => draft(),
    "PUT /v1/admin/sites/d1/map-placement": () => answer ?? {},
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    getToken: () => "T",
    fetch: api.fetch,
  });
  const d1 = (await client.getSnapshot()).sites.find((s) => s.id === "d1")!;
  // The draft shows its saved placement; no location stored = the site's own (the placeholder here).
  assert.equal(d1.model?.placement?.headingDeg, 10);
  assert.deepEqual(
    [d1.model?.placement?.lng, d1.model?.placement?.lat],
    d1.coordinates,
  );
  assert.equal(d1.model?.placement?.visible, true);

  // A site save carrying a stale placement on its model writes nothing about the model.
  await client.dispatch({
    type: "site",
    site: {
      ...d1,
      model: {
        ...d1.model!,
        placement: { ...d1.model!.placement!, headingDeg: 99 },
      },
    },
  });
  assert.deepEqual(
    api.calls.filter((c) => c.method !== "GET").map((c) => c.path),
    [],
  );

  answer = Response.json(
    {
      error: {
        code: "VALIDATION_FAILED",
        message: "Girdi doğrulanamadı.",
        fieldErrors: { lng: ["Konum Bursa sınırları dışında."] },
        requestId: "r",
      },
    },
    { status: 400 },
  );
  await assert.rejects(
    client.dispatch({
      type: "map-placement",
      siteId: "d1",
      placement: d1.model!.placement!,
    }),
    (e) =>
      e instanceof ApiError &&
      e.status === 400 &&
      e.fieldErrors.lng?.[0] === "Konum Bursa sınırları dışında.",
  );
  answer = Response.json(
    {
      error: {
        code: "CONFLICT",
        message:
          "Eserin 3B modeli yok; haritada yerleşim için önce model bağla.",
        fieldErrors: {},
        requestId: "r",
      },
    },
    { status: 409 },
  );
  await assert.rejects(
    client.dispatch({
      type: "map-placement",
      siteId: "d1",
      placement: d1.model!.placement!,
    }),
    (e) => e instanceof ApiError && e.status === 409,
  );
});

const taskDto = {
  id: "t-quiz",
  kind: "quiz",
  title: "Minberin sırrı",
  prompt: "Hangi teknik?",
  photoId: "p1",
  part: "Minber",
  source: "E cilt-1 PDF s.27",
  trust: "verified",
  quiz: {
    options: ["A", "B"],
    hints: ["ipucu"],
    wrongText: "Tekrar dene.",
    fromHome: true,
  },
};
const fieldTaskDto = {
  id: "t-field",
  kind: "field",
  title: "Kapı",
  prompt: "Kapıyı bul.",
  photoId: null,
  part: null,
  source: null,
  trust: "verified",
  field: {
    onSite: { text: "Önüne gel.", radiusM: 80 },
    fromHome: { text: "Modelde dokun.", part: "Tac_Kapi" },
  },
};
const badgeDto = {
  id: "b-task",
  title: "Kapı",
  text: "Kapıyı buldun.",
  condition: "task",
  taskId: "t-field",
  onSiteLabel: true,
};

test("site tasks and badges reach the UI with their photo resolved; the answer key is not in them; an older API has none", async () => {
  const api = fakeApi({
    ...catalogHandlers(),
    "GET /v1/site-details": () => ({
      items: [
        detail("t", {
          media: [media("p1", "photo")],
          tasks: [taskDto, fieldTaskDto],
          badges: [badgeDto],
        }),
        detail("old"),
      ],
      nextCursor: null,
    }),
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    fetch: api.fetch,
  });
  const [site, old] = (await client.getSnapshot()).sites;
  const [quiz, field] = site!.tasks!;
  assert.equal(quiz!.photo?.id, "p1");
  assert.equal(quiz!.photo?.src, "https://cdn.test/p1");
  assert.equal(quiz!.part, "Minber");
  assert.equal(quiz!.source, "E cilt-1 PDF s.27");
  assert.deepEqual(quiz!.quiz, taskDto.quiz);
  assert.equal(field!.photo, undefined);
  assert.equal(field!.part, undefined);
  assert.equal(field!.source, undefined);
  assert.deepEqual(field!.field, fieldTaskDto.field);
  assert.deepEqual(site!.badges, [badgeDto]);
  assert.ok(!JSON.stringify(site).includes("correct"));
  assert.equal(old!.tasks, undefined);
  assert.equal(old!.badges, undefined);
  // A task photograph is a site photograph: it stays in the gallery.
  assert.deepEqual(
    site!.photos?.map((p) => p.id),
    ["p1"],
  );
});

test("a guest answers and completes tasks without a token; a signed-in user's token is sent; the position goes as lat/lng", async () => {
  let token: string | null = null;
  const api = fakeApi({
    "POST /v1/site-tasks/t-quiz/answer": (c) =>
      (c.body as { choice: number }).choice === 1
        ? {
            correct: true,
            correctText: "Doğru.",
            wrongText: null,
            earnedBadges: token ? [badgeDto] : [],
          }
        : {
            correct: false,
            correctText: null,
            wrongText: "Tekrar dene.",
            earnedBadges: [],
          },
    "POST /v1/site-tasks/t-field/complete": (c) => {
      const body = c.body as { mode: string; part?: string };
      if (body.mode === "fromHome" && body.part !== "Tac_Kapi")
        return Response.json(
          {
            error: {
              code: "WRONG_PART",
              message: "Bu parça değil.",
              fieldErrors: {},
              requestId: "r",
            },
          },
          { status: 422 },
        );
      if (body.mode === "onSite" && !token)
        return Response.json(
          {
            error: {
              code: "TOO_FAR",
              message: "Çok uzaktasın.",
              fieldErrors: {},
              requestId: "r",
            },
          },
          { status: 422 },
        );
      return {
        doneText: "Tamam.",
        onSite: body.mode === "onSite",
        earnedBadges: token ? [badgeDto] : [],
      };
    },
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    getToken: () => token,
    fetch: api.fetch,
  });
  const wrong = await client.answerSiteTask("t-quiz", 0);
  assert.deepEqual(
    [wrong.correct, wrong.correctText, wrong.wrongText, wrong.earnedBadges],
    [false, null, "Tekrar dene.", []],
  );
  const right = await client.answerSiteTask("t-quiz", 1);
  assert.deepEqual(
    [right.correct, right.correctText, right.earnedBadges],
    [true, "Doğru.", []],
  );
  const guestCall = api.calls[1]!;
  assert.equal(guestCall.headers.authorization, undefined);
  assert.ok(guestCall.headers["x-device-id"]);
  assert.ok(guestCall.headers["idempotency-key"]);
  assert.deepEqual(guestCall.body, { choice: 1 });

  assert.deepEqual(
    await client.completeSiteTask("t-field", {
      mode: "fromHome",
      part: "Cati",
    }),
    { done: false, reason: "wrongPart" },
  );
  assert.deepEqual(
    await client.completeSiteTask("t-field", {
      mode: "onSite",
      coordinates: [29.1, 40.2],
      accuracyM: 12,
    }),
    { done: false, reason: "tooFar" },
  );
  assert.deepEqual(api.calls.at(-1)?.body, {
    mode: "onSite",
    lat: 40.2,
    lng: 29.1,
    accuracyM: 12,
  });

  token = "tok";
  const earned = await client.answerSiteTask("t-quiz", 1);
  assert.deepEqual(earned.earnedBadges, [badgeDto]);
  assert.equal(api.calls.at(-1)?.headers.authorization, "Bearer tok");
  assert.deepEqual(
    await client.completeSiteTask("t-field", {
      mode: "onSite",
      coordinates: [29.1, 40.2],
    }),
    { done: true, doneText: "Tamam.", onSite: true, earnedBadges: [badgeDto] },
  );
  assert.deepEqual(api.calls.at(-1)?.body, {
    mode: "onSite",
    lat: 40.2,
    lng: 29.1,
  });
  assert.deepEqual(
    await client.completeSiteTask("t-field", {
      mode: "fromHome",
      part: "Tac_Kapi",
    }),
    { done: true, doneText: "Tamam.", onSite: false, earnedBadges: [badgeDto] },
  );
});

test("any other API error of a task request is thrown, not turned into an answer", async () => {
  const api = fakeApi({
    "POST /v1/site-tasks/t-field/complete": () =>
      Response.json(
        {
          error: {
            code: "VALIDATION_FAILED",
            message: "Geçersiz.",
            fieldErrors: {},
            requestId: "r",
          },
        },
        { status: 400 },
      ),
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    fetch: api.fetch,
  });
  await assert.rejects(
    client.completeSiteTask("t-field", { mode: "fromHome", part: "x" }),
    (e) => e instanceof ApiError && e.status === 400,
  );
});

test("site progress is read for a signed-in user and is empty without a request for a guest", async () => {
  let token: string | null = null;
  const progress = {
    tasks: [
      { taskId: "t-field", siteId: "t", onSite: true, completedAt: "2026-10-29T10:00:00Z" },
    ],
    badges: [
      { badgeId: "b-task", siteId: "t", onSite: true, earnedAt: "2026-10-29T10:00:00Z" },
    ],
  };
  const api = fakeApi({ "GET /v1/me/site-progress": () => progress });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    getToken: () => token,
    fetch: api.fetch,
  });
  assert.deepEqual(await client.getSiteProgress(), { tasks: [], badges: [] });
  assert.equal(api.calls.length, 0);
  token = "tok";
  assert.deepEqual(await client.getSiteProgress(), progress);
  assert.equal(api.calls[0]?.headers.authorization, "Bearer tok");
});
