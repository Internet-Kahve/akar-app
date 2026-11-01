"use client";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Box, Check, ChevronLeft, MapPin, X } from "lucide-react";
import type { AkarClient, SiteProgress } from "@akar/api-client";
import type { HeritageSite, SiteBadge, SiteTask } from "@akar/domain";
import { describeError } from "../lib/errors";
import { locateOnce } from "../lib/locate";
import { Localized, useI18n } from "./i18n";
import { Notice, Tag } from "./ui";
import { isFieldTask, isQuizTask, type FieldDone } from "./site-tasks";

const STAR = Array.from({ length: 16 }, (_, i) => {
  const r = i % 2 ? 11.2 : 15,
    a = (Math.PI / 8) * i - Math.PI / 2;
  return `${(16 + r * Math.cos(a)).toFixed(2)},${(16 + r * Math.sin(a)).toFixed(2)}`;
}).join(" ");

export function BadgeIcon({ held = true, size = 32 }: { held?: boolean; size?: number }) {
  return (
    <svg
      className={`rozet-ik${held ? "" : " yok"}`}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <polygon points={STAR} />
      <circle cx="16" cy="16" r="4.6" />
    </svg>
  );
}

type Outcome =
  | { kind: "right"; title: string; text: string; onSite: boolean; badges: SiteBadge[] }
  | { kind: "wrong"; openedHint: boolean };

/** The first task still to do; every task done opens the first one. */
export const firstOpenTask = (tasks: SiteTask[], progress: SiteProgress) =>
  Math.max(
    0,
    tasks.findIndex((task) => !progress.tasks.some((p) => p.taskId === task.id)),
  );

/**
 * The prototype's puzzle screen: one task at a time, the result on a sheet over it. A phone gets the whole
 * screen, a wide screen a window. The correct answer stays on the server, so the prototype's «Cevabı göster»
 * has no counterpart here.
 */
