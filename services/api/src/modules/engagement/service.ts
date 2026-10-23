import { and, count, desc, eq, inArray, isNotNull, ne, sql, type AnyColumn, type SQL } from "drizzle-orm";
import type { FastifyRequest } from "fastify";
import type { Config } from "../../config.ts";
import type { Db } from "../../db/client.ts";
import {
  catalogRoutes,
  media,
  pointEvents,
  quizAnswers,
  quizProgress,
  quizzes,
  routeStops,
  savedSites,
  sites,
  storyBlocks,
  storyProgress,
  userBadges,
  userRouteStops,
} from "../../db/schema/index.ts";
import { AppError } from "../../errors.ts";
import type { Tx } from "../../platform/idempotency.ts";
import { decodeCursor, encodeCursor } from "../../platform/pagination.ts";
import { TrustSchema, type SiteSummary } from "../catalog/schemas.ts";
import { getPublishedSummaries, published } from "../catalog/service.ts";
import { checkQuizAnswer, playableQuiz } from "../routes/quizzes.ts";
import { POINT_ACTIONS, pointsOf, receiptRedeemed, recordPointEvent, type PointAction } from "./points.ts";
import { issueReceipt, receiptSecret, verifyReceipt, type ReceiptPayload } from "./receipts.ts";
import { DeviceId, type PassportResponse, type ProgressEntry, type ReceiptResult, type ReceiptsResponse } from "./schemas.ts";

type Reader = Tx | Db;
type Page = { cursor?: string | undefined; limit: number };

/** Who is playing: a signed-in user (points go to the ledger) or a guest device (gets receipts). */
export type Player = { kind: "user"; id: string } | { kind: "guest"; id: string; deviceId: string };

/** `x-device-id` is required for guests only. A guest's player id is `guest:<deviceId>`. */
export function playerOf(req: Pick<FastifyRequest, "user" | "headers">): Player {
  if (req.user) return { kind: "user", id: req.user.id };
  const device = DeviceId.safeParse(req.headers["x-device-id"]);
  if (!device.success) {
    throw new AppError(400, "VALIDATION_FAILED", "Girdi doğrulanamadı.", {
      "x-device-id": ["Oturum açmamış istekler için geçerli bir x-device-id (UUID) başlığı gerekli."],
    });
  }
  const deviceId = device.data.toLowerCase();
  return { kind: "guest", id: `guest:${deviceId}`, deviceId };
}

const notFound = (what: string) => new AppError(404, "NOT_FOUND", `${what} bulunamadı.`);
const unique = <T>(items: T[]): T[] => [...new Set(items)];

function one<T>(rows: T[]): T {
  const [row] = rows;
  if (row === undefined) throw new Error("Expected a row.");
  return row;
}

// ── keyset pages over (time desc, site id desc) ──────────────────────────────

/**
 * Microseconds since the epoch of a timestamptz column, as a bigint (text on the wire). Cursors carry
 * it instead of a JS Date, so rows saved within the same millisecond are neither repeated nor skipped.
 */
const epochMicros = (col: AnyColumn) => sql<string>`(extract(epoch from ${col}) * 1000000)::bigint`;

/** Predicate for the rows strictly after `cursor` in `(at desc, id desc)` order; undefined for the first page. */
function keysetAfter(cursor: string | undefined, at: SQL, id: AnyColumn): SQL | undefined {
  if (cursor === undefined) return undefined;
  const c = decodeCursor(cursor, ["t", "i"]);
  if (!/^\d{1,18}$/.test(c.t)) throw new AppError(400, "INVALID_CURSOR", "İmleç geçersiz.", { cursor: ["Geçersiz imleç."] });
  return sql`(${at}, ${id} COLLATE "C") < (${c.t}::bigint, ${c.i})`;
}

// ── story and quiz lookups (read-only gates) ─────────────────────────────────

/** Story length of each published site among `siteIds`; drafts and unknown ids are absent (length 0 = no story). */
async function publishedStoryLengths(db: Reader, siteIds: string[]): Promise<Map<string, number>> {
  if (!siteIds.length) return new Map();
  const rows = await db
    .select({ id: sites.id, total: count(storyBlocks.id) })
    .from(sites)
    .leftJoin(storyBlocks, eq(storyBlocks.siteId, sites.id))
    .where(and(inArray(sites.id, siteIds), published))
    .groupBy(sites.id);
  return new Map(rows.map((r) => [r.id, r.total]));
}

