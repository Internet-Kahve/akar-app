# Vakıf Haritası: Proje Devir Rehberi

Bu dosya, projeyi ilk kez görecek bir geliştiricinin ya da AI asistanının kodu doğru anlaması için yazıldı.
Her iddia kaynak koddan doğrulandı. Dosya ve fonksiyon adları koddakiyle birebir aynıdır.
`README.md` de büyük ölçüde doğrudur, ama birkaç noktada koddan geride kalmıştır (bkz. §11).

---

## 1. Proje ne?

Mobil öncelikli bir **prototip**. İstanbul'da Tophane/Karaköy bölgesinde üç duraklı bir "vakıf yürüyüş rotası" gösterir:

| # | Durak | 3B model | Detay görünümü |
|---|---|---|---|
| 1 | Kılıç Ali Paşa Camii (Mimar Sinan, 1580) | Haritada var | **Var.** Tam ekran 3B sahne ve anlatımlı hikâye |
| 2 | Tophane Çeşmesi (I. Mahmud, 1732) | Haritada var | Yok. Tıklanınca harita oraya uçar |
| 3 | Nusretiye Camii (Krikor Balyan, 1826) | Yok | Yok. Sadece numaralı işaret |

Uygulamanın iki ana ekranı var:

1. **Harita ekranı**: Resimli (illüstrasyon tarzı) bir MapLibre haritası. Üstünde rota, numaralı durak işaretleri, cami ve çeşmenin düşük detaylı 3B modelleri, altta bir durak kartı ve sağda bir döndürme kadranı bulunur.
2. **Detay görünümü** ("esere tıklayınca açılan kısım"): Kılıç Ali Paşa külliyesinin (cami, hamam, çeşme) bir ada üstünde, deniz ortasında durduğu tam ekran three.js sahnesi. Burada 9 bölümlük bir hikâye **Dinle** (sesli) ya da **Oku** (kaydırmalı) modunda anlatılır. Hikâye bitince dört etkileşimli eylem açılır.

Arayüzün tüm metinleri Türkçe, koddaki yorumlar İngilizcedir.

## 2. Teknoloji ve çalıştırma

- **Vite 8** (vanilla JS, ES modules). Framework yok: React, Vue vb. kullanılmıyor. DOM, template string ve `innerHTML` ile kuruluyor.
- **maplibre-gl 6**: harita. **three 0.186**: 3B. **lucide**: ikonlar. **@fontsource**: Inter ve Cormorant Garamond.
- Backend, API anahtarı ve ortam değişkeni yok. Harita karoları OpenFreeMap'ten (`https://tiles.openfreemap.org/planet`) anahtarsız gelir.

```bash
npm install
npm run dev       # http://localhost:5173, --host ile LAN'dan telefonla da açılır
npm run build     # dist/ (base: './', yani herhangi bir alt klasörde çalışır)
npm run preview
npm run glyphs    # sadece harita fontları değişirse: public/fonts/*.pbf yeniden üretilir
```

Test bayrakları: `?low=1` düşük donanım yolunu zorlar, `?low=0` normal yolu zorlar.
Konsoldan hata ayıklama için `window.__map` (MapLibre), `window.__app` (`{ goTo, openDetail }`) ve detay açıkken `window.__detail` (`{ camera, controls, center, cam }`) kullanılabilir.

## 3. Dosya haritası

```
index.html              Harita ekranının sabit DOM'u: #map, #progress (üst ilerleme), #card (alt durak kartı), #toast
vite.config.js          base './', es2020
scripts/make-glyphs.mjs Harita etiketleri için SDF glyph PBF üretici (opentype.js + pbf)
public/fonts/           Üretilmiş glyph'ler (Inter Medium/SemiBold, Cormorant SemiBold; sadece Latin aralıkları)
references/             Sadece stil referansı (png/jpg) + galata-minyatur.html (ayrı, bağımsız bir deney; uygulamaya dahil değil)
dist/                   Derlenmiş çıktı (+ elle konmuş Archive.zip)
src/
  main.js               Giriş noktası. Durak durumu (current), harita kurulumu, detay görünümünü açma/kapama geçişleri
  perf.js               LOW_END, PIXEL_RATIO, REDUCE_MOTION sabitleri; <html class="low">
  stops.js              MOSQUE, FOUNTAIN (OSM koordinatları + taban izleri), STOPS, ROUTE, START_VIEW, toLocal()
  style.js              MapLibre stili (sıfırdan yazılmış) + PAL renk paleti + dalga deseni (canvas'ta üretiliyor)
  map.js                createMap, flyToStop, addPlinth, addRoute, addMarkers, addRotationDial
  mapModel.js           Harita üstündeki 3B modeller: MapLibre "custom layer" (three.js, ortak WebGL context) + dokunma ray-cast
  ui.js                 İlerleme çubuğu, durak kartı, işaret elemanları, toast, alt panel tutamacı (sheetHandle)
  dial.js               Döndürme kadranı UI bileşeni (harita ve 3B görünüm ortak kullanır)
  icons.js              Lucide ikonları SVG string olarak + ORNAMENT (çintemani süsü)
  mosque.js             Cami modeli + paylaşılan "kit" (toon materyal, kontur, çizgi, gölge) + geometri yardımcıları
  hamam.js              Kılıç Ali Paşa Hamamı modeli
  fountain.js           Tophane Çeşmesi modeli
  detailView.js         >>> Detay görünümü: DOM, three.js sahnesi, kamera sistemi, render döngüsü, kadran, hikâye bağlantısı
  story.js              >>> Hikâye motoru: Dinle/Oku modları, bölüm etkinleştirme, kartlar ve efektler
  stories/kilic-ali-pasa.json  >>> 9 hikâye bölümünün verisi (metin, kamera, kart, efekt, güven etiketi)
  actions.js            >>> Hikâye sonrası 4 eylem modalı: Geçmişi Gör, İz Bırak, Bulmaca, Birlikte Gez
  styles.css            Tüm stiller (tek dosya)
```

