import type { HeritageRoute, HeritageSite, SitePhoto } from "@akar/domain";
import { and, eq } from "drizzle-orm";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { App } from "../../app.ts";
import { catalogRoutes, historyImages, media, quizAnswers, quizzes, routeStops } from "../../db/schema/index.ts";
import { loadCatalog } from "../../db/seed.ts";
import type { ErrorBody } from "../../errors.ts";
import { startTestApp } from "../../test/harness.ts";
import type { RouteBundle, RouteDto } from "./schemas.ts";

const cdn = (name: string) => `https://cdn.akar.test/${name}.jpg`;
const BADGE_URL = "https://cdn.akar.test/rozet-hanlar.png";
const BADGE_ALT = "Hanlar Yolcusu rozeti";

const photo = (id: string): SitePhoto => ({
  id,
  src: cdn(id),
  alt: id,
  title: id,
  titleEn: "",
  description: "",
  sourceId: "",
  license: "CC0",
  trust: "representative",
});

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

const quiz = (id: string, siteId: string) => ({
  id,
  siteId,
  question: `Soru ${id}`,
  options: ["Birinci", "İkinci", "Üçüncü"],
  hint: `İpucu ${id}`,
  explanation: `Gizli açıklama ${id}`,
  trust: "representative" as const,
});

// "ortak" is one photo shared by han-a and han-b. Everything with "taslak" in its name is unpublished.
const sites: HeritageSite[] = [
  site("han-a", "Han A", { coordinates: [29.06, 40.18], photos: [photo("han-a-kapak"), photo("ortak")], coverPhotoId: "han-a-kapak" }),
  site("han-b", "Han B", { coordinates: [29.07, 40.19], photos: [photo("han-b-kapak"), photo("ortak")], coverPhotoId: "han-b-kapak" }),
  site("han-c", "Han C", { coordinates: [29.08, 40.2], photos: [photo("han-c-kapak")], coverPhotoId: "han-c-kapak" }),
  site("taslak-han", "Taslak Han", {
    status: "draft",
    coordinates: [29.09, 40.21],
    photos: [photo("taslak-kapak")],
    coverPhotoId: "taslak-kapak",
  }),
  site("izmir-cami", "İzmir Camii", { kind: "cami", city: "İzmir", district: "Konak", coordinates: [27.1, 38.4] }),
];

let app: App;
let stop: (() => Promise<void>) | undefined;

before(async () => {
  ({ app, stop } = await startTestApp());
  const db = app.deps.db;
  await loadCatalog(db, {
    sites,
    routes: [
      // Stop order is neither alphabetical nor insertion order, and an unpublished site sits in the middle.
      route("hanlar", ["han-c", "taslak-han", "han-a", "han-b"]),
      route("taslak-rota", ["han-a", "han-b"], { status: "draft" }),
      route("izmir-rota", ["izmir-cami"]),
      route("izmir-taslak", ["izmir-cami"], { status: "draft" }),
    ],
  });

  await db
    .insert(media)
    .values({ id: "rozet-hanlar", kind: "photo", mime: "image/png", url: BADGE_URL, alt: BADGE_ALT, license: "CC0", trust: "representative" });
  await db.update(catalogRoutes).set({ badgeTitle: "Hanlar Yolcusu", badgeMediaId: "rozet-hanlar" }).where(eq(catalogRoutes.id, "hanlar"));

  await db.insert(quizzes).values([quiz("quiz-han-a", "han-a"), quiz("quiz-han-c", "han-c"), quiz("quiz-taslak", "taslak-han")]);
  await db.insert(quizAnswers).values([
    { quizId: "quiz-han-a", correctIndex: 1 },
    { quizId: "quiz-han-c", correctIndex: 2 },
    { quizId: "quiz-taslak", correctIndex: 0 },
  ]);
  // "gecmis-han-a" is han-a's own history image.
  await db.insert(historyImages).values({ id: "gecmis-han-a", siteId: "han-a", position: 0, mediaId: "han-a-kapak", trust: "representative" });
  // han-b's stop points at a quiz of the unpublished site and at han-a's history image: both must read as null.
  const stopLinks = [
    ["han-c", { quizId: "quiz-han-c" }],
    ["taslak-han", { quizId: "quiz-taslak" }],
    ["han-a", { quizId: "quiz-han-a", historyImageId: "gecmis-han-a" }],
    ["han-b", { quizId: "quiz-taslak", historyImageId: "gecmis-han-a" }],
  ] as const;
  for (const [siteId, links] of stopLinks) {
    await db
      .update(routeStops)
      .set(links)
      .where(and(eq(routeStops.routeId, "hanlar"), eq(routeStops.siteId, siteId)));
  }
});
after(() => stop?.());

