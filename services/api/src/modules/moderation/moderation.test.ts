import type { HeritageSite } from "@akar/domain";
import { and, asc, eq, sql } from "drizzle-orm";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, beforeEach, test } from "node:test";
import type { App } from "../../app.ts";
import type { Db } from "../../db/client.ts";
import { auditLog, media, mediaUploads, memories, memoryReports, pointEvents, profiles, staffMembers } from "../../db/schema/index.ts";
import { loadCatalog } from "../../db/seed.ts";
import type { ErrorBody } from "../../errors.ts";
import type { Role } from "../../platform/auth.ts";
import { encodeCursor } from "../../platform/pagination.ts";
import { authHeader } from "../../test/auth.ts";
import { startTestApp } from "../../test/harness.ts";
import { pointsOf } from "../engagement/points.ts";
import { sweepUnattachedPhotos } from "../media/service.ts";
import { createFsStorage, type FsStorage } from "../media/storage-fs.ts";
import { moderationRoutes } from "./routes.ts";
import type { AdminMemory, OwnMemory, PublicMemory } from "./schemas.ts";

const SITE = "ulu-cami";
const OTHER_SITE = "koza-han";
const DRAFT_SITE = "taslak-han";
const IZMIR_SITE = "izmir-cami";

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

let app: App;
let db: Db;
let stop: (() => Promise<void>) | undefined;
let storage: { uploads: FsStorage; media: FsStorage };
let root: string;

before(async () => {
  root = await mkdtemp(join(tmpdir(), "akar-moderation-"));
  const links = { uploadBaseUrl: "http://api.akar.test", signingSecret: "test-signing-secret-0123456789abcdef" };
  storage = {
    uploads: createFsStorage({ ...links, root: join(root, "uploads") }),
    media: createFsStorage({ ...links, root: join(root, "media"), publicBaseUrl: "https://cdn.akar.test/media" }),
  };
  ({ app, stop } = await startTestApp({ register: [moderationRoutes], storage }));
  db = app.deps.db;
  await loadCatalog(db, {
    sites: [
      site(SITE, "Ulu Cami", { kind: "cami" }),
      site(OTHER_SITE, "Koza Han"),
      site(DRAFT_SITE, "Taslak Han", { status: "draft" }),
      site(IZMIR_SITE, "İzmir Camii", { kind: "cami", city: "İzmir", district: "Konak", coordinates: [27.1, 38.4] }),
    ],
    routes: [],
  });
});
after(async () => {
  await stop?.();
  await rm(root, { recursive: true, force: true });
});
// Every test starts from an empty moderation state (reports go with their memories) and uses its own user ids.
beforeEach(async () => {
  await db.delete(memories);
});

// ── helpers ──────────────────────────────────────────────────────────────────

type Page<T> = { items: T[]; nextCursor: string | null };
type Actor = { id: string; headers: { authorization: string } };

let seq = 0;
const actor = (role: Role = "user", email?: string): Actor => {
  const id = `${role}-${++seq}`;
  return { id, headers: authHeader(email ? { id, role, email } : { id, role }) };
};

const call = async <T>(method: "GET" | "POST", url: string, as: Actor | null, payload?: object, extra: Record<string, string> = {}) => {
  const headers: Record<string, string> = { ...(as ? as.headers : {}), ...extra };
  const res = await app.inject({ method, url, headers, ...(payload ? { payload } : {}) });
  return { res, body: res.json<T>() };
};

const memoryBody = (over: Record<string, unknown> = {}) => ({
  siteId: SITE,
  text: "Avluda güzel bir sabah.",
  kvkkConsent: true,
  kvkkTextVersion: "kvkk-v1",
  ...over,
});

const decide = <T = AdminMemory>(id: string, body: object, as: Actor | null, extra: Record<string, string> = {}) =>
  call<T>("POST", `/v1/admin/memories/${id}/decision`, as, body, extra);

const publicIds = async (siteId = SITE) =>
  (await call<Page<PublicMemory>>("GET", `/v1/sites/${siteId}/memories`, null)).body.items.map((m) => m.id);

let memoryCount = 0;
const seedMemory = async (over: Partial<typeof memories.$inferInsert> = {}): Promise<string> => {
  const id = over.id ?? `mem-${++memoryCount}`;
  await db.insert(memories).values({
    siteId: SITE,
    authorId: "seed-author",
    authorName: "Ayşe",
    text: `Anı ${id}`,
    status: "approved",
    kvkkConsentAt: new Date(),
    kvkkTextVersion: "kvkk-v1",
    ...over,
    id,
  });
  return id;
};

const seedMedia = (id: string, over: Partial<typeof media.$inferInsert> = {}) =>
  db.insert(media).values({ kind: "photo", mime: "image/jpeg", url: `https://cdn.akar.test/${id}.jpg`, license: "CC0", trust: "representative", ...over, id });

const statusOf = async (id: string) => (await db.select({ status: memories.status }).from(memories).where(eq(memories.id, id)))[0]?.status;

const auditOf = (id: string) =>
  db
    .select({ action: auditLog.action, actorId: auditLog.actorId, before: auditLog.before, after: auditLog.after })
    .from(auditLog)
    .where(and(eq(auditLog.entityType, "memory"), eq(auditLog.entityId, id)))
    .orderBy(asc(auditLog.id));

const storedBy = async (userId: string) => (await db.select({ id: memories.id }).from(memories).where(eq(memories.authorId, userId))).length;

// ── authorization ────────────────────────────────────────────────────────────

test("moderation endpoints: guests get 401, users and editors 403, moderators and admins are let in", async () => {
  const id = await seedMemory({ status: "pending" });

  for (const [who, expected] of [
    [null, 401],
    [actor("user"), 403],
    [actor("editor"), 403],
  ] as const) {
    const label = who?.id ?? "guest";
    assert.equal((await call("GET", "/v1/admin/memories", who)).res.statusCode, expected, `queue as ${label}`);
    assert.equal((await decide(id, { status: "approved" }, who)).res.statusCode, expected, `decision as ${label}`);
  }
  assert.equal(await statusOf(id), "pending");

  for (const role of ["moderator", "admin"] as const) {
    assert.equal((await call("GET", "/v1/admin/memories", actor(role))).res.statusCode, 200, `queue as ${role}`);
  }
  assert.equal((await decide(id, { status: "approved" }, actor("admin"))).res.statusCode, 200);

  // Submitting, reporting and the own list need a session; reading a site's memories does not.
  for (const [method, url, payload] of [
    ["POST", "/v1/memories", memoryBody()],
    ["POST", `/v1/memories/${id}/report`, { reason: "Uygunsuz içerik" }],
    ["GET", "/v1/me/memories", undefined],
  ] as const) {
    assert.equal((await call(method, url, null, payload)).res.statusCode, 401, `${method} ${url} as guest`);
  }
  assert.equal((await call("GET", `/v1/sites/${SITE}/memories`, null)).res.statusCode, 200);
});

// ── what is public ───────────────────────────────────────────────────────────

