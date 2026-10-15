# Claude Code · Ulucami v01e — son kütle turu (ayrıntılı)

akar-3d-model skill'ini yükle. Önce oku: `3d-eser/bursa/ulu-cami/ulu-cami_notlar.md`, `build_v01d.py`, `kontrol/v01d_yanyana_kuzey.png`, `kontrol/v01d_kubbe_yakin.png`.
Referans (oran ve biçim): `ref-mg2/Miniaturk_Bursa_Ulu_Cami_-_Bursa_Grand_Mosque.jpeg` (kuzey cephe, karşıdan). İkinci kontrol: `ref-img3/unnamed.webp`, `ref-img3/minare_konum.jpg` (varsa).

Amaç: silueti maketle örtüştürmek ve kütleyi DONDURMAK. Bu turdan sonra sadece detay (v02) gelecek.


## Yeni kaynak: ölçülü rölöve planı
`3d-eser/bursa/ref/ulu-cami_plan_ayverdi.png` (Ayverdi, Osmanlı Mimarisinin İlk Devri, plan 687; Ürgen PDF s.6). Kuzey AŞAĞIDA (taç kapı ve merdiven altta).
- Önce üzerindeki ölçü yazılarını oku (cm). Okunabilenleri notlara tablo olarak yaz: toplam dış ölçüler, iç açıklık, kubbe daire çapları (≈1071–1088 → iç Ø ≈ 10,7–10,9 m), paye ölçüleri, duvar kalınlığı.
- Dış ölçü 70 × 56'dan 2 m'den fazla farklı çıkarsa DUR ve sor; değilse planı değiştirme.
- MİNARE YERLEŞİMİ planla doğrulanır: doğudaki (planda sol alt) kare kaide tamamen kuzey cephenin önünde, dış kenarı doğu duvarıyla hizalı. Batıdaki (planda sağ alt) çokgen kaide kuzeybatı köşesinde çapraz duruyor, cepheye bir merdiven geçidiyle bağlı, köşeden kuzeye ve batıya taşıyor. Modeldeki konumları buna göre düzelt (bu madde "değişmeyenler"den istisna).
- Açık kubbe: planda havuzlu bölme orta sütun, kuzeyden 2. sıra. Doğru.

## Değişmeyenler (dokunma)
- Plan 70 × 56 m, 5 × 4 bölme × 14 m, orijin zemin ortası, kuzey −Y.
- Duvar kotu 17,3 m. Minare konumları, iki farklı kaide (bantlı batıda, sade doğuda), gövde çapları.
- Parça adları: Govde, Cati, Kubbeler_19, Sadirvan_Kubbe, Alemler, Minare_1, Minare_2, Zemin, Merkez.
- Renk paleti ve alem renkleri.
- Pencere, taç kapı, silme, kasnak penceresi YOK.

## 0. Önce düzen: PARAM tablosu
`build_v01e.py`'nin en üstüne tek bir `P = {...}` sözlüğü koy; aşağıdaki bütün sayılar oradan okunsun (kubbe profili noktaları, kasnak yükseklikleri, çatı kotları, saçak, minare kuşak ölçüleri). Sonraki düzeltmeler sadece bu sözlükten yapılacak.

## 1. Kubbe / kasnak oranı (en önemli)
v01d'de kasnak uzun, kubbe basık: kubbe yüksekliği ≈ görünen kasnak, kubbe/çap ≈ 0,34. Makette kubbe kasnağın yaklaşık 2 katı, kubbe/çap ≈ 0,46.

Önce maketten ölç (uç, ara, orta sütun ayrı) ve tabloya yaz:
- A = kubbe yüksekliği (etek alt kenarından tepeye, alem hariç)
- B = görünen kasnak (çatının kasnağa değdiği yerden etek alt kenarına)
- C = etek çapı
Hedef: A/B ≈ 1,8–2,2 ve A/C ≈ 0,44–0,48. Ölçümün bunlardan çok farklıysa ölçümü kullan ve yaz.

Başlangıç değerleri (ölçüm yoksa bunları kullan):

| Sütun | Çatı-kasnak birleşim kotu | Görünen kasnak B | Kubbe A | Tepe (alem hariç) |
|---|---|---|---|---|
| uç | 18,8 | 2,5 | 5,4 | 26,7 |
| ara | 19,0 | 2,8 | 5,8 | 27,6 |
| orta | 19,9 | 3,2 | 6,2 | 29,3 |

Kasnak: 16 kenar, dış R = 6,5 m (Ø 13). Kubbe: 24 segment.

