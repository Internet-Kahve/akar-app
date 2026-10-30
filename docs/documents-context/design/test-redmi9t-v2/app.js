/* AKAR · Redmi 9T prototipi · v2 (27–28 Ekim 2026): Ulucami v27, «İçini göster», parça kartları; eser ayarları veriden (bkz. BENIOKU.md, v2 bölümü).
   v1 (test-redmi9t/) değişmedi. Figma `akar-yeni` mobil ve masaüstü ekranlarının çalışan hâli:
   keşif haritası (3D binalar + AKAR modelleri), eserler, rotalar, eser detayı (Fotoğraf | 3D), anlatım (Dinle | Oku).
   İçerik veri.json'dan gelir (hazirla.py, her eserin icerik klasöründen üretir). */
import * as THREE from 'three';
import * as maplibregl from 'maplibre-gl';   // 28 Ekim 2026: MapLibre 6.15 (ürünle aynı sürüm; 4.7'de küre yoktu). ESM; index.html import map'i
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as turf from 'https://cdn.jsdelivr.net/npm/@turf/turf@7.1.0/+esm';   // OSM binalarını model izinden kesmek için (binalariGuncelle)

const $ = (s, k = document) => k.querySelector(s);
const $$ = (s, k = document) => [...k.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
/* eser detayı seçenekleri (29 Ekim 2026, karar bekliyor): ?detay=derinlik,kopru · ?detay= boş bırakılırsa kapanır; seçim cihazda kalır (akar.detay).
   derinlik: kısa hikâye ve «Eser hakkında»nın yanında uzunluk çubuğu · kopru: kısa hikâye bitince tebrik kartında «Eser hakkında»ya köprü */
const DETAY = (() => { try { const q = new URLSearchParams(location.search).get('detay'); if (q !== null) localStorage.setItem('akar.detay', q); return new Set((q ?? localStorage.getItem('akar.detay') ?? '').split(',').map((x) => x.trim()).filter(Boolean)); } catch { return new Set(); } })();
const derinlikCubuk = (dk) => !DETAY.has('derinliksiz') ? `<span class="derinlik" aria-hidden="true">${[1, 2, 3, 4, 5].map((n) => `<i${n <= Math.min(5, Math.max(1, Math.round(dk / 3))) ? ' class="d"' : ''}></i>`).join('')}</span>` : '';
/* 30 Ekim 2026: 3D modeli olmayan eser (model.json yok, yalnız fotoğraf): görünüm seçicisi gizlenir, sahne hep fotoğraf. Tercih cihazda kalır, modeli olan esere dönünce geri gelir. */
const gorunumAyar = (e) => { const yok = !!e && !e.glb; durum.gorunum = yok ? 'foto' : (yerel('akar.gorunum') || 'foto'); document.body.classList.toggle('uc-yok', yok); };
const yerel = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { return null; } };

/* ---------- ikonlar (lucide, strokeWidth 2) ---------- */
const IK = {
  search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  'chevron-left':'<path d="m15 18-6-6 6-6"/>', 'chevron-right':'<path d="m9 18 6-6-6-6"/>', 'chevron-down':'<path d="m6 9 6 6 6-6"/>',
  x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', check:'<path d="M20 6 9 17l-5-5"/>',
  headphones:'<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  'book-open-text':'<path d="M12 7v14"/><path d="M16 12h2"/><path d="M16 8h2"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/><path d="M6 12h2"/><path d="M6 8h2"/>',
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
  landmark:'<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
  house:'<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
};
const ic = (ad, boy = 20) => `<svg class="ic" width="${boy}" height="${boy}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IK[ad] || ''}</svg>`;
const ikonla = (k = document) => $$('[data-ic]', k).forEach((e) => { e.outerHTML = ic(e.dataset.ic, +(e.dataset.boy || 20)); });
const SUSLEME = '<div class="susleme" aria-hidden="true"><svg viewBox="0 0 28 12"><path d="M14 1 18 6 14 11 10 6Z M2 6h7 M19 6h7" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="14" cy="6" r="1.4" fill="currentColor"/></svg></div>';

/* güven etiketi */
const GUVEN = { 'Doğrulanmış':'dogrulanmis', 'Tarihsel çıkarım':'tarihsel', 'Temsili':'temsili' };
/* 29 Ekim 2026 · etikete dokununca «Bu bilgi nereden geliyor?» açılır (Figma 1:3193 · WF 1:7027). k = { alinti, kaynak } verilirse kitap satırları da görünür */
const guven = (g, k) => g ? `<span class="guven ${GUVEN[g] || 'dogrulanmis'}" role="button" tabindex="0" aria-label="${esc(g)}: bu bilgi nereden geliyor?"${k ? ` data-kaynak="${esc(JSON.stringify(k))}"` : ''}>${esc(g)}<span class="i" aria-hidden="true">ⓘ</span></span>` : '';

/* AKAR harita pini: Figma akar-yeni «Harita pini» (1:544). Sivri kemer, gövde rengi = vakıftaki rol, ikon = eser türü.
   Normal (1:545) haritada 32 × 38; Seçili (1:548) 1,25× ve altın halka; Tamamlandı (1:552) sağ üstte altın ✓.
   Kemerin 40 × 48 kutusu her resimde aynı yerde, kutunun altı (y 48) haritadaki noktaya oturur. */
const KEMER_YOL = 'M20 1.5C26 5 33 11 33.5 20V33C33.5 34.6667 32.8333 36 31.5 37L22 45.5C20.6667 46.6333 19.3333 46.6333 18 45.5L8.5 37C7.16667 36 6.5 34.6667 6.5 33V20C7 11 14 5 20 1.5Z';
const PIN_IKON = {
  medrese:'<g transform="translate(0,-0.6)"><path d="M2.3 8.3L6.45 4.45Q7 4.3 7.65 4.35L4.3 8.1Q9 9.4 12 13.75V14.6Q11.6 14.1 11.2 14.1Q7 11.6 2.5 9Q2 8.65 2.3 8.3z"/><path d="M8.1 4.45Q10.6 4.9 11.75 6.75V13.3Q8.5 8.6 5 8z"/><path d="M2.4 10.4L17.8 19.75" fill="none" stroke="#FFFFFF" stroke-width="1.75" stroke-linecap="round"/><g transform="matrix(-1 0 0 1 24 0)"><path d="M2.3 8.3L6.45 4.45Q7 4.3 7.65 4.35L4.3 8.1Q9 9.4 12 13.75V14.6Q11.6 14.1 11.2 14.1Q7 11.6 2.5 9Q2 8.65 2.3 8.3z"/><path d="M8.1 4.45Q10.6 4.9 11.75 6.75V13.3Q8.5 8.6 5 8z"/><path d="M2.4 10.4L17.8 19.75" fill="none" stroke="#FFFFFF" stroke-width="1.75" stroke-linecap="round"/></g></g>',
  cesme:'<path d="M18 6.75h3.25v8.5H18z"/><path d="M18 9.25H10.25a3.75 3.75 0 0 0-3.75 3.75v2.75h3.75V13h7.75z"/><path d="M5.75 16.25h5.25v1.25H5.75z"/><path d="M12.4 6h1.5v3.25h-1.5z"/><path d="M10.4 4.25h5.5a.875.875 0 0 1 0 1.75h-5.5a.875.875 0 0 1 0-1.75z"/><path d="M8.4 18.6c.95 1.15 1.45 1.9 1.45 2.5a1.45 1.45 0 0 1-2.9 0c0-.6.5-1.35 1.45-2.5z"/>',
  cami:'<path fill-rule="evenodd" d="M3 21V15H15V21H3ZM8 21V18.5C8 17.5 8.33333 16.6667 9 16C9.66667 16.6667 10 17.5 10 18.5V21H8Z"/><path d="M4 14C4 12.9391 4.52678 11.9217 5.46447 11.1716C6.40215 10.4214 7.67392 10 9 10C10.3261 10 11.5979 10.4214 12.5355 11.1716C13.4732 11.9217 14 12.9391 14 14H4Z"/><path d="M17.5 21V9H19.5V21H17.5Z"/><path d="M16.75 11H20.25V12H16.75V11Z"/><path d="M17.5 8L18.5 3L19.5 8H17.5Z"/>',
  han:'<path fill-rule="evenodd" d="M2 21V6H22V21H2ZM6 12.5V10.5C6 9.83333 6.41667 9.25 7.25 8.75C8.08333 9.25 8.5 9.83333 8.5 10.5V12.5H6ZM15.5 12.5V10.5C15.5 9.83333 15.9167 9.25 16.75 8.75C17.5833 9.25 18 9.83333 18 10.5V12.5H15.5ZM5.5 21V17.5C5.5 16.5 6.08333 15.6667 7.25 15C8.41667 15.6667 9 16.5 9 17.5V21H5.5ZM15 21V17.5C15 16.5 15.5833 15.6667 16.75 15C17.9167 15.6667 18.5 16.5 18.5 17.5V21H15Z"/>',
  hamam:'<path fill-rule="evenodd" d="M2 21V15H22V21H2ZM5 21V18.5C5 17.5 5.33333 16.6667 6 16C6.66667 16.6667 7 17.5 7 18.5V21H5Z"/><path d="M3 14C3 13.337 3.31607 12.7011 3.87868 12.2322C4.44129 11.7634 5.20435 11.5 6 11.5C6.79565 11.5 7.55871 11.7634 8.12132 12.2322C8.68393 12.7011 9 13.337 9 14H3Z"/><path d="M10 14C10 12.8065 10.5795 11.6619 11.6109 10.818C12.6424 9.97411 14.0413 9.5 15.5 9.5C16.9587 9.5 18.3576 9.97411 19.3891 10.818C20.4205 11.6619 21 12.8065 21 14H10Z"/>',
  turbe:'<path d="M6.5 10C6.5 6.5 9 5 12 3.5C15 5 17.5 6.5 17.5 10H6.5Z"/><path d="M3 11H21V12.5H3V11Z"/><path fill-rule="evenodd" d="M5 13.5H19C17.6667 13.5 17 14.1667 17 15.5V21H7V15.5C7 14.1667 6.33333 13.5 5 13.5ZM10.5 21V18C10.5 17 11 16.1667 12 15.5C13 16.1667 13.5 17 13.5 18V21H10.5Z"/>',
};
const ROL_RENK = { dini:'#2E7D32', su:'#2A6FB0', egitim:'#25477B', akar:'#9A5B2E' };
const ROL_AD = { dini:'Dinî', su:'Su', egitim:'Eğitim', akar:'Ticari (akar)' };   // «Akar» tek başına uygulamanın adıyla karışıyordu
const ROL_ACIKLAMA = { dini:'Cami, mescit, türbe', su:'Çeşme, sebil, hamam suyu', egitim:'Medrese, mektep', akar:'Vakfa gelir getiren yapılar: han, bedesten, hamam, dükkân' };
const kemerSvg = (ikon, renk) => `<path d="${KEMER_YOL}" fill="${renk}" stroke="#FFFFFF" stroke-width="2"/><g transform="translate(10 13) scale(0.8333)" fill="#FFFFFF">${PIN_IKON[ikon] || PIN_IKON.cami}</g>`;
const TAMAM_ROZET = '<circle cx="35" cy="5" r="6" fill="#C9A13B" stroke="#FFFFFF" stroke-width="2"/><path d="M32 5L34 7L38 3" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>';
const pinSvg = (ikon, renk, tamam = false, boy = 2) => `<svg xmlns="http://www.w3.org/2000/svg" width="${44 * boy}" height="${50 * boy}" viewBox="-2 -2 44 50">${kemerSvg(ikon, renk)}${tamam ? TAMAM_ROZET : ''}</svg>`;
const pinSeciliSvg = (ikon, renk, boy = 2) => `<svg xmlns="http://www.w3.org/2000/svg" width="${44 * boy}" height="${52 * boy}" viewBox="-2 -2 44 52"><path d="${KEMER_YOL}" fill="none" stroke="#C9A13B" stroke-width="6"/>${kemerSvg(ikon, renk)}</svg>`;
const svgResim = (svg) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });

/* ---------- veri ---------- */
const VERI = await (await fetch('veri.json', { cache:'no-store' })).json();   // önbellekteki eski veri yeni kodla açılmasın
VERI.eserler.forEach((e) => { e.gecmis ||= []; });
/* rota cümleleri (hikaye.md → «Yalnız rotada», 29 Ekim 2026): «Sonraki durak…» gibi cümleler yalnız rotadan gelindiyse okunur.
   e.hikaye her okunduğunda o anki rota durumuna göre süzülür (rotada değilse `rota` işaretli cümleler yok) */
VERI.eserler.forEach((e) => { const tam = e.hikaye || []; if (!tam.some((c) => c.rota)) return;
  Object.defineProperty(e, 'hikaye', { configurable:true, get() { let r = false; try { r = durum.rotada; } catch {} return r ? tam : tam.filter((c) => !c.rota); } }); });
const ESER = Object.fromEntries(VERI.eserler.map((e) => [e.id, e]));
const ROTA = VERI.rotalar[0];
const SEHIR = VERI.sehir || { ad:'', merkez:[0, 0], zoom:16, foto_kunye:'', kaynakca:'' };   // şehir kaydı: veri/sehir/<sehir>.json
/* 3D sahne zemini şehrin kimliğinden (kimlik.sahne_ust / sahne_alt); yoksa app.css'teki nötr gri kalır */
if (SEHIR.kimlik?.sahne_ust && !document.documentElement.dataset.tema) document.documentElement.style.setProperty('--sahne-ust', SEHIR.kimlik.sahne_ust);
if (SEHIR.kimlik?.sahne_alt && !document.documentElement.dataset.tema) document.documentElement.style.setProperty('--sahne-alt', SEHIR.kimlik.sahne_alt);
/* şehrin rengi ve deseni bütün sayfaya (açılış ekranı, yükleme kartları); veri/sehir/<şehir>.json → kimlik */
{ const km = SEHIR.kimlik || {}, kok = document.documentElement.style;
  if (km.zemin) kok.setProperty('--sehir-aksan', km.zemin);
  if (km.desen_renk) kok.setProperty('--sehir-acik', km.desen_renk);
  if (km.desen) kok.setProperty('--sehir-desen', `url('desenler/${km.desen}')`);
  const ac = document.getElementById('acilis');
  if (ac) { ac.classList.toggle('desenli-zemin', !!km.desen); document.getElementById('acilis-sehir').textContent = SEHIR.ad || ''; document.getElementById('acilis-alt').textContent = 'Vakıf eserleri yükleniyor'; } }
/* yöre rengi (29 Ekim 2026): esere ait yüzeyler eserin ilinin envanter rengini alır (eser.json → il; veri/sehir/<il>.json → kimlik).
   Bir ilin kimliği yoksa varsayılan şehrinki, o da yoksa temanın nötr rengi kalır. Şehre özel kod yok */
/* eserin il kaydı: renk, desen, envanter adı, yayıncı, fotoğraf künyesi hep buradan (eser.json → il ↔ veri/sehir/<il>.json → ad). Kodda il adı yok */
const ilSehir = (e) => (e && (VERI.sehirler || []).find((s) => s.ad && s.ad.toLocaleLowerCase('tr') === (e.il || '').toLocaleLowerCase('tr'))) || SEHIR;
const aktifSehir = () => { try { return ilSehir(anlat.eser || ESER[durum.secili]); } catch { return SEHIR; } };   // açılışta (anlat henüz tanımsızken) varsayılan şehir
const ilKimlik = (e) => (e && (VERI.sehirler || []).find((s) => s.ad && s.ad.toLocaleLowerCase('tr') === (e.il || '').toLocaleLowerCase('tr'))?.kimlik) || SEHIR.kimlik || null;
function yoreUygula(e) {
  const km = ilKimlik(e) || {}, kok = document.documentElement.style;
  const koy = (ad, v) => (v ? kok.setProperty(ad, v) : kok.removeProperty(ad));
  koy('--sehir-aksan', km.zemin); koy('--sehir-acik', km.desen_renk); koy('--sehir-desen', km.desen ? `url('desenler/${km.desen}')` : '');
}
$$('.il-ad').forEach((b) => { b.textContent ||= SEHIR.ad || ''; });   // aktif il adı (harita durunca haritaIliGuncelle günceller)
const AMBLEM_D = document.querySelector('#acilis .amblem path')?.getAttribute('d') || '';
/* 3D yükleme kartı: amblem çizilir, gerçek indirme yüzdesi ve MB; arkada şehrin deseni silik */
const mbYaz = (b) => (b / 1048576).toLocaleString('tr-TR', { minimumFractionDigits:1, maximumFractionDigits:1 });
const yuklemeKart = (alt) => `<div class="yukleniyor yukleme desenli-zemin"><div class="yk-kart"><svg class="amblem" viewBox="-84 -84 168 168" aria-hidden="true"><path pathLength="1" d="${AMBLEM_D}"/></svg><b class="yk-baslik" role="status">3D model yükleniyor</b><div class="yk-cubuk belirsiz"><i></i></div><p class="yk-alt"><span class="yk-mb"></span>${esc(alt)}</p></div></div>`;
function yuklemeIzle(kap, dosya) {
  const k = kap && kap.querySelector('.yukleme'); if (!k) return;
  glbIzle(dosya, (n, top) => {
    if (!k.isConnected || !top) return;
    const y = Math.min(100, Math.round(n / top * 100));
    k.querySelector('.yk-baslik').textContent = `3D model yükleniyor · %${y}`;
    const c = k.querySelector('.yk-cubuk'); c.classList.remove('belirsiz'); c.style.setProperty('--yuzde', y + '%');
    k.querySelector('.yk-mb').textContent = `${mbYaz(n)} MB / ${mbYaz(top)} MB. `;
  });
}
/* dil seçici (29 Ekim 2026). Seçim cihazda saklanır (`akar.dil`). Bütün içerik dile bağlı:
   eser adı/kısa metni, hikâye cümleleri, parça kartları, fotoğraf başlıkları, «Eser hakkında» bölümleri.
   İngilizce metin hazirla.py'nin `<alan>_en` alanlarından gelir (eserler/<eser>/icerik/en/, eser.json `ad_en`, `kisa_en`; biçim ICERIK_INGILIZCE.md).
   Yöntem: dil değişince kayıtların görünen alanı (ad, metin, baslik…) o dildeki metinle değiştirilir; Türkçesi `_tr`'de saklanır. Böylece bütün
   ekran kodu tek yerden dile bağlanır. Çevirisi olmayan alan Türkçe kalır; EN seçiliyken eksik varsa bir kez söylenir.
   «Eser hakkında» okuma katmanı (özet, rakam, alıntı, zaman, terim) Türkçe kitap metninden birebir seçme olduğu için İngilizcede gösterilmez; 3D açıları kalır. */
const DIL_ALAN = [
  ['eser', (e) => [e], ['ad', 'uzun_ad', 'kisa']],
  ['hikaye', (e) => e.hikaye, ['metin']],
  ['parca', (e) => e.parcalar || [], ['baslik', 'metin']],
  ['foto', (e) => e.fotolar, ['baslik', 'kisa', 'alt']],
  ['bolum', (e) => e.hakkinda || [], ['baslik']],
  ['paragraf', (e) => (e.hakkinda || []).flatMap((b) => b.paragraflar), ['metin']],
];
function dilVeri(d) {
  let eksik = 0, var_ = 0;
  for (const e of VERI.eserler) {
    for (const [, kayitlar, alanlar] of DIL_ALAN) for (const o of kayitlar(e)) {
      o._tr = o._tr || {};
      for (const a of alanlar) {
        if (!(a in o._tr)) o._tr[a] = o[a];
        if (o._tr[a] == null || o._tr[a] === '') continue;
        const en = o[a + '_en'];
        if (d === 'en' && en) { o[a] = en; var_++; } else { o[a] = o._tr[a]; if (d === 'en') eksik++; }
      }
    }
    for (const b of e.hakkinda || []) {   // okuma katmanı yalnız Türkçede
      if (!('_okuma' in b)) b._okuma = b.okuma || null;
      b.okuma = d === 'en' && b._okuma ? { ozet:[], rakam:[], alinti:[], zaman:[], ucd:b._okuma.ucd } : b._okuma;
    }
    if (!('_terimler' in e)) e._terimler = e.terimler || [];
    e.terimler = d === 'en' ? [] : e._terimler;
  }
  return { eksik, var_ };
}
/* konuşma dili: gösterilen metin İngilizceyse İngilizce ses */
const sesDili = (o, a = 'metin') => (durum.dil === 'en' && o && o[a + '_en'] ? 'en' : 'tr');
const sesAyarla = (u, dil) => { u.lang = dil === 'en' ? 'en-US' : 'tr-TR'; const v = speechSynthesis.getVoices().find((x) => new RegExp('^' + dil, 'i').test(x.lang)); if (v) u.voice = v; };
function dilUygula(d, bildir) {
  durum.dil = d === 'en' ? 'en' : 'tr'; yerel('akar.dil', durum.dil);
  $$('.dil-sec [data-dil]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.dil === durum.dil)));
  const { eksik, var_ } = dilVeri(durum.dil);
  document.documentElement.lang = durum.dil === 'en' && var_ && !eksik ? 'en' : 'tr';   // karışık içerikte «tr» kalır (çoğu metin Türkçe)
  if (!bildir) return;
  if (typeof harita !== 'undefined') harita.getSource('eserler')?.setData(eserNoktalari());   // pin etiketleri
  if (typeof yonlendir === 'function') yonlendir();   // açık ekran yeni dille yeniden çizilir
  if (durum.dil === 'en' && eksik) toast(var_ ? 'Some content is not in English yet and is shown in Turkish. · Bazı içerikler henüz İngilizce değil.' : 'English is coming soon. Content is shown in Turkish for now. · İngilizce içerik hazırlanıyor.');
}
document.addEventListener('click', (e) => { const b = e.target.closest('.dil-sec [data-dil]'); if (b) { e.preventDefault(); e.stopPropagation(); if (b.dataset.dil !== durum.dil) dilUygula(b.dataset.dil, true); } }, true);
const SEHIR_ESIK = 9;   // bu zoomun altında eser pinleri yerine şehirler görünür (küre görünümü)
const galeriFoto = (e) => e.fotolar.filter((f) => f.sira).sort((a, b) => a.sira - b.sira);
const kapak = (e) => galeriFoto(e)[0] || e.fotolar[0];
const foto = (e, dosya) => e.fotolar.find((f) => f.dosya === dosya) || kapak(e);
const meta = (e) => [e.yil, e.yaptiran].filter(Boolean).join(' · ');
/* «Sonraki durak» yalnız rotada gezilirken: Rotayı başlat / Devam et / Evden gez ya da bir «Sonraki durak» düğmesiyle gelince durum.rotada açılır,
   haritaya (#/) dönünce kapanır. Listeden ya da pinden açılan eserde sonraki durak gösterilmez */
const sonrakiDurak = (e) => { if (!durum.rotada) return null; const i = ROTA.duraklar.indexOf(e.id); return i >= 0 && i < ROTA.duraklar.length - 1 ? ESER[ROTA.duraklar[i + 1]] : null; };
/* fotoğrafın büyütülebildiğini gösteren köşe simgesi (mobilde imleç yok, simge haber verir) */
const BUYUT = () => `<span class="buyut-ic" aria-hidden="true">${ic('expand', 15)}</span>`;
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

/* ---------- yan sayfa: kaynak detayı (Figma D 1:3193 · WF 1:7027) ve «Vakıf nedir?» (29 Ekim 2026) ----------
   Masaüstünde sağdan açılan panel (üst çubuğun altında), mobilde alttan sayfa. ×, Esc ya da arka plan kapatır; odak açan öğeye döner. */
const GUVEN_ACIKLAMA = { 'Doğrulanmış':'Bilgi en az bir güvenilir kaynakta açıkça yer alıyor.', 'Tarihsel çıkarım':'Kaynaklardan yorumlanan bilgi.', 'Temsili':'Görsel ya da model yaklaşık.' };
function yanSayfaAc(baslik, govde) {
  let k = $('#yan-sayfa');
  if (!k) { k = document.createElement('div'); k.id = 'yan-sayfa'; k.className = 'yan-arka'; document.body.appendChild(k); }
  if (k.hidden !== false || !k.classList.contains('acik')) k._donus = document.activeElement;
  k.innerHTML = `<section class="yan-sayfa" role="dialog" aria-modal="true" aria-labelledby="ys-baslik"><div class="ys-tutamak" aria-hidden="true"><i></i></div><div class="ys-bas"><h2 id="ys-baslik">${esc(baslik)}</h2><button class="yuvarlak" data-ys-kapat aria-label="Kapat">${ic('x', 18)}</button></div><div class="ys-govde">${govde}</div></section>`;
  k.hidden = false; requestAnimationFrame(() => k.classList.add('acik'));
  setTimeout(() => k.querySelector('[data-ys-kapat]')?.focus({ preventScroll:true }), 250);
}
function yanSayfaKapat() { const k = $('#yan-sayfa'); if (!k || k.hidden) return; k.classList.remove('acik'); setTimeout(() => { k.hidden = true; k.innerHTML = ''; k._donus?.focus?.({ preventScroll:true }); }, 220); }
/* «Envanter Cilt 1 · s. 25, 36; Ürgen s.10» → kitap satırları (envanterin adı ve yayıncısı şehir kaydından) */
const kaynakSatirlari = (k, sh = aktifSehir()) => String(k || '').split(/\s*;\s*/).filter(Boolean).map((x) => {   // envanter adı ve yayıncı eserin ilinden
  const m = x.match(/^Envanter\s+Cilt\s*(\d+)\s*(?:·\s*)?(.*)$/i);
  return m ? { baslik:`${sh.envanter_adi || 'Envanter'}, Cilt ${m[1]}`, alt:[sh.envanter_yayinci, m[2]].filter(Boolean).join(' · ') } : { baslik:x, alt:'' };
});
function kaynakAc(g, k = {}) {
  const kay = kaynakSatirlari(k.kaynak), alinti = String(k.alinti || '');
  const kisa = alinti.length > 220 ? alinti.slice(0, 217).replace(/\s+\S*$/, '') + '…' : alinti;
  const diger = Object.keys(GUVEN).filter((x) => x !== g).map((x) => `<li>${guven(x)}<span>${esc(GUVEN_ACIKLAMA[x])}</span></li>`).join('');
  yanSayfaAc('Bu bilgi nereden geliyor?', `${kisa ? `<blockquote class="ks-alinti">“${esc(kisa)}”</blockquote>` : ''}
    <div class="ks-guven">${guven(g)}<p>${esc(g)}: ${esc((GUVEN_ACIKLAMA[g] || '').replace(/^./, (h) => h.toLocaleLowerCase('tr')))}</p></div>
    <h3 class="ks-bas">Kaynaklar</h3>${kay.length ? kay.map((x) => `<div class="ks-kaynak"><b>${esc(x.baslik)}</b>${x.alt ? `<small>${esc(x.alt)}</small>` : ''}</div>`).join('') : `<p class="soluk ks-yok">Bu öğenin ayrı kaynak satırı yok. Genel kaynak: ${esc(SEHIR.kaynakca || SEHIR.envanter_adi || '')}</p>`}
    <h4 class="ks-alt-bas">Diğer etiketler</h4><ul class="ks-etiketler">${diger}</ul>
    <button class="metin-btn ks-hata" data-hata-bildir>Bir hata mı gördün? Bildir ›</button>`);
}
/* «Vakıf nedir?» (karşılama kartından). Tanım AKAR'ın açıklamasıdır; alıntı ve örnek kitaptan, güven etiketi ve kaynağıyla.
   Örnek veriden seçilir: akar rolündeki eserin «vakfedil-» geçen hikâye cümlesi (Bursa'da Orhan Hamamı → Orhan Gazi İmareti). */
const VAKIF_ALINTI = { metin:'Ticaretin sürdüğü çarşı, han ve kervansaray gibi yapılar İslam tarihinin her döneminde inşa edilmiştir. Bu yapıların bakım ve işletme giderleri çoğu kez vakıflar aracılığıyla karşılanmış, aynı zamanda bu yapılardan elde edilen gelirlerle cami, mektep ve medrese gibi hayrat eserlerin ihtiyaçları desteklenmiştir.', kaynak:'Envanter Cilt 1 · Giriş, «Ticari yapılar»' };
function vakifNedir() {
  const ornek = VERI.eserler.filter((e) => e.rol === 'akar').flatMap((e) => e.hikaye.map((c) => ({ e, c }))).find(({ c }) => /vakfedil/i.test(c.metin_tr || c.metin));
  const rol = (r, b) => `<li><span class="nokta" style="background:${ROL_RENK[r]}"></span><div><b>${b}</b><small>${esc(ROL_ACIKLAMA[r])}</small></div></li>`;
  yanSayfaAc('Vakıf nedir?', `<p class="vn-giris">Vakıf, bir malın ya da gelirin kalıcı olarak bir hayır işine bağlanmasıdır. Haritadaki eserler bu düzenin iki yüzüdür:</p>
    <ul class="vn-roller">${rol('dini', 'Hayrat · Dinî')}${rol('akar', 'Akar · Ticari')}</ul>
    <h3 class="ks-bas">Kitap ne diyor?</h3><blockquote class="ks-alinti">“${esc(VAKIF_ALINTI.metin)}”</blockquote>
    <div class="vn-etiket">${guven('Doğrulanmış', { alinti:VAKIF_ALINTI.metin, kaynak:VAKIF_ALINTI.kaynak })}<small>${esc(SEHIR.envanter_adi || 'Envanter')}, Cilt 1 · Giriş</small></div>
    ${ornek ? `<h3 class="ks-bas">Bu şehirde bir örnek</h3><button class="vn-ornek" data-git="#/eser/${ornek.e.id}"><span><b>${esc(ornek.e.ad)}</b><small>${esc(ornek.c.metin)}</small></span>${ic('chevron-right', 18)}</button><div class="vn-etiket">${guven(ornek.c.guven, { alinti:ornek.c.metin, kaynak:ornek.c.kaynak })}<small>${esc(ornek.c.kaynak)}</small></div>` : ''}`);
}
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-ys-kapat]') || e.target.id === 'yan-sayfa') { yanSayfaKapat(); return; }
  if (e.target.closest('[data-hata-bildir]')) { toast('Teşekkürler · bildirim bu prototipte kaydedilmiyor'); return; }
  if (e.target.closest('[data-vakif-nedir]')) { vakifNedir(); return; }
});
/* etikete ya da «Kaynak: … ›» bağlantısına dokununca: yakalama evresinde, altındaki satırın (cümleye git, kartı aç) tıklaması çalışmasın */
const guvenAc = (el) => { let k = {}; try { k = JSON.parse(el.dataset.kaynak || '{}'); } catch {} kaynakAc([...el.childNodes].find((n) => n.nodeType === 3)?.textContent.trim() || 'Doğrulanmış', k); };
document.addEventListener('click', (e) => {
  const g = e.target.closest('.guven[role="button"]');
  if (g && !g.closest('#yan-sayfa .ks-guven, #yan-sayfa .ks-etiketler')) { e.stopPropagation(); e.preventDefault(); guvenAc(g); return; }
  if (e.target.closest('[data-kaynak-simdi]') && anlat.eser) { e.stopPropagation(); const c = anlat.eser.hikaye[anlat.i]; if (c) kaynakAc(c.guven, { alinti:c.metin, kaynak:c.kaynak }); }
}, true);
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('.guven[role="button"]')) { e.preventDefault(); e.stopPropagation(); guvenAc(e.target); return; }
  if (e.key === 'Escape' && $('#yan-sayfa') && !$('#yan-sayfa').hidden) { e.stopImmediatePropagation(); yanSayfaKapat(); }
}, true);

