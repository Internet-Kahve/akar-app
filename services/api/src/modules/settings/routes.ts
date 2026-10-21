import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { addReadCache } from "../../http-cache.ts";
import { requireRole } from "../../platform/auth.ts";
import { idempotent } from "../../platform/idempotency.ts";
import { MapSettings } from "./schemas.ts";
import { getMapSettings, setMapSettings } from "./service.ts";

/** Hand-tuned map values (decision log §11.4): public read for the apps, admin write for the panel. */
export const settingsRoutes: FastifyPluginAsyncZod = async (app) => {
  addReadCache(app);

  app.get(
    "/v1/map-settings",
    {
      schema: {
        tags: ["settings"],
        summary: "Harita ayarları: 3B modellerin yüklendiği yakınlaştırma eşiği ve aynı anda en çok model sayısı",
        response: { 200: MapSettings },
      },
    },
    async () => getMapSettings(app.deps.db),
  );

  app.put(
    "/v1/admin/map-settings",
    {
      preHandler: requireRole("admin"),
      schema: {
        tags: ["settings"],
        summary: "Harita ayarlarını belirle (yalnız yönetici); uygulamalar en geç bir dakika içinde görür",
        body: MapSettings,
        response: { 200: MapSettings },
      },
    },
    async (req, reply) => {
      reply.header("cache-control", "no-store");
      const actor = { actorId: req.user!.id, requestId: req.id };
      const result = await idempotent(app.deps.db, req, actor.actorId, async (tx) => ({
        status: 200,
        body: await setMapSettings(tx, req.body, actor),
      }));
      return result.body;
    },
  );
};
