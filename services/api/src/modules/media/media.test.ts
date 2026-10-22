import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, beforeEach, test } from "node:test";
import { setTimeout as sleep } from "node:timers/promises";
import { and, count, eq, getTableName, sql } from "drizzle-orm";
import type { LightMyRequestResponse } from "fastify";
import type { App } from "../../app.ts";
import { auditLog, media, mediaUploads, sources } from "../../db/schema/index.ts";
import type { ErrorBody } from "../../errors.ts";
import type { AuthUser } from "../../platform/auth.ts";
import type { InlineJobQueue } from "../../platform/jobs.ts";
import { authHeader } from "../../test/auth.ts";
import { startTestApp } from "../../test/harness.ts";
import { MEDIA_LIMITS } from "./magic.ts";
import { mediaRoutes } from "./routes.ts";
import type { MediaItem, UploadTicket } from "./schemas.ts";
import { completeUpload, CONTRIBUTOR_LICENSE, DAILY_UPLOAD_QUOTA, expireUploads, MAX_OPEN_UPLOADS, MEDIA_REFERENCES } from "./service.ts";
import { createFsStorage, type FsStorage } from "./storage-fs.ts";
import { createS3Storage } from "./storage-s3.ts";

// A visitor gets at most DAILY_UPLOAD_QUOTA tickets a day, so every test starts with fresh visitors.
let visitorSeq = 0;
let visitor: AuthUser;
let stranger: AuthUser;
let sweeper: AuthUser;
beforeEach(() => {
  const n = ++visitorSeq;
  visitor = { id: `visitor-${n}`, role: "user" };
  stranger = { id: `stranger-${n}`, role: "user" };
  sweeper = { id: `sweeper-${n}`, role: "user" };
});
const moderator: AuthUser = { id: "moderator-1", role: "moderator" };
const editor: AuthUser = { id: "editor-1", role: "editor" };

// ── fixtures: just enough bytes for the magic-number checks ──────────────────

const fill = (bytes: number) => Buffer.alloc(bytes, 7);
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), fill(60)]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), fill(60)]);
const MP3 = Buffer.concat([Buffer.from([0xff, 0xfb, 0x90, 0x00]), fill(60)]);

/** A GLB with only a JSON chunk (space-padded to 4 bytes, as the spec says); a string is used as the raw JSON text. */
function glb(gltf: object | string, version = 2): Buffer {
  const text = Buffer.from(typeof gltf === "string" ? gltf : JSON.stringify(gltf));
  const json = Buffer.concat([text, Buffer.alloc((4 - (text.length % 4)) % 4, 0x20)]);
  const header = Buffer.alloc(20);
  header.write("glTF", 0, "latin1");
  header.writeUInt32LE(version, 4);
  header.writeUInt32LE(header.length + json.length, 8);
  header.writeUInt32LE(json.length, 12);
  header.write("JSON", 16, "latin1");
  return Buffer.concat([header, json]);
}

// ── app ──────────────────────────────────────────────────────────────────────

let app: App;
let jobs: InlineJobQueue;
let storage: { uploads: FsStorage; media: FsStorage };
let root: string;
let stop: (() => Promise<void>) | undefined;

before(async () => {
  root = await mkdtemp(join(tmpdir(), "akar-media-"));
  const links = { uploadBaseUrl: "http://api.akar.test", signingSecret: "test-signing-secret-0123456789abcdef" };
  // As on the server: clients write to a bucket without a public URL; only the media bucket is served.
  storage = {
    uploads: createFsStorage({ ...links, root: join(root, "uploads") }),
    media: createFsStorage({ ...links, root: join(root, "media"), publicBaseUrl: "https://cdn.akar.test/media" }),
  };
  ({ app, jobs, stop } = await startTestApp({ register: [mediaRoutes], storage }));
});
after(async () => {
  await stop?.();
  await rm(root, { recursive: true, force: true });
});

const requestUpload = (user: AuthUser | null, body: object, headers: Record<string, string> = {}) =>
  app.inject({ method: "POST", url: "/v1/media/uploads", headers: { ...(user && authHeader(user)), ...headers }, payload: body });

const complete = (user: AuthUser | null, uploadId: string, body: object, headers: Record<string, string> = {}) =>
  app.inject({
    method: "POST",
    url: `/v1/media/uploads/${uploadId}/complete`,
    headers: { ...(user && authHeader(user)), ...headers },
    payload: body,
  });

/** Request a ticket and PUT the file to its link, like a client would. */
async function upload(user: AuthUser, kind: string, contentType: string, file: Buffer): Promise<UploadTicket> {
  const res = await requestUpload(user, { kind, contentType, bytes: file.length });
  assert.equal(res.statusCode, 201, res.body);
  const ticket = res.json<UploadTicket>();
  const put = await app.inject({ method: "PUT", url: new URL(ticket.url).pathname, headers: ticket.headers, payload: file });
  assert.equal(put.statusCode, 204, put.body);
  return ticket;
}

/** What `complete` needs from this user: editors state license and trust, visitors only the alt text. */
const metadataFor = (user: AuthUser) =>
  user.role === "editor" ? { alt: "Ulu Cami", license: "CC BY 4.0", trust: "representative" } : { alt: "Ulu Cami" };

const uploadRow = async (uploadId: string) => {
  const [row] = await app.deps.db.select().from(mediaUploads).where(eq(mediaUploads.id, uploadId));
  assert.ok(row, "upload row exists");
  return row;
};

const mediaRow = async (id: string) => {
  const [row] = await app.deps.db.select().from(media).where(eq(media.id, id));
  assert.ok(row, "media row exists");
  return row;
};

