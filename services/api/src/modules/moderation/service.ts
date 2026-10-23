import { normalize } from "@akar/domain";
import { and, asc, desc, eq, inArray, or, sql, type SQL } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Db } from "../../db/client.ts";
import { auditLog, media, memories, memoryReports, profiles, sites } from "../../db/schema/index.ts";
import { AppError } from "../../errors.ts";
import { recordAudit } from "../../platform/audit.ts";
import type { AuthUser } from "../../platform/auth.ts";
import type { Tx } from "../../platform/idempotency.ts";
import { decodeCursor, encodeCursor } from "../../platform/pagination.ts";
import { published } from "../catalog/service.ts";
import { recordPointEvent, takeBackMemoryPoints } from "../engagement/points.ts";
import { deleteUnreferencedMedia } from "../media/service.ts";
import type { AdminMemory, CreateMemoryBody, DecisionBody, MemoryFeedInput, MemoryStatus, OwnMemory, PublicMemory, ReportResult } from "./schemas.ts";

// "İz Bırak" memories and their moderation.
//
//   submit ──▶ pending ──approve──▶ approved ──reports from REPORT_HIDE_THRESHOLD users──▶ pending
//                 └─────reject (reason mandatory)──▶ rejected (final) ◀──takedown (reason)── approved
//
// Only `approved` is public. A report ("Bildir") does not hide a memory by itself: it stays public
// until REPORT_HIDE_THRESHOLD different users have reported it since its last approval, then goes
// back to `pending`. Meanwhile it shows up in the moderation queue with its `reportCount`, and a
// moderator can decide it there: reject (final, takes it down) or approve (dismisses the reports;
// the memory stays public and counts reports from zero). A moderator may also take down an approved
// memory nobody reported (a rejection audited as `memory.takedown`); approving it again, and any
// decision on a rejected memory, is 409. A moderator can never decide their own memory (403), an admin can; an author can never
// report their own (403). Reports only apply to approved memories (anything else reads as 404, like
// content that is not public). Each user may file REPORT_QUOTA new reports per rolling
// REPORT_QUOTA_HOURS hours (429 after that).
// A rejection or takedown deletes the photo (row and public object); the text stays for the record.
// The author can delete their own memory in any status, an admin any memory: record and photo go for good.
// Whenever an approved memory is removed, its approval points are taken back once.
// Visitors (role `user`) hold at most PENDING_QUOTA pending memories and submit at most DAILY_MEMORY_QUOTA
// per rolling day, counted from the `memory.create` audit rows, so deleting a memory does not give its slot back.
// Reports, decisions and deletions lock the memory row first, so racing requests run one after the other.

/** Different users whose reports send an approved memory back to `pending`. */
export const REPORT_HIDE_THRESHOLD = 3;
/** New reports one user may file per rolling `REPORT_QUOTA_HOURS` hours. */
const REPORT_QUOTA = 5;
const REPORT_QUOTA_HOURS = 24;
/** Pending memories one visitor may have at once. */
export const PENDING_QUOTA = 3;
/** Memories one visitor may submit per rolling `DAILY_MEMORY_HOURS` hours, deleted ones included. */
export const DAILY_MEMORY_QUOTA = 10;
const DAILY_MEMORY_HOURS = 24;

/** Display name when the author has no profile yet. */
const DEFAULT_AUTHOR_NAME = "Ziyaretçi";
/** Latest report reasons shown per memory in the moderation queue. */
const LATEST_REASONS = 5;

type Exec = Db | Tx;
type Paged<T> = { items: T[]; nextCursor: string | null };
type PageInput = { cursor?: string | undefined; limit: number };

// ── queries ──────────────────────────────────────────────────────────────────

/**
 * `created_at` as exact microseconds since the epoch. Cursors carry this instead of a JS Date,
 * which rounds to milliseconds and would repeat or skip memories created within the same millisecond.
 */
const createdMicros = sql<string>`(extract(epoch from ${memories.createdAt}) * 1000000)::bigint::text`;

