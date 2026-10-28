import { asc, eq } from "drizzle-orm";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { App } from "../../app.ts";
import { auditLog, cities, media, siteMapPlacements, sites, sources } from "../../db/schema/index.ts";
import type { ErrorBody } from "../../errors.ts";
import { authHeader } from "../../test/auth.ts";
import { startTestApp } from "../../test/harness.ts";
import { catalogRoutes } from "../catalog/routes.ts";
import type { SiteDetail } from "../catalog/schemas.ts";
import { adminSiteRoutes } from "./sites-routes.ts";
import type { AdminSiteDetail } from "./sites-schemas.ts";

type Method = "GET" | "POST" | "PUT";
type Headers = Record<string, string>;

const editor = authHeader({ id: "editor-1", role: "editor" });
const admin = authHeader({ id: "admin-1", role: "admin" });
const user = authHeader({ id: "user-1", role: "user" });
const moderator = authHeader({ id: "mod-1", role: "moderator" });

let app: App;
let stop: (() => Promise<void>) | undefined;

before(async () => {
  ({ app, stop } = await startTestApp({ register: [adminSiteRoutes, catalogRoutes] }));
  const db = app.deps.db;
  await db.insert(cities).values([
    { id: "bursa", name: "Bursa" },
    { id: "edirne", name: "Edirne" },
  ]);
  await db.insert(sources).values([{ id: "src-vgm", title: "VGM Bursa Envanteri", kind: "book", trust: "verified" }]);
  await db.insert(media).values([
    ...["ph-1", "ph-2"].map((id) => ({
      id,
      kind: "photo" as const,
      mime: "image/jpeg",
      url: `https://cdn.test/${id}.jpg`,
      alt: `${id} alt metni`,
      license: "CC BY 4.0",
      sourceId: "src-vgm",
      trust: "verified" as const,
    })),
    { id: "m-1", kind: "model", mime: "model/gltf-binary", url: "https://cdn.test/m-1.glb", license: "CC0", trust: "verified", parts: ["Govde"], triangles: 1200 },
    { id: "m-2", kind: "model", mime: "model/gltf-binary", url: "https://cdn.test/m-2.glb", license: "CC0", trust: "verified", parts: ["Kubbe"], triangles: null },
  ]);
});
after(() => stop?.());

const call = async <T = unknown>(method: Method, url: string, headers?: Headers, payload?: object) => {
  const res = await app.inject({ method, url, headers: { ...headers }, ...(payload === undefined ? {} : { payload }) });
  return { res, body: res.json<T>() };
};

const send = async (method: "POST" | "PUT", url: string, payload?: object): Promise<AdminSiteDetail> => {
  const { res, body } = await call<AdminSiteDetail>(method, url, editor, payload);
  assert.ok(res.statusCode === 200 || res.statusCode === 201, `${method} ${url}: ${res.body}`);
  return body;
};

const auditOf = (entityId: string) => app.deps.db.select().from(auditLog).where(eq(auditLog.entityId, entityId)).orderBy(asc(auditLog.id));

/** A draft with a location and, unless told otherwise, a model; `publish` also fills what the gate asks for. */
async function newSite(name: string, opts: { model?: string | null; publish?: boolean } = {}): Promise<AdminSiteDetail> {
  const draft = await send("POST", "/v1/admin/sites", { name, city: "bursa", district: "Osmangazi", typeId: "han", description: "Hanlar bölgesinde bir han." });
  const base = `/v1/admin/sites/${draft.id}`;
  await send("PUT", `${base}/location`, { coordinates: [29.06, 40.18] });
  const model = opts.model === undefined ? "m-1" : opts.model;
  if (model) await send("PUT", `${base}/model`, { mediaId: model });
  if (!opts.publish) return (await call<AdminSiteDetail>("GET", base, editor)).body;
  await send("PUT", `${base}/sources`, { sources: [{ id: "src-vgm", title: "VGM Bursa Envanteri", kind: "book", trust: "verified" }] });
  await send("PUT", `${base}/media`, { photoIds: ["ph-1", "ph-2"], coverPhotoId: "ph-1" });
  await send("PUT", `${base}/stories`, {
    blocks: [{ title: "Giriş", text: "Han 1491'de yapıldı.", simple: "Han eskidir.", trust: "verified", photoId: "ph-1", sourceId: "src-vgm", highlights: [] }],
  });
  return send("POST", `${base}/publish`);
}

