# Akar geliştirme yol haritası

> Tarihli plan/inceleme kaydıdır; güncel kurulum ve canlı özellikler için [doküman rehberini](README.md) kullan. Aşağıdaki durumlar yazıldıkları tarihe aittir.

10 Ekim 2026 · İnternet Kahve

## Kararlar

1. Uygulama adı Akar; KATMAN eski PRD'nin çalışma adıdır.
2. Güncel Figma tasarımı ürün akışlarının ana referansıdır. Eski PRD destekleyici kaynaktır; belgedeki bütün fikirler bu sürümün zorunlu kapsamı değildir.
3. İlk hedef web üzerinde bir bölgede uçtan uca çalışan frontend. Tophane demo bölgesidir; gerçek sponsor verisi geldiğinde değiştirilebilir.
4. Web: Next.js 16 + React 19 + TypeScript. Mobil: sonraki aşamada Expo / React Native. Domain, servis ve token paketleri paylaşılır; web ve native arayüzleri platformlarına göre geliştirilir.
5. Gerçek model veya medya olmadığı için 3D, arşiv fotoğrafı ve kayıtlı rehber ilk teslimi engellemez. Bunların yerleri ve eksik veri durumları açıkça gösterilir.
6. İlk sürümde backend geliştirilmez. Veri ve iş kuralları değiştirilebilir bir mock adaptörde tutulur.

## Neden tek React Native arayüzüyle başlamadık?

Expo web geliştirmeyi destekliyor. Ancak bu ürünün şu anki ağırlığı masaüstü harita, yönetim tablosu, klavye erişimi ve geniş paneller. Webde semantik HTML/CSS kullanmak bu akışların doğrudan uygulanmasını sağlar. Daha sonra native kamera, konum, offline ve bildirim ihtiyaçları Expo içinde karşılanır.

Paylaşılacak kod: veri modelleri, API istemcisi, doğrulama, puan/rota kuralları, tasarım tokenları. Ayrı kalacak kod: harita motoru, navigasyon, UI, dosya seçici, ses ve izin akışları. Web ekranlarının otomatik native'e dönüşeceği varsayılmıyor.

