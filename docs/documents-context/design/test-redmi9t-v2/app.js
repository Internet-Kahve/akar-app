/* AKAR · Redmi 9T prototipi · v2 (27–28 Ekim 2026): Ulucami v27, «İçini göster», parça kartları; eser ayarları veriden (bkz. BENIOKU.md, v2 bölümü).
   v1 (test-redmi9t/) değişmedi. Figma `akar-yeni` mobil ve masaüstü ekranlarının çalışan hâli:
   keşif haritası (3D binalar + AKAR modelleri), eserler, rotalar, eser detayı (Fotoğraf | 3D), anlatım (Dinle | Oku).
   İçerik veri.json'dan gelir (hazirla.py, her eserin icerik klasöründen üretir). */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const $ = (s, k = document) => k.querySelector(s);
const $$ = (s, k = document) => [...k.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const yerel = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { return null; } };

/* ---------- ikonlar (lucide, strokeWidth 2) ---------- */
const IK = {
  search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  'chevron-left':'<path d="m15 18-6-6 6-6"/>', 'chevron-right':'<path d="m9 18 6-6-6-6"/>', 'chevron-down':'<path d="m6 9 6 6 6-6"/>',
  x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', check:'<path d="M20 6 9 17l-5-5"/>',
  headphones:'<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  'book-open':'<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  image:'<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  box:'<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  expand:'<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/>',
  shrink:'<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" x2="21" y1="10" y2="3"/><line x1="3" x2="10" y1="21" y2="14"/>',
  play:'<polygon points="6 3 20 12 6 21 6 3"/>', pause:'<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  'skip-back':'<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5"/>', 'skip-forward':'<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/>',
  'bookmark-plus':'<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/><line x1="12" x2="12" y1="7" y2="13"/><line x1="15" x2="9" y1="10" y2="10"/>',
  'locate-fixed':'<line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/>',
  plus:'<path d="M5 12h14"/><path d="M12 5v14"/>', minus:'<path d="M5 12h14"/>',
  move:'<polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  'volume-2':'<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/>',
  square:'<rect width="14" height="14" x="5" y="5" rx="2"/>',
  pointer:'<path d="m9 9 5 12 1.8-5.2L21 14Z"/><path d="M7.2 2.2 8 5.1"/><path d="m5.1 8-2.9-.8"/><path d="M14 4.1 12 6"/><path d="m6 12-1.9 2"/>',
  navigation:'<polygon points="3 11 22 2 13 21 11 13 3 11"/>', 'arrow-right':'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  camera:'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  'camera-off':'<line x1="2" x2="22" y1="2" y2="22"/><path d="M7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16"/><path d="M9.5 4h5L17 7h3a2 2 0 0 1 2 2v7.5"/><path d="M14.121 15.121A3 3 0 1 1 9.88 10.88"/>',
  'map-pin':'<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  'map-pin-off':'<path d="M12.75 7.09a3 3 0 0 1 2.16 2.16"/><path d="M17.072 17.072c-1.634 2.17-3.527 3.912-4.471 4.727a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 1.432-4.568"/><path d="m2 2 20 20"/><path d="M8.475 2.818A8 8 0 0 1 20 10c0 1.183-.31 2.377-.81 3.533"/><path d="M9.13 9.13a3 3 0 0 0 3.74 3.74"/>',
  'chevron-up':'<path d="m18 15-6-6-6 6"/>',
  'share-2':'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
  'rotate-cw':'<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
  puzzle:'<path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z"/>',
  history:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
};
const ic = (ad, boy = 20) => `<svg class="ic" width="${boy}" height="${boy}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IK[ad] || ''}</svg>`;
const ikonla = (k = document) => $$('[data-ic]', k).forEach((e) => { e.outerHTML = ic(e.dataset.ic, +(e.dataset.boy || 20)); });
const SUSLEME = '<div class="susleme" aria-hidden="true"><svg viewBox="0 0 28 12"><path d="M14 1 18 6 14 11 10 6Z M2 6h7 M19 6h7" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="14" cy="6" r="1.4" fill="currentColor"/></svg></div>';

/* güven etiketi */
const GUVEN = { 'Doğrulanmış':'dogrulanmis', 'Tarihsel çıkarım':'tarihsel', 'Temsili':'temsili' };
const guven = (g) => g ? `<span class="guven ${GUVEN[g] || 'dogrulanmis'}">${esc(g)}<span class="i">ⓘ</span></span>` : '';

/* AKAR harita pini: Figma akar-yeni «Harita pini» (1:544). Sivri kemer, gövde rengi = vakıftaki rol, ikon = eser türü.
   Normal (1:545) haritada 32 × 38; Seçili (1:548) 1,25× ve altın halka; Tamamlandı (1:552) sağ üstte altın ✓.
   Kemerin 40 × 48 kutusu her resimde aynı yerde, kutunun altı (y 48) haritadaki noktaya oturur. */
const KEMER_YOL = 'M20 1.5C26 5 33 11 33.5 20V33C33.5 34.6667 32.8333 36 31.5 37L22 45.5C20.6667 46.6333 19.3333 46.6333 18 45.5L8.5 37C7.16667 36 6.5 34.6667 6.5 33V20C7 11 14 5 20 1.5Z';
const PIN_IKON = {
  cami:'<path fill-rule="evenodd" d="M3 21V15H15V21H3ZM8 21V18.5C8 17.5 8.33333 16.6667 9 16C9.66667 16.6667 10 17.5 10 18.5V21H8Z"/><path d="M4 14C4 12.9391 4.52678 11.9217 5.46447 11.1716C6.40215 10.4214 7.67392 10 9 10C10.3261 10 11.5979 10.4214 12.5355 11.1716C13.4732 11.9217 14 12.9391 14 14H4Z"/><path d="M17.5 21V9H19.5V21H17.5Z"/><path d="M16.75 11H20.25V12H16.75V11Z"/><path d="M17.5 8L18.5 3L19.5 8H17.5Z"/>',
  han:'<path fill-rule="evenodd" d="M2 21V6H22V21H2ZM6 12.5V10.5C6 9.83333 6.41667 9.25 7.25 8.75C8.08333 9.25 8.5 9.83333 8.5 10.5V12.5H6ZM15.5 12.5V10.5C15.5 9.83333 15.9167 9.25 16.75 8.75C17.5833 9.25 18 9.83333 18 10.5V12.5H15.5ZM5.5 21V17.5C5.5 16.5 6.08333 15.6667 7.25 15C8.41667 15.6667 9 16.5 9 17.5V21H5.5ZM15 21V17.5C15 16.5 15.5833 15.6667 16.75 15C17.9167 15.6667 18.5 16.5 18.5 17.5V21H15Z"/>',
  hamam:'<path fill-rule="evenodd" d="M2 21V15H22V21H2ZM5 21V18.5C5 17.5 5.33333 16.6667 6 16C6.66667 16.6667 7 17.5 7 18.5V21H5Z"/><path d="M3 14C3 13.337 3.31607 12.7011 3.87868 12.2322C4.44129 11.7634 5.20435 11.5 6 11.5C6.79565 11.5 7.55871 11.7634 8.12132 12.2322C8.68393 12.7011 9 13.337 9 14H3Z"/><path d="M10 14C10 12.8065 10.5795 11.6619 11.6109 10.818C12.6424 9.97411 14.0413 9.5 15.5 9.5C16.9587 9.5 18.3576 9.97411 19.3891 10.818C20.4205 11.6619 21 12.8065 21 14H10Z"/>',
  turbe:'<path d="M6.5 10C6.5 6.5 9 5 12 3.5C15 5 17.5 6.5 17.5 10H6.5Z"/><path d="M3 11H21V12.5H3V11Z"/><path fill-rule="evenodd" d="M5 13.5H19C17.6667 13.5 17 14.1667 17 15.5V21H7V15.5C7 14.1667 6.33333 13.5 5 13.5ZM10.5 21V18C10.5 17 11 16.1667 12 15.5C13 16.1667 13.5 17 13.5 18V21H10.5Z"/>',
};
const ROL_RENK = { dini:'#2E7D32', su:'#2A6FB0', egitim:'#25477B', akar:'#9A5B2E' };
const ROL_AD = { dini:'Dinî', su:'Su', egitim:'Eğitim', akar:'Akar' };
const kemerSvg = (ikon, renk) => `<path d="${KEMER_YOL}" fill="${renk}" stroke="#FFFFFF" stroke-width="2"/><g transform="translate(10 13) scale(0.8333)" fill="#FFFFFF">${PIN_IKON[ikon]}</g>`;
const TAMAM_ROZET = '<circle cx="35" cy="5" r="6" fill="#C9A13B" stroke="#FFFFFF" stroke-width="2"/><path d="M32 5L34 7L38 3" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>';
const pinSvg = (ikon, renk, tamam = false, boy = 2) => `<svg xmlns="http://www.w3.org/2000/svg" width="${44 * boy}" height="${50 * boy}" viewBox="-2 -2 44 50">${kemerSvg(ikon, renk)}${tamam ? TAMAM_ROZET : ''}</svg>`;
const pinSeciliSvg = (ikon, renk, boy = 2) => `<svg xmlns="http://www.w3.org/2000/svg" width="${44 * boy}" height="${52 * boy}" viewBox="-2 -2 44 52"><path d="${KEMER_YOL}" fill="none" stroke="#C9A13B" stroke-width="6"/>${kemerSvg(ikon, renk)}</svg>`;
const svgResim = (svg) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });

/* ---------- veri ---------- */
const VERI = await (await fetch('veri.json', { cache:'no-store' })).json();   // önbellekteki eski veri yeni kodla açılmasın
VERI.eserler.forEach((e) => { e.gecmis ||= []; });
const ESER = Object.fromEntries(VERI.eserler.map((e) => [e.id, e]));
const ROTA = VERI.rotalar[0];
const SEHIR = VERI.sehir || { ad:'', merkez:[0, 0], zoom:16, foto_kunye:'', kaynakca:'' };   // şehir kaydı: veri/sehir/<sehir>.json
const galeriFoto = (e) => e.fotolar.filter((f) => f.sira).sort((a, b) => a.sira - b.sira);
const kapak = (e) => galeriFoto(e)[0] || e.fotolar[0];
const foto = (e, dosya) => e.fotolar.find((f) => f.dosya === dosya) || kapak(e);
const meta = (e) => [e.yil, e.yaptiran].filter(Boolean).join(' · ');
/* «Sonraki durak» yalnız rotada gezilirken: Rotayı başlat / Devam et / Evden gez ya da bir «Sonraki durak» düğmesiyle gelince durum.rotada açılır,
   haritaya (#/) dönünce kapanır. Listeden ya da pinden açılan eserde sonraki durak gösterilmez */
const sonrakiDurak = (e) => { if (!durum.rotada) return null; const i = ROTA.duraklar.indexOf(e.id); return i >= 0 && i < ROTA.duraklar.length - 1 ? ESER[ROTA.duraklar[i + 1]] : null; };
const resim = (f, sinif = '') => f ? `<img class="${sinif}" src="${esc(f.url)}" alt="${esc(f.alt)}" loading="lazy" decoding="async">` : `<div class="gorsel-yok ${sinif}">Görsel</div>`;

/* ---------- durum ---------- */
const durum = {
  masaustu: false, secili: null, filtre: new Set(['dini', 'akar', 'su', 'egitim']), sekme: 'eserler', arama: '',
  gorunum: yerel('akar.gorunum') || 'foto', doldur: yerel('akar.fotoKip') === 'doldur', altH: 'kapali',
};
const mq = matchMedia('(min-width: 900px)');
function duzenAyarla() { durum.masaustu = mq.matches; document.body.classList.toggle('d', durum.masaustu); document.body.classList.toggle('m', !durum.masaustu); }
duzenAyarla();
mq.addEventListener('change', () => { duzenAyarla(); yonlendir(); setTimeout(() => harita.resize(), 50); });
ikonla();

let toastZ;
function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toastZ); toastZ = setTimeout(() => (t.hidden = true), 2600); }

/* ---------- GLB önbelleği ---------- */
const draco = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/');
const yukleyici = new GLTFLoader().setDRACOLoader(draco);
const glbTampon = new Map();
const glbAl = (dosya) => { if (!glbTampon.has(dosya)) glbTampon.set(dosya, fetch(`modeller/${dosya}.glb`).then((r) => { if (!r.ok) throw new Error(dosya + ' ' + r.status); return r.arrayBuffer(); })); return glbTampon.get(dosya); };
const glbCoz = async (dosya) => { const b = await glbAl(dosya); return new Promise((res, rej) => yukleyici.parse(b.slice(0), '', res, rej)); };

/* =====================================================================
   HARİTA: AKAR stili, OSM 3D binaları, modellerimiz ve pinler
   ===================================================================== */
let stil;
try { stil = await (await fetch('akar-style.json')).json(); } catch { stil = { version:8, sources:{ osm:{ type:'raster', tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize:256 } }, layers:[{ id:'osm', type:'raster', source:'osm' }] }; }
const harita = new maplibregl.Map({
  container:'harita', style:stil, center:SEHIR.merkez, zoom: durum.masaustu ? (SEHIR.zoom_masaustu || SEHIR.zoom) : SEHIR.zoom, pitch:55, bearing:-12,
  minZoom:6, maxZoom:19.5, maxPitch:65, attributionControl:false, fadeDuration:0,
});
window.akarHarita = harita;
const IZLER = [];   // model taban izleri (lng/lat çokgen), bina gizleme ve dokunma için

/* Hikâyesi sonuna kadar dinlenen eser cihazda «bitti» olarak saklanır; pini Tamamlandı (✓) çizilir */
const bittiMi = (id) => yerel('akar.bitti.' + id) === '1';
const eserNoktalari = () => ({ type:'FeatureCollection', features:VERI.eserler.map((e) => ({ type:'Feature', geometry:{ type:'Point', coordinates:[e.lon, e.lat] }, properties:{ id:e.id, ad:e.ad, ikon:e.ikon, rol:e.rol, bitti:bittiMi(e.id) } })) });
async function haritaPinleriKur() {
  if (harita.getSource('eserler')) return;
  for (const ikon of ['cami', 'han', 'hamam', 'turbe']) {
    const renk = ['han', 'hamam'].includes(ikon) ? ROL_RENK.akar : ROL_RENK.dini;
    if (!harita.hasImage('pin-' + ikon)) harita.addImage('pin-' + ikon, await svgResim(pinSvg(ikon, renk)), { pixelRatio:2 });
    if (!harita.hasImage('pin-tamam-' + ikon)) harita.addImage('pin-tamam-' + ikon, await svgResim(pinSvg(ikon, renk, true)), { pixelRatio:2 });
    if (!harita.hasImage('pin-secili-' + ikon)) harita.addImage('pin-secili-' + ikon, await svgResim(pinSeciliSvg(ikon, renk)), { pixelRatio:2 });
  }
  if (harita.getSource('eserler')) return;
  harita.addSource('eserler', { type:'geojson', data:eserNoktalari() });
  const glif = !!harita.getStyle().glyphs;
  harita.addLayer({ id:'pin', type:'symbol', source:'eserler', layout:Object.assign({ 'icon-image':['concat', ['case', ['get', 'bitti'], 'pin-tamam-', 'pin-'], ['get', 'ikon']], 'icon-anchor':'bottom', 'icon-allow-overlap':true, 'icon-size':0.8 },
    glif ? { 'text-field':['step', ['zoom'], '', 15.2, ['get', 'ad']], 'text-font':['Noto Sans Bold'], 'text-size':12, 'text-line-height':1.333, 'text-anchor':'left', 'text-offset':[1.3, -1.6], 'text-optional':true } : {}),
    paint:{ 'text-color':'#25477B', 'text-halo-color':'#fff', 'text-halo-width':2 } });
  harita.addLayer({ id:'pin-secili', type:'symbol', source:'eserler', filter:['==', ['get', 'id'], ''], layout:{ 'icon-image':['concat', 'pin-secili-', ['get', 'ikon']], 'icon-anchor':'bottom', 'icon-offset':[0, 2], 'icon-allow-overlap':true, 'icon-size':1 } });
  filtreUygula();
}

/* --- modellerimiz: MapLibre özel katmanı + three.js (aynı GL bağlamı). Yerleşim test.html ile aynı. --- */
const yapiKatman = {
  id:'yapilar', type:'custom', renderingMode:'3d', items:[],
  onAdd(m, gl) { this.map = m; this.kamera = new THREE.Camera(); this.r = new THREE.WebGLRenderer({ canvas:m.getCanvas(), context:gl, antialias:true }); this.r.autoClear = false; VERI.eserler.forEach((e) => this.yukle(e)); },
  async yukle(e) {
    try {
      const gltf = await glbCoz(e.glb);
      /* OSM merkezine ana gövdenin ortası oturur (yan yapılar, avlu ve İç Koza kutuyu kaydırmasın) */
      const kutu = new THREE.Box3().setFromObject(gltf.scene);
      const anaAd = e.model && e.model.ana_parca, anaObj = anaAd && gltf.scene.getObjectByName(anaAd);
      const c = (anaObj ? new THREE.Box3().setFromObject(anaObj) : kutu).getCenter(new THREE.Vector3());
      const grup = new THREE.Group(); gltf.scene.position.set(-c.x, -kutu.min.y, -c.z); grup.add(gltf.scene);
      grup.rotation.y = -THREE.MathUtils.degToRad(e.yaw || 0);
      const sahne = new THREE.Scene(); sahne.add(grup);
      sahne.add(new THREE.HemisphereLight(0xffffff, 0xeef0f4, 2.3));
      const gunes = new THREE.DirectionalLight(0xffffff, 1.3); gunes.position.set(-0.5, 1, 0.7); sahne.add(gunes);
      const dolgu = new THREE.DirectionalLight(0xfff4e6, 0.5); dolgu.position.set(0.7, 0.55, -0.8); sahne.add(dolgu);
      const mc = maplibregl.MercatorCoordinate.fromLngLat([e.lon, e.lat], 0), k = mc.meterInMercatorCoordinateUnits();
      const l = new THREE.Matrix4().makeTranslation(mc.x, mc.y, mc.z).scale(new THREE.Vector3(k, -k, k)).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
      this.items.push({ id:e.id, sahne, l });
      IZLER.push({ id:e.id, cokgen:tabanIzi(e, kutu.min.x - c.x, kutu.max.x - c.x, kutu.min.z - c.z, kutu.max.z - c.z, 3), ana:anaObj ? new THREE.Box3().setFromObject(anaObj).getSize(new THREE.Vector3()) : kutu.getSize(new THREE.Vector3()) });
      binalariGuncelle(); this.map.triggerRepaint();
    } catch (err) { console.warn('model yüklenemedi', e.id, err); }
  },
  render(gl, matris) {
    if (this.map.getZoom() < 14.5) return;
    const p = new THREE.Matrix4().fromArray(matris);
    this.r.resetState();
    for (const it of this.items) { this.kamera.projectionMatrix.copy(p).multiply(it.l); this.r.render(it.sahne, this.kamera); }
  },
};
/* modelin taban dikdörtgeni (m, yerleşim noktasına göre; yaw ile döndürülmüş, pay eklenmiş) → [lng, lat] köşeleri */
/* sunum GLB'sinin yapıya ait olmayan parçaları (detayda görünür, tıklanmaz): ortak ad kuralı Zemin*, Cevre*, Olcek*;
   kurala uymayan eski adlar eserin model.json'ında «sunum_ek» listesiyle verilir (ör. Koza Han: Avlu_Agac, Avlu_Cim) */
const SUNUM_EK_KURAL = /^(Zemin|Cevre|Olcek)/;
const sunumEk = (e, ad) => SUNUM_EK_KURAL.test(ad) || !!(e && e.model && (e.model.sunum_ek || []).some((x) => ad.startsWith(x)));
/* ana parça (haritada modeli ortalamak için) eserin model.json'ından gelir: e.model.ana_parca */
function tabanIzi(e, x0, x1, z0, z1, pay) {
  const a = -THREE.MathUtils.degToRad(e.yaw || 0), ca = Math.cos(a), sa = Math.sin(a);
  return [[x0 - pay, z0 - pay], [x1 + pay, z0 - pay], [x1 + pay, z1 + pay], [x0 - pay, z1 + pay]].map(([x, z]) => {
    const dogu = x * ca + z * sa, guney = -x * sa + z * ca;
    return [e.lon + dogu / (111320 * Math.cos(e.lat * Math.PI / 180)), e.lat - guney / 110540];
  });
}
const alan = (c) => { let s = 0; for (let i = 0, j = c.length - 1; i < c.length; j = i++) s += (c[j][0] - c[i][0]) * (c[j][1] + c[i][1]); return Math.abs(s / 2) * 111320 * 110540 * Math.cos(c[0][1] * Math.PI / 180); };   // m²
const icinde = (p, c) => { let ic2 = false; for (let i = 0, j = c.length - 1; i < c.length; j = i++) { const [xi, yi] = c[i], [xj, yj] = c[j]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) ic2 = !ic2; } return ic2; };
/* OSM 3D binaları kendi katmanımızdan çizilir: harita karoları bu bölgede binaları birleştirilmiş gruplar (MultiPolygon)
   olarak veriyor, yani stilin building_3d katmanında tek bir binayı süzgeçle gizlemek mümkün değil (ya grubun hepsi ya hiçbiri).
   Yüklenen gruplar tek tek binalara ayrılır, modellerimizin taban izine düşenler çıkarılır, kalanlar aynı renk ve yükseklikle çizilir. */
