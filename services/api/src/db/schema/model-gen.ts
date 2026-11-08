import { sql } from "drizzle-orm";
import { check, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sites } from "./catalog.ts";

// Owned by the model-gen module (§11.80).

export const modelGenStatuses = ["running", "succeeded", "failed", "lost"] as const;
export type ModelGenStatus = (typeof modelGenStatuses)[number];

/** A stored output file: name and size only; the runner's signed links expire and are never kept. */
export type ModelGenFile = { name: string; bytes: number };
export type ModelGenUsage = { turns: number; durationMs: number; costUsd: number };

/**
 * One prompt an admin sent to the model runner (the separate service that edits a site's Blender model). The runner
 * keeps its jobs in memory only; this table is the history. `lost` = the runner no longer knew the job (restart).
 * `userId` is the admin's account id; no foreign key, like `import_jobs.created_by` (accounts live in Supabase Auth).
 */
export const modelGenJobs = pgTable(
  "model_gen_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    prompt: text("prompt").notNull(),
    runnerJobId: text("runner_job_id").notNull(),
    status: text("status").$type<ModelGenStatus>().notNull().default("running"),
    reply: text("reply"),
    error: text("error"),
    version: text("version"),
    files: jsonb("files").$type<ModelGenFile[]>(),
    warnings: jsonb("warnings").$type<string[]>(),
    usage: jsonb("usage").$type<ModelGenUsage>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [
    check("model_gen_jobs_status_check", sql`${t.status} in ('running', 'succeeded', 'failed', 'lost')`),
    index("model_gen_jobs_site_created_idx").on(t.siteId, t.createdAt.desc(), t.id.desc()),
  ],
).enableRLS();
