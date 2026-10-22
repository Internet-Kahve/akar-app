// AKAR · yedi uygulama modeline ortak palet + yumuşak pişirme (21 Ekim 2026)
import { makeIO, lin, srgb, hex2s, hex2lin, lin2hex, s2hex, hsvV, processTexture, texMean, nodeStats, writeDraco, worldMat, xf } from './lib.mjs';
import fs from 'fs'; import path from 'path';

const ROOT = '/Users/ksenophon/Desktop/internet-kahve/akar-app/docs/documents-context/eserler';
const LEAD = '#BCC2C6';
// düz (dokusuz) malzeme: eski hex -> yeni hex
const HEXMAP = {
  '#AEB6BC': LEAD, '#9AA2A8': LEAD, '#939FA8': LEAD, '#7C858C': LEAD, '#C3C9CD': LEAD, '#8E9498': LEAD,
  '#5E676E': '#98A1A8', '#7D858A': '#9AA2A7',
  '#ECEAE4': '#F5F4F0', '#E4E3DC': '#F5F4F0',
  '#D3BE98': '#E6D8BA', '#D8C6A2': '#E6D8BA',
  '#CC7A52': '#CF7F55', '#C0683F': '#CF7F55', '#B06A4A': '#CF7F55',
  '#4E3427': '#6B4A3A', '#505955': '#4B5654', '#36413F': '#4B5654', '#3E4A55': '#5A6672',
  '#EBD58A': '#F2E2A8', '#E9DFC6': '#E8DFCB', '#EDE8DC': '#E8DFCB',
  '#2F6B55': '#3F7A5C', '#A39A8B': '#D6CBB3',
};
const LEADSET = new Set([LEAD]);
// Duz (köşe rengiyle boyalı) için rol çapaları: eski saf renk -> yeni
const DUZ_ROLES = [
  { n: 'Tas',       old: ['#D3BE98', '#D8C6A2'], hex: '#E6D8BA', r: 0.70, m: 0 },
  { n: 'Mermer',    old: ['#ECEAE4'],            hex: '#F5F4F0', r: 0.40, m: 0 },
  { n: 'Krem',      old: ['#E8DFCB'],            hex: '#E8DFCB', r: 0.80, m: 0 },
  { n: 'Tugla',     old: ['#C0683F'],            hex: '#CF7F55', r: 0.70, m: 0 },
  { n: 'Ahsap_Kapi',old: ['#7A5134'],            hex: '#7A5134', r: 0.75, m: 0 },
  { n: 'Ahsap_Koyu',old: ['#4E3427'],            hex: '#6B4A3A', r: 0.75, m: 0 },
  { n: 'Pencere',   old: ['#3E4A55'],            hex: '#5A6672', r: 0.30, m: 0 },
  { n: 'Demir',     old: ['#36413F'],            hex: '#4B5654', r: 0.60, m: 0.30 },
  { n: 'Alem',      old: ['#C9A13B'],            hex: '#C9A13B', r: 0.35, m: 0.60 },
  { n: 'Kursun_Dikis', old: ['#98A1A8'],         hex: '#98A1A8', r: 0.45, m: 0.20 },
  { n: 'Kursun',    old: ['#C3C9CD'],            hex: LEAD,      r: 0.45, m: 0.20 },
  { n: 'Almasik',   old: ['#CFA986'],            hex: '#DDBD9C', r: 0.70, m: 0 },
];

const L = (t) => ({ tex: 'lead', hex: LEAD, ...t });
const T = (target) => ({ tex: 'tint', target });
const C = (o = {}) => ({ tex: 'classes', ...o });