## 2. Kubbe profili (G.lathe, kasnakla tek kapalı mesh)
Kubbe çan gibi: yukarıdan yuvarlak iner, altta kısa bir belden sonra dışa kıvrılan saçakla biter. Saçak kasnağın dışına taşar ve alt yüzü görünür.
Profil (r, z), z = kasnak üst kotundan yukarı, R = 6,5; orta sütun için A = 6,2 (diğerlerinde z'yi A/6,2 ile ölçekle, r aynı kalır):

```
(6.50, 0.00)   kasnak üst halkası (kasnakla ortak)
(7.20,-0.12)   saçak alt dış kenarı (0,7 m taşma, hafif aşağı)
(7.25, 0.10)   saçak dudağı
(6.90, 0.35)   saçak üstü, içe dönüş
(6.65, 0.70)   bel (en içte)
(6.70, 1.20)   gövdenin başladığı yer (bel sonrası hafif şişkinlik)
(6.40, 2.40)
(5.70, 3.60)
(4.50, 4.70)
(2.80, 5.60)
(1.20, 6.05)
(0.00, 6.20)   tepe (alem buraya 5 cm gömülü)
```
Kasnak 16 kenar, kubbe 24 segment: halkaları eşlemek için kasnağın üst halkasını 24 noktaya çıkar (16 köşenin arasına nokta ekle) ya da kasnağı da 24 kenar yap. Açık kenar ve iç içe yüz olmasın.
Kontrol: `v01e_kubbe_yakin.png`'de saçağın alt yüzü ve bel açıkça görünmeli.

## 3. Çatı
v01d'deki düz levha, dış kenardaki düşey alın (1,3–2,4 m) ve yüzeydeki tümsek/girinti artıkları KALKSIN. Çatıyı baştan, temiz kur:
- Her bölme: kasnağın dibindeki 24 kenarlı halkadan bölmenin 4 kenarına düzgün kırma (4 yüzlü eğim). Kasnak dışında kalan alan küçük (≈0,5 m), eğim burada kısa ama düzgün olsun.
- Bölmeler arası: komşu bölmelerin kırmaları oluk çizgisinde buluşur. Sütunlar arasındaki kot farkı (uç 18,8 → ara 19,0 → orta 19,9) oluk boyunca kısa eğimli geçişle çözülsün; düşey basamak olmasın.
- Dış kenar (en önemli görünüm farkı): duvar üst kotundan (17,3) dış bölmelerin oluk kotuna kadar eğimli kurşun bant. Eğim ≈ 55–65°. Duvarın 0,35 m dışına taşan, 0,15 m kalınlığında saçakla biter. Cepheden bakınca duvarın üstünde ≈1,5–2,5 m yüksekliğinde eğimli gri bir bant görünmeli (maketteki gibi). Köşelerde bant kırma olarak döner.
- Hepsi `Cati` nesnesi, kapalı mesh.

## 4. Minare şerefe kuşağı ve başlık
Gövde Ø = D (v01d'deki üst gövde, ≈5,2 m). Maketten kontrol et:
- Şerefe kotu toplam boyun ≈ %72–75'i.
- Şerefe altı kuşak (mukarnas yerine basit kütle): yükseklik ≈ 1,1 D; alttan üste D'den 1,3 D'ye genişleyen 3 kademe (her kademe biraz daha geniş, ters basamak).
- Şerefe korkuluğu: Ø ≈ 1,45 D, yükseklik 0,9 m, kuşağın üstünde.
- Şerefe üstü gövde: tuğla, Ø ≈ 0,9 D, yükseklik ≈ 1,4 D.
- Başlık (açık taş): ince halka → büyük soğan (Ø ≈ 0,8 D, h ≈ 1,0 D) → boyun (Ø ≈ 0,3 D) → küçük soğan (Ø ≈ 0,45 D, h ≈ 0,5 D) → ince uç + alem (aynı malzeme).
İki minare aynı üst biçimde; sadece kaideler farklı.

## 5. Kendi içinde karşılaştır, en fazla 2 kez düzelt
Render'ı aldıktan sonra maketle siluet karşılaştırması yap:
- Kuzeyden ortografik render, maket fotoğrafıyla AYNI ölçekte (cephe genişliği = aynı piksel) ve aynı taban çizgisinde.
- Yarı saydam üst üste bindirme görseli: `kontrol/v01e_overlay.png`.
- Kubbe tepeleri, kasnak alt kenarları, çatı bandı ve şerefe kotu ±0,5 m içinde değilse P tablosunu düzelt ve yeniden çalıştır. Bu tur içinde en fazla 2 kez; sonra olduğu gibi raporla.
(Maket kamerası ≈10° yukarıdan: üst kotlar fotoğrafta biraz basık görünür, bunu hesaba kat ve yaz.)

## Bitiş
- `kontrol_hepsi` → GECTI true, üçgen < 25 000.
- Görseller: `v01e_yanyana_kuzey.png`, `v01e_overlay.png`, `v01e_hava_kuzeybati.png`, `v01e_kubbe_yakin.png`, `v01e_minare_yakin.png`.
- Notlara: P tablosu özeti ve ölçtüğün A/B, A/C oranları.
- Rapor skill şablonuyla, kısa. Kabul edilirse notlara "GEOMETRİ DONDURMA v01e" yazacağız. DUR.
