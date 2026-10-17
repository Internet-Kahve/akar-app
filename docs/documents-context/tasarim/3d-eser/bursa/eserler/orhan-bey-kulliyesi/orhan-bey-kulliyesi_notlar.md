# Orhan Bey Külliyesi · model notları

Ölçü ve kaynaklar: `eser.md`. Bu dosya model kararlarını ve varsayımları tutar. Sürüm bölümleri tarih sırasıyladır; en günceli en sondadır.

## GÜNCEL DURUM (17 Ekim 2026, cami v01 kütle turu)
- **Son sürüm:** `claude/build/build_v01.py` (cami kütlesi) → `claude/blend/orhan-bey-camii_v01.blend`, kontrol `claude/kontrol/v01/` (GECTI: true, 2 350 üçgen, 30 draw call). .glb henüz yok (v02'de).
- **Bindirme:** `claude/build/yan_yana.py v01` → `kontrol/v01/bindirme_bati_orto.png`, `bindirme_kuzey_orto.png` (render ile Ayverdi çizimi aynı ölçekte, 35 px/m, zemin hizalı).
- **Üretim:** `blender -b --python claude/build/build_v01.py` (Blender 5.2). Dal: `3d/orhan-bey-kulliyesi-v01` (Bedesten dalının ucundan; main'de `3d-eser` yok).
- **Cami kütlesi donduruldu (GEOMETRİ DONDURMA v01, 17 Ekim).**
- **Hamam v01 kütlesi hazır:** `claude/build/build_hamam_v01.py` → `claude/blend/orhan-bey-hamami_v01.blend`, kontrol `claude/kontrol/hamam_v01/` (GECTI: true, 1 700 üçgen, 14 draw call). Bindirme: `claude/build/yan_yana_hamam.py`. **Hamam donduruldu (GEOMETRİ DONDURMA hamam v01).**
- **Emir Hanı v01 kütlesi hazır:** `claude/build/build_emir_v01.py` → `claude/blend/emir-hani_v01.blend`, kontrol `claude/kontrol/emir_v01/` (GECTI: true). **Donduruldu (GEOMETRİ DONDURMA Emir Hanı v01).**
- **Cami v02 detay hazır:** `claude/build/build_v02.py` → `claude/export/orhan-bey-camii_v02.glb` (Draco, 131 KB), `claude/blend/orhan-bey-camii_v02.blend`, kontrol `claude/kontrol/v02/` (GECTI: true, 8 538 üçgen, 44 draw call). Dokular `claude/build/doku/doku_uret.py`. **Kabul edildi.** v02b kusur turu: saçak z-fighting düzeltmesi (`export/orhan-bey-camii_v02b.glb`, 132 KB).
- **Cami v03 (son cemaat yeri revizyonu) hazır:** `claude/build/build_v03.py` → `claude/export/orhan-bey-camii_v03.glb` (160 KB), kontrol `claude/kontrol/v03/` (GECTI: true, 11182 üçgen, 49 draw call). Teslimde v03 kullanılmalı (kabul edilirse).
- **Cami v04 (kubbe, kasnak, pencere detayı) hazır:** `claude/build/build_v04.py` → `claude/export/orhan-bey-camii_v04.glb` (172 KB), kontrol `claude/kontrol/v04/` (GECTI: true, 12100 üçgen, 50 draw call).
- **Cami v05 (kubbe eteği) hazır:** `claude/build/build_v05.py` → `claude/export/orhan-bey-camii_v05.glb` (193 KB), kontrol `claude/kontrol/v05/` (GECTI: true, 13294 üçgen, 49 draw call).
- **Hamam v02 detay hazır:** `claude/build/build_hamam_v02.py` → `claude/export/orhan-bey-hamami_v02.glb` (Draco, 60 KB), kontrol `claude/kontrol/hamam_v02/` (GECTI: true, 3 204 üçgen, 20 draw call). Sıradaki: hamam v02 göz kontrolü, sonra Emir Hanı v02.
- Kaynak turu (B1) özeti aşağıda; çizimler `bursa/ref/orhan-*.png`, okumalar `claude/kontrol/kaynak/`.

## Klasör düzeni
- `claude/build/build_vNN.py`: üretim betiği (bütün ölçüler en üstteki `P` sözlüğünde)
- Her yapı ayrı dosya: `claude/blend/<yapi>_vNN.blend` · `claude/export/<yapi>_vNN.glb` (`orhan-bey-camii`, `orhan-bey-hamami`, `emir-hani`) · `claude/kontrol/vNN/`. Sürüm numarası külliye için ortak; her tur tek yapıya bakar.
- `claude/kontrol/kaynak/`: ızgaralı plan/cephe okumaları, OSM
- `ref-img/`: 13 fotoğraf, **hepsi cami** (hamam ve han fotoğrafı yok)
- Eksenler: +X doğu, +Y kuzey; birim metre. Her .glb'nin orijini kendi ayak izi kutusunun ortası; külliyedeki yeri § 4 yerleşim tablosunda (OSM yerel koordinatı: boylam 29.0620, enlem 40.1838).

## Kaynak çizimlerin ölçeği ve doğruluğu
| Çizim | Ölçek | Kontrol | Sonuç |
|---|---|---|---|
| Cami planı (Ayverdi) | 5 m = 237 px → 47,4 px/m (200 dpi) | genişlik 25,7 m ↔ E son cemaat yeri 25,80 m | **güvenilir (P)** |
| Cami yan cephe (Ayverdi, s.217 alt) | 5 m = 166 px → 33,2 px/m | uzunluk 33,4 m ↔ plan 33,5 m | **güvenilir; yükseklik kaynağı** |
| Cami ön cephe (Ayverdi, s.218) | 5 m = 200 px → 40,0 px/m | genişlik 26,9 m ↔ plan 25,7 m (+%4,7) | çubuk hatalı; plan genişliğiyle ölçeklenir (× 0,955) |
| Cami kesiti (Ayverdi, s.217 üst) | 5 m = 172 px → 34,4 px/m | uzunluk 30,7 m ↔ plan 33,5 m (−%9) | çubuk hatalı; yalnız biçim için |
| Hamam planı (Çetintaş) | 5 m = 245 px → 49,0 px/m | E soğukluk 11,95 × 11,86 ile karşılaştırılacak (v01 hamam turu) | P (ön okuma) |
| EHA 1967 vaziyet planı | 75 m = 305 px → 4,07 px/m (yatay) | yatay: cami 26 m ✓, Emir Hanı 45,5 m ✓; **dikey ≈ 0,7 basık** (cami 24,6 m ↔ 33,5) | yalnız yerleşim sırası; konum OSM'den |

Plan yönü: Ayverdi ve Acar planlarında **kuzey aşağıda** (son cemaat yeri altta, mihrap üstte); planda sol = doğu. Minare planın sol alt köşesinde (sarmal merdiven) → **kuzeydoğu** (E ile tutarlı). Yan cephede (s.217) kuzey solda.

## 1. Orhan Bey Camii · ölçü tablosu
Kaynak kodu: P = Ayverdi planı (±0,2 m), Y = Ayverdi yan cephesi (±0,3 m), E = envanter cilt-1, O = OSM, F = fotoğraf, H = hesap, T = tahmin.

### Plan
| Ölçü | Değer | Kaynak | Not |
|---|---|---|---|
| Plan tipi | zaviyeli (ters T): 5 gözlü son cemaat yeri + orta harim + mihraplı ibadet mekânı + iki yanda tabhaneler | E, P | |
| Toplam dış ölçü (D–B × K–G) | **25,7 × 33,5 m** | P | O 27,0 × 35,5 (fark 1,3 / 2,0 m; OSM merdiven ve kaideyi de alıyor olabilir) |
| Son cemaat yeri | 25,7 × 6,5 m, 5 göz | P | E 25,80 × 6,30 |
| Ana gövde (tabhaneler dahil) | 25,7 × 15,5 m | P | |
| Mihrap bloğu (güneye çıkıntı) | dış 11,3 (D–B) × 11,5 (K–G) m | P | iç ≈ 8,9 m; E 9,64 × 8,83 |
| Harim orta mekânı | 8,90 × 9,90 m | E | P ile tutarlı |
| Tabhaneler (doğu, batı) | ≈ 6,05 × 9,10 m, kubbeli | E | |
| Duvar kalınlığı | 1,1–1,5 m | P | |
| Minare | kuzeydoğu, son cemaat yeri ile ana gövdenin birleştiği köşede; gövde Ø ≈ 2,0 m, çokgen | P, Y, E | |
| OSM | way 255187109; uzun eksen kuzeyden ≈ 16° doğuya dönük | O | |

### Yükseklikler (Y, yan cephe; zemin 0)
| Parça | Saçak / kasnak üstü | Kubbe tepesi (alemsiz) | Alem ucu |
|---|---|---|---|
| Son cemaat yeri | saçak 9,4 | örtü tepesi 11,8 | — |
| Yan kanatlar (tabhane bölümü) | saçak 7,6; tabhane kasnağı 9,1 | 10,5 | — |
| Harim orta kubbe | kasnak üstü 13,5 | **16,5** | 19,1 |
| Mihrap bloğu kubbesi | duvar 10,2; kasnak 12,7 | **14,4** | 17,1 |
| Minare | şerefe 18,8–19,8; petek üstü 22,4 | külah 23,3 (çizimdeki eski kısa külah) | 24,4 |
| Kaide (subasman) | ≈ 0,8–1,0 | | |
Ön cephe (× 0,955 ölçeklenmiş) aynı değerleri ±0,5 m içinde veriyor (saçak 9,4; orta kubbe 16,2; minare külahı 23,8).

### Bugünkü hâl (fotoğraf, 2020–23 restorasyonu sonrası: `ref-img/IMG_8460`, `IMG_8484`)
- Duvarlar açıkta **almaşık**: moloz/kesme taş + yatay ve dikey tuğla (kırmızı tuğla bantlar belirgin). 2019 öncesi fotoğraflarda kasnaklar sarı sıvalı ve minare sıvalıydı; restorasyonda sıva kaldırılmış.
- Kasnaklar sekizgen/kare, almaşık; kubbeler kurşun.
- Minare: kırmızı tuğla gövde, **uzun sivri kurşun külah** (Ayverdi çizimindeki kısa soğan külahtan farklı). F ile kaba ölçüm: külah ≈ 2,4 × gövde genişliği ≈ 4,5–5 m.
- Son cemaat yeri: dışta **kurşun kırma çatı** (fotoğraf 0 ve IMG_8460); Ayverdi ön cephesinde parapet arkasından kubbeler görünüyor. Çatı içte kubbe ve aynalı tonozları örtüyor.
- Doğu cephesinde tuğla-taş baklava, batıda dama motifleri; ön cephede 5 kemer, ortada daha yüksek taç kemer (E, Y).

## 2. Orhan Bey Hamamı (Aynalı Çarşı) · ölçü tablosu (ön okuma)
| Ölçü | Değer | Kaynak | Not |
|---|---|---|---|
| Plan | çifte hamam; erkekler soğukluk 11,95 × 11,86, ılıklık 6,60 × 6,45, 4 eyvan + 4 halvet (3,40 × 3,60); kadınlar soğukluk 10,35 × 10,35 | E | |
| Dış ölçü (Çetintaş planı, çevre çizgisi dahil) | ≈ 25,7 × 27,3 m | P | |
| OSM | way 1156644734 "Eski Aynalı Çarşı", 23,3 × 34,9 m | O | **> 2 m çelişki** (K–G 27,3 ↔ 34,9); OSM çarşı eklentilerini alıyor olabilir |
| Soğukluk kubbe tepesi | ≈ 14,9 m | P (Ayverdi kesiti, 44 px/m, ön okuma) | v01 hamam turunda yeniden ölçülecek |
| Ilıklık / sıcaklık kubbe tepesi | ≈ 8,6 m | P (aynı) | |
| Malzeme | kesme taş beden; kasnaklar 3 sıra tuğla + 1 sıra taş; kubbeler kurşun | E PDF s.106–107 | |
| Bugünkü durum | 1958 yangınından sonra tamamen çarşıya dönüştürülmüş | E | fotoğraf yok |

## 3. Emir Hanı · ölçü tablosu (ön okuma)
| Ölçü | Değer | Kaynak | Not |
|---|---|---|---|
| Dış ölçü | ≈ 45 × 45 m | E PDF s.108 | EHA yatay 45,5 m ✓ |
| Avlu | ≈ 650 m² (≈ 25 × 26 m) | E, H | |
| Kat | 2; alt 36, üst 38 oda; revaklı avlu, şadırvan, çınarlar | E | |
| OSM | adsız way 1271724730 (Ulucami'nin kuzeyi), 57,5 (D–B) × 50,9 (K–G) m | O | EHA'da çekirdeğin doğu ve batısına bitişik dükkân sıraları var → toplam ≈ 57 m (EHA yatay ✓). **> 2 m çelişki** E 45 ↔ O 57,5 / 50,9 |
| Yükseklik | yok | — | T: 2 katlı Bursa hanı, saçak ≈ 9–10 m (Koza Han ile karşılaştırılacak) |
| Malzeme | 2 sıra tuğla + 1 sıra küfeki almaşık; revaklar tuğla, 2 sıra kirpi saçak | E | |

## 4. Yerleşim (OSM yerel koordinat, m; +X doğu, +Y kuzey)
| Yapı | Merkez (x, y) | Not |
|---|---|---|
| Orhan Bey Camii | (177, 13) | |
| Orhan Bey Hamamı | (81, 72) | |
| Emir Hanı | (−27, 92) | |
| (Koza Han, ayrı model) | ≈ (194, 74) | camiyle hamam arasında, ayrı eser |
| (Ulucami, ayrı model) | (−20, 14) | |
Cami ↔ hamam ≈ 110 m, hamam ↔ Emir Hanı ≈ 110 m, cami ↔ Emir Hanı ≈ 215 m. Külliye kapsamı ≈ 260 × 130 m; arada başka eserler (Koza Han, Ulucami, çarşı) var.

## Kaynak çelişkileri (2 m'den fazla)
1. **Hamam:** Çetintaş planı 25,7 × 27,3 ↔ OSM 23,3 × 34,9 m. Öneri: plan (P); OSM yalnız konum.
2. **Emir Hanı:** envanter 45 × 45 ↔ OSM 57,5 × 50,9 m. Öneri: çekirdek 45 × 45 (E), çevredeki dükkân sıraları ayrı ve sade (EHA'da görünüyor).
3. **Cami minaresi:** Ayverdi çizimi kısa külah (tepe 23,3) ↔ bugünkü uzun sivri külah (F). Öneri: bugünkü hâl.
4. **Cami son cemaat yeri örtüsü:** Ayverdi ön cephesi kubbeler ↔ bugün kurşun kırma çatı (F). Öneri: bugünkü hâl.
(Cami toplam ölçüsünde P ↔ O farkı 1,3 / 2,0 m; sınırda, P kullanılır.)

## Parça listesi önerisi (.glb)
| Ad | İçerik |
|---|---|
| `Cami_Govde` | ana gövde + mihrap bloğu duvarları |
| `Cami_SonCemaat` | 5 gözlü revak, kemerler, kırma çatı |
| `Kubbe_Ana` | harim orta kubbesi + kasnağı (vurgu 1) |
| `Kubbe_Mihrap` | mihrap bloğu kubbesi + kasnağı |
| `Kubbe_Tabhane_D`, `Kubbe_Tabhane_B` | tabhane kubbeleri |
| `Minare_1` | kuzeydoğu minaresi |
| `Hamam` | hamam gövdesi |
| `Hamam_Kubbeler` | hamam kubbeleri (vurgu 2) |
| `Emir_Hani` | han kütlesi (B kademe) |
| `Zemin` | kaide (.glb'ye girmez) |

## Tur planı (öneri)
1. **v01 cami kütlesi** (tek konu): plan + yükseklik tablosu, pencere yok. Yan cephe ve ön cephe ortografik render çizimle yan yana; havadan; kubbe yakın.
2. v01b gerekirse → **cami dondurma**.
3. **v02 hamam kütlesi**, **v03 Emir Hanı kütlesi** (sade, B kademe).
4. **v04 yerleşim** (soru 1'in cevabına göre), sonra detay + palet + .glb.

## VARSAYIM listesi (şimdiden)
- VARSAYIM: cami bugünkü (2020–23 restorasyonu sonrası) hâliyle modellenir; yükseklikler Ayverdi yan cephesinden, minare külahı ve son cemaat yeri çatısı fotoğraftan.
- VARSAYIM: zemin düz kaide (arazi eğimi kaynakta yok).
- VARSAYIM: Emir Hanı saçak ≈ 9,5 m (kaynak yok).
- VARSAYIM: yok olmuş imaret, zaviye, medrese, mektep modele girmez.

## Açık sorular (B1 sonu)
1. **Yerleşim:** üç yapı ≈ 260 × 130 m'lik alana dağılmış, araları Koza Han ve Ulucami ile dolu. (a) üç yapı **ayrı ayrı .glb**, yerleşim tablosuyla (öneri); (b) tek .glb, gerçek konumlarında, aralar boş zemin; (c) tek .glb, yapılar birbirine yaklaştırılmış şematik dizilim.
2. **Hangi hâl:** cami bugünkü (restorasyon sonrası) hâliyle mi (öneri), Ayverdi çizimindeki hâliyle mi? (Minare külahı ve son cemaat yeri çatısı farklı.)
3. **Kademe:** cami A (vitrin), hamam ve Emir Hanı B (sade) uygun mu?
4. **Ölçü seçimi:** hamam için Çetintaş planı, Emir Hanı için envanterdeki 45 × 45 m çekirdek (+ sade dükkân sıraları) kullanılsın mı?
5. **Ek fotoğraf:** hamam (Aynalı Çarşı) dıştan ve havadan, Emir Hanı avlusu ve dış cephesi. Şu an 13 fotoğrafın hepsi cami.
6. **Sıra:** önce cami v01 kütlesi, hamam ve han sonra. Uygun mu?

### B1 cevapları (tasarım sorumlusu, 17 Ekim 2026)
1. Üç yapı **ayrı ayrı .glb**, yerleşim tablosuyla (§ 4).
2. Cami **bugünkü hâliyle** (2020–23 restorasyonu sonrası): sivri kurşun külah, son cemaat yerinde kurşun kırma çatı, açık almaşık duvar.
3. Kademe: cami **A**, hamam ve Emir Hanı **B**.
4. Hamam: **Çetintaş planı**. Emir Hanı: **45 × 45 m** (E).
5. Sıra: önce cami v01 kütlesi.

## v01 · cami kütle turu (17 Ekim 2026)
Betik: `claude/build/build_v01.py`. Pencere, kemer ve süs yok; son cemaat yeri kapalı kütle. Sonuç `claude/kontrol/v01/`:
- `kontrol_rapor.json`: 2 350 üçgen, 30 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 8 yönde 0 → **GECTI: true**
- Render: `havadan`, `foto_acisi` (ref `1578396115`, kuzeydoğudan), `foto_acisi_2` (ref `IMG_8460`, doğudan), `kuzey_orto`, `bati_orto`, `ust_orto`, `kubbe_yakin`
- Bindirme: `bindirme_bati_orto.png` (Ayverdi yan cephe), `bindirme_kuzey_orto.png` (Ayverdi ön cephe); yan yana: `yan_yana_*_orto.png`, `yan_yana_foto.png`, `yan_yana_foto_2.png`

Parçalar: `Cami_SonCemaat` (kütle + kurşun kırma çatı), `Cami_Koridor` (kuzey bandı), `Cami_Kanat_D`, `Cami_Kanat_B`, `Cami_Harim`, `Cami_Mihrap`, `Kubbe_Ana`, `Kubbe_Mihrap`, `Kubbe_Tabhane_D`, `Kubbe_Tabhane_B`, `Kubbe_Giris`, `Minare_1` (+ `Zemin`, `Zemin_Golge`; .glb'ye girmez).

Bindirme sonucu (yan cephe, doğrulanmış ölçek): son cemaat yeri saçağı, kanat saçağı (7,6), harim ve mihrap kasnakları, iki kubbenin tepesi, tabhane kubbesi ve toplam uzunluk çizimle **0,1–0,3 m** içinde örtüşüyor. Ön cephede genişlik, kasnak ve orta kubbe örtüşüyor.

### Tur içi düzeltmeler
1. **Kasnak çakışması** (kontrol): giriş ve doğu tabhane kasnakları harim bloğuna 0,3 m taşıyordu → tabhane kasnağı 6,6 → 6,2 m (merkezler u 4,0 / 21,7), giriş kasnağı 4,6 → 4,0 m.
2. **Minare yeri** (P'den, yan cephe bindirmesi): gövde ekseni kuzey kenarından 7,6 değil **8,3 m** (planda sarmal merdiven çizimi minare gövdesinin eksenini vermiyor). u = 1,3 aynı.

### Yeni VARSAYIM'lar
- VARSAYIM: yan kanat, koridor, harim ve mihrap bloğu çatıları v01'de düz kurşun. Fotoğrafta (IMG_8460) kanatlarda basık kurşun kırma çatılar var → v02 detay.
- VARSAYIM: kasnaklar pahlı kare (sekizgene yakın); kasnak ve kubbe ölçüleri yan cepheden, planla ±0,5 m.
- VARSAYIM: giriş bölmesi kubbesi (koridor ortasında) kasnak 9,0, tepe 11,0 m; ön cephe ve yan cepheden kaba okuma.
- VARSAYIM: minare yan kanat çatısından (7,55 m) başlar; altı duvar içinde. Külah 3,8 m (F), şerefe 18,8–19,8 m (Y).
- VARSAYIM: kaide/subasman (≈ 0,8–1,0 m) v01'de yok.

### Açık sorular (v01 sonu)
1. **Kanat çatıları:** fotoğraftaki basık kırma çatılar v02 detayında mı eklensin (öneri), yoksa kütleye mi girsin? Kütleye girerse kasnakların alt kısmı çatıya gömülür.
2. **Son cemaat yeri kırma çatısı:** mahya 11,8 m (Ayverdi yan cephesindeki örtü tepesi). Fotoğrafta (1578396115) daha basık görünüyor; 11,0 m'ye inilsin mi?
3. Kütle kabul edilirse: "GEOMETRİ DONDURMA v01 (cami)", sonra hamam v01.

## GEOMETRİ DONDURMA v01 · cami (17 Ekim 2026)
Kütle tasarım sorumlusu tarafından kabul edildi. `build_v01.py` içindeki cami kütle ölçüleri (P tablosu) bundan sonra değişmez; cami v02 ve sonrası yalnız detay, renk ve çıkış ekler. Dondurmadan sonra çıkan kütle kusurları ayrı "kusur turu"nda, biçim değiştirmeden düzeltilir.

### Kararlar (bu oturum)
1. Üç yapı ayrı .glb; külliyedeki yerleri § 4 yerleşim tablosunda (OSM konumu).
2. Cami bugünkü (2020–23 restorasyonu sonrası) hâliyle; kademe A. Hamam ve Emir Hanı B.
3. Cami ölçü kaynağı: Ayverdi planı (25,7 × 33,5 m) ve yan cephesi (yükseklikler); ön cephe ve kesit çubukları hatalı, kullanılmaz.
4. Son cemaat yeri: kurşun kırma çatı, saçak 9,4 m, mahya **11,8 m** (kalır).
5. Yan kanat ve koridor saçağı 7,6; harim ve mihrap bloğu 10,2; ana kubbe kasnak 13,5 / tepe 16,5; mihrap kubbesi kasnak 12,7 / tepe 14,4; tabhane kubbeleri kasnak 9,1 / tepe 10,5.
6. Minare kuzeydoğuda, eksen (u 1,3; v 8,3); bugünkü sivri kurşun külah (3,8 m, F).
7. **Yan kanat basık kurşun kırma çatıları v02 detayında** eklenecek (kütleye girmez).
8. Hamamda Çetintaş planı, Emir Hanı'nda 45 × 45 m (E).

## Hamam kaynak denetimi (17 Ekim 2026, hamam v01 öncesi)
Karşılaştırma görseli: `claude/kontrol/kaynak/hamam_kaynak_karsilastirma.png` (hepsi 12 px/m, kuzey yukarı).

### Yön
- **Çetintaş planında kuzey sağda** (90° dönük): EHA 1967'de sekizgen sıcaklık güneyde, büyük kubbeli odalar kuzeyde; envanterdeki "kuzey girişi" büyük soğuklukta, daha küçük kadınlar soğukluğu doğuda (E: "doğudan bitişik"). Hepsi bu yönle tutuyor.
- **Ayverdi planında kuzey aşağıda** (180°): oda dizilişi Çetintaş'la aynı (erkek soğukluğu kuzeybatı, kadın soğukluğu kuzeydoğu, sıcaklık güneyde).

### Ölçek çelişkisi (2 m'den fazla)
| Oda | E (iç) | Çetintaş, çubuk ölçeği (49 px/m) | Oran | Ayverdi planı (41,8 px/m) |
|---|---|---|---|---|
| Erkek soğukluğu | 11,95 × 11,86 | 8,6 × 8,9 | ×1,39 / ×1,34 | ≈ 11,4 (−%5) |
| Kadın soğukluğu | 10,35 × 10,35 | 7,3 × 7,5 | ×1,42 / ×1,38 | |
→ **Çetintaş yeniden çiziminin ölçek çubuğu ≈ %38 hatalı**; doğru ölçek ≈ 35,5 px/m (E oda ölçülerinden, H). Kalibre edilince Çetintaş dış ölçüsü ≈ 37,7 (D–B) × 35,4 (K–G) m; OSM K–G 34,9 ile tutuyor, D–B 23,3 ile tutmuyor (OSM poligonu yapının yalnız bir kısmını alıyor olabilir).
- Ayverdi kesiti (46,6 px/m) da kısa: soğukluk içi 10,3 ↔ E 11,95 (×1,16). Ön okuma yükseklikleri (× 1,16 ile): soğukluk duvarı ≈ 8,6, kubbe tepesi ≈ 16,2, aydınlık feneri ≈ 17,2; ılıklık tepesi ≈ 9,2; sıcaklık tepesi ≈ 9,5; halvet ve eyvan damları ≈ 5,6 m.
- Çetintaş planındaki ince çizgili alanlar (kuzeybatı ve güneydoğu köşeler) yığma değil; sonradan eklenen çarşı/avlu bölümleri.

### Karar soruları
1. Hamam ölçeği: (a) **Çetintaş planı, envanter oda ölçüleriyle kalibre (×1,38)** (öneri; senin seçtiğin plan, 4 odada ±%3 tutarlı); (b) Ayverdi planı (çubuğu E ile %5 içinde, ama yalnız hamam çekirdeği).
2. Yükseklikler Ayverdi kesitinden × 1,16 (E soğukluk genişliğiyle kalibre) alınsın mı? (öneri: evet)
3. İnce çizgili ek alanlar (sonraki çarşı bölümleri) modele girmesin; yalnız yığma hamam (öneri: girmesin, B kademe).

### Hamam kararları (tasarım sorumlusu, 17 Ekim 2026)
1. Ölçek: **Çetintaş planı, envanter oda ölçüleriyle kalibre (×1,38 → 35,5 px/m)**.
2. Yükseklikler: **Ayverdi kesiti × 1,16** (E soğukluk genişliğiyle kalibre).
3. Sonradan eklenen çarşı bölümleri (planda ince çizgili alanlar) modele girmez; yalnız yığma hamam.
4. Dosya adları yapıya göre: `build_hamam_v01.py`, `kontrol/hamam_v01/`, `blend/orhan-bey-hamami_v01.blend` (cami dosyaları `build_v01.py`, `kontrol/v01/` olarak kalır).

## Hamam v01 · kütle turu (17 Ekim 2026)
Betik: `claude/build/build_hamam_v01.py` (B kademe; pencere, kapı ve süs yok). Sonuç `claude/kontrol/hamam_v01/`:
- `kontrol_rapor.json`: 1 700 üçgen, 14 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 8 yönde 0 → **GECTI: true** (ilk denemede)
- Dış ölçü (yığma kısım): 37,7 (D–B) × 35,3 (K–G) m
- Render: `havadan` (kuzeydoğudan), `havadan_guneybati`, `dogu_orto`, `kuzey_orto`, `ust_orto` (kare), `kubbe_yakin`
- Bindirme: `bindirme_ust_orto.png` (Çetintaş planı ×1,38: dört kubbe kesikli dairelerin üstünde, kütle kenarları duvarlarla hizalı), `bindirme_dogu_orto.png` (Ayverdi kesiti ×1,16: erkek soğukluğu duvarı 8,6, kubbe tepesi 16,2, fener 17,2 ve ılıklık kubbesi örtüşüyor)

Parçalar: `Hamam_Sogukluk_Erkek` (kubbe + fener, vurgu 2), `Hamam_Sogukluk_Kadin` (kubbe + fener), `Hamam_Sicaklik` (alçak L kütle: sıcaklık, 4 eyvan + 4 halvet, ılıklık, kadın sıcaklığı ve halvetleri, batıdaki iki tonozlu oda), `Kubbe_Sicaklik`, `Kubbe_Iliklik` (+ `Zemin`, `Zemin_Golge`).

### Tur içi düzeltme
1. **Üst kamera** (render, model değil): tam tepeden `to_track_quat` görüntüyü 180° çeviriyordu → kamera açısı sabitlendi, render kare yapıldı. Cami `ust_orto.png` de aynı sorundan etkileniyor (yalnız bilgi amaçlı; cami dondurulduğu için betiğe dokunulmadı).

### Bilinen fark
- Ayverdi kesiti (×1,16) güneyde plandan ≈ 4 m uzun ve sıcaklık kubbesi kesitte ≈ 2 m daha güneyde. İki çizimin kalibrasyonu (×1,38 / ×1,16) birbirini tam tutmuyor; konumlar plandan (P), yükseklikler kesitten (K) alındı.

### Yeni VARSAYIM'lar
- VARSAYIM: kadınlar soğukluğu duvarı 7,5, kubbe tepesi 14,1 m (kesit yok; erkek soğukluğundan açıklık oranıyla).
- VARSAYIM: halvet, eyvan ve kadın sıcaklığı küçük kubbeleri v01'de yok; alçak kütle 5,6 m düz dam.
- VARSAYIM: batıdaki iki uzun tonozlu oda (planda kuzeybatı ucu) alçak kütleyle aynı yükseklikte (5,6 m).
- VARSAYIM: kubbeler kasnaksız doğrudan duvardan (soğukluklar) ya da alçak pahlı kasnaktan (sıcaklık, ılıklık) çıkıyor; E'deki "3 sıra tuğla + 1 sıra taş kasnak" v02'de doku olarak.

### Açık sorular (hamam v01 sonu)
1. Küçük halvet/eyvan kubbeleri (8 + 3 adet) v02 detayında eklensin mi? (öneri: B kademe olduğu için hayır, yalnız düz dam)
2. Kütle kabul edilirse: "GEOMETRİ DONDURMA hamam v01", sonra Emir Hanı v01.

## GEOMETRİ DONDURMA hamam v01 (17 Ekim 2026)
Hamam kütlesi tasarım sorumlusu tarafından kabul edildi. `build_hamam_v01.py` içindeki kütle ölçüleri bundan sonra değişmez; v02 yalnız detay, renk ve çıkış ekler.

### Kararlar
1. Plan Çetintaş ×1,38 (E oda ölçüleriyle kalibre), yükseklikler Ayverdi kesiti ×1,16; çarşı ekleri modelde yok.
2. Erkekler soğukluğu: duvar 8,6, kubbe tepesi 16,2, fener 17,2 m. Kadınlar soğukluğu: duvar 7,5, tepe 14,1 m (VARSAYIM). Alçak kütle 5,6 m; sıcaklık kubbesi 9,5, ılıklık 9,2 m.
3. **Küçük halvet ve eyvan kubbeleri eklenmez** (v02'de de); alçak kütle düz kurşun dam.

## Emir Hanı v01 · kütle turu (17 Ekim 2026)
Betik: `claude/build/build_emir_v01.py` (B kademe; revak, kapı, baca ve süs yok). **Ölçülü plan ve kesit yok.** Sonuç `claude/kontrol/emir_v01/`:
- `kontrol_rapor.json`: 52 üçgen, 3 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 8 yönde 0 → **GECTI: true**
- Render: `havadan`, `kuzey_orto`, `ust_orto` (kare), `avlu_ici`
- Bindirme: `bindirme_ust_orto.png` (EHA 1967): D–B yönünde çekirdek ≈ 44,8 m, avlu açıklığı ≈ 25,2 m, kanat ≈ 9,5 m model ile tutuyor. K–G yönü döngüsel (EHA dikeyi 45 m kabulüyle ölçeklendi).
- Yan yana: `yan_yana_avlu.png` (fotoğraf Emir-Hani-4; v01'de revak olmadığı için yalnız kütle ölçeği)

Parçalar: `Emir_Hani` (halka kütle + kurşun kırma çatı, tek kapalı hacim), `Han_Avlu` (avlu döşemesi) (+ `Zemin`, `Zemin_Golge`).

### Ölçüler
| Ölçü | Değer | Kaynak |
|---|---|---|
| Dış ölçü | 45,0 × 45,0 m | E (EHA yatay 45,5 ✓) |
| Avlu | 25,5 × 25,5 m | H: √650 m² (EHA yatay ≈ 25,2 ✓) |
| Kanat derinliği | 9,75 m | H |
| Saçak (iç ve dış) | 9,5 m | T (Koza Han v01 ile aynı: 5,0 + 4,5) |
| Kırma çatı mahyası | 11,0 m, kanat ortasında | T (F: Emir-Hani-1'de basık kurşun kırma çatı) |

### VARSAYIM'lar
- VARSAYIM: saçak 9,5 m, mahya 11,0 m (yükseklik kaynağı yok). Fotoğraftan ölçüm için yerden, karşıdan bir dış cephe fotoğrafı gerek.
- VARSAYIM: zemin düz; girişte sokaktan avluya inen rampa (F: Emir-Hani-1) modellenmez.
- VARSAYIM: çevredeki dükkân sıraları (EHA'da doğu ve batıda, OSM 57,5 m) modelde yok (B1 kararı: 45 × 45).
- VARSAYIM: avludaki şadırvan ve çınarlar v02'de (eser.md Zemin ve çevre).

### Açık sorular (Emir Hanı v01 sonu)
1. Saçak 9,5 m uygun mu? (Fotoğraflarda alt kat kemerleri + üst kat revağı ≈ 9–10 m gösteriyor; ölçülemedi.)
2. Kütle kabul edilirse: "GEOMETRİ DONDURMA Emir Hanı v01", sonra v02 detay turları (cami A, hamam ve han B).

## GEOMETRİ DONDURMA Emir Hanı v01 (17 Ekim 2026)
Emir Hanı kütlesi tasarım sorumlusu tarafından kabul edildi. `build_emir_v01.py` içindeki kütle ölçüleri bundan sonra değişmez.

### Kararlar
1. Dış ölçü 45 × 45 m (E), avlu 25,5 × 25,5 m (H), kanat 9,75 m; dükkân sıraları modelde yok.
2. **Saçak 9,5 m kalır** (VARSAYIM, Koza Han ile aynı); kurşun kırma çatı mahyası 11,0 m, kanat ortasında.
3. Üç yapının kütlesi donmuş durumda; sıradaki işler v02 detay turları (önce cami, A kademe).

## v02 · cami detay + renk + çıkış (17 Ekim 2026)
Betik: `claude/build/build_v02.py` (= v01 kütlesi birebir + detay; yeni ölçüler P'de `D_` önekli). Sonuç `claude/kontrol/v02/`:
- `kontrol_rapor.json`: 8 538 üçgen (≤ 30 000), 44 draw call (< 50), açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 8 yönde 0 → **GECTI: true**
- `.glb` (Draco): `claude/export/orhan-bey-camii_v02.glb` 131 KB (≤ 1 MB); AO vertex rengine pişirildi
- Render: `havadan`, `havadan_guneybati`, `foto_acisi`, `foto_acisi_2`, `kuzey_orto`, `bati_orto`, `revak_yakin`, `kubbe_yakin`
- Bindirme (`yan_yana.py v02`): `bindirme_bati_orto.png` (Ayverdi yan cephesi: sağır kemerler, mihrap bloğu pencereleri, kasnak pencereleri ve ikiz kemer yerinde), `bindirme_kuzey_orto.png`; fotoğrafla: `yan_yana_foto.png`, `yan_yana_foto_2.png`

### Eklenenler
| Parça | İçerik | Kaynak |
|---|---|---|
| `Revak_SonCemaat` | kuzeyde 5 sivri kemer (yanlar üzengi 4,5 / tepe 6,6; orta taç kemer 4,9 / 8,0), tuğla kemer bandı, orta gözde ana kapı (1,8 × 3,4, taş çerçeve); yanlarda tuğla kemerli ikiz sivri kemer | P, O, E, F |
| `Cepheler` | doğu/batı/güney yüzlerinde sağır sivri kemerler (kanat: 2,6 m, tepe 6,9; mihrap bloğu: 3,2 m, tepe 9,6), içlerinde üstte sivri revzenli, altta dikdörtgen parmaklıklı pencere + tuğla boşaltma kemeri; koridor ucunda küçük üst pencere; doğu yan kapısı (1905); kasnak pencereleri (ana 2/yüz, mihrap 1/yüz, tabhane 1/yüz) | Y, P, F, Budak 2018 |
| `Kaide_Bant` | 0,8 m taş subasman bandı (son cemaat yeri hariç) | Y |
| `Sacak` | 0,35 m tuğla saçak bandı (testere dişi saçak yerine tek bant) | E, F |
| `Cati_Kanatlar` | yan kanat ve koridor üstünde kasnağa doğru 7,55 → 8,3 m yükselen basık kurşun çatı | dondurma kararı 7, F |
| `Minare_1` | şerefe ve korkuluk taş, gövde tuğla | F |
| Dokular | almaşık (taş sırası + 2 sıra tuğla, dikey tuğla; karo 2,0 × 0,8 m), kubbe dilimleri (24 dilim × 6 sıra), parmaklıklı pencere | F, E |

### Tur içi düzeltmeler
1. İkiz kemer gözleri iç kemer levhasıyla kenar paylaşıyordu (manifold olmayan 4 kenar) → göz genişliği 1,8 → 1,7 m.
2. Çatı halkası normalleri yeniden hesaplandı (8 yönde ≈ 1e-4 kırmızı vardı).
3. Draw call 54 → 44: cephe ve kasnak pencereleri tek `Cepheler` nesnesinde.
4. Almaşık karo 1,2 × 0,6 → 2,0 × 0,8 m (ilk hâli cephede ızgara gibi duruyordu; fotoğrafta taş sırası ≈ 0,55 m).

### VARSAYIM'lar
- VARSAYIM: son cemaat yeri açıklıkları koyu levha (#6B5A55); kütle kapalı, revak içi modellenmez.
- VARSAYIM: doğu yan kapısının yeri koridor ucu (v 9,6); Budak 2018 yalnız "doğu cephesinde 1905'te açılan kapı" diyor.
- VARSAYIM: güney cephesindeki iki pencerenin düzeni yan yüzlerle aynı (sağır kemer + üst ve alt pencere).

### Açık sorular (v02 sonu)
1. **Doğu baklava / batı dama motifleri** (E PDF s.100) ve **minare yıldız motifleri** (E PDF s.103): `eser.md`'de "nasıl" boş; v02'ye eklenmedi. Eklensin mi, nasıl (tek bant mı, tüm cephe mi)?
2. **Alt pencereler:** fotoğrafta (IMG_8460) sivri kemerli ve daha büyük; Ayverdi yan cephesinde dikdörtgen + boşaltma kemeri. Bugünkü hâl kararı gereği fotoğrafa göre değiştirilsin mi?
3. **Revak içi rengi:** koyu levha mı kalsın, fotoğraftaki beyaz sıva gibi açık mı olsun?
4. v02 kabul edilirse: commit, sonra hamam ve Emir Hanı v02 (B kademe, sade).

### v02 kararları (tasarım sorumlusu, 17 Ekim 2026) · cami v02 kabul
1. Baklava, dama ve minare yıldız motifleri **eklenmez**.
2. Alt pencereler Ayverdi'deki gibi dikdörtgen + tuğla boşaltma kemeri **kalır**.
3. Son cemaat yeri açıklıkları koyu levha (#6B5A55) **kalır**.

## v02b · cami kusur turu (17 Ekim 2026)
Betik: `claude/build/build_v02b.py` (= v02 + tek düzeltme; biçim değişmedi). Kontrol `claude/kontrol/v02b/`: 8 658 üçgen, açık/manifold olmayan kenar 0, çakışma 0, kırmızı 0 → **GECTI: true**; `.glb` 132 KB.
- **Kusur:** `Sacak` bantları dolu prizmaydı; üst yüzleri harim ve mihrap bloğu damıyla aynı düzlemde (10,2 m) → damda kırmızı-gri titreşim (z-fighting). Hamam v02'de fark edildi, camide yakın render'la doğrulandı.
- **Düzeltme:** bant içi boş kapalı halka (dış 0,18 m taşma, iç 0,05 m), damdan 2 cm yüksek biter. Görsel: `kontrol/v02b/dam_yakin.png`.
- Kabul edilen v02 dosyaları (`build_v02.py`, `orhan-bey-camii_v02.glb`) olduğu gibi duruyor; teslimde v02b kullanılmalı.

## Hamam v02 · detay + renk + çıkış (17 Ekim 2026)
Betik: `claude/build/build_hamam_v02.py` (= hamam v01 kütlesi + detay; B kademe, sade). Sonuç `claude/kontrol/hamam_v02/`:
- `kontrol_rapor.json`: 3 204 üçgen, 20 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 8 yönde 0 → **GECTI: true**
- `.glb` (Draco): `claude/export/orhan-bey-hamami_v02.glb` 60 KB; AO pişirildi
- Render: `havadan`, `havadan_guneybati`, `dogu_orto`, `kuzey_orto`, `kuzey_giris`, `sicaklik_yakin`

### Eklenenler
| Parça | İçerik | Kaynak |
|---|---|---|
| `Hamam_Giris` | erkekler soğukluğu kuzey yüzünde, planda ortadaki açıklıkta yuvarlak kemerli kapı (1,6 × 3,2), tuğla + küfeki halkalı kemer, üstünde yuvarlak pencere (Ø 1,1, z 5,0); yan açıklıklarda yuvarlak kemerli pencere | E PDF s.106, P, T |
| `Sacak` | tuğla saçak halkaları (üç kütle) + soğukluklarda 1,0 m tuğla kasnak bandı | E, cami ile aynı bant |
| `Fil_Gozleri` | sıcaklık ve ılıklık kubbelerinde 2 halka × 8 koyu nokta (Ø 0,28) | _ortak_stil § 3, Ayverdi kesiti |
| Dokular | kubbe dilimleri (cami ile aynı karo); duvarlar düz renk | — |
Fenerlerin malzemesi kubbe → çatı rengi (dilim dokusu fenere taşmasın); biçim aynı.

### Tur içi düzeltmeler
1. Saçak bandı dolu prizma → içi boş halka (alçak damda z-fighting). Aynı kusur camide → v02b.
2. Kasnak bandı saçak halkasıyla iç kenar paylaşıyordu (manifold olmayan 8 kenar) → 1 cm ayrıldı.

### VARSAYIM'lar
- VARSAYIM: kapı 1,6 × 3,2 m, yan pencereler 1,0 m (planda açıklık ≈ 1,4 m; yükseklik kaynağı yok).
- VARSAYIM: fil gözü düzeni (2 halka × 8); kesitte sayı okunmuyor.
- VARSAYIM: duvarlar düz renk; E'deki kesme taş için doku yok (B kademe, "doku azdır").

### Açık sorular (hamam v02 sonu)
1. **Külhan bacası** (_ortak_stil hamam vurgusu): yeri kaynakta yok. Sıcaklığın güneyinde tek baca eklensin mi, eklenmesin mi?
2. Hamam v02 kabul edilirse: commit, sonra Emir Hanı v02.

## v03 · cami son cemaat yeri revizyonu (17 Ekim 2026, tasarım sorumlusu kararı)
Dondurulmuş kütlede **tasarım sorumlusunun isteğiyle** değişiklik. Dayanak: tasarım sorumlusunun fotoğrafları (`ref-img/ts_17ekim_1…6`: tepeden drone, havadan kuzeyden, revak içi, ikiz kemer), envanter cilt-1 PDF s.97 ("Beş gözlü son cemaat mahalli, 25.80 × 6.30 m ölçülerindedir ve tamamen kubbelerle örtülüdür"; "Yan mekânlar aynalı tonozlarla"), s.98 (yan cepheler "devşirme kompozit başlıklara oturan ikişer sivri kemerle dışa açılmaktadır"; sofalar "zeminden yaklaşık 90 cm daha yüksek"), s.100 ("küçük kubbeli giriş sahanlığı").

Betik: `claude/build/build_v03.py` (= v02b + son cemaat yeri yeniden). Kontrol `claude/kontrol/v03/`: 11182 üçgen, 49 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı 0 → **GECTI: true**; `.glb` 160 KB.

### Değişenler
| Konu | v02b | v03 |
|---|---|---|
| Son cemaat yeri | kapalı kütle + koyu levhalar | **açık revak**: U biçimli duvar, kemerler Boolean ile oyuldu, kemer içleri beyaz sıva; ön 5 sivri kemer, yanlarda mermer sütunlu ikiz kemer; içte 0,9 m sofa, gözleri ayıran beyaz sivri kemerler (üzengi 4,6, tepe 7,6), beyaz tavan (8,0 m); arka duvarda ana kapı + 4 pencere |
| Son cemaat yeri örtüsü | kurşun kırma çatı (mahya 11,8) | basık kurşun teras (9,4 → 9,85) + **ortada kasnaklı kubbe** (Ø 4,6, tepe 11,8) + **iki yanda kubbe** (Ø 3,9, tepe 10,9) + **uçlarda dikdörtgen aynalı tonoz** (4,2 × 4,6, üst 10,6) |
| Giriş kubbesi (koridor) | dışarıda kasnaklı kubbe | **kaldırıldı** (tepeden fotoğrafta yok; E: giriş sahanlığı kubbesi çatı altında); koridor üstü kurşun kırma çatı |
| Arka duvar | koridor saçağında (7,6) bitiyordu | son cemaat yeri saçağına (9,4) yükseldi (`Cami_KuzeyDuvar_Ust`) |
| Dış örtü sayısı | 5 kubbe + kırma çatı | **9**: son cemaat yerinde 3 kubbe + 2 aynalı tonoz, ana gövdede 4 sekizgen kasnaklı kubbe |

Yeni parçalar: `Cami_SonCemaat` (oyulmuş revak duvarı), `Revak_Kemerler`, `Revak_Ic` (sofa, tavan, sütunlar), `Revak_Cephe` (kemer bantları, arka duvar kapı/pencereleri), `Kubbe_SonCemaat`, `Cami_KuzeyDuvar_Ust`. Kalkan: `Revak_SonCemaat`, `Kubbe_Giris`.
Görseller: `foto_revak` (ts_17ekim_2 açısı), `revak_ici` (ts_17ekim_5 açısı, göz boyunca), `havadan_kuzey` (ts_17ekim_3), `ust_orto` (ts_17ekim_6 ile karşılaştırılabilir).

### Tur içi düzeltme
1. Uç gözlerin kesicisi yan duvarın iç yüzüyle aynı düzlemdeydi → Boolean 50 manifold olmayan kenar + arka yüz verdi. Yan duvar 1,2 → 1,1 m (H, 10 cm).

### VARSAYIM'lar
- VARSAYIM: revak tavanı düz beyaz levha (8,0 m); gerçekte kubbe ve aynalı tonoz içleri. Workbench ışığında alt yüz koyu gri görünüyor.
- VARSAYIM: örtü kotları: ortadaki kubbe tepesi 11,8 (Y), yan kubbeler 10,9, aynalı tonoz 10,6 (ön cephe ve fotoğraftan kaba).
- VARSAYIM: sofa bütün revak içinde 0,9 m; ön kemerler sofa seviyesinden açılıyor; giriş merdiveni yok.
- VARSAYIM: ikiz kemer sütunu Ø 0,36 m, üzengi 4,0 m; kemer kilit taşı/rozet süsleri yok (motif kararı gereği).

### Açık sorular (v03 sonu)
1. Revak tavanı: düz beyaz levha mı kalsın, içten görünen kubbe/tonoz çanakları mı eklensin (üçgen artar)?
2. Ön kemerlerin altına giriş merdiveni ve demir parmaklık eklensin mi?
3. Avludaki şadırvan (ts_17ekim_3, eser.md "çevre yapı") cami .glb'sine girsin mi?

## v04 · cami kubbe, kasnak ve pencere detayı (17 Ekim 2026)
Dayanak: tasarım sorumlusunun paylaştığı Yandex 3B model görüntüleri (`ref-img/yandex/yandex_3d_7…10.png`) ve fotoğraflar (`ref-img/ts_17ekim_b_11…21`), envanter cilt-1 PDF s.100–102. kulturenvanteri.com sayfasında mimari ölçü ya da pencere bilgisi yok (yalnız tarihçe; 1905'te doğu kapısının açıldığı).

Betik: `claude/build/build_v04.py` (= v03 + aşağıdakiler). Kontrol `claude/kontrol/v04/`: 12100 üçgen, 50 draw call (sınır ≤ 50), açık/manifold olmayan kenar 0, çakışma 0, kırmızı 0 → **GECTI: true**; `.glb` 172 KB.

### Yandex modeliyle karşılaştırma
| Konu | Yandex | Bizim model | Sonuç |
|---|---|---|---|
| Plan (ters T, mihrap bloğu güneye çıkıntı) | aynı | aynı | uyuyor |
| Son cemaat yeri örtüsü | uçlarda aynalı tonoz (piramit), 2 yan kubbe, ortada kasnaklı kubbe | v03'ten beri aynı | uyuyor |
| Ana gövde kubbeleri | 4 kubbe, hepsi **sekizgen kasnak** | v03'te pahlı kare | **v04'te düzgün sekizgen** |
| Minare | kuzeydoğu, kanatla koridor köşesi | aynı | uyuyor |
| Mihrap bloğu genişliği | ≈ 0,54 × toplam genişlik (tepeden) | 11,3 / 25,7 = 0,44 (Ayverdi planı) | Yandex ölçülü değil; plan (P) korunur |
| Kanat ve koridor çatısı | kasnağa doğru yükselen kurşun çatı | aynı | uyuyor |
| Pencere/kemer | yok (kütle modeli) | — | — |

### Değişenler
| Konu | v03 | v04 | Kaynak |
|---|---|---|---|
| Kasnaklar | pahlı kare (pah 0,30) | **düzgün sekizgen** (pah 0,586) + üstte tuğla testere dişi saçak halkası | E s.100, s.102; Yandex; F |
| Ana kubbe kasnak pencereleri | 4 yüzde 2'şer = 8 | **7** (kuzey yüzü hariç her yüzde 1) | E s.101 "yedi pencere" |
| Mihrap kubbesi kasnak pencereleri | 3 | **3** (G, D, B) | E s.102 "kubbede yer alan üç pencere" |
| Tabhane kasnak pencereleri | 3 | 3 (dış, K, G) | F |
| Üst pencereler | sivri kemer, parmaklık | **yuvarlak kemer, beyaz alçı şebeke** (koyu yuvarlak delikler) | E s.102; F ts_17ekim_b_13, _18 |
| Alt pencereler | dikdörtgen + boşaltma kemeri | **sivri kemer, siyah cam + baklava demir ızgara**, üstte tuğla sivri kemer | E s.102 (1905 tadilatı); F ts_17ekim_b_13, _15 |
| Kasnak pencereleri | sivri | yuvarlak kemer, beyaz şebeke | E s.101 |
| Alemler | yalnız minare | 4 ana kubbe + son cemaat yeri orta kubbesi | F |
| Son cemaat yeri gözleri | ≈ 3,9 m eşit | orta 4,7 m, yanlar 3,7 m | tasarım sorumlusu, Yandex |
| Revak arka duvarı pencereleri | dikdörtgen parmaklık | dikdörtgen, ızgara dokusu | E s.100 "dikdörtgen ... ikişer pencere" |

Pencere sayıları (cephe başına): kanat yan yüzleri 2 üst + 2 alt (+ koridor ucunda 1 küçük üst), mihrap bloğu doğu/batı/güney 2 üst + 2 alt (E s.102 "ikişer pencere"), kanatların güney yüzü 1 + 1, revak arka duvarı kapının iki yanında 2 + 2 (E s.100). Doku: `doku/pencere_sebeke.png`, `doku/pencere_izgara.png` (`doku_uret.py`).
Draw call 60 → 50: kasnak saçakları ve alemler tek `Kasnak_Detay` nesnesinde; revağın arka duvarı `Cami_Koridor` nesnesine alındı (`Cami_KuzeyDuvar_Ust` kalktı).

### Açık sorular (v04 sonu)
1. Kasnaklar fotoğraflarda bazı karelerde sarı sıvalı (2019 öncesi), bugün almaşık; bugünkü hâl korundu. Uygun mu?
2. Tabhane kasnaklarında pencere sayısı fotoğraftan 1/yüz okunuyor; envanterde sayı yok. 3 yüz (dış, K, G) uygun mu?
3. Revak tavanı (düz beyaz levha) ve merdiven/parmaklık soruları v03'ten açık.

## v05 · cami kubbe eteği (17 Ekim 2026, tasarım sorumlusu)
Dayanak: `ref-img/ts_17ekim_c_22_kubbe_etegi.webp` (kuzeybatıdan drone): büyük kubbeler alt kısımda birden dışa açılan kurşun etekle kasnağın üstünü örtüyor; kasnakta kahverengi çıkıntı yok.
Betik: `claude/build/build_v05.py`. Kontrol `claude/kontrol/v05/`: 13294 üçgen, 49 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı 0 → **GECTI: true**; `.glb` 193 KB.

| Konu | v04 | v05 |
|---|---|---|
| Büyük 4 kubbe | basık küre, kasnağın içinden çıkıyor | **etekli kubbe**: kasnak üstünde, kasnak köşesinin 0,25 m dışına taşan kurşun etek (dudak 0,12 m); etek içbükey eğriyle kubbe yüksekliğinin %30'u kadar yükselip kubbeye bağlanır |
| Kasnak üst bandı (4 büyük kubbe) | 0,15 m dışa taşan tuğla saçak halkası | **gömme**: üst 0,3 m duvarla aynı yüzeyde tuğla malzeme, kabartı yok |
| Son cemaat yeri orta kubbesi | tuğla halka | halka ve bant yok; etekli kubbe |
| Mihrap kasnak penceresi tepesi | 12,3 | 12,2 (bandın altında) |
`Kasnak_Detay` artık yalnız alemleri tutuyor. Kasnak üst kapağı eteğin altında kaldığı için ayrı malzeme yok (draw call 53 → 49).

### Kararlar (tasarım sorumlusu, 17 Ekim 2026) · cami v05 ve hamam v02 kabul
1. **Cami v05 kabul**: teslimde `export/orhan-bey-camii_v05.glb` kullanılır (v02–v04 önceki hâller).
2. **Hamam v02 kabul**; külhan bacası eklenmez. Teslim: `export/orhan-bey-hamami_v02.glb`.
3. Sıradaki: Emir Hanı v02 detay turu (B kademe).

## Emir Hanı v02 · detay + renk + çıkış (17 Ekim 2026)
Betik: `claude/build/build_emir_v02.py` (= Emir Hanı v01 kütlesi + detay; B kademe). Kontrol `claude/kontrol/emir_v02/`: 10194 üçgen, 18 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı 0 → **GECTI: true**; `.glb` 90 KB (`export/emir-hani_v02.glb`). Render: `havadan`, `avlu_ici`, `kuzey_giris`, `kuzey_orto`.

| Parça | İçerik | Kaynak |
|---|---|---|
| Dış duvarlar | almaşık doku (cami karosu, 2 tuğla + taş) | E PDF s.108 |
| `Avlu_Revaklari` | avlunun dört cephesinde kenar başına 9 göz: altta sivri tuğla kemerli koyu dükkân açıklığı, taş kat silmesi (5,0 m), üstte yüksek sivri tuğla kemer, beyaz tonoz içi ve beyaz korkuluk | E (36/38 oda), F Emir-Hani-2…5 |
| `Dis_Cephe` | üst katta oda başına küçük pencere (alt kat depoları penceresiz); kuzey ortasında almaşık yuvarlak kemerli giriş (3,4 × 4,6) | E, F Emir-Hani-1 |
| `Sacak` | dışta ve avluda içi boş tuğla saçak halkası | E "kirpi saçak" |
| `Bacalar` | dış çatı yüzünde oda başına baca | E "ocaklı oda", F |
| `Sadirvan`, `Agaclar` | avlu ortasında sekizgen fıskiyeli şadırvan; iki stilize çınar | E PDF s.109, _ortak_stil |

### Tur içi düzeltme
1. Bacalar çatıya 0,4 m gömülüydü (çakışma 0,47) → 0,15 m.

### VARSAYIM'lar
- VARSAYIM: giriş kuzey cephesinin ortasında (fotoğrafta yön belli değil).
- VARSAYIM: kenar başına 9 göz, dört kenar eş; güney revaklarındaki kesme taş paye ve yuvarlak almaşık kemerler (E) ayrı işlenmedi.
- VARSAYIM: baca sayısı dış çatı boyunca eşit aralıklı (≈ 11/kenar); envanterde 38 ocaklı oda.
- VARSAYIM: şadırvan sekizgen havuz Ø 4,0 m; ağaçlar stilize, yerleri tahmin.

### Açık sorular (Emir Hanı v02 sonu)
1. Giriş hangi cephede? (Kuzey varsayıldı.)
2. Güney revaklarında farklı (kesme taş paye, yuvarlak almaşık kemer) düzen işlensin mi?
3. Kabul edilirse üç yapı teslime hazır: cami v05, hamam v02, Emir Hanı v02 (B6: `.glb` → `belgeler` dalı, PR).

### Kararlar (tasarım sorumlusu, 17 Ekim 2026) · Emir Hanı v02 kabul
1. **Emir Hanı v02 kabul**; teslim: `export/emir-hani_v02.glb`.
2. Giriş kuzey cephesinde kalır.
3. Güney revakları ayrıca işlenmez.
4. Üç yapı teslime hazır: cami v05, hamam v02, Emir Hanı v02. Sıradaki: B6 teslim (`.glb` → `belgeler` dalı, PR).