const mediaCount = async () => (await app.deps.db.select({ n: count() }).from(media))[0]?.n ?? 0;

/** PUT a file to a ticket's link, as a client does for its first upload or, later, again. */
const putTo = (ticket: UploadTicket, file: Buffer) =>
  app.inject({ method: "PUT", url: new URL(ticket.url).pathname, headers: ticket.headers, payload: file });

const errorOf = (res: { json<T>(): T }) => res.json<ErrorBody>().error;

// ── photo flow and what a visitor may set ───────────────────────────────────

test("a visitor's photo goes signed link → PUT → complete; license and trust are set by the server", async () => {
  const ticket = await upload(visitor, "photo", "image/jpeg", JPEG);
  assert.equal(ticket.maxBytes, MEDIA_LIMITS.photo.maxBytes);

  const res = await complete(visitor, ticket.uploadId, { alt: "Han avlusu" });
  assert.equal(res.statusCode, 201, res.body);
  const item = res.json<MediaItem>();
  assert.equal(item.license, CONTRIBUTOR_LICENSE);
  assert.equal(item.trust, "representative");
  assert.equal(item.uploadedBy, visitor.id);
  assert.equal(item.bytes, JPEG.length);
  assert.equal(item.partsStatus, "none");
  assert.match(item.url, /^https:\/\/cdn\.akar\.test\/media\/photo\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.jpg$/);

  const finished = await uploadRow(ticket.uploadId);
  assert.equal(finished.status, "completed");
  assert.equal(finished.mediaId, item.id);
  const { storageKey } = await mediaRow(item.id);
  assert.ok(storageKey);
  assert.deepEqual(await storage.media.head(storageKey), { bytes: JPEG.length, contentType: "image/jpeg" });
});

test("a visitor cannot choose license or trust and must describe the photo; a refused attempt keeps the upload usable", async () => {
  const ticket = await upload(visitor, "photo", "image/png", PNG);

  const forged = await complete(visitor, ticket.uploadId, { alt: "x", trust: "verified", license: "CC0" });
  assert.equal(forged.statusCode, 400);
  assert.deepEqual(Object.keys(errorOf(forged).fieldErrors).sort(), ["license", "trust"]);

  const noAlt = await complete(visitor, ticket.uploadId, {});
  assert.equal(noAlt.statusCode, 400);
  assert.ok(errorOf(noAlt).fieldErrors.alt);

  const ok = await complete(visitor, ticket.uploadId, { alt: "Çeşme" });
  assert.equal(ok.statusCode, 201, ok.body);
  assert.equal(ok.json<MediaItem>().trust, "representative");
});

test("editors must state license and trust, and a given source must exist", async () => {
  const ticket = await upload(editor, "photo", "image/jpeg", JPEG);

  const bare = await complete(editor, ticket.uploadId, { alt: "Kubbe" });
  assert.equal(bare.statusCode, 400);
  assert.deepEqual(Object.keys(errorOf(bare).fieldErrors).sort(), ["license", "trust"]);

  const unknownSource = await complete(editor, ticket.uploadId, { ...metadataFor(editor), sourceId: "no-such-source" });
  assert.equal(unknownSource.statusCode, 400);
  assert.ok(errorOf(unknownSource).fieldErrors.sourceId);

  const ok = await complete(editor, ticket.uploadId, { ...metadataFor(editor), title: "Kubbe" });
  assert.equal(ok.statusCode, 201, ok.body);
  assert.equal(ok.json<MediaItem>().license, "CC BY 4.0");
});

test("completing twice is safe: the same key replays, a plain retry returns the same media, one row exists", async () => {
  const ticket = await upload(visitor, "photo", "image/png", PNG);
  const key = { "idempotency-key": "complete-once" };
  const before = await mediaCount();

  const first = await complete(visitor, ticket.uploadId, { alt: "Çeşme" }, key);
  const replay = await complete(visitor, ticket.uploadId, { alt: "Çeşme" }, key);
  assert.equal(first.statusCode, 201);
  assert.equal(replay.statusCode, 201);
  assert.equal(replay.json<MediaItem>().id, first.json<MediaItem>().id);

  const retry = await complete(visitor, ticket.uploadId, { alt: "Çeşme" });
  assert.equal(retry.statusCode, 200);
  assert.equal(retry.json<MediaItem>().id, first.json<MediaItem>().id);

  assert.equal(await mediaCount(), before + 1, "one row exists");
});

test("requesting an upload with the same Idempotency-Key returns the same ticket, not a second upload", async () => {
  const body = { kind: "photo", contentType: "image/webp", bytes: 1000 };
  const headers = { "idempotency-key": "ticket-once" };
  const first = await requestUpload(visitor, body, headers);
  const replay = await requestUpload(visitor, body, headers);
  assert.equal(first.statusCode, 201);
  assert.equal(replay.json<UploadTicket>().uploadId, first.json<UploadTicket>().uploadId);
});

// ── who may upload ───────────────────────────────────────────────────────────

test("only the uploader can complete an upload, and guests cannot", async () => {
  const ticket = await upload(visitor, "photo", "image/jpeg", JPEG);

  const notTheirs = await complete(stranger, ticket.uploadId, { alt: "x" });
  assert.equal(notTheirs.statusCode, 404);
  assert.equal(errorOf(notTheirs).code, "NOT_FOUND");
  assert.equal((await complete(null, ticket.uploadId, { alt: "x" })).statusCode, 401);
  assert.equal((await requestUpload(null, { kind: "photo", contentType: "image/jpeg", bytes: 10 })).statusCode, 401);

  assert.equal((await uploadRow(ticket.uploadId)).status, "pending");
  assert.equal((await complete(visitor, ticket.uploadId, { alt: "x" })).statusCode, 201);
});

