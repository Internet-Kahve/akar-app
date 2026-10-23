# Frontend / Backend handoff

Bu belge ekip için önerilen sözleşmedir; mevcut backend uygulamasını tarif etmez.

## Bugünkü sınır

UI yalnızca `AkarClient.getSnapshot()`, `dispatch(command)` ve `reset()` çağırır. Mock adaptör localStorage kullanır. Domain modelleri `packages/domain/src/index.ts` içindedir. `createMockClient` yerine HTTP adaptörü enjekte edildiğinde ekranlar korunabilir; snapshot'ın endpoint yanıtlarından birleştirilmesi adaptörün sorumluluğudur. Bu henüz yazılmış bir HTTP istemcisi değildir.

`reset()` yalnızca demo içindir; üretim API'sine otomatik çevrilmemelidir. Frontend iş kuralları güvenlik sınırı değildir. Üretimde puan, rol, onay, cevap kontrolü ve ziyaret doğrulaması sunucuda yapılmalıdır.

## 16 Ekim · mock içerik stüdyosu sözleşmesi

- `HeritageSite.editorVersion: 2`, `sources`, `photos`, `coverPhotoId` ve isteğe bağlı `model` yeni editör kayıtlarını tanımlar. TR/EN metinler, bâni, dönem, adres, vakıf rolü ve ilişkili eser alanları isteğe bağlıdır; eski snapshot'lar açılmaya devam eder.
- Hikâye cümleleri `photoId` / `sourceId`, isteğe bağlı EN metni, kart görünürlüğü ve model parça vurguları taşır. `publicationIssues()` ve `validateSite()` kapak, kaynak, lisans, alt metin ve cümle bağlantılarını yayın aşamasında kontrol eder; eksik içerik taslak olabilir.
- `catalog-routes` komutu `Snapshot.catalogRoutes` listesini kaydeder. Katalog rotaları ile kullanıcının `routeIds` rotası ayrıdır; taslak katalog rotaları keşifte gösterilmez.
- `photo` komutu ortak görseli bütün referanslarında günceller. `import-sites` atomik olarak yalnız taslak ekler; aynı normalize ad + ilçe kaydını atlar ve var olan içeriği değiştirmez.
- Görsel ve GLB dosyalarının `src` alanı bu yerel demoda data URL'dir. Backend entegrasyonunda upload servisi ve medya kimlikleriyle değiştirilmeli; büyük dosyalar snapshot JSON'una taşınmamalıdır. Yerel kota hatası gerçek bir başarısızlık olarak UI'a döner.

## Önerilen kaynaklar

| Endpoint                                             | Veri / davranış                                                               |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| `GET /v1/sites?query=&kind=&city=&bbox=&cursor=`     | Sayfalanmış eser listesi, koordinat, kategori, görsel URL, güven/kaynak özeti |
| `GET /v1/sites/:id`                                  | Detay, story blocks, medya ve kaynak ilişkileri                               |
| `GET /v1/routes`, `GET /v1/routes/:id`               | Rotanın durakları ve süre bilgisi                                             |
| `GET /v1/me`, `GET /v1/me/passport`                  | Profil, kaydedilenler, okunanlar, ziyaretler, puan, rozet                     |
| `PUT/DELETE /v1/me/saved/:siteId`                    | Açıkça istenen favori durumu; ağ retry'ında toggle kullanılmaz                |
| `PUT /v1/me/route`                                   | Sıralı `siteIds`                                                              |
| `POST /v1/stories/:id/complete`                      | Tekrarında yeni puan üretmez                                                  |
| `POST /v1/visits/verify`                             | `siteId`, koordinat, accuracy, zaman; backend geofence sonucu                 |
| `GET /v1/quizzes/:id`, `POST /v1/quizzes/:id/submit` | Cevap anahtarı client'a verilmez; sunucu sonuç/açıklama/puan döndürür         |
| `POST /v1/media/uploads`                             | Tip/boyut doğrulamalı signed upload; kalıcı medya ID                          |
| `POST /v1/memories`                                  | `{siteId,text,mediaId?}`; zorunlu başlangıç `pending`                         |
| `GET /v1/sites/:id/memories`                         | Kullanıcıya yalnızca onaylanmış içerik                                        |
| `GET /v1/memories?siteIds=&city=`                    | Anı akışı: yayındaki eserlerin onaylı anıları tek listede                     |
| `DELETE /v1/me/memories/:id`                         | Sil: yazar kendi anısını her durumda kalıcı siler (fotoğrafıyla); 204         |
| `POST/PATCH /v1/admin/sites`                         | Yetkili içerik ekleme/düzenleme                                               |
| `GET /v1/admin/site-details`                         | Panel için toplu tam görünüm: taslaklar dahil, `/v1/admin/sites` ile aynı süzgeç ve sıra |
| `GET /v1/admin/memories?status=pending\|approved\|rejected` | Moderasyon kuyruğu ve panelin "Onaylanan" / "Reddedilen" listeleri          |
| `POST /v1/admin/memories/:id/decision`               | Onay, nedenli ret ya da yayından kaldırma; audit kaydı ve idempotent puan     |
| `DELETE /v1/admin/memories/:id`                      | Kalıcı sil (yalnız admin): her anı, fotoğrafıyla; 204                         |
| `GET /v1/admin/health`                               | Sağlık uyarıları (moderatör+admin): 48 saati aşan bekleyen anılar; `storage` yalnız admin |

