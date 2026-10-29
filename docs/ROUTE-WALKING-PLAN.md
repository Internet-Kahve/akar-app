# Rotalarda yürüme yolu ve "Haritada aç" planı

Durum: 29 Ekim 2026 inceleme notları işlenmiş uygulama önerisi. Belgenin main’e alınması servis hesabı, anahtar, canlı veri değişikliği veya uygulamanın tamamlandığı anlamına gelmez. Servis sorumlusu ve saha doğrulaması netleştikten sonra uygulama ayrı PR’larla yapılır.

## Sorun

Haritada rota, duraklar arasında kesikli **düz çizgi** olarak çizilir (`apps/web/src/components/heritage-map.tsx`, `route` katmanı). Çizgi binaların ve sokakların üzerinden geçer; ziyaretçi yürüyeceği yolu, mesafeyi ve süreyi göremez. Uygulama içinde yol tarifi de yoktur. Bugünkü hâliyle rota haritası yol göstermez.

## Öneri

İki küçük parça; uygulama içinde canlı navigasyon yapılmaz.

1. **Yürüme yolu bir kez hesaplanır ve saklanır.** Yönetici panelde bir rotayı kaydettiğinde ya da yayımladığında API, ardışık her durak çifti için bir yönlendirme servisinden yürüme yolunu ister. Gelen çizgi, metre ve dakika rotayla birlikte veritabanına yazılır. Harita düz çizgi yerine bu yolu çizer; rota ve durak kartları "~10 dk · 0,8 km" gibi süreyi buradan gösterir.
2. **"Haritada aç" düğmesi, durak durak.** Rota modunda "Sonraki durak: X" yanında bir düğme, ziyaretçinin bulunduğu yerden o durağa yürüme tarifini telefonun harita uygulamasında açar. Adım adım tarif, konum takibi, yeniden yönlendirme ve sesli anlatım Google Haritalar / Apple Haritalar'a kalır; ziyaretçiler bu uygulamaları zaten tanır.

Ziyaretçinin telefonu yönlendirme servisini hiç çağırmaz; çizgi bizim API'mizden, rota verisiyle gelir.

## Yönlendirme servisi

Yönlendirme motorunu biz barındırmayız. API (Vercel `akar-api`) rota kaydında dış servise bacak başına bir HTTPS isteği atar; istekler aşağıdaki süre ve çağrı bütçesiyle sınırlandırılır. Dış servis gecikmesi rota kaydını veya veritabanı kilidini bekletmez.

