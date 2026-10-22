import { sql } from "drizzle-orm";
import { check, index, pgEnum, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { sites } from "./catalog.ts";
import { media } from "./media.ts";
import { timestamps } from "./shared.ts";

// Owned by the moderation module.

export const memoryStatuses = ["pending", "approved", "rejected"] as const;
export const memoryStatusEnum = pgEnum("memory_status", memoryStatuses);

/**
 * "İz Bırak" contribution. Starts pending; only approved ones are public. A report ("Bildir")
 * sends an approved memory back to pending. KVKK consent is recorded with the text version shown.
 */
export const memories = pgTable(
  "memories",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id),
    authorId: text("author_id").notNull(),
    /** Display name at submission time (profiles.display_name or a default). */
    authorName: text("author_name").notNull(),
    text: text("text").notNull(),
    mediaId: text("media_id").references(() => media.id),
    status: memoryStatusEnum("status").notNull().default("pending"),
    /** Mandatory on rejection; shown to the author. */
    reason: text("reason"),
    decidedBy: text("decided_by"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    /** When the memory last entered the queue: submission, or a report sending it back. The health box ages pending memories by it. */
    pendingSince: timestamp("pending_since", { withTimezone: true }).notNull().defaultNow(),
    kvkkConsentAt: timestamp("kvkk_consent_at", { withTimezone: true }).notNull(),
    kvkkTextVersion: text("kvkk_text_version").notNull(),
    ...timestamps,
  },
  (t) => [
    check("memories_text_length", sql`char_length(${t.text}) BETWEEN 1 AND 280`),
    check("memories_reject_reason", sql`${t.status} <> 'rejected' OR coalesce(btrim(${t.reason}), '') <> ''`),
    index("memories_site_status_idx").on(t.siteId, t.status),
    index("memories_status_created_idx").on(t.status, t.createdAt),
    index("memories_author_idx").on(t.authorId),
  ],
);

/** "Bildir": one report per user and memory. */
export const memoryReports = pgTable(
  "memory_reports",
  {
    id: text("id").primaryKey(),
    memoryId: text("memory_id")
      .notNull()
      .references(() => memories.id, { onDelete: "cascade" }),
    reporterId: text("reporter_id").notNull(),
    reason: text("reason").notNull(),
    ...timestamps,
  },
  (t) => [unique("memory_reports_once_uq").on(t.memoryId, t.reporterId)],
);
