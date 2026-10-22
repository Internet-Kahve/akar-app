import { reduceSnapshot, type HeritageSite, type Snapshot } from "@akar/domain";
import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Db } from "../../db/client.ts";
import { catalogRoutes, cities, historyImages, media, quizAnswers, quizzes, routeStops, sites, sources } from "../../db/schema/index.ts";
import { AppError } from "../../errors.ts";
import { recordAudit } from "../../platform/audit.ts";
import type { Tx } from "../../platform/idempotency.ts";
import { decodeCursor, encodeCursor } from "../../platform/pagination.ts";
import { slugify } from "../catalog/service.ts";
import type {
  AdminQuiz,
  AdminRoute,
  AdminRouteSummary,
  CreateRouteBody,
  ListAdminQuizzesQuery,
  ListAdminRoutesQuery,
  QuizBody,
  RouteStopInput,
  UpdateRouteBody,
} from "./routes-editor-schemas.ts";

/**
 * Admin writes of routes, route stops and quizzes (admin-catalog owns these tables). Every write
 * takes the caller's transaction, records its audit row in it and returns the DTO it produced, so
 * a rejected request leaves neither data nor audit behind. Routes are locked (`FOR UPDATE`) before a
 * read-validate-write sequence, so concurrent edits of one route are serialized.
 */

/** Who writes and under which request: the audit trail's actor and correlation id. */
export type Actor = { id: string; requestId: string };

type RouteRow = typeof catalogRoutes.$inferSelect;
type PublishStatus = RouteRow["status"];

const invalid = (fieldErrors: Record<string, string[]>) => new AppError(400, "VALIDATION_FAILED", "Girdi doğrulanamadı.", fieldErrors);

// ── routes: reads ────────────────────────────────────────────────────────────

const routeFields = (r: RouteRow) => ({
  id: r.id,
  name: r.name,
  nameEn: r.nameEn,
  description: r.description,
  theme: r.theme,
  cityId: r.cityId,
  badgeTitle: r.badgeTitle,
  badgeMediaId: r.badgeMediaId,
  status: r.status,
  updatedAt: r.updatedAt.toISOString(),
});

async function stopsOf(db: Tx | Db, routeId: string) {
  return db
    .select({
      position: routeStops.position,
      siteId: sites.id,
      siteName: sites.name,
      siteStatus: sites.status,
      quizId: routeStops.quizId,
      historyImageId: routeStops.historyImageId,
    })
    .from(routeStops)
    .innerJoin(sites, eq(sites.id, routeStops.siteId))
    .where(eq(routeStops.routeId, routeId))
    .orderBy(asc(routeStops.position));
}

async function detailOf(db: Tx | Db, route: RouteRow): Promise<AdminRoute> {
  const stops = await stopsOf(db, route.id);
  return {
    ...routeFields(route),
    stops: stops.map((s) => ({
      position: s.position,
      site: { id: s.siteId, name: s.siteName, status: s.siteStatus },
      quizId: s.quizId,
      historyImageId: s.historyImageId,
    })),
  };
}

/** Any route, drafts included. */
export async function getAdminRoute(db: Tx | Db, id: string): Promise<AdminRoute> {
  const [route] = await db.select().from(catalogRoutes).where(eq(catalogRoutes.id, id));
  if (!route) throw new AppError(404, "NOT_FOUND", "Rota bulunamadı.");
  return detailOf(db, route);
}

/** Routes in id order (C collation, so the order does not depend on the database locale), keyset-paged. */
export async function listAdminRoutes(
  db: Db,
  q: ListAdminRoutesQuery,
): Promise<{ items: AdminRouteSummary[]; nextCursor: string | null }> {
  const key = sql`${catalogRoutes.id} COLLATE "C"`;
  const rows = await db
    .select()
    .from(catalogRoutes)
    .where(and(q.status ? eq(catalogRoutes.status, q.status) : undefined, q.cursor ? sql`${key} > ${decodeCursor(q.cursor, ["i"]).i}` : undefined))
    .orderBy(key)
    .limit(q.limit + 1);

  const page = rows.slice(0, q.limit);
  const counts = page.length
    ? await db
        .select({ routeId: routeStops.routeId, n: sql<number>`count(*)::int` })
        .from(routeStops)
        .where(inArray(routeStops.routeId, page.map((r) => r.id)))
        .groupBy(routeStops.routeId)
    : [];
  const stopCount = new Map(counts.map((c) => [c.routeId, c.n]));
  const last = rows.length > q.limit ? page.at(-1) : undefined;
  return {
    items: page.map((r) => ({ ...routeFields(r), stopCount: stopCount.get(r.id) ?? 0 })),
    nextCursor: last ? encodeCursor({ i: last.id }) : null,
  };
}

