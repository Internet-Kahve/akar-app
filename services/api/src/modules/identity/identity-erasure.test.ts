import type { HeritageRoute, HeritageSite } from "@akar/domain";
import { eq, sql } from "drizzle-orm";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test, type TestContext } from "node:test";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import type { App } from "../../app.ts";
import type { Db } from "../../db/client.ts";
import {
  auditLog,
  deletedAccounts,
  idempotencyKeys,
  media,
  mediaUploads,
  uploadDeletions,
  memories,
  memoryReports,
  pointEvents,
  profiles,
  quizProgress,
  quizzes,
  savedSites,
  staffInvites,
  staffMembers,
  storyProgress,
  userBadges,
  userRouteStops,
} from "../../db/schema/index.ts";
import { loadCatalog } from "../../db/seed.ts";
import type { AuthVerifier } from "../../platform/auth.ts";
import { startTestApp } from "../../test/harness.ts";
import { createFsStorage, type FsStorage } from "../media/storage-fs.ts";
import { drainMediaDeletions } from "../media/service.ts";
import { identityRoutes } from "./routes.ts";
import { createJwksVerifier } from "./verifier.ts";

const ISSUER = "https://auth.akar.test/auth/v1";
const AUDIENCE = "authenticated";
const KID = "akar-test-key";
const SUPABASE_URL = "http://supabase.test";
const SERVICE_KEY = "service-role-test-key";
const SITE = "ulu-cami";
const ROUTE = "hanlar";
const QUIZ = "ulu-cami-q1";

const keys = await generateKeyPair("ES256");
const jwks = createLocalJWKSet({ keys: [{ ...(await exportJWK(keys.publicKey)), kid: KID, alg: "ES256", use: "sig" }] });

const site: HeritageSite = {
  id: SITE,
  name: "Ulu Cami",
  city: "Bursa",
  district: "Hanlar Bölgesi",
  year: "1400",
  architect: "—",
  kind: "cami",
  coordinates: [29.06, 40.18],
  minutes: 2,
  description: "açıklama",
  status: "published",
  stories: [{ id: `${SITE}-s1`, title: "Başlık", text: "Metin", simple: "Metin", trust: "representative" }],
  source: "test",
  tier: "Tier 2",
};
const route: HeritageRoute = {
  id: ROUTE,
  name: "Hanlar",
  description: "açıklama",
  siteIds: [SITE],
  minutes: 30,
  distance: "1 km",
  theme: "test",
  status: "published",
};

let app: App;
let db: Db;
let stop: (() => Promise<void>) | undefined;
let verifier: AuthVerifier | undefined;
let storage: { uploads: FsStorage; media: FsStorage };
let root: string;

before(async () => {
  root = await mkdtemp(join(tmpdir(), "akar-erasure-"));
  const links = { uploadBaseUrl: "http://api.akar.test", signingSecret: "test-signing-secret-0123456789abcdef" };
  storage = {
    uploads: createFsStorage({ ...links, root: join(root, "uploads") }),
    media: createFsStorage({ ...links, root: join(root, "media"), publicBaseUrl: "https://cdn.akar.test/media" }),
  };
  // The real verifier: an erased account's token is refused there.
  const auth: AuthVerifier = { verify: (jwt) => verifier!.verify(jwt) };
  ({ app, stop } = await startTestApp({
    auth,
    storage,
    register: [identityRoutes],
    env: { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY },
  }));
  db = app.deps.db;
  verifier = createJwksVerifier({ jwks, issuer: ISSUER, audience: AUDIENCE, db });
  await loadCatalog(db, { sites: [site], routes: [route] });
  await db.insert(quizzes).values({ id: QUIZ, siteId: SITE, question: "Soru", options: ["A", "B", "C"], trust: "verified" });
});
after(async () => {
  await stop?.();
  await rm(root, { recursive: true, force: true });
});

