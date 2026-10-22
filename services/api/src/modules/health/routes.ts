import { sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { AppError } from "../../errors.ts";

const Status = z.object({ status: z.literal("ok") });

export const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/health",
    { schema: { tags: ["ops"], summary: "Liveness", response: { 200: Status } } },
    async () => ({ status: "ok" as const }),
  );

  app.get(
    "/ready",
    { schema: { tags: ["ops"], summary: "Readiness (database reachable)", response: { 200: Status } } },
    async () => {
      try {
        await app.deps.db.execute(sql`select 1`);
      } catch {
        throw new AppError(503, "NOT_READY", "Veritabanına ulaşılamıyor.");
      }
      return { status: "ok" as const };
    },
  );
};
