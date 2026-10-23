# İçerik hazırlama yöntemi (`eserler/*/icerik/`)

19 Ekim 2026. Görev: `GOREV_DAGILIMI_15Ekim.md` → «Talha (içerik)» (dosya 20 Ekim'de kaldırıldı; git geçmişinde, commit `1f977c9`). Bu dosya her eserin `icerik/` klasöründeki seçimlerin **neye göre** yapıldığını anlatır. Eser bazındaki ayrıntılar ve çelişkiler her dosyanın «Notlar» ve «Kaynak notu» bölümlerinde.

**20 Ekim 2026 kontrol turu:** Bütün cümleler kitapla, bütün fotoğraflar gözle yeniden kontrol edildi. Düzeltilenler: Koza Han'daki iki Pirinç Han fotoğrafı çıkarıldı (§5.2); vurgu adları güncel modellere taşındı (§6); hamam giriş yönü modelle ve notlarla uyumlu hale getirildi; Bedesten ve Emir Hanı'ndaki iki «ilk bedesten» cümlesi birbirini tamamlayacak şekilde yazıldı (§3); Ulucami, Bedesten ve Emir Hanı açı tablolarındaki yönler OSM'ye göre düzeltildi (§7); lisans notu güncellendi (§5.8); Koza Han kitabesindeki Instagram ekran görüntüsü arşiv fotoğrafıyla değiştirildi (§5.1).

## 1. Kapsam

| Eser | Klasör | Tür | Hikâye | Eser hakkında | Fotoğraf |
|---|---|---|---|---|---|
| Ulucami | `ulu-cami/` | hero | 12 cümle | ~340 kelime | 12 + 1 akar + 1 sonraki durak |
| Yıldırım Bayezid Bedesteni | `yildirim-bayezid-bedesteni/` | hero | 11 cümle | ~260 kelime | 7 + 1 sonraki durak |
| Koza Han | `koza-han/` | hero | 12 cümle | ~300 kelime | 10 |
| Orhan Bey Camii | `orhan-bey-kulliyesi/` | rota | 8 cümle | ~175 kelime | 8 + 2 (yalnız hikâye) |
| Orhan Bey Hamamı | `orhan-bey-hamami/` | rota | 8 cümle | ~190 kelime | 5 |
| Emir Hanı | `emir-han/` | rota | 8 cümle | ~210 kelime | 6 |
| Orhan Gazi Türbesi | `orhan-gazi-turbesi/` | diğer (3D v02 var) | yok (görev dosyası: «hikâye yok») | ~95 kelime | 5 |

**Yapılmayanlar:**
- **`ayasofya/`:** Klasördeki notlar Sinan minarelerinden ve İstanbul'daki yapıdan söz ediyor; Bursa vakıf envanterinde değil. İçerik hazırlanmadı. Bu bir İznik Ayasofya çalışmasıysa söylemen yeterli; o zaman envanter Cilt 3 metni gerekir (`veri/metin/` altında yok).
- **`aday-eserler/` (27 eser):** Henüz eser klasörü düzenine alınmadılar; görev sırasına göre en son («kalan eserler», yalnız Eser hakkında + 3–5 fotoğraf). İstenirse aynı yöntemle yapılır.
- **Rota sırası (22 Ekim 2026):** Hanlar Bölgesi Vakıf Yürüyüşü 4 durak: Ulucami → Bedesten → Koza Hanı → Orhan Bey Camii. «Sonraki durak» cümleleri: Ulucami 12 (Bedesten), Bedesten 11 (Koza Han), Koza Han 12 (Orhan Bey Camii, son durak). Orhan Bey Camii son durak olduğu için kapanış cümlesi «bugün» bilgisi. Rota dışındaki eserlerde (Hamam, Emir Hanı, Türbe) sonraki durak yok.

## 2. Kaynak

- **Öncelik:** Bursa Vakıf Eserleri Envanteri (Vakıf Katılım'ın verdiği kaynak). Metin `veri/metin/bursa-envanteri-cilt-1.txt` / `-cilt-2.txt` içinden okundu; sayfa = **PDF sayfası** (`\f` ile ayrılmış sıra + 1). Kod: `E cilt-1 PDF s.25`.
- **Başka kaynak** yalnız envanterde olmayan bir bilgi için kullanıldı ve `W` kodlu ayrı paragrafta durur. Şu an tek örnek: Koza Han'da Bursa Alan Başkanlığı envanter föyü N19 (oda sayıları, avlu ölçüsü).
- **Kaynağı olmayan cümle yazılmadı.** Örneğin Ulucami'deki «dördüncü padişah» cümlesi çıkarıldı.
- **Kitap kendi içinde çelişiyorsa** (22 Ekim 2026'da netleşti):
  - **Eserin kendi maddesi bilgiyi açıkça veriyorsa o kullanılır;** başka eserlerin maddelerinde geçen farklı değerler «Kaynak notu»na yazılır. Örnek: Koza Han açılışı. Kendi maddesi (C2 s.8) «30 Eylül 1491»; Koza Han Mescidi maddesi (C1 s.194) «1491 yılı, Ekim ayında», Orhan Bey Hamamı maddesi (C1 s.104) geçerken «1505». Metinde 30 Eylül 1491.
  - **Aynı eserin maddesi kendi içinde farklı değer veriyorsa** sayı ya da yıl verilmez, iki değer «Kaynak notu»na yazılır. Örnekler:
    - Ulucami havuzu: s.25 onikigen / s.33 on altı kenarlı
    - Orhan Gazi Türbesi yeniden yapımı: s.116 1863 / s.117 1868
  - **Önce çelişki mi diye bakılır:** Türkçe cümle belirsizse aynı sayfadaki İngilizce çeviri okunur. Örnek: hamamda «6.60 × 6.45 m ölçülerindeki kare planlı soğukluk» Türkçede soğukluğa bağlanıyor gibi; İngilizcesi («the square tepidarium measuring 6.60 × 6.45 m») ölçünün ılıklığa ait olduğunu söylüyor. Çelişki yok: soğukluk 11,95 × 11,86, ılıklık 6,60 × 6,45.
- **Kopyalama yok:** Kitap cümleleri kendi cümlelerimizle anlatıldı. Kısa alıntılar yalnız «Notlar» bölümünde, «…» içinde ve sayfasıyla.
- **Her kaynak kodu metinle karşılaştırıldı:** Yazılan her bilgi için ilgili sayfada anahtar kelime aratıldı ve PDF sayfası doğrulandı.

## 3. Hikâye cümleleri

- **Uzunluk:** Hero 8–12, rota 5–8 cümle. Her cümle tek bilgi ve en fazla 20 kelime; en uzun cümle 15 kelime.
- **Akış:** kim, ne zaman → neden → dışarıdan ne görülür → içeride ne var → vakıf/akar bağı → bugün.
- **Akar cümlesi:** Her hikâyede en az bir tane var. Seçilen bağlar:
  - **Ulucami ← Bedesten:** C1 s.11.
  - **Bedesten → Ulucami:** C1 s.11; C2 s.29.
  - **Koza Han → II. Bayezid'in İstanbul külliyesi:** C2 s.8.
  - **Orhan Hamamı → Orhan Gazi İmareti:** C1 s.97, s.104.
  - **Emir Hanı:** Kantar geliri hanın gelir kaynağıydı (C1 s.108). Vakfiyedeki «Eski Bedesten» = Emir Hanı bağı ise ayrı paragrafta ve **Tarihsel çıkarım** etiketiyle.
- **Rota içi tutarlılık:** Aynı rotadaki eserlerin cümleleri birbiriyle çelişir gibi duyulmamalı. Örnek: Bedesten «Osmanlı'da bedesten olarak inşa edilen ilk yapı» (C2 s.29), Emir Hanı «Bursa'nın ilk bedesteni sayılır; yeni bedestenden sonra «Eski Bedesten» adını aldı» (C1 s.108).
- **Abartı yok:** «Muhteşem», «en güzel» gibi kitaptaki övgüler alınmadı. Övgü kitapta bir kişiye aitse adıyla verildi (Evliya Çelebi).

## 4. Güven etiketi (öneri; karar Muhammed'in)

- **Doğrulanmış:** Bilgi kitapta açıkça yazıyor. Kitabın başkasının anlatımını aktardığı durumlar da buna dahil (ör. «Evliya Çelebi'ye göre…»).
- **Tarihsel çıkarım:** Kitap «düşünülmektedir / tahmin edilmektedir» diyor, ya da bilgi iki ayrı bilgiden çıkarılıyor. Bu paragraflar doğrulanmış bilgiyle karıştırılmadı, ayrı paragraf yapıldı. Örnekler:
  - Ulucami'nin mimar adları
  - Ulucami doğu minaresinin tamamlanma dönemi
  - Vakfiyedeki «Eski Bedesten»in Emir Hanı olması (hanın «Eski Bedesten» diye anılması ise kitapta açık, Doğrulanmış)
- **Fotoğraflarda:** Eser eşlemesi gözle kesinleşmeyen fotoğraflar «Tarihsel çıkarım» etiketli:
  - `orhan-gazi-turbesi/icerik/foto/04_tepeden-iki-turbe.jpg`

## 5. Fotoğraf seçimi

1. **Kaynak:** `veri/bursa-foto/` (Vakıf Katılım arşivi, 2400 px). Fotoğraflar **kopyalandı**, asıllar yerinde. Asıl dosya yolu ve zip numarası her `fotograflar.md` tablosunda. Bütün fotoğraflar arşivden. İlk turda Koza Han mescit kitabesi için ekip fotoğrafı sanılarak kullanılan görüntü bir Instagram ekran görüntüsüydü; 20 Ekim 2026'da kitabenin okunduğu arşiv fotoğrafıyla değiştirildi. Arşivde bir eserin fotoğrafı beklenen klasörde değilse (Koza Han Mescidi «Osmangazi Camiler ve Hazireler 2» klasöründe) envanterdeki fotoğraf ve çekim saati ile aranır.
2. **Esere ait mi?** Arşiv dosya adlarında eser adı olmadığı için klasördeki bütün fotoğraflar numaralı küçük resimlerle tek tek incelendi. Eşleme kitaptaki tarife göre yapıldı:
   - **Bedesten:** iki sıra yedişer kubbe.
   - **Koza Han:** avluda sekizgen köşk mescit; üst katta koyu kesme taş ayaklı, sivri tuğla kemerli revak; dükkân tabelasında «Koza».
   - **Emir Hanı:** Ulucami'nin kuzeydoğusundaki ağaçlı avlu ve fıskiyeli şadırvan.
   - **Orhan Hamamı:** «Eski Aynalı Çarşı» girişi ve üzerindeki «Orhan Bey Hamamı» levhası.
   - **Orhan Gazi Türbesi:** kare plan, her cephede üç pencere, «Nilüfer Hatun» sanduka levhası.

   Başka hanlara (Fidan, Pirinç, Bali Bey) ait olabilecek tuğla revaklı han fotoğrafları kullanılmadı.

   **Ek kurallar (20 Ekim 2026):**
   - **Dosya adına bak:** Ticari Yapılar Klasörü'nde bazı dosyalar han adıyla adlandırılmış (`02pirinç.jpg`, `pirinc08/14.jpg`, `balibey*.jpg`, `* Bali.jpg`, `tahtakale*`). Koza Han'a ilk turda konan `pirinc14.jpg` ve `pirinc08.jpg` bu yüzden çıkarıldı.
   - **Envanterde basılan fotoğraf kesin eşlemedir:** Kitabın bir eser maddesinde bastığı arşiv fotoğrafı o esere aittir (ör. Bedesten `07` = C2 s.29).
   - **Çekim sırası ipucudur:** ERD numaraları ve DJI saatleri ardışık çekimi gösterir (Koza Han: ERD04128–04161, ERD04224–04226; drone 23.10.2024 13:29–13:31).
   - **Yön çevreyle doğrulanır:** Fotoğraftaki minare aralığı, dağ ve komşu yapılar OSM konumlarıyla karşılaştırılır; dosya adındaki yöne güvenilmez.
3. **KVKK:** Seçilen her fotoğrafa tam çözünürlükte bakıldı. Tanınabilir yüz ya da plaka yok. Çok küçük, uzaktaki figürler varsa tablonun Not sütununda yazıyor.
4. **Galeri sırası:** Görev dosyasındaki gibi dış kapak → iç genel → öne çıkan detay → ikinci dış → diğer detaylar. «—» işaretli fotoğraf galeriye girmez, yalnız hikâyede ya da kartta kullanılır.
5. **Kart:**
   - **evet:** Fotoğraf 3D modelin gösteremediği bir şeyi gösteriyor (iç mekân, mihrap, minber, kitabe, başka bir yapı).
   - **hayır:** Fotoğraf modelin zaten gösterdiği dış görünüş.
6. **Akar fotoğrafı:** Akar cümlesine akar yapının fotoğrafı konur ve başlığında yapının adı yazar. Örnekler:
   - Ulucami 13 → «Yıldırım Bayezid Bedesteni, havadan»
   - Orhan Camii 10 → «Orhan Bey Hamamı»

   Akarın gelir verdiği yapının fotoğrafı arşivde yoksa hanın kendi fotoğrafı kullanıldı ve not düşüldü: Koza Han → İstanbul'daki Bayezid Külliyesi; hamam → yıkılmış imaret.
7. **Sayı eksikleri:**
   - **Bedesten:** 7 fotoğraf var, hero için 8 gerekiyor. Envanterin Bedesten maddesindeki üç fotoğrafın üçü de kullanıldı; arşivde kapı ve kitabe fotoğrafı yok.
   - **Koza Han:** Kuzey portal fotoğrafı yok. `ref/foto/` içindeki web fotoğraflarının lisansı belirsiz olduğu için kullanılmadı.
8. **Lisans sütunu:** Her arşiv fotoğrafında «Vakıf Katılım … arşivi (zip -NNN). Proje için verildi; kullanılabilir» yazıyor. Fotoğraf arşivi ve envanter kitabı (metin ve görseller) proje için verildi, serbestçe kullanılabilir (Muhammed, 20 Ekim 2026). Arşivde fotoğrafçı adı yok; künyede «Fotoğraf: Bursa Vakıf Eserleri Envanteri» yazılır.

## 6. Vurgu (3D)

- **Ad kaynağı:** Vurgu adları `eser.md`'deki «Parça adları» tablosundan değil, **modelin kendisinden** alındı (`3d/export/*.glb` içindeki nesne adları). Tablo ile model uyuşmuyor (ör. tabloda `Kubbeler`, modelde `Kubbeler_19`). Uygulamadaki vurgu ve kamera hedefi modeldeki adlara bağlı.
- **Kontrol edilen modeller (22 Ekim 2026; bütün vurgu adları modelde var):**
  - `ulu-cami_v26.glb`
  - `bedesten_v06.glb`
  - `koza-han_v14.glb`
  - `orhan-bey-camii_v07.glb`
  - `orhan-bey-hamami_v05.glb`
  - `emir-hani_v05.glb`
- 20 Ekim turunda v25 / v05 / v13 / v06 / v04 / v03 kontrol edilmişti; sonraki sürümler renk ve ışığı değiştirdi (Emir Hanı v05'te ayrıca üst kat revak ayakları düzeldi), parça adları aynı kaldı.
- **Açı hedefi `Merkez`:** modelde nesne olarak yok; frontend hesaplar (`FRONTEND_BACKEND_NOTLARI.md` §9). Açı tablolarında kullanılabilir.
- **Bu turda değişenler:** Bedesten `Ic_Bedesten_Sokagi` v04'te kalktı (cümle 7'nin vurgusu boş; cümle 10 `Kapilar` → `Dukkanlar`). Orhan Camii v06'da `Sadirvan` eklendi (cümle 8). Hamam `Hamam_Giris` v03'ten beri güneydeki alınlıklı blok; kuzey kapısı `Hamam_Detay` içinde.
- **Yeni .glb gelince:** `hikaye.md` tablolarındaki Vurgu sütunu ve açı hedefleri modeldeki adlarla yeniden karşılaştırılmalı (GLB'nin JSON bölümündeki `nodes[].name`). Sonnet'e `eser.md` tablosunu modeldeki adlarla güncellemesi söylenmeli.
- **Boş bırakılan vurgu:** Cümleye karşılık gelen bir model parçası yoksa vurgu boş bırakıldı. Bu üç durumda olur:
  - iç mekân cümlesi (kart gösterir)
  - tarih ya da kişi cümlesi
  - modelde olmayan parça (ör. Bedesten'in iç salonu ve mahzenleri)
- **Birden çok parça:** Bir cümle iki parçayı birlikte gösteriyorsa ikisi virgülle yazıldı (hamam cümle 3: erkekler ve kadınlar soğukluğu).

## 7. Açı (kamera)

- **Panel işi:** Görev dosyasındaki hikâye tablosunda Açı sütunu yok. Açı panelde model döndürülüp «Açıyı kaydet» ile kaydediliyor (`FRONTEND_BACKEND_NOTLARI.md` §4). Bu yüzden her `hikaye.md`'nin sonunda ayrı bir **«Açı önerisi»** tablosu var: hedef parça, azimut, eğim, uzaklık ve neden.
- **Azimut:** 0° kameranın kuzeyde durup güneye baktığı açıdır; değer saat yönünde artar (90° = doğudan bakış).
- **Seçim kuralları:**
  1. İlk cümlenin açısı kapak fotoğrafının yönüne yakın seçildi, böylece fotoğraftan 3D'ye geçiş tutarlı olur.
  2. Sayı ya da plan anlatan cümlede (kubbe sayısı, avlu) yüksek eğim (70–80°, tepeden) seçildi.
  3. Kapı, pencere, kemer gibi detay cümlelerinde düşük eğim (5–15°) ve yakın kadraj seçildi.
  4. Kartlı iç mekân cümlelerinde açı değişmez, bir önceki açıda kalır; böylece kamera boşuna oynamaz.
  5. Son cümlede ilk açıya dönülür.
- **Yönler:** Yön gerektiren açılar `veri/bursa/osm_secilen.csv` merkezlerinden hesaplandı (20 Ekim 2026). Bedesten Ulucami'nin ~140 m kuzeyinde, Koza Han ~160 m doğu-kuzeydoğusunda; Emir Hanı'nın kapak fotoğrafı kuzeydoğudan. İlk turdaki «Bedesten doğuda» tahmini yanlıştı.

## 8. Senin ya da Muhammed'in kararı gerekenler

1. **Güven etiketleri:** Tümü öneri.
2. ~~**Fotoğraf lisansı**~~ Çözüldü: arşiv ve envanter proje için verildi (20 Ekim 2026).
3. ~~**Koza Han kitabesi**~~ Çözüldü: Instagram ekran görüntüsü çıkarıldı, yerine arşivden kitabesi okunan mescit fotoğrafı kondu (20 Ekim 2026).
4. **Ayasofya klasörü:** Hangi yapı ve içerik gerekiyor mu?
5. ~~**Rota sırası:** Kesinleşince «sonraki durak» cümleleri eklenir.~~ Çözüldü (22 Ekim 2026): 4 durak, bkz. §1.
6. **Modellerin yeni sürümleri:** 20 Ekim 2026'da kontrol edildi (§6); sonraki sürümlerde tekrar.
7. **İngilizce çeviri:** Türkçe onaylandıktan sonra yapılacak (görev dosyası).