Mutasyonlarda `Idempotency-Key` önerilir. Toggle yerine PUT/DELETE gibi istenen durumu açıkça ifade eden işlemler kullanılmalı. Demo `Snapshot.points` değeri üretim için güvenilir sayılmaz.

## Uygulanan okuma uçları (P2)

`GET /v1/sites`, `GET /v1/sites/:id`, `GET /v1/cities`, `GET /v1/lookups`, `GET /v1/routes`, `GET /v1/routes/:id`, `GET /v1/routes/:id/bundle` `services/api` içinde çalışır; yalnızca yayındaki içerik döner. Liste yanıtı `{ items, nextCursor }` (keyset imleç, `limit` ≤ 100); bozuk imleç `400 INVALID_CURSOR`, bozuk `bbox`/`near`/`has` `400 VALIDATION_FAILED`. Eser listesi şehir, tür, vakıf rolü kategorisi (`category`), dönem (`period`), içerik (`has=model,audio,history`) ile süzülür, `near` + `sort=distance` ile mesafeye göre sıralanır. Detayda bölümler, kartlar, Geçmişi Gör görselleri ve hikâye cümlesinin kamera açısı/sesi vardır. Rota paketi (`/bundle`) servis worker'ın bir rotayı çevrimdışı önbelleğe alması içindir; bulmaca cevabı hiçbir yanıtta yoktur. Yanıtlar `ETag` + `Cache-Control` taşır. Ayrıntı: [`services/api/README.md`](../services/api/README.md), şema: [`docs/api/openapi.json`](api/openapi.json).

Şema v2 (P1) ile değişenler: `kind` artık `site_types` tablosundaki tür kimliğidir (`cami`, `han`, `turbe`, `kulliye` …; liste genişleyebilir), `district` içe aktarılan kayıtlarda `null` olabilir. Rotada `minutes` ve `distance` saklanmaz, yayındaki durak zincirinden hesaplanır (yürüme 4,5 km/sa + durakların anlatım süresi); yeni alan `distanceMeters`. Bearer token gönderilip doğrulanamazsa `401 UNAUTHENTICATED`. Modül sınırları, roller, hata kodları ve makbuz biçimi: [`services/api/CONTRACTS.md`](../services/api/CONTRACTS.md).

## Uygulanan uçlar: istemciyi etkileyen noktalar

Ayrıntı ve gerekçe: [`services/api/CONTRACTS.md`](../services/api/CONTRACTS.md), [BACKEND-DECISIONS](BACKEND-DECISIONS.md).

