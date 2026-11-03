// AKAR · pişmiş harita dosyasının uygulama kamerasından ölçümü (4 Kasım 2026). pisik_gorsel.mjs --uygulama <etiket> çağırır.
// Mevcut: haritanın bugün çizdiği dosya (model.json glb / glb_gece), uygulamanın ışığıyla (pisik_gorsel.html window.uygulama).
// Kamera: 780 × 1688, perspektif, dikey 36,87°, eğim 60°, uzaklık 440 m (yakınlaşma 17,4) ve 220 m (güvenlik payı).
// Her detay karesi hedef noktaya bakan kameradan çizilir; kare, hedefin çevresinde 22 m'lik kesittir (440 m: 128 px, 220 m: 256 px).
// Ölçüler yalnız karenin kendi parçalarında (maske: düğüm, gerekirse malzeme), parlaklık kanalında (Rec. 709, sRGB, ton eşlemesi sonrası):
//   keskinlik  = pişmiş / mevcut Sobel enerjisi (gradyan karesi toplamı; maske 1 px aşındırılmış)
//   ssim       = 11 × 11 Gauss (σ 1,5) SSIM haritasının maskedeki ortalaması
//   parlaklik  = piksel başına pişmiş / mevcut oranının medyanı
//   renk_sapma = pişmiş rengi, mevcutun 5 × 5 komşuluğundaki Lab renk kutusunun dışında kalan piksel payı (L ±10, a/b ±8 pay)
// Genel: bütün kareler birleşik, tam çerçevede bütün bina pikselleri; p10, p90, %25'ten koyu pay (öncekiyle aynı ölçüt).
import path from 'node:path'; import fs from 'node:fs';

export const SINIR = { keskinlik_min: 0.80, ssim_min: 0.90, parlaklik: [0.97, 1.03], renk_sapma_max: 0.005 };
const DUNYA_M = 22;
// Detay kareleri (glTF yerel koordinatı, metre). kamAz: kameranın hedefe göre yerel azimutu; harita yönü = kamAz − 6 (yaw 174).
export const KARELER = [
  { ad: 'kursun_kubbe', baslik: 'kurşun kubbe ve ek çizgileri', hedef: [13.4, 19.5, 10.3], kamAz: 186, maske: { dugum: ['Kubbeler_19', 'Alemler'], malzeme: ['Kubbe', 'Alem_kursun'] } },
  { ad: 'sadirvan_kubbe', baslik: 'şadırvan kubbesi', hedef: [0.6, 19.6, -2.5], kamAz: 186, maske: { dugum: ['Sadirvan_Kubbe', 'Sadirvan_Iskeleti'] } },
  { ad: 'kasnak_pencere', baslik: 'kasnak pencereleri', hedef: [13.4, 17.4, 16.0], kamAz: 186, maske: { dugum: ['Kasnak_Pencereleri'] } },
  { ad: 'ust_cephe_pencere', baslik: 'üst cephe pencereleri', hedef: [-16, 8.5, 18.7], kamAz: 186, maske: { dugum: ['Cephe_Kuzey'], malzeme: ['Kafes_Beyaz', 'Pencere', 'Mermer'] } },
  { ad: 'alt_pencere', baslik: 'alt pencere parmaklıkları', hedef: [-16, 2.4, 18.3], kamAz: 186, maske: { dugum: ['Pencere_Girintileri'], malzeme: ['Demir_Yesil', 'Pencere', 'Ahsap', 'Mermer'] } },
  { ad: 'cephe_tas', baslik: 'cephe taş örgüsü', hedef: [-33.9, 7, -20], kamAz: 270, maske: { dugum: ['Cephe_Dogu'], malzeme: ['Tas_Orgusu_Hafif', 'Tas_Orgusu_Nis'] } },
  { ad: 'tac_kapi', baslik: 'taç kapı', hedef: [0.5, 6, 20.2], kamAz: 180, maske: { dugum: ['Tac_Kapi', 'Portal_Silmeleri', 'Giris_Cikintili_Blok'] } },
  { ad: 'alem_serefe', baslik: 'alem ve minare şerefesi', hedef: [32.5, 38, 22.3], kamAz: 180, maske: { dugum: ['Minare_1'] } },
];
export const UZAKLIK = [440, 220];

