import { randomUUID } from "node:crypto";
import { posix } from "node:path";
import { and, asc, eq, isNull, or, sql } from "drizzle-orm";
import type { FastifyBaseLogger } from "fastify";
import type { Config } from "../../config.ts";
import type { Db } from "../../db/client.ts";
import {
  auditLog,
  media,
  narrationLangs,
  narrations,
  narrationVariants,
  narrationVoices,
  sitePartCards,
  sites,
  storyBlocks,
  type NarrationLang,
  type NarrationSubjectType,
  type NarrationVariant,
  type NarrationVoice,
} from "../../db/schema/index.ts";
import { AppError } from "../../errors.ts";
import { recordAudit } from "../../platform/audit.ts";
import type { Tx } from "../../platform/idempotency.ts";
import type { StorageBuckets } from "../../platform/storage.ts";
import type { Translator, TranslateFields } from "../../platform/translate.ts";
import { voiceKey, type TtsProvider } from "../../platform/tts.ts";
import { deleteMediaObjects, deleteUnreferencedMedia, discardUnsavedObjects, requireDep } from "../media/service.ts";
import type { Trust } from "@akar/domain";
import { spokenFor, spokenForCard } from "./read.ts";
import type { NarrateTarget } from "./schemas.ts";
import { narrationHash } from "./spoken.ts";

export type NarrationCtx = { actorId: string; requestId: string };
export type NarrationSummary = { generated: number; skipped: number; stale: number };
export type TranslateSummary = { translated: number; skipped: number };

export const NARRATION_ACTION = "narration.generate";
const AUDIO_LICENSE = "Akar yapay zekâ seslendirmesi";
/** Wall-clock time of the statement, like the wizard writes: public readers key off the site's `updated_at`. */
const touched = sql`clock_timestamp()`;

/** A text a voice reads: a story sentence or a 3D part card. */
type Subject = { type: NarrationSubjectType; id: string; title: string; trust: Trust };
type Item = {
  subject: Subject;
  variant: NarrationVariant;
  lang: NarrationLang;
  voice: NarrationVoice;
  spoken: string;
  model: string;
  hash: string;
  replaces: typeof narrations.$inferSelect | undefined;
};

/** Characters the voice-over of the last 24 hours cost, from the audit rows `generate` writes (one per recording). */
async function charsUsedToday(q: Db | Tx): Promise<number> {
  const [row] = await q
    .select({ n: sql<number>`coalesce(sum((${auditLog.after}->>'chars')::int), 0)::int` })
    .from(auditLog)
    .where(and(eq(auditLog.action, NARRATION_ACTION), sql`${auditLog.at} > now() - interval '24 hours'`));
  return row?.n ?? 0;
}

function overLimit(used: number, wanted: number, limit: number): AppError {
  return new AppError(
    429,
    "RATE_LIMITED",
    `Günlük seslendirme sınırı aşılırdı: son 24 saatte ${used} karakter seslendirildi, bu istek ${wanted} karakter daha ister, sınır ${limit}. Sınır 24 saat içinde yeniden açılır; gerekirse yönetici TTS_DAILY_CHAR_LIMIT değerini yükseltir.`,
  );
}

function isUniqueViolation(err: unknown): boolean {
  let e: unknown = err;
  for (let depth = 0; e && typeof e === "object" && depth < 5; depth++) {
    if ("code" in e && e.code === "23505") return true;
    e = "cause" in e ? e.cause : undefined;
  }
  return false;
}

export type NarrationDeps = { db: Db; storage: StorageBuckets | null; tts: TtsProvider | null; config: Config; log: FastifyBaseLogger };

/**
 * Generates the missing and the stale recordings of a site's texts (decisions §11.56, §11.59): of every story
 * sentence `text` and `simple` in Turkish, `text_en` and `simple_en` in English when written; of every part card its
 * `body` and `body_en` (variant `text`); each in the four voices, one after another. An up-to-date recording (same
 * hash of spoken text and voice model) is left alone, so a second call generates nothing.
 *
 * No transaction is held while the voice service works (the pool is two connections): every recording is its own
 * short transaction (media row, narration row, old recording's media, audit). A failure midway keeps what was done;
 * the next call continues. The daily character cap is checked for the whole request first, and again per recording.
 */
