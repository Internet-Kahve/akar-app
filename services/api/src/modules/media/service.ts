import { randomUUID } from "node:crypto";
import { posix } from "node:path";
import { and, count, desc, eq, getTableColumns, gt, inArray, isNotNull, isNull, lt, not, or, sql, type SQL } from "drizzle-orm";
import type { FastifyBaseLogger } from "fastify";
import type { Db } from "../../db/client.ts";
import {
  auditLog,
  cards,
  catalogRoutes,
  historyImages,
  media,
  mediaUploads,
  uploadDeletions,
  mediaDeletions,
  memories,
  narrations,
  siteMedia,
  sitePartCardPhotos,
  siteSampleTraces,
  siteSectionPhotos,
  siteTasks,
  sites,
  sources,
  staffMembers,
  storyBlocks,
} from "../../db/schema/index.ts";
import { AppError, type ErrorBody } from "../../errors.ts";
import { recordAudit } from "../../platform/audit.ts";
import type { AuthUser, Role } from "../../platform/auth.ts";
import type { MutationResult, Tx } from "../../platform/idempotency.ts";
import type { JobQueue } from "../../platform/jobs.ts";
import { decodeCursor, encodeCursor } from "../../platform/pagination.ts";
import type { ObjectStorage, StorageBuckets } from "../../platform/storage.ts";
import { countTriangles, GlbError, MAX_MODEL_TRIANGLES, readGlbJson, readGlbParts } from "./glb.ts";
import { extensionFor, matchesMagic, MEDIA_LIMITS, mediaTypeOf, megabytes, type MediaKind } from "./magic.ts";
import { GlbPartsJob, type MediaItem, type MediaMetadata, type RequestUploadInput, type UploadTicket } from "./schemas.ts";

export const GLB_PARTS_JOB = "media.glb-parts";
/** How long a signed upload link, and the pending upload behind it, stays usable. */
export const UPLOAD_TTL_SEC = 15 * 60;
/** Open (pending, unexpired) uploads one account may hold at once; the next request waits until one finishes or runs out. */
export const MAX_OPEN_UPLOADS = 10;
/** Upload tickets a visitor (role `user`) may request per rolling `DAILY_WINDOW_HOURS`; staff are exempt. */
export const DAILY_UPLOAD_QUOTA = 10;
const DAILY_WINDOW_HOURS = 24;
/** A visitor's photo that no content or memory uses is deleted by `sweepUnattachedPhotos` after this long. */
const UNATTACHED_PHOTO_HOURS = 24;
/**
 * `expireUploads` leaves an upload alone this long after its window closed: a `complete` racing the deadline still
 * finds it pending, and its signed link, which the storage checks against its own clock, has run out for sure.
 */
const EXPIRY_GRACE_MS = 5 * 60 * 1000;
/** Uploads one `expireUploads` run handles unless told otherwise. */
const EXPIRE_BATCH = 500;
/** License of photos visitors leave through "İz Bırak"; the server sets it, never the client. */
export const CONTRIBUTOR_LICENSE = "Katkı sahibi izniyle";

type MediaRow = typeof media.$inferSelect;
type UploadRow = typeof mediaUploads.$inferSelect;

const EXPIRED_MESSAGE = "Yükleme süresi doldu. Yeni bir yükleme başlat.";
const CLOSED_MESSAGE = "Bu yükleme tamamlandı, reddedildi ya da süresi doldu. Yeni bir yükleme başlat.";
const OPEN_LIMIT_MESSAGE = "Çok fazla açık yüklemen var. Birkaçını tamamla ya da süresinin dolmasını bekle.";
const DAILY_LIMIT_MESSAGE = `Son ${DAILY_WINDOW_HOURS} saatte en fazla ${DAILY_UPLOAD_QUOTA} fotoğraf yükleyebilirsin. Daha sonra tekrar dene.`;
const ACCEPTED: Record<MediaKind, string> = {
  photo: "JPEG, PNG ya da WebP fotoğraf",
  model: "GLB 3B model",
  audio: "MP3 ya da M4A ses",
};

/** Who manages media content: editors and admins (admin passes every role check). Everyone else is a visitor. */
export const isMediaStaff = (role: Role): boolean => role === "editor" || role === "admin";

/** An unconfigured dependency answers 503 instead of pretending (CONTRACTS §1). */
export function requireDep<T>(dep: T | null, name: string): T {
  if (dep === null) throw new AppError(503, "SERVICE_UNAVAILABLE", `${name} yapılandırılmamış.`);
  return dep;
}

const validationError = (fieldErrors: Record<string, string[]>) =>
  new AppError(400, "VALIDATION_FAILED", "Girdi doğrulanamadı.", fieldErrors);

/**
 * A refusal that must commit with the transaction (the upload is marked rejected, the object
 * deleted), so it is a result and not a thrown `AppError`, which would roll the marking back.
 */
function failure(requestId: string, status: number, code: string, message: string): MutationResult<ErrorBody> {
  return { status, body: { error: { code, message, fieldErrors: {}, requestId } } };
}

