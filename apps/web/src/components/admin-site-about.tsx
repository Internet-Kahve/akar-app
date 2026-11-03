"use client";
import { useState, type ReactNode } from "react";
import { MoveDown, MoveUp, Plus, Trash2 } from "lucide-react";
import {
  aboutLimits,
  trustLabels,
  type AboutChapter,
  type AboutReadingEn,
  type HeritageSite,
  type SiteSource,
  type Trust,
} from "@akar/domain";
import { translationLabels } from "../lib/translation-labels";
import { moved } from "./admin-part-cards";
import { Notice } from "./ui";

type Paragraph = NonNullable<HeritageSite["sections"]>[number];
type Kind = AboutChapter["kind"];
type Lists = AboutReadingEn;
type ListKey = keyof Lists;

const kindLabels: Record<Kind, string> = {
  history: "Tarihçe",
  architecture: "Mimari",
  waqf: "Vakıf ve akar",
};

const blank: { [K in ListKey]: () => Lists[K][number] } = {
  summary: () => "",
  figures: () => ({ value: "", label: "", evidence: "" }),
  quotes: () => ({ text: "" }),
  timeline: () => ({ year: "", evidence: "" }),
  terms: () => ({ word: "", definition: "" }),
};

/** The paragraphs in the order the reader shows them: by chapter, then those of no chapter. */
function regroup(chapters: AboutChapter[], list: Paragraph[]): Paragraph[] {
  const ids = new Set(chapters.map((c) => c.id));
  const loose = list
    .filter((s) => !s.chapterId || !ids.has(s.chapterId))
    .map(({ chapterId: _gone, ...rest }) => rest);
  return [...chapters.flatMap((c) => list.filter((s) => s.chapterId === c.id)), ...loose];
}

/** The English reading with every list as long as the Turkish one, missing items blank. */
function padded(tr: Lists, en: Lists | undefined): Lists {
  return {
    summary: tr.summary.map((_, j) => en?.summary[j] ?? blank.summary()),
    figures: tr.figures.map((_, j) => en?.figures[j] ?? blank.figures()),
    quotes: tr.quotes.map((_, j) => en?.quotes[j] ?? blank.quotes()),
    timeline: tr.timeline.map((_, j) => en?.timeline[j] ?? blank.timeline()),
    terms: tr.terms.map((_, j) => en?.terms[j] ?? blank.terms()),
  };
}

const readingTexts = (r: Lists) => [
  ...r.summary,
  ...r.figures.flatMap((f) => [f.value, f.label, f.evidence]),
  ...r.quotes.flatMap((q) => [q.text, q.by ?? ""]),
  ...r.timeline.flatMap((t) => [t.year, t.evidence]),
  ...r.terms.flatMap((t) => [t.word, t.definition]),
];

/** The chapter's reading with one list changed; its English is created or dropped when nothing in it is written. */
function withBlock<K extends ListKey>(
  c: AboutChapter,
  key: K,
  items: Lists[K],
  itemsEn: Lists[K] | undefined,
): Partial<AboutChapter> {
  const tr: Lists = { summary: c.summary, figures: c.figures, quotes: c.quotes, timeline: c.timeline, terms: c.terms };
  const next: Lists = { ...tr, [key]: items };
  const en: Lists | undefined = itemsEn ? { ...padded(next, c.readingEn), [key]: itemsEn } : c.readingEn;
  return { ...next, readingEn: en && readingTexts(en).some((t) => t.trim()) ? en : undefined };
}

/** What the API refuses and the panel can tell in advance: an English reading that is not item for item complete. */
function readingEnIncomplete(c: AboutChapter) {
  if (!c.readingEn) return false;
  const tr: Lists = { summary: c.summary, figures: c.figures, quotes: c.quotes, timeline: c.timeline, terms: c.terms };
  const sizes = (r: Lists) => [r.summary, r.figures, r.quotes, r.timeline, r.terms].map((l) => l.length);
  const required = (r: Lists) => [
    ...r.summary,
    ...r.figures.flatMap((f) => [f.value, f.label, f.evidence]),
    ...r.quotes.map((q) => q.text),
    ...r.timeline.flatMap((t) => [t.year, t.evidence]),
    ...r.terms.flatMap((t) => [t.word, t.definition]),
  ];
  return (
    sizes(tr).some((n, i) => n !== sizes(c.readingEn!)[i]) || required(c.readingEn).some((t) => !t.trim())
  );
}

