import type { HeritageSite } from "@akar/domain";
import { eq } from "drizzle-orm";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { App } from "../../app.ts";
import { sites } from "../../db/schema/index.ts";
import { loadCatalog } from "../../db/seed.ts";
import { startTestApp } from "../../test/harness.ts";
import { CITIES } from "./cities.ts";
import { parseCsv } from "./csv.ts";
import { overpassMatcher, type GeoHit, type Geocoder } from "./geocode.ts";
import { commitImport, planImport } from "./service.ts";

const city = CITIES.bursa!;

// Same columns as eser-turleri.csv. Quoted commas, a broken name flagged by the data team,
// an unknown type, an in-file duplicate, a TOC-only row and a building already published.
const inventory = parseCsv(
  [
    "id,cilt,sayfa,ilce,ad_ham,ad_supheli,tur,sablon,rol,olcu_sayisi,kubbe_gecisi,adres",
    'b-1,cilt-1,10,Osmangazi̇,Abdal Mehmed Camii,0,Cami,cami,hayrat,1,1,"Abdal Mehmed Camii, Osmangazi İlçesi, Tuzpazarı Mahallesi"',
    "b-2,cilt-1,11,Osmangazi̇,Geyve Hanı,0,Han,han,akar,0,0,",
    "b-3,cilt-1,12,Osmangazi̇,Geyve Hanı,0,Han,han,akar,0,0,",
    "b-4,cilt-1,13,Mudanya,Halil Ağa Evi,0,Konak,ayri_inceleme,hayrat,0,0,",
    "b-5,cilt-1,14,Yildirim,Uzak Çeşme,0,Çeşme,cesme,hayrat,0,0,",
    'b-6,cilt-1,15,Osmangazi̇,Külliyesi,1,Külliye,kulliye,hayrat,0,0,"Murad Hudâvendigâr Camii ve Medresesi, Osmangazi ilçesi"',
    "b-7,cilt-2,,,Koza Han [yalnız içindekiler],0,Han,han,akar,,,",
    "b-8,cilt-2,8,Osmangazi,Koza Hanı,,Han,han,akar,3,,",
  ].join("\n"),
);

// Deterministic geocoder: no network in tests.
const hits: Record<string, GeoHit> = {
  "Abdal Mehmed Camii": { location: [29.06, 40.18], source: "overpass" },
  "Geyve Hanı": { location: [29.061, 40.184], source: "nominatim" },
  "Halil Ağa Evi": { location: [28.88, 40.37], source: "nominatim-address" },
  Külliyesi: { location: [29.05, 40.19], source: "nominatim-neighbourhood" },
  "Koza Hanı": { location: [29.0635, 40.1844], source: "osm" },
};
const geocoder: Geocoder = { locate: async ({ name }) => hits[name] ?? null };

const published = (id: string, name: string): HeritageSite => ({
  id,
  name,
  city: "Bursa",
  district: "Hanlar Bölgesi",
  year: "1491",
  architect: "",
  kind: "han",
  coordinates: [29.0635, 40.1844],
  minutes: 3,
  description: `${name} açıklaması`,
  status: "published",
  stories: [{ id: `${id}-s1`, title: "Başlık", text: "Metin", simple: "Metin", trust: "verified" }],
  source: "test",
  tier: "Hero",
});

let app: App;
let stop: (() => Promise<void>) | undefined;
before(async () => {
  ({ app, stop } = await startTestApp());
  // Hand-made demo content uses the historic area, not the district.
  await loadCatalog(app.deps.db, { sites: [published("koza-han", "Koza Hanı")], routes: [] });
});
after(() => stop?.());

const plan = () => planImport(app.deps.db, { city, rows: inventory, geocoder });

test("dry run buckets rows the way the admin report counts them", async () => {
  const { report, items } = await plan();
  const byId = (id: string) => items.find((i) => i.sourceRowId === id);
  assert.deepEqual(
    {
      ready: report.ready,
      approximate: report.approximate,
      noLocation: report.noLocation,
      typeUnclear: report.typeUnclear,
      duplicates: report.duplicates,
      tocSkipped: report.tocSkipped,
    },
    { ready: 2, approximate: 1, noLocation: 1, typeUnclear: 1, duplicates: 2, tocSkipped: 1 },
  );
  assert.equal(byId("b-1")?.district, "Osmangazi", "combining dot from the PDF extraction is removed");
  assert.equal(byId("b-1")?.draft?.address, "Abdal Mehmed Camii, Osmangazi İlçesi, Tuzpazarı Mahallesi", "quoted commas stay in one field");
  assert.equal(byId("b-5")?.district, "Yıldırım", "ASCII district maps to the canonical spelling");
  assert.equal(byId("b-8")?.status, "duplicate", "historic area 'Hanlar Bölgesi' keys as Osmangazi");

  const broken = byId("b-6");
  assert.equal(broken?.nameSuspect, true);
  assert.equal(broken?.suggestedName, "Murad Hudâvendigâr Camii ve Medresesi");
  assert.equal(broken?.status, "approximate");
});

/** True when Postgres rejected the statement because of the named CHECK constraint. */
const violates = (constraint: string) => (e: unknown) =>
  e instanceof Error && typeof e.cause === "object" && e.cause !== null && "constraint" in e.cause && e.cause.constraint === constraint;

test("an approximate (neighbourhood-centre) location cannot be published", async () => {
  await commitImport(app.deps.db, await plan());
  const publish = () => app.deps.db.update(sites).set({ status: "published" }).where(eq(sites.id, "bursa-kulliyesi-osmangazi"));
  await assert.rejects(publish(), violates("sites_published_complete"));
  // Once an editor confirms the pin, the same draft passes the check.
  await app.deps.db.update(sites).set({ locationSource: "manual" }).where(eq(sites.id, "bursa-kulliyesi-osmangazi"));
  await publish();
});

test("commit writes drafts only and a second commit adds nothing", async () => {
  const list = await app.inject({ method: "GET", url: "/v1/sites?city=bursa&limit=100" });
  const visible = list.json<{ items: { id: string }[] }>().items.map((s) => s.id);
  assert.ok(!visible.includes("bursa-geyve-hani-osmangazi"));
  assert.equal((await app.inject({ method: "GET", url: "/v1/sites/bursa-geyve-hani-osmangazi" })).statusCode, 404);

  const again = await plan();
  assert.equal(again.report.duplicates, 7, "every non-TOC row now matches a stored site");
  assert.equal((await commitImport(app.deps.db, again)).inserted, 0);
});

test("Overpass match needs the same building type and an unambiguous winner", () => {
  const match = overpassMatcher([
    { name: "Abdal Mehmet Camii", district: "Osmangazi", location: [1, 1] },
    { name: "Abdal Mehmet Türbesi", district: "Osmangazi", location: [2, 2] },
    { name: "Şeyh Camii", district: "Osmangazi", location: [3, 3] },
    { name: "Şeyh Camii", district: "Osmangazi", location: [4, 4] },
    { name: "Orta Camii", district: "Gürsu", location: [5, 5] },
  ]);
  assert.deepEqual(match("Abdal Mehmed (Kale) Camii ve Haziresi", "Osmangazi"), [1, 1], "suffixes, parentheses and d/t differ");
  assert.equal(match("Abdal Mehmed Hamamı", "Osmangazi"), null, "type word must agree");
  assert.equal(match("Şeyh Camii", "Osmangazi"), null, "two distant equal names are ambiguous");
  assert.equal(match("Orta Camii", "Osmangazi"), null, "other districts are not searched");
});
