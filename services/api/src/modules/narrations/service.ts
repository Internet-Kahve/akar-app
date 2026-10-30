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
  sites,
  storyBlocks,
  type NarrationLang,
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
import { spokenFor } from "./read.ts";
import { narrationHash } from "./spoken.ts";

export type NarrationCtx = { actorId: string; requestId: string };
export type NarrationSummary = { generated: number; skipped: number; stale: number };
export type TranslateSummary = { translated: number; skipped: number };

export const NARRATION_ACTION = "narration.generate";
const AUDIO_LICENSE = "Akar yapay zekâ seslendirmesi";
/** Wall-clock time of the statement, like the wizard writes: public readers key off the site's `updated_at`. */
const touched = sql`clock_timestamp()`;

type Block = typeof storyBlocks.$inferSelect;
type Item = {
  block: Block;
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
 * Generates the missing and the stale recordings of a site's story texts (decision §11.56): `text` and `simple` in
 * Turkish, `text_en` and `simple_en` in English when written, each in the four voices, one after another. An
 * up-to-date recording (same hash of spoken text and voice model) is left alone, so a second call generates nothing.
 *
 * No transaction is held while the voice service works (the pool is two connections): every recording is its own
 * short transaction (media row, narration row, old recording's media, audit). A failure midway keeps what was done;
 * the next call continues. The daily character cap is checked for the whole request first, and again per recording.
 */
export async function generateNarrations(deps: NarrationDeps, ctx: NarrationCtx, siteId: string, storyBlockId?: string): Promise<NarrationSummary> {
  const tts = requireDep(deps.tts, "Seslendirme hizmeti (Deepgram)");
  const buckets = requireDep(deps.storage, "Dosya depolama");
  const { db, config, log } = deps;

  const [site] = await db.select({ id: sites.id }).from(sites).where(eq(sites.id, siteId));
  if (!site) throw new AppError(404, "NOT_FOUND", "Eser bulunamadı.");
  const blocks = await db
    .select()
    .from(storyBlocks)
    .where(and(eq(storyBlocks.siteId, siteId), storyBlockId === undefined ? undefined : eq(storyBlocks.id, storyBlockId)))
    .orderBy(asc(storyBlocks.position));
  if (storyBlockId !== undefined && !blocks.length) throw new AppError(404, "NOT_FOUND", "Hikâye cümlesi bulunamadı.");
  const recorded = await db.select().from(narrations).where(and(eq(narrations.siteId, siteId), eq(narrations.subjectType, "story_block")));
  const recordedSlot = new Map(recorded.map((r) => [`${r.subjectId}|${r.variant}|${r.lang}|${r.voice}`, r]));

  const summary: NarrationSummary = { generated: 0, skipped: 0, stale: 0 };
  const todo: Item[] = [];
  for (const block of blocks) {
    for (const lang of narrationLangs) {
      for (const variant of narrationVariants) {
        const spoken = spokenFor(block, variant, lang);
        if (!spoken) continue;
        for (const voice of narrationVoices) {
          const model = config.TTS_VOICES[voiceKey(lang, voice)];
          const hash = narrationHash(model, spoken);
          const replaces = recordedSlot.get(`${block.id}|${variant}|${lang}|${voice}`);
          if (replaces?.textHash === hash) {
            summary.skipped++;
            continue;
          }
          todo.push({ block, variant, lang, voice, spoken, model, hash, replaces });
        }
      }
    }
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
  const { block, variant, lang, voice } = item;
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
      // The sentence must still exist: the lock keeps a concurrent story save from deleting it until this commits.
      const [still] = await tx
        .select({ id: storyBlocks.id })
        .from(storyBlocks)
        .where(and(eq(storyBlocks.siteId, siteId), eq(storyBlocks.id, block.id)))
        .for("share");
      if (!still) return null;
      const [current] = await tx
        .select()
        .from(narrations)
        .where(
          and(
            eq(narrations.siteId, siteId),
            eq(narrations.subjectType, "story_block"),
            eq(narrations.subjectId, block.id),
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
        title: `Seslendirme: ${block.title} (${lang}, ${variant}, ${voice})`,
        license: AUDIO_LICENSE,
        trust: block.trust,
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
          subjectType: "story_block",
          subjectId: block.id,
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
        after: { storyBlockId: block.id, variant, lang, voice, model: item.model, mediaId, chars, replaced: current?.mediaId ?? null },
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
 * Fills the English story texts that are still empty (`text_en`, `simple_en`) with a machine translation and marks
 * them `machine` (decision §11.56); filled fields are never touched. One request per story block, one after another,
 * a short transaction per block. Saving the text in the panel later marks it `reviewed`.
 */
export async function translateStories(
  deps: { db: Db; translator: Translator | null },
  ctx: NarrationCtx,
  siteId: string,
  storyBlockId?: string,
): Promise<TranslateSummary> {
  const translator = requireDep(deps.translator, "Çeviri hizmeti (Gemini)");
  const { db } = deps;
  const [site] = await db.select({ id: sites.id }).from(sites).where(eq(sites.id, siteId));
  if (!site) throw new AppError(404, "NOT_FOUND", "Eser bulunamadı.");
  const blocks = await db
    .select()
    .from(storyBlocks)
    .where(and(eq(storyBlocks.siteId, siteId), storyBlockId === undefined ? undefined : eq(storyBlocks.id, storyBlockId)))
    .orderBy(asc(storyBlocks.position));
  if (storyBlockId !== undefined && !blocks.length) throw new AppError(404, "NOT_FOUND", "Hikâye cümlesi bulunamadı.");

  const summary: TranslateSummary = { translated: 0, skipped: 0 };
  for (const block of blocks) {
    const fields: TranslateFields = {};
    if (emptyText(block.textEn) && block.text.trim()) fields.text = block.text;
    if (emptyText(block.simpleEn) && block.simple.trim()) fields.simple = block.simple;
    if (fields.text === undefined && fields.simple === undefined) {
      summary.skipped++;
      continue;
    }
    const english = await translator.translate(fields);
    const filled = await db.transaction(async (tx) => {
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
      if (names.length) {
        await tx.update(sites).set({ updatedAt: touched }).where(eq(sites.id, siteId));
        await recordAudit(tx, {
          actorId: ctx.actorId,
          action: "story.translate",
          entityType: "site",
          entityId: siteId,
          after: { storyBlockId: block.id, fields: names, status: "machine" },
          requestId: ctx.requestId,
        });
      }
      return names.length;
    });
    if (filled) summary.translated++;
    else summary.skipped++;
  }
  return summary;
}
