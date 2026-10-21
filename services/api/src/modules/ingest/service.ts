import { normalize } from "@akar/domain";
import type { Db } from "../../db/client.ts";
import { existingSiteKeys, insertDraftSites, listSiteTypeAliases, type DraftSite } from "../catalog/drafts.ts";
import { siteDedupeKey, slugify } from "../catalog/service.ts";
import type { CityConfig } from "./cities.ts";
import { APPROXIMATE_SOURCES, nameKey, type Geocoder, type LocationSource } from "./geocode.ts";

/**
 * Inventory import: CSV rows → cleaned names → type/role mapping → duplicate check →
 * geocoding → report → Tier 1 drafts. `planImport` never writes; `commitImport` writes the plan.
 * Decisions behind each rule: docs/BACKEND-DECISIONS.md (İçe aktarma).
 *
 * Buckets are exclusive, first match wins:
 * tocSkipped → duplicate → noLocation → approximate → typeUnclear → ready.
 */

export type ImportStatus = "ready" | "approximate" | "noLocation" | "typeUnclear" | "duplicate" | "tocSkipped";

export type PlannedItem = {
  /** 1-based data row in the CSV (header excluded). */
  row: number;
  /** Row id from the dataset (`id` column, e.g. bursa-042). */
  sourceRowId: string;
  status: ImportStatus;
  name: string;
  /** First address segment that names a building, offered when the name looks broken. */
  suggestedName: string | null;
  district: string | null;
  typeId: string | null;
  tocOnly: boolean;
  /** Data team's flag (`ad_supheli = 1`): the extracted name is wrong. */
  nameSuspect: boolean;
  /** Our heuristic only: the name may be cut or mixed with body text. */
  nameWarning: boolean;
  /** Published site with the same name elsewhere in the city; imported anyway, editor decides. */
  possibleDuplicateOf: string | null;
  locationSource: LocationSource | null;
  /** Null for duplicates and skipped rows. */
  draft: DraftSite | null;
};

export type ImportReport = {
  read: number;
  ready: number;
  approximate: number;
  noLocation: number;
  typeUnclear: number;
  duplicates: number;
  tocSkipped: number;
  possibleDuplicates: number;
  /** Rows dropped because no usable name remained after cleaning. */
  invalid: number;
  nameSuspect: number;
  nameWarning: number;
  locatedBy: Record<LocationSource, number>;
};

export type ImportPlan = { city: CityConfig; items: PlannedItem[]; report: ImportReport };

const TOC_MARK = /\s*\[yalnız içindekiler\]\s*$/u;

/** Cleans an extracted inventory name; table-of-contents-only rows lose their page number. */
export function cleanName(raw: string): { name: string; tocOnly: boolean } {
  let name = raw.normalize("NFC").replace(/\u0307/g, "");
  const tocOnly = TOC_MARK.test(name);
  name = name.replace(TOC_MARK, "");
  if (tocOnly) name = name.replace(/\s+\d+$/, "");
  name = name
    .replace(/\s+/g, " ")
    .replace(/^[\s,.;:]+|[\s,.;:]+$/g, "")
    .trim();
  return { name, tocOnly };
}