/** Story length of a published site; null when the site is not published or has no story (a 404 to callers). */
async function publishedStoryLength(db: Reader, siteId: string): Promise<number | null> {
  const total = (await publishedStoryLengths(db, [siteId])).get(siteId);
  return total ? total : null;
}

/** Published subset of `siteIds`. */
async function publishedSiteIds(db: Reader, siteIds: string[]): Promise<Set<string>> {
  if (!siteIds.length) return new Set();
  const rows = await db.select({ id: sites.id }).from(sites).where(and(inArray(sites.id, siteIds), published));
  return new Set(rows.map((r) => r.id));
}

/** Quizzes among `quizIds` whose site is published (the same gate as `playableQuiz`). Ids only. */
async function playableQuizIds(db: Reader, quizIds: string[]): Promise<Set<string>> {
  if (!quizIds.length) return new Set();
  const rows = await db
    .select({ id: quizzes.id })
    .from(quizzes)
    .innerJoin(sites, and(eq(sites.id, quizzes.siteId), published))
    .where(inArray(quizzes.id, quizIds));
  return new Set(rows.map((r) => r.id));
}

// ── saved ────────────────────────────────────────────────────────────────────

/**
 * State-setting: `saved = true` keeps the site saved, `false` removes it, however often it is called.
 * Only published sites can be saved; removing never needs the site to still be public.
 */
export async function setSaved(tx: Tx, userId: string, siteId: string, saved: boolean): Promise<{ siteId: string; saved: boolean }> {
  if (saved) {
    if (!(await publishedSiteIds(tx, [siteId])).has(siteId)) throw notFound("Eser");
    await tx.insert(savedSites).values({ userId, siteId }).onConflictDoNothing();
  } else {
    await tx.delete(savedSites).where(and(eq(savedSites.userId, userId), eq(savedSites.siteId, siteId)));
  }
  return { siteId, saved };
}

/** Saved sites that are still published, newest first, as the catalog's summaries. */
export async function listSaved(db: Db, userId: string, page: Page): Promise<{ items: SiteSummary[]; nextCursor: string | null }> {
  const at = epochMicros(savedSites.createdAt);
  const rows = await db
    .select({ siteId: savedSites.siteId, t: at })
    .from(savedSites)
    .innerJoin(sites, and(eq(sites.id, savedSites.siteId), published))
    .where(and(eq(savedSites.userId, userId), keysetAfter(page.cursor, at, savedSites.siteId)))
    .orderBy(desc(at), sql`${savedSites.siteId} COLLATE "C" DESC`)
    .limit(page.limit + 1);

  const shown = rows.slice(0, page.limit);
  const summaries = await getPublishedSummaries(db, shown.map((r) => r.siteId));
  const last = rows.length > page.limit ? shown.at(-1) : undefined;
  return {
    items: shown.flatMap((r) => {
      const site = summaries.get(r.siteId);
      return site ? [site] : [];
    }),
    nextCursor: last ? encodeCursor({ t: last.t, i: last.siteId }) : null,
  };
}

// ── my route ("Rotam") ───────────────────────────────────────────────────────

/** "Rotam" in order; a stop whose site is no longer published is left out (its row stays). */
export async function getMyRoute(db: Reader, userId: string): Promise<{ siteIds: string[] }> {
  const rows = await db
    .select({ siteId: userRouteStops.siteId })
    .from(userRouteStops)
    .innerJoin(sites, and(eq(sites.id, userRouteStops.siteId), published))
    .where(eq(userRouteStops.userId, userId))
    .orderBy(userRouteStops.position);
  return { siteIds: rows.map((r) => r.siteId) };
}

/**
 * Replaces the whole of "Rotam" (hidden stops included). Every site must be published (else 404, as for
 * saving). One lock per user: two concurrent replacements run one after the other instead of mixing.
 */
