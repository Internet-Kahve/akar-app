# Orhan Gazi Türbesi · 3D parça kartları

30 Ekim 2026. 3D modelde bir parçaya dokununca açılan kartların içeriği. Uygulama bu tabloyu `services/api/scripts/editorial_reader.py` ile okur; üründe aynı alanlar `parca_bilgi` tablosuna karşılık gelir. Biçim, ton ve uzunluk Ulucami'deki kartlarla aynı (`ulu-cami/icerik/parcalar.md`); başlangıç noktası 29 Ekim taslağı (`_eski/parcalar_taslak.md`).

**Kural:** Kartı olan parça tıklanır, kartı olmayan tıklanmaz. Bir parçayı tıklanabilir yapmak için bu tabloya bir satır eklemek ya da var olan satırın «Parçalar» hücresine parçanın model adını yazmak yeter; kod değişmez.

Kaynak önceliği `ICERIK_YONTEMI.md` ile aynı: önce Bursa Vakıf Eserleri Envanteri (`E cilt-N PDF s.X` = envanter kitabının PDF sayfası; metnin tamamı `eser-hakkinda.md`'de), sonra eserin notlarındaki kaynaklı bilgiler. Metinler envanter metniyle tek tek karşılaştırıldı; kaynakta olmayan bilgi yazılmadı. Fotoğraflar `foto/` klasöründen (`fotograflar.md` listesi); fotoğraf hücresi boşsa kart, eserin kapak fotoğrafını gösterir. Parça adları `3d/export/orhan-gazi-turbesi_v06_sunum.glb` dosyasının üst düzey nesne adlarıyla birebir karşılaştırıldı (30 Ekim 2026).

Sütunlar: **Parçalar** = modeldeki nesne adları (virgülle; hepsi aynı kartı açar) · **Fotoğraflar** = sırayla, kartta yana kaydırılır; ilki kapaktır.

| Parçalar | Başlık | Metin | Fotoğraflar | Kaynak | Güven |
|---|---|---|---|---|---|
| Govde | Türbe | Orhan Gazi'nin türbesi Hisariçi'nde, bugün «Osmangazi Meydanı» denen tarihî alandadır. 1855 depreminde tamamen yıkılan yapıyı, Osman Gazi Türbesi'yle birlikte Sultan Abdülaziz yeniden yaptırdı. Kare planlı bina 16,80 × 16,80 metredir, duvarları 1,30 metre kalınlığındadır; pencereleri yuvarlak kemerli ve mermer sövelidir. | 01_dis.jpg, 04_tepeden-iki-turbe.jpg | E cilt-2 PDF s.115, s.116 | Doğrulanmış |
| Kubbe, Ic_Kubbe | Kubbe | Kadı sicillerindeki belgelere göre eski türbenin üstü birden çok kubbeyle örtülüydü; yeni bina tek kubbeli yapıldı. Sivri kemerlere oturan pandantifli kubbenin içi kartuş düzeninde kalem işleriyle, pandantifler ve pencere alınlıkları iri barok motiflerle süslüdür. | 01_dis.jpg, 05_ic-tepeden.jpg | E cilt-2 PDF s.116, s.117 | Doğrulanmış |
| Giris_Holu | Giriş holü | Türbenin girişinde, Osman Gazi Türbesi'nde olduğu gibi iki sütunçeli bir sundurma ve dikdörtgen planlı bir giriş holü bulunduğu bilinir. Son yıllardaki restorasyonda bu bölümler özgün yapıya uygun olarak yeniden yapıldı. | 01_dis.jpg | E cilt-2 PDF s.117 | Doğrulanmış |
| Orta_Kubbe_Sutunlar, Dehliz | Dört sütun ve dehliz | Mermer söveli, dilimli kemerli kapıdan girilen yapının ortasında, Bursa'daki I. Murad Hüdavendigâr ve II. Murad türbelerinde olduğu gibi dört sütuna oturan küçük bir kubbe vardır. Kubbenin çevresini beşik tonozlarla örtülü bir dehliz kuşatır. Sütun başlıklarında barok tarzlı volüt süslemeler sıralanır. | 05_ic-tepeden.jpg, 02_ic-sanduka.jpg | E cilt-2 PDF s.116 | Doğrulanmış |
| Orhan_Gazi_Sandukasi | Orhan Gazi'nin sandukası | Ortadaki mermer kaide üzerinde, yeşil çuha kaplı puşideyle örtülü sanduka Orhan Gazi'nindir ve pirinç bir şebekeyle çevrilidir. Üstünde beyaz kandilli, mavi kristal bir avize asılıdır. Yıpranan puşidenin yerine Bursa Olgunlaşma Enstitüsü'nün 2018'de başlayıp 2023'te bitirdiği yeni örtü, eskisi kaldırılmadan üstüne serildi. | 02_ic-sanduka.jpg | E cilt-2 PDF s.117 | Doğrulanmış |
| Sandukalar | Yirmi sanduka | Türbede Orhan Gazi'ninkinden başka yirmi sanduka daha vardır; tuğladan örülmüş, mermer görünümlü setlerin üzerindedir. Eşi Nilüfer Hatun, oğlu Şehzade Kasım, Yıldırım Bayezid'in kızı Fatma Sultan, Cem Sultan'ın oğlu Abdullah ve II. Bayezid'in oğlu Şehzade Korkut'un sandukaları tanımlanabilmiştir; öbürlerinin kime ait olduğu bilinmez. | 03_nilufer-hatun.jpg, 05_ic-tepeden.jpg | E cilt-2 PDF s.117 | Doğrulanmış |
| Ic_Duvarlar, Ic_Zemin | Türbenin içi | Türbe her cephede üçer, giriş cephesinde ikişer pencereden ışık alır; Hereke kumaşından perdeler sade iç mekâna hafif bir saray etkisi verir. Türbedar odasının olmaması, sade şebekeler ve bezemesiz sanduka örtüsü, yapının Osman Gazi Türbesi'ne göre çok daha sade düzenlendiğini gösterir. Eski yapıdan bugün yalnız döşemedeki mozaik parçaları görülür. | 02_ic-sanduka.jpg, 05_ic-tepeden.jpg | E cilt-2 PDF s.116, s.117 | Doğrulanmış |

## Kartı olmayan (tıklanmayan) parçalar

`Zemin_*`, `Cevre_*`, `Olcek_*` (zemin, ağaç ve ölçek figürleri). Bütün yapı parçalarının kartı var.

## Notlar

- Yeniden yapım yılı kitapta iki farklı: PDF s.116 «H. 1280 / M. 1863», s.117 «1868». Kartta yıl verilmedi.
- Orhan Gazi'nin aynı yapı kompleksine, «muhtemelen» camiye dönüştürülen bölüme defnedildiği bilgisi (s.115) kesin olmadığı için karta alınmadı.
