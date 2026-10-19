# Bursa Ulucami: model notları

Bu dosya model için alınan kararları ve kaynak incelemelerini toplar. Yapının kaynaklı kimlik ve ölçü kaydı `eser.md` dosyasındadır. Üretim sürümleri `3d/README.md` dosyasındadır. Son düzenleme: 19 Ekim 2026.

## 0. Klasör düzeni

```
ulu-cami/
  eser.md                     kimlik, ölçü ve kaynak tablosu (giriş noktası)
  ulu-cami_notlar.md          bu dosya
  ref/
    foto/                     ulucamii_NNN_* envanter arşivi; envanter_c1_pdf*, canbakis_pdf*, kitabeler_pdf* PDF görselleri; diğerleri web fotoğrafları
    plan/                     rölöve, plan, kesit, cephe çizimleri (kaynak + PDF sayfası dosya adında)
    metin/                    PDF metin çıkarımları (kaynak ve sayfa başlıklarıyla)
    maket/                    Miniatürk maketi; model3d_* başka 3D model görüntüleri (ölçü için kullanılmaz)
    kaynak_dizini.json        ref/ altındaki her türev dosyanın kaynak PDF'i, sayfası, SHA-256 değeri
  3d/                         üretim: yalnız son sürüm (blend/, export/, kontrol/), referans betikler build/, README.md (sürüm geçmişi)
```
Kaynak PDF'ler ve fotoğraf arşivi `veri/` altında yerinde durur. Eski v01–v02 tur prompt'ları 18 Ekim'de kaldırıldı; detay turu örneği `../_kutuphane/ORNEK_detay_turu_prompt_ulu-cami_v02.md`. Koordinatlar: −Y kuzey, +X batı, z = 0 kuzey giriş zemini.

## 1. Güncel model kararları

| # | Konu | Karar | Dayanak | Durum |
|---|---|---|---|---|
| 1 | Plan dış ölçüsü | 68,7 × 55,0 m (doğu–batı × kuzey–güney) | P: Ayverdi rölöve planı (`ref/plan/ayverdi_plan687_ulu-cami.png`, 24,55 px/m). Envanter, Vakıf 1983, Canbakış ve Alan Başkanlığı: 55 × 69 m. Ürgen'in 60 × 48 değeri kullanılmaz. | v16'dan beri |
| 2 | Kubbe merkezleri | Doğu–batı 0 / ±12,85 / ±25,2; kuzey–güney ±6,4 / ±19,2 m | P: Ayverdi paye aksları | v16'dan beri |
| 3 | Kubbe çapı ve yönü | 20 eş kubbe (kaynak Ø 10,60–11 m iç). Modelde etek R 6,65, kasnak R 6,55. Sekizgen kasnak düz yüzü kuzeye (22,5°). | E (C1 PDF 26), W (Canbakış PDF 58); kasnak ve etek ölçüsü F, kullanıcı kararı | v19–v20 |
| 4 | Kubbe yükseklik profili | Orta sütun en yüksek, uçlar en alçak; 4 sıra aynı | F ve kullanıcı (13 Ekim) | v01'den beri |
| 5 | **Dikey ölçek** | Saçak 13,58 m; köşe kubbe tepesi 19,73 m; bütün gövde kotları v22 × 0,786 | P: VGM rölöveleri (`ref/plan/kul_pdf195…`, `kul_pdf196…`; `ref/metin/kul_minare.md`) | v23 |
| 6 | Minareler | Batı +47,90 m (sekizgen kaide), doğu +47,89 m (kare kaide); bölüm ölçüleri `eser.md` §5 | P: Kul Tablo 5.18–5.19 | v23 (kaideler kullanıcı kararıyla kısaldı: batı 8,70, doğu 4,20 m) |
| 7 | Açık (cam fenerli) kubbe | Orta sütun, kuzeyden 2. sıra; altında 16 kenarlı iç şadırvan havuzu | E (C1 PDF 25: "onikigen"), Vakıf 1983 PDF 102 ("onaltı köşeli"); F (foto 092, 105) 16'yı destekler | v23 (iç şadırvan eklendi) |
| 8 | Avlu su yapıları | İki şadırvan (±15, −39), mermer çeşme (0, −39); çeşme 2,70 m yükseklik × 1,15 m gövde | E (C1 PDF 38–39); yerleşim T; boyutlar F | v17–v20; v23 yeniden kuruldu, ayrıntı §3.7 |
| 9 | Zemin | Ana #C4BDAF, avlu #B3A590 | Kullanıcı onayı (v22); bütün eserler için standart (`../_GENEL_SAHNE_STANDARDI.md`) | v22 |
| 10 | Renk paleti | `../_GENEL_SAHNE_STANDARDI.md` §3 | Fotoğraflar 001, 002, 007, 009, 016 | v23 (19 kubbe ve minare tuğlası v22 rengi, kullanıcı kararı) |

## 2. Kaynaklar

Seçilen kaynaklar ve kullanım biçimi (PDF sayfaları 1 tabanlı; envanter ve 1983 kitabında bir PDF sayfası iki basılı sayfa içerir). Her türev dosyanın kaynağı ve sayfası `ref/kaynak_dizini.json` içinde. Kaynak çeliştiğinde öncelik: P rölöve > E envanter > W makale > O OSM > M maket > F fotoğraf > T tahmin.

| Kaynak | PDF sayfası | Bu klasördeki karşılığı | Kullanım |
|---|---|---|---|
| Bursa Vakıf Eserleri Envanteri C1 (`veri/kaynak_pdf/bursa-envanteri-cilt-1.pdf`) | 19–37 ana kayıt; 38–39 avlu | `ref/metin/envanter_c1_anayapi.md`, `ref/metin/envanter_c1.md`, `ref/foto/envanter_c1_pdf03*` | 55 × 69 m, 11 m kubbe, 12 paye, 58 pencere, iç şadırvan; avludaki iki şadırvan ve mermer çeşme (2,70 × 1,15 m) |
| VGM, Türkiye'de Vakıf Abideler III, 1983 | 102–106 | `ref/metin/vakif_1983.md` | 16 köşeli iç havuz ve 16 musluk (PDF 102), duvar kalınlıkları ve 11 sıra mukarnas (PDF 105), H.1313 çeşme |
| Kul, Bursa minarelerinin onarımları (tez) | 193–198, 221–223 | `ref/metin/kul_minare.md`, `ref/plan/kul_pdf19*` | **VGM minare rölöveleri: iki minare +47,9 m; saçak +13,58; köşe kubbe +19,73** (Tablo 5.18–5.19) |
| Ürgen, Bursa Ulu Camii Mimari Özellikleri (ödev) | 5–23 | `ref/metin/urgen.md`, `ref/plan/urgen_pdf*` | Taç kapı, pencere, mihrap 5,13 × 8,11, mahfiller, minber, minare süslemesi. Plan ölçüsü (60 × 48) kullanılmaz. |
| Canbakış, yüksek lisans tezi 2021 | 54–58, 148, 153, 164 | `ref/metin/canbakis.md`, `ref/plan/canbakis_pdf*`, `ref/foto/canbakis_pdf054_*` | 69 × 55 m, kubbe Ø 10,60, Çetintaş 1949 cephesi, plan, kesit, iç şadırvan feneri |
| Alan Başkanlığı envanter föyü (`veri/bursa/hanlar-bolgesi.pdf`) | 7–8 | `ref/metin/alan_baskanligi.md`, `ref/plan/alan-baskanligi_pdf007_vaziyet.jpg` | 69 × 55 m, onarım yılları, vaziyet |
| Ömer Kaptan, Bursa Kitabeleri | 45, 124–127 | `ref/metin/kitabeler.md`, `ref/foto/kitabeler_pdf125_*` | Minber kitabesi; avlu çeşmeleri kitabeleri (H.1313 / M.1895) |
| Ayverdi rölöve planı (`veri/bursa/ulu-cami_plan_ayverdi.png`) | plan 687 | `ref/plan/ayverdi_plan687_ulu-cami.png` | Plan dış ölçüsü 68,7 × 55,0, paye aksları, minare yerleri |
| Envanter fotoğraf arşivi (`veri/bursa-foto/.../Ulucamii Klasörü`, 111 foto) | — | `ref/foto/ulucamii_NNN_*` (18 seçilmiş) | Dış, kubbe kurşunu, minare, taç kapı, avlu şadırvanı, mermer çeşme, iç şadırvan |