/* ---------- GLB önbelleği ---------- */
const draco = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/');
const yukleyici = new GLTFLoader().setDRACOLoader(draco);
const glbTampon = new Map();
/* GLB indirme ilerlemesi (yükleme kartındaki % ve MB; Figma notu: «Yüzde ve MB gerçek indirmeden gelir») */
const glbDinleyici = new Map(), glbSon = new Map();
const glbBildir = (dosya, n, top) => { glbSon.set(dosya, [n, top]); for (const f of glbDinleyici.get(dosya) || []) f(n, top); };
const glbIzle = (dosya, f) => { if (!glbDinleyici.has(dosya)) glbDinleyici.set(dosya, new Set()); glbDinleyici.get(dosya).add(f); if (glbSon.has(dosya)) f(...glbSon.get(dosya)); };
const glbAl = (dosya) => {
  if (!glbTampon.has(dosya)) glbTampon.set(dosya, (async () => {
    const r = await fetch(`modeller/${dosya}.glb`); if (!r.ok) throw new Error(dosya + ' ' + r.status);
    const top = +r.headers.get('content-length') || 0;
    if (!r.body || !r.body.getReader) { const b = await r.arrayBuffer(); glbBildir(dosya, b.byteLength, b.byteLength); return b; }
    const rd = r.body.getReader(), parcalar = []; let n = 0;
    for (;;) { const { done, value } = await rd.read(); if (done) break; parcalar.push(value); n += value.length; glbBildir(dosya, n, Math.max(top, n)); }
    const tam = new Uint8Array(n); let k = 0; for (const p of parcalar) { tam.set(p, k); k += p.length; }
    glbBildir(dosya, n, n); return tam.buffer;
  })());
  return glbTampon.get(dosya);
};
const glbCoz = async (dosya) => { const b = await glbAl(dosya); return new Promise((res, rej) => yukleyici.parse(b.slice(0), '', res, rej)); };

/* =====================================================================
   HARİTA: AKAR stili, OSM 3D binaları, modellerimiz ve pinler
   ===================================================================== */
let stil;
/* temanın kendi harita stili varsa o (harita/akar-style-<tema>.json; sunucu.sh paylaşır), yoksa ortak stil */
const temaStil = { buzlu:'akar-style-buzlu.json', cam:'akar-style-cam.json' }[document.documentElement.dataset.tema];
try { stil = await (await fetch(temaStil || 'akar-style.json')).json(); } catch { stil = { version:8, sources:{ osm:{ type:'raster', tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize:256 } }, layers:[{ id:'osm', type:'raster', source:'osm' }] }; }
/* Küre (28 Ekim 2026): uzaklaşınca dünya yuvarlak görünür, yaklaştıkça MapLibre kendiliğinden düz haritaya geçer (şehir ölçeğinde fark yok).
   Gökyüzü ve atmosfer yalnız uzakta görünür; şehirde eğik bakışta ufuk açık renkte kalır */
/* Renk ayrımı (28 Ekim 2026): eser modelleri sıcak taş rengi (bej, kurşuni kubbe). Ortak stilde (design/harita, v1 de kullanıyor) zemin ve
   binalar da bej olduğundan eserler binalara karışıyordu; bu prototipte zemin ve OSM binaları serin, açık griye çekilir (binalar açık gri, yarı saydam).
   Stil dosyasına dokunulmaz, renkler burada yüklendikten sonra değişir. */
/* 29 Ekim 2026: zemin ve bina renkleri artık kullanıcının stil dosyasından (sunucu.sh → design/harita/akar-style-ozel-v2.json); burada geçersiz kılınmaz */
stil.projection = { type:'globe' };
/* küre görünümünde etiket kalabalığı (29 Ekim 2026): uzakta yalnız ülke ve deniz adları; küçük yerleşim adları yaklaştıkça açılır,
   böylece göz uygulamanın il işaretlerine gider. Bütün temalar */
{ const ESIK = { label_country_3:3, label_state:5.5, label_city_capital:4.5, label_city:6, label_town:8, label_village:10, label_other:10 };
  stil.layers.forEach((l) => { if (ESIK[l.id] != null) l.minzoom = Math.max(l.minzoom || 0, ESIK[l.id]); }); }
/* ?harita=sicak (deneme, 29 Ekim 2026): soğuk gri zemin yerine kireç/taş tonları; eserlerin sıcak taşıyla uyumlu. Seçim cihazda kalır (akar.harita), ?harita=normal kapatır */
try { const q = new URLSearchParams(location.search).get('harita'); if (q) localStorage.setItem('akar.harita', q);
  if ((q || localStorage.getItem('akar.harita')) !== 'normal' && document.documentElement.dataset.tema !== 'cam') {   // sıcak tonlar varsayılan
    const R = { background:'#F9F8F4', landuse_residential:'#F6F4EF', building:'#E3DCD0', building_3d:'#E1D9CC', road_area_pier:'#F9F8F4', road_pier:'#F9F8F4',
      highway_path:'#FFFFFF', highway_minor:'#FFFFFF', highway_major_inner:'#FFFFFF', highway_minor_casing:'#DFD9CE', highway_major_casing:'#DFD9CE', highway_major_subtle:'#DFD9CE', highway_motorway_casing:'#DFD9CE',
      water:'#A9CBD3', waterway:'#A9CBD3', park:'#B8D3A4', landcover_grass:'#B8D3A4', landcover_wood:'#B8D3A4', landuse_spor:'#B8D3A4', landuse_mezarlik:'#C7D9B8' };
    stil.layers.forEach((l) => { const r = R[l.id]; if (!r || !l.paint) return; for (const k of ['background-color', 'fill-color', 'line-color', 'fill-extrusion-color']) if (k in l.paint) l.paint[k] = r; if (l.id === 'building' && 'fill-outline-color' in l.paint) l.paint['fill-outline-color'] = '#D1C7B7'; });
    /* deniz yakınlığa göre: uzakta (küre) canlı okyanus mavisi, şehre indikçe sakin su mavisi; küre kabartması biraz daha canlı (29 Ekim 2026) */
    /* küre (29 Ekim 2026, 2. tur, Yandex örneği): düz renkler. Okyanus parlak mavi, kara açık yeşil (zemin rengi uzakta yeşil, şehre inince
       kireç), kabartma yalnız silik bir doku (çöller ve dağlar seçilsin diye). Şehir ölçeğinde su sakin mavi */
    const su = ['interpolate', ['linear'], ['zoom'], 0, '#5FAAEC', 5, '#6DB3EE', 9, '#93C6E8', 13, '#A3CFE2'];
    const kara = ['interpolate', ['linear'], ['zoom'], 0, '#D9EBC6', 5, '#DFEDCD', 8, '#F2F1EA', 10, '#F9F8F4'];
    stil.layers.forEach((l) => { if (!l.paint) return;
      if (l.id === 'background') l.paint['background-color'] = kara;
      if (l.id === 'water') l.paint['fill-color'] = su;
      if (l.id === 'waterway') l.paint['line-color'] = '#A3CFE2';
      if (l.type === 'raster' && l.id === 'kabartma') Object.assign(l.paint, { 'raster-opacity':['interpolate', ['linear'], ['zoom'], 0, 0.42, 6, 0.3, 9, 0], 'raster-saturation':-0.1, 'raster-contrast':-0.15, 'raster-brightness-min':0.25 }); });
  } } catch {}
const gok = { buzlu:['#9ACBF0', '#F4F2EA', '#F4F2EA'],   /* küre: açık gök mavisi, ufukta ılık ışık (29 Ekim 2026) */ cam:['#0B0F12', '#1E262B', '#13191D'] }[document.documentElement.dataset.tema] || ['#C9DCEB', '#F3F5F5', '#F3F5F5'];
stil.sky = { 'sky-color':gok[0], 'horizon-color':gok[1], 'sky-horizon-blend':0.6, 'fog-color':gok[2], 'horizon-fog-blend':0.4, 'fog-ground-blend':1,
  'atmosphere-blend':['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 8, 0] };
const harita = new maplibregl.Map({
  container:'harita', style:stil, center:SEHIR.merkez, zoom: durum.masaustu ? (SEHIR.zoom_masaustu || SEHIR.zoom) : SEHIR.zoom, pitch:55, bearing:-12,
  minZoom:1.2, maxZoom:19.5, maxPitch:65, attributionControl:false, fadeDuration:0,
});
window.akarHarita = harita;
/* açılış ekranı harita ilk kez çizilince kalkar ('load'; 'idle' model katmanı yeniden çizim istedikçe gecikebilir), en geç 8 sn */
{ const ac = document.getElementById('acilis'); let k = false;
  const kaldir = () => { if (k || !ac) return; k = true; ac.classList.add('bitti'); setTimeout(() => { ac.remove(); window.akarKarsilama?.(); }, 400); };
  if (harita.loaded()) kaldir(); else harita.once('load', kaldir); setTimeout(kaldir, 8000); }
const IZLER = [];   // model taban izleri (lng/lat çokgen), bina gizleme ve dokunma için

/* Hikâyesi sonuna kadar dinlenen eser cihazda «bitti» olarak saklanır; pini Tamamlandı (✓) çizilir */
const bittiMi = (id) => yerel('akar.bitti.' + id) === '1';
const eserNoktalari = () => ({ type:'FeatureCollection', features:VERI.eserler.map((e) => ({ type:'Feature', geometry:{ type:'Point', coordinates:[e.lon, e.lat] }, properties:{ id:e.id, ad:e.ad, ikon:e.ikon, rol:e.rol, sira:e.sira || 999, bitti:bittiMi(e.id) } })) });
/* ---------- Haritada ruh (29 Ekim 2026) ----------
   1) Eser adları uygulamanın başlık yazısıyla (Cormorant): harita yazı tipi sunucusunda (openfreemap) serif yok; her ad tuvale
      çizilip resim olarak eklenir, etiket katmanı onu metin içinde gösterir (çakışma ve yer seçimi metindeki gibi çalışır).
   (Tarihî çekirdek alanı denendi, beğenilmedi, kaldırıldı · 29 Ekim 2026) */
/* Haritanın baktığı il (29 Ekim 2026): harita durunca merkeze en yakın il kaydı (≈60 km içinde) «aktif il» olur; arayüz çerçevesi
   (üst çubuk şeridi, aramadaki il rozeti, mobilde il çipi) o ilin rengini ve motifini alır. Eser seçiliyse eserin ili önceliklidir */
let haritaIli = null;
function haritaIliGuncelle() {
  if (typeof harita === 'undefined' || harita.getZoom() < SEHIR_ESIK) return;
  const c = harita.getCenter(), kx = Math.cos(c.lat * Math.PI / 180);
  let en = null, d = Infinity;
  for (const s of VERI.sehirler || []) { if (!Array.isArray(s.merkez)) continue; const dd = Math.hypot((s.merkez[0] - c.lng) * kx, s.merkez[1] - c.lat); if (dd < d) { d = dd; en = s; } }
  if (!en || d > 0.55 || en === haritaIli) return;
  haritaIli = en; document.documentElement.dataset.il = en.id || '';
  $$('.il-ad').forEach((b) => { b.textContent = en.ad; });
  if (!durum.secili && !location.hash.slice(2)) { yoreUygula({ il:en.ad }); if (VERI.eserler.some((e) => e.il !== VERI.eserler[0].il)) kesif(); }   // birden çok ilde eser varsa liste yeni ilin eserleri
}
const kokRenk = (ad, yedek) => getComputedStyle(document.documentElement).getPropertyValue(ad).trim() || yedek;
async function eserAdlariKur() {
  try {
    const yazi = '600 34px "Cormorant Garamond"';
    await document.fonts.load(yazi, VERI.eserler.map((e) => e.ad).join(''));
    if (!document.fonts.check(yazi)) return false;
    const koyu = document.documentElement.dataset.tema === 'cam';
    const renk = koyu ? '#ECEFF0' : kokRenk('--text', '#1A2328'), hale = koyu ? 'rgba(18,23,27,.92)' : 'rgba(255,255,255,.95)';
    for (const e of VERI.eserler) {
      const c = document.createElement('canvas'), x = c.getContext('2d'); x.font = yazi;
      const w = Math.ceil(x.measureText(e.ad).width) + 16, h = 46; c.width = w; c.height = h;
      x.font = yazi; x.textBaseline = 'middle'; x.lineJoin = 'round';
      x.lineWidth = 7; x.strokeStyle = hale; x.strokeText(e.ad, 8, h / 2 + 1);
      x.fillStyle = renk; x.fillText(e.ad, 8, h / 2 + 1);
      const ad = 'ad-' + e.id; if (harita.hasImage(ad)) harita.removeImage(ad);
      harita.addImage(ad, x.getImageData(0, 0, w, h), { pixelRatio:2 });
    }
    return true;
  } catch { return false; }
}
/* seçili pin filtresi tek yerden (liste üzerine gelme, eser seçimi, rota). Pinin altındaki madalyon denendi, kaldırıldı · 29 Ekim 2026 */
function pinSeciliFiltre(id) {
  const f = ['==', ['get', 'id'], id || ''];
  if (harita.getLayer('pin-secili')) harita.setFilter('pin-secili', f);
}
async function haritaPinleriKur() {
  if (harita.getSource('eserler')) return;
  /* 30 Ekim 2026: pin görseli veriden: her (ikon, rol) çifti için bir görsel; gövde rengi = vakıftaki rol (ROL_RENK), ikon = eser türü. Yeni tür ya da rol eklenince kod değişmez */
  for (const k of new Set(VERI.eserler.map((e) => `${e.ikon}-${e.rol}`))) {
    const [ikon, rol] = k.split('-'), renk = ROL_RENK[rol] || ROL_RENK.dini;
    if (!harita.hasImage('pin-' + k)) harita.addImage('pin-' + k, await svgResim(pinSvg(ikon, renk)), { pixelRatio:2 });
    if (!harita.hasImage('pin-tamam-' + k)) harita.addImage('pin-tamam-' + k, await svgResim(pinSvg(ikon, renk, true)), { pixelRatio:2 });
    if (!harita.hasImage('pin-secili-' + k)) harita.addImage('pin-secili-' + k, await svgResim(pinSeciliSvg(ikon, renk)), { pixelRatio:2 });
  }
  if (harita.getSource('eserler')) return;
  harita.addSource('eserler', { type:'geojson', data:eserNoktalari() });
  const glif = !!harita.getStyle().glyphs;
  const adEtiket = glif && await eserAdlariKur();   // serif eser adları (resim olarak; harita yazı tipi sunucusunda serif yok)
  harita.addLayer({ id:'pin', type:'symbol', source:'eserler', minzoom:SEHIR_ESIK, layout:Object.assign({ 'icon-image':['concat', ['case', ['get', 'bitti'], 'pin-tamam-', 'pin-'], ['get', 'ikon'], '-', ['get', 'rol']], 'icon-anchor':'bottom', 'icon-allow-overlap':true, 'icon-size':['interpolate', ['linear'], ['zoom'], 16, 0.8, 18, 0.66], 'symbol-sort-key':['get', 'sira'] },
    glif ? { 'text-field':['step', ['zoom'], '', 15.2, adEtiket ? ['format', ['image', ['concat', 'ad-', ['get', 'id']]]] : ['get', 'ad']], 'text-font':['Noto Sans Bold'], 'text-size':12, 'text-line-height':1.333, 'text-variable-anchor-offset':['left', [1.3, -1.6], 'right', [-1.3, -1.6], 'top', [0, 0.4], 'bottom', [0, -3.4]], 'text-justify':'auto', 'text-optional':true } : {}),
    paint:{ 'text-color':'#25477B', 'text-halo-color':'#fff', 'text-halo-width':2 } });
  harita.addLayer({ id:'pin-secili', type:'symbol', source:'eserler', minzoom:SEHIR_ESIK, filter:['==', ['get', 'id'], ''], layout:{ 'icon-image':['concat', 'pin-secili-', ['get', 'ikon'], '-', ['get', 'rol']], 'icon-anchor':'bottom', 'icon-offset':[0, 2], 'icon-allow-overlap':true, 'icon-size':1 } });
  filtreUygula();
}

/* --- modellerimiz: MapLibre özel katmanı + three.js (aynı GL bağlamı). Yerleşim test.html ile aynı. --- */
/* ışık şehir kaydından (veri/sehir/<şehir>.json → harita_isik; önizleme v3 «Pişmiş»). Yoksa eski varsayılanlar.
   Köşe kararması (AO) modellerde pişmiş; gerçek zamanlı gölge yok. Yer gölgesi web'de: kodla üretilen tek bulanık doku, her modelin altında. */
const ISIK = Object.assign({ capraz:40, yukseklik:50, harita_capraz:20, harita_yukseklik:62, harita_gunes:1.5, doygunluk:1, yer_golgesi:0 }, SEHIR.harita_isik || {});
const YG_DOKU = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.filter = 'blur(13px)'; x.fillStyle = '#000';
  x.beginPath(); if (x.roundRect) x.roundRect(26, 26, 76, 76, 14); else x.rect(26, 26, 76, 76); x.fill(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
/* ışık tanıtım sayfasındaki 3D ile aynı (30 Ekim 2026): sıcak gök ışığı + gölge düşüren tek güneş, ACES ton eşleme.
   güneş her eserin ÖN CEPHESİNE göre: model.json → on_yonu (ana girişin baktığı yön, dünya, kuzeyden saat yönüne). Güneş o cephenin önünden,
   cepheye bakan kişinin solundan (capraz derece) gelir; her eserde ön yüz aydınlık, gölge arkaya-sağa düşer. on_yonu yoksa güneye bakan cephe varsayılır.
   Tanıtımdaki Ulucami: on_yonu 354 + 40 → aynı köşe. Haritada güneş daha önden, daha yukarıdan ve daha zayıf (harita_*). R: gölge kamerasının yarı genişliği (m) */
function gunesYonu(g, az, yuk, R, merkez) {   // az: güneşin geldiği yön (dünya), kuzeyden saat yönüne derece; yuk: ufuktan açı. Sahne ekseni: x doğu, y yukarı, z güney
  const a = THREE.MathUtils.degToRad(az), y = THREE.MathUtils.degToRad(yuk);
  g.position.set(Math.sin(a) * Math.cos(y), Math.sin(y), -Math.cos(a) * Math.cos(y)).multiplyScalar(R * 2.5).add(merkez);
}
function isikKur(r, sahne, R, haritada, merkez, e) {
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  sahne.add(new THREE.HemisphereLight(0xF4F1EA, 0x8C948F, 1.15));
  const on = e.on_yonu ?? 180, g = new THREE.DirectionalLight(0xFFF4E0, haritada ? ISIK.harita_gunes : 2.1);
  gunesYonu(g, on + (haritada ? ISIK.harita_capraz : ISIK.capraz), haritada ? ISIK.harita_yukseklik : ISIK.yukseklik, R, merkez);
  g.target.position.copy(merkez); sahne.add(g.target); g.castShadow = true;
  const n = haritada ? 1024 : 2048; g.shadow.mapSize.set(n, n); g.shadow.bias = -0.0004; g.shadow.normalBias = R / n;
  Object.assign(g.shadow.camera, { left:-R, right:R, top:R, bottom:-R, near:R * 0.5, far:R * 5 }); sahne.add(g); return g;
}
const yerGolgesiMi = (o) => { for (let x = o; x; x = x.parent) if (/^Yer_Golgesi/.test(x.name || '')) return true; return false; };   // eski modellerdeki pişmiş düzlem
const yapiKatman = {
  id:'yapilar', type:'custom', renderingMode:'3d', items:[],
  onAdd(m, gl) { this.map = m; this.kamera = new THREE.Camera(); this.r = new THREE.WebGLRenderer({ canvas:m.getCanvas(), context:gl, antialias:true }); this.r.autoClear = false; VERI.eserler.filter((e) => e.glb).forEach((e) => this.yukle(e)); },
  async yukle(e) {
    try {
      const gltf = await glbCoz(e.glb);
      /* OSM merkezine ana gövdenin ortası oturur (yan yapılar, avlu ve İç Koza kutuyu kaydırmasın) */
      /* taban izi yalnız yapıdan (pişmiş «Yer_Golgesi» düzlemi girerse çevredeki OSM binaları da silinir); renk doygunluğu şehir ayarından */
      gltf.scene.updateMatrixWorld(true); const kutu = new THREE.Box3(), hsl = {};
      gltf.scene.traverse((o) => { if (!o.isMesh) return; if (yerGolgesiMi(o)) { o.visible = false; return; } kutu.expandByObject(o);
        if (ISIK.doygunluk !== 1) for (const m of [].concat(o.material)) if (m.color && !m.userData.doy) { m.userData.doy = 1; m.color.getHSL(hsl); m.color.setHSL(hsl.h, Math.min(1, hsl.s * ISIK.doygunluk), hsl.l); } });
      const anaAd = e.model && e.model.ana_parca, anaObj = anaAd && gltf.scene.getObjectByName(anaAd);
      const c = (anaObj ? new THREE.Box3().setFromObject(anaObj) : kutu).getCenter(new THREE.Vector3());
      const grup = new THREE.Group(); gltf.scene.position.set(-c.x, -kutu.min.y, -c.z); grup.add(gltf.scene);
      grup.rotation.y = -THREE.MathUtils.degToRad(e.yaw || 0);
      const sahne = new THREE.Scene(); sahne.add(grup);
      const R = kutu.getSize(new THREE.Vector3()).length() * 0.65; isikKur(this.r, sahne, R, true, new THREE.Vector3(), e);
      gltf.scene.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
      /* gölge harita zeminine: yalnız gölgeyi çizen saydam düzlem (ışık modelle sabit, gölge haritası bir kez çizilir) */
      const gz = new THREE.Mesh(new THREE.PlaneGeometry(R * 2, R * 2), new THREE.ShadowMaterial({ opacity:0.3, depthWrite:false, polygonOffset:true, polygonOffsetFactor:2, polygonOffsetUnits:8 }));
      gz.rotation.x = -Math.PI / 2; gz.position.y = 0.02; gz.receiveShadow = true; gz.renderOrder = -1; sahne.add(gz);
      if (ISIK.yer_golgesi > 0) {   // dokunun koyu iç dikdörtgeni (76/128) taban izini biraz aşar; model ile döner
        const boy = kutu.getSize(new THREE.Vector3()), kc = kutu.getCenter(new THREE.Vector3()), k1 = 1 / 0.59;
        const yg = new THREE.Mesh(new THREE.PlaneGeometry(boy.x * k1 + 2, boy.z * k1 + 2), new THREE.MeshBasicMaterial({ map:YG_DOKU, transparent:true, opacity:ISIK.yer_golgesi, depthWrite:false, toneMapped:false, polygonOffset:true, polygonOffsetFactor:2, polygonOffsetUnits:8 }));
        yg.rotation.x = -Math.PI / 2; yg.position.set(kc.x - c.x, 0.03, kc.z - c.z); yg.renderOrder = -1; grup.add(yg);
      }
      const mc = maplibregl.MercatorCoordinate.fromLngLat([e.lon, e.lat], 0), k = mc.meterInMercatorCoordinateUnits();
      const l = new THREE.Matrix4().makeTranslation(mc.x, mc.y, mc.z).scale(new THREE.Vector3(k, -k, k)).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
      this.items.push({ id:e.id, sahne, l, golge:false });
      const kes = tabanIzi(e, kutu.min.x - c.x, kutu.max.x - c.x, kutu.min.z - c.z, kutu.max.z - c.z, 1);
      IZLER.push({ id:e.id, cokgen:tabanIzi(e, kutu.min.x - c.x, kutu.max.x - c.x, kutu.min.z - c.z, kutu.max.z - c.z, 3), kes:turf.polygon([[...kes, kes[0]]]), ana:anaObj ? new THREE.Box3().setFromObject(anaObj).getSize(new THREE.Vector3()) : kutu.getSize(new THREE.Vector3()) });
      binalariGuncelle(); this.map.triggerRepaint();
    } catch (err) { console.warn('model yüklenemedi', e.id, err); }
  },
  render(gl, girdi) {
    if (this.map.getZoom() < 14.5) return;
    /* MapLibre 5+: matris girdi.defaultProjectionData içinde. Küre yakında düz haritaya geçtiği için (projectionTransition 0) mainMatrix
       mercator matrisidir; geçiş sürerken mercator yedeği (fallbackMatrix) kullanılır, modeller kürenin üstünde yüzmez */
    const d = girdi.defaultProjectionData, p = new THREE.Matrix4().fromArray(d.projectionTransition > 0 ? d.fallbackMatrix : d.mainMatrix);
    this.r.resetState();
    /* gölge haritası her model için bir kez çizilir (güneş modelle sabit). Gölge geçişi bitince three çizim alanını kendi bildiği
       tuval boyuna döndürür; tuval sonradan büyümüşse (yüksek DPI, pencere boyu) model yanlış yere çizilip kaybolur. Bu yüzden her karede güncel boy */
    this.r.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    this.r.shadowMap.autoUpdate = false;
    for (const it of this.items) {
      this.kamera.projectionMatrix.copy(p).multiply(it.l); this.r.shadowMap.needsUpdate = !it.golge; it.golge = true; this.r.render(it.sahne, this.kamera);
    }
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
const icinde = (p, c) => { let ic2 = false; for (let i = 0, j = c.length - 1; i < c.length; j = i++) { const [xi, yi] = c[i], [xj, yj] = c[j]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) ic2 = !ic2; } return ic2; };
/* OSM 3D binaları kendi katmanımızdan çizilir: harita karoları bu bölgede binaları birleştirilmiş gruplar (MultiPolygon)
   olarak veriyor, yani stilin building_3d katmanında tek bir binayı süzgeçle gizlemek mümkün değil (ya grubun hepsi ya hiçbiri).
   Yüklenen gruplar tek tek binalara ayrılır; ortası modelin taban izine (+3 m) düşen küçük bina çizilmez (29 Ekim 2026; ürünün kuralıyla aynı, aşağıda). Düz bina izi (stilin «building»i) de aynı süzgeçten geçer (akar-bina-duz). Kalanlar aynı yükseklikle, eserlerden ayrışan nötr gri tonda çizilir. */
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
        let bina; try { bina = turf.polygon(c); } catch { continue; }
        /* 29 Ekim 2026: ürünle (apps/web osm-buildings.ts isHidden) aynı kural. Köşelerinin ortalaması bir modelin taban izine
           (döndürülmüş sınır kutusu + 3 m) düşen VE alanı o izin 1,6 katından küçük bina çizilmez; büyük çarşı çatıları kalır.
           Bina kesilmez. (Bir önceki «modele değen bina bütünüyle kalkar» kuralı çevredeki çarşı bloklarını da siliyordu.) */
        const kose = halka[0][0] === halka[halka.length - 1][0] && halka[0][1] === halka[halka.length - 1][1] ? halka.slice(0, -1) : halka;
        const orta = kose.reduce((a, p) => [a[0] + p[0] / kose.length, a[1] + p[1] / kose.length], [0, 0]);
        let alan;
        if (IZLER.some((iz) => icinde(orta, iz.cokgen) && (alan ??= turf.area(bina)) < 1.6 * turf.area(turf.polygon([[...iz.cokgen, iz.cokgen[0]]])))) continue;
        binalar.push({ type:'Feature', properties:{ h, b }, geometry:bina.geometry });
      }
    }
    kaynak.setData({ type:'FeatureCollection', features:binalar });
  }, 350);
}
function binaKatmaniKur() {
  if (harita.getSource('akar-bina')) return;
  harita.addSource('akar-bina', { type:'geojson', data:{ type:'FeatureCollection', features:[] } });
  const duz = (stil.layers || []).find((l) => l.id === 'building');
  if (duz && harita.getLayer('building')) { harita.addLayer({ id:'akar-bina-duz', type:'fill', source:'akar-bina', minzoom:duz.minzoom || 12, paint:duz.paint }, 'building'); harita.setPaintProperty('building', 'fill-opacity', 0); }   // gizlenmez: gizli katmanın verisi yüklenmez, querySourceFeatures boş döner
  const b3 = (stil.layers || []).find((l) => l.id === 'building_3d')?.paint || {};   // renk ve opaklık stilden
  harita.addLayer({ id:'akar-bina-3d', type:'fill-extrusion', source:'akar-bina', minzoom:15, paint:{
    'fill-extrusion-color':b3['fill-extrusion-color'] || '#D9DCDF', 'fill-extrusion-opacity':b3['fill-extrusion-opacity'] ?? 0.4, 'fill-extrusion-vertical-gradient':true,
    'fill-extrusion-height':['interpolate', ['linear'], ['zoom'], 15, 0, 15.6, ['get', 'h']], 'fill-extrusion-base':['get', 'b'] } });
  if (harita.getLayer('building_3d')) harita.setLayoutProperty('building_3d', 'visibility', 'none');
}
function binaGorunum() { if (harita.getLayer('akar-bina-3d')) harita.setLayoutProperty('akar-bina-3d', 'visibility', harita.getPitch() > 5 ? 'visible' : 'none'); }

