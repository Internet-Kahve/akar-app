import { makeIO, nodeStats, worldMat, xf, lin2hex } from './lib.mjs'; import { CFG, glbPath } from './palet.mjs'; import fs from 'fs';
const io = await makeIO();
function detail(doc) { const out = {}; const t = [0,0,0,1];
  for (const n of doc.getRoot().listNodes()) { const me = n.getMesh(); if (!me) continue; const M = worldMat(n); const d = { area: {}, col: { mn: 9, sum: 0, n: 0, dev: 0 } };
    for (const p of me.listPrimitives()) { const pos = p.getAttribute('POSITION'), ix = p.getIndices(); const mn = p.getMaterial().getName().replace(/\.\d{3}$/, ''); const bc = lin2hex(p.getMaterial().getBaseColorFactor()); const key = mn + ' ' + bc + (p.getMaterial().getBaseColorTexture() ? ' T' : ''); let a = 0;
      for (let k = 0; k < ix.getCount() / 3; k++) { const v = [0,1,2].map(j => { const q = [0,0,0]; pos.getElement(ix.getScalar(k * 3 + j), q); return xf(M, q); }); const u = [0,1,2].map(i => v[1][i] - v[0][i]), w = [0,1,2].map(i => v[2][i] - v[0][i]); a += 0.5 * Math.hypot(u[1]*w[2]-u[2]*w[1], u[2]*w[0]-u[0]*w[2], u[0]*w[1]-u[1]*w[0]); }
      d.area[key] = (d.area[key] || 0) + a; const c = p.getAttribute('COLOR_0'); if (c) for (let i = 0; i < c.getCount(); i++) { c.getElement(i, t); const g = (t[0]+t[1]+t[2])/3; d.col.mn = Math.min(d.col.mn, g); d.col.sum += g; d.col.n++; d.col.dev = Math.max(d.col.dev, Math.abs(t[0]-g), Math.abs(t[2]-g)); } }
    out[n.getName()] = d; } return out; }
const keys = process.argv.slice(2); const res = {};
for (const key of keys) { const cfg = CFG[key]; res[key] = {};
  for (const which of ['app', 'sunum']) {
    const ref = await io.read(glbPath(cfg, cfg.to, which === 'sunum')); const bl = await io.read(`bx/${key}_${which}.glb`);
    const A = nodeStats(ref), B = nodeStats(bl), DA = detail(ref), DB = detail(bl); const r = { nodes: Object.keys(A).length, blendNodes: Object.keys(B).length, farkli: [], malz: [], eksik: [] };
    let vE = 0, tE = 0, bE = 0, maxb = 0, vA = 0, vB = 0, tA = 0, tB = 0, colmin = 9, colsum = 0, coln = 0, coldev = 0, matdiff = 0, areaTot = 0;
    for (const k of Object.keys(A)) { const x = A[k], y = B[k]; if (!y) { r.eksik.push(k); continue; } let d = 0; for (let i = 0; i < 3; i++) d = Math.max(d, Math.abs(x.mn[i] - y.mn[i]), Math.abs(x.mx[i] - y.mx[i])); maxb = Math.max(maxb, d);
      const ve = x.v === y.v, te = x.t === y.t, be = d < 0.005; vA += x.v; vB += y.v; tA += x.t; tB += y.t; if (ve) vE++; if (te) tE++; if (be) bE++; if (!ve || !te || !be) r.farkli.push({ k, v: [x.v, y.v], t: [x.t, y.t], bboxMm: +(d*1000).toFixed(2) });
      const a1 = DA[k].area, a2 = DB[k].area; const allk = new Set([...Object.keys(a1), ...Object.keys(a2)]); for (const m of allk) { const p = a1[m] || 0, q = a2[m] || 0; areaTot += p; if (Math.abs(p - q) > 0.01 * Math.max(p, q, 1) && Math.abs(p - q) > 0.05) { matdiff += Math.abs(p - q); r.malz.push([k, m, +p.toFixed(2), +q.toFixed(2)]); } }
      const c = DB[k].col; colmin = Math.min(colmin, c.mn); colsum += c.sum; coln += c.n; coldev = Math.max(coldev, c.dev); }
    Object.assign(r, { nodeVEsit: vE, nodeTEsit: tE, nodeBBoxEsit: bE, maxBboxMm: +(maxb*1000).toFixed(2), vertsRef: vA, vertsBlend: vB, trisRef: tA, trisBlend: tB, blendColMin: +colmin.toFixed(3), blendColMean: +(colsum/coln).toFixed(3), blendColGrayDev: +coldev.toFixed(4), malzAlanFarkiYuzde: +(100*matdiff/areaTot).toFixed(3) });
    res[key][which] = r; console.log(key, which, `düğüm ${r.nodes}/${r.blendNodes} | köşe eşit ${vE}, üçgen eşit ${tE}, bbox eşit ${bE} (max ${r.maxBboxMm}mm) | köşe ${vA}/${vB} üçgen ${tA}/${tB} | blend renk min ${r.blendColMin} ort ${r.blendColMean} sapma ${r.blendColGrayDev} | malzeme alan farkı %${r.malzAlanFarkiYuzde} | eksik ${r.eksik.length}`); }
}
fs.writeFileSync('karsil.json', JSON.stringify(res, null, 1));
