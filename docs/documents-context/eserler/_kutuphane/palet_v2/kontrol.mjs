import { makeIO, hex2s, lin2hex, s2hex, hsvV, texMean, nodeStats, worldMat, xf } from './lib.mjs';
import { CFG, glbPath } from './palet.mjs';
import fs from 'fs'; import path from 'path';
import { PNG } from 'pngjs';
const ROOT = '/Users/ksenophon/Desktop/internet-kahve/akar-app/docs/documents-context/eserler';
const ROLES = { // eser -> {kursun:[mat adları], tugla:[...]}
  'ulu-cami': { kursun: ['Cati', 'Kubbe.001', 'Sad_Kursun'], tugla: ['Minare_Tugla_Derzi'] },
  'bedesten': { kursun: ['Cati', 'Bant_Cati', 'Kubbe'], tugla: ['Tugla'] },
  'koza-han': { kursun: ['Cati_Kursun', 'Kursun', 'Cati_Metal', 'Sacak', 'Baca_Kulah'], tugla: ['Tugla'] },
  'orhan-camii': { kursun: ['Kubbe'], tugla: ['Tugla'] },
  'orhan-hamam': { kursun: ['Kubbe'], tugla: ['Tugla'] },
  'emir-han': { kursun: ['Cati_Kursun'], tugla: ['Tugla'] },
  'turbe': { kursun: ['Kursun'], tugla: [] },
};
function domTex(buf) { const p = PNG.sync.read(Buffer.from(buf)); const m = new Map(); for (let i = 0; i < p.width * p.height; i++) { if (p.data[i*4+3] < 10) continue; const k = p.data[i*4]<<16|p.data[i*4+1]<<8|p.data[i*4+2]; m.set(k,(m.get(k)||0)+1);} const k=[...m.entries()].sort((a,b)=>b[1]-a[1])[0][0]; return '#'+k.toString(16).padStart(6,'0').toUpperCase(); }

