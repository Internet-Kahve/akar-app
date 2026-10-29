# AKAR · Prototipte olup üründe olmayanlar: ekran ekran tam liste (29 Ekim 2026)

**Kim için:** Tamer, Burak. Bu belge [`ENTEGRASYON_29EKIM.md`](ENTEGRASYON_29EKIM.md)'nin ekidir. O belge veriyi, içe aktarmayı ve şemayı anlatır. Bu belge arayüzü anlatır: her ekranda hangi düğme nerede, ne yapar ve üründe bugün ne var.

**Neyle karşılaştırıldı:**
- Prototip: `design/test-redmi9t-v2/` (`index.html`, `app.js`, `app.css`), 29 Ekim.
- Ürün: `origin/main` 50d873d. Okunan dosyalar: `apps/web/src/components/akar-app.tsx`, `scene.tsx`, `story-panel.tsx`, `history-view.tsx`, `heritage-map.tsx`, `interaction-modals.tsx`, `model-viewer.tsx`.
- «Ürün» sütunu bu dosyalara göre yazıldı. Arada yapılmış ve henüz push edilmemiş bir iş varsa bu belge onu bilmez.

**Tasarım kaynağı:** Figma `akar-yeni` (`HGTgq5vRXVqhVO9TcR9wBe`). 29 Ekim'de prototiple eşitlendi; değişen ekranların altında «29 Ekim: …» notu var.
- Ölçüler ve renkler prototipin `app.css` dosyasında ve `design/tokens.css`'te.
- **Ana referans Ulucami.** Bütün özellikler Ulucami'de dolu; diğer eserlerin verisi geldikçe aynı arayüz kendiliğinden dolar.

**Kısaltmalar:**
- **M** = masaüstü (genişlik > 900 px), **m** = mobil.
- **Ürün:** «yok» = hiç yok; «farklı» = başka biçimde var; «var» = aynı.

---

## 0. Genel düzen ve gezinme

| Öğe | Prototip | Ürün |
|---|---|---|
| Üst çubuk (M) | 64 px, beyaz, alt çizgi. **Solda** «AKAR» (700, 20 px, harf aralığı .04em). Yanında **arama** (420×40, çerçeveli): içinde büyüteç, «Eser, şehir veya rota ara» ve **sağ ucunda şehir hapı** («Bursa», açık mavi zemin). Hapa basınca küre görünümüne uçulur (§2.8). **En sağda** avatar → Profil. Üst çubukta sekme ya da gezinme düğmesi **yok**. | farklı: üst çubukta gezinme (Harita / Rotalar / Eserler / Evden gez) ve «Şehirler» açılır menüsü (modal) |
| Dil seçici | Avatarın solunda «TR \| EN» hapı (M: üst çubuk; m: arama çubuğunun içi). Bayrak yok, dil kodu; seçim saklanır. **Bütün içerik dile bağlı:** eser adı ve kısa metni, hikâye, parça kartları, fotoğraf başlıkları, Eser hakkında. Çevirisi olmayan metin Türkçe kalır; EN seçiliyken eksik varsa bir kez uyarı çıkar. İngilizce metinde ses de İngilizce okunur. Anlatım panelindeki dil etiketi seçimi gösterir. Biçim: `ICERIK_INGILIZCE.md`. | yok (ürünün `nameEn`, `textEn`, `titleEn` alanları var, arayüze bağlı değil) |
| Sol panel (M) | 420 px. Kapatma sekmesi **panelin sağ kenarına yapışık**: 24×48, üstten 16 px, sağı yuvarlak, ‹ simgesi. Kapanınca harita tam genişliğe yayılır ve `resize` edilir. | farklı: düğme sahnenin içinde, panel simgesiyle |
| Mobil düzen | Harita tam ekran. **Üstte** arama çubuğu; avatar çubuğun içinde sağda. Altında **yatay kaydırılan filtre çipleri**. **Altta sürüklenen sayfa** (Eserler \| Rotalar): <br>• üç durak: kapalı (yalnız tutamak, sekmeler ve «Bursa ▾ · 7 eser yakında»), yarım (%55), tam (%92); <br>• parmakla serbest yükseklik; kenara 48 px yaklaşınca oturur; <br>• tutamağa dokunmak kapalı ↔ yarım. <br>Sayfa yükseldikçe haritanın alt boşluğu (padding) da artar; pin sayfanın altında kalmaz. | yok: mobil gezinme çubuğu var, sürüklenen sayfa yok |
| Adresler (derin bağlantı) | `#/eser/<id>` · `#/anlat/<id>/dinle\|oku` · `#/son/<id>` · `#/hakkinda/<id>` · `#/gecmis/<id>/<i>` · `#/kamera/<id>/<i>` · `#/cekildi/<id>/<i>` · `#/gorev/<id>/<i>` · `#/profil` · `#/rota/<id>`. Geri tuşu çalışır; bağlantı paylaşılabilir. | farklı: görünüm durumu (view) var; ekran başına adres olup olmadığı denetlenmedi |
| Cihazda hatırlananlar | Son anlatım kipi (`akar.mod`), Fotoğraf/3D seçimi (`akar.gorunum`), fotoğraf sığdır/doldur (`akar.fotoKip`), hikâyede kalınan bölüm (`akar.ilerleme.<id>`), biten hikâye (`akar.bitti.<id>`), rota ilerlemesi (`akar.rota`), görev (`akar.gorev.<id>` = evden/yerinde), rozet (`akar.rozet.<id>`). Girişte hesaba taşınmalı. | farklı: ilerleme hesapta; bu anahtarların karşılıkları ayrıca eşlenmeli |

