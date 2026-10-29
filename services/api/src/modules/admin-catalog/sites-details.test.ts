import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { App } from "../../app.ts";
import { cities, media, sources } from "../../db/schema/index.ts";
import type { ErrorBody } from "../../errors.ts";
import { authHeader } from "../../test/auth.ts";
import { startTestApp } from "../../test/harness.ts";
import { adminSiteRoutes } from "./sites-routes.ts";
import type { AdminCardDto, AdminSiteDetail, AdminSiteListItem } from "./sites-schemas.ts";

type Headers = Record<string, string>;
type ListPage = { items: AdminSiteListItem[]; nextCursor: string | null };
type DetailPage = { items: AdminSiteDetail[]; nextCursor: string | null };

const editor = authHeader({ id: "editor-1", role: "editor" });
const admin = authHeader({ id: "admin-1", role: "admin" });
const user = authHeader({ id: "user-1", role: "user" });
const moderator = authHeader({ id: "mod-1", role: "moderator" });

let app: App;
let stop: (() => Promise<void>) | undefined;

before(async () => {
  ({ app, stop } = await startTestApp({ register: [adminSiteRoutes] }));
  const db = app.deps.db;
  await db.insert(cities).values([
    { id: "bursa", name: "Bursa" },
    { id: "edirne", name: "Edirne" },
  ]);
  await db.insert(sources).values([{ id: "src-vgm", title: "VGM Bursa Envanteri", kind: "book", trust: "verified" }]);
  await db.insert(media).values(
    ["ph-1", "ph-2"].map((id) => ({
      id,
      kind: "photo" as const,
      mime: "image/jpeg",
      url: `https://cdn.test/${id}.jpg`,
      alt: `${id} alt metni`,
      license: "CC BY 4.0",
      sourceId: "src-vgm",
      trust: "verified" as const,
    })),
  );
  await db.insert(media).values({ id: "m-1", kind: "model", mime: "model/gltf-binary", url: "https://cdn.test/m-1.glb", license: "CC0", trust: "verified", parts: ["kubbe"] });
});
after(() => stop?.());

const call = async <T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, headers?: Headers, payload?: object) => {
  const res = await app.inject({ method, url, headers: { ...headers }, ...(payload === undefined ? {} : { payload }) });
  return { res, body: res.json<T>() };
};

const send = async (method: "POST" | "PUT", url: string, payload?: object): Promise<AdminSiteDetail> => {
  const { res, body } = await call<AdminSiteDetail>(method, url, editor, payload);
  assert.ok(res.statusCode === 200 || res.statusCode === 201, `${method} ${url}: ${res.body}`);
  return body;
};

const newDraft = (name: string, over: Record<string, unknown> = {}) =>
  send("POST", "/v1/admin/sites", { name, city: "bursa", district: "Osmangazi", typeId: "han", description: "Hanlar bölgesinde bir han.", ...over });

/** One published site with a model, photos, sources, a story that uses a card, About sections and an archive image. */
async function publishedSite(name: string): Promise<AdminSiteDetail> {
  const draft = await newDraft(name);
  const base = `/v1/admin/sites/${draft.id}`;
  const card = (await call<AdminCardDto>("POST", "/v1/admin/cards", editor, { kind: "photo", title: `${name} Kartı`, mediaId: "ph-2", sourceId: "src-vgm", trust: "verified" })).body;
  await send("PUT", `${base}/location`, { coordinates: [29.06, 40.18] });
  await send("PUT", `${base}/model`, { mediaId: "m-1", openingCamera: { azimuthDeg: 30, elevationDeg: 15, distance: 0.8 } });
  await send("PUT", `${base}/sources`, { sources: [{ id: "src-vgm", title: "VGM Bursa Envanteri", kind: "book", trust: "verified" }] });
  await send("PUT", `${base}/media`, { photoIds: ["ph-1", "ph-2"], coverPhotoId: "ph-1" });
  await send("PUT", `${base}/stories`, {
    blocks: [
      { title: "Giriş", text: "Han 1491'de yapıldı.", simple: "Han eskidir.", trust: "verified", photoId: "ph-1", sourceId: "src-vgm", cardId: card.id, highlights: ["kubbe"] },
      { title: "Devam", text: "Avlusu geniştir.", simple: "Avlu geniş.", trust: "verified", photoId: "ph-2", sourceId: "src-vgm", highlights: [] },
    ],
  });
  await send("PUT", `${base}/sections`, { sections: [{ kind: "history", title: "Tarihçe", body: "Han 1491'de yapıldı.", trust: "verified", sourceId: "src-vgm" }] });
  await send("PUT", `${base}/history-images`, { images: [{ mediaId: "ph-1", presentMediaId: "ph-2", trust: "inferred", sourceId: "src-vgm" }] });
  return send("POST", `${base}/publish`);
}

const idsOf = (page: { items: { id: string }[] }) => page.items.map((i) => i.id);

