import { asc, eq } from "drizzle-orm";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { App } from "../../app.ts";
import { auditLog, catalogRoutes, cities, media, routeStops, siteAboutChapters, siteBadges, siteMedia, sitePartCardPhotos, sitePartCards, siteSectionPhotos, siteSections, siteTaskAnswers, siteTasks, sites, sources, userSiteBadges, userSiteTasks } from "../../db/schema/index.ts";
import { AppError, type ErrorBody } from "../../errors.ts";
import { authHeader } from "../../test/auth.ts";
import { startTestApp } from "../../test/harness.ts";
import type { SiteDetail } from "../catalog/schemas.ts";
import { asPublishBlocked, isPublishedCompleteViolation } from "./sites.ts";
import { adminSiteRoutes } from "./sites-routes.ts";
import type { AdminCardDto, AdminSiteDetail, AdminSiteListItem } from "./sites-schemas.ts";

type Method = "GET" | "POST" | "PUT" | "PATCH";
type Headers = Record<string, string>;
type Page = { items: AdminSiteListItem[]; nextCursor: string | null };

const editor = authHeader({ id: "editor-1", role: "editor" });
const user = authHeader({ id: "user-1", role: "user" });
const moderator = authHeader({ id: "mod-1", role: "moderator" });

let app: App;
let stop: (() => Promise<void>) | undefined;

type MediaInsert = typeof media.$inferInsert;
const photo = (id: string, over: Partial<MediaInsert> = {}): MediaInsert => ({
  id,
  kind: "photo",
  mime: "image/jpeg",
  url: `https://cdn.test/${id}.jpg`,
  alt: `${id} alt metni`,
  license: "CC BY 4.0",
  sourceId: "src-vgm",
  trust: "verified",
  ...over,
});

before(async () => {
  ({ app, stop } = await startTestApp({ register: [adminSiteRoutes] }));
  const db = app.deps.db;
  await db.insert(cities).values([
    { id: "bursa", name: "Bursa" },
    { id: "edirne", name: "Edirne" },
  ]);
  await db.insert(sources).values([
    { id: "src-vgm", title: "VGM Bursa Envanteri", kind: "book", trust: "verified" },
    { id: "src-ek", title: "Ek Kaynak", kind: "article", trust: "inferred" },
  ]);
  await db.insert(media).values([
    photo("ph-1"),
    photo("ph-2"),
    photo("ph-3"),
    // Its source is not the one the sites list: the photo rule of the publish gate needs both.
    photo("ph-foreign", { sourceId: "src-ek" }),
    { id: "m-1", kind: "model", mime: "model/gltf-binary", url: "https://cdn.test/m-1.glb", license: "CC0", trust: "verified", title: "Model 1", bytes: 2048, parts: ["kubbe", "minare"] },
    { id: "m-2", kind: "model", mime: "model/gltf-binary", url: "https://cdn.test/m-2.glb", license: "CC0", trust: "verified", title: "Model 2", bytes: 4096, parts: ["avlu"] },
    { id: "au-1", kind: "audio", mime: "audio/mpeg", url: "https://cdn.test/au-1.mp3", license: "CC0", trust: "verified" },
  ]);
});
after(() => stop?.());

const call = async <T = unknown>(method: Method, url: string, headers?: Headers, payload?: object) => {
  const res = await app.inject({ method, url, headers: { ...headers }, ...(payload === undefined ? {} : { payload }) });
  return { res, body: res.json<T>() };
};

/** An editor write that must succeed; returns the site's editable view. */
const send = async (method: Method, url: string, payload?: object): Promise<AdminSiteDetail> => {
  const { res, body } = await call<AdminSiteDetail>(method, url, editor, payload);
  assert.equal(res.statusCode, 200, `${method} ${url}: ${res.body}`);
  return body;
};

const newDraft = async (name: string, over: Record<string, unknown> = {}): Promise<AdminSiteDetail> => {
  const { res, body } = await call<AdminSiteDetail>("POST", "/v1/admin/sites", editor, {
    name,
    city: "bursa",
    district: "Osmangazi",
    typeId: "han",
    description: "Hanlar bölgesinde bir han.",
    ...over,
  });
  assert.equal(res.statusCode, 201, res.body);
  return body;
};

const story = (over: Record<string, unknown> = {}) => ({
  title: "Giriş",
  text: "Han 1491'de yapıldı.",
  simple: "Han eskidir.",
  trust: "verified",
  photoId: "ph-1",
  sourceId: "src-vgm",
  highlights: [],
  ...over,
});

/** Fills in location, sources, photos and a story: everything the publish gate asks for. */
const makePublishable = async (id: string): Promise<AdminSiteDetail> => {
  const base = `/v1/admin/sites/${id}`;
  await send("PUT", `${base}/location`, { coordinates: [29.06, 40.18] });
  await send("PUT", `${base}/sources`, { sources: [{ id: "src-vgm", title: "VGM Bursa Envanteri", kind: "book", trust: "verified" }] });
  await send("PUT", `${base}/media`, { photoIds: ["ph-1", "ph-2"], coverPhotoId: "ph-1" });
  return send("PUT", `${base}/stories`, { blocks: [story()] });
};

const auditOf = (entityId: string) => app.deps.db.select().from(auditLog).where(eq(auditLog.entityId, entityId)).orderBy(asc(auditLog.id));

test("the panel is for editors and admins: guests get 401, users and moderators 403, and a refused write changes nothing", async () => {
  const target = await newDraft("Yetki Hanı");
  const card = (await call<AdminCardDto>("POST", "/v1/admin/cards", editor, { kind: "photo", title: "Yetki Kartı", mediaId: "ph-1", trust: "verified" })).body;
  const base = `/v1/admin/sites/${target.id}`;
  const attempts: [Method, string, object?][] = [
    ["GET", "/v1/admin/sites"],
    ["GET", base],
    ["POST", "/v1/admin/sites", { name: "Yetkisiz Han", city: "bursa" }],
    ["PATCH", `${base}/info`, { name: "Ele Geçirildi" }],
    ["PUT", `${base}/location`, { coordinates: [29, 40] }],
    ["PUT", `${base}/model`, { mediaId: "m-1" }],
    ["PUT", `${base}/media`, { photoIds: ["ph-1"], coverPhotoId: "ph-1" }],
    ["PUT", `${base}/sources`, { sources: [{ title: "Kaynak", kind: "book", trust: "verified" }] }],
    ["PUT", `${base}/stories`, { blocks: [story()] }],
    ["PUT", `${base}/about`, { chapters: [], looseSections: [{ kind: "history", title: "Tarihçe", body: "Metin", trust: "verified" }] }],
    ["PUT", `${base}/history-images`, { images: [{ mediaId: "ph-1", trust: "verified" }] }],
    ["PUT", `${base}/part-cards`, { cards: [] }],
    ["PUT", `${base}/tasks`, { tasks: [], badges: [] }],
    ["POST", `${base}/publish`],
    ["POST", `${base}/unpublish`],
    ["GET", "/v1/admin/cards"],
    ["POST", "/v1/admin/cards", { kind: "photo", title: "Yetkisiz Kart", mediaId: "ph-1", trust: "verified" }],
    ["PATCH", `/v1/admin/cards/${card.id}`, { title: "Ele Geçirildi" }],
  ];
  for (const [method, url, payload] of attempts) {
    for (const [who, headers] of [
      ["user", user],
      ["moderator", moderator],
    ] as const) {
      const { res, body } = await call<ErrorBody>(method, url, headers, payload);
      assert.equal(res.statusCode, 403, `${who} ${method} ${url}`);
      assert.equal(body.error.code, "FORBIDDEN");
    }
  }
  for (const [method, url, payload] of [attempts[0]!, attempts[3]!]) {
    const { res, body } = await call<ErrorBody>(method, url, undefined, payload);
    assert.equal(res.statusCode, 401, `guest ${method} ${url}`);
    assert.equal(body.error.code, "UNAUTHENTICATED");
  }

  // Nothing was written: the site and the card are as created, and no stray records exist.
  const detail = (await call<AdminSiteDetail>("GET", base, editor)).body;
  assert.equal(detail.name, "Yetki Hanı");
  assert.deepEqual(detail.stories, []);
  assert.deepEqual((await auditOf(target.id)).map((r) => r.action), ["site.create"]);
  const cardList = (await call<{ items: AdminCardDto[] }>("GET", "/v1/admin/cards?limit=100", editor)).body.items;
  assert.deepEqual(cardList.filter((c) => c.title !== "Yetki Kartı").map((c) => c.title), []);
  const stray = (await call<Page>("GET", "/v1/admin/sites?query=yetkisiz", editor)).body.items;
  assert.deepEqual(stray, []);

  // Editors and admins are let in.
  assert.equal((await call("GET", "/v1/admin/sites?limit=1", authHeader({ id: "admin-1", role: "admin" }))).res.statusCode, 200);
});

test("create makes a v2 Tier 1 draft that is not public; the same name and district again is a 409 naming the first", async () => {
  const first = await newDraft("Koza Hanı", { typeId: null, description: "" });
  assert.equal(first.id, "bursa-koza-hani-osmangazi");
  assert.equal(first.status, "draft");
  assert.equal(first.editorVersion, 2);
  assert.equal(first.tier, "Tier 1");
  assert.equal(first.kind, null);
  assert.equal(first.coordinates, null);
  assert.equal(first.district, "Osmangazi");
  assert.equal((await call("GET", `/v1/sites/${first.id}`)).res.statusCode, 404);

  // Same building typed differently (case, Turkish dotless i, lower-case district).
  const dup = await call<ErrorBody>("POST", "/v1/admin/sites", editor, { name: "KOZA HANI", city: "bursa", district: "osmangazi" });
  assert.equal(dup.res.statusCode, 409);
  assert.equal(dup.body.error.code, "CONFLICT");
  assert.deepEqual(dup.body.error.fieldErrors.existingSiteId, [first.id]);

  // Another district is another building.
  const other = await newDraft("Koza Hanı", { district: "Yıldırım" });
  assert.equal(other.id, "bursa-koza-hani-yildirim");

  const unknownCity = await call<ErrorBody>("POST", "/v1/admin/sites", editor, { name: "Han", city: "yok" });
  assert.equal(unknownCity.res.statusCode, 400);
  assert.ok(unknownCity.body.error.fieldErrors.city);
});

test("the map order (eser.json sira) is read-only in the panel: the detail carries it, create and Bilgiler never write it", async () => {
  const draft = await newDraft("Sıra Hanı", { displayOrder: 1 });
  assert.equal(draft.displayOrder, null, "create ignores it; only the importer fills it");
  const base = `/v1/admin/sites/${draft.id}`;
  await app.deps.db.update(sites).set({ displayOrder: 4 }).where(eq(sites.id, draft.id));
  assert.equal((await call<AdminSiteDetail>("GET", base, editor)).body.displayOrder, 4);

  const patched = await send("PATCH", `${base}/info`, { year: "1500", displayOrder: 9 });
  assert.equal(patched.year, "1500");
  assert.equal(patched.displayOrder, 4, "PATCH leaves the stored order as it was");
  assert.equal((await send("PUT", `${base}/location`, { coordinates: [29.06, 40.18] })).displayOrder, 4, "so do the other steps");
  const [row] = await app.deps.db.select({ displayOrder: sites.displayOrder }).from(sites).where(eq(sites.id, draft.id));
  assert.equal(row?.displayOrder, 4);
});