Sınırlar: Fotoğraflar kaynağın kendi çözünürlüğündedir; büyütme yeni detay sağlamaz. Canbakış'taki tarihî fotoğrafın 1865/Sebah Joaillier atfı bağımsız doğrulanmadı. Kaynak görüntülerinin tarihleri 2026 saha doğrulaması anlamına gelmez. Tam PDF sayfa render'ları 18 Ekim'de kaldırıldı; gerekirse aynı PDF ve sayfadan yeniden üretilir.

OSM (13 Ekim, Overpass): way 26434413, `building=mosque`. Ayak izi 70,5 × 60,3 m, uzun eksen kuzeye göre +6,4°, alan 4 245 m². Plan ölçüsü için kullanılmaz; P (Ayverdi) seçildi.
Web fotoğrafları (`ref/foto/` içinde kaynak öneki olmayanlar) ve `ref/maket/` yalnız biçim ve renk kontrolü içindir. `model3d_*` görüntülerinde kubbe yükseklikleri yanlıştır (hepsi eşit).

## 3. Avlu su yapıları: kaynak incelemesi (17 Ekim; v17–v20'de uygulandı)

> 18 Ekim 2026: Aşağıdaki metin üretim öncesi hazırlık kaydıdır. v17 uygulaması tamamlanıyor; gerçekleşen tercihler `3d/README.md` sürüm geçmişinde (v17–v20).

### 3.1 Kapsam ve önerilen parça ayrımı

Ulu Cami'nin kuzey giriş avlusuna iki örtülü şadırvan ve aralarında bir küçük mermer çeşme. Önerilen nesneler: `Avlu_Sadirvan_Dogu`, `Avlu_Sadirvan_Bati`, `Avlu_Mermer_Cesme`. Bu adlar öneridir; henüz oluşturulmadı. Kaideli sunumda camiyle birlikte, ayrı seçilebilir parçalar olarak tutulmaları uygun olur. Yalnız bina GLB'sine eklenip eklenmeyeceği üretim kapsamıyla birlikte kararlaştırılmalı.

### 3.2 Metinle doğrulanan özellikler

| Özellik | Dayanak | Güven / kullanım |
|---|---|---|
| Üç su yapısı kuzey avlusunda aynı hat üzerindedir | Envanter C1 PDF39, basılı76 | Yüksek; metre cinsinden koordinat içermez. |
| Örtülü iki yapı avlunun doğu ve batısındadır | Aynı kaynak | Yüksek; karşılıklı eş aralık veya tam ayna simetrisi anlamına gelmez. |
| Her şadırvanda sekiz ahşap direk, yonca kemerler ve soğan kubbe | Aynı kaynak | Yüksek; modelin temel karakteri. |
| İki şadırvan 2011'de eski fotoğraflara uygun yeniden ele alınmıştır | Aynı kaynak | Yüksek; güncel görünüş için envanter ve 2021 fotoğrafı öncelikli. |
| Ortadaki çeşme tamamen mermer, bağımsız ve dört cephelidir | Aynı kaynak | Yüksek; kapalı dolu bir prizma olarak modellenmemeli, fotoğraftaki açıklıklar dikkate alınmalı. |
| Çeşme ölçüsü 2,70 × 1,15 m olarak yazılmıştır | Aynı kaynak | Sayı kesin, ölçü eksenlerinin yorumu belirsiz. Yükseklik-genişlik olasılığı görselle uyumlu olsa da henüz ölçüm kararı verilmedi. |
| Bânisi Vali Ahmed Münir Paşa; tarih H.1313 / M.1895 | Kitabeler PDF124; VGM1983 PDF105 sağ sayfa193; Ürgen PDF5 | Kitabeler ana dayanak, diğerleri destek. |
| Mermer çeşme kuzey taç kapısının karşısındadır | Kitabeler PDF127 sağ sütun | Konum ilişkisi doğrulanır; kapı aksına metre cinsinden kesin oturma verilmez. |
| Batı, güney ve doğu yüzlerinde kitabe metinleri | Kitabeler PDF124-125 | Cephe yönü için yararlı; fotoğraftaki her yüzü ayrıca eşlemek gerekir. |

### 3.3 Fotoğraflardan gözlenen biçimler

Bunlar metindeki ölçüler değil, görüntü incelemesinin sonuçlarıdır.

#### İki şadırvan

Esas görseller: `ref/foto/envanter_c1_pdf038_sadirvan_tek.jpg`, `ref/foto/envanter_c1_pdf038_sadirvan_havuz_kemer_detay.jpg`, `ref/foto/envanter_c1_pdf038_uc_yapi_birlikte.jpg`.

- Sekizgen düzene oturan ince koyu kahverengi taşıyıcılar; açık krem kemer yüzleri ve koyu kenar şeritleri.
- Üstte çokgen, kademeli ve dışarı taşan saçak; gri metal görünümlü, dilimli/ek yerleri belirgin soğan kubbe ve sivrilen tepe/alem.
- Kubbede önce dışarı şişen gövde, sonra içbükey daralan yüksek boyun görülür. Basit yarım küre yeterli olmaz.
- Alt çevrede X çaprazlı korkuluk bölümleri; giriş boşlukları fotoğraflardan eşlenmeli. Bazı yüzlerde düşey ızgara görülür; tüm cepheler aynı kabul edilmemeli.
- İçte çokgen mermer havuz, panolu yüzler, musluklar ve merkezî su öğesi. Havuzun tam kenar sayısı görünür birkaç yüzden kesinleştirilemez; örtünün sekiz direkli olmasından otomatik türetilmemeli.
- Çevrede oturaklar ve alçak taş platform. Kesin oturak sayısı ve tüm giriş yönleri doğrulanmadı.
- 2021 Canbakış fotoğrafı saçak/kemer renklerini ve cami cephesiyle ölçek ilişkisini destekler; perspektif fotoğrafından doğrudan metre ölçülmez.

