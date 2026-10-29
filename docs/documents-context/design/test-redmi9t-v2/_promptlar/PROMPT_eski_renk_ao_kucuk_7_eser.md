# Prompt: yedi eserde eski (pastel) renklere dönüş, pişmiş AO kalır, dosyalar küçülür (28 Ekim 2026, gece)

Kullanım: aşağıdaki kod bloğunu 3D üretim ajanına (akar-3d-model) olduğu gibi ver. Tek aşamalıdır; sonunda rapor verir.

## Neden

- `PROMPT_foto_renk_ve_ao_pisirme_7_eser.md` uygulandı: renkler fotoğraftan ölçüldü, AO dokuya pişirildi, «Yer_Golgesi» düzlemi eklendi.
- Kullanıcı haritada yeni renkleri gördü ve beğenmedi: duvar, tuğla ve kasnak renkleri canlılığı öldürmüş. Çatı/kurşun zaten değişmemişti. Karar (kullanıcı, 28 Ekim): **eski renkler geri gelsin, pişmiş AO kalsın.** Eski renkler biraz açık bulunursa bu web'de genel parlaklık/doygunluk ayarıyla yapılacak; modele yazılmayacak.
- Dosya boyutu yedi modelde 2,4 MB'tan 5,6 MB'a çıktı. Artışın tamamı iki resimden: 1024 px kayıpsız PNG yer gölgesi (Bedesten'de tek başına 483 KB) ve renkli JPEG AO (Ulucami 2048 px, 487 KB). Yer gölgesi açık harita zemininde neredeyse görünmüyor; web'de tek, kodla üretilen yumuşak bir gölgeyle çizilecek. Bu yüzden modelden çıkarılıyor.

## Prompt

```
AKAR 3D: yedi uygulama modelinin YENİ SÜRÜMÜNÜ üret. Geometri ve parça adları aynı kalır.

ÖNCE OKU
- eserler/_kutuphane/malzeme-paleti.json, eserler/_kutuphane/RENK_OLCUM_RAPORU.md
- design/test-redmi9t-v2/_promptlar/PROMPT_foto_renk_ve_ao_pisirme_7_eser.md (bir önceki iş)
- docs/documents-context/yaptiklarim-2.md §31 (çalışma kuralları), §48–49
Yollar docs/documents-context/ altına göredir.

KAPSAM (son sürüm → yeni sürüm; eski dosyalar SİLİNMEZ)
Ulucami v28→v29 · Bedesten v07→v08 · Koza Han v15→v16 · Orhan Bey Camii v08→v09 · Orhan Bey Hamamı v06→v07 · Emir Hanı v06→v07 · Orhan Gazi Türbesi v03→v04
(Başlamadan export/ klasöründe son sürümü doğrula.)

1) RENK: BİR ÖNCEKİ PASTEL SÜRÜMÜN RENKLERİNE DÖN
- Referans sürümler (21 Ekim pastel paleti; dosyaları export/'ta duruyor): Ulucami v27 · Bedesten v06 · Koza Han v14 · Orhan Bey Camii v07 · Orhan Bey Hamamı v05 · Emir Hanı v05 · Orhan Gazi Türbesi v02.
- Her malzeme için referans sürümdeki AYNI ADLI malzemenin görünen rengini kullan: baseColorFactor ve dokulu malzemelerde aynı doku (doku_palet_v2; v3 dokuları kullanılmaz). Referansta olup yenide olmayan ya da tersi malzeme varsa raporda listele.
- Kurşun/çatı zaten aynı; değiştirme. Emir Hanı çatısı kurşun kalır.
- DİKKAT: referans sürümlerde renk köşe renginde (COLOR_0) olan modeller vardı (21 Ekim notu: Orhan Camii, Hamam, Türbe). Köşe rengi geri gelmez. Bu modellerde «görünen renk» = referanstaki malzeme rengi × köşe renginin o malzemedeki ortalaması; yeni sürümde bu değer malzemeye yazılır.
- malzeme-paleti.json: her rol için bu seçilen hex'i "hex" yap; ölçülen fotoğraf değerini silme, "foto_olcum" alanına taşı; "karar" alanına yaz: «28 Ekim 2026, kullanıcı: fotoğraf renkleri haritada cansız; 21 Ekim pastel renkleri geri; ton ayarı web'de». RENK_OLCUM_RAPORU.md'nin başına aynı kararı ekle.
- Ölçüt: her malzemenin yeni görünen rengi referanstakiyle ±2 ton.

2) PİŞMİŞ AO KALIR, KÜÇÜLÜR
- AO yeniden pişirilmez; mevcut AO dokusu (v28/v07/... sürümlerindeki *_ao.jpg) kullanılır, UV_AO ve occlusionTexture.texCoord = 1 aynen kalır.
- Dokuyu küçült ve yeniden kaydet: TEK KANAL (gri tonlu) JPEG, kalite 80. Boyut: Ulucami ve Koza Han 1024 px, diğerleri 512 px. Küçültmeden önce hafif bulanıklaştırma (yarıçap ≈ 1 px) pişirme gürültüsünü azaltır ve dosyayı küçültür.
- Görsel kontrol: aynı kameradan v28 (2048 AO) ve v29 (1024 AO) render'ı yan yana; fark gözle seçilmemeli.

3) YER GÖLGESİ MODELDEN ÇIKAR
- «Yer_Golgesi» nesnesi, malzemesi ve PNG'si uygulama GLB'sinden ve sunum GLB'sinden kaldırılır. (Web, haritada kodla üretilen tek bir yumuşak gölge çizecek.)
- KHR_materials_unlit başka kullanan yoksa extensionsUsed'dan da düşer.

4) ÇIKTI
- export/<eser>_vXX.glb ve _sunum.glb; Draco; çevre/figür temizliği önceki gibi (glb_temizle.mjs).
- HEDEF BOYUT: uygulama GLB'lerinin toplamı ≤ 2,8 MB (eski pastel sürümler toplamı ≈ 2,4 MB). Her model için önce/sonra boyut ve resim başına KB raporla.
- Geometri ve parça adları: her mesh için köşe/üçgen sayısı ve sınır kutusu v28/v07/... ile eşit (Yer_Golgesi hariç). Hikâye vurgu adları, model.json ana_parca ve örtü grupları birebir.
- kontrol/vXX/: havadan.png (aynı kamera) + eski pastel (referans) ve yeni yan yana; renkler.json; kontrol_rapor.json.
- 3d/README.md sürüm satırı.

5) UYGULAMAYA BAĞLA
- Her eserin 3d/model.json "glb" alanı yeni sürüme.
- python3 docs/documents-context/design/harita/modelleri-gom.py çalıştır.
- yaptiklarim-2.md en altına yeni madde (numara: dosyadaki son madde + 1).

KURALLAR
- apps/ ve frontend/backend koduna dokunma; test-redmi9t/ (v1) değişmez; git komutu çalıştırma; blend/build repoya girmez.
- Kodda esere özel renk sabiti yok; renk malzeme-paleti.json'dan okunur.
- Uydurma yok: her rengin kaynağı (referans sürüm + malzeme adı) renkler.json'da.

RAPOR (sonunda): eser başına tablo — duvar, tuğla, kasnak/sıva hex (referans → yeni), AO px ve KB, toplam GLB KB (önce → sonra); sapmalar.
```

## Bu prompt'tan sonra (web, bu oturum)

- `akar-harita-onizleme-v3.html`: web yer gölgesi (kodla üretilen yumuşak doku, taban izi boyutunda; koyuluğu panelden), «Yer_Golgesi» varsa gizlenir. Renk parlaklığı/doygunluk kullanıcıyla ayarlanıp «Pişmiş» hazır ayarına yazılır.
- test-redmi9t-v2: taban izi hesabından «Yer_Golgesi» hariç; seçilen ışık veri olarak taşınır.
