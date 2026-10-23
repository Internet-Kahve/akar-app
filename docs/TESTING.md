# Test rehberi

Projeyi kendi bilgisayarında çalıştırıp test etmek için gereken her şey. Komutlar repo kökünden çalışır (aksi yazılmadıkça).

## Gerekenler

- Node.js 24 (`.nvmrc`) ve repo kökünde bir kez `npm ci`
- Docker Desktop ya da OrbStack (açık olmalı)
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) (macOS: `brew install supabase/tap/supabase`)
- Uçtan uca testler için Google Chrome

İlk çalıştırmada Docker imajları iner (birkaç GB, birkaç dakika). Sonraki açılışlar saniyeler sürer.

## 1. Uygulamaları açmak

İki terminal:

```sh
npm run api   # API: http://127.0.0.1:4000 · Swagger: http://127.0.0.1:4000/docs
npm run dev   # Web uygulaması: http://127.0.0.1:3000
```

`npm run api` yerel Supabase'i (giriş, dosya depolama, e-posta kutusu) ve API veritabanını başlatır, `services/api/.env` yoksa oluşturur, migration'ları uygular, veritabanı boşsa Bursa demo verisini yükler ve API'yi açar. Tekrar çalıştırmak güvenlidir; mevcut veriye dokunmaz.

`npm run dev` (port 3000) web uygulamasını kendi demo verisiyle açar; API'ye bağlı değildir ve Playwright testleri bunu kullanır. Web'i gerçek API'ye bağlı denemek için `npm run api` açıkken üçüncü bir terminalde:

```sh
npm run dev:api   # API'ye bağlı web: http://127.0.0.1:3001
```

Komut yerel Supabase adresini ve anahtarını `supabase status` ile okur, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` değişkenlerini kendisi verir. API'nin `CORS_ORIGINS` değerinde `http://127.0.0.1:3001` olmalıdır (`services/api/.env.example` bunu içerir; eski bir `.env`'in varsa ekle ve `npm run api`'yi yeniden başlat).

**Web'den giriş:** Mirasım sayfasında **Giriş yap** → e-posta adresini yaz → 8 haneli kod http://127.0.0.1:54324 (Mailpit) adresindeki e-postaya düşer → kodu gir. Kaydetme sonrası İz Bırak ya da yönetim işlemleri giriş gerektirdiğinde pencere kendiliğinden açılır. Yönetim/moderasyon için adresi önce yetkilendir: `npm run staff:invite -w @akar/api -- --email ben@example.com --role admin`. İz Bırak'ta KVKK açık rıza metni şimdilik taslaktır (sürüm `taslak-2026-10-21`). Bulmaca (Mirasım → Deneysel arayüzleri göster → eserde **Bulmaca**) API'deki sorularla çalışır; fotoğraflı anıda yükleme çubuğu görünür.

API'yi ayrıca Swagger ya da `curl` ile de test edebilirsin.

| Adres | Ne |
| --- | --- |
| http://127.0.0.1:4000/docs | Swagger: bütün uçlar, istek/yanıt şemaları, "Try it out" |
| http://127.0.0.1:54324 | E-posta kutusu (Mailpit): yerelde gönderilen bütün e-postalar |
| http://127.0.0.1:54323 | Supabase Studio: kullanıcılar, dosyalar |

## 2. Giriş (token)

Okuma uçları (`GET /v1/sites`, `/v1/routes`, `/v1/cities`, `/v1/map-settings`) giriş istemez. Diğerleri için token al:

```sh
npm run api:token -- --email ben@akar.test --role admin
```

Komut e-posta kodu beklemeden oturum açar ve token'ı yazar (1 saat geçerli). Swagger'da sağ üstteki **Authorize** düğmesine yapıştır ya da:

```sh
TOKEN=$(npm run -s api:token -- --email ben@akar.test --role admin)
curl http://127.0.0.1:4000/v1/me -H "Authorization: Bearer $TOKEN"
```

Her rolü ayrı bir adresle dene; `@akar.test` adresleri yalnız yereldir.

| `--role` | Ne yapabilir |
| --- | --- |
| `user` (varsayılan) | Kaydet, ilerleme, puan, İz Bırak (anı paylaş), Bildir |
| `editor` | Eser, rota, kart oluşturma/düzenleme/yayınlama; içe aktarma; 3B model ve ses yükleme |
| `moderator` | Anıları onaylama/reddetme, bildirilen içerik |
| `admin` | Hepsi + personel davet/rol, harita ayarları |

