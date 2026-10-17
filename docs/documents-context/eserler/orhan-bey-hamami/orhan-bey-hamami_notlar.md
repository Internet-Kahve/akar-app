# Orhan Bey Hamamı / Aynalı Çarşı · model notları

Külliye üretim günlüğünden ayrılan eser bölümleri. Tarihli ölçü ve varsayımlar korunmuştur. Ortak yerleşim ve kaynak geçmişi: [külliye notları](../orhan-bey-kulliyesi/orhan-bey-kulliyesi_notlar.md).

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

