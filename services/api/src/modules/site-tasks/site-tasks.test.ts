import type { HeritageSite } from "@akar/domain";
import { eq, sql } from "drizzle-orm";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import type { App } from "../../app.ts";
import { pointEvents, siteBadges, siteTaskAnswers, siteTasks, userSiteBadges, userSiteTasks } from "../../db/schema/index.ts";
import { loadCatalog } from "../../db/seed.ts";
import type { ErrorBody } from "../../errors.ts";
import type { AuthUser } from "../../platform/auth.ts";
import { authHeader } from "../../test/auth.ts";
import { startTestApp } from "../../test/harness.ts";
import type { SiteBadgeDto, SiteDetail } from "../catalog/schemas.ts";
import type { SiteProgressResponse } from "./schemas.ts";

type Method = "GET" | "POST";
type Who = { as?: AuthUser; key?: string };
type Answer = { correct: boolean; correctText: string | null; wrongText: string | null; earnedBadges: SiteBadgeDto[] };
type Done = { doneText: string; onSite: boolean; earnedBadges: SiteBadgeDto[] };

const HAN: [number, number] = [29.06, 40.18];
const FIFTY_FIVE_M: [number, number] = [29.06, 40.1805];
const ONE_ELEVEN_M: [number, number] = [29.06, 40.181];

const site = (id: string, status: "published" | "draft", stories: number): HeritageSite => ({
  id,
  name: id,
  city: "Bursa",
  district: "Hanlar Bölgesi",
  year: "1400",
  architect: "—",
  kind: "cami",
  coordinates: HAN,
  minutes: 2,
  description: "açıklama",
  status,
  stories: Array.from({ length: stories }, (_, i) => ({ id: `${id}-s${i + 1}`, title: "Başlık", text: "Metin", simple: "Metin", trust: "representative" as const })),
  source: "test",
  tier: "Tier 2",
});

let app: App;
let stop: (() => Promise<void>) | undefined;

// ulu-cami (published, one story block): tq-1 question (right option 1, two hints), tf-1 field task (80 m, from home
// "Tac_Kapi"), tf-2 field task (50 m, no way from home); badges b-story (story), b-quiz (tq-1), b-field (tf-1, «Yerinde»).
// taslak-cami (draft): tq-draft and tf-draft. bos-cami: published, no tasks.
before(async () => {
  ({ app, stop } = await startTestApp());
  const db = app.deps.db;
  await loadCatalog(db, { sites: [site("ulu-cami", "published", 1), site("taslak-cami", "draft", 1), site("bos-cami", "published", 1)], routes: [] });
  const quiz = { options: ["Çini", "Kündekâri", "Kalem işi"], hints: ["İlk ipucu", "İkinci ipucu"], correctText: "Kündekâri: parçalar birbirine geçer.", wrongText: "Tekrar dene.", fromHome: true };
  const field = (radiusM: number, fromHome: { text: string; part: string } | null) => ({ onSite: { text: "Kapının önüne gel", radiusM }, fromHome, doneText: "Üç kapıdan girilir." });
  const base = { prompt: "Soru?", mediaId: null, part: null, source: "E cilt-1 PDF s.27", trust: "verified" as const };
  await db.insert(siteTasks).values([
    { ...base, id: "tq-1", siteId: "ulu-cami", position: 0, kind: "quiz", title: "Minberin sırrı", part: "Minber", details: quiz },
    { ...base, id: "tf-1", siteId: "ulu-cami", position: 1, kind: "field", title: "Sahaflar Kapısı", details: field(80, { text: "Kapıya dokun", part: "Tac_Kapi" }) },
    { ...base, id: "tf-2", siteId: "ulu-cami", position: 2, kind: "field", title: "Çeşme", details: field(50, null) },
    { ...base, id: "tq-draft", siteId: "taslak-cami", position: 0, kind: "quiz", title: "Taslak soru", details: quiz },
    { ...base, id: "tf-draft", siteId: "taslak-cami", position: 1, kind: "field", title: "Taslak saha", details: field(80, null) },
  ]);
  await db.insert(siteTaskAnswers).values([{ taskId: "tq-1", correctIndex: 1 }, { taskId: "tq-draft", correctIndex: 1 }]);
  await db.insert(siteBadges).values([
    { id: "b-story", siteId: "ulu-cami", position: 0, title: "Ulucami'yi dinledin", text: "Hikâyeyi bitirdin.", condition: "story", taskId: null, onSiteLabel: false },
    { id: "b-quiz", siteId: "ulu-cami", position: 1, title: "Kündekâri", text: "Minberi öğrendin.", condition: "task", taskId: "tq-1", onSiteLabel: false },
    { id: "b-field", siteId: "ulu-cami", position: 2, title: "Sahaflar Kapısı", text: "Kapıyı buldun.", condition: "task", taskId: "tf-1", onSiteLabel: true },
  ]);
});
after(() => stop?.());