Gerçek e-posta koduyla giriş de denenebilir: kod Mailpit'e düşer.

## 3. Elle denenecek akışlar

Gövdeler ve alanlar Swagger'da. Yazma isteklerinde isteğe bağlı `Idempotency-Key` başlığı aynı isteğin iki kez işlenmesini önler.

- **Eser:** editörle `POST /v1/admin/sites` (taslak) → bilgileri, konumu, medyayı doldur → `POST .../publish`. Eksik varsa 422 ve Türkçe liste döner. Yayından önce `GET /v1/sites/:id` misafire 404'tür.
- **Fotoğraf yükleme (3 adım):** `POST /v1/media/uploads` → yanıttaki `url`'ye dosyayı `PUT` et (yanıttaki `headers` ile) → `POST /v1/media/uploads/:uploadId/complete`. Yayındaki adres `complete` yanıtındaki `url`'dir. Sınır: 5 MB; JPEG/PNG/WebP, GLB, MP3/M4A.
- **İz Bırak:** kullanıcıyla `POST /v1/memories` → anı `pending` → moderatörle karar → onaylanınca eser sayfasında ve `GET /v1/memories` akışında görünür, yazar 25 puan alır.
- **Harita ayarları:** `GET /v1/map-settings` herkese açık; `PUT /v1/admin/map-settings` yalnız admin.
- **Yetki sınırları:** aynı ucu misafir (token yok → 401), yanlış rol (403) ve doğru rolle dene.

## 4. Otomatik testler

| Komut | Ne test eder | Not |
| --- | --- | --- |
| `npm run typecheck` | Web uygulaması tip kontrolü | |
| `npm test` | Ortak paketler (`packages/domain`, `packages/api-client`) | Saniyeler |
| `npm run test:e2e` | Web uygulamasının kullanıcı akışları, masaüstü ve mobil boyutta (Playwright, `tests/`) | Chrome gerekir; web sunucusunu kendisi açar. Chrome yoksa: `npx playwright install chromium` |
| `npm run test:e2e:api` | Demo yolu gerçek API'yle (`services/api/e2e/`): misafir fotoğraflı anı yazar, gönderirken e-posta koduyla giriş yapar (kod Mailpit'ten okunur), moderatör panelde onaylar, yeni bir misafir anıyı fotoğrafıyla görür; misafir bulmacada yanlış cevap sonrası doğruyu bulur. Masaüstü ve mobil boyut | Yalnız yerel, CI'da çalışmaz: önce `npm run api`; API kipindeki web'i (3001) gerekirse kendisi açar. Yerel veritabanına `e2e-*@akar.test` kullanıcıları ve onaylı anılar yazar. Bulmaca testi, yayındaki bir rota durağında bulmaca yoksa atlanır |
| `npm run test:e2e:api -- --project desktop -g quiz` | Tek proje ya da tek test | |
| `npm run typecheck -w @akar/api` | API tip kontrolü | |
| `npm test -w @akar/api` | API entegrasyon testleri: her test dosyası kendi geçici PostGIS konteynerini açar | Docker açık olmalı; `npm run api` gerekmez ve yerel veriye dokunmaz |
| `npm run check` | PR öncesi hepsi bir arada: yukarıdaki tip kontrolleri ve testler (e2e hariç) + `docs/api/openapi.json` güncelliği | Docker açık olmalı; e2e için `npm run check -- --e2e` |

PR açınca GitHub aynı kontrolleri çalıştırır: web için `typecheck`, `npm test`, `test:e2e` ve `build`; API için tip kontrolü, testler ve `docs/api/openapi.json`'ın güncelliği (API uçlarını değiştirdiysen `npm run openapi -w @akar/api`).
`docker build` imajı ve eksik üretim ortamıyla açılmayı reddetmesi de API CI'ında denetlenir.

API testlerini yazma kuralları: [services/api/CONTRACTS.md §11](../services/api/CONTRACTS.md).

## 5. Durdurmak ve sıfırlamak

`services/api` klasöründe:

| Komut | Ne yapar |
| --- | --- |
| Ctrl-C | API'yi kapatır; Supabase ve veritabanı çalışmaya devam eder |
| `npm run local:down` | Hepsini durdurur; veri kalır |
| `npm run local:reset` | API veritabanını siler, migration + demo verisiyle baştan kurar. Supabase kullanıcıları kalır. İçe aktarılan Bursa taslakları da istenirse: `npm run ingest -- --city bursa` |