const get = async <T>(url: string) => {
  const res = await app.inject({ method: "GET", url });
  return { res, body: res.json<T>() };
};

test("a draft route is 404 on the bundle exactly like on its detail, and so is an unknown id", async () => {
  const detail = await get<ErrorBody>("/v1/routes/taslak-rota");
  assert.equal(detail.res.statusCode, 404);

  for (const id of ["taslak-rota", "yok"]) {
    const { res, body } = await get<ErrorBody>(`/v1/routes/${id}/bundle`);
    assert.equal(res.statusCode, 404, id);
    assert.equal(body.error.code, "NOT_FOUND");
    assert.equal(body.error.message, detail.body.error.message);
  }
});

test("the bundle holds the published stops in stop order with their playable quizzes, and revalidates with 304", async () => {
  const first = await get<RouteBundle>("/v1/routes/hanlar/bundle");
  assert.equal(first.res.statusCode, 200);
  assert.deepEqual(first.body.route.stops.map((s) => s.site.id), ["han-c", "han-a", "han-b"]);
  assert.deepEqual(first.body.sites.map((s) => s.id), ["han-c", "han-a", "han-b"]);
  assert.deepEqual(first.body.quizzes.map((q) => q.id), ["quiz-han-c", "quiz-han-a"]);
  // Neither the unpublished site, nor its quiz, nor its photo appears anywhere in the payload.
  assert.doesNotMatch(first.res.body, /taslak/i);

  const again = await app.inject({ method: "GET", url: "/v1/routes/hanlar/bundle", headers: { "if-none-match": String(first.res.headers.etag) } });
  assert.equal(again.statusCode, 304);
});

test("no payload carries the answer key, and a stop never links to an unpublished site's quiz or another site's history image", async () => {
  const { res, body } = await get<RouteBundle>("/v1/routes/hanlar/bundle");
  assert.doesNotMatch(res.body, /correct_?index/i);
  // The explanation is only revealed after a correct answer.
  assert.doesNotMatch(res.body, /Gizli açıklama/);
  for (const q of body.quizzes) {
    assert.deepEqual(Object.keys(q).sort(), ["hint", "id", "options", "optionsEn", "question", "questionEn", "siteId"]);
  }

  // han-b's stop points at the unpublished site's quiz and at han-a's history image: both read as null,
  // in the bundle's route and on route detail alike.
  const detail = await get<RouteDto>("/v1/routes/hanlar");
  for (const stops of [body.route.stops, detail.body.stops]) {
    assert.deepEqual(stops.map((s) => s.quizId), ["quiz-han-c", "quiz-han-a", null]);
    assert.deepEqual(stops.map((s) => s.historyImageId), [null, "gecmis-han-a", null]);
  }
});

test("assets are the media URLs of the published stops plus the route badge, each once", async () => {
  const { body } = await get<RouteBundle>("/v1/routes/hanlar/bundle");
  // "ortak" belongs to two stops and must be listed once; the unpublished site's photo must be absent.
  const expected = [cdn("han-a-kapak"), cdn("han-b-kapak"), cdn("han-c-kapak"), cdn("ortak"), BADGE_URL];
  assert.deepEqual([...body.assets].sort(), expected.sort());
  assert.deepEqual(body.route.badge, { title: "Hanlar Yolcusu", mediaId: "rozet-hanlar", url: BADGE_URL, alt: BADGE_ALT });

  const plain = await get<RouteBundle>("/v1/routes/izmir-rota/bundle");
  assert.equal(plain.body.route.badge, null);
  assert.deepEqual(plain.body.assets, []);
});

test("the city filter keeps only published routes of that city, accent- and case-insensitively", async () => {
  const ids = async (query: string) => (await get<{ items: RouteDto[] }>(`/v1/routes${query}`)).body.items.map((r) => r.id);

  assert.deepEqual(await ids(""), ["hanlar", "izmir-rota"]);
  assert.deepEqual(await ids("?city=bursa"), ["hanlar"]);
  for (const city of ["izmir", "İzmir", "IZMIR"]) {
    assert.deepEqual(await ids(`?city=${encodeURIComponent(city)}`), ["izmir-rota"], city);
  }
  assert.deepEqual(await ids("?city=ankara"), []);
});
