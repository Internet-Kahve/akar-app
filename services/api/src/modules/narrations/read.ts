import { asc, inArray } from "drizzle-orm";
import type { Db } from "../../db/client.ts";
import {
  narrationLangs,
  narrations,
  narrationVariants,
  narrationVoices,
  type NarrationLang,
  type NarrationVariant,
  type storyBlocks,
} from "../../db/schema/index.ts";
import type { Tx } from "../../platform/idempotency.ts";
import type { NarrationDto } from "../catalog/schemas.ts";
import { narrationHash, spokenText } from "./spoken.ts";

export type NarrationRow = typeof narrations.$inferSelect;
/** The texts of a story block a voice can read. */
export type StoryTexts = Pick<typeof storyBlocks.$inferSelect, "siteId" | "id" | "text" | "simple" | "textEn" | "simpleEn">;

/** The text of `block` for a variant and language; null when there is none (an English text not written yet). */
export function variantText(block: StoryTexts, variant: NarrationVariant, lang: NarrationLang): string | null {
  if (lang === "tr") return variant === "text" ? block.text : block.simple;
  return variant === "text" ? block.textEn : block.simpleEn;
}

/** What the voice reads for the block now; empty when there is nothing to read. */
export function spokenFor(block: StoryTexts, variant: NarrationVariant, lang: NarrationLang): string {
  return spokenText(lang, variantText(block, variant, lang) ?? "");
}

export const narrationKey = (siteId: string, blockId: string): string => `${siteId}\u0000${blockId}`;

/** Every recording of the given sites (stale ones included); `currentNarrations` drops the stale ones. */
export async function loadNarrationRows(q: Db | Tx, siteIds: string[]): Promise<NarrationRow[]> {
  if (!siteIds.length) return [];
  return q.select().from(narrations).where(inArray(narrations.siteId, siteIds)).orderBy(asc(narrations.siteId), asc(narrations.createdAt));
}

/**
 * The recordings that still match their text. A recording whose block was edited since (or removed) hashes
 * differently and is left out: it is not served, and the next generation replaces it. The hash uses the voice
 * `model` stored with the recording, so changing `TTS_VOICES` does not hide recordings made earlier.
 */
export function currentNarrations(rows: NarrationRow[], stories: StoryTexts[]): NarrationRow[] {
  const blocks = new Map(stories.map((b) => [narrationKey(b.siteId, b.id), b]));
  return rows.filter((row) => {
    const block = blocks.get(narrationKey(row.siteId, row.subjectId));
    if (!block || row.subjectType !== "story_block") return false;
    const spoken = spokenFor(block, row.variant as NarrationVariant, row.lang as NarrationLang);
    return spoken !== "" && narrationHash(row.model, spoken) === row.textHash;
  });
}

/** The recordings of one block (rows from `currentNarrations`), in a fixed order: language, variant, voice. */
export function narrationsOfBlock(rows: NarrationRow[], siteId: string, blockId: string): NarrationDto[] {
  const rank = (row: NarrationRow) =>
    narrationLangs.indexOf(row.lang as NarrationLang) * 100 +
    narrationVariants.indexOf(row.variant as NarrationVariant) * 10 +
    narrationVoices.indexOf(row.voice as (typeof narrationVoices)[number]);
  return rows
    .filter((row) => row.siteId === siteId && row.subjectId === blockId)
    .sort((a, b) => rank(a) - rank(b))
    .map((row) => ({
      variant: row.variant as NarrationVariant,
      lang: row.lang as NarrationLang,
      voice: row.voice as (typeof narrationVoices)[number],
      mediaId: row.mediaId,
    }));
}
