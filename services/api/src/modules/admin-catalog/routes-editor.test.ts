import type { HeritageSite } from "@akar/domain";
import { and, count, eq } from "drizzle-orm";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { App } from "../../app.ts";
import { auditLog, catalogRoutes, historyImages, media, quizAnswers, quizzes, routeStops } from "../../db/schema/index.ts";
import { loadCatalog } from "../../db/seed.ts";
import type { ErrorBody } from "../../errors.ts";
import { authHeader } from "../../test/auth.ts";
import { startTestApp } from "../../test/harness.ts";
import type { RouteBundle, RouteDto } from "../routes/schemas.ts";
import { adminRouteRoutes } from "./routes-editor-routes.ts";
import type { AdminQuiz, AdminRoute, AdminRouteSummary } from "./routes-editor-schemas.ts";

const site = (id: string, name: string, over: Partial<HeritageSite> = {}): HeritageSite => ({
  id,
  name,
  city: "Bursa",
  district: "Hanlar Bölgesi",
  year: "1400",
  architect: "—",
  kind: "han",
  coordinates: [29.06, 40.18],
  minutes: 2,
  description: `${name} açıklaması`,
  status: "published",
  stories: [{ id: `${id}-s1`, title: "Başlık", text: "Metin", simple: "Metin", trust: "representative" }],
  source: "test",
  tier: "Tier 2",
  ...over,
});

// "taslak-han" is the only unpublished site; "izmir-cami" is in another city.
const sites: HeritageSite[] = [
  site("han-a", "Han A", { coordinates: [29.06, 40.18] }),
  site("han-b", "Han B", { coordinates: [29.07, 40.19] }),
  site("han-c", "Han C", { coordinates: [29.08, 40.2] }),
  site("taslak-han", "Taslak Han", { status: "draft", coordinates: [29.09, 40.21] }),
  site("izmir-cami", "İzmir Camii", { kind: "cami", city: "İzmir", district: "Konak", coordinates: [27.1, 38.4] }),
];

const editor = authHeader({ id: "editor-1", role: "editor" });
const admin = authHeader({ id: "admin-1", role: "admin" });
const visitor = authHeader({ id: "user-1", role: "user" });
const moderator = authHeader({ id: "moderator-1", role: "moderator" });

let app: App;
let stop: (() => Promise<void>) | undefined;

before(async () => {
  ({ app, stop } = await startTestApp({ register: [adminRouteRoutes] }));
  const db = app.deps.db;
  await loadCatalog(db, { sites, routes: [] });
  await db
    .insert(media)
    .values({ id: "foto-1", kind: "photo", mime: "image/jpeg", url: "https://cdn.akar.test/foto-1.jpg", alt: "Fotoğraf", license: "CC0", trust: "representative" });
  await db.insert(historyImages).values([
    { id: "gecmis-a", siteId: "han-a", position: 0, mediaId: "foto-1", trust: "representative" },
    { id: "gecmis-b", siteId: "han-b", position: 0, mediaId: "foto-1", trust: "representative" },
  ]);
});
after(() => stop?.());

type Method = "GET" | "POST" | "PUT" | "PATCH";

async function call<T>(method: Method, url: string, opts: { as?: Record<string, string>; body?: object; key?: string } = {}) {
  const res = await app.inject({
    method,
    url,
    headers: { ...(opts.as ?? editor), ...(opts.key ? { "idempotency-key": opts.key } : {}) },
    ...(opts.body ? { payload: opts.body } : {}),
  });
  return { res, body: res.json<T>() };
}

const publicGet = (url: string) => app.inject({ method: "GET", url });

const routeBody = (name: string, over: object = {}) => ({ name, description: "Açıklama", theme: "Test", cityId: "bursa", ...over });
const quizBody = (siteId: string, over: object = {}) => ({
  siteId,
  question: "Soru?",
  options: ["Birinci", "İkinci", "Üçüncü"],
  correctIndex: 1,
  explanation: "Gizli açıklama metni",
  trust: "verified",
  ...over,
});

async function newRoute(name: string, over: object = {}): Promise<AdminRoute> {
  const { res, body } = await call<AdminRoute>("POST", "/v1/admin/routes", { body: routeBody(name, over) });
  assert.equal(res.statusCode, 201, res.body);
  return body;
}