// NOTE: memoryRows is a joined select, so Drizzle qualifies the columns inside the `sql` field above.
const memoryColumns = {
  id: memories.id,
  siteId: memories.siteId,
  siteName: sites.name,
  siteStatus: sites.status,
  authorName: memories.authorName,
  text: memories.text,
  status: memories.status,
  reason: memories.reason,
  decidedBy: memories.decidedBy,
  decidedAt: memories.decidedAt,
  createdAt: memories.createdAt,
  createdMicros,
  photoId: media.id,
  photoUrl: media.url,
  photoAlt: media.alt,
};

type MemoryRow = {
  id: string;
  siteId: string;
  siteName: string;
  siteStatus: string;
  authorName: string;
  text: string;
  status: MemoryStatus;
  reason: string | null;
  decidedBy: string | null;
  decidedAt: Date | null;
  createdAt: Date;
  createdMicros: string;
  photoId: string | null;
  photoUrl: string | null;
  photoAlt: string | null;
};

const memoryRows = (db: Exec) =>
  db
    .select(memoryColumns)
    .from(memories)
    .innerJoin(sites, eq(sites.id, memories.siteId))
    .leftJoin(media, eq(media.id, memories.mediaId));

async function oneMemory(db: Exec, id: string): Promise<MemoryRow> {
  const [row] = await memoryRows(db).where(eq(memories.id, id));
  if (!row) throw new AppError(404, "NOT_FOUND", "Anı bulunamadı.");
  return row;
}

/** Row-locks the memory so concurrent reports and decisions on it are serialized. */
async function lockMemory(tx: Tx, id: string) {
  const [row] = await tx.select().from(memories).where(eq(memories.id, id)).for("update");
  if (!row) throw new AppError(404, "NOT_FOUND", "Anı bulunamadı.");
  return row;
}

/** Predicate for the rows strictly after the cursor in `(created_at, id)` order. */
function resumeAfter(cursor: string, direction: "asc" | "desc"): SQL {
  const c = decodeCursor(cursor, ["t", "i"]);
  // Digits only: the value is turned into a timestamp in SQL, so anything else must not get that far.
  if (!/^\d{1,16}$/.test(c.t)) throw new AppError(400, "INVALID_CURSOR", "İmleç geçersiz.", { cursor: ["Geçersiz imleç."] });
  const at = sql`(timestamptz 'epoch' + ${c.t}::float8 * interval '1 microsecond')`;
  const op = sql.raw(direction === "asc" ? ">" : "<");
  return sql`(${memories.createdAt}, ${memories.id} COLLATE "C") ${op} (${at}, ${c.i})`;
}

/** One keyset page ordered by `(created_at, id)`; pages never repeat or skip a row. */
async function fetchPage(db: Exec, input: PageInput, filters: SQL[], direction: "asc" | "desc") {
  const where = input.cursor ? [...filters, resumeAfter(input.cursor, direction)] : filters;
  const order =
    direction === "asc"
      ? [asc(memories.createdAt), sql`${memories.id} COLLATE "C" ASC`]
      : [desc(memories.createdAt), sql`${memories.id} COLLATE "C" DESC`];
  const fetched = await memoryRows(db)
    .where(and(...where))
    .orderBy(...order)
    .limit(input.limit + 1);

  const rows = fetched.slice(0, input.limit);
  const last = fetched.length > input.limit ? rows.at(-1) : undefined;
  return { rows, nextCursor: last ? encodeCursor({ t: last.createdMicros, i: last.id }) : null };
}

type ReportStats = { count: number; reasons: string[] };

/**
 * A report counts toward its memory while the memory is not `approved` (a pending or rejected memory
 * keeps all its reports) and, once approved, only when made after that approval: a moderator's
 * approval dismisses the reports before it, so one new report cannot hide a re-approved memory again.
 */
const reportsSinceApproval = sql`(${memories.status} <> 'approved' or ${memories.decidedAt} is null or ${memoryReports.createdAt} > ${memories.decidedAt})`;

