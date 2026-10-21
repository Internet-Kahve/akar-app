import { once } from "node:events";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { FastifyPluginAsync } from "fastify";
import type { PoolClient } from "pg";
import { buildApp, type App, type AppDeps } from "../app.ts";
import { loadConfig, type Config } from "../config.ts";
import { createDb } from "../db/client.ts";
import { runMigrations } from "../db/migrate.ts";
import { inlineJobs, type InlineJobQueue } from "../platform/jobs.ts";
import { testVerifier } from "./auth.ts";

/** Multi-arch (amd64 + arm64) PostGIS; must match docker-compose.yml. */
const POSTGIS_IMAGE = "imresamu/postgis:17-3.5";

/** Fixed test secret for guest receipts; long enough for the config rule. */
export const TEST_RECEIPT_SECRET = "test-receipt-secret-0123456789abcdef0123456789";

export type TestAppOptions = {
  /** Default: `testVerifier` (tokens from `authHeader()`); identity tests pass the real verifier. */
  auth?: AppDeps["auth"];
  /** Default: null (no storage). Media tests pass a pair of filesystem storages: `uploads` and `media`. */
  storage?: AppDeps["storage"];
  /** Default: null. Admin import tests pass a deterministic geocoder factory. */
  geocoderFor?: AppDeps["geocoderFor"];
  /** Extra config values, e.g. `{ VISIT_RADIUS_M: "30" }`. */
  env?: Record<string, string>;
  /** Module plugins not yet registered in app.ts (see `buildApp`). */
  register?: FastifyPluginAsync[];
};

/**
 * Real PostGIS in Docker, migrated; one per test file. Jobs run inline: call `jobs.drain()` after
 * a request that enqueues work.
 */
export async function startTestApp(opts: TestAppOptions = {}): Promise<{
  app: App;
  config: Config;
  jobs: InlineJobQueue;
  stop: () => Promise<void>;
}> {
  const container = await new PostgreSqlContainer(POSTGIS_IMAGE).start();
  const url = container.getConnectionUri();
  await runMigrations(url);
  const config = loadConfig({ NODE_ENV: "test", DATABASE_URL: url, RECEIPT_SECRET: TEST_RECEIPT_SECRET, ...opts.env });
  const { db, pool } = createDb(url);
  // `pool.end()` resolves before its connections have closed; stopping the container first kills them
  // mid-shutdown and the driver reports it as an uncaught error. Track them so `stop` can wait.
  const open = new Set<PoolClient>();
  pool.on("connect", (client) => {
    open.add(client);
    client.once("end", () => open.delete(client));
  });
  const jobs = inlineJobs();
  const app = await buildApp(
    {
      config,
      db,
      auth: opts.auth === undefined ? testVerifier : opts.auth,
      storage: opts.storage ?? null,
      jobs,
      geocoderFor: opts.geocoderFor ?? null,
    },
    { docs: false, register: opts.register ?? [] },
  );
  return {
    app,
    config,
    jobs,
    stop: async () => {
      await app.close();
      const closed = [...open].map((client) => once(client, "end"));
      await pool.end();
      await Promise.all(closed);
      await container.stop();
    },
  };
}
