# Emir Hanı: Sonnet revizyon planı (v03)

19 Ekim 2026. Bu dosya Emir Hanı revizyonu için **tek giriş noktasıdır**. Önce `../_GENEL_SAHNE_STANDARDI.md` dosyasını, sonra bunu oku. "KESİN" maddeler kaynakla doğrulanmıştır.

**Uyarı:** Emir Hanı için ölçekli rölöve (plan/kesit) **yok**. Ölçüler envanter metni, VGM 1983, bildiri ve fotoğraflardan; bir kısmı H/T. Her değerin kaynak harfini koru.

Hedef: `3d/build/build_emir_v02.py`'den `build_emir_v03.py` üretmek. Yapılacaklar:

1. Dış ölçüyü 46 × 50'ye, avlu revakını kenar başına 7 göze getir (v01 dondurması bu tur için kaldırılır; onay adımı A).
2. Arazi: han çevresindeki sokak üst kat düzeyinde; dışarıdan tek kat görünür, avlu aşağıda.
3. Cepheleri, güney revakını, girişleri, bacaları ve pencereleri kaynaklara göre düzelt.
4. Avlu şadırvanını ve ağaçları fotoğraflara göre kur.
5. Paleti, zemini ve figürleri genel standarda bağla.

---

## 0. Klasör haritası: neyi oku, neyi okuma

| Yol | Durum | Not |
|---|---|---|
| `SONNET_REVIZYON_PLANI.md` | **OKU (ana)** | Bu dosya |
| `../_GENEL_SAHNE_STANDARDI.md` | **OKU (ana)** | Zemin (daire kaide, 19 Ekim), ışık, palet, figür, teslim |
| `emir-han_notlar.md` | Destek | §1 kararlar, §3 ölçü analizi |
| `eser.md` | Destek | Kaynaklı ölçüler ve malzeme |
| `ref/metin/envanter_c1.md`, `vakif_1983.md`, `hanlar_bildirisi.md`, `alan_baskanligi.md` | **KAYNAK** | Metinler |
| `ref/plan/yurt2024_pdf219_kulliye_vaziyet_ayverdi.png` | KAYNAK (P-oran) | Ayverdi temsili vaziyeti: han planı, oda dizilişi, avlu ayakları. **Dikey yönde basık**; ölçü değil, düzen için |
| `ref/plan/hanlar-bildirisi_pdf003_bolge_restitusyon.png` | Destek | Bölge restitüsyonu |
| `ref/foto/vakif_1983_pdf176_havadan.png` (sağ yarı, 90° dönük) | **KAYNAK (F)** | Çatılar, bacalar, avlu revakları, göz sayısı |
| `ref/foto/Emir-Hani-2.jpg`, `Emir-Hani-4.jpg`, `Emir-Hani-5.jpg`, `emirhan-bursa-ulucami2/4/6.jpg.webp`, `1578509890.jpg`, `6141e917-*.jpeg` | **KAYNAK (F)** | Avlu revakları (iki kat), şadırvan, ağaçlar |
| `ref/foto/Emir-Hani-1.jpg`, `685999668f81d.webp`, `7112FE8*.jpeg`, `1578509447.jpg`, `1578509484.jpg`, `1578509629.jpg` | **KAYNAK (F)** | Ana giriş: tuğla sivri kemer, moloz taş duvar, yanlarda taş peykeler, içeri inen basamaklar |
| `ref/foto/1578509455.jpg`, `1578509463.jpg`, `1578509543.jpg` | **KAYNAK (F)** | Dış cephe: sokaktan tek kat yüksekliğinde, küçük tuğla kemerli pencereler, bacalar |
| `ref/foto/emirhan-bursa-ulucami3.jpg.webp`, `Kqg5B5q*.jpeg` | Destek | Revak içi (tonoz, beyaz sıva) |
| `ref/foto/envanter_c1_pdf108_*`, `pdf109_*`, `hanlar-bildirisi_pdf005_*`, `alan-baskanligi_pdf005_foy.png` | Destek | Havadan konum, avlu |
| `3d/build/build_emir_v02.py` | **KOD TEMELİ** | Kopyala → `build_emir_v03.py` |

