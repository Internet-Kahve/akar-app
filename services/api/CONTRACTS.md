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
| media | `modules/media/` | `schema/media.ts` | `media`, `media_uploads` |
| ingest | `modules/ingest/` | yok | catalog `drafts.ts` üzerinden yazar |
| identity | `modules/identity/` | `schema/identity.ts` | `staff_members`, `staff_invites`, `profiles` |
| admin-catalog | `modules/admin-catalog/` | `schema/admin-catalog.ts` | `import_jobs`; ayrıca catalog ve routes tablolarının **yazma** tarafı |
| moderation | `modules/moderation/` | `schema/moderation.ts` | `memories`, `memory_reports` |
| engagement | `modules/engagement/` | `schema/engagement.ts` | `point_events`, `saved_sites`, `story_progress`, `quiz_progress`, `user_badges` |
| settings | `modules/settings/` | `schema/settings.ts` | `map_settings` (tek satır) |

Kurallar:

- Bir modül başka modülün tablosuna **yazmaz**; dışa açılmış servis fonksiyonunu çağırır. Tek istisna: `admin-catalog` içerik tablolarının yazarıdır (catalog/routes yalnız okur).
- Okuma sorguları yayın kapısını atlamamak koşuluyla başka modülün tablosuna `join` yapabilir (örnek: catalog → `media`).
- `app.ts`, `server.ts`, `src/db/schema/index.ts`, `drizzle/`, `package.json`, `src/config.ts`, `src/platform/*`, `src/test/harness.ts` ve `CONTRACTS.md` ortak dosyalardır; backend sorumlusu düzenler. Yeni modül, kayıt satırını (`MODULES` listesine eklenecek eklenti) ve bağımlılık ihtiyacını PR açıklamasında belirtir. Kayıtlı modüller: health, catalog, routes, identity, media, admin-catalog (sites, routes-editor, imports), moderation, engagement, settings.
- Migration'ı yalnız backend sorumlusu üretir (`npm run db:generate`). Mevcut migration'lar `0000`–`0005` (`0004` modül tabloları, `0005` `map_settings`); şemada değişiklik gerekiyorsa modül kendi şema dosyasını düzenler, migration ayrı üretilir. Elle SQL gerekiyorsa `drizzle-kit generate --custom`.
- Modül eklentisi `FastifyPluginAsyncZod` döner ve kendi `routes.ts` dosyasından dışa açılır. Testler eklentiyi `startTestApp({ register: [xxxRoutes] })` ile yükler; modül `MODULES`'a eklendiğinde aynı test değişmeden çalışır.

### Çalışma zamanı bağımlılıkları (`app.deps`)

```ts
type AppDeps = {
  config: Config;            // src/config.ts (SUPABASE_*, AUTH_*, STORAGE_*, RECEIPT_SECRET, VISIT_RADIUS_M, TRUST_PROXY)
  db: Db;
  auth: AuthVerifier | null; // identity sağlar; null iken her token 401
  storage: ObjectStorage | null; // src/platform/storage.ts; media sürücüleri sağlar
  jobs: JobQueue | null;     // src/platform/jobs.ts; sunucuda pg-boss, testte inlineJobs() (+ drain())
  geocoderFor: ((city: CityConfig) => Promise<Geocoder>) | null; // admin içe aktarma
};
```

Gerekli bağımlılık `null` ise uç `503 SERVICE_UNAVAILABLE` döner, sahte davranış göstermez.

### Hazır servisler (başka modüller bunları çağırır)

