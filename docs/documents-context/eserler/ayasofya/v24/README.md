# Ayasofya V24 — fotoğraf temelli sınırlı mimari düzeltme

22 Ekim 2026. V23 korunmuştur. Bu sürüm rölöve veya birebir tarihsel rekonstrüksiyon değildir.

## Değişiklikler

- Ana kubbenin yarım elipsoit profili, eteğe eğimli ulaşan küresel başlık profiline dönüştürüldü. Önceki profil etekte dikleşiyordu. Mevcut dış çap (34,28 m), etek kotu (45,90 m) ve tepe kotu (54,06 m, alem hariç) korundu. 40 kurşun derzi yeni kabuğa taşındı. Bu eğri fotoğraf yorumudur, ölçülmüş eğri değildir.
- Batıdaki dört kemerin sinüs eğrisi biçimindeki alt kenarı iki dairesel yayın oluşturduğu sivri kemere dönüştürüldü. Ayaklar, kemer kalınlıkları, dış üst sınır ve çatı bağlantıları korundu. Dayanak Columbia'nın batı payandası fotoğrafıdır; kesin açıklık/yükseklik oranı kalibre edilmedi.
- Üç türbenin düzenli sekizgen olarak oluşturulmuş saçakları kendi gövde planlarına uyarlandı. Özellikle köşeleri pahlanmış kare Selim türbesindeki uyumsuz çıkmalar giderildi; radyal saçak payı 25 cm'dir ve modelleme tercihidir.
- Türbelerde yalnız iki dikey şerit olan söveler tam çerçeveye dönüştürüldü; üst sıraya kemerli başlık, alt sıraya dikdörtgen başlık ve denizlik eklendi. Pencere sayısı ve konumu eski yaklaşık yerleşimdir.

## Kaynaklar ve sınırlar

- [Arild Vågen, 2013 genel fotoğrafı](https://commons.wikimedia.org/wiki/File:Hagia_Sophia_Mars_2013.jpg): ana kubbe silüeti, türbe pencere başlıkları. Yerel referans `../arastirma-2026-10-19/referans/Hagia_Sophia_Mars_2013.jpg`.
- [Columbia, batı payandaları](https://projects.mcah.columbia.edu/medieval-architecture/htm/or/ma_or_image_hs_exter09.htm): sivri kemerli destek biçimi. İncelenen yerel kopya `../arastirma-2026-10-19/referans/large_ma_or_hs_exter_butress.jpg`.
- [Columbia, plan ve kesit](https://projects.mcah.columbia.edu/medieval-architecture/htm/or/ma_or_discuss_hs_plan.htm): yapının ana düzeni.
- [KTB, Ayasofya](https://www.ktb.gov.tr/EN-113776/ayasofya-hagia-sophia.html): 55,60 m yükseklik ve 30,80–31,88 m kubbe çapı bilgisi. Bu iç mekân ölçülerinin dış çatı kabuğuyla doğrudan eşitlenmesi güvenilir olmadığından global ölçek uygulanmadı.

Kademeli üst payandalar fotoğraflarda da mevcut: bunları tamamen düzleştiren V22 yaklaşımı tekrarlanmadı. Galeri kubbe/tonoz biçimleri korundu. Minarelerin profilleri, galeri çatı birleşimleri, genel ölçek, türbe yerleşimleri ve cephe açıklık sayıları bu sürümde tam mimari doğrulamadan geçirilmiş değildir. Bu alanlar için ölçülü plan ve eşlenik cephe karşılaştırması gerekir. V24 bütün bu eksikleri çözmüş sayılmamalıdır.

## Dosyalar ve doğrulama

`ayasofya_v24.blend` düzenlenebilir sahne; `ayasofya_v24.glb` teslim modeli; `renders/` son GLB yeniden içeri alınarak üretilen beş görünüş.

Blender arka plan Python ile sıra: `build_v24.py`, `finalize_export.py`, `review_v24.py`, `audit_delivery.py`. Hata durumunda süreç kodu için `--python-exit-code 1` kullanılır.

`validation.json`: üçgen, geçersiz koordinat, dejenere yüz ve iki ince minarenin düşey kapsama kontrolü. `delivery_audit.json`: dosya başlığı, kaynak gömme, kopya üçgen, dört kemerin kapalı geometri kontrolü ve narteks yanlarında altı örnek ışın testi. Bu kontroller tüm yapının kapalı ağ veya mimari bakımdan birebir doğru olduğunu kanıtlamaz.
