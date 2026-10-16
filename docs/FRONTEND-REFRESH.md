# Frontend yenileme · inceleme ve iş listesi

16 Ekim 2026 · Branch: `codex/frontend-refresh`

## Kapsam ve kaynak önceliği

Yalnız frontend/UI ve yerel mock veri. Backend, Supabase bağlantısı, gerçek kimlik doğrulama ve sunucu moderasyonu bu çalışmanın dışında. Mevcut Next.js 16 + React 19 + TypeScript yapısı korunur. Native uygulama veya Vite'a taşıma yapılmaz.

İncelenen docs branch ağacı: `9b93f58e4567018d3adaa78cba5a116e95a471ff`. Büyük PDF, fotoğraf ve Blender arşivinin tamamı indirilmedi; aşağıdaki ilgili metinler GitHub bağlantısı üzerinden okundu.

1. Kullanıcının 16 Ekim kararları: yalnız UI/mock; kararsız özellikler test edilebilir olsun; iki masaüstü anlatım seçeneği denensin; eksikler burada izlensin.
2. [Frontend/backend notları §0 ve §10](https://github.com/Internet-Kahve/akar-app/blob/docs/docs/documents-context/belgeler/FRONTEND_BACKEND_NOTLARI.md): 15 Ekim kapsamı, fotoğraf/3D, cümle modeli ve panel.
3. [Tam bağlam §0.6 ve §0.5](https://github.com/Internet-Kahve/akar-app/blob/docs/docs/documents-context/belgeler/AKAR_Tam_Baglam.md): Bursa, Ulucami–Bedesten, ürün akışları.
4. [Güncel Figma](https://www.figma.com/design/Bd3m8xYrCiVK6440POHN39/akar-app?node-id=0-1): ekranlar ve bileşenler.
5. [Figma/kod farkları](https://github.com/Internet-Kahve/akar-app/blob/docs/docs/documents-context/tasarim/karsilastirma/KARSILASTIRMA.md), [prototip dersleri](https://github.com/Internet-Kahve/akar-app/blob/docs/docs/documents-context/belgeler/PROTOTIP_DERSLERI.md), [görev dağılımı](https://github.com/Internet-Kahve/akar-app/blob/docs/docs/documents-context/belgeler/GOREV_DAGILIMI_15Ekim.md).

Çelişkiler: kökteki ROADMAP/DESIGN-SOURCES 10 Ekim uygulamasını anlatıyor. Karşılaştırma belgesinin G1 satırındaki `jTSZ…` eski referansı, 15 Ekim notları ve kullanıcının verdiği `Bd3m8…` dosyasının önüne geçmez. Tam bağlamdaki Vite/native/monorepo önerileri mevcut kodu yeniden kurma talimatı olarak alınmadı. Görev dağılımının başındaki “hiçbir model hazır değil” ile altındaki Ulucami v02c kaydı çelişiyor; GLB dosyası uygulamada açılmadan hazır entegrasyon kabul edilmeyecek.

## İlk geliştirme dilimi

- [x] Bursa merkezli 6 mock eser ve 3 örnek rota; Ulucami, Bedesten, Koza Hanı, Orhan Gazi Camii.
- [x] Han ve bedesten türleri; Figma'dan özgün han pini (32 × 38,4 px).
- [x] Kaynak stil dosyası yerel `/harita/akar-style.json` altında; OpenFreeMap vektör haritası, 58 katman. OSM raster stili kaldırıldı.
- [x] Bursa/Konya aksan tokenları; rota çizgisinde Bursa aksanı.
- [x] `akar-demo-bursa-v1` depolaması. Eski `akar-demo-v1` değiştirilmez veya silinmez; eski ilerleme Bursa eserlerine yanlış eşlenmez.
- [x] Bulmaca, Birlikte Gez ve rozetler varsayılan ana akıştan gizlendi; Mirasım → “Deneysel arayüzleri göster” ile incelenebilir. Bu tercih oturuma özeldir.
- [x] Üst çubuk ve profil ana görünümündeki puan ekonomisi kaldırıldı. Eski puan alanları yalnız mevcut mock davranışla uyumluluk için durur.
- [x] Masaüstü anlatımda Panel / Altyazı karşılaştırma seçicisi. Tek oynatıcı örneği; görünüm geçişi cümleyi, modu ve oynatma state'ini sıfırlamaz. Mobilde seçici gizlidir.
- [x] Testler Bursa verisine ve deneysel ekran ayrımına uyarlandı; eski veri izolasyonu ayrıca test edildi.

Bu ilk dilim tam Figma uygulaması değildir. Mevcut CSS mimari çizimi, navigasyon, keşif kartları ve bölüm anlatımı henüz eski yapıdadır. Mock anlatımlar editoryal onay veya tarihsel doğrulama değildir; koordinatlar ve süreler yaklaşık örneklerdir. İki kurmaca kayıt yalnız filtre testi içindir.

## Sonraki işler — önerilen sıra

### 1. Keşif kabuğu ve harita

- [ ] Masaüstünde 64 px üst çubuk: AKAR + arama/şehir + avatar; Eserler/Rotalar yalnız 420 px panelde.
- [ ] Mobil tam ekran harita + 180 px / %50 / %92 sürüklenebilir alt panel; eski alt navigasyonun kaldırılması. Güncel Figma esas alınacak, test sonrası değerlendirilecek.
- [ ] Eserler varsayılan sekmesi; yakındakiler / tüm eserler ayrımı, filtrelerin klavye desteği.
- [ ] Pine basınca doğrudan detaya gitmek yerine seçili eser kartı; seçili pin ve harita padding'i.
- [ ] Şehir seçici (Bursa/Konya/Hatay/Kütahya/İzmir), ilk açılış, konum izni, Yakınımda / Evden gez.
- [ ] Türden ayrı vakıf rolü ve rol önceliği; Dinî/Su/Eğitim/Akar filtreleri; kalan yeni ikonlar.
- [ ] GeoJSON clustering, Türkiye/şehir/sokak zoom düzeyleri; sağ ortada zoom/konum/pusula; 2D/3D geçişi.
- [ ] Harita isteği gecikmesi, kısmi tile hatası, WebGL yokluğu ve yeniden deneme durumlarını ayır. Mevcut yedek şema kullanılabilir.
- [ ] Tüm pin durumları (seçili/tamamlandı/gizli) ve şehir rengiyle 8 kollu rota yıldızları.

### 2. Eser ve anlatım

- [ ] `StoryBlock` bölüm modelinden kaynak + güven + fotoğraf taşıyan cümle/cue modeline geçiş.
- [x] Ortak görsel havuzu: alt metin, kaynak, lisans, güven, başlık/kısa metin. Kaynak ve görsel güveni ayrı.
- [ ] Fotoğraf varsayılan galeri (büyük / üst üste iki küçük); eksik ve yüklenemeyen görsel durumları.
- [ ] Modeli olan eserde Fotoğraf | 3D; model yoksa seçici görünmez. Cümle/ses aynı kalır.
- [ ] Fotoğraf anlatımı: sığdır/doldur, bulanık arka plan, künye; 3 sn sonra kontrol gizleme, ilk dokunuş yalnız görünür kılar.
- [ ] Cue çözümleme: önceki kamera durumunu taşı; ileri/geri/ortadan giriş aynı sahneyi üretmeli.
- [ ] Oku için cümle listesi, kaydırma ve Boşluk/↓; Dinle için cümle sesleri, duraklatma, hız, otomatik ilerleme.
- [ ] Anlatımdan çıkışta ses temizliği, geldiği ekrana dönüş ve kaldığı yerin kalıcılığı.
- [ ] Eser hakkında: Tarihçe / Mimari / Vakıf ve akar / Kaynaklar; kaynak detay ekranı.
- [ ] Hikâye sonrası ayrı ekran; Geçmişi Gör / İz Bırak / Sonraki durak. Mevcut detay eylemleri buraya taşınacak.
- [ ] İlk hikâye sonrası giriş önerisi, “Şimdi değil” ve devam et / tekrar göz at durumları.
- [ ] Panel/Altyazı karşılaştırmasını gerçek fotoğraf ve modelle 1440×900, kısa ekran, büyük yazı ve klavye odağında yeniden yap.

### 3. Rotalar

- [ ] Liste, önizleme, Rotam, aktif rota, vardın ve tamamlandı durumları.
- [ ] “Bana rota oluştur”: süre/ilgi alanı seçimiyle deterministik mock öneri; kullanıcıya model/API varmış gibi sunulmaz.
- [ ] Durak ekleme/çıkarma/sıralama; süre/mesafe hesaplama ve şematik rota açıklaması.
- [ ] Evden rota eşdeğeri; konum izinsiz akış; sonraki durak ve geri dönüşte rota state'i.
- [ ] Ana rota durakları kesinleşince fixture güncelle; Bedesten şu an ayrı Akar ve Hayrat rotasında.

### 4. Profil, katkı ve geçmiş

- [ ] Misafir/girişli profil ve mock Google/e-posta 6 haneli kod arayüzü; gerçek e-posta gönderilmez.
- [ ] OTP süre/hata/tekrar gönderme durumları ve misafir ilerlemesini mock hesaba taşıma.
- [ ] KVKK metni için onaylı içerik yuvası; backend güvenliği veya gerçek hesap varmış izlenimi verilmez.
- [ ] İz Bırak giriş gereksinimi, onay bekleme/ret ve Yaşayan hafıza yeni düzeni; fotoğraf metadata temizliği kontrolü.
- [ ] Geçmişi Gör: kaynaklı eski/yeni medya, tarih seçimi; medya yoksa dürüst boş durum. Kamera katmanı ayrıca değerlendirilecek.
- [ ] Deneysel rozet/Bulmaca/Birlikte Gez ekranlarının ürün kararı; mock oda ekranı mevcut senkron olmayan açıklamadan ileri taşınacaksa ayrıca belirle.

### 5. Yönetim paneli (tamamen mock)

- [x] Eserler / Rotalar / Kartlar ve Fotoğraflar / Katkılar / İçe aktar; dar ekranda taşmayan menü, masaüstünde katlanabilir menü.
- [x] 5 adım: Model (fotoğrafla devam edilebilir) → Bilgiler → Kaynaklar → Hikâye → Yayın. Model dosyası/parça metaverisi saklanır; gerçek 3D önizleme aşağıda açık iş.
- [ ] Hikâye satırında Cümle / Fotoğraf / Kart checkbox / Açı / Vurgu; modelsiz eserde yalnız ilk ikisi.
- [x] Yeni fotoğraf / havuzdan seç, kaynak-lisans-alt metin doğrulaması. Kapak, cümle, önizleme, keşif kartı ve eser sahnesi bağlı. Ortak havuzdan düzenleme tüm kullanımlara yayılır.
- [x] Yayın öncesi eksik listesi; kaynaksız/fotoğrafsız cümle ve modelde bulunmayan parça engeli, EN eksikliği yalnız uyarı. Eksik içerik taslak kaydedilebilir.
- [x] Rota sıralama editörü (klavyeyle kullanılabilir yukarı/aşağı), canlı harita önizleme; JSON alan eşleme/doğrulama, yalnız taslak kayıt, JSON dışa aktarma. Kopyalar atlanır; var olan kayıtların alan birleştirmesi ayrıca yapılacak.

### 6. Medya, erişilebilirlik ve teslim

- [ ] Ulucami GLB dosyasını ayrı yükleyiciyle aç; üçgen/boyut/parça adları ve lisans kontrolü. Backend gerekmez.
- [ ] Normal/hafif/görsel kademe, düşük cihaz testleri, render-on-demand, GPU kaynak temizliği, reduced motion.
- [ ] Fotoğraf kullanım izni ve kaynakları içerik ekibince netleşene kadar fixture/yer tutucu ile çalış.
- [ ] Şehir desenleri ve serif başlık fontunu yerel varlıklarla ekle; haritaya desen koyma.
- [ ] PWA manifest/çevrimdışı kapsamını belirle; harita karolarını izinsiz toplu önbellekleme yok.
- [ ] 390×844 ve 1440×900 görsel karşılaştırma; Redmi 9T, ekran okuyucu, odak/kontrast/büyük metin.
- [ ] Eski ROADMAP, API-HANDOFF, REPOSITORY-STRATEGY ve doğrulama raporlarını yeni uygulama tamamlandıkça güncelle.

## Güncel Figma eşlemesi

16 Ekim ikinci incelemede Figma node kimlikleri `55:*` → `69:*` değişmişti; eski kimlikler artık çözülmüyor. Admin Model, Bilgiler, Kaynaklar, modelsiz Hikâye, Fotoğraf modalı, Yayın, Rota, Kartlar ve İçe aktar için yüksek ayrıntılı context + ekran görüntüleri okundu.

| Alan                                 | Node                              |
| ------------------------------------ | --------------------------------- |
| Tasarım sistemi                      | `69:2459`                         |
| Masaüstü keşif                       | `69:6730`                         |
| Fotoğraflı detay / Dinle / Oku       | `69:7496` / `69:7563` / `69:7682` |
| Altyazı / Mobil keşif                | `69:5123` / `69:8191`             |
| Panel eser listesi / Katkılar        | `69:3391` / `69:3486`             |
| Panel Model / Bilgiler / Kaynaklar   | `69:3686` / `69:3745` / `69:3831` |
| Panel Hikâye / fotoğraf ekle / Yayın | `69:3902` / `69:4051` / `69:4234` |
| Panel modelsiz hikâye                | `69:4353`                         |
| Panel Rotalar / Kartlar / İçe aktar  | `69:3618` / `69:4291` / `69:3542` |

## Anlatım kararı ve doğrulama

İlk tercih: **panel varsayılan**, altyazı isteğe bağlı. Panelde uzun metin, cümle listesi ve kaynak kolay bulunuyor; altyazı görsele daha çok alan veriyor ama kısa ekranlarda aşağıdaki alanı daraltıyor. Bu bir ilk UI değerlendirmesi; gerçek kullanıcı testi veya gerçek model/fotoğraf değerlendirmesi değildir. Aynı `StoryPanel` yer değiştirir, ikinci oyuncu oluşturulmaz.

İlk kontrol: TypeScript, production build, 9 birim testi ve 15 Playwright testi başarılı. Sadece masaüstü için olan görünüm karşılaştırması mobil projede bilinçli atlanır. Canlı Chrome kontrolünde Bursa haritası yüklendi, yedek görünüm kapandı, sayfa hatası ve başarısız ağ isteği görülmedi. Stil dosyasının 58 katmanı MapLibre şema doğrulamasından hatasız geçti. Görsel referanslar `test-results/` altında geçici çıktı olarak tutulur.

## İkinci dilim — admin ve harita (16 Ekim)

- [x] Harita pini: MapLibre'ın konumlandırdığı dış `div` ile etkileşimli iç `button` ayrıldı. Harita transform'unda CSS transition yok; özgün SVG 32 × 38,4 boyutu korunur. Yeniden boyutlandırma ResizeObserver ile izlenir.
- [x] Sol panel kapatıldığında haritanın 0 genişlikli ilk grid sütununa düşmesi düzeltildi; tam alanı kullanır ve panel tekrar açılır.
- [x] Yerel stil dosyası [docs harita kaynağı](https://github.com/Internet-Kahve/akar-app/blob/docs/docs/documents-context/tasarim/harita/akar-style.json) ile JSON olarak birebir karşılaştırıldı: 58 katman. Bu dilimde keyfî yeniden renk seçimi yapılmadı. Zemin `#F5F2EA`, yeşil `#adde8c`, su `#79c9fb`, binalar `#fde2c9` / `#D6C6AC`, 3D bina `#d0c6b4`.
- [x] Admin başlıkları için yerel Cormorant Garamond 600 (Latin + Türkçe), Figma panel sekmesi varlığı.
- [x] Kaynak ve görsel/cümle bağlantıları opsiyonel v2 alanlarıyla mevcut mock kayıtlara zarar vermeden eklendi. Eski kayıt düzenlenince yeni yayın kuralları devreye girer.
- [x] Fotoğraf dosya türü/boyut kontrolü, hatalı görsel durumu; yeniden kodlama ile metadata temizliği, en uzun kenar 1200 px, çıktı sınırı. Depolama dolarsa başarı gösterilmez ve editördeki taslak korunur.
- [x] Rota düzenlemeleri yerel katalogda kalıcı; taslak rotalar keşifte görünmez. Mesafe kuş uçuşudur, gerçek yaya rotası değildir.

### Bir sonraki geliştirme dilimi

1. **Gerçek medya oynatıcısı:** Ulucami GLB yükleyici/render-on-demand, fotoğraf/3D geçişi, kayıtlı kamera açıları, cue başına vurgu ve gerçek ses dosyaları. Şimdiki GLB adımı dosya/parça/güven kaydeder; model render etmez. Fotoğraf yayın akışı çalışır.
2. **Admin kalan Figma ayrıntıları:** 3D cümle satırında kamera seçici, kartın bağımsız metadata'sı ve görünürlük zamanlaması; kaynak PDF eki; fotoğraf silme/bağlantı değiştirme; rota sürükle-bırak; bulmaca ve geçmiş eşleme editörleri; içe aktarmada dolu/boş alan birleştirme ve satır düzeltme. Şimdiki kart havuzu fotoğraf metadata'sını kullanır; tam bağımsız kart modeli değildir.
3. **Keşif ve anlatımın yeni Figma kabuğu:** tam fotoğraf galerisi, mobil sürüklenebilir alt panel, seçili pin kartı; iki masaüstü anlatım düzenini gerçek medya ile karşılaştırma.
4. **Yerel medya deposu:** GLB ve çok sayıda fotoğraf için IndexedDB/Blob adaptörü. Şimdiki mock localStorage kota sınırına tabidir; 5 MB kabul edilen bir model kaydetme sırasında kotayı aşabilir. Üretim medya servisinin yerine geçmez. JSON envanter içe aktarma bir tam yedek geri yükleme aracı değildir.
5. **Bağımlılık bakımı:** `npm audit` mevcut MapLibre sürümü için [GHSA-jrc7-96c5-q579](https://github.com/advisories/GHSA-jrc7-96c5-q579) bildiriyor. Çözüm major sürüm geçişi gerektiriyor; harita/popup/attribution davranışlarıyla ayrı doğrulanacak. Bu dilimde rastgele major/force güncellemesi yapılmadı.

Mevcut üst uygulama kabuğu ve bazı eski ekranlar korunuyor; admin yapısı işlevsel olarak genişletildi fakat uygulamanın tamamı için piksel eşitliği veya tüm Figma alt akışlarının bittiği iddia edilmez.
