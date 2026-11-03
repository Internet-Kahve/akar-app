"use client";
import { MoveDown, MoveUp, Plus, Trash2 } from "lucide-react";
import {
  trustLabels,
  type SiteBadge,
  type SitePhoto,
  type SiteTask,
  type Trust,
} from "@akar/domain";
import { translationLabels } from "../lib/translation-labels";
import { moved } from "./admin-part-cards";
import { Notice } from "./ui";

type Quiz = NonNullable<SiteTask["quiz"]>;
type FieldTask = NonNullable<SiteTask["field"]>;

const emptyQuiz = (): Quiz => ({
  options: ["", ""],
  hints: [],
  wrongText: "",
  fromHome: false,
  correctIndex: 0,
  correctText: "",
});
const emptyField = (): FieldTask => ({
  onSite: { text: "", radiusM: 80 },
  fromHome: null,
  doneText: "",
});

/** The English list with `value` at `index`; `undefined` when nothing in it is written (the API takes none). */
function englishList(tr: string[], en: string[] | undefined, index: number, value: string) {
  const next = tr.map((_, j) => (j === index ? value : (en?.[j] ?? "")));
  return next.some(Boolean) ? next : undefined;
}

function hasEnglish(t: SiteTask) {
  const q = t.kind === "quiz" ? t.quiz : undefined;
  const f = t.kind === "field" ? t.field : undefined;
  return [
    t.titleEn,
    t.promptEn,
    q?.correctTextEn,
    q?.wrongTextEn,
    ...(q?.optionsEn ?? []),
    ...(q?.hintsEn ?? []),
    f?.onSite.textEn,
    f?.fromHome?.textEn,
    f?.doneTextEn,
  ].some(Boolean);
}

/** One status for all English texts of a task or badge: what is written and where it came from. */
const englishLabel = (written: boolean, status: SiteTask["enStatus"]) =>
  `EN: ${written ? translationLabels[status ?? "reviewed"] : "İngilizce yok"}`;