| Seçenek                                            | Barındıran | Maliyet / kurulum                                                                                            | Uygunluk                                                                                                                                                                                                                                                                                         |
| -------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **openrouteservice** (önerilen)                    | servis     | Anahtar gerekir; seçilen hesabın güncel kota ve kullanım koşulları uygulama öncesinde doğrulanır             | `foot-walking` profili; bir kayıt için yalnız değişen bacaklar hesaplanır. [Directions belgesi](https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/), [istek sınırları](https://openrouteservice.org/restrictions/).                                                |
| FOSSGIS OSRM yaya servisi                          | FOSSGIS    | Anahtarsız; tanımlayıcı User-Agent, atıf ve harita düzeltme bağlantısı, en çok 1 istek/sn; ağır kullanım yok | `https://routing.openstreetmap.de/routed-foot`; tek seferlik karşılaştırma. Genel OSRM otomobil demosu yaya testi yerine kullanılamaz. [İşletmeci koşulları](https://routing.openstreetmap.de/about.html), [profil yapılandırması](https://github.com/Project-OSRM/osrm-frontend#configuration). |
| Kendi OSRM / Valhalla sunucumuz (Bursa OSM kesiti) | biz        | Sürekli açık yeni servis ve OSM verisi bakımı gerekir                                                        | Bu ilk sürümün kapsamı dışında.                                                                                                                                                                                                                                                                  |

Anahtar `akar-api` ortam değişkenine (`ROUTING_API_KEY`) girer; Vercel projesi Tamer'in olduğu için o ekler. Anahtar yoksa ya da servis cevap vermezse rota yine kaydedilir ve düz çizgi kalır; yerel geliştirme ve CI anahtarsız çalışır. Bir sonraki kayıt (ya da paneldeki "Yolu yeniden hesapla") eksik bacakları tamamlar.

### Süre ve istek bütçesi (uygulama için öneri)

- İlk sürümde en çok 10 durak; sınır aşılıyorsa açık doğrulama hatası. Bir rota en çok 9 yeni bacak hesabı üretir. Günlük/dakikalık bütçe bütün rota kayıtları ve konum değişiklikleri için ortak izlenir; kota aşıldığında yeni çağrı başlatılmaz.
- Bir hesap turu toplam 20 saniye, tek dış istek en çok 5 saniye; tur başına en çok 2 ek deneme. 429 yanıtında `Retry-After` bütçeye sığmıyorsa beklemek yerine eksik sonuç kaydedilir; 4xx doğrulama hatası tekrar denenmez. Timeout/5xx yalnız kalan bütçe içinde tekrar denenir. Süre dolunca kalan bacaklar hesaplanmamış kalır ve panelde yeniden hesaplanabilir.
- Önce rota değişikliği kısa bir işlemle kaydedilir, dış hesap işlem dışında yapılır. Sonuç, hesap başındaki rota sürümü ve durak özeti hâlâ eşleşiyorsa kısa ikinci işlemle yazılır. Eski hesabın daha yeni kaydı ezmesine izin verilmez. Bir eser çok sayıda rotadaysa her rotayı aynı HTTP isteğinde hesaplamak yerine geçersizleştirip kontrollü yeniden hesaplama gerekir.

## Veri ve API (taslak)

- `route_stops` satırına bir sonraki durağa giden bacak: `leg_geometry` (GeoJSON LineString), `leg_meters`, `leg_seconds`, `leg_computed_at`; boşsa düz çizgi. Migration canlı projeye (`akar-demo-frankfurt`) PR birleştirilmeden önce uygulanır.
- Rota oluşturma / güncelleme / durak değişikliği: değişen bacaklar yeniden hesaplanır. Bir eserin konumu panelde değişirse o eseri içeren rotaların bacakları da yeniden hesaplanır.
- Her bacak; başlangıç/bitiş eser kimlikleri, iki koordinat, sağlayıcı ve profil ile eşleşir. Durak sırası veya konumu değişince eski çizgi geçersizleşir; hata durumunda yeni duraklarla birlikte eski çizgi gösterilmez. Değişmeyen bacaklar yeniden kullanılabilir.
- `GET /v1/routes` ve `/v1/routes/:id` cevabında durak başına `leg` (çizgi, metre, saniye) ve rota hesabı için `complete / partial / unavailable` durumu bulunur. Toplam yürüme süresi/mesafesi yalnız bütün bacaklar hesaplandıysa verilir; kısmi sonuç tam rota toplamı gibi sunulmaz. Hikâye/ziyaret süresi ayrı kalır. OpenAPI, `CONTRACTS.md`, `API-HANDOFF.md` güncellenir.
- Mevcut 3 rota için tek seferlik hesap betiği (`npm run` komutu), canlıda bir kez çalıştırılır.

## Web (taslak)

- `route` katmanı yalnız güncel duraklarla eşleşen bacak çizgilerini çizer. Hesaplanmamış bacak kesikli ve “Şematik bağlantı; yürüme yolu hesaplanamadı” açıklamasıyla gösterilir; bu bacak için tahmini yürüyüş süresi üretilmez.
- Rota modunda "Haritada aç": Google bağlantısı `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>&travelmode=walking` (Android, iOS ve masaüstü; uygulama yüklüyse onu açar); iPhone’da Apple Haritalar seçeneği de sunulur; bağlantı biçimi uygulama sırasında [güncel Apple belgesi](https://developer.apple.com/documentation/mapkit/unified-map-urls) ve gerçek cihazla doğrulanır. Google biçimi için [Maps URLs](https://developers.google.com/maps/documentation/urls/get-started) kullanılır. Konum izni bizim uygulamada istenmez.
- Ziyaretçi geri döndüğünde rota modu aynı durakta kalır (bugünkü davranış; uygulamada denetlenecek).

## Kapsam dışı

- Uygulama içi adım adım navigasyon, sürekli konum takibi, rotadan sapma uyarısı.
- **"Rotam"** (ziyaretçinin kendi listesi): sırası ziyaretçide değiştiği için kayıtta önceden hesaplanamaz. İlk sürümde düz çizgi kalır; "Haritada aç" düğmesi orada da çalışır (hesap gerekmez).
- Trafik ve araç rotaları.

## Riskler

- Hanlar bölgesi ve Kapalıçarşı içindeki geçitler OSM'de eksik ya da "özel" işaretli olabilir; servis yolu dışarıdan dolaştırabilir. Uygulamadan önce mevcut rotalar FOSSGIS `routed-foot` ile karşılaştırılır ve kullanılacak ORS `foot-walking` servisiyle ayrıca doğrulanır; farklı motorun sonucu üretim kabul testi yerine geçmez. Geçitler haritada ve sahada kontrol edilir. Kötü çıkan bacak için ileride panelde "düz çizgi kullan" seçeneği düşünülebilir.
- Her bacak ayrı tarif olduğu için ziyaretçi her durakta uygulamadan çıkar ve geri döner; çoklu durak bağlantısı bilinçli olarak kullanılmaz, çünkü her durakta hikâye dinlenir.

## Uygulama sırası (onaylanırsa)

1. Mevcut rotalarla yaya profili denemesi ve saha kontrolü; sonuç tarihli doğrulama kaydına eklenir. Bu belge güncellemesinde dış servisle rota hesabı yapılmadı.
2. Servis hesabının sorumlusu ve güncel kota/atıf koşulları netleşir; ORS yaya sonuçları doğrulanır. Ardından `ROUTING_API_KEY` ilgili API ortamına eklenir.
3. API PR: migration, kayıtta hesap, okuma cevabı, ilk hesap betiği.
4. Web PR: gerçek yol çizimi, bacak süreleri, "Haritada aç".

## Kabul testleri

- Eksik anahtar, bulunamayan yol, 429, timeout ve bozuk yanıt rota kaydını bozmaz; durum ve şematik bacak açıkça görünür.
- Bir bacak eksikken tam toplam gösterilmez. Hikâye süresi ile yürüme süresi karışmaz.
- Değişmeyen kayıt dış çağrı üretmez. Sıra/konum değişikliği yalnız etkilenen bacakları geçersizleştirir; geciken eski yanıt yeni sürümü ezemez.
- Durak ve çağrı sınırı, toplam timeout ve sınırlı tekrar denemesi sahte servisle test edilir; CI gerçek anahtar kullanmaz.
- Google/Apple bağlantısı hedef durağa gider, uygulamaya dönünce seçilen durak korunur; Android, iPhone ve masaüstünde kontrol edilir.

## Uygulamadan önce kalan kararlar

- Servis hesabının sahibi, anahtar yönetimi ve kota takibinin sorumlusu.
- Hanlar / Kapalıçarşı geçitlerinin saha doğrulaması ve ORS sonucunun kabulü.
- “Haritada aç” düğmesinin ve ayrı yürüme süresinin tasarımdaki yeri. İlk sürüm önerisi durak başına Google bağlantısı ve iPhone’da Apple seçeneğidir.