harita.on('style.load', () => {
  binaKatmaniKur();
  harita.addLayer(yapiKatman);
  haritaPinleriKur(); binaGorunum(); binalariGuncelle(); sehirleriKur();
});

/* --- Şehirler (28 Ekim 2026): zoom SEHIR_ESIK'in altında eser pinleri yerine envanteri olan şehirler (veri/sehir/*.json).
   Eseri olan şehre dokununca oraya uçulur; olmayanda envanter bilgisi gösterilir. Esere ya da şehre özel kod yok */
const sehirEserSayisi = (s) => VERI.eserler.filter((e) => (e.il || '').toLocaleLowerCase('tr') === s.ad.toLocaleLowerCase('tr')).length;
function sehirleriKur() {
  if (harita._sehirIsaret) return;
  harita._sehirIsaret = (VERI.sehirler || []).filter((s) => Array.isArray(s.merkez)).map((s) => {
    const n = sehirEserSayisi(s), el = document.createElement('button');
    el.className = 'sehir-isaret' + (n ? ' hazir' : ''); el.type = 'button'; el.dataset.sehirGit = s.id;
    if (/^#[0-9a-f]{6}$/i.test(s.kimlik?.zemin || '')) el.style.setProperty('--il', s.kimlik.zemin);   // her şehir kendi envanter renginde parlar
    el.setAttribute('aria-label', n ? `${s.ad}: ${n} eser, haritada aç` : `${s.ad}: envanter ${s.envanter_yili || ''}, uygulamaya ekleniyor`);
    el.innerHTML = `<i aria-hidden="true"></i><b>${esc(s.ad)}</b><small>${n ? `${n} eser` : 'Yakında'}</small>`;
    return new maplibregl.Marker({ element:el, anchor:'left', offset:[-7, 0] }).setLngLat(s.merkez).addTo(harita);
  });
  sehirGorunum();
}
function sehirGorunum() { const z = harita.getZoom(); document.body.classList.toggle('sehir-modu', z < SEHIR_ESIK); document.body.classList.toggle('sehir-cok-uzak', z < 3.2); }   // çok uzakta yalnız noktalar (etiketler üst üste binmesin), eseri olan şehrin adı kalır
harita.on('zoom', sehirGorunum);
/* Küre yavaşça döner (29 Ekim 2026): uzak (küre) görünümde, kimse dokunmuyorsa ~1,5°/sn doğuya döner; dokunma, sürükleme, tekerlek ya da
   tuşta durur, 4 sn sessizlikten sonra yeniden başlar. Uçuş sırasında, sayfa gizliyken ve hareket azaltma tercihinde dönmez */
{ let son = performance.now(), dokunus = 0;
  const azalt = matchMedia('(prefers-reduced-motion: reduce)');
  ['mousedown', 'touchstart', 'wheel', 'keydown'].forEach((t) => harita.getCanvasContainer().addEventListener(t, () => { dokunus = performance.now(); }, { passive:true }));
  const don = (t) => {
    const dt = Math.min(t - son, 100); son = t;
    if (!azalt.matches && document.visibilityState === 'visible' && harita.getZoom() < SEHIR_ESIK && !harita.isMoving() && t - dokunus > 4000 && !location.hash.slice(2)) {
      const c = harita.getCenter(); c.lng += dt * 0.0015; harita.setCenter(c);
    }
    requestAnimationFrame(don);
  };
  requestAnimationFrame(don); }
function sehirlereUzaklas() {
  eserSec(null);
  /* padding sıfırlanır: eser seçilince verilen sağ boşluk (masaüstü kartı için, easeTo padding kalıcıdır) küreyi sola kaydırıyordu */
  harita.flyTo({ center:[34.5, 39.2], zoom:durum.masaustu ? 4.6 : 3.6, pitch:0, bearing:0, duration:2200, essential:true, padding:{ top:0, bottom:0, left:0, right:0 } });
}
/* fareyle uzaklaşınca da: şehir görünümüne (küre) inildiğinde masaüstünde kalan boşluk kaldırılır, küre ortada durur */
harita.on('zoomend', () => {
  if (!durum.masaustu || harita.getZoom() >= SEHIR_ESIK) return;
  const p = harita.getPadding(); if (p.top || p.bottom || p.left || p.right) harita.easeTo({ padding:{ top:0, bottom:0, left:0, right:0 }, duration:400 });
});
document.addEventListener('click', (ev) => {
  if (ev.target.closest('[data-sehirler]')) { ev.preventDefault(); if (location.hash.length > 2) location.hash = '#/'; sehirlereUzaklas(); return; }
  const b = ev.target.closest('[data-sehir-git]'); if (!b) return;
  const s = (VERI.sehirler || []).find((x) => x.id === b.dataset.sehirGit); if (!s) return;
  if (sehirEserSayisi(s)) harita.flyTo({ center:s.merkez, zoom:durum.masaustu ? (s.zoom_masaustu || s.zoom) : s.zoom, pitch:55, bearing:-12, duration:2600, essential:true });
  else toast(`${s.ad}: ${s.envanter_eser_sayisi ? `${s.envanter_eser_sayisi} vakıf eseri ` : ''}envanterde belgelendi${s.envanter_yili ? ` (${s.envanter_yili})` : ''}. Uygulamaya ekleniyor.`);
});
harita.on('sourcedata', (e) => { if (e.sourceId === 'openmaptiles' && e.isSourceLoaded) binalariGuncelle(); });
harita.on('pitchend', binaGorunum);
harita.on('moveend', haritaIliGuncelle); harita.once('idle', haritaIliGuncelle);
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
/* ---------- konum kipi: Yakınımda | Evden gez (Figma D 1:4685 · WF 1:5742 · 1:7694; 29 Ekim 2026) ----------
   Evden gez: konum istenmez, harita şehrin merkezinden başlar, liste «Bursa'daki eserler». Varsayılan budur (izin istemeden açılır).
   Yakınımda: konum yalnız cihazda kullanılır (sunucuya gitmez), liste yakından uzağa sıralanır.
   Konum şehrin 30 km dışındaysa (jüri başka şehirden bakıyorsa) Evden gez'e döner ve bunu söyler; boş bir «yakınında» listesi göstermez. */
const yerEki = (ad, cikma) => { const a = String(ad || ''), kucuk = a.toLocaleLowerCase('tr'), u = [...kucuk].reverse().find((h) => 'aıoueiöü'.includes(h)) || 'a';
  return `${a}'${'fstkçşhp'.includes(kucuk.slice(-1)) ? 't' : 'd'}${'aıou'.includes(u) ? 'a' : 'e'}${cikma ? 'n' : ''}`; };   // Bursa'da · Bursa'dan
durum.konum = yerel('akar.konum') === 'yakin' ? 'yakin' : 'ev'; durum.konumNokta = null;
const konumCipIc = () => `${ic(durum.konum === 'yakin' ? 'navigation' : 'house', 14)}${durum.konum === 'yakin' ? 'Yakınımda' : 'Evden gez'} ${ic('chevron-down', 14)}`;
function konumKip(k, uc = true) {
  durum.konum = k; yerel('akar.konum', k);
  const c = $('#cip-konum'); if (c) c.innerHTML = konumCipIc();
  if (k === 'ev') { durum.konumNokta = null; if (uc) harita.easeTo({ center:SEHIR.merkez, zoom:durum.masaustu ? (SEHIR.zoom_masaustu || SEHIR.zoom) : SEHIR.zoom, duration:900 }); }
  if (!location.hash.slice(2)) kesif();
}
function konumIste() {
  if (!navigator.geolocation) { toast('Bu cihazda konum yok · Evden gez açık'); return konumKip('ev'); }
  navigator.geolocation.getCurrentPosition((p) => {
    const n = { lng:p.coords.longitude, lat:p.coords.latitude }, [m] = mesafeYon({ lng:SEHIR.merkez[0], lat:SEHIR.merkez[1] }, n);
    if (m > 30000) { toast(`Konumun ${SEHIR.ad} dışında · Evden gez ile şehir merkezinden başladık`); return konumKip('ev'); }
    durum.konumNokta = n; konumKip('yakin', false); harita.easeTo({ center:[n.lng, n.lat], zoom:16.5 });
  }, () => { toast(`Konum izni yok · Evden gez: ${SEHIR.ad}`); konumKip('ev'); }, { timeout:10000, maximumAge:60000 });
}
$('#b-konum').onclick = konumIste;
/* «Yakınımda ▾» menüsü: Konumumu kullan | Evden gez, seçili olanın yanında ✓ */
function konumMenu(ac) {
  const var_ = $('#konum-menu'), c = $('#cip-konum');
  if (var_ || ac === false) { var_?.remove(); c?.setAttribute('aria-expanded', 'false'); return; }
  if (!c) return;
  const m = document.createElement('div'); m.id = 'konum-menu'; m.className = 'konum-menu'; m.setAttribute('role', 'menu');
  const s = (k, ikon, b, a) => `<button role="menuitemradio" aria-checked="${durum.konum === k}" data-konum-kip="${k}">${ic(ikon, 18)}<span><b>${b}</b><small>${a}</small></span>${durum.konum === k ? ic('check', 16) : ''}</button>`;
  m.innerHTML = s('yakin', 'map-pin', 'Konumumu kullan', 'Yakınındaki eserler önce gelir') + s('ev', 'house', 'Evden gez', `Konum gerekmez, ${yerEki(SEHIR.ad, true)} başlar`);
  const ust = $('#harita-ust'), r = c.getBoundingClientRect(), u = ust.getBoundingClientRect();
  m.style.left = (r.left - u.left) + 'px'; m.style.top = (r.bottom - u.top + 8) + 'px';
  ust.appendChild(m); c.setAttribute('aria-expanded', 'true');
  m.querySelector('[aria-checked="true"]')?.focus({ preventScroll:true });
}
document.addEventListener('click', (e) => {
  const k = e.target.closest('[data-konum-kip]'); if (k) { konumMenu(false); if (k.dataset.konumKip === 'yakin') konumIste(); else konumKip('ev'); return; }
  if ($('#konum-menu') && !e.target.closest('#konum-menu, #cip-konum')) konumMenu(false);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#konum-menu')) { e.stopImmediatePropagation(); konumMenu(false); $('#cip-konum')?.focus(); } }, true);

/* filtre çipleri (vakıf rolü) */
function ciplerHTML(masaustuPanel) {
  /* yalnız bu şehirde eseri olan roller (boş filtre jüriye boş liste gösterirdi) */
  const rol = ['dini', 'su', 'egitim', 'akar'].filter((r) => VERI.eserler.some((e) => e.rol === r)).map((r) => `<button class="cip filtre" data-rol="${r}" aria-pressed="${durum.filtre.has(r)}" title="${esc(ROL_ACIKLAMA[r])}"><span class="nokta" style="background:${ROL_RENK[r]}"></span>${ROL_AD[r]}</button>`).join('');
  return masaustuPanel ? `<button class="cip koyu" data-rol="hepsi">Tümü</button>${rol}` : `<button class="cip il-cip" data-sehirler title="Şehirler"><i class="il-motif" aria-hidden="true"></i><span class="il-ad">${esc(SEHIR.ad || '')}</span></button><button class="cip koyu" id="cip-konum" aria-haspopup="menu" aria-expanded="false">${konumCipIc()}</button>${rol}`;
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
$('#cipler').addEventListener('click', (e) => { if (e.target.closest('#cip-konum')) konumMenu(); });
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
  constructor(kap, { onParca, altBosluk, solBosluk } = {}) {
    this.kap = kap; this.onParca = onParca; this.altBosluk = altBosluk || (() => 0); this.solBosluk = solBosluk || (() => 0);
    this.r = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:'high-performance' });
    // tuval saydam: zemin .sahne3d'nin CSS geçişinden gelir (şehrin rengi)
    this.r.setPixelRatio(Math.min(devicePixelRatio, 1.5)); this.r.setClearColor(0x000000, 0);
    kap.appendChild(this.r.domElement);
    this.sahne = new THREE.Scene();
    /* ışık (isikKur) model yüklenince kurulur: gölge kamerası yapının boyuna göre. Model haritadaki yaw ile döndüğü için güneş yönü de aynı düşer */
    this.kam = new THREE.PerspectiveCamera(38, 1, 0.5, 5000);
    this.kont = new OrbitControls(this.kam, this.r.domElement);
    this.kont.enableDamping = true; this.kont.dampingFactor = 0.09; this.kont.maxPolarAngle = Math.PI * 0.49;
    this.kont.addEventListener('change', () => (this.kirli = true));
    this.kont.addEventListener('start', () => { this.turIste = false; this.kont.autoRotate = false; });   // kullanıcı döndürünce tur durur
    this.secili = new Set(); this.vurgulu = new Set(); this.flas = 0; this.kart = null;
    this.ro = new ResizeObserver(() => this.boyut()); this.ro.observe(kap);
    this.isaretci();
    this.dongu = this.dongu.bind(this); this.raf = requestAnimationFrame(this.dongu);
  }
  boyut() {
    const w = this.kap.clientWidth, h = this.kap.clientHeight; if (!w || !h) return;
    this.r.setSize(w, h, false); this.kam.aspect = w / h;
    /* altta kart varsa kadrajın merkezi kartın yarısı kadar yukarı, solda kart varsa yarısı kadar sağa kayar (görünür alanın ortası) */
    const a = Math.min(this.altBosluk(), h * 0.6), s = Math.min(this.solBosluk(), w * 0.5);
    if (a > 0 || s > 0) this.kam.setViewOffset(w + s, h + a, 0, a, w, h); else this.kam.clearViewOffset();
    this.gorunurH = h - a; this.gorunurW = w - s; this.kam.updateProjectionMatrix(); this.kirli = true;
  }
  async yukle(e) {
    this.eser = e;
    const gltf = await glbCoz(e.glb + '_sunum'); if (this.bitti) return;
    /* haritadaki yönle aynı: azimut 0 = kuzeyden bakış */
    this.kok = new THREE.Group(); this.kok.add(gltf.scene); this.kok.rotation.y = -THREE.MathUtils.degToRad(e.yaw || 0);
    this.sahne.add(this.kok); this.kok.updateMatrixWorld(true);
    /* kadraj yalnız yapıya göre (zemin, ağaçlar ve ölçek insanları kutuya girmez) */
    this.kutu = new THREE.Box3();
    gltf.scene.traverse((o) => { if (o.isMesh && yerGolgesiMi(o)) o.visible = false; });   // eski modellerdeki pişmiş düzlem
    for (const o of gltf.scene.children) if (!sunumEk(e, o.name) && !yerGolgesiMi(o)) this.kutu.expandByObject(o);
    const c = this.kutu.getCenter(new THREE.Vector3()), b = this.kutu.getSize(new THREE.Vector3());
    this.yaricap = b.length() / 2; this.boyY = b.y;
    isikKur(this.r, this.sahne, this.yaricap * 1.3, false, c, e);
    this.merkez = new THREE.Vector3(c.x, this.kutu.min.y + b.y * 0.25, c.z);   // Merkez: kutunun yatay ortası (kadraj için tabandan biraz yukarıda)
    this.parcalar = new Map(); this.meshler = [];
    const adlar = new Set(gltf.parser.json.nodes.filter((n) => n.mesh !== undefined && !sunumEk(e, n.name)).map((n) => n.name));
    for (const ad of adlar) { const o = this.kok.getObjectByName(ad); if (o) this.parcalar.set(ad, o); }
    this.kok.traverse((o) => {
      if (!o.isMesh) return;
      o.material = o.material.clone(); o.material.emissive = new THREE.Color(0, 0, 0); o.castShadow = o.receiveShadow = true;
      if (ISIK.doygunluk !== 1 && o.material.color) { const hsl = {}; o.material.color.getHSL(hsl); o.material.color.setHSL(hsl.h, Math.min(1, hsl.s * ISIK.doygunluk), hsl.l); }   // haritadaki doygunluk
      let p = o; while (p && !adlar.has(p.name)) p = p.parent;
      o.userData.parca = p ? p.name : null; this.meshler.push(o);
    });
    zeminKatmanlari(this.meshler);
    /* yer gölgesi haritadaki gibi: aynı bulanık doku, yapının taban izi boyutunda (kutu modelin kendi ekseninde), zemin katmanlarının üstünde */
    if (ISIK.yer_golgesi > 0) {
      const ters = this.kok.matrixWorld.clone().invert(), yk = new THREE.Box3();
      for (const o of gltf.scene.children) if (!sunumEk(e, o.name) && !yerGolgesiMi(o)) yk.union(new THREE.Box3().setFromObject(o).applyMatrix4(ters));
      if (!yk.isEmpty()) {
        const boy = yk.getSize(new THREE.Vector3()), kc = yk.getCenter(new THREE.Vector3()), k1 = 1 / 0.59;
        const yg = new THREE.Mesh(new THREE.PlaneGeometry(boy.x * k1 + 2, boy.z * k1 + 2), new THREE.MeshBasicMaterial({ map:YG_DOKU, transparent:true, opacity:ISIK.yer_golgesi, depthWrite:false, toneMapped:false, polygonOffset:true, polygonOffsetFactor:-6, polygonOffsetUnits:-30 }));
        yg.rotation.x = -Math.PI / 2; yg.position.set(kc.x, yk.min.y + 0.05, kc.z); yg.renderOrder = 1; this.kok.add(yg);
      }
    }
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
    const w = this.gorunurW || this.kap.clientWidth || 1, gh = this.gorunurH || this.kap.clientHeight || 1;
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
  /* genel görünüm: cümle belli bir parçayı göstermiyorsa yapı yavaşça döner (360°, ~30 sn); kamera geçişi bitince başlar, dokununca durur */
  tur(acik) { this.turIste = !!acik; if (!acik) this.kont.autoRotate = false; this.kont.autoRotateSpeed = 2; this.kirli = true; }
  vurgula(adlar) { this.vurgulu = new Set((adlar || []).filter((a) => this.parcalar && this.parcalar.has(a))); this.vurguT0 = performance.now(); this.boya(); }
  /* bir kartın bütün parçaları birlikte seçilir ve vurgulanır (ör. Ulucami: dört cephe + pencere girintileri tek kart); kartı olmayan parça tek başına */
  grup(ad) { const k = ad && this.eser?.parcalar?.find((p) => p.adlar.includes(ad)); return k ? k.adlar : (ad ? [ad] : []); }
  sec(ad) { if (this.secili.has(ad)) this.secili.clear(); else this.secili = new Set(this.grup(ad)); this.boya(); return this.secili.has(ad); }
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
      else if (p && this.ustteGrup && this.ustteGrup.has(p)) e.copy(SARI).multiplyScalar(0.24);   // fare üstünde: seçiliden hafif
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
    /* masaüstü: fare tıklanabilir bir parçanın üstüne gelince parça hafif sarı yanar, imleç el olur, adı ipucunda (mobilde «Tıklanabilir parçalar» düğmesi) */
    let bekle = false;
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || e.buttons || bekle || !this.meshler) return;
      bekle = true; requestAnimationFrame(() => {
        bekle = false;
        const r = el.getBoundingClientRect(), n = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        const ray = new THREE.Raycaster(); ray.setFromCamera(n, this.kam);
        const hit = ray.intersectObjects(this.meshler, false).find((h) => h.object.userData.parca && gorunurMu(h.object) && h.object.material.opacity > 0.5);
        const ad = hit && this.tiklanir(hit.object.userData.parca) ? hit.object.userData.parca : null;
        if (ad === this.ustte) return;
        this.ustte = ad; this.ustteGrup = new Set(this.grup(ad)); el.style.cursor = ad ? 'pointer' : '';
        const k = ad && this.eser?.parcalar?.find((p) => p.adlar.includes(ad)); el.title = k ? k.baslik : '';
        this.boya();
      });
    });
    el.addEventListener('pointerleave', () => { if (this.ustte) { this.ustte = null; this.ustteGrup = null; el.style.cursor = ''; el.title = ''; this.boya(); } });
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
  /* model.json «tiklanmaz»: kart hazırlanmamış eserlerde de süs/taşıyıcı parçalar (silme, baca, dikiş…) tıklanmaz */
  tiklanir(ad) { if ((this.eser?.model?.tiklanmaz || []).includes(ad)) return false; const k = this.eser && this.eser.parcalar; return !k || !k.length || k.some((p) => p.adlar.includes(ad)); }
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
    if (this.turIste && !this.tween && !this.kont.autoRotate && !matchMedia('(prefers-reduced-motion: reduce)').matches) this.kont.autoRotate = true;
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
/* 29 Ekim 2026 · 3D açılamazsa (Figma D 1:4911 · WF 1:7840): «3D model açılamadı», Yeniden dene | Görsellerle devam et.
   İndirme kesilirse ya da dosya bozuksa (ya da cihazda WebGL yoksa) hikâye aynı akışla fotoğraflarla sürer. Hatalı indirme önbellekten silinir, yeniden dene baştan indirir. */