test("only approved memories are public: pending, rejected, other sites' and drafts' never are, and no author identity leaks", async () => {
  const author = actor("user", "ayse@example.com");
  const approved = await seedMemory({ status: "approved", authorId: author.id, authorName: "Ayşe K.", text: "ONAYLI-ANI" });
  await seedMemory({ status: "pending", authorId: author.id, text: "BEKLEYEN-ANI" });
  await seedMemory({ status: "rejected", authorId: author.id, text: "REDDEDILEN-ANI", reason: "NEDEN-GIZLI" });
  await seedMemory({ status: "approved", siteId: OTHER_SITE, text: "BASKA-ESER-ANISI" });
  await seedMemory({ status: "approved", siteId: DRAFT_SITE, text: "TASLAK-ESER-ANISI" });

  const { res, body } = await call<Page<PublicMemory>>("GET", `/v1/sites/${SITE}/memories`, null);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(body.items.map((m) => m.id), [approved]);
  assert.doesNotMatch(res.body, /BEKLEYEN|REDDEDILEN|BASKA-ESER|TASLAK-ESER|NEDEN-GIZLI/);
  assert.doesNotMatch(res.body, new RegExp(`${author.id}|ayse@example`));
  assert.deepEqual(Object.keys(body.items[0] ?? {}).sort(), ["authorName", "createdAt", "id", "photo", "siteId", "text"]);

  // A draft or unknown site is 404 even though a memory of the draft is approved.
  for (const id of [DRAFT_SITE, "yok"]) {
    const missing = await call<ErrorBody>("GET", `/v1/sites/${id}/memories`, null);
    assert.equal(missing.res.statusCode, 404, id);
    assert.equal(missing.body.error.code, "NOT_FOUND");
  }
});

test("the memory feed carries only approved memories of published sites, narrowed by siteIds and city, and never the author's identity", async () => {
  const author = actor("user", "ayse@example.com");
  const ulu = await seedMemory({ status: "approved", authorId: author.id, authorName: "Ayşe K." });
  const koza = await seedMemory({ status: "approved", siteId: OTHER_SITE });
  const izmir = await seedMemory({ status: "approved", siteId: IZMIR_SITE });
  await seedMemory({ status: "pending", authorId: author.id, text: "BEKLEYEN-ANI" });
  await seedMemory({ status: "rejected", authorId: author.id, text: "REDDEDILEN-ANI", reason: "NEDEN-GIZLI" });
  await seedMemory({ status: "approved", siteId: DRAFT_SITE, text: "TASLAK-ESER-ANISI" });
  // Newest first: ulu, then koza, then izmir.
  for (const [id, at] of [[ulu, "2026-03-03"], [koza, "2026-03-02"], [izmir, "2026-03-01"]]) {
    await db.execute(sql`update memories set created_at = ${at}::timestamptz where id = ${id}`);
  }

  const feed = async (query = "") => {
    const { res, body } = await call<Page<PublicMemory>>("GET", `/v1/memories${query}`, null);
    assert.equal(res.statusCode, 200, query);
    assert.doesNotMatch(res.body, /BEKLEYEN|REDDEDILEN|TASLAK-ESER|NEDEN-GIZLI/, query);
    assert.doesNotMatch(res.body, new RegExp(`${author.id}|ayse@example`), query);
    return body.items.map((m) => m.id);
  };

  assert.deepEqual(await feed(), [ulu, koza, izmir]);
  assert.deepEqual(await feed(`?siteIds=${IZMIR_SITE},${SITE},${SITE}`), [ulu, izmir]);
  assert.deepEqual(await feed("?city=izmir"), [izmir]);
  assert.deepEqual(await feed(`?city=bursa&siteIds=${IZMIR_SITE},${OTHER_SITE}`), [koza]);
  // A draft's id answers like an unknown one: an empty page, not an error that would confirm it exists.
  assert.deepEqual(await feed(`?siteIds=${DRAFT_SITE}`), []);
  assert.deepEqual(await feed("?siteIds=yok"), []);

  const tooMany = Array.from({ length: 101 }, (_, i) => `s${i}`).join(",");
  for (const query of [`?siteIds=${tooMany}`, "?siteIds=,,", `?siteIds=${"x".repeat(101)}`]) {
    const { res, body } = await call<ErrorBody>("GET", `/v1/memories${query}`, null);
    assert.equal(res.statusCode, 400, query.slice(0, 40));
    assert.equal(body.error.code, "VALIDATION_FAILED");
  }
});

test("a submission starts pending under the profile name or 'Ziyaretçi' and goes public only once a moderator approves it", async () => {
  const named = actor("user", "ayse@example.com");
  const anonymous = actor();
  const mod = actor("moderator");
  await db.insert(profiles).values({ userId: named.id, displayName: "Ayşe K." });

  const first = await call<OwnMemory>("POST", "/v1/memories", named, memoryBody({ text: "  Avluda güzel bir sabah.  " }));
  const second = await call<OwnMemory>("POST", "/v1/memories", anonymous, memoryBody());
  assert.equal(first.res.statusCode, 201);
  assert.equal(first.body.status, "pending");
  assert.equal(first.body.text, "Avluda güzel bir sabah.");
  assert.equal(second.res.statusCode, 201);
  assert.deepEqual(await publicIds(), []);

  const queue = await call<Page<AdminMemory>>("GET", "/v1/admin/memories", mod);
  assert.deepEqual(queue.body.items.map((m) => [m.id, m.authorName]), [
    [first.body.id, "Ayşe K."],
    [second.body.id, "Ziyaretçi"],
  ]);

  assert.equal((await decide(first.body.id, { status: "approved" }, mod)).res.statusCode, 200);
  const list = await call<Page<PublicMemory>>("GET", `/v1/sites/${SITE}/memories`, null);
  assert.deepEqual(list.body.items.map((m) => [m.id, m.authorName]), [[first.body.id, "Ayşe K."]]);
  assert.doesNotMatch(list.res.body, new RegExp(`${named.id}|ayse@example`));
});

// ── submitting ───────────────────────────────────────────────────────────────

test("text outside 1–280 characters and a missing KVKK consent are 400, an unpublished or unknown site is 404, and nothing is stored", async () => {
  const user = actor();
  const post = (over: Record<string, unknown>) => call<ErrorBody>("POST", "/v1/memories", user, memoryBody(over));

  for (const text of ["a".repeat(281), "   ", ""]) {
    const { res, body } = await post({ text });
    assert.equal(res.statusCode, 400, `text of ${text.length} characters`);
    assert.equal(body.error.code, "VALIDATION_FAILED");
    assert.deepEqual(body.error.fieldErrors.text, ["Anın 1–280 karakter olmalı."]);
  }
  for (const [over, field] of [
    [{ kvkkConsent: false }, "kvkkConsent"],
    [{ kvkkConsent: "true" }, "kvkkConsent"],
    [{ kvkkConsent: undefined }, "kvkkConsent"],
    [{ kvkkTextVersion: undefined }, "kvkkTextVersion"],
  ] as const) {
    const { res, body } = await post(over);
    assert.equal(res.statusCode, 400, JSON.stringify(over));
    assert.equal(body.error.code, "VALIDATION_FAILED");
    assert.ok(body.error.fieldErrors[field]?.length, `fieldErrors.${field} for ${JSON.stringify(over)}`);
  }
  for (const siteId of [DRAFT_SITE, "yok"]) {
    const { res, body } = await post({ siteId });
    assert.equal(res.statusCode, 404, siteId);
    assert.equal(body.error.code, "NOT_FOUND");
  }
  assert.equal(await storedBy(user.id), 0);

  // The limit itself is inclusive.
  assert.equal((await post({ text: "a".repeat(280) })).res.statusCode, 201);
  assert.equal(await storedBy(user.id), 1);
});

