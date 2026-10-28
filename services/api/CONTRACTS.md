# Akar API · Ortak sözleşme

Kararların gerekçeleri ve geçmişi: [docs/BACKEND-DECISIONS.md](../../docs/BACKEND-DECISIONS.md).

API üzerinde çalışan her geliştirici bu dosyaya uyar. Değişikliği backend sorumlusu yapar.

## 1. Modüller ve sınırlar

Her modül `src/modules/<modül>/` altında yaşar: `routes.ts` (Fastify eklentisi), `schemas.ts` (Zod), `service.ts` (iş kuralları), `<modül>.test.ts`. Tabloları `src/db/schema/<modül>.ts` içindedir.

| Modül | Klasör | Şema dosyası | Tablolar (yazma sahibi) |
| --- | --- | --- | --- |
| platform | `src/platform/` | `schema/platform.ts`, `schema/shared.ts` | `idempotency_keys`, `audit_log`; ortak enum ve tipler |
| catalog (okuma) | `modules/catalog/` | `schema/catalog.ts` | sözlük tabloları (`role_categories`, `site_types`, `periods`), `cities`, `regions`, `sources`, `sites`, `site_*`, `cards`, `story_blocks`, `history_images` |
| routes (okuma) | `modules/routes/` | `schema/routes.ts` | `catalog_routes`, `route_stops`, `quizzes`, `quiz_answers` |
| media | `modules/media/` | `schema/media.ts` | `media`, `media_uploads`, `media_deletions` |
| ingest | `modules/ingest/` | yok | catalog `drafts.ts` üzerinden yazar |
| identity | `modules/identity/` | `schema/identity.ts` | `staff_members`, `staff_invites`, `profiles`, `deleted_accounts`; hesap silme (`erasure.ts`) diğer modüllerin silme fonksiyonlarını çağırır |
| admin-catalog | `modules/admin-catalog/` | `schema/admin-catalog.ts` | `import_jobs`; ayrıca catalog ve routes tablolarının **yazma** tarafı |
| moderation | `modules/moderation/` | `schema/moderation.ts` | `memories`, `memory_reports` |
| engagement | `modules/engagement/` | `schema/engagement.ts` | `point_events`, `saved_sites`, `user_route_stops`, `story_progress`, `quiz_progress`, `user_badges` |
| admin-health | `modules/admin-health/` | yok | yok; `memories` ve `media` tablolarını yalnız okur |
| settings | `modules/settings/` | `schema/settings.ts` | `map_settings` (tek satır) |

Kurallar:

- Bir modül başka modülün tablosuna **yazmaz**; dışa açılmış servis fonksiyonunu çağırır. Tek istisna: `admin-catalog` içerik tablolarının yazarıdır (catalog/routes yalnız okur).
- Okuma sorguları yayın kapısını atlamamak koşuluyla başka modülün tablosuna `join` yapabilir (örnek: catalog → `media`).
- `app.ts`, `server.ts`, `src/db/schema/index.ts`, `drizzle/`, `package.json`, `src/config.ts`, `src/platform/*`, `src/test/harness.ts` ve `CONTRACTS.md` ortak dosyalardır; backend sorumlusu düzenler. Yeni modül, kayıt satırını (`MODULES` listesine eklenecek eklenti) ve bağımlılık ihtiyacını PR açıklamasında belirtir. Kayıtlı modüller: health, catalog, routes, identity, media, admin-catalog (sites, routes-editor, imports, reports), moderation, admin-health, engagement, settings.
- Migration'ı yalnız backend sorumlusu üretir (`npm run db:generate`). Mevcut migration'lar `0000`–`0014` (`0004` modül tabloları, `0005` `map_settings`, `0006` `media_uploads.cleaned_at`, `0007` `memories.pending_since`, `0008` `user_route_stops`, `0009` `media_deletions`, `0010` `background_jobs`, `0011` `deleted_accounts`, `0012` `upload_deletions`, `0013` silme tablolarında RLS, `0014` `media.triangles` ve `site_map_placements`); şemada değişiklik gerekiyorsa modül kendi şema dosyasını düzenler, migration ayrı üretilir. Elle SQL gerekiyorsa `drizzle-kit generate --custom`.
- Modül eklentisi `FastifyPluginAsyncZod` döner ve kendi `routes.ts` dosyasından dışa açılır. Testler eklentiyi `startTestApp({ register: [xxxRoutes] })` ile yükler; modül `MODULES`'a eklendiğinde aynı test değişmeden çalışır.