test("3D models and audio are for editors and admins; visitors and moderators get 403", async () => {
  const model = { kind: "model", contentType: "model/gltf-binary", bytes: 100 };
  const audio = { kind: "audio", contentType: "audio/mpeg", bytes: 100 };
  for (const user of [visitor, moderator]) {
    for (const body of [model, audio]) {
      const res = await requestUpload(user, body);
      assert.equal(res.statusCode, 403, `${user.role} ${body.kind}`);
    }
  }
  assert.equal((await requestUpload(editor, model)).statusCode, 201);
  assert.equal((await requestUpload({ id: "admin-1", role: "admin" }, audio)).statusCode, 201);
});

test("types a kind does not allow are refused before any link is issued", async () => {
  for (const [kind, contentType] of [
    ["photo", "image/gif"],
    ["photo", "model/gltf-binary"],
    ["model", "image/png"],
    ["audio", "constructor"],
  ]) {
    const res = await requestUpload(editor, { kind, contentType, bytes: 100 });
    assert.equal(res.statusCode, 415, `${kind} ${contentType}`);
    assert.equal(errorOf(res).code, "UNSUPPORTED_MEDIA_TYPE");
  }
});

// ── content checks on complete ───────────────────────────────────────────────

const mismatches = [
  { name: "a PNG declared as JPEG", user: () => visitor, kind: "photo", type: "image/jpeg", file: PNG },
  { name: "a text file declared as GLB", user: () => editor, kind: "model", type: "model/gltf-binary", file: Buffer.from("this is not a model") },
  { name: "a GLB of version 1 declared as GLB", user: () => editor, kind: "model", type: "model/gltf-binary", file: glb({}, 1) },
  { name: "a PNG declared as MP3", user: () => editor, kind: "audio", type: "audio/mpeg", file: PNG },
];
for (const c of mismatches) {
  test(`${c.name} is refused with 415, its object deleted and the upload marked rejected`, async () => {
    const user = c.user();
    const ticket = await upload(user, c.kind, c.type, c.file);
    const { storageKey } = await uploadRow(ticket.uploadId);
    assert.ok(await storage.uploads.head(storageKey), "the object was uploaded");
    const before = await mediaCount();

    const res = await complete(user, ticket.uploadId, metadataFor(user));
    assert.equal(res.statusCode, 415, res.body);
    assert.equal(errorOf(res).code, "UNSUPPORTED_MEDIA_TYPE");

    const row = await uploadRow(ticket.uploadId);
    assert.equal(row.status, "rejected");
    assert.ok(row.rejectReason);
    assert.equal(await storage.uploads.head(storageKey), null);
    assert.equal(await mediaCount(), before, "nothing was published");

    // A rejected upload is final.
    assert.equal((await complete(user, ticket.uploadId, metadataFor(user))).statusCode, 409);
  });
}

test("a real MP3, M4A and WebP pass their magic-number checks", async () => {
  const cases = [
    ["audio", "audio/mpeg", MP3],
    ["audio", "audio/mp4", Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from("ftypM4A "), fill(40)])],
    ["photo", "image/webp", Buffer.concat([Buffer.from("RIFF"), Buffer.from([40, 0, 0, 0]), Buffer.from("WEBPVP8 "), fill(40)])],
  ] as const;
  for (const [kind, type, file] of cases) {
    const ticket = await upload(editor, kind, type, file);
    const res = await complete(editor, ticket.uploadId, metadataFor(editor));
    assert.equal(res.statusCode, 201, `${type}: ${res.body}`);
  }
});

// ── size limits ──────────────────────────────────────────────────────────────

test("a file over 5 MB is refused up front, and the signed link itself refuses a body over its cap", async () => {
  const cap = MEDIA_LIMITS.photo.maxBytes;
  const declared = await requestUpload(visitor, { kind: "photo", contentType: "image/png", bytes: cap + 1 });
  assert.equal(declared.statusCode, 413);
  assert.equal(errorOf(declared).code, "PAYLOAD_TOO_LARGE");

  const ticket = (await requestUpload(visitor, { kind: "photo", contentType: "image/png", bytes: 100 })).json<UploadTicket>();
  const { storageKey } = await uploadRow(ticket.uploadId);
  const oversized = Buffer.concat([PNG, fill(cap + 1 - PNG.length)]);
  const put = await app.inject({ method: "PUT", url: new URL(ticket.url).pathname, headers: ticket.headers, payload: oversized });
  assert.equal(put.statusCode, 413);
  assert.equal(errorOf(put).code, "PAYLOAD_TOO_LARGE");
  assert.equal(await storage.uploads.head(storageKey), null);
});

test("complete re-checks the stored size, because a presigned S3 PUT cannot cap it", async () => {
  const ticket = (await requestUpload(visitor, { kind: "photo", contentType: "image/png", bytes: 100 })).json<UploadTicket>();
  const { storageKey } = await uploadRow(ticket.uploadId);
  await storage.uploads.put(storageKey, Buffer.concat([PNG, fill(MEDIA_LIMITS.photo.maxBytes)]), "image/png");

  const res = await complete(visitor, ticket.uploadId, { alt: "x" });
  assert.equal(res.statusCode, 413);
  assert.equal(errorOf(res).code, "PAYLOAD_TOO_LARGE");
  assert.equal((await uploadRow(ticket.uploadId)).status, "rejected");
  assert.equal(await storage.uploads.head(storageKey), null);
});