Eksenler: +X doğu, +Y kuzey, +Z yukarı; orijin avlu ortası; **z = 0 avlu zemini**.

---

## 1. KESİN: kütle

| Değer | v02 | **v03** | Kaynak |
|---|---|---|---|
| Dış ölçü (D–B × K–G) | 45,0 × 45,0 | **46,0 × 50,0** | E Vakıf 1983 PDF 176 «dış ölçüleri, 46,00X50,00 metre»; O K–G 50,9 ✓; EHA 1967 D–B ≈ 45,5 ✓ (önceki okuma). E cilt-1 PDF 108 «yaklaşık 45 × 45» yuvarlak değer kabul edildi |
| Avlu | 25,5 × 25,5 | **25,5 × 25,5** (kare) | E PDF 108 «650 m²»; W bildiri PDF 6 «Kare planlı bir avlu» → H √650 |
| Kanat derinliği | 9,75 | **D–B kanatları 10,25; K–G kanatları 12,25** | H (dış − avlu) / 2. Kuzey kanadında asıl giriş ve iki 20 basamaklı merdiven var (W bildiri), derinlik makul |
| Saçak (avlu tarafı) | 9,5 | 9,5 (T) | Kaynakta yok; fotoğrafta iki kat revak |
| Kat yüksekliği | 5,0 | alt kat 4,5, üst kat 5,0 (T); kat silmesi +4,5 | F (avlu fotoğrafları); §2 ile uyumlu |
| Çatı | kırma, mahya 11,0 | korunur (kurşun) | F `vakif_1983_pdf176` |

## 2. KESİN: arazi ve dış görünüş (yeni)

Kaynak: W bildiri PDF 6 «Hanın asıl girişi zemin katın kuzey kanadının ortasından sağlanmakta ve **iki taraftan yirmişer basamaklı merdivenlerle** üst kata çıkış sağlanmaktadır»; E PDF 109 «Alt kattaki mekânlar **penceresizdir**»; E PDF 109 «biri Ulucami avlusundan, diğeri ise Kapalı Çarşı tarafından olmak üzere iki girişi»; F dış fotoğraflar (sokaktan tek kat görünen duvar, girişte içeri inen basamaklar).

- Han çevresindeki sokak ve meydan zemini **+4,0** (T: 20 basamak × 0,20). Dış duvarın görünen yüksekliği ≈ 5,5 (saçak 9,5 − 4,0). Alt kat (mahzenler) toprak altında kalır; bu yüzden penceresizdir.
- **Kaide:** daire (standart §1, 19 Ekim): yapıyı ve çevre öğelerini saran en küçük çember + 3 m pay, üst yüzü **+4,0**; avlu ve iç geçitler +0,0'da. Kaide yan yüzü `#A39A8B`.
- Dış duvar dokusu yalnız +4,0 üstünde görünür; altında kalan yüzler üretilmez (üçgen tasarrufu).

## 3. KESİN: avlu revakları