export async function setMyRoute(tx: Tx, userId: string, siteIds: string[]): Promise<{ siteIds: string[] }> {
  const visible = await publishedSiteIds(tx, siteIds);
  if (siteIds.some((id) => !visible.has(id))) throw notFound("Eser");
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`engagement.route:${userId}`}))`);
  await tx.delete(userRouteStops).where(eq(userRouteStops.userId, userId));
  if (siteIds.length) await tx.insert(userRouteStops).values(siteIds.map((siteId, position) => ({ userId, siteId, position })));
  return { siteIds };
}

// ── story progress ───────────────────────────────────────────────────────────

type ProgressRow = { siteId: string; lastBlock: number; completedAt: Date | null; updatedAt: Date };

const entryOf = (r: ProgressRow, total: number): ProgressEntry => ({
  siteId: r.siteId,
  lastBlock: Math.min(r.lastBlock, Math.max(total - 1, 0)),
  total,
  completed: r.completedAt !== null,
  updatedAt: r.updatedAt.toISOString(),
});

/**
 * Stores the furthest block reached: a smaller `lastBlock` than the stored one changes nothing but
 * the touch time. The block must exist in the published story.
 */
export async function setProgress(tx: Tx, userId: string, siteId: string, lastBlock: number): Promise<ProgressEntry> {
  const total = await publishedStoryLength(tx, siteId);
  if (total === null) throw notFound("Hikâye");
  if (lastBlock >= total) {
    throw new AppError(400, "VALIDATION_FAILED", "Girdi doğrulanamadı.", {
      lastBlock: [`Hikâyede ${total} blok var; en çok ${total - 1} olabilir.`],
    });
  }
  const row = one(
    await tx
      .insert(storyProgress)
      .values({ userId, siteId, lastBlock })
      .onConflictDoUpdate({
        target: [storyProgress.userId, storyProgress.siteId],
        set: { lastBlock: sql`greatest(${storyProgress.lastBlock}, excluded.last_block)`, updatedAt: sql`now()` },
      })
      .returning({ siteId: storyProgress.siteId, lastBlock: storyProgress.lastBlock, completedAt: storyProgress.completedAt, updatedAt: storyProgress.updatedAt }),
  );
  return entryOf(row, total);
}

/** Completion time is the first completion; the furthest block becomes the last one. */
async function markStoryCompleted(tx: Tx, userId: string, siteId: string, total: number): Promise<void> {
  await tx
    .insert(storyProgress)
    .values({ userId, siteId, lastBlock: total - 1, completedAt: sql`now()` })
    .onConflictDoUpdate({
      target: [storyProgress.userId, storyProgress.siteId],
      set: {
        lastBlock: sql`greatest(${storyProgress.lastBlock}, excluded.last_block)`,
        completedAt: sql`coalesce(${storyProgress.completedAt}, now())`,
        updatedAt: sql`now()`,
      },
    });
}

/** Progress of the user's published sites, most recently read first, with each site's story length. */
async function progressEntries(db: Db, userId: string, page: Page): Promise<{ entries: ProgressEntry[]; nextCursor: string | null }> {
  const at = epochMicros(storyProgress.updatedAt);
  const rows = await db
    .select({
      siteId: storyProgress.siteId,
      lastBlock: storyProgress.lastBlock,
      completedAt: storyProgress.completedAt,
      updatedAt: storyProgress.updatedAt,
      t: at,
    })
    .from(storyProgress)
    .innerJoin(sites, and(eq(sites.id, storyProgress.siteId), published))
    .where(and(eq(storyProgress.userId, userId), keysetAfter(page.cursor, at, storyProgress.siteId)))
    .orderBy(desc(at), sql`${storyProgress.siteId} COLLATE "C" DESC`)
    .limit(page.limit + 1);

  const shown = rows.slice(0, page.limit);
  const totals = await publishedStoryLengths(db, shown.map((r) => r.siteId));
  const last = rows.length > page.limit ? shown.at(-1) : undefined;
  return {
    entries: shown.map((r) => entryOf(r, totals.get(r.siteId) ?? 0)),
    nextCursor: last ? encodeCursor({ t: last.t, i: last.siteId }) : null,
  };
}

export async function listProgress(db: Db, userId: string, page: Page) {
  const { entries, nextCursor } = await progressEntries(db, userId, page);
  const summaries = await getPublishedSummaries(db, entries.map((e) => e.siteId));
  return {
    items: entries.flatMap((e) => {
      const site = summaries.get(e.siteId);
      return site ? [{ ...e, site }] : [];
    }),
    nextCursor,
  };
}

// ── badges ───────────────────────────────────────────────────────────────────

/** Ledger actions that count a stop as done for a route badge. */
const BADGE_ACTIONS = ["story.complete", "visit.verified"] as const satisfies readonly PointAction[];

/**
 * Awards `user_badges` for every published route with a badge whose published stops the user has all
 * finished (story completed or visit verified). A route without a published stop never qualifies.
 * Returns the routes newly awarded. Call in the transaction that just wrote the ledger event.
 */
export async function awardBadges(tx: Tx, userId: string): Promise<string[]> {
  // Two requests of one user that finish a route's last two stops at the same time must each see the
  // other's event: the later one waits here until the earlier one has committed.
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`badges:${userId}`}))`);

  const stops = await tx
    .select({ routeId: routeStops.routeId, siteId: routeStops.siteId })
    .from(routeStops)
    .innerJoin(
      catalogRoutes,
      and(
        eq(catalogRoutes.id, routeStops.routeId),
        eq(catalogRoutes.status, "published"),
        isNotNull(catalogRoutes.badgeTitle),
        ne(catalogRoutes.badgeTitle, ""),
      ),
    )
    .innerJoin(sites, and(eq(sites.id, routeStops.siteId), published));
  if (!stops.length) return [];

  const doneRows = await tx
    .select({ siteId: pointEvents.subjectId })
    .from(pointEvents)
    .where(
      and(
        eq(pointEvents.userId, userId),
        inArray(pointEvents.action, [...BADGE_ACTIONS]),
        inArray(pointEvents.subjectId, unique(stops.map((s) => s.siteId))),
      ),
    );
  const done = new Set(doneRows.map((r) => r.siteId));

  const complete = new Map<string, boolean>();
  for (const s of stops) complete.set(s.routeId, (complete.get(s.routeId) ?? true) && done.has(s.siteId));
  const earned = [...complete].filter(([, all]) => all).map(([routeId]) => routeId);
  if (!earned.length) return [];

  const rows = await tx
    .insert(userBadges)
    .values(earned.map((routeId) => ({ userId, routeId })))
    .onConflictDoNothing()
    .returning({ routeId: userBadges.routeId });
  return rows.map((r) => r.routeId);
}

