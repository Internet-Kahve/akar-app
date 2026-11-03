# Ulucami harita pişirmesi: üçüncü deneme istemi

Aşağıdaki metin pişirmeyi yapan yapay zekâya olduğu gibi verilir.

---

Ulucami'nin pişmiş harita dosyalarını (`ulu-cami_v32_harita_pisik.glb`, gece `night/ulu-cami_v32_night_v2_harita_pisik.glb`) yeniden üret. İkinci deneme kabul edilmedi. Yalnız Ulucami; diğer 6 esere başlama. Commit ve push yapma. `apps/web` altına dokunma. `model.json` içinde `pisik_onay` alanını ekleme; onayı Muhammed verir.

## 1. Referans değişti: eser sayfası

Hedef, eser sayfasındaki ("sunum") görünümün ışığı ve gölgesidir. Uygulamanın haritası da aynı güneşe alındı. Değerleri elle kopyalama, `apps/web/src/lib/scene-light.ts` dosyasından oku:

| | Gündüz (`MAP_LIGHT`) | Gece (`MAP_NIGHT_LIGHT`) |
|---|---|---|
| Güneş / ay gücü | 2,1 | 0,85 |
| Gök gücü | 1,15 | 0,95 |
| Pozlama | 1,05 | 0,9 |
| Gölge opaklığı | 0,3 | 0,38 |

- Yön ikisinde de aynı: yükseklik **50°**, dünya azimutu `on_yonu + 40`.
- Ulucami'de yerel azimut: 354 + 40 − 174 = **220°** (önceki 200° ve 62° artık yanlış).
- `pisik_gorsel.html` içindeki sabitleri (62°, güç 1,5, 200°) güncelle. Karşılaştırmayı uygulamanın bugünkü ışığıyla yap.

## 2. Kubbe

Şadırvan cam kubbesi **opak** kalacak, alfa ve saydamlık olmayacak. Şu haliyle kabul edilmiyor:

- Gündüz koyu camgöbeği ve lekeli görünüyor. Eser sayfasındaki kubbenin açık gri-yeşil tonunu yakala, metal iskelet çizgileri okunsun.
- Gece düz altın bir leke. İskelet çizgileri ve içeriden gelen sıcak ışığın geçişi görünsün; mevcut gecedeki gibi aydınlık bir fener etkisi versin.

Kubbe yakın plandan ayrı kontrol edilecek. Gerekirse o bölgeye atlasta daha fazla yer ayır.

## 3. Doku netliği

Atlas doluluğu %23 (yaklaşık 24 cm/piksel) çok düşük; kurşun ek çizgileri ve taş örgüsü bu yüzden yumuşadı.

- Doluluk en az **%45** olsun. Binlerce küçük ada üretmek yerine ortak düzlemdeki parçaları birleştir, kenar payını gerekiyorsa 2 px'e indirip taşırma (dilate) ile telafi et.
- Görünen yüzeylere daha çok piksel ver: kubbe, çatı, dört cephe, minareler. Yukarıdan görünmeyen alt yüzler ve gizli yüzler en düşük yoğunlukta kalsın ya da silinsin.
- Hedef: kubbe, çatı ve cephede en çok **12 cm/piksel**. Kurşun ek çizgileri haritanın yakın görünümünde seçilsin.
- Atlas 2048'de kalsın.

## 4. Gölge

`Harita_Golge` yeni güneşe göre yeniden üretilsin. Yön ve boy eser sayfasındaki gölgeyle aynı olsun; kenarda kesik görünmesin, düzlemin dışına taşmasın.

Binanın kendi üzerine düşen gölgeler (minare gölgesi çatıda, kubbe gölgeleri komşu kubbede, saçak altları) eser sayfasıyla aynı yerde ve aynı koyulukta olsun. Bu nedenle `ORTAM_YUMUSAT` değerini yeniden ölç.

## 5. Kabul ölçütleri