// Every request gets its own client address, so the 300/min rate limit never trips over the suite.
let clients = 0;
function send(method: Method, url: string, who: Who = {}, body?: unknown) {
  const n = ++clients;
  return app.inject({
    method,
    url,
    headers: {
      "x-forwarded-for": `10.${(n >> 16) & 255}.${(n >> 8) & 255}.${n & 255}`,
      ...(who.as ? authHeader(who.as) : {}),
      ...(who.key ? { "idempotency-key": who.key } : {}),
    },
    ...(body === undefined ? {} : { payload: body as Record<string, unknown> }),
  });
}

const user = (): AuthUser => ({ id: randomUUID(), role: "user" });
const answer = (id: string, choice: number, who?: Who) => send("POST", `/v1/site-tasks/${id}/answer`, who, { choice });
const complete = (id: string, body: unknown, who?: Who) => send("POST", `/v1/site-tasks/${id}/complete`, who, body);
const progress = async (u: AuthUser) => (await send("GET", "/v1/me/site-progress", { as: u })).json<SiteProgressResponse>();
const code = (res: { json: <T>() => T }) => res.json<ErrorBody>().error.code;

test("the site detail lists the tasks and badges in order, and nothing in it gives the answer away", async () => {
  const res = await send("GET", "/v1/sites/ulu-cami");
  assert.equal(res.statusCode, 200);
  const detail = res.json<SiteDetail>();
  assert.deepEqual(detail.tasks.map((t) => [t.id, t.kind]), [["tq-1", "quiz"], ["tf-1", "field"], ["tf-2", "field"]]);
  assert.deepEqual(detail.tasks[0], {
    id: "tq-1", kind: "quiz", title: "Minberin sırrı", prompt: "Soru?", photoId: null, part: "Minber", source: "E cilt-1 PDF s.27", trust: "verified",
    quiz: { options: ["Çini", "Kündekâri", "Kalem işi"], hints: ["İlk ipucu", "İkinci ipucu"], wrongText: "Tekrar dene.", fromHome: true },
  });
  assert.deepEqual(detail.tasks[1]!.field, { onSite: { text: "Kapının önüne gel", radiusM: 80 }, fromHome: { text: "Kapıya dokun", part: "Tac_Kapi" } });
  assert.equal(detail.tasks[2]!.field!.fromHome, null);
  assert.deepEqual(detail.badges.map((b) => [b.id, b.condition, b.taskId, b.onSiteLabel]), [
    ["b-story", "story", null, false], ["b-quiz", "task", "tq-1", false], ["b-field", "task", "tf-1", true],
  ]);
  assert.ok(!/correctText|doneText|correctIndex|Kündekâri: parçalar|Üç kapıdan/.test(res.body), "no answer key and no after-the-answer text");
  const list = (await send("GET", "/v1/site-details?limit=100")).json<{ items: SiteDetail[] }>();
  assert.deepEqual(list.items.find((s) => s.id === "ulu-cami")!.tasks, detail.tasks, "the list carries the same tasks");
  assert.deepEqual(list.items.find((s) => s.id === "bos-cami")!.tasks, []);
  assert.equal((await send("GET", "/v1/sites/taslak-cami")).statusCode, 404, "a draft site's tasks are not public");
});

