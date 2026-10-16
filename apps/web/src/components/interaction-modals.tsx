"use client";
import { useState } from "react";
import {
  ImagePlus,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  MapPin,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import type { HeritageSite, Memory } from "@akar/domain";
import { Modal, Notice, Tag } from "./ui";
export function MemoryModal({
  site,
  onClose,
  onSubmit,
}: {
  site: HeritageSite;
  onClose: () => void;
  onSubmit: (memory: Memory) => Promise<boolean>;
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
            Anın onay bekliyor. Demo yönetim panelinde onaylandıktan sonra
            yaşayan hafızada görünecek.
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
            const ok = await onSubmit({
              id: crypto.randomUUID(),
              siteId: site.id,
              text: text.trim(),
              photo,
              status: "pending",
              createdAt: new Date().toISOString(),
              author: "Gezgin",
            });
            setBusy(false);
            if (ok) setDone(true);
            else
              setError(
                "Anın kaydedilemedi. Fotoğrafı küçültüp tekrar deneyebilirsin.",
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
            Bu demo paylaşımı yalnızca bu tarayıcıda saklar. Gerçek moderasyon
            ve yayın backend entegrasyonuyla açılacak.
          </Notice>
          <label className="checkbox-label">
            <input
              type="checkbox"
              required
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            Paylaştığım içeriğin bana ait olduğunu ve demo kapsamında yerel
            olarak saklanacağını anladım.
          </label>
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
const questions = [
  {
    title: "Vakıfta “akar” neyi ifade eder?",
    options: ["Gelir sağlayan yapı", "Bir mimari süsleme", "Ziyaretçi defteri"],
    correct: 0,
    hint: "Hamam ve dükkânların vakıf içindeki işlevini düşün.",
    explanation:
      "Örnek hikâyedeki akar, hizmetlerin sürmesini destekleyen gelir sağlayan yapıdır.",
  },
  {
    title: "“Hayrat” hangi amaca hizmet eder?",
    options: [
      "Yalnızca ticarete",
      "Topluma hizmet sunmaya",
      "Yapıların yüksekliğini ölçmeye",
    ],
    correct: 1,
    hint: "Gelirin nasıl bir faydaya dönüştüğünü düşün.",
    explanation:
      "Hayrat, vakfın toplumsal hizmet sunan yapıları için kullanılan kavramdır.",
  },
  {
    title: "Temsili bir tarih anlatımını nasıl okumalıyız?",
    options: [
      "Kesin tarihî belge olarak",
      "Kaynağa gerek duymadan",
      "Kaynak doğrulaması bekleyen örnek olarak",
    ],
    correct: 2,
    hint: "Hikâyedeki içerik etiketini hatırla.",
    explanation:
      "Temsili anlatım, doğrulanmış tarihî belge yerine geçmez. Kaynak ve güven etiketi birlikte değerlendirilir.",
  },
];
export function QuizModal({
  onClose,
  onComplete,
  completed,
}: {
  onClose: () => void;
  onComplete: () => Promise<boolean>;
  completed: boolean;
}) {
  const [index, setIndex] = useState(0),
    [answer, setAnswer] = useState<number>(),
    [checked, setChecked] = useState(false),
    [hint, setHint] = useState(false),
    [score, setScore] = useState(0),
    [done, setDone] = useState(false),
    [busy, setBusy] = useState(false);
  const [wasCompleted] = useState(completed);
  const q = questions[index];
  return (
    <Modal title="Küçük bir keşif molası" onClose={onClose}>
      {done ? (
        <div className="success-state">
          <Trophy size={52} />
          <h3>{score} / 3 doğru cevap</h3>
          <p>Her cevap, hikâyenin yeni bir parçası.</p>
          <Tag tone="success">
            {wasCompleted
              ? "Bu bulmacanın puanı daha önce alındı"
              : score > 0
                ? "+20 keşif puanı"
                : "Öğrenmeye devam · Puan kazanılmadı"}
          </Tag>
          <button className="btn" onClick={onClose}>
            Keşfe dön
          </button>
        </div>
      ) : (
        <>
          <div className="row between">
            <Tag>Bulmaca {index + 1} / 3</Tag>
            <small className="muted">Evden de çözebilirsin</small>
          </div>
          <h3 className="quiz-question">{q.title}</h3>
          <div className="quiz-options">
            {q.options.map((option, i) => (
              <button
                key={option}
                disabled={checked}
                className={`quiz-option ${answer === i ? "selected" : ""} ${checked && q.correct === i ? "correct" : ""}`}
                aria-pressed={answer === i}
                onClick={() => setAnswer(i)}
              >
                <span>{String.fromCharCode(65 + i)}</span>
                {option}
              </button>
            ))}
          </div>
          {!checked ? (
            <button className="text-btn" onClick={() => setHint(true)}>
              <Lightbulb size={16} />
              Bir ipucu al
            </button>
          ) : (
            <Notice>
              {answer === q.correct ? "Doğru! " : "Birlikte öğrenelim. "}
              {q.explanation} Kaynak: demo hikâyesi, “Bir yapı, diğerini
              yaşatır”.
            </Notice>
          )}
          {hint && !checked && <p className="hint">{q.hint}</p>}
          <div className="modal-actions">
            <button
              className="btn"
              disabled={answer === undefined || busy}
              onClick={async () => {
                if (!checked) {
                  setChecked(true);
                  if (answer === q.correct) setScore(score + 1);
                } else if (index < 2) {
                  setIndex(index + 1);
                  setAnswer(undefined);
                  setChecked(false);
                  setHint(false);
                } else {
                  setBusy(true);
                  if (score > 0) {
                    if (await onComplete()) setDone(true);
                  } else setDone(true);
                  setBusy(false);
                }
              }}
            >
              {checked
                ? index === 2
                  ? "Sonucu gör"
                  : "Sonraki soru"
                : "Cevabı kontrol et"}
              <ArrowRight size={16} />
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
export function VisitModal({
  site,
  onClose,
  onVisit,
  visited,
}: {
  site: HeritageSite;
  onClose: () => void;
  onVisit: () => Promise<boolean>;
  visited: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [done, setDone] = useState(visited);
  return (
    <Modal title="Yanındayım" onClose={onClose}>
      <div className="success-state">
        {done ? <ShieldCheck size={48} /> : <MapPin size={48} />}
        <h3>{done ? "Demo ziyareti pasaportunda" : site.name}</h3>
        <p>
          {done
            ? "Bu eser daha önce ziyaret edildi."
            : "Demo ziyaretini deneyerek keşif ilerlemeni görebilirsin. Gerçek konum doğrulaması yapılmaz."}
        </p>
        <Tag tone="representative">
          Simülasyon · Fiziksel ziyaret doğrulanmadı
        </Tag>
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
            Demo ziyaretini tamamla · +100
          </button>
        )}
      </div>
    </Modal>
  );
}
