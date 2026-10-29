# Renk ölçüm raporu: yedi eser (1. aşama)

> **KARAR — 28 Ekim 2026, kullanıcı: fotoğraf renkleri haritada cansız; 21 Ekim pastel renkleri geri; ton ayarı web'de.** Bu rapordaki fotoğraf ölçümleri kayıt olarak durur; uygulama modelleri (Ulucami v29, Bedesten v08, Koza Han v16, Orhan Bey Camii v09, Hamam v07, Emir Hanı v07, Türbe v04) 21 Ekim pastel renklerini kullanır. `malzeme-paleti.json`: «hex» = pastel, «foto_olcum» = bu rapordaki değer.

28 Ekim 2026. İş emri: `design/test-redmi9t-v2/_promptlar/PROMPT_foto_renk_ve_ao_pisirme_7_eser.md`. Kullanıcı 28 Ekim'de öneriyi onayladı («önerdiğin şekilde devam et»): kurşun, mermer, tuğla yedi eserde ortak; duvar esere göre; eser tuğla istisnaları kaldırıldı (tek küçük bölgeden geldikleri için). Uygulandı: `_kutuphane/renk_ao_v3/` (2. aşama).

## Yöntem

- Fotoğraflar: `veri/bursa-foto/` (Vakıf Eserleri Envanteri arşivi, uzun kenar 2400 px'e küçültülmüş). Gündüz, dış cephe, güncel (DJI_ / ERD) fotoğraflar; gece, iç mekân ve eski siyah-beyaz kullanılmadı. Fotoğraflar profesyonelce düzenlenmiş (HDR, doygunluk); değerler yaklaşıktır.
- Her malzeme rolü için fotoğrafta düz bir bölge seçildi (bölge = fotoğrafın % koordinatı x0,y0–x1,y1); bölgenin piksel **ortancası** alındı. Her bölge kırpılıp gözle kontrol edildi; gölgeye, pencereye, ağaca, gökyüzüne düşen bölge atıldı (aşağıda «atıldı» sütunu). Kırpıntılar: `eserler/<eser>/3d/kontrol/renk-olcumu_2026-10-28_kirpintilar.jpg` (kırmızı çizgili = atıldı).
- Işık etiketi: G = doğrudan güneş, G* = alçak/sıcak güneş, D = gölge, bulut ya da revak içi. **D örnekleri malzemeyi belirgin koyu gösterir** (ör. Emir Hanı beyaz sıva tonozu D'de #A5A1A0). Bu yüzden önerilen hex, varsa G örneklerinin ortancasıdır; G örneği olmayan roller «düşük (güneşli örnek yok)» diye işaretlendi; «orta» = en az 2 güneşli fotoğraf.
- Model rengi: GLB'den malzeme `baseColorFactor` × doku ortancası × köşe rengi (COLOR_0) alan ağırlıklı ortalaması, sRGB. «Görünen» = üçünün çarpımı (bugün haritada görünen). Sonuç: ΔL = model − fotoğraf açıklığı (HLS); |ΔL| ≤ 0,05 ve ton farkı ≤ 6° ise «aynı».
- Ulucami 28 Ekim'de ölçülüp karara bağlandı; yeniden ölçülmedi (`yaptiklarim-2.md` §37).

## Son sürümler (doğrulandı)

| Eser | export/ son sürüm | model.json glb |
|---|---|---|
| Ulucami | v27 | v27 (aynı) |
| Bedesten | v06 | v06 (aynı) |
| Koza Han | v14 | v14 (aynı) |
| Orhan Bey Camii | v07 | v07 (aynı) |
| Orhan Bey Hamamı | v05 | v05 (aynı) |
| Emir Hanı | v05 | v05 (aynı) |
| Orhan Gazi Türbesi | v02 | v02 (aynı) |

## Özet

| Eser | Rol | Model (görünen) | Fotoğraf önerisi | Sonuç | Güven |
|---|---|---|---|---|---|
| Ulucami | Kurşun kubbe / çatı | `#BCC2C6` | `#BCC2C6` | değişmez (aynı) | karar (28 Ekim) |
| Ulucami | Kasnak (sarı sıva) | `#F2E2A8` | `#D2B276` | model çok açık, limon sarısı | karar (28 Ekim) |
| Ulucami | Duvar taşı (Tas_Orgusu_*) | `#E5D0AE` | `#AF9A7D` | model çok açık, fazla sarı | karar (28 Ekim) |
| Ulucami | Minare tuğla (Minare_Tugla_Derzi) | `#CF7F55` | `#8E6A4E` | model fazla turuncu ve açık | karar (28 Ekim) |
| Ulucami | Mermer | `#F5F4F0` | `#E6E2D6` | model biraz açık | karar (28 Ekim) |
| Bedesten | Kubbe (kurşun) | `#B8BEC2` | `#CAC8C6` | aynı | orta |
| Bedesten | Çatı / bant (kurşun) | `#B1B7BA` | `#C2BEBA` | aynı | orta |
| Bedesten | Duvar (taş-tuğla) | `#D1CBAE` | `#B8A27E` | model açık, ton farkı 12° (ΔL +0.14) | orta |
| Koza Han | Almaşık duvar | `#CAB898` | `#868164` | model açık, ton farkı 13° (ΔL +0.24) | düşük (güneşli örnek yok) |
| Koza Han | Kurşun kubbe / çatı | `#B5BBBF` | `#5A616E` | model açık (ΔL +0.34) | düşük (güneşli örnek yok) |
| Koza Han | Kesme taş (mescit) | `#D7CAAE` | `#87735F` | model açık, ton farkı 11° (ΔL +0.31) | düşük (güneşli örnek yok) |
| Orhan Bey Camii | Almaşık duvar | `#D6CCAD` | `#C4B08C` | model açık, ton farkı 7° (ΔL +0.10) | düşük |
| Orhan Bey Camii | Kasnak (almaşık) | `#DED4BA` | `#C4B08C` | model açık (ΔL +0.14) | düşük |
| Orhan Bey Camii | Kurşun kubbe | `#B2B8BC` | `#687596` | model açık (ΔL +0.22) | düşük |
| Orhan Bey Camii | Kirpi saçak (tuğla) | `#C67348` | `#5F4629` | model açık, ton farkı 12° (ΔL +0.26) | düşük |
| Orhan Bey Hamamı | Kurşun kubbe | `#B3B9BD` | `#A4ABB1` | model açık (ΔL +0.05) | orta |
| Orhan Bey Hamamı | Duvar (moloz + tuğla) | `#D6CBAD` | `#C69D80` | model açık, ton farkı 19° (ΔL +0.12) | orta |
| Orhan Bey Hamamı | Kasnak | `#D1C7A4` | `#85604C` | model açık, ton farkı 26° (ΔL +0.32) | orta |
| Orhan Bey Hamamı | Tuğla (alınlık) | `#C77448` | `#683528` | model açık, ton farkı 9° (ΔL +0.25) | düşük |
| Emir Hanı | Çatı: gri beton/membran | `#B6BCC0` | `#6F6564` | model açık (ΔL +0.32) | düşük |
| Emir Hanı | Çatı: yeşil kaplama | `#B6BCC0` | `#61635C` | model açık (ΔL +0.36) | düşük |
| Emir Hanı | Çatı: mavi kaplama | `#B6BCC0` | `#3F4660` | model açık (ΔL +0.42) | düşük |
| Emir Hanı | Revak ayağı (moloz-tuğla) | `#D7C9AB` | `#5D4F3E` | model açık, ton farkı 8° (ΔL +0.45) | düşük (güneşli örnek yok) |
| Emir Hanı | Dış duvar (almaşık) | `#D6C7A2` | `#AC9483` | model açık, ton farkı 18° (ΔL +0.14) | düşük |
| Emir Hanı | Beyaz sıva tonoz | `#D9D0BD` | `#A5A1A0` | model açık (ΔL +0.16) | düşük (güneşli örnek yok) |
| Emir Hanı | Avlu taşı | `#C6B89A` | `#8D8A8F` | model açık (ΔL +0.14) | düşük (güneşli örnek yok) |
| Emir Hanı | Baca tuğlası | `#C77761` | `#D6AE9D` | model koyu (ΔL -0.15) | düşük |
| Orhan Gazi Türbesi | Kurşun kubbe / etek | `#B3B9BD` | `#C6C0C5` | aynı | düşük |
| Orhan Gazi Türbesi | Cephe sıvası (krem) | `#D5CCBA` | `#FEE4B8` | model koyu (ΔL -0.08) | düşük (güneşli örnek yok) |
| Orhan Gazi Türbesi | Silme / kasnak (beyaz) | `#E6E5E2` | `#FCF5EB` | model koyu (ΔL -0.06) | düşük (güneşli örnek yok) |
| Orhan Gazi Türbesi | Ahşap giriş holü | `#624435` | `None` | ölçülemedi | düşük (güneşli örnek yok) |

## Bedesten (v06)

Görsel: `eserler/yildirim-bayezid-bedesteni/3d/kontrol/renk-olcumu_2026-10-28.png`

| Rol | Model malzemeleri | Model: malzeme / köşe rengi / görünen | Fotoğraf + bölge (%) | Işık | Örnek | Atıldı | Foto aralığı (L) | Önerilen hex |
|---|---|---|---|---|---|---|---|---|
| Kubbe (kurşun) | Kubbe | `#BCC2C6` / 0.951 / `#B8BEC2` | `Ticari Yapılar Klasörü/DJI_20241201114157_0652_D_ODAK kopya.jpg` [29, 40, 34, 44] | G | `#B5B8BD` |  | 0.72–0.84 | **`#CAC8C6`** |
| | | | `Ticari Yapılar Klasörü/DJI_20241201114157_0652_D_ODAK kopya.jpg` [79, 39, 84, 44] | G | `#C1C1C2` |  | | |
| | | | `Ticari Yapılar Klasörü/DJI_20241027175442_0290_D_ODAK-Edit.jpg` [55, 79, 58, 81] | G | `#D2D0CB` |  | | |
| | | | `Ticari Yapılar Klasörü/DJI_20241027175442_0290_D_ODAK-Edit.jpg` [63.5, 79, 66.5, 81] | G | `#D6D6D5` |  | | |
| | | | `Ticari Yapılar Klasörü/DJI_20241027175442_0290_D_ODAK-Edit.jpg` [66, 86.5, 69, 88.5] | G | `#97989B` | kısmen gölge | | |
| | | | `Ticari Yapılar Klasörü/DJI_20241201114357_0654_D_ODAK kopya.jpg` [61, 52.5, 64, 54.5] | G | `#798CA6` | gökyüzü yansıması (mavi) | | |
| | | | `Ticari Yapılar Klasörü/DJI_20241201114837_0675_D_ODAK kopya.jpg` [50, 71, 54, 72.5] | D | `#C6C4C5` |  | | |
| Çatı / bant (kurşun) | Cati, Bant_Cati | `#BCC2C6` / 0.874 / `#B1B7BA` | `Ticari Yapılar Klasörü/DJI_20241201114157_0652_D_ODAK kopya.jpg` [50, 47, 58, 48.5] | G | `#BBBCBD` |  | 0.74–0.75 | **`#C2BEBA`** |
| | | | `Ticari Yapılar Klasörü/DJI_20241201114357_0654_D_ODAK kopya.jpg` [60, 56, 68, 56.8] | G | `#C9BFB6` |  | | |
| | | | `Ticari Yapılar Klasörü/DJI_20241027175442_0290_D_ODAK-Edit.jpg` [59.5, 89.3, 61.5, 90.5] | G | `#E6E5E0` | aşırı pozlanmış | | |
| Duvar (taş-tuğla) | Duvar | `#E3DDBE` / 0.827 / `#D1CBAE` | `Ticari Yapılar Klasörü/DJI_20241201114357_0654_D_ODAK kopya.jpg` [55, 57.4, 69, 58.2] | G | `#A4876B` |  | 0.53–0.69 | **`#B8A27E`** |
| | | | `Ticari Yapılar Klasörü/DJI_20241201114357_0654_D_ODAK kopya.jpg` [56.5, 61, 62, 62.5] | G | `#747176` | gölge/çatı | | |
| | | | `Ticari Yapılar Klasörü/DJI_20241027175442_0290_D_ODAK-Edit.jpg` [53, 82.5, 54.2, 85] | G | `#CDBE92` |  | | |

## Koza Han (v14)

Görsel: `eserler/koza-han/3d/kontrol/renk-olcumu_2026-10-28.png`

| Rol | Model malzemeleri | Model: malzeme / köşe rengi / görünen | Fotoğraf + bölge (%) | Işık | Örnek | Atıldı | Foto aralığı (L) | Önerilen hex |
|---|---|---|---|---|---|---|---|---|
| Almaşık duvar | Duvar_Almasik | `#DCC8A6` / 0.829 / `#CAB898` | `Ticari Yapılar Klasörü/ERD04128 kopya.jpg` [0.5, 46, 5, 56] | D | `#848079` |  | 0.39–0.52 | **`#868164`** |
| | | | `Ticari Yapılar Klasörü/ERD04128 kopya.jpg` [16.5, 48, 23, 57] | D | `#898782` |  | | |
| | | | `Ticari Yapılar Klasörü/ERD04128 kopya.jpg` [28, 29.5, 36, 34] | D | `#49413A` | saçak/korniş | | |
| | | | `Ticari Yapılar Klasörü/ERD04132 kopya.jpg` [86, 46, 98, 56] | D | `#78736B` |  | | |
| | | | `Ticari Yapılar Klasörü/ERD04132 kopya.jpg` [72.5, 46, 78, 56] | D | `#6A655E` |  | | |
| | | | `Ticari Yapılar Klasörü/DJI_20241023133147_0330_D_ODAK-Edit.jpg` [54, 77.6, 70, 78.6] | G* | `#9B8252` |  | | |
| | | | `Ticari Yapılar Klasörü/DJI_20241023133147_0330_D_ODAK-Edit.jpg` [56, 80.8, 66, 81.8] | G* | `#A18651` |  | | |
| Kurşun kubbe / çatı | Cati_Kursun, Kursun, Cati_Metal, Sacak, Baca_Kulah | `#BCC2C6` / 0.918 / `#B5BBBF` | `Ticari Yapılar Klasörü/ERD04224 kopya.jpg` [45, 31, 58, 35] | D | `#545E6D` |  | 0.38–0.40 | **`#5A616E`** |
| | | | `Ticari Yapılar Klasörü/ERD04226 kopya.jpg` [47, 47, 56, 49.5] | D | `#60646E` |  | | |
| | | | `Ticari Yapılar Klasörü/DJI_20241023133147_0330_D_ODAK-Edit.jpg` [56, 74.5, 66, 76] | G* | `#6A5C44` | alçak akşam güneşi, sarı döküm | | |
| Kesme taş (mescit) | Kesme_Tas, Tas_Portal, Tas_Acik | `#E6D8BA` / 0.861 / `#D7CAAE` | `Ticari Yapılar Klasörü/ERD04224 kopya.jpg` [45.5, 47, 50.5, 53] | D | `#7D776F` | pencere ızgarası | 0.43–0.47 | **`#87735F`** |
| | | | `Ticari Yapılar Klasörü/ERD04224 kopya.jpg` [56.5, 47, 59.5, 53] | D | `#7F6D5B` |  | | |
| | | | `Ticari Yapılar Klasörü/ERD04224 kopya.jpg` [47, 40.8, 58, 43.5] | D | `#6E604F` | korniş şeridi | | |
| | | | `Ticari Yapılar Klasörü/ERD04226 kopya.jpg` [45.5, 53, 49, 58] | D | `#8F7963` |  | | |
| | | | `Ticari Yapılar Klasörü/ERD04226 kopya.jpg` [54, 53, 57.5, 58] | D | `#776350` | pencere şebekesi | | |

## Orhan Bey Camii (v07)

Görsel: `eserler/orhan-bey-kulliyesi/3d/kontrol/renk-olcumu_2026-10-28.png`

| Rol | Model malzemeleri | Model: malzeme / köşe rengi / görünen | Fotoğraf + bölge (%) | Işık | Örnek | Atıldı | Foto aralığı (L) | Önerilen hex |
|---|---|---|---|---|---|---|---|---|
| Almaşık duvar | Duvar, Almasik_Revak | `#E5DAB9` / 0.86 / `#D6CCAD` | `Orhan Bey Külliyesi Klasörü/DJI_20241023171347_0463_D_ODAK-Edit.jpg` [46, 56, 56, 66] | G | `#CCB994` |  | 0.45–0.69 | **`#C4B08C`** |
| | | | `Orhan Bey Külliyesi Klasörü/DJI_20241023171347_0463_D_ODAK-Edit.jpg` [64, 50, 70, 62] | G | `#BBA783` |  | | |
| | | | `Orhan Bey Külliyesi Klasörü/ERD03033 kopya.jpg` [29, 42, 33, 56] | D | `#AF8F78` | pencere | | |
| | | | `Orhan Bey Külliyesi Klasörü/ERD03033 kopya.jpg` [38.5, 52, 43.5, 60] | D | `#AF8664` |  | | |
| | | | `Orhan Bey Külliyesi Klasörü/ERD03062 kopya.jpg` [81, 32, 86, 46] | D | `#7F6B5D` | pencere ve gölgeli yan yüz | | |
| | | | `Orhan Bey Külliyesi Klasörü/ERD03062 kopya.jpg` [47, 35, 52, 44] | D | `#826E62` |  | | |
| Kasnak (almaşık) | Kasnak | `#E9DFC4` / 0.894 / `#DED4BA` | `Orhan Bey Külliyesi Klasörü/DJI_20241023171347_0463_D_ODAK-Edit.jpg` [40, 23, 45, 30] | G | `#C7B38F` |  | 0.44–0.67 | **`#C4B08C`** |
| | | | `Orhan Bey Külliyesi Klasörü/DJI_20241023171347_0463_D_ODAK-Edit.jpg` [51, 23, 62, 30] | G | `#C0AC88` |  | | |
| | | | `Orhan Bey Külliyesi Klasörü/ERD03033 kopya.jpg` [26, 33, 31, 37] | D | `#AF9888` | gökyüzü | | |
| | | | `Orhan Bey Külliyesi Klasörü/ERD03062 kopya.jpg` [59, 22, 66, 26] | D | `#796760` | ağaç dalı | | |
| | | | `Orhan Bey Külliyesi Klasörü/ERD03062 kopya.jpg` [69.5, 18, 74, 22] | D | `#7F6B60` |  | | |
| Kurşun kubbe | Kubbe | `#BCC2C6` / 0.885 / `#B2B8BC` | `Orhan Bey Külliyesi Klasörü/DJI_20241023171347_0463_D_ODAK-Edit.jpg` [40, 14, 58, 18] | G | `#687596` |  | 0.48–0.59 | **`#687596`** |
| | | | `Orhan Bey Külliyesi Klasörü/ERD03062 kopya.jpg` [52, 16.5, 58, 19] | D | `#68738B` |  | | |
| | | | `Orhan Bey Külliyesi Klasörü/ERD03062 kopya.jpg` [42, 28, 48, 29.5] | D | `#8891A6` |  | | |
| | | | `Orhan Bey Külliyesi Klasörü/ERD03062 kopya.jpg` [70, 13, 76, 15.5] | D | `#757784` |  | | |
| Kirpi saçak (tuğla) | Kirpi, Tugla | `#D0794C` / 0.894 / `#C67348` | `Orhan Bey Külliyesi Klasörü/DJI_20241023171347_0463_D_ODAK-Edit.jpg` [37, 36, 62, 37.5] | G | `#5F4629` |  | 0.27–0.27 | **`#5F4629`** |

## Orhan Bey Hamamı (v05)

Görsel: `eserler/orhan-bey-hamami/3d/kontrol/renk-olcumu_2026-10-28.png`

| Rol | Model malzemeleri | Model: malzeme / köşe rengi / görünen | Fotoğraf + bölge (%) | Işık | Örnek | Atıldı | Foto aralığı (L) | Önerilen hex |
|---|---|---|---|---|---|---|---|---|
| Kurşun kubbe | Kubbe, Kursun | `#BCC2C6` / 0.896 / `#B3B9BD` | `Orhan Bey Külliyesi Klasörü/05 ERD07961 kopya.jpg` [36, 21, 48, 24] | G | `#A4ABBF` |  | 0.56–0.79 | **`#A4ABB1`** |
| | | | `Orhan Bey Külliyesi Klasörü/ERD07972 kopya.jpg` [44, 49.5, 56, 53] | G | `#868B97` |  | | |
| | | | `Orhan Bey Külliyesi Klasörü/ERD07972 kopya.jpg` [28, 47, 36, 50.5] | G | `#E0CCB1` |  | | |
| | | | `Orhan Bey Külliyesi Klasörü/ERD07972 kopya.jpg` [36, 78, 42, 82] | G | `#626874` | gölgeli yüz | | |
| | | | `Orhan Bey Külliyesi Klasörü/02 DJI_20250815231145_0095_D-Edit.jpg` [50, 74, 62, 82] | G* | `#575F65` | çekim saati belirsiz (23:11), alçak güneş | | |
| Duvar (moloz + tuğla) | Duvar | `#E3D8B8` / 0.873 / `#D6CBAD` | `Orhan Bey Külliyesi Klasörü/03 ERD07969 kopya.jpg` [13, 55, 24, 66] | G | `#C39176` |  | 0.61–0.67 | **`#C69D80`** |
| | | | `Orhan Bey Külliyesi Klasörü/03 ERD07969 kopya.jpg` [13, 72, 24, 84] | G | `#4F3C34` | gölge | | |
| | | | `Orhan Bey Külliyesi Klasörü/05 ERD07961 kopya.jpg` [48, 42, 57, 56] | G | `#CAA98A` |  | | |
| | | | `Orhan Bey Külliyesi Klasörü/05 ERD07961 kopya.jpg` [6, 40, 26, 58] | G | `#614836` | gölge | | |
| Kasnak | Kasnak | `#DCD1AD` / 0.891 / `#D1C7A4` | `Orhan Bey Külliyesi Klasörü/05 ERD07961 kopya.jpg` [28, 28, 36, 33] | G | `#85604B` |  | 0.38–0.41 | **`#85604C`** |
| | | | `Orhan Bey Külliyesi Klasörü/05 ERD07961 kopya.jpg` [40, 28, 52, 33] | G | `#614432` | gölge | | |
| | | | `Orhan Bey Külliyesi Klasörü/ERD07972 kopya.jpg` [42, 57, 52, 61] | G | `#76604C` |  | | |
| | | | `Orhan Bey Külliyesi Klasörü/ERD07972 kopya.jpg` [23, 55, 30, 58] | G | `#85654C` |  | | |
| Tuğla (alınlık) | Tugla, Kirpi | `#D0794C` / 0.905 / `#C77448` | `Orhan Bey Külliyesi Klasörü/03 ERD07969 kopya.jpg` [36, 36.5, 46, 39] | G | `#683528` |  | 0.28–0.28 | **`#683528`** |

## Emir Hanı (v05)

Görsel: `eserler/emir-han/3d/kontrol/renk-olcumu_2026-10-28.png`

| Rol | Model malzemeleri | Model: malzeme / köşe rengi / görünen | Fotoğraf + bölge (%) | Işık | Örnek | Atıldı | Foto aralığı (L) | Önerilen hex |
|---|---|---|---|---|---|---|---|---|
| Çatı: gri beton/membran | Cati_Kursun | `#BCC2C6` / [0.932, 0.932, 0.932] / `#B6BCC0` | `Orhan Bey Külliyesi Klasörü/DJI_20241017120754_0008_D kopya.jpg` [44, 78, 58, 86] | G | `#6F6564` |  | 0.41–0.41 | **`#6F6564`** |
| Çatı: yeşil kaplama | Cati_Kursun | `#BCC2C6` / [0.932, 0.932, 0.932] / `#B6BCC0` | `Orhan Bey Külliyesi Klasörü/DJI_20241017120754_0008_D kopya.jpg` [33, 68, 40, 72] | G | `#61635C` |  | 0.38–0.38 | **`#61635C`** |
| Çatı: mavi kaplama | Cati_Kursun | `#BCC2C6` / [0.932, 0.932, 0.932] / `#B6BCC0` | `Orhan Bey Külliyesi Klasörü/DJI_20241017120754_0008_D kopya.jpg` [62, 68, 70, 74] | G | `#3F4660` |  | 0.31–0.31 | **`#3F4660`** |
| Revak ayağı (moloz-tuğla) | Revak_Ayak | `#E8D9B9` / [0.838, 0.838, 0.838] / `#D7C9AB` | `Orhan Bey Külliyesi Klasörü/ERD02275 kopya.jpg` [40, 28, 50, 46] | D | `#4F432E` |  | 0.24–0.36 | **`#5D4F3E`** |
| | | | `Orhan Bey Külliyesi Klasörü/ERD02275 kopya.jpg` [50, 48, 58, 62] | D | `#383323` | ayağın gölgeli yüzü | | |
| | | | `Orhan Bey Külliyesi Klasörü/ERD02275 kopya.jpg` [64, 38, 70, 58] | D | `#6B5B4F` |  | | |
| | | | `Orhan Bey Külliyesi Klasörü/ERD02236 kopya.jpg` [71.5, 38, 73.5, 50] | D | `#A08F81` | kemer ve korkuluk karıştı | | |
| Dış duvar (almaşık) | Duvar_Almasik | `#E7D7AF` / [0.839, 0.839, 0.839] / `#D6C7A2` | `Orhan Bey Külliyesi Klasörü/ERD02236 kopya.jpg` [93, 22, 99, 32] | D | `#807875` | kemer boşluğu karıştı | 0.45–0.63 | **`#AC9483`** |
| | | | `Orhan Bey Külliyesi Klasörü/ERD02242 kopya.jpg` [22, 26, 30, 30] | D | `#585C55` | ağaç | | |
| | | | `Orhan Bey Külliyesi Klasörü/DJI_20241017120754_0008_D kopya.jpg` [33, 77, 39, 80] | G | `#818B7E` | çatı karıştı | | |
| | | | `Orhan Bey Külliyesi Klasörü/DJI_20241017120754_0008_D kopya.jpg` [41.6, 82, 42.6, 83] | G | `#AC9486` |  | | |
| | | | `Orhan Bey Külliyesi Klasörü/DJI_20241017120754_0008_D kopya.jpg` [45.5, 84.6, 46.5, 85.6] | G | `#796F6A` |  | | |
| | | | `Orhan Bey Külliyesi Klasörü/DJI_20241017120754_0008_D kopya.jpg` [35.2, 77.6, 36, 78.4] | G | `#C09B83` |  | | |
| Beyaz sıva tonoz | Siva_Tonoz | `#E8DFCB` / [0.856, 0.856, 0.856] / `#D9D0BD` | `Orhan Bey Külliyesi Klasörü/ERD02275 kopya.jpg` [46, 4, 58, 14] | D | `#5A5859` | tonozun gölgeli kısmı | 0.64–0.64 | **`#A5A1A0`** |
| | | | `Orhan Bey Külliyesi Klasörü/ERD02275 kopya.jpg` [80, 30, 86, 38] | D | `#A5A1A0` |  | | |
| Avlu taşı | Avlu_Tas | `#D3C4A5` / [0.864, 0.864, 0.864] / `#C6B89A` | `Orhan Bey Külliyesi Klasörü/ERD02242 kopya.jpg` [8, 62, 20, 74] | D | `#8D95A8` |  | 0.36–0.61 | **`#8D8A8F`** |
| | | | `Orhan Bey Külliyesi Klasörü/ERD02242 kopya.jpg` [84, 64, 96, 74] | D | `#4D596A` |  | | |
| | | | `Orhan Bey Külliyesi Klasörü/ERD02236 kopya.jpg` [60, 84, 80, 92] | D | `#8F8A8F` |  | | |
| Baca tuğlası | Baca_Tugla | `#D37E67` / [0.877, 0.877, 0.877] / `#C77761` | `Orhan Bey Külliyesi Klasörü/DJI_20241017120754_0008_D kopya.jpg` [43.9, 75, 44.5, 76.5] | G | `#8D817D` | çatıya düştü | 0.73–0.73 | **`#D6AE9D`** |
| | | | `Orhan Bey Külliyesi Klasörü/DJI_20241017120754_0008_D kopya.jpg` [47.1, 75.5, 47.8, 77] | G | `#D6AE9D` |  | | |

## Orhan Gazi Türbesi (v02)

Görsel: `eserler/orhan-gazi-turbesi/3d/kontrol/renk-olcumu_2026-10-28.png`

| Rol | Model malzemeleri | Model: malzeme / köşe rengi / görünen | Fotoğraf + bölge (%) | Işık | Örnek | Atıldı | Foto aralığı (L) | Önerilen hex |
|---|---|---|---|---|---|---|---|---|
| Kurşun kubbe / etek | Kursun | `#BCC2C6` / 0.9 / `#B3B9BD` | `Türbeler Klasörü/DJI_20241022140310_0147_D_ODAK-Edit.jpg` [45, 27, 55, 32] | G* | `#CCC4BD` |  | 0.72–0.88 | **`#C6C0C5`** |
| | | | `Türbeler Klasörü/DJI_20241022140310_0147_D_ODAK-Edit.jpg` [50, 42, 62, 46] | G* | `#C9A98B` | alçak güneşin sıcak yansıması | | |
| | | | `Türbeler Klasörü/03.jpg` [40, 46, 52, 52] | G | `#C6C0C5` |  | | |
| | | | `Türbeler Klasörü/03.jpg` [36, 60, 46, 68] | G | `#EAD9D6` |  | | |
| | | | `Türbeler Klasörü/03.jpg` [38, 20, 52, 23] | G | `#BAB4BA` |  | | |
| | | | `Türbeler Klasörü/08_1.jpg` [28, 17, 38, 20] | G | `#B7B5AF` | gökyüzü ve yaprak karıştı | | |
| Cephe sıvası (krem) | Cephe_Krem | `#E8DFCB` / 0.822 / `#D5CCBA` | `Türbeler Klasörü/DJI_20241022140310_0147_D_ODAK-Edit.jpg` [60, 58, 70, 66] | G* | `#FEE2B6` |  | 0.85–0.86 | **`#FEE4B8`** |
| | | | `Türbeler Klasörü/DJI_20241022140310_0147_D_ODAK-Edit.jpg` [60, 70, 64, 80] | G* | `#FFE5BA` |  | | |
| | | | `Türbeler Klasörü/08_1.jpg` [14, 28, 18, 40] | G | `#918065` | ağaç gölgesi benekli | | |
| Silme / kasnak (beyaz) | Silme_Beyaz | `#F5F4F0` / 0.869 / `#E6E5E2` | `Türbeler Klasörü/DJI_20241022140310_0147_D_ODAK-Edit.jpg` [50, 49, 65, 51] | G* | `#FCF5EB` |  | 0.95–0.95 | **`#FCF5EB`** |
| | | | `Türbeler Klasörü/DJI_20241022140310_0147_D_ODAK-Edit.jpg` [40, 36, 60, 38] | G* | `#C3B5A1` | gölgeli diş sırası | | |
| | | | `Türbeler Klasörü/08_1.jpg` [11, 25, 12.5, 45] | G | `#6B716B` | bölge kaydı (ağaç) | | |
| Ahşap giriş holü | Ahsap_Koyu | `#6B4A3A` / 0.834 / `#624435` | `Türbeler Klasörü/08_1.jpg` [44, 40, 48, 50] | G | `#251706` | revak gölgesinde kapı (ışık yetersiz) | | |

## «Kullanıcı kararı» çakışmaları (değiştirilmedi, karar senin)

| Betik | Değer | Fotoğraf | Durum |
|---|---|---|---|
| `ulu-cami/3d/build/build_v23.py:230` Minare_Kulah | `#E6D8BA` bej (şerefe ile aynı) | ölçülmedi (külah ince, fotoğraflarda küçük) | prompt'ta adı geçiyor; dokunulmadı |
| `ulu-cami/3d/build/build_v23.py:234` minare tuğlası | `#986B4D` (v22, kullanıcı kararı) | Ulucami ölçümü `#8E6A4E` | v26'da `#CF7F55`'e çevrilmiş; yeni ölçüm v23 kararına **çok yakın** (ΔL ≈ −0,03) |
| `_GENEL_SAHNE_STANDARDI.md` §3 kurşun | `#BCC2C6` (21 Ekim, yedi modelde tek değer) | Ulucami, Bedesten, Türbe güneşte aynı; Hamam `#A4ABB1` biraz koyu; Koza, Orhan Camii yalnız gölgede ölçüldü | ortak kurşun `#BCC2C6` kalsın öneriliyor |
| `orhan-bey-kulliyesi/3d/build/build_v06.py:163`, `orhan-bey-hamami/3d/build/build_hamam_v04.py:101` | kurşun `#858E94` (19 Ekim kullanıcı kararı) | — | 21 Ekim kararı (`#BCC2C6`) bunun yerine geçti; bilgi için |
| `yildirim-bayezid-bedesteni/3d/build/build_v05.py:95` | kubbe `#858D93` eskimiş kurşun | güneşte `#C2C0C0` civarı | 21 Ekim kararıyla zaten `#BCC2C6` |

## Ölçülemeyen ya da zayıf roller

- **Emir Hanı çatısı:** fotoğrafta kurşun değil. Dron fotoğrafında (DJI_…0008) çatının ortası gri beton/membran, bir kanadı yeşil, iki kanadı mavi-siyah kaplama (shingle). Model `Cati_Kursun` `#BCC2C6`. Soru: model gerçek durumu mu (gri/yeşil/mavi) yoksa özgün kurşun örtüyü mü göstersin? Karar verilmeden değiştirmedim.
- **Emir Hanı dış duvar:** yalnız dron fotoğrafında ince bir şerit; kırpıntılar karışık (çatı kenarı, gölge). Düşük güven.
- **Emir Hanı revak ayağı, beyaz sıva tonoz, avlu taşı:** yalnız revak içi / bulutlu fotoğraflar (D). Değerler ışık yüzünden koyu; beyaz sıvanın `#A5A1A0` çıkması bunu gösteriyor. Öneri: bu üç rol için fotoğraf hex'i kullanılmasın; tonoz beyaz kalsın, ayak ve avlu için güneşli fotoğraf bulunana kadar mevcut değer.
- **Koza Han:** dış cephe ve mescit fotoğraflarının hepsi gölgede (ERD); tek güneşli fotoğraf (DJI_…0330) alçak, sıcak akşam güneşi. Kurşun yalnız gölgede ölçülebildi.
- **Bedesten duvarı:** dükkânlar duvarı örtüyor; 2 fotoğrafta 2 bölge (0654, 0290). Bedesten duvarı fotoğrafta **almaşık** (taş + tuğla bantları); modelde düz açık taş dokusu (`#E3DDBE`).
- **Orhan Gazi Türbesi cephe sıvası:** tek güneşli fotoğraf (DJI_…0147) alçak, sıcak güneşte; değer `#FEE4B8` doymuş, sarıya kaymış. Öneri: krem sıva için bu değer kullanılmasın (ışık rengi); 08_1 fotoğrafında duvar ağaç gölgesi altında.
- **Tuğla:** çoğu eserde tuğla ince bant; ayrı ölçülebilen bölge az (Orhan kirpi 1, Hamam alınlık 1, Emir baca 1). Ulucami minare tuğlası `#8E6A4E` ölçülü.
- **Orhan Bey Hamamı fotoğraf 0095** (DJI_20250815231145): dosya adındaki saat 23:11 ama görüntü gündüz; saat belirsiz ve ışık alçak olduğu için atıldı.

## Ortak rol önerisi (malzeme-paleti.json)

Ortak hex: rolde Ulucami'nin karara bağlı değeri varsa o çapa, yoksa eserlerin ortancası. Bir eserin güneşli ölçümü çapadan ±0,05 açıklık ve ±6° ton içindeyse ortak değeri alır (doygunluk < 0,12 ise ton bakılmaz); değilse `eser_istisna`. Kurşunda istisna otomatik yazılmadı (bkz. açık sorular).

| Rol | Ortak hex | Üyeler | İstisnalar |
|---|---|---|---|
| kursun | `#BCC2C6` | Ulucami, Bedesten, Orhan Gazi Türbesi | — |
| kasnak_sari_siva | `#D2B276` | Ulucami | — |
| duvar | `#AF9A7D` | Ulucami, Bedesten | Orhan Bey Camii `#C4B08C`, Orhan Bey Hamamı `#C69D80`, Emir Hanı `#AC9483` |
| tugla | `#8E6A4E` | Ulucami | Orhan Bey Camii `#5F4629`, Orhan Bey Hamamı `#683528`, Emir Hanı `#D6AE9D` |
| mermer | `#E6E2D6` | Ulucami | — |
| kasnak_almasik | `—` | — | Orhan Bey Camii `#C4B08C`, Orhan Bey Hamamı `#85604C` |

Dosya: `eserler/_kutuphane/malzeme-paleti.json` (`_durum: ÖNERİ`). Onaydan sonra 2. aşama bu dosyayı tek kaynak olarak okur.

## Ölçüm araçları

Betikler repoya konmadı (oturum çalışma klasöründe): GLB malzeme okuma (gltf-transform + Draco), bölge ortancası ve kırpıntı sayfası (Python/Pillow). Bölgelerin tamamı yukarıdaki tablolardadır; aynı bölgelerle yeniden ölçülebilir.

## Ek ölçüm ve kararlar (28 Ekim 2026, kullanıcı «en iyi sonuç için sen karar ver» dedi)

| Konu | Karar | Kaynak ve yöntem |
|---|---|---|
| Emir Hanı çatısı | **Kurşun kalır** (`#BCC2C6`) | Envanter cilt 1: «üzeri kurşunla kaplıdır; ancak bir dönem kiremitle örtüldüğü bilinmektedir». 2024 dron fotoğrafındaki gri, yeşil ve mavi kaplamalar geçici ya da onarım katmanı; çatı sokaktan görünmez. Kaynağa uymak ve yedi eserde aynı kurşun. |
| Koza Han duvarı | **`#8E887F`** (istisna) | `Ticari Yapılar Klasörü/DJI_20241023135706_0377` (Koza `ref/kaynak_dizini.json`: almaşık pencere detayı). Bölgeler [40,44–58,96] ve [84,44–99,96] (pencereler arası saf almaşık), ortanca `#827D74`. Doğrudan güneş yok: aynı karedeki beyaz harç `#DBD9D4`, güneşli fotoğraflardaki harç `#EDEBE9`'a doğrusal çarpanla (1,21) eşitlendi. Gölgede çekilen ERD fotoğraflarıyla tutarlı (`#848079`, `#78736B`). |
| Orhan Gazi Türbesi krem sıva | **`#F5E4C9`** | `Türbeler Klasörü/08_1.jpg`, bölgeler [12,25–22,38], [13,40–19,48], [20,26–26,33]; ağaç gölgesi benekli duvarda yalnız güneş alan pikseller (bölgenin en parlak %15'i): `#F5E4C9`, `#FCEDD4`, `#EDDCC2`. Gölgedeki kısım `#6D6350`–`#7A7162` (ışık farkı). |
