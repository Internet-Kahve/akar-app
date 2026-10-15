# Gemini · Ulucami three.js (v02c'nin birebir kopyası)

*14 Ekim 2026. Ölçüler `build/build_v02c.py` P tablosundan ve `ulu-cami_notlar.md`'den alındı. Türetilen kotlar (oluk, kasnak üstü, kubbe profili, minare profili) betikteki formüllerle hesaplanıp aşağıya sayı olarak yazıldı.*

## Muhammed için: nasıl kullanılır

1. Gemini'de en güçlü modeli seç ve Canvas'ı aç (kod + canlı önizleme).
2. **Bu dosyaları ekle** (en önemlisi ilk ikisi, Gemini algoritmayı oradan birebir çevirir):
   - `3d-eser/bursa/ulu-cami/build/build_v02c.py`
   - `3d-eser/_kutuphane/akar3d.py`
   - `kontrol/v02c/v02c_kuzey_orto.png`, `v02c_hava_kuzeybati.png`, `v02c_tac_kapi.png`, `v02c_kubbe_yakin.png`
   - `ref-maket/Miniaturk_Bursa_Ulu_Cami_-_Bursa_Grand_Mosque.jpeg`
   - `../ref/ulu-cami_plan_ayverdi.png`
3. Aşağıdaki `--- PROMPT ---` çizgisinden sonrasını kopyalayıp yapıştır.
4. Çıkan HTML'i `ulu-cami/three/ulu-cami_three_v01.html` olarak kaydet, Chrome'da çift tıklayarak aç. Canvas'ta indirme düğmesi çalışmazsa bu dosyadan çalışır.
5. "Kontrol" panelindeki sayıları ve görünüşleri `kontrol/v02c` render'larıyla karşılaştır. Bozuk olanı Gemini'ye ekran görüntüsüyle göster.
6. `.glb`'yi `export/` klasörüne koy. Sonraki adım Blender son işlem betiği: AO, kontrol, Draco.

---  PROMPT  ---

# Görev

Bursa Ulucami'nin (1399) 3D modelini **three.js ile tek bir HTML dosyasında** kur. Model, eklediğim `build_v02c.py` Blender betiğinin ürettiği `v02c` modelinin **birebir** kopyası olacak: aynı ölçüler, aynı parça adları, aynı renkler. Sonra `.glb` olarak dışa aktarılacak ve bir mobil web uygulamasında (AKAR, vakıf eserleri rehberi) kullanılacak.

**Bu bir tasarım görevi değil, çeviri görevi.** Biçimi "güzelleştirme", oranları değiştirme, parça ekleme ya da çıkarma. Ölçüler kesinleşti (mimari rölöve planından ve maket ölçümünden). Fotoğraflar sadece biçimi anlaman için; ölçüde **bu prompt ve `build_v02c.py` geçerli**. İkisi çelişirse betik geçerli, çelişkiyi sonda raporla.

`build_v02c.py` ve `akar3d.py` ekliyse algoritmaları oradan birebir çevir (Blender bmesh → three.js BufferGeometry). Aşağıdaki sayılar kontrol içindir; betikle aynı çıkmalı.

# Teknik kurallar