## 1. Açılış ve yükleme

| Öğe | Prototip | Ürün |
|---|---|---|
| Açılış ekranı | Tam ekran, `--bg`. Arkada şehrin deseni %8. Ortada 96 px altın amblem çizgi çizgi çizilir. Altında «AKAR», şehir adı (serif 34 px, şehir renginde) ve «Vakıf eserleri yükleniyor». Harita ilk kez çizilince 0,28 sn'de solarak kalkar (en geç 8 sn). | farklı: düz «Keşif hazırlanıyor…» yazısı |
| 3D yükleme kartı | Sahnenin ortasında beyaz kart (en çok 380 px). İçinde 44 px amblem, «3D model yükleniyor · %NN», 6 px çubuk ve «x MB / y MB. Bu sırada Dinle ya da Oku ile başlayabilirsin…». Yüzde ve MB gerçek indirmeden gelir; yüzde gelmeden çubuk belirsiz akar. Arkada şehir deseni. | farklı: «3B görünüm hazırlanıyor…» yazısı |
| Hareket azaltma | Amblem çizili durur; ekrana giren öğeler belirmeden görünür. | denetlenmedi |

## 2. Keşif haritası

| Öğe | Prototip | Ürün |
|---|---|---|
| Açılış kamerası | Şehir kaydından: `merkez`, `zoom` (m 16,3 / M 16,7). Eğim 55°, yön −12°. | farklı: düz (eğim 0), zoom 16 |
| Kontroller | **Sağda dikey dizi** (M: dikeyde ortada, sağdan 24 px; m: sağdan 16 px). Yukarıdan aşağı: <br>1. **+ / −** tek hap (44 px); <br>2. **Konum** (44 px daire); <br>3. **Pusula dairesi** (M 72 px, m 44 px). <br>Pusula dairesinin davranışı: <br>• halkada kırmızı kuzey üçgeni ve «K» harfi, harita döndükçe döner; <br>• ortadaki yazı gidilecek kipi söyler (eğikken «2D», düzken «3D»); <br>• dokununca eğik ↔ düz geçer; <br>• **halka parmakla/fareyle sürüklenince harita döner**; <br>• kullanıcı haritayı elle döndürdüyse ilk dokunuş yalnız kuzeyi yukarı getirir. | farklı: ayrı ayrı katman, pusula, konum, +/− ve sıfırla düğmeleri |
| Konum | Konum izni yoksa «Konum izni yok · Evden gez: Bursa» uyarısı çıkar ve harita şehir merkezine gider. | farklı |
| Filtre çipleri | **m:** üstte arama çubuğunun altında. **M:** haritanın sol üstünde ve panelde. <br>• **m:** ilk çip koyu «➤ Yakınımda ▾» (konuma gider). <br>• **M (panel):** ilk çip «Tümü». <br>• Sonra **rol çipleri**, renkli noktalı: Dinî (yeşil), Ticari (akar) (kahve). Yalnız şehirde eseri olan roller görünür. <br>• Davranış: ilk dokunuş yalnız o rolü bırakır, sonraki dokunuşlar ekler/çıkarır; hepsi kalkarsa hepsi seçilir. <br>• Her çipin ipucunda açıklama var. | farklı: türe göre (Cami, Türbe…) filtre; rol filtresi yok |
| Pinler | MapLibre **symbol katmanı** (HTML marker değil). <br>• Kemer biçimli pin; renk role göre, simge türe göre (cami, han, hamam, türbe). <br>• **Seçili pin:** 1,25× ve altın halka (Figma 1:548). <br>• Hikâyesi biten eser: ✓. <br>• Ad yanında etiket olarak durur; yer yoksa öbür yana geçer. <br>• Önemli eser önce çizilir (`eser.json → sira`). <br>• Yakınlaştıkça pin %80'den %66'ya küçülür. | farklı: HTML marker, türe göre Figma pin görseli, rotadaysa numara |
| Modele dokunma | Modelin taban izine dokunmak pine dokunmakla aynı. Masaüstünde imleç el olur. | var (§11.35) |
| Seçim → kısa kart | Esere dokununca (pin, model ya da listede satır): <br>• **harita esere uçar** (zoom ≥ 17); <br>• **M:** pinin sağında **yüzen kart** (360 px, pini izler): 96 px fotoğraf, serif ad 24 px, «yıl · yaptıran», güven etiketi, kısa açıklama, **«🎧 Hikâyeyi başlat · N dk»** ana düğmesi ve yanında **Rotama ekle** (bookmark-plus) simge düğmesi, sağ üstte ×; <br>• **m:** aynı kart alttan çıkar (88 px fotoğraf, ad 20 px); **aşağı kaydırınca kapanır**; <br>• karta (fotoğraf/ad) dokunmak **eser detayını** açar; «Hikâyeyi başlat» doğrudan anlatıma gider. | yok: pine dokunmak doğrudan detayı açıyor; ara kart yok |
| Liste (Eserler sekmesi) | Sekmeler «Eserler \| Rotalar» (hap biçimli). <br>• Başlık satırı: «Yakınındaki eserler · N», sağda «Tümünü gör (N) ›». <br>• Satır: 64 px fotoğraf (8 px köşe), ad 16 px, meta, **sağda yuvarlak «+»** (Rotama ekle). <br>• Seçili satır açık mavi zeminli. <br>• Sonuç yoksa: «Sonuç yok. Yazımı kontrol et ya da filtreleri temizle.» <br>• M panel altında «Tüm eserleri gör (N)». | farklı: «Keşfedilecek eserler», tür filtresi, kaydedilenler düğmesi |
| Rotalar sekmesi | «Yakınındaki rotalar», rota kartı: 72 px fotoğraf, ad, «4 durak · ~10 dk · 0,5 km», durum hapı «Başlanmadı» ya da «Devam et · 2/4». | farklı: rota kartları, «Kendi rotanı oluştur» |
| Küre ve şehirler | Zoom 9'un altında pinler yerine **şehir işaretleri**: <br>• Bursa: altın nokta, «Bursa · 7 eser»; dokununca şehre uçar; <br>• Hatay, Konya, Kütahya: gri nokta, «Yakında»; dokununca envanter künyesi uyarısı. <br>Diğer ayrıntılar: <br>• zoom 3,2'nin altında yalnız noktalar; <br>• **küre ortalı**: eser kartı için verilen padding sıfırlanır; <br>• kürenin arkası şehir sahne renginde elips geçiş; <br>• gökyüzü ve atmosfer uzakta görünür. | yok |
| OSM binaları | Ürünle aynı kural (bkz. ENTEGRASYON §4). | var |
| Model ışığı, yer gölgesi, renk doygunluğu | Şehir kaydından (`harita_isik`). | farklı: sabit |

