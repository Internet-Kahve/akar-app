import { asc, inArray } from "drizzle-orm";
import type { Db } from "../../db/client.ts";
import { siteBadges, siteTasks, type FieldTaskDetails, type QuizTaskDetails } from "../../db/schema/index.ts";
import type { Tx } from "../../platform/idempotency.ts";
import type { SiteBadgeDto, SiteTaskDto } from "./schemas.ts";

/** A site task row. `details` is a quiz's or a field task's, by `kind`. */
export type TaskRow = typeof siteTasks.$inferSelect;
export type BadgeRow = typeof siteBadges.$inferSelect;

/** The tasks of the given sites, ordered by (site, position). */
export function loadTasks(q: Db | Tx, siteIds: string[]): Promise<TaskRow[]> {
  if (!siteIds.length) return Promise.resolve([]);
  return q.select().from(siteTasks).where(inArray(siteTasks.siteId, siteIds)).orderBy(asc(siteTasks.siteId), asc(siteTasks.position));
}

/** The badges of the given sites, ordered by (site, position). */
export function loadBadges(q: Db | Tx, siteIds: string[]): Promise<BadgeRow[]> {
  if (!siteIds.length) return Promise.resolve([]);
  return q.select().from(siteBadges).where(inArray(siteBadges.siteId, siteIds)).orderBy(asc(siteBadges.siteId), asc(siteBadges.position));
}

/**
 * The public task. Built field by field: neither the answer key (`site_task_answers`) nor the texts the player only
 * gets after answering (`correctText`, `doneText`) can leak through it.
 */
export function taskDto(t: TaskRow): SiteTaskDto {
  const base = { id: t.id, kind: t.kind, title: t.title, prompt: t.prompt, photoId: t.mediaId, part: t.part, source: t.source, trust: t.trust };
  if (t.kind === "quiz") {
    const d = t.details as QuizTaskDetails;
    return { ...base, quiz: { options: d.options, hints: d.hints, wrongText: d.wrongText, fromHome: d.fromHome } };
  }
  const d = t.details as FieldTaskDetails;
  return { ...base, field: { onSite: { text: d.onSite.text, radiusM: d.onSite.radiusM }, fromHome: d.fromHome ? { text: d.fromHome.text, part: d.fromHome.part } : null } };
}

export function badgeDto(b: BadgeRow): SiteBadgeDto {
  return { id: b.id, title: b.title, text: b.text, condition: b.condition, taskId: b.taskId, onSiteLabel: b.onSiteLabel };
}
