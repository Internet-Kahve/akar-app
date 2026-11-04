# AKAR · Yapılacaklar

*29 Ekim 2026'da yazıldı; 2 Kasım 2026'da baştan güncellendi (bitenler çıkarıldı; eski hali Git geçmişinde). §3. Bu dosya ekip düzeyindeki açık işleri toplar.*

## 1. Canlıya alma (Tamer)

- [ ] Migration'lar: `0028`–`0031` (0031 kişisel rotalar: Burak ve Tamer'le netleşecek), ayrıca `0030_photo_camera`.
- [ ] İçerik yeniden aktarılmalı (`import-demo`): şehir desen/amblemleri, yeni dört eserin «Eser hakkında» bölümleri, altın gelir yolu, «Yalnız rotada».
- [ ] **Aktarım hikâye cümlelerinin `routeOnly` ve `flow` alanlarını yazmıyordu** (`services/api/src/db/seed.ts → loadCatalog`): `prepare-demo-content.py` üretiyor ama veritabanına girmiyordu, yani altın gelir yolu yeniden aktarımla da açılmazdı. 2 Kasım'da düzeltildi; API testleri Docker gerektirdiği için yerelde koşulmadı, CI'da bakılmalı.
- [ ] **Aktarımdan önce dikkat:** `loadCatalog` hikâye cümlelerini silip yeniden yazar. `textEn` içerik dosyasından gelir (çoğunda yok, yani boş); `simpleEn` ve çeviri durumu hiç yazılmaz. Panelde Gemini ile doldurulan İngilizce metinler bu yüzden silinir, o metinlerin İngilizce sesleri de eşleşmez (bkz. §2). Ya aktarım panelde dolmuş İngilizceyi korumalı (parça kartlarındaki gibi «panel sahibi» kuralı, §11.52) ya da aktarımdan sonra çeviri ve seslendirme yeniden çalıştırılmalı.
- [ ] Supabase Storage dosyaları `cache-control: private, no-cache` ile geliyor (bkz. §5).

## 2. Seslendirme: durum ve Burak için notlar (2 Kasım)

**Yapılan (Burak, 31 Ekim–1 Kasım):** Deepgram ile dört ses (TR/EN × kadın/erkek, `TTS_VOICES`), hikâye cümleleri (düz + sade anlatım) ve 3D parça kartları için; Gemini ile İngilizce taslak çeviri; panelde «Seslendir» ve «Çevir» düğmeleri; günlük karakter sınırı (`TTS_DAILY_CHAR_LIMIT`); metin değişince eski kayıt bayatlar ve yenilenir; ziyaretçi tarafında ses seçimi (dil, kadın/erkek; hesapta saklanır), kayıt yoksa tarayıcı sesi.

**Canlıdaki kayıtlar (2 Kasım, `GET /v1/sites/:id`):**

| Eser | Hikâye cümlesi | Cümle sesleri (8 tür) | Parça kartı | Kart sesleri |
|---|---|---|---|---|
| Koza Han | 12 | tam (12×8) | 7 | 12 / 28 |
| Emir Hanı | 8 | tam | 4 | tam (16) |
| İnebey, Alaaddin Bey, Karatay, Habib-i Neccar | 8 / 5 | tam | — | — |
| **Ulucami** | 11 | **yalnız 1 cümle** | 17 | **0** |
| **Bedesten** | 10 | **0** | 8 | **0** |
| **Orhan Bey Camii** | 8 | **0** | 11 | **0** |
| **Orhan Bey Hamamı** | 8 | **0** | 4 | **0** |
| **Orhan Gazi Türbesi** | **0** (hikâye yok) | — | 7 | **0** |

