# Redmi 9T prototipi ve performans testi · v2

## v2 · 27 Ekim 2026: Ulucami v27 ve «Kubbeleri kaldır»

Bu klasör `test-redmi9t/` klasörünün kopyasıdır; **v1'e dokunulmadı** (v1 hâlâ Ulucami v26'yı açar). Çalıştırma aynı, yalnız yol farklı:
`bash docs/documents-context/design/test-redmi9t-v2/sunucu.sh` (v1 açıksa başka port: `… sunucu.sh 8081`).

Fikir, 42 İstanbul Şekerhan 3D görüntüleyicisinin kat açma animasyonundan uyarlandı: Ulucami tek katlı olduğu için katlar yerine **örtü kalkar**.

- **Model:** `eserler/ulu-cami/3d/export/ulu-cami_v27(_sunum).glb`. v26'da gövde dolu bir kutuydu; v27'de içi boş, içinde 12 paye + 14 duvar payesi, 31 sivri kemer, mihrap, minber ve 64 yazısız levha var (ayrıntı: `eserler/ulu-cami/3d/README.md`). Haritadaki konum v26 ile aynı.
- **Eser detayı · 3D:** sağ altta «İçini göster» düğmesi (yalnız kalkan parçaları olan modelde görünür; şimdilik Ulucami). Önce alemler ve şadırvan iskeleti, sonra 20 kubbe ve kasnaklar, en son çatı kalkar; iniş tersten. Kamera alçaksa içi görünsün diye 58°'ye yükselir. Kalkan parçalar dokunmaya kapanır.
- **Anlatım · 3D:** 5, 7, 8 ve 9. cümlelerde kubbeler kendiliğinden kalkar, diğerlerinde iner. Bu cümlelerde vurgu ve açı `hazirla.py` içindeki `IC_MEKAN` tablosundan gelir (5 → `Payeler`, 7 → `Ic_Sadirvan_Havuz`, 8 → `Levhalar`, 9 → `Minber`). `eserler/ulu-cami/icerik/hikaye.md` değişmedi; deneme onaylanırsa tablo oraya işlenir.
- **Levhalarda yazı yok.** Gerçek hat yazısı fotoğraf kartıyla gösterilir (cümle 8: «Vav harfi» kartı). Yapay zekâyla Arapça hat üretilmez.
- Kod değişiklikleri `app.js`'te `KALKAN`, `Sahne3D.kubbeler()`, `kalkanAdim()`, `[data-kubbe]` aramasıyla bulunur; `app.css`'te `.kubbe-dugme`.
- **Parça kartları (27 Ekim, 2. tur):** 3D'de bir parçaya dokununca büyük kart açılır: üstte yana kaydırılan fotoğraflar (noktalar kaçıncı fotoğrafta olduğunu gösterir), altta kendi içinde kayan metin, kaynak ve güven etiketi. Ses düğmesi metni tarayıcının Türkçe sesiyle okur, tekrar basınca durur; anlatım konuşuyorsa önce o susar. Kart ✕, arka plana dokunma ya da Esc ile kapanır. İçerik `parcalar/ulu-cami.md` (18 kart, modeldeki 31 parçanın hepsi bir karta bağlı); metinler yalnız envanter ve `eser.md` / `eser-hakkinda.md`'den, **taslak**: içerik sorumlusu onaylayınca `eserler/ulu-cami/icerik/` altına taşınır. Kartı olmayan parçada «henüz metin yok» kartı açılır.
- **Parmak düğmesi (28 Ekim, son hâli):** tıklanabilir parçalar tek renkte (sarı), her biri bir kez ve farklı zamanlarda yanıp söner; parçalar arası 90 ms, sıra dağınık (yan yana parçalar art arda yanmaz). Önceki çok renkli deneme kaldırıldı.
- **Anlatım kartları büyüdü (28 Ekim bir kademe daha):** mobilde ekranın ~%90'ı (en çok 380 px, fotoğraf 240 px), masaüstünde 520 px (fotoğraf 320 px); kart ekran dışına taşmaz, ok yine parçayı gösterir.
- **28 Ekim · eser ayarları veriden okunur (ölçeklenebilirlik):** prototipte artık esere özel kod yok.
  - «İçini göster / Dışını göster» düğmesi ve kalkan parça grupları: `eserler/<eser>/3d/model.json` → `ortu_gruplari` (yoksa düğme çıkmaz). Model sürümü de buradan (`glb`).
  - Anlatımda iç mekâna geçiş: `icerik/hikaye.md` → «İç mekân (3D)» sütunu (evet/hayır). Vurgu ve açı her zamanki gibi «Vurgu (3D)» sütunu ve açı tablosundan.
  - Parça kartları: `icerik/parcalar.md`. **Kartı olan parça tıklanır, kartı olmayan tıklanmaz**; parmak düğmesi yalnız tıklanabilir parçaları yakar. Eserin hiç kartı yoksa eski davranış (bütün parçalar adıyla) sürer.
  - Ulucami'de 17 kart, 27 tıklanabilir parça; kartlarda 33 fotoğraf (21'i 28 Ekim'de arşivden eklendi, `fotograflar.md` 15–35).
  - Masaüstünde düğme sağ alta alındı (üstteki Fotoğraf | 3D seçicisiyle çakışıyordu).
  - `_eski/`: 27 Ekim'deki taslak kart dosyası ve tek seferlik fotoğraf betiği; silinebilir.