const lum = (d, n) => { const Y = new Float32Array(n); for (let i = 0; i < n; i++) Y[i] = 0.2126 * d[3 * i] + 0.7152 * d[3 * i + 1] + 0.0722 * d[3 * i + 2]; return Y; };
function lab(d, n) {
  const o = new Float32Array(3 * n), li = x => (x /= 255) <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4, f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  for (let i = 0; i < n; i++) {
    const r = li(d[3 * i]), g = li(d[3 * i + 1]), b = li(d[3 * i + 2]);
    const X = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047), Y = f(0.2126 * r + 0.7152 * g + 0.0722 * b), Z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
    o[3 * i] = 116 * Y - 16; o[3 * i + 1] = 500 * (X - Y); o[3 * i + 2] = 200 * (Y - Z);
  }
  return o;
}
function asindir(M, w, h) { const o = new Uint8Array(M.length); for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; o[i] = M[i] && M[i - 1] && M[i + 1] && M[i - w] && M[i + w] ? 1 : 0; } return o; }
function sobel(Y, M, w, h) { let e = 0; for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; if (!M[i]) continue;
  const gx = Y[i - w + 1] + 2 * Y[i + 1] + Y[i + w + 1] - Y[i - w - 1] - 2 * Y[i - 1] - Y[i + w - 1];
  const gy = Y[i + w - 1] + 2 * Y[i + w] + Y[i + w + 1] - Y[i - w - 1] - 2 * Y[i - w] - Y[i - w + 1]; e += gx * gx + gy * gy; } return e; }
function bulanik(A, w, h) {   // ayrık 11 tap Gauss, σ 1,5, kenarda kenar değeri
  const k = []; let s = 0; for (let i = -5; i <= 5; i++) { k.push(Math.exp(-i * i / 4.5)); s += k[k.length - 1]; } for (let i = 0; i < 11; i++) k[i] /= s;
  const t = new Float32Array(A.length), o = new Float32Array(A.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let v = 0; for (let j = -5; j <= 5; j++) v += k[j + 5] * A[y * w + Math.min(w - 1, Math.max(0, x + j))]; t[y * w + x] = v; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let v = 0; for (let j = -5; j <= 5; j++) v += k[j + 5] * t[Math.min(h - 1, Math.max(0, y + j)) * w + x]; o[y * w + x] = v; }
  return o;
}
function ssim(A, B, M, w, h) {
  const C1 = (0.01 * 255) ** 2, C2 = (0.03 * 255) ** 2, n = A.length, AA = new Float32Array(n), BB = new Float32Array(n), AB = new Float32Array(n);
  for (let i = 0; i < n; i++) { AA[i] = A[i] * A[i]; BB[i] = B[i] * B[i]; AB[i] = A[i] * B[i]; }
  const ma = bulanik(A, w, h), mb = bulanik(B, w, h), saa = bulanik(AA, w, h), sbb = bulanik(BB, w, h), sab = bulanik(AB, w, h);
  let s = 0, c = 0; const harita = new Float32Array(n);
  for (let i = 0; i < n; i++) { const va = saa[i] - ma[i] ** 2, vb = sbb[i] - mb[i] ** 2, cov = sab[i] - ma[i] * mb[i];
    harita[i] = ((2 * ma[i] * mb[i] + C1) * (2 * cov + C2)) / ((ma[i] ** 2 + mb[i] ** 2 + C1) * (va + vb + C2)); if (M[i]) { s += harita[i]; c++; } }
  return { deger: c ? s / c : null, harita };
}
function yabanci(La, Lb, M, w, h) {
  const o = new Uint8Array(M.length); let say = 0, top = 0; const pay = [10, 8, 8];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!M[i]) continue; top++;
    let dis = false;
    for (let c = 0; c < 3 && !dis; c++) { let lo = 1e9, hi = -1e9;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const v = La[3 * (yy * w + xx) + c]; lo = Math.min(lo, v); hi = Math.max(hi, v); }
      const v = Lb[3 * i + c]; if (v < lo - pay[c] || v > hi + pay[c]) dis = true; }
    if (dis) { o[i] = 1; say++; } }
  return { pay: top ? say / top : null, harita: o };
}
const medyan = q => { if (!q.length) return null; q.sort((a, b) => a - b); return q[Math.floor(0.5 * (q.length - 1))]; };

