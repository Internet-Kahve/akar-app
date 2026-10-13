# AKAR · Tam bağlam metni (başka bir yapay zekâ için)

*Hazırlanma: 11 Ekim 2026, güncelleme 13 Ekim 2026 (bkz. §0.5). Bu metin, Muhammed'in Claude ile haftalardır yürüttüğü sohbetlerin ayrıntılı özetidir. Amaç, bu metni okuyan yapay zekânın projeyi, kararları, gerekçeleri ve açık soruları eksiksiz bilmesi. Bilinmeyen ya da doğrulanmamış şeyler açıkça işaretlendi.*

---

## 0. Bu metni okuyan yapay zekâya not

- Muhammed ile **Türkçe** konuş. Kısa ve net yaz; "dolambaç yapma" diye birkaç kez uyardı. Önce cevabı ver, sonra gerekiyorsa ayrıntı ekle.
- Dürüst eleştiri istiyor; övgü değil. Fikri zayıfsa söyle, gerekçesini ver.
- **Kapsam şişmesi** en büyük risk. Yeni özellik önerirken "bu final demosuna yetişir mi?" sorusunu sor.
- Tarihî bilgi uydurma. Emin değilsen "doğrulanmalı" de. Projenin bütün farkı güvenilirlik.
- Ekip arkadaşlarına gidecek belgelerin **yapay zekâ yazmış gibi görünmemesini** istiyor: sade, insanca, abartısız.
- Teknik terimler İngilizce kalabilir (PWA, three.js, RLS). Açıklamalar Türkçe.
- Muhammed tasarımcı (grafik ve tekstil desinatörü). HTML, CSS, SCSS ve Bootstrap biliyor; yazılım geliştirmeyi öğreniyor. JavaScript, React ve 3D konularında adım adım ve örnekle anlat.

---

## 0.5 · 13 Ekim güncellemesi (önce bunu oku)

Bu bölüm aşağıdaki bazı bölümlerin yerini alır. Çelişki varsa burası ve `belgeler/FRONTEND_BACKEND_NOTLARI.md` geçerlidir.

