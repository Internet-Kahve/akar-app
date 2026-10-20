# Emir Hanı · 3d üretim klasörü

Yalnız **son sürüm** tutulur. Eski sürüm kararları aşağıda ve `../emir-han_notlar.md` "Ek: Geçmiş kayıt" bölümündedir.

## Güncel sürüm: v03 (19 Ekim 2026)

| Dosya | İçerik |
|---|---|
| `build/build_emir_v03.py` | Blender üretim betiği (`EMIR_ASAMA=A\|B\|C\|SON`); ölçüler `P` sözlüğünde. Kütüphane: `eserler/_kutuphane/akar3d.py` |
| `build/render_emir_v03.py` | v03 blend'inden render seti (build betiğinin `SON` render bölümüyle aynı açılar, blend'deki `CAM_*` kameraları; modele dokunmaz). `Blender -b blend/emir-hani_v03.blend --python build/render_emir_v03.py [-- tek,sunum,dort_yon,yan,arka]` |
| `build/doku/` | `doku_uret_v03.py` ve karolar (`duvar_emir`, `almasik_emir`, `ayak_emir`, `kirpi_emir`, `baca_emir`, `korkuluk_beyaz_alpha`, `yaprak_notr` …) |
| `build/araclar/yan_yana_v03.py` | Fotoğraf + render yan yana birleştirme (PIL) |
| `blend/emir-hani_v03.blend` | Sahne (render kameraları dahil) |
| `export/emir-hani_v03.glb`, `_sunum.glb` | Uygulama modeli (Draco, 156 KB) ve daire kaide + sokaklı sunum (166 KB) |
| `kontrol/emir_v03/` | 37 görsel (havadan, üst orto, dört yön, 5 sunum, 6 yan yana, yakın çekimler, `kontrol_0…7`), `kontrol_ozeti.md`, `kontrol_rapor.json`, `olcu_dogrulama.json`, `renkler.json` |

Ölçü ve denetim: dış 46 × 50, avlu 25,5, kenar başına 7 göz, 38 oda ve baca; 16 710 üçgen, 40 draw call, açık kenar / çakışma / arka yüz 0 (ayrıntı `kontrol/emir_v03/kontrol_ozeti.md`).

Nesneler: `Emir_Hani`, `Han_Avlu`, `Avlu_Revaklari`, `Dis_Cephe`, `Girisler`, `Bacalar`, `Sadirvan`, `Cevre_Agac_01…04`, `Olcek_Insan_01…08` (sunum GLB'de ek: `Zemin_Kaide`, `Zemin_Sokak`).

v02 dosyaları (`build_emir_v02.py`, `blend/emir-hani_v02.blend`, `export/emir-hani_v02.glb`) klasörde duruyor; `kontrol/emir_v02/` kaldırıldı.

## Sürüm geçmişi

| Sürüm | Tarih | Konu | Önemli değerler / karar |
|---|---|---|---|
| v01 | 17 Ekim | Kütle | 45 × 45 (E), avlu 25,5 (H: √650), kanat 9,75, saçak 9,5 / mahya 11,0 (T); donduruldu |
| v02 | 17 Ekim | Detay, renk, GLB | Kenar başına 9 göz revak, kuzey giriş, almaşık doku, saçak, bacalar, şadırvan, 2 çınar. Kabul edildi; 19 Ekim denetiminde ölçü ve göz sayısı kaynaklarla çelişti (dış ölçü 45 × 45, 9 göz, dış zemin avlu kotunda, güney revakında yarım daire kemer yok, 44 baca). 10 194 üçgen, 18 draw call, GECTI |
| v03 | 19 Ekim | Revizyon (`../SONNET_REVIZYON_PLANI.md`) | 46 × 50 (E Vakıf 1983), 7 göz iki katlı revak, sokak +4,0, güney revakı yarım daire alt kemer, kuzey asıl + güney üst kat girişi, 38 baca, açık sekizgen şadırvan, daire kaide R 37,39. Onaylar A, B, C |
