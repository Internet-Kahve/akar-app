import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { after, before, test } from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startTestApp, TEST_RECEIPT_SECRET } from "../test/harness.ts";
import { deleteUnreferencedMedia } from "../modules/media/service.ts";
import { siteBadges, sitePartCards, siteTaskAnswers, siteTasks, userSiteBadges, userSiteTasks } from "./schema/index.ts";
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
  await writeFile(join(root, "present.webp"), Buffer.from([82, 73, 70, 70, 1])); await writeFile(join(root, "trace.webp"), Buffer.from([82, 73, 70, 70, 2]));
  const sites = Array.from({ length: 7 }, (_, i) => ({
    id: `test-${i}`, name: `Eser ${i}`, city: "Bursa", district: "Hanlar", year: "1400", architect: "—", kind: "cami", displayOrder: [3, 1, 1][i] ?? null,
    coordinates: [29.06, 40.18], minutes: 1, description: "Kaynaklı içerik", status: "published", tier: "Tier 2", source: "Envanter",
    stories: [], sources: [{ id: `source-${i}`, title: "Fotoğrafçı · Arşiv", kind: "archive", author: "Fotoğrafçı", year: "1900", page: "", url: "https://archive.test", trust: "verified" }],
    photos: [
      { id: `photo-${i}`, file: "photo.jpg", src: "", alt: "Dış görünüş", title: "Eser", titleEn: "", description: "", license: "Proje izni", trust: "verified", sourceId: `source-${i}`, galleryPosition: 1 },
      // Off the gallery: only the part card shows it.
      { id: `detail-${i}`, file: "photo.jpg", src: "", alt: "Kubbe", title: "Kubbe", titleEn: "", description: "", license: "Proje izni", trust: "verified", sourceId: `source-${i}`, galleryPosition: null },
    ],
    coverPhotoId: `photo-${i}`, model: { file: "model.glb", src: "", name: "Model", bytes: 0, parts: [], trust: "representative" },
    // The archive photograph has a present-day pair (the team's choice) credited as its file says.
    historyImages: [{ id: `archive-${i}`, file: "photo.jpg", caption: "Eski eser", dateLabel: "1900", alt: "Eski görünüş", license: "CC BY-NC-ND", credit: "Fotoğrafçı · Arşiv", trust: "verified", sourceId: `source-${i}`,
      present: { id: `present-${i}`, file: "present.webp", alt: "Bugünkü görünüm: Eski eser", credit: "Fotoğraf: Proje arşivi", license: "Proje için verildi; kullanılabilir.", angleMatch: "near" } as Record<string, unknown> | null }], sections: [
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
    // Two team-made İz Bırak samples: one shows the archive photograph's view, one belongs to no photograph.
    sampleTraces: [
      { id: `iz-${i}-1`, author: "AKAR ekibi", text: "Aynı eksen, bugünden.", alt: "Aynı eksen, bugünden.", file: "trace.webp", credit: "Fotoğraf: Proje arşivi (örnek katkı olarak gösteriliyor)", license: "Proje için verildi; kullanılabilir.", addedOn: "2026-10-28", historyImageId: `archive-${i}`, angleMatch: "same" },
      { id: `iz-${i}-2`, author: "AKAR ekibi", text: "Avludan bir kare.", alt: "Avludan bir kare.", file: "trace.webp", credit: "Fotoğraf: Proje arşivi (örnek katkı olarak gösteriliyor)", license: "Proje için verildi; kullanılabilir.", addedOn: "2026-10-29", historyImageId: null, angleMatch: null },
    ] as Array<Record<string, unknown>>,
  }));
  const scene = { light: { ambient: 2, sun: 1, fill: 1, azimuthDeg: 315, elevationDeg: 45, saturation: 1.25, groundShadow: 0.18 }, backgroundTop: "#DDE4E5", backgroundBottom: "#A7B4B7" };
  const identity = { accent: "#22566E", pattern: "desen-bursa-sekiz-yildiz.svg", patternColour: "#A4D8E0" };
  const bursa = { id: "bursa", name: "Bursa", isDefault: true, map: { center: [29.0628, 40.1846], zoom: 16.3, zoomDesktop: 16.7 },
    inventory: { name: "Bursa Vakıf Eserleri Envanteri", publisher: null, year: 2025, siteCount: 385 }, scene, identity };
  // A city with no site in the app: on the globe as «Yakında», no scene; its identity (§11.49) is there all the same.
  const konya = { id: "konya", name: "Konya", isDefault: false, map: { center: [32.4846, 37.8714], zoom: 14, zoomDesktop: null },
    inventory: { name: null, publisher: null, year: 2024, siteCount: 289 }, scene: null,
    identity: { accent: "#3D8285", pattern: "desen-konya-on-iki-gulbezek.svg", patternColour: "#E8DD7A" } };
  // Neither scene nor identity.
  const hatay = { id: "hatay", name: "Hatay", isDefault: false, map: { center: [36.16, 36.2025], zoom: 14, zoomDesktop: null },
    inventory: { name: null, publisher: null, year: 2022, siteCount: 117 }, scene: null, identity: null };
  const manifest = { version: 1, sites, routes: [], retireSiteIds: [], cities: [bursa, konya, hatay] };
  const path = join(root, "manifest.json");
  scene.backgroundTop = "gri";
  await writeFile(path, JSON.stringify(manifest));
  await assert.rejects(importDemoContent(path, root, false, {}), /#RRGGBB/);
  scene.backgroundTop = "#DDE4E5";
  identity.pattern = "../desen.svg";
  await writeFile(path, JSON.stringify(manifest));
  await assert.rejects(importDemoContent(path, root, false, {}), /\.svg dosya adı/, "a pattern is a file name, never a path");
  identity.pattern = "desen-bursa-sekiz-yildiz.svg";
  await writeFile(path, JSON.stringify(manifest));
  const dryRun = await importDemoContent(path, root, false, {});
  assert.deepEqual([dryRun.objects, dryRun.presentPhotos, dryRun.sampleTraces, dryRun.applied], [5, 7, 14, false]);
  for (let i = 0; i < 2; i++) assert.equal((await importDemoContent(path, root, true, env)).objects, 5);
  const served = async () => (await ctx.app.inject({ url: "/v1/cities" })).json().items as Array<{ id: string; siteCount: number } & Record<string, unknown>>;
  const city = (await served()).find((c) => c.id === "bursa")!;
  assert.deepEqual(city.scene, scene, "the city record's scene is served with the city, without the identity stored beside it");
  assert.deepEqual(city.identity, identity, "the identity comes back as the record says");
  assert.deepEqual([city.isDefault, city.map, city.inventory], [true, bursa.map, bursa.inventory]);
  assert.deepEqual((await served()).find((c) => c.id === "konya"), { ...konya, siteCount: 0, routeCount: 0 }, "a city without sites is listed, with its identity and no scene");
  assert.deepEqual((await served()).find((c) => c.id === "hatay"), { ...hatay, siteCount: 0, routeCount: 0 }, "a city with neither stays null for both");
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
  assert.equal(detail.displayOrder, 3, "eser.json sira is written on insert");
  const orderOf = async (id: string) => (await ctx.app.inject({ url: `/v1/sites/${id}` })).json().displayOrder;
  assert.deepEqual([await orderOf("test-1"), await orderOf("test-2"), await orderOf("test-3")], [1, 1, null], "ties are allowed; absent is null");
  assert.equal(detail.historyImages[0].dateLabel, "1900");
  assert.equal(detail.media.find((m: { id: string }) => m.id === "archive-0").description, "Fotoğrafçı · Arşiv");
  assert.deepEqual(detail.photoIds, ["photo-0"]);
  // The archive photograph's present-day pair and the team's samples come back credited as the files say (credit line and
  // licence word for word) with their angle words; none of them is a gallery photograph.
  assert.deepEqual([detail.historyImages[0].presentMediaId, detail.historyImages[0].presentAngleMatch], ["present-0", "near"]);
  const mediaOf = (id: string) => detail.media.find((m: { id: string }) => m.id === id);
  assert.deepEqual([mediaOf("present-0").description, mediaOf("present-0").license, mediaOf("present-0").alt, mediaOf("present-0").trust],
    ["Fotoğraf: Proje arşivi", "Proje için verildi; kullanılabilir.", "Bugünkü görünüm: Eski eser", "verified"]);
  assert.deepEqual(detail.sampleTraces, [
    { id: "iz-0-1", author: "AKAR ekibi", text: "Aynı eksen, bugünden.", mediaId: "iz-0-1", historyImageId: "archive-0", angleMatch: "same", addedOn: "2026-10-28" },
    { id: "iz-0-2", author: "AKAR ekibi", text: "Avludan bir kare.", mediaId: "iz-0-2", historyImageId: null, angleMatch: null, addedOn: "2026-10-29" },
  ]);
  assert.deepEqual([mediaOf("iz-0-1").description, mediaOf("iz-0-1").license, mediaOf("iz-0-1").trust],
    ["Fotoğraf: Proje arşivi (örnek katkı olarak gösteriliyor)", "Proje için verildi; kullanılabilir.", "representative"]);
  assert.deepEqual(detail.photoIds, ["photo-0"], "present-day and sample photographs are not gallery photographs");
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
  // A reimport changes the order, and a removed `sira` resets it to unranked.
  sites[0]!.displayOrder = 2;
  sites[1]!.displayOrder = null;
  await writeFile(path, JSON.stringify(manifest));
  await importDemoContent(path, root, true, env);
  assert.deepEqual([await orderOf("test-0"), await orderOf("test-1")], [2, null]);
  // The first site's `sira` is gone from the manifest altogether (not null).
  await writeFile(path, JSON.stringify({ ...manifest, sites: sites.map(({ displayOrder, ...rest }, i) => (i === 0 ? rest : { displayOrder, ...rest })) }));
  await importDemoContent(path, root, true, env);
  assert.equal(await orderOf("test-0"), null, "no sira in the manifest clears the stored value");
  sites[0]!.displayOrder = 3;
  sites[1]!.displayOrder = 1;
  // A reimport brings the samples and the present-day pair to the manifest: a vanished sample is gone, a vanished pair clears its angle word.
  sites[0]!.sampleTraces.pop();
  sites[0]!.historyImages[0]!.present = null;
  await writeFile(path, JSON.stringify(manifest));
  await importDemoContent(path, root, true, env);
  const slim = (await ctx.app.inject({ url: "/v1/sites/test-0" })).json();
  assert.deepEqual([slim.historyImages[0].presentMediaId, slim.historyImages[0].presentAngleMatch], [null, null]);
  assert.deepEqual(slim.sampleTraces.map((t: { id: string; historyImageId: string | null }) => [t.id, t.historyImageId]), [["iz-0-1", "archive-0"]]);
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
  // The panel owns the part cards of a site already in the database (§11.52): a repeat import keeps its edits, --replace-part-cards restores the manifest's.
  const titles = async (siteId: string) => (await db.select({ title: sitePartCards.title }).from(sitePartCards).where(eq(sitePartCards.siteId, siteId))).map((c) => c.title);
  await db.update(sitePartCards).set({ title: "Panelde düzeltildi" }).where(eq(sitePartCards.siteId, "test-0"));
  await db.delete(sitePartCards).where(eq(sitePartCards.siteId, "test-1"));
  await writeFile(path, JSON.stringify(manifest));
  assert.deepEqual((await importDemoContent(path, root, true, env)).partCardsKept?.length, 7);
  assert.deepEqual([await titles("test-0"), await titles("test-1")], [["Panelde düzeltildi"], []]);
  assert.deepEqual((await importDemoContent(path, root, true, env, { replacePartCards: true })).partCardsKept, []);
  assert.deepEqual([await titles("test-0"), await titles("test-1")], [["Kubbe"], ["Kubbe"]]);
  // Present-day photographs and samples: a missing credit line or licence, an unknown angle word, a date that is not a day, an archive
  // photograph of another site or an id another photograph already has stops the import before anything is written.
  const attempt = async (record: Record<string, unknown>, change: Record<string, unknown>, expected: RegExp) => {
    const before = { ...record };
    Object.assign(record, change);
    await writeFile(path, JSON.stringify(manifest));
    await assert.rejects(importDemoContent(path, root, false, {}), expected);
    Object.assign(record, before);
  };
  const present1 = sites[1]!.historyImages[0]!.present!, trace1 = sites[1]!.sampleTraces[0]!;
  await attempt(present1, { credit: "  " }, /Photograph without credit line, licence or description: test-1 present-1/);
  await attempt(present1, { angleMatch: "far" }, /Unknown angle match: test-1 present-1/);
  await attempt(trace1, { license: "" }, /Photograph without credit line, licence or description: test-1 iz-1-1/);
  await attempt(trace1, { angleMatch: "far" }, /Unknown angle match: test-1 iz-1-1/);
  await attempt(trace1, { addedOn: "28 Ekim" }, /Sample trace date is not YYYY-MM-DD: test-1 iz-1-1/);
  await attempt(trace1, { historyImageId: "archive-0" }, /Sample trace names no archive photograph of the site: test-1 iz-1-1 archive-0/);
  await attempt(trace1, { id: "iz-0-1" }, /Media id used twice: iz-0-1/);
  await attempt(trace1, { id: "photo-1" }, /Media id used twice: photo-1/);
  // `sira` must be a whole number from 1 up (or absent): 0, 1.5 and "2" stop the import before anything is written.
  for (const bad of [0, 1.5, "2", -1]) {
    await attempt(sites[1]!, { displayOrder: bad }, /Site test-1: displayOrder must be an integer of at least 1/);
  }
  // A photo-only site (no 3D model, no archive) in a city of its own: published without a model row; a part name stops it, as does a short manifest.
  const photoOnly = {
    id: "photo-only", name: "Fotoğraflı eser", city: "Konya", district: "Selçuklu", year: "", architect: "—", kind: "egitim", displayOrder: null,
    coordinates: [32.49, 37.87], minutes: 1, description: "Kaynaklı içerik", status: "published", tier: "Tier 2", source: "Konya envanteri", stories: [],
    sources: [{ id: "source-photo-only", title: "Envanter", kind: "book", author: "", year: "", page: "", url: "", trust: "verified" }],
    photos: [{ id: "photo-only-1", file: "photo.jpg", src: "", alt: "Avlu", title: "Avlu", titleEn: "", description: "", license: "Proje izni", trust: "verified", sourceId: "source-photo-only", galleryPosition: 1 }],
    coverPhotoId: "photo-only-1", historyImages: [], sampleTraces: [], sections: [], chapters: [], bookPhotos: [], aboutCoverPhotoId: null, partCards: [],
    tasks: [{ id: "task-photo-only", kind: "quiz", title: "Soru", prompt: "Hangisi?", photoId: "photo-only-1", part: null as string | null, source: null, trust: "verified", correctIndex: 0,
      details: { options: ["A", "B"], hints: [], correctText: "A doğru", wrongText: "Tekrar dene", fromHome: true } }],
    badges: [{ id: "badge-photo-only", title: "Hikâye", text: "Dinledin", condition: "story", taskId: null, onSiteLabel: false }],
  };
  await writeFile(path, JSON.stringify({ ...manifest, sites: [...sites, photoOnly] }));
  assert.equal((await importDemoContent(path, root, true, env)).sites, 8);
  const photoSite = (await ctx.app.inject({ url: "/v1/sites/photo-only" })).json();
  assert.deepEqual(photoSite.media.map((m: { kind: string }) => m.kind), ["photo"], "a photo-only site has no model row");
  assert.deepEqual(photoSite.historyImages, []);
  assert.equal((await served()).find((c) => c.id === "konya")!.siteCount, 1);
  photoOnly.tasks[0]!.part = "kubbe_1";
  await writeFile(path, JSON.stringify({ ...manifest, sites: [...sites, photoOnly] }));
  await assert.rejects(importDemoContent(path, root, false, {}), /Task part is not a model part: photo-only task-photo-only kubbe_1/);
  await writeFile(path, JSON.stringify({ ...manifest, sites: sites.slice(0, 6) }));
  await assert.rejects(importDemoContent(path, root, false, {}), /at least seven sites/);
  sites[0]!.name = "Must roll back";
  sites[6]!.sections = [{ id: "bad", kind: "history", title: "bad", body: "bad", sourceId: "missing", trust: "verified", chapterId: null, photos: [] }];
  await writeFile(path, JSON.stringify(manifest));
  await assert.rejects(importDemoContent(path, root, true, env));
  assert.equal((await ctx.app.inject({ url: "/v1/sites/test-0" })).json().name, "Eser 0");
});
