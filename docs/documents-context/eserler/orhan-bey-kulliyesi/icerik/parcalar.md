# Orhan Bey Camii · 3D parça kartları

30 Ekim 2026. 3D modelde bir parçaya dokununca açılan kartların içeriği. Uygulama bu tabloyu `services/api/scripts/editorial_reader.py` ile okur; üründe aynı alanlar `parca_bilgi` tablosuna karşılık gelir. Biçim, ton ve uzunluk Ulucami'deki kartlarla aynı (`ulu-cami/icerik/parcalar.md`); başlangıç noktası 29 Ekim taslağı (`_eski/parcalar_taslak.md`).

**Kural:** Kartı olan parça tıklanır, kartı olmayan tıklanmaz. Bir parçayı tıklanabilir yapmak için bu tabloya bir satır eklemek ya da var olan satırın «Parçalar» hücresine parçanın model adını yazmak yeter; kod değişmez.

Kaynak önceliği `ICERIK_YONTEMI.md` ile aynı: önce Bursa Vakıf Eserleri Envanteri (`E cilt-N PDF s.X` = envanter kitabının PDF sayfası; metnin tamamı `eser-hakkinda.md`'de), sonra eserin notlarındaki kaynaklı bilgiler. Metinler envanter metniyle tek tek karşılaştırıldı; kaynakta olmayan bilgi yazılmadı. Fotoğraflar `foto/` klasöründen (`fotograflar.md` listesi); fotoğraf hücresi boşsa kart, eserin kapak fotoğrafını gösterir. Parça adları `3d/export/orhan-bey-camii_v11_sunum.glb` dosyasının üst düzey nesne adlarıyla birebir karşılaştırıldı (30 Ekim 2026).

Sütunlar: **Parçalar** = modeldeki nesne adları (virgülle; hepsi aynı kartı açar) · **Fotoğraflar** = sırayla, kartta yana kaydırılır; ilki kapaktır.

| Parçalar | Başlık | Metin | Fotoğraflar | Kaynak | Güven |
|---|---|---|---|---|---|
| Cami_Govde, Cami_Ortu | Cami ve cepheleri | Cami, Orhan Bey'in külliyesinin parçası olarak 1339–40'ta yapıldı; külliyeden bugüne yalnız cami, Emir Hanı ve Orhan Hamamı ulaşabildi. Beden duvarları moloz taş ve aralarına yatay, dikey yerleştirilen tuğlalarla örülmüştür. Doğu cephesinde tuğla ve taşla baklava, batı cephesinde dama desenli süslemeler vardır. | 01_dis-havadan.jpg, 06_cephe-tugla-suslemesi.jpg | E cilt-1 PDF s.96, s.98, s.100 | Doğrulanmış |
| Kubbe_Ana, Kubbe_Pencereler | Orta kubbe | Orta mekân, Türk üçgenli sekizgen bir kasnağa oturan kubbeyle örtülüdür. Kubbedeki ve eteklerindeki yuvarlak kemerli, alçı şebekeli yedi pencerede rumi ve palmet motifli süslemeler vardır. Caminin kubbeleri ve çatısı tamamen kurşunla kaplıdır. | 04_tepeden.jpg, 07_kubbe-ici.jpg | E cilt-1 PDF s.100, s.101 | Doğrulanmış |
| Orta_Mekan, Pandantifler, Ic_Kubbeler, Ic_Zemin | Orta mekân | İki kanatlı ahşap kapıdan 8,90 × 9,90 metrelik orta mekâna girilir; iki yanında iki sakıf, bunların üstünde müezzin mahfili vardır. İç mekân doğu, batı ve mihrap duvarlarındaki altlı üstlü ikişer pencereden ve kubbedeki pencerelerden ışık alır. Başta dikdörtgen olan alt pencereler 1905 tadilatında sivri kemerli yapıldı. | 07_kubbe-ici.jpg, 02_ic-harim.jpg | E cilt-1 PDF s.100, s.101, s.102 | Doğrulanmış |
| Mihrap_Eyvani, Kubbe_Mihrap | Asıl ibadet mekânı | Orta mekândan dört basamaklı mermer merdivenle 9,64 × 8,83 metrelik mihraplı bölüme çıkılır. Sanat tarihinde yalnız tabhaneli/zaviyeli camilerde «asıl ibadet mekânı» denen bölüm budur. Prizmatik tromplar ve Türk üçgenleriyle geçilen kubbesinde kırmızı madalyon içinde baklava motifi ve palmet bezemeler vardır. | 02_ic-harim.jpg, 04_tepeden.jpg | E cilt-1 PDF s.101, s.102 | Doğrulanmış |
| Cami_Mihrap, Ic_Mihrap | Alçı mihrap | Bursa'da kendisinden sonra yapılan selatin camilerine örnek olan mihrap, alçı işçiliğinin ileri düzeydeki en güzel örneklerinden sayılır. Yaldızlı, yedi katlı mukarnas kavsarası rumi-palmet motifleri ve lotus çiçekleriyle süslüdür. Öbür camilere göre pek değişmeden bugüne ulaşmış olması onu önemli bir mimari değer yapar. | 03_mihrap.jpg | E cilt-1 PDF s.102 | Doğrulanmış |
| Tabhaneler, Kubbe_Tabhaneler | Tabhaneler | Orta mekânın doğu ve batısında, sivri kemerlerle ayrılan ve birer basamakla çıkılan, yaklaşık 6,05 × 9,10 metrelik kubbeli tabhaneler vardır. Bu düzenle cami, ibadet ve tekke işlevini aynı yapıda toplayan erken Osmanlı mimarisinin karakteristik örneklerindendir. 1905'te tabhanelerin ara duvarları kaldırılarak camiye katıldı; doğudaki bugün kadınlar mahfilidir. | 04_tepeden.jpg, 02_ic-harim.jpg | E cilt-1 PDF s.97, s.101 | Doğrulanmış |
| Cami_SonCemaat | Son cemaat yeri | Beş gözlü son cemaat yeri 25,80 × 6,30 metredir ve tamamen kubbelerle örtülüdür. Anadolu Türk mimarisi ile Osmanlı mimarisinin ilk anıtsal son cemaat yerlerinden biridir. Revağın yan cepheleri sağır değildir; devşirme kompozit başlıklara oturan ikişer sivri kemerle dışa açılır. | 05_revak-ikiz-kemer.jpg, 08_avlu-sadirvan.jpg | E cilt-1 PDF s.97, s.98 | Doğrulanmış |
| Giris_Koridoru | Giriş ve Orhan Kütüphanesi | Küçük kubbeli giriş sahanlığının iki yanında birer oda vardır. Batıdaki oda 1863'te Ahmed Vefik Paşa'nın getirttiği kitaplarla Orhan Kütüphanesi oldu; 1969'a kadar süren bu kütüphane, bugünkü İnebey Yazma Eserler Kütüphanesi'nin temelini oluşturur. Cümle kapısının üstündeki mermer alınlıkta caminin Çelebi Mehmed dönemine ait onarım kitabesi vardır. | 09_cumle-kapisi.jpg | E cilt-1 PDF s.100 | Doğrulanmış |
| Minber | Minber ve vaaz kürsüsü | Minber ve vaaz kürsüsü ahşaptır ve sade bir işçiliğe sahiptir. Mihrabın sağında ve solunda tarihî şamdanlar durur. | 02_ic-harim.jpg | E cilt-1 PDF s.102, s.103 | Doğrulanmış |
| Minare | Minare | Caminin kuzeydoğu köşesindeki çokgen gövdeli minare, zarif tuğla işçiliği ve yer yer yıldız motifleriyle dikkat çeker. Tek şerefesinin altı iki sıra stalaktitle süslüdür. Külahı 1899'da kesme taştan yapıldı, 2020–2023 restorasyonunda yeniden kurşunla kaplandı. | 01_dis-havadan.jpg | E cilt-1 PDF s.103 | Doğrulanmış |
| Sadirvan | Şadırvan | Caminin avlusundaki şadırvan, 2020–2023 yıllarındaki restorasyonda ahşap çatısı ve bezemeli kubbesiyle özgün hâline kavuşturuldu. | 08_avlu-sadirvan.jpg, 01_dis-havadan.jpg | E cilt-1 PDF s.103 | Doğrulanmış |

## Kartı olmayan (tıklanmayan) parçalar

`Zemin_*`, `Cevre_*` (`Cevre_Agac_Govde` dahil), `Olcek_*` (zemin, ağaç ve ölçek figürleri). Bütün yapı parçalarının kartı var.

## Notlar

- Cephe süslemelerinin Çelebi Mehmed dönemine ait olabileceği görüşü (s.100) «Tarihsel çıkarım» olduğu için karta alınmadı.
- Parvillée onarımı için kitapta «1863-186 yıllarında» yazıyor (eksik yıl, s.103); karta alınmadı.
- `Kubbe_Mihrap` dış kubbe, `Mihrap_Eyvani` iç mekân; ikisi de «Asıl ibadet mekânı» kartını açar. `Cami_Mihrap` (dıştaki mihrap çıkıntısı) hikâyede mihrap cümlesinin vurgusu olduğu için «Alçı mihrap» kartına bağlandı.
