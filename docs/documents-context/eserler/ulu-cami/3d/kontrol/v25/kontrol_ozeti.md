# Ulu Cami v25 — kontrol özeti (19 Ekim 2026)

Görseller `build/render_v25.py` ile `blend/ulu-cami_v25.blend`'den alındı (açılar `render_v24.py` ile aynı; modele dokunulmadı, blend kaydedilmedi, GLB yeniden alınmadı). v25 v24'e yalnız ağaç dokusu ekledi; geometri aynı (`kontrol_rapor.json`: `geometri_degismedi`). Bu yüzden v24 kontrolündeki karşılaştırma ve hata listesi v25 görselleri üzerinde yeniden denetlenerek buraya taşındı. `olcu_dogrulama.json` v24 turunda yazıldı (kaide dairesi, kenar payları); geometri değişmediği için v25 için de geçerli.

## Fotoğrafla karşılaştırma
- **yan_yana_kuzeybati**: İki minare, 5 × 4 kubbe düzeni, taç kapı ve iki şadırvan fotoğrafla uyuyor. Uymayan: fotoğraftaki çevre binalar ve dağ yok; kubbe kurşunu düz renk; batı minaresinin alt kaidesi fotoğrafa göre sade.
- **yan_yana_tac_kapi**: Portal oranı, sivri kemer ve mukarnas konumu tutuyor. Uymayan: mermer dokusu ve kenar süslemesi yok, kapı yeşil çift kanat (fotoğrafta yeşil örtü ve iç mekân), mukarnas fotoğrafa göre yassı.
- **yan_yana_ust_20_kubbe**: Yön doğru (kuzey yukarıda, batı minare solda), 20 kubbe ve ortadaki cam fener aynı yerde. Uymayan: kubbelerde kaburga yok, çatı bölmeleri düz.
- **yan_yana_bati_minare**: Cephe kemerleri, şebekeli pencereler ve minare kaidesi aynı sırada. Uymayan: mermer ve siyah şerit dokusu, çıkma ve merdiven ayrıntıları, taş doku.
- **yan_yana_avlu_sadirvan**: Sekizgen plan, sütunlar, korkuluk ve soğan kubbe uyuyor. Uymayan: kubbe fotoğrafa göre alçak, arka bina yok. Soldaki çınarın (v25'te yaprak dokulu) tacı kadrajın üst köşesine giriyor.
- **yan_yana_mermer_cesme**: Çeşme gövdesi, sivri niş ve minare/cephe yönü uyuyor. Uymayan: model kadrajda ağaç ve figürle kalabalık, taş dokusu yok.
- **yan_yana_ic_sadirvan**: Çokgen havuz, üç kademeli fıskiye ve musluklar var. Uymayan: model 12 kenarlı sade, fotoğrafta kabartmalı mermer; iç mekân boş (sütun, kemer, hat yok); ışık yapay.

## Hatalar (v24'te bulundu, düzeltilmedi; v25 görsellerinde yeniden bakıldı)
| # | Hata | Dosya, konum | v25 |
|---|---|---|---|
| 1 | **Kaçık kapı kanadı**: kanat sol alt kenarda çerçeve kemerinin dışına taşıyor, sol kenar basamaklı | `yakin_bati_kapi.png`, kanadın sol kenarı (x≈430, y 560–950) | görülüyor |
| 2 | **Siyah şerit** (ışık sızıntısı veya boşluk): havuz gövdesi ile taban arasında | `yakin_sadirvan_taban.png`, sağ alt (x 510–850, y 800–975); `Avlu_Sadirvan_Dogu` | görülmedi |
| 3 | **Siyah küçük kareler**: portal silmesinin üst iki köşesinde | `yan_yana_tac_kapi.png` (sağ yarı, x≈685/1125, y≈230); `sunum_02_tac_kapi_avlu.png` (x≈735/1080, y≈400) | görülüyor |
| 4 | **Siyah noktalar**: çeşme havuzunun köşelerinde | `yakin_figurler.png`, sol alt (x 45/295/520, y 690–760); `Avlu_Mermer_Cesme` | görülmedi |
| 5 | **Koyu leke / açıklıkta artık**: ortadaki cam fenerin güney dibinde | `sunum_03_guneydogu.png` (x≈845, y≈495) | görülüyor |
| 6 | Şebeke penceresinde alt kenarda ince koyu çizgi, sol kenarda hafif koyu bant | `yakin_sebeke.png` (x 345–1005, y≈410) | görülüyor |

2 ve 4 v25 render'ında görünmüyor; geometri değişmediği için düzeldikleri söylenemez (v25 render'ları Metal GPU'da, v24'ünkiler CPU'da alındı; gölge/gürültü farkı olabilir). Bulunmayanlar: havada parça, z-fighting (cephe, kaide, kasnak/kubbe birleşimi temiz), alpha sıralama hatası (Cycles'ta görünmez, GLB görüntüleyicisinde test edilmedi). Figürler 1,6–1,7 m ölçekte, havada değil. `dort_yon.png` ve `ust_orto.png`: kaide dairesi tam kadrajda.

## GLB boyutu
`export/ulu-cami_v25.glb` = 719 136 bayt (**0,719 MB**), `_sunum.glb` = 726 004 bayt (0,726 MB); ikisi de Draco, hedef ≤ 1 MB ✔ (v24: 1,002 / 1,011 MB). `kontrol_rapor.json`'daki `boyut_mb` (7,489 / 7,561) diskteki dosyalarla uyuşmuyor; rapor yazılırken ölçülen ara dosya olabilir.

## GLB nesne adları (`ulu-cami_v25.glb`, 39 düğüm; v24 ile aynı)
Alemler, Avlu_Mermer_Cesme, Avlu_Sadirvan_Bati, Avlu_Sadirvan_Dogu, Cati, Cephe_Bati, Cephe_Dogu, Cephe_Guney, Cephe_Kuzey, Cevre_Agac_01, Cevre_Agac_02, Cevre_Tarh_01, Giris_Cikintili_Blok, Govde, Ic_Sadirvan_Havuz, Ic_Zemin, Kapi_Bati, Kapi_Dogu, Kasnak_Pencereleri, Kubbeler_19, Mermer_Bant, Minare_1, Minare_2, Olcek_Insan_01…10, Pencere_Girintileri, Portal_Silmeleri, Sadirvan_Iskeleti, Sadirvan_Kubbe, Silme_Ust, Tac_Kapi. (Sunum GLB'sinde ek: Zemin_Avlu_Derz, Zemin_Avlu_Tas, Zemin_Kaide.)

Hikâye ekranı adları: **Kubbeler_19 ✔, Sadirvan_Kubbe ✔, Tac_Kapi ✔, Minare_1 ✔, Minare_2 ✔, Govde ✔**: hepsi var (her iki GLB'de). Alpha (BLEND) malzemeler: Kafes_Beyaz, Kafes_Beyaz.001, Sadirvan_Cam.001.

## Görsel listesi
`sunum_01_kuzeybati` … `sunum_05_sadirvan`, `yan_yana_*` (7), `dort_yon.png` (üst: kuzey, doğu; alt: güney, batı), `ust_orto.png`, `yakin_*` (şebeke, batı kapısı, figürler, şadırvan tabanı, kubbe eteği).
