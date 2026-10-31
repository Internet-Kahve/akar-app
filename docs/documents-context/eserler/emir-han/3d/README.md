# Emir Hanı · 3d üretim klasörü

Yalnız **son sürüm** tutulur. Eski sürüm kararları aşağıda ve `../emir-han_notlar.md` "Ek: Geçmiş kayıt" bölümündedir.

## Güncel sürüm: v05 (22 Ekim 2026)

v04 + üst kat revak ayakları düzeltmesi. v03/v04'te köşe kubbelerini oyan EXACT boolean bütün `Avlu_Revaklari` mesh'ine uygulanıyordu ve kubbelerden uzaktaki **7 üst kat ayağını** (24'ün 7'si) ve üst kat döşeme silmesinin bir kısmını siliyordu; avludan bakınca üst katta ayak yerine boşluk görünüyordu. Kesim artık yalnız kubbelerin değdiği üst kuşak halkasına uygulanır. Doku, süsleme, ölçü ve palet v04 ile aynı.

| Dosya | İçerik |
|---|---|
| `build/build_emir_v05.py` | 1. adım: `build_emir_v03.py`'nin kopyası + düzeltme. `EMIR_ASAMA=SON EMIR_KAMERA_YALNIZ=1 Blender -b --python build/build_emir_v05.py` → `kontrol/_tmp/emir-hani_v05_ham.blend` (v03 paleti, dokular, AO, `CAM_*` kameraları; ara ürün) |
| `build/build_emir_v05_palet.py` | 2. adım: ham blend'e ortak palet (`_kutuphane/palet_v2/palet_blend.py`, ayar `palet_v2/ayar/emir-han.json`, v04 ile aynı) + GLB'ler (v04 `blend_export.py` + `finalize.mjs` adımları). `Blender -b kontrol/_tmp/emir-hani_v05_ham.blend --python build/build_emir_v05_palet.py` (`GT_DIR` gerekir) |
| `build/render_emir_v05.py` | 3. adım: render seti (`render_emir_v03.py` kopyası, blend'deki `CAM_*`) + `once_sonra` (v04/v05 aynı kameradan; önce v04 blend'inde `-- once_sonra`, sonra v05 blend'inde) |
| `blend/emir-hani_v05.blend` | Sahne (28 render kamerası dahil) |
| `export/emir-hani_v05.glb` | Uygulama modeli, yalnız yapı (7 nesne, 13 588 üçgen, Draco, 137 KB) |
| `export/emir-hani_v05_sunum.glb` | Daire kaide + sokak + 4 ağaç + 8 figür (Draco, 161 KB); orijin kaide merkezi |
| `kontrol/emir_v05/` | 37 görsel (havadan, üst orto, dört yön, 5 sunum, 6 yan yana, yakın çekimler, `kontrol_0…7`, 4 `once_sonra_*`), `kontrol_rapor.json`, `olcu_dogrulama.json`, `renkler.json` |

Denetim (`kontrol/emir_v05/kontrol_rapor.json`): üst kat ayakları 24/24 tam (v04: 17/24), alt kat 24/24; açık kenar / çakışma / arka yüz 0, GECTI; 40 draw call; köşe rengi en koyu 0,807, gri sapma 0. Uygulama GLB'sinde yalnız `Avlu_Revaklari` değişti (8 596 → 9 728 üçgen); diğer 6 nesne ve sunumdaki 14 nesne köşe, üçgen ve sınır kutusu olarak v04 ile aynı; malzeme renkleri, dokular ve kameralar aynı. Test sayfası (`design/test-redmi9t`) v05'e geçirildi.

v04 dosyaları (`blend/emir-hani_v04.blend`, `export/emir-hani_v04*.glb`, `kontrol/emir_v04/`, `build/build_emir_v04.py`) 22 Ekim 2026'da silindi; son hâlleri git geçmişinde (commit `ef36c58`). `once_sonra_*` görselleri v04 ile karşılaştırmayı korur.

## v03 (19 Ekim 2026)

| Dosya | İçerik |
|---|---|
| `build/build_emir_v03.py` | Blender üretim betiği (`EMIR_ASAMA=A\|B\|C\|SON`); ölçüler `P` sözlüğünde. Kütüphane: `eserler/_kutuphane/akar3d.py` |
| `build/render_emir_v03.py` | v03 blend'inden render seti (build betiğinin `SON` render bölümüyle aynı açılar, blend'deki `CAM_*` kameraları; modele dokunmaz). `Blender -b blend/emir-hani_v03.blend --python build/render_emir_v03.py [-- tek,sunum,dort_yon,yan,arka]` |
| `build/doku/` | `doku_uret_v03.py` ve karolar (`duvar_emir`, `almasik_emir`, `ayak_emir`, `kirpi_emir`, `baca_emir`, `korkuluk_beyaz_alpha`, `yaprak_notr` …) |
| `build/araclar/yan_yana_v03.py` | Fotoğraf + render yan yana birleştirme (PIL) |
| `blend/emir-hani_v03.blend` | Sahne (render kameraları dahil) — **silindi** (21 Ekim 2026; yerine v04) |
| `export/emir-hani_v03.glb`, `_sunum.glb` | Uygulama modeli, yalnız yapı: ağaç ve figür yok (Draco, 103 KB) ve daire kaide + sokak + ağaç + figürlü sunum (166 KB) — **silindi** (21 Ekim 2026; yerine v04) |
| `kontrol/emir_v03/` | 37 görsel (havadan, üst orto, dört yön, 5 sunum, 6 yan yana, yakın çekimler, `kontrol_0…7`), `kontrol_ozeti.md`, `kontrol_rapor.json`, `olcu_dogrulama.json`, `renkler.json` — **silindi** (21 Ekim 2026; yerine v04) |