export function SitePuzzle({
  site,
  client,
  progress,
  guest,
  wide,
  start,
  found,
  onClose,
  onDone,
  onSignIn,
  onPick,
  onBadges,
  onToast,
}: {
  site: HeritageSite;
  client: AkarClient;
  progress: SiteProgress;
  guest: boolean;
  wide: boolean;
  /** Index of the task to open. */
  start: number;
  /** Set when a field task was just finished on the model: the screen opens on its result. */
  found?: FieldDone | undefined;
  onClose: () => void;
  onDone: (badges: SiteBadge[]) => void;
  onSignIn: () => void;
  onPick: (task: SiteTask) => void;
  onBadges: () => void;
  onToast: (text: string) => void;
}) {
  const { t, lang } = useI18n();
  const content = lang === "en" ? "tr" : undefined;
  const tasks = site.tasks ?? [];
  const ref = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(() => Math.min(start, Math.max(0, tasks.length - 1)));
  const [choice, setChoice] = useState<number | null>(null),
    [hints, setHints] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [outcome, setOutcome] = useState<Outcome | null>(() => {
      const task = tasks[start];
      return found && task
        ? {
            kind: "right",
            title: t("puzzle.found", { title: task.title }),
            text: found.doneText,
            onSite: found.onSite,
            badges: found.earnedBadges,
          }
        : null;
    });
  const options = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.focus?.();
    };
  }, []);
  useEffect(() => {
    if (outcome) sheet.current?.querySelector<HTMLElement>(".btn")?.focus({ preventScroll: true });
  }, [outcome]);
  const task = tasks[index];
  if (!task) return null;
  const count = tasks.length;
  const quiz = isQuizTask(task) ? task.quiz : null;
  const field = isFieldTask(task) ? task.field : null;
  const canPick = !!field?.fromHome && !!site.model?.parts.includes(field.fromHome.part);
  const label = t(field ? "site.kindField" : "site.puzzle");
  const siteName = <Localized tr={site.name} en={site.nameEn} />;
  function move(next: number) {
    setIndex(next);
    setChoice(null);
    setHints(0);
    setError("");
    setOutcome(null);
  }
  async function answer() {
    if (choice === null || !quiz || !task) return;
    setBusy(true);
    setError("");
    try {
      const result = await client.answerSiteTask(task.id, choice);
      if (result.correct) {
        setOutcome({
          kind: "right",
          title: t("puzzle.right", { option: quiz.options[choice] ?? "" }),
          text: result.correctText ?? "",
          onSite: false,
          badges: result.earnedBadges,
        });
        onDone(result.earnedBadges);
      } else {
        const opened = hints < quiz.hints.length;
        if (opened) setHints(hints + 1);
        setOutcome({ kind: "wrong", openedHint: opened });
        const list = options.current;
        list?.classList.remove("sars");
        void list?.offsetWidth;
        list?.classList.add("sars");
      }
    } catch (e) {
      setError(describeError(e, t("site.quizCheckFailed"), lang));
    }
    setBusy(false);
  }
  async function here() {
    if (!task) return;
    setBusy(true);
    setError("");
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
        setOutcome({
          kind: "right",
          title: t("puzzle.found", { title: task.title }),
          text: result.doneText,
          onSite: result.onSite,
          badges: result.earnedBadges,
        });
        onDone(result.earnedBadges);
      } else onToast(t(canPick ? "site.notNearCanPick" : "site.notNear"));
    } catch (e) {
      onToast(describeError(e, t("site.taskFailed"), lang));
    }
    setBusy(false);
  }
  function arrows(event: KeyboardEvent<HTMLDivElement>) {
    if (!quiz) return;
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = ((choice ?? (step > 0 ? -1 : 0)) + step + quiz.options.length) % quiz.options.length;
    setChoice(next);
    options.current?.querySelectorAll("button")[next]?.focus();
  }
  const photo = task.photo && (
    <figure className="gv-gorsel">
      <img src={task.photo.src} alt={task.photo.alt} />
      <figcaption lang={content}>
        <Localized tr={task.photo.title} en={task.photo.titleEn} />
      </figcaption>
    </figure>
  );
  const body = quiz ? (
    <>
      <h1 className="gv-soru" lang={content}>
        {task.prompt}
      </h1>
      <p className="gv-alt soluk">{t(site.stories.length ? "puzzle.lookStory" : "puzzle.lookAbout")}</p>
      <div className="gv-secenekler" role="radiogroup" aria-label={t("puzzle.options")} ref={options} onKeyDown={arrows}>
        {quiz.options.map((option, i) => (
          <button
            key={option}
            role="radio"
            className="gv-secenek"
            aria-checked={choice === i}
            tabIndex={choice === i || (choice === null && i === 0) ? 0 : -1}
            lang={content}
            onClick={() => setChoice(i)}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="gv-ipuclari">
        {quiz.hints.map((hint, i) => (
          <button
            key={hint}
            className={`btn secondary${i > hints ? " gv-kilitli" : " gv-acik"}${i < hints ? " acildi" : ""}`}
            aria-disabled={i > hints || undefined}
            onClick={() => i === hints && setHints(hints + 1)}
          >
            {t("puzzle.hint", { n: i + 1 })}
            {i > hints && <small>{t("puzzle.hintLocked", { n: i })}</small>}
          </button>
        ))}
      </div>
      {quiz.hints.slice(0, hints).map((hint, i) => (
        <p className="gv-ipucu-metin" key={hint}>
          <b>{t("puzzle.hintLabel", { n: i + 1 })}</b> <span lang={content}>{hint}</span>
        </p>
      ))}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="gv-alt-dugme">
        <button className="btn full" disabled={choice === null || busy} onClick={() => void answer()}>
          {busy ? t("site.checking") : t("puzzle.answer")}
        </button>
        {index < count - 1 && (
          <button className="metin-btn soluk" onClick={() => move(index + 1)}>
            {t("puzzle.skip")}
          </button>
        )}
      </div>
    </>
  ) : field ? (
    <>
      <h1 className="gv-soru" lang={content}>
        {task.title}
      </h1>
      <p className="gv-alt" lang={content}>
        {task.prompt}
      </p>
      <div className="gv-yollar">
        <div className="gv-yol">
          <div className="gv-yol-bas">
            <MapPin size={18} />
            <b>{t("puzzle.onSite")}</b>
          </div>
          <p lang={content}>{field.onSite.text}</p>
          <button className="btn full" disabled={busy} onClick={() => void here()}>
            {busy ? t("site.locating") : t("site.taskImHere")}
          </button>
        </div>
        {canPick && field.fromHome && (
          <div className="gv-yol">
            <div className="gv-yol-bas">
              <Box size={18} />
              <b>{t("puzzle.fromHome")}</b>
            </div>
            <p lang={content}>{field.fromHome.text}</p>
            <button className="btn secondary full" onClick={() => onPick(task)}>
              {t("puzzle.findOnModel")}
            </button>
          </div>
        )}
      </div>
    </>
  ) : (
    <Notice>{t("site.taskFallback")}</Notice>
  );
  const result = outcome && (
    <div className="gv-sonuc">
      <div className="gv-sayfa" role="status" ref={sheet}>
        {outcome.kind === "right" ? (
          <>
            <div className="gv-isaret dogru">
              <Check size={26} />
            </div>
            <h2 className="gv-sonuc-baslik" lang={content}>
              {outcome.title}
            </h2>
            <p lang={content}>{outcome.text}</p>
            <div className="gv-cipler">
              <Tag tone={task.trust}>{t(`trust.${task.trust}`)}</Tag>
              {task.source && (
                <span className="gv-kaynak">
                  {t("site.sourceLabel")} <span lang={content}>{task.source}</span>
                </span>
              )}
              {outcome.onSite && <span className="gv-yerinde">{t("site.onSiteTag")}</span>}
            </div>
            {outcome.badges.map((badge) => (
              <div className="gv-rozet" key={badge.id}>
                <BadgeIcon size={36} />
                <div>
                  <b lang={content}>{badge.title}</b>
                  <small>{t("puzzle.badgeAdded")}</small>
                </div>
              </div>
            ))}
            {guest && (
              <button className="metin-btn" onClick={onSignIn}>
                {t("site.badgeSignIn")}
              </button>
            )}
            {index < count - 1 ? (
              <button className="btn full" onClick={() => move(index + 1)}>
                {t("puzzle.next", { n: index + 2, total: count })}
              </button>
            ) : (
              <button className="btn full" onClick={onBadges}>
                {t("puzzle.myBadges")}
              </button>
            )}
            <button className="metin-btn" onClick={onClose}>
              {t("puzzle.backToSite", { name: site.name })}
            </button>
          </>
        ) : (
          <>
            <div className="gv-isaret yanlis">?</div>
            <h2 className="gv-sonuc-baslik">{t("puzzle.wrong")}</h2>
            <p>
              {outcome.openedHint && quiz ? (
                <>
                  {t("puzzle.hintOpened", { n: hints })}{" "}
                  <span lang={content}>{quiz.hints[hints - 1]}</span>
                </>
              ) : (
                t("puzzle.lookAgain")
              )}
            </p>
            <button
              className="btn full"
              onClick={() => {
                setOutcome(null);
                setChoice(null);
              }}
            >
              {t("puzzle.retry")}
            </button>
          </>
        )}
      </div>
    </div>
  );
  return (
    <dialog
      ref={ref}
      className={wide ? "gv-perde" : "gv gv-m"}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        if (outcome?.kind === "wrong") setOutcome(null);
        else onClose();
      }}
    >
      <div className={wide ? "gv-modal" : "gv-ic"}>
        <div className="gv-ust">
          {!wide && (
            <button className="round-btn" onClick={onClose} aria-label={t("puzzle.back", { name: site.name })}>
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="gv-ust-yazi">
            <b>{label}</b>
            <small>{siteName}</small>
          </div>
          <span className="sayac">
            {index + 1} / {count}
          </span>
          {wide && (
            <button className="round-btn gv-kapat" onClick={onClose} aria-label={t("common.closeWindow")}>
              <X size={18} />
            </button>
          )}
        </div>
        <div className={wide ? "gv-modal-ic" : "gv-kaydir"}>
          {photo}
          <div className="gv-icerik">{body}</div>
        </div>
        {result}
      </div>
    </dialog>
  );
}
