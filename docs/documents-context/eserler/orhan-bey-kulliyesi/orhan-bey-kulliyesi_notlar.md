# Orhan Bey Camii (Orhan Bey Külliyesi): model notları

Bu klasör külliyenin cami bileşenini üretir; Orhan Bey Hamamı / Aynalı Çarşı (`../orhan-bey-hamami/`) ve Emir Hanı (`../emir-han/`) ayrı eser klasörleridir. Kaynaklı kimlik ve ölçü kaydı `eser.md` (külliye ortak kaydı), üretim sürümleri `3d/README.md`, sıradaki tur `SONNET_REVIZYON_PLANI.md` dosyasındadır. Son düzenleme: 19 Ekim 2026.

## 0. Klasör düzeni

```
orhan-bey-kulliyesi/
  eser.md                     külliye kimlik ve kaynak tablosu (cami + hamam + han satırları)
  orhan-bey-kulliyesi_notlar.md   bu dosya (yalnız cami)
  ref/
    foto/     ts_17ekim_* (tasarım sorumlusunun fotoğrafları), web fotoğrafları, envanter_c1_pdf096–100, yurt2024_pdf277–289 (levha sayfaları),
              alan-baskanligi_pdf003_foy, budak2018_pdf004
    plan/     yurt2024_pdf213 (Ayverdi planı), pdf214 (Acar planı), pdf217 (Ayverdi kesit + ön cephe 1), pdf218 (Ayverdi ön cephe 2, kuzey),
              pdf219 (külliye vaziyeti), budak2018_pdf009 (Gabriel planı), vakif_1983_pdf085, okuma_* (önceki 1 m ızgaralı okumalar)
    metin/    envanter_c1, yurt2024, vakif_1983, budak2018, alan_baskanligi (+ osm_ayak-izleri.json: yalnız konum)
    maket/    yandex_3d_* (Yandex 3B model görüntüleri; ölçü kaynağı değil)
    kaynak_dizini.json
  3d/         yalnız son sürüm v06: blend/, export/ (zeminsiz GLB + _sunum.glb), kontrol/v06/, build/ (build_v06.py, cevre_v06.py, doku/, araclar/), README.md
```
Eksenler: +X doğu, +Y kuzey; orijin caminin ayak izi kutusunun ortası. Plan okuması (u, v): u doğu kenarından batıya, v kuzey kenarından güneye; X = 12,85 − u, Y = 16,75 − v. Ayverdi ve Acar planlarında kuzey aşağıdadır.

Külliyedeki yerler (OSM yerel koordinat, m; yalnız konum): cami (177, 13), hamam (81, 72), Emir Hanı (−27, 92); Koza Han ≈ (194, 74), Ulucami (−20, 14). Her GLB kendi ayak izinin ortasında, dönmesiz.

## 1. Güncel model kararları

| # | Konu | Karar | Dayanak | Durum |
|---|---|---|---|---|
| 1 | Plan ve kütle | 25,7 × 33,5 m, ters T (zaviyeli); son cemaat yeri 25,7 × 6,5, 5 göz | P: Ayverdi planı (47,4 px/m); E: C1 PDF 97 «25.80 × 6.30» | v01'den beri doğru, korunur |
| 2 | Yükseklikler | Son cemaat saçağı 9,4; kanat 7,6; harim/mihrap bloğu 10,2; harim kasnağı 13,5 / tepe 16,5; mihrap kasnağı 12,7 / tepe 14,4; tabhane kasnağı 9,1 / tepe 10,5 | P/Y: Ayverdi yan cephesi (33,2 px/m, uzunluk planla doğrulandı) | Korunur |
| 3 | **Son cemaat yeri cephesi (katmanlı)** | Alt: düz **kesme taş** ayaklar ve köşe payeleri (tuğla yok). Kemerler taş–tuğla almaşık kemer taşları + tuğla dış bant. Üst (kemer üzengisinden saçağa): **1 sıra kesme taş + 3 sıra tuğla** almaşık. Saçakta **2 sıra kirpi (testere dişi) tuğla**. Köşe ve kemer aralarında tuğla **kurslar** | W: Yurt 2024 PDF 72 «Son cemaat yeri duvar örgüsü ise diğer cephelerden farklı olarak üst bölüm bir sıra kesme taş, üç sıra tuğla almaşık teknikte»; E: Vakıf 1983 PDF 84 «iki sıra kirpi dizili saçak silmeleri», «Tuğla güneş kursları»; F: `ts_17ekim_2_kuzeybati_revak`, `yurt2024_pdf277`, `pdf281` | **v06 uygulandı** (v05: tek tip ızgara doku, tek tuğla bant) |
| 4 | Revak yan cepheleri | İkiz sivri kemer, devşirme kompozit başlıklı sütun, büyük hafifletme kemeri içinde; kemer alınlığı (tympanon) doğuda iki renkli **baklava**, batıda **dama** | E: C1 PDF 98, PDF 100; Vakıf PDF 84; F: `ts_17ekim_5_ikiz_kemer`, `envanter_c1_pdf098`, `yurt2024_pdf278` | **v06 uygulandı** (alınlık motifi doku olarak; v02'de "motif eklenmez" kararı vardı, kullanıcı 18 Ekim'de cephenin fotoğraftaki gibi kesin tanımlanmasını istedi) |
| 5 | Ana gövde duvarları | Moloz/kaba yontu taş sıraları arasında **2 sıra yatay tuğla** + taşlar arasında **dikey tuğla** (hücre örgü); her cephede zeminden saçağa iki sivri kemerli silme; saçakta kirpi tuğla | E: C1 PDF 98 «moloz taş ve aralarına yatay ile dikey olarak yerleştirilen tuğlalarla», PDF 100; E: Vakıf PDF 84; F: `IMG_8460`, `IMG_8484`, `ts_17ekim_b_20` | **v06 uygulandı** doku ve saçak (v05: 2,0 × 0,8 ızgara, tek bant saçak) |
| 6 | **Dört büyük kubbe ile kasnak birleşimi** | Sekizgen kasnak (hücre örgü) → kasnak üstünde tuğla kirpi saçak → kasnak yüzlerinin dışına taşan, **düz yüzlü sekizgen kurşun etek (8 trapez yüz, düz eğim)** → kubbe. Kubbe etekten çıkan **basık kubbe** (yükseklik/yarıçap ≈ 0,6–0,7), kurşun dilimli | F: `ts_17ekim_6_tepeden` (sekizgen etek çizgileri), `ts_17ekim_b_19`, `ts_17ekim_c_22`; P/Y: Ayverdi kesit ve ön cephe; W: Yurt PDF 71–72 | **v06 uygulandı** (v05: dairesel, içbükey çan etek; kirpi saçak kaldırılmıştı) |
| 7 | Kubbe pencereleri | Harim kasnağı: 8 yüzün 7'sinde pencere, **güney yüzü sağır**. Tabhane kasnakları: **2'şer** (batıda G + B, doğuda G + D). Mihrap kubbesi: 3 (E; kaynaklar 3/4/7 çelişiyor, kullanıcı onayı 19 Ekim) | W: Yurt PDF 71 «yedi adet pencere bulunmaktadır ve bunlardan güneydeki sağırdır», «batıda bulunanın kubbe kasnağında biri güney yönünde diğeri batı yönünde toplam iki pencere»; mihrap: E PDF 102 «üç», Yurt PDF 72 «dört», Vakıf PDF 84 «yedi» | **v06 uygulandı** (v05: harimde kuzey sağır; tabhanede 3) |
| 8 | **Şadırvan (cami önü)** | Kuzeyde, cami ekseninde; mermer sekizgen platform, 8 ahşap direk ve aralarında ahşap kemerler, geniş sekizgen kurşun saçak, üstünde alçak sıvalı kasnak, kurşun kubbe ve alem; ortada çokgen mermer havuz | E: C1 PDF 103 «ahşap çatısı ve bezemeli kubbesiyle özgün haline kavuşturulmuştur»; W: Yurt PDF 70 «sekizgen planlı bir şadırvan», PDF 72 «geniş bir saçakla örtülmüştür»; W: Budak 2018 (arşiv planında sekizgen şadırvan); F: `ts_17ekim_3_havadan_kuzey`, `ts_17ekim_4_revak_ici`, `envanter_c1_pdf096` | **v06 uygulandı (yeni; kullanıcı isteği, 19 Ekim)** |
| 9 | Minare | Kuzeydoğu; tuğla çokgen gövde, şerefe altı 2 sıra stalaktit, sivri kurşun külah | E: C1 PDF 103; F | Korunur |
| 10 | Bugünkü hâl | 2020–23 restorasyonu sonrası: almaşık açık, son cemaat yeri kubbeli (3 kubbe + 2 aynalı tonoz) | Tasarım sorumlusu (B1); E; F | Korunur |
| 11 | Zemin, palet, figür, çevre | `../_GENEL_SAHNE_STANDARDI.md` | Kullanıcı (18 Ekim) | **v06 uygulandı** |