#### Ortadaki mermer çeşme

Esas görsel: `ref/foto/envanter_c1_pdf038_orta_mermer_cesme.jpg`; konum için üç yapının birlikte fotoğrafı.

- Açık renk mermerden dar ve yüksek, dört cepheli bir yapı; üst gövdede dilimli kemerli açıklıklar görülüyor.
- Alt bölümde musluk ve dışa taşan, kıvrımlı yalak/havuz kenarı; altında basamaklı taban.
- Üstte çıkıntılı düz korniş ve küçük süslü taç elemanları. Ayrı bir soğan kubbe yok.
- Kitabe kuşakları ve yüzey çerçeveleri karakteri destekliyor. Model ölçeğinde yazılar doku olarak ele alınabilir; kaynakta okunmayan kitabe veya süsleme uydurulmamalı.
- Tek yakın çekim yaklaşık 180 × 258 pikseldir. Genel siluet okunuyor, ince bezeme ve arka yüzlerin tamamı kesin modellenemez.

### 3.4 Yerleşim ve ölçü sınırları

1. Envanter PDF38 sağ fotoğrafı üç yapıyı aynı karede gösterir; örtülü yapıların arasındaki küçük mermer çeşme ayırt edilebilir.
2. Envanter PDF39 hava fotoğrafı cami, minareler ve avlu için destek sağlar; ağaçlar ve çevre binalar örtüşme yaratır.
3. Ayverdi planı ve Ürgen PDF6, ana cami ve kuzey girişini gösterir. Üç avlu yapısının ayak izleri bu planda yoktur; plandan kesin yerleşim çıkarıldığı söylenmemeli.
4. Şadırvan dış çapı, toplam yüksekliği, saçak kotu, merkez aralıkları ve cami cephesinden uzaklıklar henüz sayısallaştırılmadı. Bunlar üretim sırasında fotoğraf oranlarıyla tahmin edilecekse tahmin olarak kaydedilmeli.
5. Mevcut v16 kaidesi gerçek avlu sınırı değildir; kaideye sığdırmak için yapıların ölçeklerini keyfî değiştirmek yerine yerleşim birlikte değerlendirilmelidir.

### 3.5 Karıştırılmaması gereken yapılar ve kaynak ifadeleri

- Envanter PDF38 üst ortadaki iki küçük fotoğraftan açık mermer ve kemerli olan ortadaki avlu çeşmesidir. Ahşap geniş çatılı, çinili diğer çeşme bu üçlüye dahil edilmez; görseli 18 Ekim düzenlemesinde kaldırıldı (kaynak: envanter C1 PDF 38, gömülü görsel Im2).
- PDF38'in altındaki 1903, 1959, 1993-94 tarihleri güneybatı köşe çeşmesine ilişkindir; ortadaki mermer çeşmenin tarihi değildir.
- PDF39'un başındaki pembe-beyaz sütun, ahşap payanda ve bakır çatı betimlemesi önceki köşe çeşmesi anlatısının devamıdır; iki ahşap şadırvana aktarılmamalı.
- Kitabeler PDF126 doğu kapısı karşısındaki çeşmedir. PDF127 sol bölüm güneybatı çeşmesi; sağ metin kuzey, doğu ve güneybatı çeşmelerini birlikte ele alır.
- Canbakış PDF164, Şekil5.6b ve cami planındaki ortadaki havuz iç mekân şadırvanıdır; bu tur kapsamı dışındadır.
- Tarihî Canbakış fotoğrafı yalnız karşılaştırma içindir. 2011 sonrası görünüş ile eski korkuluk, renk ve çevre kullanımları birleştirilmemeli.

### 3.6 Devam edilirse önerilen ilk tur

Önce iki şadırvan ve mermer çeşmenin ayrı kaba modelleri; kaynak fotoğraflarıyla yan yana kontrol. Ardından camiyle ortak yerleşim ve ölçek kontrolü; en son kemer, korkuluk, havuz, musluk ve mermer yüzey detayları. Bu not bir hazırlık planıdır; henüz hiçbir model dosyasına uygulanmadı.

### 3.7 v23'te uygulanan değerler (19 Ekim 2026)

- **Avlu şadırvanı** (F foto 094, 095, 097; E C1 PDF 38): platform 2 basamak (R 3,60 / 3,35), zeminden 0,30 m (T); 8 pahlı direk R 2,75; saçak R 3,45; toplam boy 9,55 m (platform üstünden 9,25); kurşun soğan kubbe `#7D858A`; kuzey ve güney bölmeleri açık (kuzeyi T). İçinde sekizgen havuz (Rh 1,35), 8 musluk, fıskiye, 8 tabure (R 2,32). Merkezler dünya (−14,45; −30,1) ve (15,55; −30,1). 5 786 üçgen.
- **Mermer çeşme** (E C1 PDF 38–39, F foto 096): 2,70 × 1,15 m, 4 dilimli yalak, nişler x ekseninde baştan başa delik, 7 dişli taç, yazı yok. 1 712 üçgen. Merkez (0,55; −30,1).
- **İç şadırvan** (P/F foto 105; Vakıf 1983 PDF 102): 16 kenarlı havuz Ø 6,5 (cidar 0,20, h 0,95), 16 pano/musluk/tabure, Ø 9 zemin halkası, 3 çanaklı fıskiye (tepe 2,39). Govde ve Cati'da R 5,45 boşluk; cam fener `#9FB8C0`, alpha 0,40. Merkez yerel (0; −6,4).
- **Şebekeler:** delikler alpha-cutout (64 px karo), levhanın duvara bakan kapağı koyu `#3E4A55`.
- **Taç kapı:** mukarnas 8 → 11 sıra (88 hücre); basamak 5, giriş kotu 0,85; kanat `#2F6B55` (F foto 001); fotoğrafta yan niş görünmüyor, yapılmadı.
- **Kaide:** dikdörtgen, x −42,49…44,10, y −44,80…44,80 (yapı + avlu ayak izine 8 m pay), köşe pahı 1,5, kalınlık 0,6, üst pah 0,15; üst `#C4BDAF`, yan `#A39A8B`; üst kot −0,02 (T).
- **Çevre:** servi (10,8; −24,6) h 14 m `#3F7A5C` (F foto 009: merdivenin sağında); çınar (−9,0; −25,3) h ≈ 11 m, sekizgen tarh R 1,8 (bordür `#D2C3A4`, çim `#9DB86A`) (F foto 009, 094). Plan "servi doğuda" diyordu; foto 009'da kare kaideli batı minare (+X) tarafında, fotoğrafa uyuldu.
- **Figürler:** 10 `A.insan` (4 kadın, 2 çocuk), 4 192 üçgen; her şadırvanda 1 oturan + 1 ayakta, çeşmede 1, taç kapıya 3 yürüyen, merdivende 1, batı kapısında 1.

## 4. Çevre yapıları: envanter temelli sahne notları (16 Ekim)

