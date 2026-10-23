# Cami (ve mescit) · eser şablonu

Cami ve mescitler için tek şablon. Mescit küçük bir camidir; olmayan bölümleri boş bırak.

*Doldurma kuralları:*

Her ölçünün **Kaynak** sütununa tek harf yaz:
`P` rölöve/ölçülü plan · `E` envanter kitabı · `W` güvenilir web/makale (URL Not'ta) · `O` OSM ayak izi · `M` maket · `F` fotoğraftan ölçüm · `H` hesap (kitaptaki iki değerden türetilmiş; formülü Not'a yaz, örn. dış ölçü = iç ölçü + 2×duvar) · `T` tahmin.
Öncelik: P > E > H > W > O > M > F > T. Kaynaklar 2 m'den fazla çelişirse hangisini seçtiğini Not'a yaz.
**Bir hücre = bir kaynak = bir sayfa.** Kaynak olarak kitap cildi ve PDF sayfası yaz (örn. `E cilt-2 s.72`); eser-turleri.csv kaynak değildir.
**Boş bırakılan alan** = Claude tür varsayılanını kullanır ve `VARSAYIM` diye notlara yazar. Bilmiyorsan boş bırak, uydurma değer yazma.

## 0. Kimlik

| Alan | Değer | Birim | Kaynak | Not / tipik |
|---|---|---|---|---|
| id (eser-turleri.csv) |  |  |  | bursa-NNN |
| Eser adı (temiz yazım) |  |  |  |  |
| İngilizce ad |  |  |  |  |
| Rol |  |  |  | hayrat (halka hizmet) / akar (gelir getiren) |
| İlçe / mahalle |  |  |  |  |
| Yapım yılı (hicri ve miladi) |  |  |  |  |
| Yaptıran / mimar |  |  |  |  |
| Bugünkü durum |  |  |  | ayakta / restore edildi / kısmen yıkık / yıkık |
| Envanter cilt ve sayfa |  |  |  | örn. cilt-1, s.37 |
| OSM way id / enlem, boylam |  |  |  |  |
| Planda kuzey yönü |  |  |  | plan çiziminde kuzey nerede? (Ulucami planında aşağıdaydı) |
| Kıble yönü (derece, kuzeyden) |  |  |  | camilerde zorunlu; diğerlerinde boş bırak |
| Arazi eğimi |  |  |  | düz / eğimli (yön ve fark, m) |

## 1. Plan ve genel kütle
| Alan | Değer | Birim | Kaynak | Not / tipik |
|---|---|---|---|---|
| Plan tipi |  |  |  | tek kubbeli / çok ayaklı (ulucami) / zaviyeli (ters T, Bursa tipi) / merkezi kubbeli / diğer |
| Dış ölçü: doğu–batı |  | m |  | plan yönüne göre |
| Dış ölçü: kuzey–güney |  | m |  |  |
| Duvar yüksekliği (saçak altı) |  | m |  | zeminden |
| Taban kotu / kaide yüksekliği |  | m |  |  |
| İbadet alanı |  | m² |  | envanterde yazar |
| Son cemaat yeri |  |  |  | var / yok; varsa bölüm 4 |
| Avlu |  |  |  | var / yok; ölçü |
| Şadırvan |  |  |  | avluda / içeride / yok |
| Kıble duvarı hangi cephe |  |  |  | örn. güney |

## 2. Kubbe, kasnak ve örtü
Her kubbe grubu için bir satır. Aynı biçimli kubbeler tek satır (adet ve dizilim).

| Grup | Adet | Dizilim | Merkez koordinatları (x, y; m) | Dış Ø (m) | Tepe kotu (m, alem hariç) | Geçiş (pandantif / tromp / Türk üçgeni) | Kaynak |
|---|---|---|---|---|---|---|---|
| Ana kubbe |  |  |  |  |  |  |  |
| Yarım kubbe |  |  |  |  |  |  |  |
| Köşe / küçük kubbe |  |  |  |  |  |  |  |
| Son cemaat kubbeleri |  |  |  |  |  |  |  |
| Açık (aydınlık fenerli) kubbe |  |  |  |  |  |  |  |

Kasnak (her kubbe grubu için):