test("an id is made unique when the slug is taken by a site with another duplicate key", async () => {
  const first = await newDraft("Eski-Han", { district: "Gemlik" });
  // "Eski Han" and "Eski-Han" normalize differently (so no 409) but slugify to the same id.
  const second = await newDraft("Eski Han", { district: "Gemlik" });
  assert.equal(first.id, "bursa-eski-han-gemlik");
  assert.equal(second.id, "bursa-eski-han-gemlik-2");
});

test("replaying a create with the same Idempotency-Key answers the first response and writes once; another body under the key is refused", async () => {
  const payload = { name: "Tekrar Hanı", city: "bursa", district: "Osmangazi" };
  const headers = { ...editor, "idempotency-key": "create-tekrar-1" };
  const first = await call<AdminSiteDetail>("POST", "/v1/admin/sites", headers, payload);
  const replay = await call<AdminSiteDetail>("POST", "/v1/admin/sites", headers, payload);
  assert.equal(first.res.statusCode, 201);
  assert.equal(replay.res.statusCode, 201);
  assert.deepEqual(replay.body, first.body);
  assert.deepEqual((await auditOf(first.body.id)).map((r) => r.action), ["site.create"]);
  const count = (await call<Page>("GET", "/v1/admin/sites?query=tekrar", editor)).body.items.length;
  assert.equal(count, 1);

  const reused = await call<ErrorBody>("POST", "/v1/admin/sites", headers, { ...payload, name: "Başka Han" });
  assert.equal(reused.res.statusCode, 422);
  assert.equal(reused.body.error.code, "IDEMPOTENCY_KEY_REUSED");
});

test("Bilgiler: references are checked, and a rename or move keeps search text, duplicate key and region in step", async () => {
  const a = await newDraft("Eski Ad");
  const b = await newDraft("Çakışan Ad", { district: "Yıldırım" });
  const info = `/v1/admin/sites/${a.id}/info`;

  const bad = await call<ErrorBody>("PATCH", info, editor, { typeId: "yok", periodId: "yok", relatedSiteId: a.id });
  assert.equal(bad.res.statusCode, 400);
  assert.deepEqual(Object.keys(bad.body.error.fieldErrors).sort(), ["periodId", "relatedSiteId", "typeId"]);

  const moved = await send("PATCH", info, { name: "Yeni Ad", district: "Nilüfer", architect: "Mimar Xyz", nameEn: "New Name", relatedSiteId: b.id });
  assert.equal(moved.dedupeKey, "yeni ad|nilufer");
  assert.equal(moved.district, "Nilüfer");
  assert.equal(moved.nameEn, "New Name");
  assert.equal(moved.relatedSiteId, b.id);

  const find = async (query: string) => (await call<Page>("GET", `/v1/admin/sites?query=${encodeURIComponent(query)}`, editor)).body.items.map((i) => i.id);
  assert.ok((await find("NILÜFER")).includes(a.id));
  assert.ok((await find("mimar xyz")).includes(a.id));
  assert.ok(!(await find("eski ad")).includes(a.id));

  // Moving the other site onto this identity is the same 409 as creating it.
  const clash = await call<ErrorBody>("PATCH", `/v1/admin/sites/${b.id}/info`, editor, { name: "Yeni Ad", district: "Nilüfer" });
  assert.equal(clash.res.statusCode, 409);
  assert.deepEqual(clash.body.error.fieldErrors.existingSiteId, [a.id]);
  assert.equal((await call<AdminSiteDetail>("GET", `/v1/admin/sites/${b.id}`, editor)).body.name, "Çakışan Ad");
});

test("Bilgiler: a site moves to another city by id or name; the district, search and duplicate key follow, and route stops or unknown cities refuse", async () => {
  const db = app.deps.db;
  // A city of its own, so the Edirne list of the panel test stays exact.
  await db.insert(cities).values({ id: "kutahya", name: "Kütahya" });
  const moving = await newDraft("Göçer Hanı", { district: "Merkez" });
  const twin = await newDraft("Göçer Hanı", { city: "kutahya", district: "Merkez" });
  const info = `/v1/admin/sites/${moving.id}/info`;
  const unchanged = async () => {
    const now = (await call<AdminSiteDetail>("GET", `/v1/admin/sites/${moving.id}`, editor)).body;
    assert.deepEqual([now.city.id, now.district, now.dedupeKey], ["bursa", "Merkez", moving.dedupeKey]);
  };

  const unknown = await call<ErrorBody>("PATCH", info, editor, { city: "Atlantis" });
  assert.equal(unknown.res.statusCode, 400);
  assert.deepEqual(unknown.body.error.fieldErrors.city, ["Şehir bulunamadı."]);

  // Same name and district as a site of the new city: the 409 of create, even though the key itself does not change.
  const clash = await call<ErrorBody>("PATCH", info, editor, { city: "kutahya" });
  assert.equal(clash.res.statusCode, 409);
  assert.deepEqual(clash.body.error.fieldErrors.existingSiteId, [twin.id]);
  await unchanged();

  await db.insert(catalogRoutes).values({ id: "goc-rotasi", cityId: "bursa", name: "Göç rotası", description: "Duraklı", theme: "tarih" });
  await db.insert(routeStops).values({ routeId: "goc-rotasi", position: 0, siteId: moving.id });
  const stop = await call<ErrorBody>("PATCH", info, editor, { city: "Kütahya", name: "Göçer Hanı Yeni" });
  assert.equal(stop.res.statusCode, 400);
  assert.match(stop.body.error.fieldErrors.city?.[0] ?? "", /Göç rotası/);
  await unchanged();
  await db.delete(routeStops).where(eq(routeStops.routeId, "goc-rotasi"));

  // The city's display name works as well as its id; the district is looked up again in the new city.
  const moved = await send("PATCH", info, { city: "Kütahya", name: "Göçer Hanı Yeni" });
  assert.deepEqual(moved.city, { id: "kutahya", name: "Kütahya" });
  assert.equal(moved.district, "Merkez");
  assert.equal(moved.id, moving.id);
  const [row] = await db.select({ regionId: sites.regionId }).from(sites).where(eq(sites.id, moving.id));
  assert.equal(row?.regionId, "kutahya-merkez");
  const listed = async (query: string) => (await call<Page>("GET", `/v1/admin/sites?limit=100&${query}`, editor)).body.items.map((i) => i.id);
  assert.ok((await listed("city=kutahya")).includes(moving.id));
  assert.ok(!(await listed("city=bursa")).includes(moving.id));
  assert.ok((await listed("query=kutahya")).includes(moving.id));

  // Sending the current city (here by name) is no move: no route or duplicate check runs.
  await db.insert(routeStops).values({ routeId: "goc-rotasi", position: 0, siteId: twin.id });
  assert.equal((await send("PATCH", `/v1/admin/sites/${twin.id}/info`, { city: "Kütahya", year: "1500" })).year, "1500");
});

test("publishing is blocked with Turkish issues until the site is complete; then it is public, and unpublishing hides it again", async () => {
  const draft = await newDraft("Kapı Camii", { typeId: null, description: "" });
  const id = draft.id;
  const base = `/v1/admin/sites/${id}`;

  const blocked = await call<ErrorBody>("POST", `${base}/publish`, editor);
  assert.equal(blocked.res.statusCode, 422);
  assert.equal(blocked.body.error.code, "PUBLISH_BLOCKED");
  const issues = blocked.body.error.fieldErrors._!;
  for (const expected of [
    "Yapı türü seç.",
    "Ad, şehir ve kısa tanım (TR) zorunludur.",
    "Geçerli enlem ve boylam gir.",
    "En az bir başlıklı kaynak ekle.",
    "Kapak fotoğrafı seç.",
    "En az bir hikâye cümlesi ekle.",
  ]) {
    assert.ok(issues.includes(expected), expected);
  }
  assert.deepEqual((await call<AdminSiteDetail>("GET", base, editor)).body.issues, issues);
  assert.equal((await call("GET", `/v1/sites/${id}`)).res.statusCode, 404);

  // Bilgiler and the pin: the editor confirms the location, which is then "manual".
  let site = await send("PATCH", `${base}/info`, { typeId: "han", description: "Hanlar bölgesinde bir han.", year: "1491", periodId: "erken-osmanli" });
  assert.ok(!site.issues.includes("Yapı türü seç.") && !site.issues.includes("Ad, şehir ve kısa tanım (TR) zorunludur."));
  site = await send("PUT", `${base}/location`, { coordinates: [29.0627, 40.1853] });
  assert.equal(site.locationSource, "manual");
  assert.deepEqual(site.coordinates, [29.0627, 40.1853]);

  // Photos whose source the site does not list yet fail the photo rule.
  site = await send("PUT", `${base}/media`, { photoIds: ["ph-1", "ph-foreign"], coverPhotoId: "ph-1" });
  assert.deepEqual(site.photoIds, ["ph-1", "ph-foreign"]);
  assert.equal(site.coverMediaId, "ph-1");
  assert.ok(site.issues.includes("Her fotoğrafta alt metin, lisans ve kaynak zorunludur."));
  assert.ok(!site.issues.includes("Kapak fotoğrafı seç."));

  site = await send("PUT", `${base}/sources`, {
    sources: [
      { id: "src-vgm", title: "VGM Bursa Envanteri", kind: "book", trust: "verified", locator: "s. 42" },
      { id: "src-ek", title: "Ek Kaynak", kind: "article", trust: "inferred" },
    ],
  });
  assert.deepEqual(site.sourceLinks, [
    { sourceId: "src-vgm", locator: "s. 42" },
    { sourceId: "src-ek", locator: null },
  ]);
  assert.ok(!site.issues.some((i) => i.startsWith("Her fotoğrafta")) && !site.issues.includes("En az bir başlıklı kaynak ekle."));

  // Hikâye: a draft may leave the links open, the gate says which sentence lacks what.
  site = await send("PUT", `${base}/stories`, { blocks: [story({ photoId: null, sourceId: null })] });
  assert.deepEqual(site.issues, ["1. cümleye kaynak bağla.", "1. cümleye fotoğraf bağla."]);
  const stillBlocked = await call<ErrorBody>("POST", `${base}/publish`, editor);
  assert.equal(stillBlocked.res.statusCode, 422);
  assert.deepEqual(stillBlocked.body.error.fieldErrors._, site.issues);

  site = await send("PUT", `${base}/stories`, {
    blocks: [story(), story({ title: "İkinci", text: "Yıllar sonra onarıldı.", trust: "inferred", photoId: "ph-foreign", sourceId: "src-ek" })],
  });
  assert.deepEqual(site.issues, []);
  assert.equal(site.trust, "inferred");

  const published = await call<AdminSiteDetail>("POST", `${base}/publish`, editor);
  assert.equal(published.res.statusCode, 200);
  assert.equal(published.body.status, "published");

  const publicDetail = await call<SiteDetail>("GET", `/v1/sites/${id}`);
  assert.equal(publicDetail.res.statusCode, 200);
  assert.equal(publicDetail.body.kind, "han");
  assert.equal(publicDetail.body.coverImage?.id, "ph-1");
  assert.deepEqual(publicDetail.body.coordinates, [29.0627, 40.1853]);
  assert.equal(publicDetail.body.stories.length, 2);
  const publicList = await call<{ items: { id: string }[] }>("GET", `/v1/sites?query=${encodeURIComponent("kapı camii")}`);
  assert.deepEqual(publicList.body.items.map((i) => i.id), [id]);

  // A live site cannot lose its type; the database CHECK stands behind this too.
  const typeless = await call<ErrorBody>("PATCH", `${base}/info`, editor, { typeId: null });
  assert.equal(typeless.res.statusCode, 422);
  assert.equal(typeless.body.error.code, "PUBLISH_BLOCKED");
  assert.equal((await call<AdminSiteDetail>("GET", base, editor)).body.kind, "han");
  assert.equal((await call<ErrorBody>("POST", `${base}/publish`, editor)).res.statusCode, 409);

  const hidden = await call<AdminSiteDetail>("POST", `${base}/unpublish`, editor);
  assert.equal(hidden.res.statusCode, 200);
  assert.equal(hidden.body.status, "draft");
  assert.equal((await call("GET", `/v1/sites/${id}`)).res.statusCode, 404);
  assert.deepEqual((await call<{ items: { id: string }[] }>("GET", `/v1/sites?query=${encodeURIComponent("kapı camii")}`)).body.items, []);
  assert.equal((await call<ErrorBody>("POST", `${base}/unpublish`, editor)).res.statusCode, 409);
});

