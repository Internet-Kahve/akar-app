import { buildApp } from "./app.ts";
import { loadConfig } from "./config.ts";
import { createDb } from "./db/client.ts";
import { createJwksVerifier } from "./modules/identity/verifier.ts";
import { DEFAULT_DATASET_REF, networkGeocoderFor } from "./modules/ingest/network-geocoder.ts";
import { drainMediaDeletions, expireUploads, sweepUnattachedPhotos } from "./modules/media/service.ts";
import { storageFromConfig } from "./modules/media/storage-config.ts";
import { pgBossJobs } from "./platform/jobs.ts";
import { purgeIdempotencyKeys } from "./platform/idempotency.ts";

const config = loadConfig();
const { db, pool } = createDb(config.DATABASE_URL);

const auth =
  config.AUTH_JWKS_URL && config.AUTH_JWT_ISSUER
    ? createJwksVerifier({ jwks: config.AUTH_JWKS_URL, issuer: config.AUTH_JWT_ISSUER, audience: config.AUTH_JWT_AUDIENCE, db })
    : null;
const storage = storageFromConfig(config);
const jobs = await pgBossJobs(config.DATABASE_URL);

const app = await buildApp({
  config,
  db,
  auth,
  storage,
  jobs,
  geocoderFor: networkGeocoderFor({
    overpassUrl: config.OVERPASS_URL,
    nominatimUrl: config.NOMINATIM_URL,
    nominatimEmail: config.NOMINATIM_EMAIL,
    datasetRef: DEFAULT_DATASET_REF,
    log: (msg) => app.log.info(msg),
  }),
});
if (!auth) app.log.warn("AUTH_JWKS_URL / AUTH_JWT_ISSUER unset: every bearer token is rejected (401)");
if (!storage) app.log.warn("STORAGE_DRIVER unset: media endpoints answer 503");

// Upload tickets nobody finished are expired, and every upload's key in the non-public bucket is emptied once its link is dead.
// Visitors' photos that no memory or content uses are deleted a day after their upload.
const sweepUploads = storage
  ? setInterval(() => {
      expireUploads({ db, storage }).then(
        (n) => n > 0 && app.log.info({ cleaned: n }, "cleaned up closed uploads"),
        (err: unknown) => app.log.error({ err }, "upload expiry sweep failed"),
      );
      sweepUnattachedPhotos({ db, storage }).then(
        (n) => n > 0 && app.log.info({ deleted: n }, "deleted unattached visitor photos"),
        (err: unknown) => app.log.error({ err }, "unattached photo sweep failed"),
      );
    }, 15 * 60_000)
  : undefined;

// Resume committed deletions at startup, including work left by a crashed instance. Multiple instances
// coordinate through SKIP LOCKED. Avoid overlapping ticks in this process when storage is slow.
let deleting = false;
const deletePendingMedia = async () => {
  if (!storage || deleting) return;
  deleting = true;
  try {
    const result = await drainMediaDeletions({ db, storage });
    if (result.failed) app.log.error(result, "media deletions waiting for retry");
  } catch (err) {
    app.log.error({ err }, "media deletion worker failed");
  } finally {
    deleting = false;
  }
};
void deletePendingMedia();
const retryMediaDeletions = setInterval(() => void deletePendingMedia(), 30_000);

// Replay records (and the personal data in stored responses) are forgotten after IDEMPOTENCY_TTL_HOURS.
const purgeReplays = setInterval(() => {
  purgeIdempotencyKeys(db).then(
    (n) => n > 0 && app.log.info({ purged: n }, "purged old idempotency keys"),
    (err: unknown) => app.log.error({ err }, "idempotency key purge failed"),
  );
}, 15 * 60_000);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, async () => {
    clearInterval(sweepUploads);
    clearInterval(purgeReplays);
    clearInterval(retryMediaDeletions);
    await app.close();
    await jobs.stop();
    await pool.end();
    process.exit(0);
  });
}

await app.listen({ host: config.HOST, port: config.PORT });
