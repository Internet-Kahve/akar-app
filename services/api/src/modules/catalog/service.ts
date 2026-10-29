import { normalize, type HeritageSite } from "@akar/domain";
import { and, asc, eq, getTableColumns, inArray, isNotNull, sql, type SQL } from "drizzle-orm";
import type { Db } from "../../db/client.ts";
import {
  cards,
  cities,
  historyImages,
  media,
  regions,
  siteAboutChapters,
  siteMapPlacements,
  siteMedia,
  sitePartCardPhotos,
  sitePartCards,
  siteSectionPhotos,
  siteSections,
  siteSources,
  sites,
  siteTypes,
  sources,
  storyBlocks,
} from "../../db/schema/index.ts";
import { AppError } from "../../errors.ts";
import type { Tx } from "../../platform/idempotency.ts";
import { decodeCursor, encodeCursor } from "../../platform/pagination.ts";
import { badgeDto, loadBadges, loadTasks, taskDto } from "./tasks.ts";
import type { ChapterDto, ContentFlag, MapPlacementDto, SectionPhotoDto, SiteDetail, SiteSummary } from "./schemas.ts";

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

/** A stored map placement; `lng`/`lat` are null while the model stands on the site's own location. */
export type PlacementRow = Omit<typeof siteMapPlacements.$inferSelect, "location"> & { lng: number | null; lat: number | null };

/** The placements of the given sites, one query; sites without one are left out. */
export async function loadPlacements(q: Db | Tx, siteIds: string[]): Promise<Map<string, PlacementRow>> {
  if (!siteIds.length) return new Map();
  const { location, ...columns } = getTableColumns(siteMapPlacements);
  const rows = await q
    .select({ ...columns, lng: sql<number | null>`ST_X(${location})`, lat: sql<number | null>`ST_Y(${location})` })
    .from(siteMapPlacements)
    .where(inArray(siteMapPlacements.siteId, siteIds));
  return new Map(rows.map((r) => [r.siteId, r]));
}

/** A part card row with its photo ids in strip order. */
export type PartCardRow = typeof sitePartCards.$inferSelect & { photoIds: string[] };

/** The part cards of the given sites with their photo ids, ordered by (site, position). Sequential: safe on a transaction. */
export async function loadPartCards(q: Db | Tx, siteIds: string[]): Promise<PartCardRow[]> {
  if (!siteIds.length) return [];
  const cardRows = await q
    .select()
    .from(sitePartCards)
    .where(inArray(sitePartCards.siteId, siteIds))
    .orderBy(asc(sitePartCards.siteId), asc(sitePartCards.position));
  if (!cardRows.length) return [];
  const photoRows = await q
    .select({ cardId: sitePartCardPhotos.cardId, mediaId: sitePartCardPhotos.mediaId })
    .from(sitePartCardPhotos)
    .where(inArray(sitePartCardPhotos.cardId, cardRows.map((c) => c.id)))
    .orderBy(asc(sitePartCardPhotos.cardId), asc(sitePartCardPhotos.position));
  const photosOf = new Map<string, string[]>();
  for (const p of photoRows) photosOf.set(p.cardId, [...(photosOf.get(p.cardId) ?? []), p.mediaId]);
  return cardRows.map((c) => ({ ...c, photoIds: photosOf.get(c.id) ?? [] }));
}

/** An "Eser hakkında" chapter row. */
export type ChapterRow = typeof siteAboutChapters.$inferSelect;
/** A book photograph placed after a paragraph; `aspect` comes back from `numeric` as a number. */
export type SectionPhotoRow = typeof siteSectionPhotos.$inferSelect;

/** The chapters of the given sites, ordered by (site, position). */
export function loadChapters(q: Db | Tx, siteIds: string[]): Promise<ChapterRow[]> {
  if (!siteIds.length) return Promise.resolve([]);
  return q.select().from(siteAboutChapters).where(inArray(siteAboutChapters.siteId, siteIds)).orderBy(asc(siteAboutChapters.siteId), asc(siteAboutChapters.position));
}

/** The book photographs of the given sites' paragraphs, ordered by (site, paragraph, position). */
export function loadSectionPhotos(q: Db | Tx, siteIds: string[]): Promise<SectionPhotoRow[]> {
  if (!siteIds.length) return Promise.resolve([]);
  return q
    .select()
    .from(siteSectionPhotos)
    .where(inArray(siteSectionPhotos.siteId, siteIds))
    .orderBy(asc(siteSectionPhotos.siteId), asc(siteSectionPhotos.sectionId), asc(siteSectionPhotos.position));
}

export function chapterDto(c: ChapterRow): ChapterDto {
  const r = c.reading;
  return {
    id: c.id,
    title: c.title,
    kind: c.kind,
    summary: r.summary,
    figures: r.figures,
    quotes: r.quotes,
    timeline: r.timeline,
    terms: r.terms,
    camera: r.camera,
    interior: r.interior,
    focusParts: r.focusParts,
  };
}

