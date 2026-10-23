# Ayasofya v20 — ayrıntılı referans uyarlaması

19 Ekim 2026. Kullanıcının isteğiyle, v19'un kaba kütleleri yerine sağladığı SketchUp/DAE modelinin ayrıntılı geometrisi esas alındı. Bu sürüm referans ağının doğrudan uyarlamasıdır; sıfırdan özgün modelleme veya ölçülü rölöve değildir.

## Dosyalar

- `ayasofya_v20.blend`: düzenlenebilir model, paketlenmiş dokular, stüdyo ışıkları ve dört kamera.
- `ayasofya_v20.glb`: yalnız mimari model; 11 doku dosyaya gömülüdür, stüdyo zemini ve ışıklar dahil değildir.
- `renders/`: dört genel açı, GLB yeniden açma görüntüsü ve yakın plan.
- `build_v20.py`: yerel `source/model.dae` dosyasından yeniden üretim.
- `validate_v20.py`: GLB'yi yeniden içe aktarıp üçgen sayısı / sonlu koordinat kontrolü ve render.
- `kontrol_raporu.json`, `glb_dogrulama.json`: ölçülebilir üretim ve doğrulama sonuçları.
- `source/`: kullanıcının sağladığı DAE ve dokuların değişmemiş kopyası. Asıl kaynak Desktop/3d-eser/ayasofya/img-ref5/Kopyası+as2.

## Değişiklikler

Kaynağın tüm sahne düğümleri ve tekrar kullanılan geometrileri çözüldü. Pencere çerçeveleri, kemerler, payandalar, apsis, kubbe kasnakları, tonozlar, minare şerefeleri, alemler ve yan yapılar kaynak geometrisiyle aktarıldı. 11 özgün doku ve UV koordinatları korundu. Düz SketchUp renkleri daha sakin sıva, taş ve kurşun tonlarına uyarlandı; kaynak dokular yeniden boyanmadı.

Birbirinin aynısı ön/arka yüzler tekilleştirildi; varsayılan beyaz/arka-yüz malzemesi yerine tanımlı malzeme seçildi. Ters sıralı yüzlerde UV'ler konumlarına göre eşlendi. Çakışık köşeler 0,1 mm toleransla birleştirildi; 30 derece keskin kenar eşiği uygulandı. Geometri sadeleştirme (decimation) yapılmadı.

Son model **67.289 üçgen**, **19 malzeme/primitive**, yaklaşık **3,01 MB GLB**. v19 yaklaşık 25.592 üçgendi. Kaynakta aynı yerde üst üste bulunan 67.401 üçgen kaldırıldı; sıfır alanlı yüzler dışarıda bırakıldı.

v15–v19 hizalaması sürdürüldü: yatay 1,32; düşey 59,8/52,7; Z dönüşü −32,68 derece. Kaynağın göreli parça konumları korundu; v19'un ayrı OSM minare düzeltmeleri bu sürüme taşınmadı. Bu katsayılar mevcut proje hizalamasıdır, bağımsız mimari doğrulama değildir.

## Kullanım ve sınırlar

v19 dosyaları değişmedi. Bu sürüm ayrı bir model teslimidir; uygulamadaki model URL'leri değiştirilmedi. v20 tek mesh ve 19 malzeme dilimi içerir; v19'un `Minare_1`, `Kubbe_Ana` gibi parça adlarına bağlı cue etkileşimleri için ayrıca anlamsal parçalama gerekir. Malzemeler ışık alan PBR malzemelerdir; görüntüleyicide ortam/ışık gerekir. Telefon performans testi yapılmadı.

Kaynak modelin kendi geometrik yaklaşımı ve bazı düşük segmentli kubbe/minare silüetleri korunur. GLB yeniden açma kontrolü, kaynak modelin yapısal veya tarihî doğruluğunu kanıtlamaz. Kaynağın kullanım geçmişi önceki `ayasofya_notlar.md` §22'de kayıtlıdır.

Yeniden üretim:

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b --python build_v20.py
/Applications/Blender.app/Contents/MacOS/Blender -b --python validate_v20.py
```
