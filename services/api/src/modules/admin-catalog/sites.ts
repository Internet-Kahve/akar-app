import {
  normalize,
  publicationIssues,
  type HeritageSite,
  type SiteKind,
  type SitePhoto,
  type SiteSource,
  type StoryBlock,
  type Trust,
} from "@akar/domain";
import { and, asc, desc, eq, inArray, ne, notInArray, or, sql, type SQL } from "drizzle-orm";
import type { PgUpdateSetSource } from "drizzle-orm/pg-core";
import { randomUUID } from "node:crypto";
import type { Db } from "../../db/client.ts";
import {
  cards,
  catalogRoutes,
  cities,
  historyImages,
  media,
  periods,
  regions,
  routeStops,
  siteMapPlacements,
  siteAboutChapters,
  siteMedia,
  siteSectionPhotos,
  siteSections,
  siteSources,
  sites,
  siteTypes,
  sources,
  storyBlocks,
  type CameraPose,
} from "../../db/schema/index.ts";
import { AppError } from "../../errors.ts";
import { recordAudit } from "../../platform/audit.ts";
import type { Tx } from "../../platform/idempotency.ts";
import { decodeCursor, encodeCursor } from "../../platform/pagination.ts";
import {
  chapterDto,
  loadChapters,
  loadPartCards,
  loadSectionPhotos,
  loadPlacements,
  publicPlacement,
  resolvePlacement,
  sectionPhotosBySection,
  siteDedupeKey,
  siteSearchText,
  siteSortName,
  slugify,
  type ChapterRow,
  type PartCardRow,
  type PlacementRow,
  type SectionPhotoRow,
} from "../catalog/service.ts";
import { badgeDto, loadBadges, loadTasks, taskDto, type BadgeRow, type TaskRow } from "../catalog/tasks.ts";
import { CITIES } from "../ingest/cities.ts";
import { APPROXIMATE_SOURCES } from "../ingest/geocode.ts";
import type {
  AdminCardDto,
  AdminCardListInput,
  AdminListSitesInput,
  AdminSiteDetail,
  AdminSiteListItem,
  CameraPoseInput,
  CreateCardInput,
  CreateSiteInput,
  HistoryImagesInput,
  LocationInput,
  MapPlacementInput,
  ModelInput,
  SectionsInput,
  SiteInfoInput,
  SiteMediaInput,
  SiteSourcesInput,
  StoriesInput,
  UpdateCardInput,
} from "./sites-schemas.ts";

// Service of the editor's site wizard (Model · Bilgiler · Fotoğraflar · Hikâye · Yayınla), About
// sections, archive images and shared cards. Every write takes the caller's transaction (see
// `idempotent`), locks the site row so writers of one site are serialized, and records an audit row.

type Q = Tx | Db;
type SiteUpdate = PgUpdateSetSource<typeof sites>;
type MediaRow = typeof media.$inferSelect;
type SourceRow = typeof sources.$inferSelect;
type CardRow = typeof cards.$inferSelect;
type StoryRow = typeof storyBlocks.$inferSelect;
type SectionRow = typeof siteSections.$inferSelect;
type HistoryRow = typeof historyImages.$inferSelect;
type MediaKind = MediaRow["kind"];

export type AuditCtx = { actorId: string; requestId: string | undefined };

/** Wall-clock time of the statement (not of the transaction), so `updated_at` never runs backwards. */
const touched = sql`clock_timestamp()`;

/** Ids in first-seen order, without nulls and repeats. */
const distinct = <T>(items: (T | null | undefined)[]): T[] => [...new Set(items.filter((i): i is T => i !== null && i !== undefined))];

const present = <T>(items: (T | undefined)[]): T[] => items.filter((i): i is T => i !== undefined);

/** Server-made id: `src-koza-hani-3f2a9c1d7b4e`. */
function newId(prefix: string, label = ""): string {
  return [prefix, slugify(label).slice(0, 40), randomUUID().replaceAll("-", "").slice(0, 12)].filter(Boolean).join("-");
}

function firstRow<T>(rows: T[]): T {
  const row = rows[0];
  if (row === undefined) throw new Error("Expected one row.");
  return row;
}

/** Collects per-field messages; `throwIfAny` answers 400 VALIDATION_FAILED with them. */
class FieldErrors {
  private readonly errors: Record<string, string[]> = {};

  add(path: string, message: string): void {
    (this.errors[path] ??= []).push(message);
  }

  throwIfAny(): void {
    if (Object.keys(this.errors).length) throw new AppError(400, "VALIDATION_FAILED", "Girdi doğrulanamadı.", this.errors);
  }
}

export function publishBlocked(issues: string[]): AppError {
  return new AppError(422, "PUBLISH_BLOCKED", "Eser yayınlanamaz: eksikleri tamamla.", { _: issues });
}

/** True for the DB CHECK `sites_published_complete` (type and location required once published). */
export function isPublishedCompleteViolation(err: unknown): boolean {
  let e: unknown = err;
  for (let depth = 0; e && typeof e === "object" && depth < 5; depth++) {
    const { code, constraint, cause } = e as { code?: unknown; constraint?: unknown; cause?: unknown };
    if (code === "23514" && constraint === "sites_published_complete") return true;
    e = cause;
  }
  return false;
}

/**
 * The CHECK is the last line of defence behind the explicit gate: when it fires anyway (a race, a
 * path that was not pre-checked) the answer is the same 422 the gate gives, never a 500.
 */
export function asPublishBlocked(err: unknown): unknown {
  return isPublishedCompleteViolation(err)
    ? publishBlocked(["Yayındaki eserde yapı türü ve konum zorunludur; konum sokak ya da mahalle merkezi olamaz."])
    : err;
}

// ── reading ──────────────────────────────────────────────────────────────────

const siteSelection = {
  id: sites.id,
  sortName: sites.sortName,
  cityId: sites.cityId,
  cityName: cities.name,
  regionId: sites.regionId,
  district: regions.name,
  name: sites.name,
  nameEn: sites.nameEn,
  typeId: sites.typeId,
  categoryId: siteTypes.categoryId,
  periodId: sites.periodId,
  year: sites.year,
  architect: sites.architect,
  patron: sites.patron,
  era: sites.era,
  address: sites.address,
  role: sites.role,
  relatedSiteId: sites.relatedSiteId,
  description: sites.description,
  descriptionEn: sites.descriptionEn,
  minutes: sites.minutes,
  tier: sites.tier,
  trust: sites.trust,
  sourceSummary: sites.sourceSummary,
  status: sites.status,
  editorVersion: sites.editorVersion,
  coverMediaId: sites.coverMediaId,
  aboutCoverMediaId: sites.aboutCoverMediaId,
  openingCamera: sites.openingCamera,
  lng: sql<number | null>`ST_X(${sites.location})`,
  lat: sql<number | null>`ST_Y(${sites.location})`,
  locationSource: sites.locationSource,
  dedupeKey: sites.dedupeKey,
  importMeta: sites.importMeta,
  updatedAt: sites.updatedAt,
};

const selectSites = (q: Q) =>
  q
    .select(siteSelection)
    .from(sites)
    .innerJoin(cities, eq(cities.id, sites.cityId))
    .leftJoin(regions, eq(regions.id, sites.regionId))
    .leftJoin(siteTypes, eq(siteTypes.id, sites.typeId));

type SiteColumns = typeof sites.$inferSelect;

/** A `sites` row with its city, district and type category names and the location as [lng, lat]. */
export type SiteRow = Pick<
  SiteColumns,
  | "id"
  | "sortName"
  | "cityId"
  | "regionId"
  | "name"
  | "nameEn"
  | "typeId"
  | "periodId"
  | "year"
  | "architect"
  | "patron"
  | "era"
  | "address"
  | "role"
  | "relatedSiteId"
  | "description"
  | "descriptionEn"
  | "minutes"
  | "tier"
  | "trust"
  | "sourceSummary"
  | "status"
  | "editorVersion"
  | "coverMediaId"
  | "aboutCoverMediaId"
  | "openingCamera"
  | "locationSource"
  | "dedupeKey"
  | "importMeta"
  | "updatedAt"
> & {
  cityName: string;
  district: string | null;
  categoryId: string | null;
  lng: number | null;
  lat: number | null;
};

