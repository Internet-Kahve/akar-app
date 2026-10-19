# Yıldırım Bayezid Bedesteni: Sonnet revizyon planı (v04)

18 Ekim 2026. Bu dosya Bedesten revizyonu için **tek giriş noktasıdır**. Önce `../_GENEL_SAHNE_STANDARDI.md` dosyasını, sonra bunu oku. "KESİN" maddeler kaynakla doğrulanmıştır; uygulanmadan tur kapanmaz.

Hedef: `3d/build/build_v03.py`'den `build_v04.py` üretmek. Yapılacaklar:

1. Açık sokağı ve ayrı halkayı kaldır. Gövdeye **bitişik** alçak mahzen + dükkân bandını kur (toplam **70,70 × 33,50**; 19 Ekim A incelemesi, aşağıda).
2. Dükkânları **56** modüle indir ve dört cepheye dağıt.
3. Dört girişi **kubbeli giriş mekânı** olarak yeniden kur.
4. Kubbe tepesini **+14,20**'ye çıkar.
5. Almaşık cepheyi, paleti, zemini ve figürleri genel standarda bağla.

### 19 Ekim A incelemesi (v04b, kullanıcı onayı)

A render'ları fotoğraflarla karşılaştırıldı; bant geniş, süslemeler fazla turuncu ve kalın bulundu. Uygulanan kararlar:

| Konu | Önce | Sonra | Kaynak |
|---|---|---|---|
| Toplam dış | 71,70 × 35,50 (W Ekinci) | **70,70 × 33,50** | P: Gabriel planı (K/G ≈ 7,4, D/B ≈ 5,4), Gabriel kesiti (K/G ≈ 7,7–8,0), Ayverdi 1966 (K/G ≈ 7,8, D/B ≈ 5,7). Ekinci 35,5 bandın dışındaki bir çizgiye ölçülmüş olabilir; çelişki açık |
| Bant derinliği | K/G 8,75, D/B 6,10 | **K/G 7,75, D/B 5,60** | H, yukarıdaki okumaların ortası |
| Bant çatı saçak taşması | 0,30 | **0,15** | T |
| Bant ve kubbe kurşunu | `#C3C9CD` | **`#AEB6BC`**, ek çizgisi `#8E979D` | F (2024: kubbeler koyu gri); standart §3 kurşun koyu tonu (V 0,74 ≥ 0,72). Gövde çatısı `#C3C9CD` kalır |
| Almaşık | 0,50 taş + 3 tuğla sırası | **Kutu almaşık**: taş ≈ 0,43 × 0,28, 2 tuğla sırası, taşlar arasında dikey tuğla; karo 1,04 × 0,88 | F: `ekinci2025_pdf084`, `685fff971922d` (2024). W Alkan «3 tuğla + 1 taş» ile çelişir; kullanıcı fotoğrafı seçti. Ortalama +%2,1 / +%1,4 / +%1,3 |
| Gövde saçağı | 0,35 tuğla şerit | **0,20 ince taş silme** | F |
| Gövde pencereleri | 0,9 × 1,4 dikdörtgen, 1,6'lık tuğla çerçeve + taş alınlık | **1,0 × 2,05 yuvarlak kemerli** (+5,55 → +7,60), tek sıra tuğla kemer 0,15, ince taş denizlik | P: Gabriel kesiti (alt 5,55, üst ≈ 7,6); F |
| Dükkân kemerleri | kalın tuğla U çerçeve, açıklık içi almaşık | **ince taş kemer (0,15)**, açıklık içi sade taş | F: 1960 güney cephe fotoğrafı |
| Bant saçak silmesi | 0,30 tuğla, girişte kesik | **0,20 taş**, kesintisiz | T |
| Dış kapı | üzengi 3,0, tepe 4,5; 0,5 tuğla–taş dönüşümlü kemer; çerçeve 5,2 (çatının üstüne taşıyordu) | **üzengi 2,2, tepe 3,7**; 0,30 sade kesme taş kemer; çerçeve 4,36, çatı ve silme üstünden kesintisiz geçer | T; F: `ekinci2025_pdf085_kitabe` (kapı üstü düz kesme taş) |
| Güney kitabesi | 2,4 × 0,6, z 5,15 | **0,70 × 0,28**, z 4,05 | F `pdf085` (bir taş sırası yüksekliğinde), T |
| Köşe kör bölüm | uzun 5,1, kısa 3,5 | **uzun 4,6, kısa 2,5** | H |