// ── routes: validation ───────────────────────────────────────────────────────

async function lockRoute(tx: Tx, id: string): Promise<RouteRow> {
  const [route] = await tx.select().from(catalogRoutes).where(eq(catalogRoutes.id, id)).for("update");
  if (!route) throw new AppError(404, "NOT_FOUND", "Rota bulunamadı.");
  return route;
}

async function assertCityExists(db: Tx | Db, cityId: string): Promise<void> {
  const [city] = await db.select({ id: cities.id }).from(cities).where(eq(cities.id, cityId));
  if (!city) throw invalid({ cityId: ["Şehir bulunamadı."] });
}

/** A badge image without a title is dropped from the public route, so it is refused here instead of vanishing silently. */
async function assertBadge(db: Tx | Db, badgeTitle: string | null, badgeMediaId: string | null): Promise<void> {
  if (badgeMediaId === null) return;
  const errors: Record<string, string[]> = {};
  if (badgeTitle === null) errors.badgeTitle = ["Rozet görseli için rozet adı gerekli."];
  const [image] = await db.select({ kind: media.kind }).from(media).where(eq(media.id, badgeMediaId));
  if (!image) errors.badgeMediaId = ["Medya bulunamadı."];
  else if (image.kind !== "photo") errors.badgeMediaId = ["Rozet görseli bir fotoğraf olmalı."];
  if (Object.keys(errors).length) throw invalid(errors);
}

/** What the publish gate reads of a stop: its site's id, name and publication state. */
type GateStop = { siteId: string; siteName: string; siteStatus: PublishStatus };

/**
 * Stops must be unique, in the route's city, and may carry only their own site's quiz and history
 * image. Every problem is reported with its `stops.<i>.<field>` path. Returns the stops' sites in stop order.
 */
async function validateStops(db: Tx | Db, route: RouteRow, stops: RouteStopInput[]): Promise<GateStop[]> {
  const errors: Record<string, string[]> = {};
  const fail = (path: string, message: string) => void (errors[path] ??= []).push(message);

  const siteIds = [...new Set(stops.map((s) => s.siteId))];
  const siteRows = siteIds.length
    ? await db.select({ id: sites.id, cityId: sites.cityId, name: sites.name, status: sites.status }).from(sites).where(inArray(sites.id, siteIds))
    : [];
  const siteById = new Map(siteRows.map((s) => [s.id, s]));

  const quizIds = [...new Set(stops.flatMap((s) => (s.quizId ? [s.quizId] : [])))];
  const quizRows = quizIds.length ? await db.select({ id: quizzes.id, siteId: quizzes.siteId }).from(quizzes).where(inArray(quizzes.id, quizIds)) : [];
  const quizSite = new Map(quizRows.map((q) => [q.id, q.siteId]));

  const imageIds = [...new Set(stops.flatMap((s) => (s.historyImageId ? [s.historyImageId] : [])))];
  const imageRows = imageIds.length
    ? await db.select({ id: historyImages.id, siteId: historyImages.siteId }).from(historyImages).where(inArray(historyImages.id, imageIds))
    : [];
  const imageSite = new Map(imageRows.map((h) => [h.id, h.siteId]));

  const seen = new Set<string>();
  for (const [i, stop] of stops.entries()) {
    const site = siteById.get(stop.siteId);
    if (seen.has(stop.siteId)) fail(`stops.${i}.siteId`, "Aynı eser rotada birden fazla kez yer alamaz.");
    else if (!site) fail(`stops.${i}.siteId`, "Eser bulunamadı.");
    else if (site.cityId !== route.cityId) fail(`stops.${i}.siteId`, "Eser rotanın şehrinde değil.");
    seen.add(stop.siteId);

    if (stop.quizId) {
      const owner = quizSite.get(stop.quizId);
      if (owner === undefined) fail(`stops.${i}.quizId`, "Bulmaca bulunamadı.");
      else if (owner !== stop.siteId) fail(`stops.${i}.quizId`, "Bulmaca bu durağın eserine ait değil.");
    }
    if (stop.historyImageId) {
      const owner = imageSite.get(stop.historyImageId);
      if (owner === undefined) fail(`stops.${i}.historyImageId`, "Geçmişi Gör görseli bulunamadı.");
      else if (owner !== stop.siteId) fail(`stops.${i}.historyImageId`, "Geçmişi Gör görseli bu durağın eserine ait değil.");
    }
  }
  if (Object.keys(errors).length) throw invalid(errors);
  return stops.flatMap((s) => {
    const site = siteById.get(s.siteId);
    return site ? [{ siteId: s.siteId, siteName: site.name, siteStatus: site.status }] : [];
  });
}