const placement = (over: Record<string, unknown> = {}) => ({
  headingDeg: 90,
  scale: 1,
  altitudeM: 0,
  anchorNode: "Govde",
  hiddenPoints: [{ lng: 29.061, lat: 40.181 }],
  keptPoints: [],
  visible: true,
  ...over,
});

const put = (id: string, body: object, headers: Headers = editor) => call<AdminSiteDetail & ErrorBody>("PUT", `/v1/admin/sites/${id}/map-placement`, headers, body);

const publicDetail = async (id: string) => (await call<SiteDetail>("GET", `/v1/sites/${id}`)).body;

test("map placement is for editors and admins: guests get 401, users and moderators 403, and a refused write stores nothing", async () => {
  const site = await newSite("Yetki Hanı");
  for (const [who, headers, status] of [
    ["guest", {}, 401],
    ["user", user, 403],
    ["moderator", moderator, 403],
  ] as const) {
    const { res } = await put(site.id, placement(), headers);
    assert.equal(res.statusCode, status, who);
  }
  assert.equal((await call<AdminSiteDetail>("GET", `/v1/admin/sites/${site.id}`, editor)).body.mapPlacement, null);

  assert.equal((await put(site.id, placement(), editor)).res.statusCode, 200);
  assert.equal((await put(site.id, placement({ headingDeg: 180 }), admin)).res.statusCode, 200);
});

test("a site without a model gets 409, an unknown site 404, and nothing is stored", async () => {
  const bare = await newSite("Modelsiz Han", { model: null });
  const refused = await put(bare.id, placement());
  assert.equal(refused.res.statusCode, 409);
  assert.equal(refused.body.error.code, "CONFLICT");
  assert.equal((await app.deps.db.select().from(siteMapPlacements).where(eq(siteMapPlacements.siteId, bare.id))).length, 0);
  assert.equal((await put("yok-boyle-bir-eser", placement())).res.statusCode, 404);
});

test("ranges, a lone coordinate and more than 50 points are 400 VALIDATION_FAILED with field errors", async () => {
  const site = await newSite("Sınır Hanı");
  const points = (n: number) => Array.from({ length: n }, (_, i) => ({ lng: 29.0 + i / 1000, lat: 40.1 }));
  const bad: [string, Record<string, unknown>][] = [
    ["headingDeg", { headingDeg: 360 }],
    ["headingDeg", { headingDeg: -1 }],
    ["scale", { scale: 0.05 }],
    ["scale", { scale: 10.5 }],
    ["altitudeM", { altitudeM: -50.5 }],
    ["altitudeM", { altitudeM: 201 }],
    ["anchorNode", { anchorNode: "x".repeat(201) }],
    ["hiddenPoints", { hiddenPoints: points(51) }],
    ["keptPoints", { keptPoints: points(51) }],
    ["lat", { lng: 29.06 }],
    ["lng", { lat: 40.18 }],
    ["lng", { lng: 181, lat: 40.18 }],
    ["visible", { visible: "evet" }],
  ];
  for (const [field, over] of bad) {
    const { res, body } = await put(site.id, placement(over));
    assert.equal(res.statusCode, 400, `${field}: ${res.body}`);
    assert.equal(body.error.code, "VALIDATION_FAILED");
    assert.ok(body.error.fieldErrors[field], `${field} in ${Object.keys(body.error.fieldErrors)}`);
  }
  // 50 points and the range limits themselves are fine.
  const edge = await put(site.id, placement({ headingDeg: 359.9, scale: 10, altitudeM: -50, hiddenPoints: points(50), keptPoints: points(50) }));
  assert.equal(edge.res.statusCode, 200, edge.res.body);
  assert.equal(edge.body.mapPlacement?.hiddenPoints.length, 50);
});

test("a location or a point outside the site's city is 400 and names the offending field", async () => {
  const site = await newSite("Şehir Hanı");
  const edirne = { lng: 26.55, lat: 41.67 };
  const outside: [string, Record<string, unknown>][] = [
    ["lng", { ...edirne }],
    ["hiddenPoints.1", { hiddenPoints: [{ lng: 29.06, lat: 40.18 }, edirne] }],
    ["keptPoints.0", { keptPoints: [edirne] }],
  ];
  for (const [field, over] of outside) {
    const { res, body } = await put(site.id, placement(over));
    assert.equal(res.statusCode, 400, field);
    assert.equal(body.error.code, "VALIDATION_FAILED");
    assert.ok(body.error.fieldErrors[field], `${field} in ${Object.keys(body.error.fieldErrors)}`);
  }
  assert.equal((await call<AdminSiteDetail>("GET", `/v1/admin/sites/${site.id}`, editor)).body.mapPlacement, null);
});

