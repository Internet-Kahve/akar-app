# Bursa Ulucami · model notları

*13 Ekim 2026. Kütle turundan önce hazırlandı. Kaynakta olmayan her değer "doğrulanmadı" diye işaretli.*

## 0. Klasör düzeni (13 Ekim; 15 Ekim'den beri model dosyaları `claude/` altında: claude/build, claude/blend, claude/export, claude/kontrol; ref-*, prompt/ ve eser.md bu dosyayla aynı seviyede)
```
ulu-cami/
  ulu-cami_notlar.md   bu dosya: ölçüler, kararlar, parça listesi
  build/               build_vNN.py (güncel olan üstte; eskiler build/_arsiv/)
  blend/               ulu-cami_vNN.blend (eskiler blend/_arsiv/)
  kontrol/vNN/         her turun render ve raporu (eskiler kontrol/_arsiv/)
  export/              uygulamaya giden .glb
  prompt/              Claude Code'a verilen tur prompt'ları
  ref-foto/            gerçek fotoğraflar
  ref-maket/           Miniatürk maketi
  ref-model/           3D model render'ları (kubbe yükseklikleri yanlış)
```
İl ortak referansları (plan, PDF, links.md): `veri/bursa/`.
Yeni tur: `build/build_vNN.py` → ESER = ulu-cami/, KONTROL = kontrol/vNN/, BLEND = blend/. Çalıştır: `blender -b --python eserler/ulu-cami/claude/build/build_vNN.py`.

## GEOMETRİ DONDURMA v01e2 (13 Ekim, Muhammed kabul etti)
Kütle `build/build_v01e2.py` + `blend/ulu-cami_v01e2.blend` ile donduruldu: plan, kotlar, kubbe profili ve merkezleri, çatı, minare kütlesi ve yerleri.
Bundan sonra yalnız ekleme (detay, renk) ve biçim değiştirmeyen kusur düzeltmesi yapılır.

