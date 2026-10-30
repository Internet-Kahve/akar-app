import type { HeritageRoute, HeritageSite } from "@akar/domain";
import { and, eq } from "drizzle-orm";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { App } from "../../app.ts";
import { loadCatalog } from "../../db/seed.ts";
import {
  cards,
  historyImages,
  media,
  siteMedia,
  siteSampleTraces,
  siteSections,
  siteSources,
  sites as siteTable,
  sources,
  narrations,
  storyBlocks,
} from "../../db/schema/index.ts";
import type { ErrorBody } from "../../errors.ts";
import { startTestApp } from "../../test/harness.ts";
import { spokenFor } from "../narrations/read.ts";
import { narrationHash } from "../narrations/spoken.ts";
import type { LookupsResponse, SiteDetail, SiteSummary } from "./schemas.ts";
import type { RouteDto } from "../routes/schemas.ts";

type Page = { items: SiteSummary[]; nextCursor: string | null };

const site = (id: string, name: string, over: Partial<HeritageSite> = {}): HeritageSite => ({
  id,
  name,
  city: "Bursa",
  district: "Hanlar Bölgesi",
  year: "1400",
  architect: "—",
  kind: "han",
  coordinates: [29.06, 40.18],
  minutes: 2,
  description: `${name} açıklaması`,
  status: "published",
  stories: [{ id: `${id}-s1`, title: "Başlık", text: "Metin", simple: "Metin", trust: "representative" }],
  source: "test",
  tier: "Tier 2",
  ...over,
});

const route = (id: string, siteIds: string[], over: Partial<HeritageRoute> = {}): HeritageRoute => ({
  id,
  name: `Rota ${id}`,
  description: "açıklama",
  siteIds,
  minutes: 30,
  distance: "1 km",
  theme: "test",
  status: "published",
  ...over,
});

const sites: HeritageSite[] = [
  site("carsi-hamami", "Çarşı Hamamı", { kind: "hamam", coordinates: [29.0, 40.0], displayOrder: 2 }),
  site("iznik-han", "İznik Hanı", { coordinates: [29.5, 40.5], displayOrder: 1 }),
  site("isik-cami", "Işık Camii", { kind: "cami", city: "İzmir", district: "Konak", coordinates: [27.1, 38.4] }),
  // Equal sort names: ties must be broken by id, never skipped or repeated across a page boundary.
  site("han-b", "Han", { coordinates: [29.1, 40.1] }),
  site("han-a", "Han", { coordinates: [29.1, 40.1] }),
  site("han-c", "Han", { coordinates: [29.1, 40.1] }),
  site("yuzde", "100% Yüzde", { coordinates: [29.2, 40.2] }),
  site("taslak", "Taslak Çarşı", { status: "draft", coordinates: [29.0, 40.0] }),
];

let app: App;
let stop: (() => Promise<void>) | undefined;

type MediaInsert = typeof media.$inferInsert;
const mediaRow = (id: string, kind: MediaInsert["kind"], over: Partial<MediaInsert> = {}): MediaInsert => ({
  id,
  kind,
  mime: kind === "model" ? "model/gltf-binary" : kind === "audio" ? "audio/mpeg" : "image/jpeg",
  url: `https://cdn.test/${id}`,
  license: "CC0",
  trust: "representative",
  ...over,
});
const pose = { label: "Giriş", target: null, azimuthDeg: 45, elevationDeg: 20, distance: 0.6 };

/** A current recording of a sentence: the hash is computed from the text the sentence has when this runs. */
async function narrate(db: App["deps"]["db"], siteId: string, blockId: string, variant: "text" | "simple", lang: "tr" | "en", mediaId: string) {
  const [block] = await db.select().from(storyBlocks).where(and(eq(storyBlocks.siteId, siteId), eq(storyBlocks.id, blockId)));
  const model = `flux-test-${lang}`;
  await db.insert(narrations).values({
    id: `nar-${blockId}-${variant}-${lang}`,
    siteId,
    subjectType: "story_block",
    subjectId: blockId,
    variant,
    lang,
    voice: "female",
    mediaId,
    textHash: narrationHash(model, spokenFor(block!, variant, lang)),
    model,
  });
}

