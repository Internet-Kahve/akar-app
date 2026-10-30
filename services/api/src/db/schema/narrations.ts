import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { sites } from "./catalog.ts";
import { media } from "./media.ts";

export const narrationSubjectTypes = ["story_block"] as const;
export const narrationVariants = ["text", "simple"] as const;
export const narrationLangs = ["tr", "en"] as const;
export const narrationVoices = ["female", "male"] as const;
/** Provenance of an English story text (`story_blocks.*_en_status`). */
export const translationStatuses = ["machine", "reviewed"] as const;
export type TranslationStatus = (typeof translationStatuses)[number];
export type NarrationVariant = (typeof narrationVariants)[number];
export type NarrationLang = (typeof narrationLangs)[number];
export type NarrationVoice = (typeof narrationVoices)[number];

/**
 * One AI voice-over recording (decision §11.56): a text of a site (`subject`), read in a language and a
 * voice, stored as `media` of kind audio. The subject has no foreign key because later PRs add other text types
 * (part cards, chapters…); the story save path removes the recordings of sentences it deletes. `text_hash` covers the
 * normalized text that was sent to the voice and the voice `model`: when the current text hashes differently the
 * recording is stale, is no longer served and is replaced on the next generation.
 */
export const narrations = pgTable(
  "narrations",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    subjectType: text("subject_type").notNull(),
    subjectId: text("subject_id").notNull(),
    variant: text("variant").notNull(),
    lang: text("lang").notNull(),
    voice: text("voice").notNull(),
    mediaId: text("media_id")
      .notNull()
      .references(() => media.id),
    textHash: text("text_hash").notNull(),
    model: text("model").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("narrations_subject_uq").on(t.siteId, t.subjectType, t.subjectId, t.variant, t.lang, t.voice),
    check("narrations_subject_type_check", sql`${t.subjectType} in ('story_block')`),
    check("narrations_variant_check", sql`${t.variant} in ('text', 'simple')`),
    check("narrations_lang_check", sql`${t.lang} in ('tr', 'en')`),
    check("narrations_voice_check", sql`${t.voice} in ('female', 'male')`),
    index("narrations_media_idx").on(t.mediaId),
  ],
).enableRLS();