export function toMediaItem(row: MediaRow): MediaItem {
  return {
    id: row.id,
    kind: row.kind,
    mime: row.mime,
    url: row.url,
    alt: row.alt,
    title: row.title,
    titleEn: row.titleEn,
    description: row.description,
    license: row.license,
    sourceId: row.sourceId,
    trust: row.trust,
    parts: row.parts,
    triangles: row.triangles,
    coverGroups: row.coverGroups,
    bytes: row.bytes,
    partsStatus: row.partsStatus,
    uploadedBy: row.uploadedBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** The editable fields as audit snapshots; personal data (the uploader) stays out. */
const snapshotOf = (row: MediaRow) => ({
  alt: row.alt,
  title: row.title,
  titleEn: row.titleEn,
  description: row.description,
  license: row.license,
  sourceId: row.sourceId,
  trust: row.trust,
});

async function assertSourceExists(tx: Tx, sourceId: string | null | undefined): Promise<void> {
  if (!sourceId) return;
  const [source] = await tx.select({ id: sources.id }).from(sources).where(eq(sources.id, sourceId));
  if (!source) throw validationError({ sourceId: ["Kaynak bulunamadı."] });
}

// ── upload intent ────────────────────────────────────────────────────────────

/** Who may upload what, and the declared type and size; returns the extension of the stored object. */
export function planUpload(user: AuthUser, input: RequestUploadInput): string {
  if (input.kind !== "photo" && !isMediaStaff(user.role)) {
    throw new AppError(403, "FORBIDDEN", "3B model ve ses dosyalarını yalnız editörler yükleyebilir.");
  }
  const extension = extensionFor(input.kind, input.contentType);
  if (!extension) {
    throw new AppError(415, "UNSUPPORTED_MEDIA_TYPE", `Bu dosya türü kabul edilmiyor. Yalnız ${ACCEPTED[input.kind]} yüklenebilir.`);
  }
  const { maxBytes } = MEDIA_LIMITS[input.kind];
  if (input.bytes > maxBytes) {
    throw new AppError(413, "PAYLOAD_TOO_LARGE", `Dosya en fazla ${megabytes(maxBytes)} olabilir.`);
  }
  return extension;
}

/**
 * Records the pending upload and returns the signed link into the non-public `uploads` bucket; the upload key is `<kind>/<yyyy>/<mm>/<uuid>.<ext>`.
 * An account holds at most `MAX_OPEN_UPLOADS` open tickets (429), so abandoned ones cannot pile up; a visitor (role
 * `user`) also gets at most `DAILY_UPLOAD_QUOTA` tickets per rolling day (429), counted from upload rows, which are kept.
 */
export async function createUpload(
  tx: Tx,
  uploads: ObjectStorage,
  user: AuthUser,
  input: RequestUploadInput,
  extension: string,
): Promise<MutationResult<UploadTicket>> {
  const now = new Date();
  // One lock per account: the requests of a burst count the open tickets one after another, so none slips past the cap.
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`media.uploads:${user.id}`}))`);
  const [open] = await tx
    .select({ n: count() })
    .from(mediaUploads)
    .where(and(eq(mediaUploads.ownerId, user.id), eq(mediaUploads.status, "pending"), gt(mediaUploads.expiresAt, now)));
  if ((open?.n ?? 0) >= MAX_OPEN_UPLOADS) throw new AppError(429, "RATE_LIMITED", OPEN_LIMIT_MESSAGE);
  if (user.role === "user") {
    const [today] = await tx
      .select({ n: count() })
      .from(mediaUploads)
      .where(and(eq(mediaUploads.ownerId, user.id), sql`${mediaUploads.createdAt} > now() - ${DAILY_WINDOW_HOURS} * interval '1 hour'`));
    if ((today?.n ?? 0) >= DAILY_UPLOAD_QUOTA) throw new AppError(429, "RATE_LIMITED", DAILY_LIMIT_MESSAGE);
  }

  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const key = `${input.kind}/${now.getUTCFullYear()}/${month}/${randomUUID()}.${extension}`;
  const { maxBytes } = MEDIA_LIMITS[input.kind];
  const expiresAt = new Date(now.getTime() + UPLOAD_TTL_SEC * 1000);

  const link = await uploads.createUploadUrl(key, { contentType: input.contentType, maxBytes, expiresInSec: UPLOAD_TTL_SEC });
  const uploadId = randomUUID();
  await tx.insert(mediaUploads).values({
    id: uploadId,
    ownerId: user.id,
    kind: input.kind,
    contentType: input.contentType,
    maxBytes,
    storageKey: key,
    expiresAt,
  });
  return {
    status: 201,
    body: { uploadId, url: link.url, method: link.method, headers: link.headers, expiresAt: expiresAt.toISOString(), maxBytes },
  };
}

// ── complete ─────────────────────────────────────────────────────────────────

type Metadata = Pick<MediaRow, "alt" | "title" | "titleEn" | "description" | "license" | "sourceId" | "trust">;

/** Fields only editors set; a visitor sending one is refused rather than silently ignored. */
const STAFF_FIELDS = ["title", "titleEn", "description", "license", "sourceId", "trust"] as const;

/** Metadata for the new media row: editors state everything, visitors only `alt` and the server fills the rest. */
function resolveMetadata(user: AuthUser, kind: MediaKind, body: MediaMetadata): Metadata {
  const problems: Record<string, string[]> = {};
  const need = (field: string, message: string) => (problems[field] ??= []).push(message);
  const altMissing = kind === "photo" && !body.alt;

  if (!isMediaStaff(user.role)) {
    if (kind !== "photo") throw new AppError(403, "FORBIDDEN", "3B model ve ses dosyalarını yalnız editörler yükleyebilir.");
    for (const field of STAFF_FIELDS) if (body[field] !== undefined) need(field, "Bu alanı yalnız editörler belirler.");
    if (altMissing) need("alt", "Fotoğraf için açıklama (alt metin) gerekli.");
    if (Object.keys(problems).length > 0) throw validationError(problems);
    return {
      alt: body.alt ?? "",
      title: "",
      titleEn: null,
      description: "",
      license: CONTRIBUTOR_LICENSE,
      sourceId: null,
      trust: "representative",
    };
  }

  if (altMissing) need("alt", "Fotoğraf için açıklama (alt metin) gerekli.");
  if (!body.license) need("license", "Lisans gerekli.");
  if (!body.trust) need("trust", "Güven düzeyi gerekli.");
  if (!body.license || !body.trust || Object.keys(problems).length > 0) throw validationError(problems);
  return {
    alt: body.alt ?? "",
    title: body.title ?? "",
    titleEn: body.titleEn ?? null,
    description: body.description ?? "",
    license: body.license,
    sourceId: body.sourceId ?? null,
    trust: body.trust,
  };
}

type Refusal = { status: 413 | 415; code: "PAYLOAD_TOO_LARGE" | "UNSUPPORTED_MEDIA_TYPE"; message: string };

const MISMATCH: Refusal = { status: 415, code: "UNSUPPORTED_MEDIA_TYPE", message: "Dosya içeriği beyan edilen türle uyuşmuyor." };

/**
 * The stored object's bytes (and, for a model, its triangle count) when they may be published, otherwise why not. The client keeps its write grant until
 * the upload link runs out, so the object can change after the HEAD answer: size and magic bytes are judged on the
 * bytes read here, and these are the very bytes `completeUpload` publishes.
 */
async function readChecked(
  uploads: ObjectStorage,
  upload: UploadRow,
  object: { bytes: number; contentType: string },
): Promise<{ bytes: Buffer; triangles: number | null } | Refusal> {
  const tooLarge: Refusal = {
    status: 413,
    code: "PAYLOAD_TOO_LARGE",
    message: `Dosya en fazla ${megabytes(upload.maxBytes)} olabilir.`,
  };
  if (object.bytes > upload.maxBytes) return tooLarge;
  // The object must also be stored under the declared type.
  if (object.bytes === 0 || mediaTypeOf(object.contentType) !== upload.contentType) return MISMATCH;
  // One byte past the cap tells an object that outgrew it since HEAD from one that fits, and keeps memory at the cap.
  const bytes = await uploads.read(upload.storageKey, { start: 0, end: upload.maxBytes });
  if (bytes.length > upload.maxBytes) return tooLarge;
  if (!matchesMagic(upload.contentType, bytes)) return MISMATCH;
  if (upload.kind !== "model") return { bytes, triangles: null };
  const model = await countModel(bytes);
  return "status" in model ? model : { bytes, triangles: model.triangles };
}

const trNumber = new Intl.NumberFormat("tr-TR");

/**
 * Triangle count of a GLB the upload passed the magic check as, or why it may not be published: a file whose
 * JSON chunk cannot be read is 415 like any file that is not what it claims to be, a model over the limit 413.
 */
async function countModel(bytes: Buffer): Promise<{ triangles: number } | Refusal> {
  let triangles: number;
  try {
    const gltf = await readGlbJson(bytes.length, async ({ start, end }) => bytes.subarray(start, end + 1));
    triangles = countTriangles(gltf);
  } catch (err) {
    if (!(err instanceof GlbError)) throw err;
    return { status: 415, code: "UNSUPPORTED_MEDIA_TYPE", message: "Model dosyası okunamadı; geçerli bir GLB olmalı." };
  }
  if (triangles > MAX_MODEL_TRIANGLES) {
    return {
      status: 413,
      code: "PAYLOAD_TOO_LARGE",
      message: `Model en çok ${trNumber.format(MAX_MODEL_TRIANGLES)} üçgen olabilir; bu dosyada ${trNumber.format(triangles)} var.`,
    };
  }
  return { triangles };
}

/** An object `completeUpload` wrote to the `media` bucket, with the id of the row that should point at it. */
export type PublishedObject = { mediaId: string; storageKey: string };
export type CompleteContext = {
  storage: StorageBuckets;
  jobs: JobQueue | null;
  user: AuthUser;
  requestId: string;
  /** Filled before each write to the `media` bucket; the caller passes it to `discardUnsavedObjects` if the transaction fails. */
  published: PublishedObject[];
};
export type Completion = {
  result: MutationResult<MediaItem | ErrorBody>;
  /** Set when a model row was created: the caller enqueues part extraction once the transaction has committed. */
  modelId?: string | undefined;
};

/**
 * Turns an uploaded object into a `media` row after checking it: the upload is the caller's, still
 * pending and unexpired, and the object exists in the `uploads` bucket, fits the size cap and carries the
 * declared type's magic bytes. A refused object is deleted and the upload marked rejected (413/415).
 * Completing a finished upload again returns its media (200).
 *
 * The checked bytes are written to the public `media` bucket under a new key and the upload key is deleted. The
 * client can still write to the upload key until its link runs out, but that bucket is not public: what lands
 * there is never served (so it cannot swap the bytes a moderator approved) and `expireUploads` removes it once
 * the link is dead. The object is written before the transaction commits, so it is listed in `ctx.published`:
 * if the transaction rolls back, the caller removes it with `discardUnsavedObjects`.
 */
export async function completeUpload(tx: Tx, ctx: CompleteContext, uploadId: string, body: MediaMetadata): Promise<Completion> {
  const { storage, user, requestId } = ctx;
  const { uploads } = storage;
  const [upload] = await tx
    .select()
    .from(mediaUploads)
    .where(and(eq(mediaUploads.id, uploadId), eq(mediaUploads.ownerId, user.id)))
    .for("update");
  if (!upload) throw new AppError(404, "NOT_FOUND", "Yükleme bulunamadı.");

  if (upload.status === "completed" && upload.mediaId) {
    const [done] = await tx.select().from(media).where(eq(media.id, upload.mediaId));
    if (done) return { result: { status: 200, body: toMediaItem(done) } };
  }
  if (upload.status === "rejected") {
    const reason = upload.rejectReason ? ` ${upload.rejectReason}` : "";
    throw new AppError(409, "CONFLICT", `Bu yükleme daha önce reddedildi.${reason} Yeni bir yükleme başlat.`);
  }
  if (upload.status !== "pending") throw new AppError(409, "CONFLICT", EXPIRED_MESSAGE);

  const now = new Date();
  if (upload.expiresAt <= now) {
    await uploads.delete(upload.storageKey);
    await tx.update(mediaUploads).set({ status: "expired", updatedAt: now }).where(eq(mediaUploads.id, upload.id));
    return { result: failure(requestId, 409, "CONFLICT", EXPIRED_MESSAGE) };
  }

  if (upload.kind === "model") requireDep(ctx.jobs, "İş kuyruğu");
  const metadata = resolveMetadata(user, upload.kind, body);
  await assertSourceExists(tx, metadata.sourceId);

  const object = await uploads.head(upload.storageKey);
  if (!object) throw new AppError(409, "CONFLICT", "Dosya henüz yüklenmedi. Yükleme bitince tekrar dene.");

  const checked = await readChecked(uploads, upload, object);
  if ("status" in checked) {
    await uploads.delete(upload.storageKey);
    await tx.update(mediaUploads).set({ status: "rejected", rejectReason: checked.message, updatedAt: now }).where(eq(mediaUploads.id, upload.id));
    return { result: failure(requestId, checked.status, checked.code, checked.message) };
  }

  // Published under the new media id, which the client has never seen, in the same `<kind>/<yyyy>/<mm>/` folder.
  const mediaId = randomUUID();
  const storageKey = posix.join(posix.dirname(upload.storageKey), `${mediaId}${posix.extname(upload.storageKey)}`);
  ctx.published.push({ mediaId, storageKey });
  await storage.media.put(storageKey, checked.bytes, upload.contentType);

  const [row] = await tx
    .insert(media)
    .values({
      id: mediaId,
      kind: upload.kind,
      mime: upload.contentType,
      url: storage.media.publicUrl(storageKey),
      ...metadata,
      bytes: checked.bytes.length,
      triangles: checked.triangles,
      storageKey,
      uploadedBy: user.id,
      partsStatus: upload.kind === "model" ? "pending" : "none",
    })
    .returning();
  if (!row) throw new Error("media insert returned no row");
  await tx.update(mediaUploads).set({ status: "completed", mediaId: row.id, updatedAt: now }).where(eq(mediaUploads.id, upload.id));

  if (isMediaStaff(user.role)) {
    await recordAudit(tx, {
      actorId: user.id,
      action: "media.create",
      entityType: "media",
      entityId: row.id,
      after: { ...snapshotOf(row), kind: row.kind, mime: row.mime, bytes: row.bytes },
      requestId,
    });
  }
  // Last, so a failure above rolls back with the upload key still in place for a retry.
  await uploads.delete(upload.storageKey);
  return { result: { status: 201, body: toMediaItem(row) }, modelId: row.kind === "model" ? row.id : undefined };
}

/**
 * Stores the bytes that arrive on a filesystem-driver upload link in the `uploads` bucket, only while the
 * upload behind it is pending: once it is completed (published to the `media` bucket), rejected or expired,
 * the link changes nothing. The row stays locked through the write, so a `complete` that starts meanwhile
 * waits for these bytes and then checks them, and a write that starts after `complete` is refused.
 */
export async function storeUploadedObject(
  db: Db,
  uploads: ObjectStorage,
  grant: { key: string; contentType: string },
  body: Buffer,
): Promise<void> {
  await db.transaction(async (tx) => {
    const [upload] = await tx
      .select({ status: mediaUploads.status })
      .from(mediaUploads)
      .where(eq(mediaUploads.storageKey, grant.key))
      .for("update");
    if (!upload) throw new AppError(404, "NOT_FOUND", "Yükleme bulunamadı.");
    if (upload.status !== "pending") throw new AppError(409, "CONFLICT", CLOSED_MESSAGE);
    await uploads.put(grant.key, body, grant.contentType);
  });
}

// ── panel ────────────────────────────────────────────────────────────────────

/** Newest first. The cursor carries the timestamp as microsecond-exact UTC text: a JS Date would drop digits and repeat or skip tied rows. */
const createdAtText = sql<string>`to_char(${media.createdAt} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`;

/** The exact shape `createdAtText` produces, and a real calendar date (Postgres would fail on the rest with a 500). */
function isCursorTime(value: string): boolean {
  if (!/^(?!0000)\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(value)) return false;
  const seconds = value.slice(0, 19);
  const parsed = new Date(`${seconds}Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(seconds);
}

