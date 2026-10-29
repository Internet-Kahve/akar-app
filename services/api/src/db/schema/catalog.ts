import type { CityScene } from "@akar/domain";
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  doublePrecision,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { media } from "./media.ts";
import {
  point4326,
  publishStatusEnum,
  siteRoleEnum,
  siteTierEnum,
  sourceKindEnum,
  timestamps,
  trustEnum,
  type CameraPose,
} from "./shared.ts";

// ── lookup tables (reference rows live in migration 0003_reference_data) ──────

/** Waqf-role map chips: Dinî · Su · Eğitim ve sosyal (hayrat) · Akar. One pin colour each. */
export const roleCategories = pgTable("role_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull(),
  /** hayrat = free public service; akar = income that keeps the hayrat running. */
  waqfRole: siteRoleEnum("waqf_role").notNull(),
  position: integer("position").notNull(),
});

/** Building type ("tür"). `category_id` is the type → role-category mapping. */
export const siteTypes = pgTable("site_types", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => roleCategories.id),
  /** `normalize()`d spellings the importer maps to this type (e.g. "mescit" → cami). */
  aliases: text("aliases").array().notNull().default(sql`'{}'::text[]`),
  position: integer("position").notNull(),
});

/** Historical period used by the period filter; `sites.era` keeps the free-text label. */
export const periods = pgTable("periods", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull(),
  startYear: integer("start_year"),
  endYear: integer("end_year"),
  position: integer("position").notNull(),
});

// ── places ───────────────────────────────────────────────────────────────────

/** City (e.g. "bursa"); `city=` filter matches the slug id. */
export const cities = pgTable("cities", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  /** 3D model light and viewer background (§11.42); null = clients use `defaultCityScene`. */
  scene: jsonb("scene").$type<CityScene>(),
  ...timestamps,
});

/** District / heritage area inside a city (domain `HeritageSite.district`). */
export const regions = pgTable(
  "regions",
  {
    id: text("id").primaryKey(),
    cityId: text("city_id")
      .notNull()
      .references(() => cities.id),
    name: text("name").notNull(),
    ...timestamps,
  },
  (t) => [unique("regions_city_name_uq").on(t.cityId, t.name), unique("regions_id_city_uq").on(t.id, t.cityId)],
);

// ── sources ──────────────────────────────────────────────────────────────────

/** Shared bibliography entry; one source can back several sites, photos and sentences. */
export const sources = pgTable("sources", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  kind: sourceKindEnum("kind").notNull(),
  author: text("author").notNull().default(""),
  year: text("year").notNull().default(""),
  page: text("page").notNull().default(""),
  url: text("url").notNull().default(""),
  trust: trustEnum("trust").notNull(),
  ...timestamps,
});

// ── sites ────────────────────────────────────────────────────────────────────

