import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import type { Config } from "../../config.ts";
import type { Db } from "../../db/client.ts";
import { modelGenJobs, sites, type ModelGenFile } from "../../db/schema/index.ts";
import { AppError } from "../../errors.ts";
import { recordAudit } from "../../platform/audit.ts";
import type { Tx } from "../../platform/idempotency.ts";
import { modelRunnerFromConfig, RunnerError, type ModelRunner, type RunnerJob } from "../../platform/model-runner.ts";
import { decodeCursor, encodeCursor } from "../../platform/pagination.ts";
import { countServerEvent } from "../usage/service.ts";
import type { CreateJobBody, CreatePackageBody, ModelGenJobDto, ModelGenPackageDto, ModelGenStatusResponse } from "./schemas.ts";

type Row = typeof modelGenJobs.$inferSelect;
type Deps = { db: Db; config: Config };

/** The runner names a site's folder by this slug; it is the site id (`eser.json → id`, §11.80). */
const RUNNER_SLUG = /^[a-z0-9-]{1,64}$/;

/** The configured runner; 503 `MODEL_GEN_DISABLED` without `MODEL_RUNNER_URL` and `MODEL_RUNNER_SECRET`. */
export function requireRunner(config: Config): ModelRunner {
  const runner = modelRunnerFromConfig(config);
  if (!runner) {
    throw new AppError(503, "MODEL_GEN_DISABLED", "Yapay zekâ ile model düzenleme bu ortamda kapalı: model çalıştırıcı yapılandırılmamış.");
  }
  return runner;
}

/** A runner failure as the API's answer: busy 409, unknown site 400, everything else 502. */
function toAppError(err: unknown): unknown {
  if (!(err instanceof RunnerError)) return err;
  switch (err.kind) {
    case "busy":
      return new AppError(409, "MODEL_GEN_BUSY", "Model çalıştırıcı şu an başka bir işi yürütüyor. O iş bitince tekrar dene.");
    case "unknown-site":
      return new AppError(400, "MODEL_GEN_UNKNOWN_SITE", "Model çalıştırıcıda bu eserin model klasörü yok.");
    default:
      return new AppError(502, "UPSTREAM_FAILED", err.message);
  }
}

/** Runner sign-in state for the panel; `enabled: false` (no 503) so the panel can say it is not configured. */
export async function runnerStatus(config: Config): Promise<ModelGenStatusResponse> {
  const runner = modelRunnerFromConfig(config);
  if (!runner) return { enabled: false, loggedIn: false, plan: null, expiresAt: null };
  try {
    return { enabled: true, ...(await runner.authStatus()) };
  } catch (err) {
    throw toAppError(err);
  }
}

/** Starts a runner job for a site and stores it. Throws 404 (site), 400 (no usable slug), 409 busy, 502. */
export async function startJob(
  deps: Deps,
  actor: { id: string; requestId: string },
  siteId: string,
  body: CreateJobBody,
  now: Date,
): Promise<ModelGenJobDto> {
  const runner = requireRunner(deps.config);
  const [site] = await deps.db.select({ id: sites.id }).from(sites).where(eq(sites.id, siteId));
  if (!site) throw new AppError(404, "NOT_FOUND", "Eser bulunamadı.");
  if (!RUNNER_SLUG.test(site.id)) {
    throw new AppError(400, "MODEL_GEN_SITE_UNSUPPORTED", "Bu eserin kimliği model çalıştırıcının kabul ettiği biçimde değil (küçük harf, rakam ve tire, en çok 64 karakter).");
  }

  let runnerJob: { id: string };
  try {
    runnerJob = await runner.createJob({ site: site.id, prompt: body.prompt, newSession: body.newSession });
  } catch (err) {
    throw toAppError(err);
  }

  const row = await deps.db.transaction(async (tx) => {
    const [created] = await tx
      .insert(modelGenJobs)
      .values({ siteId: site.id, userId: actor.id, prompt: body.prompt, runnerJobId: runnerJob.id, createdAt: now })
      .returning();
    await recordAudit(tx, {
      actorId: actor.id,
      action: "model-gen.job",
      entityType: "site",
      entityId: site.id,
      after: { jobId: created!.id, newSession: body.newSession ?? false },
      requestId: actor.requestId,
    });
    return created!;
  });
  await countServerEvent(deps.db, "model_gen.job", now, site.id);
  return toDto(row, null, runner);
}

