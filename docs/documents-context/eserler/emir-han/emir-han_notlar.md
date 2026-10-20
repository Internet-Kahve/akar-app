# Emir Hanı: model notları

Kaynaklı kimlik ve ölçü kaydı `eser.md`, üretim sürümleri `3d/README.md`, sıradaki tur `SONNET_REVIZYON_PLANI.md`. Külliye bağlamı: `../orhan-bey-kulliyesi/orhan-bey-kulliyesi_notlar.md`. Son düzenleme: 19 Ekim 2026.

## 0. Klasör düzeni

```
emir-han/
  eser.md                 kimlik, ölçü, malzeme (kaynaklı)
  emir-han_notlar.md      bu dosya
  SONNET_REVIZYON_PLANI.md  v03 iş emri (tur bitince silinir)
  ref/
    foto/   web fotoğrafları (dış cephe, giriş, avlu), envanter_c1_pdf108–109, vakif_1983_pdf176_havadan, hanlar-bildirisi_pdf005, alan-baskanligi_pdf005_foy
    plan/   yurt2024_pdf219_kulliye_vaziyet_ayverdi (temsili, dikey basık), hanlar-bildirisi_pdf003_bolge_restitusyon
    metin/  envanter_c1, vakif_1983, hanlar_bildirisi, alan_baskanligi
    kaynak_dizini.json
  3d/       son sürüm emir_v03: blend/, export/, kontrol/emir_v03/, build/ (build_emir_v03.py, render_emir_v03.py, doku/, araclar/), README.md (v02 blend/export/betik de duruyor)
```
Eksenler: +X doğu, +Y kuzey; orijin avlu ortası. OSM konumu (külliye yerel koordinatı): (−27, 92); yalnız konum.

**Ölçekli rölöve yok.** Bütün ölçüler metin (E, W), hesap (H) ve fotoğraftan (F); kesin plan bulunursa §1 yeniden değerlendirilmeli.

## 1. Güncel model kararları

