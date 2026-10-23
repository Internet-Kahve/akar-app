# Prompt: yedi uygulama modeline ortak palet ve yumuşak pişirme (yeni sürüm)

21 Ekim 2026. Kullanım: aşağıdaki kod bloğunu 3D üretim ajanına (akar-3d-model) olduğu gibi ver. Bu dosya bir iş emridir; yapılınca `_GENEL_SAHNE_STANDARDI.md` §3 ve §2 buna göre güncellenir.

## Neden (haritadaki durum)

Yedi yapı haritada yan yana çizildiğinde birbirine uymuyor ve açık renkli haritanın yanında koyu duruyor. GLB'lerden ölçülen:

| Model | Çatı / kubbe rengi (malzeme) | Köşe rengi ortalaması (0–1) | Not |
|---|---|---|---|
| Ulucami v25 | `Cati` #AEB6BC, `Kubbe` #939FA8 | 0,88 | |
| Bedesten v05 | `Cati` #9AA2A8 | 0,85 | |
| Koza Han v13 | `Cati_Kursun`/`Kursun` #7C858C, `Cati_Metal` #C3C9CD, dikiş #5E676E | 0,81 | aynı yapıda iki farklı kurşun |
| Emir Hanı v03 | `Cati_Kursun` #AEB6BC | 0,76 | |
| Orhan Bey Camii v06 | malzeme #FFFFFF (renk köşe renginde) | 0,59 | en koyu |
| Orhan Bey Hamamı v04 | malzeme #FFFFFF (renk köşe renginde) | 0,44 | en koyu |
| Orhan Gazi Türbesi v01 | `Kursun` #FFFFFF (renk köşe renginde) | 0,81 | |

Standart (§3) bütün kurşunu tek renk istiyor (`#C3C9CD`); hiçbir model buna tam uymuyor. İki model rengi malzemeye değil köşe rengine (`COLOR_0`) işlemiş; bu yüzden palet doğrulanamıyor ve uygulamada renk ayarlanamıyor.

## Prompt

