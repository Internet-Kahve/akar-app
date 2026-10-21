import { normalize } from "@akar/domain";
import { asc, eq, sql } from "drizzle-orm";
import type { Db } from "../../db/client.ts";
import { catalogRoutes, cities, periods, roleCategories, siteTypes, sites } from "../../db/schema/index.ts";
import type { CityDto, LookupsResponse } from "./schemas.ts";
import { published } from "./service.ts";

/**
 * Every city with its published site and route counts; drafts are never counted, and a city without
 * published sites is still listed (counts 0). Alphabetical by `normalize(name)`, the same Turkish-aware
 * key the site sort uses, so the order does not depend on the database collation.
 */
export async function listCities(db: Db): Promise<CityDto[]> {
  const [cityRows, siteCounts, routeCounts] = await Promise.all([
    db.select({ id: cities.id, name: cities.name }).from(cities),
    db.select({ cityId: sites.cityId, n: sql<number>`count(*)::int` }).from(sites).where(published).groupBy(sites.cityId),
    db
      .select({ cityId: catalogRoutes.cityId, n: sql<number>`count(*)::int` })
      .from(catalogRoutes)
      .where(eq(catalogRoutes.status, "published"))
      .groupBy(catalogRoutes.cityId),
  ]);
  const siteCountOf = new Map(siteCounts.map((r) => [r.cityId, r.n]));
  const routeCountOf = new Map(routeCounts.map((r) => [r.cityId, r.n]));

  return cityRows
    .map((c) => ({ c, key: normalize(c.name) }))
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : a.c.id < b.c.id ? -1 : 1))
    .map(({ c }) => ({ ...c, siteCount: siteCountOf.get(c.id) ?? 0, routeCount: routeCountOf.get(c.id) ?? 0 }));
}

/** Labels behind the ids clients filter by (`kind`, `category`, `period`), each list in its `position` order. */
export async function getLookups(db: Db): Promise<LookupsResponse> {
  const [types, categories, periodRows] = await Promise.all([
    db
      .select({ id: siteTypes.id, name: siteTypes.name, nameEn: siteTypes.nameEn, categoryId: siteTypes.categoryId })
      .from(siteTypes)
      .orderBy(asc(siteTypes.position), asc(siteTypes.id)),
    db
      .select({ id: roleCategories.id, name: roleCategories.name, nameEn: roleCategories.nameEn, waqfRole: roleCategories.waqfRole })
      .from(roleCategories)
      .orderBy(asc(roleCategories.position), asc(roleCategories.id)),
    db
      .select({ id: periods.id, name: periods.name, nameEn: periods.nameEn, startYear: periods.startYear, endYear: periods.endYear })
      .from(periods)
      .orderBy(asc(periods.position), asc(periods.id)),
  ]);
  return { siteTypes: types, roleCategories: categories, periods: periodRows };
}