test("completing before the file arrived is a retryable 409, not a rejection", async () => {
  const ticket = (await requestUpload(visitor, { kind: "photo", contentType: "image/jpeg", bytes: JPEG.length })).json<UploadTicket>();
  const early = await complete(visitor, ticket.uploadId, { alt: "x" });
  assert.equal(early.statusCode, 409);
  assert.equal((await uploadRow(ticket.uploadId)).status, "pending");

  await app.inject({ method: "PUT", url: new URL(ticket.url).pathname, headers: ticket.headers, payload: JPEG });
  assert.equal((await complete(visitor, ticket.uploadId, { alt: "x" })).statusCode, 201);
});

// ── expiry and the filesystem link ───────────────────────────────────────────

test("an expired, forged, mistyped or over-cap upload link, or one no upload asked for, is refused and writes nothing", async () => {
  const key = "photo/2026/10/link-checks.jpg";
  const put = (path: string, type: string, payload: Buffer) =>
    app.inject({ method: "PUT", url: path, headers: { "content-type": type }, payload });

  const expired = await storage.uploads.createUploadUrl(key, { contentType: "image/jpeg", maxBytes: 1000, expiresInSec: -1 });
  assert.equal((await put(new URL(expired.url).pathname, "image/jpeg", JPEG)).statusCode, 403);

  const live = await storage.uploads.createUploadUrl(key, { contentType: "image/jpeg", maxBytes: 1000, expiresInSec: 60 });
  const path = new URL(live.url).pathname;
  assert.equal((await put(path, "image/png", JPEG)).statusCode, 415);
  assert.equal((await put(path, "image/jpeg", fill(2000))).statusCode, 413);

  // Another key under the signature issued for this one.
  const signature = path.split(".").pop();
  const otherKey = Buffer.from(JSON.stringify({ k: "photo/2026/10/other.jpg", t: "image/jpeg", m: 1000, e: 4_000_000_000 })).toString("base64url");
  assert.equal((await put(`/v1/media/uploads/fs/${otherKey}.${signature}`, "image/jpeg", JPEG)).statusCode, 403);

  assert.equal(await storage.uploads.head(key), null);
  assert.equal((await put(path, "image/jpeg", JPEG)).statusCode, 404);
  assert.equal(await storage.uploads.head(key), null);

  await app.deps.db.insert(mediaUploads).values({
    id: randomUUID(),
    ownerId: "visitor-links",
    kind: "photo",
    contentType: "image/jpeg",
    maxBytes: 1000,
    storageKey: key,
    expiresAt: new Date(Date.now() + 60_000),
  });
  assert.equal((await put(path, "image/jpeg", JPEG)).statusCode, 204);
  assert.ok(await storage.uploads.head(key));
});

test("completing after the upload's window closed answers 409 and removes the object", async () => {
  const ticket = await upload(visitor, "photo", "image/jpeg", JPEG);
  await app.deps.db.update(mediaUploads).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(mediaUploads.id, ticket.uploadId));

  const res = await complete(visitor, ticket.uploadId, { alt: "x" });
  assert.equal(res.statusCode, 409);
  const row = await uploadRow(ticket.uploadId);
  assert.equal(row.status, "expired");
  assert.equal(await storage.uploads.head(row.storageKey), null);
});

// ── the bytes that were checked are the bytes that get served ────────────────

test("complete serves the checked bytes from the public media bucket and leaves nothing under the upload key", async () => {
  const ticket = await upload(visitor, "photo", "image/jpeg", JPEG);
  const { storageKey: uploadKey } = await uploadRow(ticket.uploadId);
  assert.ok(await storage.uploads.head(uploadKey), "the client's file waits in the upload bucket");

  const res = await complete(visitor, ticket.uploadId, { alt: "Han avlusu" });
  assert.equal(res.statusCode, 201, res.body);
  const item = res.json<MediaItem>();
  const { storageKey } = await mediaRow(item.id);
  assert.ok(storageKey);

  assert.equal(item.url, storage.media.publicUrl(storageKey));
  assert.deepEqual(await storage.media.read(storageKey), JPEG);
  assert.equal(await storage.uploads.head(uploadKey), null);
});

test("after complete the upload link writes nothing", async () => {
  const ticket = await upload(visitor, "photo", "image/jpeg", JPEG);
  const { storageKey: uploadKey } = await uploadRow(ticket.uploadId);
  assert.equal((await complete(visitor, ticket.uploadId, { alt: "Çeşme" })).statusCode, 201);

  // The link still has minutes left, but its upload is no longer pending.
  const again = await putTo(ticket, fill(500));
  assert.equal(again.statusCode, 409);
  assert.equal(errorOf(again).code, "CONFLICT");
  assert.equal(await storage.uploads.head(uploadKey), null);
});

test("an upload link writes nothing once its upload is rejected or expired", async () => {
  for (const status of ["rejected", "expired"] as const) {
    const ticket = (await requestUpload(visitor, { kind: "photo", contentType: "image/jpeg", bytes: JPEG.length })).json<UploadTicket>();
    await app.deps.db.update(mediaUploads).set({ status }).where(eq(mediaUploads.id, ticket.uploadId));

    assert.equal((await putTo(ticket, JPEG)).statusCode, 409, status);
    assert.equal(await storage.uploads.head((await uploadRow(ticket.uploadId)).storageKey), null, status);
  }
});