export const CFG = {
  'ulu-cami': { dir: 'ulu-cami', base: 'ulu-cami', from: 'v25', to: 'v26', kontrol: 'v26',
    tex: { Tas_Orgusu_Hafif: T('#E2D1AF'), Tas_Orgusu_Nis: T('#CDBC98'), Kafes_Beyaz: C(), 'Kafes_Beyaz.001': C(),
      Minare_Tugla_Derzi: C({ tan: '#E9DFCB' }) } },
  'bedesten': { dir: 'yildirim-bayezid-bedesteni', base: 'bedesten', from: 'v05', to: 'v06', kontrol: 'v06',
    tex: { Bant_Cati: L(), Kubbe: L(), Duvar: T('#DDBD9C'), Dukkan_Vitrin: C(), Pencere: C() } },
  'koza-han': { dir: 'koza-han', base: 'koza-han', from: 'v13', to: 'v14', kontrol: 'v14',
    tex: { Avlu_Halka: T('#D2C3A4'), Kesme_Tas: T('#E6D8BA'), Pencere_Izgara: C(), Petek_Sebeke: C(), Tabela: C(),
      Merdiven_Korkuluk: C({ tan: '#E6D8BA' }), Duvar_Almasik: T('#DDBD9C'), Korkuluk_Beyaz: C(), Avlu_Zemin: T('#D2C3A4'),
      Arnavut: T('#D2C3A4'), Baca_Tugla: C(), Moloz: T('#DDBD9C'), Disli_Tugla: C(), Portal_On: T('#E6D8BA') } },
  'orhan-camii': { dir: 'orhan-bey-kulliyesi', base: 'orhan-bey-camii', from: 'v06', to: 'v07', kontrol: 'v07', duz: ['Duz'],
    tex: { Duvar: T('#DDBD9C'), Kubbe: L(), Almasik_Revak: T('#DDBD9C'), Alinlik_Baklava: C({ tan: '#E6D8BA' }), Alinlik_Dama: C({ tan: '#E6D8BA' }),
      Kemer: C({ tan: '#E6D8BA' }), Sebeke: C(), Izgara: C(), Kirpi: C({ tan: '#E6D8BA' }), Kurs: C({ tan: '#E6D8BA' }),
      Tas_Kesme: T('#E6D8BA'), Kasnak: T('#E6D8BA'), Minare: C({ tan: '#E6D8BA' }), Parmaklik: C() } },
  'orhan-hamam': { dir: 'orhan-bey-hamami', base: 'orhan-bey-hamami', from: 'v04', to: 'v05', kontrol: 'hamam_v05', duz: ['Duz'],
    tex: { Kirpi: C({ tan: '#E6D8BA' }), Kubbe: L(), Sebeke: C(), Kasnak: T('#DDBD9C'), Duvar: T('#E6D8BA') } },
  'emir-han': { dir: 'emir-han', base: 'emir-hani', from: 'v03', to: 'v04', kontrol: 'emir_v04',
    tex: { Revak_Ayak: C({ tan: '#E6D8BA' }), Duvar_Almasik: T('#DDBD9C'), Korkuluk_Beyaz: C(), Kirpi_Sacak: C({ tan: '#E6D8BA' }),
      Baca_Tugla: C(), Pencere_Izgara: C(), Duvar_Moloz: T('#DDBD9C'), Avlu_Tas: T('#D2C3A4') } },
  'turbe': { dir: 'orhan-gazi-turbesi', base: 'orhan-gazi-turbesi', from: 'v01', to: 'v02', kontrol: 'v02',
    tex: { Kursun: L(), Hol_Cam: C(), Sebeke_Kapi: C(), Sebeke_Beyaz: C() } },
};

function f(cfg, ver, sun) { return path.join(ROOT, cfg.dir, '3d/export', `${cfg.base}_${ver}${sun ? '_sunum' : ''}.glb`); }
export { f as glbPath };

function fitRole(c) { // c: lineer rgb. dön: {role, ao}
  const mag = Math.hypot(...c); let best = null;
  DUZ_ROLES.forEach((R, ri) => R.old.forEach(h => {
    const A = hex2lin(h); const aa = A[0] * A[0] + A[1] * A[1] + A[2] * A[2];
    let s = (c[0] * A[0] + c[1] * A[1] + c[2] * A[2]) / aa;
    const res = Math.hypot(c[0] - s * A[0], c[1] - s * A[1], c[2] - s * A[2]) / Math.max(mag, 1e-4) + (s > 1.06 ? (s - 1.06) * 3 : 0);
    if (!best || res < best.res) best = { ri, s, res };
  }));
  return best;
}

