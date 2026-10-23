import type { CityConfig } from "./cities.ts";
import { bursaOsmCsv } from "./curated-data.ts";
import { parseCsv } from "./csv.ts";
import { createGeocoder, osmMatcher } from "./geocode.ts";

/** Predictable-duration panel import. Unmatched places stay drafts for manual location entry. */
export async function curatedGeocoderFor(city: CityConfig) {
  return createGeocoder(city, { osm: osmMatcher(city.id === "bursa" ? parseCsv(bursaOsmCsv) : []) });
}
