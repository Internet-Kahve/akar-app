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
| site-tasks | `modules/site-tasks/` | `schema/engagement.ts` (`user_site_tasks`, `user_site_badges`) | eser görevi ve rozeti uçları (§11.44); `site_tasks`, `site_task_answers`, `site_badges` tabloları `schema/catalog.ts` içindedir (içe aktarma yazar, catalog okur); hikâye rozetini engagement `completeStory` bu modülün `awardStoryBadges` fonksiyonunu çağırarak verir, hesap silmede kullanıcı satırlarını `eraseEngagement` siler |
| admin-health | `modules/admin-health/` | yok | yok; `memories` ve `media` tablolarını yalnız okur |
| settings | `modules/settings/` | `schema/settings.ts` | `map_settings` (tek satır) |
| usage | `modules/usage/` | `schema/usage.ts` | `usage_daily` (§11.72) |

Kurallar:

- Bir modül başka modülün tablosuna **yazmaz**; dışa açılmış servis fonksiyonunu çağırır. Tek istisna: `admin-catalog` içerik tablolarının yazarıdır (catalog/routes yalnız okur).
- Okuma sorguları yayın kapısını atlamamak koşuluyla başka modülün tablosuna `join` yapabilir (örnek: catalog → `media`).
- `app.ts`, `server.ts`, `src/db/schema/index.ts`, `drizzle/`, `package.json`, `src/config.ts`, `src/platform/*`, `src/test/harness.ts` ve `CONTRACTS.md` ortak dosyalardır; backend sorumlusu düzenler. Yeni modül, kayıt satırını (`MODULES` listesine eklenecek eklenti) ve bağımlılık ihtiyacını PR açıklamasında belirtir. Kayıtlı modüller: health, catalog, routes, identity, media, admin-catalog (sites, routes-editor, imports, reports), moderation, admin-health, engagement, site-tasks, settings.
- Migration'ı yalnız backend sorumlusu üretir (`npm run db:generate`). Mevcut migration'lar `0000`–`0032` (`0004` modül tabloları, `0005` `map_settings`, `0006` `media_uploads.cleaned_at`, `0007` `memories.pending_since`, `0008` `user_route_stops`, `0009` `media_deletions`, `0010` `background_jobs`, `0011` `deleted_accounts`, `0012` `upload_deletions`, `0013` silme tablolarında RLS, `0014` `media.triangles` ve `site_map_placements`, `0015` `map_settings` varsayılanı, `0016` `media.cover_groups`, `0017` `site_part_cards` ve fotoğrafları, `0018` `cities.scene`, `0019` `site_about_chapters`, `site_section_photos`, `site_sections.chapter_id` ve `sites.about_cover_media_id`, `0020` `site_tasks`, `site_task_answers`, `site_badges`, `user_site_tasks` ve `user_site_badges`, `0021` şehir kaydı sütunları (`cities.center_lng` …), `0022` `history_images.present_angle_match` ve `site_sample_traces`, `0023` `sites.display_order`, `0032` `site_map_placements.front_deg` ve `media.interior_parts`); şemada değişiklik gerekiyorsa modül kendi şema dosyasını düzenler, migration ayrı üretilir. Elle SQL gerekiyorsa `drizzle-kit generate --custom`.
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
- **Tablo** `site_map_placements` (catalog şeması, yazma sahibi admin-catalog): eser başına en çok bir satır, eser silinince silinir, RLS açık. Model kaydından ayrıdır: model değişince ya da kaldırılınca yerleşim korunur. Değer aralıkları veritabanında CHECK'tir (yön ve ön cephe yönü 0 ≤ x < 360, ölçek 0,1–10, yükseklik −50…200, ana parça ≤ 200 karakter, gizle/geri al noktaları ≤ 50).
- **Yazma:** `PUT /v1/admin/sites/:id/map-placement` (`editor`; `admin` de), gövde `{ lng?, lat?, headingDeg, frontDeg?, scale, altitudeM, anchorNode, hiddenPoints, keptPoints, visible }`, hepsi birlikte, satır tümüyle değişir. `lng` ve `lat` birlikte verilir ya da ikisi de boş/`null` (eserin konumu). Zod aralık ve 50 nokta sınırı: 400 `VALIDATION_FAILED`. Modeli olmayan eser 409 `CONFLICT`, bilinmeyen eser 404. Konum ve her gizle/geri al noktası eserin şehrinin sınır kutusu içinde olmalı (400, `fieldErrors` `lng`, `hiddenPoints.<i>`, `keptPoints.<i>`): kutu `ingest/cities.ts` `CITIES[<şehir>].bbox`'tır, geocoder sonuçlarını da bununla eleriz; `CITIES`'te kaydı olmayan şehirde yalnız WGS84 aralığı denir (`PUT .../location` ise şehir denetimi yapmaz). Boş `anchorNode` `null` olur. `Idempotency-Key`, audit `site.map-placement` (`before`/`after` kayıtlı değerler, konum yoksa `lng`/`lat` `null`), eserin `updatedAt`'ı da güncellenir. Yanıt, diğer yönetici yazmaları gibi eserin düzenlenebilir tam görünümüdür.
- **Okuma, herkese açık:** API'de `SiteDetail.model` diye bir nesne yoktur; model, `media` listesindeki `kind=model` kaydıdır. `MediaDto.triangles` (sayı ya da `null`) o kayıtta, `SiteDetail.placement` eser düzeyinde gelir: `{ lng, lat, headingDeg, frontDeg, scale, altitudeM, anchorNode, hiddenPoints, keptPoints }`, alan **hiçbir zaman eksik değildir**; satır yoksa, `visible` kapalıysa ya da eserin modeli yoksa `null`. `lng`/`lat` kayıtta konum yoksa eserin konumudur. Toplu okuma ek tek sorgu çalıştırır (`loadPlacements`). ETag gövdeden hesaplandığı için yerleşim değişince değişir; istemci `If-None-Match` ile 304 alır.
- **Okuma, panel:** `AdminSiteDetail.mapPlacement` (`/v1/admin/sites/:id`, `/v1/admin/site-details` ve tüm yönetici yazma yanıtları) kayıtlı yerleşimi `visible` ve `updatedAt` ile **her durumda** döner (gizliyken, modeli kaldırılmışken de); yoksa `null`. Aynı yanıttaki `placement`, ziyaretçinin göreceği hâlidir.
- **Ön cephe yönü ve iç mekân parçaları (§11.63, migration `0032`):** `site_map_placements.front_deg` (boş olabilir; CHECK 0 ≤ x < 360) ön cephenin baktığı yöndür; harita güneşi bu cepheye vurur, `null` = şehrin ışık yönü. Yerleşim gövdesinde `frontDeg` isteğe bağlıdır; verilmeyen ya da `null` değer yöne dair bilgiyi siler (satır tümüyle değişir). `media.interior_parts` (`text[]`, varsayılan boş) sunum dosyasının iç mekân parçalarıdır; `MediaDto.interiorParts` olarak `kind=model` kaydında döner, harita bunları çizmez. `interiorParts` ve `coverGroups` için yazma ucu yoktur, yalnız içerik aktarımı yazar. İçerik aktarımı `3d/model.json` `on_yonu` değerini `frontDeg`'e, `ic_parcalar` değerini `interiorParts`'a yazar; eserin yerleşimi yoksa paketteki `yaw`/`ana_parca` ile oluşturur, varsa yalnız `frontDeg`'i (paket belirtmişse) günceller.

