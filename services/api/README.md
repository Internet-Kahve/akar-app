# Akar API

Fastify + Zod, Drizzle ORM, PostgreSQL 17 + PostGIS. Sözleşme: [API-HANDOFF](../../docs/API-HANDOFF.md), şema: [`docs/api/openapi.json`](../../docs/api/openapi.json).

## Çalıştırma

Docker (veya OrbStack), [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) ve repo kökünde `npm ci` gerekir.

Tek komut (repo kökünden):

```sh
npm run api                                          # her şeyi kurar/başlatır, API'yi açar: http://127.0.0.1:4000, Swagger: /docs
npm run api:token -- --email ben@akar.test --role admin   # e-postasız giriş, token'ı yazar
```

`npm run api` = `services/api` içinde `npm run local`: yerel Supabase'i (giriş, dosya, e-posta kutusu) ve API veritabanını başlatır, `.env` yoksa `.env.example`'dan oluşturup boş Supabase/depolama anahtarlarını ve `RECEIPT_SECRET`'ı doldurur (dolu değerlere dokunmaz), migration'ları uygular, veritabanı boşsa demo verisini yükler, sonra `npm run dev`. Tekrar çalıştırmak güvenlidir; çalışan servislere ve mevcut veriye dokunmaz.

| Komut (`services/api`) | İş |
| --- | --- |
| `npm run local` | Yukarıdaki kurulum + `npm run dev` |
| `npm run local:up` | Yalnız kurulum (API'yi açmaz) |
| `npm run local:down` | Supabase'i ve API veritabanını durdurur; veri kalır |
| `npm run local:reset` | API veritabanını siler, migration + demo verisiyle baştan kurar (Supabase kullanıcıları kalır; içe aktarılan taslaklar için `npm run ingest -- --city bursa`) |
| `npm run -s local:token -- --email <e-posta> [--role user\|editor\|moderator\|admin]` | Yalnız yerel Supabase: kod e-postası beklemeden oturum açar, token'ı stdout'a yazar (1 saat). Rol verilirse önce personel daveti yazılır; rol ilk istekte gelir. Örnek: `TOKEN=$(npm run -s local:token -- --email ben@akar.test --role admin)` |

Adresler: e-posta kutusu (Mailpit) http://127.0.0.1:54324, Supabase Studio http://127.0.0.1:54323. Elle test akışları ve otomatik testler: [docs/TESTING.md](../../docs/TESTING.md).

| Komut | İş |
| --- | --- |
| `npm test` | Testcontainers ile gerçek PostGIS üzerinde entegrasyon testleri |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate -- --name <ad>` | `src/db/schema/` değişikliğinden SQL migration üretir (`drizzle/`); yalnız backend sorumlusu çalıştırır |
| `npm run db:seed` | Bursa demo verisini yükler (idempotent) |
| `npm run staff:invite -- --email <e-posta> --role <editor\|moderator\|admin>` | HTTP ve Supabase olmadan personel daveti yazar (ilk yöneticiyi başlatmak için); ayrıntı aşağıda |
| `npm run ingest -- --city bursa [--dry-run] [--offline] [--verbose] [--data <klasör>]` | Envanter CSV'sini Tier 1 taslak olarak içe aktarır; ayrıntı aşağıda |
| `npm run openapi` | `docs/api/openapi.json` dosyasını yeniden üretir; CI güncel olmasını kontrol eder |

## Kurallar

- Hatalar her zaman `{ error: { code, message, fieldErrors, requestId } }`. `x-request-id` gelirse korunur, yoksa üretilir ve yanıtta döner.
- `GET /health` süreç canlılığı, `GET /ready` veritabanı erişimi içindir.
- Migration'lar elle düzenlenmez; şemadan üretilir. Özel SQL için `drizzle-kit generate --custom`.
- Okuma uçları yalnızca `published` kayıt döndürür; taslak eser/rota 404 verir, taslak duraklar rota yanıtında görünmez.

## Yapılandırma

Tüm değişkenler `.env.example` içinde; `src/config.ts` doğrular.

| Değişken | Varsayılan | Not |
| --- | --- | --- |
| `TRUST_PROXY` | `0` | API'nin önündeki ters vekil sayısı (atlama sayısı, 0–5). Yerelde `0`, tek bir yük dengeleyici arkasında `1`. Yalnız bu kadar atlama `X-Forwarded-For` için güvenilir; aksi halde istemci kendi IP'sini seçebilir. Hız sınırı oturum açıksa kullanıcı kimliğine, değilse IP'ye göre tutulur (dakikada 300) |
| `NOMINATIM_URL` | `https://nominatim.openstreetmap.org` | Coğrafi kodlama (içe aktarma ve `npm run ingest`) |
| `NOMINATIM_EMAIL` | boş | Nominatim kullanım politikası için iletişim adresi; isteğe bağlı |
| `OVERPASS_URL` | `https://overpass-api.de/api/interpreter` | OSM toplu eşleşmesi; isteğe bağlı |
| `STORAGE_BUCKET` | `media` | Herkese açık okunan medya kovası; yalnız sunucu yazar |
| `STORAGE_UPLOAD_BUCKET` | `uploads` | Herkese kapalı yükleme kovası; istemci imzalı PUT ile buraya yükler, `complete` doğrulanan dosyayı `STORAGE_BUCKET`'a kopyalar. `STORAGE_BUCKET` ile aynı olamaz. Yerelde `supabase start` (çalışan yığında `supabase seed buckets --local`) açar; bulutta elle, herkese kapalı açılmalı |

### İlk yönetici

```sh
npm run staff:invite -- --email ayse@example.com --role admin
```

Komut yalnız `DATABASE_URL`'ye bağlanır; Supabase'i çağırmaz ve e-posta göndermez. Davet kaydedilir; rol, bu adresle gelen ilk token'lı istekte kendiliğinden verilir (yani e-posta koduyla giriş yaptıktan sonra). Yerel Supabase'te giriş kodu Mailpit'e düşer: http://127.0.0.1:54324. Adres zaten yetkiliyse rolü güncellenir. Roller: `editor`, `moderator`, `admin`.

### Harita ayarları

| Endpoint | Not |
| --- | --- |
| `GET /v1/map-settings` | Herkese açık, önbellekli. `{ modelMinZoom, maxVisibleModels }`: 3B modellerin yüklendiği yakınlaştırma eşiği (0–24) ve haritada aynı anda çizilen en çok model (0–50, tam sayı; 0 3B'yi kapatır) |
| `PUT /v1/admin/map-settings` | Yalnız `admin`; aynı gövde, `Idempotency-Key` kabul eder, audit `map-settings.update`. Uygulamalar en geç bir dakika içinde görür |

Tablo `map_settings` (tek satır), migration `drizzle/0005_map_settings.sql`; `npm run db:migrate` uygular.

## Okuma API'si (P2)

| Endpoint | Not |
| --- | --- |
| `GET /v1/sites?query=&kind=&city=&bbox=&category=&period=&has=&near=&sort=&cursor=&limit=` | `{ items, nextCursor }`. `limit` 1–100 (varsayılan 20). `kind` tür kimliği (`site_types`), `category` vakıf rolü kategorisi (`dini`/`su`/`egitim`/`akar`), `period` dönem kimliği, `has=model,audio,history` (3D / ses / gravür; hepsi sağlanmalı), `bbox=minLng,minLat,maxLng,maxLat`, `near=boylam,enlem` + `sort=name\|distance` |
| `GET /v1/sites/:id` | Özet + `stories` (kart, açı, TR/EN ses), `sections`, `cards`, `historyImages`, `openingCamera`; `media` ve `sources` detayın andığı her şeyi içerir |
| `GET /v1/cities` | Şehirler ve yayındaki eser/rota sayıları |
| `GET /v1/lookups` | Filtre çipleri için tür, kategori ve dönem listeleri |
| `GET /v1/routes?city=`, `GET /v1/routes/:id` | Rotalar: şehir, rozet (`url` dahil), hesaplanan süre/mesafe, sıralı duraklar (`quizId`, `historyImageId`) |
| `GET /v1/routes/:id/bundle` | Çevrimdışı paket: `route`, yayındaki durakların `SiteDetail`'i, cevapsız bulmacalar, önbelleğe alınacak `assets` URL'leri |

- Özet alanları: `categoryId`, `periodId`, `has { model, audio, history }`, `distanceMeters` (yalnız `near` varsa).
- Sayfalama keyset: ada göre `(sort_name, id)` (C collation), mesafeye göre `(mesafe, id)`; imleç opak base64url ve sıralama türüne bağlıdır, başka sıralamanın imleci `400 INVALID_CURSOR`. Sayfalar arasında tekrar/boşluk olmaz. `sort=distance` için `near` zorunlu (`400 VALIDATION_FAILED`, `fieldErrors.near`).
- Bulmaca cevabı hiçbir yanıtta yoktur; paket yalnız soru, seçenek ve ipucu taşır.
- Arama `normalize()` (`@akar/domain`) ile yazma anında hesaplanan `sites.search_text` üzerinde çalışır: `çarşı` / `Çarşı` / `carsi`, `İznik` / `Iznik` / `iznik` aynı sonucu verir. Haystack domain `filterSites` ile aynı: ad, şehir, ilçe, mimar. `%` ve `_` düz karakterdir. Kayıt sayısı büyürse `pg_trgm` GIN indeksi eklenmeli.
- Tüm 200 yanıtlarda zayıf `ETag` ve `Cache-Control: public, max-age=60, stale-while-revalidate=300`; eşleşen `If-None-Match` için `304`.
- Şema: `sites.editor_version` boş = eski kayıt (hikâye `photoId`/`sourceId` boş olabilir), `2` = editör v2 (yayında `publicationIssues` zorunlu). Konum `geometry(Point,4326)`, koordinat yanıtta `[boylam, enlem]`.

### Demo veri

```sh
npm run db:seed   # packages/api-client/src/seed.ts → Bursa; tekrar çalıştırmak kayıt çoğaltmaz
```

`loadCatalog` (`src/db/seed.ts`) domain `HeritageSite`/`HeritageRoute` alır, `validateSite` ile doğrular ve id üzerinden upsert eder; sıralı çocuk kayıtlar (hikâye, durak, bağlantı) yeniden yazılır. `created_at`/`updated_at` değişmez.

## Şema v2 ve içe aktarma (P1)

- Şema modül başına bir dosya: `src/db/schema/{shared,platform,catalog,media,routes,identity,admin-catalog,moderation,engagement,settings}.ts`, giriş `src/db/schema/index.ts`. Modül sınırları ve ortak kurallar: [CONTRACTS.md](CONTRACTS.md).
- Genişleyen sözlükler tablodur: `site_types` (tür, `category_id` ile vakıf rolü kategorisine bağlı), `role_categories` (Dinî · Su · Eğitim ve sosyal · Akar), `periods`. Başlangıç satırları `drizzle/0003_reference_data.sql`. Güven ve yayın durumu enum kalır.
- İçerik modeli: eserde dönem, yaptıran, adres, açılış açısı; `site_sections` (Tarihçe / Mimari / Vakıf ve akar), paylaşılan `cards`, `history_images` (Geçmişi Gör), hikâye cümlesinde kamera açısı, kart, vurgu ve TR/EN ses; rotada şehir, tema, rozet; durakta bulmaca ve eski görsel. Bulmacanın doğru şıkkı ayrı `quiz_answers` tablosundadır.
- Taslak eserde konum ve tür boş olabilir; yayındaki eserde ikisi de zorunludur ve konum mahalle merkezi olamaz (CHECK `sites_published_complete`).
- Neyi neden böyle yaptığımız: [docs/BACKEND-DECISIONS.md](../../docs/BACKEND-DECISIONS.md).

### İçe aktarma

```sh
npm run ingest -- --city bursa --dry-run --verbose   # rapor + satır satır sorunlar, veritabanına yazmaz
npm run ingest -- --city bursa                       # Tier 1 taslak olarak yazar; tekrar çalıştırmak kopya üretmez
```

- Girdi `eser-turleri.csv` (ilçeleri düzeltilmiş liste) ve `osm_secilen.csv`; varsayılan olarak `origin/docs:docs/documents-context/veri/` içinden `git show` ile okunur (branch'e geçilmez). `--data <klasör>` yerel kopya, `--ref` başka ref.
- Akış: CSV → ad temizleme → `normalize()` → tür (`site_types.aliases`, bilinmiyorsa addaki son tür sözcüğü) → kopya kontrolü (normalize ad + ilçe; "Hanlar Bölgesi" = Osmangazi) → konum → rapor → taslak.
- Konum sırası: `osm_secilen.csv` → Overpass (ilçedeki OSM nesneleriyle bulanık ad eşleşmesi) → Nominatim ad → Nominatim adres (yalnız kapı/bina düzeyi) → mahalle merkezi ("konum yaklaşık", yayınlanamaz).
- `[yalnız içindekiler]` satırları atlanır (ilçe, adres, sayfa yok); `--include-toc` ile alınır.
- Veri ekibinin `ad_supheli` işareti "ad şüpheli" olarak taşınır, adresin ilk parçası ad önerisi olur; yayındaki bir eserle aynı ad "olası kopya" işaretlenir.
- Ağ: Overpass ilçe başına 1 istek, Nominatim saniyede en fazla 1 istek; sonuçlar `.cache/overpass-<şehir>.json` ve `.cache/geocode-<şehir>.json` (git dışı). `--offline` yalnız önbellek. `OVERPASS_URL`, `NOMINATIM_URL`, `NOMINATIM_EMAIL` `.env`'den.