async function newQuiz(siteId: string, over: object = {}): Promise<AdminQuiz> {
  const { res, body } = await call<AdminQuiz>("POST", "/v1/admin/quizzes", { body: quizBody(siteId, over) });
  assert.equal(res.statusCode, 201, res.body);
  return body;
}

const setStops = (id: string, stops: object[]) => call<AdminRoute & ErrorBody>("PUT", `/v1/admin/routes/${id}/stops`, { body: { stops } });

const publish = (id: string) => call<AdminRoute & ErrorBody>("POST", `/v1/admin/routes/${id}/publish`);

const rowCounts = async () => {
  const db = app.deps.db;
  const [routes] = await db.select({ n: count() }).from(catalogRoutes);
  const [quizRows] = await db.select({ n: count() }).from(quizzes);
  const [audits] = await db.select({ n: count() }).from(auditLog);
  return { routes: routes?.n, quizzes: quizRows?.n, audits: audits?.n };
};

const auditActions = async (entityId: string) =>
  (await app.deps.db.select({ action: auditLog.action }).from(auditLog).where(eq(auditLog.entityId, entityId)).orderBy(auditLog.id)).map((r) => r.action);

test("only editors and admins reach the route and quiz editors; everyone else is turned away before anything is written", async () => {
  const probes: { method: Method; url: string; body?: object }[] = [
    { method: "GET", url: "/v1/admin/routes" },
    { method: "GET", url: "/v1/admin/routes/x" },
    { method: "POST", url: "/v1/admin/routes", body: routeBody("Yetkisiz Rota") },
    { method: "PATCH", url: "/v1/admin/routes/x", body: { name: "Yeni ad" } },
    { method: "PUT", url: "/v1/admin/routes/x/stops", body: { stops: [] } },
    { method: "POST", url: "/v1/admin/routes/x/publish" },
    { method: "POST", url: "/v1/admin/routes/x/unpublish" },
    { method: "GET", url: "/v1/admin/quizzes" },
    { method: "GET", url: "/v1/admin/quizzes/x" },
    { method: "POST", url: "/v1/admin/quizzes", body: quizBody("han-a") },
    { method: "PUT", url: "/v1/admin/quizzes/x", body: quizBody("han-a") },
  ];
  const turnedAway: [string, Record<string, string>, number][] = [
    ["guest", {}, 401],
    ["visitor", visitor, 403],
    ["moderator", moderator, 403],
  ];

  const untouched = await rowCounts();
  for (const [who, headers, status] of turnedAway) {
    for (const p of probes) {
      const res = await app.inject({ method: p.method, url: p.url, headers, ...(p.body ? { payload: p.body } : {}) });
      assert.equal(res.statusCode, status, `${who}: ${p.method} ${p.url}`);
    }
  }
  assert.deepEqual(await rowCounts(), untouched);

  for (const as of [editor, admin]) {
    assert.equal((await call("GET", "/v1/admin/routes", { as })).res.statusCode, 200);
    assert.equal((await call("GET", "/v1/admin/quizzes", { as })).res.statusCode, 200);
  }
});

