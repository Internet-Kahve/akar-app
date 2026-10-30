import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { App } from "../../app.ts";
import { eq } from "drizzle-orm";
import { cities, media, siteAboutChapters, siteBadges, siteSampleTraces, siteSectionPhotos, siteSections, siteTaskAnswers, siteTasks, sites, sources } from "../../db/schema/index.ts";
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

test("the bulk admin detail carries the map order (eser.json sira) like the single detail: the number, or null for an unranked site", async () => {
  const ranked = await newDraft("Sıralı Han");
  const unranked = await newDraft("Sırasız Han");
  await app.deps.db.update(sites).set({ displayOrder: 2 }).where(eq(sites.id, ranked.id));
  const { body } = await call<DetailPage>("GET", "/v1/admin/site-details?limit=100&query=han", editor);
  assert.equal(body.items.find((i) => i.id === ranked.id)?.displayOrder, 2);
  assert.equal(body.items.find((i) => i.id === unranked.id)?.displayOrder, null);
  assert.equal((await call<AdminSiteDetail>("GET", `/v1/admin/sites/${ranked.id}`, editor)).body.displayOrder, 2);
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

test("rewriting the paragraphs keeps what the import attached: chapter and book photographs follow the paragraph's id, a new paragraph joins the chapter with its title", async () => {
  const site = await publishedSite("Okuma Hanı");
  const base = `/v1/admin/sites/${site.id}`;
  const db = app.deps.db;
  const first = site.sections[0]!;
  const reading = { summary: ["Han 1491'de yapıldı."], figures: [], quotes: [], timeline: [], terms: [], camera: null, interior: false, focusParts: [] };
  const chapterId = `chapter-${site.id}`;
  await db.insert(siteAboutChapters).values({ id: chapterId, siteId: site.id, position: 0, title: "Tarihçe", kind: "history", reading });
  await db.update(siteSections).set({ chapterId }).where(eq(siteSections.siteId, site.id));
  await db.insert(siteSectionPhotos).values([
    { siteId: site.id, sectionId: first.id, position: 0, mediaId: "ph-1", aspect: 1.5, alt: "Birinci" },
    { siteId: site.id, sectionId: first.id, position: 1, mediaId: "ph-2", aspect: null, alt: "İkinci" },
  ]);
  await db.update(sites).set({ aboutCoverMediaId: "ph-2" }).where(eq(sites.id, site.id));

  const edited = await send("PUT", `${base}/sections`, {
    sections: [
      { kind: "architecture", title: "Mimari", body: "Avlulu.", trust: "verified" },
      { id: first.id, kind: "history", title: "Tarihçe", body: "Han 1491'de inşa edildi.", trust: "verified", sourceId: "src-vgm" },
      { kind: "history", title: "Tarihçe", body: "Sonradan eklenen paragraf.", trust: "verified" },
    ],
  });
  assert.deepEqual(edited.sections.map((x) => [x.title, x.chapterId, x.photos.map((p) => p.alt)]), [
    ["Mimari", null, []],
    ["Tarihçe", chapterId, ["Birinci", "İkinci"]],
    ["Tarihçe", chapterId, []],
  ]);
  assert.equal(edited.sections[1]!.photos[0]!.aspect, 1.5);
  assert.deepEqual(edited.chapters.map((c) => c.id), [chapterId]);
  assert.equal(edited.aboutCoverMediaId, "ph-2");

  // A paragraph left out takes its photographs with it; the chapter and the cover stay.
  const trimmed = await send("PUT", `${base}/sections`, { sections: [{ kind: "architecture", title: "Mimari", body: "Avlulu.", trust: "verified" }] });
  assert.equal(trimmed.sections.length, 1);
  assert.equal(trimmed.chapters.length, 1);
  assert.equal(trimmed.aboutCoverMediaId, "ph-2");
  assert.equal((await db.select().from(siteSectionPhotos).where(eq(siteSectionPhotos.siteId, site.id))).length, 0);
  const listed = await call<DetailPage>("GET", `/v1/admin/site-details?query=${encodeURIComponent("okuma hani")}`, editor);
  assert.deepEqual(listed.body.items.find((i) => i.id === site.id), (await call<AdminSiteDetail>("GET", base, editor)).body);
});

test("the admin detail carries the tasks and badges the public detail does, the task photograph resolves from its media, no answer key, and editing the paragraphs leaves them alone", async () => {
  const site = await publishedSite("Görev Hanı");
  const db = app.deps.db;
  await db.insert(siteTasks).values({
    id: `${site.id}-soru`, siteId: site.id, position: 0, kind: "quiz", title: "Soru", prompt: "Hangisi?", mediaId: "ph-2", part: null, source: "E cilt-1 PDF s.27", trust: "verified",
    details: { options: ["A", "B"], hints: ["İpucu"], correctText: "Gizli doğru metin", wrongText: "Tekrar dene", fromHome: false },
  });
  await db.insert(siteTaskAnswers).values({ taskId: `${site.id}-soru`, correctIndex: 1 });
  await db.insert(siteBadges).values({ id: `${site.id}-rozet`, siteId: site.id, position: 0, title: "Rozet", text: "Kazandın", condition: "task", taskId: `${site.id}-soru`, onSiteLabel: false });

  const admin = (await call<AdminSiteDetail>("GET", `/v1/admin/sites/${site.id}`, editor)).body;
  const pub = (await call<AdminSiteDetail>("GET", `/v1/sites/${site.id}`)).body;
  assert.deepEqual(admin.tasks, pub.tasks);
  assert.deepEqual(admin.badges, pub.badges);
  assert.deepEqual(admin.tasks, [
    { id: `${site.id}-soru`, kind: "quiz", title: "Soru", prompt: "Hangisi?", photoId: "ph-2", part: null, source: "E cilt-1 PDF s.27", trust: "verified", quiz: { options: ["A", "B"], hints: ["İpucu"], wrongText: "Tekrar dene", fromHome: false } },
  ]);
  assert.deepEqual(admin.badges, [{ id: `${site.id}-rozet`, title: "Rozet", text: "Kazandın", condition: "task", taskId: `${site.id}-soru`, onSiteLabel: false }]);
  assert.ok(admin.media.some((m) => m.id === "ph-2"), "the task photograph is part of the media list");
  assert.ok(!JSON.stringify(admin).includes("Gizli doğru metin"));

  const edited = await send("PUT", `/v1/admin/sites/${site.id}/sections`, { sections: [{ kind: "architecture", title: "Mimari", body: "Avlulu.", trust: "verified" }] });
  assert.equal(edited.tasks.length, 1);
  assert.equal(edited.badges.length, 1);
});

test("the admin detail carries the team's samples as the public detail does, a sample's photograph resolves from its media, and dropping its archive image keeps the sample", async () => {
  const site = await publishedSite("Örnek Hanı");
  const db = app.deps.db;
  const base = `/v1/admin/sites/${site.id}`;
  await db.insert(media).values({
    id: "ph-trace", kind: "photo", mime: "image/webp", url: "https://cdn.test/ph-trace.webp", alt: "Aynı eksen.",
    description: "Fotoğraf: Arşiv (örnek katkı olarak gösteriliyor)", license: "Proje için verildi", trust: "representative",
  });
  const imageId = site.historyImages[0]!.id;
  await db.insert(siteSampleTraces).values({ id: `${site.id}-iz`, siteId: site.id, position: 0, author: "AKAR ekibi", text: "Aynı eksen.", mediaId: "ph-trace", historyImageId: imageId, angleMatch: "near", addedOn: "2026-10-28" });

  const admin = (await call<AdminSiteDetail>("GET", base, editor)).body;
  const pub = (await call<AdminSiteDetail>("GET", `/v1/sites/${site.id}`)).body;
  assert.deepEqual(admin.sampleTraces, pub.sampleTraces);
  assert.deepEqual(admin.sampleTraces, [{ id: `${site.id}-iz`, author: "AKAR ekibi", text: "Aynı eksen.", mediaId: "ph-trace", historyImageId: imageId, angleMatch: "near", addedOn: "2026-10-28" }]);
  assert.equal(admin.media.find((m) => m.id === "ph-trace")?.description, "Fotoğraf: Arşiv (örnek katkı olarak gösteriliyor)");
  const listed = await call<DetailPage>("GET", `/v1/admin/site-details?query=${encodeURIComponent("örnek hanı")}`, editor);
  assert.deepEqual(listed.body.items.find((i) => i.id === site.id)?.sampleTraces, admin.sampleTraces);

  const emptied = await send("PUT", `${base}/history-images`, { images: [] });
  assert.deepEqual(emptied.sampleTraces.map((t) => [t.id, t.historyImageId]), [[`${site.id}-iz`, null]]);
});
