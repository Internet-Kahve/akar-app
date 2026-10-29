// Eski GLB'lerin düğüm adı ve dünya sınır kutusu (glTF ekseni) → renk_ao.py dışa aktarımı aynı konuma kaydırır ve geometriyi karşılaştırır.
// Kullanım: GT_DIR=<kurulum> node ref.mjs <app.glb> <sunum.glb> <cikti.json>
import { createRequire } from 'module'; import path from 'path'; import fs from 'fs';
const require = createRequire(path.join(process.env.GT_DIR, 'x.js'));
const { NodeIO } = require('@gltf-transform/core'); const { ALL_EXTENSIONS } = require('@gltf-transform/extensions'); const draco3d = require('draco3dgltf');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule() });
async function oku(yol) {
  const doc = await io.read(yol); const out = {};
  for (const n of doc.getRoot().listNodes()) {
    const m = n.getMesh(); if (!m) continue; const W = n.getWorldMatrix(); const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; let v = 0, t = 0;
    for (const p of m.listPrimitives()) {
      const a = p.getAttribute('POSITION'); v += a.getCount(); t += (p.getIndices() ? p.getIndices().getCount() : a.getCount()) / 3; const e = [];
      for (let i = 0; i < a.getCount(); i++) { a.getElement(i, e); const w = [0, 1, 2].map(k => W[k] * e[0] + W[4 + k] * e[1] + W[8 + k] * e[2] + W[12 + k]); for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], w[k]); mx[k] = Math.max(mx[k], w[k]); } }
    }
    out[n.getName()] = { mn, mx, v, t };
  }
  return out;
}
const [app, sunum, cikti] = process.argv.slice(2);
fs.writeFileSync(cikti, JSON.stringify({ app: await oku(app), sunum: await oku(sunum) }, null, 1));
console.log('REF', cikti);