let binaZ;
function binalariGuncelle() {
  clearTimeout(binaZ);
  binaZ = setTimeout(() => {
    const kaynak = harita.getSource('akar-bina'); if (!kaynak) return;
    const binalar = [], gorulen = new Set();
    for (const f of harita.querySourceFeatures('openmaptiles', { sourceLayer:'building' })) {
      const g = f.geometry, h = +f.properties.render_height || 0, b = +f.properties.render_min_height || 0;
      const cokgenler = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
      for (const c of cokgenler) {
        const halka = c[0]; if (!halka || halka.length < 4) continue;
        const m = halka.reduce((a, p) => [a[0] + p[0] / halka.length, a[1] + p[1] / halka.length], [0, 0]);
        const anahtar = halka.length + ':' + m[0].toFixed(6) + ',' + m[1].toFixed(6);   // karo sınırında aynı bina iki kez gelmesin
        if (gorulen.has(anahtar)) continue; gorulen.add(anahtar);
        if (IZLER.some((iz) => icinde(m, iz.cokgen) && alan(halka) < 1.6 * alan(iz.cokgen))) continue;   // altında bizim model var (modelden çok büyük çarşı çatıları kalır)
        binalar.push({ type:'Feature', properties:{ h, b }, geometry:{ type:'Polygon', coordinates:c } });
      }
    }
    kaynak.setData({ type:'FeatureCollection', features:binalar });
  }, 350);
}
function binaKatmaniKur() {
  if (harita.getSource('akar-bina')) return;
  harita.addSource('akar-bina', { type:'geojson', data:{ type:'FeatureCollection', features:[] } });
  harita.addLayer({ id:'akar-bina-3d', type:'fill-extrusion', source:'akar-bina', minzoom:15, paint:{
    'fill-extrusion-color':'#d0c6b4', 'fill-extrusion-opacity':0.55, 'fill-extrusion-vertical-gradient':true,
    'fill-extrusion-height':['interpolate', ['linear'], ['zoom'], 15, 0, 15.6, ['get', 'h']], 'fill-extrusion-base':['get', 'b'] } });
  if (harita.getLayer('building_3d')) harita.setLayoutProperty('building_3d', 'visibility', 'none');
}
function binaGorunum() { if (harita.getLayer('akar-bina-3d')) harita.setLayoutProperty('akar-bina-3d', 'visibility', harita.getPitch() > 5 ? 'visible' : 'none'); }

harita.on('style.load', () => {
  binaKatmaniKur();
  harita.addLayer(yapiKatman);
  haritaPinleriKur(); binaGorunum(); binalariGuncelle();
});
harita.on('sourcedata', (e) => { if (e.sourceId === 'openmaptiles' && e.isSourceLoaded) binalariGuncelle(); });
harita.on('pitchend', binaGorunum);
/* HaritaDaire (Figma): etiket gideceği modu yazar (düzken «3D», eğikken «2D»), halkadaki kuzey üçgeni bearing ile döner.
   Kullanıcı haritayı döndürdüyse (iki parmak, sağ tık, halkayı sürükleme) ilk basış yalnız kuzeyi yukarı getirir */
let elleDondu = false;
function daireCiz() {
  const d = $('#b-3d'), egik = harita.getPitch() > 5, donuk = elleDondu && Math.abs(harita.getBearing()) > 0.5;
  d.classList.toggle('egik', egik); d.querySelector('b').textContent = egik ? '2D' : '3D';
  d.querySelector('.halka').style.transform = `rotate(${-harita.getBearing()}deg)`;
  d.setAttribute('aria-label', donuk ? 'Kuzeyi yukarı getir' : egik ? '2D haritaya geç' : '3D haritaya geç');
}
harita.on('pitch', daireCiz); harita.on('rotate', daireCiz);
harita.on('rotatestart', (e) => { if (e.originalEvent) elleDondu = true; });

harita.on('click', (e) => {
  if (rotaModu) return;
  const kutu = [[e.point.x - 22, e.point.y - 48], [e.point.x + 22, e.point.y + 8]];
  const pin = harita.queryRenderedFeatures(kutu, { layers:['pin'] })[0];
  const id = pin ? pin.properties.id : (IZLER.find((iz) => icinde([e.lngLat.lng, e.lngLat.lat], iz.cokgen)) || {}).id;
  if (id) eserSec(id); else if (durum.secili) eserSec(null);
});
harita.on('mousemove', (e) => { const k = harita.queryRenderedFeatures(e.point, { layers:harita.getLayer('pin') ? ['pin'] : [] }).length || IZLER.some((iz) => icinde([e.lngLat.lng, e.lngLat.lat], iz.cokgen)); harita.getCanvas().style.cursor = k ? 'pointer' : ''; });
harita.on('move', popKonum);

$('#b-yakin').onclick = () => harita.zoomIn();
$('#b-uzak').onclick = () => harita.zoomOut();
(() => {   // halka (mobilde parmakla, masaüstünde fareyle) sürüklenerek döndürülür; 4 px'ten az hareket tıklamadır
  const d = $('#b-3d'); let bas = null, suruk = false;
  const aci = (e) => { const r = d.getBoundingClientRect(); return Math.atan2(e.clientY - r.top - r.height / 2, e.clientX - r.left - r.width / 2) * 180 / Math.PI; };
  d.addEventListener('pointerdown', (e) => { suruk = false; if (e.button === 0) bas = { x:e.clientX, y:e.clientY, a:aci(e), b:harita.getBearing() }; });
  d.addEventListener('pointermove', (e) => {
    if (!bas) return;
    if (!suruk && Math.hypot(e.clientX - bas.x, e.clientY - bas.y) < 4) return;
    if (!suruk) { suruk = true; d.setPointerCapture(e.pointerId); d.classList.add('suruk'); elleDondu = true; }
    harita.setBearing(bas.b - (aci(e) - bas.a));
  });
  const birak = () => { bas = null; d.classList.remove('suruk'); };
  d.addEventListener('pointerup', birak); d.addEventListener('pointercancel', birak);
  d.onclick = () => {
    if (suruk) { suruk = false; return; }
    if (elleDondu && Math.abs(harita.getBearing()) > 0.5) { elleDondu = false; harita.easeTo({ bearing:0, duration:500 }); return; }
    elleDondu = false;
    harita.easeTo(harita.getPitch() > 5 ? { pitch:0, bearing:0, duration:600 } : { pitch:60, bearing:-20, duration:600 });
  };
  daireCiz();
})();
$('#b-konum').onclick = () => {
  if (!navigator.geolocation) return toast('Konum desteklenmiyor');
  navigator.geolocation.getCurrentPosition((p) => harita.easeTo({ center:[p.coords.longitude, p.coords.latitude], zoom:16.5 }), () => { toast(`Konum izni yok · Evden gez: ${SEHIR.ad}`); harita.easeTo({ center:SEHIR.merkez, zoom:16.5 }); });
};

/* filtre çipleri (vakıf rolü) */
function ciplerHTML(masaustuPanel) {
  const rol = ['dini', 'su', 'egitim', 'akar'].map((r) => `<button class="cip filtre" data-rol="${r}" aria-pressed="${durum.filtre.has(r)}"><span class="nokta" style="background:${ROL_RENK[r]}"></span>${ROL_AD[r]}</button>`).join('');
  return masaustuPanel ? `<button class="cip koyu" data-rol="hepsi">Tümü</button>${rol}` : `<button class="cip koyu" id="cip-konum">${ic('navigation', 14)}Yakınımda ${ic('chevron-down', 14)}</button>${rol}`;
}
function filtreUygula() {
  if (harita.getLayer('pin')) harita.setFilter('pin', ['in', ['get', 'rol'], ['literal', [...durum.filtre]]]);
  $$('.cip.filtre').forEach((b) => b.setAttribute('aria-pressed', durum.filtre.has(b.dataset.rol)));
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('.cip[data-rol]'); if (!b) return;
  const r = b.dataset.rol;
  if (r === 'hepsi') durum.filtre = new Set(['dini', 'akar', 'su', 'egitim']);
  else if (durum.filtre.size === 4) durum.filtre = new Set([r]);
  else durum.filtre.has(r) ? durum.filtre.delete(r) : durum.filtre.add(r);
  if (!durum.filtre.size) durum.filtre = new Set(['dini', 'akar', 'su', 'egitim']);
  filtreUygula(); if (!location.hash.slice(2)) yonlendir();
});
$('#cipler').innerHTML = ciplerHTML(false);
$('#cipler').addEventListener('click', (e) => { if (e.target.closest('#cip-konum')) $('#b-konum').click(); });
for (const id of ['#arama-m', '#arama-d']) $(id).addEventListener('input', (e) => { durum.arama = e.target.value.trim().toLocaleLowerCase('tr'); if (location.hash.length > 2) location.hash = '#/'; else yonlendir(); });

/* =====================================================================
   3D GÖRÜNTÜLEYİCİ (eser detayı ve anlatım)
   ===================================================================== */
const SARI = new THREE.Color('#FFE27A'), ALTIN = new THREE.Color('#C9A13B');
/* v2 · «tıklanabilir parçaları göster» (28 Ekim, kullanıcı geri bildirimi): tek renk (sarı), her parça bir kez yanıp söner;
   parçalar aynı anda değil, sırayla ve dağınık zamanlarda yanar ki göz tek tek parçaları ayırt etsin. */
const FLAS_SURE = 700, FLAS_ARA = 90;   // ms: bir parçanın yanıp sönmesi · iki parçanın başlangıcı arası
/* v2 · «İçini göster» (27 Ekim 2026; fikir: Şekerhan 3D kat görüntüleyicisi). Üstten alta gruplar: en üstteki önce kalkar,
   iniş alttan başlar (Çatı oturmadan kubbeler inmez). Bir grup, üstündeki grup %35'in altına inmeden kalkmaya başlamaz.
   Yalnız bu parçaları taşıyan modellerde (şimdilik Ulucami v27) çalışır. */
/* Gruplar koddan değil veriden gelir: eserler/<eser>/3d/model.json → «ortu_gruplari» (hazirla.py veri.json'a e.model olarak yazar). */
const geriEsnek = (v) => 1 + 2.4 * (v - 1) ** 3 + 1.4 * (v - 1) ** 2;   // easeOutBack: oturuşta hafif esneme
const gorunurMu = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
/* Zemin katmanları (28 Ekim 2026): modellerde zemin yüzeyleri (kaide, sokak döşemesi, avlu, halka, çim) birbirinin üstünde
   yalnız 2–6 mm arayla duruyor. Uzaktan bakınca derinlik tamponunun çözünürlüğü (bir adım ≈ 5–10 mm) bu farkı ayırt edemez;
   kamera döndükçe hangi yüzeyin önde çizileceği piksel piksel değişir ve doku titreşir (z-fighting). Draco sıkıştırması da
   yükseklikleri ~7 mm'lik adımlara yuvarladığı için sorun modelde düzeltilse bile güvence gerekir.
   Esere özel ad yok: tabanda duran (üstü 40 cm'den alçak) ve 35 cm'den ince her mesh «zemin katmanı» sayılır, üste bakan
   yüzlerinin alan ağırlıklı ortalama yüksekliğine göre sıralanır; üstteki katman polygonOffset ile birkaç derinlik adımı
   kameraya yaklaştırılır. Böylece sıra her açıdan aynı kalır. En alttaki katmana dokunulmaz. */
function zeminKatmanlari(meshler) {
  const kutu = new THREE.Box3(), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), k = [];
  for (const m of meshler) {
    kutu.setFromObject(m);
    if (kutu.isEmpty() || kutu.max.y - kutu.min.y > 0.35 || kutu.max.y > 0.4) continue;
    const p = m.geometry.attributes.position, ix = m.geometry.index, N = ix ? ix.count : p.count;
    let alan = 0, top = 0;
    for (let t = 0; t + 2 < N; t += 3) {
      a.fromBufferAttribute(p, ix ? ix.getX(t) : t).applyMatrix4(m.matrixWorld);
      b.fromBufferAttribute(p, ix ? ix.getX(t + 1) : t + 1).applyMatrix4(m.matrixWorld);
      c.fromBufferAttribute(p, ix ? ix.getX(t + 2) : t + 2).applyMatrix4(m.matrixWorld);
      n.subVectors(b, a).cross(c.clone().sub(a)); const s = n.length() / 2;
      if (s < 1e-6 || n.y / (2 * s) < 0.95) continue;
      alan += s; top += s * (a.y + b.y + c.y) / 3;
    }
    if (alan > 0) k.push({ m, y:top / alan });
  }
  k.sort((p, q) => p.y - q.y);
  let sira = 0, onceki = -Infinity;
  for (const { m, y } of k) {
    if (y - onceki > 0.0005) { if (onceki > -Infinity) sira++; onceki = y; }
    if (sira) Object.assign(m.material, { polygonOffset:true, polygonOffsetFactor:-0.5 * sira, polygonOffsetUnits:-3 * sira });
  }
}

