import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startTestApp, TEST_RECEIPT_SECRET } from "../test/harness.ts";
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
    historyImages: [{ id: `archive-${i}`, file: "photo.jpg", caption: "Eski eser", dateLabel: "1900", alt: "Eski görünüş", license: "CC BY-NC-ND", credit: "Fotoğrafçı · Arşiv", trust: "verified", sourceId: `source-${i}` }], sections: [] as unknown[],
    partCards: [{ id: `part-${i}`, parts: ["kubbe_1"], title: "Kubbe", body: "Kaynaklı metin", photoIds: [`detail-${i}`, `photo-${i}`], trust: "verified", sourceId: `source-${i}` }],
  }));
  const scene = { light: { ambient: 2, sun: 1, fill: 1, azimuthDeg: 315, elevationDeg: 45, saturation: 1.25, groundShadow: 0.18 }, backgroundTop: "#DDE4E5", backgroundBottom: "#A7B4B7" };
  const manifest = { version: 1, sites, routes: [], retireSiteIds: [], cities: [{ name: "Bursa", scene }] };
  const path = join(root, "manifest.json");
  scene.backgroundTop = "gri";
  await writeFile(path, JSON.stringify(manifest));
  await assert.rejects(importDemoContent(path, root, false, {}), /#RRGGBB/);
  scene.backgroundTop = "#DDE4E5";
  await writeFile(path, JSON.stringify(manifest));
  assert.equal((await importDemoContent(path, root, false, {})).objects, 2);
  for (let i = 0; i < 2; i++) assert.equal((await importDemoContent(path, root, true, env)).objects, 2);
  const city = (await ctx.app.inject({ url: "/v1/cities" })).json().items.find((c: { name: string }) => c.name === "Bursa");
  assert.deepEqual(city.scene, scene, "the city record's scene is served with the city");
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
  sites[1]!.partCards[0]!.parts = ["yok"];
  await writeFile(path, JSON.stringify(manifest));
  await assert.rejects(importDemoContent(path, root, false, {}), /not model parts: test-1 yok/);
  sites[1]!.partCards[0]!.parts = ["kubbe_1"];
  sites[0]!.name = "Must roll back";
  sites[6]!.sections = [{ id: "bad", kind: "history", title: "bad", body: "bad", sourceId: "missing", trust: "verified" }];
  await writeFile(path, JSON.stringify(manifest));
  await assert.rejects(importDemoContent(path, root, true, env));
  assert.equal((await ctx.app.inject({ url: "/v1/sites/test-0" })).json().name, "Eser 0");
});
