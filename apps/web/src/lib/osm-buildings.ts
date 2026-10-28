/**
 * Pure geometry behind the map's own OSM building layer. Vector tiles in this region deliver buildings as
 * merged groups (MultiPolygon) without a stable id, so the style's `building_3d` cannot hide a single
 * building: groups are split here, tile duplicates dropped, and the buildings under a placed model removed.
 */
export type LngLat = [number, number];
export type Ring = LngLat[];
export interface MapPoint {
  lng: number;
  lat: number;
}
/** Horizontal extent in metres, relative to the base point (`ModelBase.footprint`). */
export interface Bounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}
export interface Placed {
  lng: number;
  lat: number;
  headingDeg: number;
  scale: number;
}
/** What one placed model says about the buildings around it. */
export interface HideRule {
  /** The model's footprint on the ground. Only models that are drawn make a rule. */
  footprint: Ring;
  hiddenPoints: MapPoint[];
  keptPoints: MapPoint[];
}
export interface Building {
  /** Polygon rings as in GeoJSON: outer ring first, then holes. */
  polygon: Ring[];
  /** Height and base in metres (`render_height`, `render_min_height`). */
  height: number;
  base: number;
}
export interface TileFeature {
  geometry: { type: string; coordinates?: unknown };
  properties?: Record<string, unknown> | null;
}

export const M_PER_DEG_LNG = 111_320;
export const M_PER_DEG_LAT = 110_540;
/** Margin around the model's footprint, in metres. */
export const FOOTPRINT_PAD_M = 3;
/** A building this much larger than a model's footprint is a roof spanning more than the model (a bazaar); it stays. */
export const AUTO_HIDE_AREA_RATIO = 1.6;

/**
 * The model's bounding rectangle (scaled, with `pad` added, turned by the heading) as lng/lat corners.
 * The model's x axis points east and z south; a heading of 90° turns the model clockwise from above.
 */
export function footprintRing(
  at: Placed,
  bounds: Bounds,
  pad: number = FOOTPRINT_PAD_M,
): Ring {
  const a = (-at.headingDeg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const x0 = bounds.minX * at.scale - pad;
  const x1 = bounds.maxX * at.scale + pad;
  const z0 = bounds.minZ * at.scale - pad;
  const z1 = bounds.maxZ * at.scale + pad;
  return (
    [
      [x0, z0],
      [x1, z0],
      [x1, z1],
      [x0, z1],
    ] as const
  ).map(([x, z]) => {
    const east = x * cos + z * sin;
    const south = -x * sin + z * cos;
    return [
      at.lng + east / (M_PER_DEG_LNG * Math.cos((at.lat * Math.PI) / 180)),
      at.lat - south / M_PER_DEG_LAT,
    ];
  });
}

/** Area of a ring in square metres (shoelace over degrees, scaled at the ring's latitude). */
export function ringAreaM2(ring: Ring): number {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++)
    sum += (ring[j]![0] - ring[i]![0]) * (ring[j]![1] + ring[i]![1]);
  return (
    Math.abs(sum / 2) *
    M_PER_DEG_LNG *
    M_PER_DEG_LAT *
    Math.cos(((ring[0]?.[1] ?? 0) * Math.PI) / 180)
  );
}

/** Ray casting; a point on the edge may count either way. */
export function pointInRing(point: LngLat, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    if (
      yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi
    )
      inside = !inside;
  }
  return inside;
}

/** Average of the corners (a closed ring's repeated first point counts once). */
export function meanPoint(ring: Ring): LngLat {
  const corners =
    ring.length > 1 &&
    ring[0]![0] === ring[ring.length - 1]![0] &&
    ring[0]![1] === ring[ring.length - 1]![1]
      ? ring.slice(0, -1)
      : ring;
  let x = 0;
  let y = 0;
  for (const [px, py] of corners) {
    x += px;
    y += py;
  }
  return [x / corners.length, y / corners.length];
}

/**
 * Buildings of the loaded tile features: MultiPolygons split into one building per polygon, rings under
 * four points skipped, and a building that reached us from two tiles (same corner count and mean) kept once.
 */
