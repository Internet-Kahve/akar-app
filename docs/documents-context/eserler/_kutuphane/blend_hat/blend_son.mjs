// AKAR · blend_hat son adım (29 Ekim 2026): Blender'ın ham GLB'sini teslim GLB'sine çevirir.
//  - malzeme adındaki _cevre soneki kaldırılır (çevreyle paylaşılan malzemenin çevre kopyası)
//  - AO (occlusionTexture): ~1 px bulanık, <ao_px> kenar, tek kanal JPEG q80
//  - AO'lu (yapı) primitive'lerde COLOR_0 silinir
//  - Draco (EDGEBREAKER, QP 14; glb_temizle ile aynı), iki tur: nicemlemeyle sıfır alana düşen üçgenler ikinci turda atılır
// Kullanım: GT_DIR=<kurulum> node blend_son.mjs <ham.glb> <cikti.glb> <ao_px>
import { createRequire } from 'module'; import path from 'path'; import fs from 'fs';
const require = createRequire(path.join(process.env.GT_DIR, 'x.js'));
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS, KHRDracoMeshCompression } = require('@gltf-transform/extensions');
const { prune } = require('@gltf-transform/functions');
const draco3d = require('draco3dgltf'); const sharp = require('sharp');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(), 'draco3d.encoder': await draco3d.createEncoderModule() });
const [girdi, cikti, aoPx] = process.argv.slice(2);
const doc = await io.read(girdi); const r = doc.getRoot(); const not = { cevre: 0, color0: 0, sifir_ucgen: 0 };
for (const m of r.listMaterials()) if (/_cevre$/.test(m.getName())) { m.setName(m.getName().replace(/_cevre$/, '')); not.cevre++; }
const ao = new Set(); for (const m of r.listMaterials()) if (m.getOcclusionTexture()) ao.add(m.getOcclusionTexture());
for (const t of ao) {
  const px = +aoPx;
  const jpg = await sharp(Buffer.from(t.getImage())).greyscale().blur(1).resize(px, px, { kernel: 'lanczos3' }).toColourspace('b-w').jpeg({ quality: 80 }).toBuffer();
  t.setImage(new Uint8Array(jpg)).setMimeType('image/jpeg').setURI((t.getURI() || t.getName()).replace(/\.\w+$/, '') + '.jpg');
}
for (const me of r.listMeshes()) for (const p of me.listPrimitives()) {
  if (p.getMaterial()?.getOcclusionTexture() && p.getAttribute('COLOR_0')) { p.setAttribute('COLOR_0', null); not.color0++; }
}
await doc.transform(prune({ keepLeaves: true, keepAttributes: true }));
const ext = r.listExtensionsUsed().find(e => e.extensionName === 'KHR_draco_mesh_compression') || doc.createExtension(KHRDracoMeshCompression);
ext.setRequired(true).setEncoderOptions({ method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER, quantizationBits: { POSITION: 14, NORMAL: 10, COLOR: 8, TEX_COORD: 12, GENERIC: 12 } });
// Draco iki tur: sıkıştır → aç → yeniden sıkıştır. Konum nicemlemesinden sonra sıfır alana düşen üçgenleri Draco ikinci turda atar;
// teslim GLB'lerinin üçgen sayıları bu yolla oluştu (29 Ekim 2026, GLB üzerinde yapılan geçiş). Görünür üçgen değişmez.
const ara = await io.readBinary(await io.writeBinary(doc));
const once = ara.getRoot().listMeshes().reduce((s, m) => s + m.listPrimitives().reduce((t, p) => t + (p.getIndices()?.getCount() || 0) / 3, 0), 0);
const bin = await io.writeBinary(ara); fs.writeFileSync(cikti, bin);
const son = await io.readBinary(bin);
not.sifir_ucgen = once - son.getRoot().listMeshes().reduce((s, m) => s + m.listPrimitives().reduce((t, p) => t + (p.getIndices()?.getCount() || 0) / 3, 0), 0);
console.log('SON', path.basename(cikti), JSON.stringify(not));