test("an attached photo must be the author's own upload: another user's photo, a non-photo or an unknown id is 400 with one answer", async () => {
  const author = actor();
  const other = actor();
  await seedMedia("foto-benim", { uploadedBy: author.id });
  await seedMedia("foto-baskasi", { uploadedBy: other.id });
  await seedMedia("model-benim", { uploadedBy: author.id, kind: "model", mime: "model/gltf-binary", url: "https://cdn.akar.test/model-benim.glb" });
  await seedMedia("foto-tohum"); // seed content has no uploader

  const answers: unknown[] = [];
  for (const mediaId of ["foto-baskasi", "model-benim", "foto-tohum", "yok"]) {
    const { res, body } = await call<ErrorBody>("POST", "/v1/memories", author, memoryBody({ mediaId }));
    assert.equal(res.statusCode, 400, mediaId);
    assert.equal(body.error.code, "VALIDATION_FAILED");
    answers.push(body.error.fieldErrors.mediaId);
  }
  // Same answer for every refusal: it must not reveal whether the id is somebody else's upload.
  assert.ok(Array.isArray(answers[0]) && answers.every((a) => JSON.stringify(a) === JSON.stringify(answers[0])));
  assert.equal(await storedBy(author.id), 0);

  const ok = await call<OwnMemory>("POST", "/v1/memories", author, memoryBody({ mediaId: "foto-benim" }));
  assert.equal(ok.res.statusCode, 201);
  assert.deepEqual(ok.body.photo, { id: "foto-benim", url: "https://cdn.akar.test/foto-benim.jpg", alt: "" });
  const queue = await call<Page<AdminMemory>>("GET", "/v1/admin/memories", actor("moderator"));
  assert.equal(queue.body.items[0]?.photo?.url, "https://cdn.akar.test/foto-benim.jpg");
});

test("replaying POST /v1/memories with the same Idempotency-Key stores one memory; the key with another body is 422", async () => {
  const user = actor();
  const key = { "idempotency-key": "submit-1" };

  const first = await call<OwnMemory>("POST", "/v1/memories", user, memoryBody(), key);
  const replay = await call<OwnMemory>("POST", "/v1/memories", user, memoryBody(), key);
  assert.equal(first.res.statusCode, 201);
  assert.equal(replay.res.statusCode, 201);
  assert.deepEqual(replay.body, first.body);
  assert.equal(await storedBy(user.id), 1);

  const reused = await call<ErrorBody>("POST", "/v1/memories", user, memoryBody({ text: "Başka bir anı" }), key);
  assert.equal(reused.res.statusCode, 422);
  assert.equal(reused.body.error.code, "IDEMPOTENCY_KEY_REUSED");
  assert.equal(await storedBy(user.id), 1);
});

// ── decisions ────────────────────────────────────────────────────────────────

test("only a pending memory can be decided: approved and rejected ones answer 409, a rejection needs a reason, only an admin decides their own", async () => {
  const author = actor();
  const mod = actor("moderator");

  // Rejection without a (non-blank) reason is refused and leaves the memory pending.
  const pending = await seedMemory({ status: "pending", authorId: author.id });
  for (const body of [{ status: "rejected" }, { status: "rejected", reason: "   " }]) {
    const { res, body: err } = await decide<ErrorBody>(pending, body, mod);
    assert.equal(res.statusCode, 400, JSON.stringify(body));
    assert.equal(err.error.code, "VALIDATION_FAILED");
    assert.deepEqual(err.error.fieldErrors.reason, ["Ret nedeni zorunludur."]);
  }
  assert.equal((await decide<ErrorBody>(pending, { status: "pending" }, mod)).res.statusCode, 400);
  assert.equal(await statusOf(pending), "pending");
  assert.equal((await auditOf(pending)).length, 0);

  // With a reason it is rejected, audited, and final.
  const rejected = await decide(pending, { status: "rejected", reason: "Uygunsuz içerik" }, mod);
  assert.equal(rejected.res.statusCode, 200);
  assert.deepEqual([rejected.body.status, rejected.body.reason, rejected.body.decidedBy], ["rejected", "Uygunsuz içerik", mod.id]);
  assert.ok(rejected.body.decidedAt);
  const [entry] = await auditOf(pending);
  assert.deepEqual(entry, {
    action: "memory.reject",
    actorId: mod.id,
    before: { status: "pending", reason: null },
    after: { status: "rejected", reason: "Uygunsuz içerik" },
  });
  for (const body of [{ status: "approved" }, { status: "rejected", reason: "Yine ret" }]) {
    const again = await decide<ErrorBody>(pending, body, mod);
    assert.equal(again.res.statusCode, 409, JSON.stringify(body));
    assert.equal(again.body.error.code, "CONFLICT");
  }
  assert.equal(await statusOf(pending), "rejected");

  // An approved memory nobody reported cannot be approved again: it has nothing to decide (taking it down is a rejection).
  const live = await seedMemory({ status: "approved", authorId: author.id });
  const conflict = await decide<ErrorBody>(live, { status: "approved" }, mod);
  assert.equal(conflict.res.statusCode, 409);
  assert.match(conflict.body.error.message, /onaylanacak bir şey yok/);
  assert.equal(await statusOf(live), "approved");
  assert.equal((await auditOf(live)).length, 0);

  assert.equal((await decide<ErrorBody>("yok", { status: "approved" }, mod)).res.statusCode, 404);

  // A moderator cannot decide a memory they wrote.
  const own = await seedMemory({ status: "pending", authorId: mod.id });
  const forbidden = await decide<ErrorBody>(own, { status: "approved" }, mod);
  assert.equal(forbidden.res.statusCode, 403);
  assert.equal(forbidden.body.error.code, "FORBIDDEN");
  assert.equal(await statusOf(own), "pending");
  assert.equal((await auditOf(own)).length, 0);
  assert.equal(await pointsOf(db, mod.id), 0);

  // An admin may decide a memory they wrote: it is published, audited under their id, and pays the usual points.
  const admin = actor("admin");
  const adminOwn = await seedMemory({ status: "pending", authorId: admin.id });
  const selfApproved = await decide(adminOwn, { status: "approved" }, admin);
  assert.equal(selfApproved.res.statusCode, 200);
  assert.equal(selfApproved.body.decidedBy, admin.id);
  assert.ok((await publicIds()).includes(adminOwn));
  assert.deepEqual((await auditOf(adminOwn)).map((e) => [e.action, e.actorId]), [["memory.approve", admin.id]]);
  assert.equal(await pointsOf(db, admin.id), 25);

  // Rejected memories pay nothing; an approval replayed with its Idempotency-Key is one decision.
  assert.equal(await pointsOf(db, author.id), 0);
  const fresh = await seedMemory({ status: "pending", authorId: author.id });
  const key = { "idempotency-key": "decide-1" };
  const first = await decide(fresh, { status: "approved" }, mod, key);
  const replay = await decide(fresh, { status: "approved" }, mod, key);
  assert.equal(first.res.statusCode, 200);
  assert.deepEqual(replay.body, first.body);
  assert.equal((await auditOf(fresh)).length, 1);
  assert.equal(await pointsOf(db, author.id), 25);
});

