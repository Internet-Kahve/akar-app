# Kalan altı eserin harita pişirmesi

Ulucami'nin pişmiş harita dosyası onaylandı. Aynı yöntemi kalan altı esere uygula. Ulucami'nin son çalışan betiklerini kullan: `eserler/ulu-cami/3d/build/pisir_harita.py` ve `_kutuphane/blend_hat/pisik*`. Commit ve push yapma, `apps/web` altına dokunma, Ulucami dosyalarını değiştirme.

**Sıra ve değerler** (yerel azimut = `on_yonu` + 40 − `yaw`; yükseklik 50°; ışık değerleri `apps/web/src/lib/scene-light.ts`):

| # | Klasör | GLB | Gece GLB | Yerel azimut | Ana parça |
|---|---|---|---|---|---|
| 1 | `yildirim-bayezid-bedesteni` | `bedesten_v11` | `night/bedesten_v11_night` | 40° | Govde |
| 2 | `koza-han` | `koza-han_v18` | `night/koza-han_v18_night` | 40° | Govde_Dis |
| 3 | `orhan-bey-kulliyesi` | `orhan-bey-camii_v11` | `night/orhan-bey-camii_v11_night` | 40° | Cami_Govde |
| 4 | `emir-han` | `emir-hani_v08` | `night/emir-hani_v08_night` | 40° | Emir_Hani |
| 5 | `orhan-bey-hamami` | `orhan-bey-hamami_v08` | `night/orhan-bey-hamami_v08_night` | 220° | yok, bütün model |
| 6 | `orhan-gazi-turbesi` | `orhan-gazi-turbesi_v06` | `night/orhan-gazi-turbesi_v06_night` | 220° | Govde |

Değerleri her eserde `model.json` dosyasından yeniden doğrula; tabloyla uyuşmazsa `model.json` geçerlidir ve farkı raporla.

**Yöntem:** Bir eseri bitirip ölçmeden sonrakine geçme. Her eser için `3d/build/pisir_harita.py` kur, gündüz ve gece dosyasını üret, mevcut modelle aynı kameradan karşılaştır.

**Kamera:** 780 × 1688 piksel, dikey açı 36,87°, eğim 60°, 440 m. Uygulama bu uzaklıktan yakında sunum modeline geçer; en yakın görünüm pişmiş dosyanın işi değildir. 220 m değerlerini yalnız raporla.

**Kabul (her eser, gündüz ve gece):**

| Ölçüt | Sınır |
|---|---|
| Parlaklık oranı medyanı | 0,97–1,03 |
| p10 / p90 | ≥ 0,85 / ≤ 1,15 |
| Mevcutta olmayan renk (kırmızı saçak, beyaz leke) | ≤ %0,5 |
| Malzeme | 2 (`Harita_Pisik`, `Harita_Golge`), ikisi de `KHR_materials_unlit` |
| Düğüm adları ve kutular | mevcut doğrulamadan geçer |
| Üçgen | mevcuttan fazla değil (+2 gölge düzlemi hariç) |
| Boyut | mevcut harita GLB'sinin 1,3 katını aşmaz |

Keskinlik ve SSIM'i raporla, ama sınır koyma: Ulucami'de bunlar en-yakın süzmeli dokular yüzünden tutmadı ve görüntü yine de kabul edildi. Ulucami'de öğrenilenleri uygula: atlası mevcut harita dosyasından, texel başına çok pikselle yansıt; atlas 2048 kalsın.

**Durma kuralı:** Bir eser üç denemede sınırı tutturmuyorsa onu bırak, nedenini yaz, sonrakine geç. Sınırı gevşetme. Görülmeyen bir kusur varsayma; karşılaştırma görüntüsünü kendin aç ve bak.

**Teslim, her eser için:**
- `3d/export/<glb>_harita_pisik.glb` ve `3d/export/night/<gece>_harita_pisik.glb`
- `model.json` içine yalnız `glb_harita_pisik`, `glb_gece_harita_pisik`, `_pisik_not`. `pisik_onay` ekleme; onayı Muhammed verir.
- `kontrol/<surum>_pisik/`: mevcut | pişmiş | fark görüntüleri ve `rapor.json`
- README'de kısa pişirme bölümü

Sonda tek tablo ver: eser, gündüz ve gece medyan, p10, p90, renk sapması, KB, geçti/kaldı.