/** One status for all English texts of a chapter or paragraph: what is written and where it came from. */
const englishLabel = (written: boolean, status: AboutChapter["enStatus"]) =>
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

/**
 * A list of reading items, the Turkish one with its English next to it, kept the same length. `itemsEn` is absent
 * until a chapter has an English reading; writing into it creates the whole reading (`onChange`).
 */
function BlockList<T>({
  title,
  addLabel,
  items,
  itemsEn,
  blank: makeBlank,
  max,
  fields,
  onChange,
}: {
  title: string;
  addLabel: string;
  items: T[];
  itemsEn: T[] | undefined;
  blank: () => T;
  max: number;
  fields: (item: T, set: (next: T) => void, english: boolean) => ReactNode;
  onChange: (items: T[], itemsEn: T[] | undefined) => void;
}) {
  const english = (j: number) => itemsEn?.[j] ?? makeBlank();
  return (
    <div className="about-block">
      <h3>{title}</h3>
      {items.map((item, j) => (
        <div className="about-item" key={j}>
          <div className="row between">
            <small className="muted">
              {title} {j + 1}
            </small>
            <button
              className="icon-btn"
              aria-label={`${title} ${j + 1} kaldır`}
              onClick={() =>
                onChange(
                  items.filter((_, k) => k !== j),
                  itemsEn?.filter((_, k) => k !== j),
                )
              }
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="form-grid">
            <div>
              {fields(
                item,
                (next) =>
                  onChange(
                    items.map((x, k) => (k === j ? next : x)),
                    itemsEn,
                  ),
                false,
              )}
            </div>
            <div>
              {fields(
                english(j),
                (next) =>
                  onChange(
                    items,
                    items.map((_, k) => (k === j ? next : english(k))),
                  ),
                true,
              )}
            </div>
          </div>
        </div>
      ))}
      <div>
        <button
          className="btn soft"
          disabled={items.length >= max}
          onClick={() => onChange([...items, makeBlank()], itemsEn && [...itemsEn, makeBlank()])}
        >
          <Plus size={14} />
          {addLabel}
        </button>
      </div>
    </div>
  );
}