test("approval pays the author 25 points once, even when the memory is reported and approved again", async () => {
  const author = actor();
  const reporters = [actor(), actor(), actor()];
  const mod = actor("moderator");

  const created = await call<OwnMemory>("POST", "/v1/memories", author, memoryBody());
  const id = created.body.id;
  assert.equal(await pointsOf(db, author.id), 0);

  assert.equal((await decide(id, { status: "approved" }, mod)).res.statusCode, 200);
  assert.equal(await pointsOf(db, author.id), 25);

  for (const reporter of reporters) {
    assert.equal((await call("POST", `/v1/memories/${id}/report`, reporter, { reason: "Şüpheli içerik" })).res.statusCode, 201);
  }
  assert.equal(await statusOf(id), "pending");
  assert.equal((await decide(id, { status: "approved" }, mod)).res.statusCode, 200);
  assert.equal(await statusOf(id), "approved");

  assert.equal(await pointsOf(db, author.id), 25);
  const events = await db.select().from(pointEvents).where(and(eq(pointEvents.userId, author.id), eq(pointEvents.subjectId, id)));
  assert.deepEqual(events.map((e) => [e.action, e.points]), [["memory.approved", 25]]);

  // Every step is audited with the states before and after.
  const trail = await auditOf(id);
  assert.deepEqual(trail.map((a) => [a.action, a.actorId]), [
    ["memory.create", author.id],
    ["memory.approve", mod.id],
    ["memory.report", reporters[0]?.id],
    ["memory.report", reporters[1]?.id],
    ["memory.report", reporters[2]?.id],
    ["memory.approve", mod.id],
  ]);
  assert.deepEqual([trail[0]?.before, trail[0]?.after], [null, { status: "pending", siteId: SITE, photo: false }]);
  assert.deepEqual([trail[1]?.before, trail[1]?.after], [{ status: "pending", reason: null }, { status: "approved", reason: null }]);
  assert.deepEqual([trail[2]?.before, trail[2]?.after], [{ status: "approved" }, { status: "approved", reporters: 1 }]);
  assert.deepEqual([trail[4]?.before, trail[4]?.after], [{ status: "approved" }, { status: "pending", reporters: 3 }]);
});

// ── reports ("Bildir") ───────────────────────────────────────────────────────

test("a report keeps an approved memory public until three different users reported it; a repeat changes nothing; own, pending and rejected memories are not reportable", async () => {
  const author = actor();
  const reporter = actor();
  const second = actor();
  const third = actor();
  const latecomer = actor();
  const mod = actor("moderator");
  const id = await seedMemory({ status: "approved", authorId: author.id });
  const report = <T = { id: string; reported: boolean }>(as: Actor, reason: string, target = id) =>
    call<T>("POST", `/v1/memories/${target}/report`, as, { reason });
  assert.deepEqual(await publicIds(), [id]);

  // The author cannot report their own memory, and a reason must be 3–200 characters.
  assert.equal((await report<ErrorBody>(author, "Kendi anım")).res.statusCode, 403);
  assert.equal((await report<ErrorBody>(reporter, "ab")).res.statusCode, 400);
  assert.equal((await report<ErrorBody>(reporter, "x".repeat(201))).res.statusCode, 400);
  assert.equal((await report<ErrorBody>(reporter, "Uygunsuz içerik", "yok")).res.statusCode, 404);
  assert.deepEqual(await publicIds(), [id]);

  const first = await report(reporter, "Uygunsuz fotoğraf");
  assert.equal(first.res.statusCode, 201);
  assert.deepEqual(first.body, { id, reported: true });
  assert.deepEqual(await publicIds(), [id], "one report does not hide it");
  assert.equal(await statusOf(id), "approved");

  // Repeating (even with another reason) is 200 and leaves one report and one audit row; it does not move the count.
  const again = await report(reporter, "Başka bir neden");
  assert.equal(again.res.statusCode, 200);
  assert.deepEqual(again.body, { id, reported: true });
  const reports = await db.select({ reason: memoryReports.reason }).from(memoryReports).where(eq(memoryReports.memoryId, id));
  assert.deepEqual(reports, [{ reason: "Uygunsuz fotoğraf" }]);
  assert.deepEqual((await auditOf(id)).map((a) => a.action), ["memory.report"]);
  assert.equal((await report(reporter, "Yine ben")).res.statusCode, 200);

  // The second distinct user still leaves it public; the third hides it and queues it again.
  assert.equal((await report(second, "İkinci bildirim")).res.statusCode, 201);
  assert.deepEqual(await publicIds(), [id]);
  assert.equal(await statusOf(id), "approved");
  assert.equal((await report(third, "Üçüncü bildirim")).res.statusCode, 201);
  assert.deepEqual(await publicIds(), []);
  assert.equal(await statusOf(id), "pending");

  // Nobody else can report a memory that is no longer public.
  assert.equal((await report<ErrorBody>(latecomer, "Ben de bildiriyorum")).res.statusCode, 404);

  // The moderator finds it back in the queue with the reports, and decides again.
  const queue = await call<Page<AdminMemory>>("GET", "/v1/admin/memories", mod);
  assert.deepEqual(
    queue.body.items.map((m) => [m.id, m.status, m.reportCount, m.reportReasons]),
    [[id, "pending", 3, ["Üçüncü bildirim", "İkinci bildirim", "Uygunsuz fotoğraf"]]],
  );
  assert.equal(queue.body.items[0]?.decidedAt, null);
  assert.equal((await decide(id, { status: "rejected", reason: "Bildirim haklı" }, mod)).res.statusCode, 200);

  // Once it left `approved`, only a repeat by an earlier reporter still answers 200 (nothing changes);
  // everybody else gets 404, and so does any report of a pending or rejected memory.
  assert.equal((await report<ErrorBody>(latecomer, "Geç kaldım")).res.statusCode, 404);
  assert.equal((await report(reporter, "Yine bildiriyorum")).res.statusCode, 200);
  assert.equal(await statusOf(id), "rejected");
  const stillPending = await seedMemory({ status: "pending", authorId: author.id });
  assert.equal((await report<ErrorBody>(reporter, "Uygunsuz içerik", stillPending)).res.statusCode, 404);
  assert.equal(await statusOf(stillPending), "pending");
});

test("racing requests on one memory are serialized: a double approval, two reporters and one reporter twice each end consistently", async () => {
  const author = actor();
  const id = await seedMemory({ status: "pending", authorId: author.id });
  const report = (as: Actor) => call("POST", `/v1/memories/${id}/report`, as, { reason: "Uygunsuz içerik" });
  const codes = (results: { res: { statusCode: number } }[]) => results.map((r) => r.res.statusCode).sort();

  // Two moderators approve at the same moment: one decision, one audit row, one payment.
  const approvals = await Promise.all([decide(id, { status: "approved" }, actor("moderator")), decide(id, { status: "approved" }, actor("moderator"))]);
  assert.deepEqual(codes(approvals), [200, 409]);
  assert.equal((await auditOf(id)).length, 1);
  assert.equal(await pointsOf(db, author.id), 25);

  // Two different users report the approved memory at the same moment: both count, it stays public.
  assert.deepEqual(codes(await Promise.all([report(actor()), report(actor())])), [201, 201]);
  assert.equal((await db.select({ id: memoryReports.id }).from(memoryReports).where(eq(memoryReports.memoryId, id))).length, 2);
  assert.equal(await statusOf(id), "approved");

  // The same user reporting twice at the same moment: one report, one repeat; the third reporter hides it.
  const twice = actor();
  assert.deepEqual(codes(await Promise.all([report(twice), report(twice)])), [200, 201]);
  assert.equal((await db.select({ id: memoryReports.id }).from(memoryReports).where(eq(memoryReports.memoryId, id))).length, 3);
  assert.equal(await statusOf(id), "pending");
  assert.equal(await pointsOf(db, author.id), 25);
});

