# Akar backend · Karar kaydı

Bu dosya backend'de **ne yaptığımızı, neden yaptığımızı ve kimin karar verdiğini** tutar. Ekipten biri "bu neden böyle?" diye sorduğunda cevap burada olmalı.

- Plan: [BACKEND-PLAN.md](BACKEND-PLAN.md) (D1–D8 kararları ve aşamalar)
- Modül sözleşmesi: [services/api/CONTRACTS.md](../services/api/CONTRACTS.md)
- API sözleşmesi: [API-HANDOFF.md](API-HANDOFF.md), kullanım: [services/api/README.md](../services/api/README.md)

**Her karar değiştirilebilir.** Her maddenin sonunda "Nasıl değiştirilir" satırı, değişikliğin hangi dosyada yapılacağını söyler. Bir kararı değiştirdiğinizde eski satırı silmeyin; altına tarihli bir "Değişti" notu ekleyin ki geçmiş okunabilsin.

Yeni karar eklerken biçim: **Karar** · **Neden** · **Karar veren / tarih** · **Nasıl değiştirilir**.

---

## 1. Çalışma biçimi

| Konu | Karar | Karar veren / tarih |
| --- | --- | --- |
| Aşamalar | P1 şema v2 + içe aktarma → P2 okuma API v2 → P3+P4 paralel modüller. Her aşama sonunda **kontrol noktası**: kullanıcı inceler, onaylamadan sonraki aşamaya geçilmez. | Kickoff, 20 Eki |
| Commit | Backend işi konu branch'inde (`feat/api-...`) commit edilir, PR ile `main`'e birleştirilir ([REPOSITORY-STRATEGY](REPOSITORY-STRATEGY.md)). | Weissman, 21 Eki |
| Dış hesaplar | Supabase, SMTP, barındırma gibi hesaplar ekip kararı olmadan açılmaz. Gerektiğinde hangi ortam değişkeninin dolacağı listelenir; o zamana kadar yerel yedeklerle (Testcontainers, test JWT, dosya sistemi depolama) çalışılır. | Kickoff, 20 Eki |
| Veri seti | `origin/docs` branch'i checkout edilmeden `git show` ile okunur. Güncellemek için: `git fetch origin docs`. | Kickoff, 20 Eki |
| Yerel ağ izni | Weissman'ın Mac'inde Little Snitch çalışıyor; yeni bir sunucuya (ör. Overpass) ilk bağlantı onay bekleyip düşebiliyor. Ayar "sessizce izin ver" yapıldı. İçe aktarmada bir ağ kaynağı toptan başarısız olursa önce güvenlik duvarı kontrol edilmeli. | Weissman, 20 Eki |

## 2. Platform kararları (D1–D8)

Ayrıntı ve gerekçe [BACKEND-PLAN.md §3](BACKEND-PLAN.md)'te. Kickoff ile onaylandı (20 Eki):

| # | Karar |
| --- | --- |
| D1 | Yetkili kendi API'miz (Fastify); Supabase yalnız altyapı (Auth, Postgres, Storage) |
| D2 | Fly.io veya Render, Frankfurt |
| D3 | Supabase Storage |
| D4 | Ziyaret doğrulama: koordinat bir kez gönderilir, ~30 m içinde doğrulanır, **saklanmaz** |
| D5 | "Birlikte Gez" odaları şimdilik yok |
| D6 | Herkes (yöneticiler dahil) e-posta OTP ile girer |
| D7 | Bulmaca 3 seçenekli, doğru cevap yalnız sunucuda |
| D8 | Veri AB'de (Frankfurt) |

## 3. Şema v2 (P1)

**3.1 Genişleyen listeler tablo, kapalı listeler enum.**
Karar: yapı türü (`site_types`), vakıf rolü kategorisi (`role_categories`) ve dönem (`periods`) tablodur. Güven etiketi ve yayın durumu enum kalır.
Neden: şartname §5.1.2 yeni eser/şehir/tür eklemenin kod değişikliği gerektirmemesini istiyor; güven ve yayın durumu ise iş kuralının parçası, değişmeleri kod değişikliği demek.
Karar veren: kickoff, 20 Eki.
Nasıl değiştirilir: yeni tür/kategori/dönem için tabloya satır eklenir (başlangıç satırları `services/api/drizzle/0003_reference_data.sql`).

