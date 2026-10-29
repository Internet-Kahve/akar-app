import { bigserial, boolean, index, integer, pgTable, primaryKey, smallint, text, timestamp, unique } from "drizzle-orm/pg-core";
import { siteBadges, siteTasks, sites } from "./catalog.ts";
import { catalogRoutes, quizzes } from "./routes.ts";
import { timestamps } from "./shared.ts";

// Owned by the engagement module. Other modules add points only through
// `recordPointEvent` (src/modules/engagement/points.ts).

/**
 * Append-only points ledger. A user's score is `sum(points)`; it is never stored or accepted
 * from a client. One event per (user, action, subject): repeating an action earns nothing.
 */
export const pointEvents = pgTable(
  "point_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: text("user_id").notNull(),
    /** See `POINT_ACTIONS` in engagement/points.ts, e.g. `quiz.correct`. */
    action: text("action").notNull(),
    /** What the action was about: site id, quiz id, memory id. */
    subjectId: text("subject_id").notNull(),
    points: integer("points").notNull(),
    /** Receipt id when the event was redeemed from a guest receipt; each receipt counts once. */
    receiptId: text("receipt_id").unique("point_events_receipt_uq"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("point_events_once_uq").on(t.userId, t.action, t.subjectId), index("point_events_user_idx").on(t.userId)],
);

/** "Kaydet": state-setting PUT/DELETE, never a toggle. */
export const savedSites = pgTable(
  "saved_sites",
  {
    userId: text("user_id").notNull(),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.siteId] })],
);

/**
 * "Rotam": the player's own ordered list of sites, separate from catalog routes. Replaced as a whole
 * (`PUT /v1/me/route`); `position` is the 0-based order. Guests keep theirs on the device.
 */
export const userRouteStops = pgTable(
  "user_route_stops",
  {
    userId: text("user_id").notNull(),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    position: smallint("position").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.siteId] })],
);

/** Story reading progress ("Devam et · 5/9"): furthest block reached, completion time. */
export const storyProgress = pgTable(
  "story_progress",
  {
    userId: text("user_id").notNull(),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    /** 0-based index of the furthest story block reached. */
    lastBlock: integer("last_block").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.userId, t.siteId] })],
);

/**
 * Quiz state per player (signed-in user id, or `guest:<deviceId>`): wrong attempts unlock the
 * hint, "Cevabı göster" marks it revealed (no points afterwards), `solvedAt` when answered right.
 */
export const quizProgress = pgTable(
  "quiz_progress",
  {
    playerId: text("player_id").notNull(),
    quizId: text("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    wrongAttempts: smallint("wrong_attempts").notNull().default(0),
    revealed: boolean("revealed").notNull().default(false),
    solvedAt: timestamp("solved_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.playerId, t.quizId] })],
);

/** Route badge earned (badge definition = `catalog_routes.badge_title`/`badge_media_id`). */
export const userBadges = pgTable(
  "user_badges",
  {
    userId: text("user_id").notNull(),
    routeId: text("route_id")
      .notNull()
      .references(() => catalogRoutes.id, { onDelete: "cascade" }),
    earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.routeId] })],
);

/** A site task the user completed. `onSite` turns true once any completion was on site and never goes back. */
export const userSiteTasks = pgTable(
  "user_site_tasks",
  {
    userId: text("user_id").notNull(),
    taskId: text("task_id")
      .notNull()
      .references(() => siteTasks.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
    onSite: boolean("on_site").notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.userId, t.taskId] })],
).enableRLS();

/** A site badge the user earned (same `onSite` rule as `user_site_tasks`). */
export const userSiteBadges = pgTable(
  "user_site_badges",
  {
    userId: text("user_id").notNull(),
    badgeId: text("badge_id")
      .notNull()
      .references(() => siteBadges.id, { onDelete: "cascade" }),
    earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
    onSite: boolean("on_site").notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.userId, t.badgeId] })],
).enableRLS();
