# URL–alıntı denetimi · 15 Ekim 2026

32 model `eser.md` dosyasındaki bütün HTTP(S) kaynak URL’leri kontrol edildi. **62 farklı URL’nin tamamı HTTP 200 ile açıldı. 86 mevcut alıntının tamamı kaynakta bulundu. Ayrıca 1 yeni W satırında birebir alıntı eksik.**

| Sonuç | Kayıt |
|---|---:|
| BİREBİR | 81 |
| YALNIZ BOŞLUK FARKI | 3 |
| PDF/UNICODE DÜZEN FARKI | 2 |
| ALINTI YOK | 1 |
| Metinde bulunamayan / kelimesi değişmiş alıntı | 0 |
| Erişilemeyen URL | 0 |

Kapsamda 86 alıntılı ve 1 alıntısız olmak üzere 87 kaynak kaydı vardır. Aynı URL tekrarları bir kez açılmış; her alıntı ayrı karşılaştırılmıştır. Denetim sırasında Koza Han dosyasına eklenen yeni URL de kapsama alınmıştır. Eser dosyaları bu denetimde değiştirilmemiştir. Dosya sürümlerinin SHA-256 özetleri ve kaynak satır numaraları JSON kayıtlarında bulunur.

## Dikkat gereken kayıt

**Koza Han — Ahır / depo bölümü (8)** ([dosya satırı](tasarim/3d-eser/bursa/eserler/koza-han/eser.md:77)): URL var, birebir alıntı yok. Satırdaki “alıntı özetleyici modelden, birebir teyit edilecek” ifadesi alıntı yerine geçmez.

