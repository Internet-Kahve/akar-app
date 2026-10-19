# Han (kervansaray) · eser şablonu

Kimlik, ölçü ve kaynak tablosu (giriş noktası). İç Koza ve Mescit alt birimlerdir; ayrı eser olarak üretilmez, Koza Han modelinde yer alır (İç Koza basit kütle). Alt birimlerin önceki eser formları `ref/metin/alt-birim_ic-koza-hani_eser-kaydi.md` ve `ref/metin/alt-birim_koza-han-mescidi_eser-kaydi.md` içindedir. Model kararları `koza-han_notlar.md`, modelleme talimatı `SONNET_REVIZYON_PLANI.md`.

Hanlar ve kervansaraylar için. Han akar (gelir getiren) yapıdır.

*Doldurma kuralları:*

Her ölçünün **Kaynak** sütununa tek harf yaz:
`P` rölöve/ölçülü plan · `E` envanter kitabı · `W` güvenilir web/makale (URL Not'ta) · `O` OSM ayak izi · `M` maket · `F` fotoğraftan ölçüm · `H` hesap (kitaptaki iki değerden türetilmiş; formülü Not'a yaz, örn. dış ölçü = iç ölçü + 2×duvar) · `T` tahmin.
Öncelik: P > E > H > W > O > M > F > T. Kaynaklar 2 m'den fazla çelişirse hangisini seçtiğini Not'a yaz.
**Bir hücre = bir kaynak = bir sayfa.** Kaynak olarak kitap cildi ve PDF sayfası yaz (örn. `E cilt-2 PDF s.72`); eser-turleri.csv kaynak değildir.
**Boş bırakılan alan** = Claude tür varsayılanını kullanır ve `VARSAYIM` diye notlara yazar. Bilmiyorsan boş bırak, uydurma değer yazma.

## 0. Kimlik

