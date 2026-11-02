import type { HeritageSite, HistoryImage, HistoryViewpoint } from "@akar/domain";
import { distanceM, type LngLat } from "./nearby";

/** Length of the drawn view and the farthest a site still counts as seen, in metres. */
export const CONE_RADIUS_M = 220;
export const FAR_VIEW_M = 1_500;
const CONE_STEPS = 12;
const METRES_PER_DEGREE_LAT = 110_540;
const metresPerDegreeLng = (lat: number) =>
  111_320 * Math.cos((lat * Math.PI) / 180);

/** Distance on the flat local plane the bearings use (the prototype's `mesafeYon`): the «N m uzaktan» it shows. */
function flatDistanceM([lng1, lat1]: LngLat, [lng2, lat2]: LngLat) {
  return Math.hypot((lng2 - lng1) * metresPerDegreeLng(lat1), (lat2 - lat1) * METRES_PER_DEGREE_LAT);
}

/** The bearing from one point to another, clockwise from north. */
export function bearingTo([lng1, lat1]: LngLat, [lng2, lat2]: LngLat) {
  const east = (lng2 - lng1) * metresPerDegreeLng(lat1),
    north = (lat2 - lat1) * METRES_PER_DEGREE_LAT;
  return ((Math.atan2(east, north) * 180) / Math.PI + 360) % 360;
}

/** Polygon ring of the view from a viewpoint. */
export function viewCone(v: HistoryViewpoint, radiusM = CONE_RADIUS_M) {
  const ring: LngLat[] = [[v.lng, v.lat]];
  for (let i = 0; i <= CONE_STEPS; i++) {
    const a =
      ((v.bearingDeg - v.fieldDeg / 2 + (v.fieldDeg * i) / CONE_STEPS) *
        Math.PI) /
      180;
    ring.push([
      v.lng + (Math.sin(a) * radiusM) / metresPerDegreeLng(v.lat),
      v.lat + (Math.cos(a) * radiusM) / METRES_PER_DEGREE_LAT,
    ]);
  }
  ring.push([v.lng, v.lat]);
  return ring;
}

/** Length of the drawn view: a little past the site it shows, within 90–700 m (the prototype's `koni` radius). */
export function coneReach(v: HistoryViewpoint, site: LngLat) {
  return Math.min(700, Math.max(90, distanceM([v.lng, v.lat], site) * 1.15));
}

/** Whether `point` lies in the view, up to `reachM`; `slackDeg` widens each side of the view. */
export function sees(v: HistoryViewpoint, point: LngLat, reachM = FAR_VIEW_M, slackDeg = 0) {
  const from: LngLat = [v.lng, v.lat];
  if (distanceM(from, point) > reachM) return false;
  const off = Math.abs(((bearingTo(from, point) - v.bearingDeg + 540) % 360) - 180);
  return off <= v.fieldDeg / 2 + slackDeg;
}

export interface FarView {
  site: HeritageSite;
  image: HistoryImage;
  distance: number;
}

/** Photographs of other sites in whose view this site stands, nearest first. */
export function seenFrom(site: HeritageSite, others: HeritageSite[], limit = 4) {
  const found: FarView[] = [];
  for (const other of others) {
    if (other.id === site.id) continue;
    for (const image of other.historyImages ?? []) {
      const v = image.viewpoint;
      // 5° of slack each side, as the prototype's «Uzaktan görünüyor» list: a site at the edge of the frame still shows.
      if (v && !v.interior && sees(v, site.coordinates, FAR_VIEW_M, 5))
        found.push({
          site: other,
          image,
          distance: Math.round(flatDistanceM([v.lng, v.lat], site.coordinates)),
        });
    }
  }
  return found.sort((a, b) => a.distance - b.distance).slice(0, limit);
}
