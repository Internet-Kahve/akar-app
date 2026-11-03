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
