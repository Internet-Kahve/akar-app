// AKAR · pişirilmiş harita kontrol görüntüleri (3 Kasım 2026). Uygulamanın three.js'i ve harita ışığıyla (pisik_gorsel.html):
//   sütunlar: mevcut gündüz (ışıklı, gölgeli) | pişmiş gündüz (ışıksız) | mevcut gece | pişmiş gece
//   satırlar: güneş tarafından ve karşısından, yukarıdan 45° eğik, ortografik
// Çıktı: <3d>/kontrol/<surum>_pisik/yan_yana_gunes_tarafi.png, yan_yana_karsi_taraf.png, tek tek kareler (kare/), rapor.json → gorsel
// Kullanım: GT_DIR=<kurulum (sharp)> node pisik_gorsel.mjs <eser/3d klasörü> <surum>   (repo kökündeki three ve playwright kullanılır)
// 4 Kasım 2026: --uygulama <etiket> [--gun=<3d'ye göre yol> --gece=<yol>]: yalnız uygulama kamerası ölçümü (pisik_olcum.mjs):
//   mevcut | pişmiş | fark üçlüleri <3d>/kontrol/<surum>_pisik/uygulama/<etiket>/, tablo rapor.json → uygulama_olcum.<etiket>
import { createRequire } from 'module'; import path from 'path'; import fs from 'fs'; import http from 'http'; import { fileURLToPath } from 'url';
const AY = path.dirname(fileURLToPath(import.meta.url)); const REPO = path.resolve(AY, '../../../../..');
const sharp = createRequire(path.join(process.env.GT_DIR, 'x.js'))('sharp');
const { chromium } = createRequire(path.join(REPO, 'package.json'))('@playwright/test');
const [U, surum] = process.argv.slice(2);
const MJ = JSON.parse(fs.readFileSync(path.join(U, 'model.json'), 'utf8'));
const lightSource = fs.readFileSync(path.join(REPO, 'apps/web/src/lib/scene-light.ts'), 'utf8');
function light(name) {
  const block = lightSource.split('export const ' + name + ' = {')[1].split('};')[0];
  return Object.fromEntries([...block.matchAll(/^  (\w+): (0x[0-9a-f]+|[\d.]+),/gm)].map(([,k,v]) => [k, Number(v)]));
}
const lights = {gunduz: light('MAP_LIGHT'), gece: light('MAP_NIGHT_LIGHT')};
const az = (MJ.on_yonu + lights.gunduz.acrossDeg - MJ.yaw + 360) % 360;
const K = path.join(U, 'kontrol', `${surum}_pisik`); fs.mkdirSync(path.join(K, 'kare'), { recursive: true });
const kok = { '/three/': path.join(REPO, 'node_modules', 'three') + '/', '/m/': path.join(U, 'export') + '/', '/u/': path.resolve(U) + '/', '/': AY + '/' };
const tur = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.glb': 'model/gltf-binary', '.wasm': 'application/wasm' };
const sv = http.createServer((q, s) => {
  const u = decodeURIComponent(q.url.split('?')[0]); const k = Object.keys(kok).find(p => u.startsWith(p));
  const f = path.join(kok[k], u.slice(k.length)); if (!fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'content-type': tur[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s);
});
await new Promise(ok => sv.listen(0, '127.0.0.1', ok));
const port = sv.address().port;
let tarayici;
try { tarayici = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu'] }); }
catch { tarayici = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); }
const sy = await tarayici.newPage({ viewport: { width: 900, height: 700 } });
sy.setDefaultTimeout(120000);
const hata = []; sy.on('pageerror', e => hata.push(String(e))); sy.on('console', m => m.type() === 'error' && hata.push(m.text()));
await sy.addInitScript(lights => {window.lights = lights}, lights);
await sy.goto(`http://127.0.0.1:${port}/pisik_gorsel.html`); await sy.waitForFunction('window.hazir === true');
const gun = `/m/${MJ.glb}.glb`, gec = `/m/${MJ.glb_gece}.glb`;
const arg = k => process.argv.find(a => a.startsWith(`--${k}=`))?.split('=')[1];
if (process.argv.includes('--yansit-uygulama')) {   // 4 Kasım 2026: pişmiş dosyaların atlası mevcut harita dosyasından (yerinde)
  const {yansitUygulama, bakislar} = await import('./pisik_yansit.mjs'); const BAKISLAR = bakislar(az);
  const sinir = {gunduz: 1100000, gece: 1300000}, sonuc = {};
  for (const [tema, mevcut] of [['gunduz', gun], ['gece', gec]]) {
    const pismis = mevcut.replace('.glb', '_harita_pisik.glb');
    // her zaman salt Cycles dosyasından başla (pisik.py blend/<glb>_harita_pisik_cycles.glb yazar)
    const cyc = path.join(U, 'blend', path.basename(pismis).replace('.glb', '_cycles.glb'));
    if (fs.existsSync(cyc)) fs.copyFileSync(cyc, path.join(U, 'export', pismis.slice(3)));
    // gece mahyası: 'yok' (varsayılan) = pişmiş dosyadaki mahya texelleri ve alfası olduğu gibi kalır; 'mevcut' = gece dosyasının
    // dokusundan alfa + yansıtılmış hale rengi (UV düzeni değiştiyse gerekir); başka yol = o pişmiş dosyanın mahyası (4 Kasım: hatalı, kullanmayın)
    const mahyaKaynak = arg('mahya-kaynak') ?? 'yok';
    const mahya = tema === 'gece' && mahyaKaynak !== 'yok' ? await sy.evaluate(c => window.mahyaAktar(c), {mevcut, pismis, kaynak: mahyaKaynak === 'mevcut' ? null : `/u/${mahyaKaynak}`}) : null;
    sonuc[tema] = await yansitUygulama({file: path.join(U, 'export', pismis.slice(3)), sharp, limit: sinir[tema], mahya,
      render: () => sy.evaluate(c => window.yansitAtlas(c), {mevcut, pismis, ref: gun, ana: MJ.ana_parca, tema, gunesAz: az, bakislar: BAKISLAR, usDik: +(arg('usdik') ?? 2), mahyaRenk: tema === 'gece' && arg('mahya-kaynak') === 'mevcut',
        // --gece-atla=<düğüm,...>: o parçalar yansıtılmaz, önceki atlasta kalır (4 Kasım: Kasnak_Pencereleri denendi, kasnak gece karesini düzeltmedi)
        atla: tema === 'gece' ? (arg('gece-atla') ?? '').split(',').filter(Boolean) : []})});
    await sy.reload(); await sy.waitForFunction('window.hazir === true');
    console.log('YANSIT', tema, JSON.stringify(sonuc[tema]));
  }
  const rp = path.join(K, 'rapor.json'); const rapor = fs.existsSync(rp) ? JSON.parse(fs.readFileSync(rp, 'utf8')) : {};
  rapor.yansitma_uygulama = {...sonuc, bakislar: BAKISLAR}; fs.writeFileSync(rp, JSON.stringify(rapor, null, 1));
  if (!process.argv.includes('--uygulama')) { await tarayici.close(); sv.close(); process.exit(0); }
}
if (process.argv.includes('--uygulama')) {
  const etiket = process.argv[process.argv.indexOf('--uygulama') + 1];
  const { uygulamaOlc } = await import('./pisik_olcum.mjs');
  const dosyalar = { gunduz: { mevcut: gun, pismis: arg('gun') ? `/u/${arg('gun')}` : gun.replace('.glb', '_harita_pisik.glb') },
    gece: { mevcut: gec, pismis: arg('gece') ? `/u/${arg('gece')}` : gec.replace('.glb', '_harita_pisik.glb') } };
  const sonuc = await uygulamaOlc({ ciz: c => sy.evaluate(c => window.uygulama(c), c), sharp, K, etiket, dosyalar, ref: gun, ana: MJ.ana_parca, gunesAz: az, doku: arg('doku') ?? null });
  sonuc.hata = hata;
  const rp = path.join(K, 'rapor.json'); const rapor = fs.existsSync(rp) ? JSON.parse(fs.readFileSync(rp, 'utf8')) : {};
  (rapor.uygulama_olcum ??= {})[etiket] = sonuc; fs.writeFileSync(rp, JSON.stringify(rapor, null, 1));
  console.log('UYGULAMA', etiket, `${sonuc.gecen_440}/${sonuc.kare_440}`, JSON.stringify(sonuc.genel), hata.length ? 'HATA ' + hata.join(' | ') : '');
  await tarayici.close(); sv.close(); process.exit(0);
}
const raporYolu=path.join(K,'rapor.json');
const yansitma = fs.existsSync(raporYolu) ? JSON.parse(fs.readFileSync(raporYolu)).gorsel?.yansitma ?? {} : {};
if (process.argv.includes('--yansit')) {
  const {yansit} = await import('./pisik_yansit.mjs');
  for (const [tema, source, limit] of [['gunduz',gun,900000],['gece',gec,1100000]]) {
    const baked=source.replace('.glb','_harita_pisik.glb');
    yansitma[tema]=await yansit({file:path.join(U,'export',baked.slice(3)),sharp,limit,az,ortam:tema==="gunduz" ? path.join(K,"ortam_0.png") : null,
      render: async (camera, uv) => {
        const args={...camera, uv, ornek:!uv, tema, ref:gun, pisik:uv, ana:MJ.ana_parca, gunesAz:az,
          dosya:uv ? baked : source.replace('.glb','_sunum.glb')};
        const png=await sy.evaluate(c=>window.ciz(c),args);
        return sharp(Buffer.from(png.split(',')[1],'base64')).removeAlpha().raw().toBuffer();
      }});
  }
  await sy.reload(); await sy.waitForFunction('window.hazir === true');
  const {execFileSync}=await import('node:child_process');
  execFileSync(process.execPath,[path.join(AY,'pisik_dogrula.mjs'),U,surum]);
}
let geceDuzeltme;
if (process.argv.includes('--yansit') || process.argv.includes('--gece-ince')) {
  const {inceAyar}=await import('./pisik_yansit.mjs');
  const baked=gec.replace('.glb','_harita_pisik.glb');
  geceDuzeltme=await inceAyar({file:path.join(U,'export',baked.slice(3)),sharp,az,limit:1100000,
    render:async(camera,tur)=>{
      const args={...camera, uv:tur==='uv', ornek:tur!=='uv', tema:'gece', ref:gun, pisik:tur!=='sunum',
        ana:MJ.ana_parca,gunesAz:az,dosya:tur==='sunum'?gec.replace('.glb','_sunum.glb'):baked};
      const png=await sy.evaluate(c=>window.ciz(c),args);
      return sharp(Buffer.from(png.split(',')[1],'base64')).removeAlpha().raw().toBuffer();
    }});
  await sy.reload(); await sy.waitForFunction('window.hazir === true');
  const {execFileSync}=await import('node:child_process');
  execFileSync(process.execPath,[path.join(AY,'pisik_dogrula.mjs'),U,surum]);
}
const sutun = [
  ['mevcut gündüz', gun.replace('.glb','_sunum.glb'), false, 'gunduz'], ['pişmiş gündüz', `/m/${MJ.glb}_harita_pisik.glb`, true, 'gunduz'],
  ['mevcut gece', gec.replace('.glb','_sunum.glb'), false, 'gece'], ['pişmiş gece', `/m/${MJ.glb_gece}_harita_pisik.glb`, true, 'gece'],
];
const satir = [['gunes_tarafi', `güneş tarafından (${az}°)`, az], ['karsi_taraf', `karşı taraftan (${(az + 180) % 360}°)`, (az + 180) % 360]];
satir.push(['yan_sol','sol cephe',(az+90)%360], ['yan_sag','sağ cephe',(az+270)%360], ['kubbe','şadırvan kubbesi',az]);
const etiket = (t, w) => Buffer.from(`<svg width="${w}" height="44"><rect width="100%" height="100%" fill="#ffffff"/><text x="14" y="29" font-family="Helvetica, Arial" font-size="22" fill="#222">${t}</text></svg>`);
const gorsel = {}, oran = {}, dagilim = {gunduz:[], gece:[]};
// parlaklık oranı pişmiş / mevcut, yalnız model pikselleri (maske), görünen (ACES sonrası sRGB) parlaklıkta
const parlak = async b => { const { data, info } = await sharp(b).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const L = new Float32Array(info.width * info.height); for (let i = 0; i < L.length; i++) L[i] = 0.2126 * data[3 * i] + 0.7152 * data[3 * i + 1] + 0.0722 * data[3 * i + 2]; return L; };
async function karsilastir(ad, tema, a, b, M) {
  const A = await parlak(a), B = await parlak(b); const q = []; const img = Buffer.alloc(A.length * 3, 0);
  for (let i = 0; i < A.length; i++) {
    if (M[i] < 128) { img[3 * i] = img[3 * i + 1] = img[3 * i + 2] = 255; continue; }
    const k = A[i] ? B[i] / A[i] : B[i] ? Infinity : 1; q.push(k); const t = Math.max(-1, Math.min(1, Math.log2(k) / Math.log2(2)));   // ±1 = yarı / iki kat
    img[3 * i] = t < 0 ? 255 : Math.round(255 * (1 - t)); img[3 * i + 1] = Math.round(255 * (1 - Math.abs(t))); img[3 * i + 2] = t > 0 ? 255 : Math.round(255 * (1 + t));
  }
  for (const v of q) dagilim[tema].push(v);
  q.sort((x, y) => x - y); const y = p => q[Math.floor(p * (q.length - 1))];
  const f = path.join(K, `oran_${ad}_${tema}.png`); await sharp(img, { raw: { width: 900, height: 700, channels: 3 } }).png().toFile(f);
  oran[`${ad}_${tema}`] = { medyan: y(0.5), p10: y(0.1), p90: y(0.9), koyu_pay: q.filter(x => x < 0.75).length / q.length, acik_pay: +(q.filter(x => x > 1.33).length / q.length).toFixed(3),
    ort_mevcut: +(A.reduce((s, v, i) => s + (M[i] >= 128 ? v : 0), 0) / q.length).toFixed(1), ort_pismis: +(B.reduce((s, v, i) => s + (M[i] >= 128 ? v : 0), 0) / q.length).toFixed(1), resim: path.relative(U, f) };
}
for (const [ad, baslik, kamAz] of satir) {
  const kareler = [];
  const maskeler = {};
  for (const [tema, path] of [['gunduz',gun],['gece',gec]]) {
    const url = await sy.evaluate(c => window.ciz(c), {dosya:path, ref:gun, tema, kamAz, yakin:ad==='kubbe', gunesAz:az, ana:MJ.ana_parca, maske:true});
    maskeler[tema] = await parlak(Buffer.from(url.split(',')[1],'base64'));
  }
  for (const [ust, dosya, pisik, tema] of sutun) {
    if (!fs.existsSync(path.join(U, 'export', dosya.slice(3)))) { kareler.push(null); continue; }
    const url = await sy.evaluate(c => window.ciz(c), { dosya, ref: gun, pisik, tema, kamAz, yakin: ad === "kubbe", gunesAz: az, ana: MJ.ana_parca || null });
    const b = Buffer.from(url.split(',')[1], 'base64'); const f = path.join(K, 'kare', `${ad}_${ust.replace(/ /g, '_').replace(/ş/g, 's').replace(/ü/g, 'u').replace(/ğ/g, 'g')}.png`);
    fs.writeFileSync(f, b); kareler.push({ b, ust });
  }
  if (kareler[0] && kareler[1]) await karsilastir(ad, 'gunduz', kareler[0].b, kareler[1].b, maskeler.gunduz);
  if (kareler[2] && kareler[3]) await karsilastir(ad, 'gece', kareler[2].b, kareler[3].b, maskeler.gece);
  const w = 900, h = 700, ust = 44; const parca = [];
  kareler.forEach((k, i) => { if (!k) return; parca.push({ input: etiket(`${k.ust} · ${baslik}`, w), left: i * w, top: 0 }, { input: k.b, left: i * w, top: ust }); });
  const f = path.join(K, `yan_yana_${ad}.png`);
  await sharp({ create: { width: w * sutun.length, height: h + ust, channels: 3, background: '#ffffff' } }).composite(parca).png().toFile(f);
  gorsel[ad] = path.relative(U, f);
}
await tarayici.close(); sv.close();
const rp = path.join(K, 'rapor.json'); const rapor = fs.existsSync(rp) ? JSON.parse(fs.readFileSync(rp, 'utf8')) : {};
rapor.parlaklik = {};
for (const [tema, q] of Object.entries(dagilim)) {
  q.sort((a,b)=>a-b);
  const quantile=p=>q[Math.floor(p*(q.length-1))];
  rapor.parlaklik[tema]={medyan:quantile(.5),p10:quantile(.1),p90:quantile(.9),koyu_pay:q.filter(v=>v<.75).length/q.length,piksel:q.length};
}
for (const value of Object.values(oran)) {
  value.gecti = value.medyan >= .97 && value.medyan <= 1.03 && value.p10 >= .85 && value.p90 <= 1.15 && value.koyu_pay <= .02;
}
rapor.kalan = [];
for (const [ad,v] of Object.entries(oran)) if (!v.gecti) {
  const sorun = [];
  if(v.medyan < .97 || v.medyan > 1.03) sorun.push('medyan');
  if(v.p10 < .85) sorun.push('p10');
  if(v.p90 > 1.15) sorun.push('p90');
  if(v.koyu_pay > .02) sorun.push('koyu_pay');
  rapor.kalan.push({gorunum:ad, olcut:sorun, aciklama:'Birden fazla açıdan ortalanan sabit doku, görünüşe bağlı parlama ve camın arkasındaki ayrıntıları her açıdan aynı veremiyor.'});
}
for(const [tema,d] of Object.entries(rapor.dosyalar)) {
  if (!d.gecti) rapor.kalan.push({tema, olcut:'yapisal', aciklama:'Dosya doğrulamasının alt alanlarına bakınız.'});
  if (d.blend.uv.doluluk < .45) rapor.kalan.push({tema, olcut:'doluluk', deger:d.blend.uv.doluluk});
  for (const [parca,cm] of Object.entries(d.cm_piksel)) if(cm>12) rapor.kalan.push({tema,parca,cm,olcut:'cm/piksel',aciklama:'2048 atlas ve paketleme payında bu parçaya ayrılan UV alanı yetersiz.'});
}
rapor.gecti = rapor.yapisal_gecti && !rapor.kalan.length && !hata.length;
rapor.isik = { ...lights, yerel_azimut:az, dunya_azimut:(MJ.on_yonu+lights.gunduz.acrossDeg)%360 };
rapor.sinirlar.parlaklik = {medyan:[.97,1.03],p10_min:.85,p90_max:1.15,koyu_pay_max:.02};
rapor.gorsel = { yansitma, geceDuzeltme, ...gorsel, oran, kamera: 'ortografik, yukarıdan 45°', isik: 'mevcut: uygulamanın MAP_LIGHT / MAP_NIGHT_LIGHT kurulumu (three r186, ACES); pişmiş: ışıksız', hata };
fs.writeFileSync(rp, JSON.stringify(rapor, null, 1));
console.log('GORSEL', JSON.stringify(gorsel)); console.log('ORAN', JSON.stringify(oran), hata.length ? 'HATA ' + hata.join(' | ') : '');
