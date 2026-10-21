import { normalize, type HeritageSite } from "@akar/domain";
import { and, asc, eq, inArray, isNotNull, sql, type SQL } from "drizzle-orm";
import type { Db } from "../../db/client.ts";
import {
  cards,
  cities,
  historyImages,
  media,
  regions,
  siteMedia,
  siteSections,
  siteSources,
  sites,
  siteTypes,
  sources,
  storyBlocks,
} from "../../db/schema/index.ts";
import { AppError } from "../../errors.ts";
import { decodeCursor, encodeCursor } from "../../platform/pagination.ts";
import type { ContentFlag, SiteDetail, SiteSummary } from "./schemas.ts";

/** Single definition of "visible to the public"; every read path goes through it. */
export const published = eq(sites.status, "published");

/** Same haystack as the domain's `filterSites`, normalized once at write time. */
export function siteSearchText(s: Pick<HeritageSite, "name" | "city" | "district" | "architect">): string {
  return normalize(`${s.name} ${s.city} ${s.district} ${s.architect}`);
}

/** Keyset sort key: collation-independent (C) order over (sort_name, id). */
export function siteSortName(name: string): string {
  return normalize(name);
}

/**
 * Historic areas used as "district" by hand-made content, mapped to the administrative district
 * the inventory uses, so both produce the same duplicate key. Keys are normalize()d.
 */
const AREA_DISTRICT: Record<string, string> = {
  "hanlar bolgesi": "osmangazi",
};

/** Duplicate key shared by import and admin create: same normalized name in the same district. */
export function siteDedupeKey(name: string, district: string | null | undefined): string {
  const d = normalize((district ?? "").trim());
  return `${normalize(name.trim()).replace(/\s+/g, " ")}|${AREA_DISTRICT[d] ?? d}`;
}

