import type { SiteSource } from "@akar/domain";
import { eq, sql } from "drizzle-orm";
import type { Db } from "../../db/client.ts";
import { cities, regions, siteSources, sites, siteTypes, sources } from "../../db/schema/index.ts";
import { siteSearchText, siteSortName, slugify } from "./service.ts";

/** Minimal Tier 1 draft created by the importer; editors complete it in the site wizard. */
export type DraftSite = {
  id: string;
  name: string;
  district: string | null;
  typeId: string | null;
  role: "akar" | "hayrat" | null;
  address: string | null;
  location: [number, number] | null;
  locationSource: string | null;
  dedupeKey: string;
  importMeta: Record<string, unknown>;
  /** Bibliographic locator inside the shared source, e.g. "s. 42". */
  locator: string | null;
  sourceSummary: string;
  sourceId: string;
};

export type SiteTypeAliases = { id: string; aliases: string[] };

export async function listSiteTypeAliases(db: Db): Promise<SiteTypeAliases[]> {
  return db.select({ id: siteTypes.id, aliases: siteTypes.aliases }).from(siteTypes).orderBy(siteTypes.position);
}

export type StoredSiteKey = { id: string; key: string; name: string; published: boolean };

/** Every site of a city (drafts included) with its dedupe key and display name. */
export async function existingSiteKeys(db: Db, cityId: string): Promise<StoredSiteKey[]> {
  const rows = await db
    .select({ id: sites.id, key: sites.dedupeKey, name: sites.name, status: sites.status })
    .from(sites)
    .where(eq(sites.cityId, cityId));
  return rows.map(({ status, ...r }) => ({ ...r, published: status === "published" }));
}

/**
 * Inserts drafts that are not yet present (by id or dedupe key) in one transaction.
 * Imports for the same city are serialized with an advisory lock so concurrent commits
 * cannot both pass the duplicate check. Returns the ids actually inserted.
 */
export async function insertDraftSites(
  db: Db,
  input: { city: { id: string; name: string }; sources: (SiteSource & { id: string })[]; drafts: DraftSite[] },
): Promise<string[]> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`ingest:${input.city.id}`}))`);
    await tx.insert(cities).values(input.city).onConflictDoNothing();
    for (const s of input.sources) await tx.insert(sources).values(s).onConflictDoNothing();

    const existing = await tx.select({ id: sites.id, key: sites.dedupeKey }).from(sites).where(eq(sites.cityId, input.city.id));
    const takenIds = new Set(existing.map((r) => r.id));
    const takenKeys = new Set(existing.map((r) => r.key));
    const inserted: string[] = [];

    for (const d of input.drafts) {
      if (takenIds.has(d.id) || takenKeys.has(d.dedupeKey)) continue;
      const regionId = d.district ? `${input.city.id}-${slugify(d.district)}` : null;
      if (regionId && d.district) {
        await tx.insert(regions).values({ id: regionId, cityId: input.city.id, name: d.district }).onConflictDoNothing();
      }
      await tx.insert(sites).values({
        id: d.id,
        cityId: input.city.id,
        regionId,
        name: d.name,
        typeId: d.typeId,
        role: d.role,
        address: d.address,
        tier: "Tier 1",
        // Machine-extracted from the inventory and geocoded: never shown as verified fact.
        trust: "inferred",
        status: "draft",
        editorVersion: 2,
        sourceSummary: d.sourceSummary,
        location: d.location,
        locationSource: d.locationSource,
        dedupeKey: d.dedupeKey,
        importMeta: d.importMeta,
        searchText: siteSearchText({ name: d.name, city: input.city.name, district: d.district ?? "", architect: "" }),
        sortName: siteSortName(d.name),
      });
      await tx.insert(siteSources).values({ siteId: d.id, sourceId: d.sourceId, position: 0, locator: d.locator });
      takenIds.add(d.id);
      takenKeys.add(d.dedupeKey);
      inserted.push(d.id);
    }
    return inserted;
  });
}
