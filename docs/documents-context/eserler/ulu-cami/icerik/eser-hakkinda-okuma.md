# Ulucami · Eser hakkında · okuma katmanı

28 Ekim 2026. «Eser hakkında» sayfasının okuma düzeni için seçmeler: bölüm özeti, rakam kartları, büyük alıntı, zaman çizelgesi, terim açıklamaları ve masaüstünde metinle birlikte dönen 3D açısı. Uygulama bu dosyayı `design/test-redmi9t-v2/hazirla.py` ile okur.

**Kural: bu dosyada yeni metin yazılmaz.** Özet cümleleri, alıntılar, «kanıt» parçaları ve terim tanımları `eser-hakkinda.md`'deki envanter metninden **kelimesi kelimesine** seçilir. `hazirla.py` her birinin o bölümün metninde (terimler için bütün metinde) birebir geçtiğini denetler; geçmeyen satır sayfaya girmez ve uyarı yazılır. Kendi sözümüz yalnız rakam kartlarının kısa etiketidir (ör. «kubbe»); kartın altında kitaptaki ifade («kanıt») gösterilir. Rakam kartında «Yirmi» → «20» gibi yalnız yazıyı rakama çevirme yapılır.

Biçim (bölüm başlıkları `eser-hakkinda.md` ile aynı):
- `Özet:` altında `- cümle` satırları (bölümün başında, kitaptan seçme olarak gösterilir; tam metin «Derinine in» ile açılır)
- `Rakam: değer | etiket | kanıt`
- `Alıntı: metin | kim` (kim de aynı paragrafta geçmeli; boş bırakılabilir)
- `Zaman: yıl | kanıt` (bölüm, zaman çizelgesi olarak da gösterilir)
- `Terim: kelime | kitaptaki tanım` (metinde kelimeye dokununca açılır)
- `3D: parça adları (virgülle) | azimut | eğim | uzaklık | içi` (masaüstünde sağdaki model; içi = kubbeler kalkar; parça adları `parcalar.md`'deki model adları, Merkez = bütün yapı)

## Tarihçe

3D: Merkez | 0 | 30 | bütün yapı | hayır
Özet:
- Osmanlı’nın Bursa’da inşa ettirdiği ilk büyük camidir ve altı yüzyıl boyunca şehrin en büyük camisi olarak kalmıştır.
- Üç yıl süren inşaat sürecinin ardından, caminin açılışı 1399 yılında, bir cuma günü gerçekleştirilmiştir.
- Bursa Ulucami, Osmanlı mimarisinde, I. Murad-ı Hudâvendigâr döneminde uygulanmaya başlanan, aynı çaptaki birden fazla kubbeden oluşan “ulucami” formundaki yapıların en büyük ve en tanınan örneğidir.
Rakam: 1399 | açılış yılı | caminin açılışı 1399 yılında, bir cuma günü
Rakam: 3 yıl | süren inşaat | Üç yıl süren inşaat sürecinin
Rakam: 6 yüzyıl | şehrin en büyük camisi | altı yüzyıl boyunca şehrin en büyük camisi olarak kalmıştır
Alıntı: “Bursa’nın Ayasofyası” | Evliya Çelebi

## Mimari

3D: Kubbeler_19 | 0 | 70 | bütün yapı | hayır
Özet:
- Bursa Ulucami, yaklaşık 55 × 69 m boyutlarında, kareye yakın dikdörtgen planlı bir yapıdır.
- Yapıyı örten 11 m çapındaki kubbeler, on iki kare paye üzerine oturmaktadır.
Rakam: 55 × 69 m | plan | yaklaşık 55 × 69 m boyutlarında
Rakam: 20 | kubbe | Yirmi kubbesi
Rakam: 3500 m² | ibadet bölümü | 3500 m²’lik ibadet bölümü
Rakam: 11 m | kubbe çapı | 11 m çapındaki kubbeler
Alıntı: adeta bir hat sanatı müzesi görünümündedir |

## Minber

3D: Minber | 0 | 45 | orta | evet
Özet:
- Caminin kündekâri tekniğiyle yapılan minberi, çivi, tutkal veya herhangi bir bağlayıcı madde kullanılmadan, tamamen birbirine geçme parçalardan müteşekkil bir sanat şaheseridir.
- Minberin en ilginç özelliklerinden biri, 6666 parçadan oluşmasıdır.
Rakam: 6666 | parça | 6666 parçadan oluşmasıdır
Rakam: ~3 yıl | yapım süresi (tahmin) | Yaklaşık üç yılda tamamlandığı tahmin edilen
Rakam: 610 yıl | yangın ve depremler | altı yüz on yıl boyunca pek çok badire atlatmış
Alıntı: “Mümin kişi mescitte iken sudaki balık gibidir.” |
Terim: kündekâri | çivi, tutkal veya herhangi bir bağlayıcı madde kullanılmadan, tamamen birbirine geçme parçalardan

## Mihrap, mahfiller ve hat yazıları

3D: Mihrap, Levhalar | 0 | 45 | orta | evet
Özet:
- Ulucami, duvarlara nakşedilmiş veya levha halinde bulunan yaklaşık yüz yetmiş hat levhasıyla, İslam cami mimarisinde farklı bir konuma sahiptir.
- H. 956 / M. 1549 tarihli bu yazı, camide tarihi bilinen en eski kitabe olma özelliğini taşımaktadır.
Rakam: ~170 | hat levhası | yaklaşık yüz yetmiş hat levhası
Rakam: 1549 | en eski kitabe | H. 956 / M. 1549 tarihli bu yazı
Rakam: 58 | pencere | toplam elli sekiz pencere

## Havuzlu şadırvan

3D: Ic_Sadirvan_Havuz, Sadirvan_Kubbe | 20 | 65 | orta | evet
Özet:
- Ulucami’nin mimari düzeninde öne çıkan unsurlardan biri, merkezde yer alan havuzlu şadırvandır.
- Havuz, on altı kenarlı, Marmara mermeri levhalarla kaplanmıştır.
Rakam: 16 | kenarlı havuz | on altı kenarlı
Rakam: 3 kat | selsebil | üç katlı selsebîlden Pınarbaşı suyu akmakta
Alıntı: Akan suyun sesi, cami içindeki ruhani atmosferi pekiştiren sembolik bir derinlik kazandırmaktadır. |
Terim: zirâ | yaklaşık 55 cm

## Minareler

3D: Minare_1, Minare_2 | 300 | 20 | bütün yapı | hayır
Özet:
- Minare bir müddet yarım halde kullanıldığı için “Güdük Minare” olarak adlandırılmıştır.
- Minarelerin kaideleri ve küpleri mermerden, yuvarlak gövdeleri ise tuğladan inşa edilmiştir.
Rakam: 2 | minare | iki minaresinden
Rakam: 6 sıra | stalaktitli şerefe | altı sıra stalaktit

## Onarımlar

3D: Merkez | 135 | 35 | bütün yapı | hayır
Özet:
- Altı yüz yıllık tarihinde en büyük onarımını 1855 depreminden sonra geçiren Ulucami, uzun yıllar süren ve çok büyük maliyetlere ulaşan çalışmalar sonucunda ihya edilerek 1862 yılında yeniden ibadete açılmıştır.
Zaman: 1494 | Caminin çeşitli bölümleri, H. 13 Cemaziyelevvel 899 / M. 19 Şubat 1494
Zaman: 1670 | minareye yıldırım düşmesi sonucu ahşap külâhı, kurşun kaplaması ve bakır alemi yenilenmiştir
Zaman: 1732 | yirmi kubbede yer alan yüz yirmi dokuz adet kubbe penceresinin cam ve telleri
Zaman: 1855 | en büyük onarımını 1855 depreminden sonra geçiren
Zaman: 1862 | 1862 yılında yeniden ibadete açılmıştır
Zaman: 1958 | 1958’de Bursa Çarşı Yangını sırasında caminin kuzey cephesi zarar görmüş
Zaman: 2009 | En son 2009 yılında gerçekleştirilen restorasyon çalışmasıyla

## Çevresindeki hayratlar

3D: Avlu_Mermer_Cesme, Avlu_Sadirvan_Dogu, Avlu_Sadirvan_Bati | 0 | 35 | orta | hayır
Özet:
- Emir Sultan’da olduğu gibi, Ulucami’nin çevresine de çeşme ve şadırvan gibi birçok hayrat eseri inşa edilmiştir.
- Caminin kuzey avlusunda aynı hat üzerinde yer alan üç şadırvan bulunmaktadır.
Rakam: 3 | avlu şadırvanı | üç şadırvan bulunmaktadır
Rakam: 2.70 × 1.15 m | ortadaki çeşme | 2.70 × 1.15 m ölçülerinde
Alıntı: “Veca’alnâ mine’l-mâi külle şey’in hayy Biz canlı olan her şeyi sudan yarattık.” |

## Vakıf ve akar

3D: Merkez | 10 | 35 | bütün yapı | hayır