class Sahne3D {
  constructor(kap, { onParca, altBosluk } = {}) {
    this.kap = kap; this.onParca = onParca; this.altBosluk = altBosluk || (() => 0);
    this.r = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
    this.r.setPixelRatio(Math.min(devicePixelRatio, 1.5)); this.r.setClearColor(0xDCE3E4);
    kap.appendChild(this.r.domElement);
    this.sahne = new THREE.Scene();
    this.sahne.add(new THREE.HemisphereLight(0xffffff, 0xeef0f4, 2.3));
    const g = new THREE.DirectionalLight(0xffffff, 1.3); g.position.set(-0.5, 1, 0.7); this.sahne.add(g);
    const d = new THREE.DirectionalLight(0xfff4e6, 0.5); d.position.set(0.7, 0.55, -0.8); this.sahne.add(d);
    this.kam = new THREE.PerspectiveCamera(38, 1, 0.5, 5000);
    this.kont = new OrbitControls(this.kam, this.r.domElement);
    this.kont.enableDamping = true; this.kont.dampingFactor = 0.09; this.kont.maxPolarAngle = Math.PI * 0.49;
    this.kont.addEventListener('change', () => (this.kirli = true));
    this.secili = new Set(); this.vurgulu = new Set(); this.flas = 0; this.kart = null;
    this.ro = new ResizeObserver(() => this.boyut()); this.ro.observe(kap);
    this.isaretci();
    this.dongu = this.dongu.bind(this); this.raf = requestAnimationFrame(this.dongu);
  }
  boyut() {
    const w = this.kap.clientWidth, h = this.kap.clientHeight; if (!w || !h) return;
    this.r.setSize(w, h, false); this.kam.aspect = w / h;
    /* altta kart varsa kadrajın merkezi kartın yarısı kadar yukarı kayar (görünür alanın ortası) */
    const a = Math.min(this.altBosluk(), h * 0.6);
    if (a > 0) this.kam.setViewOffset(w, h + a, 0, a, w, h); else this.kam.clearViewOffset();
    this.gorunurH = h - a; this.kam.updateProjectionMatrix(); this.kirli = true;
  }
  async yukle(e) {
    this.eser = e;
    const gltf = await glbCoz(e.glb + '_sunum'); if (this.bitti) return;
    /* haritadaki yönle aynı: azimut 0 = kuzeyden bakış */
    this.kok = new THREE.Group(); this.kok.add(gltf.scene); this.kok.rotation.y = -THREE.MathUtils.degToRad(e.yaw || 0);
    this.sahne.add(this.kok); this.kok.updateMatrixWorld(true);
    /* kadraj yalnız yapıya göre (zemin, ağaçlar ve ölçek insanları kutuya girmez) */
    this.kutu = new THREE.Box3();
    for (const o of gltf.scene.children) if (!sunumEk(e, o.name)) this.kutu.expandByObject(o);
    const c = this.kutu.getCenter(new THREE.Vector3()), b = this.kutu.getSize(new THREE.Vector3());
    this.yaricap = b.length() / 2; this.boyY = b.y;
    this.merkez = new THREE.Vector3(c.x, this.kutu.min.y + b.y * 0.25, c.z);   // Merkez: kutunun yatay ortası (kadraj için tabandan biraz yukarıda)
    this.parcalar = new Map(); this.meshler = [];
    const adlar = new Set(gltf.parser.json.nodes.filter((n) => n.mesh !== undefined && !sunumEk(e, n.name)).map((n) => n.name));
    for (const ad of adlar) { const o = this.kok.getObjectByName(ad); if (o) this.parcalar.set(ad, o); }
    this.kok.traverse((o) => {
      if (!o.isMesh) return;
      o.material = o.material.clone(); o.material.emissive = new THREE.Color(0, 0, 0);
      let p = o; while (p && !adlar.has(p.name)) p = p.parent;
      o.userData.parca = p ? p.name : null; this.meshler.push(o);
    });
    zeminKatmanlari(this.meshler);
    /* v2: kalkan gruplar (yoksa this.kalkan = null) */
    this.kalkan = null; this.kalkanHedef = 1;
    const tanim = e.model && e.model.ortu_gruplari;
    if (tanim && tanim.every((g) => g.some((ad) => this.parcalar.has(ad)))) {
      this.kalkanH = Math.max(12, this.boyY * 0.45);
      this.kalkan = tanim.map((g) => {
        const parcalar = g.filter((ad) => this.parcalar.has(ad)).map((ad) => { const o = this.parcalar.get(ad); return { o, y0:o.position.y }; });
        const meshler = this.meshler.filter((m) => g.includes(m.userData.parca));
        meshler.forEach((m) => Object.assign(m.userData, { t0:m.material.transparent, o0:m.material.opacity, d0:m.material.depthWrite }));
        return { v:1, parcalar, meshler };
      });
    }
    this.kam.near = this.yaricap / 100; this.kam.far = this.yaricap * 30; this.kam.updateProjectionMatrix();
    this.kont.minDistance = this.yaricap * 0.3; this.kont.maxDistance = this.yaricap * 4;
    this.aci({ azimut:30, egim:28, uzaklik:'bütün yapı' }, false);
  }
  hedefNokta(ad) {
    if (!ad || ad === 'Merkez' || !this.parcalar.has(ad)) return this.merkez.clone();
    return new THREE.Box3().setFromObject(this.parcalar.get(ad)).getCenter(new THREE.Vector3());
  }
  aci(a, gecis = true) {
    if (!this.kok || !a) return;
    const u = a.uzaklik || '', R = this.yaricap;
    /* yapının tamamı (sınır küresi) görünür alana sığacak uzaklık; «yakın / orta / çatı» bunun kesirleri */
    const w = this.kap.clientWidth || 1, gh = this.gorunurH || this.kap.clientHeight || 1;
    const vfov = THREE.MathUtils.degToRad(this.kam.fov) * Math.min(1, gh / (this.kap.clientHeight || gh));
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * (w / gh));
    const sigdir = R / Math.sin(Math.min(vfov, hfov) / 2);
    this.kont.maxDistance = Math.max(R * 4, sigdir * 1.6);   // dar ekranda (mobil) sığdırma uzaklığı 4R'yi aşıyordu; kamera sınırda kalıp uzaklaşamıyordu
    const d = Math.min(R * 4, sigdir * (/yakın/.test(u) ? 0.42 : /orta/.test(u) ? 0.62 : /çatı/.test(u) ? 0.85 : 0.95));   // açılış kadrajı eskisi gibi en çok 4R; daha uzağa parmakla çıkılır
    const az = THREE.MathUtils.degToRad(a.azimut ?? 30), el = THREE.MathUtils.degToRad(Math.max(5, Math.min(85, a.egim ?? 30)));
    const hedef = this.hedefNokta(a.hedef);
    const konum = hedef.clone().add(new THREE.Vector3(Math.sin(az) * Math.cos(el) * d, Math.sin(el) * d, -Math.cos(az) * Math.cos(el) * d));
    if (!gecis || matchMedia('(prefers-reduced-motion: reduce)').matches) { this.kam.position.copy(konum); this.kont.target.copy(hedef); this.kont.update(); this.kirli = true; return; }
    this.tween = { t0:performance.now(), k0:this.kam.position.clone(), h0:this.kont.target.clone(), k1:konum, h1:hedef };
  }
  vurgula(adlar) { this.vurgulu = new Set((adlar || []).filter((a) => this.parcalar && this.parcalar.has(a))); this.vurguT0 = performance.now(); this.boya(); }
  sec(ad) { if (this.secili.has(ad)) this.secili.delete(ad); else { this.secili.clear(); this.secili.add(ad); } this.boya(); return this.secili.has(ad); }
  flasla() { this.flasT0 = performance.now(); this.boya(); }
  boya() {
    if (!this.meshler) return;
    const t = performance.now();
    const nabiz = this.vurguT0 && t - this.vurguT0 < 1200 ? 0.18 * Math.abs(Math.sin((t - this.vurguT0) / 1200 * Math.PI * 2)) : 0;
    const sira = this.flasSira || (this.flasSira = new Map([...this.parcalar.keys()].filter((ad) => this.tiklanir(ad)).map((ad, k, a) => [ad, (k * (a.length % 7 ? 7 : a.length % 5 ? 5 : 1)) % a.length])))   // sabit ama dağınık sıra;
    for (const m of this.meshler) {
      const e = m.material.emissive.setRGB(0, 0, 0), p = m.userData.parca;
      if (p && this.vurgulu.has(p)) e.copy(ALTIN).multiplyScalar(0.32 + nabiz);
      else if (p && this.secili.has(p)) e.copy(SARI).multiplyScalar(0.42);
      if (this.flasT0 && p) {
        const k = sira.get(p) ?? -1, y = k < 0 ? -1 : (t - this.flasT0 - k * FLAS_ARA) / FLAS_SURE;
        if (y > 0 && y < 1) e.add(SARI.clone().multiplyScalar(0.4 * Math.sin(y * Math.PI)));
      }
    }
    this.animBitis = Math.max(this.vurguT0 ? this.vurguT0 + 1200 : 0, this.flasT0 ? this.flasT0 + FLAS_SURE + (this.parcalar ? this.parcalar.size : 0) * FLAS_ARA : 0);
    this.kirli = true;
  }
  isaretci() {
    const el = this.r.domElement; let bas = null;
    el.addEventListener('pointerdown', (e) => (bas = { x:e.clientX, y:e.clientY, t:performance.now() }));
    el.addEventListener('pointerup', (e) => {
      if (!bas || !this.meshler) return;
      const hareket = Math.hypot(e.clientX - bas.x, e.clientY - bas.y), sure = performance.now() - bas.t; bas = null;
      if (hareket > 6 || sure > 600) return;
      const r = el.getBoundingClientRect(), n = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      const ray = new THREE.Raycaster(); ray.setFromCamera(n, this.kam);
      const hit = ray.intersectObjects(this.meshler, false).find((h) => h.object.userData.parca && gorunurMu(h.object) && h.object.material.opacity > 0.5);
      if (hit && !this.tiklanir(hit.object.userData.parca)) { this.secili.clear(); this.boya(); this.onParca && this.onParca(null); return; }
      const ad = hit ? hit.object.userData.parca : null;
      if (!ad) { this.secili.clear(); this.boya(); this.onParca && this.onParca(null); return; }
      const acik = this.sec(ad); this.onParca && this.onParca(acik ? ad : null);
    });
  }
  /* kural: kartı olan parça tıklanır; eserin hiç parça kartı yoksa (henüz hazırlanmamışsa) bütün parçalar adıyla tıklanır */
  tiklanir(ad) { const k = this.eser && this.eser.parcalar; return !k || !k.length || k.some((p) => p.adlar.includes(ad)); }
  kartBagla(el, ad) { this.kart = el ? { el, nokta:this.hedefNokta(ad) } : null; this.kirli = true; }
  /* v2 · kubbeleri kaldır (acik = true) / indir */
  kubbeler(acik, gecis = true) {
    if (!this.kalkan) return false;
    this.kalkanHedef = acik ? 0 : 1;
    if (!gecis || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.kalkan.forEach((g) => { g.v = this.kalkanHedef; this.kalkanUygula(g); }); this.kalkanAktif = false;
    } else { this.kalkanAktif = true; this.kalkanT = null; }
    this.kirli = true; return true;
  }
  azimut() { const v = this.kam.position.clone().sub(this.kont.target); return THREE.MathUtils.radToDeg(Math.atan2(v.x, -v.z)); }
  egim() { const v = this.kam.position.clone().sub(this.kont.target); return THREE.MathUtils.radToDeg(Math.asin(v.y / v.length())); }
  get kubbelerAcik() { return !!this.kalkan && this.kalkanHedef === 0; }
  kalkanUygula(g) {
    const e = geriEsnek(g.v), op = Math.max(0, Math.min(1, g.v));
    for (const p of g.parcalar) { p.o.position.y = p.y0 + (1 - e) * this.kalkanH; p.o.visible = g.v > 0.001; }
    for (const m of g.meshler) {
      const u = m.userData, saydam = op < 1 || u.t0;
      if (m.material.transparent !== saydam) { m.material.transparent = saydam; m.material.needsUpdate = true; }
      m.material.opacity = u.o0 * op; m.material.depthWrite = op < 1 ? false : u.d0;
    }
  }
  kalkanAdim(dt) {
    const G = this.kalkan, n = G.length, T = this.kalkanHedef; let aktif = false;
    for (let i = 0; i < n; i++) {
      const g = G[i], once = g.v;
      if (T < g.v && (i === 0 || G[i - 1].v <= 0.35)) g.v = Math.max(0, g.v - dt / 0.5);            // kalkış: üstteki önce
      else if (T > g.v && (i === n - 1 || G[i + 1].v >= 0.55)) g.v = Math.min(1, g.v + dt / 0.6);  // iniş: alttaki önce
      if (g.v !== once) this.kalkanUygula(g);
      if (g.v !== T) aktif = true;
    }
    return aktif;
  }
  dongu(t) {
    if (this.bitti) return;
    this.raf = requestAnimationFrame(this.dongu);
    if (this.tween) {
      const k = Math.min(1, (t - this.tween.t0) / 800), s = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      this.kam.position.lerpVectors(this.tween.k0, this.tween.k1, s); this.kont.target.lerpVectors(this.tween.h0, this.tween.h1, s);
      if (k >= 1) this.tween = null; this.kirli = true;
    }
    if (this.animBitis && t < this.animBitis + 50) this.boya();
    if (this.kalkanAktif) {
      const dt = this.kalkanT == null ? 1 / 60 : Math.min(0.05, (t - this.kalkanT) / 1000);
      this.kalkanT = t; this.kalkanAktif = this.kalkanAdim(dt); this.kirli = true;
    }
    if (this.kont.update()) this.kirli = true;
    if (!this.kirli || !this.kok) return;
    this.kirli = false;
    this.r.render(this.sahne, this.kam);
    if (this.kart) {
      const v = this.kart.nokta.clone().project(this.kam), w = this.kap.clientWidth, h = this.kap.clientHeight;
      const gor = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
      this.kart.el.style.opacity = gor ? 1 : 0;
      /* v2: büyük kart ekran dışına taşmasın; nokta kenara yakınsa kart içeride kalır (ok yine noktayı gösterir) */
      const kw = this.kart.el.offsetWidth || 0, kh = this.kart.el.offsetHeight || 0, pay = 12;
      const x = (v.x + 1) / 2 * w, y = (1 - v.y) / 2 * h;
      const kx = Math.min(Math.max(x, kw / 2 + pay), w - kw / 2 - pay), ky = Math.max(y, kh + 14 + 84);
      this.kart.el.style.left = kx + 'px'; this.kart.el.style.top = ky + 'px';
      this.kart.el.style.setProperty('--ok-x', Math.min(Math.max(x - kx, -kw / 2 + 18), kw / 2 - 18) + 'px');
    }
  }
  kapat() {
    this.bitti = true; cancelAnimationFrame(this.raf); this.ro.disconnect(); this.kont.dispose();
    this.sahne.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { Object.values(m).forEach((v) => v && v.isTexture && v.dispose()); m.dispose(); }); });
    this.r.dispose(); try { this.r.forceContextLoss(); } catch {} this.r.domElement.remove();
  }
}
let s3d = null;
function s3dKapat() { if (s3d) { s3d.kapat(); s3d = null; } if (typeof parcaKartKapat === 'function') parcaKartKapat(false); }

/* =====================================================================
   EKRANLAR
   ===================================================================== */
const gorus = $('#gorus'), panel = $('#panel-ic'), altIc = $('#alt-ic'), alt = $('#alt'), kartEl = $('#eser-kart'), pop = $('#eser-pop');
let rotaModu = false, rotaIsaret = [];

function altYukseklik(h) {   // h: durak adı ya da sayı (ekran yüksekliğine oran; sürükleyip bırakılan serbest yükseklik)
  durum.altH = h;
  const v = typeof h === 'number' ? Math.max(altEnAz(), Math.min(innerHeight * 0.92, innerHeight * h)) : h === 'tam' ? innerHeight * 0.92 : h === 'yarim' ? innerHeight * 0.55 : h === 'rota' ? innerHeight * 0.58 : altEnAz();
  document.documentElement.style.setProperty('--alt-h', Math.round(v) + 'px');
  if (!durum.masaustu && typeof harita !== 'undefined') harita.setPadding({ top:110, bottom:Math.min(v, innerHeight * 0.6), left:0, right:0 });
}
/* en alt durak: yalnız tutamak, Eserler | Rotalar ve «Bursa ▾» satırı görünür */
function altEnAz() {
  const b = altIc && altIc.querySelector('.baslik-satir');
  return b && b.offsetHeight ? Math.round(b.offsetTop + b.offsetHeight + 8) : 112;   // offsetTop #alt'a göre (tutamak dahil); sayfa gizliyken ölçülemez
}
/* alt sayfa sürükleme: tutamak ya da başlık bölgesi (sekmeler, «Bursa» satırı) parmağı izler, bırakılan yükseklikte kalır;
   yalnız en alta ya da en üste 48 px'ten yakınsa oraya oturur */
(() => {
  let y0 = null, h0 = 0, tutamak = false;
  alt.addEventListener('pointerdown', (e) => {
    const t = e.target.closest('#alt-tutamak, #alt-ic > .sekme-grup, #alt-ic > .baslik-satir'); if (!t) return;
    y0 = e.clientY; h0 = alt.getBoundingClientRect().height; tutamak = t.id === 'alt-tutamak'; alt.classList.add('surukle');
  });
  alt.addEventListener('pointermove', (e) => {
    if (y0 == null || Math.abs(y0 - e.clientY) < 6) return;
    if (!alt.hasPointerCapture(e.pointerId)) alt.setPointerCapture(e.pointerId);
    document.documentElement.style.setProperty('--alt-h', Math.max(altEnAz(), Math.min(innerHeight * 0.92, h0 + y0 - e.clientY)) + 'px');
  });
  const birak = (e) => {
    if (y0 == null) return; alt.classList.remove('surukle');
    const dy = y0 - e.clientY, h = h0 + dy; y0 = null;
    if (Math.abs(dy) < 6) { if (tutamak) altYukseklik(durum.altH === 'kapali' ? 'yarim' : 'kapali'); return; }   // sekmeye dokunmak tıklamadır
    altYukseklik(h < altEnAz() + 48 ? 'kapali' : h > innerHeight * 0.92 - 48 ? 'tam' : h / innerHeight);
  };
  alt.addEventListener('pointerup', birak); alt.addEventListener('pointercancel', birak);
})();
/* mobil eser kartı aşağı kaydırılınca kapanır; altta Eserler | Rotalar sayfası en alt durağında açılır */
(() => {
  let y0 = null;
  kartEl.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; y0 = e.clientY; kartEl.style.transition = 'none'; });
  kartEl.addEventListener('pointermove', (e) => {
    if (y0 == null) return; const dy = Math.max(0, e.clientY - y0);
    if (dy > 6 && !kartEl.hasPointerCapture(e.pointerId)) kartEl.setPointerCapture(e.pointerId);
    kartEl.style.transform = `translateY(${dy}px)`;
  });
  const birak = (e) => {
    if (y0 == null) return; const dy = e.clientY - y0; y0 = null;
    kartEl.style.transition = ''; kartEl.style.transform = '';
    if (dy > 60) { durum.altH = 'kapali'; eserSec(null); }
  };
  kartEl.addEventListener('pointerup', birak); kartEl.addEventListener('pointercancel', birak);
})();

function eserListe() {
  return VERI.eserler.filter((e) => durum.filtre.has(e.rol) && (!durum.arama || e.ad.toLocaleLowerCase('tr').includes(durum.arama) || (e.uzun_ad || '').toLocaleLowerCase('tr').includes(durum.arama)));
}
const eserSatir = (e) => `<li class="eser-satir${durum.secili === e.id ? ' secili' : ''}" data-eser="${e.id}">${resim(kapak(e))}<div><h3>${esc(e.ad)}</h3><div class="meta">${esc(meta(e))}</div><span class="etiket">3D</span></div><button class="arti" data-rotama="${e.id}" aria-label="Rotama ekle">${ic('plus', 16)}</button></li>`;
function rotaKart() {
  const ilerleme = JSON.parse(yerel('akar.rota') || 'null');
  const durumMetni = ilerleme ? `<span class="rozet-durum devam">Devam et · ${ilerleme.i + 1} / ${ROTA.duraklar.length}</span>` : '<span class="rozet-durum">Başlanmadı</span>';
  return `<div class="rota-kart" data-rota="${ROTA.id}">${resim(kapak(ESER[ROTA.duraklar[0]]))}<div><h3>${esc(ROTA.ad)}</h3><div class="soluk">${ROTA.duraklar.length} durak · ${ROTA.sure} · ${ROTA.mesafe}</div>${durumMetni}</div></div>`;
}
function kesifIcerik(masaustu) {
  const sekme = `<div class="sekme-grup" role="tablist"><button role="tab" data-sekme="eserler" aria-selected="${durum.sekme === 'eserler'}">Eserler</button><button role="tab" data-sekme="rotalar" aria-selected="${durum.sekme === 'rotalar'}">Rotalar</button></div>`;
  if (durum.sekme === 'rotalar') return `${sekme}<div class="baslik-satir"><h2>Yakınındaki rotalar</h2><a>Tümünü gör (${VERI.rotalar.length}) ›</a></div>${rotaKart()}`;
  const liste = eserListe();
  const ust = masaustu ? `<div class="cipler" style="margin-top:12px">${ciplerHTML(true)}</div><div class="baslik-satir"><h2>Yakınındaki eserler · ${liste.length}</h2><a>Tümünü gör (${VERI.eserler.length}) ›</a></div>`
    : `<div class="baslik-satir" style="margin-top:12px"><a style="color:var(--primary)">${esc(SEHIR.ad)} ▾ · ${liste.length} eser yakında</a></div>`;
  return `${sekme}${ust}<ul class="liste">${liste.map(eserSatir).join('') || '<li class="soluk" style="padding:16px 0">Sonuç yok. Yazımı kontrol et ya da filtreleri temizle.</li>'}</ul>`;
}
function kesif() {
  rotaKaldir();
  if (durum.masaustu) { panel.innerHTML = kesifIcerik(true) + `<div class="panel-alt"><button class="btn ikincil tam">Tüm eserleri gör (${VERI.eserler.length})</button></div>`; filtreUygula(); }
  else { altIc.innerHTML = kesifIcerik(false); alt.hidden = !!durum.secili; altYukseklik(typeof durum.altH === 'number' || ['kapali', 'yarim', 'tam'].includes(durum.altH) ? durum.altH : 'kapali'); }
  gorusKapat();
  eserKartiCiz();
}
document.addEventListener('click', (e) => {
  const s = e.target.closest('[data-sekme]'); if (s) { durum.sekme = s.dataset.sekme; kesif(); return; }
  const r = e.target.closest('[data-rotama]'); if (r) { e.stopPropagation(); toast(`${ESER[r.dataset.rotama].ad} Rotam'a eklendi`); return; }
  const es = e.target.closest('[data-eser]'); if (es) { eserSec(es.dataset.eser, true); return; }   // mobilde de eser sayfası açılmaz: harita esere gider, pindeki gibi kısa kart çıkar
  const ro = e.target.closest('[data-rota]'); if (ro) { location.hash = '#/rota/' + ro.dataset.rota; return; }
});

/* eser seçimi: haritada büyüt, kartı aç */
function eserSec(id, ucus) {
  durum.secili = id;
  if (harita.getLayer('pin-secili')) harita.setFilter('pin-secili', ['==', ['get', 'id'], id || '']);
  if (id && ucus) { const e = ESER[id]; harita.easeTo({ center:[e.lon, e.lat], zoom:Math.max(harita.getZoom(), 17), duration:700, padding:durum.masaustu ? { right:380 } : { bottom:240 } }); }
  if (!location.hash.slice(2)) { if (durum.masaustu) $$('.eser-satir').forEach((li) => li.classList.toggle('secili', li.dataset.eser === id)); else alt.hidden = !!id; }
  eserKartiCiz();
}
function eserKartiCiz() {
  const e = durum.secili && ESER[durum.secili], acik = e && !location.hash.slice(2);
  const ic2 = e ? `<div class="kart-ust" data-detay="${e.id}">${resim(kapak(e))}<div><h3>${esc(e.ad)}</h3><div class="meta">${esc(meta(e))}</div>${guven('Doğrulanmış')}</div><button class="kapat" data-kapat aria-label="Kapat">${ic('x', 18)}</button></div>`
    + (durum.masaustu ? `<p>${esc(e.kisa)}</p>` : '')
    + `<div class="kart-alt"><button class="btn ana" data-baslat="${e.id}" ${e.hikaye.length ? '' : 'disabled'}>${ic('headphones')}${e.hikaye.length ? `Hikâyeyi başlat · ${e.sure} dk` : 'Hikâye hazırlanıyor'}</button><button class="ikon-btn" data-rotama="${e.id}" aria-label="Rotama ekle">${ic('bookmark-plus')}</button></div>` : '';
  if (durum.masaustu) { pop.hidden = !acik; pop.innerHTML = ic2; kartEl.hidden = true; popKonum(); }
  else { kartEl.hidden = !acik; kartEl.innerHTML = ic2; pop.hidden = true; if (!location.hash.slice(2)) { alt.hidden = !!acik; if (!acik) altYukseklik(durum.altH || 'kapali'); } }
}
function popKonum() {
  if (pop.hidden || !durum.secili) return;
  const e = ESER[durum.secili], p = harita.project([e.lon, e.lat]), w = $('#sahne').clientWidth;
  pop.style.left = Math.min(w - 380, Math.max(16, p.x + 28)) + 'px'; pop.style.top = Math.max(80, p.y - 120) + 'px';
}
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-kapat]')) { eserSec(null); return; }
  const b = e.target.closest('[data-baslat]'); if (b) { location.hash = `#/anlat/${b.dataset.baslat}/${yerel('akar.mod') || 'dinle'}`; return; }
  const d = e.target.closest('[data-detay]'); if (d) { location.hash = '#/eser/' + d.dataset.detay; }
});

/* --- görünüm alanı (eser detayı, anlatım, rota bitişi) --- */
function gorusAc(html, sinif = '') { s3dKapat(); gorus.className = sinif; gorus.innerHTML = html; gorus.hidden = false; kartEl.hidden = true; pop.hidden = true; if (!durum.masaustu) alt.hidden = true; }
function gorusKapat() { s3dKapat(); anlatDur(); gorus.hidden = true; gorus.innerHTML = ''; }

const seciciHTML = (koyu) => `<div class="ust-kontrol gizlenir${koyu ? ' koyu-zemin' : ''}"><div class="secici" role="radiogroup" aria-label="Görünüm"><button role="radio" data-gorunum="foto" aria-checked="${durum.gorunum === 'foto'}">${ic('image', 16)}Fotoğraf</button><button role="radio" data-gorunum="3d" aria-checked="${durum.gorunum === '3d'}">${ic('box', 16)}3D</button></div><button class="yuvarlak parca" data-parcalar aria-label="Tıklanabilir parçaları göster" title="Tıklanabilir parçaları göster">${ic('pointer', 18)}</button></div>`;