## 14. Hikâye seslendirmesi ve İngilizce taslak (§11.56)

- **Tablo** `narrations` (RLS açık, yazma sahibi `narrations` modülü): `site_id`, `subject_type` (`story_block` | `part_card`, §11.59), `subject_id`, `variant` (`text` | `simple`), `lang` (`tr` | `en`), `voice` (`female` | `male`), `media_id`, `text_hash`, `model`. Benzersiz anahtar (`site_id`, `subject_type`, `subject_id`, `variant`, `lang`, `voice`). `media_id` `MEDIA_REFERENCES`'tadır; yer değiştiren ya da silinen kaydın ses dosyası başka yerde kullanılmıyorsa silinir.
- **Bayatlık:** `text_hash` = sha256(`model` + konuşulan metin). Konuşulan metin, kayıtlı metnin rakamları sözcüğe çevrilmiş hâlidir (`spoken.ts`); saklanan metin değişmez. Okuma tarafı kaydın kendi `model`'iyle, üretim tarafı yapılandırılmış modelle karşılaştırır. Bayat kayıt `SiteDetail`'de ve panel detayında görünmez.
- **Okuma:** `SiteDetail.stories[].narrations` ve `AdminSiteDetail.stories[].narrations`: `[{ variant, lang, voice, mediaId }]`, sıra dil → varyant → ses; `mediaId` aynı yanıtın `media` listesinde (`kind=audio`) çözülür. Hikâye cümlesinde ayrıca `simpleEn`, `textEnStatus`, `simpleEnStatus` (`machine` | `reviewed` | `null`) gelir. `has.audio` herkese açık listede eserin herhangi bir kaydı varsa doğrudur (bayat dahil), panelde yalnız güncel kayıtlara bakar. `audioMediaId` ve `audioEnMediaId` kaldırıldı; hikâye kaydı gövdesindeki bu alanlar yok sayılır.
- **Yazma, panel:** `PUT /v1/admin/sites/:id/stories` gövdesinde `simpleEn` (isteğe bağlı; verilmezse saklanan değer ve durumu kalır). Değişmiş ya da yeni İngilizce metin `reviewed`, değişmemiş olan eski durumunu korur, boş olan `null` olur. Cümle silinince kayıtları da silinir.
- **Üretim:** `POST /v1/admin/sites/:id/narrations` (`editor`; `admin` de), gövde isteğe bağlı `{ storyBlockId }` ya da `{ partCardId }` (ikisi birlikte 400; ikisi de yoksa eserin tüm hikâye cümleleri ve parça kartları), `Idempotency-Key`. Yanıt `{ generated, skipped, stale }` (`stale`, `generated` içinde sayılır). Uzun sürdüğünden transaction açık tutulmaz; her kayıt kendi kısa transaction'ında yazılır. 503 `SERVICE_UNAVAILABLE` (Deepgram anahtarı ya da depolama yok), 429 `RATE_LIMITED` (24 saatte `TTS_DAILY_CHAR_LIMIT` aşılır), 502 `UPSTREAM_FAILED`, 404 bilinmeyen eser, cümle ya da parça kartı. Audit `narration.generate`, `after.chars`.
- **Çeviri:** `POST /v1/admin/sites/:id/translate` (aynı yetki ve gövde). Yanıt `{ translated, skipped }`. Yalnız boş `text_en` / `simple_en` doldurulur ve `machine` işaretlenir; doluya dokunulmaz. Audit `story.translate`. Anahtar yoksa 503.
- **Sağlayıcılar** `platform/tts.ts` (`TtsProvider`) ve `platform/translate.ts` (`Translator`) arayüzleridir; `AppDeps.tts` / `AppDeps.translator` anahtar yoksa `null`. Testte `src/test/fakes.ts` (`fakeTts`, `fakeTranslator`) verilir; ağ çağrısı yapılmaz.
- **Parça kartları (§11.59, migration `0028_part_card_en`):** `site_part_cards` tablosuna `title_en`, `body_en`, `title_en_status`, `body_en_status` (`machine` | `reviewed`) eklendi. `PartCardDto` (herkese açık ve panel detayı) `titleEn`, `bodyEn`, `titleEnStatus`, `bodyEnStatus` ve `narrations` döner; kart kaydı yalnız `variant=text` ve kartın metnini (`body` / `body_en`) 4 sesle okur, başlık okunmaz; bayat kayıt listelenmez. `PUT /v1/admin/sites/:id/part-cards` kart gövdesinde isteğe bağlı `titleEn` / `bodyEn`: hikâyedeki `textEn` kuralı (verilmezse saklanan değer ve durum kalır, yeni ya da değişmiş `reviewed`, değişmemiş eski durum, boş `null`). Kartı kayıttan çıkarılırsa kayıtları ve ses dosyaları silinir. `narrations` ve `translate` gövdesinde `partCardId`; çeviri kart başına tek Gemini isteğiyle boş `title_en` / `body_en` alanlarını doldurur (`machine`, audit `partCard.translate`); `TranslateFields` alan adıyla anahtarlı kayıttır (hikâye `text`/`simple`, kart `title`/`body`).
- **«Eser hakkında» (§11.65, migration `0034_about_narrations`):** `subject_type` `about_chapter` (bölüm başlığı, `title` / `title_en`) ve `about_section` (paragraf `body` / `body_en`; “ ile açılan kitabede yalnız `Mealen:` / `Meaning:` sonrası, anlamı yoksa kayıt yok). Yalnız `variant=text`. `SiteDetail` ve `AdminSiteDetail` `sections[].narrations` ve `chapters[].narrations` döner (güncel olanlar). Üretim gövdesinde `aboutChapterId` / `aboutSectionId` (dört kimlikten en fazla biri, aksi 400; bilinmeyen 404). `translate` bu kimliklerle 400 `VALIDATION_FAILED`. `PUT /v1/admin/sites/:id/about` listede olmayan bölüm ve paragrafın kayıtlarını ve kullanılmayan ses dosyalarını siler.
- **Görevler ve rozetler (§11.67):** `PUT /v1/admin/sites/:id/tasks` (editör; `setTasks`, `admin-catalog/sites.ts`) görev ve rozet listelerini bütün olarak, sırasıyla yazar ama kimlikle günceller (`ON CONFLICT (id) DO UPDATE`; `(site_id, position)` benzersizliği için sıralar önce eksi değerlere alınır); gövdede olmayan görev ve rozet silinir, `user_site_tasks` ve `user_site_badges` satırları FK ile gider. Cevap anahtarı `site_task_answers`'a yazılır ve yalnız `AdminSiteDetail`'de (`AdminSiteTaskDto`) döner, `taskDto` (herkese açık) değişmez. Görev bu eserin değilse (kimlik başka eserde) 409; kimlik tekrarı, modelde olmayan parça, eserin listesinde olmayan fotoğraf, aralık dışı `correctIndex` ve gövdede olmayan göreve bağlı rozet 400 (hiçbir şey yazılmaz). Satır başına tek `en_status` (görev: başlık, metin, ayrıntılar; rozet: başlık, metin): değişen İngilizce `reviewed`, değişmeyen eski durumu korur. Görev anlatımı (`narrations`) yoktur. İçe aktarma (`import-demo.ts`) veritabanında olan eserin görevlerine dokunmaz, `--replace-tasks` ile ezer.
- **«Eser hakkında» kaydı (§11.69):** `PUT /v1/admin/sites/:id/about` (editör ve admin, `Idempotency-Key`, denetim kaydı `site.update`; `setAbout`, `admin-catalog/sites.ts`) eski `PUT …/sections`'ın yerini aldı. Gövde `{ chapters: [{ id?, title, titleEn?, kind, summary[], figures[{value,label,evidence}], quotes[{text,by|null}], timeline[{year,evidence}], terms[{word,definition}], readingEn? (null/boş = temizle; verilmezse korunur; Türkçesiyle liste liste aynı uzunlukta ve eksiksiz), sections: [{ id?, kind, title, titleEn?, body, bodyEn?, trust, sourceId|null }] }], looseSections: [...] }`; bölüm ve paragraf sırası gövdedeki sıradır. Kimliği eserde olan satır korunur (başka eserin bölüm kimliği 409), yeni kimlik serbest, tekrar eden kimlik 400 (`chapters.N.id`, `chapters.N.sections.M.id`, `looseSections.M.id`). Bölümün `camera`, `interior`, `focusParts` alanları, kitap fotoğrafları ve kapak korunur; gövdede olmayan bölüm ve paragraf fotoğrafları ve seslendirmeleriyle silinir. En çok 40 bölüm, 400 paragraf. Satır başına tek `en_status`: değişen İngilizce `reviewed`, yalnız Türkçe değişirse eski durum. İçe aktarma (`import-demo.ts`) veritabanında olan eserin bölümlerine dokunmaz (`aboutKept`), `--replace-about` ile ezer.
- **Hikâye cümlesinin 3B bakışı (§11.70):** İçe aktarma (`loadCatalog` `keepStoryViews`) veritabanında aynı kimlikle olan cümlenin `camera`, `highlights`, `interior`, `showCard` alanlarını korur, metni dosyadan yazar (`storyViewsKept`); `--replace-story-views` dosyadakine döndürür. Tohum (`seed.ts`) her şeyi dosyadan yazar.

