# Prototipten ürüne aktarım: çalışma notu (1 Kasım 2026)

**Dal:** `muhammedtalay/prototip-aktarimi`, `origin/main` 606c184'ten (PR #83, `feat/harita-prototip` birleşmiş hali).
**Amaç:** prototipte (`docs` dalı, `design/test-redmi9t-v2/`) ve `feat/harita-prototip`'te olup main'de eksik kalan tasarımları tamamlamak. Main'e doğrudan push yok; iş bu dalda yapılır, PR ile girer.

**Kıyas için yerel adresler:**
- Prototip: `bash docs/documents-context/design/test-redmi9t-v2/sunucu.sh 8090` (`.prototip` çalışma kopyasından) → http://localhost:8090/index.html
- `feat/harita-prototip`: http://localhost:3001 (`npm run dev:content`, port 3001)
- Bu dal: http://localhost:3000 (`npm run dev:content`)

**Prototipin son hali:** `prototip-v2-son` etiketi (GitHub'da). `docs` dalının main'de olmayan iki commit'i: Yaşayan hafıza masaüstü yeniden tasarımı (f87457d) ve bulmacadan «3D modelde bul» (79e3b5d).

## 1. Şehir desenleri ve amblemleri

**Durum:** dosyalar main'de (`apps/web/public/desenler/`), şehir kayıtları (`veri/sehir/<il>.json → kimlik`) yeni dosyaları gösteriyor, yerel demo içerik (`dev:content`) doğru.

| İl | Desen | Amblem |
|---|---|---|
| Bursa | `desen-bursa-kesik-gecme.svg` | `amblem-bursa.svg` |
| Konya | `desen-konya-yildiz-gecme.svg` | `amblem-konya.svg` (küçük: `amblem-konya-kalin.svg`) |
| Hatay | `desen-hatay-yildiz-kafes.svg` (ölçek 4.3) | `amblem-hatay.svg` |

**Eksikler:**
- [ ] **Canlı veritabanı (Tamer):** `GET https://akar-api.vercel.app/v1/cities` 1 Kasım'da hâlâ eski kimliği veriyor: Bursa `desen-bursa-sekiz-yildiz.svg`, Konya `desen-konya-on-iki-gulbezek.svg`, ikisinde de amblem yok; Hatay `identity: null`. Canlıda içerik içe aktarması (`import-demo`) yeniden çalıştırılınca düzelir; kod değişikliği gerekmez.
- [x] **API'siz demo verisi:** `packages/api-client/src/seed.ts` Bursa ve Konya'da eski desenleri veriyordu, amblem yoktu. Yeni desen ve amblemlere geçirildi; `tests/loading-screens.spec.ts` buna uyduruldu. (Seed'de Hatay eseri olmadığı için Hatay kaydı eklenmedi.)

## 2. Ekran ekran kıyas (1 Kasım, masaüstü 1440 px ve mobil 390 px)

Prototip (8090) ile bu dal (3000) yan yana açıldı; eski notların (`PROTOTIP_URUN_FARKI.md`, `ENTEGRASYON_29EKIM.md`, main'deki `YAPILACAKLAR.md` «Kalan farklar») her maddesi kodda ya da ekranda denetlendi.

**Aynı (iş yok):** harita (üst çubuk, il rozeti, Eserler | Rotalar, rol çipleri, konum kipi, pusula, pinler, mobil alt sayfa), eser detayı (panel, Fotoğraf | 3D, galeri, İçini göster, Temsili etiketi), anlatım masaüstü (cümle listesi, oynatıcı, ilerleme çubuğu), bulmaca (soru, iki ipucu, «3D modelde bul» modeli 3D'de açar), parça kartı (fotoğraf okları, noktalar, ← →), rota listesi ve rota detayı (yıldız numaralar, kesik çizgi, «Evden gez · konum gerekmez»), profil (ürünün fazladan ayar kutusu bilinçli), gece teması (`data-theme="night"`, `akar-style-gece.json`), tanıtım sayfasının bağlantıları (`/#view=…`).

### Yapılacaklar (bizim)

1. [x] **Yaşayan hafıza, yeni tasarım** (2 Kasım: sayfa yapıldı — masaüstü fotoğraflı kapak ve sayılar, yapışık süzgeç çubuğu, davetle başlayan üç sütunlu duvar, «Bu eserde» bağlantıları; mobil başlık, süzgeç, sabit «İz Bırak»; «Tümünü gör» bütün eserlerin izleri, şehir ve eser seçicisiyle. Masaüstünde İz Bırak formu iki sütun (solda büyük fotoğraf alanı). Eser galerisinde resmî fotoğraflardan sonra ziyaretçi fotoğrafları (ad, «İnceleniyor»/«Örnek»), sonda «Fotoğrafını ekle»; araç satırı «13 fotoğraf · 1 ziyaretçiden». Prototipin `ornek-hafiza.json` örnekleri ürüne taşınmadı (kararı gereği).) (prototip f87457d; Figma masaüstü `82:2735`, tüm izler `86:2733`, mobil `108:2765`; ayrıntı prototip `BENIOKU.md` «30 Ekim · Yaşayan hafıza ve İz Bırak»). Üründe ilk (beğenilmeyen) düzen duruyor.
   - Masaüstü kapak: eserin kapak fotoğrafı, «Yaşayan hafıza · Bursa», büyük serif «Ulucami *hafızası*», iz / fotoğraf / aynı açı sayıları, beyaz «İz Bırak».
   - Kaydırınca yapışık kalan süzgeç çubuğu; çiplerde sayı («Fotoğraflı · 1»); sağda «Bursa'daki tüm izler (12) ›».
   - Üç sütunlu duvar: ilk kart davet («Senin de bir anın var mı?»); yazılı anı altın tırnaklı büyük serif alıntı; altta baş harf, ad, zaman, bildir bayrağı, etiketler; senin izin altın çerçeveli. Sağ yan kutu kalkar, «Bu eserde» bağlantıları sayfanın altına iner.
   - «Tümünü gör» (bütün eserlerin izleri): Şehir ve Eser seçicisi (eser başına sayı), her izde eser etiketi; masaüstünde altta «Bursa'da en çok iz».
   - İz Bırak formu masaüstünde iki sütun (solda büyük fotoğraf alanı; sağda eser, anı, kullanıcı adı).
   - Mobil: sıkı başlık («Yaşayan hafıza · Ulucami · 7 iz»), sayılı çipler, «Tümünü gör · Bursa'daki tüm izler (12) ›», kartlarda «Bildir», altta sabit «+ İz Bırak».
   - Galeri: resmî fotoğraflardan sonra ziyaretçi fotoğrafları (kullanıcı adıyla), sonda «Fotoğrafını ekle» kutusu; araç satırı «12 fotoğraf · 1 ziyaretçiden».
   - Geçmişi Gör → Çekildi → «İz Bırak olarak gönder» formu kameradaki fotoğraf ve «1930'lar ile aynı açı» etiketiyle açar (üründe olup olmadığı denetlenecek).
2. [x] **Eser hakkında kapağı** (prototip `app.css` `.hk-*` ile ölçülerek eşitlendi; masaüstü ve mobilde kapak, panel, başlık, süsleme, «Dinle», sekmeler aynı konum ve boyutta):
   - il panelinde şehrin deseni (`.about-cover-panel.desenli`, prototipin `.hk-kapak-panel.desenli` kuralı; ilin `desen_olcek`'i ile);
   - masaüstü kapak `min-height: 520px` (önce `100dvh`; sekmeler ilk ekranın altında kalıyordu);
   - sekme çubuğu eski `.about-nav` kuralının −32/−20 px taşmasından kurtarıldı (sekmeler masaüstünde 88, mobilde 60 px'ten başlıyor);
   - süsleme prototipteki çizim ve ölçüde (120 px, 28×12 simge, üstte 4 px);
   - ilçe ve künye satırı ilin açık tonunda (`--sehir-acik`; önce Bursa mavisi sabit yazılıydı, Hatay'da da mavi çıkıyordu); bilinmeyen alan («—») satıra yazılmıyor.
   - **Yeni dört eserde (İnebey, Alaaddin Bey Çeşmesi, Karatay, Habib-i Neccar) okuma sayfası yoktu,** eski pencere açılıyordu: içerik hattı (`services/api/scripts/prepare-demo-content.py`) bölümleri yalnız `eser-hakkinda-okuma.md` varken üretiyordu. Prototip gibi her `eser-hakkinda.md` başlığı bölüm oldu; okuma katmanı dosya varsa dolar. Canlıda görünmesi için içerik yeniden aktarılmalı (Tamer).
   - **Açık soru:** kapaktaki üst satır prototipte ilçe (`eser.json → ilce`: «Osmangazi»), üründe `district` («Hanlar Bölgesi», yayımlanmış eserlerde bilerek korunuyor; aramada ve panelde de kullanılıyor). Değiştirilmedi.
3. [x] **Geçmişi Gör, Kamera, Çekildi** prototipin yapısı ve CSS'iyle yeniden yazıldı (`history-view.tsx`, `viewpoint-map.tsx`, `history-camera.tsx`; `design.css` «.gg / .kam / .cek»). Masaüstü ve mobilde her öğe prototiple ölçülerek eşitlendi (konum, boyut, yazı, renk): ana ekran, eşli fotoğraf (kaydırıcı, «Bugün · AKAR arşivi», «Örnek katkı», yakın açı notu), eski görüntüsü olmayan eser («Uzaktan görünüyor»), kamera, izin kutusu, iç mekân kuralları, Çekildi.
   - ‹ › okları, mobilde parmakla kaydırma, ← → ve Esc; mobilde fotoğraf yapışık, kaydırınca 200 px'e küçülür;
   - çekim haritası: seçili nokta ve koni (uzunluğu esere uzaklığa göre), eserin öbür fotoğrafları (dokununca seçer), öbür eserlerin eski fotoğrafları gri, eser adları, lejant; açılışta çekim noktası + eser + koni kadraja girer;
   - şeritte «bugünkü hali yok» işareti, «N tanesinin bugünkü hali yok; ilkini sen çek.», tarih + tür; künye «tarih · fotoğrafçı», kaynak + kısa lisans;
   - Çekildi → «İz Bırak olarak gönder» formu fotoğrafla (1280 px JPEG, EXIF silinir) ve «… ile aynı açı» etiketiyle açar;
   - ürünün sayfa altındaki «İz Bırak örnekleri» listesi ve «Arşiv kaydını aç» bağlantısı prototipte olmadığı için kalktı;
   - prototipte olmayan iki istek (Muhammed, 1 Kasım): eşli fotoğraf açılınca tutamak bir kez sağa sola kıpırdar (hareket azaltmada kıpırdamaz); tutamak yalnız fotoğrafın üstünde gider, yandaki bulanık bantlara geçmez. «Nereden çekildi?» haritası ekranın dışındaysa altta «📍 Nereden çekildi? ↓» hapı çıkar.
   - Ok düğmelerinin üst yarısı basınca çalışmıyordu: ortak `button:active { translateY(1px) }` ortalamayı bozuyordu; düzeltildi.
   - **Açık (veri):** çekim yeri bilinmeyen iki iç mekân fotoğrafı (Ulucami 1865–75 ve tarihi bilinmeyen) «İç mekân» değil «Fotoğraf» görünür; ürün iç mekân bilgisini yalnız çekim noktasıyla birlikte tutuyor (`viewpoint.interior`). Düzeltmek için `history_images`'a sütun (migration) gerekir.
   - Kapak satırı envanterdeki ilçeyi gösteriyor (Muhammed: «PDF'te nasılsa»): içerik hattı yayımlanmış eserlerin eski `district` değerlerini («Hanlar Bölgesi», «Hisar») artık korumuyor, `eser.json → ilce` («Osmangazi») kullanıyor. Canlıda yeniden içe aktarınca bölge adları değişir.
3b. [x] **Mobil harita** (Muhammed, 1 Kasım):
   - Kısa kart prototipin `#eser-kart`'ı gibi: 16 px köşe, cam yüzey, renkli üst şerit yok, × sağ üst köşede (bir dokunma alanı kuralı onu akışa sokup sola atıyordu), ad yazı yüzünde; ölçüler prototiple aynı (kart 366×222, × 36 px). «Dinle | Oku» korundu (bb982d1 kararı).
   - Kart ↔ alt sayfa tek yüzey: biri ötekine dönüşür (View Transitions, prototip `yuzeyGecis`); kart açıkken başka esere geçişte içerik yerinde değişir.
   - Harita kontrolleri kartın hemen üstünde (kartın ölçülen yüksekliği `--peek-h`); alt sayfa çok yükselip çiplere yer kalmayınca kontroller solup gizlenir.
   - Haritanın alt boşluğu kart açılıp kapanırken ve sekme/rota değişince kayarak değişir (önce bir anda zıplıyordu); sürüklerken parmağı izler.
   - Alt sayfa sekme değişince yüksekliğini korur (önce her «Eserler | Rotalar» değişiminde en alta iniyordu); rota kapanınca önceki yüksekliğe döner.
   - Mobil arama çubuğundaki «A» masaüstü logosuyla aynı mürekkep renginde (gece beyaz).
   - 2D/3D kadranı: 56 px dokunma alanı; basılı tutulunca sağ kenarından 1,75 kat büyür, harfler ve çentikler görünür, bırakınca küçülür.
   - Harita künyesi («i») hep kapalı başlar (MapLibre açık açıyordu), soluk durur; dokununca açılır (OSM lisansı için erişilebilir kalır).
3c. [x] **Eser sayfası · Fotoğraf | 3D** (Muhammed, 1 Kasım):
   - Galeri prototipin `galeriHTML`'i gibi: iki sıra yatay, her üçüncü fotoğraf iki sırayı kaplar (masaüstü 560/340, mobil 262/180 px), mıknatıslı kaydırma, büyüt düğmesi → ışık kutusu, ilk fotoğrafta güven etiketi. Önceki alt alta dizilen fotoğraf + künye listesi kalktı.
   - Masaüstü araç satırı: [Fotoğraf | 3D] · «12 fotoğraf · Bursa Vakıf Eserleri Envanteri» · ‹ › (sayfa sayfa kaydırır, uçta pasif). Seçici iki görünümde de aynı yerde (önce fotoğrafta sağa geçip sırası «3D | Fotoğraf» oluyordu).
   - Seçici hep «Fotoğraf | 3D»; seçili zemin öbür yana kayar (`MediaSwitch`).
   - Mobil üst satır prototipteki gibi: solda «‹ Harita», sağda seçici ve (3D'de) parçaları göster; ölçüler prototiple aynı. Galerinin yüksekliği alt kartın yüksekliğine göre.
   - Masaüstünde panelin ‹ düğmesi: panel kayarak kapanır/açılır, sahne birlikte genişler (önce bir anda).
   - 3D: sağ tık / iki parmak kaydırır (pan), dönüş bırakınca yavaşlayarak durur (prototip OrbitControls: damping 0.09). «Parçaları göster» parçaları 90 ms arayla üst üste yakar (~1,5 sn); önce teker teker yakıyordu (Ulucami'de birkaç saniye).
   - Açık: ziyaretçi fotoğrafları ve «Fotoğrafını ekle» kutusu galeriye Yaşayan hafıza işiyle gelecek. Mobil eser kartı prototipte 194 px yüksekliğinde yüzen kart; üründe kenardan kenara %46 — karar bekliyor.
4. [x] **Mobil eser sayfası:** «‹ Harita» eklendi (3c). sol üstte «‹ Harita» hapı yok (Fotoğraf | 3D seçici sola kaymış).
5. [x] **Mobil anlatım:** etiket ×'in altındaki satıra alındı (2 Kasım). Önceki not: sol üstteki × düğmesi «3D model · Temsili» etiketinin üstüne biniyor. Dinle kipindeki alt hikâye kartı (tek cümle, sayaç, kaynak, oynatıcı) ayrıca denetlenecek.
6. [x] **EN seçiliyken eser başlığı:** etiket kendi yazı tipinde, çevresinin renginde (2 Kasım). Önceki not: «Turkish» (çevirisi yok) etiketi başlığın yanında boş bir daire içinde, okunmuyor.
7. [ ] **Tanıtım sayfası:** `apps/web/public/tanitim/index.html`'deki commit edilmemiş değişiklik (Yaşayan hafıza bölümü, «Nasıl çalışır» adımları) bu dala commit edilecek.

### 2 Kasım (gece) yapılanlar
- **GPT turu (1–2 Kasım, yarıda kaldı; denetlendi):** seçicinin her yeri öbür görünüme geçirir; «parçaları göster» 900 ms yanma / 250 ms ara; anlatımda ses dili TR↔EN ve kadın/erkek düğmesi (66×36 px, cihazda saklanır); rotalar A+B: `user_routes` + `user_route_items` (migration **0031_personal_routes**, eski «Rotam» varsayılan rotaya taşınır), `GET/POST /v1/me/routes`, `PATCH/DELETE /v1/me/routes/:id`, `PUT /v1/me/routes/:id/stops`, eski `/v1/me/route` uyumlu, hesap silme yeni tabloları da siler; rota kurucu (ad, mevcut rota seçimi, sıralama, sil); 11 eserde iki boyutta görsel tur hatasız. Galeri testleri güncellendi (Chromium ve WebKit 8/8).
- **Düzeltilenler:** GPT masaüstüne ikinci bir «‹ Harita» koyup seçiciyi sağa itmişti → kaldırıldı. Mobilde seçici sola, [‹ Harita][Fotoğraf | 3D] … [parçalar].
- **Eser hakkında 3D:** ışık, zemin ve kadraj eser sayfasınınkiyle aynı (okuma sahnesi `detail` kurulumunu kullanıyor); prototiple yakın çekimde aynı. Rakam kartları masaüstünde yan yana.
- **Anlatım:** model yalnız ilk ve son cümlede (vurgusu yoksa) döner.
- **Akar akışı:** haritada iki yapının işareti ve adı, yayın ortasında «Gelir → Ulucami». Veri yerelde var; canlıda içerik yeniden aktarılınca görünür (Tamer).
- **Geri düğmeleri** belirgin hap (eser sayfası, Yaşayan hafıza, Geçmişi Gör).
- Mobilde tam ekran sayfalar (Geçmişi Gör, Yaşayan hafıza, Eser hakkında) üst çubuğu gizler.

### Kalan / başkasına ait (2 Kasım notları)
- [ ] 3D'de fotoğraf açılarına giden ‹ › okları kodda var ama hiçbir galeri fotoğrafının açısı girilmemiş (7 eserde 0): panel → Model → «Fotoğraf açıları» (Muhammed).
- [x] Rota kipinde rotada olmayan her pinin sağ üst köşesinde altın «+» rozeti; eklenen pin numaralı yıldız olur, rozete dokunmak pine dokunmaktır (2 Kasım).
- [ ] Profillere etiket (tag) ekleme/çıkarma, profil düzenleme: API ve veritabanı ister (Burak ile).
- [ ] Koza Han (revak + kubbe bitişik, kubbe çatılar tek parça olmalı, avludaki şadırvan ayrı), Orhan Camii (uzak parçalar birbirine bağlı): 3D model ekibi.
- [ ] Parça kartlarında mimari özelliklere daha çok yer (envanterde varsa): içerik ekibi.
- Karanlık tema: var (gece teması, ay düğmesi).

### Başkasına bağlı

- [ ] **«Bir hata mı gördün? Bildir»** yalnız teşekkür gösteriyor; kayıt için API'de ziyaretçi bildirimi ucu (`POST`) ve tablo gerekir. Burak'la konuşulacak; istenirse biz yazarız.
- [ ] **İngilizce içerik:** altyapı ve dil seçici var; `eserler/<eser>/icerik/en/` çevirileri henüz yazılmadı (`ICERIK_INGILIZCE.md`). İçerik ekibi işi.
- [ ] **Puan defteri** (tasarım puansız): karar bekliyor.
- [ ] **Canlı veritabanı** (Tamer): bkz. §1; migration'lar ve içeriğin yeniden aktarılması.
- Eski adres biçimi `#/eser/<id>` üründe yok (`#view=…&site=…`); tanıtım sayfası yeni biçimi kullanıyor, iş gerekmez.

## 3. Sıradaki işler (devir notu, 2 Kasım sabah)

**Ortam:** dal `muhammedtalay/prototip-aktarimi` (origin/main 606c184 üzerinde, hiçbir şey commit edilmedi). Sunucular: 3000 bu dal (`npm run dev:content`), 3001 `../akar-harita` çalışma kopyası (`feat/harita-prototip`, `NEXT_PUBLIC_DEMO_CONTENT=1 npm run dev -w @akar/web -- --port 3001`), 8090 prototip (`bash .prototip/docs/documents-context/design/test-redmi9t-v2/sunucu.sh 8090`). E2e: kökteki `.pw-tmp.config.ts` (port 3002, Chromium, seed); son tam tur 116/116. Kökteki `.*-tmp.mjs` ölçüm betikleri geçici, commit'e girmez.

1. **Gece modunda 3D «Dokun» (parçaları göster / parçaya dokunma) çalışmıyor.** `model-viewer.tsx`: gece temasında `setSceneLights` / `subscribeTheme` sonrası seçim parlaması (`glow`) ya da dokunma (raycast) bozuluyor olabilir; gece temasında Ulucami'de düğmeye ve parçaya dokunarak dene, sebebi bul.
2. **Akar akışı, Kılıç Ali Paşa prototipindeki gibi eserin kendi sahnesinde:** akar cümlesinde ayrı harita yerine eserin 3D sahnesinde (3D yoksa fotoğrafta) gelir yolu çubuğu/yayı belirsin, sonra kaybolsun (ör. Bedesten'den Ulucami'ye akan altın şerit + sikkeler, kart «Bedesten → Ulucami»). Referans: `design/ilk-prototip-kılıç-ali-pasa-düz-stil/` (repoda değil, Muhammed'in diskinde; yoksa sor). Yalnız fotoğraflı eserde fotoğrafın üstünde aynı çubuk. **Admin paneline** entegre: hikâye cümlesinde akış (kaynak eser, hedef eser/nokta, etiket, kaynak, güven) seçilip kaydedilebilsin (`admin-site-editor.tsx` Hikâye adımı; API'de `story_blocks.flow` zaten var — Tamer 808924a).
3. **Eser detayı başlığı (masaüstü sol panel) yeniden düzen:** «‹ Harita», kaydet (yer imi), kapak görseli, «Ulucami», «1399 · Yıldırım Bayezid» için daha toplu bir düzen öner ve uygula (`site-detail.tsx` `.eb-bas`; geri düğmesi yeni hap biçiminde).
4. **3D model parçaları (Blender + GLB yeniden üretimi izinli):**
   - Koza Han: revak ile kubbe parçaları bitişik/tek parça; kubbe ve çatılar tek tıklanır parça olmalı; avludaki şadırvan (mescit altı) ayrı parça.
   - Orhan Bey Camii: birbirinden uzak parçalar tek parçaya bağlanmış; ayır.
   - Kaynak: `docs/documents-context/eserler/<eser>/3d/` (`.blend`, `model.json`, GLB). Parça adı değişirse `parcalar.md`, `hikaye.md` vurguları, `gorevler.json` ve `model.json → ortu_gruplari` güncellenmeli; sonra `node apps/web/scripts/prepare-demo-content.mjs`. Blender MCP aracı var (`mcp__blender__*`).
5. **Parça kartlarına mimari bilgi:** envanter metninden (`eserler/<eser>/icerik/eser-hakkinda.md`, kaynak PDF sayfaları) mimari özellikleri (malzeme, örtü, kemer, süsleme, ölçü) parça kartlarına ekle; her kayıtta kaynak sayfası ve güven etiketi; yalnız kaynakta olan bilgi.
6. **Mobil eser kartı = prototipin yüzen sürüklenen kartı** (Muhammed'in `internet-kahve/mobile/` ekran görüntüleri prototipten): kapalıyken ~194 px, kenarlardan 12 px içeride yüzen cam kart (ad, «Kısa hikâye · 1 dk», Dinle | Oku, altta silikleşen «Eser hakkında» kartı); sürükleyince serbest yükseklik, açılınca Keşfet listesi, en altta yıl/süsleme/kısa metin. «Temsili» ve «İçini göster» kartla birlikte iner/kalkar (prototip `temsiliKonum`, `eaSis`, `.ea-detay --g`). Üründe şu an kenardan kenara %46 alt sayfa. Prototiple ölçerek eşitle.
7. **Tanıtım sayfası** (`apps/web/public/tanitim/index.html`, commit edilmemiş değişiklik): gözden geçir.
8. **Bitirince:** tam test turu, geçici dosyaları sil (`.*-tmp.mjs`, `.pw-tmp.config.ts`, `output/prototype-sync`), `../akar-main` kopyasını kaldır; değişiklikleri mantıklı commit'lere böl (Muhammed onayıyla), push + PR. PR'da Tamer için: içerik yeniden aktarımı, migration'lar (0028–0031; 0031 personal_routes Burak/Tamer ile netleşecek).

**Başkasına bağlı:** profil etiketleri ve profil düzenleme (API/DB, Burak); «Bildir» kaydı (API ucu); iç mekân sütunu (Geçmişi Gör); İngilizce çeviriler (içerik ekibi); puan kararı; 3D fotoğraf açılarının panelden girilmesi (Muhammed).
