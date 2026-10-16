# AKAR · 3D üretim

14 Ekim 2026. Önce `AKAR_3D_Yontem_Notlari.md`, ardından eserin notları ve `eser.md` okunur.

## Güncel durum

- **Ulucami:** `bursa/eserler/ulu-cami/claude/export/ulu-cami_v02c.glb`, yaklaşık 302 KB. Mevcut `kontrol/v02c/v02c_rapor.json`: 29.192 üçgen, `GECTI: true`. Düzenleme sırasında Blender kontrolü yeniden çalıştırılmadı.
- **Ayasofya:** v19 ile kapanmış pilot; son Blender dosyası, iki GLB ve atlaslar korundu.
- **Yeni eser belgeleri:** Pirinç Hanı, Nasuh Paşa Hamamı, Okçu Baba Türbesi; her biri kendi klasöründe.
- **Şablonlar:** `bursa/sablonlar/`; önce `_ortak_stil.md` okunur.

## Üretim

Her eser: `<il>/<eser>/`; kimlik/ölçüler `eser.md`, kararlar eser notlarında; betikler `build/`, kaynak modeller `blend/`, teslim `export/`, render/raporlar `kontrol/<sürüm>/`, referanslar `ref-foto/`, `ref-maket/`, `ref-model/`.

Betiklerin konumu göreli yollarını etkiler; `build/` betiklerini taşırken kütüphane ve çıktı yolları kontrol edilmelidir. Eski sürümler yeniden üretim ve karşılaştırma için korundu.

Blender Python betikleri `bpy` gerektirir. Proje kökünden aşağıdaki komut üretimi ve çıktı yazımını başlatır:

```sh
blender -b --python 3d-eser/bursa/eserler/ulu-cami/claude/build/build_v02c.py
```

Tur komutları `CALISMA_SIRASI.md` içinde. Oradaki eski v02 teslim örneği yerine güncel çıktı v02c'dir.
