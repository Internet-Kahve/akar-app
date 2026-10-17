# Orhan Bey Külliyesi · model notları

Ölçü ve kaynaklar: `eser.md`. Bu dosya model kararlarını ve varsayımları tutar. Sürüm bölümleri tarih sırasıyladır; en günceli en sondadır.

## GÜNCEL DURUM (17 Ekim 2026, cami v01 kütle turu)
- **Son sürüm:** `claude/build/build_v01.py` (cami kütlesi) → `claude/blend/orhan-bey-camii_v01.blend`, kontrol `claude/kontrol/v01/` (GECTI: true, 2 350 üçgen, 30 draw call). .glb henüz yok (v02'de).
- **Bindirme:** `claude/build/yan_yana.py v01` → `kontrol/v01/bindirme_bati_orto.png`, `bindirme_kuzey_orto.png` (render ile Ayverdi çizimi aynı ölçekte, 35 px/m, zemin hizalı).
- **Üretim:** `blender -b --python claude/build/build_v01.py` (Blender 5.2). Dal: `3d/orhan-bey-kulliyesi-v01` (Bedesten dalının ucundan; main'de `3d-eser` yok).
- **Cami kütlesi donduruldu (GEOMETRİ DONDURMA v01, 17 Ekim).** Sıradaki: hamam v01 kütlesi; caminin v02 detayı (kanat çatıları dahil) sonra.
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
