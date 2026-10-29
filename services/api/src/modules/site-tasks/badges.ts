import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "../../db/client.ts";
import { siteBadges, userSiteBadges, userSiteTasks } from "../../db/schema/index.ts";
import type { Tx } from "../../platform/idempotency.ts";
import type { SiteBadgeDto } from "../catalog/schemas.ts";
import { badgeDto, type BadgeRow } from "../catalog/tasks.ts";

/**
 * Records that the user finished a task. The first completion time stays; `on_site` turns true once any completion
 * was on site and never goes back. No points: site tasks never touch `point_events`.
 */
export async function recordTaskCompletion(tx: Tx | Db, userId: string, taskId: string, onSite: boolean): Promise<void> {
  await tx
    .insert(userSiteTasks)
    .values({ userId, taskId, onSite })
    .onConflictDoUpdate({
      target: [userSiteTasks.userId, userSiteTasks.taskId],
      set: { onSite: sql`${userSiteTasks.onSite} or excluded.on_site` },
    });
}

/** Awards `candidates`; returns the ones this call newly awarded. An already earned badge is upgraded to `on_site` when `onSite`, but is not "new". */
async function award(tx: Tx | Db, userId: string, candidates: BadgeRow[], onSite: boolean): Promise<SiteBadgeDto[]> {
  if (!candidates.length) return [];
  const inserted = await tx
    .insert(userSiteBadges)
    .values(candidates.map((b) => ({ userId, badgeId: b.id, onSite })))
    .onConflictDoNothing()
    .returning({ badgeId: userSiteBadges.badgeId });
  if (onSite) {
    await tx
      .update(userSiteBadges)
      .set({ onSite: true })
      .where(and(eq(userSiteBadges.userId, userId), inArray(userSiteBadges.badgeId, candidates.map((b) => b.id)), eq(userSiteBadges.onSite, false)));
  }
  const fresh = new Set(inserted.map((r) => r.badgeId));
  return candidates.filter((b) => fresh.has(b.id)).map(badgeDto);
}

/** The site's `condition = 'story'` badges, once the signed-in user finished its story. Caller has checked the site is published. */
export async function awardStoryBadges(tx: Tx | Db, userId: string, siteId: string): Promise<SiteBadgeDto[]> {
  const badges = await tx
    .select()
    .from(siteBadges)
    .where(and(eq(siteBadges.siteId, siteId), eq(siteBadges.condition, "story")))
    .orderBy(asc(siteBadges.position));
  return award(tx, userId, badges, false);
}

/** The `condition = 'task'` badges of one task, once the signed-in user finished it (`onSite`: by GPS). */
export async function awardTaskBadges(tx: Tx | Db, userId: string, taskId: string, onSite: boolean): Promise<SiteBadgeDto[]> {
  const badges = await tx
    .select()
    .from(siteBadges)
    .where(and(eq(siteBadges.taskId, taskId), eq(siteBadges.condition, "task")))
    .orderBy(asc(siteBadges.position));
  return award(tx, userId, badges, onSite);
}