test("a route is published only with two or more published stops, and a published route cannot fall below that", async () => {
  const route = await newRoute("Hanlar Yolu");
  assert.equal(route.id, "hanlar-yolu");
  assert.equal(route.status, "draft");

  const blocked = async (why: string) => {
    const { res, body } = await publish(route.id);
    assert.equal(res.statusCode, 422, why);
    assert.equal(body.error.code, "PUBLISH_BLOCKED", why);
    assert.ok((body.error.fieldErrors._ ?? []).length > 0, `${why}: issues are listed`);
    return body.error.fieldErrors._ ?? [];
  };

  await blocked("no stops");
  await setStops(route.id, [{ siteId: "han-a" }]);
  await blocked("one stop");
  await setStops(route.id, [{ siteId: "han-a" }, { siteId: "taslak-han" }]);
  const issues = await blocked("a draft stop site");
  assert.ok(
    issues.some((i) => i.includes("Taslak Han")),
    "the draft site is named",
  );
  assert.equal((await call<AdminRoute>("GET", `/v1/admin/routes/${route.id}`)).body.status, "draft");
  assert.equal((await publicGet(`/v1/routes/${route.id}`)).statusCode, 404, "a refused publish leaves the route private");

  await setStops(route.id, [{ siteId: "han-a" }, { siteId: "han-b" }]);
  const published = await publish(route.id);
  assert.equal(published.res.statusCode, 200);
  assert.equal(published.body.status, "published");
  const live = await publicGet(`/v1/routes/${route.id}`);
  assert.equal(live.statusCode, 200);
  assert.deepEqual(
    live.json<RouteDto>().stops.map((s) => s.site.id),
    ["han-a", "han-b"],
  );

  // A published route stays editable while it keeps satisfying the gate, and only then.
  assert.equal((await setStops(route.id, [{ siteId: "han-b" }, { siteId: "han-a" }])).res.statusCode, 200);
  for (const stops of [[{ siteId: "han-a" }, { siteId: "taslak-han" }], [{ siteId: "han-a" }], []]) {
    const refused = await setStops(route.id, stops);
    assert.equal(refused.res.statusCode, 422);
    assert.equal(refused.body.error.code, "PUBLISH_BLOCKED");
  }
  assert.deepEqual(
    (await call<AdminRoute>("GET", `/v1/admin/routes/${route.id}`)).body.stops.map((s) => s.site.id),
    ["han-b", "han-a"],
    "refused edits changed nothing",
  );

  const down = await call<AdminRoute>("POST", `/v1/admin/routes/${route.id}/unpublish`);
  assert.equal(down.body.status, "draft");
  assert.equal((await publicGet(`/v1/routes/${route.id}`)).statusCode, 404);
  assert.equal((await call<AdminRoute>("POST", `/v1/admin/routes/${route.id}/unpublish`)).res.statusCode, 200, "unpublishing a draft sets the state it already has");

  // Each applied write is audited once; refused and repeated ones leave no row.
  assert.deepEqual(await auditActions(route.id), [
    "route.create",
    "route.set-stops",
    "route.set-stops",
    "route.set-stops",
    "route.publish",
    "route.set-stops",
    "route.unpublish",
  ]);
});

test("stops must be unique, in the route's city, and carry only their own site's quiz and history image", async () => {
  const quizA = await newQuiz("han-a");
  const quizB = await newQuiz("han-b");
  const route = await newRoute("Doğrulama Rotası");

  const refuse = async (stops: object[], path: string) => {
    const { res, body } = await setStops(route.id, stops);
    assert.equal(res.statusCode, 400, path);
    assert.equal(body.error.code, "VALIDATION_FAILED");
    assert.deepEqual(Object.keys(body.error.fieldErrors), [path]);
  };
  const untouched = await rowCounts();
  await refuse([{ siteId: "han-a", quizId: quizB.id }], "stops.0.quizId");
  await refuse([{ siteId: "han-a", quizId: "yok" }], "stops.0.quizId");
  await refuse([{ siteId: "han-a", historyImageId: "gecmis-b" }], "stops.0.historyImageId");
  await refuse([{ siteId: "izmir-cami" }], "stops.0.siteId");
  await refuse([{ siteId: "yok" }], "stops.0.siteId");
  await refuse([{ siteId: "han-a" }, { siteId: "han-a" }], "stops.1.siteId");
  assert.deepEqual(await rowCounts(), untouched, "refused calls wrote no data and no audit");
  assert.deepEqual((await call<AdminRoute>("GET", `/v1/admin/routes/${route.id}`)).body.stops, []);

  const ok = await setStops(route.id, [
    { siteId: "han-b", quizId: quizB.id, historyImageId: "gecmis-b" },
    { siteId: "han-a", quizId: quizA.id },
    { siteId: "han-c" },
  ]);
  assert.equal(ok.res.statusCode, 200);
  assert.deepEqual(
    ok.body.stops.map((s) => [s.position, s.site.id, s.site.status, s.quizId, s.historyImageId]),
    [
      [0, "han-b", "published", quizB.id, "gecmis-b"],
      [1, "han-a", "published", quizA.id, null],
      [2, "han-c", "published", null, null],
    ],
  );

  // The list is replaced, not merged: nothing of the previous stops lingers.
  await setStops(route.id, [{ siteId: "taslak-han" }, { siteId: "han-c" }]);
  const stored = await app.deps.db.select({ siteId: routeStops.siteId }).from(routeStops).where(eq(routeStops.routeId, route.id)).orderBy(routeStops.position);
  assert.deepEqual(
    stored.map((s) => s.siteId),
    ["taslak-han", "han-c"],
  );
  assert.equal((await call<AdminRoute>("GET", `/v1/admin/routes/${route.id}`)).body.stops[0]?.site.status, "draft", "the editor sees a stop site's draft state");
});

