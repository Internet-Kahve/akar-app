# Güncel sürüm: GPT v15

Son düzeltmeler REVIZYON_v15.md; güncel model blend/ulu-cami_gpt_v15.blend ve export/ulu-cami_gpt_v15.glb. Aşağıdaki v01 kayıtları önceki sürüme aittir.

# Bursa Ulu Cami · GPT v01

15 Ekim 2026. Bursa ortak stilinde dış mekân minyatürü.

## Dosyalar
- `blend/ulu-cami_gpt_v01.blend`: düzenlenebilir Blender sahnesi; dokular paketlendi.
- `export/ulu-cami_gpt_v01.glb`: uygulama için yalnız bina; Draco, 310.752 bayt.
- `export/ulu-cami_gpt_v01_sunum.glb`: kaideli sunum sürümü.
- `kontrol/gpt_v01/gpt_v01_hava_kuzeybati.png`: genel görünüş.
- `kontrol/gpt_v01/`: sekiz yönden ters yüz denetimi, referansla yan yana kuzey görünüşü, kapı/kubbe/doğu yakın görselleri, JSON raporları.
- `build/build_gpt_v01.py`: yeniden üretim betiği; `akar3d.py` yerel bağımlılığı birlikte bulunur.

## Kaynak ve değişiklikler
Sıfırdan ölçüm iddiası yoktur: projedeki `claude/build/build_v02c.py` parametrik üretim geometrisi temel alındı. 68,7 × 55 m plan, 5 × 4 kubbe dizisi, merkez aksları ve minare yerleri korundu. Kaynaklar: ulu-cami_notlar.md, eser.md, _ortak_stil.md ve Miniatürk maket fotoğrafı.
GPT sürümünde eser.md stil paleti uygulandı: krem taş, lavanta kubbe, altın alem. Makette görülen üç kademeli portal silmeleri eklendi. Ortak stil tarifindeki çim/taş/pembe elips kaidesi ayrı sunum geometrisi olarak üretildi. Önceki çalışmalar değiştirilmedi.

## Doğrulama
Bina: 29.300 üçgen, 18 mesh, 47 malzeme primitive/draw-call tahmini. Açık/non-manifold kenar 0. Sekiz yönde kırmızı ters yüz piksel oranı 0. Kütüphanenin ≥0,3 m çakışma taramasında bulgu yok. Bu tarama matematiksel olarak her küçük kesişmenin yokluğunu garanti etmez. Kaide bu bina bütçesine dahil değildir. Mobil cihaz performansı ölçülmedi.

## Varsayımlar ve sınırlar
VARSAYIM: Belgelerdeki daha önce kabul edilmiş yükseklik ve kütle oranları korundu; yeni saha ölçümü yapılmadı.
VARSAYIM: Kaide görsel sunum öğesidir; tarihî avlu planını temsil etmez.
Mevcut geometriden devralınan 30 üst + 30 alt cephe penceresi, envanterin 32 üst + 26 alt sayısıyla birebir örtüşmez. 140 kasnak penceresi vardır; çatı altında kalan 20 konum atlanır, 42 pencere kısalır. İç mekân modellenmedi. Bu çalışma rölöve/restorasyon modeli değil, belgelerde tarif edilen stilize dış görünüş modelidir.

## Yeniden üretim
Blender ile `blender -b --python build/build_gpt_v01.py`. Referans karşılaştırması için üst klasördeki ref-maket fotoğrafı gerekir. Üretim kendi gpt çıktılarının üzerine yazar.