- **28 Ekim · kodda esere, şehre ya da rotaya özel hiçbir değer yok.** `app.js` ve `hazirla.py` yalnız kuralları içerir; bütün değerler veriden gelir:
  - `eserler/<eser>/eser.json`: kimlik (ad, yıl, yaptıran, tür, ikon, rol, il, ilçe, konum, sıra) + kaynak notu. `hazirla.py` eserleri bu dosyası olan klasörlerden bulur; yeni eser = yeni klasör.
  - `eserler/<eser>/3d/model.json`: `glb`, `yaw` (haritada dönüş), `ana_parca` (haritada ortalanan parça), `kaydirma_m` (OSM'e oturtma, doğu/kuzey metre), `ortu_gruplari` («İçini göster»), `sunum_ek` (ad kuralına uymayan sunum parçaları, yalnız Koza Han).
  - `veri/sehir/bursa.json`: harita açılış noktası ve yakınlığı, fotoğraf künyesi, kaynakça. `veri/rota/*.json`: rotalar.
  - Önceki `ESERLER`, `OSM_DUZELTME`, `ROTALAR` (hazirla.py) ve `ANA_PARCA` (app.js) tabloları kaldırıldı; değerler birebir taşındı (v1 çıktısıyla karşılaştırıldı: konum, yön, kimlik aynı).
  - `sunucu.sh` paylaşacağı GLB'leri de `model.json` dosyalarından bulur (önceden 7 eserin yolu elle yazılıydı).
  - Bilinen sınırlar: rota ekranı ilk rotayı gösterir (`VERI.rotalar[0]`); `test.html` (performans testi) kendi eski listesini kullanır, v1'deki gibi.
- **28 Ekim · «Eser hakkında» Figma'daki gibi tam sayfa** (akar-yeni «D · Eser hakkında» 1:3130, «WF · Eser hakkında (uzun metin)» 1:6976). Masaüstünde harita ve sol panel gizlenir: solda yol (Eserler › eser), başlık, çipler (yıl, yaptıran, tür, il · ilçe), kapak, bölümler; sağda yapışkan «Bu eserde» kartı (Kısa anlatımı dinle · 3D'de gör · Kaynaklar). Mobilde üst çubuk (geri, «Eser hakkında», eser adı), kaydırılan metin, altta sabit «Kısa anlatımı dinle». Her bölümün altında baskın güven etiketi ve açılır «Kaynaklar (n)»; farklı güvenli paragrafın etiketi paragrafın altında.
  - İçerik: Ulucami'de **envanter metninin tamamı** (Cilt 1 PDF s.19–39, Türkçe, kitap sırasıyla, kelimesi değiştirilmeden; 69 paragraf). Çıkarma betiği `_araclar/envanter_metni_cikar.py` (diğer eserlere de aynı yolla uygulanır: PDF ve sayfa aralığı). Eski özet `eserler/ulu-cami/icerik/eser-hakkinda-ozet.md`.
  - Kitap listesi `veri/sehir/bursa.json` → `envanter_adi`, `envanter_yayinci` alanlarından.