async function login(sub: string, email = `${sub}@akar.test`): Promise<Record<string, string>> {
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({ role: "authenticated", email })
    .setProtectedHeader({ alg: "ES256", kid: KID })
    .setIssuedAt(now - 5)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(sub)
    .setExpirationTime(now + 3600)
    .sign(keys.privateKey);
  return { authorization: `Bearer ${jwt}` };
}

const call = (method: "GET" | "DELETE", url: string, headers: Record<string, string> = {}) => app.inject({ method, url, headers });

type Upstream = { url: string; method: string | undefined; apikey: string | null };

/** Stands in for the Supabase admin API; `respond` answers every call. */
function mockSupabase(t: TestContext, respond: () => Response): Upstream[] {
  const calls: Upstream[] = [];
  t.mock.method(globalThis, "fetch", async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), method: init?.method, apikey: new Headers(init?.headers).get("apikey") });
    return respond();
  });
  return calls;
}

/** A photo uploaded by `owner`: media row + object in the public bucket, and its upload ticket + private object. */
async function photo(owner: string): Promise<{ id: string; key: string; uploadKey: string }> {
  const id = randomUUID();
  const key = `photo/2026/10/${id}.jpg`;
  const uploadKey = `photo/2026/10/${randomUUID()}.jpg`;
  await storage.media.put(key, Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1]), "image/jpeg");
  await storage.uploads.put(uploadKey, Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1]), "image/jpeg");
  await db.insert(media).values({
    id,
    kind: "photo",
    mime: "image/jpeg",
    url: storage.media.publicUrl(key),
    license: "user",
    trust: "representative",
    storageKey: key,
    uploadedBy: owner,
  });
  await db.insert(mediaUploads).values({
    id: randomUUID(),
    ownerId: owner,
    kind: "photo",
    contentType: "image/jpeg",
    maxBytes: 5_000_000,
    storageKey: uploadKey,
    status: "completed",
    mediaId: id,
    expiresAt: new Date(Date.now() + 600_000),
  });
  return { id, key, uploadKey };
}

async function memory(author: string, status: "pending" | "approved", mediaId: string | null = null): Promise<string> {
  const id = randomUUID();
  await db.insert(memories).values({
    id,
    siteId: SITE,
    authorId: author,
    authorName: "Ad",
    text: `Anı metni ${id}`,
    mediaId,
    status,
    kvkkConsentAt: new Date(),
    kvkkTextVersion: "v1",
  });
  return id;
}

/** Everything a user leaves behind in every table of the module owners; returns the user's uploaded photos. */
async function fullAccount(userId: string, other: string) {
  const attached = await photo(userId);
  const loose = await photo(userId);
  const own = [await memory(userId, "approved", attached.id), await memory(userId, "pending")];
  const theirs = await memory(other, "approved");
  await db.insert(memoryReports).values([
    { id: randomUUID(), memoryId: theirs, reporterId: userId, reason: "uygunsuz" },
    { id: randomUUID(), memoryId: own[0]!, reporterId: other, reason: "uygunsuz" },
  ]);
  await db.insert(pointEvents).values({ userId, action: "memory.approved", subjectId: own[0]!, points: 25 });
  await db.insert(savedSites).values({ userId, siteId: SITE });
  await db.insert(userRouteStops).values({ userId, siteId: SITE, position: 0 });
  await db.insert(storyProgress).values({ userId, siteId: SITE, lastBlock: 0 });
  await db.insert(quizProgress).values({ playerId: userId, quizId: QUIZ, wrongAttempts: 1 });
  await db.insert(userBadges).values({ userId, routeId: ROUTE });
  await db.insert(profiles).values({ userId, displayName: "Ayşe" });
  // A former editor's used invite holds their address.
  await db.insert(staffInvites).values({ id: randomUUID(), email: `${userId}@akar.test`, role: "editor", invitedBy: "admin-x", userId, revokedAt: new Date() });
  await db.insert(idempotencyKeys).values({ actorId: userId, key: "eski", requestHash: "h", statusCode: 201, responseBody: { text: "Anı metni" } });
  return { photos: [attached, loose], own, theirs };
}

