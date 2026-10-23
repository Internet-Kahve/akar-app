import { and, eq, getTableColumns, inArray, sql } from "drizzle-orm";
import type { FastifyBaseLogger } from "fastify";
import { randomUUID } from "node:crypto";
import type { AppDeps } from "../../app.ts";
import type { Db } from "../../db/client.ts";
import { cities, importJobs } from "../../db/schema/index.ts";
import { AppError } from "../../errors.ts";
import { recordAudit } from "../../platform/audit.ts";
import type { Tx } from "../../platform/idempotency.ts";
import { decodeCursor, encodeCursor } from "../../platform/pagination.ts";
import { CITIES, type CityConfig } from "../ingest/cities.ts";
import { parseCsv } from "../ingest/csv.ts";
import { commitImport, planImport, type ImportPlan, type ImportReport, type PlannedItem } from "../ingest/service.ts";

/**
 * Admin inventory import ("Envanterden içe aktar") around the ingest module's `planImport` /
 * `commitImport`: the uploaded CSV is stored as a job, planned in the background (geocoding takes
 * minutes), reviewed by the editor, then committed as Tier 1 drafts.
 *
 *   queued → planning → planned → committing → committed        (planning can end in `failed`)
 *
 * Only the plan's `items` and `report` are stored: `ImportPlan.city` holds a function, so commit
 * rebuilds it from `CITIES`. `committing` exists only inside the commit transaction (nothing outside
 * ever sees it), so a crash cannot leave a job stuck there.
 */

export const IMPORT_PLAN_JOB = "admin.import-plan";

type Actor = { id: string; requestId: string };

/** Everything but the raw CSV (up to 2 MB), which only the planning job reads. */
const { csv: _csv, ...jobColumns } = getTableColumns(importJobs);
export type ImportJobRow = Omit<typeof importJobs.$inferSelect, "csv">;

const cityConfig = (cityId: string): CityConfig | undefined => (Object.hasOwn(CITIES, cityId) ? CITIES[cityId] : undefined);

/** The configured city for `cityId`, or 400 naming the supported ones. */
export function resolveCity(cityId: string): CityConfig {
  const city = cityConfig(cityId);
  if (!city) {
    throw new AppError(400, "VALIDATION_FAILED", "Girdi doğrulanamadı.", {
      cityId: [`Bilinmeyen şehir. Desteklenenler: ${Object.keys(CITIES).join(", ")}.`],
    });
  }
  return city;
}

/** Inventory rows of an uploaded CSV; a file with no rows or without the name column is not an inventory (400). */
export function parseInventory(csv: string): Record<string, string>[] {
  const rows = parseCsv(csv);
  const [first] = rows;
  if (!first) throw new AppError(400, "VALIDATION_FAILED", "Girdi doğrulanamadı.", { csv: ["CSV'de veri satırı yok."] });
  if (!("ad_ham" in first)) {
    throw new AppError(400, "VALIDATION_FAILED", "Girdi doğrulanamadı.", {
      csv: ["CSV'de ad_ham sütunu yok; başlık satırı id,cilt,sayfa,ilce,ad_ham,ad_supheli,tur,sablon,rol,olcu_sayisi,kubbe_gecisi,adres olmalı."],
    });
  }
  return rows;
}

/** Stores the CSV as a `queued` job and audits it. The caller enqueues `IMPORT_PLAN_JOB` in the same transaction. */
export async function createImportJob(
  tx: Tx,
  actor: Actor,
  input: { city: CityConfig; csv: string; includeToc: boolean; rows: number },
): Promise<ImportJobRow> {
  // import_jobs.city_id references cities, and a city only exists once it has content: the first
  // import of a city creates its row (commitImport does the same, so this never conflicts with it).
  await tx.insert(cities).values({ id: input.city.id, name: input.city.name }).onConflictDoNothing();
  const [job] = await tx
    .insert(importJobs)
    .values({ id: `import-${randomUUID()}`, cityId: input.city.id, csv: input.csv, includeToc: input.includeToc, createdBy: actor.id })
    .returning(jobColumns);
  if (!job) throw new Error("import_jobs insert returned no row");

  // The CSV itself stays out of the audit log; the row count says how big the upload was.
  await recordAudit(tx, {
    actorId: actor.id,
    action: "import.create",
    entityType: "import",
    entityId: job.id,
    after: { cityId: job.cityId, includeToc: job.includeToc, rows: input.rows },
    requestId: actor.requestId,
  });
  return job;
}

export async function getImportJob(db: Tx | Db, id: string): Promise<ImportJobRow> {
  const [job] = await db.select(jobColumns).from(importJobs).where(eq(importJobs.id, id));
  if (!job) throw new AppError(404, "NOT_FOUND", "İçe aktarma bulunamadı.");
  return job;
}

/** One page of the stored plan's items, in CSV row order; the cursor is the offset of the next item. */
export function importItems(job: ImportJobRow, page: { cursor?: string | undefined; limit: number }): { items: PlannedItem[]; nextCursor: string | null } {
  // Written by `planImportJob` as `PlannedItem[]`, never by a client.
  const all: PlannedItem[] = Array.isArray(job.plan) ? job.plan : [];
  const start = page.cursor ? Number(decodeCursor(page.cursor, ["o"]).o) : 0;
  if (!Number.isInteger(start) || start < 0) throw new AppError(400, "INVALID_CURSOR", "İmleç geçersiz.", { cursor: ["Geçersiz imleç."] });
  const end = start + page.limit;
  return { items: all.slice(start, end), nextCursor: end < all.length ? encodeCursor({ o: String(end) }) : null };
}

