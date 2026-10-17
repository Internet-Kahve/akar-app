# Yıldırım Bayezid Bedesteni · model notları

Ölçü ve kaynaklar: `eser.md`. Bu dosya model kararlarını ve varsayımları tutar. Sürüm bölümleri tarih sırasıyladır; en günceli en sondadır.

## GÜNCEL DURUM (17 Ekim 2026, v03 · kabul edildi)
- **Son sürüm:** `claude/build/build_v03.py` → `claude/export/bedesten_v03.glb` (Draco, 157 KB), `claude/blend/bedesten_v03.blend`, kontrol `claude/kontrol/v03/` (GECTI: true, 14 956 üçgen, 20 draw call). Karşılaştırma: `claude/kontrol/denetim/karsilastirma_v03.png`. v02–v02c önceki hâller olarak duruyor.
- **Üretim:** `blender -b --python claude/build/build_v03.py` (Blender 5.2); dokular `claude/build/doku/doku_uret.py` ile. Dal: `3d/bedesten-v01`.
- **Sıradaki:** B6 teslim (`.glb` → `belgeler` dalı, PR). v03 tasarım sorumlusu tarafından kabul edildi (17 Ekim 2026). Belirsizler § v03 sonunda.
- **Ölçülü plan bulundu:** Gabriel planı + enine kesit (`ref/BURSA_BEDESTENI.pdf` PDF s.12, Şekil 3) → `bursa/ref/bedesten_plan_gabriel.png`. Plan ölçek çubuğu 0–20 m (10,15 px/m), kesit 0–5 m (10,2 px/m). Plandan okunan iç mekân 56,8 × 15,3 m; envanterdeki 56,50 × 15,00 m ile 0,3 m içinde tutuyor → ölçek güvenilir.
- **Vaziyet planı:** Bursa çarşısı (EHA 1967), Şekil 2 → `bursa/ref/bedesten_carsi_eha1967.png`. Kuzey yukarıda (Ulucami güneybatıda, Koza Han güneydoğuda).
- Okuma görselleri (1 m ızgara): `claude/kontrol/kaynak/plan_1m_grid.png`, `kesit_1m_grid.png`.

## Klasör düzeni
- `claude/build/build_vNN.py`: üretim betiği (bütün ölçüler en üstteki `P` sözlüğünde)
- `claude/blend/bedesten_vNN.blend` · `claude/export/bedesten_vNN.glb` · `claude/kontrol/vNN/`
- `claude/kontrol/kaynak/`: kaynak okuma görselleri (ızgaralı plan ve kesit)
- `ref-img/`: fotoğraflar (şu an 2 havadan fotoğraf, ikisi de kuzeybatıdan; Ulucami minaresi sağda)
- Eksenler: +X doğu, +Y kuzey; orijin ana salonun ortası. Uzun eksen doğu–batı (OSM yönü 86°, envanter "32 mahzen doğu-batı yönünde").

