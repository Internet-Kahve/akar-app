import { createSeed, routes as demoRoutes } from "@akar/api-client";
import { validateSite, type HeritageRoute, type HeritageSite, type SitePhoto, type Trust } from "@akar/domain";
import { eq, sql } from "drizzle-orm";
import { siteDedupeKey, siteSearchText, siteSortName, slugify } from "../modules/catalog/service.ts";
import type { Tx } from "../platform/idempotency.ts";
import { createDb, type Db } from "./client.ts";
import {
  catalogRoutes,
  cities,
  media,
  regions,
  routeStops,
  siteMedia,
  siteSources,
  sites,
  sources,
  storyBlocks,
} from "./schema/index.ts";

const TRUST_RANK: Record<Trust, number> = { verified: 0, inferred: 1, representative: 2 };

/** A site is only as trustworthy as its weakest story block; no story means representative. */
const weakestTrust = (site: HeritageSite): Trust =>
  site.stories.reduce<Trust>((w, b) => (TRUST_RANK[b.trust] > TRUST_RANK[w] ? b.trust : w), site.stories[0]?.trust ?? "representative");

const IMAGE_MIME: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" };

function photoMime(photo: SitePhoto): string {
  const ext = /\.([a-z0-9]+)(?:[?#].*)?$/i.exec(photo.src)?.[1]?.toLowerCase();
  const mime = ext ? IMAGE_MIME[ext] : undefined;
  if (!mime) throw new Error(`Fotoğraf ${photo.id}: MIME türü URL uzantısından çıkarılamadı (${photo.src}).`);
  return mime;
}

/**
 * Upserts domain sites and catalog routes. Idempotent: entities are keyed by their domain ids and
 * ordered children (stories, stops, links) are replaced, so a second run changes nothing.
 * Existing `created_at`/`updated_at` are left alone; this is a content loader, not an editor.
 */
export async function loadCatalog(db: Db | Tx, input: { sites: HeritageSite[]; routes: HeritageRoute[] }): Promise<void> {
  for (const site of input.sites) validateSite(site);

  await db.transaction(async (tx) => {
    for (const site of input.sites) {
      const cityId = slugify(site.city);
      const regionId = `${cityId}-${slugify(site.district)}`;
      await tx.insert(cities).values({ id: cityId, name: site.city }).onConflictDoUpdate({ target: cities.id, set: { name: site.city } });
      await tx
        .insert(regions)
        .values({ id: regionId, cityId, name: site.district })
        .onConflictDoUpdate({ target: regions.id, set: { cityId, name: site.district } });

      for (const s of site.sources ?? []) {
        const { id, ...row } = s;
        await tx.insert(sources).values({ id, ...row }).onConflictDoUpdate({ target: sources.id, set: row });
      }

      const mediaRows = [
        ...(site.photos ?? []).map((p) => ({
          id: p.id,
          kind: "photo" as const,
          mime: photoMime(p),
          url: p.src,
          alt: p.alt,
          title: p.title,
          titleEn: p.titleEn || null,
          description: p.description,
          license: p.license,
          sourceId: p.sourceId || null,
          trust: p.trust,
          bytes: null,
          parts: [] as string[],
        })),
        ...(site.model
          ? [
              {
                id: `${site.id}-model`,
                kind: "model" as const,
                mime: "model/gltf-binary",
                url: site.model.src,
                alt: "",
                title: site.model.name,
                titleEn: null,
                description: "",
                license: "",
                sourceId: null,
                trust: site.model.trust,
                bytes: site.model.bytes,
                parts: site.model.parts,
              },
            ]
          : []),
      ];
      for (const m of mediaRows) {
        const { id, ...row } = m;
        await tx.insert(media).values(m).onConflictDoUpdate({ target: media.id, set: row });
      }

      const row = {
        cityId,
        regionId,
        name: site.name,
        nameEn: site.nameEn ?? null,
        typeId: site.kind,
        year: site.year,
        architect: site.architect,
        patron: site.patron ?? null,
        era: site.era ?? null,
        address: site.address ?? null,
        role: site.role ?? null,
        description: site.description,
        descriptionEn: site.descriptionEn ?? null,
        minutes: site.minutes,
        tier: site.tier,
        trust: weakestTrust(site),
        sourceSummary: site.source,
        status: site.status,
        editorVersion: site.editorVersion ?? null,
        coverMediaId: site.coverPhotoId ?? null,
        location: site.coordinates,
        locationSource: "seed",
        dedupeKey: siteDedupeKey(site.name, site.district),
        searchText: siteSearchText(site),
        sortName: siteSortName(site.name),
      };
      await tx.insert(sites).values({ id: site.id, ...row }).onConflictDoUpdate({ target: sites.id, set: row });

      await tx.delete(siteSources).where(eq(siteSources.siteId, site.id));
      await tx.delete(siteMedia).where(eq(siteMedia.siteId, site.id));
      await tx.delete(storyBlocks).where(eq(storyBlocks.siteId, site.id));
      if (site.sources?.length) {
        await tx.insert(siteSources).values(site.sources.map((s, position) => ({ siteId: site.id, sourceId: s.id, position })));
      }
      if (mediaRows.length) {
        await tx.insert(siteMedia).values(mediaRows.map((m, position) => ({ siteId: site.id, mediaId: m.id, position })));
      }
      if (site.stories.length) {
        await tx.insert(storyBlocks).values(
          site.stories.map((b, position) => ({
            siteId: site.id,
            id: b.id,
            position,
            title: b.title,
            text: b.text,
            textEn: b.textEn ?? null,
            simple: b.simple,
            trust: b.trust,
            photoId: b.photoId ?? null,
            sourceId: b.sourceId ?? null,
            showCard: b.showCard ?? null,
            highlights: b.highlights ?? [],
          })),
        );
      }
    }

    // Self-references need every site to exist first.
    for (const site of input.sites) {
      await tx.update(sites).set({ relatedSiteId: site.relatedSiteId ?? null }).where(eq(sites.id, site.id));
    }

    for (const route of input.routes) {
      const [first] = await tx.select({ cityId: sites.cityId }).from(sites).where(eq(sites.id, route.siteIds[0] ?? ""));
      if (!first) throw new Error(`Rota ${route.id}: ilk durak eseri bulunamadı.`);
      // Domain minutes/distance are ignored: the API computes both from the stop chain.
      const row = {
        cityId: first.cityId,
        name: route.name,
        nameEn: route.nameEn ?? null,
        description: route.description,
        theme: route.theme,
        // Domain: a catalog route without an explicit status is visible in discovery.
        status: route.status ?? "published",
      };
      await tx.insert(catalogRoutes).values({ id: route.id, ...row }).onConflictDoUpdate({ target: catalogRoutes.id, set: row });
      await tx.delete(routeStops).where(eq(routeStops.routeId, route.id));
      await tx.insert(routeStops).values(route.siteIds.map((siteId, position) => ({ routeId: route.id, position, siteId })));
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const { db, pool } = createDb(url);
  try {
    const { sites: demoSites } = createSeed();
    await loadCatalog(db, { sites: demoSites, routes: demoRoutes });
    const [counts] = await db.execute<{ sites: number; routes: number }>(
      sql`select (select count(*)::int from ${sites}) as sites, (select count(*)::int from ${catalogRoutes}) as routes`,
    ).then((r) => r.rows);
    console.log(`seeded: ${counts?.sites} sites, ${counts?.routes} routes`);
  } finally {
    await pool.end();
  }
}
