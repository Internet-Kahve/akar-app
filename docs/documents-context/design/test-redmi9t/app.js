/* AKAR · Redmi 9T prototipi. Figma `akar-yeni` mobil ve masaüstü ekranlarının çalışan hâli:
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
  x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
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
  pointer:'<path d="m9 9 5 12 1.8-5.2L21 14Z"/><path d="M7.2 2.2 8 5.1"/><path d="m5.1 8-2.9-.8"/><path d="M14 4.1 12 6"/><path d="m6 12-1.9 2"/>',
  navigation:'<polygon points="3 11 22 2 13 21 11 13 3 11"/>', 'arrow-right':'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
};
const ic = (ad, boy = 20) => `<svg class="ic" width="${boy}" height="${boy}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IK[ad] || ''}</svg>`;
const ikonla = (k = document) => $$('[data-ic]', k).forEach((e) => { e.outerHTML = ic(e.dataset.ic, +(e.dataset.boy || 20)); });
const SUSLEME = '<div class="susleme" aria-hidden="true"><svg viewBox="0 0 28 12"><path d="M14 1 18 6 14 11 10 6Z M2 6h7 M19 6h7" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="14" cy="6" r="1.4" fill="currentColor"/></svg></div>';

/* güven etiketi */
const GUVEN = { 'Doğrulanmış':'dogrulanmis', 'Tarihsel çıkarım':'tarihsel', 'Temsili':'temsili' };
const guven = (g) => g ? `<span class="guven ${GUVEN[g] || 'dogrulanmis'}">${esc(g)}<span class="i">ⓘ</span></span>` : '';

/* AKAR pinleri (design/harita/akar-harita-onizleme.html ile aynı) */
const PIN_YOL = 'M20 48c-1.2 0-2-1-3-2.4C11 37.6 3 29.8 3 19.5 3 10 10.6 2.5 20 2.5S37 10 37 19.5c0 10.3-8 18.1-14 26.1-1 1.4-1.8 2.4-3 2.4z';
const PIN_IKON = {
  cami:'<path fill-rule="evenodd" d="M3 21V15H15V21H3ZM8 21V18.5C8 17.5 8.33333 16.6667 9 16C9.66667 16.6667 10 17.5 10 18.5V21H8Z"/><path d="M4 14C4 12.9391 4.52678 11.9217 5.46447 11.1716C6.40215 10.4214 7.67392 10 9 10C10.3261 10 11.5979 10.4214 12.5355 11.1716C13.4732 11.9217 14 12.9391 14 14H4Z"/><path d="M17.5 21V9H19.5V21H17.5Z"/><path d="M16.75 11H20.25V12H16.75V11Z"/><path d="M17.5 8L18.5 3L19.5 8H17.5Z"/>',
  han:'<path fill-rule="evenodd" d="M2 21V6H22V21H2ZM6 12.5V10.5C6 9.83333 6.41667 9.25 7.25 8.75C8.08333 9.25 8.5 9.83333 8.5 10.5V12.5H6ZM15.5 12.5V10.5C15.5 9.83333 15.9167 9.25 16.75 8.75C17.5833 9.25 18 9.83333 18 10.5V12.5H15.5ZM5.5 21V17.5C5.5 16.5 6.08333 15.6667 7.25 15C8.41667 15.6667 9 16.5 9 17.5V21H5.5ZM15 21V17.5C15 16.5 15.5833 15.6667 16.75 15C17.9167 15.6667 18.5 16.5 18.5 17.5V21H15Z"/>',
  hamam:'<path fill-rule="evenodd" d="M2 21V15H22V21H2ZM5 21V18.5C5 17.5 5.33333 16.6667 6 16C6.66667 16.6667 7 17.5 7 18.5V21H5Z"/><path d="M3 14C3 13.337 3.31607 12.7011 3.87868 12.2322C4.44129 11.7634 5.20435 11.5 6 11.5C6.79565 11.5 7.55871 11.7634 8.12132 12.2322C8.68393 12.7011 9 13.337 9 14H3Z"/><path d="M10 14C10 12.8065 10.5795 11.6619 11.6109 10.818C12.6424 9.97411 14.0413 9.5 15.5 9.5C16.9587 9.5 18.3576 9.97411 19.3891 10.818C20.4205 11.6619 21 12.8065 21 14H10Z"/>',
  turbe:'<path d="M6.5 10C6.5 6.5 9 5 12 3.5C15 5 17.5 6.5 17.5 10H6.5Z"/><path d="M3 11H21V12.5H3V11Z"/><path fill-rule="evenodd" d="M5 13.5H19C17.6667 13.5 17 14.1667 17 15.5V21H7V15.5C7 14.1667 6.33333 13.5 5 13.5ZM10.5 21V18C10.5 17 11 16.1667 12 15.5C13 16.1667 13.5 17 13.5 18V21H10.5Z"/>',
};
const ROL_RENK = { dini:'#2E7D32', su:'#2A6FB0', egitim:'#25477B', akar:'#9A5B2E' };
const ROL_AD = { dini:'Dinî', su:'Su', egitim:'Eğitim', akar:'Akar' };
const pinSvg = (ikon, renk, boy = 2) => `<svg xmlns="http://www.w3.org/2000/svg" width="${40 * boy}" height="${50 * boy}" viewBox="0 0 40 50"><path d="${PIN_YOL}" fill="${renk}" stroke="#FFFFFF" stroke-width="3"/><g transform="translate(8 7.5)" fill="#FFFFFF">${PIN_IKON[ikon]}</g></svg>`;
const svgResim = (svg) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });

/* ---------- veri ---------- */
const VERI = await (await fetch('veri.json')).json();
const ESER = Object.fromEntries(VERI.eserler.map((e) => [e.id, e]));
const ROTA = VERI.rotalar[0];
const galeriFoto = (e) => e.fotolar.filter((f) => f.sira).sort((a, b) => a.sira - b.sira);
const kapak = (e) => galeriFoto(e)[0] || e.fotolar[0];
const foto = (e, dosya) => e.fotolar.find((f) => f.dosya === dosya) || kapak(e);
const meta = (e) => [e.yil, e.yaptiran].filter(Boolean).join(' · ');
const sonrakiDurak = (e) => { const i = ROTA.duraklar.indexOf(e.id); return i >= 0 && i < ROTA.duraklar.length - 1 ? ESER[ROTA.duraklar[i + 1]] : null; };
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
  container:'harita', style:stil, center:[29.0628, 40.1846], zoom: durum.masaustu ? 16.7 : 16.3, pitch:55, bearing:-12,
  minZoom:6, maxZoom:19.5, maxPitch:65, attributionControl:false, fadeDuration:0,
});
window.akarHarita = harita;
const IZLER = [];   // model taban izleri (lng/lat çokgen), bina gizleme ve dokunma için

async function haritaPinleriKur() {
  if (harita.getSource('eserler')) return;
  for (const ikon of ['cami', 'han', 'hamam', 'turbe']) if (!harita.hasImage('pin-' + ikon)) harita.addImage('pin-' + ikon, await svgResim(pinSvg(ikon, ['han', 'hamam'].includes(ikon) ? ROL_RENK.akar : ROL_RENK.dini)), { pixelRatio:2 });
  if (harita.getSource('eserler')) return;
  harita.addSource('eserler', { type:'geojson', data:{ type:'FeatureCollection', features:VERI.eserler.map((e) => ({ type:'Feature', geometry:{ type:'Point', coordinates:[e.lon, e.lat] }, properties:{ id:e.id, ad:e.ad, ikon:e.ikon, rol:e.rol, renk:ROL_RENK[e.rol] } })) } });
  const glif = !!harita.getStyle().glyphs;
  harita.addLayer({ id:'pin', type:'symbol', source:'eserler', layout:Object.assign({ 'icon-image':['concat', 'pin-', ['get', 'ikon']], 'icon-anchor':'bottom', 'icon-allow-overlap':true, 'icon-size':['interpolate', ['linear'], ['zoom'], 14, 0.8, 17, 1] },
    glif ? { 'text-field':['step', ['zoom'], '', 15.2, ['get', 'ad']], 'text-font':['Noto Sans Bold'], 'text-size':13, 'text-anchor':'left', 'text-offset':[1.1, -1.3], 'text-optional':true } : {}),
    paint:{ 'text-color':['get', 'renk'], 'text-halo-color':'#fff', 'text-halo-width':2 } });
  harita.addLayer({ id:'pin-secili', type:'symbol', source:'eserler', filter:['==', ['get', 'id'], ''], layout:{ 'icon-image':['concat', 'pin-', ['get', 'ikon']], 'icon-anchor':'bottom', 'icon-allow-overlap':true, 'icon-size':1.25 } });
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
      const anaObj = ANA_PARCA[e.id] && gltf.scene.getObjectByName(ANA_PARCA[e.id]);
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
const SUNUM_EK = /^(Zemin|Cevre|Olcek|Avlu_Agac|Avlu_Cim)/;   // sunum GLB'sinin yapıya ait olmayan parçaları (detayda görünür, tıklanmaz)
const ANA_PARCA = { 'ulu-cami':'Govde', 'yildirim-bayezid-bedesteni':'Govde', 'koza-han':'Govde_Dis', 'orhan-bey-kulliyesi':'Cami_Govde', 'emir-han':'Emir_Hani', 'orhan-gazi-turbesi':'Govde' };
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
        if (IZLER.some((iz) => icinde(m, iz.cokgen))) continue;                          // altında bizim model var
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
harita.on('pitchend', () => { binaGorunum(); $('#b-3d b').textContent = harita.getPitch() > 5 ? '3D' : '2D'; });
harita.on('rotate', () => { $('#b-3d .k').style.transform = `rotate(${-harita.getBearing()}deg) translateY(-15px)`; });

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
$('#b-3d').onclick = () => harita.easeTo({ pitch:harita.getPitch() > 5 ? 0 : 55, duration:600 });
$('#b-konum').onclick = () => {
  if (!navigator.geolocation) return toast('Konum desteklenmiyor');
  navigator.geolocation.getCurrentPosition((p) => harita.easeTo({ center:[p.coords.longitude, p.coords.latitude], zoom:16.5 }), () => { toast('Konum izni yok · Evden gez: Bursa'); harita.easeTo({ center:[29.0628, 40.1846], zoom:16.5 }); });
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
    for (const o of gltf.scene.children) if (!SUNUM_EK.test(o.name)) this.kutu.expandByObject(o);
    const c = this.kutu.getCenter(new THREE.Vector3()), b = this.kutu.getSize(new THREE.Vector3());
    this.yaricap = b.length() / 2; this.boyY = b.y;
    this.merkez = new THREE.Vector3(c.x, this.kutu.min.y + b.y * 0.25, c.z);   // Merkez: kutunun yatay ortası (kadraj için tabandan biraz yukarıda)
    this.parcalar = new Map(); this.meshler = [];
    const adlar = new Set(gltf.parser.json.nodes.filter((n) => n.mesh !== undefined && !SUNUM_EK.test(n.name)).map((n) => n.name));
    for (const ad of adlar) { const o = this.kok.getObjectByName(ad); if (o) this.parcalar.set(ad, o); }
    this.kok.traverse((o) => {
      if (!o.isMesh) return;
      o.material = o.material.clone(); o.material.emissive = new THREE.Color(0, 0, 0);
      let p = o; while (p && !adlar.has(p.name)) p = p.parent;
      o.userData.parca = p ? p.name : null; this.meshler.push(o);
    });
    this.kam.near = this.yaricap / 200; this.kam.far = this.yaricap * 30; this.kam.updateProjectionMatrix();
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
    const d = sigdir * (/yakın/.test(u) ? 0.42 : /orta/.test(u) ? 0.62 : /çatı/.test(u) ? 0.85 : 0.95);
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
    const f = this.flasT0 ? Math.max(0, 1 - (t - this.flasT0) / 650) : 0;
    const flas = f > 0 ? 0.2 * Math.sin(f * Math.PI) : 0;
    for (const m of this.meshler) {
      const e = m.material.emissive.setRGB(0, 0, 0), p = m.userData.parca;
      if (p && this.vurgulu.has(p)) e.copy(ALTIN).multiplyScalar(0.32 + nabiz);
      else if (p && this.secili.has(p)) e.copy(SARI).multiplyScalar(0.42);
      if (flas && p) e.add(SARI.clone().multiplyScalar(flas));
    }
    this.animBitis = Math.max(this.vurguT0 ? this.vurguT0 + 1200 : 0, this.flasT0 ? this.flasT0 + 650 : 0);
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
      const hit = ray.intersectObjects(this.meshler, false).find((h) => h.object.userData.parca);
      const ad = hit ? hit.object.userData.parca : null;
      if (!ad) { this.secili.clear(); this.boya(); this.onParca && this.onParca(null); return; }
      const acik = this.sec(ad); this.onParca && this.onParca(acik ? ad : null);
    });
  }
  kartBagla(el, ad) { this.kart = el ? { el, nokta:this.hedefNokta(ad) } : null; this.kirli = true; }
  dongu(t) {
    if (this.bitti) return;
    this.raf = requestAnimationFrame(this.dongu);
    if (this.tween) {
      const k = Math.min(1, (t - this.tween.t0) / 800), s = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      this.kam.position.lerpVectors(this.tween.k0, this.tween.k1, s); this.kont.target.lerpVectors(this.tween.h0, this.tween.h1, s);
      if (k >= 1) this.tween = null; this.kirli = true;
    }
    if (this.animBitis && t < this.animBitis + 50) this.boya();
    if (this.kont.update()) this.kirli = true;
    if (!this.kirli || !this.kok) return;
    this.kirli = false;
    this.r.render(this.sahne, this.kam);
    if (this.kart) {
      const v = this.kart.nokta.clone().project(this.kam), w = this.kap.clientWidth, h = this.kap.clientHeight;
      const gor = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
      this.kart.el.style.opacity = gor ? 1 : 0;
      this.kart.el.style.left = ((v.x + 1) / 2 * w) + 'px'; this.kart.el.style.top = ((1 - v.y) / 2 * h) + 'px';
    }
  }
  kapat() {
    this.bitti = true; cancelAnimationFrame(this.raf); this.ro.disconnect(); this.kont.dispose();
    this.sahne.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { Object.values(m).forEach((v) => v && v.isTexture && v.dispose()); m.dispose(); }); });
    this.r.dispose(); try { this.r.forceContextLoss(); } catch {} this.r.domElement.remove();
  }
}
let s3d = null;
function s3dKapat() { if (s3d) { s3d.kapat(); s3d = null; } }