test("a street or neighbourhood-centre pin blocks publishing until the editor confirms it with PUT location", async () => {
  for (const source of ["nominatim-street", "nominatim-neighbourhood"]) {
    const draft = await newDraft(`Yaklaşık ${source}`);
    const base = `/v1/admin/sites/${draft.id}`;
    await makePublishable(draft.id);
    // What an import leaves behind: a geocoder hit that is not the building.
    await app.deps.db.update(sites).set({ locationSource: source }).where(eq(sites.id, draft.id));

    const detail = (await call<AdminSiteDetail>("GET", base, editor)).body;
    assert.equal(detail.locationSource, source);
    assert.equal(detail.issues.length, 1);
    assert.match(detail.issues[0]!, /yaklaşık/);

    const blocked = await call<ErrorBody>("POST", `${base}/publish`, editor);
    assert.equal(blocked.res.statusCode, 422);
    assert.deepEqual(blocked.body.error.fieldErrors._, detail.issues);
    assert.equal((await call("GET", `/v1/sites/${draft.id}`)).res.statusCode, 404);

    const confirmed = await send("PUT", `${base}/location`, { coordinates: [29.07, 40.19] });
    assert.equal(confirmed.locationSource, "manual");
    assert.deepEqual(confirmed.issues, []);
    assert.equal((await call("POST", `${base}/publish`, editor)).res.statusCode, 200);
    assert.equal((await call("GET", `/v1/sites/${draft.id}`)).res.statusCode, 200);
  }
});

test("the DB publish CHECK is told apart from other database errors, however the driver wraps it", async () => {
  const draft = await newDraft("Çek Hanı", { typeId: null });
  const db = app.deps.db;
  const violation = await db
    .update(sites)
    .set({ status: "published" })
    .where(eq(sites.id, draft.id))
    .then(() => undefined, (err: unknown) => err);
  assert.ok(isPublishedCompleteViolation(violation));
  const blocked = asPublishBlocked(violation);
  assert.ok(blocked instanceof AppError);
  assert.equal(blocked.statusCode, 422);
  assert.equal(blocked.code, "PUBLISH_BLOCKED");

  const duplicateKey = await db
    .insert(sites)
    .values({ id: draft.id, cityId: "bursa", name: "x", tier: "Tier 1", trust: "inferred", dedupeKey: "x|", searchText: "x", sortName: "x" })
    .then(() => undefined, (err: unknown) => err);
  assert.ok(duplicateKey);
  assert.equal(isPublishedCompleteViolation(duplicateKey), false);
  assert.equal(asPublishBlocked(duplicateKey), duplicateKey);
});

test("story blocks must point at a real photo, source and card, and highlights at parts of the linked model; a refused save writes nothing", async () => {
  const draft = await newDraft("Hikâye Hanı");
  const base = `/v1/admin/sites/${draft.id}`;
  await send("PUT", `${base}/model`, { mediaId: "m-1" });
  const camera = { target: "kubbe", azimuthDeg: 20, elevationDeg: 55, distance: 0.62 };
  const kept = await send("PUT", `${base}/stories`, { blocks: [story({ highlights: ["kubbe"], camera, interior: true })] });
  assert.deepEqual(kept.stories.map((s) => s.highlights), [["kubbe"]]);
  assert.deepEqual(kept.stories.map((s) => s.camera), [camera]);
  assert.deepEqual(kept.stories.map((s) => s.interior), [true]);
  const rowsBefore = (await auditOf(draft.id)).length;

  const bad = await call<ErrorBody>("PUT", `${base}/stories`, editor, {
    blocks: [
      story({ highlights: ["minare"] }),
      story({ photoId: "au-1", sourceId: "yok", cardId: "yok", highlights: ["kubbe", "avlu"], camera: { ...camera, target: "avlu" } }),
    ],
  });
  assert.equal(bad.res.statusCode, 400);
  assert.equal(bad.body.error.code, "VALIDATION_FAILED");
  assert.deepEqual(Object.keys(bad.body.error.fieldErrors).sort(), [
    "blocks.1.camera.target",
    "blocks.1.cardId",
    "blocks.1.highlights",
    "blocks.1.photoId",
    "blocks.1.sourceId",
  ]);
  assert.match(bad.body.error.fieldErrors["blocks.1.highlights"]![0]!, /avlu/);

  // The failed save left the previous story and no audit row behind.
  const after = (await call<AdminSiteDetail>("GET", base, editor)).body;
  assert.deepEqual(after.stories.map((s) => s.highlights), [["kubbe"]]);
  assert.equal((await auditOf(draft.id)).length, rowsBefore);

  // Media of the wrong kind is refused for the model as well.
  const notModel = await call<ErrorBody>("PUT", `${base}/model`, editor, { mediaId: "ph-1" });
  assert.equal(notModel.res.statusCode, 400);
  assert.ok(notModel.body.error.fieldErrors.mediaId);

  // Duplicate block ids are refused instead of failing on the primary key.
  const twice = await call<ErrorBody>("PUT", `${base}/stories`, editor, { blocks: [story({ id: "ayni" }), story({ id: "ayni" })] });
  assert.equal(twice.res.statusCode, 400);
  assert.ok(twice.body.error.fieldErrors["blocks.1.id"]);
});

test("the model link is replaced, not added, and model and photo links keep valid positions", async () => {
  const draft = await newDraft("Model Hanı");
  const base = `/v1/admin/sites/${draft.id}`;
  const links = async () => (await app.deps.db.select().from(siteMedia).where(eq(siteMedia.siteId, draft.id)).orderBy(asc(siteMedia.position))).map((l) => l.mediaId);

  let site = await send("PUT", `${base}/model`, { mediaId: "m-1", openingCamera: { azimuthDeg: 30, elevationDeg: 15, distance: 0.8 } });
  assert.equal(site.modelMediaId, "m-1");
  assert.deepEqual(site.openingCamera, { target: null, azimuthDeg: 30, elevationDeg: 15, distance: 0.8 });
  assert.equal(site.has.model, true);

  site = await send("PUT", `${base}/media`, { photoIds: ["ph-1", "ph-2", "ph-3"], coverPhotoId: "ph-2" });
  assert.deepEqual(site.photoIds, ["ph-1", "ph-2", "ph-3"]);
  assert.equal(site.coverMediaId, "ph-2");
  assert.equal(site.modelMediaId, "m-1");

  // A new model replaces the old one; the camera belonged to the old model.
  site = await send("PUT", `${base}/model`, { mediaId: "m-2" });
  assert.equal(site.modelMediaId, "m-2");
  assert.equal(site.openingCamera, null);
  assert.deepEqual(await links(), ["m-2", "ph-1", "ph-2", "ph-3"]);

  site = await send("PUT", `${base}/media`, { photoIds: ["ph-3", "ph-1"], coverPhotoId: "ph-3" });
  assert.deepEqual(site.photoIds, ["ph-3", "ph-1"]);
  assert.deepEqual(await links(), ["m-2", "ph-3", "ph-1"]);

  const refused = [
    await call<ErrorBody>("PUT", `${base}/media`, editor, { photoIds: ["ph-1"], coverPhotoId: "ph-2" }),
    await call<ErrorBody>("PUT", `${base}/media`, editor, { photoIds: ["m-1"], coverPhotoId: null }),
    await call<ErrorBody>("PUT", `${base}/media`, editor, { photoIds: ["ph-1", "ph-1"], coverPhotoId: "ph-1" }),
    await call<ErrorBody>("PUT", `${base}/model`, editor, { mediaId: null, openingCamera: { azimuthDeg: 1, elevationDeg: 1, distance: 1 } }),
  ];
  assert.deepEqual(refused.map((r) => r.res.statusCode), [400, 400, 400, 400]);
  assert.ok(refused[0]!.body.error.fieldErrors.coverPhotoId);
  assert.ok(refused[1]!.body.error.fieldErrors["photoIds.0"]);
  assert.ok(refused[2]!.body.error.fieldErrors["photoIds.1"]);
  assert.ok(refused[3]!.body.error.fieldErrors.openingCamera);
  assert.deepEqual(await links(), ["m-2", "ph-3", "ph-1"]);

  site = await send("PUT", `${base}/model`, { mediaId: null });
  assert.equal(site.modelMediaId, null);
  assert.equal(site.has.model, false);
  assert.deepEqual(await links(), ["ph-3", "ph-1"]);
});

test("a gallery photo keeps its 3D angle through a reorder and a new model; null removes it; a foreign photo or part is refused", async () => {
  const draft = await newDraft("Açı Hanı");
  const base = `/v1/admin/sites/${draft.id}`;
  await send("PUT", `${base}/model`, { mediaId: "m-1" });
  const view = { target: "kubbe", azimuthDeg: 354, elevationDeg: 30, distance: 0.95 };
  let site = await send("PUT", `${base}/media`, {
    photoIds: ["ph-1", "ph-2"],
    coverPhotoId: "ph-1",
    cameras: { "ph-1": view, "ph-2": { ...view, target: null, interior: true } },
  });
  assert.deepEqual(site.photoCameras, [
    { photoId: "ph-1", camera: view },
    { photoId: "ph-2", camera: { ...view, target: null, interior: true } },
  ]);
  // A reorder without cameras keeps them; so does a new model.
  site = await send("PUT", `${base}/media`, { photoIds: ["ph-2", "ph-1"], coverPhotoId: "ph-1" });
  assert.deepEqual(site.photoCameras.map((c: { photoId: string }) => c.photoId), ["ph-2", "ph-1"]);
  site = await send("PUT", `${base}/model`, { mediaId: "m-2" });
  assert.equal(site.photoCameras.length, 2);
  site = await send("PUT", `${base}/media`, { photoIds: ["ph-2", "ph-1"], coverPhotoId: "ph-1", cameras: { "ph-2": null } });
  assert.deepEqual(site.photoCameras.map((c: { photoId: string }) => c.photoId), ["ph-1"]);

  const refused = [
    await call<ErrorBody>("PUT", `${base}/media`, editor, { photoIds: ["ph-1"], coverPhotoId: "ph-1", cameras: { "ph-3": view } }),
    // m-2's parts are «avlu» only.
    await call<ErrorBody>("PUT", `${base}/media`, editor, { photoIds: ["ph-1"], coverPhotoId: "ph-1", cameras: { "ph-1": view } }),
  ];
  assert.deepEqual(refused.map((r) => r.res.statusCode), [400, 400]);
  assert.ok(refused[0]!.body.error.fieldErrors["cameras.ph-3"]);
  assert.ok(refused[1]!.body.error.fieldErrors["cameras.ph-1.target"]);
});

