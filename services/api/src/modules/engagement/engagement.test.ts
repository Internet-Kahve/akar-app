import type { HeritageRoute, HeritageSite } from "@akar/domain";
import { eq, sql } from "drizzle-orm";
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { buildApp, type App } from "../../app.ts";
import { catalogRoutes, media, pointEvents, quizAnswers, quizzes, sites as siteTable } from "../../db/schema/index.ts";
import { loadCatalog } from "../../db/seed.ts";
import type { ErrorBody } from "../../errors.ts";
import type { AuthUser } from "../../platform/auth.ts";
import { authHeader } from "../../test/auth.ts";
import { startTestApp, TEST_RECEIPT_SECRET } from "../../test/harness.ts";
import type { SiteSummary } from "../catalog/schemas.ts";
import { issueReceipt } from "./receipts.ts";
import { engagementRoutes } from "./routes.ts";
import type { PassportResponse, ProgressEntry, ReceiptsResponse } from "./schemas.ts";

type Page<T> = { items: T[]; nextCursor: string | null };
type QuizState = { hint: string | null; hintAvailable: boolean; revealed: boolean; solved: boolean };
type Method = "GET" | "POST" | "PUT" | "DELETE";
type Who = { as?: AuthUser; device?: string; key?: string };

const BADGE_URL = "https://cdn.akar.test/rozet-hanlar.png";
const DAY = 24 * 60 * 60 * 1000;

const blocks = (id: string, n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `${id}-s${i + 1}`,
    title: `Başlık ${i + 1}`,
    text: "Metin",
    simple: "Metin",
    trust: "representative" as const,
  }));

const site = (id: string, name: string, coordinates: [number, number], stories: number, over: Partial<HeritageSite> = {}): HeritageSite => ({
  id,
  name,
  city: "Bursa",
  district: "Hanlar Bölgesi",
  year: "1400",
  architect: "—",
  kind: "han",
  coordinates,
  minutes: 2,
  description: `${name} açıklaması`,
  status: "published",
  stories: blocks(id, stories),
  source: "test",
  tier: "Tier 2",
  ...over,
});

const route = (id: string, siteIds: string[]): HeritageRoute => ({
  id,
  name: `Rota ${id}`,
  description: "açıklama",
  siteIds,
  minutes: 30,
  distance: "1 km",
  theme: "test",
  status: "published",
});

const HAN_A: [number, number] = [29.06, 40.18];
const HAN_B: [number, number] = [29.07, 40.19];

// han-a: 3 story blocks · han-b: 2 · han-c: 1 · han-d: published without a story · han-e: 1 (flipped to draft by
// one test) · taslak-han: a draft. Routes: "hanlar" (badge) has a draft stop in the middle, "rozetsiz" has the same
// published stops but no badge, "bos-rota" has a badge but only a draft stop.
const sites: HeritageSite[] = [
  site("han-a", "Han A", HAN_A, 3),
  site("han-b", "Han B", HAN_B, 2),
  site("han-c", "Han C", [29.08, 40.2], 1),
  site("han-d", "Han D", [29.09, 40.21], 0),
  site("han-e", "Han E", [29.11, 40.23], 1),
  site("taslak-han", "Taslak Han", [29.1, 40.22], 1, { status: "draft" }),
];

const quiz = (id: string, siteId: string, hint: string | null) => ({
  id,
  siteId,
  question: `Soru ${id}`,
  options: ["Birinci", "İkinci", "Üçüncü"],
  hint,
  explanation: `Gizli açıklama ${id}`,
  trust: "verified" as const,
});

let app: App;
let stop: (() => Promise<void>) | undefined;

before(async () => {
  ({ app, stop } = await startTestApp({ register: [engagementRoutes] }));
  const db = app.deps.db;
  await loadCatalog(db, {
    sites,
    routes: [
      route("hanlar", ["han-a", "taslak-han", "han-b"]),
      route("rozetsiz", ["han-a", "han-b"]),
      route("bos-rota", ["taslak-han"]),
    ],
  });
  await db
    .insert(media)
    .values({ id: "rozet-hanlar", kind: "photo", mime: "image/png", url: BADGE_URL, alt: "Hanlar Yolcusu rozeti", license: "CC0", trust: "representative" });
  await db.update(catalogRoutes).set({ badgeTitle: "Hanlar Yolcusu", badgeMediaId: "rozet-hanlar" }).where(eq(catalogRoutes.id, "hanlar"));
  await db.update(catalogRoutes).set({ badgeTitle: "Boş Rota Rozeti" }).where(eq(catalogRoutes.id, "bos-rota"));

  // Correct options: quiz-han-a 1, quiz-han-b 2, quiz-han-c 0 (no hint), quiz-taslak 0 (draft site).
  await db
    .insert(quizzes)
    .values([quiz("quiz-han-a", "han-a", "İpucu A"), quiz("quiz-han-b", "han-b", "İpucu B"), quiz("quiz-han-c", "han-c", null), quiz("quiz-taslak", "taslak-han", "İpucu T")]);
  await db.insert(quizAnswers).values([
    { quizId: "quiz-han-a", correctIndex: 1 },
    { quizId: "quiz-han-b", correctIndex: 2 },
    { quizId: "quiz-han-c", correctIndex: 0 },
    { quizId: "quiz-taslak", correctIndex: 0 },
  ]);
});
after(() => stop?.());