export const sites = pgTable(
  "sites",
  {
    id: text("id").primaryKey(),
    cityId: text("city_id")
      .notNull()
      .references(() => cities.id),
    /** Null when the district is unknown (e.g. table-of-contents-only import rows). */
    regionId: text("region_id"),
    name: text("name").notNull(),
    nameEn: text("name_en"),
    /** Null = "tür belirsiz" import draft; required to publish. */
    typeId: text("type_id").references(() => siteTypes.id),
    periodId: text("period_id").references(() => periods.id),
    year: text("year").notNull().default(""),
    architect: text("architect").notNull().default(""),
    patron: text("patron"),
    era: text("era"),
    address: text("address"),
    role: siteRoleEnum("role"),
    relatedSiteId: text("related_site_id"),
    description: text("description").notNull().default(""),
    descriptionEn: text("description_en"),
    /** Narration length in minutes; feeds computed route duration. */
    minutes: integer("minutes").notNull().default(0),
    tier: siteTierEnum("tier").notNull(),
    /** Site-level trust; story blocks carry their own per-sentence trust. */
    trust: trustEnum("trust").notNull(),
    /** Legacy one-line source summary kept for backward compatibility (domain `source`). */
    sourceSummary: text("source_summary").notNull().default(""),
    status: publishStatusEnum("status").notNull().default("draft"),
    /** null = legacy record; 2 = editor v2, strict `publicationIssues` gate on publish. */
    editorVersion: integer("editor_version"),
    coverMediaId: text("cover_media_id").references(() => media.id),
    /** Cover photograph of the "Eser hakkında" page; null = the gallery cover. */
    aboutCoverMediaId: text("about_cover_media_id").references(() => media.id),
    /** "Açılış açısı": camera pose the 3D story opens with. */
    openingCamera: jsonb("opening_camera").$type<CameraPose>(),
    /** Null = "konum bulunamadı" import draft; required to publish. */
    location: point4326("location"),
    /** How `location` was obtained: seed | manual | osm | overpass | nominatim | nominatim-address | nominatim-street, nominatim-neighbourhood (both approximate). */
    locationSource: text("location_source"),
    /** `normalize(name)|normalize(district)`: duplicate key for import and admin create (indexed, not unique). */
    dedupeKey: text("dedupe_key").notNull(),
    /** Raw inventory row (volume, page, raw type, raw address) kept for editorial review. */
    importMeta: jsonb("import_meta"),
    /** `normalize(name city district architect)` from @akar/domain; written by the app. */
    searchText: text("search_text").notNull(),
    /** `normalize(name)` with C collation: stable keyset order (sort_name, id). */
    sortName: text("sort_name").notNull(),
    ...timestamps,
  },
  (t) => [
    foreignKey({ columns: [t.relatedSiteId], foreignColumns: [t.id], name: "sites_related_site_fk" }),
    foreignKey({ columns: [t.regionId, t.cityId], foreignColumns: [regions.id, regions.cityId], name: "sites_region_city_fk" }),
    index("sites_city_dedupe_idx").on(t.cityId, t.dedupeKey),
    check("sites_editor_version", sql`${t.editorVersion} IS NULL OR ${t.editorVersion} = 2`),
    // A point on the street or the neighbourhood centre is not the building: an editor must confirm
    // or move it (location_source becomes "manual") before publishing.
    check(
      "sites_published_complete",
      sql`${t.status} <> 'published' OR (${t.location} IS NOT NULL AND ${t.typeId} IS NOT NULL AND ${t.locationSource} IS DISTINCT FROM 'nominatim-neighbourhood' AND ${t.locationSource} IS DISTINCT FROM 'nominatim-street')`,
    ),
    index("sites_location_gist").using("gist", t.location),
    index("sites_published_order_idx")
      .on(sql`${t.sortName} COLLATE "C"`, sql`${t.id} COLLATE "C"`)
      .where(sql`${t.status} = 'published'`),
    index("sites_city_idx").on(t.cityId),
    index("sites_region_idx").on(t.regionId),
    index("sites_type_idx").on(t.typeId),
  ],
);

export const siteSources = pgTable(
  "site_sources",
  {
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
    position: integer("position").notNull(),
    /** Where in the source, e.g. "s. 42" (a shared source has no single page). */
    locator: text("locator"),
  },
  (t) => [primaryKey({ columns: [t.siteId, t.sourceId] }), unique("site_sources_order_uq").on(t.siteId, t.position)],
);

export const siteMedia = pgTable(
  "site_media",
  {
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    mediaId: text("media_id")
      .notNull()
      .references(() => media.id),
    position: integer("position").notNull(),
  },
  (t) => [primaryKey({ columns: [t.siteId, t.mediaId] }), unique("site_media_order_uq").on(t.siteId, t.position)],
);

/** A map point as the API sends it: WGS84 degrees. */
export type MapPoint = { lng: number; lat: number };

/**
 * Where and how a site's 3D model stands on the map (at most one row per site). It lives apart from the
 * model record: replacing the site's model keeps the placement. Written by the editor panel only.
 */