16 Ekim 2026. Öncelikli kaynak: veri/kaynak_pdf/bursa-envanteri-cilt-1.pdf ve cilt-2.pdf; veri/metin/ altındaki karşılıkları tarandı, ilgili PDF sayfalarıyla eşleştirildi. Cilt 3 çevre adları için tarandı; bu kısa listeye doğrudan dayanak eklemedi. Sayfa numaraları PDF görüntüleyicisinin 1 tabanlı sayfa numarasıdır; tek PDF sayfası bazen iki basılı kitap sayfasını içerir. Aşağıdaki güncel kullanım ifadeleri envanterin anlattığı duruma aittir, bağımsız 2026 saha doğrulaması değildir.

### İlk sahne: caminin kendi avlusu

| Öğe | Envanter bilgisi | Anlatı ve modelleme kararı | Kaynak |
|---|---|---|---|
| Kuzey avlusundaki su yapıları | Aynı hat üzerinde üç şadırvan tarif edilir. Doğu ve batıdaki iki örnek, sekiz ahşap direk, yonca kemerler ve soğan kubbeyle 2011'de eski fotoğraflara uygun yenilenmiştir. | İlk eklenecek çevre öğeleri. Abdest, su hayratı ve avlu kullanımı anlatılabilir. Kesin merkez/çap ve aralıklar fotoğraf veya plandan alınmalı. | C1 PDF39, basılı76 |
| Ortadaki mermer çeşme | Tamamen mermer, bağımsız dört cepheli; 2,70 × 1,15 m; Vali Ahmed Münir Paşa'ya atfedilir. | Ortadaki yapıyı iki uçtaki ahşap örtülü yapılarla aynı biçimde çoğaltmamak gerekir. | C1 PDF39, basılı76 |
| Güneybatı köşe çeşmesi | PDF38 dört yüzlü çeşmenin 1903 yapımı, 1959 yıkımı ve 1993–94 yeniden inşasını anlatır. Kitabe Ahmed Münir Paşa'yı ve belediyenin yeniden yapımını belirtir. PDF39 ayrıca Karaçelebizâde Abdülaziz Efendi bağışlarıyla güneybatı köşesinde çeşme kaydeder. | Su yapıları ve onarım tarihini anlatmak için değerli. Ancak kişi/konum ilişkileri netleştirilmeden ayrı ayrı aynı çeşmenin kopyalarını yerleştirmemek gerekir. | C1 PDF38–39, basılı74–76 |

### Çevreyi genişletirken kullanılacak yapılar

| Öncelik | Yapı | Envanterde konum / ilişki | Ulu Cami anlatısına katkı | Kaynak |
|---|---|---|---|---|
| 1 | Emir Hanı | Ulu Cami'nin kuzeydoğu köşesinde. Orhan Bey külliyesinin parçası; 1339–40. Yaklaşık 45 × 45 m, iki kat, revaklı avlu. | Bursa ticaret çekirdeği; mal tartımı ve kantariye geliri. Cami çevresinin ekonomik yaşamını somutlaştırır. | C1 PDF108, basılı214–215 |
| 2 | Orhan Bey Hamamı / Aynalı Çarşı | Ulu Cami'nin kuzeyinde, Emir Hanı ile Koza Han arasında. 1340, çifte hamam; Orhan imaretine vakıf. | Hamamın çarşıya dönüşmesi, hayratın gelir yapıları ve tarihî kullanım değişiklikleri. | C1 PDF104, basılı207 |
| 3 | Koza Han | Orhan Camii ile Ulu Cami arasında. II. Bayezid'in İstanbul külliyesine gelir için; 1489 başlangıç, 30 Eylül1491 açılış. | İpek/ticaret çevresine ve sıradaki Koza Han eserine geçiş. Ulu Cami'ye gelir sağlamak için yapılmış diye anlatılmamalı. | C2 PDF8–9, basılı15–17 |
| 4 | Orhan Bey Camii | Ulu Cami'nin doğusunda, tarihî belediye binasının batısında; 1339–40. | Orhan dönemi sur dışı kent çekirdeğinden Yıldırım dönemi Ulu Cami'ye gelişim. Ayrı külliyelere ait yapılar olduğu açık tutulmalı. | C1 PDF96, basılı191 |
| 5 | Yıldırım Bayezid Bedesteni | Büyük Cuma Camii yakınında; Emir Hanı ve Orhan Hamamı ile paralel eksen. Vakfa gelir sağlama ve çarşının çekirdeği işlevi. C1 giriş bölümü doğrudan Ulu Cami'ye gelir amacını yazar. | Ulu Cami'nin vakıf ekonomisini anlatmak için en güçlü ticaret yapısı. Yakın avluya sığdırılacak küçük ek değil; daha geniş Hanlar Bölgesi sahnesi. | C1 PDF11, basılı20–21; C2 PDF27,29, basılı53,56–57 |

### Kaynakların işaret ettiği sınırlar

- C1 PDF20, cami/medrese/hamam/bedesten/dükkân/meşruta bütününü ve sonradan eklenen şadırvan, muvakkithane, muallimhane, müezzin ve muvakkit odalarını anlatır. Eklerin büyük bölümünün kaldırıldığını belirtir. Bunları bugünkü avluya mevcut bina gibi eklemek doğru olmaz; tarihsel anlatı katmanında kullanılabilir. Bu pasaj medreseye özel isim vermediği için buradan Vaiziye vb. ad türetilmedi.
- C1 PDF104, Koza Han için1505 der; C2 PDF8'deki yapıya özel kayıt 30 Eylül1491, C1 PDF194 ise Ekim1491 verir. Anlatıda1491 yılı kullanılmalı, gün/ay ve1505 kaydı uyuşmazlık olarak not edilmeli.
- C1 PDF38–39 çeşme adları/konumları birbirine karışabilecek biçimde anlatılmıştır. Kesin yerleştirmede envanter görselleri ve planla kimlik eşlemesi gerekir.
- Metinlerin verdiği yön ilişkileri, metre cinsinden koordinat veya kesin ayak izi değildir. Hanları rastgele ölçekte yakın avluya sıkıştırmamak gerekir.

### Sahne önerisi

Önce genişletilmiş kaidede kuzey avlusu ve su yapıları. Sonra Emir Hanı ile Aynalı Çarşı'yı bağlam yapıları olarak ele almak; Koza Han ve Orhan Camii'ni daha geniş çevre görünümünde göstermek. Bedesteni vakıf–ticaret ilişkisini anlatan bağlantılı bir odak olarak kullanmak. Bu öncelik sıralaması tasarım önerisidir, envanterin verdiği bir sıralama değildir.

v16'da yalnız sunum kaidesi genişletildi: ana elips 102 × 92 model metreden 122 × 110'a; çim119,6 ×107,6; dış gölge126 ×114. Bina geometrisi ve ölçeği korunur. Bu kaide gerçek avlu sınırı değildir. Komşu bina veya şadırvan henüz eklenmedi. İleride Hanlar Bölgesi'ni kapsamak için ayrı bir geniş çevre sahnesi gerekebilir.