### Çalışma zamanı bağımlılıkları (`app.deps`)

```ts
type AppDeps = {
  config: Config;            // src/config.ts (SUPABASE_*, AUTH_*, STORAGE_*, RECEIPT_SECRET, VISIT_RADIUS_M, STORAGE_QUOTA_MB, TRUST_PROXY)
  db: Db;
  auth: AuthVerifier | null; // identity sağlar; null iken her token 401
  storage: StorageBuckets | null; // src/platform/storage.ts: { uploads, media } (iki ObjectStorage); media sürücüleri sağlar
  jobs: JobQueue | null;     // src/platform/jobs.ts; sunucuda databaseJobs (Supabase Cron ile), testte inlineJobs() (+ drain())
  geocoderFor: ((city: CityConfig) => Promise<Geocoder>) | null; // admin içe aktarma
};
```

Gerekli bağımlılık `null` ise uç `503 SERVICE_UNAVAILABLE` döner, sahte davranış göstermez.

### Hazır servisler (başka modüller bunları çağırır)

| Fonksiyon | Dosya | İş |
| --- | --- | --- |
| `siteDedupeKey`, `slugify`, `siteSearchText`, `siteSortName` | `modules/catalog/service.ts` | Yinelenme anahtarı, kimlik parçası, arama/sıralama alanları |
| `getPublishedSummaries`, `getSiteDetails` | `modules/catalog/service.ts` | Yalnız yayındaki eser özetleri; yayındaki eserlerin tam detayı toplu (sabit sorgu sayısı, taslak atlanır) |
| `listSiteTypeAliases`, `existingSiteKeys`, `insertDraftSites` | `modules/catalog/drafts.ts` | İçe aktarma taslakları |
| `planImport`, `commitImport`, `formatReport`, `parseCsv` | `modules/ingest/` | İçe aktarma deneme/onay (panel uçları da bunu kullanır) |
| `playableQuizzes`, `playableQuiz`, `checkQuizAnswer` | `modules/routes/quizzes.ts` | Cevapsız bulmaca ve sunucuda kontrol |
| `recordPointEvent`, `pointsOf`, `POINT_ACTIONS`, `takeBackMemoryPoints` | `modules/engagement/points.ts` | Puan defteri; kalkan onaylı anının puanını bir kez geri alma |
| `idempotent`, `idempotencyKeyOf` | `platform/idempotency.ts` | Tekrar güvenli mutasyon |
| `expireUploads` | `modules/media/service.ts` | Süresi dolmuş yüklemelerin `uploads` kovasındaki nesnelerini temizler (`server.ts`, 15 dk) |
| `deleteUnreferencedMedia`, `deleteMediaObjects`, `drainMediaDeletions`, `MEDIA_REFERENCES` | `modules/media/service.ts` | Hiçbir tablonun kullanmadığı medya satırını işlem içinde siler, nesnesini işlem bittikten sonra kovadan siler |
| `sweepUnattachedPhotos` | `modules/media/service.ts` | Ziyaretçinin 24 saattir hiçbir yerde kullanılmayan fotoğrafını siler (`server.ts`, 15 dk) |
| `eraseAccount`, `deleteSupabaseUser` | `modules/identity/erasure.ts` | Hesap silme (KVKK, §11.31): modüllerin `eraseMemories` (moderation), `eraseUploads` (media), `eraseEngagement` (engagement), `forgetIdempotencyKeys` (platform) fonksiyonlarını tek işlemde çağırır, en son Supabase kullanıcısını siler. Kullanıcıya bağlı yeni tablo eklenen modül kendi silme fonksiyonuna ekler (`identity-erasure.test.ts` her tabloyu tarar) |
| `recordAudit` | `platform/audit.ts` | Audit kaydı |
| `requireUser`, `requireRole` | `platform/auth.ts` | Yetki kontrolü |
| `PageQuery`, `pageResponse`, `encodeCursor`, `decodeCursor` | `platform/pagination.ts` | Keyset sayfalama |

## 2. Kimlik bağlamı ve roller

```ts
// src/platform/auth.ts
type Role = "user" | "editor" | "moderator" | "admin";
type AuthUser = { id: string; role: Role };
req.user: AuthUser | null; // null = misafir
type AuthVerifier = { verify(token: string): Promise<AuthUser | null> };
```