- **28 Ekim · harita pinleri Figma'daki gibi** (akar-yeni «Harita pini» 1:544): sivri kemer, haritada 32 × 38; seçili 40 × 48 ve altın halka; hikâyesi biten eserde altın ✓ (cihazda `akar.bitti.<eser>`). Etiket `--primary`, 12 px. `app.js` → `KEMER_YOL`, `pinSvg`, `pinSeciliSvg`, `eserNoktalari`. Gizli hâl yok (veride alan yok).
- **28 Ekim · «Eser hakkında» (2. tur):** masaüstünde sağdaki «Bu eserde» kartı kaldırıldı; metin tek sütun ortada, en üstte «‹ <eser>» Geri düğmesi (eser detayına döner), yol satırı yanında; kitap listesi sayfa sonunda «Kaynaklar» bölümü. Figma «D · Eser hakkında» (1:3130) da aynı şekilde güncellendi.
- **28 Ekim · «Eser hakkında» okuma düzeni (3. tur):** kapak (fotoğraf, ad, okuma süresi) → üstte yapışık bölüm sekmeleri ve okuma çubuğu → her bölümde kapak fotoğrafı, «Kitaptan» özet cümleleri, rakam kartları (altında kitaptaki ifade), büyük alıntı, zaman çizelgesi ve «Derinine in» ile envanterin tam metni (tırnakla başlayan paragraflar kitabe kartı, fotoğraflar yana kaydırılan şerit, dokununca büyür; altı noktalı terime dokununca kitaptaki tanım) → sonda Hikâyeyi dinle · Geçmişi Gör · Bulmaca ve kaynaklar. Masaüstünde solda metin, sağda yapışık 3D: okunan bölümün açısına döner, ilgili parçalar parlar. Seçmeler `eserler/<eser>/icerik/eser-hakkinda-okuma.md`'de; `hazirla.py` her birinin kitap metninde birebir geçtiğini denetler, geçmeyeni atlar ve uyarı yazar. Dosyası olmayan eserde tam metin doğrudan görünür.
  - **Kitaptaki fotoğraflar:** `eserler/<eser>/icerik/kitap-fotograflari.md` (Ulucami: envanter Cilt 1 s.18–40'taki bütün fotoğraflar). `hazirla.py` → `kitap_fotolari`: her fotoğraf, kitapta kendi sayfasına kadar gelen son paragrafın arkasına konur; 3'ten fazlaysa ızgara. Kitabın fotoğrafları olan eserde ayrı kapak gösterilmez (ilk fotoğraf kapaktır).
- **28 Ekim · Geçmişi Gör · bugünkü eşler (A1b, Figma 89:2732 mobil / 97:3046 masaüstü).**
  - Dosyalar (eser başına, `eserler/<eser>/gecmisi-gor/`): `bugunku-esler.json` (ekibin seçtiği eşler, görseller `bugun/`), `izler.json` (İz Bırak katkıları, görseller `izler/`; `ornek: true` = ekipten örnek, arayüzde «Örnek katkı»). `gecmisi-gor.json`'a ve onu üreten `veri/fotoatlas/gecmisi_gor_uret.py`'ye dokunulmadı; o betik yalnız `gorseller/` ve json'u yazar.
  - Görseller: `_araclar/bugunku_es_uret.py` kayıttaki `kaynakDosya` + `kirpma`'dan üretir (asla asıl dosyaya yazmaz); WebP ayarları `gecmisi_gor_uret.py`'den okunur (uzun kenar 1600 / küçük 400, kalite 80 / 72). Kırpma oranı eski fotoğrafın oranıdır, yalnız bugünkü fotoğraf kırpılır.
  - Kural (`hazirla.py` → `gecmis_oku`): eski fotoğrafın admin eşi varsa `bugun` = o (`tur: admin`, «AKAR arşivi»); yoksa o fotoğrafa bağlı (`ayniAciFotoAtlasId`) onaylanmış en yeni iz (`tur: katki`). Onaylı izlerin hepsi ayrıca `e.izler`'de (ileride Yaşayan hafıza).
  - Arayüz: `bugun` varsa ana görsel kaydırıcı olur (solda eski, sağda bugün, «‹ ›» tutamağı; sürükleme, ←/→, Home/End; `role="slider"`, `aria-valuetext` «Eski %50»). Köşe etiketleri eski tarih / «Bugün · <kim>» (+ «Örnek katkı»); `aciBenzerligi: yakin` ise altında «Yakın açı» notu; kaynak satırı «· Bugünkü fotoğraf: …» ile uzar; şeritte eşi olan fotoğrafın türünün yanında küçük altın nokta (Figma'da yok; `title` + ekran okuyucu metni «bugünkü eşi var»). Kaydırıcı açıkken sayaç ve fotoğraf üstündeki «Kamerayı aç» gizlenir (Figma A1b'deki gibi; alt paneldeki düğme durur); mobilde sağa/sola kaydırma o fotoğrafta kaydırıcıyı taşır, fotoğraf değiştirmek için şerit kullanılır.
  - Ulucami'de eklenenler: **14286 Mihrap ← arşiv `ERD05161…` (admin eşi, yakin)**; **25044 İç görünüm ← arşiv `DJI_…0350…` (örnek katkı `iz-ulu-001`, AKAR ekibi, yakin; arşiv fotoğrafı, «örnek katkı olarak gösteriliyor»)**. Kontrol sayfası: `eserler/ulu-cami/gecmisi-gor/kontrol/eslesme.jpg`. Diğer 19 eski fotoğrafın eşi yok (gerekçeler: `docs/documents-context/yaptiklarim-2.md` §4).
- **Sınanan:** geliştirme bilgisayarında Playwright + SwiftShader, 390 × 800 (kaldır/indir, parçaya dokunma, anlatım 5–9; sayfa hatası yok). Görüntü: `eserler/ulu-cami/3d/kontrol/v27/tarayici_v2_akis.png`. **Redmi'de FPS henüz ölçülmedi.** İlk kaldırmada saydamlık için birkaç malzeme yeniden derlenir; telefonda kısa bir takılma olursa not edilmeli.

---


22 Ekim 2026. Bu klasörde iki sayfa var:

- **`index.html` · prototip.** Figma `akar-yeni`deki mobil (390 px) ve masaüstü (≥ 900 px) keşif, eser ve anlatım ekranlarının çalışan hâli; içerik gerçek (`eserler/*/icerik/`). Yönetim paneli yok.
- **`test.html` · performans testi** (21 Ekim). Yedi uygulama GLB'si haritada; tek model görüntüleyici, 10 sn FPS testi ve sonuç tablosu.

## Çalıştırma

Telefon ve bilgisayar aynı Wi-Fi'de olmalı. Bilgisayarda:

```bash
bash docs/documents-context/design/test-redmi9t/sunucu.sh
```

Betik önce `hazirla.py` ile içerik paketini üretir, sonra telefonda açılacak adresi yazar (`http://192.168.x.x:8080`; test sayfası `/test.html`). Telefonun Chrome'unda o adresi aç. Sayfa MapLibre ve three.js'i internetten (unpkg, jsDelivr) alır, telefonda internet olmalı; ilk açılış birkaç saniye sürebilir. Durdurmak için `Ctrl+C`.

Betik yalnız bu klasörün sayfalarını, harita stilini, 14 GLB'yi (7 normal + 7 sunum), `veri.json`'u ve küçültülmüş eser fotoğraflarını paylaşır; reponun başka dosyaları paylaşılmaz.

## İçerik paketi (`hazirla.py`)

- Altı eserin `icerik/hikaye.md` (cümle, fotoğraf, kart, vurgu, kaynak, güven + açı önerisi tablosu), `fotograflar.md` ve `eser-hakkinda.md` dosyalarını okur; Orhan Gazi Türbesi'nde yalnız fotoğraf ve «Eser hakkında» var.
- Kimlik bilgileri (ad, yıl, yaptıran) envanterden, betiğin başındaki `ESERLER` tablosunda. Rota: Hanlar Bölgesi Vakıf Yürüyüşü, 4 durak.
- Fotoğraflar `sips` ile uzun kenar 1280 px'e küçültülür; `.onbellek/` (Git dışında) ikinci çalıştırmada yeniden kullanılır. Elle: `python3 hazirla.py <klasör>`.
- **Haritada yerleşim düzeltmesi (`OSM_DUZELTME`):** 22 Ekim'de her model tepeden OSM bina sınırlarıyla karşılaştırıldı ve 1–11 m kaydırıldı (Ulucami 10,6 m doğuya, Bedesten 6,1 m doğu / 3,9 m güney …). Emir Hanı için seçilen OSM çokgeni başka bir binaydı; han uydu görüntüsünde ölçülüp konumu doğrudan yazıldı (eskisinin 48 m doğusu). Yedi modelin izi uydu görüntüsüyle karşılaştırıldı. Modelin **ana gövdesinin** ortası bu noktaya oturur (`app.js` `ANA_PARCA`: Koza Han'da `Govde_Dis`, Ulucami'de `Govde` …); İç Koza, avlu yapıları ve şadırvanlar kutuyu kaydırmaz.
- **Yön (`yaw`):** OSM yön açısı 90°'ye indirgendiği için 180° belirsiz kalır. Ulucami modelinde kuzey cephesi (taç kapı, minareler) +z'de, yani güneye bakıyordu; 22 Ekim'de 180° çevrildi (−6 → 174, `test.html` dahil).

## Prototipte neler var

- **Keşif haritası:** AKAR stili; OSM binaları 3D (harita eğikken), bizim modellerimiz gerçek konumlarında üstlerinde. Modellerin altında kalan OSM binaları çizilmez (aynı yapı iki kez görünmesin); modelden çok büyük olanlar (ör. Kapalıçarşı çatısı) kalır. Harita karoları bu bölgede binaları birleşik gruplar hâlinde verdiği için stilin `building_3d` katmanı kapalıdır; binalar tek tek ayrılıp `akar-bina-3d` katmanında aynı renk ve yükseklikle çizilir. Pine ya da modele dokununca eser kartı; Dinî / Su / Eğitim / Akar süzgeci; arama; 2D/3D, yakınlaştırma, konum.
- **Eserler ve Rotalar** (mobilde sürüklenebilir alt sayfa, masaüstünde sol panel); en alt durakta yalnız Eserler | Rotalar ve «Bursa ▾» satırı görünür; sayfa tutamaktan ya da bu başlıktan sürüklenir. Mobil eser kartı aşağı kaydırılınca kapanır. **Rota önizleme** (haritada çizgi ve yıldızlar, 4 durak, ilerleme).
- **Eser detayı:** Fotoğraf galerisi | 3D. 3D'de **sunum GLB'si** (zemin, ağaçlar, ölçek insanları) haritadaki yönle açılır (azimut 0 = kuzey); kadraj ve tıklanabilir parçalar yalnız yapının kendisidir (`Zemin*`, `Cevre*`, `Olcek*`, `Avlu_Agac`, `Avlu_Cim` hariç). Haritada normal GLB kalır. 3D'de parçaya dokununca parça hafif sarı olur ve adı yazılır (tekrar dokununca söner). Seçicinin yanındaki **parmak ikonlu düğme** tıklanabilir bütün parçaları çok soluk sarıyla hızlıca yakıp söndürür (fotoğraf görünümündeyse önce 3D'ye geçer).
- **Anlatım:** Dinle (tarayıcının Türkçe sesiyle, `speechSynthesis`) ve Oku (liste kaydırıldıkça sahne değişir). Fotoğraf görünümünde her cümlenin fotoğrafı; 3D görünümünde hikâyedeki açı (azimut, eğim, hedef), vurgu (altın) ve kart. İlerleme çubuğu, ✕ / Esc, Boşluk / ↓, hız 1–1,5x, ekranı doldur / sığdır.
- **Hikâye sonrası** ve **Eser hakkında** (paragraf başına güven etiketi ve kaynak).
- **Geçmişi Gör** (Figma A1, A2, «eski görüntü yok», «çekim yeri bilinmiyor» ve masaüstü W karşılıkları): Foto Atlas'tan eski fotoğraflar, tarih şeridi, kaynak satırı ve lisans; «Nereden çekildi?» haritasında çekim noktası ve görüş konisi (eserin fotoğrafları yeşil, diğerleri gri; noktaya dokununca o fotoğraf seçilir). Fotoğrafı olmayan eserlerde (Bedesten, Hamam, Emir Hanı) başka fotoğraflarda uzaktan göründüğü yerler listelenir. Giriş: eser detayındaki «Geçmişi Gör» bağlantısı ve hikâye sonrası. Veri: `eserler/<eser>/gecmisi-gor/` (hazirla.py `gg/` altına kopyalar).
- **Kamera (D) ve Çekildi (D2):** eski fotoğraf canlı görüntünün üstünde yarı saydam (kaydırıcıyla Eski ↔ Bugün; iki parmakla büyüt/kaydır), çekince Kaydırıcı | Yan yana karşılaştırma; iç mekân fotoğrafında «İç mekândasın» notu. Tarayıcı kamerayı yalnız https'te açar: telefonda yerel ağ adresinden (http) «Kameraya izin verilmedi» ekranı çıkar, «Galeriden seç» ile fotoğraf seçilip karşılaştırma yine denenebilir. Bilgisayarda `localhost` ile kamera çalışır. İz Bırak gönderimi prototipte yok.