| Grup | Şekil (silindir / çokgen, kenar sayısı) | Dış Ø (m) | Görünen yükseklik (m) | Pencere sayısı | Pencere ölçüsü (g × y, m) | Renk farkı var mı? |
|---|---|---|---|---|---|---|
| Ana kubbe |  |  |  |  |  |  |
| Yarım kubbe |  |  |  |  |  |  |
| Küçük kubbe |  |  |  |  |  |  |

| Alan | Değer | Birim | Kaynak | Not / tipik |
|---|---|---|---|---|
| Çatı tipi |  |  |  | kırma / düz / yalnız kubbe örtüsü |
| Çatı eğimi |  | derece |  |  |
| Saçak taşması |  | m |  |  |
| Kubbe ve çatı kaplaması |  |  |  | kurşun / kiremit / taş |
| Alem: biçim ve yükseklik |  | m |  | hilal / topuz |
| Kubbe yivi / kaburga |  |  |  | var / yok, sayı |

## 3. Cepheler
Her cephe için bir satır (plan yönüne göre kuzey, güney, doğu, batı).

| Cephe | Uzunluk (m) | Alt pencere (adet × g×y m) | Üst pencere (adet × g×y m) | Sağır kemer / niş (adet, g m) | Payanda (adet, çıkıntı m) | Kapı (adet, konum) |
|---|---|---|---|---|---|---|
| Kuzey |  |  |  |  |  |  |
| Güney (kıble) |  |  |  |  |  |  |
| Doğu |  |  |  |  |  |  |
| Batı |  |  |  |  |  |  |

| Alan | Değer | Birim | Kaynak | Not / tipik |
|---|---|---|---|---|
| Kemer tipi (pencere ve niş) |  |  |  | sivri / yuvarlak / basık |
| Taban bandı (yükseklik, çıkıntı) |  | m |  |  |
| Saçak altı silme (yükseklik, çıkıntı) |  | m |  |  |
| Söve |  |  |  | var / yok, genişlik, renk |
| Kitabe yeri |  |  |  | hangi kapının üstünde |
| Çini / kalemişi (dışta) |  |  |  | var / yok, nerede |

## 4. Giriş
| Alan | Değer | Birim | Kaynak | Not / tipik |
|---|---|---|---|---|
| Taç kapı: konum (cephe) |  |  |  |  |
| Taç kapı: genişlik × çıkıntı × yükseklik |  | m |  |  |
| Taç kapı: niş genişliği ve tepe kotu |  | m |  |  |
| Mukarnas / kavsara kademe sayısı |  |  |  | 0 = yok |
| Ana kapı kanadı ölçüsü |  | m |  |  |
| Basamak (sayı, genişlik, yükseklik) |  |  |  |  |
| Yan kapılar (konum, ölçü) |  |  |  |  |
| Revak / son cemaat yeri |  |  |  | sütun sayısı, kemer, kubbe sayısı, çatı |

## 5. Minare
Her minare için bir sütun. Tek minareliyse sadece Minare 1.

| Bölüm | Minare 1 | Minare 2 | Minare 3 |
|---|---|---|---|
| Konum (x, y; m) ve hangi köşe |  |  |  |
| Kaide: şekil (kare / çokgen), ölçü (m), yükseklik (m) |  |  |  |
| Kaide bandı / süs |  |  |  |
| Pabuç (geçiş) yüksekliği |  |  |  |
| Gövde: şekil (silindir / çokgen), Ø alt / üst (m) |  |  |  |
| Gövde malzemesi / rengi |  |  |  |
| Bilezik: adet ve kot (m) |  |  |  |
| Şerefe altı (mukarnas / kademe), yükseklik |  |  |  |
| Şerefe: sayı, Ø (m), kot (m) |  |  |  |
| Korkuluk: yükseklik (m), tür (taş / demir) |  |  |  |
| Petek: yükseklik (m) |  |  |  |
| Külah: biçim (konik / soğan), yükseklik (m) |  |  |  |
| Alem: yükseklik (m), biçim |  |  |  |
| Toplam yükseklik (m) |  |  |  |
| Merdiven geçidi / cepheye bağlantı |  |  |  |

## 6. İç mekân (modele girmez, hikâye ve metin için)
| Alan | Değer | Birim | Kaynak | Not / tipik |
|---|---|---|---|---|
| Paye (ayak) sayısı |  |  |  |  |
| Mihrap, minber özellikleri (kısa) |  |  |  | ör. ahşap minber |
| Müezzin mahfili / hünkâr mahfili |  |  |  | var / yok |
| Öne çıkan iç süsleme |  |  |  |  |

