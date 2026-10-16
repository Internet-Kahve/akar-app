# Doğrulama raporu

## 16 Ekim · admin ve harita ikinci adımı

- `npm run typecheck`, `npm run build` başarılı; 12 birim testi geçti.
- Tam Playwright paketi: 19 başarılı, 1 bilinçli mobil atlama. Son font/panel değişikliğinden sonra ilgili 4 masaüstü/mobil admin + harita testi tekrar geçti.
- Fotoğraf seçme: geçersiz dosya reddi → gerçek dosya decode/resize → alt metin/inline kaynak/lisans → kapak → cümlede havuzdan seçim → taslak → reload → yayın → ortak görsel güncelleme → keşif kartı/okuma sahnesi → reload. Masaüstü 1440×1000 ve mobil 390×844; yatay taşma yok.
- Kaynak/lisans/kapak/cümle ilişkileri eksikse yayın engellenir; eksik taslak kaydedilir. Yanlış model parçası engeli domain sınırında test edildi.
- JSON alan eşlemede konumsuz satır atlanır, hazır kayıt yalnız taslak olur. Kopya engeli ve atomik hata domain testinde doğrulandı. Rota sıralama kaydı reload sonrasında korunur.
- Gerçek MapLibre ile animasyon açıkken yakınlaştırma, uzaklaştırma ve panel boyut değişimlerinde DOM pin ucu ile haritanın verdiği koordinat arasındaki hata <1,1 CSS px. Bu regresyon testi dış tile ağından bağımsız bir boş stile karşı çalışır.
- Ayrı canlı kontrol: gerçek OpenFreeMap stili yükleniyor, 6 pin var, fallback yok, tarayıcı sayfa hatası yok. Yerel stil docs kaynağıyla JSON olarak birebir aynı (58 katman).
- Görsel inceleme: admin yayın sayfası masaüstü/mobil ve yerel yüklenen görsel. Eski üst uygulama kabuğu bu dilimde korunur; tam Figma eşitliği iddia edilmez.
- 3D render, kayıtlı kamera ve profesyonel ses bağlantısı henüz yok. GLB dosyası/parça metaverisi okuma UI'si mevcut; gerçek Ulucami GLB entegrasyonu ayrıca yapılacak. Yerel depolama kotası geçerlidir.
- `npm audit` MapLibre için mevcut kritik DOM sanitizer uyarısı bildirdi; major sürüm geçişi kontrol listesinde. Font paketi bu uyarının kaynağı değil.

## 16 Ekim · frontend yenileme ilk adımı

- Tip kontrolü ve üretim build’i geçti.
- 9 birim testi, 15 masaüstü/mobil Playwright testi geçti; masaüstü anlatım karşılaştırması mobilde bilinçli atlandı.
- Bursa haritası canlı Chrome kontrolünde yüklendi; fallback kapandı, sayfa hatası veya başarısız ağ isteği görülmedi.
- MapLibre stil şeması: 58 katman, sıfır doğrulama hatası.
- Panel / Altyazı geçişinde aktif bölüm ve oynatıcı DOM örneği korundu; 1440×900 ekran görüntüleri incelendi. Sesin işitsel kalitesi ve gerçek GLB/fotoğraf anlatımı henüz doğrulanmadı.
- Eski İstanbul localStorage kaydı korunurken yeni Bursa ilerlemesinin bağımsız saklandığı test edildi.
- Deneysel özelliklerin varsayılan gizliliği, ayardan açılıp kapanması ve ekranlara ulaşılması iki boyutta doğrulandı.

Kalan işler ve mevcut sınırlar: [frontend kontrol listesi](FRONTEND-REFRESH.md). Aşağıdaki rapor önceki sürüme aittir.

10 Ekim 2026 · Yerel frontend demosu

## Sonuç

- `npm run typecheck`: geçti.
- `npm test`: **8 / 8 geçti**.
- `npm run test:e2e`: **12 / 12 geçti**, Chrome; 1440×1000 masaüstü ve 390×844 mobil emülasyonu.
- `npm run build`: geçti; Next.js üretim çıktısı oluştu.
- Önizleme: `http://127.0.0.1:3000`.

## Uçtan uca doğrulanan akışlar