## 6. Sorun giderme

| Belirti | Çözüm |
| --- | --- |
| `Docker çalışmıyor` | Docker Desktop/OrbStack'i aç, tekrar `npm run api` |
| `Supabase başladı ama Auth/Storage yanıt vermiyor` | `cd services/api && supabase stop`, sonra `npm run api` |
| `port is already allocated` / 4000, 5433, 54321 kullanımda | O portu kullanan programı kapat (başka bir Postgres ya da Supabase projesi olabilir) |
| Token ile 401 | Token'ın süresi dolmuştur (1 saat); yenisini al |
| Rol beklenenden düşük (`user`) | Token'ı `--role` ile al; rol ilk istekte verilir, `GET /v1/me` ile kontrol et |
| `npm test -w @akar/api` konteyner hatası | Docker açık mı; diskte yer var mı |
| Üretim imajı `Invalid production environment` ile kapanıyor | Listelenen değişkenler eksik ya da `CORS_ORIGINS` tam köken değil (sonda `/` olmaz); [services/api/README.md "Yayına alma"](../services/api/README.md#yayına-alma) |

Bir hata bulduğunda: ne yaptın, hangi istek/ekran, beklenen ve gelen yanıt (yanıttaki `requestId` ile) — bunları issue'ya yaz.

## 7. Çevrimiçi test ortamı

Kurulum: [API yayına alma rehberi](../services/api/README.md#yayına-alma).
Canlı web [akar.tamerakdeniz.com](https://akar.tamerakdeniz.com), API
[akar-api.vercel.app](https://akar-api.vercel.app/ready) üzerindedir. Her ikisi `main`den dağıtılır;
veritabanı/Auth/Storage Frankfurt Supabase projesidir. [Dağıtım kaydı](deployment/2026-10-23-cloud-migration.md)
aktif kaynakları listeler. Yalnız build başarısı veritabanı, giriş ve Storage bağlantılarının çalıştığını göstermez.

**Hesap açmadan önce imajı yerelde dene.** `npm run api` açıkken (Supabase ve veritabanı yerelde), `services/api` içinde:

```sh
docker build -f Dockerfile -t akar-api ../..
docker run --rm --network host --env-file .env -e HOST=0.0.0.0 -e PORT=4010 akar-api node src/db/migrate.ts
docker run --rm --network host --env-file .env -e HOST=0.0.0.0 -e PORT=4010 akar-api
curl http://127.0.0.1:4010/ready
```

`--network host` konteynerin `127.0.0.1` adreslerini (veritabanı 5433, Supabase 54321) Mac'tekilerle aynı yapar; imzalı yükleme adresleri de Mac'ten açılır (OrbStack'te hazır; Docker Desktop'ta Settings → Resources → Network → "Enable host networking"). İmaj `NODE_ENV=production` ile çalıştığından eksik ayar açılışta listelenir.

**Ortam kurulduktan sonra denenecekler** (telefonda ve masaüstünde, `<web>` adresinde):

| Kontrol | Beklenen |
| --- | --- |
| `curl <api>/ready` | `{"status":"ok"}` |
| `curl -i <api>/v1/sites?limit=1 -H "Origin: <web>"` | 200 ve `access-control-allow-origin: <web>` |
| `curl "https://<ref>.supabase.co/rest/v1/quiz_answers?select=*" -H "apikey: <anon>"` | Satır dönmez (Data API kapalı) |
| Harita ve eser listesi | Yayındaki eserler (tohum + editörün yayınladıkları) görünür; taslaklar görünmez |
| Giriş | Mirasım → Giriş yap → 8 haneli kod e-postası gelir (Hostinger SMTP; güncel gönderim kotaları Supabase ve Hostinger panellerinden kontrol edilir) |
| İz Bırak (fotoğraflı) | Yükleme çubuğu ilerler, anı "onay bekliyor"; yönetici panelinde onaylanınca misafir de görür |
| Fotoğraf adresi | `complete` sonrası adres `…/object/public/media/…`; `uploads` kovasındaki dosya herkese açık adresle açılmaz (400/404) |
| Bulmaca | Yanlışta tekrar/göster, doğruda açıklama |
| Yetki | Kullanıcı hesabı yönetim uçlarında 403 alır |

Hata kaydında yanıttaki `requestId`'yi yaz; API logunda aynı kimlikle aranır.