## 4. Koordinat sistemleri (önce bunu anla)

Kodun her yerinde geçen **"mosque local frame"** (cami yerel çerçevesi):

- Birim **metre**. Orijin = caminin OSM taban izinin ağırlık merkezi (`MOSQUE.lngLat = [28.9809471, 41.0264162]`).
- **+y yukarı.**
- **+z kıbleye** bakar. Kıble pusula açısı `MOSQUE.qiblaAzimuth = 132°` (GD). **−z** son cemaat yeri ve avlu tarafıdır (KB).
- **+x** yaklaşık 42° yönüne (KD) bakar. Minare bu taraftadır (`MIN = {x: 14.7, z: -8.6}`).
- `toLocal([lng, lat])` (stops.js), bir coğrafi koordinatı bu çerçeveye çevirir (eşdikdörtgen yaklaşım; onlarca metre için yeterli).

Detay sahnesinde önemli noktalar (hepsi bu çerçevede):

| Nesne | Konum |
|---|---|
| Cami ana salonu | merkez `(0, 0, HALL.z=2.5)`, 26×26 m, duvar 12 m; kubbe r=6.5, tepesi ≈22 m |
| Minare | `(14.7, 0, -8.6)`, alem ile ≈48 m |
| Hamam (`HAMAM`) | `(-38, 0, -4)`, 14×24 m. **Konumu temsili**, gerçek değil |
| Çeşme (`F = toLocal(FOUNTAIN.lngLat)`) | ≈ `(45.46, 0, -4.61)`. Gerçek OSM ofseti, camiden 45.7 m, 36° |
| `CENTER` (orbit pivotu) | üç yapının ortalaması, y=8: ≈ `(2.49, 8, -2.04)` |
| Ada | yarıçap `ISLAND_R = 60` m kum silindiri, altın kenar |
| Deniz | yarıçap 260 m daire, y = −2.2 |

`stories/kilic-ali-pasa.json` içindeki tüm `camera.position`, `camera.target` ve `anchor` değerleri **bu çerçevede metre** cinsindendir.

Haritadaki model aynı çerçeveyi kullanır. `mapModel.js` içindeki `modelMatrix` bu çerçeveyi MapLibre Mercator koordinatına çevirir (Y ekseni etrafında `180° - qiblaAzimuth` döndürme, X ekseni etrafında 90°, metre başına mercator ölçeği).

## 5. Harita ekranı (giriş noktası)

### 5.1 Açılış akışı (`main.js`)
1. `initChrome()`: ilerleme çubuğu noktaları, kart ikonları.
2. `createMap('map')`: `START_VIEW` ile tüm rota görünür (zoom 16.25, pitch 50, bearing −20). `doubleClickZoom: false`.
3. `map.on('load')` geldiğinde sırayla:
   - `addPlinth`: cami ve çeşmenin OSM taban izlerinin üstüne açık renkli bir "kaide" poligonu çizer. Sebebi: OpenFreeMap binaları birleştirdiği için tek binayı filtrelemek mümkün değil, düz bina altta görünmesin diye üstü örtülür.
   - `addRoute`: beyaz bant üstünde turkuaz kesikli çizgi.
   - `createMonumentsLayer`: 3B cami ve çeşme (aşağıda).
   - `addMarkers`: numaralı yuvarlak DOM işaretleri (`.stop-marker`).
   - `addRotationDial`: sağ kenardaki kadran.
   - `goTo(0, false)`: 1. durak aktif olur, uçuş yapılmaz.

### 5.2 Durak durumu
`current` (0..2) tek gerçek durum değişkenidir. `goTo(i, fly)` şunları yapar: `setProgress` (üst çubuk ve "1 / 3" sayacı), `setMarkerStates` (aktif / tamamlanmış işaretler), `setCard` (alt kart: başlık, alt yazı, ‹ › butonları) ve `flyToStop` (1.6 s uçuş, durağın `view` çerçevesine).

Alt kart (`#cardBody`) sadece `has3d: true` olan durakta (yalnızca 1. durak) tıklanabilir ve "3B aç" yazısını gösterir. Tıklanınca `openDetail` çağrılır.

### 5.3 Haritadaki 3B modeller (`mapModel.js`)
- Tek bir MapLibre `custom` katmanı (`id: 'monuments-3d'`, `renderingMode: '3d'`), MapLibre'nin WebGL context'ini paylaşan tek bir three.js renderer.
- Düşük detaylı modeller: `buildMosque({detail:'low'})` (≈3.0k üçgen) ve `buildFountain({detail:'low'})` (≈0.6k üçgen).
- **Animasyon döngüsü yok.** Sadece MapLibre yeniden çizdiğinde render edilir.
- **Dokunma testi** (`hitTest`): Tıklanan pikselden model uzayına bir ışın atılır. Önce görünmez, cömert boyutlu kutular ve gerçek mesh'ler test edilir. Bir şey bulunmazsa, model ekranda çok küçükse diye, projekte edilen dikey eksene 28 px mesafe yedeği devreye girer.
- Tıklama `onTap('mosque' | 'fountain')` olarak döner. `main.js` bunu `STOPS.findIndex(s => s.model === id)` ile durağa çevirip `onMarker(i)` çağırır:
  - Cami (`has3d`): o durağa geçer (uçmadan) ve **`openDetail()`** çağrılır.
  - Çeşme: `goTo(1)`, yani harita çeşmeye uçar. Detay görünümü yok.