/** URL-safe id fragment: `Hanlar Bölgesi` → `hanlar-bolgesi`. */
export function slugify(text: string): string {
  return normalize(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type ListSitesInput = {
  query?: string | undefined;
  kind?: SiteSummary["kind"] | undefined;
  category?: string | undefined;
  period?: string | undefined;
  has?: ContentFlag[] | undefined;
  city?: string | undefined;
  bbox?: [number, number, number, number] | undefined;
  /** [lng, lat]: adds `distanceMeters` to every item and enables `sort: "distance"`. */
  near?: [number, number] | undefined;
  sort?: "name" | "distance" | undefined;
  cursor?: string | undefined;
  limit: number;
};

/**
 * "The site has this content" as a correlated EXISTS: one definition feeds both the `has` output
 * columns and the `has=` filter. Inside the model subquery `media` is the inner join, not the
 * cover-image join of the summary query.
 */
const hasContent = {
  model: sql<boolean>`exists (select 1 from ${siteMedia} join ${media} on ${media.id} = ${siteMedia.mediaId} where ${siteMedia.siteId} = ${sites.id} and ${media.kind} = 'model')`,
  audio: sql<boolean>`exists (select 1 from ${storyBlocks} where ${storyBlocks.siteId} = ${sites.id} and (${storyBlocks.audioMediaId} is not null or ${storyBlocks.audioEnMediaId} is not null))`,
  history: sql<boolean>`exists (select 1 from ${historyImages} where ${historyImages.siteId} = ${sites.id})`,
} satisfies Record<ContentFlag, SQL<boolean>>;

/** Geodesic metres from `near` ([lng, lat]) to the site: PostGIS geography on the spheroid. */
const distanceFrom = ([lng, lat]: [number, number]) =>
  sql<number>`ST_Distance(${sites.location}::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography)`;

const noDistance = sql<number | null>`null`;

// NOTE: summaryQuery is a joined select, so Drizzle qualifies every column inside these `sql` fields.
// (A single-table select would strip the table prefix and break the correlated subqueries.)
const summaryColumns = (near: [number, number] | undefined) => ({
  id: sites.id,
  sortName: sites.sortName,
  name: sites.name,
  nameEn: sites.nameEn,
  // Published rows always have a type and a location (CHECK sites_published_complete).
  kind: sql<string>`${sites.typeId}`,
  categoryId: siteTypes.categoryId,
  periodId: sites.periodId,
  cityId: cities.id,
  cityName: cities.name,
  district: regions.name,
  year: sites.year,
  lng: sql<number>`ST_X(${sites.location})`,
  lat: sql<number>`ST_Y(${sites.location})`,
  minutes: sites.minutes,
  tier: sites.tier,
  trust: sites.trust,
  description: sites.description,
  coverId: media.id,
  coverUrl: media.url,
  coverAlt: media.alt,
  sourceCount: sql<number>`(select count(*)::int from ${siteSources} where ${siteSources.siteId} = ${sites.id})`,
  hasModel: hasContent.model,
  hasAudio: hasContent.audio,
  hasHistory: hasContent.history,
  // Aliased so ORDER BY can reuse the computed value instead of evaluating it again.
  distance: near ? distanceFrom(near).as("distance") : noDistance,
});

type SummaryRow = {
  id: string;
  sortName: string;
  name: string;
  nameEn: string | null;
  kind: SiteSummary["kind"];
  categoryId: string;
  periodId: string | null;
  cityId: string;
  cityName: string;
  district: string | null;
  year: string;
  lng: number;
  lat: number;
  minutes: number;
  tier: SiteSummary["tier"];
  trust: SiteSummary["trust"];
  description: string;
  coverId: string | null;
  coverUrl: string | null;
  coverAlt: string | null;
  sourceCount: number;
  hasModel: boolean;
  hasAudio: boolean;
  hasHistory: boolean;
  distance: number | null;
};

function toSummary(r: SummaryRow): SiteSummary {
  return {
    id: r.id,
    name: r.name,
    nameEn: r.nameEn,
    kind: r.kind,
    categoryId: r.categoryId,
    periodId: r.periodId,
    city: { id: r.cityId, name: r.cityName },
    district: r.district,
    year: r.year,
    coordinates: [r.lng, r.lat],
    minutes: r.minutes,
    tier: r.tier,
    trust: r.trust,
    description: r.description,
    coverImage: r.coverId ? { id: r.coverId, url: r.coverUrl ?? "", alt: r.coverAlt ?? "" } : null,
    sourceCount: r.sourceCount,
    has: { model: r.hasModel, audio: r.hasAudio, history: r.hasHistory },
    distanceMeters: r.distance === null ? null : Math.round(r.distance),
  };
}

const summaryQuery = (db: Db, near?: [number, number]) =>
  db
    .select(summaryColumns(near))
    .from(sites)
    .innerJoin(cities, eq(cities.id, sites.cityId))
    .innerJoin(siteTypes, eq(siteTypes.id, sites.typeId))
    .leftJoin(regions, eq(regions.id, sites.regionId))
    .leftJoin(media, eq(media.id, sites.coverMediaId));

/**
 * A total order over (sort key, id) and how to resume after a row, so pages never repeat or skip
 * a row. Cursors carry the sort key under a mode-specific field (`n` name, `d` distance): a cursor
 * from the other mode lacks the field and is rejected as INVALID_CURSOR.
 */
type Keyset = {
  orderBy: SQL[];
  /** Predicate for the rows strictly after `cursor`. */
  after: (cursor: string) => SQL;
  cursorOf: (row: SummaryRow) => string;
};

const byName: Keyset = {
  orderBy: [sql`${sites.sortName} COLLATE "C"`, sql`${sites.id} COLLATE "C"`],
  after(cursor) {
    const c = decodeCursor(cursor, ["n", "i"]);
    return sql`(${sites.sortName} COLLATE "C", ${sites.id} COLLATE "C") > (${c.n}, ${c.i})`;
  },
  cursorOf: (r) => encodeCursor({ n: r.sortName, i: r.id }),
};

function byDistance(near: [number, number] | undefined): Keyset {
  if (!near) {
    throw new AppError(400, "VALIDATION_FAILED", "Girdi doğrulanamadı.", {
      near: ["sort=distance için near=boylam,enlem gerekli."],
    });
  }
  return {
    // "distance" is the aliased output column of summaryColumns.
    orderBy: [sql`"distance"`, sql`${sites.id} COLLATE "C"`],
    after(cursor) {
      const c = decodeCursor(cursor, ["d", "i"]);
      const d = Number(c.d);
      if (c.d.trim() === "" || !Number.isFinite(d)) {
        throw new AppError(400, "INVALID_CURSOR", "İmleç geçersiz.", { cursor: ["Geçersiz imleç."] });
      }
      return sql`(${distanceFrom(near)}, ${sites.id} COLLATE "C") > (${d}::float8, ${c.i})`;
    },
    // Full-precision text of the double (PostgreSQL >= 12 prints the shortest round-trip form and
    // parses it back to the same value), so rows tied at this distance are neither repeated nor skipped.
    cursorOf: (r) => encodeCursor({ d: String(r.distance), i: r.id }),
  };
}

export async function listSites(db: Db, input: ListSitesInput): Promise<{ items: SiteSummary[]; nextCursor: string | null }> {
  const keyset = input.sort === "distance" ? byDistance(input.near) : byName;

  const where: SQL[] = [published];
  const term = input.query ? normalize(input.query.trim()) : "";
  if (term) where.push(sql`${sites.searchText} LIKE ${`%${term.replace(/[\\%_]/g, "\\$&")}%`}`);
  if (input.kind) where.push(eq(sites.typeId, input.kind));
  if (input.category) where.push(eq(siteTypes.categoryId, input.category));
  if (input.period) where.push(eq(sites.periodId, input.period));
  for (const flag of input.has ?? []) where.push(hasContent[flag]);
  if (input.city) where.push(eq(sites.cityId, normalize(input.city)));
  if (input.bbox) {
    const [minLng, minLat, maxLng, maxLat] = input.bbox;
    where.push(sql`${sites.location} && ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)`);
  }
  if (input.cursor) where.push(keyset.after(input.cursor));

  const rows = await summaryQuery(db, input.near)
    .where(and(...where))
    .orderBy(...keyset.orderBy)
    .limit(input.limit + 1);

  const page = rows.slice(0, input.limit);
  const last = rows.length > input.limit ? page.at(-1) : undefined;
  return {
    items: page.map(toSummary),
    nextCursor: last ? keyset.cursorOf(last) : null,
  };
}

/** Published summaries keyed by id; drafts and unknown ids are absent. */
export async function getPublishedSummaries(db: Db, ids: string[]): Promise<Map<string, SiteSummary>> {
  if (!ids.length) return new Map();
  const rows = await summaryQuery(db).where(and(published, inArray(sites.id, ids)));
  return new Map(rows.map((r) => [r.id, toSummary(r)]));
}

type MediaRow = typeof media.$inferSelect;
type SourceRow = typeof sources.$inferSelect;

/** Ids in first-seen order, without nulls and repeats. */
const distinct = (ids: (string | null)[]): string[] => [...new Set(ids.filter((id): id is string => id !== null))];

/** Media rows with their source for `ids`; no query for an empty list. */
async function mediaWithSources(db: Db, ids: string[]): Promise<{ m: MediaRow; s: SourceRow | null }[]> {
  if (!ids.length) return [];
  return db.select({ m: media, s: sources }).from(media).leftJoin(sources, eq(sources.id, media.sourceId)).where(inArray(media.id, ids));
}

async function sourcesByIds(db: Db, ids: string[]): Promise<SourceRow[]> {
  if (!ids.length) return [];
  return db.select().from(sources).where(inArray(sources.id, ids));
}

/**
 * Everything a client needs to render one published site in a single response: `media` and
 * `sources` are the union of what the site links and what its content references, so no id in the
 * payload needs a second request to resolve. Two query rounds, none per row.
 */
export async function getSiteDetail(db: Db, id: string): Promise<SiteDetail> {
  const [[row], [extra], storyRows, sectionRows, cardRows, historyRows, linkedMedia, linkedSources] = await Promise.all([
    summaryQuery(db)
      .where(and(published, eq(sites.id, id)))
      .limit(1),
    db
      .select({
        descriptionEn: sites.descriptionEn,
        architect: sites.architect,
        patron: sites.patron,
        era: sites.era,
        address: sites.address,
        role: sites.role,
        relatedSiteId: sites.relatedSiteId,
        sourceSummary: sites.sourceSummary,
        editorVersion: sites.editorVersion,
        coverMediaId: sites.coverMediaId,
        openingCamera: sites.openingCamera,
        updatedAt: sites.updatedAt,
      })
      .from(sites)
      .where(eq(sites.id, id)),
    db.select().from(storyBlocks).where(eq(storyBlocks.siteId, id)).orderBy(asc(storyBlocks.position)),
    db.select().from(siteSections).where(eq(siteSections.siteId, id)).orderBy(asc(siteSections.position)),
    db
      .select()
      .from(cards)
      .where(
        inArray(
          cards.id,
          db
            .select({ id: storyBlocks.cardId })
            .from(storyBlocks)
            .where(and(eq(storyBlocks.siteId, id), isNotNull(storyBlocks.cardId))),
        ),
      ),
    db.select().from(historyImages).where(eq(historyImages.siteId, id)).orderBy(asc(historyImages.position)),
    db.select({ id: siteMedia.mediaId }).from(siteMedia).where(eq(siteMedia.siteId, id)).orderBy(asc(siteMedia.position)),
    db.select({ id: siteSources.sourceId }).from(siteSources).where(eq(siteSources.siteId, id)).orderBy(asc(siteSources.position)),
  ]);
  if (!row || !extra) throw new AppError(404, "NOT_FOUND", "Eser bulunamadı.");

  // Cards in the order the story first uses them (several sentences may share one card).
  const cardById = new Map(cardRows.map((c) => [c.id, c]));
  const siteCards = distinct(storyRows.map((b) => b.cardId)).flatMap((cardId) => {
    const card = cardById.get(cardId);
    return card ? [card] : [];
  });

  const mediaIds = distinct([
    ...linkedMedia.map((m) => m.id),
    extra.coverMediaId,
    ...storyRows.flatMap((b) => [b.photoId, b.audioMediaId, b.audioEnMediaId]),
    ...siteCards.map((c) => c.mediaId),
    ...historyRows.flatMap((h) => [h.mediaId, h.presentMediaId]),
  ]);
  // Sources of the media come back with the media rows, so both lookups run in one round.
  const contentSourceIds = distinct([
    ...linkedSources.map((s) => s.id),
    ...storyRows.map((b) => b.sourceId),
    ...sectionRows.map((s) => s.sourceId),
    ...siteCards.map((c) => c.sourceId),
    ...historyRows.map((h) => h.sourceId),
  ]);
  const [mediaRows, sourceRows] = await Promise.all([mediaWithSources(db, mediaIds), sourcesByIds(db, contentSourceIds)]);

  const mediaById = new Map(mediaRows.map(({ m }) => [m.id, m]));
  const siteMediaList = mediaIds.flatMap((mediaId) => {
    const m = mediaById.get(mediaId);
    return m ? [m] : [];
  });
  const sourceById = new Map<string, SourceRow>();
  for (const s of sourceRows) sourceById.set(s.id, s);
  for (const { s } of mediaRows) if (s) sourceById.set(s.id, s);
  const siteSourceList = distinct([...contentSourceIds, ...siteMediaList.map((m) => m.sourceId)]).flatMap((sourceId) => {
    const s = sourceById.get(sourceId);
    return s ? [s] : [];
  });

  return {
    ...toSummary(row),
    descriptionEn: extra.descriptionEn,
    architect: extra.architect,
    patron: extra.patron,
    era: extra.era,
    address: extra.address,
    role: extra.role,
    relatedSiteId: extra.relatedSiteId,
    sourceSummary: extra.sourceSummary,
    editorVersion: extra.editorVersion === 2 ? 2 : null,
    coverMediaId: extra.coverMediaId,
    openingCamera: extra.openingCamera,
    updatedAt: extra.updatedAt.toISOString(),
    stories: storyRows.map((b) => ({
      id: b.id,
      title: b.title,
      text: b.text,
      textEn: b.textEn,
      simple: b.simple,
      trust: b.trust,
      photoId: b.photoId,
      sourceId: b.sourceId,
      showCard: b.showCard,
      cardId: b.cardId,
      camera: b.camera,
      highlights: b.highlights,
      audioMediaId: b.audioMediaId,
      audioEnMediaId: b.audioEnMediaId,
    })),
    sections: sectionRows.map((s) => ({
      id: s.id,
      kind: s.kind,
      title: s.title,
      body: s.body,
      bodyEn: s.bodyEn,
      trust: s.trust,
      sourceId: s.sourceId,
    })),
    cards: siteCards.map((c) => ({
      id: c.id,
      kind: c.kind,
      title: c.title,
      titleEn: c.titleEn,
      body: c.body,
      bodyEn: c.bodyEn,
      mediaId: c.mediaId,
      sourceId: c.sourceId,
      trust: c.trust,
    })),
    historyImages: historyRows.map((h) => ({
      id: h.id,
      mediaId: h.mediaId,
      presentMediaId: h.presentMediaId,
      caption: h.caption,
      captionEn: h.captionEn,
      dateLabel: h.dateLabel,
      sourceId: h.sourceId,
      trust: h.trust,
      camera: h.camera,
    })),
    media: siteMediaList.map((m) => ({
      id: m.id,
      kind: m.kind,
      mime: m.mime,
      url: m.url,
      alt: m.alt,
      title: m.title,
      titleEn: m.titleEn,
      description: m.description,
      license: m.license,
      sourceId: m.sourceId,
      trust: m.trust,
      parts: m.parts,
    })),
    sources: siteSourceList.map((s) => ({
      id: s.id,
      title: s.title,
      kind: s.kind,
      author: s.author,
      year: s.year,
      page: s.page,
      url: s.url,
      trust: s.trust,
    })),
  };
}