**3.2 Tür → kategori eşlemesi Figma lejantından.**
Dinî: cami (mescit dahil), türbe, tekke/zaviye, hazire · Su: çeşme, sebil, su kemeri, sarnıç · Eğitim ve sosyal: medrese/mektep, kütüphane, imaret, darüşşifa, köprü, külliye · Akar: hamam, han, bedesten/çarşı/arasta, dükkân.
Neden: Figma "Renkler" bölümü (1:165–1:186) bu dağılımı tanımlar; hamam su yapısı gibi görünse de vakıfta gelir getiren yapıdır (akar).
Nasıl değiştirilir: `site_types.category_id`.

**3.3 Şema modül başına bir dosya.**
`services/api/src/db/schema/{shared,platform,catalog,media,routes,engagement}.ts`, giriş `index.ts`. Modüller paralel geliştirilirken aynı dosya düzenlenmesin diye. Migration'ı yalnız backend sorumlusu üretir.

**3.4 Commit edilmemiş `0002` migration'ı değiştirildi.**
Eski `0002_catalog_routes` hiç paylaşılmamıştı; yerine `0002_catalog_v2` + `0003_reference_data` üretildi. `0000` ve `0001` aynen duruyor. Yerel veritabanı bu yüzden sıfırlandı (yalnız tohum verisi vardı). Commit edildikten sonra migration'lar **yeniden yazılmaz**, yenisi eklenir.

**3.5 Bulmaca cevabı ayrı tabloda.**
`quiz_answers` tablosu; yalnız `checkQuizAnswer` okur. Neden: `quizzes` üzerinde yapılan hiçbir sorgu cevabı yanlışlıkla döndüremez (D7).

**3.6 Rota süresi ve mesafesi hesaplanır.**
Mesafe yayındaki durak zincirinin PostGIS uzunluğu; süre = yürüme (4,5 km/sa, dakikada 75 m) + durakların anlatım süresi. Domain'deki elle yazılmış `minutes`/`distance` artık dikkate alınmaz.
Nasıl değiştirilir: yürüme hızı `services/api/src/modules/routes/service.ts` `WALK_METRES_PER_MINUTE`.

**3.7 Taslakta konum ve tür boş olabilir, yayında olamaz.**
İçe aktarılan eserin konumu ya da türü bilinmeyebilir (panelde düzeltilir). Veritabanı CHECK'i (`sites_published_complete`) yayındaki eserde konum ve türü zorunlu kılar; mahalle merkezi konumunu da reddeder (§5.3).

**3.8 Kopya anahtarı tekil değil.**
`normalize(ad)|normalize(ilçe)` indekslenir ama tekil (unique) değildir: aynı ilçede aynı adlı iki farklı yapı gerçekten olabilir. Kopya kontrolünü içe aktarma servisi yapar.

## 4. Ortak sözleşmeler (P1, paralel işten önce)

P3/P4 modülleri paralel geliştirileceği için ortak parçalar önceden yazıldı ve [CONTRACTS.md](../services/api/CONTRACTS.md)'de belgelendi: idempotency yardımcısı, audit kaydı, kimlik bağlamı (`req.user`), roller (user / editor / moderator / admin), hata kodları, puan defteri (`point_events`), misafir makbuzu (HMAC) biçimi, sayfalama, depolama arayüzü.

- Puan değerleri domain'deki mock ile aynı: hikâye 15, bulmaca 20, ziyaret 100, onaylanan anı 25.
- Geçersiz bir bearer token **401** döner, misafire düşürülmez. Kimlik modülü (P3) gelene kadar sunucu her token'ı reddeder.
- Nasıl değiştirilir: CONTRACTS.md + ilgili `src/platform/*` dosyası; değişiklik tüm modülleri etkiler, backend sorumlusu yapar.

## 5. Envanter içe aktarma (P1)

İlk deneme sonuçlarını gördükten sonra Weissman, aşağıdaki önerilerin **tamamını** onayladı (20 Eki).

**5.0 Kaynak dosya `eser-turleri.csv`.**
Karar: `bursa_eserler.csv` yerine `eser-turleri.csv` okunur.
Neden: iki dosya aynı 408 satırı aynı sırayla içeriyor ama `bursa_eserler.csv` 3. ciltteki 45 eserin ilçesini yanlış veriyor (İnegöl, Kestel, Yenişehir, Nilüfer, Gürsu, Keles, Orhangazi, Mustafakemalpaşa eserleri Gemlik / Karacabey / Mudanya altında). `eser-turleri.csv` 16 ilçenin hepsini doğru veriyor, veri ekibinin `ad_supheli` işaretini ve 409. satırı (Koza Hanı) içeriyor.
Nasıl değiştirilir: `services/api/src/modules/ingest/cities.ts` → `dataset.inventory`.

