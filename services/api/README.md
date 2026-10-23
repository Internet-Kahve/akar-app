# Akar API

Fastify + Zod, Drizzle ORM, PostgreSQL 17 + PostGIS. Sözleşme: [API-HANDOFF](../../docs/API-HANDOFF.md), şema: [`docs/api/openapi.json`](../../docs/api/openapi.json).

## Çalıştırma

Docker (veya OrbStack), [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) ve repo kökünde `npm ci` gerekir.

API Node.js 24+ ister: TypeScript kaynağını Node doğrudan çalıştırır (tip silme); derleme adımı yoktur. Bu yüzden `tsconfig.json` yalnız silinebilen TypeScript'e izin verir (`erasableSyntaxOnly`: `enum`, `namespace`, kurucu parametre alanı yok).

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
| `npm start` | Sunucuyu izlemesiz, düz `node` ile açar (üretimdeki gibi); `npm run dev` değişiklikte yeniden başlar |
| `npm run db:migrate` | Bekleyen migration'ları uygular (`DATABASE_URL`); sunucu migration çalıştırmaz |
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
| `STORAGE_QUOTA_MB` | `1024` | Yönetim panelinin depolama uyarısının ölçtüğü kota, MB (pozitif tam sayı); `1024` = Supabase Free. Ücretli plana geçilince büyütülür. Üretimde zorunlu değil (§11.21) |

### İlk yönetici

```sh
npm run staff:invite -- --email ayse@example.com --role admin
```

Komut yalnız `DATABASE_URL`'ye bağlanır; Supabase'i çağırmaz ve e-posta göndermez. Davet kaydedilir; rol, bu adresle gelen ilk token'lı istekte kendiliğinden verilir (yani e-posta koduyla giriş yaptıktan sonra). Yerel Supabase'te giriş kodu Mailpit'e düşer: http://127.0.0.1:54324. Adres zaten yetkiliyse rolü güncellenir. Roller: `editor`, `moderator`, `admin`.

### Harita ayarları

