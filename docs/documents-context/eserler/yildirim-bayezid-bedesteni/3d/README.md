# Yıldırım Bayezid Bedesteni · 3d üretim klasörü

Yalnız **son sürüm** tutulur. Eski sürümlerin değerleri ve kararları aşağıdaki tabloda ve `../bedesten_notlar.md` "Ek: Geçmiş kayıt" bölümündedir.

## Güncel sürüm: v03 (17 Ekim 2026)

| Dosya | İçerik |
|---|---|
| `build/build_v03.py` | Blender üretim betiği; bütün ölçüler en üstte `P` sözlüğünde, kaynak harfiyle. Kütüphane: `eserler/_kutuphane/akar3d.py` |
| `build/doku/` | `almasik.png`, `kubbe_dilim.png`, `pencere.png` ve bunları üreten `doku_uret.py` |
| `blend/bedesten_v03.blend` | Sahne |
| `export/bedesten_v03.glb` | Uygulama modeli (Draco) |
| `kontrol/v03/` | Render'lar, `kontrol_rapor.json` (mesh + arka yüz denetimi), `karsilastirma_v03.png`, `yan_yana_envanter_bindirme.png` |

Nesneler: `Govde`, `Kubbeler`, `Cati`, `Sacak`, `Pencereler`, `Kapilar`, `Dukkanlar`, `Dukkan_Kapilari`, `Girisler`, `Gecitler`, `Ic_Bedesten_Sokagi`. Üçgen: 14 956. Eksenler +X doğu, +Y kuzey; orijin salonun ortası.

**Bilinen sorunlar (v04'te düzeltilecek, bkz. `../SONNET_REVIZYON_PLANI.md`):** gövde ile dükkânlar arasındaki açık "İç Bedesten Sokağı" ve ayrı dış halka kaynaklarla çelişir (dört planın dördü bitişik bant gösterir); 80 dükkân modülü (kaynak 56); beşik çatılı yüksek girişler (kaynak: kubbeli giriş mekânı); kubbe tepesi 13,5 (kaynak 14,20); koyu ve mavi palet; yeşil zemin diski ve pembe gölge.

## Sürüm geçmişi

| Sürüm | Tarih | Konu | Önemli değerler / karar |
|---|---|---|---|
| v01 | 16 Ekim | Kütle | Gabriel planı (P) ile dış 70,4 × 32,8; 2 × 7 kubbe |
| v01b | 16 Ekim | Kubbe yüksekliği | Kubbe dolgunlaştırıldı (tepe 13,5, F); kütle donduruldu |
| v02 | 16 Ekim | Detay, renk, GLB | Pencere, kapı, saçak, dükkân kepenkleri; kubbe dilim dokusu |
| v02b | 17 Ekim | Kaynak denetimi | Gövde 59,5 × 18,0 (E iç ölçü + P duvar), saçak +10,0 (P kesit), alçak bant +5,0 (F) |
| v02c | 17 Ekim | Dış dükkân duvarı | Almaşık doku dükkân duvarlarına |
| v03 | 17 Ekim | Sokak ve halka | Açık İç Bedesten Sokağı, ayrı dış halka (83,3 × 48), yükseltilmiş beşik çatılı girişler. 18 Ekim denetiminde kaynaklarla çeliştiği görüldü |
