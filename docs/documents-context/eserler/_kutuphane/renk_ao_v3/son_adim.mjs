// Bir kerelik geçiş işiydi; kaynak artık Blender + malzeme-paleti.json (_kutuphane/blend_hat/). Yeniden kullanma.
// AKAR · renk_ao_v3 son adım (28 Ekim 2026): renk_ao.py'nin ham GLB'lerini teslim GLB'sine çevirir ve doğrular.
//  - malzeme adındaki _cevre soneki kaldırılır (çevreyle paylaşılan malzemenin eski kopyası; palet_v2 ile aynı)
//  - Yer_Golgesi: KHR_materials_unlit, alphaMode BLEND, doubleSided false, siyah (alfa dokuda)
//  - AO (occlusionTexture) dokusu JPG kalite 85 (gri tonlu); yapı parçalarında COLOR_0 (hep 1,0) silinir
//  - Draco: palet_v2 / glb_temizle ile aynı ayar (EDGEBREAKER, QP 14)
//  - kontrol: occlusionTexture.texCoord, geometri (üçgen, sınır kutusu, parça adı) eski sürümle, dosya boyutu
// Kullanım: GT_DIR=<kurulum> node son_adim.mjs <app_ham.glb> <sunum_ham.glb> <app.glb> <sunum.glb> <ref.json> <kontrol.json>
// Kurulum: @gltf-transform/core extensions functions + draco3dgltf + sharp (glb_temizle.mjs başındaki gibi, ek olarak sharp).
import { createRequire } from 'module'; import path from 'path'; import fs from 'fs';
const require = createRequire(path.join(process.env.GT_DIR, 'x.js'));
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS, KHRDracoMeshCompression, KHRMaterialsUnlit } = require('@gltf-transform/extensions');
const { prune } = require('@gltf-transform/functions');
const draco3d = require('draco3dgltf'); const sharp = require('sharp');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(), 'draco3d.encoder': await draco3d.createEncoderModule() });
const [appHam, sunumHam, appOut, sunumOut, refYol, kontrolYol] = process.argv.slice(2);
const REF = JSON.parse(fs.readFileSync(refYol));
const GOLGE = 'Yer_Golgesi';

async function isle(girdi, cikti) {
  const doc = await io.read(girdi); const r = doc.getRoot(); const not = { cevre_soneki: 0, color0_silinen: 0 };
  for (const m of r.listMaterials()) if (/_cevre$/.test(m.getName())) { m.setName(m.getName().replace(/_cevre$/, '')); not.cevre_soneki++; }
  // gölge düzlemi
  const unlit = doc.createExtension(KHRMaterialsUnlit);
  for (const n of r.listNodes()) {
    if (n.getName() !== GOLGE || !n.getMesh()) continue;
    for (const p of n.getMesh().listPrimitives()) {
      const m = p.getMaterial(); m.setExtension('KHR_materials_unlit', unlit.createUnlit());
      m.setAlphaMode('BLEND').setDoubleSided(false).setBaseColorFactor([0, 0, 0, 1]).setMetallicFactor(0).setRoughnessFactor(1);
    }
  }
  // AO dokuları JPG; AO'lu (yapı) primitive'lerde COLOR_0 sil
  const aoTex = new Set();
  for (const m of r.listMaterials()) { const t = m.getOcclusionTexture(); if (t) aoTex.add(t); }
  for (const t of aoTex) {
    if (t.getMimeType() === 'image/jpeg') continue;
    const jpg = await sharp(Buffer.from(t.getImage())).greyscale().jpeg({ quality: 85 }).toBuffer();
    t.setImage(new Uint8Array(jpg)).setMimeType('image/jpeg').setURI((t.getURI() || t.getName()).replace(/\.png$/, '') + '.jpg');
  }
  for (const me of r.listMeshes()) for (const p of me.listPrimitives()) {
    if (p.getMaterial()?.getOcclusionTexture() && p.getAttribute('COLOR_0')) { p.setAttribute('COLOR_0', null); not.color0_silinen++; }
  }
  await doc.transform(prune({ keepLeaves: true, keepAttributes: true }));   // keepAttributes: UV kanalları kaymasın (AO TEXCOORD_1'de kalmalı)
  const ext = r.listExtensionsUsed().find(e => e.extensionName === 'KHR_draco_mesh_compression') || doc.createExtension(KHRDracoMeshCompression);
  ext.setRequired(true).setEncoderOptions({ method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER,
    quantizationBits: { POSITION: 14, NORMAL: 10, COLOR: 8, TEX_COORD: 12, GENERIC: 12 } });
  await io.write(cikti, doc);
  return not;
}