/** One site with everything it links; media, sources and cards are lookups shared by a page of sites. */
export type SiteAggregate = {
  site: SiteRow;
  stories: StoryRow[];
  sections: SectionRow[];
  history: HistoryRow[];
  partCards: PartCardRow[];
  chapters: ChapterRow[];
  /** Book photographs of the paragraphs, ordered by (paragraph, position). */
  sectionPhotos: SectionPhotoRow[];
  tasks: TaskRow[];
  badges: BadgeRow[];
  /** `site_media` in display order. */
  mediaIds: string[];
  /** `site_sources` in display order. */
  sourceLinks: { sourceId: string; locator: string | null }[];
  cards: ReadonlyMap<string, CardRow>;
  media: ReadonlyMap<string, MediaRow>;
  sources: ReadonlyMap<string, SourceRow>;
  /** The stored map placement, shown or not. */
  placement: PlacementRow | undefined;
};

function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    const group = groups.get(k);
    if (group) group.push(row);
    else groups.set(k, [row]);
  }
  return groups;
}

/**
 * Drafts included. A fixed number of queries whatever the page size, run one after another: on a
 * transaction the connection is single, and the driver rejects overlapping queries.
 */
async function loadSites(q: Q, ids: string[]): Promise<Map<string, SiteAggregate>> {
  if (!ids.length) return new Map();
  const siteRows = await selectSites(q).where(inArray(sites.id, ids));
  if (!siteRows.length) return new Map();

  const storyRows = await q.select().from(storyBlocks).where(inArray(storyBlocks.siteId, ids)).orderBy(asc(storyBlocks.position));
  const sectionRows = await q.select().from(siteSections).where(inArray(siteSections.siteId, ids)).orderBy(asc(siteSections.position));
  const historyRows = await q.select().from(historyImages).where(inArray(historyImages.siteId, ids)).orderBy(asc(historyImages.position));
  const mediaLinks = await q.select().from(siteMedia).where(inArray(siteMedia.siteId, ids)).orderBy(asc(siteMedia.position));
  const sourceLinks = await q.select().from(siteSources).where(inArray(siteSources.siteId, ids)).orderBy(asc(siteSources.position));

  const partCardRows = await loadPartCards(q, ids);
  const chapterRows = await loadChapters(q, ids);
  const sectionPhotoRows = await loadSectionPhotos(q, ids);
  const taskRows = await loadTasks(q, ids);
  const badgeRows = await loadBadges(q, ids);
  const cardIds = distinct(storyRows.map((b) => b.cardId));
  const cardRows = cardIds.length ? await q.select().from(cards).where(inArray(cards.id, cardIds)) : [];
  const mediaIds = distinct([
    ...mediaLinks.map((l) => l.mediaId),
    ...siteRows.map((s) => s.coverMediaId),
    ...siteRows.map((s) => s.aboutCoverMediaId),
    ...storyRows.flatMap((b) => [b.photoId, b.audioMediaId, b.audioEnMediaId]),
    ...cardRows.map((c) => c.mediaId),
    ...historyRows.flatMap((h) => [h.mediaId, h.presentMediaId]),
    ...partCardRows.flatMap((c) => c.photoIds),
    ...sectionPhotoRows.map((p) => p.mediaId),
    ...taskRows.map((t) => t.mediaId),
  ]);
  const mediaRows = mediaIds.length ? await q.select().from(media).where(inArray(media.id, mediaIds)) : [];
  const sourceIds = distinct([
    ...sourceLinks.map((l) => l.sourceId),
    ...storyRows.map((b) => b.sourceId),
    ...sectionRows.map((s) => s.sourceId),
    ...cardRows.map((c) => c.sourceId),
    ...historyRows.map((h) => h.sourceId),
    ...partCardRows.map((c) => c.sourceId),
    ...mediaRows.map((m) => m.sourceId),
  ]);
  const sourceRows = sourceIds.length ? await q.select().from(sources).where(inArray(sources.id, sourceIds)) : [];
  const placements = await loadPlacements(q, ids);

  const cardById = new Map(cardRows.map((c) => [c.id, c]));
  const mediaById = new Map(mediaRows.map((m) => [m.id, m]));
  const sourceById = new Map(sourceRows.map((s) => [s.id, s]));
  const stories = groupBy(storyRows, (r) => r.siteId);
  const sections = groupBy(sectionRows, (r) => r.siteId);
  const history = groupBy(historyRows, (r) => r.siteId);
  const partCardsOf = groupBy(partCardRows, (r) => r.siteId);
  const chaptersOf = groupBy(chapterRows, (r) => r.siteId);
  const sectionPhotosOf = groupBy(sectionPhotoRows, (r) => r.siteId);
  const tasksOf = groupBy(taskRows, (r) => r.siteId);
  const badgesOf = groupBy(badgeRows, (r) => r.siteId);
  const mediaOf = groupBy(mediaLinks, (r) => r.siteId);
  const sourcesOf = groupBy(sourceLinks, (r) => r.siteId);

  return new Map(
    siteRows.map((site) => [
      site.id,
      {
        site,
        stories: stories.get(site.id) ?? [],
        sections: sections.get(site.id) ?? [],
        history: history.get(site.id) ?? [],
        partCards: partCardsOf.get(site.id) ?? [],
        chapters: chaptersOf.get(site.id) ?? [],
        sectionPhotos: sectionPhotosOf.get(site.id) ?? [],
        tasks: tasksOf.get(site.id) ?? [],
        badges: badgesOf.get(site.id) ?? [],
        mediaIds: (mediaOf.get(site.id) ?? []).map((l) => l.mediaId),
        sourceLinks: (sourcesOf.get(site.id) ?? []).map((l) => ({ sourceId: l.sourceId, locator: l.locator })),
        cards: cardById,
        media: mediaById,
        sources: sourceById,
        placement: placements.get(site.id),
      },
    ]),
  );
}

async function requireAggregate(q: Q, id: string): Promise<SiteAggregate> {
  const aggregate = (await loadSites(q, [id])).get(id);
  if (!aggregate) throw new AppError(404, "NOT_FOUND", "Eser bulunamadı.");
  return aggregate;
}

/** The media a site links (`site_media`), in display order. */
const linkedMedia = (a: SiteAggregate): MediaRow[] => present(a.mediaIds.map((id) => a.media.get(id)));

const modelOf = (a: SiteAggregate): MediaRow | undefined => linkedMedia(a).find((m) => m.kind === "model");

/** The site as the domain's `HeritageSite`, so `publicationIssues` stays the single publish gate. */
function toDomainSite(a: SiteAggregate): HeritageSite {
  const { site: s } = a;
  const linked = linkedMedia(a);
  const photos: SitePhoto[] = linked
    .filter((m) => m.kind === "photo")
    .map((m) => ({
      id: m.id,
      src: m.url,
      alt: m.alt,
      title: m.title,
      titleEn: m.titleEn ?? "",
      description: m.description,
      sourceId: m.sourceId ?? "",
      license: m.license,
      trust: m.trust,
    }));
  const siteSourceList: SiteSource[] = present(a.sourceLinks.map((l) => a.sources.get(l.sourceId))).map((r) => ({
    id: r.id,
    title: r.title,
    kind: r.kind,
    author: r.author,
    year: r.year,
    page: r.page,
    url: r.url,
    trust: r.trust,
  }));
  const stories: StoryBlock[] = a.stories.map((b) => {
    const story: StoryBlock = { id: b.id, title: b.title, text: b.text, simple: b.simple, trust: b.trust, highlights: b.highlights };
    if (b.textEn) story.textEn = b.textEn;
    if (b.photoId) story.photoId = b.photoId;
    if (b.sourceId) story.sourceId = b.sourceId;
    if (b.showCard !== null) story.showCard = b.showCard;
    if (b.camera) story.camera = b.camera;
    if (b.interior) story.interior = true;
    return story;
  });

  const site: HeritageSite = {
    id: s.id,
    name: s.name,
    city: s.cityName,
    district: s.district ?? "",
    year: s.year,
    architect: s.architect,
    kind: (s.typeId ?? "") as SiteKind,
    // No location reads as non-finite coordinates, which the domain gate reports.
    coordinates: s.lng === null || s.lat === null ? [Number.NaN, Number.NaN] : [s.lng, s.lat],
    minutes: s.minutes,
    description: s.description,
    status: s.status,
    stories,
    source: s.sourceSummary,
    tier: s.tier,
    editorVersion: 2,
    photos,
    sources: siteSourceList,
  };
  if (s.nameEn) site.nameEn = s.nameEn;
  if (s.descriptionEn) site.descriptionEn = s.descriptionEn;
  if (s.patron) site.patron = s.patron;
  if (s.era) site.era = s.era;
  if (s.address) site.address = s.address;
  if (s.role) site.role = s.role;
  if (s.relatedSiteId) site.relatedSiteId = s.relatedSiteId;
  if (s.coverMediaId) site.coverPhotoId = s.coverMediaId;
  const model = modelOf(a);
  if (model) site.model = { name: model.title, bytes: model.bytes ?? 0, src: model.url, parts: model.parts, trust: model.trust, coverGroups: model.coverGroups };
  return site;
}