- `app.ts` her istekte `Authorization: Bearer <jwt>` başlığını `deps.auth.verify` ile çözer. Başlık yoksa `req.user = null`. Başlık var ama geçersizse **401 `UNAUTHENTICATED`**; misafire düşürülmez.
- `deps.auth` identity modülü gelene kadar `null`'dır (her token 401). Identity, Supabase JWKS ile doğrulayan `AuthVerifier`'ı sağlar; `id` = JWT `sub`.
- Rol JWT'den okunmaz; identity'nin tablosundan gelir. Kaydı olmayan oturum `user` olur. Silinmiş hesabın (`deleted_accounts`, §11.31) hâlâ geçerli token'ı 401 alır.
- Yetki: `requireRole("editor")` gibi `preHandler`. `admin` her role geçer.

| Rol | Yetki |
| --- | --- |
| misafir | Okuma; bulmaca/hikâye için imzalı makbuz alır |
| `user` | Kaydet, Rotam, ilerleme, puan, İz Bırak (kendi anısını silme dahil), Bildir, makbuz bozdurma, kendi hesabını ve verilerini silme |
| `editor` | Eser/rota/kart oluşturma, düzenleme, yayınlama; içe aktarma |
| `moderator` | Katkı onay/ret, onaylı anıyı yayından kaldırma, bildirilen içerik |
| `admin` | Hepsi + davet ve rol atama, anıyı kalıcı silme, bir kullanıcının hesabını silme (yetkili hesap silinmez, önce yetki kaldırılır) |

## 3. Hata sözleşmesi

Gövde her zaman `{ error: { code, message, fieldErrors, requestId } }`. Mesajlar Türkçe. Kodda `throw new AppError(status, code, message, fieldErrors?)`.

| HTTP | `code` | Ne zaman |
| --- | --- | --- |
| 400 | `VALIDATION_FAILED` | Zod doğrulaması; `fieldErrors` alan yolu → mesajlar |
| 400 | `INVALID_CURSOR` | Bozuk sayfalama imleci |
| 401 | `UNAUTHENTICATED` | Giriş yok ya da token geçersiz |
| 403 | `FORBIDDEN` | Rol yetmiyor |
| 404 | `NOT_FOUND` | Kayıt yok **veya yayında değil** (taslağın varlığı sızdırılmaz) |
| 409 | `CONFLICT` | Durum geçişi geçersiz (örn. onaylı anıyı tekrar onaylama; reddedilmiş anıya karar), kapanmış yüklemeye PUT, yinelenen kayıt, yetkili hesabı silme |
| 413 | `PAYLOAD_TOO_LARGE` | Dosya sınırı aşıldı |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Dosya içeriği beyan edilen türle uyuşmuyor |
| 422 | `PUBLISH_BLOCKED` | Yayın kapısı (`publicationIssues`); sorunlar `fieldErrors._` içinde |
| 422 | `IDEMPOTENCY_KEY_REUSED` | Aynı anahtar farklı istekle |
| 422 | `RECEIPT_INVALID` | Makbuz imzası/süresi geçersiz |
| 429 | `RATE_LIMITED` | Hız sınırı (oturum açıkken hesap, değilse IP başına); ayrıca anı bildirme kotası (24 saatte en çok 5 yeni bildirim), açık yükleme sınırı (hesap başına 10) ve yalnız `user` rolü için anı/fotoğraf kotası (en çok 3 bekleyen anı; 24 saatte 10 anı, 10 yükleme bileti) |
| 500 | `INTERNAL` | Beklenmeyen hata (ayrıntı loga) |
| 502 | `UPSTREAM_FAILED` | Dış servis (Supabase Auth admin API, e-posta) hata döndü |
| 503 | `SERVICE_UNAVAILABLE` | Gerekli bağımlılık (depolama, kimlik, iş kuyruğu, coğrafi kodlama) yapılandırılmamış |
| 503 | `NOT_READY` | `/ready`: veritabanına ulaşılamıyor |

## 4. Idempotency

Her POST/PUT/PATCH/DELETE `Idempotency-Key` kabul eder. Durum belirleyen PUT/DELETE kullanılır, aç/kapa (toggle) yok.

```ts
return idempotent(app.deps.db, req, req.user!.id, async (tx) => {
  // tüm yazmalar tx ile; audit de aynı tx'te
  await recordAudit(tx, { actorId, action: "site.update", entityType: "site", entityId, before, after, requestId: req.id });
  return { status: 200, body: dto };
}).then((r) => reply.status(r.status).send(r.body));
```

