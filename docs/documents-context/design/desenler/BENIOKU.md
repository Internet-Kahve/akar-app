# AKAR · Geometrik desenler

Desenleri geleneksel İslam geometrisinden **kodla kendimiz ürettik** (Hankin yöntemi: temas eden çokgenler, `desen.py`).
Vakıf Katılım kitaplarındaki çizimlerin kopyası değiller. Kitapların kendi desen/yazı dosyaları izinle gelirse onlar da buraya eklenir.

| Dosya | Ne | Nerede |
|---|---|---|
| `desen-bursa-sekiz-yildiz.svg` | 8 kollu yıldız · 4.8.8 döşeme · kare karo (100×100) | Bursa şehir kimliği (şu an kullanılan) |
| `desen-konya-on-iki-gulbezek.svg` | 12 kollu gülbezek · 3.12.12 döşeme · karo 100×173,2 | Konya şehir kimliği (şu an kullanılan) |
| `amblem-akar-yildiz.svg` | Tek yıldız amblem | Açılış, 3D yükleniyor animasyonu, rozet |
| `desen-bursa-yeni.svg` | Muhammed'in çizimi (31 Ekim) · karo 682×605 | Bursa için yeni desen — henüz bağlanmadı |
| `desen-hatay-yeni.svg` | Muhammed'in çizimi (31 Ekim) · karo 1413×999 (kaynak 2826×1998) | Hatay için — henüz bağlanmadı |
| `desen-konya-yeni.svg` | Muhammed'in çizimi (31 Ekim) · karo 675×1074 | Konya için yeni desen — henüz bağlanmadı |

- Renk SVG'de `currentColor`; renk CSS'ten gelir (`tokens.css` → `--sehir-*`). Uygulama deseni **maske** olarak kullanır: yalnız şekil önemlidir, rengi `veri/sehir/<il>.json → kimlik.zemin / desen_renk` belirler.
- Karolar dikişsiz tekrar eder. Boyut 1–70 KB, mobilde yükü yok.
- Kullanım yerleri (az ve yerinde): İlk açılış, şehir kapağı/seçimi, 3D yükleniyor, eser detay başlığı (%6–10 opaklık), boş durumlar, rozet çerçevesi. **Haritada kullanılmaz.**
- Yeni şehir: `desen.py` içinde açı/döşeme değiştir → yeni karo. (Ör. Hatay 6 kollu, Kütahya 10 kollu.)
- Rumi/hatayi motif henüz yok: elle çizilmeli (kodla iyi olmuyor). tasarım sorumlusu çizerse buraya `motif-rumi-*.svg` olarak eklenir.

Yeniden üretmek: `python3 desen.py` → `svg/` klasörüne yazar.

## Elle çizilen desenler (PNG → SVG)

`kaynak/` klasöründe çizimin PNG'si durur (beyaz = desen, siyah = boş, tek tekrar karesi). SVG'ye çevirmek:

```
pip install potracer pillow numpy
python3 png-den-svg.py kaynak/desen-konya-yeni.png desen-konya-yeni.svg 0 0 675 1074
```

Son dört sayı tekrar karesinin kırpımıdır (x y genişlik yükseklik); görsel tek kareyse yazılmaz. Büyük görseller için
sona hedef genişlik eklenebilir (Hatay: `0 0 2826 1998 1413`). Betik kenarları dikişsiz izlemek için kareyi sarıp çizer.
Çıkan SVG'deki `fill="#000"`'ı `currentColor` yap.

**Bağlamadan önce (açık kararlar, 31 Ekim):**
- Uygulama her şehrin karesini aynı genişlikte çizer (başlık 88 px, kart 72 px, panel altı 56 px). Hatay karesinde 4 sütun yıldız olduğu için 88 px'te çizgiler 0,7 px'e iner ve desen kaybolur (Bursa/Konya yenilerinde 3–3,5 px). Çözüm önerisi: `kimlik.desen_olcek` alanı (Hatay ≈ 4,3) — kod değişikliği, karar bekliyor.
- Dosya adları geçici (`-yeni`): kalıcı adlar verilince yeniden adlandırılır, `public/desenler/`'e kopyalanır ve `veri/sehir/<il>.json → kimlik.desen` güncellenir.