// Every request gets its own client address, so the 300/min rate limit never trips over the suite.
let clients = 0;
function call(target: App, method: Method, url: string, who: Who = {}, body?: unknown) {
  const n = ++clients;
  return target.inject({
    method,
    url,
    headers: {
      "x-forwarded-for": `10.${(n >> 16) & 255}.${(n >> 8) & 255}.${n & 255}`,
      ...(who.as ? authHeader(who.as) : {}),
      ...(who.device ? { "x-device-id": who.device } : {}),
      ...(who.key ? { "idempotency-key": who.key } : {}),
    },
    ...(body === undefined ? {} : { payload: body as Record<string, unknown> }),
  });
}
const send = (method: Method, url: string, who?: Who, body?: unknown) => call(app, method, url, who, body);

const user = (): AuthUser => ({ id: randomUUID(), role: "user" });
const passport = async (u: AuthUser) => (await send("GET", "/v1/me/passport", { as: u })).json<PassportResponse>();
const submit = (who: Who, quizId: string, choice: number) => send("POST", `/v1/quizzes/${quizId}/submit`, who, { choice });
const verify = (who: Who, siteId: string, coordinates: [number, number], accuracyM = 5) =>
  send("POST", "/v1/visits/verify", who, { siteId, coordinates, accuracyM });

async function redeem(u: AuthUser, receipts: string[]): Promise<ReceiptsResponse> {
  const res = await send("POST", "/v1/me/receipts", { as: u }, { receipts });
  assert.equal(res.statusCode, 200, res.body);
  return res.json<ReceiptsResponse>();
}

async function guestStoryReceipt(device: string, siteId: string): Promise<string> {
  const res = await send("POST", `/v1/stories/${siteId}/complete`, { device });
  assert.equal(res.statusCode, 200, res.body);
  const { receipt } = res.json<{ receipt?: string }>();
  assert.ok(receipt, "a guest gets a receipt");
  return receipt;
}

const events = (userId: string) => app.deps.db.select().from(pointEvents).where(eq(pointEvents.userId, userId));

/** The contract's receipt format (CONTRACTS §7), built independently of the server code. */
function forge(secret: string, claims: object): string {
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `v1.${payload}.${createHmac("sha256", secret).update(`v1.${payload}`).digest("base64url")}`;
}

test("every player-state endpoint that needs an account answers a guest with 401", async () => {
  const device = randomUUID(); // a device id is not an identity for these
  const calls: [Method, string, unknown?][] = [
    ["PUT", "/v1/me/saved/han-a"],
    ["DELETE", "/v1/me/saved/han-a"],
    ["GET", "/v1/me/saved"],
    ["PUT", "/v1/me/progress/han-a", { lastBlock: 0 }],
    ["GET", "/v1/me/progress"],
    ["GET", "/v1/me/passport"],
    ["POST", "/v1/me/receipts", { receipts: [] }],
  ];
  for (const [method, url, body] of calls) {
    const res = await send(method, url, { device }, body);
    assert.equal(res.statusCode, 401, `${method} ${url}`);
    assert.equal(res.json<ErrorBody>().error.code, "UNAUTHENTICATED");
  }
});

test("guest-capable endpoints need x-device-id (a UUID) from guests and nothing from signed-in users", async () => {
  const calls: [Method, string, unknown?][] = [
    ["POST", "/v1/stories/han-a/complete"],
    ["GET", "/v1/quizzes/quiz-han-a"],
    ["POST", "/v1/quizzes/quiz-han-a/submit", { choice: 1 }],
    ["POST", "/v1/quizzes/quiz-han-a/reveal"],
    ["POST", "/v1/visits/verify", { siteId: "han-a", coordinates: HAN_A, accuracyM: 5 }],
  ];
  for (const [method, url, body] of calls) {
    for (const who of [{}, { device: "not-a-uuid" }]) {
      const res = await send(method, url, who, body);
      const { error } = res.json<ErrorBody>();
      assert.equal(res.statusCode, 400, `${method} ${url} ${JSON.stringify(who)}`);
      assert.equal(error.code, "VALIDATION_FAILED");
      assert.ok(error.fieldErrors["x-device-id"], "the field error names the header");
    }
    const asUser = await send(method, url, { as: user() }, body);
    assert.equal(asUser.statusCode, 200, `${method} ${url} as a signed-in user: ${asUser.body}`);
  }
});