/** Heuristic for names the PDF extraction cut or mixed with body text (a warning, not a verdict). */
export function looksBroken(name: string): boolean {
  const opens = (name.match(/\(/g) ?? []).length;
  const closes = (name.match(/\)/g) ?? []).length;
  return (
    opens !== closes ||
    /^[\p{Ll}(]/u.test(name) ||
    !name.includes(" ") ||
    name.length > 60 ||
    /[,!]/.test(name) ||
    /\b(the|and|which|room|mosque|graveyard|fountain)\b/i.test(name)
  );
}

type ResolveType = (rawType: string, name: string) => string | null;

/**
 * Type from the CSV `tur` column via `site_types.aliases`; when that is unknown ("Diğer",
 * "Konak"), the last type word in the name decides (`Yıldırım Darüşşifası` → darussifa).
 */
export function typeResolver(types: { id: string; aliases: string[] }[]): ResolveType {
  const byAlias = new Map<string, string>();
  for (const t of types) for (const a of [t.id, ...t.aliases]) byAlias.set(normalize(a), t.id);
  return (rawType, name) => {
    const direct = byAlias.get(normalize(rawType.trim()));
    if (direct) return direct;
    const words = normalize(name).split(/[^\p{L}]+/u).filter(Boolean);
    for (let i = words.length - 1; i >= 0; i--) {
      const hit = (i > 0 ? byAlias.get(`${words[i - 1]} ${words[i]}`) : undefined) ?? byAlias.get(words[i]!);
      if (hit) return hit;
    }
    return null;
  };
}

/**
 * Inventory addresses often start with the building's own name ("Şehzade Mahmut Türbesi,
 * Osmangazi ilçesi, …"). Returns that segment when it reads like a building name.
 */
export function suggestName(address: string | null, resolveType: ResolveType): string | null {
  const first = address?.split(",")[0]?.trim();
  if (!first || !first.includes(" ") || first.length > 60 || /^\p{Ll}/u.test(first)) return null;
  if (/\b(ilçesi|mahallesi|caddesi|sokak)\b/iu.test(first)) return null;
  return resolveType("", first) ? first : null;
}

function canonicalDistrict(city: CityConfig, raw: string): string | null {
  const cleaned = raw.normalize("NFC").replace(/\u0307/g, "").trim();
  if (!cleaned) return null;
  return city.districts.find((d) => normalize(d) === normalize(cleaned)) ?? cleaned;
}

export async function planImport(
  db: Db,
  input: { city: CityConfig; rows: Record<string, string>[]; geocoder: Geocoder; includeToc?: boolean },
): Promise<ImportPlan> {
  const { city, rows, geocoder, includeToc = false } = input;
  const resolveType = typeResolver(await listSiteTypeAliases(db));
  const stored = await existingSiteKeys(db, city.id);
  const seenKeys = new Set(stored.map((s) => s.key));
  const publishedByName = new Map(stored.filter((s) => s.published).map((s) => [nameKey(s.name), s.id]));
  // Table-of-contents rows have no district: when included, they are duplicates if a full row or
  // a stored site of this city has the same name.
  const knownNames = new Set(stored.map((s) => nameKey(s.name)));
  for (const r of rows) {
    const { name, tocOnly } = cleanName(r.ad_ham ?? "");
    if (!tocOnly && name) knownNames.add(nameKey(name));
  }

  const report: ImportReport = {
    read: rows.length,
    ready: 0,
    approximate: 0,
    noLocation: 0,
    typeUnclear: 0,
    duplicates: 0,
    tocSkipped: 0,
    possibleDuplicates: 0,
    invalid: 0,
    nameSuspect: 0,
    nameWarning: 0,
    locatedBy: { osm: 0, overpass: 0, nominatim: 0, "nominatim-address": 0, "nominatim-street": 0, "nominatim-neighbourhood": 0 },
  };
  const items: PlannedItem[] = [];

  for (const [i, r] of rows.entries()) {
    const { name, tocOnly } = cleanName(r.ad_ham ?? "");
    if (!name) {
      report.invalid++;
      continue;
    }
    const district = tocOnly ? null : canonicalDistrict(city, r.ilce ?? "");
    const dedupeKey = siteDedupeKey(name, district);
    const typeId = resolveType(r.tur ?? "", name);
    const nameSuspect = r.ad_supheli?.trim() === "1";
    const nameWarning = !nameSuspect && looksBroken(name);
    const address = r.adres?.trim() || null;
    const base = {
      row: i + 1,
      sourceRowId: r.id?.trim() ?? "",
      name,
      suggestedName: nameSuspect || nameWarning ? suggestName(address, resolveType) : null,
      district,
      typeId,
      tocOnly,
      nameSuspect,
      nameWarning,
      locationSource: null,
      draft: null,
    };

    if (tocOnly && !includeToc) {
      report.tocSkipped++;
      items.push({ ...base, status: "tocSkipped", possibleDuplicateOf: null });
      continue;
    }
    if (seenKeys.has(dedupeKey) || (tocOnly && knownNames.has(nameKey(name)))) {
      report.duplicates++;
      items.push({ ...base, status: "duplicate", possibleDuplicateOf: null });
      continue;
    }
    seenKeys.add(dedupeKey);
    if (nameSuspect) report.nameSuspect++;
    if (nameWarning) report.nameWarning++;
    const possibleDuplicateOf = publishedByName.get(nameKey(name)) ?? null;
    if (possibleDuplicateOf) report.possibleDuplicates++;

    const hit = await geocoder.locate({ name, district, address, nameSuspect: nameSuspect || nameWarning });
    if (hit) report.locatedBy[hit.source]++;
    const status: ImportStatus = !hit
      ? "noLocation"
      : APPROXIMATE_SOURCES.includes(hit.source)
        ? "approximate"
        : !typeId
          ? "typeUnclear"
          : "ready";
    report[status]++;

    const volume = r.cilt?.trim() ?? "";
    const page = r.sayfa?.trim() ?? "";
    const source = city.volumeSource(volume);
    const role = r.rol?.trim();
    items.push({
      ...base,
      status,
      possibleDuplicateOf,
      locationSource: hit?.source ?? null,
      draft: {
        id: [city.id, slugify(name), district ? slugify(district) : ""].filter(Boolean).join("-").slice(0, 100),
        name,
        district,
        typeId,
        role: role === "akar" || role === "hayrat" ? role : null,
        address,
        location: hit?.location ?? null,
        locationSource: hit?.source ?? null,
        dedupeKey,
        importMeta: {
          sourceRowId: base.sourceRowId,
          volume,
          page,
          rawName: r.ad_ham,
          rawType: r.tur,
          rawDistrict: r.ilce,
          modelTemplate: r.sablon,
          measurements: r.olcu_sayisi,
          domeTransitions: r.kubbe_gecisi,
          tocOnly,
          nameSuspect,
          nameWarning,
          suggestedName: base.suggestedName,
          possibleDuplicateOf,
        },
        locator: page ? `s. ${page}` : null,
        sourceSummary: [source.title, page && `s. ${page}`].filter(Boolean).join(", "),
        sourceId: source.id,
      },
    });
  }
  return { city, items, report };
}

/** Writes every planned draft. Safe to re-run: ids and dedupe keys already stored are skipped. */
export async function commitImport(db: Db, plan: ImportPlan): Promise<{ inserted: number }> {
  const drafts = plan.items.flatMap((it) => (it.draft ? [it.draft] : []));
  const volumes = [...new Set(drafts.map((d) => String(d.importMeta.volume ?? "")))];
  const inserted = await insertDraftSites(db, {
    city: { id: plan.city.id, name: plan.city.name },
    sources: volumes.map((v) => plan.city.volumeSource(v)),
    drafts,
  });
  return { inserted: inserted.length };
}

/** The admin import summary (Figma 1:1209) extended with the review lines agreed in BACKEND-DECISIONS. */
export function formatReport(r: ImportReport): string {
  const by = r.locatedBy;
  return [
    `${r.read} kayıt okundu`,
    "",
    `${r.ready} hazır`,
    `${r.approximate} konum yaklaşık (sokak ya da mahalle merkezi) → haritada düzelt, sonra yayınlanabilir`,
    `${r.noLocation} konum bulunamadı → listede elle düzelt`,
    `${r.typeUnclear} tür belirsiz → seç`,
    `${r.duplicates} kopya (ad + ilçe aynı)`,
    ...(r.tocSkipped ? [`${r.tocSkipped} içindekiler satırı atlandı (ilçe, adres ve sayfa yok)`] : []),
    ...(r.invalid ? [`${r.invalid} satır atlandı (ad boş)`] : []),
    "",
    `Olası kopya: ${r.possibleDuplicates} (yayındaki bir eserle aynı ad, yine de taslak olarak eklendi)`,
    `Ad şüpheli: ${r.nameSuspect} (veri ekibi işaretli) · ad uyarısı: ${r.nameWarning} (otomatik)`,
    `Konum kaynağı: OSM listesi ${by.osm} · Overpass ${by.overpass} · Nominatim ad ${by.nominatim} · Nominatim adres ${by["nominatim-address"]} · sokak ${by["nominatim-street"]} · mahalle merkezi ${by["nominatim-neighbourhood"]}`,
  ].join("\n");
}
