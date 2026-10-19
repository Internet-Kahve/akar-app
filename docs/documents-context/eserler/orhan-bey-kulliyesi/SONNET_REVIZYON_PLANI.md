# Orhan Bey Camii: Sonnet revizyon planı (v06)

19 Ekim 2026. Bu dosya Orhan Bey Camii revizyonu için **tek giriş noktasıdır**. Önce `../_GENEL_SAHNE_STANDARDI.md` dosyasını, sonra bunu oku. "KESİN" maddeler kaynakla doğrulanmıştır; uygulanmadan tur kapanmaz.

Hedef: `3d/build/build_v05.py`'den `build_v06.py` üretmek. Yapılacaklar:

1. Son cemaat yeri cephesini katmanlarıyla yeniden giydir: alt kesme taş, üst almaşık, kirpi saçak, kurslar.
2. Ana gövde duvar dokusunu ve saçaklarını düzelt.
3. Dört büyük kubbenin kasnak birleşimini yeniden kur: sekizgen kurşun etek ve kasnak üstü kirpi saçak; kasnak pencerelerini düzelt.
4. Caminin önündeki **şadırvanı** ekle (yeni).
5. Paleti, zemini, çevreyi ve figürleri genel standarda bağla.

Plan ve yükseklikler (v01 kütlesi: 25,7 × 33,5; kotlar Ayverdi yan cephesinden) **doğrudur ve korunur**. Bu tur kütleyi değil, cephe giydirmesini, kubbe–kasnak birleşimini ve çevreyi değiştirir.

---

## 0. Klasör haritası: neyi oku, neyi okuma

| Yol | Durum | Not |
|---|---|---|
| `SONNET_REVIZYON_PLANI.md` | **OKU (ana)** | Bu dosya |
| `../_GENEL_SAHNE_STANDARDI.md` | **OKU (ana)** | Zemin (dikdörtgen kaide), ışık, palet, figür, teslim |
| `orhan-bey-kulliyesi_notlar.md` | Destek | §1 kararlar, **§3 ölçü analizi** (cephe katmanları, kubbe ölçümü, şadırvan). Ek'teki eski değerlerin bir kısmı geçersiz |
| `eser.md` | Destek | Külliye kaydı; §4 cami satırları güncel |
| `ref/plan/yurt2024_pdf213_plan_ayverdi.png` | **KAYNAK (P)** | Plan, 47,4 px/m (200 dpi). Kuzey aşağıda |
| `ref/plan/yurt2024_pdf217_kesit_on-cephe1_ayverdi.png` | **KAYNAK (P/Y)** | Alt çizim: yan cephe, 33,2 px/m (yükseklik kaynağı). Üst çizim: kesit, çubuk hatalı, yalnız biçim |
| `ref/plan/yurt2024_pdf218_on-cephe2_kuzey_ayverdi.png` | KAYNAK (P) | Kuzey cephe; çubuk %4,7 hatalı → plan genişliğiyle ölçekle |
| `ref/plan/yurt2024_pdf214_plan_acar.png`, `budak2018_pdf009_plan_gabriel.png`, `vakif_1983_pdf085_plan.png` | Destek | Plan karşılaştırması |
| `ref/plan/okuma_*` | Destek | Önceki 1 m ızgaralı okumalar |
| `ref/foto/ts_17ekim_2_kuzeybati_revak.webp`, `ts_17ekim_b_11`, `b_13`, `yurt2024_pdf277_*`, `pdf281_*` | **KAYNAK (F)** | Son cemaat yeri cephe katmanları, kirpi saçak, kurslar |
| `ref/foto/ts_17ekim_5_ikiz_kemer.webp`, `envanter_c1_pdf098_*`, `yurt2024_pdf278_*` | **KAYNAK (F)** | Yan cephe ikiz kemer, sütun başlığı, alınlık motifi |
| `ref/foto/ts_17ekim_6_tepeden.webp`, `ts_17ekim_b_19.webp`, `ts_17ekim_c_22_kubbe_etegi.webp`, `yurt2024_pdf289_*` | **KAYNAK (F)** | Kubbe–kasnak birleşimi, sekizgen etek, kasnak pencereleri |
| `ref/foto/IMG_8460-min-scaled.jpg`, `IMG_8484-min-scaled.jpg`, `ts_17ekim_b_20.webp`, `yurt2024_pdf285_*` | **KAYNAK (F)** | Ana gövde duvar örgüsü (2020–23 sonrası) |
| `ref/foto/sadirvan_kirpim_ts17ekim3.jpg`, `ts_17ekim_3_havadan_kuzey.webp`, `ts_17ekim_4_revak_ici.webp`, `envanter_c1_pdf096_*`, `envanter_c1_pdf097_*` | **KAYNAK (F)** | Şadırvan |
| `ref/foto/1578396*.jpg`, `Gazi-Orhan-Bey-Camii.jpg`, `ts_17ekim_1_*`, `b_15`, `b_16`, `685e97c900d68.webp` vb. | **KULLANMA (biçim)** | 2019 öncesi sarı sıvalı kasnaklar ve eski hâl; yalnız tarih için |
| `ref/foto/envanter_c1_pdf099_cesme_dogu_cephe.png` | Destek | Doğudaki çinili çeşme **modele girmez** |
| `ref/maket/yandex_3d_*` | **KULLANMA (ölçü)** | Yalnız biçim |
| `ref/metin/*.md` | KAYNAK | Metin çıkarımları (Vakıf 1983 OCR hatalı) |
| `3d/build/build_v05.py` | **KOD TEMELİ** | Kopyala → `build_v06.py` |
| `3d/build/doku/doku_uret.py` | Kod | Dokular yeniden üretilecek (§5) |
| `3d/build/araclar/yan_yana.py` | Araç | Ayverdi çizimiyle bindirme; `python yan_yana.py v06` |