test("a card is shared by reference: editing it changes what every sentence of every site shows", async () => {
  const create = await call<AdminCardDto>("POST", "/v1/admin/cards", editor, { kind: "portrait", title: "Mimar", mediaId: "ph-2", sourceId: "src-vgm", trust: "inferred" });
  assert.equal(create.res.statusCode, 201);
  const card = create.body;
  assert.equal(card.usageCount, 0);

  const a = await newDraft("Kartlı Han A");
  const b = await newDraft("Kartlı Han B");
  for (const site of [a, b]) {
    await send("PUT", `/v1/admin/sites/${site.id}/stories`, { blocks: [story({ cardId: card.id }), story({ title: "Tekrar", cardId: card.id })] });
  }
  const before = (await call<AdminSiteDetail>("GET", `/v1/admin/sites/${a.id}`, editor)).body;
  assert.deepEqual(before.cards.map((c) => c.id), [card.id]);

  const patched = await call<AdminCardDto>("PATCH", `/v1/admin/cards/${card.id}`, editor, { title: "Mimar Kasım", body: "Yeni gövde", trust: "verified" });
  assert.equal(patched.res.statusCode, 200);
  assert.equal(patched.body.usageCount, 4);
  for (const site of [a, b]) {
    const detail = (await call<AdminSiteDetail>("GET", `/v1/admin/sites/${site.id}`, editor)).body;
    assert.deepEqual(detail.cards.map((c) => [c.id, c.title, c.body, c.trust]), [[card.id, "Mimar Kasım", "Yeni gövde", "verified"]]);
    assert.deepEqual(detail.stories.map((s) => s.cardId), [card.id, card.id]);
  }
  const after = (await call<AdminSiteDetail>("GET", `/v1/admin/sites/${a.id}`, editor)).body;
  assert.ok(after.updatedAt > before.updatedAt, "the sites that use the card are touched");

  const refused = await call<ErrorBody>("PATCH", `/v1/admin/cards/${card.id}`, editor, { mediaId: "m-1" });
  assert.equal(refused.res.statusCode, 400);
  assert.ok(refused.body.error.fieldErrors.mediaId);
  assert.equal((await call<ErrorBody>("PATCH", "/v1/admin/cards/yok", editor, { title: "X" })).res.statusCode, 404);

  // The library lists newest first with its usage, page by page, without repeats.
  for (const title of ["Kart İkinci", "Kart Üçüncü"]) {
    await call("POST", "/v1/admin/cards", editor, { kind: "document", title, mediaId: "ph-3", trust: "verified" });
  }
  const seen: AdminCardDto[] = [];
  let cursor: string | null = null;
  for (let guard = 0; guard < 20; guard++) {
    const page: { items: AdminCardDto[]; nextCursor: string | null } = (
      await call<{ items: AdminCardDto[]; nextCursor: string | null }>("GET", `/v1/admin/cards?limit=1${cursor ? `&cursor=${cursor}` : ""}`, editor)
    ).body;
    seen.push(...page.items);
    cursor = page.nextCursor;
    if (!cursor) break;
  }
  assert.equal(new Set(seen.map((c) => c.id)).size, seen.length);
  assert.deepEqual(seen.slice(0, 2).map((c) => c.title), ["Kart Üçüncü", "Kart İkinci"]);
  assert.equal(seen.find((c) => c.id === card.id)?.usageCount, 4);
  assert.equal((await call<ErrorBody>("GET", "/v1/admin/cards?cursor=bozuk", editor)).res.statusCode, 400);
});

test("archive images keep their ids when saved again, so route stops that point at them survive a reorder", async () => {
  const site = await newDraft("Gravür Hanı");
  const other = await newDraft("Gravür Komşusu");
  const base = `/v1/admin/sites/${site.id}/history-images`;
  const db = app.deps.db;

  const first = await send("PUT", base, {
    images: [
      { mediaId: "ph-1", caption: "Han, 1890'lar", dateLabel: "1890'lar", sourceId: "src-vgm", trust: "verified" },
      { mediaId: "ph-2", presentMediaId: "ph-3", trust: "inferred", camera: { azimuthDeg: 45, elevationDeg: 10, distance: 0.6 } },
    ],
  });
  const [a, b] = first.historyImages.map((h) => h.id) as [string, string];
  assert.notEqual(a, b);

  await db.insert(catalogRoutes).values({ id: "gravur-rotasi", cityId: "bursa", name: "Gravür rotası", description: "Eski görsellerle", theme: "tarih" });
  await db.insert(routeStops).values({ routeId: "gravur-rotasi", position: 0, siteId: site.id, historyImageId: a });
  const stopImage = async () => (await db.select().from(routeStops).where(eq(routeStops.routeId, "gravur-rotasi")))[0]?.historyImageId;

  const second = await send("PUT", base, {
    images: [
      { id: b, mediaId: "ph-2", trust: "inferred" },
      { id: a, mediaId: "ph-1", caption: "Düzeltilmiş açıklama", trust: "verified" },
    ],
  });
  assert.deepEqual(second.historyImages.map((h) => h.id), [b, a]);
  assert.equal(second.historyImages[1]?.caption, "Düzeltilmiş açıklama");
  assert.equal(await stopImage(), a);

  // An id that belongs to another site is not taken over.
  const taken = await call<ErrorBody>("PUT", `/v1/admin/sites/${other.id}/history-images`, editor, { images: [{ id: a, mediaId: "ph-1", trust: "verified" }] });
  assert.equal(taken.res.statusCode, 409);
  assert.ok(taken.body.error.fieldErrors["images.0.id"]);
  assert.equal((await call<AdminSiteDetail>("GET", `/v1/admin/sites/${other.id}`, editor)).body.historyImages.length, 0);

  // Leaving an image out deletes it, and the stop forgets it.
  const last = await send("PUT", base, { images: [{ id: b, mediaId: "ph-2", trust: "inferred" }] });
  assert.deepEqual(last.historyImages.map((h) => h.id), [b]);
  assert.equal(await stopImage(), null);
});

test("an archive image's present-day photograph keeps its angle word, and the word needs the photograph", async () => {
  const site = await newDraft("Eş Hanı");
  const base = `/v1/admin/sites/${site.id}/history-images`;
  const saved = await send("PUT", base, {
    images: [
      { mediaId: "ph-1", presentMediaId: "ph-3", presentAngleMatch: "near", trust: "verified" },
      { mediaId: "ph-2", presentMediaId: "ph-3", trust: "verified" },
    ],
  });
  assert.deepEqual(saved.historyImages.map((h) => [h.presentMediaId, h.presentAngleMatch]), [["ph-3", "near"], ["ph-3", null]]);

  const orphan = await call<ErrorBody>("PUT", base, editor, { images: [{ mediaId: "ph-1", presentAngleMatch: "same", trust: "verified" }] });
  assert.equal(orphan.res.statusCode, 400);
  assert.ok(orphan.body.error.fieldErrors["images.0.presentAngleMatch"]);
  const unknown = await call<ErrorBody>("PUT", base, editor, { images: [{ mediaId: "ph-1", presentMediaId: "ph-3", presentAngleMatch: "far", trust: "verified" }] });
  assert.equal(unknown.res.statusCode, 400);
  // The refused saves changed nothing; dropping the photograph drops its word with it.
  const read = async () => (await call<AdminSiteDetail>("GET", `/v1/admin/sites/${site.id}`, editor)).body.historyImages.map((h) => h.presentAngleMatch);
  assert.deepEqual(await read(), ["near", null]);
  await send("PUT", base, { images: [{ id: saved.historyImages[0]!.id, mediaId: "ph-1", trust: "verified" }] });
  assert.deepEqual(await read(), [null]);
});

test("part cards are replaced whole and in order: parts must be model parts, photos the site's own, ids stay, left-out cards go", async () => {
  const site = await newDraft("Parça Hanı");
  const other = await newDraft("Parça Komşusu");
  const base = `/v1/admin/sites/${site.id}`;
  const put = (id: string, cards: object[]) => call<ErrorBody>("PUT", `/v1/admin/sites/${id}/part-cards`, editor, { cards });
  const card = (over: Record<string, unknown> = {}) => ({ parts: ["kubbe"], title: "Kubbe", body: "Orta kubbe.", photoIds: ["ph-1"], trust: "verified", sourceId: "src-vgm", ...over });

  // No model: no part is valid yet, and the refusal says why.
  await send("PUT", `${base}/media`, { photoIds: ["ph-1", "ph-2"], coverPhotoId: "ph-1" });
  await send("PUT", `${base}/sources`, { sources: [{ id: "src-vgm", title: "VGM Bursa Envanteri", kind: "book", trust: "verified" }] });
  const noModel = await put(site.id, [card()]);
  assert.equal(noModel.res.statusCode, 400);
  assert.ok(noModel.body.error.fieldErrors["cards.0.parts"]);
  await send("PUT", `${base}/model`, { mediaId: "m-1" });

  const saved = await send("PUT", `${base}/part-cards`, {
    cards: [card(), card({ parts: ["minare", "kubbe"], title: "Minare", body: "Tuğla minare.", photoIds: ["ph-2", "ph-1"], trust: "inferred", sourceId: null })],
  });
  const [a, b] = saved.partCards as [(typeof saved.partCards)[number], (typeof saved.partCards)[number]];
  assert.deepEqual([a.title, b.title], ["Kubbe", "Minare"]);
  assert.deepEqual(b.parts, ["minare", "kubbe"]);
  assert.deepEqual(b.photoIds, ["ph-2", "ph-1"]);
  assert.equal(b.sourceId, null);
  assert.equal(b.trust, "inferred");
  assert.notEqual(a.id, b.id);

  // Public read shows the same cards in the same order.
  await send("PUT", `${base}/stories`, { blocks: [story()] });
  await send("PUT", `${base}/location`, { coordinates: [29.06, 40.18] });
  await send("POST", `${base}/publish`);
  const pub = (await call<SiteDetail>("GET", `/v1/sites/${site.id}`)).body;
  assert.deepEqual(pub.partCards.map((c) => c.title), ["Kubbe", "Minare"]);

  // Reorder keeps ids; a card left out is gone with its photo links.
  const reordered = await send("PUT", `${base}/part-cards`, { cards: [{ ...b, body: "Düzeltildi.", sourceId: "src-vgm" }, a] });
  assert.deepEqual(reordered.partCards.map((c) => c.id), [b.id, a.id]);
  assert.equal(reordered.partCards[0]?.body, "Düzeltildi.");
  const removed = await send("PUT", `${base}/part-cards`, { cards: [a] });
  assert.deepEqual(removed.partCards.map((c) => c.id), [a.id]);
  assert.deepEqual((await app.deps.db.select().from(sitePartCardPhotos).where(eq(sitePartCardPhotos.cardId, b.id))), []);
  assert.deepEqual((await send("PUT", `${base}/part-cards`, { cards: [] })).partCards, []);

  // Refusals write nothing: unknown part, a photo the site does not list, a foreign source, a repeated id, an id of another site.
  const keep = await send("PUT", `${base}/part-cards`, { cards: [a] });
  const refused = [
    { cards: [card({ parts: ["kubbe", "yok"] })], field: "cards.0.parts" },
    { cards: [card({ photoIds: ["ph-1", "ph-3"] })], field: "cards.0.photoIds.1" },
    { cards: [card({ photoIds: ["ph-yok"] })], field: "cards.0.photoIds.0" },
    { cards: [card({ sourceId: "src-ek" })], field: "cards.0.sourceId" },
    { cards: [{ ...a }, { ...a }], field: "cards.1.id" },
    { cards: [card({ parts: [] })], field: "cards.0.parts" },
  ];
  for (const { cards, field } of refused) {
    const r = await put(site.id, cards);
    assert.equal(r.res.statusCode, 400, field);
    assert.ok(r.body.error.fieldErrors[field], `${field}: ${r.res.body}`);
  }
  assert.deepEqual((await call<AdminSiteDetail>("GET", base, editor)).body.partCards, keep.partCards);

  await send("PUT", `/v1/admin/sites/${other.id}/media`, { photoIds: ["ph-1"], coverPhotoId: "ph-1" });
  await send("PUT", `/v1/admin/sites/${other.id}/model`, { mediaId: "m-1" });
  const taken = await put(other.id, [{ ...card(), id: a.id, sourceId: null }]);
  assert.equal(taken.res.statusCode, 409);
  assert.ok(taken.body.error.fieldErrors["cards.0.id"]);
  assert.deepEqual((await call<AdminSiteDetail>("GET", `/v1/admin/sites/${other.id}`, editor)).body.partCards, []);

  const unknownSite = await put("yok", [card()]);
  assert.equal(unknownSite.res.statusCode, 404);
  assert.equal((await auditOf(site.id)).filter((r) => (r.after as Record<string, unknown>)["partCards"] !== undefined).length, 5);
});

