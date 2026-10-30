import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../../scripts/prepare-demo-content.py", import.meta.url));

test("content preparation refuses draft task files without replacing an existing manifest", async () => {
  const root = await mkdtemp(join(tmpdir(), "akar-task-drafts-"));
  try {
    const tasks = join(root, "eserler/koza-han/icerik");
    await mkdir(tasks, { recursive: true });
    const reader = join(root, "design/test-redmi9t-v2");
    await mkdir(reader, { recursive: true });
    await writeFile(join(reader, "hazirla.py"), "def eserleri_bul():\n    return []\n");
    const output = join(root, "manifest.json");
    await writeFile(output, "previous reviewed manifest");
    for (const flag of [true, "true", "false", null, 0]) {
      await writeFile(join(tasks, "gorevler.json"), JSON.stringify({ _taslak: flag, gorevler: [], rozetler: [] }));
      const run = spawnSync("python3", [script, "--content", root, "--output", output], { encoding: "utf8" });
      assert.notEqual(run.status, 0);
      assert.match(run.stderr, /Unreviewed task file:.*koza-han/);
      assert.equal(await readFile(output, "utf8"), "previous reviewed manifest");
    }
    // Minimal approved package: no source archive is required in CI.
    for (const data of [{ gorevler: [], rozetler: [] }, { _taslak: false, gorevler: [], rozetler: [] }]) {
      await writeFile(join(tasks, "gorevler.json"), JSON.stringify(data));
      const run = spawnSync("python3", [script, "--content", root, "--output", output], { encoding: "utf8" });
      assert.equal(run.status, 0, run.stderr);
      assert.equal(JSON.parse(await readFile(output, "utf8")).version, 1);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

// The readers of the real prototype live in the source archive, which CI leaves out; this one hands back a photo-only site.
const photoOnlyReader = `
SITE = dict(id='medrese', ad='Medrese', il='Konya', ilce='Selçuklu', tur='Medrese', rol='egitim', yil='', yaptiran='', kisa='Kısa', lat=37.8, lon=32.4, hakkinda_kapak='kitap/s1-01.jpg')
def story(no):
    return dict(no=no, metin='Cümle', foto='kitap/s1-01.jpg', kart=False, vurgu=[], kaynak='Kitap', guven='Doğrulanmış', ic=False, aci=None)
def eserleri_bul():
    return [SITE]
def oku(path):
    return ''
def ham(text):
    return text
def tablo(text, head):
    return [['kitap/s1-01.jpg', '', '1', 'Avlu', 'Kısa', 'Alt', 'Kitap', 'Proje izni', 'Doğrulanmış']]
def kaynak_bicim(text):
    return text
def hikaye_oku(folder):
    return [story(1), dict(story(2), rota=True)]
def hakkinda_oku(folder):
    return []
def okuma_oku(folder, headings):
    return []
def parcalar_oku(folder):
    return []
def model_oku(folder):
    return None
`;

test("content preparation reads a photo-only site from its own city", async () => {
  const root = await mkdtemp(join(tmpdir(), "akar-photo-only-"));
  try {
    const reader = join(root, "design/test-redmi9t-v2"), photos = join(root, "eserler/medrese/icerik/foto/kitap"), cities = join(root, "veri/sehir");
    for (const dir of [reader, photos, cities, join(root, "design/desenler")]) await mkdir(dir, { recursive: true });
    await writeFile(join(reader, "hazirla.py"), photoOnlyReader);
    await writeFile(join(photos, "s1-01.jpg"), "photo");
    await writeFile(join(root, "design/desenler/desen.svg"), "<svg/>");
    const scene = { sahne_ust: "#DDE4E5", sahne_alt: "#A7B4B7" };
    const city = (id: string, ad: string, rest: object) => writeFile(join(cities, `${id}.json`), JSON.stringify({ id, ad, envanter_adi: `${ad} Vakıf Eserleri`, ...rest }));
    // The record dropped ortam, gunes and dolgu with the prototype's new light.
    await city("konya", "Konya", { harita_isik: { yon: 220.6, yukseklik: 50, doygunluk: 1, yer_golgesi: 0.18 }, kimlik: { ...scene, zemin: "#3D8285", desen: "desen.svg", desen_renk: "#E8DD7A" } });
    // A city with its colours but no pattern yet.
    await city("hatay", "Hatay", { kimlik: { zemin: "#7A6340", desen_renk: "#DBCDB5" } });
    const output = join(root, "manifest.json");
    const prepare = () => spawnSync("python3", [script, "--content", root, "--output", output], { encoding: "utf8" });
    const run = prepare();
    assert.equal(run.status, 0, run.stderr);
    const { sites: [site], cities: records } = JSON.parse(await readFile(output, "utf8"));
    assert.deepEqual([site.city, site.district, site.kind, site.source], ["Konya", "Selçuklu", "egitim", "Konya Vakıf Eserleri · ekip tarafından hazırlanan kaynaklı içerik"]);
    assert.equal("model" in site, false);
    assert.deepEqual(site.historyImages, []);
    assert.deepEqual([site.photos[0].id, site.coverPhotoId, site.aboutCoverPhotoId], ["medrese-photo-s1-01", "medrese-photo-s1-01", "medrese-photo-s1-01"], "a kitap/ crop is a gallery photograph");
    assert.deepEqual(site.stories.map((s: { id: string }) => s.id), ["medrese-story-1"], "route-only sentences stay out of the story");
    const byId = Object.fromEntries(records.map((c: { id: string }) => [c.id, c]));
    assert.deepEqual(byId.konya.scene.light, { ambient: 2, sun: 1, fill: 1, azimuthDeg: 220.6, elevationDeg: 50, saturation: 1, groundShadow: 0.18 });
    assert.equal(byId.hatay.identity, null, "no pattern yet, no identity");
    // A pattern without its colours is a broken record, and so is a 3d/ folder without its model.json.
    await city("konya", "Konya", { kimlik: { desen: "desen.svg" } });
    assert.match(prepare().stderr, /kimlik needs zemin, desen and desen_renk together/);
    await city("konya", "Konya", {});
    await mkdir(join(root, "eserler/medrese/3d"));
    assert.match(prepare().stderr, /Missing 3d\/model\.json: medrese/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
