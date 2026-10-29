# Akar backend · Karar kaydı

Bu dosya backend'de **ne yaptığımızı, neden yaptığımızı ve kimin karar verdiğini** tutar. Ekipten biri "bu neden böyle?" diye sorduğunda cevap burada olmalı.

- Plan: [BACKEND-PLAN.md](BACKEND-PLAN.md) (D1–D8 kararları ve aşamalar)
- Modül sözleşmesi: [services/api/CONTRACTS.md](../services/api/CONTRACTS.md)
- API sözleşmesi: [API-HANDOFF.md](API-HANDOFF.md), kullanım: [services/api/README.md](../services/api/README.md)

**Her karar değiştirilebilir.** Her maddenin sonunda "Nasıl değiştirilir" satırı, değişikliğin hangi dosyada yapılacağını söyler. Bir kararı değiştirdiğinizde eski satırı silmeyin; altına tarihli bir "Değişti" notu ekleyin ki geçmiş okunabilsin.

Yeni karar eklerken biçim: **Karar** · **Neden** · **Karar veren / tarih** · **Nasıl değiştirilir**.

---

## 23 Ekim 2026 · Güncel durum

Üretim web/API Vercel üzerinde, veritabanı/Auth/Storage Frankfurt Supabase projesindedir. Üretim dalı `main`dir; eski `origin/docs` dalı kullanılmaz, içerik `main:docs/documents-context` içinde bulunur. Kurulum ve doğrulama [canlı ortam kaydında](deployment/2026-10-23-cloud-migration.md), içerik aktarımı [demo içerik rehberinde](content/DEMO-CONTENT.md) tutulur. Aşağıdaki tarihli kararlar gerekçe kaydı olarak korunur.

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
- Depolama: herkese açık okunan `media` kovası ve herkese kapalı `uploads` kovası (ikisi de 5 MiB, JPEG/PNG/WebP/GLB/MP3/M4A; §11.7). İmzalı S3 yükleme (presigned PUT) `uploads`'a, herkese açık okuma `media`'dan denendi.
- API'nin kendi veritabanı yine `docker-compose.yml`'daki PostGIS (5433); Supabase'in yerel veritabanı (54322) yalnız Auth/Storage içindir. Bulutta ikisi aynı Supabase Postgres olur.
- Değerler `services/api/.env` içinde (git dışı); adlar `.env.example`'da. `RECEIPT_SECRET` yerelde rastgele üretildi.

Buluta geçiş (istenirse): Supabase projesi (AB) → `supabase link` + `supabase config push` (giriş ayarları ve şablonlar) → `npm run db:migrate` bulut `DATABASE_URL` ile → API konteyneri (Fly/Render) bulut `.env` değerleriyle. Ayrıntılı liste P5'te README'ye yazılacak.

Nasıl değiştirilir: giriş/depolama ayarları `services/api/supabase/config.toml`; API tarafı `services/api/.env`.

## 10. Açık konular

- Konumu bulunamayan eserler panelde elle düzeltilecek; panelin "listede elle düzelt" ekranı P3'te.
- Overpass ve Nominatim ücretsiz, gönüllü servislerdir; yalnız içe aktarma sırasında kullanılır, demo anında çağrılmaz.
- Sponsor veri setinin lisansı, KVKK metni (saklama süresi, veri sorumlusu): [BACKEND-PLAN §6](BACKEND-PLAN.md).
- **Haritadaki 3B model başına üçgen hedefi:** §11.34 ile rafa kaldırıldı (yükleme sınırı yok; performans sorunu görülürse cihazda ölçülüp yeniden ele alınır).

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
Nasıl değiştirilir: boyut sınırı `services/api/src/modules/media/magic.ts` (`model.maxBytes`) ve Supabase `media` ile `uploads` kovalarının sınırı; harita değerleri ayar uç noktasında (P3).

**11.3 Demo tohumu ile içe aktarılan taslaklar arasındaki olası kopyalar** ("Bedesteni", "Koza Han Mescidi"): kod değişikliği yok; gerçek yayından önce editör kontrol eder.
Karar veren / tarih: Weissman, 21 Eki.