/** Bir karenin iki görüntüsü (RGB, w × h) ve maskesi: ölçüler, fark görüntüsü. */
export function olc(a, b, M8, w, h) {
  const n = w * h, M = new Uint8Array(n); for (let i = 0; i < n; i++) M[i] = M8[i] > 127 ? 1 : 0;
  const A = lum(a, n), B = lum(b, n), E = asindir(M, w, h);
  const ea = sobel(A, E, w, h), eb = sobel(B, E, w, h);
  const s = ssim(A, B, M, w, h), r = [];
  for (let i = 0; i < n; i++) if (M[i] && A[i] > 0) r.push(B[i] / A[i]);
  const y = yabanci(lab(a, n), lab(b, n), M, w, h);
  const fark = Buffer.alloc(3 * n);
  for (let i = 0; i < n; i++) {
    if (!M[i]) { fark[3 * i] = fark[3 * i + 1] = fark[3 * i + 2] = 40; continue; }
    const g = Math.min(255, Math.round(4 * Math.abs(B[i] - A[i])));
    if (y.harita[i]) { fark[3 * i] = 255; fark[3 * i + 1] = 0; fark[3 * i + 2] = 255; } else fark[3 * i] = fark[3 * i + 1] = fark[3 * i + 2] = g;
  }
  return { keskinlik: ea ? eb / ea : null, ssim: s.deger, parlaklik: medyan(r), renk_sapma: y.pay, piksel: M.reduce((s, v) => s + v, 0), fark };
}
export const gecti = o => o.keskinlik >= SINIR.keskinlik_min && o.ssim >= SINIR.ssim_min && o.parlaklik >= SINIR.parlaklik[0] && o.parlaklik <= SINIR.parlaklik[1] && o.renk_sapma <= SINIR.renk_sapma_max;