async function denetle(yol, ref) {
  const doc = await io.read(yol); const r = doc.getRoot(); const k = { dosya_bayt: fs.statSync(yol).size, malzeme: {}, parca: {}, sorun: [] };
  for (const m of r.listMaterials()) {
    const oi = m.getOcclusionTextureInfo();
    k.malzeme[m.getName()] = { occlusion_texCoord: oi ? oi.getTexCoord() : null, unlit: !!m.getExtension('KHR_materials_unlit'), alpha: m.getAlphaMode() };
  }
  for (const n of r.listNodes()) {
    const me = n.getMesh(); if (!me) continue; const W = n.getWorldMatrix(); const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; let v = 0, t = 0; const e = [];
    for (const p of me.listPrimitives()) {
      const a = p.getAttribute('POSITION'); v += a.getCount(); t += (p.getIndices() ? p.getIndices().getCount() : a.getCount()) / 3;
      for (let i = 0; i < a.getCount(); i++) { a.getElement(i, e); const w = [0, 1, 2].map(q => W[q] * e[0] + W[4 + q] * e[1] + W[8 + q] * e[2] + W[12 + q]); for (let q = 0; q < 3; q++) { mn[q] = Math.min(mn[q], w[q]); mx[q] = Math.max(mx[q], w[q]); } }
    }
    const o = ref[n.getName()];
    const fark = o ? Math.max(...[0, 1, 2].flatMap(q => [Math.abs(mn[q] - o.mn[q]), Math.abs(mx[q] - o.mx[q])])) : null;
    k.parca[n.getName()] = { kose: v, ucgen: t, eski_kose: o?.v ?? null, eski_ucgen: o?.t ?? null, kutu_fark_mm: fark === null ? null : Math.round(fark * 1000) };
    if (n.getName() !== GOLGE) {
      if (!o) k.sorun.push(`yeni parça: ${n.getName()}`);
      else { if (t !== o.t) k.sorun.push(`${n.getName()}: üçgen ${o.t} → ${t}`); if (fark > 0.01) k.sorun.push(`${n.getName()}: kutu farkı ${(fark * 1000).toFixed(0)} mm`); }
    }
  }
  for (const ad of Object.keys(ref)) if (!k.parca[ad]) k.sorun.push(`eksik parça: ${ad}`);
  for (const n of r.listNodes()) for (const p of n.getMesh()?.listPrimitives() || []) {
    const oi = p.getMaterial()?.getOcclusionTextureInfo();
    if (oi && (oi.getTexCoord() !== 1 || !p.getAttribute('TEXCOORD_1'))) k.sorun.push(`${n.getName()}/${p.getMaterial().getName()}: AO texCoord ${oi.getTexCoord()}, TEXCOORD_1 ${p.getAttribute('TEXCOORD_1') ? 'var' : 'YOK'}`);
  }
  for (const [ad, m] of Object.entries(k.malzeme)) {
    if (ad === GOLGE) { if (!m.unlit || m.alpha !== 'BLEND') k.sorun.push('Yer_Golgesi unlit/blend değil'); }
  }
  const aoTex = r.listTextures().filter(t => r.listMaterials().some(m => m.getOcclusionTexture() === t));
  k.ao_doku = await Promise.all(aoTex.map(async t => {
    const { data, info } = await sharp(Buffer.from(t.getImage())).greyscale().raw().toBuffer({ resolveWithObject: true });
    const s = Float32Array.from(data, x => x / 255).sort();
    return { ad: t.getName(), tur: t.getMimeType(), px: info.width, kb: Math.round(t.getImage().byteLength / 1024), min: +s[0].toFixed(3), p05: +s[Math.floor(s.length * 0.05)].toFixed(3), ortanca: +s[s.length >> 1].toFixed(3) };
  }));
  k.color0_kalan_yapi = r.listMeshes().flatMap(m => m.listPrimitives()).filter(p => p.getMaterial()?.getOcclusionTexture() && p.getAttribute('COLOR_0')).length;
  return k;
}

const notlar = { app: await isle(appHam, appOut), sunum: await isle(sunumHam, sunumOut) };
const kontrol = { app: await denetle(appOut, REF.app), sunum: await denetle(sunumOut, REF.sunum), islem: notlar };
fs.writeFileSync(kontrolYol, JSON.stringify(kontrol, null, 1));
console.log('APP', kontrol.app.dosya_bayt, 'sorun', kontrol.app.sorun.length, kontrol.app.sorun.slice(0, 5));
console.log('SUNUM', kontrol.sunum.dosya_bayt, 'sorun', kontrol.sunum.sorun.length, kontrol.sunum.sorun.slice(0, 5));
console.log('AO', JSON.stringify(kontrol.app.ao_doku));
