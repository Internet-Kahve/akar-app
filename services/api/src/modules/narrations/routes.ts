import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { requireRole } from "../../platform/auth.ts";
import { idempotentUnlocked } from "../../platform/idempotency.ts";
import { IdParams } from "../catalog/schemas.ts";
import { NarrateBody, NarrateResponse, TranslateResponse } from "./schemas.ts";
import { generateNarrations, translateStories } from "./service.ts";

/**
 * Story voice-overs and English drafts (decision §11.56). Both calls are long (a voice-over request makes up to
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
          "Eserin hikâye metinlerini seslendir: Türkçe metin ve sade anlatım, İngilizcesi doluysa İngilizce metin ve sade anlatım; her biri 4 sesle (kadın ve erkek, iki dilde). Eksik ve metni değişmiş (bayat) kayıtlar sırayla üretilir, güncel olanlara dokunulmaz; eski ses dosyası silinir. Rakamlar seslendirmede sözcüğe çevrilir, saklanan metin değişmez. Deepgram anahtarı yoksa 503; son 24 saatte günlük karakter sınırı aşılırsa 429",
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
        body: await generateNarrations({ db, storage, tts, config, log: req.log }, ctx, req.params.id, req.body?.storyBlockId),
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
          "Eserin boş İngilizce hikâye metinlerini (metin ve sade anlatım) Gemini ile Türkçeden çevirip doldur ve 'machine' (makine çevirisi) işaretle; dolu alanlara dokunulmaz. Yazılan çeviri panelden kaydedilince 'reviewed' olur. Gemini anahtarı yoksa 503",
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
        body: await translateStories({ db, translator }, ctx, req.params.id, req.body?.storyBlockId),
      }));
      return result.body;
    },
  );
};