function galeriHTML(e) {
  const f = galeriFoto(e);
  return `<div class="galeri" id="galeri">${f.map((x, i) => `<figure class="${i % 3 === 0 ? 'buyuk' : 'kucuk'}">${resim(x)}${i === 0 ? guven(x.guven) : ''}</figure>`).join('')}</div>`
    + (durum.masaustu ? `<button class="yuvarlak galeri-ok" style="right:24px" data-kaydir="1" aria-label="Sonraki fotoğraflar">${ic('chevron-right', 18)}</button><button class="yuvarlak galeri-ok" style="left:24px" data-kaydir="-1" aria-label="Önceki fotoğraflar">${ic('chevron-left', 18)}</button>` : '');
}
function eserBilgi(e, masaustu) {
  const sd = sonrakiDurak(e);
  const dugme = e.hikaye.length ? `<div class="dugmeler"><button class="btn ana" data-anlat="dinle">${ic('headphones')}Dinle · ${e.sure} dk</button><button class="btn ikincil" data-anlat="oku">${ic('book-open')}Oku</button></div>` : '<p class="soluk">Bu eserin hikâyesi henüz hazırlanmadı.</p>';
  const hik = e.hikaye.length ? `<div class="soluk" style="font-size:13px">Yapının hikâyesi · ${e.hikaye.length} bölüm</div>` : '';
  const sonraki = sd ? `<button class="btn cerceve tam" style="margin-top:12px" data-git="#/eser/${sd.id}" data-rotada>Sonraki durak: ${esc(sd.ad)} ${ic('arrow-right', 16)}</button>` : '';
  const gecmis = `<button class="gg-link" data-git="#/gecmis/${e.id}">${ic('history', 16)}Geçmişi Gör · ${e.gecmis.length ? `${e.gecmis.length} eski fotoğraf` : 'eski görüntü henüz yok'} ›</button>`;
  if (masaustu) return `<button class="geri" data-git="#/" style="height:auto;padding:0;border:0;gap:12px"><span class="ikon-btn" style="width:32px;height:32px">${ic('chevron-left', 16)}</span><span class="soluk" style="font-weight:500">Harita</span></button>
    <h1 class="panel-baslik" style="margin-top:16px">${esc(e.ad)}</h1><div class="panel-meta">${esc(meta(e))}</div>${SUSLEME}<p style="margin:0 0 14px">${esc(e.kisa)}</p>${hik}${dugme}
    <div class="satir-link" data-git="#/hakkinda/${e.id}"><div><b>Eser hakkında</b><small>Tarihçe, mimari, kaynaklar</small></div>${ic('chevron-right', 18)}</div>
    <div class="satir-link" data-git="#/gecmis/${e.id}"><div><b>Geçmişi Gör</b><small>${e.gecmis.length ? `${e.gecmis.length} eski fotoğraf` : 'Eski görüntü henüz yok'}</small></div>${ic('chevron-right', 18)}</div>
    <div class="satir-link" data-bulmaca><div><b>Bulmaca</b><small>${e.gorevler?.length ? `${e.gorevler.length} görev · ${e.gorevler.filter(gorevDurum).length} tamam` : 'Görev henüz yok'}</small></div>${ic('chevron-right', 18)}</div><div class="panel-alt">${sonraki}</div>`;
  /* mobil kart = sürüklenen alt sayfa. Kapalı: ad, Dinle | Oku, Hakkında · Geçmiş · Bulmaca, rotadaysa Sonraki durak.
     Yukarı çekilince altta tarih, süsleme, kısa açıklama ve bölüm sayısı açılır (masaüstü paneliyle aynı içerik) */
  const sonrakiM = sd ? `<button class="btn cerceve tam sonraki-m" data-git="#/eser/${sd.id}" data-rotada>Sonraki durak: ${esc(sd.ad)} ${ic('arrow-right', 16)}</button>` : '';
  const kisayol = `<div class="ea-kisayol"><button data-git="#/hakkinda/${e.id}">${ic('info', 18)}Hakkında</button><button data-git="#/gecmis/${e.id}">${ic('history', 18)}Geçmiş${e.gecmis.length ? `<small>${e.gecmis.length}</small>` : ''}</button><button data-bulmaca>${ic('puzzle', 18)}Bulmaca${e.gorevler?.length ? `<small>${e.gorevler.length}</small>` : ''}</button></div>`;
  return `<div class="eser-alt" id="eser-alt"><div class="ea-ust"><div class="tutamak" id="ea-tutamak" role="button" tabindex="0" aria-label="Eser bilgisini aç" aria-expanded="false"><i></i></div><h1>${esc(e.ad)}</h1>${dugme}${kisayol}${sonrakiM}</div>
    <div class="ea-detay"><div class="meta">${esc(meta(e))}</div>${SUSLEME}<p>${esc(e.kisa)}</p>${hik}</div></div>`;
}
function eserDetay(id) {
  const e = ESER[id]; if (!e) return (location.hash = '#/');
  durum.secili = id; rotaKaldir();
  const ust = durum.masaustu ? `<div class="gorus-ust">${seciciHTML(false)}</div>` : `<div class="gorus-ust"><button class="geri" data-git="#/">‹ Harita</button>${seciciHTML(false)}</div>`;
  gorusAc(`${ust}<div id="gorus-alan"></div>${durum.masaustu ? '' : eserBilgi(e, false)}`);
  if (!durum.masaustu) eaYukseklik(0);   // kapalı başlar
  if (durum.masaustu) panel.innerHTML = eserBilgi(e, true);
  gorunumCiz();
}
/* eser detayında Fotoğraf | 3D */
function gorunumCiz() {
  const e = ESER[durum.secili], alan = $('#gorus-alan'); if (!alan || !e) return;
  s3dKapat();
  if (durum.gorunum === 'foto') { alan.innerHTML = galeriHTML(e); galeriYukseklik(); }
  else {
    alan.innerHTML = `<div class="sahne3d" id="s3d"><div class="yukleniyor">3D model yükleniyor…</div></div><div class="ipucu">${ic('move', 14)}${durum.masaustu ? 'Sürükle: döndür · Tekerlek: yakınlaştır · Dokun: parça' : 'Sürükle: döndür · İki parmak: yakınlaştır · Dokun: parça'}</div><span class="guven temsili temsili-etiket" id="temsili">3D model · Temsili<span class="i">ⓘ</span></span><div class="parca-ad" id="parca-ad" hidden></div><button class="kubbe-dugme" id="kubbe-dugme" data-kubbe aria-pressed="false" hidden>${ic('chevron-up', 16)}<span>İçini göster</span></button>`;
    temsiliKonum();
    s3d = new Sahne3D($('#s3d'), { onParca:parcaSecildi, altBosluk:() => (durum.masaustu ? 0 : (eaSinir()[0] || 0) + 12) });   // kart açılsa da kadraj kapalı boya göre
    s3d.yukle(e).then(() => { $('#s3d .yukleniyor')?.remove(); if (s3d && s3d.kalkan) $('#kubbe-dugme').hidden = false; }).catch((err) => { $('#s3d .yukleniyor').textContent = '3D model açılamadı: ' + err.message; });
  }
  $$('[data-gorunum]').forEach((b) => b.setAttribute('aria-checked', b.dataset.gorunum === durum.gorunum));
}
function galeriYukseklik() {
  if (durum.masaustu) return;
  const g = $('#galeri'), a = $('#eser-alt'); if (!g || !a) return;
  g.style.height = Math.max(240, innerHeight - eaSinir()[0] - 72 - 28) + 'px';
}
function temsiliKonum() {
  const t = $('#temsili'), a = $('#eser-alt'); if (!t) return;
  if (durum.masaustu) { t.style.left = '24px'; t.style.top = '16px'; }
  else { t.style.left = '16px'; t.style.bottom = ((a ? eaSinir()[0] : 260) + 22) + 'px'; }
  const p = $('#parca-ad'); if (p) p.style.bottom = durum.masaustu ? '24px' : ((a ? eaSinir()[0] : 260) + 58) + 'px';
  const k = $('#kubbe-dugme'); if (k) { k.style.right = durum.masaustu ? '24px' : '16px'; if (durum.masaustu) { k.style.top = ''; k.style.bottom = '24px'; } else k.style.bottom = ((a ? eaSinir()[0] : 260) + 16) + 'px'; }
}
function parcaGoster(ad) { const p = $('#parca-ad'); if (!p) return; p.hidden = !ad; p.textContent = ad ? (parcaBilgi(ad)?.baslik || ad.replace(/_/g, ' ')) : ''; }
/* v2 · parçaya dokununca büyük kart: üstte yana kaydırılan fotoğraflar, altta kayan metin, ses düğmesi */
const parcaEser = () => anlat.eser || ESER[durum.secili];
function parcaBilgi(ad) { const e = parcaEser(); return e && (e.parcalar || []).find((p) => p.adlar.includes(ad)); }
function parcaSecildi(ad) { if (gorevParca(ad)) return; parcaGoster(ad); if (ad) parcaKartAc(ad); else parcaKartKapat(false); }
let pkSes = null;
function pkSesDur() { if (pkSes) { pkSes = null; if ('speechSynthesis' in window) speechSynthesis.cancel(); } const b = $('#pk-ses'); if (b) { b.innerHTML = ic('volume-2', 20); b.setAttribute('aria-label', 'Sesli dinle'); b.setAttribute('aria-pressed', 'false'); } }
function pkSesBaslat(bilgi) {
  if (!('speechSynthesis' in window)) return;
  if (anlat.oynuyor) oynat(false);                     // anlatım konuşuyorsa susar; iki ses üst üste binmez
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(`${bilgi.baslik}. ${bilgi.metin}`); u.lang = 'tr-TR';
  const ses = speechSynthesis.getVoices().find((v) => /^tr/i.test(v.lang)); if (ses) u.voice = ses;
  pkSes = u; u.onend = u.onerror = () => { if (pkSes === u) pkSesDur(); };
  speechSynthesis.speak(u);
  const b = $('#pk-ses'); if (b) { b.innerHTML = ic('square', 18); b.setAttribute('aria-label', 'Sesi durdur'); b.setAttribute('aria-pressed', 'true'); }
}
function parcaKartAc(ad) {
  const e = parcaEser(); if (!e) return;
  const b = parcaBilgi(ad); if (!b) return;   // kartı olmayan parça kart açmaz (yalnız adı görünür)
  pkSesDur();
  const fl = (b.fotolar.length ? b.fotolar : [kapak(e)?.dosya]).map((d) => foto(e, d)).filter(Boolean);
  const nokta = fl.length > 1 ? `<div class="pk-nokta">${fl.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : '';
  let k = $('#parca-kart');
  if (!k) { k = document.createElement('div'); k.id = 'parca-kart'; k.className = 'parca-kart-arka'; document.body.appendChild(k); }
  k.innerHTML = `<section class="parca-kart" role="dialog" aria-modal="true" aria-labelledby="pk-baslik">
    <div class="pk-fotolar" id="pk-fotolar">${fl.map((f) => `<figure>${resim(f)}<figcaption>${esc(f.baslik)}</figcaption></figure>`).join('')}</div>${nokta}
    <button class="yuvarlak pk-kapat" data-pk-kapat aria-label="Kartı kapat">${ic('x', 18)}</button>
    <div class="pk-bas"><div><h2 id="pk-baslik">${esc(b.baslik)}</h2>${guven(b.guven)}</div><button class="yuvarlak pk-ses" id="pk-ses" data-pk-ses aria-pressed="false" aria-label="Sesli dinle">${ic('volume-2', 20)}</button></div>
    <div class="pk-metin" id="pk-metin"><p>${esc(b.metin)}</p>${b.kaynak ? `<div class="pk-kaynak">Kaynak: ${esc(b.kaynak)}</div>` : ''}<div class="pk-kunye">${esc(SEHIR.foto_kunye)}</div></div>
  </section>`;
  k.hidden = false; k.dataset.ad = ad; k._bilgi = b;
  const sh = $('#pk-fotolar');
  sh.addEventListener('scroll', () => { const i = Math.round(sh.scrollLeft / sh.clientWidth); $$('.pk-nokta i', k).forEach((n, j) => n.classList.toggle('on', j === i)); }, { passive:true });
  requestAnimationFrame(() => k.classList.add('acik'));
}
function parcaKartKapat(secimiBirak = true) {
  const k = $('#parca-kart'); pkSesDur(); if (!k || k.hidden) return;
  k.classList.remove('acik'); k.hidden = true; k.innerHTML = '';
  if (secimiBirak && s3d && s3d.secili.size) { s3d.secili.clear(); s3d.boya(); parcaGoster(null); }
}
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-pk-kapat]') || e.target.id === 'parca-kart') { parcaKartKapat(); return; }
  if (e.target.closest('[data-pk-ses]')) { const k = $('#parca-kart'); if (pkSes) pkSesDur(); else if (k && k._bilgi) pkSesBaslat(k._bilgi); }
});
/* mobil eser kartı sürükleme: tutamak ya da başlık parmağı izler, bırakılan yükseklikte kalır (en az: üst bölüm, en çok: içerik ya da ekranın %75'i);
   kenara 40 px'ten yakınsa oraya oturur. Tutamağa dokunmak kapalı ↔ tam açık */
function eaSinir() { const a = $('#eser-alt'), u = a && a.querySelector('.ea-ust'); if (!u) return [0, 0]; const cs = getComputedStyle(a), p = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom); return [u.offsetHeight + p, Math.min(innerHeight * 0.75, u.offsetHeight + a.querySelector('.ea-detay').scrollHeight + p)]; }
function eaYukseklik(h) {
  const a = $('#eser-alt'); if (!a) return; const [az, cok] = eaSinir();
  const v = h == null ? null : Math.max(az, Math.min(cok, h));
  a.style.height = v == null ? '' : v + 'px';
  const acik = v != null && v > az + 8; a.classList.toggle('acik', acik);
  $('#ea-tutamak')?.setAttribute('aria-expanded', acik); $('#ea-tutamak')?.setAttribute('aria-label', acik ? 'Eser bilgisini kapat' : 'Eser bilgisini aç');
}
(() => {
  let y0 = null, h0 = 0, tut = false;
  document.addEventListener('pointerdown', (e) => {
    const t = !durum.masaustu && e.target.closest('#eser-alt #ea-tutamak, #eser-alt h1'); if (!t) return;
    const a = $('#eser-alt'); y0 = e.clientY; h0 = a.offsetHeight; tut = t.id === 'ea-tutamak'; a.classList.add('surukle');
  });
  document.addEventListener('pointermove', (e) => {
    if (y0 == null || Math.abs(y0 - e.clientY) < 6) return;
    const a = $('#eser-alt'); if (!a) return; if (!a.hasPointerCapture(e.pointerId)) a.setPointerCapture(e.pointerId);
    eaYukseklik(h0 + y0 - e.clientY);
  });
  const birak = (e) => {
    if (y0 == null) return; const a = $('#eser-alt'); a?.classList.remove('surukle');
    const dy = y0 - e.clientY, h = h0 + dy; y0 = null; if (!a) return;
    const [az, cok] = eaSinir();
    if (Math.abs(dy) < 6) { if (tut) eaYukseklik(a.classList.contains('acik') ? az : cok); return; }
    eaYukseklik(h < az + 40 ? az : h > cok - 40 ? cok : h);
  };
  document.addEventListener('pointerup', birak); document.addEventListener('pointercancel', birak);
  document.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.id === 'ea-tutamak') { e.preventDefault(); const [az, cok] = eaSinir(); eaYukseklik($('#eser-alt').classList.contains('acik') ? az : cok); } });
})();
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#parca-kart') && !$('#parca-kart').hidden) { e.stopImmediatePropagation(); parcaKartKapat(); } }, true);
addEventListener('resize', () => { galeriYukseklik(); temsiliKonum(); popKonum(); });

document.addEventListener('click', (e) => {
  const g = e.target.closest('[data-gorunum]');
  if (g) { durum.gorunum = g.dataset.gorunum; yerel('akar.gorunum', durum.gorunum); if (anlat.eser) anlatSahne(); else gorunumCiz(); return; }
  const p = e.target.closest('[data-parcalar]');
  if (p) {
    p.setAttribute('aria-pressed', 'true'); setTimeout(() => p.setAttribute('aria-pressed', 'false'), 650);
    if (durum.gorunum !== '3d') { durum.gorunum = '3d'; yerel('akar.gorunum', '3d'); anlat.eser ? anlatSahne() : gorunumCiz(); setTimeout(() => s3d && s3d.flasla(), 1200); }
    else s3d && s3d.flasla();
    return;
  }
  const kb = e.target.closest('[data-kubbe]');
  if (kb) {
    if (!s3d || !s3d.kalkan) return;
    const acik = !s3d.kubbelerAcik; s3d.kubbeler(acik);
    if (acik && s3d.egim() < 45) s3d.aci({ azimut:s3d.azimut(), egim:58, uzaklik:'bütün yapı' });   // içi görünsün diye kamera yükselir
    kb.setAttribute('aria-pressed', String(acik)); kb.innerHTML = `${ic(acik ? 'chevron-down' : 'chevron-up', 16)}<span>${acik ? 'Dışını göster' : 'İçini göster'}</span>`;
    if (acik && s3d.secili.size) { s3d.secili.clear(); s3d.boya(); parcaGoster(null); }
    return;
  }
  const k = e.target.closest('[data-kaydir]'); if (k) { const gal = $('#galeri'); gal && gal.scrollBy({ left:+k.dataset.kaydir * gal.clientWidth * 0.8, behavior:'smooth' }); return; }
  const a = e.target.closest('[data-anlat]'); if (a) { location.hash = `#/anlat/${durum.secili}/${a.dataset.anlat}`; return; }
  const git = e.target.closest('[data-git]'); if (git) { location.hash = git.dataset.git; }
});

/* =====================================================================
   ANLATIM (Dinle | Oku)
   ===================================================================== */
const anlat = { eser:null, i:0, oynuyor:false, mod:'dinle', hiz:1, acik:false, jeton:0 };
const sureTahmin = (c) => Math.max(2.5, c.metin.split(/\s+/).length / 2.2);   // saniye (~130 kelime/dk)
const dk = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
let gizleZ;