## 2. Kaynaklar

Kaynak önceliği: P rölöve > E envanter > W tez/makale > O OSM > M maket > F fotoğraf > T tahmin. Ayrıntılı kayıt `ref/kaynak_dizini.json`.

| Kaynak | Sayfa | Bu klasörde | Kullanım |
|---|---|---|---|
| Bursa Vakıf Eserleri Envanteri Cilt 1 | PDF 96–103 | `ref/metin/envanter_c1.md`, `ref/foto/envanter_c1_*` | Plan tipi, son cemaat yeri ölçüsü, duvar örgüsü, pencereler, kubbeler, minare, şadırvan |
| Yurt 2024, *Orhan Gazi Dönemi Mimarisinde Sultan Yapıları* (YL tezi) | metin PDF 64–72; çizim PDF 213–219; levha PDF 277–289 | `ref/metin/yurt2024.md`, `ref/plan/yurt2024_*`, `ref/foto/yurt2024_*` | **Ayverdi plan, kesit ve cepheleri** (ölçekli), Acar planı, son cemaat yeri örgüsü, kasnak pencere sayıları, şadırvan |
| Türkiye'de Vakıf Abideler ve Eski Eserler III (VGM 1983) | PDF 83–85 | `ref/metin/vakif_1983.md`, `ref/plan/vakif_1983_pdf085_plan.png` | Kirpi saçak, kurslar, ikiz kemer alınlığı motifleri (OCR hatalı, PDF'e bakılmalı) |
| Budak 2018, *Onarımın Tarihi Görsellerden Okunması: Bursa Orhan Camisi* | PDF 1–24 | `ref/metin/budak2018.md`, `ref/plan/budak2018_pdf009_plan_gabriel.png`, `ref/foto/budak2018_pdf004_*` | Onarım tarihleri, Gabriel planı, arşiv planındaki sekizgen şadırvan |
| Alan Başkanlığı föyü N1 (`veri/bursa/hanlar-bolgesi.pdf`) | PDF 3 | `ref/metin/alan_baskanligi.md`, `ref/foto/alan-baskanligi_pdf003_foy.png` | Kimlik, onarımlar |
| Tasarım sorumlusunun fotoğrafları (17 Ekim) ve web fotoğrafları | — | `ref/foto/ts_17ekim_*`, diğerleri | Bugünkü hâl, cephe katmanları, kubbe eteği, şadırvan |
| Yandex 3B modeli | — | `ref/maket/` | Yalnız biçim karşılaştırması |

**Çizim ölçekleri (önceki doğrulama):** Ayverdi planı 47,4 px/m (son cemaat genişliği 25,7 ↔ E 25,80, güvenilir). Yan cephe (PDF 217 alt) 33,2 px/m, uzunluk planla tutarlı → yükseklik kaynağı. Ön cephe (PDF 218) çubuğu %4,7 hatalı → plan genişliğiyle × 0,955. Kesit (PDF 217 üst) çubuğu %9 hatalı → yalnız biçim. Ayrıntı: Ek "Kaynak çizimlerin ölçeği".

## 3. Ölçü analizi (19 Ekim 2026)

### 3.1 Son cemaat yeri kuzey cephesinin katmanları (fotoğraf `ts_17ekim_2_kuzeybati_revak`, `ts_17ekim_b_11`, `b_13`, `yurt2024_pdf277`, `pdf281`)
Aşağıdan yukarıya:
1. **Sofa kaidesi** 0 → +0,9: düz açık taş, yan gözlerde demir parmaklık (E PDF 98 «zeminden yaklaşık 90 cm daha yüksek ... demir parmaklıkla çevrili»).
2. **Ayaklar ve köşe payeleri** +0,9 → kemer üzengisi (+4,5; taç göz +4,9): **iri kesme taş**, açık krem, tuğla sırası yok. Köşe payeleri saçağa kadar kesme taş köşe taşlarıyla çıkar; ayakların üstünde ince taş başlık silmesi.
3. **Kemerler**: tek merkezli sivri (Yurt PDF 70); kemer taşları açık taş ve kırmızı tuğla dilimleri sırayla, dışında tuğla kemer bandı. Orta (taç) göz daha yüksek; tuğla zikzaklı (Vakıf PDF 84).
4. **Üst duvar** üzengiden saçak altına: **1 sıra kesme taş (≈ 0,30 m) + 3 sıra tuğla (≈ 0,20 m)** tekrarı (W Yurt PDF 72); fotoğrafta taş sıraları arasında yer yer dikey tuğla.
5. **Kurslar**: kemer aralarında ve köşelerde Ø ≈ 1,0 m tuğla güneş kursları (rozet); orta gözün üstünde 1381 tamir yazısı (Budak PDF 4).
6. **Saçak** (+9,0 → +9,4): **2 sıra kirpi (testere dişi) tuğla**, ≈ 0,15 m dışa taşar; altında ince taş silme. Kullanıcının "kiremit tarzı çizgi" dediği bant budur.
Yan cepheler (doğu, batı) aynı katman düzeni; ikiz kemerin alınlığı doğuda baklava, batıda dama (Vakıf PDF 84; E PDF 100).

### 3.2 Büyük kubbeler ve kasnak birleşimi (tepeden fotoğraf `ts_17ekim_6_tepeden`, F ±%10)
Fotoğraf neredeyse dik; ölçek son cemaat yeri genişliği (583 px ≈ 25,7 m → 22,7 px/m; çatı seviyesi kameraya daha yakın, değerler biraz büyük çıkar).

| Kubbe | Sekizgen etek dış çizgisi (D–B × K–G) | Etekten görünen kubbe dairesi Ø | Model v05 (kasnak / kubbe Ø) |
|---|---|---|---|
| Harim (sofa) | ≈ 11,0 × 12,4 | ≈ 8,6 | 10,2 / 9,8 |
| Mihrap | ≈ 13,2 × 12,6 | ≈ 8,5 | 10,4 / 9,6 |
| Batı tabhane | ≈ 7,4 × 9,9 (K–G uzun sekizgen) | ≈ 5,3 | 6,2 / 5,8 |

Okuma: (1) etek **sekizgen ve düz yüzlüdür**, kasnak yüzlerinin ≈ 0,4–0,6 m dışına taşar; v05'teki daire planlı çan etek yanlış. (2) Kubbe dairesi kasnağın ≈ %80'i; kubbenin alt kısmı eteğin altında kalır. (3) Mihrap kubbesinin eteği harimdekinden geniştir (W Yurt PDF 72: mihrap kubbesi «sofa bölümünün kubbesinden daha geniş ve alçak»). (4) Tabhane örtüsü dikdörtgen mekân üzerindedir (6,05 × 9,10, E PDF 101); etek K–G yönünde uzun sekizgen. Doğu tabhane gölgede; simetrik kabul (Ayverdi ön cephe).
Yükseklik: Ayverdi değerleri (kasnak üstü 13,5, tepe 16,5) ile kubbe yarıçapı ≈ 4,3 birleşince kubbe yükseklik/yarıçap ≈ 0,6–0,7 çıkar; fotoğraf `ts_17ekim_c_22` ve `b_19` ile uyumlu (basık kubbe, belirgin sekizgen etek).