| Endpoint | Not |
| --- | --- |
| `GET /v1/map-settings` | Herkese açık, önbellekli. `{ modelMinZoom, maxVisibleModels }`: 3B modellerin yüklendiği yakınlaştırma eşiği (0–24) ve haritada aynı anda çizilen en çok model (0–50, tam sayı; 0 3B'yi kapatır) |
| `PUT /v1/admin/map-settings` | Yalnız `admin`; aynı gövde, `Idempotency-Key` kabul eder, audit `map-settings.update`. Uygulamalar bir sonraki okumada görür |

Tablo `map_settings` (tek satır), migration `drizzle/0005_map_settings.sql`; `npm run db:migrate` uygular.

## Yayına alma

Hedef mimari: **Next.js → ayrı Vercel Fastify API → Supabase PostgreSQL/PostGIS, Auth ve Storage**.
Web projesi `akar-app`, API projesi `akar-api`; ikisi aynı GitHub monoreposundan dağıtılır.
API bölgesi `fra1`, Supabase bölgesi açıkça **Central EU (Frankfurt), eu-central-1** seçilir.
Render artık dağıtım hedefi değildir. Eski hesapların verileri otomatik silinmez.

### Kurulum sırası

1. Tamer'in hesabında Free Supabase projesi oluştur. Data API'yi kapalı tut: uygulama tablolarına
   yalnız Fastify erişir; web/mobil Supabase'i giriş için kullanır. JWT imzalaması asimetrik olmalı;
   `/auth/v1/.well-known/jwks.json` en az bir anahtar döndürmeli.
2. `media` herkese açık, `uploads` özel Storage kovalarını oluştur. Her dosya için 50 MB üst sınır
   kullan; `services/api/supabase/config.toml` tür ve kova ayarlarını içerir. S3 erişim anahtarlarını
   yalnız API ortamına koy. Tarayıcı dosyaları imzalı PUT ile doğrudan `uploads` kovasına yollar;
   API doğruladıktan sonra `media` kovasına aktarır. Dosyalar Vercel istek gövdesinden geçmez.
3. Migration için **session pooler (5432)** veya doğrudan bağlantıyı `DIRECT_DATABASE_URL` olarak
   yerel, Git tarafından yok sayılan `.env` dosyasına koy. `npm run db:migrate -w @akar/api` çalıştır.
   Üretim migration'ları API açılışında veya her Vercel build'inde çalıştırılmaz.
4. Çalışan API için **transaction pooler (6543)** bağlantısını `DATABASE_URL` olarak kullan.
   `DATABASE_POOL_MAX=2`; her sıcak instance küçük bir havuz kullanır. Database Settings → SSL Configuration → Download certificate ile indirilen PEM içeriğini
   `DATABASE_SSL_CA` olarak ekle; bağlantı zinciri ve hostname doğrulanır. Migration bağlantısını Vercel'e koyma.
5. Yalnız demo içeriğini yükle: `npm run db:seed -w @akar/api` altı eser ve rotaları yükler.
   Tam arşiv için `ingest` çalıştırma. Medya adreslerinin yeni Storage kovasına ait olduğunu kontrol et;
   mevcut seed yalnız arayüz için örnek metinler içerir, dosyaları Storage'a taşımaz.
6. Vercel API projesi: Root Directory `services/api`, Framework **Other**, Node **24.x**, kök dışı
   kaynaklar dahil. `vercel.json` Fastify girişini `api/index.ts` üzerinden yönlendirir; süre 300 saniye.
   Ortam değişkenleri aşağıda. Production domain web, mobil ve cron tarafından erişilebilir olmalı;
   preview dağıtımlarının Vercel korumasını koru.
7. Web projesi Root Directory `apps/web`, Framework Next.js. Production ortamına
   `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key)
   ekle ve yeniden derle. Preview'a üretim veritabanı sırlarını kopyalama.
8. Supabase Vault'a `akar_api_url` (API origin) ve `akar_job_secret` (`JOB_SECRET` ile aynı değer)
   kaydet. `scripts/schedule-maintenance.sql` dosyasını SQL Editor'da çalıştır. Dakikalık çağrılar
   kalıcı GLB/içe aktarma işlerini ve sınırlı temizlik gruplarını işler. `/internal/jobs/run`
   yalnız `x-akar-job-secret` ile açılır; yanlış veya eksik anahtar 401 döner.
9. Auth Site URL ve redirect listesine web adresini ekle. E-posta koduyla giriş için kendi SMTP
   hesabını ve şablonları yapılandır. Varsayılan Supabase e-postasıyla 200 kişilik katılımcı girişini
   hazır kabul etme; SMTP kotasını ve kod gönderimini ayrıca doğrula. İlk yöneticiyi
   `npm run staff:invite -w @akar/api -- --email <adres> --role admin` ile tanımla.

### API Production ortamı

| Değişken | Değer |
| --- | --- |
| `NODE_ENV`, `API_RUNTIME` | `production`, `vercel` |
| `DATABASE_URL`, `DATABASE_POOL_MAX` | Transaction pooler bağlantısı, `2` |
| `DATABASE_SSL_CA` | Supabase panelinden indirilen kök sertifikanın PEM içeriği |
| `CORS_ORIGINS` | Web'in tam origin adresleri, virgülle ayrılmış; wildcard yok |
| `TRUST_PROXY` | Vercel önünde `1` |
| `SUPABASE_URL` | Yeni projenin HTTPS adresi |
| `SUPABASE_SERVICE_ROLE_KEY` | Yalnız sunucu service_role/secret anahtarı |
| `AUTH_JWKS_URL`, `AUTH_JWT_ISSUER` | Proje adresi + `/auth/v1/.well-known/jwks.json`, `/auth/v1` |
| `STORAGE_DRIVER` | `s3` |
| `STORAGE_S3_ENDPOINT`, `STORAGE_S3_REGION` | Proje S3 adresi, `eu-central-1` |
| `STORAGE_S3_ACCESS_KEY_ID`, `STORAGE_S3_SECRET_ACCESS_KEY` | Yeni S3 erişim bilgileri |
| `STORAGE_PUBLIC_BASE_URL` | Proje adresi + `/storage/v1/object/public/media` |
| `RECEIPT_SECRET`, `JOB_SECRET` | Birbirinden farklı, rastgele üretilmiş en az 32 karakterlik sırlar |

Sırlar Git'e, loglara veya `NEXT_PUBLIC_*` alanlarına yazılmaz. Vercel'de Production Secret olarak saklanır.
Eksik üretim ayarı API'nin açılmasını engeller. Kontroller: `/health`, `/ready`, katalog okuma,
OTP giriş, imzalı fotoğraf/GLB yükleme, cron sonrası model parçaları ve özel kovanın erişim kontrolü.
Web ve mobil aynı HTTPS API/Supabase projesini kullanabilir; mobil deep link redirect'i uygulama eklenirken tanımlanır.

### Süre sınırları ve demo kapasitesi

Panel CSV içe aktarma paketlenmiş Bursa OSM listesini kullanır; git, yazılabilir disk veya uzun dış
geocoder çağrıları gerektirmez. Eşleşmeyen eserler taslak kalır ve konumları editörde tamamlanır.
Ağ üzerinden kapsamlı eşleştirme yalnız `npm run ingest` yerel komutunda sürer.
İşler aynı veritabanı transaction'ında kaydedilir; instance kapanırsa 10 dakikalık iş kilidi dolunca
sonraki cron çağrısı yeniden dener. Tek çağrı en fazla beş iş alır; temizlik her türden on kayıtla sınırlıdır.

7–8 eser × en çok 50 MB = 350–400 MB kalıcı medya. Yükleme kopyaları ve ziyaretçi fotoğrafları için
boş alan bırak; demo öncesinde toplam iki kovanın kullanımını kontrol et. Depolama ve trafik ayrı
kotalardır: herkese tüm medyayı önceden indirtme, dosyaları ihtiyaç oldukça yükle.

Docker imajı yerel doğrulama için kullanılabilir; üretimde ayrı sürekli çalışan sunucu gerekmez.
Yerel `src/server.ts` aynı işleri dakikada bir çalıştırır; Vercel girişinde zamanlayıcı veya `listen()` yoktur.

## Okuma API'si (P2)

| Endpoint | Not |
| --- | --- |
| `GET /v1/sites?query=&kind=&city=&bbox=&category=&period=&has=&near=&sort=&cursor=&limit=` | `{ items, nextCursor }`. `limit` 1–100 (varsayılan 20). `kind` tür kimliği (`site_types`), `category` vakıf rolü kategorisi (`dini`/`su`/`egitim`/`akar`), `period` dönem kimliği, `has=model,audio,history` (3D / ses / gravür; hepsi sağlanmalı), `bbox=minLng,minLat,maxLng,maxLat`, `near=boylam,enlem` + `sort=name\|distance` |
| `GET /v1/sites/:id` | Özet + `stories` (kart, açı, TR/EN ses), `sections`, `cards`, `historyImages`, `openingCamera`; `media` ve `sources` detayın andığı her şeyi içerir |
| `GET /v1/site-details?cursor=&limit=` | Yayındaki eserlerin `GET /v1/sites/:id` ile aynı tam detayı, ada göre keyset sayfalama (`limit` 1–100, varsayılan 20); istemci kataloğu eser başına istek atmadan yükler. Sayfa başına sabit sayıda sorgu |
| `GET /v1/cities` | Şehirler ve yayındaki eser/rota sayıları |
| `GET /v1/lookups` | Filtre çipleri için tür, kategori ve dönem listeleri |
| `GET /v1/routes?city=`, `GET /v1/routes/:id` | Rotalar: şehir, rozet (`url` dahil), hesaplanan süre/mesafe, sıralı duraklar (`quizId`, `historyImageId`) |
| `GET /v1/routes/:id/bundle` | Çevrimdışı paket: `route`, yayındaki durakların `SiteDetail`'i, cevapsız bulmacalar, önbelleğe alınacak `assets` URL'leri |

- Özet alanları: `categoryId`, `periodId`, `has { model, audio, history }`, `distanceMeters` (yalnız `near` varsa).
- Sayfalama keyset: ada göre `(sort_name, id)` (C collation), mesafeye göre `(mesafe, id)`; imleç opak base64url ve sıralama türüne bağlıdır, başka sıralamanın imleci `400 INVALID_CURSOR`. Sayfalar arasında tekrar/boşluk olmaz. `sort=distance` için `near` zorunlu (`400 VALIDATION_FAILED`, `fieldErrors.near`).
- Bulmaca cevabı hiçbir yanıtta yoktur; paket yalnız soru, seçenek ve ipucu taşır.
- Arama `normalize()` (`@akar/domain`) ile yazma anında hesaplanan `sites.search_text` üzerinde çalışır: `çarşı` / `Çarşı` / `carsi`, `İznik` / `Iznik` / `iznik` aynı sonucu verir. Haystack domain `filterSites` ile aynı: ad, şehir, ilçe, mimar. `%` ve `_` düz karakterdir. Kayıt sayısı büyürse `pg_trgm` GIN indeksi eklenmeli.
- Tüm 200 yanıtlarda zayıf `ETag` ve `Cache-Control: public, no-cache` (tarayıcı saklar ama her kullanımda doğrular, §11.24); eşleşen `If-None-Match` için `304`.
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

- Girdi `eser-turleri.csv` (ilçeleri düzeltilmiş liste) ve `osm_secilen.csv`; varsayılan olarak `origin/main:docs/documents-context/veri/` içinden `git show` ile okunur (branch'e geçilmez). `--data <klasör>` yerel kopya, `--ref` başka ref.
- Akış: CSV → ad temizleme → `normalize()` → tür (`site_types.aliases`, bilinmiyorsa addaki son tür sözcüğü) → kopya kontrolü (normalize ad + ilçe; "Hanlar Bölgesi" = Osmangazi) → konum → rapor → taslak.
- Konum sırası: `osm_secilen.csv` → Overpass (ilçedeki OSM nesneleriyle bulanık ad eşleşmesi) → Nominatim ad → Nominatim adres (yalnız kapı/bina düzeyi) → mahalle merkezi ("konum yaklaşık", yayınlanamaz).
- `[yalnız içindekiler]` satırları atlanır (ilçe, adres, sayfa yok); `--include-toc` ile alınır.
- Veri ekibinin `ad_supheli` işareti "ad şüpheli" olarak taşınır, adresin ilk parçası ad önerisi olur; yayındaki bir eserle aynı ad "olası kopya" işaretlenir.
- Ağ: Overpass ilçe başına 1 istek, Nominatim saniyede en fazla 1 istek; sonuçlar `.cache/overpass-<şehir>.json` ve `.cache/geocode-<şehir>.json` (git dışı). `--offline` yalnız önbellek. `OVERPASS_URL`, `NOMINATIM_URL`, `NOMINATIM_EMAIL` `.env`'den.
