import { normalize } from "@akar/domain";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import type { CityConfig } from "./cities.ts";

/**
 * Where a draft's coordinates came from, best first. The approximate ones (a point on the street,
 * the neighbourhood centre) are reported as "konum yaklaşık" and blocked from publishing by a DB CHECK.
 */
export type LocationSource = "osm" | "overpass" | "nominatim" | "nominatim-address" | "nominatim-street" | "nominatim-neighbourhood";
/** A street segment or neighbourhood centre, not the building: reported apart and blocked from publishing. */
export const APPROXIMATE_SOURCES: readonly LocationSource[] = ["nominatim-street", "nominatim-neighbourhood"];

export type GeoHit = { location: [number, number]; source: LocationSource };
export type GeocodeRequest = { name: string; district: string | null; address: string | null; nameSuspect: boolean };
export type Geocoder = { locate(req: GeocodeRequest): Promise<GeoHit | null> };
export type LngLat = [number, number];

/** Turkish possessive head nouns → bare form ("Geyve Hanı" ≈ "Geyve Han"); keys are normalize()d. */
const BARE_HEAD: Record<string, string> = {
  camii: "cami",
  hani: "han",
  hamami: "hamam",
  turbesi: "turbe",
  medresesi: "medrese",
  cesmesi: "cesme",
  mescidi: "mescit",
  mescid: "mescit",
  tekkesi: "tekke",
  kulliyesi: "kulliye",
  bedesteni: "bedesten",
  koprusu: "kopru",
  imareti: "imaret",
  dergahi: "dergah",
  zaviyesi: "zaviye",
};

/**
 * Comparable building name: normalized, parentheticals and "ve Haziresi"-style tails dropped,
 * every word in bare form, final d/t folded ("Mehmed" ≈ "Mehmet").
 * `Kaygan (Kayhan) Camii ve Haziresi` → `kaygan cami`.
 */
export function nameKey(name: string): string {
  return normalize(name)
    .replace(/\([^)]*\)?/g, " ")
    .replace(/\bve (haziresi|kabri|turbesi|minaresi)\b.*$/, " ")
    .split(/[^\p{L}0-9]+/u)
    .filter(Boolean)
    .map((w) => (BARE_HEAD[w] ?? w).replace(/d$/, "t"))
    .join(" ");
}

function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]!;
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const up = prev[j]!;
      prev[j] = Math.min(prev[j]! + 1, prev[j - 1]! + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = up;
    }
  }
  return 1 - prev[b.length]! / Math.max(a.length, b.length);
}

/** Matches the curated OSM table (`osm_secilen.csv`: slug, ad, merkez_lat, merkez_lon). */
export function osmMatcher(rows: Record<string, string>[]): (name: string) => LngLat | null {
  const entries = rows.flatMap((r) => {
    const lat = Number(r.merkez_lat);
    const lng = Number(r.merkez_lon);
    if (!r.slug || !Number.isFinite(lat) || !Number.isFinite(lng)) return [];
    return [{ slug: r.slug.replaceAll("-", " "), key: nameKey(r.ad ?? ""), location: [lng, lat] as LngLat }];
  });
  return (name) => {
    const key = nameKey(name);
    if (!key) return null;
    const slug = normalize(name).replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
    return entries.find((e) => e.key === key || e.slug === slug || e.slug.startsWith(`${slug} `))?.location ?? null;
  };
}

// ── Overpass: bulk OSM objects per district, matched locally ───────────────────

export type OsmPlace = { name: string; district: string; location: LngLat };

/** Min. similarity of `nameKey`s; the best candidate must also beat the runner-up by `MARGIN`. */
const MIN_SIMILARITY = 0.85;
const MARGIN = 0.05;

/**
 * Fuzzy name match within the row's district (whole city when the district is unknown).
 * The building type word must agree ("… Cami" never matches "… Türbe"), and an ambiguous best
 * match is rejected rather than guessed.
 */
