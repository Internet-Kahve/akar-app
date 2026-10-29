# Prompt: «İçini göster» Bedesten, Orhan Gazi Türbesi, Orhan Bey Camii ve Orhan Bey Hamamı'na (29 Ekim 2026)

Kullanım: kod bloğunu 3D üretim ajanına (akar-3d-model) olduğu gibi ver. Ajan Bedesten'i bitirince durur. Sen render'lara bakıp «devam» dersen sıradaki esere geçer.

## Plan (özet)

| Sıra | Eser | Kalkan örtü | Altından çıkan | Kaynak | Neden bu sırada |
|---|---|---|---|---|---|
| 1 | Bedesten | 14 kubbe | 6 paye, kemerler, iki sıra iç dükkân, iç sokak | Gabriel planı ve kesiti (1 m ızgara), iç fotoğraflar 02, 05 | Ulucami'ye en benzer yapı (kubbeler ayaklara oturur); kod değişmeden çalışır; akar hikâyesi |
| 2 | Orhan Gazi Türbesi | Kubbe (kasnak ve çatı eteğiyle) | Dört sütunlu küçük orta kubbe, beşik tonozlu dehliz, 21 sanduka, pirinç şebekeli Orhan Gazi sandukası | Envanter C2 s.115–117; Yurt 2024 iç fotoğraf anahtar planı; fotoğraflar 02, 03, 05 | Küçük ve basit; içi fotoğraflarla iyi belgeli |
| 3 | Orhan Bey Camii | Ana kubbe, mihrap kubbesi, tabhane kubbeleri, kanat çatıları | Ters T plan: orta mekân, mihrap eyvanı, iki yanda tabhane odaları, mihrap | Gabriel, Ayverdi, Acar planları; kesit (1 m ızgara); fotoğraflar 02, 03, 07 | Plan tipini (tabhaneli cami) göstermenin en iyi yolu |
| 4 | Orhan Bey Hamamı | Bölüm kubbeleri | **Bugünkü** Aynalı Çarşı (dükkânlar) | Çetintaş «günümüz» planı ve kesitleri; fotoğraf 02 | Akar hikâyesi (hamam → çarşı); ama özgün hamam içi temsili olur. Bu yüzden yalnız bugünkü hâl, en sona |

Koza Hanı ve Emir Hanı açık avlulu; içi zaten görünüyor, gerek yok.

## Prompt