- Numaralı işaretlere tıklamak da aynı `onMarker` fonksiyonunu çağırır.

### 5.4 Harita kadranı
§7.6'daki `dial.js` bileşeninin harita sürümüdür. Topuz haritanın bearing'ini gösterir. Sürüklemek haritayı ekran merkezi etrafında döndürür; hedef açıya her karede `d * 0.3` oranında yaklaşılır. Merkez butonu `flyToStop(map, current)` çağırır, −/+ bir zoom seviyesi değiştirir. Dokunmak süren bir `flyTo`'yu `map.stop()` ile keser. Kadran, `#progress` ile `#card` / atıf butonu arasındaki boş banda yerleşir.

## 6. Esere tıklayınca ne oluyor: açılış ve kapanış geçişi

`main.js → openDetail()`:

1. Haritanın o anki kamerası `saved` içine kaydedilir.
2. Harita camiye "dalar": `map.flyTo({ center: MOSQUE.lngLat, zoom: 18.7, pitch: 62, bearing: saved.bearing + 25, duration: 1000 })`.
3. Aynı anda `createDetailView({ stop: STOPS[0], onBack, onNext })` çağrılır. DOM'a `#detail` eklenir ama `opacity: 0` durumdadır.
4. 380 ms sonra `detail.show()` çağrılır. `.in` sınıfı eklenir (0.55 s opaklık geçişi), alt panel aşağıdan kayar, 3B kamera **intro** uçuşunu başlatır ve odak "Harita" butonuna geçer.

Böylece harita yakınlaşırken 3B sahne üstünde belirir ve kesintisiz bir geçiş hissi oluşur.

**Kapanış.** `closeDetail(restore)` şunları yapar: `busy` kilidi açılır; "Harita" butonuyla dönülürse harita `saved` kamerasına 0.9 s'de geri uçar. `detail.close()` önce `.in` sınıfını kaldırır, 560 ms bekler, sonra **her şeyi temizler**: rAF iptal edilir, animasyonlar silinir, hikâye ve modallar kapatılır, ResizeObserver ve OrbitControls dispose edilir, tüm geometri, materyal ve texture'lar dispose edilir, `renderer.forceContextLoss()` çağrılır ve DOM silinir. Detay görünümü her açılışta **sıfırdan kurulur**.

"Sonraki durak" butonu: `closeDetail(null).then(() => goTo(1))`, yani harita kaydedilmiş kameraya dönmez, doğrudan 2. durağa uçar.

> Not: `openDetail` her zaman `STOPS[0]` kullanır, hikâye de `kilic-ali-pasa.json` olarak `detailView.js` içine sabit import edilmiştir. Başka bir esere detay eklemek için bu iki yerin parametrik hâle getirilmesi gerekir (bkz. §12).

## 7. Detay görünümü (`detailView.js`): en önemli bölüm

### 7.1 Ekran düzeni (DOM)

```
#detail (section, position:fixed, z-index 20)
├─ .sky                 CSS gradyan gökyüzü (canvas şeffaf, alpha:true)
├─ canvas               three.js WebGLRenderer
├─ .d-labels            CSS2DRenderer katmanı (3B noktalara bağlı HTML kartlar), pointer-events:none
├─ .d-back              "‹ Harita" butonu (sol üst)
├─ .d-hint              "Sürükle: döndür · İki parmak: yakınlaştır" (sağ üst, ilk etkileşimde kaybolur)
├─ .d-sheet.sheet       ALT PANEL (hikâye başlamadan önce ve bittikten sonra)
│   ├─ .handle          sürükle/tıkla ile daralt/genişlet (ui.js sheetHandle)
│   ├─ h2.title         "Kılıç Ali Paşa Camii"
│   ├─ .d-head          "Mimar Sinan · 1580" + "Temsili canlandırma" etiketi
│   ├─ ORNAMENT         altın çizgi + çintemani
│   └─ .sheet-body
│       ├─ .d-lead      "Yapının hikâyesi · 9 bölüm"
│       ├─ .d-modes     [🎧 Dinle] (primary)  [📖 Oku] (secondary)
│       ├─ .d-after     (gizli; hikâye bitince açılır)
│       │   ├─ .d-acts  4 karo: Geçmişi Gör · İz Bırak · Bulmaca · Birlikte Gez
│       │   └─ .d-again "Hikâyeyi yeniden: Dinle · Oku"
│       └─ .d-next      "Sonraki durak →"
├─ .s-panel.sheet       HİKÂYE PANELİ (story.js oluşturur; hikâye sırasında .d-sheet yerine görünür)
├─ .dial-wrap           döndürme kadranı (sağ kenar)
└─ .m-wrap              (eylem modalı açıkken)
```

`button[data-k]` tıklamaları tek yerde yönlendirilir: `listen`/`read` ise `startStory(k)`, değilse `openAction(k, root, ctx)`.