function uc3Hata(kap, dosya, yeniden, err, foto) {
  console.warn('3D açılamadı:', dosya, err);
  glbTampon.delete(dosya); glbSon.delete(dosya); s3dKapat();
  if (!kap || !kap.isConnected) return;
  kap.innerHTML = `<div class="uc-hata" role="alert"><div class="uh-kart"><b>3D model açılamadı</b><p>Bağlantı kesildi ya da dosya bozuk. Hikâye görsellerle aynı şekilde devam eder.</p><div class="uh-dugmeler"><button class="btn ana tam" data-uh="yeniden">Yeniden dene</button><button class="btn ikincil tam" data-uh="foto">Görsellerle devam et</button></div></div></div>`;
  kap.querySelector('[data-uh="yeniden"]').onclick = () => yeniden();
  kap.querySelector('[data-uh="foto"]').onclick = foto || (() => { durum.gorunum = 'foto'; yerel('akar.gorunum', 'foto'); yeniden(); });
}
function s3dKur(kap, e, ayar, yeniden, sonra, foto) {
  const dosya = e.glb + '_sunum'; let bu;
  try { bu = s3d = new Sahne3D(kap, ayar); } catch (err) { s3d = null; return uc3Hata(kap, dosya, yeniden, err, foto); }
  yuklemeIzle(kap, dosya);
  bu.yukle(e).then(() => { if (s3d !== bu) return; kap.querySelector('.yukleniyor')?.remove(); sonra && sonra(); }).catch((err) => { if (s3d === bu) uc3Hata(kap, dosya, yeniden, err, foto); });
}

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
    const t = e.target.closest('#alt-tutamak, #alt-ic > .sekme-grup, #alt-ic > .sekme-icerik > .baslik-satir'); if (!t) return;
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

/* 30 Ekim 2026: liste haritadaki aktif ilin eserleri (birden çok ilde eser var); aramada bütün iller */
const listeSehri = () => { try { return haritaIli || SEHIR; } catch { return SEHIR; } };
const ilinMi = (e, s = listeSehri()) => !e.il || !s?.ad || e.il.toLocaleLowerCase('tr') === s.ad.toLocaleLowerCase('tr');
function eserListe() {
  const l = VERI.eserler.filter((e) => durum.filtre.has(e.rol) && (durum.arama || ilinMi(e)) && (!durum.arama || e.ad.toLocaleLowerCase('tr').includes(durum.arama) || (e.uzun_ad || '').toLocaleLowerCase('tr').includes(durum.arama)));
  const n = durum.konum === 'yakin' && durum.konumNokta;   // Yakınımda: yakından uzağa
  return n ? l.map((e) => [mesafeYon(n, { lng:e.lon, lat:e.lat })[0], e]).sort((a, b) => a[0] - b[0]).map((x) => x[1]) : l;
}
const listeAdi = (tur) => (durum.konum === 'yakin' ? `Yakınındaki ${tur}` : `${yerEki(listeSehri().ad)}ki ${tur}`);   // Yakınındaki eserler · Bursa'daki eserler
const eserSatir = (e) => `<li class="eser-satir${durum.secili === e.id ? ' secili' : ''}" data-eser="${e.id}">${resim(kapak(e))}<div><h3>${esc(e.ad)}</h3><div class="meta"><span class="rol-nokta" style="background:${ROL_RENK[e.rol] || 'var(--border)'}" title="${esc(ROL_AD[e.rol] || '')}"></span>${esc(meta(e))}</div>${e.glb && !VERI.eserler.every((x) => x.glb) ? '<span class="etiket">3D</span>' : ''}</div><button class="arti" data-rotama="${e.id}" aria-label="Rotama ekle">${ic('plus', 16)}</button></li>`;
function rotaKart() {
  const ilerleme = JSON.parse(yerel('akar.rota') || 'null');
  const durumMetni = ilerleme ? `<span class="rozet-durum devam">Devam et · ${ilerleme.i + 1} / ${ROTA.duraklar.length}</span>` : '<span class="rozet-durum">Başlanmadı</span>';
  return `<div class="rota-kart" data-rota="${ROTA.id}">${resim(kapak(ESER[ROTA.duraklar[0]]))}<div><h3>${esc(ROTA.ad)}</h3><div class="soluk">${ROTA.duraklar.length} durak · ${ROTA.sure} · ${ROTA.mesafe}</div>${durumMetni}</div></div>`;
}
/* Eserler | Rotalar (29 Ekim 2026): seçili zemin sekmeler arasında kayar, içerik geldiği yönden girer; listede sağa/sola kaydırınca sekme değişir.
   Başlık iki sekmede de aynı yerde (filtre etiketleri başlığın altında), panelin kaydırma çubuğu yeri sabit → yazılar yer değiştirmez */
const SEKMELER = ['eserler', 'rotalar'];
function sekmeGec(yeni) {
  if (!SEKMELER.includes(yeni) || yeni === durum.sekme) return;
  durum.sekmeOnce = durum.sekme; durum.sekmeYon = SEKMELER.indexOf(yeni) > SEKMELER.indexOf(durum.sekme) ? 'sag' : 'sol';
  durum.sekme = yeni; kesif();
}
function sekmeKaydir() {   // yeni çizilen grupta seçili zemini eski yerinden yenisine kaydır
  $$('.sekme-grup.kayan').forEach((g) => { g.offsetWidth; g.dataset.i = SEKMELER.indexOf(durum.sekme); });
  durum.sekmeOnce = null; durum.sekmeYon = null;
}
function kesifIcerik(masaustu) {
  const i0 = SEKMELER.indexOf(durum.sekmeOnce || durum.sekme), yon = durum.sekmeYon ? ` data-yon="${durum.sekmeYon}"` : '';
  const sekme = `<div class="sekme-grup kayan" data-i="${i0}" role="tablist"><button role="tab" data-sekme="eserler" aria-selected="${durum.sekme === 'eserler'}">Eserler</button><button role="tab" data-sekme="rotalar" aria-selected="${durum.sekme === 'rotalar'}">Rotalar</button></div>`;
  if (durum.sekme === 'rotalar') return `${sekme}<div class="sekme-icerik"${yon}><div class="baslik-satir"><h2>${listeAdi('rotalar')}</h2><a>Tümünü gör (${VERI.rotalar.length}) ›</a></div>${rotaKart()}</div>`;
  const liste = eserListe();
  const ust = masaustu ? `<div class="baslik-satir"><h2>${listeAdi('eserler')} · ${liste.length}</h2><a>Tümünü gör (${VERI.eserler.length}) ›</a></div>`   /* rol filtreleri yalnız haritanın üstünde (panelde ikinci kopya vardı) */
    : `<div class="baslik-satir" style="margin-top:12px"><a style="color:var(--primary)" href="#/" data-sehirler>${esc(listeSehri().ad)} ▾ · ${liste.length} eser${durum.konum === 'yakin' ? ' yakında' : ''}</a></div>`;
  return `${sekme}<div class="sekme-icerik"${yon}>${ust}<ul class="liste">${liste.map(eserSatir).join('') || '<li class="soluk" style="padding:16px 0">Sonuç yok. Yazımı kontrol et ya da filtreleri temizle.</li>'}</ul></div>`;
}
function kesif() {
  rotaKaldir();
  if (durum.masaustu) { panel.innerHTML = kesifIcerik(true) + `<div class="panel-alt"><button class="btn ikincil tam">Tüm eserleri gör (${VERI.eserler.length})</button></div>`; filtreUygula(); }
  else { altIc.innerHTML = kesifIcerik(false); alt.hidden = !!durum.secili; altYukseklik(typeof durum.altH === 'number' || ['kapali', 'yarim', 'tam'].includes(durum.altH) ? durum.altH : 'kapali'); }
  gorusKapat();
  eserKartiCiz();
  sekmeKaydir();
}
/* listede yatay kaydırma: sola → sonraki sekme, sağa → önceki (dikey kaydırmaya karışmasın diye yatay hareket baskın olmalı) */
{ let t0 = null;
  document.addEventListener('touchstart', (e) => { t0 = e.target.closest('.sekme-icerik') && e.touches.length === 1 ? [e.touches[0].clientX, e.touches[0].clientY] : null; }, { passive:true });
  document.addEventListener('touchend', (e) => {
    if (!t0) return; const t = e.changedTouches[0], dx = t.clientX - t0[0], dy = t.clientY - t0[1]; t0 = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > 2 * Math.abs(dy)) sekmeGec(SEKMELER[SEKMELER.indexOf(durum.sekme) + (dx < 0 ? 1 : -1)]);
  }, { passive:true }); }
document.addEventListener('click', (e) => {
  const s = e.target.closest('[data-sekme]'); if (s) { sekmeGec(s.dataset.sekme); return; }
  const r = e.target.closest('[data-rotama]'); if (r) { e.stopPropagation(); toast(`${ESER[r.dataset.rotama].ad} Rotam'a eklendi`); return; }
  const es = e.target.closest('[data-eser]'); if (es) { eserSec(es.dataset.eser, true); return; }   // mobilde de eser sayfası açılmaz: harita esere gider, pindeki gibi kısa kart çıkar
  const ro = e.target.closest('[data-rota]'); if (ro) { location.hash = '#/rota/' + ro.dataset.rota; return; }
});

/* eser seçimi: haritada büyüt, kartı aç */
/* Mobil kart ↔ liste (29 Ekim 2026): eser kartı ile Eserler/Rotalar alt sayfası aynı yüzey gibi birbirine dönüşür (View Transitions).
   Çarpı → kart kenarlara doğru büyür, içi solup liste gelir; listede esere dokununca tersi. Desteklemeyen tarayıcıda anlık değişir */
const yuzeyGecis = (fn) => {
  const sade = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (durum.masaustu || location.hash.slice(2) || sade || !document.startViewTransition) return fn();
  document.documentElement.classList.add('vt-yuzey');
  const g = document.startViewTransition(fn);
  g.ready.catch(() => {}); g.updateCallbackDone.catch(() => {});   // üst üste dokunuşta tarayıcı geçişi iptal edebilir; sorun değil, durum yine güncellenir
  g.finished.catch(() => {}).finally(() => document.documentElement.classList.remove('vt-yuzey'));
};
/* listede satırın üzerine gelince haritada o eserin pini seçili gibi vurgulanır (liste ↔ harita bağı); ayrılınca seçili esere döner */
document.addEventListener('pointerover', (ev) => {
  if (!durum.masaustu || !harita.getLayer('pin-secili')) return;
  const li = ev.target.closest('.eser-satir'), onceki = ev.relatedTarget?.closest?.('.eser-satir');
  if (li === onceki) return;
  pinSeciliFiltre(li?.dataset.eser || durum.secili);
});
function eserSec(id, ucus) {
  const onceki = durum.secili;
  durum.secili = id; yoreUygula(id ? ESER[id] : (haritaIli ? { il:haritaIli.ad } : null));
  pinSeciliFiltre(id);
  if (id && ucus) { const e = ESER[id]; harita.easeTo({ center:[e.lon, e.lat], zoom:Math.max(harita.getZoom(), 17), duration:700, padding:durum.masaustu ? { right:380 } : { bottom:240 } }); }
  const ciz = () => { if (!location.hash.slice(2)) { if (durum.masaustu) $$('.eser-satir').forEach((li) => li.classList.toggle('secili', li.dataset.eser === id)); else alt.hidden = !!id; } eserKartiCiz(); };
  (!!onceki !== !!id) ? yuzeyGecis(ciz) : ciz();   // yalnız kart ↔ liste değişiminde; kart açıkken başka esere geçişte içerik yerinde değişir
}
/* Harita kartının düğmeleri (29 Ekim 2026): kart bir ön izleme, ana düğme kullanıcının eserle ilişkisine göre değişir.
   Dinlemediyse: «Dinle · n dk» (en hızlı tanışma) + «Eseri incele ›».
   Dinlediyse: «Eseri incele» (fotoğraf, 3D, tam metin) + kalan bulmaca varsa «Bulmaca · n görev ›», yoksa sıradaki eser.
   Aynı bir dakikayı yeniden önermek yerine yeni bir şey gösterilir; yeniden dinlemek eser sayfasından yapılır */