test("saving is a state: PUT twice keeps it, DELETE removes it, and GET shows exactly that", async () => {
  const u = user();
  for (let i = 0; i < 2; i++) {
    const res = await send("PUT", "/v1/me/saved/han-a", { as: u });
    assert.deepEqual([res.statusCode, res.json()], [200, { siteId: "han-a", saved: true }]);
  }
  assert.equal((await send("PUT", "/v1/me/saved/han-b", { as: u })).statusCode, 200);

  const list = async (who: AuthUser) => (await send("GET", "/v1/me/saved", { as: who })).json<Page<SiteSummary>>().items.map((s) => s.id);
  assert.deepEqual(await list(u), ["han-b", "han-a"], "newest first, as summaries");
  assert.deepEqual(await list(user()), [], "saved lists are per user");

  for (let i = 0; i < 2; i++) {
    const res = await send("DELETE", "/v1/me/saved/han-a", { as: u });
    assert.deepEqual([res.statusCode, res.json()], [200, { siteId: "han-a", saved: false }]);
  }
  assert.deepEqual(await list(u), ["han-b"]);
  assert.deepEqual((await passport(u)).saved, ["han-b"]);

  for (const id of ["taslak-han", "yok"]) {
    const res = await send("PUT", `/v1/me/saved/${id}`, { as: u });
    assert.equal(res.statusCode, 404, "a draft can neither be saved nor told apart from an unknown site");
    assert.equal(res.json<ErrorBody>().error.code, "NOT_FOUND");
  }
});

test("saved sites page by keyset without repeats or gaps, and a site unpublished since is gone from the list", async () => {
  const u = user();
  for (const id of ["han-a", "han-b", "han-c", "han-e"]) assert.equal((await send("PUT", `/v1/me/saved/${id}`, { as: u })).statusCode, 200);

  await app.deps.db.update(siteTable).set({ status: "draft" }).where(eq(siteTable.id, "han-e"));
  try {
    const first = (await send("GET", "/v1/me/saved?limit=2", { as: u })).json<Page<SiteSummary>>();
    assert.deepEqual(first.items.map((s) => s.id), ["han-c", "han-b"]);
    assert.ok(first.nextCursor);
    const second = (await send("GET", `/v1/me/saved?limit=2&cursor=${first.nextCursor}`, { as: u })).json<Page<SiteSummary>>();
    assert.deepEqual(second.items.map((s) => s.id), ["han-a"]);
    assert.equal(second.nextCursor, null);
    assert.deepEqual((await passport(u)).saved, ["han-c", "han-b", "han-a"]);
  } finally {
    await app.deps.db.update(siteTable).set({ status: "published" }).where(eq(siteTable.id, "han-e"));
  }

  // A forged cursor is a client error, never a database error.
  const forged = Buffer.from(JSON.stringify({ t: "1'; select 1", i: "han-a" })).toString("base64url");
  for (const cursor of ["bozuk", forged]) {
    const res = await send("GET", `/v1/me/saved?cursor=${cursor}`, { as: u });
    assert.equal(res.statusCode, 400);
    assert.equal(res.json<ErrorBody>().error.code, "INVALID_CURSOR");
  }
});

test("progress keeps the furthest block and rejects blocks past the story and stories that do not exist", async () => {
  const u = user();
  const put = (siteId: string, lastBlock: number) => send("PUT", `/v1/me/progress/${siteId}`, { as: u }, { lastBlock });

  const first = (await put("han-a", 1)).json<ProgressEntry>();
  assert.deepEqual(first, { siteId: "han-a", lastBlock: 1, total: 3, completed: false, updatedAt: first.updatedAt });
  assert.equal((await put("han-a", 0)).json<ProgressEntry>().lastBlock, 1, "going back changes nothing");
  assert.equal((await put("han-a", 2)).json<ProgressEntry>().lastBlock, 2);

  const past = await put("han-a", 3);
  assert.equal(past.statusCode, 400);
  assert.ok(past.json<ErrorBody>().error.fieldErrors["lastBlock"]);
  assert.equal((await put("han-a", -1)).statusCode, 400);
  for (const id of ["han-d", "taslak-han", "yok"]) {
    assert.equal((await put(id, 0)).statusCode, 404, `${id}: no published story`);
  }

  const list = (await send("GET", "/v1/me/progress", { as: u })).json<Page<ProgressEntry & { site: SiteSummary }>>();
  assert.equal(list.items.length, 1);
  assert.deepEqual(
    [list.items[0]?.siteId, list.items[0]?.lastBlock, list.items[0]?.total, list.items[0]?.completed, list.items[0]?.site.id],
    ["han-a", 2, 3, false, "han-a"],
  );

  const done = await send("POST", "/v1/stories/han-a/complete", { as: u });
  assert.equal(done.statusCode, 200);
  assert.equal((await put("han-a", 0)).json<ProgressEntry>().completed, true, "completion is not undone by reading on");
  assert.deepEqual((await passport(u)).progress.map((p) => [p.siteId, p.lastBlock, p.completed]), [["han-a", 2, true]]);
});

