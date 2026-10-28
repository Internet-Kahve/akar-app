# Orhan Bey Camii · 3d üretim klasörü

Yalnız **son sürüm** tutulur. Eski sürümlerin kararları aşağıdaki tabloda ve `../orhan-bey-kulliyesi_notlar.md` "Ek: Geçmiş kayıt" bölümündedir. Hamam ve Emir Hanı üretimleri kendi klasörlerindedir.

## Güncel sürüm: v07 (21 Ekim 2026)

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
