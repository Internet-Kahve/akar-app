import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

// `scripts/history_extras.py` turns the `gecmisi-gor/` files of one eser into manifest fields (§11.47). The real files
// are not in CI, so the reader is exercised here on small fixtures.
const scripts = fileURLToPath(new URL("../../scripts/", import.meta.url));
let root: string;
before(async () => { root = await mkdtemp(join(tmpdir(), "akar-history-extras-")); });
after(async () => { await rm(root, { recursive: true, force: true }); });

const CODE = `
import json, sys
sys.path.insert(0, sys.argv[1])
import history_extras
from pathlib import Path
history = {int(k): dict(v) for k, v in json.loads(sys.argv[3]).items()}
traces, skipped = history_extras.read_extras(Path(sys.argv[2]), 'eserler/x/gecmisi-gor', 'site', history)
print(json.dumps({'history': history, 'traces': traces, 'skipped': skipped}, ensure_ascii=False))
`;
const archive = { 1: { id: "site-archive-1", caption: "Eski bir" }, 2: { id: "site-archive-2", caption: "Eski iki" } };

type Run = { history: Record<string, { id: string; present: Record<string, unknown> | null }>; traces: Array<Record<string, unknown>>; skipped: number };
let folderNo = 0;
/** Writes a `gecmisi-gor/` folder (the JSON files given, an image at every path in `images`) and runs the reader on it. */
async function read(files: { pairs?: unknown; traces?: unknown; images?: string[] }): Promise<Run> {
  const folder = join(root, `eser-${folderNo++}`);
  await mkdir(folder, { recursive: true });
  if (files.pairs !== undefined) await writeFile(join(folder, "bugunku-esler.json"), JSON.stringify({ esler: files.pairs }));
  if (files.traces !== undefined) await writeFile(join(folder, "izler.json"), JSON.stringify({ izler: files.traces }));
  for (const image of files.images ?? []) {
    await mkdir(dirname(join(folder, image)), { recursive: true });
    await writeFile(join(folder, image), "x");
  }
  const run = spawnSync("python3", ["-c", CODE, scripts, folder, JSON.stringify(archive)], { encoding: "utf8" });
  if (run.status !== 0) throw new Error(run.stderr.trim().split("\n").at(-1));
  return JSON.parse(run.stdout) as Run;
}

const CREDIT = "Fotoğraf: Bursa Vakıf Eserleri Envanteri";
const LICENSE = "Vakıf Katılım, arşiv (zip -016). Proje için verildi; kullanılabilir.";
const pair = (extra: Record<string, unknown> = {}) => ({ fotoAtlasId: 1, gorsel: "bugun/es-1.webp", aciBenzerligi: "yakin", kaynakSatiri: CREDIT, lisans: LICENSE, ...extra });
const trace = (extra: Record<string, unknown> = {}) => ({
  id: "iz-x-001", kullanici: "AKAR ekibi", ornek: true, metin: "Aynı eksen.", gorsel: "izler/iz-x-001.webp", durum: "onaylandi", tarih: "2026-10-28",
  ayniAciFotoAtlasId: 2, aciBenzerligi: "ayni", kaynakSatiri: `${CREDIT} (örnek katkı olarak gösteriliyor)`, lisans: LICENSE, ...extra,
});

test("a present-day pair is matched to its archive photograph by Foto Atlas id and keeps its credit line and licence word for word", async () => {
  const out = await read({ pairs: [pair()], images: ["bugun/es-1.webp"] });
  assert.deepEqual(out.history["1"]!.present, {
    id: "site-present-1", alt: "Bugünkü görünüm: Eski bir", angleMatch: "near", file: "eserler/x/gecmisi-gor/bugun/es-1.webp", credit: CREDIT, license: LICENSE,
  });
  assert.equal(out.history["2"]!.present, null, "an archive photograph without a pair stays without one");
  assert.deepEqual(out.traces, []);
  assert.equal((await read({ pairs: [pair({ aciBenzerligi: "ayni" })], images: ["bugun/es-1.webp"] })).history["1"]!.present!.angleMatch, "same");
});

