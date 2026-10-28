import { sql } from "drizzle-orm";
import { check, index, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sources } from "./catalog.ts";
import { mediaKindEnum, timestamps, trustEnum } from "./shared.ts";

// Owned by the media module. Catalog read queries may join `media`; only the media module writes it
// (the seed loader is the one other writer).

export const partsStatuses = ["none", "pending", "done", "failed"] as const;
export const partsStatusEnum = pgEnum("media_parts_status", partsStatuses);

/** Persistent media record; `url` points at object storage, never a data URL. */
export const media = pgTable(
  "media",
  {
    id: text("id").primaryKey(),
    kind: mediaKindEnum("kind").notNull(),
    mime: text("mime").notNull(),
    url: text("url").notNull(),
    alt: text("alt").notNull().default(""),
    title: text("title").notNull().default(""),
    titleEn: text("title_en"),
    description: text("description").notNull().default(""),
    license: text("license").notNull(),
    sourceId: text("source_id").references(() => sources.id),
    trust: trustEnum("trust").notNull(),
    bytes: integer("bytes"),
    /** Triangle count of a GLB model (kind = model), counted from its JSON chunk; null for other kinds and models not counted yet. */
    triangles: integer("triangles"),
    /** 3D model part names that story highlights may reference (kind = model). */
    parts: text("parts").array().notNull().default(sql`'{}'::text[]`),
    /** Background GLB part extraction state (kind = model). */
    partsStatus: partsStatusEnum("parts_status").notNull().default("none"),
    /** Bucket-relative object key; null for external/seed URLs. */
    storageKey: text("storage_key").unique("media_storage_key_uq"),
    /** User id of the uploader; null for seed/import content. */
    uploadedBy: text("uploaded_by"),
    ...timestamps,
  },
  (t) => [check("media_url_not_data", sql`${t.url} NOT LIKE 'data:%'`)],
);

export const uploadStatuses = ["pending", "completed", "rejected", "expired"] as const;
export const uploadStatusEnum = pgEnum("media_upload_status", uploadStatuses);

/**
 * Signed upload intent. The client PUTs the file into the non-public `uploads` bucket through the signed URL, then
 * calls complete: the server checks size and magic bytes against the declared type and writes the bytes to the
 * public `media` bucket before creating the `media` row.
 */
export const mediaUploads = pgTable(
  "media_uploads",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    kind: mediaKindEnum("kind").notNull(),
    /** Declared content type; must match the file's magic bytes on complete. */
    contentType: text("content_type").notNull(),
    maxBytes: integer("max_bytes").notNull(),
    /** Key in the `uploads` bucket the signed URL writes to; the published object has another key in `media`. */
    storageKey: text("storage_key").notNull().unique("media_uploads_storage_key_uq"),
    status: uploadStatusEnum("status").notNull().default("pending"),
    /** Why the file was refused on complete (Turkish, shown to the uploader). */
    rejectReason: text("reject_reason"),
    mediaId: text("media_id").references(() => media.id),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    /** When `expireUploads` emptied the upload key after its link was dead for good; null until then. */
    cleanedAt: timestamp("cleaned_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("media_uploads_owner_idx").on(t.ownerId, t.createdAt)],
);

/** Durable deletion intent, committed with removal of the media row. No FK: the row is already gone. */
export const mediaDeletions = pgTable(
  "media_deletions",
  {
    storageKey: text("storage_key").primaryKey(),
    attempts: integer("attempts").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("media_deletions_due_idx").on(t.nextAttemptAt)],
);

/** Private upload cleanup survives account deletion and signed-link replay. */
export const uploadDeletions = pgTable("upload_deletions", {
  storageKey: text("storage_key").primaryKey(),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").notNull().default(0),
}, (t) => [index("upload_deletions_due_idx").on(t.nextAttemptAt)]).enableRLS();