/** Every public table row (as JSON) that mentions `id`, by table. */
async function traces(id: string): Promise<Record<string, number>> {
  const tables = await db.execute<{ table_name: string }>(
    sql`select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' and table_name <> 'spatial_ref_sys'`,
  );
  const found: Record<string, number> = {};
  for (const { table_name } of tables.rows) {
    const { rows } = await db.execute<{ n: number }>(
      sql`select count(*)::int as n from ${sql.identifier(table_name)} t where to_jsonb(t)::text like ${`%${id}%`}`,
    );
    if ((rows[0]?.n ?? 0) > 0) found[table_name] = rows[0]!.n;
  }
  return found;
}

test("DELETE /v1/me erases every row and object of the account, deletes the Supabase user, and its token stops working", async (t) => {
  const userId = randomUUID();
  const other = randomUUID();
  const { photos, theirs } = await fullAccount(userId, other);
  const upstream = mockSupabase(t, () => Response.json({}));
  const headers = await login(userId);

  const res = await call("DELETE", "/v1/me", headers);
  assert.equal(res.statusCode, 204, res.body);
  assert.deepEqual(upstream, [{ url: `${SUPABASE_URL}/auth/v1/admin/users/${userId}`, method: "DELETE", apikey: SERVICE_KEY }]);

  // Only the bare id is left: the erasure mark and the audit history (no text, no address).
  assert.deepEqual(await traces(userId), { audit_log: 1, deleted_accounts: 1 });
  const [audit] = await db.select().from(auditLog).where(eq(auditLog.entityId, userId));
  assert.deepEqual(
    { actor: audit?.actorId, action: audit?.action, before: audit?.before },
    { actor: userId, action: "account.delete", before: { byUser: true, memories: 2, reports: 1 } },
  );
  for (const p of photos) {
    assert.equal(await storage.media.head(p.key), null, "published photo deleted");
    assert.equal(await storage.uploads.head(p.uploadKey), null, "private upload deleted");
  }
  // The other user's memory stays; only the erased user's report on it went.
  assert.equal((await db.select().from(memories).where(eq(memories.id, theirs))).length, 1);
  assert.equal((await db.select().from(memoryReports).where(eq(memoryReports.memoryId, theirs))).length, 0);

  assert.equal((await call("GET", "/v1/me", headers)).statusCode, 401, "the still-valid token is refused");
  assert.equal((await call("DELETE", "/v1/me", headers)).statusCode, 401);
  assert.equal(upstream.length, 1);
});

test("when Supabase refuses, nothing is erased (502) and the account keeps working", async (t) => {
  const userId = randomUUID();
  await fullAccount(userId, randomUUID());
  const before = await traces(userId);
  mockSupabase(t, () => Response.json({ msg: "boom" }, { status: 500 }));
  const headers = await login(userId);

  const res = await call("DELETE", "/v1/me", headers);
  assert.equal(res.statusCode, 502, res.body);
  assert.deepEqual(await traces(userId), before);
  assert.equal((await db.select().from(deletedAccounts).where(eq(deletedAccounts.userId, userId))).length, 0);
  assert.equal((await call("GET", "/v1/me", headers)).statusCode, 200);
});