| Alan | Değer | Birim | Kaynak | Not / tipik |
|---|---|---|---|---|
| id (eser-turleri.csv) | bursa-409 |  |  | İdari metadata. |
| Eser adı (temiz yazım) | Koza Han |  | E cilt-2 PDF s.8 | cilt-2 PDF s.8: «Koza Hanı» / «KOZA HAN». Tarihte «Yeni Han», «Beylik Han», «Hân-ı Cedîd-i Âmire», «Simkeş Han», «Sırmakeş Han», «Eski Yeni Han» adlarıyla da anılmış. |
| İngilizce ad | Koza Han |  | E cilt-2 PDF s.8 | cilt-2 PDF s.8: «KOZA HAN» |
| Rol | akar |  | E cilt-2 PDF s.8 | cilt-2 PDF s.8: «Koza Han, Sultan II. Bayezid tarafından İstanbul’daki külliyesine gelir sağlamak amacıyla inşa ettirilmiştir.» |
| İlçe / mahalle | Koza Han, Çarşı ve Hanlar Bölgesi’nde, Orhan Camii ile Ulucami arasında konumlanmaktadır. |  | E cilt-2 PDF s.8 | «Koza Han, Çarşı ve Hanlar Bölgesi’nde, Orhan Camii ile Ulucami arasında konumlanmaktadır.» |
| İlçe / mahalle (2) | Şehreküstü Mahallesi, Uzunçarşı Caddesi, No. 59 |  | E cilt-1 PDF s.194 | «Şehreküstü Mahallesi, Uzunçarşı Caddesi, No. 59» |
| Yapım yılı (hicri ve miladi) | 1489 yılı mart ayında başlanan inşaat, 30 Eylül 1491 tarihinde tamamlanarak hizmete açılmıştır. |  | E cilt-2 PDF s.8 | «1489 yılı mart ayında başlanan inşaat, 30 Eylül 1491 tarihinde tamamlanarak hizmete açılmıştır.» |
| Yapım yılı (hicri ve miladi) (2) | 1491 yılı, Ekim ayında |  | E cilt-1 PDF s.194 | «1491 yılı, Ekim ayında» |
| Yaptıran / mimar | Sultan II. Bayezid / mimar Abdülûlâ bin Pulad Şah (bina emini Şücâ bin Karaca) |  | E cilt-2 PDF s.8 | cilt-2 PDF s.8: «Hanın mimarı Abdülûlâ bin Pulad Şah, bina emini Şücâ bin Karaca» |
| Bugünkü durum | ayakta, işlek ticaret yeri; üst kat ahşap revakı 1950’lerde onarılmış; avlu çay bahçesi |  | E cilt-2 PDF s.11 | cilt-2 PDF s.11: «Han’ın ahşap malzemeden inşa edilmiş üst kat revakı, 1950’li yıllarda Bursa Eski Eserleri Sevenler Kurumu tarafından onarılmış»; «Hanın avlusu çay bahçesi olarak kullanılmakta» |
| Envanter cilt ve sayfa | cilt-2, PDF s.8 |  | E cilt-2 PDF s.8 | Eser kaynak kaydı; basılı kitap sayfası kaynak olarak kullanılmadı. |
| Envanter cilt ve sayfa (2) | cilt-2, PDF s.9 |  | E cilt-2 PDF s.9 | Eser kaynak kaydı. |
| Envanter cilt ve sayfa (3) | cilt-2, PDF s.10 |  | E cilt-2 PDF s.10 | Eser kaynak kaydı. |
| Envanter cilt ve sayfa (4) | cilt-2, PDF s.11 |  | E cilt-2 PDF s.11 | Eser kaynak kaydı. |
| OSM way id / enlem, boylam | way 26470648 (dış halka); enlem 40.1844464, boylam 29.0632519 |  | W | URL: https://api.openstreetmap.org/api/0.6/relation/1018973.json; yer: OSM relation 1018973, members; alıntı: «"type":"way","ref":26470648,"role":"outer"»; erişim: 14 Ekim 2026. URL: https://nominatim.openstreetmap.org/search?q=Koza%20Han%20Bursa&format=jsonv2&addressdetails=1; yer: Nominatim: Koza Han, relation 1018973; alıntı: «"lat":"40.1844464","lon":"29.0632519"»; erişim: 14 Ekim 2026. TEK KAYNAK (OSM; API ve Nominatim aynı veri kökeni). Way, multipolygon relation 1018973 dış halkasıdır; avluyu dışarıda bırakan tam ayak izi için ilişki kullanılmalı. Koordinat, Nominatim tarafından döndürülen temsil noktasıdır; rölöve merkezi veya ölçülmüş yapı köşesi değildir. |
| Planda kuzey yönü |  |  |  | plan çiziminde kuzey nerede? (Ulucami planında aşağıdaydı) |
| Kıble yönü (derece, kuzeyden) |  |  |  | camilerde zorunlu; diğerlerinde boş bırak |
| Arazi eğimi |  |  |  | düz / eğimli (yön ve fark, m) |

## 1. Plan ve genel kütle
| Alan | Değer | Birim | Kaynak | Not / tipik |
|---|---|---|---|---|
| Plan | klasik Osmanlı han planı: avlu etrafında altlı üstlü odalar; doğu cephesine bitişik tek katlı ahır-depo ve ikinci avlu |  | E cilt-2 PDF s.9 | cilt-2 PDF s.9: «Han, klasik Osmanlı han planına uygun şekilde, bir avlu etrafında sıralanmış altlı üstlü odalar ile doğu cephesine bitişik bir ahır-depo bölümünden oluşmaktadır.» Avlunun şekli ve ölçüsü kitap metninde yok (plan görseli denetlenmeli). |
| Dış ölçü: doğu–batı × kuzey–güney | ≈ 59,7 × 51,7 (OSM ayak izi; yön ≈ 86°) | m | O way/1474611586 | OSM min. döndürülmüş dikdörtgen, alan ≈ 2982 m². Kitapta dış ölçü yok; plan (cilt-2 PDF s.12) okununca P ile değiştirilecek. W: iç avlu ≈ 46 × 38 m ile tutarlı. |
| Dış ölçü (2): kısa (kuzey/güney cephe) × uzun kenar | ≈ 63,7 × 72,2 | m | H (plan oranı × E avlu) | Demiralp 2021 planı (Canbakış PDF 45, `ref/plan/canbakis_pdf045_koza-han_plani_demiralp2021.png`) avlu 38 × 46 m ile ölçeklendi; dik hava fotoğrafı (`ref/foto/kozahan_arsiv_010_havadan_dik_tum_yapi.jpg`) ≈ 65 × 71,5 verir. OSM satırıyla çelişir; MODEL İÇİN BU SATIR SEÇİLDİ (64,0 × 72,0). Ayrıntı: koza-han_notlar.md §3. |
| Kanat derinliği (dış duvar → açık avlu) | ≈ 13,0 | m | H | Aynı plan; dört kenarda eşit. Revak 3,40 (föy N19), oda ≈ 5,6, duvarlar ≈ 1,4 + 1,0, ayak ≈ 1,6. |
| Kat sayısı | Üst katta ipek ticareti yapan işletmeler, alt katta ise çeşitli ürünlerin satışını gerçekleştiren esnaf yer almaktadır. |  | E cilt-2 PDF s.11 | «Üst katta ipek ticareti yapan işletmeler, alt katta ise çeşitli ürünlerin satışını gerçekleştiren esnaf yer almaktadır.» |
| Kat sayısı (2) | Tek katlı olan ahır yapısı |  | E cilt-2 PDF s.9 | «Tek katlı olan ahır yapısı» |
| Alt kat yüksekliği |  | m |  |  |
| Üst kat yüksekliği |  | m |  |  |
| Toplam yükseklik (saçak) |  | m |  |  |
| Arazi eğimi, kat farkı |  |  |  |  |