test("a quiz has exactly three options and a valid answer, and its key never reaches a public route payload", async () => {
  const untouched = await rowCounts();
  const refuse = async (over: object, field: string) => {
    const { res, body } = await call<ErrorBody>("POST", "/v1/admin/quizzes", { body: quizBody("han-a", over) });
    assert.equal(res.statusCode, 400, field);
    assert.ok(body.error.fieldErrors[field], `${field}: ${JSON.stringify(body.error.fieldErrors)}`);
  };
  await refuse({ options: ["A", "B", "C", "D"] }, "options");
  await refuse({ options: ["A", "B"] }, "options");
  await refuse({ optionsEn: ["A", "B"] }, "optionsEn");
  await refuse({ correctIndex: 3 }, "correctIndex");
  await refuse({ explanation: "" }, "explanation");
  await refuse({ siteId: "yok" }, "siteId");
  await refuse({ sourceId: "yok" }, "sourceId");
  assert.deepEqual(await rowCounts(), untouched);

  const quiz = await newQuiz("han-a", { correctIndex: 2, hint: "Bir ipucu" });
  assert.equal(quiz.correctIndex, 2, "staff see the key");
  const [answer] = await app.deps.db.select({ correctIndex: quizAnswers.correctIndex }).from(quizAnswers).where(eq(quizAnswers.quizId, quiz.id));
  assert.equal(answer?.correctIndex, 2, "the key lives in quiz_answers");
  assert.equal((await call<AdminQuiz>("GET", `/v1/admin/quizzes/${quiz.id}`)).body.correctIndex, 2);
  const listed = (siteId: string) => call<{ items: AdminQuiz[] }>("GET", `/v1/admin/quizzes?siteId=${siteId}`);
  assert.ok((await listed("han-a")).body.items.some((q) => q.id === quiz.id));
  assert.ok(!(await listed("han-b")).body.items.some((q) => q.id === quiz.id));

  // The quiz is a stop of a published route: both public payloads carry it, neither its key.
  const route = await newRoute("Bulmacalı Rota");
  await setStops(route.id, [{ siteId: "han-a", quizId: quiz.id }, { siteId: "han-b" }]);
  assert.equal((await publish(route.id)).res.statusCode, 200);
  const detail = await publicGet(`/v1/routes/${route.id}`);
  const bundle = await publicGet(`/v1/routes/${route.id}/bundle`);
  assert.equal(detail.json<RouteDto>().stops[0]?.quizId, quiz.id);
  const served = bundle.json<RouteBundle>().quizzes;
  assert.deepEqual(
    served.map((q) => q.id),
    [quiz.id],
    "the bundle serves the quiz",
  );
  assert.deepEqual(Object.keys(served[0] ?? {}).sort(), ["hint", "id", "options", "optionsEn", "question", "questionEn", "siteId"], "only the playable fields");
  for (const res of [detail, bundle]) {
    assert.equal(res.statusCode, 200);
    assert.ok(!res.body.includes("correctIndex"), "no answer key");
    assert.ok(!res.body.includes("Gizli açıklama"), "no explanation before a correct answer");
  }

  // Replacing the quiz replaces its key too; its site is fixed.
  const put = (id: string, over: object) => call<AdminQuiz & ErrorBody>("PUT", `/v1/admin/quizzes/${id}`, { body: quizBody("han-a", over) });
  const replaced = await put(quiz.id, { question: "Yeni soru?", correctIndex: 0 });
  assert.equal(replaced.res.statusCode, 200);
  assert.deepEqual([replaced.body.question, replaced.body.correctIndex, replaced.body.hint], ["Yeni soru?", 0, null], "PUT sets the whole state: the omitted hint is cleared");
  const [stored] = await app.deps.db.select({ correctIndex: quizAnswers.correctIndex }).from(quizAnswers).where(eq(quizAnswers.quizId, quiz.id));
  assert.equal(stored?.correctIndex, 0);

  const moved = await put(quiz.id, { siteId: "han-b" });
  assert.equal(moved.res.statusCode, 400);
  assert.ok(moved.body.error.fieldErrors.siteId);
  assert.equal((await call<AdminQuiz>("GET", `/v1/admin/quizzes/${quiz.id}`)).body.siteId, "han-a");
  assert.equal((await put("yok", {})).res.statusCode, 404);
});