export function overpassMatcher(places: OsmPlace[]): (name: string, district: string | null) => LngLat | null {
  const indexed = places.map((p) => ({ ...p, key: nameKey(p.name), districtKey: normalize(p.district) }));
  return (name, district) => {
    const key = nameKey(name);
    const head = key.split(" ").at(-1);
    if (!key.includes(" ")) return null;
    const pool = district ? indexed.filter((p) => p.districtKey === normalize(district)) : indexed;
    const scored = pool
      .filter((p) => p.key.split(" ").at(-1) === head)
      .map((p) => ({ p, s: similarity(key, p.key) }))
      .filter((x) => x.s >= MIN_SIMILARITY)
      .sort((a, b) => b.s - a.s);
    const [best, next] = scored;
    if (!best) return null;
    // Same object mapped twice (node + building way) is not ambiguity.
    const sameSpot = next && Math.abs(next.p.location[0] - best.p.location[0]) + Math.abs(next.p.location[1] - best.p.location[1]) < 0.002;
    return !next || sameSpot || best.s - next.s >= MARGIN ? best.p.location : null;
  };
}

/** Named OSM objects that can be an inventory building. */
const OVERPASS_FILTERS = [
  `["amenity"~"^(place_of_worship|fountain|public_bath|drinking_water|marketplace|grave_yard|school|library)$"]`,
  `["historic"]`,
  `["building"~"^(mosque|church|public|civic|commercial|retail)$"]`,
  `["tourism"~"^(attraction|museum)$"]`,
  `["landuse"="cemetery"]`,
  `["man_made"="bridge"]`,
];

const overpassQuery = (city: CityConfig, district: string, filters: string[]) => `[out:json][timeout:180];
area["boundary"="administrative"]["admin_level"="4"]["name"="${city.name}"]->.c;
area["boundary"="administrative"]["admin_level"="6"]["name"="${district}"](area.c)->.d;
(
${filters.map((f) => `  nwr(area.d)["name"]${f};`).join("\n")}
);
out center tags;`;

type OverpassBody = { elements: { lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: { name?: string } }[] };

/**
 * Downloads named heritage-like OSM objects for each district and caches them in one JSON file.
 * One request per district; if the public server keeps failing on a big district, the filters
 * are fetched one by one. `offline` uses the cache only; a failed district is retried next run.
 */
export async function loadOverpassPlaces(opts: {
  city: CityConfig;
  districts: string[];
  endpoint: string;
  cacheFile: string;
  offline: boolean;
  fetchFn?: typeof fetch;
  log?: (msg: string) => void;
}): Promise<{ places: OsmPlace[]; fetched: number; failed: string[] }> {
  const fetchFn = opts.fetchFn ?? fetch;
  let cache: Record<string, OsmPlace[]> = {};
  try {
    cache = JSON.parse(await readFile(opts.cacheFile, "utf8")) as Record<string, OsmPlace[]>;
  } catch {
    /* first run */
  }
  let fetched = 0;

  /** POST with backoff: the public instance answers 429/502/503/504 under load. */
  async function query(district: string, filters: string[]): Promise<OsmPlace[]> {
    let res: Response | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (fetched) await sleep(attempt ? 15_000 * attempt : 2000);
      fetched++;
      res = await fetchFn(opts.endpoint, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded", "user-agent": "akar-ingest/0.1 (github.com/Internet-Kahve/akar-app)" },
        body: new URLSearchParams({ data: overpassQuery(opts.city, district, filters) }),
      });
      if (![429, 502, 503, 504].includes(res.status)) break;
    }
    if (!res?.ok) throw new Error(`Overpass HTTP ${res?.status}`);
    const body = (await res.json()) as OverpassBody;
    return body.elements.flatMap((e) => {
      const lat = e.lat ?? e.center?.lat;
      const lon = e.lon ?? e.center?.lon;
      return e.tags?.name && lat !== undefined && lon !== undefined ? [{ name: e.tags.name, district, location: [lon, lat] as LngLat }] : [];
    });
  }

  const failed: string[] = [];
  for (const district of opts.districts) {
    if (cache[district] || opts.offline) continue;
    opts.log?.(`Overpass: ${district}…`);
    try {
      try {
        cache[district] = await query(district, OVERPASS_FILTERS);
      } catch {
        opts.log?.(`Overpass: ${district} parça parça…`);
        const parts: OsmPlace[] = [];
        for (const f of OVERPASS_FILTERS) parts.push(...(await query(district, [f])));
        cache[district] = parts;
      }
      await mkdir(dirname(opts.cacheFile), { recursive: true });
      await writeFile(opts.cacheFile, JSON.stringify(cache));
    } catch (err) {
      failed.push(`${district} (${err instanceof Error ? err.message : String(err)})`);
    }
  }
  return { places: opts.districts.flatMap((d) => cache[d] ?? []), fetched, failed };
}

// ── Nominatim ─────────────────────────────────────────────────────────────────

