# PROMPT — Harita mobili, Geçmişi Gör, rota, profil ve açılış prototiple birebir (31 Ekim 2026)

Bu dosyayı Claude Code'a (ya da başka bir kodlama asistanına) olduğu gibi ver. Önce bu dosyayı, sonra `AGENTS.md` ve `CONTRIBUTING.md`'yi okusun.

---

AKAR projesi (KÖK&KOD, İnternet Kahve). Repo kökü: `akar-app`. Final 7–8 Kasım 2026; jüri büyük ihtimalle telefonda deneyecek.
Önce `AGENTS.md` ve `CONTRIBUTING.md`'yi oku, sonra `docs/documents-context/ENTEGRASYON_29EKIM.md`, `docs/documents-context/YAPILACAKLAR.md`,
`docs/API-HANDOFF.md` ve `docs/documents-context/design/desenler/BENIOKU.md`'ye göz at.

## KURALLAR
- Commit yazarı yerel git kimliği. Commit ve mesajlarda araç/ajan markası ya da `Co-Authored-By` olmayacak.
- `git add -A` / `git add .` yok; dosyaları adıyla ekle. Dosya silme yok.
- PR açma. Her iş adımı bitince `feat/harita-prototip` dalına commit et (mesaj İngilizce, `feat(web): …` biçiminde); en sonda push'u kullanıcıya bırak, ona `git push` yazmasını söyle.
- **Esere, şehre ya da rotaya özel değer koda yazılmaz.** Her şey veri dosyalarından gelir (`docs/documents-context/eserler/…`, `veri/sehir/<il>.json`, `3d/model.json`). Yeni eser/şehir kod değişmeden eklenebilmeli.
- Arayüz metinleri `apps/web/src/lib/messages/site.ts` ve `shell.ts` kataloğuna TR + EN eklenir (`t("…")`); `tr ? "…" : "…"` yazma.
- Ortak tipi (`packages/domain`) ya da API şemasını değiştirirsen `docs/API-HANDOFF.md`'ye bir satır ekle.
- Dokunma: `apps/web/public/tanitim/` (başkasının işi) ve `docs/documents-context/design/test-redmi9t*` (prototip kopyaları).

## BAŞKA BİRİYLE ÇAKIŞMA (önemli)
Talha aynı anda kendi dalında (`talha/eser-sayfalari-prototip`) şu ekranları yapıyor: **3D parça kartı, Dinle/Oku, Eser hakkında, Yaşayan hafıza, Bulmaca.**
Bu ekranlara ve şu dosyalara **dokunma**: `site-detail.tsx`, `scene.tsx`, `model-viewer.tsx`, `model-stage.tsx`, `story-panel.tsx`, `story-photo-card.tsx`, `part-card.tsx`, `about-reading.tsx`, `site-tasks.tsx`, `memory-actions.tsx`, `interaction-modals.tsx`.
`akar-app.tsx` ve `design.css` ortak: gerekirse küçük ve ayrı bloklar halinde değiştir, var olan satırları yeniden düzenleme (biçimlendirme dahil), yeni CSS'i dosyanın sonuna kendi başlıklı bölümüne ekle. Böylece iki dal birleşirken çakışma çıkmaz.

## ÇALIŞTIRMA
- Ürün (gerçek içerikle): repo kökünde `npm run dev:content` → http://127.0.0.1:3000
  - Düz `npm run dev` örnek veriyle (6 eser) açılır; prototiple karşılaştırma için KULLANMA.
  - 3000'de kullanıcının açtığı bir sunucu varsa kapatma; onu kullan. Kendin açtığını işin sonunda kapat.
- Prototip `docs` dalında: `docs/documents-context/design/test-redmi9t-v2/` (`index.html`, `app.js`, `app.css`, `temalar.css`).
  - Sunucu genelde 8091'de açıktır: http://localhost:8091/index.html?tema=buzlu#/ (ürüne **buzlu** tema taşınıyor).
  - Kapalıysa ayrı bir kopyada aç: `git worktree add ../akar-proto origin/docs`, o kopyada `bash docs/documents-context/design/test-redmi9t-v2/sunucu.sh 8091`. Kendi çalışma kopyanda `docs` dalına GEÇME.