export async function run(key, opts = {}) {
  const cfg = CFG[key]; const io = await makeIO();
  const oldApp = f(cfg, cfg.from, false), oldSun = f(cfg, cfg.from, true);
  const appDoc0 = await io.read(oldApp); const structNames = new Set(appDoc0.getRoot().listNodes().map(n => n.getName()));
  const report = { eser: key, from: cfg.from, to: cfg.to, files: {} };
  for (const sun of [false, true]) {
    const doc = await io.read(sun ? oldSun : oldApp); const root = doc.getRoot();
    const oldStats = nodeStats(doc);
    // yapı sınırı (dünya Y)
    let ymin = 1e9, ymax = -1e9; const tmp = [0, 0, 0];
    const structNodes = root.listNodes().filter(n => n.getMesh() && structNames.has(n.getName()));
    for (const n of structNodes) { const M = worldMat(n); for (const p of n.getMesh().listPrimitives()) { const pos = p.getAttribute('POSITION'); for (let i = 0; i < pos.getCount(); i++) { pos.getElement(i, tmp); const y = xf(M, tmp)[1]; ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); } } }
    const H = ymax - ymin;
    const matCache = new Map(); const roleMats = new Map(); const matInfo = [];
    const newMat = (old) => {
      if (matCache.has(old)) return matCache.get(old);
      const nm = doc.createMaterial(old.getName()); nm.copy(old);
      const name = old.getName(); const oldHex = lin2hex(old.getBaseColorFactor()); const bt = old.getBaseColorTexture();
      let info = { name, eski: oldHex, tex: !!bt };
      if (bt) {
        const spec = cfg.tex[name]; if (!spec) throw new Error(`${key}: dokulu malzeme için spec yok: ${name}`);
        const r = processTexture(bt.getImage(), spec);
        const t2 = doc.createTexture(name + '_p').setImage(r.png).setMimeType('image/png');
        nm.setBaseColorTexture(t2); // textureInfo korunur (copy)
        const ti = old.getBaseColorTextureInfo(), ni = nm.getBaseColorTextureInfo(); ni.setTexCoord(ti.getTexCoord()); ni.setWrapS(ti.getWrapS()); ni.setWrapT(ti.getWrapT()); ni.setMinFilter(ti.getMinFilter()); ni.setMagFilter(ti.getMagFilter());
        if (spec.tex === 'lead') { nm.setBaseColorFactor([...hex2lin(spec.hex), old.getBaseColorFactor()[3]]); nm.setRoughnessFactor(0.45).setMetallicFactor(0.20); info.hex = spec.hex; info.mod = 'kursun-doku'; }
        else { const bf = old.getBaseColorFactor(); info.hex = '#FFFFFF'; info.mod = spec.tex; }
        info.texOrt = s2hex(r.mean); info.opaque = +r.opaque.toFixed(2);
      } else {
        const nh = HEXMAP[oldHex] || oldHex; nm.setBaseColorFactor([...hex2lin(nh), old.getBaseColorFactor()[3]]);
        if (nh === LEAD) nm.setRoughnessFactor(0.45).setMetallicFactor(0.20);
        info.hex = nh; info.mod = nh === oldHex ? 'ayni' : 'esle';
      }
      info.matRef = nm; matInfo.push(info); matCache.set(old, nm); return nm;
    };
    const duzMat = (ri, oldMat) => {
      const R = DUZ_ROLES[ri]; if (roleMats.has(ri)) return roleMats.get(ri);
      const m = doc.createMaterial(R.n).setBaseColorFactor([...hex2lin(R.hex), 1]).setRoughnessFactor(R.r).setMetallicFactor(R.m).setDoubleSided(oldMat.getDoubleSided());
      roleMats.set(ri, m); matInfo.push({ name: R.n, eski: '(köşe rengi)', hex: R.hex, tex: false, mod: 'duz-rol', matRef: m }); return m;
    };
    const ao = (a, y) => { const nv = 1 - (1 - Math.min(1, a)) * (0.125 / 0.30); return nv * (0.92 + 0.08 * (y - ymin) / H); };
    const duzStat = {};
    for (const n of structNodes) {
      const M = worldMat(n); const mesh = n.getMesh();
      for (const p of mesh.listPrimitives().slice()) {
        const oldM = p.getMaterial(); const col = p.getAttribute('COLOR_0'); const pos = p.getAttribute('POSITION'); const cnt = pos.getCount();
        const isDuz = cfg.duz && cfg.duz.includes(oldM.getName());
        const ys = new Float32Array(cnt); for (let i = 0; i < cnt; i++) { pos.getElement(i, tmp); ys[i] = xf(M, tmp)[1]; }
        const ncomp = col.getElementSize(); const arr = col.getArray().slice(); const c4 = [0, 0, 0, 1]; const roleV = new Int16Array(cnt).fill(-1);
        for (let i = 0; i < cnt; i++) {
          col.getElement(i, c4); let a;
          if (isDuz) { const b = fitRole(c4); roleV[i] = b.ri; a = Math.max(0.70, Math.min(1, b.s)); duzStat[DUZ_ROLES[b.ri].n] = (duzStat[DUZ_ROLES[b.ri].n] || 0) + 1; }
          else a = (c4[0] + c4[1] + c4[2]) / 3;
          const v = ao(a, ys[i]); for (let k = 0; k < 3; k++) arr[i * ncomp + k] = v; if (ncomp === 4) arr[i * ncomp + 3] = 1;
        }
        col.setArray(arr);
        if (!isDuz) { p.setMaterial(newMat(oldM)); continue; }
        // Duz: rol başına primitif ayır
        const idx = p.getIndices(); const ia = idx.getArray(); const tc = ia.length / 3; const triRole = new Int16Array(tc);
        for (let t = 0; t < tc; t++) { const rr = [roleV[ia[t * 3]], roleV[ia[t * 3 + 1]], roleV[ia[t * 3 + 2]]]; triRole[t] = (rr[0] === rr[1] || rr[0] === rr[2]) ? rr[0] : rr[1] === rr[2] ? rr[1] : rr[0]; }
        for (let pass = 0; pass < 12; pass++) { // ortak köşeleri tek role zorla (köşe sayısı korunsun)
          const vc = new Map(); for (let t = 0; t < tc; t++) for (let k = 0; k < 3; k++) { const v = ia[t * 3 + k]; if (!vc.has(v)) vc.set(v, {}); const o = vc.get(v); o[triRole[t]] = (o[triRole[t]] || 0) + 1; }
          const vm = new Map(); for (const [v, o] of vc) { let b = null, bc = -1; for (const r in o) if (o[r] > bc || (o[r] === bc && +r === roleV[v])) { b = +r; bc = o[r]; } vm.set(v, b); }
          let ch = 0; for (let t = 0; t < tc; t++) { const rr = [vm.get(ia[t * 3]), vm.get(ia[t * 3 + 1]), vm.get(ia[t * 3 + 2])]; const nr = (rr[0] === rr[1] || rr[0] === rr[2]) ? rr[0] : rr[1] === rr[2] ? rr[1] : triRole[t]; if (nr !== triRole[t]) { triRole[t] = nr; ch++; } }
          if (!ch) break; }
        const groups = new Map(); for (let t = 0; t < tc; t++) { if (!groups.has(triRole[t])) groups.set(triRole[t], []); groups.get(triRole[t]).push(t); }
        const attrs = p.listSemantics();
        for (const [ri, tris] of groups) {
          const remap = new Map(); const order = [];
          const nidx = new (ia.constructor)(tris.length * 3);
          tris.forEach((t, j) => { for (let k = 0; k < 3; k++) { const v = ia[t * 3 + k]; let r = remap.get(v); if (r === undefined) { r = order.length; remap.set(v, r); order.push(v); } nidx[j * 3 + k] = r; } });
          const np = doc.createPrimitive().setMode(p.getMode()).setMaterial(duzMat(ri, oldM));
          np.setIndices(doc.createAccessor().setType('SCALAR').setArray(nidx));
          for (const sem of attrs) {
            const A = p.getAttribute(sem); const es = A.getElementSize(); const src = A.getArray(); const dst = new (src.constructor)(order.length * es);
            order.forEach((v, j) => { for (let k = 0; k < es; k++) dst[j * es + k] = src[v * es + k]; });
            np.setAttribute(sem, doc.createAccessor().setType(A.getType()).setArray(dst).setNormalized(A.getNormalized()));
          }
          mesh.addPrimitive(np);
        }
        mesh.removePrimitive(p);
      }
    }
    // yeni sürüm dosyası
    const out = f(cfg, cfg.to, sun);
    await writeDraco(io, doc, out);
    report.files[sun ? 'sunum' : 'app'] = { out, duzStat, ymin, ymax, matInfo: matInfo.map(({ matRef, ...r }) => r) };
  }
  return report;
}
if (process.argv[1].endsWith('palet.mjs') && process.argv[2]) { const r = await run(process.argv[2]); console.log(JSON.stringify(r.files.app.duzStat), r.files.app.out); fs.writeFileSync(`/private/tmp/claude-501/gt/run_${process.argv[2]}.json`, JSON.stringify(r, null, 1)); }