### Adlı kişisel rotalar (0031)

- `GET /v1/me/routes` → `{ items: PersonalRoute[] }`; yalnız oturum sahibinin rotaları.
- `POST /v1/me/routes` `{ name }` → oluşturulan rota (200).
- `PATCH /v1/me/routes/:id` `{ name }` → adı değişen rota.
- `PUT /v1/me/routes/:id/stops` `{ siteIds }` → sıralı durakların tamamını değiştirir.
- `DELETE /v1/me/routes/:id` → `{ deleted: true }`.

`PersonalRoute`: `id`, `name`, `isDefault`, `siteIds`, `createdAt`, `updatedAt`. Ad kırpılır ve 1–80 karakter olmalıdır; duraklar benzersiz, en fazla 100 ve yayındaki eserlerden oluşur. Başkasının rotası 404; tüm yazmalar mevcut idempotency ve kullanıcı başına işlem kilidini kullanır. Yayından kaldırılan duraklar yanıtta gizlenir, kayıtları korunur.

Eski `GET/PUT /v1/me/route` aynı `{ siteIds }` sözleşmesiyle varsayılan rotayı okur/yazar. Varsayılan rotanın silinmesi boş bir varsayılan oluşturur; diğer rotalara dokunmaz. `DELETE /v1/me` rota üst kayıtlarını ve cascade ile tüm duraklarını siler.

