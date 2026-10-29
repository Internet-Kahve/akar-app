// AKAR · blend_hat doğrulama (29 Ekim 2026): iki GLB'yi karşılaştırır (ör. şimdiki teslim ↔ Blender çıktısı).
// a) malzeme adları  b) görünen renk (baseColorFactor × doku ortancası) ±1 ton  c) her mesh üçgen/köşe/sınır kutusu
// d) occlusionTexture.texCoord = 1, AO boyutu/kanalı, ortanca farkı ≤ 2/255  e) Yer_Golgesi ve (AO'lu primitive'de) COLOR_0 yok  f) boyut ±%5
// Kullanım: GT_DIR=<kurulum> node dogrula.mjs <simdiki.glb> <yeni.glb> <rapor.json>
import { createRequire } from 'module'; import path from 'path'; import fs from 'fs';
const require = createRequire(path.join(process.env.GT_DIR, 'x.js'));
const { NodeIO } = require('@gltf-transform/core'); const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const draco3d = require('draco3dgltf'); const sharp = require('sharp');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule() });
const [aYol, bYol, rYol] = process.argv.slice(2);
const lin = v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); const srgb = v => (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.min(1, v) ** (1 / 2.4) - 0.055);
async function ort(img, kanal = 3) { const { data, info } = await sharp(Buffer.from(img)).raw().toBuffer({ resolveWithObject: true }); const k = [...Array(Math.min(kanal, info.channels))].map(() => []);
  for (let i = 0; i < data.length; i += info.channels) for (let c = 0; c < k.length; c++) k[c].push(data[i + c]); return { med: k.map(a => { a.sort((x, y) => x - y); return a[a.length >> 1]; }), w: info.width, ch: info.channels }; }
async function oku(yol) {
  const d = await io.read(yol), r = d.getRoot(), o = { mat: {}, geo: {}, ao: [], golge: false, color0: 0, boyut: fs.statSync(yol).size };
  for (const m of r.listMaterials()) {
    const f = m.getBaseColorFactor(), t = m.getBaseColorTexture(); let c = f.slice(0, 3);
    if (t) { const { med } = await ort(t.getImage()); c = c.map((x, i) => x * lin((med[i] ?? med[0]) / 255)); }
    const oi = m.getOcclusionTextureInfo();
    o.mat[m.getName()] = { rgb: c.map(x => Math.round(srgb(x) * 255)), tc: oi ? oi.getTexCoord() : null };
  }
  for (const t of r.listTextures()) if (r.listMaterials().some(m => m.getOcclusionTexture() === t)) { const s = await ort(t.getImage(), 1); o.ao.push({ px: s.w, kanal: s.ch, ortanca: s.med[0], kb: Math.round(t.getImage().byteLength / 1024) }); }
  for (const n of r.listNodes()) {
    const me = n.getMesh(); if (!me) continue; if (n.getName().startsWith('Yer_Golgesi')) o.golge = true;
    const W = n.getWorldMatrix(), mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9], e = []; let v = 0, t = 0;
    for (const p of me.listPrimitives()) {
      if (p.getMaterial()?.getOcclusionTexture() && p.getAttribute('COLOR_0')) o.color0++;
      const a = p.getAttribute('POSITION'); v += a.getCount(); t += (p.getIndices() ? p.getIndices().getCount() : a.getCount()) / 3;
      for (let i = 0; i < a.getCount(); i++) { a.getElement(i, e); const w = [0, 1, 2].map(q => W[q] * e[0] + W[4 + q] * e[1] + W[8 + q] * e[2] + W[12 + q]); for (let q = 0; q < 3; q++) { mn[q] = Math.min(mn[q], w[q]); mx[q] = Math.max(mx[q], w[q]); } }
    }
    o.geo[n.getName()] = { v, t, mn, mx };
  }
  return o;
}
const A = await oku(aYol), B = await oku(bYol); const S = { a: [], b: [], c: [], d: [], e: [], f: [] };
const an = Object.keys(A.mat).sort(), bn = Object.keys(B.mat).sort();
if (JSON.stringify(an) !== JSON.stringify(bn)) S.a.push(`yalnız şimdikinde: ${an.filter(x => !bn.includes(x))}; yalnız yenide: ${bn.filter(x => !an.includes(x))}`);
let renkMax = 0;
for (const k of an) if (B.mat[k]) { const fk = Math.max(...A.mat[k].rgb.map((x, i) => Math.abs(x - B.mat[k].rgb[i]))); renkMax = Math.max(renkMax, fk); if (fk > 1) S.b.push(`${k}: ${A.mat[k].rgb} → ${B.mat[k].rgb}`); }
let kutuMax = 0, koseFark = 0;
for (const [k, g] of Object.entries(A.geo)) { const h = B.geo[k]; if (!h) { S.c.push(`eksik ${k}`); continue; }
  if (g.t !== h.t) S.c.push(`${k}: üçgen ${g.t} → ${h.t}`); if (g.v !== h.v) koseFark++;
  const f = Math.max(...[0, 1, 2].flatMap(q => [Math.abs(g.mn[q] - h.mn[q]), Math.abs(g.mx[q] - h.mx[q])])); kutuMax = Math.max(kutuMax, f); if (f > 0.01) S.c.push(`${k}: kutu ${(f * 1000).toFixed(0)} mm`); }
for (const k of Object.keys(B.geo)) if (!A.geo[k]) S.c.push(`fazla ${k}`);
for (const [k, m] of Object.entries(B.mat)) if (A.mat[k]?.tc === 1 && m.tc !== 1) S.d.push(`${k}: texCoord ${m.tc}`);
if (A.ao.length !== B.ao.length) S.d.push(`AO doku sayısı ${A.ao.length} → ${B.ao.length}`);
A.ao.forEach((x, i) => { const y = B.ao[i]; if (!y) return; if (x.px !== y.px || x.kanal !== y.kanal) S.d.push(`AO ${x.px}px/${x.kanal}k → ${y.px}px/${y.kanal}k`); if (Math.abs(x.ortanca - y.ortanca) > 2) S.d.push(`AO ortanca ${x.ortanca} → ${y.ortanca}`); });
if (B.golge) S.e.push('Yer_Golgesi var'); if (B.color0) S.e.push(`COLOR_0 ${B.color0} primitive`);
const oran = B.boyut / A.boyut - 1; if (Math.abs(oran) > 0.05) S.f.push(`boyut ${A.boyut} → ${B.boyut} (${(oran * 100).toFixed(1)}%)`);
const sonuc = { simdiki: path.basename(aYol), yeni: path.basename(bYol), gecti: Object.fromEntries(Object.entries(S).map(([k, v]) => [k, v.length === 0])), sorun: S,
  olcu: { malzeme: an.length, renk_max_fark_ton: renkMax, mesh: Object.keys(A.geo).length, kutu_max_mm: +(kutuMax * 1000).toFixed(2), kose_sayisi_farkli_mesh: koseFark, ao_simdiki: A.ao, ao_yeni: B.ao, boyut_kb: [Math.round(A.boyut / 1024), Math.round(B.boyut / 1024)], boyut_fark_yuzde: +(oran * 100).toFixed(1) } };
fs.writeFileSync(rYol, JSON.stringify(sonuc, null, 1));
console.log(sonuc.yeni, JSON.stringify(sonuc.gecti), JSON.stringify(sonuc.olcu.boyut_kb), 'renk', renkMax, 'kutu', sonuc.olcu.kutu_max_mm, Object.values(S).flat().slice(0, 6));