function kartDugmeler(e) {
  const bitti = bittiMi(e.id), kalan = (e.gorevler || []).filter((g) => !gorevDurum(g)).length;
  const sonraki = sonrakiDurak(e) || VERI.eserler.find((x) => x.id !== e.id && !bittiMi(x.id));
  const isaret = `<button class="ikon-btn" data-rotama="${e.id}" aria-label="Rotama ekle">${ic('bookmark-plus')}</button>`;
  const incele = (ana) => ana ? `<button class="btn ana" data-detay="${e.id}">${ic('book-open-text')}Eseri incele</button>` : `<button class="kart-ikinci" data-detay="${e.id}">Eseri incele ${ic('chevron-right', 16)}</button>`;
  if (!bitti && e.hikaye.length) return `<div class="kart-alt"><button class="btn ana" data-baslat="${e.id}">${ic('headphones')}Dinle · ${e.sure} dk</button>${isaret}</div>${incele(false)}`;
  const ikinci = kalan ? `<button class="kart-ikinci" data-git="#/gorev/${e.id}">${ic('puzzle', 16)}Bulmaca · ${kalan} görev ${ic('chevron-right', 16)}</button>`
    : sonraki ? `<button class="kart-ikinci" data-eser="${sonraki.id}">Sonraki eser: ${esc(sonraki.ad)} ${ic('chevron-right', 16)}</button>` : '';
  return `<div class="kart-alt">${incele(true)}${isaret}</div>${ikinci}`;
}
function eserKartiCiz() {
  const e = durum.secili && ESER[durum.secili], acik = e && !location.hash.slice(2);
  const ic2 = e ? `<div class="kart-ust" data-detay="${e.id}">${resim(kapak(e))}<div><h3>${esc(e.ad)}</h3><div class="meta">${esc(meta(e))}</div>${guven('Doğrulanmış')}</div><button class="kapat" data-kapat aria-label="Kapat">${ic('x', 18)}</button></div>`
    + (durum.masaustu ? `<p>${esc(e.kisa)}</p>` : '')
    + kartDugmeler(e) : '';
  if (durum.masaustu) { pop.hidden = !acik; pop.innerHTML = ic2; kartEl.hidden = true; popKonum(); }
  else { kartEl.hidden = !acik; kartEl.innerHTML = ic2; pop.hidden = true; if (!location.hash.slice(2)) { alt.hidden = !!acik; if (!acik) altYukseklik(durum.altH || 'kapali'); } }
  /* mobilde kart açıkken harita kontrolleri (2D, +, −, konum) kartın üstünde dursun; fotoğraf yüklenince kart uzayabilir, bir kare sonra yeniden ölç */
  if (!durum.masaustu && acik) { const olc = () => document.documentElement.style.setProperty('--kart-h', kartEl.offsetHeight + 'px'); olc(); requestAnimationFrame(olc); kartEl.querySelector('img')?.addEventListener('load', olc, { once:true }); }
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

const seciciHTML = (koyu) => `<div class="ust-kontrol gizlenir${koyu ? ' koyu-zemin' : ''}"><div class="secici" role="radiogroup" aria-label="Görünüm"><button role="radio" data-gorunum="foto" aria-checked="${durum.gorunum === 'foto'}">${ic('image', 16)}Fotoğraf</button><button role="radio" data-gorunum="3d" aria-checked="${durum.gorunum === '3d'}">${ic('box', 16)}3D</button></div><button class="yuvarlak parca" data-parcalar aria-label="Tıklanabilir parçaları göster" title="Tıklanabilir parçaları göster">${ic('pointer', 18)}</button>${durum.masaustu && !koyu ? `<div class="arac-bilgi" id="arac-bilgi" aria-live="polite"></div><div class="arac-oklar"><button class="yuvarlak" data-kaydir="-1" id="arac-geri" aria-label="Önceki fotoğraflar">${ic('chevron-left', 18)}</button><button class="yuvarlak" data-kaydir="1" id="arac-ileri" aria-label="Sonraki fotoğraflar">${ic('chevron-right', 18)}</button></div>` : ''}</div>`;

function galeriHTML(e) {
  const f = galeriFoto(e);
  return `<div class="galeri" id="galeri">${f.map((x, i) => `<figure class="${i % 3 === 0 ? 'buyuk' : 'kucuk'}"><button class="galeri-f" data-isik="${esc(x.url)}" data-kunye="${esc([x.baslik, x.kaynak].filter(Boolean).join(' · '))}" aria-label="Fotoğrafı büyüt: ${esc(x.alt)}">${resim(x)}${BUYUT()}</button>${i === 0 ? guven(x.guven, { alinti:x.baslik, kaynak:x.kaynak }) : ''}</figure>`).join('')}</div>`
    ;   /* masaüstünde oklar fotoğrafların üstünde değil, araç satırının sağında (seciciHTML → arac-oklar) */
}
/* eser detayının keşif yolları (Eser hakkında · Geçmişi Gör · Bulmaca): her satır kendi içeriğinden bir ipucu gösterir.
   Geçmişi Gör: en eski fotoğrafın küçüğü (sepya), üzerine gelince bugünkü fotoğraf. Bulmaca: tamamlanan görev oranı altın halka. */
const enEskiFoto = (e) => e.gecmis.filter((f) => f.tarih?.enErken).sort((a, b) => a.tarih.enErken - b.tarih.enErken)[0] || e.gecmis[0];
const bulmacaHalka = (e, boy) => {
  const g = e.gorevler || [], tamam = g.filter(gorevDurum).length, bitti = g.length && tamam === g.length;
  return `<span class="gorev-halka${bitti ? ' bitti' : ''}" style="width:${boy}px;height:${boy}px"><svg class="halka-iz" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21"/><circle class="dolu" cx="24" cy="24" r="21" pathLength="1" style="stroke-dashoffset:${g.length ? 1 - tamam / g.length : 1}"/></svg>${ic(bitti ? 'check' : 'puzzle', Math.round(boy * (boy < 32 ? .56 : .42)))}</span>`;
};
const adParca = (ad) => { const [a, ...b] = String(ad).split(' '); return `<span class="ad-1">${esc(a)}</span>${b.length ? ` <span class="ad-2">${esc(b.join(' '))}</span>` : ''}`; };
function kesifYollari(e) {
  const eski = enEskiFoto(e), bugun = kapak(e), g = e.gorevler || [], tamam = g.filter(gorevDurum).length;
  const hkDk = e.hakkinda?.length ? hkDakika(e.hakkinda.reduce((n, b) => n + hkKelime(b), 0)) : 0;
  const yol = (hedef, ikon, baslik, alt) => `<button class="ky" ${hedef}><span class="ky-ik">${ikon}</span><span class="ky-yazi"><b>${baslik}</b><small>${alt}</small></span><span class="ky-ok">${ic('chevron-right', 18)}</span></button>`;
  const gecmisIk = eski ? `<span class="ky-foto"><img src="${esc(eski.kucuk)}" alt="" loading="lazy">${bugun ? `<img class="bugun" src="${esc(bugun.url)}" alt="" loading="lazy">` : ''}</span>` : `<span class="ky-daire">${ic('history', 22)}</span>`;
  /* «Eser hakkında» burada değil: kısa hikâyenin tamamı olduğu için hikâye bloğunda (hikayeBlok). Bu liste yalnız etkinlikler */
  return `<div class="kesif-bas" id="kesif-bas">Keşfet</div><nav class="kesif-yollari" aria-labelledby="kesif-bas">
    ${yol(`data-git="#/gecmis/${e.id}"`, gecmisIk, 'Geçmişi Gör', e.gecmis.length ? `${e.gecmis.length} eski fotoğraf${eski?.tarih?.enErken ? ` · ${eski.tarih.enErken}'den` : ''}` : 'Eski görüntü henüz yok')}
    ${yol('data-bulmaca', bulmacaHalka(e, 44), 'Bulmaca', g.length ? (tamam === g.length ? `${g.length} görevin hepsi tamam` : `${g.length} görev · ${tamam} tamam`) : 'Görev henüz yok')}
  </nav>`;
}
/* Hikâye bloğu (29 Ekim 2026): Dinle ve Oku aynı kısa hikâyenin iki yolu → tek birleşik düğme, süre üstte bir kez.
   Altında aynı bloğun içinde «Tamamını oku: Eser hakkında» (envanterden tam metin): özet ile tamamı yan yana, etkinliklerden ayrı */
const hkToplamDk = (e) => (e.hakkinda?.length ? hkDakika(e.hakkinda.reduce((n, b) => n + hkKelime(b), 0)) : 0);
function hikayeBlok(e, tamamiYok = false) {   // tamamiYok: mobilde tam metin kartı açılan kısımda (aşağıda ayrı çizilir)
  const bitti = bittiMi(e.id), tik = bitti ? `<span class="bitti-tik" title="Hikâye tamamlandı">${ic('check', 12)}</span>` : '';   // hikâye bittiyse düğmenin köşesinde ✓
  const hkDk = hkToplamDk(e);
  /* tam metin kartı: «Eser hakkında» sayfasının kapağının küçüğü (yöre renginde, desenli). Kısa hikâye ↔ tam metin aynı dille: süre + uzunluk çubuğu */
  let tamami = hkDk ? `<button class="tam-kart${ilKimlik(e)?.desen ? ' desenli' : ''}" data-git="#/hakkinda/${e.id}" aria-label="Tam metin: Eser hakkında, ${hkDk} dakika, envanterden"><span class="tk-yazi"><small>Tam metin · envanterden</small><b>Eser hakkında</b><span class="tk-alt">${hkDk} dk · ${e.hakkinda.length} bölüm${derinlikCubuk(hkDk)}</span></span><span class="tk-ok">${ic('arrow-right', 20)}</span></button>` : '';
  if (tamamiYok) tamami = '';
  if (!e.hikaye.length) return `<p class="soluk">Bu eserin hikâyesi henüz hazırlanmadı.</p>${tamami}`;
  return `<div class="hikaye-blok"><div class="hb-bas">Kısa hikâye · ${e.sure} dk${derinlikCubuk(e.sure)}</div>
    <div class="ikili" role="group" aria-label="Kısa hikâye, ${e.sure} dakika"><button class="ik-sol${bitti ? ' bitti' : ''}" data-anlat="dinle" ${bitti ? 'aria-label="Dinle, hikâye tamamlandı"' : ''}>${ic('headphones')}Dinle${tik}</button><button class="ik-sag" data-anlat="oku">${ic('book-open')}Oku</button></div>${tamami}</div>`;
}
function eserBilgi(e, masaustu) {
  const sd = sonrakiDurak(e);
  const dugme = hikayeBlok(e), hik = '';
  const sonraki = sd ? `<button class="btn cerceve tam" style="margin-top:12px" data-git="#/eser/${sd.id}" data-rotada>Sonraki durak: ${esc(sd.ad)} ${ic('arrow-right', 16)}</button>` : '';
  const gecmis = `<button class="gg-link" data-git="#/gecmis/${e.id}">${ic('history', 16)}Geçmişi Gör · ${e.gecmis.length ? `${e.gecmis.length} eski fotoğraf` : 'eski görüntü henüz yok'} ›</button>`;
  if (masaustu) return `<header class="eb-bas${ilKimlik(e)?.desen ? ' desenli' : ''}"><button class="geri" data-git="#/" style="height:auto;padding:0;border:0;gap:12px"><span class="ikon-btn" style="width:32px;height:32px">${ic('chevron-left', 16)}</span><span style="font-weight:500">Harita</span></button>
    <div class="eb-govde"><div class="eb-foto">${resim(kapak(e))}</div><div><h1 class="panel-baslik">${adParca(e.ad)}</h1><div class="panel-meta">${esc(meta(e))}</div></div></div></header>${SUSLEME}<div class="kisa-satir"><p style="margin:0 0 14px">${esc(e.kisa)}</p><button class="yuvarlak-ok" data-git="#/hakkinda/${e.id}" aria-label="Eser hakkında">${ic('arrow-right', 22)}</button></div>${hik}${dugme}
    ${kesifYollari(e)}<div class="panel-alt">${sonraki}</div>`;
  /* mobil kart = sürüklenen alt sayfa. Kapalı: ad, Dinle | Oku, Hakkında · Geçmiş · Bulmaca, rotadaysa Sonraki durak.
     Yukarı çekilince altta tarih, süsleme, kısa açıklama ve bölüm sayısı açılır (masaüstü paneliyle aynı içerik) */
  const sonrakiM = sd ? `<button class="btn cerceve tam sonraki-m" data-git="#/eser/${sd.id}" data-rotada>Sonraki durak: ${esc(sd.ad)} ${ic('arrow-right', 16)}</button>` : '';
  /* mobil kart (29 Ekim 2026, kullanıcı kararı): kapalıyken sade — ad, «Kısa hikâye · n dk», Dinle | Oku. Yukarı çekince sırayla:
     tam metin kartı (Eser hakkında), Keşfet satırları (masaüstündekiyle aynı), künye ve kısa açıklama. Tutamaktaki küçük ok açılabildiğini söyler */
  const tamamiM = hikayeBlok(e).match(/<button class="tam-kart[\s\S]*?<\/button>/)?.[0] || '';
  return `<div class="eser-alt" id="eser-alt"><div class="ea-ust"><div class="tutamak" id="ea-tutamak" role="button" tabindex="0" aria-label="Eser bilgisini aç" aria-expanded="false"><i></i>${ic('chevron-up', 14)}</div><h1>${adParca(e.ad)}</h1>${hikayeBlok(e, true)}${sonrakiM}</div>
    <div class="ea-detay">${tamamiM}${kesifYollari(e)}<div class="meta">${esc(meta(e))}</div>${SUSLEME}<p>${esc(e.kisa)}</p>${hik}</div></div>`;
}
function eserDetay(id) {
  const e = ESER[id]; if (!e) return (location.hash = '#/');
  durum.secili = id; rotaKaldir(); yoreUygula(e); gorunumAyar(e);
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
    alan.innerHTML = `<div class="sahne3d" id="s3d">${yuklemeKart('Bu sırada Dinle ya da Oku ile başlayabilirsin; model gelince sahne kendiliğinden açılır.')}</div><div class="ipucu">${ic('move', 14)}${durum.masaustu ? 'Sürükle: döndür · Tekerlek: yakınlaştır · Dokun: parça' : 'Sürükle: döndür · İki parmak: yakınlaştır · Dokun: parça'}</div><span class="guven temsili temsili-etiket" id="temsili">3D model · Temsili<span class="i">ⓘ</span></span><div class="parca-ad" id="parca-ad" hidden></div><button class="kubbe-dugme" id="kubbe-dugme" data-kubbe aria-pressed="false" hidden>${ic('chevron-up', 16)}<span>İçini göster</span></button>`;
    temsiliKonum();
    s3dKur($('#s3d'), e, { onParca:parcaSecildi, altBosluk:() => (durum.masaustu ? 0 : (eaSinir()[0] || 0) + 12) },   // kart açılsa da kadraj kapalı boya göre
      gorunumCiz, () => { if (s3d && s3d.kalkan) $('#kubbe-dugme').hidden = false; });
  }
  $$('[data-gorunum]').forEach((b) => b.setAttribute('aria-checked', b.dataset.gorunum === durum.gorunum));
  $('#galeri')?.addEventListener('scroll', aracGuncelle, { passive:true });
  $$('#galeri img').forEach((i) => i.addEventListener('load', aracGuncelle, { once:true }));   // fotoğraflar yüklenince galeri genişler: oklar yeniden değerlendirilsin
  aracGuncelle();
}
/* Masaüstü araç satırı (29 Ekim 2026): [Fotoğraf | 3D] · bilgi · oklar. Fotoğrafta: görünen fotoğraflar «1–3 / 12 fotoğraf» ve künye, sağda ‹ ›;
   3D'de: kullanım ipucu ve parça seçici. Böylece fotoğrafların ve modelin üstünde hiçbir düğme kalmaz */
function aracGuncelle() {
  const b = $('#arac-bilgi'); if (!b) return;
  const g = $('#galeri');
  if (durum.gorunum !== 'foto' || !g) { b.innerHTML = `${ic('move', 14)}<span>Sürükle: döndür · Tekerlek: yakınlaştır · Dokun: parça</span>`; return; }
  const sh = aktifSehir(), f = [...g.querySelectorAll('figure')], kunye = sh.envanter_adi || sh.foto_kunye || '';
  b.innerHTML = `<b>${f.length} fotoğraf</b><span>${kunye ? `· ${esc(kunye)}` : ''}</span>`;   // aralık («4–6 / 12») gereksiz bulundu: yalnız toplam ve künye
  const geri = $('#arac-geri'), ileri = $('#arac-ileri');
  if (geri) geri.disabled = g.scrollLeft < 4;
  if (ileri) ileri.disabled = g.scrollLeft + g.clientWidth > g.scrollWidth - 4;
}
function galeriYukseklik() {
  if (durum.masaustu) return;
  const g = $('#galeri'), a = $('#eser-alt'); if (!g || !a) return;
  g.style.height = Math.max(240, innerHeight - eaSinir()[0] - 72 - 28) + 'px';
}
function temsiliKonum() {
  const t = $('#temsili'), a = $('#eser-alt'); if (!t) return;
  if (durum.masaustu) { t.style.left = '36px'; t.style.top = ''; t.style.bottom = '24px'; }   // sol üst artık araç satırı: etiket sahnenin sol altında
  /* mobil: kartın o anki yüksekliği (açılıp kapandıkça «Temsili», parça adı ve «İçini göster» kartla birlikte kalkar/iner; eaYukseklik çağırır) */
  const kh = a ? (parseFloat(a.style.height) || eaSinir()[0]) : 260;
  if (!durum.masaustu) { t.style.left = '16px'; t.style.bottom = (kh + 22) + 'px'; }
  const p = $('#parca-ad'); if (p) p.style.bottom = durum.masaustu ? '24px' : (kh + 58) + 'px';
  const k = $('#kubbe-dugme'); if (k) { k.style.right = durum.masaustu ? '24px' : '16px'; if (durum.masaustu) { k.style.top = ''; k.style.bottom = '24px'; } else k.style.bottom = (kh + 16) + 'px'; }
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
  const u = new SpeechSynthesisUtterance(`${bilgi.baslik}. ${bilgi.metin}`); sesAyarla(u, sesDili(bilgi));
  pkSes = u; u.onend = u.onerror = () => { if (pkSes === u) pkSesDur(); };
  speechSynthesis.speak(u);
  const b = $('#pk-ses'); if (b) { b.innerHTML = ic('square', 18); b.setAttribute('aria-label', 'Sesi durdur'); b.setAttribute('aria-pressed', 'true'); }
}
function parcaKartAc(ad) {
  const e = parcaEser(); if (!e) return;
  const b = parcaBilgi(ad); if (!b) return;   // kartı olmayan parça kart açmaz (yalnız adı görünür)
  pkSesDur();
  const fl = (b.fotolar.length ? b.fotolar : [kapak(e)?.dosya]).map((d) => foto(e, d)).filter(Boolean);
  /* birden çok fotoğrafta: sağ/sol okları ve dokunulabilir noktalar (kaydırmayla da gezilir) */
  const coklu = fl.length > 1;
  const nokta = coklu ? `<div class="pk-nokta" role="group" aria-label="Fotoğraflar">${fl.map((_, i) => `<button type="button" data-pk-git="${i}" class="${i ? '' : 'on'}" aria-label="${i + 1}. fotoğraf"${i ? '' : ' aria-current="true"'}><i></i></button>`).join('')}</div>
    <button type="button" class="yuvarlak pk-ok sol" data-pk-adim="-1" aria-label="Önceki fotoğraf" disabled>${ic('chevron-left', 20)}</button><button type="button" class="yuvarlak pk-ok sag" data-pk-adim="1" aria-label="Sonraki fotoğraf">${ic('chevron-right', 20)}</button>` : '';
  let k = $('#parca-kart');
  if (!k) { k = document.createElement('div'); k.id = 'parca-kart'; k.className = 'parca-kart-arka'; document.body.appendChild(k); }
  k.innerHTML = `<section class="parca-kart" role="dialog" aria-modal="true" aria-labelledby="pk-baslik">
    <div class="pk-fotolar" id="pk-fotolar">${fl.map((f) => `<figure>${resim(f)}<figcaption>${esc(f.baslik)}</figcaption></figure>`).join('')}</div>${nokta}
    <button class="yuvarlak pk-kapat" data-pk-kapat aria-label="Kartı kapat">${ic('x', 18)}</button>
    <div class="pk-bas"><div><h2 id="pk-baslik">${esc(b.baslik)}</h2>${guven(b.guven, { alinti:b.metin, kaynak:b.kaynak })}</div><button class="yuvarlak pk-ses" id="pk-ses" data-pk-ses aria-pressed="false" aria-label="Sesli dinle">${ic('volume-2', 20)}</button></div>
    <div class="pk-metin" id="pk-metin"><p>${esc(b.metin)}</p>${b.kaynak ? `<div class="pk-kaynak">Kaynak: ${esc(b.kaynak)}</div>` : ''}<div class="pk-kunye">${esc(aktifSehir().foto_kunye || '')}</div></div>
  </section>`;
  k.hidden = false; k.dataset.ad = ad; k._bilgi = b;
  const sh = $('#pk-fotolar');
  sh.addEventListener('scroll', () => pkFotoDurum(k), { passive:true });
  requestAnimationFrame(() => k.classList.add('acik'));
}
const pkFotoSira = (sh) => Math.round(sh.scrollLeft / (sh.clientWidth || 1));
function pkFotoDurum(k) {   // etkin nokta ve okların açık/kapalı hâli kaydırma konumundan
  const sh = $('#pk-fotolar'); if (!sh) return; const i = pkFotoSira(sh), n = sh.children.length;
  $$('[data-pk-git]', k).forEach((b, j) => { b.classList.toggle('on', j === i); if (j === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
  const sol = k.querySelector('.pk-ok.sol'), sag = k.querySelector('.pk-ok.sag'); if (sol) sol.disabled = i <= 0; if (sag) sag.disabled = i >= n - 1;
}
function pkFotoGit(i) {
  const sh = $('#pk-fotolar'); if (!sh) return; const n = sh.children.length; i = Math.max(0, Math.min(n - 1, i));
  sh.scrollTo({ left:i * sh.clientWidth, behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
function parcaKartKapat(secimiBirak = true) {
  const k = $('#parca-kart'); pkSesDur(); if (!k || k.hidden) return;
  k.classList.remove('acik'); k.hidden = true; k.innerHTML = '';
  if (secimiBirak && s3d && s3d.secili.size) { s3d.secili.clear(); s3d.boya(); parcaGoster(null); }
}
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-pk-kapat]') || e.target.id === 'parca-kart') { parcaKartKapat(); return; }
  if (e.target.closest('[data-pk-ses]')) { const k = $('#parca-kart'); if (pkSes) pkSesDur(); else if (k && k._bilgi) pkSesBaslat(k._bilgi); }
  const git = e.target.closest('[data-pk-git]'); if (git) { pkFotoGit(+git.dataset.pkGit); return; }
  const adim = e.target.closest('[data-pk-adim]'); if (adim) { const sh = $('#pk-fotolar'); if (sh) pkFotoGit(pkFotoSira(sh) + +adim.dataset.pkAdim); }
});
/* kart açıkken klavyede ← → fotoğraflar arasında gezer */
document.addEventListener('keydown', (e) => {
  const k = $('#parca-kart'); if (!k || k.hidden || !$('#pk-fotolar') || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
  e.preventDefault(); pkFotoGit(pkFotoSira($('#pk-fotolar')) + (e.key === 'ArrowRight' ? 1 : -1));
});
/* mobil eser kartı sürükleme: tutamak ya da başlık parmağı izler, bırakılan yükseklikte kalır (en az: üst bölüm, en çok: içerik ya da ekranın %75'i);
   kenara 40 px'ten yakınsa oraya oturur. Tutamağa dokunmak kapalı ↔ tam açık */
function eaSinir() { const a = $('#eser-alt'), u = a && a.querySelector('.ea-ust'); if (!u) return [0, 0]; const cs = getComputedStyle(a), p = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom); const goz = a.querySelector('.ea-detay')?.children.length ? 44 : 0;   /* kapalıyken sonraki öğeden 44 px görünür (altı sisli) */ return [u.offsetHeight + p + goz, Math.min(innerHeight * 0.75, u.offsetHeight + a.querySelector('.ea-detay').scrollHeight + p)]; }
/* «Künye ve açıklama ⌃» ipucu: kartın yukarı çekilebildiğini gösterir; dokununca açar / küçültür (sürüklemeyle aynı sonuç) */
document.addEventListener('click', (ev) => { if (!ev.target.closest('[data-ea-ac]')) return; const a = $('#eser-alt'); if (!a) return; const [az, cok] = eaSinir(); eaYukseklik(a.classList.contains('acik') ? az : cok); });
/* kartın alt kenarındaki geçiş: içerik kartın içinden çıkıyormuş gibi kenara doğru silikleşir (beyaz örtü yok). --g = .ea-detay içinde kartın görünen alt sınırı */
function eaSis() {
  const a = $('#eser-alt'), d = a && a.querySelector('.ea-detay'); if (!d) return;
  const g = a.clientHeight + a.scrollTop - d.offsetTop - (parseFloat(getComputedStyle(a).paddingBottom) || 0);
  d.style.setProperty('--g', Math.round(g) + 'px');
}
let eaSisRaf = 0;
function eaSisIzle() { cancelAnimationFrame(eaSisRaf); const t0 = performance.now(); const ad = () => { eaSis(); if (performance.now() - t0 < 360) eaSisRaf = requestAnimationFrame(ad); }; ad(); }
document.addEventListener('scroll', (ev) => { if (ev.target && ev.target.id === 'eser-alt') eaSis(); }, true);
function eaYukseklik(h) {
  const a = $('#eser-alt'); if (!a) return; const [az, cok] = eaSinir();
  const v = h == null ? null : Math.max(az, Math.min(cok, h));
  a.style.height = v == null ? '' : v + 'px';
  temsiliKonum();
  const acik = v != null && v > az + 8; a.classList.toggle('acik', acik); a.classList.toggle('tam', v != null && v >= cok - 8); eaSisIzle();
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
    if (!(anlat.eser || ESER[durum.secili])?.glb) return;
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
  yerel('akar.mod', mod); durum.secili = id; rotaKaldir(); gorunumAyar(e);
  const n = e.hikaye.length;
  const ilerleme = `<div class="ilerleme" id="ilerleme">${e.hikaye.map((_, i) => `<button data-cumle="${i}" aria-label="Bölüm ${i + 1}"><i></i></button>`).join('')}</div>`;
  const ust = `<div class="anlat-ust">${durum.masaustu ? '' : `<button class="yuvarlak ust-kontrol gizlenir" data-git="#/eser/${id}" aria-label="Kapat">${ic('x', 18)}</button>`}<div style="display:flex;gap:8px">${seciciHTML(true)}<button class="yuvarlak ust-kontrol gizlenir koyu-zemin" id="doldur" aria-label="Ekranı doldur">${ic(durum.doldur ? 'shrink' : 'expand', 18)}</button></div></div>`;
  const liste = `<ol class="cumleler" id="cumleler">${e.hikaye.map((c, i) => `<li data-cumle="${i}"><span class="no">${i + 1}</span><div><p>${esc(c.metin)}</p>${guven(c.guven, { alinti:c.metin, kaynak:c.kaynak })}</div></li>`).join('')}</ol>`;
  const oynatici = `<div class="oynatici"><button class="sol" data-mod-degis>${durum.masaustu ? `<span class="sure" id="sure">0:00 / 0:00</span>` : (mod === 'dinle' ? 'Oku' : 'Dinle')}</button><div class="orta"><button class="kucuk" data-adim="-1" aria-label="Önceki">${ic('skip-back', 18)}</button><button class="oynat" id="oynat" aria-label="Oynat">${ic('play', 22)}</button><button class="kucuk" data-adim="1" aria-label="Sonraki">${ic('skip-forward', 18)}</button></div><button class="sag" id="hiz">1x</button></div>`;
  const sekme = `<div class="sekme-grup" role="tablist"><button role="tab" data-mod="dinle" aria-selected="${mod === 'dinle'}">${ic('headphones', 16)} Dinle</button><button role="tab" data-mod="oku" aria-selected="${mod === 'oku'}">${ic('book-open', 16)} Oku</button></div><span class="dil">${durum.dil === 'en' ? 'EN' : 'TR'}</span>`;   // anlatımın dili üstteki seçiciden
  if (durum.masaustu) {
    panel.innerHTML = `<div class="anlat-panel"><div class="bas"><button class="ikon-btn" style="width:36px;height:36px" data-git="#/eser/${id}" aria-label="Hikâyeden çık">${ic('x', 18)}</button>${sekme}</div>${liste}${oynatici}</div>`;
    gorusAc(`<div class="anlat-alan" id="anlat-alan"></div>${ilerleme}${ust}`, 'anlatim');
  } else {
    const kart = `<div class="hikaye-kart" id="hikaye-kart"><div class="tutamak" data-ac><i></i></div><div class="ust"><span class="sayac" id="sayac">1 / ${n}</span><span id="kart-guven"></span></div><p class="cumle" id="kart-cumle"></p><button type="button" class="kaynak-link" id="kart-kaynak" data-kaynak-simdi></button>${oynatici}</div>`;
    const sayfa = `<div class="cumle-sayfa" id="cumle-sayfa"><div class="tutamak" data-kapan><i></i></div><div class="bas">${sekme}</div>${liste}${oynatici}</div>`;
    gorusAc(`<div class="anlat-alan" id="anlat-alan"></div>${ilerleme}${ust}${kart}${sayfa}`, 'anlatim');
  }
  anlatAcikCiz(); anlatSahne(); cumleGit(anlat.i, false);
  const aktifLi = $$('#cumleler li')[anlat.i]; if (aktifLi) aktifLi.scrollIntoView({ block:'center' });
  setTimeout(okuGozlem, 400);
  if (mod === 'dinle') setTimeout(() => oynat(true), 300);
}
/* anlatımdaki fotoğraf kartı: sürüklenerek taşınır; dokununca vurgulanan parçanın kartı (yoksa fotoğraf büyük) açılır */
function k3Ac(k) {
  if (!k || !k._f) return;
  if (k._parca) { if (anlat.oynuyor) oynat(false); parcaKartAc(k._parca); return; }
  const b = document.createElement('button'); b.dataset.isik = k._f.url; b.dataset.kunye = [k._f.baslik, k._f.kaynak].filter(Boolean).join(' · ');
  b.innerHTML = resim(k._f); hkIsikAc(b);
}
function k3Surukle(k) {
  if (!k) return; let b = null;
  k.addEventListener('pointerdown', (e) => { if (e.button) return; b = { x:e.clientX, y:e.clientY, l:k.offsetLeft, t:k.offsetTop, id:e.pointerId, oyna:false }; });
  k.addEventListener('pointermove', (e) => {
    if (!b) return; const dx = e.clientX - b.x, dy = e.clientY - b.y;
    if (!b.oyna) { if (Math.hypot(dx, dy) < 6) return; b.oyna = true; k.setPointerCapture(b.id); k.classList.add('suruk'); k.style.width = k.offsetWidth + 'px'; }
    const p = k.offsetParent; if (!p) return;
    const l = Math.min(Math.max(8, b.l + dx), p.clientWidth - k.offsetWidth - 8), t = Math.min(Math.max(8, b.t + dy), p.clientHeight - k.offsetHeight - 8);
    Object.assign(k.style, { left:l + 'px', top:t + 'px', right:'auto', bottom:'auto' });
  });
  const bit = (e) => {
    if (!b) return; const oyna = b.oyna; b = null; k.classList.remove('suruk');
    if (oyna) { k.dataset.serbest = '1'; if (s3d) { s3d.boyut(); s3d.kirli = true; } }   // kart elle taşındı: model yeniden ortalanır
    else if (e.type === 'pointerup') k3Ac(k);
  };
  k.addEventListener('pointerup', bit); k.addEventListener('pointercancel', bit);
  k.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); k3Ac(k); } });
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
  if (koyu) alan.innerHTML = `<div class="foto-sahne${durum.doldur ? ' doldur' : ''}" id="foto-sahne"><img class="bulanik" alt=""><img class="ana" alt=""><div class="ust-golge"></div><div class="alt-bilgi"><span id="foto-guven"></span><span class="kunye">${esc(aktifSehir().foto_kunye)}</span></div></div>`;
  else {
    alan.innerHTML = `<div class="sahne3d" id="s3d">${yuklemeKart('Model gelince sahne kendiliğinden açılır.')}</div><div class="kart3d" id="kart3d" hidden></div><div class="parca-ad" id="parca-ad" style="bottom:16px" hidden></div>`;
    k3Surukle($('#kart3d'));
    /* fotoğraf kartı kenara yaslanır, model onun yanında kalır: mobilde kartın üstünde, masaüstünde sağında. Kart sürüklenip bırakılınca kadraj ortalanır */
    const k3 = () => { const k = $('#kart3d'); return k && !k.hidden && !k.dataset.serbest ? k : null; };
    s3dKur($('#s3d'), anlat.eser, { onParca:parcaSecildi,
      altBosluk:() => (durum.masaustu ? 0 : (!anlat.acik ? ($('#hikaye-kart')?.offsetHeight || 0) + 12 : 0) + (k3() ? k3().offsetHeight + 12 : 0)),
      solBosluk:() => (durum.masaustu && k3() ? k3().offsetWidth + 32 : 0) }, anlatSahne, () => sahneUygula(false));
  }
  $$('[data-gorunum]').forEach((b) => b.setAttribute('aria-checked', b.dataset.gorunum === durum.gorunum));
  sahneUygula(false);
}
function sahneUygula(gecis = true) {
  const e = anlat.eser, c = e && e.hikaye[anlat.i]; if (!c) return;
  akisUygula(c.akis || null);   // akar cümlesi: sahne yerine harita, gelir yolu
  if (durum.gorunum === 'foto') {
    const f = foto(e, c.foto), fs = $('#foto-sahne'); if (!fs || !f) return;
    const ana = $('.ana', fs);
    if (ana.dataset.url !== f.url) { ana.style.opacity = 0; const yeni = new Image(); yeni.onload = () => { ana.src = f.url; $('.bulanik', fs).src = f.url; ana.dataset.url = f.url; ana.alt = f.alt; ana.style.opacity = 1; }; yeni.src = f.url; }
    $('#foto-guven').innerHTML = guven(f.guven, { alinti:f.baslik, kaynak:f.kaynak });
  } else if (s3d && s3d.kok) {
    /* fotoğraf kartı: önce kart konur (yer kaplar), sonra kadraj ve kamera onun yanına göre hesaplanır */
    const k = $('#kart3d'), f = c.kart && foto(e, c.foto);
    if (f) {
      k.innerHTML = `${resim(f)}<div class="k3-yazi"><b>${esc(f.baslik)}</b><small>${esc(f.kisa)}</small></div><span class="k3-tutamak" aria-hidden="true"></span>`;
      k._f = f; k._parca = c.vurgu.find((a) => parcaBilgi(a)) || null;
      k.setAttribute('role', 'button'); k.tabIndex = 0; k.setAttribute('aria-label', `${f.baslik}: ${k._parca ? 'parça kartını aç' : 'fotoğrafı büyüt'}. Sürükleyerek taşınabilir.`);
      if (!durum.masaustu && !k.dataset.serbest) k.style.bottom = (!anlat.acik ? ($('#hikaye-kart')?.offsetHeight || 0) + 24 : 12) + 'px';
      k.hidden = false;
    } else k.hidden = true;
    s3d.boyut();
    s3d.kubbeler(!!c.ic, gecis);   // v2: iç mekân cümlelerinde kubbeler kalkar
    s3d.aci(c.aci, gecis); s3d.vurgula(c.vurgu);
    s3d.tur(!c.vurgu.length);   // belli bir parçası olmayan cümle (ör. «Ulucami'yi Yıldırım Bayezid yaptırdı»): yapı yavaşça döner
  }
}
/* ---------- Akar akışı (29 Ekim 2026; Figma D 1:2893 «Anlatım · Akar akışı», fikir: Kılıç Ali Paşa prototipi `flow`) ----------
   Hikâyede akar cümlesi gelince (ör. «Yıldırım Bayezid, Ulucami'ye gelir sağlamak için Bedesten'i yaptırdı») sahne kenara çekilir, altta haritanın kendisi
   görünür: kamera iki yapıyı birlikte kadraja alır (gelir veren solda, alan sağda), aralarına altın bir yay 2,2 sn'de çizilir, üstünden sikkeler akar,
   yayın ortasında kaynağın söylediği etiket durur. Cümle değişince harita eski kamerasına döner.
   Veri koddan değil içerikten: eserler/<eser>/icerik/hikaye.md → «## Akar akışı» tablosu (hazirla.py → cümlenin `akis` alanı).
   Hedef bir eser kimliği ya da «enlem, boylam» olabilir; hedef 3 km'den uzaksa (Koza Han → İstanbul) yay o yöne kısa çizilir, ucunda hedefin adı.
   Etikete yalnız kaynağın söylediği yazılır (envanterde «bakım, aydınlatma» gibi kalemler yok, uydurulmaz). Hareket azaltmada yay hemen tam, sikke yok. */