function matTable(doc, structOnly) {
  const area = new Map(); let tot = 0; const tmp=[[0,0,0],[0,0,0],[0,0,0]];
  for (const n of doc.getRoot().listNodes()) { const me = n.getMesh(); if (!me) continue; if (structOnly && /^(Cevre_|Olcek_|Zemin)/.test(n.getName())) continue; const M = worldMat(n);
    for (const p of me.listPrimitives()) { const pos = p.getAttribute('POSITION'), ix = p.getIndices(); const nt = ix.getCount()/3; let a = 0;
      for (let t = 0; t < nt; t++) { const v=[0,1,2].map(k=>{const q=[0,0,0]; pos.getElement(ix.getScalar(t*3+k),q); return xf(M,q)}); const u=[v[1][0]-v[0][0],v[1][1]-v[0][1],v[1][2]-v[0][2]], w=[v[2][0]-v[0][0],v[2][1]-v[0][1],v[2][2]-v[0][2]]; a += 0.5*Math.hypot(u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]); }
      const nm = p.getMaterial(); area.set(nm, (area.get(nm)||0)+a); tot += a; } }
  const rows = [];
  for (const [m, a] of area) {
    const bf = m.getBaseColorFactor(); const hex = lin2hex(bf); const bt = m.getBaseColorTexture(); let eff = hex, tm = null;
    const row = { ad: m.getName(), baseColor: hex, doku: !!bt, kaba: +m.getRoughnessFactor().toFixed(2), metal: +m.getMetallicFactor().toFixed(2), alan_yuzde: +(100*a/tot).toFixed(2) };
    if (bt) { const t = texMean(bt.getImage()); const f = bf.slice(0,3).map(v => Math.pow(v, 1/2.4)); // yaklaşık: sRGB faktör
      const fs_ = hex2s(hex).map(v => v/255); eff = s2hex(t.mean.map((v,i)=>v*fs_[i])); row.doku_ort = s2hex(t.mean); row.doku_dominant = domTex(bt.getImage()); row.doku_opak = +t.opaque.toFixed(2); row.etkin = eff; }
    row.V = +hsvV(eff).toFixed(3); rows.push(row);
  }
  return { rows, tot };
}
function colStats(doc, names) {
  let mn = 9, sum = 0, n = 0, mx = 0, dev = 0; const per = {}; const t = [0,0,0,1];
  for (const nd of doc.getRoot().listNodes()) { const me = nd.getMesh(); if (!me) continue; if (names && !names.has(nd.getName())) continue;
    let pm = 9, pd = 0; for (const p of me.listPrimitives()) { const c = p.getAttribute('COLOR_0'); if (!c) continue; for (let i = 0; i < c.getCount(); i++) { c.getElement(i, t); const g = (t[0]+t[1]+t[2])/3; mn = Math.min(mn,g); mx = Math.max(mx,g); sum += g; n++; const d = Math.max(Math.abs(t[0]-g),Math.abs(t[1]-g),Math.abs(t[2]-g)); dev = Math.max(dev,d); pm = Math.min(pm,g); pd = Math.max(pd,d); } }
    per[nd.getName()] = { min: +pm.toFixed(3), maxdev: +pd.toFixed(4) }; }
  return { min: +mn.toFixed(3), mean: +(sum/n).toFixed(3), max: +mx.toFixed(3), maxGrayDev: +dev.toFixed(4), n, per };
}
const io = await makeIO(); const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(CFG);
const summary = {};
for (const key of keys) {
  const cfg = CFG[key];
  const oa = await io.read(glbPath(cfg, cfg.from, false)), na = await io.read(glbPath(cfg, cfg.to, false)), ns = await io.read(glbPath(cfg, cfg.to, true)), os = await io.read(glbPath(cfg, cfg.from, true));
  const structNames = new Set(na.getRoot().listNodes().map(n=>n.getName()));
  const so = nodeStats(oa), sn = nodeStats(na); let vEq=0, tEq=0, bEq=0, N=0, maxd=0; const diffs=[];
  for (const k of Object.keys(so)) { N++; const x=so[k], y=sn[k]; if(!y){diffs.push({k,missing:true});continue;} let d=0; for(let i=0;i<3;i++) d=Math.max(d,Math.abs(x.mn[i]-y.mn[i]),Math.abs(x.mx[i]-y.mx[i])); maxd=Math.max(maxd,d);
    const ve = x.v===y.v, te = x.t===y.t, be = d<0.001; if(ve)vEq++; if(te)tEq++; if(be)bEq++; if(!ve||!te||!be) diffs.push({mesh:k, vOld:x.v,vNew:y.v,tOld:x.t,tNew:y.t,bboxMm:+(d*1000).toFixed(3)}); }
  const mt = matTable(na, false), mo = matTable(oa, false);
  const cs = colStats(na), cso = colStats(oa), css = colStats(ns, structNames), csso = colStats(os, structNames);
  const large = mt.rows.filter(r => r.alan_yuzde >= 1 && r.doku_opak !== undefined ? r.doku_opak >= 0.9 : r.alan_yuzde >= 1);
  const lowV = mt.rows.filter(r => r.alan_yuzde >= 1 && r.V < 0.80 && (r.doku_opak === undefined || r.doku_opak >= 0.9));
  const EX=/^(Pencere|Kapi|Ahsap|Demir|Bant_koyu|Dukkan_Vitrin|Hol_Cam|Sad_Ahsap)/;
  const lowVsiz = lowV.filter(r=>!EX.test(r.ad) && r.baseColor !== '#BCC2C6');
  const veryLow = mt.rows.filter(r => r.V < 0.60 && (r.doku_opak === undefined || r.doku_opak >= 0.9));
  const rl = ROLES[key]; const pick = (tbl, names) => tbl.rows.filter(r => names.includes(r.ad)).map(r => ({ ad: r.ad, baseColor: r.baseColor, doku_dominant: r.doku_dominant, etkin: r.etkin }));
  const duzRoles = mt.rows.filter(r => !cfg.tex[r.ad] && /^(Tas|Mermer|Krem|Tugla|Ahsap_Kapi|Ahsap_Koyu|Pencere|Demir|Alem|Kursun_Dikis|Kursun|Almasik)$/.test(r.ad)).length;
  const rapor = { eser: key, eski: cfg.from, yeni: cfg.to,
    geometri: { mesh: N, kose_esit: vEq, ucgen_esit: tEq, bbox_esit_1mm: bEq, max_bbox_sapma_mm: +(maxd*1000).toFixed(3), farklar: diffs },
    kose_rengi_uygulama_glb: { eski: { min: cso.min, ort: cso.mean }, yeni: { min: cs.min, ort: cs.mean, max: cs.max, max_gri_sapma: cs.maxGrayDev }, mesh_basina_ihlal_gri: Object.entries(cs.per).filter(([k,v])=>v.maxdev>0.02).map(([k])=>k), mesh_basina_ihlal_min: Object.entries(cs.per).filter(([k,v])=>v.min<0.80).map(([k,v])=>[k,v.min]) },
    kose_rengi_sunum_yapi: { eski: { min: csso.min, ort: csso.mean }, yeni: { min: css.min, ort: css.mean, max_gri_sapma: css.maxGrayDev } },
    kursun: { eski: pick(mo, rl.kursun), yeni: pick(mt, rl.kursun) }, tugla: { eski: pick(mo, rl.tugla), yeni: pick(mt, rl.tugla) },
    buyuk_yuzey_V_080_alti_istisnasiz: lowVsiz, buyuk_yuzey_V_080_alti_istisna_roller_dahil: lowV, istisna_roller: 'pencere, kapi, koyu ahsap, demir, vitrin/izgara ve kurşun (kurşun V≥0,80 ölçütü dışı: kullanıcı kararı 21 Ekim)', V_060_alti: veryLow };
  const dir = path.join(ROOT, cfg.dir, '3d/kontrol', cfg.kontrol); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'renkler.json'), JSON.stringify({ eser: key, surum: cfg.to, not: 'baseColor = malzeme faktörü; dokulu malzemede etkin = faktör x doku ortalaması (opak piksel). Alan yüzdesi uygulama GLB yapı yüzeyi.', malzemeler: mt.rows.sort((a,b)=>b.alan_yuzde-a.alan_yuzde) }, null, 1));
  fs.writeFileSync(path.join(dir, 'kontrol_rapor.json'), JSON.stringify(rapor, null, 1));
  summary[key] = rapor; console.log(key, 'geo', `${vEq}/${N} köşe, ${tEq}/${N} üçgen, ${bEq}/${N} bbox, maxbbox ${(maxd*1000).toFixed(3)}mm`, '| köşe rengi yeni min', cs.min, 'ort', cs.mean, 'dev', cs.maxGrayDev, '| eski', cso.min, cso.mean, '| sunum yapı', css.min, css.mean, css.maxGrayDev);
}
fs.writeFileSync('/private/tmp/claude-501/gt/summary.json', JSON.stringify(summary, null, 1));