/** Distinct reporters and latest reasons for `ids` (see `reportsSinceApproval`), in one grouped query. */
async function reportStats(db: Exec, ids: string[]): Promise<Map<string, ReportStats>> {
  if (!ids.length) return new Map();
  const rows = await db
    .select({
      memoryId: memoryReports.memoryId,
      count: sql<number>`count(distinct ${memoryReports.reporterId})::int`,
      reasons: sql<string[]>`(array_agg(${memoryReports.reason} order by ${memoryReports.createdAt} desc, ${memoryReports.id} desc))[1:${sql.raw(String(LATEST_REASONS))}]`,
    })
    .from(memoryReports)
    .innerJoin(memories, eq(memories.id, memoryReports.memoryId))
    .where(and(inArray(memoryReports.memoryId, ids), reportsSinceApproval))
    .groupBy(memoryReports.memoryId);
  return new Map(rows.map((r) => [r.memoryId, { count: r.count, reasons: r.reasons }]));
}

// ── DTOs ─────────────────────────────────────────────────────────────────────

const toOwn = (r: MemoryRow): OwnMemory => ({
  id: r.id,
  siteId: r.siteId,
  siteName: r.siteStatus === "published" ? r.siteName : null,
  text: r.text,
  photo: r.photoId ? { id: r.photoId, url: r.photoUrl ?? "", alt: r.photoAlt ?? "" } : null,
  status: r.status,
  reason: r.reason,
  createdAt: r.createdAt.toISOString(),
  decidedAt: r.decidedAt?.toISOString() ?? null,
});

/** The public shape, built field by field: the author is a name only, never an id or e-mail. */
const toPublic = (r: MemoryRow): PublicMemory => ({
  id: r.id,
  siteId: r.siteId,
  text: r.text,
  authorName: r.authorName,
  photo: r.photoId ? { id: r.photoId, url: r.photoUrl ?? "", alt: r.photoAlt ?? "" } : null,
  createdAt: r.createdAt.toISOString(),
});

const toAdmin = (r: MemoryRow, stats: ReportStats | undefined): AdminMemory => ({
  ...toOwn(r),
  siteName: r.siteName,
  authorName: r.authorName,
  decidedBy: r.decidedBy,
  reportCount: stats?.count ?? 0,
  reportReasons: stats?.reasons ?? [],
});

// ── reads ────────────────────────────────────────────────────────────────────

/** Approved memories of a published site, newest first. A site that is not published is 404. */
export async function listSiteMemories(db: Db, siteId: string, input: PageInput): Promise<Paged<PublicMemory>> {
  const [site] = await db.select({ id: sites.id }).from(sites).where(and(published, eq(sites.id, siteId)));
  if (!site) throw new AppError(404, "NOT_FOUND", "Eser bulunamadı.");
  const { rows, nextCursor } = await fetchPage(db, input, [eq(memories.siteId, siteId), eq(memories.status, "approved")], "desc");
  return { items: rows.map(toPublic), nextCursor };
}

/**
 * Approved memories of published sites in one feed, newest first, optionally narrowed to `siteIds`
 * and/or a city. Ids of drafts or unknown sites just match nothing, so the answer never tells them apart.
 */
export async function listMemoryFeed(db: Db, input: MemoryFeedInput): Promise<Paged<PublicMemory>> {
  const filters: SQL[] = [published, eq(memories.status, "approved")];
  if (input.siteIds) filters.push(inArray(memories.siteId, input.siteIds));
  if (input.city) filters.push(eq(sites.cityId, normalize(input.city)));
  const { rows, nextCursor } = await fetchPage(db, input, filters, "desc");
  return { items: rows.map(toPublic), nextCursor };
}

/** The author's own memories in every status ("Paylaşımlarım"), newest first. */
export async function listOwnMemories(db: Db, userId: string, input: PageInput): Promise<Paged<OwnMemory>> {
  const { rows, nextCursor } = await fetchPage(db, input, [eq(memories.authorId, userId)], "desc");
  return { items: rows.map(toOwn), nextCursor };
}

/** Moderation queue: memories in `status` (default pending), oldest first. */
export async function listModerationQueue(db: Db, input: PageInput & { status: MemoryStatus }): Promise<Paged<AdminMemory>> {
  // The default (pending) queue also carries approved memories that have been reported since their approval.
  const filter =
    input.status === "pending"
      ? or(eq(memories.status, "pending"), and(eq(memories.status, "approved"), sql`exists (select 1 from ${memoryReports} where ${memoryReports.memoryId} = ${memories.id} and ${reportsSinceApproval})`))!
      : eq(memories.status, input.status);
  const { rows, nextCursor } = await fetchPage(db, input, [filter], "asc");
  const stats = await reportStats(db, rows.map((r) => r.id));
  return { items: rows.map((r) => toAdmin(r, stats.get(r.id))), nextCursor };
}

