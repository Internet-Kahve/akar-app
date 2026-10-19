# Orhan Bey Hamamı · 3d üretim klasörü

Yalnız **son sürüm** tutulur. Eski sürüm kararları aşağıda ve `../orhan-bey-hamami_notlar.md` "Ek: Geçmiş kayıt" bölümündedir.

## Güncel sürüm: v02 (17 Ekim 2026)

| Dosya | İçerik |
|---|---|
| `build/build_hamam_v02.py` | Blender üretim betiği; ölçüler `P` sözlüğünde (plan birimi × `olcek` 1,38). Kütüphane: `eserler/_kutuphane/akar3d.py` |
| `build/doku/` | `kubbe_dilim.png` vb. ve `doku_uret.py` (camiden yerel kopya) |
| `build/araclar/yan_yana_hamam.py` | Render ↔ Çetintaş planı / Ayverdi kesiti bindirmesi. Sabitleri yeni `ref/plan` görsellerine göre yeniden kalibre edilmeli (betikteki not) |
| `blend/orhan-bey-hamami_v02.blend` | Sahne |
| `export/orhan-bey-hamami_v02.glb` | Uygulama modeli (Draco, 60 KB) |
| `kontrol/hamam_v02/` | Render'lar ve `kontrol_rapor.json` (3 204 üçgen, 20 draw call, GECTI) |

Nesneler: `Hamam_Sogukluk_Erkek`, `Hamam_Sogukluk_Kadin`, `Hamam_Sicaklik` (alçak kütle), `Kubbe_Sicaklik`, `Kubbe_Iliklik`, `Hamam_Giris`, `Sacak`, `Fil_Gozleri`.

**Bilinen sorunlar (v03'te düzeltilecek, bkz. `../SONNET_REVIZYON_PLANI.md`):** büyük kubbeler kasnaksız doğrudan duvardan çıkıyor (gerçekte sekizgen kasnak + sekizgen kurşun etek); halvet, eyvan ve kadın bölümü küçük kubbeleri ve tonozları yok; giriş cephesi kaynaktaki alınlıklı kemerli girişe benzemiyor; duvar dokusu yok; koyu palet, yeşil disk.

## Sürüm geçmişi

| Sürüm | Tarih | Konu | Önemli değerler / karar |
|---|---|---|---|
| v01 | 17 Ekim | Kütle | Çetintaş planı × 1,38 (E oda ölçüleriyle kalibre), yükseklikler Ayverdi kesiti × 1,16; erkek soğukluğu duvar 8,6 / tepe 16,2 / fener 17,2; kadın 7,5 / 14,1 (T); alçak kütle 5,6; çarşı ekleri hariç. Donduruldu |
| v02 | 17 Ekim | Detay, renk, GLB | Kuzey giriş (yuvarlak kemer, yuvarlak pencere), saçak bantları, fil gözleri. Kabul edildi; 19 Ekim denetiminde kubbe dizilimi ve giriş cephesi kaynaklarla eksik bulundu |