test("a guest's answer is checked and nothing is stored or earned", async () => {
  const wrong = await answer("tq-1", 0);
  assert.equal(wrong.statusCode, 200);
  assert.deepEqual(wrong.json(), { correct: false, correctText: null, wrongText: "Tekrar dene.", earnedBadges: [] });
  const right = await answer("tq-1", 1);
  assert.deepEqual(right.json(), { correct: true, correctText: "Kündekâri: parçalar birbirine geçer.", wrongText: null, earnedBadges: [] });
  assert.ok(!/correctIndex/.test(right.body));
  assert.equal((await app.deps.db.select().from(userSiteTasks)).length, 0);
  assert.equal((await app.deps.db.select().from(userSiteBadges)).length, 0);
});

test("a signed-in user's right answer is stored once and earns the task badge once; a wrong one stores nothing; no points", async () => {
  const u = user();
  assert.deepEqual((await answer("tq-1", 2, { as: u })).json(), { correct: false, correctText: null, wrongText: "Tekrar dene.", earnedBadges: [] });
  assert.deepEqual(await progress(u), { tasks: [], badges: [] });

  const first = (await answer("tq-1", 1, { as: u })).json<Answer>();
  assert.equal(first.correct, true);
  assert.deepEqual(first.earnedBadges.map((b) => b.id), ["b-quiz"]);
  assert.deepEqual(first.earnedBadges[0], { id: "b-quiz", title: "Kündekâri", text: "Minberi öğrendin.", condition: "task", taskId: "tq-1", onSiteLabel: false });
  const again = (await answer("tq-1", 1, { as: u })).json<Answer>();
  assert.deepEqual([again.correct, again.earnedBadges], [true, []], "the badge is new only once");

  const p = await progress(u);
  assert.deepEqual(p.tasks.map((t) => [t.taskId, t.siteId, t.onSite]), [["tq-1", "ulu-cami", false]]);
  assert.deepEqual(p.badges.map((b) => [b.badgeId, b.siteId, b.onSite]), [["b-quiz", "ulu-cami", false]]);
  assert.equal((await app.deps.db.select().from(pointEvents).where(eq(pointEvents.userId, u.id))).length, 0, "tasks and badges never pay points");
});

test("an answer needs a quiz task of a published site and a choice among its options", async () => {
  const u = user();
  for (const id of ["yok", "tq-draft"]) {
    for (const who of [{ as: u }, {}]) {
      const res = await answer(id, 1, who);
      assert.equal(res.statusCode, 404, `${id}: ${res.body}`);
      assert.equal(code(res), "NOT_FOUND");
    }
  }
  const notQuiz = await answer("tf-1", 0, { as: u });
  assert.equal(notQuiz.statusCode, 400);
  assert.equal(code(notQuiz), "VALIDATION_FAILED");
  for (const choice of [3, 99]) {
    const res = await answer("tq-1", choice, { as: u });
    assert.equal(res.statusCode, 400, `choice ${choice}`);
    assert.deepEqual(Object.keys(res.json<ErrorBody>().error.fieldErrors), ["choice"]);
  }
  for (const choice of [-1, 1.5, "1"]) assert.equal((await answer("tq-1", choice as number, { as: u })).statusCode, 400, `choice ${String(choice)}`);
});

test("on site: a field task is done within its radius (accuracy forgiven up to 50 m), too far is 422 TOO_FAR, a poor fix is 422", async () => {
  const u = user();
  const far = await complete("tf-1", { mode: "onSite", lat: ONE_ELEVEN_M[1], lng: ONE_ELEVEN_M[0], accuracyM: 5 }, { as: u });
  assert.equal(far.statusCode, 422);
  assert.equal(code(far), "TOO_FAR");
  assert.deepEqual(await progress(u), { tasks: [], badges: [] }, "a refused try stores nothing");

  const poor = await complete("tf-1", { mode: "onSite", lat: HAN[1], lng: HAN[0], accuracyM: 500 }, { as: u });
  assert.equal(poor.statusCode, 422);
  assert.equal(code(poor), "LOCATION_ACCURACY_INSUFFICIENT");

  const near = await complete("tf-1", { mode: "onSite", lat: FIFTY_FIVE_M[1], lng: FIFTY_FIVE_M[0] }, { as: u });
  assert.equal(near.statusCode, 200, near.body);
  const done = near.json<Done>();
  assert.deepEqual([done.doneText, done.onSite], ["Üç kapıdan girilir.", true]);
  assert.deepEqual(done.earnedBadges.map((b) => [b.id, b.onSiteLabel]), [["b-field", true]]);
  const p = await progress(u);
  assert.deepEqual(p.tasks.map((t) => [t.taskId, t.onSite]), [["tf-1", true]]);
  assert.deepEqual(p.badges.map((b) => [b.badgeId, b.onSite]), [["b-field", true]]);

  // The 50 m task: 55 m away is out, unless the reported accuracy forgives it.
  assert.equal(code(await complete("tf-2", { mode: "onSite", lat: FIFTY_FIVE_M[1], lng: FIFTY_FIVE_M[0], accuracyM: 0 }, { as: u })), "TOO_FAR");
  assert.equal((await complete("tf-2", { mode: "onSite", lat: FIFTY_FIVE_M[1], lng: FIFTY_FIVE_M[0], accuracyM: 20 }, { as: u })).statusCode, 200);
});