/**
 * Content the domain model cannot express (periods, audio, cards, sections, archive images). Matrix:
 *
 *   site          period           model  audio       history
 *   carsi-hamami  erken-osmanli    yes    -           -
 *   iznik-han     erken-osmanli    yes    tr + en     2 images (+ cards, sections, cover, sources)
 *   isik-cami     klasik-osmanli   -      -           1 image
 *   han-a         klasik-osmanli   -      en only     -        (card of its own)
 *   taslak        erken-osmanli    yes    tr          1 image  (a DRAFT that matches every filter)
 *
 * The last test reloads the catalog, which rewrites story blocks and links: keep it last.
 */
async function seedV2(db: App["deps"]["db"]) {
  await db.insert(sources).values(
    ["src-site", "src-story", "src-section", "src-card", "src-history", "src-media", "src-other"].map((id) => ({
      id,
      title: `Kaynak ${id}`,
      kind: "book" as const,
      trust: "verified" as const,
    })),
  );
  await db.insert(media).values([
    mediaRow("m-model", "model", { sourceId: "src-site" }),
    mediaRow("m-cover", "photo"),
    mediaRow("m-story", "photo"),
    mediaRow("m-audio-tr", "audio"),
    mediaRow("m-audio-en", "audio"),
    mediaRow("m-card-a", "photo"),
    mediaRow("m-card-b", "photo"),
    mediaRow("m-hist-old", "photo", { sourceId: "src-media" }),
    mediaRow("m-hist-now", "photo"),
    mediaRow("m-hist-2", "photo"),
    mediaRow("m-trace", "photo"),
    mediaRow("m-trace-2", "photo"),
    mediaRow("m-other", "photo"),
  ]);
  await db.insert(cards).values([
    { id: "card-a", kind: "portrait", title: "Kart A", mediaId: "m-card-a", sourceId: "src-card", trust: "verified" },
    { id: "card-b", kind: "photo", title: "Kart B", mediaId: "m-card-b", trust: "inferred" },
    { id: "card-other", kind: "document", title: "Başka eserin kartı", mediaId: "m-other", sourceId: "src-other", trust: "verified" },
  ]);

  await db.insert(siteMedia).values(["carsi-hamami", "iznik-han", "taslak"].map((siteId) => ({ siteId, mediaId: "m-model", position: 0 })));
  await db.insert(siteSources).values({ siteId: "iznik-han", sourceId: "src-site", position: 0 });

  // iznik-han: three sentences, two cards; card-b is used first and again by the last sentence.
  await db
    .update(storyBlocks)
    .set({ photoId: "m-story", sourceId: "src-story", cardId: "card-b", camera: pose, simpleEn: "English simple", simpleEnStatus: "machine" })
    .where(and(eq(storyBlocks.siteId, "iznik-han"), eq(storyBlocks.id, "iznik-han-s1")));
  await db.insert(storyBlocks).values(
    [
      { id: "iznik-han-s2", position: 1, cardId: "card-a" },
      { id: "iznik-han-s3", position: 2, cardId: "card-b" },
    ].map((b) => ({ siteId: "iznik-han", title: "Başlık", text: "Metin", simple: "Metin", trust: "representative" as const, ...b })),
  );
  await db.update(storyBlocks).set({ simpleEn: "English simple", simpleEnStatus: "machine", cardId: "card-other" }).where(eq(storyBlocks.id, "han-a-s1"));
  await db.update(storyBlocks).set({ simpleEn: "English simple", simpleEnStatus: "machine" }).where(eq(storyBlocks.id, "taslak-s1"));
  // Recordings: iznik-han has Turkish and English, han-a English only, the draft Turkish only.
  await narrate(db, "iznik-han", "iznik-han-s1", "text", "tr", "m-audio-tr");
  await narrate(db, "iznik-han", "iznik-han-s1", "simple", "en", "m-audio-en");
  await narrate(db, "han-a", "han-a-s1", "simple", "en", "m-audio-en");
  await narrate(db, "taslak", "taslak-s1", "text", "tr", "m-audio-tr");

  // Inserted out of order on purpose: the API orders by position.
  await db.insert(siteSections).values([
    { siteId: "iznik-han", id: "sec-waqf", position: 2, kind: "waqf", title: "Vakıf ve akar", body: "…", trust: "inferred" },
    { siteId: "iznik-han", id: "sec-history", position: 0, kind: "history", title: "Tarihçe", body: "…", trust: "verified", sourceId: "src-section" },
    { siteId: "iznik-han", id: "sec-arch", position: 1, kind: "architecture", title: "Mimari", body: "…", trust: "verified" },
  ]);
  await db.insert(historyImages).values([
    { id: "hist-2", siteId: "iznik-han", position: 1, mediaId: "m-hist-2", trust: "inferred" },
    {
      id: "hist-1",
      siteId: "iznik-han",
      position: 0,
      mediaId: "m-hist-old",
      presentMediaId: "m-hist-now",
      sourceId: "src-history",
      trust: "verified",
      camera: pose,
      presentAngleMatch: "same",
    },
    { id: "hist-cami", siteId: "isik-cami", position: 0, mediaId: "m-hist-2", trust: "inferred" },
    { id: "hist-taslak", siteId: "taslak", position: 0, mediaId: "m-hist-2", trust: "inferred" },
  ]);
  // Inserted out of order on purpose: the API orders by position. The draft's sample never shows.
  await db.insert(siteSampleTraces).values([
    { id: "trace-b", siteId: "iznik-han", position: 1, author: "AKAR ekibi", text: "Avludan.", mediaId: "m-trace-2", addedOn: "2026-10-29" },
    { id: "trace-a", siteId: "iznik-han", position: 0, author: "AKAR ekibi", text: "Aynı eksen.", mediaId: "m-trace", historyImageId: "hist-1", angleMatch: "near", addedOn: "2026-10-28" },
    { id: "trace-taslak", siteId: "taslak", position: 0, author: "AKAR ekibi", text: "Taslak.", mediaId: "m-trace", addedOn: "2026-10-28" },
  ]);

  const period = (id: string, periodId: string) => db.update(siteTable).set({ periodId }).where(eq(siteTable.id, id));
  await Promise.all([
    period("carsi-hamami", "erken-osmanli"),
    period("iznik-han", "erken-osmanli"),
    period("taslak", "erken-osmanli"),
    period("isik-cami", "klasik-osmanli"),
    period("han-a", "klasik-osmanli"),
    db.update(siteTable).set({ coverMediaId: "m-cover", openingCamera: pose }).where(eq(siteTable.id, "iznik-han")),
  ]);
}