İlgili açıklama [https://alanbaskanligi.bursa.bel.tr/wp-content/uploads/hanlar-bolgesi.pdf](https://alanbaskanligi.bursa.bel.tr/wp-content/uploads/hanlar-bolgesi.pdf) belgesinin gerçek **PDF s.21**, N19 föyünde bulundu. Kullanılabilecek kısa kaynak parçaları:

- «Koza Han’ın doğu duvarından 3.66 m.’lik bir açıklıkla geçilmektedir.»
- «Yaklaşık olarak 22 x 30 metre boyutlarında»

Kaynak avlu ölçüsünü “yaklaşık” olarak verir. Bu parçalar yalnız raporda öneri olarak gösterildi; eser dosyasına uygulanmadı.

## Karşılaştırma yöntemi

BİREBİR: HTML etiketleri çıkarıldıktan sonraki görünür metin, PDF metin katmanı veya JSON yanıtında aynı karakter dizisi bulundu. YALNIZ BOŞLUK FARKI: yalnız boşluk ve satır sonu dizileri tek boşluğa indirildi; kelime, sayı ve noktalama değiştirilmedi. PDF/UNICODE DÜZEN FARKI: PDF ayırma karakteri nedeniyle bölünen kelimeler birleştirildi; bu iki kayıt kaynak sayfanın görüntüsünden ayrıca doğrulandı. Yaklaşık/fuzzy eşleştirme yapılmadı.

Bu sonuç URL–alıntı eşleşmesine ilişkindir. Alıntının değer hücresindeki bütün iddiaları desteklemesi, esere aidiyet, iç/dış ölçü ayrımı ve güncel durum ayrıca olgusal değerlendirme gerektirir.

## Birebir kategorisine girmeyen 5 mevcut alıntı

| Eser / alan | Sonuç | Bulunan yer | Açıklama |
|---|---|---|---|
| fidan-hani / Mescit (W) | YALNIZ BOŞLUK FARKI | [PDF s.6](https://dergipark.org.tr/tr/download/article-file/1171631) | Alıntı bulundu. |
| geyve-hani / Mescit (W) | PDF/UNICODE DÜZEN FARKI | [PDF s.5](https://dergipark.org.tr/tr/download/article-file/1171631) | Sayfa görüntüsünde doğrulandı: ze-min → zemin; PDF s.5. |
| molla-gurani-turbesi / Konum (W) | YALNIZ BOŞLUK FARKI | [PDF s.72](https://www.bursa.bel.tr/dosyalar/yayinlar/1k6wrn1ene00ok0.pdf) | Alıntı bulundu. |
| molla-gurani-turbesi / Bugünkü durum (W) | PDF/UNICODE DÜZEN FARKI | [PDF s.72](https://www.bursa.bel.tr/dosyalar/yayinlar/1k6wrn1ene00ok0.pdf) | Sayfa görüntüsünde doğrulandı: içeri-sinde → içerisinde; PDF s.72. |
| orhan-bey-kulliyesi / Diğer adlar (W) | YALNIZ BOŞLUK FARKI | [HTML metni](https://alanbaskanligi.bursa.bel.tr/orhan-bey-camii/) | Alıntı bulundu. |

## 62 URL’nin erişim kaydı

| No | URL | HTTP | Tür | Kaynak kaydı | SHA-256 |
|---:|---|---|---|---:|---|
| 1 | https://alanbaskanligi.bursa.bel.tr/en/sehzade-mahmud-turbesi/ | 200 | HTML | 2 | `a3671f750288c281f663d52502934551acfb0eecdd1f517204e350eace4101da` |
| 2 | https://alanbaskanligi.bursa.bel.tr/geyve-han-haci-ivaz-pasa-hani-lonca-han-payegah/ | 200 | HTML | 2 | `a48cfd8a4276ccd9c62db1e4474e3a66510821b9644098497bacff9060d70889` |
| 3 | https://alanbaskanligi.bursa.bel.tr/ipek-han/ | 200 | HTML | 1 | `969b3dfdb6b5ecacc77c8bc57dddf77e9cec9dec9f8559d221284e9b5366a093` |
| 4 | https://alanbaskanligi.bursa.bel.tr/karsiduran-karistiranibrahim-pasa-turbesi-a248/ | 200 | HTML | 5 | `88d0beedb3935e7de32ae3eafbd45514405ed5adc7fda5599e637886d43ea354` |
| 5 | https://alanbaskanligi.bursa.bel.tr/koza-han-yeni-han-han-i-cedid-simkes-han-sirmakes-han-acem-han-beylik-han-yeni-kervansaray/ | 200 | HTML | 2 | `45600f6f2121d8673691175cdb532459f1a2b02a60670507e189399f66fe14b9` |
| 6 | https://alanbaskanligi.bursa.bel.tr/orhan-bey-camii/ | 200 | HTML | 2 | `52f87e6bf9fb7c777df0cdb27d6877f31af9b05392659db195cd0f1c800ab1b6` |
| 7 | https://alanbaskanligi.bursa.bel.tr/tahtakale-hani/ | 200 | HTML | 2 | `c628528f19334ffb0107f32bbab20e47ad914ef35c1ccce0f97031d0bfbb46e0` |
| 8 | https://alanbaskanligi.bursa.bel.tr/wp-content/uploads/hanlar-bolgesi.pdf | 200 | PDF | 1 | `12ca7504bdd0d5a92563047fedc2249b2e0d13010802de51bc134e7829f25a2a` |
| 9 | https://api.openstreetmap.org/api/0.6/node/2796344235.json | 200 | JSON | 2 | `c68dcc74b76e08aa4fb3b45c0f314e39bcb7347264dec8addb51e0734ff9b8d8` |
| 10 | https://api.openstreetmap.org/api/0.6/relation/1018973.json | 200 | JSON | 1 | `af1a85b35cce6fa9c1fd59eb480d9ab35304d63088072e6f0a3688a1b56f76fe` |
| 11 | https://api.openstreetmap.org/api/0.6/relation/13407128.json | 200 | JSON | 1 | `5dd01370d2bc5f3f87c73a929c15abc658216dfb6e5c2c4cbe41988885d33c46` |
| 12 | https://api.openstreetmap.org/api/0.6/relation/2368801.json | 200 | JSON | 1 | `11efe9a8c9511bbaa7c563a8926a896214ab982520ad2133d5538bc172f7d601` |
| 13 | https://api.openstreetmap.org/api/0.6/relation/3417195.json | 200 | JSON | 1 | `9d9f480529b3dd2071dcea95e56aaf347180aec87a14c7e2f30ce5e1524b945a` |
| 14 | https://api.openstreetmap.org/api/0.6/way/1105618701.json | 200 | JSON | 1 | `e8743ae726111cac62193f04eda5b7fbcd59ab91529859084f489b6e7239ea01` |
| 15 | https://api.openstreetmap.org/api/0.6/way/1127755219.json | 200 | JSON | 1 | `b898f36b0f670f3244ead73ff754fa0c68100009828d43d436ecbaeee30d58e8` |
| 16 | https://api.openstreetmap.org/api/0.6/way/1265044103.json | 200 | JSON | 1 | `f606dad87ee07d176d38f5d8567130cfe97db679869b690b646bf2b07c1c28e5` |
| 17 | https://api.openstreetmap.org/api/0.6/way/1271724738.json | 200 | JSON | 1 | `71dd50638c09592f620688c63236129b1c64491f4036cf47188ed4e3b9dc6982` |
| 18 | https://api.openstreetmap.org/api/0.6/way/254312132.json | 200 | JSON | 1 | `1a582ef0ee91920e2c327b462326908203edce018ebecd8d7f2dea7324cea681` |
| 19 | https://api.openstreetmap.org/api/0.6/way/255187109.json | 200 | JSON | 1 | `fa24b6936773427858fa7afd3af82cc8f2d1aad00cc330ca8d5568f7c413fc4e` |
| 20 | https://api.openstreetmap.org/api/0.6/way/26434413.json | 200 | JSON | 1 | `c4f58c7a8567ddc8090eb85c3b906cc964d8ae51044bffccf8d61142f14cbb1c` |
| 21 | https://api.openstreetmap.org/api/0.6/way/26456112.json | 200 | JSON | 1 | `7db5d46b3a260711240d898386fa7b9323f4dd6ecebd3da70a62d4e24e6c0b8f` |
| 22 | https://api.openstreetmap.org/api/0.6/way/324668855.json | 200 | JSON | 1 | `645250978ebe7caada5731fbde865ba86ae5710557f9e27b6347a4c0eaf304f7` |
| 23 | https://api.openstreetmap.org/api/0.6/way/325992024.json | 200 | JSON | 1 | `e2fe00f9d7b747b43a34a15ee737f8a6e8ee5acbd0c340a7dd6ab1a474581d9e` |
| 24 | https://api.openstreetmap.org/api/0.6/way/407483571.json | 200 | JSON | 1 | `e55c3162b01274692431c503727a423587dcb64e818bec3b0c4ddd2ae66210c0` |
| 25 | https://api.openstreetmap.org/api/0.6/way/508091243.json | 200 | JSON | 2 | `da1cdaace603b9df336ee25378379195d4b477ebffd078bedcca98b7926e2ccf` |
| 26 | https://api.openstreetmap.org/api/0.6/way/749713611.json | 200 | JSON | 1 | `2630ee50e30f29ca23eda1ac4f26aa808f414ca08f95730cc7c1c5faf9560692` |
| 27 | https://dergipark.org.tr/tr/download/article-file/1171631 | 200 | PDF | 3 | `690d2cf4b353505436967a5d8302b1f5c724091c46ec46daa7123324d0cba2d8` |
| 28 | https://islamansiklopedisi.org.tr/ipek-hani | 200 | HTML | 2 | `e5d6d8e4d4ed0ed9ba247dd456f6d1f68b14ac83c6803a7681cca1845c1a8776` |
| 29 | https://islamansiklopedisi.org.tr/issiz-han | 200 | HTML | 2 | `e328bc85e0a48edb44da40335e2a0f07e451949782b70f55a47ea2f4e36a0938` |
| 30 | https://iznik.bel.tr/tr/haberler/genel/iznikte-ecdad-yadigri-eserler-ayaga-kalkiyor-615 | 200 | HTML | 2 | `d9a9ba0d31156d4979d2389f996e3983049a7afbaf077f6036135493a5582794` |
| 31 | https://korumakurullari.ktb.gov.tr/Eklenti/113323%2C23032023-tarih-ve-12225-sayili-kurul-kararipdf.pdf?0= | 200 | PDF | 2 | `e39e8ade608b202ebdda7f0496a46db0566eebde11a7e357eb2591fd4f3b0253` |
| 32 | https://kulturportali.gov.tr/turkiye/bursa/kulturenvanteri/balibey-hani | 200 | HTML | 1 | `04ca3c41a02b9350bbacd0aadb208181fed8374e70caab66db44651322194af0` |
| 33 | https://nominatim.openstreetmap.org/search?q=%C4%B0pek%20Han%20Bursa&format=jsonv2&addressdetails=1 | 200 | JSON | 1 | `757006986e32727301248262505b117c09330d77f363f12a2e3b9445cb6c6303` |
| 34 | https://nominatim.openstreetmap.org/search?q=Balibey%20Yeni%C5%9Fehir&format=jsonv2&addressdetails=1 | 200 | JSON | 1 | `5df915155413d8cd938c127026e0b6fd6257b95980a1ee1a48928fa85aa90eab` |
| 35 | https://nominatim.openstreetmap.org/search?q=Emir%20Sultan%20Camii%20Bursa&format=jsonv2&addressdetails=1 | 200 | JSON | 1 | `3bb7bdc6abc0512c821c8b87819966ebf8391762e1b3b70745ba118a0818df86` |
| 36 | https://nominatim.openstreetmap.org/search?q=Fidan%20Han%20Bursa&format=jsonv2&addressdetails=1 | 200 | JSON | 1 | `1b3093d1c3f20ce019ba30108b3ed0b5e6602ba99a9f7db83e18ecc7507e45b0` |
| 37 | https://nominatim.openstreetmap.org/search?q=Geyve%20Han%20Bursa&format=jsonv2&addressdetails=1 | 200 | JSON | 1 | `ed356d7898a7ffbdc3746d7db58f64d78554fb5f63a7f08f6ac1ba3f675ea68e` |
| 38 | https://nominatim.openstreetmap.org/search?q=Hamzabey%20Camii%20Bursa&format=jsonv2&addressdetails=1 | 200 | JSON | 1 | `348de369a1cba58bea8d45382385537d26b09830468edfd6c81311a2fa02bfbe` |
| 39 | https://nominatim.openstreetmap.org/search?q=Iss%C4%B1z%20Han%20Karacabey&format=jsonv2&addressdetails=1 | 200 | JSON | 1 | `a6da99cf822c5c3fee8d0b0e7e4eeba6fec921488d94117b999d6406c56637e7` |
| 40 | https://nominatim.openstreetmap.org/search?q=Kayhan%20Cami&format=jsonv2&addressdetails=1 | 200 | JSON | 1 | `4d109e4369f647181a20044ce4ea8ccc1c97a37864cc193f8717d3e2c12c7be8` |
| 41 | https://nominatim.openstreetmap.org/search?q=Koza%20Han%20Bursa&format=jsonv2&addressdetails=1 | 200 | JSON | 1 | `6f7797094041f28231fe6abb21872ab6435751c392d229c0402e3f3127a28d50` |
| 42 | https://nominatim.openstreetmap.org/search?q=Nasuh%20Pa%C5%9Fa%20Hamam%C4%B1%20Bursa&format=jsonv2&addressdetails=1 | 200 | JSON | 1 | `2da10fc2945c3ec5e1ddf807eccb851af847f77365953c7e018fc6ff016d06c4` |
| 43 | https://nominatim.openstreetmap.org/search?q=Ok%C3%A7u%20Baba%20T%C3%BCrbesi%20Bursa&format=jsonv2&addressdetails=1 | 200 | JSON | 1 | `6373960ac2864f303f6f9a148107fd26fda1fbead630365ed9de66011d65d2db` |
| 44 | https://nominatim.openstreetmap.org/search?q=Orhan%20Camii%20Bursa&format=jsonv2&addressdetails=1 | 200 | JSON | 1 | `3ce93e0ceebbe8fe84cf8cdd62cf4fa3d0dd3883b390bf7a8ace98b3a312bbd3` |
| 45 | https://nominatim.openstreetmap.org/search?q=Orhan%20Gazi%20T%C3%BCrbesi%20Bursa&format=jsonv2&addressdetails=1 | 200 | JSON | 1 | `0de0a833cfcac5830abedaceb0696ec5ca81de9699a6cd5bf69da9b7079657ec` |
| 46 | https://nominatim.openstreetmap.org/search?q=Pirin%C3%A7%20Han%20Bursa&format=jsonv2&addressdetails=1 | 200 | JSON | 1 | `73b3896619dbfce26100420cbf20ecb37302e99271b890f6773bf96d5991f919` |
| 47 | https://nominatim.openstreetmap.org/search?q=Setba%C5%9F%C4%B1%20Camii%20Bursa&format=jsonv2&addressdetails=1 | 200 | JSON | 1 | `1c6a1693b06cfabf731f502397386a98564b218ad4e8229832aaa432fd4a38a3` |
| 48 | https://nominatim.openstreetmap.org/search?q=Sinan%20Pa%C5%9Fa%20Camii%20Yeni%C5%9Fehir&format=jsonv2&addressdetails=1 | 200 | JSON | 1 | `c922d97abd9fded0740f57e28f01a16e7ff70fbcedb28525cc476ae1205364ee` |
| 49 | https://nominatim.openstreetmap.org/search?q=Ulu%20Cami%20Bursa&format=jsonv2&addressdetails=1 | 200 | JSON | 1 | `a9db71dfb1679251882921c710b9c973d025f2c4798f11adb4caf5d256994f49` |
| 50 | https://vakiflardergisi.org/index.php/pub/article/download/174/149/285 | 200 | PDF | 1 | `b1dd6d3c06d25a024a64ff18ffeb7b218f0e07400ab2cdc4faab0122e2ca743d` |
| 51 | https://www.bursa.bel.tr/dosyalar/yayinlar/1k6wrn1ene00ok0.pdf | 200 | PDF | 3 | `09f805fbbf89f8948c5275fb210499d44d113f236a7132be77176d20019e2ceb` |
| 52 | https://www.bursa.bel.tr/dosyalar/yayinlar/fwez22cygw84k0o.pdf | 200 | PDF | 1 | `a36db3da1c9fe217a4d8f96a95338f9fa1e0d74a8d9649c49edd1633d6ec5cf3` |
| 53 | https://www.bursa.bel.tr/haber/bursa-bicak-muzesi-balibey-handa-acildi-35609 | 200 | HTML | 1 | `c02ff923e2de395c54423f5c5f4487cb170e66a4dee4b753b798b9090b2ddf29` |
| 54 | https://www.bursa.bel.tr/haber/ek-foto-sadece-gunu-degil-gelecegi-planliyoruz--36533 | 200 | HTML | 1 | `d9c66b95fa9d461538b364af8cc0c4a797b3c542d82192d976f1121d0d840775` |
| 55 | https://www.bursa.bel.tr/haber/fidan-han-sahaflar-carsisi-olarak-yeniden-canlanacak-1723 | 200 | HTML | 1 | `9385808af0e402e0e202016c50fe7320cbcc19c897cad7528439c76a28090262` |
| 56 | https://www.bursa.bel.tr/haber/projeler-orhangazi-meydani-icin-yarisacak-8456 | 200 | HTML | 1 | `2e4991cc2f4ddaaeb3a968686c2eda2329f1c137f19cd9836e673d2d8bd6e206` |
| 57 | https://www.karacabey.gov.tr/issiz-han-2 | 200 | HTML | 2 | `611f032d4f97d12c0820729847c11cea21eb92da0a983bddd1c72b8bc83ede3a` |
| 58 | https://www.kulturportali.gov.tr/turkiye/bursa/kulturenvanteri/bali-bey-cami | 200 | HTML | 2 | `2d2bb592b167775dbc51e93f34c786e0df692da528689149ea49865203348c56` |
| 59 | https://www.kulturportali.gov.tr/turkiye/bursa/kulturenvanteri/orhan-gazi-hamami | 200 | HTML | 2 | `b40867e4c72c9091ef638f17180635ff627196fbaf1ce07ae5d1119b710f3f8d` |
| 60 | https://www.osmangazi.bel.tr/tarihi/default/fidan-han | 200 | HTML | 2 | `757c750ef7006874bfa830fc63028f03cd7d6c5ce70e96023bb7f04129b56968` |
| 61 | https://www.osmangazi.bel.tr/tarihi/default/tahtakale-carsisi | 200 | HTML | 1 | `0d1b2a628008ff9b4a100ef2841865a4a5409942ef8475226760c0011b51fe12` |
| 62 | https://yildirim.bel.tr/sayfa/incirli-kultur-merkezi.html | 200 | HTML | 3 | `0b20fc76a13214c45e94704b451626e3f0b8226c436ffd7464169aaf90ba3c34` |

## 87 kaynak kaydının tek tek sonucu

| No | Eser / alan | Dosya satırı | URL | Dosyadaki alıntı | Sonuç | PDF sayfası |
|---:|---|---|---|---|---|---|
| 1 | bali-bey-camii-yenisehir / Diğer adlar (W) | [s.13](tasarim/3d-eser/bursa/eserler/bali-bey-camii-yenisehir/eser.md:13) | https://api.openstreetmap.org/api/0.6/way/508091243.json | «"name":"Balıbey Çarşı Camii"» | BİREBİR | — |
| 2 | bali-bey-camii-yenisehir / Konum (W) | [s.17](tasarim/3d-eser/bursa/eserler/bali-bey-camii-yenisehir/eser.md:17) | https://www.kulturportali.gov.tr/turkiye/bursa/kulturenvanteri/bali-bey-cami | «Ulucami Mahallesi Cumhuriyet Caddesi Yenişehir/Bursa» | BİREBİR | — |
| 3 | bali-bey-camii-yenisehir / Bugünkü durum (W) | [s.22](tasarim/3d-eser/bursa/eserler/bali-bey-camii-yenisehir/eser.md:22) | https://www.kulturportali.gov.tr/turkiye/bursa/kulturenvanteri/bali-bey-cami | «Yapının doğu batı ve güney cepheleri bugün dükkanlarla kapatılmıştır.» | BİREBİR | — |
| 4 | bali-bey-camii-yenisehir / OSM way id / enlem, boylam | [s.24](tasarim/3d-eser/bursa/eserler/bali-bey-camii-yenisehir/eser.md:24) | https://api.openstreetmap.org/api/0.6/way/508091243.json | «"type":"way","id":508091243» | BİREBİR | — |
| 5 | bali-bey-camii-yenisehir / OSM way id / enlem, boylam | [s.24](tasarim/3d-eser/bursa/eserler/bali-bey-camii-yenisehir/eser.md:24) | https://nominatim.openstreetmap.org/search?q=Balibey%20Yeni%C5%9Fehir&format=jsonv2&addressdetails=1 | «"lat":"40.2622409","lon":"29.6501881"» | BİREBİR | — |
| 6 | bali-bey-hani / Konum (W) | [s.16](tasarim/3d-eser/bursa/eserler/bali-bey-hani/eser.md:16) | https://kulturportali.gov.tr/turkiye/bursa/kulturenvanteri/balibey-hani | «Osmazgazi İlçesi'nden Çakırhamam'dan Tophane'ye çıkan caddenin başında hisar yamaçlarında» | BİREBİR | — |
| 7 | bali-bey-hani / Bugünkü durum (W) | [s.22](tasarim/3d-eser/bursa/eserler/bali-bey-hani/eser.md:22) | https://www.bursa.bel.tr/haber/bursa-bicak-muzesi-balibey-handa-acildi-35609 | «Balibey Han’ın üçüncü katında açtığımız Bursa Bıçak Müzesi» | BİREBİR | — |
| 8 | bali-bey-hani / Bugünkü durum (W 2) | [s.23](tasarim/3d-eser/bursa/eserler/bali-bey-hani/eser.md:23) | https://www.bursa.bel.tr/haber/ek-foto-sadece-gunu-degil-gelecegi-planliyoruz--36533 | «Bıçak Müzesi’ni Balibey Han’da açtıklarını ancak Vakıflar Bölge Müdürlüğü’nün geri aldığını» | BİREBİR | — |
| 9 | emir-sultan-kulliyesi / OSM way id / enlem, boylam | [s.50](tasarim/3d-eser/bursa/eserler/emir-sultan-kulliyesi/eser.md:50) | https://api.openstreetmap.org/api/0.6/way/254312132.json | «"type":"way","id":254312132» | BİREBİR | — |
| 10 | emir-sultan-kulliyesi / OSM way id / enlem, boylam | [s.50](tasarim/3d-eser/bursa/eserler/emir-sultan-kulliyesi/eser.md:50) | https://nominatim.openstreetmap.org/search?q=Emir%20Sultan%20Camii%20Bursa&format=jsonv2&addressdetails=1 | «"lat":"40.1811084","lon":"29.0810381"» | BİREBİR | — |
| 11 | fidan-hani / OSM way id / enlem, boylam | [s.25](tasarim/3d-eser/bursa/eserler/fidan-hani/eser.md:25) | https://api.openstreetmap.org/api/0.6/relation/2368801.json | «"type":"way","ref":26456078,"role":"outer"» | BİREBİR | — |
| 12 | fidan-hani / OSM way id / enlem, boylam | [s.25](tasarim/3d-eser/bursa/eserler/fidan-hani/eser.md:25) | https://nominatim.openstreetmap.org/search?q=Fidan%20Han%20Bursa&format=jsonv2&addressdetails=1 | «"lat":"40.1851433","lon":"29.0644562"» | BİREBİR | — |
| 13 | fidan-hani / Kat sayısı (W) | [s.37](tasarim/3d-eser/bursa/eserler/fidan-hani/eser.md:37) | https://www.osmangazi.bel.tr/tarihi/default/fidan-han | «Yaklaşık 4350 m2 alanda dikdörtgen yapıda ve iki katlı olarak inşa edilmiştir.» | BİREBİR | — |
| 14 | fidan-hani / Avlu ölçüsü (doğu–batı × kuzey–güney) | [s.47](tasarim/3d-eser/bursa/eserler/fidan-hani/eser.md:47) | https://www.bursa.bel.tr/haber/fidan-han-sahaflar-carsisi-olarak-yeniden-canlanacak-1723 | «İç avlu 46.00x42.00 m. ölçüsünde» | BİREBİR | — |
| 15 | fidan-hani / Mescit (W) | [s.50](tasarim/3d-eser/bursa/eserler/fidan-hani/eser.md:50) | https://dergipark.org.tr/tr/download/article-file/1171631 | «Avlunun ortasındaki şadırvan üzerinde bulunan mescid, 12 mermer sütun üzerindedir.» | YALNIZ BOŞLUK FARKI | 6 |
| 16 | fidan-hani / Mescit pencere sayısı (W) | [s.51](tasarim/3d-eser/bursa/eserler/fidan-hani/eser.md:51) | https://dergipark.org.tr/tr/download/article-file/1171631 | «Mescidin altı penceresi bulunur.» | BİREBİR | 7 |
| 17 | fidan-hani / Oda sayısı (W) | [s.65](tasarim/3d-eser/bursa/eserler/fidan-hani/eser.md:65) | https://www.osmangazi.bel.tr/tarihi/default/fidan-han | «Alt katta 48 üst katta 50 olmak üzere toplam 98 adalıdır.» | BİREBİR | — |
| 18 | geyve-hani / OSM way id / enlem, boylam | [s.24](tasarim/3d-eser/bursa/eserler/geyve-hani/eser.md:24) | https://api.openstreetmap.org/api/0.6/relation/3417195.json | «"type":"way","ref":255186475,"role":"outer"» | BİREBİR | — |
| 19 | geyve-hani / OSM way id / enlem, boylam | [s.24](tasarim/3d-eser/bursa/eserler/geyve-hani/eser.md:24) | https://nominatim.openstreetmap.org/search?q=Geyve%20Han%20Bursa&format=jsonv2&addressdetails=1 | «"lat":"40.1851634","lon":"29.0628453"» | BİREBİR | — |
| 20 | geyve-hani / Kat sayısı (W) | [s.36](tasarim/3d-eser/bursa/eserler/geyve-hani/eser.md:36) | https://alanbaskanligi.bursa.bel.tr/geyve-han-haci-ivaz-pasa-hani-lonca-han-payegah/ | «iki katlı ve kirpi saçaklı bir yapıdır.» | BİREBİR | — |
| 21 | geyve-hani / Mescit (W) | [s.50](tasarim/3d-eser/bursa/eserler/geyve-hani/eser.md:50) | https://dergipark.org.tr/tr/download/article-file/1171631 | «Halen kullanılmakta olan mescid, hanın doğu tarafındaki zemin katında ve batı giriş kapısının tam karşısındadır.» | PDF/UNICODE DÜZEN FARKI | 5 |
| 22 | geyve-hani / Oda / dükkân sayısı (W) | [s.61](tasarim/3d-eser/bursa/eserler/geyve-hani/eser.md:61) | https://alanbaskanligi.bursa.bel.tr/geyve-han-haci-ivaz-pasa-hani-lonca-han-payegah/ | «alt katında yirmi altı, üst katında ise otuz dükkan yer almaktadır.» | BİREBİR | — |
| 23 | hamza-bey-kulliyesi / OSM way id / enlem, boylam | [s.29](tasarim/3d-eser/bursa/eserler/hamza-bey-kulliyesi/eser.md:29) | https://api.openstreetmap.org/api/0.6/way/749713611.json | «"type":"way","id":749713611» | BİREBİR | — |
| 24 | hamza-bey-kulliyesi / OSM way id / enlem, boylam | [s.29](tasarim/3d-eser/bursa/eserler/hamza-bey-kulliyesi/eser.md:29) | https://nominatim.openstreetmap.org/search?q=Hamzabey%20Camii%20Bursa&format=jsonv2&addressdetails=1 | «"lat":"40.1921722","lon":"29.0417113"» | BİREBİR | — |
| 25 | hamza-bey-turbesi / Konum (W) | [s.16](tasarim/3d-eser/bursa/eserler/hamza-bey-turbesi/eser.md:16) | https://korumakurullari.ktb.gov.tr/Eklenti/113323%2C23032023-tarih-ve-12225-sayili-kurul-kararipdf.pdf?0= | «Bursa ili, Mustafakemalpaşa ilçesi, Hamzabey Mahallesinde» | BİREBİR | 1 |
| 26 | hamza-bey-turbesi / Koruma / son doğrulanmış durum (W) | [s.20](tasarim/3d-eser/bursa/eserler/hamza-bey-turbesi/eser.md:20) | https://korumakurullari.ktb.gov.tr/Eklenti/113323%2C23032023-tarih-ve-12225-sayili-kurul-kararipdf.pdf?0= | «Hamzabey Camii ve türbesi korunma alanının kendi parseli olarak belirlenmesine» | BİREBİR | 1 |
| 27 | incirli-hamami / Diğer adlar (W) | [s.13](tasarim/3d-eser/bursa/eserler/incirli-hamami/eser.md:13) | https://yildirim.bel.tr/sayfa/incirli-kultur-merkezi.html | «İNCİRLİ KÜLTÜR MERKEZİ» | BİREBİR | — |
| 28 | incirli-hamami / Konum (W) | [s.17](tasarim/3d-eser/bursa/eserler/incirli-hamami/eser.md:17) | https://yildirim.bel.tr/sayfa/incirli-kultur-merkezi.html | «Meydancık Mah. 1.Karıncadere Sok. No:4 Yıldırım/BURSA» | BİREBİR | — |
| 29 | incirli-hamami / Bugünkü durum (W) | [s.21](tasarim/3d-eser/bursa/eserler/incirli-hamami/eser.md:21) | https://yildirim.bel.tr/sayfa/incirli-kultur-merkezi.html | «Günümüzde Kültür Merkezi olarak hizmet veren tarihi miras , İncirli Kültür Merkezi olarak adlandırılmıştır.» | BİREBİR | — |
| 30 | ipek-hani / OSM way id / enlem, boylam | [s.22](tasarim/3d-eser/bursa/eserler/ipek-hani/eser.md:22) | https://api.openstreetmap.org/api/0.6/relation/13407128.json | «"type":"way","ref":999342853,"role":"outer"» | BİREBİR | — |
| 31 | ipek-hani / OSM way id / enlem, boylam | [s.22](tasarim/3d-eser/bursa/eserler/ipek-hani/eser.md:22) | https://nominatim.openstreetmap.org/search?q=%C4%B0pek%20Han%20Bursa&format=jsonv2&addressdetails=1 | «"lat":"40.1851957","lon":"29.0606803"» | BİREBİR | — |
| 32 | ipek-hani / Kat sayısı (W) | [s.34](tasarim/3d-eser/bursa/eserler/ipek-hani/eser.md:34) | https://islamansiklopedisi.org.tr/ipek-hani | «çift katlı mimarisiyle» | BİREBİR | — |
| 33 | ipek-hani / Oda sayısı (W) | [s.57](tasarim/3d-eser/bursa/eserler/ipek-hani/eser.md:57) | https://islamansiklopedisi.org.tr/ipek-hani | «Alt katta otuz dokuz, üst katta kırk iki oda birer kapıyla önlerindeki revaklara açılmaktadır.» | BİREBİR | — |
| 34 | ipek-hani / Toplam oda sayısı (W) | [s.59](tasarim/3d-eser/bursa/eserler/ipek-hani/eser.md:59) | https://alanbaskanligi.bursa.bel.tr/ipek-han/ | «günümüzde oda sayısı 81’e ulaşmıştır.» | BİREBİR | — |
| 35 | ipek-hani / Üst kat oda sayısı (W) | [s.60](tasarim/3d-eser/bursa/eserler/ipek-hani/eser.md:60) | https://www.bursa.bel.tr/dosyalar/yayinlar/fwez22cygw84k0o.pdf | «zemin katta 39, üst katta 41 olmak üzere 80 oda bulunmaktadır.» | BİREBİR | 115 |
| 36 | issiz-han-karacabey / Konum (W) | [s.17](tasarim/3d-eser/bursa/eserler/issiz-han-karacabey/eser.md:17) | https://www.karacabey.gov.tr/issiz-han-2 | «Karacabey ilçesi, Seyran köyü yakınında bulunan han» | BİREBİR | — |
| 37 | issiz-han-karacabey / Bugünkü durum (W) | [s.21](tasarim/3d-eser/bursa/eserler/issiz-han-karacabey/eser.md:21) | https://www.karacabey.gov.tr/issiz-han-2 | «Halen otel olarak kullanılan Hanı, gezmek isteyen ziyaretçilere ücretsiz olarak imkan sağlanmaktadır.» | BİREBİR | — |
| 38 | issiz-han-karacabey / OSM way id / enlem, boylam | [s.24](tasarim/3d-eser/bursa/eserler/issiz-han-karacabey/eser.md:24) | https://api.openstreetmap.org/api/0.6/way/1105618701.json | «"type":"way","id":1105618701» | BİREBİR | — |
| 39 | issiz-han-karacabey / OSM way id / enlem, boylam | [s.24](tasarim/3d-eser/bursa/eserler/issiz-han-karacabey/eser.md:24) | https://nominatim.openstreetmap.org/search?q=Iss%C4%B1z%20Han%20Karacabey&format=jsonv2&addressdetails=1 | «"lat":"40.2202286","lon":"28.4776314"» | BİREBİR | — |
| 40 | issiz-han-karacabey / Dış ölçü: doğu–batı × kuzey–güney | [s.34](tasarim/3d-eser/bursa/eserler/issiz-han-karacabey/eser.md:34) | https://vakiflardergisi.org/index.php/pub/article/download/174/149/285 | «Issız Han, 21.30x42.30 m.» | BİREBİR | 4 |
| 41 | issiz-han-karacabey / Dış ölçü: doğu–batı × kuzey–güney | [s.34](tasarim/3d-eser/bursa/eserler/issiz-han-karacabey/eser.md:34) | https://islamansiklopedisi.org.tr/issiz-han | «Kuzey-güney doğrultusunda uzunlamasına dikdörtgen planlı, 42,30 × 21,30 m.» | BİREBİR | — |
| 42 | issiz-han-karacabey / Dış ölçü (W; uzun × kısa) | [s.35](tasarim/3d-eser/bursa/eserler/issiz-han-karacabey/eser.md:35) | https://islamansiklopedisi.org.tr/issiz-han | «42,30 × 21,30 m. boyutlarında bir yapı» | BİREBİR | — |
| 43 | karisdiran-suleyman-bey-turbesi / Diğer adlar (W) | [s.13](tasarim/3d-eser/bursa/eserler/karisdiran-suleyman-bey-turbesi/eser.md:13) | https://alanbaskanligi.bursa.bel.tr/karsiduran-karistiranibrahim-pasa-turbesi-a248/ | «KARŞIDURAN (KARIŞTIRAN) SÜLEYMAN TÜRBESİ» | BİREBİR | — |
| 44 | karisdiran-suleyman-bey-turbesi / Konum (W) | [s.17](tasarim/3d-eser/bursa/eserler/karisdiran-suleyman-bey-turbesi/eser.md:17) | https://alanbaskanligi.bursa.bel.tr/karsiduran-karistiranibrahim-pasa-turbesi-a248/ | «Muradiye Külliyesi’nin hemen batısında yer almaktadır.» | BİREBİR | — |
| 45 | karisdiran-suleyman-bey-turbesi / Bugünkü durum (W) | [s.21](tasarim/3d-eser/bursa/eserler/karisdiran-suleyman-bey-turbesi/eser.md:21) | https://alanbaskanligi.bursa.bel.tr/karsiduran-karistiranibrahim-pasa-turbesi-a248/ | «İçinde sanduka bulunmamaktadır.» | BİREBİR | — |
| 46 | karisdiran-suleyman-bey-turbesi / Ölçü teyidi (W) | [s.34](tasarim/3d-eser/bursa/eserler/karisdiran-suleyman-bey-turbesi/eser.md:34) | https://alanbaskanligi.bursa.bel.tr/karsiduran-karistiranibrahim-pasa-turbesi-a248/ | «6.14 x 6.20 boyutlarında» | BİREBİR | — |
| 47 | karisdiran-suleyman-bey-turbesi / Pencere toplamı (W) | [s.58](tasarim/3d-eser/bursa/eserler/karisdiran-suleyman-bey-turbesi/eser.md:58) | https://alanbaskanligi.bursa.bel.tr/karsiduran-karistiranibrahim-pasa-turbesi-a248/ | «Mermer söveli altı penceresi vardır.» | BİREBİR | — |
| 48 | kaygan-camii / OSM way id / enlem, boylam | [s.24](tasarim/3d-eser/bursa/eserler/kaygan-camii/eser.md:24) | https://api.openstreetmap.org/api/0.6/way/407483571.json | «"type":"way","id":407483571» | BİREBİR | — |
| 49 | kaygan-camii / OSM way id / enlem, boylam | [s.24](tasarim/3d-eser/bursa/eserler/kaygan-camii/eser.md:24) | https://nominatim.openstreetmap.org/search?q=Kayhan%20Cami&format=jsonv2&addressdetails=1 | «"lat":"40.1836932","lon":"29.0704520"» | BİREBİR | — |
| 50 | koza-han / OSM way id / enlem, boylam | [s.33](tasarim/3d-eser/bursa/eserler/koza-han/eser.md:33) | https://api.openstreetmap.org/api/0.6/relation/1018973.json | «"type":"way","ref":26470648,"role":"outer"» | BİREBİR | — |
| 51 | koza-han / OSM way id / enlem, boylam | [s.33](tasarim/3d-eser/bursa/eserler/koza-han/eser.md:33) | https://nominatim.openstreetmap.org/search?q=Koza%20Han%20Bursa&format=jsonv2&addressdetails=1 | «"lat":"40.1844464","lon":"29.0632519"» | BİREBİR | — |
| 52 | koza-han / Avlu ölçüsü (doğu–batı × kuzey–güney) | [s.53](tasarim/3d-eser/bursa/eserler/koza-han/eser.md:53) | https://alanbaskanligi.bursa.bel.tr/koza-han-yeni-han-han-i-cedid-simkes-han-sirmakes-han-acem-han-beylik-han-yeni-kervansaray/ | «Yaklaşık olarak 46 x38 metre iç ölçülerinde» | BİREBİR | — |
| 53 | koza-han / Üst kat dış pencere (adet, ölçü) | [s.94](tasarim/3d-eser/bursa/eserler/koza-han/eser.md:94) | https://alanbaskanligi.bursa.bel.tr/koza-han-yeni-han-han-i-cedid-simkes-han-sirmakes-han-acem-han-beylik-han-yeni-kervansaray/ | «Üst katta her odanın dışa açılan ikişer penceresi bulunmaktadır.» | BİREBİR | — |
| 54 | molla-gurani-turbesi / Diğer adlar (W) | [s.13](tasarim/3d-eser/bursa/eserler/molla-gurani-turbesi/eser.md:13) | https://www.bursa.bel.tr/dosyalar/yayinlar/1k6wrn1ene00ok0.pdf | «MOLLA GÜRANLI TÜRBESİ» | BİREBİR | 72 |
| 55 | molla-gurani-turbesi / Konum (W) | [s.18](tasarim/3d-eser/bursa/eserler/molla-gurani-turbesi/eser.md:18) | https://www.bursa.bel.tr/dosyalar/yayinlar/1k6wrn1ene00ok0.pdf | «Hisar Semti’nde, Fetih Kapı’nın karşısında yer alan» | YALNIZ BOŞLUK FARKI | 72 |
| 56 | molla-gurani-turbesi / Bugünkü durum (W) | [s.24](tasarim/3d-eser/bursa/eserler/molla-gurani-turbesi/eser.md:24) | https://www.bursa.bel.tr/dosyalar/yayinlar/1k6wrn1ene00ok0.pdf | «Türbe içerisinde Hüseyin Bey ve birkaç şahsa ait yazıtsız kabir bulunur.» | PDF/UNICODE DÜZEN FARKI | 72 |
| 57 | nasuh-pasa-hamami / OSM way id / enlem, boylam | [s.24](tasarim/3d-eser/bursa/eserler/nasuh-pasa-hamami/eser.md:24) | https://api.openstreetmap.org/api/0.6/way/1265044103.json | «"type":"way","id":1265044103» | BİREBİR | — |
| 58 | nasuh-pasa-hamami / OSM way id / enlem, boylam | [s.24](tasarim/3d-eser/bursa/eserler/nasuh-pasa-hamami/eser.md:24) | https://nominatim.openstreetmap.org/search?q=Nasuh%20Pa%C5%9Fa%20Hamam%C4%B1%20Bursa&format=jsonv2&addressdetails=1 | «"lat":"40.1813863","lon":"29.0681911"» | BİREBİR | — |
| 59 | okcu-baba-turbesi / OSM way id / enlem, boylam | [s.21](tasarim/3d-eser/bursa/eserler/okcu-baba-turbesi/eser.md:21) | https://api.openstreetmap.org/api/0.6/way/1271724738.json | «"type":"way","id":1271724738» | BİREBİR | — |
| 60 | okcu-baba-turbesi / OSM way id / enlem, boylam | [s.21](tasarim/3d-eser/bursa/eserler/okcu-baba-turbesi/eser.md:21) | https://nominatim.openstreetmap.org/search?q=Ok%C3%A7u%20Baba%20T%C3%BCrbesi%20Bursa&format=jsonv2&addressdetails=1 | «"lat":"40.1853152","lon":"29.0584438"» | BİREBİR | — |
| 61 | orhan-bey-kulliyesi / Diğer adlar (W) | [s.13](tasarim/3d-eser/bursa/eserler/orhan-bey-kulliyesi/eser.md:13) | https://alanbaskanligi.bursa.bel.tr/orhan-bey-camii/ | «Orhan Gazi Camii» | YALNIZ BOŞLUK FARKI | — |
| 62 | orhan-bey-kulliyesi / Konum (W) | [s.17](tasarim/3d-eser/bursa/eserler/orhan-bey-kulliyesi/eser.md:17) | https://www.bursa.bel.tr/haber/projeler-orhangazi-meydani-icin-yarisacak-8456 | «Koza Han, Ulu Cami, Gazi Orhan Camii ve Tarihi Belediye Binası önünde yer alan Orhangazi Meydanı» | BİREBİR | — |
| 63 | orhan-bey-kulliyesi / Bugünkü durum (W) | [s.26](tasarim/3d-eser/bursa/eserler/orhan-bey-kulliyesi/eser.md:26) | https://alanbaskanligi.bursa.bel.tr/orhan-bey-camii/ | «Bursa’daki ilk zaviyeli plan şemalı camidir.» | BİREBİR | — |
| 64 | orhan-bey-kulliyesi / OSM way id / enlem, boylam | [s.44](tasarim/3d-eser/bursa/eserler/orhan-bey-kulliyesi/eser.md:44) | https://api.openstreetmap.org/api/0.6/way/255187109.json | «"type":"way","id":255187109» | BİREBİR | — |
| 65 | orhan-bey-kulliyesi / OSM way id / enlem, boylam | [s.44](tasarim/3d-eser/bursa/eserler/orhan-bey-kulliyesi/eser.md:44) | https://nominatim.openstreetmap.org/search?q=Orhan%20Camii%20Bursa&format=jsonv2&addressdetails=1 | «"lat":"40.1839745","lon":"29.0641131"» | BİREBİR | — |
| 66 | orhan-gazi-hamami / Konum (W) | [s.16](tasarim/3d-eser/bursa/eserler/orhan-gazi-hamami/eser.md:16) | https://www.kulturportali.gov.tr/turkiye/bursa/kulturenvanteri/orhan-gazi-hamami | «Yarhisar Köyü Yenişehir/Bursa» | BİREBİR | — |
| 67 | orhan-gazi-hamami / Bugünkü durum (W) | [s.20](tasarim/3d-eser/bursa/eserler/orhan-gazi-hamami/eser.md:20) | https://www.kulturportali.gov.tr/turkiye/bursa/kulturenvanteri/orhan-gazi-hamami | «Yar hisar köyündeki terkedilmiş ve çok harap bir durumda olan hamam» | BİREBİR | — |
| 68 | orhan-gazi-imaret-camii-iznik / Konum (W) | [s.16](tasarim/3d-eser/bursa/eserler/orhan-gazi-imaret-camii-iznik/eser.md:16) | https://iznik.bel.tr/tr/haberler/genel/iznikte-ecdad-yadigri-eserler-ayaga-kalkiyor-615 | «İznik Yenişehir Kapı mevkiinde, belediye binasının karşısında bulunan» | BİREBİR | — |
| 69 | orhan-gazi-imaret-camii-iznik / Bugünkü durum (W) | [s.20](tasarim/3d-eser/bursa/eserler/orhan-gazi-imaret-camii-iznik/eser.md:20) | https://iznik.bel.tr/tr/haberler/genel/iznikte-ecdad-yadigri-eserler-ayaga-kalkiyor-615 | «Bursa Kültür Varlıkları Koruma Bölge Kurulu, İznik Orhan İmareti Projesi’ni onayladı.» | BİREBİR | — |
| 70 | orhan-gazi-turbesi / OSM way id / enlem, boylam | [s.28](tasarim/3d-eser/bursa/eserler/orhan-gazi-turbesi/eser.md:28) | https://api.openstreetmap.org/api/0.6/way/325992024.json | «"type":"way","id":325992024» | BİREBİR | — |
| 71 | orhan-gazi-turbesi / OSM way id / enlem, boylam | [s.28](tasarim/3d-eser/bursa/eserler/orhan-gazi-turbesi/eser.md:28) | https://nominatim.openstreetmap.org/search?q=Orhan%20Gazi%20T%C3%BCrbesi%20Bursa&format=jsonv2&addressdetails=1 | «"lat":"40.1867711","lon":"29.0576941"» | BİREBİR | — |
| 72 | pirinc-hani / OSM way id / enlem, boylam | [s.25](tasarim/3d-eser/bursa/eserler/pirinc-hani/eser.md:25) | https://api.openstreetmap.org/api/0.6/way/26456112.json | «"type":"way","id":26456112» | BİREBİR | — |
| 73 | pirinc-hani / OSM way id / enlem, boylam | [s.25](tasarim/3d-eser/bursa/eserler/pirinc-hani/eser.md:25) | https://nominatim.openstreetmap.org/search?q=Pirin%C3%A7%20Han%20Bursa&format=jsonv2&addressdetails=1 | «"lat":"40.1857239","lon":"29.0602794"» | BİREBİR | — |
| 74 | sehzade-mahmut-turbesi / Diğer adlar (W) | [s.13](tasarim/3d-eser/bursa/eserler/sehzade-mahmut-turbesi/eser.md:13) | https://alanbaskanligi.bursa.bel.tr/en/sehzade-mahmud-turbesi/ | «ŞEHZADE MAHMUD TÜRBESİ» | BİREBİR | — |
| 75 | sehzade-mahmut-turbesi / Konum (W) | [s.17](tasarim/3d-eser/bursa/eserler/sehzade-mahmut-turbesi/eser.md:17) | https://api.openstreetmap.org/api/0.6/node/2796344235.json | «"lat":40.1904446,"lon":29.0454634» | BİREBİR | — |
| 76 | sehzade-mahmut-turbesi / Bugünkü durum (W) | [s.21](tasarim/3d-eser/bursa/eserler/sehzade-mahmut-turbesi/eser.md:21) | https://alanbaskanligi.bursa.bel.tr/en/sehzade-mahmud-turbesi/ | «Sekizgen plana sahip Türbeye Bursa kemerli mermer revaktan geçilerek girilmektedir.» | BİREBİR | — |
| 77 | sehzade-mahmut-turbesi / OSM way id / enlem, boylam | [s.23](tasarim/3d-eser/bursa/eserler/sehzade-mahmut-turbesi/eser.md:23) | https://api.openstreetmap.org/api/0.6/node/2796344235.json | «"lat":40.1904446,"lon":29.0454634» | BİREBİR | — |
| 78 | setbasi-camii / OSM way id / enlem, boylam | [s.22](tasarim/3d-eser/bursa/eserler/setbasi-camii/eser.md:22) | https://api.openstreetmap.org/api/0.6/way/1127755219.json | «"type":"way","id":1127755219» | BİREBİR | — |
| 79 | setbasi-camii / OSM way id / enlem, boylam | [s.22](tasarim/3d-eser/bursa/eserler/setbasi-camii/eser.md:22) | https://nominatim.openstreetmap.org/search?q=Setba%C5%9F%C4%B1%20Camii%20Bursa&format=jsonv2&addressdetails=1 | «"lat":"40.1807872","lon":"29.0703006"» | BİREBİR | — |
| 80 | sinan-pasa-kulliyesi-yenisehir / OSM way id / enlem, boylam | [s.29](tasarim/3d-eser/bursa/eserler/sinan-pasa-kulliyesi-yenisehir/eser.md:29) | https://api.openstreetmap.org/api/0.6/way/324668855.json | «"type":"way","id":324668855» | BİREBİR | — |
| 81 | sinan-pasa-kulliyesi-yenisehir / OSM way id / enlem, boylam | [s.29](tasarim/3d-eser/bursa/eserler/sinan-pasa-kulliyesi-yenisehir/eser.md:29) | https://nominatim.openstreetmap.org/search?q=Sinan%20Pa%C5%9Fa%20Camii%20Yeni%C5%9Fehir&format=jsonv2&addressdetails=1 | «"lat":"40.2601960","lon":"29.6537958"» | BİREBİR | — |
| 82 | tahtakale-hani / Diğer adlar (W) | [s.13](tasarim/3d-eser/bursa/eserler/tahtakale-hani/eser.md:13) | https://alanbaskanligi.bursa.bel.tr/tahtakale-hani/ | «Bayezid Paşa ve Yoğurt Hanı olarak da bilinir.» | BİREBİR | — |
| 83 | tahtakale-hani / Konum (W) | [s.17](tasarim/3d-eser/bursa/eserler/tahtakale-hani/eser.md:17) | https://www.osmangazi.bel.tr/tarihi/default/tahtakale-carsisi | «Tahtakale Mahallesinde bulunan» | BİREBİR | — |
| 84 | tahtakale-hani / Bugünkü durum (W) | [s.21](tasarim/3d-eser/bursa/eserler/tahtakale-hani/eser.md:21) | https://alanbaskanligi.bursa.bel.tr/tahtakale-hani/ | «Bugün Hanın günümüze kadar ulaşabilmiş bölümleri, dükkan olarak işlev görmektedir.» | BİREBİR | — |
| 85 | ulu-cami / OSM way id / enlem, boylam | [s.30](tasarim/3d-eser/bursa/eserler/ulu-cami/eser.md:30) | https://api.openstreetmap.org/api/0.6/way/26434413.json | «"type":"way","id":26434413» | BİREBİR | — |
| 86 | ulu-cami / OSM way id / enlem, boylam | [s.30](tasarim/3d-eser/bursa/eserler/ulu-cami/eser.md:30) | https://nominatim.openstreetmap.org/search?q=Ulu%20Cami%20Bursa&format=jsonv2&addressdetails=1 | «"lat":"40.1838059","lon":"29.0618995"» | BİREBİR | — |
| 87 | koza-han / Ahır / depo bölümü (8) | [s.77](tasarim/3d-eser/bursa/eserler/koza-han/eser.md:77) | https://alanbaskanligi.bursa.bel.tr/wp-content/uploads/hanlar-bolgesi.pdf | **BULUNMUYOR** | ALINTI YOK | 21 |