test("a report below the threshold keeps the memory public and visible in the queue; moderators can reject it or dismiss the reports", async () => {
  const author = actor();
  const mod = actor("moderator");
  const reporters = Array.from({ length: 5 }, () => actor());
  const [r1, r2, r3, r4, r5] = reporters as [Actor, Actor, Actor, Actor, Actor];
  const id = await seedMemory({ status: "approved", authorId: author.id });
  const clean = await seedMemory({ status: "approved", authorId: author.id });
  const report = (as: Actor, target = id) => call("POST", `/v1/memories/${target}/report`, as, { reason: "Uygunsuz içerik" });
  const queue = async () => (await call<Page<AdminMemory>>("GET", "/v1/admin/memories", mod)).body.items.map((m) => [m.id, m.status, m.reportCount]);

  assert.deepEqual(await queue(), []);
  assert.equal((await report(r1)).res.statusCode, 201);
  assert.equal((await report(r2)).res.statusCode, 201);
  assert.deepEqual((await publicIds()).sort(), [id, clean].sort());
  assert.deepEqual(await queue(), [[id, "approved", 2]], "reported but still approved: surfaced with its reporters; unreported ones are not");

  // Dismissing: the memory stays public, nobody is paid twice, and the count starts from zero.
  const dismissed = await decide<AdminMemory>(id, { status: "approved" }, mod);
  assert.equal(dismissed.res.statusCode, 200);
  assert.deepEqual([dismissed.body.status, dismissed.body.reportCount], ["approved", 0]);
  assert.deepEqual(await queue(), []);
  assert.equal((await decide<ErrorBody>(id, { status: "approved" }, mod)).res.statusCode, 409, "nothing left to decide");

  // Two earlier reporters cannot report again, and two new ones do not reach the threshold: the old reports do not add up.
  assert.equal((await report(r1)).res.statusCode, 200);
  assert.equal((await report(r3)).res.statusCode, 201);
  assert.equal((await report(r4)).res.statusCode, 201);
  assert.equal(await statusOf(id), "approved");
  assert.deepEqual(await queue(), [[id, "approved", 2]]);
  assert.equal((await report(r5)).res.statusCode, 201);
  assert.equal(await statusOf(id), "pending", "the third reporter since the approval hides it");
  assert.deepEqual(await publicIds(), [clean]);

  // Rejecting a reported approved memory takes it down for good.
  const rejectable = await seedMemory({ status: "approved", authorId: author.id });
  await report(r1, rejectable);
  const rejected = await decide<AdminMemory>(rejectable, { status: "rejected", reason: "Bildirim haklı" }, mod);
  assert.equal(rejected.res.statusCode, 200);
  assert.deepEqual([rejected.body.status, rejected.body.reportCount], ["rejected", 1]);
  assert.deepEqual(await publicIds(), [clean]);
  assert.equal((await decide<ErrorBody>(rejectable, { status: "approved" }, mod)).res.statusCode, 409);
});

test("a user files at most 5 new reports per rolling 24 hours; repeats do not count and a refused report changes nothing", async () => {
  const author = actor();
  const reporter = actor();
  const ids: string[] = [];
  for (let n = 0; n < 6; n++) ids.push(await seedMemory({ status: "approved", authorId: author.id }));
  const report = <T = { id: string; reported: boolean }>(target: string) =>
    call<T>("POST", `/v1/memories/${target}/report`, reporter, { reason: "Uygunsuz içerik" });
  const rows = (target: string) => db.select({ id: memoryReports.id }).from(memoryReports).where(eq(memoryReports.memoryId, target));

  for (const target of ids.slice(0, 5)) assert.equal((await report(target)).res.statusCode, 201);
  const sixth = ids[5] as string;
  const refused = await report<ErrorBody>(sixth);
  assert.equal(refused.res.statusCode, 429);
  assert.equal(refused.body.error.code, "RATE_LIMITED");
  assert.match(refused.body.error.message, /en fazla 5 yeni bildirim/);
  assert.deepEqual([(await rows(sixth)).length, await statusOf(sixth), (await auditOf(sixth)).length], [0, "approved", 0]);

  // A repeat of a memory already reported is still 200 at the quota, and someone else is not limited.
  assert.equal((await report(ids[0] as string)).res.statusCode, 200);
  assert.equal((await call("POST", `/v1/memories/${sixth}/report`, actor(), { reason: "Uygunsuz içerik" })).res.statusCode, 201);

  // The window rolls: once the oldest report is a day old, a new one fits again.
  await db.update(memoryReports).set({ createdAt: new Date(Date.now() - 25 * 3_600_000) }).where(eq(memoryReports.memoryId, ids[0] as string));
  assert.equal((await report(sixth)).res.statusCode, 201);
  assert.equal((await rows(sixth)).length, 2);
});

// ── lists ────────────────────────────────────────────────────────────────────

test("the queue lists pending memories oldest first with site name, photo, report count and the five latest reasons; other statuses are filtered", async () => {
  const author = actor();
  const mod = actor("moderator");
  await seedMedia("kuyruk-foto", { uploadedBy: author.id, alt: "Avlu" });
  const oldest = await seedMemory({ status: "pending", authorId: author.id, createdAt: new Date("2026-03-01T10:00:00Z") });
  const middle = await seedMemory({ status: "pending", authorId: author.id, mediaId: "kuyruk-foto", createdAt: new Date("2026-03-02T10:00:00Z") });
  const newest = await seedMemory({ status: "pending", siteId: OTHER_SITE, authorId: author.id, createdAt: new Date("2026-03-03T10:00:00Z") });
  const approved = await seedMemory({ status: "approved", authorId: author.id });

  // `oldest` was reported seven times over its life (once per approval cycle) and is queued again.
  for (let n = 1; n <= 7; n++) {
    await db.insert(memoryReports).values({
      id: `report-${n}`,
      memoryId: oldest,
      reporterId: `reporter-${n}`,
      reason: `neden-${n}`,
      createdAt: new Date(Date.UTC(2026, 2, 10, 10, n)),
    });
  }

  const queue = await call<Page<AdminMemory>>("GET", "/v1/admin/memories", mod);
  assert.equal(queue.res.statusCode, 200);
  assert.deepEqual(queue.body.items.map((m) => m.id), [oldest, middle, newest]);
  const [first, second, third] = queue.body.items;
  assert.equal(first?.siteName, "Ulu Cami");
  assert.equal(first?.reportCount, 7);
  assert.deepEqual(first?.reportReasons, ["neden-7", "neden-6", "neden-5", "neden-4", "neden-3"]);
  assert.deepEqual(second?.photo, { id: "kuyruk-foto", url: "https://cdn.akar.test/kuyruk-foto.jpg", alt: "Avlu" });
  assert.deepEqual([third?.siteName, third?.reportCount, third?.reportReasons, third?.photo], ["Koza Han", 0, [], null]);

  const approvedQueue = await call<Page<AdminMemory>>("GET", "/v1/admin/memories?status=approved", mod);
  assert.deepEqual(approvedQueue.body.items.map((m) => m.id), [approved]);
  assert.equal((await call<ErrorBody>("GET", "/v1/admin/memories?status=bogus", mod)).res.statusCode, 400);
});

