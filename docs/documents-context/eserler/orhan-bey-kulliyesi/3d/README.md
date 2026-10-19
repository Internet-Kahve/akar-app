# Orhan Bey Camii · 3d üretim klasörü

Yalnız **son sürüm** tutulur. Eski sürümlerin kararları aşağıdaki tabloda ve `../orhan-bey-kulliyesi_notlar.md` "Ek: Geçmiş kayıt" bölümündedir. Hamam ve Emir Hanı üretimleri kendi klasörlerindedir.

## Güncel sürüm: v05 (17 Ekim 2026)

| Dosya | İçerik |
|---|---|
| `build/build_v05.py` | Blender üretim betiği; ölçüler en üstte `P` sözlüğünde. Kütüphane: `eserler/_kutuphane/akar3d.py` |
| `build/doku/` | `almasik.png`, `kubbe_dilim.png`, `pencere*.png` ve üreticisi `doku_uret.py` |
| `build/araclar/yan_yana.py` | Ortografik render ↔ Ayverdi çizimi bindirmesi (`ref/plan/yurt2024_pdf217_*`, `pdf218_*`) |
| `blend/orhan-bey-camii_v05.blend` | Sahne |
| `export/orhan-bey-camii_v05.glb` | Uygulama modeli (Draco, 193 KB) |
| `kontrol/v05/` | Render'lar ve `kontrol_rapor.json` (13 294 üçgen, 49 draw call, GECTI) |

Nesneler: `Cami_Harim`, `Cami_Kanat_B/D`, `Cami_Koridor`, `Cami_Mihrap`, `Cami_SonCemaat`, `Cati_Kanatlar`, `Cepheler`, `Kaide_Bant`, `Kasnak_Detay`, `Kubbe_Ana`, `Kubbe_Mihrap`, `Kubbe_SonCemaat`, `Kubbe_Tabhane_B/D`, `Minare_1`, `Revak_Cephe`, `Revak_Ic`, `Revak_Kemerler`, `Sacak`. Eksenler +X doğu, +Y kuzey.

**Bilinen sorunlar (v06'da düzeltilecek, bkz. `../SONNET_REVIZYON_PLANI.md`):** son cemaat yeri cephesi tek tip ızgara dokulu (gerçekte alt kesme taş, üst 1 taş + 3 tuğla almaşık, kirpi saçak); büyük kubbelerin eteği daire planlı çan biçimi (gerçekte düz yüzlü sekizgen kurşun etek), kasnak üstü kirpi saçak yok; harim kasnağında sağır yüz yanlış (kuzey değil güney), tabhane kasnak pencereleri 3 (kaynak 2); şadırvan yok; koyu palet, yeşil disk ve pembe gölge.

## Sürüm geçmişi

| Sürüm | Tarih | Konu | Önemli değerler / karar |
|---|---|---|---|
| v01 | 17 Ekim | Kütle | Ayverdi planı 25,7 × 33,5; yükseklikler Ayverdi yan cephesinden (bindirme 0,1–0,3 m); donduruldu |
| v02 | 17 Ekim | Detay, renk, GLB | Revak kemerleri, sağır kemerler, pencereler, almaşık doku (karo 2,0 × 0,8), kaide bandı |
| v02b | 17 Ekim | Kusur | Saçak z-fighting düzeltmesi |
| v03 | 17 Ekim | Son cemaat yeri | Açık revak; 3 kubbe + 2 aynalı tonoz; 0,9 m sofa; giriş kubbesi kaldırıldı |
| v04 | 17 Ekim | Kubbe, kasnak, pencere | Düzgün sekizgen kasnak; kasnak pencere sayıları; şebekeli üst pencereler; alemler |
| v05 | 17 Ekim | Kubbe eteği | Daire planlı içbükey kurşun etek; kasnak üstü bandı gömme. Kabul edildi; 18–19 Ekim denetiminde etek biçimi kaynaklarla çelişti |