const AKIS_ALTIN = '#E9C75A', AKIS_KOYU = '#B8892A';
let akisSu = null;   // { anahtar, kamera, raf, t0 }
const akisAnahtar = (a) => a && [a.kaynak_eser, a.hedef_eser || a.hedef_nokta, anlat.eser?.id, anlat.i].join('|');
function akisYol(A, B) {   // A → B arasında sola (ekranda yukarı) kabaran yay; [lng, lat] noktaları
  const k = Math.cos(A[1] * Math.PI / 180), mx = 111320 * k, my = 110540;
  const bx = (B[0] - A[0]) * mx, by = (B[1] - A[1]) * my, L = Math.hypot(bx, by) || 1;
  const cx = bx / 2 - by / L * L * 0.42, cy = by / 2 + bx / L * L * 0.42;   // kontrol noktası: ortanın solunda
  const n = 64, yol = [];
  for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t, x = 2 * u * t * cx + t * t * bx, y = 2 * u * t * cy + t * t * by; yol.push([A[0] + x / mx, A[1] + y / my]); }
  return yol;
}
const akisNokta = (yol, t) => { const f = Math.min(yol.length - 1, Math.max(0, t * (yol.length - 1))), i = Math.floor(f), r = f - i, a = yol[i], b = yol[Math.min(i + 1, yol.length - 1)]; return [a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r]; };
function akisRenk(p) {   // çizilen kısım altın, geri kalanı saydam (line-progress)
  if (p >= 1) return ['interpolate', ['linear'], ['line-progress'], 0, AKIS_KOYU, 1, AKIS_ALTIN];
  const a = Math.max(0.0001, p * 0.98);
  return ['interpolate', ['linear'], ['line-progress'], 0, AKIS_KOYU, a, AKIS_ALTIN, a + 0.0001, 'rgba(233,199,90,0)', 1, 'rgba(233,199,90,0)'];
}
function akisKatmanlar() {
  if (harita.getSource('akis')) return;
  const bos = { type:'FeatureCollection', features:[] }, alt = harita.getLayer('pin') ? 'pin' : undefined;
  harita.addSource('akis', { type:'geojson', data:bos, lineMetrics:true });
  harita.addSource('akis-sikke', { type:'geojson', data:bos });
  harita.addSource('akis-etiket', { type:'geojson', data:bos });
  harita.addLayer({ id:'akis-isik', type:'line', source:'akis', layout:{ 'line-cap':'round', 'line-join':'round' }, paint:{ 'line-width':18, 'line-blur':9, 'line-opacity':0.55, 'line-gradient':akisRenk(0) } }, alt);
  harita.addLayer({ id:'akis-cizgi', type:'line', source:'akis', layout:{ 'line-cap':'round', 'line-join':'round' }, paint:{ 'line-width':6, 'line-gradient':akisRenk(0) } }, alt);
  harita.addLayer({ id:'akis-sikke', type:'circle', source:'akis-sikke', paint:{ 'circle-radius':6.5, 'circle-color':AKIS_ALTIN, 'circle-stroke-color':'#8A6A16', 'circle-stroke-width':1.5, 'circle-pitch-alignment':'viewport' } });
  if (harita.getStyle().glyphs) harita.addLayer({ id:'akis-etiket', type:'symbol', source:'akis-etiket', layout:{ 'text-field':['get', 'ad'], 'text-font':['Noto Sans Bold'], 'text-size':13, 'text-offset':[0, -1.4], 'text-allow-overlap':true, 'text-ignore-placement':true },
    paint:{ 'text-color':'#5C4508', 'text-halo-color':'#FFF8E1', 'text-halo-width':2.2 } });
}
function akisCiz(su) {   // her kare: yayın çizilen kısmı, sonra sikkeler
  if (akisSu !== su || !harita.getSource('akis')) return;
  const az = matchMedia('(prefers-reduced-motion: reduce)').matches, t = performance.now() - su.t0;
  const p = az ? 1 : Math.min(1, t / 2200), e = 1 - Math.pow(1 - p, 3);
  for (const l of ['akis-isik', 'akis-cizgi']) harita.setPaintProperty(l, 'line-gradient', akisRenk(e));
  harita.getSource('akis-sikke').setData({ type:'FeatureCollection', features:p < 1 || az ? [] : [0, 1, 2].map((i) => ({ type:'Feature', geometry:{ type:'Point', coordinates:akisNokta(su.yol, ((t - 2200) / 2600 + i / 3) % 1) }, properties:{} })) });
  if (harita.getLayer('akis-etiket') && p >= 1 && !su.etiketli) { su.etiketli = true; harita.getSource('akis-etiket').setData({ type:'FeatureCollection', features:su.etiketler }); }
  if (!az) su.raf = requestAnimationFrame(() => akisCiz(su));
}
function akisUygula(a) {
  const k = a && ESER[a.kaynak_eser], h = a && a.hedef_eser ? ESER[a.hedef_eser] : null;
  if (!k || (!h && !a.hedef_nokta)) return akisKapat();
  const anahtar = akisAnahtar(a); if (akisSu?.anahtar === anahtar) return;
  const onceki = akisSu?.kamera; akisKapat(true);
  const A = [k.lon, k.lat]; let B = h ? [h.lon, h.lat] : a.hedef_nokta;
  const [m, yon] = mesafeYon({ lng:A[0], lat:A[1] }, { lng:B[0], lat:B[1] }), uzak = m > 3000;
  if (uzak) { const r = 240 / 111320; B = [A[0] + r * Math.sin(yon * Math.PI / 180) / Math.cos(A[1] * Math.PI / 180), A[1] + r * Math.cos(yon * Math.PI / 180) * 111320 / 110540]; }
  const yol = akisYol(A, B);
  const etiketler = [{ type:'Feature', geometry:{ type:'Point', coordinates:akisNokta(yol, 0.5) }, properties:{ ad:a.etiket || '' } }];
  if (uzak || !h) etiketler.push({ type:'Feature', geometry:{ type:'Point', coordinates:B }, properties:{ ad:`${a.hedef_ad || ''} →` } });
  const su = akisSu = { anahtar, yol, etiketler, t0:0, kamera:onceki || { center:harita.getCenter(), zoom:harita.getZoom(), pitch:harita.getPitch(), bearing:harita.getBearing(), padding:harita.getPadding() } };
  gorus.classList.add('akis');
  if (harita.getLayer('pin')) harita.setFilter('pin', ['in', ['get', 'id'], ['literal', [k.id, h?.id].filter(Boolean)]]);   // yalnız iki yapının pini: etiketler karışmasın
  /* kart: ne nereye gidiyor, kaynağı ve güveni (etikete dokununca «Bu bilgi nereden geliyor?») */
  let kt = $('#akis-kart'); if (!kt) { kt = document.createElement('div'); kt.id = 'akis-kart'; kt.className = 'akis-kart'; gorus.appendChild(kt); }
  kt.innerHTML = `<span class="ak-ust">${ic('landmark', 14)}Vakıf düzeni · gelir yolu</span><b aria-label="${esc(k.ad)}, gelirini ${esc(h ? h.ad : a.hedef_ad)} için verir">${esc(k.ad)} → ${esc(h ? h.ad : a.hedef_ad)}</b>${a.hedef_ad && h && a.hedef_ad !== h.ad ? `<small>${esc(a.hedef_ad)}</small>` : ''}${guven(a.guven, { alinti:a.etiket ? `${k.ad} → ${a.hedef_ad || h?.ad}: ${a.etiket}` : '', kaynak:a.kaynak })}`;
  kt.hidden = false;
  /* kadraj: görünen alan (sahne alanı, mobilde alttaki hikâye kartının üstü); gelir veren solda, alan sağda */
  const hr = $('#harita').getBoundingClientRect(), al = $('#anlat-alan')?.getBoundingClientRect() || hr, kart = $('#hikaye-kart'), kr = kart && kart.offsetParent ? kart.getBoundingClientRect() : null;
  const alt = Math.min(al.bottom, kr ? kr.top : al.bottom), pay = durum.masaustu ? 72 : 36;
  const padding = { left:Math.max(0, al.left - hr.left) + pay, right:Math.max(0, hr.right - al.right) + pay, top:Math.max(0, al.top - hr.top) + (durum.masaustu ? 110 : 150), bottom:Math.max(0, hr.bottom - alt) + pay };
  const sinir = new maplibregl.LngLatBounds(A, A); yol.forEach((p) => sinir.extend(p));
  akisKatmanlar();
  harita.getSource('akis').setData({ type:'Feature', geometry:{ type:'LineString', coordinates:yol }, properties:{} });
  for (const l of ['akis-isik', 'akis-cizgi']) harita.setPaintProperty(l, 'line-gradient', akisRenk(0));
  harita.getSource('akis-sikke').setData({ type:'FeatureCollection', features:[] }); harita.getSource('akis-etiket')?.setData({ type:'FeatureCollection', features:[] });
  const az = matchMedia('(prefers-reduced-motion: reduce)').matches;
  harita.fitBounds(sinir, { padding, pitch:52, bearing:(yon - 90 + 360) % 360, maxZoom:18, duration:az ? 0 : 1400 });
  const basla = () => { if (akisSu !== su) return; su.t0 = performance.now(); akisCiz(su); };
  if (az) basla(); else harita.once('moveend', basla);
}
function akisKapat(gecis) {
  const su = akisSu; if (!su) return; akisSu = null;
  cancelAnimationFrame(su.raf);
  for (const l of ['akis-sikke', 'akis-etiket']) harita.getSource(l)?.setData({ type:'FeatureCollection', features:[] });
  harita.getSource('akis')?.setData({ type:'FeatureCollection', features:[] });
  if (gecis) return;   // bir akıştan ötekine: kamera ve görünüm yerinde kalır
  gorus.classList.remove('akis'); const kt = $('#akis-kart'); if (kt) kt.hidden = true; filtreUygula();
  const c = su.kamera; harita.easeTo({ center:c.center, zoom:c.zoom, pitch:c.pitch, bearing:c.bearing, padding:c.padding, duration:matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 800 });
}