Eksenler: +X doğu, +Y kuzey, +Z yukarı; orijin ayak izi kutusunun ortası. Plan okuması: X = 12,85 − u, Y = 16,75 − v (u doğu kenarından batıya, v kuzey kenarından güneye).

---

## 1. KESİN: son cemaat yeri cephesi (katmanlı)

Dayanak: W Yurt 2024 PDF 72 «Son cemaat yeri duvar örgüsü ise diğer cephelerden farklı olarak **üst bölüm bir sıra kesme taş, üç sıra tuğla** almaşık teknikte»; E Vakıf 1983 PDF 84 «**iki sıra kirpi dizili saçak** silmeleri», «Tuğla güneş kursları»; E C1 PDF 98 «köşelere yerleştirilen kurslar»; F `ts_17ekim_2_kuzeybati_revak`, `yurt2024_pdf277` (Levha 40–41), `pdf281` (Levha 46).

Kuzey, doğu ve batı yüzlerinde aşağıdan yukarıya:

| Katman | Kot (m) | Malzeme ve biçim | Kaynak |
|---|---|---|---|
| Sofa kaidesi | 0 → 0,9 | düz açık taş `#D3BE98`; yan gözlerde demir parmaklık (`#36413F`, 0,9 m) | E PDF 98; F |
| Ayaklar ve köşe payeleri | 0,9 → üzengi 4,5 (taç göz 4,9) | **iri kesme taş**, tuğla sırası YOK. Blok ≈ 0,9 × 0,45, ince açık derz. Ayak üstünde 0,15 m taş başlık silmesi. Köşe payeleri saçağa kadar kesme taş köşe blokları (dişli, sırayla uzun–kısa) | F `ts_17ekim_2`, `b_11`, `b_13` |
| Kemerler | üzengi → tepe | Tek merkezli sivri (Yurt PDF 70). Kemer taşları: 1 açık taş dilimi + 2–3 tuğla dilimi sırayla (radyal), dışında 0,35 m tuğla bandı. Orta (taç) gözün kemeri tuğla zikzaklı (Vakıf PDF 84) | F; E |
| Üst duvar | üzengi → saçak altı (≈ 9,0) | **1 sıra kesme taş (0,30) + 3 sıra tuğla (3 × 0,07 = 0,21)**, periyot 0,51 m; taş sırasında 0,6–0,9 m aralıkla dikey tuğla | W Yurt PDF 72; F |
| Kurslar | köşelerde ≈ 7,6; kemer aralarında ≈ 7,2 | Köşe kursları Ø 1,2, kemer arası (4 ayak üstü) Ø 0,8; 0,03 m kabartma; radyal tuğla–taş rozet dokusu (`kurs.png`) | E; F `yurt2024_pdf281` |
| Kirpi saçak | 9,0 → 9,4 | **2 sıra testere dişi tuğla**: iki basamaklı bant (alt 0,2 yüksek / 0,08 taşma, üst 0,2 / 0,16 taşma), ön ve alt yüzünde dişli tuğla dokusu (`kirpi.png`); altında 0,08 m taş silme | E Vakıf PDF 84; F Levha 41 |