test("a story pays once for a user and gives a guest a receipt; it needs a published story", async () => {
  const u = user();
  const first = await send("POST", "/v1/stories/han-a/complete", { as: u });
  assert.deepEqual(first.json(), { awarded: 15 });
  assert.deepEqual((await send("POST", "/v1/stories/han-a/complete", { as: u })).json(), { awarded: 0 });
  const p = await passport(u);
  assert.deepEqual([p.points, p.read], [15, ["han-a"]]);

  const device = randomUUID();
  for (const id of ["taslak-han", "han-d", "yok"]) {
    assert.equal((await send("POST", `/v1/stories/${id}/complete`, { as: u })).statusCode, 404, `${id} as a user`);
    assert.equal((await send("POST", `/v1/stories/${id}/complete`, { device })).statusCode, 404, `${id} as a guest`);
  }

  const guest = await send("POST", "/v1/stories/han-b/complete", { device });
  const body = guest.json<{ awarded: number; receipt?: string }>();
  assert.equal(body.awarded, 0);
  assert.ok(body.receipt);
  const guestRows = await app.deps.db.select().from(pointEvents).where(sql`${pointEvents.userId} like 'guest:%'`);
  assert.deepEqual(guestRows, [], "guests never get ledger rows, only receipts");
});

test("an Idempotency-Key replays the first answer without redoing the work, and a reused key with another request is 422", async () => {
  const device = randomUUID();
  const first = await submit({ device, key: "bulmaca-1" }, "quiz-han-a", 1);
  assert.ok(first.json<{ receipt?: string }>().receipt);
  const replay = await submit({ device, key: "bulmaca-1" }, "quiz-han-a", 1);
  assert.equal(replay.body, first.body, "same key, same request: the stored response, same receipt");
  assert.equal((await submit({ device }, "quiz-han-a", 1)).json<{ receipt?: string }>().receipt, undefined, "without the key the quiz is already solved");

  const reused = await submit({ device, key: "bulmaca-1" }, "quiz-han-a", 0);
  assert.equal(reused.statusCode, 422);
  assert.equal(reused.json<ErrorBody>().error.code, "IDEMPOTENCY_KEY_REUSED");

  const u = user();
  const one = await send("POST", "/v1/stories/han-b/complete", { as: u, key: "hikaye-1" });
  const two = await send("POST", "/v1/stories/han-b/complete", { as: u, key: "hikaye-1" });
  assert.deepEqual([one.json(), two.json()], [{ awarded: 15 }, { awarded: 15 }], "the retry returns the first answer");
  assert.equal((await events(u.id)).length, 1, "and awards nothing more");
});

test("a wrong answer unlocks the hint; no response ever carries the answer key", async () => {
  const u = user();
  const raw: string[] = [];
  const state = async (): Promise<QuizState> => {
    const res = await send("GET", "/v1/quizzes/quiz-han-a", { as: u });
    raw.push(res.body);
    return res.json<QuizState>();
  };

  const fresh = await state();
  assert.deepEqual([fresh.hint, fresh.hintAvailable, fresh.revealed, fresh.solved], [null, false, false, true && false]);

  const wrong = await submit({ as: u }, "quiz-han-a", 0);
  raw.push(wrong.body);
  assert.deepEqual(wrong.json(), { correct: false, awarded: 0, hint: "İpucu A" });
  const unlocked = await state();
  assert.deepEqual([unlocked.hint, unlocked.hintAvailable], ["İpucu A", true]);

  // A quiz without a hint has nothing to unlock, wrong answers or not.
  const bare = await submit({ as: u }, "quiz-han-c", 1);
  raw.push(bare.body);
  assert.deepEqual(bare.json(), { correct: false, awarded: 0 });
  const bareState = (await send("GET", "/v1/quizzes/quiz-han-c", { as: u })).json<QuizState>();
  assert.deepEqual([bareState.hint, bareState.hintAvailable], [null, false]);

  for (const body of raw) {
    assert.doesNotMatch(body, /answer|index|correctOption/i, "no answer key in the payload");
    assert.doesNotMatch(body, /Gizli açıklama/, "the explanation waits for a correct answer");
  }

  const right = await submit({ as: u }, "quiz-han-a", 1);
  assert.doesNotMatch(right.body, /answer|index|correctOption/i);
  assert.deepEqual(right.json(), {
    correct: true,
    awarded: 20,
    explanation: { text: "Gizli açıklama quiz-han-a", sourceId: null, trust: "verified" },
  });

  assert.equal((await submit({ as: u }, "quiz-han-a", 3)).statusCode, 400, "only three options exist");
});