function cumleGit(i, konus = true) {
  const e = anlat.eser; if (!e) return;
  const n = e.hikaye.length;
  if (i >= n) return hikayeBitti();
  anlat.i = Math.max(0, i); yerel('akar.ilerleme.' + e.id, String(anlat.i));
  const c = e.hikaye[anlat.i];
  $$('#ilerleme button i').forEach((b, k) => (b.style.width = k <= anlat.i ? '100%' : '0'));
  $$('#cumleler li').forEach((li, k) => li.classList.toggle('aktif', k === anlat.i));
  if ($('#kart-cumle')) { $('#sayac').textContent = `${anlat.i + 1} / ${n}`; $('#kart-cumle').textContent = c.metin; $('#kart-guven').innerHTML = guven(c.guven, { alinti:c.metin, kaynak:c.kaynak }); $('#kart-kaynak').textContent = `Kaynak: ${c.kaynak} ›`; }
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
    const u = new SpeechSynthesisUtterance(c.metin); sesAyarla(u, sesDili(c)); u.rate = anlat.hiz;
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
function anlatDur(sessiz) { akisKapat(); anlat.jeton++; clearTimeout(anlat.zaman); if ('speechSynthesis' in window) speechSynthesis.cancel(); anlat.oynuyor = false; if (!sessiz) anlat.eser = null; okuGozlemci && okuGozlemci.disconnect(); }
function modSekme() { $$('[data-mod]').forEach((b) => b.setAttribute('aria-selected', b.dataset.mod === anlat.mod)); $$('[data-mod-degis]').forEach((b) => { if (!durum.masaustu) b.textContent = anlat.mod === 'dinle' ? 'Oku' : 'Dinle'; }); yerel('akar.mod', anlat.mod); }
function gizleBaslat() {
  clearTimeout(gizleZ); gorus.classList.remove('gizle');
  if (anlat.oynuyor && durum.gorunum === 'foto') gizleZ = setTimeout(() => { if (anlat.eser && /^#\/anlat\//.test(location.hash)) gorus.classList.add('gizle'); }, 3000);   // 29 Ekim: anlatımdan çıkınca bekleyen zamanlayıcı eser detayını gizlemesin
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

/* 29 Ekim 2026 (kullanıcı kararı): hikâye bitince ayrı «hikâye sonrası» sayfası yerine eser detayına dönülür ve üstünde
   tebrik kartı açılır: kazanılan rozet, eserin bütün rozetleri (kazanılmayanlar soluk, koşuluyla) ve bir sonraki rozete giden yol.
   Puan yok; ödül rozettir. Kart kapanınca normal eser paneli; Dinle düğmesinde ✓ işareti hikâyenin bittiğini gösterir. */
function hikayeBitti() {
  const e = anlat.eser; anlatDur(); yerel('akar.ilerleme.' + e.id, '0'); yerel('akar.bitti.' + e.id, '1');
  const yeni = rozetKontrol(e, true);
  harita.getSource('eserler')?.setData(eserNoktalari());
  const r = JSON.parse(yerel('akar.rota') || 'null'), i = ROTA.duraklar.indexOf(e.id);
  if (r && i >= 0) yerel('akar.rota', JSON.stringify({ i:Math.min(i + 1, ROTA.duraklar.length - 1) }));
  durum.tebrik = { id:e.id, yeni };
  location.hash = '#/eser/' + e.id;
}
function tebrikGoster() {
  const t = durum.tebrik; durum.tebrik = null; if (!t) return;
  const e = ESER[t.id]; if (!e) return;
  const rozetler = e.rozetler || [], kazanilan = rozetler.filter(rozetVar).length;
  const ana = t.yeni[0];   // hikâye rozeti (varsa)
  const sd = sonrakiDurak(e), gorevKalan = (e.gorevler || []).filter((g) => !gorevDurum(g)).length;
  const rozetSira = rozetler.map((r) => { const v = rozetVar(r); return `<li class="${v ? '' : 'yok'}${t.yeni.includes(r) ? ' yeni' : ''}">${rozetIkon(v, 44)}<b>${esc(r.ad)}</b><small>${v ? (t.yeni.includes(r) ? 'Şimdi kazandın' : 'Kazanıldı') : esc(kosulMetni({ ...r, eser:e }))}</small></li>`; }).join('');
  const dugmeler = [
    gorevKalan ? `<button class="btn ana tam" data-tebrik-git="#/gorev/${e.id}">${ic('puzzle', 18)}Bulmacayı çöz · ${gorevKalan} rozet daha</button>` : '',
    sd ? `<button class="btn ${gorevKalan ? 'cerceve' : 'ana'} tam" data-tebrik-git="#/eser/${sd.id}" data-rotada>Sonraki durak: ${esc(sd.ad)} ${ic('arrow-right', 16)}</button>` : '',
    `<button class="btn ${gorevKalan || sd ? 'ikincil' : 'ana'} tam" data-tebrik-kapat>Devam et</button>`,
  ].join('');
  let k = $('#tebrik');
  if (!k) { k = document.createElement('div'); k.id = 'tebrik'; k.className = 'tebrik-arka'; document.body.appendChild(k); }
  k.innerHTML = `<section class="tebrik" role="dialog" aria-modal="true" aria-labelledby="tb-baslik">
    <button class="yuvarlak tb-kapat" data-tebrik-kapat aria-label="Kapat">${ic('x', 18)}</button>
    <div class="tb-sahne desenli-zemin"><div class="tb-isin" aria-hidden="true"></div><div class="tb-rozet">${rozetIkon(true, 88)}</div></div>
    <span class="sayac">${ic('check', 14)} Hikâye tamamlandı · ${e.hikaye.length} / ${e.hikaye.length} bölüm</span>
    <h2 id="tb-baslik" class="tb-baslik">${ana ? `Rozet kazandın: ${esc(ana.ad)}` : `${esc(ilgi(e.ad))} hikâyesini bitirdin`}</h2>
    <p class="tb-metin soluk">${esc(ana ? ana.metin : 'Hikâyeyi sonuna kadar dinledin ya da okudun.')}</p>
    ${rozetler.length ? `<div class="tb-rozetler"><div class="tb-rozet-bas"><b>${esc(ilgi(e.ad))} rozetleri</b><span class="sayac">${kazanilan} / ${rozetler.length}</span></div><ul>${rozetSira}</ul></div>` : ''}
    ${DETAY.has('kopru') && e.hakkinda?.length ? `<button class="tb-kopru" data-tebrik-git="#/hakkinda/${e.id}"><small>Devamını merak ettin mi?</small><b>Eser hakkında</b><span>Tamamı · envanterden · ${hkToplamDk(e)} dk</span><i aria-hidden="true">${ic('chevron-right', 18)}</i></button>` : ''}
    <div class="tb-dugmeler">${dugmeler}</div>
    <button class="metin-btn tb-profil" data-tebrik-git="#/profil">Bütün rozetlerime bak ›</button>
    ${yerel('akar.giris') ? '' : '<p class="tb-giris">Rozetlerini kaybetme · <button class="metin-btn" data-giris>Giriş yap</button></p>'}
  </section>`;
  k.hidden = false; requestAnimationFrame(() => k.classList.add('acik'));
  setTimeout(() => k.querySelector('.tb-dugmeler .btn')?.focus({ preventScroll:true }), 300);
}
function tebrikKapat() { const k = $('#tebrik'); if (!k || k.hidden) return; k.classList.remove('acik'); setTimeout(() => { k.hidden = true; k.innerHTML = ''; }, 200); }
document.addEventListener('click', (e) => {
  const g = e.target.closest('[data-tebrik-git]'); if (g) { if (g.hasAttribute('data-rotada')) durum.rotada = true; tebrikKapat(); location.hash = g.dataset.tebrikGit; return; }
  if (e.target.closest('[data-giris]')) { toast('Giriş bu prototipte yok · rozetlerin bu cihazda saklanıyor'); return; }   // üründe: giriş/kayıt, cihazdaki rozetler hesaba taşınır
  if (e.target.closest('[data-tebrik-kapat]') || e.target.id === 'tebrik') tebrikKapat();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#tebrik') && !$('#tebrik').hidden) { e.stopImmediatePropagation(); tebrikKapat(); } }, true);
function hikayeSonrasi(id) {
  const e = ESER[id]; durum.secili = id; rotaKaldir(); gorunumAyar(e); const sd = sonrakiDurak(e);
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
/* «Eser hakkında» · okuma düzeni (28 Ekim 2026). Envanter metninin tamamı kelimesine dokunulmadan durur; üstüne kitaptan seçmelerle bir okuma katmanı gelir
   (eserler/<eser>/icerik/eser-hakkinda-okuma.md → hazirla.py `okuma_oku`, her seçme kitap metninde birebir denetlenir):
   kapak (fotoğraf, ad, okuma süresi) → üstte yapışık bölüm sekmeleri + okuma çubuğu → her bölüm: bölüm kapağı, «Kitaptan» özet cümleleri, rakam kartları
   (altında kitaptaki ifade), büyük alıntı, zaman çizelgesi, «Derinine in» ile tam metin (kitabe/ayet kartları, kaydırmalı fotoğraf şeridi, terimlere dokununca
   kitaptaki tanım) → kaynaklar ve sonraki adımlar. Özeti olmayan bölümde tam metin doğrudan görünür.
   Masaüstü: solda metin, sağda yapışık 3D model; okunan bölüme göre döner, ilgili parçalar parlar (3D'siz eserde bölümün fotoğrafı). Öğeler ekrana girince
   yumuşakça belirir (hareket azaltma tercihinde belirmez, hemen görünür). */
const hkKitaplar = (e) => {   // paragraf kaynaklarından kitap listesi: «Envanter Cilt 1 · s. 19» → [1] <envanter adı>, Cilt 1 (<yayıncı>)
  const k = new Set();
  e.hakkinda.forEach((b) => b.paragraflar.forEach((p) => (p.kaynak.match(/Cilt \d/g) || []).forEach((c) => k.add(c))));
  const sh = ilSehir(e);
  return [...k].sort().map((c) => `${sh.envanter_adi || 'Envanter'}, ${c}${sh.envanter_yayinci ? ` (${sh.envanter_yayinci})` : ''}`);
};
const hkKelime = (b) => b.paragraflar.reduce((n, p) => n + p.metin.split(/\s+/).length, 0);
const hkDakika = (kelime) => Math.max(1, Math.round(kelime / 200));   // ortalama okuma hızı ~200 kelime/dk
const hkSayfalar = (b) => {   // «s. 19–23»
  const s = b.paragraflar.flatMap((p) => [...p.kaynak.matchAll(/s\. ?(\d+)/g)].map((m) => +m[1]));
  if (!s.length) return '';
  const a = Math.min(...s), z = Math.max(...s);
  return a === z ? `s. ${a}` : `s. ${a}–${z}`;
};
const hk = { e:null, isik:null, gozcu:[] };
/* küçük altın süs (SUSLEME'nin motifi, kısa çizgilerle): kapakta başlık altı ve alıntı üstü; altın yalnız süs, yazıda kullanılmaz */
const HK_ALTIN = '<span class="hk-altin" aria-hidden="true"><svg viewBox="0 0 28 12"><path d="M14 1 18 6 14 11 10 6Z M2 6h7 M19 6h7" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="14" cy="6" r="1.4" fill="currentColor"/></svg></span>';
function hkTerimli(metin) {   // metindeki terimler dokunulabilir; tanım kitaptan
  let h = esc(metin);
  (hk.e.terimler || []).forEach((t, i) => { h = h.split(esc(t.kelime)).join(`<button class="hk-terim" data-terim="${i}" aria-haspopup="dialog">${esc(t.kelime)}</button>`); });
  return h;
}
function hkSerit(fl, kapakUrl) {   // bir yerdeki kitap fotoğrafları: yana kaydırılan şerit, kitaptaki oranıyla; dokununca büyür
  fl = (fl || []).filter((f) => f.url !== kapakUrl);
  if (!fl.length) return '';
  const kunyeler = [...new Set(fl.map((f) => f.kunye))];
  /* birden çok fotoğrafta kaydırılabildiği belli olsun: devamı olan kenar solar, «1 / 4» sayacı, masaüstünde ‹ › okları */
  const cok = fl.length > 1;
  return `<div class="hk-serit-kap hk-gir"><div class="hk-serit-ic">${cok ? `<button class="hk-serit-ok sol" data-hk-serit-kay="-1" aria-label="Önceki fotoğraf" hidden>${ic('chevron-left', 22)}</button>` : ''}<div class="hk-serit" role="list">${fl.map((f) => `<button class="hk-serit-f" role="listitem" style="--oran:${f.oran}" data-isik="${esc(f.url)}" data-kunye="${esc(f.kunye)}" aria-label="Fotoğrafı büyüt: ${esc(f.alt)}"><img src="${esc(f.url)}" alt="${esc(f.alt)}" loading="lazy" decoding="async">${BUYUT()}</button>`).join('')}</div>${cok ? `<button class="hk-serit-ok sag" data-hk-serit-kay="1" aria-label="Sonraki fotoğraf">${ic('chevron-right', 22)}</button><span class="hk-serit-sayac" aria-hidden="true">1 / ${fl.length}</span>` : ''}</div>
    <p class="hk-kunye">${fl.length > 1 ? `${fl.length} fotoğraf · ` : ''}${esc(kunyeler.join(' · '))}</p></div>`;
}
function hkTamMetin(b, baskin, kapakUrl, ozet = []) {   // envanter metni kitap sırasıyla; tırnakla başlayan paragraf (kitabe, ayet, beyit) kart olur, «Mealen:» ile başlayan paragraf önceki karta eklenir
  let h = hkSerit(b.fotolar, kapakUrl), kart = null;
  const kartKapat = () => { if (kart) { h += `<blockquote class="hk-kitabe hk-gir">${kart}</blockquote>`; kart = null; } };
  const meal = (m) => `<p class="hk-k-meal"><span>Mealen:</span> ${esc(m.replace(/^Mealen:\s*/, ''))}</p>`;   // kitaptaki gibi: «Mealen:» düz, anlamı italik
  const kitabe = (m) => { const i = m.indexOf('Mealen:'); return i > 0 ? `<p class="hk-k-ozgun">${esc(m.slice(0, i).trim())}</p>${meal(m.slice(i))}` : `<p class="hk-k-ozgun">${esc(m)}</p>`; };
  b.paragraflar.forEach((p) => {
    const m = p.metin.trim();
    if (kart && m.startsWith('Mealen:')) kart += meal(m);
    else if (m.startsWith('“')) { kartKapat(); kart = kitabe(m); }
    else { kartKapat(); const oz = ozet.some((c) => c.trim() && m.includes(c.trim()));   // «Kitaptan» özetindeki cümleyi taşıyan paragraf: kapalı önizlemede gizli (aynı cümle iki kez okunmasın), açınca yerinde
      h += `<p class="hk-p${oz ? ' hk-ozette' : ''}">${hkTerimli(m)}</p>`; }
    if (p.guven !== baskin) { kartKapat(); h += `<div class="hk-p-guven">${guven(p.guven, { alinti:p.metin, kaynak:p.kaynak })}</div>`; }
    if (p.fotolar) { kartKapat(); h += hkSerit(p.fotolar, kapakUrl); }
  });
  kartKapat();
  return h;
}
function hkBolum(b, i) {
  const say = {}; b.paragraflar.forEach((p) => (say[p.guven] = (say[p.guven] || 0) + 1));
  const baskin = Object.entries(say).sort((x, y) => y[1] - x[1])[0][0];
  const kaynaklar = [...new Set(b.paragraflar.map((p) => p.kaynak))];
  const o = b.okuma || {}, ozet = o.ozet || [];
  const kapakF = (b.fotolar || [])[0] || b.paragraflar.find((p) => p.fotolar)?.fotolar[0];
  const no = String(i + 1).padStart(2, '0'), dk = hkDakika(hkKelime(b));
  /* başlık fotoğraftan önce: bölüm yarım bir fotoğraf şeridiyle başlamasın, okur önce nerede olduğunu görsün */
  const bas = `<header class="hk-bkapak hk-gir"><div class="hk-bkapak-yazi"><h2 class="hk-h2" id="hk-b${i}"><span class="hk-no">${no}</span>${esc(b.baslik)}</h2><small>${dk} dk okuma · ${b.paragraflar.length} paragraf${hkSayfalar(b) ? ` · Envanter ${hkSayfalar(b)}` : ''}</small>${'speechSynthesis' in window ? `<button class="hk-b-dinle" data-hk-dinle="${i}" aria-label="${esc(b.baslik)} bölümünü dinle, ${dk} dakika">${ic('play', 14)}Dinle · ${dk} dk</button>` : ''}</div>
    ${kapakF ? `<button class="hk-bkapak-f" style="--oran:${+kapakF.oran || 1.5}" data-isik="${esc(kapakF.url)}" data-kunye="${esc(kapakF.kunye)}" aria-label="Fotoğrafı büyüt"><img src="${esc(kapakF.url)}" alt="${esc(kapakF.alt)}" loading="lazy" decoding="async">${BUYUT()}</button>` : ''}</header>`;
  const ozetH = ozet.length ? `<div class="hk-ozet hk-gir"><span class="hk-etiket">Kitaptan</span><p>${ozet.map(esc).join(' ')}</p></div>` : '';
  const rakamH = o.rakam?.length ? `<div class="hk-rakamlar">${o.rakam.map((r) => `<div class="hk-rakam hk-gir"><b>${esc(r.deger)}</b><span>${esc(r.etiket)}</span><small>«${esc(r.kanit)}»</small></div>`).join('')}</div>` : '';
  const alintiH = (o.alinti || []).map((a) => `<blockquote class="hk-alinti hk-gir"><p>${esc(a.metin)}</p>${a.kim ? `<cite>${esc(a.kim)}</cite>` : ''}</blockquote>`).join('');
  const zamanH = o.zaman?.length ? `<ol class="hk-zaman">${o.zaman.map((z) => `<li class="hk-gir"><b>${esc(z.yil)}</b><span>«${esc(z.kanit)}»</span></li>`).join('')}</ol>` : '';
  const tam = hkTamMetin(b, baskin, kapakF?.url, ozet);
  /* «devamını oku»: tam metnin ilk satırları solarak görünür, altında tam genişlikte düğme; kapalıyken gizli kısım odak almaz (inert) */
  const govde = ozet.length
    ? `<div class="hk-derin"><div class="hk-derin-ic" id="hk-t${i}" inert>${tam}</div>
      <button class="hk-derin-dugme" data-hk-derin="${i}" aria-expanded="false" aria-controls="hk-t${i}"><span>Tam metni oku</span><small>${b.paragraflar.length} paragraf · ${dk} dk</small>${ic('chevron-down', 20)}</button></div>`
    : `<div class="hk-derin-ic">${tam}</div>`;
  return `<section class="hk-bolum" data-hk-bolum="${i}" aria-labelledby="hk-b${i}">${bas}${ozetH}${rakamH}${alintiH}${zamanH}${govde}
    <div class="hk-alt">${guven(baskin)}<button class="hk-kaynak-ac" data-hk-kaynak="${i}" aria-expanded="false" aria-controls="hk-k${i}">Kaynaklar (${kaynaklar.length}) ›</button></div>
    <ul class="hk-kaynak-liste" id="hk-k${i}" hidden>${kaynaklar.map((k) => `<li>${esc(k)}</li>`).join('')}</ul></section>`;
}
/* ---------- Eser hakkında sesli okuma (29 Ekim 2026)
   Giriş: kapakta «Dinle · n dk» (baştan) ve her bölüm başlığında «Dinle · n dk» (o bölümden). Bölüm bitince sıradakine geçer.
   Okunan paragraf vurgulanır, sayfa onu izler; kullanıcı elle kaydırırsa izleme durur, oynatıcıda «Okunan yere dön» çıkar.
   Kitabe/ayet aslı (hk-k-ozgun) okunmaz, yalnız «Mealen» kısmı okunur (Türkçe ses Arapça/Osmanlıca metni bozar).
   Oynatıcı: mobilde altta yüzen çubuk, masaüstünde sekme çubuğunun sağ ucu. Ses: tarayıcı sesi (speechSynthesis); eser için
   hazır ses dosyası eklenirse aynı oynatıcıdan çalınabilir (henüz yok). */
const hkSes = { bolum:0, i:0, oynuyor:false, hiz:1, jeton:0, izle:true };
const HK_HIZ = [1, 1.25, 1.5];
const hkSesParcalar = (b) => [...document.querySelectorAll(`.hk-bolum[data-hk-bolum="${b}"] .hk-derin-ic :is(.hk-p, .hk-k-meal)`)];
function hkSesBaslat(bolum) {
  if (!hk.e || !('speechSynthesis' in window)) return;
  pkSesDur?.(); speechSynthesis.cancel();
  Object.assign(hkSes, { bolum, i:0, oynuyor:true, izle:true }); hkSes.jeton++;
  hkOynaticiCiz(); hkSesCal();
}
function hkSesCal() {
  const b = hk.e.hakkinda[hkSes.bolum]; if (!b) return hkSesDur();
  const kap = document.querySelector(`.hk-bolum[data-hk-bolum="${hkSes.bolum}"] .hk-derin-dugme[aria-expanded="false"]`); if (kap) kap.click();   // kapalı tam metni aç: okunan yer görünsün
  const el = hkSesParcalar(hkSes.bolum);
  if (hkSes.i >= el.length) { if (hkSes.bolum + 1 < hk.e.hakkinda.length) { hkSes.bolum++; hkSes.i = 0; return hkSesCal(); } return hkSesDur(); }
  const p = el[hkSes.i], jeton = ++hkSes.jeton;
  $$('.hk-okunan').forEach((x) => x.classList.remove('hk-okunan')); p.classList.add('hk-okunan');
  if (hkSes.izle) p.scrollIntoView({ block:'center', behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  hkOynaticiGuncelle();
  if (!hkSes.oynuyor) return;
  speechSynthesis.cancel();
  const metin = (hkSes.i === 0 ? `${b.baslik}. ` : '') + p.textContent.replace(/^\s*Mealen:\s*/, 'Mealen: ').trim();
  const u = new SpeechSynthesisUtterance(metin); sesAyarla(u, 'tr'); u.rate = hkSes.hiz;
  u.onend = () => { if (jeton !== hkSes.jeton || !hkSes.oynuyor) return; hkSes.i++; hkSesCal(); };
  speechSynthesis.speak(u);
}
function hkSesDur() {
  hkSes.oynuyor = false; hkSes.jeton++; if ('speechSynthesis' in window) speechSynthesis.cancel();
  $$('.hk-okunan').forEach((x) => x.classList.remove('hk-okunan')); $('#hk-oyn')?.remove(); document.body.classList.remove('hk-dinleniyor');
}
function hkOynaticiCiz() {
  $('#hk-oyn')?.remove();
  const el = document.createElement('div'); el.id = 'hk-oyn'; el.className = 'hk-oyn'; el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Sesli okuma');
  el.innerHTML = `<div class="hko-bilgi"><b id="hko-bas"></b><small id="hko-alt"></small></div>
    <button class="hko-don" data-hko="don" hidden>${ic('chevron-down', 14)}Okunan yere dön</button>
    <div class="hko-dugmeler hko-orta"><button data-hko="geri" aria-label="Önceki paragraf">${ic('skip-back', 18)}</button><button class="hko-ana" data-hko="oynat" aria-label="Durdur">${ic('pause', 20)}</button><button data-hko="ileri" aria-label="Sonraki paragraf">${ic('skip-forward', 18)}</button></div>
    <div class="hko-dugmeler hko-sag"><button class="hko-hiz" data-hko="hiz" aria-label="Okuma hızı">1×</button><button data-hko="kapat" aria-label="Sesli okumayı kapat">${ic('x', 16)}</button></div>
    <i class="hko-cizgi" aria-hidden="true"><i id="hko-dolu"></i></i>`;
  /* mobilde ekranın altında yüzer; masaüstünde metin sütununun sonuna eklenir ve sütunun altına yapışır (aynı çubuk, sütun genişliğinde) */
  const sutun = durum.masaustu && document.querySelector('.hk-sol');
  (sutun || document.body).appendChild(el); document.body.classList.add('hk-dinleniyor');
}
function hkOynaticiGuncelle() {
  const b = hk.e?.hakkinda[hkSes.bolum]; if (!b || !$('#hk-oyn')) return;
  const n = hkSesParcalar(hkSes.bolum).length || 1;
  $('#hko-bas').textContent = `${String(hkSes.bolum + 1).padStart(2, '0')} · ${b.baslik}`;
  $('#hko-alt').textContent = `${Math.min(hkSes.i + 1, n)} / ${n} paragraf`;
  $('#hko-dolu').style.width = `${Math.round(100 * Math.min(hkSes.i + 1, n) / n)}%`;
  const o = $('[data-hko="oynat"]'); o.innerHTML = ic(hkSes.oynuyor ? 'pause' : 'play', 20); o.setAttribute('aria-label', hkSes.oynuyor ? 'Durdur' : 'Devam et');
  $('[data-hko="hiz"]').textContent = String(hkSes.hiz).replace('.', ',') + '×';
  $('[data-hko="don"]').hidden = hkSes.izle;
}
document.addEventListener('click', (ev) => {
  const d = ev.target.closest('[data-hk-dinle]'); if (d) { hkSesBaslat(+d.dataset.hkDinle); return; }
  const k = ev.target.closest('[data-hko]'); if (!k) return;
  const ne = k.dataset.hko, n = hkSesParcalar(hkSes.bolum).length;
  if (ne === 'kapat') return hkSesDur();
  if (ne === 'oynat') { hkSes.oynuyor = !hkSes.oynuyor; hkSes.jeton++; if (!hkSes.oynuyor) { speechSynthesis.cancel(); hkOynaticiGuncelle(); } else hkSesCal(); return; }
  if (ne === 'hiz') { hkSes.hiz = HK_HIZ[(HK_HIZ.indexOf(hkSes.hiz) + 1) % HK_HIZ.length]; hkSesCal(); return; }   // yeni hız paragrafın başından
  if (ne === 'don') { hkSes.izle = true; $('.hk-okunan')?.scrollIntoView({ block:'center', behavior:'smooth' }); hkOynaticiGuncelle(); return; }
  if (ne === 'geri') { if (hkSes.i > 0) hkSes.i--; else if (hkSes.bolum > 0) { hkSes.bolum--; hkSes.i = Math.max(0, hkSesParcalar(hkSes.bolum).length - 1); } hkSes.izle = true; hkSesCal(); return; }
  if (ne === 'ileri') { hkSes.i = Math.min(hkSes.i + 1, n); hkSes.izle = true; hkSesCal(); }
});
/* kullanıcı kendisi kaydırınca (tekerlek, dokunma, klavye) izleme durur; programın kaydırması saymaz */
['wheel', 'touchmove', 'keydown'].forEach((t) => addEventListener(t, (ev) => {
  if (!document.body.classList.contains('hk-dinleniyor') || !hkSes.izle || ev.target.closest?.('#hk-oyn')) return;
  if (t === 'keydown' && !['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(ev.key)) return;
  hkSes.izle = false; hkOynaticiGuncelle();
}, { passive:true }));
addEventListener('hashchange', () => { if (!location.hash.startsWith('#/hakkinda/')) hkSesDur(); });
function hakkinda(id) {
  hkSesDur();
  const e = ESER[id]; if (!e) return (location.hash = '#/');
  durum.secili = id; rotaKaldir(); hk.e = e; yoreUygula(e);
  const toplamDk = hkDakika(e.hakkinda.reduce((n, b) => n + hkKelime(b), 0));
  /* kapak fotoğrafı veriden (eser.json → hakkinda_kapak: envanterde eser kaydının açılış fotoğrafı); yoksa galerinin ilki */
  const kapakF = (e.hakkinda_kapak && e.fotolar.find((f) => f.dosya === e.hakkinda_kapak)) || kapak(e);
  const meta2 = [e.yil, e.yaptiran, e.tur].filter(Boolean).map(esc).join(' · ');
  const sekmeler = e.hakkinda.map((b, i) => `<button class="hk-sekme" data-hk-git="${i}" aria-current="${i === 0}">${esc(b.baslik)}</button>`).join('');
  /* geri düğmesi: mobilde hep, masaüstünde kapak ekrandan çıkınca (kapakta kendi düğmesi var). Sekme şeridi taşıyorsa kenar solar, masaüstünde ‹ › okları çıkar */
  const nav = `<nav class="hk-nav" aria-label="Bölümler"><button class="yuvarlak hk-nav-geri" data-git="#/eser/${id}" aria-label="Geri: ${esc(e.ad)}">${ic('chevron-left', 20)}<span>${esc(e.ad)}</span></button><div class="hk-sekme-kap"><button class="hk-sekme-ok sol" data-hk-kay="-1" aria-label="Önceki bölümler" hidden>${ic('chevron-left', 18)}</button><div class="hk-sekmeler">${sekmeler}</div><button class="hk-sekme-ok sag" data-hk-kay="1" aria-label="Sonraki bölümler" hidden>${ic('chevron-right', 18)}</button></div><div class="hk-ilerleme" aria-hidden="true"><i></i></div></nav>`;
  /* kapak, envanterdeki eser açılışı gibi: büyük fotoğraf + şehir renginde panel (aralıklı büyük harfle ilçe, serif eser adı, büyük harfle künye) */
  const km = ilKimlik(e), kmStil = km ? ` style="--sehir-aksan:${esc(km.zemin)};--sehir-acik:${esc(km.desen_renk || '')}${km.desen ? `;--hk-desen:url('desenler/${esc(km.desen)}')` : ''}"` : '';   // eserin ilinin rengi ve deseni veriden
  /* geri düğmesi kapağın sol üst köşesinde, fotoğrafın üstünde (sayfanın okuma yönü sol üstten başlar; mobilde geri yapışık sekme çubuğunda) */
  const kapakH = `<header class="hk-kapak"${kmStil}>${durum.masaustu ? `<button class="hk-geri" data-git="#/eser/${id}">${ic('chevron-left', 18)}${esc(e.ad)}</button>` : ''}${kapakF ? `<div class="hk-kapak-f">${resim(kapakF)}</div>` : ''}<div class="hk-kapak-panel${km?.desen ? ' desenli' : ''}">
      ${e.ilce ? `<span class="hk-ilce">${esc(e.ilce)}</span>` : ''}<h1 class="hk-h1">${esc(e.uzun_ad || e.ad)}</h1>${HK_ALTIN}<p class="hk-kunye-ust">${meta2}</p>
      <p class="hk-kapak-meta">Eser hakkında · ${toplamDk} dk okuma · ${e.hakkinda.length} bölüm<br>${esc(ilSehir(e).envanter_adi || 'Envanter')}</p>
      ${'speechSynthesis' in window ? `<button class="hk-dinle" data-hk-dinle="0">${ic('headphones', 18)}Dinle · ${toplamDk} dk</button>` : ''}</div></header>`;
  const kitaplar = hkKitaplar(e).map((k, i) => `<li>[${i + 1}] ${esc(k)}</li>`).join('');
  const son = `<section class="hk-son hk-gir">${SUSLEME}<h2 class="hk-h2">Okudun. Şimdi ne yapalım?</h2><div class="hk-son-dugmeler">
      ${e.hikaye.length ? `<button class="btn ana" data-git="#/anlat/${id}/dinle">${ic('headphones')}Hikâyeyi dinle</button>` : ''}
      <button class="btn ikincil" data-git="#/gecmis/${id}">${ic('history')}Geçmişi Gör${e.gecmis.length ? ` · ${e.gecmis.length}` : ''}</button>
      ${e.gorevler?.length ? `<button class="btn ikincil" data-git="#/gorev/${id}">${ic('puzzle')}Bulmaca · ${e.gorevler.length} görev</button>` : ''}</div>
      <h3 class="hk-h3">Kaynaklar</h3><ul class="hk-kitap">${kitaplar}</ul><p class="hk-not">Metin, envanterin kendi metnidir; bölüm başlıkları, «Kitaptan» özetleri, rakam kartları ve alıntılar okumayı kolaylaştırmak için kitaptan seçilmiştir, kelimesi değiştirilmemiştir.</p></section>`;
  const bolumler = e.hakkinda.map(hkBolum).join(SUSLEME);   // süsleme çizgisi: tokens.css'e göre «Eser hakkında bölüm araları»nda kullanılır
  if (durum.masaustu) {
    document.body.classList.add('tam-sayfa');
    const ucd = e.glb && e.hakkinda.some((b) => b.okuma?.ucd);
    gorusAc(`<div class="hk hk-d" id="hk-kaydir">${kapakH}${nav}<div class="hk-izgara"><article class="hk-sol">${bolumler}${son}</article>
      <aside class="hk-sag" aria-label="${ucd ? '3D model: okunan bölüm' : 'Bölümün fotoğrafı'}"><div class="hk-sahne${ucd ? ' uc' : ''}">${ucd ? `<div class="sahne3d" id="hk-s3d">${yuklemeKart('Bu sırada okumaya devam edebilirsin; model gelince sahne kendiliğinden açılır.')}</div>` : '<img id="hk-sag-foto" alt="">'}
        <div class="hk-sahne-etiket" id="hk-sahne-etiket"></div>${ucd ? '<span class="guven temsili hk-temsili">3D model · Temsili</span>' : ''}</div></aside></div></div>`);
    if (ucd) {
      s3dKur($('#hk-s3d'), e, { onParca:parcaSecildi }, () => hakkinda(id), () => hkSahne(hk.aktif ?? 0, false),
        () => { const k = $('#hk-s3d'); if (k) { k.outerHTML = '<img id="hk-sag-foto" alt="">'; $('.hk-temsili')?.remove(); hkSahne(hk.aktif ?? 0, false); } });   // «Görsellerle devam et»: bölümün fotoğrafı
    }
  } else {
    gorusAc(`<div class="hk hk-m" id="hk-kaydir">${nav}${kapakH}<div class="hk-govde">${bolumler}${son}</div></div>`);
  }
  hk.aktif = null; hkGozle(); hkSec(0);
}
/* okunan bölüm: sekmeyi işaretle, sekmeyi (yalnız sekme şeridini kaydırarak) görünür yap, masaüstünde sağdaki sahneyi değiştir */
function hkSec(i) {
  if (hk.aktif === i) return; hk.aktif = i;
  $$('.hk-sekme').forEach((s) => s.setAttribute('aria-current', String(+s.dataset.hkGit === i)));
  const s = $(`.hk-sekme[data-hk-git="${i}"]`), r = s?.parentElement;
  if (s && r) r.scrollTo({ left:s.offsetLeft - (r.clientWidth - s.offsetWidth) / 2, behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  hkSahne(i);
}
function hkSahne(i, gecis = true) {
  const b = hk.e?.hakkinda[i], et = $('#hk-sahne-etiket'); if (!b) return;
  if (et) et.textContent = `${String(i + 1).padStart(2, '0')} · ${b.baslik}`;
  const f = $('#hk-sag-foto');
  if (f) { const k = (b.fotolar || [])[0] || b.paragraflar.find((p) => p.fotolar)?.fotolar[0] || kapak(hk.e); if (k) { f.src = k.url || k.dosya; f.alt = k.alt || ''; } return; }
  const u = b.okuma?.ucd; if (!s3d || !s3d.kok || !u) return;
  s3d.kubbeler(!!u.ici, gecis);
  s3d.aci({ hedef:u.parcalar[0], azimut:u.azimut, egim:u.egim, uzaklik:u.uzaklik }, gecis);
  s3d.vurgula(u.parcalar.filter((p) => p !== 'Merkez'));
}
function hkGozle() {   // bölüm takibi, okuma çubuğu, ekrana girince belirme
  hk.gozcu.forEach((g) => g.disconnect()); hk.gozcu = [];
  const k = $('#hk-kaydir'); if (!k) return;
  const cubuk = $('.hk-ilerleme i');
  const serit = $('.hk-sekmeler');
  if (serit) { serit.addEventListener('scroll', hkSekmeOk, { passive:true }); requestAnimationFrame(hkSekmeOk); }
  $$('.hk-serit').forEach((r) => { hkSeritDurum(r); r.querySelectorAll('img').forEach((im) => im.addEventListener('load', () => hkSeritDurum(r), { once:true })); });
  k.addEventListener('scroll', () => { hkTerimKapat(); if (cubuk) cubuk.style.transform = `scaleX(${Math.min(1, k.scrollTop / Math.max(1, k.scrollHeight - k.clientHeight))})`; }, { passive:true });
  if (!('IntersectionObserver' in window)) { $$('.hk-gir').forEach((x) => x.classList.add('gorundu')); return; }
  const bolum = new IntersectionObserver((g) => g.forEach((x) => x.isIntersecting && hkSec(+x.target.dataset.hkBolum)), { root:k, rootMargin:'-35% 0px -60% 0px' });
  $$('[data-hk-bolum]').forEach((x) => bolum.observe(x));
  const gir = new IntersectionObserver((g) => g.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('gorundu'); gir.unobserve(x.target); } }), { root:k, rootMargin:'0px 0px -8% 0px' });
  $$('.hk-gir').forEach((x) => gir.observe(x));
  hk.gozcu.push(bolum, gir);
  const kp = $('.hk-d .hk-kapak');   // masaüstü: kapak ekrandan çıkınca sekme çubuğundaki geri düğmesi görünür
  if (kp) { const kg = new IntersectionObserver((g) => $('#hk-kaydir')?.classList.toggle('kapak-gecti', !g[0].isIntersecting), { root:k }); kg.observe(kp); hk.gozcu.push(kg); }
}
/* fotoğraflar kırpılmaz: kutunun oranı dosyanın gerçek oranından (kitaptaki oran sayfa düzeni içindi; arşiv dosyası kırpılmamış hâli) */
document.addEventListener('load', (ev) => {
  const im = ev.target; if (im.tagName !== 'IMG' || !im.naturalWidth) return;
  const k = im.closest('.hk-serit-f, .hk-bkapak-f'); if (!k) return;
  k.style.setProperty('--oran', (im.naturalWidth / im.naturalHeight).toFixed(4));
  const r = k.closest('.hk-serit'); if (r) hkSeritDurum(r);
}, true);
function hkSeritDurum(r) {   // fotoğraf şeridi: hangi yanda devamı var, kaçıncı fotoğraf
  if (!r) return; const kap = r.parentElement, n = r.children.length; if (n < 2) return;
  const sol = r.scrollLeft > 4, sag = r.scrollLeft + r.clientWidth < r.scrollWidth - 4;
  r.classList.toggle('sol-var', sol); r.classList.toggle('sag-var', sag);
  const o1 = kap.querySelector('.hk-serit-ok.sol'), o2 = kap.querySelector('.hk-serit-ok.sag'); if (o1) o1.hidden = !sol; if (o2) o2.hidden = !sag;
  let i = 0; const orta = r.scrollLeft + r.clientWidth * 0.35;
  [...r.children].forEach((c, j) => { if (c.offsetLeft - r.offsetLeft <= orta) i = j; });
  if (!sag) i = n - 1;
  const say = kap.querySelector('.hk-serit-sayac'); if (say) say.textContent = `${i + 1} / ${n}`;
}
document.addEventListener('scroll', (ev) => { if (ev.target.classList?.contains('hk-serit')) hkSeritDurum(ev.target); }, { capture:true, passive:true });
function hkSekmeOk() {   // şerit taşıyorsa: hangi yanda devamı var
  const r = $('.hk-sekmeler'); if (!r) return;
  const sol = r.scrollLeft > 4, sag = r.scrollLeft + r.clientWidth < r.scrollWidth - 4;
  r.classList.toggle('sol-var', sol); r.classList.toggle('sag-var', sag);
  const o1 = $('.hk-sekme-ok.sol'), o2 = $('.hk-sekme-ok.sag'); if (o1) o1.hidden = !sol; if (o2) o2.hidden = !sag;
}
window.addEventListener('resize', () => hkSekmeOk());
/* fotoğrafı büyüt: aynı şeritteki fotoğraflar arasında ‹ › ile gezilir; Esc ya da × kapatır */
function hkIsikAc(btn) {
  const ust = btn.closest('.hk-serit, .galeri'), grup = ust ? [...ust.querySelectorAll('[data-isik]')] : [btn];   // aynı şeridin/galerinin fotoğrafları arasında gezilir
  hk.isik = { grup, i:grup.indexOf(btn), donus:btn };
  let k = $('#hk-isik');
  if (!k) { k = document.createElement('div'); k.id = 'hk-isik'; k.className = 'hk-isik'; k.setAttribute('role', 'dialog'); k.setAttribute('aria-modal', 'true'); k.setAttribute('aria-label', 'Fotoğraf'); document.body.appendChild(k); }
  hkIsikCiz(); k.hidden = false; k.querySelector('.hk-isik-x').focus();
}
function hkIsikCiz() {
  const { grup, i } = hk.isik, b = grup[i], k = $('#hk-isik'), n = grup.length;
  k.innerHTML = `<button class="yuvarlak hk-isik-x" data-isik-kapat aria-label="Kapat">${ic('x', 20)}</button><img src="${esc(b.dataset.isik)}" alt="${esc(b.querySelector('img')?.alt || '')}">
    <p>${n > 1 ? `${i + 1} / ${n} · ` : ''}${esc(b.dataset.kunye || '')}</p>${n > 1 ? `<button class="yuvarlak hk-isik-ok sol" data-isik-git="-1" aria-label="Önceki fotoğraf">${ic('chevron-left', 20)}</button><button class="yuvarlak hk-isik-ok sag" data-isik-git="1" aria-label="Sonraki fotoğraf">${ic('chevron-right', 20)}</button>` : ''}`;
}
function hkIsikKapat() { const k = $('#hk-isik'); if (!k || k.hidden) return; k.hidden = true; hk.isik?.donus?.focus(); hk.isik = null; }
function hkTerimKapat() { $('#hk-terim-kart')?.remove(); }
document.addEventListener('click', (ev) => {
  const t = ev.target;
  const k = t.closest('[data-hk-kaynak]');
  if (k) { const l = $('#hk-k' + k.dataset.hkKaynak); const ac = l.hidden; l.hidden = !ac; k.setAttribute('aria-expanded', String(ac)); k.textContent = k.textContent.replace(/[›⌄]$/, ac ? '⌄' : '›'); return; }
  const so = t.closest('[data-hk-serit-kay]');
  if (so) { const r = so.parentElement.querySelector('.hk-serit'); r.scrollBy({ left:+so.dataset.hkSeritKay * r.clientWidth * 0.8, behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); return; }
  const ko = t.closest('[data-hk-kay]');
  if (ko) { const r = $('.hk-sekmeler'); r?.scrollBy({ left:+ko.dataset.hkKay * r.clientWidth * 0.7, behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); return; }
  const dr = t.closest('[data-hk-derin]');
  if (dr) {
    const kap = dr.closest('.hk-derin'), ic2 = kap.querySelector('.hk-derin-ic'), ac = dr.getAttribute('aria-expanded') !== 'true';
    kap.classList.toggle('acik', ac); ic2.inert = !ac; dr.setAttribute('aria-expanded', String(ac));
    dr.querySelector('span').firstChild.textContent = ac ? 'Metni kısalt' : 'Tam metni oku';
    if (ac) ic2.querySelectorAll('.hk-gir').forEach((x) => x.classList.add('gorundu'));
    else { const k = $('#hk-kaydir'), nav = $('.hk-nav'); if (k && kap.getBoundingClientRect().top < 0) k.scrollTo({ top:kap.offsetTop - (nav ? nav.offsetHeight : 0) - 16 }); }   // kısaltınca okuru bıraktığı yere değil metnin başına getir
    return;
  }
  const g = t.closest('[data-hk-git]');
  if (g) { const s = $(`[data-hk-bolum="${g.dataset.hkGit}"]`), kap = $('#hk-kaydir'), nav = $('.hk-nav'); if (s && kap) kap.scrollTo({ top:s.offsetTop - (nav ? nav.offsetHeight : 0) - 8, behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); return; }
  const is = t.closest('[data-isik]'); if (is) { hkIsikAc(is); return; }
  if (t.closest('[data-isik-kapat]') || t.id === 'hk-isik') { hkIsikKapat(); return; }
  const ig = t.closest('[data-isik-git]'); if (ig && hk.isik) { const n = hk.isik.grup.length; hk.isik.i = (hk.isik.i + +ig.dataset.isikGit + n) % n; hkIsikCiz(); return; }
  const tr = t.closest('[data-terim]');
  if (tr) {
    hkTerimKapat(); const d = hk.e?.terimler?.[+tr.dataset.terim]; if (!d) return;
    const kart = document.createElement('div'); kart.id = 'hk-terim-kart'; kart.className = 'hk-terim-kart'; kart.setAttribute('role', 'dialog'); kart.setAttribute('aria-label', d.kelime);
    kart.innerHTML = `<b>${esc(d.kelime)}</b><span>Kitapta: «${esc(d.tanim)}»</span>`;
    document.body.appendChild(kart);
    const r = tr.getBoundingClientRect(), w = Math.min(320, innerWidth - 32);
    Object.assign(kart.style, { width:w + 'px', left:Math.max(16, Math.min(innerWidth - w - 16, r.left + r.width / 2 - w / 2)) + 'px', top:(r.bottom + 8 + kart.offsetHeight > innerHeight ? r.top - kart.offsetHeight - 8 : r.bottom + 8) + 'px' });
    return;
  }
  if (!t.closest('#hk-terim-kart')) hkTerimKapat();
});
document.addEventListener('keydown', (ev) => {
  if (hk.isik && !$('#hk-isik')?.hidden) {
    if (ev.key === 'Escape') { ev.stopImmediatePropagation(); hkIsikKapat(); }
    else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') { const n = hk.isik.grup.length; hk.isik.i = (hk.isik.i + (ev.key === 'ArrowRight' ? 1 : -1) + n) % n; hkIsikCiz(); }
  } else if (ev.key === 'Escape' && $('#hk-terim-kart')) hkTerimKapat();
}, true);
addEventListener('hashchange', () => { hkIsikKapat(); hkTerimKapat(); });

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
  pinSeciliFiltre(null);
  if (!durum.masaustu) { document.body.classList.add('rota-modu'); $('#sahne').insertAdjacentHTML('beforeend', `<button class="ikon-btn" id="rota-geri" data-git="#/" aria-label="Geri" style="box-shadow:var(--golge)">${ic('chevron-left')}</button>`); }
  const duraklar = ROTA.duraklar.map((d) => ESER[d]);
  /* rota da bir ile ait: rota.json → sehir (yoksa ilk durağın ili); çizgi, yıldızlar ve panel o ilin yöre rengini alır */
  const rotaIl = (VERI.sehirler || []).find((s) => s.id === ROTA.sehir || s.ad === ROTA.sehir)?.ad || duraklar[0]?.il;
  yoreUygula({ il:rotaIl }); const rotaRenk = ilKimlik({ il:rotaIl })?.zemin || getComputedStyle(document.documentElement).getPropertyValue('--sehir-aksan').trim() || '#2F3B41';
  const ciz = () => {
    if (harita.getSource('rota')) return;
    harita.addSource('rota', { type:'geojson', data:{ type:'Feature', geometry:{ type:'LineString', coordinates:duraklar.map((e) => [e.lon, e.lat]) } } });
    harita.addLayer({ id:'rota-cizgi', type:'line', source:'rota', paint:{ 'line-color':rotaRenk, 'line-width':4, 'line-dasharray':[1.2, 1.2] } });
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
  Object.assign(gg, { eser:e, i:Math.min(Math.max(0, +i || 0), Math.max(0, e.gecmis.length - 1)), acik:true });   // «Nereden çekildi?» haritası masaüstünde ve mobilde hep açık (29 Ekim 2026)
  const bas = `<div class="gg-bas"><button class="ikon-btn" data-git="#/eser/${id}" aria-label="Geri">${ic('chevron-left', 18)}</button><div class="gg-baslik"><b>Geçmişi Gör</b><small>${esc(e.ad)}</small></div></div>`;
  if (!e.gecmis.length) return ggBos(e, bas);
  const n = e.gecmis.length;
  const fotoKutu = `<div class="gg-foto" id="gg-foto"><div class="gg-bugun-kat"><img class="b-bulanik" alt=""><img class="b-ana" alt=""></div><div class="gg-eski-kat"><img class="bulanik" alt=""><img class="ana" alt=""></div>
    <span class="gg-k-etiket" id="gg-k-eski"></span><span class="gg-k-etiket sag" id="gg-k-bugun"></span>
    <div class="gg-k-tutamak" id="gg-k-tutamak" role="slider" tabindex="0" aria-label="Eski ve bugünkü fotoğrafı karşılaştır" aria-valuemin="0" aria-valuemax="100"><span aria-hidden="true">‹ ›</span></div>
    <span class="gg-sayac" id="gg-sayac"></span><span class="gg-guven" id="gg-guven"></span>
    ${durum.masaustu ? `<button class="yuvarlak gg-ok" style="left:16px" data-gg-adim="-1" aria-label="Önceki">${ic('chevron-left', 18)}</button><button class="yuvarlak gg-ok" style="right:16px" data-gg-adim="1" aria-label="Sonraki">${ic('chevron-right', 18)}</button>`
      : `<button class="gg-kamera" data-gg-kamera>${ic('camera', 18)}Kamerayı aç</button>`}</div>`;
  const bugunsuz = e.gecmis.filter((f) => !f.bugun).length;
  const serit = `<div class="gg-serit-bas"><b>Eski fotoğraflar${durum.masaustu ? ` · ${n}` : ''}</b>${durum.masaustu ? '' : `<span class="soluk">${n} fotoğraf</span>`}</div>${bugunsuz ? `<p class="gg-cagri">${ic('camera', 14)}${bugunsuz === n ? 'Hiçbirinin bugünkü hali yok' : `${bugunsuz} tanesinin bugünkü hali yok`}; ilkini sen çek.</p>` : ''}
    <div class="gg-serit" id="gg-serit">${e.gecmis.map((f, k) => `<button data-gg-sec="${k}"><img src="${esc(f.kucuk)}" alt="" loading="lazy">${f.bugun ? '' : `<i class="gg-cek-isaret" title="Bugünkü hali yok">${ic('camera', 11)}</i>`}<b>${esc(f.tarih.etiket)}</b><span>${ggTur(f)}${f.bugun ? '<i class="gg-bugunu-var" title="Bugünkü eşi var"></i><span class="gizli-metin">, bugünkü eşi var</span>' : ''}</span></button>`).join('')}</div>`;
  const yakinNot = '<p class="gg-yakin" id="gg-yakin" hidden>Yakın açı: iki fotoğraf birebir aynı noktadan çekilmedi.</p>';
  const nereden = `<div class="gg-nereden" id="gg-nereden"><span class="pin">${ic('map-pin', 18)}</span><div><b>Nereden çekildi?</b><small id="gg-nereden-alt"></small></div><button class="gg-ac" data-gg-ac aria-label="Haritayı aç">${ic('chevron-up', 20)}</button></div>`;
  const haritaAlan = `<div class="gg-harita-kap" id="gg-harita-kap"><div id="gg-harita"></div><div class="gg-bilinmiyor" id="gg-bilinmiyor" hidden>${ic('map-pin-off', 36)}<b>Bu fotoğrafın çekim yeri bilinmiyor</b><span>Kamerayı açıp eski fotoğrafı yine de hizalayabilirsin.</span></div></div>
    <div class="gg-lejant" id="gg-lejant"><span><i class="yesil"></i>${esc(ilgi(e.ad))} fotoğrafları</span><span><i></i>${durum.masaustu ? 'Diğer eski fotoğraflar' : 'Bölgedeki diğer eski fotoğraf'}</span></div>`;
  if (durum.masaustu) {
    document.body.classList.add('gg-tam');
    gorusAc(`<div class="gg gg-d">${bas.replace('gg-baslik', 'gg-baslik serif-baslik')}<div class="gg-izgara"><div class="gg-sol">${fotoKutu}${yakinNot}${serit}</div>
      <aside class="gg-kart"><div id="gg-bilgi"></div><hr>${nereden}<div class="gg-kart-harita" id="gg-kart-harita" hidden>${haritaAlan}</div><p class="gg-not">Yerindeysen telefonundan açıp eski fotoğrafı kamerada hizalayabilirsin.</p></aside></div></div>`, 'gg-gorus');
  } else {
    /* mobil (29 Ekim 2026): alttaki çekmece kalktı. Büyük fotoğraf üstte yapışık (kaydırınca küçülür); altından bilgi, «bugün» kartı,
       eski fotoğraflar şeridi ve hep açık «Nereden çekildi?» haritası yukarı akar */
    gorusAc(`<div class="gg gg-m gg-akis" id="gg-kok">${bas}<div class="gg-kaydir" id="gg-kaydir">${fotoKutu}${yakinNot}<div id="gg-bilgi"></div><div id="gg-bugun"></div>${serit}<section class="gg-yer">${nereden}${haritaAlan}</section></div></div>`, 'gg-gorus');
    const kd = $('#gg-kaydir'), fk = $('#gg-foto');
    kd?.addEventListener('scroll', () => { const t = kd.scrollTop; if (t > 80) fk.classList.add('kucuk'); else if (t < 10) fk.classList.remove('kucuk'); }, { passive:true });
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
  ggBugunKart(f);
  const yer = !!f.cekimNoktasi;
  $('#gg-nereden-alt').textContent = yer ? (gg.acik && !durum.masaustu ? 'Fotoğrafçı burada durup yeşil koninin yönüne bakmış' : `Çekim noktası ve bakış yönü${durum.masaustu ? '' : ' haritada'}`) : 'Konum Foto Atlas\'ta işaretlenmemiş';
  $('#gg-bilinmiyor').hidden = yer; $('#gg-harita').style.visibility = yer ? 'visible' : 'hidden'; $('#gg-lejant').style.visibility = yer ? 'visible' : 'hidden';
  ggHaritaGuncelle();
}
/* «Bugün» kartı (29 Ekim 2026): seçili eski fotoğrafın bugünkü eşi yoksa kullanıcıyı aynı açıdan çekmeye çağırır; çekim noktası biliniyorsa
   haritayı ve (konum izni varsa) uzaklığı söyler. Eşi varsa karşılaştırmaya yönlendirir. Kamera akışı mevcut (data-gg-kamera) */
const uzYaz = (m) => (m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toLocaleString('tr-TR', { maximumFractionDigits:1 })} km`);
function ggBugunKart(f) {
  const k = $('#gg-bugun'); if (!k) return;
  if (f.bugun) { k.innerHTML = `<div class="gg-bugun var"><span class="gb-ik">${ic('history', 18)}</span><div><b>Bugünkü hali var</b><small>Fotoğraftaki kaydırıcıyla o gün ↔ bugün karşılaştır.</small></div><button class="metin-btn" data-gg-kamera>Sen de çek ›</button></div>`; return; }
  const uz = f.cekimNoktasi && durum.konumNokta ? mesafeYon(durum.konumNokta, f.cekimNoktasi)[0] : null;
  const alt = f.icMekan ? 'Bu fotoğraf içeride çekilmiş. İçeride aynı açıyı bulup çekebilirsin.'
    : f.cekimNoktasi ? `Fotoğrafçının durduğu yer aşağıdaki haritada${uz != null ? ` · sana ${uzYaz(uz)}` : ''}. Oraya git; eski fotoğraf kamerada saydam görünür, hizalayıp çek.`
    : 'Çekim yeri bilinmiyor; benzer açıyı bulup çekebilirsin.';
  k.innerHTML = `<div class="gg-bugun yok"><span class="gb-ik">${ic('camera', 18)}</span><div><b>Bu açının bugünkü hali yok</b><small>${alt}</small></div><button class="btn ana tam" data-gg-kamera>${ic('camera', 18)}Bugününü sen çek</button></div>`;
}
function ggSeritOrtala() {   // seçili küçük resmi şeridin içinde ortala; scrollIntoView sayfa kabını da yana kaydırıyordu (son fotoğrafta kenarda boşluk)
  const s = $('#gg-serit'), b = s && s.children[gg.i]; if (!b) return;
  const sr = s.getBoundingClientRect(), br = b.getBoundingClientRect();
  s.scrollTo({ left:s.scrollLeft + br.left - sr.left - (s.clientWidth - br.width) / 2, behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
function ggAcKapa(ac) {
  ac = true;   // harita hep açık (masaüstü ve mobil akış)
  gg.acik = ac;
  const kok = $('#gg-kok'); kok && kok.classList.toggle('acik', ac && !kok.classList.contains('gg-akis'));
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

function rozetKontrol(e, sessiz = false) {   // yeni kazanılan rozetleri döndürür; sessiz: alttaki bant çıkmaz (tebrik kartı gösterir)
  const yeni = [];
  for (const r of e.rozetler || []) {
    if (rozetVar(r)) continue;
    const k = r.kosul || {};
    const tamam = (k.hikaye_bitti && bittiMi(e.id)) || (k.gorev && gorevDurum({ id:k.gorev }));
    if (tamam) { yerel('akar.rozet.' + r.id, new Date().toISOString()); yeni.push(r); if (!sessiz) rozetBildir(r); }
  }
  return yeni;
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
    govde = `<h1 class="gv-soru">${esc(g.soru)}</h1><p class="gv-alt soluk">${e.hikaye?.length ? 'Fotoğrafa bak; cevabı hikâyede de duydun.' : 'Fotoğrafa bak; cevap «Eser hakkında»da da var.'}</p>
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
      <div class="gv-cipler">${guven(g.guven, { alinti:g.baslik, kaynak:g.kaynak })}<span class="gv-kaynak">Kaynak: ${esc(g.kaynak)}</span>${nasil}</div>
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

/* ---------- ilk açılış karşılama kartı (Figma D 1:4042 · WF 1:5616; 29 Ekim 2026) ----------
   Yalnız ilk girişte, açılış ekranı kalkınca ve harita adresindeyken (paylaşılan bir eser bağlantısıyla gelen kişiyi durdurmaz).
   Masaüstünde haritanın üstünde kart (şehir deseni şeridi), mobilde tam ekran (desenli zemin, üstte eser fotoğrafı).
   «Evden gez» konum istemez; «Konumumu kullan» tarayıcının izin penceresini açar. Gösterildiği cihazda kalır (akar.karsilama). */
function karsilamaGoster() {
  if (yerel('akar.karsilama') || location.hash.slice(2) || $('#karsilama')) return;
  const k = document.createElement('div'); k.id = 'karsilama'; k.className = 'karsilama-arka';
  const f = kapak(ESER[ROTA?.duraklar?.[0]] || VERI.eserler[0]);
  const madde = (ikon, b, a) => `<li><span class="ka-ik">${ic(ikon, 18)}</span><div><b>${b}</b><small>${a}</small></div></li>`;
  k.innerHTML = `<section class="karsilama${durum.masaustu ? '' : ' desenli-zemin'}" role="dialog" aria-modal="true" aria-labelledby="ka-baslik">
    ${durum.masaustu ? '<div class="ka-serit" aria-hidden="true"></div>' : `<div class="ka-foto">${resim(f)}</div>`}<img class="ka-logo" src="logo.png" alt="AKAR" width="800" height="237"><div class="ka-ust">Vakıf eserlerini keşfet</div>
    <h2 id="ka-baslik" class="ka-baslik">Şehrin hikâyesine karış.</h2>
    <p class="ka-alt">Geçmişi gör. Hikâyesini dinle. İzini bırak.</p>${SUSLEME}
    <div class="ka-koleksiyon"><div><b>${esc(SEHIR.ad || '')} vakıf eserleri</b><small>${VERI.eserler.filter((x) => ilinMi(x, SEHIR)).length} eser, hikâyesi ve kaynağıyla</small></div><span class="ka-yuvarlar">${VERI.eserler.slice(0, 3).map((x) => resim(kapak(x))).join('')}</span></div>
    <ul class="ka-maddeler">${madde('headphones', 'Dinle ya da oku', 'Her eserin kısa, kaynaklı hikâyesi')}${madde('history', 'Geçmişini gör', 'Eski fotoğrafı bugünle karşılaştır')}${madde('landmark', 'Vakfı anla', 'Bu yapıyı yüzyıllardır ne ayakta tuttu?')}</ul>
    <div class="ka-dugmeler"><button class="btn ana" data-ka="ev">${ic('house', 18)}Evden gez</button><button class="btn ikincil" data-ka="yakin">${ic('map-pin', 18)}Konumumu kullan</button></div>
    <div class="ka-son"><small>Konumun sadece cihazında kullanılır.</small><button class="metin-btn" data-vakif-nedir>Vakıf nedir? ›</button></div>
  </section>`;
  document.body.appendChild(k); requestAnimationFrame(() => k.classList.add('acik'));
  setTimeout(() => k.querySelector('[data-ka="ev"]')?.focus({ preventScroll:true }), 300);
}
function karsilamaKapat(kip) {
  const k = $('#karsilama'); if (!k) return; yerel('akar.karsilama', '1');
  k.classList.remove('acik'); setTimeout(() => k.remove(), 250);
  if (kip === 'yakin') konumIste(); else if (kip === 'ev') konumKip('ev', false);
}
document.addEventListener('click', (e) => { const a = e.target.closest('[data-ka]'); if (a) karsilamaKapat(a.dataset.ka); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#karsilama') && !($('#yan-sayfa') && !$('#yan-sayfa').hidden)) { e.stopImmediatePropagation(); karsilamaKapat(null); } }, true);

function yonlendir() {
  yanSayfaKapat(); konumMenu(false); if ($('#karsilama')) karsilamaKapat(null);   // sayfa değişince açık katmanlar kapanır
  const [ad, id, mod] = location.hash.replace(/^#\/?/, '').split('/');
  document.body.classList.toggle('gorus-acik', !!ad && ad !== 'rota');
  document.body.classList.toggle('tam-sayfa', ['hakkinda', 'profil', 'gorev'].includes(ad) && durum.masaustu);
  if (ad !== 'eser' && ad !== 'gorev') gv.bul = null;
  if (ad !== 'anlat') anlatDur();
  if (!ad) durum.rotada = false;
  if (!['gecmis', 'kamera', 'cekildi'].includes(ad)) { ggTemizle(); gg.eser = null; } else if (ad !== 'kamera') kameraKapat();
  if (!durum.masaustu && ad !== 'rota' && ['rota'].includes(durum.altH)) altYukseklik('kapali');
  switch (ad) {
    case 'eser': eserDetay(id); if (durum.tebrik?.id === id) setTimeout(tebrikGoster, 350); return gorevBulGoster();
    case 'gorev': return gorevSayfa(id, mod);
    case 'profil': return profilSayfa();
    case 'anlat': return anlatim(id, mod === 'oku' ? 'oku' : 'dinle');
    case 'son': durum.tebrik = { id, yeni:[] }; return location.replace('#/eser/' + id);   // eski «hikâye sonrası» adresi: eser + tebrik kartı
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
dilUygula(yerel('akar.dil') || 'tr', false);
yonlendir();
window.akarKarsilama = karsilamaGoster; if (!$('#acilis')) karsilamaGoster();   // açılış ekranı çoktan kalktıysa hemen
window.akar = { durum, VERI, harita, anlat, s3d:() => s3d }; window.akarIzler = IZLER;   // yalnız sınama için
