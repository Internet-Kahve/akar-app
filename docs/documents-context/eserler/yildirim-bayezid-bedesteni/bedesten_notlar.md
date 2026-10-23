# Yıldırım Bayezid Bedesteni: model notları

Bu dosya model kararlarını, kaynak incelemelerini ve ölçü analizini toplar. Yapının kaynaklı kimlik ve ölçü kaydı `eser.md`, üretim sürümleri `3d/README.md`, sıradaki tur `SONNET_REVIZYON_PLANI.md` dosyasındadır. Son düzenleme: 18 Ekim 2026.

## 0. Klasör düzeni

```
yildirim-bayezid-bedesteni/
  eser.md                     kimlik, ölçü ve kaynak tablosu (giriş noktası)
  bedesten_notlar.md          bu dosya
  SONNET_REVIZYON_PLANI.md    v04 iş emri (v04 bitince silinir; kalıcı kararlar buraya aktarılır)
  ref/
    foto/                     envanter_c2_s27–29 (envanter fotoğrafları), ekinci2025_* (tez fotoğrafları), alan-baskanligi_*,
                              kullanici_* (18 Ekim kullanıcı ekleri: çevre çarşı örtüsü, Yandex), yandex_* ve web fotoğrafları
    plan/                     ekinci2025_pdf097 dört plan (Özdeş 1952, Gabriel 1958, Ayverdi 1966, Tayla); gabriel_plan/kesit_1m_izgara
                              (ölçekli Gabriel çizimlerinin önceki okuma görselleri; özgünleri ağaçta yok); alan-baskanligi vaziyet
    metin/                    ekinci2025, envanter_c2, vakif_1983, alan_baskanligi metin çıkarımları
    kaynak_dizini.json        ref/ altındaki her dosyanın kaynağı, sayfası, SHA-256 değeri
  3d/                         üretim: yalnız son sürüm v05 (blend/, export/, kontrol/v05/), build/ (build_v05.py, doku/), README.md
```
Eksenler: +X doğu, +Y kuzey; orijin ana salonun ortası. Uzun eksen doğu–batı (OSM yönü ≈ 86°; yalnız yön için).

## 1. Güncel model kararları