## 2. Avlu
| Alan | Değer | Birim | Kaynak | Not / tipik |
|---|---|---|---|---|
| Avlu ölçüsü (doğu–batı × kuzey–güney) | yaklaşık 46 × 38 (ana avlu; yönler belirtilmemiş) | m | W | URL: https://alanbaskanligi.bursa.bel.tr/koza-han-yeni-han-han-i-cedid-simkes-han-sirmakes-han-acem-han-beylik-han-yeni-kervansaray/; yer: Koza Han açıklaması; alıntı: «Yaklaşık olarak 46 x38 metre iç ölçülerinde»; erişim: 14 Ekim 2026. TEK KAYNAK. Yaklaşık ifadesi kaynaktan aynen alınmıştır. Ana han avlusudur; dosyada ahır/İç Koza avlusu için verilen E ölçülerinin yerine geçmez. Yönler kaynaktan doğrulanamadı. |
| Avlu ölçüsü (2) | yaklaşık 46 × 38 iç ölçü; revak ≈ 3,40 m | m | E (Alan Başkanlığı föyü N19, hanlar-bolgesi.pdf PDF 21) | «Yaklaşık olarak 46 x 38 metre iç ölçülerinde dikdörtgen bir avlunun çevresinde iki katlı olarak inşa edilen hanın üst katında 51, alt katında ise 50 oda bulunmakta, odalar her iki katta yaklaşık 3.40 metre genişliğindeki bir revağa açılmaktadır.» `ref/metin/alan_baskanligi.md` |
| Avlu ortasındaki yapı | mescit (köşk mescit, müstakil) |  | E cilt-2 PDF s.10 | cilt-2 PDF s.10: «Avlunun ortasında daha önce bazı Selçuklu kervansaraylarında gördüğümüz köşk mescit denilen müstakil bir mescit bulunmaktadır.» Yanındaki ahşap ikinci mescit günümüze ulaşmamıştır. |
| Avlu mescidi: ölçü, kat, kubbe Ø | Sekizgen planlı köşk mescit | m | E cilt-1 PDF s.195 | «Sekizgen planlı yapının bir yüzünde kapı, diğer yüzünde mukarnas kavsaralı alçı mihrap bulunmaktadır.» |
| Avlu mescidi: ölçü, kat, kubbe Ø (2) | 8 altıgen ayak; yuvarlak kemerler |  | E cilt-1 PDF s.195 | «Mescit kesme taşla inşa edilmiştir ve sekiz adet altıgen ayak üzerinde yükselen yuvarlak kemerlere oturmaktadır.» |
| Avlu mescidi: ölçü, kat, kubbe Ø (3) | on altıgen şadırvan |  | E cilt-1 PDF s.195 | Envanterin mescit altındaki on altıgen şadırvan anlatısı; tek yapı kapsamında işlenecek. |
| Avlu mescidi: ölçü, kat, kubbe Ø (4) | kurşun kaplı kubbe |  | E cilt-1 PDF s.195 | «Mescidin kubbesi kurşunla örtülüdür.» |
| Avlu mescidi: ölçü, kat, kubbe Ø (5) | kotlar 0,78 / 2,00 / 3,50 / 6,98; kubbe tepesi ≈ 9,6; gövde Ø 6,78 (dış), 5,46 (iç); ayak çemberi R ≈ 3,27; havuz Ø ≈ 5,65; merdiven 2,47 m geniş | m | P (Güler 2020, İstem 18/35, PDF 20–22) | Ölçek çubuklu ve kotlu rölöve çizimleri `ref/plan/guler2020_pdf020–022_*`; ölçüm koza-han_notlar.md §3. Çizimde ayaklar beşgen (envanter: altıgen). |
| Avlu zemini | çay bahçesi olarak kullanılıyor; zemin malzemesi belirtilmemiş |  | E cilt-2 PDF s.11 | cilt-2 PDF s.11: «Hanın avlusu çay bahçesi olarak kullanılmakta ve halk tarafından yoğun ilgi görmektedir.» |

