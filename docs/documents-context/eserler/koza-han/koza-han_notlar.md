# Koza Han · model notları

Ölçü ve kaynaklar: `eser.md`. Bu dosya model kararlarını ve varsayımları tutar. Aşağıdaki sürüm bölümleri tarih sırasıyladır; en günceli en sondadır.

## GÜNCEL DURUM (16 Ekim 2026, v02o)
- **Son sürüm:** `claude/build/build_v02o.py` → `claude/export/koza-han_v02o.glb` (492 KB), `claude/blend/koza-han_v02o.blend`, kontrol `claude/kontrol/v02o/` (GECTI: true, 29 450 üçgen, 48 draw call).
- **Üçgen bütçesi dolu** (29 450 / 30 000). Yeni ayrıntı eklemek için önce başka yerden azalt (ör. `Avlu_Cephe` kapı kemerleri, revak kemer segmentleri, kubbe halkası).
- **Ana ölçüler (v02n yön düzeltmesinden sonra):** dış 51,7 (ön/arka, x) × 59,7 (yan, y); avlu 38 × 46; kanat 6,85 m; kubbe ve avlu kemeri ön/arka 9, yanlar 11, köşe 4, portal 3; portal kuzeyde (+y), kısa kenarda.
- **Dokular** `claude/build/doku/` içinde, hepsi `doku_uret.py` ile yeniden üretilir (`uv run --no-project --python 3.12 --with pillow python doku_uret.py`). v02o şunları kullanır: `almasik`, `kesme_tas`, `korkuluk`, `pencere`, `petek`, `petek_korkuluk`, `baca`, `portal_on_v02m`. Portal köşeliği `ref img/portal_kose.png` çiziminden, örgü `ref img/portal_orgu.png` çiziminden.
- **Üretim:** `blender -b --python claude/build/build_v02o.py` (Blender 5.2). Betik sonunda kontrol_hepsi, AO, Draco .glb ve render'ları yazar.
- **Araçlar** (`claude/build/araclar/`): `blender_yukle.py <sürüm>` sürümü açık Blender'a yükler (MCP for Blender eklentisi bağlı olmalı); `yan_yana.py` render ile referansı yan yana birleştirir.
- **Yeni sürüm yaparken:** son betiği `build_vNNx.py` olarak kopyala, `SURUM`'u ve başlık yorumunu güncelle, yeni ölçüleri `P`'ye `D_` önekiyle ekle, kararları bu dosyanın sonuna yeni bölüm olarak yaz.
- **Açık sorular:** portalın gerçek pusula yönü ve `eser.md`'deki yön etiketleri (v02n notu); güney kapısı; İç Koza (ahır avlusu, plan gerekli); saçak altı tuğla korniş ve zikzak bant; mescit alt kat kemerleri fotoğrafta daha büyük.
- **Git:** değişiklikler `3d/koza-han-v01` dalında, **commit edilmedi** (v01–v02b dosyaları stage'de; git'e ad/e-posta tanımlı değil).

## Klasör düzeni
- `claude/build/build_vNN.py`: üretim betiği (bütün ölçüler en üstteki `P` sözlüğünde)
- `claude/blend/koza-han_vNN.blend`: betiğin kaydettiği sahne
- `claude/kontrol/vNN/`: render'lar, `kontrol_rapor.json`, referansla yan yana görseller
- `claude/build/doku/`: doku karoları ve üreticisi `doku_uret.py`
- `claude/build/araclar/`: `blender_yukle.py`, `yan_yana.py`
- `ref img/`: referans fotoğraflar ve tasarım sorumlusunun çizimleri
- Eksenler: +X doğu, +Y kuzey (portal tarafı); orijin ana avlunun ortası (mescit ekseni).

## v01 · kütle turu (16 Ekim 2026)
Pencere ve süs yok. Sonuç `claude/kontrol/v01/`:
- `kontrol_rapor.json`: 7 416 üçgen, 18 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı (arka yüz) oranı 8 yönde 0 → **GECTI: true**
- `havadan.png`, `kuzey_orto.png`, `mescit_yakin.png`, `ust_orto.png`
- `yan_yana_havadan.png` (ref: `ref img/3dmodel/1.webp`), `yan_yana_kuzey.png` (ref: `3dmodel/w1.webp`), `yan_yana_mescit.png` (ref: `ref img/BENIOKU.jpg`)

Parçalar: `Govde_Dis`, `Avlu_Revak`, `Cati`, `Baca`, `Portal`, `Avlu_Mescit`, `Avlu_Zemin`, `Zemin`.
`Baca` eser.md parça listesine eklendi (ref fotoğraflarda çatı siluetinin ana öğesi).

### Hesaplanan ölçü
- H: kanat derinliği = (59,7 − 46) / 2 = (51,7 − 38) / 2 = **6,85 m**. OSM dış ölçüsü ile W avlu ölçüsü dört kenarda aynı derinliği veriyor; ikisi tutarlı kabul edildi.