### 7.2 3B sahne içeriği
- `buildMosque({detail:'high'})`: ≈17.6k üçgen. Pencereler, payandalar, revak kemerleri, kasnak pencereleri, avlu duvarı ve kapı, şadırvan, türbe, bahçe, servi ve yuvarlak ağaçlar.
- `buildHamam(kit)`: ≈3.5k üçgen. Soğukluk büyük kubbe altında, sıcaklık 2×3 küçük kubbe ve fil gözleri, halvet kubbesi, külhan bacası.
- `buildFountain({detail:'high', kit, x:F.x, z:F.z, ry:F_YAW})`: ≈4.2k üçgen. Kare gövde, köşelerde sebil silindirleri ve altın parmaklıklar, her yüzde musluk nişi, yalak ve lale devri vazo kabartmaları, geniş saçak, alçak kurşun çatı, alemler.
- Kum ada (+ altın kenar), çeşme altında döşeme diski.
- **Deniz**: özel `ShaderMaterial`. Uzaklığa göre turkuaz geçişi, ada çevresinde açık sığ bant ve 22×16 m hücrelerde hash'lenmiş seyrek "︵︵" dalga işaretleri. `fw` uniform'u (kameranın yere izdüşen bakış yönü) sayesinde dalga işaretleri hep kameraya döner. `t` uniform'u hafif kayma sağlar (reduced-motion'da donar).
- Işık: `addLights` (ambient 1.55 + directional 1.75). Gerçek gölge yok; binaların altında radyal gradyanlı "blob" gölge düzlemleri var.

**Görsel stil ("kit", `mosque.js createKit`)**: Tüm binalar tek bir materyal setini paylaşır:
- `toon`: `MeshToonMaterial` + 3 basamaklı gradient texture, **vertex color** ile (her parça birleştirilmiş tek buffer'a renkli olarak eklenir; `Acc` sınıfı).
- `hull`: inverted-hull kontur. Arka yüzler, normal yönünde **sabit piksel** kadar dışarı itilir (`uPx`, `uRes`). Renk, yüzeyin kendi renginin koyu tonudur, siyah mürekkep kullanılmaz. Her karede `kit.setResolution(w,h)` çağrılmalıdır.
- `line`: `EdgesGeometry(30°)`, %32 opak sıcak gri ince kıvrım çizgileri.
- `blob()`: yumuşak gölge düzlemi.
- `C`: renk paleti (stone, lead, terra, teal, gold, …).

Geometri yardımcıları (`box`, `cyl`, `dome`, `semiDome`, `archGeos`, `alem`, `T` transform, `cypress`, `roundTree`) export edilir; hamam ve çeşme bunları kullanır.

### 7.3 Talep üzerine render döngüsü
Sürekli bir rAF döngüsü **yok**. Mekanizma şöyle:

```js
const anims = new Set();            // her biri fn(now) -> true ise devam
function frame(now) {
  for (const a of anims) if (!a(now)) anims.delete(a);
  if (controls.enabled && controls.update()) more = true;   // damping sürüyorsa devam
  if (cam.free) clampPivot();
  syncDial();                                              // kadran topuzunu güncelle
  water uniforms (t, fw); kit.setResolution(...);
  renderer.render(); labels.render();                      // WebGL + CSS2D
  if (more) kick();
}
kick()    = gerekirse tek bir rAF iste
animate(fn) = anims.add(fn); kick();
```

Kamera tween'leri, hikâye efektleri ve kadran takipçisi `animate()` ile eklenir. Hepsi bitince çizim durur. OrbitControls'un `change` olayı `kick` çağırır.

**Önemli yan etki:** Akar hikâyesindeki (bölüm 6, `flow`) altın sikkeler sonsuza dek döner, bu yüzden o bölüm aktifken render döngüsü kesintisiz çalışır. Bölüm değişince temizlenir.

### 7.4 Kamera sistemi (en kritik ve en ince kısım)

**Temel kural:** Her kamera hareketi `camera.position` **ile** `controls.target`'ı **birlikte** tween eder (sadece `lookAt` kullanılmaz). Böylece OrbitControls'un pivotu her zaman bakılan noktadır ve kullanıcı ele aldığında kamera zıplamaz.

Durum nesnesi:
```js
const cam = { token: 0, scripted: 0, free: false };
```
- `token`: Her yeni hareket `++cam.token` yapar. Eski tween kendi id'si eşleşmediği an durur. Bu bir iptal mekanizmasıdır.
- `scripted`: Sadece senaryolu bir çekim (intro / `flyTo`) başlayınca artar. Kadran takipçisini iptal etmek için kullanılır.
- `free`: Kullanıcı kompleksin etrafında serbestçe dönüyor mu? `true` ise pivot sınırlandırılır ve `minDistance = 45`; `false` ise (hikâye çekimi tutuluyorsa) `minDistance = 20`.

Fonksiyonlar:

| Fonksiyon | Ne yapar |
|---|---|
| `intro()` | 1.5 s, cubic ease-out. Küresel koordinatta `INTRO_FROM` (r=420, φ=0.6) noktasından `INTRO_TO` (r=170, φ=1.0, θ=0.68π) noktasına `CENTER` etrafında süzülür. Bitince kontroller açılır, `free = true`. |
| `flyTo(pos, target, {dur=1700, orbit, free})` | Pozisyon ve hedef birlikte lerp edilir (ease-in-out cubic). Uzun hareketlerde hafif bir yay çizilir (`lift = min(18, mesafe*0.12)`, sinüs). Süre boyunca `controls.enabled = false`. Bitince kontroller açılır; `orbit:true` ise `autoRotate` başlar, `free:true` ise serbest moda geçilir. |
| `recenter(dur=900, distRange=[70,200])` | Pivotu `CENTER`'a kaydırır (kamera onunla birlikte taşınır, bakış yönü korunur), mesafeyi aralığa yumuşakça sokar. Artımlı çalıştığı için kullanıcı bu sırada sürüklemeye devam edebilir. Bitince `free = true`. |
| `releaseCamera()` | Süren tween iptal edilir, kamera olduğu yerde kullanıcıya bırakılır. |
| `clampPivot()` | `free` iken her karede pivotu `CENTER`'dan en fazla 24 m (yatay) ve 2–20 m (yükseklik) uzakta tutar. Fazlası kadar target ve kamera birlikte geri çekilir. |

OrbitControls ayarları: damping 0.09, `screenSpacePanning: false` (pan zeminde kayar), polar açı 0.25–1.38 (ufkun altına inilmez), mesafe 20–240.

**Kullanıcı ele alınca:** `controls` `start` olayında ipucu gizlenir, autoRotate kapanır ve `!cam.free` ise (yani bir hikâye çekimi tutuluyorsa, örneğin 7. bölümde kamera denize bakıyorsa) `recenter()` çağrılır. Böylece sürükleme denizin değil binaların etrafında döner.

Hikâyenin sonunda `flyTo(around(WIDE), CENTER, {dur:2000, free:true})` çağrılır: tüm kompleksin geniş görünümü (`WIDE`: r=185, φ=0.95, θ=0.7π).

Ekran boyutu (`resize()`): `camera.setViewOffset(..., lift)` ile sahne, alttaki panelin yüksekliğinin %42'si kadar (en fazla ekranın %25'i) **yukarı kaydırılır**, böylece modeller panelin arkasında kalmaz. FOV dikey ekranda 46°, yatayda 36°. `ResizeObserver` kök elemanı, alt paneli ve hikâye panelini izler (panel daralınca, eylemler açılınca ya da font yüklenince yeniden hesaplanır).