- **Harita ayarları.** `GET /v1/map-settings` herkese açıktır (oturum gerekmez, önbellekli): `{ modelMinZoom, maxVisibleModels }`. `modelMinZoom` 0–24 arası sayıdır, 3B modeller bu yakınlaştırmadan itibaren yüklenir; `maxVisibleModels` 0–50 tam sayıdır, haritada aynı anda çizilen en çok model, 0 3B'yi kapatır. Yönetim paneli `PUT /v1/admin/map-settings` ile (yalnız `admin`, aynı gövde, `Idempotency-Key`) değiştirir; uygulamalar yeni değeri bir sonraki okumada görür.
- **Medya yükleme.** `POST /v1/media/uploads` hesap başına en çok 10 açık (bekleyen, süresi dolmamış) yükleme tutar; aşılırsa `429 RATE_LIMITED`. Birini tamamlamak ya da süresinin dolmasını beklemek yer açar. Ayrıca `user` rolü kayan 24 saatte en çok 10 yükleme bileti alır (tamamlananlar dahil; personel muaf), aşılırsa yine `429 RATE_LIMITED` (§11.19). Hiçbir anıya bağlanmayan ziyaretçi fotoğrafı 24 saat sonra silinir. Yükleme adresi herkese kapalı bir kovadadır, oradan okunamaz. `POST /v1/media/uploads/:id/complete` dosyayı doğrulayıp herkese açık medya kovasına kopyalar; medyanın `url`'si yükleme adresi değil bu son adrestir. İstemci adresi türetmemeli, yanıttaki `url`'yi kullanmalı. Tamamlanmış ya da süresi dolmuş yükleme adresine yeniden PUT yapılmamalı (dosya sistemi sürücüsünde `409 CONFLICT`; S3'te yazılan dosya yayınlanmaz ve silinir); yükleme sırası: bilet al, PUT, `complete`.
- **Makbuz bozdurma.** `POST /v1/me/receipts` kalem bazında yeni bir ret nedeni döndürebilir: `revealed` (bu hesabın "Cevabı göster" ile açtığı bulmacanın `quiz.correct` makbuzu). İstemci o makbuzu atmalı ve yeniden denememelidir; puan yazılmaz.
- **Anılarım.** `GET /v1/me/memories` ve `POST /v1/memories` yanıtındaki `OwnMemory.siteName` artık `string | null`: eser yayında değilse `null` gelir, istemci yedek metin göstermelidir. Yönetim kuyruğundaki `AdminMemory.siteName` metin olarak kalır.
- **Bildirme.** `POST /v1/memories/:id/report` anıyı artık hemen gizlemez: 201 anının gizlendiği anlamına gelmez. Anı, son onayından sonra 3 farklı kullanıcı bildirene kadar yayında kalır. Aynı kullanıcının tekrarı 200 döner ve sayılmaz; kendi anını bildirmek 403'tür. Kullanıcı başına 24 saatte en çok 5 yeni bildirim kabul edilir, aşılırsa `429 RATE_LIMITED`.
- **Moderasyon kuyruğu.** `GET /v1/admin/memories?status=pending` onaydan sonra bildirilmiş ama hâlâ yayındaki anıları da döndürür (`status: "approved"`, `reportCount` ≥ 1); panel kuyrukta `approved` öğelere hazır olmalı. `reportCount`, onaydan sonraki farklı bildiren sayısıdır (bekleyen/reddedilen anıda tüm bildirimler). `POST /v1/admin/memories/:id/decision` bu bildirilmiş onaylı anıları da kabul eder: `approved` bildirimleri düşürür (anı yayında kalır, yazara ikinci kez puan yazılmaz), `rejected` anıyı yayından kaldırır ve kesindir. Reddedilmiş anıya her karar ve bildirilmemiş onaylı anıyı onaylamak 409.
- **Yayından kaldırma, silme (§11.18).** Moderatör/admin bildirilmemiş onaylı anıyı da `{ status: "rejected", reason }` ile yayından kaldırabilir ("Yayından kaldır"; audit `memory.takedown`). Her ret ve kaldırma fotoğrafı siler: yanıtta `photo: null`, eski `url` artık açılmaz; metin kalır. `DELETE /v1/me/memories/:id` ("Sil", yazar, her durumda) ve `DELETE /v1/admin/memories/:id` ("Kalıcı sil", yalnız admin) anıyı, bildirimlerini ve fotoğrafını kalıcı siler; yanıt `204` gövdesiz, başkasının ya da olmayan anı `404`, admin ucu admin olmayana `403`. Onaylı bir anı herhangi bir yolla kalkınca yazarın 25 puanı bir kez geri alınır; istemci puanı `GET /v1/me/passport`'tan yeniden okumalı.
- **Sağlık uyarısı (§11.21, §11.25).** `GET /v1/admin/health` (moderatör ve admin, `no-store`): `{ pendingStale: { count, oldestPendingSince | null, thresholdHours: 48 }, storage? }`. `pendingStale`, kuyruğa son girişinden beri 48 saatten uzun süredir `pending` olan anıları sayar: gönderimden, bildirimle kuyruğa geri dönen anıda geri dönüş anından; moderatör de görür. `storage` yalnız admin cevabındadır, moderatörde alan hiç yoktur: `{ usedBytes, quotaBytes, percent, level: "ok" | "warn" | "critical", byKind: { photo, model, audio } }`; `percent` bir ondalık, 100'ü geçebilir; `warn` ≥ %80, `critical` ≥ %95; kota `STORAGE_QUOTA_MB` (varsayılan 1024). Panel uyarıyı yalnız `warn`/`critical` ve `pendingStale.count > 0` iken göstermeli.
- **Panel sağlık kutusu (istemci).** `AkarClient.getAdminHealth()` bu ucu `cache: "no-store"` ile okur; demo istemcisi `pendingStale`'i yerel kuyruktan hesaplar, `storage` vermez. Yönetim paneli ucu yalnız moderatör ve admin için, her durum değişikliğinden sonra yeniden okur. Kutu panelin üstündedir: depolama satırı `warn` (sarı) / `critical` (kırmızı) iken, bekleyen satırı "Bekleyenlere git" bağlantısıyla. Okuma başarısız olursa "Panel uyarıları yüklenemedi." yazar.
- **Panel katkı sekmeleri (istemci).** Moderatör ve admin için istemci `GET /v1/admin/memories`'i üç durumla (`pending`, `approved`, `rejected`) paralel okur ve kimliğe göre tekilleştirir (bildirilmiş onaylı anı hem bekleyen hem onaylı listede gelir); `Snapshot.moderationQueue` üçünü taşır, panelin "Bekleyen", "Onaylanan", "Reddedilen" sekmeleri buradan süzer. Önceden yalnız `pending` okunduğu için API kipinde "Onaylanan" ve "Reddedilen" boştu.
- **Anı kotası (§11.19).** `POST /v1/memories`: `user` rolü aynı anda en çok 3 bekleyen anı tutar ve kayan 24 saatte en çok 10 anı gönderir (silinenler dahil); aşılırsa `429 RATE_LIMITED`, Türkçe mesaj gösterilmeli. Personel muaf.
- **Kendi anısına karar.** `POST /v1/admin/memories/:id/decision`'da moderatör kendi anısını karara bağlayamaz (403 `FORBIDDEN`); admin bağlayabilir (§11.17). Panel düğmeleri `Snapshot.role`'e göre gösterilir: moderatör kendi anısında karar düğmelerini görmez (yalnız "Sil"), admin görür; sunucu yine de 403 verir.
- **İstemci komutları (silme, yayından kaldırma).** `dispatch` iki yeni komut alır: `{ type: "delete-memory", id }` (`DELETE /v1/me/memories/:id`) ve `{ type: "admin-delete-memory", id }` (`DELETE /v1/admin/memories/:id`); yayından kaldırma, onaylı anıda var olan `{ type: "moderate", id, status: "rejected", reason }` komutudur. Üçü de ardından kullanıcıyı (puan) ve anı akışını yeniden okur. `Snapshot.role` giriş yapanın rolünü taşır (misafirde `user`); demoda yoktur ve panel tüm işlemleri gösterir.
- **Herkese açık okumalar her kullanımda doğrulanır (§11.24).** Önbellekli uçlar (`/v1/sites…`, `/v1/site-details`, `/v1/routes…`, `/v1/memories`, `/v1/map-settings`, bulmacalar) artık `Cache-Control: public, no-cache` döndürür (önceden `max-age=60, stale-while-revalidate=300`). Tarayıcı yanıtı saklar, her istekte `If-None-Match` ile sorar; değişmediyse `304` (gövde yok). Yayınlama, rota/bulmaca değişikliği ve moderasyon kararı bir sonraki okumada görünür; istemcinin yazmadan sonra `cache: "no-cache"` göndermesine gerek kalmaz (gönderirse zararı yok).
- **Anı akışı.** `GET /v1/memories` herkese açıktır (önbellekli), eser başına istek gerekmez: yayındaki eserlerin onaylı anıları en yeniden eskiye, `{ items, nextCursor }` sayfalama (`limit` en çok 100), öğe `GET /v1/sites/:id/memories` ile aynı `PublicMemory`. İsteğe bağlı daraltma: `siteIds` (virgülle, en çok 100 kimlik) ve `city`. Taslak ya da bilinmeyen eser kimliği hata vermez, yalnız sonuç getirmez; 101 kimlik ya da boş liste `400 VALIDATION_FAILED`.
- **Toplu eser detayı.** `GET /v1/site-details` herkese açıktır (önbellekli): yayındaki eserlerin `GET /v1/sites/:id` ile birebir aynı `SiteDetail`'i, ada göre `{ items, nextCursor }` sayfalama (`limit` en çok 100). Kataloğu açılışta eser başına detay isteği atmadan yüklemek içindir: 100 eserlik bir sayfa tek istektir. Taslaklar hiç görünmez. `GET /v1/sites/:id` tek eserin tazelenmesi için kalır.
- **Editör raporları.** Yalnız `editor`/`admin`, `no-store`, `{ items, nextCursor }` sayfalama. `GET /v1/admin/reports/draft-issues?state=blocked|ready&city=`: yayın eksiği olan (varsayılan) ya da yayına hazır taslaklar; öğe `GET /v1/admin/sites` satırıyla aynıdır, eksikler `issues` içinde yayın kapısının Türkçe metniyle. `GET /v1/admin/reports/locations?state=missing|approximate&city=`: konumu bulunamayan ya da sokak/mahalle merkezi olan taslaklar (aynı satır). `GET /v1/admin/reports/duplicates?city=`: aynı şehirde yalın adı aynı (`Koza Hanı Mescidi` ≈ `Koza Han Mescidi`), en az biri taslak eser grupları; `sameDistrict: true` aynı ilçeyi (tarihi bölge adı ilçeye çevrilir) gösterir, grupta önce yayındakiler gelir. Karar editöründür; rapor hiçbir şeyi değiştirmez.
- **Panel taslakları (§11.22).** `GET /v1/admin/site-details?status=&city=&query=&limit=&cursor=` (`editor`/`admin`, `no-store`) `{ items, nextCursor }` döndürür; her öğe `GET /v1/admin/sites/:id` gövdesiyle aynıdır, sayfa sırası `GET /v1/admin/sites` ile aynıdır. Panel taslakları bununla yükler: 243 taslak `limit=100` ile ~3 istektir (tek tek okumak ~240 olurdu).
- **Panelde taslaklar (istemci, §11.23).** Editör ve admin için `Snapshot.sites` yayındakilere ek olarak taslakları (`status: "draft"`) taşır; kullanıcı ve moderatör taslak isteği atmaz. Konumu olmayan taslak şehrin yayındaki eserlerinin ortasında, türü olmayan taslak "cami" görünür. Kaydetmede iğne taşınmadıysa konum gönderilmez; türü olmayan taslağın türü her kayıtta gönderilir. Taslağı "Yayınla" `POST /v1/admin/sites/:id/publish` çağırır (eksik varsa `422 PUBLISH_BLOCKED`, eksikler `fieldErrors._`); yayındakini taslağa almak `.../unpublish` çağırır ve eser panelde taslak olarak kalır. Her yazmadan sonra eser `GET /v1/admin/sites/:id` ile yeniden okunur.
- **Eserin şehrini değiştirme (§11.26).** `PATCH /v1/admin/sites/:id/info` artık `city` alır: şehir kimliği ya da adı (`"bursa"` / `"Bursa"`, `POST /v1/admin/sites` ile aynı çeviri). Eser kimliği değişmez; ilçe yeni şehirde aranır (yoksa açılır), arama metni ve yinelenme anahtarı yeni şehre göre yazılır. Bilinmeyen şehir ve bir rotada durak olan eser `400 VALIDATION_FAILED` (`fieldErrors.city`, rota adlarıyla), yeni şehirde aynı ad ve ilçe `409 CONFLICT` (`existingSiteId`). Şu anki şehri göndermek taşıma sayılmaz.
- **Panelde tam eser düzenleme (istemci, §11.27).** API kipinde `site` komutu artık hikâye, fotoğraf, kaynak, model ve şehir değişikliklerini de kaydeder (önceden `UnsupportedCommandError`). Yeni fotoğraf ve model data URL olarak verilir; istemci yükler ve cümle/kapak bağlantılarını sunucunun medya kimliğine çevirir. Kaynağın sayfası (`locator`), cümlenin kartı, kamera açısı ve sesi korunur. Yeni modelde vurgulu cümle varsa kayıt, sunucu parça adlarını okuyana kadar birkaç saniye sürebilir.
- **Panelde yeni eser ve yeni rota (istemci, §11.29).** "Yeni eser" ve "Yeni rota" API kipinde sunucuda kayıt açar (`POST /v1/admin/sites`, `POST /v1/admin/routes`); kimliği sunucu üretir, istemci panelin kimliğini eşler (düzenleyicide ikinci kayıt aynı kaydı günceller). Yeni rotanın şehri ilk durağından gelir; durağı olmayan yeni rota "en az bir durak seç" mesajıyla reddedilir. Editör ve admin taslak rotaları da görür; ziyaretçi görmez. Rota silme hâlâ yok: taslağa almak yayından kaldırır.
- **Hız sınırı.** Oturum açıkken sınır hesap başınadır, misafirde IP başınadır (dakikada 300). Yük dengeleyici arkasında `TRUST_PROXY` ayarlanmalıdır ([`services/api/README.md`](../services/api/README.md)).

## Örnek hata sözleşmesi

```json
{
  "error": {
    "code": "OUTSIDE_VISIT_AREA",
    "message": "Ziyareti doğrulamak için esere yaklaşmalısın.",
    "fieldErrors": {},
    "requestId": "request-id"
  }
}
```

Yükleniyor, offline, yetkisiz, bulunamadı, validation, sunucu hatası ve rate-limit durumları ayrıştırılmalı. Frontend sorguları iptal edilebilir olmalı; fotoğraflar JSON/localStorage yerine medya servisine gönderilmeli.

## Sponsor veri dönüşümü

Ham dosyalar → normalize edilmiş eser → kaynak kayıtları → hikâye bölümleri → editör kontrolü → yayın.

Üretimde ek alanlar: `sourceId`, kaynak URL/kurum/tarih/lisans; `mediaId`, MIME, alt metin, ses transcript'i; `trust`; `updatedAt`; `locale`; `geofence`; medya ilişkileri. Temsili, çıkarım ve doğrulanmış bilgiyi aynı etikette eritmeyin. Geriye uyumlu `source` özeti korunur; güncel mock ayrı `SiteSource`, `SitePhoto` ve `SiteModel` kayıtlarını da taşır. Üretimde bu ilişkiler kalıcı kaynak/medya kimliklerine çevrilmelidir.

## Entegrasyon sırası

1. Site/route okuma ve normalize etme.
2. Auth/session ve kullanıcıya özel kayıtlar.
3. Hikâye/bulmaca sonuçları ve puanlar.
4. Anı upload, moderasyon ve yaşayan hafıza.
5. Konum doğrulama ve ziyaret pasaportu.
6. Admin rolü, editör güncellemeleri, içerik sürümleri.

Gerçek auth bağlanana kadar demo paneli erişilebilir kalır. Deploy edilecek gerçek uygulamada admin API'si sunucu rol kontrolü olmadan açılamaz. Aynı adaptör Expo'da kullanılabilir; yalnızca storage/session, dosya ve konum sağlayıcıları native karşılıklarla değişir.