## Kararlar (13 Ekim, Muhammed)
Bu bölüm aşağıdaki eski değerlerin önüne geçer (ör. §2'deki "70 × 56 / bölme 14 m" satırları). Uygulama: `build/build_v01e2.py` P tablosu.

| # | Karar | Değer | Dayanak |
|---|---|---|---|
| 1 | Plan dış ölçüsü | **68,7 × 55,0 m** (doğu–batı × kuzey–güney) | Ayverdi rölöve planı, ölçek çubuğu 24,55 px/m (yazı "68,85? × 55,25?"). 70 × 56 (OSM + envanter) bırakıldı |
| 2 | Kubbe merkezleri | Plandaki paye akslarının ortaları: doğu–batı 0 / ±12,85 / ±25,2 m; kuzey–güney ±6,4 / ±19,2 m | Ayverdi planı (paye aksları x ±6,5 / ±19,2, y 0 / ±12,8). Eşit 14 m bölme bırakıldı. Kasnak dış Ø 12,0, etek Ø 12,3 |
| 3 | Kubbe biçimi | v01e'de maketten ölçülen oranlar: A/C 0,243 / 0,264 / 0,311; A/B 1,31 / 1,03 / 0,98 (uç / ara / orta); yeni çapa ölçekli. Tepe kotları sabit 25,2 / 26,9 / 29,1 | Miniatürk maketi ölçümü. Hedef tablo (A/B ≈ 2, A/C ≈ 0,46) kullanılmadı |
| 4 | Minare gövde Ø | **4,3 m**, iki minarede aynı (doğu kaide kenarı × 0,75) | Plandaki daireler merdiven boşluğu (doğu Ø 2,45, batı Ø 2,05), gövde dışı planda yok. Maketten gelen 5,3 m bırakıldı |
| 5 | Minare yerleri | Doğu (kare kaide): tamamen kuzey cephenin önünde, cepheden 0,9 m açıkta, dış kenarı doğu duvarıyla hizalı. Batı (sekizgen kaide): kuzeybatı köşede, eksen batı duvarından 2,4 m içeride, cepheden 3,7 m önde; köşeden batıya ve kuzeye taşar | Ayverdi planı. Önceki "yan duvarla hizalı" (v01d) yerleşimi bırakıldı. Batıdaki merdiven geçidi henüz modellenmedi |
| 6 | Doğu kaide ölçüsü | **5,7 × 5,9 m** (doğu–batı × kuzey–güney) | Ayverdi planı. Maketten gelen 7,4 m bırakıldı. Batı kaide plandan: yüzden yüze 6,7 m |

## 1. Kaynaklar

| Kısa ad | Ne | Yer |
|---|---|---|
| ENV | Bursa Vakıf Eserleri Envanteri, Cilt 1, s. 38–50 | `veri/metin/bursa-envanteri-cilt-1.txt` (satır ~2455) |
| ÜRGEN | O. Ürgen, "Bursa Ulu Camii Mimari Özellikleri", HMKÜ Sanat Tarihi ödevi, 2019 | `veri/bursa/Bursa_Ulu_Cami_Mimari_Ozellikleri.pdf` |
| REF1 | Sade 3D model render'ları (plan üstten, cepheler). Kütle ve kubbe düzeni için iyi; kubbe yükseklikleri YANLIŞ (hepsi eşit) | `ulu-cami/ref-model/` |
| REF2 | Miniatürk maketi fotoğrafları. Renk, cephe silmeleri, minare, taç kapı | `ulu-cami/ref-maket/` |
| REF3 | Gerçek fotoğraflar (havadan + cephe). Kubbe yükseklik profili, renkler | `ulu-cami/ref-foto/` |
| OSM | Ayak izi ve yön | Alındı (Overpass, 13 Ekim): way 26434413, `building=mosque`, `building:part` YOK. Ayak izi 70,5 × 60,3 m, uzun eksen kuzeye göre +6,4° (doğuya doğru). Alan 4 245 m². **60 × 48 ile çelişiyor**, bkz. §2 |

Ölçü için en iyi iki fotoğraf: `ref-foto/unnamed.webp` (kuzey cephe, neredeyse karşıdan, iki minare) ve `ref-foto/509433933_...jpg` (havadan, 5×4 ızgara net).
REF1 bir 3D model render'ı; modelin kendisi (.skp/.dae/.obj) bulunabilirse en iyi ölçü şablonu o olur.

## 2. Ölçü tablosu

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

### Kubbe yükseklik profili (Muhammed + REF3)
- Doğu–batı yönündeki 5 sütun: **ortadaki en yüksek**, yanındakiler daha alçak, **uçtakiler en alçak**. Çap hep 11 m; fark kasnak (ve gerekirse kubbe yükselişi) ile verilir.
- Bu profil kuzeyden güneye 4 sıra boyunca tekrar eder.
- Sıralar arasında (ön–arka) yükseklik farkı var mı: **doğrulanmadı**. İlk sürümde 4 sıra aynı.
- REF1'deki eşit kubbeler bu yüzden referans alınmaz.

### Yükseklikler (v01d: Miniatürk maketi `ref-maket/Miniaturk_..._Mosque.jpeg`, cephe 70 m = 1500 px → 21,4 px/m; kamera ≈ 10° yukarıdan, derinlik düzeltmesi uygulandı; ±1 m; ref-foto ikinci kontrol)
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

### v01e: maket ölçümü (A/B/C) ve P tablosu özeti
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

### Ayverdi rölöve planı (`veri/bursa/ulu-cami_plan_ayverdi.png`, plan 687; kuzey aşağıda)
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

### v01e2: plana oturtulmuş kütle (build_v01e2.py, P tablosu)
- Dış ölçü 68,7 × 55,0 m (plan). Kubbe merkezleri paye akslarından: doğu–batı 0 / ±12,85 / ±25,2; kuzey–güney ±6,4 / ±19,2 (paye aksları x ±6,5 / ±19,2, y 0 / ±12,8; uç sütun merkezi duvar payesine göre, doğrulanmadı ±0,3 m).
- Kasnak dış Ø 12,0, etek Ø 12,3. Kubbe oranları v01e maket ölçümüyle (A/C 0,243 / 0,264 / 0,311; A/B 1,31 / 1,03 / 0,98). Tepe kotları sabit 25,2 / 26,9 / 29,1 →
  A 2,99 / 3,25 / 3,83 · B 2,27 / 3,16 / 3,91 · etek alt kenarı 22,2 / 23,65 / 25,3 · kasnak önünde çatı kotu 19,9 / 20,5 / 21,4 · oluk 19,0 / 19,8 / 21,0.
- Çatı: dış bölmelerle duvar arasında (kuzey–güney 2,3 m, doğu–batı 3,15 m) 65° bant + 30° kırma; sütun geçişi 0,24 m eğimli şerit. Kasnak tabanı çatı yüzünü birebir izler (5 cm gömülü).
- Minare gövde Ø 4,3 m (doğu kaide × 0,75; Muhammed kararı: plandaki daireler merdiven boşluğu, doğu Ø 2,45, batı Ø 2,05). Başlık/kuşak çapları buna ölçekli, kotlar sabit (tepe 60,9).
- Doğu kaide 5,7 × 5,9 m (plan), cepheden 0,9 m önde, dış kenar doğu duvarıyla hizalı. Batı kaide sekizgen, yüzden yüze 6,7 m (plan kuzey–güney), eksen batı duvarından 2,4 m içeride, cepheden 3,7 m önde.

## 3. Renk (v02 son palet; `A.palet({...})`, ardından `A.ao_vertex(samples=32)`)

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

## 4. Parça listesi (v02, `export/ulu-cami_v02.glb`)

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

### v02 detay ölçüleri (P tablosunda `D_` önekli)
- Niş 4,8 m geniş (maket 4,9–5,0), 1,4 → 15,8 m, sivri (R = 0,8 × genişlik), bölme başına 2. Niş derinliği Govde'ye dokunmadan, önüne eklenen 0,25 m kabukla verildi; dış yüz artık 69,2 × 55,5 m.
- Üst pencere 2,2 × 4,1 m (9,1–13,2), alt pencere 1,7 × 2,5 m (1,8–4,3): ölçüler maketten (yönergede 1,6 × 3,2 ve 1,3 × 1,9). Sayı 30 üst + 30 alt (envanter 32 + 26).
- Taç kapı: plandan 9,5 m geniş, 1,8 m çıkıntılı; 16,5 m yüksek; niş 4,2 m, tepe 12,0; kapı 2,8 × 4,5; merdiven 6 basamak, 16,1 m.
- Yan kapılar: doğu y = −5,2 (plan −5,5; nişe çarpmasın diye 0,3 m kaydırıldı), batı y = −4,68.

## 5. Tur planı (3 tur)

| Tur | Konu | Kabul |
|---|---|---|
| v01/v01b · Kütle | OSM ayak izi + fotoğraftan oran ölçümü → Govde, Cati, Kubbeler_19, Sadirvan_Kubbe, Alemler, Minare_1/2, Zemin | kontrol_hepsi GECTI, üçgen < 25k, kuzey ve havadan render'ı REF3 ile yan yana |
| v02 · Detay + renk + çıkış | Cephe nişleri ve pencereler, Tac_Kapi, yan kapılar, bant/silme, kasnak pencereleri, kubbe yivleri, minare detayları, son palet + AO, `export/ulu-cami_v02.glb` (geometri v01e2'de donduruldu) | GECTI, ≤ 30k üçgen, ≤ 1 MB |
| v03 · Renk + çıkış | palet, `ao_vertex`, `disa_aktar` → `export/ulu-cami_v03.glb`, ≤ 1 MB | dosya boyutu, Redmi testi |
