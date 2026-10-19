# Emir Hanı · 3d üretim klasörü

Yalnız **son sürüm** tutulur. Eski sürüm kararları aşağıda ve `../emir-han_notlar.md` "Ek: Geçmiş kayıt" bölümündedir.

## Güncel sürüm: v02 (17 Ekim 2026)

| Dosya | İçerik |
|---|---|
| `build/build_emir_v02.py` | Blender üretim betiği; ölçüler `P` sözlüğünde. Kütüphane: `eserler/_kutuphane/akar3d.py` |
| `build/doku/` | `almasik.png`, `kubbe_dilim.png`, `pencere*.png`, `doku_uret.py` (camiden yerel kopya) |
| `build/araclar/yan_yana_emir.py` | Bindirme aracı; EHA 1967 görseli ağaçta yok (betikteki not) |
| `blend/emir-hani_v02.blend` | Sahne |
| `export/emir-hani_v02.glb` | Uygulama modeli (Draco, 90 KB) |
| `kontrol/emir_v02/` | Render'lar ve `kontrol_rapor.json` (10 194 üçgen, 18 draw call, GECTI) |

Nesneler: `Emir_Hani`, `Han_Avlu`, `Avlu_Revaklari`, `Dis_Cephe`, `Sacak`, `Bacalar`, `Sadirvan`, `Agaclar`.

**Bilinen sorunlar (v03'te düzeltilecek, bkz. `../SONNET_REVIZYON_PLANI.md`):** dış ölçü 45 × 45 (kaynak 46 × 50); avlu revakında kenar başına 9 göz (kaynak 7); dış zemin avluyla aynı kotta (gerçekte sokak üst kat düzeyinde, dışarıdan tek kat görünür); güney revakının yarım daire alt kemerleri yok; baca sayısı 44 (kaynak 38 ocaklı oda); koyu palet, yeşil disk.

## Sürüm geçmişi

| Sürüm | Tarih | Konu | Önemli değerler / karar |
|---|---|---|---|
| v01 | 17 Ekim | Kütle | 45 × 45 (E), avlu 25,5 (H: √650), kanat 9,75, saçak 9,5 / mahya 11,0 (T); donduruldu |
| v02 | 17 Ekim | Detay, renk, GLB | Kenar başına 9 göz revak, kuzey giriş, almaşık doku, saçak, bacalar, şadırvan, 2 çınar. Kabul edildi; 19 Ekim denetiminde ölçü ve göz sayısı kaynaklarla çelişti |
