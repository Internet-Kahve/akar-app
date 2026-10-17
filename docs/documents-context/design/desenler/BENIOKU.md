# AKAR · Geometrik desenler

Desenleri geleneksel İslam geometrisinden **kodla kendimiz ürettik** (Hankin yöntemi: temas eden çokgenler, `desen.py`).
Vakıf Katılım kitaplarındaki çizimlerin kopyası değiller. Kitapların kendi desen/yazı dosyaları izinle gelirse onlar da buraya eklenir.

| Dosya | Ne | Nerede |
|---|---|---|
| `desen-bursa-sekiz-yildiz.svg` | 8 kollu yıldız · 4.8.8 döşeme · kare karo (100×100) | Bursa şehir kimliği |
| `desen-konya-on-iki-gulbezek.svg` | 12 kollu gülbezek · 3.12.12 döşeme · karo 100×173,2 | Konya şehir kimliği |
| `amblem-akar-yildiz.svg` | Tek yıldız amblem | Açılış, 3D yükleniyor animasyonu, rozet |

- Renk SVG'de `currentColor`; renk CSS'ten gelir (`tokens.css` → `--sehir-*`).
- Karolar dikişsiz tekrar eder. Boyut 1–40 KB, mobilde yükü yok.
- Kullanım yerleri (az ve yerinde): İlk açılış, şehir kapağı/seçimi, 3D yükleniyor, eser detay başlığı (%6–10 opaklık), boş durumlar, rozet çerçevesi. **Haritada kullanılmaz.**
- Yeni şehir: `desen.py` içinde açı/döşeme değiştir → yeni karo. (Ör. Hatay 6 kollu, Kütahya 10 kollu.)
- Rumi/hatayi motif henüz yok: elle çizilmeli (kodla iyi olmuyor). tasarım sorumlusu çizerse buraya `motif-rumi-*.svg` olarak eklenir.

Yeniden üretmek: `python3 desen.py` → `svg/` klasörüne yazar.
