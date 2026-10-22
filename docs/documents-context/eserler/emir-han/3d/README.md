# Emir Hanı · 3d üretim klasörü

Yalnız **son sürüm** tutulur. Eski sürüm kararları aşağıda ve `../emir-han_notlar.md` "Ek: Geçmiş kayıt" bölümündedir.

## Güncel sürüm: v03 (19 Ekim 2026)

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