export const siteMapPlacements = pgTable(
  "site_map_placements",
  {
    siteId: text("site_id")
      .primaryKey()
      .references(() => sites.id, { onDelete: "cascade" }),
    /** Null = the model stands on the site's own location. */
    location: point4326("location"),
    /** Clockwise from north. */
    headingDeg: doublePrecision("heading_deg").notNull().default(0),
    scale: doublePrecision("scale").notNull().default(1),
    /** Metres above the ground the model rests on. */
    altitudeM: doublePrecision("altitude_m").notNull().default(0),
    /** Name of the model part the base point is computed from; null = all parts. */
    anchorNode: text("anchor_node"),
    /** OSM buildings the editor hid by hand. */
    hiddenPoints: jsonb("hidden_points").$type<MapPoint[]>().notNull().default(sql`'[]'::jsonb`),
    /** Automatically hidden OSM buildings the editor asked back. */
    keptPoints: jsonb("kept_points").$type<MapPoint[]>().notNull().default(sql`'[]'::jsonb`),
    /** False = stored but not drawn on the public map. */
    visible: boolean("visible").notNull().default(true),
    updatedBy: text("updated_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("site_map_placements_heading", sql`${t.headingDeg} >= 0 AND ${t.headingDeg} < 360`),
    check("site_map_placements_scale", sql`${t.scale} >= 0.1 AND ${t.scale} <= 10`),
    check("site_map_placements_altitude", sql`${t.altitudeM} >= -50 AND ${t.altitudeM} <= 200`),
    check("site_map_placements_anchor", sql`${t.anchorNode} IS NULL OR char_length(${t.anchorNode}) <= 200`),
    check(
      "site_map_placements_points",
      sql`jsonb_typeof(${t.hiddenPoints}) = 'array' AND jsonb_array_length(${t.hiddenPoints}) <= 50 AND jsonb_typeof(${t.keptPoints}) = 'array' AND jsonb_array_length(${t.keptPoints}) <= 50`,
    ),
  ],
).enableRLS();

export const sectionKinds = ["history", "architecture", "waqf"] as const;
export const sectionKindEnum = pgEnum("section_kind", sectionKinds);

/** The reading layer of an "Eser hakkında" chapter, every string quoted verbatim from the chapter's paragraphs. */
export type AboutReading = {
  summary: string[];
  figures: Array<{ value: string; label: string; evidence: string }>;
  quotes: Array<{ text: string; by: string | null }>;
  timeline: Array<{ year: string; evidence: string }>;
  terms: Array<{ word: string; definition: string }>;
  /** Desktop 3D view while the chapter is read; null = leave the model as it is. */
  camera: CameraPose | null;
  /** The model's cover groups lift while the chapter is read. */
  interior: boolean;
  /** Model parts lit while the chapter is read; empty = the whole building. */
  focusParts: string[];
};

/** "Eser hakkında" chapter: one heading of the inventory text; its paragraphs are `site_sections` with this `chapter_id`. */
export const siteAboutChapters = pgTable(
  "site_about_chapters",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    title: text("title").notNull(),
    kind: sectionKindEnum("kind").notNull(),
    reading: jsonb("reading").$type<AboutReading>().notNull(),
  },
  (t) => [unique("site_about_chapters_order_uq").on(t.siteId, t.position)],
).enableRLS();

/** "Eser hakkında" paragraphs: Tarihçe / Mimari / Vakıf ve akar, each with trust + source. */
export const siteSections = pgTable(
  "site_sections",
  {
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    position: integer("position").notNull(),
    /** Null = a paragraph outside any reading chapter (e.g. one the panel added). */
    chapterId: text("chapter_id").references(() => siteAboutChapters.id, { onDelete: "cascade" }),
    kind: sectionKindEnum("kind").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    bodyEn: text("body_en"),
    trust: trustEnum("trust").notNull(),
    sourceId: text("source_id").references(() => sources.id),
  },
  (t) => [primaryKey({ columns: [t.siteId, t.id] }), unique("site_sections_order_uq").on(t.siteId, t.position)],
);

/** Book photographs shown after a paragraph, in order. They are not gallery photos (`site_media`). */
export const siteSectionPhotos = pgTable(
  "site_section_photos",
  {
    siteId: text("site_id").notNull(),
    sectionId: text("section_id").notNull(),
    position: integer("position").notNull(),
    mediaId: text("media_id")
      .notNull()
      .references(() => media.id),
    /** Width / height of the photograph as printed in the book; null = unknown. */
    aspect: numeric("aspect", { precision: 6, scale: 3, mode: "number" }),
    alt: text("alt").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.siteId, t.sectionId, t.position] }),
    foreignKey({ columns: [t.siteId, t.sectionId], foreignColumns: [siteSections.siteId, siteSections.id], name: "site_section_photos_section_fk" }).onDelete("cascade"),
    index("site_section_photos_media_idx").on(t.mediaId),
  ],
).enableRLS();

