"use client";
import { useEffect, useState } from "react";
import {
  ImagePlus,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  MapPin,
  Puzzle,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import type { AkarClient, PlayableQuiz } from "@akar/api-client";
import type { HeritageSite, Memory, Snapshot } from "@akar/domain";
import { describeError } from "../lib/errors";
import { kvkkConsent } from "../lib/kvkk";
import { Modal, Notice, Tag, UploadProgress } from "./ui";
import { Localized, useI18n } from "./i18n";
export function MemoryModal({
  site,
  live,
  onClose,
  onSubmit,
}: {
  site: HeritageSite;
  /** Connected to the real API: the memory goes to moderation instead of the local demo. */
  live: boolean;
  onClose: () => void;
  /** Resolves to an error message, or `null` once the memory is saved. */
  onSubmit: (
    memory: Memory,
    consent: { textVersion: string },
  ) => Promise<string | null>;
}) {
  const { t, text: pick } = useI18n();
  const [text, setText] = useState(""),
    [photo, setPhoto] = useState<string>(),
    [accepted, setAccepted] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false);
  async function loadPhoto(file?: File) {
    if (!file) return;
    setError("");
    if (
      !["image/jpeg", "image/png"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError(t("memory.fileInvalid"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setError(t("memory.fileUnreadable"));
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  }
  return (
    <Modal title={done ? t("memory.received") : t("site.leaveTrace")} onClose={onClose}>
      {done ? (
        <div className="success-state">
          <CheckCircle2 size={52} />
          <h3>{t("memory.joined")}</h3>
          <p>
            {live
              ? t("memory.pendingLive")
              : t("memory.pendingDemo")}
          </p>
          <Tag>{t("memory.pendingTag")}</Tag>
          <button className="btn" onClick={onClose}>
            {t("common.backToExplore")}
          </button>
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!text.trim() || !accepted) return;
            setBusy(true);
            setError("");
            const failure = await onSubmit(
              {
                id: crypto.randomUUID(),
                siteId: site.id,
                text: text.trim(),
                photo,
                status: "pending",
                createdAt: new Date().toISOString(),
                author: "Gezgin",
              },
              { textVersion: kvkkConsent.textVersion },
            );
            setBusy(false);
            if (failure === null) setDone(true);
            else
              setError(
                live
                  ? failure
                  : t("memory.saveFailed"),
              );
          }}
        >
          <p className="muted">{t("memory.prompt", { name: pick(site.name, site.nameEn) })}</p>
          <label
            className={`upload ${photo ? "has-photo" : ""}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void loadPhoto(e.dataTransfer.files[0]);
            }}
          >
            {photo ? (
              <img src={photo} alt={t("memory.previewAlt")} />
            ) : (
              <>
                <ImagePlus size={30} />
                <strong>{t("memory.addPhoto")}</strong>
                <span>{t("memory.upload")}</span>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png"
              aria-label={t("memory.photoLabel")}
              onChange={(e) => void loadPhoto(e.target.files?.[0])}
            />
          </label>
          {photo && (
            <button
              type="button"
              className="text-btn"
              onClick={() => setPhoto(undefined)}
            >
              {t("memory.removePhoto")}
            </button>
          )}
          <label className="field">
            {t("memory.yours")}
            <textarea
              placeholder={t("memory.placeholder")}
              maxLength={280}
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </label>
          <p className="character-count">{text.length} / 280</p>
          <Notice>
            {live
              ? t("memory.noticeLive")
              : t("memory.noticeDemo")}
          </Notice>
          <Notice>
            {t("kvkk.summary")} {t("kvkk.draftNotice")}
          </Notice>
          <label className="checkbox-label">
            <input
              type="checkbox"
              required
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            {t("kvkk.checkbox")}
          </label>
          <UploadProgress />
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onClose}>
              {t("common.cancel")}
            </button>
            <button
              className="btn"
              disabled={busy || !accepted || !text.trim()}
            >
              {busy ? t("memory.saving") : t("memory.submit")}
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
type QuizOutcome = { correct: boolean; awarded: number; solvedBefore: boolean };
export function QuizModal({
  site,
  client,
  onClose,
  onSnapshot,
}: {
  site: HeritageSite;
  client: AkarClient;
  onClose: () => void;
  onSnapshot: (snapshot: Snapshot) => void;
}) {
  const { lang, t } = useI18n();
  // Quiz content has no English twin yet: it is marked Turkish inside QuizQuestion.
  const [quizzes, setQuizzes] = useState<PlayableQuiz[]>(),
    [loadError, setLoadError] = useState(""),
    [attempt, setAttempt] = useState(0),
    [index, setIndex] = useState(0),
    [outcomes, setOutcomes] = useState<QuizOutcome[]>([]);
  useEffect(() => {
    let cancelled = false;
    setQuizzes(undefined);
    setLoadError("");
    client
      .getQuizzes(site.id)
      .then((list) => !cancelled && setQuizzes(list))
      .catch(
        (e) =>
          !cancelled &&
          setLoadError(describeError(e, t("quiz.loadFailed"), lang)),
      );
    return () => {
      cancelled = true;
    };
  }, [client, site.id, attempt]);
  const total = quizzes?.length ?? 0,
    done = !!quizzes && total > 0 && index >= total,
    correct = outcomes.filter((o) => o.correct).length,
    points = outcomes.reduce((sum, o) => sum + o.awarded, 0);
  return (
    <Modal title={t("quiz.title")} onClose={onClose}>
      {loadError ? (
        <>
          <p role="alert" className="error">
            {loadError}
          </p>
          <div className="modal-actions">
            <button className="btn" onClick={() => setAttempt(attempt + 1)}>
              Yeniden dene
            </button>
          </div>
        </>
      ) : !quizzes ? (
        <p className="muted" aria-busy="true">
          {t("quiz.loading")}
        </p>
      ) : total === 0 ? (
        <div className="empty-state">
          <Puzzle size={30} />
          <h3>{t("quiz.none")}</h3>
          <p>
            {t("quiz.noneHint")}
          </p>
          <button className="btn secondary" onClick={onClose}>
            {t("common.backToExplore")}
          </button>
        </div>
      ) : done ? (
        <div className="success-state">
          <Trophy size={52} />
          <h3>
            {t("quiz.score", { correct, total })}
          </h3>
          <p>{t("quiz.scoreHint")}</p>
          <Tag tone="success">
            {points > 0
              ? t("quiz.pointsEarned", { points })
              : outcomes.some((o) => o.solvedBefore)
                ? t("quiz.pointsBefore")
                : t("quiz.pointsNone")}
          </Tag>
          <button className="btn" onClick={onClose}>
            {t("common.backToExplore")}
          </button>
        </div>
      ) : (
        <QuizQuestion
          key={quizzes[index].id}
          quiz={quizzes[index]}
          position={t("quiz.position", { n: index + 1, total })}
          last={index === total - 1}
          client={client}
          onSnapshot={onSnapshot}
          onNext={(outcome) => {
            setOutcomes([...outcomes, outcome]);
            setIndex(index + 1);
          }}
        />
      )}
    </Modal>
  );
}
function QuizQuestion({
  quiz,
  position,
  last,
  client,
  onSnapshot,
  onNext,
}: {
  quiz: PlayableQuiz;
  position: string;
  last: boolean;
  client: AkarClient;
  onSnapshot: (snapshot: Snapshot) => void;
  onNext: (outcome: QuizOutcome) => void;
}) {
  const { lang, t } = useI18n();
  const tr = lang === "en" ? "tr" : undefined;
  const [choice, setChoice] = useState<number>(),
    [wrong, setWrong] = useState<number[]>([]),
    [hint, setHint] = useState(quiz.hint),
    [phase, setPhase] = useState<"open" | "correct" | "revealed">(
      quiz.solved ? "correct" : "open",
    ),
    [explanation, setExplanation] = useState<string | null>(null),
    [awarded, setAwarded] = useState(0),
    [correctOption, setCorrectOption] = useState<string>(),
    [confirmReveal, setConfirmReveal] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const noPoints = quiz.revealed && !quiz.solved;
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(describeError(e, t("error.failed"), lang));
    }
    setBusy(false);
  }
  const check = () =>
    run(async () => {
      if (choice === undefined) return;
      const result = await client.answerQuiz(quiz.id, choice);
      onSnapshot(result.snapshot);
      if (result.correct) {
        setAwarded(result.awarded);
        setExplanation(result.explanation);
        setPhase("correct");
      } else {
        setWrong([...wrong, choice]);
        setChoice(undefined);
        setHint(result.hint ?? hint);
      }
    });
  const reveal = () =>
    run(async () => {
      const result = await client.revealQuiz(quiz.id);
      onSnapshot(result.snapshot);
      setCorrectOption(result.correctOption);
      setConfirmReveal(false);
      setPhase("revealed");
    });
  const closed = phase !== "open";
  return (
    <>
      <div className="row between">
        <Tag>{position}</Tag>
        <small className="muted">{t("quiz.fromHome")}</small>
      </div>
      <h3 className="quiz-question" lang={tr}>{quiz.question}</h3>
      <div className="quiz-options">
        {quiz.options.map((option, i) => (
          <button
            key={option}
            disabled={closed || busy || wrong.includes(i)}
            className={`quiz-option ${choice === i ? "selected" : ""} ${wrong.includes(i) ? "wrong" : ""} ${option === correctOption ? "correct" : ""}`}
            aria-pressed={choice === i}
            onClick={() => setChoice(i)}
          >
            <span>{String.fromCharCode(65 + i)}</span>
            <span lang={tr}>{option}</span>
          </button>
        ))}
      </div>
      {noPoints && phase === "open" && (
        <Notice>{t("quiz.noPoints")}</Notice>
      )}
      {phase === "correct" && (
        <Notice>
          {quiz.solved
            ? t("quiz.solvedBefore")
            : <>{t("quiz.correct")} <span lang={tr}>{explanation ?? ""}</span>{awarded > 0 ? ` ${t("quiz.pointsEarned", { points: awarded })}.` : ""}</>}
        </Notice>
      )}
      {phase === "revealed" && (
        <Notice>
          {t("quiz.revealed", { answer: correctOption ?? "" })}
        </Notice>
      )}
      {hint && phase === "open" && (
        <p className="hint">
          <Lightbulb size={14} /> <span lang={tr}>{hint}</span>
        </p>
      )}
      {wrong.length > 0 && phase === "open" && (
        <p className="muted">{t("quiz.retry")}</p>
      )}
      {confirmReveal && phase === "open" && (
        <Notice>
          {t("quiz.confirmReveal")}
        </Notice>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="modal-actions">
        {phase === "open" ? (
          <>
            {confirmReveal ? (
              <>
                <button
                  className="btn secondary"
                  disabled={busy}
                  onClick={() => setConfirmReveal(false)}
                >
                  {t("common.cancel")}
                </button>
                <button className="btn" disabled={busy} onClick={reveal}>
                  {t("quiz.revealAnyway")}
                </button>
              </>
            ) : (
              <>
                {wrong.length > 0 && (
                  <button
                    className="btn secondary"
                    disabled={busy}
                    onClick={() =>
                      noPoints ? void reveal() : setConfirmReveal(true)
                    }
                  >
                    {t("quiz.reveal")}
                  </button>
                )}
                <button
                  className="btn"
                  disabled={choice === undefined || busy}
                  onClick={check}
                >
                  {busy ? t("quiz.checking") : t("quiz.check")}
                  <ArrowRight size={16} />
                </button>
              </>
            )}
          </>
        ) : (
          <button
            className="btn"
            onClick={() =>
              onNext({
                correct: phase === "correct",
                awarded,
                solvedBefore: quiz.solved,
              })
            }
          >
            {last ? t("quiz.result") : t("quiz.next")}
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </>
  );
}
export function VisitModal({
  site,
  onClose,
  onVisit,
  visited,
  live = false,
}: {
  site: HeritageSite;
  onClose: () => void;
  onVisit: () => Promise<boolean>;
  visited: boolean;
  live?: boolean;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false),
    [done, setDone] = useState(visited);
  return (
    <Modal title={t("site.imHere")} onClose={onClose}>
      <div className="success-state">
        {done ? <ShieldCheck size={48} /> : <MapPin size={48} />}
        <h3>
          {done
            ? live
              ? t("visit.verified")
              : t("visit.demoDone")
            : <Localized tr={site.name} en={site.nameEn} />}
        </h3>
        <p>
          {done
            ? t("visit.already")
            : live
              ? t("visit.liveText")
              : t("visit.demoText")}
        </p>
        {!live && (
          <Tag tone="representative">
            {t("visit.simulation")}
          </Tag>
        )}
        {done ? (
          <button className="btn" onClick={onClose}>
            {t("common.continue")}
          </button>
        ) : (
          <button
            className="btn"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              if (await onVisit()) setDone(true);
              setBusy(false);
            }}
          >
            {busy
              ? t("visit.verifying")
              : live
                ? t("visit.verify")
                : t("visit.demoComplete")}
          </button>
        )}
      </div>
    </Modal>
  );
}
