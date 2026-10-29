import { and, asc, desc, eq } from "drizzle-orm";
import type { Db } from "../../db/client.ts";
import {
  siteBadges,
  siteTaskAnswers,
  siteTasks,
  sites,
  userSiteBadges,
  userSiteTasks,
  type FieldTaskDetails,
  type QuizTaskDetails,
} from "../../db/schema/index.ts";
import { AppError } from "../../errors.ts";
import type { Tx } from "../../platform/idempotency.ts";
import type { SiteBadgeDto } from "../catalog/schemas.ts";
import { published } from "../catalog/service.ts";
import { withinSiteRadius } from "../engagement/service.ts";
import { awardTaskBadges, recordTaskCompletion } from "./badges.ts";
import type { SiteProgressResponse } from "./schemas.ts";

type Reader = Tx | Db;

const notFound = () => new AppError(404, "NOT_FOUND", "Görev bulunamadı.");

/** A task of a published site with its answer key (null for field tasks). Null = no such playable task. */
async function playableTask(q: Reader, taskId: string) {
  const [row] = await q
    .select({
      id: siteTasks.id,
      siteId: siteTasks.siteId,
      kind: siteTasks.kind,
      details: siteTasks.details,
      correctIndex: siteTaskAnswers.correctIndex,
    })
    .from(siteTasks)
    .innerJoin(sites, and(eq(sites.id, siteTasks.siteId), published))
    .leftJoin(siteTaskAnswers, eq(siteTaskAnswers.taskId, siteTasks.id))
    .where(eq(siteTasks.id, taskId));
  return row ?? null;
}

/**
 * Server-side answer check of a quiz task. The index of the right option is never returned; the right-answer text
 * only comes back for a correct choice, the wrong-answer text only for a wrong one. A signed-in user (`userId`) who is
 * right gets the completion recorded and the task's badges; a guest gets the same answer and nothing is stored.
 */
export async function answerTask(q: Reader, userId: string | null, taskId: string, choice: number) {
  const task = await playableTask(q, taskId);
  if (!task) throw notFound();
  if (task.kind !== "quiz") {
    throw new AppError(400, "VALIDATION_FAILED", "Bu görev bir soru değil.", { id: ["Cevap yalnız soru görevlerine gönderilir."] });
  }
  const details = task.details as QuizTaskDetails;
  if (choice >= details.options.length) {
    throw new AppError(400, "VALIDATION_FAILED", "Girdi doğrulanamadı.", { choice: [`Seçenek 0–${details.options.length - 1} arasında olmalı.`] });
  }
  if (task.correctIndex === null) throw new Error(`Quiz task ${taskId} has no answer key.`);

  const correct = task.correctIndex === choice;
  let earnedBadges: SiteBadgeDto[] = [];
  if (correct && userId !== null) {
    await recordTaskCompletion(q, userId, taskId, false);
    earnedBadges = await awardTaskBadges(q, userId, taskId, false);
  }
  return {
    correct,
    correctText: correct ? details.correctText : null,
    wrongText: correct ? null : details.wrongText,
    earnedBadges,
  };
}

export type CompleteInput = { mode: "onSite"; lat: number; lng: number; accuracyM?: number | undefined } | { mode: "fromHome"; part: string };

/**
 * Completes a field task. On site: the server checks the distance to the site point against the task's radius (same
 * rule and accuracy limits as `/v1/visits/verify`; the location is only a bound parameter of that query, never
 * stored or logged). From home: the app says which 3D part was tapped and the server only compares the name.
 * A signed-in user gets the completion recorded (`on_site` only for the GPS way) and the task's badges.
 */
export async function completeFieldTask(q: Reader, userId: string | null, taskId: string, input: CompleteInput) {
  const task = await playableTask(q, taskId);
  if (!task) throw notFound();
  if (task.kind !== "field") {
    throw new AppError(400, "VALIDATION_FAILED", "Bu görev bir saha görevi değil.", { id: ["Tamamlama yalnız saha görevlerine gönderilir."] });
  }
  const details = task.details as FieldTaskDetails;

  if (input.mode === "onSite") {
    const near = await withinSiteRadius(q, task.siteId, [input.lng, input.lat], input.accuracyM ?? 0, details.onSite.radiusM);
    if (near === null) throw notFound();
    if (!near) {
      throw new AppError(422, "TOO_FAR", "Henüz eserin yakınında görünmüyorsun. Eserin önüne gelip tekrar dene ya da görevi evden yap.");
    }
  } else {
    if (!details.fromHome) {
      throw new AppError(400, "VALIDATION_FAILED", "Bu görev evden yapılamaz.", { mode: ["Bu görevin evden karşılığı yok."] });
    }
    if (input.part !== details.fromHome.part) {
      throw new AppError(422, "WRONG_PART", "Bu doğru parça değil. Başka bir parçaya dokunmayı dene.");
    }
  }

  const onSite = input.mode === "onSite";
  let earnedBadges: SiteBadgeDto[] = [];
  if (userId !== null) {
    await recordTaskCompletion(q, userId, taskId, onSite);
    earnedBadges = await awardTaskBadges(q, userId, taskId, onSite);
  }
  return { doneText: details.doneText, onSite, earnedBadges };
}

/** The user's finished tasks and earned badges of every site, newest first. Rows of an unpublished site are kept: they come back when it is published again. */
export async function getSiteProgress(db: Db, userId: string): Promise<SiteProgressResponse> {
  const tasks = await db
    .select({ taskId: userSiteTasks.taskId, siteId: siteTasks.siteId, onSite: userSiteTasks.onSite, completedAt: userSiteTasks.completedAt })
    .from(userSiteTasks)
    .innerJoin(siteTasks, eq(siteTasks.id, userSiteTasks.taskId))
    .innerJoin(sites, and(eq(sites.id, siteTasks.siteId), published))
    .where(eq(userSiteTasks.userId, userId))
    .orderBy(desc(userSiteTasks.completedAt), asc(userSiteTasks.taskId));
  const badges = await db
    .select({ badgeId: userSiteBadges.badgeId, siteId: siteBadges.siteId, onSite: userSiteBadges.onSite, earnedAt: userSiteBadges.earnedAt })
    .from(userSiteBadges)
    .innerJoin(siteBadges, eq(siteBadges.id, userSiteBadges.badgeId))
    .innerJoin(sites, and(eq(sites.id, siteBadges.siteId), published))
    .where(eq(userSiteBadges.userId, userId))
    .orderBy(desc(userSiteBadges.earnedAt), asc(userSiteBadges.badgeId));
  return {
    tasks: tasks.map((t) => ({ ...t, completedAt: t.completedAt.toISOString() })),
    badges: badges.map((b) => ({ ...b, earnedAt: b.earnedAt.toISOString() })),
  };
}