- Mevcut `Revak_Kemerler`, `Revak_Cephe`, `Cami_SonCemaat` ayrı malzeme bölgelerine ayrılır: `Tas_Kesme`, `Almasik_Revak`, `Tugla`, `Kirpi`. UV'ler doku ölçeğine göre (1 periyot = 0,51 m).
- Revak içi (tonoz ve kemer içleri) açık sıva `#E8DFCB`; arka duvar almaşık (F `ts_17ekim_4`).
- 1381 tamir yazısı (Budak PDF 4) modellenmez.

### 1.1 Yan cepheler (doğu ve batı): ikiz kemer
- Mevcut ikiz kemer geometrisi korunur (sütun Ø 0,36, devşirme kompozit başlık beyaz mermer `#ECEAE4`).
- İkiz kemerlerin üstündeki **alınlık** (hafifletme kemeri içinde kalan yarım daire alan): doğuda iki renkli **baklava**, batıda **dama** deseni; doku `alinlik_baklava.png`, `alinlik_dama.png`, renkler tuğla `#C0683F` + mermer `#ECEAE4` (E PDF 100; Vakıf PDF 84; F `ts_17ekim_5`, `envanter_c1_pdf098`). Alınlık ayrı nesne (`Revak_Alinlik`), gerekirse kapatılabilsin.

---

## 2. KESİN: ana gövde duvarları ve saçaklar

| Konu | v05 | **v06** | Kaynak |
|---|---|---|---|
| Duvar dokusu | `almasik.png` 2,0 × 0,8 ızgara, `#E2B7A4` | **Hücre örgü:** moloz/kaba yontu taş sırası 0,35 m + **2 sıra yatay tuğla** (0,14); taşlar arasında 0,5–0,9 m aralıkla **dikey tuğla**; taş tonları küfeki üçlüsü, tuğla üçlüsü, harç `#E9DFCB`; periyot 0,49 m. Ortalama ≈ `#CFA986` | E C1 PDF 98; E Vakıf PDF 84 «iki sıra tuğla, bir sıra kesme taş»; F `IMG_8460`, `ts_17ekim_b_20` |
| Saçak (kanat 7,6; harim/mihrap bloğu 10,2; koridor) | `Sacak` tek tuğla bandı 0,35 | §1'deki **2 sıra kirpi saçak** bütün saçaklarda | E C1 PDF 100 «kirpi saçağa kadar»; F `yurt2024_pdf289` (Levha 62) |
| Sağır sivri kemerli silmeler | var | **korunur**; kemer bandı taş–tuğla almaşık dokusu (§1 kemerleri gibi) | E PDF 100 |
| Köşe kursları | yok | Her cephenin üst köşelerinde Ø 0,9 tuğla kurs (kabartma 0,03) | E C1 PDF 98 «köşelere yerleştirilen kurslar»; F `yurt2024_pdf289` |
| Doğu baklava / batı dama (ana gövde) | yok | **eklenmez** (v02 kararı korunur; yalnız revak alınlıklarında, §1.1) | — |
| Kaide bandı | 0,8 m taş | korunur, renk `#D3BE98` | Y |

---

