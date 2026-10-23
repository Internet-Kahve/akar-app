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
      setError("JPG veya PNG seç; dosya en fazla 5 MB olabilir.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setError("Fotoğraf okunamadı.");
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  }
  return (
    <Modal title={done ? "İzin alındı" : `İz Bırak`} onClose={onClose}>
      {done ? (
        <div className="success-state">
          <CheckCircle2 size={52} />
          <h3>Hikâyeye sen de katıldın.</h3>
          <p>
            {live
              ? "Anın onay bekliyor. Moderasyon incelemesinden sonra yaşayan hafızada görünecek."
              : "Anın onay bekliyor. Demo yönetim panelinde onaylandıktan sonra yaşayan hafızada görünecek."}
          </p>
          <Tag>Onay bekliyor</Tag>
          <button className="btn" onClick={onClose}>
            Keşfe dön
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
                  : "Anın kaydedilemedi. Fotoğrafı küçültüp tekrar deneyebilirsin.",
              );
          }}
        >
          <p className="muted">{site.name} · Burada seni etkileyen ne oldu?</p>
          <label
            className={`upload ${photo ? "has-photo" : ""}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void loadPhoto(e.dataTransfer.files[0]);
            }}
          >
            {photo ? (
              <img src={photo} alt="Paylaşılacak fotoğrafın önizlemesi" />
            ) : (
              <>
                <ImagePlus size={30} />
                <strong>Bir fotoğraf ekle</strong>
                <span>Seç veya buraya sürükle · JPG / PNG · En fazla 5 MB</span>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png"
              aria-label="Anı fotoğrafı"
              onChange={(e) => void loadPhoto(e.target.files?.[0])}
            />
          </label>
          {photo && (
            <button
              type="button"
              className="text-btn"
              onClick={() => setPhoto(undefined)}
            >
              Fotoğrafı kaldır
            </button>
          )}
          <label className="field">
            Anın
            <textarea
              placeholder="Bazen bir ayrıntı, bütün bir hikâyeyi anlatır…"
              maxLength={280}
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </label>
          <p className="character-count">{text.length} / 280</p>
          <Notice>
            {live
              ? "Anın moderatör incelemesinden geçtikten sonra yayımlanır."
              : "Bu demo paylaşımı yalnızca bu tarayıcıda saklar. Gerçek moderasyon ve yayın backend entegrasyonuyla açılacak."}
          </Notice>
          <Notice>
            {kvkkConsent.summary} {kvkkConsent.draftNotice}
          </Notice>
          <label className="checkbox-label">
            <input
              type="checkbox"
              required
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            {kvkkConsent.checkbox}
          </label>
          <UploadProgress />
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onClose}>
              Vazgeç
            </button>
            <button
              className="btn"
              disabled={busy || !accepted || !text.trim()}
            >
              {busy ? "Kaydediliyor…" : "Onaya gönder"}
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
          setLoadError(describeError(e, "Bulmacalar yüklenemedi.")),
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
    <Modal title="Küçük bir keşif molası" onClose={onClose}>
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
          Bulmacalar yükleniyor…
        </p>
      ) : total === 0 ? (
        <div className="empty-state">
          <Puzzle size={30} />
          <h3>Bu eser için henüz bulmaca yok.</h3>
          <p>
            Başka bir eserin hikâyesinde küçük bir keşif molası verebilirsin.
          </p>
          <button className="btn secondary" onClick={onClose}>
            Keşfe dön
          </button>
        </div>
      ) : done ? (
        <div className="success-state">
          <Trophy size={52} />
          <h3>
            {correct} / {total} doğru cevap
          </h3>
          <p>Her cevap, hikâyenin yeni bir parçası.</p>
          <Tag tone="success">
            {points > 0
              ? `+${points} keşif puanı`
              : outcomes.some((o) => o.solvedBefore)
                ? "Bu bulmacaların puanı daha önce alındı"
                : "Öğrenmeye devam · Puan kazanılmadı"}
          </Tag>
          <button className="btn" onClick={onClose}>
            Keşfe dön
          </button>
        </div>
      ) : (
        <QuizQuestion
          key={quizzes[index].id}
          quiz={quizzes[index]}
          position={`Bulmaca ${index + 1} / ${total}`}
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
      setError(describeError(e, "İşlem tamamlanamadı."));
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
        <small className="muted">Evden de çözebilirsin</small>
      </div>
      <h3 className="quiz-question">{quiz.question}</h3>
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
            {option}
          </button>
        ))}
      </div>
      {noPoints && phase === "open" && (
        <Notice>Bu soruda cevap daha önce gösterildi; puan kazanılmaz.</Notice>
      )}
      {phase === "correct" && (
        <Notice>
          {quiz.solved
            ? "Bu soruyu daha önce doğru yanıtlamıştın; puan bir kez verilir."
            : `Doğru! ${explanation ?? ""}${awarded > 0 ? ` +${awarded} keşif puanı.` : ""}`}
        </Notice>
      )}
      {phase === "revealed" && (
        <Notice>
          Doğru cevap: {correctOption}. Birlikte öğrendik; bu sorudan puan
          kazanılmadı.
        </Notice>
      )}
      {hint && phase === "open" && (
        <p className="hint">
          <Lightbulb size={14} /> {hint}
        </p>
      )}
      {wrong.length > 0 && phase === "open" && (
        <p className="muted">Olmadı, bir daha dene ya da cevabı göster.</p>
      )}
      {confirmReveal && phase === "open" && (
        <Notice>
          Cevabı gösterirsen bu sorudan puan kazanamazsın. Devam etmek istiyor
          musun?
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
                  Vazgeç
                </button>
                <button className="btn" disabled={busy} onClick={reveal}>
                  Yine de göster
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
                    Cevabı göster
                  </button>
                )}
                <button
                  className="btn"
                  disabled={choice === undefined || busy}
                  onClick={check}
                >
                  {busy ? "Kontrol ediliyor…" : "Cevabı kontrol et"}
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
            {last ? "Sonucu gör" : "Sonraki soru"}
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
  const [busy, setBusy] = useState(false),
    [done, setDone] = useState(visited);
  return (
    <Modal title="Yanındayım" onClose={onClose}>
      <div className="success-state">
        {done ? <ShieldCheck size={48} /> : <MapPin size={48} />}
        <h3>
          {done
            ? live
              ? "Ziyaretin doğrulandı"
              : "Demo ziyareti pasaportunda"
            : site.name}
        </h3>
        <p>
          {done
            ? "Bu eser daha önce ziyaret edildi."
            : live
              ? "Konum izni vererek bu eserin yakınında olduğunu doğrulayabilirsin. Ziyaret, konumun kontrol edildikten sonra pasaportuna eklenir."
              : "Demo ziyaretini deneyerek keşif ilerlemeni görebilirsin. Gerçek konum doğrulaması yapılmaz."}
        </p>
        {!live && (
          <Tag tone="representative">
            Simülasyon · Fiziksel ziyaret doğrulanmadı
          </Tag>
        )}
        {done ? (
          <button className="btn" onClick={onClose}>
            Devam et
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
              ? "Konum doğrulanıyor…"
              : live
                ? "Ziyareti doğrula"
                : "Demo ziyaretini tamamla · +100"}
          </button>
        )}
      </div>
    </Modal>
  );
}