test("part card English texts follow the story rules: omitted keeps, written or changed is reviewed, unchanged keeps the status, empty clears", async () => {
  const site = await newDraft("Parça İngilizce Hanı");
  const base = `/v1/admin/sites/${site.id}`;
  await send("PUT", `${base}/media`, { photoIds: ["ph-1"], coverPhotoId: "ph-1" });
  await send("PUT", `${base}/model`, { mediaId: "m-1" });
  const card = (over: Record<string, unknown> = {}) => ({ id: "pk-en", parts: ["kubbe"], title: "Kubbe", body: "Orta kubbe.", photoIds: [], trust: "verified", ...over });
  const read = async () => {
    const c = (await call<AdminSiteDetail>("GET", base, editor)).body.partCards[0]!;
    return [c.titleEn, c.titleEnStatus, c.bodyEn, c.bodyEnStatus];
  };

  // A card saved without English has none.
  await send("PUT", `${base}/part-cards`, { cards: [card()] });
  assert.deepEqual(await read(), [null, null, null, null]);

  // Written English is the editor's own reading.
  await send("PUT", `${base}/part-cards`, { cards: [card({ titleEn: "Dome", bodyEn: "The central dome." })] });
  assert.deepEqual(await read(), ["Dome", "reviewed", "The central dome.", "reviewed"]);

  // Machine drafts (as the translate call writes them) stay machine while unchanged, also when the client omits the fields.
  await app.deps.db.update(sitePartCards).set({ titleEnStatus: "machine", bodyEnStatus: "machine" }).where(eq(sitePartCards.id, "pk-en"));
  await send("PUT", `${base}/part-cards`, { cards: [card()] });
  assert.deepEqual(await read(), ["Dome", "machine", "The central dome.", "machine"], "omitted keeps value and status");
  await send("PUT", `${base}/part-cards`, { cards: [card({ titleEn: "Dome", bodyEn: "The central dome." })] });
  assert.deepEqual(await read(), ["Dome", "machine", "The central dome.", "machine"], "unchanged keeps the status");
  await send("PUT", `${base}/part-cards`, { cards: [card({ titleEn: "Dome", bodyEn: "The big central dome." })] });
  assert.deepEqual(await read(), ["Dome", "machine", "The big central dome.", "reviewed"], "only the changed field becomes reviewed");

  // Null or blank clears value and status.
  await send("PUT", `${base}/part-cards`, { cards: [card({ titleEn: null, bodyEn: "  " })] });
  assert.deepEqual(await read(), [null, null, null, null]);
});

test("tasks and badges are replaced whole and in order: ids keep the players' completions and badges through an edit and an answer-key change, left-out ones go with theirs, the answer key is never public", async () => {
  const site = await newDraft("Görev Hanı");
  const other = await newDraft("Görev Komşusu");
  const base = `/v1/admin/sites/${site.id}`;
  const db = app.deps.db;
  await makePublishable(site.id);
  await send("PUT", `${base}/model`, { mediaId: "m-1" });
  await send("POST", `${base}/publish`);
  let saves = 0;
  const save = (tasks: object[], badges: object[]) => {
    saves++;
    return send("PUT", `${base}/tasks`, { tasks, badges });
  };
  const put = (id: string, tasks: object[], badges: object[] = []) => call<ErrorBody>("PUT", `/v1/admin/sites/${id}/tasks`, editor, { tasks, badges });
  const quizBody = { options: ["A", "B", "C"], hints: ["İpucu"], correctIndex: 1, correctText: "B doğru", wrongText: "Tekrar dene", fromHome: true };
  const quiz = (over: Record<string, unknown> = {}) => ({ id: "gq-1", kind: "quiz", title: "Soru", prompt: "Hangisi?", photoId: "ph-1", part: "kubbe", source: "E cilt-1 PDF s.27", trust: "verified", quiz: quizBody, ...over });
  const fieldBody = { onSite: { text: "Önüne gel", radiusM: 80 }, fromHome: { text: "Kubbeye dokun", part: "minare" }, doneText: "Bulundu" };
  const field = (over: Record<string, unknown> = {}) => ({ id: "gf-1", kind: "field", title: "Saha", prompt: "Kapıyı bul", trust: "inferred", field: fieldBody, ...over });
  const storyBadge = { id: "gb-s", title: "Hikâye", text: "Dinledin", condition: "story" };
  const taskBadge = { id: "gb-f", title: "Kapı", text: "Buldun", condition: "task", taskId: "gf-1", onSiteLabel: true };
  const answers = async () => (await db.select().from(siteTaskAnswers)).filter((r) => r.taskId.startsWith("g")).map((r) => [r.taskId, r.correctIndex]).sort();

  const saved = await save([quiz(), field()], [storyBadge, taskBadge]);
  assert.deepEqual(saved.tasks.map((t) => [t.id, t.kind, t.title, t.photoId, t.part, t.source, t.trust]), [
    ["gq-1", "quiz", "Soru", "ph-1", "kubbe", "E cilt-1 PDF s.27", "verified"],
    ["gf-1", "field", "Saha", null, null, null, "inferred"],
  ]);
  assert.deepEqual(saved.tasks[0]?.quiz, { ...quizBody, optionsEn: null, hintsEn: null, correctTextEn: null, wrongTextEn: null });
  assert.deepEqual(saved.tasks[1]?.field, { onSite: { text: "Önüne gel", textEn: null, radiusM: 80 }, fromHome: { text: "Kubbeye dokun", textEn: null, part: "minare" }, doneText: "Bulundu", doneTextEn: null });
  assert.deepEqual(saved.badges.map((b) => [b.id, b.condition, b.taskId, b.onSiteLabel]), [["gb-s", "story", null, false], ["gb-f", "task", "gf-1", true]]);
  assert.deepEqual(await answers(), [["gq-1", 1]]);

  // The public detail carries neither the answer key nor the after-the-answer texts.
  const publicItems = (await call<{ items: { id: string }[] }>("GET", "/v1/site-details?limit=100")).body.items;
  const pubSite = JSON.stringify(publicItems.find((d) => d.id === site.id));
  assert.ok(pubSite.includes("Hangisi?") && !/correctIndex|correctText|doneText|B doğru|Bulundu/.test(pubSite));

  // An edit and a changed answer key keep the ids, so players' completions and badges stay; position changes do not trip the unique keys.
  await db.insert(userSiteTasks).values([{ userId: "u1", taskId: "gq-1", onSite: false }, { userId: "u1", taskId: "gf-1", onSite: true }]);
  await db.insert(userSiteBadges).values([{ userId: "u1", badgeId: "gb-s" }, { userId: "u1", badgeId: "gb-f", onSite: true }]);
  const edited = await save(
    [field({ title: "Saha 2" }), quiz({ title: "Soru 2", quiz: { ...quizBody, options: ["A", "B", "C", "D"], correctIndex: 3 } })],
    [{ ...taskBadge, title: "Kapı 2" }, storyBadge],
  );
  assert.deepEqual(edited.tasks.map((t) => [t.id, t.title]), [["gf-1", "Saha 2"], ["gq-1", "Soru 2"]]);
  assert.deepEqual(edited.badges.map((b) => [b.id, b.title]), [["gb-f", "Kapı 2"], ["gb-s", "Hikâye"]]);
  assert.equal(edited.tasks[1]?.quiz?.correctIndex, 3);
  assert.deepEqual(await answers(), [["gq-1", 3]]);
  const progress = async () => [(await db.select().from(userSiteTasks)).map((r) => r.taskId).sort(), (await db.select().from(userSiteBadges)).map((r) => r.badgeId).sort()];
  assert.deepEqual(await progress(), [["gf-1", "gq-1"], ["gb-f", "gb-s"]]);
  assert.equal((await db.select().from(userSiteTasks)).find((r) => r.taskId === "gf-1")?.onSite, true, "an on-site completion stays on site");

  // A task that changes kind loses its answer key and keeps its completion.
  const switched = await save([field({ id: "gq-1", title: "Soru oldu saha" }), field()], [taskBadge]);
  assert.deepEqual(switched.tasks.map((t) => [t.id, t.kind]), [["gq-1", "field"], ["gf-1", "field"]]);
  assert.deepEqual(await answers(), []);
  assert.deepEqual(await progress(), [["gf-1", "gq-1"], ["gb-f"]], "the left-out badge's earnings went; the tasks' completions stayed");
  await save([quiz(), field()], [storyBadge, taskBadge]);

  // Refusals write nothing: unknown parts, a photo the site does not list, a bad answer key, a missing badge task, repeated ids, a wrong-kind body.
  const keep = (await call<AdminSiteDetail>("GET", base, editor)).body;
  const refused: [object[], object[], string][] = [
    [[quiz({ part: "yok" })], [], "tasks.0.part"],
    [[field({ field: { ...fieldBody, fromHome: { text: "Dokun", part: "yok" } } })], [], "tasks.0.field.fromHome.part"],
    [[quiz({ photoId: "ph-3" })], [], "tasks.0.photoId"],
    [[quiz({ photoId: "ph-yok" })], [], "tasks.0.photoId"],
    [[quiz({ quiz: { ...quizBody, correctIndex: 3 } })], [], "tasks.0.quiz.correctIndex"],
    [[quiz({ quiz: { ...quizBody, options: ["tek"], correctIndex: 0 } })], [], "tasks.0.quiz.options"],
    [[quiz({ quiz: { ...quizBody, optionsEn: ["A", "B"] } })], [], "tasks.0.quiz.optionsEn"],
    [[quiz({ quiz: { ...quizBody, optionsEn: ["A", "", "C"] } })], [], "tasks.0.quiz.optionsEn"],
    [[{ ...quiz(), quiz: undefined }], [], "tasks.0.quiz"],
    [[quiz()], [{ ...taskBadge, taskId: "gy-yok" }], "badges.0.taskId"],
    [[quiz()], [{ ...taskBadge, taskId: "gf-1" }], "badges.0.taskId"],
    [[quiz()], [{ ...taskBadge, taskId: null }], "badges.0.taskId"],
    [[quiz()], [{ ...storyBadge, taskId: "gq-1" }], "badges.0.taskId"],
    [[quiz(), quiz()], [], "tasks.1.id"],
    [[quiz()], [storyBadge, storyBadge], "badges.1.id"],
  ];
  for (const [tasks, badges, fieldName] of refused) {
    const r = await put(site.id, tasks, badges);
    assert.equal(r.res.statusCode, 400, `${fieldName}: ${r.res.body}`);
    assert.ok(r.body.error.fieldErrors[fieldName], `${fieldName}: ${r.res.body}`);
  }
  assert.deepEqual((await call<AdminSiteDetail>("GET", base, editor)).body.tasks, keep.tasks);
  assert.deepEqual((await call<AdminSiteDetail>("GET", base, editor)).body.badges, keep.badges);
  assert.deepEqual(await progress(), [["gf-1", "gq-1"], ["gb-f"]]);

  // An id of another site is a 409 naming it, for tasks and for badges; the other site stays empty.
  const takenTask = await put(other.id, [quiz({ part: null, photoId: null })]);
  assert.equal(takenTask.res.statusCode, 409);
  assert.ok(takenTask.body.error.fieldErrors["tasks.0.id"]);
  const takenBadge = await put(other.id, [], [storyBadge]);
  assert.equal(takenBadge.res.statusCode, 409);
  assert.ok(takenBadge.body.error.fieldErrors["badges.0.id"]);
  const stranger = (await call<AdminSiteDetail>("GET", `/v1/admin/sites/${other.id}`, editor)).body;
  assert.deepEqual([stranger.tasks, stranger.badges], [[], []]);
  assert.equal((await put("yok", [])).res.statusCode, 404);

  // Ids the server makes: a task and a badge sent without one get one (a badge can only name a task sent with its id).
  const made = await save([quiz({ id: undefined }), field()], [{ title: "Yeni", text: "Yeni rozet", condition: "story" }]);
  assert.match(made.tasks[0]!.id, /^gr-soru-[0-9a-f]{12}$/);
  assert.match(made.badges[0]!.id, /^rz-yeni-[0-9a-f]{12}$/);
  assert.deepEqual(await progress(), [["gf-1"], []], "the replaced quiz id and the badges went with their rows");

  // Left out goes with its players' rows; an empty list empties both.
  const removed = await save([field()], []);
  assert.deepEqual([removed.tasks.map((t) => t.id), removed.badges], [["gf-1"], []]);
  assert.deepEqual(await db.select().from(siteTasks).where(eq(siteTasks.siteId, site.id)).then((r) => r.map((t) => t.id)), ["gf-1"]);
  assert.deepEqual(await progress(), [["gf-1"], []]);
  assert.deepEqual((await save([], [])).tasks, []);
  assert.deepEqual(await progress(), [[], []]);
  assert.equal((await db.select().from(siteBadges).where(eq(siteBadges.siteId, site.id))).length, 0);

  // One audit row per successful write, with the answer key in it for the history of a changed key.
  const audits = (await auditOf(site.id)).filter((r) => (r.after as Record<string, unknown>)["tasks"] !== undefined);
  assert.equal(audits.length, saves);
  const keyChange = audits.find((r) => ((r.after as { tasks: { id: string; correctIndex: number | null }[] }).tasks).some((t) => t.id === "gq-1" && t.correctIndex === 3));
  assert.ok(keyChange);
  assert.equal(((keyChange.before as { tasks: { id: string; correctIndex: number | null }[] }).tasks).find((t) => t.id === "gq-1")?.correctIndex, 1);
});