type Candidate = { lat: string; lon: string; category: string; type: string };
type Cache = Record<string, Candidate[]>;
export type CandidateFilter = (c: Candidate) => boolean;

/** A named building must resolve to a building-like object, never to a street named after it. */
const BUILDING_CATEGORIES = new Set(["amenity", "historic", "building", "tourism", "man_made", "bridge"]);

export const ACCEPT = {
  building: (c: Candidate) => BUILDING_CATEGORIES.has(c.category),
  /** Address search: only a house number or building hit, never the street's midpoint. */
  address: (c: Candidate) => c.category === "building" || (c.category === "place" && c.type === "house"),
  /** Street found but not the house number: a point on the street, approximate. */
  street: (c: Candidate) => c.category === "highway",
  area: (c: Candidate) => c.category === "place" || c.category === "boundary",
} satisfies Record<string, CandidateFilter>;

export type NominatimStats = { network: number; cached: number; errors: number };

export type Nominatim = {
  /**
   * Free-form (`{ q }`) or structured (`{ street, county, state }`) search; first candidate the
   * filter accepts inside the city bbox, or null (also on network errors, which are not cached).
   */
  search(params: Record<string, string>, city: CityConfig, accept: CandidateFilter): Promise<LngLat | null>;
  /** Persists new cache entries. */
  flush(): Promise<void>;
  stats: NominatimStats;
};

/**
 * Nominatim search with a JSON file cache and ≥1 s between network calls (usage policy).
 * Results are limited to the city bbox. `offline` answers from the cache only.
 * A 429 or 403 stops further network use for the run.
 */
export function createNominatim(opts: {
  baseUrl: string;
  email?: string | undefined;
  cacheFile: string;
  offline: boolean;
  minIntervalMs?: number;
  fetchFn?: typeof fetch;
}): Nominatim {
  const fetchFn = opts.fetchFn ?? fetch;
  const interval = opts.minIntervalMs ?? 1100;
  const stats: NominatimStats = { network: 0, cached: 0, errors: 0 };
  let cache: Cache | undefined;
  let dirty = 0;
  let lastCall = 0;
  let blocked = opts.offline;

  async function load(): Promise<Cache> {
    if (cache) return cache;
    try {
      cache = JSON.parse(await readFile(opts.cacheFile, "utf8")) as Cache;
    } catch {
      cache = {};
    }
    return cache;
  }

  async function flush(): Promise<void> {
    if (!cache || !dirty) return;
    await mkdir(dirname(opts.cacheFile), { recursive: true });
    await writeFile(opts.cacheFile, JSON.stringify(cache, null, 1));
    dirty = 0;
  }

  async function candidates(params: Record<string, string>, city: CityConfig): Promise<Candidate[] | null> {
    const c = await load();
    // Free-form queries are keyed by their text (older cache entries), structured ones by JSON.
    const key = params.q ?? JSON.stringify(Object.entries(params).sort());
    if (key in c) {
      stats.cached++;
      return c[key] ?? [];
    }
    if (blocked) return null;

    const wait = lastCall + interval - Date.now();
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();
    const [minLng, minLat, maxLng, maxLat] = city.bbox;
    const url = new URL("/search", opts.baseUrl);
    url.search = new URLSearchParams({
      ...params,
      format: "jsonv2",
      countrycodes: "tr",
      limit: "5",
      viewbox: `${minLng},${maxLat},${maxLng},${minLat}`,
      bounded: "1",
      "accept-language": "tr",
      ...(opts.email ? { email: opts.email } : {}),
    }).toString();

    try {
      stats.network++;
      const res = await fetchFn(url, { headers: { "user-agent": "akar-ingest/0.1 (heritage app import; github.com/Internet-Kahve/akar-app)" } });
      if (res.status === 429 || res.status === 403) blocked = true;
      if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
      const body = (await res.json()) as Candidate[];
      c[key] = body.map(({ lat, lon, category, type }) => ({ lat, lon, category, type }));
      if (++dirty >= 10) await flush();
      return c[key];
    } catch {
      stats.errors++;
      return null;
    }
  }

  async function search(params: Record<string, string>, city: CityConfig, accept: CandidateFilter): Promise<LngLat | null> {
    const hit = (await candidates(params, city))?.find(accept);
    if (!hit) return null;
    const [lng, lat] = [Number(hit.lon), Number(hit.lat)];
    const [minLng, minLat, maxLng, maxLat] = city.bbox;
    return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat ? [lng, lat] : null;
  }

  return { search, flush, stats };
}