### VARSAYIM listesi (eser.md'de boş olan alanlar)
- VARSAYIM: alt kat yüksekliği 5,0 m, üst kat 4,5 m → saçak 9,5 m (kaynakta yükseklik yok; fotoğraftan ölçülmedi).
- VARSAYIM: revak derinliği 3,0 m, oda derinliği 3,85 m.
- VARSAYIM: revak göz sayısı doğu–batı kenarlarda 13, kuzey–güney kenarlarda 11 (ref 3D model görselinden sayım; plan yok).
- VARSAYIM: alt kat taş ayak 0,9 × 0,9 m, kemer kuşağı 1,2 m; üst kat ahşap dikme 0,35 m, kiriş 0,8 m.
- VARSAYIM: revak üstü sundurma çatısı avluya doğru 0,7 m düşer.
- VARSAYIM: üst kat her oda tek kubbe (Ø 3,0 m, yükseklik 1,2 m), kubbeler oda bandının ortasında.
- VARSAYIM: oda başına bir baca, dış duvar tarafında (0,7 × 0,7 m, çatıdan 1,8 m).
- VARSAYIM: portal kuzey cephesinde (Uzunçarşı tarafı), 14 m geniş, 2,5 m çıkıntılı, saçaktan 1,2 m yüksek; kapı 5 m geniş, 7 m yüksek.
- VARSAYIM: mescit ayak çemberi R 3,6 m, ayak Ø 0,9 m, kemer kuşağı üstü 4,0 m, beden 3,6 m, kubbe yüksekliği 2,8 m.
- VARSAYIM: şadırvan havuzu R 4,6 m, 0,6 m yüksek.
- VARSAYIM: mescit merdiveni kuzeyden (portal yönünden) çıkar; 14 basamak (E), basamak 0,3 m, genişlik 1,4 m.
- VARSAYIM: palet eser.md "Stil rengi" sütunundan; oda kubbeleri terakota (çatı rengi), mescit kubbesi lavanta-mavi (vurgu 1).

### Modele girmeyen
- Doğudaki ahır-depo ve ikinci avlu (İç Koza, 22 × 30 m avlu): avlunun dış ölçüsü, kanat derinliği ve hana bağlanma şekli kaynakta yok. v01'e eklenmedi, karar bekliyor.

### Açık sorular (v01 sonunda)
1. ~~Kubbeler avlu tarafında mı?~~ → v01b'de karara bağlandı.
2. ~~Portalın üstüne 3 kubbe?~~ → v01b'de karara bağlandı.
3. Güney cephesinde (Koza Parkı tarafı) ikinci kapı var mı?
4. İç Koza (ahır avlusu) bu modele girecek mi? Girecekse dış ölçü için plan (cilt-2 PDF s.12) gerekiyor.
5. Kat yükseklikleri: güney cephe fotoğrafından (`Bursa_Koza_Han_South_exterior_in_2006_3029.jpg`) ölçülsün mü?

## v01b · kütle düzeltmesi (16 Ekim 2026)
Betik: `claude/build/build_v01b.py`. Sonuç `claude/kontrol/v01b/`: 7 642 üçgen, 19 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 0 → **GECTI: true**.

### Kararlar (tasarım sorumlusu, ref `ref img/3dmodel/w1.webp`, `1.webp`)
- Kubbeler kanadın avlu tarafında, revak bandının üstünde: göz başına bir kubbe + 4 köşe kubbesi. Yeni parça `Kubbe_Avlu`.
- Kanadın dış yarısında dışa eğimli çatı: mahya oda/revak çizgisinde, saçak dış duvardan 0,4 m taşar. v01'deki revak sundurması kaldırıldı.
- Portalın üstünde 3 kubbe. Sığması için portal çıkıntısı 2,5 → 3,5 m, saçak üstü 1,2 → 1,8 m.
- Bacalar kubbe aralarında, revak bandı üstünde (ref modeldeki gibi). Uç aralıklar köşe kubbesine çarptığı için boş.

### Yeni VARSAYIM'lar
- VARSAYIM: avlu tarafı kubbe Ø 2,6 m, yükseklik 1,1 m.
- VARSAYIM: dış çatı mahya–saçak farkı 1,5 m, saçak kalınlığı 0,15 m.
- VARSAYIM: portal kubbesi Ø 3,0 m, yükseklik 1,3 m, portal genişliğine eşit aralıklı.
- VARSAYIM: baca 0,6 × 0,6 m, revak bandından 1,4 m yüksek.

### Hâlâ açık
- Güney kapısı, İç Koza (ahır avlusu), kat yüksekliklerinin fotoğraftan ölçümü (yukarıdaki 3–5. sorular).
- Kütle kabul edilirse sıradaki adım: "GEOMETRİ DONDURMA v01b", sonra v02 detay turu.

## GEOMETRİ DONDURMA v01b (16 Ekim 2026)
Kütle tasarım sorumlusu tarafından kabul edildi. `build_v01b.py` içindeki kütle ölçüleri (P tablosu) bundan sonra değişmez; v02 ve sonrası yalnız detay, renk ve çıkış ekler. Dondurmadan sonra çıkan kütle kusurları ayrı "kusur turu"nda, biçim değiştirmeden düzeltilir.