## Bilinen sınırlar

- Ses, cihazın Türkçe TTS sesine bağlı; ses yoksa ya da `onend` gelmezse cümle tahmini süreyle ilerler. Gerçek ses dosyaları yok.
- Mesafe ve süre (~10 dk, 0,5 km) hesaptır; kullanıcının konumuna göre mesafe gösterilmez.
- Bugünkü eşi olan fotoğraf (A1b) şimdilik yalnız Ulucami'de, 2 tane (bkz. «Geçmişi Gör · bugünkü eşler»). İz Bırak gönderimi, Yaşayan hafıza, Profil ve giriş ekranları prototipte yok; izler yalnız veriden okunur.
- `test.html` eski yerleşimi (kutu ortası, düzeltmesiz OSM noktası) kullanır; yalnız performans ölçümü içindir.

## Performans testi (`test.html`)

1. Haritayı kaydır, yakınlaştır (yapılar zoom 14,5'ten itibaren görünür) ve «Eğik harita» ile yatır; sol üstteki «Harita FPS»e bak. «Yapılar: kapalı» ile aynı hareketi yapısız dene; fark, 7 yapının (~199 bin üçgen) haritaya maliyetidir.
2. Bir pine dokun. Parmakla döndür, iki parmakla yakınlaştır.
3. «10 sn test»: kamera 10 saniye döner; ortalama, %1 düşük ve en düşük FPS yazılır. Ortalama 50 üstü iyi, 25–50 sınırda, 25 altı zayıf.
4. Aynı modeli **Yapı** ve **Sunum** ile dene; piksel oranını ve kenar yumuşatmayı değiştir.
5. «Sonuçlar» → «Kopyala»: cihaz bilgisi ve bütün ölçümler tek metin olarak kopyalanır.

**Işık seçici** (yeni palet · yumuşak · açık · canlı · koyu) yalnız test sayfasında; varsayılan «yeni palet» prototip ve frontend'in başlangıç değeriyle aynı (`FRONTEND_BACKEND_NOTLARI.md` §9). Her iki sayfa da geliştirme bilgisayarında SwiftShader (yazılımsal GPU) ile sınandı: işlev doğru, FPS değerleri telefonu temsil etmez.

## Zemin titremesi (z-fighting) düzeltmesi · 28 Ekim 2026

**Sorun:** Detay 3D'de kamera dönünce zemin dokusu yer yer kaybolup geri geliyordu (en çok Koza Han).
**Neden (model):** Zemin yüzeyleri üst üste ve yalnız 2–6 mm arayla duruyor. Koza Han'da kaide 0, sokak döşemesi 2,3 cm, avlu 2,8 cm, İç Koza kaldırımı 2,9 cm, halka 5 cm. Uzaktan bakınca derinlik tamponunun bir adımı 5–10 mm. GPU iki yüzeyden hangisinin önde olduğunu ayırt edemiyor. Draco sıkıştırması da yükseklikleri yaklaşık 7 mm'lik adımlara yuvarlıyor; bu yüzden birkaç mm'lik fark kaybolabiliyor, hatta sıra ters dönebiliyor.
**Aynı durum:** Koza Han, Orhan Gazi Türbesi, Bedesten, Orhan Bey Camii ve Ulucami avlusu (az). Emir Han ve Orhan Bey Hamamı'nda yok.
**Düzeltme (app.js, esere özel değil):**
- `zeminKatmanlari()` tabanda duran ince mesh'leri bulur (üstü 40 cm'den alçak, kalınlığı 35 cm'den az).
- Bunları üst yüzlerinin ortalama yüksekliğine göre sıralar.
- Üstteki katmana `polygonOffset` verir; böylece sıra her açıdan aynı kalır.
- Ayrıca kamera `near` = yarıçap/100 yapıldı (önceden /200). Bu, derinlik çözünürlüğünü yaklaşık iki katına çıkarır.
**Model kuralı (bundan sonra):** Üst üste binen zemin katmanları arasında en az **3 cm** olsun. Bu fark Draco adımından büyük, ölçekte de görünmez.

## Bulmaca, saha görevi, rozetler ve profil · 28 Ekim 2026

**Veri:** `eserler/<eser>/icerik/gorevler.json`. Dosya yoksa eserde bulmaca görünmez; «Bulmaca»ya dokununca «görev henüz hazırlanmadı» der. Kodda esere özel değer yok. `hazirla.py` dosyayı `e.gorevler` ve `e.rozetler` olarak `veri.json`'a koyar. Rozet olmayan bir göreve bağlıysa hazırlık durur.

- **Görev türleri:**
  - `soru`: 4 şık ve iki kademeli ipucu. Yanlışta sıradaki ipucu açılır. «Cevabı göster» doğru şıkkı seçer; rozet için yine «Cevapla»ya dokunmak gerekir.
  - `saha`: iki yolu var. **Yerindeysen:** «Buradayım», konumla eserin `lat/lon`una `konum_yaricap_m` içinde olmalı; yalnız https'te çalışır. **Evdeysen:** 3D modelde doğru parçaya dokunulur (`evden.parca`); o parçanın kartını paylaşan parçalar da kabul edilir.
- **Rozet koşulları:** `{"hikaye_bitti": true}` ya da `{"gorev": "<görev id>"}`. Rozet kazanılınca üstte bildirim çıkar (Figma 1:6181).
- **Ekranlar:** `#/gorev/<eser>/<sıra>` ve `#/profil` (avatara dokununca açılır).
  - Mobilde Figma «WF · Bulmaca» 1:7147, «/ Doğru» 1:7169, «/ Yanlış» 1:7204.
  - Masaüstünde «D · Bulmaca» 1:3292 (koyu perde üstünde modal).
  - Profil: «WF · Profil» 1:7372 ve «D · Profil» 1:3591. Keşfettiklerim ve Rozetler gösterilir.
- **İlerleme:** Bu cihazda (`localStorage`) tutulur: `akar.gorev.<id>` = `evden` | `yerinde`, `akar.rozet.<id>` = tarih. Profilde «Bu cihazdaki ilerlemeyi sil» var; demo öncesi sıfırlamak için.
- **Bilerek yok:** puan, süre, seviye, cezalandırma, cami içinde görev.
- **Üründe:** İlerleme `kullanici_ilerleme` tablosuna gider. Misafirken biriken ilerleme girişten sonra hesaba taşınır.

## Küre ve şehirler · 28 Ekim 2026

- **MapLibre 4.7 → 6.15:** Ürünle (`apps/web`) aynı sürüm. 6.x yalnız ES modülü olarak geliyor; `index.html`'deki import map'te `maplibre-gl` adıyla yükleniyor, `app.js` en üstte `import * as maplibregl from 'maplibre-gl'` ile alıyor. `test.html` (performans testi) 4.7'de kaldı, ona dokunulmadı.
- **3D katman:** 5. sürümden beri özel katmanın `render(gl, girdi)` ikinci parametresi bir nesne. Matris `girdi.defaultProjectionData.mainMatrix`. Küre, geçiş sürerken `fallbackMatrix`'e düşer. Modeller zoom 14,5'in altında zaten çizilmiyor; bu yakınlıkta küre tamamen düz haritaya dönmüş oluyor.
- **Küre:** `stil.projection = { type:'globe' }` ve hafif bir gökyüzü/atmosfer (`stil.sky`; atmosfer yalnız zoom 8'in altında). `minZoom` 6 → 1,2. Şehir ölçeğinde görüntü değişmedi.
- **Şehirler:** Zoom 9'un altında eser pinleri gizlenir; bunların yerine `veri/sehir/*.json`'daki şehirler görünür.
  - Eseri olan şehirde altın nokta ve «n eser» yazar; dokununca o şehre uçar.
  - Eseri olmayan şehirde gri nokta ve «Yakında» yazar; dokununca envanter yılı ve eser sayısı gösterilir.
  - Zoom 3,2'nin altında yalnız eseri olan şehrin adı kalır, ötekiler nokta olur (etiketler üst üste binmesin).
  - Mobilde «Bursa ▾», masaüstünde üst çubuktaki «Bursa» düğmesi haritayı şehirlere uzaklaştırır.
- **Şehir verisi:** `veri/sehir/` dosyaları: Bursa (`varsayilan: true`, harita burada açılır), Hatay, Konya, Kütahya. Envanter yılı ve eser sayıları KÖK&KOD envanter bilgi notundan. Konum yaklaşık il merkezi; yalnız işaret için. Bir şehre eser eklenince (`eser.json` → `il`) işareti kendiliğinden «n eser» olur. Kodda şehre özel değer yok.