/**
 * Publish gate. The domain's own `catalog-routes` rule decides (`reduceSnapshot`: a name, unique
 * existing sites, and for a published route at least two stops that are all published), so the API
 * cannot drift from it. When it refuses, the draft stop sites are named to say what to fix.
 * Returns the issues, empty when the route may be published.
 */
function publishIssues(route: Pick<RouteRow, "id" | "name" | "description" | "theme">, stops: GateStop[]): string[] {
  const state: Snapshot = {
    version: 1,
    // The rule only reads each site's id and status.
    sites: stops.map((s) => ({ id: s.siteId, status: s.siteStatus }) as HeritageSite),
    memories: [],
    savedIds: [],
    routeIds: [],
    visitedIds: [],
    readIds: [],
    quizIds: [],
    points: 0,
    name: "",
  };
  try {
    reduceSnapshot(state, {
      type: "catalog-routes",
      routes: [
        {
          id: route.id,
          name: route.name,
          description: route.description,
          theme: route.theme,
          siteIds: stops.map((s) => s.siteId),
          minutes: 0,
          distance: "",
          status: "published",
        },
      ],
    });
    return [];
  } catch (err) {
    const drafts = stops.filter((s) => s.siteStatus !== "published").map((s) => `"${s.siteName}" eseri yayında değil.`);
    return [err instanceof Error ? err.message : String(err), ...drafts];
  }
}

// ── routes: writes ───────────────────────────────────────────────────────────

/** Readable id from the name (`Hanlar Yolu` → `hanlar-yolu`, then `-2`, `-3`…); the first free one wins. */
async function insertRoute(tx: Tx, name: string, values: Omit<typeof catalogRoutes.$inferInsert, "id">): Promise<string> {
  const base = slugify(name).slice(0, 60).replace(/-+$/, "") || "rota";
  for (let n = 1; n <= 50; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const [row] = await tx.insert(catalogRoutes).values({ ...values, id: candidate }).onConflictDoNothing().returning({ id: catalogRoutes.id });
    if (row) return row.id;
  }
  // Fifty routes already share this name; a random suffix cannot realistically collide.
  const fallback = `${base}-${randomUUID().slice(0, 8)}`;
  await tx.insert(catalogRoutes).values({ ...values, id: fallback });
  return fallback;
}

export async function createRoute(tx: Tx, actor: Actor, input: CreateRouteBody): Promise<AdminRoute> {
  await assertCityExists(tx, input.cityId);
  await assertBadge(tx, input.badgeTitle ?? null, input.badgeMediaId ?? null);

  const id = await insertRoute(tx, input.name, {
    cityId: input.cityId,
    name: input.name,
    nameEn: input.nameEn ?? null,
    description: input.description,
    theme: input.theme,
    badgeTitle: input.badgeTitle ?? null,
    badgeMediaId: input.badgeMediaId ?? null,
    status: "draft",
  });
  const after = await getAdminRoute(tx, id);
  await recordAudit(tx, { actorId: actor.id, action: "route.create", entityType: "route", entityId: id, after, requestId: actor.requestId });
  return after;
}

/** Absent = unchanged, null = cleared. */
const patched = <T>(change: T | undefined, current: T): T => (change === undefined ? current : change);

export async function updateRoute(tx: Tx, actor: Actor, id: string, patch: UpdateRouteBody): Promise<AdminRoute> {
  const current = await lockRoute(tx, id);
  const next = {
    cityId: patched(patch.cityId, current.cityId),
    name: patched(patch.name, current.name),
    nameEn: patched(patch.nameEn, current.nameEn),
    description: patched(patch.description, current.description),
    theme: patched(patch.theme, current.theme),
    badgeTitle: patched(patch.badgeTitle, current.badgeTitle),
    badgeMediaId: patched(patch.badgeMediaId, current.badgeMediaId),
  };

  if (next.cityId !== current.cityId) {
    await assertCityExists(tx, next.cityId);
    const elsewhere = await tx
      .select({ siteId: routeStops.siteId })
      .from(routeStops)
      .innerJoin(sites, eq(sites.id, routeStops.siteId))
      .where(and(eq(routeStops.routeId, id), ne(sites.cityId, next.cityId)));
    if (elsewhere.length) throw invalid({ cityId: ["Rotanın durakları bu şehirde değil; önce durakları değiştir."] });
  }
  if (next.badgeTitle !== current.badgeTitle || next.badgeMediaId !== current.badgeMediaId) {
    await assertBadge(tx, next.badgeTitle, next.badgeMediaId);
  }

  const before = await detailOf(tx, current);
  await tx.update(catalogRoutes).set({ ...next, updatedAt: sql`now()` }).where(eq(catalogRoutes.id, id));
  const after = await getAdminRoute(tx, id);
  await recordAudit(tx, { actorId: actor.id, action: "route.update", entityType: "route", entityId: id, before, after, requestId: actor.requestId });
  return after;
}

