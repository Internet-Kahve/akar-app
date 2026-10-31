# Gece varyantı üretimi

31 Ekim 2026. `gece_uret.py`, eserin `3d/export/` altındaki GLB'lerinden gece sürümü üretir. Girdi dosyalarına dokunmaz; `.blend` gerekmez.

```bash
cd docs/documents-context/eserler/_kutuphane/gece
blender -b --python gece_uret.py -- ayar/<eser>.json hepsi
```

İkinci argüman `app`, `sunum` ya da `hepsi`. `--hizli` az örnekle deneme yapar. Windows'ta Blender yolu: `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`.

## Durum

Bu dosyalar main'in eski sürümlerinden üretildi: Ulucami v27, Bedesten v06, Koza Han v14, Orhan Bey Camii v07, Orhan Gazi Türbesi v02, Orhan Bey Hamamı v05, Emir Hanı v05. Güncel sürümler için `ayar/<eser>.json` içindeki `dosya`, malzeme adları ve kotlar kontrol edilip yeniden üretilmelidir. Haritaya bağlı değildir.

Mobil bütçe (`FRONTEND_BACKEND_NOTLARI.md`: 40 bin üçgen, 60 draw call, 1 MB; Ulucami 87 bin, 91 draw call): Ulucami (126 532, 103, 1,37 MB) ve Koza Han (79 392, 1,15 MB) aşıyor. Telefonda ölçülmedi.

## Çıktılar

| Dosya | Repoda |
|---|---|
| `<eser>/3d/export/night/<dosya>_night.glb`, `_night_sunum.glb` | Evet |
| `<eser>/3d/blend/<dosya>_night*.blend` | Hayır (`.gitignore`, ekip arşivi) |
| `<eser>/3d/kontrol/night/*.png`, `kontrol_rapor.json` | Hayır (`.gitignore`) |

## Yöntem

1. Gündüz GLB'si içe alınır; `bolunecek` nesnelerde uzun kenarlar bölünür.
2. Gece ışıkları kurulur: duvar dibinde yukarı bakan ışık şeritleri, minare ve iç mekân noktaları, zayıf mavi gök. Değerler `ayar/<eser>.json` içinde.
3. Cycles ile ışınım köşe rengine pişirilir, yumuşatılır, gece dolgusu eklenir.
4. GLB yazılır: `KHR_materials_unlit`, normal yok, Draco. Görünüş `baseColor × COLOR_0` olur, uygulamanın ışıklarına bağlı değildir.

## Ayar

- `malzeme`: ad ifadesi → davranış; ilk eşleşme geçer.
  - `parla`: kendi ışığı, doku kalkar. `oran`: yanan pencere oranı, `sonuk`: sönenin parlaklığı.
  - `dokulu`: kendi ışığı, doku kalır (kafes).
  - `carpan`: gündüz rengini koyulaştırır (kurşun 0,55, zemin 0,40).
- `hdr`: kayan noktalı renk alanına pişirir; 1'in üstü kesilmez, güçlü sıcak ışık griye dönmez. Beş eserde açık. Ulucami ve Bedesten kapalı (görünümleri bayt alanla onaylandı); açılırsa yeniden ayar gerekir.
- `doku_renk`, `doku_karisim`: gece dokusunu verilen renge karıştırır, desen kalır.
- `ince_bolunecek`, `ince_kenar`: minare gövdesi gibi ışık geçişi istenen nesneleri sık böler.
- `yakin`: kontrol için ek yakın kameralar (`yon` 0 = güneyden bakış).
- `isik`: `bloklar` ayrı kütlelerin çevre şeritleri, `duvar_guc` metre başına güç, `serit` ek ışık şeritleri (`pay`, `renk` alır), `minare` `[kot, yarıçap, güç]` listesi, `nokta` serbest noktalar, `poz` genel parlaklık.

## Uygulamaya bağlarken

- GLTFLoader bu dosyaları `MeshBasicMaterial` olarak açar; `emissive` alanı yoktur. Vurgu kodu buna göre yazılmalıdır.
- Parça adları ve düğüm konumları gündüzle aynıdır, `model.json` ayarları aynen kullanılır.