- Anahtar aktöre göre kapsamlıdır (`actorId`; misafir için `guest:<cihazId>`). Aynı anahtar + aynı gövde: ilk yanıt tekrar döner, iş yeniden çalışmaz. Aynı anahtar + farklı istek: 422.
- 5xx yanıtlar saklanmaz. Atılan `AppError` işlemi geri alır, anahtar kaydedilmez. Gövdesiz yanıt (204) JSON `null` olarak saklanır.
- Kayıtlar 24 saat yaşar (`IDEMPOTENCY_TTL_HOURS`); `purgeIdempotencyKeys` (`server.ts`, 15 dakikada bir) eskilerini siler. Saklanan yanıtlardaki kişisel veri (örn. silinen anının metni) böylece kalıcı olmaz; 24 saatten sonra aynı anahtarla tekrar istek yeni istek sayılır.
- Depolamadaki nesneyi silen mutasyon nesneyi işlem tamamlandıktan sonra siler (örnek: `moderation/routes.ts` `removing`): silme niyeti aynı DB işleminde `media_deletions` tablosuna yazılır. Silme başarısız olursa anahtar kalır; başlangıçta ve 30 saniyede bir çalışan işçi artan bekleme süresiyle yeniden dener. Başarılı veya zaten olmayan nesne silmelerinde niyet kaldırılır.

## 5. Audit

Her ayrıcalıklı yazma (`editor`, `moderator`, `admin` işlemleri) aynı işlem içinde `recordAudit` çağırır. `action` noktalı fiil: `site.create`, `site.update`, `site.map-placement`, `site.publish`, `site.unpublish`, `card.create`, `card.update`, `route.create`, `route.update`, `route.set-stops`, `route.publish`, `route.unpublish`, `quiz.create`, `quiz.update`, `media.create`, `media.update`, `import.create`, `import.commit`, `memory.create`, `memory.approve`, `memory.reject`, `memory.takedown`, `memory.delete`, `memory.report`, `account.delete`, `staff.invite`, `staff.grant`, `staff.role`, `staff.revoke`, `map-settings.update`. `before`/`after` JSON anlık görüntülerdir; kişisel veri (e-posta dışında) yazılmaz. `memory.create` (her gönderide, günlük anı kotası bunu sayar) ve `memory.delete` anı metnini içermez.

## 6. Puan olay kaydı

`point_events(user_id, action, subject_id, points, receipt_id, at)`; `(user_id, action, subject_id)` tekil, `receipt_id` tekil.

| `action` | Puan | `subject_id` |
| --- | --- | --- |
| `story.complete` | 15 | eser id |
| `quiz.correct` | 20 | bulmaca id |
| `visit.verified` | 100 | eser id |
| `memory.approved` | 25 | anı id (moderasyon onayında yazara) |
| `memory.removed` | −25 | anı id (onaylı anı silinince, kaldırılınca ya da reddedilince; yalnız `memory.approved` yazılmışsa) |

Puan her zaman `sum(points)`; istemciden puan kabul edilmez. "Cevabı göster" puan yazmaz; bozdurana ait `quiz_progress.revealed = true` olan bulmacanın `quiz.correct` makbuzu bozdurmada `revealed` nedeniyle reddedilir (puan ve defter satırı yazılmaz, `jti` kullanılmış sayılmaz).

## 7. Misafir makbuzu (HMAC)

```
v1.<payload>.<sig>
payload = base64url(JSON { jti, act, sub, dev, iat, exp })
sig     = base64url(HMAC-SHA256(RECEIPT_SECRET, "v1." + payload))
```

- `act` bir `POINT_ACTIONS` anahtarı, `sub` konu id, `dev` cihaz id (istemcinin ürettiği UUID), `iat`/`exp` Unix saniye (`exp = iat + 30 gün`), `jti` rastgele UUID.
- Sunucu yalnız kendi doğruladığı işlemler için makbuz üretir (bulmaca doğru, hikâye tamam). Bozdurmada imza `timingSafeEqual` ile, süre ve `act` kontrol edilir; her `jti` bir kez (`point_events.receipt_id`). Bozuk makbuz 422 `RECEIPT_INVALID`, toplu bozdurmada tek tek raporlanır. Kalem ret nedenleri (`RECEIPT_REJECTIONS`): `malformed`, `unsupported_version`, `bad_signature`, `expired`, `unknown_action`, `subject_not_found`, `already_redeemed`, `revealed`. Önceden `already_redeemed` olan `jti`, sonradan gelen "göster" ile neden değiştirmez.
- `RECEIPT_SECRET` yalnız `.env`'de; en az 32 bayt.

