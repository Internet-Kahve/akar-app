"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type RefObject,
} from "react";
import {
  Award,
  Box,
  CheckCircle2,
  Lightbulb,
  Lock,
  MapPin,
  Puzzle,
} from "lucide-react";
import type { AkarClient, SiteProgress } from "@akar/api-client";
import {
  type HeritageSite,
  type SiteBadge,
  type SiteTask,
} from "@akar/domain";
import { describeError } from "../lib/errors";
import { locateOnce } from "../lib/locate";
import { Localized, useI18n } from "./i18n";
import { Modal, Notice, Tag } from "./ui";

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

function TaskPhoto({ task }: { task: SiteTask }) {
  if (!task.photo) return null;
  return (
    <figure className="task-photo">
      <img src={task.photo.src} alt={task.photo.alt} />
      <figcaption>
        <Localized tr={task.photo.title} en={task.photo.titleEn} /> ·{" "}
        {task.photo.license}
      </figcaption>
    </figure>
  );
}

/** Text after a success, with the source, trust, earned badges and, for a guest, the sign-in offer. */
function TaskResult({
  task,
  text,
  onSite,
  badges,
  guest,
  onSignIn,
}: {
  task: SiteTask;
  text: string;
  onSite: boolean;
  badges: SiteBadge[];
  guest: boolean;
  onSignIn: () => void;
}) {
  const { t, lang } = useI18n();
  const content = lang === "en" ? "tr" : undefined;
  return (
    <div className="task-result" role="status">
      <p className="task-result-text">
        <CheckCircle2 size={18} />
        <span lang={content}>{text}</span>
      </p>
      <div className="row task-result-meta">
        <Tag tone={task.trust}>{t(`trust.${task.trust}`)}</Tag>
        {onSite && <Tag tone="gold">{t("site.onSiteTag")}</Tag>}
      </div>
      {task.source && (
        <p className="muted">
          {t("site.sourceLabel")} <span lang={content}>{task.source}</span>
        </p>
      )}
      {badges.map((badge) => (
        <p className="task-badge-note" key={badge.id}>
          <Award size={16} />
          <span>
            {t("site.newBadge")} <span lang={content}>{badge.title}</span>
          </span>
        </p>
      ))}
      {guest && (
        <div className="task-guest">
          <button className="btn secondary" onClick={onSignIn}>
            {t("site.badgeSignIn")}
          </button>
        </div>
      )}
    </div>
  );
}

/** Question: options, hints revealed one by one on demand, a wrong answer can be tried again. */
export function QuizTaskDialog({
  task,
  client,
  guest,
  done,
  onClose,
  onDone,
  onSignIn,
}: {
  task: QuizTask;
  client: AkarClient;
  guest: boolean;
  /** Already answered correctly before (signed-in user). */
  done: boolean;
  onClose: () => void;
  onDone: (badges: SiteBadge[]) => void;
  onSignIn: () => void;
}) {
  const { t, lang } = useI18n();
  const content = lang === "en" ? "tr" : undefined;
  const { quiz } = task;
  const [choice, setChoice] = useState<number>(),
    [tried, setTried] = useState<number[]>([]),
    [hints, setHints] = useState(0),
    [wrongText, setWrongText] = useState(""),
    [result, setResult] = useState<{ text: string; badges: SiteBadge[] }>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function check() {
    if (choice === undefined) return;
    setBusy(true);
    setError("");
    try {
      const answer = await client.answerSiteTask(task.id, choice);
      if (answer.correct) {
        setResult({
          text: answer.correctText ?? "",
          badges: answer.earnedBadges,
        });
        onDone(answer.earnedBadges);
      } else {
        setTried([...tried, choice]);
        setChoice(undefined);
        setWrongText(answer.wrongText ?? quiz.wrongText);
      }
    } catch (e) {
      setError(describeError(e, t("site.quizCheckFailed"), lang));
    }
    setBusy(false);
  }
  return (
    <Modal title={task.title} onClose={onClose}>
      <div className="row between">
        <Tag>{t("site.kindQuiz")}</Tag>
        {done && !result && <Tag tone="success">{t("site.taskDone")}</Tag>}
      </div>
      <TaskPhoto task={task} />
      <h3 className="quiz-question" lang={content}>
        {task.prompt}
      </h3>
      <div className="quiz-options">
        {quiz.options.map((option, i) => (
          <button
            key={option}
            disabled={!!result || busy || tried.includes(i)}
            className={`quiz-option ${choice === i ? "selected" : ""} ${tried.includes(i) ? "tried" : ""}`}
            aria-pressed={choice === i}
            lang={content}
            onClick={() => setChoice(i)}
          >
            <span>{String.fromCharCode(65 + i)}</span>
            {option}
          </button>
        ))}
      </div>
      {!result && wrongText && tried.length > 0 && (
        <Notice>
          <span lang={content}>{wrongText}</span>
        </Notice>
      )}
      {quiz.hints.slice(0, hints).map((hint) => (
        <p className="hint task-hint" key={hint} lang={content}>
          <Lightbulb size={14} /> {hint}
        </p>
      ))}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {result ? (
        <>
          <TaskResult
            task={task}
            text={result.text}
            onSite={false}
            badges={result.badges}
            guest={guest}
            onSignIn={onSignIn}
          />
          <div className="modal-actions">
            <button className="btn" onClick={onClose}>
              {t("site.ok")}
            </button>
          </div>
        </>
      ) : (
        <div className="modal-actions">
          {hints < quiz.hints.length && (
            <button
              className="btn secondary"
              disabled={busy}
              onClick={() => setHints(hints + 1)}
            >
              <Lightbulb size={16} />
              {t("site.takeHint", { n: hints + 1, total: quiz.hints.length })}
            </button>
          )}
          <button
            className="btn"
            disabled={choice === undefined || busy}
            onClick={check}
          >
            {busy ? t("site.checking") : t("site.checkAnswer")}
          </button>
        </div>
      )}
    </Modal>
  );
}