function anlatim(id, mod) {
  const e = ESER[id]; if (!e || !e.hikaye.length) return (location.hash = '#/eser/' + id);
  const ayni = anlat.eser === e;
  anlatDur(true);
  Object.assign(anlat, { eser:e, mod, i:ayni ? anlat.i : (+(yerel('akar.ilerleme.' + id) || 0)) % e.hikaye.length, acik:mod === 'oku' });
  yerel('akar.mod', mod); durum.secili = id; rotaKaldir();
  const n = e.hikaye.length;
  const ilerleme = `<div class="ilerleme" id="ilerleme">${e.hikaye.map((_, i) => `<button data-cumle="${i}" aria-label="Bölüm ${i + 1}"><i></i></button>`).join('')}</div>`;
  const ust = `<div class="anlat-ust">${durum.masaustu ? '' : `<button class="yuvarlak ust-kontrol gizlenir" data-git="#/eser/${id}" aria-label="Kapat">${ic('x', 18)}</button>`}<div style="display:flex;gap:8px">${seciciHTML(true)}<button class="yuvarlak ust-kontrol gizlenir koyu-zemin" id="doldur" aria-label="Ekranı doldur">${ic(durum.doldur ? 'shrink' : 'expand', 18)}</button></div></div>`;
  const liste = `<ol class="cumleler" id="cumleler">${e.hikaye.map((c, i) => `<li data-cumle="${i}"><span class="no">${i + 1}</span><div><p>${esc(c.metin)}</p>${guven(c.guven)}</div></li>`).join('')}</ol>`;
  const oynatici = `<div class="oynatici"><button class="sol" data-mod-degis>${durum.masaustu ? `<span class="sure" id="sure">0:00 / 0:00</span>` : (mod === 'dinle' ? 'Oku' : 'Dinle')}</button><div class="orta"><button class="kucuk" data-adim="-1" aria-label="Önceki">${ic('skip-back', 18)}</button><button class="oynat" id="oynat" aria-label="Oynat">${ic('play', 22)}</button><button class="kucuk" data-adim="1" aria-label="Sonraki">${ic('skip-forward', 18)}</button></div><button class="sag" id="hiz">1x</button></div>`;
  const sekme = `<div class="sekme-grup" role="tablist"><button role="tab" data-mod="dinle" aria-selected="${mod === 'dinle'}">${ic('headphones', 16)} Dinle</button><button role="tab" data-mod="oku" aria-selected="${mod === 'oku'}">${ic('book-open', 16)} Oku</button></div><span class="dil">TR ${ic('chevron-down', 14)}</span>`;
  if (durum.masaustu) {
    panel.innerHTML = `<div class="anlat-panel"><div class="bas"><button class="ikon-btn" style="width:36px;height:36px" data-git="#/eser/${id}" aria-label="Hikâyeden çık">${ic('x', 18)}</button>${sekme}</div>${liste}${oynatici}</div>`;
    gorusAc(`<div class="anlat-alan" id="anlat-alan"></div>${ilerleme}${ust}`, 'anlatim');
  } else {
    const kart = `<div class="hikaye-kart" id="hikaye-kart"><div class="tutamak" data-ac><i></i></div><div class="ust"><span class="sayac" id="sayac">1 / ${n}</span><span id="kart-guven"></span></div><p class="cumle" id="kart-cumle"></p><div class="kaynak-link" id="kart-kaynak"></div>${oynatici}</div>`;
    const sayfa = `<div class="cumle-sayfa" id="cumle-sayfa"><div class="tutamak" data-kapan><i></i></div><div class="bas">${sekme}</div>${liste}${oynatici}</div>`;
    gorusAc(`<div class="anlat-alan" id="anlat-alan"></div>${ilerleme}${ust}${kart}${sayfa}`, 'anlatim');
  }
  anlatAcikCiz(); anlatSahne(); cumleGit(anlat.i, false);
  const aktifLi = $$('#cumleler li')[anlat.i]; if (aktifLi) aktifLi.scrollIntoView({ block:'center' });
  setTimeout(okuGozlem, 400);
  if (mod === 'dinle') setTimeout(() => oynat(true), 300);
}
function anlatAcikCiz() {
  if (durum.masaustu) return;
  const acik = anlat.acik;
  $('#hikaye-kart').hidden = acik; $('#cumle-sayfa').hidden = !acik;
  const alan = $('#anlat-alan'); alan.style.bottom = acik ? `calc(100% - 360px - var(--sat))` : '0';
  alan.style.setProperty('--foto-alt', acik ? '0px' : (($('#hikaye-kart')?.offsetHeight || 0) + 24) + 'px');
  $('#ilerleme').classList.toggle('acik', false);
}
/* anlatım sahnesi: fotoğraf ya da 3D */
function anlatSahne() {
  const alan = $('#anlat-alan'); if (!alan) return;
  s3dKapat();
  const koyu = durum.gorunum === 'foto';
  $$('.ust-kontrol').forEach((u) => u.classList.toggle('koyu-zemin', koyu || u.id === 'doldur'));
  $('#doldur') && ($('#doldur').hidden = !koyu);
  $('#ilerleme').classList.toggle('acik', !koyu);
  if (koyu) alan.innerHTML = `<div class="foto-sahne${durum.doldur ? ' doldur' : ''}" id="foto-sahne"><img class="bulanik" alt=""><img class="ana" alt=""><div class="ust-golge"></div><div class="alt-bilgi"><span id="foto-guven"></span><span class="kunye">${esc(SEHIR.foto_kunye)}</span></div></div>`;
  else {
    alan.innerHTML = `<div class="sahne3d" id="s3d"><div class="yukleniyor">3D model yükleniyor…</div></div><div class="kart3d" id="kart3d" style="opacity:0"></div><div class="parca-ad" id="parca-ad" style="bottom:16px" hidden></div>`;
    s3d = new Sahne3D($('#s3d'), { onParca:parcaSecildi, altBosluk:() => (!durum.masaustu && !anlat.acik ? ($('#hikaye-kart')?.offsetHeight || 0) + 12 : 0) });
    s3d.yukle(anlat.eser).then(() => { $('#s3d .yukleniyor')?.remove(); sahneUygula(false); }).catch((err) => { $('#s3d .yukleniyor').textContent = '3D açılamadı: ' + err.message; });
  }
  $$('[data-gorunum]').forEach((b) => b.setAttribute('aria-checked', b.dataset.gorunum === durum.gorunum));
  sahneUygula(false);
}
function sahneUygula(gecis = true) {
  const e = anlat.eser, c = e && e.hikaye[anlat.i]; if (!c) return;
  if (durum.gorunum === 'foto') {
    const f = foto(e, c.foto), fs = $('#foto-sahne'); if (!fs || !f) return;
    const ana = $('.ana', fs);
    if (ana.dataset.url !== f.url) { ana.style.opacity = 0; const yeni = new Image(); yeni.onload = () => { ana.src = f.url; $('.bulanik', fs).src = f.url; ana.dataset.url = f.url; ana.alt = f.alt; ana.style.opacity = 1; }; yeni.src = f.url; }
    $('#foto-guven').innerHTML = guven(f.guven);
  } else if (s3d && s3d.kok) {
    s3d.kubbeler(!!c.ic, gecis);   // v2: iç mekân cümlelerinde kubbeler kalkar
    s3d.aci(c.aci, gecis); s3d.vurgula(c.vurgu);
    const k = $('#kart3d');
    if (c.kart) { const f = foto(e, c.foto); k.innerHTML = `${resim(f)}<div><b>${esc(f.baslik)}</b><small>${esc(f.kisa)}</small></div>`; s3d.kartBagla(k, c.vurgu[0] || (c.aci && c.aci.hedef) || 'Merkez'); }
    else { k.style.opacity = 0; s3d.kartBagla(null); }
  }
}
function cumleGit(i, konus = true) {
  const e = anlat.eser; if (!e) return;
  const n = e.hikaye.length;
  if (i >= n) return hikayeBitti();
  anlat.i = Math.max(0, i); yerel('akar.ilerleme.' + e.id, String(anlat.i));
  const c = e.hikaye[anlat.i];
  $$('#ilerleme button i').forEach((b, k) => (b.style.width = k <= anlat.i ? '100%' : '0'));
  $$('#cumleler li').forEach((li, k) => li.classList.toggle('aktif', k === anlat.i));
  if ($('#kart-cumle')) { $('#sayac').textContent = `${anlat.i + 1} / ${n}`; $('#kart-cumle').textContent = c.metin; $('#kart-guven').innerHTML = guven(c.guven); $('#kart-kaynak').textContent = `Kaynak: ${c.kaynak} ›`; }
  if ($('#sure')) { const gecen = e.hikaye.slice(0, anlat.i).reduce((a, x) => a + sureTahmin(x), 0), top = e.hikaye.reduce((a, x) => a + sureTahmin(x), 0); $('#sure').textContent = `${dk(gecen)} / ${dk(top)}`; }
  if (anlat.mod === 'dinle' || !okuKaydiriyor) { const li = $$('#cumleler li')[anlat.i]; if (li && (anlat.mod === 'dinle' || konus === 'tik')) li.scrollIntoView({ block:'center', behavior:'smooth' }); }
  sahneUygula(true);
  if (konus && anlat.oynuyor && anlat.mod === 'dinle') seslendir();
}
function seslendir() {
  const j = ++anlat.jeton, c = anlat.eser.hikaye[anlat.i];
  const sonraki = () => { if (j === anlat.jeton && anlat.oynuyor) cumleGit(anlat.i + 1); };
  clearTimeout(anlat.zaman);
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(c.metin); u.lang = 'tr-TR'; u.rate = anlat.hiz;
    const ses = speechSynthesis.getVoices().find((v) => /^tr/i.test(v.lang)); if (ses) u.voice = ses;
    u.onend = () => setTimeout(sonraki, 250);
    speechSynthesis.speak(u);
    anlat.zaman = setTimeout(sonraki, (sureTahmin(c) * 1.8 + 2) * 1000 / anlat.hiz);   // bazı Android sürümlerinde onend gelmeyebilir
  } else anlat.zaman = setTimeout(sonraki, sureTahmin(c) * 1000 / anlat.hiz);
}
function oynat(ac) {
  anlat.oynuyor = ac ?? !anlat.oynuyor;
  $$('#oynat, .oynat').forEach((b) => { b.innerHTML = ic(anlat.oynuyor ? 'pause' : 'play', 22); b.setAttribute('aria-label', anlat.oynuyor ? 'Durdur' : 'Oynat'); });
  if (anlat.oynuyor) { if (anlat.mod === 'oku') { anlat.mod = 'dinle'; modSekme(); } seslendir(); gizleBaslat(); }
  else { anlat.jeton++; clearTimeout(anlat.zaman); if ('speechSynthesis' in window) speechSynthesis.cancel(); gorus.classList.remove('gizle'); }
}
function anlatDur(sessiz) { anlat.jeton++; clearTimeout(anlat.zaman); if ('speechSynthesis' in window) speechSynthesis.cancel(); anlat.oynuyor = false; if (!sessiz) anlat.eser = null; okuGozlemci && okuGozlemci.disconnect(); }
function modSekme() { $$('[data-mod]').forEach((b) => b.setAttribute('aria-selected', b.dataset.mod === anlat.mod)); $$('[data-mod-degis]').forEach((b) => { if (!durum.masaustu) b.textContent = anlat.mod === 'dinle' ? 'Oku' : 'Dinle'; }); yerel('akar.mod', anlat.mod); }
function gizleBaslat() {
  clearTimeout(gizleZ); gorus.classList.remove('gizle');
  if (anlat.oynuyor && durum.gorunum === 'foto') gizleZ = setTimeout(() => gorus.classList.add('gizle'), 3000);
}
['pointerdown', 'keydown'].forEach((t) => document.addEventListener(t, (e) => { if (anlat.eser && gorus.classList.contains('gizle')) { e.stopPropagation(); e.preventDefault(); gizleBaslat(); } else if (anlat.eser) gizleBaslat(); }, true));
document.addEventListener('mousemove', () => anlat.eser && gizleBaslat());

/* Oku: liste kaydırıldıkça ortadaki cümle sahneyi yönetir */
let okuGozlemci = null, okuKaydiriyor = false;
function okuGozlem() {
  okuGozlemci && okuGozlemci.disconnect();
  const kok = $('#cumleler'); if (!kok) return;
  okuGozlemci = new IntersectionObserver((g) => {
    if (anlat.mod !== 'oku') return;
    const g2 = g.filter((x) => x.isIntersecting)[0]; if (!g2) return;
    const i = +g2.target.dataset.cumle; if (i !== anlat.i) { okuKaydiriyor = true; cumleGit(i, false); okuKaydiriyor = false; }
  }, { root:kok, rootMargin:'-40% 0px -50% 0px' });
  $$('li', kok).forEach((li) => okuGozlemci.observe(li));
}
document.addEventListener('click', (e) => {
  if (!anlat.eser) return;
  const c = e.target.closest('[data-cumle]'); if (c) { cumleGit(+c.dataset.cumle, anlat.mod === 'dinle' ? true : 'tik'); return; }
  const a = e.target.closest('[data-adim]'); if (a) { cumleGit(anlat.i + +a.dataset.adim); return; }
  if (e.target.closest('#oynat, .oynat')) { oynat(); return; }
  const m = e.target.closest('[data-mod]'); if (m) { anlat.mod = m.dataset.mod; if (anlat.mod === 'oku') oynat(false); modSekme(); if (!durum.masaustu) { anlat.acik = true; anlatAcikCiz(); } return; }
  if (e.target.closest('[data-mod-degis]') && !durum.masaustu) { anlat.mod = anlat.mod === 'dinle' ? 'oku' : 'dinle'; modSekme(); anlat.acik = anlat.mod === 'oku'; if (anlat.mod === 'oku') oynat(false); anlatAcikCiz(); return; }
  if (e.target.closest('[data-ac]')) { anlat.acik = true; anlatAcikCiz(); return; }
  if (e.target.closest('[data-kapan]')) { anlat.acik = false; anlat.mod = 'dinle'; modSekme(); anlatAcikCiz(); return; }
  if (e.target.closest('#hiz')) { anlat.hiz = anlat.hiz >= 1.5 ? 1 : anlat.hiz + 0.25; $$('#hiz, .sag').forEach((b) => (b.textContent = anlat.hiz + 'x')); if (anlat.oynuyor) seslendir(); return; }
  if (e.target.closest('#doldur')) { durum.doldur = !durum.doldur; yerel('akar.fotoKip', durum.doldur ? 'doldur' : 'sigdir'); $('#foto-sahne')?.classList.toggle('doldur', durum.doldur); $('#doldur').innerHTML = ic(durum.doldur ? 'shrink' : 'expand', 18); }
});
document.addEventListener('keydown', (e) => {
  if (!anlat.eser || e.target.matches('input')) return;
  if (e.key === 'Escape') location.hash = '#/eser/' + anlat.eser.id;
  else if (e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); anlat.mod === 'oku' ? cumleGit(anlat.i + 1, 'tik') : oynat(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); cumleGit(anlat.i - 1, 'tik'); }
});
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => {};

function hikayeBitti() {
  const e = anlat.eser; anlatDur(); yerel('akar.ilerleme.' + e.id, '0'); yerel('akar.bitti.' + e.id, '1'); rozetKontrol(e);
  harita.getSource('eserler')?.setData(eserNoktalari());
  const r = JSON.parse(yerel('akar.rota') || 'null'), i = ROTA.duraklar.indexOf(e.id);
  if (r && i >= 0) yerel('akar.rota', JSON.stringify({ i:Math.min(i + 1, ROTA.duraklar.length - 1) }));
  location.hash = '#/son/' + e.id;
}
function hikayeSonrasi(id) {
  const e = ESER[id]; durum.secili = id; rotaKaldir(); const sd = sonrakiDurak(e);
  const govde = `<div style="text-align:center;padding-top:6px"><span class="sayac">Hikâye tamamlandı</span><h1 class="panel-baslik" style="margin-top:10px">${esc(e.ad)}</h1><div class="panel-meta">${e.hikaye.length} / ${e.hikaye.length} bölüm · tamamlandı</div></div>${SUSLEME}
    <div class="satir-link" data-git="#/hakkinda/${id}"><div><b>Eser hakkında</b><small>Tarihçe, mimari, kaynaklar</small></div>${ic('chevron-right', 18)}</div>
    <div class="satir-link" data-git="#/gecmis/${id}"><div><b>Geçmişi Gör</b><small>Eski hâlini gör</small></div>${ic('chevron-right', 18)}</div>
    ${e.gorevler?.length ? `<div class="satir-link" data-git="#/gorev/${id}"><div><b>Bulmaca</b><small>${e.gorevler.length} görev · ${e.gorevler.filter(gorevDurum).length} tamam</small></div>${ic('chevron-right', 18)}</div>` : ''}
    <div class="satir-link" data-git="#/anlat/${id}/dinle"><div><b>Hikâyeyi yeniden</b><small>Dinle · Oku</small></div>${ic('chevron-right', 18)}</div>
    ${sd ? `<button class="btn ana tam" style="margin-top:16px" data-git="#/eser/${sd.id}" data-rotada>Sonraki durak: ${esc(sd.ad)} ${ic('arrow-right', 16)}</button>` : (durum.rotada && ROTA.duraklar.includes(id) ? `<button class="btn ana tam" style="margin-top:16px" data-git="#/rota/${ROTA.id}">Rota tamamlandı · Rotaya dön</button>` : '')}
    <button class="metin-btn" style="display:block;margin:8px auto 0" data-git="#/">Haritaya dön</button>`;
  if (durum.masaustu) { panel.innerHTML = govde; gorusAc(`<div class="gorus-ust">${seciciHTML(false)}</div><div id="gorus-alan"></div>`); gorunumCiz(); return; }
  gorusAc(`<div class="son-gorsel">${resim(kapak(e))}</div><div class="sayfa-ic son-ic"><div class="kutu">${govde}</div></div>`);
}
/* «Eser hakkında» (28 Ekim 2026; Figma akar-yeni «D · Eser hakkında» 1:3130 ve «WF · Eser hakkında (uzun metin)» 1:6976).
   Tam sayfa: masaüstünde harita ve sol panel gizlenir, ortada tek sütun metin, en üstte «‹ eser» Geri düğmesi (28 Ekim: «Bu eserde» kartı kaldırıldı);
   mobilde üst çubuk + altta sabit «dinle» düğmesi. Envanterdeki fotoğraflar kitap sırasıyla, ait oldukları paragrafın arkasında (hazirla.py `kitap_fotolari`). 
   Bölüm altında baskın güven etiketi ve «Kaynaklar (n)»; farklı güvenli paragrafın etiketi paragrafın hemen altında. */
const hkKitaplar = (e) => {   // paragraf kaynaklarından kitap listesi: «Envanter Cilt 1 · s. 19» → [1] <envanter adı>, Cilt 1 (<yayıncı>)
  const k = new Set();
  e.hakkinda.forEach((b) => b.paragraflar.forEach((p) => (p.kaynak.match(/Cilt \d/g) || []).forEach((c) => k.add(c))));
  return [...k].sort().map((c) => `${SEHIR.envanter_adi || 'Envanter'}, ${c}${SEHIR.envanter_yayinci ? ` (${SEHIR.envanter_yayinci})` : ''}`);
};
const hkFotolar = (fl) => {   // kitap sayfası başına: 1–3 fotoğraf alt alta, 4–8 iki sütun (kitaptaki oranıyla), 8'den çok (levha kolajları) küçük ızgara
  if (!fl || !fl.length) return '';
  const fig = (f) => `<figure class="hk-foto" style="aspect-ratio:${f.oran}"><img src="${esc(f.url)}" alt="${esc(f.alt)}" loading="lazy" decoding="async"></figure>`;
  const sayfalar = new Map(); fl.forEach((f) => sayfalar.set(f.kunye, [...(sayfalar.get(f.kunye) || []), f]));
  return [...sayfalar].map(([kunye, g]) => g.length > 3
    ? `<div class="hk-fotolar"><div class="hk-izgara-foto${g.length > 8 ? ' kolaj' : ''}">${g.map(fig).join('')}</div><p class="hk-kunye">${g.length} fotoğraf · ${esc(kunye)}</p></div>`
    : `<div class="hk-fotolar">${g.map(fig).join('')}<p class="hk-kunye">${esc(kunye)}</p></div>`).join('');
};
function hkBolum(b, i) {
  const say = {}; b.paragraflar.forEach((p) => (say[p.guven] = (say[p.guven] || 0) + 1));
  const baskin = Object.entries(say).sort((x, y) => y[1] - x[1])[0][0];
  const kaynaklar = [...new Set(b.paragraflar.map((p) => p.kaynak))];
  const paragraflar = hkFotolar(b.fotolar) + b.paragraflar.map((p) => `<p class="hk-p">${esc(p.metin)}</p>${p.guven !== baskin ? `<div class="hk-p-guven">${guven(p.guven)}</div>` : ''}${hkFotolar(p.fotolar)}`).join('');
  return `<section class="hk-bolum" aria-labelledby="hk-b${i}"><h2 class="hk-h2" id="hk-b${i}">${esc(b.baslik)}</h2>${paragraflar}
    <div class="hk-alt">${guven(baskin)}<button class="hk-kaynak-ac" data-hk-kaynak="${i}" aria-expanded="false" aria-controls="hk-k${i}">Kaynaklar (${kaynaklar.length}) ›</button></div>
    <ul class="hk-kaynak-liste" id="hk-k${i}" hidden>${kaynaklar.map((k) => `<li>${esc(k)}</li>`).join('')}</ul></section>`;
}
function hakkinda(id) {
  const e = ESER[id]; if (!e) return (location.hash = '#/');
  durum.secili = id; rotaKaldir();
  const cipler = [e.yil, e.yaptiran, e.tur, durum.masaustu ? [e.il, e.ilce].filter(Boolean).join(' · ') : ''].filter(Boolean).map((c) => `<span class="hk-cip">${esc(c)}</span>`).join('');
  const bolumler = e.hakkinda.map(hkBolum).join(SUSLEME);
  const kitaplar = hkKitaplar(e).map((k, i) => `<li>[${i + 1}] ${esc(k)}</li>`).join('');
  const kitapFoto = e.hakkinda.some((b) => b.fotolar || b.paragraflar.some((p) => p.fotolar));
  const dinle = e.hikaye.length ? `<button class="btn ana tam" data-git="#/anlat/${id}/dinle">${ic('headphones')}Kısa anlatımı dinle · ${e.sure} dk</button>` : '<button class="btn ana tam" disabled>Hikâye hazırlanıyor</button>';
  const kapakF = kapak(e);
  const kapakH = kapakF && !kitapFoto ? `<figure class="hk-kapak">${resim(kapakF)}</figure>` : '';   // kitabın fotoğrafları varsa kapak onlardan gelir
  if (durum.masaustu) {
    document.body.classList.add('tam-sayfa');
    gorusAc(`<div class="hk hk-d"><div class="hk-izgara"><article class="hk-sol">
      <div class="hk-ust-d"><button class="hk-geri" data-git="#/eser/${id}">${ic('chevron-left', 18)}${esc(e.ad)}</button>
        <nav class="hk-yol" aria-label="Konum"><a data-git="#/">Eserler</a> › <a data-git="#/eser/${id}">${esc(e.ad)}</a></nav></div>
      <h1 class="hk-h1">${esc(e.uzun_ad || e.ad)}</h1><div class="hk-cipler">${cipler}</div>${kapakH}${bolumler}${SUSLEME}
      <section class="hk-bolum"><h2 class="hk-h2">Kaynaklar</h2><ul class="hk-kitap">${kitaplar}</ul></section></article></div></div>`);
  } else {
    gorusAc(`<div class="hk hk-m"><header class="hk-ust"><button class="yuvarlak" data-git="#/eser/${id}" aria-label="Geri: ${esc(e.ad)}">${ic('chevron-left', 20)}</button>
      <div class="hk-ust-yazi"><b>Eser hakkında</b><small>${esc(e.ad)}</small></div><span style="width:40px"></span></header>
      <div class="hk-kaydir">${kapakH}<div class="hk-cipler">${cipler}</div>${bolumler}${SUSLEME}
      <section class="hk-bolum"><h2 class="hk-h2">Kaynaklar</h2><ul class="hk-kitap">${kitaplar}</ul></section></div>
      <div class="hk-dinle">${dinle}</div></div>`);
  }
}
document.addEventListener('click', (ev) => {
  const k = ev.target.closest('[data-hk-kaynak]');
  if (k) { const l = $('#hk-k' + k.dataset.hkKaynak); const ac = l.hidden; l.hidden = !ac; k.setAttribute('aria-expanded', String(ac)); k.textContent = k.textContent.replace(/[›⌄]$/, ac ? '⌄' : '›'); return; }
});