/**
 * Replaces the route's stops with the given ordered list. A published route keeps satisfying the
 * publish gate: a list that would break it is 422 PUBLISH_BLOCKED and nothing changes.
 */
export async function setRouteStops(tx: Tx, actor: Actor, id: string, stops: RouteStopInput[]): Promise<AdminRoute> {
  const route = await lockRoute(tx, id);
  const before = await detailOf(tx, route);
  const stopSites = await validateStops(tx, route, stops);

  if (route.status === "published") {
    const issues = publishIssues(route, stopSites);
    if (issues.length) throw new AppError(422, "PUBLISH_BLOCKED", "Rota yayınlanamaz.", { _: issues });
  }

  await tx.delete(routeStops).where(eq(routeStops.routeId, id));
  if (stops.length) {
    await tx.insert(routeStops).values(
      stops.map((s, position) => ({ routeId: id, position, siteId: s.siteId, quizId: s.quizId ?? null, historyImageId: s.historyImageId ?? null })),
    );
  }
  await tx.update(catalogRoutes).set({ updatedAt: sql`now()` }).where(eq(catalogRoutes.id, id));

  const after = await getAdminRoute(tx, id);
  await recordAudit(tx, { actorId: actor.id, action: "route.set-stops", entityType: "route", entityId: id, before, after, requestId: actor.requestId });
  return after;
}

/**
 * Sets the route's publication state. Publishing runs the gate (422 PUBLISH_BLOCKED, issues in
 * `fieldErrors._`); a route already in the requested state is returned as is, with no write or audit.
 */
export async function setRouteStatus(tx: Tx, actor: Actor, id: string, status: PublishStatus): Promise<AdminRoute> {
  const route = await lockRoute(tx, id);
  const before = await detailOf(tx, route);

  if (status === "published") {
    const issues = publishIssues(
      route,
      before.stops.map((s) => ({ siteId: s.site.id, siteName: s.site.name, siteStatus: s.site.status })),
    );
    if (issues.length) throw new AppError(422, "PUBLISH_BLOCKED", "Rota yayınlanamaz.", { _: issues });
  }
  if (route.status === status) return before;

  await tx.update(catalogRoutes).set({ status, updatedAt: sql`now()` }).where(eq(catalogRoutes.id, id));
  const after = await getAdminRoute(tx, id);
  await recordAudit(tx, {
    actorId: actor.id,
    action: status === "published" ? "route.publish" : "route.unpublish",
    entityType: "route",
    entityId: id,
    before,
    after,
    requestId: actor.requestId,
  });
  return after;
}

// ── quizzes ──────────────────────────────────────────────────────────────────

const quizColumns = {
  id: quizzes.id,
  siteId: quizzes.siteId,
  question: quizzes.question,
  questionEn: quizzes.questionEn,
  options: quizzes.options,
  optionsEn: quizzes.optionsEn,
  hint: quizzes.hint,
  explanation: quizzes.explanation,
  sourceId: quizzes.sourceId,
  trust: quizzes.trust,
  updatedAt: quizzes.updatedAt,
  // Left join: a quiz whose answer row is missing stays visible to the editor, who repairs it with a PUT.
  correctIndex: quizAnswers.correctIndex,
};

/** A quiz as selected for staff; `correctIndex` is null only when its answer row is missing. */
type QuizRow = {
  id: string;
  siteId: string;
  question: string;
  questionEn: string | null;
  options: string[];
  optionsEn: string[] | null;
  hint: string | null;
  explanation: string;
  sourceId: string | null;
  trust: AdminQuiz["trust"];
  updatedAt: Date;
  correctIndex: number | null;
};