test("a correct answer pays once: points for a user, one receipt for a guest device, and state is per player", async () => {
  const u = user();
  assert.equal((await submit({ as: u }, "quiz-han-a", 1)).json<{ awarded: number }>().awarded, 20);
  assert.equal((await submit({ as: u }, "quiz-han-a", 1)).json<{ awarded: number }>().awarded, 0);
  const p = await passport(u);
  assert.deepEqual([p.points, p.quizzesSolved], [20, ["quiz-han-a"]]);

  const device = randomUUID();
  const wrong = await submit({ device }, "quiz-han-a", 2);
  assert.equal(wrong.json<{ hint?: string }>().hint, "İpucu A");
  const solved = await submit({ device }, "quiz-han-a", 1);
  const { receipt, awarded } = solved.json<{ receipt?: string; awarded: number }>();
  assert.ok(receipt);
  assert.equal(awarded, 0, "a guest earns no points, only a receipt");
  assert.equal((await submit({ device }, "quiz-han-a", 1)).json<{ receipt?: string }>().receipt, undefined, "solved already: no second receipt");
  const mine = (await send("GET", "/v1/quizzes/quiz-han-a", { device })).json<QuizState>();
  assert.deepEqual([mine.hintAvailable, mine.solved], [true, true]);

  const other = (await send("GET", "/v1/quizzes/quiz-han-a", { device: randomUUID() })).json<QuizState>();
  assert.deepEqual([other.hint, other.hintAvailable, other.solved], [null, false, false], "another device starts fresh");

  const v = user();
  assert.deepEqual((await redeem(v, [receipt])).results, [{ ok: true, action: "quiz.correct", subjectId: "quiz-han-a", awarded: 20 }]);
});

test("revealing the answer forfeits the points, for users and guests alike", async () => {
  const u = user();
  const reveal = await send("POST", "/v1/quizzes/quiz-han-b/reveal", { as: u });
  assert.deepEqual(reveal.json(), { correctOption: "Üçüncü" });
  assert.deepEqual((await send("POST", "/v1/quizzes/quiz-han-b/reveal", { as: u })).json(), { correctOption: "Üçüncü" }, "revealing again is the same state");
  const state = (await send("GET", "/v1/quizzes/quiz-han-b", { as: u })).json<QuizState>();
  assert.deepEqual([state.revealed, state.solved], [true, false]);

  const right = await submit({ as: u }, "quiz-han-b", 2);
  assert.equal(right.json<{ correct: boolean }>().correct, true);
  assert.equal(right.json<{ awarded: number }>().awarded, 0, "the right choice after the reveal earns nothing");
  const after = await passport(u);
  assert.deepEqual([after.points, after.quizzesSolved], [0, []]);
  assert.deepEqual((await events(u.id)).filter((e) => e.action === "quiz.correct"), []);

  const device = randomUUID();
  await send("POST", "/v1/quizzes/quiz-han-b/reveal", { device });
  const guest = (await submit({ device }, "quiz-han-b", 2)).json<{ correct: boolean; receipt?: string }>();
  assert.deepEqual([guest.correct, guest.receipt], [true, undefined]);
});

test("a guest receipt cannot bring back points for a quiz the redeemer revealed; the receipt stays unused", async () => {
  const u = user();
  await send("POST", "/v1/quizzes/quiz-han-b/reveal", { as: u });
  const receipt = (await submit({ device: randomUUID() }, "quiz-han-b", 2)).json<{ receipt?: string }>().receipt;
  assert.ok(receipt, "the guest device never revealed, so it gets a receipt");

  const res = await redeem(u, [receipt]);
  assert.deepEqual(res.results, [{ ok: false, reason: "revealed" }]);
  assert.deepEqual([res.awarded, res.points], [0, 0]);
  assert.deepEqual((await events(u.id)).filter((e) => e.action === "quiz.correct"), []);
  assert.deepEqual((await passport(u)).quizzesSolved, []);

  const other = user();
  assert.deepEqual((await redeem(other, [receipt])).results, [{ ok: true, action: "quiz.correct", subjectId: "quiz-han-b", awarded: 20 }]);
});

test("a quiz of an unpublished site or an unknown id is 404 for every quiz endpoint", async () => {
  const u = user();
  for (const id of ["quiz-taslak", "yok"]) {
    const responses = [
      await send("GET", `/v1/quizzes/${id}`, { as: u }),
      await submit({ as: u }, id, 0),
      await send("POST", `/v1/quizzes/${id}/reveal`, { as: u }),
    ];
    for (const res of responses) {
      assert.equal(res.statusCode, 404, `${id}: ${res.body}`);
      assert.equal(res.json<ErrorBody>().error.code, "NOT_FOUND");
    }
  }
});