/**
 * What stops the site from being published, in Turkish: the domain's `publicationIssues` plus the
 * rules the database enforces (type required; a street or neighbourhood-centre point is no pin).
 */
export function publishIssues(a: SiteAggregate): string[] {
  const issues = publicationIssues(toDomainSite(a));
  if (a.site.typeId === null) issues.unshift("Yapı türü seç.");
  if (a.site.locationSource && (APPROXIMATE_SOURCES as readonly string[]).includes(a.site.locationSource)) {
    issues.push("Konum yaklaşık (sokak ya da mahalle merkezi): iğneyi binanın üstüne taşı ya da doğrula.");
  }
  return issues;
}

function toAdminDetail(a: SiteAggregate): AdminSiteDetail {
  const { site: s } = a;
  const linked = linkedMedia(a);
  const mediaList = present(
    distinct([
      ...a.mediaIds,
      s.coverMediaId,
      s.aboutCoverMediaId,
      ...a.stories.flatMap((b) => [b.photoId, b.audioMediaId, b.audioEnMediaId]),
      ...distinct(a.stories.map((b) => b.cardId)).flatMap((cardId) => a.cards.get(cardId)?.mediaId ?? []),
      ...a.history.flatMap((h) => [h.mediaId, h.presentMediaId]),
      ...a.partCards.flatMap((c) => c.photoIds),
      ...a.sectionPhotos.map((p) => p.mediaId),
      ...a.tasks.map((t) => t.mediaId),
    ]).map((id) => a.media.get(id)),
  );
  // Cards in the order the story first uses them (several sentences may share one card).
  const cardList = present(distinct(a.stories.map((b) => b.cardId)).map((cardId) => a.cards.get(cardId)));
  const sourceList = present(
    distinct([
      ...a.sourceLinks.map((l) => l.sourceId),
      ...a.stories.map((b) => b.sourceId),
      ...a.sections.map((x) => x.sourceId),
      ...cardList.map((c) => c.sourceId),
      ...a.history.map((h) => h.sourceId),
      ...a.partCards.map((c) => c.sourceId),
      ...mediaList.map((m) => m.sourceId),
    ]).map((id) => a.sources.get(id)),
  );
  const cover = s.coverMediaId ? a.media.get(s.coverMediaId) : undefined;
  const photosOf = sectionPhotosBySection(a.sectionPhotos);

  return {
    id: s.id,
    name: s.name,
    nameEn: s.nameEn,
    kind: s.typeId,
    categoryId: s.categoryId,
    periodId: s.periodId,
    city: { id: s.cityId, name: s.cityName },
    district: s.district,
    year: s.year,
    coordinates: s.lng === null || s.lat === null ? null : [s.lng, s.lat],
    minutes: s.minutes,
    tier: s.tier,
    trust: s.trust,
    description: s.description,
    coverImage: cover ? { id: cover.id, url: cover.url, alt: cover.alt } : null,
    sourceCount: a.sourceLinks.length,
    has: {
      model: linked.some((m) => m.kind === "model"),
      audio: a.stories.some((b) => b.audioMediaId !== null || b.audioEnMediaId !== null),
      history: a.history.length > 0,
    },
    distanceMeters: null,
    descriptionEn: s.descriptionEn,
    architect: s.architect,
    patron: s.patron,
    era: s.era,
    address: s.address,
    role: s.role,
    relatedSiteId: s.relatedSiteId,
    sourceSummary: s.sourceSummary,
    editorVersion: s.editorVersion === 2 ? 2 : null,
    coverMediaId: s.coverMediaId,
    aboutCoverMediaId: s.aboutCoverMediaId,
    openingCamera: s.openingCamera,
    updatedAt: s.updatedAt.toISOString(),
    stories: a.stories.map((b) => ({
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
    sections: a.sections.map((x) => ({
      id: x.id,
      kind: x.kind,
      title: x.title,
      body: x.body,
      bodyEn: x.bodyEn,
      trust: x.trust,
      sourceId: x.sourceId,
      chapterId: x.chapterId,
      photos: photosOf.get(x.id) ?? [],
    })),
    chapters: a.chapters.map(chapterDto),
    cards: cardList.map((c) => ({
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
    historyImages: a.history.map((h) => ({
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
    partCards: a.partCards.map((c) => ({
      id: c.id,
      parts: c.parts,
      title: c.title,
      body: c.body,
      photoIds: c.photoIds,
      sourceId: c.sourceId,
      trust: c.trust,
    })),
    tasks: a.tasks.map(taskDto),
    badges: a.badges.map(badgeDto),
    placement: s.lng === null || s.lat === null ? null : publicPlacement(a.placement, { lng: s.lng, lat: s.lat }, modelOf(a) !== undefined),
    media: mediaList.map((m) => ({
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
    sources: sourceList.map((r) => ({
      id: r.id,
      title: r.title,
      kind: r.kind,
      author: r.author,
      year: r.year,
      page: r.page,
      url: r.url,
      trust: r.trust,
    })),
    status: s.status,
    dedupeKey: s.dedupeKey,
    locationSource: s.locationSource,
    importMeta: s.importMeta && typeof s.importMeta === "object" && !Array.isArray(s.importMeta) ? (s.importMeta as Record<string, unknown>) : null,
    modelMediaId: modelOf(a)?.id ?? null,
    mapPlacement: a.placement ? { ...resolvePlacement(a.placement, s), visible: a.placement.visible, updatedAt: a.placement.updatedAt.toISOString() } : null,
    photoIds: linked.filter((m) => m.kind === "photo").map((m) => m.id),
    sourceLinks: a.sourceLinks,
    issues: publishIssues(a),
  };
}

/** Sites with the given ids, drafts included, as the editable view; ids that name no site are left out. A fixed number of queries. */
export async function getAdminSites(db: Db, ids: string[]): Promise<Map<string, AdminSiteDetail>> {
  const aggregates = await loadSites(db, ids);
  return new Map([...aggregates].map(([id, a]) => [id, toAdminDetail(a)]));
}

export async function getAdminSite(db: Db, id: string): Promise<AdminSiteDetail> {
  const site = (await getAdminSites(db, [id])).get(id);
  if (!site) throw new AppError(404, "NOT_FOUND", "Eser bulunamadı.");
  return site;
}

/** The panel's list row of a loaded site: identity, place, status and what blocks its publication. */
function toListItem(a: SiteAggregate): AdminSiteListItem {
  const { site: s } = a;
  const issues = publishIssues(a);
  const cover = s.coverMediaId ? a.media.get(s.coverMediaId) : undefined;
  return {
    id: s.id,
    name: s.name,
    nameEn: s.nameEn,
    kind: s.typeId,
    city: { id: s.cityId, name: s.cityName },
    district: s.district,
    status: s.status,
    tier: s.tier,
    trust: s.trust,
    coordinates: s.lng === null || s.lat === null ? null : [s.lng, s.lat],
    locationSource: s.locationSource,
    coverImage: cover ? { id: cover.id, url: cover.url, alt: cover.alt } : null,
    issues,
    issueCount: issues.length,
    updatedAt: s.updatedAt.toISOString(),
  };
}

/** Sites read per round when a page is filtered after loading. */
const SCAN_BATCH = 100;

/**
 * One keyset page (by name, then id) of the sites matching `where`, drafts included, each shaped by
 * `shape`. `keep` filters on what SQL cannot see (the publish issues): batches are read until the
 * page is full or the sites run out, so a sparse filter still returns full pages.
 */
async function pageSites<T extends { id: string }>(
  db: Db,
  where: SQL[],
  page: { cursor?: string | undefined; limit: number },
  shape: (a: SiteAggregate) => T,
  keep?: (item: T) => boolean,
): Promise<{ items: T[]; nextCursor: string | null }> {
  let after = page.cursor ? decodeCursor(page.cursor, ["n", "i"]) : null;
  // Unfiltered, one row past the page tells whether another page exists; filtered, one extra match does.
  const batch = keep ? Math.max(page.limit + 1, SCAN_BATCH) : page.limit + 1;
  const found: { item: T; sortName: string }[] = [];
  let more = false;
  for (;;) {
    const rows = await db
      .select({ id: sites.id, sortName: sites.sortName })
      .from(sites)
      .where(and(...where, after ? sql`(${sites.sortName} COLLATE "C", ${sites.id} COLLATE "C") > (${after.n}, ${after.i})` : undefined))
      .orderBy(sql`${sites.sortName} COLLATE "C"`, sql`${sites.id} COLLATE "C"`)
      .limit(batch);
    const wanted = keep ? rows : rows.slice(0, page.limit);
    const aggregates = await loadSites(db, wanted.map((r) => r.id));
    for (const r of wanted) {
      const a = aggregates.get(r.id);
      if (!a) continue;
      const item = shape(a);
      if (!keep || keep(item)) found.push({ item, sortName: r.sortName });
      if (found.length > page.limit) break;
    }
    if (!keep) {
      more = rows.length > page.limit;
      break;
    }
    more = found.length > page.limit;
    const last = rows.at(-1);
    if (more || !last || rows.length < batch) break;
    after = { n: last.sortName, i: last.id };
  }
  const items = found.slice(0, page.limit);
  const last = more ? items.at(-1) : undefined;
  return { items: items.map((f) => f.item), nextCursor: last ? encodeCursor({ n: last.sortName, i: last.item.id }) : null };
}

/** A page of the panel's list rows (see `pageSites`). */
export function pageAdminSites(
  db: Db,
  where: SQL[],
  page: { cursor?: string | undefined; limit: number },
  keep?: (item: AdminSiteListItem) => boolean,
): Promise<{ items: AdminSiteListItem[]; nextCursor: string | null }> {
  return pageSites(db, where, page, toListItem, keep);
}

/** The filters `GET /v1/admin/sites` and `GET /v1/admin/site-details` share. */
function adminSiteFilters(input: AdminListSitesInput): SQL[] {
  const where: SQL[] = [];
  if (input.status) where.push(eq(sites.status, input.status));
  if (input.city) where.push(eq(sites.cityId, normalize(input.city)));
  const term = input.query ? normalize(input.query.trim()) : "";
  if (term) where.push(sql`${sites.searchText} LIKE ${`%${term.replace(/[\\%_]/g, "\\$&")}%`}`);
  return where;
}

/** Every site, drafts included, by name; each with what blocks its publication. */
export function listAdminSites(db: Db, input: AdminListSitesInput): Promise<{ items: AdminSiteListItem[]; nextCursor: string | null }> {
  return pageSites(db, adminSiteFilters(input), input, toListItem);
}

/** The same pages as `listAdminSites`, each site as `getAdminSite` returns it. */
export function listAdminSiteDetails(db: Db, input: AdminListSitesInput): Promise<{ items: AdminSiteDetail[]; nextCursor: string | null }> {
  return pageSites(db, adminSiteFilters(input), input, toAdminDetail);
}

// ── reference checks ─────────────────────────────────────────────────────────

async function mediaKindsOf(q: Q, ids: string[]): Promise<Map<string, MediaKind>> {
  if (!ids.length) return new Map();
  const rows = await q.select({ id: media.id, kind: media.kind }).from(media).where(inArray(media.id, ids));
  return new Map(rows.map((r) => [r.id, r.kind]));
}

async function existingSourceIds(q: Q, ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set();
  const rows = await q.select({ id: sources.id }).from(sources).where(inArray(sources.id, ids));
  return new Set(rows.map((r) => r.id));
}

const MEDIA_LABEL: Record<MediaKind, string> = { photo: "fotoğraf", model: "3B model", audio: "ses kaydı" };

/** Adds an error unless `id` is empty or names existing media of kind `want`. */
function checkMedia(errors: FieldErrors, path: string, id: string | null | undefined, kinds: Map<string, MediaKind>, want: MediaKind): void {
  if (!id) return;
  const kind = kinds.get(id);
  if (!kind) errors.add(path, "Medya bulunamadı.");
  else if (kind !== want) errors.add(path, `Bu medya bir ${MEDIA_LABEL[want]} değil.`);
}

/** Adds one error per repeated id (client-chosen ids must be unique within a request). */
function checkUnique(errors: FieldErrors, path: (index: number) => string, ids: string[], message: string): void {
  const seen = new Set<string>();
  ids.forEach((id, i) => {
    if (seen.has(id)) errors.add(path(i), message);
    seen.add(id);
  });
}

/** `typeId`, `periodId` and `relatedSiteId` must name existing rows (400 with the field named). */
async function checkInfoRefs(
  tx: Tx,
  refs: { typeId?: string | null | undefined; periodId?: string | null | undefined; relatedSiteId?: string | null | undefined },
  selfId: string | null,
): Promise<void> {
  const errors = new FieldErrors();
  if (refs.typeId) {
    const rows = await tx.select({ id: siteTypes.id }).from(siteTypes).where(eq(siteTypes.id, refs.typeId));
    if (!rows.length) errors.add("typeId", "Bilinmeyen yapı türü.");
  }
  if (refs.periodId) {
    const rows = await tx.select({ id: periods.id }).from(periods).where(eq(periods.id, refs.periodId));
    if (!rows.length) errors.add("periodId", "Bilinmeyen dönem.");
  }
  if (refs.relatedSiteId) {
    if (refs.relatedSiteId === selfId) errors.add("relatedSiteId", "Eser kendisiyle ilişkilendirilemez.");
    else {
      const rows = await tx.select({ id: sites.id }).from(sites).where(eq(sites.id, refs.relatedSiteId));
      if (!rows.length) errors.add("relatedSiteId", "İlişkili eser bulunamadı.");
    }
  }
  errors.throwIfAny();
}

// ── places and identity of a site ────────────────────────────────────────────

/**
 * The region row of a district name (created on first use), as the importer and the seed id it:
 * `<city>-<slug>`. A spelling of an existing region maps onto that region.
 */
async function resolveRegion(tx: Tx, cityId: string, district: string | null): Promise<{ id: string; name: string } | null> {
  if (!district) return null;
  const id = `${cityId}-${slugify(district)}`;
  const find = () =>
    tx
      .select({ id: regions.id, name: regions.name })
      .from(regions)
      .where(and(eq(regions.cityId, cityId), or(eq(regions.id, id), eq(regions.name, district))))
      .limit(1);
  const [existing] = await find();
  if (existing) return existing;
  await tx.insert(regions).values({ id, cityId, name: district }).onConflictDoNothing();
  return firstRow(await find());
}

/**
 * 409 when another site of the city has the same normalized name and district. Serialized with
 * import commits (same advisory lock as `insertDraftSites`), so neither path can slip a duplicate
 * past the other.
 */
async function assertNoDuplicate(tx: Tx, cityId: string, dedupeKey: string, exceptId: string | null): Promise<void> {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`ingest:${cityId}`}))`);
  const [dup] = await tx
    .select({ id: sites.id, name: sites.name })
    .from(sites)
    .where(and(eq(sites.cityId, cityId), eq(sites.dedupeKey, dedupeKey), exceptId ? ne(sites.id, exceptId) : undefined))
    .limit(1);
  if (dup) {
    throw new AppError(409, "CONFLICT", `Bu şehirde aynı ad ve ilçeyle kayıtlı bir eser var: ${dup.name} (${dup.id}).`, {
      existingSiteId: [dup.id],
    });
  }
}

/** `base`, then `base-2`, `base-3`… until no site has the id (call under the city's advisory lock). */
async function uniqueSiteId(tx: Tx, base: string): Promise<string> {
  for (let n = 1; ; n++) {
    const suffix = n === 1 ? "" : `-${n}`;
    const id = base.slice(0, 100 - suffix.length) + suffix;
    const rows = await tx.select({ id: sites.id }).from(sites).where(eq(sites.id, id));
    if (!rows.length) return id;
  }
}

const infoSnapshot = (s: SiteRow) => ({
  cityId: s.cityId,
  name: s.name,
  nameEn: s.nameEn,
  typeId: s.typeId,
  periodId: s.periodId,
  year: s.year,
  architect: s.architect,
  patron: s.patron,
  era: s.era,
  address: s.address,
  role: s.role,
  relatedSiteId: s.relatedSiteId,
  description: s.description,
  descriptionEn: s.descriptionEn,
  minutes: s.minutes,
  district: s.district,
  tier: s.tier,
});

// ── writing ──────────────────────────────────────────────────────────────────

/** Takes the site's row lock (writers of one site queue up) and returns its state; 404 when missing. */
async function lockAndLoad(tx: Tx, id: string): Promise<SiteAggregate> {
  await tx.select({ id: sites.id }).from(sites).where(eq(sites.id, id)).for("update");
  return requireAggregate(tx, id);
}

/**
 * One wizard write: lock, let `apply` check input and write the site's children (it returns the
 * `sites` columns to set), bump `updated_at`, audit `site.update` with `snapshot` before and after.
 */
async function mutate(
  tx: Tx,
  ctx: AuditCtx,
  id: string,
  snapshot: (a: SiteAggregate) => unknown,
  apply: (before: SiteAggregate) => Promise<SiteUpdate>,
): Promise<AdminSiteDetail> {
  const before = await lockAndLoad(tx, id);
  const set = await apply(before);
  await tx
    .update(sites)
    .set({ ...set, updatedAt: touched })
    .where(eq(sites.id, id));
  const after = await requireAggregate(tx, id);
  await recordAudit(tx, {
    actorId: ctx.actorId,
    action: "site.update",
    entityType: "site",
    entityId: id,
    before: snapshot(before),
    after: snapshot(after),
    requestId: ctx.requestId,
  });
  return toAdminDetail(after);
}

/** Zod's optional `label` reads `undefined`; the stored pose only carries the key when set. */
function toPose({ label, ...pose }: CameraPoseInput): CameraPose {
  return label === undefined ? pose : { label, ...pose };
}

/** Creates a draft (editor v2, Tier 1 unless told otherwise); 409 when the city already has the same name and district. */
export async function createSite(tx: Tx, ctx: AuditCtx, input: CreateSiteInput): Promise<AdminSiteDetail> {
  const cityId = slugify(input.city);
  const [city] = await tx.select().from(cities).where(eq(cities.id, cityId));
  if (!city) throw new AppError(400, "VALIDATION_FAILED", "Girdi doğrulanamadı.", { city: ["Şehir bulunamadı."] });
  await checkInfoRefs(tx, input, null);

  const district = input.district || null;
  const dedupeKey = siteDedupeKey(input.name, district);
  await assertNoDuplicate(tx, cityId, dedupeKey, null);
  const region = await resolveRegion(tx, cityId, district);
  const id = await uniqueSiteId(tx, [cityId, slugify(input.name) || "eser", district ? slugify(district) : ""].filter(Boolean).join("-").slice(0, 100));

  await tx.insert(sites).values({
    id,
    cityId,
    regionId: region?.id ?? null,
    name: input.name,
    nameEn: input.nameEn || null,
    typeId: input.typeId ?? null,
    periodId: input.periodId ?? null,
    year: input.year ?? "",
    architect: input.architect ?? "",
    patron: input.patron || null,
    era: input.era || null,
    address: input.address || null,
    role: input.role ?? null,
    relatedSiteId: input.relatedSiteId ?? null,
    description: input.description ?? "",
    descriptionEn: input.descriptionEn || null,
    minutes: input.minutes ?? 0,
    tier: input.tier ?? "Tier 1",
    // No story yet: the weakest label, until the story's own trust levels decide (see setStories).
    trust: "representative",
    status: "draft",
    editorVersion: 2,
    dedupeKey,
    searchText: siteSearchText({ name: input.name, city: city.name, district: region?.name ?? "", architect: input.architect ?? "" }),
    sortName: siteSortName(input.name),
  });

  const created = await requireAggregate(tx, id);
  await recordAudit(tx, {
    actorId: ctx.actorId,
    action: "site.create",
    entityType: "site",
    entityId: id,
    before: null,
    after: { status: created.site.status, info: infoSnapshot(created.site) },
    requestId: ctx.requestId,
  });
  return toAdminDetail(created);
}

/**
 * The city a site moves to: 400 for an unknown city, and for a site that is a stop of a route (a
 * route's stops stay in its city; see `setStops`).
 */
async function resolveMoveCity(tx: Tx, siteId: string, city: string): Promise<{ id: string; name: string }> {
  const [row] = await tx.select({ id: cities.id, name: cities.name }).from(cities).where(eq(cities.id, slugify(city)));
  if (!row) throw new AppError(400, "VALIDATION_FAILED", "Girdi doğrulanamadı.", { city: ["Şehir bulunamadı."] });
  const stops = await tx
    .selectDistinct({ name: catalogRoutes.name })
    .from(routeStops)
    .innerJoin(catalogRoutes, eq(catalogRoutes.id, routeStops.routeId))
    .where(eq(routeStops.siteId, siteId));
  if (stops.length) {
    throw new AppError(400, "VALIDATION_FAILED", "Girdi doğrulanamadı.", {
      city: [`Eser şu rotalarda durak: ${stops.map((s) => s.name).join(", ")}. Şehrini değiştirmeden önce rotalardan çıkar.`],
    });
  }
  return row;
}

/** Adım 2 (Bilgiler): partial update; search text, sort name and duplicate key follow the name, district and city. */
export function updateSiteInfo(tx: Tx, ctx: AuditCtx, id: string, p: SiteInfoInput): Promise<AdminSiteDetail> {
  return mutate(
    tx,
    ctx,
    id,
    (a) => ({ info: infoSnapshot(a.site) }),
    async ({ site: s }) => {
      await checkInfoRefs(tx, p, id);
      if (p.typeId === null && s.status === "published") throw publishBlocked(["Yayındaki eserin yapı türü boş bırakılamaz."]);

      const set: SiteUpdate = {};
      if (p.name !== undefined) {
        set.name = p.name;
        set.sortName = siteSortName(p.name);
      }
      if (p.nameEn !== undefined) set.nameEn = p.nameEn || null;
      if (p.typeId !== undefined) set.typeId = p.typeId;
      if (p.periodId !== undefined) set.periodId = p.periodId;
      if (p.year !== undefined) set.year = p.year;
      if (p.architect !== undefined) set.architect = p.architect;
      if (p.patron !== undefined) set.patron = p.patron || null;
      if (p.era !== undefined) set.era = p.era || null;
      if (p.address !== undefined) set.address = p.address || null;
      if (p.role !== undefined) set.role = p.role;
      if (p.relatedSiteId !== undefined) set.relatedSiteId = p.relatedSiteId;
      if (p.description !== undefined) set.description = p.description;
      if (p.descriptionEn !== undefined) set.descriptionEn = p.descriptionEn || null;
      if (p.minutes !== undefined) set.minutes = p.minutes;
      if (p.tier !== undefined) set.tier = p.tier;

      let city = { id: s.cityId, name: s.cityName };
      const moved = p.city !== undefined && slugify(p.city) !== s.cityId;
      if (moved) {
        city = await resolveMoveCity(tx, id, p.city!);
        set.cityId = city.id;
      }
      let district = s.district;
      // Regions belong to a city: a move looks the district up again in the new city.
      if (p.district !== undefined || moved) {
        const region = await resolveRegion(tx, city.id, p.district !== undefined ? p.district || null : s.district);
        set.regionId = region?.id ?? null;
        district = region?.name ?? null;
      }
      const name = p.name ?? s.name;
      if (p.name !== undefined || p.district !== undefined || p.architect !== undefined || moved) {
        set.searchText = siteSearchText({ name, city: city.name, district: district ?? "", architect: p.architect ?? s.architect });
      }
      if (p.name !== undefined || p.district !== undefined || moved) {
        const dedupeKey = siteDedupeKey(name, district);
        if (dedupeKey !== s.dedupeKey || moved) {
          await assertNoDuplicate(tx, city.id, dedupeKey, id);
          set.dedupeKey = dedupeKey;
        }
      }
      return set;
    },
  );
}

/** The editor's confirmation of the pin: whatever the geocoder said, the location is now `manual`. */
export function setLocation(tx: Tx, ctx: AuditCtx, id: string, input: LocationInput): Promise<AdminSiteDetail> {
  return mutate(
    tx,
    ctx,
    id,
    ({ site: s }) => ({ coordinates: s.lng === null || s.lat === null ? null : [s.lng, s.lat], locationSource: s.locationSource }),
    async () => ({ location: input.coordinates, locationSource: "manual" }),
  );
}

/**
 * Rewrites the site's `site_media` links: the model, then the photos, then anything else already
 * linked, each in order (the table's positions are unique per site, so the list is replaced whole).
 */
async function rewriteSiteMedia(tx: Tx, siteId: string, before: SiteAggregate, change: { model?: string | null; photos?: string[] }): Promise<void> {
  const linked = linkedMedia(before);
  const model = change.model !== undefined ? change.model : (linked.find((m) => m.kind === "model")?.id ?? null);
  const photos = change.photos ?? linked.filter((m) => m.kind === "photo").map((m) => m.id);
  const others = linked.filter((m) => m.kind !== "model" && m.kind !== "photo").map((m) => m.id);
  const ordered = distinct([model, ...photos, ...others]);
  await tx.delete(siteMedia).where(eq(siteMedia.siteId, siteId));
  if (ordered.length) await tx.insert(siteMedia).values(ordered.map((mediaId, position) => ({ siteId, mediaId, position })));
}

/** Adım 1 (Model): replaces the linked 3D model; the opening camera belongs to the model. */
export function setModel(tx: Tx, ctx: AuditCtx, id: string, input: ModelInput): Promise<AdminSiteDetail> {
  return mutate(
    tx,
    ctx,
    id,
    (a) => ({ modelMediaId: modelOf(a)?.id ?? null, openingCamera: a.site.openingCamera }),
    async (before) => {
      const errors = new FieldErrors();
      if (input.mediaId === null && input.openingCamera) errors.add("openingCamera", "Model olmadan açılış açısı verilemez.");
      if (input.mediaId !== null) checkMedia(errors, "mediaId", input.mediaId, await mediaKindsOf(tx, [input.mediaId]), "model");
      errors.throwIfAny();

      await rewriteSiteMedia(tx, id, before, { model: input.mediaId });
      return { openingCamera: input.mediaId !== null && input.openingCamera ? toPose(input.openingCamera) : null };
    },
  );
}

/** The placement as the audit trail keeps it: stored values (no location = the site's own). */
const placementSnapshot = (p: PlacementRow | undefined) =>
  p && {
    lng: p.lng,
    lat: p.lat,
    headingDeg: p.headingDeg,
    scale: p.scale,
    altitudeM: p.altitudeM,
    anchorNode: p.anchorNode,
    hiddenPoints: p.hiddenPoints,
    keptPoints: p.keptPoints,
    visible: p.visible,
  };

/**
 * The model's place on the map, replaced whole. Only a site with a model has one (409); the placement is
 * kept when the model is swapped or removed. The city check is the city's bounding box (`CITIES`, the one
 * the importer rejects geocoder results by); a city without an entry there only gets the WGS84 range check
 * the schema already did. The site row is locked and touched like every wizard write.
 */
export async function setMapPlacement(tx: Tx, ctx: AuditCtx, id: string, input: MapPlacementInput): Promise<AdminSiteDetail> {
  const before = await lockAndLoad(tx, id);
  if (!modelOf(before)) throw new AppError(409, "CONFLICT", "Eserin 3B modeli yok; haritada yerleşim için önce model bağla.");

  const errors = new FieldErrors();
  const box = Object.hasOwn(CITIES, before.site.cityId) ? CITIES[before.site.cityId]?.bbox : undefined;
  const outside = ({ lng, lat }: { lng: number; lat: number }) => box !== undefined && (lng < box[0] || lat < box[1] || lng > box[2] || lat > box[3]);
  const cityName = before.site.cityName;
  const hasLocation = input.lng != null && input.lat != null;
  if (hasLocation && outside({ lng: input.lng!, lat: input.lat! })) errors.add("lng", `Konum ${cityName} sınırları dışında.`);
  input.hiddenPoints.forEach((p, i) => outside(p) && errors.add(`hiddenPoints.${i}`, `Nokta ${cityName} sınırları dışında.`));
  input.keptPoints.forEach((p, i) => outside(p) && errors.add(`keptPoints.${i}`, `Nokta ${cityName} sınırları dışında.`));
  errors.throwIfAny();

  const values = {
    location: hasLocation ? ([input.lng!, input.lat!] as [number, number]) : null,
    headingDeg: input.headingDeg,
    scale: input.scale,
    altitudeM: input.altitudeM,
    anchorNode: input.anchorNode ? input.anchorNode : null,
    hiddenPoints: input.hiddenPoints,
    keptPoints: input.keptPoints,
    visible: input.visible,
    updatedBy: ctx.actorId,
    updatedAt: touched,
  };
  await tx.insert(siteMapPlacements).values({ siteId: id, ...values }).onConflictDoUpdate({ target: siteMapPlacements.siteId, set: values });
  // Public readers key off the site's `updatedAt` too; a placement is a change to the site.
  await tx.update(sites).set({ updatedAt: touched }).where(eq(sites.id, id));

  const after = await requireAggregate(tx, id);
  await recordAudit(tx, {
    actorId: ctx.actorId,
    action: "site.map-placement",
    entityType: "site",
    entityId: id,
    before: placementSnapshot(before.placement) ?? null,
    after: placementSnapshot(after.placement) ?? null,
    requestId: ctx.requestId,
  });
  return toAdminDetail(after);
}

/** Adım 3 (Fotoğraflar): ordered photo list and the cover, which must be one of them. */
export function setPhotos(tx: Tx, ctx: AuditCtx, id: string, input: SiteMediaInput): Promise<AdminSiteDetail> {
  return mutate(
    tx,
    ctx,
    id,
    (a) => ({
      photoIds: linkedMedia(a)
        .filter((m) => m.kind === "photo")
        .map((m) => m.id),
      coverPhotoId: a.site.coverMediaId,
    }),
    async (before) => {
      const errors = new FieldErrors();
      const kinds = await mediaKindsOf(tx, input.photoIds);
      checkUnique(errors, (i) => `photoIds.${i}`, input.photoIds, "Aynı fotoğraf birden fazla kez verilmiş.");
      input.photoIds.forEach((photoId, i) => checkMedia(errors, `photoIds.${i}`, photoId, kinds, "photo"));
      if (input.coverPhotoId !== null && !input.photoIds.includes(input.coverPhotoId)) {
        errors.add("coverPhotoId", "Kapak fotoğrafı fotoğraf listesinden biri olmalı.");
      }
      errors.throwIfAny();

      await rewriteSiteMedia(tx, id, before, { photos: input.photoIds });
      return { coverMediaId: input.coverPhotoId };
    },
  );
}

/**
 * The site's bibliography, in order. A source is shared: a known id updates that row for every site
 * that uses it, an unknown or missing id creates one. Keeps the legacy one-line summary in step.
 */
export function setSources(tx: Tx, ctx: AuditCtx, id: string, input: SiteSourcesInput): Promise<AdminSiteDetail> {
  return mutate(
    tx,
    ctx,
    id,
    (a) => ({ sources: a.sourceLinks.map((l) => ({ ...a.sources.get(l.sourceId), locator: l.locator })) }),
    async () => {
      const rows = input.sources.map((s) => ({ ...s, id: s.id ?? newId("src", s.title) }));
      const errors = new FieldErrors();
      checkUnique(errors, (i) => `sources.${i}.id`, rows.map((r) => r.id), "Aynı kaynak birden fazla kez verilmiş.");
      errors.throwIfAny();

      const current = rows.length ? await tx.select().from(sources).where(inArray(sources.id, rows.map((r) => r.id))) : [];
      const currentById = new Map(current.map((r) => [r.id, r]));
      for (const r of rows) {
        const values = { title: r.title, kind: r.kind, author: r.author, year: r.year, page: r.page, url: r.url, trust: r.trust };
        const old = currentById.get(r.id);
        if (!old) await tx.insert(sources).values({ id: r.id, ...values });
        else if (Object.entries(values).some(([key, value]) => old[key as keyof typeof values] !== value)) {
          await tx.update(sources).set({ ...values, updatedAt: touched }).where(eq(sources.id, r.id));
        }
      }
      await tx.delete(siteSources).where(eq(siteSources.siteId, id));
      if (rows.length) {
        await tx.insert(siteSources).values(rows.map((r, position) => ({ siteId: id, sourceId: r.id, position, locator: r.locator || null })));
      }
      return { sourceSummary: rows.map((r) => r.title).join(" · ") };
    },
  );
}

const TRUST_RANK: Record<Trust, number> = { verified: 0, inferred: 1, representative: 2 };

/**
 * Adım 4 (Hikâye): replaces the sentences in order. Photo, source, card and audio must exist (with
 * the right media kind) and highlights must be parts of the linked model. The site's own trust is
 * its weakest sentence, as the seed loader does it.
 */
export function setStories(tx: Tx, ctx: AuditCtx, id: string, input: StoriesInput): Promise<AdminSiteDetail> {
  return mutate(
    tx,
    ctx,
    id,
    (a) => ({ stories: a.stories }),
    async (before) => {
      const blocks = input.blocks.map((b) => ({ ...b, id: b.id ?? newId("s") }));
      const errors = new FieldErrors();
      checkUnique(errors, (i) => `blocks.${i}.id`, blocks.map((b) => b.id), "Aynı kimlik birden fazla cümlede kullanılmış.");

      const kinds = await mediaKindsOf(tx, distinct(blocks.flatMap((b) => [b.photoId, b.audioMediaId, b.audioEnMediaId])));
      const sourceIds = await existingSourceIds(tx, distinct(blocks.map((b) => b.sourceId)));
      const cardIds = distinct(blocks.map((b) => b.cardId));
      const knownCards = cardIds.length ? await tx.select({ id: cards.id }).from(cards).where(inArray(cards.id, cardIds)) : [];
      const cardSet = new Set(knownCards.map((c) => c.id));
      const parts = new Set(modelOf(before)?.parts);
      const hasModel = modelOf(before) !== undefined;

      blocks.forEach((b, i) => {
        checkMedia(errors, `blocks.${i}.photoId`, b.photoId, kinds, "photo");
        checkMedia(errors, `blocks.${i}.audioMediaId`, b.audioMediaId, kinds, "audio");
        checkMedia(errors, `blocks.${i}.audioEnMediaId`, b.audioEnMediaId, kinds, "audio");
        if (b.sourceId && !sourceIds.has(b.sourceId)) errors.add(`blocks.${i}.sourceId`, "Kaynak bulunamadı.");
        if (b.cardId && !cardSet.has(b.cardId)) errors.add(`blocks.${i}.cardId`, "Kart bulunamadı.");
        const unknownParts = hasModel ? b.highlights.filter((h) => !parts.has(h)) : [];
        if (unknownParts.length) errors.add(`blocks.${i}.highlights`, `Modelde olmayan parça: ${unknownParts.join(", ")}.`);
        if (hasModel && b.camera?.target && !parts.has(b.camera.target))
          errors.add(`blocks.${i}.camera.target`, `Modelde olmayan parça: ${b.camera.target}.`);
      });
      errors.throwIfAny();

      await tx.delete(storyBlocks).where(eq(storyBlocks.siteId, id));
      if (blocks.length) {
        await tx.insert(storyBlocks).values(
          blocks.map((b, position) => ({
            siteId: id,
            id: b.id,
            position,
            title: b.title,
            text: b.text,
            textEn: b.textEn || null,
            simple: b.simple,
            trust: b.trust,
            photoId: b.photoId,
            sourceId: b.sourceId,
            showCard: b.showCard ?? null,
            cardId: b.cardId,
            camera: b.camera ? toPose(b.camera) : null,
            interior: b.interior,
            highlights: [...new Set(b.highlights)],
            audioMediaId: b.audioMediaId,
            audioEnMediaId: b.audioEnMediaId,
          })),
        );
      }
      const weakest = blocks.reduce<Trust>((w, b) => (TRUST_RANK[b.trust] > TRUST_RANK[w] ? b.trust : w), blocks[0]?.trust ?? "representative");
      return { trust: weakest };
    },
  );
}

/** "Eser hakkında" paragraphs (Tarihçe / Mimari / Vakıf ve akar), replaced in order. */
export function setSections(tx: Tx, ctx: AuditCtx, id: string, input: SectionsInput): Promise<AdminSiteDetail> {
  return mutate(
    tx,
    ctx,
    id,
    (a) => ({ sections: a.sections }),
    async (before) => {
      const rows = input.sections.map((s) => ({ ...s, id: s.id ?? newId("sec", s.title) }));
      const errors = new FieldErrors();
      checkUnique(errors, (i) => `sections.${i}.id`, rows.map((r) => r.id), "Aynı kimlik birden fazla bölümde kullanılmış.");
      const sourceIds = await existingSourceIds(tx, distinct(rows.map((r) => r.sourceId)));
      rows.forEach((r, i) => {
        if (r.sourceId && !sourceIds.has(r.sourceId)) errors.add(`sections.${i}.sourceId`, "Kaynak bulunamadı.");
      });
      errors.throwIfAny();

      // The rows are replaced, but what the import attached to them stays: a paragraph that keeps its id keeps its
      // chapter and book photographs; a new one joins the chapter with the same title (null when there is none).
      // Paragraphs left out lose their photographs with them (the foreign key cascades); chapters stay.
      const chapters = await tx.select({ id: siteAboutChapters.id, title: siteAboutChapters.title }).from(siteAboutChapters).where(eq(siteAboutChapters.siteId, id)).orderBy(asc(siteAboutChapters.position));
      const chapterOfTitle = new Map<string, string>();
      for (const c of chapters) if (!chapterOfTitle.has(c.title)) chapterOfTitle.set(c.title, c.id);
      const chapterOfSection = new Map(before.sections.map((x) => [x.id, x.chapterId]));
      const photos = await tx.select().from(siteSectionPhotos).where(eq(siteSectionPhotos.siteId, id));

      await tx.delete(siteSections).where(eq(siteSections.siteId, id));
      if (rows.length) {
        await tx.insert(siteSections).values(
          rows.map((r, position) => ({
            siteId: id,
            id: r.id,
            position,
            chapterId: chapterOfSection.has(r.id) ? chapterOfSection.get(r.id)! : (chapterOfTitle.get(r.title) ?? null),
            kind: r.kind,
            title: r.title,
            body: r.body,
            bodyEn: r.bodyEn || null,
            trust: r.trust,
            sourceId: r.sourceId,
          })),
        );
        const kept = new Set(rows.map((r) => r.id));
        const restored = photos.filter((p) => kept.has(p.sectionId));
        if (restored.length) await tx.insert(siteSectionPhotos).values(restored);
      }
      return {};
    },
  );
}

/**
 * "Geçmişi Gör" images, replaced in order. A given id keeps its row (route stops point at it, and
 * deleting it would clear that link), so existing rows are updated in place and only the ones left
 * out are deleted. An id owned by another site is a 409.
 */
export function setHistoryImages(tx: Tx, ctx: AuditCtx, id: string, input: HistoryImagesInput): Promise<AdminSiteDetail> {
  return mutate(
    tx,
    ctx,
    id,
    (a) => ({ historyImages: a.history }),
    async (before) => {
      const rows = input.images.map((r) => ({ ...r, id: r.id ?? newId("hist") }));
      const errors = new FieldErrors();
      checkUnique(errors, (i) => `images.${i}.id`, rows.map((r) => r.id), "Aynı kimlik birden fazla görselde kullanılmış.");
      const kinds = await mediaKindsOf(tx, distinct(rows.flatMap((r) => [r.mediaId, r.presentMediaId])));
      const sourceIds = await existingSourceIds(tx, distinct(rows.map((r) => r.sourceId)));
      rows.forEach((r, i) => {
        checkMedia(errors, `images.${i}.mediaId`, r.mediaId, kinds, "photo");
        checkMedia(errors, `images.${i}.presentMediaId`, r.presentMediaId, kinds, "photo");
        if (r.sourceId && !sourceIds.has(r.sourceId)) errors.add(`images.${i}.sourceId`, "Kaynak bulunamadı.");
      });
      errors.throwIfAny();

      const mine = new Set(before.history.map((h) => h.id));
      const foreign = rows.length
        ? await tx
            .select({ id: historyImages.id })
            .from(historyImages)
            .where(and(inArray(historyImages.id, rows.map((r) => r.id)), ne(historyImages.siteId, id)))
        : [];
      if (foreign.length) {
        const owned = new Set(foreign.map((f) => f.id));
        const fieldErrors: Record<string, string[]> = {};
        rows.forEach((r, i) => {
          if (owned.has(r.id)) fieldErrors[`images.${i}.id`] = ["Bu kimlik başka bir eserin görseline ait."];
        });
        throw new AppError(409, "CONFLICT", "Görsel kimliği başka bir esere ait.", fieldErrors);
      }

      await tx.delete(historyImages).where(and(eq(historyImages.siteId, id), notInArray(historyImages.id, rows.map((r) => r.id))));
      // Positions are unique per site and checked row by row: park the survivors on free (negative)
      // positions before handing out the new order.
      await tx
        .update(historyImages)
        .set({ position: sql`-(${historyImages.position} + 1)` })
        .where(eq(historyImages.siteId, id));
      for (const [position, r] of rows.entries()) {
        const values = {
          mediaId: r.mediaId,
          presentMediaId: r.presentMediaId,
          caption: r.caption,
          captionEn: r.captionEn || null,
          dateLabel: r.dateLabel,
          sourceId: r.sourceId,
          trust: r.trust,
          camera: r.camera ? toPose(r.camera) : null,
        };
        if (mine.has(r.id)) await tx.update(historyImages).set({ ...values, position }).where(eq(historyImages.id, r.id));
        else await tx.insert(historyImages).values({ id: r.id, siteId: id, position, ...values });
      }
      return {};
    },
  );
}

/**
 * Adım 5 (Yayınla) and its reverse. Publishing runs the whole gate under the site lock: any issue
 * is 422 PUBLISH_BLOCKED with the Turkish list in `fieldErrors._`. A site already in the target
 * state is 409.
 */
async function setStatus(tx: Tx, ctx: AuditCtx, id: string, to: "published" | "draft"): Promise<AdminSiteDetail> {
  const before = await lockAndLoad(tx, id);
  if (before.site.status === to) throw new AppError(409, "CONFLICT", to === "published" ? "Eser zaten yayında." : "Eser zaten taslak.");
  if (to === "published") {
    const issues = publishIssues(before);
    if (issues.length) throw publishBlocked(issues);
  }
  await tx.update(sites).set({ status: to, updatedAt: touched }).where(eq(sites.id, id));
  const after = await requireAggregate(tx, id);
  await recordAudit(tx, {
    actorId: ctx.actorId,
    action: to === "published" ? "site.publish" : "site.unpublish",
    entityType: "site",
    entityId: id,
    before: { status: before.site.status },
    after: { status: after.site.status },
    requestId: ctx.requestId,
  });
  return toAdminDetail(after);
}

export const publishSite = (tx: Tx, ctx: AuditCtx, id: string) => setStatus(tx, ctx, id, "published");

export const unpublishSite = (tx: Tx, ctx: AuditCtx, id: string) => setStatus(tx, ctx, id, "draft");

// ── cards ────────────────────────────────────────────────────────────────────

/** Sentences using each card. */
async function cardUsage(q: Q, ids: string[]): Promise<Map<string, number>> {
  if (!ids.length) return new Map();
  const rows = await q
    .select({ cardId: storyBlocks.cardId, uses: sql<number>`count(*)::int` })
    .from(storyBlocks)
    .where(inArray(storyBlocks.cardId, ids))
    .groupBy(storyBlocks.cardId);
  return new Map(present(rows.map((r) => (r.cardId === null ? undefined : ([r.cardId, r.uses] as const)))));
}

const toCardDto = (c: CardRow, usageCount: number): AdminCardDto => ({
  id: c.id,
  kind: c.kind,
  title: c.title,
  titleEn: c.titleEn,
  body: c.body,
  bodyEn: c.bodyEn,
  mediaId: c.mediaId,
  sourceId: c.sourceId,
  trust: c.trust,
  usageCount,
  updatedAt: c.updatedAt.toISOString(),
});

/** Cards, newest first, keyset over (created_at, id); the cursor carries the timestamp as PostgreSQL prints it (microseconds). */
export async function listCards(db: Db, input: AdminCardListInput): Promise<{ items: AdminCardDto[]; nextCursor: string | null }> {
  const where: SQL[] = [];
  if (input.kind) where.push(eq(cards.kind, input.kind));
  if (input.cursor) {
    const c = decodeCursor(input.cursor, ["t", "i"]);
    if (!/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d(\.\d{1,6})?[+-]\d\d(:\d\d)?$/.test(c.t)) {
      throw new AppError(400, "INVALID_CURSOR", "İmleç geçersiz.", { cursor: ["Geçersiz imleç."] });
    }
    where.push(sql`(${cards.createdAt}, ${cards.id} COLLATE "C") < (${c.t}::timestamptz, ${c.i})`);
  }

  const rows = await db
    .select({ card: cards, createdAt: sql<string>`${cards.createdAt}::text` })
    .from(cards)
    .where(and(...where))
    .orderBy(desc(cards.createdAt), sql`${cards.id} COLLATE "C" desc`)
    .limit(input.limit + 1);
  const page = rows.slice(0, input.limit);
  const last = rows.length > input.limit ? page.at(-1) : undefined;
  const usage = await cardUsage(db, page.map((r) => r.card.id));
  return {
    items: page.map((r) => toCardDto(r.card, usage.get(r.card.id) ?? 0)),
    nextCursor: last ? encodeCursor({ t: last.createdAt, i: last.card.id }) : null,
  };
}

async function checkCardRefs(tx: Tx, refs: { mediaId?: string | undefined; sourceId?: string | null | undefined }): Promise<void> {
  const errors = new FieldErrors();
  if (refs.mediaId !== undefined) checkMedia(errors, "mediaId", refs.mediaId, await mediaKindsOf(tx, [refs.mediaId]), "photo");
  if (refs.sourceId && !(await existingSourceIds(tx, [refs.sourceId])).size) errors.add("sourceId", "Kaynak bulunamadı.");
  errors.throwIfAny();
}

export async function createCard(tx: Tx, ctx: AuditCtx, input: CreateCardInput): Promise<AdminCardDto> {
  await checkCardRefs(tx, input);
  const card = firstRow(
    await tx
      .insert(cards)
      .values({
        id: newId("card", input.title),
        kind: input.kind,
        title: input.title,
        titleEn: input.titleEn || null,
        body: input.body,
        bodyEn: input.bodyEn || null,
        mediaId: input.mediaId,
        sourceId: input.sourceId,
        trust: input.trust,
      })
      .returning(),
  );
  await recordAudit(tx, { actorId: ctx.actorId, action: "card.create", entityType: "card", entityId: card.id, before: null, after: card, requestId: ctx.requestId });
  return toCardDto(card, 0);
}

/**
 * Edits the shared card itself, so every sentence that uses it shows the change; the sites that use
 * it get a new `updated_at` (their detail changed).
 */
export async function updateCard(tx: Tx, ctx: AuditCtx, id: string, patch: UpdateCardInput): Promise<AdminCardDto> {
  const [before] = await tx.select().from(cards).where(eq(cards.id, id)).for("update");
  if (!before) throw new AppError(404, "NOT_FOUND", "Kart bulunamadı.");
  await checkCardRefs(tx, patch);

  const set: PgUpdateSetSource<typeof cards> = {};
  if (patch.kind !== undefined) set.kind = patch.kind;
  if (patch.title !== undefined) set.title = patch.title;
  if (patch.titleEn !== undefined) set.titleEn = patch.titleEn || null;
  if (patch.body !== undefined) set.body = patch.body;
  if (patch.bodyEn !== undefined) set.bodyEn = patch.bodyEn || null;
  if (patch.mediaId !== undefined) set.mediaId = patch.mediaId;
  if (patch.sourceId !== undefined) set.sourceId = patch.sourceId;
  if (patch.trust !== undefined) set.trust = patch.trust;
  const after = firstRow(
    await tx
      .update(cards)
      .set({ ...set, updatedAt: touched })
      .where(eq(cards.id, id))
      .returning(),
  );
  await tx
    .update(sites)
    .set({ updatedAt: touched })
    .where(inArray(sites.id, tx.select({ id: storyBlocks.siteId }).from(storyBlocks).where(eq(storyBlocks.cardId, id))));
  await recordAudit(tx, { actorId: ctx.actorId, action: "card.update", entityType: "card", entityId: id, before, after, requestId: ctx.requestId });
  return toCardDto(after, (await cardUsage(tx, [id])).get(id) ?? 0);
}