export async function generateNarrations(deps: NarrationDeps, ctx: NarrationCtx, siteId: string, target: NarrateTarget = {}): Promise<NarrationSummary> {
  const tts = requireDep(deps.tts, "Seslendirme hizmeti (Deepgram)");
  const buckets = requireDep(deps.storage, "Dosya depolama");
  const { db, config, log } = deps;

  const [site] = await db.select({ id: sites.id }).from(sites).where(eq(sites.id, siteId));
  if (!site) throw new AppError(404, "NOT_FOUND", "Eser bulunamadı.");
  const { blocks, cards } = await loadTargets(db, siteId, target);
  const recorded = await db.select().from(narrations).where(eq(narrations.siteId, siteId));
  const recordedSlot = new Map(recorded.map((r) => [`${r.subjectType}|${r.subjectId}|${r.variant}|${r.lang}|${r.voice}`, r]));

  const summary: NarrationSummary = { generated: 0, skipped: 0, stale: 0 };
  const todo: Item[] = [];
  const plan = (subject: Subject, variant: NarrationVariant, lang: NarrationLang, spoken: string) => {
    if (!spoken) return;
    for (const voice of narrationVoices) {
      const model = config.TTS_VOICES[voiceKey(lang, voice)];
      const hash = narrationHash(model, spoken);
      const replaces = recordedSlot.get(`${subject.type}|${subject.id}|${variant}|${lang}|${voice}`);
      if (replaces?.textHash === hash) {
        summary.skipped++;
        continue;
      }
      todo.push({ subject, variant, lang, voice, spoken, model, hash, replaces });
    }
  };
  for (const block of blocks) {
    const subject: Subject = { type: "story_block", id: block.id, title: block.title, trust: block.trust };
    for (const lang of narrationLangs) for (const variant of narrationVariants) plan(subject, variant, lang, spokenFor(block, variant, lang));
  }
  for (const card of cards) {
    const subject: Subject = { type: "part_card", id: card.id, title: card.title, trust: card.trust };
    for (const lang of narrationLangs) plan(subject, "text", lang, spokenForCard(card, lang));
  }

  const wanted = todo.reduce((sum, item) => sum + item.spoken.length, 0);
  if (wanted > 0) {
    const used = await charsUsedToday(db);
    if (used + wanted > config.TTS_DAILY_CHAR_LIMIT) throw overLimit(used, wanted, config.TTS_DAILY_CHAR_LIMIT);
  }

  for (const item of todo) {
    const outcome = await recordOne({ db, config, log, tts, buckets, ctx, siteId, item });
    if (outcome === "saved") {
      summary.generated++;
      if (item.replaces) summary.stale++;
    } else {
      summary.skipped++;
    }
  }
  return summary;
}

/**
 * The story sentences and part cards a request covers, in order: the one named sentence or card (404 when it does
 * not exist), or without a target every sentence and every card of the site.
 */
async function loadTargets(q: Db | Tx, siteId: string, target: NarrateTarget) {
  const { storyBlockId, partCardId } = target;
  const blocks =
    partCardId !== undefined
      ? []
      : await q
          .select()
          .from(storyBlocks)
          .where(and(eq(storyBlocks.siteId, siteId), storyBlockId === undefined ? undefined : eq(storyBlocks.id, storyBlockId)))
          .orderBy(asc(storyBlocks.position));
  if (storyBlockId !== undefined && !blocks.length) throw new AppError(404, "NOT_FOUND", "Hikâye cümlesi bulunamadı.");
  const cards =
    storyBlockId !== undefined
      ? []
      : await q
          .select()
          .from(sitePartCards)
          .where(and(eq(sitePartCards.siteId, siteId), partCardId === undefined ? undefined : eq(sitePartCards.id, partCardId)))
          .orderBy(asc(sitePartCards.position));
  if (partCardId !== undefined && !cards.length) throw new AppError(404, "NOT_FOUND", "Parça kartı bulunamadı.");
  return { blocks, cards };
}