| Akış                                                        | Kanıt                                                                         |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Türkçe arama → eser seçimi → favori → rotaya ekleme         | İki ekran boyutunda Playwright                                                |
| Hikâye bölümleri → sade anlatım → tamamlanma                | +15 puan ve detay dönüşü                                                      |
| Demo ziyaret → pasaport                                     | +100 puan; gerçek geofence olduğu iddia edilmiyor                             |
| Anı gönder → pending → yaşayan hafızada gizli → admin onayı | Onaydan önce görünmüyor; onaydan sonra profil katkı durumu/puan güncelleniyor |
| Yenilemeden sonra ilerleme                                  | +140 örnek puan ve profil korunuyor                                           |
| Admin yeni eser → yayın durumu → keşifte arama              | Yeni içerik frontend veri akışına katılıyor                                   |
| Quiz → açıklamalı sonuç → puan                              | 3 doğru, +20 puan                                                             |
| Dialog Escape ve geçmiş karşılaştırma klavyesi              | Modal kapanıyor; slider ArrowRight ile ilerliyor                              |
| Rota adına göre arama → duraklar → rotayı başlat → yenile   | Seçili rota kayıtları korunuyor                                               |
| Harita tile ağı kesildiğinde alternatif keşif               | Şematik pin → eser → hikâye çalışıyor                                         |
| Responsive geometri ve varlıklar                            | Yatay taşma yok; görünür Figma img dosyaları yükleniyor                       |

## İş kuralı testleri

Türkçe karakter normalizasyonu, kategori/favori filtreleri, puan işlemlerinin tekrarda puan üretmemesi, katkıların pending başlaması, ret nedeni zorunluluğu, onayın tekrarda puan üretmemesi, kaynak/koordinat doğrulaması, immutable state, rota ID tekilleştirme, localStorage kalıcılığı, bozuk depolamadan toparlanma, depolama hatasında sahte başarı üretilmemesi.

## Görsel kontrol

Figma masaüstü ana ekran ve eser detay referanslarıyla temel düzen, renkler ve motif/pin varlıkları karşılaştırıldı. Masaüstü keşif, detay; mobil keşif ve detay görüntüleri incelendi. Kullanıcının iyileştirme iznine dayanarak wireframe üzerine özgün kart görselleri ve temsili mimari sahne eklendi. Tam piksel eşitliği hedeflenmedi.

## Sınırlar

- Testler gerçek telefon donanımında değil, Chrome mobil emülasyonunda yapıldı.
- Cihaz sesli okumasının kodu ve tarayıcı destek/hata akışı mevcut; insan tarafından ses kalitesi/dil telaffuzu değerlendirmesi yapılmadı.
- Gerçek backend, auth, GPS doğrulaması, çok kullanıcılı eşzamanlı kullanım, içerik lisansı/doğruluğu, gerçek 3D ve tarihî medya test edilmedi; bu teslimde mevcut değiller.
- Demo state localStorage'dadır; farklı cihazlara senkronize olmaz ve üretim güvenlik sınırı değildir.
- Harita online tile sağlayıcısına bağlıdır. Alternatif şematik görünüm coğrafi doğruluk veya yürüyüş yol tarifi sağlamaz.
- Ekran okuyucu ve kapsamlı WCAG uygunluk denetimi yapılmadı. Temel semantik, odak, klavye ve kontrast araçları uygulandı.

## 3–4 dakikalık ekip içi demo önerisi

1. Ana ekrandan Tophane Vakıf Yürüyüşü'nü aç; üç durağı göster.
2. Kılıç Ali Paşa Camii'ne gir; Oku ve sade anlatımı kullan.
3. “Vakıf nasıl yaşar?” noktasından akar → hayrat ilişkisini göster.
4. Hikâyeyi tamamla; demo ziyareti ekle.
5. İz Bırak'tan kısa bir anı gönder; henüz yaşayan hafızada görünmediğini göster.
6. Mirasım → Demo yönetim paneli → Katkılar'dan onayla.
7. Profile dön; puanı, rozeti ve kalıcılığı göster.
8. Admin'den yeni eser ekleyip aramada göründüğünü göster.

Bu süre organizasyonun resmî sunum süresi değildir; ekip içi prova önerisidir.