- Playwright ile ölçüm:
  - Chromium bayrakları: `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`
  - Sayfa: `locale="tr-TR"` (yoksa ürün İngilizce açılır), `device_scale_factor=2`.
  - Açılış kartını atlamak için iki tarafta da: `add_init_script("localStorage.setItem('akar.karsilama','1')")` (açılış kartını incelerken bunu koyma).
  - **Telefon: 390×844** (`is_mobile=True`, `has_touch=True`). Masaüstü: 1512×772.

## GÖREVLER (sırayla; her biri bitince commit)

### 1. Harita ekranı — telefon (390×844), en öncelikli
Masaüstü harita ekranı prototiple eşlendi (son commit'ler). Telefonda henüz karşılaştırılmadı. Prototipte `#/` ekranı:
üst arama/şehir çubuğu, alt sayfa (sheet) ve tutamağı (açık/yarım/kapalı yükseklikler, sürükleme), liste satırları, «Tümünü gör», sekmeler (Eserler / Rotalar),
eser seçince açılan kısa kart (site-peek), harita kontrolleri (+/−, konum, 3D/2D kadranı) ve konumları, seçili pin, pin adları, «Yakında» şehir işaretleri.
Dosyalar: `heritage-map.tsx`, `map-controls.tsx`, `explore-panel.tsx`, `site-peek.tsx`, `side-sheet.tsx`, `lib/bottom-sheet.ts`, `lib/map-pins.ts`, `lib/map-models.ts`.

### 2. Geçmişi Gör — masaüstü ve telefon
Prototip: `app.js` → `gecmisSayfa`, `#/gecmis/<eser>`, `#/kamera`, `#/cekildi`. Ürün: `history-view.tsx`, `history-camera.tsx`, `viewpoint-map.tsx`, `lib/history-pair.ts`.
Ana eski fotoğraf üstte, diğerleri altta; seçili fotoğrafın çekim noktası ve açısı haritada (masaüstünde mini harita hep açık, telefonda isteğe bağlı);
«Bugün» kartı ve bugünkü eşi; kamera kaplaması (eski fotoğrafı yarı saydam üstüne koyup hizalama), çekildi ekranı; künyeler ve güven etiketi
(TrustTag = prototipteki `.guven`: nokta + ⓘ, dokununca «Bu bilgi nereden geliyor?»). Bildirim/yönlendirme yok: kullanıcı yürüyüp kendisi hizalar.

### 3. Rota önizleme ve rota akışı
Prototip: `rotaOnizleme`, `#/rota/<id>`, rota çizgisi animasyonu (altın yay, `line-gradient` + `line-progress`, sikkeler), numaralı yıldız duraklar, «Rotayı başlat»,
duraklar arası geçiş, detay panelindeki «Sonraki durak» (üründe var; `completion.nextStop`). Ürün: `explore-panel.tsx` (`RoutePreview`), `story-flow-map.tsx`, `heritage-map.tsx`.
Not: «Rotama ekle / Yanındayım» detay panelinden bilerek kaldırıldı; geri ekleme.

### 4. Profil (Mirasım)
Prototip: `profilSayfa`, `#/profil`. Ürün: `profile-admin.tsx` (`Profile`). Kayıtlılar, okunanlar, rozetler, izlerim, dil seçimi; boş durumlar.
Not: ziyaret (`visit`) şu an hiçbir yerden kaydedilmiyor (Yanındayım kaldırıldı; otomatik kayıt Burak'ın işi). Ziyarete bağlı rozet/sayı boş görünürse hata sayma, raporda yaz.

### 5. Açılış, karşılama kartı ve şehir seçimi
Prototip: `karsilamaGoster`, `karsilamaKapat`. Ürün: `loading-screens.tsx`, `welcome-card.tsx`, `city-scenes.tsx`, `lib/city-identity.ts`.
31 Ekim'de Bursa, Hatay ve Konya'ya yeni elle çizilmiş desenler bağlandı ve `kimlik.desen_olcek` eklendi (Hatay 4,3). Her şehrin açılışta ve şehir seçiminde
desenini doğru ölçek ve renkte gösterdiğini ölç (`--city-pattern-scale`, `--sehir-desen-olcek`). «İnteraktif demo» etiketi bilerek kaldırıldı.
Harita telif yazısı (sağ altta ⓘ, OpenStreetMap/OpenFreeMap) lisans gereği kalmalı; yalnız prototipteki yere ve boyuta getir.

## YÖNTEM (gözle değil, ölçerek)
1. Her bileşen için iki sayfada da `getComputedStyle` dök: background, backdrop-filter, box-shadow, border, radius, font, line-height, padding, kutu ölçüleri.
   Prototipin CSS'i `app.css` + `temalar.css` (buzlu tema `[data-tema]` altında). Ürününki `apps/web/src/app/design.css` + `globals.css` + `packages/design-tokens/tokens.css`.
2. Değerleri birebir taşı, sonra yeniden ölç. Kutu ölçüleri piksel piksel aynı olmalı.
3. Renkte aynı noktalardan piksel örnekle.
4. Haritada ve 3D'de aynı açıdan çek, bölge bölge ortalama parlaklık ölç (PIL `ImageStat`); farkı `ImageChops.difference` ile eşikleyip nerede toplandığına bak.
5. Her ekran için yan yana ekran görüntüsü kaydet. «Aynı» demeden önce ölç.
6. Taşma: her ekranda `scrollWidth > clientWidth` olan kap kalmasın (yatay kaydırma çubuğu). Telefonda `document.documentElement.scrollWidth <= innerWidth`.
7. Dokunma hedefleri telefonda en az 44×44 px.

## BİLİNEN TUZAKLAR (yeniden araştırma)
- CSS değişkeni tanımlandığı yerde çözülür. Şehir rengi ve deseni `.app-shell` üzerine yazılıyor; `--sehir-aksan`'dan türeyen yeni token'ı `:root`'ta bırakma, `tokens.css`'teki gibi `.app-shell`'e de yaz.
- Desen maskeleri `calc(<px> * var(--sehir-desen-olcek, 1))` ile boyutlanıyor; yeni bir desenli yüzey eklersen aynısını kullan.
- Detay ekranında `.side-panel` dolgusu 0; panelin `::after` süs bandı negatif kenar boşluğuyla taşabilir. Yeni öğe ekleyince yatay taşmayı ölç.
- Harita katmanında (`lib/map-models.ts`): gölge haritası ekran dışında tam derinlik aralığıyla çiziliyor, kameraya MapLibre matrisinden göz konumu veriliyor. Bunları bozma; model koyu görünürse ilk şüpheli kamera ve gölge ayarlarıdır.
- Ürün three.js 0.186, prototip 0.160. 0.186'da `PCFSoftShadowMap` yok (PCF'e düşer).
- Buzlu cam: iç içe `backdrop-filter`'da tarayıcı içtekini bulanıklaştırmaz. Prototipte buzlu panelin içindeki öğenin üründeki karşılığı bulanıklıksız olmalı. Test tarayıcısı GPU'suz; kullanıcının ekran görüntüleriyle de doğrula.
- Ürünün genel `button:active { transform: translateY(1px) }` kuralı basınca kaydırır; prototipte kıpırdamayan yerlerde kapat.
- Harita testleri (`naming a city`, pin konumları) GPU'suz tarayıcıda zamanlamaya takılabilir; tek başına çalıştırıp ayır. `admin-layout` testi eski koddan beri kırık.
- Örnek veri bekleyen e2e testleri `dev:content` açıkken başarısız olur; bu uygulama hatası değildir.

## BİTİRİNCE
- `npm run typecheck` ve `npm test` (159 test geçiyordu; yeni mantık eklediysen birim testini de yaz).
- E2E: `dev:content` sunucusunu kapat, sonra `CI=1 npx playwright test` (örnek veriyle kendi sunucusunu açar; masaüstü + mobil). Değişen akışların testlerini yeni akışa göre güncelle.
- Rapor: değişen dosyalar, her ekran için «aynı / farklı kalan» listesi ve yan yana ekran görüntüleri (masaüstü + telefon), kullanıcının karar vermesi gereken noktalar.
- `feat/harita-prototip` dalına commit et ve kullanıcıya `git push` yazmasını söyle. **PR açma.**
