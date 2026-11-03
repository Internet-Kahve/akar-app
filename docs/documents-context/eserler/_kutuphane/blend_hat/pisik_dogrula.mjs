// AKAR · blend_hat pişirilmiş harita doğrulaması (3 Kasım 2026). Her iki dosya (gündüz, gece) mevcut karşılığıyla karşılaştırılır:
//  1) düğüm adları aynı, yalnız Harita_Golge eklenmiş; ana parça var
//  2) kutu: bütün model (Harita_Golge hariç) ve ana parça en çok 1 cm farklı (glTF dünyası, metre)
//  3) KHR_materials_unlit her malzemede; doku 2 (atlas + zemin gölgesi); üçgen ≤ karşılığı (gündüz: harita GLB'si, gece: gece GLB'si; +2 Harita_Golge, kabul
//     3 Kasım 2026); boyut gündüz ≤ 1100 KB, gece ≤ 1300 KB (4 Kasım 2026)
// Sonuç: <3d>/kontrol/<surum>_pisik/rapor.json (blend_rapor_<kip>.json dosyaları da içine alınır).
// Kullanım: GT_DIR=<kurulum> node pisik_dogrula.mjs <eser/3d klasörü> <surum>
import { createRequire } from 'module'; import path from 'path'; import fs from 'fs';
const require = createRequire(path.join(process.env.GT_DIR, 'x.js'));
const { NodeIO, getBounds } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const draco3d = require('draco3dgltf');
const sharp = require('sharp');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule() });
const [U, surum] = process.argv.slice(2);
const MJ = JSON.parse(fs.readFileSync(path.join(U, 'model.json'), 'utf8'));
const K = path.join(U, 'kontrol', `${surum}_pisik`); fs.mkdirSync(K, { recursive: true });
const SINIR_M = 0.01, GOLGE = 'Harita_Golge', GOLGE_UCGEN = 2;

async function ozet(f) {
  const doc = await io.read(f); const r = doc.getRoot(); let ucgen = 0, cizim = 0; const kutu = {};
  const tum = { min: [1e9, 1e9, 1e9], max: [-1e9, -1e9, -1e9] };
  for (const n of r.listNodes()) {
    const me = n.getMesh(); if (!me) continue;
    for (const p of me.listPrimitives()) { ucgen += (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3; cizim++; }
    const b = getBounds(n); kutu[n.getName()] = b;
    if (n.getName() !== GOLGE) for (let i = 0; i < 3; i++) { tum.min[i] = Math.min(tum.min[i], b.min[i]); tum.max[i] = Math.max(tum.max[i], b.max[i]); }
  }
  const yogunluk = {};
  for (const node of r.listNodes()) {
    if (!node.getMesh() || !/Kubbe|Cati|Govde|Minare/.test(node.getName())) continue;
    let area = 0, pixels = 0;
    const sc = node.getWorldScale();
    for (const p of node.getMesh().listPrimitives()) {
      const uv = p.getAttribute('TEXCOORD_0'), pos = p.getAttribute('POSITION'), ix = p.getIndices()?.getArray();
      if (!uv || !ix) continue;
      for (let j=0;j<ix.length;j+=3) {
        const [a,b,c] = [0,1,2].map(i=>pos.getElement(ix[j+i],[]));
        const u=b.map((x,i)=>(x-a[i])*sc[i]), v=c.map((x,i)=>(x-a[i])*sc[i]);
        const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
        if (cross[1] < -0.1*Math.hypot(...cross)) continue;
        area+=Math.hypot(...cross)/2;
        const [l,m,n]=[0,1,2].map(i=>uv.getElement(ix[j+i],[]));
        pixels+=2048**2*Math.abs((m[0]-l[0])*(n[1]-l[1])-(m[1]-l[1])*(n[0]-l[0]))/2;
      }
    }
    if (pixels) yogunluk[node.getName()]=+(100*Math.sqrt(area/pixels)).toFixed(2);
  }
  const mats = r.listMaterials();
  let golge = null;
  const tex = mats.find(m=>m.getName()===GOLGE)?.getBaseColorTexture();
  if(tex) {
    const {data,info} = await sharp(Buffer.from(tex.getImage())).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let kenar=0, enKoyu=0;
    for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++) {
      const alfa=data[4*(y*info.width+x)+3];
      enKoyu=Math.max(enKoyu,alfa);
      if(x===0||y===0||x===info.width-1||y===info.height-1) kenar=Math.max(kenar,alfa);
    }
    golge={kenar_alfa:kenar/255, en_koyu_alfa:enKoyu/255, piksel:[info.width,info.height]};
  }
  return { golge, yogunluk, dosya: path.relative(U, f), kb: +(fs.statSync(f).size / 1024).toFixed(1), ucgen, cizim, doku: r.listTextures().length,
    doku_tur: [...new Set(r.listTextures().map(t => t.getMimeType()))], malzeme: mats.map(m => m.getName()),
    unlit: mats.filter(m => m.getExtension('KHR_materials_unlit')).length, alfa: Object.fromEntries(mats.map(m => [m.getName(), m.getAlphaMode()])),
    uzanti: r.listExtensionsUsed().map(e => e.extensionName), dugum: r.listNodes().map(n => n.getName()), kutu, tum,
    oznitelik: [...new Set(r.listMeshes().flatMap(m => m.listPrimitives().flatMap(p => p.listSemantics())))] };
}
const fark = (a, b) => Math.max(...[0, 1, 2].flatMap(i => [Math.abs(a.min[i] - b.min[i]), Math.abs(a.max[i] - b.max[i])]));
const yuvar = b => ({ min: b.min.map(x => +x.toFixed(4)), max: b.max.map(x => +x.toFixed(4)) });