### 3.3 Şadırvan (fotoğraflar `ts_17ekim_3_havadan_kuzey`, `ts_17ekim_4_revak_ici`, `ts_17ekim_6_tepeden`, `envanter_c1_pdf096`)
- Konum: cami ekseninde, son cemaat yeri ön yüzünden ≈ 8,5 m kuzeyde (merkez; F, tepeden).
- Platform: beyaz mermer, sekizgen, 1–2 basamak (≈ 0,3 m).
- Taşıyıcı: 8 **ahşap direk** (koyu kızıl kahve), direkler arasında oymalı ahşap sivri/kaş kemerler ve üstte ahşap friz. Yurt PDF 72 «çokgen taş ayaklar» diyor; 2020–23 restorasyonu sonrası fotoğraflarda ahşap direk görülüyor (E PDF 103 «ahşap çatısı») → fotoğraf seçildi.
- Saçak: geniş, düz yüzlü sekizgen kurşun saçak; tepeden dış çizgi ≈ 9–10 m (F).
- Üst: saçak üstünde alçak, açık renk sıvalı sekizgen kasnak; üstünde kurşun dilimli kubbe (hafif etekli) ve alem.
- Orta: sekizgen/çokgen beyaz mermer havuz, kenarlarında musluklar, ortada fıskiye sütunu; çevresinde abdest taburesi yeri.
- Çevre: çim ve taş yollar, büyük çınarlar (fotoğraf `ts_17ekim_3`).
- Not: caminin doğusunda ayrıca çinili, düz geniş saçaklı bir çeşme yapısı var (`envanter_c1_pdf099`); kaynakta tanımı yok, **modele girmez**. Vakıf 1983'teki «mermer duvarlarda çiniler» notu bu yapıya ya da şadırvanın eski hâline ait olabilir.

### 1.1 v06'da uygulananlar (19 Ekim 2026, kullanıcı onaylı)
**Mihrap kubbesi kasnak penceresi sayımı.** Kaynaklar çelişiyor; fotoğraflardan yalnız bazı yüzler görülebiliyor.

| Kaynak | Ne diyor / görünen | Sonuç |
|---|---|---|
| E C1 PDF 102 | «üç pencere» | 3 |
| W Yurt PDF 72 | «dört» | 4 |
| Vakıf PDF 84 | «yedi» | 7 |
| Ayverdi batı çizimi (`yurt2024_pdf217`) | batı yüzde ortada tek pencere, çaprazlarda yok | 7'yi dışlar; 3 ile 4'ü ayıramaz |
| `ts_17ekim_b_20`, `yurt2024_pdf289` | güney ve doğu yüzlerde birer pencere | G, D var |
| `ts_17ekim_c_22`, `b_19` | mihrap kasnağı ağaçlarla kısmen kapalı | kuzey yüz net değil |

Karar (kullanıcı): **3 pencere** (güney, doğu, batı). Mihrap kubbesi oranı: yükseklik/yarıçap 0,244 (< 0,35); kotlar değiştirilmedi (Ayverdi bindirmesi ±0,3 m; kubbe oturma kotu 13,36, tepe 14,4).

**Büyük kubbeler (kasnak üstü / etek dudağı yüzden yüze / oturma Ø / tepe / oran):** harim 13,5 / 11,1 / 8,36 / 16,5 / 0,56; mihrap 12,7 / 11,3 / 8,53 / 14,4 / 0,24; tabhane 9,1 / 6,96 (plan 7,1: harim duvarına girmesin diye 0,38 m dudak) / 5,08 / 10,5 / 0,36. Etek: 8 düz trapez yüz, ≈ 22°.

**Şadırvan ölçüleri (F fotoğraf oranı, T; rölöve yok):** merkez X = 0, son cemaat ön yüzünden 8,5 m kuzeyde (Y ≈ 25,25); platform sekizgen yüzden yüze 8,0, iki basamak 0,15 + 0,15; 8 direk (çevre yarıçapı 3,2, kesit 0,28, kot 0,30 → 3,55); kaş kemer üzengi 2,6 / tepe 3,2; saçak yüzden yüze 9,4, kot 3,65, kalınlık 0,12; kasnak yüzden yüze 4,6, kot 4,5 → 5,3; kubbe Ø 4,4, tepe 7,6; havuz yüzden yüze 2,6, yükseklik 0,9; 8 musluk, 8 tabure. Fotoğrafta saçak dudakta yukarı kıvrılıyor, kubbe çan gibi açılıyor; model düz yüzlü (plan).

**Kullanıcı kararları (ölçü kaynağı yok):** kubbe/çatı kurşun rengi `#858E94` (standart `#C3C9CD` çok açık bulundu); minare 22,4 → 24,0 m, şerefe beyaz mermer, kısa ve ince (şerefe z 20,2–20,9, R 1,25); minare gövdesi Ulu Cami tipi sıralı tuğla; kaide bandı kaldırıldı (duvar zemine iner); doğu yüz: 3 girinti, ortada kapı (1,4 × 2,9), pencere yok; batı yüz: 3 girinti, eşit boy ve aralık, üst/alt pencere düzeni kullanıcı tarifine göre.

Bütçe: 20 130 üçgen, 57 draw call, GLB 335 KB (sunum 340 KB). Düz renkli malzemeler tek `Duz` malzemede toplandı (mermer, su, alem, demir roughness 0,70).

## Ek: Geçmiş kayıt (17 Ekim 2026, cami v01–v05)

> Bu ekteki değerler tarihsel kayıttır. v05'in kubbe eteği (daire planlı çan), tek bant saçak, ızgara almaşık dokusu ve kasnak pencere sayıları §1'e göre **değişecektir**. Ölçü tabloları (plan ve yükseklikler) hâlâ geçerlidir. Hamam ve Emir Hanı bölümleri kendi klasörlerinin notlarına taşındı. v01–v04 dosyaları silindi; yalnız v05 `3d/` altında. Eski `tasarim/3d-eser/bursa/...` ve `bursa/ref/...` yolları bu ağaçta yoktur. Eski "Klasör düzeni" bölümündeki `3d/kontrol/kaynak/` okuma görselleri `ref/plan/okuma_*` adıyla taşındı.


Ölçü ve kaynaklar: `eser.md`. Bu dosya model kararlarını ve varsayımları tutar. Sürüm bölümleri tarih sırasıyladır; en günceli en sondadır.