**5.1 İçindekiler satırları atlanır.**
Karar: `[yalnız içindekiler]` işaretli satırlar taslak yapılmaz, raporda ayrı satır olarak sayılır.
Neden: PDF'ten yalnız içindekiler listesinden çıkarılmışlar; ilçe, adres ve sayfa numarası yok. Sayfa olmadan kaynak gösterilemez, kaynaksız bilgi yayınlanamaz. Birçoğu tam satırlardaki bir eserin farklı yazımı.
Nasıl değiştirilir: `npm run ingest -- --city bursa --include-toc` hepsini taslak olarak alır (yalnız adla kopya kontrolü yapılır).

**5.2 Konum bulma sırası.**
1. Elle seçilmiş OSM listesi (`osm_secilen.csv`)
2. **Overpass**: her ilçe için OSM'deki adı olan cami, türbe, hamam, han, çeşme vb. nesneler tek seferde indirilir, ad yerelde bulanık eşleştirilir
3. Nominatim ad araması ("Geyve Hanı" ve "Geyve Han" yazımlarıyla)
4. Nominatim **adres** araması (adreste cadde/sokak + kapı numarası varsa). Kapı/bina düzeyinde sonuç kesin konum sayılır. Yalnız sokak bulunursa sokak üzerindeki nokta **yaklaşık** konum olur (§5.3).
5. Nominatim mahalle merkezi (yaklaşık, §5.3)

Değişti (20 Eki, deneme 4 sonrası): ilk sürümde yalnız kapı düzeyi kabul ediliyordu. Bursa'da OSM'de kapı numarası neredeyse yok (57 adres aramasının hiçbiri kapı düzeyinde dönmedi), sokak ise çoğunlukla bulunuyor. Sokak üzerindeki nokta mahalle merkezinden daha yakın bir başlangıç olduğu için yaklaşık konum olarak alınıyor; yayın kapısı yine kapalı.