test("a visit counts only near the site: far is refused, near pays once, a poor fix is 422", async () => {
  const u = user();
  const far = await verify({ as: u }, "han-a", HAN_B);
  assert.deepEqual(far.json(), { verified: false, distanceBand: "far", awarded: 0 });
  assert.equal((await passport(u)).points, 0);

  const near = await verify({ as: u }, "han-a", [29.060012345, 40.180012345]);
  assert.deepEqual(near.json(), { verified: true, distanceBand: "near", awarded: 100 });
  assert.deepEqual((await verify({ as: u }, "han-a", HAN_A)).json(), { verified: true, distanceBand: "near", awarded: 0 });
  const p = await passport(u);
  assert.deepEqual([p.points, p.visited], [100, ["han-a"]]);

  const blurry = await verify({ as: u }, "han-b", HAN_B, 100.5);
  assert.equal(blurry.statusCode, 422);
  const { error } = blurry.json<ErrorBody>();
  assert.equal(error.message, "Konum hassasiyeti yetersiz.");
  assert.ok(error.fieldErrors["accuracyM"]);
  assert.equal((await verify({ as: u }, "han-b", HAN_B, 100)).json<{ verified: boolean }>().verified, true, "100 m is still acceptable");

  for (const id of ["taslak-han", "yok"]) {
    assert.equal((await verify({ as: u }, id, HAN_A)).statusCode, 404, `${id}: not a published site`);
  }
});

test("the accuracy radius is forgiven up to 50 m and no further", async () => {
  const u = user();
  // 0.0005° of latitude is about 55 m, 0.001° about 111 m; the check radius is 30 m.
  const fiftyFive: [number, number] = [HAN_A[0], 40.1805];
  const hundredEleven: [number, number] = [HAN_A[0], 40.181];
  assert.equal((await verify({ as: u }, "han-a", fiftyFive, 5)).json<{ verified: boolean }>().verified, false);
  assert.equal((await verify({ as: u }, "han-a", fiftyFive, 40)).json<{ verified: boolean }>().verified, true, "55 m - 40 m of doubt is inside 30 m");
  assert.equal(
    (await verify({ as: user() }, "han-a", hundredEleven, 100)).json<{ verified: boolean }>().verified,
    false,
    "the allowance is capped at 50 m: 111 m - 50 m is still outside 30 m",
  );
});

test("visit coordinates are neither stored anywhere nor echoed", async () => {
  const mark = "123456"; // appears in no seed coordinate; the fix below is about 17 m from han-a
  const coordinates: [number, number] = [29.060123456, 40.180123456];
  const u = user();
  const device = randomUUID();

  const responses = [
    await verify({ as: u, key: "ziyaret-1" }, "han-a", coordinates),
    await verify({ device, key: "ziyaret-2" }, "han-a", coordinates),
  ];
  for (const res of responses) {
    assert.equal(res.statusCode, 200, res.body);
    assert.equal(res.json<{ verified: boolean }>().verified, true);
    assert.doesNotMatch(res.body, new RegExp(mark));
    assert.deepEqual(Object.keys(res.json()).sort().filter((k) => k !== "receipt"), ["awarded", "distanceBand", "verified"], "no distance, no position");
  }
  assert.equal((await events(u.id)).length, 1, "the visit itself was recorded");

  const tables = await app.deps.db.execute<{ table_name: string }>(
    sql`select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' and table_name <> 'spatial_ref_sys'`,
  );
  assert.ok(tables.rows.length > 10);
  for (const { table_name } of tables.rows) {
    const dump = await app.deps.db.execute<{ dump: string }>(
      sql`select coalesce(string_agg(to_jsonb(t)::text, E'\n'), '') as dump from ${sql.identifier(table_name)} t`,
    );
    assert.doesNotMatch(dump.rows[0]?.dump ?? "", new RegExp(mark), `${table_name} must not hold the visit coordinates`);
  }
});

test("a route badge needs every published stop finished, by story or by visit; drafts and unbadged routes never count", async () => {
  const u = user();
  const badgeIds = async () => (await passport(u)).badges.map((b) => b.routeId);

  await send("POST", "/v1/stories/han-a/complete", { as: u });
  assert.deepEqual(await badgeIds(), [], "han-b is still to do (the draft stop in between is not a stop to visit)");

  const done = await verify({ as: u }, "han-b", HAN_B);
  assert.equal(done.json<{ verified: boolean }>().verified, true);
  const { badges } = await passport(u);
  assert.deepEqual(
    badges.map((b) => [b.routeId, b.title, b.mediaId, b.url]),
    [["hanlar", "Hanlar Yolcusu", "rozet-hanlar", BADGE_URL]],
    "'rozetsiz' (no badge) and 'bos-rota' (no published stop) stay empty",
  );

  await send("POST", "/v1/stories/han-b/complete", { as: u });
  assert.equal((await badgeIds()).length, 1, "more progress does not award it twice");

  const half = user();
  await send("POST", "/v1/stories/han-b/complete", { as: half });
  assert.deepEqual(await badgeIds.call(null).then(() => passport(half).then((p) => p.badges)), [], "another user's progress counts for nothing");
});