test("staff accounts cannot be erased until their role is removed; only admins erase other accounts", async (t) => {
  const upstream = mockSupabase(t, () => new Response(null, { status: 404 }));
  const admin = randomUUID();
  const moderator = randomUUID();
  const target = randomUUID();
  await db.insert(staffMembers).values([
    { userId: admin, email: `${admin}@akar.test`, role: "admin", grantedBy: "seed" },
    { userId: moderator, email: `${moderator}@akar.test`, role: "moderator", grantedBy: "seed" },
  ]);
  await fullAccount(target, randomUUID());
  const asAdmin = await login(admin);

  assert.equal((await call("DELETE", "/v1/me", asAdmin)).statusCode, 409);
  assert.equal((await call("DELETE", "/v1/me", await login(moderator))).statusCode, 409);
  assert.equal((await call("DELETE", `/v1/admin/users/${moderator}`, asAdmin)).statusCode, 409);
  assert.equal((await call("DELETE", `/v1/admin/users/${target}`, await login(moderator))).statusCode, 403);
  assert.equal((await call("DELETE", `/v1/admin/users/${target}`, await login(randomUUID()))).statusCode, 403);
  assert.equal((await call("DELETE", "/v1/admin/users/not-a-uuid", asAdmin)).statusCode, 400);
  assert.deepEqual(upstream, [], "nothing reached Supabase");
  assert.equal((await db.select().from(staffMembers)).length, 2);

  // Supabase no longer knowing the user (404) counts as deleted.
  assert.equal((await call("DELETE", `/v1/admin/users/${target}`, asAdmin)).statusCode, 204);
  assert.deepEqual(await traces(target), { audit_log: 1, deleted_accounts: 1 });
  const [audit] = await db.select().from(auditLog).where(eq(auditLog.entityId, target));
  assert.deepEqual({ actor: audit?.actorId, byUser: (audit?.before as { byUser: boolean }).byUser }, { actor: admin, byUser: false });
  assert.equal((await call("GET", "/v1/me", await login(target))).statusCode, 401);
  assert.equal((await call("DELETE", `/v1/admin/users/${target}`, asAdmin)).statusCode, 204, "erasing again is harmless");
});


test("missing storage cannot delete Auth before rolling back account data", async (t) => {
  const userId = randomUUID();
  await photo(userId);
  const upstream = mockSupabase(t, () => new Response(null, { status: 200 }));
  const before = await traces(userId);
  const configured = app.deps.storage;
  app.deps.storage = null;
  try {
    assert.equal((await call("DELETE", "/v1/me", await login(userId))).statusCode, 503);
    assert.deepEqual(upstream, []);
    assert.deepEqual(await traces(userId), before);
  } finally { app.deps.storage = configured; }
});

test("private upload cleanup survives failures and replay until the signed link expires", async (t) => {
  const userId = randomUUID();
  const p = await photo(userId);
  mockSupabase(t, () => new Response(null, { status: 200 }));
  const fail = t.mock.method(storage.uploads, "delete", async () => { throw new Error("storage offline"); });
  assert.equal((await call("DELETE", "/v1/me", await login(userId))).statusCode, 204);
  const [queued] = await db.select().from(uploadDeletions).where(eq(uploadDeletions.storageKey, p.uploadKey));
  assert.ok(queued && queued.nextAttemptAt.getTime() > Date.now() + 600_000);
  fail.mock.restore();
  // A still-valid presigned PUT may recreate the object after the immediate delete.
  await storage.uploads.put(p.uploadKey, Buffer.from("replayed"), "image/jpeg");
  await drainMediaDeletions({ db, storage });
  assert.ok(await storage.uploads.head(p.uploadKey), "not due while the link can still write");
  await db.update(uploadDeletions).set({ nextAttemptAt: new Date(0) }).where(eq(uploadDeletions.storageKey, p.uploadKey));
  const retryFail = t.mock.method(storage.uploads, "delete", async () => { throw new Error("still offline"); });
  await drainMediaDeletions({ db, storage });
  const [retry] = await db.select().from(uploadDeletions).where(eq(uploadDeletions.storageKey, p.uploadKey));
  assert.equal(retry?.attempts, 1);
  retryFail.mock.restore();
  await db.update(uploadDeletions).set({ nextAttemptAt: new Date(0) }).where(eq(uploadDeletions.storageKey, p.uploadKey));
  await drainMediaDeletions({ db, storage });
  assert.equal(await storage.uploads.head(p.uploadKey), null);
  assert.equal((await db.select().from(uploadDeletions).where(eq(uploadDeletions.storageKey, p.uploadKey))).length, 0);
});