/** Marks the job failed with a short reason the editor can read. `claimedAt`: only if that planning run still holds the job. */
export async function failImportJob(db: Db, importId: string, reason: string, claimedAt?: Date): Promise<void> {
  await db
    .update(importJobs)
    .set({ status: "failed", error: reason.slice(0, 500), updatedAt: sql`now()` })
    .where(and(eq(importJobs.id, importId), claimedAt ? heldBy(claimedAt) : undefined));
}

/** The job is still `planning` under the claim taken at `claimedAt` (a takeover moves `updated_at`). */
const heldBy = (claimedAt: Date) => and(eq(importJobs.status, "planning"), eq(importJobs.updatedAt, claimedAt));

/**
 * Body of the `admin.import-plan` job. The route sends one message per job, so a second delivery
 * only comes from the durable queue after the run holding the job died: stopped server (retried at once) or
 * expiry (15 min, queue default; 2 retries). The message therefore claims a `queued` job and also
 * takes over one left in `planning`; finished jobs are not touched. The result is written only while
 * this run still holds its claim, so a run that was taken over cannot overwrite a newer plan or a
 * committed job. Any error ends in `failed` with its message rather than propagating: the queue
 * would only retry a plan that cannot succeed.
 */
export async function planImportJob(deps: Pick<AppDeps, "db" | "geocoderFor">, importId: string, log: FastifyBaseLogger): Promise<void> {
  // Millisecond Date (not now()): the stored value must compare equal to `claimedAt` later.
  const claimedAt = new Date();
  const [job] = await deps.db
    .update(importJobs)
    .set({ status: "planning", updatedAt: claimedAt })
    .where(and(eq(importJobs.id, importId), inArray(importJobs.status, ["queued", "planning"])))
    .returning({ cityId: importJobs.cityId, csv: importJobs.csv, includeToc: importJobs.includeToc });
  if (!job) return;

  try {
    const city = cityConfig(job.cityId);
    if (!city) throw new Error(`Şehir yapılandırması bulunamadı: ${job.cityId}.`);
    if (!deps.geocoderFor) throw new Error("Coğrafi kodlama yapılandırılmamış.");
    const rows = parseCsv(job.csv);
    const plan = await planImport(deps.db, {
      city,
      rows,
      geocoder: await deps.geocoderFor(city, rows),
      includeToc: job.includeToc,
    });
    await deps.db
      .update(importJobs)
      .set({ status: "planned", report: plan.report, plan: plan.items, error: null, updatedAt: sql`now()` })
      .where(and(eq(importJobs.id, importId), heldBy(claimedAt)));
  } catch (err) {
    log.error({ err, importId }, "import planning failed");
    await failImportJob(deps.db, importId, `Planlama başarısız: ${err instanceof Error ? err.message : String(err)}`, claimedAt);
  }
}

const STATE_LABEL: Record<ImportJobRow["status"], string> = {
  queued: "sırada",
  planning: "planlanıyor",
  planned: "planlandı",
  committing: "onaylanıyor",
  committed: "zaten onaylandı",
  failed: "başarısız oldu",
};

/**
 * Commits a `planned` job's drafts. The claim (`planned → committing`) is one conditional UPDATE: a
 * concurrent second commit waits on the row lock, then finds the job `committed` and gets 409, as
 * does a commit of a job in any other state. Drafts, the job's final state and the audit row share
 * the caller's transaction.
 */
export async function commitImportJob(tx: Tx, actor: Actor, id: string): Promise<ImportJobRow> {
  const [claimed] = await tx
    .update(importJobs)
    .set({ status: "committing", updatedAt: sql`now()` })
    .where(and(eq(importJobs.id, id), eq(importJobs.status, "planned")))
    .returning(jobColumns);
  if (!claimed) {
    const current = await getImportJob(tx, id);
    throw new AppError(409, "CONFLICT", `Yalnız planlanmış bir içe aktarma onaylanabilir; bu içe aktarma ${STATE_LABEL[current.status]}.`);
  }

  const city = cityConfig(claimed.cityId);
  if (!city || !Array.isArray(claimed.plan) || !claimed.report) {
    throw new AppError(409, "CONFLICT", "İçe aktarma planı okunamadı; içe aktarmayı yeniden başlat.");
  }
  const plan: ImportPlan = { city, items: claimed.plan, report: claimed.report as ImportReport };
  // commitImport opens its own transaction; handed ours, drizzle nests it as a savepoint.
  const { inserted } = await commitImport(tx as unknown as Db, plan);

  const [done] = await tx
    .update(importJobs)
    .set({ status: "committed", insertedCount: inserted, updatedAt: sql`now()` })
    .where(eq(importJobs.id, id))
    .returning(jobColumns);
  if (!done) throw new Error("import_jobs row vanished during commit");
  await recordAudit(tx, {
    actorId: actor.id,
    action: "import.commit",
    entityType: "import",
    entityId: id,
    before: { status: "planned" },
    after: { status: "committed", cityId: done.cityId, insertedCount: inserted },
    requestId: actor.requestId,
  });
  return done;
}