/**
 * Starts the package job of an exported version: the runner makes the night model from it and bakes the map's day and
 * night files, as for a hand-made model. Not stored: the runner keeps it until it restarts. 404 (site or version), 409, 502.
 */
export async function startPackage(
  deps: Deps,
  actor: { id: string; requestId: string },
  siteId: string,
  body: CreatePackageBody,
): Promise<ModelGenPackageDto> {
  const runner = requireRunner(deps.config);
  const [site] = await deps.db.select({ id: sites.id }).from(sites).where(eq(sites.id, siteId));
  if (!site) throw new AppError(404, "NOT_FOUND", "Eser bulunamadı.");
  if (!RUNNER_SLUG.test(site.id)) {
    throw new AppError(400, "MODEL_GEN_SITE_UNSUPPORTED", "Bu eserin kimliği model çalıştırıcının kabul ettiği biçimde değil (küçük harf, rakam ve tire, en çok 64 karakter).");
  }
  let job: RunnerJob;
  try {
    const { id } = await runner.createPackage({ site: site.id, version: body.version });
    job = await runner.getJob(id);
  } catch (err) {
    if (err instanceof RunnerError && err.kind === "not-found")
      throw new AppError(404, "MODEL_GEN_VERSION_MISSING", "Bu sürüm çalıştırıcıda yok: önce bir iş onu dışa aktarmalı.");
    throw toAppError(err);
  }
  await deps.db.transaction((tx) =>
    recordAudit(tx, {
      actorId: actor.id,
      action: "model-gen.package",
      entityType: "site",
      entityId: site.id,
      after: { runnerJobId: job.id, version: body.version },
      requestId: actor.requestId,
    }),
  );
  return toPackageDto(job, runner);
}

/** A package job as the runner knows it, with fresh signed file links; 404 when it does not (restarted) or it is no package. */
export async function getPackage(config: Config, id: string): Promise<ModelGenPackageDto> {
  const runner = requireRunner(config);
  let job: RunnerJob;
  try {
    job = await runner.getJob(id);
  } catch (err) {
    if (err instanceof RunnerError && err.kind === "not-found") throw new AppError(404, "NOT_FOUND", "Model çalıştırıcı bu paketleme işini tanımıyor.");
    throw toAppError(err);
  }
  if (job.kind !== "package") throw new AppError(404, "NOT_FOUND", "Model çalıştırıcı bu paketleme işini tanımıyor.");
  return toPackageDto(job, runner);
}

function toPackageDto(job: RunnerJob, runner: ModelRunner): ModelGenPackageDto {
  return {
    id: job.id,
    status: job.status,
    version: job.version,
    error: job.error,
    steps: job.events.flatMap((e) => (e.type === "step" && e.name ? [e.name] : [])),
    checks: job.checks,
    files: job.files.map((f) => ({ name: f.name, bytes: f.bytes, role: f.role, url: f.url ? runner.publicUrl(f.url) : null })),
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
  };
}

/** Writes the runner's final answer once (`status = 'running'` guard); returns the stored row either way. */
async function persistTerminal(db: Db, row: Row, live: RunnerJob, now: Date): Promise<Row> {
  const finished = live.finishedAt ? new Date(live.finishedAt) : now;
  const [updated] = await db
    .update(modelGenJobs)
    .set({
      status: live.status,
      reply: live.reply,
      error: live.error,
      version: live.version,
      files: live.files.map(({ name, bytes }): ModelGenFile => ({ name, bytes })),
      warnings: live.warnings,
      usage: live.usage,
      finishedAt: Number.isNaN(finished.getTime()) ? now : finished,
    })
    .where(and(eq(modelGenJobs.id, row.id), eq(modelGenJobs.status, "running")))
    .returning();
  if (updated) return updated;
  // A parallel poll stored it first.
  const [current] = await db.select().from(modelGenJobs).where(eq(modelGenJobs.id, row.id));
  return current ?? row;
}

async function markLost(db: Db, row: Row, now: Date): Promise<Row> {
  const [updated] = await db
    .update(modelGenJobs)
    .set({ status: "lost", error: "Model çalıştırıcı bu işi artık tanımıyor (yeniden başlamış olabilir).", finishedAt: now })
    .where(and(eq(modelGenJobs.id, row.id), eq(modelGenJobs.status, "running")))
    .returning();
  if (updated) return updated;
  const [current] = await db.select().from(modelGenJobs).where(eq(modelGenJobs.id, row.id));
  return current ?? row;
}