## 3. KESİN: dört büyük kubbe ve kasnak birleşimi

Kubbeler: `Kubbe_Ana` (harim/sofa), `Kubbe_Mihrap`, `Kubbe_Tabhane_B`, `Kubbe_Tabhane_D`.

### 3.1 Biçim (hepsinde aynı kurgu)
Aşağıdan yukarıya (F `ts_17ekim_6_tepeden`, `ts_17ekim_b_19`, `ts_17ekim_c_22`; P/Y Ayverdi):
1. **Sekizgen kasnak** (mevcut genişlik ve kotlar korunur). Kasnak dokusu: kesme taş blokları (0,6 × 0,35) **2 sıra yatay + 1 sıra dikey tuğla ile kasetli** (W Yurt PDF 72). Ayrı doku `kasnak.png`.
2. **Kasnak üstü kirpi saçak**: §1'deki 2 sıra kirpi bandı, kasnak yüzlerinden 0,12–0,16 m taşar. (v05'te kaldırılan "kahverengi çıkıntı" kirpi saçaktır; fotoğraflarda var.)
3. **Sekizgen kurşun etek**: **8 düz trapez yüz**, daire değil. Etek dudağı kasnak yüzlerinin **0,45 m** dışında, kalınlık 0,10, kot = kasnak üstü. Yüzler **≈ 22°** eğimle içe ve yukarı çıkar, kubbenin oturma dairesinde biter. İçbükey eğri yok.
4. **Kubbe**: oturma dairesi Ø = **0,82 × kasnak genişliği** (F: harim ≈ 8,6 / 10,2 ölçüldü; tabhane ≈ 5,3 / 6,2). Kubbe oturma dairesinden **Ayverdi tepe kotuna** çıkan **basık küre kesiti**; yükseklik/yarıçap oranı kotlardan hesaplanır. Kurşun dilim sayısı korunur (24), ek çizgisi `#98A1A8`. Alem korunur.

### 3.2 Değerler

| Kubbe | Kasnak gen. (P) | Kasnak üstü (Y) | Etek dudağı (yüzden yüze) | Oturma dairesi Ø | Tepe (Y) | Not |
|---|---|---|---|---|---|---|
| Harim (sofa) | 10,2 | 13,5 | 11,1 | 8,4 | **16,5** | Kontrol: oran ≈ 0,55–0,65 |
| Mihrap | 10,4 | 12,7 | 11,3 | 8,5 | **14,4** | W Yurt PDF 72: harimdekinden «daha geniş ve alçak». Oran düşük çıkarsa (< 0,35) Ayverdi yan cephesiyle bindirip yaz, kotları değiştirme, bana sor |
| Tabhane B / D | 6,2 | 9,1 | 7,1 | 5,1 | **10,5** | Tabhane mekânı dikdörtgen (E PDF 101: 6,05 × 9,10); tepeden görülen K–G uzun sekizgen çizgi kanat çatısıdır, mevcut `Cati_Kanatlar` korunur |

Doğrulama: yeni profilleri `build/araclar/yan_yana.py v06` ile Ayverdi yan cephesine (PDF 217 alt) ve ön cephesine (PDF 218) bindir. Kasnak üstü, etek ve tepe kotları **±0,3 m**. Sapma büyükse kotları değil eteği ayarla ve yaz.

### 3.3 Kasnak pencereleri

| Kasnak | v05 | **v06** | Kaynak |
|---|---|---|---|
| Harim | 7 (kuzey sağır) | **7, GÜNEY yüzü sağır** | W Yurt PDF 71 «yedi adet pencere bulunmaktadır ve bunlardan güneydeki sağırdır»; F `ts_17ekim_c_22` (kuzeybatıdan kuzey yüzünde pencere görünüyor) |
| Tabhane batı | 3 | **2: güney + batı** | W Yurt PDF 71 «biri güney yönünde diğeri batı yönünde toplam iki» |
| Tabhane doğu | 3 | **2: güney + doğu** | Simetri (Yurt PDF 71 «aynı plan şeması») |
| Mihrap | 3 (G, D, B) | **3 kalır**; kaynaklar çelişiyor (E PDF 102 «üç», Yurt PDF 72 «dört», Vakıf PDF 84 «yedi»). `ts_17ekim_b_19`, `b_20` ve `yurt2024_pdf289` fotoğraflarında görünen yüzlerdeki pencereleri say, sonucu tabloyla bana bildir; değiştirmeden önce sor | E |

