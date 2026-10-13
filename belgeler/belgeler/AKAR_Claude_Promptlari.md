# AKAR · Claude Code promptları

*11 Ekim 2026 · KÖK&KOD Hackathon · Takım İnternet Kahve*

> **Önemli not:** Bu sohbetin ilk kısmı uzadığı için sistem tarafından sıkıştırıldı. Daha önce verdiğim promptların **birebir metinleri artık elimde yok**. Aşağıdakiler aynı işler için **yeniden yazılmış** sürümler. Ayrıca yeni kararlara göre güncellendi: React + TypeScript, yeni renkler, giriş sistemi, pin renkleri.
> Her başlıkta promptun durumu yazıyor: **Önceden verilmişti** (yeniden yazıldı), **Hazırlanmıştı ama kullanılmadı** ya da **Yeni**.

---

## Nasıl kullanılır

1. **0 numaralı "Ortak bağlam" bloğunu** her yeni Claude Code oturumunun başına bir kez yapıştır. Proje kurallarını öğrenmiş olur.
   - Daha iyisi: bu bloğu repoda `CLAUDE.md` dosyası olarak kaydet. Claude Code onu her açılışta kendisi okur.
2. Sonra ilgili iş promptunu ver. **Her seferinde tek prompt** ver; biri bitip test edilmeden sonrakine geçme.
3. Her promptun sonunda "Bitince" kısmı var. Claude Code'un ne teslim etmesi gerektiğini söyler. Teslim etmezse iste.
4. Sıra önerisi: 0 → 1 → 2 → 3 → 4 → 9 → 6 → 7 → 8 → 5 → diğerleri.

---

## 0 · Ortak bağlam (CLAUDE.md)

```
# AKAR — proje bağlamı

AKAR, vakıf eserlerini haritada keşfettiren, mobil öncelikli bir PWA. KÖK&KOD Hackathon
(42 Türkiye × Vakıf Katılım × Bilişim Vadisi) için yapılıyor. Final 7–8 Kasım 2026.
Çalışan MVP zorunlu: mockup kabul edilmiyor.

## Fikir
Hayrat yapıları (cami, çeşme, medrese…) halka ücretsiz hizmet verir. Akar yapıları
(hamam, han, dükkân…) gelir getirir; bu gelir hayratın bakımını ve görevlilerini karşılar.
Uygulama bunu anlatımla, 3D sahneyle ve oyunla gösterir.

## Yığın
- Vite + React + TypeScript, PWA (vite-plugin-pwa)
- MapLibre GL JS + OpenFreeMap (anahtarsız)
- three.js: GLTFLoader + DRACOLoader, CSS2DRenderer (kartlar), OrbitControls
- Supabase: Postgres, Auth, Storage, RLS
- Netlify (GitHub'dan otomatik deploy)
- İkonlar: lucide-react (size 20, strokeWidth 2) + AKAR'a özel SVG ikonlar (currentColor)

## Kurallar
- Mobil öncelikli: 390×844 tasarlanır, sonra 1440×900 masaüstü (üst çubuk 64px, sol panel 420px).
- Hedef zayıf cihaz Redmi 9T. 3D'de: gerçek zamanlı gölge YOK, sadece değişince çiz
  (render on demand), sahne kapanınca dispose, model başına en fazla 40.000 üçgen ve ~1 MB,
  pixelRatio en fazla 1.5, zayıf cihazda hazır görsel yedeği.
- Erişilebilirlik çalışan üründe olmalı: tüm butonlar klavyeyle çalışır, odak halkası
  görünür, dokunma alanı en az 44px, kontrast WCAG AA, prefers-reduced-motion'a uyulur,
  sayfa yakınlaştırması KİLİTLENMEZ (viewport'ta user-scalable=no yok).
- Her tarihî cümlenin bir güven etiketi ve kaynağı vardır:
  'dogrulanmis' | 'tarihsel_cikarim' | 'temsili'. Doğrulanmamış bilgi gerçek gibi gösterilmez.
- Kullanıcı içeriği (İz Bırak) moderasyonsuz yayınlanmaz.
- Metinler Türkçe. Her metin alanı ileride çoklu dil için dil anahtarıyla saklanır
  (ör. { tr: '...', en: '...' }). OSM etiketlerinde name yerine name:tr kullanılır.
- Oyun dilinde "yatırım, getiri, kâr, bağış, faiz" kelimeleri KULLANILMAZ.
  "Ele geçirildi" değil "keşfedildi".
- Kod modüler olsun, her özellik kendi klasöründe (src/features/<ozellik>).
- Yeni paket eklemeden önce sor. Gizli anahtarlar .env'de, repoya girmez.

## Tasarım token'ları (src/styles/tokens.css)
--bg #F3F5F5 · --surface #FFFFFF · --text #141B2B · --text-muted #4A5466 · --border #DAE1E2
--primary #25477B · --primary-dark #1B355C · --primary-light #E6ECF5 · --on-primary #FFFFFF
--gold #C9A13B (SADECE dekor ve ikon, yazıda değil) · --gold-text #8A6A16 · --error #B3261E (sadece hata)
Güven: dogrulanmis #1E6B4A / #E3F2EA · tarihsel_cikarim #8A5A00 / #FBEFD6 · temsili #5B4E86 / #ECE8F5
Pinler (vakıftaki rol): dini #2E7D32 · su #2A6FB0 · egitim #25477B · akar #9A5B2E
Boşluk 4/8/12/16/24/32 · köşe 8/12/16/999
Yazı: Inter 400/500/600. Cormorant Garamond 600 SADECE 22px+ başlıklarda,
font-variant-numeric: lining-nums ile.

## 3D model adları (Blender'dan gelen .glb ile birebir)
Parça adları her eserin .glb dosyasından okunur ve panelde "Vurgu" listesine gelir; kodda sabit liste YOK.
Örnek (Ulucami): Kubbeler_20, Sadirvan_Kubbe, Minare_1, Minare_2, Ana_Kapi, Mihrap_Duvari, Son_Cemaat.
Kamera hedefi parça adı ya da "Merkez". Kamera açıları panelde kaydedilir (azimut, eğim, mesafe, hedef).

## Şehir ve tasarım ekleri (13 Ekim)
Şehir: Bursa (ana hikâye Ulucami + Bedesten). Ayrıntı: belgeler/FRONTEND_BACKEND_NOTLARI.md
--sehir-aksan (data-sehir ile değişir: Bursa #22566E, Konya #2F6E71) SADECE rota çizgisi, durak yıldızı,
şehir bandı/deseni, ilerleme çubuğu, rozet, yükleniyor amblemi. Butonlar ve pinler değişmez.
Rota durağı = 8 kollu yıldız (36px harita / 28px liste). Desenler tasarim/desenler/, haritada desen yok.

## Çalışma şekli
Her işi küçük adımlarla yap. Bitince: değişen dosyaları listele, nasıl test edileceğini
yaz, bilinen eksikleri söyle. Emin olmadığın tarihî bilgiyi uydurma; yer tutucu koy ve
"DOĞRULANACAK" diye işaretle.
```