test("'Paylaşımlarım' lists only the caller's memories, newest first, with their status and the rejection reason", async () => {
  const me = actor();
  const other = actor();
  const approved = await seedMemory({ status: "approved", authorId: me.id, createdAt: new Date("2026-03-01T10:00:00Z") });
  const pending = await seedMemory({ status: "pending", authorId: me.id, createdAt: new Date("2026-03-02T10:00:00Z") });
  const rejected = await seedMemory({ status: "rejected", reason: "Fotoğraf uygun değil", authorId: me.id, createdAt: new Date("2026-03-03T10:00:00Z") });
  await seedMemory({ status: "approved", authorId: other.id });

  const { res, body } = await call<Page<OwnMemory>>("GET", "/v1/me/memories", me);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(body.items.map((m) => [m.id, m.status, m.reason, m.siteName]), [
    [rejected, "rejected", "Fotoğraf uygun değil", "Ulu Cami"],
    [pending, "pending", null, "Ulu Cami"],
    [approved, "approved", null, "Ulu Cami"],
  ]);
  assert.doesNotMatch(res.body, new RegExp(other.id));
});

test("'Paylaşımlarım' hides the name of a site that is not published; the moderation queue still shows it", async () => {
  const me = actor();
  const live = await seedMemory({ status: "pending", authorId: me.id, siteId: SITE, createdAt: new Date("2026-03-01T10:00:00Z") });
  const hidden = await seedMemory({ status: "pending", authorId: me.id, siteId: DRAFT_SITE, createdAt: new Date("2026-03-02T10:00:00Z") });

  const own = await call<Page<OwnMemory>>("GET", "/v1/me/memories", me);
  assert.deepEqual(own.body.items.map((m) => [m.id, m.siteId, m.siteName]), [
    [hidden, DRAFT_SITE, null],
    [live, SITE, "Ulu Cami"],
  ]);
  assert.doesNotMatch(own.res.body, /Taslak Han/);

  const queue = await call<Page<AdminMemory>>("GET", "/v1/admin/memories", actor("moderator"));
  assert.equal(queue.body.items.find((m) => m.id === hidden)?.siteName, "Taslak Han");
});

