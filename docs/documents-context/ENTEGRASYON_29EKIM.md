# AKAR · Prototipten ürüne entegrasyon notu (29 Ekim 2026; güncelleme 30 Ekim 2026)

**Kim için:** Tamer, Burak.

**Ne:** `design/test-redmi9t-v2/` prototipinde olup üründe (`main`: `apps/web`, `services/api`, `packages/`) henüz olmayanlar ve bunların veri kaynakları.

**Nasıl karşılaştırıldı:** Ürün tarafı `origin/main` 50d873d (§11.36) ile karşılaştırıldı. Ürünün bugün yaptıkları burada tekrar anlatılmaz:
- haritada GLB ve yerleşim (§11.35);
- OSM bina katmanı;
- hikâye vurgusu ve kamera alanı;
- Geçmişi Gör (`history_images`);
- eser düzeyinde quiz;
- rota rozeti;
- anılar.

**Ekran ekran tam liste:** her ekranda hangi düğmenin nerede olduğu, ne yaptığı ve üründe bugün ne olduğu → [`PROTOTIP_URUN_FARKI.md`](PROTOTIP_URUN_FARKI.md).

**Ana referans Ulucami.** Ulucami bütün özellikleriyle neredeyse hazır:
- hikâye ve kamera;
- parça kartları;
- «İçini göster»;
- «Eser hakkında» okuma düzeni ve kapak;
- Geçmişi Gör ve izler;
- görevler ve rozetler.

Veritabanı şeması, içe aktarma ve UX kararları için örnek Ulucami. Bir alanın biçimi ya da bir etkileşimin nasıl davranacağı belirsizse Ulucami'nin dosyasına ve prototipteki Ulucami ekranlarına bakılsın.

**30 Ekim 2026:** diğer altı eserin dosyaları da Ulucami biçiminde hazır (parça kartları, görevler, envanter metni, okuma katmanı, kitap fotoğrafları, kapak). Ayrıntı §0. Şema Ulucami'ye göre kurulursa yedi eser aynı içe aktarmayla gelir.

**İlke:** Prototipte esere ya da şehre özel değer kodda yazılmaz; her şey aşağıdaki veri dosyalarından okunur. Ürüne de böyle taşınmalı.

Yollar `docs/documents-context/` altına göredir.

---

## 0. 30 Ekim 2026 güncellemesi (bu notun son hâli)

