import { buildApp } from "./app.ts";
import { loadConfig } from "./config.ts";
import { createDb } from "./db/client.ts";
import { createJwksVerifier } from "./modules/identity/verifier.ts";
import { curatedGeocoderFor } from "./modules/ingest/curated-geocoder.ts";
import { storageFromConfig } from "./modules/media/storage-config.ts";
import { databaseJobs } from "./platform/jobs.ts";
import { maintenanceRoutes, runMaintenance } from "./platform/maintenance.ts";
import { translatorFromConfig } from "./platform/translate.ts";
import { ttsFromConfig } from "./platform/tts.ts";

/** Shared by the local server and the Vercel handler. No listeners or timers on import. */
export async function createRuntime(env: NodeJS.ProcessEnv = process.env) {
  const config = loadConfig(env);
  const { db, pool } = createDb(config.DATABASE_URL, config.DATABASE_POOL_MAX, config.DATABASE_SSL_CA);
  try {
    const auth = config.AUTH_JWKS_URL && config.AUTH_JWT_ISSUER
      ? createJwksVerifier({ jwks: config.AUTH_JWKS_URL, issuer: config.AUTH_JWT_ISSUER, audience: config.AUTH_JWT_AUDIENCE, db })
      : null;
    const storage = storageFromConfig(config);
    const jobs = databaseJobs(db, (err, name) => app.log.error({ err, name }, "background job waiting for retry"));
    const maintenance = () => runMaintenance({ db, storage }, jobs);
    const app = await buildApp({ config, db, auth, storage, jobs, geocoderFor: curatedGeocoderFor, tts: ttsFromConfig(config), translator: translatorFromConfig(config) }, {
      register: [maintenanceRoutes(maintenance)],
      // The local docs UI serves static assets and is unnecessary in the serverless runtime.
      docs: config.API_RUNTIME !== "vercel",
    });
    pool.on("error", (err) => app.log.error({ err }, "idle database connection failed"));
    return { app, pool, config, maintenance };
  } catch (error) {
    await pool.end();
    throw error;
  }
}