Canvas'ta `dblclick` engellidir (çift dokunuşla zoom yok).

### 7.5 Etkileşim özeti (kullanıcının yapabildikleri)

| Hareket | Sonuç |
|---|---|
| Tek parmak sürükle | Orbit (döndür). Hikâye çekimi tutuluyorsa önce pivot merkeze döner |
| İki parmak / tekerlek | Zoom; iki parmak pan da var ama pivot 24 m ile sınırlı |
| Kadranı sürükle | Kompleksi pusula açısına göre döndür (§7.6) |
| Kadran merkezi | Varsayılan görünüme dön (`INTRO_TO`, 1.1 s) |
| Kadran −/+ | Mesafeyi ×1.25 / ×0.8 (45 ile maxDistance arasında) |
| Klavye (kadran odaktayken) | ←/↓ ve →/↑ ile 15° döndür, −/+ ile zoom |
| Alt panel tutamacı | Aşağı kaydır daraltır, yukarı kaydır genişletir, tıklama aç/kapa yapar |
| Dinle / Oku | Hikâyeyi başlatır (§8) |
| Hikâye sonrası karolar | Eylem modalları (§9) |
| "‹ Harita" | Haritaya geri döner (kamera eski hâline gelir) |
| "Sonraki durak" | Haritaya döner ve 2. durağa uçar |

### 7.6 Döndürme kadranı (`dial.js` + detailView tarafı)

`dial.js` **yalnızca UI'dır**: markup, pointer ve klavye girdisi, topuz ve yerleşim. Açının ne anlama geldiğine sahibi (harita ya da detay görünümü) karar verir. Callback'ler: `onGrab`, `onTurn(deg)`, `onZoom(±1)`, `onReset`.

- Kadran yüzü: SVG halka, 30°'de bir çentik, K/D/G/B harfleri (küçük ekranda sadece K görünür).
- Kadranda herhangi bir yere basıp sürüklemek: imlecin merkeze göre açısı (kuzeyden saat yönünde) istenen bearing olur. Merkez yarıçapın %42'si içinde başlayıp hareket etmeyen bir dokunuş "reset" sayılır. Merkezin en iç %15'lik kısmı kararsız olduğu için yok sayılır.
- `role="slider"`, `aria-valuenow` ve `aria-valuetext` ("Kuzeydoğu, 45°") tanımlıdır.
- `place({top, height, obstacles})`: Kadran sağ kenarda, üstteki butonlar ile alttaki panel arasındaki boş bandın dikey ortasına yerleşir. Yer yoksa önce zoom satırını gizler (`.no-zoom`), yine yoksa kendini tamamen gizler. Asla üst üste binmez.
- Boyut 96 px; ekran ≤380 px genişlik ya da ≤700 px yükseklikse 64 px.

Detay görünümündeki anlamı:
- Topuz açısı = **pivottan bakıldığında kameranın pusula bearing'i**. Dönüşüm `toTheta(b) = rad(132 − b)`, `toBearing(θ) = 132 − deg(θ)` (çünkü model +z ekseni 132°'ye bakar).
- `takeOver()` (`onGrab`): ipucu gizlenir; hikâye aktifse `story.pause()` çağrılır; OrbitControls'un damping momentumu iç alanlar sıfırlanarak öldürülür (`_sphericalDelta`, `_panOffset`; public API olmadığı için); pivot merkezde değilse `recenter` yapılır.
- `follow()`: Her karede orbit azimutunu hedefe %30, mesafeyi %25 oranında yaklaştıran yumuşak bir takipçi. Senaryolu bir çekim başlarsa (`cam.scripted` değişirse) kendini iptal eder.

## 8. Hikâye motoru (`story.js` + `stories/kilic-ali-pasa.json`)