test("task and badge English texts: omitted keeps value and status, written or changed is reviewed, unchanged keeps the status, empty clears, lists match the Turkish ones", async () => {
  const site = await newDraft("Görev İngilizce Hanı");
  const base = `/v1/admin/sites/${site.id}`;
  const db = app.deps.db;
  const quizBody = { options: ["A", "B"], hints: ["İpucu"], correctIndex: 0, correctText: "Doğru", wrongText: "Yanlış", fromHome: false };
  const quiz = (over: Record<string, unknown> = {}, quizOver: Record<string, unknown> = {}) => ({ id: "en-q", kind: "quiz", title: "Soru", prompt: "Hangisi?", trust: "verified", quiz: { ...quizBody, ...quizOver }, ...over });
  const badge = (over: Record<string, unknown> = {}) => ({ id: "en-b", title: "Rozet", text: "Kazandın", condition: "story", ...over });
  const put = (tasks: object[], badges: object[]) => call<ErrorBody>("PUT", `${base}/tasks`, editor, { tasks, badges });
  const task = async () => (await db.select().from(siteTasks).where(eq(siteTasks.id, "en-q")))[0]!;
  const readTask = async () => {
    const t = await task();
    return [t.titleEn, t.promptEn, t.detailsEn, t.enStatus];
  };
  const readBadge = async () => {
    const [b] = await db.select().from(siteBadges).where(eq(siteBadges.id, "en-b"));
    return [b?.titleEn, b?.textEn, b?.enStatus];
  };
  const full = { options: ["A", "B"], hints: ["Hint"], correctText: "Right", wrongText: "Wrong" };
  const fullEn = { optionsEn: ["A", "B"], hintsEn: ["Hint"], correctTextEn: "Right", wrongTextEn: "Wrong" };

  await send("PUT", `${base}/tasks`, { tasks: [quiz()], badges: [badge()] });
  assert.deepEqual(await readTask(), [null, null, null, null]);
  assert.deepEqual(await readBadge(), [null, null, null]);

  // Written English is the editor's own reading; the admin view shows it with its status.
  const written = await send("PUT", `${base}/tasks`, { tasks: [quiz({ titleEn: "Question", promptEn: "Which?" }, fullEn)], badges: [badge({ titleEn: "Badge", textEn: "You won" })] });
  assert.deepEqual(await readTask(), ["Question", "Which?", full, "reviewed"]);
  assert.deepEqual(await readBadge(), ["Badge", "You won", "reviewed"]);
  assert.deepEqual([written.tasks[0]?.titleEn, written.tasks[0]?.enStatus, written.tasks[0]?.quiz?.correctTextEn, written.tasks[0]?.quiz?.hintsEn], ["Question", "reviewed", "Right", ["Hint"]]);
  assert.deepEqual([written.badges[0]?.titleEn, written.badges[0]?.enStatus], ["Badge", "reviewed"]);

  // Machine drafts stay machine while nothing changes, also when the client omits the fields; any changed text makes the row reviewed.
  await db.update(siteTasks).set({ enStatus: "machine" }).where(eq(siteTasks.id, "en-q"));
  await db.update(siteBadges).set({ enStatus: "machine" }).where(eq(siteBadges.id, "en-b"));
  await send("PUT", `${base}/tasks`, { tasks: [quiz()], badges: [badge()] });
  assert.deepEqual(await readTask(), ["Question", "Which?", full, "machine"], "omitted keeps value and status");
  assert.deepEqual(await readBadge(), ["Badge", "You won", "machine"]);
  await send("PUT", `${base}/tasks`, { tasks: [quiz({ titleEn: "Question", promptEn: "Which?" }, fullEn)], badges: [badge({ titleEn: "Badge", textEn: "You won" })] });
  assert.deepEqual(await readTask(), ["Question", "Which?", full, "machine"], "unchanged keeps the status");
  assert.deepEqual(await readBadge(), ["Badge", "You won", "machine"]);
  await send("PUT", `${base}/tasks`, { tasks: [quiz({}, { wrongTextEn: "Nope" })], badges: [badge({ textEn: "You won it" })] });
  assert.deepEqual(await readTask(), ["Question", "Which?", { ...full, wrongText: "Nope" }, "reviewed"], "one changed text makes the row reviewed");
  assert.deepEqual(await readBadge(), ["Badge", "You won it", "reviewed"]);

  // An English list must match the Turkish one, also when it is kept: changing the options without it is refused.
  const longer = await put([quiz({}, { options: ["A", "B", "C"] })], [badge()]);
  assert.equal(longer.res.statusCode, 400);
  assert.ok(longer.body.error.fieldErrors["tasks.0.quiz.optionsEn"]);
  assert.deepEqual((await readTask())[2], { ...full, wrongText: "Nope" }, "a refused save writes nothing");
  await send("PUT", `${base}/tasks`, { tasks: [quiz({}, { options: ["A", "B", "C"], optionsEn: ["A", "B", "C"] })], badges: [badge()] });
  assert.deepEqual(((await task()).detailsEn as { options: string[] }).options, ["A", "B", "C"]);

  // Null, blank or all-blank lists clear value and status.
  await send("PUT", `${base}/tasks`, {
    tasks: [quiz({ titleEn: null, promptEn: "  " }, { optionsEn: ["", ""], hintsEn: [""], correctTextEn: null, wrongTextEn: " " })],
    badges: [badge({ titleEn: null, textEn: "" })],
  });
  assert.deepEqual(await readTask(), [null, null, null, null]);
  assert.deepEqual(await readBadge(), [null, null, null]);
  const cleared = (await call<AdminSiteDetail>("GET", base, editor)).body.tasks[0]!;
  assert.deepEqual([cleared.quiz?.optionsEn, cleared.quiz?.hintsEn, cleared.quiz?.correctTextEn], [null, null, null]);

  // A field task: English for the home variant only counts while the Turkish one exists.
  const field = (fromHome: object | null, over: Record<string, unknown> = {}) => ({ id: "en-q", kind: "field", title: "Saha", prompt: "Bul", trust: "verified", field: { onSite: { text: "Gel", textEn: "Come", radiusM: 50 }, fromHome, doneText: "Oldu", doneTextEn: "Done" }, ...over });
  await send("PUT", `${base}/model`, { mediaId: "m-1" });
  await send("PUT", `${base}/tasks`, { tasks: [field({ text: "Dokun", textEn: "Touch", part: "kubbe" })], badges: [] });
  assert.deepEqual((await task()).detailsEn, { onSite: { text: "Come" }, fromHome: { text: "Touch" }, doneText: "Done" });
  await send("PUT", `${base}/tasks`, { tasks: [field(null)], badges: [] });
  assert.deepEqual([(await task()).detailsEn, (await task()).enStatus], [{ onSite: { text: "Come" }, fromHome: null, doneText: "Done" }, "reviewed"]);
});