Overpass eşleştirme kuralları: aynı ilçe içinde arar; yapı türü sözcüğü aynı olmalı (cami ↔ cami, cami ↔ türbe olmaz); benzerlik en az %85; en iyi aday ikinciyi en az 5 puan geçmeli, yoksa tahmin yerine boş bırakılır.
Google Geocoding **kullanılmıyor**: ücretli anahtar gerekiyor ve bildiğimiz kadarıyla Google'ın şartları sonucun Google dışı haritada (bizde MapLibre) gösterilmesine izin vermiyor.
Nominatim kuralı: saniyede en fazla 1 istek. Overpass: ilçe başına 1 istek. İkisi de `services/api/.cache/` altında önbelleklenir (git'e girmez); `--offline` yalnız önbelleği kullanır.
Nasıl değiştirilir: sıra ve eşikler `services/api/src/modules/ingest/geocode.ts` (`createGeocoder`, `MIN_SIMILARITY`, `MARGIN`).

**5.3 Sokak ya da mahalle merkezi "konum yaklaşık" sayılır ve yayınlanamaz.**
Neden: sokak üzerindeki nokta ya da mahalle merkezi yapıdan yüzlerce metre uzak olabilir; harita iğnesi ve D4'teki ~30 m ziyaret kontrolü için yanlış. Raporda "konum yaklaşık" satırında sayılır. Editör iğneyi doğrulayınca ya da taşıyınca `location_source = manual` olur ve yayın serbest kalır. Bu kural veritabanında (CHECK) olduğu için hiçbir uç noktada atlanamaz.
Nasıl değiştirilir: `services/api/src/db/schema/catalog.ts` → `sites_published_complete` (yeni migration gerekir) ve `geocode.ts` → `APPROXIMATE_SOURCES`.

**5.4 Şüpheli adlar.**
Karar: veri ekibinin `ad_supheli = 1` işareti esas alınır ("ad şüpheli"). Bizim otomatik kontrolümüz yalnız uyarıdır ("ad uyarısı"). Şüpheli satırlar **atlanmaz**: adı bozuk olsa da gerçek bir eserdir (örnek: cilt 1 s. 42 "Külliyesi" = Murad Hudâvendigâr Külliyesi). Adres sütunu çoğu zaman eserin gerçek adıyla başladığı için ilk parça `suggestedName` olarak önerilir, editör tek tıkla kabul eder. Şüpheli adla konum aranmaz (rastgele yerle eşleşir).
Nasıl değiştirilir: `services/api/src/modules/ingest/service.ts` → `looksBroken`, `suggestName`.

**5.5 Kopya kontrolü.**
- Anahtar: normalize ad + ilçe. Aynı dosyada ya da veritabanında aynı anahtar varsa satır "kopya" olur ve yazılmaz.
- Tarihi bölge adları ilçeye çevrilir: demo içeriğindeki "Hanlar Bölgesi" = Osmangazi. Böylece demo "Koza Hanı" ile envanterdeki "Koza Hanı / Osmangazi" aynı eser sayılır.
- Yayındaki bir eserle aynı ada sahip ama farklı ilçedeki satır "olası kopya" olarak işaretlenir, yine de taslak yazılır; editör karar verir.
- Nasıl değiştirilir: bölge → ilçe listesi `services/api/src/modules/catalog/service.ts` → `AREA_DISTRICT`.

**5.6 Taslağın içeriği.**
Tier 1, `status = draft`, `trust = inferred` (makine çıkarımı, doğrulanmış sayılmaz). Kaynak: cilt başına bir kitap kaydı ("Bursa Vakıf Eserleri Envanteri, Cilt N") ve sayfa (`s. 42`). Ham satır (cilt, sayfa, ham ad, tür, ilçe, şablon, ölçü sayısı, öneri ad, işaretler) `import_meta` içinde saklanır. Tekrar çalıştırmak kopya üretmez.

**5.7 Rapor biçimi.**
Figma 1:1209'daki dört satır (hazır / konum bulunamadı / tür belirsiz / kopya) korunur; "konum yaklaşık", "içindekiler satırı atlandı", "olası kopya", "ad şüpheli / ad uyarısı" ve konum kaynakları eklendi. Satırlar ayrıktır; öncelik: içindekiler → kopya → konum yok → konum yaklaşık → tür belirsiz → hazır. Figma'daki "362 hazır / 18 konum bulunamadı" örnek metindir, gerçek veri değildir.

## 6. Okuma API'si v2 (P2)

Weissman "go ahead" ile P2'yi başlattı (20 Eki). İş iki paralel parçaya bölündü (catalog, routes); entegrasyon, doğrulama ve belgeler ayrıca yapıldı.

**6.1 İçerik çipleri `has=model,audio,history`.** 3D = eserin `model` türünde medyası var; sesli = en az bir hikâye cümlesinin TR ya da EN sesi var; gravür = en az bir "Geçmişi Gör" görseli var. Birden çok bayrak "hepsi" demektir. Nasıl değiştirilir: `services/api/src/modules/catalog/service.ts` (bayrak SQL'leri) ve `schemas.ts` (`ContentFlag`).

**6.2 Mesafeye göre sıralama.** `near=boylam,enlem` + `sort=distance`; mesafe jeodezik metre (PostGIS geography). Sayfalama imleci sıralama türüne bağlı: ada göre imleç mesafeye göre listede kullanılamaz (400). Neden: offset yerine keyset, sayfalar arasında tekrar ya da atlama olmasın.

**6.3 `GET /v1/lookups` eklendi.** Plan listesinde yoktu. `kind` artık tablo kimliği olduğu için (§3.1) istemci tür/kategori/dönem adlarını buradan alır; yoksa filtre çipleri yazılamaz.

**6.4 Detay her referansı çözer.** `media` ve `sources` listeleri, detayın andığı her medya ve kaynağı içerir (kapak, hikâye fotoğrafı ve sesi, kart, eski görsel). İstemci ikinci istek atmaz.

**6.5 Rota paketi.** `GET /v1/routes/:id/bundle` = rota + yayındaki durakların tam detayı + cevapsız bulmacalar + önbelleğe alınacak URL listesi (`assets`). Paket hazırlanırken bir durağın eseri yayından kalkarsa o durak paketten düşer, paket bozulmaz. Durağın `historyImageId`'si yalnız o eserin görseliyse dolu; `quizId` yalnız eseri yayındaysa dolu. Rozet `url` ve `alt` ile döner.

**6.6 Yerel deneme verisi.** Kontrol noktası için yerel veritabanında (yalnız Weissman'ın makinesi) kesin konumlu ve türü belli 84 içe aktarma taslağı SQL ile yayına alındı ve Ulucami'ye örnek bölüm, kart, ses, eski görsel ve bulmaca eklendi (`services/api/.cache/p2-smoke.sql`, git dışı). Bu, editör kontrolünü atlar; gerçek ortamda yayın yalnız panelden (P3) yapılacak.

## 7. Deneme sonuçları (Bursa)

| Deneme | Hazır | Konum yaklaşık | Konum yok | Tür belirsiz | Kopya | İçindekiler atlandı |
| --- | --- | --- | --- | --- | --- | --- |
| 1 · `bursa_eserler.csv`, OSM + Nominatim ad + mahalle | 186 (mahalle dahil) | — | 198 | 3 | 21 | — |
| 2 · + "Hanı/Han" yazımı, şüpheli adla arama yok | 193 (91'i mahalle) | — | 191 | 3 | 21 | — |
| 3 · §5 kararları; Overpass güvenlik duvarına takıldı (0 nesne) | 70 | 107 | 65 | 1 | 2 | 164 |
| 4 · Overpass çalıştı, Osmangazi sunucu hatası (502) | 78 | 104 | 60 | 1 | 2 | 164 |
| 5 · Osmangazi parça parça indirildi + sokak düzeyi yaklaşık konum | **84** | **108** | **50** | **1** | **2** | **164** |

Deneme 5'te konum kaynakları: OSM listesi 9 · Overpass 62 · Nominatim ad 14 · Nominatim adres (kapı) 0 · sokak 61 · mahalle merkezi 47. Ad şüpheli 18 (veri ekibi), ad uyarısı 20 (otomatik), olası kopya 1 (İznik "Orhan Gazi (İmaret) Camii" ↔ yayındaki Orhan Gazi Camii). Toplam 409 = 84 + 108 + 50 + 1 + 2 + 164.

Yerel veritabanına yazıldı: 243 taslak (84 + 108 + 50 + 1); ikinci çalıştırma 0 taslak ekledi. Taslaklar okuma API'sinde görünmez.

Not: Overpass bulanık eşleşmeleri (62) ilk incelemede birkaç örnekle haritada kontrol edilmeli; eşik `MIN_SIMILARITY` gerekirse yükseltilir.

## 9. Yerel geliştirme, istenince bulut (P3 öncesi)

**Karar:** Geliştirme ve testler tamamen Weissman'ın Mac'inde çalışır. Supabase'in kendisi yerelde Docker'da koşar (`supabase start`): Auth (e-posta OTP, davet), Storage (S3 protokolü), e-posta kutusu (Mailpit, `http://127.0.0.1:54324`) ve yönetim arayüzü. Ekip çevrimiçi ortam isterse aynı ayarlarla bulut projesine geçilir; kod değişmez, `.env` değerleri değişir.
**Karar veren / tarih:** Weissman, 20 Eki ("everything approved"). Yerelde bir sorun çıkarsa etrafından dolaşılmaz, Weissman'a hemen bildirilir; çözümü (örneğin doğrudan buluta geçmek) o seçer.

Kurulum ve doğrulama (20 Eki):
- Supabase CLI 2.121.0 (Homebrew). Proje ayarları `services/api/supabase/config.toml` (git'e girer): proje adı `akar`; kullanılmayan servisler kapalı (realtime, edge functions, analytics, vector); 8 konteyner, toplam ~0,7 GB bellek.
- Giriş: 6 haneli kod, 600 sn (Figma 1:3937). Varsayılan şablon kod yerine bağlantı gönderiyordu; Türkçe şablonlar eklendi (`supabase/templates/otp.html`, `invite.html`).
- Token: yerelde de bulut gibi ES256 + JWKS (`supabase/signing_keys.json`, git dışı). OTP → token → JWKS doğrulaması uçtan uca denendi.
- Depolama: herkese açık okunan `media` kovası (5 MiB, JPEG/PNG/WebP/GLB/MP3/M4A). İmzalı S3 yükleme (presigned PUT) ve herkese açık okuma denendi.
- API'nin kendi veritabanı yine `docker-compose.yml`'daki PostGIS (5433); Supabase'in yerel veritabanı (54322) yalnız Auth/Storage içindir. Bulutta ikisi aynı Supabase Postgres olur.
- Değerler `services/api/.env` içinde (git dışı); adlar `.env.example`'da. `RECEIPT_SECRET` yerelde rastgele üretildi.

Buluta geçiş (istenirse): Supabase projesi (AB) → `supabase link` + `supabase config push` (giriş ayarları ve şablonlar) → `npm run db:migrate` bulut `DATABASE_URL` ile → API konteyneri (Fly/Render) bulut `.env` değerleriyle. Ayrıntılı liste P5'te README'ye yazılacak.

Nasıl değiştirilir: giriş/depolama ayarları `services/api/supabase/config.toml`; API tarafı `services/api/.env`.

## 10. Açık konular

- Konumu bulunamayan eserler panelde elle düzeltilecek; panelin "listede elle düzelt" ekranı P3'te.
- Overpass ve Nominatim ücretsiz, gönüllü servislerdir; yalnız içe aktarma sırasında kullanılır, demo anında çağrılmaz.
- Sponsor veri setinin lisansı, KVKK metni (saklama süresi, veri sorumlusu): [BACKEND-PLAN §6](BACKEND-PLAN.md).
- **Haritadaki 3B model başına üçgen hedefi (öneri ~30k), 3B ekibine sorulacak (Weissman).** Her GLB küçük üçgenlerden oluşur; üçgen sayısı telefonun her karede ne kadar çizdiğini belirler. Haritada aynı anda en çok 5 model var (§11.4), yani ~5 × 30k = ~150k üçgen; orta seviye telefonda akıcı. Dosya boyutu sınırı (5 MiB) bunu korumaz: küçük dosya da çok üçgen taşıyabilir. Şu an API denetlemez; 3B ekibinin dışa aktarma kılavuzudur. Sonradan değiştirmek kolay: sayı yalnız bir anlaşmadır (kod yok); ağır gelirse yönetici `maxVisibleModels` düşürür ya da `modelMinZoom` yükseltir (uygulama sürümü gerekmez); istenirse yüklemede üçgen sayımı eklenebilir. Hiçbir işi engellemez. İlk adım: mevcut bir modelin (örn. Ulu Cami v25) üçgen sayısını ekipten öğrenmek.

## 11. Kimlik ve 3B model (P3, 21 Eki)

**11.1 E-posta doğrulaması açık.**
Karar: `services/api/supabase/config.toml` → `[auth.email] enable_confirmations = true`.
Neden: panel rolleri e-posta davetiyle verilir. Doğrulama kapalıyken ve şifreyle kayıt açıkken biri, davet edilmiş bir yöneticinin adresiyle kayıt olup o rolü alabilirdi. Artık şifreyle kayıt olan, e-postasını doğrulamadan oturum açamaz (`email_not_confirmed`). OTP koduyla giriş etkilenmez: ilk girişte gelen `confirmation` e-postası da aynı 6 haneli kodu gösterir (`templates/otp.html`). Yerelde denendi: yeni adresle OTP → kod → token alındı; başkasının adresiyle şifreli kayıt oturum vermedi.
Karar veren / tarih: Weissman, 21 Eki.
Nasıl değiştirilir: aynı ayar; bulutta `supabase config push`.

**11.2 Eser başına tek 3B model, 5 MiB sınırı; harita ayarları API'den.**
Karar: harita için ayrı "hafif" ve detay için ayrı model **yok**; her eserin tek GLB'si olur. Yükleme sınırı 5 MiB olarak kalır. Haritada 3B yükleme yakınlaştırmaya bağlıdır ve elle ayarlanabilir değerler API'den gelir (başlangıç: yakınlaştırma ≥ 16, aynı anda en çok 5 model).
Neden: `origin/docs` ve 3B branch'lerindeki güncel Bursa çıktıları 0,15–0,7 MB (Ulu Cami v25 0,69; Koza Han v13 0,68; Orhan Bey Camii v06 0,25; Bedesten v05 0,19); `_sunum` sürümleri neredeyse aynı boyutta. İkinci sürüm kazanç sağlamaz. Sınırı aşan yalnız deneme dosyaları var (Ulu Cami GPT `_sunum` 5,52 MB, Ayasofya v22 6,28 MB); bunlar reddedilir.
Karar veren / tarih: Weissman, 21 Eki.
Nasıl değiştirilir: boyut sınırı `services/api/src/modules/media/magic.ts` (`model.maxBytes`) ve Supabase `media` kovası sınırı; harita değerleri ayar uç noktasında (P3).

**11.3 Demo tohumu ile içe aktarılan taslaklar arasındaki olası kopyalar** ("Bedesteni", "Koza Han Mescidi"): kod değişikliği yok; gerçek yayından önce editör kontrol eder.
Karar veren / tarih: Weissman, 21 Eki.

**11.4 Harita ayarları veritabanında, yönetici panelden değiştirir.**
Karar: 3B yakınlaştırma eşiği (`modelMinZoom`, başlangıç 16) ve aynı anda en çok model (`maxVisibleModels`, başlangıç 5) tek satırlık `map_settings` tablosunda durur (migration `0005` satırı başlangıç değerleriyle açar). Uygulamalar `GET /v1/map-settings` ile okur (herkese açık, 60 sn önbellek); yönetici `PUT /v1/admin/map-settings` ile değiştirir, değişiklik audit'e yazılır (`map-settings.update`). Sınırlar: yakınlaştırma 0–24, model 0–50 (0 haritada 3B'yi kapatır). `.env` seçeneği reddedildi: her değişiklik yeniden başlatma ister ve panelden ayarlanamaz.
Karar veren / tarih: Weissman, 21 Eki.
Nasıl değiştirilir: değerler panelden ya da `PUT /v1/admin/map-settings`; sınırlar `services/api/src/modules/settings/schemas.ts` ve `src/db/schema/settings.ts` CHECK'leri (yeni migration).

**11.5 Bildirim (İz Bırak anıları): 3 farklı kişi bildirince gizlenir, kişi başı günlük kota.**
Karar: onaylı bir anı, 3 farklı kullanıcı bildirince `pending`'e döner ve herkese açık listeden çıkar; 1–2 bildirimde görünür kalır ve moderasyon kuyruğunda `reportCount` ile işaretlenir. Bir kullanıcı 24 saatte en çok 5 yeni bildirim yapabilir (aşınca 429). Aynı anıyı tekrar bildirmek sayılmaz.
Neden: güvenlik incelemesi: tek bildirimle gizleme, tek hesabın bütün anı akışını boşaltmasına izin veriyordu.
Karar veren / tarih: Weissman, 21 Eki.
Nasıl değiştirilir: `services/api/src/modules/moderation/service.ts` (`REPORT_HIDE_THRESHOLD`, günlük kota).

**11.6 Güvenlik incelemesi düzeltmeleri (teknik, karar gerektirmedi), 21 Eki.**
- İçe aktarma planı sunucu durunca `planning`'de kalmıyor: kuyruk mesajı yeniden geldiğinde iş devralınır; eski çalışma sonucunu yazamaz (`imports.ts` `planImportJob`).
- `trustProxy` artık yalnız `TRUST_PROXY` kadar vekil sunucuya güvenir (yerelde 0); hız sınırı oturum açmış kullanıcıda hesaba göre, misafirde IP'ye göre.
- Yüklenen dosya `complete` sonrası istemcinin yazamadığı bir anahtara kopyalanır; süresi geçmiş yüklemeler temizlenir; kişi başı en çok 10 açık yükleme.
- "Cevabı göster" sonrası misafir makbuzuyla puan alınamaz (`revealed`); "Paylaşımlarım" yayında olmayan eserin adını göstermez (`siteName: null`).

**11.7 Yüklemeler ayrı, herkese kapalı bir kovaya gider.**
Karar: istemci dosyayı herkese kapalı bir `uploads` kovasına yükler; `complete` doğrulamadan sonra sunucu dosyayı herkese açık `media` kovasına kopyalar. Süresi dolmamış yükleme bağlantısıyla sonradan bırakılan dosya hiçbir zaman herkese açık olmaz; süpürme onu da siler.
Neden: S3 imzalı PUT bağlantısı geri alınamaz; `complete` sonrası en çok 15 dakika geçerli kalır (güvenlik incelemesi). Temizlik kuralı tek başına artığı ~20 dakika açıkta bırakırdı.
Karar veren / tarih: Weissman, 21 Eki. Uygulama: ayrı bir PR'da (henüz yapılmadı).
Nasıl değiştirilir: `supabase/config.toml` kova tanımları ve depolama ayarları (`src/config.ts`).