async function recordOne(env: {
  db: Db;
  config: Config;
  log: FastifyBaseLogger;
  tts: TtsProvider;
  buckets: StorageBuckets;
  ctx: NarrationCtx;
  siteId: string;
  item: Item;
}): Promise<"saved" | "skipped"> {
  const { db, config, log, tts, buckets, ctx, siteId, item } = env;
  const storage = buckets.media;
  const { subject, variant, lang, voice } = item;
  const chars = item.spoken.length;

  const audio = await tts.synthesize({ text: item.spoken, model: item.model });
  const mediaId = randomUUID();
  const now = new Date();
  const storageKey = posix.join("audio", String(now.getUTCFullYear()), String(now.getUTCMonth() + 1).padStart(2, "0"), `${mediaId}.mp3`);
  await storage.put(storageKey, audio, "audio/mpeg");
  const written = [{ mediaId, storageKey }];

  let removed: string[];
  try {
    const outcome = await db.transaction(async (tx) => {
      // The sentence or card must still exist: the lock keeps a concurrent save from deleting it until this commits.
      const [still] =
        subject.type === "story_block"
          ? await tx
              .select({ id: storyBlocks.id })
              .from(storyBlocks)
              .where(and(eq(storyBlocks.siteId, siteId), eq(storyBlocks.id, subject.id)))
              .for("share")
          : await tx
              .select({ id: sitePartCards.id })
              .from(sitePartCards)
              .where(and(eq(sitePartCards.siteId, siteId), eq(sitePartCards.id, subject.id)))
              .for("share");
      if (!still) return null;
      const [current] = await tx
        .select()
        .from(narrations)
        .where(
          and(
            eq(narrations.siteId, siteId),
            eq(narrations.subjectType, subject.type),
            eq(narrations.subjectId, subject.id),
            eq(narrations.variant, variant),
            eq(narrations.lang, lang),
            eq(narrations.voice, voice),
          ),
        )
        .for("update");
      // Another request made this recording meanwhile.
      if (current?.textHash === item.hash) return null;
      const used = await charsUsedToday(tx);
      if (used + chars > config.TTS_DAILY_CHAR_LIMIT) throw overLimit(used, chars, config.TTS_DAILY_CHAR_LIMIT);

      await tx.insert(media).values({
        id: mediaId,
        kind: "audio",
        mime: "audio/mpeg",
        url: storage.publicUrl(storageKey),
        title: `Seslendirme: ${subject.title} (${lang}, ${variant}, ${voice})`,
        license: AUDIO_LICENSE,
        trust: subject.trust,
        bytes: audio.length,
        storageKey,
        uploadedBy: ctx.actorId,
      });
      if (current) {
        await tx.update(narrations).set({ mediaId, textHash: item.hash, model: item.model, createdAt: new Date() }).where(eq(narrations.id, current.id));
      } else {
        await tx.insert(narrations).values({
          id: randomUUID(),
          siteId,
          subjectType: subject.type,
          subjectId: subject.id,
          variant,
          lang,
          voice,
          mediaId,
          textHash: item.hash,
          model: item.model,
        });
      }
      await tx.update(sites).set({ updatedAt: touched }).where(eq(sites.id, siteId));
      await recordAudit(tx, {
        actorId: ctx.actorId,
        action: NARRATION_ACTION,
        entityType: "site",
        entityId: siteId,
        after: { ...(subject.type === "story_block" ? { storyBlockId: subject.id } : { partCardId: subject.id }), variant, lang, voice, model: item.model, mediaId, chars, replaced: current?.mediaId ?? null },
        requestId: ctx.requestId,
      });
      return current ? await deleteUnreferencedMedia(tx, [current.mediaId]) : [];
    });
    if (outcome === null) {
      await discardUnsavedObjects(db, buckets, written, log);
      return "skipped";
    }
    removed = outcome;
  } catch (err) {
    await discardUnsavedObjects(db, buckets, written, log);
    // Two requests made the same first recording at once: the other one won.
    if (isUniqueViolation(err)) return "skipped";
    throw err;
  }
  await deleteMediaObjects(db, buckets, removed, log);
  return "saved";
}

const emptyText = (value: string | null): boolean => value === null || value.trim() === "";

/**
 * Fills the English texts that are still empty with a machine translation and marks them `machine` (decisions
 * §11.56, §11.59): of a story sentence `text_en` and `simple_en`, of a part card `title_en` and `body_en`; filled
 * fields are never touched. One request per sentence or card, one after another, a short transaction each. Saving
 * the text in the panel later marks it `reviewed`. Without a target the whole site: sentences first, then cards.
 */