test("the admin list includes drafts, filters by status and pages in a stable order", async () => {
  const one = await newRoute("Liste Bir");
  const two = await newRoute("Liste İki");
  const three = await newRoute("Liste Üç");
  await setStops(two.id, [{ siteId: "han-a" }, { siteId: "han-b" }]);
  assert.equal((await publish(two.id)).res.statusCode, 200);

  const ids: string[] = [];
  let cursor: string | null = null;
  do {
    const page: { res: { statusCode: number }; body: { items: AdminRouteSummary[]; nextCursor: string | null } } = await call("GET", `/v1/admin/routes?limit=2${cursor ? `&cursor=${cursor}` : ""}`);
    assert.equal(page.res.statusCode, 200);
    assert.ok(page.body.items.length <= 2);
    ids.push(...page.body.items.map((r) => r.id));
    cursor = page.body.nextCursor;
  } while (cursor);
  assert.equal(new Set(ids).size, ids.length, "no route twice");
  assert.deepEqual(ids, [...ids].sort(), "id order");
  for (const r of [one, two, three]) assert.ok(ids.includes(r.id), `${r.id} is listed, draft or not`);

  const idsWith = async (status: string) => (await call<{ items: AdminRouteSummary[] }>("GET", `/v1/admin/routes?status=${status}&limit=100`)).body.items;
  const drafts = await idsWith("draft");
  const live = await idsWith("published");
  assert.deepEqual(
    [one, two, three].map((r) => [drafts.some((d) => d.id === r.id), live.some((p) => p.id === r.id)]),
    [
      [true, false],
      [false, true],
      [true, false],
    ],
  );
  assert.equal(live.find((r) => r.id === two.id)?.stopCount, 2);

  const publicIds = (await publicGet("/v1/routes")).json<{ items: RouteDto[] }>().items.map((r) => r.id);
  assert.ok(publicIds.includes(two.id));
  assert.ok(!publicIds.includes(one.id) && !publicIds.includes(three.id), "the public list never shows drafts");

  const bad = await call<ErrorBody>("GET", "/v1/admin/routes?cursor=not-a-cursor");
  assert.equal(bad.res.statusCode, 400);
  assert.equal(bad.body.error.code, "INVALID_CURSOR");
});

test("a replayed Idempotency-Key creates and audits nothing twice; same-named routes get distinct ids", async () => {
  const key = "create-route-1";
  const first = await call<AdminRoute>("POST", "/v1/admin/routes", { body: routeBody("Tekrar Rotası"), key });
  const again = await call<AdminRoute>("POST", "/v1/admin/routes", { body: routeBody("Tekrar Rotası"), key });
  assert.deepEqual([first.res.statusCode, again.res.statusCode], [201, 201]);
  assert.equal(again.body.id, first.body.id);
  const [routes] = await app.deps.db.select({ n: count() }).from(catalogRoutes).where(eq(catalogRoutes.name, "Tekrar Rotası"));
  assert.equal(routes?.n, 1);
  assert.deepEqual(await auditActions(first.body.id), ["route.create"]);

  const reused = await call<ErrorBody>("POST", "/v1/admin/routes", { body: routeBody("Başka Rota"), key });
  assert.equal(reused.res.statusCode, 422);
  assert.equal(reused.body.error.code, "IDEMPOTENCY_KEY_REUSED");

  const quizKey = "create-quiz-1";
  const q1 = await call<AdminQuiz>("POST", "/v1/admin/quizzes", { body: quizBody("han-a", { question: "Tekrar sorusu?" }), key: quizKey });
  const q2 = await call<AdminQuiz>("POST", "/v1/admin/quizzes", { body: quizBody("han-a", { question: "Tekrar sorusu?" }), key: quizKey });
  assert.equal(q2.body.id, q1.body.id);
  const [asked] = await app.deps.db.select({ n: count() }).from(quizzes).where(eq(quizzes.question, "Tekrar sorusu?"));
  assert.equal(asked?.n, 1);

  const same = [await newRoute("Aynı Ad"), await newRoute("Aynı Ad"), await newRoute("Aynı Ad")];
  assert.deepEqual(
    same.map((r) => r.id),
    ["ayni-ad", "ayni-ad-2", "ayni-ad-3"],
  );
});

