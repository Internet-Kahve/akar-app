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
  trustLabels,
  type HeritageSite,
  type SiteBadge,
  type SiteTask,
} from "@akar/domain";
import { describeError } from "../lib/errors";
import { locateOnce } from "../lib/locate";
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

const kindLabel = (task: SiteTask) =>
  task.kind === "quiz" ? "Soru" : "Saha görevi";

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
  const tasks = site.tasks ?? [],
    badges = site.badges ?? [];
  if (!tasks.length && !badges.length) return null;
  return (
    <section className="site-tasks" aria-labelledby="site-tasks-title">
      <div className="section-heading">
        <h2 id="site-tasks-title">Görevler</h2>
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
                    <strong>{task.title}</strong>
                    <small>{kindLabel(task)}</small>
                  </span>
                  {done && <Tag tone="success">Tamamlandı</Tag>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {badges.length > 0 && (
        <ul className="badge-strip" aria-label="Rozetler">
          {badges.map((badge) => {
            const held = progress.badges.find((b) => b.badgeId === badge.id);
            const needs =
              badge.condition === "story"
                ? "Hikâyeyi sonuna kadar dinle ya da oku."
                : `«${tasks.find((t) => t.id === badge.taskId)?.title ?? "Görev"}» görevini tamamla.`;
            return (
              <li
                key={badge.id}
                className={`badge-item ${held ? "earned" : "locked"}`}
              >
                {held ? <Award size={22} /> : <Lock size={20} />}
                <strong>{badge.title}</strong>
                <small>{held ? badge.text : needs}</small>
                <span className="sr-only">
                  {held ? "Kazanıldı" : "Henüz kazanılmadı"}
                </span>
                {held && badge.onSiteLabel && held.onSite && (
                  <Tag tone="gold">Yerinde</Tag>
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
        {task.photo.title} · {task.photo.license}
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
  return (
    <div className="task-result" role="status">
      <p className="task-result-text">
        <CheckCircle2 size={18} />
        <span>{text}</span>
      </p>
      <div className="row task-result-meta">
        <Tag tone={task.trust}>{trustLabels[task.trust]}</Tag>
        {onSite && <Tag tone="gold">Yerinde</Tag>}
      </div>
      {task.source && <p className="muted">Kaynak: {task.source}</p>}
      {badges.map((badge) => (
        <p className="task-badge-note" key={badge.id}>
          <Award size={16} />
          <span>Yeni rozet: {badge.title}</span>
        </p>
      ))}
      {guest && (
        <div className="task-guest">
          <button className="btn secondary" onClick={onSignIn}>
            Rozet kazanmak için giriş yap
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
      setError(describeError(e, "Cevap kontrol edilemedi."));
    }
    setBusy(false);
  }
  return (
    <Modal title={task.title} onClose={onClose}>
      <div className="row between">
        <Tag>Soru</Tag>
        {done && !result && <Tag tone="success">Tamamlandı</Tag>}
      </div>
      <TaskPhoto task={task} />
      <h3 className="quiz-question">{task.prompt}</h3>
      <div className="quiz-options">
        {quiz.options.map((option, i) => (
          <button
            key={option}
            disabled={!!result || busy || tried.includes(i)}
            className={`quiz-option ${choice === i ? "selected" : ""} ${tried.includes(i) ? "tried" : ""}`}
            aria-pressed={choice === i}
            onClick={() => setChoice(i)}
          >
            <span>{String.fromCharCode(65 + i)}</span>
            {option}
          </button>
        ))}
      </div>
      {!result && wrongText && tried.length > 0 && <Notice>{wrongText}</Notice>}
      {quiz.hints.slice(0, hints).map((hint) => (
        <p className="hint task-hint" key={hint}>
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
              Tamam
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
              İpucu al ({hints + 1}/{quiz.hints.length})
            </button>
          )}
          <button
            className="btn"
            disabled={choice === undefined || busy}
            onClick={check}
          >
            {busy ? "Kontrol ediliyor…" : "Cevabı kontrol et"}
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
        unsupported: "Bu cihaz konum özelliğini desteklemiyor.",
        denied: "Yerinde yapmak için konum izni vermelisin.",
        timeout: "Konum alınması zaman aşımına uğradı. Yeniden dene.",
        failed: "Konum alınamadı. Konum hizmetlerini kontrol et.",
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
        setNotice(
          `Henüz görevin yeri yakınında görünmüyorsun. Biraz yaklaşıp yeniden dene.${canPick ? " İstersen evden de yapabilirsin." : ""}`,
        );
    } catch (e) {
      setError(describeError(e, "Görev tamamlanamadı."));
    }
    setBusy(false);
  }
  return (
    <Modal title={task.title} onClose={onClose}>
      <div className="row between">
        <Tag>Saha görevi</Tag>
      </div>
      <TaskPhoto task={task} />
      <p className="task-prompt">{task.prompt}</p>
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
              Tamam
            </button>
          </div>
        </>
      ) : (
        <>
          <section className="task-way">
            <h3>Yerinde yap</h3>
            <p>{field.onSite.text}</p>
            <button className="btn" disabled={busy} onClick={here}>
              <MapPin size={16} />
              {busy ? "Konum doğrulanıyor…" : "Buradayım"}
            </button>
          </section>
          {canPick && field.fromHome && (
            <section className="task-way">
              <h3>Evden yap</h3>
              <p>{field.fromHome.text}</p>
              <button
                className="btn secondary"
                disabled={busy}
                onClick={onPickFromHome}
              >
                <Box size={16} />
                Evden yap
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
  return (
    <div className="task-pick-bar" role="status">
      <span className="grow">
        <strong>{task.title}</strong>
        <small>{task.field.fromHome?.text}</small>
        {hint && <small className="task-pick-hint">{hint}</small>}
      </span>
      <button className="btn secondary" onClick={onCancel}>
        Vazgeç
      </button>
    </div>
  );
}
