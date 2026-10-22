import { makeIO, lin2hex } from './lib.mjs';
import { CFG, glbPath } from './palet.mjs';
import fs from 'fs'; import path from 'path';
const ROOT = '/Users/ksenophon/Desktop/internet-kahve/akar-app/docs/documents-context/eserler';
const io = await makeIO();
for (const key of Object.keys(CFG)) {
  const cfg = CFG[key]; const doc = await io.read(glbPath(cfg, cfg.to, false)); const run = JSON.parse(fs.readFileSync(`run_${key}.json`));
  const tdir = path.join(ROOT, cfg.dir, '3d/build/doku_palet_v2'); fs.mkdirSync(tdir, { recursive: true });
  const mats = {};
  for (const m of doc.getRoot().listMaterials()) {
    const bf = m.getBaseColorFactor(); const e = { hex: lin2hex(bf), alpha: bf[3], lin: bf, rough: m.getRoughnessFactor(), metal: m.getMetallicFactor(), tex: null, lead: false };
    const t = m.getBaseColorTexture(); if (t) { const f = path.join(tdir, `${m.getName().replace(/[^\w.-]/g, '_')}_palet_v2.png`); fs.writeFileSync(f, Buffer.from(t.getImage())); e.tex = f; e.lead = lin2hex(bf) !== '#FFFFFF'; }
    mats[m.getName()] = e;
  }
  const out = { eser: key, dir: cfg.dir, base: cfg.base, from: cfg.from, to: cfg.to, ymin: run.files.app.ymin, ymax: run.files.app.ymax, duz: cfg.duz || [], nodes: doc.getRoot().listNodes().filter(n=>n.getMesh()).map(n=>n.getName()), materials: mats };
  fs.mkdirSync('/Users/ksenophon/Desktop/internet-kahve/akar-app/docs/documents-context/eserler/_kutuphane/palet_v2/ayar', { recursive: true });
  fs.writeFileSync(`${ROOT}/_kutuphane/palet_v2/ayar/${key}.json`, JSON.stringify(out, null, 1)); console.log(key, Object.keys(mats).length);
}