### Kararlar (bu oturum)
1. Dış ölçü 59,7 × 51,7 m (O) ve avlu 46 × 38 m (W) birlikte kullanılır; kanat derinliği 6,85 m (H).
2. Kubbe sırası kanadın avlu tarafında (revak bandı üstünde); dış yarıda dışa eğimli çatı.
3. Portal kuzey cephesinde, 3,5 m çıkıntılı, üstünde 3 kubbe.
4. Köşk mescit avlu ortasında; merdiven kuzeyden çıkar.
5. İç Koza (ahır avlusu) modelde yok; plan bulunmadan eklenmez.

## v02 · detay + renk + çıkış (16 Ekim 2026)
Betik: `claude/build/build_v02.py` (= v01b + detay; kütle ölçülerine dokunulmadı, yeni ölçüler P'de `D_` önekli).
Teslim: `claude/export/koza-han_v02.glb` (Draco, **171 KB**). Sahne: `claude/blend/koza-han_v02.blend`.

### Kontrol (`claude/kontrol/v02/kontrol_rapor.json`)
- 19 426 üçgen (hedef ≤ 30 000), 28 draw call (< 50)
- Açık / manifold olmayan kenar 0, çakışma (≥ 0,3 m) 0, kırmızı (arka yüz) oranı 8 yönde 0 → **GECTI: true**
- Render: `v02_havadan`, `v02_kuzey_orto`, `v02_portal`, `v02_mescit`, `v02_avlu_revak`
- Yan yana: `yan_yana_havadan` (ref 3D model), `yan_yana_portal` (`Koza_han_DSCF1631.jpg`), `yan_yana_cephe` (güney cephe fotoğrafı)

### Eklenenler
- `Avlu_Revak`: alt kat ayaklar arası sivri kemerler (iki merkezli, R = 0,55 × açıklık), üst kat ahşap korkuluk (0,9 m).
- `Avlu_Cephe` (yeni): revak arkasında göz başına alt kat dükkân kapısı (1,4 m) ve üst kat oda kapısı (1,2 m).
- `Cephe_Kuzey/Guney/Dogu/Bati` (yeni): üst kat oda başına 2 pencere (W), alt kat oda başına 1 küçük pencere (F); portalın önünde pencere yok.
- `Silme_Kat` (yeni): kat hizasında tek terakota bant (han türünde almaşık yalnız portalde ve bir bantta).
- `Portal` (vurgu 2): terakota dikdörtgen çerçeve ve kapı çevresinde yuvarlak kemer bandı (fotoğraftaki burmalı silmelerin sade karşılığı).
- `Avlu_Mescit` (vurgu 1): 8 yüzde yuvarlak kemer bandı (beden yüzüyle aynı hizada), 6 pencere, kuzey yüzde kapı, güney (mihrap) yüzü penceresiz (E cilt-1 s.195).
- Kaide: `Zemin` çim diski (#A0B46C) + `Zemin_Golge` pembe elips (#E29B87); ikisi de .glb'ye girmez.
- `A.ao_vertex(samples=32)`: AO vertex rengine; renk düz malzemede.

### Parça listesi (.glb)
`Govde_Dis`, `Avlu_Revak`, `Avlu_Cephe`, `Cephe_Kuzey`, `Cephe_Guney`, `Cephe_Dogu`, `Cephe_Bati`, `Silme_Kat`, `Cati`, `Kubbe_Avlu`, `Baca`, `Portal`, `Avlu_Mescit`, `Avlu_Zemin`.

### Yeni VARSAYIM'lar
- VARSAYIM: revak kemerleri hafif sivri; açıklık ayaklar arası, üzengi kemer tepesinin altında.
- VARSAYIM: üst kat dış pencereleri 1,0 × 2,0 m, ikili, aralarında 1,6 m; alt kat pencereleri 0,8 × 1,1 m, altı 1,8 m.
- VARSAYIM: portal çerçevesi 8,6 m geniş, 8,4 m yüksek, bant 0,45 m; mavi çini kemer köşelikleri eklenmedi (eser.md vurgu/doku tablosunda yok).
- VARSAYIM: mescit pencereleri 0,8 × 1,9 m yuvarlak kemerli (kaynakta "sivri kemerli alınlık"; pencere kendisi yuvarlak çizildi), kapı 1,0 × 2,2 m.

### Referansla farklar (v02b için sorular)
1. Güney cephe fotoğrafında üst kat pencereleri **ikili değil, eşit aralıklı** ve **dikdörtgen**; üstlerinde **sivri tuğla boşaltma kemeri** var. W kaynağı "her odanın ikişer penceresi" diyor; fotoğrafta da göz başına iki pencere düşüyor olabilir. Eşit aralığa ve dikdörtgen + sivri kemer alınlığa geçilsin mi?
2. Portalın mavi çini kemer köşelikleri (fotoğrafta belirgin) eklensin mi? Şu an eser.md'de vurgu/doku olarak tanımlı değil.
3. Saçak altındaki testere dişi tuğla korniş (fotoğrafta) — stil kuralı "tek bant" dediği için eklenmedi.

## v02b · üst kat pencereleri (16 Ekim 2026)
Betik: `claude/build/build_v02b.py` (= v02 + yalnız üst kat dış pencereleri). Teslim: `claude/export/koza-han_v02b.glb` (Draco, **220 KB**).
Kontrol: 25 122 üçgen (≤ 30 000), 32 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 0 → **GECTI: true**.
Yeni render: `v02b_guney_cephe.png` (fotoğraf açısı); yan yana: `yan_yana_guney_cephe.png` (ref `Bursa_Koza_Han_South_exterior_in_2006_3029.jpg`).

### Karar (tasarım sorumlusu)
- Üst kat dış pencereleri **eşit aralıklı** (oda başına 2 [W], adım = göz genişliği / 2: doğu–batı cephelerde 1,77 m, kuzey–güney cephelerde 1,73 m), **dikdörtgen**, üstlerinde **sivri tuğla kemer alınlığı** (terakota bant). Köşe odalarında aynı adım sürer.

### Yeni VARSAYIM'lar
- VARSAYIM: üst kat penceresi 0,9 × 1,7 m dikdörtgen, altı döşemeden 0,9 m (F, fotoğraftan oran).
- VARSAYIM: kemer alınlığı pencereden 0,15 m yukarıda, iç açıklık pencereden her yanda 0,15 m geniş, bant 0,18 m, R = 0,55 × dış açıklık (eş merkezli iç kemer).
- Not: tuğla alınlıklar bütün üst kat pencerelerinde; `_ortak_stil.md` "doku azdır" kuralının bilinçli istisnası (fotoğraftaki cephe karakteri).

### Fotoğrafla kalan farklar
1. Alt kat pencereleri fotoğrafta da **dikdörtgen** ve **her iki üst pencereden birinin altında**; modelde oda ortasında, yuvarlak kemerli.
2. Fotoğrafta kat silmesi yok, saçak altında testere dişi korniş var (stil kuralı gereği tek bant tutuldu).

## v02c · çatı düzeltmesi (16 Ekim 2026)
Betik: `claude/build/build_v02c.py` (= v02b + yeni çatı). Teslim: `claude/export/koza-han_v02c.glb` (Draco, **227 KB**).
Kontrol: 26 060 üçgen (≤ 30 000), 33 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 0 → **GECTI: true**.
Yeni render: `v02c_cati.png`; yan yana: `yan_yana_cati.png` (ref `ref img/3dmodel/cati_ref.webp`, tasarım sorumlusunun verdiği görsel).

### Karar (tasarım sorumlusu) — dondurulmuş kütlede bilinçli değişiklik
v01b'deki dışa eğimli `Cati` kaldırıldı; kanat çatısı dıştan içe üç bant:
1. **Saçak şeridi** (1,2 m, H + 0,2 m, dış duvardan 0,4 m taşar) ve üstünde **dış baca sırası** (oda başına bir baca; portal arkasında yok).
2. **Beşik tonoz** oda bandının üstünde (genişlik 2,65 m, yükseklik 1,1 m). Kuzey/güney tonozları köşeden köşeye; doğu/batı tonozları onlara dayanır, uçta yarım daire alın görünür.
3. **Kubbe sırası** (v01b'deki gibi) + bacalar; avlu kenarında **korkuluk duvarı** (0,25 m kalın, H + 0,8 m).
Diğer kütle (kanat, revak, portal, mescit) değişmedi.

### Yeni VARSAYIM'lar (M: ref 3D model görselinden oran)
- VARSAYIM: saçak şeridi 1,2 m, tonoz yüksekliği 1,1 m, korkuluk 0,8 m (M).

## v02d · kubbe/baca düzeni + portal işlemeleri (16 Ekim 2026)
Betik: `claude/build/build_v02d.py` (= v02c + yeni çatı düzeni + portal süsü). Teslim: `claude/export/koza-han_v02d.glb` (Draco, **260 KB**).
Kontrol: 28 910 üçgen (≤ 30 000; sınıra yakın), 34 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 0 → **GECTI: true**.
Render: `v02c_cati.png` (çatı yakın), `v02_portal.png` (portal yakın) ve diğerleri `claude/kontrol/v02d/`.

### Kararlar (tasarım sorumlusu, havadan fotoğraf ve tarif)
- **Kubbe sayısı:** ön/arka (kuzey/güney) 10'ar, yanlar (doğu/batı) 11'er, köşelerde 4, portal üstünde 3 → toplam 49. Kubbeler **yan yana** (aralarında 2 cm).
- **Çatı kesiti** (avludan dışa): korkuluk → kubbeler (derinlik 3,2 m) → **vadi**: her kubbenin arkasında bir baca (kubbe ile kabarık arası) → **kabarık** (beşik tonoz, 1,95 m geniş, 0,9 m yüksek), tepesinde kubbe başına bir baca → saçak şeridi (0,8 m).
- **Köşe bacaları** (4) en dışta, kabarığın dışında, saçak köşelerinde.
- Bacalar artık kubbelerin arasında değil.
- **Portal işlemeleri:** çerçeve ve kapı kemerinde burmalı silme (45° eğik boncuk dizisi), çerçeve içinde kemer üstü mavi çini alanı (düz renk #4F9BD0), üst kenarda dişli korniş (terakota şerit + aşağı bakan dişler).

### Yeni VARSAYIM'lar
- VARSAYIM: kubbe tabanı adım boyunca uzun elips (ön/arka 4,6 × 3,2 m, yanlar 3,45 × 3,2 m), yükseklik 1,4 m (M).
- VARSAYIM: burma boncuğu 0,22 × 0,09 m, aralık 0,3 m; korniş dişi 0,35 m (F, portal fotoğrafı).

### Açık soru
- Ön/arka kenarda 10 kubbe, yanlarda 11 kubbe var ama planda ön/arka kenar (doğu–batı 46 m avlu) yanlardan (38 m) uzun. Bu yüzden ön/arka kubbeler daha uzun elips. Portal gerçekte kısa kenarda mı? (OSM dış ölçüsü 59,7 doğu–batı × 51,7 kuzey–güney; portal kuzeyde kabul edildi.) Yanıt yön ya da ölçü değişikliği gerektirebilir.
- Revak göz sayısı (13 / 11) kubbe sayısından (10 / 11) bağımsız kaldı; eşitlensin mi?
- Portal çerçevesindeki altıgen zincir motifi eklenmedi (üçgen bütçesi 30 000 sınırına yakın).

## v02e · pencere, renk ve doku (16 Ekim 2026)
Betik: `claude/build/build_v02e.py` (= v02d + pencere/renk/doku). Teslim: `claude/export/koza-han_v02e.glb` (Draco, **275 KB**, dokular gömülü).
Kontrol: 27 890 üçgen, 41 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 0 → **GECTI: true**.
Yan yana: `kontrol/v02e/yan_yana_pencere.png` (ref `ref img/pencere_ref.webp`, tasarım sorumlusunun verdiği cephe fotoğrafı).

### Kararlar (tasarım sorumlusu)
- **Pencereler:** beyaz taş söve + siyah cam + kahverengi demir parmaklık (4 dikey × 6 yatay) + ahşap kasa. Alt kat pencereleri de artık dikdörtgen ve aynı tipte. Parmaklık geometri değil doku: her pencere tek levha (12 üçgen); çubukları modellemek ≈ 13 000 üçgen eklerdi.
- **Duvar dokusu:** taş–tuğla almaşık, küçük tekrar eden karo `claude/build/doku/almasik.png` (1,2 × 0,6 m; 3 sıra tuğla + taş sırası, taşlar arasında dikey tuğla). Düz renkli, stilize; fotoğraf dokusu değil. Dış cephe, avlu cephesi ve revak ayaklarında.
- **Renkler** (fotoğraftan): tuğla #B4553A, taş #C9BCA5, kubbe/kabarık/portal kubbeleri kurşun gri #9AA1A6, saçak #6E7275, baca külahı #5F6266, portal gövdesi kesme taş #D6CAB3, burmalı silme açık taş #E6DCC8, cam/boşluk #1E1F21, dükkân kapıları ahşap #6B4A33.
- Kemer alınlıkları daha sivri (R = 0,72 × açıklık).
- Mescit kubbesi lavanta-mavi kaldı (vurgu 1, kurşun çatıdan ayrışsın).
- Karolar `claude/build/doku/doku_uret.py` ile yeniden üretilir.

### Stil kuralından sapma
- `_ortak_stil.md` "doku azdır, duvarın tamamına kaplanmaz" diyor; almaşık karo bütün duvarlarda. Tasarım sorumlusunun isteği; karo küçük ve düz renkli tutuldu (Yöntem Notları §2.1: "küçük, tekrar eden karolar").

### Fotoğrafla kalan farklar
- Saçak altındaki testere dişi korniş ve zikzak/meander tuğla bandı yok (kat silmesi duruyor).
- Bacalarda pencere delikleri yok.

## v02f · avlu üst katı (16 Ekim 2026)
Betik: `claude/build/build_v02f.py` (= v02e + avlu üst katı). Teslim: `claude/export/koza-han_v02f.glb` (Draco, **276 KB**).
Kontrol: 27 986 üçgen, 42 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 0 → **GECTI: true**.
Yan yana: `kontrol/v02f/yan_yana_avlu.png` (render `v02f_avlu_ust.png`, ref `ref img/avlu_ust_kat_2.webp`; diğer ref `avlu_ust_kat_1.webp`).

### Kararlar (tasarım sorumlusu)
- Üst kat revakı: ahşap dikmeler kaldırıldı; alt kattaki gibi **kesme taş ayaklar + sivri kemerler** (R = 0,75 × açıklık, alt kattan daha sivri). Üst kuşak da kesme taş.
- **Beyaz korkuluk** (0,9 m): babalar dokuda (`doku/korkuluk.png`, 0,6 × 0,9 m karo).
- **Üst kat avlu yüzleri kesme taş**, iki ton, şaşırtmalı sıralar (`doku/kesme_tas.png`); oda duvarının üst katı 2 cm önde ince kaplama halkasıyla. **Alt kat almaşık** kalır.
- **Tuğla tonu açıldı:** malzeme #B4553A → #C97C60; `almasik.png` tuğla renkleri de açıldı.
- Bütçe için: revak kemerleri 4 segment, kubbe tabanı 16 → 12 segment.

### Not
- `doku/almasik.png` paylaşılan dosya; v02f'te açık tonla yeniden üretildi. v02e betiği yeniden çalıştırılırsa açık tonu kullanır (v02e .glb'si eski tonla gömülü).
- Fotoğrafta avlu kemerleri modeldekinden daha az ve daha geniş görünüyor → revak göz sayısı (13/11) açık sorusuyla birlikte ele alınmalı.

## v02g · avlu kemer sayısı (16 Ekim 2026)
Betik: `claude/build/build_v02g.py` (= v02f + kemer sayısı). Teslim: `claude/export/koza-han_v02g.glb` (Draco, **268 KB**).
Kontrol: 26 882 üçgen, 42 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 0 → **GECTI: true**.
Yan yana: `kontrol/v02g/yan_yana_avlu.png` (ref `ref img/avlu_ust_kat_2.webp`).

### Karar (tasarım sorumlusu)
- Avlu kemerleri kubbe sayısına eşit: **ön/arka (kuzey/güney) 10, yanlar (doğu/batı) 11** (v01–v02f: 13 / 11). Her kemer bir kubbenin altında; kemerler genişledi (ön/arka açıklık ≈ 3,8 m).
- Dükkân ve üst kat kapıları avlu gözüyle birlikte 10 / 11'e indi.
- Üst kat kemeri R = 0,6 × açıklık (v02f: 0,75): geniş açıklıkta kemer korkuluğun üstünden başlasın diye.
- **Dış cephe pencere düzeni değişmedi:** yeni `cephe_oda_x = 13`, `cephe_oda_y = 11` parametreleri dış cephe oda/pencere ritmini avlu kemerinden ayırır.

### Kapanan açık soru
- "Revak göz sayısı kubbe sayısıyla eşitlensin mi?" → evet, eşitlendi.

## v02h · portal birebir + 9/9/11/11 (16 Ekim 2026)
Betik: `claude/build/build_v02h.py` (= v02g + portal yüzü + kubbe/kemer 9). Teslim: `claude/export/koza-han_v02h.glb` (Draco, **506 KB**; portal dokusu ≈ 240 KB).
Kontrol: 27 266 üçgen, 42 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 0 → **GECTI: true**.
Yan yana: `kontrol/v02h/yan_yana_portal.png` (ref `ref img/portal_on_1.webp`, ayrıntı `portal_on_2.webp`), `yan_yana_avlu.png`.

### Kararlar (tasarım sorumlusu)
- **Kubbe ve avlu kemeri: ön/arka 9, yanlar 11** (+4 köşe, +3 portal = 47 kubbe). Her kubbenin altında bir kemer. (v02d–v02g: ön/arka 10.)
- **Portal yüzü fotoğraftaki gibi:**
  - En dışta çerçeve boyunca ve en içte kemer boyunca **burmalı halat** (geometri: eğik yarım elipsoit loblar, Ø ≈ 0,64 m, lob aralığı 0,42 m, eğim 35°).
  - Arada kesme taş yüz, **kahverengi kakma çizgiler**: dış ve iç çerçeve çizgisi, yan bantlarda dikey, üst bantta yatay **altıgen zincir** (aralarında çapraz bağlar).
  - Kemer köşeliklerinde **mavi sekiz köşeli yıldız örgüsü** (yıldız uçları komşu yıldızlara bağlı), mavi sınır çizgisi kemeri izler.
  - Düz desenler `doku/portal_on.png` (2048 px, 10,4 × 10,6 m; `doku_uret.py → portal_on()`), kapı açıklığı levhada boşluk.
- v02d'deki terakota çerçeve çubukları, boncuk dizisi ve düz mavi alan kaldırıldı; dişli korniş kaldı.
- Bütçe: kubbe tabanı 4 → 3 halka.

### Not
- Ön/arka 9 kubbe → kubbe tabanı adım boyunca 5,1 × 3,2 m elips. Portalın kısa kenarda olup olmadığı sorusu hâlâ açık; yön değişirse kubbeler yuvarlaklaşır.

## v02i · bacalar (16 Ekim 2026)
Betik: `claude/build/build_v02i.py` (= v02h + yeni baca). Teslim: `claude/export/koza-han_v02i.glb` (Draco, **518 KB**).
Kontrol: 28 274 üçgen, 43 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 0 → **GECTI: true**.
Render: `kontrol/v02i/v02c_cati.png` (çatı yakın); ref `ref img/baca_ref.webp`.

### Karar (tasarım sorumlusu)
- Bacalar fotoğraftaki gibi: **tuğla gövde**, **her yüzde 2 sivri kemerli açıklık**, üstte **dişli (konsollu) kuşak**, gövdeden **geniş saçaklı koyu gri piramit külah**.
- Gövde 0,6 → 0,7 m; külah saçağı her yanda 0,15 m taşar, saçak levhası 0,1 m, külah 0,5 m.
- Açıklıklar ve dişli kuşak dokuda (`doku/baca.png`, yüz başına tek karo): 84 baca × 8 açıklığı geometri yapmak üçgen bütçesini aşardı. Saçak ve külah geometri.

## v02j · mescit (16 Ekim 2026)
Betik: `claude/build/build_v02j.py` (= v02i + mescit ayrıntıları). Teslim: `claude/export/koza-han_v02j.glb` (Draco, **537 KB**).
Kontrol: **29 098 üçgen (30 000 sınırına çok yakın)**, 47 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 0 → **GECTI: true**.
Yan yana: `kontrol/v02j/yan_yana_mescit.png` (ref `ref img/mescit_3.webp`; diğerleri `mescit_1.png`, `mescit_2.webp`).

### Kararlar (tasarım sorumlusu)
- **Kubbe:** sekizgen kubbe yerine yuvarlak (24 dilim), yukarıdan aşağı dışa açılan **çan eteği**; etek beden köşesinden 0,35 m taşar. Açık kurşun gri (#B4BCC2; v02e–v02i lavanta-mavi idi).
- **Alem + ayyıldız:** altın alem (boğumlu), üstünde ağzı yukarı hilal ve beş köşeli yıldız.
- **Merdiven:** beyaz mermer; iki yanında 0,9 m eğik beyaz korkuluk.
- **Zemin:** en altta Ø 12 m on altıgen **beyaz mermer** taban; **ayakların alt yarısı mermer**, üstü kesme taş.
- **Beden:** kesme taş dokusu (`kesme_tas.png`).
- **Pencereler:** dikdörtgen, parmaklıklı (siyah cam, kahverengi ahşap; `pencere.png`), üstünde **petek şebekeli yarım daire alınlık** (beyaz şebeke, siyah altıgen delikler; `doku/petek.png`).
- **Kapı:** kahverengi ahşap.

### Not
- Üçgen bütçesi doldu (29 098 / 30 000). Yeni ayrıntı için başka yerden azaltmak gerekecek (ör. Avlu_Cephe kapı kemerleri, revak kemer segmentleri).
- Mescit alt kat kemerleri fotoğrafta daha büyük ve yuvarlak görünüyor (sıradaki tur adayı).

## v02k · mescit merdiveni (16 Ekim 2026)
Betik: `claude/build/build_v02k.py` (= v02j + merdiven). Teslim: `claude/export/koza-han_v02k.glb` (Draco, **539 KB**).
Kontrol: 29 138 üçgen, 48 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 0 → **GECTI: true**.
Yan yana: `kontrol/v02k/yan_yana_merdiven.png` (ref `ref img/mescit_4.webp`); ek render `v02k_merdiven.png`.

### Kararlar (tasarım sorumlusu)
- **Merdiven korkuluğu sekizgen delikli:** beyaz mermer levha, iri sekizgen delikler, aralarında küçük kare delikler (`doku/sekizgen_korkuluk.png`, 0,42 m adım, eğim boyunca).
- **Merdiven altı:** mescit tarafında **çeyrek elips boşluk** — alt yüz zeminden (mescitten 2,8 m ötede) eğrilerek kapı sahanlığının 0,5 m altına çıkar.

## v02l · portal köşeliği + merdiven korkuluğu (16 Ekim 2026)
Betik: `claude/build/build_v02l.py` (= v02k + iki doku değişikliği). Teslim: `claude/export/koza-han_v02l.glb` (Draco, **571 KB**).
Kontrol: 29 138 üçgen, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 0 → **GECTI: true**.
Yan yana: `kontrol/v02l/yan_yana_portal.png` (ref `ref img/portal_on_3.webp`), `yan_yana_merdiven.png`.

### Kararlar (tasarım sorumlusu)
- **Portal mavi köşelik birebir:** tasarım sorumlusunun çizimi (`ref img/portal_kose.png`) kullanıldı. Mavi pikseller ayıklanıp sağ köşeliğin kutusuna oturtuldu, sol köşeliğe aynalandı (`doku/portal_on_v02l.png`). Üst çizgi, yan çizgi ve kemer çizgisi **sivri uçlarda** buluşur; içinde iki beş köşeli yıldızlı örgü.
- Sivri uç oluşsun diye mavi kemer çizgisi halata yaklaştırıldı (yarıçap 3,54 m; tepede üst mavi çizgiye değer); iç kahverengi çerçevenin üst çizgisi onun hemen üstüne indi (8,19 m), üst altıgen zincir bandı genişledi.
- **Merdiven korkuluğu** pencere alınlığındaki petek şebekeyle aynı: beyaz, siyah altıgen delikler (`doku/petek_korkuluk.png`; v02k'deki sekizgen delikli doku `sekizgen_korkuluk.png` dosyada kaldı).

### Not
- `doku/portal_on.png` (yıldız örgüsü) v02h–v02k için korundu; v02l ayrı dosya kullanır.

## v02m · portal kiremit örgüsü (16 Ekim 2026)
Betik: `claude/build/build_v02m.py` (= v02l + örgü dokusu + kapı yüksekliği). Teslim: `claude/export/koza-han_v02m.glb` (Draco, **494 KB**).
Kontrol: 29 274 üçgen, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 0 → **GECTI: true**.
Yan yana: `kontrol/v02m/yan_yana_portal.png` (ref `ref img/portal_on_3.webp`).

### Kararlar (tasarım sorumlusu)
- Kapı önündeki kiremit renkli şekil, tasarım sorumlusunun çizimi gibi (`ref img/portal_orgu.png`): **dış tek çizgi → iki iplikli örgü bandı → iç tek çizgi**. Bantta iplikler XX çiftleriyle çaprazlanır, çiftlerin arasında uzun altıgen kalır; köşelerde iplikler bant kenarında döner. Çizimde yarım kalan alt kısım fotoğrafa göre zemine kadar sürdürüldü. Renk kiremit (#B25436). `doku/portal_on_v02m.png` (`doku_uret.py → portal_on(orgu=True)`).
- Bantların fotoğraftaki gibi sıkı oturması için **kapı kemer tepesi 7,0 → 7,8 m** (`kapi_h`); mavi köşelik ve iç çerçeve onunla birlikte yükseldi.

## v02n · yön düzeltmesi + portal (16 Ekim 2026)
Betik: `claude/build/build_v02n.py`. Teslim: `claude/export/koza-han_v02n.glb` (Draco, **493 KB**).
Kontrol: 29 446 üçgen, 48 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 0 → **GECTI: true**.
Yan yana: `kontrol/v02n/yan_yana_havadan.png` (ref `ref img/havadan_1.webp`), `yan_yana_portal.png` (ref `portal_on_4.webp`).

### Tutarsızlık bulundu ve düzeltildi: bina yönü
- Kubbe sayıları (ön/arka 9, yanlar 11) ile v01–v02m ölçüleri çelişiyordu: uzun kenar (46 m avlu) ön/arka sayılmıştı → ön/arka kubbe adımı 5,1 m, yan 4,2 m → ön/arka kubbeler elips.
- Doğru yön: **portal kısa kenarda**. 38 / 9 = 4,22 m ≈ 46 / 11 = 4,18 m → dört kenarda aynı kubbe adımı. Havadan fotoğraf da portalın kısa kenarda olduğunu gösteriyor.
- Yeni ölçü: dış **51,7 (ön/arka, x) × 59,7 (yan, y)**, avlu **38 × 46**. Kanat derinliği 6,85 m değişmedi.
- `eser.md`'deki "doğu–batı 59,7 × kuzey–güney 51,7" ve avlu "46 × 38" etiketleri yön bakımından doğrulanmamıştı (avlu kaynağında yön yok; OSM dikdörtgeni ≈ 86° dönük). Model artık portal cephesini kısa kenar alır; eser.md'deki yön etiketleri tasarım sorumlusunca düzeltilmeli. Portalın gerçek pusula yönü (Uzunçarşı tarafı) ayrıca teyit edilmeli.
- Kubbe derinliği 3,2 → 3,6 m, vadi 0,8 → 0,7 m: kubbe tabanı ≈ 4,2 × 3,6 m (yuvarlağa yakın). Kabarık 1,65 m.

### Portal (tasarım sorumlusu)
- **Üç portal kubbesi yuvarlak değil:** yanlardaki **kare** (2,9 × 3,2 m), ortadaki **dikdörtgen** (4,1 × 3,2 m) tabanlı.
- **Portal kütlesi 14 → 11 m** (süslü çerçeve kadar): duvardaki üst kat pencereleri halattan hemen sonra başlar (her iki yanda pencere çifti).
- **Portal yan yüzlerinde ikişer üst kat penceresi** (Cephe_Kuzey nesnesine eklendi; draw call ≤ 50).
- Kısa kenar pencere adımı 1,9 m (`cephe_oda_x` 10), uzun kenar 1,77 m (`cephe_oda_y` 13).

## v02o · portal kütlesi (16 Ekim 2026)
Betik: `claude/build/build_v02o.py`. Teslim: `claude/export/koza-han_v02o.glb` (Draco, **492 KB**).
Kontrol: 29 450 üçgen, 48 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 0 → **GECTI: true**.
Yan yana: `kontrol/v02o/yan_yana_portal.png` (ref `portal_on_4.webp`), `yan_yana_havadan.png`; kroki `ref img/portal_plan_kroki.png`.

### Kararlar (tasarım sorumlusu krokisi)
- **Portal kütlesi 18 m geniş, cepheden 4,8 m çıkıntılı**, duvarı almaşık. Önünde süslü kısmın iki yanında **ikişer üst kat penceresi**, yan yüzlerinde **ikişer pencere**.
- **Süslü kısım ikinci çıkıntı:** 10,8 m geniş, kütle önünden 0,45 m öne çıkar; halat, dokulu levha ve kapı onun önünde. Dişli korniş yalnız süslü çıkıntının önünde, kütle önünde düz şerit.
- **Üç kubbe çatıyı tamamen kaplamaz:** kenarlarda 1,2 m, derinlikte 0,6 m, aralarda 0,55 m boşluk. Yanlar 4,2 × 3,8 m kare, orta 6,1 × 3,8 m dikdörtgen tabanlı.

### Hata düzeltmesi
- Dokulu karolar (almaşık, kesme taş, korkuluk) pencere/levha kodunun bmesh'te açtığı UV katmanının yanına ikinci bir katmana yazılıyordu; render ve .glb ilk katmanı kullandığı için **v02j–v02n'de mescit gövdesinin kesme taş dokusu görünmüyordu** (portal kütlesinde de). `uv_karolar()` artık etkin katmana yazar.
