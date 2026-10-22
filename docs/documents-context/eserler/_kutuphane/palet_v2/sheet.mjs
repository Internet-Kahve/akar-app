import { PNG } from 'pngjs'; import fs from 'fs'; import path from 'path';
const ROOT = '/Users/ksenophon/Desktop/internet-kahve/akar-app/docs/documents-context/eserler';
const M = [['ulu-cami','v26'],['yildirim-bayezid-bedesteni','v06'],['koza-han','v14'],['orhan-bey-kulliyesi','v07'],['orhan-bey-hamami','hamam_v05'],['emir-han','emir_v04'],['orhan-gazi-turbesi','v02']];
const half = p => { const w = p.width >> 1, h = p.height >> 1; const o = new PNG({ width: w, height: h }); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let k = 0; k < 4; k++) { let s = 0; for (const [dx, dy] of [[0,0],[1,0],[0,1],[1,1]]) s += p.data[((2*y+dy)*p.width + 2*x+dx)*4 + k]; o.data[(y*w+x)*4+k] = s >> 2; } return o; };
for (const [d, kd] of M) { const dir = path.join(ROOT, d, '3d/kontrol', kd); const c = new PNG({ width: 1800, height: 1600 });
  for (let i = 0; i < 1800*1600; i++) { c.data[i*4]=0xF1; c.data[i*4+1]=0xEC; c.data[i*4+2]=0xE0; c.data[i*4+3]=255; }
  ['guneydogu','kuzeydogu','guneybati','kuzeybati'].forEach((n, i) => { const p = half(PNG.sync.read(fs.readFileSync(path.join(dir, n + '.png')))); const ox = (i % 2) * 900, oy = Math.floor(i / 2) * 800;
    for (let y = 0; y < 800; y++) for (let x = 0; x < 900; x++) { const a = p.data[(y*900+x)*4+3]/255; const j = ((oy+y)*1800+ox+x)*4, q = (y*900+x)*4; for (let k = 0; k < 3; k++) c.data[j+k] = Math.round(p.data[q+k]*a + c.data[j+k]*(1-a)); } });
  fs.writeFileSync(path.join(dir, 'dort_yon.png'), PNG.sync.write(c)); }
console.log('ok');