## 5. PDF tarama dökümü (17–18 Ekim)

17 Ekim 2026. veri/bursa içindeki 17 PDF ve Bursa envanterinin üç cildi metin üzerinden tarandı. İlgili sayfalar görsel olarak incelendi. Bu liste her PDF sayfasının görsel olarak incelendiği anlamına gelmez. Metin eşleşmeleri başka camilere ve iç şadırvanlara da ait olabilir.

| Dosya | PDF sayfa sayısı | Metin eşleşen PDF sayfaları |
|---|---:|---|
| Gulten_Fatma_Sag.pdf | 289 | 10, 16, 27, 34, 39, 51, 52, 53, 65, 68, 73, 75, 76, 80, 81, 86, 88, 100, 109, 110, 121, 131, 146, 148, 188, 189, 227, 228 |
| 11471.pdf | 13 |  |
| Bursa_Ulu_Cami_Mimari_Ozellikleri.pdf | 29 | 1, 2, 4, 5, 6, 8, 12, 13, 15, 16, 17, 19, 20, 21, 22, 23 |
| turkiyede-vakif-abideleri-ve-eski-eserler-3.pdf | 216 | 4, 5, 6, 23, 24, 33, 37, 74, 85, 94, 96, 97, 102, 103, 104, 105, 106, 150, 161, 165, 171, 172, 176, 178, 179, 181, 183, 193, 199, 205, 211, 216 |
| SETSCI_ISAS2019-FDAS_0040_007.pdf | 7 | 2, 3, 4, 5, 6, 7 |
| Tarihi_Cevrede_Modern_Bir_Han_Bursa_Hal.pdf | 15 |  |
| Kul.pdf | 229 | 6, 10, 12, 13, 15, 17, 28, 30, 31, 33, 54, 57, 66, 67, 68, 87, 88, 89, 94, 98, 101, 110, 113, 115, 117, 118, 124, 126, 129, 131, 132, 133, 137, 138, 141, 142, 144, 149, 151, 158, 163, 168, 172, 173, 174, 193, 198, 199, 200, 201, 202, 203, 204, 220, 221, 222, 224, 228 |
| Busra_CANBAKIS.pdf | 170 | 8, 9, 10, 11, 14, 15, 16, 35, 36, 40, 43, 44, 45, 47, 49, 54, 55, 56, 57, 58, 63, 64, 65, 69, 70, 79, 81, 86, 87, 89, 90, 92, 94, 96, 97, 114, 148, 153, 161, 163, 164, 165, 168 |
| bursa-kitabeleri_e012d005a33d26d218102023170305000000.pdf | 162 | 7, 8, 9, 11, 35, 39, 45, 89, 116, 124, 125, 126, 127, 151 |
| Bursa_Hanlar_Bolgesinde_Yer_Alan_Hanlar.pdf | 14 | 10 |
| 10.31591-istem.758701-1171631.pdf | 23 | 3, 4, 5, 6, 7, 8, 10, 15 |
| Orhan_Gazi_Donemi_Mimarisinde_Sultan_Yap.pdf | 422 | 64, 70, 72, 75, 96, 100 |
| StructuralPerformanceEvaluationofHistoricalBursaGreenMosque.pdf | 18 | 18 |
| Bursa_Yesil_Kulliyesi_Medresesinin_Muze.pdf | 17 | 9, 10 |
| 132194254-YesilTurbeRehber.pdf | 8 | 4 |
| hanlar-bolgesi.pdf | 84 | 5, 7, 8, 9, 10, 11, 12, 13, 15, 16, 20, 21, 46, 48, 51 |
| 0835045D5107482F82FF52D31AD814E7.pdf | 24 | 5, 12, 20 |
| bursa-envanteri-cilt-1.pdf | 245 | 5, 6, 7, 10, 11, 14, 15, 16, 19, 20, 21, 23, 25, 27, 30, 31, 33, 34, 36, 38, 39, 46, 47, 56, 96, 103, 104, 105, 106, 108, 109, 110, 111, 114, 139, 141, 143, 157, 159, 162, 195, 197, 200, 208, 211, 212, 213, 216, 224, 226, 230, 244 |
| bursa-envanteri-cilt-2.pdf | 289 | 8, 9, 14, 17, 18, 20, 23, 25, 29, 36, 60, 95, 98, 140, 142, 154, 179, 183, 191, 210, 214, 221, 227, 258, 260, 274 |
| bursa-envanteri-cilt-3.pdf | 209 | 6, 19, 31, 51, 87, 103, 112, 118, 119, 135, 136, 139, 163, 177, 181, 183, 184, 186, 191, 193, 194, 199 |

Seçilen esas kaynaklar: Cilt 1, Bursa Kitabeleri, Canbakış, Ürgen, Vakıf Abideleri III. Diğer sonuçlar bu üç avlu yapısına doğrudan yeni detay sağlamadığı için pakete alınmadı. Cilt 2 ve 3 bu çalışma için ek doğrudan dayanak sağlamadı. Gülten Fatma Sağ çalışmasındaki sekiz direkli şadırvan Emir Sultan’a aittir; Ulu Cami ile karıştırılmadı.
18 Ekim eki: ana yapı için Envanter C1 PDF 19–37, Vakıf 1983 PDF 102–106, Kul PDF 193–198 ve 221–223, Ürgen PDF 7–23, Canbakış PDF 55–58, 148, 153, Kitabeler PDF 45 ve hanlar-bolgesi.pdf PDF 7–8 eklendi. `veri/bursa` içindeki 18. PDF (ABAD, Eski Kaplıca) Ulu Cami ile ilgili değildir.

## Ek: Geçmiş kayıt (13–15 Ekim, Claude v01–v02)

> Bu ekteki değerler tarihsel kayıttır. Plan 70 × 56, maket yükseklikleri (duvar 17,3, minare ≈ 60,9), v02 paleti ve parça listesi **geçerli değildir**. Güncel kararlar §1'de. Yollar o tarihteki klasör düzenine göredir (`build/`, `claude/`).

### GEOMETRİ DONDURMA v01e2 (13 Ekim, Muhammed kabul etti)
Kütle `build/build_v01e2.py` + `blend/ulu-cami_v01e2.blend` ile donduruldu: plan, kotlar, kubbe profili ve merkezleri, çatı, minare kütlesi ve yerleri.
Bundan sonra yalnız ekleme (detay, renk) ve biçim değiştirmeyen kusur düzeltmesi yapılır.

