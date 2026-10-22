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
| `PUT /v1/admin/map-settings` | Yalnız `admin`; aynı gövde, `Idempotency-Key` kabul eder, audit `map-settings.update`. Uygulamalar en geç bir dakika içinde görür |

Tablo `map_settings` (tek satır), migration `drizzle/0005_map_settings.sql`; `npm run db:migrate` uygular.

## Yayına alma

API tek bir Docker imajıdır; barındırma sağlayıcısından bağımsızdır. İmaj repo kökünden kurulur (ortak `@akar/domain` paketi gerekir); kök `.dockerignore` yalnız API'nin dosyalarını içeri alır.

```sh
docker build -f services/api/Dockerfile -t akar-api .
docker run --env-file <ortam-dosyası> akar-api node src/db/migrate.ts   # migration (sunucudan ayrı)
docker run --env-file <ortam-dosyası> -p 4000:4000 akar-api             # sunucu
```

İmaj `NODE_ENV=production`, `HOST=0.0.0.0`, `PORT=4000` ile gelir (sağlayıcı `PORT` verirse o geçerlidir) ve root olmayan kullanıcıyla çalışır. `SIGTERM`'de bağlantıları kapatıp çıkar. Sağlık denetimi: canlılık `GET /health`, hazır olma `GET /ready` (veritabanı).

**Üretimde eksik ayarla açılmaz.** `NODE_ENV=production` iken `src/config.ts` (`productionIssues`) şunları ister, eksiklerin hepsini tek mesajda listeler ve süreç 1 ile çıkar: `AUTH_JWKS_URL`, `AUTH_JWT_ISSUER`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STORAGE_PUBLIC_BASE_URL`, `RECEIPT_SECRET`, `STORAGE_DRIVER=s3` (konteyner diski dağıtımlar arasında kalmaz) ve tam köken biçiminde `CORS_ORIGINS` (`https://akar.vercel.app`; sonda `/`, yol ya da `*` olmaz). S3 anahtarları açılışta `storageFromConfig` ile denetlenir. Geliştirmede bu ayarlar eksik kalabilir; ilgili uçlar 401/503 döner.

### Hesap gerektiren adımlar (sırayla)

Hesapları Weissman açar; gizli değerler yalnız sağlayıcı ayarlarına yazılır, sohbete ya da repoya yazılmaz. `<ref>` Supabase proje kimliği, `<api>` API'nin HTTPS adresi, `<web>` Vercel adresi.

1. **Supabase bulut projesi** (AB bölgesi). Proje → Settings → JWT Keys: imzalama anahtarı asimetrik (ES256/RS256) olmalı. Kontrol: `curl https://<ref>.supabase.co/auth/v1/.well-known/jwks.json` en az bir anahtar döner; boşsa JWT signing keys'e geçilir.
2. **Giriş e-postası ve ayarlar.** Ücretsiz planda Supabase'in yerleşik e-postası şablon değişikliğine izin vermez (`config push` 400 döner) ve varsayılan şablon kod yerine bağlantı gönderir; önce özel SMTP açılır (§11.16: Gmail + uygulama şifresi). Authentication → Emails → SMTP Settings: ana makine `smtp.gmail.com`, port `465`, kullanıcı ve gönderen Gmail adresi, şifre Google uygulama şifresi (https://myaccount.google.com/apppasswords, iki adımlı doğrulama gerekir), gönderen adı `AKAR`. Authentication → Rate Limits: saatte 30 e-posta (`config push` bu değeri yönetmez). Sonra `services/api` içinde `supabase login`, `supabase link --project-ref <ref>`, önce `supabase config diff`, sonra `supabase config push` (6 haneli kod, 10 dakika, Türkçe şablonlar; yalnız "auth" için onay sorar, SMTP ayarına dokunmaz). Ardından panelde:
   - Authentication → URL Configuration: Site URL `<web>`, Redirect URLs `<web>` (`config.toml` yerel adresleri taşır; push onları yazar).
   - Settings → Data API: **kapat** (ya da Exposed schemas'tan `public`'i çıkar). Bulutta API tabloları Supabase'in `public` şemasında durur; Data API açıkken herkese açık anon anahtarla okunabilir/yazılabilir. API Data API'yi kullanmaz, web yalnız giriş için Supabase'e bağlanır. Kontrol: `curl "https://<ref>.supabase.co/rest/v1/quiz_answers?select=*" -H "apikey: <anon>"` satır döndürmemeli. Sonraki `config push`'lar "api" ayarını değiştirmeyi önerirse **hayır** denir.