Kalan işler:
- [ ] Ulucami (demo eseri!), Bedesten, Orhan Bey Camii, Hamam: hikâye sesleri; yedi eserin parça kartı sesleri (Koza Han'da 16 eksik). Günlük sınıra dikkat: kabaca bir eser 8 tür × ~1.500 karakter.
- [ ] **«Eser hakkında» sesli okuma** (`about-reading.tsx`) yalnız tarayıcı sesini kullanıyor; bölümler (`sections`) seslendirme konusu değil. Ya bölümler için de kayıt ya da bilinçli olarak tarayıcı sesi (karar).
- [ ] Orhan Gazi Türbesi'nde hikâye yok (panelde «0 hikâye bölümü»); içerik paketi mi, aktarım mı, bakılmalı.
- [ ] Yeniden aktarım İngilizce metni ve onun seslerini boşa düşürüyor (bkz. §1). Çözüm önerisi: aktarım `text_en`/`simple_en` panelde doluysa dokunmasın.
- [ ] Ses dosyaları da `no-cache` ile sunuluyor (bkz. §5); bir cümle her dinlenişte yeniden indirilebilir.

## 3. Yönetim paneli (2 Kasım taraması)

Panelde olan: eser sihirbazı (Model, Bilgiler, Kaynaklar, Hikâye, Parça kartları, Yayın), 3D önizleme ve açılar, gece modeli, fotoğraf açıları, çeviri ve seslendirme, rotalar, harita ayarları, iz moderasyonu, üyeler ve roller, sağlık.

2 Kasım'da eklenen: Hikâye adımında cümleye **«Yalnız rotada»** kutusu (alan API'de ve domain'de vardı, panelde yoktu); cümle özetinde «Yalnız rotada · Akar akışı var» satırı. Panel kayıtta `flow` ve `routeOnly` alanlarını zaten koruyordu.

API'de olup panelde ekranı olmayanlar:
- [ ] **Akar akışı** (`flow`: kaynak eser, hedef, etiket, kaynak, güven).
- [ ] Geçmişi Gör eski fotoğrafları (`PUT …/history-images`). («Eser hakkında» bölümleri artık `PUT …/about` ile panelde, §11.69; kitap fotoğrafları ve bölüm kamerası panelde yok.)
- [ ] Bulmacalar (`/v1/admin/quizzes`), hikâye kartları (`/v1/admin/cards`), içe aktarma (`/v1/admin/imports`), raporlar (`/v1/admin/reports/*`: taslak sorunları, konum, kopya), ekip davetleri (`/v1/admin/staff`).

API'de de olmayanlar (Burak):
- [ ] «İçini göster» grupları (`coverGroups`) ve iç mekân parçaları (`interiorParts`) API'de okunur ve içerik aktarımıyla gelir; yazan uç yok, panelden eklenen eserde «İçini göster» çıkmaz. (Ön cephe yönü `frontDeg` tamam: aktarım yazar, panel yerleşim alanından düzenlenir.)
- [ ] Eser görevleri ve rozetleri (`site_tasks`, `site_badges`) için yönetim ucu yok; yalnız içerik aktarımıyla geliyor.
- [ ] Eseri silme.
- [ ] Cümleye «Model dönsün» (`turn`) alanı.
- [ ] «Bildir» kaydı (`POST /reports`).

## 4. Jüri ve sunum (final 7–8 Kasım)

- [ ] «Bu Vakıf Katılım için neden önemli?»: akar kavramı, vakıf mirasının görünürlüğü, ölçülebilir hedefler.
- [ ] Sürdürülebilirlik: içerik veri hattıyla geliyor; yeni şehir = yeni klasör (Konya, Hatay kodsuz eklendi).
- [ ] Demo senaryosu (≈ 3 dk) ve yedek ekran kaydı.
- [ ] Fotoğraf izinleri: Foto Atlas ND kayıtlar kırpılmaz; SALT için yazılı izin.

## 5. Telefon performansı (2 Kasım ölçümü; yapılmadı, öneri)

Önem sırasıyla:

1. **Fotoğraflar tam boy iniyor.** Ulucami'nin 154 fotoğrafı var; tekleri 0,9–1,45 MB. Galeri küçük resimleri, kapak, hikâye kartı aynı dosyayı indiriyor. Öneri: aktarımda 1600 px (tam ekran) ve 480 px (küçük resim) WebP/JPEG sürümleri üretip API'de `thumbUrl` vermek ya da Supabase görsel dönüşümü (`/render/image/…?width=`). Tek başına en büyük kazanç; mobil veride sayfa yükünü onda birine indirir.
2. **Önbellek yok.** Supabase dosyaları `cache-control: private, no-cache` dönüyor (Ulucami GLB 1,7 MB, fotoğraflar, sesler). Adlar içerik özeti olduğu için değişmez; `storage-s3.ts → PutObjectCommand`'a `CacheControl: "public, max-age=31536000, immutable"` eklenmeli. Mevcut dosyalar için başlık güncellenmeli ya da yeniden yüklenmeli (Tamer).
3. **Harita piksel oranı sınırsız.** MapLibre cihazın tam piksel oranıyla çiziyor (Redmi 9T ≈ 2,75), üstüne three.js modelleri antialias ve `PCFSoftShadowMap` gölgeyle. Öneri: `new maplibregl.Map({ pixelRatio: Math.min(devicePixelRatio, 2) })`, zayıf cihazda (`navigator.deviceMemory <= 4` ya da `hardwareConcurrency <= 4`) gölge türü `PCFShadowMap`/kapalı, antialias kapalı. Eser 3D'si zaten 1,5 ile sınırlı.
4. **Buzlu cam (`backdrop-filter`) 42 yerde**, çoğu sürekli yeniden çizilen haritanın üstünde (panel, çipler, kartlar). Orta seviye Android'de kaydırma ve harita sürüklemede kare düşürür. Öneri: `@media (max-width: 899.98px)` ya da zayıf cihaz sınıfında bulanıklığı kapatıp yarı saydam düz renge düşmek (tasarımla konuşulmalı).
5. **3D modelin boyutu ve ikinci model.** Ulucami sunum GLB'si 1,7 MB, gece modeli ayrı iniyor. Öneri: gece modelini yalnız gece temasında indirmek (bugün öyle mi, bakılmalı), haritada hafif GLB (Draco/meshopt + doku yok) ve detayda sunum GLB'si (ENTEGRASYON'daki «iki model» kararı).
6. **Görsellerde `loading="lazy"` az.** 48 `<img>`'den 5'inde var. Galeri, Yaşayan hafıza duvarı, Geçmişi Gör şeridi ekran dışındaki görselleri baştan indiriyor. Öneri: ekran dışı her `<img>`'e `loading="lazy" decoding="async"` ve `width/height` (yerleşim kaymasını da önler).
7. **Yazı tipleri:** Inter'in 4 ağırlığı × 2 alt küme ve Cormorant. Kabul edilebilir; istenirse Inter değişken (variable) tek dosya.
8. **Büyük bileşen dosyaları:** `akar-app.tsx` 1.700 satır ve tek istemci paketi; panel (`admin-*`, ~5.000 satır) ziyaretçi paketine giriyor olabilir. Öneri: yönetim ekranlarını `next/dynamic` ile ayrı parçaya almak. Ölçmek için `ANALYZE` ile `next build` paket raporu.
9. **CSS:** `design.css` + `globals.css` ≈ 8.700 satır, eski kurallar üst üste (ör. aynı seçicinin üç ayrı medya sorgusunda ezilmesi). Performanstan çok bakım sorunu; prototip aktarımı bitince temizlenmeli.

Ölçüm önerisi: Redmi 9T'de Chrome uzaktan hata ayıklama → Performance kaydı (harita sürükleme, eser açma, hikâye oynatma), Lighthouse mobil; 1–3 maddeden önce ve sonra.

## 6. Teknik borç

- [ ] Modellerde zemin katmanlarını ayır (≥ 3 cm; z-fighting).
- [ ] Kitap fotoğraflarının alt metinleri (altı eser, geçici «s. N, k. fotoğraf») ve arşiv asıllarıyla eşleştirme.
- [ ] `design/ilk-prototip-kılıç-ali-pasa-düz-stil/` (157 MB) repoda değil; Akar akışı işi için gerekiyor.
