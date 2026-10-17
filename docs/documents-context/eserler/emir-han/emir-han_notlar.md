# Emir Hanı · model notları

Külliye üretim günlüğünden ayrılan eser bölümleri. Tarihli ölçü ve varsayımlar korunmuştur. Ortak yerleşim ve kaynak geçmişi: [külliye notları](../orhan-bey-kulliyesi/orhan-bey-kulliyesi_notlar.md).

## 3. Emir Hanı · ölçü tablosu (ön okuma)
| Ölçü | Değer | Kaynak | Not |
|---|---|---|---|
| Dış ölçü | ≈ 45 × 45 m | E PDF s.108 | EHA yatay 45,5 m ✓ |
| Avlu | ≈ 650 m² (≈ 25 × 26 m) | E, H | |
| Kat | 2; alt 36, üst 38 oda; revaklı avlu, şadırvan, çınarlar | E | |
| OSM | adsız way 1271724730 (Ulucami'nin kuzeyi), 57,5 (D–B) × 50,9 (K–G) m | O | EHA'da çekirdeğin doğu ve batısına bitişik dükkân sıraları var → toplam ≈ 57 m (EHA yatay ✓). **> 2 m çelişki** E 45 ↔ O 57,5 / 50,9 |
| Yükseklik | yok | — | T: 2 katlı Bursa hanı, saçak ≈ 9–10 m (Koza Han ile karşılaştırılacak) |
| Malzeme | 2 sıra tuğla + 1 sıra küfeki almaşık; revaklar tuğla, 2 sıra kirpi saçak | E | |

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