/**
 * One job with the runner's live view. A running job is asked from the runner and its final state stored (runner
 * 404 = `lost`). A finished one is asked again only for fresh signed file links and the event list; if the runner
 * no longer knows it, the stored state stands and links and events are empty.
 */
export async function getJob(deps: Deps, id: string, now: Date): Promise<ModelGenJobDto> {
  const runner = requireRunner(deps.config);
  const [found] = await deps.db.select().from(modelGenJobs).where(eq(modelGenJobs.id, id));
  if (!found) throw new AppError(404, "NOT_FOUND", "İş bulunamadı.");

  let row = found;
  let live: RunnerJob | null = null;
  if (row.status !== "lost") {
    try {
      live = await runner.getJob(row.runnerJobId);
    } catch (err) {
      if (row.status === "running") {
        if (!(err instanceof RunnerError && err.kind === "not-found")) throw toAppError(err);
        row = await markLost(deps.db, row, now);
      } else if (!(err instanceof RunnerError)) {
        // A finished job stays readable while the runner is down or has forgotten it.
        throw err;
      }
    }
  }
  if (live && row.status === "running" && live.status !== "running") row = await persistTerminal(deps.db, row, live, now);
  return toDto(row, live, runner);
}

export async function listJobs(db: Db, siteId: string, page: { cursor?: string | undefined; limit: number }) {
  const [site] = await db.select({ id: sites.id }).from(sites).where(eq(sites.id, siteId));
  if (!site) throw new AppError(404, "NOT_FOUND", "Eser bulunamadı.");

  // Microsecond-exact sort key as text: a JS Date would cut it to milliseconds and the page border could skip rows.
  const key = sql<string>`${modelGenJobs.createdAt}::text`;
  let after: SQL | undefined;
  if (page.cursor) {
    const c = decodeCursor(page.cursor, ["c", "i"]);
    if (!/^[0-9a-f-]{36}$/i.test(c.i) || !/^\d{4}-\d\d-\d\d[ T][\d:.]+(Z|[+-]\d\d(:?\d\d)?)?$/.test(c.c)) {
      throw new AppError(400, "INVALID_CURSOR", "İmleç geçersiz.", { cursor: ["Geçersiz imleç."] });
    }
    after = sql`(${modelGenJobs.createdAt}, ${modelGenJobs.id}) < (${c.c}::timestamptz, ${c.i}::uuid)`;
  }
  const rows = await db
    .select({ row: modelGenJobs, key })
    .from(modelGenJobs)
    .where(and(eq(modelGenJobs.siteId, site.id), after))
    .orderBy(desc(modelGenJobs.createdAt), desc(modelGenJobs.id))
    .limit(page.limit + 1);
  const items = rows.slice(0, page.limit);
  const last = items.at(-1);
  return {
    items: items.map((r) => toDto(r.row, null, null)),
    nextCursor: rows.length > page.limit && last ? encodeCursor({ c: last.key, i: last.row.id }) : null,
  };
}

/** Account erasure (KVKK, §11.31): the prompts and replies of the account's jobs go with it. */
export async function eraseModelGenJobs(tx: Tx, userId: string): Promise<void> {
  await tx.delete(modelGenJobs).where(eq(modelGenJobs.userId, userId));
}

function toDto(row: Row, live: RunnerJob | null, runner: ModelRunner | null): ModelGenJobDto {
  const urls = new Map((live?.files ?? []).flatMap((f) => (f.url ? [[f.name, f.url] as const] : [])));
  // A running job shows the files the runner has exported so far; a stored one only name and size.
  const stored: ModelGenFile[] = row.status === "running" && live ? live.files.map(({ name, bytes }) => ({ name, bytes })) : (row.files ?? []);
  return {
    id: row.id,
    siteId: row.siteId,
    prompt: row.prompt,
    status: row.status,
    reply: row.reply,
    error: row.error,
    version: row.version,
    files: stored.map((f) => {
      const url = urls.get(f.name);
      return { name: f.name, bytes: f.bytes, url: url && runner ? runner.publicUrl(url) : null };
    }),
    warnings: row.warnings ?? [],
    usage: row.usage,
    events: live?.events ?? [],
    createdBy: row.userId,
    createdAt: row.createdAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
  };
}