before(async () => {
  ({ app, stop } = await startTestApp());
  await loadCatalog(app.deps.db, {
    sites,
    routes: [
      // Deliberately not alphabetical or insertion-id order.
      route("sirali", ["iznik-han", "carsi-hamami", "han-a", "taslak"]),
      route("taslak-rota", ["carsi-hamami", "han-a"], { status: "draft" }),
    ],
  });
  await seedV2(app.deps.db);
});
after(() => stop?.());

const get = async <T>(url: string, headers: Record<string, string> = {}) => {
  const res = await app.inject({ method: "GET", url, headers });
  return { res, body: res.json<T>() };
};
const ids = (items: SiteSummary[]) => items.map((s) => s.id);

/** Follows `nextCursor` to the end and returns every id in page order. */
const walk = async (filters: string, limit: number) => {
  const seen: string[] = [];
  let cursor: string | null = null;
  for (let guard = 0; guard < 20; guard++) {
    const query = [filters, `limit=${limit}`, cursor && `cursor=${cursor}`].filter(Boolean).join("&");
    const { body }: { body: Page } = await get<Page>(`/v1/sites?${query}`);
    assert.ok(body.items.length <= limit);
    seen.push(...ids(body.items));
    cursor = body.nextCursor;
    if (!cursor) return seen;
  }
  throw new Error(`pagination with limit=${limit} did not terminate`);
};