const selectQuizzes = (db: Tx | Db) => db.select(quizColumns).from(quizzes).leftJoin(quizAnswers, eq(quizAnswers.quizId, quizzes.id));

const toQuiz = (q: QuizRow): AdminQuiz => ({ ...q, updatedAt: q.updatedAt.toISOString() });

/** Staff view of a quiz, answer key included. */
export async function getAdminQuiz(db: Tx | Db, id: string): Promise<AdminQuiz> {
  const [quiz] = await selectQuizzes(db).where(eq(quizzes.id, id));
  if (!quiz) throw new AppError(404, "NOT_FOUND", "Bulmaca bulunamadı.");
  return toQuiz(quiz);
}

export async function listAdminQuizzes(db: Db, q: ListAdminQuizzesQuery): Promise<{ items: AdminQuiz[]; nextCursor: string | null }> {
  const key = sql`${quizzes.id} COLLATE "C"`;
  const rows = await selectQuizzes(db)
    .where(and(q.siteId ? eq(quizzes.siteId, q.siteId) : undefined, q.cursor ? sql`${key} > ${decodeCursor(q.cursor, ["i"]).i}` : undefined))
    .orderBy(key)
    .limit(q.limit + 1);
  const page = rows.slice(0, q.limit);
  const last = rows.length > q.limit ? page.at(-1) : undefined;
  return { items: page.map(toQuiz), nextCursor: last ? encodeCursor({ i: last.id }) : null };
}

/** The quiz's site and source must exist; every problem is reported by field. */
async function assertQuizRefs(db: Tx | Db, input: QuizBody, siteMayChange: boolean): Promise<void> {
  const errors: Record<string, string[]> = {};
  if (siteMayChange) {
    const [site] = await db.select({ id: sites.id }).from(sites).where(eq(sites.id, input.siteId));
    if (!site) errors.siteId = ["Eser bulunamadı."];
  }
  if (input.sourceId) {
    const [source] = await db.select({ id: sources.id }).from(sources).where(eq(sources.id, input.sourceId));
    if (!source) errors.sourceId = ["Kaynak bulunamadı."];
  }
  if (Object.keys(errors).length) throw invalid(errors);
}

const quizValues = (input: QuizBody) => ({
  question: input.question,
  questionEn: input.questionEn ?? null,
  options: input.options,
  optionsEn: input.optionsEn ?? null,
  hint: input.hint ?? null,
  explanation: input.explanation,
  sourceId: input.sourceId ?? null,
  trust: input.trust,
});

/** Writes `quizzes` and the separate `quiz_answers` row in the caller's transaction. */
export async function createQuiz(tx: Tx, actor: Actor, input: QuizBody): Promise<AdminQuiz> {
  await assertQuizRefs(tx, input, true);
  const id = `quiz-${randomUUID()}`;
  await tx.insert(quizzes).values({ id, siteId: input.siteId, ...quizValues(input) });
  await tx.insert(quizAnswers).values({ quizId: id, correctIndex: input.correctIndex });

  // The audit row is staff-only, so it may carry the answer key: a change of only the key must still show.
  const after = await getAdminQuiz(tx, id);
  await recordAudit(tx, { actorId: actor.id, action: "quiz.create", entityType: "quiz", entityId: id, after, requestId: actor.requestId });
  return after;
}

/** Replaces the whole quiz (state-setting PUT). The site is fixed: stops link quizzes of their own site only. */
export async function replaceQuiz(tx: Tx, actor: Actor, id: string, input: QuizBody): Promise<AdminQuiz> {
  const [current] = await tx.select({ siteId: quizzes.siteId }).from(quizzes).where(eq(quizzes.id, id)).for("update");
  if (!current) throw new AppError(404, "NOT_FOUND", "Bulmaca bulunamadı.");
  if (current.siteId !== input.siteId) throw invalid({ siteId: ["Bulmacanın eseri değiştirilemez."] });
  await assertQuizRefs(tx, input, false);

  const before = await getAdminQuiz(tx, id);
  await tx.update(quizzes).set({ ...quizValues(input), updatedAt: sql`now()` }).where(eq(quizzes.id, id));
  await tx
    .insert(quizAnswers)
    .values({ quizId: id, correctIndex: input.correctIndex })
    .onConflictDoUpdate({ target: quizAnswers.quizId, set: { correctIndex: input.correctIndex } });

  const after = await getAdminQuiz(tx, id);
  await recordAudit(tx, { actorId: actor.id, action: "quiz.update", entityType: "quiz", entityId: id, before, after, requestId: actor.requestId });
  return after;
}