### 8.1 Veri şeması (her bölüm)
```jsonc
{
  "id": "akar",
  "text": "Seslendirilen / okunan metin",
  "camera": { "position": [x,y,z], "target": [x,y,z], "orbit": true /* opsiyonel: çekim bitince autoRotate */ },
  "card":   { "title": "...", "body": "opsiyonel", "anchor": [x,y,z], "trust": "Doğrulanmış", "placeholder": true /* opsiyonel */ },
  "effect": { "type": "highlight", "target": "domes" | "hamam" | "fountain" }
          | { "type": "flow", "from": [x,y,z], "to": [x,y,z], "labels": ["Bakım","Aydınlatma","Görevliler"] },
  "trust":  "Doğrulanmış" | "Tarihsel çıkarım" | "Temsili canlandırma"
}
```
Her bölümde **en fazla bir kart ve en fazla bir efekt** bulunur. `trust` değeri renkli bir etikete dönüşür: `t-ok` turkuaz, `t-inf` amber, `t-rep` kiremit.

### 8.2 Dokuz bölüm

| # | id | Metin (özet) | Kamera | Kart / Efekt | Güven |
|---|---|---|---|---|---|
| 1 | kulliye | Külliye, Tophane, 1580 | Yüksek ve uzak genel bakış | Kart: "Kılıç Ali Paşa Külliyesi · 1580–81" (kubbe üstünde) | Doğrulanmış |
| 2 | banisi | Kaptan-ı derya, İnebahtı sonrası donanma | Revak önü | Kart: "Kılıç Ali Paşa · Kaptan-ı Derya" | Doğrulanmış |
| 3 | mimar | Mimar Sinan | Çapraz görünüm, **autoRotate** | Kart: "Mimar Sinan", gövde: "Sinan'ın bilinen gerçek bir portresi yoktur" | Doğrulanmış |
| 4 | plan | Küçük Ayasofya planı | Kubbelere yakın | **Efekt highlight "domes"**: ana kubbe + 2 yarım kubbe altınla parlar | Doğrulanmış |
| 5 | hamam | Hamam hâlâ yaşıyor | Hamama bakış | **Efekt highlight "hamam"** | Doğrulanmış |
| 6 | akar | Gelir getiren yapılara akar denir; gelir caminin bakımına gider | Yukarıdan, hamam ile cami arası | **Efekt flow**: hamamdan camiye altın tüp, akan sikkeler, etiketler | Tarihsel çıkarım |
| 7 | kiyi | O zaman deniz caminin önündeydi | **Denize bakar** (target z=96) | Kart: **yer tutucu** "Gravür · kaynak eklenecek" | Tarihsel çıkarım |
| 8 | cesme | Karşıda Tophane Çeşmesi, 1732 | Çeşmeye bakış | Kart: "Tophane Çeşmesi · 1732" | Doğrulanmış |
| 9 | hayrat | Çeşme bir vakıf hayratıdır | Çeşmeye yakın, alçak | **Efekt highlight "fountain"** | Tarihsel çıkarım |

### 8.3 `activate(i)`: bir bölümün sahneye yansıması
Her iki mod da sonunda bu fonksiyonu çağırır:
1. Önceki bölümün `cleanup()` fonksiyonu çalışır (kart ve efekt kaldırılır, kendi oluşturduğu geometri ve materyaller dispose edilir).
2. Liste öğesi `.on` ve `aria-current` alır. Dinle modunda liste aktif öğeyi ortalayacak şekilde kaydırılır.
3. `o.flyTo(seg.camera.position, seg.camera.target, {orbit})` çağrılır (detailView'ın kamera tween'i).
4. Kart varsa `makeCard`: `CSS2DObject` 3B `anchor` noktasına yerleşir, `center(0.5, 1)` ile kartın altı noktaya oturur. CSS bir altın "sap" (`::after`) çizer. Belirme `.on` sınıfıyla olur. Placeholder kartlarda kesikli çerçeve ve "Yer tutucu" yazısı gösterilir.
5. Efekt varsa:
   - **`highlight(target)`** → `glaze()`: Hedef geometrinin üstüne `polygonOffset` ile öne itilmiş, şeffaf altın bir `MeshBasicMaterial` kopyası eklenir. Opaklık 2.4 s boyunca yükselip nabız gibi atar (5 yarım dalga), sonra 0.78'de sabit kalır. Sonsuz döngü yoktur.
     - `hamam` / `fountain`: detailView'ın verdiği `glazeTargets` içindeki **mevcut** `mainGeo` kullanılır (paylaşıldığı için dispose edilmez). Çeşmede `matrixWorld` da uygulanır.
     - `domes`: yeni geometri üretilir (ana kubbe ×1.02 + iki yarım kubbe) ve temizlikte dispose edilir.
   - **`flow(fx)`**: `from` ile `to` arasında, ortası 14 m yükseltilmiş bir `QuadraticBezierCurve3`. Altın bir `TubeGeometry` (r=0.5) ve koyu altın bir kenar tüpü (r=0.78, BackSide) üretilir. `setDrawRange` ile 2.2 s'de baştan sona **çizilir**. Üç etiket (`.s-flow-label`, CSS2D) eğrinin t=0.28 / 0.54 / 0.80 noktalarında, çizgi oraya ulaşınca belirir. Çizim bitince 3 sikke (küre) eğri boyunca 2.6 s periyotla, faz farkıyla döner.

### 8.4 Hikâye paneli (`.s-panel`)
```
.s-panel.sheet
├─ .handle (daralt/genişlet)
├─ .s-top:  [Dinle | Oku] sekmeleri · durum metni · ✕ (Hikâyeyi bitir)
├─ ol.s-list.sheet-body: 9 <li> (numara, metin, güven etiketi) + son öğe "Hikâye bitti · Devam →" (sadece Oku modunda)
└─ .s-ctrl: ⏮ · ▶/⏸ (56 px) · ⏭   (sadece Dinle modunda)
```
`startStory(mode)` açık modalı kapatır, ipucunu ve `.d-sheet`'i gizler, `story.start(mode)` çağırır. `resize()` artık panelin yüksekliğine göre sahneyi kaydırır.