function ReadingEditor({
  chapter: c,
  onChange,
}: {
  chapter: AboutChapter;
  onChange: (change: Partial<AboutChapter>) => void;
}) {
  const en = c.readingEn;
  return (
    <>
      <BlockList
        title="Özet cümlesi"
        addLabel="Özet cümlesi ekle"
        items={c.summary}
        itemsEn={en?.summary}
        blank={blank.summary}
        max={10}
        fields={(item, set, english) => (
          <Text label={english ? "Özet cümlesi (EN)" : "Özet cümlesi"} multiline value={item} onChange={set} />
        )}
        onChange={(items, itemsEn) => onChange(withBlock(c, "summary", items, itemsEn))}
      />
      <BlockList
        title="Sayı kartı"
        addLabel="Sayı kartı ekle"
        items={c.figures}
        itemsEn={en?.figures}
        blank={blank.figures}
        max={12}
        fields={(item, set, english) => (
          <>
            <Text label={english ? "Sayı (EN)" : "Sayı"} value={item.value} onChange={(value) => set({ ...item, value })} />
            <Text label={english ? "Etiket (EN)" : "Etiket"} value={item.label} onChange={(label) => set({ ...item, label })} />
            <Text
              label={english ? "Metindeki ifade (EN)" : "Metindeki ifade"}
              value={item.evidence}
              onChange={(evidence) => set({ ...item, evidence })}
            />
          </>
        )}
        onChange={(items, itemsEn) => onChange(withBlock(c, "figures", items, itemsEn))}
      />
      <BlockList
        title="Alıntı"
        addLabel="Alıntı ekle"
        items={c.quotes}
        itemsEn={en?.quotes}
        blank={blank.quotes}
        max={10}
        fields={(item, set, english) => (
          <>
            <Text label={english ? "Alıntı (EN)" : "Alıntı"} multiline value={item.text} onChange={(text) => set({ ...item, text })} />
            <Text
              label={english ? "Kaynak kişi (EN)" : "Kaynak kişi"}
              value={item.by ?? ""}
              onChange={(by) => set({ ...item, by: by || undefined })}
            />
          </>
        )}
        onChange={(items, itemsEn) => onChange(withBlock(c, "quotes", items, itemsEn))}
      />
      <BlockList
        title="Zaman çizelgesi"
        addLabel="Tarih ekle"
        items={c.timeline}
        itemsEn={en?.timeline}
        blank={blank.timeline}
        max={20}
        fields={(item, set, english) => (
          <>
            <Text label={english ? "Yıl (EN)" : "Yıl"} value={item.year} onChange={(year) => set({ ...item, year })} />
            <Text
              label={english ? "Metindeki ifade (EN)" : "Metindeki ifade"}
              value={item.evidence}
              onChange={(evidence) => set({ ...item, evidence })}
            />
          </>
        )}
        onChange={(items, itemsEn) => onChange(withBlock(c, "timeline", items, itemsEn))}
      />
      <BlockList
        title="Terim"
        addLabel="Terim ekle"
        items={c.terms}
        itemsEn={en?.terms}
        blank={blank.terms}
        max={30}
        fields={(item, set, english) => (
          <>
            <Text label={english ? "Kelime (EN)" : "Kelime"} value={item.word} onChange={(word) => set({ ...item, word })} />
            <Text
              label={english ? "Tanım (EN)" : "Tanım"}
              multiline
              value={item.definition}
              onChange={(definition) => set({ ...item, definition })}
            />
          </>
        )}
        onChange={(items, itemsEn) => onChange(withBlock(c, "terms", items, itemsEn))}
      />
      {readingEnIncomplete(c) && (
        <p className="error" role="alert">
          İngilizce okuma metinleri Türkçesiyle aynı sayıda ve eksiksiz olmalı: hepsini yaz ya da hepsini boş bırak.
        </p>
      )}
    </>
  );
}