test("only approved team samples are read; a real contribution or a pending one is skipped and counted", async () => {
  const out = await read({
    traces: [trace(), trace({ id: "iz-x-002", ornek: false }), trace({ id: "iz-x-003", durum: "bekliyor" }), trace({ id: "iz-x-004", ornek: "evet" })],
    images: ["izler/iz-x-001.webp"],
  });
  assert.deepEqual(out.traces, [{
    id: "iz-x-001", author: "AKAR ekibi", text: "Aynı eksen.", alt: "Aynı eksen.", addedOn: "2026-10-28", historyImageId: "site-archive-2", angleMatch: "same",
    file: "eserler/x/gecmisi-gor/izler/iz-x-001.webp", credit: `${CREDIT} (örnek katkı olarak gösteriliyor)`, license: LICENSE,
  }]);
  assert.equal(out.skipped, 3);
});

test("a sample of no archive photograph carries no angle word; a folder without the files has no pairs and no samples", async () => {
  const free = await read({ traces: [trace({ ayniAciFotoAtlasId: undefined, aciBenzerligi: undefined })], images: ["izler/iz-x-001.webp"] });
  assert.deepEqual([free.traces[0]!.historyImageId, free.traces[0]!.angleMatch], [null, null]);
  const none = await read({});
  assert.deepEqual([none.traces, none.skipped, none.history["1"]!.present, none.history["2"]!.present], [[], 0, null, null]);
});

test("a pair or sample that cannot be shown honestly stops the import", async () => {
  const withImage = { images: ["bugun/es-1.webp", "izler/iz-x-001.webp"] };
  await assert.rejects(read({ pairs: [pair({ fotoAtlasId: 99 })], ...withImage }), /Present-day pair names no archive photograph: eserler\/x\/gecmisi-gor 99/);
  await assert.rejects(read({ pairs: [pair(), pair()], ...withImage }), /Two present-day pairs for one archive photograph: eserler\/x\/gecmisi-gor 1/);
  await assert.rejects(read({ pairs: [pair()] }), /Missing image: eserler\/x\/gecmisi-gor\/bugun\/es-1.webp/);
  await assert.rejects(read({ pairs: [pair({ kaynakSatiri: " " })], ...withImage }), /Missing kaynakSatiri: eserler\/x\/gecmisi-gor 1/);
  await assert.rejects(read({ pairs: [pair({ lisans: undefined })], ...withImage }), /Missing lisans: eserler\/x\/gecmisi-gor 1/);
  await assert.rejects(read({ pairs: [pair({ aciBenzerligi: undefined })], ...withImage }), /Unknown aciBenzerligi None: eserler\/x\/gecmisi-gor 1/);
  await assert.rejects(read({ pairs: [pair({ aciBenzerligi: "uzak" })], ...withImage }), /Unknown aciBenzerligi 'uzak'/);
  await assert.rejects(read({ traces: [trace({ ayniAciFotoAtlasId: 99 })], ...withImage }), /Sample trace names no archive photograph: eserler\/x\/gecmisi-gor iz-x-001 99/);
  await assert.rejects(read({ traces: [trace({ aciBenzerligi: undefined })], ...withImage }), /Unknown aciBenzerligi None: eserler\/x\/gecmisi-gor iz-x-001/);
  await assert.rejects(read({ traces: [trace({ kaynakSatiri: undefined })], ...withImage }), /Missing kaynakSatiri: eserler\/x\/gecmisi-gor iz-x-001/);
  await assert.rejects(read({ traces: [trace({ tarih: undefined })], ...withImage }), /Missing tarih: eserler\/x\/gecmisi-gor iz-x-001/);
  await assert.rejects(read({ traces: [trace({ kullanici: "" })], ...withImage }), /Missing kullanici: eserler\/x\/gecmisi-gor iz-x-001/);
  await assert.rejects(read({ traces: [trace()] }), /Missing image: eserler\/x\/gecmisi-gor\/izler\/iz-x-001.webp/);
});