- Tek dosya: `ulu-cami_three_v01.html`. three.js **0.160.0**, ES module + importmap, `https://cdn.jsdelivr.net/npm/three@0.160.0/...`. Kullanılacak eklentiler: `OrbitControls`, `GLTFExporter`, `BufferGeometryUtils`.
- Bütün ölçüler en üstte tek bir `const P = {...}` nesnesinde (Python'daki adlarla aynı). Kod içinde başka sabit sayı yok (0.03 gibi küçük ofsetler hariç).
- Her parça ayrı bir fonksiyon: `yapGovde()`, `yapCati()`, `yapKubbeler()` vb. Her fonksiyon tek bir `THREE.Mesh` döndürür. Geometriler `mergeGeometries(…, true)` ile birleşir, malzeme başına bir grup olur (draw call az kalsın).
- Kendi `lathe(profil, seg, merkez)` fonksiyonunu yaz (three'nin `LatheGeometry`'si değil). Açı dizisi her yerde aynı: θk = k · 360°/seg. Kasnak halkası, kubbe, yivler ve kasnak pencereleri bu açılara oturur. Profil noktasında r = 0 ise o halka tek nokta olur; ilk ve son halka r > 0 ise düz kapakla kapatılır.
- Sivri kemerli, delikli düz parçalar (cephe kabuğu, söve, levha) için `THREE.Shape` + `holes` + `ExtrudeGeometry({ depth, bevelEnabled: false })` kullan.
- Her parça olabildiğince **kapalı hacim** olsun (açık kenar yok), normaller dışa baksın, çift yüz olmasın. Birleştirmeden sonra `mergeVertices`.
- Gölge yok. `renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))`. Sadece gerektiğinde çiz (render on demand).
- **Üçgen bütçesi: toplam ≤ 30 000** (v02c: 29 192). Draw call ≤ 50 (v02c: 37). Segment sayıları: kubbe ve kasnak 24, minare 16, kaide 8, alem 8, kemer yayı 4 (kasnak penceresinde 2).

# Koordinatlar (three.js / glTF)

- Birim metre. Y yukarı. Orijin: yapının zemin ortası.
- **+Z = kuzey** (taç kapılı ana cephe), −Z = güney. **+X = batı, −X = doğu.**
  (Blender betiğinde kuzey −Y. Dönüşüm: three (x, y, z) = Blender (x, z, −y). Aşağıdaki değerler three.js koordinatlarıdır.)
- Plan düzlemi x–z, kot y.

# Renkler (sRGB hex, `renderer.outputColorSpace = SRGBColorSpace`)

| Ad | Hex | Nerede |
|---|---|---|
| duvar | #CDB592 | Govde, cephe kabuğu, minarelerin açık kısımları (kaide, şerefe, başlık, bilezik, geçit) |
| nis | #B9A07E | sağır kemer nişinin içi |
| mermer | #EEEAE2 | taban bandı, üst silme, söveler, taç kapı, kapı çerçeveleri |
| pencere | #3E4851 | alt pencere yan yüzleri |
| ahsap | #6B4A33 | kapı kanatları |
| kasnak | #E2C77E | kasnak duvarları |
| kubbe | #B9C2CC | kubbeler |
| cati | #9AA3AD | çatı |
| alem_kursun | #6B7480 | kubbe alemleri |
| tugla | #9C5A45 | minare gövdeleri |
| bant_koyu | #5E6670 | batı minare kaidesindeki iki bant |
| zemin | #C8BFB0 | zemin platformu (dışa aktarılmaz) |

**İki küçük doku** (canvas'ta 32 × 32 px üret, `RepeatWrapping`, `magFilter = NearestFilter`, keskin kalsın):
- `Kafes_Beyaz`: zemin #EEEAE2; karonun ortasında yarıçapı 0,30 × 32 px olan #1F2328 daire. **1 karo = 0,16 m.** Üst pencerelerde ve kasnak pencerelerinde.
- `Izgara_Kirmizi`: zemin #1F2328; karonun sol 4 px ve alt 4 px şeridi #A8352B. **1 karo = 0,30 m.** Alt pencerelerde.
- UV: dokulu yüzlerde u = (konum · yatay teğet) / karo, v = y / karo (düzlemsel, metre tabanlı).

Malzemeler: önizlemede `MeshLambertMaterial`; dışa aktarımda **`MeshBasicMaterial` (ışıksız)**. Uygulama modelleri ışıksız kullanıyor (`KHR_materials_unlit`). Derinliği sonra Blender'da eklenecek vertex AO verecek. Sen AO ekleme.

# Parçalar ve adlar (glb'de birebir bu adlar)

`Govde`, `Cati`, `Kubbeler_19`, `Sadirvan_Kubbe`, `Alemler`, `Kasnak_Pencereleri`, `Cephe_Kuzey`, `Cephe_Guney`, `Cephe_Dogu`, `Cephe_Bati`, `Mermer_Bant`, `Silme_Ust`, `Tac_Kapi`, `Kapi_Dogu`, `Kapi_Bati`, `Minare_1`, `Minare_2` (17 mesh) + `Merkez` (boş `Object3D`, (0, 0, 0), kamera hedefi) + `Zemin` (sadece önizlemede).

Bu adlar uygulamada vurgu ve kamera hedefi listesi olarak kullanılıyor, değiştirme.

# 1. Plan ve gövde

- Dış ölçü: **W = 68,7 (x) × D = 55,0 (z)**. Duvar kotu **17,3**. Duvar çizgileri: x = ±34,35, z = ±27,5.
- `Govde`: kutu, x ±34,35, z ±27,5, y −0,2 → 17,3, renk duvar.
- `Zemin`: kutu 86 × 76, merkezi (0, 0, +6), y −1 → 0.

**Kubbe ızgarası (5 sütun × 4 sıra = 20 bölme):**
- Sütun merkezleri x: **−25,2 · −12,85 · 0 · +12,85 · +25,2**. Sütun tipi: uç · ara · orta · ara · uç.
- Sıra merkezleri z: **+19,2 · +6,4 · −6,4 · −19,2** (kuzeyden güneye).
- Bölme sınırları (oluk çizgileri) x: −34,35 · −19,025 · −6,425 · +6,425 · +19,025 · +34,35. z: −27,5 · −12,8 · 0 · +12,8 · +27,5.
- **Açık kubbe (şadırvan):** orta sütun (x = 0), kuzeyden 2. sıra (z = +6,4). Bu bölme `Sadirvan_Kubbe` parçasına gider, diğer 19'u `Kubbeler_19`'a. Biçimi diğerleriyle aynı (kabuk kapalı).

# 2. Sütuna göre kotlar (uç / ara / orta; simetrik)

| Değer | uç | ara | orta |
|---|---|---|---|
| ZO: oluk kotu (bölme kenarındaki çatı kotu) | 19,041 | 19,797 | 20,981 |
| Kasnak önünde çatı kotu (kontrol) | 19,941 | 20,493 | 21,358 |
| KT: kasnak üst kotu | 22,270 | 23,716 | 25,345 |
| Kubbe eteği alt kenarı | 22,214 | 23,654 | 25,272 |
| Kubbe tepesi (alem hariç) | **25,2** | **26,9** | **29,1** |
| KS: profil ölçeği | 0,473 | 0,514 | 0,606 |

# 3. Çatı (`Cati`, tek kapalı mesh, renk cati)

Sabitler: ZS = 17,45 (duvar 17,3 + saçak kalınlığı 0,15). s = tan 30° = 0,57735 (iç kırma). tb = tan 65° = 2,14451 (dış kurşun bant). Sütunlar arası geçiş şeridi genişliği 0,24 (oluk çizgisinin her iki yanına 0,12).

Çatı yüzü **düzlemlerin alt zarfıdır**: her bölgede y = min(düzlemler). Her düzlem y = a·x + b·z + c biçiminde. Uygulama: bölge dikdörtgenini her düzlem için "bu düzlem diğerlerinden alçak" yarı düzlemleriyle kırp (dışbükey çokgen kırpma). Çıkan her çokgeni o düzlemin kotuyla 3B yüz yap. Basamaklı ya da örneklenmiş ızgara **olmasın**; yüzler düz, kırma çizgileri keskin olsun.

**Bölme bölgesi (sütun i, sıra j):** x aralığı sütun sınırları. İç sütun sınırlarında 0,12 içeri çekilir; dış duvar kenarında çekilmez. z aralığı sıra sınırları. ZO = o sütunun oluk kotu. Dört kenarın her biri için:
- **İç kenar** (komşu bölme var): 1 düzlem, y = ZO + s · d. d, o kenardan bölmenin içine doğru uzaklık.
- **Dış kenar** (duvar çizgisi x = ±34,35 ya da z = ±27,5): 2 düzlem
  - kurşun bant: y = ZS + tb · d
  - üstündeki kırma: y = (ZO − s · d0) + s · d, burada d0 = (ZO − ZS) / tb
- Bölmenin kotu = bu düzlemlerin minimumu. Sonuç: kenarda 65° kurşun bant, sonra 30° kırma; kasnağa doğru yükselen piramit benzeri çatı.

**Geçiş şeridi (oluk x sınırında, sütun i−1 ile i arası, her sıra için):** x ∈ [XB − 0,12, XB + 0,12]. y, x boyunca ZO(i−1)'den ZO(i)'ye doğrusal. Dış sırada (z = ±27,5 kenarı) ayrıca bant düzlemi y = ZS + tb · d ile minimum alınır.

**Saçak:** duvar çizgisinden 0,35 dışa taşan yatay halka (y = 17,45), dış kenarda 17,45 → 17,3 düşey alın, altta y = 17,3'te tam dikdörtgen alt yüz (x ±34,70, z ±27,85). Böylece çatı kapalı hacim olur.

Kontrol: kuzey sırada kasnağın ön yüzünde (z = 19,2 + 6,0) çatı kotu yukarıdaki "kasnak önünde" satırıyla ±0,05 içinde olmalı.

# 4. Kasnak + kubbe (bölme başına tek kapalı parça)

- Kasnak: 24 kenarlı prizma, **R = 6,0** (köşe yarıçapı), köşeler θk = k · 15°. Her kenarı 4'e böl. Alt kenardaki her noktanın **kotu = o noktadaki çatı kotu − 0,05**. Çatı düzlemlerin minimumu olduğu için noktalar arasında kalan çatı hep bu çizginin üstündedir: kasnağın altı çatıya gömülür, boşluk açılmaz. Üst kotu KT. Renk kasnak.
- Kubbe: 24 segmentlik lathe. İlk halkası kasnağın üst halkasıyla **aynı köşeler** (kasnak ile kubbe arasında kapak yok, tek kapalı yüzey). Renk kubbe.
- **Kubbe profilleri (r, y), mutlak değerler:**
  - uç: (6,000, 22,270) (6,140, 22,214) (6,150, 22,318) (6,080, 22,436) (6,030, 22,601) (6,040, 22,837) (5,908, 23,404) (5,262, 23,971) (4,154, 24,491) (2,585, 24,916) (1,108, 25,129) (0, 25,200)
  - ara: (6,000, 23,716) (6,140, 23,654) (6,150, 23,767) (6,080, 23,895) (6,030, 24,075) (6,040, 24,332) (5,908, 24,948) (5,262, 25,565) (4,154, 26,130) (2,585, 26,592) (1,108, 26,823) (0, 26,900)
  - orta: (6,000, 25,345) (6,140, 25,272) (6,150, 25,405) (6,080, 25,557) (6,030, 25,769) (6,040, 26,072) (5,908, 26,798) (5,262, 27,525) (4,154, 28,192) (2,585, 28,737) (1,108, 29,009) (0, 29,100)
  - Okunuşu: kasnak üst halkası → etek alt kenarı (dışa ve aşağı) → etek dudağı → içe dönüş → bel → yuvarlak gövde → tepe. Etek kasnağın 0,15 m dışına taşar, altı görünür.
- **Yivler:** tek numaralı açılardaki (k = 1, 3, 5, …) profil noktalarını merkeze doğru **0,06 m** içeri çek. Kasnak üst halkasındaki ilk nokta (6,0, KT) ile tepe noktası hariç.
- **Alemler** (`Alemler`, 20 adet, şadırvan dahil): her kubbe tepesinde 8 segmentlik lathe, tepe kotuna göre (r, dy): (0,12, −0,05) (0,12, 0,20) (0,25, 0,45) (0,10, 0,70) (0, 1,50). Renk alem_kursun.

# 5. Kasnak pencereleri (`Kasnak_Pencereleri`, tek parça)

- Her kasnakta 8 pencere: k = 0, 3, 6, …, 21 numaralı yüzlerin ortasında (açı (k + 0,5) · 15°). Yüz merkez uzaklığı (apotem) 6,0 · cos 7,5° = 5,949.
- Sivri kemerli levha: genişlik **1,4**, üst kot **KT − 0,25**, normal alt kot üstten 2,4 aşağı. Kasnak yüzünden 0,03 önde, 0,03 kalın. Ön ve arka yüz Kafes_Beyaz dokusu, yan yüzler mermer.
- Çatı yükseldiği yerde pencere alttan kısalır: alt kot = max(üst − 2,4, pencerenin sol / orta / sağ noktasında, kasnaktan 0,06 dışarıda ölçülen çatı kotu + 0,15). Kalan yükseklik < **1,5** ise o pencere konmaz (v02c'de 20 pencere bu yüzden yok, yaklaşık 140 kaldı; sayıyı raporla).

# 6. Sivri kemer tanımı (bütün nişler, pencereler, kapılar)

`sivri(w, alt, tepe, k = 0,8, n = 4)`: iki merkezli sivri kemer. R = k · w. ta = acos((R − w/2) / R). Kemer başlangıç kotu zs = tepe − R · sin(ta). Çokgen: alt sol → alt sağ → (w/2, zs) → sağ yay (n adım, t = ta · i/n için noktalar ((w/2 − R) + R cos t, zs + R sin t)) → sol yay simetrik → (−w/2, zs). Dikdörtgen gövde + sivri baş.

# 7. Cepheler (`Cephe_Kuzey/Guney/Dogu/Bati`, cephe başına tek parça)

Her cephede duvar çizgisinin önüne eklenmiş **0,25 m kalın kabuk** var (Govde'ye dokunulmaz). Kabuk y 0 → **16,9** (silmenin altı). Kuzey ve güney kabuğu x ±34,60 boyunca (köşeleri kapatır). Doğu ve batı kabuğu z ±27,498.

**Sağır nişler:** kabukta açılan delik: `sivri(4,8, 1,4, 15,8)`. Nişin dibi duvar çizgisi. Dipte nis renginde ince levha: `sivri(4,74, 1,43, 15,77)`, 0,005 önde, 0,015 kalın. Bölme başına 2 niş.
- Kuzey ve güney niş merkezleri x: ±3,2125 · ±9,575 · ±15,875 · ±22,856 · ±30,519
- Doğu ve batı niş merkezleri z: ±3,2 · ±9,6 · ±16,475 · ±23,825

**Her nişin içinde (niş dibinden ölçülür):**
- Üst pencere: açıklık `sivri(2,2, 9,1, 13,2)`. Mermer söve halkası: dış `sivri(2,56, 8,92, 13,38)` − iç açıklık, 0,03 → 0,15 önde. İçinde Kafes_Beyaz levha `sivri(2,18, 9,11, 13,19)`, 0,04 önde, 0,02 kalın, yanları mermer.
- Alt pencere: dikdörtgen 1,7 × (1,8 → 4,3). Mermer söve 0,18 pay, 0,03 → 0,15 önde. İçinde Izgara_Kirmizi levha, 0,04 önde, 0,02 kalın, yanları pencere rengi.
- Boşaltma kemeri (alt pencerenin üstü): `sivri(1,9, 4,5, 5,65, k = 0,6, n = 3)` mermer levha, 0,03 önde, 0,02 kalın.

**İstisnalar:**
- Kuzey: x = ±3,2125 nişleri yok (taç kapının arkası). x = +30,519 nişi yok (batı minare kaidesi ve geçidin önü). x = −30,519 nişi var ama **pencere yok** (doğu minaresinin önü).
- Kuzey kabuğunun dış çizgisi: (−34,6, 0) → (−4,75, 0) → (−4,75, 16,5) → (4,75, 16,5) → (4,75, 0) → (26,5, 0) → (26,5, 15,3) → (34,6, 15,3) → (34,6, 16,9) → (−34,6, 16,9). Yani taç kapının arkasında ve batı kaidesinin önünde (x > 26,5, y < 15,3) kabuk yok.
- Doğu: z = +3,2 nişi yok, yerine kapı. Batı: z = +3,2 nişi yok, yerine kapı.
- Sayı kontrolü: niş 7 (kuzey) + 10 (güney) + 7 (doğu) + 7 (batı) = 31. Üst pencere 30, alt pencere 30.

**Yan kapılar** (kabuk yüzünün önünde, ayrı parça):
- `Kapi_Dogu`: doğu cephesi, merkez z = **+5,2**. `Kapi_Bati`: batı cephesi, merkez z = **+4,68**.
- Mermer çerçeve `sivri(3,4, 0, 5,4)`, kabuk yüzünden itibaren 0,12 kalın. Ahşap kanat `sivri(2,4, 0, 4,6)`, onun önünde 0,04 kalın.

# 8. Mermer_Bant ve Silme_Ust

- `Mermer_Bant`: y 0 → 1,2. Kabuk yüzünün önünde 0,08 kalın (duvar çizgisinden 0,25 → 0,33). Kuzey ve güneyde x ±34,68, doğu ve batıda z ±27,748. Boşluklar: kuzeyde |x| < 4,75 (taç kapı) ve x > 26,5 (batı kaide). Doğuda z 5,2 ± 1,7. Batıda z 4,68 ± 1,7.
- `Silme_Ust`: y 16,9 → 17,3, duvar çizgisinden 0,40 dışa taşan kutular. Kuzey ve güneyde x ±34,75 boyunca, doğu ve batıda arada.

# 9. Taç kapı (`Tac_Kapi`, kuzey cephenin ortası, mermer)

- Kot tabanı zb0 = 6 × 0,17 = **1,02** (basamakların üstü).
- Blok: x ±4,75, duvar çizgisinden (z = 27,5) **1,8** öne (z = 29,3), y 1,02 → **16,5**. Ortasında alttan açık, bloğun tam derinliği boyunca derin niş: `sivri(4,2, 1,02, 12,0)`.
- Mukarnas taklidi: kemer başlangıcı zs ≈ **8,885** ile 12,0 arasında **5 kademe** (her biri 0,623). i. kademe: genişlik o kottaki kemer yarı genişliği − 0,03; duvar çizgisinden derinliği (1,8 − 0,3)(1 − i/5) + 0,15 = 1,65 / 1,35 / 1,05 / 0,75 / 0,45. İçe doğru basamaklı kutular.
- Niş dibi: mermer levha x ±2,07, y 1,02 → zs − 0,02, duvar çizgisinde.
- Kapı: ahşap 2,8 × 4,5, y 1,02'den, 0,03 önde, 0,05 kalın.
- Eşik dolgusu: kutu x ±4,75, z 27,5 → 27,83, y 0 → 1,02.
- Merdiven: 6 basamak, z = 27,83'ten kuzeye. i = 0…5 için yarı genişlik 8,05 − 0,5i, derinlik 5,5 − 0,6i, y i·0,17 → (i+1)·0,17. Kenarları kademeli küçülen basamaklar.

# 10. Minareler

**Konumlar:**
- `Minare_1`: **kuzeybatı**, sekizgen bantlı kaide. Eksen (x = **+31,95**, z = **+31,2**): batı duvarından 2,4 m içeride, cepheden 3,7 m önde.
- `Minare_2`: **kuzeydoğu**, kare kaide. Eksen (x = **−31,5**, z = **+31,35**): kaidenin dış kenarı doğu duvarıyla hizalı, kaide cepheden 0,9 m açıkta.

**Minare_1 kaidesi:** 8 kenarlı lathe, π/8 döndürülmüş (yüzler eksenlere paralel). Profildeki r köşe yarıçapı: apotem / cos(π/8).
- (r, y): (3,897, −0,2) → (3,626, 1,0) → (3,626, 7,2) → (3,626, 7,9) → (3,626, 8,8) → (3,626, 9,5) → (3,626, 15,0). Apotem: taban 3,6, gövde 3,35, yani yüzden yüze 6,7.
- Renk: her şey duvar; 7,2–7,9 ve 8,8–9,5 arası **bant_koyu**. Alt ve üst kapalı.
- **Geçit:** kaidenin cepheye bakan çapraz yüzünden (yön (−1, 0, −1)/√2, yüz merkezi = eksen + yön × 3,35) kuzey duvar çizgisine (z = 27,5) kadar uzanan prizma. Genişlik 2,0 (yöne dik), y −0,2 → 15,0, renk duvar.

**Minare_2 kaidesi:** kutu 5,7 (x) × 5,9 (z), y −0,2 → 4,6. Üstünde 8 kenarlı pabuç lathe: (2,85, 4,6) → (2,365, 6,1). Renk duvar.

**Gövde ve başlık (iki minarede aynı; z0 = kaide üstü: Minare_1 için 15,0, Minare_2 için 6,1). 16 segmentlik lathe (r, y):**
- (2,15, z0) → (2,068, 36,6): gövde, **tugla**
- (2,322, 36,6) → (2,322, 38,17) → (2,451, 38,17) → (2,451, 39,74) → (2,58, 39,74) → (2,58, 41,3): 3 kademeli şerefe altı kuşağı, **tugla**
- (3,074, 41,3) → (3,074, 42,8): şerefe korkuluğu, **duvar**
- (1,742, 42,8) → (1,742, 49,2): petek (üst gövde), **tugla**
- Başlık, **duvar**: (2,15, 49,2) (2,15, 49,7) (1,623, 50,4) (1,258, 51,2) (1,46, 51,8) (1,623, 52,6) (1,542, 53,4) (1,136, 54,0) (0,649, 54,3) (0,649, 54,6) (0,974, 55,0) (1,095, 55,7) (0,974, 56,4) (0,568, 57,0) (0,325, 57,3) (0,284, 58,3) (0,097, 59,4) (0,041, 60,7) (0, **60,9**)
- Kural: bir segmentin malzemesi, segmentin **üst** noktasının malzemesidir. Yatay basamak yüzleri de buna göre.

**Minare detayı (aynı parçaya):**
- Taş bilezikler (duvar rengi): y = 60,9 × 0,25 / 0,50 / 0,75 = **15,225 · 30,45 · 45,675**'te 0,25 yüksek, gövdeden 0,05 taşan halkalar. Alt gövdede o kottaki yarıçapı kullan (konik: z0'da 2,15 → 36,6'da 2,068). Petekte 1,742 kullan. Kaide üstüne 0,3'ten yakın ya da kuşak / korkuluk bölgesine düşen bileziği atla. Sonuç: Minare_1'de 2 bilezik (30,45 ve 45,675), Minare_2'de 3 bilezik.
- Korkuluk silmeleri (duvar rengi): r 3,054 → 3,174 halkalar; y 41,32–41,47 ve 42,63–42,78.

# 11. Sayfa (önizleme)

Sade, işlevsel; tasarımla uğraşma.
- Tam ekran sahne + sağda dar panel (telefonda altta).
- Görünüş düğmeleri: Kuzey (ortografik, karşıdan), Havadan KB, Doğu, Üstten plan (ortografik), Taç kapı yakın, Kubbeler yakın. Geçiş 0,7 sn.
- Işıklı / ışıksız anahtarı. Parça listesi: her parçayı göster/gizle; tıklayınca (listeden ya da sahnede) vurgula. Vurgu = malzemeyi klonla, rengi `#C9A13B`'ye 0,55 oranında kaydır (`emissive` kullanma).
- **Kontrol paneli** (otomatik hesaplanır): parça başına üçgen sayısı ve toplam, draw call sayısı, toplam sınır kutusu, kubbe tepe kotları (25,2 / 26,9 / 29,1 bekleniyor), minare tepeleri (60,9), üst / alt pencere ve niş sayıları (30 / 30 / 31), kasnak penceresi sayısı, NaN var mı.
- **"glb indir"** düğmesi: `GLTFExporter`, `binary: true`. Zemin hariç; `Merkez` dahil. Malzemeler `MeshBasicMaterial` (ışıksız) ve dokular gömülü olsun. Dosya adı `ulu-cami_three_v01.glb`. Vertex rengi ekleme.

# Teslim

1. Tek HTML dosyasının tamamı. Kesme, "…" ile atlama yapma. Uzunsa parça parça devam et.
2. Altında kısa rapor:
   - Kontrol panelindeki sayılar.
   - Betikten ya da bu prompttan saptığın her nokta ve nedeni.
   - Emin olmadığın yerler (soru olarak).
   Övgü ya da süsleme cümlesi yazma.