export async function translateTexts(
  deps: { db: Db; translator: Translator | null },
  ctx: NarrationCtx,
  siteId: string,
  target: NarrateTarget = {},
): Promise<TranslateSummary> {
  const translator = requireDep(deps.translator, "Çeviri hizmeti (Gemini)");
  const { db } = deps;
  const [site] = await db.select({ id: sites.id }).from(sites).where(eq(sites.id, siteId));
  if (!site) throw new AppError(404, "NOT_FOUND", "Eser bulunamadı.");
  const { blocks, cards } = await loadTargets(db, siteId, target);

  const summary: TranslateSummary = { translated: 0, skipped: 0 };
  const count = (filled: number) => {
    if (filled) summary.translated++;
    else summary.skipped++;
  };
  for (const block of blocks) {
    const fields: TranslateFields = {};
    if (emptyText(block.textEn) && block.text.trim()) fields.text = block.text;
    if (emptyText(block.simpleEn) && block.simple.trim()) fields.simple = block.simple;
    if (!Object.keys(fields).length) {
      summary.skipped++;
      continue;
    }
    const english = await translator.translate(fields);
    count(
      await db.transaction(async (tx) => {
        const names: string[] = [];
        const where = (column: typeof storyBlocks.textEn | typeof storyBlocks.simpleEn) =>
          and(eq(storyBlocks.siteId, siteId), eq(storyBlocks.id, block.id), or(isNull(column), sql`btrim(${column}) = ''`));
        // Only while the field is still empty: an editor may have written it while the translation ran.
        if (english.text !== undefined) {
          const done = await tx.update(storyBlocks).set({ textEn: english.text, textEnStatus: "machine" }).where(where(storyBlocks.textEn)).returning({ id: storyBlocks.id });
          if (done.length) names.push("textEn");
        }
        if (english.simple !== undefined) {
          const done = await tx.update(storyBlocks).set({ simpleEn: english.simple, simpleEnStatus: "machine" }).where(where(storyBlocks.simpleEn)).returning({ id: storyBlocks.id });
          if (done.length) names.push("simpleEn");
        }
        await audited(tx, ctx, siteId, "story.translate", { storyBlockId: block.id }, names);
        return names.length;
      }),
    );
  }
  for (const card of cards) {
    const fields: TranslateFields = {};
    if (emptyText(card.titleEn) && card.title.trim()) fields.title = card.title;
    if (emptyText(card.bodyEn) && card.body.trim()) fields.body = card.body;
    if (!Object.keys(fields).length) {
      summary.skipped++;
      continue;
    }
    const english = await translator.translate(fields);
    count(
      await db.transaction(async (tx) => {
        const names: string[] = [];
        const where = (column: typeof sitePartCards.titleEn | typeof sitePartCards.bodyEn) =>
          and(eq(sitePartCards.siteId, siteId), eq(sitePartCards.id, card.id), or(isNull(column), sql`btrim(${column}) = ''`));
        if (english.title !== undefined) {
          const done = await tx.update(sitePartCards).set({ titleEn: english.title, titleEnStatus: "machine" }).where(where(sitePartCards.titleEn)).returning({ id: sitePartCards.id });
          if (done.length) names.push("titleEn");
        }
        if (english.body !== undefined) {
          const done = await tx.update(sitePartCards).set({ bodyEn: english.body, bodyEnStatus: "machine" }).where(where(sitePartCards.bodyEn)).returning({ id: sitePartCards.id });
          if (done.length) names.push("bodyEn");
        }
        await audited(tx, ctx, siteId, "partCard.translate", { partCardId: card.id }, names);
        return names.length;
      }),
    );
  }
  return summary;
}

/** Touches the site and writes the audit row of a translation that filled `names` (nothing when no field was filled). */
async function audited(tx: Tx, ctx: NarrationCtx, siteId: string, action: string, subject: Record<string, string>, names: string[]): Promise<void> {
  if (!names.length) return;
  await tx.update(sites).set({ updatedAt: touched }).where(eq(sites.id, siteId));
  await recordAudit(tx, {
    actorId: ctx.actorId,
    action,
    entityType: "site",
    entityId: siteId,
    after: { ...subject, fields: names, status: "machine" },
    requestId: ctx.requestId,
  });
}