test("a PUT that arrives while complete holds the upload waits for it and is refused afterwards", async () => {
  const ticket = await upload(visitor, "photo", "image/jpeg", JPEG);
  const { storageKey } = await uploadRow(ticket.uploadId);
  const held: { put?: Promise<LightMyRequestResponse> } = {};

  await app.deps.db.transaction(async (tx) => {
    // Stands in for a `complete` in mid-work: it has the upload's row and is about to publish.
    await tx.select().from(mediaUploads).where(eq(mediaUploads.id, ticket.uploadId)).for("update");
    held.put = putTo(ticket, fill(500));
    const outcome = await Promise.race([held.put.then(() => "answered"), sleep(300).then(() => "waiting")]);
    assert.equal(outcome, "waiting", "the write queues behind the lock instead of racing the checks");
    await tx.update(mediaUploads).set({ status: "completed" }).where(eq(mediaUploads.id, ticket.uploadId));
  });

  assert.equal((await held.put)?.statusCode, 409);
  assert.deepEqual(await storage.uploads.read(storageKey), JPEG, "the bytes that were checked are untouched");
});

test("complete judges the bytes it reads, not a HEAD answer that a later write has outdated", async () => {
  // HEAD keeps describing the JPEG that was uploaded first.
  const staleHead = { ...storage.uploads, head: async () => ({ bytes: JPEG.length, contentType: "image/jpeg" }) };
  const staleStorage = { uploads: staleHead, media: storage.media };
  const swaps = [
    { name: "grown past the cap", file: Buffer.concat([JPEG, fill(MEDIA_LIMITS.photo.maxBytes)]), status: 413 },
    { name: "no longer a JPEG", file: PNG, status: 415 },
  ];
  for (const swap of swaps) {
    const ticket = await upload(visitor, "photo", "image/jpeg", JPEG);
    const { storageKey } = await uploadRow(ticket.uploadId);
    await storage.uploads.put(storageKey, swap.file, "image/jpeg"); // the write a presigned S3 URL still allows
    const { result } = await app.deps.db.transaction((tx) =>
      completeUpload(tx, { storage: staleStorage, jobs: null, user: visitor, requestId: "stale-head" }, ticket.uploadId, { alt: "x" }),
    );

    assert.equal(result.status, swap.status, swap.name);
    assert.equal((await uploadRow(ticket.uploadId)).status, "rejected", swap.name);
    assert.equal(await storage.uploads.head(storageKey), null, swap.name);
  }
});

// ── open tickets per account ─────────────────────────────────────────────────

const askForTicket = (user: AuthUser) => requestUpload(user, { kind: "photo", contentType: "image/jpeg", bytes: JPEG.length });

test("an account of any role holds at most 10 open upload tickets; a finished or expired one frees its slot", async () => {
  // A moderator: staff have no daily quota, so only the open-ticket cap is at work here.
  const hoarder: AuthUser = { id: "moderator-hoarder", role: "moderator" };
  const tickets: UploadTicket[] = [];
  for (let i = 0; i < MAX_OPEN_UPLOADS; i++) {
    const res = await askForTicket(hoarder);
    assert.equal(res.statusCode, 201, res.body);
    tickets.push(res.json<UploadTicket>());
  }

  const over = await askForTicket(hoarder);
  assert.equal(over.statusCode, 429);
  assert.equal(errorOf(over).code, "RATE_LIMITED");
  assert.equal((await askForTicket(stranger)).statusCode, 201, "the cap is per account");

  const [first, second] = tickets;
  assert.ok(first && second);
  assert.equal((await putTo(first, JPEG)).statusCode, 204);
  assert.equal((await complete(hoarder, first.uploadId, { alt: "Çeşme" })).statusCode, 201);
  assert.equal((await askForTicket(hoarder)).statusCode, 201, "a completed ticket is not open any more");
  assert.equal((await askForTicket(hoarder)).statusCode, 429);

  await app.deps.db.update(mediaUploads).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(mediaUploads.id, second.uploadId));
  assert.equal((await askForTicket(hoarder)).statusCode, 201, "a ticket whose window closed is not open any more");
});

test("a burst of ticket requests cannot get past the cap together", async () => {
  const burster: AuthUser = { id: "visitor-burst", role: "user" };
  const answers = await Promise.all(Array.from({ length: MAX_OPEN_UPLOADS + 5 }, () => askForTicket(burster)));

  const statuses = answers.map((res) => res.statusCode).sort((a, b) => a - b);
  assert.deepEqual(statuses, [...Array<number>(MAX_OPEN_UPLOADS).fill(201), ...Array<number>(5).fill(429)]);
});

test("a visitor gets at most 10 upload tickets per rolling day, finished ones included; staff are exempt", async () => {
  for (let i = 0; i < DAILY_UPLOAD_QUOTA; i++) {
    const ticket = await upload(visitor, "photo", "image/jpeg", JPEG);
    assert.equal((await complete(visitor, ticket.uploadId, { alt: "Avlu" })).statusCode, 201);
  }
  const over = await askForTicket(visitor);
  assert.equal(over.statusCode, 429, "no open ticket, but the day's quota is used up");
  assert.equal(errorOf(over).code, "RATE_LIMITED");
  assert.match(errorOf(over).message, /en fazla 10 fotoğraf/);

  // The window rolls: once one upload is a day old, a new ticket fits again.
  const [oldest] = await app.deps.db.select({ id: mediaUploads.id }).from(mediaUploads).where(eq(mediaUploads.ownerId, visitor.id)).limit(1);
  assert.ok(oldest);
  await app.deps.db.update(mediaUploads).set({ createdAt: new Date(Date.now() - 25 * 3_600_000) }).where(eq(mediaUploads.id, oldest.id));
  assert.equal((await askForTicket(visitor)).statusCode, 201);

  // Staff: past ten finished uploads in a day, the open-ticket cap is the only limit.
  const staff: AuthUser = { id: `moderator-daily-${visitorSeq}`, role: "moderator" };
  for (let i = 0; i <= DAILY_UPLOAD_QUOTA; i++) {
    const ticket = await upload(staff, "photo", "image/jpeg", JPEG);
    assert.equal((await complete(staff, ticket.uploadId, { alt: "Avlu" })).statusCode, 201);
  }
});