Ana gövde (59,5 × 18,0; saçak +10,0; 2 × 7 kubbe) **doğrudur ve korunur**.

---

## 0. Klasör haritası: neyi oku, neyi okuma

| Yol | Durum | Not |
|---|---|---|
| `SONNET_REVIZYON_PLANI.md` | **OKU (ana)** | Bu dosya |
| `../_GENEL_SAHNE_STANDARDI.md` | **OKU (ana)** | Zemin, ışık, palet, figür, teslim kuralları |
| `bedesten_notlar.md` | Destek | §1 güncel kararlar, §2 kaynaklar, **§3 ölçü analizi**, §4 önceki denetim. Sondaki "Ek: Geçmiş kayıt" değerleri **geçersiz** (yalnız Gabriel "Ölçü tablosu" başvuru değerinde). |
| `eser.md` | Destek | Kaynaklı ölçü tablosu |
| `ref/metin/ekinci2025.md` | **KAYNAK (W, ana)** | PDF 95–103: 71,70 × 35,5; 14,20 m; 56 dükkân / 32 mahzen; dükkân 4,20 × 2,30; kubbeli girişler; duvar örgüsü |
| `ref/metin/envanter_c2.md` | **KAYNAK (E)** | PDF 29: salon 15,00 × 56,50; 14 kubbe, 6 ayak; «Her bir kapı, kubbeyle örtülü bir giriş mekânına açılır» |
| `ref/plan/ekinci2025_pdf097_dort_plan_ozdes-gabriel-ayverdi-tayla.png` | **KAYNAK (P-oran)** | Dört plan. **Alt sol = Ayverdi 1966 (restorasyon sonrası, güncel durum)**: dükkân dağılımı buradan sayılır. |
| `ref/plan/gabriel_plan_1m_izgara.png`, `gabriel_kesit_1m_izgara.png` | KAYNAK (P, 1958 öncesi) | Gövde duvarı 1,50, saçak +10,0, pencere altı +5,55, mahzen derinliği 3,3. Bant yüksekliği (+8,5) ve kubbe tepesi bu çizimde **eski durumdur, kullanma**. |
| `ref/foto/ekinci2025_pdf084_havadan_2024.png` | **KAYNAK (F, güncel)** | 2024 hava fotoğrafı: bandın gövde pencerelerinin altında kaldığı; kubbe rengi |
| `ref/foto/envanter_c2_s28_tepeden.png`, `envanter_c2_s27_kuzeyden.png` | KAYNAK (F) | Tepeden oran; kuzey girişi |
| `ref/foto/ekinci2025_pdf098_duvar_dokusu.png`, `ekinci2025_pdf085_kitabe.png`, `envanter_c2_s29_carsi_sokagi.png` | KAYNAK (F) | Almaşık örgü; güney kapısı kûfi kitabesi; dükkân cephesi |
| `ref/foto/ekinci2025_pdf096_sadirvan.png`, `alan-baskanligi_*` | Destek | İç mekân (bu turda modellenmez) |
| `ref/foto/kullanici_*`, `yandex_*` | **KULLANMA (ölçü)** | Çevredeki modern metal çarşı örtüleri ve harita adları. Bedestenin parçası değil (§1.4) |
| `ref/foto/ekinci2025_pdf100_*`, `ekinci2025_pdf102_*`, `ekinci2025_pdf098_restorasyon_*` | Destek | 1958 yangını ve 1960 restorasyonu (tarihî bağlam) |
| `ref/kaynak_dizini.json` | Kayıt | Her dosyanın kaynağı, sayfası, SHA-256 değeri |
| `3d/build/build_v03.py` | **KOD TEMELİ** | Kopyala → `build_v04.py` |
| `3d/build/doku/doku_uret.py` | Kod | Dokular; renkleri §5'e göre değişir |
| `3d/README.md` | Destek | Sürüm geçmişi, bilinen sorunlar |

Eksenler: +X doğu, +Y kuzey, +Z yukarı; orijin salonun ortası. Model zemini düz (gerçekte arazi güneye ≈ 1,9 m yükselir; uygulanmaz).

---

## 1. KESİN: plan ve bitişik alçak bant

### 1.1 Ölçüler