export async function listMedia(
  db: Db,
  query: { kind?: MediaKind | undefined; cursor?: string | undefined; limit: number },
): Promise<{ items: MediaItem[]; nextCursor: string | null }> {
  const where: (SQL | undefined)[] = [query.kind ? eq(media.kind, query.kind) : undefined];
  if (query.cursor) {
    const cursor = decodeCursor(query.cursor, ["t", "i"]);
    if (!isCursorTime(cursor.t)) throw new AppError(400, "INVALID_CURSOR", "İmleç geçersiz.", { cursor: ["Geçersiz imleç."] });
    where.push(sql`(${media.createdAt}, ${media.id} COLLATE "C") < (${cursor.t}::timestamptz, ${cursor.i})`);
  }

  const rows = await db
    .select({ ...getTableColumns(media), cursorTime: createdAtText.as("cursor_time") })
    .from(media)
    .where(and(...where))
    .orderBy(desc(media.createdAt), sql`${media.id} COLLATE "C" desc`)
    .limit(query.limit + 1);

  const page = rows.slice(0, query.limit);
  const last = rows.length > query.limit ? page.at(-1) : undefined;
  return {
    items: page.map(toMediaItem),
    nextCursor: last ? encodeCursor({ t: last.cursorTime, i: last.id }) : null,
  };
}