function Text({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="field">
      {label}
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

/** A list of Turkish texts with their English next to them (options, hints), kept the same length. */
function TextList({
  title,
  addLabel,
  items,
  itemsEn,
  max,
  min,
  correct,
  radioName,
  onChange,
  onCorrect,
}: {
  title: string;
  addLabel: string;
  items: string[];
  itemsEn: string[] | undefined;
  max: number;
  min: number;
  /** Options: index of the right one, shown as a radio next to each. */
  correct?: number | undefined;
  radioName?: string;
  /** `removed` is the index taken out, when the change is a removal. */
  onChange: (items: string[], itemsEn: string[] | undefined, removed?: number) => void;
  onCorrect?: (index: number) => void;
}) {
  return (
    <div className="field">
      {title}
      {items.map((item, j) => (
        <div className="row" key={j}>
          {onCorrect && (
            <input
              type="radio"
              name={radioName}
              aria-label={`${j + 1}. seçenek doğru cevap`}
              checked={correct === j}
              onChange={() => onCorrect(j)}
            />
          )}
          <input
            aria-label={`${title} ${j + 1}`}
            value={item}
            onChange={(e) => onChange(items.map((x, k) => (k === j ? e.target.value : x)), itemsEn)}
          />
          <input
            aria-label={`${title} ${j + 1} (EN)`}
            placeholder="EN"
            value={itemsEn?.[j] ?? ""}
            onChange={(e) => onChange(items, englishList(items, itemsEn, j, e.target.value))}
          />
          <button
            className="icon-btn"
            aria-label={`${title} ${j + 1} kaldır`}
            disabled={items.length <= min}
            onClick={() =>
              onChange(
                items.filter((_, k) => k !== j),
                itemsEn?.filter((_, k) => k !== j),
                j,
              )
            }
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <div>
        <button
          className="btn soft"
          disabled={items.length >= max}
          onClick={() => onChange([...items, ""], itemsEn && [...itemsEn, ""])}
        >
          <Plus size={14} />
          {addLabel}
        </button>
      </div>
    </div>
  );
}

function PartSelect({
  label,
  value,
  modelParts,
  optional,
  onChange,
}: {
  label: string;
  value: string;
  modelParts: string[] | undefined;
  optional: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      {label}
      <select value={value} disabled={!modelParts} onChange={(e) => onChange(e.target.value)}>
        {optional && <option value="">Parça yok</option>}
        {value && !modelParts?.includes(value) && <option value={value}>{value} (modelde yok)</option>}
        {modelParts?.map((p) => (
          <option value={p} key={p}>
            {p}
          </option>
        ))}
      </select>
    </label>
  );
}

function QuizFields({
  id,
  quiz,
  onChange,
}: {
  id: string;
  quiz: Quiz;
  onChange: (quiz: Quiz) => void;
}) {
  const patch = (change: Partial<Quiz>) => onChange({ ...quiz, ...change });
  const key = quiz.correctIndex ?? -1;
  return (
    <>
      <TextList
        title="Seçenekler (doğru olanı işaretle)"
        addLabel="Seçenek ekle"
        items={quiz.options}
        itemsEn={quiz.optionsEn}
        min={2}
        max={6}
        correct={quiz.correctIndex}
        radioName={`correct-${id}`}
        onChange={(options, optionsEn, removed) => {
          // Taking out an option before the right one moves the key with it; taking out the right one clears it.
          const correctIndex =
            removed === undefined || removed > key ? quiz.correctIndex : removed === key ? undefined : key - 1;
          patch({ options, optionsEn, correctIndex });
        }}
        onCorrect={(correctIndex) => patch({ correctIndex })}
      />
      {quiz.correctIndex === undefined && (
        <p className="error" role="alert">
          Doğru seçeneği işaretle.
        </p>
      )}
      <TextList
        title="İpuçları"
        addLabel="İpucu ekle"
        items={quiz.hints}
        itemsEn={quiz.hintsEn}
        min={0}
        max={10}
        onChange={(hints, hintsEn) => patch({ hints, hintsEn })}
      />
      <div className="form-grid">
        <Text
          label="Doğru cevapta gösterilen metin"
          value={quiz.correctText ?? ""}
          onChange={(correctText) => patch({ correctText })}
        />
        <Text
          label="Doğru cevapta gösterilen metin (EN)"
          value={quiz.correctTextEn ?? ""}
          onChange={(correctTextEn) => patch({ correctTextEn })}
        />
        <Text
          label="Yanlış cevapta gösterilen metin"
          value={quiz.wrongText}
          onChange={(wrongText) => patch({ wrongText })}
        />
        <Text
          label="Yanlış cevapta gösterilen metin (EN)"
          value={quiz.wrongTextEn ?? ""}
          onChange={(wrongTextEn) => patch({ wrongTextEn })}
        />
      </div>
      <label className="row">
        <input
          type="checkbox"
          checked={quiz.fromHome}
          onChange={(e) => patch({ fromHome: e.target.checked })}
        />
        Evden de çözülebilir (ziyaretçinin eserin yanında olması gerekmez)
      </label>
    </>
  );
}

function FieldFields({
  field,
  modelParts,
  onChange,
}: {
  field: FieldTask;
  modelParts: string[] | undefined;
  onChange: (field: FieldTask) => void;
}) {
  const home = field.fromHome;
  return (
    <>
      <div className="form-grid">
        <Text
          label="Yerinde yapılacak görev"
          multiline
          value={field.onSite.text}
          onChange={(text) => onChange({ ...field, onSite: { ...field.onSite, text } })}
        />
        <Text
          label="Yerinde yapılacak görev (EN)"
          multiline
          value={field.onSite.textEn ?? ""}
          onChange={(textEn) => onChange({ ...field, onSite: { ...field.onSite, textEn } })}
        />
        <label className="field">
          Eserden en çok uzaklık (metre)
          <input
            type="number"
            min={10}
            max={5000}
            value={field.onSite.radiusM}
            onChange={(e) =>
              onChange({ ...field, onSite: { ...field.onSite, radiusM: Number(e.target.value) || 0 } })
            }
          />
        </label>
      </div>
      <label className="row">
        <input
          type="checkbox"
          checked={Boolean(home)}
          disabled={!modelParts?.length}
          onChange={(e) =>
            onChange({
              ...field,
              fromHome: e.target.checked ? { text: "", part: modelParts?.[0] ?? "" } : null,
            })
          }
        />
        Evden de yapılabilir: 3D modelde bir parçaya dokunma
      </label>
      {!modelParts?.length && <Notice>Evden yapılan görev için önce Model adımında 3D model ekle.</Notice>}
      {home && (
        <div className="form-grid">
          <Text
            label="Evden yapılacak görev"
            multiline
            value={home.text}
            onChange={(text) => onChange({ ...field, fromHome: { ...home, text } })}
          />
          <Text
            label="Evden yapılacak görev (EN)"
            multiline
            value={home.textEn ?? ""}
            onChange={(textEn) => onChange({ ...field, fromHome: { ...home, textEn } })}
          />
          <PartSelect
            label="Dokunulacak parça"
            value={home.part}
            modelParts={modelParts}
            optional={false}
            onChange={(part) => onChange({ ...field, fromHome: { ...home, part } })}
          />
        </div>
      )}
      <div className="form-grid">
        <Text
          label="Görev bitince gösterilen metin"
          value={field.doneText ?? ""}
          onChange={(doneText) => onChange({ ...field, doneText })}
        />
        <Text
          label="Görev bitince gösterilen metin (EN)"
          value={field.doneTextEn ?? ""}
          onChange={(doneTextEn) => onChange({ ...field, doneTextEn })}
        />
      </div>
    </>
  );
}

/**
 * "Görevler ve rozetler" step of the site editor (§11.67): the site's quiz and field tasks and its badges, in order.
 * A task keeps its id across edits (players' completions stay, also when the answer changes); one taken out of the list
 * takes its completions and its badges with it. `modelParts` is undefined while the site has no model; `photos` are
 * the site's photographs.
 */
export function TasksStep({
  tasks,
  badges,
  modelParts,
  photos,
  onChange,
}: {
  tasks: SiteTask[];
  badges: SiteBadge[];
  modelParts: string[] | undefined;
  photos: SitePhoto[];
  onChange: (tasks: SiteTask[], badges: SiteBadge[]) => void;
}) {
  const patch = (id: string, change: Partial<SiteTask>) =>
    onChange(
      tasks.map((t) => (t.id === id ? { ...t, ...change } : t)),
      badges,
    );
  const patchBadge = (id: string, change: Partial<SiteBadge>) =>
    onChange(
      tasks,
      badges.map((b) => (b.id === id ? { ...b, ...change } : b)),
    );
  const addTask = (kind: SiteTask["kind"]) =>
    onChange(
      [
        ...tasks,
        {
          id: crypto.randomUUID(),
          kind,
          title: "",
          prompt: "",
          trust: "representative",
          ...(kind === "quiz" ? { quiz: emptyQuiz() } : { field: emptyField() }),
        },
      ],
      badges,
    );
  const taskName = (t: SiteTask, i: number) => `${i + 1}. ${t.title || "Adsız görev"}`;
  return (
    <div className="editor-step-content">
      <div className="row between">
        <h2>Görevler ve rozetler</h2>
        <div className="row">
          <button className="btn secondary" onClick={() => addTask("quiz")}>
            <Plus size={16} />
            Soru ekle
          </button>
          <button className="btn secondary" onClick={() => addTask("field")}>
            <Plus size={16} />
            Saha görevi ekle
          </button>
        </div>
      </div>
      <p className="muted">
        Ziyaretçi bir soruyu cevaplayarak ya da eserin yanında (veya evden 3D modelde) bir görevi yaparak rozet kazanır.
        Bir görevi düzenlemek ziyaretçilerin tamamlamalarını ve rozetlerini silmez; cevap anahtarı değişse de kalırlar.
        Listeden çıkardığın görev ve rozet, onu tamamlayanların kaydıyla birlikte silinir; çıkardığın göreve bağlı rozetler de kalkar.
      </p>
      {!tasks.length && <Notice>Henüz görev yok.</Notice>}
      {tasks.map((task, i) => (
        <fieldset className="cue-editor card" key={task.id} data-task-id={task.id}>
          <legend>
            {task.kind === "quiz" ? "Soru" : "Saha görevi"} {i + 1}
          </legend>
          <div className="cue-top">
            <Text label="Başlık" value={task.title} onChange={(title) => patch(task.id, { title })} />
            <div className="row">
              <button
                className="icon-btn"
                aria-label={`${i + 1}. görevi yukarı taşı`}
                disabled={i === 0}
                onClick={() => onChange(moved(tasks, i, -1), badges)}
              >
                <MoveUp size={16} />
              </button>
              <button
                className="icon-btn"
                aria-label={`${i + 1}. görevi aşağı taşı`}
                disabled={i === tasks.length - 1}
                onClick={() => onChange(moved(tasks, i, 1), badges)}
              >
                <MoveDown size={16} />
              </button>
              <button
                className="icon-btn"
                aria-label={`${i + 1}. görevi kaldır`}
                onClick={() =>
                  onChange(
                    tasks.filter((t) => t.id !== task.id),
                    badges.filter((b) => b.taskId !== task.id),
                  )
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <Text
            label={task.kind === "quiz" ? "Soru" : "Görev metni"}
            multiline
            value={task.prompt}
            onChange={(prompt) => patch(task.id, { prompt })}
          />
          <small className="muted">{englishLabel(hasEnglish(task), task.enStatus)}</small>
          <div className="form-grid">
            <Text label="Başlık (EN)" value={task.titleEn ?? ""} onChange={(titleEn) => patch(task.id, { titleEn })} />
            <Text
              label={task.kind === "quiz" ? "Soru (EN)" : "Görev metni (EN)"}
              multiline
              value={task.promptEn ?? ""}
              onChange={(promptEn) => patch(task.id, { promptEn })}
            />
          </div>
          <div className="form-grid">
            <label className="field">
              Tür
              <select
                value={task.kind}
                onChange={(e) => {
                  const kind = e.target.value as SiteTask["kind"];
                  // The other kind's details stay in the draft (a mistaken switch loses nothing); only the one in use is saved.
                  patch(task.id, {
                    kind,
                    ...(kind === "quiz"
                      ? { quiz: task.quiz ?? emptyQuiz() }
                      : { field: task.field ?? emptyField() }),
                  });
                }}
              >
                <option value="quiz">Soru</option>
                <option value="field">Saha görevi</option>
              </select>
            </label>
            <label className="field">
              Fotoğraf
              <select
                value={task.photo?.id ?? ""}
                onChange={(e) => patch(task.id, { photo: photos.find((p) => p.id === e.target.value) })}
              >
                <option value="">Fotoğraf yok</option>
                {photos.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.title || p.alt || "Adsız fotoğraf"}
                  </option>
                ))}
              </select>
            </label>
            <PartSelect
              label="Konu olan parça"
              value={task.part ?? ""}
              modelParts={modelParts}
              optional
              onChange={(part) => patch(task.id, { part: part || undefined })}
            />
            <Text
              label="Kaynak (kitap ve sayfa)"
              value={task.source ?? ""}
              onChange={(source) => patch(task.id, { source: source || undefined })}
            />
            <label className="field">
              Güven etiketi
              <select value={task.trust} onChange={(e) => patch(task.id, { trust: e.target.value as Trust })}>
                {Object.entries(trustLabels).map(([k, v]) => (
                  <option value={k} key={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {task.kind === "quiz" && task.quiz && (
            <QuizFields id={task.id} quiz={task.quiz} onChange={(quiz) => patch(task.id, { quiz })} />
          )}
          {task.kind === "field" && task.field && (
            <FieldFields field={task.field} modelParts={modelParts} onChange={(field) => patch(task.id, { field })} />
          )}
        </fieldset>
      ))}

      <div className="row between">
        <h2>Rozetler</h2>
        <button
          className="btn secondary"
          onClick={() =>
            onChange(tasks, [
              ...badges,
              { id: crypto.randomUUID(), title: "", text: "", condition: "story", taskId: null, onSiteLabel: false },
            ])
          }
        >
          <Plus size={16} />
          Rozet ekle
        </button>
      </div>
      {!badges.length && <Notice>Henüz rozet yok.</Notice>}
      {badges.map((badge, i) => (
        <fieldset className="cue-editor card" key={badge.id} data-badge-id={badge.id}>
          <legend>Rozet {i + 1}</legend>
          <div className="cue-top">
            <Text label="Başlık" value={badge.title} onChange={(title) => patchBadge(badge.id, { title })} />
            <div className="row">
              <button
                className="icon-btn"
                aria-label={`${i + 1}. rozeti yukarı taşı`}
                disabled={i === 0}
                onClick={() => onChange(tasks, moved(badges, i, -1))}
              >
                <MoveUp size={16} />
              </button>
              <button
                className="icon-btn"
                aria-label={`${i + 1}. rozeti aşağı taşı`}
                disabled={i === badges.length - 1}
                onClick={() => onChange(tasks, moved(badges, i, 1))}
              >
                <MoveDown size={16} />
              </button>
              <button
                className="icon-btn"
                aria-label={`${i + 1}. rozeti kaldır`}
                onClick={() =>
                  onChange(
                    tasks,
                    badges.filter((b) => b.id !== badge.id),
                  )
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <Text label="Metin" multiline value={badge.text} onChange={(text) => patchBadge(badge.id, { text })} />
          <small className="muted">{englishLabel(Boolean(badge.titleEn || badge.textEn), badge.enStatus)}</small>
          <div className="form-grid">
            <Text
              label="Başlık (EN)"
              value={badge.titleEn ?? ""}
              onChange={(titleEn) => patchBadge(badge.id, { titleEn })}
            />
            <Text
              label="Metin (EN)"
              multiline
              value={badge.textEn ?? ""}
              onChange={(textEn) => patchBadge(badge.id, { textEn })}
            />
          </div>
          <div className="form-grid">
            <label className="field">
              Ne zaman kazanılır
              <select
                value={badge.condition}
                onChange={(e) => {
                  const condition = e.target.value as SiteBadge["condition"];
                  patchBadge(badge.id, { condition, taskId: condition === "task" ? (tasks[0]?.id ?? null) : null });
                }}
              >
                <option value="story">Hikâyeyi bitirince</option>
                <option value="task" disabled={!tasks.length}>
                  Bir görevi yapınca
                </option>
              </select>
            </label>
            {badge.condition === "task" && (
              <label className="field">
                Görev
                <select value={badge.taskId ?? ""} onChange={(e) => patchBadge(badge.id, { taskId: e.target.value })}>
                  {tasks.map((t, j) => (
                    <option value={t.id} key={t.id}>
                      {taskName(t, j)}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <label className="row">
            <input
              type="checkbox"
              checked={badge.onSiteLabel}
              onChange={(e) => patchBadge(badge.id, { onSiteLabel: e.target.checked })}
            />
            Eserin yanında kazanıldıysa «Yerinde» etiketi göster
          </label>
        </fieldset>
      ))}
    </div>
  );
}