// ── stories ──────────────────────────────────────────────────────────────────

/**
 * Completing a published story with at least one block. A user earns `story.complete` once and may
 * earn route badges; a guest gets a receipt to redeem after sign-in.
 */
export async function completeStory(
  tx: Tx,
  config: Config,
  player: Player,
  siteId: string,
): Promise<{ awarded: number; receipt?: string }> {
  const total = await publishedStoryLength(tx, siteId);
  if (total === null) throw notFound("Hikâye");

  if (player.kind === "guest") {
    const receipt = issueReceipt(receiptSecret(config), { action: "story.complete", subjectId: siteId, deviceId: player.deviceId });
    return { awarded: 0, receipt };
  }
  await markStoryCompleted(tx, player.id, siteId, total);
  const gained = await recordPointEvent(tx, { userId: player.id, action: "story.complete", subjectId: siteId });
  await awardBadges(tx, player.id);
  return { awarded: gained ? POINT_ACTIONS["story.complete"] : 0 };
}

// ── quizzes ──────────────────────────────────────────────────────────────────

/** Highest `wrong_attempts` (smallint). Only "at least one" matters, so the counter saturates. */
const SMALLINT_MAX = 32767;

const progressKey = (player: Player, quizId: string) => and(eq(quizProgress.playerId, player.id), eq(quizProgress.quizId, quizId));

/** A hint is a non-blank text; the empty string is no hint. */
const hintOf = (hint: string | null): string | null => (hint !== null && hint.trim() !== "" ? hint : null);

/** The playable quiz (never the answer key) with this player's state; the hint appears after a wrong attempt. */
export async function getQuizState(db: Db, player: Player, quizId: string) {
  const quiz = await playableQuiz(db, quizId);
  if (!quiz) throw notFound("Bulmaca");
  const [state] = await db.select().from(quizProgress).where(progressKey(player, quizId));
  const hint = (state?.wrongAttempts ?? 0) >= 1 ? hintOf(quiz.hint) : null;
  return { ...quiz, hint, hintAvailable: hint !== null, revealed: state?.revealed ?? false, solved: Boolean(state?.solvedAt) };
}

/**
 * Checks a choice on the server. A wrong answer counts and unlocks the hint. The first correct
 * answer earns points (user) or a receipt (guest) unless the player revealed the answer; the
 * progress row is locked so two simultaneous correct answers cannot both earn.
 */