// ── writes (call inside `idempotent`'s transaction) ──────────────────────────

/**
 * Always created `pending`. The site must be published and a photo must be the author's own upload. A visitor
 * (role `user`; staff are exempt) is held to `PENDING_QUOTA` and `DAILY_MEMORY_QUOTA` (429). Every submission
 * leaves a text-free `memory.create` audit row: the daily count reads those, which survive a deletion.
 */
export async function createMemory(tx: Tx, user: AuthUser, input: CreateMemoryBody, requestId: string): Promise<OwnMemory> {
  const userId = user.id;
  const [site] = await tx.select({ id: sites.id }).from(sites).where(and(published, eq(sites.id, input.siteId)));
  if (!site) throw new AppError(404, "NOT_FOUND", "Eser bulunamadı.");

  if (user.role === "user") {
    // One user's submissions are counted one after the other, so a burst cannot slip past either quota.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`moderation.create:${userId}`}))`);
    const [pending] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(memories)
      .where(and(eq(memories.authorId, userId), eq(memories.status, "pending")));
    if ((pending?.n ?? 0) >= PENDING_QUOTA) {
      throw new AppError(429, "RATE_LIMITED", `Onay bekleyen en fazla ${PENDING_QUOTA} anın olabilir. Biri karara bağlanınca yenisini gönderebilirsin.`);
    }
    const [today] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(auditLog)
      .where(
        and(
          eq(auditLog.actorId, userId),
          eq(auditLog.action, "memory.create"),
          sql`${auditLog.at} > now() - ${DAILY_MEMORY_HOURS} * interval '1 hour'`,
        ),
      );
    if ((today?.n ?? 0) >= DAILY_MEMORY_QUOTA) {
      throw new AppError(429, "RATE_LIMITED", `Son ${DAILY_MEMORY_HOURS} saatte en fazla ${DAILY_MEMORY_QUOTA} anı gönderebilirsin.`);
    }
  }

  if (input.mediaId !== undefined) {
    // FOR SHARE: the unattached-photo sweep cannot delete the photo while this memory is being attached to it.
    const [photo] = await tx
      .select({ id: media.id })
      .from(media)
      .where(and(eq(media.id, input.mediaId), eq(media.kind, "photo"), eq(media.uploadedBy, userId)))
      .for("share");
    // One answer for "not yours", "not a photo" and "unknown": it must not reveal other users' uploads.
    if (!photo) {
      throw new AppError(400, "VALIDATION_FAILED", "Girdi doğrulanamadı.", { mediaId: ["Fotoğraf bulunamadı ya da sana ait değil."] });
    }
  }

  const [profile] = await tx.select({ displayName: profiles.displayName }).from(profiles).where(eq(profiles.userId, userId));
  const id = randomUUID();
  await tx.insert(memories).values({
    id,
    siteId: site.id,
    authorId: userId,
    authorName: profile?.displayName.trim() || DEFAULT_AUTHOR_NAME,
    text: input.text,
    mediaId: input.mediaId ?? null,
    status: "pending",
    kvkkConsentAt: new Date(),
    kvkkTextVersion: input.kvkkTextVersion,
  });
  await recordAudit(tx, {
    actorId: userId,
    action: "memory.create",
    entityType: "memory",
    entityId: id,
    after: { status: "pending", siteId: site.id, photo: input.mediaId !== undefined },
    requestId,
  });
  return toOwn(await oneMemory(tx, id));
}

/** Objects in the `media` bucket a removal freed; delete them with `deleteMediaObjects` after the commit. */
export type Removal<T> = { result: T; removedObjects: string[] };

/** Unlinks the memory's photo and deletes it when nothing else uses it; returns the objects to delete after commit. */
async function dropPhoto(tx: Tx, memory: { id: string; mediaId: string | null }): Promise<string[]> {
  if (!memory.mediaId) return [];
  await tx.update(memories).set({ mediaId: null, updatedAt: new Date() }).where(eq(memories.id, memory.id));
  return deleteUnreferencedMedia(tx, [memory.mediaId]);
}