test("a placement is replaced whole by PUT, audited, and an Idempotency-Key replay answers the first response without a second write", async () => {
  const site = await newSite("Yerleşim Hanı");
  const headers = { ...editor, "idempotency-key": "placement-1" };
  const body = placement({ lng: 29.07, lat: 40.19, headingDeg: 123.5, scale: 1.5, altitudeM: 2.5, keptPoints: [{ lng: 29.062, lat: 40.182 }] });
  const first = await put(site.id, body, headers);
  assert.equal(first.res.statusCode, 200, first.res.body);
  assert.deepEqual(first.body.mapPlacement && { ...first.body.mapPlacement, updatedAt: undefined }, {
    lng: 29.07,
    lat: 40.19,
    headingDeg: 123.5,
    scale: 1.5,
    altitudeM: 2.5,
    anchorNode: "Govde",
    hiddenPoints: [{ lng: 29.061, lat: 40.181 }],
    keptPoints: [{ lng: 29.062, lat: 40.182 }],
    visible: true,
    updatedAt: undefined,
  });
  const replay = await put(site.id, body, headers);
  assert.deepEqual(replay.body, first.body);
  assert.equal((await auditOf(site.id)).filter((r) => r.action === "site.map-placement").length, 1);

  const reused = await put(site.id, { ...body, headingDeg: 10 }, headers);
  assert.equal(reused.res.statusCode, 422);
  assert.equal(reused.body.error.code, "IDEMPOTENCY_KEY_REUSED");

  // A second write is a replacement: omitted location falls back to the site's own, and an empty anchor clears it.
  const second = await put(site.id, placement({ anchorNode: "", hiddenPoints: [] }));
  assert.equal(second.res.statusCode, 200);
  assert.deepEqual(
    { ...second.body.mapPlacement, updatedAt: undefined },
    { lng: 29.06, lat: 40.18, headingDeg: 90, scale: 1, altitudeM: 0, anchorNode: null, hiddenPoints: [], keptPoints: [], visible: true, updatedAt: undefined },
  );
  const rows = await app.deps.db.select().from(siteMapPlacements).where(eq(siteMapPlacements.siteId, site.id));
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.updatedBy, "editor-1");

  const audits = (await auditOf(site.id)).filter((r) => r.action === "site.map-placement");
  assert.equal(audits.length, 2);
  assert.equal(audits[0]?.actorId, "editor-1");
  assert.equal(audits[0]?.before, null);
  const firstSnapshot = { lng: 29.07, lat: 40.19, headingDeg: 123.5, scale: 1.5, altitudeM: 2.5, anchorNode: "Govde", hiddenPoints: [{ lng: 29.061, lat: 40.181 }], keptPoints: [{ lng: 29.062, lat: 40.182 }], visible: true };
  assert.deepEqual(audits[0]?.after, firstSnapshot);
  assert.deepEqual(audits[1]?.before, firstSnapshot);
  assert.deepEqual(audits[1]?.after, { ...firstSnapshot, lng: null, lat: null, headingDeg: 90, scale: 1, altitudeM: 0, anchorNode: null, hiddenPoints: [], keptPoints: [] });
});

test("visitors get the placement of a published site with a model, and an ETag that changes with it", async () => {
  const site = await newSite("Herkese Açık Han", { publish: true });
  const before = await call<SiteDetail>("GET", `/v1/sites/${site.id}`);
  assert.equal(before.body.placement, null, "present, and null, before any placement exists");
  assert.ok("placement" in before.body);
  const model = before.body.media.find((m) => m.kind === "model");
  assert.equal(model?.triangles, 1200);
  const etag = before.res.headers.etag as string;

  await put(site.id, placement({ headingDeg: 45 }));
  const after = await call<SiteDetail>("GET", `/v1/sites/${site.id}`, { "if-none-match": etag });
  assert.equal(after.res.statusCode, 200, "the old ETag no longer matches");
  assert.notEqual(after.res.headers.etag, etag);
  assert.deepEqual(after.body.placement, {
    lng: 29.06,
    lat: 40.18,
    headingDeg: 45,
    scale: 1,
    altitudeM: 0,
    anchorNode: "Govde",
    hiddenPoints: [{ lng: 29.061, lat: 40.181 }],
    keptPoints: [],
  });
  const again = await app.inject({ method: "GET", url: `/v1/sites/${site.id}`, headers: { "if-none-match": String(after.res.headers.etag) } });
  assert.equal(again.statusCode, 304);

  // The bulk read carries it too.
  const list = await call<{ items: SiteDetail[] }>("GET", "/v1/site-details?limit=100");
  assert.deepEqual(list.body.items.find((s) => s.id === site.id)?.placement, after.body.placement);
});