| Değer | Model | Kaynak |
|---|---|---|
| Salon iç | 56,50 × 15,00 | E (C2 PDF 29) |
| Gövde dış (yüksek kütle) | **59,5 × 18,0** (BX 29,75 / BY 9,00) | H: E iç + P duvar 1,50; **v03 ile aynı** |
| Toplam dış (bant dahil) | **70,70 × 33,50** (OX 35,35 / OY 16,75); v04 A: 71,70 × 35,50 | P: Gabriel plan + kesit, Ayverdi 1966 (19 Ekim A incelemesi). W Ekinci PDF 95 «35,5 x 71,70» çelişki olarak not edildi |
| Bant derinliği K/G | **7,75** (mahzen ≈ 2,5 + ara duvar ≈ 0,9 + dükkân 4,2 + dış ayak) | P Gabriel planı ≈ 7,4, kesiti ≈ 7,7–8,0, Ayverdi ≈ 7,8; W dükkân 4,20 |
| Bant derinliği D/B | **5,60** | P Gabriel ≈ 5,4, Ayverdi ≈ 5,7 |
| Bant çatısı | **Tek yöne eğimli (dışa düşen) kurşun çatı**: gövde duvarına dayandığı üst kenar **+5,40**, dış saçak **+4,70**; köşelerde kırma (mahya köşegen). Dış saçak 0,15 taşar (v04b). Gövde pencerelerinin altı (+5,55) açıkta kalır | F: `envanter_c2_s27_kuzeyden` ve `ekinci2025_pdf084` (bant bölgesi eğimli örtülerle kaplı); kullanıcı kararı 19 Ekim (A onayı). Eğim değerleri T. Gabriel'in +8,5'i eski durum |
| Bant parapet / saçak | 0,20 yükseklikte taş silme, 0,06 taşma, kesintisiz (v04b) | T |

### 1.2 Kurulum