## 8. Depolama arayüzü

```ts
// src/platform/storage.ts (arayüz); sürücüler media modülünde
interface ObjectStorage {
  createUploadUrl(key: string, opts: { contentType: string; maxBytes: number; expiresInSec: number }):
    Promise<{ url: string; method: "PUT"; headers: Record<string, string> }>;
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  head(key: string): Promise<{ bytes: number; contentType: string } | null>;
  read(key: string, range?: { start: number; end: number }): Promise<Buffer>;
  publicUrl(key: string): string;
  delete(key: string): Promise<void>; // idempotent: olmayan nesne hata değildir
}
```

Sürücüler: S3 protokolü (Supabase Storage; yerelde `supabase start`, bulutta proje) ve testler için dosya sistemi (`STORAGE_FS_ROOT/<kova>/`). İki kova vardır: herkese kapalı `uploads` (`STORAGE_UPLOAD_BUCKET`, istemcinin imzalı PUT ile yazdığı tek yer) ve herkese açık okunan `media` (`STORAGE_BUCKET`, yalnız sunucu yazar). İkisi aynı ada ayarlanırsa sunucu açılmaz. `uploads` örneğinin `publicUrl`'si hata atar. JSON'da asla data URL ya da blob yok; istemci medya id'si gönderir. Sınırlar: fotoğraf ≤ 5 MB (JPEG/PNG/WebP), GLB ≤ 5 MB ve ≤ 139.152 üçgen (`MAX_MODEL_TRIANGLES`, §13), ses ≤ 5 MB (MP3/M4A); tür dosyanın ilk baytlarından doğrulanır. Yerel kovalar `supabase/config.toml` içinde tanımlı; bulutta `uploads` kovası elle, herkese kapalı olarak açılır.

Yükleme akışı:

- `POST /v1/media/uploads` sunucunun ürettiği yükleme anahtarı (`<kind>/<yyyy>/<mm>/<uuid>.<ext>`) için `uploads` kovasına imzalı PUT adresi verir. Bir hesap en çok 10 açık (bekleyen, süresi dolmamış) yükleme tutar; aşılırsa 429 `RATE_LIMITED`. Sınır her rol için geçerlidir. `user` rolü ayrıca kayan 24 saatte en çok 10 bilet alır (`media_uploads` satırları sayılır, silinmezler).
- `complete` dosyayı `uploads`'tan **bir kez** okur (en çok 5 MB + 1 bayt), boyut ve ilk baytları o tampon üzerinde doğrular, doğruladığı baytları `media` kovasında yeni bir son anahtara (`<kind>/<yyyy>/<mm>/<mediaId>.<ext>`) yazar ve yükleme anahtarını siler. `media.url`, `media.storageKey` ve `media.bytes` son anahtardan gelir; istemcinin yazma izni olduğu kova asla yayınlanmaz. İstemci adresi türetmez, yanıttaki `url`'yi kullanır.
- Model (`kind=model`) için `complete` aynı tampondan GLB'nin JSON bölümünü okur ve üçgenleri sayar (`media/glb.ts` `countTriangles`, §13). JSON okunamıyor ya da sayılamıyorsa 415 `UNSUPPORTED_MEDIA_TYPE`, sınır aşılırsa 413 `PAYLOAD_TOO_LARGE` ("Model en çok 139.152 üçgen olabilir; bu dosyada N var."); iki durumda da diğer ret yolları gibi `uploads` nesnesi silinir, yükleme `rejected` olur, hiçbir şey yayınlanmaz. Sayı `media.triangles`'a yazılır ve `MediaDto.triangles` olarak döner; sayılmamış model (sınır öncesi yüklenenler) `null`. Mevcut modeller için tek seferlik, tekrar çalıştırılabilir `npm run backfill:triangles -w @akar/api` (medya kovasından okur, sınırı aşanı da sayar, hiçbirini silmez).
- `media` nesnesi işlem commit olmadan yazılır. İşlem başarısız olursa (satır, audit, iş kuyruğu, idempotency kaydı ya da commit) satır ve `media_deletions` niyeti geri alınır; bu yüzden `complete` yazdığı anahtarı `ctx.published` listesine ekler ve rota hata yolunda `discardUnsavedObjects` çağırır. Nesne yalnız satırının olmadığı doğrulanınca silinir (hata commit'ten sonra gelmiş olabilir); doğrulama ya da silme başarısız olursa nesne kalır ve loga düşer. Yeni bir `complete` çağıranı da aynı listeyi verir ve hata yolunda aynı fonksiyonu çağırır.
- Dosya sistemi sürücüsünün PUT'u yalnız `pending` yüklemede yazar (satır yoksa 404, durum `pending` değilse 409); satır yazma boyunca kilitli olduğundan `complete` ile yarış olmaz.
- `expireUploads` (`server.ts`, 15 dakikada bir): `cleaned_at` boş ve süresi 5 dakikadan fazla önce dolmuş her yüklemenin `uploads` nesnesini siler ve `cleaned_at` yazar; `pending` olanları ayrıca `expired` yapar. Böylece S3 imzalı PUT'u (geri alınamaz) `complete` ya da ret sonrası süresi dolana kadar yeniden kullanılsa bile bırakılan dosya herkese kapalı kalır ve süpürmede silinir. Birden çok örnekte güvenle çalışır (`FOR UPDATE SKIP LOCKED`); `delete` olmayan nesneye hata vermez.
- `sweepUnattachedPhotos` (aynı zamanlayıcı): yükleyeni şu an personel olmayan (`staff_members`), editör/admin olarak yüklenmemiş (`media.create` audit kaydı yok, böylece yetkisi alınan editörün kütüphanesi kalır), 24 saatten eski ve `MEDIA_REFERENCES`'taki hiçbir sütunun göstermediği fotoğrafın satırını siler, yüklemesinin bağını (`media_uploads.media_id`) boşaltır, işlem bitince `media` nesnesini siler. Silme önce satırı kilitler, kullanımı kilitten sonra ayrı sorguyla yeniden denetler (beklerken bağlanan anı görülür; `deleteUnreferencedMedia` de böyle). Nesne silmede her anahtar denenir, başarısızlar tek hatada loga düşer. Medyaya yeni yabancı anahtar eklenirse `MEDIA_REFERENCES`'a da eklenir (`media.test.ts` veritabanıyla karşılaştırır).

### İş kuyruğu

`app.deps.jobs.work(name, handler)` modül eklentisinde kaydedilir, `send(name, data)` ile iş eklenir. Ad biçimi `<modül>.<iş>` (örn. `media.glb-parts`, `admin.import-plan`). Testte `jobs.drain()` bekleyen işleri çalıştırır.

## 9. Sayfalama

Liste uçları `PageQuery` (`cursor`, `limit` 1–100, varsayılan 20) alır, `pageResponse(item)` döner: `{ items, nextCursor }`. Keyset: kararlı bir anahtar (`(sort, id)`) üzerinde `encodeCursor`/`decodeCursor`; offset yok. Bozuk imleç 400 `INVALID_CURSOR`.

## 10. Yayın kapısı ve güven

- Okuma uçları yalnız `status = 'published'` döndürür; taslak 404'tür. Yayındaki eserde konum ve tür zorunludur (veritabanı CHECK'i).
- Yayınlama `@akar/domain` `validateSite`/`publicationIssues` ile yapılır; doğrulayıcılar kopyalanmaz.
- Her içerik parçası `trust` (verified / inferred / representative) ve kaynak taşır. İçe aktarılan taslaklar `inferred`.
- Bulmaca cevabı `quiz_answers` tablosundadır; yalnız `checkQuizAnswer` okur. Hiçbir DTO doğru seçeneğin indeksini içermez.
- Bildirilen anı: onaylı bir anı, onaydan sonra **3 farklı** kullanıcı bildirince `pending`'e döner; öncesinde yayında kalır ve moderasyon kuyruğunda `reportCount` ile görünür. Kullanıcı başına 24 saatte en çok 5 yeni bildirim (429 `RATE_LIMITED`). Moderatörün onayı önceki bildirimleri düşürür.
- Yayından kaldırma ve silme (§11.18): moderatör onaylı her anıyı nedenli retle kaldırabilir (bildirilmemişse audit `memory.takedown`). Ret ya da kaldırma fotoğrafı (satır ve nesne) siler, metin kalır. Yazar kendi anısını her durumda, admin her anıyı kalıcı siler (kayıt, bildirimler, fotoğraf). Kalkan onaylı anının puanı bir kez geri alınır.
- `OwnMemory.siteName` eser yayında değilse `null`'dır (taslak adı sızmaz); `AdminMemory.siteName` her zaman metindir.