/** Sets the given metadata fields (null clears `titleEn`/`sourceId`); the Figma rule: photo info is entered once and reused. */
export async function updateMedia(
  tx: Tx,
  user: AuthUser,
  id: string,
  patch: MediaMetadata,
  requestId: string,
): Promise<MutationResult<MediaItem>> {
  const [before] = await tx.select().from(media).where(eq(media.id, id)).for("update");
  if (!before) throw new AppError(404, "NOT_FOUND", "Medya bulunamadı.");
  if (before.kind === "photo" && patch.alt === "") throw validationError({ alt: ["Fotoğrafın açıklaması (alt metin) boş olamaz."] });
  await assertSourceExists(tx, patch.sourceId);

  const [after] = await tx
    .update(media)
    .set({
      alt: patch.alt,
      title: patch.title,
      titleEn: patch.titleEn,
      description: patch.description,
      license: patch.license,
      sourceId: patch.sourceId,
      trust: patch.trust,
      updatedAt: new Date(),
    })
    .where(eq(media.id, id))
    .returning();
  if (!after) throw new Error("media update returned no row");

  await recordAudit(tx, {
    actorId: user.id,
    action: "media.update",
    entityType: "media",
    entityId: id,
    before: snapshotOf(before),
    after: snapshotOf(after),
    requestId,
  });
  return { status: 200, body: toMediaItem(after) };
}

