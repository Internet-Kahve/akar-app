# Prompt: Blender kaynağını şimdiki GLB'lerle eşitle (29 Ekim 2026)

Kullanım: aşağıdaki kod bloğunu 3D üretim ajanına (akar-3d-model) olduğu gibi ver.

## Neden

`PROMPT_eski_renk_ao_kucuk_7_eser.md` işi GLB dosyaları üzerinde yapıldı (Blender'dan değil). Sonuç dosyaları doğru (v29/v08/v16/v09/v07/v07/v04), ama Blender dosyaları ve build betikleri hâlâ fotoğraf renklerinde, «Yer_Golgesi» nesnesi duruyor ve AO dokusu büyük. Biri bir modeli Blender'dan yeniden dışa aktarırsa bu eski hâller fark edilmeden geri gelir. Kaynak (blend + build) ile çıktı (GLB) yeniden aynı olmalı; tek doğruluk kaynağı Blender + malzeme-paleti.json.

## Prompt

```
AKAR 3D: yedi eserin Blender kaynağını şimdiki uygulama GLB'leriyle eşitle. Yeni görsel değişiklik YOK; amaç, Blender'dan dışa aktarılan dosyanın şimdiki GLB ile aynı olması.

ÖNCE OKU
- eserler/_kutuphane/malzeme-paleti.json (geçerli değerler pastel; "foto_olcum" yalnız kayıt)
- eserler/_kutuphane/renk_ao_v3/ (GLB üzerinde yapılan işin betikleri: pastel_kucuk.mjs, pastel_hepsi...)
- docs/documents-context/yaptiklarim-2.md §50–51, §31 (kurallar)

HEDEF (şimdiki doğru çıktılar)
Ulucami v29 · Bedesten v08 · Koza Han v16 · Orhan Bey Camii v09 · Orhan Bey Hamamı v07 · Emir Hanı v07 · Orhan Gazi Türbesi v04

YAPILACAKLAR (her eser için)
1. Blend dosyasının yeni sürümünü aç (eskiler silinmez): ör. ulu-cami_v29.blend.
2. Malzeme renkleri ve dokuları: malzeme-paleti.json'daki geçerli (pastel) değerler; dokulu malzemeler doku_palet_v2. Build betiğinin yeni sürümü (build_vXX.py) rengi yalnız malzeme-paleti.json'dan okur; betikte hex sabiti kalmaz.
3. «Yer_Golgesi» nesnesi blend'den ve build betiğinden kaldırılır (yer gölgesini artık web çiziyor).
4. AO: blend'deki pişmiş AO görüntüsü korunur (yeniden pişirme yok). Dışa aktarma adımı AO'yu GLB'deki gibi kaydeder: tek kanal JPEG, kalite 80, Ulucami ve Koza Han 1024 px, diğerleri 512 px, hafif bulanıklaştırma (≈1 px). Bu adım, renk_ao_v3'teki GLB betiğine değil, build/dışa aktarma betiğine yazılır; böylece Blender'dan çıkan dosya doğrudan doğru olur.
5. Blender'dan dışa aktar (uygulama + sunum), Draco ve glb_temizle.mjs zinciri her zamanki gibi; çıktıyı GEÇİCİ adla kaydet (ör. export/_esitleme/ulu-cami_v29_blend.glb).

DOĞRULAMA (her eser için, sayıyla)
a) Malzeme sayısı ve adları şimdiki GLB ile aynı.
b) Her malzemenin görünen rengi (baseColorFactor × doku ortancası) şimdiki GLB'deki ile ±1 ton.
c) Her mesh: köşe/üçgen sayısı ve sınır kutusu şimdiki GLB ile eşit (Draco atımları dahil, şimdiki sayılarla aynı).
d) occlusionTexture.texCoord = 1 her yapı malzemesinde; AO görüntüsü boyutu ve kanal sayısı aynı; ortanca parlaklık farkı ≤ 2/255.
e) «Yer_Golgesi» yok; COLOR_0 yok.
f) Dosya boyutu şimdikinden en çok %5 farklı.
g) Aynı kameradan şimdiki GLB ve Blender çıktısı render'ı yan yana: fark gözle seçilmemeli.

SONUÇ
- Hepsi geçerse: Blender çıktısı şimdiki GLB'nin YERİNE yazılır (aynı sürüm numarası; model.json değişmez). Geçici dosyalar silinir. Böylece export/'taki dosya artık Blender'dan üretilmiş olur.
- Biri geçmezse: şimdiki GLB'ye DOKUNMA; farkı raporla, nedenini yaz, dur.
- renk_ao_v3/ betiklerinin başına not: «Bir kerelik geçiş işiydi; kaynak artık Blender + malzeme-paleti.json. Yeniden kullanma.»
- Her eserin 3d/README.md'sine: «vXX: blend kaynağı GLB ile eşitlendi (29 Ekim 2026)».
- python3 docs/documents-context/design/harita/modelleri-gom.py yalnız GLB değiştiyse çalıştırılır.
- yaptiklarim-2.md en altına yeni madde (numara: son madde + 1).

KURALLAR
- apps/ ve frontend/backend koduna dokunma; test-redmi9t/ (v1) değişmez; git komutu çalıştırma; blend/build repoya girmez (Drive).
- Geometri ve parça adları değişmez.

RAPOR: eser başına doğrulama tablosu (a–g geçti/geçmedi, boyut önce/sonra), sapmalar.
```
