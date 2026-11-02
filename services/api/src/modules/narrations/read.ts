import { asc, inArray } from "drizzle-orm";
import type { Db } from "../../db/client.ts";
import {
  narrationLangs,
  narrations,
  narrationVariants,
  narrationVoices,
  type NarrationLang,
  type NarrationSubjectType,
  type NarrationVariant,
  type siteAboutChapters,
  type sitePartCards,
  type siteSections,
  type storyBlocks,
} from "../../db/schema/index.ts";
import type { Tx } from "../../platform/idempotency.ts";
import type { NarrationDto } from "../catalog/schemas.ts";
import { narrationHash, spokenText } from "./spoken.ts";

export type NarrationRow = typeof narrations.$inferSelect;
/** The texts of a story block a voice can read. */
export type StoryTexts = Pick<typeof storyBlocks.$inferSelect, "siteId" | "id" | "text" | "simple" | "textEn" | "simpleEn">;

/** The texts of a part card a voice can read: its body, in Turkish and in English. */
export type CardTexts = Pick<typeof sitePartCards.$inferSelect, "siteId" | "id" | "body" | "bodyEn">;

/** The title of an «Eser hakkında» chapter, in Turkish and in English. */
export type ChapterTexts = Pick<typeof siteAboutChapters.$inferSelect, "siteId" | "id" | "title" | "titleEn">;

/** An «Eser hakkında» paragraph, in Turkish and in English. */
export type SectionTexts = Pick<typeof siteSections.$inferSelect, "siteId" | "id" | "body" | "bodyEn">;

/** The texts a site's recordings are checked against. */
export type NarratedTexts = { stories: StoryTexts[]; partCards: CardTexts[]; chapters: ChapterTexts[]; sections: SectionTexts[] };

/** Opens the meaning of an inscription: «Mealen:» in Turkish, «Meaning:» in English (the reader splits on the same marker). */
const MEANING = /(Mealen|Meaning):/;

/** The text of `block` for a variant and language; null when there is none (an English text not written yet). */
export function variantText(block: StoryTexts, variant: NarrationVariant, lang: NarrationLang): string | null {
  if (lang === "tr") return variant === "text" ? block.text : block.simple;
  return variant === "text" ? block.textEn : block.simpleEn;
}

/** What the voice reads for the block now; empty when there is nothing to read. */
export function spokenFor(block: StoryTexts, variant: NarrationVariant, lang: NarrationLang): string {
  return spokenText(lang, variantText(block, variant, lang) ?? "");
}

/** What the voice reads for a part card in a language (its `text` recording; there is no simple variant); empty when there is nothing to read. */
export function spokenForCard(card: CardTexts, lang: NarrationLang): string {
  return spokenText(lang, (lang === "tr" ? card.body : card.bodyEn) ?? "");
}

/** What the voice reads for a chapter: its title. */
export function spokenForChapter(chapter: ChapterTexts, lang: NarrationLang): string {
  return spokenText(lang, (lang === "tr" ? chapter.title : chapter.titleEn) ?? "");
}

/**
 * What the voice reads for a paragraph: the text the reader reads aloud. An inscription (a paragraph that opens with
 * «“» or with the meaning marker) is read by its meaning only, the original wording is not; without a meaning it is
 * not read at all.
 */
export function spokenForSection(section: SectionTexts, lang: NarrationLang): string {
  const body = ((lang === "tr" ? section.body : section.bodyEn) ?? "").trim();
  const meaning = MEANING.exec(body);
  if (body.startsWith("“") || meaning?.index === 0) return meaning ? spokenText(lang, body.slice(meaning.index + meaning[0].length)) : "";
  return spokenText(lang, body);
}

/** What the voice of `lang` reads for one subject of a site; null when the subject no longer exists. */
function spokenOf(texts: Map<string, StoryTexts | CardTexts | ChapterTexts | SectionTexts>, row: NarrationRow): string | null {
  const subject = texts.get(narrationKey(row.subjectType as NarrationSubjectType, row.siteId, row.subjectId));
  if (!subject) return null;
  const lang = row.lang as NarrationLang;
  switch (row.subjectType) {
    case "story_block":
      return spokenFor(subject as StoryTexts, row.variant as NarrationVariant, lang);
    case "part_card":
      return row.variant === "text" ? spokenForCard(subject as CardTexts, lang) : null;
    case "about_chapter":
      return row.variant === "text" ? spokenForChapter(subject as ChapterTexts, lang) : null;
    case "about_section":
      return row.variant === "text" ? spokenForSection(subject as SectionTexts, lang) : null;
    default:
      return null;
  }
}

export const narrationKey = (type: NarrationSubjectType, siteId: string, subjectId: string): string => `${type}\u0000${siteId}\u0000${subjectId}`;

/** Every recording of the given sites (stale ones included); `currentNarrations` drops the stale ones. */
export async function loadNarrationRows(q: Db | Tx, siteIds: string[]): Promise<NarrationRow[]> {
  if (!siteIds.length) return [];
  return q.select().from(narrations).where(inArray(narrations.siteId, siteIds)).orderBy(asc(narrations.siteId), asc(narrations.createdAt));
}

/**
 * The recordings that still match their text. A recording whose subject was edited since (or removed) hashes
 * differently and is left out: it is not served, and the next generation replaces it. The hash uses the voice
 * `model` stored with the recording, so changing `TTS_VOICES` does not hide recordings made earlier.
 */
export function currentNarrations(rows: NarrationRow[], { stories, partCards, chapters, sections }: NarratedTexts): NarrationRow[] {
  const texts = new Map<string, StoryTexts | CardTexts | ChapterTexts | SectionTexts>([
    ...stories.map((b) => [narrationKey("story_block", b.siteId, b.id), b] as const),
    ...partCards.map((c) => [narrationKey("part_card", c.siteId, c.id), c] as const),
    ...chapters.map((c) => [narrationKey("about_chapter", c.siteId, c.id), c] as const),
    ...sections.map((s) => [narrationKey("about_section", s.siteId, s.id), s] as const),
  ]);
  return rows.filter((row) => {
    const spoken = spokenOf(texts, row);
    return !!spoken && narrationHash(row.model, spoken) === row.textHash;
  });
}

/** The recordings of one subject (rows from `currentNarrations`), in a fixed order: language, variant, voice. */
export function narrationsOfSubject(rows: NarrationRow[], type: NarrationSubjectType, siteId: string, subjectId: string): NarrationDto[] {
  const rank = (row: NarrationRow) =>
    narrationLangs.indexOf(row.lang as NarrationLang) * 100 +
    narrationVariants.indexOf(row.variant as NarrationVariant) * 10 +
    narrationVoices.indexOf(row.voice as (typeof narrationVoices)[number]);
  return rows
    .filter((row) => row.subjectType === type && row.siteId === siteId && row.subjectId === subjectId)
    .sort((a, b) => rank(a) - rank(b))
    .map((row) => ({
      variant: row.variant as NarrationVariant,
      lang: row.lang as NarrationLang,
      voice: row.voice as (typeof narrationVoices)[number],
      mediaId: row.mediaId,
    }));
}