export const cardKinds = ["portrait", "photo", "document"] as const;
export const cardKindEnum = pgEnum("card_kind", cardKinds);

/** Story card shown over the 3D model; shared, so one edit updates every sentence that uses it. */
export const cards = pgTable("cards", {
  id: text("id").primaryKey(),
  kind: cardKindEnum("kind").notNull(),
  title: text("title").notNull(),
  titleEn: text("title_en"),
  body: text("body").notNull().default(""),
  bodyEn: text("body_en"),
  mediaId: text("media_id")
    .notNull()
    .references(() => media.id),
  sourceId: text("source_id").references(() => sources.id),
  trust: trustEnum("trust").notNull(),
  ...timestamps,
});

/** One story sentence/step; photo/source links are nullable for legacy (editorVersion null) sites. */
export const storyBlocks = pgTable(
  "story_blocks",
  {
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    position: integer("position").notNull(),
    title: text("title").notNull(),
    text: text("text").notNull(),
    textEn: text("text_en"),
    simple: text("simple").notNull(),
    trust: trustEnum("trust").notNull(),
    photoId: text("photo_id").references(() => media.id),
    sourceId: text("source_id").references(() => sources.id),
    /** Legacy domain flag: show this sentence's photo as a card. */
    showCard: boolean("show_card"),
    /** Shared card shown over the model for this sentence. */
    cardId: text("card_id").references(() => cards.id),
    /** Camera pose ("Açı"); null keeps the previous sentence's pose. */
    camera: jsonb("camera").$type<CameraPose>(),
    /** "İç mekân (3D)": the model's cover groups lift for this sentence. */
    interior: boolean("interior").notNull().default(false),
    highlights: text("highlights").array().notNull().default(sql`'{}'::text[]`),
    audioMediaId: text("audio_media_id").references(() => media.id),
    audioEnMediaId: text("audio_en_media_id").references(() => media.id),
  },
  (t) => [
    primaryKey({ columns: [t.siteId, t.id] }),
    unique("story_blocks_order_uq").on(t.siteId, t.position),
    index("story_blocks_card_idx").on(t.cardId),
  ],
);

/** "Geçmişi Gör": archival image with optional present-day pair and alignment pose. */
export const historyImages = pgTable(
  "history_images",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    mediaId: text("media_id")
      .notNull()
      .references(() => media.id),
    presentMediaId: text("present_media_id").references(() => media.id),
    caption: text("caption").notNull().default(""),
    captionEn: text("caption_en"),
    /** Free-text date as given by the source, e.g. "1890'lar". */
    dateLabel: text("date_label").notNull().default(""),
    sourceId: text("source_id").references(() => sources.id),
    trust: trustEnum("trust").notNull(),
    /** Alignment pose ("hizalama açısı") for matching the present-day view. */
    camera: jsonb("camera").$type<CameraPose>(),
  },
  (t) => [unique("history_images_order_uq").on(t.siteId, t.position)],
);

/** 3D part card ("parça kartı"): tapping any of `parts` (model node names) opens it; all of them light up together. */
export const sitePartCards = pgTable(
  "site_part_cards",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    parts: text("parts").array().notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    sourceId: text("source_id").references(() => sources.id),
    trust: trustEnum("trust").notNull(),
  },
  (t) => [unique("site_part_cards_order_uq").on(t.siteId, t.position)],
);

/** A part card's photo strip, in order; the first is the cover. */
export const sitePartCardPhotos = pgTable(
  "site_part_card_photos",
  {
    cardId: text("card_id")
      .notNull()
      .references(() => sitePartCards.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    mediaId: text("media_id")
      .notNull()
      .references(() => media.id),
  },
  (t) => [primaryKey({ columns: [t.cardId, t.position] }), index("site_part_card_photos_media_idx").on(t.mediaId)],
);
