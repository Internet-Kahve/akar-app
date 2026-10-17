# Han (kervansaray) · eser şablonu

Hanlar ve kervansaraylar için. Han akar (gelir getiren) yapıdır.

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
| Plan |  |  |  | kare / dikdörtgen / çokgen; tek ya da çift avlulu |
| Dış ölçü: doğu–batı × kuzey–güney |  | m |  |  |
| Kat sayısı |  |  |  | 1 / 2 |
| Alt kat yüksekliği |  | m |  |  |
| Üst kat yüksekliği |  | m |  |  |
| Toplam yükseklik (saçak) |  | m |  |  |
| Arazi eğimi, kat farkı |  |  |  |  |

## 2. Avlu
| Alan | Değer | Birim | Kaynak | Not / tipik |
|---|---|---|---|---|
| Avlu ölçüsü (doğu–batı × kuzey–güney) |  | m |  |  |
| Avlu ortasındaki yapı |  |  |  | mescit (köşk) / şadırvan / havuz / yok |
| Avlu mescidi: ölçü, kat, kubbe Ø |  | m |  | varsa |
| Avlu zemini |  |  |  | taş / toprak / çimen |

## 3. Revak ve odalar
| Alan | Değer | Birim | Kaynak | Not / tipik |
|---|---|---|---|---|
| Alt kat revak: kenar başına kemer sayısı |  |  |  | dört kenar için ayrı yaz |
| Kemer tipi ve açıklık |  |  |  | sivri / yuvarlak / basık; m |
| Ayak / sütun tipi, kalınlık |  | m |  |  |
| Alt kat oda / dükkân / depo sayısı |  |  |  | kenar başına |
| Üst kat oda sayısı |  |  |  | kenar başına |
| Üst kat galeri / korkuluk |  |  |  | taş / ahşap, yükseklik |
| Merdiven (konum, sayı) |  |  |  |  |
| Ahır / depo bölümü |  |  |  | konum |

## 4. Giriş (portal)
| Alan | Değer | Birim | Kaynak | Not / tipik |
|---|---|---|---|---|
| Kapı sayısı ve cepheler |  |  |  |  |
| Portal: genişlik × yükseklik × çıkıntı |  | m |  |  |
| Kemer tipi ve süs |  |  |  |  |
| Kapı kanadı ölçüsü |  | m |  |  |
| Kitabe yeri |  |  |  |  |

## 5. Örtü ve cephe
| Alan | Değer | Birim | Kaynak | Not / tipik |
|---|---|---|---|---|
| Örtü |  |  |  | tonoz / kubbe / ahşap kırma çatı |
| Çatı eğimi ve kaplaması |  |  |  | kiremit / kurşun |
| Üst kat dış pencere (adet, ölçü) |  | m |  | cephe başına |
| Alt kat dış pencere / hava deliği |  |  |  |  |
| Cephe malzemesi |  |  |  | taş / tuğla / almaşık (hatıl) |
| Köşe payandası / kule |  |  |  |  |
| Baca |  |  |  | adet, konum |
| Ek bina / ikinci avlu |  |  |  |  |

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
| Portal |  |  |  |
| Avlu cephesi |  |  |  |

### Palet
`Stil rengi` boşsa tür paleti (`_ortak_stil.md`) kullanılır. Son sütundaki öneri başlangıçtır.

| Parça | Gerçek renk (kısa) | Stil rengi (hex) | Öneri |
|---|---|---|---|
| Dış duvar (taş) |  |  | pembe-kahve |
| Taş-tuğla almaşık bandı |  |  | terakota (yalnız vurgu yerinde) |
| Çatı / kiremit |  |  | terakota |
| Revak kemer içleri |  |  | koyu ton |
| Avlu zemini |  |  | krem |
| Avlu mescit kubbesi |  |  | lavanta-mavi |
| Pencere, kapı |  |  | lacivert |

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