Migration `0031_personal_routes`, eski `user_route_stops` satırlarını `default:<user_id>` rotasına konumlarını koruyarak kopyalar. Eski tablo korunur ve varsayılan rota yazmalarında eşzamanlı güncellenir. Misafir HTTP istemcisi ve demo istemcisi adlı rotaları cihazda saklar. Mevcut oturum açma aktarımı varsayılan rotayı taşır; cihazdaki diğer adlı rotalar cihazda korunur.

## 15. Kullanım istatistikleri (§11.72)

- **Tablo** `usage_daily` (RLS açık, yazma sahibi `usage` modülü, migration `0035_usage_daily`): `day` (İstanbul günü), `event`, `site_id`, `ref` (yoksa boş metin), `guest`, `count`. Yalnız günlük sayaç: kullanıcı kimliği, IP, cihaz kimliği ya da saat saklanmaz. Yabancı anahtar yok; silinen eserin sayıları kalır, adı `null` döner. Sayaç küçük olduğundan silme işi yok.
- **Olay listesi** `USAGE_EVENTS` (`@akar/domain`; API ve web aynı listeyi kullanır): her olayın eser isteyip istemediği ve `ref` türü. Yeni olay = bu listeye bir satır + web çağrısı (`apps/web/src/lib/usage.ts` `track`); göç gerekmez.
- **Yazma:** `POST /v1/events` `{ events: [{ event, siteId?, ref? }] }` (en fazla 50; dakikada 60 istek) → `{ accepted }`. Oturum yoksa misafir sayılır. Kuralı tutmayan ya da bilinmeyen esere, rotaya, o eserin parça kartına ya da görevine ait olay hata vermeden atlanır.
- **Okuma (yalnız admin):** `GET /v1/admin/stats?from&to` → `totals`, `daily`, `sites` (görüntülemeye göre), `routes`; `GET /v1/admin/stats/sites/:id?from&to` → olay + `ref` satırları (cümle bırakma eğrisi, parça kartı ve görev başlığıyla). Dönem iki uç dahil, varsayılan son 30 gün, en fazla 366 gün.

