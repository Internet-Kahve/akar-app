# Bedesten (kapalı çarşı) · eser şablonu

Bedestenler için (listede "Çarşı" olarak geçenler).

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

## 1. Plan ve kütle
| Alan | Değer | Birim | Kaynak | Not / tipik |
|---|---|---|---|---|
| Dış ölçü (doğu–batı × kuzey–güney) |  | m |  |  |
| Duvar yüksekliği |  | m |  |  |
| Toplam yükseklik (kubbe tepesi) |  | m |  |  |
| Duvar kalınlığı |  | m |  |  |

## 2. Kubbe ve ayaklar
| Alan | Değer | Birim | Kaynak | Not / tipik |
|---|---|---|---|---|
| Kubbe sayısı ve dizilim |  |  |  | örn. 2 × 6 |
| Kubbe Ø |  | m |  |  |
| Kubbe tepe kotu |  | m |  |  |
| Ayak sayısı ve boyutu |  |  |  |  |
| Kasnak / pencere |  |  |  |  |
| Kubbe kaplaması |  |  |  | kurşun |

## 3. Kapılar ve cephe
| Alan | Değer | Birim | Kaynak | Not / tipik |
|---|---|---|---|---|
| Kapı sayısı, yönleri |  |  |  |  |
| Kapı: genişlik × yükseklik |  | m |  |  |
| Dış pencere (adet, ölçü) |  |  |  |  |
| Cephe malzemesi |  |  |  |  |
| Bitişik dükkân / sokak |  |  |  |  |
| Bağlı olduğu vakıf |  |  |  | örn. gelir getirdiği cami |

## STİL (bu eser için)

Genel kurallar `_ortak_stil.md` içinde. Burada sadece bu esere özel seçimler.

### Vurgu noktaları
Sayı sınırı yok; eserde kaç vurgu varsa hepsini yaz (tabloya istediğin kadar satır ekle). Her vurguya seviye ver: **1 = ana vurgu** (binayı ilk bakışta tanıtan, en abartılı), **2 = ikincil**, **3 = küçük**. Vurgusuz yerler sade kalır.

| # | Parça | Seviye (1 / 2 / 3) | Neden vurgulu? | Nasıl? (renk / form / çizgi) |
|---|---|---|---|---|
| 1 |  |  |  |  |
| 2 |  |  |  |  |

### Doku ve çizgi yerleri
Tuğla, taş derzi, kabartma, ince çizgi **her yere değil**, sadece yazdığın yerlere gelir.

| Parça | Ne eklenecek | Nasıl? (çizgi / kabartma / renk bandı) | Kaç yerde? |
|---|---|---|---|
| Gövde üstü | tek yatay çizgi | çizgi | 1 |

### Palet
`Stil rengi` boşsa tür paleti (`_ortak_stil.md`) kullanılır. Son sütundaki öneri başlangıçtır.

| Parça | Gerçek renk (kısa) | Stil rengi (hex) | Öneri |
|---|---|---|---|
| Gövde |  |  | pembe-kahve |
| Kubbeler |  |  | kurşun mavi-gri |
| Kapılar |  |  | koyu kahve |

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
| Govde |  |  |
| Kubbeler |  |  |
| Kapilar |  |  |
| Zemin |  |  |

## Claude için talimat
1. `akar-3d-model` skill'ini yükle; `3d-eser/AKAR_3D_Yontem_Notlari.md` ve `3d-eser/bursa/sablonlar/_ortak_stil.md` dosyalarını oku.
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
