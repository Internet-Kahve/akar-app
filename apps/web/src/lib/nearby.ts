export type LngLat = [number, number];

/** Beyond this distance from the city centre «Yakınımda» has nothing to offer and the home view returns. */
export const NEAR_CITY_MAX_M = 30_000;

const EARTH_RADIUS_M = 6_371_000;
const radians = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in metres. */
export function distanceM([lng1, lat1]: LngLat, [lng2, lat2]: LngLat) {
  const dLat = radians(lat2 - lat1),
    dLng = radians(lng2 - lng1),
    h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(radians(lat1)) *
        Math.cos(radians(lat2)) *
        Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** A copy of `sites`, nearest first. The position stays on the device: this runs in the browser only. */
export function nearestFirst<T extends { coordinates: LngLat }>(
  sites: T[],
  from: LngLat,
) {
  return sites
    .map((site) => [distanceM(from, site.coordinates), site] as const)
    .sort((a, b) => a[0] - b[0])
    .map(([, site]) => site);
}

/** The city record whose map centre is nearest to `center`; `null` when no city has a map view. */
export function nearestCity<T extends { map: { center: LngLat } | null }>(
  cities: T[],
  center: LngLat,
) {
  let best: T | null = null,
    bestDistance = Infinity;
  for (const city of cities) {
    if (!city.map) continue;
    const distance = distanceM(center, city.map.center);
    if (distance < bestDistance) {
      best = city;
      bestDistance = distance;
    }
  }
  return best;
}