---

## 1 · Proje iskeleti

**Durum:** Yeni. Eski prototip vanilla JS'ti, takım React + TS'e geçti.

```
CLAUDE.md'deki bağlama göre AKAR'ın iskeletini kur.

1. Vite + React + TypeScript projesi. vite-plugin-pwa ile manifest (ad: AKAR,
   theme_color #25477B, background_color #F3F5F5) ve service worker.
2. Klasör yapısı:
   src/app (yönlendirme, düzen), src/features/{harita,eser,anlatim,sahne3d,gecmisi-gor,
   bulmaca,iz-birak,rota,profil,panel}, src/components (ortak), src/lib (supabase,
   yardımcılar), src/types, src/styles/tokens.css, src/data/ornek (sahte veri).
3. react-router ile sayfalar: / (harita), /eser/:id, /eser/:id/anlatim, /rota/:id,
   /profil, /panel/* (şimdilik boş sayfalar).
4. tokens.css'i CLAUDE.md'deki değerlerle oluştur ve global olarak yükle.
   Inter ve Cormorant Garamond'u @fontsource paketleriyle ekle (Google Fonts'a bağlı kalma).
5. src/types/index.ts içinde temel tipler:
   GuvenEtiketi, VakifRolu ('dini'|'su'|'egitim'|'akar'), Kaynak, Eser, HikayeCue,
   Rota, RotaDuragi, Bulmaca, Katki (durum: 'beklemede'|'onaylandi'|'reddedildi').
6. src/data/ornek/ içine 6 sahte eser: Kılıç Ali Paşa Camii, Kılıç Ali Paşa Hamamı,
   Tophane Çeşmesi, Nusretiye Camii, Azapkapı Sokullu Camii, Karaköy'de bir han.
   Koordinatları OSM'den al; emin değilsen "DOĞRULANACAK" yaz.
7. ESLint + Prettier, README (kurulum, çalıştırma, klasör yapısı), .env.example.
8. netlify.toml (SPA yönlendirmesi: /* → /index.html 200).

Bitince: npm run dev ile ne göründüğünü, dosya ağacını ve sonraki adımı yaz.
```

---

## 2 · Harita (3 seviye, gruplama, pinler)

**Durum:** Önceki harita promptlarının yerine geçer. Eski "Ortaköy Camii'ni haritada 3D göster" promptu bu ve 4 numaralı prompta bölündü.