/* =====================================================================
   ROTA ÖNİZLEME
   ===================================================================== */
function rotaKaldir() {
  rotaModu = false; document.body.classList.remove('rota-modu'); $('#rota-geri')?.remove(); rotaIsaret.forEach((m) => m.remove()); rotaIsaret = [];
  if (harita.getLayer('rota-cizgi')) { harita.removeLayer('rota-cizgi'); harita.removeSource('rota'); }
  if (harita.getLayer('pin')) harita.setLayoutProperty('pin', 'visibility', 'visible');
}
function rotaOnizleme(id) {
  gorusKapat(); durum.secili = null; eserKartiCiz(); rotaKaldir(); rotaModu = true;
  if (harita.getLayer('pin-secili')) { harita.setFilter('pin-secili', ['==', ['get', 'id'], '']); }
  if (!durum.masaustu) { document.body.classList.add('rota-modu'); $('#sahne').insertAdjacentHTML('beforeend', `<button class="ikon-btn" id="rota-geri" data-git="#/" aria-label="Geri" style="box-shadow:var(--golge)">${ic('chevron-left')}</button>`); }
  const duraklar = ROTA.duraklar.map((d) => ESER[d]);
  const ciz = () => {
    if (harita.getSource('rota')) return;
    harita.addSource('rota', { type:'geojson', data:{ type:'Feature', geometry:{ type:'LineString', coordinates:duraklar.map((e) => [e.lon, e.lat]) } } });
    harita.addLayer({ id:'rota-cizgi', type:'line', source:'rota', paint:{ 'line-color':'#22566E', 'line-width':4, 'line-dasharray':[1.2, 1.2] } });
    harita.setLayoutProperty('pin', 'visibility', 'none');
  };
  harita.isStyleLoaded() ? ciz() : harita.once('idle', ciz);
  rotaIsaret = duraklar.map((e, i) => { const el = document.createElement('div'); el.className = 'yildiz buyuk'; el.textContent = i + 1; el.title = e.ad; el.onclick = () => (location.hash = '#/eser/' + e.id); return new maplibregl.Marker({ element:el }).setLngLat([e.lon, e.lat]).addTo(harita); });
  const b = new maplibregl.LngLatBounds(); duraklar.forEach((e) => b.extend([e.lon, e.lat]));
  harita.setPadding({ top:0, bottom:0, left:0, right:0 });
  harita.fitBounds(b, { padding:durum.masaustu ? 120 : { top:80, bottom:innerHeight * 0.6 + 10, left:40, right:80 }, maxZoom:17.6, duration:800 });
  const ilerleme = JSON.parse(yerel('akar.rota') || 'null');
  const govde = `${durum.masaustu ? `<button class="geri" data-git="#/" style="margin-bottom:14px">‹ Tüm rotalar</button>${resim(kapak(duraklar[0]), '')}` : ''}
    <h1 class="panel-baslik" style="font-size:26px;line-height:32px;margin-top:${durum.masaustu ? 16 : 4}px">${esc(ROTA.ad)}</h1>
    <div class="soluk">${duraklar.length} durak · ${ROTA.sure} · ${ROTA.mesafe} · ${ROTA.zorluk}</div><p style="margin:10px 0 0">${esc(ROTA.aciklama)}</p>
    <ul class="durak-liste">${duraklar.map((e, i) => `<li data-git="#/eser/${e.id}"><span class="yildiz">${i + 1}</span><b>${esc(e.ad)}</b><span class="soluk">${esc(e.yil)}</span></li>`).join('')}</ul>
    <div class="rota-alt"><button class="btn ana tam" id="rota-baslat">${ilerleme ? `Devam et · ${ilerleme.i + 1} / ${duraklar.length}` : 'Rotayı başlat'}</button><button class="metin-btn" id="rota-evden">Evden gez · konum gerekmez</button></div>`;
  if (durum.masaustu) { panel.innerHTML = govde; const im = $('#panel-ic img'); if (im) Object.assign(im.style, { width:'100%', height:'160px', objectFit:'cover', borderRadius:'12px' }); }
  else { alt.hidden = false; altIc.innerHTML = govde; altYukseklik('rota'); }
}
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-rotada]')) durum.rotada = true;
  if (e.target.closest('#rota-baslat, #rota-evden')) {
    durum.rotada = true;
    const r = JSON.parse(yerel('akar.rota') || 'null') || { i:0 }; yerel('akar.rota', JSON.stringify(r));
    location.hash = '#/eser/' + ROTA.duraklar[r.i];
  }
});

/* =====================================================================
   GEÇMİŞİ GÖR (Figma A1 · A2 · eski görüntü yok · çekim yeri bilinmiyor; W karşılıkları; D · D2 kamera)
   Veri: eserler/<eser>/gecmisi-gor/ (Foto Atlas, gecmisi_gor_uret.py).
   Bugünkü eş (A1b, Figma 89:2732 / 97:3046): hazirla.py her eski fotoğrafa `bugun` ekler (bugunku-esler.json, yoksa onaylı en yeni iz, izler.json);
   varsa ana görsel kaydırıcı olur: solda eski, sağda bugün. Eşsiz fotoğrafta ekran değişmez.
   ===================================================================== */
