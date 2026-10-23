# AKAR · Ortak modelleme kütüphanesi

Bu klasör `akar3d.py`, örnek kullanım ve yöntem belgelerini içerir. Blender Python betikleri `bpy` gerektirir.

1. [Yöntem notlarını](AKAR_3D_Yontem_Notlari.md) okuyun.
2. [Çalışma sırasına](CALISMA_SIRASI.md) ve [ortak stile](../../veri/bursa/sablonlar/_ortak_stil.md) bakın.
3. `eserler/<eser>/eser.md` ve eserin güncel üretim notları üzerinden çalışın.
4. **Teslimden önce:** uygulama GLB'sinden çevre ve figürleri çıkarın: `glb_temizle.mjs` (kural: [`_GENEL_SAHNE_STANDARDI.md`](../_GENEL_SAHNE_STANDARDI.md) §5, madde 5). Build betikleri bunları normal GLB'ye hâlâ yazar; çıkarma ayrı ve unutulmaması gereken bir adımdır. Sunum GLB'ye dokunulmaz.

Eski belgelerdeki v02/v02c ifadeleri tarihsel aşamalardır. Ulucami'nin güncel sürümü (v26) ve sınırlamaları [kendi README'sinde](../ulu-cami/3d/README.md) açıklanır. Buradaki düzenleme sırasında Blender üretimi veya model doğrulaması çalıştırılmadı.

Eserin üretim klasörü `eserler/<eser>/<üretici>/build/` ise ortak kütüphane bu klasörden üç üst dizindeki `_kutuphane/` altında bulunur. Yerel `akar3d.py` kopyası kullanan üretimler kendi sürümünü kullanmaya devam eder.

Kaynak sahneler `blend/`, teslimler `export/`, görsel ve raporlar `kontrol/` altında kalır. Betik çalıştırma komutu için ilgili eserin üretim notlarını kullanın; çıktı dosyalarının üzerine yazılabileceğini dikkate alın.