function ParagraphEditor({
  paragraph: p,
  index,
  count,
  chapters,
  sources,
  onChange,
  onMove,
  onChapter,
  onRemove,
}: {
  paragraph: Paragraph;
  index: number;
  count: number;
  chapters: AboutChapter[];
  sources: SiteSource[];
  onChange: (change: Partial<Paragraph>) => void;
  onMove: (direction: number) => void;
  onChapter: (chapterId: string) => void;
  onRemove: () => void;
}) {
  const name = `${index + 1}. paragraf`;
  return (
    <details className="about-paragraph" data-section-id={p.id}>
      <summary>
        {name} · {p.body.trim().slice(0, 70) || "Metin yok"}
      </summary>
      <div className="cue-top">
        <Text label="Başlık" value={p.title} onChange={(title) => onChange({ title })} />
        <div className="row">
          <button className="icon-btn" aria-label={`${name} yukarı taşı`} disabled={index === 0} onClick={() => onMove(-1)}>
            <MoveUp size={16} />
          </button>
          <button
            className="icon-btn"
            aria-label={`${name} aşağı taşı`}
            disabled={index === count - 1}
            onClick={() => onMove(1)}
          >
            <MoveDown size={16} />
          </button>
          <button className="icon-btn" aria-label={`${name} kaldır`} onClick={onRemove}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <Text label="Metin" multiline value={p.body} onChange={(body) => onChange({ body })} />
      <small className="muted">{englishLabel(Boolean(p.titleEn || p.bodyEn), p.enStatus)}</small>
      <div className="form-grid">
        <Text label="Başlık (EN)" value={p.titleEn ?? ""} onChange={(titleEn) => onChange({ titleEn })} />
        <Text label="Metin (EN)" multiline value={p.bodyEn ?? ""} onChange={(bodyEn) => onChange({ bodyEn })} />
      </div>
      <div className="form-grid">
        <label className="field">
          Bölüm
          <select value={p.chapterId ?? ""} onChange={(e) => onChapter(e.target.value)}>
            <option value="">Bölümsüz</option>
            {chapters.map((c) => (
              <option value={c.id} key={c.id}>
                {c.title || "Adsız bölüm"}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Tür
          <select value={p.kind} onChange={(e) => onChange({ kind: e.target.value as Kind })}>
            {Object.entries(kindLabels).map(([kind, label]) => (
              <option value={kind} key={kind}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Güvenilirlik
          <select value={p.trust} onChange={(e) => onChange({ trust: e.target.value as Trust })}>
            {Object.entries(trustLabels).map(([trust, label]) => (
              <option value={trust} key={trust}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Kaynak
          <select value={p.sourceId} onChange={(e) => onChange({ sourceId: e.target.value })}>
            <option value="">Kaynak yok</option>
            {p.sourceId && !sources.some((s) => s.id === p.sourceId) && (
              <option value={p.sourceId}>{p.sourceId} (kaynaklarda yok)</option>
            )}
            {sources.map((s) => (
              <option value={s.id} key={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      {p.photos?.length ? (
        <small className="muted">Bu paragrafın {p.photos.length} kitap fotoğrafı var; burada değiştirilmez.</small>
      ) : null}
    </details>
  );
}

/**
 * "Eser hakkında" step of the site editor (§11.69): the chapters of the book text and their paragraphs, in order, with the
 * reading layer (summary, number cards, quotes, timeline, terms) in Turkish and English. A chapter or paragraph keeps its
 * id across edits (so do its book photographs and voice-overs); one taken out of the list takes them with it. The 3D view
 * of a chapter, the cover and the book photographs are not edited here.
 */
export function AboutStep({
  chapters,
  sections,
  sources,
  onChange,
}: {
  chapters: AboutChapter[];
  sections: Paragraph[];
  sources: SiteSource[];
  onChange: (chapters: AboutChapter[], sections: Paragraph[]) => void;
}) {
  const [opened, setOpened] = useState<string>();
  const commit = (next: AboutChapter[], list: Paragraph[]) => onChange(next, regroup(next, list));
  const patchChapter = (id: string, change: Partial<AboutChapter>) =>
    commit(
      chapters.map((c) => (c.id === id ? { ...c, ...change } : c)),
      sections,
    );
  const patchParagraph = (id: string, change: Partial<Paragraph>) =>
    commit(
      chapters,
      sections.map((s) => (s.id === id ? { ...s, ...change } : s)),
    );
  const groupOf = (chapterId: string | undefined) =>
    sections.filter((s) => (chapterId ? s.chapterId === chapterId : !s.chapterId || !chapters.some((c) => c.id === s.chapterId)));
  const moveParagraph = (p: Paragraph, direction: number) => {
    const group = groupOf(p.chapterId);
    const ids = new Set(group.map((s) => s.id));
    commit(chapters, [...sections.filter((s) => !ids.has(s.id)), ...moved(group, group.indexOf(p), direction)]);
  };
  const moveToChapter = (p: Paragraph, chapterId: string) => {
    const target = chapters.find((c) => c.id === chapterId);
    const next: Paragraph = { ...p, ...(target ? { chapterId: target.id, kind: target.kind } : { chapterId: undefined }) };
    commit(chapters, [...sections.filter((s) => s.id !== p.id), next]);
  };
  const addChapter = () => {
    const id = crypto.randomUUID();
    setOpened(id);
    commit(
      [
        ...chapters,
        { id, title: "", kind: "history", summary: [], figures: [], quotes: [], timeline: [], terms: [], interior: false, focusParts: [] },
      ],
      sections,
    );
  };
  const addParagraph = (chapter: AboutChapter | undefined) =>
    commit(chapters, [
      ...sections,
      {
        id: crypto.randomUUID(),
        kind: chapter?.kind ?? "history",
        title: chapter?.title ?? "",
        body: "",
        trust: "representative",
        sourceId: "",
        ...(chapter && { chapterId: chapter.id }),
      },
    ]);
  const paragraphs = (chapter: AboutChapter | undefined) => {
    const group = groupOf(chapter?.id);
    return (
      <>
        {group.map((p, i) => (
          <ParagraphEditor
            key={p.id}
            paragraph={p}
            index={i}
            count={group.length}
            chapters={chapters}
            sources={sources}
            onChange={(change) => patchParagraph(p.id, change)}
            onMove={(direction) => moveParagraph(p, direction)}
            onChapter={(chapterId) => moveToChapter(p, chapterId)}
            onRemove={() =>
              commit(
                chapters,
                sections.filter((s) => s.id !== p.id),
              )
            }
          />
        ))}
        <div>
          <button className="btn soft" disabled={sections.length >= aboutLimits.paragraphs} onClick={() => addParagraph(chapter)}>
            <Plus size={14} />
            Paragraf ekle
          </button>
        </div>
      </>
    );
  };
  const withoutEnglish = sections.filter((s) => !s.bodyEn?.trim()).length;
  const loose = groupOf(undefined);
  return (
    <div className="editor-step-content">
      <div className="row between">
        <h2>Eser hakkında</h2>
        <button className="btn secondary" disabled={chapters.length >= aboutLimits.chapters} onClick={addChapter}>
          <Plus size={16} />
          Bölüm ekle
        </button>
      </div>
      <p className="muted">
        Eserin kitaptan alınan metni: bölümler ve paragrafları, her biri Türkçe ve İngilizce. Bir bölümün 3D bakışı, kapak ve
        kitap fotoğrafları burada değişmez; paragrafı kaldırırsan fotoğrafları da gider. Kaldırdığın bölümün paragrafları ve
        seslendirmeleri de silinir.
      </p>
      {withoutEnglish > 0 && (
        <Notice>
          {withoutEnglish} paragrafın İngilizce metni yok. Okuyucu İngilizceyi yalnızca her paragrafın İngilizcesi yazılınca
          gösterir; o zamana kadar Türkçe görünür.
        </Notice>
      )}
      {!chapters.length && !sections.length && <Notice>Henüz bölüm ya da paragraf yok.</Notice>}
      {chapters.map((c, i) => (
        <details className="cue-editor card about-chapter" key={c.id} data-chapter-id={c.id} open={i === 0 || c.id === opened ? true : undefined}>
          <summary>
            {i + 1}. bölüm · {c.title || "Adsız bölüm"} · {groupOf(c.id).length} paragraf
          </summary>
          <div className="cue-top">
            <Text label="Başlık" value={c.title} onChange={(title) => patchChapter(c.id, { title })} />
            <div className="row">
              <button
                className="icon-btn"
                aria-label={`${i + 1}. bölümü yukarı taşı`}
                disabled={i === 0}
                onClick={() => commit(moved(chapters, i, -1), sections)}
              >
                <MoveUp size={16} />
              </button>
              <button
                className="icon-btn"
                aria-label={`${i + 1}. bölümü aşağı taşı`}
                disabled={i === chapters.length - 1}
                onClick={() => commit(moved(chapters, i, 1), sections)}
              >
                <MoveDown size={16} />
              </button>
              <button
                className="icon-btn"
                aria-label={`${i + 1}. bölümü kaldır`}
                onClick={() =>
                  commit(
                    chapters.filter((x) => x.id !== c.id),
                    sections.filter((s) => s.chapterId !== c.id),
                  )
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <small className="muted">{englishLabel(Boolean(c.titleEn || c.readingEn), c.enStatus)}</small>
          <div className="form-grid">
            <Text label="Başlık (EN)" value={c.titleEn ?? ""} onChange={(titleEn) => patchChapter(c.id, { titleEn })} />
            <label className="field">
              Tür
              <select
                value={c.kind}
                onChange={(e) => {
                  const kind = e.target.value as Kind;
                  commit(
                    chapters.map((x) => (x.id === c.id ? { ...x, kind } : x)),
                    sections.map((s) => (s.chapterId === c.id ? { ...s, kind } : s)),
                  );
                }}
              >
                {Object.entries(kindLabels).map(([kind, label]) => (
                  <option value={kind} key={kind}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <ReadingEditor chapter={c} onChange={(change) => patchChapter(c.id, change)} />
          <h3>Paragraflar</h3>
          {paragraphs(c)}
        </details>
      ))}
      {(loose.length > 0 || !chapters.length) && (
        <fieldset className="cue-editor card" data-chapter-id="">
          <legend>Bölümsüz paragraflar</legend>
          {paragraphs(undefined)}
        </fieldset>
      )}
    </div>
  );
}
