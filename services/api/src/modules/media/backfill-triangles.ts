import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { and, asc, eq, gt, isNull } from "drizzle-orm";
import { loadConfig } from "../../config.ts";
import { createDb, type Db } from "../../db/client.ts";
import { media } from "../../db/schema/index.ts";
import type { ObjectStorage } from "../../platform/storage.ts";
import { storageFromConfig } from "./storage-config.ts";
import { countTriangles, GlbError, readGlbJson } from "./glb.ts";

// npm run backfill:triangles
// One-off, safe to repeat: counts the triangles of every stored model that has no count yet (models uploaded
// before `media.triangles` existed) and writes the number. Only the GLB's JSON chunk is read. Models over the
// upload limit are counted too, nothing is rejected or deleted here. Models that cannot be read stay empty
// and are listed, so a second run tries them again.

export type BackfillReport = { counted: number; unreadable: number; withoutObject: number; withoutKey: number };

/** Models whose count is still empty; the media bucket holds the files. */
export async function backfillTriangles(
  env: { db: Db; storage: ObjectStorage; log: (line: string) => void },
  pageSize = 50,
): Promise<BackfillReport> {
  const report: BackfillReport = { counted: 0, unreadable: 0, withoutObject: 0, withoutKey: 0 };
  let after = "";
  for (;;) {
    // Keyset by id: a model that stays empty (unreadable, missing) must not be fetched again on this run.
    const rows = await env.db
      .select({ id: media.id, storageKey: media.storageKey })
      .from(media)
      .where(and(eq(media.kind, "model"), isNull(media.triangles), gt(media.id, after)))
      .orderBy(asc(media.id))
      .limit(pageSize);
    for (const row of rows) {
      after = row.id;
      const key = row.storageKey;
      if (!key) {
        // Seed and demo content points at a shared file with no key of its own; `import-demo` writes its count.
        report.withoutKey++;
        env.log(`${row.id}: no storage key, skipped`);
        continue;
      }
      const object = await env.storage.head(key);
      if (!object) {
        report.withoutObject++;
        env.log(`${row.id}: object ${key} is missing from storage`);
        continue;
      }
      try {
        const triangles = countTriangles(await readGlbJson(object.bytes, (range) => env.storage.read(key, range)));
        await env.db.update(media).set({ triangles }).where(and(eq(media.id, row.id), isNull(media.triangles)));
        report.counted++;
        env.log(`${row.id}: ${triangles} triangles`);
      } catch (err) {
        if (!(err instanceof GlbError)) throw err;
        report.unreadable++;
        env.log(`${row.id}: unreadable (${err.message})`);
      }
    }
    if (rows.length < pageSize) return report;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const config = loadConfig(process.env);
  const storage = storageFromConfig(config)?.media;
  if (!storage) {
    console.error("Dosya depolama yapılandırılmamış (STORAGE_*).");
    process.exit(2);
  }
  const { db, pool } = createDb(config.DATABASE_URL, 2, config.DATABASE_SSL_CA);
  try {
    const report = await backfillTriangles({ db, storage, log: (line) => console.log(line) });
    console.log(JSON.stringify(report));
  } finally {
    await pool.end();
  }
}
