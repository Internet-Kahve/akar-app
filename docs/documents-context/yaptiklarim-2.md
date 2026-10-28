# Yaptıklarım · 2

*28 Ekim 2026'da başladı. Her iş bittikçe sırayla en alta eklenir.*

## 1. Seçili pin Figma'yla aynı yapılıyor (test-redmi9t-v2)

- Başlangıç durumu: `test-redmi9t-v2/app.js` içinde seçili pin (`pin-secili` katmanı), normal pinin aynısı, yalnız 1,25 kat büyük (`icon-size: 1.25`). Ayrı bir görünümü yok.
- Figma'da bakılan yer: `akar-yeni` (`HGTgq5vRXVqhVO9TcR9wBe`) → «Harita pini» bileşeni (1:544), «Durum=Seçili» (1:548). Figma notu: «Seçili: 1,25×, altın halka». Çizim: sivri kemer gövde (rol rengi), 2 px beyaz kenar, onun dışında 2 px altın halka (#C9A13B, `--gold`), ikon 20 px.
- Yapılan (`design/test-redmi9t-v2/app.js`):
  - `KEMER_YOL` (Figma'daki kemer yolu, birebir) ve `pinSeciliSvg()` eklendi. Altın halka, kemerin altına 6 px kalınlıkta çizilip üstüne beyaz kenarlı gövde konarak yapıldı (Figma'daki katman düzeni aynı).
  - Haritaya her ikon için ayrı `pin-secili-<ikon>` resmi yükleniyor; `pin-secili` katmanı artık bunu kullanıyor.
  - Boyut: normal pinin 1,25 katı (zoom 14'te 40 × 48 = Figma'daki ölçü, zoom 17'de 50 × 60). Kemerin ucu, normal pinin ucuyla aynı noktaya otursun diye `icon-offset` [0, 3.6].
- Kontrol: yeni seçili pin ile Figma'nın SVG çıktısı yan yana çizildi, biçim, halka ve ikon yeri aynı. Redmi'de / tarayıcıda harita üstünde henüz bakılmadı.
- Açık konu: haritadaki **normal** pin hâlâ eski damla biçiminde; Figma'da normal pin de sivri kemer (1:545, 32 × 38). Seçilince pin biçim değiştiriyor. İstenirse normal pin de Figma'ya çevrilir.

## 2. Haritadaki bütün pinler Figma'ya çevrildi (test-redmi9t-v2)

- İstek: «Figma'ya tamamen uygun hâle getir». Kaynak: akar-yeni «Harita pini» (1:544) ve dört hâli; ekran örneği «D · Keşif / Eser seçili» (1:2191).
- `app.js`:
  - Eski damla pin (`PIN_YOL`) kaldırıldı. Bütün pinler Figma'daki sivri kemer (`KEMER_YOL`), 2 px beyaz kenar, ikon 20 px (`kemerSvg`).
  - **Normal:** haritada sabit 32 × 38 (`icon-size: 0.8`; önceden zoom'la 0,8 → 1 büyüyordu, Figma'da sabit).
  - **Seçili:** 40 × 48 (normalin 1,25 katı), altın halka. Ucu normal pinin ucuyla aynı noktada (`icon-offset` [0, 2]).
  - **Tamamlandı (yeni):** sağ üstte altın daire içinde beyaz ✓ (Figma 1:552). Hikâye sonuna kadar dinlenince cihazda `akar.bitti.<eser>` = 1 yazılır ve pin hemen ✓'li çizilir (`bittiMi`, `eserNoktalari`, `hikayeBitti`).
  - **Etiket:** Figma kuralına göre pinin sağında, `--primary` (#25477B) rengi, 12 px. Önceden rol rengindeydi, 13 px. Yazı kalınlığı: Figma'da 500, haritanın yazı tipi sunucusunda «Noto Sans Medium» olmadığı için Bold kaldı.
- Kontrol: üç hâl Figma'nın SVG çıktılarıyla yan yana çizildi, biçim, halka, ✓ ve ikon yerleri aynı. Harita üstünde tarayıcıda henüz bakılmadı.
- Yapılmayan: **Gizli** hâli (1:558, «yakına gelince açılır»). Veride gizli eser alanı yok; gizli durak verisi gelince eklenir.

## 3. «Eser hakkında» sayfası: «Bu eserde» kartı kaldırıldı, Geri düğmesi, kitaptaki fotoğraflar

İstek: D · Eser hakkında'daki «Bu eserde» kartı gereksiz; kart kalksın, Geri düğmesi olsun; Figma da test prototipi de güncellensin; fotoğraflar eksik, envanter PDF'iyle karşılaştırılıp eksik fotoğraf ve metinler tamamlansın.

### 3a. Figma (akar-yeni «D · Eser hakkında» 1:3130)
- «Bu eserde» kartı (YanKolon 1:3181; Dinle, 3D'de gör, Kaynaklar) silindi. Metin sütunu (720 px) sayfada ortalandı (x 200 → 360).
- En üste **Geri düğmesi** eklendi: «‹ Ulucami» (216:2781). Dosyadaki kurala göre düğme gideceği yeri yazar («‹ Eser»). Zemin `--primary-light` (çip/ikincil buton), yazı ve ikon `color/primary`, chevron-left 18 px, hap biçimi. Yol satırı (Eserler › Ulucami) düğmenin sağında kaldı.
- Tarihçe paragraflarının arasına **kitaptaki yerinde fotoğraf** örneği eklendi (216:2785, 720 × 300) ve altına künye satırı (216:2787: «… · Bursa Vakıf Eserleri Envanteri, Cilt 1, s. 20»). Kural: fotoğraflar kitaptaki sırayla, ait oldukları paragrafların arasında durur.
- Çerçeve yüksekliği 1040 → 1394.

### 3b. Metin kontrolü (PDF ile)
- `veri/kaynak_pdf/bursa-envanteri-cilt-1.pdf` s.18–40 yeniden çıkarıldı (`_araclar/envanter_metni_cikar.py`) ve `eserler/ulu-cami/icerik/eser-hakkinda.md` ile paragraf paragraf karşılaştırıldı: **PDF'teki 69 Türkçe paragrafın 69'u da dosyada, kelimesi kelimesine aynı.** Fazladan tek paragraf «Vakıf ve akar» (bilerek Bedesten sayfasından alınmış). Metin eksiği yok.
- Bu sayfalarda görsel altı yazısı yok (sayfadaki bütün yazı Türkçe/İngilizce gövde metni ve sayfa numarası).

### 3c. Fotoğraflar (PDF ile karşılaştırma)
- PDF s.18–40'ta (Ulucami kaydı) **119 fotoğraf** var. «Eser hakkında» sayfasında önceden yalnız 1 kapak fotoğrafı vardı.
- Her kitap görseli `veri/bursa-foto/` arşiviyle eşleştirildi: önce Ulucamii Klasörü (tam kare benzerliği + kırpıntı araması), sonra arşivin tamamı (1.944 dosya). Bütün adaylar yan yana açılıp **gözle** kontrol edildi.
  - **90** fotoğraf arşivde bulundu → arşivden (2400 px'lik kopyadan) alındı. 13'ü galeride zaten vardı (`01_…`, `17_…` gibi; yeniden kopyalanmadı).
  - **29** fotoğraf arşivde yok (diğer klasörlerde de çıkmadı; büyük olasılıkla zip'lerdeki açılmamış `.psd`'ler) → kitaptan, sayfada görünen kesitiyle birebir alındı (220 dpi).
  - Yeni dosyalar: `eserler/ulu-cami/icerik/foto/kitap/` (97 dosya, uzun kenar 1280 px, ~30 MB).
- Veri: `eserler/ulu-cami/icerik/kitap-fotograflari.md` (dosya, asıl dosya, kitap sayfası, kitaptaki en/boy oranı, eşleşme türü). **Alt metinler geçici** (yalnız sayfa numarası); içerik sorumlusu yazmalı.

### 3d. Prototip (test-redmi9t-v2)
- `hazirla.py` → `kitap_fotolari()`: her fotoğrafı, kitapta kendi sayfasına kadar gelen son paragrafın arkasına koyar.
- `app.js` / `app.css` («Eser hakkında»):
  - Masaüstünde «Bu eserde» kartı kaldırıldı. Metin tek sütun ortada. En üstte «‹ Ulucami» Geri düğmesi (eser detayına döner), yanında yol satırı. Kitap listesi sayfa sonunda «Kaynaklar» bölümü.
  - Fotoğraflar kitap sayfası başına gruplanır: 1–3 fotoğraf alt alta (kitaptaki oranıyla), 4–8 iki sütun, 8'den çok (s.32: 38 levha, s.37: 24) küçük ızgara. Altında künye («Envanter Cilt 1 · s. 32»).
  - Kitabın fotoğrafları olan eserde ayrı kapak gösterilmez (ilk fotoğraf s.18'deki besmele levhası).
  - Mobil üst çubuk ve altta sabit «Kısa anlatımı dinle» düğmesi aynı kaldı.
- Sınama (Playwright + Chromium, yerel sunucu): masaüstü 1440 × 900 ve mobil 390 × 800 görünümlerinde 119 fotoğrafın hepsi yükleniyor, bozuk görsel yok, sayfa hatası yok, kart yok. Geri düğmesi `#/eser/ulu-cami`'ye dönüyor. Redmi'de bakılmadı.

## 4. Ulucami · Geçmişi Gör: bugünkü eşler (A1b kaydırıcısı) ve örnek İz Bırak katkısı

### 4a. Eşleştirme (gözle; bütün eski fotoğraflar ve 111 arşiv fotoğrafı tarandı)
Arşiv kopyalarında EXIF/GPS yok; karar yalnız gözle verildi. Kural: «ayni» = nokta ve yön gözle aynı; «yakin» = yükseklik/mercek/yön belirgin farklı; daha uzaksa eklenmedi.

**Eklenenler (2):**
- **14286 Mihrap (1875–84) ← `ERD05161-Geliştirilmiş-NR kopya-2.jpg` · admin eşi · yakin.** İkisi de mihrabı önden çekiyor; eski biraz daha yakından ve hafif soldan, bugünkü tam eksende ve uzaktan. Kırpma (398, 600, 904 × 1150) = eskinin oranı (0,786).
- **25044 İç görünüm (tarih bilinmiyor) ← `DJI_20241210051038_0350_D_ODAK-2.jpg` · örnek katkı (`iz-ulu-001`) · yakin.** Aynı eksen: havuz, iki paye arası, arkada mihrap; eski yerden, bugünkü kuzey mahfilinden (daha yüksek). Kırpma (500, 380, 1400 × 1170) = eskinin oranı (1,197).

**Bakılıp eklenmeyenler:**
- **14276 Minber:** Eskide minber köşkü solda, minbere doğu yanından bakılıyor. Arşivdeki üç adayda da (`ERD04998`, `ERD04999`, `…0173` müezzin mahfili merdiveni) minberin öbür yanı ya da başka nesne var. Yakın bile değil.
- **14290 / 15226** (aynı fotoğrafın iki baskısı) **ve 41844:** Havuz ve mihrap aynı konu, ama göz hizasından ve eksen dışından. Tek uygun aday `…0350`; o 25044'e verildi, aynı fotoğraf dördüne verilmedi. `ERD05081` havuzu öbür yandan, kapı duvarına bakarak çekmiş. `…0339`, `…0371`, `…0325`, `…0334` havuzu ya da mihrap eksenini göstermiyor.
- **69125 Avlu:** Eskide göz hizası, solda hemen yakında cami duvarı ve minare. `ERD04721`, `ERD04751`, `ERD04829`, `ERD04845` şadırvanları başka yönden gösteriyor, cami duvarı kadrajda değil.
- **47954 Güneyden, 42727 Caddeden:** Eskiler yerden ve uzaktan cepheye bakıyor. Tek cephe adayı `…0291` dronla, yakından ve çok eğik açıyla çekilmiş. Cadde hizasından çekilmiş aday yok.
- **Tepeden şehir görünümleri** (49845, 14239, 15211, 13048, 66080, 34618, 47170, 65141, 65438, 65824): Eskiler yüzlerce metre uzaktaki tepelerden (ör. 14239 yaklaşık 390 m, yön 143°) çekilmiş. Dron fotoğrafları (`…0387`, `…0417`, `…0510`, `…0590`, `…0088`, `…0122`, `…0133`) caminin dibinden, çok daha yüksekten, çoğu tam güneye bakarak çekilmiş. Yön, uzaklık ve yükseklik birlikte farklı.
- **65534, 65828** (Atatürk Caddesi, kalabalık / kar): Cadde hizasından çekilmiş aday yok.

**Örnek katkı:** `izler/_ham/` klasöründe ekip çekimi yoktu. Bu yüzden arşiv fotoğrafı kullanıldı: `kullanici` «AKAR ekibi», `ornek: true`, kaynak satırı «Fotoğraf: Bursa Vakıf Eserleri Envanteri (örnek katkı olarak gösteriliyor)». Uydurma kişi adı yok. Fotoğrafta insan yok. Bağlı olduğu 25044'ün admin eşi yok; böylece «admin eşi yoksa onaylı katkı» kuralı ekranda görünüyor. Ekipten biri o noktadan gerçekten çekerse `izler/_ham/`'a konup bu kaydın görseli değiştirilmeli.

### 4b. Dosyalar
- Yeni veri: `eserler/ulu-cami/gecmisi-gor/bugunku-esler.json`, `izler.json`, `bugun/es-14286(.webp, _k.webp)`, `izler/iz-ulu-001(.webp, _k.webp)`, `kontrol/eslesme.jpg`.
- Yeni araç: `design/test-redmi9t-v2/_araclar/bugunku_es_uret.py` (görselleri `kaynakDosya` + `kirpma`'dan üretir; WebP ayarlarını `gecmisi_gor_uret.py`'den okur: 1600 / 400, kalite 80 / 72).
- Değişen: `design/test-redmi9t-v2/hazirla.py` (`gecmis_oku` → `bugun`; `izler_oku` → `e.izler`; `gg_liste`, `gg_kopyala`), `app.js` («Geçmişi Gör» kaydırıcısı: `ggKarsilastir`, `ggAyrim`, `ggKaydirma`), `app.css` (`.gg-foto.esli`, `.gg-k-*`, `.gg-yakin`, `.gg-bugunu-var`, `.gizli-metin`), `BENIOKU.md`.
- Dokunulmayan: `gecmisi-gor.json`, `gorseller/`, `gecmisi_gor_uret.py`, v1 (`test-redmi9t/`), `apps/`, `services/`, arşivdeki asıl dosyalar. Kodda esere özel değer yok.

### 4c. Sınama (Playwright + Chromium, `sunucu.sh 8081`)
- Mobil 390 × 844 ve masaüstü 1440 × 900, 14286 ve 25044: kaydırıcı açılıyor; etiketler «1875–84» / «Bugün · AKAR arşivi» ve «Tarih bilinmiyor» / «Bugün · AKAR ekibi · Örnek katkı»; «Yakın açı» notu görünüyor; kaynak satırı «· Bugünkü fotoğraf: …» ile uzuyor; bugünkü görselin alt metni «Bugünkü görünüm: <başlık>».
- Klavyede ← iki kez «Eski %40»; sürükleme %30.
- Masaüstünde ilk denemede sürükleme kesiliyordu (tarayıcının resim sürükleme davranışı). `preventDefault` ve `-webkit-user-drag:none` ile düzeltildi.
- Eşsiz fotoğraf (49845) ve Koza Han ekranı değişmedi. Konsolda hata yok. Redmi'de bakılmadı.

## 5. Geçmişi Gör: son fotoğrafta sayfanın yana kayması ve büyük fotoğrafın boyu (test-redmi9t-v2)

- **Kayma:** Şeritte bir fotoğraf seçilince kod onu `scrollIntoView` ile ortalıyordu. Bu, şeridin yanında sayfa kabını da yana kaydırıyordu (mobilde `.gg-kaydir` 143 px, masaüstünde `.gg-d` 210 px; son fotoğrafta kenarda boşluk). Yeni `ggSeritOrtala()` yalnız şeridin kendisini kaydırıyor (azaltılmış hareket tercihinde animasyonsuz). Ayrıca iki kaba `overflow-x:hidden` kondu. Sınama: son fotoğrafta hiçbir kap yana kaymıyor (mobil ve masaüstü).
- **Büyük fotoğraf:**
  - Masaüstü: kutu 941 × 528 → 976 × 610 (`min(700px, 100vh − 290px)`; sağ kart 375 → 340 px).
  - Mobil: kutu artık fotoğrafın kendi oranında (en az 240, en çok 500 px). Dikey fotoğraflar 374 → yaklaşık 450 px boyunda. Yatay fotoğraflarda üst ve alttaki bulanık bant kalktı. Genişlik ekrana bağlı (358 px), o yüzden yatay fotoğrafın kendisi büyümedi. İlk denemede çok yatay fotoğraf kutuyu 383 px'e genişletip taşırıyordu; yükseklik genişlikten hesaplanınca düzeldi. Harita açıkken kutu eskisi gibi 190 px.
- Kaydırıcı (A1b), eşsiz fotoğraf ve Koza Han testleri yeniden geçti; konsolda hata yok.

## 6. Mobil «Eserler | Rotalar» sayfası: serbest yükseklik ve listeden esere gitme (test-redmi9t-v2)

- **Serbest yükseklik:** Sayfa bırakılınca en yakın üç duraktan birine (en alt / %55 / %92) oturuyordu. Artık parmağın bırakıldığı yükseklikte kalıyor; yalnız en alta ya da en üste 48 px'ten yakınsa oraya oturuyor. `altYukseklik()` durak adının yanında sayı da alıyor (ekran yüksekliğine oran), böylece eser kartı kapanınca sayfa bırakılan yüksekliğe geri dönüyor. Tutamağa dokunmak eskisi gibi en alt ↔ yarım arasında geçiş yapıyor.
- **Listeden esere gitme:** Mobilde listedeki bir esere dokunmak eser sayfasını açıyordu. Artık masaüstündeki gibi harita esere gidiyor, pin seçiliyor ve alttaki kısa eser kartı çıkıyor (pine dokunmakla aynı). Eser sayfasına karttan geçiliyor.
- Sınama (390 × 844, dokunmatik olaylarla): 335, 555 ve 205 px'te bırakılan sayfa orada kaldı; üste ve alta yakın bırakınca kenara oturdu. Koza Hanı satırına dokununca adres değişmedi, harita Koza Hanı'na gitti, kart açıldı. Konsolda hata yok.

## 7. Harita 2D/3D ve kuzey düğmesi Figma'daki HaritaDaire'ye eşlendi (test-redmi9t-v2)

- Figma: `HaritaDaire` bileşen seti (1:760), üç hâl × iki boyut: Düz (beyaz, «3D» yazar), Eğik (#E8EDF7, «2D»), Dönük (halka bearing kadar dönük). Mobil 44 px, masaüstü 72 px.
- Eski düğme: etiket o anki modu yazıyordu (Figma'nın tersi), halka ve kuzey üçgeni yoktu, «K» harfi `translateY(-15px)` yüzünden düğmenin dışına kayıyordu, dönük hâl ve kuzeye döndürme yoktu.
- Yeni görünüm (`index.html`, `app.css`): gri halka (mobil 3 px, masaüstü 6 px), kırmızı kuzey üçgeni (#C74033; mobil 6 × 8, masaüstü 8 × 12), yalnız masaüstünde halkanın içinde gri «K» (9 px), etiket Inter 600 13 / 17 px --primary, gölge 0 2 8 %16. Eğikken zemin #E8EDF7. Halka `rotate(-bearing)` ile döner, etiket dönmez.
- Davranış (`app.js`, `daireCiz()`), Figma açıklamasına göre:
  - Basınca düz ↔ eğik: `{pitch:60, bearing:-20}` ↔ `{pitch:0, bearing:0}`.
  - Kullanıcı haritayı kendisi döndürdüyse (mobilde iki parmak, masaüstünde sağ tık ya da halkayı sürükleme) ilk basış yalnız kuzeyi yukarı getirir; ikinci basış modu değiştirir.
  - Masaüstünde halka fareyle sürüklenerek döndürülür (4 px'ten az hareket tıklama sayılır).
  - `aria-label` hâle göre değişir: «3D haritaya geç», «2D haritaya geç», «Kuzeyi yukarı getir».
- Sınama (390 × 844 ve 1440 × 900): başta eğik «2D» → bas: düz «3D» → bas: eğik «2D» → döndür: halka döndü, etiket «Kuzeyi yukarı getir» → bas: bearing 0, eğim korundu → bas: düz. Masaüstünde halkayı saat yönünde 90° sürükleyince harita 90° döndü. Konsolda hata yok.

## 8. Mobilde düğmeyi çevirerek döndürme ve eser ekranında 3D'de uzaklaştırma (test-redmi9t-v2)

- **Düğmeyle döndürme mobilde de:** Halka sürükleme yalnız masaüstündeydi (Figma açıklamasında mobilde döndürme iki parmakla). Kullanıcı isteğiyle mobilde de parmakla halkayı çevirince harita dönüyor (`touch-action:none` zaten vardı). Bir hata da düzeldi: dokunmada sürüklemeden sonra `click` gelmediği için «sürüklendi» bayrağı açık kalıyor, sonraki ilk dokunuş boşa gidiyordu; bayrak artık her `pointerdown`'da sıfırlanıyor. Figma açıklaması değiştirilmedi.
- **3D'de uzaklaştırma:** Eser ekranında (3D) iki parmakla uzaklaştırma hiç çalışmıyordu. Sebep: dar telefon ekranında yapının sığması için gereken uzaklık (Ulucami'de yaklaşık 6R) OrbitControls'un `maxDistance` sınırını (4R) aşıyordu; kamera açılışta zaten sınırdaydı. Şimdi `aci()` içinde `maxDistance = max(4R, sığdırma uzaklığı × 1,6)`. Açılış kadrajı eskisi gibi kalsın diye başlangıç uzaklığı en çok 4R (önceden de fiilen buydu).
- Sınama (390 × 844, dokunmatik olaylarla): halkayı çeyrek tur çevirince harita −12° → −102° döndü, sonraki dokunuş kuzeyi yukarı getirdi. Ulucami 3D: parmakları yaklaştırınca model belirgin biçimde uzaklaştı, açınca yakınlaştı. Masaüstü düğme testi yeniden geçti. Konsolda hata yok.

## 9. Mobil eser detay kartı küçültüldü (test-redmi9t-v2)

- Kart yaklaşık 300 px'ten 190 px'e indi (390 × 844'te üst kenarı 642 px'te); 3D'de ve fotoğrafta görünür alan o kadar büyüdü (3D kadrajı ve galeri yüksekliği kartın boyunu zaten ölçüyor).
- Değişenler (`app.js` `eserBilgi` mobil dalı, `app.css` `.eser-alt*`):
  - Başlık 32 → 26 px, meta 13 px, süsleme boşluğu 14/12 → 8/8, kart iç boşluğu 20/16/16 → 14/16/10, Dinle/Oku 48 → 44 px.
  - «Yapının hikâyesi · 12 bölüm» ayrı satırı kalktı; bölüm sayısı meta satırına eklendi («1399 · Yıldırım Bayezid · 12 bölüm»).
  - «Geçmişi Gör · 21 fotoğraf ›» ve «Sonraki: Bedesten →» tek satırda; tam genişlikli «Sonraki durak» düğmesi metin bağlantısına döndü. Uzun eser adı «…» ile kısalıyor, `aria-label` tam adı söylüyor.
- Masaüstü paneli değişmedi.
- Sınama: Ulucami (3D) ve Koza Hanı (fotoğraf) — satır taşmıyor, konsolda hata yok.

## 10. Mobil eser kartı: yalnız ad + Dinle | Oku; «Sonraki durak» yalnız rotada (test-redmi9t-v2)

- **Mobil kart:** Yalnız eser adı ve Dinle | Oku kaldı (118 px). Meta satırı, süsleme, «Geçmişi Gör» bağlantısı ve sonraki durak kaldırıldı (9. bölümdeki tek satır düzeni ve `.sonraki-link`/`.eser-alt-son` stilleri silindi). Not: mobilde «Geçmişi Gör» ve «Eser hakkında»ya artık yalnız Hikâye sonrası ekranından gidiliyor.
- **Sonraki durak yalnız rotada:** Yeni `durum.rotada` bayrağı. «Rotayı başlat / Devam et», «Evden gez» ya da bir «Sonraki durak» düğmesi (`data-rotada`) ile gelince açılır; haritaya (`#/`) dönünce kapanır. `sonrakiDurak()` bayrak kapalıyken boş döner; bu yüzden listeden, pinden ya da doğrudan adresle açılan eserde (mobil kart, masaüstü panel, Hikâye sonrası) sonraki durak ve «Rota tamamlandı · Rotaya dön» görünmez. Rotadayken mobil kartta Dinle | Oku'nun altında tam genişlikte «Sonraki durak: …» (170 px).
- Sınama (mobil ve masaüstü): doğrudan açılan Ulucami'de düğme yok → Rotayı başlat: «Sonraki durak: Bedesten» → ona basınca Bedesten'de «Sonraki durak: Koza Hanı» → haritaya dönüp Bedesten'i açınca düğme yok. Konsolda hata yok.

## 11. Mobil eser detayı: sürüklenen kart, Hakkında · Geçmiş · Bulmaca kısayolları (test-redmi9t-v2 + Figma)

- **Amaç:** Masaüstünde sağ panelde her şey tek yerde (Dinle/Oku, Eser hakkında, Geçmişi Gör, Bulmaca). Mobilde aynısı, haritadaki «Eserler | Rotalar» kartı gibi sürüklenen bir alt kartla.
- **Kapalı (170 px):** tutamak, ad, Dinle | Oku, altında üç kısayol: Hakkında (`#/hakkinda`), Geçmiş + eski fotoğraf sayısı (`#/gecmis`), Bulmaca. Rotadaysa altında «Sonraki durak» (222 px).
- **Açık:** Tutamak ya da başlık yukarı sürüklenir; bırakılan yükseklikte kalır, kenara 40 px'ten yakınsa oturur; tutamağa dokunmak (ya da klavyede Enter/Boşluk) kapalı ↔ tam açık. Açılınca altta tarih · yaptıran, süsleme, kısa açıklama, bölüm sayısı. En çok içerik kadar ya da ekranın %75'i (Ulucami'de 300 px); taşarsa kart içinde kayar.
- **Kod:** `eserBilgi` mobil dalı (`.ea-ust` + `.ea-detay`), yeni `eaSinir()`, `eaYukseklik()` ve sürükleme bloğu; `puzzle` ikonu (lucide). 3D kadrajı, galeri yüksekliği, «Temsili» etiketi ve «İçini göster» konumu kartın kapalı boyuna göre (kart açılınca sahne zıplamaz). `.ea-kisayol`, `.ea-detay` stilleri.
- **Bulmaca:** Prototipte bulmaca sayfası yok; kısayol ve masaüstü panelindeki yeni «Bulmaca» satırı (`data-bulmaca`) şimdilik bildirim gösteriyor («Bulmaca prototipte henüz yok…»), İz Bırak'taki gibi.
- **Figma** (📱 Mobil bölümü, «B · Eser detay / 3D» satırının sağı; bölüm 6250 px'e genişletildi): «B · Eser detay / 3D · kart kapalı» (221:2781), «· kart açık» (221:2862), «· rotada» (221:2958), altlarında notlar. Kart auto-layout, Inter + Cormorant Garamond, ikonlar lucide. Eski «B · Eser detay / 3D» ve «B · Eser detay» (fotoğraf) ekranlarına dokunulmadı.
- Sınama (390 × 844, dokunmatik): kapalı 170 → 150 px çekince 300 (açık) → tutamağa dokun 170 / 300 / 170; Bulmaca bildirimi çıktı; Geçmiş → `#/gecmis/ulu-cami/0`, Hakkında → `#/hakkinda/ulu-cami`; rotada 222 px; 3D görünümde kart doğru. Masaüstü panel: Eser hakkında · Geçmişi Gör · Bulmaca. Konsolda hata yok.
