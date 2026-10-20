# Orhan Gazi Türbesi v01: kontrol özeti (19 Ekim 2026)

Görseller ve raporlar `build/build_v01.py` (`OGT_ASAMA=C OGT_TESLIM=1`, Blender 5.2.2, Cycles CPU 24 örnek) ve `build/kontrol_v01.py C` ile üretildi. Kütle (onay A) ve detay (onay B) bu turda donduruldu. C turunda renk, kaide, çevre, figür, AO ve teslim eklendi. Kullanıcı açık kalan kararları bana bıraktı; kararlar aşağıda kanıtlarıyla yazılı.

## Fotoğrafla karşılaştırma
- **yan_yana_guney** (Levha 111, açı 1): Hol ve sundurma eksende. Çınar gövdesi kapının önünde, batı kolu sola eğik; fotoğrafla aynı düzen. İki yandaki şebekeli pencereler ve köşe pilastrları uyuyor. **Uymayan:** fotoğrafta sundurma saçağı daha geniş ve iki katlı; tabela, saksı ve çöp kutusu modelde yok; çınar kabuğu düz.
- **yan_yana_kuzeydogu** (Levha 120, açı 6): Kuzeydoğu manolyası önde, kuzey cephe sağa doğru uzaklaşıyor, önde çim şeridi var. **Uymayan:** fotoğrafta manolya tacı seyrek ve dallı, modelde kapalı oval kütle; yaprak dokusu bazı yüzlerde çizgi gibi uzuyor (ortak `agac_doku.py` eşlemesi).
- **yan_yana_havadan_kd** (arsiv_dis_guneybati_havadan; kuzeydoğudan): Sedir solda, manolya sağ önde, kasnak ve kubbe oranı tutuyor. **Uymayan:** çevredeki öteki ağaçlar (kestane, çam) ve anıt mezar parmaklığı modelde yok; çatı eteği dikişleri fotoğrafta eğrisel, modelde düz.
- **yan_yana_havadan_dogu** (arsiv_havadan_kuzey; doğudan): Doğu çim şeridi cephenin önünde, sedir solda, manolyalar sağda; fotoğrafla aynı düzen. **Uymayan:** fotoğraftaki ağaç örtüsü çok daha yoğun; kent ve dağ yok.
- **yan_yana_ust** (tepeden, 30 × 30 m): Döşeme, doğu çim şeridi ve kuzey çimi yerinde. **Uymayan:** fotoğrafta hol 1,4–1,75 m batıda görünüyor; bu, yükseklik farkından gelen görüntü kayması (aşağıda karar 2). Ağaç taçları fotoğrafta kadrajın çoğunu örtüyor.
- **havadan** (standart kamera: 1800 × 1600, yükseklik 32°, yatay 45°, ortografik, saydam). **sunum_gd** (güneydoğudan genel): fotoğrafı yok.