test("drafts never appear in lists, detail, search or published routes", async () => {
  const list = await get<Page>("/v1/sites?limit=100");
  assert.ok(!ids(list.body.items).includes("taslak"));

  const search = await get<Page>(`/v1/sites?query=${encodeURIComponent("taslak")}`);
  assert.deepEqual(search.body.items, []);

  const detail = await get<ErrorBody>("/v1/sites/taslak");
  assert.equal(detail.res.statusCode, 404);
  assert.equal(detail.body.error.code, "NOT_FOUND");
  assert.ok(detail.body.error.requestId);

  const draftRoute = await get<ErrorBody>("/v1/routes/taslak-rota");
  assert.equal(draftRoute.res.statusCode, 404);
  const routes = await get<{ items: RouteDto[] }>("/v1/routes");
  assert.deepEqual(routes.body.items.map((r) => r.id), ["sirali"]);
  assert.ok(!routes.body.items[0]!.stops.some((s) => s.site.id === "taslak"));
});

test("bbox returns only sites inside the box", async () => {
  const { body } = await get<Page>("/v1/sites?bbox=28.9,39.9,29.2,40.3&limit=100");
  assert.deepEqual(ids(body.items).sort(), ["carsi-hamami", "han-a", "han-b", "han-c", "yuzde"]);

  const izmir = await get<Page>("/v1/sites?bbox=27,38,27.5,38.8");
  assert.deepEqual(ids(izmir.body.items), ["isik-cami"]);

  const bad = await get<ErrorBody>("/v1/sites?bbox=30,40,29,41");
  assert.equal(bad.res.statusCode, 400);
  assert.equal(bad.body.error.code, "VALIDATION_FAILED");
  assert.ok(bad.body.error.fieldErrors.bbox);
});

test("keyset pagination walks every published site exactly once, ties included", async () => {
  const all = await get<Page>("/v1/sites?limit=100");
  assert.equal(all.body.nextCursor, null);
  assert.equal(all.body.items.length, 7);

  for (const limit of [1, 2, 3]) {
    assert.deepEqual(await walk("", limit), ids(all.body.items), `limit=${limit}`);
  }

  const bad = await get<ErrorBody>("/v1/sites?cursor=not-a-cursor");
  assert.equal(bad.res.statusCode, 400);
  assert.equal(bad.body.error.code, "INVALID_CURSOR");
});

test("search is case- and diacritic-insensitive and Turkish-aware", async () => {
  const q = async (term: string) => ids((await get<Page>(`/v1/sites?query=${encodeURIComponent(term)}`)).body.items);
  for (const term of ["çarşı", "Çarşı", "ÇARŞI", "carsi", "CARSI"]) {
    assert.deepEqual(await q(term), ["carsi-hamami"], term);
  }
  // dotted/dotless I: İ/i and I/ı all fold together
  for (const term of ["iznik", "İznik", "IZNIK", "ıznık"]) {
    assert.deepEqual(await q(term), ["iznik-han"], term);
  }
  assert.deepEqual(await q("ışık"), ["isik-cami"]);
  // LIKE metacharacters are literals, not wildcards
  assert.deepEqual(await q("%"), ["yuzde"]);
  assert.deepEqual(await q("_"), []);
});

