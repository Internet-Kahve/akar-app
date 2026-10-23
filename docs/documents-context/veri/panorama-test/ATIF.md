# Ulucami iç mekân · yarım küre testi

- **Kaynak fotoğraf:** «Bursa Ulu Cami General view 9622.jpg», Dosseman, kendi çalışması, 15 Aralık 2018, Wikimedia Commons.
- **Lisans:** CC BY-SA 4.0. Bu dosya bir türev eserdir (balık gözü görüntü yarım küreye dönüştürüldü); aynı lisansla (CC BY-SA 4.0) paylaşılmalı ve fotoğrafçı anılmalıdır.
- **Durum:** Yalnız yerel test. Uygulamaya girmeden önce lisans tablosuna işlenmeli ve CC BY-SA'nın uygulamaya etkisi kararlaştırılmalı.
- **Dönüşüm:** `fish2pano.swift` (180° eşit uzaklıklı balık gözü varsayımı, 4096 × 2048 equirectangular çıktı, alt yarı boş). Çalıştırma: `swiftc -O fish2pano.swift -o fish2pano && ./fish2pano girdi.jpg cikti.jpg 180`.
- **Görüntüleyici:** `index.html` (three.js r128, görüntü sayfanın içine gömülü). Bakış yalnız ufuk çizgisinin üstünde döner.
- **Kaynak dosya notu:** Dönüşümde kullanılan görüntü 2000 × 1331 px'lik önizlemeydi; Commons'taki tam çözünürlüklü dosyayla daha net sonuç çıkar.