/* =====================================================================
   EKRANLAR
   ===================================================================== */
const gorus = $('#gorus'), panel = $('#panel-ic'), altIc = $('#alt-ic'), alt = $('#alt'), kartEl = $('#eser-kart'), pop = $('#eser-pop');
let rotaModu = false, rotaIsaret = [];

function altYukseklik(h) {
  durum.altH = h;
  const v = h === 'tam' ? innerHeight * 0.92 : h === 'yarim' ? innerHeight * 0.55 : h === 'rota' ? innerHeight * 0.58 : altEnAz();
  document.documentElement.style.setProperty('--alt-h', Math.round(v) + 'px');
  if (!durum.masaustu && typeof harita !== 'undefined') harita.setPadding({ top:110, bottom:Math.min(v, innerHeight * 0.6), left:0, right:0 });
}
/* en alt durak: yalnız tutamak, Eserler | Rotalar ve «Bursa ▾» satırı görünür */
function altEnAz() {
  const b = altIc && altIc.querySelector('.baslik-satir');
  return b && b.offsetHeight ? Math.round(b.offsetTop + b.offsetHeight + 8) : 112;   // offsetTop #alt'a göre (tutamak dahil); sayfa gizliyken ölçülemez
}
/* alt sayfa sürükleme: tutamak ya da başlık bölgesi (sekmeler, «Bursa» satırı) parmağı izler, bırakınca en yakın durağa oturur */
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
    const duraklar = [['kapali', altEnAz()], ['yarim', innerHeight * 0.55], ['tam', innerHeight * 0.92]];
    altYukseklik(duraklar.reduce((a, b) => (Math.abs(b[1] - h) < Math.abs(a[1] - h) ? b : a))[0]);
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
    : `<div class="baslik-satir" style="margin-top:12px"><a style="color:var(--primary)">Bursa ▾ · ${liste.length} eser yakında</a></div>`;
  return `${sekme}${ust}<ul class="liste">${liste.map(eserSatir).join('') || '<li class="soluk" style="padding:16px 0">Sonuç yok. Yazımı kontrol et ya da filtreleri temizle.</li>'}</ul>`;
}
function kesif() {
  rotaKaldir();
  if (durum.masaustu) { panel.innerHTML = kesifIcerik(true) + `<div class="panel-alt"><button class="btn ikincil tam">Tüm eserleri gör (${VERI.eserler.length})</button></div>`; filtreUygula(); }
  else { altIc.innerHTML = kesifIcerik(false); alt.hidden = !!durum.secili; altYukseklik(['kapali', 'yarim', 'tam'].includes(durum.altH) ? durum.altH : 'kapali'); }
  gorusKapat();
  eserKartiCiz();
}
document.addEventListener('click', (e) => {
  const s = e.target.closest('[data-sekme]'); if (s) { durum.sekme = s.dataset.sekme; kesif(); return; }
  const r = e.target.closest('[data-rotama]'); if (r) { e.stopPropagation(); toast(`${ESER[r.dataset.rotama].ad} Rotam'a eklendi`); return; }
  const es = e.target.closest('[data-eser]'); if (es) { if (durum.masaustu) eserSec(es.dataset.eser, true); else location.hash = '#/eser/' + es.dataset.eser; return; }
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
  const sonraki = sd ? `<button class="btn cerceve tam" style="margin-top:12px" data-git="#/eser/${sd.id}">Sonraki durak: ${esc(sd.ad)} ${ic('arrow-right', 16)}</button>` : '';
  if (masaustu) return `<button class="geri" data-git="#/" style="height:auto;padding:0;border:0;gap:12px"><span class="ikon-btn" style="width:32px;height:32px">${ic('chevron-left', 16)}</span><span class="soluk" style="font-weight:500">Harita</span></button>
    <h1 class="panel-baslik" style="margin-top:16px">${esc(e.ad)}</h1><div class="panel-meta">${esc(meta(e))}</div>${SUSLEME}<p style="margin:0 0 14px">${esc(e.kisa)}</p>${hik}${dugme}
    <div class="satir-link" data-git="#/hakkinda/${e.id}"><div><b>Eser hakkında</b><small>Tarihçe, mimari, kaynaklar</small></div>${ic('chevron-right', 18)}</div><div class="panel-alt">${sonraki}</div>`;
  return `<div class="eser-alt" id="eser-alt"><h1>${esc(e.ad)}</h1><div class="meta">${esc(meta(e))}</div>${SUSLEME}${hik}${dugme}${sonraki}</div>`;
}
function eserDetay(id) {
  const e = ESER[id]; if (!e) return (location.hash = '#/');
  durum.secili = id; rotaKaldir();
  const ust = durum.masaustu ? `<div class="gorus-ust">${seciciHTML(false)}</div>` : `<div class="gorus-ust"><button class="geri" data-git="#/">‹ Harita</button>${seciciHTML(false)}</div>`;
  gorusAc(`${ust}<div id="gorus-alan"></div>${durum.masaustu ? '' : eserBilgi(e, false)}`);
  if (durum.masaustu) panel.innerHTML = eserBilgi(e, true);
  gorunumCiz();
}
/* eser detayında Fotoğraf | 3D */
function gorunumCiz() {
  const e = ESER[durum.secili], alan = $('#gorus-alan'); if (!alan || !e) return;
  s3dKapat();
  if (durum.gorunum === 'foto') { alan.innerHTML = galeriHTML(e); galeriYukseklik(); }
  else {
    alan.innerHTML = `<div class="sahne3d" id="s3d"><div class="yukleniyor">3D model yükleniyor…</div></div><div class="ipucu">${ic('move', 14)}${durum.masaustu ? 'Sürükle: döndür · Tekerlek: yakınlaştır · Dokun: parça' : 'Sürükle: döndür · İki parmak: yakınlaştır · Dokun: parça'}</div><span class="guven temsili temsili-etiket" id="temsili">3D model · Temsili<span class="i">ⓘ</span></span><div class="parca-ad" id="parca-ad" hidden></div>`;
    temsiliKonum();
    s3d = new Sahne3D($('#s3d'), { onParca:parcaGoster, altBosluk:() => (durum.masaustu ? 0 : ($('#eser-alt')?.offsetHeight || 0) + 12) });
    s3d.yukle(e).then(() => { $('#s3d .yukleniyor')?.remove(); }).catch((err) => { $('#s3d .yukleniyor').textContent = '3D model açılamadı: ' + err.message; });
  }
  $$('[data-gorunum]').forEach((b) => b.setAttribute('aria-checked', b.dataset.gorunum === durum.gorunum));
}
function galeriYukseklik() {
  if (durum.masaustu) return;
  const g = $('#galeri'), a = $('#eser-alt'); if (!g || !a) return;
  g.style.height = Math.max(240, innerHeight - a.offsetHeight - 72 - 28) + 'px';
}
function temsiliKonum() {
  const t = $('#temsili'), a = $('#eser-alt'); if (!t) return;
  if (durum.masaustu) { t.style.left = '24px'; t.style.top = '16px'; }
  else { t.style.left = '16px'; t.style.bottom = ((a ? a.offsetHeight : 260) + 22) + 'px'; }
  const p = $('#parca-ad'); if (p) p.style.bottom = durum.masaustu ? '24px' : ((a ? a.offsetHeight : 260) + 58) + 'px';
}
function parcaGoster(ad) { const p = $('#parca-ad'); if (!p) return; p.hidden = !ad; p.textContent = ad ? ad.replace(/_/g, ' ') : ''; }
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
  if (koyu) alan.innerHTML = `<div class="foto-sahne${durum.doldur ? ' doldur' : ''}" id="foto-sahne"><img class="bulanik" alt=""><img class="ana" alt=""><div class="ust-golge"></div><div class="alt-bilgi"><span id="foto-guven"></span><span class="kunye">Fotoğraf: Bursa Vakıf Eserleri Envanteri</span></div></div>`;
  else {
    alan.innerHTML = `<div class="sahne3d" id="s3d"><div class="yukleniyor">3D model yükleniyor…</div></div><div class="kart3d" id="kart3d" style="opacity:0"></div><div class="parca-ad" id="parca-ad" style="bottom:16px" hidden></div>`;
    s3d = new Sahne3D($('#s3d'), { onParca:parcaGoster, altBosluk:() => (!durum.masaustu && !anlat.acik ? ($('#hikaye-kart')?.offsetHeight || 0) + 12 : 0) });
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
  const e = anlat.eser; anlatDur(); yerel('akar.ilerleme.' + e.id, '0');
  const r = JSON.parse(yerel('akar.rota') || 'null'), i = ROTA.duraklar.indexOf(e.id);
  if (r && i >= 0) yerel('akar.rota', JSON.stringify({ i:Math.min(i + 1, ROTA.duraklar.length - 1) }));
  location.hash = '#/son/' + e.id;
}
function hikayeSonrasi(id) {
  const e = ESER[id]; durum.secili = id; rotaKaldir(); const sd = sonrakiDurak(e);
  const govde = `<div style="text-align:center;padding-top:6px"><span class="sayac">Hikâye tamamlandı</span><h1 class="panel-baslik" style="margin-top:10px">${esc(e.ad)}</h1><div class="panel-meta">${e.hikaye.length} / ${e.hikaye.length} bölüm · tamamlandı</div></div>${SUSLEME}
    <div class="satir-link" data-git="#/hakkinda/${id}"><div><b>Eser hakkında</b><small>Tarihçe, mimari, kaynaklar</small></div>${ic('chevron-right', 18)}</div>
    <div class="satir-link" data-git="#/anlat/${id}/dinle"><div><b>Hikâyeyi yeniden</b><small>Dinle · Oku</small></div>${ic('chevron-right', 18)}</div>
    ${sd ? `<button class="btn ana tam" style="margin-top:16px" data-git="#/eser/${sd.id}">Sonraki durak: ${esc(sd.ad)} ${ic('arrow-right', 16)}</button>` : (ROTA.duraklar.includes(id) ? `<button class="btn ana tam" style="margin-top:16px" data-git="#/rota/${ROTA.id}">Rota tamamlandı · Rotaya dön</button>` : '')}
    <button class="metin-btn" style="display:block;margin:8px auto 0" data-git="#/">Haritaya dön</button>`;
  if (durum.masaustu) { panel.innerHTML = govde; gorusAc(`<div class="gorus-ust">${seciciHTML(false)}</div><div id="gorus-alan"></div>`); gorunumCiz(); return; }
  gorusAc(`<div class="son-gorsel">${resim(kapak(e))}</div><div class="sayfa-ic son-ic"><div class="kutu">${govde}</div></div>`);
}
function hakkinda(id) {
  const e = ESER[id]; durum.secili = id; rotaKaldir();
  const govde = `<button class="geri" data-git="#/eser/${id}">‹ ${esc(e.ad)}</button><h1 class="panel-baslik" style="margin-top:16px">${esc(e.uzun_ad || e.ad)}</h1><div class="panel-meta">${esc(meta(e))} · ${esc(e.tur)} · Bursa · Osmangazi</div>`
    + e.hakkinda.map((b) => `${SUSLEME}<h2 class="bolum-baslik">${esc(b.baslik)}</h2>${b.paragraflar.map((p) => `<p class="paragraf">${esc(p.metin)}</p><div class="paragraf-alt">${guven(p.guven)}<span>${esc(p.kaynak)}</span></div>`).join('')}`).join('')
    + `${SUSLEME}<h2 class="bolum-baslik">Kaynaklar</h2><p class="soluk">Bursa Vakıf Eserleri Envanteri, Cilt 1–2 (Vakıf Katılım, 2026).</p>`;
  if (durum.masaustu) { panel.innerHTML = govde; gorusAc(`<div class="gorus-ust">${seciciHTML(false)}</div><div id="gorus-alan"></div>`); gorunumCiz(); }
  else gorusAc(`<div class="sayfa-ic">${govde}</div>`);
}

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
  if (e.target.closest('#rota-baslat, #rota-evden')) {
    const r = JSON.parse(yerel('akar.rota') || 'null') || { i:0 }; yerel('akar.rota', JSON.stringify(r));
    location.hash = '#/eser/' + ROTA.duraklar[r.i];
  }
});

/* =====================================================================
   YÖNLENDİRME
   ===================================================================== */
function yonlendir() {
  const [ad, id, mod] = location.hash.replace(/^#\/?/, '').split('/');
  document.body.classList.toggle('gorus-acik', !!ad && ad !== 'rota');
  if (ad !== 'anlat') anlatDur();
  if (!durum.masaustu && ad !== 'rota' && ['rota'].includes(durum.altH)) altYukseklik('kapali');
  switch (ad) {
    case 'eser': return eserDetay(id);
    case 'anlat': return anlatim(id, mod === 'oku' ? 'oku' : 'dinle');
    case 'son': return hikayeSonrasi(id);
    case 'hakkinda': return hakkinda(id);
    case 'rota': return rotaOnizleme(id);
    default: return kesif();
  }
}
addEventListener('hashchange', yonlendir);
$('#panel-sekme').onclick = () => { document.body.classList.toggle('panel-kapali'); setTimeout(() => harita.resize(), 300); };
altYukseklik('kapali');
yonlendir();
window.akar = { durum, VERI, harita, anlat, s3d:() => s3d }; window.akarIzler = IZLER;   // yalnız sınama için
