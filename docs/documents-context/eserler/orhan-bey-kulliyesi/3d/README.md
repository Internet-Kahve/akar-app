# Orhan Bey Camii · 3d üretim klasörü

Yalnız **son sürüm** tutulur. Eski sürümlerin kararları aşağıdaki tabloda ve `../orhan-bey-kulliyesi_notlar.md` "Ek: Geçmiş kayıt" bölümündedir. Hamam ve Emir Hanı üretimleri kendi klasörlerindedir.

## Güncel sürüm: v11 (29 Ekim 2026) · iç mekân («İçini göster» + ayrıntı; iç parçalar yalnız sunumda)

Betik `build/build_v11.py` → `build/doku_ic_v11.py` → `build/build_v11_ic.py` (Blender, v10 blend'ini açar, dokunmaz) → `_kutuphane/blend_hat/uret.py`. **İki dosya:** sunum GLB'si dış + iç; harita GLB'si yalnız dış (`model.json → ic_parcalar`). **Kalkan gruplar:** [`Kubbe_Ana`, `Kubbe_Mihrap`, `Kubbe_Tabhaneler`, `Kubbe_Pencereler`, `Ic_Kubbeler`] → [`Cami_Ortu`]. Kontrol `kontrol/v11/` (`icini_goster.png`, `ic_detay.png`, `ic_kaynak.png`, `dis_esitlik.png`, `tiklama_haritasi.png`, `doku_ic_atlas.png`, `parca_dogrulama.json`, `ic_rapor.json`, `blend_rapor.json`).

Koordinat: plan (`ref/plan/okuma_cami_plan_1m_grid.png`, 1 m ızgara) u/v → model x = 12,85 − u, y = 16,75 − v; kıble güneyde (−y).

| Kök parça | Ne | Ölçü | Kaynak |
|---|---|---|---|
| `Cami_Ortu` (yeni, dış, 2. grupta kalkar) | Cami_Govde ve Cami_Mihrap'taki kurşun damlar, kanat ve koridor çatıları, saçak altlarının duvar içindeki kısmı | — | v10 geometrisi (değişmedi) |
| `Kubbe_Pencereler` (yeni, dış, 1. grupta kalkar) | Cami_Govde'deki kasnak pencere söveleri ve kubbe alemleri (kubbelerle birlikte kalksın diye) | — | v10 geometrisi |
| `Cami_Govde`, `Cami_Mihrap` (değişti) | Bloklar arasındaki iç yüzlerin oda ve açıklıklarla kesişen kısmı silindi (dışarıdan görünmez; kanat damı üstündeki dış duvar kaldı); saçak altının dışa taşan şeridi gövdede kaldı (kutu ±13,10 aynı) | — | — |
| `Kubbe_Ana`, `Kubbe_Mihrap`, `Kubbe_Tabhaneler` (değişti) | Aşağı bakan iç diskler (kasnak ve kubbe tabanı) yukarı çevrildi; geometri ve UV aynı | — | — |
| `Orta_Mekan` | İç duvarlar, orta kubbe bölmesi | x ±4,60, y −4,60 … 5,35 | P; E C1 PDF 101 |
| `Mihrap_Eyvani` | İç duvarlar, orta mekândan ayıran geniş kemer, tromplar arasında yazılı lunet ve iki sekizgen levha (kırpma) | x ±4,60, y −15,65 … −5,65; zemin +0,63 | E C1 PDF 101–102 («9,64 × 8,83», «geniş açıklıklı sivri kemer», «dört basamaklı mermer merdiven»); F 02, 03 |
| `Tabhaneler` | İki tabhane, orta mekâna sivri kemerle açılır; koridora kapı | x ±(5,75 … 11,75), y −3,55 … 4,55; zemin +0,23; kemer 4,8 m açıklık, üzengi +3,2, tepe +5,9 (**T**) | E C1 PDF 101 («6,05 × 9,10», «sivri kemerlerle ayrılmış ve birer basamakla çıkılan»); P |
| `Giris_Koridoru` | Kuzey koridoru, iki ara duvar, kapılar, ana kapının iç yüzü | x ±11,75, y 6,45 … 9,45 | P |
| `Pandantifler` | 4 kubbe bölmesinde geçiş yüzeyi; mihrap kubbesinde tromp kırpması; çift yüzlü | — | E «prizmatik tromplar ve Türk üçgenleri»; F 02 |
| `Ic_Kubbeler` (1. grupta kalkar) | Kasnak ve kubbe içleri; mihrap kubbesi F 07 kırpması (kırmızı madalyon); kasnak pencereleri içten (14, dış söve yerlerinden) | Kubbe tepeleri: orta +16,0, mihrap +14,1, tabhane +10,2 (dış kubbelerin altında, **T**) | E «kırmızı madalyon içinde baklava motifi», «kubbede üç pencere»; F 07 |
| `Ic_Zemin` | Halı (orta mekân ve eyvan), 4 mermer basamak, tabhane ve koridor taş döşeme | Basamak 0,15 × 0,26 (**T**) | Halı F 02 (renk ölçümü); E «dört basamaklı mermer merdiven»; tabhane/koridor döşemesi **T** |
| `Ic_Mihrap` | Alçı mihrap (önden fotoğraf kırpması, tarihi şamdanlar kırpmada), tepelik, mermer seki | 3,36 × 5,00 m + tepelik 1,15 (F 03 oranından, alt pencerelere göre ölçekli, **T**) | E C1 PDF 102; F 03 |
| `Minber` | Ahşap minber (29 Ekim düzeltmesi): üçgen çerçeveli ve dikey panelli yan aynalar, ≈ 0,11 m arayla çubuklu korkuluk ve küpeşte, dört ince dikmeli köşk ve saçak, ince sivri külah ve alem; kapıda mavi zeminli yazılı pano, üstünde yazı kuşağı ve taç (F 02 kırpmaları). Ahşap `orhan_minber`, çıtalar bir ton açık `orhan_minber_cita` (F 02 ölçümü) | 0,90 genişlik, 3,90 uzunluk, köşk +3,03, külah tepesi +7,38 (**T**) | E C1 PDF 103 («minber … ahşap … sade»); F 02 (mihrabın batısında) |

Duvar pencereleri (20) içten: Cami_Govde'deki cam levhaların yerinden içe ışın atılarak iç duvara kondu; üstler yuvarlak kemerli alçı şebeke, altlar sivri kemerli ve üstünde kalem işi alınlık (F 03 kırpmaları; E «üst pencereler yuvarlak kemerli, alt pencereler … sivri kemerli»).

**Dokular:** `build/doku_ic_v11/ic_atlas.jpg` (1024 × 1024, 167 KB; kırpmalar ve kaynakları `kaynak.json`'da: F 02, 03, 07) ve `hali.jpg` (256 px = 1,2 m, kod). Yazılar yalnız fotoğraf kırpmasında; üretilmedi. **Yeni renk rolleri:** `orhan_hali`, `orhan_hali_koyu`, `orhan_minber`, `orhan_minber_cita` (F 02; fotoğraf gün ışığında, beyaz duvar nötre yakın). Duvarlar `krem_siva`, mermer `mermer`, taş döşeme `ic_zemin_tas` (ortak palet).

**Sayılar** (v10 → v11): harita 15 974 → 16 074 üçgen, 254 → 259 KB, çizim çağrısı 53 → 57, doku 15; sunum 20 662 → 29 490 üçgen, 324 → 570 KB, çizim çağrısı 70 → 84, doku 18 → 20 (kullanıcı kabul etti). Dış eşitlik harita ↔ sunum en çok %0,020; harita v10 ↔ v11 en çok %0,095 (80°, azimut 200, yakın). Referans denetimi c, d geçti.

**Belirsiz / atlanan:** orta kubbe ve tabhane kubbelerinin kalem işi (fotoğraf yok; düz sıva; E «rumi palmet»); mahfiller (E «müezzin mahfili»: fotoğraf yok), vaaz kürsüsü (F 02'de var, sade bırakıldı, modellenmedi), avize, Kuran mahfazası; tabhane ocak/nişleri (kaynakta yok); tabhane ve koridor döşemesi; mihrap nişi düz yüzey (derinlik fotoğrafta); sütun yok (kaynakta yok). Mihrap kubbesi kırpmasının yönü (fotoğrafın üstü batı) **T**.

### v10 ve öncesi

### Önceki: v07 (21 Ekim 2026)

v06 + ortak palet ve yumuşak pişirme; geometri ve parça adları aynı (aşağıdaki «Nesneler» ve «Parça adı değişikliği» v07 için de geçerli). Betik `build/build_v07.py` (v06 blend'ini açar, `_kutuphane/palet_v2/` ile yalnız rengi ve pişirilmiş ışığı değiştirir), sahne `blend/orhan-bey-camii_v07.blend`, uygulama modeli `export/orhan-bey-camii_v07.glb` (yalnız yapı, Draco, 0,27 MB, 16 014 üçgen, 12 nesne), sunum `export/orhan-bey-camii_v07_sunum.glb`, render'lar `kontrol/v07/`. v06 blend'i silindiği için `build_v07.py`'yi baştan çalıştırmak için v06'yı git geçmişinden almak gerekir.

### v06 (19 Ekim 2026)

| Dosya | İçerik |
|---|---|
| `build/build_v06.py` | Blender üretim betiği; ölçüler en üstte `P` sözlüğünde. Kütüphane: `eserler/_kutuphane/akar3d.py` |
| `build/cevre_v06.py` | Çınar, bordür ve en küçük çember yardımcıları |
| `build/doku/` | dokular ve üreticisi `doku_uret.py`; ağaç gövdesi `agac_govde_notr.png` üreticisi `eserler/_kutuphane/agac_doku.py --notr` (Ulu Cami ve Koza Han ağaçlarıyla ortak) |
| `build/araclar/` | `yan_yana.py` (Ayverdi bindirmesi), `foto_yan_yana.py` (fotoğraf ↔ render) |
| `blend/orhan-bey-camii_v06.blend` | Sahne — **silindi** (21 Ekim 2026; yerine v07) |
| `export/orhan-bey-camii_v06.glb` | Uygulama modeli, zeminsiz, yalnız yapı: ağaç, çevre döşemesi ve figür yok (Draco, 172 KB) — **silindi** (21 Ekim 2026; yerine v07) |
| `export/orhan-bey-camii_v06_sunum.glb` | Daire kaideli, çevre ve figürlü sunum modeli (265 KB) — **silindi** (21 Ekim 2026; yerine v07) |

**20 Ekim 2026:** uygulama GLB'sinden çevre (`Cevre_*`) ve insan figürleri (`Olcek_Insan_*`) çıkarıldı; bunlar yalnız `_sunum.glb`'de. Sürüm numarası değişmedi. Kural ve betik: `eserler/_GENEL_SAHNE_STANDARDI.md` §5.5, `eserler/_kutuphane/glb_temizle.mjs`. Yeni sürümde son adım olarak tekrar çalıştır.
| `kontrol/v06/` | Render'lar, `kontrol_rapor.json`, `olcu_dogrulama.json`, `renkler.json` — **silindi** (21 Ekim 2026; yerine v07) |

Nesneler: `Cami_Govde`, `Cami_Mihrap`, `Cami_SonCemaat`, `Revak_Cephe`, `Revak_Kemerler`, `Kubbe_Ana`, `Kubbe_Mihrap`, `Kubbe_SonCemaat`, `Kubbe_Tabhane_B/D`, `Minare_1`, `Sadirvan`, `Cevre_Doseme`, `Cevre_Agac_01–04` (yalnız taç), `Cevre_Agac_Govde` (4 ağacın gövde ve dalları), `Olcek_Insan_01–08`; sunum GLB'de ayrıca `Zemin_Kaide`. Eksenler +X doğu, +Y kuzey.

**Parça adı değişikliği (v05 → v06):** uygulamanın hikâye ekranı bu adlara bağlı. Aşağıdaki eski adlar v06'da yok, hepsi tek `Cami_Govde` nesnesine birleşti: `Cami_Harim`, `Cami_Kanat_B`, `Cami_Kanat_D`, `Cami_Koridor`, `Cati_Kanatlar`, `Cepheler`, `Sacak`, `Kaide_Bant` (kaldırıldı), `Kasnak_Detay`, `Revak_Ic`. Yeni adlar: `Cami_Govde`, `Revak_Alinlik` (Cami_Govde içinde), `Kurslar` (Cami_Govde içinde), `Sadirvan`, `Cevre_Doseme`, `Cevre_Agac_01–04`, `Olcek_Insan_01–08`, `Zemin_Kaide` (yalnız sunum GLB). Değişmeyen adlar: `Kubbe_Ana`, `Kubbe_Mihrap`, `Kubbe_SonCemaat`, `Kubbe_Tabhane_B/D`, `Cami_SonCemaat`, `Cami_Mihrap`, `Revak_Cephe`, `Revak_Kemerler`, `Minare_1`. Uygulama eski adlardan birini kullanıyorsa `Cami_Govde`'ye ya da ilgili parçaya bağlanmalı.

**Bilinen sorunlar:** şadırvan saçak ve kubbe biçimi düz yüzlü, fotoğraftaki kıvrım yok; ağaç taçları kaba elipsoid; dal uçları tacın içinde biter (çakışma denetiminde `cakismalar_beklenen_agac` olarak ayrı yazılır); kaş kemerlerde oyma yok (kaynakta ölçü yok); mihrap kubbesi oranı 0,24 (Ayverdi kotları korundu); kubbe kurşunu V 0,58 (standart V ≥ 0,72 kuralından bilinçli sapma); `Cami_Govde` eski ayrı parçaların birleşimi (draw call ≤ 60 için).

## Sürüm geçmişi

| Sürüm | Tarih | Konu | Önemli değerler / karar |
|---|---|---|---|
| v01 | 17 Ekim | Kütle | Ayverdi planı 25,7 × 33,5; yükseklikler Ayverdi yan cephesinden (bindirme 0,1–0,3 m); donduruldu |
| v02 | 17 Ekim | Detay, renk, GLB | Revak kemerleri, sağır kemerler, pencereler, almaşık doku (karo 2,0 × 0,8), kaide bandı |
| v02b | 17 Ekim | Kusur | Saçak z-fighting düzeltmesi |
| v03 | 17 Ekim | Son cemaat yeri | Açık revak; 3 kubbe + 2 aynalı tonoz; 0,9 m sofa; giriş kubbesi kaldırıldı |
| v04 | 17 Ekim | Kubbe, kasnak, pencere | Düzgün sekizgen kasnak; kasnak pencere sayıları; şebekeli üst pencereler; alemler |
| v05 | 17 Ekim | Kubbe eteği | Daire planlı içbükey kurşun etek; kasnak üstü bandı gömme. Kabul edildi; 18–19 Ekim denetiminde etek biçimi kaynaklarla çelişti |
| v06 | 19 Ekim | Cephe giydirmesi, kubbe–kasnak, şadırvan, standart sahne | Katmanlı revak (kesme taş ayaklar, 1 taş + 3 tuğla, kirpi, kurslar); hücre örgü gövde; doğu ve batı yüzde 3 girinti; sekizgen düz etek ve kirpi kasnak; yeni `Sadirvan`; daire kaide, çim alan, 4 çınar, 8 figür; tek `Duz` malzeme; minare uzatıldı, beyaz şerefe. Ağaç gövde ve dallarına tahta/kabuk dokusu (`Agac_Govde_Doku`, karo 0,6 × 1,2 m, nötr doku × `#7A634B`; gövdeler `Cevre_Agac_Govde` nesnesinde, kullanıcı isteği 19 Ekim). 20 130 üçgen, 58 draw call, 262 KB. Sapmalar: tabhane etek dudağı 6,96 m (plan 7,1), kubbe rengi `#858E94`, mihrap oranı 0,24 |
| v07 | 21 Ekim | Ortak palet ve yumuşak pişirme | Yalnız renk ve pişirilmiş ışık (21 Ekim 2026, ortak palet; `_GENEL_SAHNE_STANDARDI.md` §3): kurşun #BCC2C6 (kullanıcı kararı; önce #D6DADD, sonra #C3C9CD denendi; kurşun için V ≥ 0,80 ölçütü dışı), renk malzemede, köşe rengi gri AO (en koyu ≥ 0,80). Geometri aynı; yöntem `_kutuphane/palet_v2/`. Kontrol: `kontrol/v07/`. Blend eski sürümün orijinalinden `build/build_*.py` ile üretildi, GLB'ler bu blend'den dışa aktarıldı (Blender Draco; sıfır alanlı üçgenler Draco'da atılır, kabul). | — |
| v08 | 28 Ekim | Fotoğraf rengi + pişmiş AO + yer gölgesi | Fotoğraftan ölçülen renk (`_kutuphane/malzeme-paleti.json`; ölçüm `_kutuphane/RENK_OLCUM_RAPORU.md`). Köşe rengi AO'su kaldırıldı; AO ikinci UV `UV_AO`'ya pişirildi (glTF occlusionTexture, texCoord 1). Yeni `Yer_Golgesi` düzlemi (unlit, alpha blend). Geometri ve parça adları v07 ile aynı (doğrulandı). Betik `build/build_v08.py` → `_kutuphane/renk_ao_v3/`. Renk (F): Duvar #E5DAB9→#C4B08C; Almasik_Revak #DCD1AD→#BCA983; Kasnak #E9DFC4→#C7B495; Tugla #CF7F55→#8E6A4E; Kirpi #D0794C→#8E6A4E; Minare #CF7E54→#8E6A4E; Alinlik_Baklava #CF7E53→#8E6A4E. AO 1024 px, 0,5 + 0,5 × AO, en koyu 0.5, kullanılan ortanca 0.78. Uygulama GLB 267 → 526 KB. |
| v09 | 28 Ekim | Pastel renk geri, pişmiş AO küçük, yer gölgesi yok | 28 Ekim 2026 (gece). 21 Ekim pastel renkleri geri (kullanıcı: fotoğraf renkleri haritada cansız; ton ayarı web'de): her malzeme v07 sürümündeki aynı adlı malzemenin rengi ve dokusu (fark 0 ton; v07'deki köşe rengi gri AO idi, çarpılmadı). Değişen: Duvar #C4B08C→#E5DAB9; Almasik_Revak #BCA983→#DCD1AD; Alinlik_Baklava #8E6A4E→#CF7E53; Kirpi #8E6A4E→#D0794C; Mermer #E6E2D6→#F5F4F0; Tugla #8E6A4E→#CF7F55; Kasnak #C7B495→#E9DFC4; Minare #8E6A4E→#CF7E54. Pişmiş AO v08'den, yeniden pişirilmedi: 512 px tek kanal JPEG q80 (209 → 45 KB). Yer_Golgesi çıkarıldı (web çiziyor). Uygulama GLB 526 → 260 KB (pastel v07: 268 KB). Geometri v08 ile aynı (Draco sıfır alanlı üçgenleri attı; kutu aynı). Betik `_kutuphane/renk_ao_v3/pastel_kucuk.mjs`. Kontrol `kontrol/v09/`. |
| v09 | 29 Ekim | Blend kaynağı eşitlendi | v09: blend kaynağı GLB ile eşitlendi (29 Ekim 2026). GLB artık Blender'dan üretiliyor: `build/build_v09.py` → `_kutuphane/blend_hat/` (renk ve doku yalnız `malzeme-paleti.json`'dan; Yer_Golgesi yok; AO tek kanal JPEG). Doğrulama a–g geçti (`kontrol/v09/esitleme.png`). Düzeltilen hata (yalnız sunum): çevre malzemelerinde (Agac, Agac_Govde_Doku, Duz) köşe rengi malzemeye de çarpılmıştı (renk iki kez, koyu); artık renk yalnız köşe renginde, v07 sunumla aynı. |
| v10 | 29 Ekim | Parça yapısı sadeleştirildi | v10: kök parça bölünüşü sadeleştirildi (29 Ekim 2026): 12 → 8 parça (Cami_Govde, Cami_Mihrap, Cami_SonCemaat, Kubbe_Ana, Kubbe_Mihrap, Kubbe_Tabhaneler, Minare, Sadirvan). Adımlar: birleşti: Cami_SonCemaat, Revak_Cephe, Revak_Kemerler, Kubbe_SonCemaat → Cami_SonCemaat; birleşti: Kubbe_Tabhane_B, Kubbe_Tabhane_D → Kubbe_Tabhaneler; ad: Minare_1 → Minare. Renk, doku, AO ve toplam üçgen (15974) aynı; referanslar yeni adlara çevrildi (eksik 0). Plan `_kutuphane/blend_hat/parca_plan.json`; ayrıntı `kontrol/v10/parca_envanteri.md`, `tiklama_haritasi.png`. |
| v11 | 29 Ekim | İç mekân (yalnız sunum) | Örtü kökte ayrıldı (`Cami_Ortu`, `Kubbe_Pencereler`); iç parçalar `Orta_Mekan`, `Mihrap_Eyvani`, `Tabhaneler`, `Giris_Koridoru`, `Pandantifler`, `Ic_Kubbeler`, `Ic_Zemin`, `Ic_Mihrap`, `Minber`. Harita 15 974 → 16 074 üçgen; sunum 20 662 → 28 550 üçgen, 542 KB, çizim çağrısı 84. Dış eşitlik ≤ %0,095. c, d geçti. Kontrol `kontrol/v11/`. |

## Gece varyantı (31 Ekim 2026, orhan-bey-camii_v11'den)

`export/night/orhan-bey-camii_v11_night.glb` (uygulama, 0,35 MB) ve `export/night/orhan-bey-camii_v11_night_sunum.glb` (0,70 MB). Üretim `_kutuphane/gece/` içinden: `blender -b --python gece_uret.py -- ayar/orhan-bey-camii.json hepsi` (ayrıntı `_kutuphane/gece/BENIOKU.md`). Sahne `blend/orhan-bey-camii_v11_night.blend`, kontrol `kontrol/night/` (repoda değil).

Işık köşe rengine pişirilmiş, malzemeler `KHR_materials_unlit`; parça adları ve düğüm konumları gündüzle aynı, `model.json` ayarları geçerli. Doku WebP (`EXT_texture_webp`), normal yok. Uygulama modeli üçgen 16 074 → 29 380. Haritaya bağlı değil; telefonda ölçülmedi. Model sürümü değişirse `ayar/orhan-bey-camii.json` içindeki `dosya` güncellenip yeniden üretilir.
