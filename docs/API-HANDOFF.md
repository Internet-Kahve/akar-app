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
| `POST/PATCH /v1/admin/sites`                         | Yetkili içerik ekleme/düzenleme                                               |
| `GET /v1/admin/memories?status=pending`              | Moderasyon kuyruğu                                                            |
| `POST /v1/admin/memories/:id/decision`               | Onay veya nedenli ret; audit kaydı ve idempotent puan                         |

Mutasyonlarda `Idempotency-Key` önerilir. Toggle yerine PUT/DELETE gibi istenen durumu açıkça ifade eden işlemler kullanılmalı. Demo `Snapshot.points` değeri üretim için güvenilir sayılmaz.

## Uygulanan okuma uçları (P2)

`GET /v1/sites`, `GET /v1/sites/:id`, `GET /v1/cities`, `GET /v1/lookups`, `GET /v1/routes`, `GET /v1/routes/:id`, `GET /v1/routes/:id/bundle` `services/api` içinde çalışır; yalnızca yayındaki içerik döner. Liste yanıtı `{ items, nextCursor }` (keyset imleç, `limit` ≤ 100); bozuk imleç `400 INVALID_CURSOR`, bozuk `bbox`/`near`/`has` `400 VALIDATION_FAILED`. Eser listesi şehir, tür, vakıf rolü kategorisi (`category`), dönem (`period`), içerik (`has=model,audio,history`) ile süzülür, `near` + `sort=distance` ile mesafeye göre sıralanır. Detayda bölümler, kartlar, Geçmişi Gör görselleri ve hikâye cümlesinin kamera açısı/sesi vardır. Rota paketi (`/bundle`) servis worker'ın bir rotayı çevrimdışı önbelleğe alması içindir; bulmaca cevabı hiçbir yanıtta yoktur. Yanıtlar `ETag` + `Cache-Control` taşır. Ayrıntı: [`services/api/README.md`](../services/api/README.md), şema: [`docs/api/openapi.json`](api/openapi.json).

Şema v2 (P1) ile değişenler: `kind` artık `site_types` tablosundaki tür kimliğidir (`cami`, `han`, `turbe`, `kulliye` …; liste genişleyebilir), `district` içe aktarılan kayıtlarda `null` olabilir. Rotada `minutes` ve `distance` saklanmaz, yayındaki durak zincirinden hesaplanır (yürüme 4,5 km/sa + durakların anlatım süresi); yeni alan `distanceMeters`. Bearer token gönderilip doğrulanamazsa `401 UNAUTHENTICATED`. Modül sınırları, roller, hata kodları ve makbuz biçimi: [`services/api/CONTRACTS.md`](../services/api/CONTRACTS.md).

## Uygulanan uçlar: istemciyi etkileyen noktalar

Ayrıntı ve gerekçe: [`services/api/CONTRACTS.md`](../services/api/CONTRACTS.md), [BACKEND-DECISIONS](BACKEND-DECISIONS.md).

- **Harita ayarları.** `GET /v1/map-settings` herkese açıktır (oturum gerekmez, önbellekli): `{ modelMinZoom, maxVisibleModels }`. `modelMinZoom` 0–24 arası sayıdır, 3B modeller bu yakınlaştırmadan itibaren yüklenir; `maxVisibleModels` 0–50 tam sayıdır, haritada aynı anda çizilen en çok model, 0 3B'yi kapatır. Yönetim paneli `PUT /v1/admin/map-settings` ile (yalnız `admin`, aynı gövde, `Idempotency-Key`) değiştirir; uygulamalar en geç bir dakika içinde yeni değeri görür.
- **Medya yükleme.** `POST /v1/media/uploads` hesap başına en çok 10 açık (bekleyen, süresi dolmamış) yükleme tutar; aşılırsa `429 RATE_LIMITED`. Birini tamamlamak ya da süresinin dolmasını beklemek yer açar. Yükleme adresi herkese kapalı bir kovadadır, oradan okunamaz. `POST /v1/media/uploads/:id/complete` dosyayı doğrulayıp herkese açık medya kovasına kopyalar; medyanın `url`'si yükleme adresi değil bu son adrestir. İstemci adresi türetmemeli, yanıttaki `url`'yi kullanmalı. Tamamlanmış ya da süresi dolmuş yükleme adresine yeniden PUT yapılmamalı (dosya sistemi sürücüsünde `409 CONFLICT`; S3'te yazılan dosya yayınlanmaz ve silinir); yükleme sırası: bilet al, PUT, `complete`.
- **Makbuz bozdurma.** `POST /v1/me/receipts` kalem bazında yeni bir ret nedeni döndürebilir: `revealed` (bu hesabın "Cevabı göster" ile açtığı bulmacanın `quiz.correct` makbuzu). İstemci o makbuzu atmalı ve yeniden denememelidir; puan yazılmaz.
- **Anılarım.** `GET /v1/me/memories` ve `POST /v1/memories` yanıtındaki `OwnMemory.siteName` artık `string | null`: eser yayında değilse `null` gelir, istemci yedek metin göstermelidir. Yönetim kuyruğundaki `AdminMemory.siteName` metin olarak kalır.
- **Bildirme.** `POST /v1/memories/:id/report` anıyı artık hemen gizlemez: 201 anının gizlendiği anlamına gelmez. Anı, son onayından sonra 3 farklı kullanıcı bildirene kadar yayında kalır. Aynı kullanıcının tekrarı 200 döner ve sayılmaz; kendi anını bildirmek 403'tür. Kullanıcı başına 24 saatte en çok 5 yeni bildirim kabul edilir, aşılırsa `429 RATE_LIMITED`.
- **Moderasyon kuyruğu.** `GET /v1/admin/memories?status=pending` onaydan sonra bildirilmiş ama hâlâ yayındaki anıları da döndürür (`status: "approved"`, `reportCount` ≥ 1); panel kuyrukta `approved` öğelere hazır olmalı. `reportCount`, onaydan sonraki farklı bildiren sayısıdır (bekleyen/reddedilen anıda tüm bildirimler). `POST /v1/admin/memories/:id/decision` bu bildirilmiş onaylı anıları da kabul eder: `approved` bildirimleri düşürür (anı yayında kalır, yazara ikinci kez puan yazılmaz), `rejected` anıyı yayından kaldırır ve kesindir. Bildirilmemiş onaylı anı ve reddedilmiş anı hâlâ 409.
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
