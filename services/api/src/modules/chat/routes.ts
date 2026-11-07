import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { requireUser } from "../../platform/auth.ts";
import { ChatRequest, ChatResponse } from "./schemas.ts";
import { answerChat } from "./service.ts";

/** Application limit per account, independent of the provider's project/model quotas. */
export const CHAT_PER_MINUTE = 6;

/** Site assistant (§11.74): signed-in users ask about sites and history; nothing of the conversation is stored. */
export const chatRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/v1/chat",
    {
      preHandler: requireUser,
      config: { rateLimit: { max: CHAT_PER_MINUTE, timeWindow: "1 minute" } },
      schema: {
        tags: ["chat"],
        summary: "Asistana soru sor",
        description: `Yalnız giriş yapmış kullanıcı. \`siteId\` verilirse o eserin hikâyesi, «Eser hakkında» paragrafları ve parça kartları, verilmezse yayındaki eserlerin özeti bağlam olur; görev cevapları bağlama girmez. Hesap başına dakikada ${CHAT_PER_MINUTE} soru; herkes için günlük sınır \`CHAT_DAILY_LIMIT\` (dolunca 429). Sohbet saklanmaz, yalnız günlük \`chat.message\` sayacı artar. Model anahtarı yoksa 503; tüm model/anahtar seçenekleri sınırdaysa 429; bilinmeyen ya da yayında olmayan eser 404.`,
        body: ChatRequest,
        response: { 200: ChatResponse },
      },
    },
    async (req, reply) => {
      reply.header("cache-control", "no-store");
      return answerChat(app.deps, req.body, new Date());
    },
  );
};