test("the panel list shows drafts with their issues and location source, filters, and pages without repeats or gaps", async () => {
  const names = ["Arasta A", "Arasta B", "Bedesten", "Çarşı"];
  const created = [];
  for (const name of names) created.push(await newDraft(name, { city: "edirne", district: "Merkez" }));
  await makePublishable(created[0]!.id);
  assert.equal((await call("POST", `/v1/admin/sites/${created[0]!.id}/publish`, editor)).res.statusCode, 200);

  const all = (await call<Page>("GET", "/v1/admin/sites?city=edirne&limit=100", editor)).body;
  assert.equal(all.nextCursor, null);
  assert.deepEqual(all.items.map((i) => i.name), names);
  const [published, ...drafts] = all.items;
  assert.equal(published!.status, "published");
  assert.deepEqual(published!.issues, []);
  assert.equal(published!.locationSource, "manual");
  assert.deepEqual(published!.coordinates, [29.06, 40.18]);
  assert.equal(published!.coverImage?.id, "ph-1");
  for (const draft of drafts) {
    assert.equal(draft.status, "draft");
    assert.equal(draft.locationSource, null);
    assert.equal(draft.coordinates, null);
    assert.ok(draft.issues.includes("Geçerli enlem ve boylam gir."));
    assert.equal(draft.issueCount, draft.issues.length);
  }

  const onlyDrafts = (await call<Page>("GET", "/v1/admin/sites?city=edirne&status=draft&limit=100", editor)).body.items;
  assert.deepEqual(onlyDrafts.map((i) => i.name), names.slice(1));
  const search = (await call<Page>("GET", `/v1/admin/sites?city=edirne&query=${encodeURIComponent("CARSI")}`, editor)).body.items;
  assert.deepEqual(search.map((i) => i.name), ["Çarşı"]);

  const walked: string[] = [];
  let cursor: string | null = null;
  for (let guard = 0; guard < 10; guard++) {
    const page: Page = (await call<Page>("GET", `/v1/admin/sites?city=edirne&limit=1${cursor ? `&cursor=${cursor}` : ""}`, editor)).body;
    assert.ok(page.items.length <= 1);
    walked.push(...page.items.map((i) => i.name));
    cursor = page.nextCursor;
    if (!cursor) break;
  }
  assert.deepEqual(walked, names);
  const bad = await call<ErrorBody>("GET", "/v1/admin/sites?cursor=bozuk", editor);
  assert.equal(bad.res.statusCode, 400);
  assert.equal(bad.body.error.code, "INVALID_CURSOR");
});

test("every write leaves one audit row naming the actor and request, with before and after; refused and replayed writes leave none extra", async () => {
  const draft = await newDraft("Denetim Hanı");
  const id = draft.id;
  const base = `/v1/admin/sites/${id}`;
  const requestIds: string[] = [];
  const write = async (method: Method, path: string, payload?: object) => {
    const { res, body } = await call<AdminSiteDetail>(method, `${base}${path}`, editor, payload);
    assert.equal(res.statusCode, 200, `${method} ${path}: ${res.body}`);
    requestIds.push(String(res.headers["x-request-id"]));
    return body;
  };

  await write("PATCH", "/info", { architect: "Mimar Sinan" });
  await write("PUT", "/location", { coordinates: [29.06, 40.18] });
  await write("PUT", "/model", { mediaId: "m-1" });
  await write("PUT", "/media", { photoIds: ["ph-1"], coverPhotoId: "ph-1" });
  await write("PUT", "/sources", { sources: [{ id: "src-vgm", title: "VGM Bursa Envanteri", kind: "book", trust: "verified" }] });
  await write("PUT", "/stories", { blocks: [story()] });
  await write("PUT", "/about", { chapters: [], looseSections: [{ kind: "history", title: "Tarihçe", body: "Han 1491'de yapıldı.", trust: "verified", sourceId: "src-vgm" }] });
  await write("PUT", "/history-images", { images: [{ mediaId: "ph-1", trust: "inferred" }] });
  await write("POST", "/publish");
  await write("POST", "/unpublish");

  const rows = await auditOf(id);
  assert.deepEqual(rows.map((r) => r.action), ["site.create", ...Array(8).fill("site.update"), "site.publish", "site.unpublish"]);
  assert.ok(rows.every((r) => r.actorId === "editor-1" && r.entityType === "site"));
  assert.deepEqual(rows.slice(1).map((r) => r.requestId), requestIds);

  const slice = (action: string, key: string) => {
    const row = rows.find((r) => r.action === action && (r.after as Record<string, unknown>)[key] !== undefined)!;
    return { before: (row.before as Record<string, unknown>)[key], after: (row.after as Record<string, unknown>)[key] };
  };
  assert.equal((slice("site.update", "stories").before as unknown[]).length, 0);
  assert.equal((slice("site.update", "stories").after as { title: string }[])[0]?.title, "Giriş");
  assert.equal((slice("site.update", "sections").after as unknown[]).length, 1);
  assert.equal((slice("site.update", "historyImages").after as unknown[]).length, 1);
  assert.equal((slice("site.update", "info").before as { architect: string }).architect, "");
  assert.equal((slice("site.update", "info").after as { architect: string }).architect, "Mimar Sinan");
  assert.deepEqual(rows.find((r) => r.action === "site.publish")!.before, { status: "draft" });
  assert.deepEqual(rows.find((r) => r.action === "site.publish")!.after, { status: "published" });

  // A refused write is rolled back whole: no audit row, no change.
  const refused = await call<ErrorBody>("PUT", `${base}/stories`, editor, { blocks: [story({ photoId: "yok" })] });
  assert.equal(refused.res.statusCode, 400);
  assert.equal((await auditOf(id)).length, rows.length);

  // A replay under the same key answers the first response (same generated ids) and audits once.
  const keyed = { ...editor, "idempotency-key": "stories-denetim-1" };
  const first = await call<AdminSiteDetail>("PUT", `${base}/stories`, keyed, { blocks: [story({ title: "Yeni" })] });
  const replay = await call<AdminSiteDetail>("PUT", `${base}/stories`, keyed, { blocks: [story({ title: "Yeni" })] });
  assert.equal(first.res.statusCode, 200);
  assert.deepEqual(replay.body.stories.map((s) => s.id), first.body.stories.map((s) => s.id));
  assert.equal((await auditOf(id)).length, rows.length + 1);
});

const aboutPara = (over: Record<string, unknown> = {}) => ({ kind: "history", title: "Tarihçe", body: "Han 1491'de yapıldı.", trust: "verified", sourceId: "src-vgm", ...over });
const aboutChapter = (over: Record<string, unknown> = {}) => ({
  title: "Tarihçe",
  kind: "history",
  summary: ["Han 1491'de yapıldı."],
  figures: [{ value: "1491", label: "Yapım yılı", evidence: "Han 1491'de yapıldı." }],
  quotes: [{ text: "Bu han Bursa'nın göz bebeğidir.", by: "Seyyah" }],
  timeline: [{ year: "1491", evidence: "Han yapıldı." }],
  terms: [{ word: "Han", definition: "Konaklama yeri." }],
  sections: [aboutPara()],
  ...over,
});
const putAbout = (id: string, chapters: object[], looseSections: object[] = []) => call<ErrorBody>("PUT", `/v1/admin/sites/${id}/about`, editor, { chapters, looseSections });

test("the about chapters and their paragraphs are replaced whole and in order: ids stay, paragraphs move between chapters and out of them, left-out ones go, the 3D view and the book photographs stay", async () => {
  const site = await newDraft("Hakkında Hanı");
  const other = await newDraft("Hakkında Komşusu");
  const base = `/v1/admin/sites/${site.id}`;
  const db = app.deps.db;
  await send("PUT", `${base}/sources`, { sources: [{ id: "src-vgm", title: "VGM Bursa Envanteri", kind: "book", trust: "verified" }] });
  const save = (chapters: object[], looseSections: object[] = []) => send("PUT", `${base}/about`, { chapters, looseSections });

  // Ids are generated for new rows; text, lists, kind and source round-trip; a paragraph without a chapter comes after the chapters.
  const saved = await save(
    [aboutChapter(), aboutChapter({ title: "Mimari", kind: "architecture", summary: [], figures: [], quotes: [{ text: "Avlulu.", by: null }], timeline: [], terms: [], sections: [aboutPara({ title: "Mimari", kind: "architecture", body: "Avlulu.", sourceId: null })] })],
    [aboutPara({ title: "Ek", body: "Sonradan." })],
  );
  const [c1, c2] = saved.chapters as [(typeof saved.chapters)[number], (typeof saved.chapters)[number]];
  assert.deepEqual(saved.chapters.map((c) => [c.title, c.kind, c.summary.length, c.figures.length, c.quotes.length, c.timeline.length, c.terms.length]), [
    ["Tarihçe", "history", 1, 1, 1, 1, 1],
    ["Mimari", "architecture", 0, 0, 1, 0, 0],
  ]);
  assert.deepEqual(c2.quotes, [{ text: "Avlulu.", by: null }]);
  assert.deepEqual(saved.sections.map((s) => [s.title, s.chapterId, s.sourceId, s.trust]), [
    ["Tarihçe", c1.id, "src-vgm", "verified"],
    ["Mimari", c2.id, null, "verified"],
    ["Ek", null, "src-vgm", "verified"],
  ]);
  const [p1, p2, p3] = saved.sections as [(typeof saved.sections)[number], (typeof saved.sections)[number], (typeof saved.sections)[number]];

  // Public read shows the same chapters and paragraphs once published.
  await makePublishable(site.id);
  await send("POST", `${base}/publish`);
  const pub = (await call<SiteDetail>("GET", `/v1/sites/${site.id}`)).body;
  assert.deepEqual(pub.chapters.map((c) => c.id), [c1.id, c2.id]);
  assert.deepEqual(pub.sections.map((s) => s.id), [p1.id, p2.id, p3.id]);

  // The 3D view and a book photograph belong to the id, not to the editor's body.
  const camera = { target: null, azimuthDeg: 30, elevationDeg: 10, distance: 0.9 };
  await db.update(siteAboutChapters).set({ reading: { summary: [], figures: [], quotes: [], timeline: [], terms: [], camera, interior: true, focusParts: ["kubbe"] } }).where(eq(siteAboutChapters.id, c1.id));
  await db.insert(siteSectionPhotos).values({ siteId: site.id, sectionId: p3.id, position: 0, mediaId: "ph-2", aspect: 1.5, alt: "Kitap" });
  await db.update(sites).set({ aboutCoverMediaId: "ph-2" }).where(eq(sites.id, site.id));

  // Reorder the chapters, move a paragraph from the loose list into the second chapter and one into the first, edit a text.
  const moved = await save(
    [
      { ...c2, sections: [{ ...p2 }, { ...p3, body: "Sonradan, düzeltildi." }] },
      { ...c1, sections: [] },
    ],
    [{ ...p1, title: "Bölümsüz" }],
  );
  assert.deepEqual(moved.chapters.map((c) => c.id), [c2.id, c1.id]);
  assert.deepEqual(moved.sections.map((s) => [s.id, s.chapterId, s.title, s.body]), [
    [p2.id, c2.id, "Mimari", "Avlulu."],
    [p3.id, c2.id, "Ek", "Sonradan, düzeltildi."],
    [p1.id, null, "Bölümsüz", "Han 1491'de yapıldı."],
  ]);
  assert.deepEqual(moved.chapters.find((c) => c.id === c1.id)!.camera, camera);
  assert.equal(moved.chapters.find((c) => c.id === c1.id)!.interior, true);
  assert.deepEqual(moved.chapters.find((c) => c.id === c1.id)!.focusParts, ["kubbe"]);
  assert.deepEqual(moved.sections.find((s) => s.id === p3.id)!.photos.map((p) => [p.alt, p.aspect]), [["Kitap", 1.5]]);
  assert.equal(moved.aboutCoverMediaId, "ph-2");

  // A chapter left out goes; the paragraph sent again under another chapter stays, one not sent goes with its photographs.
  const trimmed = await save([{ ...c2, sections: [p3] }]);
  assert.deepEqual(trimmed.chapters.map((c) => c.id), [c2.id]);
  assert.deepEqual(trimmed.sections.map((s) => [s.id, s.chapterId]), [[p3.id, c2.id]]);
  assert.equal((await db.select().from(siteSectionPhotos).where(eq(siteSectionPhotos.siteId, site.id))).length, 1);
  assert.equal((await save([])).sections.length, 0);
  assert.equal((await db.select().from(siteSectionPhotos).where(eq(siteSectionPhotos.siteId, site.id))).length, 0);
  assert.equal((await call<AdminSiteDetail>("GET", base, editor)).body.aboutCoverMediaId, "ph-2");

  // Refusals write nothing: foreign source, a repeated id, a chapter of another site, a blank text, a paragraph for no chapter.
  const bare = { ...c2, sections: [] };
  const keep = await save([bare]);
  const refused: { body: [object[], object[]?]; field: string }[] = [
    { body: [[aboutChapter({ sections: [aboutPara({ sourceId: "yok" })] })]], field: "chapters.0.sections.0.sourceId" },
    { body: [[bare, bare]], field: "chapters.1.id" },
    { body: [[aboutChapter({ sections: [aboutPara({ id: "pa-1" }), aboutPara({ id: "pa-1" })] })]], field: "chapters.0.sections.1.id" },
    { body: [[aboutChapter({ title: "  " })]], field: "chapters.0.title" },
    { body: [[aboutChapter({ sections: [aboutPara({ body: "" })] })]], field: "chapters.0.sections.0.body" },
    { body: [[aboutChapter({ quotes: [{ text: "", by: null }] })]], field: "chapters.0.quotes.0.text" },
    { body: [[], [aboutPara({ title: "" })]], field: "looseSections.0.title" },
  ];
  for (const { body, field } of refused) {
    const r = await putAbout(site.id, ...body);
    assert.equal(r.res.statusCode, 400, field);
    assert.ok(r.body.error.fieldErrors[field], `${field}: ${r.res.body}`);
  }
  assert.deepEqual((await call<AdminSiteDetail>("GET", base, editor)).body.chapters, keep.chapters);

  const taken = await putAbout(other.id, [{ ...aboutChapter(), id: c2.id }]);
  assert.equal(taken.res.statusCode, 409);
  assert.ok(taken.body.error.fieldErrors["chapters.0.id"]);
  assert.deepEqual((await call<AdminSiteDetail>("GET", `/v1/admin/sites/${other.id}`, editor)).body.chapters, []);
  assert.equal((await putAbout("yok", [aboutChapter()])).res.statusCode, 404);

  // One audit row per accepted write, with the chapters and paragraphs before and after.
  const rows = (await auditOf(site.id)).filter((r) => (r.after as Record<string, unknown>)["chapters"] !== undefined);
  assert.equal(rows.length, 5);
  assert.equal(((rows[0]!.before as { chapters: unknown[] }).chapters).length, 0);
  assert.equal(((rows[0]!.after as { chapters: unknown[] }).chapters).length, 2);
});

