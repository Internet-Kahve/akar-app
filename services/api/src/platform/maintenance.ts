import { createHash, timingSafeEqual } from "node:crypto";
import type { FastifyPluginAsync } from "fastify";
import type { AppDeps } from "../app.ts";
import { AppError } from "../errors.ts";
import { drainMediaDeletions, expireUploads, sweepUnattachedPhotos } from "../modules/media/service.ts";
import { purgeIdempotencyKeys } from "./idempotency.ts";
import type { DurableJobQueue } from "./jobs.ts";

export async function runMaintenance(deps: Pick<AppDeps, "db" | "storage">, jobs: DurableJobQueue) {
  const processed = await jobs.drain({ limit: 5, budgetMs: 120_000 });
  const { db, storage } = deps;
  const expired = storage ? await expireUploads({ db, storage }, { limit: 10 }) : 0;
  const unattached = storage ? await sweepUnattachedPhotos({ db, storage }, { limit: 10 }) : 0;
  const deleted = storage ? await drainMediaDeletions({ db, storage }, { limit: 10 }) : null;
  const purged = await purgeIdempotencyKeys(db);
  return { processed, expired, unattached, deleted, purged };
}

const digest = (value: string) => createHash("sha256").update(value).digest();

/** Separate header avoids treating the cron secret as a user JWT. Never accepted on user routes. */
export function maintenanceRoutes(run: () => Promise<unknown>): FastifyPluginAsync {
  return async (app) => {
    app.post("/internal/jobs/run", {
      schema: { hide: true },
      config: { rateLimit: false },
      onRequest: async (req, reply) => {
        reply.header("cache-control", "no-store");
        const expected = app.deps.config.JOB_SECRET;
        const provided = req.headers["x-akar-job-secret"];
        if (!expected || typeof provided !== "string" || !timingSafeEqual(digest(expected), digest(provided))) {
          throw new AppError(401, "UNAUTHENTICATED", "İş zamanlayıcısı doğrulanamadı.");
        }
      },
    }, async () => run());
  };
}