const gg = { eser:null, i:0, acik:false, harita:null, akis:null, cekilen:null, kip:'kaydirici' };
const TUM_GG = (() => { const m = new Map(); VERI.eserler.forEach((e) => e.gecmis.forEach((f) => { if (!m.has(f.fotoAtlasId)) m.set(f.fotoAtlasId, { f, eser:e }); })); return [...m.values()]; })();
const ilgi = (ad) => {   // Türkçe tamlayan eki: Ulucami'nin, Koza Hanı'nın, Bedesten'in
  const s = ad.toLocaleLowerCase('tr'), u = [...s].reverse().find((c) => 'aeıioöuü'.includes(c)) || 'e', son = s.at(-1);
  const v = { a:'ı', ı:'ı', e:'i', i:'i', o:'u', u:'u', ö:'ü', ü:'ü' }[u];
  return `${ad}'${'aeıioöuü'.includes(son) ? 'n' : ''}${v}n`;
};
const ggTur = (f) => (f.icMekan ? 'İç mekân' : 'Fotoğraf');
const ggLisans = (f) => (/^CC0/.test(f.lisans) ? 'CC0' : /^CC /.test(f.lisans) ? f.lisans.split(' ').slice(0, 2).join(' ') : /^Kamu malı/.test(f.lisans) ? 'Kamu malı' : 'Yazılı izin');
const ggKaynak = (f) => `${f.kaynakSatiri.replace(/^Fotoğraf:[^·]*·\s*/, '')} · ${ggLisans(f)}`;
const ggMeta = (f) => `${f.tarih.etiket} · ${f.fotografci || 'Fotoğrafçı bilinmiyor'}`;
const ggGuven = (f) => guven(['kesin', 'elle'].includes(f.eslesme) ? 'Doğrulanmış' : 'Tarihsel çıkarım');
const ggResim = (f, sinif = '') => `<img class="${sinif}" src="${esc(f.gorsel)}" alt="${esc(f.altMetin)}" decoding="async">`;
const mesafeYon = (a, b) => {   // a → b: metre, derece (0 = kuzey)
  const k = Math.cos(a.lat * Math.PI / 180), dx = (b.lng - a.lng) * 111320 * k, dy = (b.lat - a.lat) * 110540;
  return [Math.hypot(dx, dy), (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360];
};
/* eski görüntüsü olmayan eser başka eserlerin fotoğraflarında uzaktan görünüyor mu (görüş konisi içinde) */
function ggUzaktan(e) {
  return TUM_GG.filter(({ f, eser }) => eser !== e && !f.icMekan && f.cekimNoktasi && f.yon != null).map((x) => {
    const [d, b] = mesafeYon(x.f.cekimNoktasi, { lat:e.lat, lng:e.lon }), fark = Math.abs(((b - x.f.yon + 540) % 360) - 180);
    return { ...x, d, ok:d < 1500 && fark <= (x.f.gorusAcisi || 60) / 2 + 5 };
  }).filter((x) => x.ok).sort((a, b) => a.d - b.d).slice(0, 4);
}

function gecmisSayfa(id, i) {
  const e = ESER[id]; if (!e) return (location.hash = '#/');
  durum.secili = id; rotaKaldir(); ggTemizle();
  Object.assign(gg, { eser:e, i:Math.min(Math.max(0, +i || 0), Math.max(0, e.gecmis.length - 1)), acik:durum.masaustu ? gg.acik && gg.eser === e : false });
  const bas = `<div class="gg-bas"><button class="ikon-btn" data-git="#/eser/${id}" aria-label="Geri">${ic('chevron-left', 18)}</button><div class="gg-baslik"><b>Geçmişi Gör</b><small>${esc(e.ad)}</small></div></div>`;
  if (!e.gecmis.length) return ggBos(e, bas);
  const n = e.gecmis.length;
  const fotoKutu = `<div class="gg-foto" id="gg-foto"><div class="gg-bugun-kat"><img class="b-bulanik" alt=""><img class="b-ana" alt=""></div><div class="gg-eski-kat"><img class="bulanik" alt=""><img class="ana" alt=""></div>
    <span class="gg-k-etiket" id="gg-k-eski"></span><span class="gg-k-etiket sag" id="gg-k-bugun"></span>
    <div class="gg-k-tutamak" id="gg-k-tutamak" role="slider" tabindex="0" aria-label="Eski ve bugünkü fotoğrafı karşılaştır" aria-valuemin="0" aria-valuemax="100"><span aria-hidden="true">‹ ›</span></div>
    <span class="gg-sayac" id="gg-sayac"></span><span class="gg-guven" id="gg-guven"></span>
    ${durum.masaustu ? `<button class="yuvarlak gg-ok" style="left:16px" data-gg-adim="-1" aria-label="Önceki">${ic('chevron-left', 18)}</button><button class="yuvarlak gg-ok" style="right:16px" data-gg-adim="1" aria-label="Sonraki">${ic('chevron-right', 18)}</button>`
      : `<button class="gg-kamera" data-gg-kamera>${ic('camera', 18)}Kamerayı aç</button>`}</div>`;
  const serit = `<div class="gg-serit-bas"><b>Eski fotoğraflar${durum.masaustu ? ` · ${n}` : ''}</b>${durum.masaustu ? '' : `<span class="soluk">${n} fotoğraf</span>`}</div>
    <div class="gg-serit" id="gg-serit">${e.gecmis.map((f, k) => `<button data-gg-sec="${k}"><img src="${esc(f.kucuk)}" alt="" loading="lazy"><b>${esc(f.tarih.etiket)}</b><span>${ggTur(f)}${f.bugun ? '<i class="gg-bugunu-var" title="Bugünkü eşi var"></i><span class="gizli-metin">, bugünkü eşi var</span>' : ''}</span></button>`).join('')}</div>`;
  const yakinNot = '<p class="gg-yakin" id="gg-yakin" hidden>Yakın açı: iki fotoğraf birebir aynı noktadan çekilmedi.</p>';
  const nereden = `<div class="gg-nereden" id="gg-nereden"><span class="pin">${ic('map-pin', 18)}</span><div><b>Nereden çekildi?</b><small id="gg-nereden-alt"></small></div><button class="gg-ac" data-gg-ac aria-label="Haritayı aç">${ic('chevron-up', 20)}</button></div>`;
  const haritaAlan = `<div class="gg-harita-kap" id="gg-harita-kap"><div id="gg-harita"></div><div class="gg-bilinmiyor" id="gg-bilinmiyor" hidden>${ic('map-pin-off', 36)}<b>Bu fotoğrafın çekim yeri bilinmiyor</b><span>Kamerayı açıp eski fotoğrafı yine de hizalayabilirsin.</span></div></div>
    <div class="gg-lejant" id="gg-lejant"><span><i class="yesil"></i>${esc(ilgi(e.ad))} fotoğrafları</span><span><i></i>${durum.masaustu ? 'Diğer eski fotoğraflar' : 'Bölgedeki diğer eski fotoğraf'}</span></div>`;
  if (durum.masaustu) {
    document.body.classList.add('gg-tam');
    gorusAc(`<div class="gg gg-d">${bas.replace('gg-baslik', 'gg-baslik serif-baslik')}<div class="gg-izgara"><div class="gg-sol">${fotoKutu}${yakinNot}${serit}</div>
      <aside class="gg-kart"><div id="gg-bilgi"></div><hr>${nereden}<div class="gg-kart-harita" id="gg-kart-harita" hidden>${haritaAlan}</div><p class="gg-not">Yerindeysen telefonundan açıp eski fotoğrafı kamerada hizalayabilirsin.</p></aside></div></div>`, 'gg-gorus');
  } else {
    gorusAc(`<div class="gg gg-m" id="gg-kok">${bas}<div class="gg-kaydir">${fotoKutu}${yakinNot}<div id="gg-bilgi"></div>${serit}</div>
      <div class="gg-alt" id="gg-alt"><div class="tutamak" data-gg-ac><i></i></div>${nereden}<div class="gg-alt-govde">${haritaAlan}<button class="btn ana tam gg-kamera-btn" data-gg-kamera>${ic('camera', 20)}Kamerayı aç</button></div></div></div>`, 'gg-gorus');
  }
  ggKaydirma(!durum.masaustu);
  ggSec(gg.i, false); ggAcKapa(gg.acik);
}
function ggBos(e, bas) {
  const uz = ggUzaktan(e);
  const liste = uz.length ? `<div class="gg-uzak"><b class="gg-uzak-bas">Uzaktan görünüyor</b>${durum.masaustu ? `<small class="soluk">${esc(e.ad)} bu eski fotoğrafta uzaktan seçiliyor.</small>` : ''}
    ${uz.map(({ f, eser }) => `<button class="gg-uzak-satir" data-git="#/gecmis/${eser.id}/${eser.gecmis.indexOf(f)}"><img src="${esc(f.kucuk)}" alt=""><div><b>${esc(f.baslik)}</b><small>${esc(f.tarih.etiket)} · ${Math.round(uz.find((x) => x.f === f).d)} m uzaktan ›</small></div></button>`).join('')}</div>` : '';
  const bos = `<div class="gg-bos">${ic('image', 40)}<b>Bu eserin eski görüntüsü henüz yok</b><span>Elinde eski bir fotoğraf ya da gravür varsa paylaş; kaynağıyla birlikte incelenip eklenir.</span></div>`;
  const paylas = `<button class="btn cerceve tam" data-gg-izbirak>+ İz Bırak · eski fotoğraf paylaş</button>`;
  if (durum.masaustu) { document.body.classList.add('gg-tam'); gorusAc(`<div class="gg gg-d">${bas.replace('gg-baslik', 'gg-baslik serif-baslik')}<div class="gg-izgara"><div class="gg-sol">${bos}</div><aside class="gg-kart">${liste || '<b class="gg-uzak-bas">Uzaktan görünüyor</b><small class="soluk">Bu eser henüz başka bir eski fotoğrafta seçilmedi.</small>'}<div style="margin-top:auto">${paylas}</div></aside></div></div>`, 'gg-gorus'); }
  else gorusAc(`<div class="gg gg-m gg-m-bos">${bas}<div class="gg-kaydir">${bos}${liste}</div><div class="gg-bos-alt">${paylas}</div></div>`, 'gg-gorus');
}
function ggSec(i, kaydir = true) {
  const e = gg.eser, n = e.gecmis.length; gg.i = (i + n) % n; const f = e.gecmis[gg.i];
  history.replaceState(null, '', `#/gecmis/${e.id}/${gg.i}`);
  const fk = $('#gg-foto'), ana = $('.ana', fk);
  if (ana.dataset.id !== String(f.fotoAtlasId)) {
    ana.dataset.id = f.fotoAtlasId; ana.style.opacity = 0;
    const yeni = new Image(); yeni.onload = () => { if (gg.eser?.gecmis[gg.i] !== f) return; ana.src = f.gorsel; $('.bulanik', fk).src = f.kucuk; ana.alt = f.altMetin; ana.style.opacity = 1; }; yeni.src = f.gorsel;
  }
  fk.classList.toggle('nd', !f.duzenlenebilir);
  fk.style.setProperty('--oran', f.genislik / f.yukseklik);   // mobilde kutu fotoğrafın oranında (yatay fotoğrafta boş bant kalmasın)
  ggKarsilastir(f);
  $('#gg-sayac').textContent = `${gg.i + 1} / ${n}`; $('#gg-guven').innerHTML = ggGuven(f);
  $('#gg-bilgi').innerHTML = `<h2 class="gg-ad">${esc(f.baslik)}</h2><div class="gg-meta">${esc(ggMeta(f))}</div><div class="gg-kaynak">${esc(ggKaynak(f))}${f.bugun ? ` · Bugünkü fotoğraf: ${esc(f.bugun.kaynakSatiri.replace(/^Fotoğraf:\s*/, ''))}` : ''}</div><div class="gg-kisa">${esc(f.tarih.etiket)} · ${esc(f.baslik)}</div>`;
  $$('#gg-serit button').forEach((b, k) => b.setAttribute('aria-current', k === gg.i));
  if (kaydir) ggSeritOrtala();
  const yer = !!f.cekimNoktasi;
  $('#gg-nereden-alt').textContent = yer ? (gg.acik && !durum.masaustu ? 'Fotoğrafçı burada durup yeşil koninin yönüne bakmış' : `Çekim noktası ve bakış yönü${durum.masaustu ? '' : ' haritada'}`) : 'Konum Foto Atlas\'ta işaretlenmemiş';
  $('#gg-bilinmiyor').hidden = yer; $('#gg-harita').style.visibility = yer ? 'visible' : 'hidden'; $('#gg-lejant').style.visibility = yer ? 'visible' : 'hidden';
  ggHaritaGuncelle();
}
function ggSeritOrtala() {   // seçili küçük resmi şeridin içinde ortala; scrollIntoView sayfa kabını da yana kaydırıyordu (son fotoğrafta kenarda boşluk)
  const s = $('#gg-serit'), b = s && s.children[gg.i]; if (!b) return;
  const sr = s.getBoundingClientRect(), br = b.getBoundingClientRect();
  s.scrollTo({ left:s.scrollLeft + br.left - sr.left - (s.clientWidth - br.width) / 2, behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
function ggAcKapa(ac) {
  gg.acik = ac;
  const kok = $('#gg-kok'); kok && kok.classList.toggle('acik', ac);
  $('#gg-kart-harita') && ($('#gg-kart-harita').hidden = !ac);
  $$('[data-gg-ac].gg-ac').forEach((b) => { b.innerHTML = ic(ac ? 'chevron-down' : 'chevron-up', 20); b.setAttribute('aria-label', ac ? 'Haritayı kapat' : 'Haritayı aç'); });
  if (gg.eser?.gecmis.length) ggSec(gg.i, false);
  if (ac) setTimeout(() => { ggHaritaKur(); gg.harita && gg.harita.resize(); ggHaritaGuncelle(true); }, durum.masaustu ? 0 : 300);
}
function koni(p, yon, aci, r) {
  const k = Math.cos(p.lat * Math.PI / 180), pts = [[p.lng, p.lat]];
  for (let a = yon - aci / 2; a <= yon + aci / 2 + 0.01; a += aci / 16) { const t = a * Math.PI / 180; pts.push([p.lng + Math.sin(t) * r / (111320 * k), p.lat + Math.cos(t) * r / 110540]); }
  pts.push([p.lng, p.lat]); return { type:'Feature', geometry:{ type:'Polygon', coordinates:[pts] } };
}
function ggHaritaKur() {
  if (gg.harita || !$('#gg-harita')) return;
  const e = gg.eser, m = new maplibregl.Map({ container:'gg-harita', style:structuredClone(stil), center:[e.lon, e.lat], zoom:16, attributionControl:false, fadeDuration:0, pitchWithRotate:false, dragRotate:false });
  gg.harita = m;
  m.on('style.load', () => {
    if (m.getLayer('building_3d')) m.setLayoutProperty('building_3d', 'visibility', 'none');
    const bos = { type:'FeatureCollection', features:[] };
    ['gg-koni', 'gg-diger', 'gg-bu', 'gg-secili'].forEach((k) => m.addSource(k, { type:'geojson', data:bos }));
    m.addLayer({ id:'gg-koni', type:'fill', source:'gg-koni', paint:{ 'fill-color':'#2E7D32', 'fill-opacity':0.22 } });
    m.addLayer({ id:'gg-koni-cizgi', type:'line', source:'gg-koni', paint:{ 'line-color':'#2E7D32', 'line-width':1.5, 'line-opacity':0.7 } });
    m.addLayer({ id:'gg-diger', type:'circle', source:'gg-diger', paint:{ 'circle-radius':4, 'circle-color':'#6B7280', 'circle-stroke-color':'#fff', 'circle-stroke-width':1.5 } });
    m.addLayer({ id:'gg-bu', type:'circle', source:'gg-bu', paint:{ 'circle-radius':6, 'circle-color':'#2E7D32', 'circle-stroke-color':'#fff', 'circle-stroke-width':2 } });
    m.addLayer({ id:'gg-secili', type:'circle', source:'gg-secili', paint:{ 'circle-radius':11, 'circle-color':'#2E7D32', 'circle-stroke-color':'#fff', 'circle-stroke-width':3 } });
    VERI.eserler.forEach((x) => { const el = document.createElement('div'); el.className = 'gg-etiket' + (x === e ? ' bu' : ''); el.textContent = x.ad; new maplibregl.Marker({ element:el }).setLngLat([x.lon, x.lat]).addTo(m); });
    m.on('click', 'gg-bu', (ev) => ggSec(+ev.features[0].properties.i));
    m.on('mouseenter', 'gg-bu', () => (m.getCanvas().style.cursor = 'pointer')); m.on('mouseleave', 'gg-bu', () => (m.getCanvas().style.cursor = ''));
    ggHaritaGuncelle(true);
  });
}
function ggHaritaGuncelle(sigdir = false) {
  const m = gg.harita, e = gg.eser; if (!m || !m.getSource('gg-bu')) return;
  const f = e.gecmis[gg.i], nokta = (x, ek = {}) => ({ type:'Feature', properties:ek, geometry:{ type:'Point', coordinates:[x.cekimNoktasi.lng, x.cekimNoktasi.lat] } });
  const kendi = new Set(e.gecmis.map((x) => x.fotoAtlasId));
  m.getSource('gg-bu').setData({ type:'FeatureCollection', features:e.gecmis.map((x, i) => x.cekimNoktasi && i !== gg.i ? nokta(x, { i }) : null).filter(Boolean) });
  m.getSource('gg-diger').setData({ type:'FeatureCollection', features:TUM_GG.filter((x) => !kendi.has(x.f.fotoAtlasId) && x.f.cekimNoktasi).map((x) => nokta(x.f)) });
  const yer = f.cekimNoktasi, r = Math.min(700, Math.max(90, (f.eserMesafesiM || 200) * 1.15));
  m.getSource('gg-secili').setData({ type:'FeatureCollection', features:yer ? [nokta(f)] : [] });
  m.getSource('gg-koni').setData({ type:'FeatureCollection', features:yer && f.yon != null ? [koni(yer, f.yon, f.gorusAcisi || 60, r)] : [] });
  if (yer && sigdir) {
    const b = new maplibregl.LngLatBounds([yer.lng, yer.lat], [yer.lng, yer.lat]); b.extend([e.lon, e.lat]);
    if (f.yon != null) koni(yer, f.yon, f.gorusAcisi || 60, r).geometry.coordinates[0].forEach((c) => b.extend(c));
    m.fitBounds(b, { padding:28, maxZoom:17.5, duration:sigdir === true ? 0 : 500 });
  } else if (yer) m.easeTo({ center:[yer.lng, yer.lat], duration:400 });
}
function ggKaydirma(kaydir) {   // mobilde ana fotoğrafta sağa/sola kaydırma; kaydırıcı açıkken (iki düzende) sürükleme ayrımı taşır
  const fk = $('#gg-foto'); let x0 = null, surukle = false;
  const ayarla = (x) => { const r = fk.getBoundingClientRect(); ggAyrim((x - r.left) / r.width * 100); };
  fk.addEventListener('pointerdown', (ev) => {
    if (fk.classList.contains('esli') && !ev.target.closest('button')) { ev.preventDefault(); surukle = true; fk.setPointerCapture(ev.pointerId); ayarla(ev.clientX); return; }   // preventDefault: masaüstünde görselin yerel sürüklenmesi kaydırıcıyı kesmesin
    x0 = ev.clientX;
  });
  fk.addEventListener('pointermove', (ev) => surukle && ayarla(ev.clientX));
  fk.addEventListener('pointerup', (ev) => {
    if (surukle) { surukle = false; return; }
    if (x0 == null || !kaydir) return; const dx = ev.clientX - x0; x0 = null; if (Math.abs(dx) > 40) ggSec(gg.i + (dx < 0 ? 1 : -1));
  });
  $('#gg-k-tutamak').addEventListener('keydown', (ev) => {
    const v = parseFloat(fk.style.getPropertyValue('--ayrim')) || 50;
    const yeni = { ArrowLeft:v - 5, ArrowDown:v - 5, ArrowRight:v + 5, ArrowUp:v + 5, Home:0, End:100 }[ev.key];
    if (yeni == null) return; ev.preventDefault(); ev.stopPropagation(); ggAyrim(yeni);
  });
}
function ggAyrim(v) {   // kaydırıcı: v = eskinin görünen yüzdesi (soldan)
  v = Math.min(100, Math.max(0, Math.round(v)));
  const fk = $('#gg-foto'), t = $('#gg-k-tutamak'); fk.style.setProperty('--ayrim', v + '%');
  t.setAttribute('aria-valuenow', v); t.setAttribute('aria-valuetext', `Eski %${v}`);
}
function ggKarsilastir(f) {   // A1b: bugünkü eş varsa kaydırıcı; yoksa ekran eskisi gibi
  const fk = $('#gg-foto'), b = f.bugun; fk.classList.toggle('esli', !!b); $('#gg-yakin').hidden = !(b && b.aciBenzerligi === 'yakin');
  if (!b) return;
  const ba = $('.b-ana', fk); ba.src = b.gorsel; ba.alt = `Bugünkü görünüm: ${f.baslik}`; $('.b-bulanik', fk).src = b.kucuk;
  $('#gg-k-eski').textContent = f.tarih.etiket;
  $('#gg-k-bugun').textContent = `Bugün · ${b.kim}${b.ornek ? ' · Örnek katkı' : ''}`;
  ggAyrim(50);
}
function ggTemizle() {
  if (gg.harita) { gg.harita.remove(); gg.harita = null; }
  kameraKapat(); document.body.classList.remove('gg-tam');
}
document.addEventListener('click', (ev) => {
  if (!gg.eser) return;
  const s = ev.target.closest('[data-gg-sec]'); if (s) { ggSec(+s.dataset.ggSec); return; }
  const a = ev.target.closest('[data-gg-adim]'); if (a) { ggSec(gg.i + +a.dataset.ggAdim); return; }
  if (ev.target.closest('[data-gg-ac]')) { ggAcKapa(!gg.acik); return; }
  if (ev.target.closest('[data-gg-kamera]')) { location.hash = `#/kamera/${gg.eser.id}/${gg.i}`; return; }
  if (ev.target.closest('[data-gg-izbirak]')) { toast('İz Bırak prototipte yok; uygulamada eski fotoğraf kaynağıyla paylaşılır.'); return; }
});
document.addEventListener('keydown', (ev) => {
  if (!location.hash.startsWith('#/gecmis/') || !gg.eser?.gecmis.length) return;
  if (ev.key === 'ArrowRight') ggSec(gg.i + 1); else if (ev.key === 'ArrowLeft') ggSec(gg.i - 1); else if (ev.key === 'Escape') location.hash = '#/eser/' + gg.eser.id;
});

/* --- D · Kamera: eski fotoğraf bindirme; D2 · Çekildi --- */
function kameraKapat() { if (gg.akis) { gg.akis.getTracks().forEach((t) => t.stop()); gg.akis = null; } }
function kameraSayfa(id, i) {
  const e = ESER[id], f = e && e.gecmis[+i || 0]; if (!f) return (location.hash = '#/gecmis/' + id);
  Object.assign(gg, { eser:e, i:+i || 0 }); document.body.classList.add('gg-tam');
  gorusAc(`<div class="kam">
    <div class="kam-ust"><button class="kam-x" data-git="#/gecmis/${id}/${gg.i}" aria-label="Kapat">${ic('x', 20)}</button><div><b>${esc(e.ad)} · ${esc(f.tarih.etiket)}</b><small>${esc(f.icMekan ? 'İç mekân' : f.baslik)}</small></div></div>
    <div class="kam-alan" id="kam-alan"><video id="kam-video" autoplay playsinline muted></video><img class="kam-eski" id="kam-eski" src="${esc(f.gorsel)}" alt="" style="opacity:.5"></div>
    <div class="kam-ipucu">Eski fotoğrafı görüntüyle çakıştır</div>
    <div class="kam-kaydirici"><span>Eski</span><input type="range" id="kam-opak" min="0" max="100" value="50" aria-label="Eski fotoğrafın saydamlığı"><span>Bugün</span></div>
    <div class="kam-alt"><img class="kam-kucuk" src="${esc(f.kucuk)}" alt=""><button class="kam-deklansor" id="kam-cek" aria-label="Çek"><i></i></button><label class="kam-galeri"><span>${ic('image', 22)}</span>Galeri<input type="file" accept="image/*" id="kam-dosya" hidden></label></div>
    <div class="kam-modal" id="kam-izin" hidden><div class="kutu">${ic('camera-off', 40)}<b>Kameraya izin verilmedi</b><span id="kam-izin-metin">Eski fotoğrafı kamerada görmek için tarayıcı ayarlarından bu siteye kamera izni ver.</span><button class="btn ana tam" id="kam-tekrar">Tekrar dene</button><label class="btn cerceve tam">Galeriden seç<input type="file" accept="image/*" id="kam-dosya2" hidden></label></div><button class="metin-btn kam-don" data-git="#/gecmis/${id}/${gg.i}">Geçmişi Gör'e dön</button></div>
    ${f.icMekan ? `<div class="kam-sayfa" id="kam-ic"><div class="kutu"><b>${ic('info', 22)}İç mekândasın</b><ul><li>Namaz vakitlerinde fotoğraf çekme.</li><li>Ziyaretçilerin yüzünü çekme; yüzlü fotoğraflar yayımlanmaz.</li><li>Flaş kullanma.</li></ul><button class="btn ana tam" id="kam-anladim">Anladım</button></div></div>` : ''}
  </div>`, 'kam-gorus');
  kameraBaslat(); kameraBindirme();
}
async function kameraBaslat() {
  kameraKapat(); const v = $('#kam-video'); if (!v) return;
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error('guvensiz'), { name:'Guvensiz' });
    gg.akis = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'environment', width:{ ideal:1920 } }, audio:false });
    if (!location.hash.startsWith('#/kamera/')) return kameraKapat();
    v.srcObject = gg.akis; $('#kam-izin').hidden = true;
  } catch (err) {
    if (!$('#kam-izin')) return;
    $('#kam-izin').hidden = false;
    if (err.name === 'Guvensiz') $('#kam-izin-metin').textContent = 'Tarayıcı kamerayı yalnız güvenli bağlantıda (https) açar. Prototipi yerel ağdan açtığın için kamera kullanılamıyor; fotoğrafı galeriden seçebilirsin.';
  }
}
function kameraBindirme() {   // eski fotoğrafı iki parmakla büyüt, sürükle
  const alan = $('#kam-alan'), img = $('#kam-eski'), p = new Map(); let d = { x:0, y:0, s:1 }, bas = null;
  const uygula = () => (img.style.transform = `translate(${d.x}px, ${d.y}px) scale(${d.s})`);
  alan.addEventListener('pointerdown', (ev) => { alan.setPointerCapture(ev.pointerId); p.set(ev.pointerId, [ev.clientX, ev.clientY]); bas = { d:{ ...d }, p:new Map(p) }; });
  alan.addEventListener('pointermove', (ev) => {
    if (!p.has(ev.pointerId) || !bas) return; p.set(ev.pointerId, [ev.clientX, ev.clientY]);
    const k = [...p.keys()], b = k.map((x) => bas.p.get(x)).filter(Boolean), s = k.map((x) => p.get(x));
    if (s.length === 1 && b.length === 1) { d.x = bas.d.x + s[0][0] - b[0][0]; d.y = bas.d.y + s[0][1] - b[0][1]; }
    else if (s.length >= 2 && b.length >= 2) { const u = (a) => Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); d.s = Math.min(4, Math.max(0.3, bas.d.s * u(s) / u(b))); }
    uygula();
  });
  const birak = (ev) => { p.delete(ev.pointerId); bas = { d:{ ...d }, p:new Map(p) }; };
  alan.addEventListener('pointerup', birak); alan.addEventListener('pointercancel', birak);
  alan.addEventListener('wheel', (ev) => { ev.preventDefault(); d.s = Math.min(4, Math.max(0.3, d.s * (ev.deltaY < 0 ? 1.08 : 0.92))); uygula(); }, { passive:false });
}
function cekildiSayfa(id, i) {
  const e = ESER[id], f = e && e.gecmis[+i || 0]; if (!f) return (location.hash = '#/gecmis/' + id);
  if (!gg.cekilen) return (location.hash = `#/kamera/${id}/${i}`);
  Object.assign(gg, { eser:e, i:+i || 0 }); document.body.classList.add('gg-tam');
  gorusAc(`<div class="kam cek">
    <div class="kam-ust"><button class="kam-x" data-git="#/gecmis/${id}/${gg.i}" aria-label="Kapat">${ic('x', 20)}</button><div><b>Çekildi</b><small>${esc(e.ad)} · ${esc(f.tarih.etiket)} ile aynı açı</small></div></div>
    <div class="cek-sekme" role="tablist"><button role="tab" data-cek-kip="kaydirici">Kaydırıcı</button><button role="tab" data-cek-kip="yanyana">Yan yana</button></div>
    <div class="cek-karsi" id="cek-karsi"><div class="cek-yeni"><img src="${gg.cekilen}" alt="Senin fotoğrafın"><span class="cek-etiket sag">Senin fotoğrafın</span></div><div class="cek-eski" id="cek-eski"><img src="${esc(f.gorsel)}" alt="${esc(f.altMetin)}"><span class="cek-etiket">${esc(f.tarih.etiket)}</span></div><button class="cek-tutamak" id="cek-tutamak" aria-label="Kaydır">‹ ›</button></div>
    <p class="cek-not">Gönderirsen moderasyondan sonra Yaşayan hafızada görünür ve bu fotoğrafın bugünkü eşi olabilir.</p>
    <div class="cek-dugmeler"><button class="btn ana tam" data-gg-izbirak>İz Bırak olarak gönder</button><div class="ikili"><button class="btn koyu" id="cek-paylas">${ic('share-2', 18)}Paylaş</button><button class="btn koyu" data-git="#/kamera/${id}/${gg.i}">${ic('rotate-cw', 18)}Tekrar çek</button></div><small>Paylaşılan görselde kaynak satırı otomatik yazılır.</small></div>
  </div>`, 'kam-gorus');
  cekKip(gg.kip);
  const k = $('#cek-karsi'); let surukle = false;
  const ayarla = (x) => { const r = k.getBoundingClientRect(), y = Math.min(98, Math.max(2, (x - r.left) / r.width * 100)); k.style.setProperty('--ayrim', y + '%'); };
  k.addEventListener('pointerdown', (ev) => { if (gg.kip !== 'kaydirici') return; surukle = true; k.setPointerCapture(ev.pointerId); ayarla(ev.clientX); });
  k.addEventListener('pointermove', (ev) => surukle && ayarla(ev.clientX));
  k.addEventListener('pointerup', () => (surukle = false));
}
function cekKip(kip) { gg.kip = kip; $('#cek-karsi')?.classList.toggle('yanyana', kip === 'yanyana'); $$('[data-cek-kip]').forEach((b) => b.setAttribute('aria-selected', b.dataset.cekKip === kip)); }
function cekilenAl(src) { gg.cekilen = src; kameraKapat(); location.hash = `#/cekildi/${gg.eser.id}/${gg.i}`; }
document.addEventListener('input', (ev) => { if (ev.target.id === 'kam-opak') $('#kam-eski').style.opacity = 1 - ev.target.value / 100; });
document.addEventListener('change', (ev) => {
  if (!['kam-dosya', 'kam-dosya2'].includes(ev.target.id) || !ev.target.files[0]) return;
  const r = new FileReader(); r.onload = () => cekilenAl(r.result); r.readAsDataURL(ev.target.files[0]);
});
document.addEventListener('click', (ev) => {
  if (ev.target.closest('#kam-cek')) {
    const v = $('#kam-video'); if (!v || !v.videoWidth) { toast('Kamera görüntüsü yok; galeriden seçebilirsin.'); return; }
    const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0); cekilenAl(c.toDataURL('image/jpeg', 0.85)); return;
  }
  if (ev.target.closest('#kam-tekrar')) { kameraBaslat(); return; }
  if (ev.target.closest('#kam-anladim')) { $('#kam-ic')?.remove(); return; }
  const k = ev.target.closest('[data-cek-kip]'); if (k) { cekKip(k.dataset.cekKip); return; }
  if (ev.target.closest('#cek-paylas')) {
    const f = gg.eser.gecmis[gg.i];
    if (navigator.share) navigator.share({ title:`${gg.eser.ad} · ${f.tarih.etiket} ve bugün`, text:`Eski fotoğraf: ${f.kaynakSatiri}` }).catch(() => {});
    else toast('Bu tarayıcı paylaşmayı desteklemiyor.');
  }
});

/* =====================================================================
   YÖNLENDİRME
   ===================================================================== */
/* =====================================================================
   GÖREVLER VE ROZETLER (28 Ekim 2026)
   Figma akar-yeni: «WF · Bulmaca» 1:7147, «/ Doğru» 1:7169, «/ Yanlış» 1:7204, «D · Bulmaca» 1:3292,
   «WF · Rozet bildirimi» 1:6181, «WF · Profil (girişli)» 1:7372, «D · Profil» 1:3591.
   Veri: eserler/<eser>/icerik/gorevler.json → veri.json (e.gorevler, e.rozetler). Esere özel kod yok.
   Kurallar: puan, süre, ceza yok; cami içinde görev yok; her görevin evden karşılığı var.
   İlerleme bu cihazda (localStorage): akar.gorev.<görev id> = 'evden' | 'yerinde', akar.rozet.<rozet id> = tarih.
   ===================================================================== */
const gorevDurum = (g) => yerel('akar.gorev.' + g.id);
const rozetVar = (r) => !!yerel('akar.rozet.' + r.id);
const tumRozetler = () => VERI.eserler.flatMap((e) => (e.rozetler || []).map((r) => ({ ...r, eser:e })));
const gorevFoto = (e, dosya) => e.fotolar.find((f) => f.dosya === dosya);
const YILDIZ = (() => { const p = []; for (let i = 0; i < 16; i++) { const r = i % 2 ? 11.2 : 15, a = Math.PI / 8 * i - Math.PI / 2; p.push(`${(16 + r * Math.cos(a)).toFixed(2)},${(16 + r * Math.sin(a)).toFixed(2)}`); } return p.join(' '); })();
const rozetIkon = (var_, boy = 32) => `<svg class="rozet-ik${var_ ? '' : ' yok'}" width="${boy}" height="${boy}" viewBox="0 0 32 32" aria-hidden="true"><polygon points="${YILDIZ}"/><circle cx="16" cy="16" r="4.6"/></svg>`;
const kosulMetni = (r) => (r.kosul?.hikaye_bitti ? 'Hikâyeyi sonuna kadar dinle ya da oku.' : `Görev: ${r.eser.gorevler.find((g) => g.id === r.kosul?.gorev)?.baslik || ''}`);
const gv = { eser:null, i:0, secim:null, ipucu:0, sonuc:null, bul:null, sifirla:false };