| # | Konu | Karar | Dayanak | Durum |
|---|---|---|---|---|
| 1 | Kubbeli yüksek gövde | 59,5 × 18,0 m (salon iç 56,50 × 15,00 + 1,50 duvar); saçak +10,0 | E: C2 PDF 29 «iç ölçüler itibarıyla 15,00 × 56,50»; P: Gabriel kesiti (duvar, saçak); F: envanter tepeden foto | v02b'den beri doğru |
| 2 | Kubbeler | 2 × 7 = 14, 6 ayağa oturur; dış Ø 7,4; açıklık 6,50–6,90 | E: C2 PDF 29; W: Ekinci PDF 95–96; P: Gabriel kesiti | Değişmez |
| 3 | **Kubbe tepe kotu** | **+14,20** (alem hariç; günümüz) | W: Ekinci PDF 96 «zeminden en yüksek kubbesinin hizasına kadar olan yüksekliği 14,20 metredir». Gabriel kesiti 12,6–13,0 (1958 öncesi tuğla kubbeler; 1960'ta 10 kubbe betonarme yeniden yapıldı). | **v04** (v03: 13,5) |
| 4 | **Bitişik alçak bant (mahzen + dükkân)** | Gövdeye **bitişik**, dört yanda; toplam dış **70,70 × 33,50 m**; bant derinliği K/G **7,75**, D/B **5,60**; çatı tek yöne eğimli kurşun `#AEB6BC` (+5,40 → +4,70, saçak 0,15; 19 Ekim kullanıcı kararı, T) | P: Gabriel planı (K/G ≈ 7,4, D/B ≈ 5,4) ve kesiti (K/G ≈ 7,7–8,0), Ayverdi 1966 (K/G ≈ 7,8, D/B ≈ 5,7) — 19 Ekim A incelemesi; W Ekinci PDF 95 «35,5 x 71,70» çelişki (bandın dışındaki bir çizgiye ölçülmüş olabilir); P: dört planın dördü (Ekinci PDF 97) bitişik dükkân gösterir; Ayverdi 1966 planı (restorasyon sonrası) oranı ≈ 1,98; F: 2024 hava fotoğrafı (`ekinci2025_pdf084`) band çatısı pencerelerin altında. Gabriel kesitindeki +8,5 m 1958 öncesi. | **v04b** (v04 A: 71,70 × 35,50; v03: açık "İç Bedesten Sokağı" + ayrı halka, 83,3 × 48) |
| 5 | **Dükkânlar** | **56 = 2 × 20 (uzun kenar: 10 + kapı + 10) + 2 × 8 (kısa: 4 + kapı + 4)**; adım ≈ 2,75 m; derinlik 4,2 m; tonoz cepheye dik | W: Ekinci PDF 96–97 «Planların hepsinde yapıda 56 dükkân ve 32 mahzen»; P-oran: Ayverdi planından sayım (18 Ekim); W: ortalama dükkân 4,20 × 2,30 | **v04** (v03: 80 modül) |
| 6 | 68 dükkân | Kullanılmaz | E: C2 PDF 29 «bugün 68 dükkân yer almakta, ancak bunların ilk yapı düzenlemesiyle doğrudan bir ilişkisi bulunmamaktadır» | Not |
| 7 | **Girişler** | Dört cephenin ortasında; içte kubbeli giriş mekânı (E, W), **dışarıdan kubbe görünmez** (fotoğraflar); giriş modülü bant çatısının devamı, yarım daire kemerli kapı | E: C2 PDF 29; W: Ekinci PDF 102; F: `ekinci2025_pdf084`, `envanter_c2_s27`, `s28` | **v04** (19 Ekim A onayında düzeltildi: A turundaki görünür giriş kubbeleri kaldırıldı) |
| 8 | Gövde pencereleri | Uzun cephede 7, kısa cephede 4; 1,0 × 2,05 yuvarlak kemerli (+5,55 → +7,60), tek sıra tuğla kemer (v04b) | F: hava fotoğrafları; W: Ayverdi «her cephede dörder pencere açıldı» (Ekinci PDF 102–103) — uzun cephe için fotoğraf seçildi | Korunur |
| 9 | Duvar örgüsü | Dış: 3 sıra tuğla + 1 sıra taş almaşık | W: Alkan 2023 s.157 (önceki notlar); F; iç mekân için Ekinci PDF 98 (2+1 alt, 3+1 üst) | Renk v04'te |
| 10 | Çevre çarşı örtüleri (modern metal) | Modele girmez | F: kullanıcı fotoğrafları ve 2024 hava fotoğrafı; bedestenin parçası değil | Karar |
| 11 | Zemin, palet, figür | `../_GENEL_SAHNE_STANDARDI.md` | Kullanıcı (18 Ekim) | **v04** |

## 2. Kaynaklar

Kaynak önceliği: P rölöve > E envanter > W tez/makale > O OSM > M maket > F fotoğraf > T tahmin. Ayrıntılı kayıt `ref/kaynak_dizini.json`.

| Kaynak | PDF sayfası | Bu klasörde | Kullanım |
|---|---|---|---|
| Ekinci 2025, *Erken Dönem Osmanlı Mimarisi'nde Bedesten*, Hacettepe YL tezi (`veri/bursa/Erken_Donem_Osmanli_Mimarisinde_Bedesten.pdf`) | 84–85, 95–103 | `ref/metin/ekinci2025.md`, `ref/plan/ekinci2025_pdf097_*`, `ref/foto/ekinci2025_*` | **Ana kaynak:** 71,70 × 35,5; 14,20 m; 56 dükkân / 32 mahzen; dükkân 4,20 × 2,30; dört plan; 1958 yangını, 1960 restorasyonu; duvar örgüsü |
| Bursa Vakıf Eserleri Envanteri Cilt 2 | 27–29 | `ref/metin/envanter_c2.md`, `ref/foto/envanter_c2_s27–29_*` | Salon 15,00 × 56,50; 14 kubbe, 6 ayak; kubbeli girişler; 68 dükkânın ilk yapıyla ilişkisizliği |
| Alan Başkanlığı föyü N6 (`veri/bursa/hanlar-bolgesi.pdf`) | 8 | `ref/metin/alan_baskanligi.md`, `ref/plan/alan-baskanligi_pdf008_vaziyet.jpg`, `ref/foto/alan-baskanligi_*` | Kimlik, onarımlar, vaziyet, iç fotoğraflar |
| VGM, Vakıf Abideler III (1983) | 181 | `ref/metin/vakif_1983.md` | 56 dükkân, mahzenler, dört kubbeli giriş (1956 yangın tarihi diğer kaynaklarla çelişir) |
| Gabriel planı ve kesiti (önceki çalışmada `BURSA_BEDESTENI.pdf` PDF 12, Şekil 3) | — | `ref/plan/gabriel_plan_1m_izgara.png`, `gabriel_kesit_1m_izgara.png` | Ölçek çubuklu (plan 10,15 px/m, kesit 10,2 px/m); 1958 öncesi durum. **Özgün PDF bu ağaçta yok**; yalnız okuma görselleri. |
| Önceki web, Yandex ve kullanıcı görselleri | — | `ref/foto/` | Biçim ve çevre kontrolü |

## 3. Ölçü analizi (18 Ekim 2026)

- **Bant derinliği:** dış 35,50 − gövde 18,0 = 17,5 → kuzey ve güneyde 8,75. Gabriel planındaki okumalar (§Ek "Ölçü tablosu"): mahzen 3,3 + duvar 1,2 + dükkân 4,2 = 8,7 ✓. Doğu–batı: 71,70 − 59,5 = 12,2 → 6,1 (Gabriel uç dükkân 5,2 + duvar).
- **Dükkân dağılımı** (`ref/plan/ekinci2025_pdf097_*`, Ayverdi 1966 alt sol, piksel profili): kuzey sırasında kapının iki yanında 10'ar bölme (adım ≈ 19,3 px ≈ 2,75 m; ölçek 71,70 m / 505 px), güneyde aynı; uç sıralarda kapının iki yanında 4'er. 2 × 20 + 2 × 8 = 56, tezin «56 dükkân» değeriyle aynı. Kapı modülü ≈ 6,5 m (merdivenli giriş).
- **Yükseklikler:** gövde saçağı +10,0 (P kesit); kubbe tepesi +14,20 (W; günümüz); band çatısı ≈ +5,0 (F, 2024 hava fotoğrafında gövde pencereleri band çatısının üstünde tamamen görünür; Gabriel kesitindeki +8,5 1958 öncesi tuğla dükkânlara aittir, 1960'ta dükkânlar betonarme yeniden yapıldı — Ekinci PDF 102). Arazi güneye yükselir (P kesit ≈ +1,9); model düz zemin.
- **"İç Bedesten Sokağı" nerede?** Yandex'teki sokak adı doğrudur, ancak sokak 71,70 × 35,50'lik bitişik bandın **dışında**, bedesteni çevreleyen çarşı yapılarıyla arasında kalır. Üstü bugün modern metal örtülüdür (kullanıcı fotoğrafları; hava fotoğrafındaki açık renkli dış çerçeve). Tepeden fotoğraftaki kurşun gövdeye bitişik koyu bant (K/G ≈ 5,6 m görünür) bandın klima ve tesisatlı düz çatısıdır; bant derinliğinin (8,75) kalanı metal örtülerin saçağı altında kalır. v03 sokağı gövde ile bant arasına koymuştu; v04'te bant bitişik, sokak dışarıda açık şerit (`SONNET_REVIZYON_PLANI.md` §1.4).
- **Toplam ölçü:** Ekinci 71,70 × 35,5 (W, oran 2,02) ile Ayverdi 1966 planının oranı (≈ 1,98) uyumlu; Gabriel 1958 öncesi 70,4 × 32,8 (P, oran 2,15). Güncel durum için W seçildi. OSM 61,5 × 21,4 yalnız kubbeli kısmı çiziyor görünüyor; ölçü için kullanılmaz.

### 3.1 A incelemesi: bant genişliği ve süsleme (19 Ekim 2026)

- **Bant:** tepeden fotoğrafta (`envanter_c2_s28`) gövdeye göre ölçeklenen görünür koyu bant K/G ≈ 5,5–6,0, D/B ≈ 3,0 m; içte ≈ 2,4 m mahzen şeridi, dışta dükkân şeridi seçilir. Kalanı çarşı sokaklarının metal örtü saçağı altında. Ölçülü çizimler: Gabriel planı K/G ≈ 7,4 / D/B ≈ 5,4, Gabriel kesiti K/G ≈ 7,7–8,0, Ayverdi 1966 (kubbe aksından ölçeklendi) ≈ 7,8 / 5,7, dış ≈ 71,0 × 34,5. Ekinci'nin 35,5'i ile bant 8,75 çıkıyordu; çizimlerin üçü de daha dar. Karar (kullanıcı onayı): **K/G 7,75, D/B 5,60, dış 70,70 × 33,50**, saçak 0,15.
- **Süsleme (F 2024: `ekinci2025_pdf084`, `685fff971922d`; F 1960: `ekinci2025_pdf102`; F kitabe: `pdf085`):** gövdede kutu almaşık (taşlar tuğla ile çerçeveli; çözünürlük düşük), ince açık renk saçak, yuvarlak kemerli pencere + ince tuğla kemer, koyu gri kurşun kubbeler; 1960 dükkân kemerleri çerçevesiz; kapı üstü düz kesme taş. Uygulama ayrıntısı `SONNET_REVIZYON_PLANI.md` "19 Ekim A incelemesi".
- **Çelişki:** W Alkan 2023 s.157 gövde için «3 tuğla + 1 taş» der; 2024 fotoğrafı kutu almaşık gösteriyor. Model F'yi izler (kullanıcı kararı).
- **Düzeltme:** A incelemesinde "giriş yakın çekiminde pencerelerin alt kısmı çatıya gömülü" denmişti; hata değil, yerden bakışta bant çatısının saçağı gövdenin alt kısmını örtüyor.

## 4. Önceki kaynak denetimi (18 Ekim 2026, model değiştirilmeden yapılmış)

### 4.1 v03 mimari incelemesi

18 Ekim 2026. İncelenen sürüm: `3d/build/build_v03.py`, `3d/export/bedesten_v03.glb` ve `3d/kontrol/v03/`. Model değiştirilmedi.

#### Sonuç

**14 kubbeli uzun ana kütle tanınabilir ve temel şeması doğru; buna karşılık v03'ün gövdeyi açık bir sokakla ayırıp bütün dükkânları bağımsız dış halkaya taşıması kaynaklarla yeterince desteklenmiyor.** Yeni kaynaktaki restorasyon sonrası planlar da gövdeye bitişik ticari birimleri gösteriyor. Dolayısıyla v03'ü ölçülü ve doğrulanmış güncel mimari model olarak kabul etmek doğru olmaz. Dış çevre ve giriş ilişkileri revizyon gerektiriyor; ana kubbe dizisini baştan kurmak gerekmiyor.

Yüzde doğruluk vermek yanıltıcı olur: güncel rölöveyle çakıştırılmış ölçüm yok, çevre sınırları ve kotlar kesin değil. Teknik mesh kontrolünden geçmek mimari doğruluğu ölçmez.

#### 1. İç bedesten / dış bedesten ne demek?

- Mevcut Yandex ekran görüntüsünde **İç Bedesten Sok.** ve **Dış Bedesten Sok.** adları okunuyor. Bunlar adres/dolaşım adlarıdır. Haritanın beyaz çizgisinden sokak genişliği, açık gökyüzü, yapı duvarı veya ayrı bir tarihî bina sonucu çıkarılamaz.
- Bu Bursa yapısı için incelenen mimari kaynaklar **tek kubbeli bedesten çekirdeği, iç mahzenler, dış dükkânlar ve çevre çarşıları** tanımlıyor. İki bağımsız anıtın “İç Bedesten” ve “Dış Bedesten” olarak inşa edildiğine dair bu kaynaklarda kanıt yok.
- İçteki 32 mahzen/dolap ile dış dükkânlar aynı şey değil. “Dış dükkân” ifadesi “bedestenden kopuk, uzakta dükkân” anlamına da gelmiyor: planda dışa açılan birimler çekirdeğe bitişik.
- Bursa'nın **eski/yeni bedesten** adlandırması başka bir ayrım: Emir Han'ın eski bedesten işlevi ve sonradan Yıldırım yapısının yeni bedesten olarak anılması (Ekinci PDF 84; Alan Başkanlığı PDF 5). Bu, modeldeki iç/dış halkayı isimlendirmez.
- İstanbul'daki İç/Cevahir Bedesteni ile Sandal Bedesteni adlarını Bursa'ya taşımamak gerekir. [TDV, Semavi Eyice, Bedesten](https://islamansiklopedisi.org.tr/bedesten).

#### 2. Kaynakların gösterdiği mekân ilişkisi

Ekinci 2025 PDF 97, basılı 78, Şekil 10: Özdeş (1952), Gabriel (1958), Ayverdi (1966) ve tarihi belirtilmeyen Tayla planları birlikte verilmiş. Özellikle 1966 planında da ana salon, yan mahzenler ve dışa açılan bitişik dükkânlar var. Bu nedenle eski notlardaki “Gabriel yangın öncesidir, bugün bitişik dükkân düzeni yoktur” çıkarımı geçerli bir kanıt zinciri oluşturmuyor.

Kaynakların desteklediği kavramsal sıra:

**Kubbeli salon → salonla ilişkili mahzen bandı → dışa açılan bitişik dükkânlar → çarşı dolaşımı/örtüleri ve karşı dükkânlar.**

Bu sıra her cephede birebir aynı kesit veya ölçü demek değildir. Güncel çevre örtülerinin hangi dükkâna, hangi sokağa ait olduğu güncel rölöve/yerden fotoğrafla ayrı ayrı belirlenmeli.

Mevcut tepeden fotoğrafta (`ref/foto/envanter_c2_s28_tepeden.png`) kubbeli örtünün yanındaki koyu/kırmızı-yeşil bantta çatı yüzeyleri ve tesisat görülüyor. Onu bütünüyle zemin seviyesinde açık sokak kabul etmek fotoğrafın tek mümkün açıklaması değil. Çapraz fotoğraf da gövdenin yanında alçak örtüler gösteriyor. **Bu bantta hiç geçit yoktur** demek de eldeki fotoğrafların sağlayabileceğinden ileri gider; kesin olan, v03'ün tüm bandı boşaltmasını doğrulayacak kanıtın bulunmamasıdır.

#### 3. Model ile karşılaştırma

| Öğe | v03 | Kaynak / hüküm |
|---|---|---|
| Ana örtü | 2 × 7 = 14 kubbe | Doğru; tez PDF 95–97, envanter PDF 29, Alan Başkanlığı PDF 8 ile tutarlı. |
| Merkezi salon | Parametre 56,50 × 15,00 m | Vakıf Abideleri PDF 181 ve envanterle uyumlu. Ancak model kapalı dolu prizmadır; bu değer modellenmiş kullanılabilir iç hacim değildir. |
| Yüksek gövde | 59,5 × 18,0 m | Salon + varsayılan 1,5 m duvar hesabı; fotoğraftaki uzun kütle oranına yakın. Mahzen/dükkân dahil toplam bina ölçüsü olarak kullanılamaz. |
| Çevre ilişkisi | Gövdeden K/G 6,2 m, D/B 3,1 m açık boşluk; ayrı halka | En önemli sorun. Restorasyon sonrası planlar bitişik birimleri koruyor. Sokak adı bu boşluğu doğrulamıyor. |
| Dış sınır | Duvar yüzleri 83,3 × 48,0 m; çatı taşması ayrıca | Betikten hesaplandı. Eski plan okuması 70,4 × 32,8; tez PDF 95 toplam 71,70 × 35,5 veriyor. Kapsamlar farklı olabileceğinden doğrudan “% büyütme hatası” denemez; ama v03 ölçüsüne rölöve dayanağı yok. |
| Dış dükkân sayısı | Betik 80 kepenk paneli üretir: uzun cephe 26'şar, kısa 14'er | 56 veya 68 ile uyuşmuyor. Gerçek dükkân bölmeleri modellenmediği için 80 fiziksel dükkân değil, görünür cephe modülü sayısıdır. |
| Dört giriş | Ana gövdede kapı panelleri, çevre halkada dört eş beşik çatılı kütle | Dört yön doğru; kubbeli giriş mekânları yok. Dış çarşıdaki yüksek çatı parçası ile bedesten giriş kubbesi aynı yapı elemanı sayılamaz. |
| Geçitler | Koyu renk kemerli levhalar | Gerçek açıklık değil. Betik halka ve giriş kütlesini oymuyor; dolaşılabilir modelde kapılar duvarla tıkalıdır. Dıştan maket için görsel kısaltma, mimari mekân için yanlış temsil. |
| İç taşıyıcılar | Yok | Kaynakta 6 ayak, kemerler, 32 mahzen ve şadırvan var. Dış model kapsamı için kabul edilebilir eksiklik; iç mimarinin doğru modellendiği söylenemez. |
| Kubbe tepe kotu | 13,5 m | Tez PDF 96: 14,20 m. Fark 0,70 m; zemin referansı ve onarım dönemi eşitlenmeden otomatik düzeltme yapılmamalı. Eski 12,6–13,0 m kesit okumasıyla da çelişiyor. |
| Kubbe çapı | Dış çap 7,4 m; hepsi aynı | Tezde 6,50–6,90 m açıklık var. İç açıklık ile dış çap aynı ölçü değil; doğrudan çelişki sayılmaz. Eşit kubbeler stilizasyon. |
| Pencereler | Uzun cephelerde 7'şer, kısa cephelerde 4'er | Mevcut fotoğraflar bu genel görünümü destekliyor. Kesitte arka planda görülen kısa cephe pencerelerinin kotlarını uzun cepheye aynen aktarmak güvenilir değil. Tezdeki restorasyon anlatımıyla tek tek eşleştirme gerekli. |
| Doku | Gövde ve dış halkanın tamamında aynı almaşık | Çekirdekte taş-tuğla karakteri doğru. Tez PDF 98 iç mekânda iki ve üç sıra tuğlalı farklı bölgeler tanımlıyor; tek karoyu tüm dış çevreye yaymak kanıtlanmış değil. |
| Simetri | Dört çevre girişi ve tüm halka eşdeğer | Batıdaki tek çatı ölçüsünün dört yöne çoğaltılması varsayım. Çevre çarşı dokusu planlanandan daha karmaşık. |

#### 4. Kaynak çelişkileri ve yeni bulgular

##### 56 mı, 68 mi?

Ekinci PDF 96–97, dört planın 56 dış dükkân ve 32 mahzen gösterdiğini belirtir. Vakıf Abideleri basılı 344 de 56 dükkân der. Mevcut Bursa envanteri PDF 29 ve [Bursa Turizm Portalı](https://visitbursa.org/tr/mekanlar/bedesten-131) 68 dış birim verir. Vakıf Abideleri ayrıca güney kapısı–doğu köşesi arasındaki 12 dükkânın Orhan vakfına ait olduğunu söyler; buradan otomatik olarak “56 + ayrı 12 = 68” sonucu çıkarılamaz. Sayım sınırı, mülkiyet ve dönem farkı çözülmeden 68'i tarihî plan sayısı olarak sabitlemeyelim. v03'ün 80 modülü ise iki sayıyla da desteklenmiyor.

##### Kitabe bugün güney kapısında mı?

Eski notlar güney kapısına kitabe eklenmesini bekliyor. Ekinci PDF 85 / basılı 66, 2024 fotoğrafıyla kitabeyi **şadırvanın doğusundaki ayağın batı yüzünde** tanımlıyor; güney kapısındaki yerini tarihî Baykal kaydından aktarıyor. Güncel modelde güney kapısına kitabe eklemek bu yeni gözlemle çelişebilir. Güncel konum için tezdeki fotoğraf esas kontrol kaynağı olmalı; 2026 yerinde durum ayrıca doğrulanmış değildir.

##### Dört kubbeli giriş

Tez PDF 102, eski planlarda kuzey/güney girişlerini kubbeli, doğu/batıyı tonozlu tarif ediyor; restorasyonda dört girişin de kubbeye dönüştüğünü belirtiyor. Vakıf Abideleri ve mevcut envanter dört kubbeli girişi destekliyor. 14 ana kubbe ile girişlerin küçük örtülerini ayrı saymak gerekir. Modelde dört büyük beşik çatı yapmak bu eksikliği karşılamıyor.

##### Dönemler ve kotlar

1958 yangını ve 1960 restorasyonu yapıyı değiştirmiştir; eski planın her detayı bugüne taşınamaz. Buna rağmen planın bitişik birim mantığı sırf eski diye atılamaz. Tezde kubbelerin doğu/batı özgünlüğü konusunda metin ile PDF 102 dipnot 109 arasında yön çelişkisi var; belirli kubbelerin tarihini bu tezden tek başına kesinleştirmedim. Vakıf Abideleri'ndeki 1956 yangın tarihi, yeni tez ve envanterdeki 1958 ile çelişiyor.

Eski notlarda kesitteki alçak bant çatısının yaklaşık 8,7 m olması ile pencere altının yaklaşık 5,6 m olması çelişki sayılmış. Ancak kesitte görülen açıklıklar arka cepheye ait olabilir: aynı cephede oldukları gösterilmeden bu değerler çelişkili ilan edilemez. Fotoğraftan 5 m seçilmesi ölçüm yerine geçmez.

#### 5. Revizyon için önerilen sıra

1. Hedefi güncel durumun stilize dış modeli olarak tanımla; tarihî restitüsyonu ayrı tut.
2. Restorasyon sonrası planı ölçeğe oturt; gövdeye bitişik mahzen/dükkân bandını geri değerlendir. “Sokak” nesnesini bütünüyle doğru kabul etme.
3. Bitişik dükkânlar, gerçek çarşı geçidi/örtüsü ve karşı dükkânları ayrı nesneler olarak kur. Modern metal çatıyı tarihî bedestenin dış duvarı gibi yorumlama.
4. Dört girişin küçük kubbeli mekânlarını doğru konuma yerleştir; modern yüksek çatılı geçişleri ayrıca değerlendir. İçten gezilecekse gerçek boşluk aç.
5. Dükkân sayısını seçilen planın hücrelerinden tek tek çıkar; kaynaklarda 56/68 ayrımını açıklamadan 80 eş modül kullanma.
6. Kotları ortak zemine bağla; pencere ve kitabe konumlarını dönemine uygun kontrol et. Çevredeki tek tip almaşık uygulamasını azalt veya doğrulanmamış olarak işaretle.

v02b'ye doğrudan dönmek de yeterli değildir: bitişik bant ilişkisini daha iyi korusa bile yükseklik ve çevre örtülerini varsayımla çözüyordu. Yeni sürüm, v03'ün 14 kubbeli çekirdeğini koruyup çevre ilişkisini yeni plan kanıtlarıyla yeniden kurmalı.

#### 6. Denetim yöntemi ve sınırlar

Yerel PDF'ler metin taramasından geçirildi; ilgili plan, fotoğraf ve metin sayfaları tam sayfa görüntülerinden okundu. v03 üretim kodu, eski notlar, mevcut renderlar ve GLB düğüm listesi karşılaştırıldı. GLB 157.056 bayt ve 11 adlandırılmış mesh düğümü içeriyor. Önceki kontrol raporu 14.956 üçgen ve 20 draw call bildiriyor; bu sonuç bu incelemede yeniden üretilmedi.

Blender dosyayı açma denemesinde başlangıçta çöktü. Bu nedenle mevcut renderlar kullanıldı; yeni render, bağımsız manifold testi veya yapısal analiz yapılmadı. 83,3 × 48 m ve 80 modül değerleri betiğin gerçek parametre/döngülerinden hesaplandı; `model-denetimi.json` içinde kayıtlıdır.

Eski notlarda anılan `BURSA_BEDESTENI.pdf`, `bedesten_plan_gabriel.png` ve `bedesten_carsi_eha1967.png` bu çalışma ağacında bulunamadı. Mevcut ızgaralı türevler ve yeni tezdeki plan tablosu incelendi; eksik orijinaller okunmuş gibi kullanılmadı.

Ek web kontrolü (18 Ekim 2026): [TDV Bedesten](https://islamansiklopedisi.org.tr/bedesten), dış dükkânların ve çevre çarşı dizilerinin yangın sonrası yeniden yapımını birbirinden ayırır. [Bursa Turizm Portalı](https://visitbursa.org/tr/mekanlar/bedesten-131), 32/68 sayımı ve dört kapıyı destekler. Bu metinler güncel ölçülü rölövenin yerine geçmez.

#### 7. Aynı gün gelen ek fotoğraflarla güncelleme

Kullanıcı iki metal çatılı çarşı geçidi fotoğrafı ve bir Yandex hava görüntüsü sağladı. Ek inceleme (§4.2), dış çerçevenin yalnız dolu bir dükkân yapısı sayılmaması gerektiğini açıklar: görülen dış biçim bir çatı örtüsüdür ve altında dolaşım alanları bulunabilir. Bu, v03'ün dolu halka/açık iç sokak ayrımını daha da belirsiz kılar. Fotoğrafların hava görüntüsündeki kesin çekim noktaları henüz eşleştirilmedi; kullanıcının çatı hipotezi güçlü bir çalışma olasılığı olarak kaydedildi, kesin teşhis olarak değil.


### 4.2 Kullanıcının yeni fotoğrafları ve çatı hipotezi

18 Ekim 2026. Bu ek, önceki incelemedeki dış çerçeve yorumunu daha ihtiyatlı ve ayrıntılı hale getirir. Model değiştirilmedi.

#### Kaynak kaydı

Kullanıcının verdiği bağlantı: https://medium.com/@BursaHaberleri/bedesten-%C3%A7ar%C5%9F%C4%B1s%C4%B1-d%C4%B1%C5%9F-bedesten-tarih%C3%A7esi-foto%C4%9Fraf-galeri-486916969bd3

Sayfa tarayıcı aracından alınamadı (cache miss). Yazı metni, görsellerin sayfadaki altyazıları, çekim tarihi ve çekim noktaları bağımsız doğrulanamadı. İlk iki görselin bu sayfayla bağlantısı kullanıcı beyanıdır. Dosyalar kullanıcı eklerinden değiştirilmeden kopyalandı; `ref/kaynak_dizini.json` kaynak yollarını ve SHA-256 değerlerini tutar.

- `ref/foto/kullanici_cevre-carsi_metal-ortu_01.png`: geniş çarşı geçidi, iki yanda dükkânlar ve ortada tezgâhlar; üstte delikli gövdeli metal kirişler ve çatı taşıyıcıları.
- `ref/foto/kullanici_cevre-carsi_metal-ortu_02.png`: ayakkabı dükkânları arasındaki daha dar geçit; iki yanda taş-tuğla kemerli cepheler, üstte metal makaslı eğimli örtü.
- `ref/foto/kullanici_yandex_hava_cati-cercevesi.png`: 14 kubbeli çekirdeği, yakın çevresindeki koyu/kahverengi bandı ve daha dıştaki açık renkli eğimli çatı çerçevesini birlikte gösteren kullanıcı ekran görüntüsü. Yandex filigranı mevcut; görüntü tarihi bilinmiyor.

#### Kullanıcının hipotezi (kanıtlanmış olgu değildir)

Kullanıcı, hava fotoğrafındaki çerçevenin ekranın alt kısmında daha dar, üst kısmında daha kalın göründüğünü; sokak fotoğraflarında da genişlik farkı bulunduğunu belirtti. Çerçevenin bağımsız bir yapı yerine sonradan eklenmiş, demir taşıyıcılı ve teneke/metal kaplamalı bir çatı olabileceğini düşündü. Bunun kesin olmadığını belirterek, böyleyse İç Bedesten Sokağı'nın haritada neden farklı göründüğünü sordu. Ekran üstü/altı burada coğrafi kuzey/güney olarak kabul edilmedi.

#### Görsel gözlem ve yorumun ayrılması

**Doğrudan görülen:** İlk iki fotoğrafta bir sokağın/geçidin iki yanındaki dükkân cepheleri üzerinde metal taşıyıcılı eğimli bir örtü var. Bunlar 14 kubbeli ana salonun içi değil. Özellikle ikinci fotoğrafta yığma kemerli cepheler ile üzerlerindeki metal çatı sistemi açıkça farklı mimari elemanlar olarak okunuyor. Fotoğraf 1 ve 2'nin açıklıkları ve taşıyıcı düzenleri farklı; aynı çatı kesitinin iki görüntüsü oldukları varsayılmamalı.

**Güçlü çıkarım:** Kullanıcının “çerçeve, sokakların üzerine gelen çatı olabilir” önerisi makul ve önceki tek parça dükkân bloğu yorumundan daha açıklayıcıdır. Hava fotoğrafındaki açık renkli çerçevenin en azından bazı kollarının örtülü çarşı geçitlerini kapsaması olasıdır. Çatı, dükkânların bir bölümünü de örtebilir; aşağıdaki dolu/boş dağılımı dış çatı sınırına eşit değildir.

**Henüz doğrulanmayan:** İki sokak fotoğrafının hava fotoğrafındaki hangi kola ait olduğu; çerçevenin tamamının sokak çatısı olup olmadığı; çatıların yapım tarihi; kaplamanın teneke, galvaniz sac, sandviç panel veya başka bir ürün olması. İç yüzü açık renkli panel görmek dış yüzün malzemesini kesin tanımlamaz. Metal taşıyıcı, bunun tarihî kubbe sistemi olmadığını gösterir; tek başına kesin eklenme tarihi vermez.

**Genişlik farkı:** Hava fotoğrafında üst ve alt çatı bantları eşit görünmüyor; sokak fotoğraflarında da geniş ve dar açıklıklar var. Bu uyum hipotezi destekleyebilir fakat konum eşleştirmesi değildir. Sokak genişliği, saçak taşması, dükkânların çatıya dahil olması, komşu çatılar, görüntü açısı ve perspektif aynı görünümü etkileyebilir. Bu nedenle fotoğraf 1 = üst kol, fotoğraf 2 = alt kol diye atanmadı.

#### İç Bedesten Sokağı neden farklı görünüyor?

Yandex vektör haritası bir dolaşım çizgisini sokak olarak çizerken onun üstündeki örtüyü ayrı bir yapı/çatı poligonu olarak gösterebilir. Uydu görüntüsü ise en üstteki yüzeyi gösterir. Aynı yerin haritada yol, hava fotoğrafında çatı olması çelişki değildir. Ayrıca gölge, çatı rengi ve farklı yükseklikler bir bandı boşluk gibi gösterebilir.

Bununla birlikte bu olasılık, Yandex'teki İç Bedesten çizgisinin kesin olarak açık renkli çerçevenin altına denk geldiğini kanıtlamaz. Çekirdeğe yakın koyu bandı da otomatik olarak sokak diye adlandırmamalıyız; önceki hava fotoğraflarında burada örtü ve tesisat görülüyor. Harita çizgisi, çatı kenarı, gerçek cephe ve zemin yol ekseni aynı koordinat katmanı değildir.

#### Model için sonuç / önceki yorumun düzeltmesi

Önceki yanıttaki “dış çerçeve = çevre dükkân yapılaşması” açıklaması eksikti: **görünen çerçeve öncelikle bir üst örtü biçimidir; altında dükkânlarla birlikte dolaşım alanı da bulunabilir.** Onu tek parça, içi dolu bir dükkân halkası olarak modellemek yeni fotoğrafların gösterdiği sokak mekânını kaybettirir.

v03'te `Dukkanlar` kapalı dolu halka, iç tarafta ise tamamen açık `Ic_Bedesten_Sokagi` var. Yeni fotoğraflar bu ayrımı yeniden incelemeyi gerektiriyor. Çerçeveye sadece malzeme değiştirmek yeterli olmayabilir; örtü ile altında kalan dükkân ve geçitler ayrı kurulmalıdır. Çekirdeğe bitişik ticari birimler hakkındaki plan bulgusu geçerliliğini korur. Güvenilir çalışma hipotezi: kubbeli çekirdek + bitişik alçak birimler + çevrede örtülü çarşı geçitleri ve karşı dükkânlar. Her kolun sınırı henüz kesin değildir.

Sonraki doğrulama, fotoğraflardaki dükkân tabelalarını adres/yerden panorama ile eşleştirip en az bir çekim noktasını hava fotoğrafında belirlemektir. Bu eşleştirme yapılana kadar çerçevenin bütününü açık sokak çatısına veya dolu binaya dönüştürmek erken olur.


## Ek: Geçmiş kayıt (16–17 Ekim 2026, v01–v03)

> Bu ekteki değerler tarihsel kayıttır. Özellikle 68 dükkân / 80 modül, açık İç Bedesten Sokağı, ayrı dış halka (83,3 × 48), kubbe tepesi 13,5 ve v02 paleti **geçerli değildir**; güncel kararlar §1'de. Gabriel okumalarını içeren "Ölçü tablosu" hâlâ başvuru değerindedir (1958 öncesi durum). v01–v02c dosyaları silindi; yalnız v03 `3d/` altında. Eski `bursa/ref/...` yolları bu ağaçta yoktur.

### GÜNCEL DURUM (17 Ekim 2026, v03 · kabul edildi)
- **Son sürüm:** `3d/build/build_v03.py` → `3d/export/bedesten_v03.glb` (Draco, 157 KB), `3d/blend/bedesten_v03.blend`, kontrol `3d/kontrol/v03/` (GECTI: true, 14 956 üçgen, 20 draw call). Karşılaştırma: `3d/kontrol/v03/karsilastirma_v03.png`. v02–v02c önceki hâller olarak duruyor.
- **Üretim:** `blender -b --python 3d/build/build_v03.py` (Blender 5.2); dokular `3d/build/doku/doku_uret.py` ile.
- **Sıradaki:** B6 teslim (`.glb` → `belgeler` dalı, PR). v03 tasarım sorumlusu tarafından kabul edildi (17 Ekim 2026). Belirsizler § v03 sonunda.
- **Ölçülü plan bulundu:** Gabriel planı + enine kesit (`BURSA_BEDESTENI.pdf` PDF s.12, Şekil 3; bu ağaçta yok) → `bursa/ref/bedesten_plan_gabriel.png`. Plan ölçek çubuğu 0–20 m (10,15 px/m), kesit 0–5 m (10,2 px/m). Plandan okunan iç mekân 56,8 × 15,3 m; envanterdeki 56,50 × 15,00 m ile 0,3 m içinde tutuyor → ölçek güvenilir.
- **Vaziyet planı:** Bursa çarşısı (EHA 1967), Şekil 2 → `bursa/ref/bedesten_carsi_eha1967.png`. Kuzey yukarıda (Ulucami güneybatıda, Koza Han güneydoğuda).
- Okuma görselleri (1 m ızgara): `ref/plan/gabriel_plan_1m_izgara.png`, `kesit_1m_grid.png`.

### Klasör düzeni
- `3d/build/build_vNN.py`: üretim betiği (bütün ölçüler en üstteki `P` sözlüğünde)
- `3d/blend/bedesten_vNN.blend` · `3d/export/bedesten_vNN.glb` · `3d/kontrol/vNN/`
- Kaynak okuma görselleri (ızgaralı plan ve kesit): bugün `ref/plan/gabriel_plan_1m_izgara.png`, `gabriel_kesit_1m_izgara.png`
- `ref/foto/`: fotoğraflar (şu an 2 havadan fotoğraf, ikisi de kuzeybatıdan; Ulucami minaresi sağda)
- Eksenler: +X doğu, +Y kuzey; orijin ana salonun ortası. Uzun eksen doğu–batı (OSM yönü 86°, envanter "32 mahzen doğu-batı yönünde").

### Yapının okunuşu (plan + kesit + fotoğraf)
Dıştan içe üç halka, hepsi tek kütle:
1. **Dükkân halkası** (68 dükkân, dışa açılan tonozlu): dört kenarı sarar. Dış duvarı fotoğraftaki almaşık duvardır; zemin katında dışa açılan kemerli dükkân kapıları görülüyor.
2. **Mahzen bandı** (32 mahzen/dolap, kuzey ve güney kenarında 16'şar): salonla dükkân halkası arasında. Dükkân halkasıyla aynı düz çatı altında.
3. **Ana salon** (2 × 7 = 14 kubbe, ekseninde 6 ayak): duvarları ortak çatıdan ≈ 1,5 m yükselir, kubbeler bunun üstünde.
Kapılar dört kenarın ortasında; kuzey ve güney kapısı mahzen bandında kubbeli bir giriş mekânına açılır (planda kesikli daire), doğu ve batı kapısı uç dükkânların arasından salona girer.

### Ölçü tablosu
Kaynak kodu: P = Gabriel planı/kesiti (okuma hassasiyeti ±0,3 m), E = envanter cilt-2 PDF s.29, W = Alkan 2023, O = OSM, H = hesap, F = fotoğraf.

| Ölçü | Değer | Kaynak | Not |
|---|---|---|---|
| Ana salon iç ölçüsü (D–B × K–G) | 56,50 × 15,00 m | E | P 56,8 × 15,3 (tutarlı) |
| Kubbe dizilimi | 2 × 7 | P | E "6 ayağa oturan 14 kubbe" |
| Kubbe gözü (eksen) | 8,07 (D–B) × 7,50 (K–G) m | H | 56,5 / 7, 15 / 2 |
| Kubbe iç Ø | ≈ 6,3 m | P | plandaki kesikli daire 6,3–6,4; kesitte iç 6,1, dış 7,4 |
| Ayaklar | 4 adet ≈ 1,7 × 1,7 m; ortadaki 2 adet ≈ 3,2 × 2,2 m | P | ortadaki ikisi belirgin büyük |
| Ayak başlığı / kemer üzengisi | 5,0 m | P kesit | |
| Salon duvarı üstü (saçak) | 10,0 m | P kesit | |
| Kubbe tepesi (dış) | 12,6–13,0 m | P kesit | iki kubbe çizimde farklı; tek değer 12,8 öneriyorum |
| Mahzen bandı derinliği | 3,3 m + 1,2 m duvar | P | kuzey ve güneyde; doğu–batı uçlarda salon duvarı 1,5 m |
| Mahzen sayısı | 16 + 16 = 32 | P, E | adım ≈ 3,5 m |
| Dükkân halkası derinliği | 4,2 m (K/G), 5,2 m (D/B) | P | |
| Dükkân sayısı / adım | 68 / ≈ 2,9 m | W, P | E: "68 dükkân, ilk yapıyla doğrudan ilişkisi yok"; Gabriel planında ve fotoğrafta yapıyla tek kütle |
| Ortak düz çatı (dükkân + mahzen) | 8,5 m (parapet 8,7) | P kesit | |
| **Toplam dış ölçü (dükkânlar dahil)** | **70,4 × 32,8 m** | P | kesit genişliği 33,0 m ile tutarlı |
| Salon bloğu dış ölçü (mahzen bandı dahil) | 60,0 × 24,4 m | P | |
| Yükseltilmiş salon bloğu (çatı üstü) | 59,5 × 18,0 m | H | iç ölçü + 2 × duvar (1,5 m) |
| Kapı açıklığı (geçit) | ≈ 3,0 m | P | kuzey kapısı dükkân aralığı |
| Arazi | güneye yükselir, güney dükkânlarının dışında ≈ +1,9 m | P kesit | |
| Duvar örgüsü | 3 sıra tuğla + 1 sıra taş almaşık | W s.157 | fotoğrafla uyumlu (F) |
| Kubbe kaplaması | kurşun, dilimli (radyal ek yerleri) | E, F | |

#### Kaynak çelişkisi (2 m'den fazla)
- **OSM 61,5 × 21,4 m** ile **plan 70,4 × 32,8 m (dükkânlar dahil)** ya da **60,0 × 24,4 m (salon bloğu)** tutmuyor. OSM ayak izi muhtemelen yalnız kubbeli kısmı çiziyor; genişlik farkı salon bloğuna göre bile 3,0 m. Öneri: **plan (P) kullanılır**, OSM yalnız konum ve yön (86°) için.

### Parça listesi önerisi (.glb)
| Ad | İçerik |
|---|---|
| `Govde` | dükkân halkası + mahzen bandı dış duvarları (70,4 × 32,8 × 8,5 m) |
| `Cati` | ortak düz çatı (8,5 m) ve parapet |
| `Salon` | yükseltilmiş salon duvarları (8,5 → 10,0 m) |
| `Kubbeler` | 14 kurşun kubbe (vurgu 1) |
| `Kapilar` | 4 kapı (güney: kelime-i tevhid kitabesi; batı: "Bezzazistan" yazısı) |
| `Dukkan_Kapilari` | dışa açılan kemerli dükkân kapıları (v02 detay) |
| `Zemin` | kaide (.glb'ye girmez) |
İç mekân (ayaklar, mahzenler, şadırvan) modellenmez: uygulama dıştan bakıyor, kubbeler ayakların yerini zaten belli ediyor.

### Tur planı
1. **v01 kütle:** `Govde` + `Cati` + `Salon` + `Kubbeler` (kasnaksız, düz çatıdan çıkan yarım küreye yakın kubbe) + 4 kapı boşluğu. Pencere ve süs yok. Render: kuzey ortografik, havadan (fotoğraf açısı: kuzeybatıdan), kubbe sırasına yakın; havadan render fotoğrafla yan yana.
2. **v01b (gerekirse):** kubbe yüksekliği / salon basamağı fotoğrafa göre.
3. **Dondurma**, sonra **v02 detay:** dükkân kapıları, 4 ana kapı, kubbe dilimleri, almaşık (karar sorusu 4), palet + AO, Draco .glb.

### VARSAYIM listesi (şimdiden)
- VARSAYIM: zemin düz kaide; güneydeki 1,9 m yükselme modellenmez (soru 3).
- VARSAYIM: kubbe tepesi tek değer 12,8 m; kubbe dış Ø 7,4 m, çatıdan yükseklik 10,0 → 12,8.
- VARSAYIM: ana kapı yüksekliği 4,5 m (kaynakta yok; kesitteki dükkân kemerleri ≈ 5 m'ye çıkıyor).
- VARSAYIM: dükkân dağılımı uzun kenarlarda 2 × 12, kısa kenarlarda 2 × 5, köşelerde 4 (toplam 68; planda sayım gürültülü).

### Açık sorular (B1 sonu)
1. **Ölçü:** OSM (61,5 × 21,4) yerine Gabriel planı (70,4 × 32,8 dükkânlar dahil) kullanılsın mı? (öneri: evet)
2. **Dükkân halkası modele girsin mi?** Envanter "ilk yapıyla ilişkisi yok" diyor, ama Gabriel planında ve fotoğraflarda yapıyla tek almaşık kütle. Öneri: girsin (fotoğraftaki görünüş bu).
3. **Arazi eğimi:** güneydeki ≈ 1,9 m yükselme yok sayılıp düz kaide kullanılsın mı? (öneri: evet)
4. **Doku:** `_ortak_stil.md` bedesten için "gövde üstünde tek yatay çizgi" diyor; fotoğrafta bütün dış duvar almaşık (3 tuğla + 1 taş). Koza Han'daki gibi almaşık karo mu, tek çizgi mi? (v02'de karar verilebilir)
5. **Ek fotoğraf:** yerden güney kapısı (kitabe) ve batı kapısı, bir de kısa cephe karşıdan. Şu an iki fotoğraf da havadan ve aynı açıdan.

#### B1 cevapları (tasarım sorumlusu, 16 Ekim 2026)
1. Gabriel planı kullanılır (OSM yalnız konum/yön). 2. Dükkân halkası modele girer. 3. Düz kaide. 4. Doku kararı v02'de.

### v01 · kütle turu (16 Ekim 2026)
Betik: `3d/build/build_v01.py`. Pencere ve süs yok. Sonuç `3d/kontrol/v01/`:
- `kontrol_rapor.json`: 5 532 üçgen, 7 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 8 yönde 0 → **GECTI: true**
- Render: `havadan`, `foto_acisi`, `kuzey_orto`, `bati_orto`, `ust_orto`, `kubbe_yakin`
- Yan yana: `yan_yana_foto.png` (ref `ref/foto/da4bcb2a-….jpeg`), `yan_yana_plan.png` (üst orto ↔ Gabriel planı; kubbe dizisi ve dış hatlar örtüşüyor)

Parçalar: `Govde`, `Dukkanlar`, `Cati`, `Kubbeler`, `Kapilar` (+ `Zemin`, `Zemin_Golge`; .glb'ye girmez).

#### Tur içi düzeltme 1 (P'den, fotoğraf bindirmesi sonrası)
İlk deneme B1'deki okumayla kuruldu: dükkân halkası + mahzen bandı 70,4 × 32,8 m tek kütle, 8,5 m düz çatı, üstünde 1,5 m yükselen salon. Fotoğrafla yan yana konunca iki fark çıktı:
- Almaşık duvar kubbelere çok yakın; dükkân halkası duvarın dibinde **çok daha alçak** (bugünkü modern damlar).
- Salon basamağı fotoğrafta duvar olarak görünmüyor; kubbelerin çevresi tek kurşun düzlem.
Düzeltme:
- `Govde` = salon + mahzen bandı **60,0 × 24,4 × 8,5 m** (P), almaşık kütle.
- `Dukkanlar` = çevrede halka, dış 70,4 × 32,8 m, **5,0 m** düz çatı.
- `Cati` = mahzen bandı üstünde dış duvardan (8,5) salon duvarına (10,0) yükselen eğimli kurşun çatı (kapalı kesik piramit). `Salon` parçası ve parapet kaldırıldı.
- Kubbeler aynı: 2 × 7, dış Ø 7,4 m, taban 10,0, tepe 12,8 m (P kesit).

#### Yeni VARSAYIM'lar
- VARSAYIM: dükkân halkası çatısı 5,0 m (Gabriel kesiti 8,7 gösteriyor, ama 1958 yangını sonrası çarşı yeniden yapıldı; fotoğrafta almaşık duvarın dibinde alçak damlar). Ölçü yok.
- VARSAYIM: mahzen bandının üstü eğimli kurşun çatı (8,5 → 10,0); kesitte düz dolgu çizili, fotoğrafta tek kurşun düzlem görünüyor.
- VARSAYIM: kubbelerde kasnak yok, kubbe doğrudan çatı düzleminden çıkıyor.
- VARSAYIM: dört kapı dükkân halkasının dış yüzünde, 3,0 × 4,5 m (yükseklik kaynakta yok).

#### Açık sorular (v01 sonu)
1. **Kubbe yüksekliği:** fotoğrafta kubbeler daha dolgun (yükseklik/çap ≈ 0,48, yarım küreye yakın); modelde P kesitinden 2,8 / 7,4 ≈ 0,38. Kesite sadık kalınsın mı, fotoğrafa göre tepe ≈ 13,5 m'ye mi çıksın? (plan > foto kuralı gereği sormadan değiştirilmedi)
2. **Dükkân halkası yüksekliği** 5,0 m uygun mu? Dükkânların dış görünüşü (bugünkü modern damlar mı, Gabriel'deki tonozlu dükkânlar mı) v02'de mi karar verilsin?
3. Kütle kabul edilirse: "GEOMETRİ DONDURMA v01".

### v01b · kubbe yüksekliği (16 Ekim 2026)
Betik: `3d/build/build_v01b.py` (= v01 + yalnız `kubbe_tepe`). Sonuç `3d/kontrol/v01b/`: 5 532 üçgen, 7 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 0 → **GECTI: true**. Render'lar v01 ile aynı; yan yana `yan_yana_foto.png`, `yan_yana_plan.png`.

#### Karar (tasarım sorumlusu)
- Kubbeler fotoğrafa göre dolgun: tepe **12,8 → 13,5 m**, dış Ø 7,4 m aynı → yükseklik/çap 3,5 / 7,4 ≈ 0,47 (yarım küreye yakın). P kesitindeki 12,6–13,0 m'den bilinçli sapma (foto > kesit, tasarım sorumlusunun kararı).
- Başka hiçbir ölçü değişmedi.

#### Hâlâ açık
- Dükkân halkası yüksekliği (5,0 m VARSAYIM) ve dış görünüşü (modern dam / tonozlu dükkân) → v02'de.
- Kütle kabul edilirse: "GEOMETRİ DONDURMA v01b", sonra v02 detay turu (doku kararı dahil).

### GEOMETRİ DONDURMA v01b (16 Ekim 2026)
Kütle tasarım sorumlusu tarafından kabul edildi. `build_v01b.py` içindeki kütle ölçüleri (P tablosu) bundan sonra değişmez; v02 ve sonrası yalnız detay, renk ve çıkış ekler. Dondurmadan sonra çıkan kütle kusurları ayrı "kusur turu"nda, biçim değiştirmeden düzeltilir.

#### Kararlar (bu oturum)
1. Ölçü kaynağı Gabriel planı ve kesiti (P); OSM (61,5 × 21,4) yalnız konum ve yön için.
2. Almaşık gövde = salon + mahzen bandı, 60,0 × 24,4 × 8,5 m (P).
3. Dükkân halkası modelde: dış 70,4 × 32,8 m (P), çatı 5,0 m (VARSAYIM; fotoğrafta alçak).
4. Mahzen bandının üstü eğimli kurşun çatı, 8,5 → 10,0 m; ayrı salon duvarı görünmez.
5. 2 × 7 = 14 kubbe, dış Ø 7,4 m, taban 10,0 m, tepe 13,5 m (fotoğrafa göre; P kesitinden bilinçli sapma).
6. Dört kapı dört kenarın ortasında, dükkân halkasının dış yüzünde (3,0 × 4,5 m).
7. Zemin düz kaide; güneydeki ≈ 1,9 m yükselme modellenmez.
8. İç mekân (ayaklar, mahzenler, şadırvan) modellenmez.
9. Doku kararı (almaşık karo mı, tek yatay çizgi mi) v02'de verilecek.

### v02 · detay + renk + çıkış (16 Ekim 2026)
Betik: `3d/build/build_v02.py` (= v01b kütlesi + detay; kütle ölçülerine dokunulmadı, yeni ölçüler P'de `D_` önekli). İlk turda doku iki seçenekle üretildi (`AKAR_DOKU` ortam değişkeni); karar sonrası betik almaşığa sabitlendi.

#### Kontrol (`3d/kontrol/v02/`)
- 13 556 üçgen (≤ 30 000), 15 draw call (< 50), açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 8 yönde 0 → **GECTI: true** (iki seçenekte de)
- .glb (Draco): almaşık 144 KB, çizgi 143 KB (≤ 1 MB)
- Render: `havadan`, `foto_acisi`, `kuzey_orto`, `bati_orto`, `kubbe_yakin`, `dogu_uc` (ref kırpıntısıyla aynı açı), `kuzey_kapi`
- Seçim görseli: `3d/kontrol/v02_secim/doku_secimi.png` (A / B yan yana + referans fotoğraf)

#### Eklenenler
- `Sacak` (yeni): almaşık gövdenin üstünde tek tuğla bant (8,15 → 8,5 m, 0,10 m taşma). Fotoğrafta var; stil kuralındaki "gövde üstünde tek yatay çizgi".
- `Pencereler` (yeni): uzun cephelerde göz ekseninde birer (7 + 7), kısa cephelerde dört (y = ±3,2 / ±5,0, P kesit; fotoğrafta doğu ucunda iki çift). Tuğla yuvarlak kemer çerçeve + taş alınlık + parmaklıklı dikdörtgen pencere (doku/pencere.png, Koza Han ile aynı).
- `Kapilar`: dört kenarın ortasında taş çerçeve (4,4 × 4,7 m) + tuğla kemer bandı + koyu kahve kemerli kapı (3,0 × 4,5 m).
- `Dukkan_Kapilari` (yeni): dükkân halkasının dış yüzünde tuğla kemerli lacivert kepenkler; uzun kenarda 25 modül (2,82 m), kısa kenarda 11 modül (2,98 m), orta modül kapıya ayrılır → 2 × 24 + 2 × 10 = **68** (W).
- `Kubbeler`: dilim sayısı 24 → 32 (biçim ve ölçü aynı); kurşun dilim ve levha ekleri dokuyla (`doku/kubbe_dilim.png`, dilim başına bir karo, 5 levha sırası).
- Palet: gövde #E2B7A4 (eser.md), dükkân halkası krem #E9E3D3, çatı #B9C6CC, kubbe #95AEBA (eser.md), kapı #6B4A3A (eser.md), tuğla bantlar #C6755B, taş #F2F3E5, kepenk lacivert #415072 (_ortak_stil).
- `A.ao_vertex(samples=32)`; dokulu malzemelerde renk = doku × AO.

#### Parça listesi (.glb)
`Govde`, `Dukkanlar`, `Cati`, `Kubbeler`, `Sacak`, `Pencereler`, `Kapilar`, `Dukkan_Kapilari`.

#### Doku seçenekleri
- **A · almaşık:** gövdenin dört yüzü almaşık karo (3 sıra tuğla + 1 sıra taş, kutu almaşık; 1,2 × 0,6 m; Koza Han karosuyla aynı). Fotoğrafa yakın; `_ortak_stil.md` "doku azdır" kuralına istisna (Koza Han'da da yapıldı).
- **B · çizgi:** gövde düz pembe-kahve, yalnız saçak bandı. Stil kuralına birebir uyar; fotoğraftaki almaşık okunmaz.

#### Yeni VARSAYIM'lar
- VARSAYIM: dükkân halkası krem düz duvar, kepenkler lacivert (bugünkü modern cepheler yerine Gabriel planındaki dışa açılan tonozlu dükkân düzeni, sade).
- VARSAYIM: pencere 0,9 × 1,4 m (5,55 → 6,95), tuğla çerçeve 1,6 m, kemer tepesi 7,95 m.
- VARSAYIM: kapı taş çerçevesi 4,4 × 4,7 m, tuğla bant 3,6 m; güney kapısındaki kelime-i tevhid kitabesi eklenmedi (dükkân çatısının altında yer yok; kapılar fotoğrafta görünmüyor).
- VARSAYIM: kubbe kurşun ekleri 32 dilim, 5 sıra (fotoğraftan sayım).

#### Açık sorular (v02 sonu)
1. ~~Doku seçimi~~ → aşağıda karara bağlandı (A, almaşık).
2. Güney kapısı kitabesi (kelime-i tevhid) için yerden fotoğraf gelirse kapı çerçevesi ona göre yeniden çizilebilir.

#### Karar (tasarım sorumlusu, 17 Ekim 2026)
- **Doku: A · almaşık karo.** Gövdenin dört yüzü almaşık (3 sıra tuğla + 1 sıra taş, kutu almaşık; 1,2 × 0,6 m karo, Koza Han ile aynı) + saçak tuğla bandı. `_ortak_stil.md` "doku azdır" kuralının bilinçli istisnası (fotoğraftaki cephe karakteri; Koza Han'daki karar ile aynı).
- B seçeneği (düz renk + tek saçak çizgisi) elendi; çıktıları (`bedesten_v02_cizgi.*`, `kontrol/v02_cizgi/`) silindi. `build_v02.py`'deki `AKAR_DOKU` seçeneği kaldırıldı; çıktı adları `bedesten_v02.*`, kontrol `3d/kontrol/v02/`.
- Yeniden üretim sonucu değişmedi: 13 556 üçgen, 15 draw call, açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 0 → **GECTI: true**; `.glb` 144 KB. Yan yana: `yan_yana_foto.png`, `yan_yana_dogu_uc.png`.

### Kaynak denetimi + v02b (17 Ekim 2026)
İstek: modeli kaynaklarla ayrıntılı karşılaştır; 14 kubbeli ana yapı ile çevresindeki ticari yapıların ilişkisini incele; yalnız kaynakların desteklediğini düzelt.
Kaynaklar: envanter cilt-2 PDF s.27 (kuzeyden çapraz havadan fotoğraf → `ref/foto/envanter_c2_s27_kuzeyden.png`), s.28 (tam tepeden drone fotoğrafı → `ref/foto/envanter_c2_s28_tepeden.png`), s.29 (metin); `ref/foto/` havadan fotoğraflar; Gabriel planı ve kesiti; `eser.md`.

#### Envanter s.29 metni (doğrudan)
- "Bedestenin merkez mekânı iç ölçüler itibarıyla 15,00 × 56,50 metredir."
- Ticari mekânlar: 32 mahzen ile "bu mahzenlerin önlerinde ve taşıyıcı ayakların çevresinde düzenlenen dükkânlar", hepsi yuvarlak tonozlu → **içerideki ticari birimler** (bedesten içinde).
- "Her bir kapı, kubbeyle örtülü bir giriş mekânına açılır."
- "Bedestenin çevresinde bugün 68 dükkân yer almakta, ancak bunların ilk yapı düzenlemesiyle doğrudan bir ilişkisi bulunmamaktadır." → **dışarıdaki dükkânlar**, sonradan.

#### Bulgular
| # | Konu | Sonuç | Dayanak |
|---|---|---|---|
| 1 | Kurşun örtülü yüksek kütlenin sınırı | **HATALI (v02) → düzeltildi.** Yüksek almaşık kütle yalnız merkez mekân + duvarları: ≈ 59,5 × 18,0 m. v02'de mahzen bandı da yüksek gövdenin içindeydi (60,0 × 24,4 m). | s.28 tepeden: kurşun dikdörtgen oranı 3,27 (59,5/18 = 3,31; 60/24,4 = 2,46); kubbe çapıyla (7,4 m) ölçek → ≈ 58,7 × 18,0 m; kubbe sıraları kurşun kenarına ≈ 0,6–0,9 m. s.27 çapraz: kubbeler almaşık duvarın hemen arkasında. E iç ölçü + P duvar 1,5 m. |
| 2 | Mahzen bandı ve dükkânlar | **DOĞRU (alçak bant olarak).** Yüksek kütleyi dört yandan saran koyu, düz, alçak bir çatı bandı var; mahzen bandı (K/G) ve dükkânlar bu bantta. v02b'de alçak `Dukkanlar` kütlesi artık yüksek gövdenin dibinden başlıyor. | s.28: kurşun dikdörtgenin çevresinde kesintisiz koyu düz bant (K/G ≈ 5,7 m, D/B ≈ 2,9 m görünen); s.27 ve ref-img: bu bantın üstünde klima cihazları, uzun cephe pencerelerinin hemen altında. Gabriel kesiti: mahzen ve dükkânlar salon duvarının dışında, ondan alçak. |
| 3 | Ana yapı ile dükkânlar bitişik mi, arada geçit var mı? | **Bitişik; geçit yalnız dört kapı ekseninde (DOĞRU).** Tepeden fotoğrafta bant boyunca açık sokak/zemin görünmüyor. | Gabriel planı (dükkânlar mahzen bandına ve uç duvarlara sırt verir, geçit yalnız 4 kapıda); s.28 bantın sürekliliği. |
| 4 | Fotoğraftaki birleşimler: duvar mı, örtü mü? | **Dış kenar: modern eğik çatıların saçağı.** Bantın dışındaki gri/bej eğik çatılar (Kapalıçarşı sokak örtüleri) bantın dış kenarını örtüyor; görünen bant (≈ 65,5 × 29,5 m) Gabriel'deki dış sınırdan (70,4 × 32,8 m) küçük. Bu modern örtüler modele girmedi. | s.28 ve s.27: eğik çatılar bantın üstüne kadar uzanıyor; altlarındaki duvar görünmüyor. |
| 5 | İç / dış ticari birimlerin ayrımı | **DOĞRU.** İçerideki 32 mahzen ve ayaklar çevresindeki dükkânlar modellenmedi (iç mekân); dışarıdaki 68 dükkân alçak bantın dış yüzünde kepenk olarak var. | E s.29 metni; Gabriel planı. |
| 6 | Yükseklikler | Yüksek gövde saçağı **8,5 → 10,0 m** (P kesit, salon duvarı). Alçak bant 5,0 m (VARSAYIM, foto). **Çelişki:** Gabriel kesiti alçak bant çatısını 8,7 m gösteriyor; ama uzun cephe pencereleri (P kesit 5,6–7,6 m) bütün fotoğraflarda bantın **üstünde** görünüyor → foto seçildi, belirsiz. | P kesit; s.27, ref-img. |
| 7 | Kurşun çatı | Alçak kırma; köşelerden mahya çizgileri görünüyor. v02b'de duvar üstünden (10,0) iç mekân kenarına (10,25) kesik piramit (VARSAYIM eğim). | s.28 köşe çizgileri. |
| 8 | Dört giriş | **BELİRSİZ.** Varlık ve eksen kesin (E: dört cephede kapı, her biri kubbeli giriş mekânına açılır; Gabriel: kenar ortaları). Tepeden fotoğrafta K ve G orta eksende bantın **dış** kısmında küçük kare, sivri örtülü yapılar var (≈ 3 × 3 m); Gabriel'de kubbeli giriş mekânı bantın **iç** kısmında (salona bitişik). ≈ 3 m çelişki → kütle olarak eklenmedi; kapılar alçak bantın dış yüzünde kaldı. D/B girişleri fotoğrafta seçilemiyor. s.27'de kuzey ekseninde modern çatılı bir geçit kapıya uzanıyor. | E s.29; Gabriel; s.28; s.27. |
| 9 | Pencereler | **DOĞRU.** Uzun cephede göz başına bir, kısa cephede iki çift; yükseklikleri alçak bantın üstünde. | ref-img; s.27; P kesit. |

#### v02b değişiklikleri (yalnız kaynak destekli)
- `govde_x/y`: 60,0 × 24,4 → **59,5 × 18,0 m** (H: E iç ölçü + P duvar; F tepeden foto).
- `cati_h` (almaşık gövde saçağı): 8,5 → **10,0 m** (P kesit).
- `Cati`: duvar üstünden (10,0) iç mekân kenarına (10,25) alçak kırma kurşun çatı; kubbe tabanı 10,25, tepe 13,5 aynı.
- `Dukkanlar` (alçak bant: mahzen bandı + dükkânlar): iç sınırı yüksek gövdenin dibi; dış sınır 70,4 × 32,8 (P), yükseklik 5,0 (VARSAYIM) değişmedi.
- Pencereler, kapılar, dükkân kepenkleri, saçak bandı, doku ve palet v02 ile aynı. Kontrol: GECTI true, 13 556 üçgen, 15 draw call, .glb 143 KB.

#### Değiştirilmeyen belirsizler
- Kubbeli giriş mekânlarının yeri (bantın içi mi dışı mı) ve yüksekliği → yerden ya da daha yakın havadan fotoğraf gerekli.
- Alçak bantın gerçek yüksekliği (P 8,7 / foto ≈ 5) ve dış sınırı (modern saçakların altında).
- D ve B girişlerinin bugünkü bağlantısı.

### v02c · dış dükkân duvarlarına almaşık (17 Ekim 2026)
İstek (tasarım sorumlusu): en dış duvarlara gerçekle uyumlu doku.
- `Dukkanlar` (alçak bant) duvarları krem düz renk (#E9E3D3, v02 VARSAYIM) yerine gövdeyle **aynı almaşık karo** (3 sıra tuğla + 1 sıra taş, 1,2 × 0,6 m). Kepenk kemerleri, kapı çerçeveleri ve çatı aynı.
- Dayanak: Alkan 2023 s.157 "üç sıra tuğla, bir sıra taş almaşık" (yapı geneli); envanter cilt-2 s.56 çarşı sokağı fotoğrafı (`ref/foto/envanter_c2_s29_carsi_sokagi.png`): dükkân vitrinlerinin üstünde tuğla kemerli, taş–tuğla örgülü duvar.
- Belirsiz: sokak fotoğrafının hangi cepheye ait olduğu yazılmamış; fotoğrafta duvar loş ve modern tabelalarla örtülü, örgü düzeni (tuğla sıra sayısı) okunamıyor. Bu yüzden yeni bir karo uydurulmadı, gövde karosu kullanıldı.
- `Dukkan_Duvar` malzemesi kaldırıldı. Kontrol: GECTI true, 13 556 üçgen, .glb 143 KB. Görsel: `3d/kontrol/denetim/dis_duvar_v02c.png`.

### v03 · İç Bedesten Sokağı, dış halka çatısı, yükseltilmiş girişler (17 Ekim 2026)
Tasarım sorumlusunun tespiti: ana yapı ile çevresindeki yapı bitişik değil, arada İç Bedesten Sokağı var; dış yapının çatısı düz değil; dış çatının giriş kısımları yükseltilmiş, dört giriş.

#### Kontrol edilen kaynaklar
- Yandex harita 2B (`ref/foto/yandex_2b_ic_bedesten_sok.webp`): **İç Bedesten Sok.** ana yapının dört yanını dolaşan kapalı bir halka; dış yapının dışında **Dış Bedesten Sok.** → ana yapı ile dış halka arasında sokak var (**DOĞRULANDI**). Yandex'in 3B ayak izleri kaydırılmış çizildiği için ölçü buradan alınmadı.
- Envanter s.28 tepeden: dış halka çatısı **kırma** (iç saçaktan ≈ 5,0 m içeride mahya, dört köşede mahya çizgisi); kurşun gövde ile halka saçağı arasında K/G ≈ 5,6 m, D/B ≈ 2,5 m koyu bant (sokak; üstü kısmen hafif örtülü, klima ve sundurmalar). Batı ortasında ≈ 7,5 m genişliğinde ayrı çatı parçası; doğuda da benzer.
- Envanter s.27 kuzeyden: kuzey ortasında halka çatısından yüksek, kalkanı kuzeye bakan giriş çatısı; önüne cam örtülü çarşı sokağı bağlanıyor.
- ref-img / tasarım sorumlusunun fotoğrafı: dış halkanın uzun eğik metal çatısı.
- Envanter s.29: 68 dükkân ilk yapıya ait değil; Gabriel planındaki bitişik dükkân halkası 1958 yangını öncesi düzen → bugünkü durumu göstermiyor.

#### Değişiklikler (v02c → v03)
- `Dukkanlar`: gövdeye bitişik düz halka (70,4 × 32,8 × 5,0 m) yerine **İç Bedesten Sokağı ile ayrılan dış halka**. Sokağa bakan duvar yüzü ±32,85 / ±15,2 m, dış yüz ±41,65 / ±24,0 m (≈ 83,3 × 48,0 m), duvar derinliği 8,8 m, almaşık.
- Dış halka çatısı: **kırma metal çatı**, saçak 4,5 m, mahya 6,5 m (ortada), 0,6 m saçak taşması, köşelerde mahya. Renk açık gri-bej #C9C3B6.
- `Girisler` (yeni): dört eksende halkayı enine kesen **yükseltilmiş giriş bölümleri**, 7,5 m geniş, saçak 6,6 m, kalkan tepesi 8,0 m; kalkanlar sokağa ve dışarıya bakar.
- `Gecitler` (yeni): giriş bölümlerinin iki kalkan yüzünde tuğla kemerli geçit açıklığı (3,0 m).
- `Ic_Bedesten_Sokagi` (yeni): gövde ile dış halka arasında taş döşeme; genişlik K/G 6,2 m, D/B 3,1 m.
- `Kapilar`: dört ana kapı dış halkadan **ana yapının duvarına** alındı (E s.29: kapılar bedestenin dört cephesinde).
- `Dukkan_Kapilari`: dış halkanın dış yüzünde (Dış Bedesten Sok.) ≈ 2,9 m modülle kepenkler; giriş bölümlerinin önü boş. Sayı artık 68'e sabit değil (halka büyüdü).
- Ana yapı (gövde, kurşun çatı, kubbeler, pencereler, saçak) v02c ile aynı.

#### Yeni VARSAYIM'lar
- VARSAYIM: dış halka çatısı simetrik (mahya ortada) → duvar derinliği 8,8 m; halkanın dış sınırı fotoğraf karesinin dışında kalıyor.
- VARSAYIM: sokak genişliği = tepeden fotoğraftaki görünen bant + 0,6 m saçak taşması.
- VARSAYIM: yükseklikler (halka saçağı 4,5, mahya 6,5; giriş 6,6 / 8,0) kaynakta yok, fotoğraflardaki oranlardan tahmin.
- VARSAYIM: dört girişin genişliği batıdaki ölçümle aynı (7,5 m); kuzey ve güney girişinin genişliği fotoğrafta net değil.

#### Belirsiz / modele girmeyen
- Sokağın üstündeki hafif örtüler, sundurmalar ve klima cihazları (tepeden fotoğrafta koyu bant) → modellenmedi, sokak açık bırakıldı.
- Dış halkanın sokağa bakan iç yüzünde dükkân açıklıkları olup olmadığı → kaynak yok, düz almaşık bırakıldı.
- Envanterdeki "kubbeli giriş mekânları": ana yapının içinde mi, giriş bölümlerinde mi? Bu sürümde ayrıca modellenmedi.
- Güney kapısı kitabesi.