### 8.5 Dinle modu
- `window.speechSynthesis` ile `tr-TR` sesi (dil kodu `^tr` olan ilk ses) kullanılır, hız 0.95. Her bölüm ayrı bir utterance'tır.
- **iOS kilidi açma:** `start()` içinde, kullanıcı dokunuşu bağlamındayken, boş bir utterance hemen `speak` edilir.
- `loadVoice()`: Sesler yoksa `voiceschanged` olayı en fazla 1.5 s beklenir.
- **Türkçe ses yoksa:** zamanlı otomatik ilerleme devreye girer: `max(5000 ms, metin uzunluğu × 55 ms)`. Durum metni "Türkçe ses yok · otomatik ilerleme" olur.
- `utter.onend` sonraki bölüme geçer (`advance`). Son bölümden sonra 900 ms beklenir, ardından `finish()` çağrılır.
- **Duraklat** = utterance iptal edilir (`speechSynthesis.pause()` Android'de güvenilmez olduğu için). **Oynat** = mevcut bölüm baştan okunur.
- ⏮ / ⏭ ile ve listedeki bir öğeye tıklayarak bölüm atlanır. Çalıyorsa yeni bölüm seslendirilir, duruyorsa sadece sahne değişir.
- `token` sayacı, eski utterance ve timer callback'lerinin geç gelip yanlış ilerletmesini engeller.
- Chrome'un bekleyen utterance'ı GC etmesine karşı `utter` referansı tutulur.

### 8.6 Oku modu
- Liste kaydırılabilir (maks. 38vh, üst ve altta 15vh dolgu). Her öğe bir `IntersectionObserver` ile izlenir: `root: list`, `rootMargin: '-46% 0px -46% 0px'`. Yani **listenin dikey ortasındaki %8'lik bandı kesen öğe** aktif bölüm olur ve sahneyi sürer.
- Oynatma kontrolleri gizlidir. Son öğe "Hikâye bitti · Devam" butonudur.

### 8.7 Mod değiştirme, bitirme ve duraklatma
- Sekmelerle Dinle ve Oku arasında geçilirken **mevcut bölüm korunur** (`start(mode, current)`).
- `end(toMenu)`: ses durdurulur, observer kesilir, cleanup çalışır, `releaseCamera()` çağrılır. `toMenu` true ise panel gizlenir ve `onEnd` çağrılır.
- `onEnd` (detailView): `.d-sheet` yeniden gösterilir, Dinle/Oku karoları ve "9 bölüm" yazısı gizlenir, **`.d-after` (4 eylem + "yeniden Dinle · Oku")** açılır ve kamera geniş görünüme uçar.
- ✕, "Hikâye bitti · Devam" ve Dinle'de son bölümün bitmesi aynı sonu tetikler.
- `story.pause()` (kullanıcı kadrana dokununca): `detached = true` olur. Dinle çalıyorsa ses durur ve durum "Duraklatıldı · devam için oynat" olur. Sonra ▶'ye basılırsa kamera önce o bölümün çekimine geri uçar, ardından anlatım devam eder. Oku modunda bir sonraki bölüm geçişi kamerayı zaten yeniden bağlar.
- Kullanıcı hikâye sırasında **canvas'ı** sürüklerse anlatım durmaz. Sadece kamera merkeze döner (`recenter`) ve bir sonraki bölüm kamerayı yine alır.

## 9. Hikâye sonrası eylemler (`actions.js`)

Hepsi detay görünümünün içinde açılan alt tabanlı bir modaldır (`.m-wrap > .m-box.sheet`, `role="dialog"`). ✕, Escape ya da arka plana tıklama modalı kapatır. Aynı anda tek modal açık olabilir (`closeActions`). **Hiçbir veri cihazdan çıkmaz.**

| Karo | Durum | Ne yapıyor |
|---|---|---|
| **Geçmişi Gör** | Yer tutucu | Önce/sonra kaydırıcısı. İki SVG "görsel" (bugün ve gravür; basit cami silüeti) üst üste durur. Görünmez bir `<input type=range>` CSS değişkeni `--p` değerini ayarlar, `.ba-then` `clip-path` ile kesilir. Not: "İki görsel de yer tutucudur." |
| **İz Bırak** | Yerel çalışıyor | Fotoğraf seç (`capture="environment"`) ve en fazla 280 karakterlik hatıra yaz. Gönderilince fotoğraf 480 px JPEG küçük resme dönüştürülür ve kayıt `localStorage['vakif.memories.v1']` içine eklenir. Kayıt, gelecekteki sunucu kaydı şeklindedir: `schema: 'vakif.memory/1'`, `id`, `placeId`, `storyId`, `createdAt`, `text`, `photo{…, thumbnail, remoteUrl:null}`, `author{kind:'anonymous'}`, `status:'pending'`, `moderation{…}`, `sync{state:'local'}`. Kota dolarsa küçük resimler atılır. Bu yere ait önceki izler "Onay bekliyor" etiketiyle listelenir. Backend ve moderasyon **yok**. |
| **Bulmaca** | Yer tutucu | Sadece "yakında" notu gösterir. |
| **Birlikte Gez** | Yer tutucu | 6 karakterlik oda kodu (karışmayan harfler), `?oda=KOD&hikaye=kilic-ali-pasa` linki, Kopyala ve (destekleniyorsa) `navigator.share` butonları. **Bu parametreleri okuyan bir kod yok**; senkron dinleme henüz yapılmadı. |

## 10. Harita stili, performans ve erişilebilirlik

- **Harita stili** (`style.js`): şeftali kara (`#f3d5b3`), soluk turkuaz su + canvas'ta üretilen dalga deseni, krem yollar, düz (extrude edilmemiş) bina tabanları, yeşil parklar. Etiketlerde Inter kullanılır, anıt adlarında Cormorant. Rotadaki duraklarla aynı ada sahip POI etiketleri `hiddenNames` ile gizlenir. Etiketler yalnızca Latin alfabesindedir (`name:tr` ya da `name:latin`).
- **Performans** (`perf.js`): `LOW_END = deviceMemory ≤ 4 || hardwareConcurrency ≤ 4`. Düşük donanımda pixel ratio 1, MSAA yok ve panellerdeki `backdrop-filter` blur yerine opak yüzey kullanılır (`html.low`). Diğer cihazlarda pixel ratio en fazla 1.5'tir. Gerçek gölge yoktur. Detay görünümü kapanınca tüm GPU kaynakları serbest bırakılır.
- **Hareket azaltma**: `prefers-reduced-motion` açıksa tüm tween'ler anında kesmeye dönüşür, deniz animasyonu donar ve CSS geçişleri kapanır.
- **Erişilebilirlik**: 44 px minimum dokunma hedefi, aria-label'lar, kadranda `role=slider`, modallarda `aria-modal`, `aria-live` ilerleme ve durum metinleri, `:focus-visible` halkası.
- **UI dili**: Butonlar hap şeklinde, kartlar 16 px köşeli ve yumuşak gölgeli. Alt paneller yarı saydam ve bulanık. "Minyatür" dokunuşu ince altın çizgiler, tek bir çintemani süsü ve kartların altın saplarıyla sınırlıdır.

## 11. README ile kod arasındaki farklar

- README eylemleri "Geçmişi Gör / İz Bırak / Birlikte Gez" olarak üç tane sayar. Kodda **dört** eylem var; **Bulmaca** (yer tutucu) sonradan eklenmiş.
- `mosque.js` başlık yorumu ~4k / ~30k üçgen der. README'deki ölçümler (harita ≈3.0k, detay ≈17.6k cami) daha güncel görünüyor. Dev modda konsola gerçek sayılar yazılır.
- `ui.js` içindeki `toast()` export ediliyor ama hiçbir yerde kullanılmıyor.

## 12. Bilinen sınırlar ve yapılmamış işler

1. Detay görünümü tek bir esere sabitlenmiş: `openDetail` her zaman `STOPS[0]` kullanır, `detailView.js` hikâyeyi (`kilic-ali-pasa.json`), sahne düzenini (hamam, çeşme, ada) ve `CENTER`'ı doğrudan içerir. Yeni bir eser eklemek için durak başına bir "sahne tanımı" (modeller, merkez, intro/geniş kamera, hikâye dosyası, `glazeTargets`) çıkarılmalı ve `createDetailView`'a parametre olarak verilmeli.
2. Yer tutucular: 7. bölümdeki gravür kartı, Geçmişi Gör'deki iki görsel ve Bulmaca.
3. İz Bırak sadece `localStorage` kullanıyor; sunucu, yükleme ve moderasyon yok (kayıt şeması hazır).
4. Birlikte Gez linki üretiliyor ama `?oda` / `?hikaye` okunmuyor; gerçek zamanlı senkron yok.
5. Hamamın konumu temsilidir. Ada ve deniz sahnesi tarihî kıyıya stilistik bir göndermedir. Ölçüler tahminidir (bkz. README "Approximations").
6. 2. ve 3. durakların tarih ve isim bilgileri yaygın kabul görmüş değerlerdir; yayından önce bir tarihçiye doğrulatılmalı.
7. `takeOver()` OrbitControls'un iç alanlarına (`_sphericalDelta`, `_panOffset`) dokunuyor. three sürümü yükseltilirse bu kırılabilir (opsiyonel zincirleme sayesinde hata vermez ama momentum durmayabilir).

## 13. Değişiklik yaparken dikkat edilecekler

- **Kamera:** Kamerayı doğrudan `camera.position = …` ya da `lookAt` ile oynatma. `flyTo` / `recenter` / `releaseCamera` kullan; yoksa pivot ile bakılan nokta ayrışır ve kullanıcı dokununca görüntü zıplar.
- **Render:** Yeni bir animasyon `animate(fn)` ile eklenmeli ve bitince `false` döndürmeli. Statik bir değişiklikten sonra `kick()` çağır; aksi hâlde ekran güncellenmez.
- **Temizlik:** Hikâye efektleri kendi oluşturdukları geometri ve materyalleri cleanup'ta dispose etmeli. Paylaşılan `mainGeo` ve `kit` materyalleri dispose **edilmemeli** (kapanışta `disposeMosque` hepsini temizler).
- **Yeni bina:** `Acc` + `T` + yardımcılar ile parçaları birleştir, `kit.toon` / `kit.hull` / `kit.line` / `kit.blob` kullan. Böylece görsel dil tutarlı kalır ve tek bir materyal seti paylaşılır.
- **Hikâye düzenleme:** Sadece JSON'u değiştirmek yeter. Koordinatlar cami yerel çerçevesinde metredir (§4). Yeni bir highlight hedefi için detailView'daki `glazeTargets`'a geometri ekle.
- **Yerleşim:** Alt panel ya da hikâye paneli yüksekliği değişince `resize()` otomatik çalışır (ResizeObserver). Kadran, `layoutDial` ile engellerden kaçar.
