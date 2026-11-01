"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type RefObject,
} from "react";
import { Award, Lock, MapPin, Pointer, Puzzle, X } from "lucide-react";
import type { AkarClient, SiteProgress } from "@akar/api-client";
import {
  type HeritageSite,
  type SiteBadge,
  type SiteTask,
} from "@akar/domain";
import { useI18n } from "./i18n";
import { Tag } from "./ui";

export type QuizTask = SiteTask & { quiz: NonNullable<SiteTask["quiz"]> };
export type FieldTask = SiteTask & { field: NonNullable<SiteTask["field"]> };
export const isQuizTask = (task: SiteTask): task is QuizTask =>
  task.kind === "quiz" && !!task.quiz;
export const isFieldTask = (task: SiteTask): task is FieldTask =>
  task.kind === "field" && !!task.field;

/** What a finished field task shows (the server's answer). */
export interface FieldDone {
  doneText: string;
  onSite: boolean;
  earnedBadges: SiteBadge[];
}

const emptyProgress: SiteProgress = { tasks: [], badges: [] };

/**
 * The signed-in user's finished tasks and earned badges (empty for a guest). `refresh` re-reads them and
 * returns the ids of badges that were not held at the previous read, so a story completion can announce
 * what it earned; the first read after a sign-in or sign-out announces nothing.
 */
export function useSiteProgress(
  client: RefObject<AkarClient | null>,
  ready: boolean,
  identity: string | null,
  snapshotRevision = 0,
) {
  // Each account/readiness cycle owns its requests. A late completion from an old cycle cannot
  // publish private progress into the new account, and the latest refresh wins within a cycle.
  const scope = useMemo(
    () => ({ active: false, request: 0, seen: null as Set<string> | null }),
    [client, ready, identity, snapshotRevision],
  );
  const [current, setCurrent] = useState<{
    scope: typeof scope;
    progress: SiteProgress;
  } | null>(null);
  const refresh = useCallback(async () => {
    const c = client.current;
    if (!c || !scope.active) return [];
    const request = ++scope.request;
    try {
      const next = await c.getSiteProgress();
      if (!scope.active || request !== scope.request || c !== client.current)
        return [];
      const ids = new Set(next.badges.map((b) => b.badgeId));
      const fresh = scope.seen
        ? [...ids].filter((id) => !scope.seen!.has(id))
        : [];
      scope.seen = ids;
      setCurrent({ scope, progress: next });
      return fresh;
    } catch {
      // Progress is a refinement of the page: a failed read keeps what is shown.
      return [];
    }
  }, [client, scope]);
  useEffect(() => {
    if (!ready) return;
    scope.active = true;
    scope.seen = null;
    void refresh();
    return () => {
      scope.active = false;
      scope.request++;
    };
  }, [ready, scope, refresh]);
  return {
    progress: current?.scope === scope ? current.progress : emptyProgress,
    refresh,
  };
}

/** «Görevler» area of the site detail: task cards and the badge strip. */
export function SiteTasks({
  site,
  progress,
  onOpen,
}: {
  site: HeritageSite;
  progress: SiteProgress;
  onOpen: (task: SiteTask) => void;
}) {
  const { t, lang } = useI18n();
  const content = lang === "en" ? "tr" : undefined;
  const tasks = site.tasks ?? [],
    badges = site.badges ?? [];
  if (!tasks.length && !badges.length) return null;
  return (
    <section className="site-tasks" aria-labelledby="site-tasks-title">
      <div className="section-heading">
        <h2 id="site-tasks-title">{t("site.tasksTitle")}</h2>
      </div>
      {tasks.length > 0 && (
        <ul className="task-list">
          {tasks.map((task) => {
            const done = progress.tasks.some((t) => t.taskId === task.id);
            return (
              <li key={task.id}>
                <button className="task-card" onClick={() => onOpen(task)}>
                  {task.kind === "quiz" ? (
                    <Puzzle size={20} />
                  ) : (
                    <MapPin size={20} />
                  )}
                  <span className="grow">
                    <strong lang={content}>{task.title}</strong>
                    <small>
                      {t(task.kind === "quiz" ? "site.kindQuiz" : "site.kindField")}
                    </small>
                  </span>
                  {done && <Tag tone="success">{t("site.taskDone")}</Tag>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {badges.length > 0 && (
        <ul className="badge-strip" aria-label={t("site.badges")}>
          {badges.map((badge) => {
            const held = progress.badges.find((b) => b.badgeId === badge.id);
            const needs =
              badge.condition === "story"
                ? t("site.badgeNeedsStory")
                : t("site.badgeNeedsTask", {
                    title:
                      tasks.find((x) => x.id === badge.taskId)?.title ??
                      t("site.taskFallback"),
                  });
            return (
              <li
                key={badge.id}
                className={`badge-item ${held ? "earned" : "locked"}`}
              >
                {held ? <Award size={22} /> : <Lock size={20} />}
                <strong lang={content}>{badge.title}</strong>
                <small lang={held ? content : undefined}>
                  {held ? badge.text : needs}
                </small>
                <span className="sr-only">
                  {held ? t("site.badgeEarned") : t("site.badgeLocked")}
                </span>
                {held && badge.onSiteLabel && held.onSite && (
                  <Tag tone="gold">{t("site.onSiteTag")}</Tag>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Over the 3D stage while the model waits for the tap that finishes a field task from home. */
export function TaskPickBar({
  task,
  hint,
  onCancel,
}: {
  task: FieldTask;
  hint: string;
  onCancel: () => void;
}) {
  const { t, lang } = useI18n();
  const content = lang === "en" ? "tr" : undefined;
  return (
    <div className="task-pick-bar" role="status">
      <Pointer size={18} />
      <span className="grow">
        <b>{t("puzzle.pickLabel")}</b>{" "}
        <span lang={content}>{task.field.fromHome?.text}</span>
        {hint && <small className="task-pick-hint">{hint}</small>}
      </span>
      <button className="round-btn" aria-label={t("common.cancel")} onClick={onCancel}>
        <X size={16} />
      </button>
    </div>
  );
}