## 11. Test kuralları

- Dosya: `src/modules/<modül>/<modül>.test.ts` (gerekirse `<modül>-<konu>.test.ts`). Her dosya `startTestApp()` ile kendi PostGIS konteynerini açar; testler birbirine bağımlı olmaz.
- Kimlik: `authHeader({ id, role })` (`src/test/auth.ts`). Identity testleri gerçek doğrulayıcıyı `startTestApp({ auth })` ile verir.
- `startTestApp({ auth, storage, geocoderFor, env, register })` seçenekleri; dönen `jobs.drain()` arka plan işlerini çalıştırır, `config` test yapılandırmasıdır (`RECEIPT_SECRET` dolu).
- Ağ yok: coğrafi kodlama, depolama, Supabase admin API ve e-posta enjekte edilir (dosya sistemi depolama, sahte `fetch`, yerel imzalı JWT).
- Yalnız kırılabilecek davranış: yetki sınırları, taslağın görünmemesi, cevap anahtarının sızmaması, idempotency, moderasyon geçişleri, sahte makbuzun reddi, yayın kapısı. Kablolama, kopya alan ya da varsayılan değer testi yazılmaz.

## 12. Üye dizini ve rol atama

- `GET /v1/admin/users?query=<eposta>&page=1&pageSize=25`: yalnız admin. Tüm kayıtlar Supabase Auth'tan okunur; uygulamaya henüz profil yazmamış yeni üyeler de görünür. Arama kimlik servisinde e-posta üzerinden yapılır. Yanıt `{ items, page, nextPage }`; alanlar `userId`, `email`, `displayName`, `role`, `emailConfirmed`, `createdAt`, `lastSignInAt`. Auth metadata/kimlik detayları aktarılmaz. `private, no-store`.
- Bu uç, Supabase Auth'un sayfa numaralı API'sine uyum için §9'un istisnasıdır. `page` 1–10000, `pageSize` 1–100. Eşzamanlı yeni kayıtlarda sayfalar kayabilir; Yenile güncel listeyi getirir. Sunucudaki `SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY` gerekir; anahtar tarayıcıya verilmez.
- `PUT /v1/admin/users/:userId/role`: `{ role, expectedRole }`. Roller `user`, `editor`, `moderator`, `admin`. `expectedRole`, ekranda görünen roldür; güncel değerle eşleşmezse 409. UUID ve rol doğrulanır. Kendi rolünü değiştirmek 409; yükseltme için doğrulanmış e-posta gerekir. Bilinmeyen/silinmiş üye 404; kimlik servisi hatası 502; eksik yapılandırma 503.
- Yeni atama `staff_members` kaydı oluşturur; `user` rolü bu kaydı kaldırır. Hesap ve katkıları korunur. `staff.grant`, `staff.role`, `staff.revoke` audit kayıtları aktör ve istek kimliğiyle aynı transaction'da tutulur. Mevcut JWT'nin sonraki API isteği yeni rolü alır; panel gezinme yetkisi sayfa yenilendiğinde yeniden okunur.
- Ortak staff kilidi altında aktörün hâlâ admin olduğu yeniden doğrulanır (eski staff uçları dahil). Son admin koruması devam eder. Yeni rol uç noktası, üyenin güncel ve kayıtlı eski e-postasına ait açık davetleri iptal eder; bunlar yetkiyi geri getiremez. `Idempotency-Key` tekrarları aynı sonucu döndürür.
- **Migration gerekmiyor:** mevcut `staff_members`, `staff_invites`, `profiles`, `deleted_accounts` ve `audit_log` yeterlidir. Auth kullanıcılarının e-posta/verilerini ikinci bir dizine kopyalayan tablo veya backfill yoktur. Mevcut migration zinciri güncel olmalıdır.

Panel akışı: yönetici girişi → **Üyeler ve roller** → e-posta araması → **Rolü düzenle** → rol açıklamasını incele → **Değişikliği onayla**. Editör ve moderatör bu ekranı göremez. Demo ekranındaki üyeler örnektir ve sayfa yenilendiğinde sıfırlanır.

