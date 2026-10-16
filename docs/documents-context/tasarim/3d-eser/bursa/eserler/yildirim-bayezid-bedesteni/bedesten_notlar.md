# Yıldırım Bayezid Bedesteni · model notları

Ölçü ve kaynaklar: `eser.md`. Bu dosya model kararlarını ve varsayımları tutar. Sürüm bölümleri tarih sırasıyladır; en günceli en sondadır.

## GÜNCEL DURUM (16 Ekim 2026, v01b · GEOMETRİ DONDURULDU)
- **Son sürüm:** `claude/build/build_v01b.py` → `claude/blend/bedesten_v01b.blend`, kontrol `claude/kontrol/v01b/` (GECTI: true, 5 532 üçgen, 7 draw call). Henüz .glb yok (v02'de).
- **Üretim:** `blender -b --python claude/build/build_v01b.py` (Blender 5.2). Dal: `3d/bedesten-v01`.
- **Sıradaki:** v02 detay turu (pencereler, kapılar, dükkân cephesi, kubbe dilimleri, doku kararı, palet + AO, Draco .glb). Kütle ölçülerine dokunulmaz; yeni ölçüler P’ye `D_` önekiyle.
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