function rozetKontrol(e) {
  for (const r of e.rozetler || []) {
    if (rozetVar(r)) continue;
    const k = r.kosul || {};
    const tamam = (k.hikaye_bitti && bittiMi(e.id)) || (k.gorev && gorevDurum({ id:k.gorev }));
    if (tamam) { yerel('akar.rozet.' + r.id, new Date().toISOString()); rozetBildir(r); }
  }
}
let rozetSira = [], rozetZ = 0;
function rozetBildir(r) {
  rozetSira.push(r); if (rozetSira.length > 1) return;
  const goster = () => {
    const x = rozetSira[0]; if (!x) return;
    let b = $('#rozet-bildirim');
    if (!b) { b = document.createElement('div'); b.id = 'rozet-bildirim'; b.setAttribute('role', 'status'); b.setAttribute('aria-live', 'polite'); $('#app').appendChild(b); }
    b.innerHTML = `<button class="rozet-bant" data-git="#/profil">${rozetIkon(true, 40)}<span><b>Rozet kazandın · ${esc(x.ad)}</b><small>${esc(x.metin || '')}</small></span>${ic('chevron-right', 18)}</button>`;
    b.hidden = false; requestAnimationFrame(() => b.classList.add('acik'));
    clearTimeout(rozetZ);
    rozetZ = setTimeout(() => { b.classList.remove('acik'); setTimeout(() => { b.hidden = true; rozetSira.shift(); goster(); }, 300); }, 4500);
  };
  goster();
}
function gorevTamamla(e, g, nasil) {
  if (gorevDurum(g) !== 'yerinde') yerel('akar.gorev.' + g.id, nasil);   // yerinde yapılan sonradan «evden»e düşmez
  rozetKontrol(e);
}

/* bulmaca ekranı: #/gorev/<eser>/<sıra> */
function gorevSayfa(id, i) {
  const e = ESER[id]; if (!e) return (location.hash = '#/');
  if (!e.gorevler?.length) { toast('Bu eserin görevi henüz hazırlanmadı.'); return (location.hash = '#/eser/' + id); }
  durum.secili = id; rotaKaldir();
  const n = e.gorevler.length;
  if (i === undefined || i === '') i = Math.max(0, e.gorevler.findIndex((g) => !gorevDurum(g)));
  i = Math.min(n - 1, Math.max(0, +i || 0));
  if (gv.eser !== e || gv.i !== i) Object.assign(gv, { eser:e, i, secim:null, ipucu:0, sonuc:gorevDurum(e.gorevler[i]) ? 'dogru' : null });
  const g = e.gorevler[i], f = gorevFoto(e, g.gorsel);
  const gorsel = `<figure class="gv-gorsel">${f ? resim(f) : '<div class="gorsel-yok"></div>'}${f ? `<figcaption>${esc(f.baslik || '')}</figcaption>` : ''}</figure>`;
  const ust = (kapat) => `<div class="gv-ust">${kapat ? '' : `<button class="yuvarlak" data-git="#/eser/${id}" aria-label="Geri: ${esc(e.ad)}">${ic('chevron-left', 20)}</button>`}
    <div class="gv-ust-yazi"><b>${g.tur === 'saha' ? 'Saha görevi' : 'Bulmaca'}</b><small>${esc(e.ad)}</small></div><span class="sayac">${i + 1} / ${n}</span>
    ${kapat ? `<button class="yuvarlak gv-kapat" data-git="#/eser/${id}" aria-label="Kapat">${ic('x', 18)}</button>` : ''}</div>`;
  let govde;
  if (g.tur === 'soru') {
    const secenek = g.secenekler.map((s, k) => `<button role="radio" class="gv-secenek" data-gv-sec="${k}" aria-checked="${gv.secim === k}">${esc(s)}</button>`).join('');
    const ipucu = (g.ipuclari || []).map((p, k) => `<button class="btn ${k > gv.ipucu ? 'ikincil gv-kilitli' : 'cerceve'}${k < gv.ipucu ? ' acildi' : ''}" data-gv-ipucu="${k}" ${k > gv.ipucu ? 'aria-disabled="true"' : ''}>İpucu ${k + 1}${k > gv.ipucu ? `<small>${k}. ipucundan sonra açılır</small>` : ''}</button>`).join('');
    const acik = (g.ipuclari || []).slice(0, gv.ipucu).map((p, k) => `<p class="gv-ipucu-metin"><b>İpucu ${k + 1}:</b> ${esc(p)}</p>`).join('');
    govde = `<h1 class="gv-soru">${esc(g.soru)}</h1><p class="gv-alt soluk">Fotoğrafa bak; cevabı hikâyede de duydun.</p>
      <div class="gv-secenekler" role="radiogroup" aria-label="Seçenekler">${secenek}</div>
      <div class="gv-ipuclari">${ipucu}</div>${acik}
      <div class="gv-alt-dugme"><button class="btn ana tam" data-gv-cevapla ${gv.secim === null ? 'disabled' : ''}>Cevapla</button>
      ${i < n - 1 ? `<button class="metin-btn soluk" data-git="#/gorev/${id}/${i + 1}">Bu soruyu atla</button>` : ''}</div>`;
  } else {
    govde = `<h1 class="gv-soru">${esc(g.baslik)}</h1><p class="gv-alt">${esc(g.gorev)}</p>
      <div class="gv-yollar">
        <div class="gv-yol"><div class="gv-yol-bas">${ic('map-pin', 18)}<b>Yerindeysen</b></div><p>${esc(g.yerinde?.yap || '')}</p><button class="btn ana tam" data-gv-buradayim>Buradayım</button></div>
        <div class="gv-yol"><div class="gv-yol-bas">${ic('box', 18)}<b>Evdeysen</b></div><p>${esc(g.evden?.yap || '')}</p><button class="btn ikincil tam" data-gv-3d>3D modelde bul</button></div>
      </div>`;
  }
  const html = `${gorsel}<div class="gv-icerik">${govde}</div>`;
  if (durum.masaustu) gorusAc(`<div class="gv-perde"><div class="gv-modal" role="dialog" aria-modal="true" aria-label="${g.tur === 'saha' ? 'Saha görevi' : 'Bulmaca'}">${ust(true)}<div class="gv-modal-ic">${html}</div><div id="gv-sonuc"></div></div></div>`, 'gv-gorus');
  else gorusAc(`<div class="gv gv-m">${ust(false)}<div class="gv-kaydir">${html}</div><div id="gv-sonuc"></div></div>`, 'gv-gorus');
  if (gv.sonuc) gorevSonuc();
}
function gorevSonuc() {
  const e = gv.eser, g = e.gorevler[gv.i], n = e.gorevler.length, k = $('#gv-sonuc'); if (!k) return;
  if (!gv.sonuc) { k.innerHTML = ''; return; }
  const rozet = (e.rozetler || []).find((r) => r.kosul?.gorev === g.id);
  const sonraki = gv.i < n - 1 ? `<button class="btn ana tam" data-git="#/gorev/${e.id}/${gv.i + 1}">Sonraki görev · ${gv.i + 2}/${n}</button>`
    : `<button class="btn ana tam" data-git="#/profil">Rozetlerime bak</button>`;
  if (gv.sonuc === 'dogru') {
    const nasil = gorevDurum(g) === 'yerinde' ? '<span class="gv-yerinde">Yerinde</span>' : '';
    k.innerHTML = `<div class="gv-sayfa" role="status"><div class="gv-isaret dogru">${ic('check', 26)}</div>
      <h2 class="gv-sonuc-baslik">${g.tur === 'soru' ? `Doğru! ${esc(g.secenekler[g.dogru])}.` : `Buldun! ${esc(g.baslik)}.`}</h2>
      <p>${esc(g.tur === 'soru' ? g.dogru_metin : g.tamam_metin)}</p>
      <div class="gv-cipler">${guven(g.guven)}<span class="gv-kaynak">Kaynak: ${esc(g.kaynak)}</span>${nasil}</div>
      ${rozet ? `<div class="gv-rozet">${rozetIkon(true, 36)}<div><b>${esc(rozet.ad)}</b><small>Rozet profiline eklendi</small></div></div>` : ''}
      ${sonraki}<button class="metin-btn" data-git="#/eser/${e.id}">${esc(e.ad)}’e dön</button></div>`;
  } else {
    const yeni = gv.ipucu > 0 && gv.yeniIpucu ? `İpucu ${gv.ipucu} açıldı: ${esc(g.ipuclari[gv.ipucu - 1])}` : 'Bir daha bak; ipuçları yukarıda.';
    k.innerHTML = `<div class="gv-sayfa" role="status"><div class="gv-isaret yanlis">?</div>
      <h2 class="gv-sonuc-baslik">Tam değil, bir daha bak</h2><p>${yeni}</p>
      <button class="btn ana tam" data-gv-tekrar>Tekrar dene</button><button class="metin-btn" data-gv-goster>Cevabı göster</button></div>`;
  }
  k.querySelector('.btn')?.focus({ preventScroll:true });
}
async function gorevBuradayim() {
  const e = gv.eser, g = e.gorevler[gv.i], r = g.yerinde?.konum_yaricap_m || 80;
  if (!navigator.geolocation || !isSecureContext) return toast('Konum alınamadı: tarayıcı konumu yalnız güvenli bağlantıda (https) verir. Görevi evden çözebilirsin.');
  toast('Konumun alınıyor…');
  navigator.geolocation.getCurrentPosition((p) => {
    const [m] = mesafeYon({ lat:p.coords.latitude, lng:p.coords.longitude }, { lat:e.lat, lng:e.lon });
    if (m <= r) { gorevTamamla(e, g, 'yerinde'); gv.sonuc = 'dogru'; gorevSonuc(); }
    else toast(`${ilgi(e.ad)} yaklaşık ${m < 1000 ? Math.round(m / 10) * 10 + ' m' : (m / 1000).toFixed(1).replace('.', ',') + ' km'} uzaktasın. Yaklaşınca tekrar dene ya da evden çöz.`);
  }, () => toast('Konum izni verilmedi. Görevi evden çözebilirsin.'), { enableHighAccuracy:true, timeout:10000 });
}
/* evden: 3D modelde doğru parçaya dokun (parcaSecildi bu kontrolü çağırır) */
function gorevParca(ad) {
  if (!gv.bul || !ad) return false;
  const e = ESER[gv.bul.eser], g = e.gorevler[gv.bul.i];
  const kart = parcaBilgi(ad), dogru = ad === g.evden.parca || !!kart?.adlar.includes(g.evden.parca);
  if (!dogru) { toast(`Bu ${kart?.baslik ? kart.baslik.toLocaleLowerCase('tr') : 'parça'}. Aradığın başka bir yer.`); return true; }
  gorevTamamla(e, g, 'evden'); gv.bul = null; $('#gv-bul')?.remove();
  Object.assign(gv, { eser:e, i:g === e.gorevler[gv.i] ? gv.i : e.gorevler.indexOf(g), sonuc:'dogru' });
  location.hash = `#/gorev/${e.id}/${gv.i}`;
  return true;
}
function gorevBulGoster() {
  $('#gv-bul')?.remove(); if (!gv.bul || !location.hash.startsWith('#/eser/' + gv.bul.eser)) return;
  const e = ESER[gv.bul.eser], g = e.gorevler[gv.bul.i], d = document.createElement('div');
  d.id = 'gv-bul'; d.setAttribute('role', 'status');
  d.innerHTML = `${ic('pointer', 18)}<span><b>Görev:</b> ${esc(g.evden.yap)}</span><button class="yuvarlak" data-gv-birak aria-label="Görevi bırak">${ic('x', 16)}</button>`;
  $('#gorus')?.appendChild(d);
}
document.addEventListener('click', (ev) => {
  const t = ev.target;
  if (t.closest('[data-bulmaca]')) { const id = durum.secili; if (id) location.hash = '#/gorev/' + id; return; }
  if (t.closest('.avatar')) { location.hash = '#/profil'; return; }
  const s = t.closest('[data-gv-sec]');
  if (s) { gv.secim = +s.dataset.gvSec; $$('[data-gv-sec]').forEach((b) => b.setAttribute('aria-checked', String(b === s))); const c = $('[data-gv-cevapla]'); if (c) c.disabled = false; return; }
  const p = t.closest('[data-gv-ipucu]');
  if (p) { const k = +p.dataset.gvIpucu; if (k > gv.ipucu) return; if (k === gv.ipucu) gv.ipucu++; gv.yeniIpucu = false; gorevSayfa(gv.eser.id, gv.i); return; }
  if (t.closest('[data-gv-cevapla]')) {
    const e = gv.eser, g = e.gorevler[gv.i]; if (gv.secim === null) return;
    if (gv.secim === g.dogru) { gorevTamamla(e, g, 'evden'); gv.sonuc = 'dogru'; }
    else { gv.sonuc = 'yanlis'; gv.yeniIpucu = gv.ipucu < (g.ipuclari || []).length; if (gv.yeniIpucu) gv.ipucu++; $('.gv-secenekler')?.classList.remove('sars'); void $('.gv-secenekler')?.offsetWidth; $('.gv-secenekler')?.classList.add('sars'); }
    gorevSonuc(); return;
  }
  if (t.closest('[data-gv-tekrar]')) { gv.sonuc = null; gv.secim = null; gorevSayfa(gv.eser.id, gv.i); return; }
  if (t.closest('[data-gv-goster]')) { const g = gv.eser.gorevler[gv.i]; gv.sonuc = null; gv.secim = g.dogru; gv.ipucu = (g.ipuclari || []).length; gorevSayfa(gv.eser.id, gv.i); $('[data-gv-cevapla]')?.focus(); toast(`Doğru cevap: ${g.secenekler[g.dogru]}. Seçili; Cevapla’ya dokun.`); return; }
  if (t.closest('[data-gv-buradayim]')) { gorevBuradayim(); return; }
  if (t.closest('[data-gv-3d]')) { gv.bul = { eser:gv.eser.id, i:gv.i }; durum.gorunum = '3d'; location.hash = '#/eser/' + gv.eser.id; return; }
  if (t.closest('[data-gv-birak]')) { gv.bul = null; $('#gv-bul')?.remove(); return; }
  if (t.closest('[data-profil-sifirla]')) {
    if (!gv.sifirla) { gv.sifirla = true; t.closest('[data-profil-sifirla]').textContent = 'Emin misin? Silmek için tekrar dokun'; return; }
    try { Object.keys(localStorage).filter((k) => /^akar\.(gorev|rozet|bitti|ilerleme)\./.test(k)).forEach((k) => localStorage.removeItem(k)); } catch { /* depolama kapalı */ }
    gv.sifirla = false; harita.getSource('eserler')?.setData(eserNoktalari()); toast('Bu cihazdaki ilerleme silindi.'); profilSayfa(); return;
  }
});
document.addEventListener('keydown', (ev) => {
  if (!location.hash.startsWith('#/gorev/') || !gv.eser) return;
  if (ev.key === 'Escape') { if (gv.sonuc === 'yanlis') { gv.sonuc = null; gorevSonuc(); } else location.hash = '#/eser/' + gv.eser.id; }
  const s = ev.target.closest?.('[data-gv-sec]');
  if (s && ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(ev.key)) {
    const l = $$('[data-gv-sec]'), k = (l.indexOf(s) + (/Down|Right/.test(ev.key) ? 1 : l.length - 1)) % l.length; l[k].focus(); l[k].click(); ev.preventDefault();
  }
});

/* profil: #/profil (avatardan). Giriş yok; bu cihazdaki ilerleme gösterilir */
function profilSayfa() {
  rotaKaldir(); gv.sifirla = false;
  VERI.eserler.forEach(rozetKontrol);   // bu özellikten önce bitirilmiş hikâyeler de rozetini alsın
  const rozetler = tumRozetler(), kazanilan = rozetler.filter(rozetVar).length;
  const kesif = VERI.eserler.map((e) => {
    const n = e.hikaye.length, ii = +(yerel('akar.ilerleme.' + e.id) || 0), bitti = bittiMi(e.id);
    const gt = (e.gorevler || []).filter(gorevDurum).length, gn = (e.gorevler || []).length;
    if (!bitti && !ii && !gt) return null;
    const parca = [bitti ? `${ic('check', 14)}Hikâye tamamlandı` : ii ? `${ii + 1}/${n} bölüm` : n ? 'Hikâye dinlenmedi' : '', gn ? `Görev ${gt}/${gn}` : ''].filter(Boolean).join(' · ');
    const eylem = bitti || !n ? `<button class="metin-k" data-git="#/eser/${e.id}">Tekrar göz at ›</button>` : `<button class="metin-k ana" data-git="#/anlat/${e.id}/${yerel('akar.mod') || 'dinle'}">${ii ? 'Devam et' : 'Dinle'} ›</button>`;
    return `<li><div><b>${esc(e.ad)}</b><small>${parca}</small></div>${eylem}</li>`;
  }).filter(Boolean);
  const kesifSayi = kesif.length;
  const kesifH = kesif.length ? `<ul class="pf-liste">${kesif.join('')}</ul>` : '<p class="pf-bos">Henüz bir eser keşfetmedin. Haritadan bir eser seç ve hikâyesini dinle.</p>';
  const rozetH = rozetler.length ? `<ul class="pf-rozetler">${rozetler.map((r) => { const v = rozetVar(r); return `<li class="${v ? '' : 'yok'}" title="${esc(v ? r.metin : kosulMetni(r))}">${rozetIkon(v, 40)}<b>${esc(r.ad)}</b><small>${v ? esc(r.eser.ad) : esc(kosulMetni(r))}</small></li>`; }).join('')}</ul>` : '<p class="pf-bos">Rozetler hazırlanıyor.</p>';
  const kimlik = `<div class="pf-kimlik"><span class="pf-avatar">M</span><div><h1 class="pf-ad">Misafir</h1><div class="pf-ozet">${rozetIkon(true, 16)}${kazanilan} rozet</div></div></div>
    <div class="pf-alt soluk">${kesifSayi} eser keşfedildi · ${VERI.eserler.reduce((a, e) => a + (e.gorevler || []).filter(gorevDurum).length, 0)} görev</div>${SUSLEME}
    <p class="pf-not soluk">İlerlemen bu cihazda saklanıyor. Giriş yapınca hesabına taşınır.</p>`;
  const bolumler = `<section class="pf-bolum"><div class="pf-bas"><h2>Keşfettiklerim</h2></div><div class="pf-kutu">${kesifH}</div></section>
    <section class="pf-bolum"><div class="pf-bas"><h2>Rozetler</h2><span class="pf-sayi">${kazanilan} / ${rozetler.length}</span></div><div class="pf-kutu">${rozetH}</div></section>`;
  const sifirla = '<button class="pf-sifirla" data-profil-sifirla>Bu cihazdaki ilerlemeyi sil</button>';
  if (durum.masaustu) gorusAc(`<div class="pf pf-d"><div class="pf-izgara"><aside class="pf-sol">${kimlik}<div class="pf-kutu pf-ayar">${sifirla}</div></aside><div class="pf-sag">${bolumler}</div></div></div>`, 'pf-gorus');
  else gorusAc(`<div class="pf pf-m"><header class="gv-ust"><button class="yuvarlak" data-git="#/" aria-label="Haritaya dön">${ic('chevron-left', 20)}</button><div class="gv-ust-yazi"><b>Profil</b></div><span style="width:40px"></span></header>
    <div class="pf-kaydir">${kimlik}${bolumler}<div class="pf-kutu pf-ayar">${sifirla}</div></div></div>`, 'pf-gorus');
}

function yonlendir() {
  const [ad, id, mod] = location.hash.replace(/^#\/?/, '').split('/');
  document.body.classList.toggle('gorus-acik', !!ad && ad !== 'rota');
  document.body.classList.toggle('tam-sayfa', ['hakkinda', 'profil', 'gorev'].includes(ad) && durum.masaustu);
  if (ad !== 'eser' && ad !== 'gorev') gv.bul = null;
  if (ad !== 'anlat') anlatDur();
  if (!ad) durum.rotada = false;
  if (!['gecmis', 'kamera', 'cekildi'].includes(ad)) { ggTemizle(); gg.eser = null; } else if (ad !== 'kamera') kameraKapat();
  if (!durum.masaustu && ad !== 'rota' && ['rota'].includes(durum.altH)) altYukseklik('kapali');
  switch (ad) {
    case 'eser': eserDetay(id); return gorevBulGoster();
    case 'gorev': return gorevSayfa(id, mod);
    case 'profil': return profilSayfa();
    case 'anlat': return anlatim(id, mod === 'oku' ? 'oku' : 'dinle');
    case 'son': return hikayeSonrasi(id);
    case 'hakkinda': return hakkinda(id);
    case 'gecmis': return gecmisSayfa(id, mod);
    case 'kamera': return kameraSayfa(id, mod);
    case 'cekildi': return cekildiSayfa(id, mod);
    case 'rota': return rotaOnizleme(id);
    default: return kesif();
  }
}
addEventListener('hashchange', yonlendir);
$('#panel-sekme').onclick = () => { document.body.classList.toggle('panel-kapali'); setTimeout(() => harita.resize(), 300); };
altYukseklik('kapali');
yonlendir();
window.akar = { durum, VERI, harita, anlat, s3d:() => s3d }; window.akarIzler = IZLER;   // yalnız sınama için