test("the about English texts follow the card rules: omitted keeps, written or changed is reviewed, unchanged keeps the status, empty clears, and the reading lists match the Turkish ones", async () => {
  const site = await newDraft("Hakkında İngilizce Hanı");
  const base = `/v1/admin/sites/${site.id}`;
  const db = app.deps.db;
  const read = async () => {
    const d = (await call<AdminSiteDetail>("GET", base, editor)).body;
    const c = d.chapters[0]!;
    const s = d.sections[0]!;
    return { chapter: [c.titleEn, c.readingEn?.summary ?? null, c.enStatus], section: [s.titleEn, s.bodyEn, s.enStatus] };
  };
  const chapter = (over: Record<string, unknown> = {}, para: Record<string, unknown> = {}) => aboutChapter({ id: "hk-en", sections: [aboutPara({ id: "hk-en-1", sourceId: null, ...para })], ...over });

  // Saved without English: none.
  await send("PUT", `${base}/about`, { chapters: [chapter()], looseSections: [] });
  assert.deepEqual(await read(), { chapter: [null, null, null], section: [null, null, null] });

  // Written English is the editor's own reading.
  const en = { summary: ["Built in 1491."], figures: [{ value: "1491", label: "Year", evidence: "Built in 1491." }], quotes: [{ text: "Jewel of Bursa.", by: "Traveller" }], timeline: [{ year: "1491", evidence: "Built." }], terms: [{ word: "Inn", definition: "A lodging." }] };
  await send("PUT", `${base}/about`, { chapters: [chapter({ titleEn: "History", readingEn: en }, { titleEn: "History", bodyEn: "The inn was built in 1491." })], looseSections: [] });
  assert.deepEqual(await read(), { chapter: ["History", ["Built in 1491."], "reviewed"], section: ["History", "The inn was built in 1491.", "reviewed"] });

  // Machine drafts stay machine while unchanged, also when the client omits the fields; only changed English becomes reviewed.
  await db.update(siteAboutChapters).set({ enStatus: "machine" }).where(eq(siteAboutChapters.id, "hk-en"));
  await db.update(siteSections).set({ enStatus: "machine" }).where(eq(siteSections.id, "hk-en-1"));
  await send("PUT", `${base}/about`, { chapters: [chapter({ summary: ["Han 1491'de yapıldı, onarıldı."] })], looseSections: [] });
  assert.deepEqual(await read(), { chapter: ["History", ["Built in 1491."], "machine"], section: ["History", "The inn was built in 1491.", "machine"] }, "only the Turkish changed: English and its status stay");
  await send("PUT", `${base}/about`, { chapters: [chapter({ titleEn: "History", readingEn: en }, { titleEn: "History", bodyEn: "The inn was built in 1491." })], looseSections: [] });
  assert.deepEqual(await read(), { chapter: ["History", ["Built in 1491."], "machine"], section: ["History", "The inn was built in 1491.", "machine"] }, "unchanged English keeps the status");
  await send("PUT", `${base}/about`, { chapters: [chapter({ titleEn: "History", readingEn: en }, { titleEn: "History", bodyEn: "The inn was built in 1492." })], looseSections: [] });
  assert.deepEqual(await read(), { chapter: ["History", ["Built in 1491."], "machine"], section: ["History", "The inn was built in 1492.", "reviewed"] }, "a paragraph's change does not touch its chapter");
  await send("PUT", `${base}/about`, { chapters: [chapter({ titleEn: "History", readingEn: { ...en, summary: ["Built in 1491, restored."] } }, { titleEn: "History", bodyEn: "The inn was built in 1492." })], looseSections: [] });
  assert.deepEqual((await read()).chapter, ["History", ["Built in 1491, restored."], "reviewed"]);

  // A reading list in English of another length than the Turkish one is refused; the saved texts stay.
  const uneven = await putAbout(site.id, [chapter({ titleEn: "History", readingEn: { ...en, terms: [] } })]);
  assert.equal(uneven.res.statusCode, 400);
  assert.ok(uneven.body.error.fieldErrors["chapters.0.readingEn.terms"], uneven.res.body);
  assert.deepEqual((await read()).chapter, ["History", ["Built in 1491, restored."], "reviewed"]);

  // Null or blank clears value and status.
  await send("PUT", `${base}/about`, { chapters: [chapter({ titleEn: null, readingEn: null }, { titleEn: " ", bodyEn: null })], looseSections: [] });
  assert.deepEqual(await read(), { chapter: [null, null, null], section: [null, null, null] });
});

test("§11.81: a site moves between published, draft and inactive; only one that is not published can be deleted, and a deleted site is hidden but kept", async () => {
  const draft = await newDraft("Silinecek Han");
  const id = draft.id;
  const base = `/v1/admin/sites/${id}`;
  await send("PUT", `${base}/location`, { coordinates: [29.06, 40.18] });
  await send("PUT", `${base}/model`, { mediaId: "m-1" });
  await send("PUT", `${base}/media`, { photoIds: ["ph-1"], coverPhotoId: "ph-1" });
  await send("PUT", `${base}/sources`, { sources: [{ id: "src-vgm", title: "VGM Bursa Envanteri", kind: "book", trust: "verified" }] });
  await send("PUT", `${base}/stories`, { blocks: [story()] });
  await send("PUT", `${base}/about`, { chapters: [], looseSections: [{ kind: "history", title: "Tarihçe", body: "Han 1491'de yapıldı.", trust: "verified", sourceId: "src-vgm" }] });
  await send("PUT", `${base}/history-images`, { images: [{ mediaId: "ph-1", trust: "inferred" }] });
  assert.equal((await send("POST", `${base}/publish`)).status, "published");

  const remove = () => app.inject({ method: "DELETE", url: base, headers: { ...editor } });
  // Published: never deleted outright.
  const refused = await remove();
  assert.equal(refused.statusCode, 409, refused.body);
  assert.match(refused.json<ErrorBody>().error.message, /Yayındaki eser silinemez/);

  // Off the map as inactive: no gate, and twice is a conflict.
  assert.equal((await send("POST", `${base}/deactivate`)).status, "inactive");
  assert.equal((await call<ErrorBody>("POST", `${base}/deactivate`, editor)).res.statusCode, 409);
  const inactive = (await call<{ items: AdminSiteListItem[] }>("GET", "/v1/admin/sites?status=inactive", editor)).body;
  assert.ok(inactive.items.some((i) => i.id === id));
  // Back on the map runs the gate again, and back off.
  assert.equal((await send("POST", `${base}/publish`)).status, "published");
  assert.equal((await send("POST", `${base}/deactivate`)).status, "inactive");

  const deleted = await remove();
  assert.equal(deleted.statusCode, 204, deleted.body);
  assert.equal((await call("GET", base, editor)).res.statusCode, 404);
  assert.equal((await call("POST", `${base}/publish`, editor)).res.statusCode, 404);
  assert.equal((await remove()).statusCode, 404);
  const listed = (await call<{ items: AdminSiteListItem[] }>("GET", "/v1/admin/sites?query=silinecek", editor)).body;
  assert.ok(!listed.items.some((i) => i.id === id));
  // The row is kept, marked; the audit names each change.
  const [row] = await app.deps.db.select({ status: sites.status, deletedAt: sites.deletedAt }).from(sites).where(eq(sites.id, id));
  assert.equal(row?.status, "inactive");
  assert.ok(row?.deletedAt);
  assert.deepEqual(
    (await auditOf(id)).map((r) => r.action).filter((a) => a !== "site.update"),
    ["site.create", "site.publish", "site.deactivate", "site.publish", "site.deactivate", "site.delete"],
  );
  // The name is free again: a new site gets a new id.
  const again = await newDraft("Silinecek Han");
  assert.notEqual(again.id, id);

  // A draft can be deleted too.
  const scratch = await newDraft("Deneme Taslak Hanı");
  assert.equal((await app.inject({ method: "DELETE", url: `/v1/admin/sites/${scratch.id}`, headers: { ...editor } })).statusCode, 204);
});