## 3. Eser detayı

| Öğe | Prototip | Ürün |
|---|---|---|
| Sol panel (M), yukarıdan aşağı | 1. «‹ Harita»: 32 px yuvarlak ‹ ve soluk «Harita» yazısı. <br>2. Serif ad (32/38). <br>3. «1399 · Yıldırım Bayezid». <br>4. Altın süsleme çizgisi. <br>5. Kısa açıklama. <br>6. «Yapının hikâyesi · 12 bölüm». <br>7. İki düğme: **«🎧 Dinle · N dk»** (ana, geniş) ve **«📖 Oku»** (ikincil). <br>8. Üç **satır bağlantısı** (çerçeveli, sağda ›): «Eser hakkında / Tarihçe, mimari, kaynaklar»; «Geçmişi Gör / N eski fotoğraf»; «Bulmaca / N görev · k tamam». <br>9. Panelin dibinde (rotadaysa) çerçeveli «Sonraki durak: Bedesten →». | farklı: «Haritaya dön», tür etiketi + kaydet, «Kaynaklı içerik» etiketi, dk/bölüm bilgisi, «Hikâyeyi dinle / Oku», 2×2 deneyim ızgarası (Geçmişi Gör, İz Bırak, [Bulmaca, Birlikte Gez deneysel]), «Eser hakkında» (modal), «Yaşayan hafıza», altta «Rotama ekle» ve «Yanındayım» |
| Mobil eser kartı | Sahnenin üstünde **altta sürüklenen kart**. <br>• **Kapalı:** tutamak, ad (serif 32), Dinle \| Oku, üç kısayol düğmesi («ⓘ Hakkında», «⟲ Geçmiş N», «🧩 Bulmaca N»), rotadaysa «Sonraki durak». <br>• **Açınca:** meta, süsleme, kısa açıklama, bölüm sayısı. <br>• Parmakla serbest yükseklik (en çok ekranın %75'i); tutamağa dokunmak kapalı ↔ açık; klavyeyle Enter/Boşluk. <br>• Üstte solda «‹ Harita» hapı, sağda görünüm seçici. | yok |
| Görünüm seçici | **Sağ üstte** (M: sağdan 24 px; m: sağ üst). <br>• Hap içinde «🖼 Fotoğraf \| ▣ 3D»; seçili olan mavi. <br>• Yanında **yuvarlak «Tıklanabilir parçaları göster»** düğmesi (işaretçi simgesi): basınca 3D'ye geçer, tıklanabilir parçalar **sırayla, dağınık zamanlarda** sarı yanıp söner (her biri 0,7 sn). <br>• Seçim cihazda hatırlanır. | farklı: «3B model \| Fotoğraf» düğmeleri; parça gösterme yok |
| Fotoğraf görünümü | **Galeri ızgarası**: iki sıra; her üçüncü fotoğraf iki sırayı kaplar (büyük). <br>• Genişlikler: M 560 / 340 px; m 262 / 180 px. <br>• Yatay kaydırma, mıknatıslı; soldaki boşluk sabit (m 16, M 24 px). <br>• M'de iki yanda ‹ › okları. <br>• İlk fotoğrafta güven etiketi. <br>• Her fotoğrafta **büyüt** düğmesi; dokununca **ışık kutusu** ve künye «başlık · kaynak». | farklı: tek kapak fotoğrafı ve künye |
| 3D görünümü, yerleşim | • **Üst ortada** ipucu hapı: «✥ Sürükle: döndür · Tekerlek: yakınlaştır · Dokun: parça» (mobilde «İki parmak: yakınlaştır»). <br>• **Sol üstte** «● 3D model · Temsili ⓘ» (mobilde kartın üstünde). <br>• **Sağ altta** «⌃ İçini göster» hapı (yalnız örtü grubu olan eserde); açınca sarı zemin ve «Dışını göster». <br>• **Alt ortada** seçili parçanın adı (koyu hap). <br>• Zemin şehir renginde geçiş; yer gölgesi. | farklı: döndürülebilir model ve künye yazısı; diğerleri yok |
| 3D görünümü, davranış | • Açılış açısı: azimut 30°, eğim 28°, bütün yapı kadrajda (mobilde kartın üstünde kalan alana göre). <br>• Parçaya dokununca **parça kartı**. <br>• Kartın bütün parçaları birlikte sarı. <br>• Fare üstündeyken hafif sarı, imleç el, ipucu. <br>• İçini göster: gruplar yukarıdan aşağı kalkar, kamera 58°'ye yükselir. | yok |
| Parça kartı | Ortada modal (arkası karartılır; dışına dokununca ya da Esc ile kapanır). <br>• **Üstte** yana kaydırılan fotoğraflar (altında nokta göstergesi) ve **sağ üstte ×**. <br>• Altında başlık (serif) ve güven etiketi; **sağda yuvarlak «🔊 Sesli dinle»** (çalarken ■). Anlatım çalıyorsa önce o susar. <br>• Kayan metin, «Kaynak: …», fotoğraf künyesi. | yok |
| Görev bandı | «3D modelde bul» görevinde sahnede bant: «👆 Görev: …» ve ×. Yanlış parçaya dokununca «Bu cepheler. Aradığın başka bir yer.» uyarısı. | yok |

## 4. Anlatım (Dinle | Oku)

| Öğe | Prototip | Ürün |
|---|---|---|
| M · sol panel | • Üstte **×** (36 px; eser detayına döner), **Dinle \| Oku** sekmesi, «TR ▾» dil seçici. <br>• **Numaralı cümle listesi**: her cümlede güven etiketi; aktif cümle vurgulu; dokununca o cümleye gider. <br>• **Altta oynatıcı**: solda «0:00 / 3:12» geçen/toplam süre, ortada ⏮ ▶ ⏭, sağda hız «1x» (1 → 1,25 → 1,5). | farklı: «Panel \| Altyazı» düzen seçici, Dinle/Oku, «sade anlatım» anahtarı, hız, önceki/sonraki |
| M · sağ sahne | Fotoğraf ya da 3D. <br>• **Üstte boydan boya ilerleme çubuğu**: bölüm başına bir parça, tıklanır. <br>• **Sağ üstte** görünüm seçici ve (fotoğrafta) **«⤢ Ekranı doldur»** (sığdır ↔ doldur, hatırlanır). <br>• Fotoğraf: bulanık arka plan + ortada fotoğraf; altta güven etiketi ve künye. **Çalarken 3 sn sonra kontroller gizlenir**, dokununca ya da fare oynayınca geri gelir. | farklı: cümlenin fotoğrafı; ilerleme çubuğu, doldur ve gizlenme yok |
| 3D'de anlatım | Her cümlede: <br>• **kamera** cümlenin açısına döner (`hikaye.md` ikinci tablo); <br>• vurgulanan parçalar **altın nabızla** yanar; <br>• «İç mekân» cümlesinde örtü kalkar; <br>• kartlı cümlede fotoğraf kartı modeldeki parçaya bağlı yüzer. | yok: `story_blocks.camera` alanı var, kullanılmıyor |
| m · düzen | • **Üstte**: solda ×, sağda seçici ve doldur. <br>• **Altta hikâye kartı**: tutamak; «3 / 12» sayacı ve güven etiketi; cümle; «Kaynak: … ›»; oynatıcı (solda «Oku»/«Dinle» geçişi, ortada ⏮ ▶ ⏭, sağda hız). <br>• Tutamakla yukarı çekince **cümle sayfası** açılır: Dinle \| Oku sekmesi, liste, oynatıcı; sahne üstte 360 px'e iner. | farklı |
| Oku kipi | Liste kaydırıldıkça **ekranın ortasındaki cümle** sahneyi yönetir: fotoğraf değişir, 3D döner. | denetlenmedi |
| Klavye | Boşluk / ↓ ileri ya da oynat; ↑ geri; Esc çık. | denetlenmedi |
| Kaldığı yerden | Hikâye son dinlenen bölümden açılır; ses Android'de takılırsa süre tahminiyle ilerler. | denetlenmedi |

## 5. Hikâye sonrası: tebrik kartı

| Öğe | Prototip | Ürün |
|---|---|---|
| Akış | Son bölüm biter, **eser detayına dönülür** (normal panel) ve üstünde **tebrik kartı** açılır. Ayrı «hikâye sonrası» sayfası yok (29 Ekim kararı). | farklı: toast «Hikâye tamamlandı.» ve detaya dönüş |
| Kart | Ortada modal (en çok 440 px; arkası karartılır), sağ üstte ×. <br>• Üstte 168 px sahne: şehir zemini, silik desen, yavaşça dönen altın ışınlar, ortada 88 px rozet («pop» ile gelir). <br>• «✓ Hikâye tamamlandı · 12 / 12 bölüm» hapı. <br>• Başlık (serif 26): «Rozet kazandın: Ulucami'yi dinledin». <br>• Rozet metni. <br>• **«Ulucami'nin rozetleri k / n»** ızgarası: yeni kazanılan sarı zeminli «Şimdi kazandın»; kazanılmayanlar soluk, altında koşulu. <br>• Düğmeler (alt alta, tam genişlik): «🧩 Bulmacayı çöz · N rozet daha» (ana, görev kaldıysa); «Sonraki durak: X →» (rotadaysa); «Devam et» (kapatır). <br>• «Bütün rozetlerime bak ›». <br>• Esc / × / dışına dokunma kapatır. Puan yok; ödül rozettir. Bu akışta alt rozet bandı çıkmaz. | yok |
| Tamamlandı işareti | Hikâyesi biten eserde iki düğmenin **sağ üst köşesinde yeşil ✓** (22 px daire, beyaz çerçeve): <br>• «Dinle» (eser paneli, mobil kart); <br>• «Hikâyeyi başlat» (kısa kart); yazısı da «Yeniden dinle» olur. <br>Haritadaki pin de ✓ olur. | farklı: «Ziyaret edildi» / okundu bilgisi var, düğmede işaret yok |

## 6. Eser hakkında

Tam sayfa okuma düzeni; ayrıntılar ENTEGRASYON §5.4 ve §5.10'da. Kısaca:
- kapak (envanterin açılış fotoğrafı, şehir renginde panel, desen);
- **yapışık bölüm sekmeleri ve okuma çubuğu**;
- her bölümde özet, rakam kartları, büyük alıntı, zaman çizelgesi;
- «Derinine in» ile tam metin: kitabe/ayet kartları, kırpılmayan fotoğraf şeridi, terime dokununca kitaptaki tanım;
- sonda kaynaklar ve sonraki adımlar;
- M'de sağda **yapışık 3D**: okunan bölüme göre döner, ilgili parçalar parlar.

**Ürün:** farklı. Modal içinde tanım, «Dönem / Mimar / Konum» ve bölüm metinleri.

## 7. Geçmişi Gör

| Öğe | Prototip | Ürün |
|---|---|---|
| Başlık | Solda ‹ (eser detayına), yanında «Geçmişi Gör» ve eser adı. M'de tam sayfa (sol panel gizlenir). | farklı: «AYNI YER, BAŞKA BİR ZAMAN» başlıklı sayfa |
| Ana fotoğraf | Bulanık arka plan + ortada fotoğraf, kendi oranında. <br>• Sağ üstte «3 / 21» sayacı; güven etiketi. <br>• M'de iki yanda ‹ › okları; m'de sağa/sola kaydırma. <br>• **m: altta «📷 Kamerayı aç».** <br>• ND lisanslı fotoğraf kırpılmaz ve düzenlenmez. | farklı: fotoğraf ve künye |
| Bugünkü eş (kaydırıcı) | Eşi olan fotoğrafta ana görsel **kaydırıcı** olur: solda eski, sağda bugün; ortada «‹ ›» tutamaklı dikey çizgi (klavyeyle de). Köşe etiketleri: tarih ve «Bugün». Açı birebir değilse «Yakın açı: iki fotoğraf birebir aynı noktadan çekilmedi.» notu. | yok: «bugünkü eş görüntüsü henüz eklenmedi» notu |
| Küçük resim şeridi | Başlık «Eski fotoğraflar · N». Her küçük resimde tarih, tür (Fotoğraf / İç mekân) ve bugünkü eşi varsa küçük işaret. Seçili resim şeridin ortasına gelir. | var (zaman şeridi) |
| «Nereden çekildi?» ve mini harita | **M:** sağ kartta bilgi, «📍 Nereden çekildi?» ve açılır mini harita. **m:** alt sayfada aynısı, altında «Kamerayı aç». <br>• Harita: çekim noktası ve **görüş konisi**. Eserin fotoğrafları yeşil, bölgedeki diğer eski fotoğraflar gri; lejant var. <br>• Çekim yeri bilinmiyorsa: «Bu fotoğrafın çekim yeri bilinmiyor. Kamerayı açıp eski fotoğrafı yine de hizalayabilirsin.» | yok |
| Eski görüntü yok | «Bu eserin eski görüntüsü henüz yok…». Altında **«Uzaktan görünüyor»** listesi: başka eserlerin fotoğraflarından, bu eserin görüş konisine girdiği en yakın 4 tanesi, «N m uzaktan ›». Ayrıca «+ İz Bırak · eski fotoğraf paylaş». | farklı: «Bir fotoğraf paylaş» |
| Kamera | Tam ekran. <br>• **Üstte** × ve «Ulucami · 1890'lar». <br>• Canlı kamera; üstünde eski fotoğraf %50 saydam; **iki parmakla büyüt/sürükle**. <br>• «Eski fotoğrafı görüntüyle çakıştır» ipucu; **«Eski —○— Bugün»** saydamlık kaydırıcısı. <br>• **Altta** solda eski fotoğrafın küçüğü, ortada deklanşör, sağda «Galeri». <br>• **İzin yoksa** kutu: «Kameraya izin verilmedi», «Tekrar dene», «Galeriden seç». <br>• **İç mekân fotoğrafında** önce uyarı: namaz vaktinde çekme, yüz çekme, flaş yok, «Anladım». | yok |
| Çekildi | «Kaydırıcı \| Yan yana» sekmesi; senin fotoğrafın ve eski fotoğraf karşılaştırılır. Altında «İz Bırak olarak gönder» (ana), «Paylaş» ve «Tekrar çek» (koyu, yan yana), «Paylaşılan görselde kaynak satırı otomatik yazılır.» | yok |

## 8. Bulmaca ve saha görevi

| Öğe | Prototip | Ürün |
|---|---|---|
| Kap | **m:** tam ekran. Üstte ‹ (esere), «Bulmaca / Ulucami», sağda «1 / 2» sayacı. **M:** ortada modal, sağ üstte ×. Esc kapatır. | farklı: deneysel `QuizModal` |
| Soru | Üstte görsel (künyeli). Soru (serif); altında «Fotoğrafa bak; cevabı hikâyede de duydun.» <br>• **4 şık** (radyo, ok tuşlarıyla gezilir). <br>• **İki ipucu düğmesi**: ikincisi birinciden sonra açılır, kilitliyken «1. ipucundan sonra açılır». <br>• Altta «Cevapla» (şık seçilince açılır) ve «Bu soruyu atla». | farklı |
| Sonuç | **Doğru:** yeşil ✓, «Doğru! Kündekâri.», açıklama, güven etiketi + kaynak, (yerindeyse «Yerinde» etiketi), rozet kazandıysa rozet kutusu; «Sonraki görev · 2/2» ya da «Rozetlerime bak»; «Ulucami'ye dön». <br>**Yanlış:** «?», «Tam değil, bir daha bak», yeni ipucu açılır, şıklar hafifçe sarsılır; «Tekrar dene», «Cevabı göster». | farklı |
| Saha görevi | Başlık ve görev metni; iki kutu yan yana: <br>• **«📍 Yerindeysen»**: «Buradayım» düğmesi; konum ≤ 80 m ise tamam, değilse «yaklaşık 120 m uzaktasın» uyarısı; https gerekir. <br>• **«▣ Evdeysen»**: «3D modelde bul»; eser 3D'ye gider, görev bandı çıkar, doğru parçaya dokunmak görevi bitirir. | farklı: «Yanındayım» ziyaret doğrulaması var; saha görevi yok |
| Rozet bildirimi | Alttan kayan bant (4,5 sn): yıldız rozet simgesi, «Rozet kazandın · Kündekâri», kısa metin, › (profile). Sırayla gösterilir; ekran okuyucuya duyurulur. | farklı: rota rozeti |
| Puan | **Yok** (tasarım kararı; süre ve ceza da yok). | farklı: puan defteri var (konuşulmalı) |

## 9. Profil

| Öğe | Prototip | Ürün |
|---|---|---|
| Düzen | **M:** solda kimlik kutusu, sağda bölümler. **m:** üstte ‹ ve «Profil», kaydırmalı. | farklı: «Mirasım» |
| Kimlik | Yuvarlak avatar, «Misafir», «★ N rozet», «N eser keşfedildi · N görev», süsleme, «İlerlemen bu cihazda saklanıyor. Giriş yapınca hesabına taşınır.» | farklı |
| Keşfettiklerim | Eser başına: «✓ Hikâye tamamlandı · Görev 1/2» ya da «4/12 bölüm», sağda «Devam et ›» ya da «Tekrar göz at ›». Boşsa yönlendirme metni. | farklı |
| Rozetler | Izgara: kazanılan renkli, kazanılmayan soluk. Kazanılmayanın altında koşulu yazar («Hikâyeyi sonuna kadar dinle…»). «k / n» sayacı. | farklı |
| Sıfırla | «Bu cihazdaki ilerlemeyi sil»; iki adımlı onay: «Emin misin? Silmek için tekrar dokun». | farklı: «Demo verileri sıfırlansın mı?» |

## 10. Rota

| Öğe | Prototip | Ürün |
|---|---|---|
| Haritada | Duraklar arası **kesik çizgi** (şehir rengi #22566E, 4 px). Eser pinleri gizlenir; yerine **numaralı sekiz köşeli yıldız** işaretler (36 px, şehir renginde); dokununca esere gider. Rota ekrana sığdırılır. | farklı: pinlerde numara, şematik çizgi |
| Panel | **M:** «‹ Tüm rotalar», kapak (160 px). Ad (serif 26), «4 durak · ~10 dk · 0,5 km · Kolay», açıklama. **Durak listesi**: yıldız numara, ad, yıl. <br>Altta «Rotayı başlat» ya da **«Devam et · 2 / 4»**, ve **«Evden gez · konum gerekmez»**. <br>**m:** alt sayfa %58'de açılır; sol üstte ‹. | farklı: «KÜRATÖRLÜ KEŞİF», durak listesi, «Rotayı başlat»; «Evden gez» ve devam yok |
| Rotadayken | Eser detayında ve hikâye sonrasında «Sonraki durak: X →»; son durakta «Rota tamamlandı · Rotaya dön». | yok |

## 11. Ortak bileşenler ve durumlar

- **Güven etiketi:** Doğrulanmış / Tarihsel çıkarım / Temsili, yanında ⓘ. Fotoğrafta, cümlede, kartta, görevde. Ürün: var (`Tag`).
- **Süsleme** (altın çizgi ve baklava): yalnız Figma'nın saydığı yerlerde, yani eser detay başlığı, hikâye sonrası, profil, Eser hakkında bölüm araları.
- **Toast** (alt ortada, kısa): «Ulucami Rotam'a eklendi», konum uyarıları, «Bu cihazdaki ilerleme silindi.».
- **Erişilebilirlik:** her ikon düğmede `aria-label`; sekme/radyo rolleri; Esc ile kapanan modaller; ok tuşlarıyla şık; `prefers-reduced-motion`; odak halkası 2 px `--primary`.
- **İkonlar:** lucide. Büyüt `expand`, ekranı doldur `expand`/`shrink`, parçaları göster `pointer`, kamera `camera`, geçmiş `history`.

## 12. Önerilen sıra (finale kadar)

Hepsi gerekmiyor. Jürinin göreceği akışa göre öneri:
1. İçe aktarmayı v2'ye geçir (ENTEGRASYON §1); bu olmadan hiçbir şey ürüne gelmez.
2. Haritada **seçim → kısa kart** adımı ve pusula dairesi (§2).
3. Eser detayında Fotoğraf \| 3D seçici, **3D parça kartı**, **İçini göster** (§3).
4. Anlatımda 3D kamera ve vurgu (§4).
5. Eser hakkında okuma düzeni (§6).
6. Geçmişi Gör kaydırıcısı ve mini harita (§7). Kamera ve «Çekildi» telefonda demo için iyi, ama en son.
7. Görev, rozet, profil (§8–9). Puan kararı önce konuşulsun.