test("MEDIA_REFERENCES lists every foreign key that points at media, so a media row in use is never removed", async () => {
  const fks = await app.deps.db.execute<{ table_name: string; column_name: string }>(sql`
    select kcu.table_name, kcu.column_name
    from information_schema.referential_constraints rc
    join information_schema.key_column_usage kcu on kcu.constraint_name = rc.constraint_name and kcu.constraint_schema = rc.constraint_schema
    join information_schema.constraint_column_usage ccu on ccu.constraint_name = rc.unique_constraint_name and ccu.constraint_schema = rc.unique_constraint_schema
    where ccu.table_name = 'media' and ccu.column_name = 'id' and kcu.table_schema = 'public'`);
  const inDatabase = fks.rows.map((r) => `${r.table_name}.${r.column_name}`).filter((c) => c !== "media_uploads.media_id");
  const listed = MEDIA_REFERENCES.map((column) => `${getTableName(column.table)}.${column.name}`);
  assert.deepEqual(listed.sort(), inDatabase.sort());
});

// ── abandoned uploads ────────────────────────────────────────────────────────

/** A ticket of `sweeper`, with its file when given, whose window closed `minutesAgo` minutes ago (negative: still open). */
async function ticketClosedAgo(minutesAgo: number, file: Buffer | null): Promise<UploadTicket> {
  const ticket = file
    ? await upload(sweeper, "photo", "image/jpeg", file)
    : (await askForTicket(sweeper)).json<UploadTicket>();
  await app.deps.db
    .update(mediaUploads)
    .set({ expiresAt: new Date(Date.now() - minutesAgo * 60_000) })
    .where(eq(mediaUploads.id, ticket.uploadId));
  return ticket;
}

test("expireUploads expires pending uploads whose window closed over 5 minutes ago and deletes their objects; a finished upload keeps its status and its published copy", async () => {
  const db = app.deps.db;
  await expireUploads({ db, storage }); // leftovers of earlier tests

  const stale = await ticketClosedAgo(6, JPEG);
  const neverUploaded = await ticketClosedAgo(30, null);
  const justClosed = await ticketClosedAgo(1, JPEG);
  const stillOpen = await ticketClosedAgo(-10, JPEG);
  const finished = await upload(sweeper, "photo", "image/jpeg", JPEG);
  const published = (await complete(sweeper, finished.uploadId, { alt: "Çeşme" })).json<MediaItem>();
  await db.update(mediaUploads).set({ expiresAt: new Date(Date.now() - 2 * 60 * 60_000) }).where(eq(mediaUploads.id, finished.uploadId));

  assert.equal(await expireUploads({ db, storage }), 3, "the two abandoned tickets and the finished upload, whose upload key is emptied too");

  const statuses = await Promise.all([stale, neverUploaded, justClosed, stillOpen, finished].map(async (t) => (await uploadRow(t.uploadId)).status));
  assert.deepEqual(statuses, ["expired", "expired", "pending", "pending", "completed"]);
  const stored = async (t: UploadTicket) => (await storage.uploads.head((await uploadRow(t.uploadId)).storageKey)) !== null;
  assert.deepEqual([await stored(stale), await stored(justClosed), await stored(stillOpen)], [false, true, true]);
  assert.ok(await storage.media.head((await mediaRow(published.id)).storageKey ?? ""), "the published copy of a completed upload stays");

  assert.equal((await complete(sweeper, stale.uploadId, { alt: "x" })).statusCode, 409);
  assert.equal(await expireUploads({ db, storage }), 0, "nothing is left to expire");
});

test("expireUploads handles at most `limit` uploads per run, the oldest first", async () => {
  const db = app.deps.db;
  await expireUploads({ db, storage });
  const older = await ticketClosedAgo(90, null);
  const newer = await ticketClosedAgo(60, null);

  assert.equal(await expireUploads({ db, storage }, { limit: 1 }), 1);
  assert.deepEqual([(await uploadRow(older.uploadId)).status, (await uploadRow(newer.uploadId)).status], ["expired", "pending"]);
  assert.equal(await expireUploads({ db, storage }), 1);
});

test("expireUploads skips an upload that a complete or a PUT is working on", async () => {
  const db = app.deps.db;
  await expireUploads({ db, storage });
  const busy = await ticketClosedAgo(10, JPEG);
  const { storageKey } = await uploadRow(busy.uploadId);
  const run: { swept?: number | "blocked" } = {};

  await db.transaction(async (tx) => {
    await tx.select().from(mediaUploads).where(eq(mediaUploads.id, busy.uploadId)).for("update");
    run.swept = await Promise.race([expireUploads({ db, storage }), sleep(1000).then(() => "blocked" as const)]);
  });

  assert.equal(run.swept, 0);
  assert.equal((await uploadRow(busy.uploadId)).status, "pending");
  assert.ok(await storage.uploads.head(storageKey));
  assert.equal(await expireUploads({ db, storage }), 1, "the next run takes it once it is free");
});