## Yapının okunuşu (plan + kesit + fotoğraf)
Dıştan içe üç halka, hepsi tek kütle:
1. **Dükkân halkası** (68 dükkân, dışa açılan tonozlu): dört kenarı sarar. Dış duvarı fotoğraftaki almaşık duvardır; zemin katında dışa açılan kemerli dükkân kapıları görülüyor.
2. **Mahzen bandı** (32 mahzen/dolap, kuzey ve güney kenarında 16'şar): salonla dükkân halkası arasında. Dükkân halkasıyla aynı düz çatı altında.
3. **Ana salon** (2 × 7 = 14 kubbe, ekseninde 6 ayak): duvarları ortak çatıdan ≈ 1,5 m yükselir, kubbeler bunun üstünde.
Kapılar dört kenarın ortasında; kuzey ve güney kapısı mahzen bandında kubbeli bir giriş mekânına açılır (planda kesikli daire), doğu ve batı kapısı uç dükkânların arasından salona girer.

## Ölçü tablosu
Kaynak kodu: P = Gabriel planı/kesiti (okuma hassasiyeti ±0,3 m), E = envanter cilt-2 PDF s.29, W = Alkan 2023, O = OSM, H = hesap, F = fotoğraf.

| Ölçü | Değer | Kaynak | Not |
|---|---|---|---|
| Ana salon iç ölçüsü (D–B × K–G) | 56,50 × 15,00 m | E | P 56,8 × 15,3 (tutarlı) |
| Kubbe dizilimi | 2 × 7 | P | E "6 ayağa oturan 14 kubbe" |
| Kubbe gözü (eksen) | 8,07 (D–B) × 7,50 (K–G) m | H | 56,5 / 7, 15 / 2 |
| Kubbe iç Ø | ≈ 6,3 m | P | plandaki kesikli daire 6,3–6,4; kesitte iç 6,1, dış 7,4 |
| Ayaklar | 4 adet ≈ 1,7 × 1,7 m; ortadaki 2 adet ≈ 3,2 × 2,2 m | P | ortadaki ikisi belirgin büyük |
| Ayak başlığı / kemer üzengisi | 5,0 m | P kesit | |
| Salon duvarı üstü (saçak) | 10,0 m | P kesit | |
| Kubbe tepesi (dış) | 12,6–13,0 m | P kesit | iki kubbe çizimde farklı; tek değer 12,8 öneriyorum |
| Mahzen bandı derinliği | 3,3 m + 1,2 m duvar | P | kuzey ve güneyde; doğu–batı uçlarda salon duvarı 1,5 m |
| Mahzen sayısı | 16 + 16 = 32 | P, E | adım ≈ 3,5 m |
| Dükkân halkası derinliği | 4,2 m (K/G), 5,2 m (D/B) | P | |
| Dükkân sayısı / adım | 68 / ≈ 2,9 m | W, P | E: "68 dükkân, ilk yapıyla doğrudan ilişkisi yok"; Gabriel planında ve fotoğrafta yapıyla tek kütle |
| Ortak düz çatı (dükkân + mahzen) | 8,5 m (parapet 8,7) | P kesit | |
| **Toplam dış ölçü (dükkânlar dahil)** | **70,4 × 32,8 m** | P | kesit genişliği 33,0 m ile tutarlı |
| Salon bloğu dış ölçü (mahzen bandı dahil) | 60,0 × 24,4 m | P | |
| Yükseltilmiş salon bloğu (çatı üstü) | 59,5 × 18,0 m | H | iç ölçü + 2 × duvar (1,5 m) |
| Kapı açıklığı (geçit) | ≈ 3,0 m | P | kuzey kapısı dükkân aralığı |
| Arazi | güneye yükselir, güney dükkânlarının dışında ≈ +1,9 m | P kesit | |
| Duvar örgüsü | 3 sıra tuğla + 1 sıra taş almaşık | W s.157 | fotoğrafla uyumlu (F) |
| Kubbe kaplaması | kurşun, dilimli (radyal ek yerleri) | E, F | |

### Kaynak çelişkisi (2 m'den fazla)
- **OSM 61,5 × 21,4 m** ile **plan 70,4 × 32,8 m (dükkânlar dahil)** ya da **60,0 × 24,4 m (salon bloğu)** tutmuyor. OSM ayak izi muhtemelen yalnız kubbeli kısmı çiziyor; genişlik farkı salon bloğuna göre bile 3,0 m. Öneri: **plan (P) kullanılır**, OSM yalnız konum ve yön (86°) için.

## Parça listesi önerisi (.glb)
| Ad | İçerik |
|---|---|
| `Govde` | dükkân halkası + mahzen bandı dış duvarları (70,4 × 32,8 × 8,5 m) |
| `Cati` | ortak düz çatı (8,5 m) ve parapet |
| `Salon` | yükseltilmiş salon duvarları (8,5 → 10,0 m) |
| `Kubbeler` | 14 kurşun kubbe (vurgu 1) |
| `Kapilar` | 4 kapı (güney: kelime-i tevhid kitabesi; batı: "Bezzazistan" yazısı) |
| `Dukkan_Kapilari` | dışa açılan kemerli dükkân kapıları (v02 detay) |
| `Zemin` | kaide (.glb'ye girmez) |
İç mekân (ayaklar, mahzenler, şadırvan) modellenmez: uygulama dıştan bakıyor, kubbeler ayakların yerini zaten belli ediyor.

## Tur planı
1. **v01 kütle:** `Govde` + `Cati` + `Salon` + `Kubbeler` (kasnaksız, düz çatıdan çıkan yarım küreye yakın kubbe) + 4 kapı boşluğu. Pencere ve süs yok. Render: kuzey ortografik, havadan (fotoğraf açısı: kuzeybatıdan), kubbe sırasına yakın; havadan render fotoğrafla yan yana.
2. **v01b (gerekirse):** kubbe yüksekliği / salon basamağı fotoğrafa göre.
3. **Dondurma**, sonra **v02 detay:** dükkân kapıları, 4 ana kapı, kubbe dilimleri, almaşık (karar sorusu 4), palet + AO, Draco .glb.

## VARSAYIM listesi (şimdiden)
- VARSAYIM: zemin düz kaide; güneydeki 1,9 m yükselme modellenmez (soru 3).
- VARSAYIM: kubbe tepesi tek değer 12,8 m; kubbe dış Ø 7,4 m, çatıdan yükseklik 10,0 → 12,8.
- VARSAYIM: ana kapı yüksekliği 4,5 m (kaynakta yok; kesitteki dükkân kemerleri ≈ 5 m'ye çıkıyor).
- VARSAYIM: dükkân dağılımı uzun kenarlarda 2 × 12, kısa kenarlarda 2 × 5, köşelerde 4 (toplam 68; planda sayım gürültülü).

## Açık sorular (B1 sonu)
1. **Ölçü:** OSM (61,5 × 21,4) yerine Gabriel planı (70,4 × 32,8 dükkânlar dahil) kullanılsın mı? (öneri: evet)
2. **Dükkân halkası modele girsin mi?** Envanter "ilk yapıyla ilişkisi yok" diyor, ama Gabriel planında ve fotoğraflarda yapıyla tek almaşık kütle. Öneri: girsin (fotoğraftaki görünüş bu).
3. **Arazi eğimi:** güneydeki ≈ 1,9 m yükselme yok sayılıp düz kaide kullanılsın mı? (öneri: evet)
4. **Doku:** `_ortak_stil.md` bedesten için "gövde üstünde tek yatay çizgi" diyor; fotoğrafta bütün dış duvar almaşık (3 tuğla + 1 taş). Koza Han'daki gibi almaşık karo mu, tek çizgi mi? (v02'de karar verilebilir)
5. **Ek fotoğraf:** yerden güney kapısı (kitabe) ve batı kapısı, bir de kısa cephe karşıdan. Şu an iki fotoğraf da havadan ve aynı açıdan.

### B1 cevapları (tasarım sorumlusu, 16 Ekim 2026)
1. Gabriel planı kullanılır (OSM yalnız konum/yön). 2. Dükkân halkası modele girer. 3. Düz kaide. 4. Doku kararı v02'de.

## v01 · kütle turu (16 Ekim 2026)
Betik: `claude/build/build_v01.py`. Pencere ve süs yok. Sonuç `claude/kontrol/v01/`:
- `kontrol_rapor.json`: 5 532 üçgen, 7 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 8 yönde 0 → **GECTI: true**
- Render: `havadan`, `foto_acisi`, `kuzey_orto`, `bati_orto`, `ust_orto`, `kubbe_yakin`
- Yan yana: `yan_yana_foto.png` (ref `ref-img/da4bcb2a-….jpeg`), `yan_yana_plan.png` (üst orto ↔ Gabriel planı; kubbe dizisi ve dış hatlar örtüşüyor)

Parçalar: `Govde`, `Dukkanlar`, `Cati`, `Kubbeler`, `Kapilar` (+ `Zemin`, `Zemin_Golge`; .glb'ye girmez).

### Tur içi düzeltme 1 (P'den, fotoğraf bindirmesi sonrası)
İlk deneme B1'deki okumayla kuruldu: dükkân halkası + mahzen bandı 70,4 × 32,8 m tek kütle, 8,5 m düz çatı, üstünde 1,5 m yükselen salon. Fotoğrafla yan yana konunca iki fark çıktı:
- Almaşık duvar kubbelere çok yakın; dükkân halkası duvarın dibinde **çok daha alçak** (bugünkü modern damlar).
- Salon basamağı fotoğrafta duvar olarak görünmüyor; kubbelerin çevresi tek kurşun düzlem.
Düzeltme:
- `Govde` = salon + mahzen bandı **60,0 × 24,4 × 8,5 m** (P), almaşık kütle.
- `Dukkanlar` = çevrede halka, dış 70,4 × 32,8 m, **5,0 m** düz çatı.
- `Cati` = mahzen bandı üstünde dış duvardan (8,5) salon duvarına (10,0) yükselen eğimli kurşun çatı (kapalı kesik piramit). `Salon` parçası ve parapet kaldırıldı.
- Kubbeler aynı: 2 × 7, dış Ø 7,4 m, taban 10,0, tepe 12,8 m (P kesit).

### Yeni VARSAYIM'lar
- VARSAYIM: dükkân halkası çatısı 5,0 m (Gabriel kesiti 8,7 gösteriyor, ama 1958 yangını sonrası çarşı yeniden yapıldı; fotoğrafta almaşık duvarın dibinde alçak damlar). Ölçü yok.
- VARSAYIM: mahzen bandının üstü eğimli kurşun çatı (8,5 → 10,0); kesitte düz dolgu çizili, fotoğrafta tek kurşun düzlem görünüyor.
- VARSAYIM: kubbelerde kasnak yok, kubbe doğrudan çatı düzleminden çıkıyor.
- VARSAYIM: dört kapı dükkân halkasının dış yüzünde, 3,0 × 4,5 m (yükseklik kaynakta yok).

### Açık sorular (v01 sonu)
1. **Kubbe yüksekliği:** fotoğrafta kubbeler daha dolgun (yükseklik/çap ≈ 0,48, yarım küreye yakın); modelde P kesitinden 2,8 / 7,4 ≈ 0,38. Kesite sadık kalınsın mı, fotoğrafa göre tepe ≈ 13,5 m'ye mi çıksın? (plan > foto kuralı gereği sormadan değiştirilmedi)
2. **Dükkân halkası yüksekliği** 5,0 m uygun mu? Dükkânların dış görünüşü (bugünkü modern damlar mı, Gabriel'deki tonozlu dükkânlar mı) v02'de mi karar verilsin?
3. Kütle kabul edilirse: "GEOMETRİ DONDURMA v01".

## v01b · kubbe yüksekliği (16 Ekim 2026)
Betik: `claude/build/build_v01b.py` (= v01 + yalnız `kubbe_tepe`). Sonuç `claude/kontrol/v01b/`: 5 532 üçgen, 7 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 0 → **GECTI: true**. Render'lar v01 ile aynı; yan yana `yan_yana_foto.png`, `yan_yana_plan.png`.

### Karar (tasarım sorumlusu)
- Kubbeler fotoğrafa göre dolgun: tepe **12,8 → 13,5 m**, dış Ø 7,4 m aynı → yükseklik/çap 3,5 / 7,4 ≈ 0,47 (yarım küreye yakın). P kesitindeki 12,6–13,0 m'den bilinçli sapma (foto > kesit, tasarım sorumlusunun kararı).
- Başka hiçbir ölçü değişmedi.

### Hâlâ açık
- Dükkân halkası yüksekliği (5,0 m VARSAYIM) ve dış görünüşü (modern dam / tonozlu dükkân) → v02'de.
- Kütle kabul edilirse: "GEOMETRİ DONDURMA v01b", sonra v02 detay turu (doku kararı dahil).

## GEOMETRİ DONDURMA v01b (16 Ekim 2026)
Kütle tasarım sorumlusu tarafından kabul edildi. `build_v01b.py` içindeki kütle ölçüleri (P tablosu) bundan sonra değişmez; v02 ve sonrası yalnız detay, renk ve çıkış ekler. Dondurmadan sonra çıkan kütle kusurları ayrı "kusur turu"nda, biçim değiştirmeden düzeltilir.

### Kararlar (bu oturum)
1. Ölçü kaynağı Gabriel planı ve kesiti (P); OSM (61,5 × 21,4) yalnız konum ve yön için.
2. Almaşık gövde = salon + mahzen bandı, 60,0 × 24,4 × 8,5 m (P).
3. Dükkân halkası modelde: dış 70,4 × 32,8 m (P), çatı 5,0 m (VARSAYIM; fotoğrafta alçak).
4. Mahzen bandının üstü eğimli kurşun çatı, 8,5 → 10,0 m; ayrı salon duvarı görünmez.
5. 2 × 7 = 14 kubbe, dış Ø 7,4 m, taban 10,0 m, tepe 13,5 m (fotoğrafa göre; P kesitinden bilinçli sapma).
6. Dört kapı dört kenarın ortasında, dükkân halkasının dış yüzünde (3,0 × 4,5 m).
7. Zemin düz kaide; güneydeki ≈ 1,9 m yükselme modellenmez.
8. İç mekân (ayaklar, mahzenler, şadırvan) modellenmez.
9. Doku kararı (almaşık karo mı, tek yatay çizgi mi) v02'de verilecek.

## v02 · detay + renk + çıkış (16 Ekim 2026)
Betik: `claude/build/build_v02.py` (= v01b kütlesi + detay; kütle ölçülerine dokunulmadı, yeni ölçüler P'de `D_` önekli). İlk turda doku iki seçenekle üretildi (`AKAR_DOKU` ortam değişkeni); karar sonrası betik almaşığa sabitlendi.

### Kontrol (`claude/kontrol/v02/`)
- 13 556 üçgen (≤ 30 000), 15 draw call (< 50), açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 8 yönde 0 → **GECTI: true** (iki seçenekte de)
- .glb (Draco): almaşık 144 KB, çizgi 143 KB (≤ 1 MB)
- Render: `havadan`, `foto_acisi`, `kuzey_orto`, `bati_orto`, `kubbe_yakin`, `dogu_uc` (ref kırpıntısıyla aynı açı), `kuzey_kapi`
- Seçim görseli: `claude/kontrol/v02_secim/doku_secimi.png` (A / B yan yana + referans fotoğraf)

### Eklenenler
- `Sacak` (yeni): almaşık gövdenin üstünde tek tuğla bant (8,15 → 8,5 m, 0,10 m taşma). Fotoğrafta var; stil kuralındaki "gövde üstünde tek yatay çizgi".
- `Pencereler` (yeni): uzun cephelerde göz ekseninde birer (7 + 7), kısa cephelerde dört (y = ±3,2 / ±5,0, P kesit; fotoğrafta doğu ucunda iki çift). Tuğla yuvarlak kemer çerçeve + taş alınlık + parmaklıklı dikdörtgen pencere (doku/pencere.png, Koza Han ile aynı).
- `Kapilar`: dört kenarın ortasında taş çerçeve (4,4 × 4,7 m) + tuğla kemer bandı + koyu kahve kemerli kapı (3,0 × 4,5 m).
- `Dukkan_Kapilari` (yeni): dükkân halkasının dış yüzünde tuğla kemerli lacivert kepenkler; uzun kenarda 25 modül (2,82 m), kısa kenarda 11 modül (2,98 m), orta modül kapıya ayrılır → 2 × 24 + 2 × 10 = **68** (W).
- `Kubbeler`: dilim sayısı 24 → 32 (biçim ve ölçü aynı); kurşun dilim ve levha ekleri dokuyla (`doku/kubbe_dilim.png`, dilim başına bir karo, 5 levha sırası).
- Palet: gövde #E2B7A4 (eser.md), dükkân halkası krem #E9E3D3, çatı #B9C6CC, kubbe #95AEBA (eser.md), kapı #6B4A3A (eser.md), tuğla bantlar #C6755B, taş #F2F3E5, kepenk lacivert #415072 (_ortak_stil).
- `A.ao_vertex(samples=32)`; dokulu malzemelerde renk = doku × AO.

### Parça listesi (.glb)
`Govde`, `Dukkanlar`, `Cati`, `Kubbeler`, `Sacak`, `Pencereler`, `Kapilar`, `Dukkan_Kapilari`.

### Doku seçenekleri
- **A · almaşık:** gövdenin dört yüzü almaşık karo (3 sıra tuğla + 1 sıra taş, kutu almaşık; 1,2 × 0,6 m; Koza Han karosuyla aynı). Fotoğrafa yakın; `_ortak_stil.md` "doku azdır" kuralına istisna (Koza Han'da da yapıldı).
- **B · çizgi:** gövde düz pembe-kahve, yalnız saçak bandı. Stil kuralına birebir uyar; fotoğraftaki almaşık okunmaz.

### Yeni VARSAYIM'lar
- VARSAYIM: dükkân halkası krem düz duvar, kepenkler lacivert (bugünkü modern cepheler yerine Gabriel planındaki dışa açılan tonozlu dükkân düzeni, sade).
- VARSAYIM: pencere 0,9 × 1,4 m (5,55 → 6,95), tuğla çerçeve 1,6 m, kemer tepesi 7,95 m.
- VARSAYIM: kapı taş çerçevesi 4,4 × 4,7 m, tuğla bant 3,6 m; güney kapısındaki kelime-i tevhid kitabesi eklenmedi (dükkân çatısının altında yer yok; kapılar fotoğrafta görünmüyor).
- VARSAYIM: kubbe kurşun ekleri 32 dilim, 5 sıra (fotoğraftan sayım).

### Açık sorular (v02 sonu)
1. ~~Doku seçimi~~ → aşağıda karara bağlandı (A, almaşık).
2. Güney kapısı kitabesi (kelime-i tevhid) için yerden fotoğraf gelirse kapı çerçevesi ona göre yeniden çizilebilir.

### Karar (tasarım sorumlusu, 17 Ekim 2026)
- **Doku: A · almaşık karo.** Gövdenin dört yüzü almaşık (3 sıra tuğla + 1 sıra taş, kutu almaşık; 1,2 × 0,6 m karo, Koza Han ile aynı) + saçak tuğla bandı. `_ortak_stil.md` "doku azdır" kuralının bilinçli istisnası (fotoğraftaki cephe karakteri; Koza Han'daki karar ile aynı).
- B seçeneği (düz renk + tek saçak çizgisi) elendi; çıktıları (`bedesten_v02_cizgi.*`, `kontrol/v02_cizgi/`) silindi. `build_v02.py`'deki `AKAR_DOKU` seçeneği kaldırıldı; çıktı adları `bedesten_v02.*`, kontrol `claude/kontrol/v02/`.
- Yeniden üretim sonucu değişmedi: 13 556 üçgen, 15 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 0 → **GECTI: true**; `.glb` 144 KB. Yan yana: `yan_yana_foto.png`, `yan_yana_dogu_uc.png`.

## Kaynak denetimi + v02b (17 Ekim 2026)
İstek: modeli kaynaklarla ayrıntılı karşılaştır; 14 kubbeli ana yapı ile çevresindeki ticari yapıların ilişkisini incele; yalnız kaynakların desteklediğini düzelt.
Kaynaklar: envanter cilt-2 PDF s.27 (kuzeyden çapraz havadan fotoğraf → `ref-img/envanter_c2_s27_kuzeyden.png`), s.28 (tam tepeden drone fotoğrafı → `ref-img/envanter_c2_s28_tepeden.png`), s.29 (metin); `ref-img/` havadan fotoğraflar; Gabriel planı ve kesiti; `eser.md`.

### Envanter s.29 metni (doğrudan)
- "Bedestenin merkez mekânı iç ölçüler itibarıyla 15,00 × 56,50 metredir."
- Ticari mekânlar: 32 mahzen ile "bu mahzenlerin önlerinde ve taşıyıcı ayakların çevresinde düzenlenen dükkânlar", hepsi yuvarlak tonozlu → **içerideki ticari birimler** (bedesten içinde).
- "Her bir kapı, kubbeyle örtülü bir giriş mekânına açılır."
- "Bedestenin çevresinde bugün 68 dükkân yer almakta, ancak bunların ilk yapı düzenlemesiyle doğrudan bir ilişkisi bulunmamaktadır." → **dışarıdaki dükkânlar**, sonradan.

### Bulgular
| # | Konu | Sonuç | Dayanak |
|---|---|---|---|
| 1 | Kurşun örtülü yüksek kütlenin sınırı | **HATALI (v02) → düzeltildi.** Yüksek almaşık kütle yalnız merkez mekân + duvarları: ≈ 59,5 × 18,0 m. v02'de mahzen bandı da yüksek gövdenin içindeydi (60,0 × 24,4 m). | s.28 tepeden: kurşun dikdörtgen oranı 3,27 (59,5/18 = 3,31; 60/24,4 = 2,46); kubbe çapıyla (7,4 m) ölçek → ≈ 58,7 × 18,0 m; kubbe sıraları kurşun kenarına ≈ 0,6–0,9 m. s.27 çapraz: kubbeler almaşık duvarın hemen arkasında. E iç ölçü + P duvar 1,5 m. |
| 2 | Mahzen bandı ve dükkânlar | **DOĞRU (alçak bant olarak).** Yüksek kütleyi dört yandan saran koyu, düz, alçak bir çatı bandı var; mahzen bandı (K/G) ve dükkânlar bu bantta. v02b'de alçak `Dukkanlar` kütlesi artık yüksek gövdenin dibinden başlıyor. | s.28: kurşun dikdörtgenin çevresinde kesintisiz koyu düz bant (K/G ≈ 5,7 m, D/B ≈ 2,9 m görünen); s.27 ve ref-img: bu bantın üstünde klima cihazları, uzun cephe pencerelerinin hemen altında. Gabriel kesiti: mahzen ve dükkânlar salon duvarının dışında, ondan alçak. |
| 3 | Ana yapı ile dükkânlar bitişik mi, arada geçit var mı? | **Bitişik; geçit yalnız dört kapı ekseninde (DOĞRU).** Tepeden fotoğrafta bant boyunca açık sokak/zemin görünmüyor. | Gabriel planı (dükkânlar mahzen bandına ve uç duvarlara sırt verir, geçit yalnız 4 kapıda); s.28 bantın sürekliliği. |
| 4 | Fotoğraftaki birleşimler: duvar mı, örtü mü? | **Dış kenar: modern eğik çatıların saçağı.** Bantın dışındaki gri/bej eğik çatılar (Kapalıçarşı sokak örtüleri) bantın dış kenarını örtüyor; görünen bant (≈ 65,5 × 29,5 m) Gabriel'deki dış sınırdan (70,4 × 32,8 m) küçük. Bu modern örtüler modele girmedi. | s.28 ve s.27: eğik çatılar bantın üstüne kadar uzanıyor; altlarındaki duvar görünmüyor. |
| 5 | İç / dış ticari birimlerin ayrımı | **DOĞRU.** İçerideki 32 mahzen ve ayaklar çevresindeki dükkânlar modellenmedi (iç mekân); dışarıdaki 68 dükkân alçak bantın dış yüzünde kepenk olarak var. | E s.29 metni; Gabriel planı. |
| 6 | Yükseklikler | Yüksek gövde saçağı **8,5 → 10,0 m** (P kesit, salon duvarı). Alçak bant 5,0 m (VARSAYIM, foto). **Çelişki:** Gabriel kesiti alçak bant çatısını 8,7 m gösteriyor; ama uzun cephe pencereleri (P kesit 5,6–7,6 m) bütün fotoğraflarda bantın **üstünde** görünüyor → foto seçildi, belirsiz. | P kesit; s.27, ref-img. |
| 7 | Kurşun çatı | Alçak kırma; köşelerden mahya çizgileri görünüyor. v02b'de duvar üstünden (10,0) iç mekân kenarına (10,25) kesik piramit (VARSAYIM eğim). | s.28 köşe çizgileri. |
| 8 | Dört giriş | **BELİRSİZ.** Varlık ve eksen kesin (E: dört cephede kapı, her biri kubbeli giriş mekânına açılır; Gabriel: kenar ortaları). Tepeden fotoğrafta K ve G orta eksende bantın **dış** kısmında küçük kare, sivri örtülü yapılar var (≈ 3 × 3 m); Gabriel'de kubbeli giriş mekânı bantın **iç** kısmında (salona bitişik). ≈ 3 m çelişki → kütle olarak eklenmedi; kapılar alçak bantın dış yüzünde kaldı. D/B girişleri fotoğrafta seçilemiyor. s.27'de kuzey ekseninde modern çatılı bir geçit kapıya uzanıyor. | E s.29; Gabriel; s.28; s.27. |
| 9 | Pencereler | **DOĞRU.** Uzun cephede göz başına bir, kısa cephede iki çift; yükseklikleri alçak bantın üstünde. | ref-img; s.27; P kesit. |

### v02b değişiklikleri (yalnız kaynak destekli)
- `govde_x/y`: 60,0 × 24,4 → **59,5 × 18,0 m** (H: E iç ölçü + P duvar; F tepeden foto).
- `cati_h` (almaşık gövde saçağı): 8,5 → **10,0 m** (P kesit).
- `Cati`: duvar üstünden (10,0) iç mekân kenarına (10,25) alçak kırma kurşun çatı; kubbe tabanı 10,25, tepe 13,5 aynı.
- `Dukkanlar` (alçak bant: mahzen bandı + dükkânlar): iç sınırı yüksek gövdenin dibi; dış sınır 70,4 × 32,8 (P), yükseklik 5,0 (VARSAYIM) değişmedi.
- Pencereler, kapılar, dükkân kepenkleri, saçak bandı, doku ve palet v02 ile aynı. Kontrol: GECTI true, 13 556 üçgen, 15 draw call, .glb 143 KB.

### Değiştirilmeyen belirsizler
- Kubbeli giriş mekânlarının yeri (bantın içi mi dışı mı) ve yüksekliği → yerden ya da daha yakın havadan fotoğraf gerekli.
- Alçak bantın gerçek yüksekliği (P 8,7 / foto ≈ 5) ve dış sınırı (modern saçakların altında).
- D ve B girişlerinin bugünkü bağlantısı.

## v02c · dış dükkân duvarlarına almaşık (17 Ekim 2026)
İstek (tasarım sorumlusu): en dış duvarlara gerçekle uyumlu doku.
- `Dukkanlar` (alçak bant) duvarları krem düz renk (#E9E3D3, v02 VARSAYIM) yerine gövdeyle **aynı almaşık karo** (3 sıra tuğla + 1 sıra taş, 1,2 × 0,6 m). Kepenk kemerleri, kapı çerçeveleri ve çatı aynı.
- Dayanak: Alkan 2023 s.157 "üç sıra tuğla, bir sıra taş almaşık" (yapı geneli); envanter cilt-2 s.56 çarşı sokağı fotoğrafı (`ref-img/envanter_c2_s29_carsi_sokagi.png`): dükkân vitrinlerinin üstünde tuğla kemerli, taş–tuğla örgülü duvar.
- Belirsiz: sokak fotoğrafının hangi cepheye ait olduğu yazılmamış; fotoğrafta duvar loş ve modern tabelalarla örtülü, örgü düzeni (tuğla sıra sayısı) okunamıyor. Bu yüzden yeni bir karo uydurulmadı, gövde karosu kullanıldı.
- `Dukkan_Duvar` malzemesi kaldırıldı. Kontrol: GECTI true, 13 556 üçgen, .glb 143 KB. Görsel: `claude/kontrol/denetim/dis_duvar_v02c.png`.

## v03 · İç Bedesten Sokağı, dış halka çatısı, yükseltilmiş girişler (17 Ekim 2026)
Tasarım sorumlusunun tespiti: ana yapı ile çevresindeki yapı bitişik değil, arada İç Bedesten Sokağı var; dış yapının çatısı düz değil; dış çatının giriş kısımları yükseltilmiş, dört giriş.

### Kontrol edilen kaynaklar
- Yandex harita 2B (`ref-img/yandex_2b_ic_bedesten_sok.webp`): **İç Bedesten Sok.** ana yapının dört yanını dolaşan kapalı bir halka; dış yapının dışında **Dış Bedesten Sok.** → ana yapı ile dış halka arasında sokak var (**DOĞRULANDI**). Yandex'in 3B ayak izleri kaydırılmış çizildiği için ölçü buradan alınmadı.
- Envanter s.28 tepeden: dış halka çatısı **kırma** (iç saçaktan ≈ 5,0 m içeride mahya, dört köşede mahya çizgisi); kurşun gövde ile halka saçağı arasında K/G ≈ 5,6 m, D/B ≈ 2,5 m koyu bant (sokak; üstü kısmen hafif örtülü, klima ve sundurmalar). Batı ortasında ≈ 7,5 m genişliğinde ayrı çatı parçası; doğuda da benzer.
- Envanter s.27 kuzeyden: kuzey ortasında halka çatısından yüksek, kalkanı kuzeye bakan giriş çatısı; önüne cam örtülü çarşı sokağı bağlanıyor.
- ref-img / tasarım sorumlusunun fotoğrafı: dış halkanın uzun eğik metal çatısı.
- Envanter s.29: 68 dükkân ilk yapıya ait değil; Gabriel planındaki bitişik dükkân halkası 1958 yangını öncesi düzen → bugünkü durumu göstermiyor.

### Değişiklikler (v02c → v03)
- `Dukkanlar`: gövdeye bitişik düz halka (70,4 × 32,8 × 5,0 m) yerine **İç Bedesten Sokağı ile ayrılan dış halka**. Sokağa bakan duvar yüzü ±32,85 / ±15,2 m, dış yüz ±41,65 / ±24,0 m (≈ 83,3 × 48,0 m), duvar derinliği 8,8 m, almaşık.
- Dış halka çatısı: **kırma metal çatı**, saçak 4,5 m, mahya 6,5 m (ortada), 0,6 m saçak taşması, köşelerde mahya. Renk açık gri-bej #C9C3B6.
- `Girisler` (yeni): dört eksende halkayı enine kesen **yükseltilmiş giriş bölümleri**, 7,5 m geniş, saçak 6,6 m, kalkan tepesi 8,0 m; kalkanlar sokağa ve dışarıya bakar.
- `Gecitler` (yeni): giriş bölümlerinin iki kalkan yüzünde tuğla kemerli geçit açıklığı (3,0 m).
- `Ic_Bedesten_Sokagi` (yeni): gövde ile dış halka arasında taş döşeme; genişlik K/G 6,2 m, D/B 3,1 m.
- `Kapilar`: dört ana kapı dış halkadan **ana yapının duvarına** alındı (E s.29: kapılar bedestenin dört cephesinde).
- `Dukkan_Kapilari`: dış halkanın dış yüzünde (Dış Bedesten Sok.) ≈ 2,9 m modülle kepenkler; giriş bölümlerinin önü boş. Sayı artık 68'e sabit değil (halka büyüdü).
- Ana yapı (gövde, kurşun çatı, kubbeler, pencereler, saçak) v02c ile aynı.

### Yeni VARSAYIM'lar
- VARSAYIM: dış halka çatısı simetrik (mahya ortada) → duvar derinliği 8,8 m; halkanın dış sınırı fotoğraf karesinin dışında kalıyor.
- VARSAYIM: sokak genişliği = tepeden fotoğraftaki görünen bant + 0,6 m saçak taşması.
- VARSAYIM: yükseklikler (halka saçağı 4,5, mahya 6,5; giriş 6,6 / 8,0) kaynakta yok, fotoğraflardaki oranlardan tahmin.
- VARSAYIM: dört girişin genişliği batıdaki ölçümle aynı (7,5 m); kuzey ve güney girişinin genişliği fotoğrafta net değil.

### Belirsiz / modele girmeyen
- Sokağın üstündeki hafif örtüler, sundurmalar ve klima cihazları (tepeden fotoğrafta koyu bant) → modellenmedi, sokak açık bırakıldı.
- Dış halkanın sokağa bakan iç yüzünde dükkân açıklıkları olup olmadığı → kaynak yok, düz almaşık bırakıldı.
- Envanterdeki "kubbeli giriş mekânları": ana yapının içinde mi, giriş bölümlerinde mi? Bu sürümde ayrıca modellenmedi.
- Güney kapısı kitabesi.