3. **Kovalar.** `supabase seed buckets --linked`: `config.toml`'daki `media` (herkese açık) ve `uploads` (**herkese kapalı**) kovalarını boyut ve tür sınırlarıyla açar. Panelde Storage'da `uploads`'ın "Public" olmadığını gör. Storage → S3 Connection: erişim anahtarı oluştur; uç `https://<ref>.supabase.co/storage/v1/s3`, bölge aynı sayfada.
4. **Migration.** Bağlantı: proje → Connect → **Session pooler** (port 5432; IPv4). Transaction pooler (6543) kullanılmaz: iş kuyruğu (pg-boss) oturum ister. Dizeye `?sslmode=require&uselibpqcompat=true` eklenir (şifreli bağlantı; `pg` düz `sslmode=require`'ı sertifika doğrulaması sayar ve Supabase'in kendi CA'sında düşer). Sonra repo kökünden: `DATABASE_URL='<dize>' npm run db:migrate -w @akar/api` (ya da imajla `node src/db/migrate.ts`). PostGIS uzantısını ilk migration açar.
5. **Veri.** `DATABASE_URL='<dize>' npm run db:seed -w @akar/api` (6 demo eseri, rotalar, bulmacalar; tekrar çalıştırmak demo içeriğini başa döndürür), sonra `DATABASE_URL='<dize>' npm run ingest -w @akar/api -- --city bursa` (243 taslak; yerel `.cache/` önbelleği ağ isteğini azaltır). İlk yönetici: `DATABASE_URL='<dize>' npm run staff:invite -w @akar/api -- --email <adres> --role admin`. Komut satırındaki `DATABASE_URL`, `.env`'deki yerel değerin önüne geçer.
6. **API sunucusu.** Sağlayıcıda imaj `services/api/Dockerfile` ile, kök dizin bağlamıyla kurulur. Dağıtım öncesi komut (varsa): `node src/db/migrate.ts`. Ortam:

   | Değişken | Değer |
   | --- | --- |
   | `DATABASE_URL` | 4. adımdaki session pooler dizesi |
   | `CORS_ORIGINS` | `<web>` (birden çoksa virgülle; Vercel önizleme adresleri ayrı ayrı eklenmedikçe çalışmaz) |
   | `TRUST_PROXY` | Sağlayıcının önündeki vekil sayısı; tek yük dengeleyicide `1` |
   | `SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | Settings → API Keys, service_role / secret (yalnız sunucu) |
   | `AUTH_JWKS_URL` | `https://<ref>.supabase.co/auth/v1/.well-known/jwks.json` |
   | `AUTH_JWT_ISSUER` | `https://<ref>.supabase.co/auth/v1` |
   | `STORAGE_DRIVER` | `s3` |
   | `STORAGE_S3_ENDPOINT`, `STORAGE_S3_REGION`, `STORAGE_S3_ACCESS_KEY_ID`, `STORAGE_S3_SECRET_ACCESS_KEY` | 3. adımdaki S3 bağlantısı |
   | `STORAGE_PUBLIC_BASE_URL` | `https://<ref>.supabase.co/storage/v1/object/public/media` |
   | `RECEIPT_SECRET` | Yeni üretilir, yereldekinden farklı: `openssl rand -base64 48` |
   | `NOMINATIM_EMAIL` | İsteğe bağlı (panelden içe aktarma) |

   Sağlık denetimi yolu `/ready`. Açılış logunda `Invalid production environment` görülürse listelenen değişkenler eksiktir.

   Render (§11.16): Web Service → Docker, dal `main`, bölge Frankfurt, Dockerfile Path `services/api/Dockerfile`, Docker Build Context `.` (kök), Health Check Path `/ready`. Ortam "Add from .env" ile topluca eklenir. Dağıtım öncesi komut yalnız ücretli planlarda vardır; Free'de migration 4. adımdaki gibi bilgisayardan çalıştırılır. Free plan 15 dakika istek almayınca uyur, ilk istek yaklaşık bir dakika sürer. Build Filters → Included Paths: `services/api/**`, `packages/domain/**`, `packages/api-client/**`, `package-lock.json`.
7. **Web (Vercel).** Ortam: `NEXT_PUBLIC_API_URL=<api>`, `NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable anahtar>`; üçü de gizli değildir ve yalnız Production ortamına eklenir (önizleme adresleri `CORS_ORIGINS`'te olmadığı için API'ye bağlanamaz). Değişince yeniden dağıtılır (değerler derlemeye gömülür). Proje Root Directory `apps/web`, Next.js. Çevrimiçi test ortamı ayrı bir Vercel projesidir (§11.16); `NEXT_PUBLIC_API_URL` verilmeyen proje demo verisiyle çalışmaya devam eder.
8. **Test edenler ve yetkililer.** Özel SMTP ile giriş kodu herkese gider; test edenler Supabase ekibine eklenmez, uygulamada e-postayla giriş yapar ve sıradan kullanıcı olur. Yetkili: 5. adımdaki `staff:invite` (e-posta göndermez, rol ilk girişte verilir) ya da bir yöneticinin `POST /v1/admin/staff/invites` isteği (Supabase davet e-postası gönderir; adres Supabase'te zaten kayıtlıysa göndermez).

Doğrulama: [docs/TESTING.md §7](../../docs/TESTING.md#7-çevrimiçi-test-ortamı).

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
