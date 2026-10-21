import test from "node:test";
import assert from "node:assert/strict";
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
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    };
    calls.push(call);
    const handler = handlers[`${call.method} ${url.pathname}`];
    if (!handler) throw new Error(`unexpected ${call.method} ${call.path}`);
    const out = handler(call);
    return out instanceof Response ? out : Response.json(out);
  };
  return { calls, fetch };
}

const catalogHandlers = (): Record<string, Handler> => ({
  "GET /v1/sites": (c) =>
    c.path.includes("cursor=p2")
      ? { items: [{ id: "b" }], nextCursor: null }
      : { items: [{ id: "a" }], nextCursor: "p2" },
  "GET /v1/sites/a": () =>
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
    }),
  "GET /v1/sites/b": () => detail("b"),
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
});

test("snapshot maps site DTOs: coordinates order, photos without card/history media, model, route order, paging", async () => {
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
): Record<string, Handler> => {
  const of = (c: Call) => accounts[c.headers.authorization?.slice(7) ?? ""]!;
  return {
    "GET /v1/me": () => ({ id: "u", role: "user", displayName: "Ada" }),
    "GET /v1/me/passport": (c) => ({
      points: of(c).points,
      saved: of(c).saved,
      read: [],
      visited: [],
      quizzesSolved: [],
    }),
    "GET /v1/me/memories": () => ({ items: [], nextCursor: null }),
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

for (const failure of ["server", "network"] as const) {
  test(`a failed site re-read after an admin write surfaces and is reloaded later (${failure})`, async () => {
    let reread: "ok" | "fail" = "ok";
    const catalog = catalogHandlers();
    const api = fakeApi({
      ...catalog,
      ...accountHandlers({ T: { saved: [], points: 0 } }),
      "GET /v1/sites/a": (c) => {
        if (reread === "ok") return catalog["GET /v1/sites/a"]!(c);
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
      api.calls.filter((c) => c.path === "/v1/sites/a").length,
      3,
      "reloaded by the next read",
    );
  });
}