**Değişen kararlar**
- **Şehir: Bursa.** Karaköy–Tophane (Kılıç Ali Paşa) örneği bırakıldı. Vakıf Katılım envanter kitapları geldi (Bursa 3 cilt / 385 eser, Konya 2 cilt / 289, Hatay 1 cilt / 117; Kütahya 141 bilgi notunda, kitabı yok; İzmir/Manisa sürüyor). En çok veri Bursa'da, şehir de gündemde.
- **Ana hikâye:** Ulucami (hayrat) + Bedesten (akar). Kaynak: "Yıldırım Bayezid tarafından Ulucami'ye gelir sağlamak amacıyla yaptırılan Bedesten…" (Bursa Envanteri, Cilt 1). İkinci akar zinciri: 1360 vakfiyesine göre Eski Bedesten, dükkânlar ve Bıçakçılar Hamamı Orhan Gazi İmareti'ne vakfedilmiş.
- **Örnek rota:** Hanlar Bölgesi Vakıf Yürüyüşü: Ulucami (1399) → Koza Hanı (1491, II. Bayezid) → Orhan Gazi Camii (1339). Kesin değil.
- **3D:** Ayasofya pilotu (12–13 Ekim, v19) kapandı. Yöntem pilotuydu, demoda ana eser değil. Dersler `3d-eser/AKAR_3D_Yontem_Notlari.md`. Bütçe artık ≤ 40k üçgen (eski 15k sınırı geçersiz; 25k Redmi 9T'de ~60 FPS). Sıradaki: Ulucami + Bedesten, sonra Koza Hanı.
- **Yönetim paneli:** tek akış. Yeni eser → 1 Model → 2 Bilgiler → 3 Kaynaklar → 4 Hikâye → 5 Yayın; 3D önizleme hep sağda. Hikâyede her cümle: açıyı kendimiz kaydediyoruz (daireye basınca o açıya dönüyor), kart ekliyoruz, parçayı vurguluyoruz. Ortak ekranlar: Kartlar, Rota düzenle, İçe aktar, Katkı moderasyonu.
- **Tasarım:** kitapların görsel dilinden şehir desenleri (kendi üretimimiz: Bursa 8 kollu yıldız, Konya 12 kollu gülbezek, AKAR amblemi), şehir aksanı rengi (`--sehir-aksan`; butonlar değişmez), rota durağı = 8 kollu yıldız. Masaüstü harita kontrolleri sağda dikey ortada. Rumi motifini Muhammed elle çizecek.
- **Figma:** tüm örnek içerik Bursa'ya çevrildi (Ulucami, Bedesten, Koza Hanı, Orhan Gazi Camii; şehir listesi Bursa/Konya/Hatay/Kütahya/İzmir).

**Eskiyen bölümler:** §3 ve §6'daki Karaköy açılışı, §9 hero model (Kılıç Ali Paşa), §10 örnek içerik ve rota, §13'teki Tophane doğrulamaları, §14 demo akışı (eser adları), §15 açık işlerin bir kısmı. Mantık aynı kaldı, sadece eser ve şehir değişti.

**Ulucami için kitaptaki bilgiler** (Bursa Vakıf Eserleri Envanteri, Cilt 1, s. 37; anlatıda sayfayla kaynak gösterilecek)
- Adres: Osmangazi ilçesi, Şehreküstü Mahallesi, Atatürk Caddesi, Cami Sokak.
- Osmanlı'nın Bursa'da yaptırdığı ilk büyük cami; altı yüzyıl şehrin en büyük camisi kaldı.
- Evliya Çelebi Seyahatnâme'de "Bursa'nın Ayasofyası" der.
- Üç yıl süren inşaatın ardından 1399'da bir cuma günü açıldı.
- Açılışta Somuncu Baba (Hamîdüddîn-i Aksarâyî) bulundu, Fatiha'yı yedi farklı düzeyde tefsir etti.
- İlk imamı, Mevlid olarak bilinen Vesîletü'n-Necât'ın yazarı Süleyman Çelebi.
- Figma'daki örnek 6 cümle: 1399 Yıldırım Bayezid · Bayezid dördüncü padişah · mimarı kesin bilinmiyor · yirmi kubbe · açık kubbeli şadırvan · Bedesten'in geliri Ulucami'ye. (Final öncesi kitapla tek tek kontrol edilecek.)

---

## 1. Kim, ne, ne zaman

**Muhammed:** İstanbul'da yaşıyor. Grafik ve tekstil tasarımcısı, 42 İstanbul öğrencisi. Takımın kaptanı ve UX/UI tasarımcısı. Harita tasarımını ve 3D'yi de kendisi üstlendi.

**Yarışma:** KÖK&KOD / ROOT&CODE Hackathon.
- Düzenleyenler: 42 Türkiye, Vakıf Katılım (katılım bankası, sponsor) ve Bilişim Vadisi.
- Konu: Türkiye'deki vakıf eserlerini dijital çözümlerle daha erişilebilir ve etkileşimli hâle getirmek.

**Takvim:**

| Tarih | Olay |
|---|---|
| 3 Ekim 2026 | Başvuru son günü. Takım 2 Ekim'de başvurdu (3 sayfalık "Team Introduction and Idea Description" PDF'i, Canva'da düzenlendi). |
| 7–8 Ekim | Finalistler açıklandı. **İnternet Kahve, 57 takım içinden finale kalan 25 takımdan biri.** |
| 8–9 Ekim | Online kick-off; veri seti paylaşılacaktı (takım henüz ayrıntısını görmedi). |
| 8 Ekim – 7/8 Kasım | Online geliştirme dönemi. |
| **7–8 Kasım 2026** | Yüz yüze final ve ödül töreni, Bilişim Vadisi (İstanbul). |

**Jüri (7 kişi):** 2 Bilişim Vadisi, 2 Vakıf Katılım, 2 bağımsız, 1 Vakıflar Genel Müdürlüğü (VGM).
**Ödüller (kişi başı):** 1. MacBook Air M5 13", 2. iPad Air M4 13", 3. iPad 11".

**Takım "İnternet Kahve" (4 kişi):**

| Kişi | Rol |
|---|---|
| Muhammed | Kaptan (resmî iletişim), UX/UI, harita tasarımı, 3D |
| Burak | Mimari ve güvenlik |
| Mustafa | Ürün yönetimi ve frontend (Figma'dan kodlayacak) |
| Talha | Veri ve doğrulama |

- GitHub organizasyonu: `Internet-Kahve`.
- Hepsinin paralel 42 Common Core yükü var.
- 3D ve performans için ayrı bir sorumlu atanmadı; bu iş Muhammed'de. Risk olarak işaretlendi.

---

## 2. Fikrin geçmişi (nereden nereye geldi)

1. **İlk fikir (Eylül):** Pokémon GO tarzı bir oyun. Oyuncu vakıf eserlerine gidip o yerle ilişkili tarihî kişilerin kartlarını topluyordu (Süleymaniye'de Mimar Sinan gibi). Kamera üzerinde karakter yakalama demosu (`kamera-demo.html`) yapıldı.
2. **KATMAN:** Takımdaki bir arkadaşın ayrıntılı ürün dokümanı. İçinde katmanlı içerik (Tier 1/Tier 2/Hero), güven etiketleri, yönetim paneli ve demo B planları vardı. Karar: "KATMAN'ın iskeleti, AKAR'ın kalbi." İki fikir birleştirildi.
3. **Karaköy–Tophane odağı:** Bütün Karaköy'ü modellemek yerine seçili eserler. Merkez eser **Kılıç Ali Paşa Külliyesi** oldu. Sebebi: hamamı hâlâ çalışıyor ve tarihte camiyi finanse ediyordu. Bu, akar sistemini canlı bir örnekle gösteriyor.
4. **Kedi maskot:** Konuşuldu, kesildi. Odağı dağıtıyordu ve "kediler ve vakıf" anlatıları çoğunlukla kaynaksız.
5. **Scrollytelling:** Yandex 3D Türkiye ve Şehir Dedektifi'nden ilham alındı. "Anlatım ekranı yönetir" fikri burada doğdu ve projenin en güçlü kısmı oldu.
6. **Prototip:** Vanilla JS + MapLibre + three.js ile `akar-app.netlify.app` yapıldı (önceki sürüm `lambent-dango-3ff0b8.netlify.app`). Muhammed'in ifadesiyle sadece fikri şekillendirmek için yapılmış bir örnek. Ürün React + TypeScript ile sıfırdan kuruluyor.
7. **Tasarım yönü:**
   - Önce Matrakçı Nasuh minyatürü + modern + revzen camı (macOS 27 "Liquid Glass" esinli).
   - Bu yön sonra silindi.
   - Şimdiki yön **"Çini" paleti:** lacivert ana renk, altın sadece süs, soğuk açık gri zemin (bkz. bölüm 7).
8. **Finale kaldıktan sonra (9–11 Ekim):**
   - Figma'da yaklaşık 77 ekran (45 mobil, 27 masaüstü, 5 panel), tasarım sistemi ve 22 özel ikon hazırlandı.
   - UX kararları kesinleşti, giriş sistemi seçildi.

---

## 3. Ürün: AKAR

**Ad:** AKAR. Vakıf hukukunda hayır yapılarını finanse eden, gelir getiren mülk demek.

**Slogan:** "Geçmişi gör. Hikâyesini dinle. İzini bırak."

**Problem:** Vakıf eserlerinin önünden her gün binlerce kişi geçiyor. Ama çoğu kişi yapının geçmişini de onu yüzyıllarca ayakta tutan vakıf sistemini de bilmiyor. Mevcut uygulamalar ses, 3D ya da metinden birini sunuyor; hiçbiri bunları tek bir deneyimde birleştirip vakıf sistemini anlatmıyor.

**Temel fikir:**
- Hayrat (cami, çeşme, medrese, köprü…) halka ücretsiz hizmet verir.
- Akar (hamam, han, bedesten, dükkân…) gelir getirir.
- Akarın geliri hayratın bakımını, aydınlatmasını ve görevlilerini karşılar.
- Uygulama bu sistemi haritada, anlatımda ve 3D'de görünür kılar.

**Hedef kullanıcı:** Gençler ve öğrenciler, şehri gezenler ve eserlere gidemeyip evden keşfetmek isteyenler ("Evden gez" modu).

**Platform:** Mobil öncelikli PWA (tek kod tabanı, masaüstünde de çalışır). Native uygulama yok. Şartname "mobil veya masaüstü" diyor; gerekirse ileride Capacitor ile mağazaya çıkılır.

### Ana akış
1. Haritada bir esere dokunulur.
2. Kart açılır, kullanıcı **"Hikâyeyi başlat · X dk"** butonuna basar.
3. Anlatım cümle cümle ilerler (**Dinle** ya da **Oku**). Her cümle 3D sahnede kamerayı, vurguyu ya da modele bağlı kartı değiştirir.
4. Hikâyenin sonunda akar akışı gösterilir: hamamdan caminin kubbesine akan altın bir çizgi.
5. **Hikâye sonrası** ekranında dört seçenek var: Geçmişi Gör, Bulmaca, İz Bırak ve (rotadaysa) Sonraki durak. Ayrıca "Eser hakkında" uzun metni.

### Projenin farkı (jüriye böyle anlatılacak)
- Parçaların benzerleri var; "hiçbir alternatifi yok" **denmeyecek**.
- Fark üç şey:
  1. Bu parçaları vakıf mirası için **tek bir anlatımda** birleştirmek.
  2. **Vakıf (akar) sistemini** anlatmak.
  3. **Her cümlede kaynak ve güven etiketi** kullanmak.

### Güven etiketleri (projenin omurgası)

| Etiket | Ne zaman | Renk (yazı / zemin) | İkon |
|---|---|---|---|
| **Doğrulanmış** | Kaynakla kesinleşmiş bilgi | #1E6B4A / #E3F2EA | mühür + onay |
| **Tarihsel çıkarım** | Kaynaklardan makul çıkarım, kesin değil | #8A5A00 / #FBEFD6 | parşömen veya kitap + büyüteç |
| **Temsili canlandırma** | Görsel temsil (3D model, Sinan portresi vb.) | #5B4E86 / #ECE8F5 | kesik çizgili küp |

- Bu sistem şartnamenin **5.1.3** maddesine (kaynak gösterme, doğrulanmamış içeriği gerçek gibi sunmama) doğrudan cevap veriyor.
- Jüri "Neden yapay zekâ yok?" diye sorarsa cevap: "Tarihî bilgide uydurma riski var. Yapay zekâyı sadece kaynaklı metinler üzerinde ve insan kontrolüyle kullanıyoruz. Her bilginin kaynağı ve güven etiketi var."

---

## 4. Özellikler (güncel kapsam)

### Şartnamenin zorunlu tuttuğu temel katman
- **Harita:** Sponsorun 60–80 eserlik veri setindeki **bütün** eserler; bilgi, görsel ve kaynakla.
- **Katmanlı içerik:**
  - Tier 1: bütün eserler, temel bilgi.
  - Tier 2: rota eserleri; ses, bulmaca, gravür.
  - Hero: 1–2 eser; 3D ve vakıf akışı.
- **Yönetim paneli:** eser ekleme ve düzenleme, hikâye (cue) düzenleyici, katkı moderasyonu.
- **Güven etiketi + kaynak** her içerikte.

### Ana deneyim

| Özellik | Ayrıntı |
|---|---|
| **İnteraktif anlatım** | Cue listesi. Her cümle bir sahne durumu tarif eder: kamera, vurgu, kart, akar akışı, gravür. Kartlar three.js CSS2DRenderer ile modeldeki noktalara bağlı. |
| **Dinle / Oku** | Aynı arayüz. Dinle'de ses çalar, sahneler kendiliğinden ilerler. Oku'da ses yok; kaydırınca, Boşluk'a ya da ↓'ye basınca aynı sahneler oynar. Oku erişilebilirlik için de önemli. |
| **Geçmişi Gör** | Gravür ↔ bugün kaydırıcısı. Yerindeyken kamera üstüne yarı saydam gravür bindirilir, kullanıcı aynı açıdan fotoğraf çeker. "Tozu sil" ile eski görüntüyü parmakla açma fikri de var. "Tam AR" **denmeyecek**. |
| **Bulmaca** | Esere bakarak bir detay bulunur; doğru cevap hikâyenin devamını ya da gizli durağı açar. İki kademeli ipucu, esnek cevap, evden karşılık. Cami içinde görev yok. |
| **İz Bırak** | Fotoğraf + kısa anı. Durum: beklemede → onaylandı / reddedildi. Onaylananlar eserin "Yaşayan hafıza" bölümünde görünür. |
| **Vakıf (akar) akışı** | Hamamın gelirinin caminin bakımına, aydınlatmasına ve görevlilerine akışı. Eğitim amaçlı; gerçek para ya da bağış yok. |
| **Rotalar** | Varsayılan serbest keşif. "Rota öner" ile hazır rotalar; 1-2-3 numaralı duraklar, altın çizgi, ilerleme çubuğu. **Rota oluşturucu ("Bana rota oluştur": süre + ilgi alanı) kapsamda.** |
| **Rozet / yapboz** | Keşfedilen eserlerle tek bir ödül sistemi. |
| **Birlikte Gez** | **Kapsamda.** Tanıdıklara davet linki gönderilir, aynı anlatım birlikte dinlenir. Konum paylaşımı ve yabancılarla eşleşme yok. |
| **Profil** | Keşfettiklerim, Rozetler, Paylaşımlarım, Rotalarım, Ayarlar. Arama çubuğundaki avatardan açılır. |

### Kesilenler ve nedenleri
- **Ayrı native uygulama:** PWA yeterli.
- **Yapay zekâ ile tarihî video veya görüntü:** Jüride VGM var; uydurma görüntü riski taşır.
- **Liderlik tablosu, sezonlar, puan ekonomisi:** Jüriyi etkilemez ve bir banka sponsoru yanında yanlış çağrışım yapar. (Not: Başvuruda puan ekonomisinden bahsedilmiş olabilir; bu tutarsızlık bir kez işaretlendi.)
- **FastAPI + PostGIS + monorepo:** 4 haftada yönetilemez; Supabase yeterli.
- **Kedi/maskot mekaniği:** Odağı dağıtıyor.
- **Bütün şehrin tarihî 3D modeli:** Ağır ve doğrulanamaz.
- **"Şu an kim Sultanahmet'te" tarzı yabancılarla tanışma:** Güvenlik, KVKK ve algı riski. Yerine Birlikte Gez ve anonim ziyaretçi sayacı.

### Yol haritası (sunumda "sonraki adımlar")
Rehberli grup yürüyüşleri (vakıf veya belediye ortaklığı), daha fazla şehir ve rota, çoklu dil (veri modeli buna hazır; `name:tr`, `name:en`, ileride `name:ku` gibi), kaynaklı küçük soru-cevap, mağaza uygulaması.

---

## 5. UX kararları (9–11 Ekim, kesin)

**Kartlar**
- Keşif ve rota kartlarında tek buton var: "Hikâyeyi başlat · X dk".
- Varsayılan mod Dinle. Kullanıcı Oku'yu seçerse bu sessizce hatırlanır.
- Kart durumları:
  - Başlanmadı → "Hikâyeyi başlat"
  - Yarıda kaldı → "Devam et · 5/9"
  - Bitti → "Tekrar göz at" (Hikâye sonrası'na gider)
- Eser detayında Dinle ve Oku ayrı butonlardır.

**Giriş**
- Google Haritalar mantığı: önce misafir olarak gezilir.
- Giriş sadece şunlar için istenir: İz Bırak, beğeni, kalıcı puan/rozet, cihazlar arası rota.
- Giriş isteği ilk hikâye bitince bir kez çıkar. "Şimdi değil" denirse ilk rozette bir kez daha çıkar.
- Misafirken kazanılan ilerleme hesaba taşınır.

**Anlatımdan çıkış**
- Sol üstte ✕ var, masaüstünde Esc de çalışır.
- Ses durur, ilerleme kaydedilir, kullanıcı geldiği ekrana döner. Onay sorulmaz.
- Mobilde geri tuşu aynı işi yapar.

**Anlatımda gezinme**
- İleri butonu, Boşluk ya da ↓.
- Üstteki ilerleme çubuğunun parçaları tıklanabilir; son parça Hikâye sonrası'nı açar.
- Sağ/sol dokunarak geçme **yok**, çünkü 3D döndürmeyle çakışır.
- Atlayarak sona gelen "tamamlandı" sayılsın mı? Öneri: son cümleye ulaşan tamamlamış sayılır. **Ekip karar verecek.**

**Rota içinde:** ✕ basılınca rota haritasına dönülür; orada "Sonraki durak" butonu var.

**Masaüstü anlatım:** İki seçenek var, **karar verilmedi**.
- Mevcut: 420 px sol panelde metin, sağda 3D.
- "Altyazı" alternatifi: 3D tam genişlik. Altta ortada yarı saydam kutu: en fazla 2 satır, 20 px, güven etiketi, kaynak, kontroller ve "Metni aç". Kamera kadrajın alt %20'sini boş bırakır.

**Masaüstü sol panel:** Yandex'teki gibi sağ kenarında ◀/▶ sekmesi var; panel açılıp kapanabilir.

**Diğer kararlar**
- "İstanbul ▾" şehir seçicisi alttaki sheet satırında durur ve haritayı takip eder.
- Mimar Sinan görseli "Temsili" etiketli (bilinen gerçek portresi yok). Bilginin kendisi "Doğrulanmış".

---

## 6. Harita (sıradaki iş, Muhammed yapıyor)

- **Tek Türkiye haritası** olacak; şehir şehir ayrı harita yok. Uygulama kullanıcının şehrinden açılır, demoda Karaköy'den.
- **Üç seviye:**
  - Türkiye: şehir baloncukları ("İstanbul · 42")
  - Şehir: semt grupları ("Karaköy · 6")
  - Sokak: 4 renkli pinler
- MapLibre'de `cluster: true` ile yapılır. Grup baloncuğu lacivert daire ve içinde sayı; pin renkleri baloncuğa karışmaz.
- Konum izni vermeyen ya da "Evden gez" ile giren kullanıcı İstanbul'dan başlar.
- **Maputnik'te stil:** Restoran, market gibi OSM POI'leri kapatılacak; sadece AKAR pinleri öne çıkacak. Etiketler `name:tr` alanına bağlanacak.
- **Pin rengi = eserin vakıftaki rolü** (eser türü değil):

| Rol | Renk | Eser türleri |
|---|---|---|
| dini (hayrat) | yeşil #2E7D32 | cami, mescit, türbe, tekke, zaviye |
| su (hayrat) | mavi #2A6FB0 | çeşme, sebil, su kemeri, sarnıç |
| eğitim ve sosyal (hayrat) | lacivert #25477B | medrese, mektep, kütüphane, imaret, darüşşifa, köprü, külliye |
| akar | bakır #9A5B2E | hamam, han, bedesten, arasta, dükkân |

- Pin gövdesinde kırmızı, mor ve altın kullanılmaz.
- **Pin biçimi:** sivri kemer, 40×48. İçinde beyaz tür ikonu.
- **Pin durumları:**
  - Seçili: 1,25× büyük, altın halka
  - Tamamlandı: altın ✓
  - Gizli: beyaz zemin, kesik kenar, "?"
- **Karar bekleyen:** Harita renk yönü (Kâğıt / Sakin gri / Çini). Muhammed önceki önerileri iki kez beğenmedi.
- Figma'ya Türkiye, şehir ve sokak seviyesinde birer ekran eklenecek.

---

## 7. Tasarım sistemi (tokens.css ile birebir)

**Renkler**

| Grup | Değerler |
|---|---|
| Temel | bg #F3F5F5 · surface #FFFFFF · text #141B2B · text-muted #4A5466 · border #DAE1E2 |
| Ana renk | primary #25477B · primary-dark #1B355C · primary-light #E6ECF5 · on-primary #FFFFFF |
| Vurgu ve hata | gold #C9A13B (sadece dekor ve ikon; yazıda kullanılmaz, açık zeminde kontrastı yetmez) · gold-text #8A6A16 · error #B3261E (sadece hata) |
| Güven ve pin renkleri | Yukarıdaki tablolarda |

- Eski krem zemin ("çöl gibi") beğenilmedi; başvuru sunumundaki renklere uygun soğuk gri seçildi.
- Kontrastlar WCAG'a göre hesaplandı.

**Ölçüler:** boşluk 4/8/12/16/24/32 · köşe 8/12/16/999.

**Yazı**
- Inter (400, 500, 600) gövde ve arayüzde.
- Cormorant Garamond SemiBold **sadece 22 px ve üstü başlıklarda**. `font-variant-numeric: lining-nums` şart; yoksa "1" rakamı "ı" gibi görünüyor.
- Text style'lar: Başlık/XL (32), Başlık/L (26), Başlık/M (18, Inter), Gövde/Büyük (16), Gövde/Normal (14), Gövde/Vurgu (14, 500), Etiket (12, 500).

**Süsleme (altın çizgi) sadece şu yerlerde:** eser kartı ve Eser detay başlığının altı, Hikâye sonrası, Eser hakkında bölüm araları, Profil, Rota tamamlandı, İlk açılış. Başka yerde kullanılırsa sıradanlaşır.

**İkonlar**
- Genel arayüz: Lucide (`lucide-react`, size 20, strokeWidth 2, ikonla yazı arası 8 px). Dinle → Headphones, Oku → BookOpen.
- AKAR'a özel 22 dolu (solid) SVG ikon, `currentColor`:
  - Yapı türleri: cami, çeşme, hamam, han, köprü, türbe, medrese/rahle, külliye, sebil, imaret
  - Akar öğeleri: görevli, kandil, mala, su, akar akışı
  - Güven etiketleri: 3 adet
  - Diğer: rozet, Geçmişi Gör, İz Bırak, gizli durak
- İkonlar birçok kez düzeltildi: hamam tencereye, han yüze benziyordu; rahle, köprü ve kandil referans görsellere göre yeniden çizildi.
- Dosyalar: `AKAR_ikonlar_svg.zip`, `AKAR_ikon_seti.png`.

**Eski tasarımdan alınanlar:** serif başlıklar, altın süsleme, ikon + yazılı butonlar, pusula, "Yapının hikâyesi · 9 bölüm" satırı, "‹ Harita" butonu.
**Alınmayanlar:** teal ve krem renkler, terracotta Temsili etiketi, eski harita renkleri.

**Figma**
- Güncel dosya: `https://www.figma.com/design/Bd3m8xYrCiVK6440POHN39/akar-app` (13 Ekim'de değişti).
- Eski dosyalar `2ZMn…`, `uHF60…` ve `jTSZeb…` artık kullanılmıyor.
- **MCP kotası:** Starter planda ayda yaklaşık 6 çağrı; bu ayın kotası büyük ihtimalle bitti.
- Figma Education denendi. AÖL okul e-postası vermediği için olmadı; Bootcamp yolu 42'nin onayını bekliyor. Ücretli seçenek Professional Full seat, aylık.
- Muhammed, limitleri aşmak için sürekli yeni ücretsiz hesap açılmasını **istemiyor**.
- **Sayfa düzeni:** Kapak · 00 Tasarım Sistemi · Kullanıcı akışları · Demo yolu · 📱 Mobil (390×844, 45 ekran) · 🖥 Masaüstü (1440×900, 27 ekran) · 🛠 Yönetim paneli (5 ekran).
- Bölüm sırası akışa göre: Açılış ve keşif → Rotalar → Eser ve anlatım → Etkileşim → Hesap ve bilgi → Ortak parçalar.
- **Adlandırma:** "WF · / B ·" mobil, "D ·" masaüstü, "WF · Panel /" yönetim paneli. Her ekranın altında "Not / <ad>" metni var.
- Değişken koleksiyonları: "AKAR · Renkler" ve "AKAR · Ölçüler".
- **Bileşenler:** ikon/* (22), Süsleme, Pusula, Harita pini (Durum × İkon), Harita lejantı, Panel sekmesi (Açık/Kapalı).
- Claude'un kendi "Design" tuvalinde de bir wireframe kopyası var (Figma kotası dolunca kullanıldı).

**Figma'da elle yapılacak küçük düzeltmeler**
1. "D · Anlatım / Oku": ✕ butonu "Kaydırarak oku" yazısına çok yakın; yazı "Kaydırarak" diye kısaltılmalı.
2. "D · E-posta kodu": arka plan düz lacivert. Karartma katmanının altına "D · Keşif / Ana" ekranının kopyası konmalı.
3. Mobildeki B · Anlatım ekranlarının sol üstüne ✕ eklenmeli.
4. "Tam ekran 3D" butonu panel sekmesiyle aynı işi yapıyor, silinebilir.

**Eksik tasarımlar:** odak halkası (focus ring), devre dışı buton durumu, logo, uygulama ikonu, splash, rozet görselleri ve adları.

---

## 8. Teknik mimari

| Katman | Seçim |
|---|---|
| Arayüz | Vite + React + TypeScript, PWA (manifest + service worker) |
| Harita | MapLibre GL JS + OpenFreeMap (anahtarsız, OSM verisi); stil Maputnik'te |
| 3D | three.js: GLTFLoader + DRACOLoader, CSS2DRenderer (kartlar), OrbitControls (hedef "Merkez") |
| Modeller | Blender → .glb (Draco sıkıştırmalı) |
| Arka uç | Supabase: Postgres, Auth, Storage, **RLS** (kendi sunucu yok; güvenlik RLS kurallarında) |
| Yayın | GitHub → Netlify (her PR için önizleme linki) |
| Ses | Cümle başına ayrı ses dosyası önerildi; prototipte Web Speech API (tr-TR) |

### Anlatım motoru
- Bir cue listesi. Her cümlede başlangıç saniyesi, metin, güven etiketi, kaynak ve **sahne durumu** var (kamera hedefi/açısı/uzaklığı, vurgulanacak parçalar, açık kart, akar akışı, gravür).
- Cue bir "değişiklik emri" değil, sahnenin **tam durumu**. Bu sayede ileri ve geri atlamak ya da ortadan başlamak sorunsuz çalışır.
- Dinle (ses zamanı) ve Oku (kaydırma, IntersectionObserver) aynı `sahne.uygula()` fonksiyonunu çağırır.
- Cue listesi veritabanından gelir; yeni eser = yeni liste, kod değişmez. Panelde cue düzenleyici var.

### Giriş (şifresiz)
- Google ile giriş (ana yol).
- E-posta ile **6 haneli kod** (link değil): `signInWithOtp({ email })` → `verifyOtp({ email, token, type: "email" })`.
  - E-posta şablonunda `{{ .Token }}` kullanılacak, kod 600 sn geçerli.
  - Magic link önce önerildi; Muhammed sorgulayınca koda geçildi.
- Supabase'in kendi e-posta servisi büyük ihtimalle sadece ekip adreslerine gönderiyor (**doğrulanmalı**). Bu yüzden Resend SMTP bağlanacak.

### Veri modeli (taslak)
- Tablolar: Eser · Dönem · Kaynak · Hikâye cue'su · Karşılaştırma görseli (gravür + bugünkü foto + **lisans**) · Rota · Rota durağı · Bulmaca · Vakıf akışı (gelir → harcama, kaynaklı) · Katkı (moderasyon durumu) · Kullanıcı ilerlemesi · Profil (rol).
- Her metin ve ses için dil alanı var.
- Eserde, kendi güven etiketiyle birlikte bir "vakıf rolü" alanı olacak.
- Sponsorun veri seti API değil, yarı yapılandırılmış ham bir paket. Takım kendi modeline dönüştürecek. **Format henüz bilinmiyor.**

### İz Bırak akışı
1. Form doğrulanır (boşluk, dosya türü ve boyutu; EXIF/konum temizlenir).
2. Fotoğraf Storage'a gider.
3. `katkilar` tablosuna `durum: 'beklemede'` satırı yazılır. RLS sayesinde kimse göremez.
4. Admin panelden onaylar → `onaylandi` → herkese görünür.

Bu akış şartnamenin üç maddesini karşılıyor: moderasyon, girdi doğrulama ve kişisel veri koruması.

### Yapım sırası ilkesi
Önce çirkin ama uçtan uca çalışan ince bir dilim, sonra güzelleştirme. 3D en riskli parça; ana akış 3D'ye bağımlı olmamalı (zayıf cihazda hazır görsel yedeği).

---

## 9. 3D

**Hero model:** Kılıç Ali Paşa Camii + hamamı + Tophane Çeşmesi.
- Hepsi tek .glb dosyasında, yaklaşık **5.900 üçgen, 77 KB**.
- Claude, Blender'ı (bpy 5.0.1) Python betiğiyle çalıştırarak üretti (`build_kilicali.py`).
- Teslim: `kilic-ali-pasa-model.zip` (.glb + .blend + betik + önizleme).
- Oranlar yaklaşık. Hamam (x = −27) ve çeşme (26, −30) görünürlük için yeniden konumlandırıldı. Model **temsili**.

**Parça adları (kodla birebir):**
- Parçalar: Kaide, Govde, Payanda, Kasnak, Kubbe_Ana, Kubbe_Yarim, Revak, Minare, Avlu, Hamam, Cesme, Zemin, Cadde, Deniz, Agaclar
- Boş noktalar (Empty):
  - Kart noktaları: Kart_KilicAli, Kart_Sinan, Kart_Kubbe, Kart_Minare, Kart_Hamam, Kart_Cesme
  - **Merkez:** Kamera bu noktanın etrafında döner. Prototipte kameranın denizin etrafında dönmesi hatası böyle çözüldü.
  - Akar_0 … Akar_4: hamamdan kubbeye akış yolu

**Yandex 3D Türkiye'den alınan dersler:**
- Modeller elle yapılır, model başına **en fazla 15.000 poligon**.
- Işık dokuya pişirilir (light baking).
- Tanıtıcı öğeler (minare, kubbe, kemer) bilerek biraz abartılır.

**Performans bulgusu**
- İlk "gerçekçi" demo Redmi 9T'de **5 FPS** verdi (yüksek kalite, 374 bin üçgen). Düşük kalitede 26 FPS çıktı ama görüntü bulanıktı.
- Sonuç: Sorun web değil, sahnenin ağırlığı. Unity'ye ya da native'e geçmeye gerek yok.
- Kurallar:
  - Gerçek zamanlı gölge yok
  - Sadece gerektiğinde çizim (render on demand)
  - Sahne kapanınca dispose
  - Düşük üçgen sayısı
  - Kalite kademeleri
  - Zayıf cihazda hazır görüntü

**Haritada 3D:** Sadece vakıf eserleri 3D olacak; geri kalan şehir düz kalacak. Bütün Karaköy modellenmeyecek.

**"Çizgi film gibi" eleştirisi (11 Ekim):** Bir arkadaş stilize modelin çizgi film gibi durduğunu söyledi ve fotoğraflardan oluşan, etrafında dönülebilen gerçekçi bir görünüm önerdi. Claude'un önerisi:
- Eser detayında iki görünüm olsun:
  - **Hikâye** (stilize model, "Temsili" etiketi): anlatım ve akar için.
  - **Gerçek** (fotoğraftan, "Bugünkü kayıt"): bugünkü hâl için.
- Gerçek görünüm için yollar:
  1. Telefon videosundan Gaussian splatting (Polycam, Scaniverse, KIRI, Luma; dosyalar büyük, Redmi'de test şart).
  2. Fotogrametri .glb'si (sadeleştirilerek).
  3. 24–36 fotoğrafla döndürme görünümü (en hafif, her telefonda çalışır).
  4. Google Photorealistic 3D Tiles (ücretli, kuralları sıkı, şartlar kontrol edilmeden kullanılmamalı).
- **Drone:** Türkiye'de kayıt ve izin gerekiyor; Tophane, Boğaz kıyısı ve tarihî alanlar büyük ihtimalle kısıtlı. Yerden telefonla çekim yeterli.
- **Pilot:** Tophane Çeşmesi (küçük, etrafı açık). Sabah erken ya da bulutlu bir günde çekilmeli.
- Henüz karar verilmedi.

---

## 10. Örnek içerik

### Kılıç Ali Paşa anlatımı (9 cümle; finalden önce kaynakla kontrol edilecek)
1. "Kılıç Ali Paşa Külliyesi, Tophane'de, 1580 yıllarında yapıldı." · Doğrulanmış
2. "Yaptıran Kılıç Ali Paşa, Osmanlı donanmasının kaptan-ı deryasıydı. İnebahtı yenilgisinden sonra donanmayı yeniden kuran kişiydi." · Doğrulanmış
3. "Mimarı Mimar Sinan'dı." (Kartta not: Sinan'ın bilinen gerçek bir portresi yoktur.) · Doğrulanmış
4. "Caminin planı, küçültülmüş bir Ayasofya'yı hatırlatır." → kubbe altınla vurgulanır · Doğrulanmış
5. "Külliyenin yanında bir hamam vardı ve bugün hâlâ yaşıyor." → hamam vurgulanır · Doğrulanmış
6. "Hamam gibi gelir getiren yapılara akar denirdi. Hamamın geliri caminin bakımına, aydınlatmasına ve görevlilerine ayrılırdı." → altın akış · Tarihsel çıkarım
7. "O yıllarda deniz, caminin hemen önündeydi." → gravür · Tarihsel çıkarım
8. "Karşıda Tophane Çeşmesi duruyor. 1732'de Sultan I. Mahmud tarafından yaptırıldı." · Doğrulanmış
9. "Bir çeşme de vakıf hayratıdır; bakımı vakfın gelirleriyle sağlanırdı." · Tarihsel çıkarım

### Örnek rota: Tophane Vakıf Yürüyüşü
Kılıç Ali Paşa Camii (1580) → Tophane Çeşmesi (1732) → Nusretiye Camii (1826)

| Durak | Bulmaca fikirleri |
|---|---|
| Kılıç Ali Paşa | Minarenin şerefe sayısı · avludaki türbe kime ait · plan hangi yapıyı hatırlatır (Ayasofya) · **akar bulmacası:** gelir jetonlarını bakım / aydınlatma / görevliler kalemlerine sürükle |
| Tophane Çeşmesi | Kaç cephede lüle var · kabartmalarda hangi motif yok · gravürle hizalayarak fotoğraf çekme / "tozu sil" · çeşme neden vakıf hayratıdır |
| Nusretiye | "Nusret" ne demek (Vaka-i Hayriye bağlamı) · minareleri Kılıç Ali Paşa'nınkinden nasıl farklı · **final:** üç eseri yapım sırasına diz → ödül (rozet) |

- **Mekanikler:** gizli durak (çözünce haritada belirir), iki kademeli ipucu, esnek cevap, "durağı atla" (kapalı ya da ibadet vakti), cami içinde görev yok.
- ⚠️ **Bulmaca cevaplarının hiçbiri doğrulanmadı.** Sahaya gidilip her durak fotoğraflanacak; bu hem cevapları doğrular hem Geçmişi Gör için fotoğraf sağlar.

### Eğitici mini özellik fikirleri (telefonda hafif çalışan)
- Akar sürükle-bırak şeması
- Dokununca açılan yapı parçaları diyagramı (kubbe, minare, şerefe, revak)
- 1580 → 1732 → 1826 zaman şeridi
- Terim kartları (akar, hayrat, vakfiye, mütevelli)
- "Tozu sil" ile gravür açma
- Kıyı çizgisi SVG animasyonu
- Kısa onboarding

---

## 11. Şartnameden kritik maddeler

- **Çalışan MVP zorunlu.** Mockup, sunum ya da statik tasarım kabul edilmiyor (2, 5.1.1).
- Birden fazla eser keşfi; tarihî bilgi, görsel ve kaynak; **içerik ekleme ve düzenleme** (5.1.1).
- Genişletilebilir mimari; veri modeli ve mimari finalde anlatılabilmeli (5.1.2).
- Veri seti ham bir paket; takım kendi modeline dönüştürecek (5.1.3).
- Kaynak gösterilecek; **doğrulanmamış içerik gerçek gibi sunulmayacak**; topluluk katkısında moderasyon zorunlu (5.1.3).
- **Erişilebilirlik çalışan üründe olmalı**, mockup'ta değil (5.1.4).
- Girdi doğrulama, kişisel veri koruması, test, modüler kod, README (5.1.5).
- Net rol dağılımı ve herkesin kendi kısmını anlatabilmesi puanlanıyor (5.2.3).
- Kullanılan bütün görsel, yazılım ve verinin **lisansı takımın sorumluluğunda** (8, 10). Bir lisans tablosu tutulmalı: görsel, font, ikon, ses, gravür.
- Finalde sunumu sadece takım üyeleri yapabilir. Resmî iletişimi kaptan yürütür.

---

## 12. Rakipler ve ilham kaynakları

| Kaynak | Ne öğrenildi |
|---|---|
| **Questo** | Bilmece çözülünce hikâye açılıyor; ipucu kademesi (XP karşılığı); süreli bulmaca; ekrana üfleme gibi fiziksel etkileşim; fotoğraf görevleri; "Time Rifts" (geçmiş görünüm, Geçmişi Gör'e benziyor); co-op ve versus. Şikâyetler: bulmacalar çok kolay, ipuçları hatalı, yazı fazla. |
| **izi.travel** | Konuma göre sesli rehber. Quest: gizli bölümler, kontrol noktaları (konum ya da quiz), 4 şıklı ya da kısa cevaplı sorular (10 yazım çeşidi kabul), puan. Kurumlar içeriği kendi panelinden ekliyor. |
| **VoiceMap** | Yerel uzman anlatımı çok seviliyor. Şikâyetler: pil tüketimi, GPS'in tetiklenmemesi, sesin kesilmesi. |
| **Future History** (Almanya) | Gravür/foto kaydırıcı, AR, ses, evden mod, kullanıcı katkısı. **En yakın rakip.** |
| **Yandex Haritalar 3D Türkiye** | Haritada simge yapılar 3D; teknik dersler (bölüm 9). |
| **Şehir Dedektifi / Tarihi Yarımada Okuma Kültürü Atlası** | Scrollytelling; Oku modunun ilhamı. |
| **Miniatürk uygulaması (İBB)** | Yakındaki maketi bulma, VR, sesli anlatım. |
| **Matrakçı Nasuh minyatürleri, illüstrasyonlu Tarihi Yarımada haritası** | Eski tasarım yönünün referansı (başka çizerin işi; kopyalanmadı). |
| **macOS 27 Golden Gate, cami revzenleri** | Tartışılan tasarım referansları; okunurluk önce. |

Twitter'da başka hackathon katılımcılarının "aşırı optimize" işleri görüldü, örneğin skillry.dev. Muhammed bunların AKAR'a uyarlanıp uyarlanamayacağını sordu. Cevap: fikir alınabilir ama kapsam riski var.

---

## 13. Riskler, hassasiyetler, doğrulanacaklar

### Doğrulanacaklar
- **Tophane Çeşmesi I. Mahmud Vakfı'na mı bağlı?**
  - Vakıf Katılım 2015'te VGM ile II. Bayezid, I. Mahmud, II. Mahmud ve Murat Paşa vakıflarınca kuruldu (kuruluş tarihindeki yapı; güncel ortaklık doğrulanmalı).
  - Doğruysa sunumun en güçlü cümlesi: "Karşınızdaki çeşmeyi yaptıran sultanın vakfı, bugün sponsorun kurucu ortaklarından biri."
- **Kılıç Ali Paşa vakfiyesinin yayımlanmış bir transkripsiyonu var mı?** (VGM arşivi, DergiPark; mentorlara sorulabilir.) Gerçek rakam bulunamazsa **uydurulmaz**; sadece akışın yapısı "Tarihsel çıkarım" etiketiyle gösterilir.
- Hero eserler sponsorun veri setinde var mı? Yoksa yedek bir hero seçilir.
- Bulmaca cevapları, ziyaret saatleri, mimari detaylar.
- Supabase e-posta gönderim sınırı.

### Hassasiyetler
- Oyunda "yatırım, getiri, kâr, bağış, faiz" kelimeleri **kullanılmaz**.
- "Vakıf = katılım bankacılığı" benzetmesi kurulmaz. 16. yüzyıldaki para vakıfları ve faiz tartışması hassas bir konu.
  - Güvenli bağ kurumsal olanı: Vakıf Katılım'ın ana ortağı VGM, yani bu eserleri bugün yöneten kurum.
- Camilerde oyunlaştırma dili sade olacak, cami içinde görev olmayacak. "Ele geçirildi" değil "keşfedildi".
- Mimar Sinan'ın gerçek portresi yok; görseli temsili.
- Kamera üstüne gravür bindirmeye "tam AR" denmez.
- Tophane-i Âmire, Tophane Kasrı ve Saat Kulesi vakıf eseri değil. Rotaya alınırlarsa "çevredeki tarihî yapılar" diye ayrılmalı.
- Tophane Çeşmesi için "Lale Devri" demek yanlış; Lale Devri 1730'da bitti, çeşme 1732'de yapıldı.
- Çekimlerde ibadet saatlerine ve fotoğraftaki insanların mahremiyetine saygı (yüzler bulanıklaştırılmalı).

### En büyük risk: kapsam
- Yaklaşık 77 ekran var, 4 hafta kaldı.
- Frontend tek kişide (Mustafa); harita ve 3D Muhammed'de.
- Birinciliği az ama kusursuz çalışan ürün getirir.
- İlk ekip toplantısında **"Finalde kesin çalışacak 5 şey"** listesi çıkarılmalı. Demo yolu omurga olsun; Birlikte Gez, rota oluşturucu ve rozetler ikinci sırada.

---

## 14. Final demosu (3–4 dakika, planlanan)

Harita → Kılıç Ali Paşa → 3D'li anlatım (kartlar, kubbe vurgusu) → akar akışı → Geçmişi Gör → bulmaca → İz Bırak ("onay bekliyor") → yönetim panelinde onay ve yeni eser ekleme (haritada anında görünür).

- Sahnede konum çalışmayacağı için **demo modu / Evden gez** kullanılacak.
- Karaköy'de çekilmiş kısa bir saha videosu da gösterilecek.
- B planları: zayıf cihazda hazır görsel, çevrimdışı önbellek.

**4 haftalık plan taslağı:**
- **Hafta 1:** veri seti modele dönüştürülür; harita ve eser sayfası; panel iskeleti.
- **Hafta 2:** Geçmişi Gör, güven etiketleri, ilk rota ve sesler; 3D paralelde.
- **Hafta 3:** bulmacalar, vakıf akışı, İz Bırak + moderasyon, erişilebilirlik.
- **Hafta 4:** 3D entegrasyonu, telefon testleri, saha videosu, demo provası. **Yeni özellik eklenmez.**

---

## 15. Açık işler ve bekleyen kararlar

1. Ekip toplantısı: "Finalde kesin çalışacak 5 şey".
2. Veri setini görmek: format, eser listesi, görsel lisansları. Hero eserler ve rota buna göre kesinleşecek.
3. Harita: renk yönü ve 3 seviyeli Figma ekranları (Muhammed).
4. Masaüstü anlatım: sol panel mi, altyazı modu mu?
5. Atlayarak sona gelen "tamamlandı" sayılsın mı?
6. Gerçek görünüm (fotoğraftan 3D) eklenecek mi; eklenirse hangi yöntemle?
7. Saha günü: üç durağın fotoğrafları, gravür açıları, bulmaca cevaplarının doğrulanması, Tophane Çeşmesi'nin çekimi.
8. Gravür kaynakları ve lisansları (Wikimedia Commons vb.).
9. Tasarım sistemi eksikleri: odak halkası, devre dışı durum, logo, uygulama ikonu, splash, rozet görselleri.
10. Belgeler: lisans tablosu, KVKK metni, README.
11. Figma: eğitim planı için 42'nin onayı ya da ücretli plan kararı.
12. Kod için Claude Code promptları hazır (ayrı dosya: `AKAR_Claude_Promptlari.md`).

---

## 16. Üretilen dosyalar

| Dosya | İçerik |
|---|---|
| `AKAR_Basvuru.pptx / .pdf` | 3 sayfalık başvuru (Canva'da düzenlenip gönderildi) |
| `AKAR_Takim_Plani.pdf` | 8 sayfalık ekip ikna dokümanı |
| `AKAR_Kisa_Plan.pdf`, `AKAR_Sunum.pdf` | Kısa plan, sunum özeti |
| `Ortak_Vizyon_KATMAN_Akar.docx` | KATMAN ve AKAR birleşimi |
| `AKAR_Minyatur_Yonu.docx` | Eski tasarım yönü (artık geçerli değil) |
| `AKAR_Netlestirme_Notu.docx`, `AKAR_Plan.xlsx` | Netleştirme notu, plan tablosu |
| `kilic-ali-pasa-model.zip` | .glb + .blend + Blender betiği + önizleme |
| `AKAR_ikonlar_svg.zip`, `AKAR_ikon_seti.png` | 22 özel ikon |
| `tokens.css` | Tasarım token'ları |
| `AKAR_Proje_Ozeti.md`, `AKAR_Devir_Notu_9Ekim.md`, `AKAR_Devir_Notu_11Ekim.md` | Claude Project'teki devir notları (11 Ekim notu en güncel olanı) |
| `AKAR_Claude_Promptlari.md` | Claude Code promptları (bu metinle birlikte) |

---

## 17. Kaynaklar

- Şartname: ROOT&CODE Hackathon Terms and Conditions (İngilizce PDF)
- Vakıf Katılım ortaklık yapısı: https://tr.wikipedia.org/wiki/Vak%C4%B1f_Kat%C4%B1l%C4%B1m_Bankas%C4%B1
- Yandex 3D modellerinin yapımı: https://habr.com/ru/companies/yandex/articles/806757/
- Yandex 3D Türkiye: https://yandex.com/maps/discovery/3d-turkiye/
- Questo SSS: https://questoapp.com/faq
- izi.travel Quest: https://izi.travel/en/help/production/what-is-a-quest · Quiz: https://izi.travel/en/help/production/quiz
- Future History: https://play.google.com/store/apps/details?id=com.extendedvision.futurehistory
- Tarihi Yarımada Okuma Kültürü Atlası: https://sehirdedektifi.github.io/istanbuluokuyorum1/
- Miniatürk uygulaması: https://play.google.com/store/apps/details?id=tr.gov.ibb.miniaturkguide
- Azapkapı Sokullu Mehmed Paşa Camii: https://www.archnet.org/sites/2792