| Fonksiyon | Dosya | İş |
| --- | --- | --- |
| `siteDedupeKey`, `slugify`, `siteSearchText`, `siteSortName` | `modules/catalog/service.ts` | Yinelenme anahtarı, kimlik parçası, arama/sıralama alanları |
| `getPublishedSummaries` | `modules/catalog/service.ts` | Yalnız yayındaki eser özetleri |
| `listSiteTypeAliases`, `existingSiteKeys`, `insertDraftSites` | `modules/catalog/drafts.ts` | İçe aktarma taslakları |
| `planImport`, `commitImport`, `formatReport`, `parseCsv` | `modules/ingest/` | İçe aktarma deneme/onay (panel uçları da bunu kullanır) |
| `playableQuizzes`, `playableQuiz`, `checkQuizAnswer` | `modules/routes/quizzes.ts` | Cevapsız bulmaca ve sunucuda kontrol |
| `recordPointEvent`, `pointsOf`, `POINT_ACTIONS` | `modules/engagement/points.ts` | Puan defteri |
| `idempotent`, `idempotencyKeyOf` | `platform/idempotency.ts` | Tekrar güvenli mutasyon |
| `expireUploads` | `modules/media/service.ts` | Süresi dolmuş bekleyen yüklemeleri temizler (`server.ts`, 15 dk) |
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
- Rol JWT'den okunmaz; identity'nin tablosundan gelir. Kaydı olmayan oturum `user` olur.
- Yetki: `requireRole("editor")` gibi `preHandler`. `admin` her role geçer.

| Rol | Yetki |
| --- | --- |
| misafir | Okuma; bulmaca/hikâye için imzalı makbuz alır |
| `user` | Kaydet, ilerleme, puan, İz Bırak, Bildir, makbuz bozdurma |
| `editor` | Eser/rota/kart oluşturma, düzenleme, yayınlama; içe aktarma |
| `moderator` | Katkı onay/ret, bildirilen içerik |
| `admin` | Hepsi + davet ve rol atama |

## 3. Hata sözleşmesi

Gövde her zaman `{ error: { code, message, fieldErrors, requestId } }`. Mesajlar Türkçe. Kodda `throw new AppError(status, code, message, fieldErrors?)`.

| HTTP | `code` | Ne zaman |
| --- | --- | --- |
| 400 | `VALIDATION_FAILED` | Zod doğrulaması; `fieldErrors` alan yolu → mesajlar |
| 400 | `INVALID_CURSOR` | Bozuk sayfalama imleci |
| 401 | `UNAUTHENTICATED` | Giriş yok ya da token geçersiz |
| 403 | `FORBIDDEN` | Rol yetmiyor |
| 404 | `NOT_FOUND` | Kayıt yok **veya yayında değil** (taslağın varlığı sızdırılmaz) |
| 409 | `CONFLICT` | Durum geçişi geçersiz (örn. onaylı anıyı tekrar onaylama; bildirilmemiş onaylı anıya karar), kapanmış yüklemeye PUT, yinelenen kayıt |
| 413 | `PAYLOAD_TOO_LARGE` | Dosya sınırı aşıldı |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Dosya içeriği beyan edilen türle uyuşmuyor |
| 422 | `PUBLISH_BLOCKED` | Yayın kapısı (`publicationIssues`); sorunlar `fieldErrors._` içinde |
| 422 | `IDEMPOTENCY_KEY_REUSED` | Aynı anahtar farklı istekle |
| 422 | `RECEIPT_INVALID` | Makbuz imzası/süresi geçersiz |
| 429 | `RATE_LIMITED` | Hız sınırı (oturum açıksa hesap, değilse IP başına); ayrıca anı bildirme kotası (24 saatte en çok 5 yeni bildirim) ve açık yükleme sınırı (hesap başına 10) |
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
- 5xx yanıtlar saklanmaz. Atılan `AppError` işlemi geri alır, anahtar kaydedilmez.

## 5. Audit

Her ayrıcalıklı yazma (`editor`, `moderator`, `admin` işlemleri) aynı işlem içinde `recordAudit` çağırır. `action` noktalı fiil: `site.create`, `site.update`, `site.publish`, `site.unpublish`, `card.create`, `card.update`, `route.create`, `route.update`, `route.set-stops`, `route.publish`, `route.unpublish`, `quiz.create`, `quiz.update`, `media.create`, `media.update`, `import.create`, `import.commit`, `memory.approve`, `memory.reject`, `memory.report`, `staff.invite`, `staff.grant`, `staff.role`, `staff.revoke`, `map-settings.update`. `before`/`after` JSON anlık görüntülerdir; kişisel veri (e-posta dışında) yazılmaz.

## 6. Puan olay kaydı

`point_events(user_id, action, subject_id, points, receipt_id, at)`; `(user_id, action, subject_id)` tekil, `receipt_id` tekil.