/** The photographs of every paragraph of one site, by section id. */
export function sectionPhotosBySection(rows: SectionPhotoRow[]): Map<string, SectionPhotoDto[]> {
  const by = new Map<string, SectionPhotoDto[]>();
  for (const p of rows) by.set(p.sectionId, [...(by.get(p.sectionId) ?? []), { mediaId: p.mediaId, aspect: p.aspect, alt: p.alt }]);
  return by;
}

/** The placement as clients get it: the model's own point, or else the site's location `at` (null for a draft without one). */
export function resolvePlacement<T extends number | null>(
  row: PlacementRow,
  at: { lng: T; lat: T },
): Omit<MapPlacementDto, "lng" | "lat"> & { lng: number | T; lat: number | T } {
  return {
    lng: row.lng === null ? at.lng : row.lng,
    lat: row.lat === null ? at.lat : row.lat,
    headingDeg: row.headingDeg,
    scale: row.scale,
    altitudeM: row.altitudeM,
    anchorNode: row.anchorNode,
    hiddenPoints: row.hiddenPoints,
    keptPoints: row.keptPoints,
  };
}

/** What a visitor's map draws: nothing unless the site has a model and the editor left the placement visible. */
export function publicPlacement(row: PlacementRow | undefined, at: { lng: number; lat: number }, hasModel: boolean): MapPlacementDto | null {
  if (!row || !row.visible || !hasModel) return null;
  return resolvePlacement<number>(row, at);
}

/** Rows grouped by site id; queries are ordered by (site, position), so every group keeps its order. */
function bySite<T extends { siteId: string }>(rows: T[]): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const r of rows) {
    const group = out.get(r.siteId);
    if (group) group.push(r);
    else out.set(r.siteId, [r]);
  }
  return out;
}

/**
 * Everything a client needs to render published sites, one detail per id in `ids` order; drafts and
 * unknown ids are left out. Per site, `media` and `sources` are the union of what the site links and
 * what its content references, so no id in the payload needs a second request to resolve. Two query
 * rounds however many sites, none per site or row.
 */