test("kind and city filters combine with search", async () => {
  assert.deepEqual(ids((await get<Page>("/v1/sites?kind=cami")).body.items), ["isik-cami"]);
  assert.deepEqual(ids((await get<Page>("/v1/sites?city=izmir")).body.items), ["isik-cami"]);
  assert.deepEqual(ids((await get<Page>("/v1/sites?city=bursa&kind=hamam")).body.items), ["carsi-hamami"]);
});

test("route stops keep their stored order, not id or insertion order", async () => {
  const { body } = await get<RouteDto>("/v1/routes/sirali");
  assert.deepEqual(body.stops.map((s) => s.site.id), ["iznik-han", "carsi-hamami", "han-a"]);
  assert.deepEqual(body.stops.map((s) => s.position), [0, 1, 2]);

  const list = await get<{ items: RouteDto[] }>("/v1/routes");
  assert.deepEqual(list.body.items[0]!.stops.map((s) => s.site.id), ["iznik-han", "carsi-hamami", "han-a"]);
});

test("detail returns ordered story blocks and 304 on a matching ETag", async () => {
  const first = await get<SiteDetail>("/v1/sites/carsi-hamami");
  assert.equal(first.res.statusCode, 200);
  assert.equal(first.body.stories[0]?.id, "carsi-hamami-s1");
  assert.deepEqual(first.body.coordinates, [29, 40]);
  const etag = first.res.headers.etag as string;
  assert.match(etag, /^W\/"/);
  // Revalidated on every use: an editor's write shows on the very next read (§11.24).
  assert.equal(first.res.headers["cache-control"], "public, no-cache");

  const again = await app.inject({ method: "GET", url: "/v1/sites/carsi-hamami", headers: { "if-none-match": etag } });
  assert.equal(again.statusCode, 304);
  assert.equal(again.body, "");

  const missing = await app.inject({ method: "GET", url: "/v1/sites/yok" });
  assert.equal(missing.headers.etag, undefined);
});

test("category, period and has filters combine with each other and never match a draft", async () => {
  // `taslak` is a draft that matches every filter below.
  const q = async (filters: string) => ids((await get<Page>(`/v1/sites?limit=100&${filters}`)).body.items);

  assert.deepEqual(await q("category=akar&period=erken-osmanli&has=model,history"), ["iznik-han"]);
  assert.deepEqual(await q("has=model"), ["carsi-hamami", "iznik-han"]);
  assert.deepEqual(await q("has=audio"), ["han-a", "iznik-han"]); // han-a has English audio only
  assert.deepEqual(await q("has=history"), ["isik-cami", "iznik-han"]);
  assert.deepEqual(await q("period=erken-osmanli"), ["carsi-hamami", "iznik-han"]);
  assert.deepEqual(await q("category=dini"), ["isik-cami"]);
  assert.deepEqual(await q("category=dini&period=erken-osmanli"), []);
  assert.deepEqual(await q("category=akar&period=klasik-osmanli&has=audio&city=bursa"), ["han-a"]);

  for (const has of ["bogus", "model,bogus"]) {
    const bad = await get<ErrorBody>(`/v1/sites?has=${has}`);
    assert.equal(bad.res.statusCode, 400, has);
    assert.equal(bad.body.error.code, "VALIDATION_FAILED", has);
    assert.ok(bad.body.error.fieldErrors.has, has);
  }
});

test("summaries report the category, period and content flags of their site", async () => {
  const { body } = await get<Page>("/v1/sites?limit=100");
  const by = Object.fromEntries(body.items.map((s) => [s.id, s]));
  assert.deepEqual(by["iznik-han"]?.has, { model: true, audio: true, history: true });
  assert.deepEqual(by["han-a"]?.has, { model: false, audio: true, history: false });
  assert.deepEqual(by["han-b"]?.has, { model: false, audio: false, history: false });
  assert.deepEqual([by["isik-cami"]?.categoryId, by["isik-cami"]?.periodId], ["dini", "klasik-osmanli"]);
  assert.deepEqual([by["han-b"]?.categoryId, by["han-b"]?.periodId], ["akar", null]);
});

test("the map order (eser.json sira) is in every summary and detail, ranked or null, and in route stops", async () => {
  const list = (await get<Page>("/v1/sites?limit=100")).body.items;
  const by = Object.fromEntries(list.map((s) => [s.id, s]));
  assert.deepEqual([by["iznik-han"]?.displayOrder, by["carsi-hamami"]?.displayOrder], [1, 2]);
  assert.equal(by["han-a"]?.displayOrder, null, "unranked is null, not absent");
  assert.ok(list.every((s) => "displayOrder" in s));

  assert.equal((await get<SiteDetail>("/v1/sites/iznik-han")).body.displayOrder, 1);
  assert.equal((await get<SiteDetail>("/v1/sites/han-a")).body.displayOrder, null);
  const details = (await get<{ items: SiteDetail[] }>("/v1/site-details?limit=100")).body.items;
  assert.deepEqual(
    details.map((d) => [d.id, d.displayOrder]),
    list.map((s) => [s.id, s.displayOrder]),
  );

  const stops = (await get<RouteDto>("/v1/routes/sirali")).body.stops;
  assert.deepEqual(stops.map((s) => s.site.displayOrder), [1, 2, null]);
});

test("distance sort lists the nearest first and its pages never repeat or skip a row, ties included", async () => {
  // From Çarşı Hamamı: the three Han share one location (a tie on distance, broken by id), then outwards.
  const nearest = ["carsi-hamami", "han-a", "han-b", "han-c", "yuzde", "iznik-han", "isik-cami"];
  const all = await get<Page>("/v1/sites?near=29,40&sort=distance&limit=100");
  assert.deepEqual(ids(all.body.items), nearest);
  assert.equal(all.body.nextCursor, null);

  const metres = all.body.items.map((s) => s.distanceMeters!);
  assert.equal(metres[0], 0);
  assert.deepEqual(metres, [...metres].sort((a, b) => a - b));
  assert.equal(metres[1], metres[3]);
  assert.ok(metres[4]! > metres[3]!);

  for (const limit of [1, 2, 3]) {
    assert.deepEqual(await walk("near=29,40&sort=distance", limit), nearest, `limit=${limit}`);
  }

  // `near` alone only adds the distance: the order (and its cursor) stays by name.
  const byName = await get<Page>("/v1/sites?near=29,40&limit=100");
  assert.deepEqual(ids(byName.body.items), ids((await get<Page>("/v1/sites?limit=100")).body.items));
  const distanceOf = new Map(all.body.items.map((s) => [s.id, s.distanceMeters]));
  assert.ok(byName.body.items.every((s) => s.distanceMeters === distanceOf.get(s.id)));
  assert.ok((await get<Page>("/v1/sites?limit=100")).body.items.every((s) => s.distanceMeters === null));
});

test("sort=distance needs a valid near, and a cursor only works in the sort mode that issued it", async () => {
  const noNear = await get<ErrorBody>("/v1/sites?sort=distance");
  assert.equal(noNear.res.statusCode, 400);
  assert.equal(noNear.body.error.code, "VALIDATION_FAILED");
  assert.ok(noNear.body.error.fieldErrors.near);

  for (const near of ["abc", "29", "29,", ",", "29,40,1", "200,40", "29,95"]) {
    const bad = await get<ErrorBody>(`/v1/sites?near=${near}`);
    assert.equal(bad.res.statusCode, 400, near);
    assert.ok(bad.body.error.fieldErrors.near, near);
  }

  const nameCursor = (await get<Page>("/v1/sites?limit=1")).body.nextCursor;
  const distanceCursor = (await get<Page>("/v1/sites?near=29,40&sort=distance&limit=1")).body.nextCursor;
  assert.ok(nameCursor && distanceCursor);
  const forged = (d: string) => Buffer.from(JSON.stringify({ d, i: "x" })).toString("base64url");
  for (const url of [
    `/v1/sites?near=29,40&sort=distance&cursor=${nameCursor}`,
    `/v1/sites?cursor=${distanceCursor}`,
    `/v1/sites?near=29,40&sort=distance&cursor=${forged("abc")}`,
    `/v1/sites?near=29,40&sort=distance&cursor=${forged("")}`,
    `/v1/sites?near=29,40&sort=distance&cursor=${forged("Infinity")}`,
  ]) {
    const bad = await get<ErrorBody>(url);
    assert.equal(bad.res.statusCode, 400, url);
    assert.equal(bad.body.error.code, "INVALID_CURSOR", url);
  }
});

test("cities count only published sites and routes", async () => {
  const { body } = await get<{ items: { id: string; name: string; siteCount: number; routeCount: number }[] }>("/v1/cities");
  // Bursa also holds the draft site `taslak` and the draft route `taslak-rota`.
  const empty = { scene: null, identity: null, isDefault: false, map: null, inventory: null };
  assert.deepEqual(body.items, [
    { id: "bursa", name: "Bursa", siteCount: 6, routeCount: 1, ...empty },
    { id: "izmir", name: "İzmir", siteCount: 1, routeCount: 0, ...empty },
  ]);
});

test("lookups are listed in position order, not alphabetically", async () => {
  const { body } = await get<LookupsResponse>("/v1/lookups");
  assert.deepEqual(body.roleCategories.map((c) => c.id), ["dini", "su", "egitim", "akar"]);
  assert.deepEqual(body.periods.map((p) => p.id), [
    "bizans",
    "selcuklu-beylikler",
    "erken-osmanli",
    "klasik-osmanli",
    "gec-osmanli",
    "cumhuriyet",
  ]);
  assert.deepEqual(body.siteTypes.slice(0, 5).map((t) => t.id), ["cami", "turbe", "tekke", "hazire", "cesme"]);
});

test("detail returns sections, cards and archive images, and every media and source they reference", async () => {
  const { res, body } = await get<SiteDetail>("/v1/sites/iznik-han");
  assert.equal(res.statusCode, 200);
  // Inserted out of order: sections and archive images follow their position.
  assert.deepEqual(body.photoIds, [], "card/history references are separate from the gallery");
  assert.deepEqual(body.sections.map((s) => s.id), ["sec-history", "sec-arch", "sec-waqf"]);
  assert.deepEqual(body.historyImages.map((h) => h.id), ["hist-1", "hist-2"]);
  assert.deepEqual(body.historyImages.map((h) => [h.id, h.presentMediaId, h.presentAngleMatch]), [["hist-1", "m-hist-now", "same"], ["hist-2", null, null]]);
  assert.deepEqual(body.sampleTraces, [
    { id: "trace-a", author: "AKAR ekibi", text: "Aynı eksen.", mediaId: "m-trace", historyImageId: "hist-1", angleMatch: "near", addedOn: "2026-10-28" },
    { id: "trace-b", author: "AKAR ekibi", text: "Avludan.", mediaId: "m-trace-2", historyImageId: null, angleMatch: null, addedOn: "2026-10-29" },
  ]);
  // Three sentences share two cards: each is listed once, in the order the story first uses it.
  assert.deepEqual(body.stories.map((s) => s.cardId), ["card-b", "card-a", "card-b"]);
  assert.deepEqual(body.cards.map((c) => c.id), ["card-b", "card-a"]);
  assert.deepEqual(body.openingCamera, pose);

  // The site's own media first (only the model is linked), then what its cover, sentences, cards
  // and archive images reference, each once. Same for sources.
  assert.deepEqual(body.media.map((m) => m.id), [
    "m-model",
    "m-cover",
    "m-story",
    "m-audio-tr",
    "m-audio-en",
    "m-card-b",
    "m-card-a",
    "m-hist-old",
    "m-hist-now",
    "m-hist-2",
    "m-trace",
    "m-trace-2",
  ]);
  assert.equal(body.media.find((m) => m.id === "m-audio-tr")?.kind, "audio");
  assert.deepEqual(body.sources.map((s) => s.id), ["src-site", "src-story", "src-section", "src-card", "src-history", "src-media"]);

  // Nothing of another site leaks in, even when the media is shared.
  const other = await get<SiteDetail>("/v1/sites/han-a");
  assert.deepEqual(other.body.cards.map((c) => c.id), ["card-other"]);
  assert.deepEqual(other.body.media.map((m) => m.id), ["m-audio-en", "m-other"]);
  assert.deepEqual(other.body.sources.map((s) => s.id), ["src-other"]);

  // No content at all: empty lists, not an error.
  const bare = await get<SiteDetail>("/v1/sites/han-b");
  assert.equal(bare.res.statusCode, 200);
  assert.deepEqual([bare.body.sections, bare.body.cards, bare.body.historyImages, bare.body.sampleTraces, bare.body.media, bare.body.sources], [[], [], [], [], [], []]);
  assert.equal(bare.body.openingCamera, null);
});

test("detail pages hold every published site once, each equal to its own detail even when sites share media", async () => {
  const all = (await get<Page>("/v1/sites?limit=100")).body.items;
  const singles = await Promise.all(all.map(async (s) => (await get<SiteDetail>(`/v1/sites/${s.id}`)).body));

  // One page with every site (iznik-han and han-a share a medium), then small pages across the keyset.
  const full = await get<{ items: SiteDetail[]; nextCursor: string | null }>("/v1/site-details?limit=100");
  assert.equal(full.body.nextCursor, null);
  assert.deepEqual(full.body.items, singles);

  const paged: SiteDetail[] = [];
  let cursor: string | null = null;
  for (let guard = 0; guard < 20 && (guard === 0 || cursor); guard++) {
    const page: { body: { items: SiteDetail[]; nextCursor: string | null } } = await get(
      `/v1/site-details?limit=3${cursor ? `&cursor=${cursor}` : ""}`,
    );
    paged.push(...page.body.items);
    cursor = page.body.nextCursor;
  }
  assert.deepEqual(paged, singles);
  assert.ok(!paged.some((s) => s.id === "taslak"));
});

test("loading the same catalog twice creates no duplicates", async () => {
  await loadCatalog(app.deps.db, { sites, routes: [route("sirali", ["iznik-han", "carsi-hamami", "han-a", "taslak"])] });
  const list = await get<Page>("/v1/sites?limit=100");
  assert.equal(list.body.items.length, 7);
  const detail = await get<SiteDetail>("/v1/sites/carsi-hamami");
  assert.equal(detail.body.stories.length, 1);
  const r = await get<RouteDto>("/v1/routes/sirali");
  assert.equal(r.body.stops.length, 3);
});

/** True when Postgres rejected the statement because of the named CHECK constraint. */
const violates = (constraint: string) => (e: unknown) =>
  e instanceof Error && typeof e.cause === "object" && e.cause !== null && "constraint" in e.cause && e.cause.constraint === constraint;

test("the database itself refuses an angle word without a present-day photograph, and a word that is not same or near", async () => {
  const db = app.deps.db;
  await assert.rejects(db.update(historyImages).set({ presentAngleMatch: "near" }).where(eq(historyImages.id, "hist-2")), violates("history_images_present_match_needs_photo"));
  await assert.rejects(db.update(historyImages).set({ presentAngleMatch: "far" as "near" }).where(eq(historyImages.id, "hist-1")), violates("history_images_present_angle_check"));
  await assert.rejects(db.update(siteSampleTraces).set({ angleMatch: "far" as "near" }).where(eq(siteSampleTraces.id, "trace-a")), violates("site_sample_traces_angle_check"));
});