test("from home: the named part completes the task, another part is 422 WRONG_PART, a task without a home way is 400, and the badge is not «Yerinde»", async () => {
  const u = user();
  const wrong = await complete("tf-1", { mode: "fromHome", part: "Minber" }, { as: u });
  assert.equal(wrong.statusCode, 422);
  assert.equal(code(wrong), "WRONG_PART");
  assert.deepEqual(await progress(u), { tasks: [], badges: [] });

  const none = await complete("tf-2", { mode: "fromHome", part: "Tac_Kapi" }, { as: u });
  assert.equal(none.statusCode, 400);
  assert.equal(code(none), "VALIDATION_FAILED");

  const right = await complete("tf-1", { mode: "fromHome", part: "Tac_Kapi" }, { as: u });
  assert.equal(right.statusCode, 200, right.body);
  const done = right.json<Done>();
  assert.deepEqual([done.doneText, done.onSite], ["Üç kapıdan girilir.", false]);
  assert.deepEqual(done.earnedBadges.map((b) => b.id), ["b-field"]);
  assert.deepEqual((await progress(u)).badges.map((b) => [b.badgeId, b.onSite]), [["b-field", false]]);

  // Going there later upgrades the same rows to on site; the badge is not new, so it is not announced again.
  const there = (await complete("tf-1", { mode: "onSite", lat: HAN[1], lng: HAN[0], accuracyM: 5 }, { as: u })).json<Done>();
  assert.deepEqual([there.onSite, there.earnedBadges], [true, []]);
  const p = await progress(u);
  assert.deepEqual([p.tasks.map((t) => t.onSite), p.badges.map((b) => b.onSite)], [[true], [true]]);
  // ...and doing it from home afterwards does not take it back.
  await complete("tf-1", { mode: "fromHome", part: "Tac_Kapi" }, { as: u });
  assert.deepEqual((await progress(u)).tasks.map((t) => t.onSite), [true]);
});

test("a guest finishes a field task the same way and gets nothing stored; bad requests are refused", async () => {
  const stored = async () => (await app.deps.db.select().from(userSiteTasks)).length + (await app.deps.db.select().from(userSiteBadges)).length;
  const rowsBefore = await stored();
  const near = await complete("tf-1", { mode: "onSite", lat: HAN[1], lng: HAN[0], accuracyM: 5 });
  assert.deepEqual(near.json(), { doneText: "Üç kapıdan girilir.", onSite: true, earnedBadges: [] });
  assert.deepEqual((await complete("tf-1", { mode: "fromHome", part: "Tac_Kapi" })).json(), { doneText: "Üç kapıdan girilir.", onSite: false, earnedBadges: [] });
  assert.equal(code(await complete("tf-1", { mode: "onSite", lat: ONE_ELEVEN_M[1], lng: ONE_ELEVEN_M[0] })), "TOO_FAR");
  assert.equal(code(await complete("tf-1", { mode: "fromHome", part: "Minber" })), "WRONG_PART");
  assert.equal(await stored(), rowsBefore, "a guest leaves no row");

  for (const id of ["yok", "tf-draft"]) assert.equal((await complete(id, { mode: "fromHome", part: "x" })).statusCode, 404, id);
  assert.equal((await complete("tq-1", { mode: "fromHome", part: "Minber" })).statusCode, 400, "a question is answered, not completed");
  for (const body of [{}, { mode: "walk" }, { mode: "onSite", lat: 40.18 }, { mode: "onSite", lat: 91, lng: 29 }, { mode: "onSite", lat: 40, lng: 29, accuracyM: -1 }, { mode: "fromHome" }]) {
    assert.equal((await complete("tf-1", body)).statusCode, 400, JSON.stringify(body));
  }
});