```
src/features/harita içinde MapLibre haritasını kur.

- Stil: OpenFreeMap "positron" ya da "liberty". Stil JSON'u public/harita-stili.json
  olarak kopyala ki sonra Maputnik'te düzenleyebileyim.
  Bu stilde: restoran, market, otel gibi tüm POI simgelerini gizle. Yer adlarını
  ["coalesce", ["get","name:tr"], ["get","name"]] ile göster.
- Uygulama Karaköy'de açılsın (yaklaşık 41.0255, 28.9790, zoom 15).
  Konum izni verilirse kullanıcının konumuna git. İzin yoksa ya da "Evden gez"
  seçildiyse İstanbul/Karaköy'de kal.
- Eserler GeoJSON kaynağından gelsin, cluster: true, clusterRadius 50.
  * Grup baloncuğu: --primary renkli daire, içinde beyaz sayı. Pin renkleri karışmaz.
  * Tek eser: sivri kemer biçimli pin (40×48). SVG yolu:
    M20 1.5C26 5 33 11 33.5 20V33Q33.5 35.5 31.5 37L22 45.5Q20 47.2 18 45.5L8.5 37Q6.5 35.5 6.5 33V20C7 11 14 5 20 1.5Z
    Rengi eserin vakifRolu alanından: dini/su/egitim/akar (tokens.css'teki --pin-*).
    İçinde 16–18px beyaz tür ikonu.
  * Pin durumları: normal, seçili (1.25× büyük + --gold halka), tamamlandı (altın ✓),
    gizli (beyaz zemin, kesik --primary kenar, "?").
  Pinleri HTML marker yerine symbol katmanı + map.addImage ile çiz (performans için).
- Zoom düşükken (≤ 9) şehir baloncukları ("İstanbul · 42"), orta zoomda semt grupları,
  yakında pinler. Şimdilik veri sadece İstanbul olsa da yapı Türkiye geneline uygun olsun.
- Pine dokununca alttan eser kartı açılsın (mobilde bottom sheet, masaüstünde sol panel):
  eser adı (Cormorant, 26px), tür, kısa açıklama, güven etiketi, tek buton
  "Hikâyeyi başlat · X dk". Kart durumları: başlanmadı / "Devam et · 5/9" / "Tekrar göz at".
- Sağ üstte pusula butonu (kuzeye döndürür). Harita lejantı (4 pin rengi ne demek).
- Erişilebilirlik: pinlerin listesi ekran okuyucu için ayrıca bir liste olarak da
  erişilebilir olsun ("Eserler" listesi).

Bitince: 6 sahte eserle çalışan haritanın ekran görüntüsünü al (Playwright, 390×844)
ve hangi dosyaları değiştirdiğini yaz.
```

---

## 3 · Anlatım motoru (Dinle / Oku, cue listesi)

**Durum:** Önceden verilmişti (scrollytelling prototipi, Yandex ve Şehir Dedektifi ilhamı). Yeniden yazıldı.

```
src/features/anlatim içinde anlatım motorunu yaz. Bu projenin kalbi.

Veri: bir eserin hikâyesi HikayeCue[] listesidir.
type HikayeCue = {
  id: string;
  baslangic: number;          // saniye (Dinle modu için)
  metin: string;              // tek cümle
  etiket: GuvenEtiketi;
  kaynakId?: string;
  sahne: {                    // sahnenin TAM durumu; değişiklik emri değil
    kamera: { hedef: string; uzaklik: number; aci: number; yukseklik: number };
    vurgu?: string[];         // ör. ['Kubbe_Ana'] — altınla parlatılacak parçalar
    kart?: string;            // ör. 'Kart_Sinan' — açık kalacak kart
    akarAkisi?: boolean;      // Akar_0..4 boyunca altın akış çizgisi
    gravur?: string;          // varsa gravür görseli
  };
};

1. sahne.uygula(cue.sahne) adlı TEK bir fonksiyon olsun. Dinle de Oku da bunu çağırır.
   Kamera geçişleri yumuşak olsun (0.8 sn), prefers-reduced-motion açıksa anında geçsin.
2. Dinle modu: her cümle için ayrı ses dosyası varsa onu çal, yoksa Web Speech API
   (tr-TR) ile oku. Cümle bitince sonrakine geç. Oynat/duraklat, ileri/geri, hız (1×/1.25×).
3. Oku modu: ses yok. Metin cümle cümle kaydırılır. IntersectionObserver ile ekranın
   ortasına gelen cümlenin sahnesi uygulanır. Boşluk veya ↓ ile sonraki cümle.
4. Arayüz (iki mod aynı):
   - Üstte parçalı ilerleme çubuğu; parçalar tıklanabilir, o bölüme atlar.
     Son parça "Hikâye sonrası"nı açar.
   - Sol üstte ✕ (masaüstünde Esc de). Basınca ses durur, ilerleme kaydedilir,
     kullanıcı geldiği ekrana döner. Onay sorma. Mobilde geri tuşu aynı işi yapar.
   - Altta aktif cümle + güven etiketi rozeti + "Kaynak" bağlantısı.
   - Ekrana sağ/sol dokunarak geçme YOK (3D döndürmeyle çakışır).
5. İlerleme localStorage'da tutulsun (try/catch ile) ve sonra Supabase'e taşınabilsin.
   Son cümleye ulaşan "tamamlandı" sayılsın.
6. Hikâye sonrası ekranı: Geçmişi Gör, Bulmaca, İz Bırak, (rotadaysa) Sonraki durak
   ve "Eser hakkında" bağlantısı.
7. 3D henüz yoksa sahne.uygula sadece konsola yazsın; 3D gelince ona bağlanacak.

NOT (13 Ekim): Örnek veri artık Bursa Ulucami (6 cümle, Figma "4 Hikâye" ekranı ve
belgeler/AKAR_Tam_Baglam.md §0.5). Aşağıdaki Kılıç Ali Paşa listesi yalnız biçim örneği.
Örnek veri olarak src/data/ornek/ulucami-hikaye.ts dosyasına aynı biçimde yaz
(metinler doğrulanacak, etiketleri aynen kullan):
1 "Kılıç Ali Paşa Külliyesi, Tophane'de, 1580 yıllarında yapıldı." dogrulanmis · Merkez
2 "Yaptıran Kılıç Ali Paşa, Osmanlı donanmasının kaptan-ı deryasıydı. İnebahtı
  yenilgisinden sonra donanmayı yeniden kuran kişiydi." dogrulanmis · kart Kart_KilicAli
3 "Mimarı Mimar Sinan'dı." dogrulanmis · kart Kart_Sinan (kartta not: Sinan'ın bilinen
  gerçek bir portresi yoktur; görsel temsili)
4 "Caminin planı, küçültülmüş bir Ayasofya'yı hatırlatır." dogrulanmis · vurgu Kubbe_Ana
5 "Külliyenin yanında bir hamam vardı ve bugün hâlâ yaşıyor." dogrulanmis · vurgu Hamam
6 "Hamam gibi gelir getiren yapılara akar denirdi. Hamamın geliri caminin bakımına,
  aydınlatmasına ve görevlilerine ayrılırdı." tarihsel_cikarim · akarAkisi
7 "O yıllarda deniz, caminin hemen önündeydi." tarihsel_cikarim · gravür
8 "Karşıda Tophane Çeşmesi duruyor. 1732'de Sultan I. Mahmud tarafından yaptırıldı."
  dogrulanmis · vurgu Cesme
9 "Bir çeşme de vakıf hayratıdır; bakımı vakfın gelirleriyle sağlanırdı."
  tarihsel_cikarim · Kart_Cesme

Bitince: iki modu nasıl test edeceğimi adım adım yaz.
```

