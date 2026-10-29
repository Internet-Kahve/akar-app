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

## 12. «Eser hakkında» okuma düzeni: kitaba sadık, kaydırdıkça açılan sayfa (test-redmi9t-v2 + Figma)

- **Sorun:** Sayfa envanter metnini ve 119 fotoğrafı alt alta diziyordu; mobilde ~28.700 px tek duvar, bölüm geçişi ve ilerleme yoktu, masaüstünde fotoğraflar ekranı kaplıyordu, kitabeler düz paragraftı, alttaki sabit «dinle» düğmesi metni kapatıyordu.
- **Yeni düzen** (scrollytelling + katmanlı okuma):
  - Kapak: eserin kapak fotoğrafı, ad, yıl · yaptıran · tür, okuma süresi (≈200 kelime/dk), «Kısa anlatımı dinle».
  - Üstte yapışık bölüm sekmeleri (okunan bölüm işaretlenir, dokununca o bölüme kayar) ve altın okuma çubuğu.
  - Her bölüm: kapak fotoğrafı, no + başlık + süre · paragraf · sayfa; «Kitaptan» özet; rakam kartları; büyük alıntı; (Onarımlar'da) zaman çizelgesi; «Derinine in» ile tam metin.
  - Tam metinde: tırnakla başlayan paragraf kitabe/ayet kartı (Mealen altında), fotoğraflar kitap sırasıyla yana kaydırılan şerit (dokununca büyür, ‹ › ile gezilir), «kündekâri» ve «zirâ» gibi terimlere dokununca kitaptaki tanım.
  - Sonda Hikâyeyi dinle · Geçmişi Gör · Bulmaca (`#/gorev/`, başka oturumda eklenen görev ekranı) ve kaynaklar.
  - Öğeler ekrana girince yumuşakça belirir; hareket azaltma tercihinde hemen görünür.
  - Masaüstü: kapak tam genişlik; solda metin (680 px), sağda yapışık 3D. Okunan bölüme göre döner, ilgili parçalar parlar, Minber/Mihrap/şadırvanda kubbeler kalkar. 3D'siz eserde bölümün fotoğrafı.
- **Kitaba sadakat:** Yeni dosya `eserler/ulu-cami/icerik/eser-hakkinda-okuma.md`. Özet cümleleri, alıntılar, rakam «kanıtı», zaman ifadeleri ve terim tanımları envanter metninden kelimesi kelimesine seçme; kendi sözümüz yalnız rakam kartlarının kısa etiketi (ör. «kubbe») ve yazıyla sayının rakama çevrilmesi («Yirmi» → «20»). `hazirla.py` `okuma_oku` her seçmenin o bölümün metninde birebir geçtiğini, alıntı sahibinin aynı paragrafta olduğunu denetler; geçmeyeni atlar ve uyarı yazar (sahte veriyle sınandı: uydurma özet, uydurma rakam ve yanlış alıntı sahibi atlandı). Envanter metninin tamamı sayfada duruyor (bütün paragraflar DOM'da, sınandı). Sayfa sonunda bunu söyleyen bir not var.
- **Kod:** `app.js` «Eser hakkında» bloğu yeniden yazıldı (`hkBolum`, `hkTamMetin`, `hkSerit`, `hkTerimli`, `hkSec`, `hkSahne`, `hkGozle`, ışık kutusu, terim kartı); `app.css` `.hk*` bloğu yenilendi; `hazirla.py` `okuma_oku` + `terimler`. Okuma dosyası olmayan eserde (Bedesten, Koza Hanı, Türbe…) tam metin doğrudan görünür.
- **Sınama:** mobil (390 × 844) ve masaüstü (1440 × 900). Sayfa kapalı hâlde 28.718 → 9.392 px. 7 kitabe kartı, terim kartı (kaydırınca kapanır), ışık kutusu (Esc kapatır), sekmeler ve okuma çubuğu çalışıyor. Masaüstü 3D: Tarihçe 0°/30° kubbeler yerinde → Minber 0°/45° kubbeler kalkık → Mimari 0°/70°. Diğer eserler hatasız. Konsolda hata yok.
- **Figma:** 📱 Mobil bölümünün altına (y≈10684) dört ekran: «B · Eser hakkında · 1 kapak / 2 bölüm / 3 tam metin açık / 4 zaman çizelgesi ve son», notlarıyla. 🖥 Masaüstü bölümünün altına «D · Eser hakkında · okuma düzeni (yapışık 3D)». Büyük görseller dosyanın kuralına göre gri yer tutucu. Eski «Eser hakkında» ekranlarına dokunulmadı.
- **Not:** Bu iş sırasında `app.js`'e başka bir oturumda görev/bulmaca ekranı eklenmişti; yalnız «Eser hakkında» bloğu değiştirildi, o değişikliklere dokunulmadı.

## 13. «Eser hakkında»: dağınık kutular toplandı, «Derinine in» → «Tam metni oku» (test-redmi9t-v2 + Figma)

- **Sorun:** Gri zemin üstünde beyaz özet kutusu, ayrı ayrı mavi rakam kutuları ve beyaz kenarlıklı «Derinine in» kutusu; bölüm parça parça görünüyordu. «Derinine in» bir bilgi kartı gibi duruyordu; altında metin olduğu belli değildi.
- **Düzeltme:**
  - Sayfa zemini beyaz (`.hk` `--surface`); bölümler arasında ince ayırıcı çizgi; yapışık sekme çubuğu da beyaz.
  - «Kitaptan» özet kutusuz, yalnız soldaki altın çizgiyle.
  - Rakamlar tek çerçevede bitişik hücreler (aralarında 1 px çizgi); tek sayıda kart olunca son kart satırı doldurur.
  - «Derinine in» yerine «devamını oku» kalıbı: tam metnin ilk ~190 px'i alta doğru solarak görünür, altında tam genişlikte koyu mavi «Tam metni oku · 21 paragraf · 3 dk ⌄» düğmesi. Açılınca düğme «Metni kısalt ⌃» olur ve okurken ekranın altında yapışık durur; kısaltınca metnin başına döner. Kapalıyken gizli kısım odak almaz (`inert`), düğmede `aria-expanded`/`aria-controls`. `<details>` kaldırıldı.
- **Sınama** (390 × 844 ve 1440 × 900): açınca 10.618 → 15.308 px, düğme ekranın altında yapışık (y 776–832), kısaltınca bölümün başına döndü. Konsolda hata yok.
- **Figma:** «B · Eser hakkında · 1–4» ve «D · Eser hakkında · okuma düzeni» beyaz zemine alındı; özet kutusuz, rakamlar bitişik, «Tam metni oku» düğmesi (üstünde solan önizleme) ve altta yapışık «Metni kısalt».

## 14. «Eser hakkında» envanter kitabının tasarımından ilhamla yeniden (test-redmi9t-v2 + Figma)

- **Kitaptan çıkan tasarım dili** (Bursa Vakıf Eserleri Envanteri Cilt 1, PDF s.19–40 incelendi): açılışta büyük fotoğraf + petrol mavisi panel (kitaptan ölçülen #085971; projede aynı renk `--sehir-bursa-zemin` #22566E / `--sehir-bursa-desen` #A4D8E0), aralıklı büyük harfle ilçe («O S M A N G A Z İ»), serif eser adı; bölüm başlıkları büyük harfli kalın sans; gövde beyaz sayfada kutusuz, havadar tek sütun; kitabeler italik, «Mealen:» düz; kenardan kenara fotoğraflar; kutu, kenarlık, renkli zemin yok.
- **Kural denetimi (tokens.css):** önceki sürümde Cormorant 18–19 px özet ve kitabe metninde kullanılıyordu; kural «serif yalnız 22 px+ başlık». Düzeltildi: özet Inter 19, kitabe Inter italik (index.html'de Inter italik 400 yüklendi). Altın yalnız süsleme; bölüm araları `SUSLEME` (kuralın izin verdiği yer). Gövde 17/1.75 (masaüstü 18), mobil kenar boşluğu 20 px. Kontrast: beyaz/petrol ~7.6:1, #A4D8E0/petrol ~5:1.
- **Değişenler:**
  - Kapak: mobilde 4:3 fotoğraf + petrol panel; masaüstünde %62 fotoğraf / %38 panel (kitabın çift sayfası gibi).
  - Bölüm başlığı: «02» + büyük harfli kalın sans, `--sehir-aksan`; kapak fotoğrafı kenardan kenara.
  - «Kitaptan» özet kutusuz; rakamlar kutusuz, üst çizgili sütunlar; alıntı serif 28 (italik değil: Cormorant italik yüklü değil).
  - Kitabe kartları kaldırıldı → kitaptaki gibi italik paragraf.
  - «Tam metni oku» petrol çerçeveli, büyük harfli düğme (solan önizleme ve yapışık «Metni kısalt» korunarak).
  - Sekmeler, okuma çubuğu, zaman çizelgesi, terim çizgisi şehir renginde.
  - `app.css`'e `--sehir-acik:#A4D8E0` eklendi (`--sehir-aksan` yanında).
- **Sınama:** mobil ve masaüstü; aç/kısalt, yapışık düğme, terim kartı, ışık kutusu, 7 kitabe, diğer eserler. Yatay taşma yok, konsolda hata yok.
- **Figma:** «B · Eser hakkında · 1–4» ve «D · Eser hakkında · okuma düzeni» yeni dille yeniden kuruldu (eskiler silindi, aynı yerde); notlar güncellendi.

## 15. «Eser hakkında» kapağı: Dinle düğmesi kaldırıldı, Bursa deseniyle süslendi (test-redmi9t-v2 + Figma)

- **Dinle düğmesi:** Kapaktaki «Kısa anlatımı dinle» kaldırıldı (sayfa sonundaki «Hikâyeyi dinle» duruyor).
- **Desen:** `design/desenler/desen-bursa-sekiz-yildiz.svg` (kendi ürettiğimiz 8 kollu yıldız; BENIOKU kuralı: başlık arkasında %6–10). Petrol panelde açık su yeşili (#A4D8E0), %10 opaklık, 88 px karo, sağ üstten sola doğru solar (CSS mask + gradient). Alt kenarda 20 px'lik ince desen şeridi (%35).
- **Esere/şehre özel değer kodda değil:** `veri/sehir/bursa.json` ve `konya.json`'a `kimlik` eklendi (zemin, desen_renk, desen dosyası; değerler tokens.css'teki şehir token'larıyla aynı). `hakkinda()` kapağa `--sehir-aksan`, `--sehir-acik`, `--hk-desen`'i bu veriden verir; `kimlik` olmayan şehirde desen çıkmaz, CSS'teki varsayılan renk kalır.
- `sunucu.sh` artık `design/desenler/` klasörünü de paylaşıyor (`desenler/`).
- Sınama: desen dosyası 200 image/svg+xml; mobil ve masaüstünde kapakta desen görünüyor, Dinle düğmesi yok; konsolda hata yok.
- **Figma:** «B · Eser hakkında · 1 kapak» ve «D · Eser hakkında · okuma düzeni» kapak panelinden Dinle düğmesi kaldırıldı; «Desen / Bursa · sekiz kollu yıldız» (1:866) örnekleriyle desen alanı (%10) ve alt kenar şeridi eklendi; not güncellendi.

## 16. «Eser hakkında»: altın süsler (test-redmi9t-v2 + Figma)

- Mevcut tasarımdaki gibi altın yalnız süs (tokens.css: «--gold SADECE dekor/ikon, yazı değil»); yazı renkleri değişmedi.
  - Kapak: başlığın altında kısa altın süs (`HK_ALTIN`: SUSLEME'nin baklava motifi, 120 px, iki yanda kısa çizgi); alt kenardaki desen şeridi açık su yeşilinden altına (%75).
  - Bölüm numaralarının önünde küçük altın baklava (`.hk-no::before`).
  - Rakamların üst çizgisinin başında 28 px altın vurgu (`.hk-rakam::before`).
  - Alıntıların üstünde aynı kısa altın süs.
  - Zaman çizelgesi noktaları ve okuma çubuğu altın.
  - Bölüm aralarındaki SUSLEME zaten altın.
- Sınama: mobil ve masaüstü; konsolda hata yok.
- Figma: «B · Eser hakkında · 1 / 2 / 4» ve «D · Eser hakkında» ekranlarına aynı süsler eklendi (kapak altın süs + altın şerit, numara baklavası, rakam vurgusu, alıntı süsü, zaman noktaları).

---

# Bu oturumun tamamı (Claude, 27–28 Ekim 2026) · yeni sohbet için devir notu

*Aşağıdaki 17–31 numaralı işler aynı Claude oturumunda yapıldı. 1–16 numaralı işler ise başka bir oturumda yapıldı ve aynı dosyaların üstüne eklendi; iki oturumun değişiklikleri birbirini ezmedi (28 Ekim 18:47'de kontrol edildi). Kod ve veri: `design/test-redmi9t-v2/` (+ `BENIOKU.md`). Prompt'lar: `design/test-redmi9t-v2/_promptlar/`.*

## 17. Şekerhan 3D incelemesi ve yöntem kararı
- «42 İstanbul — Şekerhan 3D» incelendi. Unity'den dışa aktarılmış bir Three.js görüntüleyici; içinde katları açıp gösteren bir özellik var.
- Karar: model Blender'da kurulur (.glb), Three.js'te gösterilir. Şekerhan'daki fikir Ulucami'ye «İçini göster» olarak uyarlandı (kubbeleri ve çatıyı kaldırır, içi gösterir).
- Hat yazıları için karar: Arapça yazı **asla üretilmez**. 3D modelde yazısız levha yer tutucuları var; yazının kendisi fotoğraflarda gösterilir.

## 18. Ulucami 3D v27 (Blender)
- Dosyalar: `eserler/ulu-cami/3d/blend/ulu-cami_v27.blend`; `export/ulu-cami_v27.glb` (571 KB) ve `ulu-cami_v27_sunum.glb` (650 KB); `build/build_v27.py`, `render_v27.py`, `glb_draco.mjs`; `kontrol/v27/`. v26 dosyaları silinmedi (v1 prototip hâlâ onları kullanıyor).
- Gövdenin içi boşaltıldı. Eklenenler: 12 serbest + 14 duvar payesi, 31 sivri kemer, mihrap (5,13 × 8,11 × 0,29 m), minber, 64 yazısız levha, iç zemin.
- Blender'ın Draco köprüsü çalışmadığı için sıkıştırma gltf-transform ile yapıldı. 8 açık kenar hatası düzeltildi.
- `README.md` ve `ulu-cami_notlar.md` güncellendi.
- **Blend ve build dosyaları repoya girmez**, Drive'da tutulmalı.

## 19. test-redmi9t-v2 prototipi kuruldu (v1'e dokunulmadı)
- **Parça vurgusu:** «Tıklanabilir parçalar» düğmesi, parçaları tek sarı renkle ve dağınık sırayla yakıp söndürür. Önceki rengârenk hâl beğenilmedi («pavyon gibi»).
- **Parça kartı:** 3D'de bir parçaya dokununca büyük bir kart açılır. İçinde yana kaydırılan fotoğraflar, aşağı kaydırılan metin ve ses düğmesi var (tarayıcının Türkçe sesi; anlatımı duraklatır). Esc, X ya da dışına dokunmak kartı kapatır.
- **Hikâye kartları büyütüldü:** mobilde 380 px, masaüstünde 520 px.
- **«İçini göster / Dışını göster»:** Örtü katmanları sırayla, yaylanarak kalkar ve iner. Hikâyede iç mekân cümlelerinde (5, 7, 8, 9) kendiliğinden açılır.

## 20. Ölçeklenebilirlik: kodda esere özel değer yok
- Eser bilgileri: `eserler/<eser>/eser.json` (kimlik, konum, sıra) ve `3d/model.json` (glb adı, yön, ana parça, kaydırma, örtü grupları, sunum ekleri).
- Şehir ve rota bilgileri: `veri/sehir/*.json` ve `veri/rota/*.json`.
- `hazirla.py` eserleri klasörlerden kendisi bulur. `sunucu.sh` hangi GLB'lerin paylaşılacağını `model.json`'dan okur.
- Yeni eser eklemek için yalnız bir klasör açmak yeter.

## 21. Ulucami içeriği güncellendi
- **`icerik/parcalar.md`:** 17 parça kartı. Her kartta başlık, metin, fotoğraflar, kaynak ve güven etiketi var. Gövde ve zemin gibi parçalar tıklanmaz.
- **`icerik/hikaye.md`:** Yeni «İç mekân (3D)» sütunu.
- **`icerik/fotograflar.md`:** 15–35 numaralı fotoğraflar arşivden eklendi.
- **`icerik/eser-hakkinda.md`:** Envanter metninin tamamı (Cilt 1 PDF s.19–39, 69 paragraf). Eski özet `eser-hakkinda-ozet.md`'de duruyor.
- «Eser hakkında» sayfası Figma'ya göre tam sayfa yapıldı. Bu sayfa daha sonra başka oturumda (madde 3, 12–16) yeniden tasarlandı.

## 22. Zemin titremesi (z-fighting)
- **Neden:** Zemin katmanları 2–6 mm arayla üst üste duruyor. Derinlik tamponu bu farkı ayırt edemiyor; Draco sıkıştırması da yükseklikleri yaklaşık 7 mm'lik adımlara yuvarlıyor. Sorun olan modeller: Koza Hanı, Orhan Gazi Türbesi, Bedesten, Orhan Bey Camii ve az da olsa Ulucami.
- **Düzeltme (`app.js`):**
  - `zeminKatmanlari()` tabandaki ince parçaları bulur, yüksekliklerine göre sıralar ve üsttekilere `polygonOffset` verir.
  - Kamera `near` değeri yarıçap/100 yapıldı (önceden /200).
- **Model kuralı (bundan sonra):** Üst üste binen zemin katmanları arasında en az 3 cm.
- **Açık iş:** Modellerin kendisinin düzeltilmesi önerildi, henüz yapılmadı. Ürün (`apps/web`) prototipteki bu düzeltmeyi kullanmıyor.

## 23. Oyunlaştırma: bulmaca, saha görevi, rozetler, profil
- **Değerlendirme:** Questo'nun mekaniği alındı (soru çözünce içerik açılır, kademeli ipucu, fotoğraf görevi). Ekonomisi alınmadı: puan, seviye, süre ve liderlik tablosu yok.
- Arkadaşların notlarından kesilenler:
  - Haritada başkalarını görmek (KVKK ve güvenlik riski).
  - Blog (Yaşayan hafıza bu işi zaten görüyor).
  - «Vakfa destek ol» (bağış çağrışımı).
  - 360° görüntü (yeni iş yükü; verilen bağlantı da 360° değildi).
  - Fotoğraf puanlama.
- Notlarda düzeltilen bilgiler:
  - Kündekâri halı değil, ahşap minber tekniği.
  - «Beşinci makam» bir rivayet; soru değil hikâye kartı olur.
- **Ulucami için `icerik/gorevler.json`:**
  - Soru: minberin tekniği, doğru cevap kündekâri (E cilt-1 s.27).
  - Saha görevi: Sahaflar Kapısı (s.25). Yerinde «Buradayım» ile (80 m), evden 3D'de `Tac_Kapi` parçasına dokunarak.
  - 3 rozet: hikâyeyi bitirmek, soru, saha görevi.
- **Kod:**
  - `hazirla.py` → `gorevler_oku`.
  - `app.js` → `#/gorev/<eser>/<i>`, `#/profil`, rozet bildirimi, `rozetKontrol`, «3D modelde bul» şeridi, ilerlemeyi silme düğmesi.
  - Görünüm Figma'ya göre: WF · Bulmaca 1:7147, Doğru 1:7169, Yanlış 1:7204, D · Bulmaca 1:3292, Rozet bildirimi 1:6181, Profil 1:7372 / 1:3591.
- **İlerleme:** Yalnız cihazda (`localStorage`): `akar.gorev.*`, `akar.rozet.*`.
- **Figma:** Bütün «puan» ifadeleri kaldırıldı («1.240 puan · 4 rozet» → «4 rozet», «+10 puan» → «İlk rozetin» / «Yeni rozet»); tasarım notları da düzeltildi.
- **Sınırlar:** «Buradayım» konumu yalnız https'te çalışır (yerel ağda «konum alınamadı» der). Redmi'de denenmedi.

## 24. Küre harita ve şehirler (MapLibre 4.7 → 6.15)
- Ürünle (`apps/web`) aynı sürüme geçildi. 6.x yalnız ES modülü olarak geliyor; `index.html`'deki import map'e `maplibre-gl` eklendi.
- 3D katmanın çizim fonksiyonu yeni sürüme uyarlandı: `girdi.defaultProjectionData`; geçiş sırasında `fallbackMatrix`.
- `stil.projection = { type:'globe' }` ve hafif bir gökyüzü/atmosfer eklendi. En uzak yakınlaştırma (`minZoom`) 6'dan 1,2'ye indi.
- **Şehirler:** Zoom 9'un altında eser pinleri yerine şehirler görünür (`veri/sehir/*.json`):
  - Bursa: altın nokta, «7 eser»; dokununca oraya uçar.
  - Hatay, Konya, Kütahya: «Yakında»; dokununca envanter yılı ve eser sayısı gösterilir (KÖK&KOD bilgi notundan).
  - Mobilde «Bursa ▾», masaüstünde «Bursa» düğmesi haritayı şehirlere uzaklaştırır.
- **Denenmeyenler:** Harita karoları (test ortamında internet yoktu) ve Redmi'de akıcılık. `test.html` (performans testi) 4.7'de kaldı.

## 25. Geçmişi Gör: diğer yapay zekâya verilen prompt'lar
- **`PROMPT_gecmisi_gor_bugunku_es.md`:** Ulucami'nin bugünkü eşleri ve örnek İz Bırak. Uygulandı; sonucu madde 4'te.
- **`PROMPT_gecmisi_gor_diger_eserler.md`:** Koza Hanı, Orhan Bey Külliyesi ve Orhan Gazi Türbesi'ne eş ve örnek iz; Bedesten, Emir Hanı ve Hamam için yalnız rapor. **Henüz çalıştırılmadı.**

## 26. Bulmaca ve görevler: öbür 6 eser için prompt
- **`PROMPT_gorevler_diger_eserler.md`:** Her esere 1 soru, 1 saha görevi ve rozetler. Sorular yalnız «Doğrulanmış» kaynaklı paragraflardan. Orhan Gazi Türbesi'nde hikâye rozeti yok. 3D parça adlarını listeleyen betik içinde. **Henüz çalıştırılmadı.**
- Diğer yapay zekâ bitirince raporunu sohbete getir: sorular envanterle karşılaştırılacak.

## 27. Eski fotoğraf kaynakları (Bedesten, Emir Hanı, Aynalı Çarşı)
- Foto Atlas'taki 10.214 kayıtta bu üç yapıya ait **hiç kayıt yok** (hiçbir izin durumunda).
- **İzni olan arşivler; yeni fotoğraf için kurumdan teyit alınmalı:**
  - İÜ Nadir Eserler, Yıldız Albümleri. Katalog olarak IRCICA'nın Bursa albümü kullanılabilir.
  - Albert Gabriel arşivi (POP sitesinde «Brousse» diye aranır).
- **İzin gereken:** SALT Araştırma, Ülgen Ailesi arşivi. İçinde Bedesten 1960 ve Orhan Hamamı 1934 var. Lisans CC BY-NC-ND; yazılı izin `salt.research@saltonline.org`'dan alınır ve fotoğraf kırpılamaz.
- **İzin gerektirmeyen:** Library of Congress, Abdul Hamid II koleksiyonu (kamu malı).
- **Sorulacak kurumlar:** VGM / Bursa Vakıflar Bölge Müdürlüğü, Bursa Büyükşehir Kent Arşivi.
- **Fotoğraf bulunursa:** Foto Atlas dışı kaynaklar için ayrı bir veri yolu kurulması gerekir.

## 28. Git
- `.gitignore`'a eklenenler: `design/test-redmi9t-v2/.onbellek/` ve `eserler/*/gecmisi-gor/kontrol/`.
- `docs` branch'i push edildi (commit `1c2ad04`, 171 dosya). **PR henüz açılmadı:** https://github.com/Internet-Kahve/akar-app/pull/new/docs
- O commit'ten **sonraki** değişiklikler (küre, bu dosyadaki 1–16 ve sonrası) henüz commit edilmedi.
- `design/ilk-prototip-kılıç-ali-pasa-düz-stil/` (157 MB) repoya alınmadı. Kimin olduğu ekiple konuşulacak.
- Not: Bu bağlantıdan git komutu çalıştırılamıyor (kilit dosyaları silinemiyor); commit ve push'u kullanıcı kendi terminalinden yapıyor.

## 29. Drive (Tamer için)
- **`veri/bursa-foto/`:** Tamamı yerine yalnız Osmangazi cildinden 4 klasör (toplam ~315 MB):
  - `Ulucamii Klasörü`
  - `Ticari Yapılar Klasörü`
  - `Orhan Bey Külliyesi Klasörü`
  - `Türbeler Klasörü`
  - Ayrıca `_manifest.csv` ve `README.md`.
  - `Camiler ve Hazireler 2 Klasörü`'nden yalnız Koza Hanı'nın kullandığı 2 dosya: `DJI_20241023131734_0288_D_ODAK-Edit.jpg`, `ERD04309 kopya-2.jpg`.
- **`veri/fotoatlas/`:** Tamamı.
- **Ulucami modeli:** `ulu-cami_v27.blend` ve `3d/build/`.
- **Envanter metni çıkarılacaksa:** Bursa envanter PDF'leri.
- **Yollar ve klasör adları birebir aynı olmalı;** betikler dosyaları bu yollardan arıyor.

## 30. Açık işler (öncelik sırasıyla)
1. PR'ı aç; sonraki değişiklikleri commit edip push et.
2. Redmi 9T'de deneme: küre, 3D, «İçini göster», parça kartı, bulmaca, ses.
3. İki prompt'u çalıştır (Geçmişi Gör diğer eserler; görevler diğer eserler) ve raporları kontrol et.
4. Modellerdeki zemin katmanlarını ayır (en az 3 cm); ürün tarafı için gerekli.
5. Frontend/backend ekip notları («en son hazırlarız» denmişti): veri dosyaları, görev/rozet şeması, küre, zemin kuralı.
6. İsteğe bağlı: envanterin İngilizce metni, gravürler, Bedesten/Emir/Hamam için eski fotoğraf izinleri.

## 31. Çalışma kuralları (kullanıcının istekleri)
- `apps/` klasörüne ve frontend/backend koduna dokunulmaz. Claude çıktıları `docs/` ve Figma'ya gider.
- Tasarım kararları uygulanmadan önce konuşulur.
- Bir şey yapılması istendiğinde nedeni de anlatılır («şunu şu sebepten», öğreterek).
- Kodda esere ya da şehre özel değer olmaz; her şey veriden gelir.
- Uydurma bilgi yok; her bilginin kaynak sayfası ve güven etiketi var.
- Yapay zekâyla tarihî görsel üretilmez.
- v1 (`test-redmi9t/`) değiştirilmez.

## 32. Harita: binalar ve zemin serin griye çekildi, eserler öne çıktı (test-redmi9t-v2)

- Sorun: eser modelleri sıcak taş rengi (bej duvar, kurşuni kubbe). Haritanın zemini (#F5F2EA), 2D bina izleri (#fde2c9, şeftali) ve 3D OSM binaları (#d0c6b4) da bej olduğu için eserler binalara karışıyordu.
- Ortak stil dosyası `design/harita/akar-style.json` v1 tarafından da kullanıldığı için ona dokunulmadı. Renkler `app.js`'te stil yüklendikten sonra değiştiriliyor (`SERIN` tablosu, katman adına göre).
  - Zemin `#F2F3F2`, konut alanları `#E9ECEC`.
  - 2D bina izleri `#DDE3E7` (kenar `#C2CCD3`, %80).
  - 3D binalar (`akar-bina-3d`) `#C9D2D9`, opaklık %55 → %60.
- Eserlerin renkleri, pinler, park ve su renkleri değişmedi.
- Sınama: masaüstü 1440×900 ve mobil 390×800, Ulucami–Koza Hanı çevresi zoom 17, eğik görünüm; konsolda hata yok.

## 33. Harita binaları daha opak ve nötr gri (test-redmi9t-v2)

- İstek: binaların opaklığını açmak ya da rengini griye götürmek. İkisi birden yapıldı (`app.js`).
  - 3D binalar: `#C9D2D9` %60 → `#C3C6C9` (nötr gri) %85.
  - 2D bina izleri: `#DDE3E7` %80 → `#DADCDE` %90, kenar `#BCC0C4`.
- Sınama: masaüstü ve mobil, zoom 17 eğik görünüm; eserler gri binaların arasında net seçiliyor, konsolda hata yok.

## 34. Harita binaları geri açıldı: daha açık gri, daha saydam (test-redmi9t-v2)

- Kullanıcı: §33 fazla gri ve fazla opak oldu; opaklığın azalması gerekiyordu.
  - 3D binalar: `#C3C6C9` %85 → `#D9DCDF` %40 (ilk hâli %55'ti).
  - 2D bina izleri: `#DADCDE` %90 → `#E3E5E7` %70, kenar `#CDD1D4`.
- Sınama: masaüstü ve mobil, zoom 17 eğik görünüm; binalar hafif ve saydam, eserler öne çıkıyor; konsolda hata yok.

## 35. Harita önizlemesine (renk paneli) bizim 3D modeller eklendi (design/harita)

- İstek: §32–34'teki renkler beğenilmedi; renkleri kullanıcı `design/harita/akar-harita-onizleme.html` panelinden kendisi seçecek, modeller orada görünmeli.
- Eski hâli `design/harita/_eski/akar-harita-onizleme_2026-10-28_modelsiz.html` olarak saklandı (kopya).
- `design/harita/modelleri-gom.py` (yeni): eser.json + 3d/model.json'ı olan her eserin GLB'sini base64 olarak `akar-harita-modeller.js`'e (3,3 MB) yazar. Sayfa file:// ile açıldığı için GLB fetch edilemez, bu yüzden gömüldü. Konum hesabı (kaydirma_m) hazirla.py ile aynı; eser listesi veriden. Model değişince yeniden çalıştırılmalı.
- `akar-harita-onizleme.html`:
  - Açılışta Bursa (Ulucami–Koza Hanı), eğik görünüm. Panelde «Bursa · modeller» ve «İstanbul · pinler» düğmeleri.
  - three.js özel katmanı (`yapilar`) 7 modeli v2 ile aynı yerleşimle çizer; modellerin altındaki OSM binaları v2'deki gibi ayıklanır (`akar-bina-3d`, stilin `building_3d`'si gizli).
  - Paneldeki «Bina (3D)» rengi ve «Bina 3D opaklık» sürgüsü bu katmana da uygulanır. «Stili indir» çıktısına bizim katmanlar/kaynak girmez.
- Sınama (Playwright, file://): 7 model yüklendi, 401 bina; renk ve opaklık değişimi binalara geçiyor; sayfa hatası yok.
- v2 prototipindeki §34 renkleri yerinde duruyor; kullanıcı önizlemeden renkleri seçince v2'ye işlenecek.

## 36. Modellerin altında kalan OSM binaları temizlendi (design/harita önizleme + test-redmi9t-v2)

- Sorun: eski kural yalnız merkezi model izine düşen ve modelden en çok 1,6 kat büyük binaları siliyordu. Ize kısmen giren bloklar kalıyordu (Kapalıçarşı şeridi, Emir Hanı ile hamam arası, Ulucami güney kenarı); modellerin altındaki düz bina izleri (stilin `building` katmanı) hiç süzülmüyordu.
- Yeni kural (turf 7.1, `turf.difference`):
  - Model izine (1 m paylı) giren kısım binadan kesilir; komşu binanın dışarıda kalan kısmı yerinde durur.
  - Kesildikten sonra alanının %60'ı kalmayan bina bütünüyle gider (ör. Bedesten'in OSM çizimi modelden geniş, halka kalıyordu).
  - 4 m'den ince artık şeritler atılır (`turf.buffer` −2 m).
  - Düz bina izi de aynı süzülmüş veriden çizilir (`akar-bina-duz`). Stilin `building` katmanı gizlenmez, saydam yapılır: gizli katmanın verisi yüklenmiyor ve `querySourceFeatures` boş dönüyordu (ilk denemede v2'de bütün binalar kaybolmuştu, böyle düzeldi).
- Dokunma ve imleç için kullanılan 3 m paylı iz (`cokgen`) değişmedi; kesme için ayrı 1 m paylı iz (`kes`) eklendi.
- Önizlemede «Stili indir» düz binanın gerçek opaklığını yazar, bizim katmanlar çıktıya girmez.
- Sınama: önizleme (file://) ve v2 (masaüstü + mobil), zoom 17,3–17,8, düz ve eğik görünüm; modellerin içinde OSM binası kalmadı, komşu binalar yerinde; hata yok.

## 37. Harita önizleme v2: modeller daha belirgin (ışık, gölge, kenar, renk) (design/harita)

- İstek: Yandex (Galata Kulesi) ve Şekerhan 3D'deki modeller belirgin; bizimkiler haritada soluk. `akar-harita-onizleme.html`'e dokunmadan `akar-harita-onizleme-v2.html` yapıldı.
- Teşhis: ortam ışığı (Hemisphere 2,3) güneşten (1,3) güçlüydü; bütün yüzler neredeyse aynı aydınlıkta, çatı ile duvar ayrışmıyordu. Gölge ve kenar yoktu. Güneş güneybatıdaydı, kamera güneyden baktığı için görünen cepheler hep güneşteydi. Malzemeler de açık (çoğu açıklık %76–95, kurşun `#BCC2C6`) ama asıl sebep ışık.
- v2 panelinde «Eser modelleri (3D)»: «Mevcut» (v1 ışığı) / «Belirgin» hazır ayarı; ortam, güneş, karşı ışık, güneş yönü ve yüksekliği, gölge + yerdeki gölge koyuluğu, kenar çizgisi + koyuluk, renk parlaklığı, doygunluk; «Ayarları kopyala» (JSON).
- «Belirgin»: ortam 0,8 · güneş 3 · karşı 0,4 · yön 315° (kuzeybatı, haritacılık kuralı) · yükseklik 45° · gölge açık (%30) · kenar %30 · parlaklık 0,9 · doygunluk 1,15.
- Gölge: her modelde kutusuna göre güneş gölge kamerası (2048 px), `shadow.autoUpdate=false`, yalnız ayar değişince yeniden çizilir; yerdeki gölge `ShadowMaterial` düzlemi (derinlikte geri itilmiş). Kenar: `EdgesGeometry` 35°; zoom 16,5'te görünmez, 18'de tam (uzakta modeli karartıyordu).
- Temel: §36'daki güncel `akar-harita-onizleme.html` (OSM binası temizliği dahil); v2 onun üstüne kuruldu.
- Düzeltme: `map.loaded()` karoları da beklediği için «load» modülden önce geçerse modeller hiç eklenmiyordu; v2'de `map.isStyleLoaded()`. v1'de aynı açık duruyor.
- Düzeltme (modellerin altında «bazen gelip bazen giden» binalar): 3D düğmesinin `guncelle()` fonksiyonu her eğme/döndürmede stilin **süzülmemiş** `building_3d` katmanını görünür yapıyordu; gizleyen `binaGorunum()` ise yalnız `pitch` olayına bağlıydı. Açılışta ve döndürünce eski binalar modellerin altında beliriyordu. v2'de `guncelle()` artık `building_3d`'ye dokunmuyor, `binaGorunum()`'ü çağırıyor; sınamada açılış, döndürme ve eğmede `building_3d` hep gizli. v1 önizlemede (`akar-harita-onizleme.html`) aynı hata duruyor. Prototip (`test-redmi9t-v2/app.js`) etkilenmiyor: orada `building_3d` yalnız gizleniyor.
- Düzeltme (Ulucami önü, Orhan Bey ve Koza Han altında beyaz kaide gibi duran binalar): 36. maddenin kesme kuralı, modelin izine kısmen giren yan binanın dışarıdaki kısmını bırakıyordu (≥%60 dışarıda ve 4 m'den kalınsa). v2'de varsayılan: modelin izine, boşluk payıyla (panel, varsayılan 3 m) değen OSM binası bütünüyle kaldırılır. Panelde «Model çevresindeki OSM binaları»: «tamamen kaldır» aç/kapa (kapalıyken eski kesme kuralı) ve «boşluk (m)» 0–15. Sınama: sahte vektör karolarla (geojson-vt + vt-pbf) Ulucami çevresine kaide, izine 5 m giren yan bina, yakın ve uzak bina konuldu; eski kuralda yan binanın 20 m'si kalıyordu, yenisinde gidiyor; uzak bina duruyor. Gerçek OSM verisinde bakılmadı.
- «Canlı» hazır ayarı (varsayılan): kullanıcı bir minarenin beyaza patladığını, ötekinin canlı durduğunu gördü; hedef «bütün bina canlı ve doygun, gölge hafif». Sebep: aydınlık ≈ renk × (ortam + güneş × açı); «Belirgin»'de güneşe bakan yüzde ≈ 3,8, «Mevcut»'ta ≈ 3,6 → açık renkler beyaza patlıyor. «Canlı»: ortam 1 · güneş 1,4 · karşı 0,3 · yön 315° · yükseklik 45° · gölge %18 · kenar %15 · parlaklık 1 · doygunluk 1,25. Panele ton eşleme (yok / ACES / AgX) ve pozlama eklendi; denendi: AgX renkleri soldurdu, ACES kubbeleri parlattı, ışığı dengelemek daha iyi oldu.
- Sağda ayrı «Işık ve renk · 3D eserler» paneli (kullanıcı «renk mi ışık mı koyu» ayırt edemedi): teşhis modları «Normal / Yalnız renk (ışıksız MeshBasicMaterial) / Yalnız ışık (beyaz kil)»; aydınlık ölçüsü (güneşli duvar, gölgeli duvar, çatı ≈ renk × sayı; iyi 0,8–1,3, 1,6 üstü patlar, 0,7 altı koyu); sürgüler başlıklı (Işık · Renk · Gölge ve kenar · İleri · Model çevresi); «Genel parlaklık» (pozlama) artık ton eşleme kapalıyken de çalışıyor (0 = LinearToneMapping; NoToneMapping pozlamayı yok sayıyordu). İlk bulgu: «Yalnız renk»te malzemeler açık ve canlı; koyuluk ışıktan. Kurşun çatı/kubbe malzemeleri metalik (0,2) ve sahnede ortam yansıması (environment map) olmadığı için ayrıca koyulaşıyor.
- Renk ölçümü (Ulucami, dron fotoğrafları `veri/bursa-foto/…/Ulucamii Klasörü/` 0387, 0291, 0510; ölçülen noktalar gözle kontrol edildi; fotoğraflar düzenlenmiş ve ışık içeriyor, değerler yaklaşık): kurşun kubbe/çatı foto #ACB7BA–#C6C7C1, model #BCC2C6 → aynı. Kasnak foto #CCAC6F–#DAB575 (L≈0,65), model #F2E2A8 (L 0,80, S 0,74) → çok açık, limon sarısı. Duvar taşı foto #A69479–#B39D7F (L≈0,58), model dokusu ort. #E5D0AE (L 0,79) → çok açık, fazla sarı. Minare tuğla foto #7F5E47–#9F754C (L≈0,43), model dokusu #CF7F55 → fazla turuncu ve açık. Mermer foto #E1DDCA, model #F5F4F0 → biraz açık. Görsel: `eserler/ulu-cami/3d/kontrol/renk-olcumu_2026-10-28.png`. Öneri (onay bekliyor): düzeltme Blender malzemelerinde/dokularında yapılsın (kaynak), web ışığıyla değil.
- KARAR (28 Ekim, kullanıcı onayladı; yedi eser): renkler fotoğraftan ölçülür (21 Ekim'deki pastel / V ≥ 0,80 kararının yerine); Blender'da yalnız AO (glTF occlusionTexture, ikinci UV) ve saydam yer gölgesi düzlemi («Yer_Golgesi», alfa ≈ %10–15) pişirilir, köşe rengi AO'su kaldırılır; güneşin yönü pişirilmez (ileride gündüz/gece için); web'de gerçek zamanlı gölge ve kenar kapanacak, ışık ≈ 1–1,4'e inecek. Araştırma: Mapbox «sembolik gerçekçilik», Apple simge yapıları çevreden biraz koyu, glTF pişmiş AO'yu destekler (lightmap'i desteklemez). Kullanıcının beğendiği ışık (ortam 2, güneş 1, karşı 1, gölge %10, kenar 0) ve `design/harita/akar-style-ozel-v2.json` not edildi; ışık renkler düzelince yeniden ayarlanacak. Prompt: `design/test-redmi9t-v2/_promptlar/PROMPT_foto_renk_ve_ao_pisirme_7_eser.md` (iki aşama: ölçüm ve rapor → onay → Blender). Henüz çalıştırılmadı.
- (eski not) Konuşulan (karar verilmedi): AO ve yerdeki gölgeyi Blender'da pişirmek (bake). Öneri: önce yalnız Ulucami'de AO (ikinci UV + doku) ve saydam PNG yer gölgesi; güneşin yönü pişirilmez, web'de kalır. Gerçek zamanlı gölge haritası Redmi'de en pahalı kısım.
- Sınama (Playwright, karolar boş: test ortamında internet yok): 7 model yüklendi, iki hazır ayar zoom 16,8 ve 18'de karşılaştırıldı (`_eski/karsilastirma-v1-v2_2026-10-28.png`), sayfa hatası yok. Gerçek harita ve Redmi'de bakılmadı.
- Açık: (1) Kullanıcı ayarı seçip «Ayarları kopyala» çıktısını verince v2 prototipine (`test-redmi9t-v2/app.js`, `yapiKatman`) işlenecek; değerler koda değil veriye (ör. `veri/sehir/*.json` ya da ayrı bir harita ayar dosyası) konmalı. (2) Redmi için gölge haritası 1024 px'e indirilip akıcılık ölçülmeli; yetmezse gölge yalnız masaüstünde. (3) Öneri: çevre OSM binaları bej yerine açık gri (taş rengi modeller bejle karışıyor).

## 38. Önizlemede modeller ve bina temizliği bazen hiç kurulmuyordu (design/harita)

- Kullanıcı: modellerin altında hâlâ MapLibre binaları var.
- Neden: önizlemenin model betiği (`type="module"`, three.js ve turf CDN'den) haritadan sonra yüklenir. Kurulum `map.loaded() ? kur() : map.once("load", kur)` ile yapılıyordu; `map.loaded()` karolar yüklenirken de false döner ve «load» olayı bir daha gelmez. Sayfa yavaş açılınca modeller ve bina süzgeci hiç kurulmuyor, stilin OSM binaları modellerin yerinde olduğu gibi kalıyordu.
- Düzeltme: stil hazır olana kadar (`map.isStyleLoaded()`) 200 ms aralıkla beklenip kurulur.
- Sınama: 7 eserin her biri zoom 18,3, eğik, önizleme (file://) ve v2'de tek tek bakıldı; modellerin içinde OSM binası yok, hata yok.
- Ek düzeltme (§37'deki notla bulundu): sayfanın `guncelle()` fonksiyonu döndürmede de stilin süzülmemiş `building_3d` katmanını açıyordu; gizleyen `binaGorunum()` yalnız `pitch`'e bağlıydı. Artık `rotate`'e de bağlı, döndürünce eski binalar modellerin altında belirmiyor.
- Not: başka bir oturum aynı anda `akar-harita-onizleme-v2.html`'i yaptı (§37); bu bölüm v1 önizlemeyi (`akar-harita-onizleme.html`) anlatıyor.

## 39. Yedi eserde fotoğraftan renk ölçümü (1. aşama; Blender'a geçilmedi, onay bekliyor)

- İş emri: `design/test-redmi9t-v2/_promptlar/PROMPT_foto_renk_ve_ao_pisirme_7_eser.md`. Yalnız 1. aşama yapıldı (ölçüm ve rapor); prompt gereği burada duruldu. GLB, blend ve build betiklerine dokunulmadı.
- Son sürümler doğrulandı, prompt'takiyle aynı: Ulucami v27, Bedesten v06, Koza Han v14, Orhan Bey Camii v07, Hamam v05, Emir Hanı v05, Türbe v02.
- Yöntem: `veri/bursa-foto/` arşivinden her eser için 3–5 gündüz dış cephe fotoğrafı seçildi. Her malzeme rolü için düz bölgelerin piksel ortancası alındı ve her kırpıntı gözle kontrol edildi; gölgeye, pencereye ya da ağaca düşenler atıldı. Ulucami yeniden ölçülmedi (§37 kararı).
- Model rengi GLB'den okundu: malzeme rengi × doku ortancası × köşe rengi.
- Bulgu: modellerin taş ve duvar renkleri her eserde fotoğraftan belirgin açık (açıklık farkı +0,12 ile +0,24 arası; yalnız gölgede ölçülen rollerde daha da fazla). Kurşun `#BCC2C6`, güneşli fotoğraflarda Ulucami, Bedesten ve Türbe ile uyuşuyor.
- Önemli: gölgede ya da revak içinde çekilen fotoğraflar malzemeyi koyu gösteriyor (Emir Hanı'nın beyaz sıva tonozu `#A5A1A0` çıktı). Bu yüzden öneri yalnız güneşli örneklerden alındı; güneşli örneği olmayan roller «düşük güven» işaretli ve palete girmedi.
- Ortak öneri:
  - kurşun `#BCC2C6`;
  - duvar `#AF9A7D` (Ulucami ve Bedesten);
  - kasnak sarı sıva `#D2B276`;
  - tuğla `#8E6A4E`;
  - mermer `#E6E2D6`;
  - istisnalar: Orhan Bey Camii duvarı `#C4B08C`, Hamam duvarı `#C69D80`, Emir Hanı duvarı `#AC9483`.
- Açık sorular (kullanıcıya):
  - Emir Hanı çatısı fotoğrafta kurşun değil; gri beton/membran, yeşil ve mavi kaplama var. Model kurşun.
  - Koza Han'ın güneşli fotoğrafı yok; ortak duvar rengi ona da uygulansın mı?
  - Kurşunda istisna olsun mu (Hamam `#A4ABB1`)?
  - Türbe'nin krem sıvası alçak güneşte doymuş çıktı; kullanılmadı.
  - Ulucami'de v23'te kullanıcı kararıyla seçilen minare tuğlası `#986B4D`, yeni ölçüme (`#8E6A4E`) çok yakın.
- Çıktılar:
  - `eserler/<eser>/3d/kontrol/renk-olcumu_2026-10-28.png` (altı eser; Ulucami'deki dosyaya dokunulmadı);
  - `…_kirpintilar.jpg` (kırmızı çizgili kırpıntılar atılanlar);
  - `eserler/_kutuphane/RENK_OLCUM_RAPORU.md` (her bölgenin fotoğrafı, koordinatı, ışığı, değeri);
  - `eserler/_kutuphane/malzeme-paleti.json` (`_durum: ÖNERİ`).
- Ölçüm betikleri oturumun geçici klasöründe; repoya konmadı.

## 40. 3D eser sahnesinin zemini: Bursa tonuna çalan nötr gri geçiş (test-redmi9t-v2)

- İstek: Şekerhan'daki gibi renkli zemin, Bursa'nın rengiyle. Prototipte üç seçenek çekildi (`design/karsilastirma/3d-zemin-A-bursa-petrol.png`, `-B-gecis.png`, `-C-simdiki.png`). Araştırma: ISO 3664 renk değerlendirmede nötr gri çevre ister (Munsell N8, yansıtma ≤ %60); doygun zemin eşzamanlı renk kontrastıyla model renklerini kaydırır (sıcak taş/tuğla petrol zeminde daha turuncu görünür). Smithsonian Voyager gibi müze görüntüleyicileri düz ve geçişli zemin kullanıyor. Kullanıcı D seçeneğini seçti: nötre yakın, Bursa tonuna hafif çalan geçiş; alt koyu ki kaide zeminden ayrılsın.
- Veri: `veri/sehir/bursa.json` → `kimlik.sahne_ust` #DDE4E5, `kimlik.sahne_alt` #A7B4B7 (+ `_sahne_not`). Konya'da yok → nötr gri kalır.
- Kod: `app.js` şehir kaydından `--sahne-ust` / `--sahne-alt` değişkenlerini kurar; `Sahne3D` tuvali saydam (`alpha:true`, `setClearColor(0,0)`); `app.css` `.sahne3d` zemini `linear-gradient(180deg, var(--sahne-ust,#DCE3E4), var(--sahne-alt,#C3CBCD))`. Kodda şehre özel renk yok.
- Sınama (Playwright, karolar boş): masaüstü 1440×860 ve mobil 390×844 eser 3D, «Eser hakkında» yapışık 3D; üçünde de geçiş uygulanıyor, sayfa hatası yok. Redmi'de bakılmadı.
- Açık: Figma ekranları henüz güncellenmedi. Bursa kimliği isteğe bağlı küçük vurgu olarak (kaide kenarı ya da alt desen şeridi) eklenebilir; karar verilmedi.

## 41. «Eser hakkında»: geri düğmesi kapağın sol üst köşesine (test-redmi9t-v2)

- İstek: masaüstü kapağında petrol panelin ortasındaki «‹ Ulucami» düğmesi sol köşeye.
- `app.js` `hakkinda()`: düğme panelden çıkarıldı, kapağın (`hk-kapak`) ilk öğesi oldu. `app.css`: `.hk-kapak` `position:relative`; `.hk-geri` mutlak konum (üst 20, sol 24 px), fotoğraf üstünde okunsun diye yarı saydam koyu zemin (`rgba(20,27,43,.55)` + bulanıklık), 36 px, odak çerçevesi; `.hk-d .hk-geri{align-self}` kaldırıldı. Mobil değişmedi (geri düğmesi yapışık sekme çubuğunda).
- Sınama (Playwright, fotoğraflı): masaüstü 1440×860 kapakta düğme sol üstte, panel metni dikey ortada kaldı; mobil aynı; hata yok. Figma güncellenmedi.
- Tasarım incelemesi yapıldı (öneriler sohbette; karar bekliyor): sekme çubuğunda 9 bölümün 5'i görünüyor, kaydırılabildiği belli değil; masaüstünde aşağı inince geri yolu yok; «Kitaptan» özeti ile tam metnin ilk cümlesi tekrar ediyor; yapışık 3D kartında model küçük, üst boşluk fazla; ilk bölüm kapağın hemen altında ince bir fotoğraf şeridiyle başlıyor.

## 42. «Eser hakkında» iyileştirmeleri: sekme okları, masaüstü geri, tekrar eden cümle, 3D kartı, bölüm başı, süs (test-redmi9t-v2)

- Kullanıcı §41'deki incelemenin hepsini uygulattı. Yedek: `design/test-redmi9t-v2/.onbellek/_yedek_app_2026-10-28.js/.css`.
- **Sekmeler:** 9 bölümün 5'i görünüyordu. Şerit taşınca devamı olan yanda kenar solar (`sol-var` / `sag-var` maske); masaüstünde ‹ › okları (`hk-sekme-ok`, `data-hk-kay`, şeridi %70 kaydırır; uçta gizlenir; `hkSekmeOk()`). Mobilde ok yok (parmakla kaydırılır), solma var.
- **Masaüstü geri:** kapak ekrandan çıkınca (IntersectionObserver → `#hk-kaydir.kapak-gecti`) sekme çubuğunun solunda «‹ Ulucami» hap düğmesi (beyaz, şehir renginde kenar; seçili sekmeyle ve kaydırma okuyla karışmasın diye adıyla). Mobil geri düğmesi aynı (yalnız simge).
- **Tekrar eden cümle:** «Kitaptan» özetindeki cümleyi taşıyan paragraf `hk-ozette` sınıfı alır; kapalı önizlemede gizli, «Tam metni oku» açılınca yerinde (envanter metninin tamamı DOM'da kalır). `hkTamMetin(b, baskin, kapakUrl, ozet)`.
- **3D kartı:** `.hk-sahne.uc` yüksekliği `min(100vh − 112px, 620px)`; ızgara boşluğu 64 → 48 px, en geniş 1280 → 1360 px. 1440 px ekranda kart 480×748 → 576×620; model belirgin büyük.
- **Bölüm başı:** başlık (no, ad, süre) fotoğraftan önce; ilk bölümde üst boşluk 24 px. Bölüm artık kapağın altında yarım fotoğraf şeridiyle başlamıyor.
- **Süs:** yalnız alıntıların üstündeki altın süs kaldırıldı (§16'da kullanıcı istemişti; kapak süsü, bölüm araları, numara baklavası, rakam vurgusu duruyor).
- Sınama (Playwright, fotoğraflı, 1440×860 ve 390×844): oklar taşmaya göre çıkıyor, tıklayınca kayıyor; masaüstü geri kapakta gizli, aşağıda görünür; 15 özet paragrafı önizlemede gizli; alıntı süsü 0; hata yok. Redmi'de ve Figma'da bakılmadı.

## 43. «Eser hakkında»: fotoğraf şeridinin kaydırılabildiği belli oldu (test-redmi9t-v2)

- Sorun (kullanıcı ekran görüntüsü): tam metindeki kitap fotoğrafı şeridinde sağda yalnız ince bir dilim görünüyor, yana kaydırılabildiği anlaşılmıyor.
- `app.js` `hkSerit()`: birden çok fotoğrafta şerit `.hk-serit-ic` içine alınır; ‹ › düğmeleri (`data-hk-serit-kay`, şeridi %80 kaydırır, uçta gizlenir) ve «1 / 4» sayacı (`.hk-serit-sayac`). `hkSeritDurum(r)`: devamı olan kenar `sol-var`/`sag-var` (maske ile %25'e solar), okların görünürlüğü, sayaç. Kaydırma olayı belgede yakalanır (capture); açılışta ve fotoğraflar yüklenince de hesaplanır. Tek fotoğrafta değişiklik yok.
- `app.css`: `.hk-serit-ic`, solma maskeleri, 44 px yuvarlak oklar (gölgeli, odak çerçeveli), sayaç rozeti. Mobilde ok yok (parmakla kaydırılır), sayaç ve solma var.
- Sınama (Playwright, 1440×860 ve 390×844, Tarihçe tam metni açık): 2 fotoğraflı şerit «1 / 2», sağ ok görünür → tıklayınca «2 / 2», sol ok görünür, sağ ok gizli; hata yok.

## 44. «Eser hakkında»: fotoğraflar kırpılmadan, kendi oranında (test-redmi9t-v2)

- Ölçüm (öncesi, Playwright, bütün tam metinler açık): şerit 111 fotoğrafın masaüstünde 31'i ≥ %10, 9'u ≥ %30 kırpılıyordu (en çok %55); mobilde 44 / 20 (en çok %72). Bölüm başı 8 fotoğrafın 6'sı ≥ %10, 4'ü ≥ %30 (en çok %64, dikey fotoğraf 3:2 kutuda). Sebepler: şeritte sabit yükseklik + en çok %88 genişlik (4:1'lik hat levhalarının uçları kesiliyordu), kitaptaki oran (`--oran`, kitabın sayfa düzenindeki kırpma) kullanılıyordu, bölüm başı hep 3:2.
- Kullanıcı kararı: fotoğraflar orijinal oranında, tam görünsün (ör. Tarihçe başındaki «Envanter Cilt 1 · s. 18» besmele levhası).
- `app.js`: fotoğraf yüklenince kutunun `--oran`'ı dosyanın gerçek oranından yazılır (belgede yakalanan `load` olayı); bölüm başı fotoğrafına da `--oran`.
- `app.css`: şerit öğesi `width:min(260px|300px × oran, 100%)`, `aspect-ratio:oran`, `height:auto`; şerit `align-items:center` (öğeler en uzun fotoğrafa gerilmesin); tek fotoğraf ve bölüm başı `width:min(100%, min(70vh,640px) × oran)`, ortalı (dikey fotoğraf ekranın %70'ini geçmez); bölüm başı esnek kutu, tam genişlikteki fotoğraf mobilde kenardan kenara.
- Sınama: kırpma masaüstü ve mobilde 111 şerit + 8 bölüm başı fotoğrafında %0; s.18 levhası tam; şerit okları/sayaç çalışıyor; hata yok.
- Konuşulan, yapılmadı: fotoğrafın büyütülebildiğini gösteren küçük «büyüt» simgesi (mobilde imleç yok).

## 45. Galeri fotoğrafları tıklanır, galeri boşluğu sabit, 3D'de fareyle parça vurgusu, «büyüt» simgesi (test-redmi9t-v2)

- Yedek: `.onbellek/_yedek_app_2026-10-28b.js/.css`.
- **Galeri (eser detay · Fotoğraf):** her fotoğraf `button.galeri-f[data-isik]`; tıklayınca «Eser hakkında»daki ışık kutusu açılır, galerinin bütün fotoğrafları arasında ‹ › ile gezilir, künye «başlık · kaynak» (ör. «2 / 12 · İç mekân · Envanter Cilt 1 · s. 26»), Esc kapatır. `hkIsikAc` grubu artık `.hk-serit, .galeri`.
- **Galeri boşluğu:** kaydırınca ilk fotoğraf kenara sıfır boşlukla yapışıyordu (başta 24 px). `scroll-padding-inline` (mobil 16, masaüstü 24 px) → her adımda 24 px (yalnız galerinin sonunda içerik bittiği için fazla).
- **3D fare vurgusu (masaüstü):** `Sahne3D.isaretci` `pointermove` (yalnız fare, tuş basılı değilken, kare başına bir ışın): tıklanabilir parçanın üstünde `ustte` → `boya()` parçayı hafif sarı yakar (seçiliden hafif, 0,24), imleç el, `title` parça kartının başlığı; boş alanda ve `pointerleave`'de söner. Mobilde değişiklik yok («Tıklanabilir parçalar» düğmesi).
- **«Büyüt» simgesi:** `BUYUT()` (`expand` simgesi, sağ alt köşede yarı saydam koyu daire) galeri, «Eser hakkında» şerit ve bölüm başı fotoğraflarında; `(hover:hover)` olan cihazda fare üstüne gelince simge koyulaşır, fotoğraf %3 büyür; hareket azaltma tercihinde geçiş yok.
- Sınama (Playwright 1440×860 ve 390×844): galeri boşluğu 24/24/24, ışık kutusu açılıp geziliyor ve kapanıyor; 3D'de minarenin üstünde imleç el + «Doğu minaresi · Güdük Minare», boş alanda normal; simgeler görünür; hata yok. Redmi'de bakılmadı.

## 46. «Eser hakkında» kapağı envanterdeki açılış fotoğrafıyla (test-redmi9t-v2)

- İstek: kapakta PDF'teki gibi fotoğraf. Envanterde Ulucami kaydının açılış fotoğrafı E cilt-1 PDF s.19: akşam, ışıklı minare, hilal = arşiv `DJI_20241205174916_0088_D_ODAK.jpg` = galerideki `19_minareler-aksam.jpg` (`icerik/kitap-fotograflari.md` satırıyla doğrulandı).
- Veri: `eserler/ulu-cami/eser.json` → `"hakkinda_kapak": "19_minareler-aksam.jpg"` (+ `_hakkinda_kapak` kaynak notu). `hazirla.py` eser.json alanlarını olduğu gibi aktarıyor; kod değişmedi.
- Kod: `app.js` `hakkinda()` kapak = `e.hakkinda_kapak`'taki fotoğraf, yoksa galerinin ilki. Kodda esere özel değer yok; öbür eserlere aynı alan eklenince onların kapağı da değişir.
- Sınama: masaüstü ve mobil kapakta akşam fotoğrafı; hata yok. Yerleşim (fotoğraf %62, panel) değişmedi.

## 47. Yedi eser: fotoğraf rengi + dokuya pişmiş AO + yer gölgesi (2. aşama; §39'un devamı)

- Kullanıcı §39'daki öneriyi onayladı: kurşun `#BCC2C6`, mermer `#E6E2D6` ve tuğla `#8E6A4E` yedi eserde ortak; duvar esere göre (Ulucami ve Bedesten `#AF9A7D`, Orhan Bey Camii `#C4B08C`, Hamam `#C69D80`, Emir Hanı `#AC9483`). Ölçülemeyen roller eski rengini korudu: Koza Han'ın duvarı, Emir Hanı çatısı (kurşun kaldı), Türbe'nin krem sıvası.
- Palet `eserler/_kutuphane/malzeme-paleti.json`: `_durum: ONAYLANDI` ve `eser_malzeme` (Blender malzemesi → rol) eklendi. Kodda renk sabiti yok. `_GENEL_SAHNE_STANDARDI.md` §3 ve §2 bu dosyaya yönlendirildi.
- Ortak hat `eserler/_kutuphane/renk_ao_v3/`. Her eserin `build/build_vXX.py` dosyası yalnız bu hattı çağırıyor.
  - `renk_ao.py` (Blender):
    - düz malzemede renk hedef hex'e çekiliyor; dokulu malzemede doku doğrusal uzayda çarpılıyor, desen korunuyor (`build/doku_palet_v3/`);
    - köşe rengi 1,0 yapılıyor;
    - ikinci UV `UV_AO` açılıyor ve AO pişiriliyor; doku 0,5 + 0,5 × AO olarak kaydediliyor;
    - glTF Material Output'un Occlusion girişine bağlanıyor;
    - `Yer_Golgesi` ekleniyor: taban + 5 m, alfa = (1 − AO) × 0,15, kenarda sıfıra iniyor.
  - `son_adim.mjs`: Yer_Golgesi unlit ve blend; AO dokusu JPG 85; COLOR_0 siliniyor; Draco; denetim.
  - `hepsi.sh`: bütün hat.
- İş emrinden sapmalar (gerekçeli):
  - (1) Lightmap Pack, çok yüzlü modellerde yüzlerin çoğunu 1 pikselden küçük alana sıkıştırdı. Ulucami'de 52 337 yüzün 31 865'ine AO hiç yazılmadı ve kubbeler simsiyah çıktı. Yerine yapı parçalarının birleştirilmiş geçici kopyasında Smart UV Project kullanıldı; UV'ler yüz etiketiyle asıl mesh'lere geri yazıldı.
  - (2) Bazı modellerde kaplama yüzleri alttaki kabuğun 0–3 cm üstünde duruyor. Cycles bunları tamamen örtülü saydı (Türbe çatısındaki lekeler). Bu yüzler yalnız pişirme kopyasından çıkarıldı; doku beyazla başladığı için «açık» kaldılar. Geometri değişmedi.
  - (3) AO, 0,5 + 0,5 × AO ile sıkıştırıldı: hedef «en koyu ≈ 0,45–0,55» tutuyor.
  - (4) Koza Han atlası 2048 değil 1024 px; 2048'de dosya 1,9 MB'tı ve 1,5 MB sınırını aşıyordu.
- Kabul (hepsi geçti):
  - (a) her hedefli malzemenin rengi paletle aynı (sapma 0 ton);
  - (b) yapı parçalarında COLOR_0 yok;
  - (c) her yapı malzemesinde occlusionTexture.texCoord = 1; Yer_Golgesi unlit ve BLEND;
  - (d) uygulama GLB'sinde her parçanın üçgen sayısı ve sınır kutusu eskiyle aynı (fark 0 mm), parça adları aynı. Sunum GLB'lerinde 4 eserde birkaç üçgen fark var; bunlar eski sunum dosyalarının uygulama dosyasından daha eski bir blend'den yazılmasından geliyor, yeni sunum eski uygulamayla birebir aynı;
  - (e) Ulucami kasnak `#D2B276`, duvar `#AF9A7D`, minare `#8E6A4E`: ölçülen ortancalar;
  - (f) hepsi ≤ 1,5 MB.

  | Eser | Sürüm | Kurşun | Duvar (ilk) | Tuğla (ilk) | AO en koyu / ortanca | Uygulama GLB |
  |---|---|---|---|---|---|---|
  | Ulucami | v27→v28 | `#BCC2C6`→`#BCC2C6` | `#E5D0AE`→`#AF9A7D` | `#CF7F55`→`#8E6A4E` | 0.5 / 0.74 | 557 → 1348 KB |
  | Bedesten | v06→v07 | `#BCC2C6`→`#BCC2C6` | `#E3DDBE`→`#AF9A7D` | `#CF7F55`→`#8E6A4E` | 0.5 / 0.75 | 167 → 796 KB |
  | Koza Han | v14→v15 | `#BCC2C6`→`#BCC2C6` | — | `#CF7F55`→`#8E6A4E` | 0.5 / 0.8 | 828 → 1246 KB |
  | Orhan Bey Camii | v07→v08 | `#BCC2C6`→`#BCC2C6` | `#E5DAB9`→`#C4B08C` | `#CF7F55`→`#8E6A4E` | 0.5 / 0.78 | 267 → 526 KB |
  | Orhan Bey Hamamı | v05→v06 | `#BCC2C6`→`#BCC2C6` | `#E3D8B8`→`#C69D80` | `#CF7F55`→`#8E6A4E` | 0.5 / 0.82 | 203 → 435 KB |
  | Emir Hanı | v05→v06 | `#BCC2C6`→`#BCC2C6` | `#E7D7AF`→`#AC9483` | `#CF7F55`→`#8E6A4E` | 0.5 / 0.75 | 136 → 736 KB |
  | Orhan Gazi Türbesi | v02→v03 | `#BCC2C6`→`#BCC2C6` | — | — | 0.5 / 0.53 | 253 → 479 KB |
- Dosyalar 2–5 kat büyüdü; büyük kısmı AO dokusu ve ikinci UV. Redmi'de açılış süresine bakılmadı.
- Uygulamaya bağlama:
  - 7 `3d/model.json` dosyasında yalnız `glb` alanı yeni sürüme çevrildi;
  - `design/harita/modelleri-gom.py` çalıştırıldı (`akar-harita-modeller.js` 3,3 → 7,6 MB);
  - iki harita önizlemesi 7 modeli hatasız yüklüyor (Playwright).
  - v1 (`test-redmi9t/`) kendi `modeller/` kopyasını kullanıyor, değişmedi.
  - test-redmi9t-v2, `hazirla.py` yeniden çalıştırılınca yeni modellere geçer (çalıştırılmadı).
- Web için açık (iş emrine göre ayrı oturum): `Yer_Golgesi` taban izinden (OSM bina kesme kutusu) çıkarılmalı. Çıkarılmazsa iz 5 m büyür ve modellerin çevresinde fazladan OSM binası silinir. Ayrıca ışık 1–1,4'e inmeli; yeni renkler eskisinden belirgin koyu.
- Kontrol:
  - her eserde `kontrol/<sürüm>/havadan.png`: eski | yeni | yalnız AO, aynı kamera ve web ışığı;
  - `duz_foto.png`: ışıksız yeni model | fotoğraf ölçümü;
  - `renkler.json`, `kontrol_rapor.json`;
  - README sürüm satırları.
- Eski sürümlerin blend ve GLB dosyaları silinmedi (v1 eski GLB'leri kullanıyor).

## 48. Açık üç renk kararı verildi: Emir Hanı çatısı, Koza Han duvarı, Türbe sıvası

- Kullanıcı: «bunlara sen karar ver en iyi sonuç için».
- **Emir Hanı çatısı kurşun kalır** (`#BCC2C6`, model değişmedi).
  - Kaynak: envanter cilt 1, «üzeri kurşunla kaplıdır; ancak bir dönem kiremitle örtüldüğü bilinmektedir».
  - 2024 dron fotoğrafındaki gri, yeşil ve mavi kaplamalar geçici ya da onarım katmanı; çatı sokaktan da görünmüyor.
  - Gerekçe: kaynağa sadakat ve yedi eserde aynı kurşun.
- **Koza Han duvarı `#DCC8A6` → `#8E887F`** (eser istisnası).
  - Fotoğraf: `DJI_20241023135706_0377`; Koza kaynak dizininde almaşık pencere detayı olarak geçiyor. Pencereler arasındaki saf almaşık bölgelerin ortancası `#827D74`.
  - Doğrudan güneş yok. Pozlama, aynı karedeki beyaz harç (`#DBD9D4`) güneşli fotoğraflardaki harca (`#EDEBE9`) eşitlenerek düzeltildi (doğrusal ×1,21).
  - Gölgedeki ERD fotoğraflarıyla tutarlı. Koza duvarı Ulucami'den belirgin gri.
- **Orhan Gazi Türbesi krem sıva `#E8DFCB` → `#F5E4C9`.**
  - Fotoğraf: `08_1.jpg`. Ağaç gölgesi benekli duvarda yalnız güneş alan pikseller ölçüldü (bölgenin en parlak %15'i); üç bölge tutarlı (`#EDDCC2`–`#FCEDD4`).
- Koza Han v15 ve Türbe v03, aynı sürüm numarasıyla yeniden üretildi (hat `renk_ao_v3`). Kabul ölçütleri yine geçti:
  - geometri aynı;
  - texCoord 1;
  - renk sapması 0;
  - Koza 1247 KB, Türbe 479 KB.
- Güncellenen dosyalar:
  - `akar-harita-modeller.js` yeniden üretildi.
  - Kontrol görselleri ve README satırları yenilendi.
  - `malzeme-paleti.json`: `kararlar_28_ekim` eklendi; `acik_sorular` boşaldı.
  - `RENK_OLCUM_RAPORU.md`: sonuna ek tablo eklendi.

## 49. Harita önizleme v3: yeni modeller (fotoğraf renkleri + pişmiş AO), «Pişmiş» ışık, yer gölgesi taban izinden hariç (design/harita)

- `akar-harita-onizleme-v3.html` = v2 + aşağıdakiler; modeller `akar-harita-modeller.js`'ten (3D ajanı yeniledi: Ulucami v28, Bedesten v07, Koza v15, Orhan Camii v08, Hamam v06, Emir v06, Türbe v03).
- **Düzeltme (v2):** bilgisayardaki v2'de «Işık ve renk» paneli yoktu; kaydederken kopyalama ve diske yazma aynı anda başlatılmış, eski sürüm yazılmıştı. Panelli v2 yeniden kaydedildi.
- **Yer_Golgesi:** taban izi (`kutu`) artık yalnız yapı meshlerinden (`yerGolgesi()` adı «Yer_Golgesi» ile başlayan nesne ya da üstü); kenar çizgisi, gölge atma/alma, renk ayarı ve görünüm modlarına girmez. Ölçüm: yeni modellerle v2'de taban izleri 3924/11963/2114/2259/1005/6824/4016 m², v3'te 2766/9830/1291/1384/468/5268/2792 m² (v2, modellerin 5 m çevresindeki OSM binalarını da siliyordu).
- **«Pişmiş» hazır ayarı (varsayılan):** kullanıcının seçtiği ışık (ortam 2, güneş 1, karşı 1, yön 315°, yükseklik 45°, doygunluk 1,25); gerçek zamanlı gölge ve kenar kapalı (pişmiş gölgenin üstüne binip görüntüyü çamurlaştırıyordu; kenar çizgisi yer gölgesi düzleminin çerçevesini de çiziyordu). Pişmiş AO ve kurşunun metalikliği yüzeyleri koyulaştırdığı için yüksek ortam ışığı doğru sonuç veriyor (önceki tahminim yanlıştı).
- Sınama (Playwright, karolar boş): 7 model yüklendi, dikdörtgen çizgiler yok, hata yok. Gözlem: pişmiş yer gölgesi (alfa ≈ %15) açık zeminde neredeyse görünmüyor.
- Açık: dosya boyutu (yedi model 2,4 → 5,6 MB; artışın kaynağı AO resmi ve 1024 px kayıpsız PNG yer gölgesi). Kullanıcı yer gölgesini web'de çizmeyi soruyor. test-redmi9t-v2 prototipinde Yer_Golgesi hariç tutma henüz yapılmadı.

## 50. Fotoğraf renkleri geri alınıyor (plan B), web yer gölgesi (design/harita v3 + prompt)

- Kullanıcı yeni (fotoğraftan ölçülen) duvar, tuğla ve kasnak renklerini haritada beğenmedi: «canlılığı öldürmüş». Çatı/kurşun zaten değişmemişti. Karar: **plan B** — 21 Ekim pastel renkleri geri, pişmiş AO kalır. Eski renkler biraz açık bulunursa ton ayarı web'de (panel: renk parlaklığı/doygunluk), modele yazılmaz.
- Dosya boyutu (5,6 MB) için karar: pişmiş «Yer_Golgesi» PNG'si modelden çıkar (açık zeminde neredeyse görünmüyordu, 7 modelde ≈ 1,6 MB); AO tek kanal JPEG, Ulucami/Koza 1024 px, diğerleri 512 px. Hedef toplam ≤ 2,8 MB.
- Prompt: `design/test-redmi9t-v2/_promptlar/PROMPT_eski_renk_ao_kucuk_7_eser.md` (renk referansı v27/v06/v14/v07/v05/v05/v02 aynı adlı malzeme; köşe rengindeki eski renkler malzemeye; palette «foto_olcum» saklanır, «karar» yazılır; yeni sürümler v29/v08/v16/v09/v07/v07/v04; model.json + modelleri-gom.py). Henüz çalıştırılmadı.
- **Web yer gölgesi (v3):** kodla bir kez üretilen 128 px bulanık doku (`YG_DOKU`, indirme yok); her modelin altına taban izi boyutunda düzlem (grup içinde, modelle döner), `webGolge` opaklığı panelde («Yer gölgesi (yumuşak, web)», «Pişmiş» hazır ayarında 0,28). Modelde «Yer_Golgesi» varsa gizlenir. «Gölge» sürgüsü «Gerçek zamanlı gölge» olarak adlandırıldı.
- Sınama: zoom 18,2 yakın görünümde yapıyı zemine oturtan yumuşak leke; kapalıyken yok; hata yok.

## 51. Yedi eser: pastel renkler geri, pişmiş AO küçüldü, yer gölgesi modelden çıktı (3D)

- İş emri: `design/test-redmi9t-v2/_promptlar/PROMPT_eski_renk_ao_kucuk_7_eser.md` (§50 kararı).
- Yöntem: Blender'da yeniden üretim yok; GLB üzerinde `eserler/_kutuphane/renk_ao_v3/pastel_kucuk.mjs` (toplu: `pastel_hepsi.sh`). Geometri ve UV_AO aynen taşındı.
  - Renk: her malzemeye referans pastel sürümdeki (v27/v06/v14/v07/v05/v05/v02) aynı adlı malzemenin rengi ve dokusu (doku_palet_v2) kopyalandı. Kaynak dosya ve malzeme adı her eserin `kontrol/<sürüm>/renkler.json` dosyasında.
  - Köşe rengi: referanslarda bütün malzemelerde gri (R=G=B), yani AO idi. «Köşe renginde renk» durumu bu sürümlerde yoktu (o v06/v04/v01'deydi), bu yüzden çarpılmadı; pişmiş AO onun yerini alıyor.
- Ölçüt: renk sapması bütün malzemelerde 0 ton. Malzeme adları referansla birebir; fazla ya da eksik malzeme yok.
- AO yeniden pişirilmedi: mevcut doku ~1 px bulanıklaştırılıp küçültüldü ve tek kanal JPEG q80 olarak kaydedildi (Ulucami ve Koza 1024 px, diğerleri 512 px). texCoord 1 ve UV_AO aynı.
- Yer_Golgesi uygulama ve sunum GLB'lerinden çıkarıldı; KHR_materials_unlit de düştü.

  | Eser | Sürüm | Duvar (foto→pastel) | Tuğla | Kasnak / sıva | AO | Uygulama GLB |
  |---|---|---|---|---|---|---|
  | Ulucami | v28→v29 | `#AF9A7D`→`#E5D0AE` | `#8E6A4E`→`#CF7F55` | `#D2B276`→`#F2E2A8` | 1024 px, 487→117 KB | 1349 → 768 KB |
  | Bedesten | v07→v08 | `#AF9A7D`→`#E3DDBE` | `#8E6A4E`→`#CF7F55` | — | 512 px, 182→38 KB | 796 → 161 KB |
  | Koza Han | v15→v16 | `#8E887F`→`#DCC8A6` | `#8E6A4E`→`#CF7F55` | — | 1024 px, 263→163 KB | 1248 → 899 KB |
  | Orhan Bey Camii | v08→v09 | `#C4B08C`→`#E5DAB9` | `#8E6A4E`→`#CF7F55` | `#C7B495`→`#E9DFC4` | 512 px, 209→45 KB | 526 → 260 KB |
  | Orhan Bey Hamamı | v06→v07 | `#C69D80`→`#E3D8B8` | `#8E6A4E`→`#CF7F55` | `#C09878`→`#DCD1AD` | 512 px, 176→38 KB | 436 → 189 KB |
  | Emir Hanı | v06→v07 | `#AC9483`→`#E7D7AF` | `#8E6A4E`→`#CF7F55` | — | 512 px, 252→49 KB | 736 → 168 KB |
  | Orhan Gazi Türbesi | v03→v04 | — | — | `#F5E4C9`→`#E8DFCB` | 512 px, 135→28 KB | 479 → 264 KB |
  Toplam: 5570 → **2709 KB** (hedef ≤ 2,8 MB; pastel referanslar ≈ 2,4 MB). Kurşun her yerde `#BCC2C6`; Emir Hanı çatısı kurşun.
- Sapma: Draco yeniden yazımı sıfır alanlı üçgenleri attı (girdide sayıldı):
  - Koza Avlu_Revak 288, Ic_Koza 38;
  - Orhan Cami_SonCemaat 40;
  - Emir_Hani 2;
  - Bedesten sunum Zemin_Derz 1.984.
  Sınır kutuları aynı, sayılar pastel referansla aynı. Diğer bütün parçalar birebir.
- Palet (`malzeme-paleti.json`): «hex» artık pastel değer. Fotoğraf ölçümleri «foto_olcum» ve «eser_istisna_foto_olcum» alanlarında saklı; «karar» yazıldı. `RENK_OLCUM_RAPORU.md` başına karar notu eklendi.
- Uygulamaya bağlama:
  - 7 `model.json` yeni sürümleri gösteriyor;
  - `modelleri-gom.py` çalıştı (`akar-harita-modeller.js` 7,6 → 3,7 MB);
  - önizleme v1, v2 ve v3 7 modeli hatasız yüklüyor (Playwright).
- Kontrol: `kontrol/<sürüm>/havadan.png` dosyasında pastel referans | yeni ve önceki AO | küçültülmüş AO; küçültme farkı gözle seçilmiyor. Ayrıca `renkler.json`, `kontrol_rapor.json` ve README satırları.
- Not: blend dosyaları (v28/v07/…) fotoğraf renkli kaldı. Yeni sürümler GLB son adımıyla üretildi; Blender'dan yeniden üretilecek bir sonraki sürümde önce `pastel_kucuk.mjs`'in renk kopyası uygulanmalı. Eski dosyalar silinmedi.

## 52. Harita önizleme v3'e kullanıcının stili (akar-style-ozel-v2.json) + Blender eşitleme prompt'u

- v3'ün gömülü stiline `design/harita/akar-style-ozel-v2.json`'daki farklar işlendi (dosya tamamıyla karşılaştırıldı; yalnız 5 fark): background #F5F2EA → #f3f1ed, building #fde2c9 → #ede0d4, building_3d #d0c6b4 → #ddd5c6, road_area_pier ve road_pier #F5F2EA → #f3f1ed. «Sıfırla» bu renklere döner. Sınama: modeller ve harita hatasız.
- 3D ajanı GLB üzerinde çalıştığı için blend/build fotoğraf renklerinde kalmıştı (kaynak–çıktı ayrışması). Prompt: `design/test-redmi9t-v2/_promptlar/PROMPT_blend_kaynagi_esitle_7_eser.md` (blend + build palet dosyasından, Yer_Golgesi silinir, AO küçültme dışa aktarma betiğine; Blender çıktısı şimdiki GLB ile a–g ölçütleriyle birebir doğrulanınca yerine yazılır, geçmezse dokunulmaz). Henüz çalıştırılmadı.

## 53. Blend kaynağı GLB'lerle eşitlendi — doğrulamada bugünkü teslimde iki hata çıktı, DURULDU (3D)

- İş emri: `design/test-redmi9t-v2/_promptlar/PROMPT_blend_kaynagi_esitle_7_eser.md`.
- **Yeni kaynak hattı** `eserler/_kutuphane/blend_hat/` (renk_ao_v3'ün yerine; artık tek doğruluk kaynağı blend + `malzeme-paleti.json`):
  - `blend_cikti.py` (Blender): palette renk ve doku; Yer_Golgesi temizliği; yeni blend; ham GLB.
  - `blend_son.mjs`: AO tek kanal JPEG q80 (Ulucami ve Koza 1024 px, diğerleri 512 px, ~1 px bulanık); COLOR_0 temizliği; Draco iki tur (bugünkü dosyaların sıfır alanlı üçgen atımlarıyla birebir aynı).
  - `uret.py`: zincir (ref → Blender → son adım → glb_temizle).
  - `dogrula.mjs`: a–f ölçütleri.
  - `eserler.json`.
  - Palete `eser_doku` eklendi (dokulu malzemenin doku_palet_v2 dosyası).
  - Her eserde `build/build_v29|v08|v16|v09|v07|v07|v04.py` (ince sarmalayıcı; renk sabiti yok).
- **Blend'ler:** `ulu-cami_v29`, `bedesten_v08`, `koza-han_v16`, `orhan-bey-camii_v09`, `orhan-bey-hamami_v07`, `emir-hani_v07`, `orhan-gazi-turbesi_v04` (palet renkleri, Yer_Golgesi yok, pişmiş AO duruyor). Eskileri silinmedi.
- **Doğrulama** (Blender çıktısı `export/_esitleme/` ↔ bugünkü teslim):
  - **Uygulama GLB'leri (7):** a–f hepsi geçti; renk farkı 0 ton; kutu ≤ 1,5 mm (nicemleme); üçgen eşit; AO aynı boyut ve kanal; boyut farkı 0.
  - (g) Render farkı Ulucami, Bedesten, Orhan, Hamam, Emir ve Türbe'de > 8/255 piksel %0.
  - **Koza Han'da %1,7 fark** (aşağıda, hata 2).
  - **Sunum GLB'leri:** Ulucami, Bedesten, Koza ve Türbe geçti. Orhan Camii, Hamam ve Emir (b) ölçütünde geçmedi (hata 1).
- **Hata 1 (bugünkü teslimde; benim §51'deki işim):** `pastel_kucuk.mjs`, sunum dosyalarında rengi köşe renginde duran çevre malzemelerinin (Agac, Agac_Govde_Doku, Duz) köşe rengini malzemeye çarptı, ama köşe rengini silmedi. Renk iki kez uygulandı; ağaç ve zemin koyulaştı (ör. Orhan Agac G 0,34 → 0,12 doğrusal). Blender çıktısı pastel referansla (v07/v05/v05 sunum) birebir aynı. Uygulama GLB'leri etkilenmedi (çevre yok).
- **Hata 2 (bugünkü teslimde; §47'deki işim):** Koza Han v14'te Govde_Dis ve Ic_Koza dokuları ikinci UV kanalını (texCoord 1) kullanıyordu; birinci kanal boş bir yer tutucuydu. `renk_ao.py` yer tutucuyu silip UV_AO'yu ikinci kanala koydu, ama malzemeler texCoord 1'de kaldı. Böylece Duvar_Almasik, Moloz, Disli_Tugla ve Pencere_Izgara dokuları AO atlasının UV'siyle örneklendi (v15 ve v16). `dogrula.mjs` ortanca renge baktığı için yakalamadı; render yakaladı. Blender çıktısı texCoord 0 kullanıyor ve pastel v14 ile ışıksız render farkı %0,001; bugünkü v16'da %2,9.
- **Prompt kuralı gereği bugünkü GLB'lere dokunulmadı.** Geçici çıktılar `eserler/<eser>/3d/export/_esitleme/` altında; karşılaştırma görseli `kontrol/<sürüm>/esitleme.png`. README ve model.json değişmedi; `modelleri-gom.py` çalıştırılmadı.
- `renk_ao_v3/` betiklerinin başına «bir kerelik geçiş işiydi; yeniden kullanma» notu eklendi.
- Açık (kullanıcı onayı): Blender çıktısı yedi uygulama ve yedi sunum GLB'sinin yerine yazılsın mı? Hata 1 ve 2'yi düzeltir, diğerlerinde görsel değişiklik yok.
- **SONUÇ (29 Ekim 2026, kullanıcı onayladı):** Blender çıktısı yedi uygulama ve yedi sunum GLB'sinin yerine yazıldı. Sürüm numaraları aynı; model.json değişmedi. Hata 1 ve 2 düzeltildi.
  - Boyut (KB, önce → sonra):

    | Eser | Uygulama | Sunum |
    |---|---|---|
    | Ulucami v29 | 767 → 767 | 844 → 844 |
    | Bedesten v08 | 161 → 161 | 203 → 203 |
    | Koza Han v16 | 899 → 899 | 1011 → 1016 |
    | Orhan Bey Camii v09 | 259 → 259 | 329 → 329 |
    | Orhan Bey Hamamı v07 | 189 → 189 | 233 → 233 |
    | Emir Hanı v07 | 168 → 168 | 229 → 229 |
    | Orhan Gazi Türbesi v04 | 263 → 263 | 317 → 317 |

    Uygulama toplamı 2706 KB (değişmedi).
  - Geçici dosyalar silinmedi, taşındı: `export/_esitleme/` içindeki dosyalar yerine yazılarak taşındı, boş kalan klasörler kaldırıldı. `kontrol/<sürüm>/esitleme.png` duruyor.
  - Her eserin README'sine eşitleme satırı eklendi; Koza (UV kanalı) ile Orhan, Hamam ve Emir (sunumda çevre rengi çift uygulama) satırlarına düzeltilen hata yazıldı.
  - `modelleri-gom.py` çalıştı (`akar-harita-modeller.js` 3,7 MB). Önizleme v1, v2 ve v3 7 modeli hatasız yüklüyor.
  - Bundan sonra GLB yalnız `build/build_vXX.py` → `_kutuphane/blend_hat/` ile üretilir.

## 54. Prototipe v3 ayarları, pin/filtre düzeltmeleri, YAPILACAKLAR.md (test-redmi9t-v2)

- **Işık veriden:** `veri/sehir/bursa.json → harita_isik` (ortam 2, güneş 1, karşı 1, yön 315°, yükseklik 45°, doygunluk 1,25, yer_golgesi 0,18; + `_harita_isik_not`). `app.js` `ISIK` (yoksa eski varsayılanlar); haritadaki model katmanında ışıklar, malzeme doygunluğu ve web yer gölgesi (`YG_DOKU`, kodla üretilen bulanık doku; önizleme v3 ile aynı). Taban izi «Yer_Golgesi»siz (`yerGolgesiMi`).
- **Yer gölgesi azaltıldı** (kullanıcı): 0,28 → 0,18; önizleme v3 «Pişmiş» hazır ayarında da.
- **Stil:** `sunucu.sh` prototipe `design/harita/akar-style-ozel-v2.json`'ı `akar-style.json` adıyla bağlar (ortak `akar-style.json`'a v1 bağlı, dokunulmadı). `SERIN` geçersiz kılması kaldırıldı; OSM 3D bina rengi/opaklığı stilin `building_3d`'sinden.
- **Pinler:** etiket `text-variable-anchor-offset` ile yer bulamazsa sağa/üste/alta geçer; `symbol-sort-key` = eser sırası; pin zoom 16 → 18'de 0,8 → 0,66 küçülür. Test ortamında yazı tipi indirilemediği için etiketler görsel olarak sınanamadı.
- **Filtre:** «Akar» → «Ticari (akar)» (uygulamanın adıyla karışıyordu); her filtrede açıklama (title); yalnız şehirde eseri olan roller gösterilir (Bursa'da «Su», «Eğitim» yok). Listede «3D» etiketi yalnız bütün eserlerde 3D yoksa.
- Emir Hanı ve Orhan Bey Camii'nin aynı tarihi (1339–40) kontrol edildi: ikisi de envanterde aynı külliyenin parçası (E cilt-1 s.96, s.108); doğru.
- `YAPILACAKLAR.md` (documents-context): durum, hemen yapılacaklar, Redmi kontrol listesi, tasarım/Figma, ekip notları, jüri ve sunum, teknik borç.
- Sınama (Playwright, masaüstü): 7 yeni model yüklendi, filtreler «Dinî», «Ticari (akar)»; 3D etiketi yok; hata yok. Yedek: `.onbellek/_yedek_*_2026-10-29.*`.

## 55. Eser detayındaki 3D sahne haritayla aynı ışıkta; kart parçaları birlikte seçilir; parça sadeleştirme prompt'u (test-redmi9t-v2)

29 Ekim 2026.
- **Işık:** Sahne3D (eser detayı, hikâye, «Eser hakkında» 3D) haritayla aynı ışığı kullanır. Bunlar: `ISIK` (şehir kaydı `harita_isik`), aynı güneş yönü (model haritadaki yaw ile döndüğü için gölgeli yüzler aynı), aynı ortam/dolgu renkleri, doygunluk 1,25 ve web yer gölgesi (`YG_DOKU`, yapının taban izi boyutunda, zemin katmanlarının üstünde). «Yer_Golgesi» düzlemi varsa gizlenir ve kadraja girmez. Önceden detay sahnesinin kendi sabit ışığı vardı (ortam 2,3 / güneş 1,3).
- **Seçim:** Bir kartın bütün parçaları birlikte seçilir ve fare üstündeyken birlikte yanar (`Sahne3D.grup`). Örneğin Ulucami'de cepheler ile pencere girintileri artık ayrı ayrı seçilmiyor.
- **`model.json` «tiklanmaz»:** Bu listedeki parçalar, eserin kartı olmasa da tıklanmaz. Liste parça sadeleştirme işinde doldurulacak.
- **Prompt:** `_promptlar/PROMPT_parca_sadelestirme_7_eser.md`. İçeriği:
  - Koza Han mescidi (gövde, kubbe ve dikiş tek parça olacak);
  - develikteki yanlış birleşmiş yuvarlak nesne;
  - çatı ince parçaları;
  - diğer beş eser aynı ilkeyle;
  - Ulucami'de kullanılan adlar korunur;
  - tıklama haritası render'ı ve referans denetimi.
  Blender eşitlemesinden sonra verilecek.
- **OSM binaları (prototip), aynı gece ikinci karar:**
  - Önce önizleme v3'ün kuralı (modele değen bina bütünüyle kalkar) prototipe alındı. Bu kural modellerin çevresindeki çarşı bloklarını da sildi; kullanıcı «bazı 3D'ler yok» dedi.
  - Prototip şimdi ürünün kuralını kullanıyor (`apps/web` `osm-buildings.ts` → `isHidden`). Bina, köşelerinin ortalaması modelin taban izine (döndürülmüş sınır kutusu + 3 m) düşüyorsa ve alanı o izin 1,6 katından küçükse çizilmez. Bina kesilmez; büyük çarşı çatıları kalır.
  - Üründe yanlış kalan binalar panelden «Gizle / Geri göster» ile düzeltilir; prototipte panel yok.
  - Görsel sınama yapılamadı (test ortamında harita karosu yok); Redmi denemesinde bakılacak.
- Sınama (Playwright): Ulucami önce/sonra; Koza Han yer gölgesi; cepheye fareyle gelince dört cephe ile pencereler birlikte yanıyor; kart açılıyor; hata yok. Yedek: `.onbellek/_yedek_app_2026-10-29b.js`.

## 56. Yedi eserin kök parça yapısı sadeleştirildi (3D; parça sadeleştirme)

- İş emri: kullanıcının yapıştırdığı «AKAR 3D: yedi eserin parça yapısını sadeleştir» prompt'u (§55'teki plan). Renk, doku, AO ve görünüm değişmedi; yalnız kök parçaların bölünüşü ve adları değişti. İş Blender'da yapıldı (`blend_hat`).
- **Yeni:**
  - `eserler/_kutuphane/blend_hat/parca_plan.json`: veri olarak eser başına ayır / dağıt / birleştir / ad adımları. `blend_cikti.py` planı dışa aktarmadan önce uygular. Konum kayması plandan önce hesaplanır; birleştirmeden önce UV katman adları eşitlenir (UV_AO, TEXCOORD_1'de kalır). Uygulama GLB'si artık web'deki kuralla seçiliyor: sunum ekleri hariç.
  - `parca_dogrula.mjs`: denetim.
  - Her eserde `build/build_v09|v17|v10|v08|v08|v05.py`.
- **Kök parça sayısı (sunum ekleri hariç):**
  - Bedesten v08→v09: 8 → 4
  - Koza Han v16→v17: 15 → 9
  - Orhan Bey Camii v09→v10: 12 → 8
  - Orhan Bey Hamamı v07→v08: 11 → 5
  - Emir Hanı v07→v08: 7 → 5
  - Orhan Gazi Türbesi v04→v05: 8 → 3
  - **Ulucami: değişiklik yok, yeni sürüm açılmadı.** Adların hepsi kart, hikâye, okuma ya da örtü gruplarında kullanılıyor. Hiçbir yerde geçmeyen dört parça (`Govde`, `Ic_Zemin`, `Mermer_Bant`, `Silme_Ust`) da `parcalar.md`'nin «kartı olmayan» bölümünde adlarıyla geçiyor ve zaten tıklanmıyor. Yanlış birleşme yok.
- **Eşlemeler:**
  - Koza:
    - Avlu_Mescit + Mescit_Kubbe + Mescit_Dikis → Mescit
    - Avlu_Cephe → Avlu_Revak
    - Avlu_Halka → Avlu_Zemin
    - Silme_Kat → Cephe
    - Baca → Cati
    - Kubbe_Avlu → Revak_Kubbeleri
    - Cephe ayrı kaldı: Govde_Dis'e katılsaydı ana parçanın merkezi 2,4 m kayardı.
  - Bedesten:
    - Pencereler → Govde
    - Dukkan_Kapilari, Cati ve Sacak → Dukkanlar
  - Orhan:
    - Revak_Cephe, Revak_Kemerler ve Kubbe_SonCemaat → Cami_SonCemaat
    - Kubbe_Tabhane_B + D → Kubbe_Tabhaneler
    - Minare_1 → Minare
  - Hamam:
    - Hamam_Detay her bölüme dağıtıldı.
    - Kubbe_Sogukluk_* kendi soğukluğuna katıldı.
    - Kubbe_Sicaklik, Kubbe_Iliklik ve Kubbe_Halvetler → Hamam_Sicaklik.
  - Emir:
    - Bacalar ve Dis_Cephe → Emir_Hani
    - Girisler ayrı kaldı (merkezi 2,1 m kaydırırdı).
  - Türbe:
    - Pencereler ve Pilastr_Silme → Govde
    - Kapi → Giris_Holu
    - Kasnak ve Cati_Etek → Kubbe
  - Gerekçeler her eserin `kontrol/<sürüm>/parca_envanteri.md` dosyasında.
- **Yanlış birleşme:**
  - Koza `Avlu_Mescit` içindeki 4,4 m çaplı mermer nesne, İç Koza (ikinci avlu) ortasındaki 12 kenarlı havuz. `build_v13.py`'de «Street View 04, ölçüler T» notuyla üretilip mescide birleştirilmiş. Ayrıldı, `Ic_Koza`'ya katıldı. Varlığı yalnız fotoğrafa dayanıyor; envanterde geçmiyor.
  - Hamam `Hamam_Detay`: 268 adalı, bütün yapıya yayılmış bir ayrıntı torbası. Bölgelere dağıtıldı: erkek soğukluğu 873 yüz, kadın soğukluğu 1.002, sıcak bölüm 483; atanamayan yok.
  - Diğer uzak kümeler tasarım gereği tekrar eden öğeler: alemler, pencereler, dört kapı, iki kanattaki bacalar.
- **Referanslar:** hikâye tablolarındaki Vurgu ve kamera sütunları yeni adlara çevrildi: Koza 4, Orhan 2, Hamam 2. Notlardaki tarihsel ad anmalarına dokunulmadı (metin). `model.json`'larda yalnız glb değişti; ana_parca adları aynı.
- **«tiklanmaz»:** gerek çıkmadı. Sadeleştirmeden sonra kalan her parça anlamlı bir birim (avlu zeminleri hikâye vurgusu); `model.json`'a eklenmedi.
- **Doğrulama:** altı eserde de b, c ve d geçti.
  - (b) Toplam üçgen ve köşe aynı, renk farkı 0, UV kanalları ve AO aynı.
  - (c) İçerik ve model.json'daki her ad uygulama ve sunum GLB'sinde var; eksik 0. Ulucami de denetlendi, eksik 0.
  - (d) Ana parçanın yatay merkezi aynı. Türbe'de 43 cm düşey kayma oldu; harita düşeyde tabanı kullandığı için etkisiz.
  - Normal render farkı %0,002–0,048 (> 8/255 piksel). Tıklama haritası: `kontrol/<sürüm>/tiklama_haritasi.png`.
- **Kart taslağı:** altı eserde `icerik/parcalar_taslak.md` (Parçalar | Önerilen başlık | Not; metin yok).
- Bağlama: `model.json` glb → yeni sürümler; `modelleri-gom.py` çalıştı; önizleme v1, v2 ve v3 7 modeli hatasız yüklüyor. test-redmi9t-v2 `hazirla.py` çalıştırılınca yeni modellere geçer (çalıştırılmadı). Eski dosyalar silinmedi.

## 57. Yükleme ekranları şehrin deseniyle (test-redmi9t-v2)

29 Ekim 2026. Figma `akar-yeni` kaynakları:
- «Amblem · açılış, 3D yükleniyor (çizgi çizgi çizilir), rozet» (1:913);
- desen kuralı «silik kullanım %6–10: ilk açılış arka planı, boş durumlar» (1:957);
- «D · Eser detay / 3D yükleniyor» (1:4794): kart, amblem, «3D model yükleniyor · %62», ilerleme çubuğu, «0,4 MB / 0,8 MB. Bu sırada Dinle ya da Oku ile başlayabilirsin; model gelince sahne kendiliğinden açılır.»;
- Figma notu: «Yüzde ve MB gerçek indirmeden gelir; panel kullanılabilir».

Yapılanlar:
- **Açılış ekranı** (`index.html` `#acilis`):
  - sayfa ilk açılınca tam ekran;
  - arkada şehrin deseni silik (%8, şehrin rengi);
  - ortada altın amblem çizgi çizgi çizilir;
  - altında «AKAR», şehir adı (serif) ve «Vakıf eserleri yükleniyor».
  - Harita ilk kez çizilince (`load`) kalkar; en geç 8 sn.
  - Şehir, renk ve desen kodda değil, şehir kaydından gelir (`veri/sehir/<şehir>.json → kimlik.zemin`, `desen_renk`, `desen`). Yeni şehir kendi desenini kendiliğinden taşır. Sayfa kökünde `--sehir-aksan`, `--sehir-acik`, `--sehir-desen`.
- **3D yükleme kartı** (`yuklemeKart`, `yuklemeIzle`): Figma'daki kart. Gerçek indirme yüzdesi ve MB gösterilir (`glbAl` artık akışı okuyor, `glbIzle` dinleyici). Arkada 3D sahne zemininin üstünde silik şehir deseni. Üç yerde kullanılıyor:
  - eser detayı 3D;
  - hikâye (Dinle/Oku) 3D;
  - «Eser hakkında» masaüstü 3D.
- `prefers-reduced-motion`: amblem çizim animasyonu kapalı, çizili durur.
- Sınama (Playwright; GLB yavaşlatılarak): masaüstü kart «%43 · 0,4 MB / 1,0 MB», model gelince kart kalkıyor; açılış ekranı deseni ve amblemi; hata yok. Yedekler `.onbellek/_yedek_*_2026-10-29e.*`.
- **Redmi 9T denemesi** (Muhammed, 29 Ekim): sorun yok; `YAPILACAKLAR.md`'den çıkarıldı.

## 58. Figma `akar-yeni` prototiple eşitlendi (tasarım; 9 madde)

29 Ekim 2026. Dosya: figma.com/design/HGTgq5vRXVqhVO9TcR9wBe/akar-yeni. Değişen her ekranın altında «29 Ekim: …» notu var (44 not, çakışma yok). Hiçbir ekran silinmedi; «Eser hakkında»nın beş ekranının eski hâli «Eski sürümler (22 Ekim)» bölümüne «· 28 Ekim öncesi» ekiyle kopyalandı.
1. **Açılış ekranı**: «D · Açılış / yükleniyor» (`236:2893`) ve «WF · Açılış / yükleniyor» (`236:3203`) eklendi. İlk satırın başına kondukları için satırdaki ekranlar sağa kaydırıldı (masaüstü +1520, mobil +470).
2. **3D yükleniyor**: kartın arkasına %8 desen; amblem 56 → 44 px; «Yükleme kartı · 3D» bileşeni (`237:3386`).
3. **3D sahne zemini**: 14 sahnede dikey geçiş #DDE4E5 → #A7B4B7; renk örneği (`237:3402`).
4. **Parça seçimi**: kural notu ve masaüstünde fare üstü örneği (`237:3407`).
5. **Galeri**: «Büyüt düğmesi (fotoğraf)» bileşeni (`237:3415`), 10 fotoğrafta; ikon listesine «Büyüt → expand».
6. **Eser hakkında**: geri hapı, sekme şeridi kenar solması ve okları, başlık fotoğraftan önce, kırpılmayan foto şeridi ve «1 / 4» sayacı, yapışık 3D alanı 620 px; mobilde «‹ Ulucami» hapı, altın süs kaldırıldı.
7. **Filtreler**: bileşende «Ticari (akar)»; 21 ekrandan Su ve Eğitim çipleri ile «3D» etiketleri kaldırıldı (65 örnek).
8. **Pin**: «Harita pini» yanına not (`240:3504`).
9. **Tasarım sistemi**: desen kullanımı (`1:957`) ve amblem notu (`1:913`) güncellendi.

Dosyada renk değişkeni ve yazı stili yok; renkler listedeki hex değerleriyle yazıldı. Açık kalan: «Harita lejantı» bileşeni (`1:563`) hâlâ Su / Eğitim / Akar gösteriyor (iş emrinde yoktu); kapak «en çok 640 px» yükseklik sınırı olarak okundu.

## 59. Figma düzeltmeleri: mobil geri düğmesi, sol solma, lejant (tasarım)

29 Ekim 2026, §58'in üstüne.
- Mobil «Eser hakkında»: 231:2788'deki «Geri» elipsi (231:2791) 40 px yuvarlak düğme oldu (beyaz, #DAE1E2 çerçeve, içinde 20 px lucide chevron-left #141B2B; çerçeve 241:3316). 231:2813, 231:2854 ve 231:2877'deki «‹ Ulucami» hapları (240:3408, 240:3413, 240:3418) aynı düğmeyle değiştirildi (241:3319, 241:3323, 241:3327); sekme şeritleri 332 px oldu. Adlı hap yalnız masaüstünde (232:2788). Notlar 240:3474–3477 düzeltildi.
- Sekme şeridi başta durduğu için dört mobil ekranda «Solma sol» gizlendi (240:3406, 240:3411, 240:3416, 240:3421); sağdaki solma kaldı. Masaüstünde sol solma ve ok duruyor.
- Harita lejantı (1:563): «Akar» → «Ticari (akar)» (1:575); Su ve Eğitim duruyor.

## 60. Küre görünümü: ortalama ve arka plan (test-redmi9t-v2)

29 Ekim 2026.
- **Küre sola kayıyordu.** Masaüstünde bir eser seçilince harita, sağdaki eser kartına yer açmak için `easeTo({ padding:{ right:380 } })` ile kayıyor. MapLibre'de `easeTo`/`flyTo`'ya verilen padding kalıcıdır; eser bırakılınca sıfırlanmıyordu. Şehirlere uzaklaşınca küre, görünür alanın ortasından yaklaşık 190 px sola kalıyordu.
  - **Düzeltme:** «Şehirler» uçuşu padding'i sıfırlar. Fareyle uzaklaşırken de şehir görünümüne (zoom < 9) inildiğinde masaüstünde kalan padding 0,4 sn'de kaldırılır (`zoomend`).
  - Sınandı: seçimden sonra padding `right:380`, uzaklaşınca `0`.
- **Kürenin arkası:** Tuval kürenin dışında saydam; arkada sayfanın düz açık grisi görünüyordu. Artık `#harita` arka planı, 3D sahne zemininin aynı renkleri: şehir kaydından `kimlik.sahne_ust` → `sahne_alt` (#DDE4E5 → #A7B4B7), ortası açık, kenarları koyulaşan elips geçiş.
  - Neden bu renk: ISO 3664 nötr çevre ilkesi (doygun zemin kürenin renklerini kaydırır); uygulamanın açık arayüzüyle uyumlu; 3D sahneyle aynı dil; şehir değişince renk de değişir.
  - Koyu «uzay» zemini, açık panellerle çok sert kontrast yapacağı için seçilmedi.

## 61. Hikâye bitince tebrik kartı (rozet), «hikâye sonrası» sayfası kalktı (test-redmi9t-v2)

29 Ekim 2026, kullanıcı kararı: hikâye bitince ayrı sayfa yerine motive eden bir ödül kartı çıksın, sonra normal eser paneli gelsin; Dinle düğmesinde tamamlandı işareti olsun.

- **Akış:** Hikâyenin son bölümü biter, eser detayına dönülür (normal panel) ve üstünde **tebrik kartı** açılır.
  - Eski `#/son/<id>` adresi de esere yönlenir ve kartı açar.
  - `hikayeSonrasi()` artık kullanılmıyor.
- **Kart** (`tebrikGoster`), yukarıdan aşağı:
  - × düğmesi;
  - üstte şehir zemininde silik desen; arkada yavaşça dönen altın ışınlar; ortada 88 px rozet, «pop» animasyonuyla gelir;
  - «✓ Hikâye tamamlandı · 12 / 12 bölüm»;
  - başlık «Rozet kazandın: Ulucami'yi dinledin» (rozet yoksa «Ulucami'nin hikâyesini bitirdin»);
  - rozet metni;
  - «Ulucami'nin rozetleri k / n» ızgarası: yeni kazanılan sarı zeminli «Şimdi kazandın»; kazanılmayanlar soluk, altında koşulu («Görev: Minberin sırrı»);
  - düğmeler: varsa «🧩 Bulmacayı çöz · N rozet daha» (ana); rotadaysa «Sonraki durak: X →»; «Devam et» (kartı kapatır);
  - en altta «Bütün rozetlerime bak ›».
- **Davranış:** Puan yok, ödül rozettir.
  - Bu akışta alttaki rozet bandı çıkmaz (`rozetKontrol(e, true)`); rozeti kart gösterir.
  - Esc, × ya da dışına dokunmak kartı kapatır; ilk düğmeye odaklanır.
  - Hareket azaltılmışsa ışın ve pop animasyonu yok.
- **Tamamlandı işareti:** Hikâyesi biten eserde iki düğmenin sağ üst köşesinde yeşil ✓ rozeti (22 px, `--trust-verified`, beyaz çerçeve) çıkar: eser panelindeki ve mobil karttaki «Dinle», haritadaki kısa karttaki «Hikâyeyi başlat». Kısa karttaki düğmenin yazısı da «Yeniden dinle» olur.
- Sınama (Playwright, masaüstü ve mobil): Oku kipinde 12 bölüm ilerletildi. Kart açıldı, rozet 1/3 kazanıldı; Esc ile kapandı; panelde Dinle ✓; hata yok.
- **Figma:** «D · Hikâye sonrası» (1:2991) ve «WF · Eser / Hikâye sonrası» (1:6925) bu karta göre güncellenmeli.

## 62. Bedesten'e «İçini göster» (3D; v10)

29 Ekim 2026. İş emri: «AKAR 3D: İçini göster özelliğini üç esere ekle». Sıra Bedesten → Türbe → Orhan Bey Camii; bu madde yalnız Bedesten. Kullanıcı render'ları onaylayınca Türbe'ye geçilecek.
- **Model:** `bedesten_v10` (`build/build_v10.py` → `build_v10_ic.py` → `_kutuphane/blend_hat/uret.py`).
  - Gövde çatısı levhası `Dukkanlar`'dan ayrılıp `Govde_Ortu` oldu. Kubbelerin altına Ø 6,70 kasnak ağzı açıldı.
  - Govde'nin içi boşaltıldı.
  - Yeni parçalar: `Payeler`, `Kemerler`, `Ic_Dukkanlar` (32 mahzen ağzı), `Ic_Sokak`, `Sadirvan`.
  - Ölçü ve kaynaklar `3d/README.md` v10 tablosunda.
- **Gruplar:** `model.json` → `glb` `bedesten_v10`, `ortu_gruplari` [[Kubbeler], [Govde_Ortu]].
- **Palet:** yeni rol `aciklik` #3E4A55. Beş iç malzeme `eser_malzeme`'ye eklendi.
- **Sınama:**
  - Örtü yerindeyken görüntü v09 ile aynı (fark %0,009).
  - İlk denemede eski kapağın örtü eğiminden görünen 25 cm'lik şeridi kaybolmuştu (fark %0,5). Şerit, eski malzeme ve UV'siyle duvar üstü halkası olarak geri kondu.
  - Kemer uçları duvar yüzüyle aynı düzlemde titriyordu; 5 cm duvara gömüldü.
  - Referans denetimi c ve d geçti.
  - Üçgen 20 088 → 25 814 (sunum +5 726); uygulama GLB'si 160 → 197 KB.
- **İçerik:**
  - `hikaye.md`'ye «İç mekân (3D)» sütunu eklendi. Cümle 6 evet, vurgu `Payeler`; cümle 7 evet, vurgu `Ic_Dukkanlar`. Cümle metinleri değişmedi.
  - `parcalar_taslak.md`: `Govde_Ortu` «On dört kubbe» kartına; 5 iç parça satırı.
  - `modelleri-gom.py` çalıştırıldı.
- **Kontrol:** `kontrol/v10/icini_goster.png`, `ic_kaynak.png`, `tiklama_haritasi.png`.
