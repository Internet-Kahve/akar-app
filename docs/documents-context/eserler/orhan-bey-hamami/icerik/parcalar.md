# Orhan Bey Hamamı · 3D parça kartları

30 Ekim 2026. 3D modelde bir parçaya dokununca açılan kartların içeriği. Uygulama bu tabloyu `hazirla.py` ile okur; üründe aynı alanlar `parca_bilgi` tablosuna karşılık gelir. Biçim, ton ve uzunluk Ulucami'deki kartlarla aynı (`ulu-cami/icerik/parcalar.md`); başlangıç noktası 29 Ekim taslağı (`_eski/parcalar_taslak.md`).

**Kural:** Kartı olan parça tıklanır, kartı olmayan tıklanmaz. Bir parçayı tıklanabilir yapmak için bu tabloya bir satır eklemek ya da var olan satırın «Parçalar» hücresine parçanın model adını yazmak yeter; kod değişmez.

Kaynak önceliği `ICERIK_YONTEMI.md` ile aynı: önce Bursa Vakıf Eserleri Envanteri (`E cilt-N PDF s.X` = envanter kitabının PDF sayfası; metnin tamamı `eser-hakkinda.md`'de), sonra eserin notlarındaki kaynaklı bilgiler. Metinler envanter metniyle tek tek karşılaştırıldı; kaynakta olmayan bilgi yazılmadı. Fotoğraflar `foto/` klasöründen (`fotograflar.md` listesi); fotoğraf hücresi boşsa kart, eserin kapak fotoğrafını gösterir. Parça adları `3d/export/orhan-bey-hamami_v08_sunum.glb` dosyasının üst düzey nesne adlarıyla birebir karşılaştırıldı (30 Ekim 2026).

Sütunlar: **Parçalar** = modeldeki nesne adları (virgülle; hepsi aynı kartı açar) · **Fotoğraflar** = sırayla, kartta yana kaydırılır; ilki kapaktır.

| Parçalar | Başlık | Metin | Fotoğraflar | Kaynak | Güven |
|---|---|---|---|---|---|
| Hamam_Giris | Girişler | Bugün «Eski Aynalı Çarşı» diye anılan yapının biri kuzeyde, biri güneyde, biri batıda üç girişi vardır. Envantere göre kuzeydeki giriş özgündür, öbürleri sonradan açılmıştır. 1958 Çarşı yangınından sonraki onarımla hamam bütünüyle çarşıya dönüştürüldü; külhan yıktırılarak çarşının batı girişi açıldı. | 01_giris-guney.jpg, 03_giris-kemer.jpg | E cilt-1 PDF s.106 | Doğrulanmış |
| Hamam_Sogukluk_Erkek | Erkekler soğukluğu | Kuzeydeki ana girişten erkekler bölümünün 11,95 × 11,86 metrelik, kare planlı soğukluğuna girilir. Mekânın üstü, tromplarla geçilen sekizgen kasnaklı bir kubbeyle örtülüdür. Bugün iç mekân ahşap ve çelikle bölünmüş, çoğunlukla antika ve hediyelik eşya satan sıralı dükkânlar olarak kullanılır. | 02_ic-carsi.jpg, 05_kubbeler.jpg | E cilt-1 PDF s.106 | Doğrulanmış |
| Hamam_Sicaklik | Ilıklık, sıcaklık ve halvetler | Erkekler bölümünün sıcaklığında, özgün planda köşelerde dört halvet, üç sekili eyvan ve ortada bir göbek taşı vardı. Halvetlerin üstü kubbe, eyvanlarınki tonozla örtülüdür; bütün mekân kubbe kasnaklarındaki pencerelerden ve kubbelerin üstündeki aydınlık fenerlerinden ışık alır. Hamamın kubbe ve tonozlarının tamamı kurşunla kaplıdır. | 05_kubbeler.jpg, 04_tepeden-kubbeler.jpg | E cilt-1 PDF s.106, s.107 | Doğrulanmış |
| Hamam_Sogukluk_Kadin, Hamam_Giris_Kadin | Kadınlar bölümü | Erkekler bölümüne doğudan bitişik kadınlar bölümü, 10,35 × 10,35 metrelik kare planlı bir soğuklukla başlar; üstü sekizgen kasnağa oturan bir kubbeyle örtülüdür ve bir aydınlık feneriyle aydınlanır. Hamamın çifte hamam olduğu arşiv araştırmalarıyla anlaşıldı; kadınlar bölümü 1943'te Mimar Sedat Çetintaş başkanlığındaki çalışmalarla yeniden ayağa kaldırıldı. Restorasyondan sonra güneyde merdivenle inilen bir giriş açıldı. | 04_tepeden-kubbeler.jpg, 05_kubbeler.jpg | E cilt-1 PDF s.105, s.107 | Doğrulanmış |

## Kartı olmayan (tıklanmayan) parçalar

`Zemin_*`, `Cevre_*`, `Olcek_*` (zemin, ağaç ve ölçek figürleri). Hamam modelinde iç mekân yok; «İçini göster» düğmesi görünmez (`model.json`'da `ortu_gruplari` yok).

## Notlar

- Giriş yönü çelişkisi (`orhan-bey-hamami_notlar.md` §3.4): envanter «kuzeydeki giriş özgündür» der; Alan Başkanlığı föyü batı ve güney kapılarını ilk yapıldığı zamanın kapısı sayar. Modeldeki alınlıklı blok (`Hamam_Giris`) güneydedir. Kartta envanterin ifadesi verildi; modeldeki bloğun hangi kapı olduğu yazılmadı.
- Kadınlar girişi ayrı bir kart açmaz; kadınlar bölümü kartına bağlandı (envanterde bu girişe dair ayrı bilgi yok).
