# Koza Han · 3D parça kartları

30 Ekim 2026. 3D modelde bir parçaya dokununca açılan kartların içeriği. Uygulama bu tabloyu `services/api/scripts/editorial_reader.py` ile okur; üründe aynı alanlar `parca_bilgi` tablosuna karşılık gelir. Biçim, ton ve uzunluk Ulucami'deki kartlarla aynı (`ulu-cami/icerik/parcalar.md`); başlangıç noktası 29 Ekim taslağı (`_eski/parcalar_taslak.md`).

**Kural:** Kartı olan parça tıklanır, kartı olmayan tıklanmaz. Bir parçayı tıklanabilir yapmak için bu tabloya bir satır eklemek ya da var olan satırın «Parçalar» hücresine parçanın model adını yazmak yeter; kod değişmez.

Kaynak önceliği `ICERIK_YONTEMI.md` ile aynı: önce Bursa Vakıf Eserleri Envanteri (`E cilt-N PDF s.X` = envanter kitabının PDF sayfası; metnin tamamı `eser-hakkinda.md`'de), sonra eserin notlarındaki kaynaklı bilgiler. Metinler envanter metniyle tek tek karşılaştırıldı; kaynakta olmayan bilgi yazılmadı. Fotoğraflar `foto/` klasöründen (`fotograflar.md` listesi); fotoğraf hücresi boşsa kart, eserin kapak fotoğrafını gösterir. Parça adları `3d/export/koza-han_v18_sunum.glb` dosyasının üst düzey nesne adlarıyla birebir karşılaştırıldı (30 Ekim 2026).

Sütunlar: **Parçalar** = modeldeki nesne adları (virgülle; hepsi aynı kartı açar) · **Fotoğraflar** = sırayla, kartta yana kaydırılır; ilki kapaktır.

| Parçalar | Başlık | Metin | Fotoğraflar | Kaynak | Güven |
|---|---|---|---|---|---|
| Govde_Dis, Cati | Koza Han | Han, klasik Osmanlı han planındadır: bir avlunun çevresinde altlı üstlü odalar ve doğu cephesine bitişik, tek katlı bir ahır-depo bölümü. II. Bayezid hanı İstanbul'daki külliyesine gelir sağlamak için yaptırdı; Mart 1489'da başlayan inşaat 30 Eylül 1491'de tamamlandı. Mimarı Abdülûlâ bin Pulad Şah, bina emini Şücâ bin Karaca'dır. | 04_tepeden.jpg, 01_dis-cephe-koza-han.jpg | E cilt-2 PDF s.8, s.9 | Doğrulanmış |
| Cephe | Bir han, birçok ad | Han tarih boyunca «Yeni Han», «Beylik Han», «Simkeş Han», «Sırmakeş Han», «Beylik Kârbansaray» gibi adlarla anıldı. Pirinç Hanı yapıldıktan sonra «Eski Yeni Han» diye tanınmaya başladı. Orhan Camii, Emir Hanı ve Ulucami ile aynı aks üzerinde durması, şehirdeki ticaret odaklı yerleşim anlayışının sürdüğünü gösterir. | 01_dis-cephe-koza-han.jpg, 07_dis-cephe-bahce.jpg | E cilt-2 PDF s.8, s.9 | Doğrulanmış |
| Portal | Kuzey kapısı | Alan Başkanlığı envanter föyüne göre hanın kuzey cephesinde taş kabartmalarla bezeli bir kapı bulunur. Han, Orhan Camii ile Ulucami arasında, Çarşı ve Hanlar Bölgesi'nde yer alır. | 09_havadan-aks.jpg | E cilt-2 PDF s.8; W Bursa Alan Başkanlığı envanter föyü N19 | Doğrulanmış |
| Avlu_Revak, Revak_Kubbeleri, Revak_Tonozlari, Revak_Doseme | Revaklar ve odalar | Avlunun çevresinde altlı üstlü odalar sıralanır. Alan Başkanlığı föyüne göre üst katta 51, alt katta 50 oda vardır ve odalar iki katta da yaklaşık 3,40 metre genişliğinde bir revağa açılır. Bugün üst katta ipek ticareti yapan işletmeler, alt katta çeşitli esnaf bulunur. | 05_revak-ipek-dukkanlari.jpg, 06_ust-kat-avlu.jpg | E cilt-2 PDF s.9, s.11; W Bursa Alan Başkanlığı envanter föyü N19 | Doğrulanmış |
| Mescit | Köşk mescit ve şadırvan | Avlunun ortasında, bazı Selçuklu kervansaraylarında da görülen «köşk mescit» denen müstakil bir mescit durur. Sekizgen planlı, kesme taştan yapı sekiz altıgen ayağa oturan yuvarlak kemerlerin üstünde yükselir; kubbesi kurşunla örtülüdür ve on dört basamaklı mermer bir merdivenle çıkılır. Altındaki on altıgen havuz bir şadırvandır. Bursa'da han avlusundaki köşk mescitlerden özgün olarak günümüze ulaşabilmiş nadir yapılardandır. | 08_mescit-kitabe.jpg, 03_avlu-mescit.jpg, 10_mescit-ici.jpg | E cilt-2 PDF s.10; E cilt-1 PDF s.195 | Doğrulanmış |
| Avlu_Zemin | Avlu | Hanın avlusu bugün çay bahçesi olarak kullanılır ve halkın yoğun ilgisini görür. Koza Han, Bursa Çarşısı'nın en yoğun kullanılan ticaret alanlarından biridir. Alan Başkanlığı föyüne göre ana avlu yaklaşık 46 × 38 metredir. | 02_avlu-genel.jpg, 04_tepeden.jpg | E cilt-2 PDF s.11; W Bursa Alan Başkanlığı envanter föyü N19 | Doğrulanmış |
| Ic_Koza | İç Koza: ahırlar ve ikinci avlu | Hanın doğu duvarındaki 3,66 metre genişliğindeki bir geçitten ahırların bulunduğu ikinci avluya ulaşılır. Yaklaşık 22 × 30 metrelik bu avlu, on sekiz payeye oturan kemerlerle çevrilidir; ahır mekânının tamamı kırk beş payeyle taşınır. Bugün kahvehane ve büfe olarak kullanılan bölüm, Osmanlı döneminden günümüze ulaşabilen nadir ahır yapılarındandır. |  | E cilt-2 PDF s.9, s.10, s.11 | Doğrulanmış |

## Kartı olmayan (tıklanmayan) parçalar

`Avlu_Agac`, `Avlu_Cim` (`model.json` → `sunum_ek`: avludaki ağaç ve çim), `Zemin_*`, `Cevre_*`, `Olcek_*` (zemin, ağaç ve ölçek figürleri). Koza Han modelinde `ortu_gruplari` yok; «İçini göster» düğmesi görünmez. `Revak_Tonozlari` ve `Revak_Doseme` yalnız sunum modelinde olan iç parçalardır (`ic_parcalar`); revak kartını açar.

## Notlar

- `Ic_Koza` içindeki mermer havuz envanterde geçmiyor, yalnız bir fotoğrafa dayanıyor (Street View 04); kartta söz edilmedi.
- Arşivde kuzey kapısının fotoğrafı yok (`fotograflar.md` Notlar); «Kuzey kapısı» kartı havadan aks fotoğrafını gösterir. İkinci avlunun (İç Koza) fotoğrafı da yok; kart kapak fotoğrafını gösterir.
- Envanter üst kat revakının ahşap olduğunu yazıyor (C2 s.11, 1950'lerdeki onarım); fotoğraflarda üst kat kemerleri kâgir görünüyor. Bu cümle karta alınmadı.
- Açılış tarihi: C2 s.8 «30 Eylül 1491», C1 s.194 «1491 yılı, Ekim ayında». Kartta C2 s.8 kullanıldı.