| # | Konu | Karar | Dayanak | Durum |
|---|---|---|---|---|
| 1 | Dış ölçü | 46,0 × 50,0 (D–B × K–G) | E Vakıf 1983 PDF 176; O K–G 50,9; EHA D–B 45,5 | **v03** (v02: 45 × 45, E cilt-1 yuvarlak değer) |
| 2 | Avlu | 25,5 × 25,5 kare | E PDF 108 «650 m²»; W bildiri «kare planlı» | Korunur |
| 3 | Avlu revakı | kenar başına 7 göz, iki kat | W bildiri PDF 6; F `vakif_1983_pdf176` | **v03** (v02: 9) |
| 4 | Güney revakı | alt kemerler yarım daire, diğerleri sivri | E Vakıf PDF 176; W bildiri | **v03** (v02'de işlenmedi) |
| 5 | **Arazi** | çevre sokak +4,0; dışarıdan tek kat görünür; alt kat mahzenleri penceresiz | W bildiri «yirmişer basamaklı merdiven»; E PDF 109; F | **v03 yeni** |
| 6 | Girişler | asıl giriş kuzey kanadı ortası (tuğla sivri kemer, kantar peykeleri); güneyde üst kata açılan kesme taş basık kemerli giriş | E PDF 108–109; W bildiri; F | **v03** |
| 7 | Pencere, baca | üst katta 36 odada pencere (2'si çift), GD köşe 2 oda penceresiz; 38 baca | E PDF 109 | **v03** |
| 8 | Saçak | 2 sıra kirpi tuğla | E PDF 108; E Vakıf PDF 176 | **v03** |
| 9 | Avlu | açık sekizgen fıskiyeli havuz; çınarlar | E PDF 109; F | **v03** |
| 10 | Zemin, palet, figür | `../_GENEL_SAHNE_STANDARDI.md` (kaide üstü +4,0) | Kullanıcı (18 Ekim) | **v03** |

## 2. Kaynaklar

| Kaynak | Sayfa | Bu klasörde | Kullanım |
|---|---|---|---|
| Bursa Vakıf Eserleri Envanteri Cilt 1 | PDF 108–109 | `ref/metin/envanter_c1.md`, `ref/foto/envanter_c1_*` | Ölçü (45 × 45 yaklaşık, 650 m²), oda sayıları, örgü, girişler, pencereler, şadırvan |
| Türkiye'de Vakıf Abideler III (1983) | PDF 176 | `ref/metin/vakif_1983.md`, `ref/foto/vakif_1983_pdf176_havadan.png` | **46,00 × 50,00 dış ölçü**, güney revakı yarım daire kemerler, hava fotoğrafı |
| Hanlar bildirisi (II. Türkiye Lisansüstü Çalışmaları Kongresi) | PDF 3, 5–6 | `ref/metin/hanlar_bildirisi.md`, `ref/plan/hanlar-bildirisi_pdf003_*`, `ref/foto/hanlar-bildirisi_pdf005_*` | **Yedişer revak**, kare avlu, girişler, 20 basamaklı merdivenler |
| Alan Başkanlığı föyü N3 | PDF 5 | `ref/metin/alan_baskanligi.md`, `ref/foto/alan-baskanligi_pdf005_foy.png` | «46 x 50» (iç avlu diye yazılmış, dış ölçü olmalı), köşe kubbeleri |
| Ayverdi temsili vaziyet (Yurt 2024 Çizim 19) | PDF 219 | `ref/plan/yurt2024_pdf219_kulliye_vaziyet_ayverdi.png` | Oda dizilişi, çevredeki dükkân sıraları; ölçü değil |
| Web fotoğrafları | — | `ref/foto/` | Bugünkü hâl |

## 3. Ölçü analizi (19 Ekim 2026)

- **Dış ölçü:** E cilt-1 «yaklaşık 45 × 45» yuvarlak; Vakıf 1983 «46,00 × 50,00» kesin değer verir; föyde aynı sayılar «iç avlu» olarak geçer, ama 46 × 50 m'lik avlu 650 m²'lik avluyla çelişir, dolayısıyla dış ölçüdür. OSM poligonu 57,5 × 50,9: K–G 50,9 Vakıf'la uyumlu; D–B fazlası EHA 1967 planında görülen doğu ve batıya bitişik dükkân sıralarıdır (önceki notlar). Seçim: **46 (D–B) × 50 (K–G)**; yön ataması H (OSM ve EHA'dan).
- **Kanatlar:** kare avlu 25,5 ile D–B kanatları 10,25, K–G kanatları 12,25 (H). Kuzey kanadındaki giriş ve merdivenler derin kanatla uyumlu. Ölçekli plan bulunursa doğrulanmalı.
- **Göz sayısı:** bildiri «yedişer revak»; hava fotoğrafında (`vakif_1983_pdf176`) bir kenarda 7 kemer sayılıyor. 25,5 / 7 = 3,64 m adım.
- **Arazi:** dış fotoğraflarda han duvarı sokaktan tek kat yüksekliğinde (≈ 5–6 m) ve bacalar hemen üstte; girişten avluya basamaklarla iniliyor; alt kat mahzenleri penceresiz (E). Kuzeydeki asıl girişin iki yanındaki 20'şer basamak ≈ 4,0 m kot farkı verir (H).
- **Girişler:** bildiri asıl girişi kuzey kanadının ortasına, üçüncü girişi üst katta kesme taş basık kemerli olarak tanımlar; E iki giriş sayar (Ulucami avlusundan ve Kapalıçarşı'dan). Fotoğraflardaki tuğla sivri kemerli, peykeli giriş asıl giriş kabul edildi (peykeler: E PDF 108 «kantarların yerleştirilmesi için inşa edilen peykeler, hanın girişinde»). Kesin yön doğrulaması için yerinde fotoğraf gerekli.

## v03 çalışma notları (19 Ekim 2026; tur sürüyor, kapanışta §1'e işlenecek)

Betik `3d/build/build_emir_v03.py` (`EMIR_ASAMA=A|B|C|SON`). Onaylar: A (kütle ve arazi) «genel olarak iyi duruyor», B «güzel duruyor», C «onaylıyorum» (19 Ekim). Son kontrol: `kontrol/emir_v03/kontrol_ozeti.md`.

**Kullanıcı kararları**
- K (19 Ekim, onay A): palet «görsellere göre uyarla». Kurşun `#AEB6BC` (Ulu Cami v24 Cati tonu; plan `#C3C9CD`). Tuğla `#B06A4A` / `#BF7C5C` / `#985A3E` (plan `#C0683F`; Ulu minare `#986B4D`). Korkuluk beyaz boyalı demir `#EDEBE6` (plan `#36413F`; bütün avlu fotoğraflarında beyaz). Gerekçeler `kontrol/emir_v03/renkler.json` içinde (`sapma`).

**Kaynakta olmayan değerler (T tahmin, H hesap)**
| Değer | v03 | Harf | Dayanak |
|---|---|---|---|
| Kaide altı kotu | −0,6 (yan yüz +4,0 → −0,6) | T | plan §2 «yan yüz duvar gibi okunsun» |
| Kaide merkezi, yarıçap | (0; 0), R 37,39 (en küçük çember 34,39 + 3; giriş figürleri ve rampa dahil) | H | standart §1 |
| Sokak döşeme şeridi | han çevresinde 6 m, kaide kenarından 1,5 m içeride kesik; yalnız sunum GLB'de (`Zemin_Sokak`) | T | Koza v12 `Cevre_Doseme` yöntemi |
| Dış duvar +4,0 altı | düz `#A39A8B`, dokusuz | T | kapalı hacim için |
| Revak ayağı | 1,2 × 1,2 | E/T | E PDF 108 «geniş ayaklar» |
| Revak genişliği | 3,0 (oda duvarı avludan 4,2 m içeride) | T | F Kqg5B5q |
| Göz adımı, kemer açıklığı | 3,643 / 2,443 | H | 25,5 / 7 − 1,2 |
| Alt kemer kuşağı | ayak tepesi 3,6, döşeme 4,5 | T | |
| Üst kuşak | ayak tepesi 8,5; 9,1–9,5 iki sıra kirpi (taşma 0,12) | T | E PDF 108 kirpi |
| Kemer oranı | alt 0,55, üst 0,60 (yarıçap/açıklık); tuğla bant 0,35 | T | Koza v12; F |
| Alt revak bölmeleri | avlu yüzünden 0,6 geride; alt ahşap, kemer kısmı cam | E/T | E PDF 108 «cam ve ahşap bölmeler» |
| Korkuluk | 1,0 m, gerçek delikli (alpha) | F | |
| Köşe kubbeleri | üst kuşağa oyulmuş küre: merkez +7,9, R 1,4 (tepe 9,3) | T | E PDF 108 |
| Çatı saçak taşması | 0,30 | T | F Emir-Hani-1 |
| Oda dağılımı | K 8 + G 8 + D 11 + B 11 = 38 | T | E PDF 108–109 (38 oda) |
| Çift pencereli 2 oda | doğu ve batı cephelerin kuzey uçları | T | E PDF 109 (yer belirtilmemiş) |
| Penceresiz 2 oda | güney cephenin doğu ucu + doğu cephenin güney ucu | E/T | E PDF 109 «güneydoğu köşesindeki iki oda» |
| Pencere | 0,9 × 1,3, alt +4,6; tuğla sivri kemer + dolu alınlık | F/T | F 1578509543 |
| Baca | 0,6 × 0,6, çatıdan 1,2, dış duvardan 2,6 m içeride, kurşun piramit başlık | E/F/T | plan §4 |
| Kuzey giriş | eşik +3,6 (kapıya inen 4,0 m rampa), açıklık 2,6, iç taş yarım daire kemer tepesi +6,7, dış tuğla sivri kemer tepesi ≈ +7,9; yükseltilmiş cephe bloğu 8,6 m, 0,35 çıkıntı, tepe +10,1; peykeler 0,8 × 2,5 × 0,5 | F/T | F Emir-Hani-1, 685999…, 1578509484/629 |
| Kuzey geçit | üst kat revakına eşikten +4,5'e eğimli taban; iç merdivenler modellenmedi (görünmez) | T | F 1578509629 |
| Güney giriş | +4,0, en 2,2, üzengi +6,4, basıklık 0,35, kesme taş çerçeve 0,4 | W/T | W bildiri PDF 6 |
| Şadırvan | açık sekizgen havuz yüzden yüze 4,0, kenar 0,7 (plan); cidar 0,2, mermer basamak 0,35 × 0,15, su kenardan 0,12 aşağıda, fıskiye Ø 0,3 × 1,2 + lotus çanak | E/F/T | E PDF 109; F emirhan-bursa-ulucami2; Ulu Cami iç şadırvan dili |
| Ağaçlar | Cevre_Agac_01 çınar (−7,2; 6,4), _02 çınar (7,0; −6,8), _03 sedir (7,2; 6,8), _04 palmiye (−7,0; −6,6); çınar Ulu `cinar()` ×1,35; her biri Ulu `tarh()` içinde (R 1,8) | E/F/T | E «tarihi çınar ağaçları»; F Emir-Hani-4/5, emirhan-bursa-ulucami2/4/6, envanter_c1_pdf109 |
| Ağaç malzemesi | Orhan Bey v06 yöntemi: tek `Agac` malzemesi = nötr yaprak dokusu (`yaprak_notr.png`) × köşe rengi (yaprak, gövde, toprak, tarh tonları); ağaç başına 1 draw call | K/T | kullanıcı «diğer modellerdeki gibi ağaçlara doku»; standart §1/§3 renkleri |
| Figürler | 8 `A.insan`: avluda 4 (şadırvan yanında 2), üst revakta 2, girişte 2; 4 kadın; boylar 1,60–1,78 | T | plan §6, Ulu v23 boyları |
| Girişler | `Girisler` tek nesne (kuzey + güney), draw call bütçesi | T | |

**Kullanılmayan kaynak:** `ref/foto/1578509947.jpg` iki kat pencereli almaşık bir duvar gösteriyor; plan §0 listesinde yok ve Emir Hanı'nın dış cephesine (sokaktan tek kat, alt kat penceresiz) uymuyor.

**Ortam notu:** bpy 5.2 modülünde Draco kütüphanesi yok; betik bu durumda GLB'yi `gltf-transform draco` ile sıkıştırır (`EMIR_GLTF_TRANSFORM`). Masaüstü Blender'da Draco doğrudan çalışır.

## Ek: Geçmiş kayıt (17 Ekim 2026, Emir Hanı v01–v02)

> Bu ekteki değerler tarihsel kayıttır. 45 × 45 dış ölçü, kenar başına 9 göz, "güney revakları işlenmez" kararı ve v02 paleti **geçerli değildir** (§1). v01 dosyaları silindi; yalnız v02 `3d/` altında. EHA 1967 vaziyet görseli bu ağaçta yok.


Külliye üretim günlüğünden ayrılan eser bölümleri. Tarihli ölçü ve varsayımlar korunmuştur. Ortak yerleşim ve kaynak geçmişi: [külliye notları](../orhan-bey-kulliyesi/orhan-bey-kulliyesi_notlar.md).

### 3. Emir Hanı · ölçü tablosu (ön okuma)
| Ölçü | Değer | Kaynak | Not |
|---|---|---|---|
| Dış ölçü | ≈ 45 × 45 m | E PDF s.108 | EHA yatay 45,5 m ✓ |
| Avlu | ≈ 650 m² (≈ 25 × 26 m) | E, H | |
| Kat | 2; alt 36, üst 38 oda; revaklı avlu, şadırvan, çınarlar | E | |
| OSM | adsız way 1271724730 (Ulucami'nin kuzeyi), 57,5 (D–B) × 50,9 (K–G) m | O | EHA'da çekirdeğin doğu ve batısına bitişik dükkân sıraları var → toplam ≈ 57 m (EHA yatay ✓). **> 2 m çelişki** E 45 ↔ O 57,5 / 50,9 |
| Yükseklik | yok | — | T: 2 katlı Bursa hanı, saçak ≈ 9–10 m (Koza Han ile karşılaştırılacak) |
| Malzeme | 2 sıra tuğla + 1 sıra küfeki almaşık; revaklar tuğla, 2 sıra kirpi saçak | E | |

### Emir Hanı v01 · kütle turu (17 Ekim 2026)
Betik: `3d/build/build_emir_v01.py` (B kademe; revak, kapı, baca ve süs yok). **Ölçülü plan ve kesit yok.** Sonuç `3d/kontrol/emir_v01/`:
- `kontrol_rapor.json`: 52 üçgen, 3 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 8 yönde 0 → **GECTI: true**
- Render: `havadan`, `kuzey_orto`, `ust_orto` (kare), `avlu_ici`
- Bindirme: `bindirme_ust_orto.png` (EHA 1967): D–B yönünde çekirdek ≈ 44,8 m, avlu açıklığı ≈ 25,2 m, kanat ≈ 9,5 m model ile tutuyor. K–G yönü döngüsel (EHA dikeyi 45 m kabulüyle ölçeklendi).
- Yan yana: `yan_yana_avlu.png` (fotoğraf Emir-Hani-4; v01'de revak olmadığı için yalnız kütle ölçeği)

Parçalar: `Emir_Hani` (halka kütle + kurşun kırma çatı, tek kapalı hacim), `Han_Avlu` (avlu döşemesi) (+ `Zemin`, `Zemin_Golge`).

#### Ölçüler
| Ölçü | Değer | Kaynak |
|---|---|---|
| Dış ölçü | 45,0 × 45,0 m | E (EHA yatay 45,5 ✓) |
| Avlu | 25,5 × 25,5 m | H: √650 m² (EHA yatay ≈ 25,2 ✓) |
| Kanat derinliği | 9,75 m | H |
| Saçak (iç ve dış) | 9,5 m | T (Koza Han v01 ile aynı: 5,0 + 4,5) |
| Kırma çatı mahyası | 11,0 m, kanat ortasında | T (F: Emir-Hani-1'de basık kurşun kırma çatı) |

#### VARSAYIM'lar
- VARSAYIM: saçak 9,5 m, mahya 11,0 m (yükseklik kaynağı yok). Fotoğraftan ölçüm için yerden, karşıdan bir dış cephe fotoğrafı gerek.
- VARSAYIM: zemin düz; girişte sokaktan avluya inen rampa (F: Emir-Hani-1) modellenmez.
- VARSAYIM: çevredeki dükkân sıraları (EHA'da doğu ve batıda, OSM 57,5 m) modelde yok (B1 kararı: 45 × 45).
- VARSAYIM: avludaki şadırvan ve çınarlar v02'de (eser.md Zemin ve çevre).

#### Açık sorular (Emir Hanı v01 sonu)
1. Saçak 9,5 m uygun mu? (Fotoğraflarda alt kat kemerleri + üst kat revağı ≈ 9–10 m gösteriyor; ölçülemedi.)
2. Kütle kabul edilirse: "GEOMETRİ DONDURMA Emir Hanı v01", sonra v02 detay turları (cami A, hamam ve han B).

### GEOMETRİ DONDURMA Emir Hanı v01 (17 Ekim 2026)
Emir Hanı kütlesi tasarım sorumlusu tarafından kabul edildi. `build_emir_v01.py` içindeki kütle ölçüleri bundan sonra değişmez.

#### Kararlar
1. Dış ölçü 45 × 45 m (E), avlu 25,5 × 25,5 m (H), kanat 9,75 m; dükkân sıraları modelde yok.
2. **Saçak 9,5 m kalır** (VARSAYIM, Koza Han ile aynı); kurşun kırma çatı mahyası 11,0 m, kanat ortasında.
3. Üç yapının kütlesi donmuş durumda; sıradaki işler v02 detay turları (önce cami, A kademe).

### Emir Hanı v02 · detay + renk + çıkış (17 Ekim 2026)
Betik: `3d/build/build_emir_v02.py` (= Emir Hanı v01 kütlesi + detay; B kademe). Kontrol `3d/kontrol/emir_v02/`: 10194 üçgen, 18 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı 0 → **GECTI: true**; `.glb` 90 KB (`export/emir-hani_v02.glb`). Render: `havadan`, `avlu_ici`, `kuzey_giris`, `kuzey_orto`.

| Parça | İçerik | Kaynak |
|---|---|---|
| Dış duvarlar | almaşık doku (cami karosu, 2 tuğla + taş) | E PDF s.108 |
| `Avlu_Revaklari` | avlunun dört cephesinde kenar başına 9 göz: altta sivri tuğla kemerli koyu dükkân açıklığı, taş kat silmesi (5,0 m), üstte yüksek sivri tuğla kemer, beyaz tonoz içi ve beyaz korkuluk | E (36/38 oda), F Emir-Hani-2…5 |
| `Dis_Cephe` | üst katta oda başına küçük pencere (alt kat depoları penceresiz); kuzey ortasında almaşık yuvarlak kemerli giriş (3,4 × 4,6) | E, F Emir-Hani-1 |
| `Sacak` | dışta ve avluda içi boş tuğla saçak halkası | E "kirpi saçak" |
| `Bacalar` | dış çatı yüzünde oda başına baca | E "ocaklı oda", F |
| `Sadirvan`, `Agaclar` | avlu ortasında sekizgen fıskiyeli şadırvan; iki stilize çınar | E PDF s.109, _ortak_stil |

#### Tur içi düzeltme
1. Bacalar çatıya 0,4 m gömülüydü (çakışma 0,47) → 0,15 m.

#### VARSAYIM'lar
- VARSAYIM: giriş kuzey cephesinin ortasında (fotoğrafta yön belli değil).
- VARSAYIM: kenar başına 9 göz, dört kenar eş; güney revaklarındaki kesme taş paye ve yuvarlak almaşık kemerler (E) ayrı işlenmedi.
- VARSAYIM: baca sayısı dış çatı boyunca eşit aralıklı (≈ 11/kenar); envanterde 38 ocaklı oda.
- VARSAYIM: şadırvan sekizgen havuz Ø 4,0 m; ağaçlar stilize, yerleri tahmin.

#### Açık sorular (Emir Hanı v02 sonu)
1. Giriş hangi cephede? (Kuzey varsayıldı.)
2. Güney revaklarında farklı (kesme taş paye, yuvarlak almaşık kemer) düzen işlensin mi?
3. Kabul edilirse üç yapı teslime hazır: cami v05, hamam v02, Emir Hanı v02 (B6: `.glb` → `belgeler` dalı, PR).

#### Kararlar (tasarım sorumlusu, 17 Ekim 2026) · Emir Hanı v02 kabul
1. **Emir Hanı v02 kabul**; teslim: `export/emir-hani_v02.glb`.
2. Giriş kuzey cephesinde kalır.
3. Güney revakları ayrıca işlenmez.
4. Üç yapı teslime hazır: cami v05, hamam v02, Emir Hanı v02. Sıradaki: B6 teslim (`.glb` → `belgeler` dalı, PR).
