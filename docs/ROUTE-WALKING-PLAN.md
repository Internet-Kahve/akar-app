# Rotalarda yürüme yolu ve "Haritada aç" planı

Durum: öneri, ekip görüşü bekleniyor (28 Ekim 2026). Onaylanırsa uygulama ayrı PR'larla yapılır; sıra aşağıda.

## Sorun

Haritada rota, duraklar arasında kesikli **düz çizgi** olarak çizilir (`apps/web/src/components/heritage-map.tsx`, `route` katmanı). Çizgi binaların ve sokakların üzerinden geçer; ziyaretçi yürüyeceği yolu, mesafeyi ve süreyi göremez. Uygulama içinde yol tarifi de yoktur. Bugünkü hâliyle rota haritası yol göstermez.

## Öneri

İki küçük parça; uygulama içinde canlı navigasyon yapılmaz.

1. **Yürüme yolu bir kez hesaplanır ve saklanır.** Yönetici panelde bir rotayı kaydettiğinde ya da yayımladığında API, ardışık her durak çifti için bir yönlendirme servisinden yürüme yolunu ister. Gelen çizgi, metre ve dakika rotayla birlikte veritabanına yazılır. Harita düz çizgi yerine bu yolu çizer; rota ve durak kartları "~10 dk · 0,8 km" gibi süreyi buradan gösterir.
2. **"Haritada aç" düğmesi, durak durak.** Rota modunda "Sonraki durak: X" yanında bir düğme, ziyaretçinin bulunduğu yerden o durağa yürüme tarifini telefonun harita uygulamasında açar. Adım adım tarif, konum takibi, yeniden yönlendirme ve sesli anlatım Google Haritalar / Apple Haritalar'a kalır; ziyaretçiler bu uygulamaları zaten tanır.

Ziyaretçinin telefonu yönlendirme servisini hiç çağırmaz; çizgi bizim API'mizden, rota verisiyle gelir.

## Yönlendirme servisi

Yönlendirme motorunu biz barındırmayız. API (Vercel `akar-api`) rota kaydında dış servise bacak başına bir HTTPS isteği atar; uzun süren iş yoktur, sunucusuz ortama uyar.

| Seçenek | Barındıran | Maliyet / kurulum | Uygunluk |
| --- | --- | --- | --- |
| **openrouteservice** (önerilen) | servis | Ücretsiz anahtar, günde yaklaşık 2000 yön isteği; hesabı ekipten biri açar | Uygulama kullanımına izinli. Bir kayıt (durak − 1) istek: 10 duraklı rota 9 istek. |
| Herkese açık OSRM demo sunucusu | servis | Anahtar yok; kullanım kuralı üretim kullanımına izin vermez | Yalnız tek seferlik deneme ve mevcut rotaların ilk hesabı için |
| Kendi OSRM / Valhalla sunucumuz (Bursa OSM kesiti) | biz | Sürekli açık yeni bir servis, OSM verisi güncellemesi; Vercel'de çalışmaz | Birkaç rota için gereksiz |

Anahtar `akar-api` ortam değişkenine (`ROUTING_API_KEY`) girer; Vercel projesi Tamer'in olduğu için o ekler. Anahtar yoksa ya da servis cevap vermezse rota yine kaydedilir ve düz çizgi kalır; yerel geliştirme ve CI anahtarsız çalışır. Bir sonraki kayıt (ya da paneldeki "Yolu yeniden hesapla") eksik bacakları tamamlar.

Not: Ücretsiz planın dakikalık sınırı da vardır (kayıt sırasında kontrol edilecek); tek rota kaydı bu sınırın çok altındadır.

## Veri ve API (taslak)

- `route_stops` satırına bir sonraki durağa giden bacak: `leg_geometry` (GeoJSON LineString), `leg_meters`, `leg_seconds`, `leg_computed_at`; boşsa düz çizgi. Migration canlı projeye (`akar-demo-frankfurt`) PR birleştirilmeden önce uygulanır.
- Rota oluşturma / güncelleme / durak değişikliği: değişen bacaklar yeniden hesaplanır. Bir eserin konumu panelde değişirse o eseri içeren rotaların bacakları da yeniden hesaplanır.
- `GET /v1/routes` ve `/v1/routes/:id` cevabında durak başına `leg` (çizgi, metre, saniye) ve rotanın toplam metre/saniyesi. OpenAPI, `CONTRACTS.md`, `API-HANDOFF.md` güncellenir.
- Mevcut 3 rota için tek seferlik hesap betiği (`npm run` komutu), canlıda bir kez çalıştırılır.

## Web (taslak)

- `route` katmanı, varsa bacak çizgilerini, yoksa düz çizgiyi çizer (düz çizgi kesikli kalır, gerçek yol düz çizgiyle ayrışır).
- Rota modunda "Haritada aç": Google bağlantısı `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>&travelmode=walking` (Android, iOS ve masaüstü; uygulama yüklüyse onu açar); iPhone'da Apple bağlantısı `https://maps.apple.com/?daddr=<lat>,<lng>&dirflg=w` seçeneği. Konum izni bizim uygulamada istenmez.
- Ziyaretçi geri döndüğünde rota modu aynı durakta kalır (bugünkü davranış; uygulamada denetlenecek).

## Kapsam dışı

- Uygulama içi adım adım navigasyon, sürekli konum takibi, rotadan sapma uyarısı.
- **"Rotam"** (ziyaretçinin kendi listesi): sırası ziyaretçide değiştiği için kayıtta önceden hesaplanamaz. İlk sürümde düz çizgi kalır; "Haritada aç" düğmesi orada da çalışır (hesap gerekmez).
- Trafik ve araç rotaları.

## Riskler

- Hanlar bölgesi ve Kapalıçarşı içindeki geçitler OSM'de eksik ya da "özel" işaretli olabilir; servis yolu dışarıdan dolaştırabilir. Uygulamadan önce mevcut 3 rota OSRM demo sunucusuyla bir kez denenir, çizgiler haritada kontrol edilir. Kötü çıkan bacak için ileride panelde "düz çizgi kullan" seçeneği düşünülebilir.
- Her bacak ayrı tarif olduğu için ziyaretçi her durakta uygulamadan çıkar ve geri döner; çoklu durak bağlantısı (Google en çok ~9 ara nokta) bilinçli olarak kullanılmaz, çünkü her durakta hikâye dinlenir.

## Uygulama sırası (onaylanırsa)

1. Mevcut 3 rotayla OSRM demo denemesi (kod yok), sonuç bu PR'a yorum olarak.
2. openrouteservice hesabı ve anahtar; Tamer `ROUTING_API_KEY`'i `akar-api`'ye ekler.
3. API PR: migration, kayıtta hesap, okuma cevabı, ilk hesap betiği.
4. Web PR: gerçek yol çizimi, bacak süreleri, "Haritada aç".

## Ekibe sorular

1. Durak durak "Haritada aç" mı, yoksa ayrıca bütün rota için tek bağlantı da olsun mu?
2. Yalnız Google bağlantısı mı, iPhone'da Apple Haritalar seçeneği de mi?
3. openrouteservice hesabını kim açar?
4. Tasarım: düğmenin yeri ve adı ("Haritada aç" / "Yol tarifi"), bacak süresinin kartta gösterimi Figma'ya eklenecek mi?
