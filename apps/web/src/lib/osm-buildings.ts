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

const M_PER_DEG_LNG = 111_320;
const M_PER_DEG_LAT = 110_540;
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

/** GeoJSON features for the buildings that stay, with `h` and `b` for the extrusion. */
export function visibleBuildings(
  buildings: readonly Building[],
  rules: readonly HideRule[],
): GeoJSON.Feature<GeoJSON.Polygon>[] {
  return buildings
    .filter((b) => !isHidden(b.polygon[0]!, rules))
    .map((b) => ({
      type: "Feature",
      properties: { h: b.height, b: b.base },
      geometry: { type: "Polygon", coordinates: b.polygon },
    }));
}