export async function getSiteDetails(db: Db, ids: string[]): Promise<SiteDetail[]> {
  const siteIds = distinct(ids);
  if (!siteIds.length) return [];
  const [rows, extras, storyRows, sectionRows, cardRows, historyRows, partCardRows, chapterRows, sectionPhotoRows, taskRows, badgeRows, linkedMedia, linkedSources, placements] = await Promise.all([
    summaryQuery(db).where(and(published, inArray(sites.id, siteIds))),
    db
      .select({
        id: sites.id,
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
        aboutCoverMediaId: sites.aboutCoverMediaId,
        openingCamera: sites.openingCamera,
        updatedAt: sites.updatedAt,
      })
      .from(sites)
      .where(inArray(sites.id, siteIds)),
    db.select().from(storyBlocks).where(inArray(storyBlocks.siteId, siteIds)).orderBy(asc(storyBlocks.siteId), asc(storyBlocks.position)),
    db.select().from(siteSections).where(inArray(siteSections.siteId, siteIds)).orderBy(asc(siteSections.siteId), asc(siteSections.position)),
    db
      .select()
      .from(cards)
      .where(
        inArray(
          cards.id,
          db
            .select({ id: storyBlocks.cardId })
            .from(storyBlocks)
            .where(and(inArray(storyBlocks.siteId, siteIds), isNotNull(storyBlocks.cardId))),
        ),
      ),
    db.select().from(historyImages).where(inArray(historyImages.siteId, siteIds)).orderBy(asc(historyImages.siteId), asc(historyImages.position)),
    loadPartCards(db, siteIds),
    loadChapters(db, siteIds),
    loadSectionPhotos(db, siteIds),
    loadTasks(db, siteIds),
    loadBadges(db, siteIds),
    db
      .select({ siteId: siteMedia.siteId, id: siteMedia.mediaId })
      .from(siteMedia)
      .where(inArray(siteMedia.siteId, siteIds))
      .orderBy(asc(siteMedia.siteId), asc(siteMedia.position)),
    db
      .select({ siteId: siteSources.siteId, id: siteSources.sourceId })
      .from(siteSources)
      .where(inArray(siteSources.siteId, siteIds))
      .orderBy(asc(siteSources.siteId), asc(siteSources.position)),
    loadPlacements(db, siteIds),
  ]);

  const rowById = new Map(rows.map((r) => [r.id, r]));
  const extraById = new Map(extras.map((e) => [e.id, e]));
  const cardById = new Map(cardRows.map((c) => [c.id, c]));
  const [storiesOf, sectionsOf, historyOf, partCardsOf, chaptersOf, sectionPhotosOf, tasksOf, badgesOf, mediaLinksOf, sourceLinksOf] = [
    bySite(storyRows),
    bySite(sectionRows),
    bySite(historyRows),
    bySite(partCardRows),
    bySite(chapterRows),
    bySite(sectionPhotoRows),
    bySite(taskRows),
    bySite(badgeRows),
    bySite(linkedMedia),
    bySite(linkedSources),
  ];

  const parts = siteIds.flatMap((id) => {
    const row = rowById.get(id);
    const extra = extraById.get(id);
    if (!row || !extra) return [];
    const stories = storiesOf.get(id) ?? [];
    const sections = sectionsOf.get(id) ?? [];
    const history = historyOf.get(id) ?? [];
    const partCards = partCardsOf.get(id) ?? [];
    const chapters = chaptersOf.get(id) ?? [];
    const sectionPhotos = sectionPhotosOf.get(id) ?? [];
    const tasks = tasksOf.get(id) ?? [];
    const badges = badgesOf.get(id) ?? [];
    // Cards in the order the story first uses them (several sentences may share one card).
    const siteCards = distinct(stories.map((b) => b.cardId)).flatMap((cardId) => {
      const card = cardById.get(cardId);
      return card ? [card] : [];
    });
    const mediaIds = distinct([
      ...(mediaLinksOf.get(id) ?? []).map((m) => m.id),
      extra.coverMediaId,
      extra.aboutCoverMediaId,
      ...stories.flatMap((b) => [b.photoId, b.audioMediaId, b.audioEnMediaId]),
      ...siteCards.map((c) => c.mediaId),
      ...history.flatMap((h) => [h.mediaId, h.presentMediaId]),
      ...partCards.flatMap((c) => c.photoIds),
      ...sectionPhotos.map((p) => p.mediaId),
      ...tasks.map((t) => t.mediaId),
    ]);
    const contentSourceIds = distinct([
      ...(sourceLinksOf.get(id) ?? []).map((s) => s.id),
      ...stories.map((b) => b.sourceId),
      ...sections.map((s) => s.sourceId),
      ...siteCards.map((c) => c.sourceId),
      ...history.map((h) => h.sourceId),
      ...partCards.map((c) => c.sourceId),
    ]);
    return [{ row, extra, stories, sections, history, partCards, chapters, sectionPhotos, tasks, badges, siteCards, mediaIds, contentSourceIds }];
  });

  // Sources of the media come back with the media rows, so both lookups run in one round for all sites.
  const [mediaRows, sourceRows] = await Promise.all([
    mediaWithSources(db, distinct(parts.flatMap((p) => p.mediaIds))),
    sourcesByIds(db, distinct(parts.flatMap((p) => p.contentSourceIds))),
  ]);
  const mediaById = new Map(mediaRows.map(({ m }) => [m.id, m]));
  const sourceById = new Map<string, SourceRow>();
  for (const s of sourceRows) sourceById.set(s.id, s);
  for (const { s } of mediaRows) if (s) sourceById.set(s.id, s);

  return parts.map(({ row, extra, stories, sections, history, partCards, chapters, sectionPhotos, tasks, badges, siteCards, mediaIds, contentSourceIds }) => {
    const photosOf = sectionPhotosBySection(sectionPhotos);
    const siteMediaList = mediaIds.flatMap((mediaId) => {
      const m = mediaById.get(mediaId);
      return m ? [m] : [];
    });
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
      aboutCoverMediaId: extra.aboutCoverMediaId,
      openingCamera: extra.openingCamera,
      updatedAt: extra.updatedAt.toISOString(),
      stories: stories.map((b) => ({
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
        interior: b.interior,
        highlights: b.highlights,
        audioMediaId: b.audioMediaId,
        audioEnMediaId: b.audioEnMediaId,
      })),
      sections: sections.map((s) => ({
        id: s.id,
        kind: s.kind,
        title: s.title,
        body: s.body,
        bodyEn: s.bodyEn,
        trust: s.trust,
        sourceId: s.sourceId,
        chapterId: s.chapterId,
        photos: photosOf.get(s.id) ?? [],
      })),
      chapters: chapters.map(chapterDto),
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
      historyImages: history.map((h) => ({
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
      partCards: partCards.map((c) => ({
        id: c.id,
        parts: c.parts,
        title: c.title,
        body: c.body,
        photoIds: c.photoIds,
        sourceId: c.sourceId,
        trust: c.trust,
      })),
      tasks: tasks.map(taskDto),
      badges: badges.map(badgeDto),
      placement: publicPlacement(
        placements.get(row.id),
        row,
        (mediaLinksOf.get(row.id) ?? []).some((m) => mediaById.get(m.id)?.kind === "model"),
      ),
      photoIds: (mediaLinksOf.get(row.id) ?? []).filter((m) => mediaById.get(m.id)?.kind === "photo").map((m) => m.id),
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
        triangles: m.triangles,
        coverGroups: m.coverGroups,
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
  });
}

/** One published site; drafts and unknown ids are 404 (a draft's existence is not leaked). */
export async function getSiteDetail(db: Db, id: string): Promise<SiteDetail> {
  const [detail] = await getSiteDetails(db, [id]);
  if (!detail) throw new AppError(404, "NOT_FOUND", "Eser bulunamadı.");
  return detail;
}

/** Full details of every published site, a page at a time in name order (same keyset as `listSites`). */
export async function listSiteDetails(
  db: Db,
  page: { cursor?: string | undefined; limit: number },
): Promise<{ items: SiteDetail[]; nextCursor: string | null }> {
  const { items, nextCursor } = await listSites(db, { cursor: page.cursor, limit: page.limit });
  return { items: await getSiteDetails(db, items.map((s) => s.id)), nextCursor };
}
