import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { requireRole } from "../../platform/auth.ts";
import { AdminHealthResponse } from "./schemas.ts";
import { pendingStale, storageHealth } from "./service.ts";

/** Panel health warnings (decision log §11.21). Names no content, but is live operational state: never cached. */
export const adminHealthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook("onSend", async (_req, reply) => {
    reply.header("cache-control", "no-store");
  });

  app.get(
    "/v1/admin/health",
    {
      preHandler: requireRole("moderator"),
      schema: {
        tags: ["admin-health"],
        summary: "Sağlık uyarıları: uzun süredir bekleyen anılar ve depolama doluluğu",
        description:
          "Moderatör ve admin görür. `pendingStale`: kuyruğa son girişinden (gönderim ya da bildirimle geri dönüş) beri 48 saatten uzun süredir `pending` olan anıların sayısı ve en eskisinin kuyruğa giriş zamanı. `storage` yalnız admin cevabında bulunur (moderatör cevabında alan hiç yoktur): medya kayıtlarının toplam boyutu `STORAGE_QUOTA_MB` kotasına oranlanır; `level` %80'den `warn`, %95'ten `critical`.",
        response: { 200: AdminHealthResponse },
      },
    },
    async (req) => {
      const { db, config } = app.deps;
      const stale = await pendingStale(db, new Date());
      if (req.user!.role !== "admin") return { pendingStale: stale };
      return { pendingStale: stale, storage: await storageHealth(db, config.STORAGE_QUOTA_MB) };
    },
  );
};
