import type { FastifyRequest } from "fastify";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { requireUser } from "../../platform/auth.ts";
import { idempotent, type Tx } from "../../platform/idempotency.ts";
import type { Db } from "../../db/client.ts";
import { AnswerBody, AnswerResponse, CompleteBody, CompleteResponse, SiteProgressResponse, TaskIdParams } from "./schemas.ts";
import { answerTask, completeFieldTask, getSiteProgress } from "./service.ts";

/**
 * Site tasks and badges (decision §11.44). The answer and complete endpoints take an optional token: a signed-in
 * user's result is stored (once per Idempotency-Key), a guest gets the same check and nothing is stored. No points.
 * Nothing here is cacheable.
 */
export const siteTaskRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook("onSend", async (_req, reply) => {
    reply.header("cache-control", "private, no-store");
  });

  /** Signed in: one transaction per (user, Idempotency-Key), the body replayed on a retry. Guest: no writes, no transaction. */
  const play = <T>(req: FastifyRequest, run: (q: Tx | Db, userId: string | null) => Promise<T>): Promise<T> => {
    const user = req.user;
    if (!user) return run(app.deps.db, null);
    return idempotent(app.deps.db, req, user.id, async (tx) => ({ status: 200, body: await run(tx, user.id) })).then((r) => r.body);
  };

  app.post(
    "/v1/site-tasks/:id/answer",
    {
      schema: {
        tags: ["site-tasks"],
        summary:
          "Soru görevinin cevabını sunucuda kontrol et: doğruysa doğru metin, yanlışsa yanlış metin döner (ceza yok, tekrar denenebilir); üye doğru cevapla görevi tamamlar ve rozet kazanabilir, misafirde hiçbir şey saklanmaz. Cevap anahtarı yanıtta yoktur",
        params: TaskIdParams,
        body: AnswerBody,
        response: { 200: AnswerResponse },
      },
    },
    async (req) => play(req, (q, userId) => answerTask(q, userId, req.params.id, req.body.choice)),
  );

  app.post(
    "/v1/site-tasks/:id/complete",
    {
      schema: {
        tags: ["site-tasks"],
        summary:
          "Saha görevini tamamla: yerinde (konum eser noktasından görev yarıçapı içinde, aksi halde 422 TOO_FAR; konum saklanmaz, loglanmaz) ya da evden (3B parça adı, yanlışsa 422 WRONG_PART). Üye için kayıt ve rozet, misafirde hiçbir şey saklanmaz",
        params: TaskIdParams,
        body: CompleteBody,
        response: { 200: CompleteResponse },
      },
    },
    async (req) => play(req, (q, userId) => completeFieldTask(q, userId, req.params.id, req.body)),
  );

  app.get(
    "/v1/me/site-progress",
    {
      preHandler: requireUser,
      schema: {
        tags: ["me"],
        summary: "Eser görevi ve rozet ilerlemem: tamamlanan görevler ve kazanılan rozetler (yayındaki eserlerden), en yeni önce",
        response: { 200: SiteProgressResponse },
      },
    },
    async (req) => getSiteProgress(app.deps.db, req.user!.id),
  );
};
