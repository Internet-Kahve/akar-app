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
  type sitePartCards,
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
export function currentNarrations(rows: NarrationRow[], stories: StoryTexts[], partCards: CardTexts[]): NarrationRow[] {
  const blocks = new Map(stories.map((b) => [narrationKey("story_block", b.siteId, b.id), b]));
  const cards = new Map(partCards.map((c) => [narrationKey("part_card", c.siteId, c.id), c]));
  return rows.filter((row) => {
    const key = narrationKey(row.subjectType as NarrationSubjectType, row.siteId, row.subjectId);
    let spoken: string;
    if (row.subjectType === "story_block") {
      const block = blocks.get(key);
      if (!block) return false;
      spoken = spokenFor(block, row.variant as NarrationVariant, row.lang as NarrationLang);
    } else if (row.subjectType === "part_card" && row.variant === "text") {
      const card = cards.get(key);
      if (!card) return false;
      spoken = spokenForCard(card, row.lang as NarrationLang);
    } else {
      return false;
    }
    return spoken !== "" && narrationHash(row.model, spoken) === row.textHash;
  });
}

/** The recordings of one story block or part card (rows from `currentNarrations`), in a fixed order: language, variant, voice. */
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