// ── background job ───────────────────────────────────────────────────────────

/**
 * `media.glb-parts`: reads the GLB's JSON chunk and stores its distinct node and mesh names as the
 * model's `parts`. A malformed file ends as `failed`; a storage or database error is thrown so the
 * queue retries it.
 */
export async function runGlbPartsJob(
  env: { db: Db; storage: StorageBuckets | null; log: FastifyBaseLogger },
  data: unknown,
): Promise<void> {
  const job = GlbPartsJob.safeParse(data);
  if (!job.success) {
    env.log.warn({ data }, "media.glb-parts job without a mediaId");
    return;
  }
  const { mediaId } = job.data;
  const [row] = await env.db.select({ kind: media.kind, storageKey: media.storageKey }).from(media).where(eq(media.id, mediaId));
  if (!row || row.kind !== "model" || !row.storageKey) return;
  // The model was published by `complete`, so it lives in the media bucket.
  const storage = requireDep(env.storage, "Dosya depolama").media;
  const key = row.storageKey;

  try {
    const object = await storage.head(key);
    if (!object) throw new GlbError("object is missing from storage");
    const parts = await readGlbParts(object.bytes, (range) => storage.read(key, range));
    await env.db.update(media).set({ parts, partsStatus: "done", updatedAt: new Date() }).where(eq(media.id, mediaId));
  } catch (err) {
    if (!(err instanceof GlbError)) throw err;
    env.log.warn({ mediaId, reason: err.message }, "GLB parts extraction failed");
    await env.db.update(media).set({ partsStatus: "failed", updatedAt: new Date() }).where(eq(media.id, mediaId));
  }
}