| Konu | v02 | **v03** | Kaynak |
|---|---|---|---|
| Göz sayısı | kenar başına 9 | **kenar başına 7**, her iki katta | W bildiri PDF 6 «avluya bakan cephesinde yedişer revak»; F `vakif_1983_pdf176` |
| Göz adımı | ≈ 2,8 | ≈ 3,64 (25,5 / 7) | H |
| Ayaklar | — | kalın kare ayaklar, kesme taş + tuğla almaşık (≈ 1,2 × 1,2) | E PDF 108 «kesme taş ve tuğladan örülmüş geniş ayaklar»; E Vakıf PDF 176 «revak ayaklarında muntazam kesme taş» |
| Alt kat kemerleri | sivri | **güney kenarı yarım daire**, diğer üç kenar sivri; tuğla kemer bandı | E Vakıf PDF 176 «Güney yandaki revakın alt kemerleri yarım daire profilli olduğu halde diğer üç yön ile üst katlar sivri kemerlidir»; W bildiri PDF 6 |
| Üst kat | sivri kemer, beyaz korkuluk | korunur; tonoz içleri açık sıva `#E8DFCB`, korkuluk demir `#36413F` (F) | F |
| Köşe kubbeleri | yok | üst kat revağının 4 köşe gözünde kubbe (içten, çatı altında; dışarıdan görünmez) | E PDF 108 «Birinci kat revaklarının dört köşesindeki kubbeler haricinde tüm mekânlar tonoz örtülüdür» |
| Saçak | tek tuğla bandı | **2 sıra kirpi (testere dişi) tuğla**, avlu ve dış cephede (Orhan Bey Camii ile aynı `kirpi.png`) | E PDF 108; E Vakıf PDF 176; W bildiri |

v02'deki "güney revakları ayrıca işlenmez" kararı bu turda kaldırılmıştır (kaynakta açık ve ucuz bir fark).

## 4. KESİN: girişler, pencereler, bacalar

