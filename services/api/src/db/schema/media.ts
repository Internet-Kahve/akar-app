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
 * Signed upload intent. The client PUTs the file to the signed URL, then calls complete: the
 * server checks size and magic bytes against the declared type before creating the `media` row.
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
    storageKey: text("storage_key").notNull().unique("media_uploads_storage_key_uq"),
    status: uploadStatusEnum("status").notNull().default("pending"),
    /** Why the file was refused on complete (Turkish, shown to the uploader). */
    rejectReason: text("reject_reason"),
    mediaId: text("media_id").references(() => media.id),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index("media_uploads_owner_idx").on(t.ownerId, t.createdAt)],
);
