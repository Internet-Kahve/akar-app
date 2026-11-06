import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { requireRole } from "../../platform/auth.ts";
import { idempotentUnlocked } from "../../platform/idempotency.ts";
import { PageQuery, pageResponse } from "../../platform/pagination.ts";
import { CreateJobBody, JobParams, ModelGenJobDto, ModelGenStatusResponse, SiteJobsParams } from "./schemas.ts";
import { getJob, listJobs, runnerStatus, startJob } from "./service.ts";

/**
 * AI-assisted model editing (§11.80): admins send prompts to the separate model runner and read the job history.
 * `/v1/admin/model-gen/**` and `/v1/admin/sites/:siteId/model-gen/**`, admin only (editors are not allowed yet).
 */
export const modelGenRoutes: FastifyPluginAsyncZod = async (app) => {
  // Checked on `onRequest`, so a guest or an editor is turned away before the body is read.
  app.addHook("onRequest", requireRole("admin"));
  app.addHook("onSend", async (_req, reply) => {
    reply.header("cache-control", "no-store");
  });

  app.get(
    "/v1/admin/model-gen/status",
    {
      schema: {
        tags: ["admin-model-gen"],
        summary: "Model çalıştırıcının Claude oturumu (yalnız admin)",
        description: "`enabled: false` = çalıştırıcı yapılandırılmamış (bu uç yine 200 döner, öbür uçlar 503 `MODEL_GEN_DISABLED`). Çalıştırıcıya ulaşılamazsa 502.",
        response: { 200: ModelGenStatusResponse },
      },
    },
    async () => runnerStatus(app.deps.config),
  );

  app.post(
    "/v1/admin/sites/:siteId/model-gen/jobs",
    {
      schema: {
        tags: ["admin-model-gen"],
        summary: "Eserin modeli için yapay zekâ işi başlat; 202 ile işi döner (yalnız admin)",
        description:
          "İstemi model çalıştırıcıya iletir ve işi geçmişe yazar. Çalıştırıcı meşgulse 409 `MODEL_GEN_BUSY`; ulaşılamazsa 502; yapılandırılmamışsa 503 `MODEL_GEN_DISABLED`; eser yoksa 404; eser kimliği çalıştırıcı biçiminde değilse ya da çalıştırıcı eseri tanımazsa 400. `Idempotency-Key` tekrarı aynı işi döndürür.",
        params: SiteJobsParams,
        body: CreateJobBody,
        response: { 202: ModelGenJobDto },
      },
    },
    async (req, reply) => {
      const { db, config } = app.deps;
      const actor = { id: req.user!.id, requestId: req.id };
      const result = await idempotentUnlocked(db, req, actor.id, async () => ({
        status: 202,
        body: await startJob({ db, config }, actor, req.params.siteId, req.body, new Date()),
      }));
      reply.code(202);
      return result.body;
    },
  );

  app.get(
    "/v1/admin/sites/:siteId/model-gen/jobs",
    {
      schema: {
        tags: ["admin-model-gen"],
        summary: "Eserin yapay zekâ iş geçmişi, yeniden eskiye (yalnız admin)",
        description: "Liste çalıştırıcıya sormaz: `events` boş, dosya `url`'leri `null`. Canlı görünüm için işin kendi ucu kullanılır.",
        params: SiteJobsParams,
        querystring: PageQuery,
        response: { 200: pageResponse(ModelGenJobDto) },
      },
    },
    async (req) => listJobs(app.deps.db, req.params.siteId, req.query),
  );

  app.get(
    "/v1/admin/model-gen/jobs/:id",
    {
      schema: {
        tags: ["admin-model-gen"],
        summary: "Bir işin durumu; çalışıyorsa çalıştırıcıdan okunur ve bitiş durumu saklanır (yalnız admin)",
        description:
          "Çalışan iş çalıştırıcıdan sorulur; bitince yanıt saklanır, çalıştırıcı işi tanımıyorsa (404) durum `lost` olur. Canlı `events` saklanmaz. Dosya `url`'leri çalıştırıcının 15 dakika geçerli, mutlak (`MODEL_RUNNER_PUBLIC_URL`) imzalı bağlantılarıdır; biten iş için de çalıştırıcı hâlâ biliyorsa yenilenir, bilmiyorsa `null`.",
        params: JobParams,
        response: { 200: ModelGenJobDto },
      },
    },
    async (req) => getJob({ db: app.deps.db, config: app.deps.config }, req.params.id, new Date()),
  );
};