## 16. Site asistanı (§11.74)

- **Uç:** `POST /v1/chat` (modül `modules/chat/`), yalnız giriş yapmış kullanıcı (`requireUser`). Gövde `{ message (1–500), history [{ role: user|assistant, text ≤2000 }] ≤10, siteId?, lang: tr|en }`. Yanıt `{ answer, sources, general }`; `cache-control: no-store`.
- **Bağlam:** `siteId` varsa yayındaki eserin tanıtımı, hikâye cümleleri, «Eser hakkında» paragrafları ve parça kartları numaralı bloklar olarak (`d`, `s1…`, `a1…`, `p1…`); yoksa yayındaki eserlerin kısa özeti (`c1…`). Görevler ve cevap anahtarları bağlama girmez. Üst sınır `MAX_CONTEXT_CHARS` (120K karakter). Model kullandığı blok anahtarlarını döner; sunucu bunları `sources`'a çevirir, bilinmeyen anahtar düşer, en fazla 5. `general: true` = yanıt içerik dışı genel bilgiye de dayanıyor.
- **Saklama:** sohbet, soru ya da yanıt saklanmaz; yalnız başarılı yanıtta `usage_daily`'de `chat.message` sayacı artar (`countServerEvent`). `USAGE_EVENTS`'te `server: true` olan olay `POST /v1/events` ile gelirse sayılmaz.
- **Sınırlar:** hesap başına dakikada `CHAT_PER_MINUTE` (6, `@fastify/rate-limit`, örnek başına); günün (İstanbul) `chat.message` toplamı `CHAT_DAILY_LIMIT`'e ulaşınca 429 `RATE_LIMITED` (model çağrılmaz).
- **Sağlayıcı:** `platform/chat-model.ts` (`ChatModel`, Gemini `geminiChat`): `GEMINI_CHAT_API_KEYS` sırayla denenir (her istek bir sonraki anahtardan başlar); 429/503 veren anahtar `KEY_COOLDOWN_MS` (60 sn) atlanır ve aynı istek sıradaki anahtara gider; hepsi dinleniyorsa 429, başka hata 502 `UPSTREAM_FAILED`. Bekleme süreleri bellekte, sunucusuz örnek başına. `AppDeps.chat` anahtar yoksa `null` → 503. Testte `fakeChat()`.
