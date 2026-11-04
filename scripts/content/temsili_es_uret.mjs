// «Bugün» canlandırmalarını Geçmişi Gör'e aktarır (4 Kasım 2026). Kaynak: gorsel-uretim/bugun-temsili/LISTE.csv ve PNG'ler (repoda
// değil). Her satır için eserin gecmisi-gor/bugun/ klasörüne webp yazar, bugunku-esler.json'a `temsili: true` kaydı ekler.
// Bunlar yapay zekâ ile üretilmiş görsellerdir, fotoğraf değildir: uygulama «Temsili görsel» diye gösterir.
// Kullanım: node scripts/content/temsili_es_uret.mjs <bugun-temsili klasörü>
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
const sharp = createRequire(import.meta.url)("sharp");
const kaynak = process.argv[2];
const eserler = new URL("../../docs/documents-context/eserler/", import.meta.url).pathname;
const satirlar = (metin) => {
  const sonuc = [];
  for (const satir of metin.replace(/^﻿/, "").trim().split(/\r?\n/)) {
    const hucre = [];
    let simdi = "", tirnak = false;
    for (const c of satir) {
      if (c === '"') tirnak = !tirnak;
      else if (c === "," && !tirnak) { hucre.push(simdi); simdi = ""; }
      else simdi += c;
    }
    hucre.push(simdi);
    sonuc.push(hucre);
  }
  const [bas, ...kalan] = sonuc;
  return kalan.map((h) => Object.fromEntries(bas.map((b, i) => [b, h[i]])));
};
for (const s of satirlar(readFileSync(join(kaynak, "LISTE.csv"), "utf8"))) {
  const id = Number(s.fotoAtlasId);
  const klasor = join(eserler, s.eser, "gecmisi-gor");
  mkdirSync(join(klasor, "bugun"), { recursive: true });
  const yol = join(klasor, "bugunku-esler.json");
  const veri = existsSync(yol) ? JSON.parse(readFileSync(yol, "utf8")) : { _aciklama: "Eski fotoğrafların bugünkü eşleri. temsili: true olanlar yapay zekâ ile üretilmiş canlandırmadır, fotoğraf değildir.", esler: [] };
  if (veri.esler.some((e) => e.fotoAtlasId === id && !e.temsili)) continue;
  const girdi = join(kaynak, s.cikti);
  const buyuk = await sharp(girdi).resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toFile(join(klasor, `bugun/es-${id}.webp`));
  await sharp(girdi).resize({ width: 320, height: 320, fit: "inside" }).webp({ quality: 70 }).toFile(join(klasor, `bugun/es-${id}_k.webp`));
  const kayit = {
    fotoAtlasId: id, gorsel: `bugun/es-${id}.webp`, kucuk: `bugun/es-${id}_k.webp`, genislik: buyuk.width, yukseklik: buyuk.height,
    aciBenzerligi: "yakin", temsili: true, guven: s["guven(orta/dusuk)"],
    aciNotu: "Yapay zekâ ile üretilmiş canlandırma; eski fotoğrafla birebir örtüşmez, güncel fotoğraflara göre çizildi.",
    kaynakSatiri: "Temsili canlandırma, yapay zekâ ile üretildi; gerçek fotoğraf değildir",
    lisans: "AKAR ekibi üretimi. Eski fotoğraf ve güncel fotoğraflar referans alındı.",
    ekleyen: "AKAR ekibi", eklendi: "2026-11-04",
  };
  veri.esler = [...veri.esler.filter((e) => e.fotoAtlasId !== id), kayit];
  writeFileSync(yol, JSON.stringify(veri, null, 2) + "\n");
  console.log(s.eser, id, `${buyuk.width}×${buyuk.height}`, Math.round(buyuk.size / 1024) + " KB");
}
