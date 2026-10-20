# Orhan Bey Hamamı / Aynalı Çarşı: model notları

Kaynaklı kimlik ve ölçü kaydı `eser.md`, üretim sürümleri `3d/README.md`. Külliye bağlamı ve yerleşim: `../orhan-bey-kulliyesi/orhan-bey-kulliyesi_notlar.md`. Son düzenleme: 19 Ekim 2026.

## 0. Klasör düzeni

```
orhan-bey-hamami/
  eser.md                       kimlik, oda ölçüleri, malzeme (kaynaklı)
  orhan-bey-hamami_notlar.md    bu dosya
  ref/
    plan/   yurt2024_pdf220 (Ayverdi planı), pdf221–222 (Çetintaş planları), pdf223 (Ayverdi kesiti), pdf224 (Çetintaş kesiti),
            vakif_1983_pdf198_plan, okuma_hamam_kaynak_karsilastirma
    foto/   envanter_c1_pdf104–107 (havadan, tepeden, girişler, doğu avlusu), yurt2024_pdf305–316 (Levha 90–110), alan-baskanligi_pdf004_foy
    metin/  envanter_c1, yurt2024, vakif_1983, alan_baskanligi
    kaynak_dizini.json
  3d/       yalnız son sürüm hamam_v04: blend/, export/ (kaidesiz + _sunum), kontrol/hamam_v04/, build/ (build_hamam_v04.py, build_hamam_v03.py referans, cevre_v03.py, doku/, araclar/), README.md
```
Eksenler: +X doğu, +Y kuzey. OSM konumu (külliye yerel koordinatı): (81, 72); yalnız konum.

## 1. Güncel model kararları

Güncel sürüm **hamam_v04** (19 Ekim 2026, kullanıcı onaylı) = hamam_v03 + güney kapısı ayrıntısı (F Levha 90–91, Aydın 2017 foto 33: oval rozet pencere, cam saçak ve ferforje konsollar, camlı kapı, «ESKİ AYNALI ÇARŞI» ve «COVERED BAZAAR» yazıları, fenerler; ayrıntı `3d/README.md` v04 satırı). Ölçülerin tamamı `3d/build/build_hamam_v04.py` başındaki `P` tablosunda (kapı ölçüleri `G_*`), doğrulama `3d/kontrol/hamam_v04/olcu_dogrulama.json`'da.