test("a file written to the upload key after complete stays out of the media bucket and is removed once its link is dead", async () => {
  const db = app.deps.db;
  await expireUploads({ db, storage });
  const ticket = await upload(sweeper, "photo", "image/jpeg", JPEG);
  const { storageKey: uploadKey } = await uploadRow(ticket.uploadId);
  const item = (await complete(sweeper, ticket.uploadId, { alt: "Çeşme" })).json<MediaItem>();

  // What a presigned S3 PUT cannot be stopped from doing: until its link runs out, the client can still drop a file at the upload key.
  await storage.uploads.put(uploadKey, fill(500), "image/jpeg");
  assert.equal(await expireUploads({ db, storage }), 0, "the link may still be live");
  assert.ok(await storage.uploads.head(uploadKey));

  await db.update(mediaUploads).set({ expiresAt: new Date(Date.now() - 6 * 60_000) }).where(eq(mediaUploads.id, ticket.uploadId));
  assert.equal(await expireUploads({ db, storage }), 1);
  assert.equal(await storage.uploads.head(uploadKey), null);
  assert.equal(await storage.media.head(uploadKey), null, "it never reached the public bucket");
  assert.equal((await uploadRow(ticket.uploadId)).status, "completed");

  const { storageKey } = await mediaRow(item.id);
  assert.ok(storageKey);
  assert.deepEqual(await storage.media.read(storageKey), JPEG, "the published copy is untouched");
  assert.equal(await expireUploads({ db, storage }), 0, "an upload is swept once");
});

// ── 3D models ────────────────────────────────────────────────────────────────

test("a GLB's part names are extracted by the background job: distinct, non-empty, nodes then meshes", async () => {
  const file = glb({
    asset: { version: "2.0" },
    nodes: [{ name: "Kubbe" }, { name: "Şadırvan" }, { name: "  " }, { mesh: 0 }, { name: "Kubbe" }],
    meshes: [{ name: "Gövde" }, { name: "Kubbe" }, {}],
  });
  const ticket = await upload(editor, "model", "model/gltf-binary", file);
  const res = await complete(editor, ticket.uploadId, { ...metadataFor(editor), title: "Ulu Cami" });
  assert.equal(res.statusCode, 201, res.body);
  const created = res.json<MediaItem>();
  assert.equal(created.partsStatus, "pending");
  assert.deepEqual(created.parts, []);

  await jobs.drain();
  const [row] = await app.deps.db.select().from(media).where(eq(media.id, created.id));
  assert.equal(row?.partsStatus, "done");
  assert.deepEqual(row?.parts, ["Kubbe", "Şadırvan", "Gövde"]);

  const [audit] = await app.deps.db.select().from(auditLog).where(and(eq(auditLog.entityId, created.id), eq(auditLog.action, "media.create")));
  assert.equal(audit?.actorId, editor.id);
});

test("a GLB whose JSON chunk is broken ends as failed instead of staying pending", async () => {
  const ticket = await upload(editor, "model", "model/gltf-binary", glb('{"nodes": [{"name": "Kub'));
  const res = await complete(editor, ticket.uploadId, metadataFor(editor));
  assert.equal(res.statusCode, 201, res.body);

  await jobs.drain();
  const [row] = await app.deps.db.select().from(media).where(eq(media.id, res.json<MediaItem>().id));
  assert.equal(row?.partsStatus, "failed");
  assert.deepEqual(row?.parts, []);
});

// ── the panel ────────────────────────────────────────────────────────────────

test("the media library is editor-only and pages newest first without repeats or gaps, even inside one millisecond", async () => {
  const db = app.deps.db;
  // Microsecond-apart rows (a JS Date cursor would collapse them) and a tie, all older than everything else.
  const stamps = {
    "lib-a": "2001-01-01 00:00:00.000100+00",
    "lib-b": "2001-01-01 00:00:00.000200+00",
    "lib-c": "2001-01-01 00:00:00.000200+00",
    "lib-d": "2001-01-01 00:00:00.000300+00",
  };
  for (const [id, stamp] of Object.entries(stamps)) {
    await db.insert(media).values({ id, kind: "photo", mime: "image/jpeg", url: `https://cdn.akar.test/${id}.jpg`, license: "CC0", trust: "verified" });
    await db.execute(sql`update media set created_at = ${stamp}::timestamptz where id = ${id}`);
  }

  for (const [user, status] of [[null, 401], [visitor, 403], [moderator, 403]] as const) {
    const res = await app.inject({ method: "GET", url: "/v1/admin/media", headers: user ? authHeader(user) : {} });
    assert.equal(res.statusCode, status);
  }

  // One row per page, so every row boundary (the b/c tie included) is a cursor boundary.
  const seen: string[] = [];
  let cursor: string | null = null;
  do {
    const url: string = `/v1/admin/media?limit=1${cursor ? `&cursor=${cursor}` : ""}`;
    const res = await app.inject({ method: "GET", url, headers: authHeader(editor) });
    assert.equal(res.statusCode, 200, res.body);
    const page: { items: MediaItem[]; nextCursor: string | null } = res.json();
    seen.push(...page.items.map((i) => i.id));
    cursor = page.nextCursor;
  } while (cursor);

  const [counted] = await db.select({ total: sql<number>`count(*)::int` }).from(media);
  assert.equal(new Set(seen).size, seen.length, "no row repeated");
  assert.equal(seen.length, counted?.total, "no row skipped");
  assert.deepEqual(seen.filter((id) => id.startsWith("lib-")), ["lib-d", "lib-c", "lib-b", "lib-a"]);

  const onlyModels = await app.inject({ method: "GET", url: "/v1/admin/media?kind=model&limit=100", headers: authHeader(editor) });
  assert.ok(onlyModels.json<{ items: MediaItem[] }>().items.every((i) => i.kind === "model"));

  const garbage = Buffer.from(JSON.stringify({ t: "yesterday", i: "x" })).toString("base64url");
  const forged = await app.inject({ method: "GET", url: `/v1/admin/media?cursor=${garbage}`, headers: authHeader(editor) });
  assert.equal(forged.statusCode, 400);
  assert.equal(errorOf(forged).code, "INVALID_CURSOR");
});