## Kararlar (kullanıcı kararı bana bıraktı, 19 Ekim 2026)
| # | Konu | Karar | Kanıt |
|---|---|---|---|
| 1 | Gövde | **16,80 × 16,80 kare kalır** (E) | Dört cephenin karşıdan fotoğrafında cephe / pencere eksen aralığı (2 × 4,15 m, P): K 17,6 · G 16,1 · D 16,9 · B 17,8 m. K–G ortalaması 17,35, D–B 16,85 (fark %3, gürültü içinde). Plan çiziminin %5'i ve tepeden fotoğrafın %12'si desteklenmiyor; plan çiziminin ölçek çubuğu da E'den %20 farklı. |
| 2 | Hol | **Eksende kalır** | Levha 111: pencere ortaları (x = 0) ile hol ortası arasındaki fark < 0,05 m. Tepeden fotoğraftaki batı kayması, 8 m'lik ana çatının görüntü merkezinin doğusunda kalmasından gelen yükseklik kayması. |
| 3 | Hol kapısı | **İçe açık kalır** | Levha 112'de iki kanat holün içinde. |
| 4 | Arsiv fotoğraflarının yönü | **İkisi de doğudan çekilmiş**; A/B'deki kuzeybatı ve kuzey çözümleri −90° döndürüldü | arsiv_havadan_kuzey önündeki çim ve beyaz levha tepeden fotoğrafta doğu şeridinde, önündeki kırmızı çatılı evler doğuda. arsiv_dis_guneybati'deki anıt mezar parmaklığı doğu cephesinin güney ucunda (anahtar plan açı 5, Levha 116). Kare gövde 90° simetrik olduğundan eski çözüm aynı piksel hatasını veriyordu (25 / 19 px); kütle ve detay ölçüleri etkilenmez. |
| 5 | Ağaçlar | Çınar hol ekseninde (0,10; −14,50); manolya kuzeydoğu (10,00; 13,00) ve kuzey (−1,50; 12,40); **sedir güneydoğu** (12,00; −11,00) | Talimattaki «batıda sedir» fotoğraflarla çelişiyor: sedir Levha 111'de sağ üstte, Levha 116'da sol üstte (doğu cephesinin güney ucu), iki arsiv fotoğrafında solda. Manolya: Levha 120 (önde), 121 (kuzey cephesi önü), 122 (kuzeybatıdan solda). |