test("pages follow (created_at, id) exactly: no repeat or gap across rows created within one millisecond or at the same instant", async () => {
  const mod = actor("moderator");
  // a, b and c are created within one millisecond (a JS Date cannot tell them apart); d and e at the very same instant.
  const stamps = [
    ["mem-a", "2026-03-01T10:00:00.000100Z"],
    ["mem-b", "2026-03-01T10:00:00.000200Z"],
    ["mem-c", "2026-03-01T10:00:00.000300Z"],
    ["mem-d", "2026-03-01T10:00:05Z"],
    ["mem-e", "2026-03-01T10:00:05Z"],
  ] as const;
  for (const [id, at] of stamps) {
    await seedMemory({ id, status: "approved" });
    await db.execute(sql`update memories set created_at = ${at}::timestamptz where id = ${id}`);
  }

  const walk = async (url: string, as: Actor | null, limit: number) => {
    const seen: string[] = [];
    let cursor: string | null = null;
    do {
      const query: string = `${url.includes("?") ? "&" : "?"}limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
      const { res, body } = await call<Page<{ id: string }>>("GET", `${url}${query}`, as);
      assert.equal(res.statusCode, 200);
      seen.push(...body.items.map((m) => m.id));
      cursor = body.nextCursor;
    } while (cursor);
    return seen;
  };

  // Public list: newest first, equal instants by id descending.
  for (const limit of [1, 2, 5]) {
    assert.deepEqual(await walk(`/v1/sites/${SITE}/memories`, null, limit), ["mem-e", "mem-d", "mem-c", "mem-b", "mem-a"], `public, limit ${limit}`);
    assert.deepEqual(await walk("/v1/memories", null, limit), ["mem-e", "mem-d", "mem-c", "mem-b", "mem-a"], `feed, limit ${limit}`);
  }
  // Moderation queue: oldest first, equal instants by id ascending.
  await db.update(memories).set({ status: "pending" });
  for (const limit of [1, 2, 5]) {
    assert.deepEqual(await walk("/v1/admin/memories", mod, limit), ["mem-a", "mem-b", "mem-c", "mem-d", "mem-e"], `queue, limit ${limit}`);
  }

  // A malformed cursor is 400, never a database error.
  for (const cursor of ["%%%", encodeCursor({ n: "x" }), encodeCursor({ t: "dün", i: "mem-a" }), encodeCursor({ t: "123456789012345678", i: "mem-a" })]) {
    const { res, body } = await call<ErrorBody>("GET", `/v1/sites/${SITE}/memories?cursor=${encodeURIComponent(cursor)}`, null);
    assert.equal(res.statusCode, 400, cursor);
    assert.equal(body.error.code, "INVALID_CURSOR");
  }
});

// ── removal: takedown, rejection, delete ─────────────────────────────────────

const remove = (url: string, as: Actor | null, extra: Record<string, string> = {}) =>
  app.inject({ method: "DELETE", url, headers: { ...(as ? as.headers : {}), ...extra } });

let photoCount = 0;
/** A visitor photo with its object in the public bucket, as `complete` leaves it. */
const storedPhoto = async (uploadedBy: string | null, over: Partial<typeof media.$inferInsert> = {}) => {
  const id = `foto-${++photoCount}`;
  const storageKey = `photo/2026/10/${id}.jpg`;
  await storage.media.put(storageKey, Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]), "image/jpeg");
  await seedMedia(id, { uploadedBy, storageKey, url: storage.media.publicUrl(storageKey), ...over });
  return { id, storageKey };
};
const photoGone = async (photo: { id: string; storageKey: string }) =>
  (await db.select({ id: media.id }).from(media).where(eq(media.id, photo.id))).length === 0 && (await storage.media.head(photo.storageKey)) === null;

/** A memory submitted with `photo` and approved through the API, so the author holds its 25 points. */
const approvedWithPhoto = async (author: Actor, photo: { id: string }) => {
  const created = await call<OwnMemory>("POST", "/v1/memories", author, memoryBody({ mediaId: photo.id }));
  assert.equal(created.res.statusCode, 201, created.res.body);
  assert.equal((await decide(created.body.id, { status: "approved" }, actor("moderator"))).res.statusCode, 200);
  return created.body.id;
};

test("a moderator takes down an approved memory nobody reported: rejected, audited as a takedown, photo deleted, points taken back once", async () => {
  const author = actor();
  const mod = actor("moderator");
  const photo = await storedPhoto(author.id);
  const id = await approvedWithPhoto(author, photo);
  assert.equal(await pointsOf(db, author.id), 25);

  // A reason is still required.
  assert.equal((await decide<ErrorBody>(id, { status: "rejected" }, mod)).res.statusCode, 400);
  assert.deepEqual(await publicIds(), [id]);

  const key = { "idempotency-key": "takedown-1" };
  const down = await decide(id, { status: "rejected", reason: "Kişisel bilgi içeriyor" }, mod, key);
  assert.equal(down.res.statusCode, 200);
  assert.deepEqual([down.body.status, down.body.reason, down.body.photo], ["rejected", "Kişisel bilgi içeriyor", null]);
  assert.deepEqual(await publicIds(), []);
  assert.ok(await photoGone(photo), "photo row and public object are gone");
  assert.equal((await db.select({ text: memories.text }).from(memories).where(eq(memories.id, id))).length, 1, "the text stays for the record");

  const trail = await auditOf(id);
  assert.deepEqual(trail.at(-1), {
    action: "memory.takedown",
    actorId: mod.id,
    before: { status: "approved", reason: null },
    after: { status: "rejected", reason: "Kişisel bilgi içeriyor" },
  });

  // The replay changes nothing; the decision is final; the points went back exactly once.
  assert.deepEqual((await decide(id, { status: "rejected", reason: "Kişisel bilgi içeriyor" }, mod, key)).body, down.body);
  assert.equal((await decide<ErrorBody>(id, { status: "approved" }, mod)).res.statusCode, 409);
  assert.equal(await pointsOf(db, author.id), 0);
  const events = await db.select().from(pointEvents).where(eq(pointEvents.subjectId, id));
  assert.deepEqual(events.map((e) => [e.action, e.points]).sort(), [["memory.approved", 25], ["memory.removed", -25]]);

  // A moderator still cannot take down their own memory; an admin can.
  const ownByMod = await seedMemory({ status: "approved", authorId: mod.id });
  assert.equal((await decide<ErrorBody>(ownByMod, { status: "rejected", reason: "Kendi anım" }, mod)).res.statusCode, 403);
  const admin = actor("admin");
  const ownByAdmin = await seedMemory({ status: "approved", authorId: admin.id });
  assert.equal((await decide(ownByAdmin, { status: "rejected", reason: "Kendi anım" }, admin)).res.statusCode, 200);
});

test("rejecting a pending memory deletes its photo and moves no points; rejecting a reported approved one takes the points back", async () => {
  const author = actor();
  const mod = actor("moderator");

  const photo = await storedPhoto(author.id);
  const created = await call<OwnMemory>("POST", "/v1/memories", author, memoryBody({ mediaId: photo.id }));
  const rejected = await decide(created.body.id, { status: "rejected", reason: "Fotoğraf uygun değil" }, mod);
  assert.deepEqual([rejected.body.status, rejected.body.photo], ["rejected", null]);
  assert.ok(await photoGone(photo));
  assert.equal((await db.select().from(pointEvents).where(eq(pointEvents.userId, author.id))).length, 0);

  const second = await storedPhoto(author.id);
  const id = await approvedWithPhoto(author, second);
  assert.equal((await call("POST", `/v1/memories/${id}/report`, actor(), { reason: "Uygunsuz içerik" })).res.statusCode, 201);
  const down = await decide(id, { status: "rejected", reason: "Bildirim haklı" }, mod);
  assert.equal(down.res.statusCode, 200);
  assert.equal((await auditOf(id)).at(-1)?.action, "memory.reject", "a reported memory is rejected, not taken down");
  assert.ok(await photoGone(second));
  assert.equal(await pointsOf(db, author.id), 0);
});

test("an author deletes their own memory in any status: record, reports and photo go, approval points come back; others' ids are 404", async () => {
  const author = actor();
  const other = actor();
  const photo = await storedPhoto(author.id);
  const approved = await approvedWithPhoto(author, photo);
  await call("POST", `/v1/memories/${approved}/report`, other, { reason: "Uygunsuz içerik" });
  const pending = await seedMemory({ status: "pending", authorId: author.id });
  const rejected = await seedMemory({ status: "rejected", reason: "Uygun değil", authorId: author.id });
  const notMine = await seedMemory({ status: "approved", authorId: other.id });
  assert.equal(await pointsOf(db, author.id), 25);

  assert.equal((await remove(`/v1/me/memories/${approved}`, null)).statusCode, 401);
  const notFound = await remove(`/v1/me/memories/${notMine}`, author);
  assert.equal(notFound.statusCode, 404, "somebody else's memory reads as unknown");
  assert.equal(await statusOf(notMine), "approved");
  assert.equal((await remove("/v1/me/memories/yok", author)).statusCode, 404);

  const key = { "idempotency-key": "sil-1" };
  const gone = await remove(`/v1/me/memories/${approved}`, author, key);
  assert.equal(gone.statusCode, 204);
  assert.equal(gone.body, "");
  assert.equal((await remove(`/v1/me/memories/${approved}`, author, key)).statusCode, 204, "a replay answers the same");
  assert.equal((await remove(`/v1/me/memories/${approved}`, author)).statusCode, 404, "a fresh delete of a deleted memory is 404");

  assert.equal(await statusOf(approved), undefined);
  assert.deepEqual(await publicIds(), [notMine]);
  assert.equal((await db.select().from(memoryReports).where(eq(memoryReports.memoryId, approved))).length, 0);
  assert.ok(await photoGone(photo));
  assert.equal(await pointsOf(db, author.id), 0);

  // Audited once, without the text.
  const deletions = (await auditOf(approved)).filter((e) => e.action === "memory.delete");
  assert.deepEqual(deletions, [
    { action: "memory.delete", actorId: author.id, before: { status: "approved", siteId: SITE, photo: true, byAuthor: true }, after: null },
  ]);

  for (const id of [pending, rejected]) assert.equal((await remove(`/v1/me/memories/${id}`, author)).statusCode, 204);
  assert.equal(await storedBy(author.id), 0);
});

test("only an admin deletes any memory for good; moderators, editors and users get 403", async () => {
  const author = actor();
  const photo = await storedPhoto(author.id);
  const id = await approvedWithPhoto(author, photo);

  assert.equal((await remove(`/v1/admin/memories/${id}`, null)).statusCode, 401);
  for (const role of ["user", "editor", "moderator"] as const) {
    assert.equal((await remove(`/v1/admin/memories/${id}`, actor(role))).statusCode, 403, role);
  }
  // The author is no admin either: their way is DELETE /v1/me/memories/:id.
  assert.equal((await remove(`/v1/admin/memories/${id}`, author)).statusCode, 403);
  assert.equal(await statusOf(id), "approved");

  const admin = actor("admin");
  assert.equal((await remove(`/v1/admin/memories/${id}`, admin)).statusCode, 204);
  assert.equal(await statusOf(id), undefined);
  assert.ok(await photoGone(photo));
  assert.equal(await pointsOf(db, author.id), 0);
  assert.deepEqual((await auditOf(id)).at(-1), {
    action: "memory.delete",
    actorId: admin.id,
    before: { status: "approved", siteId: SITE, photo: true, byAuthor: false },
    after: null,
  });
  assert.equal((await remove(`/v1/admin/memories/${id}`, admin)).statusCode, 404);
});

test("a photo still used elsewhere keeps its row and object when its memory goes", async () => {
  const editor = actor("editor");
  const photo = await storedPhoto(editor.id);
  const first = await seedMemory({ status: "pending", authorId: editor.id, mediaId: photo.id });
  const second = await seedMemory({ status: "pending", authorId: editor.id, mediaId: photo.id });

  assert.equal((await remove(`/v1/me/memories/${first}`, editor)).statusCode, 204);
  assert.equal(await photoGone(photo), false);
  assert.ok(await storage.media.head(photo.storageKey));
  assert.equal((await remove(`/v1/me/memories/${second}`, editor)).statusCode, 204);
  assert.ok(await photoGone(photo));
});

// ── abuse limits ─────────────────────────────────────────────────────────────

test("a visitor holds at most 3 pending memories; deleting one frees a slot; staff are exempt", async () => {
  const user = actor();
  const ids: string[] = [];
  for (let n = 0; n < 3; n++) {
    const created = await call<OwnMemory>("POST", "/v1/memories", user, memoryBody());
    assert.equal(created.res.statusCode, 201);
    ids.push(created.body.id);
  }
  const fourth = await call<ErrorBody>("POST", "/v1/memories", user, memoryBody());
  assert.equal(fourth.res.statusCode, 429);
  assert.equal(fourth.body.error.code, "RATE_LIMITED");
  assert.match(fourth.body.error.message, /en fazla 3 anın/);
  assert.equal(await storedBy(user.id), 3);

  assert.equal((await remove(`/v1/me/memories/${ids[0]}`, user)).statusCode, 204);
  assert.equal((await call("POST", "/v1/memories", user, memoryBody())).res.statusCode, 201);
  // A decision frees a slot too.
  assert.equal((await decide(ids[1] as string, { status: "approved" }, actor("moderator"))).res.statusCode, 200);
  assert.equal((await call("POST", "/v1/memories", user, memoryBody())).res.statusCode, 201);

  const mod = actor("moderator");
  for (let n = 0; n < 4; n++) assert.equal((await call("POST", "/v1/memories", mod, memoryBody())).res.statusCode, 201);
});

test("a visitor submits at most 10 memories per rolling day; deleted ones still count; a burst cannot get past", async () => {
  const user = actor();
  const mod = actor("moderator");
  const submit = () => call<OwnMemory>("POST", "/v1/memories", user, memoryBody());
  // Approved or deleted at once, so the pending limit never stands in the way.
  for (let n = 0; n < 10; n++) {
    const created = await submit();
    assert.equal(created.res.statusCode, 201, `memory ${n + 1}`);
    if (n % 2 === 0) await remove(`/v1/me/memories/${created.body.id}`, user);
    else await decide(created.body.id, { status: "approved" }, mod);
  }
  const over = await call<ErrorBody>("POST", "/v1/memories", user, memoryBody());
  assert.equal(over.res.statusCode, 429);
  assert.match(over.body.error.message, /en fazla 10 anı/);
  assert.equal(await storedBy(user.id), 5);

  // The window rolls: once a submission is a day old, one more fits.
  const [oldest] = await db
    .select({ id: auditLog.id })
    .from(auditLog)
    .where(and(eq(auditLog.actorId, user.id), eq(auditLog.action, "memory.create")))
    .orderBy(asc(auditLog.id))
    .limit(1);
  assert.ok(oldest);
  await db.update(auditLog).set({ at: new Date(Date.now() - 25 * 3_600_000) }).where(eq(auditLog.id, oldest.id));
  assert.equal((await submit()).res.statusCode, 201);

  // Parallel submissions are counted one after the other.
  const burster = actor();
  const codes = (await Promise.all(Array.from({ length: 5 }, () => call("POST", "/v1/memories", burster, memoryBody())))).map((r) => r.res.statusCode);
  assert.deepEqual(codes.sort(), [201, 201, 201, 429, 429]);
});

test("the sweep deletes a visitor's photo no memory uses after a day; attached, young, staff, former-staff and seed photos stay", async () => {
  const visitor = actor();
  const staff = actor("editor");
  await db.insert(staffMembers).values({ userId: staff.id, email: "editor@akar.test", role: "editor", grantedBy: "seed" });
  const dayOld = new Date(Date.now() - 25 * 3_600_000);

  const orphan = await storedPhoto(visitor.id, { createdAt: dayOld });
  const attached = await storedPhoto(visitor.id, { createdAt: dayOld });
  await seedMemory({ status: "approved", authorId: visitor.id, mediaId: attached.id });
  const young = await storedPhoto(visitor.id);
  const staffOwn = await storedPhoto(staff.id, { createdAt: dayOld });
  const seed = await storedPhoto(null, { createdAt: dayOld });
  // An editor's library upload (audited `media.create`) stays after the editor's staff role is revoked.
  const formerEditor = actor();
  const library = await storedPhoto(formerEditor.id, { createdAt: dayOld });
  await db.insert(auditLog).values({ actorId: formerEditor.id, action: "media.create", entityType: "media", entityId: library.id });
  // The upload that produced the orphan keeps its row (it counts toward the daily quota), only unlinked.
  await db.insert(mediaUploads).values({
    id: `upload-${orphan.id}`,
    ownerId: visitor.id,
    kind: "photo",
    contentType: "image/jpeg",
    maxBytes: 5_000_000,
    storageKey: `photo/2026/10/upload-${orphan.id}.jpg`,
    status: "completed",
    mediaId: orphan.id,
    expiresAt: dayOld,
  });

  assert.equal(await sweepUnattachedPhotos({ db, storage }), 1);
  assert.ok(await photoGone(orphan));
  for (const kept of [attached, young, staffOwn, seed, library]) {
    assert.equal(await photoGone(kept), false, kept.id);
    assert.ok(await storage.media.head(kept.storageKey), kept.id);
  }
  const [upload] = await db.select({ mediaId: mediaUploads.mediaId }).from(mediaUploads).where(eq(mediaUploads.id, `upload-${orphan.id}`));
  assert.deepEqual(upload, { mediaId: null });
  assert.equal(await sweepUnattachedPhotos({ db, storage }), 0);
});

test("one failed object delete does not strand the rest of the sweep: every key is tried, then the run reports the failure", async () => {
  const visitor = actor();
  const dayOld = new Date(Date.now() - 25 * 3_600_000);
  const photos = [await storedPhoto(visitor.id, { createdAt: dayOld }), await storedPhoto(visitor.id, { createdAt: dayOld }), await storedPhoto(visitor.id, { createdAt: dayOld })];
  const broken = photos[0]!.storageKey;
  const flaky = new Proxy(storage.media, {
    get: (target, prop, receiver) =>
      prop === "delete"
        ? async (key: string) => {
            if (key === broken) throw new Error("S3 geçici hata");
            return target.delete(key);
          }
        : Reflect.get(target, prop, receiver),
  });

  await assert.rejects(sweepUnattachedPhotos({ db, storage: { uploads: storage.uploads, media: flaky } }), new RegExp(broken));
  for (const photo of photos.slice(1)) assert.ok(await photoGone(photo), photo.id);
  assert.ok(await storage.media.head(broken), "the failed one is an orphaned object; its row is gone");
});

test("a removal that waited for a memory being attached to the same photo sees it after the wait and keeps the photo", async () => {
  const author = actor();
  const photo = await storedPhoto(author.id);
  const first = await seedMemory({ status: "pending", authorId: author.id, mediaId: photo.id });

  // A second memory is being attached to the photo, as `createMemory` does (FOR SHARE, then insert), and commits late.
  let commit!: () => void;
  let locked!: () => void;
  const holding = new Promise<void>((resolve) => (locked = resolve));
  const attaching = db.transaction(async (tx) => {
    await tx.select({ id: media.id }).from(media).where(eq(media.id, photo.id)).for("share");
    await tx.insert(memories).values({
      id: "mem-race-second",
      siteId: SITE,
      authorId: author.id,
      authorName: "Ayşe",
      text: "İkinci",
      mediaId: photo.id,
      status: "pending",
      kvkkConsentAt: new Date(),
      kvkkTextVersion: "kvkk-v1",
    });
    locked();
    await new Promise<void>((resolve) => (commit = resolve));
  });
  await holding;

  const removal = remove(`/v1/me/memories/${first}`, author);
  // Wait until the removal is actually blocked on the photo's row lock (the condition, not a guessed delay).
  const lockWaiters = async () =>
    (await db.execute<{ n: number }>(sql`select count(*)::int as n from pg_stat_activity where wait_event_type = 'Lock' and datname = current_database()`)).rows[0]?.n ?? 0;
  while ((await lockWaiters()) === 0) await new Promise((resolve) => setImmediate(resolve));
  commit();
  await attaching;

  assert.equal((await removal).statusCode, 204, "no foreign-key 500");
  assert.equal(await photoGone(photo), false, "the second memory still uses it");
  assert.equal((await db.select({ mediaId: memories.mediaId }).from(memories).where(eq(memories.id, "mem-race-second")))[0]?.mediaId, photo.id);
});