// ── address parsing ───────────────────────────────────────────────────────────

const stripParens = (text: string) => text.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ");

/** Neighbourhood named in a free-text inventory address: "…, Tuzpazarı (Demirtaşpaşa) Mahallesi, …" → "Tuzpazarı". */
export function neighbourhoodOf(address: string | null): string | null {
  return (address && stripParens(address).match(/([\p{Lu}][\p{L}]*(?:\s[\p{Lu}][\p{L}]*)*)\s+Mahalle/u)?.[1]) || null;
}

/** Street and house number: "…, Tahal Caddesi, No:28’de …" → `28 Tahal Caddesi`. */
export function streetAddressOf(address: string | null): string | null {
  const m = address
    ? stripParens(address).match(
        /([\p{Lu}][\p{L}.]*(?:\s[\p{Lu}0-9][\p{L}.]*)*\s(?:Caddesi|Cad\.|Sokak|Sokağı|Sk\.|Bulvarı|Çıkmazı))[^,]*?,?\s*No\s*:?\s*(\d+)/u,
      )
    : null;
  return m ? `${m[2]} ${m[1]}` : null;
}

/** Display spelling of bare head nouns for free-form search ("Geyve Hanı" → "Geyve Han"). */
const BARE_DISPLAY: Record<string, string> = {
  Camii: "Cami",
  Hanı: "Han",
  Hamamı: "Hamam",
  Türbesi: "Türbe",
  Medresesi: "Medrese",
  Çeşmesi: "Çeşme",
  Mescidi: "Mescit",
  Tekkesi: "Tekke",
  Külliyesi: "Külliye",
  Bedesteni: "Bedesten",
  Köprüsü: "Köprü",
  İmareti: "İmaret",
};

/** Free-form search spellings: parentheticals and "ve Haziresi"-style tails dropped, then the bare head noun. */
export function nameQueries(name: string): string[] {
  const base = stripParens(name)
    .replace(/\s+ve\s+(Haziresi|Kabri|Türbesi|Minaresi)\b.*$/u, "")
    .trim();
  const bare = base.replace(/(\p{L}+)$/u, (w) => BARE_DISPLAY[w] ?? w);
  return [...new Set([base, bare])].filter(Boolean);
}

// ── composition ───────────────────────────────────────────────────────────────

/**
 * Order: curated OSM table → Overpass bulk match → Nominatim by name (skipped for suspect
 * names, which are extraction fragments) → Nominatim by street address (house-level hit exact,
 * street-only hit approximate) → Nominatim neighbourhood centre (approximate).
 * Null = "konum bulunamadı".
 */
export function createGeocoder(
  city: CityConfig,
  sources: { osm: (name: string) => LngLat | null; overpass?: (name: string, district: string | null) => LngLat | null; nominatim?: Nominatim },
): Geocoder {
  const { osm, overpass, nominatim } = sources;
  return {
    async locate({ name, district, address, nameSuspect }) {
      const fromOsm = osm(name);
      if (fromOsm) return { location: fromOsm, source: "osm" };
      const fromOverpass = nameSuspect ? null : overpass?.(name, district);
      if (fromOverpass) return { location: fromOverpass, source: "overpass" };
      if (!nominatim) return null;

      const place = [district, city.name, "Türkiye"].filter(Boolean).join(", ");
      if (!nameSuspect) {
        for (const q of nameQueries(name)) {
          const hit = await nominatim.search({ q: `${q}, ${place}` }, city, ACCEPT.building);
          if (hit) return { location: hit, source: "nominatim" };
        }
      }

      const street = streetAddressOf(address);
      if (street && district) {
        // Same cached response; only the accepted result class differs.
        const params = { street, county: district, state: city.name, country: "Türkiye" };
        const house = await nominatim.search(params, city, ACCEPT.address);
        if (house) return { location: house, source: "nominatim-address" };
        const onStreet = await nominatim.search(params, city, ACCEPT.street);
        if (onStreet) return { location: onStreet, source: "nominatim-street" };
      }

      const hood = neighbourhoodOf(address);
      if (!hood) return null;
      const hit = await nominatim.search({ q: `${hood} Mahallesi, ${place}` }, city, ACCEPT.area);
      return hit ? { location: hit, source: "nominatim-neighbourhood" } : null;
    },
  };
}
