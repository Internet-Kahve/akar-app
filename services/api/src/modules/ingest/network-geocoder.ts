import { normalize } from "@akar/domain";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { CityConfig } from "./cities.ts";
import { parseCsv } from "./csv.ts";
import { createGeocoder, createNominatim, loadOverpassPlaces, osmMatcher, overpassMatcher, type Geocoder } from "./geocode.ts";

/** Git ref holding the dataset (`docs/documents-context/veri/`). */
export const DEFAULT_DATASET_REF = "origin/docs";

/** Dataset file from `dir` or, without it, from the docs branch `ref` without checking it out. */
export async function readDatasetFile(path: string, from: { dir?: string | undefined; ref: string }): Promise<string> {
  if (from.dir) return readFile(`${from.dir}/${path}`, "utf8");
  return execFileSync("git", ["show", `${from.ref}:docs/documents-context/veri/${path}`], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

/** Per-city geocoder cache file under `services/api/.cache/` (git-ignored). */
export const geocodeCacheFile = (name: "geocode" | "overpass", city: CityConfig) =>
  fileURLToPath(new URL(`../../../.cache/${name}-${city.id}.json`, import.meta.url));

/** The city's districts named in the inventory rows; Overpass is fetched only for these. */
export function presentDistricts(city: CityConfig, rows: Record<string, string>[]): string[] {
  const present = new Set(rows.map((r) => normalize((r.ilce ?? "").replace(/\u0307/g, ""))));
  return city.districts.filter((d) => present.has(normalize(d)));
}

/**
 * The server's import geocoder (`AppDeps.geocoderFor`): the curated OSM list, Overpass for the
 * districts the upload names and Nominatim, the same sources as `npm run ingest`. Overpass and
 * Nominatim answers are cached in `.cache/`, so only a district's first plan waits on the network.
 */
export function networkGeocoderFor(opts: {
  overpassUrl: string;
  nominatimUrl: string;
  nominatimEmail?: string | undefined;
  datasetRef: string;
  log: (msg: string) => void;
}): (city: CityConfig, rows: Record<string, string>[]) => Promise<Geocoder> {
  return async (city, rows) => {
    const osm = parseCsv(await readDatasetFile(city.dataset.osm, { ref: opts.datasetRef }));
    const overpass = await loadOverpassPlaces({
      city,
      districts: presentDistricts(city, rows),
      endpoint: opts.overpassUrl,
      cacheFile: geocodeCacheFile("overpass", city),
      offline: false,
      log: opts.log,
    });
    if (overpass.failed.length) opts.log(`Overpass: başarısız ilçe: ${overpass.failed.join(", ")}`);
    const nominatim = createNominatim({
      baseUrl: opts.nominatimUrl,
      email: opts.nominatimEmail,
      cacheFile: geocodeCacheFile("geocode", city),
      offline: false,
    });
    return createGeocoder(city, { osm: osmMatcher(osm), overpass: overpassMatcher(overpass.places), nominatim });
  };
}