test("a valid receipt awards exactly once, whoever replays it, and shows up in the account's own state", async () => {
  const device = randomUUID();
  const story = await guestStoryReceipt(device, "han-a");
  const answer = (await submit({ device }, "quiz-han-a", 1)).json<{ receipt?: string }>().receipt;
  const visit = (await verify({ device }, "han-a", HAN_A)).json<{ receipt?: string }>().receipt;
  assert.ok(answer && visit);

  const u = user();
  const first = await redeem(u, [story, answer, visit]);
  assert.deepEqual(first.results, [
    { ok: true, action: "story.complete", subjectId: "han-a", awarded: 15 },
    { ok: true, action: "quiz.correct", subjectId: "quiz-han-a", awarded: 20 },
    { ok: true, action: "visit.verified", subjectId: "han-a", awarded: 100 },
  ]);
  assert.deepEqual([first.awarded, first.points], [135, 135]);

  const replay = await redeem(u, [story, answer, visit]);
  assert.deepEqual(replay.results, Array.from({ length: 3 }, () => ({ ok: false, reason: "already_redeemed" })));
  assert.deepEqual([replay.awarded, replay.points], [0, 135]);

  const thief = user();
  assert.deepEqual((await redeem(thief, [story])).results, [{ ok: false, reason: "already_redeemed" }]);
  assert.equal((await passport(thief)).points, 0);

  // A second receipt for something the account already has is genuine but worth nothing.
  const again = await guestStoryReceipt(randomUUID(), "han-a");
  assert.deepEqual((await redeem(u, [again])).results, [{ ok: true, action: "story.complete", subjectId: "han-a", awarded: 0 }]);

  // The same receipt twice in one request pays once.
  const twice = await guestStoryReceipt(randomUUID(), "han-b");
  const batch = await redeem(thief, [twice, twice]);
  assert.deepEqual(batch.results, [{ ok: true, action: "story.complete", subjectId: "han-b", awarded: 15 }, { ok: false, reason: "already_redeemed" }]);
  assert.equal(batch.points, 15);

  const p = await passport(u);
  assert.deepEqual([p.points, p.read, p.visited, p.quizzesSolved], [135, ["han-a"], ["han-a"], ["quiz-han-a"]]);
  assert.equal((await send("GET", "/v1/quizzes/quiz-han-a", { as: u })).json<QuizState>().solved, true);
  assert.deepEqual((await passport(u)).progress.map((e) => [e.siteId, e.completed]), [["han-a", true]]);
});

test("forged, tampered, expired and unknown receipts earn nothing and do not spoil the rest of the batch", async () => {
  const device = randomUUID();
  const valid = await guestStoryReceipt(device, "han-b");
  const [, payload = "", signature = ""] = valid.split(".");
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;
  const now = Math.floor(Date.now() / 1000);
  const sign = (secret: string, act: string, sub: string, at = now) =>
    forge(secret, { jti: randomUUID(), act, sub, dev: device, iat: at, exp: at + 3600 });

  const upgraded = Buffer.from(JSON.stringify({ ...claims, act: "visit.verified" })).toString("base64url");
  const cases: [string, string, string][] = [
    ["signed with another key", forge("an-entirely-different-secret-0123456789", { ...claims, jti: randomUUID() }), "bad_signature"],
    ["payload upgraded to a bigger action", `v1.${upgraded}.${signature}`, "bad_signature"],
    ["signature altered", valid.slice(0, -1) + (valid.endsWith("A") ? "B" : "A"), "bad_signature"],
    ["expired", issueReceipt(TEST_RECEIPT_SECRET, { action: "story.complete", subjectId: "han-a", deviceId: device }, new Date(Date.now() - 31 * DAY)), "expired"],
    ["another version", valid.replace(/^v1\./, "v2."), "unsupported_version"],
    ["not a receipt", "merhaba", "malformed"],
    ["empty", "", "malformed"],
    ["a signed action the server never issues", sign(TEST_RECEIPT_SECRET, "memory.approved", "han-a"), "unknown_action"],
    ["a draft site", sign(TEST_RECEIPT_SECRET, "story.complete", "taslak-han"), "subject_not_found"],
    ["a site without a story", sign(TEST_RECEIPT_SECRET, "story.complete", "han-d"), "subject_not_found"],
    ["an unknown quiz", sign(TEST_RECEIPT_SECRET, "quiz.correct", "yok"), "subject_not_found"],
    ["a quiz of a draft site", sign(TEST_RECEIPT_SECRET, "quiz.correct", "quiz-taslak"), "subject_not_found"],
  ];

  const u = user();
  const res = await redeem(u, [...cases.map(([, receipt]) => receipt), valid]);
  assert.deepEqual(
    res.results.slice(0, cases.length),
    cases.map(([, , reason]) => ({ ok: false, reason })),
  );
  assert.deepEqual(res.results.at(-1), { ok: true, action: "story.complete", subjectId: "han-b", awarded: 15 });
  assert.deepEqual([res.awarded, res.points], [15, 15]);
  assert.deepEqual((await events(u.id)).map((e) => [e.action, e.subjectId]), [["story.complete", "han-b"]], "only the valid receipt reached the ledger");

  const tooMany = await send("POST", "/v1/me/receipts", { as: u }, { receipts: Array.from({ length: 101 }, () => valid) });
  assert.equal(tooMany.statusCode, 400);
});

