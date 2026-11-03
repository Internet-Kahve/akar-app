// AKAR · blend_hat pişirilmiş harita (3 Kasım 2026): Blender'ın ham GLB'sine KHR_materials_unlit ve alfa kipi.
//  - her malzeme ışıksız (KHR_materials_unlit); metal 0, pürüzlülük 1; normal, AO ve yayım dokusu yok
//  - Harita_Pisik: <atlas_kipi> (OPAQUE gündüz, MASK 0,5 gece: mahya yazısı), tek yüz; Harita_Golge: BLEND, tek yüz
//  - normal ve köşe rengi kalmışsa silinir (ışıksız malzemede kullanılmaz)
// Draco bu adımdan sonra blend_son.mjs ile yapılır.
// Kullanım: GT_DIR=<kurulum> node pisik_unlit.mjs <ham.glb> <cikti.glb> <OPAQUE|MASK>
import { createRequire } from 'module'; import path from 'path';
const require = createRequire(path.join(process.env.GT_DIR, 'x.js'));
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS, KHRMaterialsUnlit } = require('@gltf-transform/extensions');
const [girdi, cikti, kip = 'OPAQUE'] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(girdi); const r = doc.getRoot();
const unlit = r.listExtensionsUsed().find(e => e.extensionName === 'KHR_materials_unlit') || doc.createExtension(KHRMaterialsUnlit);
const not = { malzeme: [], kendiliginden_unlit: 0, silinen_oznitelik: 0 };
for (const m of r.listMaterials()) {
  if (m.getExtension('KHR_materials_unlit')) not.kendiliginden_unlit++;
  else m.setExtension('KHR_materials_unlit', unlit.createUnlit());
  m.setMetallicFactor(0).setRoughnessFactor(1).setMetallicRoughnessTexture(null).setNormalTexture(null)
   .setOcclusionTexture(null).setEmissiveTexture(null).setEmissiveFactor([0, 0, 0]);
  if (m.getName() === 'Harita_Golge') m.setAlphaMode('BLEND').setDoubleSided(false).setBaseColorFactor([1, 1, 1, 1]);
  else if (kip === 'MASK') m.setAlphaMode('MASK').setAlphaCutoff(0.5).setDoubleSided(false);
  else m.setAlphaMode('OPAQUE').setDoubleSided(false);   // tek yüz: mahya gibi sırt sırta yüzlerde ters yüz görünmez (kaynakta da çoğu tek yüz)
  not.malzeme.push(`${m.getName()}:${m.getAlphaMode()}`);
}
for (const me of r.listMeshes()) for (const p of me.listPrimitives())
  for (const a of ['NORMAL', 'TANGENT', 'COLOR_0']) if (p.getAttribute(a)) { p.setAttribute(a, null); not.silinen_oznitelik++; }
await io.write(cikti, doc);
console.log('UNLIT', path.basename(cikti), JSON.stringify(not));