export function splitBuildings(features: Iterable<TileFeature>): Building[] {
  const seen = new Set<string>();
  const out: Building[] = [];
  for (const f of features) {
    const g = f.geometry;
    const polygons =
      g.type === "Polygon"
        ? [g.coordinates as Ring[]]
        : g.type === "MultiPolygon"
          ? (g.coordinates as Ring[][])
          : [];
    const height = Number(f.properties?.render_height) || 0;
    const base = Number(f.properties?.render_min_height) || 0;
    for (const polygon of polygons) {
      const outer = polygon[0];
      if (!outer || outer.length < 4) continue;
      const [mx, my] = meanPoint(outer);
      const key = `${outer.length}:${mx.toFixed(6)},${my.toFixed(6)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ polygon, height, base });
    }
  }
  return out;
}

/**
 * Whether a building is left out of the map.
 * 1. A building holding a `hiddenPoints` point is hidden.
 * 2. Otherwise a building holding a `keptPoints` point stays, even where the automatic rule would hide it.
 * 3. Otherwise a building is hidden when its mean point lies in a loaded model's footprint and its area is
 *    below `AUTO_HIDE_AREA_RATIO` times that footprint's area.
 * Points of one model's rule speak for that model only: another model's footprint still hides what it covers.
 */
export function isHidden(outer: Ring, rules: readonly HideRule[]): boolean {
  const holds = (points: MapPoint[]) =>
    points.some((p) => pointInRing([p.lng, p.lat], outer));
  if (rules.some((r) => holds(r.hiddenPoints))) return true;
  const mean = meanPoint(outer);
  let area: number | undefined;
  return rules.some((r) => {
    if (!pointInRing(mean, r.footprint) || holds(r.keptPoints)) return false;
    area ??= ringAreaM2(outer);
    return area < AUTO_HIDE_AREA_RATIO * ringAreaM2(r.footprint);
  });
}

/** GeoJSON feature of a building: `h` and `b` for the extrusion, `i` its place in `buildings` (what a click on it names). */
const feature = (b: Building, i: number): GeoJSON.Feature<GeoJSON.Polygon> => ({
  type: "Feature",
  properties: { h: b.height, b: b.base, i },
  geometry: { type: "Polygon", coordinates: b.polygon },
});

/** GeoJSON features for the buildings that stay. */
export function visibleBuildings(
  buildings: readonly Building[],
  rules: readonly HideRule[],
): GeoJSON.Feature<GeoJSON.Polygon>[] {
  return buildings.flatMap((b, i) =>
    isHidden(b.polygon[0]!, rules) ? [] : [feature(b, i)],
  );
}

/** GeoJSON features for the buildings the rules leave out: the panel preview paints them red. */
export function hiddenBuildings(
  buildings: readonly Building[],
  rules: readonly HideRule[],
): GeoJSON.Feature<GeoJSON.Polygon>[] {
  return buildings.flatMap((b, i) =>
    isHidden(b.polygon[0]!, rules) ? [feature(b, i)] : [],
  );
}

/** Centre of gravity of a ring (the mean of the corners when the ring has no area). */
export function ringCentroid(ring: Ring): LngLat {
  // Relative to the first corner: degrees are large next to the building, products would lose it.
  const [ox, oy] = ring[0] ?? [0, 0];
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xj = ring[j]![0] - ox;
    const yj = ring[j]![1] - oy;
    const xi = ring[i]![0] - ox;
    const yi = ring[i]![1] - oy;
    const cross = xj * yi - xi * yj;
    area += cross;
    cx += (xj + xi) * cross;
    cy += (yj + yi) * cross;
  }
  return Math.abs(area) < 1e-18
    ? meanPoint(ring)
    : [ox + cx / (3 * area), oy + cy / (3 * area)];
}

/**
 * Direction of a ring's longest edge as a heading (clockwise from north), reduced to 0 ≤ x < 90: a
 * building's long side says which of the four right-angle headings the model has, not which one.
 */
export function longestEdgeHeading(ring: Ring): number {
  const cos = Math.cos(((ring[0]?.[1] ?? 0) * Math.PI) / 180);
  let best = 0;
  let heading = 0;
  for (let i = 1; i < ring.length; i++) {
    const east = (ring[i]![0] - ring[i - 1]![0]) * M_PER_DEG_LNG * cos;
    const north = (ring[i]![1] - ring[i - 1]![1]) * M_PER_DEG_LAT;
    const length = Math.hypot(east, north);
    if (length <= best) continue;
    best = length;
    heading = (Math.atan2(east, north) * 180) / Math.PI;
  }
  return ((heading % 90) + 90) % 90;
}

/**
 * The hand-picked points after the editor hides or shows one building (`outer`, clicked at `at`):
 * the points inside it that say the opposite are dropped, and a point is added only when the rules
 * would still leave the building in the wrong state.
 */
export function setBuildingHidden(
  outer: Ring,
  rule: HideRule,
  hide: boolean,
  at: LngLat,
): Pick<HideRule, "hiddenPoints" | "keptPoints"> {
  const inside = (p: MapPoint) => pointInRing([p.lng, p.lat], outer);
  const point = { lng: at[0], lat: at[1] };
  let { hiddenPoints, keptPoints } = rule;
  if (hide) keptPoints = keptPoints.filter((p) => !inside(p));
  else hiddenPoints = hiddenPoints.filter((p) => !inside(p));
  const hidden = isHidden(outer, [{ ...rule, hiddenPoints, keptPoints }]);
  if (hide && !hidden) hiddenPoints = [...hiddenPoints, point];
  if (!hide && hidden) keptPoints = [...keptPoints, point];
  return { hiddenPoints, keptPoints };
}

/** A point inside the ring: its centroid, or for a bent shape the middle of the widest stretch on the centroid's latitude. */
export function interiorPoint(ring: Ring): LngLat {
  const centroid = ringCentroid(ring);
  if (pointInRing(centroid, ring)) return centroid;
  const y = centroid[1];
  const xs: number[] = [];
  for (let i = 1; i < ring.length; i++) {
    const [x0, y0] = ring[i - 1]!;
    const [x1, y1] = ring[i]!;
    if (y0 > y !== y1 > y) xs.push(x0 + ((y - y0) * (x1 - x0)) / (y1 - y0));
  }
  xs.sort((a, b) => a - b);
  let best: LngLat = ring[0] ?? centroid;
  let width = -1;
  for (let i = 0; i + 1 < xs.length; i += 2)
    if (xs[i + 1]! - xs[i]! > width) {
      width = xs[i + 1]! - xs[i]!;
      best = [(xs[i]! + xs[i + 1]!) / 2, y];
    }
  return best;
}