```
AKAR 3D: yedi uygulama modelinin YENİ SÜRÜMÜNÜ üret. Yalnız renk ve pişirilmiş ışık değişir; geometri aynı kalır.

AMAÇ
Yapılar haritada (açık renkli, krem zeminli, MapLibre + three.js, Yandex 3D tarzı) yan yana çizilecek. Hepsi aynı palette, düşük kontrastlı, yumuşak ve açık görünmeli. Şimdi çatı renkleri modelden modele farklı ve iki model koyu.

KAPSAM (her biri yeni sürüm numarası alır; eski sürümün blend/GLB/kontrol dosyaları kabul edilince silinir)
Ulucami v25→v26, Bedesten v05→v06, Koza Han v13→v14, Orhan Bey Camii v06→v07, Orhan Bey Hamamı v04→v05, Emir Hanı v03→v04, Orhan Gazi Türbesi v01→v02.
Önce eserler/_GENEL_SAHNE_STANDARDI.md, _kutuphane/AKAR_3D_Yontem_Notlari.md ve ilgili eserin 3d/README.md dosyasını oku.

DEĞİŞMEYECEKLER (kesin)
- Geometri: parça adları, üçgen sayısı, konum ve ölçü birebir aynı. Yeni nesne ekleme, silme yok. Doğrula: sürüm öncesi ve sonrası her mesh için köşe sayısı ve sınır kutusu eşit.
- Parça adları hikâyelerdeki Vurgu adlarıyla eşleşir (Tac_Kapi, Kubbeler_19, Sadirvan_Kubbe, Kubbe_Ana, Hamam_Giris ...). Hiçbirine dokunma.
- Foto doku yok, yeni doku yok; mevcut küçük karo dokuları kalabilir.

1) RENK: HER ROL İÇİN TEK DEĞER, RENK MALZEMEDE
Renk, malzemenin baseColor değerinde durur. Köşe rengi (COLOR_0) yalnız gri AO taşır (R=G=B, ±0,02). Şu an Orhan Camii, Hamamı ve Türbe renkleri köşe rengine işlemiş (malzeme #FFFFFF): bunları malzemeye taşı.
Büyük yüzeylerde standardın "açık ton" sütununu kullan (pastel görünüm), küçük detayda "ana" sütunu:
- Kurşun (bütün kubbe ve çatılar, ÖRNEĞİN Koza Han'daki #7C858C dahil): #D6DADD (kaburga/dikiş #98A1A8 kalır). Mavi/lavanta değil, gümüşi açık gri.
- Küçük soğan kubbe (yalnız Ulucami şadırvanları gibi fotoğrafta koyu görünenler): #9AA2A7.
- Küfeki taş: #E6D8BA · Ulucami gövde kesme taşı: #E2D1AF · Mermer: #F5F4F0 · Krem sıva: #E8DFCB
- Tuğla: #CF7F55 (Koza Han #CC7A52, Emir Hanı #B06A4A, Bedesten #C0683F hepsi buna birleşir) · harç #E9DFCB
- Almaşık düz renk: #DDBD9C · Kiremit: #D07E57 · Sarı sıva (yalnız Ulucami kasnak): #F2E2A8
- Koyu ahşap #6B4A3A (en koyu) · ahşap kapı #7A5134 · pencere/cam #5A6672 (açıldı; saf siyah yok) · demir #4B5654 · alem #C9A13B · su #8CC3C6
Aynı rol, bütün yapılarda aynı hex. Büyük yüzeyde HSV V >= 0,80; hiçbir geniş yüzey V < 0,60.

2) YUMUŞAK PİŞİRME (köşe rengi, grayscale)
- Yönlü gölge pişirme YOK (uygulamada kendi güneşi var). Yalnız yumuşak AO + çok hafif yükseklik gradyanı.
- ao_vertex taban değeri 0,84 (en koyu köşe >= 0,80); kubbe, alem, kasnak, minare başı 0,93. Mevcut en koyu değerler (Orhan Camii 0,03, Hamamı 0,01) kabul edilmez.
- Yükseklik gradyanı: köşe rengi *= 0,92 + 0,08 * (y / modelin yüksekliği). Zeminde 0,92, tepede 1,00.
- AO yarıçapı küçük tut (duvar dibi, girinti, saçak altı); büyük yüzeylerde leke yok.
- Çevre ve figürler (Cevre_*, Olcek_Insan_*) bu işe girmez; sunum GLB'sinde mevcut hâliyle kalır (renkleri standart §1 ve §3'teki gibi).

3) ÇIKTI
- export/<eser>_<yeni>.glb: uygulama modeli, yalnız yapı. Üretimden sonra çevre ve figürü çıkar: GT_DIR=<kurulum> node eserler/_kutuphane/glb_temizle.mjs eserler/<eser>/3d/export/<eser>_<yeni>.glb
- export/<eser>_<yeni>_sunum.glb: aynı palet ve pişirme, kaide/zemin/ağaç/figür öncekiyle aynı.
- Draco açık, dosya <= 1 MB.
- kontrol/<yeni>/: eski ve yeni sürümün aynı kameradan yan yana render'ı (havadan.png standardı) + renkler.json (her malzemenin hex'i) + kontrol_rapor.json (köşe rengi min/ortalama/gri sapması).
- 3d/README.md sürüm tablosuna satır; _GENEL_SAHNE_STANDARDI.md §3 tablosunu bu değerlere göre güncelle (tek kaynak).

KABUL ÖLÇÜTLERİ (hepsi raporda sayıyla)
a) Yedi modelde kurşun malzemesinin hex'i aynı (küçük soğan kubbe istisna).
b) Aynı rol, aynı hex: tuğla, taş, mermer, ahşap, pencere.
c) Köşe rengi: en koyu >= 0,80, her mesh için R=G=B ±0,02.
d) Geometri: her mesh için köşe sayısı ve sınır kutusu eski sürümle eşit.
e) Büyük yüzeylerde V >= 0,80.
f) Eski ve yeni render yan yana: yeni olan belirgin şekilde daha açık, renkler yapılar arasında tutarlı, biçim (kubbe, kemer, pencere) hâlâ okunuyor.
Rapor sonunda her model için önce/sonra tablo ver: kurşun hex, tuğla hex, köşe rengi min/ortalama.
```

## Beklenen sonuç ve test

Yeni GLB'ler gelince `design/test-redmi9t/` sayfasındaki «Işık: koyu» ile yeni modeller karşılaştırılır. Palet tutarlıysa uygulamadaki ışık ayarı (`ISIKLAR` tablosu) pastel ve AO kısma gibi telafilere gerek duymadan çalışır; bu durumda sayfadaki `pastel` ve `ao` değerleri 0 ve 1'e çekilebilir.