/** Follows `nextCursor` to the end; returns every page. */
async function allPages<T extends { items: unknown[]; nextCursor: string | null }>(path: string, query: string, limit: number): Promise<T[]> {
  const pages: T[] = [];
  let cursor: string | undefined;
  for (;;) {
    const url: string = `${path}?limit=${limit}${query}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const { res, body } = await call<T>("GET", url, editor);
    assert.equal(res.statusCode, 200, res.body);
    pages.push(body);
    if (!body.nextCursor) return pages;
    cursor = body.nextCursor;
  }
}

test("the bulk detail read is for editors and admins: guests get 401, users and moderators 403", async () => {
  await newDraft("Yetki Hanı");
  const url = "/v1/admin/site-details";
  const guest = await call<ErrorBody>("GET", url);
  assert.equal(guest.res.statusCode, 401);
  assert.equal(guest.body.error.code, "UNAUTHENTICATED");
  for (const headers of [user, moderator]) {
    const denied = await call<ErrorBody>("GET", url, headers);
    assert.equal(denied.res.statusCode, 403);
    assert.equal(denied.body.error.code, "FORBIDDEN");
  }
  for (const headers of [editor, admin]) {
    const ok = await call<DetailPage>("GET", url, headers);
    assert.equal(ok.res.statusCode, 200);
    assert.equal(ok.res.headers["cache-control"], "no-store");
    assert.ok(ok.body.items.length > 0);
  }
});

test("every item equals GET /v1/admin/sites/:id, for bare drafts and for a published site with stories, photos and sources", async () => {
  const bare = await newDraft("Konumsuz Han", { typeId: undefined });
  const typed = await newDraft("Türlü Han");
  const published = await publishedSite("Yayındaki Han");
  assert.equal(bare.kind, null);
  assert.equal(bare.coordinates, null);
  assert.equal(published.status, "published");
  assert.ok(published.stories.length > 0 && published.photoIds.length > 0 && published.sources.length > 0 && published.cards.length > 0);

  const { res, body } = await call<DetailPage>("GET", "/v1/admin/site-details?limit=100&query=han", editor);
  assert.equal(res.statusCode, 200, res.body);
  for (const site of [bare, typed, published]) {
    const item = body.items.find((i) => i.id === site.id);
    assert.ok(item, `${site.id} is listed`);
    const single = await call<AdminSiteDetail>("GET", `/v1/admin/sites/${site.id}`, editor);
    assert.deepEqual(item, single.body);
  }
});

test("pages hold the same ids in the same order as /v1/admin/sites with the same filters", async () => {
  for (let i = 1; i <= 5; i++) await newDraft(`Sayfa Hanı ${i}`, { city: i % 2 ? "bursa" : "edirne" });
  await publishedSite("Sayfa Hanı Yayında");

  for (const query of ["", "&status=draft", "&status=published", "&city=edirne", "&query=sayfa%20hani", "&status=draft&city=bursa&query=han"]) {
    const list = await allPages<ListPage>("/v1/admin/sites", query, 2);
    const details = await allPages<DetailPage>("/v1/admin/site-details", query, 2);
    assert.deepEqual(details.map(idsOf), list.map(idsOf), `pages for "${query}"`);
    assert.deepEqual(details.map((p) => p.nextCursor), list.map((p) => p.nextCursor), `cursors for "${query}"`);
  }
  const all = (await call<DetailPage>("GET", "/v1/admin/site-details?limit=100", editor)).body;
  assert.ok(all.items.length >= 6);
  assert.equal(all.nextCursor, null);
});

test("status=draft lists only drafts", async () => {
  await newDraft("Taslak Süzgeç Hanı");
  const published = await publishedSite("Süzgeç Yayında");
  const drafts = (await call<DetailPage>("GET", "/v1/admin/site-details?status=draft&limit=100", editor)).body;
  assert.ok(drafts.items.length > 0);
  assert.ok(drafts.items.every((i) => i.status === "draft"));
  assert.ok(!idsOf(drafts).includes(published.id));
  const live = (await call<DetailPage>("GET", "/v1/admin/site-details?status=published&limit=100", editor)).body;
  assert.ok(idsOf(live).includes(published.id));
  assert.ok(live.items.every((i) => i.status === "published"));
});

test("a malformed cursor is 400 INVALID_CURSOR and a limit over 100 is refused", async () => {
  const bad = await call<ErrorBody>("GET", "/v1/admin/site-details?cursor=bozuk", editor);
  assert.equal(bad.res.statusCode, 400);
  assert.equal(bad.body.error.code, "INVALID_CURSOR");
  const tooMany = await call<ErrorBody>("GET", "/v1/admin/site-details?limit=101", editor);
  assert.equal(tooMany.res.statusCode, 400);
  assert.equal(tooMany.body.error.code, "VALIDATION_FAILED");
});