export async function submitAnswer(tx: Tx, config: Config, player: Player, quizId: string, choice: number) {
  const check = await checkQuizAnswer(tx, quizId, choice);
  if (!check) throw notFound("Bulmaca");

  await tx.insert(quizProgress).values({ playerId: player.id, quizId }).onConflictDoNothing();

  if (!check.correct) {
    await tx
      .update(quizProgress)
      .set({ wrongAttempts: sql`least(${quizProgress.wrongAttempts} + 1, ${SMALLINT_MAX})`, updatedAt: sql`now()` })
      .where(progressKey(player, quizId));
    const hint = hintOf((await playableQuiz(tx, quizId))?.hint ?? null);
    return { correct: false, awarded: 0, ...(hint !== null ? { hint } : {}) };
  }

  const state = one(await tx.select().from(quizProgress).where(progressKey(player, quizId)).for("update"));
  const earnable = !state.revealed && state.solvedAt === null;
  if (state.solvedAt === null) {
    await tx.update(quizProgress).set({ solvedAt: sql`now()`, updatedAt: sql`now()` }).where(progressKey(player, quizId));
  }

  let awarded = 0;
  let receipt: string | undefined;
  if (earnable) {
    if (player.kind === "guest") {
      receipt = issueReceipt(receiptSecret(config), { action: "quiz.correct", subjectId: quizId, deviceId: player.deviceId });
    } else if (await recordPointEvent(tx, { userId: player.id, action: "quiz.correct", subjectId: quizId })) {
      awarded = POINT_ACTIONS["quiz.correct"];
    }
  }
  return {
    correct: true,
    awarded,
    ...(receipt !== undefined ? { receipt } : {}),
    ...(check.explanation
      ? { explanation: { text: check.explanation, sourceId: check.sourceId, trust: TrustSchema.parse(check.trust) } }
      : {}),
  };
}

/**
 * "Cevabı göster": the one place the right option leaves the server, by explicit request. The player
 * can no longer earn points for this quiz. Reads `quiz_answers` only here (and in `checkQuizAnswer`).
 */
export async function revealAnswer(tx: Tx, player: Player, quizId: string): Promise<{ correctOption: string }> {
  const quiz = await playableQuiz(tx, quizId);
  if (!quiz) throw notFound("Bulmaca");
  const [key] = await tx.select({ correctIndex: quizAnswers.correctIndex }).from(quizAnswers).where(eq(quizAnswers.quizId, quizId));
  const correctOption = key === undefined ? undefined : quiz.options[key.correctIndex];
  if (correctOption === undefined) throw notFound("Bulmaca");

  await tx
    .insert(quizProgress)
    .values({ playerId: player.id, quizId, revealed: true })
    .onConflictDoUpdate({ target: [quizProgress.playerId, quizProgress.quizId], set: { revealed: true, updatedAt: sql`now()` } });
  return { correctOption };
}

// ── visits ───────────────────────────────────────────────────────────────────

/** Readings less accurate than this (metres) are refused outright. */
const MAX_ACCURACY_M = 100;
/** The accuracy radius is forgiven up to this much when measuring the distance. */
const MAX_SLACK_M = 50;

/**
 * Geofence check (D4b): verified when `distance - min(accuracyM, 50) <= VISIT_RADIUS_M`, distance
 * being the PostGIS geography distance to the published site. The coordinates exist only as bound
 * parameters of that one query: never stored, never logged, never returned (only a near/far band).
 */
export async function verifyVisit(
  tx: Tx,
  config: Config,
  player: Player,
  input: { siteId: string; coordinates: [number, number]; accuracyM: number },
) {
  if (input.accuracyM > MAX_ACCURACY_M) {
    throw new AppError(422, "LOCATION_ACCURACY_INSUFFICIENT", "Konum hassasiyeti yetersiz.", {
      accuracyM: [`Hassasiyet en fazla ${MAX_ACCURACY_M} metre olmalı.`],
    });
  }
  const [lng, lat] = input.coordinates;
  const slack = Math.min(input.accuracyM, MAX_SLACK_M);
  const [row] = await tx
    .select({
      near: sql<boolean>`ST_Distance(${sites.location}::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) - ${slack}::float8 <= ${config.VISIT_RADIUS_M}::float8`,
    })
    .from(sites)
    .where(and(eq(sites.id, input.siteId), published));
  if (!row) throw notFound("Eser");

  const verified = row.near;
  let awarded = 0;
  let receipt: string | undefined;
  if (verified) {
    if (player.kind === "guest") {
      receipt = issueReceipt(receiptSecret(config), { action: "visit.verified", subjectId: input.siteId, deviceId: player.deviceId });
    } else {
      if (await recordPointEvent(tx, { userId: player.id, action: "visit.verified", subjectId: input.siteId })) {
        awarded = POINT_ACTIONS["visit.verified"];
      }
      await awardBadges(tx, player.id);
    }
  }
  return {
    verified,
    distanceBand: verified ? ("near" as const) : ("far" as const),
    awarded,
    ...(receipt !== undefined ? { receipt } : {}),
  };
}