### Kararlar (13 Ekim, Muhammed)
Bu bölüm aşağıdaki eski değerlerin önüne geçer (ör. §2'deki "70 × 56 / bölme 14 m" satırları). Uygulama: `build/build_v01e2.py` P tablosu.

| # | Karar | Değer | Dayanak |
|---|---|---|---|
| 1 | Plan dış ölçüsü | **68,7 × 55,0 m** (doğu–batı × kuzey–güney) | Ayverdi rölöve planı, ölçek çubuğu 24,55 px/m (yazı "68,85? × 55,25?"). 70 × 56 (OSM + envanter) bırakıldı |
| 2 | Kubbe merkezleri | Plandaki paye akslarının ortaları: doğu–batı 0 / ±12,85 / ±25,2 m; kuzey–güney ±6,4 / ±19,2 m | Ayverdi planı (paye aksları x ±6,5 / ±19,2, y 0 / ±12,8). Eşit 14 m bölme bırakıldı. Kasnak dış Ø 12,0, etek Ø 12,3 |
| 3 | Kubbe biçimi | v01e'de maketten ölçülen oranlar: A/C 0,243 / 0,264 / 0,311; A/B 1,31 / 1,03 / 0,98 (uç / ara / orta); yeni çapa ölçekli. Tepe kotları sabit 25,2 / 26,9 / 29,1 | Miniatürk maketi ölçümü. Hedef tablo (A/B ≈ 2, A/C ≈ 0,46) kullanılmadı |
| 4 | Minare gövde Ø | **4,3 m**, iki minarede aynı (doğu kaide kenarı × 0,75) | Plandaki daireler merdiven boşluğu (doğu Ø 2,45, batı Ø 2,05), gövde dışı planda yok. Maketten gelen 5,3 m bırakıldı |
| 5 | Minare yerleri | Doğu (kare kaide): tamamen kuzey cephenin önünde, cepheden 0,9 m açıkta, dış kenarı doğu duvarıyla hizalı. Batı (sekizgen kaide): kuzeybatı köşede, eksen batı duvarından 2,4 m içeride, cepheden 3,7 m önde; köşeden batıya ve kuzeye taşar | Ayverdi planı. Önceki "yan duvarla hizalı" (v01d) yerleşimi bırakıldı. Batıdaki merdiven geçidi henüz modellenmedi |
| 6 | Doğu kaide ölçüsü | **5,7 × 5,9 m** (doğu–batı × kuzey–güney) | Ayverdi planı. Maketten gelen 7,4 m bırakıldı. Batı kaide plandan: yüzden yüze 6,7 m |

### 1. Kaynaklar

| Kısa ad | Ne | Yer |
|---|---|---|
| ENV | Bursa Vakıf Eserleri Envanteri, Cilt 1, s. 38–50 | `veri/metin/bursa-envanteri-cilt-1.txt` (satır ~2455) |
| ÜRGEN | O. Ürgen, "Bursa Ulu Camii Mimari Özellikleri", HMKÜ Sanat Tarihi ödevi, 2019 | `veri/bursa/Bursa_Ulu_Cami_Mimari_Ozellikleri.pdf` |
| REF1 | Sade 3D model render'ları (plan üstten, cepheler). Kütle ve kubbe düzeni için iyi; kubbe yükseklikleri YANLIŞ (hepsi eşit) | `ulu-cami/ref/maket/ (model3d_*)` |
| REF2 | Miniatürk maketi fotoğrafları. Renk, cephe silmeleri, minare, taç kapı | `ulu-cami/ref/maket/` |
| REF3 | Gerçek fotoğraflar (havadan + cephe). Kubbe yükseklik profili, renkler | `ulu-cami/ref/foto/` |
| OSM | Ayak izi ve yön | Alındı (Overpass, 13 Ekim): way 26434413, `building=mosque`, `building:part` YOK. Ayak izi 70,5 × 60,3 m, uzun eksen kuzeye göre +6,4° (doğuya doğru). Alan 4 245 m². **60 × 48 ile çelişiyor**, bkz. §2 |

Ölçü için en iyi iki fotoğraf: `ref/foto/unnamed.webp` (kuzey cephe, neredeyse karşıdan, iki minare) ve `ref/foto/509433933_...jpg` (havadan, 5×4 ızgara net).
REF1 bir 3D model render'ı; modelin kendisi (.skp/.dae/.obj) bulunabilirse en iyi ölçü şablonu o olur.

### 2. Ölçü tablosu

| Ölçü | Değer | Kaynak | Not |
|---|---|---|---|
| Plan | **70 × 56 m** (5 × 4 bölme × 14 m), 60 × 48 (ödev) yerine OSM + envanter | OSM 70,5 × 60,3; ENV 69 × 55 | v01c'den beri. 60 × 48 yalnız ÜRGEN ödevinde |
| Plan (alternatif) | "yaklaşık 55 × 69 m" | ENV s.49 | Çelişiyor. OSM ile karar ver; OSM yoksa 60 × 48 |
| İbadet alanı | 3500 m² | ENV | |
| Kubbe sayısı | 20 = 5 (doğu–batı) × 4 (kuzey–güney) | ENV, ÜRGEN | |
| Kubbe çapı | 11 m, hepsi aynı çap | ENV s.50 ("aynı çaptaki birden fazla kubbe") | |
| Bölme (aks aralığı) | 14 m | 70/5 ve 56/4 | Hesap. Fotoğrafta bölme ≈ 205 px = 13,8 m ✓ |
| Ayak | 12 kare paye, sivri kemerlerle bağlı | ENV, ÜRGEN | İç mekân, modele girmez |
| Açık kubbe | Mihrap aksında, kuzeyden 2. sırada; altında onikigen mermer havuz (şadırvan); tepesi açık, üstünde aydınlık feneri | ÜRGEN s.5, ENV | |
| Pencere | Alt sıra 26, üst sıra 32 (toplam 58), sivri kemerli, büyük sağır kemer silmeleri içinde | ENV | |
| Kapılar | Kuzey: taç kapı (çıkıntılı, beyaz mermer). Doğu: Çarşı Kapısı. Batı: Mahkeme Kapısı | ENV, ÜRGEN s.10 | |
| Minare | 2 adet, kuzeybatı ve kuzeydoğu köşede; gövde tuğla, kaide mermer/taş, sekizgen kaide → onaltıgen kasnak, mukarnaslı şerefe | ÜRGEN s.21 | Yükseklik: **doğrulanmadı** |
| Malzeme | Sarımtırak kefeki taşı | ÜRGEN s.5 | |
| Arazi | Eğimli; güney yol seviyesinin altında | ÜRGEN s.5 | Modelde düz zemin; eğim yok |

#### Kubbe yükseklik profili (Muhammed + REF3)
- Doğu–batı yönündeki 5 sütun: **ortadaki en yüksek**, yanındakiler daha alçak, **uçtakiler en alçak**. Çap hep 11 m; fark kasnak (ve gerekirse kubbe yükselişi) ile verilir.
- Bu profil kuzeyden güneye 4 sıra boyunca tekrar eder.
- Sıralar arasında (ön–arka) yükseklik farkı var mı: **doğrulanmadı**. İlk sürümde 4 sıra aynı.
- REF1'deki eşit kubbeler bu yüzden referans alınmaz.

#### Yükseklikler (v01d: Miniatürk maketi `ref/maket/Miniaturk_..._Mosque.jpeg`, cephe 70 m = 1500 px → 21,4 px/m; kamera ≈ 10° yukarıdan, derinlik düzeltmesi uygulandı; ±1 m; ref-foto ikinci kontrol)
| Parça | v01c (ref-foto) | v01d (maket) |
|---|---|---|
| Duvar (saçak altı) | 16,1 m | 17,3 m |
| Kasnak dış Ø / kubbe eteği Ø | 11 / 11 m | 13,0 / 13,6 m (maket: kasnak 13,1–13,8, etek 13,7–14,4) |
| Kasnak üstü uç / ara / orta | 19,7 / 20,5 / 22,6 | 21,6 / 23,0 / 24,3 |
| Kasnağın çatıdan çıktığı kot | 17,1 / 17,9 / 20,0 | 18,8 / 19,0 / 19,9 |
| Görünen kasnak yüksekliği | 2,6 | 2,8 / 4,0 / 4,4 |
| Kubbe yükselişi (kasnak üstünden) | 3,6 / 4,0 / 4,6 | 3,1 / 3,3 / 4,1 |
| Orta kubbe tepesi | ≈ 27,2 | ≈ 28,4 m |
| Minare tepe (alem dahil) | ≈ 60 | ≈ 60,9 m |
| Minare gövde Ø alt / üst | 7,0 / 5,2 | 5,3 / 4,3 m; şerefe Ø 7,6, bilezik kuşağı Ø 6,2 (z 36,6–40,8) |
| Kaide | tek tip 9,3 kare | bantlı sekizgen: 7,2 m (taban etek 10 m), 15 m yüksek; sade kare: 7,4 m, 6,1 m yüksek |

Kubbe profili: etek alt yüzü → kısa dışa kıvrım → içe bel → yuvarlak gövde (G.lathe, kasnakla tek kapalı mesh).

#### v01e: maket ölçümü (A/B/C) ve P tablosu özeti
Ölçüm: maket fotoğrafı orijinal çözünürlük, 32,9 px/m (cephe 70 m). Kamera eğimi etek elipsinden ≈ 6° (kullanıcı tahmini 10°). Tepe kotları 7 m derinlik için −0,7 m düzeltildi.

| Sütun | B görünen kasnak | A kubbe (etek alt kenarı → tepe) | C etek Ø | A/B | A/C | Hedef A/B · A/C |
|---|---|---|---|---|---|---|
| uç | 2,55 | 3,35 | 13,8 | 1,31 | 0,24 | 1,8–2,2 · 0,44–0,48 |
| ara | 3,7 | 3,8 | 14,4 | 1,03 | 0,26 | |
| orta | 4,55 | 4,45 | 14,3 | 0,98 | 0,31 | |

Ölçüm hedeflerden çok farklı; yönerge gereği ölçüm kullanıldı. Modelde etek Ø 13,9 (14 m bölmede komşular kesişmesin diye taşma 0,7 → 0,42 m).

P (build_v01e.py): duvar 17,3 · saçak üstü 17,45 (taşma 0,35, kalınlık 0,15) · dış bant 65° · bölme içi kırma 30° · sütun geçiş şeridi 0,6 m · plato kenardan 1,6 m ·
çatı-kasnak birleşim 19,3 / 19,4 / 20,1 · oluk 19,0 / 19,1 / 19,8 · etek alt kenarı 21,85 / 23,1 / 24,65 · kasnak üstü 21,9 / 23,2 / 24,7 · tepe 25,2 / 26,9 / 29,1 ·
kasnak R 6,5, 24 kenar; kubbe 24 segment, kullanıcı profili z × A/6,32 · minare: D 5,3, bilezik 3 kademe (36,6–41,3, r 1,08/1,14/1,20 × D/2), korkuluk Ø 7,6 h 1,5 (41,3–42,8), üst gövde Ø 4,3 h 6,4, başlık büyük soğan Ø 4,0 + küçük soğan Ø 2,7, tepe 60,9; şerefe/boy = 0,68 (maket; hedef 0,72–0,75).
Bindirme (v01e_overlay.png): ön sıra kubbe tepeleri, etekler ve çatı bandı maketle ±0,3 m. Kasnak alt kenarı modelde ≈ 0,7 m daha alçak (R 6,5 + 14 m bölme + bant ≤ 65° ile kasnak önü bandın üstüne düşüyor). Arka sıralar ve minareler örtüşmüyor: maket fotoğrafı yakın perspektif, model ortografik.

#### Ayverdi rölöve planı (`veri/bursa/ulu-cami_plan_ayverdi.png`, plan 687; kuzey aşağıda)
Ölçü yazıları bu taramada büyük ölçüde okunamıyor; değerler ölçek çubuğundan (0–40 m = 978 px → 24,55 px/m) piksel ölçümü. "?" = yazı tahmini.

| Ölçü | Değer | Not |
|---|---|---|
| Dış ölçü doğu–batı | 68,7 m (piksel); yazı "68,85?" | Model 70 → fark 1,3 m (< 2 m, plan değişmedi) |
| Dış ölçü kuzey–güney | 55,0 m (piksel); yazı "55,25?" | Model 56 → fark 1,0 m |
| Alt zincir (doğu duvarı → batı minare) | yazı "61,42?" | |
| Kubbe daire çapları (iç) | 10,71–10,98 m (yazı 1071–1098, kısmen okunuyor) | Envanterdeki Ø 11 ile uyumlu |
| Paye aks aralığı | ≈ 12,5 m (orta sütunlar 305–313 px) | Model bölmesi 14 m; uç bölmeler duvar dahil ≈ 14,5 m |
| Paye | ≈ 2,2 m çekirdek (yazı 216–222), çıkıntılarla ≈ 2,85 m | İç mekân, modele girmez |
| Dış duvar kalınlığı | ≈ 2,4–2,6 m (yazı "245?") | |
| Doğu minare kaidesi (kare) | 5,7 × 5,9 m; dış kenarı doğu duvarıyla hizalı; kuzey cepheden 0,9 m önde, tamamen cephenin önünde | Model kaidesi 7,4 m (maket) |
| Batı minare kaidesi (çokgen) | ≈ 8,6 × 6,7 m dış çizgi; eksen batı duvarından 2,4 m içeride, cepheden 3,7 m önde; köşeden batıya ≈ 1,2 m, kuzeye ≈ 6,9 m taşar; cepheye çapraz merdiven geçidiyle bağlı | Geçit modellenmedi (detay) |
| Açık kubbe (havuz) | orta sütun, kuzeyden 2. sıra | Doğru |

Doğrulama: `kontrol/v01e_plan_overlay.png` (model üstten, plan ölçeğinde, %50 bindirme).

#### v01e2: plana oturtulmuş kütle (build_v01e2.py, P tablosu)
- Dış ölçü 68,7 × 55,0 m (plan). Kubbe merkezleri paye akslarından: doğu–batı 0 / ±12,85 / ±25,2; kuzey–güney ±6,4 / ±19,2 (paye aksları x ±6,5 / ±19,2, y 0 / ±12,8; uç sütun merkezi duvar payesine göre, doğrulanmadı ±0,3 m).
- Kasnak dış Ø 12,0, etek Ø 12,3. Kubbe oranları v01e maket ölçümüyle (A/C 0,243 / 0,264 / 0,311; A/B 1,31 / 1,03 / 0,98). Tepe kotları sabit 25,2 / 26,9 / 29,1 →
  A 2,99 / 3,25 / 3,83 · B 2,27 / 3,16 / 3,91 · etek alt kenarı 22,2 / 23,65 / 25,3 · kasnak önünde çatı kotu 19,9 / 20,5 / 21,4 · oluk 19,0 / 19,8 / 21,0.
- Çatı: dış bölmelerle duvar arasında (kuzey–güney 2,3 m, doğu–batı 3,15 m) 65° bant + 30° kırma; sütun geçişi 0,24 m eğimli şerit. Kasnak tabanı çatı yüzünü birebir izler (5 cm gömülü).
- Minare gövde Ø 4,3 m (doğu kaide × 0,75; Muhammed kararı: plandaki daireler merdiven boşluğu, doğu Ø 2,45, batı Ø 2,05). Başlık/kuşak çapları buna ölçekli, kotlar sabit (tepe 60,9).
- Doğu kaide 5,7 × 5,9 m (plan), cepheden 0,9 m önde, dış kenar doğu duvarıyla hizalı. Batı kaide sekizgen, yüzden yüze 6,7 m (plan kuzey–güney), eksen batı duvarından 2,4 m içeride, cepheden 3,7 m önde.

### 3. Renk (v02 son palet; `A.palet({...})`, ardından `A.ao_vertex(samples=32)`)

| Ad | Hex | Nerede |
|---|---|---|
| duvar | #CDB592 | cephe + minarenin açık kısımları (v02c, Muhammed: kaide, şerefe, başlık, bilezik, geçit duvar renginde) |
| nis | #B9A07E | sağır kemer içi |
| mermer | #EEEAE2 | taban bandı, silme, söveler, taç kapı (minarelerde artık yok) |
| pencere | #3E4851 | kapı ve alt pencere kenarları |
| Kafes_Beyaz (doku) | #EEEAE2 zemin, #1F2328 yuvarlak delik; 32 px karo = 0,16 m | üst pencereler + kasnak pencereleri (`build/doku/`) |
| Izgara_Kirmizi (doku) | #1F2328 zemin, #A8352B ızgara; 32 px karo = 0,30 m | alt pencereler |
| ahsap | #6B4A33 | kapı kanatları |
| kasnak | #E2C77E | kasnaklar |
| kubbe | #B9C2CC | kubbeler |
| cati | #9AA3AD | çatı |
| alem_kursun | #6B7480 | kubbe alemleri (metalik) |
| tugla | #9C5A45 | minare gövdeleri |
| bant_koyu | #5E6670 | batı minare kaide bantları |

AO yumuşatma: `c = taban + (1 − taban)·ao`; taban 0,6, kubbe/kasnak 0,85 (seyrek köşeli kasnak duvarında AO tüm yüze yayılıp kasnağı karartıyordu).

### 4. Parça listesi (v02, `export/ulu-cami_v02.glb`)

Adlar uygulamada vurgu ve kamera hedefi listesi olur. 17 mesh nesnesi, 37 draw call.

| Ad | İçerik | Hikâyede kullanım |
|---|---|---|
| `Govde` | dikdörtgen kütle 68,7 × 55,0 × 17,3 m | genel |
| `Cati` | sütuna göre yükselen kırma kurşun çatı, dışta 65° bant + saçak | |
| `Kubbeler_19` | 19 kubbe + kasnak, 24 segment, yivli | "yirmi kubbe" |
| `Sadirvan_Kubbe` | açık kubbe (orta sütun, kuzeyden 2. sıra), kabuk kapalı | "açık kubbeli şadırvan" |
| `Alemler` | 20 kubbe alemi | |
| `Kasnak_Pencereleri` | kasnak başına 8 sivri kafesli pencere, 1,4 × 2,4 m (v02c); çatının yükseldiği yüzlerde alttan kısalır (en az 1,5 m), 20 pencere yok | |
| `Cephe_Kuzey` / `Cephe_Guney` / `Cephe_Dogu` / `Cephe_Bati` | 0,25 m cephe kabuğu + sağır sivri nişler + üst/alt pencereler (söve, boşaltma kemeri) | cephe |
| `Mermer_Bant` | 1,2 m taban bandı | |
| `Silme_Ust` | saçak altı silme 0,4 m | |
| `Tac_Kapi` | kuzey taç kapı: mermer blok, derin sivri niş, mukarnas taklidi, kapı, 6 basamak | giriş |
| `Kapi_Dogu` / `Kapi_Bati` | yan kapılar (Çarşı / Mahkeme), mermer çerçeve | |
| `Minare_1` | kuzeybatı: sekizgen bantlı kaide + cepheye çapraz geçit, tuğla gövde, 3 bilezik, şerefe silmeleri | |
| `Minare_2` | kuzeydoğu: kare kaide, aynı gövde | |
| `Zemin` | düz platform (dışa aktarılmaz) | |
| `Merkez` (Empty) | zemin ortası, kamera hedefi (dışa aktarıcı yalnız mesh aldığı için .glb'de yok) | OrbitControls |

Orijin: yapının zemin ortası. Kuzey cephe −Y yönüne bakar, +X = batı.

#### v02 detay ölçüleri (P tablosunda `D_` önekli)
- Niş 4,8 m geniş (maket 4,9–5,0), 1,4 → 15,8 m, sivri (R = 0,8 × genişlik), bölme başına 2. Niş derinliği Govde'ye dokunmadan, önüne eklenen 0,25 m kabukla verildi; dış yüz artık 69,2 × 55,5 m.
- Üst pencere 2,2 × 4,1 m (9,1–13,2), alt pencere 1,7 × 2,5 m (1,8–4,3): ölçüler maketten (yönergede 1,6 × 3,2 ve 1,3 × 1,9). Sayı 30 üst + 30 alt (envanter 32 + 26).
- Taç kapı: plandan 9,5 m geniş, 1,8 m çıkıntılı; 16,5 m yüksek; niş 4,2 m, tepe 12,0; kapı 2,8 × 4,5; merdiven 6 basamak, 16,1 m.
- Yan kapılar: doğu y = −5,2 (plan −5,5; nişe çarpmasın diye 0,3 m kaydırıldı), batı y = −4,68.

### 5. Tur planı (3 tur)

| Tur | Konu | Kabul |
|---|---|---|
| v01/v01b · Kütle | OSM ayak izi + fotoğraftan oran ölçümü → Govde, Cati, Kubbeler_19, Sadirvan_Kubbe, Alemler, Minare_1/2, Zemin | kontrol_hepsi GECTI, üçgen < 25k, kuzey ve havadan render'ı REF3 ile yan yana |
| v02 · Detay + renk + çıkış | Cephe nişleri ve pencereler, Tac_Kapi, yan kapılar, bant/silme, kasnak pencereleri, kubbe yivleri, minare detayları, son palet + AO, `export/ulu-cami_v02.glb` (geometri v01e2'de donduruldu) | GECTI, ≤ 30k üçgen, ≤ 1 MB |
| v03 · Renk + çıkış | palet, `ao_vertex`, `disa_aktar` → `export/ulu-cami_v03.glb`, ≤ 1 MB | dosya boyutu, Redmi testi |
