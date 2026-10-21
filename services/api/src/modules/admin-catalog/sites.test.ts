import { asc, eq } from "drizzle-orm";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { App } from "../../app.ts";
import { auditLog, catalogRoutes, cities, media, routeStops, siteMedia, sites, sources } from "../../db/schema/index.ts";
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
    ["PUT", `${base}/sections`, { sections: [{ kind: "history", title: "Tarihçe", body: "Metin", trust: "verified" }] }],
    ["PUT", `${base}/history-images`, { images: [{ mediaId: "ph-1", trust: "verified" }] }],
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

test("story blocks must point at real photo, source, card and audio, and highlights at parts of the linked model; a refused save writes nothing", async () => {
  const draft = await newDraft("Hikâye Hanı");
  const base = `/v1/admin/sites/${draft.id}`;
  await send("PUT", `${base}/model`, { mediaId: "m-1" });
  const kept = await send("PUT", `${base}/stories`, { blocks: [story({ highlights: ["kubbe"] })] });
  assert.deepEqual(kept.stories.map((s) => s.highlights), [["kubbe"]]);
  const rowsBefore = (await auditOf(draft.id)).length;

  const bad = await call<ErrorBody>("PUT", `${base}/stories`, editor, {
    blocks: [
      story({ highlights: ["minare"] }),
      story({ photoId: "yok", sourceId: "yok", cardId: "yok", audioMediaId: "ph-1", audioEnMediaId: "au-1", highlights: ["kubbe", "avlu"] }),
    ],
  });
  assert.equal(bad.res.statusCode, 400);
  assert.equal(bad.body.error.code, "VALIDATION_FAILED");
  assert.deepEqual(Object.keys(bad.body.error.fieldErrors).sort(), [
    "blocks.1.audioMediaId",
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

  let site = await send("PUT", `${base}/model`, { mediaId: "m-1", openingCamera: { azimuthDeg: 30, elevationDeg: 15, distanceM: 40 } });
  assert.equal(site.modelMediaId, "m-1");
  assert.deepEqual(site.openingCamera, { azimuthDeg: 30, elevationDeg: 15, distanceM: 40 });
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
    await call<ErrorBody>("PUT", `${base}/model`, editor, { mediaId: null, openingCamera: { azimuthDeg: 1, elevationDeg: 1, distanceM: 1 } }),
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
      { mediaId: "ph-2", presentMediaId: "ph-3", trust: "inferred", camera: { azimuthDeg: 45, elevationDeg: 10, distanceM: 30 } },
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
  await write("PUT", "/sections", { sections: [{ kind: "history", title: "Tarihçe", body: "Han 1491'de yapıldı.", trust: "verified", sourceId: "src-vgm" }] });
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
