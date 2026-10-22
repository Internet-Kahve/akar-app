import { sql } from "drizzle-orm";
import { check, doublePrecision, integer, pgTable, smallint, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Hand-tuned map values the apps read from the API (decision log §11.2, §11.4). Exactly one row
 * (`id = 1`), created by the migration with the starting values; admins change it via the panel.
 */
export const mapSettings = pgTable(
  "map_settings",
  {
    id: smallint("id").primaryKey().default(1),
    /** 3D models load only at this map zoom or closer. */
    modelMinZoom: doublePrecision("model_min_zoom").notNull().default(16),
    /** Upper bound on 3D models drawn at once; 0 turns 3D off on the map. */
    maxVisibleModels: integer("max_visible_models").notNull().default(5),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by"),
  },
  (t) => [
    check("map_settings_single_row", sql`${t.id} = 1`),
    check("map_settings_zoom_range", sql`${t.modelMinZoom} BETWEEN 0 AND 24`),
    check("map_settings_models_range", sql`${t.maxVisibleModels} BETWEEN 0 AND 50`),
  ],
);
