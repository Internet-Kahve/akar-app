import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { requireRole } from "../../platform/auth.ts";
import { MAX_EVENTS_PER_BATCH } from "@akar/domain";
import { SiteStatsResponse, StatsQuery, StatsResponse, UsageAccepted, UsageBatch } from "./schemas.ts";
import { getSiteStats, getStats, recordUsage, statsRange } from "./service.ts";

/** Usage statistics (§11.72): anonymous daily counters in, admin-only totals out. Never cached. */
export const usageRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook("onSend", async (_req, reply) => {
    reply.header("cache-control", "no-store");
  });

  app.post(
    "/v1/events",
    {
      config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
      schema: {
        tags: ["usage"],
        summary: "Kullanım olaylarını say",
        description: `Misafir ve giriş yapmış kullanıcı gönderir (oturum varsa yalnız "giriş yapmış" diye sayılır). En fazla ${MAX_EVENTS_PER_BATCH} olay. Yalnız günlük sayaç artar: kimlik, IP, cihaz ya da saat saklanmaz. Kuralı tutmayan, bilinmeyen esere, rotaya, parça kartına ya da göreve ait olaylar sayılmadan atlanır (hata dönmez).`,
        body: UsageBatch,
        response: { 200: UsageAccepted },
      },
    },
    async (req) => {
      const accepted = await recordUsage(app.deps.db, req.body.events, req.user === null, new Date());
      return { accepted };
    },
  );

  app.get(
    "/v1/admin/stats",
    {
      preHandler: requireRole("admin"),
      schema: {
        tags: ["usage"],
        summary: "Kullanım istatistikleri: toplamlar, günlük seri, eser ve rota tabloları",
        description: "Yalnız admin. Dönem İstanbul günleriyle, iki uç dahil; varsayılan son 30 gün, en fazla 366 gün.",
        querystring: StatsQuery,
        response: { 200: StatsResponse },
      },
    },
    async (req) => {
      const { from, to } = statsRange(req.query, new Date());
      return getStats(app.deps.db, from, to);
    },
  );

  app.get(
    "/v1/admin/stats/sites/:id",
    {
      preHandler: requireRole("admin"),
      schema: {
        tags: ["usage"],
        summary: "Bir eserin kullanım ayrıntısı: cümle bırakma eğrisi, parça kartları, görevler, seslendirme dili",
        description: "Yalnız admin. Eser yoksa ve dönemde sayacı da yoksa 404.",
        params: z.object({ id: z.string().min(1).max(120) }),
        querystring: StatsQuery,
        response: { 200: SiteStatsResponse },
      },
    },
    async (req) => {
      const { from, to } = statsRange(req.query, new Date());
      return getSiteStats(app.deps.db, req.params.id, from, to);
    },
  );
};