---

## 4. KESİN: şadırvan (yeni, `Sadirvan`)

Dayanak: E C1 PDF 103 «Caminin avlusunda yer alan şadırvan, 2020-2023 yıllarında yapılan restorasyon çalışmaları kapsamında, ahşap çatısı ve bezemeli kubbesiyle özgün haline kavuşturulmuştur»; W Yurt PDF 70 «kuzey yönünde sekizgen planlı bir şadırvan», PDF 72 «Mermer platform üzerinde olan şadırvanın kubbesi ... geniş bir saçakla örtülmüştür»; W Budak 2018 (arşiv planında sekizgen şadırvan); F `sadirvan_kirpim_ts17ekim3.jpg`, `ts_17ekim_3_havadan_kuzey`, `ts_17ekim_4_revak_ici`, `ts_17ekim_6_tepeden`, `envanter_c1_pdf096`.

Ölçü veren rölöve yok; değerler F (fotoğraf oranı) ve T. Fotoğrafla yan yana karşılaştırıp oranı düzelt, değerleri yaz.

| Parça | Değer | Kaynak |
|---|---|---|
| Konum | X = 0 (cami ekseni), merkez son cemaat yeri ön yüzünden **8,5 m** kuzeyde (Y ≈ 25,25) | F tepeden |
| Platform | beyaz mermer `#ECEAE4`, düzgün sekizgen, yüzden yüze 8,0; iki basamak (0,15 + 0,15) | F; T |
| Direkler | 8 adet, sekizgenin köşelerinde (çevre yarıçapı 3,2), kesit 0,28 × 0,28, kot 0,30 → 3,55; koyu kızıl kahve ahşap `#7A5134`; altta 0,3 m mermer kaide | F (Yurt PDF 72'deki «çokgen taş ayaklar» 2020–23 öncesine ait; bugün ahşap direk) |
| Kemerler | Direkler arasında 8 ahşap kaş kemer (üzengi 2,6, tepe 3,25), 0,10 m kalın, oymalı kenar dokusu; üstte 0,3 m ahşap friz (3,25 → 3,55) | F `ts_17ekim_4`, kırpım |
| Saçak | Geniş **sekizgen** kurşun saçak, düz yüzlü; dudak yüzden yüze **9,4**, kot 3,65, kalınlık 0,12; ≈ 18° eğimle kasnağa çıkar | F tepeden (≈ 9–10 m), kırpım |
| Kasnak | Sekizgen, yüzden yüze 4,6, kot 4,5 → 5,3, açık sıva `#E8DFCB` | F |
| Kubbe | Oturma dairesi Ø 4,4, hafif kurşun etek (cami kubbeleriyle aynı mantık, dudak taşması 0,25), tepe **7,6**; 24 dilim; alem 1,0 `#C9A13B` | F; T |
| Havuz | Ortada beyaz mermer sekizgen hazne, yüzden yüze 2,6, yükseklik 0,9 (platformdan); kenarlarında 8 pirinç musluk; ortada Ø 0,35 sütun 1,6 m'ye, üstünde küçük fıskiye kâsesi | F kırpım |
| Abdest yeri | Platform kenarında 8 alçak mermer tabure (0,35) | F `ts_17ekim_4` |

- Üçgen bütçesi: şadırvan ≤ 4 000.
- Saçak ve kubbe malzemesi caminin kurşunu ile aynı (`#C3C9CD`, ek çizgisi `#98A1A8`).
- Caminin doğusundaki çinili çeşme (`envanter_c1_pdf099`) **modele girmez**.

---

## 5. KESİN: renk, doku ve zemin (genel standarda geçiş)

### 5.1 Renk tablosu

| Malzeme (v05 hex) | **v06 hex** | Not |
|---|---|---|
| Duvar `#E2B7A4` | hücre örgü dokusu, ortalama ≈ `#CFA986` | §2 |
| — (yeni) Tas_Kesme | `#D3BE98` / `#E2D1AF` / `#BFA982` | Revak ayakları, köşe payeleri, kaide |
| — (yeni) Almasik_Revak | 1 taş + 3 tuğla dokusu | §1 |
| — (yeni) Kasnak | kasetli kesme taş dokusu | §3.1 |
| Kubbe `#A8AEC1`, Cati `#B9C0CF`, Kulah `#A8AEC1` | kurşun **`#C3C9CD`**, ek çizgisi `#98A1A8` | `kubbe_dilim.png` yeniden üretilir |
| Minare `#C9785A` | tuğla `#CF7F55`, derz `#E9DFCB` | Gövde dokusu tuğla |
| Alem `#DCA320` | `#C9A13B` | |
| Tugla `#C6755B` | `#C0683F` / `#CF7F55` / `#A65535` | Kemer bantları, kirpi, kurslar |
| Tas `#F2F3E5` | `#D3BE98` (kaide, söve); şerefe ve sütun başlıkları mermer `#ECEAE4` | |
| Siva `#F4F1EA` | `#E8DFCB` | Revak içi, şadırvan kasnağı |
| Kapi `#6B4A3A` | `#7A5134` | Kapılar, şadırvan direkleri |
| Pencere `#1E1F21` | `#3E4A55` | Alt pencere camı; demir ızgara `#36413F` |
| Sebeke `#F0EEE8` | `#ECEAE4` | Alçı şebeke |
| Zemin_Cim `#A0B46C`, Zemin_Golge `#E29B87` | **sil** | Standart zemin |

Taş, tuğla, sıva roughness 0,70; kurşun 0,55; mermer 0,40. Geniş yüzeylerde V ≥ 0,72 kuralı (standart §3).

### 5.2 Zemin ve çevre
- **Dikdörtgen kaide** (standart §1): cami ve şadırvanı saran dikdörtgen, her yönde 8 m pay, köşelerde pah.
- Cami önü avlu: taş döşeme `#B3A590` (derz `#A69A86`); son cemaat yerinden şadırvana 4 m genişliğinde döşeme yol.
- Şadırvanın doğu ve batısında alçak bordürlü (`#D2C3A4`) çim parterler (`#9DB86A`), toplam yüzeyin ≤ %25'i (F `ts_17ekim_3`).
- Ağaçlar yalnız fotoğrafta olan yerlere, en çok 5 (her biri ≤ 300 üçgen, `Cevre_Agac_NN`): doğu cephesi önündeki büyük çınar (`IMG_8460`), avlunun doğu ve batısındaki çınarlar (`ts_17ekim_3`, `b_19`). Hangi fotoğrafa dayandığını yaz.
- Çevre binaları (eski belediye binası vb.) modele girmez.

### 5.3 İnsan figürleri
Ortak set: `eserler/_kutuphane/akar3d.py` içindeki `insan(...)` (Koza Han turunda onaylandı). **Yeniden çizme.** `Olcek` koleksiyonunda `Olcek_Insan_01…08`:
- şadırvanda 2 (taburede abdest pozu), 1 ayakta;
- son cemaat yerine yürüyen 2 (biri çocuk);
- revak sofasında 1 ayakta;
- avluda 2 yürüyen;
- en az 3'ü kadın siluetinde.

---

## 6. Ortak kurallar (Koza Han turundan çıkan dersler)

1. **Açıklıklar:** Kapı, pencere ya da kemer açtığın her yerde açıklık hacmiyle kesişen bütün nesneleri (pencere paneli, decal, silme, kirpi bandı) temizle. Açıklık içinde havada asılı parça kalmayacak. Kirpi saçak ve silmeler kemerlerin üstünden geçmeyecek.
2. **Şebeke ve korkuluk:** Demir parmaklıklar gerçek çubuk ya da alpha-cutout; tek yüze boyanmış çizgi kullanma.
3. **Yazılar:** Kitabe ya da tamir yazısı modellenmez; gerekiyorsa düz panel bırak.
4. **Fotoğraf yönü:** Hava fotoğrafını karşılaştırırken yönü bilinen öğeden çıkar (minare kuzeydoğuda, şadırvan kuzeyde); modeli döndürme.
5. **Geçici dosyalar** `3d/kontrol/_tmp/` içinde; tur bitince sil.

---

## 7. Teslim (v06)

1. `3d/build/build_v06.py`:
   - `build_v05.py`'den kopya; `SURUM = "v06"`, başlık yorumu ve P tablosu güncellenir, her yeni değerin yanında kaynak harfi.
   - Çıktılar: `3d/blend/orhan-bey-camii_v06.blend`, `3d/export/orhan-bey-camii_v06.glb` (kaidesiz), `3d/export/orhan-bey-camii_v06_sunum.glb` (kaideli), `3d/kontrol/v06/`.
   - Dokular `doku_uret.py` ile yeniden üretilir: `almasik.png`, `almasik_revak.png`, `tas_kesme.png`, `kasnak.png`, `kirpi.png`, `kurs.png`, `alinlik_baklava.png`, `alinlik_dama.png`, `kubbe_dilim.png`.
2. Bütçe: toplam ≤ 30 000 üçgen (cami ≤ 20 000, şadırvan ≤ 4 000, figür + ağaç ≤ 6 000). Draw call ≤ 60. GLB ≤ 1 MB.
3. **Onay adımları (beni beklemeden geçme):**
   - A. Cephe giydirmesi bittiğinde (§1–§2): `revak_cephe.png` (`ts_17ekim_2` açısı) ile yan yana, `revak_yakin.png` (kirpi saçak ve kurs yakın), `dogu_cephe.png` (`yurt2024_pdf289` açısı) → göster, onay bekle.
   - B. Kubbeler bittiğinde (§3): `kubbe_yakin.png` (`ts_17ekim_c_22` açısı) ve `ts_17ekim_b_19` açısı ile yan yana, `ust_orto.png` (`ts_17ekim_6` ile, fotoğraf yönü düzeltilmiş), `bindirme_bati_orto.png` ve `bindirme_kuzey_orto.png` (`yan_yana.py v06`), mihrap kasnağı pencere sayımı → göster, onay bekle.
   - C. Şadırvan bittiğinde (§4): `sadirvan.png` (`sadirvan_kirpim_ts17ekim3.jpg` açısı) ve `revak_ici.png` (`ts_17ekim_4` açısı) ile yan yana → göster, onay bekle.
   - D. Zemin, çevre, figürler: `havadan.png` (`ts_17ekim_3` açısı) ile yan yana → göster, onay bekle.
4. `3d/kontrol/v06/olcu_dogrulama.json`: revak katman kotları; kubbe başına kasnak üstü, etek dudağı genişliği, oturma dairesi, tepe ve yükseklik/yarıçap oranı; kasnak pencere sayıları; şadırvan ölçüleri ve konumu; figür boyları.
5. Genel standart §5'teki mesh, arka yüz ve renk denetimleri (`renkler.json`).
6. **Kapanış (kullanıcı v06'yı açıkça onayladıktan sonra):**
   - `3d/README.md`: sürüm geçmişine v06 satırı (uygulanan değerler, sapmalar ve nedenleri, üçgen); "Güncel sürüm" ve "Bilinen sorunlar" v06'ya göre.
   - v05'in blend, GLB ve `kontrol/v05/` dosyaları ile `build_v05.py` silinir (`doku/` ve `araclar/` kalır).
   - `orhan-bey-kulliyesi_notlar.md` §1: "v06" satırları "uygulandı" yapılır; mihrap pencere sayımı ve şadırvan ölçüleri kısa alt bölüm olarak eklenir.
   - `eser.md`: yalnız yeni kaynak ölçüsü varsa kaynak harfiyle işlenir.
   - Son adım: bu dosya silinir.