### GÜNCEL DURUM (17 Ekim 2026, cami v01 kütle turu)
- **Son sürüm:** `3d/build/build_v01.py` (cami kütlesi) → `3d/blend/orhan-bey-camii_v01.blend`, kontrol `3d/kontrol/v01/` (GECTI: true, 2 350 üçgen, 30 draw call). .glb henüz yok (v02'de).
- **Bindirme:** `3d/build/yan_yana.py v01` → `kontrol/v01/bindirme_bati_orto.png`, `bindirme_kuzey_orto.png` (render ile Ayverdi çizimi aynı ölçekte, 35 px/m, zemin hizalı).
- **Üretim:** `blender -b --python 3d/build/build_v01.py` (Blender 5.2).
- **Cami kütlesi donduruldu (GEOMETRİ DONDURMA v01, 17 Ekim).**
- **Hamam v01 kütlesi hazır:** `../orhan-bey-hamami/3d/build/build_hamam_v01.py` → `../orhan-bey-hamami/3d/blend/orhan-bey-hamami_v01.blend`, kontrol `../orhan-bey-hamami/3d/kontrol/hamam_v01/` (GECTI: true, 1 700 üçgen, 14 draw call). Bindirme: `../orhan-bey-hamami/3d/build/yan_yana_hamam.py`. **Hamam donduruldu (GEOMETRİ DONDURMA hamam v01).**
- **Emir Hanı v01 kütlesi hazır:** `../emir-han/3d/build/build_emir_v01.py` → `../emir-han/3d/blend/emir-hani_v01.blend`, kontrol `../emir-han/3d/kontrol/emir_v01/` (GECTI: true). **Donduruldu (GEOMETRİ DONDURMA Emir Hanı v01).**
- **Cami v02 detay hazır:** `3d/build/build_v02.py` → `3d/export/orhan-bey-camii_v02.glb` (Draco, 131 KB), `3d/blend/orhan-bey-camii_v02.blend`, kontrol `3d/kontrol/v02/` (GECTI: true, 8 538 üçgen, 44 draw call). Dokular `3d/build/doku/doku_uret.py`. **Kabul edildi.** v02b kusur turu: saçak z-fighting düzeltmesi (`export/orhan-bey-camii_v02b.glb`, 132 KB).
- **Cami v03 (son cemaat yeri revizyonu) hazır:** `3d/build/build_v03.py` → `3d/export/orhan-bey-camii_v03.glb` (160 KB), kontrol `3d/kontrol/v03/` (GECTI: true, 11182 üçgen, 49 draw call). Teslimde v03 kullanılmalı (kabul edilirse).
- **Cami v04 (kubbe, kasnak, pencere detayı) hazır:** `3d/build/build_v04.py` → `3d/export/orhan-bey-camii_v04.glb` (172 KB), kontrol `3d/kontrol/v04/` (GECTI: true, 12100 üçgen, 50 draw call).
- **Cami v05 (kubbe eteği) hazır:** `3d/build/build_v05.py` → `3d/export/orhan-bey-camii_v05.glb` (193 KB), kontrol `3d/kontrol/v05/` (GECTI: true, 13294 üçgen, 49 draw call).
- **Hamam v02 detay hazır:** `../orhan-bey-hamami/3d/build/build_hamam_v02.py` → `../orhan-bey-hamami/3d/export/orhan-bey-hamami_v02.glb` (Draco, 60 KB), kontrol `../orhan-bey-hamami/3d/kontrol/hamam_v02/` (GECTI: true, 3 204 üçgen, 20 draw call). Sıradaki: hamam v02 göz kontrolü, sonra Emir Hanı v02.
- Kaynak turu (B1) özeti aşağıda; çizimler `ref/plan/yurt2024_pdf21*`, okumalar `ref/plan/okuma_`.

### Klasör düzeni

17 Ekim dosyalama güncellemesi: Cami üretimi burada; [hamam](../orhan-bey-hamami/eser.md) ve [han](../emir-han/eser.md) ayrı eser klasörlerinde. Aşağıdaki eski sürüm açıklamaları üretim geçmişidir; güncel dosya konumları eser README’lerinde listelenir.

- `3d/build/build_vNN.py`: üretim betiği (bütün ölçüler en üstteki `P` sözlüğünde)
- Her yapı ayrı dosya: `3d/blend/<yapi>_vNN.blend` · `3d/export/<yapi>_vNN.glb` (`orhan-bey-camii`, `orhan-bey-hamami`, `emir-hani`) · `3d/kontrol/vNN/`. Sürüm numarası külliye için ortak; her tur tek yapıya bakar.
- `ref/plan/okuma_`: ızgaralı plan/cephe okumaları, OSM
- `ref/foto/`: 13 fotoğraf, **hepsi cami** (hamam ve han fotoğrafı yok)
- Eksenler: +X doğu, +Y kuzey; birim metre. Her .glb'nin orijini kendi ayak izi kutusunun ortası; külliyedeki yeri § 4 yerleşim tablosunda (OSM yerel koordinatı: boylam 29.0620, enlem 40.1838).

### Kaynak çizimlerin ölçeği ve doğruluğu
| Çizim | Ölçek | Kontrol | Sonuç |
|---|---|---|---|
| Cami planı (Ayverdi) | 5 m = 237 px → 47,4 px/m (200 dpi) | genişlik 25,7 m ↔ E son cemaat yeri 25,80 m | **güvenilir (P)** |
| Cami yan cephe (Ayverdi, s.217 alt) | 5 m = 166 px → 33,2 px/m | uzunluk 33,4 m ↔ plan 33,5 m | **güvenilir; yükseklik kaynağı** |
| Cami ön cephe (Ayverdi, s.218) | 5 m = 200 px → 40,0 px/m | genişlik 26,9 m ↔ plan 25,7 m (+%4,7) | çubuk hatalı; plan genişliğiyle ölçeklenir (× 0,955) |
| Cami kesiti (Ayverdi, s.217 üst) | 5 m = 172 px → 34,4 px/m | uzunluk 30,7 m ↔ plan 33,5 m (−%9) | çubuk hatalı; yalnız biçim için |
| Hamam planı (Çetintaş) | 5 m = 245 px → 49,0 px/m | E soğukluk 11,95 × 11,86 ile karşılaştırılacak (v01 hamam turu) | P (ön okuma) |
| EHA 1967 vaziyet planı | 75 m = 305 px → 4,07 px/m (yatay) | yatay: cami 26 m ✓, Emir Hanı 45,5 m ✓; **dikey ≈ 0,7 basık** (cami 24,6 m ↔ 33,5) | yalnız yerleşim sırası; konum OSM'den |

Plan yönü: Ayverdi ve Acar planlarında **kuzey aşağıda** (son cemaat yeri altta, mihrap üstte); planda sol = doğu. Minare planın sol alt köşesinde (sarmal merdiven) → **kuzeydoğu** (E ile tutarlı). Yan cephede (s.217) kuzey solda.

### 1. Orhan Bey Camii · ölçü tablosu
Kaynak kodu: P = Ayverdi planı (±0,2 m), Y = Ayverdi yan cephesi (±0,3 m), E = envanter cilt-1, O = OSM, F = fotoğraf, H = hesap, T = tahmin.

#### Plan
| Ölçü | Değer | Kaynak | Not |
|---|---|---|---|
| Plan tipi | zaviyeli (ters T): 5 gözlü son cemaat yeri + orta harim + mihraplı ibadet mekânı + iki yanda tabhaneler | E, P | |
| Toplam dış ölçü (D–B × K–G) | **25,7 × 33,5 m** | P | O 27,0 × 35,5 (fark 1,3 / 2,0 m; OSM merdiven ve kaideyi de alıyor olabilir) |
| Son cemaat yeri | 25,7 × 6,5 m, 5 göz | P | E 25,80 × 6,30 |
| Ana gövde (tabhaneler dahil) | 25,7 × 15,5 m | P | |
| Mihrap bloğu (güneye çıkıntı) | dış 11,3 (D–B) × 11,5 (K–G) m | P | iç ≈ 8,9 m; E 9,64 × 8,83 |
| Harim orta mekânı | 8,90 × 9,90 m | E | P ile tutarlı |
| Tabhaneler (doğu, batı) | ≈ 6,05 × 9,10 m, kubbeli | E | |
| Duvar kalınlığı | 1,1–1,5 m | P | |
| Minare | kuzeydoğu, son cemaat yeri ile ana gövdenin birleştiği köşede; gövde Ø ≈ 2,0 m, çokgen | P, Y, E | |
| OSM | way 255187109; uzun eksen kuzeyden ≈ 16° doğuya dönük | O | |

#### Yükseklikler (Y, yan cephe; zemin 0)
| Parça | Saçak / kasnak üstü | Kubbe tepesi (alemsiz) | Alem ucu |
|---|---|---|---|
| Son cemaat yeri | saçak 9,4 | örtü tepesi 11,8 | — |
| Yan kanatlar (tabhane bölümü) | saçak 7,6; tabhane kasnağı 9,1 | 10,5 | — |
| Harim orta kubbe | kasnak üstü 13,5 | **16,5** | 19,1 |
| Mihrap bloğu kubbesi | duvar 10,2; kasnak 12,7 | **14,4** | 17,1 |
| Minare | şerefe 18,8–19,8; petek üstü 22,4 | külah 23,3 (çizimdeki eski kısa külah) | 24,4 |
| Kaide (subasman) | ≈ 0,8–1,0 | | |
Ön cephe (× 0,955 ölçeklenmiş) aynı değerleri ±0,5 m içinde veriyor (saçak 9,4; orta kubbe 16,2; minare külahı 23,8).

#### Bugünkü hâl (fotoğraf, 2020–23 restorasyonu sonrası: `ref/foto/IMG_8460`, `IMG_8484`)
- Duvarlar açıkta **almaşık**: moloz/kesme taş + yatay ve dikey tuğla (kırmızı tuğla bantlar belirgin). 2019 öncesi fotoğraflarda kasnaklar sarı sıvalı ve minare sıvalıydı; restorasyonda sıva kaldırılmış.
- Kasnaklar sekizgen/kare, almaşık; kubbeler kurşun.
- Minare: kırmızı tuğla gövde, **uzun sivri kurşun külah** (Ayverdi çizimindeki kısa soğan külahtan farklı). F ile kaba ölçüm: külah ≈ 2,4 × gövde genişliği ≈ 4,5–5 m.
- Son cemaat yeri: dışta **kurşun kırma çatı** (fotoğraf 0 ve IMG_8460); Ayverdi ön cephesinde parapet arkasından kubbeler görünüyor. Çatı içte kubbe ve aynalı tonozları örtüyor.
- Doğu cephesinde tuğla-taş baklava, batıda dama motifleri; ön cephede 5 kemer, ortada daha yüksek taç kemer (E, Y).

### 4. Yerleşim (OSM yerel koordinat, m; +X doğu, +Y kuzey)
| Yapı | Merkez (x, y) | Not |
|---|---|---|
| Orhan Bey Camii | (177, 13) | |
| Orhan Bey Hamamı | (81, 72) | |
| Emir Hanı | (−27, 92) | |
| (Koza Han, ayrı model) | ≈ (194, 74) | camiyle hamam arasında, ayrı eser |
| (Ulucami, ayrı model) | (−20, 14) | |
Cami ↔ hamam ≈ 110 m, hamam ↔ Emir Hanı ≈ 110 m, cami ↔ Emir Hanı ≈ 215 m. Külliye kapsamı ≈ 260 × 130 m; arada başka eserler (Koza Han, Ulucami, çarşı) var.

### Kaynak çelişkileri (2 m'den fazla)
1. **Hamam:** Çetintaş planı 25,7 × 27,3 ↔ OSM 23,3 × 34,9 m. Öneri: plan (P); OSM yalnız konum.
2. **Emir Hanı:** envanter 45 × 45 ↔ OSM 57,5 × 50,9 m. Öneri: çekirdek 45 × 45 (E), çevredeki dükkân sıraları ayrı ve sade (EHA'da görünüyor).
3. **Cami minaresi:** Ayverdi çizimi kısa külah (tepe 23,3) ↔ bugünkü uzun sivri külah (F). Öneri: bugünkü hâl.
4. **Cami son cemaat yeri örtüsü:** Ayverdi ön cephesi kubbeler ↔ bugün kurşun kırma çatı (F). Öneri: bugünkü hâl.
(Cami toplam ölçüsünde P ↔ O farkı 1,3 / 2,0 m; sınırda, P kullanılır.)

### Parça listesi önerisi (.glb)
| Ad | İçerik |
|---|---|
| `Cami_Govde` | ana gövde + mihrap bloğu duvarları |
| `Cami_SonCemaat` | 5 gözlü revak, kemerler, kırma çatı |
| `Kubbe_Ana` | harim orta kubbesi + kasnağı (vurgu 1) |
| `Kubbe_Mihrap` | mihrap bloğu kubbesi + kasnağı |
| `Kubbe_Tabhane_D`, `Kubbe_Tabhane_B` | tabhane kubbeleri |
| `Minare_1` | kuzeydoğu minaresi |
| `Hamam` | hamam gövdesi |
| `Hamam_Kubbeler` | hamam kubbeleri (vurgu 2) |
| `Emir_Hani` | han kütlesi (B kademe) |
| `Zemin` | kaide (.glb'ye girmez) |

### Tur planı (öneri)
1. **v01 cami kütlesi** (tek konu): plan + yükseklik tablosu, pencere yok. Yan cephe ve ön cephe ortografik render çizimle yan yana; havadan; kubbe yakın.
2. v01b gerekirse → **cami dondurma**.
3. **v02 hamam kütlesi**, **v03 Emir Hanı kütlesi** (sade, B kademe).
4. **v04 yerleşim** (soru 1'in cevabına göre), sonra detay + palet + .glb.

### VARSAYIM listesi (şimdiden)
- VARSAYIM: cami bugünkü (2020–23 restorasyonu sonrası) hâliyle modellenir; yükseklikler Ayverdi yan cephesinden, minare külahı ve son cemaat yeri çatısı fotoğraftan.
- VARSAYIM: zemin düz kaide (arazi eğimi kaynakta yok).
- VARSAYIM: Emir Hanı saçak ≈ 9,5 m (kaynak yok).
- VARSAYIM: yok olmuş imaret, zaviye, medrese, mektep modele girmez.

### Açık sorular (B1 sonu)
1. **Yerleşim:** üç yapı ≈ 260 × 130 m'lik alana dağılmış, araları Koza Han ve Ulucami ile dolu. (a) üç yapı **ayrı ayrı .glb**, yerleşim tablosuyla (öneri); (b) tek .glb, gerçek konumlarında, aralar boş zemin; (c) tek .glb, yapılar birbirine yaklaştırılmış şematik dizilim.
2. **Hangi hâl:** cami bugünkü (restorasyon sonrası) hâliyle mi (öneri), Ayverdi çizimindeki hâliyle mi? (Minare külahı ve son cemaat yeri çatısı farklı.)
3. **Kademe:** cami A (vitrin), hamam ve Emir Hanı B (sade) uygun mu?
4. **Ölçü seçimi:** hamam için Çetintaş planı, Emir Hanı için envanterdeki 45 × 45 m çekirdek (+ sade dükkân sıraları) kullanılsın mı?
5. **Ek fotoğraf:** hamam (Aynalı Çarşı) dıştan ve havadan, Emir Hanı avlusu ve dış cephesi. Şu an 13 fotoğrafın hepsi cami.
6. **Sıra:** önce cami v01 kütlesi, hamam ve han sonra. Uygun mu?

#### B1 cevapları (tasarım sorumlusu, 17 Ekim 2026)
1. Üç yapı **ayrı ayrı .glb**, yerleşim tablosuyla (§ 4).
2. Cami **bugünkü hâliyle** (2020–23 restorasyonu sonrası): sivri kurşun külah, son cemaat yerinde kurşun kırma çatı, açık almaşık duvar.
3. Kademe: cami **A**, hamam ve Emir Hanı **B**.
4. Hamam: **Çetintaş planı**. Emir Hanı: **45 × 45 m** (E).
5. Sıra: önce cami v01 kütlesi.

### v01 · cami kütle turu (17 Ekim 2026)
Betik: `3d/build/build_v01.py`. Pencere, kemer ve süs yok; son cemaat yeri kapalı kütle. Sonuç `3d/kontrol/v01/`:
- `kontrol_rapor.json`: 2 350 üçgen, 30 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 8 yönde 0 → **GECTI: true**
- Render: `havadan`, `foto_acisi` (ref `1578396115`, kuzeydoğudan), `foto_acisi_2` (ref `IMG_8460`, doğudan), `kuzey_orto`, `bati_orto`, `ust_orto`, `kubbe_yakin`
- Bindirme: `bindirme_bati_orto.png` (Ayverdi yan cephe), `bindirme_kuzey_orto.png` (Ayverdi ön cephe); yan yana: `yan_yana_*_orto.png`, `yan_yana_foto.png`, `yan_yana_foto_2.png`

Parçalar: `Cami_SonCemaat` (kütle + kurşun kırma çatı), `Cami_Koridor` (kuzey bandı), `Cami_Kanat_D`, `Cami_Kanat_B`, `Cami_Harim`, `Cami_Mihrap`, `Kubbe_Ana`, `Kubbe_Mihrap`, `Kubbe_Tabhane_D`, `Kubbe_Tabhane_B`, `Kubbe_Giris`, `Minare_1` (+ `Zemin`, `Zemin_Golge`; .glb'ye girmez).

Bindirme sonucu (yan cephe, doğrulanmış ölçek): son cemaat yeri saçağı, kanat saçağı (7,6), harim ve mihrap kasnakları, iki kubbenin tepesi, tabhane kubbesi ve toplam uzunluk çizimle **0,1–0,3 m** içinde örtüşüyor. Ön cephede genişlik, kasnak ve orta kubbe örtüşüyor.

#### Tur içi düzeltmeler
1. **Kasnak çakışması** (kontrol): giriş ve doğu tabhane kasnakları harim bloğuna 0,3 m taşıyordu → tabhane kasnağı 6,6 → 6,2 m (merkezler u 4,0 / 21,7), giriş kasnağı 4,6 → 4,0 m.
2. **Minare yeri** (P'den, yan cephe bindirmesi): gövde ekseni kuzey kenarından 7,6 değil **8,3 m** (planda sarmal merdiven çizimi minare gövdesinin eksenini vermiyor). u = 1,3 aynı.

#### Yeni VARSAYIM'lar
- VARSAYIM: yan kanat, koridor, harim ve mihrap bloğu çatıları v01'de düz kurşun. Fotoğrafta (IMG_8460) kanatlarda basık kurşun kırma çatılar var → v02 detay.
- VARSAYIM: kasnaklar pahlı kare (sekizgene yakın); kasnak ve kubbe ölçüleri yan cepheden, planla ±0,5 m.
- VARSAYIM: giriş bölmesi kubbesi (koridor ortasında) kasnak 9,0, tepe 11,0 m; ön cephe ve yan cepheden kaba okuma.
- VARSAYIM: minare yan kanat çatısından (7,55 m) başlar; altı duvar içinde. Külah 3,8 m (F), şerefe 18,8–19,8 m (Y).
- VARSAYIM: kaide/subasman (≈ 0,8–1,0 m) v01'de yok.

#### Açık sorular (v01 sonu)
1. **Kanat çatıları:** fotoğraftaki basık kırma çatılar v02 detayında mı eklensin (öneri), yoksa kütleye mi girsin? Kütleye girerse kasnakların alt kısmı çatıya gömülür.
2. **Son cemaat yeri kırma çatısı:** mahya 11,8 m (Ayverdi yan cephesindeki örtü tepesi). Fotoğrafta (1578396115) daha basık görünüyor; 11,0 m'ye inilsin mi?
3. Kütle kabul edilirse: "GEOMETRİ DONDURMA v01 (cami)", sonra hamam v01.

### GEOMETRİ DONDURMA v01 · cami (17 Ekim 2026)
Kütle tasarım sorumlusu tarafından kabul edildi. `build_v01.py` içindeki cami kütle ölçüleri (P tablosu) bundan sonra değişmez; cami v02 ve sonrası yalnız detay, renk ve çıkış ekler. Dondurmadan sonra çıkan kütle kusurları ayrı "kusur turu"nda, biçim değiştirmeden düzeltilir.

#### Kararlar (bu oturum)
1. Üç yapı ayrı .glb; külliyedeki yerleri § 4 yerleşim tablosunda (OSM konumu).
2. Cami bugünkü (2020–23 restorasyonu sonrası) hâliyle; kademe A. Hamam ve Emir Hanı B.
3. Cami ölçü kaynağı: Ayverdi planı (25,7 × 33,5 m) ve yan cephesi (yükseklikler); ön cephe ve kesit çubukları hatalı, kullanılmaz.
4. Son cemaat yeri: kurşun kırma çatı, saçak 9,4 m, mahya **11,8 m** (kalır).
5. Yan kanat ve koridor saçağı 7,6; harim ve mihrap bloğu 10,2; ana kubbe kasnak 13,5 / tepe 16,5; mihrap kubbesi kasnak 12,7 / tepe 14,4; tabhane kubbeleri kasnak 9,1 / tepe 10,5.
6. Minare kuzeydoğuda, eksen (u 1,3; v 8,3); bugünkü sivri kurşun külah (3,8 m, F).
7. **Yan kanat basık kurşun kırma çatıları v02 detayında** eklenecek (kütleye girmez).
8. Hamamda Çetintaş planı, Emir Hanı'nda 45 × 45 m (E).

### GEOMETRİ DONDURMA hamam v01 (17 Ekim 2026)
Hamam kütlesi tasarım sorumlusu tarafından kabul edildi. `build_hamam_v01.py` içindeki kütle ölçüleri bundan sonra değişmez; v02 yalnız detay, renk ve çıkış ekler.

#### Kararlar
1. Plan Çetintaş ×1,38 (E oda ölçüleriyle kalibre), yükseklikler Ayverdi kesiti ×1,16; çarşı ekleri modelde yok.
2. Erkekler soğukluğu: duvar 8,6, kubbe tepesi 16,2, fener 17,2 m. Kadınlar soğukluğu: duvar 7,5, tepe 14,1 m (VARSAYIM). Alçak kütle 5,6 m; sıcaklık kubbesi 9,5, ılıklık 9,2 m.
3. **Küçük halvet ve eyvan kubbeleri eklenmez** (v02'de de); alçak kütle düz kurşun dam.

### v02 · cami detay + renk + çıkış (17 Ekim 2026)
Betik: `3d/build/build_v02.py` (= v01 kütlesi birebir + detay; yeni ölçüler P'de `D_` önekli). Sonuç `3d/kontrol/v02/`:
- `kontrol_rapor.json`: 8 538 üçgen (≤ 30 000), 44 draw call (< 50), açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 8 yönde 0 → **GECTI: true**
- `.glb` (Draco): `3d/export/orhan-bey-camii_v02.glb` 131 KB (≤ 1 MB); AO vertex rengine pişirildi
- Render: `havadan`, `havadan_guneybati`, `foto_acisi`, `foto_acisi_2`, `kuzey_orto`, `bati_orto`, `revak_yakin`, `kubbe_yakin`
- Bindirme (`yan_yana.py v02`): `bindirme_bati_orto.png` (Ayverdi yan cephesi: sağır kemerler, mihrap bloğu pencereleri, kasnak pencereleri ve ikiz kemer yerinde), `bindirme_kuzey_orto.png`; fotoğrafla: `yan_yana_foto.png`, `yan_yana_foto_2.png`

#### Eklenenler
| Parça | İçerik | Kaynak |
|---|---|---|
| `Revak_SonCemaat` | kuzeyde 5 sivri kemer (yanlar üzengi 4,5 / tepe 6,6; orta taç kemer 4,9 / 8,0), tuğla kemer bandı, orta gözde ana kapı (1,8 × 3,4, taş çerçeve); yanlarda tuğla kemerli ikiz sivri kemer | P, O, E, F |
| `Cepheler` | doğu/batı/güney yüzlerinde sağır sivri kemerler (kanat: 2,6 m, tepe 6,9; mihrap bloğu: 3,2 m, tepe 9,6), içlerinde üstte sivri revzenli, altta dikdörtgen parmaklıklı pencere + tuğla boşaltma kemeri; koridor ucunda küçük üst pencere; doğu yan kapısı (1905); kasnak pencereleri (ana 2/yüz, mihrap 1/yüz, tabhane 1/yüz) | Y, P, F, Budak 2018 |
| `Kaide_Bant` | 0,8 m taş subasman bandı (son cemaat yeri hariç) | Y |
| `Sacak` | 0,35 m tuğla saçak bandı (testere dişi saçak yerine tek bant) | E, F |
| `Cati_Kanatlar` | yan kanat ve koridor üstünde kasnağa doğru 7,55 → 8,3 m yükselen basık kurşun çatı | dondurma kararı 7, F |
| `Minare_1` | şerefe ve korkuluk taş, gövde tuğla | F |
| Dokular | almaşık (taş sırası + 2 sıra tuğla, dikey tuğla; karo 2,0 × 0,8 m), kubbe dilimleri (24 dilim × 6 sıra), parmaklıklı pencere | F, E |

#### Tur içi düzeltmeler
1. İkiz kemer gözleri iç kemer levhasıyla kenar paylaşıyordu (manifold olmayan 4 kenar) → göz genişliği 1,8 → 1,7 m.
2. Çatı halkası normalleri yeniden hesaplandı (8 yönde ≈ 1e-4 kırmızı vardı).
3. Draw call 54 → 44: cephe ve kasnak pencereleri tek `Cepheler` nesnesinde.
4. Almaşık karo 1,2 × 0,6 → 2,0 × 0,8 m (ilk hâli cephede ızgara gibi duruyordu; fotoğrafta taş sırası ≈ 0,55 m).

#### VARSAYIM'lar
- VARSAYIM: son cemaat yeri açıklıkları koyu levha (#6B5A55); kütle kapalı, revak içi modellenmez.
- VARSAYIM: doğu yan kapısının yeri koridor ucu (v 9,6); Budak 2018 yalnız "doğu cephesinde 1905'te açılan kapı" diyor.
- VARSAYIM: güney cephesindeki iki pencerenin düzeni yan yüzlerle aynı (sağır kemer + üst ve alt pencere).

#### Açık sorular (v02 sonu)
1. **Doğu baklava / batı dama motifleri** (E PDF s.100) ve **minare yıldız motifleri** (E PDF s.103): `eser.md`'de "nasıl" boş; v02'ye eklenmedi. Eklensin mi, nasıl (tek bant mı, tüm cephe mi)?
2. **Alt pencereler:** fotoğrafta (IMG_8460) sivri kemerli ve daha büyük; Ayverdi yan cephesinde dikdörtgen + boşaltma kemeri. Bugünkü hâl kararı gereği fotoğrafa göre değiştirilsin mi?
3. **Revak içi rengi:** koyu levha mı kalsın, fotoğraftaki beyaz sıva gibi açık mı olsun?
4. v02 kabul edilirse: commit, sonra hamam ve Emir Hanı v02 (B kademe, sade).

#### v02 kararları (tasarım sorumlusu, 17 Ekim 2026) · cami v02 kabul
1. Baklava, dama ve minare yıldız motifleri **eklenmez**.
2. Alt pencereler Ayverdi'deki gibi dikdörtgen + tuğla boşaltma kemeri **kalır**.
3. Son cemaat yeri açıklıkları koyu levha (#6B5A55) **kalır**.

### v02b · cami kusur turu (17 Ekim 2026)
Betik: `3d/build/build_v02b.py` (= v02 + tek düzeltme; biçim değişmedi). Kontrol `3d/kontrol/v02b/`: 8 658 üçgen, açık/manifold olmayan kenar 0, çakışma 0, kırmızı 0 → **GECTI: true**; `.glb` 132 KB.
- **Kusur:** `Sacak` bantları dolu prizmaydı; üst yüzleri harim ve mihrap bloğu damıyla aynı düzlemde (10,2 m) → damda kırmızı-gri titreşim (z-fighting). Hamam v02'de fark edildi, camide yakın render'la doğrulandı.
- **Düzeltme:** bant içi boş kapalı halka (dış 0,18 m taşma, iç 0,05 m), damdan 2 cm yüksek biter. Görsel: `kontrol/v02b/dam_yakin.png`.
- Kabul edilen v02 dosyaları (`build_v02.py`, `orhan-bey-camii_v02.glb`) olduğu gibi duruyor; teslimde v02b kullanılmalı.

### v03 · cami son cemaat yeri revizyonu (17 Ekim 2026, tasarım sorumlusu kararı)
Dondurulmuş kütlede **tasarım sorumlusunun isteğiyle** değişiklik. Dayanak: tasarım sorumlusunun fotoğrafları (`ref/foto/ts_17ekim_1…6`: tepeden drone, havadan kuzeyden, revak içi, ikiz kemer), envanter cilt-1 PDF s.97 ("Beş gözlü son cemaat mahalli, 25.80 × 6.30 m ölçülerindedir ve tamamen kubbelerle örtülüdür"; "Yan mekânlar aynalı tonozlarla"), s.98 (yan cepheler "devşirme kompozit başlıklara oturan ikişer sivri kemerle dışa açılmaktadır"; sofalar "zeminden yaklaşık 90 cm daha yüksek"), s.100 ("küçük kubbeli giriş sahanlığı").

Betik: `3d/build/build_v03.py` (= v02b + son cemaat yeri yeniden). Kontrol `3d/kontrol/v03/`: 11182 üçgen, 49 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı 0 → **GECTI: true**; `.glb` 160 KB.

#### Değişenler
| Konu | v02b | v03 |
|---|---|---|
| Son cemaat yeri | kapalı kütle + koyu levhalar | **açık revak**: U biçimli duvar, kemerler Boolean ile oyuldu, kemer içleri beyaz sıva; ön 5 sivri kemer, yanlarda mermer sütunlu ikiz kemer; içte 0,9 m sofa, gözleri ayıran beyaz sivri kemerler (üzengi 4,6, tepe 7,6), beyaz tavan (8,0 m); arka duvarda ana kapı + 4 pencere |
| Son cemaat yeri örtüsü | kurşun kırma çatı (mahya 11,8) | basık kurşun teras (9,4 → 9,85) + **ortada kasnaklı kubbe** (Ø 4,6, tepe 11,8) + **iki yanda kubbe** (Ø 3,9, tepe 10,9) + **uçlarda dikdörtgen aynalı tonoz** (4,2 × 4,6, üst 10,6) |
| Giriş kubbesi (koridor) | dışarıda kasnaklı kubbe | **kaldırıldı** (tepeden fotoğrafta yok; E: giriş sahanlığı kubbesi çatı altında); koridor üstü kurşun kırma çatı |
| Arka duvar | koridor saçağında (7,6) bitiyordu | son cemaat yeri saçağına (9,4) yükseldi (`Cami_KuzeyDuvar_Ust`) |
| Dış örtü sayısı | 5 kubbe + kırma çatı | **9**: son cemaat yerinde 3 kubbe + 2 aynalı tonoz, ana gövdede 4 sekizgen kasnaklı kubbe |

Yeni parçalar: `Cami_SonCemaat` (oyulmuş revak duvarı), `Revak_Kemerler`, `Revak_Ic` (sofa, tavan, sütunlar), `Revak_Cephe` (kemer bantları, arka duvar kapı/pencereleri), `Kubbe_SonCemaat`, `Cami_KuzeyDuvar_Ust`. Kalkan: `Revak_SonCemaat`, `Kubbe_Giris`.
Görseller: `foto_revak` (ts_17ekim_2 açısı), `revak_ici` (ts_17ekim_5 açısı, göz boyunca), `havadan_kuzey` (ts_17ekim_3), `ust_orto` (ts_17ekim_6 ile karşılaştırılabilir).

#### Tur içi düzeltme
1. Uç gözlerin kesicisi yan duvarın iç yüzüyle aynı düzlemdeydi → Boolean 50 manifold olmayan kenar + arka yüz verdi. Yan duvar 1,2 → 1,1 m (H, 10 cm).

#### VARSAYIM'lar
- VARSAYIM: revak tavanı düz beyaz levha (8,0 m); gerçekte kubbe ve aynalı tonoz içleri. Workbench ışığında alt yüz koyu gri görünüyor.
- VARSAYIM: örtü kotları: ortadaki kubbe tepesi 11,8 (Y), yan kubbeler 10,9, aynalı tonoz 10,6 (ön cephe ve fotoğraftan kaba).
- VARSAYIM: sofa bütün revak içinde 0,9 m; ön kemerler sofa seviyesinden açılıyor; giriş merdiveni yok.
- VARSAYIM: ikiz kemer sütunu Ø 0,36 m, üzengi 4,0 m; kemer kilit taşı/rozet süsleri yok (motif kararı gereği).

#### Açık sorular (v03 sonu)
1. Revak tavanı: düz beyaz levha mı kalsın, içten görünen kubbe/tonoz çanakları mı eklensin (üçgen artar)?
2. Ön kemerlerin altına giriş merdiveni ve demir parmaklık eklensin mi?
3. Avludaki şadırvan (ts_17ekim_3, eser.md "çevre yapı") cami .glb'sine girsin mi?

### v04 · cami kubbe, kasnak ve pencere detayı (17 Ekim 2026)
Dayanak: tasarım sorumlusunun paylaştığı Yandex 3B model görüntüleri (`ref/maket/yandex_3d_7…10.png`) ve fotoğraflar (`ref/foto/ts_17ekim_b_11…21`), envanter cilt-1 PDF s.100–102. kulturenvanteri.com sayfasında mimari ölçü ya da pencere bilgisi yok (yalnız tarihçe; 1905'te doğu kapısının açıldığı).

Betik: `3d/build/build_v04.py` (= v03 + aşağıdakiler). Kontrol `3d/kontrol/v04/`: 12100 üçgen, 50 draw call (sınır ≤ 50), açık/manifold olmayan kenar 0, çakışma 0, kırmızı 0 → **GECTI: true**; `.glb` 172 KB.

#### Yandex modeliyle karşılaştırma
| Konu | Yandex | Bizim model | Sonuç |
|---|---|---|---|
| Plan (ters T, mihrap bloğu güneye çıkıntı) | aynı | aynı | uyuyor |
| Son cemaat yeri örtüsü | uçlarda aynalı tonoz (piramit), 2 yan kubbe, ortada kasnaklı kubbe | v03'ten beri aynı | uyuyor |
| Ana gövde kubbeleri | 4 kubbe, hepsi **sekizgen kasnak** | v03'te pahlı kare | **v04'te düzgün sekizgen** |
| Minare | kuzeydoğu, kanatla koridor köşesi | aynı | uyuyor |
| Mihrap bloğu genişliği | ≈ 0,54 × toplam genişlik (tepeden) | 11,3 / 25,7 = 0,44 (Ayverdi planı) | Yandex ölçülü değil; plan (P) korunur |
| Kanat ve koridor çatısı | kasnağa doğru yükselen kurşun çatı | aynı | uyuyor |
| Pencere/kemer | yok (kütle modeli) | — | — |

#### Değişenler
| Konu | v03 | v04 | Kaynak |
|---|---|---|---|
| Kasnaklar | pahlı kare (pah 0,30) | **düzgün sekizgen** (pah 0,586) + üstte tuğla testere dişi saçak halkası | E s.100, s.102; Yandex; F |
| Ana kubbe kasnak pencereleri | 4 yüzde 2'şer = 8 | **7** (kuzey yüzü hariç her yüzde 1) | E s.101 "yedi pencere" |
| Mihrap kubbesi kasnak pencereleri | 3 | **3** (G, D, B) | E s.102 "kubbede yer alan üç pencere" |
| Tabhane kasnak pencereleri | 3 | 3 (dış, K, G) | F |
| Üst pencereler | sivri kemer, parmaklık | **yuvarlak kemer, beyaz alçı şebeke** (koyu yuvarlak delikler) | E s.102; F ts_17ekim_b_13, _18 |
| Alt pencereler | dikdörtgen + boşaltma kemeri | **sivri kemer, siyah cam + baklava demir ızgara**, üstte tuğla sivri kemer | E s.102 (1905 tadilatı); F ts_17ekim_b_13, _15 |
| Kasnak pencereleri | sivri | yuvarlak kemer, beyaz şebeke | E s.101 |
| Alemler | yalnız minare | 4 ana kubbe + son cemaat yeri orta kubbesi | F |
| Son cemaat yeri gözleri | ≈ 3,9 m eşit | orta 4,7 m, yanlar 3,7 m | tasarım sorumlusu, Yandex |
| Revak arka duvarı pencereleri | dikdörtgen parmaklık | dikdörtgen, ızgara dokusu | E s.100 "dikdörtgen ... ikişer pencere" |

Pencere sayıları (cephe başına): kanat yan yüzleri 2 üst + 2 alt (+ koridor ucunda 1 küçük üst), mihrap bloğu doğu/batı/güney 2 üst + 2 alt (E s.102 "ikişer pencere"), kanatların güney yüzü 1 + 1, revak arka duvarı kapının iki yanında 2 + 2 (E s.100). Doku: `doku/pencere_sebeke.png`, `doku/pencere_izgara.png` (`doku_uret.py`).
Draw call 60 → 50: kasnak saçakları ve alemler tek `Kasnak_Detay` nesnesinde; revağın arka duvarı `Cami_Koridor` nesnesine alındı (`Cami_KuzeyDuvar_Ust` kalktı).

#### Açık sorular (v04 sonu)
1. Kasnaklar fotoğraflarda bazı karelerde sarı sıvalı (2019 öncesi), bugün almaşık; bugünkü hâl korundu. Uygun mu?
2. Tabhane kasnaklarında pencere sayısı fotoğraftan 1/yüz okunuyor; envanterde sayı yok. 3 yüz (dış, K, G) uygun mu?
3. Revak tavanı (düz beyaz levha) ve merdiven/parmaklık soruları v03'ten açık.

### v05 · cami kubbe eteği (17 Ekim 2026, tasarım sorumlusu)
Dayanak: `ref/foto/ts_17ekim_c_22_kubbe_etegi.webp` (kuzeybatıdan drone): büyük kubbeler alt kısımda birden dışa açılan kurşun etekle kasnağın üstünü örtüyor; kasnakta kahverengi çıkıntı yok.
Betik: `3d/build/build_v05.py`. Kontrol `3d/kontrol/v05/`: 13294 üçgen, 49 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı 0 → **GECTI: true**; `.glb` 193 KB.

| Konu | v04 | v05 |
|---|---|---|
| Büyük 4 kubbe | basık küre, kasnağın içinden çıkıyor | **etekli kubbe**: kasnak üstünde, kasnak köşesinin 0,25 m dışına taşan kurşun etek (dudak 0,12 m); etek içbükey eğriyle kubbe yüksekliğinin %30'u kadar yükselip kubbeye bağlanır |
| Kasnak üst bandı (4 büyük kubbe) | 0,15 m dışa taşan tuğla saçak halkası | **gömme**: üst 0,3 m duvarla aynı yüzeyde tuğla malzeme, kabartı yok |
| Son cemaat yeri orta kubbesi | tuğla halka | halka ve bant yok; etekli kubbe |
| Mihrap kasnak penceresi tepesi | 12,3 | 12,2 (bandın altında) |
`Kasnak_Detay` artık yalnız alemleri tutuyor. Kasnak üst kapağı eteğin altında kaldığı için ayrı malzeme yok (draw call 53 → 49).

#### Kararlar (tasarım sorumlusu, 17 Ekim 2026) · cami v05 ve hamam v02 kabul
1. **Cami v05 kabul**: teslimde `export/orhan-bey-camii_v05.glb` kullanılır (v02–v04 önceki hâller).
2. **Hamam v02 kabul**; külhan bacası eklenmez. Teslim: `export/orhan-bey-hamami_v02.glb`.
3. Sıradaki: Emir Hanı v02 detay turu (B kademe).