```
AKAR 3D: «İçini göster» özelliğini dört esere ekle. Referans Ulucami (v29).

SIRA: Bedesten → Orhan Gazi Türbesi → Orhan Bey Camii → Orhan Bey Hamamı.
Bedesten'i bitirince DUR ve rapor ver. Kullanıcı render'ları görüp onay verirse sıradaki esere geç. Her eser kendi başına bitmiş olmalı; yarım bırakma.

ÖNCE OKU
- Ulucami nasıl yaptı:
  - eserler/ulu-cami/3d/model.json → ortu_gruplari;
  - eserler/ulu-cami/3d/README.md (v27: iç mekân);
  - icerik/hikaye.md → «İç mekân (3D)» sütunu.
- Uygulamada nasıl çalışıyor (yalnız oku, DEĞİŞTİRME): design/test-redmi9t-v2/app.js → Sahne3D.yukle (kalkan) ve kubbeler(). Davranış şöyle:
  - ortu_gruplari'ndaki gruplar yukarıdan aşağı sırayla yükselip saydamlaşır, iniş tersten;
  - kalkış yüksekliği max(12 m, yapı boyu × 0,45);
  - her grup kökte bir parça adı olmalı;
  - bir grubun parçalarından biri bile modelde yoksa düğme görünmez.
- docs/documents-context/yaptiklarim-2.md §31 (kurallar), §55–57 (parça sadeleştirme).
- Eserin ref/plan/, ref/foto/, ref/metin/, icerik/eser-hakkinda.md, icerik/fotograflar.md, <eser>_notlar.md.

KAYNAK KURALI (uydurma yok)
- İçerideki her öğe bir plan, kesit ya da fotoğrafa dayanır. Ölçüler plan ızgarasından ya da kotlardan alınır.
- README'de her öğenin yanına kaynak yazılır: dosya adı ve sayfa.
- Kaynakta olmayan şey yapılmaz. Örneğin bilinmeyen bir dükkân bölmesi, süs ya da eşya.
- Emin olunmayan yerleşim sade bırakılır ve raporda «belirsiz» diye yazılır.
- İç mekân «Temsili» 3D'dir. Ayrıntı Ulucami'nin iç mekânı kadar, daha fazla değil.

HER ESERDE YAPILACAK
1. Örtüyü ayrı kök parçalara ayır. Kalkacak parçalar kökte ayrı olmalı (kubbe, kasnak, çatı, alem).
   - Sadeleştirmede birleşmiş olabilirler. Örnek: Hamam'da kubbeler bölümlere katıldı. Gerekiyorsa yeniden ayır, adını «<Bölüm>_Ortu» ya da «Kubbe_<bölüm>» koy.
   - Ayırmak tıklamayı bozmaz: uygulama bir kartın parçalarını birlikte seçer. Kart taslağında (icerik/parcalar_taslak.md) yeni örtü parçasını ait olduğu kartın «Parçalar» sütununa ekle.
2. İç yüzeyleri kur: duvarların iç yüzü, zemin, ayaklar/sütunlar, kemerler, kubbelerin iç yüzü (örtü kalkınca altta kalan kasnak ağzı), içerideki ana öğeler.
   - Gövdenin üstü kapalıysa (kapak yüzü) aç; örtü kalkınca içerisi görünmeli, düz bir kapak değil.
3. İç öğeleri anlamlı kök parçalar olarak adlandır. Ulucami'deki gibi kart olabilecek birimler. Önerilen adlar:
   - Bedesten: Payeler, Kemerler, Ic_Dukkanlar, Ic_Sokak.
   - Türbe: Orta_Kubbe_Sutunlar, Dehliz, Sandukalar, Orhan_Gazi_Sandukasi.
   - Orhan Camii: Ic_Zemin, Mihrap_Eyvani, Tabhaneler, Ic_Mihrap.
     Dış Cami_Mihrap çıkıntısıyla karışmasın. İç mihrap «Ic_Mihrap», dıştaki eski adıyla kalır.
   - Hamam: Carsi_Dukkanlari, Ic_Sokak.
4. model.json → ortu_gruplari. Yukarıdan aşağı, en üstteki önce kalkar. Örnek Bedesten: [["Kubbeler"]]. Kubbeler ve onları taşıyan kasnaklar ayrı parçaysa önce kubbeler, sonra kasnaklar. _aciklama metnine dokunma; zaten ortu_gruplari'nı anlatıyor.
5. İç mekân dış görünümü bozmaz:
   - Örtü yerindeyken normal render önceki sürümle aynı olmalı (fark < %0,1).
   - İç yüzeyler dışarıdan görünmez; dış yüzeylerle çakışma (z-fighting) yok.
   - Zemin katmanları arası ≥ 3 cm (yaptiklarim §22).
6. Bütçe:
   - Sunum GLB'sine en çok +12.000 üçgen; toplam sınır 139.152.
   - Uygulama GLB'si de aynı parçaları taşır (eser başına tek model). Dosya boyutu en çok %30 artar.
   - Doku ekleme; ortak paletteki malzemeler (malzeme-paleti.json). Yeni renk gerekiyorsa palete rol olarak ekle ve raporda yaz.
7. Ana parça (model.json → ana_parca) ve haritadaki konum değişmez. Ana parçanın yatay merkezi aynı kalmalı.
8. İçerik bağlantıları:
   - icerik/hikaye.md: metne DOKUNMA. Yalnız cümle metni açıkça iç mekândan söz ediyorsa (ör. «içeride», «dükkânlar», «sanduka», «ayak», «eyvan») şunları güncelle:
     - o cümlenin «İç mekân (3D)» sütununu «evet» yap;
     - vurgusunu yeni iç parçaya bağla.
     Değiştirdiğin her satırı raporda yaz.
   - icerik/parcalar_taslak.md: yeni iç parçalar için satır ekle (Parçalar | Önerilen başlık | Not); metin YAZMA.
   - Referans denetimi (blend_hat/parca_dogrula.mjs): içerikte ve model.json'da geçen her ad yeni GLB'de var; eksik sıfır.
9. Blender'dan üret: yeni blend ve build sürümü, blend_hat zinciri; app + sunum GLB yeni sürüm. Sonra:
   - model.json glb alanı;
   - python3 docs/documents-context/design/harita/modelleri-gom.py;
   - 3d/README.md sürüm satırı ve kaynaklar.

KONTROL (eser başına; kontrol/<sürüm>/)
- icini_goster.png: aynı kameradan (azimut 30, eğim 28, «bütün yapı») üç kare yan yana:
  - örtü yerinde;
  - örtü yarı kalkmış;
  - örtü kalkmış.
  Ayrıca tepeden 70° bir kare.
- ic_kaynak.png: içerideki ana öğeler ile plan/fotoğraf yan yana. Örnek: sandukaların dizilişi ve iç fotoğraf anahtar planı.
- tiklama_haritasi.png: yeni kök parçalar ayrı renklerde.
- Sayılar: üçgen önce → sonra, dosya boyutu önce → sonra, referans denetimi sonucu.

KURALLAR
- apps/ ve frontend/backend koduna dokunma; app.js'e dokunma; test-redmi9t/ (v1) değişmez.
- git komutu çalıştırma; blend/build repoya girmez (Drive).
- Eski sürümleri silme.
- yaptiklarim-2.md en altına eser başına yeni madde.

RAPOR (her eser bitince): kalkan gruplar, iç parçalar ve kaynakları, «belirsiz» bıraktıkların, değiştirdiğin hikâye satırları, üçgen ve boyut, görsellerin yolları. Sonra DUR.
```
