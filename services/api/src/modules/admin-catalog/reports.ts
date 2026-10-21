import { normalize } from "@akar/domain";
import { and, eq, inArray, isNull, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../../db/client.ts";
import { cities, publishStatuses, regions, sites } from "../../db/schema/index.ts";
import { decodeCursor, encodeCursor, PageQuery, pageResponse } from "../../platform/pagination.ts";
import { APPROXIMATE_SOURCES, BUILDING_HEADS, nameKey } from "../ingest/geocode.ts";
import { pageAdminSites } from "./sites.ts";
import type { AdminSiteListItem } from "./sites-schemas.ts";

// Editor reports over the drafts: what blocks publication, which pins are missing or approximate,
// and which sites may be the same building. Read-only; drafts included, so editors only.

const CityFilter = z.string().trim().min(1).max(60).optional().describe("Şehir kimliği (slug), örn. bursa");

export const DraftIssuesQuery = PageQuery.extend({
  city: CityFilter,
  state: z
    .enum(["blocked", "ready"])
    .default("blocked")
    .describe("blocked: yayın eksiği olan taslaklar (varsayılan); ready: eksiği olmayan, yayınlanabilir taslaklar"),
});
export type DraftIssuesInput = z.infer<typeof DraftIssuesQuery>;

export const LocationReportQuery = PageQuery.extend({
  city: CityFilter,
  state: z
    .enum(["missing", "approximate"])
    .optional()
    .describe("missing: konum bulunamadı; approximate: sokak ya da mahalle merkezi; boş: ikisi"),
});
export type LocationReportInput = z.infer<typeof LocationReportQuery>;

export const DuplicateReportQuery = PageQuery.extend({ city: CityFilter });
export type DuplicateReportInput = z.infer<typeof DuplicateReportQuery>;

export const DuplicateGroup = z.object({
  key: z.string().describe("Karşılaştırma anahtarı: yalın ad (\"Koza Hanı Mescidi\" ≈ \"Koza Han Mescidi\")"),
  city: z.object({ id: z.string(), name: z.string() }),
  sameDistrict: z.boolean().describe("En az iki eser aynı ilçede (tarihi bölge adı ilçeye çevrilir): büyük olasılıkla aynı yapı"),
  sites: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        district: z.string().nullable(),
        status: z.enum(publishStatuses),
        coordinates: z.tuple([z.number(), z.number()]).nullable().describe("[boylam, enlem]"),
        locationSource: z.string().nullable(),
      }),
    )
    .describe("Önce yayındakiler, sonra ada göre"),
});
export type DuplicateGroup = z.infer<typeof DuplicateGroup>;
export const DuplicateReportResponse = pageResponse(DuplicateGroup);

const cityWhere = (city: string | undefined): SQL[] => (city ? [eq(sites.cityId, normalize(city))] : []);

/** Drafts with (or, `ready`, without) publish issues, by name; issues as the publish gate words them. */
export function draftIssuesReport(db: Db, input: DraftIssuesInput): Promise<{ items: AdminSiteListItem[]; nextCursor: string | null }> {
  const blocked = input.state === "blocked";
  return pageAdminSites(db, [eq(sites.status, "draft"), ...cityWhere(input.city)], input, (item) => item.issueCount > 0 === blocked);
}

/** Drafts whose pin is missing or only a street / neighbourhood centre, by name. */
export function locationReport(db: Db, input: LocationReportInput): Promise<{ items: AdminSiteListItem[]; nextCursor: string | null }> {
  const missing = isNull(sites.location);
  const approximate = inArray(sites.locationSource, [...APPROXIMATE_SOURCES]);
  const state = input.state === "missing" ? missing : input.state === "approximate" ? approximate : sql`(${missing} OR ${approximate})`;
  return pageAdminSites(db, [eq(sites.status, "draft"), state, ...cityWhere(input.city)], input);
}

const STATUS_ORDER = { published: 0, draft: 1 } as const;

/**
 * Comparable name for the report: the importer's `nameKey` (possessive heads bare, "ve Haziresi" tails
 * dropped), but a parenthetical stays part of the name: in the inventory it is often the building's own
 * name ("(Balabancık) Camii"). Null when only building-type words remain ("Camii", "Türbe ve Haziresi"):
 * such a name matches every building of the type, and the import already flags it as a suspect name.
 */
function reportKey(name: string): string | null {
  const key = nameKey(name.replace(/[()]/g, " "));
  return key.split(" ").some((w) => w && !BUILDING_HEADS.has(w)) ? key : null;
}

/**
 * Sites of one city whose names reduce to the same `reportKey`, with at least one draft among them: an
 * editor decides whether they are one building. Groups are built from the whole filtered catalog (a few
 * thousand rows at most) and paged by (city, key).
 */
export async function duplicateReport(db: Db, input: DuplicateReportInput): Promise<{ items: DuplicateGroup[]; nextCursor: string | null }> {
  const after = input.cursor ? decodeCursor(input.cursor, ["c", "k"]) : null;
  const rows = await db
    .select({
      id: sites.id,
      cityId: sites.cityId,
      cityName: cities.name,
      name: sites.name,
      sortName: sites.sortName,
      district: regions.name,
      status: sites.status,
      lng: sql<number | null>`ST_X(${sites.location})`,
      lat: sql<number | null>`ST_Y(${sites.location})`,
      locationSource: sites.locationSource,
      dedupeKey: sites.dedupeKey,
    })
    .from(sites)
    .innerJoin(cities, eq(cities.id, sites.cityId))
    .leftJoin(regions, eq(regions.id, sites.regionId))
    .where(and(...cityWhere(input.city)));

  const groups = new Map<string, { cityId: string; key: string; rows: typeof rows }>();
  for (const r of rows) {
    const key = reportKey(r.name);
    if (key === null) continue;
    const id = `${r.cityId}\u0000${key}`;
    const group = groups.get(id);
    if (group) group.rows.push(r);
    else groups.set(id, { cityId: r.cityId, key, rows: [r] });
  }

  const byKey = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
  const candidates = [...groups.values()]
    .filter((g) => g.rows.length > 1 && g.rows.some((r) => r.status === "draft"))
    .filter((g) => !after || byKey(g.cityId, after.c) > 0 || (g.cityId === after.c && byKey(g.key, after.k) > 0))
    .sort((a, b) => byKey(a.cityId, b.cityId) || byKey(a.key, b.key));

  const page = candidates.slice(0, input.limit);
  const last = candidates.length > input.limit ? page.at(-1) : undefined;
  const items = page.map((g): DuplicateGroup => {
    const members = [...g.rows].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || byKey(a.sortName, b.sortName) || byKey(a.id, b.id));
    return {
      key: g.key,
      city: { id: g.cityId, name: members[0]!.cityName },
      sameDistrict: sameDistrict(members.map((m) => m.dedupeKey)),
      sites: members.map((m) => ({
        id: m.id,
        name: m.name,
        district: m.district,
        status: m.status,
        coordinates: m.lng === null || m.lat === null ? null : [m.lng, m.lat],
        locationSource: m.locationSource,
      })),
    };
  });
  return { items, nextCursor: last ? encodeCursor({ c: last.cityId, k: last.key }) : null };
}

/** True when two keys share a known district: the part of `siteDedupeKey` after the last `|`. */
function sameDistrict(dedupeKeys: string[]): boolean {
  const districts = dedupeKeys.map((k) => k.slice(k.lastIndexOf("|") + 1)).filter(Boolean);
  return new Set(districts).size < districts.length;
}