## Hatalar ve denetim
| # | Bulgu | Dosya, konum | Durum |
|---|---|---|---|
| 1 | Köşe pilastrları, kaideleri ve başlıkları gövdeye 0,45–0,50 m gömülüyordu (`kontrol_hepsi` çakışması; AO'da pilastr yanında kararma riski) | `Pilastr_Silme` | **Düzeltildi**: her köşe L biçiminde iki ince kutu, en çok 2 mm gömülü, köşe noktası çakışmıyor. `yakin_kose.png` temiz. |
| 2 | Sundurmanın arka dikmeleri 0,12 kotunda havada başlıyordu | `Giris_Holu`, hol ön yüzü | **Düzeltildi**: dikmeler yere iniyor (`yakin_sundurma.png`). |
| 3 | Kapı kanatlarının alt köşelerinde ince koyu üçgen (kanat ile söve arasından niş dibi görünüyor) | `yakin_kapi_ic.png`, alt sol ve sağ (x≈315 / 685, y 900–1030) | B'den kalma, onaylı hâli; dokunulmadı. |
| 4 | Ağaç yaprak dokusu bazı düşey yüzlerde çizgi gibi uzuyor | `sunum_kd.png`, `yan_yana_kuzeydogu.png` | Ortak `_kutuphane/agac_doku.py` eşlemesi (u = (x + 0,6y) / 1,3); kütüphaneye dokunulmadı. |
| 5 | İki figür 372 üçgen (standart §4: 400–800) | `Olcek_Insan_02`, `Olcek_Insan_04` | `akar3d.insan()` yürüyen pozu böyle üretiyor; figürler yeniden çizilmedi. |

Bulunmayanlar: siyah kare, siyah şerit, kaçık kanat (`yakin_kapi_ic`, `yakin_kasnak`, `yakin_sundurma`, `yakin_kose`), aynı düzlemde binen yüz (zemin kotları 0 / 0,002 / 0,004 / 0,006), havada parça. `kontrol_rapor.json` → `kontrol_hepsi`: açık / manifold olmayan kenar yok, çakışma (≥ 0,3 m) yok, **arka yüz kırmızı oranı 8 yönde 0** (`kontrol_0…7.png`), **GECTI: true**.

## Bütçe ve GLB
- Üçgen **10 642** / 12 000: yapı 8 282, ağaç 664 (çınar 232, manolya 152 + 152, sedir 128), figür 1 696. Draw call **30** / 30.
- `export/orhan-gazi-turbesi_v01.glb` = 263 588 bayt (**0,26 MB**), `_sunum.glb` = 278 220 bayt (0,28 MB); ikisi de Draco ✔.
- **alphaMode** (GLB JSON'u açılarak doğrulandı, iki dosyada da): `Sebeke_Beyaz` = MASK, `Sebeke_Kapi` = MASK (alphaCutoff varsayılan 0,5).
- Orijin: ana GLB'de yapı merkezi (gövde karesinin ortası, z = 0). `_sunum.glb`'de **kaide merkezi**: yapı dışa aktarımda (−4,29; +1,56) kaydırıldı ve geri alındı; blend ve betik dünya koordinatları değişmedi.
- Kaide: daire, merkez (4,29; −1,56), en küçük çevreleyen çember R 17,78 + 3 m pay → **R 20,78 m**, kalınlık 0,6 m, üst pah 0,15 m. Döşeme ve çim kaide kenarından 1,5 m içeride kesildi. Çim oranı **%7,9** (sınır %25).

## B'de draw call için yapılan değişiklikler (C)
Ağaç ve figürle draw call 35'e çıkıyordu. Görünüşü az etkileyen dört değişiklikle 30'a indi: lünet camı paneli kaldırıldı (arkada koyu niş dibi aynı görünüyor), ahşap lento kanatla aynı malzeme, hol döşemesi cephe malzemesi, kilit taşı söve taşı malzemesi. Sedir tek malzemeli (gövdesiz, etekleri yere iniyor).

## Renk
`renkler.json`: bina geniş yüzeyleri Cephe_Krem #E9DFC6 (V 0,914), Silme_Beyaz #ECEAE4 (V 0,925), Kursun #C3C9CD (V 0,804); hepsi V ≥ 0,72 ✔. Cephe standarttaki «Krem sıva» #E8DFCB'den biraz daha sarı (S 0,125 → 0,150), B'deki #EADCB8'den daha az sarı. Sapmalar (cephe, beyaz şebeke, söve) `renkler.json`'da gerekçeleriyle yazılı. Zemin (§1), bitki (§3) ve figür (§4) renkleri standartta sabit; V kuralı onlara uygulanmaz.

## GLB nesne adları (`orhan-gazi-turbesi_v01.glb`, 16 düğüm)
Cati_Etek, Cevre_Agac_01, Cevre_Agac_02, Cevre_Agac_03, Cevre_Agac_04, Giris_Holu, Govde, Kapi, Kasnak, Kubbe, Olcek_Insan_01, Olcek_Insan_02, Olcek_Insan_03, Olcek_Insan_04, Pencereler, Pilastr_Silme. (Sunum GLB'sinde ek: Zemin_Cim, Zemin_Doseme, Zemin_Kaide.)

Plandaki (§5) bütün adlar var ✔. Alem `Kubbe`'nin içinde.

## Ölçü doğrulama
`olcu_dogrulama.json` → `P_karsilastirma_C`: 15 fotoğraf ölçüsünün hepsi `build_v01.py` P değerleriyle uyumlu (fark ≤ 1 cm). Kapı ölçüsü B'den kalma 1,60 / 3,55 değerinden P'deki 1,50 / 2,42 / 3,36'ya güncellendi. `kaynak_celiskileri`, `kamera_cozumleri` ve `cevre_C` C kararlarıyla güncellendi.

## Görsel listesi
- C: `havadan.png`, `sunum_guney`, `sunum_kd`, `sunum_havadan_kd`, `sunum_havadan_dogu`, `sunum_gd`, `yan_yana_*` (5), `yakin_*` (kapı içi, kasnak, sundurma, köşe), `kontrol_0…7.png` (arka yüz).
- A/B'den kalanlar (onaylı turların kaydı): `kutle_havadan`, `kutle_kuzey`, `ust_orto`, `plan_bindirme`, `guney_cephe`, `pencere_yakin`, `kose_yakin`, `kapi_yakin`, `hol_kapi`, `sundurma_yakin`, `kasnak_yakin`, `detay_havadan`. `kutle_havadan`, `kutle_kuzey` ve `detay_havadan` eski (kuzeybatı/kuzey) kamera çözümüyle alındı; görüntü simetri yüzünden aynı.