const harita = await ozet(path.join(U, 'export', MJ.glb + '.glb'));
const rapor = { tarih: new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Istanbul'}), surum, sinirlar: { kutu_m: SINIR_M, bayt: {gunduz:1100000, gece:1300000}, doluluk_min:0.45, cm_piksel_max:12, golge_ucgen_kabul: GOLGE_UCGEN }, dosyalar: {} };
let hepsi = true;
for (const [kip, ref] of [['gunduz', MJ.glb], ['gece', MJ.glb_gece]]) {
  const yeni = path.join(U, 'export', ref + '_harita_pisik.glb');
  if (!fs.existsSync(yeni)) { rapor.dosyalar[kip] = { yok: path.relative(U, yeni) }; hepsi = false; continue; }
  const a = kip === 'gunduz' ? harita : await ozet(path.join(U, 'export', ref + '.glb')); const b = await ozet(yeni);
  const ana = MJ.ana_parca || null;
  const eklenen = b.dugum.filter(n => !a.dugum.includes(n)), eksik = a.dugum.filter(n => !b.dugum.includes(n));
  const parca = Object.fromEntries(a.dugum.filter(n => a.kutu[n] && b.kutu[n]).map(n => [n, +fark(a.kutu[n], b.kutu[n]).toFixed(4)]));
  const k = {
    dugum: { eklenen, eksik, ana_parca: ana, ana_parca_var: ana ? b.dugum.includes(ana) : null, gecti: eksik.length === 0 && eklenen.length === 1 && eklenen[0] === GOLGE && (!ana || b.dugum.includes(ana)) },
    kutu: { tum_fark_m: +fark(a.tum, b.tum).toFixed(4), ana_parca_fark_m: ana ? +fark(a.kutu[ana], b.kutu[ana]).toFixed(4) : null,
      en_cok_parca_fark_m: Math.max(...Object.values(parca)), parca_fark_m: parca, ref_tum: yuvar(a.tum), yeni_tum: yuvar(b.tum),
      harita_golge: b.kutu[GOLGE] ? yuvar(b.kutu[GOLGE]) : null },
    icerik: { unlit: `${b.unlit}/${b.malzeme.length}`, malzeme: b.malzeme, alfa: b.alfa, doku: b.doku, doku_tur: b.doku_tur, uzanti: b.uzanti, oznitelik: b.oznitelik, cizim: b.cizim, cizim_ref: a.cizim },
    ucgen: { yeni: b.ucgen, karsilik: a.ucgen, harita_gunduz: harita.ucgen, harita_golge_haric: b.ucgen - GOLGE_UCGEN },
    kb: { yeni: b.kb, karsilik: a.kb, fark: +(b.kb - a.kb).toFixed(1) },
  };
  k.golge = b.golge;
  k.bayt = fs.statSync(yeni).size;
  k.cm_piksel = b.yogunluk;
  k.kutu.gecti = k.kutu.tum_fark_m <= SINIR_M && (k.kutu.ana_parca_fark_m ?? 0) <= SINIR_M;
  k.icerik.gecti = b.unlit === 2 && b.malzeme.length === 2 && ['Harita_Pisik','Harita_Golge'].every(n => b.malzeme.includes(n)) && b.doku === 2;
  k.ucgen.gecti = b.ucgen - GOLGE_UCGEN <= a.ucgen;   // karşılığı: gündüzde harita GLB'si, gecede gece GLB'si (mahya dahil)
  k.kb.gecti = fs.statSync(yeni).size <= (kip === 'gunduz' ? 1100000 : 1300000);   // 4 Kasım 2026: ayrıntı için gevşetildi (Muhammed)
  k.gecti = k.dugum.gecti && k.kutu.gecti && k.icerik.gecti && k.ucgen.gecti && k.kb.gecti; hepsi &&= k.gecti;
  const br = path.join(K, `blend_rapor_${kip}.json`); if (fs.existsSync(br)) k.blend = JSON.parse(fs.readFileSync(br, 'utf8'));
  rapor.dosyalar[kip] = { ref: a.dosya, yeni: b.dosya, ...k };
}
rapor.gecti = hepsi;
rapor.yapisal_gecti = hepsi;
rapor.gecti = null;
// uygulama kamerası ölçümleri ve yansıtma kaydı (pisik_gorsel.mjs) korunur
const eski = fs.existsSync(path.join(K, 'rapor.json')) ? JSON.parse(fs.readFileSync(path.join(K, 'rapor.json'), 'utf8')) : {};
for (const k of ['uygulama_olcum', 'yansitma_uygulama', 'gorsel', 'parlaklik', 'isik']) if (eski[k]) rapor[k] = eski[k];
fs.writeFileSync(path.join(K, 'rapor.json'), JSON.stringify(rapor, null, 1));
for (const [kip, d] of Object.entries(rapor.dosyalar)) console.log('DOGRULA', kip, d.gecti ? 'GEÇTİ' : 'KALDI',
  JSON.stringify({ dugum: d.dugum?.gecti, kutu: d.kutu?.tum_fark_m, ana: d.kutu?.ana_parca_fark_m, unlit: d.icerik?.unlit, doku: d.icerik?.doku, ucgen: d.ucgen, kb: d.kb }));