/**
 * Field task: «Buradayım» checks the position (the server measures; the position is not stored), «Evden
 * yap» (when the task has it) closes this dialog and the app opens the 3D model in pick mode.
 */
export function FieldTaskDialog({
  task,
  site,
  client,
  guest,
  initial,
  onClose,
  onPickFromHome,
  onDone,
  onSignIn,
}: {
  task: FieldTask;
  site: HeritageSite;
  client: AkarClient;
  guest: boolean;
  /** Result of a task finished from home in pick mode; the dialog opens on it. */
  initial?: FieldDone;
  onClose: () => void;
  onPickFromHome: () => void;
  onDone: (badges: SiteBadge[]) => void;
  onSignIn: () => void;
}) {
  const { t, lang } = useI18n();
  const content = lang === "en" ? "tr" : undefined;
  const { field } = task;
  const [done, setDone] = useState<FieldDone | undefined>(initial),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  const canPick =
    !!field.fromHome && !!site.model?.parts.includes(field.fromHome.part);
  async function here() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const position = await locateOnce({
        unsupported: t("site.locateUnsupported"),
        denied: t("site.locateDenied"),
        timeout: t("site.locateTimeout"),
        failed: t("site.locateFailed"),
      });
      const result = await client.completeSiteTask(task.id, {
        mode: "onSite",
        coordinates: position.coordinates,
        accuracyM: position.accuracyM,
      });
      if (result.done) {
        setDone(result);
        onDone(result.earnedBadges);
      } else
        setNotice(t(canPick ? "site.notNearCanPick" : "site.notNear"));
    } catch (e) {
      setError(describeError(e, t("site.taskFailed"), lang));
    }
    setBusy(false);
  }
  return (
    <Modal title={task.title} onClose={onClose}>
      <div className="row between">
        <Tag>{t("site.kindField")}</Tag>
      </div>
      <TaskPhoto task={task} />
      <p className="task-prompt" lang={content}>
        {task.prompt}
      </p>
      {done ? (
        <>
          <TaskResult
            task={task}
            text={done.doneText}
            onSite={done.onSite}
            badges={done.earnedBadges}
            guest={guest}
            onSignIn={onSignIn}
          />
          <div className="modal-actions">
            <button className="btn" onClick={onClose}>
              {t("site.ok")}
            </button>
          </div>
        </>
      ) : (
        <>
          <section className="task-way">
            <h3>{t("site.doOnSite")}</h3>
            <p lang={content}>{field.onSite.text}</p>
            <button className="btn" disabled={busy} onClick={here}>
              <MapPin size={16} />
              {busy ? t("site.locating") : t("site.taskImHere")}
            </button>
          </section>
          {canPick && field.fromHome && (
            <section className="task-way">
              <h3>{t("site.doFromHome")}</h3>
              <p lang={content}>{field.fromHome.text}</p>
              <button
                className="btn secondary"
                disabled={busy}
                onClick={onPickFromHome}
              >
                <Box size={16} />
                {t("site.doFromHome")}
              </button>
            </section>
          )}
          {notice && <Notice>{notice}</Notice>}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </>
      )}
    </Modal>
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
      <span className="grow">
        <strong lang={content}>{task.title}</strong>
        <small lang={content}>{task.field.fromHome?.text}</small>
        {hint && <small className="task-pick-hint">{hint}</small>}
      </span>
      <button className="btn secondary" onClick={onCancel}>
        {t("common.cancel")}
      </button>
    </div>
  );
}