// ── receipts ─────────────────────────────────────────────────────────────────

/** Quizzes among `quizIds` whose answer `userId` revealed. */
async function revealedQuizIds(tx: Tx, userId: string, quizIds: string[]): Promise<Set<string>> {
  if (!quizIds.length) return new Set();
  const rows = await tx
    .select({ id: quizProgress.quizId })
    .from(quizProgress)
    .where(and(eq(quizProgress.playerId, userId), eq(quizProgress.revealed, true), inArray(quizProgress.quizId, quizIds)));
  return new Set(rows.map((r) => r.id));
}

/**
 * Redeems guest receipts into `userId`'s ledger, one result per receipt and never an error for a bad
 * one. A receipt earns only when its signature, version, expiry and action check out, its subject is
 * still published, and its `jti` is unused (`point_events.receipt_id` is unique). A valid receipt
 * for something the user already has is accepted with 0 points. A `quiz.correct` receipt for a quiz
 * the user themselves revealed ("Cevabı göster") is rejected as `revealed`, as an answer given after
 * a reveal would have been. The user's own progress rows follow (story completed, quiz solved) so
 * every screen agrees with the ledger.
 */
export async function redeemReceipts(tx: Tx, config: Config, userId: string, tokens: string[]): Promise<ReceiptsResponse> {
  const secret = receiptSecret(config);
  const checks = tokens.map((token) => verifyReceipt(secret, token));
  const payloads = checks.flatMap((c) => (c.ok ? [c.payload] : []));

  const lengths = await publishedStoryLengths(
    tx,
    unique(payloads.filter((p) => p.act !== "quiz.correct").map((p) => p.sub)),
  );
  const quizSubjects = unique(payloads.filter((p) => p.act === "quiz.correct").map((p) => p.sub));
  const playable = await playableQuizIds(tx, quizSubjects);
  const revealed = await revealedQuizIds(tx, userId, quizSubjects);
  const subjectExists = (p: ReceiptPayload): boolean =>
    p.act === "quiz.correct" ? playable.has(p.sub) : p.act === "story.complete" ? (lengths.get(p.sub) ?? 0) > 0 : lengths.has(p.sub);

  const results: ReceiptResult[] = [];
  const accepted: ReceiptPayload[] = [];
  let awarded = 0;
  for (const check of checks) {
    if (!check.ok) {
      results.push({ ok: false, reason: check.reason });
      continue;
    }
    const p = check.payload;
    if (!subjectExists(p)) {
      results.push({ ok: false, reason: "subject_not_found" });
      continue;
    }
    if (p.act === "quiz.correct" && revealed.has(p.sub)) {
      // Rejected before the ledger is touched, so the receipt's jti stays unused. A receipt that
      // was already redeemed keeps reporting `already_redeemed`.
      results.push({ ok: false, reason: (await receiptRedeemed(tx, p.jti)) ? "already_redeemed" : "revealed" });
      continue;
    }
    const gained = await recordPointEvent(tx, { userId, action: p.act, subjectId: p.sub, receiptId: p.jti });
    if (!gained && (await receiptRedeemed(tx, p.jti))) {
      results.push({ ok: false, reason: "already_redeemed" });
      continue;
    }
    const points = gained ? POINT_ACTIONS[p.act] : 0;
    awarded += points;
    accepted.push(p);
    results.push({ ok: true, action: p.act, subjectId: p.sub, awarded: points });
  }

  for (const siteId of unique(accepted.filter((p) => p.act === "story.complete").map((p) => p.sub))) {
    const total = lengths.get(siteId);
    if (total) await markStoryCompleted(tx, userId, siteId, total);
  }
  const solved = unique(accepted.filter((p) => p.act === "quiz.correct").map((p) => p.sub));
  if (solved.length) {
    await tx
      .insert(quizProgress)
      .values(solved.map((quizId) => ({ playerId: userId, quizId, solvedAt: sql`now()` })))
      .onConflictDoUpdate({
        target: [quizProgress.playerId, quizProgress.quizId],
        set: { solvedAt: sql`coalesce(${quizProgress.solvedAt}, now())`, updatedAt: sql`now()` },
      });
  }
  if (accepted.some((p) => p.act !== "quiz.correct")) await awardBadges(tx, userId);

  return { results, awarded, points: await pointsOf(tx, userId) };
}

