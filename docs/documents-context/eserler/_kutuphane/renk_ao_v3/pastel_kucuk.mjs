// Bir kerelik geçiş işiydi; kaynak artık Blender + malzeme-paleti.json (_kutuphane/blend_hat/). Yeniden kullanma.
// AKAR · pastel_kucuk (28–29 Ekim 2026): fotoğraf renkli sürümden 21 Ekim pastel renklerine dönüş; pişmiş AO kalır ve küçülür; Yer_Golgesi çıkar.
// İş emri: design/test-redmi9t-v2/_promptlar/PROMPT_eski_renk_ao_kucuk_7_eser.md
//  - Renk: referans (pastel) GLB'deki AYNI ADLI malzemenin baseColorFactor'ı ve baseColorTexture resmi kopyalanır. Kodda renk yok; kaynak referans dosyası.
//    Referansta köşe rengi (COLOR_0) gri ise (R=G=B ±0,02) o AO'dur; pişmiş AO yerini aldığı için çarpılmaz. Renkliyse ortalaması malzemeye çarpılır.
//  - AO: mevcut occlusionTexture; ~1 px bulanık, <px> boyuta küçültülür, tek kanal JPEG q80. UV_AO (TEXCOORD_1) ve texCoord = 1 aynen.
//  - Yer_Golgesi düğümü, mesh'i, malzemesi, dokusu silinir; KHR_materials_unlit kullanılmıyorsa düşer.
//  - Geometri yeniden üretilmez (Draco ile yeniden yazılır); denetim: üçgen/köşe/sınır kutusu girdiyle eşit.
// Kullanım: GT_DIR=<kurulum> node pastel_kucuk.mjs <girdi.glb> <referans.glb> <cikti.glb> <ao_px> <rapor.json>
import { createRequire } from 'module'; import path from 'path'; import fs from 'fs';
const require = createRequire(path.join(process.env.GT_DIR, 'x.js'));
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS, KHRDracoMeshCompression } = require('@gltf-transform/extensions');
const { prune } = require('@gltf-transform/functions');
const draco3d = require('draco3dgltf'); const sharp = require('sharp');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(), 'draco3d.encoder': await draco3d.createEncoderModule() });
const [girdi, refYol, cikti, aoPx, raporYol] = process.argv.slice(2);
const GOLGE = 'Yer_Golgesi';
const lin = v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const srgb = v => (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.min(1, v) ** (1 / 2.4) - 0.055);
const hex = c => '#' + c.slice(0, 3).map(v => Math.round(srgb(Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();

async function dokuOrtanca(t) {   // doğrusal
  const { data, info } = await sharp(Buffer.from(t.getImage())).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const k = [[], [], []]; for (let i = 0; i < data.length; i += info.channels) for (let c = 0; c < 3; c++) k[c].push(data[i + c]);
  return k.map(a => { a.sort((x, y) => x - y); return lin(a[a.length >> 1] / 255); });
}
async function gorunen(m) { const f = m.getBaseColorFactor(); const t = m.getBaseColorTexture(); const o = t ? await dokuOrtanca(t) : [1, 1, 1]; return [0, 1, 2].map(i => f[i] * o[i]); }
function geo(doc) {
  const o = {};
  for (const n of doc.getRoot().listNodes()) {
    const me = n.getMesh(); if (!me) continue; const W = n.getWorldMatrix(); const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; let v = 0, t = 0; const e = [];
    for (const p of me.listPrimitives()) {
      const a = p.getAttribute('POSITION'); v += a.getCount(); t += (p.getIndices() ? p.getIndices().getCount() : a.getCount()) / 3;
      for (let i = 0; i < a.getCount(); i++) { a.getElement(i, e); const w = [0, 1, 2].map(q => W[q] * e[0] + W[4 + q] * e[1] + W[8 + q] * e[2] + W[12 + q]); for (let q = 0; q < 3; q++) { mn[q] = Math.min(mn[q], w[q]); mx[q] = Math.max(mx[q], w[q]); } }
    }
    o[n.getName()] = { v, t, mn, mx };
  }
  return o;
}
// referans: malzeme → köşe rengi ortalaması (renk/gri)
const ref = await io.read(refYol); const R = ref.getRoot();
const vc = {};
for (const me of R.listMeshes()) for (const p of me.listPrimitives()) {
  const c = p.getAttribute('COLOR_0'), m = p.getMaterial(); if (!c || !m) continue;
  const s = vc[m.getName()] ||= { t: [0, 0, 0], n: 0 }; const e = [];
  for (let i = 0; i < c.getCount(); i++) { c.getElement(i, e); for (let q = 0; q < 3; q++) s.t[q] += e[q]; s.n++; }
}
const refMat = new Map(R.listMaterials().map(m => [m.getName(), m]));

const doc = await io.read(girdi); const G = doc.getRoot();
const geoOnce = geo(doc);
const rapor = { girdi: path.basename(girdi), referans: path.basename(refYol), renk: {}, yalniz_yenide: [], yalniz_referansta: [], kose_rengi: {}, sorun: [] };
// 1) renk
for (const m of G.listMaterials()) {
  const ad = m.getName(); if (ad === GOLGE) continue;
  const r = refMat.get(ad); if (!r) { rapor.yalniz_yenide.push(ad); continue; }
  const eski = hex(await gorunen(m));
  const f = r.getBaseColorFactor().slice();
  const v = vc[ad]; let vcNot = 'yok';
  if (v) {
    const ort = v.t.map(x => x / v.n); const gri = Math.max(...ort) - Math.min(...ort) <= 0.02;
    vcNot = gri ? `gri ${ort[0].toFixed(3)} (AO; çarpılmadı)` : `renkli ${ort.map(x => x.toFixed(3)).join('/')} (malzemeye çarpıldı)`;
    if (!gri) for (let q = 0; q < 3; q++) f[q] *= ort[q];
  }
  rapor.kose_rengi[ad] = vcNot;
  m.setBaseColorFactor(f);
  const rt = r.getBaseColorTexture();
  if (rt) {
    const t = doc.createTexture(rt.getName()).setImage(rt.getImage().slice()).setMimeType(rt.getMimeType()).setURI(rt.getURI());
    const info = r.getBaseColorTextureInfo(); m.setBaseColorTexture(t);
    m.getBaseColorTextureInfo().setTexCoord(info.getTexCoord()).setWrapS(info.getWrapS()).setWrapT(info.getWrapT()).setMagFilter(info.getMagFilter()).setMinFilter(info.getMinFilter());
  } else if (m.getBaseColorTexture()) m.setBaseColorTexture(null);
  const yeni = hex(await gorunen(m)), hedef = hex(await gorunen(r).then(g => v && !rapor.kose_rengi[ad].startsWith('gri') ? g.map((x, q) => x * v.t[q] / v.n) : g));
  const fark = Math.max(...[1, 3, 5].map(i => Math.abs(parseInt(yeni.slice(i, i + 2), 16) - parseInt(hedef.slice(i, i + 2), 16))));
  rapor.renk[ad] = { kaynak: `${path.basename(refYol)} / ${ad}`, foto_surumu: eski, referans: hedef, yeni, fark_ton: fark };
  if (fark > 2) rapor.sorun.push(`${ad}: renk farkı ${fark}`);
}
for (const ad of refMat.keys()) if (!G.listMaterials().some(m => m.getName() === ad)) rapor.yalniz_referansta.push(ad);
// 2) Yer_Golgesi
for (const n of G.listNodes()) if (n.getName() === GOLGE) { const me = n.getMesh(); n.dispose(); me?.dispose(); rapor.yer_golgesi = 'silindi'; }
// 3) AO küçült
const aoTex = new Set(); for (const m of G.listMaterials()) if (m.getOcclusionTexture()) aoTex.add(m.getOcclusionTexture());
rapor.ao = [];
for (const t of aoTex) {
  const once = t.getImage().byteLength; const px = +aoPx;
  const jpg = await sharp(Buffer.from(t.getImage())).greyscale().blur(1).resize(px, px, { kernel: 'lanczos3' }).toColourspace('b-w').jpeg({ quality: 80 }).toBuffer();
  const meta = await sharp(jpg).metadata();
  t.setImage(new Uint8Array(jpg)).setMimeType('image/jpeg');
  rapor.ao.push({ ad: t.getName(), once_kb: Math.round(once / 1024), sonra_kb: Math.round(jpg.length / 1024), px, kanal: meta.channels });
}
await doc.transform(prune({ keepLeaves: true, keepAttributes: true }));
const kullan = G.listMaterials().some(m => m.getExtension('KHR_materials_unlit'));
if (!kullan) for (const e of G.listExtensionsUsed()) if (e.extensionName === 'KHR_materials_unlit') e.dispose();
const ext = G.listExtensionsUsed().find(e => e.extensionName === 'KHR_draco_mesh_compression') || doc.createExtension(KHRDracoMeshCompression);
ext.setRequired(true).setEncoderOptions({ method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER, quantizationBits: { POSITION: 14, NORMAL: 10, COLOR: 8, TEX_COORD: 12, GENERIC: 12 } });
await io.write(cikti, doc);
// 4) denetim
const son = await io.read(cikti); const geoSon = geo(son);
for (const [ad, g] of Object.entries(geoOnce)) {
  if (ad === GOLGE) continue; const s = geoSon[ad];
  if (!s) { rapor.sorun.push(`eksik parça ${ad}`); continue; }
  const fark = Math.max(...[0, 1, 2].flatMap(q => [Math.abs(s.mn[q] - g.mn[q]), Math.abs(s.mx[q] - g.mx[q])]));
  if (s.t !== g.t) rapor.sorun.push(`${ad}: üçgen ${g.t} → ${s.t}`); if (fark > 0.01) rapor.sorun.push(`${ad}: kutu farkı ${(fark * 1000).toFixed(0)} mm`);
}
if (geoSon[GOLGE]) rapor.sorun.push('Yer_Golgesi duruyor');
for (const m of son.getRoot().listMaterials()) { const oi = m.getOcclusionTextureInfo(); if (oi && oi.getTexCoord() !== 1) rapor.sorun.push(`${m.getName()}: texCoord ${oi.getTexCoord()}`); }
rapor.parca = Object.keys(geoSon).length;
rapor.uzanti = son.getRoot().listExtensionsUsed().map(e => e.extensionName);
rapor.resimler_kb = son.getRoot().listTextures().map(t => [t.getName(), Math.round(t.getImage().byteLength / 1024)]);
rapor.boyut_kb = { girdi: Math.round(fs.statSync(girdi).size / 1024), referans: Math.round(fs.statSync(refYol).size / 1024), cikti: Math.round(fs.statSync(cikti).size / 1024) };
fs.writeFileSync(raporYol, JSON.stringify(rapor, null, 1));
console.log(path.basename(cikti), rapor.boyut_kb, 'renk', Object.keys(rapor.renk).length, 'sorun', rapor.sorun, 'yalnız yenide', rapor.yalniz_yenide, 'yalnız ref', rapor.yalniz_referansta, 'AO', JSON.stringify(rapor.ao));
