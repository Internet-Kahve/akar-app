// AKAR · parça sadeleştirme doğrulaması (29 Ekim 2026). Eski ve yeni sürümü karşılaştırır:
// b) toplam üçgen/köşe, malzeme adları ve görünen renk (baseColorFactor × doku ortancası), AO texCoord 1 ve TEXCOORD_1, fazladan UV kanalı yok
// c) içerik dosyalarında (hikâye, kartlar, okuma, görevler) ve model.json'da (ortu_gruplari, ic_parcalar) geçen her parça adı yeni SUNUM GLB'sinde var
// d) kök parça sayısı (Zemin*, Cevre*, Olcek* ve model.json sunum_ek hariç); ana_parca kutu merkezi değişmedi;
//    29 Ekim 2026, eser başına iki model: harita (uygulama) GLB'sinde ic_parcalar dışındaki bütün yapı parçaları var, ic_parcalar'dan hiçbiri yok
// Kullanım: GT_DIR=<kurulum> node parca_dogrula.mjs <eser klasörü> <ad> <eski> <yeni> <rapor.json>
import { createRequire } from 'module'; import path from 'path'; import fs from 'fs';
const require = createRequire(path.join(process.env.GT_DIR, 'x.js'));
const { NodeIO } = require('@gltf-transform/core'); const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const draco3d = require('draco3dgltf'); const sharp = require('sharp');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule() });
const [U, ad, eski, yeni, rYol] = process.argv.slice(2);
const MJ = JSON.parse(fs.readFileSync(path.join(U, '3d/model.json')));
const EK = ['Zemin', 'Cevre', 'Olcek', ...(MJ.sunum_ek || [])];
const ekMi = n => EK.some(x => n.startsWith(x));
const lin = v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); const srgb = v => (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.min(1, v) ** (1 / 2.4) - 0.055);
async function oku(yol) {
  const d = await io.read(yol), r = d.getRoot(), o = { mat: {}, kok: [], ucgen: 0, kose: 0, uv: new Set(), tc: new Set(), kutu: {} };
  for (const m of r.listMaterials()) {
    const f = m.getBaseColorFactor(), t = m.getBaseColorTexture(); let c = f.slice(0, 3);
    if (t) { const { data, info } = await sharp(Buffer.from(t.getImage())).raw().toBuffer({ resolveWithObject: true }); const k = [[], [], []];
      for (let i = 0; i < data.length; i += info.channels) for (let q = 0; q < 3; q++) k[q].push(data[i + Math.min(q, info.channels - 1)]);
      c = c.map((x, q) => { k[q].sort((a, b) => a - b); return x * lin(k[q][k[q].length >> 1] / 255); }); }
    o.mat[m.getName()] = c.map(x => Math.round(srgb(x) * 255));
    const oi = m.getOcclusionTextureInfo(); if (oi) o.tc.add(oi.getTexCoord());
  }
  for (const n of r.getDefaultScene().listChildren()) {
    if (n.getMesh()) o.kok.push(n.getName());
    const me = n.getMesh(); if (!me) continue; const W = n.getWorldMatrix(), mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9], e = [];
    for (const p of me.listPrimitives()) {
      const a = p.getAttribute('POSITION'); o.kose += a.getCount(); o.ucgen += (p.getIndices() ? p.getIndices().getCount() : a.getCount()) / 3;
      for (const s of p.listSemantics()) if (s.startsWith('TEXCOORD')) o.uv.add(s);
      if (p.getMaterial()?.getOcclusionTexture() && !p.getAttribute('TEXCOORD_1')) o.uv.add('AO_TEXCOORD_1_YOK');
      for (let i = 0; i < a.getCount(); i++) { a.getElement(i, e); const w = [0, 1, 2].map(q => W[q] * e[0] + W[4 + q] * e[1] + W[8 + q] * e[2] + W[12 + q]); for (let q = 0; q < 3; q++) { mn[q] = Math.min(mn[q], w[q]); mx[q] = Math.max(mx[q], w[q]); } }
    }
    o.kutu[n.getName()] = { mn, mx };
  }
  return o;
}
const X = path.join(U, '3d/export');
const A = await oku(path.join(X, `${ad}_${eski}.glb`)), B = await oku(path.join(X, `${ad}_${yeni}.glb`));
const As = await oku(path.join(X, `${ad}_${eski}_sunum.glb`)), Bs = await oku(path.join(X, `${ad}_${yeni}_sunum.glb`));
const S = { b: [], c: [], d: [] };
for (const [x, y, t] of [[A, B, 'uygulama'], [As, Bs, 'sunum']]) {
  if (x.ucgen !== y.ucgen) S.b.push(`${t}: üçgen ${x.ucgen} → ${y.ucgen}`); if (x.kose !== y.kose) S.b.push(`${t}: köşe ${x.kose} → ${y.kose}`);
  const an = Object.keys(x.mat).sort(), bn = Object.keys(y.mat).sort(); if (JSON.stringify(an) !== JSON.stringify(bn)) S.b.push(`${t}: malzeme adları farklı`);
  for (const k of an) if (y.mat[k] && Math.max(...x.mat[k].map((v, i) => Math.abs(v - y.mat[k][i]))) > 1) S.b.push(`${t}: ${k} rengi ${x.mat[k]} → ${y.mat[k]}`);
  if ([...y.tc].some(v => v !== 1)) S.b.push(`${t}: AO texCoord ${[...y.tc]}`);
  if (JSON.stringify([...x.uv].sort()) !== JSON.stringify([...y.uv].sort())) S.b.push(`${t}: UV kanalları ${[...x.uv]} → ${[...y.uv]}`);
}
const IC = MJ.ic_parcalar || [];
const yA = B.kok.filter(n => !ekMi(n)).sort(), yS = Bs.kok.filter(n => !ekMi(n)).sort();
for (const n of yS) if (!IC.includes(n) && !yA.includes(n)) S.d.push(`harita GLB'sinde yapı parçası eksik: ${n}`);
for (const n of yA) if (IC.includes(n)) S.d.push(`iç parça harita GLB'sinde: ${n}`);
for (const n of yA) if (!yS.includes(n)) S.d.push(`yalnız haritada olan parça: ${n}`);
for (const n of IC) if (!yS.includes(n)) S.d.push(`ic_parcalar sunumda yok: ${n}`);
const ap = MJ.ana_parca;
if (ap) { const k0 = A.kutu[ap], k1 = B.kutu[ap]; if (!k1) S.d.push(`ana_parca ${ap} yeni uygulama GLB'sinde yok`);
  else { const f = Math.max(...[0, 2].map(q => Math.abs((k0.mn[q] + k0.mx[q]) / 2 - (k1.mn[q] + k1.mx[q]) / 2))); if (f > 0.01) S.d.push(`ana_parca ${ap} yatay merkezi ${(f * 100).toFixed(1)} cm kaydı`); } }   /* harita yalnız x/z merkezini kullanır (app.js) */