- `Ic_Bedesten_Sokagi`, ayrı dış halka (`Dukkanlar`'ın v03 hâli), `Gecitler` ve `Girisler` nesnelerini **sil**; `D_sokak_*`, `D_halka_*`, `D_giris_*` anahtarlarını P'den çıkar.
- Yeni `Dukkanlar`: dış R4(OX, OY), iç R4(BX, BY) halkası, z 0 → 5,0; yan yüz almaşık, üst yüz çatı malzemesi. Gövdeye **boşluksuz** bitişir.
- Gövde yüzündeki eski `Dukkan_Kapilari` (iç yüzde) yoktur. Bandın **iç yüzü** gövde duvarına gömülüdür; açıklık konmaz.

### 1.3 Dükkân dağılımı (KESİN)

**56 = 2 × 20 + 2 × 8** (W: Ekinci PDF 97 «Planların hepsinde yapıda 56 dükkân ve 32 mahzen görülmektedir»; dağılım Ayverdi 1966 planından sayıldı, `bedesten_notlar.md` §3).

| Cephe | Dizilim (batı→doğu / güney→kuzey) | Adım |
|---|---|---|
| Kuzey ve güney (70,70) | köşe kör bölüm · **10 dükkân** · giriş modülü 6,5 · **10 dükkân** · köşe kör bölüm | 2,75 (H; W genişlik 2,30 + 0,45 duvar) |
| Doğu ve batı (33,50) | köşe kör bölüm · **4 dükkân** · giriş modülü 6,5 · **4 dükkân** · köşe kör bölüm | 2,75 |

Köşe kör bölümleri kalan uzunluktan çıkar: uzun cephede (70,70 − 6,5 − 20 × 2,75) / 2 = 4,6; kısa cephede (33,50 − 6,5 − 8 × 2,75) / 2 = 2,5. Bunlar düz almaşık duvardır.

Her dükkân cephesi (`Dukkan_Kapilari`, bandın dış yüzünde):
- tuğla kemer çerçeve: genişlik 2,30, üzengi +2,40, kemer tepesi +3,55 (T);
- açıklık: genişlik 1,90, üzengi +2,40, **yarım daire kemer** (1960 restorasyon fotoğrafı `ekinci2025_pdf102`); içi **koyu düz levha değil, vitrin**: `dukkan_vitrin.png` dokusu (ince koyu metal kayıtlar `#36413F`, açık cam `#9FB8C0`, arkada sıcak iç ışık tonu `#E8C99A`; kemer tepesindeki yarım daire alanda yatay kayıtlı cam); doku iki dükkânda tekrar etmesin diye 3 varyant;
- tonoz cepheye diktir (W: «Dükkânların tonozları cepheye dikey»). Dış görünüşe etkisi yoktur, tonoz modellenmez.

### 1.4 Çevre (KESİN)

- Bedesteni dört yandan saran modern **metal örtülü çarşı geçitleri** (kullanıcı fotoğrafları, 2024 hava fotoğrafındaki açık renkli dış çerçeve) bedestenin parçası değildir. **Modele girmez.**
- Haritadaki "İç Bedesten Sokağı" bu örtülerin altındaki dolaşım yoludur. Bandın **dışında** kalır, gövde ile bant arasında değildir. Modelde bandın çevresine 3,5 m genişliğinde açık taş döşeme şerit olarak gösterilir (§5.2). Bu yorum v03'ün hatasını açıklar: Yandex adı doğrudur, konumu yanlış okunmuştu.
- Bandın üstündeki klima, tesisat ve sundurmalar modellenmez.

---

## 2. KESİN: dört giriş (19 Ekim düzeltmesi)

E (C2 PDF 29): «Her bir kapı, kubbeyle örtülü bir giriş mekânına açılmaktadır»; W (Ekinci PDF 102): restorasyonda dördü de kubbeli. **Ancak bu kubbeler dışarıdan görünmez:** 2024 hava fotoğrafında (`ekinci2025_pdf084`) ve tepeden/kuzeyden fotoğraflarda (`envanter_c2_s27`, `s28`) cephe ortalarında bant çatısının üstüne çıkan kubbe yok. A turundaki giriş kasnakları ve kubbeleri (Ø 5,0, tepe +8,7) planın tahmini değeriydi; **kaldır**.

| Parça | Değer | Kaynak |
|---|---|---|
| Konum | Dört cephenin ortası, 6,5 m'lik giriş modülü (dükkân dizisinin ortası) | E, W |
| Örtü | Giriş modülü bant çatısının devamı (aynı eğimli kurşun çatı); kubbe yalnız içeride, **modellenmez** | F (dışarıdan görünmüyor) |
| Dış kapı | Bandın dış yüzünde, **yarım daire kemer**: açıklık 3,0, üzengi 2,2, tepe 3,7 (P: Gabriel geçit 3,0; T yükseklik; v04b). Kemer bandı 0,30 sade kesme taş; kesme taş çerçeve `#D3BE98`; koyu kahve kapı `#7A5134` | P; T |
| Basamaklar | 3 basamak (rıht 0,15); eşik +0,45, açık yükseklik 3,25 (v04b) | W Ekinci PDF 103 |
| Güney kapısı kitabesi | Kemer üstünde 0,70 × 0,28 düz taş panel `#ECEAE4`, yazısız (v04b) | E; W; F `pdf085` |
| Gövde pencereleri | Kasnak kalktığı için **A turunda kaldırılan 6 pencere geri gelir**: uzun cephede 7, kısa cephede 4 | F |
| Gövde kapıları | Giriş mekânının içinde kalır; modellenmez | — |

## 3. KESİN: kubbeler ve gövde

| Parça | v03 | **v04** | Kaynak |
|---|---|---|---|
| Ana kubbe sayısı | 2 × 7 | **değişmez** | E |
| Dış Ø | 7,4 | **değişmez** | P kesit; W açıklık 6,50–6,90 |
| Kubbe tabanı | +10,25 | **değişmez** | T (v02b) |
| Kubbe tepesi | 13,5 | **+14,20** (alem hariç) | W: Ekinci PDF 96 «zeminden en yüksek kubbesinin hizasına kadar olan yüksekliği 14,20 metredir» |
| Profil | basık | +10,25 → +10,50 dik silindirik etek (0,25), üstünde yarım küre r 3,70 → +14,20 | H |
| Dilim / sıra | 32 / 5 | **değişmez** | F |
| Kubbe penceresi | yok | **yok** | W: özgün pencereler 1960'ta kapatıldı (Ekinci PDF 97) |
| Alem | yok | **yok** | Kaynakta yok |
| Gövde saçağı | +10,0 | değişmez | P |
| Gövde pencereleri | 7 + 4 | §2'deki çakışma kuralı | F |

Kubbelerin bir bölümü 1960'ta betonarme yeniden yapıldı; hangilerinin özgün kaldığı kaynakta çelişkilidir (Ekinci PDF 96 ve 101: batıdaki dört; PDF 98 ve dipnot 109: doğudaki dört). Hepsi kurşunla kaplıdır, renk farkı **uygulanmaz**. Not olarak kalır.

---

## 4. KESİN: almaşık cephe

| Yer | Örgü | Kaynak |
|---|---|---|
| Gövde dış duvarı (+5,0 → +10,0) | **Kutu almaşık** (v04b; önce 3 tuğla + 1 taş) | F 2024 fotoğrafları; W Alkan 2023 s.157 «3 tuğla + 1 taş» çelişkili, kullanıcı F'yi seçti |
| Bandın dış yüzü (0 → +5,0) | kutu almaşık (aynı karo; dükkân kemerleri arasında) | F: `envanter_c2_s29_carsi_sokagi.png`. 1960'ta betonarme yeniden yapıldı; görünüşte almaşık kaplama var |
| Giriş kasnakları | 3 tuğla + 1 taş | T |
| İç mekân (bu turda yok) | alt 2 tuğla + 1 beyaz taş, üst 3 tuğla + 1 kırmızı taş | W: Ekinci PDF 98 |

`doku_uret.py`'de `almasik.png` yeniden üretilir:
- **taş sırası 0,50 m, 3 tuğla sırası toplam 0,25 m** (3 × 0,07 + derz; periyot 0,75 m). 2024 fotoğrafında taş sıraları baskın, tuğla ince bant görünüyor (F `ekinci2025_pdf084`). Taş tonlarında açık uç (`#E6D8BA`, `#D8C6A2`) ağırlıklı, tuğlada `#CF7F55` ağırlıklı; derz `#E9DFCB` 2 cm. Hedef ortalama ±%8; tutmazsa sapmayı yaz, A onayında karar verildi: oran kaynaktaki sayıyla (3 tuğla + 1 taş) kalır, yükseklikler fotoğrafa göre;
- tuğla tonları `#C0683F` / `#CF7F55` / `#A65535` rastgele; harç `#E9DFCB` derzi 1 px;
- taş küfeki `#D8C6A2` / `#E6D8BA` / `#C4B08B`;
- karo ortalaması ≈ `#CFA986` çıkmalı, kontrol et.

UV ölçeği (v04b): 1 karo = 1,04 m genişlik × 0,88 m yükseklik. Sıralar yatay, bant ile gövde arasında kesintisiz.

---

## 5. KESİN: renk, zemin ve figürler (genel standarda geçiş)

### 5.1 Renk tablosu

| Malzeme (eski hex) | **Yeni hex** | Not |
|---|---|---|
| Duvar `#E2B7A4` | almaşık doku, ortalama `#CFA986` | §4 |
| Kubbe `#95AEBA` | kurşun **`#AEB6BC`**, ek çizgisi `#8E979D` (v04b) | `kubbe_dilim.png` yeniden üretilir |
| Gövde çatısı `#B9C6CC` | kurşun `#C3C9CD` | Kubbeler arası alçak kırma çatı |
| Bant çatısı (`halka_cati` `#C9C3B6`) | kurşun **`#AEB6BC`** (eğimli çatı), ek çizgisi `#8E979D` | 19 Ekim: eğimli kurşun çatı; v04b koyu ton |
| Tuğla bantlar `#C6755B` | `#C0683F` | Pencere kemerleri (v04b: saçaklar taş) |
| Taş `#F2F3E5` | kesme taş `#D3BE98`; kitabe `#ECEAE4` | Kapı çerçeveleri, pencere alınlığı |
| Kapı `#6B4A3A` | `#7A5134` | Dört dış kapı |
| Pencere `#1E1F21` | `#3E4A55` | Gövde pencereleri ve dükkân açıklıkları |
| Dükkân `#415072` | **sil**, açıklıklar `#3E4A55` | |
| Sokak `#D9D1C3`, Geçit `#2A2522` | **sil** | Nesneler kalktı |
| Zemin_Cim `#A0B46C`, Zemin_Golge `#E29B87` | **sil** | Standart zemin (§5.2) |

Taş, tuğla ve sıva için roughness 0,70; kurşun için 0,55.

### 5.2 Zemin

`../_GENEL_SAHNE_STANDARDI.md` §1:
- dikdörtgen kaide: bandın dış yüzünden 3,5 m taş döşeme şerit (`#B3A590`, derz `#A69A86`, 1,0 × 0,5 karo) — İç Bedesten Sokağı;
- dışında ana zemin `#C4BDAF`, kaide yanları `#A39A8B`;
- bordür `#D2C3A4` (0,15 yükseklik) şeridin dış kenarında;
- **çim yok** (çarşı ortamı);
- pembe gölge elipsi ve şeftali arka plan yok.

`_sunum.glb` kaideyle, uygulama GLB'si kaidesiz çıkar.

### 5.3 Işık ve kamera

Genel standart §2 (Ulu Cami v16 ışığı) aynen. İzometrik standart kamera binanın tamamını ve iki kısa cepheden birini görür.

### 5.4 İnsan figürleri

Genel standart §4: maket üslubu, tek renk `#EEE9DF` / `#D9D2C5` / `#C9C1B3`, her biri 400–800 üçgen, `Olcek` koleksiyonunda `Olcek_Insan_01…08`.
- 8 figür: taş şeritte, kuzey ve batı girişlerinin önünde ikişer, dükkân önlerinde dört;
- boy 1,65–1,80;
- en az biri kuzey kapısının yanında (kapı 4,5 m ile ölçek karşılaştırması).

---

## 6. Teslim (v04)

1. `3d/build/build_v04.py`:
   - `build_v03.py`'den kopya; `SURUM = "v04"`, başlık yorumu ve P tablosu güncellenir, her yeni değerin yanında kaynak harfi;
   - kullanılmayan P anahtarları (`dis_x`, `dis_y` → yeni `toplam_x` 71,70 / `toplam_y` 35,50; `D_sokak_*`, `D_halka_*`, `D_giris_*`, `D_dukkan_n_*`) temizlenir.
   - Çıktılar: `3d/blend/bedesten_v04.blend`, `3d/export/bedesten_v04.glb`, `3d/export/bedesten_v04_sunum.glb`, `3d/kontrol/v04/`.
   - Dokular `doku_uret.py` ile yeniden üretilir.
2. Nesneler: `Govde`, `Kubbeler`, `Cati`, `Sacak`, `Pencereler`, `Dukkanlar` (bant), `Dukkan_Kapilari`, `Kapilar` (dış kapılar + kitabe), `Zemin` (yalnız sunum), `Olcek_Insan_NN`.
3. Üçgen bütçesi: toplam ≤ 30 000 (bina ≤ 24 000, figürler ≤ 6 000). Draw call ≤ 50. GLB ≤ 1 MB (`eser.md` Kontrol).
4. Zorunlu render'lar:
   - `havadan.png` (standart kamera);
   - `yan_yana_havadan_2024.png`: `ref/foto/ekinci2025_pdf084_havadan_2024.png` ile aynı açı (bant gövde pencerelerinin altında mı?);
   - `yan_yana_tepeden.png`: `ref/foto/envanter_c2_s28_tepeden.png` ile ortografik tepe (oran 71,70 / 35,50 ≈ 2,02);
   - `kuzey_giris.png` (`envanter_c2_s27_kuzeyden.png` açısı);
   - `guney_kapi.png` (kitabe);
   - `kuzey_orto.png` (56 dükkân sayımı için: 20 + 20 + 8 + 8 görünmeli).
5. `3d/kontrol/v04/olcu_dogrulama.json`: gövde ve toplam dış ölçü; bant derinlikleri ve yüksekliği; dükkân sayısı (cephe başına); kubbe tepe kotu; bant çatısı kotları; gövde pencere sayısı; figür boyları.
6. Genel standart §5'teki mesh, arka yüz ve renk denetimleri (`renkler.json`).
7. **Kapanış (Sonnet yapar, kullanıcı v04'ü kabul ettikten sonra):**
   - `3d/README.md`: sürüm geçmişine v04 satırı (uygulanan değerler, plandan sapmalar ve nedenleri, üçgen); "Güncel sürüm" ve "Bilinen sorunlar" v04'e göre. Ayrı rapor dosyası açılmaz.
   - v03'ün blend, GLB ve `kontrol/v03/` dosyaları ile `build_v03.py` silinir (yalnız son sürüm; `doku/` kalır).
   - `bedesten_notlar.md` §1: "v04" durumundaki satırlar "uygulandı" yapılır; giriş kasnağı ve pencere kararı kısa alt bölüm olarak eklenir.
   - `eser.md`: yalnız yeni kaynak ölçüsü varsa kaynak harfiyle işlenir; model değerleri yazılmaz.
   - Son adım: bu dosya (`SONNET_REVIZYON_PLANI.md`) silinir.