| `action` | Puan | `subject_id` |
| --- | --- | --- |
| `story.complete` | 15 | eser id |
| `quiz.correct` | 20 | bulmaca id |
| `visit.verified` | 100 | eser id |
| `memory.approved` | 25 | anı id (moderasyon onayında yazara) |

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

Sürücüler: S3 protokolü (Supabase Storage; yerelde `supabase start`, bulutta proje) ve testler için dosya sistemi. JSON'da asla data URL ya da blob yok; istemci medya id'si gönderir. Sınırlar: fotoğraf ≤ 5 MB (JPEG/PNG/WebP), GLB ≤ 5 MB, ses ≤ 5 MB (MP3/M4A); tür dosyanın ilk baytlarından doğrulanır. Yerel `media` kovası `supabase/config.toml` içinde tanımlı.

Yükleme akışı:

- `POST /v1/media/uploads` sunucunun ürettiği yükleme anahtarı (`<kind>/<yyyy>/<mm>/<uuid>.<ext>`) için imzalı PUT adresi verir. Bir hesap en çok 10 açık (bekleyen, süresi dolmamış) yükleme tutar; aşılırsa 429 `RATE_LIMITED`. Sınır her rol için geçerlidir.
- `complete` dosyayı **bir kez** okur (en çok 5 MB + 1 bayt), boyut ve ilk baytları o tampon üzerinde doğrular, doğruladığı baytları yeni bir son anahtara (`<kind>/<yyyy>/<mm>/<mediaId>.<ext>`) yazar ve yükleme anahtarını siler. `media.url`, `media.storageKey` ve `media.bytes` son anahtardan gelir; istemcinin yazma izni olduğu anahtar asla yayınlanmaz. İstemci adresi türetmez, yanıttaki `url`'yi kullanır.
- Dosya sistemi sürücüsünün PUT'u yalnız `pending` yüklemede yazar (satır yoksa 404, durum `pending` değilse 409); satır yazma boyunca kilitli olduğundan `complete` ile yarış olmaz.
- `expireUploads` (`server.ts`, 15 dakikada bir): süresi 5 dakikadan fazla önce dolmuş `pending` yüklemelerin nesnesini siler ve `expired` yapar; birden çok örnekte güvenle çalışır. Hiç dosya gelmemiş bilet de silinir (`delete` olmayan nesneye hata vermez).
- Yalnız S3: imzalı PUT geri alınamadığından `complete` sonrası 15 dakika içinde silinmiş yükleme anahtarına yeniden yazılabilir. Servis edilen baytları değiştirmez ama kovada sahipsiz nesne bırakır; `expireUploads` bunu süpürmez. Operasyon: yükleme anahtarlarını herkese açık olmayan bir önek/kovaya al ya da S3 yaşam döngüsü kuralıyla kalıntıları sil.

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
- `OwnMemory.siteName` eser yayında değilse `null`'dır (taslak adı sızmaz); `AdminMemory.siteName` her zaman metindir.

## 11. Test kuralları

- Dosya: `src/modules/<modül>/<modül>.test.ts` (gerekirse `<modül>-<konu>.test.ts`). Her dosya `startTestApp()` ile kendi PostGIS konteynerini açar; testler birbirine bağımlı olmaz.
- Kimlik: `authHeader({ id, role })` (`src/test/auth.ts`). Identity testleri gerçek doğrulayıcıyı `startTestApp({ auth })` ile verir.
- `startTestApp({ auth, storage, geocoderFor, env, register })` seçenekleri; dönen `jobs.drain()` arka plan işlerini çalıştırır, `config` test yapılandırmasıdır (`RECEIPT_SECRET` dolu).
- Ağ yok: coğrafi kodlama, depolama, Supabase admin API ve e-posta enjekte edilir (dosya sistemi depolama, sahte `fetch`, yerel imzalı JWT).
- Yalnız kırılabilecek davranış: yetki sınırları, taslağın görünmemesi, cevap anahtarının sızmaması, idempotency, moderasyon geçişleri, sahte makbuzun reddi, yayın kapısı. Kablolama, kopya alan ya da varsayılan değer testi yazılmaz.
