# Ayasofya V22 — 20 Ekim 2026

V21 üzerine payanda, yan galeri çatısı ve batı giriş/narteks birleşimleri yeniden kuruldu. V21 dosyaları korunur. Bu sürüm ölçülü rölöve veya bütün yapının birebir kopyası değildir.

## Değişiklikler

- Dört yüksek payanda sürekli gövde, kurşun üst örtü, dar yuvarlak alınlık ve küçük açıklıklarla yeniden üretildi.
- Batıdaki dört uçan payanda daha dar kesitlerle ve gerçek kemer boşluklarıyla modellendi.
- İç/dış narteksin farklı çatı kotları korundu; üst cephe pencerelerini kapatan ilk deneme kaldırıldı.
- Altı galeri çatı yüzeyi, toplam sekiz kemerli ön uçla uyumlu biçimde oluşturuldu. Eski çatı parçaları ve açıkta kalan iç kabuklar ilgili bölgelerden kesilerek çıkarıldı. Yan/arka kapanışlar ve eksedra saçak bağlantıları eklendi.
- Kurşun derzleri gerçek geometridir. Tekrarlanan detaylar isimli gruplarda birleştirildi.
- Türkçe, İngilizce ve Yunanca kaynaklar araştırıldı; erişilemeyen paftalar ölçü dayanağı sayılmadı. Ayrıntılar `REFERANSLAR.md` içinde.

## Dosyalar ve üretim

- `ayasofya_v22.blend`: düzenlenebilir sahne.
- `ayasofya_v22.glb`: zeminsiz ve ışıksız teslim modeli.
- `renders/`: dört genel açı, GLB kontrolü, üst görünüm, giriş ve galeri yakın planı.
- Blender 5.2 ile sırayla `build_v22.py`, `finalize_export.py`, `check_junctions.py`, `validate_v22.py`, `render_details.py` çalıştırılır. Üretim `../v21/ayasofya_v21.blend` ve `../v21/base_geometry.json` dosyalarını okur.

## Doğrulama

`validation.json` GLB'nin yeniden içe aktarımı üzerinden sayısal koordinat ve sıfır alanlı üçgen kontrolüdür. `junction_validation.json` sekiz yeni payanda/kemer parçasının geometrik kapanışını ve altı galerinin kemerli ön kenar uyumunu kontrol eder. GLB'nin normal/UV ayrımları, kapanış hesabından önce 0,02 mm eş konum toleransıyla birleştirilir. Komşu dikey duvarlara oturan iki uç nokta, kemer eğrisi karşılaştırmasından ayrı tutulur; tüm yapının kapalı veya kesişimsiz olduğu iddia edilmez.

`asset_comparison.json` V21/V22 dosya, üçgen ve çizim parçası karşılaştırmasıdır. Nesne ve primitive sayısı azaltılmış olsa da üçgen ve dosya büyüklüğü arttı. Fiziksel telefonda FPS testi yapılmadı.

## Kapsam sınırları

Bu sürüm ilk üç önceliği (payandalar, galeriler, narteks) ve bunların birleşim temizliğini ele alır. Cephelerin tüm pencere sayıları, dört minarenin ölçülü profilleri, türbelerin ayrıntılı revakları ve gerçekçi yüzey dokularının tamamı yeniden yapılmadı. Kaynaktaki yatay/düşey ölçek oranı korunur. Fotoğraflardan çıkarılan payanda profilleri yaklaşık mimari yorumdur; teknik dosya doğrulaması mimari doğruluk onayı değildir.