// ── passport ─────────────────────────────────────────────────────────────────

/** The passport lists the most recent progress only; `GET /v1/me/progress` pages through all of it. */
const PASSPORT_PROGRESS_LIMIT = 100;

/**
 * Everything the user has earned, computed from the ledger and the user's own rows. Only published
 * content is listed, so a client never receives an id it cannot open.
 */
export async function getPassport(db: Db, userId: string): Promise<PassportResponse> {
  const [points, saved, events, badgeRows, progress] = await Promise.all([
    pointsOf(db, userId),
    db
      .select({ siteId: savedSites.siteId })
      .from(savedSites)
      .innerJoin(sites, and(eq(sites.id, savedSites.siteId), published))
      .where(eq(savedSites.userId, userId))
      .orderBy(desc(savedSites.createdAt), sql`${savedSites.siteId} COLLATE "C"`),
    db
      .select({ action: pointEvents.action, subjectId: pointEvents.subjectId })
      .from(pointEvents)
      .where(and(eq(pointEvents.userId, userId), inArray(pointEvents.action, ["story.complete", "visit.verified", "quiz.correct"])))
      .orderBy(desc(pointEvents.at), desc(pointEvents.id)),
    db
      .select({
        routeId: userBadges.routeId,
        title: catalogRoutes.badgeTitle,
        mediaId: catalogRoutes.badgeMediaId,
        url: media.url,
        alt: media.alt,
        earnedAt: userBadges.earnedAt,
      })
      .from(userBadges)
      .innerJoin(
        catalogRoutes,
        and(eq(catalogRoutes.id, userBadges.routeId), eq(catalogRoutes.status, "published"), isNotNull(catalogRoutes.badgeTitle)),
      )
      .leftJoin(media, eq(media.id, catalogRoutes.badgeMediaId))
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.earnedAt), sql`${userBadges.routeId} COLLATE "C"`),
    progressEntries(db, userId, { limit: PASSPORT_PROGRESS_LIMIT }),
  ]);

  const liveSites = await publishedSiteIds(db, unique(events.filter((e) => e.action !== "quiz.correct").map((e) => e.subjectId)));
  const liveQuizzes = await playableQuizIds(db, unique(events.filter((e) => e.action === "quiz.correct").map((e) => e.subjectId)));
  const subjectsOf = (action: PointAction, live: Set<string>) =>
    events.filter((e) => e.action === action && live.has(e.subjectId)).map((e) => e.subjectId);

  return {
    points,
    saved: saved.map((r) => r.siteId),
    read: subjectsOf("story.complete", liveSites),
    visited: subjectsOf("visit.verified", liveSites),
    quizzesSolved: subjectsOf("quiz.correct", liveQuizzes),
    badges: badgeRows.flatMap((b) =>
      b.title === null
        ? []
        : [{ routeId: b.routeId, title: b.title, mediaId: b.mediaId, url: b.url, alt: b.alt, earnedAt: b.earnedAt.toISOString() }],
    ),
    progress: progress.entries,
  };
}

/** Account erasure (KVKK): deletes the user's points ledger, saves, Rotam, story/quiz progress and badges. */
export async function eraseEngagement(tx: Tx, userId: string): Promise<void> {
  await tx.delete(pointEvents).where(eq(pointEvents.userId, userId));
  await tx.delete(savedSites).where(eq(savedSites.userId, userId));
  await tx.delete(userRouteStops).where(eq(userRouteStops.userId, userId));
  await tx.delete(storyProgress).where(eq(storyProgress.userId, userId));
  await tx.delete(quizProgress).where(eq(quizProgress.playerId, userId));
  await tx.delete(userBadges).where(eq(userBadges.userId, userId));
}
