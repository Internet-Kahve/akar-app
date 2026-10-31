# AKAR · Geometrik desenler

Desenleri geleneksel İslam geometrisinden **kodla kendimiz ürettik** (Hankin yöntemi: temas eden çokgenler, `desen.py`).
Vakıf Katılım kitaplarındaki çizimlerin kopyası değiller. Kitapların kendi desen/yazı dosyaları izinle gelirse onlar da buraya eklenir.

| Dosya | Ne | Nerede |
|---|---|---|
| `desen-bursa-sekiz-yildiz.svg` | 8 kollu yıldız · 4.8.8 döşeme · kare karo (100×100) | Eski Bursa deseni (örnek veri `seed.ts` hâlâ kullanıyor) |
| `desen-konya-on-iki-gulbezek.svg` | 12 kollu gülbezek · 3.12.12 döşeme · karo 100×173,2 | Eski Konya deseni (örnek veri `seed.ts` hâlâ kullanıyor) |
| `amblem-akar-yildiz.svg` | Tek yıldız amblem | Açılış, 3D yükleniyor animasyonu, rozet |
| `desen-bursa-kesik-gecme.svg` | Muhammed'in çizimi (31 Ekim) · karo 682×605 | **Bursa şehir kimliği** |
| `desen-hatay-yildiz-kafes.svg` | Muhammed'in çizimi (31 Ekim) · karo 1413×999 (kaynak 2826×1998) | **Hatay şehir kimliği** · `desen_olcek: 4.3` |
| `desen-konya-yildiz-gecme.svg` | Muhammed'in çizimi (31 Ekim) · karo 675×1074 | **Konya şehir kimliği** |

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
python3 png-den-svg.py kaynak/desen-konya-yildiz-gecme.png desen-konya-yildiz-gecme.svg 0 0 675 1074
```

Son dört sayı tekrar karesinin kırpımıdır (x y genişlik yükseklik); görsel tek kareyse yazılmaz. Büyük görseller için
sona hedef genişlik eklenebilir (Hatay: `0 0 2826 1998 1413`). Betik kenarları dikişsiz izlemek için kareyi sarıp çizer.
Çıkan SVG'deki `fill="#000"`'ı `currentColor` yap.

**Ölçek (`kimlik.desen_olcek`):** uygulama her karoyu aynı genişlikte çizer (başlık 88 px, kart 72 px, panel altı 56 px,
açılış 96 px). Karosunda motifin birkaç tekrarı olan desen büyütülür ki çizgileri ötekilerle aynı kalınlıkta kalsın:
Hatay 4,3 (karoda 4 sütun yıldız). Yoksa 1. Aralık 0,25–8. Yeni desen eklerken: çizgi 88 px'lik karoda ~3 px olmalı;
`ölçek ≈ 3 × karo genişliği / (88 × çizgi kalınlığı px)`.

Bağlamak: SVG'yi buraya ve `apps/web/public/desenler/`'e koy, `veri/sehir/<il>.json → kimlik.desen` (gerekirse `desen_olcek`).