// ── cleanup ──────────────────────────────────────────────────────────────────

/**
 * Empties the `uploads` bucket of what nobody will use, once an upload's signed link is dead for good (its
 * window closed more than five minutes ago). A pending upload loses its object (a missing one is no error:
 * most abandoned tickets never got a file) and becomes `expired`, which is what `complete` would do on a late
 * call that the client may never make. A completed, rejected or expired upload keeps its status but loses
 * whatever sits under its upload key: `complete` deleted the key at once, but a presigned PUT cannot be
 * revoked, so the client may have written to it since, and that object was neither checked nor published.
 * Either way the upload is marked `cleaned_at`, so each is handled once. Handles at most `limit` (default 500)
 * uploads per run, the oldest first, and returns how many it cleaned. Rows another transaction holds (a
 * `complete` or a PUT in flight, or a second instance running this too) are skipped and left for the next run.
 * A storage failure aborts the run with nothing marked.
 */
export async function expireUploads(deps: { db: Db; storage: StorageBuckets }, opts: { limit?: number } = {}): Promise<number> {
  const { db, storage } = deps;
  const closedBefore = new Date(Date.now() - EXPIRY_GRACE_MS);
  return db.transaction(async (tx) => {
    const stale = await tx
      .select({ id: mediaUploads.id, storageKey: mediaUploads.storageKey, status: mediaUploads.status })
      .from(mediaUploads)
      .where(and(isNull(mediaUploads.cleanedAt), lt(mediaUploads.expiresAt, closedBefore)))
      .orderBy(mediaUploads.expiresAt)
      .limit(opts.limit ?? EXPIRE_BATCH)
      .for("update", { skipLocked: true });
    if (stale.length === 0) return 0;
    for (const { storageKey } of stale) await storage.uploads.delete(storageKey);

    const now = new Date();
    const unfinished = stale.filter((upload) => upload.status === "pending").map((upload) => upload.id);
    if (unfinished.length > 0) await tx.update(mediaUploads).set({ status: "expired" }).where(inArray(mediaUploads.id, unfinished));
    await tx
      .update(mediaUploads)
      .set({ cleanedAt: now, updatedAt: now })
      .where(inArray(mediaUploads.id, stale.map((upload) => upload.id)));
    return stale.length;
  });
}

// ── removal ──────────────────────────────────────────────────────────────────

/**
 * Every column that points at `media.id` from another table. A media row any of them uses is in use and is never
 * removed here (the foreign keys would refuse it anyway). `media.test.ts` checks this list against the database.
 */
export const MEDIA_REFERENCES = [
  sites.coverMediaId,
  sites.aboutCoverMediaId,
  siteMedia.mediaId,
  cards.mediaId,
  storyBlocks.photoId,
  narrations.mediaId,
  historyImages.mediaId,
  historyImages.presentMediaId,
  sitePartCardPhotos.mediaId,
  siteSectionPhotos.mediaId,
  siteSampleTraces.mediaId,
  siteTasks.mediaId,
  catalogRoutes.badgeMediaId,
  memories.mediaId,
] as const;

const inUse = or(...MEDIA_REFERENCES.map((column) => sql`exists (select 1 from ${column.table} where ${column} = ${media.id})`))!;

/**
 * Of the given rows, which nothing references, judged after the caller has locked them. A separate statement on
 * purpose: under READ COMMITTED it takes a fresh snapshot, so a memory that a transaction holding the row (a
 * `createMemory`'s FOR SHARE, a foreign-key check) committed while we waited for the lock is seen. Checked in the
 * same statement as the lock, the `exists` subqueries would read the snapshot from before the wait.
 */
async function stillUnused(tx: Tx, ids: string[]): Promise<{ id: string; storageKey: string | null }[]> {
  if (ids.length === 0) return [];
  return tx.select({ id: media.id, storageKey: media.storageKey }).from(media).where(and(inArray(media.id, ids), not(inUse)));
}