test("finishing the story earns the story badge once; a guest earns none; the response has earnedBadges", async () => {
  const u = user();
  const first = (await send("POST", "/v1/stories/ulu-cami/complete", { as: u })).json<{ awarded: number; earnedBadges: SiteBadgeDto[] }>();
  assert.equal(first.awarded, 15, "the story's own points are unchanged");
  assert.deepEqual(first.earnedBadges.map((b) => [b.id, b.condition, b.taskId]), [["b-story", "story", null]]);
  const again = (await send("POST", "/v1/stories/ulu-cami/complete", { as: u })).json<{ earnedBadges: unknown[] }>();
  assert.deepEqual(again.earnedBadges, []);
  assert.deepEqual((await progress(u)).badges.map((b) => b.badgeId), ["b-story"]);
  assert.deepEqual((await app.deps.db.select().from(pointEvents).where(eq(pointEvents.userId, u.id))).map((e) => e.action), ["story.complete"], "only the story's own points");

  const device = randomUUID();
  const guest = await app.inject({ method: "POST", url: "/v1/stories/ulu-cami/complete", headers: { "x-device-id": device, "x-forwarded-for": "10.200.0.1" } });
  assert.deepEqual(guest.json<{ earnedBadges: unknown[] }>().earnedBadges, []);
  // A site with a story but no badge answers with an empty list.
  assert.deepEqual((await send("POST", "/v1/stories/bos-cami/complete", { as: u })).json<{ earnedBadges: unknown[] }>().earnedBadges, []);
});

test("/v1/me/site-progress needs an account, lists newest first, and hides a site that is no longer published", async () => {
  assert.equal((await send("GET", "/v1/me/site-progress")).statusCode, 401);
  const u = user();
  await answer("tq-1", 1, { as: u });
  await complete("tf-1", { mode: "fromHome", part: "Tac_Kapi" }, { as: u });
  const p = await progress(u);
  assert.deepEqual(p.tasks.map((t) => t.taskId), ["tf-1", "tq-1"]);
  assert.deepEqual(p.badges.map((b) => b.badgeId).sort(), ["b-field", "b-quiz"]);
  assert.ok(p.tasks.every((t) => !Number.isNaN(Date.parse(t.completedAt))));
  await app.deps.db.execute(sql`update sites set status = 'draft' where id = 'ulu-cami'`);
  assert.deepEqual(await progress(u), { tasks: [], badges: [] });
  await app.deps.db.execute(sql`update sites set status = 'published' where id = 'ulu-cami'`);
  assert.equal((await progress(u)).tasks.length, 2, "it comes back with the site");
});

test("an Idempotency-Key replays the stored answer; a reused key with another request is 422", async () => {
  const u = user();
  const one = await answer("tq-1", 1, { as: u, key: "gorev-1" });
  const two = await answer("tq-1", 1, { as: u, key: "gorev-1" });
  assert.equal(one.body, two.body, "the retry returns the first answer, badges included");
  assert.equal(one.json<Answer>().earnedBadges.length, 1);
  const reused = await answer("tq-1", 0, { as: u, key: "gorev-1" });
  assert.equal(reused.statusCode, 422);
  assert.equal(code(reused), "IDEMPOTENCY_KEY_REUSED");
});

test("the location of a field task is never stored: no table holds a coordinate of the request", async () => {
  const u = user();
  const lat = 40.180123456, lng = 29.060123456;
  assert.equal((await complete("tf-1", { mode: "onSite", lat, lng, accuracyM: 5 }, { as: u })).statusCode, 200);
  const rows = await app.deps.db.execute<{ hits: string }>(sql`
    select count(*)::text as hits from user_site_tasks t where t::text like ${`%${lat}%`} or t::text like ${`%${lng}%`}`);
  assert.equal(rows.rows[0]!.hits, "0");
  assert.deepEqual(Object.keys((await app.deps.db.select().from(userSiteTasks).where(eq(userSiteTasks.userId, u.id)))[0]!).sort(), ["completedAt", "onSite", "taskId", "userId"]);
});
