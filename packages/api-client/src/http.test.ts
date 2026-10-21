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
  assert.deepEqual(
    snap.memories.map((m) => [m.id, m.status, m.author]).sort(),
    [
      ["m1", "approved", "Veli"],
      ["m3", "approved", "Veli"],
      ["own", "pending", "Ada"],
    ],
  );
  assert.equal(
    snap.memories.find((m) => m.id === "own")?.text,
    "benim bekleyen anım",
  );
});

test("a moderation approval re-reads the feed", async () => {
  let approved = false;
  const api = fakeApi({
    ...catalogHandlers(),
    "GET /v1/memories": () => ({
      items: approved ? [feedItem("m1", "a")] : [],
      nextCursor: null,
    }),
    "GET /v1/me": () => ({ id: "u", role: "moderator", displayName: "Mod" }),
    "GET /v1/me/passport": () => ({
      points: 0,
      saved: [],
      read: [],
      visited: [],
      quizzesSolved: [],
    }),
    "GET /v1/me/memories": () => ({ items: [], nextCursor: null }),
    "GET /v1/admin/memories": () => ({ items: [], nextCursor: null }),
    "POST /v1/admin/memories/m1/decision": () => {
      approved = true;
      return {};
    },
  });
  const client = createHttpClient({
    baseUrl: "http://api.test",
    storage: storage(),
    fetch: api.fetch,
    getToken: () => "tok",
  });
  assert.equal((await client.getSnapshot()).memories.length, 0);
  const snap = await client.dispatch({
    type: "moderate",
    id: "m1",
    status: "approved",
  });
  assert.deepEqual(
    snap.memories.map((m) => m.id),
    ["m1"],
  );
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