Teknik kaynaklar: [Expo monorepo rehberi](https://docs.expo.dev/guides/monorepos/), [Expo web desteği](https://docs.expo.dev/workflow/web/), [Next.js kurulumu](https://nextjs.org/docs/app/getting-started/installation). Bunlar ayrı uygulama ve ortak paket yaklaşımının araç desteğini açıklar; mimari seçimi Akar'ın ihtiyaçlarına göre verilmiştir.

## Aşama 0 — Bu teslim

- [x] Figma masaüstü ekranları, tasarım sistemi ve iki PDF'nin incelenmesi.
- [x] Çini renk paleti, Inter, ortak bileşenler ve responsive arayüz.
- [x] 6 örnek eser ve 3 rota; tarayıcıda etkileşimli harita.
- [x] Arama, filtre, favori, rota ve eser detayları.
- [x] Bölümlü anlatım, sade metin, cihaz sesi, temsili vakıf akışı.
- [x] Demo check-in, bulmaca, puan/rozet ilerlemesi.
- [x] Anı/fotoğraf, pending → approved/rejected, yaşayan hafıza.
- [x] Eser ve hikâye ekleme/düzenleme demo paneli.
- [x] Geçmişi Gör karşılaştırma etkileşimi; eksik medya durumu.
- [x] Mock servis ve backend handoff dokümanı.
- [ ] Gerçek sponsor içeriği ve medya.
- [ ] Gerçek auth, sunucu moderasyonu, konum doğrulama.
- [ ] Gerçek 3D ve çok kullanıcılı Birlikte Gez.

## Finale kadar önerilen plan

Şartnamenin 7. sayfasındaki 7–8 Kasım 2026 final tarihine göre hazırlanmıştır. Organizasyonun sonraki bildirimleri takvimi değiştirebilir. Aşağıdaki tarihler ekibe önerilen geliştirme planıdır, organizasyon teslimleri değildir.

| Tarih         | Frontend işi                                                                             | Ekip bağımlılığı                                     | Çıkış ölçütü                                                   |
| ------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------- |
| 10–17 Ekim    | Mock MVP'yi ekipçe gezme; kapsam ve ekran geri bildirimleri; veri şeması                 | Backend endpoint taslağı, sponsor veri paketi örneği | Tek bölgede harita → hikâye → anı → moderasyon → profil demosu |
| 18–24 Ekim    | Gerçek API adaptörü, auth ve izin durumları, yükleniyor/hata/boş durumları               | Auth kararı, OpenAPI, CORS, medya URL'leri           | Frontend ile API'nin ana akışlarda çalışması                   |
| 25–31 Ekim    | Doğrulanmış içerik, gerçek ses, bir Hero eser, geçmiş karşılaştırma; gerekirse 3D deneyi | Kaynaklı hikâyeler, lisanslı fotoğraf/ses/model      | Bir eserde kaliteli ve kaynakları görünen deneyim              |
| 1–5 Kasım     | Mobil web cihaz testleri, klavye/kontrast, hata toparlama, demo senaryosu                | Gerçek veri ve stabil API                            | Baştan sona güvenilir canlı demo                               |
| 6 Kasım       | İçerik/kod dondurma, yedek demo, sunum provası                                           | Tüm ekip                                             | Kritik yolların son doğrulaması                                |
| 7–8 Kasım     | Şartnamedeki fiziki final; organizasyon akışına uyum                                     | Resmî final duyuruları                               | Ekip tarafından canlı ürün gösterimi                           |
| Final sonrası | Expo uygulaması; konum/kamera, offline rehber ve bildirimler                             | Backend ve mobil ürün kapsamı                        | Aynı domain/API ile native deneyim                             |

## Şartnameye göre öncelik

| Şartname                                         | Bu frontend'deki karşılığı                                    | Final öncesi eksik                              |
| ------------------------------------------------ | ------------------------------------------------------------- | ----------------------------------------------- |
| 5.1.1 birden fazla eser, içerik ekleme/düzenleme | Eser haritası, liste, yönetim paneli                          | Gerçek veri ve sunucu kalıcılığı                |
| 5.1.2 genişletilebilir mimari                    | Paylaşılan paketler, site/story/route modelleri               | Ölçek ve üretim servis kararı                   |
| 5.1.3 kaynak ve içerik doğruluğu                 | Kaynak paneli, temsili etiketleri, moderasyon                 | Sponsor kaynaklarının doğrulanması ve içerik QA |
| 5.1.4 erişilebilirlik                            | Semantik HTML, klavye, modal odağı, sade metin, ses, kontrast | Gerçek cihaz ve ekran okuyucu turu              |
| 5.1.5 test, doğrulama, kod kalitesi              | TypeScript, iş kuralı testleri, Playwright akışları           | Gerçek API güvenlik/entegrasyon testleri        |
| 5.4 canlı demo                                   | Tek bölgede uçtan uca çalışan akış                            | Sunum süresi/formatı organizasyondan bekleniyor |

AR, 3D, ödül mağazası ve leaderboard şartnamedeki zorunlu MVP listesinde bulunmuyor. AR bir örnek çalışma alanı. Güncel Figma'daki çekirdeği tamamlamak için eski PRD'deki Harca, geniş puan ekonomisi ve sezon leaderboard'u bu teslimde eklenmedi.

## 3D için karar kapısı

Önce 2D harita + bir Hero eser üzerinde anlatımın işe yaradığını doğrula. Ardından lisansı ve georeferansı belli model bulunduğunda 2–3 günlük bir teknik deneme yap: MapLibre özel katmanı veya eser detayında ayrı glTF sahnesi, yükleme süresi, düşük donanımlı Android tarayıcıda bellek/FPS, klavye ile eşdeğer metin akışı. Model yoksa temsili görünüm kalır; “gerçek rekonstrüksiyon” olarak adlandırılmaz. Haritayı eğmek 3D bina verisi sağlamaz.

## Ekipten sıradaki girdiler

- Sponsor paketinden örnek eser, kaynak atıfları, görsel lisansları ve koordinatlar.
- Backend endpointleri/OpenAPI, auth yöntemi ve hata formatı.
- Hero eser ve kullanıma uygun ses / tarihî görüntü / model dosyaları.
- Figma'da sonradan değişen akışlar; organizasyonun final sunum süresi ve teslim formatı.

Bunlar gelene kadar mock frontend geliştirilebilir; gerçek entegrasyon ve tarihsel doğruluk için zorunlu girdilerdir.
