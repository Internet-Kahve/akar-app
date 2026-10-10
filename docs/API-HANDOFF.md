# Frontend / Backend handoff

Bu belge ekip için önerilen sözleşmedir; mevcut backend uygulamasını tarif etmez.

## Bugünkü sınır

UI yalnızca `AkarClient.getSnapshot()`, `dispatch(command)` ve `reset()` çağırır. Mock adaptör localStorage kullanır. Domain modelleri `packages/domain/src/index.ts` içindedir. `createMockClient` yerine HTTP adaptörü enjekte edildiğinde ekranlar korunabilir; snapshot'ın endpoint yanıtlarından birleştirilmesi adaptörün sorumluluğudur. Bu henüz yazılmış bir HTTP istemcisi değildir.

`reset()` yalnızca demo içindir; üretim API'sine otomatik çevrilmemelidir. Frontend iş kuralları güvenlik sınırı değildir. Üretimde puan, rol, onay, cevap kontrolü ve ziyaret doğrulaması sunucuda yapılmalıdır.

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

Üretimde ek alanlar: `sourceId`, kaynak URL/kurum/tarih/lisans; `mediaId`, MIME, alt metin, ses transcript'i; `trust`; `updatedAt`; `locale`; `geofence`; medya ilişkileri. Temsili, çıkarım ve doğrulanmış bilgiyi aynı etikette eritmeyin. Mevcut mock `source` bir metindir; gerçek veri aktarımında ayrı Source/Media varlıklarına ayrılmalıdır.

## Entegrasyon sırası

1. Site/route okuma ve normalize etme.
2. Auth/session ve kullanıcıya özel kayıtlar.
3. Hikâye/bulmaca sonuçları ve puanlar.
4. Anı upload, moderasyon ve yaşayan hafıza.
5. Konum doğrulama ve ziyaret pasaportu.
6. Admin rolü, editör güncellemeleri, içerik sürümleri.

Gerçek auth bağlanana kadar demo paneli erişilebilir kalır. Deploy edilecek gerçek uygulamada admin API'si sunucu rol kontrolü olmadan açılamaz. Aynı adaptör Expo'da kullanılabilir; yalnızca storage/session, dosya ve konum sağlayıcıları native karşılıklarla değişir.
