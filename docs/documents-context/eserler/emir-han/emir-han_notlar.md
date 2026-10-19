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
  3d/       yalnız son sürüm emir_v02: blend/, export/, kontrol/emir_v02/, build/ (build_emir_v02.py, doku/, araclar/), README.md
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