/**
 * Approves or rejects a memory and audits it. Approval pays the author 25 points through the ledger, whose
 * unique key makes a second approval of the same memory (after a report) free. A rejection deletes the photo
 * and takes the approval points back if they were paid; rejecting an approved memory nobody reported is a
 * takedown (`memory.takedown`). Only an admin may decide a memory they wrote.
 */
export async function decideMemory(
  tx: Tx,
  moderator: AuthUser,
  id: string,
  decision: DecisionBody,
  requestId: string,
): Promise<Removal<AdminMemory>> {
  const moderatorId = moderator.id;
  const memory = await lockMemory(tx, id);
  if (memory.authorId === moderatorId && moderator.role !== "admin") {
    throw new AppError(403, "FORBIDDEN", "Kendi anını karara bağlayamazsın.");
  }
  // An approved memory can be re-approved only while it carries reports since its approval; it can always be taken down.
  const reported = memory.status === "approved" && ((await reportStats(tx, [id])).get(id)?.count ?? 0) > 0;
  if (memory.status === "rejected") {
    throw new AppError(409, "CONFLICT", "Bu anı reddedildi ve karar kesin. Yalnız beklemedeki ya da yayındaki anılar karara bağlanabilir.");
  }
  if (memory.status === "approved" && !reported && decision.status === "approved") {
    throw new AppError(409, "CONFLICT", "Bu anı zaten onaylı ve bildirilmemiş; onaylanacak bir şey yok. Yayından kaldırmak için nedenli ret gönder.");
  }
  const takedown = memory.status === "approved" && !reported;

  const reason = decision.status === "rejected" ? decision.reason : null;
  const now = new Date();
  // `decidedAt` is the DB clock: reports are stamped by it too, and "since the approval" compares the two.
  await tx
    .update(memories)
    .set({ status: decision.status, reason, decidedBy: moderatorId, decidedAt: sql`now()`, updatedAt: now })
    .where(eq(memories.id, id));
  await recordAudit(tx, {
    actorId: moderatorId,
    action: decision.status === "approved" ? "memory.approve" : takedown ? "memory.takedown" : "memory.reject",
    entityType: "memory",
    entityId: id,
    before: { status: memory.status, reason: memory.reason },
    after: { status: decision.status, reason },
    requestId,
  });
  let removedObjects: string[] = [];
  if (decision.status === "approved") {
    await recordPointEvent(tx, { userId: memory.authorId, action: "memory.approved", subjectId: id });
  } else {
    await takeBackMemoryPoints(tx, memory.authorId, id);
    removedObjects = await dropPhoto(tx, memory);
  }

  const stats = await reportStats(tx, [id]);
  return { result: toAdmin(await oneMemory(tx, id), stats.get(id)), removedObjects };
}

/**
 * Deletes a memory for good (KVKK erasure): the record, its reports and its photo, and takes the approval points
 * back if they were paid. `own` is the author's delete ("Sil"): somebody else's memory reads as 404, like an
 * unknown id. `any` is the admin's "Kalıcı sil". Audited as `memory.delete` without the text.
 */
export async function deleteMemory(tx: Tx, actor: AuthUser, id: string, scope: "own" | "any", requestId: string): Promise<Removal<null>> {
  const [memory] = await tx.select().from(memories).where(eq(memories.id, id)).for("update");
  if (!memory || (scope === "own" && memory.authorId !== actor.id)) throw new AppError(404, "NOT_FOUND", "Anı bulunamadı.");

  await takeBackMemoryPoints(tx, memory.authorId, id);
  await tx.delete(memories).where(eq(memories.id, id));
  const removedObjects = memory.mediaId ? await deleteUnreferencedMedia(tx, [memory.mediaId]) : [];
  await recordAudit(tx, {
    actorId: actor.id,
    action: "memory.delete",
    entityType: "memory",
    entityId: id,
    before: { status: memory.status, siteId: memory.siteId, photo: memory.mediaId !== null, byAuthor: memory.authorId === actor.id },
    requestId,
  });
  return { result: null, removedObjects };
}