test("a hidden placement is null for visitors but stays in the panel with visible:false, and showing it again keeps its values", async () => {
  const site = await newSite("Gizli Han", { publish: true });
  const body = placement({ lng: 29.065, lat: 40.185, headingDeg: 270, scale: 2, altitudeM: 5 });
  await put(site.id, body);
  const hidden = await put(site.id, { ...body, visible: false });
  assert.equal(hidden.res.statusCode, 200);
  assert.equal(hidden.body.mapPlacement?.visible, false);
  assert.equal(hidden.body.placement, null);

  assert.equal((await publicDetail(site.id)).placement, null);
  const adminDetail = (await call<AdminSiteDetail>("GET", `/v1/admin/sites/${site.id}`, editor)).body;
  assert.equal(adminDetail.mapPlacement?.visible, false);
  assert.equal(adminDetail.mapPlacement?.headingDeg, 270);
  const adminList = await call<{ items: AdminSiteDetail[] }>("GET", "/v1/admin/site-details?query=gizli", editor);
  assert.equal(adminList.body.items.find((s) => s.id === site.id)?.mapPlacement?.visible, false);

  const shown = await put(site.id, { ...body, visible: true });
  assert.equal(shown.body.mapPlacement?.visible, true);
  assert.deepEqual((await publicDetail(site.id)).placement, {
    lng: 29.065,
    lat: 40.185,
    headingDeg: 270,
    scale: 2,
    altitudeM: 5,
    anchorNode: "Govde",
    hiddenPoints: [{ lng: 29.061, lat: 40.181 }],
    keptPoints: [],
  });
});

test("the placement stays when the model is replaced; without a model visitors get null while the panel still has it", async () => {
  const site = await newSite("Model Değişen Han", { publish: true });
  const base = `/v1/admin/sites/${site.id}`;
  await put(site.id, placement({ headingDeg: 30 }));

  const swapped = await send("PUT", `${base}/model`, { mediaId: "m-2" });
  assert.equal(swapped.mapPlacement?.headingDeg, 30);
  const publicSwapped = await publicDetail(site.id);
  assert.equal(publicSwapped.placement?.headingDeg, 30);
  const m2 = publicSwapped.media.find((m) => m.kind === "model");
  assert.equal(m2?.id, "m-2");
  assert.equal(m2?.triangles, null, "a model not counted yet reads as null");

  const removed = await send("PUT", `${base}/model`, { mediaId: null });
  assert.equal(removed.mapPlacement?.headingDeg, 30);
  assert.equal(removed.placement, null);
  assert.equal((await publicDetail(site.id)).placement, null);

  const restored = await send("PUT", `${base}/model`, { mediaId: "m-1" });
  assert.equal(restored.placement?.headingDeg, 30);
});

test("a draft's placement is for the panel only; deleting the site deletes its placement", async () => {
  const draft = await newSite("Taslak Han");
  await put(draft.id, placement());
  assert.equal((await call("GET", `/v1/sites/${draft.id}`)).res.statusCode, 404);
  assert.ok((await call<AdminSiteDetail>("GET", `/v1/admin/sites/${draft.id}`, editor)).body.mapPlacement);

  await app.deps.db.delete(sites).where(eq(sites.id, draft.id));
  assert.equal((await app.deps.db.select().from(siteMapPlacements).where(eq(siteMapPlacements.siteId, draft.id))).length, 0);
});

test("the database refuses a placement outside its ranges even when written around the API", async () => {
  const site = await newSite("Kısıt Hanı");
  const insert = (over: Partial<typeof siteMapPlacements.$inferInsert>) =>
    app.deps.db.insert(siteMapPlacements).values({ siteId: site.id, updatedBy: "x", ...over });
  for (const over of [{ headingDeg: 360 }, { scale: 0 }, { scale: 11 }, { altitudeM: 201 }, { anchorNode: "x".repeat(201) }]) {
    await assert.rejects(insert(over), { message: /./ }, JSON.stringify(over));
  }
  await assert.rejects(insert({ hiddenPoints: Array.from({ length: 51 }, () => ({ lng: 29, lat: 40 })) }));
});