---

## 4 · Blender modelini (.glb) koda bağlama

**Durum:** Hazırlanmıştı, henüz kullanılmadı. Yeniden yazıldı.

```
src/features/sahne3d içinde three.js sahnesini kur ve public/models/kilic-ali-pasa.glb
dosyasını yükle (Draco sıkıştırmalı; DRACOLoader decoder dosyalarını public/draco/
altına kopyala, CDN'e bağlı kalma).

1. Sahne: arka plan --bg, bir hemisphere + bir directional ışık, GÖLGE YOK.
   Renderer: antialias, pixelRatio = Math.min(devicePixelRatio, 1.5).
2. Kamera OrbitControls ile model.getObjectByName('Merkez') noktasının etrafında dönsün
   (kamera "denize dönme" hatası böyle çözülmüştü). Sınırlar: minPolarAngle 0.3,
   maxPolarAngle 1.35, min/max uzaklık modele göre. Pan kapalı.
3. Render on demand: sadece kontrol değişince, animasyon sürerken ya da sahne
   değişince çiz. Sekme gizlenince dur. Bileşen kapanınca tüm geometri, malzeme ve
   dokuları dispose et.
4. Vurgu: sahne.vurgu listesindeki parçaların malzemesini klonla ve altın tona geçir
   (emissive --gold, yumuşak geçiş). Diğer parçalar hafif soluklaşsın.
5. Kartlar: CSS2DRenderer ile Kart_* boş noktalarına HTML kart bağla. Kart tasarımı
   React bileşeni olsun (başlık, bir cümle, güven etiketi). Ekran dışına taşarsa
   kenara yaslansın.
6. Akar akışı: Akar_0 → Akar_4 noktalarından CatmullRomCurve3 çiz; üzerinde altın
   ışık noktası hamamdan kubbeye aksın (TubeGeometry ya da Line2, düşük segment).
7. Anlatım motorundaki sahne.uygula(sahne) bu modüle bağlansın:
   kamera hedefine yumuşak geçiş + vurgu + kart + akarAkisi.
8. Kalite kademeleri: ilk 2 saniyede FPS ölç. 30'un altındaysa pixelRatio 1'e düş,
   antialias kapat. 15'in altındaysa 3D yerine hazır görüntü (public/models/
   kilic-ali-pasa.jpg) göster ve anlatım yine çalışsın.
9. Yükleme sırasında iskelet ekran ve yüzde göstergesi.

Bitince: Redmi 9T gibi zayıf bir cihazda nasıl test edileceğini (Chrome uzaktan hata
ayıklama + FPS sayacı) yaz. three.js'i sadece bu sayfada yükle (dinamik import).
```

---

## 5 · Döndürme dairesi (dial) ve çift tıklama

**Durum:** Önceden verilmişti (prototipte çift tıklama ve dairesel döndürme isteği). Yeniden yazıldı.