### 0.1 Veri: yedi eser Ulucami seviyesinde
- **Parça kartları** (`icerik/parcalar.md`): Emir Hanı 4, Koza Han 7, Orhan Bey Hamamı 4, Orhan Bey Camii 11, Orhan Gazi Türbesi 7, Bedesten 8 kart. Hikâyede vurgulanan bütün parçaların kartı var. İç mekânı olan üç eserde (Bedesten, Orhan Bey Camii, Orhan Gazi Türbesi) iç parçaların da kartı var; Emir Hanı, Koza Han ve Hamam'da iç mekân yok (yalnız dış). Kartı olmayan parçalar ve nedenleri her dosyanın sonunda. Eski taslaklar `icerik/_eski/parcalar_taslak.md`.
- **Bulmaca, saha görevi, rozetler** (`icerik/gorevler.json`, **taslak**, `_taslak: true`): her eserde bir soru (4 şık, 2 ipucu, fotoğrafla çözülür) ve bir saha görevi (evden karşılığı 3D parçası). Rozet: hikâye (Orhan Gazi Türbesi'nde hikâye olmadığı için yok) + soru + saha. Toplam rozet: Ulucami 3 + diğer altı eser 17 = **20**. Cami ve türbe içinde görev yok. Çarşının ortasındaki Emir Hanı ve Hamam'da konum yarıçapı 60 m (komşu esere taşmasın), öbürlerinde 80 m.
- **Eser hakkında = envanter metninin tamamı** (`icerik/eser-hakkinda.md`): Ulucami'deki gibi kitaptan kelimesi kelimesine (`_araclar/envanter_metni_cikar.py`), bölüm başlıkları kitabın sırası bozulmadan eklendi, rivayet/tahmin içeren paragraflar «Tarihsel çıkarım». Önceki özet metinler `eser-hakkinda-ozet.md`'ye taşındı (uygulama okumaz; «Vakıf ve akar» bölümü oradan aynen alındı). Sayfalar: Emir Hanı C1 s.108–109; Hamam C1 s.104–107; Orhan Bey Camii C1 s.96–103; Koza Han C2 s.8–11 + köşk mescit C1 s.194–195; Bedesten C2 s.27–29; Orhan Gazi Türbesi C2 s.115–117.
- **Okuma katmanı** (`icerik/eser-hakkinda-okuma.md`): her bölüme özet cümleleri, rakam kartları, zaman çizelgesi, terimler ve masaüstü 3D açısı. `hazirla.py` hepsini kitap metninde birebir buldu (uyarı yok).
- **Kitaptaki fotoğraflar** (`icerik/kitap-fotograflari.md` + `icerik/foto/kitap/`): Orhan Bey Camii 26, Hamam 14, Koza Han 12, Emir Hanı 6, Türbe 6, Bedesten 5. Kitabın PDF'inden kesildi (220 dpi, uzun kenar ≤ 1280 px); Ulucami'deki gibi arşiv eşleştirmesi yapılmadı, alt metinler geçici.
- **Kapak** (`eser.json → hakkinda_kapak`): altı eserde de envanterin açılış fotoğrafı (Orhan Gazi Türbesi'nde açılış fotoğrafı galeride yok; dış fotoğraf seçildi).
- **Geçmişi Gör:** Foto Atlas'ta izinli bütün kayıtlar tarandı. Koza Han'a 47676 «Koza Han Mescidi» (1908–34) eklendi (5 → 6; `veri/fotoatlas/eslesme_elle.csv`'ye onay, Git dışında). Bedesten, Emir Hanı ve Orhan Bey Hamamı için Foto Atlas'ta kullanılabilir (ya da izin bekleyen) **hiç kayıt yok**; bu eserlerde «eski görüntü henüz yok» ekranı kalır. Bugünkü eş ve örnek iz Ulucami dışında yapılmadı (`_promptlar/PROMPT_gecmisi_gor_diger_eserler.md` hâlâ açık).

İçe aktarma için değişen bir biçim yok: dosyalar Ulucami'dekiyle aynı alanları taşır. Yeni olan tek alan `gorevler.json → _taslak` (alt çizgili, uygulama okumaz).

### 0.2 Asıl tema: buzlu
- Ürüne **buzlu** tema taşınacak (karar 30 Ekim, Talha). Prototipte adres parametresi olmadan buzlu açılıyor; `cam` akşam kipi olarak kalabilir; `sicak`, `il`, `bant` denemedir, ürüne alınmaz.
- Ayrıntı ve token'lar §5.13.

### 0.3 Arayüz: 29–30 Ekim'de prototipte değişenler
Ekran ekran liste [`PROTOTIP_URUN_FARKI.md`](PROTOTIP_URUN_FARKI.md) §13'te. Kısaca:
- **İl kimliği veriden:** ortak arayüz hiçbir ile ait değil; ilin rengi ve motifi `veri/sehir/<il>.json → kimlik` (`zemin`, `desen`, `desen_renk`). Aramadaki il rozeti / mobil il çipi, seçili eser satırı ve kartı, panel motifi, harita kontrolleri, pusula, 2D/3D düğmesi, Eser hakkında kapağı ve tam metin kartı bu renkleri alır. Rota çizgisi rotanın ilinin rengindedir. «Aktif il» = harita durunca merkeze en yakın il kaydı.
- **Harita:** nötr gri stil + kireç/taş tonları (kara, su ve kabartma zoom'a göre), etiket kalabalığı zoom'a göre seyreltildi, eser adları serif (Cormorant; tuvalde çizilen etiket görüntüsü), seçili pinin altındaki daire kaldırıldı, küre uzaktayken yavaşça döner.
- **Eser detayı (mobil):** alt kart: ad, «Kısa hikâye · N dk», tek **Dinle | Oku** düğmesi; altında «Eser hakkında» tam metin kartı ve «Keşfet» (Geçmişi Gör, Bulmaca) satırları. Kart tutamakla açılır; kapalıyken alttaki içerik kartın kenarına doğru silikleşir (beyaz örtü değil, maske), tam açılınca netleşir. «3D model · Temsili» etiketi, parça adı ve «İçini göster» kartla birlikte kalkar/iner.
- **Eser hakkında:** sesli dinleme oynatıcısı (tarayıcı sesi, bölüm bölüm, metinde okunan paragraf vurgulanır), mobilde altta, masaüstünde sol sütunda; «Metni kısalt» hapı kaydırırken görünür.
- **Geçmişi Gör:** mobilde fotoğraf sabit, harita altta; «Bugün» kartı; fotoğrafın üstündeki «Kamerayı aç» kaldırıldı, «Doğrulanmış» etiketi küçüldü. Masaüstünde mini harita hep açık, mobilde isteğe bağlı.
- **Hikâye · «Yalnız rotada» cümleleri:** `hikaye.md` sonunda `## Yalnız rotada` bölümündeki cümleler (sonraki durağa yönlendiren) yalnız eser rotadan açılınca okunur (`hazirla.py` → `rota: true`). Ulucami 12 ve Bedesten 11. **Ürün:** `story_blocks`'a `route_only boolean`.
- **Parça kartı her eserde, «İçini göster» Bedesten / Orhan Bey Camii / Orhan Gazi Türbesi'nde de:** kod aynı, veri dolunca açılır (§5.1, §5.2).


## 1. Önce bu: içe aktarma eski prototipe bağlı (kritik)

`services/api/scripts/prepare-demo-content.py`, `design/test-redmi9t/hazirla.py` dosyasını (**v1**) modül olarak yüklüyor. Oradan iki sabiti okuyor: `ESERLER` ve `OSM_DUZELTME`. v1 dondurulmuş bir dosya; içindeki model adları eski:
- `ulu-cami_v26`;
- `koza-han_v14`;
- diğerleri de aynı dönemden.

Bugünkü içe aktarma bu yüzden **eski modelleri** ve eski eser bilgisini taşıyor. Yeni modeller, ışık, parça kartları ve görevler hiçbir zaman gelmiyor.

v2'de sabit liste yok; her şey dosyalardan okunuyor:

| Ne | v1 (bugün okunan) | v2 (okunması gereken) |
|---|---|---|
| Eser kimliği (ad, yıl, yaptıran, tür, rol, kısa, konum, sıra) | `hazirla.py → ESERLER` | `eserler/<eser>/eser.json` |
| Model dosyası | `ESERLER[].glb` | `eserler/<eser>/3d/model.json → glb`. Sunum dosyası `export/<glb>_sunum.glb`, harita dosyası `export/<glb>.glb` |
| Yön | `ESERLER[].yaw` | `model.json → yaw` → `placement.headingDeg` |
| Konum düzeltmesi | `OSM_DUZELTME` | `model.json → kaydirma_m {dogu, kuzey}` (metre; formül aynı: `lon += dogu / (111320·cos lat)`, `lat += kuzey / 110540`) |
| Ana parça | `app.js ANA_PARCA` | `model.json → ana_parca` → `placement.anchorNode` |
| Şehir | yok | `veri/sehir/<şehir>.json` |
| Rota | `hazirla.py → ROTALAR` | `veri/rota/*.json` |

**Öneri:** `prepare-demo-content.py`, v2'nin `hazirla.py` dosyasındaki okuyucuları kullansın:
- `eserleri_bul`
- `hikaye_oku`
- `parcalar_oku`
- `gorevler_oku`
- `model_oku`
- `okuma_oku`
- `gecmis_oku`
- `izler_oku`

Ya da aynı dosyaları doğrudan okusun. Bu iş bitene kadar v1'i ve eski GLB'leri silmiyoruz, çünkü içe aktarma onlara bağlı.

**Kimlik farkı:** Ürün iki eserde farklı kimlik kullanıyor:
- `yildirim-bayezid-bedesteni` → `bedesten`
- `orhan-bey-kulliyesi` → `orhan-gazi`

Görev, parça ve izlerdeki eser kimlikleri de çevrilmeli.

**Model sürümleri değişiyor:** 29 Ekim'de 3D ekibi parça sadeleştirmesi yapıyor:
- yeni sürümler (`v17`, `v08`…);
- bazı parça adları değişiyor ve birleşiyor.

Sürüm numarasını hiçbir yere elle yazmayın. Her zaman `model.json → glb` okunsun.

**Parça adları değişti, model ile içerik birlikte güncellenmeli (çakışma riski).** Parça sadeleştirmesi 29 Ekim'de bitti:
- yeni sürümler: Bedesten v09, Koza Han v17, Orhan Bey Camii v10, Orhan Bey Hamamı v08, Emir Hanı v08, Orhan Gazi Türbesi v05;
- Ulucami değişmedi (v29).

Bazı eski parça adları artık yok. Örneğin Koza Han'da `Avlu_Mescit` + `Mescit_Kubbe` + `Mescit_Dikis` → `Mescit`. Ürünün veritabanındaki hikâye vurguları (`story_blocks.highlights`) ve quiz parçaları eski içe aktarmadan geldiği için eski adları taşıyor.

Yalnız model dosyası panelden yenilenirse:
- bu vurgular boşa düşer (hata vermez, sadece hiçbir şey yanmaz);
- quiz'deki «3D modelde bul» görevi çalışmaz.

Bu yüzden model ve içerik **aynı içe aktarmayla** güncellenmeli. Eski → yeni ad eşlemesi `eserler/_kutuphane/blend_hat/parca_plan.json` dosyasında; hikâye dosyaları yeni adlara çevrildi. Ana parça adları (`placement.anchorNode`) değişmedi:
- Ulucami ve Bedesten `Govde`;
- Koza Han `Govde_Dis`;
- Orhan Bey Camii `Cami_Govde`;
- Emir Hanı `Emir_Hani`;
- Orhan Gazi Türbesi `Govde`.

## 2. 3D modeller: dosya kuralları

- **KARAR (29 Ekim, Muhammed): eser başına İKİ model.** Harita için hafif dosya (iç mekân yok), detay için sunum dosyası (ayrıntılı iç mekân). Önceki «yalnız _sunum yüklensin» önerisinin yerine geçer; §11.2 buna göre güncellenmeli. Her eserde iki dosya var:
  - `<glb>.glb` (harita): yalnız yapı;
  - `<glb>_sunum.glb` (detay): yapı + zemin kaidesi, ağaçlar, ölçek insanları.
  - Haritada aynı anda 7–10 model yüklendiği için harita dosyası küçük olmalı. Bugün sunum dosyası harita dosyasından %10–25 büyük (Ulucami 786 → 865 KB, Bedesten 202 → 246 KB). Haritada sunum dosyası yüklenip ekler gizlenirse bu fark boşuna indirilir.
  - **Öneri:** Model kaydına ikinci bir dosya alanı (`model.src` harita, `model.presentationSrc` detay) ya da `kind=model` için `variant: map | presentation`. Panelde iki dosya yüklenir. Yalnız biri varsa ikisinde de o kullanılır.
  - Parça adları iki dosyada birebir aynı (yapı parçaları); `anchorNode` ve vurgular ikisinde de çalışır.
  - İç mekân yalnız sunum dosyasında. Harita dosyasında `model.json → ic_parcalar` listesindeki parçalar yok; haritada çatı kalkmadığı için görünmezler.
  - İçerik referansları (vurgu, kart, görev, örtü grupları) sunum dosyasına göre denetlenir. Harita dosyasında yalnız `anchorNode` gerekir.
- **AO dokusu ikinci UV'de** (`occlusionTexture.texCoord = 1`). three.js `GLTFLoader` bunu kendiliğinden uygular. Bir sıkıştırma ya da temizlik adımı `TEXCOORD_1`'i ya da `occlusionTexture`'ı silerse köşe kararması kaybolur.
- **Modellerde artık şunlar yok:** köşe rengi (`COLOR_0`) ve `Yer_Golgesi` düzlemi.
  - Yer gölgesini istemci çiziyor (bkz. 3).
  - Eski bir dosyada `Yer_Golgesi` varsa gizlensin ve taban izi hesabına girmesin. Girerse çevredeki OSM binaları da silinir.
- **Üçgen:** 29 Ekim sunum dosyaları sınırın (139.152) altında:
  - Ulucami 97.496;
  - Koza Han 46.292;
  - Bedesten 25.224.
- **Kaynak:** GLB'ler yalnız Blender'dan üretilir (`_kutuphane/blend_hat/`, eserin `build/build_vXX.py`'si). Blend ve build dosyaları repoda değil, Drive'da.

## 3. Haritada ve detayda ışık, renk, yer gölgesi

Ürünün `map-models.ts` ve `model-viewer.tsx` dosyalarında ışık sabit yazılı. `map-models.ts`'teki değerler prototipin eski değerleri (ortam 2,3 / güneş 1,3). Yeni değerler şehir kaydında: `veri/sehir/bursa.json → harita_isik`.

```
ortam 2 · gunes 1 · dolgu 1 · yon 315 · yukseklik 45 · doygunluk 1.25 · yer_golgesi 0.18
```

Prototipteki karşılığı (`app.js`, `ISIK` ve `Sahne3D`). Harita ve eser detayı **aynı** ışığı kullanır:

```js
const a = deg(yon), y = deg(yukseklik);                       // model ekseni: x doğu, y yukarı, z güney
const dir = new Vector3(sin(a)*cos(y), sin(y), -cos(a)*cos(y));
new HemisphereLight(0xffffff, 0xb8b0a2, ortam);
new DirectionalLight(0xfff6ea, gunes).position.copy(dir);
new DirectionalLight(0xdfe8f2, dolgu).position.set(-dir.x, 0.5, -dir.z);
// doygunluk: her malzeme rengi HSL'de s *= doygunluk (en çok 1)
```

**Yer gölgesi:** Kodla üretilen tek doku kullanılır:
- 128 px tuval;
- `roundRect(26, 26, 76, 76, 14)`, siyah;
- `blur(13px)`.

Yapının taban izi boyutunda bir düzleme konur: `boy / 0,59 + 2 m`. Opaklık `yer_golgesi` değeridir. Ayrıca:
- `depthWrite: false`;
- `polygonOffset`;
- model ile birlikte döner.

**Detay sahnesinin zemini:** Şehir rengine çalan bir geçiş. Değerler `veri/sehir/bursa.json → kimlik.sahne_ust / sahne_alt` alanlarında (`#DDE4E5 → #A7B4B7`). Tuval saydamdır, zemin CSS'ten gelir.

**Öneri:** `harita_isik` ve `kimlik` alanları `cities` tablosuna ya da harita ayarlarına (`/v1/map-settings`) eklensin. Panelden değiştirilebilsin.

## 4. OSM binaları: kural farkı

- **Ürün:** ortası taban izine düşen ve küçük olan bina gizlenir. Panelden `hidden_points` / `kept_points` ile düzeltilir.
- **Prototip (29 Ekim'den beri):** ürünle aynı otomatik kural; panel yok.

**Karar:** Ürünün bugünkü hâli kalsın: otomatik kural, artı panelde binaya tıklayıp «Gizle / Geri göster». Prototipte bir süre «modele değen bina bütünüyle kalkar» kuralı denendi. Bu kural çevredeki çarşı bloklarını da sildiği için bırakıldı. Prototipte görülen asıl sorun şuydu: bina kesilip artanı bırakılınca modelin dibinde ince şeritler kalıyordu. Ürün binayı kesmediği için bu sorun ürünü etkilemez.

Yerleşim girilirken kontrol edilecek yerler:
- Bedesten ve Koza Han'ın çevresindeki çarşı çatıları;
- Emir Hanı: OSM'deki adlı çokgen başka bir bina; konum uydudan ölçüldü.

## 5. Üründe olmayanlar (eklenmesi gerekenler)

Önem sırasıyla. Her satırda veri kaynağı ve prototipteki karşılığı var.

### 5.1 3D parça kartları
- **Kaynak:** `eserler/<eser>/icerik/parcalar.md` (30 Ekim'den beri yedi eserin hepsinde).
- **Bir satır:**
  - Parçalar (model düğüm adları, virgülle);
  - Başlık;
  - Metin;
  - Fotoğraflar (sırayla, ilki kapak);
  - Kaynak;
  - Güven.
- **Davranış (prototip `Sahne3D`):**
  - Kartı olan parça tıklanır, kartı olmayan tıklanmaz.
  - Eserin hiç kartı yoksa bütün parçalar adıyla tıklanır. Bunun istisnası `model.json → tiklanmaz` listesindeki parçalardır.
  - Bir kartın **bütün parçaları birlikte** seçilir ve vurgulanır. Örneğin Ulucami'de dört cephe ile pencere girintileri tek kart.
  - Masaüstünde fare üstündeyken hafif sarı vurgu görünür ve imleç el olur.
  - Kart: fotoğraf şeridi, metin, sesli dinle.
- **Ürünle ilişki:** `cards` tablosu hikâye cümlesine bağlı ve tek medya taşıyor. Parça kartı ayrı bir şey.
- **Öneri:** `site_parts` tablosu:
  - `site_id`
  - `nodes text[]`
  - `title`
  - `body`
  - `media_ids[]`
  - `source_id`
  - `trust`
  - `position`

### 5.2 «İçini göster»
- **Kaynak:** `model.json → ortu_gruplari`. Yukarıdan aşağı kalkan parça grupları; ilk grup önce kalkar.
- Ulucami'de kubbeler ve çatı kalkar, iç mekân görünür.
- Hikâye cümlesinde `İç mekân (3D)` sütunu «evet» ise, o cümlede örtü otomatik kalkar.
- **Öneri:** `site_map_placements`'a değil, model kaydına `cover_groups jsonb` alanı.

### 5.3 Hikâye kamerası ve iç mekân
- **Kaynak:** `icerik/hikaye.md`. İkinci tablo: `# | Hedef | Azimut | Eğim | Uzaklık | Neden`. Birinci tablo: `Vurgu (3D)` ve `İç mekân (3D)`.
- Üründe `story_blocks.camera` var, ama içe aktarma bu alanı doldurmuyor. Bu yüzden ürünün hikâyesinde kamera hiç dönmüyor.
- Uzaklık değerleri sözcük:
  - `bütün yapı`
  - `orta`
  - `yakın`
  - `çatı`
  - `kadrajın yarısı`
- Prototip bunları yapının sınır küresine göre kesire çeviriyor (`Sahne3D.aci`).

### 5.4 «Eser hakkında» okuma düzeni
- **Kaynak:** `icerik/eser-hakkinda-okuma.md` (30 Ekim'den beri yedi eserde). Her bölüm için:
  - `Özet` cümleleri;
  - `Rakam` kartları;
  - `Alıntı`;
  - `Zaman` (zaman çizelgesi);
  - `Terim` (dokununca açılan tanım);
  - `3D` (masaüstünde metinle birlikte dönen model açısı).
- Hepsi envanter metninden **kelimesi kelimesine** seçilir; `hazirla.py` metinde geçtiğini doğrular.
- `icerik/kitap-fotograflari.md`: envanterdeki fotoğrafların bölümlere yerleşimi.
- `eser.json → hakkinda_kapak`: sayfanın kapak fotoğrafı (envanterin açılış fotoğrafı). Galerinin ilk fotoğrafından farklı olabilir.
- **Ürünle ilişki:** `site_sections` yalnız `title` / `body` taşıyor.
- **Öneri:** bölüme `extras jsonb` alanı (özet, rakam, alıntı, zaman, terim, kamera) ve eser düzeyinde `about_cover_media_id`.

### 5.5 Görevler ve eser rozetleri
- **Kaynak:** `icerik/gorevler.json` (yedi eserde; Ulucami dışındakiler `_taslak: true`, içerik sorumlusu gözden geçirecek). Görev türleri:
  - `soru`: seçenekler, doğru cevap, ipuçları, doğru/yanlış metni, görsel, `parca`;
  - `saha`: evden karşılığı var, `evden_cozulur`.
- `rozetler`: koşul `hikaye_bitti` ya da `gorev: <id>`; ayrıca `yerinde_etiketi`.
- **Kurallar:**
  - Puan yok; süre yok; yanlış cevapta ceza yok.
  - Cami içinde görev yok.
  - Figma'dan puan ifadeleri kaldırıldı.
- **Ürünle ilişki:** `quizzes` eser düzeyinde var. Saha görevi, ipucu ve eser rozeti yok. Rozet yalnız rota düzeyinde (`catalog_routes.badge_*`). Ürünün `point_events` tablosu puan tutuyor; tasarım kararıyla çelişiyor, konuşalım.
- `parca` alanı: «3D modelde bul» görevi. Modeldeki parça adı; parça sadeleştirmesinden sonra adlar değişebilir (bkz. 1).

### 5.6 Şehir kaydı ve küre
- **Kaynak:** `veri/sehir/*.json`. İçerik:
  - `merkez`, `zoom`, `zoom_masaustu`;
  - `varsayilan`;
  - envanter künyesi (`envanter_adi`, `_yili`, `_eser_sayisi`);
  - `kimlik` (zemin rengi, desen, 3D sahne zemini);
  - `harita_isik`.
- Prototipte zoom 9'un altında küre görünümüne geçiliyor, şehirler işaret olarak görünüyor:
  - Bursa: «7 eser».
  - Hatay, Konya, Kütahya: «Yakında».
- `cities` tablosu bugün yalnız `id` ve `name` taşıyor.

- **Küre ortalaması (29 Ekim):**
  - MapLibre'de `easeTo` / `flyTo`'ya verilen `padding` kalıcıdır. Masaüstünde eser kartı için verilen sağ boşluk (380 px), eser bırakılınca da kalıyor ve küreyi sola kaydırıyordu.
  - Prototip iki yerde sıfırlıyor: şehirlere uçarken (`padding:0`) ve zoom 9'un altına inildiğinde (`zoomend`).
  - Ürün de eser seçimini aynı yolla yapıyorsa aynı sorun çıkar.
- **Kürenin arkası:** tuval kürenin dışında saydam. Harita kabının arka planı 3D sahneyle aynı:
  - renkler `kimlik.sahne_ust` → `sahne_alt`;
  - ortası açık, kenarlar koyu elips geçiş.

### 5.7 Geçmişi Gör eki
- **Kaynak:** `eserler/<eser>/gecmisi-gor/`:
  - `bugunku-esler.json`: bugünkü eş fotoğraf;
  - `izler.json`: İz Bırak örnekleri; `ornek=true` ekipten gelir, arayüzde «Örnek» etiketi.
- Üründe `presentPhoto` ve `memories` var; bu dosyaları içe aktarma okumuyor.
- **Lisans:**
  - kaynak satırı (`kaynakSatiri`) her görselde aynen gösterilir;
  - ND lisanslı görsel kırpılmaz (`object-fit: contain`);
  - Deutsche Fotothek izni yalnız 7–8 Kasım finali için (Bursa'da kayıt yok, repoda yok).

### 5.8 Harita küçükleri
- **Stil:** `design/harita/akar-style-ozel-v2.json`, kullanıcının seçtiği renkler. Ürün `apps/web/public/harita/akar-style.json` kullanıyor.
- **Pin:**
  - etiket yer bulamazsa öbür yana geçer (`text-variable-anchor-offset`);
  - önemli eser önce çizilir (`symbol-sort-key` = `eser.json → sira`);
  - yakında pin küçülür.
- **Filtre:**
  - `rol: akar` arayüzde «Ticari (akar)»; «Akar» uygulamanın adıyla karışıyordu;
  - şehirde eseri olmayan rol gösterilmez.

### 5.9 Yükleme ekranları (şehrin deseniyle)
- **Açılış ekranı:** tam ekran; arkada şehrin deseni silik (%6–10); ortada altın amblem çizgi çizgi çizilir; «AKAR», şehir adı, «Vakıf eserleri yükleniyor». Harita ilk kez çizilince kalkar.
- **3D yükleniyor:** kart; amblem; «3D model yükleniyor · %NN»; ilerleme çubuğu; «x MB / y MB. Bu sırada Dinle ya da Oku ile başlayabilirsin…». Yüzde ve MB gerçek indirmeden gelir (akış okunur). Kart açıkken panel kullanılabilir.
- **Kaynak:**
  - Figma `akar-yeni`: «Amblem» 1:913, «Desenler» 1:863–958, «D · Eser detay / 3D yükleniyor» 1:4794, «Bileşen · Durum ekranları» 1:7615;
  - prototip `index.html` `#acilis`, `app.js` `yuklemeKart` / `glbAl`.
- **Desen ve renk şehir kaydından gelir:** `kimlik.desen` (`design/desenler/*.svg`), `kimlik.zemin`, `kimlik.desen_renk`. Kodda şehir adı ya da desen yazılmaz.

### 5.10 Arayüz ayrıntıları (prototipte var, Figma 29 Ekim'de güncellendi)

Figma `akar-yeni`'de değişen her ekranın altında «29 Ekim: …» notu var. Figma'da «29 Ekim» diye aramak bütün listeyi verir.

**Eser detayı · galeri**
- Her fotoğrafta sağ altta «büyüt» düğmesi (30 px daire, lucide `expand`).
- Fotoğrafa dokununca ışık kutusu açılır; altında künye «başlık · kaynak».
- Yana kaydırınca soldaki boşluk sabit: `scroll-padding-inline` mobilde 16 px, masaüstünde 24 px.

**Eser detayı · 3D**
- Sahne zemini şehir renginde geçiş (bkz. 3).
- Fare üstündeyken (yalnız masaüstü) parçanın kartındaki bütün parçalar hafif sarı yanar. Ayrıca imleç el olur ve ipucu kart başlığını gösterir.
- Tıklanınca aynı grup seçilir (bkz. 5.1).

**«Eser hakkında»**
- Kapak:
  - envanterin açılış fotoğrafı (`eser.json → hakkinda_kapak`);
  - masaüstünde geri düğmesi kapağın sol üstünde; yarı saydam koyu hap, «‹ Ulucami».
- Kapak geçilince sekme çubuğunun solunda geri düğmesi:
  - masaüstü: «‹ Ulucami» hapı (beyaz, şehir renginde çerçeve);
  - mobil: yalnız ‹ simgeli 40 px yuvarlak düğme.
- Sekme şeridi taşınca kenarlarda solma. Sol solma yalnız kaydırılmışken görünür. Masaüstünde ‹ › okları var.
- Bölümde başlık fotoğraftan önce gelir.
- Alıntının üstünde altın süs yok.
- Fotoğraflar kırpılmaz. Oran, görsel yüklenince gerçek boyutundan alınır (`--oran`).
  - Şerit: aynı yükseklik, genişlik orana göre, dikeyde ortalı.
  - Sağ altta «1 / 4» sayacı, masaüstünde ‹ › okları, kenarlarda solma, her fotoğrafta büyüt düğmesi.
- «Tam metni oku» kapalıyken özet paragrafları tekrar etmez (`.hk-ozette`).
- Masaüstü ölçüleri:
  - yapışık 3D/fotoğraf alanı yüksekliği en çok `min(100vh − 112 px, 620 px)`;
  - iki sütun arası 48 px;
  - içerik en çok 1360 px.

**«İçini göster» (dört eserde)**
- Ulucami'ye ek olarak Bedesten, Orhan Gazi Türbesi ve Orhan Bey Camii'nde iç mekân var (29 Ekim; `_promptlar/PROMPT_icini_goster_3_eser.md`). İç parçaların kartları 30 Ekim'de yazıldı.
- Kod aynı kalır. Düğme, eserin `model.json → ortu_gruplari` alanı dolunca görünür. Ürün de koşulu veriden okumalı; düğmeyi «yalnız Ulucami» diye kodda açmasın.
- Orhan Bey Hamamı'na iç mekân yapılmayacak.

**Kaynak dosyalar (prototip):**
- `design/test-redmi9t-v2/app.js`: `Sahne3D`, `hkSerit`, `hkSekmeOk`, `yuklemeKart`, `glbAl`, `sehirlereUzaklas`;
- `app.css`: `.hk-*`, `.galeri-f`, `.buyut-ic`, `.yukleme`, `#acilis`.

### 5.11 Dil seçici (TR | EN) ve İngilizce içerik
- Avatarın solunda «TR \| EN» seçici. Bütün içerik dile bağlı: eser adı ve kısa metni, hikâye, parça kartları, fotoğraf başlıkları, Eser hakkında.
- Çeviri yok; altyapı hazır. Biçim ve ürün alanları: **[`ICERIK_INGILIZCE.md`](ICERIK_INGILIZCE.md)**.
- Ürüne eklenecek alanlar: parça kartı ve Eser hakkında bölümü için `title_en`, `body_en`. İçe aktarma `icerik/en/` dosyalarını okumalı.

### 5.12 Karşılama, konum kipi, kaynak detayı, 3D yedeği, giriş satırı (29 Ekim akşamı)
Figma'da olup prototipte eksik olan dört ekran eklendi; ayrıntı ve ölçüler [`PROTOTIP_URUN_FARKI.md`](PROTOTIP_URUN_FARKI.md) §1, §2, §3, §5, §11'de.
- **İlk açılış karşılama kartı** (D 1:4042 · WF 1:5616): yalnız ilk girişte; «Evden gez» konum istemez, «Konumumu kullan» izni açar; «Vakıf nedir? ›». Ürün: ilk giriş bilgisi hesapta ya da cihazda tutulabilir; misafir için cihazda yeterli.
- **Konum kipi Yakınımda | Evden gez** (D 1:4685 · WF 1:5742): varsayılan Evden gez (izin istemeden açılır). Yakınımda'da liste mesafeye göre sıralanır. Konum şehrin 30 km dışındaysa Evden gez'e döner. **Konum sunucuya gönderilmez**; ürün de mesafe hesabını istemcide yapmalı (KVKK metnindeki «konum yalnız cihazda» sözüyle uyumlu).
- **Kaynak detayı «Bu bilgi nereden geliyor?»** (D 1:3193 · WF 1:7027): her güven etiketi dokunulur. Prototip `kaynak` metnini ayrıştırıyor («Envanter Cilt 1 · s. 25, 36; Ürgen s.10»). **Ürün için öneri:** içe aktarmada bu metin yapılandırılmış kaynağa çevrilsin (`sources[]`: `kitap`, `cilt`, `sayfa`, `tur`), yan sayfa ondan beslensin. «Bir hata mı gördün? Bildir ›» için bir bildirim kaydı (ör. `POST /reports`: içerik kimliği, metin, isteğe bağlı e-posta) gerekir; prototipte yalnız teşekkür uyarısı var.
- **3D açılamazsa** (D 1:4911 · WF 1:7840): «3D model açılamadı» kartı, «Yeniden dene» (hatalı indirme önbellekten silinir) ve «Görsellerle devam et» (Fotoğraf görünümüne geçer, hikâye aynı akışla sürer). Ürünün `model-viewer.tsx` hata durumunda aynı iki düğmeyi vermeli. «Bu cihazda 3D ağır kaldı» (zayıf cihaz) prototipte yok.
- **Tebrik kartında giriş satırı:** misafirse «Rozetlerini kaybetme · Giriş yap». Figma'daki ayrı «Giriş isteği (hikâye bitince)» penceresi yerine; iki pencere üst üste açılmaz. Girişte cihazdaki `akar.rozet.*`, `akar.bitti.*`, `akar.gorev.*` hesaba taşınmalı.
- **Vakıf nedir? metni:** tanım cümlesi AKAR'ın açıklaması; alıntı envanter Cilt 1 girişinin «Ticari yapılar» paragrafından (basılı sayfa ~22; **PDF sayfa numarası doğrulanmadı**, bu yüzden kaynak satırında sayfa yazmıyor). Örnek cümle veriden seçilir (akar rolündeki eserin «vakfedil-» geçen hikâye cümlesi).
- Kod: `app.js` → `yanSayfaAc`, `kaynakAc`, `vakifNedir`, `uc3Hata`, `s3dKur`, `konumKip`, `konumIste`, `konumMenu`, `karsilamaGoster`; `app.css` → `.yan-*`, `.ks-*`, `.vn-*`, `.uc-hata`, `.uh-*`, `.konum-menu`, `.karsilama*`, `.ka-*`, `.tb-giris`.
- **Akar akışı** (Figma D 1:2893; karar 29 Ekim: «A · haritada altın yay»). Hikâyede akar cümlesi gelince anlatım sahnesi saydamlaşır, altta **haritanın kendisi** görünür:
  - kamera iki yapıyı birlikte kadraja alır (eğim 52°, gelir veren solda, alan sağda; panel ve hikâye kartı payı hesaplanır);
  - yalnız iki yapının pini kalır;
  - aralarına altın yay 2,2 sn'de çizilir (`line-gradient` + `line-progress`), ardından üç sikke yay boyunca akar; ortada etiket;
  - sol üstte kart: «VAKIF DÜZENİ · GELİR YOLU», «Bedesten → Ulucami», güven etiketi (dokununca kaynak detayı);
  - hedef 3 km'den uzaksa (Koza Han → İstanbul) yay o yöne 240 m çizilir, ucunda hedefin adı;
  - cümle değişince harita eski kamerasına, pin süzgeci eski hâline döner; hareket azaltmada yay hemen tam, sikke yok.
  - **Veri** (kod değil): `eserler/<eser>/icerik/hikaye.md` sonunda «## Akar akışı» tablosu `| # | Akar (gelir veren) | Hayrat (gelir alan) | Hayrat adı | Etiket | Kaynak | Güven |`. Hayrat bir eser kimliği ya da «enlem, boylam». `hazirla.py` bunu cümlenin `akis` alanına yazar: `{ kaynak_eser, hedef_eser, hedef_nokta, hedef_ad, etiket, kaynak, guven }`; olmayan eser kimliğinde uyarır.
  - **Kural:** etikete yalnız kaynağın söylediği yazılır. Kılıç Ali Paşa prototipindeki «Bakım · Aydınlatma · Görevliler» kalemleri envanterde yok, kullanılmadı.
  - Dolu satırlar (hepsi Doğrulanmış): Ulucami 11 ve Bedesten 4 (Bedesten → Ulucami, C1 s.11, C2 s.29); Orhan Bey Hamamı 2 ve Orhan Bey Camii 4 (hamam → Orhan Gazi İmareti, C1 s.97, 104; imaret bugün yok, yay külliyenin camisine çizilir ve kart bunu söyler); Koza Han 2 (→ II. Bayezid Külliyesi, İstanbul, C2 s.8; koordinat yalnız yön için).
  - **Ürün:** `story_blocks`'a `flow` (ya da ayrı `story_flows` tablosu) eklenmeli; içe aktarma `akis` alanını taşımalı. Harita bileşeni (`heritage-map.tsx`) anlatım sırasında görünür kalabilmeli. Kod: `app.js` → `akisUygula`, `akisKapat`, `akisCiz`, `akisYol`, `akisKatmanlar`; `app.css` → `#gorus.akis`, `.akis-kart`.

### 5.13 Asıl tema: buzlu (30 Ekim 2026)
- **Karar:** ürünün teması buzlu. Gece kipi istenirse `cam`.
- **Kaynak:** `design/test-redmi9t-v2/temalar.css` → `html[data-tema="buzlu"]` (token'lar: `--zemin`, `--cam`, `--yuzey`, `--murekkep`, `--altin`, `--yore-tint`, `--yore-yazi`); harita `design/harita/akar-style-buzlu.json`; küre göğü `app.js` → `gok.buzlu`.
- **İlke:** ortak arayüz nötr (taş zemin `#EDEEEA`, koyu mürekkep, altın vurgu); ilin rengi yalnız yöre işaretlerinde (il rozeti, seçili satır, başlık bandı, tam metin kartı, rota). Renk tek bir ile ait görünmesin diye «petrol» arayüz rengi olmaktan çıktı.
- **Cam yüzey:** haritanın üstünde yüzen her şey yarı saydam + `backdrop-filter: blur`. Desteklemeyen tarayıcıda düz yarı saydam.
- **Ürün:** `apps/web` tema token'ları bu değişkenlere eşlensin; il rengi `cities` kaydına `identity jsonb` (`zemin`, `desen`, `desen_renk`, `sahne_ust`, `sahne_alt`) olarak gelsin. Koyu kip isteniyorsa `cam` aynı token adlarıyla.
- **Kontrast:** `kimlik.zemin` üstünde beyaz yazı en az 4.5:1 (Bursa #22566E, Konya #3D8285, Hatay #7A6340 geçer).

## 6. Repoda olup ürüne alınmayacaklar

- `design/test-redmi9t/` (v1): donmuş. İçe aktarma v2'ye geçince eski GLB'lerle birlikte silinecek:
  - `v26`/`v27`, `v14`, `v06`, `v07` (cami), `v05` (hamam/emir), `v02`.
- `design/harita/akar-harita-onizleme*.html`: tasarım aracı (ışık/renk paneli), ürün değil.
- `design/test-redmi9t-v2/_promptlar/`: 3D ve içerik ajanlarına verilen iş emirleri; kayıt amaçlı.
- `design/test-redmi9t-v2/temalar.css` içindeki deneme tonları (`data-ton=sicak|il|bant`) ve kullanılmayan `tema-vakif.css`, `ornek-vasa.html`, `harita/akar-style-galeri.json`, `akar-style-minyatur.json` (Git dışında).
- `eserler/_kutuphane/renk_ao_v3/`: bir kerelik geçiş; kullanılmaz.
- `.gitignore`'da olanlar ekip Drive'ında:
  - `kontrol/`, `blend/`, `build/`, `ref/`;
  - envanter PDF'leri, `veri/fotoatlas/`, `veri/bursa-foto/`.

## 7. Repo sağlığı (ekip kararı)

- **Envanter PDF'leri git geçmişinde duruyor.** 22 Ekim'de takipten çıkarıldılar, ama eski kopyalar geçmişte kaldı (6 dosya, her biri 29–63 MB; yerel `.git` 4,8 GB). Repo herkese açıksa ya da açılacaksa bu bir lisans sorunu, çünkü kitaplar «açık repoda tutulmaz» koşuluyla verildi.
  - Çözüm: `git filter-repo` ile geçmişten silmek ve force push.
  - Bütün ekip yeniden klonlamak zorunda kalır, açık PR'lar etkilenir. Bu yüzden birlikte, PR'lar birleştikten sonra yapılmalı.
- **`design/ilk-prototip-kılıç-ali-pasa-düz-stil/`:**
  - 44 dosyası repoda;
  - `node_modules` ve `dist` (157 MB) diskte;
  - macOS ad biçimi farkı yüzünden git onu «izlenmeyen» olarak gösteriyor.
  - `git add -A` kullanılmasın; sahibi belli olunca karar verilsin.
