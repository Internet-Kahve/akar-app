import { PNG } from 'pngjs'; import fs from 'fs'; import path from 'path';
const ROOT = '/Users/ksenophon/Desktop/internet-kahve/akar-app/docs/documents-context/eserler';
const BG = [0xF1, 0xEC, 0xE0];
const rd = f => PNG.sync.read(fs.readFileSync(f));
function over(src, dst, ox, oy, scale = 1) { // dst opak; src alfa
  for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) { const i = (y * src.width + x) * 4; const a = src.data[i + 3] / 255; const dx = ox + x, dy = oy + y; if (dx < 0 || dy < 0 || dx >= dst.width || dy >= dst.height) continue; const j = (dy * dst.width + dx) * 4; for (let k = 0; k < 3; k++) dst.data[j + k] = Math.round(src.data[i + k] * a + dst.data[j + k] * (1 - a)); dst.data[j + 3] = 255; } }
function canvas(w, h) { const p = new PNG({ width: w, height: h }); for (let i = 0; i < w * h; i++) { p.data[i * 4] = BG[0]; p.data[i * 4 + 1] = BG[1]; p.data[i * 4 + 2] = BG[2]; p.data[i * 4 + 3] = 255; } return p; }
const M = { ulu: ['ulu-cami', 'v26'], bed: ['yildirim-bayezid-bedesteni', 'v06'], koza: ['koza-han', 'v14'], camii: ['orhan-bey-kulliyesi', 'v07'], ham: ['orhan-bey-hamami', 'hamam_v05'], emir: ['emir-han', 'emir_v04'], turbe: ['orhan-gazi-turbesi', 'v02'] };
function half(p) { const w = p.width >> 1, h = p.height >> 1; const o = new PNG({ width: w, height: h }); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let k = 0; k < 4; k++) { let s = 0; for (const [dx, dy] of [[0,0],[1,0],[0,1],[1,1]]) s += p.data[((2*y+dy)*p.width + 2*x+dx)*4 + k]; o.data[(y*w+x)*4+k] = s >> 2; } return o; }
for (const [k, [d, kd]] of Object.entries(M)) {
  const kk = {ulu:'ulu-cami',bed:'bedesten',koza:'koza-han',camii:'orhan-camii',ham:'orhan-hamam',emir:'emir-han',turbe:'turbe'}[k]; const dir = path.join(ROOT, d, '3d/kontrol', kd); const o = rd(`r2/${kk}/guneydogu.png`), n = rd(path.join(dir, 'guneydogu.png')); fs.mkdirSync(dir, { recursive: true });
  const c = canvas(3600, 1600); over(o, c, 0, 0); over(n, c, 1800, 0); fs.writeFileSync(path.join(dir, 'havadan_eski_yeni.png'), PNG.sync.write(c));
  fs.writeFileSync(path.join(dir, 'havadan.png'), PNG.sync.write(n));
}
// yedili: 4+3, her biri yarı çözünürlük
const keys = Object.keys(M); const NP = k => path.join(ROOT, M[k][0], '3d/kontrol', M[k][1], 'guneydogu.png'); const hh = keys.map(k => half(rd(NP(k))));
const c = canvas(900 * 4, 800 * 2); keys.forEach((k, i) => over(hh[i], c, (i % 4) * 900, Math.floor(i / 4) * 800));
fs.writeFileSync(path.join(ROOT, '_kutuphane/palet_v2_yedili.png'), PNG.sync.write(c));
const KK = {ulu:'ulu-cami',bed:'bedesten',koza:'koza-han',camii:'orhan-camii',ham:'orhan-hamam',emir:'emir-han',turbe:'turbe'}; const ho = keys.map(k => half(rd(`r2/${KK[k]}/guneydogu.png`))); const c2 = canvas(900 * 4, 800 * 2); keys.forEach((k, i) => over(ho[i], c2, (i % 4) * 900, Math.floor(i / 4) * 800));
fs.writeFileSync('r/yedili_eski.png', PNG.sync.write(c2));
console.log('ok');
