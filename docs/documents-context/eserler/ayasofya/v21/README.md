# Ayasofya v21 — 20 Ekim 2026

Fotoğraf karşılaştırması sonrasında v20 kaynak modelinin çatı yüzeyleri ve türbeleri yeniden düzenlendi. Bu model fotoğraflardan yorumlanan bir görselleştirmedir; ölçülü rölöve değildir.

## Dosyalar
- `ayasofya_v21.blend`: düzenlenebilir sahne, malzemeler, dört kamera.
- `ayasofya_v21.glb`: zemin/ışık/kamerasız model; kurşun derzleri dahil.
- `renders/`: dört yönden görünüm, GLB yeniden içe aktarım kontrolü, üst görünüm.
- `build_v21.py`: v20 ve hazırlanmış çatı geometrisinden üretim.
- `trim_roofs.py`: üstte kalan yüzeyi hesaplayarak örtüşen çatı üçgenlerini keser. Python + NumPy + Shapely gerekir. Bu oturumdaki bağımlılık konumu `/tmp/ayasofya_geometry_tools`; yeniden kullanımda kendi ortamınızdaki paket konumuyla değiştirin.
- `finalize_export.py`: GLB float dönüşümünde çöken yüzü kaldırıp Blender sahnesiyle eşitler; üretimden sonra çalıştırılır.
- `validate_v21.py`, `check_roofs.py`, `audit_geometry.py`: doğrulama araçları.

## Yapılan değişiklikler
1. Galeri, yarım kubbe ve apsis çevresindeki 2.145 çatı üçgeninden 1.013'ünün örtüşen alanları kesildi. Son çatı ağı 3.669 üçgen. UV koordinatları aynı yüzey düzlemi üzerinde taşındı.
2. Ana kubbe 128 çevresel segment ile yeniden kuruldu; 40 kurşun derzi eklendi. Derzler GLB'ye gerçek geometri olarak aktarıldı.
3. Üç kopya türbe kaldırıldı. Selim için köşeleri pahlanmış kare, Mehmed için sekizgen, Murad için farklı köşe oranları olan sekizgen plan; ayrı yükseklik, kubbe ve dört sütunlu revaklar oluşturuldu. Yerleşim hava fotoğrafındaki güney sırasına yaklaşık uyarlandı. Pencereler stilize yüzey detaylarıdır.
4. Dört minarenin mevcut farklı gövdeleri korundu; şerefe silmeleri eklendi.
5. Kurşun kaplama açıldı, duvar tonu düzenlendi. Kaynak cephe UV ve dokuları korundu. Yüzey normalleri ve sıfır uzunluklu kenarlar temizlendi.
6. Yenilenen bileşenler ayrı, adlandırılmış nesneler olarak bırakıldı.

## Kontrolün sınırları
`roof_validation.json` yalnız yeniden kesilen çatı yüzeyleri arasındaki 1 mm üzeri kesişmeleri sınar. Sıfır sonucu bütün yapının kusursuz olduğu anlamına gelmez. Genel BVH taraması; derzleri, yapı birleşimlerini ve eklenen silmeleri de sayar. V20 ile ham aday sayısı doğrudan başarı kıyası değildir.

Payandaların ana kütleleri, narteks planı, cephe pencere sayıları ve minarelerin temel oranları kaynak modelden korunmuştur; tüm mimari ayrıntıların fotoğraflarla birebir doğrulandığı iddia edilmez. Kaynak yatay/dikey ölçek farkı korunmuştur. Türbe revakları sadeleştirilmiştir. Model kapalı, su geçirmez baskı ağı değildir. Yeni ayrıntılar dosya/üçgen yükünü artırır; telefonda performans testi yapılmadı.

## Referanslar
Fotoğraflar ve geniş araştırma `../arastirma-2026-10-19/ARASTIRMA_RAPORU.md` içinde. Temel başvurular: Columbia University Medieval Architecture Ayasofya fotoğraf/plan arşivi; Kültür ve Turizm Bakanlığı İstanbul Türbeler Müze Müdürlüğü açıklamaları; AFP hava fotoğrafı; Wikimedia Commons Arild Vågen 2013 fotoğrafı. Kaynak DAE ve dokular `../v20/source/` altında.