/** Deletes the given rows (already locked) and unlinks their uploads; returns the published objects to delete after commit. */
async function dropMediaRows(tx: Tx, rows: { id: string; storageKey: string | null }[]): Promise<string[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  // The upload rows stay (they count toward the daily quota); only their link to the media goes.
  await tx.update(mediaUploads).set({ mediaId: null, updatedAt: new Date() }).where(inArray(mediaUploads.mediaId, ids));
  const keys = rows.flatMap((r) => (r.storageKey ? [r.storageKey] : []));
  if (keys.length) await tx.insert(mediaDeletions).values(keys.map((storageKey) => ({ storageKey }))).onConflictDoNothing();
  await tx.delete(media).where(inArray(media.id, ids));
  return keys;
}

/**
 * Deletes the media rows in `ids` that nothing references any more (see `MEDIA_REFERENCES`), inside the caller's
 * transaction, and returns the keys of their objects in the `media` bucket. The caller unlinks its own reference
 * first and passes the keys to `deleteMediaObjects` once the transaction has committed. Locks first, then checks.
 */
export async function deleteUnreferencedMedia(tx: Tx, ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const locked = await tx.select({ id: media.id }).from(media).where(inArray(media.id, ids)).for("update");
  return dropMediaRows(tx, await stillUnused(tx, locked.map((r) => r.id)));
}

/**
 * Processes durable deletion intents. A crash or DB rollback after deleting an object leaves the intent
 * for an idempotent retry. Row locks prevent workers from processing the same key concurrently. Failed
 * keys back off (up to one hour), without blocking other keys or ever exhausting their retry budget.
 */
export async function drainMediaDeletions(
  deps: { db: Db; storage: StorageBuckets },
  opts: { keys?: string[]; limit?: number } = {},
): Promise<{ deleted: number; failed: number }> {
  if (opts.keys?.length === 0) return { deleted: 0, failed: 0 };
  if (!opts.keys) await drainUploadDeletions(deps);
  return deps.db.transaction(async (tx) => {
    const pending = await tx.select().from(mediaDeletions)
      .where(and(sql`${mediaDeletions.nextAttemptAt} <= now()`, opts.keys ? inArray(mediaDeletions.storageKey, opts.keys) : undefined))
      .orderBy(mediaDeletions.nextAttemptAt).limit(opts.limit ?? 50).for("update", { skipLocked: true });
    let deleted = 0;
    let failed = 0;
    for (const row of pending) {
      try {
        await deps.storage.media.delete(row.storageKey);
      } catch {
        const attempts = row.attempts + 1;
        const delay = Math.min(3600, 30 * 2 ** Math.min(attempts - 1, 7));
        await tx.update(mediaDeletions).set({ attempts, nextAttemptAt: new Date(Date.now() + delay * 1000) })
          .where(eq(mediaDeletions.storageKey, row.storageKey));
        failed++;
        continue;
      }
      await tx.delete(mediaDeletions).where(eq(mediaDeletions.storageKey, row.storageKey));
      deleted++;
    }
    return { deleted, failed };
  });
}

/** Best-effort immediate attempt after commit; the durable worker handles failures and process restarts. */
export async function deleteMediaObjects(db: Db, storage: StorageBuckets | null, keys: string[], log: FastifyBaseLogger): Promise<void> {
  if (!storage || !keys.length) return;
  try {
    const result = await drainMediaDeletions({ db, storage }, { keys });
    if (result.failed) log.error(result, "media deletion queued for retry");
  } catch (err) {
    log.error({ err }, "media deletion worker failed; durable intents retained");
  }
}

/**
 * Removes what `completeUpload` wrote to the `media` bucket when its transaction failed, since no row and no
 * `media_deletions` intent survive the rollback. An object is deleted only when its row is confirmed absent: a
 * failure reported after COMMIT reached the server may still have committed, and that row's photo must stay. If the
 * check itself fails (database down), the objects stay and are logged. Never throws, so the caller's error is kept.
 */
export async function discardUnsavedObjects(
  db: Db,
  storage: StorageBuckets,
  published: PublishedObject[],
  log: FastifyBaseLogger,
): Promise<void> {
  if (published.length === 0) return;
  let saved: Set<string>;
  try {
    const rows = await db.select({ id: media.id }).from(media).where(inArray(media.id, published.map((p) => p.mediaId)));
    saved = new Set(rows.map((r) => r.id));
  } catch (err) {
    log.error({ err, keys: published.map((p) => p.storageKey) }, "could not check unsaved media objects; left in storage");
    return;
  }
  for (const { mediaId, storageKey } of published) {
    if (saved.has(mediaId)) continue;
    try {
      await storage.media.delete(storageKey);
    } catch (err) {
      log.error({ err, key: storageKey }, "unsaved media object delete failed; left in storage");
    }
  }
}

/**
 * Immediate best-effort cleanup. The durable upload queue repeats deletion after signed links expire.
 */
export async function deleteUploadObjects(storage: StorageBuckets | null, keys: string[], log: FastifyBaseLogger): Promise<void> {
  if (!storage) return;
  for (const key of keys) {
    try {
      await storage.uploads.delete(key);
    } catch (err) {
      log.error({ err, key }, "upload object delete failed; durable cleanup will retry");
    }
  }
}

