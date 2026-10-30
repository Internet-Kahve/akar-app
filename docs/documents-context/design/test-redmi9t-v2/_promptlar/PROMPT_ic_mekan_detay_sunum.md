# Prompt: iç mekân detay turu, yalnız sunum dosyası (29 Ekim 2026)

Kullanım: kod bloğunu 3D üretim ajanına (akar-3d-model) olduğu gibi ver. `PROMPT_icini_goster_3_eser.md` işi sürüyorsa (Türbe, Orhan Camii) ajan önce onu bitirir, sonra bu işe geçer. Ajan Ulucami'yi bitirince durur; onaydan sonra diğerlerine geçer.

## Karar (kullanıcı, 29 Ekim)

**Eser başına iki model:**
- `<glb>.glb` haritada kullanılır; hafiftir, iç mekânı yoktur.
- `<glb>_sunum.glb` eser detayında, anlatımda ve «Eser hakkında»da kullanılır; iç mekân dış kadar ayrıntılıdır.

İç mekân yalnız sunum dosyasında olacak. Haritada çatı hiç kalkmadığı için iç mekân orada görünmez; harita dosyasında olması boşuna indirme olur.

## Prompt

```
AKAR 3D: iç mekânları dış kadar ayrıntılı yap. YALNIZ SUNUM GLB'si. Harita GLB'si iç mekânsız ve hafif kalır.

KAPSAM VE SIRA
1. Ulucami (referans eser; en ayrıntılısı).
2. Bedesten.
3. Orhan Gazi Türbesi.
4. Orhan Bey Camii.
- Türbe ve Orhan Camii'nin temel iç mekânı (PROMPT_icini_goster_3_eser.md) bitmediyse önce onu bitir, sonra bu turu uygula.
- Ulucami'yi bitirince DUR ve rapor ver; kullanıcı onaylayınca sıradakine geç.
- Orhan Bey Hamamı, Koza Hanı ve Emir Hanı'na DOKUNMA.

ÖNCE OKU
- docs/documents-context/yaptiklarim-2.md §31 (kurallar) ve son maddeler (Bedesten v10 iç mekânı).
- Eserin 3d/README.md, ref/plan/, ref/foto/, ref/metin/, icerik/eser-hakkinda.md, icerik/fotograflar.md + icerik/foto/, icerik/parcalar.md ya da parcalar_taslak.md, icerik/hikaye.md.
- Uygulamada kamera nasıl çalışıyor (yalnız oku, DEĞİŞTİRME): design/test-redmi9t-v2/app.js → Sahne3D.
  - Kamera modelin dışında, yörüngede döner. En düşük eğim yaklaşık 5°. En yakın uzaklık yapı yarıçapının 0,3 katı.
  - İç mekân yalnız «İçini göster» ile örtü kalkınca, yukarıdan ve 30–70° eğimden görülür.
  - Bu yüzden ayrıntı bu açılardan okunacak ölçekte olsun. Yalnız içeriden yerden görülecek minik ayrıntı boşa gider.

İKİ DOSYA KURALI
- Sunum GLB: dış + iç mekân (ayrıntılı) + zemin/ağaç/ölçek insanları.
- Harita GLB: yalnız dış.
  - İç mekân parçaları çıkarılır. Kalkan örtü parçaları (kubbe, çatı) dışın parçasıdır, kalır. Kasnak ağzı açık kalabilir, haritada üstten görünmez; görünürse kapat.
  - Dış görünüm sunumla birebir aynı: aynı kameradan render farkı < %0,1, zemin/ağaç hariç.
- model.json'a «ic_parcalar»: [...] listesi ekle: yalnız sunumda olan iç parçaların adları. _aciklama'ya tek cümle: «ic_parcalar: yalnız sunum GLB'sinde olan iç mekân parçaları; harita GLB'sinde yok (29 Ekim 2026, eser başına iki model).»
- Referans denetimi (blend_hat/parca_dogrula.mjs) iki kurala göre güncellenir:
  (a) İçerikte geçen her ad (hikâye, kartlar, okuma, görevler, ortu_gruplari) SUNUM GLB'sinde var.
  (b) Harita GLB'sinde ana_parca ve ic_parcalar dışındaki bütün yapı parçaları var; ic_parcalar'dan hiçbiri yok.

KAYNAK VE DOKU KURALI (uydurma yok)
- Her öğe bir plan, kesit ya da fotoğrafa dayanır; README'de kaynak dosya ve sayfa yazılır.
- Fotoğraf kaynağı: eserin icerik/foto/ ve ref/foto/ klasörleri. Ulucami için örnek fotoğraflar:
  - 02 ve 34 iç genel; 03 ve 28 havuz;
  - 05, 23 ve 30 minber; 06, 24 ve 25 mihrap;
  - 07, 20, 21 ve 22 hat; 11 ve 29 kubbe içi; 26 kemerler; 27 payeler ve levhalar.
- Dokular yalnız iki yoldan gelir:
  (1) Kodla üretilen geometrik desen. _kutuphane/ ve design/desenler/desen.py yöntemi: Hankin; renkler fotoğraftan ölçülür.
  (2) Projenin izinli fotoğraflarından kırpma. Vakıf Katılım envanter arşivi. Kırpılan fotoğraf README'de yazılır.
  YAPAY ZEKÂYLA GÖRSEL ÜRETME. İnternetten görsel alma. Foto Atlas'taki ND lisanslı görseli doku yapma.
- Hat yazıları: okunur sahte yazı üretme. Ya ilgili levhanın fotoğrafından kırpılmış doku kullan, ya da yalnız çerçeve ve zemin rengini koy (yazısız).
- Renkler malzeme-paleti.json'a rol olarak eklenir. Yeni rol varsa raporda yaz. Kodda hex sabiti yok.

ESER BAŞINA AYRINTI LİSTESİ (kaynakta olanı yap, olmayanı atla ve raporda yaz)
Ulucami:
- Mihrap: niş, mukarnas kavsara, çerçeve bordürleri, yan sütunçeler. Kaynak: 06, 24, 25; E cilt-1 s.27–28 ölçü (5,13 × 8,11 m, 29 cm çıkıntı).
- Minber: kündekâri yan aynalar (geometrik dokuyla), merdiven, korkuluk, köşk ve külah, kapı. Kaynak: 05, 23, 30; envanter.
- Havuzlu şadırvan: çokgen havuz kenarı, su yüzeyi, ortadaki kademeli selsebil/fıskiye. Kaynak: 03, 28.
- Zemin halısı: saf düzeninde, kıble yönünde. Renk ve desen fotoğraftan (02, 34): kodla üretilen tekrar eden doku. Havuz çevresi ve mihrap önü ayrı sınırlarla.
- Payeler: kalem işi bantlar ve büyük hat levhaları. Kaynak: 27, 21, 22. Levha dokusu fotoğraftan kırpılır.
- Kemerler: iki renk taş ya da boya bantları, fotoğrafta varsa (26).
- Kubbe içleri: göbek ve kuşak kalem işi, kasnak pencereleri. Kaynak: 11, 29. Örtü kalkınca kasnak ağzından görünür.
- Müezzin mahfili (ahşap, sütunlu), avizeler / kandil çemberleri, kapıların iç yüzü, varsa mahfiller: kaynakta (plan, fotoğraf, envanter) varsa.
Bedesten:
- Kubbe iç yüzleri ve pandantifler; kemer aynalarında tuğla örgü (Alan Başkanlığı föyü s.8).
- Mahzen ağızları: bugünkü camekânlı dükkân cepheleri. Ayak çevresindeki 2007 camekânları: fotoğrafta varsa bugünkü hâliyle, «bugün» olarak.
- Taş döşeme dokusu (Ekinci PDF 103); şadırvan musluklu orta tas (PDF 96 foto 3).
- v10'da «belirsiz» bıraktıkların yeni kaynak bulursan.
Orhan Gazi Türbesi:
- 21 sanduka, iç fotoğraf anahtar planına göre yerleşim. Orhan Gazi sandukası: mermer kaide, pirinç şebeke, yeşil puşide. Diğerleri: tuğla sanduka, mermer kaplama.
- Dört sütunlu orta kubbe ve sütun başlıkları; dehliz beşik tonozu; iç pencereler.
- Zemin: kaynakta ne yazıyorsa o; mozaik ya da döşeme varsa fotoğraftan.
- Kaynak: envanter C2 s.115–117; Yurt 2024 PDF 224, 326; fotoğraflar 02, 03, 05.
Orhan Bey Camii:
- Mihrap, minber (varsa), orta mekân ve mihrap eyvanı zemini, halı, tabhane odalarının ocak/nişleri, kubbe içleri, kalem işi.
- Kaynak: planlar, kesit, fotoğraflar 02, 03, 07; envanter.

SINIRLAR (sunum GLB'si)
- Üçgen: toplam ≤ 139.152 (ürün sınırı). Ulucami şu an 97.496; iç ayrıntıya yaklaşık 40.000 kalır, iyi dağıt.
- Dosya ≤ 2,5 MB (ürün sınırı 5 MiB; telefonda eser detayı tek modeli yükler).
- Dokular: JPEG kalite 80, en çok 1024 px. Tekrar eden desen 512 px karo. Doku sayısı eser başına ≤ 8.
- Draw call ≤ 80: aynı malzemeleri birleştir.
- Harita GLB'si iç mekân çıkınca KÜÇÜLMELİ; önce/sonra yaz.
- Dış görünüm, parça adları (dış), ana_parca ve haritadaki konum değişmez.

İÇERİK BAĞLANTILARI
- Yeni iç parçalar kart olabilecek birimler olarak kökte adlandırılır. Ulucami'de var olan adlar (Mihrap, Minber, Ic_Sadirvan_Havuz, Payeler, Kemerler, Levhalar, Ic_Zemin) DEĞİŞMEZ; ayrıntı bu parçaların içine eklenir.
- Yeni kök parça açarsan: kart taslağına satır ekle (Ulucami'de parcalar.md'ye DOKUNMA; yalnız raporda öner).
- hikaye.md metnine dokunma.

KONTROL (kontrol/<sürüm>/)
- ic_detay.png:
  - aynı kameradan örtü kalkmış 4 kare (azimut 30/120/210/300, eğim 55);
  - mihrap, minber, şadırvan ve halıya yakın kareler;
  - her yakın karenin yanında kaynak fotoğraf.
- dis_esitlik.png: harita GLB'si ile sunum GLB'si dıştan aynı kameradan, fark yüzdesi.
- tiklama_haritasi.png.
- Sayılar: üçgen, dosya boyutu, doku listesi (ad, px, KB, kaynak), draw call. İki dosya için önce → sonra.
- python3 docs/documents-context/design/harita/modelleri-gom.py (harita GLB'si değiştiği için).

KURALLAR
- apps/ ve frontend/backend koduna dokunma; app.js'e dokunma; test-redmi9t/ (v1) değişmez.
- git komutu çalıştırma; blend/build repoya girmez (Drive). Eski sürümleri silme.
- Yeni sürüm (Ulucami v30 …); model.json glb; 3d/README.md sürüm satırı ve kaynak tablosu; yaptiklarim-2.md en altına eser başına madde.

RAPOR (her eser bitince): eklenen ayrıntılar ve kaynakları, dokular, atladıkların ve neden, «belirsiz»ler, sayılar, görsel yolları. Sonra DUR.
```
