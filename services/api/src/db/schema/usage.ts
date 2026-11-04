import { sql } from "drizzle-orm";
import { boolean, check, date, integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

// Owned by the usage module (§11.72).

/**
 * Daily usage counters. Only counts are stored: no user id, IP, device id or timestamp finer than the day
 * (Europe/Istanbul), so a row can never point back to a person. `siteId` and `ref` are '' when the event has none
 * (they are part of the key); no foreign key, so counts of a removed site stay.
 */
export const usageDaily = pgTable(
  "usage_daily",
  {
    day: date("day").notNull(),
    /** See `USAGE_EVENTS` in modules/usage/events.ts. */
    event: text("event").notNull(),
    siteId: text("site_id").notNull().default(""),
    /** Event detail: route id, sentence index, part card id, task id, narration language, sign-in kind. */
    ref: text("ref").notNull().default(""),
    guest: boolean("guest").notNull(),
    count: integer("count").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.day, t.event, t.siteId, t.ref, t.guest] }),
    check("usage_daily_count_check", sql`${t.count} > 0`),
  ],
).enableRLS();