test("a guest receipt follows the contract format: v1.<base64url claims>.<HMAC-SHA256>, valid for 30 days", async () => {
  const device = randomUUID();
  const receipt = await guestStoryReceipt(device, "han-a");
  const [version, payload = "", signature] = receipt.split(".");
  assert.equal(version, "v1");
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, string | number>;
  assert.deepEqual(Object.keys(claims), ["jti", "act", "sub", "dev", "iat", "exp"]);
  assert.match(String(claims["jti"]), /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  assert.deepEqual([claims["act"], claims["sub"], claims["dev"]], ["story.complete", "han-a", device]);
  assert.equal(Number(claims["exp"]) - Number(claims["iat"]), 30 * 24 * 60 * 60);
  assert.equal(signature, createHmac("sha256", TEST_RECEIPT_SECRET).update(`v1.${payload}`).digest("base64url"));
});

test("without RECEIPT_SECRET a guest gets 503 instead of an unsigned receipt, and signed-in players are unaffected", async () => {
  const bare = await buildApp({ ...app.deps, config: { ...app.deps.config, RECEIPT_SECRET: undefined } }, { docs: false, register: [engagementRoutes] });
  try {
    const device = randomUUID();
    const story = await call(bare, "POST", "/v1/stories/han-a/complete", { device });
    assert.equal(story.statusCode, 503);
    assert.equal(story.json<ErrorBody>().error.code, "SERVICE_UNAVAILABLE");

    const answer = await call(bare, "POST", "/v1/quizzes/quiz-han-a/submit", { device }, { choice: 1 });
    assert.equal(answer.statusCode, 503);
    const state = (await send("GET", "/v1/quizzes/quiz-han-a", { device })).json<QuizState>();
    assert.equal(state.solved, false, "the refused answer was not recorded as solved");

    const u = user();
    assert.equal((await call(bare, "POST", "/v1/stories/han-a/complete", { as: u })).json<{ awarded: number }>().awarded, 15);
    const redeemed = await call(bare, "POST", "/v1/me/receipts", { as: u }, { receipts: [] });
    assert.equal(redeemed.statusCode, 503);
  } finally {
    await bare.close();
  }
});

test("a route badge also comes from redeemed receipts", async () => {
  const device = randomUUID();
  const receipts = [await guestStoryReceipt(device, "han-a"), (await verify({ device }, "han-b", HAN_B)).json<{ receipt: string }>().receipt];
  const u = user();
  assert.deepEqual((await redeem(u, receipts.slice(0, 1))).results.map((r) => r.ok), [true]);
  assert.deepEqual((await passport(u)).badges, []);
  await redeem(u, receipts.slice(1));
  assert.deepEqual((await passport(u)).badges.map((b) => b.routeId), ["hanlar"]);
});

test("the passport adds up from the ledger and lists only published content, while the points stay", async () => {
  const u = user();
  await send("PUT", "/v1/me/saved/han-a", { as: u });
  await send("PUT", "/v1/me/progress/han-a", { as: u }, { lastBlock: 1 });
  await send("POST", "/v1/stories/han-e/complete", { as: u });
  await verify({ as: u }, "han-c", [29.08, 40.2]);
  await submit({ as: u }, "quiz-han-c", 0);

  const full = await passport(u);
  assert.deepEqual(
    [full.points, full.saved, full.read, full.visited, full.quizzesSolved, full.badges],
    [135, ["han-a"], ["han-e"], ["han-c"], ["quiz-han-c"], []],
  );
  assert.deepEqual(
    full.progress.map((p) => [p.siteId, p.lastBlock, p.total, p.completed]),
    [["han-e", 0, 1, true], ["han-a", 1, 3, false]],
    "most recently read first",
  );
  assert.equal(full.points, 15 * full.read.length + 100 * full.visited.length + 20 * full.quizzesSolved.length);

  await app.deps.db.update(siteTable).set({ status: "draft" }).where(eq(siteTable.id, "han-e"));
  try {
    const hidden = await passport(u);
    assert.deepEqual([hidden.read, hidden.points], [[], 135], "the draft is no longer listed, the earned points are untouched");
    assert.deepEqual(hidden.progress.map((p) => p.siteId), ["han-a"]);
  } finally {
    await app.deps.db.update(siteTable).set({ status: "published" }).where(eq(siteTable.id, "han-e"));
  }
});