/**
 * Account erasure (KVKK): deletes the user's upload tickets and the media rows they uploaded that nothing uses
 * (see `MEDIA_REFERENCES`), except an editor's or admin's library (`media.create` audit, as in `sweepUnattachedPhotos`).
 * Rows still in use (site content) stay without an uploader. Returns the object keys to delete after the commit:
 * `media` bucket, and `uploads` bucket for every ticket whose upload key was not cleaned yet.
 */
export async function eraseUploads(tx: Tx, userId: string): Promise<{ media: string[]; uploads: string[] }> {
  const candidates = await tx
    .select({ id: media.id })
    .from(media)
    .where(
      and(
        eq(media.uploadedBy, userId),
        sql`not exists (select 1 from ${auditLog} where ${auditLog.entityType} = 'media' and ${auditLog.entityId} = ${media.id} and ${auditLog.action} = 'media.create')`,
      ),
    )
    .for("update");
  const mediaKeys = await dropMediaRows(tx, await stillUnused(tx, candidates.map((r) => r.id)));
  await tx.update(media).set({ uploadedBy: null, updatedAt: new Date() }).where(eq(media.uploadedBy, userId));
  const tickets = await tx
    .delete(mediaUploads)
    .where(eq(mediaUploads.ownerId, userId))
    .returning({ storageKey: mediaUploads.storageKey, cleanedAt: mediaUploads.cleanedAt, expiresAt: mediaUploads.expiresAt });
  const pending = tickets.filter((t) => !t.cleanedAt);
  if (pending.length) await tx.insert(uploadDeletions).values(pending.map((t) => ({
    storageKey: t.storageKey,
    nextAttemptAt: new Date(Math.max(Date.now(), t.expiresAt.getTime() + EXPIRY_GRACE_MS)),
  }))).onConflictDoNothing();
  return { media: mediaKeys, uploads: pending.map((t) => t.storageKey) };
}

/**
 * Deletes visitors' photos that nothing uses (an "İz Bırak" upload never attached, or whose memory went) once they
 * are `UNATTACHED_PHOTO_HOURS` old: the row, its upload link and the published object. Never touched: seed content
 * (no uploader), uploads of current staff (`staff_members`) and anything an editor or admin uploaded (a `media.create`
 * audit row), so a revoked editor's library stays. Rows another transaction holds are skipped; the rest are checked
 * again after locking (see `stillUnused`). Handles at most `limit` (default 500) photos per run and returns how many
 * rows it deleted. Objects are deleted after commit; failed keys remain in the durable outbox for retry.
 */
export async function sweepUnattachedPhotos(deps: { db: Db; storage: StorageBuckets }, opts: { limit?: number } = {}): Promise<number> {
  const { db, storage } = deps;
  const swept = await db.transaction(async (tx) => {
    const candidates = await tx
      .select({ id: media.id })
      .from(media)
      .where(
        and(
          eq(media.kind, "photo"),
          isNotNull(media.uploadedBy),
          sql`not exists (select 1 from ${staffMembers} where ${staffMembers.userId} = ${media.uploadedBy})`,
          sql`not exists (select 1 from ${auditLog} where ${auditLog.entityType} = 'media' and ${auditLog.entityId} = ${media.id} and ${auditLog.action} = 'media.create')`,
          sql`${media.createdAt} < now() - ${UNATTACHED_PHOTO_HOURS} * interval '1 hour'`,
          not(inUse),
        ),
      )
      .orderBy(media.createdAt)
      .limit(opts.limit ?? EXPIRE_BATCH)
      .for("update", { skipLocked: true });
    const rows = await stillUnused(tx, candidates.map((r) => r.id));
    return { count: rows.length, keys: await dropMediaRows(tx, rows) };
  });
  await drainMediaDeletions({ db, storage }, { keys: swept.keys });
  return swept.count;
}

/** Runs from the existing media maintenance worker; failed deletes remain durable. */
export async function drainUploadDeletions(deps: { db: Db; storage: StorageBuckets }): Promise<void> {
  await deps.db.transaction(async (tx) => {
    const pending = await tx.select().from(uploadDeletions)
      .where(sql`${uploadDeletions.nextAttemptAt} <= now()`)
      .orderBy(uploadDeletions.nextAttemptAt).limit(50).for("update", { skipLocked: true });
    for (const row of pending) {
      try {
        await deps.storage.uploads.delete(row.storageKey);
      } catch {
        const attempts = row.attempts + 1;
        await tx.update(uploadDeletions).set({ attempts,
          nextAttemptAt: new Date(Date.now() + Math.min(3600, 30 * 2 ** Math.min(attempts - 1, 7)) * 1000),
        }).where(eq(uploadDeletions.storageKey, row.storageKey));
        continue;
      }
      await tx.delete(uploadDeletions).where(eq(uploadDeletions.storageKey, row.storageKey));
    }
  });
}