```
Mobilde 3D modeli iki parmakla ya da sürükleyerek döndürmek zor. Sağ alt köşeye bir
döndürme dairesi ekle.

- 72px çaplı yarı saydam daire (--surface %85, kenar --border), içinde küçük bir tutamak.
  Tutamağı daire üzerinde sürükleyince kamera Merkez etrafında yatayda döner (azimut).
- Daire klavyeyle de çalışsın: odaklanınca ← → ile 15° döner. aria-label "Modeli döndür",
  role="slider", aria-valuenow derece.
- Modele çift dokununca/tıklayınca: dokunulan parçaya yakınlaş. O parçanın bir kartı
  varsa aç. Tekrar çift dokununca başlangıç görünümüne dön.
- İlk açılışta bir kez, 3 saniyelik ipucu: "Döndürmek için daireyi kaydır".
  Bir kez gösterildiyse tekrar gösterme.
- Anlatım çalışırken kullanıcı daireyi kullanırsa anlatım kamerası duraklasın,
  "Anlatım görünümüne dön" butonu belirsin.

Bitince: dokunma ve klavye testlerini yaz.
```

---

## 6 · Rota öner ve 1-2-3 duraklı rota

**Durum:** Önceden verilmişti. Yeniden yazıldı; rota oluşturucu kapsama alındı.

```
src/features/rota.

1. Varsayılan serbest keşif. Haritada "Rota öner" butonu → alttan sayfa açılır:
   - Hazır rotalar listesi (kart: ad, durak sayısı, süre, mesafe).
   - "Bana rota oluştur": süre (30/60/90 dk) + ilgi alanları (cami, su, hamam ve han,
     eğitim). Seçime göre yakındaki eserlerden 2–4 duraklı rota üret. Mesafe için
     haversine yeterli; gerçek yürüyüş yolu gerekmez.
2. Rota açılınca: duraklar haritada 1-2-3 numaralı yıldızlar, aralarında --sehir-aksan kesikli
   çizgi (line-dasharray), üstte ilerleme çubuğu "1/3". Harita tüm rotayı kadraja alır.
3. Durağa gelince (konum 40 m içinde ya da "Evden gez"de dokununca) o eserin hikâyesi
   başlar. Hikâye bitince durak tamamlandı, sonraki durak vurgulanır.
4. Gizli durak: bulmaca çözülünce haritada beliren durak (gizli pin durumu).
5. "Durağı atla" seçeneği (kapalı ya da ibadet vakti).
6. Rota bitince "Rota tamamlandı" ekranı: süsleme çizgisi, rozet, paylaş butonu.
7. Örnek rota "Hanlar Bölgesi Vakıf Yürüyüşü": Ulucami (1399) → Koza Hanı (1491) →
   Orhan Gazi Camii (1339). Durak işareti 8 kollu yıldız (Figma "Rota durağı"), çizgi --sehir-aksan.

Bitince: Evden gez modunda rotayı baştan sona nasıl deneyeceğimi yaz.
```

---

## 7 · Hamam ve çeşme hikâye bölümleri

**Durum:** Bekleyen işti, şimdi yazıldı.

```
Kılıç Ali Paşa Hamamı ve Tophane Çeşmesi için ayrı kısa hikâyeler ekle
(her biri 5–6 cümle, aynı HikayeCue yapısıyla, src/data/ornek/ altında).

Kurallar:
- Her cümleye güven etiketi koy. Kesin olmayan her bilgiyi 'tarihsel_cikarim' yap.
- Rakam, tarih ya da vakfiye bilgisi UYDURMA. Emin değilsen cümleyi yaz ama
  "DOĞRULANACAK:" önekiyle işaretle; içerik sorumlusu (Talha) kontrol edecek.
- Hamam hikâyesi akarı anlatsın: hamam gelir getirir → gelir caminin bakımına,
  aydınlatmasına ve görevlilerine gider. Sahnede akarAkisi: true.
- Çeşme hikâyesi hayratı anlatsın: halka ücretsiz su, bakımı vakfın gelirleriyle.
  "Lale Devri" ifadesini KULLANMA (1732, Lale Devri'nden sonra).
- Kamera hedefleri: Hamam / Kart_Hamam, Cesme / Kart_Cesme.

Bitince: cümleleri ve etiketlerini tablo olarak göster ki kontrol edeyim.
```

---

## 8 · Geçmişi Gör

**Durum:** Önceden konuşulmuştu (gravür ↔ bugün geçişi). Prompt olarak yeni yazıldı.

```
src/features/gecmisi-gor. Üç mod:

1. Karşılaştırma kaydırıcısı: solda gravür, sağda bugünkü fotoğraf, ortada sürüklenen
   çizgi. Klavyeyle ← → çalışsın (role="slider"). Altında yıl, kaynak ve lisans satırı.
2. "Tozu sil": gravür üstte bulanık/tozlu bir katmanla örtülü; parmakla sürtünce canvas
   üzerinde silinir, alttaki eski görüntü ortaya çıkar. %60 silinince kalanı kendisi
   açılsın. Hareket azaltma açıksa düz geçiş.
3. Yerinde mod: arka kamerayı aç (getUserMedia, facingMode environment), üstüne gravürü
   yarı saydam bindir (opaklık kaydırıcısı). Kullanıcı açıyı hizalayıp fotoğraf çeker;
   yan yana kıyas görseli oluşur ve paylaşılabilir (Web Share API, yoksa indir).
   Kamera izni reddedilirse nazik bir mesaj ve evden mod. HTTPS şart.
   Buna "AR" deme; "kamera üstünde eski görüntü" de.
4. Gravürü olmayan eser için "Bu eserin eski görüntüsü henüz yok" durumu.

Görsellerin her birinde kaynak ve lisans alanı zorunlu (veri modelinde).

Bitince: üç modun telefonda nasıl test edileceğini yaz.
```