/** Bütün kareler, iki tema, iki uzaklık. ciz(args) → {png, x, y}. Çıktı: <K>/uygulama/<etiket>/, tablo döner. */
export async function uygulamaOlc({ ciz, sharp, K, etiket, dosyalar, ref, ana, gunesAz, doku = null }) {
  const D = path.join(K, 'uygulama', etiket); fs.mkdirSync(D, { recursive: true });
  const raw = async png => { const { data, info } = await sharp(Buffer.from(png.split(',')[1], 'base64')).removeAlpha().raw().toBuffer({ resolveWithObject: true }); return { data, w: info.width, h: info.height }; };
  const tablo = {}, genel = { gunduz: [], gece: [] }, sayfa = {};
  const etk = (t, w) => Buffer.from(`<svg width="${w}" height="30"><rect width="100%" height="100%" fill="#fff"/><text x="8" y="21" font-family="Helvetica, Arial" font-size="16" fill="#222">${t}</text></svg>`);
  for (const uz of UZAKLIK) for (const kare of KARELER) for (const tema of ['gunduz', 'gece']) {
    const ortak = { ref, ana, gunesAz, tema, hedef: kare.hedef, kamAz: kare.kamAz, uzaklik: uz };
    const mv = await ciz({ ...ortak, dosya: dosyalar[tema].mevcut });
    const pm = await ciz({ ...ortak, dosya: dosyalar[tema].pismis, doku });
    const mk = await ciz({ ...ortak, dosya: dosyalar.gunduz.mevcut, maske: kare.maske });
    const bina = await ciz({ ...ortak, dosya: dosyalar.gunduz.mevcut, maske: { dugum: ['*'] } });
    const [A, B, Mk] = [await raw(mv.png), await raw(pm.png), await raw(mk.png)];
    // genel: tam çerçeve, bütün bina (yalnız 440 m)
    if (uz === 440) { const Mb = await raw(bina.png); const a = lum(A.data, A.w * A.h), b = lum(B.data, B.w * B.h);
      for (let i = 0; i < a.length; i += 1) if (Mb.data[3 * i] > 127 && a[i] > 0) genel[tema].push(b[i] / a[i]); }
    const S = Math.round(128 * 440 / uz), x0 = Math.max(0, Math.min(A.w - S, Math.round(mv.x - S / 2))), y0 = Math.max(0, Math.min(A.h - S, Math.round(mv.y - S / 2)));
    const kes = d => { const o = Buffer.alloc(3 * S * S); for (let y = 0; y < S; y++) d.data.copy(o, 3 * y * S, 3 * ((y0 + y) * d.w + x0), 3 * ((y0 + y) * d.w + x0 + S)); return o; };
    const a = kes(A), b = kes(B), mm = kes(Mk), M8 = new Uint8Array(S * S); for (let i = 0; i < S * S; i++) M8[i] = mm[3 * i];
    const o = olc(a, b, M8, S, S);
    const anahtar = `${uz}m/${kare.ad}/${tema}`;
    tablo[anahtar] = { keskinlik: +o.keskinlik.toFixed(3), ssim: +o.ssim.toFixed(3), parlaklik: +o.parlaklik.toFixed(3), renk_sapma: +o.renk_sapma.toFixed(4), piksel: o.piksel, ...(uz === 440 && { gecti: gecti(o) }) };
    // üçlü: mevcut | pişmiş | fark (|Δ parlaklık| × 4, mor: renk sapması), 3 kat (440 m) / 1,5 kat (220 m) büyütülmüş
    const k = Math.round(384 / S * 100) / 100, Z = Math.round(S * k);
    const buyut = async buf => sharp(buf, { raw: { width: S, height: S, channels: 3 } }).resize(Z, Z, { kernel: 'nearest' }).png().toBuffer();
    const parca = [{ input: etk(`mevcut · ${kare.baslik} · ${tema} · ${uz} m`, Z), left: 0, top: 0 }, { input: etk(`pişmiş · ${etiket}`, Z), left: Z + 6, top: 0 },
      { input: etk(`fark · ss ${o.ssim.toFixed(2)} kes ${o.keskinlik.toFixed(2)} rs ${(100 * o.renk_sapma).toFixed(2)}%`, Z), left: 2 * (Z + 6), top: 0 },
      { input: await buyut(a), left: 0, top: 30 }, { input: await buyut(b), left: Z + 6, top: 30 }, { input: await buyut(o.fark), left: 2 * (Z + 6), top: 30 }];
    const f = path.join(D, `uclu_${uz}m_${kare.ad}_${tema}.png`);
    await sharp({ create: { width: 3 * Z + 12, height: Z + 30, channels: 3, background: '#fff' } }).composite(parca).png().toFile(f);
    (sayfa[`${uz}_${tema}`] ??= []).push(f);
  }
  for (const [ad, liste] of Object.entries(sayfa)) {   // tema ve uzaklık başına tek sayfa
    const meta = await sharp(liste[0]).metadata(); const parca = liste.map((f, i) => ({ input: f, left: 0, top: i * (meta.height + 8) }));
    await sharp({ create: { width: meta.width, height: liste.length * (meta.height + 8), channels: 3, background: '#fff' } }).composite(parca).png().toFile(path.join(D, `sayfa_${ad}.png`));
  }
  const g = {};
  for (const [tema, q] of Object.entries(genel)) { q.sort((x, y) => x - y); const p = t => +q[Math.floor(t * (q.length - 1))].toFixed(3);
    g[tema] = { medyan: p(0.5), p10: p(0.1), p90: p(0.9), koyu_pay: +(q.filter(v => v < 0.75).length / q.length).toFixed(4), piksel: q.length };
    g[tema].gecti = g[tema].medyan >= 0.97 && g[tema].medyan <= 1.03 && g[tema].p10 >= 0.85 && g[tema].p90 <= 1.15 && g[tema].koyu_pay <= 0.02; }
  const kabul = Object.entries(tablo).filter(([k]) => k.startsWith('440m/'));
  return { etiket, tarih: new Date().toISOString(), dosyalar, tablo, genel: g, gecen_440: kabul.filter(([, v]) => v.gecti).length, kare_440: kabul.length,
    kalan_440: kabul.filter(([, v]) => !v.gecti).map(([k, v]) => ({ kare: k, olcut: [v.keskinlik < SINIR.keskinlik_min && 'keskinlik', v.ssim < SINIR.ssim_min && 'ssim', (v.parlaklik < SINIR.parlaklik[0] || v.parlaklik > SINIR.parlaklik[1]) && 'parlaklik', v.renk_sapma > SINIR.renk_sapma_max && 'renk_sapma'].filter(Boolean) })),
    klasor: path.relative(path.dirname(K), D) };
}
