import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, primaryKey, smallint, text, unique } from "drizzle-orm/pg-core";
import { cities, historyImages, sites, sources } from "./catalog.ts";
import { media } from "./media.ts";
import { publishStatusEnum, timestamps, trustEnum } from "./shared.ts";

/** Duration and distance are not stored: computed from the stop chain (PostGIS) + narration minutes. */
export const catalogRoutes = pgTable(
  "catalog_routes",
  {
    id: text("id").primaryKey(),
    cityId: text("city_id")
      .notNull()
      .references(() => cities.id),
    name: text("name").notNull(),
    nameEn: text("name_en"),
    description: text("description").notNull(),
    theme: text("theme").notNull(),
    badgeTitle: text("badge_title"),
    badgeMediaId: text("badge_media_id").references(() => media.id),
    status: publishStatusEnum("status").notNull().default("draft"),
    ...timestamps,
  },
  (t) => [
    index("catalog_routes_published_idx").on(t.id).where(sql`${t.status} = 'published'`),
    index("catalog_routes_city_idx").on(t.cityId),
  ],
);

/**
 * Three-option question tied to a site. The correct option lives in `quiz_answers` so that no
 * `select` on this table can leak the key.
 */
export const quizzes = pgTable(
  "quizzes",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    questionEn: text("question_en"),
    options: text("options").array().notNull(),
    optionsEn: text("options_en").array(),
    hint: text("hint"),
    /** Shown after a correct answer, with its source and trust label. */
    explanation: text("explanation").notNull().default(""),
    sourceId: text("source_id").references(() => sources.id),
    trust: trustEnum("trust").notNull(),
    ...timestamps,
  },
  (t) => [
    check("quizzes_three_options", sql`cardinality(${t.options}) = 3`),
    check("quizzes_three_options_en", sql`${t.optionsEn} IS NULL OR cardinality(${t.optionsEn}) = 3`),
    index("quizzes_site_idx").on(t.siteId),
  ],
);

/** Server-only answer key. Never serialized; read only by the quiz-check service. */
export const quizAnswers = pgTable(
  "quiz_answers",
  {
    quizId: text("quiz_id")
      .primaryKey()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    correctIndex: smallint("correct_index").notNull(),
  },
  (t) => [check("quiz_answers_index_range", sql`${t.correctIndex} BETWEEN 0 AND 2`)],
);

export const routeStops = pgTable(
  "route_stops",
  {
    routeId: text("route_id")
      .notNull()
      .references(() => catalogRoutes.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id),
    quizId: text("quiz_id").references(() => quizzes.id, { onDelete: "set null" }),
    historyImageId: text("history_image_id").references(() => historyImages.id, { onDelete: "set null" }),
  },
  (t) => [primaryKey({ columns: [t.routeId, t.position] }), unique("route_stops_site_uq").on(t.routeId, t.siteId)],
);