---

## 9 · Bulmaca

**Durum:** Önceden konuşulmuştu (Questo ve izi.travel'dan esinlenme). Prompt olarak yeni yazıldı.

```
src/features/bulmaca. Bir esere bakarak detay bulma oyunu. Doğru cevap hikâyenin
devamını ya da gizli durağı açar.

Bulmaca türleri (veri modelinde tur alanı):
- 'secmeli': 4 seçenek
- 'kisa_cevap': serbest yazı; kabul edilen yazımlar listesi (en fazla 10). Karşılaştırmada
  Türkçe küçük harfe çevir (toLocaleLowerCase('tr')), boşluk ve noktalama at,
  rakam/yazı eşdeğerini kabul et ("2" = "iki").
- 'modelde_bul': 3D modelde doğru parçaya dokun (ör. "Şerefeyi bul" → Minare).
- 'surukle': akar bulmacası. Gelir jetonlarını bakım / aydınlatma / görevliler
  kutularına sürükle. Klavye alternatifi şart.
- 'siraya_diz': eserleri yapım yılına göre sırala.

Mekanik:
- İki kademeli ipucu (önce yönlendirme, sonra neredeyse cevap). Puan kesmek yok.
- Her bulmacanın "evden" karşılığı olsun (fotoğrafa bakarak çözülebilsin).
- Yanlışta sarsma animasyonu + "Tekrar dene". Doğruda kısa kutlama + açılan içerik.
- Cami içinde görev yok.

Örnek veriler ekle ama cevaplarını "DOĞRULANACAK" diye işaretle (sahada kontrol edilecek):
Kılıç Ali Paşa: minarenin şerefe sayısı, planın hatırlattığı yapı (Ayasofya), akar sürükleme.
Tophane Çeşmesi: hangi cephelerde lüle var, gravürle hizalama.
Nusretiye: "Nusret" ne demek, final: üç eseri yapım sırasına diz.

Bitince: her türün nasıl test edileceğini yaz.
```

---

## 10 · İz Bırak ve moderasyon (Supabase + RLS)

**Durum:** Yeni (önceden sadece tasarımı konuşulmuştu).

```
Supabase şemasını ve İz Bırak özelliğini kur.

1. supabase/migrations/ altında SQL:
   tablolar: eserler, kaynaklar, hikaye_cuelari, rotalar, rota_duraklari, bulmacalar,
   gorseller (lisans alanı zorunlu), katkilar, kullanici_ilerleme, profiller (rol: 'kullanici'|'admin').
   Metin alanları jsonb ({ "tr": "...", "en": "..." }).
2. RLS:
   - Herkes yayınlanmış eserleri, cue'ları, rotaları okuyabilir.
   - Sadece admin eser/cue/rota yazabilir.
   - katkilar: giriş yapan kendi katkısını ekler (durum her zaman 'beklemede' başlar,
     istemci değiştiremez). Herkes sadece 'onaylandi' olanları görür. Kişi kendi
     bekleyenini görür. Durumu sadece admin değiştirir.
3. Storage: katki-fotograflari kovası. Yükleme öncesi istemcide: sadece jpeg/png/webp,
   en fazla 5 MB, 1600px'e küçült, EXIF (konum bilgisi dahil) temizle.
4. İz Bırak formu: fotoğraf (isteğe bağlı) + kısa anı (10–280 karakter) + KVKK onay
   kutusu. Gönderince "Onay bekliyor" ekranı.
5. Eserin "Yaşayan hafıza" bölümü: onaylı katkılar, en yeni üstte.
6. Rapor et butonu (onaylı içerik için).

Bitince: RLS kurallarını test eden SQL ya da script ver (anonim, kullanıcı, admin rolleriyle).
```

---

## 11 · Giriş (şifresiz)

**Durum:** Yeni (karar 11 Ekim'de verildi).

```
Supabase Auth ile şifresiz giriş.

- Kullanıcı önce misafir gezer. Giriş sadece şunlarda istenir: İz Bırak, beğeni,
  kalıcı rozet/puan, cihazlar arası rota.
- Giriş isteği ilk hikâye bitince bir kez çıkar. "Şimdi değil" denirse ilk rozette
  bir kez daha çıkar, sonra çıkmaz.
- Yollar:
  1. Google ile giriş (signInWithOAuth).
  2. E-posta ile 6 haneli kod (link DEĞİL):
     signInWithOtp({ email, options: { shouldCreateUser: true } })
     → kullanıcı kodu girer → verifyOtp({ email, token, type: 'email' }).
     Kod giriş alanı: 6 kutu, yapıştırmayı destekler, autocomplete="one-time-code",
     60 sn sonra "Kodu tekrar gönder".
- Supabase e-posta şablonunda {{ .Token }} kullanılacak (bunu README'ye not et).
  Gönderim için Resend SMTP bağlanacak; ayarlarını README'ye yaz.
- Misafirken localStorage'da biriken ilerleme girişten sonra hesaba taşınsın.
- Profil: arama çubuğundaki avatardan açılır. Bölümler: Keşfettiklerim, Rozetler,
  Paylaşımlarım, Rotalarım, Ayarlar (dil, ses hızı, hareket azaltma, çıkış, hesabı sil).

Bitince: giriş akışının test adımlarını yaz.
```

---

## 12 · Yönetim paneli

**Durum:** 13 Ekim'de yeniden tasarlandı (Figma "🛠 Yönetim paneli"). Şema: belgeler/FRONTEND_BACKEND_NOTLARI.md §1–§3.

```
/panel altında sadece admin rolüne açık yönetim paneli (masaüstü öncelikli).
Sol menü: Eserler · Rotalar · Kartlar · Katkılar · İçe aktar.

A. Eser ekleme akışı (tek sayfa, adımlı; 3D önizleme her adımda SAĞDA sabit):
 1 Model: .glb yükle → önizleme açılır, parça adları okunur (model.parcalar[]).
   Modelin güven etiketi. 3D yoksa "Fotoğrafla devam et".
 2 Bilgiler: ad tr/en, yapım yılı, yaptıran, mimar, il, ilçe, tür, rol (hayrat/akar),
   akar bağı (başka esere), adres (konum geocoding, haritadan düzeltilebilir), tanım tr/en,
   kapak görseli + alt metin (zorunlu).
 3 Kaynaklar: eserin kaynak listesi (ortak kaynak tablosundan seç ya da yeni).
 4 Hikâye: cümle satırları, sürükleyerek sırala. Her satırda:
   - Açı: "Açıyı kaydet" önizlemedeki OrbitControls durumunu (azimut, eğim, mesafe, hedef)
     ve 96px küçük resmi kamera_aci tablosuna yazar; satırda daire görünür, tıklayınca
     sahne o açıya döner. Boş açı = önceki cümlenin açısı.
   - Kart +: pencere (Yeni kart | Var olandan seç; Fotoğraf | Bilgi kartı; başlık tr/en,
     kısa metin, kaynak, güven). Kart sahibi bu eser olur.
   - Vurgu: model.parcalar[] listesinden; seçilince önizlemede parlar.
   - Satır açılınca: kaynak (eserin listesinden, ZORUNLU), güven, ses tr/en, altyazı.
 5 Yayın: eksik listesi. Kaynaksız cümle ya da modelde olmayan vurgu → Yayınla kapalı.
   EN eksikleri uyarı.
B. Kartlar: tüm kartlar eser eser gruplu, kullanıldığı cümleler yazılı; düzenleme her yerde güncellenir.
C. Rota düzenle: duraklar eser aramasıyla eklenir, sürükleyerek sıralanır; süre/mesafe otomatik;
   durak başına bulmaca (soru, 3 seçenek, doğru, açıklama, kaynak) ve Geçmişi Gör (eski görsel,
   tarih, kaynak, hizalama açısı).
D. İçe aktar: JSON/CSV → alan eşleme → doğrulama (konum bulunamadı, tür belirsiz, kopya)
   → hepsi taslak + tier1. Eşleşme ad + ilçe; var olanda yalnız boş alanları doldur.
E. Katkı moderasyonu: bekleyenler, Onayla / Reddet (sebep).

Bitince: demo için "yeni eser ekle → hikâyeye açı ve kart bağla → yayınla → haritada
anında görünür" akışını nasıl göstereceğimi yaz.
```

---

## 13 · Birlikte Gez (güvenli sosyal özellik)

**Durum:** Önceden konuşulmuştu ("şu an kim Sultanahmet'te" fikri güvenlik yüzünden bu hale getirildi). Prompt olarak yeni yazıldı.

```
src/features/birlikte-gez. Tanıdıklarla aynı anlatımı birlikte dinleme.

- Kullanıcı "Birlikte gez" der → tek kullanımlık davet linki oluşur (24 saat geçerli,
  en fazla 6 kişi). Link sadece paylaşılan kişilere açık; herkese açık oda listesi YOK.
- Supabase Realtime kanalı ile: oda sahibinin anlatımdaki konumu (cue id) ve
  oynat/duraklat durumu diğerlerine yansır. Diğerleri "takip et" ya da "kendi hızımda"
  seçebilir.
- Konum paylaşımı YOK. Yabancılarla eşleştirme YOK. Sadece takma ad ve avatar görünür.
- Oda sahibi birini çıkarabilir. Oda süresi bitince kanal kapanır, kayıt tutulmaz.
- Erişilebilirlik: katılan/ayrılan bildirimleri aria-live ile duyurulsun.

Bitince: iki tarayıcı sekmesiyle nasıl test edileceğini yaz.
```

---

## 14 · Eğitici mini özellikler (telefonda da çalışan)

**Durum:** Yeni (eğitici özellikler sohbetinden).

```
Hafif, 3D gerektirmeyen eğitici parçalar ekle (SVG + CSS, telefonda akıcı):

1. Akar şeması: hamam → gelir → bakım / aydınlatma / görevliler. Sürükle-bırak ile
   kullanıcı kendisi kurar. Klavye alternatifi şart.
2. Yapı parçaları diyagramı: cami silüeti SVG'si; kubbe, yarım kubbe, minare, şerefe,
   revak, avluya dokununca kısa tanım kartı açılır.
3. Zaman şeridi: 1580 (Kılıç Ali Paşa) → 1732 (Tophane Çeşmesi) → 1826 (Nusretiye).
   Kaydırınca ilgili eser vurgulanır.
4. Terim kartları: akar, hayrat, vakfiye, mütevelli. Her biri bir cümle + kaynak.
5. Kıyı çizgisi animasyonu: "O yıllarda deniz caminin önündeydi" için eski ve bugünkü
   kıyı çizgisi SVG geçişi (Temsili etiketiyle).
6. İlk açılış (onboarding): 3 ekran, atlanabilir. Konum izni burada istenmez,
   ilk gerektiği anda istenir.

Bitince: her parçanın hangi ekranda nasıl açıldığını yaz.
```

---

## 15 · Gerçek görünüm (fotoğraftan 3D)

**Durum:** Yeni (stilize model "çizgi film gibi" eleştirisinden sonra).

```
Eser detayına "Hikâye / Gerçek" geçişi ekle.
- Hikâye: mevcut stilize .glb (anlatım, vurgu, akar). Etiket: Temsili canlandırma.
- Gerçek: eserin bugünkü hâli, fotoğraflardan. Etiket: "Bugünkü kayıt".

Gerçek görünüm iki yolla desteklensin (eser verisinde hangisi varsa):
1. Gaussian splat (.spz ya da .ksplat): yalnızca kullanıcı "Gerçek"e basınca dinamik
   yüklensin. Uygun, bakımı süren, lisansı açık bir web splat görüntüleyici öner,
   eklemeden önce bana sor. Yükleme yüzdesi göster. Zayıf cihazda (FPS < 20)
   otomatik olarak 2. yola düşsün.
2. Fotoğraf döndürme: eserin etrafında çekilmiş 24–36 fotoğraf (webp, 1280px).
   Parmakla yatay kaydırınca sıradaki kare gösterilsin, kaydırma sonrası hafif atalet.
   İlk kare hemen, diğerleri arka planda yüklensin. Klavye ← →.
Her iki yolda: kaynak/çekim tarihi ve fotoğraftaki insanlar için bulanıklaştırma notu.

İlk pilot: Tophane Çeşmesi (küçük, etrafı açık). Dosyalar gelene kadar yer tutucu kullan.
```

---

## 16 · Performans ve son kontrol

**Durum:** Yeni (Redmi 9T'deki 5 FPS sorunundan çıkan kurallar).

```
Uygulamanın tamamını zayıf cihaza göre denetle ve düzelt:
- Lighthouse (mobil) raporu çıkar; Performance ve Accessibility 90+ hedef.
- three.js, MapLibre ve splat görüntüleyiciyi sadece gereken sayfada dinamik yükle.
- Görseller webp/avif, lazy loading, doğru boyut. Fontlar sadece kullanılan ağırlıklar.
- Service worker: uygulama kabuğu + Tophane rotasının verisi, sesleri ve modeli
  çevrimdışı çalışsın (demo günü internet kötü olabilir).
- Hata durumları: internet yok, konum izni yok, kamera izni yok, model yüklenemedi,
  zayıf cihaz. Her birinin dostça bir ekranı olsun.
- Erişilebilirlik turu: klavyeyle tüm demo yolu (harita → eser → anlatım → bulmaca →
  İz Bırak) baştan sona yapılabilmeli; ekran okuyucuyla anlatım metni okunabilmeli.

Bitince: bulduğun sorunların ve düzelttiklerinin listesini ver.
```

---

## Eski promptlar hakkında (artık kullanılmayacak)

Bu promptlar önceden verilmişti ama kararlar değiştiği için **yeniden kullanılmamalı**:

- **"Haritada sadece vakıf eserleri 3D olsun, Ortaköy Camii ile başla":** İlk deneme. Tek ve hafif hero model kararıyla 2 ve 4 numaralı promptlara dönüştü. İlk gerçekçi demo Redmi 9T'de 5 FPS vermişti.
- **Galata Minyatürü / "2. plan" (2D illüstrasyonlu harita, tıklayınca gerçekçi 3D):** Minyatür üslup referansıydı. Tasarım yönü sonradan bırakıldı. Yeni yön "Çini" paleti ve tokens.css.
- **Minyatür paletli vanilla JS prototipi (akar-app.netlify.app):** Fikri şekillendirmek içindi. Yeni ürün React + TS ile sıfırdan kuruluyor.
- **Revzen / cam ("Liquid Glass") arayüz fikirleri:** Tasarım yönü bırakıldı.