| # | Konu | Karar | Dayanak | Durum |
|---|---|---|---|---|
| 1 | Plan | Ayverdi planı 40,1 px/m (çubuk × 1,035); oda iç ölçüleri E ile ±%1. Dış ölçü 31,3 × 34,8 m | P `yurt2024_pdf220`; E oda ölçüleri | v03 (v01–v02: Çetintaş × 1,38) |
| 2 | Batı ucu | Su deposu şeridinde (X −15,74) biter; Çetintaş'taki külhan odası yok | W Aydın PDF 71 (Ayverdi: külhan bugün dükkân, biçimi bilinmiyor); E «külhan yıkıldı» | v03, kullanıcı |
| 3 | Yükseklikler | Ayverdi kesiti kendi çubuğuyla (46 px/m): alçak dam 4,9, kare gövde 5,3, erkek saçak 7,6, tepe 14,5, fener 15,2. v01–v02'deki × 1,16 hatalıydı; Aydın Plan 13 taraması düşeyde ≈ 0,87 basık | P `yurt2024_pdf223`; P-oran Çetintaş AB; F kasnak sırası sayımı | v03, kullanıcı |
| 4 | Kadın soğukluğu kotları | Saçak 8,3 (F: Levha 96, pdf104'te 6 almaşık periyot), tepe 13,2 (T); merkez iç ortadan 0,38 m doğuda (kasnaklar çakışmasın) | F; kesit yok | v03 |
| 5 | Kubbe dizilimi | 12 kubbe: 2 büyük etekli, ılıklık, sıcaklık, ılıklık halveti, 4 erkek halveti, kadın tarafında 3; eyvan tonozu yok (tepeden fotoğrafta düz dam) | P Ayverdi; F `envanter_c1_pdf105` | v03 |
| 6 | Büyük kubbeler | Sekizgen almaşık kasnak + 2 sıra testere dişi + sekizgen kurşun etek + kubbe + fener; kasnak pencereleri (kadın 3: E; erkek 3: T) | E PDF 106–107; F Levha 98–99, 110 | v03 |
| 7 | Küçük ve orta kubbeler | Dilimli kurşun; tepede metal çerçeveli cam külah | W Aydın PDF 70; F pdf104, Levha 95 | v03 |
| 8 | Kadın tarafı | Üç küçük kubbe kurşun kırma dam üstünde; doğu ve güney kenarında 5,6 m parapet | F pdf104, pdf105, Levha 95 | v03 |
| 9 | Girişler | Alınlıklı blok **güneyde** (sıcaklığın güney eyvanı üstü, sokak setinde); kuzeyde düz cephede kemerli kapı + yuvarlak pencere; kadınlar girişi kadın soğukluğunun güneyinde. Batı kapısı modellenmedi | §3.4; F Levha 90, 96–97; Flickr; TDV | v03, kullanıcı (araştırma sonrası) |
| 10 | Duvar, kasnak, saçak | Beden: moloz taş + pembe horasan, hatıl yok; kasnak: 1 kesme taş + 3 tuğla; kare gövdede 1 sıra testere dişi, alçak duvarda tuğla korniş | E PDF 106; F Levha 95, 98, 104–105, 110; TDV «tuğla kirpi saçak» | v03 |
| 11 | Zemin | Bugünkü iç kot = kuzey ve doğu avlusu (z = 0); güney ve güneybatıda +3,3 m sokak seti, doğu avlusundan 15 basamak | P-oran Çetintaş AB; F Levha 92–94; E «14 basamak» | v03, kullanıcı |
| 12 | Eklenmeyenler | Çarşı ekleri (1958 sonrası), batı kapısı, fil gözleri (bugün görünmüyor), su deposu tonozu (bugün modern çatı altında), külhan | E; TDV; F pdf105 | v03 |
| 13 | Palet, kaide, figür | `../_GENEL_SAHNE_STANDARDI.md`; kurşun `#858E94` (cami v06 ile aynı, kullanıcı kararı); daire kaide R 27,5; 6 figür, tek ağaç güneybatıda | Kullanıcı (18–19 Ekim) | v03 |

## 2. Kaynaklar

| Kaynak | Sayfa | Bu klasörde | Kullanım |
|---|---|---|---|
| Bursa Vakıf Eserleri Envanteri Cilt 1 | PDF 104–107 | `ref/metin/envanter_c1.md`, `ref/foto/envanter_c1_*` | Oda ölçüleri, kubbe ve kasnak tipleri, girişler, malzeme; havadan ve tepeden fotoğraflar |
| Yurt 2024 (YL tezi) | metin PDF 76–78; çizim 220–224; levha 305–316 | `ref/metin/yurt2024.md`, `ref/plan/yurt2024_*`, `ref/foto/yurt2024_*` | Ayverdi ve Çetintaş plan/kesitleri; kubbe çapları (sıcaklık Ø 5, ılıklık halveti Ø 3,80); süsleme; cephe fotoğrafları |
| Türkiye'de Vakıf Abideler III (1983) | PDF 198 | `ref/metin/vakif_1983.md`, `ref/plan/vakif_1983_pdf198_plan.png` | 12,00 × 12,00 ve 10,00 × 10,00 soyunmalıklar; «kubbe kasnakları üç sıra tuğla, bir sıra kesme taş» |
| Aydın 2017 (YL tezi, `veri/bursa/481461.pdf`) | metin PDF 67–74; çizim 87, 95–102; foto 178–180 | `ref/metin/aydin2017.md`, `ref/plan/aydin2017_*`, `ref/foto/aydin2017_*` | Ayverdi/Çetintaş plan ve kesitlerinin daha temiz taraması; Çetintaş AB/CD kesitleri (bugünkü ve restorasyon); kotlu kesit (Plan 13); kubbe çapları; özgün kiremit örtü; vakfiye |
| Web araştırması (19 Ekim 2026) | — | yalnız bağlantı (fotoğraflar telifli, klasöre kopyalanmadı) | [TDV: Orhan Gazi Külliyesi](https://islamansiklopedisi.org.tr/orhan-gazi-kulliyesi) (güney ve batı kapıları 1958 sonrası, su deposu dükkân, külhan yok, tuğla kirpi saçak); [Flickr orcin70 albümü](https://www.flickr.com/photos/orcin70/albums/72157651736137321/) (güney alınlıklı blok «Kapalıçarşı Girişi», kuzey düz cepheli kapı); [tarihgezisi.com galerisi](https://tarihgezisi.com/hanlar/eski-aynali-carsi-hamam-bursa/) (içeride merdiven); [Kültür Portalı envanter](https://www.kulturportali.gov.tr/turkiye/bursa/kulturenvanteri/orhangazi-hamami) |
| Alan Başkanlığı föyü N2 | PDF 4 | `ref/metin/alan_baskanligi.md`, `ref/foto/alan-baskanligi_pdf004_foy.png` | Kimlik; giriş yönü çelişkisi (§3.4) |

## 3. Ölçü analizi (19 Ekim 2026)

### 3.1 Çizim ölçekleri
| Çizim | Çubuk | E ile karşılaştırma | Sonuç |
|---|---|---|---|
| Ayverdi planı (PDF 220, 200 dpi) | 41,5 px/m | erkek soğukluğu iç 11,57 × 11,45 (E 11,95 × 11,86), kadın 10,0 (E 10,35) | çubuk −%3 → **× 1,035 (40,1 px/m)**, güvenilir |
| Çetintaş planı (PDF 221, 200 dpi) | 49 px/m | erkek 8,7 × 8,9, kadın 7,4 → ×1,37–1,40 | çubuk hatalı; **35,5 px/m** (v01 kalibrasyonu doğrulandı) |
| Ayverdi kesiti (PDF 223) | — | soğukluk içi 10,3 ↔ 11,95 | **× 1,16** (v01) |

Dış ölçü: Ayverdi (düzeltilmiş) gri batı şeridi dahil ≈ 31,4 (D–B) × 34,9 (K–G); Çetintaş (kalibre) batı tonozlu odalar dahil ≈ 37,5 × 34,3. K–G uyumlu (OSM 34,9 da aynı). D–B farkı batıdaki su deposu/külhan bölgesinin iki çizimde farklı gösterilmesinden; v01 Çetintaş'ı seçti, korunur.

### 3.2 Kubbe dizilimi (Ayverdi planı + tepeden fotoğraf)
Ayverdi planında (kuzey aşağıda, doğu solda) kesikli daireler: kuzeyde iki büyük soğukluk kubbesi (erkek Ø ≈ 11,3, kadın Ø ≈ 10,0 iç); erkek soğukluğunun güneyinde ılıklık (Ø ≈ 6,4); ılıklığın doğusunda ılıklık halveti; güneyde haç planlı sıcaklık: ortada kubbe, dört köşede halvet kubbeleri, aralarında tonozlu eyvanlar; doğuda kadınlar bölümünün sıcaklık ve iki halvet kubbesi (K–G doğrultusunda üç küçük kubbe). Tepeden fotoğraf (`envanter_c1_pdf105`, sağdaki görsel) aynı düzeni gösteriyor: iki büyük sekizgen etekli kubbe, orta boy ılıklık, sıcaklık ve halvetlerin küçük kubbeleri (konik fenerli), doğuda koyu kurşun bant üzerinde üç küçük kubbe.

### 3.3 Büyük kubbelerin biçimi (fotoğraf `envanter_c1_pdf104`, `pdf107`, Levha 98–99, 110)
Kare gövde → sekizgen kasnak (3 tuğla + 1 taş almaşık, kasnakta yuvarlak kemerli şebekeli pencere) → kasnak üstünde 2 sıra testere dişi tuğla → düz yüzlü sekizgen kurşun etek → kubbe → fener. Orhan Bey Camii kubbeleriyle aynı birleşim. Erkek soğukluğu kubbesinin kurşunu fotoğrafta açık bej, diğerleri mavi-gri; modelde hepsi aynı kurşun rengi.

### 3.4 Giriş yönü çelişkisi
- E PDF 106: «biri kuzeyde, biri güneyde ve diğeri batıda olmak üzere üç girişi ... **Kuzeydeki giriş özgündür**»; özgün girişin üstünde dikine tuğlalı yuvarlak pencere. Ayverdi planında erkek soğukluğunun kapısı kuzey duvarında. Yurt PDF 77 metni de «Erkekler bölümünün kuzey yönündeki girişi» der.
- Yurt'un fotoğraf levhalarında (PDF 305–306) aynı yuvarlak pencereli giriş «Güney Cephe Giriş» (Levha 90) diye adlandırılmış. Doğu levhaları (Levha 96–97, kadınlar girişi) E ile tutarlı.
- Alan Başkanlığı föyü: «Yapının batı ve güney kapıları, ilk yapıldığı zamanın kapısı».
- ~~Seçim (17–19 Ekim): yuvarlak pencereli ana giriş kuzeyde.~~
- **Güncel seçim (19 Ekim 2026, web araştırması + kullanıcı onayı):** iki ayrı yuvarlak pencereli giriş var.
  - **Güney:** alınlıklı, tek başına duran blok (Levha 90, envanter PDF 106 sol foto). Sıcaklığın güney eyvanı üstünde; tepeden fotoğrafta (envanter PDF 105) kuzey–güney sırtlı blok olarak görünüyor. Tabelası «Kapalıçarşı Girişi», içeride 14 basamakla aşağı iniliyor (E İng. metin; tarihgezisi.com IMG_4758, 4762–4763). TDV: güney ve batı kapıları 1958 sonrası açıldı.
  - **Kuzey (özgün):** Kapalı Çarşı'nın örtülü sokağında, dükkânlar arasında düz cephe; yuvarlak kemerli camlı kapı ve üstünde yuvarlak pencere (Flickr orcin70 albümü, 17001294166). E'nin «kuzeydeki giriş özgündür» tarifi buna; yanındaki fotoğraf güney bloğuna ait.
  - Modelde (v03 C): alınlıklı blok güneyde, +3,3 m sokak setinin üstünde; kuzeyde erkek soğukluğu duvarında kemerli kapı + yuvarlak pencere. Batı kapısı modellenmedi (biçimi kaynakta yok).

## Ek: Geçmiş kayıt (17 Ekim 2026, hamam v01–v02)

> Bu ekteki değerler tarihsel kayıttır. Kütle ölçüleri ve kalibrasyon (× 1,38, × 1,16) geçerlidir; "küçük halvet ve eyvan kubbeleri eklenmez" kararı ve v02 paleti **kaldırılmıştır** (§1). v01 dosyaları silindi; yalnız v02 `3d/` altında. Eski karşılaştırma görseli `ref/plan/okuma_hamam_kaynak_karsilastirma.png` adıyla taşındı.


Külliye üretim günlüğünden ayrılan eser bölümleri. Tarihli ölçü ve varsayımlar korunmuştur. Ortak yerleşim ve kaynak geçmişi: [külliye notları](../orhan-bey-kulliyesi/orhan-bey-kulliyesi_notlar.md).

### 2. Orhan Bey Hamamı (Aynalı Çarşı) · ölçü tablosu (ön okuma)
| Ölçü | Değer | Kaynak | Not |
|---|---|---|---|
| Plan | çifte hamam; erkekler soğukluk 11,95 × 11,86, ılıklık 6,60 × 6,45, 4 eyvan + 4 halvet (3,40 × 3,60); kadınlar soğukluk 10,35 × 10,35 | E | |
| Dış ölçü (Çetintaş planı, çevre çizgisi dahil) | ≈ 25,7 × 27,3 m | P | |
| OSM | way 1156644734 "Eski Aynalı Çarşı", 23,3 × 34,9 m | O | **> 2 m çelişki** (K–G 27,3 ↔ 34,9); OSM çarşı eklentilerini alıyor olabilir |
| Soğukluk kubbe tepesi | ≈ 14,9 m | P (Ayverdi kesiti, 44 px/m, ön okuma) | v01 hamam turunda yeniden ölçülecek |
| Ilıklık / sıcaklık kubbe tepesi | ≈ 8,6 m | P (aynı) | |
| Malzeme | kesme taş beden; kasnaklar 3 sıra tuğla + 1 sıra taş; kubbeler kurşun | E PDF s.106–107 | |
| Bugünkü durum | 1958 yangınından sonra tamamen çarşıya dönüştürülmüş | E | fotoğraf yok |

### Hamam kaynak denetimi (17 Ekim 2026, hamam v01 öncesi)
Karşılaştırma görseli: `ref/plan/okuma_hamam_kaynak_karsilastirma.png` (hepsi 12 px/m, kuzey yukarı).

#### Yön
- **Çetintaş planında kuzey sağda** (90° dönük): EHA 1967'de sekizgen sıcaklık güneyde, büyük kubbeli odalar kuzeyde; envanterdeki "kuzey girişi" büyük soğuklukta, daha küçük kadınlar soğukluğu doğuda (E: "doğudan bitişik"). Hepsi bu yönle tutuyor.
- **Ayverdi planında kuzey aşağıda** (180°): oda dizilişi Çetintaş'la aynı (erkek soğukluğu kuzeybatı, kadın soğukluğu kuzeydoğu, sıcaklık güneyde).

#### Ölçek çelişkisi (2 m'den fazla)
| Oda | E (iç) | Çetintaş, çubuk ölçeği (49 px/m) | Oran | Ayverdi planı (41,8 px/m) |
|---|---|---|---|---|
| Erkek soğukluğu | 11,95 × 11,86 | 8,6 × 8,9 | ×1,39 / ×1,34 | ≈ 11,4 (−%5) |
| Kadın soğukluğu | 10,35 × 10,35 | 7,3 × 7,5 | ×1,42 / ×1,38 | |
→ **Çetintaş yeniden çiziminin ölçek çubuğu ≈ %38 hatalı**; doğru ölçek ≈ 35,5 px/m (E oda ölçülerinden, H). Kalibre edilince Çetintaş dış ölçüsü ≈ 37,7 (D–B) × 35,4 (K–G) m; OSM K–G 34,9 ile tutuyor, D–B 23,3 ile tutmuyor (OSM poligonu yapının yalnız bir kısmını alıyor olabilir).
- Ayverdi kesiti (46,6 px/m) da kısa: soğukluk içi 10,3 ↔ E 11,95 (×1,16). Ön okuma yükseklikleri (× 1,16 ile): soğukluk duvarı ≈ 8,6, kubbe tepesi ≈ 16,2, aydınlık feneri ≈ 17,2; ılıklık tepesi ≈ 9,2; sıcaklık tepesi ≈ 9,5; halvet ve eyvan damları ≈ 5,6 m.
- Çetintaş planındaki ince çizgili alanlar (kuzeybatı ve güneydoğu köşeler) yığma değil; sonradan eklenen çarşı/avlu bölümleri.

#### Karar soruları
1. Hamam ölçeği: (a) **Çetintaş planı, envanter oda ölçüleriyle kalibre (×1,38)** (öneri; senin seçtiğin plan, 4 odada ±%3 tutarlı); (b) Ayverdi planı (çubuğu E ile %5 içinde, ama yalnız hamam çekirdeği).
2. Yükseklikler Ayverdi kesitinden × 1,16 (E soğukluk genişliğiyle kalibre) alınsın mı? (öneri: evet)
3. İnce çizgili ek alanlar (sonraki çarşı bölümleri) modele girmesin; yalnız yığma hamam (öneri: girmesin, B kademe).

#### Hamam kararları (tasarım sorumlusu, 17 Ekim 2026)
1. Ölçek: **Çetintaş planı, envanter oda ölçüleriyle kalibre (×1,38 → 35,5 px/m)**.
2. Yükseklikler: **Ayverdi kesiti × 1,16** (E soğukluk genişliğiyle kalibre).
3. Sonradan eklenen çarşı bölümleri (planda ince çizgili alanlar) modele girmez; yalnız yığma hamam.
4. Dosya adları yapıya göre: `build_hamam_v01.py`, `kontrol/hamam_v01/`, `blend/orhan-bey-hamami_v01.blend` (cami dosyaları `build_v01.py`, `kontrol/v01/` olarak kalır).

### Hamam v01 · kütle turu (17 Ekim 2026)
Betik: `3d/build/build_hamam_v01.py` (B kademe; pencere, kapı ve süs yok). Sonuç `3d/kontrol/hamam_v01/`:
- `kontrol_rapor.json`: 1 700 üçgen, 14 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 8 yönde 0 → **GECTI: true** (ilk denemede)
- Dış ölçü (yığma kısım): 37,7 (D–B) × 35,3 (K–G) m
- Render: `havadan` (kuzeydoğudan), `havadan_guneybati`, `dogu_orto`, `kuzey_orto`, `ust_orto` (kare), `kubbe_yakin`
- Bindirme: `bindirme_ust_orto.png` (Çetintaş planı ×1,38: dört kubbe kesikli dairelerin üstünde, kütle kenarları duvarlarla hizalı), `bindirme_dogu_orto.png` (Ayverdi kesiti ×1,16: erkek soğukluğu duvarı 8,6, kubbe tepesi 16,2, fener 17,2 ve ılıklık kubbesi örtüşüyor)

Parçalar: `Hamam_Sogukluk_Erkek` (kubbe + fener, vurgu 2), `Hamam_Sogukluk_Kadin` (kubbe + fener), `Hamam_Sicaklik` (alçak L kütle: sıcaklık, 4 eyvan + 4 halvet, ılıklık, kadın sıcaklığı ve halvetleri, batıdaki iki tonozlu oda), `Kubbe_Sicaklik`, `Kubbe_Iliklik` (+ `Zemin`, `Zemin_Golge`).

#### Tur içi düzeltme
1. **Üst kamera** (render, model değil): tam tepeden `to_track_quat` görüntüyü 180° çeviriyordu → kamera açısı sabitlendi, render kare yapıldı. Cami `ust_orto.png` de aynı sorundan etkileniyor (yalnız bilgi amaçlı; cami dondurulduğu için betiğe dokunulmadı).

#### Bilinen fark
- Ayverdi kesiti (×1,16) güneyde plandan ≈ 4 m uzun ve sıcaklık kubbesi kesitte ≈ 2 m daha güneyde. İki çizimin kalibrasyonu (×1,38 / ×1,16) birbirini tam tutmuyor; konumlar plandan (P), yükseklikler kesitten (K) alındı.

#### Yeni VARSAYIM'lar
- VARSAYIM: kadınlar soğukluğu duvarı 7,5, kubbe tepesi 14,1 m (kesit yok; erkek soğukluğundan açıklık oranıyla).
- VARSAYIM: halvet, eyvan ve kadın sıcaklığı küçük kubbeleri v01'de yok; alçak kütle 5,6 m düz dam.
- VARSAYIM: batıdaki iki uzun tonozlu oda (planda kuzeybatı ucu) alçak kütleyle aynı yükseklikte (5,6 m).
- VARSAYIM: kubbeler kasnaksız doğrudan duvardan (soğukluklar) ya da alçak pahlı kasnaktan (sıcaklık, ılıklık) çıkıyor; E'deki "3 sıra tuğla + 1 sıra taş kasnak" v02'de doku olarak.

#### Açık sorular (hamam v01 sonu)
1. Küçük halvet/eyvan kubbeleri (8 + 3 adet) v02 detayında eklensin mi? (öneri: B kademe olduğu için hayır, yalnız düz dam)
2. Kütle kabul edilirse: "GEOMETRİ DONDURMA hamam v01", sonra Emir Hanı v01.

### GEOMETRİ DONDURMA hamam v01 (17 Ekim 2026)
Hamam kütlesi tasarım sorumlusu tarafından kabul edildi. `build_hamam_v01.py` içindeki kütle ölçüleri bundan sonra değişmez; v02 yalnız detay, renk ve çıkış ekler.

#### Kararlar
1. Plan Çetintaş ×1,38 (E oda ölçüleriyle kalibre), yükseklikler Ayverdi kesiti ×1,16; çarşı ekleri modelde yok.
2. Erkekler soğukluğu: duvar 8,6, kubbe tepesi 16,2, fener 17,2 m. Kadınlar soğukluğu: duvar 7,5, tepe 14,1 m (VARSAYIM). Alçak kütle 5,6 m; sıcaklık kubbesi 9,5, ılıklık 9,2 m.
3. **Küçük halvet ve eyvan kubbeleri eklenmez** (v02'de de); alçak kütle düz kurşun dam.

### Hamam v02 · detay + renk + çıkış (17 Ekim 2026)
Betik: `3d/build/build_hamam_v02.py` (= hamam v01 kütlesi + detay; B kademe, sade). Sonuç `3d/kontrol/hamam_v02/`:
- `kontrol_rapor.json`: 3 204 üçgen, 20 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 8 yönde 0 → **GECTI: true**
- `.glb` (Draco): `3d/export/orhan-bey-hamami_v02.glb` 60 KB; AO pişirildi
- Render: `havadan`, `havadan_guneybati`, `dogu_orto`, `kuzey_orto`, `kuzey_giris`, `sicaklik_yakin`

#### Eklenenler
| Parça | İçerik | Kaynak |
|---|---|---|
| `Hamam_Giris` | erkekler soğukluğu kuzey yüzünde, planda ortadaki açıklıkta yuvarlak kemerli kapı (1,6 × 3,2), tuğla + küfeki halkalı kemer, üstünde yuvarlak pencere (Ø 1,1, z 5,0); yan açıklıklarda yuvarlak kemerli pencere | E PDF s.106, P, T |
| `Sacak` | tuğla saçak halkaları (üç kütle) + soğukluklarda 1,0 m tuğla kasnak bandı | E, cami ile aynı bant |
| `Fil_Gozleri` | sıcaklık ve ılıklık kubbelerinde 2 halka × 8 koyu nokta (Ø 0,28) | _ortak_stil § 3, Ayverdi kesiti |
| Dokular | kubbe dilimleri (cami ile aynı karo); duvarlar düz renk | — |
Fenerlerin malzemesi kubbe → çatı rengi (dilim dokusu fenere taşmasın); biçim aynı.

#### Tur içi düzeltmeler
1. Saçak bandı dolu prizma → içi boş halka (alçak damda z-fighting). Aynı kusur camide → v02b.
2. Kasnak bandı saçak halkasıyla iç kenar paylaşıyordu (manifold olmayan 8 kenar) → 1 cm ayrıldı.

#### VARSAYIM'lar
- VARSAYIM: kapı 1,6 × 3,2 m, yan pencereler 1,0 m (planda açıklık ≈ 1,4 m; yükseklik kaynağı yok).
- VARSAYIM: fil gözü düzeni (2 halka × 8); kesitte sayı okunmuyor.
- VARSAYIM: duvarlar düz renk; E'deki kesme taş için doku yok (B kademe, "doku azdır").

#### Açık sorular (hamam v02 sonu)
1. **Külhan bacası** (_ortak_stil hamam vurgusu): yeri kaynakta yok. Sıcaklığın güneyinde tek baca eklensin mi, eklenmesin mi?
2. Hamam v02 kabul edilirse: commit, sonra Emir Hanı v02.

