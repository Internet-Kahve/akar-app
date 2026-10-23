# Tasarım ve içerik notları

> Bu sayfadaki `3:*` eşlemeleri 10 Ekim sürümüne aittir. 16 Ekim güncel kaynak önceliği, `55:*` ekran eşlemesi ve açık işler [FRONTEND-REFRESH.md](FRONTEND-REFRESH.md) içindedir.

## İncelenen kaynaklar

- Figma: `Bd3m8xYrCiVK6440POHN39`, Page `0:1`.
- Ekip kaynakları arasındaki `KATMANvPRD.pdf`, 24 sayfa. Güncel ürün kapsamı yerine vizyon ve eski öneriler için kullanıldı.
- Ekip kaynakları arasındaki `KÖK&KOD Hackathon _ Yarışma Şartnamesi_TR.pdf`, 12 sayfa. Özellikle 4–5, 7–10. sayfalar ürün kapsamı ve takvim için kullanıldı.
- Ürün kararı: ürün adı Akar, ekip İnternet Kahve, web önce, mock veri serbest; sponsor verisi, 3D model ve medya henüz yok.

## Figma ekran eşlemesi

| Node     | Ekran                          | Uygulama                                       |
| -------- | ------------------------------ | ---------------------------------------------- |
| `3:3429` | D · Keşif / Ana                | Rota sekmesi, sol panel, harita                |
| `3:4024` | D · Eser detay                 | Detay paneli, deneyim düğmeleri, temsili sahne |
| `3:4264` | D · Anlatım / Oku              | Bölümlü hikâye, sade anlatım                   |
| `3:4348` | D · Anlatım / Akar akışı       | Akar → Hayrat şeması                           |
| `3:3848` | D · Rota önizleme              | Duraklar, başlatma, özel rota                  |
| `3:4753` | D · Bulmaca                    | Soru modalı, ipucu, açıklamalı cevap           |
| `3:4793` | D · İz Bırak                   | Fotoğraf / metin formu, onay bekleme           |
| `3:5074` | D · Profil                     | Profil, rozetler, keşif, katkılar              |
| `3:4700` | D · Geçmişi Gör                | Karşılaştırma kaydırıcısı, tarih seçenekleri   |
| `3:5347` | WF · Panel / Eser listesi      | Admin tablo                                    |
| `3:5441` | WF · Panel / Eser düzenle      | Eser formu, hikâye düzenleme                   |
| `3:5600` | WF · Panel / Katkı moderasyonu | Onay/ret akışı                                 |

Bu ekranların yüksek ayrıntılı tasarım verileri ve ekran görüntüleri incelendi. Mobil ekran için ayrı context isteği Figma Starter MCP kotasına takıldı; responsive uyarlama masaüstü referansları, sayfa metadata'sı ve ürün kararları doğrultusunda geliştirildi. Tüm Figma dosyasının birebir eksiksiz uygulandığı iddia edilmez.

## Görsel kararlar

Çini paleti ve Inter korundu. Wireframe'e marka işareti, keşif başlığı, rota illüstrasyonları, etkileşim geri bildirimleri, hata/boş durumları eklendi. Figma'daki değişken font kullanımı tek Inter ailesinde birleştirildi. Desktop üst çubuk 64 yerine 72 px; panel 420 px, küçük ekranlarda daralır. Mobil webde harita üstte, içerik altında ve dört öğeli alt navigasyon bulunur.

Gerçek fotoğraf/model yerine uygulama içinde CSS ile temsili mimari çizim kullanılır. Bu çizim Kılıç Ali Paşa Camii'nin ölçülü modeli veya tarihî belgesi değildir. Arşiv karşılaştırmasının iki yanı da açıkça içerik bekleyen örnektir. Temsili görselden tarihsel sonuç çıkarılmaz.

Figma SVG'leri `apps/web/public/figma/` altında saklanır. `figma-assets.json` kaynak node envanteridir. Süreli indirme URL'leri repoya dahil edilmez; yeni varlıklar Figma'dan tekrar dışa aktarılır. Dini, su, akar pinleri renk/kategori eşleşmesiyle kullanılır; eğitim örneği ayrı E pinidir. SVG doğal ölçüleri korunur. Yalnız uygulamanın kullandığı dokuz SVG tutulur; `docs/design/figma-assets.json` bu dosyaların kaynak node eşlemesidir. Kullanılmayan dışa aktarımlar Git geçmişinden geri alınabilir.

## İçerik ve lisans

Örnek eserlere ait isim, yıl ve mimar bilgileri Figma taslağından gelir; sponsor doğrulaması tamamlanmamıştır. Son iki eser tamamen temsili kayıttır. Koordinatlar yaklaşık demo koordinatlarıdır. UI tüm kayıtları doğrulama bekleyen örnek veri olarak işaretler.

- Inter: paketle gelen OFL lisansı.
- Lucide: paketle gelen ISC lisansı.
- MapLibre GL JS: paketle gelen BSD-3-Clause lisansı.
- OpenStreetMap: harita üzerindeki görünür attribution korunur; tile servisi [kullanım politikasına](https://operations.osmfoundation.org/policies/tiles/) tabidir. Mevcut uygulama normal etkileşimli görüntüleme yapar; offline tile indirme uygulamaz. Üretim ölçeğinde sağlayıcı kararı ayrıca verilmeli.
- Figma: İnternet Kahve tasarım dosyasından aktarılan varlıklar.

Gerçek içerik geldiğinde kaynak ve medya lisansını kayıt bazında tutun. PRD veya Figma'da “doğrulanmış” yazması tek başına tarihsel doğrulama sayılmadı.
