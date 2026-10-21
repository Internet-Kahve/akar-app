import { boolean, index, integer, jsonb, pgEnum, pgTable, text } from "drizzle-orm/pg-core";
import { cities } from "./catalog.ts";
import { timestamps } from "./shared.ts";

// Owned by the admin-catalog module (it is also the writer of catalog/routes content tables).

export const importStatuses = ["queued", "planning", "planned", "committing", "committed", "failed"] as const;
export const importStatusEnum = pgEnum("import_status", importStatuses);

/**
 * Admin "İçe aktar" run: the uploaded CSV is planned in a background job (geocoding takes minutes),
 * the editor reviews the report, then commits the stored plan as Tier 1 drafts.
 */
export const importJobs = pgTable(
  "import_jobs",
  {
    id: text("id").primaryKey(),
    cityId: text("city_id")
      .notNull()
      .references(() => cities.id),
    status: importStatusEnum("status").notNull().default("queued"),
    /** Raw CSV text as uploaded (inventory columns, see ingest/cities.ts). */
    csv: text("csv").notNull(),
    includeToc: boolean("include_toc").notNull().default(false),
    /** `ImportReport` once planned. */
    report: jsonb("report"),
    /** `PlannedItem[]` once planned; committed as-is. */
    plan: jsonb("plan"),
    insertedCount: integer("inserted_count"),
    error: text("error"),
    createdBy: text("created_by").notNull(),
    ...timestamps,
  },
  (t) => [index("import_jobs_created_idx").on(t.createdAt)],
);
