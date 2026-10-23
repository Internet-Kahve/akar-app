// AKAR · uygulama GLB'sinden çevre ve insan figürlerini çıkarır (20 Ekim 2026, kullanıcı kararı).
//
// Kural: uygulamanın kullandığı `export/<eser>_<surum>.glb` yalnız YAPIDIR. `Cevre_*` (ağaç, çevre döşemesi, tarh),
// `Olcek_Insan_*` (insan figürü) ve Koza Han'ın `Avlu_Agac` / `Avlu_Cim` nesneleri yalnız `_sunum.glb` dosyasında kalır. Gerekçe: haritada ve anlatımda
// bu parçalar modelin %5–20'si kadar gereksiz üçgendir, haritanın kendi zemini ve binalarıyla çakışır.
// Ayrıntı: `eserler/_GENEL_SAHNE_STANDARDI.md` §5.5.
//
// Build betikleri (build_*.py) normal GLB'yi hâlâ çevre ve figürlerle yazar; bu betik bir SON ADIMDIR. Modeli yeniden
// üretmez: yalnız adı eşleşen düğümleri siler, artan mesh/malzeme/dokuyu temizler ve Draco ile yeniden yazar.
// Kalan parçalar kayıpsızdır (köşe kayması 0 mm; yalnız sıfır alanlı, görünmeyen üçgenler atılabilir).
//
// Kullanım (kurulum bir kez, repo dışında):
//   mkdir /tmp/gt && cd /tmp/gt && npm init -y && npm i @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions draco3dgltf
//   GT_DIR=/tmp/gt node eserler/_kutuphane/glb_temizle.mjs eserler/ulu-cami/3d/export/ulu-cami_v25.glb
//   (ikinci argüman verilirse çıktı oraya yazılır; verilmezse dosyanın üzerine yazılır.)
// SUNUM dosyasına çalıştırılmaz. Silinecek parça yoksa dosyaya dokunulmaz ("zaten temiz").
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

const require = createRequire(path.join(process.env.GT_DIR || process.cwd(), 'x.js'));
const { NodeIO } = require('@gltf-transform/core');
const { KHRDracoMeshCompression } = require('@gltf-transform/extensions');
const { prune } = require('@gltf-transform/functions');
const draco3d = require('draco3dgltf');

const girdi = process.argv[2];
const cikti = process.argv[3] || girdi;
if (!girdi) { console.error('Kullanım: node glb_temizle.mjs <girdi.glb> [cikti.glb]'); process.exit(2); }
if (/_sunum\.glb$/.test(girdi)) { console.error('Sunum dosyasına çalıştırılmaz (çevre ve figür orada kalır).'); process.exit(2); }

const HEDEF = /^(Cevre_|Olcek_Insan_|Avlu_Agac|Avlu_Cim)/; // Avlu_Agac, Avlu_Cim: Koza Han avlusunun ağacı ve çimi (20 Ekim 2026)

const io = new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const doc = await io.read(girdi);

const sil = [];
const tara = (n) => { if (HEDEF.test(n.getName())) { sil.push(n); return; } n.listChildren().forEach(tara); };
doc.getRoot().listScenes().forEach((s) => s.listChildren().forEach(tara));
if (!sil.length) { console.log(`${path.basename(girdi)}: silinen 0 · dosya zaten temiz, değişmedi`); process.exit(0); }
const adlar = [];
const topla = (n) => { adlar.push(n.getName()); n.listChildren().forEach(topla); };
sil.forEach(topla);
sil.forEach((n) => n.dispose());

await doc.transform(prune({ keepLeaves: false }));
doc.createExtension(KHRDracoMeshCompression).setRequired(true).setEncoderOptions({
  method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER, quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12,
});
await io.write(cikti, doc);

let ucgen = 0;
doc.getRoot().listMeshes().forEach((m) => m.listPrimitives().forEach((p) => {
  const i = p.getIndices(); ucgen += (i ? i.getCount() : p.getAttribute('POSITION').getCount()) / 3;
}));
console.log(`${path.basename(girdi)}: silinen ${adlar.length} (${adlar.sort().join(', ') || '—'}) · kalan üçgen ${ucgen} · ${fs.statSync(cikti).size} bayt`);