// referans denetimi
const icerik = path.join(U, 'icerik'); const dosyalar = fs.readdirSync(icerik).filter(f => f === 'hikaye.md' || f.startsWith('parcalar') || f === 'gorevler.json' || f.startsWith('eser-hakkinda')).map(f => path.join('icerik', f));
dosyalar.push('3d/model.json');
const tumAd = new Set([...A.kok, ...As.kok, ...B.kok, ...Bs.kok]);
const ref = [];
for (const f of dosyalar) { const ham = fs.readFileSync(path.join(U, f), 'utf8');
  const t = f.endsWith('.md') ? ham.split('\n').filter(l => l.startsWith('|')).join('\n') : ham;   // md: yalnız tablo satırları (notlardaki tarihsel adlar referans değil)
  for (const a of tumAd) if (!ekMi(a) && new RegExp(`(?<![A-Za-z0-9_])${a.replace(/[.]/g, '\\.')}(?![A-Za-z0-9_])`).test(t)) ref.push([f, a]);
  for (const m of t.matchAll(/`([A-Z][A-Za-z0-9]*(?:_[A-Za-z0-9]+)+)`/g)) if (!tumAd.has(m[1]) && /^[A-Z]/.test(m[1]) && !/^(DJI|ERD)_?\d/.test(m[1])) ref.push([f, m[1]]); }
for (const [f, a] of ref) if (!Bs.kok.includes(a)) { if (!(MJ.sunum_ek || []).includes(a)) S.c.push(`${f}: ${a} yeni sunum GLB'sinde yok`); }
const sonuc = { eser: path.basename(U), eski, yeni, gecti: { b: !S.b.length, c: !S.c.length, d: !S.d.length }, sorun: S,
  kok_parca: { once: A.kok.filter(n => !ekMi(n)).length, sonra: yS.length, once_adlar: A.kok.filter(n => !ekMi(n)), sonra_adlar: yS, harita: yA.length, harita_adlar: yA, ic_parcalar: IC },
  toplam: { ucgen: [A.ucgen, B.ucgen], kose: [A.kose, B.kose], sunum_ucgen: [As.ucgen, Bs.ucgen] }, malzeme: Object.keys(B.mat).length,
  referanslar: [...new Set(ref.map(r => r[1]))].sort() };
fs.writeFileSync(rYol, JSON.stringify(sonuc, null, 1));
console.log(sonuc.eser, JSON.stringify(sonuc.gecti), 'kök', sonuc.kok_parca.once, '→', sonuc.kok_parca.sonra, 'üçgen', sonuc.toplam.ucgen.join('→'), [...S.b, ...S.c, ...S.d].slice(0, 8));