Ölçü ve denetim: dış 46 × 50, avlu 25,5, kenar başına 7 göz, 38 oda ve baca; 16 710 üçgen, 40 draw call, açık kenar / çakışma / arka yüz 0 (ayrıntı `kontrol/emir_v03/kontrol_ozeti.md`).

Nesneler: `Emir_Hani`, `Han_Avlu`, `Avlu_Revaklari`, `Dis_Cephe`, `Girisler`, `Bacalar`, `Sadirvan`, `Cevre_Agac_01…04`, `Olcek_Insan_01…08` (bu ikisi ve `Zemin_Kaide`, `Zemin_Sokak` yalnız sunum GLB'de; uygulama GLB'sinden 20 Ekim 2026'da çıkarıldı).

**20 Ekim 2026:** uygulama GLB'sinden çevre (`Cevre_*`) ve insan figürleri (`Olcek_Insan_*`) çıkarıldı; bunlar yalnız `_sunum.glb`'de. Sürüm numarası değişmedi. Kural ve betik: `eserler/_GENEL_SAHNE_STANDARDI.md` §5.5, `eserler/_kutuphane/glb_temizle.mjs`. Yeni sürümde son adım olarak tekrar çalıştır.

v02 dosyaları (`build_emir_v02.py`, `blend/emir-hani_v02.blend`, `export/emir-hani_v02.glb`) klasörde duruyor; `kontrol/emir_v02/` kaldırıldı.

## Sürüm geçmişi

| Sürüm | Tarih | Konu | Önemli değerler / karar |
|---|---|---|---|
| v01 | 17 Ekim | Kütle | 45 × 45 (E), avlu 25,5 (H: √650), kanat 9,75, saçak 9,5 / mahya 11,0 (T); donduruldu |
| v02 | 17 Ekim | Detay, renk, GLB | Kenar başına 9 göz revak, kuzey giriş, almaşık doku, saçak, bacalar, şadırvan, 2 çınar. Kabul edildi; 19 Ekim denetiminde ölçü ve göz sayısı kaynaklarla çelişti (dış ölçü 45 × 45, 9 göz, dış zemin avlu kotunda, güney revakında yarım daire kemer yok, 44 baca). 10 194 üçgen, 18 draw call, GECTI |
| v03 | 19 Ekim | Revizyon (`../SONNET_REVIZYON_PLANI.md`) | 46 × 50 (E Vakıf 1983), 7 göz iki katlı revak, sokak +4,0, güney revakı yarım daire alt kemer, kuzey asıl + güney üst kat girişi, 38 baca, açık sekizgen şadırvan, daire kaide R 37,39. Onaylar A, B, C |
| v04 | 21 Ekim | Ortak palet ve yumuşak pişirme | Yalnız renk ve pişirilmiş ışık (21 Ekim 2026, ortak palet; `_GENEL_SAHNE_STANDARDI.md` §3): kurşun #BCC2C6 (kullanıcı kararı; önce #D6DADD, sonra #C3C9CD denendi; kurşun için V ≥ 0,80 ölçütü dışı), renk malzemede, köşe rengi gri AO (en koyu ≥ 0,80). Geometri aynı; yöntem `_kutuphane/palet_v2/`. Kontrol: `kontrol/emir_v04/`. Blend eski sürümün orijinalinden `build/build_*.py` ile üretildi, GLB'ler bu blend'den dışa aktarıldı (Blender Draco; sıfır alanlı üçgenler Draco'da atılır, kabul). Avlu zemini dokusu uygulama modelinde #D2C3A4 ortalamasına açıldı (V ≥ 0,80; standart §1'deki #B3A590'dan sapma, kullanıcı kararı). | — |
| v05 | 22 Ekim | Üst kat revak ayakları | Köşe kubbesi boolean'ı yalnız üst kuşağa; v03/v04'te eksik olan 7 üst kat ayağı ve döşeme silmesi geri geldi (kullanıcı fark etti). Palet, doku ve diğer geometri v04 ile aynı. Kontrol: `kontrol/emir_v05/` (`once_sonra_*`) |
| v06 | 28 Ekim | Fotoğraf rengi + pişmiş AO + yer gölgesi | Fotoğraftan ölçülen renk (`_kutuphane/malzeme-paleti.json`; ölçüm `_kutuphane/RENK_OLCUM_RAPORU.md`). Köşe rengi AO'su kaldırıldı; AO ikinci UV `UV_AO`'ya pişirildi (glTF occlusionTexture, texCoord 1). Yeni `Yer_Golgesi` düzlemi (unlit, alpha blend). Geometri ve parça adları v05 ile aynı (doğrulandı). Betik `build/build_v06.py` → `_kutuphane/renk_ao_v3/`. Renk (F): Duvar_Almasik #E7D7AF→#AC9483; Tugla #CF7F55→#8E6A4E; Baca_Tugla #D37E67→#8E6A4E; Kirpi_Sacak #D98357→#8E6A4E. AO 1024 px, 0,5 + 0,5 × AO, en koyu 0.5, kullanılan ortanca 0.75. Uygulama GLB 136 → 736 KB. |
| v07 | 28 Ekim | Pastel renk geri, pişmiş AO küçük, yer gölgesi yok | 28 Ekim 2026 (gece). 21 Ekim pastel renkleri geri (kullanıcı: fotoğraf renkleri haritada cansız; ton ayarı web'de): her malzeme v05 sürümündeki aynı adlı malzemenin rengi ve dokusu (fark 0 ton; v05'deki köşe rengi gri AO idi, çarpılmadı). Değişen: Duvar_Almasik #AC9483→#E7D7AF; Tugla #8E6A4E→#CF7F55; Kirpi_Sacak #8E6A4E→#D98357; Baca_Tugla #8E6A4E→#D37E67; Sad_Mermer #E6E2D6→#F5F4F0. Pişmiş AO v06'den, yeniden pişirilmedi: 512 px tek kanal JPEG q80 (252 → 49 KB). Yer_Golgesi çıkarıldı (web çiziyor). Uygulama GLB 736 → 168 KB (pastel v05: 137 KB). Geometri v06 ile aynı (Draco sıfır alanlı üçgenleri attı; kutu aynı). Betik `_kutuphane/renk_ao_v3/pastel_kucuk.mjs`. Kontrol `kontrol/v07/`. |
| v07 | 29 Ekim | Blend kaynağı eşitlendi | v07: blend kaynağı GLB ile eşitlendi (29 Ekim 2026). GLB artık Blender'dan üretiliyor: `build/build_v07.py` → `_kutuphane/blend_hat/` (renk ve doku yalnız `malzeme-paleti.json`'dan; Yer_Golgesi yok; AO tek kanal JPEG). Doğrulama a–g geçti (`kontrol/v07/esitleme.png`). Düzeltilen hata (yalnız sunum): çevre malzemesi Agac'ta renk iki kez uygulanmıştı (köşe rengi × malzeme); artık v05 sunumla aynı. |
| v08 | 29 Ekim | Parça yapısı sadeleştirildi | v08: kök parça bölünüşü sadeleştirildi (29 Ekim 2026): 7 → 5 parça (Avlu_Revaklari, Emir_Hani, Girisler, Han_Avlu, Sadirvan). Adımlar: birleşti: Emir_Hani, Bacalar, Dis_Cephe → Emir_Hani. Renk, doku, AO ve toplam üçgen (13586) aynı; referanslar yeni adlara çevrildi (eksik 0). Plan `_kutuphane/blend_hat/parca_plan.json`; ayrıntı `kontrol/v08/parca_envanteri.md`, `tiklama_haritasi.png`. |

## Gece varyantı (31 Ekim 2026, emir-hani_v05'dan)

> **Eski sürümden üretildi:** girdi v05 (main: v08). Yeni sürümlerin gece dosyası yok; `ayar` dosyasındaki `dosya` güncellenip yeniden üretilmelidir. Mobil bütçe henüz ölçülmedi.

`export/night/emir-hani_v05_night.glb` (uygulama, 0,25 MB) ve `export/night/emir-hani_v05_night_sunum.glb` (0,34 MB). Sahne `blend/emir-hani_v05_night.blend`, kontrol `kontrol/night/`. Üretim: `blender -b --python gece_uret.py -- ayar/emir-han.json hepsi` (`_kutuphane/gece/` içinden; ayrıntı `_kutuphane/gece/BENIOKU.md`). Işık köşe rengine pişirilmiş, malzemeler `KHR_materials_unlit`; parça adları ve düğüm konumları gündüzle aynı, `model.json` ayarları geçerli. Üçgen 13 588 → 27 351. Avlu revakları koridor içinden yanar. Haritaya bağlanmadı.