## STİL (bu eser için)

Genel kurallar `_ortak_stil.md` içinde. Burada sadece bu esere özel seçimler.

### Vurgu noktaları
Sayı sınırı yok; eserde kaç vurgu varsa hepsini yaz (tabloya istediğin kadar satır ekle). Her vurguya seviye ver: **1 = ana vurgu** (binayı ilk bakışta tanıtan, en abartılı), **2 = ikincil**, **3 = küçük**. Vurgusuz yerler sade kalır.

| # | Parça | Seviye (1 / 2 / 3) | Neden vurgulu? | Nasıl? (renk / form / çizgi) |
|---|---|---|---|---|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |

### Doku ve çizgi yerleri
Tuğla, taş derzi, kabartma, ince çizgi **her yere değil**, sadece yazdığın yerlere gelir.

| Parça | Ne eklenecek | Nasıl? (çizgi / kabartma / renk bandı) | Kaç yerde? |
|---|---|---|---|
| Minare gövdesi |  |  |  |
| Taban bandı |  |  |  |
| Taç kapı |  |  |  |

### Palet
`Stil rengi` boşsa tür paleti (`_ortak_stil.md`) kullanılır. Son sütundaki öneri başlangıçtır.

| Parça | Gerçek renk (kısa) | Stil rengi (hex) | Öneri |
|---|---|---|---|
| Duvar (taş) |  |  | krem / kum |
| Duvar nişi içi |  |  | duvardan bir ton koyu |
| Silme, söve, taç kapı |  |  | beyaz mermer |
| Kubbe |  |  | lavanta-mavi ailesi |
| Kasnak |  |  | istersen sıcak sarı (renk farkı) |
| Çatı |  |  | kurşun gri-mavi |
| Pencere |  |  | lacivert |
| Kapı kanadı |  |  | koyu kahve |
| Minare gövde |  |  | krem ya da tuğla |
| Minare külah |  |  | lavanta-mavi |
| Alem |  |  | altın |

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
| Govde | dikdörtgen kütle |  |
| Cati | çatı |  |
| Kubbeler | ana ve küçük kubbeler + kasnak |  |
| Kasnak_Pencereleri |  |  |
| Alemler |  |  |
| Cephe_Kuzey / _Guney / _Dogu / _Bati | nişler + pencereler |  |
| Mermer_Bant / Silme_Ust |  |  |
| Tac_Kapi |  |  |
| Kapi_* | yan kapılar |  |
| Minare_1 / Minare_2 |  |  |
| Zemin | kaide + çim |  |

## Claude için talimat
1. `akar-3d-model` skill'ini yükle; `eserler/_kutuphane/AKAR_3D_Yontem_Notlari.md` ve `veri/bursa/sablonlar/_ortak_stil.md` dosyalarını oku.
2. Bu dosyayı oku. Dolu alanlar kesin; boş alanlar için bu türün varsayılanını kullan ve her varsayımı `<eser>_notlar.md` içine `VARSAYIM:` satırı olarak yaz.
3. `build/build_v01.py` yaz: bütün ölçüler en üstte tek `P` sözlüğünde, bu dosyadaki adlarla. Önce kütle, sonra detay. Kütleden sonra DUR ve render göster.
4. Tur başına tek konu. Kütle kabul edilince dondur, sonra detay ve stil.
5. Stil bölümündeki vurgu ve doku yerleri dışında ekstra süs ekleme.
6. Kaynaklar çelişiyorsa yan yana göster ve sor.

## Kontrol (Claude doldurur, sen bakarsın)
- [ ] Uygulama GLB'si: toplam üçgen ≤ 40 000, draw call ≤ 60, dosya ≤ 1 MB (B kademesi hedefi ≤ 15 000; bütçe: `eserler/_kutuphane/AKAR_3D_Yontem_Notlari.md` §4)
- [ ] Açık kenar yok, backface (kırmızı) oranı 0, çakışma yok
- [ ] Kuzey ortografik + havadan + vurgu parçasına yakın render, referans fotoğrafla yan yana
- [ ] Ana vurgu (seviye 1) ilk bakışta okunuyor; ikincil vurgular onu bastırmıyor
- [ ] Notlara VARSAYIM listesi yazıldı
- [ ] `.glb` ≤ 1 MB