Supabase sözleşmesi: [sunucu tarafında listUsers](https://supabase.com/docs/reference/javascript/auth-admin-listusers), [GoTrue listeleme ve filter uygulaması](https://github.com/supabase/auth/blob/master/internal/api/admin.go).

## 13. Haritada model yerleşimi

Ayrıntı ve gerekçe: [docs/MAP-MODELS-PLAN.md](../../docs/MAP-MODELS-PLAN.md), [BACKEND-DECISIONS §11.35](../../docs/BACKEND-DECISIONS.md).

- **Üçgen sayımı** (`countTriangles`): sahnedeki (varsayılan `scene`; yoksa tüm sahneler; sahne yoksa tüm düğümler) her düğümün ağındaki her çizim parçası, düğüm tekrarları dahil. N = `indices` accessor `count`'u, yoksa `POSITION`'ınki. `mode` 4 ya da tanımsız: ⌊N/3⌋; 5 ve 6: max(N − 2, 0); 0–3: 0. Tanımsız `mode`, eksik ya da aralık dışı accessor, geçersiz düğüm/ağ/sahne başvurusu ve düğüm döngüsü `GlbError`'dır. Birden çok kez başvurulan alt ağaç bir kez hesaplanır, yineleme yok (iç içe paylaşımlı düğümler doğrusal sürede sayılır).
- **Tablo** `site_map_placements` (catalog şeması, yazma sahibi admin-catalog): eser başına en çok bir satır, eser silinince silinir, RLS açık. Model kaydından ayrıdır: model değişince ya da kaldırılınca yerleşim korunur. Değer aralıkları veritabanında CHECK'tir (yön 0 ≤ x < 360, ölçek 0,1–10, yükseklik −50…200, ana parça ≤ 200 karakter, gizle/geri al noktaları ≤ 50).
- **Yazma:** `PUT /v1/admin/sites/:id/map-placement` (`editor`; `admin` de), gövde `{ lng?, lat?, headingDeg, scale, altitudeM, anchorNode, hiddenPoints, keptPoints, visible }`, hepsi birlikte, satır tümüyle değişir. `lng` ve `lat` birlikte verilir ya da ikisi de boş/`null` (eserin konumu). Zod aralık ve 50 nokta sınırı: 400 `VALIDATION_FAILED`. Modeli olmayan eser 409 `CONFLICT`, bilinmeyen eser 404. Konum ve her gizle/geri al noktası eserin şehrinin sınır kutusu içinde olmalı (400, `fieldErrors` `lng`, `hiddenPoints.<i>`, `keptPoints.<i>`): kutu `ingest/cities.ts` `CITIES[<şehir>].bbox`'tır, geocoder sonuçlarını da bununla eleriz; `CITIES`'te kaydı olmayan şehirde yalnız WGS84 aralığı denir (`PUT .../location` ise şehir denetimi yapmaz). Boş `anchorNode` `null` olur. `Idempotency-Key`, audit `site.map-placement` (`before`/`after` kayıtlı değerler, konum yoksa `lng`/`lat` `null`), eserin `updatedAt`'ı da güncellenir. Yanıt, diğer yönetici yazmaları gibi eserin düzenlenebilir tam görünümüdür.
- **Okuma, herkese açık:** API'de `SiteDetail.model` diye bir nesne yoktur; model, `media` listesindeki `kind=model` kaydıdır. `MediaDto.triangles` (sayı ya da `null`) o kayıtta, `SiteDetail.placement` eser düzeyinde gelir: `{ lng, lat, headingDeg, scale, altitudeM, anchorNode, hiddenPoints, keptPoints }`, alan **hiçbir zaman eksik değildir**; satır yoksa, `visible` kapalıysa ya da eserin modeli yoksa `null`. `lng`/`lat` kayıtta konum yoksa eserin konumudur. Toplu okuma ek tek sorgu çalıştırır (`loadPlacements`). ETag gövdeden hesaplandığı için yerleşim değişince değişir; istemci `If-None-Match` ile 304 alır.
- **Okuma, panel:** `AdminSiteDetail.mapPlacement` (`/v1/admin/sites/:id`, `/v1/admin/site-details` ve tüm yönetici yazma yanıtları) kayıtlı yerleşimi `visible` ve `updatedAt` ile **her durumda** döner (gizliyken, modeli kaldırılmışken de); yoksa `null`. Aynı yanıttaki `placement`, ziyaretçinin göreceği hâlidir.
