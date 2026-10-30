# Prompt: Figma «akar-yeni»yi prototipteki değişikliklerle güncelle (29 Ekim 2026)

Kullanım: aşağıdaki kod bloğunu Figma'ya yazabilen bir yapay zekâya (Figma MCP, `use_figma`) olduğu gibi ver.

```
AKAR · Figma güncellemesi. Dosya: https://www.figma.com/design/HGTgq5vRXVqhVO9TcR9wBe/akar-yeni (tek sayfa, 0:1).
Prototip (design/test-redmi9t-v2) son iki günde Figma'nın önüne geçti. Görevin: aşağıdaki değişiklikleri Figma'ya işlemek. Yeni özellik İCAT ETME; yalnız listedekileri çiz.

ÖNCE
- figma-use becerisini yükle. create_session ile dosyada oturum aç.
- Şunlara bak:
  - «00 · Tasarım Sistemi» (1:66): renkler 1:95, ikonlar 1:212, bileşenler 1:651, desenler 1:863;
  - «Bileşen · Durum ekranları» (1:7615).
- Var olan bileşenleri, renk değişkenlerini ve yazı stillerini kullan. Elle hex yazma; değişkende yoksa bu listedeki hex'i kullan ve raporda yaz.
- Dil Türkçe. Metinleri birebir buradan al; yeni metin uydurma.

KURALLAR
- Ekran SİLME. Bir ekranı büyük ölçüde değiştireceksen eskisini önce kopyala, kopyayı «Eski sürümler (22 Ekim)» bölümüne (69:2534) taşı, adının sonuna «· 28 Ekim öncesi» ekle; sonra asılını güncelle.
- Değiştirdiğin her ekranın altına, var olan «Not / …» metinlerinin biçiminde tek satırlık not ekle: «29 Ekim: <ne değişti>».
- Masaüstü (D) ve mobil (B/WF) eşleri birlikte güncellenir.
- Harita ekranlarındaki harita görüntüleri değişmez; yalnız üstündeki arayüz öğeleri değişir.
- Haritada desen yok (desen kuralı 1:958).

DEĞİŞİKLİKLER

1. Yeni: açılış (yükleniyor) ekranı. «İlk açılış» modalından ÖNCE gelir.
   - Yeni çerçeveler:
     - «D · Açılış / yükleniyor» (1440×900): masaüstü bölümünde «D · İlk açılış» (1:4042) yanına;
     - «WF · Açılış / yükleniyor» (390×844): mobilde «WF · İlk açılış» (1:5616) yanına.
   - Zemin: --bg #F3F5F5. Üstünde şehrin deseni silik: «Desen / Bursa · sekiz kollu yıldız», renk --sehir-aksan #22566E, opaklık %8, 96 px karo, tüm ekranı kaplar.
   - Ortada dikey dizi:
     - «Amblem / AKAR yıldız» (1:870): 96 px, altın --gold #C9A13B, çizgi 4;
     - 14 px boşluk;
     - «AKAR» (Inter 700, 15 px, harf aralığı %32, --text);
     - şehir adı «Bursa» (Cormorant Garamond 600, 34/40, --sehir-aksan);
     - «Vakıf eserleri yükleniyor» (Inter 400, 13 px, --text-muted).
   - Not: «29 Ekim: harita ilk kez çizilene kadar. Amblem çizgi çizgi çizilir (2,6 sn döngü; hareket azaltılmışsa çizili durur). Şehir adı, renk ve desen şehir kaydından gelir (veri/sehir/<şehir>.json → kimlik); Konya kendi deseniyle açılır.»

2. 3D yükleniyor ekranları: «D · Eser detay / 3D yükleniyor» (1:4794) ve «B · Eser detay / 3D yükleniyor» (1:7763).
   - Kartın arkasındaki 3D sahne zemininin üstüne şehrin deseni: --sehir-aksan, %8, 96 px karo.
   - Kart aynı kalır: amblem 44 px altın, «3D model yükleniyor · %62», ilerleme çubuğu 6 px (dolu --primary, boş --border), «0,4 MB / 0,8 MB. Bu sırada Dinle ya da Oku ile başlayabilirsin; model gelince sahne kendiliğinden açılır.».
   - Not: «29 Ekim: arkada şehir deseni; aynı kart hikâye 3D ve Eser hakkında 3D'de de çıkar; yüzde gelmeden çubuk belirsiz akar.»
   - «Bileşen · Durum ekranları» (1:7615) içine bu kartı «Yükleme kartı · 3D» adıyla bileşen olarak ekle.

3. 3D sahne zemini (bütün 3D sahnelerde).
   - Düz gri yerine dikey geçiş: üst #DDE4E5 → alt #A7B4B7 (Bursa'ya çalan nötr gri; ISO 3664 nötr çevre).
   - Ekranlar:
     - 1:2553, 1:2621, 1:2798, 1:4794, 1:4853;
     - 1:6592, 1:6703, 1:6792, 1:7763, 1:7802;
     - 221:2781, 221:2862, 221:2958;
     - «D · Eser hakkında · okuma düzeni» (232:2788) içindeki yapışık 3D alanı.
   - Renkler sayfasına (1:95) «3D sahne zemini · üst / alt» örneği ekle: «şehir kaydı kimlik.sahne_ust / sahne_alt».

4. 3D parça seçimi: «B · Eser detay / 3D · kart açık» (221:2862) ve «D · Eser detay / 3D» (1:2553).
   - Bir kartın BÜTÜN parçaları birlikte sarı vurgulanır. Örnek: Ulucami'de dört cephe ve pencere girintileri tek kart, «Cepheler ve pencereler».
   - Masaüstünde fare parçanın üstündeyken: aynı grup daha hafif sarı, imleç el, ipucu olarak kart başlığı.
   - Kartı olmayan parça tıklanmaz.
   - Bunu not olarak yaz; masaüstü ekranına fare üstü durumunu gösteren küçük bir örnek ekle (imleç + «Cepheler ve pencereler» ipucu).

5. Eser detay galerisi: «D · Eser detay» (1:5103) ve «B · Eser detay» (1:7952).
   - Her fotoğrafın sağ altında «büyüt» simgesi: 30 px daire, rgba(20,27,43,.5), bulanık arka plan, beyaz lucide «expand» 16 px.
   - Not: «fotoğrafa dokununca ışık kutusu; altında künye «başlık · kaynak». Yana kaydırınca soldaki boşluk sabit (mobil 16, masaüstü 24 px).»
   - İkonlar listesine (1:434) «Büyüt → expand» ekle.

6. Eser hakkında: «D · Eser hakkında · okuma düzeni» (232:2788) ve mobil 231:2788, 231:2813, 231:2854, 231:2877.
   - Kapak fotoğrafı: envanterin açılış fotoğrafı. Ulucami'de minareler, akşam (envanter Cilt 1 s.19). Yer tutucunun adı: «Kapak · envanterin açılış fotoğrafı (eser.json → hakkinda_kapak)».
   - Masaüstünde geri düğmesi kapağın SOL ÜST köşesinde:
     - hap biçimi: 36 px yükseklik, rgba(20,27,43,.55) bulanık zemin, beyaz yazı;
     - lucide chevron-left ve «Ulucami»;
     - 20 px üst, 24 px sol.
   - Kapak geçilince sekme çubuğunun solunda «‹ Ulucami» hapı:
     - beyaz zemin, 1,5 px --sehir-aksan çerçeve;
     - --sehir-aksan yazı, 600 14 px.
   - Sekme şeridi: taşarsa kenarlarda solma, iki yanda 32 px yuvarlak ‹ › okları (beyaz, --border çerçeve, hafif gölge). Mobilde ok yok, yalnız solma.
   - Bölüm içinde başlık fotoğraftan ÖNCE gelir.
   - Alıntının üstündeki altın süs kaldırıldı.
   - Fotoğraflar kırpılmaz: her fotoğraf kendi oranında.
     - Kapak fotoğrafı en çok 640 px (masaüstü) ya da ekran genişliği.
     - Şerit fotoğrafları aynı yükseklikte, genişlik orana göre, dikeyde ortalı.
   - Fotoğraf şeridi:
     - sağ altta «1 / 4» sayacı;
     - iki yanda 44 px yuvarlak ‹ › okları (masaüstü);
     - kenarlarda solma;
     - her fotoğrafta «büyüt» simgesi (madde 5).
   - Masaüstü düzeni: yapışık 3D/fotoğraf alanı yüksekliği en çok 620 px; iki sütun arası 48 px; içerik en çok 1360 px.
   - Not: «29 Ekim: bu düzenin çalışan hâli prototipte (test-redmi9t-v2); diğer eserler aynı biçimi Ulucami'den alır.»

7. Harita filtreleri.
   - Ekranlar:
     - «D · Keşif / Ana» (1:4337), «D · Tüm eserler + Filtre» (1:2296), «D · İlk açılış» (1:4042) arkası;
     - «WF · Keşif / Ana ekran» (1:5798), «WF · Filtre» (1:6119);
     - ve aynı çipleri taşıyan diğer keşif ekranları.
   - «Akar» çipinin adı «Ticari (akar)». Neden: «Akar» uygulamanın adıyla karışıyordu.
   - Şehirde eseri olmayan rol çipi gösterilmez. Bursa'da «Su» ve «Eğitim» yok, kaldır. Not: «yalnız şehirde eseri olan roller; her çipin açıklaması ipucunda».
   - Eser listesinde «3D» etiketi yok, çünkü bütün eserlerde 3D var. Not: «etiket yalnız bazı eserlerde 3D yoksa görünür».

8. Harita pinleri (yalnız not, görsel değişmez): «Pin» bileşeninin (Tasarım Sistemi › Bileşenler) yanına:
   - «29 Ekim: etiket yer bulamazsa öbür yana geçer; önemli eser önce çizilir (eser sırası); yakınlaştıkça pin %80 → %66 küçülür.»

9. Tasarım sistemi notları.
   - «10 · Desenler» (1:863) kullanım listesine «açılış ekranı arka planı ve 3D yükleme kartı arkası (%8)» ekle.
   - «Amblem örneği» (1:911) notuna «açılış ekranında 96 px, 3D yükleme kartında 44 px» ekle.

BİTİRİNCE
- Değiştirdiğin her ekranın ekran görüntüsünü al, kendin kontrol et:
  - yazı taşması yok;
  - değişken kullanılmış;
  - eski sürüm «Eski sürümler»e taşınmış.
- RAPOR: madde madde (1–9) ne yaptın; dokunduğun düğüm kimlikleri; değişkende bulamayıp hex yazdığın renkler; yapamadığın ya da emin olmadığın şeyler.
```
