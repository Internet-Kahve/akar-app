import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { after, before, test } from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startTestApp, TEST_RECEIPT_SECRET } from "../test/harness.ts";
import { deleteUnreferencedMedia } from "../modules/media/service.ts";
import { siteBadges, siteTaskAnswers, siteTasks, userSiteBadges, userSiteTasks } from "./schema/index.ts";
import { importDemoContent } from "./import-demo.ts";

let ctx: Awaited<ReturnType<typeof startTestApp>>;
let root: string;
let env: NodeJS.ProcessEnv;
before(async () => {
  ctx = await startTestApp(); root = await mkdtemp(join(tmpdir(), "akar-content-test-"));
  env = { NODE_ENV: "test", DATABASE_URL: ctx.config.DATABASE_URL, RECEIPT_SECRET: TEST_RECEIPT_SECRET,
    STORAGE_DRIVER: "fs", STORAGE_FS_ROOT: join(root, "storage"), STORAGE_PUBLIC_BASE_URL: "https://media.test" };
});
after(async () => { await ctx?.stop(); if (root) await rm(root, { recursive: true, force: true }); });

test("content import deduplicates bytes, retains credits, repeats safely and rolls back the whole catalog on failure", async () => {
  const json = Buffer.from('{"asset":{"version":"2.0"},"nodes":[{"name":"kubbe_1"}]}   ');
  const glb = Buffer.alloc(20 + json.length);
  glb.writeUInt32LE(0x46546c67, 0); glb.writeUInt32LE(2, 4); glb.writeUInt32LE(glb.length, 8);
  glb.writeUInt32LE(json.length, 12); glb.writeUInt32LE(0x4e4f534a, 16); json.copy(glb, 20);
  await writeFile(join(root, "model.glb"), glb); await writeFile(join(root, "photo.jpg"), Buffer.from([255, 216, 255, 217]));
  await writeFile(join(root, "book.jpg"), Buffer.from([255, 216, 255, 1, 217]));
  const sites = Array.from({ length: 7 }, (_, i) => ({
    id: `test-${i}`, name: `Eser ${i}`, city: "Bursa", district: "Hanlar", year: "1400", architect: "—", kind: "cami",
    coordinates: [29.06, 40.18], minutes: 1, description: "Kaynaklı içerik", status: "published", tier: "Tier 2", source: "Envanter",
    stories: [], sources: [{ id: `source-${i}`, title: "Fotoğrafçı · Arşiv", kind: "archive", author: "Fotoğrafçı", year: "1900", page: "", url: "https://archive.test", trust: "verified" }],
    photos: [
      { id: `photo-${i}`, file: "photo.jpg", src: "", alt: "Dış görünüş", title: "Eser", titleEn: "", description: "", license: "Proje izni", trust: "verified", sourceId: `source-${i}`, galleryPosition: 1 },
      // Off the gallery: only the part card shows it.
      { id: `detail-${i}`, file: "photo.jpg", src: "", alt: "Kubbe", title: "Kubbe", titleEn: "", description: "", license: "Proje izni", trust: "verified", sourceId: `source-${i}`, galleryPosition: null },
    ],
    coverPhotoId: `photo-${i}`, model: { file: "model.glb", src: "", name: "Model", bytes: 0, parts: [], trust: "representative" },
    historyImages: [{ id: `archive-${i}`, file: "photo.jpg", caption: "Eski eser", dateLabel: "1900", alt: "Eski görünüş", license: "CC BY-NC-ND", credit: "Fotoğrafçı · Arşiv", trust: "verified", sourceId: `source-${i}` }], sections: [
      { id: `sec-${i}-1`, kind: "history", title: "Tarihçe", body: "Cami 1399 yılında açıldı.", trust: "verified", sourceId: `source-${i}`, chapterId: `chapter-${i}`,
        photos: [{ id: `photo-${i}`, aspect: 1.5, alt: "Dış görünüş" }, { id: `book-${i}`, aspect: null, alt: "Kitap sayfası" }] },
      { id: `sec-${i}-2`, kind: "architecture", title: "Mimari", body: "Kubbeli.", trust: "verified", sourceId: `source-${i}`, chapterId: null, photos: [] },
    ] as unknown[],
    // The reading layer: a chapter with its paragraph (a gallery photo and a book photo after it) and a paragraph outside any chapter.
    chapters: [{ id: `chapter-${i}`, title: "Tarihçe", kind: "history", reading: { summary: ["Kaynaklı cümle."], figures: [{ value: "1399", label: "açılış yılı", evidence: "1399 yılında" }], quotes: [{ text: "Alıntı", by: null }], timeline: [{ year: "1399", evidence: "1399 yılında" }], terms: [{ word: "kubbe", definition: "Yarım küre örtü" }], camera: { target: "kubbe_1", azimuthDeg: 30, elevationDeg: 40, distance: 0.6 }, interior: true, focusParts: ["kubbe_1"] } }],
    bookPhotos: [{ id: `book-${i}`, file: "book.jpg", alt: "Kitap sayfası", title: "Envanter Cilt 1 · s. 18", description: "Kitaptan kesildi", license: "Proje izni", trust: "verified", sourceId: `source-${i}` }],
    aboutCoverPhotoId: `detail-${i}`,
    partCards: [{ id: `part-${i}`, parts: ["kubbe_1"], title: "Kubbe", body: "Kaynaklı metin", photoIds: [`detail-${i}`, `photo-${i}`], trust: "verified", sourceId: `source-${i}` }],
    // A question (the answer key stays on the server) and a field task with a way to do it from home; a story badge and a task badge each.
    tasks: [
      { id: `task-q-${i}`, kind: "quiz", title: "Soru", prompt: "Hangisi?", photoId: `detail-${i}`, part: "kubbe_1", source: "E cilt-1 PDF s.27", trust: "verified", correctIndex: 1,
        details: { options: ["A", "B", "C"], hints: ["İpucu 1", "İpucu 2"], correctText: "B doğru", wrongText: "Tekrar dene", fromHome: true } },
      { id: `task-f-${i}`, kind: "field", title: "Saha", prompt: "Kapıyı bul", photoId: null, part: null, source: null, trust: "verified", correctIndex: null,
        details: { onSite: { text: "Önüne gel", radiusM: 80 }, fromHome: { text: "Kubbeye dokun", part: "kubbe_1" }, doneText: "Bulundu" } },
    ] as Array<{ id: string; correctIndex: number | null; details: unknown } & Record<string, unknown>>,
    badges: [
      { id: `badge-s-${i}`, title: "Hikâye", text: "Dinledin", condition: "story", taskId: null, onSiteLabel: false },
      { id: `badge-f-${i}`, title: "Kapı", text: "Buldun", condition: "task", taskId: `task-f-${i}`, onSiteLabel: true },
    ],
  }));
  const scene = { light: { ambient: 2, sun: 1, fill: 1, azimuthDeg: 315, elevationDeg: 45, saturation: 1.25, groundShadow: 0.18 }, backgroundTop: "#DDE4E5", backgroundBottom: "#A7B4B7" };
  const bursa = { id: "bursa", name: "Bursa", isDefault: true, map: { center: [29.0628, 40.1846], zoom: 16.3, zoomDesktop: 16.7 },
    inventory: { name: "Bursa Vakıf Eserleri Envanteri", publisher: null, year: 2025, siteCount: 385 }, scene };
  // A city with no site in the app: on the globe as «Yakında», no scene.
  const konya = { id: "konya", name: "Konya", isDefault: false, map: { center: [32.4846, 37.8714], zoom: 14, zoomDesktop: null },
    inventory: { name: null, publisher: null, year: 2024, siteCount: 289 }, scene: null };
  const manifest = { version: 1, sites, routes: [], retireSiteIds: [], cities: [bursa, konya] };
  const path = join(root, "manifest.json");
  scene.backgroundTop = "gri";
  await writeFile(path, JSON.stringify(manifest));
  await assert.rejects(importDemoContent(path, root, false, {}), /#RRGGBB/);
  scene.backgroundTop = "#DDE4E5";
  await writeFile(path, JSON.stringify(manifest));
  assert.equal((await importDemoContent(path, root, false, {})).objects, 3);
  for (let i = 0; i < 2; i++) assert.equal((await importDemoContent(path, root, true, env)).objects, 3);
  const served = async () => (await ctx.app.inject({ url: "/v1/cities" })).json().items as Array<{ id: string; siteCount: number } & Record<string, unknown>>;
  const city = (await served()).find((c) => c.id === "bursa")!;
  assert.deepEqual(city.scene, scene, "the city record's scene is served with the city");
  assert.deepEqual([city.isDefault, city.map, city.inventory], [true, bursa.map, bursa.inventory]);
  assert.deepEqual((await served()).find((c) => c.id === "konya"), { ...konya, siteCount: 0, routeCount: 0 }, "a city without sites is listed");
  // Moving the default to another city in one import (the unique index allows one default at a time).
  [bursa.isDefault, konya.isDefault] = [false, true];
  await writeFile(path, JSON.stringify(manifest));
  await importDemoContent(path, root, true, env);
  assert.deepEqual((await served()).filter((c) => c.isDefault).map((c) => c.id), ["konya"]);
  [bursa.isDefault, konya.isDefault] = [true, false];
  await writeFile(path, JSON.stringify(manifest));
  await importDemoContent(path, root, true, env);
  const res = await ctx.app.inject({ url: "/v1/sites/test-0" });
  assert.equal(res.statusCode, 200);
  const detail = res.json();
  assert.equal(detail.historyImages[0].dateLabel, "1900");
  assert.equal(detail.media.find((m: { id: string }) => m.id === "archive-0").description, "Fotoğrafçı · Arşiv");
  assert.deepEqual(detail.photoIds, ["photo-0"]);
  assert.deepEqual(detail.media.find((m: { kind: string }) => m.kind === "model").parts, ["kubbe_1"]);
  assert.equal(detail.media.find((m: { kind: string }) => m.kind === "model").triangles, 0, "the model's triangles are counted from its file");
  assert.deepEqual(detail.partCards.map((c: { parts: string[]; photoIds: string[] }) => [c.parts, c.photoIds]), [[["kubbe_1"], ["detail-0", "photo-0"]]]);
  assert.ok(detail.media.some((m: { id: string }) => m.id === "detail-0"), "a card's off-gallery photo resolves from the detail's media");
  // The reading layer comes back whole: chapters in order, paragraphs tied to them, book photographs in order (a gallery photo and a book-only one).
  assert.deepEqual(detail.chapters, [{ id: "chapter-0", title: "Tarihçe", kind: "history", summary: ["Kaynaklı cümle."], figures: [{ value: "1399", label: "açılış yılı", evidence: "1399 yılında" }],
    quotes: [{ text: "Alıntı", by: null }], timeline: [{ year: "1399", evidence: "1399 yılında" }], terms: [{ word: "kubbe", definition: "Yarım küre örtü" }],
    camera: { target: "kubbe_1", azimuthDeg: 30, elevationDeg: 40, distance: 0.6 }, interior: true, focusParts: ["kubbe_1"] }]);
  assert.deepEqual(detail.sections.map((x: { id: string; chapterId: string | null; photos: unknown[] }) => [x.id, x.chapterId, x.photos]), [
    ["sec-0-1", "chapter-0", [{ mediaId: "photo-0", aspect: 1.5, alt: "Dış görünüş" }, { mediaId: "book-0", aspect: null, alt: "Kitap sayfası" }]],
    ["sec-0-2", null, []],
  ]);
  assert.equal(detail.aboutCoverMediaId, "detail-0");
  assert.deepEqual(detail.photoIds, ["photo-0"], "book photographs are not gallery photographs");
  for (const id of ["book-0", "detail-0"]) assert.ok(detail.media.some((m: { id: string }) => m.id === id), `${id} resolves from the detail's media`);
  assert.equal(detail.media.find((m: { id: string }) => m.id === "book-0").description, "Kitaptan kesildi");
  // Tasks and badges come back in order; the public task carries no answer key and none of the after-the-answer texts.
  assert.deepEqual(detail.tasks, [
    { id: "task-q-0", kind: "quiz", title: "Soru", prompt: "Hangisi?", photoId: "detail-0", part: "kubbe_1", source: "E cilt-1 PDF s.27", trust: "verified",
      quiz: { options: ["A", "B", "C"], hints: ["İpucu 1", "İpucu 2"], wrongText: "Tekrar dene", fromHome: true } },
    { id: "task-f-0", kind: "field", title: "Saha", prompt: "Kapıyı bul", photoId: null, part: null, source: null, trust: "verified",
      field: { onSite: { text: "Önüne gel", radiusM: 80 }, fromHome: { text: "Kubbeye dokun", part: "kubbe_1" } } },
  ]);
  assert.deepEqual(detail.badges.map((b: { id: string; condition: string; taskId: string | null; onSiteLabel: boolean }) => [b.id, b.condition, b.taskId, b.onSiteLabel]),
    [["badge-s-0", "story", null, false], ["badge-f-0", "task", "task-f-0", true]]);
  assert.ok(!/correctText|doneText|correctIndex|B doğru|Bulundu/.test(res.body), "no answer key or after-the-answer text in the public detail");
  assert.deepEqual((await ctx.app.deps.db.select().from(siteTaskAnswers).where(eq(siteTaskAnswers.taskId, "task-q-0"))), [{ taskId: "task-q-0", correctIndex: 1 }]);
  assert.equal((await ctx.app.deps.db.select().from(siteTaskAnswers).where(eq(siteTaskAnswers.taskId, "task-f-0"))).length, 0, "a field task has no answer key");
  assert.ok(detail.media.some((m: { id: string }) => m.id === "detail-0"));
  const swept = await ctx.app.deps.db.transaction((tx) => deleteUnreferencedMedia(tx, ["book-0"]));
  assert.deepEqual(swept, [], "a photograph only a paragraph shows is in use");
  // A reimport keeps a player's progress for every task and badge that is still in the manifest, reorders freely, and drops only what vanished.
  const db = ctx.app.deps.db;
  await db.insert(userSiteTasks).values([{ userId: "u1", taskId: "task-q-0", onSite: false }, { userId: "u1", taskId: "task-f-0", onSite: true }]);
  await db.insert(userSiteBadges).values([{ userId: "u1", badgeId: "badge-s-0" }, { userId: "u1", badgeId: "badge-f-0", onSite: true }]);
  sites[0]!.tasks.reverse();
  sites[0]!.badges.reverse();
  await writeFile(path, JSON.stringify(manifest));
  await importDemoContent(path, root, true, env);
  assert.deepEqual((await db.select({ id: siteTasks.id }).from(siteTasks).where(eq(siteTasks.siteId, "test-0")).orderBy(siteTasks.position)).map((t) => t.id), ["task-f-0", "task-q-0"]);
  assert.equal((await db.select().from(userSiteTasks)).length, 2, "reordering keeps the progress");
  assert.equal((await db.select().from(userSiteBadges)).length, 2);
  sites[0]!.tasks = sites[0]!.tasks.filter((t) => t.id !== "task-f-0");
  sites[0]!.badges = sites[0]!.badges.filter((b) => b.id !== "badge-f-0");
  await writeFile(path, JSON.stringify(manifest));
  await importDemoContent(path, root, true, env);
  assert.deepEqual((await db.select({ id: siteTasks.id }).from(siteTasks).where(eq(siteTasks.siteId, "test-0"))).map((t) => t.id), ["task-q-0"]);
  assert.deepEqual((await db.select({ id: siteBadges.id }).from(siteBadges).where(eq(siteBadges.siteId, "test-0"))).map((b) => b.id), ["badge-s-0"]);
  assert.deepEqual((await db.select({ id: userSiteTasks.taskId }).from(userSiteTasks)).map((t) => t.id), ["task-q-0"], "only the vanished task's progress goes");
  assert.deepEqual((await db.select({ id: userSiteBadges.badgeId }).from(userSiteBadges)).map((b) => b.id), ["badge-s-0"]);
  sites[1]!.tasks[1]!.details = { onSite: { text: "Önüne gel", radiusM: 80 }, fromHome: { text: "Dokun", part: "yok" }, doneText: "Bulundu" };
  await writeFile(path, JSON.stringify(manifest));
  await assert.rejects(importDemoContent(path, root, false, {}), /Task part is not a model part: test-1 task-f-1 yok/);
  sites[1]!.tasks[1]!.details = { onSite: { text: "Önüne gel", radiusM: 80 }, fromHome: { text: "Kubbeye dokun", part: "kubbe_1" }, doneText: "Bulundu" };
  sites[1]!.badges[1]!.taskId = "yok";
  await writeFile(path, JSON.stringify(manifest));
  await assert.rejects(importDemoContent(path, root, false, {}), /Badge condition: test-1 badge-f-1/);
  sites[1]!.badges[1]!.taskId = "task-f-1";
  sites[1]!.tasks[0]!.correctIndex = 3;
  await writeFile(path, JSON.stringify(manifest));
  await assert.rejects(importDemoContent(path, root, false, {}), /Quiz answer is not an option: test-1 task-q-1/);
  sites[1]!.tasks[0]!.correctIndex = 1;
  sites[1]!.chapters[0]!.reading.focusParts = ["yok"];
  await writeFile(path, JSON.stringify(manifest));
  await assert.rejects(importDemoContent(path, root, false, {}), /Chapter parts are not model parts: test-1 yok/);
  sites[1]!.chapters[0]!.reading.focusParts = ["kubbe_1"];
  sites[1]!.partCards[0]!.parts = ["yok"];
  await writeFile(path, JSON.stringify(manifest));
  await assert.rejects(importDemoContent(path, root, false, {}), /not model parts: test-1 yok/);
  sites[1]!.partCards[0]!.parts = ["kubbe_1"];
  sites[0]!.name = "Must roll back";
  sites[6]!.sections = [{ id: "bad", kind: "history", title: "bad", body: "bad", sourceId: "missing", trust: "verified", chapterId: null, photos: [] }];
  await writeFile(path, JSON.stringify(manifest));
  await assert.rejects(importDemoContent(path, root, true, env));
  assert.equal((await ctx.app.inject({ url: "/v1/sites/test-0" })).json().name, "Eser 0");
});