Bunları `rapor.json` içinde ver. Karşılaştırma pişmiş ve aynı kameradan uygulama ışığıyla çizilmiş model arasında, yalnız model piksellerinde:

| Ölçüt | Sınır |
|---|---|
| Parlaklık oranı medyanı (gündüz, gece) | 0,97–1,03 |
| p10 / p90 | ≥ 0,85 / ≤ 1,15 |
| %25'ten fazla koyu piksel | ≤ %2 |
| Dosya boyutu | gündüz ≤ 900 KB, gece ≤ 1100 KB |
| Üçgen | mevcuttan fazla değil (+2 gölge düzlemi hariç) |
| Malzeme | 2 (`Harita_Pisik`, `Harita_Golge`), ikisi de `KHR_materials_unlit` |
| Düğüm adları ve kutular | mevcut doğrulamadan geçer |

Bir ölçüt tutmazsa nedenini yaz, sınırı sessizce gevşetme.

## 6. Teslim

- Gündüz ve gece için dört yönden ve kubbeye yakın plan: **eser sayfası ışığı | pişmiş** yan yana görüntüler ve ısı haritaları.
- README'nin pişirme bölümünü yeni değerlerle güncelle.
- Bilinen sınırları açıkça yaz. Işıksız malzemede bakış açısına bağlı parlama olamaz: kurşun kubbelerde parlamayı yukarıdan bakışa göre ortala ve bunun farkını belirt.

## Uygulama tarafında hazır olanlar

Bunları yapma, bilgi için:

- Harita tamamı ışıksız bir dosyayı kendisi tanır: ışık ve gölge hesabını kapatır, ACES ve pozlamayı açık tutar.
- `Harita_Golge` taban ve ayak izi hesabına katılmaz; adı değişmesin.
- Şehir doygunluğu pişmiş dosyaya uygulanmaz.

---

# Dördüncü deneme: revizyon (4 Kasım)

Ulucami'nin pişmiş harita dosyalarını revize et. Üçüncü denemede ışık, ton ve gölge doğru; ayrıntılar yanlış: en yakın görünümde kafesler, taş örgüsü ve kurşun ek çizgileri kayboldu, leke ve gürültü çıktı. Yalnız Ulucami. Commit ve push yapma, `apps/web` altına dokunma. Diğer 6 esere başlama.

**Yöntem: her adımı mevcut modelle karşılaştırarak ilerle. Mevcut model tek doğrudur.** Bir adımı ölçmeden sonrakine geçme, sonucu tahmin etme.

## 1. Değişmeyecekler

Güneş, gece ayarları, `ORTAM_YUMUSAT`, `PARLAMA`, `AY_KATKI`, `Harita_Golge` yönü, düğüm adları. Şadırvan camı opak kalır. Atlas 2048 kalır. `model.json` içinde yalnız `_pisik_not` satırını yeni değerlerle güncelle (hâlâ 200° ve 62° diyor); `ic_gizle` ve `pisik_onay` uygulamanındır.

## 2. Pişmiş dosya nerede görünüyor

Uygulama değişti: harita yakınlaşma 17,5'te ve üzerinde mevcut modele geçiyor, uzaklaşırken 17'nin altında pişmiş dosyaya dönüyor. Yani en yakın görünüm artık pişmiş dosyanın işi değil, ama 17,5'e kadar mevcut modele yakın durmalı; geçişte fark göze batmamalı.

Ölçüm kamerası, uygulamanın telefondaki görünümü: 780 × 1688 piksel, perspektif, dikey görüş açısı 36,87°, eğim 60°, uzaklık 440 m (yakınlaşma 17,4). Bir de yarı uzaklık, 220 m: güvenlik payı.

## 3. Önce karşılaştırma aracı, sonra pişirme

`pisik_gorsel` aracını şöyle genişlet ve **pişirmeye başlamadan önce** çalıştır:

- Aynı kameradan **mevcut | pişmiş | fark** üçlüsü. Mevcut, uygulamanın bugünkü ışığıyla `export/ulu-cami_v32.glb` (gece `night/ulu-cami_v32_night_v2.glb`).
- Sekiz detay karesi, her biri gündüz ve gece, iki uzaklıkta:
  kurşun kubbe ve ek çizgileri · şadırvan kubbesi · kasnak pencereleri · üst cephe pencereleri · alt pencere parmaklıkları · cephe taş örgüsü · taç kapı · alem ve minare şerefesi.
- Her kare için şunları ölç ve `rapor.json` içinde tablo yap:
  - **Keskinlik oranı:** pişmiş / mevcut kenar enerjisi (Sobel ya da Laplace)
  - **SSIM** (parlaklık kanalında)
  - **Parlaklık oranı medyanı**
  - **Renk sapması:** mevcutta olmayan renk üreten piksel payı (kırmızı saçak, beyaz leke gibi)

Şu anki dosyaların tablosu başlangıç çizgisidir, ilk teslimde onu da ver. Dosyaların bir kopyasını sakla ki geri dönülebilsin.

## 4. Düzeltilecekler

Karşılaştırma görüntüleri: `kontrol/v32_pisik/uygulama_yakin_gunduz.png`, `uygulama_yakin_gece.png` (sol mevcut, sağ pişmiş). Sırayla ve **her maddeden sonra tabloyu yeniden ölçerek**:

1. **Leke ve taşma:** Üst pencere kemerinde kırmızı saçak, alem dibinde beyaz leke, alt pencerelerde kırmızımsı gürültü. Nedeni büyük ihtimalle atlasta komşu adadan taşma; kenar payı, taşırma ve doku süzmesini kontrol et, nedeni bulup yaz.
2. **Pencere kafesleri:** Kasnak ve cephe pencereleri düz leke. Kafes deseni okunmalı; gece delikler ışıklı, araları koyu kalmalı. Bu parçalara atlasta çok daha yüksek yoğunluk ver (hedef en çok 3 cm/piksel).
3. **Cam kubbe:** Gündüz yatay çizikler, gece benekli. Temiz ve yumuşak olsun, iskelet çizgileri korunsun.
4. **Kurşun ek çizgileri:** Mevcut model kadar okunsun. Çizgileri dokudan keskin aktar.
5. **Taş örgüsü:** Silik. Atlas içinde yapılabildiği kadar geri getir.
6. **Dalgalı kenarlar:** Cephe kemerleri ve pencere çevresi.

Atlasta yer gerekiyorsa önce gizli ve görünmeyen yüzlerden al, sonra düz cephe boşluklarından.

## 5. Kabul

440 m kamerasında, sekiz karenin **her birinde**, gündüz ve gece:

| Ölçüt | Sınır |
|---|---|
| Keskinlik oranı | ≥ 0,80 |
| SSIM | ≥ 0,90 |
| Parlaklık oranı medyanı | 0,97–1,03 |
| Renk sapması | ≤ %0,5 |

220 m kamerasında sınır yok ama değerleri raporla. Genel ölçütler öncekiyle aynı (p10, p90, koyu piksel, üçgen, iki ışıksız malzeme, düğüm adları). Boyut: gündüz en çok 1100 KB, gece en çok 1300 KB; ayrıntı için önceki sınırı biraz gevşettim.

Ortalama yeterli değil, her kare ayrı geçmeli. Bir madde daha önce geçen bir kareyi bozarsa o değişikliği geri al.

## 6. Durma kuralı

Üç denemede sınır tutmuyorsa zorlamayı bırak. Hangi karenin neden tutmadığını, 2048 atlasın gerçek sınırını ve kaç piksel gerektiğini yaz. Sınırı sessizce gevşetme, sayıları yuvarlama.

## 7. Teslim

- Üçlü görüntüler ve ölçüm tablosu: başlangıç, her madde sonrası, son.
- README'nin pişirme bölümü güncel.
- «Geçti» demeden önce son dosyaları tabloya göre yeniden ölç; onay Muhammed'indir.