**11.4 Harita ayarları veritabanında, yönetici panelden değiştirir.**
Karar: 3B yakınlaştırma eşiği (`modelMinZoom`, başlangıç 16) ve aynı anda en çok model (`maxVisibleModels`, başlangıç 5) tek satırlık `map_settings` tablosunda durur (migration `0005` satırı başlangıç değerleriyle açar). Uygulamalar `GET /v1/map-settings` ile okur (herkese açık, önbellekli; §11.24'ten beri her okumada doğrulanır); yönetici `PUT /v1/admin/map-settings` ile değiştirir, değişiklik audit'e yazılır (`map-settings.update`). Sınırlar: yakınlaştırma 0–24, model 0–50 (0 haritada 3B'yi kapatır). `.env` seçeneği reddedildi: her değişiklik yeniden başlatma ister ve panelden ayarlanamaz.
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
Karar veren / tarih: Weissman, 21 Eki. Uygulama: 21 Eki. `media_uploads.cleaned_at` (migration `0006`) süpürmenin her yüklemeyi bir kez temizlemesini sağlar; `STORAGE_UPLOAD_BUCKET` `STORAGE_BUCKET` ile aynıysa sunucu açılmaz. Yerelde denendi: `complete` sonrası aynı imzalı bağlantıyla yeniden yükleme başarılı ama dosya herkese açık okunamadı (400), süpürme sildi, yayındaki medya etkilenmedi.
Nasıl değiştirilir: `supabase/config.toml` kova tanımları ve depolama ayarları (`STORAGE_BUCKET`, `STORAGE_UPLOAD_BUCKET`; `src/config.ts`). Bulutta `uploads` kovası elle, herkese kapalı açılır.

**11.8 P5 (entegrasyon + yayına alma) backend tarafında yürütülür.**
Karar: P5'i (HTTP adaptörü, yayına alma, gerçek içerik yükleme) Weissman ve backend sorumlusu yürütür; plandaki "Weissman + Tamer" yerine. Adaptör arayüz dahil (giriş ekranı, yükleme, oturum durumu) bizde yapılır; Tamer'e başta haber verilir ve ön yüze dokunan PR'ları Tamer inceler (kapsam §11.10). Çakışmayı azaltmak için PR'lar küçük tutulur (önce `packages/api-client`, sonra arayüz) ve açılmadan hemen önce `main` üzerine alınır.
Neden: P1–P4 bitti; P5'i beklemeden başlatmak, dondurmadan (6 Kas) önce ekibin gerçek telefonda HTTPS üzerinden test etmesine zaman kazandırır.
Karar veren / tarih: Weissman, 21 Eki.
Nasıl değiştirilir: P5'in bir parçası Tamer'e devredilebilir; bu kayıt güncellenir.

**11.9 Çevrimiçi test ortamında giriş, Supabase'in kendi e-postasıyla.** (Yerleşik e-posta kısmı §11.16 ile değişti: Gmail SMTP.)
Karar: Test ortamında giriş, üretimdekiyle aynı e-posta kodu akışıdır; ayrı bir SMTP hesabı açılmaz, Supabase'in yerleşik e-posta servisi kullanılır. Test eden 4 kişi Supabase organizasyonunun ekibine eklenir (yerleşik servis yalnız ekip üyelerine gönderir). Sabit, şifreli rol hesapları yapılmaz.
Neden: Ücretsiz, kurulum gerektirmez ve üretimden ayrı bir giriş yolu kodlamayı önler. Sınır: proje başına saatte 2 e-posta; oturumlar uzun sürdüğü için 4 kişilik ekipte yeterli.
Karar veren / tarih: Weissman, 21 Eki. API sunucusu (Render/Railway vb.) seçimi yayına alma adımına (P5.2) bırakıldı.
Nasıl değiştirilir: Sınır yetmezse ücretsiz bir SMTP servisi (örn. Resend; alan adı doğrulaması gerekir) Supabase panelinde tanımlanır, kod değişmez.

**11.10 PR incelemesi alana göre: ön yüz Tamer'de, backend bizde.**
Karar: `apps/web` ya da `packages/*` (`@akar/domain`, `@akar/api-client`; ön yüzün kullandığı ortak kod) dosyalarına dokunan PR'ı Tamer inceler ve onaylar. Yalnız `services/api`, backend belgeleri ve üretilen `docs/api/openapi.json` değişen PR, CI yeşil olunca Weissman'ın kararıyla birleştirilir; Tamer onayı beklenmez. API sözleşmesi değişirse (yeni uç, alan, hata kodu) PR açıklaması ve `docs/API-HANDOFF.md` bunu yazar, Tamer bilgi için etiketlenir.
Neden: backend Weissman ve backend sorumlusunun, ön yüz Tamer'in alanı. §11.8'deki "her PR'ı Tamer inceler" ifadesi, ön yüz koduna dokunan P5 işi için konmuştu; backend PR'larını bekletmek gereksiz.
Karar veren / tarih: Weissman, 21 Eki.
Nasıl değiştirilir: bu kayıt; istenirse `main` için GitHub dal koruması (CODEOWNERS ile `apps/web`, `packages/*` → Tamer) eklenebilir.
§11.20 ile güncellendi.

**11.11 Başkalarının onaylı anıları tek akıştan okunur.**
Karar: `GET /v1/memories` herkese açık, önbellekli bir anı akışıdır: yayındaki eserlerin onaylı anıları en yeniden eskiye, keyset sayfalama; isteğe bağlı `siteIds` (en çok 100) ve `city` ile daraltılır. Taslak ya da bilinmeyen eser kimliği 404 değil boş sonuç verir (akış, eser başına uçtaki gibi tek kayıt sormaz; boş sonuç taslağın varlığını sızdırmaz). Yeni tablo ya da migration yok; mevcut `memories_status_created_idx` kullanılır. İstemci bağlantısı P5.1b'de yapılır.
Neden: istemci bugün yalnız kendi anılarını ve moderasyon kuyruğunu çekiyor; eser başına ayrı istek, 84+ eserlik haritada gereksiz yük.
Karar veren / tarih: Weissman (iş sırası A → B → C), 21 Eki; uç biçimi backend sorumlusunun.
Nasıl değiştirilir: `services/api/src/modules/moderation/` (`MemoryFeedQuery`, `listMemoryFeed`).

**11.12 Önce arayüz bağlantısı (P5.1b), sonra çevrimiçi test ortamı (P5.2).**
Karar: Çevrimiçi test ortamı, giriş ekranı ve arayüz bağlantısı (P5.1b) test edilebilir hâle geldikten sonra kurulur. Acele yok.
Neden: Girişsiz yalnız misafir akışları denenebilir (harita, eser, hikâye, cihazda bulmaca); kaydetme, İz Bırak, puan ve moderasyon giriş ekranını bekler. Ortamı tek seferde, tüm akışlar denenebilir durumdayken kurmak tercih edildi. Bilinen risk: yalnız çevrimiçi ortamda görülen sorunlar (CORS, bulut kovaları, Supabase e-postası, telefonda HTTPS gerektiren konum) daha geç ortaya çıkar.
Karar veren / tarih: Weissman, 21 Eki.
Nasıl değiştirilir: ortam (P5.2) istenen anda öne alınabilir; barındırma seçimi o zaman sorulur.

**11.13 Demoda yönetim paneli API kipinde yalnız mevcut kayıtları günceller.**
Karar: P5.1b'de yönetim paneli API kipinde eser, katalog ve fotoğraf için yalnız mevcut kayıtları günceller; yeni eser, rota ya da kart oluşturma API'ye eklenmez, bu komutlar API kipinde `UnsupportedCommandError` ile anlaşılır bir mesaj gösterir. P5.1b'ye Tamer onay verdi. (Yeni eser ve yeni rota kısmı §11.29 ile değişti.)
Neden: demo için yeterli; oluşturma uçları ayrı bir API PR'ı ve daha büyük bir ön yüz değişikliği gerektirirdi.
Karar veren / tarih: Weissman, 21 Eki.
Nasıl değiştirilir: oluşturma uçları (`POST /v1/admin/sites` vb.) ayrı bir `feat/api-admin-create` PR'ıyla eklenir, sonra panel bağlanır.

**11.15 Hesaplar açılmadan, sağlayıcıdan bağımsız yayına alma hazırlığı (P5.2 ön işi).**
Karar: Barındırma seçimi ve bulut hesapları beklenmeden API yayına hazırlanır: tek Docker imajı (`services/api/Dockerfile`, kök `.dockerignore` yalnız API dosyalarını alır), sunucudan ayrı migration komutu (`node src/db/migrate.ts`, yerelde `npm run db:migrate`), üretimde eksik ayarla açılmama (`productionIssues`), hesap gerektiren adımların listesi (`services/api/README.md` "Yayına alma", `docs/TESTING.md` §7). Hesap açılmaz.
Teknik seçimler: Derleme adımı yok; Node 24 TypeScript kaynağını tip silmeyle doğrudan çalıştırır, `tsx` yalnız geliştirmede (`dev`, testler, `ingest`, `db:seed`) kalır. Bu yüzden API `tsconfig.json`'da `erasableSyntaxOnly` açık. Ortak paketlerde `"type": "module"` olmadığından Node her dosyada ESM'i kendisi algılar ve uyarır; uyarı imajda ve `start`/`db:migrate` betiklerinde `--disable-warning=MODULE_TYPELESS_PACKAGE_JSON` ile kapatıldı (paketlere `"type": "module"` eklemek ön yüz incelemesi gerektirir, §11.10). Üretimde `fs` depolama reddedilir (konteyner diski kalıcı değil). CI imajı kurar ve eksik ortamla açılmayı reddettiğini denetler.
Bulut için bilinen riskler (hesap açılınca doğrulanır): Supabase'te API tabloları `public` şemasında olduğundan Data API kapatılmalı (aksi halde anon anahtarla erişilebilir; README adım 2). Bağlantı session pooler üzerinden; `pg` havuzu (en çok 10) ve pg-boss bağlantıları ücretsiz katmanın havuz sınırına yaklaşabilir.
Karar veren / tarih: Weissman, 22 Eki ("host-neutral deploy prep before accounts exist").
Nasıl değiştirilir: sağlayıcı seçilince (P5.2) gerekirse sağlayıcıya özel ayar dosyası eklenir; imaj ve komutlar değişmez.

**11.16 Çevrimiçi test ortamı: Render + Supabase bulut + ayrı Vercel projesi; giriş e-postası Gmail SMTP.**

**Değişti — 23 Ekim 2026:** Web ve API Vercel `main` dağıtımlarına, veritabanı/Auth/Storage Frankfurt Supabase projesine taşındı. SMTP Hostinger kullanıyor. Güncel bağlantı ve doğrulama: [canlı ortam kaydı](deployment/2026-10-23-cloud-migration.md). Aşağıdaki gerekçe eski kararın kaydıdır.
> Bu eski dağıtım kararı yeni Vercel + Supabase kurulumu ile değiştirilmiştir. Güncel bağlantı ve kurulum adımları `services/api/README.md` içindedir; eski servis adresleri kullanılmaz.
Neden: Render kurulumu basit ve şimdilik ücretsiz; öğrenci avantajıyla Heroku da değerlendirildi, vazgeçildi. Ücretsiz Supabase planında yerleşik e-posta şablon değişikliğine izin vermiyor ve varsayılan şablon 6 haneli kod yerine bağlantı gönderiyor; giriş ekranı kod beklediği için özel SMTP gerekli. Gmail alan adı istemez, ücretsizdir (günde ~500 e-posta) ve test edenlerin Supabase ekibine eklenmesi gerekmez. Ayrı Vercel projesi, demo adresini değiştirmeden gerçek API'yi denemeyi sağlar; ön yüz kodu değişmez.
Bilinen sınırlar: Free plan 15 dakika boşta kalınca uyur (ilk istek ~1 dakika); dağıtım öncesi migration komutu yok, migration bilgisayardan çalıştırılır. Misafir sınırı IP başına dakikada 300; API kipinde sayfa açılışı eser sayısından bağımsız olarak üç istektir (`site-details`, `routes`, `memories`; PR #14).
Karar veren / tarih: Weissman, 22 Eki.
Nasıl değiştirilir: Render planı panelden yükseltilir (Starter, dağıtım öncesi `node src/db/migrate.ts`); SMTP Supabase → Authentication → Emails'ten başka bir servise (Brevo, Resend) çevrilir, kod değişmez; Tamer'in projesi gerçek API'ye geçecekse aynı üç `NEXT_PUBLIC_*` değişkeni orada tanımlanır.

**11.17 Admin kendi İz Bırak anısını karara bağlayabilir; moderatör bağlayamaz.**
Karar: `POST /v1/admin/memories/:id/decision`'da yazar ile karar veren aynı kişiyse yalnız `admin` rolü devam edebilir; `moderator` için 403 kalır. Kullanıcılar zaten karar veremez. Admin kendi anısını onaylarsa her onayda olduğu gibi yazara (kendisine) 25 puan yazılır ve karar audit kaydına admin kimliğiyle düşer.
Neden: çevrimiçi test ortamında admin, kendi fotoğraflı anısını onaylayamıyordu (demo kipinde bu kontrol yoktu). Admin zaten en yetkili roldür; kendi içeriğini yayına almasını engellemek ek güvenlik sağlamaz. Moderatör için dört göz ilkesi korunur.
Karar veren / tarih: Weissman, 22 Eki.
Nasıl değiştirilir: `services/api/src/modules/moderation/service.ts` `decideMemory` (rol kontrolü); kendi onayına puan verilmemesi istenirse aynı yerde `recordPointEvent` koşula bağlanır.

**11.18 İz Bırak silme ve yayından kaldırma.**
Karar: Moderatör onaylı her anıyı nedenli retle yayından kaldırabilir (bildirim gerekmez; bildirilmemiş anıda audit `memory.takedown`, bildirilmişte `memory.reject`); kalıcı silemez, kendi anısına yine karar veremez (§11.17). Admin bunlara ek olarak her anıyı kalıcı siler (`DELETE /v1/admin/memories/:id`: kayıt, bildirimleri ve fotoğraf). Yazar kendi anısını her durumda (beklemede, onaylı, reddedilmiş) siler (`DELETE /v1/me/memories/:id`, KVKK silme); başkasının anısı 404. Ret ya da kaldırmada fotoğraf (kayıt ve herkese açık dosya) silinir, metin moderasyon geçmişi için kalır; ret kesindir. Onaylı anı hangi yolla kalkarsa kalksın (yazar silmesi, admin silmesi, moderatörün kaldırması ya da bildirilmiş anıyı reddi) 25 puan bir kez geri alınır (`memory.removed`, −25; yalnız `memory.approved` yazılmışsa). Silme audit kaydı metin içermez. Dosya, veritabanı işlemi tamamlandıktan sonra silinir: silme başarısız olursa sahipsiz dosya kalabilir (loga düşer), olmayan dosyayı gösteren kayıt kalmaz. Başka bir içeriğin de kullandığı fotoğraf silinmez.
Saklanan idempotency yanıtları (anı metni içerebilir) 24 saat sonra silinir (`purgeIdempotencyKeys`), böylece KVKK silmesinden sonra metnin kopyası kalmaz.
Neden: kimse anı ya da fotoğraf silemiyordu, bildirilmemiş onaylı anı kaldırılamıyordu (409) ve reddedilen fotoğraflar herkese açık kovada okunur kalıyordu. Moderatörün kaldırmak için anıyı bildirip reddetmesi bildirim sayılarını ve audit'i bozardı, kendi anısında imkânsızdı. Puanın her kaldırmada geri alınması, puanın yayındaki onaylı anıları izlemesini sağlar ("admin kaldırırsa" kuralının moderatöre genişletilmesi kullanıcıyla 22 Eki'de teyit edildi).
Karar veren / tarih: Weissman, 22 Eki.
Nasıl değiştirilir: `services/api/src/modules/moderation/service.ts` (`decideMemory`, `deleteMemory`), uçlar `moderation/routes.ts`; puan `engagement/points.ts` (`takeBackMemoryPoints`); fotoğraf silme `media/service.ts` (`deleteUnreferencedMedia`, `MEDIA_REFERENCES`).

**11.19 Kötüye kullanım sınırları: anı ve fotoğraf kotası, sahipsiz fotoğraf süpürmesi.**
Karar: Yalnız `user` rolü için (personel muaf): aynı anda en çok 3 bekleyen anı; kayan 24 saatte en çok 10 anı ve 10 fotoğraf yükleme bileti; aşılırsa 429 `RATE_LIMITED`, Türkçe mesaj. Anı sayımı her gönderide yazılan metinsiz `memory.create` audit kaydından yapılır, böylece silinen anı günlük hakkı geri vermez (bekleyen hakkını verir). Fotoğraf sayımı `media_uploads` satırlarından yapılır (satırlar silinmez). Personel dışı kullanıcının yüklediği, hiçbir anı ya da içerik tablosunun kullanmadığı fotoğraf 24 saat sonra silinir (`sweepUnattachedPhotos`, `server.ts` 15 dakikada bir; şu an `staff_members` kaydı olanların, editör/admin olarak yüklenmiş (`media.create` audit kaydı olan, yetkisi sonradan alınsa da) fotoğraflara ve tohum içeriğe dokunmaz). Yeni göç yok: 24 saatlik sayım `audit_log_at_idx` ile yeterince hızlı; kayıt sayısı büyürse `(actor_id, action, at)` dizini eklenir.
Neden: `createMemory` sınırsızdı ve açık yükleme sınırı (10) yalnız açık biletleri sayıyordu; tek hesap dakikada yüzlerce 5 MB fotoğraf tamamlayıp Supabase Free depolamasını (1 GB) dakikalar içinde doldurabilirdi, anıya bağlanmayan fotoğraflar hiç temizlenmiyordu.
Karar veren / tarih: Weissman, 22 Eki.
Nasıl değiştirilir: sabitler `moderation/service.ts` (`PENDING_QUOTA`, `DAILY_MEMORY_QUOTA`) ve `media/service.ts` (`DAILY_UPLOAD_QUOTA`, `UNATTACHED_PHOTO_HOURS`).

**11.20 PR incelemesi: Tamer'e her zaman bilgi, küçük ön yüz işlerinde onay Weissman'ın kararıyla atlanabilir.**
Karar: `apps/web`/`packages/*` PR'ında geliştirici PR açmadan önce Weissman'a sorar: Tamer onayı mı, yalnız bilgi mi. Küçük/temel değişikliklerde Weissman onayı atlayabilir; her durumda Tamer PR'a inceleyici olarak eklenir ve açıklamada etiketlenir; "yalnız bilgi" PR'ında açıklama onay beklenmediğini yazar, birleştirmeye Weissman karar verir. §11.10'u bu kadarıyla değiştirir.
Neden: küçük ön yüz işleri Tamer'i beklemesin, Tamer yine her şeyden haberdar olsun.
Karar veren / tarih: Weissman, 22 Eki.
Nasıl değiştirilir: bu kayıt; GitHub dal koruması şu an yok.

**11.21 Yönetim panelinde sağlık uyarısı: depolama doluluğu ve uzun süredir bekleyen anılar.**
Karar: `GET /v1/admin/health` (moderatör ve admin, `no-store`). `pendingStale`: 48 saatten uzun süredir `pending` olan anıların sayısı, en eskisinin gönderim zamanı ve eşik (`thresholdHours: 48`); moderatöre de gösterilir. `storage`: medya kayıtlarının toplam boyutu (`SUM(media.bytes)`, boyutsuz kayıt 0) kotaya (`STORAGE_QUOTA_MB`, varsayılan 1024) oranlanır, türe göre dökümüyle; yalnız admin'e verilir, moderatör cevabında alan yoktur. Eşikler: %80 ve üstü `warn`, %95 ve üstü `critical`.
Neden: Supabase Free depolaması 1 GB; fotoğraflar anı onaylanınca kalıcıdır ve bekleyen anılar moderasyon olmadan birikebilir. Depolama dolunca yüklemeler durur; bunu panelde önceden görmek gerekir. Depolama kotası ve fatura kararı admin'in işidir, bu yüzden moderatör yalnız bekleyen uyarısını görür.
Karar veren / tarih: Weissman, 22 Eki. Bekleme süresinin başlangıcı §11.25 ile değişti (gönderim yerine kuyruğa son giriş).
Nasıl değiştirilir: `STORAGE_QUOTA_MB` ortam değişkeni ve bu kayıt; eşikler `services/api/src/modules/admin-health/service.ts` (`PENDING_STALE_HOURS`, `STORAGE_WARN_PERCENT`, `STORAGE_CRITICAL_PERCENT`).

**11.22 Yönetim paneli taslakları toplu okur: `GET /v1/admin/site-details`.**
Karar: `GET /v1/admin/site-details` (`editor` ve `admin`, `no-store`) taslaklar dahil eserlerin düzenlenebilir tam görünümünü (`AdminSiteDetail`) toplu verir, `{ items, nextCursor }`, `limit` 1–100 (varsayılan 20). Süzgeçler (`status`, `city`, `query`), sıra (ad, sonra kimlik) ve imleç `GET /v1/admin/sites` ile aynıdır: iki uçta aynı sayfa aynı kimlikleri taşır. Her öğe `GET /v1/admin/sites/:id` gövdesine eşittir; ikisi de aynı toplu yükleyiciyi kullanır (`getAdminSites`), sayfa başına sorgu sayısı sabittir.
Neden: panel API kipinde yalnız yayındaki eserleri (`GET /v1/site-details`) görüyordu; taslakları listeleyip yayınlayamıyordu. Taslakları tek tek `GET /v1/admin/sites/:id` ile okumak 243 taslak için yaklaşık 240 istek olurdu; toplu uçla sayfa başına 100 eserle 3 istek yeter.
Karar veren / tarih: Weissman, 22 Eki.
Nasıl değiştirilir: bu kayıt; sayfa sınırı `PageQuery`'dedir (`services/api/src/platform/pagination.ts`), uç `services/api/src/modules/admin-catalog/sites-routes.ts` içindedir.

**11.23 Panelde konumu ya da türü olmayan taslak.**
Karar: Panel API kipinde editör ve admin'e taslakları da gösterir (§11.22). Konumu olmayan taslak, şehrin yayındaki eserlerinin ortasında gösterilir (şehirde yayında eser yoksa demo bölgesinin merkezi); editör iğneyi taşıyıp kaydedince konum elle girilmiş sayılır (`PUT .../location`), taşımadan kaydederse konum gönderilmez ve sunucu yayını reddetmeye devam eder. Türü olmayan taslak "cami" görünür ve o taslak her kaydedildiğinde seçili tür gönderilir; editör kaydetmeden önce türü kontrol etmelidir. Yayındaki eseri taslağa almak onu panelden düşürmez, taslak olarak kalır.
Neden: arayüz değişmeden (alan, uyarı ya da ayrı "konum düzelt" ekranı eklemeden) taslakların tamamını panelde göstermek. Konumu olmayan 50 kadar, türü olmayan 7 kadar taslak vardı; gizlemek editörün onları hiç görmemesi demekti.
Bilinen sınır: tohum ve SQL ile yayınlanmış bazı eserler bugünkü yayın kapısını geçmez; panelde taslağa alınırlarsa eksikler tamamlanmadan yeniden yayınlanamazlar. Hikâye, fotoğraf, kaynak ve model düzenleme API kipinde §11.27 ile geldi; içe aktarılan taslaklar artık panelde tamamlanıp yayınlanabilir.
Karar veren / tarih: Weissman, 22 Eki.
Nasıl değiştirilir: `packages/api-client/src/http.ts` (`mapAdminSite`, `placeholderOf`, `updateSite`) ve bu kayıt.

**11.24 Herkese açık okumalar süreli önbellek yerine her kullanımda doğrulanır.**
Karar: Önbellekli herkese açık uçların `Cache-Control` başlığı `public, max-age=60, stale-while-revalidate=300` yerine `public, no-cache` (`services/api/src/http-cache.ts`). Zayıf `ETag` ve `If-None-Match` → `304` aynen kalır. Tarayıcı yanıtı saklar ama her kullanımda sunucuya sorar; değişmeyen yanıt gövdesiz `304` döner.
Neden: 60 saniyelik süre ve ardından 5 dakikalık "eskiyi göster, arkada tazele" penceresi yüzünden yeni rota, bulmaca, yayınlanan eser ya da moderasyon kararı ziyaretçiye geç görünüyordu. Panelin kendisi de etkileniyordu: rota ve fotoğraf kaydından sonraki yeniden okuma (`refreshRoutes`, `refreshSite`) tarayıcı önbelleğinden önceki hâli alabiliyordu. Demo yolunda "panelde onay + yeni eser" adımı anında görünmeli. Maliyet: her sayfa açılışında üç istek (`site-details`, `routes`, `memories`) yine sunucuya gider ve veritabanı sorgusu çalışır; değişiklik yoksa yalnız başlık döner. İstek sayısı değişmez (önbellekten okunan yanıt zaten açılış başına bir kez okunuyordu), bu yüzden IP başına dakikada 300 sınırı etkilenmez. Paylaşılan CDN yok; olursa `s-maxage` ayrıca düşünülür. Yazmadan sonra uçları tek tek geçersiz kılmak (sürüm numarası, etiket) daha karmaşık olduğu için seçilmedi.
Karar veren / tarih: Weissman (iş sırası, "kısalt ya da değişince geçersiz kıl"), 22 Eki; biçim backend sorumlusunun.
Nasıl değiştirilir: `CACHE_CONTROL` (`services/api/src/http-cache.ts`); süre geri gelirse istemcinin yazmadan sonraki okumaları `cache: "no-cache"` göndermeli.

**11.25 Bekleyen anının süresi kuyruğa son girişinden sayılır.**
Karar: `memories.pending_since` (migration `0007`): anı gönderilince ve bildirimlerle kuyruğa geri dönünce (`REPORT_HIDE_THRESHOLD` = 3) o ana ayarlanır. Sağlık uyarısı (§11.21) bekleyen anıyı `created_at` yerine buna göre yaşlandırır; yanıttaki alan `oldestCreatedAt` yerine `oldestPendingSince`. Migration mevcut satırları doldurur: bekleyen anıda `updated_at` (bugün bekleyen anı yalnız gönderimde ve geri dönüşte yazılır), diğerlerinde `created_at`. Kuyruk sırası (`GET /v1/admin/memories`, en eski gönderim önce) değişmedi.
Neden: haftalar önce gönderilmiş, bugün bildirimle kuyruğa dönen anı panelde hemen "48 saati aştı" görünüyordu. Ayrı sütun `updated_at`'e dayanmaktan sağlamdır: bekleyen anıya ileride başka bir yazma (ör. düzenleme) eklense süre sıfırlanmaz.
Karar veren / tarih: Weissman (sütun ve alan adı), 22 Eki.
Nasıl değiştirilir: `services/api/src/modules/admin-health/service.ts` (`pendingStale`), `reportMemory` (`services/api/src/modules/moderation/service.ts`) ve bu kayıt.

**11.26 Eserin şehri panelden değiştirilebilir.**
Karar: `PATCH /v1/admin/sites/:id/info` `city` alanı alır (şehir kimliği ya da adı; `slugify` ile kimliğe çevrilir, oluşturmadaki gibi). Eser kimliği değişmez (kimlik opaktır; rota durakları, anılar ve kaydedilenler ona bağlı). İlçe yeni şehirde yeniden aranır ya da açılır; arama metni ve yinelenme anahtarı yeni şehre göre yazılır, yeni şehirde aynı ad ve ilçe 409. Bir rotada durak olan eser taşınamaz (400, rota adlarıyla): rotanın durakları rotanın şehrinde kalır (`setStops` kuralı). Bilinmeyen şehir 400. Audit `site.update` anlık görüntüsü `cityId` taşır.
Neden: tam eser düzenleme (iş listesi madde 3) istemcide hikâye, fotoğraf, kaynak ve modelin yanında şehri de API'ye yazmalı; API'de bunun ucu yoktu. Ayrı API PR'ı, istemci PR'ından önce.
Karar veren / tarih: Weissman (önce küçük API PR'ı), 23 Eki; kurallar backend sorumlusunun.
Nasıl değiştirilir: `services/api/src/modules/admin-catalog/sites.ts` (`resolveMoveCity`, `updateSiteInfo`), `SiteInfoBody` (`sites-schemas.ts`) ve bu kayıt.

**11.27 Panelde tam eser düzenleme API kipinde.**
Karar: API kipinde eser kaydı (`site` komutu) hikâye, fotoğraf, kaynak, model ve şehir değişikliklerini de kaydeder; önceden `UnsupportedCommandError` veriyordu. İstemci (`packages/api-client/src/http.ts` `updateSite` → `saveContent`) değişen adımları sihirbaz uçlarıyla sırayla yazar: bilgiler (şehir dahil, §11.26), konum, kaynaklar, yeni dosyalar (data URL → yükleme; fotoğraf ayrıntıları `complete` ile), var olan fotoğrafın değişen ayrıntıları (`PATCH /v1/admin/media/:id`, ortak görsel her yerde değişir), model, fotoğraf listesi ve kapak, hikâye, en son yayın/yayından alma. Değişmeyen adım istek atmaz. Editörün yerel kimlikleri (yeni fotoğraf) sunucunun medya kimliğine çevrilir. Alan modelinde olmayan sunucu alanları korunur: kaynağın esere özgü yeri (`locator`), cümlenin kartı, kamera açısı ve ses kayıtları. Yeni modelin parça adları arka plan işinde okunduğundan, vurgulu cümle varsa hikâye kaydı parça adları gelene kadar (en çok ~20 sn) bekler; gelmezse Türkçe hata. Panelden yüklenen model "Katkı sahibi izniyle" lisansıyla, editörün seçtiği güvenle kaydedilir; yeni model açılış açısız başlar.
Bilinen sınırlar: adımlar tek işlem değildir; ortada bir adım reddedilirse önceki adımlar kayıtlı kalır ve eser yeniden okunarak gösterilir (yüklenen dosya kütüphanede kalır). Yalnız Geçmişi Gör görseli ya da kart görseli olan fotoğraf panelin fotoğraf listesinde görünmez; liste kaydedilirse bu fotoğrafın eserle bağı (`site_media`) düşer, görsel yerinde kalır.
Karar veren / tarih: Weissman (iş listesi madde 3), 23 Eki; adım sırası ve bekleme backend sorumlusunun.
Nasıl değiştirilir: `packages/api-client/src/http.ts` (`saveContent`, `MODEL_PARTS_ATTEMPTS`, `CONTRIBUTOR_LICENSE`) ve bu kayıt.

**11.28 Next.js 16.4.0 → 16.4.2 (güvenlik yaması).**
Karar: `apps/web` Next.js sürümü 16.4.2'ye yükseltilir (tam sürüm sabit kalır). 16.0.0–16.4.0 arası üç güvenlik uyarısı taşır: Image Optimization API'de SVG ile kimliksiz uzaktan kod çalıştırma (GHSA-2464-fhr4-w9xw, kritik), `use cache` işlevlerinde kimliksiz uzaktan kod çalıştırma (GHSA-673q-mjm6-r5xr, kritik), Server Actions ile hizmet dışı bırakma (GHSA-p3m5-59mp-jv5r, yüksek). Yama sürümüdür; kilit dosyasında yalnız `next` ve `@next/*` değişir. 16.4.0 ile yerelde `next dev` güvenlik uyarısı gösterip kapanıyordu.
Neden: uygulama `next/image`, `use cache` ya da Server Actions kullanmıyor, açık bu yüzden düşük olabilir; yine de yama küçük ve riski az, yerel geliştirme ve API kipi uçtan uca testleri de onsuz çalışmıyor. `maplibre-gl` için ayrı bir kritik uyarı var; düzeltmesi ana sürüm değişikliği ister, bu kararın dışında.
Karar veren / tarih: Weissman, 23 Eki; Tamer'e bilgi (§11.20).
Nasıl değiştirilir: `apps/web/package.json` `next` sürümü ve `package-lock.json` (`npm install next@<sürüm> --save-exact -w @akar/web`).

**11.29 Panelde yeni eser ve yeni rota API kipinde.**
Karar: API kipinde yeni eser ve yeni rota kaydı sunucuda oluşturulur; önceden `UnsupportedCommandError` veriyordu (§11.13). Uçlar zaten vardı (`POST /v1/admin/sites`, `POST /v1/admin/routes`); değişiklik yalnız istemcide (`packages/api-client/src/http.ts`). Yeni eser: bilinmeyen kimlikli `site` komutu bilgilerle ve şehirle (`city`, eserin şehir adı) oluşturulur, sonra konum her zaman gönderilir (iğneyi editör koydu; §11.23'teki yer tutucu kuralı yalnız içe aktarılan taslaklar için), sonra §11.27'deki adımlar, en son yayın. Yeni rota: `catalog-routes` listesindeki bilinmeyen kimlikli rota `POST /v1/admin/routes` ile açılır; şehri ilk durağın şehridir (rotanın durakları tek şehirde olmalı), durağı olmayan yeni rota hiçbir istek atmadan reddedilir ("en az bir durak seç"). Kimliği sunucu üretir; istemci panelin kendi kimliğini sunucununkine eşler, böylece açık kalan düzenleyicide ikinci kayıt aynı kaydı günceller, yenisini açmaz. Editör ve admin taslak rotaları da görür (`GET /v1/admin/routes?status=draft`, sonra taslak başına bir okuma); herkese açık rota listesi taslak rotayı göstermez. Rotanın yayına alınması ve taslağa çekilmesi yalnız durum değişince istek atar. Boş İngilizce rota adı `null` gönderilir.
Bilinen sınırlar: rota silme API'de yok, panelde reddedilir (taslağa almak yayından kaldırır). Taslak rotanın süre ve mesafesi panelde hesaplanmaz (sunucu yalnız yayındaki rotada hesaplar; panel kayıtta kendi hesaplar). Oluşturma ile sonraki adımlar tek işlem değildir: bir adım reddedilirse oluşan kayıt taslak olarak kalır ve düzenleyiciden yeniden kaydedilebilir.
Karar veren / tarih: Weissman (iş listesi madde 2), 23 Eki; şehir ve kimlik eşleme kuralları backend sorumlusunun.
Nasıl değiştirilir: `packages/api-client/src/http.ts` (`updateSite`, `updateRoutes`, `createdIds`, `loadDraftRoutes`) ve bu kayıt.

**11.30 Rotam ve misafirin kayıtları hesaba bağlanır.**
Karar: Oturum açmış kullanıcının "Rotam"ı sunucuda tutulur: `user_route_stops` (migration `0008`; kullanıcı, eser, sıra), `GET /v1/me/route` ve `PUT /v1/me/route` (`{ siteIds }` rotanın tamamıdır, sırasıyla; en çok 100 eser, yinelenen eser `400`, yayında olmayan eser kaydetmedeki gibi `404`). Yazma kullanıcı başına kilitlidir: aynı anda gelen iki yazmadan biri kazanır, listeler karışmaz. Yayından kalkan durak okumada gösterilmez, satırı kalır ve eser yeniden yayınlanınca geri gelir; ama sonraki bir `PUT` onu içermiyorsa silinir. Misafirin kaydettikleri ve Rotam'ı sunucuda cihaz kimliğiyle tutulmaz, cihazda kalır; giriş yapınca istemci bunları hesaba taşır (kaydedilenler `PUT /v1/me/saved/:id` ile; Rotam hesaptakinin sonuna eklenir, aynı eser bir kez) ve cihazdan siler.
İstemci (`packages/api-client/src/http.ts`): oturum açıkken her kullanıcı yüklemesi `GET /v1/me/route`'u da okur; Rotam'a ekleme/çıkarma ve sıralama tek `PUT /v1/me/route` gönderir, sunucunun döndürdüğü liste gösterilir. Taşıma (`adoptLocal`) girişten sonraki ilk yüklemede yapılır: hesapta olmayan her kayıt için bir `PUT` (bu arada yayından kalkan eser `404` verir, atlanır), cihazın yayındaki durakları hesaptakilerin sonuna eklenir ve 100'de kesilir, liste değiştiyse tek `PUT`. Hepsi başarılıysa cihazdaki iki liste silinir; bir adım başarısız olursa cihazdaki listeler kalır ve sonraki yüklemede yeniden denenir (kaydetme tekrarlansa da zararsızdır). Çıkış yapınca cihazdaki Rotam boştur.
Neden: Kayıtlar zaten hesaptaydı; Rotam ise yalnız cihazdaydı ve misafirken kaydedilenler girişten sonra görünmüyordu. Cihaz kimliğiyle sunucuda tutulan liste tarayıcı verisi silinince yine erişilemez olur; üstüne kişisel veri, temizleme işi ve kötüye kullanım sınırı getirir (KVKK). Birleştirmede hesaptakinin sonuna eklemek iki taraftan da veri kaybettirmez.
Karar veren / tarih: Weissman (iş listesi madde 4), 23 Eki: misafir cihazda kalır ve girişte taşınır, birleştirmede sona ekleme, sınır 100.
Nasıl değiştirilir: `MY_ROUTE_MAX` (`modules/engagement/schemas.ts`; istemcide aynı adlı sabit), `getMyRoute`/`setMyRoute` (`modules/engagement/service.ts`), istemcide `adoptLocal`/`setRoute`; cihaz kimliğiyle saklamaya geçmek yeni karar ister.

**11.31 Hesabı ve verileri silme (KVKK).**
Karar: `DELETE /v1/me` (oturum açan kullanıcı) ve `DELETE /v1/admin/users/:userId` (yalnız admin, e-postayla gelen talepler için; id UUID olmalı, bilinmeyen ya da zaten silinmiş id de `204`) hesabı hemen ve geri alınamaz biçimde siler: yazdığı anılar (her durumda; bildirimleri ve fotoğraflarıyla), başka anılara yaptığı bildirimler (bildirim sayısı düşer; bu yüzden beklemeye dönmüş anı beklemede kalır), puan defteri, kaydedilenler, Rotam, hikâye ve bulmaca ilerlemesi, rozetler, görünen ad, yükleme biletleri (özel `uploads` kovasındaki dosyalarıyla), hiçbir yerde kullanılmayan yüklediği medya, kullanılmış personel daveti (e-posta adresi taşır) ve saklanan idempotency yanıtları. İçerikte kullanılan medya satırı kalır, yükleyeni boşaltılır; editör/admin olarak yüklenmiş kütüphane (`media.create` audit) silinmez. Tümü tek işlemde yapılır; işlemin sonunda Supabase Auth kullanıcısı silinir (`DELETE /auth/v1/admin/users/:id`; `404` silinmiş sayılır). Supabase hata verirse işlem geri alınır (`502`, hiçbir şey silinmez). Depolama nesneleri işlem bittikten sonra silinir: `media` kovasındakiler aynı işlemde `media_deletions` kuyruğuna yazılır, silinemeyen bakım çağrısında yeniden denenir; `uploads` kovasında henüz temizlenmemiş bilet dosyası hemen silinmeye çalışılır; ayrıca aynı transaction içinde `upload_deletions` kuyruğuna yazılır. İmzalı bağlantının süresi ve güvenlik payı dolunca bakım işçisi tekrar siler; hatalar artan gecikmeyle yeniden denenir. Storage yapılandırması Auth silinmeden önce kontrol edilir. Yetkili hesap (editör, moderatör, admin) silinemez (`409`): önce bir admin yetkiyi kaldırır. Silinen id `deleted_accounts` tablosuna yazılır (migration `0011`; yalnız id ve zaman); doğrulayıcı bu id'nin hâlâ geçerli token'ına `401` verir (rol sorgusuyla aynı tek sorguda). Audit kayıtları olduğu gibi kalır (metin ve e-posta yok; Auth kullanıcısı silinince id kimseyi göstermez); silme `account.delete` olarak sayılarla (anı, bildirim, kullanıcının kendisi mi) yazılır.
Neden: KVKK silme hakkı; Figma'da masaüstü profilde "Hesabımı ve verilerimi sil" var (arayüz sonra). Yetkilileri engellemek son adminin kaybolmasını ve yanlışlıkla silinmeyi önler. Silme işareti olmadan token'ın kalan süresinde (Supabase varsayılanı 1 saat) aynı id altında yeni veri yazılabilirdi. Supabase'i işlemin içinde çağırmak "veri silindi ama hesap duruyor" durumunu önler; ters sıradaki tek risk Supabase silindikten sonra commit'in düşmesidir (çok küçük), o zaman admin ucu aynı id ile tekrar çalıştırılır.
Bilinen sınır: silme sırasında aynı kullanıcının eşzamanlı başka bir yazması (örn. o an gönderilen anı) silmeden sonra commit olursa kalabilir; sonraki her istek `401` aldığından yeni veri eklenmez, kalan kayıt admin ucuyla tekrar silinir.
Karar veren / tarih: Weissman (iş listesi madde 7), 23 Eki: yetkili hesap engellenir, bildirimler silinir, audit olduğu gibi kalır, eski token silme işaretiyle engellenir, admin ucu aynı PR'da.
Nasıl değiştirilir: `eraseAccount` (`modules/identity/erasure.ts`) ve modüllerin silme fonksiyonları (`eraseMemories`, `eraseUploads`, `eraseEngagement`, `forgetIdempotencyKeys`); kullanıcıya bağlı yeni tablo eklenirse silmeye de eklenir (`identity-erasure.test.ts` her tabloyu tarar). Bekleme süreli (ör. 30 gün) silme yeni karar ister.

Dağıtım önkoşulu: `0011_deleted_accounts` , `0012_upload_deletions` ve `0013_erasure_rls` migration’ları yeni API sürümünden önce uygulanır.

Yeni silme tablolarında RLS açıktır; istemci rollerine doğrudan erişim politikası verilmez. API sunucusu ve bakım işçisi veritabanı bağlantısıyla erişir.

**11.32 Genel istek sınırı Vercel'de instance başına kalır (demo için kabul).**
Karar: `@fastify/rate-limit` (`app.ts`; dakikada 300, oturum açanda hesap, misafirde IP başına) bellekte sayar ve paylaşılan depo eklenmez. Vercel'de her serverless instance kendi sayacını tutar; trafik birden çok instance'a dağılınca toplam sınır 300'ün katlarına çıkar. Maliyetli kötüye kullanım veritabanındaki kotalarla zaten sınırlıdır ve instance sayısından etkilenmez: aynı anda 3 bekleyen anı ve 24 saatte 10 anı (§11.19), 24 saatte 10 fotoğraf yüklemesi ve açık en çok 10 yükleme bileti, 24 saatte 5 yeni bildirim.
Neden: Postgres'te ortak sayaç her isteğe (ya da her yazmaya) bir veritabanı yazması ekler; Supabase Free bağlantı havuzu ve sayfa açılış gecikmesi için demo haftasında değmez. Upstash yeni bir dış hesap ister. Bu sınır yalnız kaba sel trafiğine karşıdır.
Bilinen sınır: çok instance'a yayılan yoğun okuma trafiği (sayfa açılışı, katalog) API tarafında sınırlanmaz; veritabanı yükü artar.
Karar veren / tarih: Weissman (iş listesi madde 10), 23 Eki: "demo için kabul et".
Nasıl değiştirilir: `@fastify/rate-limit` `store` seçeneğine ortak depo (Postgres tablosu ya da Redis/Upstash) verilir, istenirse yalnız yazma uçları için; ya da Vercel Firewall'da IP başına kural tanımlanır (hesap Tamer'in). Demo sonrası P6 uç uç incelemesinde yeniden ele alınır.

**11.33 Yarım kalan `complete`'in yayın kovasındaki dosyası hemen silinir; kova taraması yapılmaz.**
Karar: `complete` doğrulanmış dosyayı `media` kovasına işlem commit olmadan yazar. İşlem geri alınırsa (veritabanı yazması, audit, iş kuyruğu, idempotency kaydı, yükleme anahtarının silinmesi ya da commit hata verirse) rota bu dosyayı hemen siler (`discardUnsavedObjects`, `media/service.ts`). Silmeden önce `media` satırının olmadığı ayrıca sorgulanır; satır varsa (hata commit'ten sonra geldiyse) dosya kalır. Sorgu ya da silme başarısız olursa dosya kalır ve loga yazılır. `media` kovasını listeleyip satırlarla karşılaştıran periyodik temizleyici yapılmaz.
Neden: diğer yetim dosya yolları zaten kapalıydı (`expireUploads` ve `upload_deletions` `uploads` kovası için, `media_deletions` silinen satırlar için, `sweepUnattachedPhotos` anıya bağlanmayan fotoğraflar için). Kalan tek yol buydu ve her yeniden denemede yeni id ile yeni bir herkese açık dosya bırakıyordu. Kova taraması her bakım çağrısında tüm kovayı listeler; Supabase Free ve serverless süre sınırı için demo öncesi değmez.
Bilinen sınır: işlem geri alındıktan sonra silme de başarısız olursa (depolama o an erişilemez) dosya kalır; yalnız logda görünür. Bu düzeltmeden önce oluşmuş yetim dosyalar temizlenmez.
Karar veren / tarih: Weissman (iş listesi madde 8), 23 Eki: "küçük düzeltme" seçildi.
Nasıl değiştirilir: yeniden deneme gerekirse anahtar işlemden bağımsız bir bağlantıyla `media_deletions`'a `put` öncesinde yazılır ve commit sonrası kaldırılır; tam temizlik için `media` kovasını listeleyip `media.storage_key` ve `media_deletions` ile karşılaştıran bir bakım işi eklenir.

**11.34 3B model yüklemesinde üçgen, doku ve 1 MB sınırı şimdilik konmaz.**
Karar: `complete` GLB için yalnız mevcut denetimleri yapar (ilk baytlar, 5 MB üst sınır). Üçgen sayısı, draw call, doku çözünürlüğü ve Figma'daki "Normal ≤ 1 MB" API'de zorlanmaz; Figma bütçesi (≤ 40k üçgen, ≤ 60 draw call, ≤ 1 MB Draco, Ulucami istisnası) 3B ekibinin dışa aktarma kılavuzu olarak kalır.
Neden: haritada aynı anda 5 modelin (§11.4) mobil tarayıcıda kaç üçgene kadar akıcı çalıştığı ölçülmeden tavan koymak tahmin olur; 100k üçgenli 5 model de akıcı olabilir. Depolama için boyut sınırı gerekmez: ekibin 14 GLB'si (Draco) 0,13–0,81 MB, üçgen 8k–39k (Ulucami 87 280), draw call 17–91, en büyük doku Koza Han'da 2087 px (23 Eki ölçümü, `docs/documents-context/eserler/*/3d/export/`). Modeller henüz haritada da çizilmiyor, yalnız hikâye ekranında tek tek açılıyor (`scene.tsx` → `model-viewer.tsx`); `modelMinZoom` ve `maxVisibleModels` web'de okunmuyor.
Karar veren / tarih: Weissman (iş listesi madde 6), 23 Eki: "performans sorunu görülürse ele alınır".
Nasıl değiştirilir: önce cihazda ölçüm (Redmi 9T, harita katmanı geldiğinde 5 model); sonra `media/magic.ts` `MEDIA_LIMITS.model.maxBytes` ve `complete`'te GLB JSON parçasından üçgen sayımı (Draco'da da accessor `count` geçerli) ile sınır; ya da yönetici `maxVisibleModels` düşürür / `modelMinZoom` yükseltir (uygulama sürümü gerekmez).

**11.35 Haritada 3B modeller ekip görüşleriyle onaylandı; inceleme ve canlı migration kuralı değişti.**
Karar: [Haritada 3B modeller planı](MAP-MODELS-PLAN.md) Muhammed Talay'ın (Redmi 9T prototipi) ve Tamer Akdeniz'in yorumlarıyla güncellenip uygulanır. Plana girenler: OSM binaları stilin `building_3d` katmanı yerine kendi katmanımızda tek tek çizilir; modelin taban izine düşenler otomatik gizlenir, panelden elle gizle/geri göster noktaları (`hidden_points`, `kept_points`) tutulur; modelin taban noktası kodla, seçilen ana parçadan (`anchor_node`) hesaplanır, dışa aktarma kuralından yalnız "1 birim = 1 metre" kalır; panelde OSM binasına oturtma, 90° döndürme, 0,5 m adım, uydu altlığı; yönetici detayı gizli modelin yerleşimini de döner; üçgen sayımı `TRIANGLE_STRIP` ve `TRIANGLE_FAN` için N − 2 sayar. Üçgen sınırı 139.152 (bugünkü en ağır model × 1,5), §11.34'teki "sınır yok" kararının yerine geçer. OSM'de eksik binalar başka kaynaktan doldurulmaz. Cihazda performans ölçümü şimdilik yapılmaz.
İnceleme ve dağıtım: yalnız API'ye dokunan PR'lar inceleyici beklemeden, CI yeşilse backend sorumlusunca birleştirilir. `apps/web` ya da `packages/*`'a dokunan PR'ları geliştiriciler kendileri dener (birim, e2e, tarayıcı); Tamer bilgi için inceleyici olarak eklenir, onay beklenmez, PR'ı geliştirici birleştirir (§11.10 ve §11.20'nin yerine). Canlı Supabase projesine (`akar-demo-frankfurt`) erişimimiz var; bizim PR'larımızın migration'larını, PR birleştirilmeden önce biz uygularız. Vercel projeleri Tamer'de kalır.
Neden: prototip OSM karolarının binaları birleşik gruplar hâlinde verdiğini ve kalıcı kimlik taşımadığını gösterdi; bugünkü GLB'lerde başlangıç noktası tutarsız. Ekip çalışmayı hızlandırmak için inceleme yükünü backend tarafına aldı.
Karar veren / tarih: Weissman, 28 Eki (planı onayladı; UI PR'larını kendimiz deneyip birleştirme, Tamer'i yalnız bilgi için ekleme, API PR'larında inceleyici beklememe, canlı migration'ı kendimiz uygulama).
Nasıl değiştirilir: plan belgesi güncellenir; inceleme kuralı için bu bölüm güncellenir.

**11.36 Haritada aynı anda en çok 10 model; harita ayarları yönetim panelinde.**
Karar: `maxVisibleModels` başlangıç değeri 5'ten 10'a çıkar (`@akar/domain` `defaultMapSettings`, `map_settings` sütun varsayılanı). Migration `0015` varsayılanı değiştirir ve satırı, yönetici hiç değiştirmediyse (`updated_by` boş, değer 5) 10 yapar; yöneticinin seçtiği değere dokunmaz. Yönetim panelinde yalnız `admin` rolüne "Harita ayarları" sekmesi eklenir: aynı anda en çok model (0–50 tam sayı, 0 haritadaki 3B'yi kapatır) ve model yükleme yakınlaştırması (0–24); `PUT /v1/admin/map-settings` ile kaydeder. Ziyaretçiler bu ayarı kendileri değiştiremez.
Neden: canlı katalogda 7 yerleştirilmiş model var; 5 sınırı Hanlar bölgesinde ikisini yüklemeden bırakıyordu. Değeri değiştirmek için API'yi elle çağırmak yerine panel kullanılır.
Karar veren / tarih: Weissman, 28 Eki.
Nasıl değiştirilir: değer panelden; başlangıç değeri `packages/domain/src/index.ts` ve `services/api/src/db/schema/settings.ts` (yeni migration). Ziyaretçiye ayar açmak yeni karar ister.

**11.37 Rotalarda yürüme yolu: inceleme notları plana işlendi; uygulama ayrı PR’larla yapılacak.**
Karar: [Rotalarda yürüme yolu planı](ROUTE-WALKING-PLAN.md) tasarım kaydı olarak tutulur. Yaya profili doğrulaması, eksik hesap durumu, eski çizgilerin geçersizleştirilmesi, sürüm kontrolü, süre/istek bütçesi ve kabul testleri planın parçasıdır. İlk sürüm önerisi durak başına “Haritada aç”, Google bağlantısı ve iPhone’da Apple seçeneğidir; uygulama içi navigasyon yoktur.
Neden: eski öneri eksik bacakların toplamını ve geç gelen hesapların daha yeni rota kaydını ezmesini açıkça tanımlamıyordu. Genel otomobil demosu yaya rotası kabul testi yerine kullanılamaz.
Karar veren / tarih: ilk öneri Weissman, 28 Eki; teknik inceleme ve plan güncellemesi Tamer Akdeniz, 29 Eki. Belgenin birleştirilmesi servis hesabı/anahtarı veya canlı rota özelliğinin hazır olduğu anlamına gelmez; servis sorumlusu ve saha doğrulaması uygulamadan önce netleşir.
Nasıl değiştirilir: plan belgesi güncellenir; API/Web uygulaması ve canlı veri aktarımı ayrı PR’larda doğrulanır.

**11.38 Demo içerik aktarımı prototip v2 dosyalarından okur; canlı katalog paketle yeniden yazılır.**
Karar: `prepare-demo-content.py` dondurulmuş v1 `design/test-redmi9t/hazirla.py` yerine v2 `design/test-redmi9t-v2/hazirla.py` okuyucularını kullanır. Eser listesi ve kimlik `eserler/<eser>/eser.json`, model dosyası (`<glb>_sunum.glb`) ve konum düzeltmesi (`kaydirma_m`) `3d/model.json`'dan gelir; sürüm numarası kodda yazılmaz. Ürün kimlikleri (`bedesten`, `orhan-gazi`), ilçe adları ve ürünün üç rotası değişmez (v2'deki tek `veri/rota` kaydı ürün rotalarının yerine geçmez). 29 Ekim paketi yeni parça adlı modelleri getirir (Ulucami v29, Bedesten v09, Koza Han v17, Orhan Bey Camii v10, Hamam v08, Emir Hanı v08, Türbe v05); hikâye vurgularının hepsi yeni modellerde bulunur. Canlıya aynı aktarımla (`import-demo.ts --apply`) model ve içerik birlikte yazılır; haritadaki yerleşimler (`site_map_placements`) korunur.
Neden: v1 eski modelleri taşıyordu; yalnız modeli panelden yenilemek vurguları boşa düşürürdü (parça adları değişti).
Karar veren / tarih: Weissman, 29 Eki (iş listesi 25'in ilk adımı; canlı panelde bu yedi eserde düzenleme yapılmadığı için paketle üzerine yazılabilir).
Nasıl değiştirilir: içerik paketi `docs/documents-context/` altında güncellenip aktarım yeniden çalıştırılır; panelde yapılan düzenlemeler varsa önce pakete aktarılır.

**11.39 Hikâye kamerası modele göre saklanır ve hikâyede 3B model açık kalır.**
Karar: Kamera açısı (`story_blocks.camera`, `history_images.camera`, `sites.opening_camera`) `{ label?, target, azimuthDeg, elevationDeg, distance }` olur. `target` bakılan model parçasıdır (`null` = modelin ortası), uzaklık metre yerine modele göredir (1 = bütün model kadrajda; prototipteki «yakın / orta / çatı / bütün yapı» = 0,42 / 0,62 / 0,85 / 0,95). Azimut 0 = kuzeyden bakış; model, haritadaki yerleşim açısıyla (`headingDeg`) döndürülür, böylece kuzey gerçek kuzeydir. İçe aktarma açıları `eserler/<eser>/icerik/hikaye.md` «Açı» tablosundan doldurur (açısız cümle öncekinin açısını alır); hedef parça modelde yoksa aktarım durur, panel kaydı 400 verir. Web'de modeli olan eserin hikâyesi 3B modelde açılır, model cümleler arasında yeniden yüklenmez ve kamera her cümlede yumuşakça döner; ziyaretçi sürükleyince geçiş durur. Fotoğraf düğmesi cümlenin fotoğrafını gösterir. Göçe gerek yok (jsonb); canlıda kayıtlı kamera açısı yoktu (29 Eki: 0 satır).
Neden: Prototipin açı tablosu uzaklığı sözcükle ve parçaya göre veriyor; metre değeri model değişince bozulur. Ekip notu (ENTEGRASYON_29EKIM §5.3): alan vardı ama doldurulmuyordu, kamera hiç dönmüyordu.
Karar veren / tarih: Weissman, 29 Eki (iş listesi 25, modele göre uzaklık seçeneği).
Nasıl değiştirilir: sözcük → oran eşlemesi `services/api/scripts/prepare-demo-content.py` `DISTANCE`; kamera geçişi `apps/web/src/components/model-viewer.tsx`. «İç mekân (3D)» cümlelerinde örtünün kalkması ayrı iş (§5.2).

**11.40 «İçini göster»: örtü grupları model kaydında, iç mekân işareti hikâye cümlesinde.**
Karar: Migration `0016_cover_groups`: `media.cover_groups jsonb` (yalnız kind=model; parça adı grupları, yukarıdan aşağı, ilk grup önce kalkar; boş = düğme yok) ve `story_blocks.interior boolean` («İç mekân (3D)» = evet). İkisi de `SiteDetail` ve `AdminSiteDetail` içinde döner (`media[].coverGroups`, `stories[].interior`); panelin hikâye kaydı `interior` alanını taşır (verilmezse `false`). Örtü grupları yalnız içe aktarmayla dolar (`3d/model.json → ortu_gruplari`); adı modelde olmayan parça aktarımı durdurur. Panelden model değişince yeni modelin grubu yoktur (gruplar parça adına bağlı). Web: modelde her grubun en az bir parçası bulunursa sağ altta «İçini göster / Dışını göster» düğmesi; gruplar sırayla yükselip saydamlaşarak kaybolur, iniş alttan başlar; alçak kamera 58°'ye yükselir. Hikâyede `interior` cümlelerde örtü kendiliğinden kalkar, diğerlerinde iner. Şimdilik yalnız Ulucami (3 grup; 5, 7, 8, 9. cümleler).
Neden: Gruplar modelin parça adlarına bağlı olduğu için modelle birlikte saklanır (yerleşim kaydına değil); prototip davranışı (ENTEGRASYON_29EKIM §5.2) ürüne taşındı.
Karar veren / tarih: Weissman, 29 Eki (iş listesi 25, adım 5.2).
Nasıl değiştirilir: gruplar `eserler/<eser>/3d/model.json` içinde düzenlenip aktarım yeniden çalıştırılır; panelde grup düzenleme ekranı istenirse ayrı iş. Animasyon `apps/web/src/components/model-viewer.tsx` (`LIFT_MS`, `LIFT_GAP`, `INSIDE_ELEVATION`).

**11.41 3B parça kartları: eserin kendi tablosunda, yalnız içe aktarmayla dolar; sesli dinleme sonra.**
Karar: Migration `0017_part_cards`: `site_part_cards` (`parts text[]` model parça adları, başlık, metin, kaynak, güven, sıra) ve `site_part_card_photos` (kart başına sıralı fotoğraflar, ilki kapak; `media` yabancı anahtarlı, `MEDIA_REFERENCES` listesinde). İkisinde RLS açık. `SiteDetail` ve `AdminSiteDetail` içinde `partCards[]` (`photoIds`, fotoğraflar `media` listesinde, galeriye girmez). İçe aktarma `eserler/<eser>/icerik/parcalar.md` dosyasını okur; adı modelde olmayan parça ya da bulunmayan fotoğraf aktarımı durdurur. Şimdilik yalnız Ulucami (17 kart, 27 parça). Web: kartı olan eserde yalnız kartı olan parçalar dokununca kartı açar (fotoğraf şeridi, metin, güven, kaynak) ve kartın bütün parçaları birlikte sarı parlar; masaüstünde fare üstünde hafif parlama ve el imleci. Kartı olmayan eserde her parça dokununca adını gösterir (prototip kuralı). Panelde kart düzenleme yok. Kartta sesli dinleme yok: ekip ses için bir yapay zekâ seslendirme sağlayıcısı (Gemini TTS, ElevenLabs vb.; ücretsiz kotaya göre seçilecek) ve yönetici onaylı «seslendir» adımı planlıyor, bir kadın ve bir erkek ses (iş listesi 26).
Neden: Prototip davranışı (ENTEGRASYON_29EKIM §5.1) ürüne taşındı. Hikâye kartları (`cards`) tek fotoğraflı ve cümleye bağlı, parça kartı ayrı bir şey. Tarayıcı seslendirmesi geçici olurdu, sağlayıcı kararı beklenecek.
Karar veren / tarih: kapsam (içe aktarma + API + web), kartsız eserde parça adı ve ses kararı Weissman, 29 Eki (iş listesi 25, adım 5.1).
Nasıl değiştirilir: kartlar `eserler/<eser>/icerik/parcalar.md` içinde düzenlenip aktarım yeniden çalıştırılır; panelde düzenleme istenirse ayrı iş (admin uçları + ekran). Parlama ve dokunma eşikleri `apps/web/src/components/model-viewer.tsx` (`GLOW`, `HOVER_GLOW`, `PICK_GLOW`, `TAP_SLOP`, `TAP_MS`).

**11.42 Şehir sahnesi: 3B ışık ve eser sahnesi zemini şehir kaydında.**
Karar: Migration `0018_city_scene`: `cities.scene jsonb` (boş olabilir): `{ light: { ambient, sun, fill, azimuthDeg, elevationDeg, saturation, groundShadow }, backgroundTop, backgroundBottom }`. `GET /v1/cities` her şehirle `scene` döndürür (`null` = istemci `defaultCityScene` kullanır: prototipin eski ışığı ortam 2,3 / güneş 1,3 / dolgu 0,5 / yön 216° / yükseklik 46°, doygunluk 1, yer gölgesi yok, zemin `#DCE3E4 → #C3CBCD`). Doğrulama `@akar/domain` `validateCityScene` (aralıklar geniş; renk `#RRGGBB`). İçe aktarma `veri/sehir/<şehir>.json` dosyasından `harita_isik` ve `kimlik.sahne_ust / sahne_alt` okur; yalnız manifestte eseri olan ve iki alanı da bulunan şehir yazılır (bugün Bursa: ortam 2, güneş 1, dolgu 1, yön 315°, yükseklik 45°, doygunluk 1,25, yer gölgesi 0,18, `#DDE4E5 → #A7B4B7`). Web: harita, panel yerleşim önizlemesi ve eser 3B sahnesi aynı ışığı kullanır (`apps/web/src/lib/scene-light.ts`: yarıküre + güneş + karşı ışık, malzeme doygunluğu, kodla çizilen yumuşak yer gölgesi; model haritadaki yönüyle döndüğü için güneş iki yerde aynı yönden gelir). Eser sahnesinde ton eşleme kaldırıldı (harita da kullanmıyor); zemin CSS geçişi (`--scene-top`, `--scene-bottom`). Panelden düzenleme yok.
Neden: Prototip ışığı şehir kaydından okuyor (ENTEGRASYON_29EKIM §3); şehre göre değişen bir değer olduğu için genel harita ayarına değil şehre kondu. Panel ekranı ayrı küçük iş olarak bırakıldı.
Karar veren / tarih: yer (şehir kaydı) ve panelin sonraya kalması Weissman, 29 Eki (iş listesi 25).
Nasıl değiştirilir: değerler `veri/sehir/<şehir>.json` içinde düzenlenip aktarım yeniden çalıştırılır; panelden düzenleme istenirse admin ucu (`PUT /v1/admin/cities/:id/scene`) ve ekran eklenir. Varsayılanlar `packages/domain/src/index.ts` (`defaultCityScene`).

**11.43 «Eser hakkında» okuma düzeni: bölüm tablosu, kitap fotoğrafları ve kapak; yalnız içe aktarmayla dolar.**
Karar: Migration `0019_about_reading`: `site_about_chapters` (`id`, `site_id`, `position`, `title`, `kind`, `reading jsonb`: özet cümleleri, rakam kartları, alıntılar, zaman çizelgesi, terimler, 3B açısı, `interior`, `focusParts`); `site_sections.chapter_id` (yabancı anahtar, bölüm silinince paragraflar da silinir; null = hiçbir bölüme bağlı değil); `site_section_photos` (`site_id`, `section_id`, `position`, `media_id`, `aspect`, `alt`; paragrafla birlikte silinir, RLS açık, `MEDIA_REFERENCES` listesinde); `sites.about_cover_media_id` (boş = galerinin kapağı). Paragraf satırları aynen kalır. `SiteDetail` ve `AdminSiteDetail`: `chapters[]`, `aboutCoverMediaId`, her `sections[]` öğesinde `chapterId` ve `photos[]` (`{ mediaId, aspect, alt }`; fotoğraflar `media` listesinde çözülür, galeriye girmez). Terimler bölüm başına tutulur: bütün metinden seçilen terim, kelimesi geçtiği her bölümün listesine girer. İçe aktarma (`prepare-demo-content.py`) `eser-hakkinda-okuma.md` (satırlar kitap metninde birebir aranır, bulunmayan atlanır ve uyarı yazılır), `kitap-fotograflari.md` ve `eser.json → hakkinda_kapak` dosyalarını okur; fotoğraf, kitapta kendi sayfasına kadar gelen son paragrafın arkasına konur (ilk paragraftan önceki sayfa ilk paragrafa); galerideki bir dosya aynı medya kaydı olarak kullanılır, diğerleri (Ulucami'de 97) yeni medya olarak yüklenir. Modelde olmayan parça adı ya da kamera hedefi aktarımı durdurur. Şimdilik yalnız Ulucami (9 bölüm, 70 paragraf, 119 fotoğraf).
`PUT /v1/admin/sites/:id/sections` (paragrafların tümünü değiştirir): kimliği korunan paragraf bölümünü ve fotoğraflarını korur; kimliği yeni paragraf başlığı aynı olan bölüme katılır (yoksa bölümsüz); listeden çıkarılan paragraf fotoğraflarıyla gider. Bölümler ve kapak değişmez, paragraf listesi hiç değiştirilmeyen eserler etkilenmez.
Neden: Prototip v2 düzeni (ENTEGRASYON_29EKIM §5.4) ürüne taşındı; paragraf listesini kimlikle koruyan panel kaydı, içe aktarılan bölüm ve fotoğraflarını yanlışlıkla silmemeli.
Karar veren / tarih: tablo yapısı, fotoğrafların bu işte gelmesi, panelden düzenlemenin sonraya kalması ve masaüstü 3B Weissman, 29 Eki (iş listesi 25, adım 5.4); `setSections` davranışı backend sorumlusu önerisi.
Nasıl değiştirilir: içerik `eserler/<eser>/icerik/eser-hakkinda-okuma.md`, `kitap-fotograflari.md` ve `eser.json` içinde düzenlenip aktarım yeniden çalıştırılır; panelde bölüm ve fotoğraf düzenlemesi istenirse ayrı iş (admin uçları + ekran).

**11.44 Eser görevleri ve eser rozetleri: yeni tablolar, puansız; yalnız içe aktarmayla dolar.**
Karar: Migration `0020_site_tasks` (üç içerik tablosu + iki kullanıcı tablosu, hepsinde RLS açık, politika yok): `site_tasks` (`kind` `quiz` | `field`, başlık, metin, `media_id` fotoğraf, `part`, `source`, `trust`, `details jsonb`: soruda seçenekler (2–6), ipuçları, doğru/yanlış metni, `fromHome`; saha görevinde `onSite { text, radiusM }`, `fromHome { text, part }` ya da null, `doneText`), `site_task_answers` (doğru seçenek indeksi, yalnız sunucuda, hiçbir yanıtta yok), `site_badges` (`condition` `story` | `task`, görev rozetinde `task_id`, `on_site_label`), `user_site_tasks` ve `user_site_badges` (`on_site`: herhangi bir tamamlama yerinde olduysa true olur, geri dönmez). `site_tasks.media_id` `MEDIA_REFERENCES` listesinde; hesap silme iki kullanıcı tablosunu da siler. Eski `quizzes`, `quiz_answers`, `/v1/quizzes/*` ve rota rozetleri aynen kalır. `SiteDetail` ve `AdminSiteDetail`: `tasks[]` (cevap anahtarı, `correctText` ve `doneText` yok) ve `badges[]`. Uçlar: `POST /v1/site-tasks/:id/answer` (`{ choice }`; doğruysa `correctText`, yanlışsa `wrongText`), `POST /v1/site-tasks/:id/complete` (`{ mode: "onSite", lat, lng, accuracyM? }` ya da `{ mode: "fromHome", part }`; uzaksa 422 `TOO_FAR`, yanlış parçada 422 `WRONG_PART`), `GET /v1/me/site-progress`. İkisi de isteğe bağlı oturumlu: üyede kayıt ve rozet (`earnedBadges`: yeni kazanılanlar), misafirde aynı kontrol ve hiçbir kayıt yok (rozet için giriş yapması istenir). `POST /v1/stories/:siteId/complete` üyeye eserin `story` rozetlerini de verir ve yanıtta `earnedBadges` döner. Yerinde = sunucu eser noktasından görev yarıçapına bakar (ziyaret doğrulamayla aynı kural: hassasiyet payı en çok 50 m, hassasiyet 100 m'den kötüyse 422); konum saklanmaz, loglanmaz. Evden = uygulamanın söylediği parça adı sunucuda yalnız karşılaştırılır; rozet `onSite` olmaz. Puan, süre ve yanlış cevap cezası yok; `point_events`'e yazılmaz. İçe aktarma `icerik/gorevler.json` dosyasını okur (şimdilik yalnız Ulucami: 1 soru, 1 saha görevi, 3 rozet); fotoğraf `fotograflar.md` listesinde olmalı, adı modelde olmayan parça ya da tutarsız cevap/rozet koşulu aktarımı durdurur. Yeniden aktarım görev ve rozetleri kimliğe göre günceller, yalnız dosyadan çıkanları siler; oyuncunun ilerlemesi kimliği duranlarda korunur. Panelden görev düzenleme bu işte yok.
Neden: Prototipteki görev ve rozet tasarımı (ENTEGRASYON_29EKIM §5.5) eser düzeyinde; eski bulmaca tablosu üç şıklı, tek ipuculu, puanlı ve rota bulmacası olarak çalışıyor, ona dokunmak ziyaretçi ilerlemesini bozardı. Cevap anahtarı `quiz_answers` gibi ayrı tabloda ve yalnız sunucuda. Konum gizliliği ziyaret doğrulamayla aynı kuralı izler.
Karar veren / tarih: tablolar, saha görevinin yerinde/evden kuralı, misafir davranışı, puansızlık ve panel düzenlemesinin sonraya kalması Weissman, 29 Eki (iş listesi 25, adım 5.5); yeniden aktarımda ilerlemeyi koruma backend sorumlusu önerisi.
Nasıl değiştirilir: görev ve rozetler `eserler/<eser>/icerik/gorevler.json` içinde düzenlenip aktarım yeniden çalıştırılır; panelde görev düzenleme istenirse ayrı iş (admin uçları + ekran). Misafirin de rozet kazanması istenirse misafir makbuzu (§11.31 receipts) bu uçlara eklenir.
