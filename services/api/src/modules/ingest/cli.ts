import { parseArgs } from "node:util";
import { loadConfig } from "../../config.ts";
import { createDb } from "../../db/client.ts";
import { CITIES } from "./cities.ts";
import { parseCsv } from "./csv.ts";
import { createGeocoder, createNominatim, loadOverpassPlaces, osmMatcher, overpassMatcher } from "./geocode.ts";
import { DEFAULT_DATASET_REF, geocodeCacheFile, presentDistricts, readDatasetFile } from "./network-geocoder.ts";
import { commitImport, formatReport, planImport } from "./service.ts";

// npm run ingest -- --city bursa [--dry-run] [--offline] [--include-toc] [--verbose] [--data <dir>] [--ref origin/main]
const { values } = parseArgs({
  options: {
    city: { type: "string" },
    "dry-run": { type: "boolean", default: false },
    offline: { type: "boolean", default: false },
    "include-toc": { type: "boolean", default: false },
    data: { type: "string" },
    ref: { type: "string", default: DEFAULT_DATASET_REF },
    verbose: { type: "boolean", default: false },
  },
});

const city = values.city ? CITIES[values.city] : undefined;
if (!city) {
  console.error(`--city gerekli: ${Object.keys(CITIES).join(", ")}`);
  process.exit(2);
}

const datasetFile = (path: string) => readDatasetFile(path, { dir: values.data, ref: values.ref });

const config = loadConfig();
const { db, pool } = createDb(config.DATABASE_URL);
const nominatim = createNominatim({
  baseUrl: config.NOMINATIM_URL,
  email: config.NOMINATIM_EMAIL,
  cacheFile: geocodeCacheFile("geocode", city),
  offline: values.offline,
});

try {
  const [inventory, osm] = await Promise.all([datasetFile(city.dataset.inventory), datasetFile(city.dataset.osm)]);
  const rows = parseCsv(inventory);
  const overpass = await loadOverpassPlaces({
    city,
    districts: presentDistricts(city, rows),
    endpoint: config.OVERPASS_URL,
    cacheFile: geocodeCacheFile("overpass", city),
    offline: values.offline,
    log: (m) => console.error(m),
  });
  const geocoder = createGeocoder(city, {
    osm: osmMatcher(parseCsv(osm)),
    overpass: overpassMatcher(overpass.places),
    nominatim,
  });
  const plan = await planImport(db, { city, rows, geocoder, includeToc: values["include-toc"] });
  await nominatim.flush();

  console.log(formatReport(plan.report));
  console.log(
    `\nAğ: Overpass ${overpass.fetched} istek, ${overpass.places.length} OSM nesnesi${overpass.failed.length ? `, başarısız ilçe: ${overpass.failed.join(", ")}` : ""} · ` +
      `Nominatim ${nominatim.stats.network} istek, ${nominatim.stats.cached} önbellek, ${nominatim.stats.errors} hata`,
  );
  if (values.verbose) {
    for (const it of plan.items.filter((x) => x.status !== "ready" || x.nameSuspect || x.nameWarning || x.possibleDuplicateOf)) {
      const flags = [
        it.nameSuspect && "ad-şüpheli",
        it.nameWarning && "ad-uyarı",
        it.possibleDuplicateOf && `olası-kopya:${it.possibleDuplicateOf}`,
        it.suggestedName && `öneri:"${it.suggestedName}"`,
      ].filter(Boolean);
      console.log(`  ${it.sourceRowId || `#${it.row}`} ${it.status} ${flags.join(" ")} · ${it.name} · ${it.district ?? "ilçe yok"} · ${it.typeId ?? "tür yok"} · ${it.locationSource ?? "-"}`);
    }
  }

  if (values["dry-run"]) {
    console.log("\nDeneme: veritabanına yazılmadı.");
  } else {
    const { inserted } = await commitImport(db, plan);
    console.log(`\n${inserted} taslak eklendi (Tier 1, yayında değil).`);
  }
} finally {
  await pool.end();
}
