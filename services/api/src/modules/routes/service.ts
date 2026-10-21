import { normalize } from "@akar/domain";
import { and, asc, eq, inArray, sql, type SQL } from "drizzle-orm";
import type { Db } from "../../db/client.ts";
import { catalogRoutes, cities, historyImages, media, quizzes, routeStops, sites } from "../../db/schema/index.ts";
import { AppError } from "../../errors.ts";
import type { SiteDetail } from "../catalog/schemas.ts";
import { getPublishedSummaries, getSiteDetail } from "../catalog/service.ts";
import { playableQuiz } from "./quizzes.ts";
import type { RouteBundle, RouteDto } from "./schemas.ts";

const published = eq(catalogRoutes.status, "published");

/** Average walking pace used for route duration (4.5 km/h). */
const WALK_METRES_PER_MINUTE = 75;

/** Walking length of each route's published stop chain, in metres (geodesic, PostGIS). */
async function chainLengths(db: Db, routeIds: string[]): Promise<Map<string, number>> {
  const rows = await db
    .select({
      routeId: routeStops.routeId,
      metres: sql<number>`coalesce(ST_Length(ST_MakeLine(${sites.location} ORDER BY ${routeStops.position})::geography), 0)::float8`,
    })
    .from(routeStops)
    .innerJoin(sites, and(eq(sites.id, routeStops.siteId), eq(sites.status, "published")))
    .where(inArray(routeStops.routeId, routeIds))
    .groupBy(routeStops.routeId);
  return new Map(rows.map((r) => [r.routeId, r.metres]));
}

/**
 * Which of `quizIds` are playable, i.e. the quiz's own site is published (same gate as `playableQuiz`).
 * Ids only: neither the quiz content nor `quiz_answers` is read here.
 */
async function playableQuizIds(db: Db, quizIds: string[]): Promise<Set<string>> {
  if (!quizIds.length) return new Set();
  const rows = await db
    .select({ id: quizzes.id })
    .from(quizzes)
    .innerJoin(sites, and(eq(sites.id, quizzes.siteId), eq(sites.status, "published")))
    .where(inArray(quizzes.id, quizIds));
  return new Set(rows.map((r) => r.id));
}

/**
 * Published routes matching `filter`, ordered by id, with ordered stops and computed totals.
 * Stops whose site is not published are never exposed; a stop's quiz is offered only while playable
 * and its history image only when it belongs to the stop's own site.
 */
async function publishedRoutes(db: Db, filter?: SQL): Promise<RouteDto[]> {
  const rows = await db
    .select({ route: catalogRoutes, cityName: cities.name, badgeUrl: media.url, badgeAlt: media.alt })
    .from(catalogRoutes)
    .innerJoin(cities, eq(cities.id, catalogRoutes.cityId))
    .leftJoin(media, eq(media.id, catalogRoutes.badgeMediaId))
    .where(and(published, filter))
    .orderBy(asc(catalogRoutes.id));
  if (!rows.length) return [];

  const routeIds = rows.map((r) => r.route.id);
  const [stops, lengths] = await Promise.all([
    db
      .select({
        routeId: routeStops.routeId,
        position: routeStops.position,
        siteId: routeStops.siteId,
        quizId: routeStops.quizId,
        // The join keeps only an image of the stop's own site; anything else reads as null.
        historyImageId: historyImages.id,
      })
      .from(routeStops)
      .leftJoin(historyImages, and(eq(historyImages.id, routeStops.historyImageId), eq(historyImages.siteId, routeStops.siteId)))
      .where(inArray(routeStops.routeId, routeIds))
      .orderBy(asc(routeStops.routeId), asc(routeStops.position)),
    chainLengths(db, routeIds),
  ]);
  const [summaries, playable] = await Promise.all([
    getPublishedSummaries(db, [...new Set(stops.map((s) => s.siteId))]),
    playableQuizIds(db, [...new Set(stops.flatMap((s) => (s.quizId === null ? [] : [s.quizId])))]),
  ]);

  return rows.map(({ route: r, cityName, badgeUrl, badgeAlt }) => {
    const visible = stops
      .filter((s) => s.routeId === r.id)
      .flatMap((s) => {
        const site = summaries.get(s.siteId);
        return site
          ? [
              {
                position: s.position,
                site,
                quizId: s.quizId !== null && playable.has(s.quizId) ? s.quizId : null,
                historyImageId: s.historyImageId,
              },
            ]
          : [];
      });
    const metres = lengths.get(r.id) ?? 0;
    const narration = visible.reduce((sum, s) => sum + s.site.minutes, 0);
    return {
      id: r.id,
      name: r.name,
      nameEn: r.nameEn,
      description: r.description,
      city: { id: r.cityId, name: cityName },
      minutes: Math.round(metres / WALK_METRES_PER_MINUTE) + narration,
      distance: metres < 1000 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(1).replace(".", ",")} km`,
      distanceMeters: Math.round(metres),
      theme: r.theme,
      badge: r.badgeTitle === null ? null : { title: r.badgeTitle, mediaId: r.badgeMediaId, url: badgeUrl, alt: badgeAlt },
      stops: visible,
    };
  });
}

export async function listRoutes(db: Db, input: { city?: string | undefined }): Promise<RouteDto[]> {
  return publishedRoutes(db, input.city ? eq(catalogRoutes.cityId, normalize(input.city)) : undefined);
}

export async function getRoute(db: Db, id: string): Promise<RouteDto> {
  const [route] = await publishedRoutes(db, eq(catalogRoutes.id, id));
  if (!route) throw new AppError(404, "NOT_FOUND", "Rota bulunamadı.");
  return route;
}

/** The site's detail, or null once it is no longer published (the catalog's 404); other errors propagate. */
async function siteDetailOrNull(db: Db, id: string): Promise<SiteDetail | null> {
  try {
    return await getSiteDetail(db, id);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return null;
    throw err;
  }
}

/**
 * Everything a service worker needs to pre-cache one published route: the route, its published stop
 * sites in stop order, the playable quiz of each stop (never the answer key) and the deduplicated
 * media URLs of all of it, badge included. Unpublished stops and quizzes of unpublished sites are absent.
 */
export async function getRouteBundle(db: Db, id: string): Promise<RouteBundle> {
  const route = await getRoute(db, id);

  // A site unpublished after the route was read is treated like any unpublished stop: the stop, its
  // quiz and its media drop out of the bundle instead of failing it. (Route totals keep the earlier read.)
  const details = await Promise.all(route.stops.map((s) => siteDetailOrNull(db, s.site.id)));
  const stops = route.stops.filter((_, i) => details[i]);
  const siteDetails = details.flatMap((d) => (d ? [d] : []));

  const quizIds = [...new Set(stops.flatMap((s) => (s.quizId === null ? [] : [s.quizId])))];
  const stopQuizzes = await Promise.all(quizIds.map((quizId) => playableQuiz(db, quizId)));

  const assets = new Set(siteDetails.flatMap((d) => d.media.map((m) => m.url)));
  if (route.badge?.url) assets.add(route.badge.url);

  return {
    route: { ...route, stops },
    sites: siteDetails,
    quizzes: stopQuizzes.flatMap((q) => (q ? [q] : [])),
    assets: [...assets],
  };
}
