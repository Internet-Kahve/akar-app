# Orhan Bey Külliyesi · 3B model teslimi (B6, 17 Ekim 2026)

Üç yapı ayrı `.glb` (Draco, Y-up, metre). Kaynak dal: `3d/orhan-bey-kulliyesi-v01` (betikler, `.blend`, kontrol görselleri, `orhan-bey-kulliyesi_notlar.md`).

| Yapı | Dosya | Üçgen | Draw call | Boyut | Kontrol |
|---|---|---|---|---|---|
| Orhan Bey Camii (A kademe) | `claude/export/orhan-bey-camii_v05.glb` | 13 294 | 49 | 194 KB | GECTI |
| Orhan Bey Hamamı / Aynalı Çarşı (B) | `claude/export/orhan-bey-hamami_v02.glb` | 3 204 | 20 | 60 KB | GECTI |
| Emir Hanı (B) | `claude/export/emir-hani_v02.glb` | 10 194 | 18 | 91 KB | GECTI |

Kontrol: açık/manifold olmayan kenar 0, parçalar arası çakışma 0, 8 yönden arka yüz (kırmızı) oranı 0.

## Yerleşim (OSM yerel koordinat, m; +X doğu, +Y kuzey; orijin boylam 29.0620, enlem 40.1838)
Her `.glb`'nin orijini kendi ayak izinin ortası; dönme yok (kenarlar ana yönlere paralel).

| Yapı | Merkez (x, y) | OSM |
|---|---|---|
| Orhan Bey Camii | (177, 13) | way 255187109 |
| Orhan Bey Hamamı | (81, 72) | way 1156644734 |
| Emir Hanı | (−27, 92) | way 1271724730 |

## Parça adları (uygulamada vurgu/kamera)
- Cami: `Kubbe_Ana`, `Kubbe_Mihrap`, `Kubbe_Tabhane_D`, `Kubbe_Tabhane_B`, `Kubbe_SonCemaat`, `Minare_1`, `Cami_SonCemaat`, `Revak_*`, `Cepheler`, `Cami_*` gövde parçaları
- Hamam: `Hamam_Sogukluk_Erkek`, `Hamam_Sogukluk_Kadin`, `Hamam_Sicaklik`, `Kubbe_Sicaklik`, `Kubbe_Iliklik`, `Hamam_Giris`, `Fil_Gozleri`
- Emir Hanı: `Emir_Hani`, `Avlu_Revaklari`, `Dis_Cephe`, `Bacalar`, `Sadirvan`, `Agaclar`, `Han_Avlu`

Kaynaklar ve VARSAYIM listesi: kaynak dalda `orhan-bey-kulliyesi_notlar.md`.
