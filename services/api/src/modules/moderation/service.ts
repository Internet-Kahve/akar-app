import { and, asc, desc, eq, inArray, or, sql, type SQL } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Db } from "../../db/client.ts";
import { media, memories, memoryReports, profiles, sites } from "../../db/schema/index.ts";
import { AppError } from "../../errors.ts";
import { recordAudit } from "../../platform/audit.ts";
import type { Tx } from "../../platform/idempotency.ts";
import { decodeCursor, encodeCursor } from "../../platform/pagination.ts";
import { published } from "../catalog/service.ts";
import { recordPointEvent } from "../engagement/points.ts";
import type { AdminMemory, CreateMemoryBody, DecisionBody, MemoryStatus, OwnMemory, PublicMemory, ReportResult } from "./schemas.ts";

// "İz Bırak" memories and their moderation.
//
//   submit ──▶ pending ──approve──▶ approved ──reports from REPORT_HIDE_THRESHOLD users──▶ pending
//                 └─────reject (reason mandatory)──▶ rejected (final)
//
// Only `approved` is public. A report ("Bildir") does not hide a memory by itself: it stays public
// until REPORT_HIDE_THRESHOLD different users have reported it since its last approval, then goes
// back to `pending`. Meanwhile it shows up in the moderation queue with its `reportCount`, and a
// moderator can decide it there: reject (final, takes it down) or approve (dismisses the reports;
// the memory stays public and counts reports from zero). An approved memory without reports and a
// rejected one are 409. A moderator can never decide their own memory (403); an author can never
// report their own (403). Reports only apply to approved memories (anything else reads as 404, like
// content that is not public). Each user may file REPORT_QUOTA new reports per rolling
// REPORT_QUOTA_HOURS hours (429 after that).
// Reports and decisions lock the memory row first, so racing requests run one after the other.

/** Different users whose reports send an approved memory back to `pending`. */
export const REPORT_HIDE_THRESHOLD = 3;
/** New reports one user may file per rolling `REPORT_QUOTA_HOURS` hours. */
const REPORT_QUOTA = 5;
const REPORT_QUOTA_HOURS = 24;

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

const toAdmin = (r: MemoryRow, stats: ReportStats | undefined): AdminMemory => ({
  ...toOwn(r),
  siteName: r.siteName,
  authorName: r.authorName,
  decidedBy: r.decidedBy,
  reportCount: stats?.count ?? 0,
  reportReasons: stats?.reasons ?? [],
});

// ── reads ────────────────────────────────────────────────────────────────────

/**
 * Approved memories of a published site, newest first. A site that is not published is 404.
 * The public shape is built field by field: the author is a name only, never an id or e-mail.
 */
export async function listSiteMemories(db: Db, siteId: string, input: PageInput): Promise<Paged<PublicMemory>> {
  const [site] = await db.select({ id: sites.id }).from(sites).where(and(published, eq(sites.id, siteId)));
  if (!site) throw new AppError(404, "NOT_FOUND", "Eser bulunamadı.");
  const { rows, nextCursor } = await fetchPage(db, input, [eq(memories.siteId, siteId), eq(memories.status, "approved")], "desc");
  return {
    items: rows.map((r) => ({
      id: r.id,
      siteId: r.siteId,
      text: r.text,
      authorName: r.authorName,
      photo: r.photoId ? { id: r.photoId, url: r.photoUrl ?? "", alt: r.photoAlt ?? "" } : null,
      createdAt: r.createdAt.toISOString(),
    })),
    nextCursor,
  };
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

/** Always created `pending`. The site must be published and a photo must be the author's own upload. */
export async function createMemory(tx: Tx, userId: string, input: CreateMemoryBody): Promise<OwnMemory> {
  const [site] = await tx.select({ id: sites.id }).from(sites).where(and(published, eq(sites.id, input.siteId)));
  if (!site) throw new AppError(404, "NOT_FOUND", "Eser bulunamadı.");

  if (input.mediaId !== undefined) {
    const [photo] = await tx
      .select({ id: media.id })
      .from(media)
      .where(and(eq(media.id, input.mediaId), eq(media.kind, "photo"), eq(media.uploadedBy, userId)));
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
  return toOwn(await oneMemory(tx, id));
}

/**
 * Approves or rejects a pending memory and audits it. Approval pays the author 25 points through
 * the ledger, whose unique key makes a second approval of the same memory (after a report) free.
 */
export async function decideMemory(tx: Tx, moderatorId: string, id: string, decision: DecisionBody, requestId: string): Promise<AdminMemory> {
  const memory = await lockMemory(tx, id);
  if (memory.authorId === moderatorId) throw new AppError(403, "FORBIDDEN", "Kendi anını karara bağlayamazsın.");
  // An approved memory is decidable only while it carries reports since its approval.
  const reported = memory.status === "approved" && ((await reportStats(tx, [id])).get(id)?.count ?? 0) > 0;
  if (memory.status === "rejected" || (memory.status === "approved" && !reported)) {
    throw new AppError(
      409,
      "CONFLICT",
      memory.status === "approved"
        ? "Bu anı zaten onaylı ve bildirilmemiş. Yalnız beklemedeki ya da bildirilmiş anılar karara bağlanabilir."
        : "Bu anı reddedildi ve karar kesin. Yalnız beklemedeki ya da bildirilmiş anılar karara bağlanabilir.",
    );
  }

  const reason = decision.status === "rejected" ? decision.reason : null;
  const now = new Date();
  // `decidedAt` is the DB clock: reports are stamped by it too, and "since the approval" compares the two.
  await tx
    .update(memories)
    .set({ status: decision.status, reason, decidedBy: moderatorId, decidedAt: sql`now()`, updatedAt: now })
    .where(eq(memories.id, id));
  await recordAudit(tx, {
    actorId: moderatorId,
    action: decision.status === "approved" ? "memory.approve" : "memory.reject",
    entityType: "memory",
    entityId: id,
    before: { status: memory.status, reason: memory.reason },
    after: { status: decision.status, reason },
    requestId,
  });
  if (decision.status === "approved") {
    await recordPointEvent(tx, { userId: memory.authorId, action: "memory.approved", subjectId: id });
  }

  const stats = await reportStats(tx, [id]);
  return toAdmin(await oneMemory(tx, id), stats.get(id));
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

  // Back to the queue: a pending memory carries no decision.
  await tx.update(memories).set({ status: "pending", decidedBy: null, decidedAt: null, updatedAt: new Date() }).where(eq(memories.id, id));
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
