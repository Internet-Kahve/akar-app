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
- Depolama: herkese açık okunan `media` kovası ve herkese kapalı `uploads` kovası (ikisi de 5 MiB, JPEG/PNG/WebP/GLB/MP3/M4A; §11.7). İmzalı S3 yükleme (presigned PUT) `uploads`'a, herkese açık okuma `media`'dan denendi.
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
Karar: P5.1b'de yönetim paneli API kipinde eser, katalog ve fotoğraf için yalnız mevcut kayıtları günceller; yeni eser, rota ya da kart oluşturma API'ye eklenmez, bu komutlar API kipinde `UnsupportedCommandError` ile anlaşılır bir mesaj gösterir. P5.1b'ye Tamer onay verdi.
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
Karar: API Render'da (Web Service, Docker, Frankfurt, Free plan) `https://akar-app.onrender.com` adresinde çalışır; Supabase bulut projesi `akar-staging` (AB, eu-west-1). Web, Weissman'ın Vercel hesabında ayrı bir projedir (`https://akar-app-jade.vercel.app`); Tamer'in Vercel projesi API'siz demo olarak kalır. Giriş e-postaları Supabase'in yerleşik servisi yerine Weissman'ın Gmail hesabından SMTP ile (uygulama şifresi) gönderilir; saatte en çok 30 e-posta.
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
Bilinen sınır: tohum ve SQL ile yayınlanmış bazı eserler bugünkü yayın kapısını geçmez; panelde taslağa alınırlarsa eksikler tamamlanmadan yeniden yayınlanamazlar. Hikâye, fotoğraf ve kaynak düzenleme API kipinde henüz yok, bu yüzden içe aktarılan taslakların çoğu panelden henüz yayınlanamaz.
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