test("a route's city must match its stops and a badge needs a title and a photo; a refused edit writes nothing", async () => {
  const route = await newRoute("Düzenleme Rotası", { nameEn: "Edit Route" });
  const url = `/v1/admin/routes/${route.id}`;
  const patch = (body: object) => call<AdminRoute & ErrorBody>("PATCH", url, { body });
  const refuse = async (body: object, field: string) => {
    const untouched = await rowCounts();
    const { res, body: out } = await patch(body);
    assert.equal(res.statusCode, 400, JSON.stringify(body));
    assert.ok(out.error.fieldErrors[field], `${field}: ${JSON.stringify(out.error.fieldErrors)}`);
    assert.deepEqual(await rowCounts(), untouched);
  };

  await refuse({}, "_");
  await refuse({ cityId: "yok" }, "cityId");

  const renamed = await patch({ name: "Yeni Ad", nameEn: null });
  assert.equal(renamed.res.statusCode, 200);
  assert.deepEqual(
    [renamed.body.name, renamed.body.nameEn, renamed.body.description, renamed.body.theme, renamed.body.cityId],
    ["Yeni Ad", null, "Açıklama", "Test", "bursa"],
    "only the sent fields change; null clears",
  );

  await setStops(route.id, [{ siteId: "han-a" }]);
  await refuse({ cityId: "izmir" }, "cityId");
  assert.equal((await call<AdminRoute>("GET", url)).body.cityId, "bursa");

  await refuse({ badgeMediaId: "foto-1" }, "badgeTitle");
  await refuse({ badgeTitle: "Rozet", badgeMediaId: "yok" }, "badgeMediaId");
  const badged = await patch({ badgeTitle: "Rozet", badgeMediaId: "foto-1" });
  assert.equal(badged.res.statusCode, 200);
  await refuse({ badgeTitle: null }, "badgeTitle");
  assert.equal((await patch({ badgeTitle: null, badgeMediaId: null })).res.statusCode, 200);

  // A route without stops can move; its city then decides which sites may become stops.
  const empty = await newRoute("Boş Rota");
  const moved = await call<AdminRoute>("PATCH", `/v1/admin/routes/${empty.id}`, { body: { cityId: "izmir" } });
  assert.equal(moved.body.cityId, "izmir");
  assert.equal((await setStops(empty.id, [{ siteId: "han-a" }])).res.statusCode, 400);
  assert.equal((await setStops(empty.id, [{ siteId: "izmir-cami" }])).res.statusCode, 200);

  for (const [method, path, body] of [
    ["GET", "/v1/admin/routes/yok", undefined],
    ["PATCH", "/v1/admin/routes/yok", { name: "x" }],
    ["PUT", "/v1/admin/routes/yok/stops", { stops: [] }],
    ["POST", "/v1/admin/routes/yok/publish", undefined],
    ["POST", "/v1/admin/routes/yok/unpublish", undefined],
  ] as const) {
    const missing = await call<ErrorBody>(method, path, body ? { body } : {});
    assert.equal(missing.res.statusCode, 404, `${method} ${path}`);
    assert.equal(missing.body.error.code, "NOT_FOUND");
  }
});