/**
 * Account erasure (KVKK): deletes every memory the user wrote (any status, with its reports and photo) and every
 * report the user filed on other memories. A memory a deleted report had sent back to `pending` stays there for a
 * moderator. No points are taken back: the caller deletes the whole ledger. Photo objects go after the commit.
 */
export async function eraseMemories(tx: Tx, userId: string): Promise<Removal<{ memories: number; reports: number }>> {
  const own = await tx
    .select({ id: memories.id, mediaId: memories.mediaId })
    .from(memories)
    .where(eq(memories.authorId, userId))
    .for("update");
  if (own.length > 0) await tx.delete(memories).where(inArray(memories.id, own.map((m) => m.id)));
  const photos = own.flatMap((m) => (m.mediaId ? [m.mediaId] : []));
  const removedObjects = await deleteUnreferencedMedia(tx, photos);
  const reports = await tx.delete(memoryReports).where(eq(memoryReports.reporterId, userId)).returning({ id: memoryReports.id });
  return { result: { memories: own.length, reports: reports.length }, removedObjects };
}

/**
 * "Bildir": a user reports an approved memory once. The memory stays `approved` (public) until
 * `REPORT_HIDE_THRESHOLD` different users have reported it since its last approval; the report that
 * reaches the threshold sends it back to `pending`. Below that, moderators see it in the queue with
 * its `reportCount`. Repeating a report answers 200 and changes nothing (even when the memory has
 * meanwhile left `approved`) and does not count against the quota; a new report is 201 and at most
 * `REPORT_QUOTA` new reports per user per `REPORT_QUOTA_HOURS` hours are accepted (429 after that).
 */
export async function reportMemory(
  tx: Tx,
  reporterId: string,
  id: string,
  reason: string,
  requestId: string,
): Promise<{ status: 200 | 201; body: ReportResult }> {
  const memory = await lockMemory(tx, id);
  if (memory.authorId === reporterId) throw new AppError(403, "FORBIDDEN", "Kendi anını bildiremezsin.");

  const body = { id, reported: true } as const;
  const [prior] = await tx
    .select({ id: memoryReports.id })
    .from(memoryReports)
    .where(and(eq(memoryReports.memoryId, id), eq(memoryReports.reporterId, reporterId)));
  if (prior) return { status: 200, body };

  // Only public memories can be reported; any other state reads as "not found".
  if (memory.status !== "approved") throw new AppError(404, "NOT_FOUND", "Anı bulunamadı.");

  // One user's reports on different memories are counted one after the other, so the quota holds under races.
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`moderation.report:${reporterId}`}))`);
  const [recent] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(memoryReports)
    .where(and(eq(memoryReports.reporterId, reporterId), sql`${memoryReports.createdAt} > now() - ${REPORT_QUOTA_HOURS} * interval '1 hour'`));
  if ((recent?.n ?? 0) >= REPORT_QUOTA) {
    throw new AppError(429, "RATE_LIMITED", `Son ${REPORT_QUOTA_HOURS} saatte en fazla ${REPORT_QUOTA} yeni bildirim gönderebilirsin.`);
  }

  await tx.insert(memoryReports).values({ id: randomUUID(), memoryId: id, reporterId, reason });
  const reporters = (await reportStats(tx, [id])).get(id)?.count ?? 0;
  if (reporters < REPORT_HIDE_THRESHOLD) {
    await recordAudit(tx, {
      actorId: reporterId,
      action: "memory.report",
      entityType: "memory",
      entityId: id,
      before: { status: memory.status },
      after: { status: memory.status, reporters },
      requestId,
    });
    return { status: 201, body };
  }

  // Back to the queue: a pending memory carries no decision, and its wait starts now (health box, §11.25).
  const now = new Date();
  await tx.update(memories).set({ status: "pending", decidedBy: null, decidedAt: null, pendingSince: now, updatedAt: now }).where(eq(memories.id, id));
  await recordAudit(tx, {
    actorId: reporterId,
    action: "memory.report",
    entityType: "memory",
    entityId: id,
    before: { status: memory.status },
    after: { status: "pending", reporters },
    requestId,
  });
  return { status: 201, body };
}
