import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { requireRole } from "../../platform/auth.ts";
import { idempotentUnlocked } from "../../platform/idempotency.ts";
import { IdParams } from "../catalog/schemas.ts";
import { NarrateBody, NarrateResponse, TranslateResponse } from "./schemas.ts";
import { generateNarrations, translateTexts } from "./service.ts";

/**
 * Voice-overs and English drafts of story sentences and 3D part cards (decisions §11.56, §11.59). Both calls are long (a voice-over request makes up to
 * dozens of provider calls), so they run without a surrounding transaction; each result is its own short
 * transaction and a retry with the same Idempotency-Key replays the first answer.
 */
export const narrationRoutes: FastifyPluginAsyncZod = async (app) => {
  const editor = requireRole("editor");

  app.addHook("onSend", async (_req, reply) => {
    reply.header("cache-control", "private, no-store");
  });

  app.post(
    "/v1/admin/sites/:id/narrations",
    {
      preHandler: editor,
      schema: {
        tags: ["admin"],
        summary:
          "Eserin hikâye metinlerini ve 3B parça kartlarını seslendir: hikâyede Türkçe metin ve sade anlatım, İngilizcesi doluysa İngilizce metin ve sade anlatım; parça kartında kartın metni (Türkçe, İngilizcesi doluysa İngilizce); her biri 4 sesle (kadın ve erkek, iki dilde). storyBlockId ya da partCardId verilirse yalnız o cümle/kart (ikisi birlikte 400), verilmezse tümü. Eksik ve metni değişmiş (bayat) kayıtlar sırayla üretilir, güncel olanlara dokunulmaz; eski ses dosyası silinir. Rakamlar seslendirmede sözcüğe çevrilir, saklanan metin değişmez. Deepgram anahtarı yoksa 503; son 24 saatte günlük karakter sınırı aşılırsa 429",
        params: IdParams,
        body: NarrateBody,
        response: { 200: NarrateResponse },
      },
    },
    async (req) => {
      const ctx = { actorId: req.user!.id, requestId: req.id };
      const { db, storage, tts, config } = app.deps;
      const result = await idempotentUnlocked(db, req, ctx.actorId, async () => ({
        status: 200,
        body: await generateNarrations({ db, storage, tts, config, log: req.log }, ctx, req.params.id, req.body ?? {}),
      }));
      return result.body;
    },
  );

  app.post(
    "/v1/admin/sites/:id/translate",
    {
      preHandler: editor,
      schema: {
        tags: ["admin"],
        summary:
          "Eserin boş İngilizce hikâye metinlerini (metin ve sade anlatım) ve parça kartı başlık ile metinlerini Gemini ile Türkçeden çevirip doldur ve 'machine' (makine çevirisi) işaretle; dolu alanlara dokunulmaz. Yazılan çeviri panelden kaydedilince 'reviewed' olur. Gemini anahtarı yoksa 503",
        params: IdParams,
        body: NarrateBody,
        response: { 200: TranslateResponse },
      },
    },
    async (req) => {
      const ctx = { actorId: req.user!.id, requestId: req.id };
      const { db, translator } = app.deps;
      const result = await idempotentUnlocked(db, req, ctx.actorId, async () => ({
        status: 200,
        body: await translateTexts({ db, translator }, ctx, req.params.id, req.body ?? {}),
      }));
      return result.body;
    },
  );
};
