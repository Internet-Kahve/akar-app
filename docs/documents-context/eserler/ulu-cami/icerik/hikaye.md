# Ulucami · hikâye

19 Ekim 2026. Kaynak önceliği: Bursa Vakıf Eserleri Envanteri (Vakıf Katılım'ın sağladığı kaynak). Kaynak kodu `E cilt-N PDF s.X` = envanter kitabının **PDF sayfası**. Güven sütunu **öneridir**; son kararı Muhammed verir. Seçim kuralları: `../../../ICERIK_YONTEMI.md`. Fotoğraflar `foto/` içinde; ayrıntıları `fotograflar.md`.

Hero eser: 12 cümle (~1,5–2 dk). Her cümle tek bilgi, en fazla ~20 kelime.

| # | Cümle (TR) | Fotoğraf | Kart | Vurgu (3D) | Kaynak | Güven (öneri) |
|---|---|---|---|---|---|---|
| 1 | Ulucami'yi Sultan Yıldırım Bayezid yaptırdı. | 01_dis-havadan-kuzey.jpg | hayır | — | E cilt-1 PDF s.20 | Doğrulanmış |
| 2 | Üç yıl süren inşaatın ardından cami, 1399'da bir cuma günü ibadete açıldı. | 01_dis-havadan-kuzey.jpg | hayır | — | E cilt-1 PDF s.19 | Doğrulanmış |
| 3 | Caminin mimarı kesin olarak bilinmiyor. | 08_tac-kapi.jpg | hayır | Tac_Kapi | E cilt-1 PDF s.20, s.21 | Doğrulanmış |
| 4 | Yaklaşık 55'e 69 metrelik yapının üstünü yirmi kubbe örter. | 04_dis-tepeden.jpg | hayır | Kubbeler_19 | E cilt-1 PDF s.25 | Doğrulanmış |
| 5 | On bir metre çapındaki kubbeler, on iki kare payenin üzerine oturur. | 02_ic-genel.jpg | evet | Kubbeler_19 | E cilt-1 PDF s.26 | Doğrulanmış |
| 6 | Ortadaki kubbenin üstü açıktır; içeriye ışık ve hava buradan girer. | 04_dis-tepeden.jpg | hayır | Sadirvan_Kubbe | E cilt-1 PDF s.25, s.31 | Doğrulanmış |
| 7 | Bu kubbenin altındaki mermer havuzda, üç katlı bir selsebilden su akar. | 03_ic-sadirvan-havuz.jpg | evet | Sadirvan_Kubbe | E cilt-1 PDF s.33 | Doğrulanmış |
| 8 | Duvarlarında ve payelerinde yaklaşık yüz yetmiş hat yazısı ve levhası bulunur. | 07_hat-vav.jpg | evet | — | E cilt-1 PDF s.31 | Doğrulanmış |
| 9 | Ahşap minber, çivi ve tutkal kullanılmadan birbirine geçen parçalarla yapılmıştır. | 05_minber.jpg | evet | — | E cilt-1 PDF s.27 | Doğrulanmış |
| 10 | Caminin arsası Orhan Vakfı'na aitti; Yıldırım Bayezid vakfa karşılığında başka bir arazi verdi. | 09_kubbeler-minare.jpg | hayır | — | E cilt-1 PDF s.25, s.33 | Doğrulanmış |
| 11 | Yıldırım Bayezid, Ulucami'ye gelir sağlamak için yakınına Bedesten'i de yaptırdı. | 13_akar-bedesten-tepeden.jpg | evet | — | E cilt-1 PDF s.11; E cilt-2 PDF s.29 | Doğrulanmış |
| 12 | Sonraki durak, Ulucami ile Orhan Camii arasındaki Koza Han. | 10_avlu-sadirvan.jpg | hayır | — | E cilt-2 PDF s.8 | Doğrulanmış |

## Notlar

- **Cümle 11 (akar):** Fotoğraf Yıldırım Bayezid Bedesteni'ne aittir; kart başlığı «Yıldırım Bayezid Bedesteni, havadan» olmalı. Kart "evet": model Bedesten'i göstermiyor.
- **Cümle 3:** Kitap mimar için Ali Neccâr, Hacı İvaz ve Konyalı Hacı Alâaddin adlarını «düşünülmektedir» diye verir. Hikâyede yalnız «bilinmiyor» bilgisi kullanıldı; adlar `eser-hakkinda.md`'de "Tarihsel çıkarım" paragrafında.
- **Cümle 7:** Havuzun kenar sayısı kitapta iki farklı yazılmış (PDF s.25 «onikigen», PDF s.33 «on altı kenarlı»). Bu yüzden cümlede sayı verilmedi.
- **Cümle 12:** Mesafe ya da yürüme süresi için kaynak yok, yazılmadı.
- **Tam_Baglam §10'daki eski cümleler:**
  - "Osmanlı'nın dördüncü padişahıdır": envanterde bulunamadı, çıkarıldı.
  - "Bedestenin geliri Ulucami'nin bakımına ayrılırdı": kitap «Ulucami'ye gelir sağlamak amacıyla» diyor; «bakım» ayrıntısı yok, cümle 11 kitaptaki ifadeye göre yeniden yazıldı.
  - "Ortadaki şadırvanın kubbesi açıktır": cümle 6 ve 7 olarak kaynağıyla bölündü.
- **Vurgu adları** doğrudan `3d/export/ulu-cami_v22.glb` içindeki nesne adlarından alındı (`eser.md` tablosundaki `Kubbeler` modelde `Kubbeler_19` olarak geçiyor; açık orta kubbe ayrı nesne: `Sadirvan_Kubbe`). İç mekân cümlelerinde (8, 9) model parçası yok; kart fotoğrafı gösterir. Cümle 10 (arsa) için anlamlı bir parça olmadığından vurgu boş.

## Açı önerisi (panelde «Açıyı kaydet» ile girilir)

Görev dosyasında `hikaye.md` tablosunda Açı sütunu yok; açı panelde model döndürülerek kaydediliyor (`FRONTEND_BACKEND_NOTLARI.md` §4). Aşağısı Muhammed'e kolaylık olsun diye öneridir. Azimut: 0° = kuzeyden bakış, saat yönünde. Kaydedilmeyen cümle bir öncekinin açısında kalır.

| # | Hedef | Azimut | Eğim | Uzaklık | Neden |
|---|---|---|---|---|---|
| 1 | Merkez | 0° (kuzey) | 30° | bütün yapı + minareler kadrajda | Kapak fotoğrafıyla aynı yön |
| 2 | — | (1'de kalır) | | | |
| 3 | Tac_Kapi | 0° | 10° | yakın, kapı kadrajın yarısı | Taç kapı fotoğrafıyla aynı |
| 4 | Kubbeler_19 | 0° | 70° | bütün çatı | Yirmi kubbenin sayılabildiği tepeden görünüş |
| 5 | Kubbeler_19 | (4'te kalır) | | | Kart iç mekânı gösterir |
| 6 | Sadirvan_Kubbe | 0° | 80° | orta kubbe ve çevresindeki 8 kubbe | Açık kubbe öne çıksın |
| 7 | Sadirvan_Kubbe | (6'da kalır) | | | Kart havuzu gösterir |
| 8–9 | — | (6'da kalır) | | | İç mekân kartları |
| 10 | Merkez | 135° (güneydoğu) | 35° | bütün yapı | Arsa / vakıf: yapının tamamı |
| 11 | Merkez | 90° (doğu) | 35° | bütün yapı | Bedesten'e bakan yön (doğrulanmalı); kart Bedesten'i gösterir |
| 12 | Merkez | 0° | 30° | 1'e dönüş | Kapanış |

Cümle 11'deki «doğu» yönü haritadan yaptığım tahmindir; klasörlerde Bedesten'in koordinatı yok, panelde kontrol edilmeli. Hikâye metninde yön bilgisi verilmez.