- **Asıl giriş (kuzey kanadı ortası):** dış cephede +4,0 sokak düzeyinde; moloz taş duvarda tuğla sivri kemer (açıklık ≈ 2,6, tepe ≈ +4,0 + 3,6; T), kemer bandı 0,45 tuğla; kemerin iki yanında **taş peykeler** (kantar peykeleri, E PDF 108; 0,5 yükseklik, 0,8 derinlik, 2,5 uzunluk); içeride avluya inen basamaklar ve iki yanda üst kata çıkan merdivenler (20'şer basamak). Tabela ve yazı yok. F `Emir-Hani-1`, `685999668f81d`, `1578509484`.
- **Güney giriş (Ulucami avlusu tarafı):** +4,0 düzeyinde, üst kata açılır; **kesme taş basık kemerli** kapı (W bildiri PDF 6 «Üçüncü giriş ise üst katta kesme taştan basık kemerlidir»; E PDF 109). Konum güney cephesinin ortası (T).
- **Dış pencereler:** yalnız üst katta; oda başına 1 (toplam 34 tek + 2 çift), **güneydoğu köşedeki 2 oda penceresiz** (E PDF 109). Küçük dikdörtgen, demir parmaklık, üstünde tuğla sivri kemer alınlığı (F `1578509455`, `1578509543`). Pencere altı ≈ +4,6.
- **Bacalar:** üst kattaki **38 oda** başına 1 baca (E PDF 108–109 «içinde ocak bulunan odalar»); dış çatı yüzünde, oda eksenlerinde. Tuğla gövde 0,6 × 0,6, çatıdan 1,2 yukarı, **kurşun piramit başlık** (F). v02'de 44 adet vardı.

## 5. KESİN: avlu

- **Şadırvan:** avlu ortasında, açık (örtüsüz) **sekizgen mermer havuz**, yüzden yüze ≈ 4,0, kenar yüksekliği 0,7; ortada fıskiye sütunu (Ø 0,3, 1,2 m). E PDF 109 «fıskiyeli şadırvanı»; F `emirhan-bursa-ulucami2.jpg.webp` (açık mavi su).
- **Ağaçlar** (fotoğraflardaki yerlere, en çok 4; `Cevre_Agac_NN`, ≤ 300 üçgen): 2 büyük çınar (E «tarihi çınar ağaçları»), 1 sedir/servi `#3F7A5C` (F `emirhan-bursa-ulucami4/6`), 1 palmiye (F `Emir-Hani-4`; istenmezse çınar). Hangi fotoğrafa dayandığını yaz.
- Avlu zemini taş döşeme `#B3A590`, derz `#A69A86`.
- Şemsiye, masa, tabela **modellenmez**.

## 6. KESİN: renk ve figür

| Malzeme | v02 | **v03** |
|---|---|---|
| Dış duvar | almaşık karo (cami) | moloz taş + 2 tuğla / 1 küfeki almaşık dokusu (`duvar_emir.png`), ortalama ≈ `#C8B49A` |
| Avlu cepheleri, revak | almaşık | 2 tuğla + 1 küfeki almaşık; ayaklar kesme taş `#D3BE98` |
| Tuğla | `#C6755B` | `#C0683F` / `#CF7F55` / `#A65535` |
| Çatı, kubbe | | kurşun `#C3C9CD`, ek çizgisi `#98A1A8` |
| Revak içi | beyaz | `#E8DFCB` |
| Kapı | | `#7A5134` |
| Zemin_Cim, Zemin_Golge | | **sil** |

**Figürler:** ortak set `eserler/_kutuphane/akar3d.py` → `insan(...)`, yeniden çizme. 8 figür: avluda 4 (şadırvan yanında 2), üst kat revağında 2, girişte peykelerin yanında 2; en az 3'ü kadın.

## 7. Ortak kurallar (Koza Han turundan çıkan dersler)

1. Açıklıklarda açıklık hacmiyle kesişen bütün nesneleri temizle; havada asılı parça kalmasın; saçak ve silmeler kemerlerin üstünden geçmesin.
2. Parmaklık ve korkuluklar gerçek boşluk (alpha-cutout ya da çubuk).
3. Yazı ve tabela yok (EMİRHANI levhası düz taş panel).
4. Fotoğraf yönünü bilinen öğeden çıkar; modeli döndürme.
5. Geçici dosyalar `3d/kontrol/_tmp/` içinde; tur bitince sil.

## 8. Teslim (v03)

1. `3d/build/build_emir_v03.py` (`build_emir_v02.py`'den kopya; `SURUM = "emir_v03"`; P tablosu kaynak harfiyle). Çıktılar: `3d/blend/emir-hani_v03.blend`, `3d/export/emir-hani_v03.glb` (kaidesiz), `..._v03_sunum.glb` (kaideli, +4,0 sokak düzeyiyle), `3d/kontrol/emir_v03/`.
2. Bütçe: toplam ≤ 24 000 üçgen (han ≤ 17 000, şadırvan + ağaç ≤ 2 500, figür ≤ 4 000). Draw call ≤ 40. GLB ≤ 1 MB.
3. **Onay adımları (beni beklemeden geçme):**
   - A. Kütle ve arazi (§1–§2): `havadan.png` (`vakif_1983_pdf176` açısına yakın), `ust_orto.png` (ölçü çizgileriyle 46 × 50, avlu 25,5), `dis_cephe.png` (`1578509543` açısı, sokaktan tek kat görünmeli) → göster, onay bekle.
   - B. Revaklar ve girişler (§3–§4): `avlu_ici.png` (`Emir-Hani-4` açısı) ve `kuzey_giris.png` (`Emir-Hani-1` açısı) ile yan yana; `guney_revak.png` (yarım daire alt kemerler) → göster, onay bekle.
   - C. Avlu, renk, figürler (§5–§6): `avlu_genel.png` (`emirhan-bursa-ulucami2` açısı) → göster, onay bekle.
4. `3d/kontrol/emir_v03/olcu_dogrulama.json`: dış ölçü, avlu, kanat derinlikleri, göz sayısı ve adımı, sokak kotu, pencere ve baca sayısı, figür boyları.
5. Genel standart §5 denetimleri (`renkler.json`).
6. **Kapanış (kullanıcı v03'ü açıkça onayladıktan sonra):** `3d/README.md` v03 satırı; v02 blend, GLB, `kontrol/emir_v02/`, `build_emir_v02.py` silinir (`doku/`, `araclar/` kalır); notlar §1 güncellenir; bu dosya silinir.