## 3. Revak ve odalar
| Alan | Değer | Birim | Kaynak | Not / tipik |
|---|---|---|---|---|
| Alt kat revak: kenar başına kemer sayısı |  |  |  | dört kenar için ayrı yaz |
| Kemer tipi ve açıklık | sivri revak kemerleri; açıklık ölçüsü belirtilmemiş |  | F cilt-2 PDF s.10 (kitap fotoğrafı) | Kitap fotoğrafı; açıklık ölçüsü kitapta yok. |
| Ayak / sütun tipi, kalınlık |  | m |  |  |
| Alt kat oda / dükkân / depo sayısı |  |  |  | kenar başına |
| Üst kat oda sayısı |  |  |  | kenar başına |
| Üst kat galeri / korkuluk | ahşap üst kat revakı |  | E cilt-2 PDF s.11 | cilt-2 PDF s.11: «Han’ın ahşap malzemeden inşa edilmiş üst kat revakı» |
| Merdiven (konum, sayı) |  |  |  | cilt-2 PDF s.11: «üst katta altı adet tuvaletin bulunduğu kaydedilmektedir. Ancak bu tuvaletler günümüze ulaşmamıştır.» (H. 1040 / M. 1630 belgesi) Merdiven bilgisi yok. |
| Ahır / depo bölümü | Doğuda, hana bitişik ahır-depo ve ikinci avlu | m | E cilt-2 PDF s.9 | «Tek katlı olan ahır yapısı, han binasına doğudan bitişiktir.» |
| Ahır / depo bölümü (2) | 3,66 m doğu geçidi |  | E cilt-2 PDF s.9 | «Koza Hanı’nın doğu duvarından 3,66 m genişliğinde bir geçişle ahırların bulunduğu ikinci avluya ulaşılmaktadır.» |
| Ahır / depo bölümü (3) | 3 kapı: Koza Hanı, Orhan Camii ve çarşı |  | E cilt-2 PDF s.10 | «Ahırlardan üç farklı kapı ile sırasıyla Koza Hanı’na, Orhan Camii’ne ve çarşıya doğrudan çıkış sağlanmaktadır.» |
| Ahır / depo bölümü (4) | 22 × 30 m (yaklaşık; GEÇERLİ) |  | E cilt-2 PDF s.10 | «Ahırların avlusu kemerlerle çevrili, yaklaşık 22 x 30 m ölçülerinde dikdörtgen bir alandır.» 15 Ekim KARAR: 22×30 kullanılır (kitap s.10 + Bursa BB Hanlar Bölgesi PDF'i, bağımsız olmayabilir); plan s.12 ile teyit edilecek. Bu cümle de avluyu doğrudan tanımlıyor; 28×30 ile çelişki sürüyor. Yorum (iç temiz ölçü mü, duvar dahil mi) kanıtsız; plan ölçeğiyle teyit edilecek. |
| Ahır / depo bölümü (5) | 28 × 30 m (yaklaşık; elenen) |  | E cilt-2 PDF s.21 | 15 Ekim: elendi (22×30 iki kaynakta); plan teyidine kadar kullanılmaz. |
| Ahır / depo bölümü (7) | avlunun doğu cephesindeki kemerler sonradan örülerek duvarla kapatılmış |  | E cilt-2 PDF s.10 | «Ancak avlunun doğu cephesindeki kemerler sonradan örülerek duvarla kapatılmıştır.» (ekran görüntüsünden aktarıldı; PDF'ten teyit edilecek) |
| Ahır / depo bölümü (8) | 22 × 30 m; doğu duvarından 3,66 m açıklıkla geçilir (kemer/tonoz belirtilmemiş) |  | W | URL: https://alanbaskanligi.bursa.bel.tr/wp-content/uploads/hanlar-bolgesi.pdf; yer: PDF s.21; alıntı: «Yaklaşık olarak 22 x 30 metre boyutlarında» ve «Koza Han’ın doğu duvarından 3.66 m.’lik bir açıklıkla geçilmektedir.»; erişim: 15 Ekim 2026 (ChatGPT URL–alıntı denetimi). Kaynak kitapla aynı envanterden türemiş olabilir. |
| Ahır / depo bölümü (6) | 18 avlu payesi; ahırın tamamında 45 paye |  | E cilt-2 PDF s.10 | «Bu avlunun etrafı, çeşitli boyutlardaki on sekiz adet paye üzerine oturan kemerlerle kuşatılmıştır.» «Ahır mekânının tamamı kırk beş adet paye ile taşınmaktadır.» |

## 4. Giriş (portal)
| Alan | Değer | Birim | Kaynak | Not / tipik |
|---|---|---|---|---|
| Kapı sayısı ve cepheler |  | adet |  | kitapta yok (ana hanın kapısı/portalı) |
| Portal: genişlik × yükseklik × çıkıntı |  | m |  | kitapta yok (ana hanın kapısı/portalı) |
| Kemer tipi ve süs |  |  |  |  |
| Kapı kanadı ölçüsü |  | m |  |  |
| Kitabe yeri |  |  |  |  |

## 5. Örtü ve cephe
| Alan | Değer | Birim | Kaynak | Not / tipik |
|---|---|---|---|---|
| Örtü |  |  |  | tonoz / kubbe / ahşap kırma çatı |
| Çatı eğimi ve kaplaması |  |  |  | kiremit / kurşun |
| Üst kat dış pencere (adet, ölçü) | üst kattaki her oda için 2 adet dış pencere; ölçü boş | m | W | cephe başına URL: https://alanbaskanligi.bursa.bel.tr/koza-han-yeni-han-han-i-cedid-simkes-han-sirmakes-han-acem-han-beylik-han-yeni-kervansaray/; yer: Koza Han açıklaması; alıntı: «Üst katta her odanın dışa açılan ikişer penceresi bulunmaktadır.»; erişim: 14 Ekim 2026. TEK KAYNAK. Oda başına adet verilmiştir; cephe başına/toplam pencere sayısı hesaplanmadı. Birim sütunundaki mevcut m, boş kalan pencere ölçüsüne aittir. |
| Alt kat dış pencere / hava deliği |  |  |  |  |
| Cephe malzemesi | taş görünümlü ayaklar ve tuğla kemerler |  | F cilt-2 PDF s.10 (kitap fotoğrafı) | Kitap fotoğrafı; kesin taş cinsi kitapta yok. |
| Köşe payandası / kule |  |  |  | Kitapta yok. |
| Baca |  |  |  | Kitapta yok. |
| Ek bina / ikinci avlu | Doğuda ahır-depo ve ikinci avlu |  | E cilt-2 PDF s.9 | İç Koza Hanı alt birimi. |
| Ek bina / ikinci avlu (2) | 3,66 m ahır geçidi |  | E cilt-2 PDF s.9 | Ana portal ölçüsü değildir. |
| Ek bina / ikinci avlu (3) | Ahırın 3 çıkış kapısı |  | E cilt-2 PDF s.10 | Ana hanın kapı sayısı değildir. |

## STİL (bu eser için)

*Bu dosya Gemini kullanılmadan doğrudan kitap metninden dolduruldu (Claude). Palet “Gerçek renk” sütunu fotoğraf bakılmadan boş bırakıldı; vurgu satırları ÖNERİdir.* Genel kurallar `_ortak_stil.md` içinde. Burada sadece bu esere özel seçimler.

### Vurgu noktaları
Sayı sınırı yok; eserde kaç vurgu varsa hepsini yaz (tabloya istediğin kadar satır ekle). Her vurguya seviye ver: **1 = ana vurgu** (binayı ilk bakışta tanıtan, en abartılı), **2 = ikincil**, **3 = küçük**. Vurgusuz yerler sade kalır.

| # | Parça | Seviye (1 / 2 / 3) | Neden vurgulu? | Nasıl? (renk / form / çizgi) |
|---|---|---|---|---|
| 1 | Avlu köşk mescidi | 1 | Sekizgen, kurşun kubbeli köşk mescit (E cilt-1 s.195) | kurşun mavi-gri kubbe |
| 2 | Portal | 2 | VARSAYIM: tür varsayılanı | terakota bant, koyu kapı |

### Doku ve çizgi yerleri
Tuğla, taş derzi, kabartma, ince çizgi **her yere değil**, sadece yazdığın yerlere gelir.

| Parça | Ne eklenecek | Nasıl? (çizgi / kabartma / renk bandı) | Kaç yerde? |
|---|---|---|---|
| Portal |  |  |  |
| Avlu cephesi |  |  |  |

### Palet
`Stil rengi` boşsa tür paleti (`_ortak_stil.md`) kullanılır. Son sütundaki öneri başlangıçtır.

| Parça | Gerçek renk (kısa) | Stil rengi (hex) | Öneri |
|---|---|---|---|
| Dış duvar (taş) |  | #C39482 | pembe-kahve |
| Taş-tuğla almaşık bandı |  | #AD4327 | terakota (yalnız vurgu yerinde) |
| Çatı / kiremit |  | #C6755B | terakota |
| Revak kemer içleri |  | #A8AEC1 | koyu ton |
| Avlu zemini |  | #E9E3D3 | krem |
| Avlu mescit kubbesi |  | #A8AEC1 | lavanta-mavi |
| Pencere, kapı |  | #415072 | lacivert |

### Zemin ve çevre
| Alan | Değer | Birim | Kaynak | Not / tipik |
|---|---|---|---|---|
| Kaide (zemin) şekli |  |  |  | daire / eser ayak izi + pay |
| Çim lekesi |  |  |  | var / yok |
| Ağaç (adet, tür: servi, yuvarlak) |  |  |  | en fazla 6, süs |
| Çevre yapı (modele girecek mi?) |  |  |  | örn. avlu duvarı, hazire, çeşme |

## Parça adları (.glb)
Uygulamada vurgu ve kamera hedefi bu adlara bağlı. Standart adlar önerilir; eksik parçayı silebilir, ek parça ekleyebilirsin.

| Ad | İçerik | Hikâyede kullanım (kısa cümle, isteğe bağlı) |
|---|---|---|
| Govde_Dis | dış kütle |  |
| Avlu_Revak | revak ve galeri |  |
| Cati |  |  |
| Portal | giriş |  |
| Avlu_Mescit | varsa |  |
| Avlu_Zemin |  |  |
| Zemin |  |  |

## Claude için talimat
1. `akar-3d-model` skill'ini yükle; `eserler/_kutuphane/AKAR_3D_Yontem_Notlari.md` ve `veri/bursa/sablonlar/_ortak_stil.md` dosyalarını oku.
2. Bu dosyayı oku. Dolu alanlar kesin; boş alanlar için bu türün varsayılanını kullan ve her varsayımı `<eser>_notlar.md` içine `VARSAYIM:` satırı olarak yaz.
3. `build/build_v01.py` yaz: bütün ölçüler en üstte tek `P` sözlüğünde, bu dosyadaki adlarla. Önce kütle, sonra detay. Kütleden sonra DUR ve render göster.
4. Tur başına tek konu. Kütle kabul edilince dondur, sonra detay ve stil.
5. Stil bölümündeki vurgu ve doku yerleri dışında ekstra süs ekleme.
6. Kaynaklar çelişiyorsa yan yana göster ve sor.

## Kontrol (Claude doldurur, sen bakarsın)
- [ ] Toplam üçgen ≤ 30 000, draw call ≤ 50 (B kademesi hedefi ≤ 15 000)
- [ ] Açık kenar yok, backface (kırmızı) oranı 0, çakışma yok
- [ ] Kuzey ortografik + havadan + vurgu parçasına yakın render, referans fotoğrafla yan yana
- [ ] Ana vurgu (seviye 1) ilk bakışta okunuyor; ikincil vurgular onu bastırmıyor
- [ ] Notlara VARSAYIM listesi yazıldı
- [ ] `.glb` ≤ 1 MB