test("editors update a media's info once, it is audited with before and after, and visitors cannot", async () => {
  const db = app.deps.db;
  await db.insert(sources).values({ id: "src-media-test", title: "Vakıf envanteri", kind: "archive", trust: "verified" });
  await db.insert(media).values({
    id: "patch-me",
    kind: "photo",
    mime: "image/jpeg",
    url: "https://cdn.akar.test/patch-me.jpg",
    alt: "Eski açıklama",
    license: "CC0",
    trust: "inferred",
  });
  const patch = (user: AuthUser | null, id: string, payload: object) =>
    app.inject({ method: "PATCH", url: `/v1/admin/media/${id}`, headers: user ? authHeader(user) : {}, payload });

  assert.equal((await patch(visitor, "patch-me", { alt: "x" })).statusCode, 403);
  assert.equal((await patch(null, "patch-me", { alt: "x" })).statusCode, 401);

  const res = await patch(editor, "patch-me", { alt: "Yeni açıklama", trust: "verified", sourceId: "src-media-test", titleEn: "Old photo" });
  assert.equal(res.statusCode, 200, res.body);
  const updated = res.json<MediaItem>();
  assert.equal(updated.alt, "Yeni açıklama");
  assert.equal(updated.license, "CC0", "fields left out are untouched");

  const [audit] = await db.select().from(auditLog).where(and(eq(auditLog.entityId, "patch-me"), eq(auditLog.action, "media.update")));
  assert.equal(audit?.actorId, editor.id);
  assert.deepEqual(audit?.before, { alt: "Eski açıklama", title: "", titleEn: null, description: "", license: "CC0", sourceId: null, trust: "inferred" });
  assert.deepEqual(audit?.after, {
    alt: "Yeni açıklama",
    title: "",
    titleEn: "Old photo",
    description: "",
    license: "CC0",
    sourceId: "src-media-test",
    trust: "verified",
  });

  // null clears the optional fields; a photo keeps its alt text; unknown sources, ids and empty bodies are refused.
  const cleared = await patch(editor, "patch-me", { sourceId: null, titleEn: null });
  assert.equal(cleared.json<MediaItem>().sourceId, null);
  assert.equal((await patch(editor, "patch-me", { alt: "" })).statusCode, 400);
  assert.equal((await patch(editor, "patch-me", { sourceId: "nope" })).statusCode, 400);
  assert.equal((await patch(editor, "patch-me", {})).statusCode, 400);
  assert.equal((await patch(editor, "no-such-media", { alt: "x" })).statusCode, 404);
});

// ── S3 driver ────────────────────────────────────────────────────────────────

test("the S3 driver signs path-style links pinned to the declared content type, maps a missing object to null and deletes one without error", async () => {
  const seen: string[] = [];
  const server = createServer((req, res) => {
    const path = (req.url ?? "").split("?")[0];
    seen.push(`${req.method} ${path}${req.headers.range ? ` ${req.headers.range}` : ""}`);
    if (req.method === "HEAD" && path?.endsWith("/missing.jpg")) res.writeHead(404).end();
    else if (req.method === "HEAD") res.writeHead(200, { "content-length": "1234", "content-type": "image/jpeg" }).end();
    else if (req.method === "GET") res.writeHead(206, { "content-type": "image/jpeg" }).end(JPEG.subarray(0, 4));
    else if (req.method === "DELETE" && path?.endsWith("/missing.jpg")) {
      res.writeHead(404, { "content-type": "application/xml" }).end("<Error><Code>NoSuchKey</Code></Error>");
    } else res.writeHead(204).end();
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const s3 = createS3Storage({
      endpoint: `http://127.0.0.1:${address.port}/storage/v1/s3`,
      region: "local",
      accessKeyId: "test-key",
      secretAccessKey: "test-secret",
      bucket: "media",
      publicBaseUrl: "https://cdn.akar.test/media/",
    });

    const link = await s3.createUploadUrl("photo/2026/10/a.jpg", { contentType: "image/jpeg", maxBytes: MEDIA_LIMITS.photo.maxBytes, expiresInSec: 900 });
    const url = new URL(link.url);
    assert.equal(url.pathname, "/storage/v1/s3/media/photo/2026/10/a.jpg");
    assert.equal(url.searchParams.get("X-Amz-SignedHeaders"), "content-type;host");
    assert.equal(url.searchParams.get("X-Amz-Expires"), "900");
    assert.equal(url.searchParams.has("x-amz-checksum-crc32"), false);
    assert.deepEqual(link.headers, { "Content-Type": "image/jpeg" });
    assert.equal(s3.publicUrl("photo/2026/10/a.jpg"), "https://cdn.akar.test/media/photo/2026/10/a.jpg");

    assert.equal(await s3.head("photo/missing.jpg"), null);
    assert.deepEqual(await s3.head("photo/a.jpg"), { bytes: 1234, contentType: "image/jpeg" });
    assert.deepEqual(await s3.read("photo/a.jpg", { start: 0, end: 3 }), JPEG.subarray(0, 4));
    await s3.delete("photo/a.jpg");
    await s3.delete("photo/missing.jpg");
    assert.deepEqual(seen, [
      "HEAD /storage/v1/s3/media/photo/missing.jpg",
      "HEAD /storage/v1/s3/media/photo/a.jpg",
      "GET /storage/v1/s3/media/photo/a.jpg bytes=0-3",
      "DELETE /storage/v1/s3/media/photo/a.jpg",
      "DELETE /storage/v1/s3/media/photo/missing.jpg",
    ]);
  } finally {
    server.closeAllConnections();
    server.close();
  }
});
