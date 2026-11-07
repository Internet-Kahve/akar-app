import { trustLabels, type HeritageSite, type SiteSource, type Trust } from "@akar/domain";
import { customType, pgEnum, timestamp } from "drizzle-orm/pg-core";

// Shared column types and enums. Enums are reserved for closed sets the plan does not need to
// extend at runtime; extensible vocabularies (site types, role categories, periods) are tables.
// Enum values come from @akar/domain so the DB, Zod schemas and UI share one list.

type NonEmpty<T> = [T, ...T[]];
export const trustLevels = Object.keys(trustLabels) as NonEmpty<Trust>;
/** A route's status. */
export const publishStatuses = ["draft", "published"] as const satisfies readonly HeritageSite["status"][];
/**
 * A site's status (§11.81): routes' two plus `inactive` (taken off the map, kept). One database enum serves both
 * tables; the route schemas accept only `publishStatuses`.
 */
export const siteStatuses = ["draft", "published", "inactive"] as const satisfies readonly HeritageSite["status"][];
export const sourceKinds = ["book", "article", "archive", "web", "field"] as const satisfies readonly SiteSource["kind"][];
export const siteTiers = ["Hero", "Tier 2", "Tier 1"] as const satisfies readonly HeritageSite["tier"][];
export const siteRoles = ["akar", "hayrat", "both"] as const satisfies readonly NonNullable<HeritageSite["role"]>[];
export const mediaKinds = ["photo", "model", "audio"] as const;

export const trustEnum = pgEnum("trust_level", trustLevels);
export const publishStatusEnum = pgEnum("publish_status", siteStatuses);
export const sourceKindEnum = pgEnum("source_kind", sourceKinds);
export const siteTierEnum = pgEnum("site_tier", siteTiers);
export const siteRoleEnum = pgEnum("site_role", siteRoles);
export const mediaKindEnum = pgEnum("media_kind", mediaKinds);

/** WGS84 point, stored as geometry(Point,4326). Write [lng, lat]; read via ST_X/ST_Y in queries. */
export const point4326 = customType<{ data: [number, number]; driverData: string }>({
  dataType: () => "geometry(Point,4326)",
  toDriver: ([lng, lat]) => `SRID=4326;POINT(${lng} ${lat})`,
});

/**
 * Saved 3D camera pose ("Açı"): azimuth/elevation in degrees around `target` (a model part name; null = model
 * centre), `distance` relative to the model: 1 = the distance at which the whole model fits the view.
 */
export type CameraPose = { label?: string; exact?: boolean; target: string | null; azimuthDeg: number; elevationDeg: number; distance: number };
/** The 3D view a gallery photograph was taken from (`site_media.camera`); `interior` opens the model for it. */
export type PhotoCamera = CameraPose & { interior?: boolean };

export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};
