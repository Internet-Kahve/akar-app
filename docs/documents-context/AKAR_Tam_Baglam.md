# AKAR · Proje bağlam belgesi

*Sürüm: 11 Ekim 2026, güncellemeler 13 Ekim (bkz. §0.5), 15 Ekim (bkz. §0.6) ve 22 Ekim 2026 (bkz. §0.7). Bu belge, AKAR projesinin kapsamını, kararlarını, gerekçelerini ve açık konularını tek yerde toplar. Bilinmeyen ya da doğrulanmamış bilgiler açıkça işaretlenmiştir.*

---

## 0. Belge kullanım ilkeleri

- Dil: Türkçe. Teknik terimler İngilizce kalabilir (PWA, three.js, RLS).
- Üslup: kısa, net, abartısız. Önce sonuç, sonra gerekçe.
- İçerik ilkesi: tarihî bilgi uydurulmaz; emin olunmayan her şey "doğrulanmalı" diye işaretlenir. Projenin ayırt edici değeri güvenilirliktir.
- Kapsam disiplini: yeni her öneri "final demosuna yetişir mi?" sorusundan geçer. Kapsam şişmesi en büyük risktir.
- Ekip dışına çıkacak belgeler sade ve doğrudan yazılır.

---

## 0.7 · 22 Ekim güncellemesi (önce bunu oku)

Bu bölüm §0.6'nın ve aşağıdaki bölümlerin önündedir. Uygulama ayrıntıları: `FRONTEND_BACKEND_NOTLARI.md` §0.2 ve §12. Figma: `akar-yeni`.

- **Geçmişi Gör kesinleşti.** Büyük eski fotoğraf + tarih sıralı şerit + «Nereden çekildi?» haritası (çekim noktası ve görüş konisi) + **«Kamerayı aç»**. Bugünkü eşi olan fotoğrafta kaydırıcı. Kamerada eski fotoğraf yarı saydam; çekince «İz Bırak olarak gönder». **«Tozu sil» yok.** Kamera yalnız telefonda; masaüstünde yok.
- **Yönlendirme yok:** bildirim, «yerindesin» uyarısı, yön oku yok. Kullanıcı haritada noktayı ve açıyı görür, oraya kendisi gider.
- **İç mekânda kamera açık;** açılışta saygı notu (namaz vakitleri, yüz çekme, flaş). «Cami içinde görev yok» kuralı bulmaca içindir.
- **Eski fotoğraflar geldi:** Foto Atlas'tan Bursa'da 236 kullanılabilir fotoğraf (İÜ Nadir Eserler izniyle +67). 56'sı 17 vakıf eserine bağlandı; Ulucami 18, Koza Hanı 2, Orhan Gazi Camii 2 (biri doğrulanacak). Klasör: `veri/fotoatlas/` (`BENIOKU.md`).
- **Yaşayan hafıza tek giriş:** Hikâye sonrasında «İz Bırak» kutusu «Yaşayan hafıza» oldu; İz Bırak hafıza sayfasından açılır. Kameradan gelen izler «aynı açı» etiketi taşır ve bugünkü eş olabilir. **Tüm izler** sayfası (şehir / eser seçili) eklendi.
- **Panel:** Eser düzenle › Geçmişi Gör yeni alanlarla (fotoğrafçı, tarih aralığı, kaynak + arşiv no + link, aracı, lisans, otomatik kaynak satırı, düzenlenebilir konum/yön, iç mekân). Toplu içe aktarma ekranı eklenmedi.
- **Örnek rota 4 durak oldu:** Hanlar Bölgesi Vakıf Yürüyüşü: Ulucami (1399, Yıldırım Bayezid) → Bedesten (14. yy, Yıldırım Bayezid) → Koza Hanı (1491, II. Bayezid) → Orhan Bey Camii (1339–40, Orhan Bey). Tarih ve adlar envanterden (C1 s.19, s.96; C2 s.8, s.29). Mesafe ~0,5 km (OSM merkezleri arası 361 m + yürüme payı); süre ~10 dk = yürüme + dört hikâyenin sesi. Süre ve mesafe hesaptır, envanterde yok. Figma buna göre güncellendi (durak listelerine ve haritalara 4. satır/yıldız henüz eklenmedi).
- **Rol ayrımı:** UX/UI ve içerik tarafı `docs/documents-context/` içinde çalışır; `apps/` ve `packages/` frontend ve backend'indir. Veri paketleri frontend'e `veri/.../cikti/` üzerinden verilir.

---

## 0.6 · 15 Ekim güncellemesi (önce bunu oku)

Bu bölüm §0.5'in ve aşağıdaki bölümlerin önündedir. Uygulama ayrıntıları: `FRONTEND_BACKEND_NOTLARI.md` §0 ve §10.

**Kesin kapsam.** Kodlamaya başlamadan önce bilinsin; bunlar finalde olacak:
- Yeni harita tasarımı (`design/harita/akar-style.json`).
- Yeni ikonlar ve pinler (AKAR ikon seti, harita pini, rota durağı yıldızı).
- Rotalar, **Bana rota oluştur** dahil.
- Esere basınca açılan bütün sayfalar (eser kartı, eser detay, Eser hakkında, Kaynak detayı, Hikâye sonrası, Giriş isteği).
- Dinle / Oku anlatımı.
- Geçmişi Gör.
- İz Bırak + Yaşayan hafıza (moderasyonlu).
- Profil (girişli, misafir, e-posta kodu, KVKK).
- Keşif, arama, filtre, şehir seçici ve yönetim paneli.

**Şimdilik yapılmayacak:** **Bulmaca** ve **Birlikte Gez**. Değişebilirler; yerlerine başka özellikler gelebilir. Figma'daki ekranları yer tutucudur.

**Karar bekliyor:** Rozetler. Bulmaca, Birlikte Gez ve rozet/puan ekranları Figma'da tasarımı hazır olarak durur; öncelikleri sonra konuşulacak (20 Ekim). Ayrıntı: `FRONTEND_BACKEND_NOTLARI.md` §0.

**Fotoğraf + 3D görünümü.** Her eserin 3D modeli olmayabilir. Bu yüzden:
- **Eser detayında** önce fotoğraflar görünür (Google Haritalar'daki gibi: büyük, üst üste iki küçük, büyük… yatay kayar). 3D'si olan eserde sağ üstte **Fotoğraf | 3D** seçicisi var.
- **Anlatım** her eserde fotoğrafla çalışır: her cümlenin fotoğrafı ekranda. 3D'si olan eserde aynı seçiciyle anlatım 3D'ye geçer (kamera açısı, vurgu, kart); cümle ve ses kaldığı yerden devam eder.
- **Fotoğrafın arkası** aynı fotoğrafın bulanık hâli. Varsayılan "sığdır" (orijinal oran); köşedeki düğmeyle ekranı doldurur.
- **Üst kontroller** (✕, seçici, tam ekran) anlatım oynarken 3 sn dokunulmazsa kaybolur; tek dokunuş ya da anlatımın bitmesi geri getirir. İlerleme çubuğu hep görünür.
- **Panelde** her cümle tek satır: Cümle · Fotoğraf · Kart · Açı · Vurgu. Fotoğraf bilgisi (başlık, kısa metin, kaynak, lisans, güven) bir kez girilir; **Kart** açık olan fotoğraflar 3D anlatımda kart olarak çıkar. 3D'si olmayan eserde sadece Cümle · Fotoğraf.
- **Yayın kuralı:** her cümlede fotoğraf zorunlu (3D'li eserde de). Her fotoğrafta kaynak ve lisans zorunlu.
- **Fotoğraflar:** Vakıf Eserleri Envanteri'nden (Bursa fotoğraf arşivi, `veri/bursa-foto/`). 20 Ekim: envanter tamamen izinli; kitapların metni ve görselleri ile fotoğraf arşivi proje için verildi, uygulamada kullanılabilir. Lisans alanı: «Proje için verildi; kullanılabilir», künye: «Fotoğraf: Bursa Vakıf Eserleri Envanteri». Eski fotoğraflar (Geçmişi Gör) ayrı kaynaktan, Foto Atlas'tan gelir; izinleri kurum kurum (bkz. §15 madde 13).
- **Ekranlar:** ekip Figma dosyası `akar-app` (Bd3m8…) ve PNG kopyaları `design/ekranlar-15ekim/` (21 ekran). Yayındaki kodla farkları: `design/karsilastirma/` 14–19.

**3D veri hattı ve durum (15 Ekim).**
- 32 Bursa eseri için `eserler/<eser>/eser.md` hazır: ölçüler kaynak kodlu (P plan, E envanter, H hesap, W web, O OSM, M maket, F fotoğraf, T tahmin; boş hücre = tür varsayılanı + VARSAYIM), Palet (stil rengi) ve Vurgu tabloları dolu. Çelişki kararları `veri/bursa/KARARLAR_14Ekim.md`; denetim raporları `veri/bursa/denetim/` (62 W URL'si açıldı, alıntılar kaynakta bulundu).
- Model durumu (22 Ekim): GLB teslimleri `eserler/<eser>/3d/export/` altında: Ulucami v26, Bedesten v06, Koza Han v14, Orhan Bey Camii v07, Orhan Bey Hamamı v05, Emir Hanı v05, Orhan Gazi Türbesi v02. Güncel sürüm her eserin `3d/README.md` dosyasında. Ortak stil: `veri/bursa/sablonlar/_ortak_stil.md`.
- Görev dağılımı: `GOREV_DAGILIMI_15Ekim.md` (20 Ekim'de kaldırıldı; git geçmişinde, commit `1f977c9`).

---

## 0.5 · 13 Ekim güncellemesi

Bu bölüm aşağıdaki bazı bölümlerin yerini alır. Çelişki varsa burası ve `FRONTEND_BACKEND_NOTLARI.md` geçerlidir.

**Değişen kararlar**
- **Şehir: Bursa.** İlk örnek şehir İstanbul'du (Karaköy–Tophane); Bursa'ya geçildi. Vakıf Katılım envanter kitapları geldi (Bursa 3 cilt / 385 eser, Konya 2 cilt / 289, Hatay 1 cilt / 117; Kütahya 141 bilgi notunda, kitabı yok; İzmir/Manisa sürüyor). En çok veri Bursa'da, şehir de gündemde.
- **Ana hikâye:** Ulucami (hayrat) + Bedesten (akar). Kaynak: "Yıldırım Bayezid tarafından Ulucami'ye gelir sağlamak amacıyla yaptırılan Bedesten…" (Bursa Envanteri, Cilt 1). İkinci akar zinciri: 1360 vakfiyesine göre Eski Bedesten, dükkânlar ve Bıçakçılar Hamamı Orhan Gazi İmareti'ne vakfedilmiş.
- **Örnek rota:** Hanlar Bölgesi Vakıf Yürüyüşü: Ulucami (1399) → Koza Hanı (1491, II. Bayezid) → Orhan Gazi Camii (1339). Kesin değil.
- **3D:** Ayasofya pilotu (12–13 Ekim, v19) kapandı. Yöntem pilotuydu, demoda ana eser değil. Dersler `eserler/_kutuphane/AKAR_3D_Yontem_Notlari.md`. Bütçe artık ≤ 40k üçgen (eski 15k sınırı geçersiz; 25k Redmi 9T'de ~60 FPS). Sıradaki: Ulucami + Bedesten, sonra Koza Hanı.
- **Yönetim paneli:** tek akış. Yeni eser → 1 Model → 2 Bilgiler → 3 Kaynaklar → 4 Hikâye → 5 Yayın; 3D önizleme hep sağda. Hikâyede her cümle: açıyı kendimiz kaydediyoruz (daireye basınca o açıya dönüyor), kart ekliyoruz, parçayı vurguluyoruz. Ortak ekranlar: Kartlar, Rota düzenle, İçe aktar, Katkı moderasyonu.
- **Tasarım:** kitapların görsel dilinden şehir desenleri (kendi üretimimiz: Bursa 8 kollu yıldız, Konya 12 kollu gülbezek, AKAR amblemi), şehir aksanı rengi (`--sehir-aksan`; butonlar değişmez), rota durağı = 8 kollu yıldız. Masaüstü harita kontrolleri sağda dikey ortada. Rumi motifi tasarım sorumlusu tarafından elle çizilecek.
- **Figma:** tüm örnek içerik Bursa'ya çevrildi (Ulucami, Bedesten, Koza Hanı, Orhan Gazi Camii; şehir listesi Bursa/Konya/Hatay/Kütahya/İzmir).

**Not:** Bu belgenin örnek içeriği (§3, §6, §9, §10, §13, §14, §15) Figma'daki Bursa içeriğine göre güncellendi.

---

## 1. Kim, ne, ne zaman

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

| Rol | Sorumluluk |
|---|---|
| Takım kaptanı / tasarım sorumlusu | Resmî iletişim, UX/UI, harita tasarımı, 3D |
| Mimari ve güvenlik sorumlusu | Altyapı, güvenlik, RLS kuralları |
| Ürün ve frontend sorumlusu | Ürün yönetimi, Figma'dan arayüz geliştirme |
| Veri ve doğrulama sorumlusu | Veri seti dönüşümü, kaynak doğrulama |

**Ekip içi sorumluluk:**

- Muhammed takım kaptanı ve UX/UI tasarımcısıdır.
- Tamer ürün yönetimi ve frontend sorumlusudur.
- Burak tenik altyapı ve backend sorumlusudur.
- Talha veri ve doğrulama sorumlusudur.

- GitHub organizasyonu: `Internet-Kahve`.
- 3D ve performans için ayrı bir sorumlu atanmadı; bu iş tasarım sorumlusunda. Risk olarak işaretlendi.

---

## 2. Fikrin geçmişi (nereden nereye geldi)

1. **İlk fikir (Eylül):** Pokémon GO tarzı bir oyun. Oyuncu vakıf eserlerine gidip o yerle ilişkili tarihî kişilerin kartlarını topluyordu (Süleymaniye'de Mimar Sinan gibi). Kamera üzerinde karakter yakalama demosu (`kamera-demo.html`) yapıldı.
2. **KATMAN:** Takımdaki bir arkadaşın ayrıntılı ürün dokümanı. İçinde katmanlı içerik (Tier 1/Tier 2/Hero), güven etiketleri, yönetim paneli ve demo B planları vardı. Karar: "KATMAN'ın iskeleti, AKAR'ın kalbi." İki fikir birleştirildi.
3. **Seçili eserler odağı:** Bütün bir semti modellemek yerine seçili vakıf eserleri. İlk örnek Karaköy–Tophane'ydi; envanter kitapları gelince şehir Bursa oldu ve merkez hikâye **Ulucami (hayrat) + Bedesten (akar)** çiftine kuruldu. Bu çift akar sistemini canlı bir örnekle gösteriyor: Bedestenin geliri Ulucami'nin bakımına ayrılıyordu.
4. **Kedi maskot:** Konuşuldu, kesildi. Odağı dağıtıyordu ve "kediler ve vakıf" anlatıları çoğunlukla kaynaksız.
5. **Scrollytelling:** Yandex 3D Türkiye ve Şehir Dedektifi'nden ilham alındı. "Anlatım ekranı yönetir" fikri burada doğdu ve projenin en güçlü kısmı oldu.
6. **Prototip:** Vanilla JS + MapLibre + three.js ile `akar-app.netlify.app` yapıldı (önceki sürüm `lambent-dango-3ff0b8.netlify.app`). Yalnızca fikri şekillendirmek için yapılmış bir örnektir. Ürün React + TypeScript ile sıfırdan kuruluyor.
7. **Tasarım yönü:**
   - Önce Matrakçı Nasuh minyatürü + modern + revzen camı (macOS 27 "Liquid Glass" esinli).
   - Bu yön sonra silindi.
   - Şimdiki yön **"Çini" paleti:** lacivert ana renk, altın sadece süs, soğuk açık gri zemin (bkz. bölüm 7).
8. **Finale kaldıktan sonra (9–11 Ekim):**
   - Figma'da yaklaşık 77 ekran (45 mobil, 27 masaüstü, 5 panel), tasarım sistemi ve 22 özel ikon hazırlandı. (20 Ekim itibarıyla `akar-yeni` dosyasında 121 ekran var: 14 panel, 47 masaüstü, 60 mobil.)
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
3. Anlatım cümle cümle ilerler (**Dinle** ya da **Oku**). Her cümlenin bir fotoğrafı var; 3D'si olan eserde her cümle 3D sahnede kamerayı, vurguyu ya da modele bağlı kartı da değiştirir.
4. Hikâyenin sonunda akar akışı gösterilir: Bedesten'den Ulucami'ye akan altın bir çizgi.
5. **Hikâye sonrası** ekranında seçenekler: Geçmişi Gör, Yaşayan hafıza (izler + İz Bırak; 22 Ekim) ve (rotadaysa) Sonraki durak. (Bulmaca beklemede, §0.6.) Ayrıca "Eser hakkında" uzun metni.

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
| **Temsili canlandırma** | Görsel temsil (3D model, Yıldırım Bayezid portresi vb.) | #5B4E86 / #ECE8F5 | kesik çizgili küp |

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
| **İnteraktif anlatım** | Cue listesi. Her cümle bir sahne durumu tarif eder: fotoğraf, kamera, vurgu, kart, akar akışı, gravür. İki görünüm (15 Ekim): **Fotoğraf** her eserde, **3D** modeli olan eserde. Kartlar three.js CSS2DRenderer ile modeldeki noktalara bağlı. |
| **Dinle / Oku** | Aynı arayüz. Dinle'de ses çalar, sahneler kendiliğinden ilerler. Oku'da ses yok; kaydırınca, Boşluk'a ya da ↓'ye basınca aynı sahneler oynar. Oku erişilebilirlik için de önemli. |
| **Geçmişi Gör** | 22 Ekim: büyük eski fotoğraf, tarih sıralı şerit ve «Nereden çekildi?» haritası (çekim noktası + görüş konisi). Bugünkü eşi varsa eski ↔ bugün kaydırıcısı. «Kamerayı aç»: kamera üstüne eski fotoğraf yarı saydam bindirilir, kullanıcı aynı açıdan çeker ve İz Bırak olarak gönderebilir. Kamera yalnız telefonda. «Tozu sil» **yok**. "AR" / "Tam AR" **denmeyecek**. |
| **Bulmaca** | **15 Ekim: şimdilik yapılmayacak, değişebilir (§0.6).** Esere bakarak bir detay bulunur; doğru cevap hikâyenin devamını ya da gizli durağı açar. İki kademeli ipucu, esnek cevap, evden karşılık. Cami içinde görev yok. |
| **İz Bırak** | Fotoğraf + kısa anı. Durum: beklemede → onaylandı / reddedildi. Onaylananlar eserin "Yaşayan hafıza" bölümünde görünür. 22 Ekim: giriş «Yaşayan hafıza»dan (herkesin izleri → + İz Bırak). Kameradan gelen fotoğraf «aynı açı» etiketi taşır, onaylanınca Geçmişi Gör'de bugünkü eş olabilir. «Tüm izler» sayfası şehir / eser seçimiyle. |
| **Vakıf (akar) akışı** | Bedestenin gelirinin Ulucami'nin bakımına, aydınlatmasına ve görevlilerine akışı (kalemler kaynak kontrolünden sonra netleşir). Eğitim amaçlı; gerçek para ya da bağış yok. |
| **Rotalar** | Varsayılan serbest keşif. "Rota öner" ile hazır rotalar; 1-2-3 numaralı duraklar, altın çizgi, ilerleme çubuğu. **Rota oluşturucu ("Bana rota oluştur": süre + ilgi alanı) kapsamda.** |
| **Rozet / yapboz** | Keşfedilen eserlerle tek bir ödül sistemi. **15 Ekim: kapsamda olup olmadığı kararı bekliyor.** |
| **Birlikte Gez** | **15 Ekim: şimdilik yapılmayacak, değişebilir (§0.6).** Tanıdıklara davet linki gönderilir, aynı anlatım birlikte dinlenir. Konum paylaşımı ve yabancılarla eşleşme yok. |
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
- "Bursa ▾" şehir seçicisi alttaki sheet satırında durur ve haritayı takip eder.
- Görsel ve bilgi ayrı etiketlenir. Yıldırım Bayezid portresi "Temsili" etiketlidir (kendi döneminden gerçek portresi yok); "Ulucami 1399'da yaptırıldı" cümlesi ise "Doğrulanmış" olur.

---

## 6. Harita (sıradaki iş, tasarım sorumlusu yürütüyor)

- **Tek Türkiye haritası** olacak; şehir şehir ayrı harita yok. Uygulama kullanıcının şehrinden açılır, demoda Bursa'dan (Hanlar Bölgesi).
- **Üç seviye:**
  - Türkiye: şehir baloncukları ("Bursa · 385")
  - Şehir: ilçe grupları ("Osmangazi · 6" gibi; sayılar örnek)
  - Sokak: 4 renkli pinler
- MapLibre'de `cluster: true` ile yapılır. Grup baloncuğu lacivert daire ve içinde sayı; pin renkleri baloncuğa karışmaz.
- Konum izni vermeyen ya da "Evden gez" ile giren kullanıcı Bursa'dan başlar.
- **Maputnik'te stil:** Restoran, market gibi OSM POI'leri kapatılacak; sadece AKAR pinleri öne çıkacak. Etiketler `name:tr` alanına bağlanacak.
- **Pin rengi = eserin vakıftaki rolü** (eser türü değil):

| Rol | Renk | Eser türleri |
|---|---|---|
| dini (hayrat) | yeşil #2E7D32 | cami, mescit, türbe, tekke, zaviye |
| su (hayrat) | mavi #2A6FB0 | çeşme, sebil, su kemeri, sarnıç |
| eğitim ve sosyal (hayrat) | lacivert #25477B | medrese, mektep, kütüphane, imaret, darüşşifa, köprü, külliye |
| akar | bakır #9A5B2E | hamam, han, bedesten, arasta, dükkân |

- Pin gövdesinde kırmızı, mor ve altın kullanılmaz.
- **Pin biçimi:** sivri kemer, haritada 32×38 px; seçili 40×48 (1,25×). İçinde beyaz tür ikonu, 16–18 px (Figma «5 · Ölçüler ve bileşenler», 22 Ekim).
- **Pin durumları:**
  - Seçili: 1,25× büyük, altın halka
  - Tamamlandı: altın ✓
  - Gizli: beyaz zemin, kesik kenar, "?"
- **Karar bekleyen:** Harita renk yönü (Kâğıt / Sakin gri / Çini).
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
- 15 Ekim fotoğraf/3D ekranları bu dosyaya eklendi. PNG kopyaları `design/ekranlar-15ekim/` altında.
- Önceki sürüm dosyaları arşivlenmiştir; kullanılmaz.
- **Güncel çalışma dosyası (20 Ekim):** `akar-yeni` (https://www.figma.com/design/HGTgq5vRXVqhVO9TcR9wBe/akar-yeni). Yukarıdaki `akar-app` bağlantısı önceki sürümdür; iki dosya arasında fark varsa `akar-yeni` esas alınır. Backend planı da bu dosyaya göre hazırlandı.
- **MCP kotası:** Ücretli (Pro) hesapta çalışılıyor; eski «Starter, ayda ~6 çağrı» notu geçersiz. Yine de 121 ekranı tek tek görsel okumak yerine önce metin dökümü alınır.
- **Sayfa düzeni (22 Ekim, `akar-yeni`):** tek sayfa, bölümler: Kapak · Kullanıcı akışları · Demo yolu · 00 Tasarım Sistemi (10 panel) · 📱 Mobil (390×844) · 🖥 Masaüstü (1440×900) · 🛠 Yönetim paneli · Eski sürümler (22 Ekim) · Geçmişi Gör · alternatifler (22 Ekim). Toplam 121 ekran (60 mobil, 47 masaüstü, 14 panel; 20 Ekim sayımı).
- Bölüm sırası akışa göre: Açılış ve keşif → Rotalar → Eser ve anlatım → Etkileşim → Hesap ve bilgi → Ortak parçalar.
- **Adlandırma:** "WF · / B ·" mobil, "D ·" masaüstü, "WF · Panel /" yönetim paneli. Her ekranın altında "Not / <ad>" metni var.
- Değişken koleksiyonları: "AKAR · Renkler" ve "AKAR · Ölçüler".
- **Bileşenler:** ikon/* (22), Süsleme, Pusula, Harita pini (Durum × İkon), Harita lejantı, Panel sekmesi (Açık/Kapalı).

**Figma'da elle yapılacak küçük düzeltmeler**
1. ~~"D · Anlatım / Oku": ✕ butonu "Kaydırarak oku" yazısına çok yakın.~~ Yapıldı: "Kaydırarak oku" kaldırıldı (Figma masaüstü bölüm notu).
2. ~~"D · E-posta kodu": arka plan düz lacivert.~~ Yapıldı: kod ekranının arkasında harita var.
3. ~~Mobildeki B · Anlatım ekranlarının sol üstüne ✕ eklenmeli.~~ 15 Ekim'de yapıldı (üst bölüm yeniden düzenlendi).
4. ~~"Tam ekran 3D" butonu silinebilir.~~ Yapıldı: kaldırıldı.

**Eksik tasarımlar:** logo, uygulama ikonu, splash, rozet görselleri ve adları. (Odak halkası ve devre dışı buton durumu Figma «00 · Tasarım Sistemi › 8 · Erişilebilirlik durumları» panelinde çizili.)

---
Beylere Not:
(Bağlam belgesinde teknoloji tercihi Vite + React + TypeScript, mobil öncelikli PWA ve Supabase (Postgres, Auth, Storage, RLS) olarak tanımlanıyor. Ayrı bir backend sunucusu planlanmıyor; ileride mağaza uygulaması gerekirse Capacitor değerlendiriliyor.
Mevcut yayındaki uygulama ise Next.js + React + TypeScript kullanıyor ve verileri şimdilik mock servis üzerinden tarayıcıdaki localStorage’da tutuyor. Uygulamanın teknik belgelerinde ayrıca ayrı bir backend API’si ve ilerleyen aşamada Expo / React Native yaklaşımı yer alıyor; bunlar henüz uygulanmış değil.
Dolayısıyla bağlamdaki teknoloji planıyla mevcut uygulama ve teknik yol haritası arasında farklılıklar bulunuyor. Mevcut yapının korunması, bağlamdaki yapıya geçilmesi veya iki yaklaşımın birleştirilmesi konusundaki değerlendirme ve nihai tercih, ekip deneyimi ve geliştirme takvimi doğrultusunda Tamer ve Burak’ın inisiyatifine bırakılmıştır.)

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
  - Magic link önce önerildi; ekip değerlendirmesi sonrası koda geçildi.
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

**Hero model:** Ulucami + Bedesten (ana hikâye), ardından Koza Hanı. Sıra: Ulucami → Bedesten → Koza Hanı.
- Her eser ayrı .glb; bütçe eser başına ≤ 40.000 üçgen, ≤ 60 draw call, ≤ 1 MB (25.000 üçgen Redmi 9T'de ~60 FPS). **İstisna: Ulu Cami** (v26: 87 280 üçgen, 91 draw call; bu değerler tavan). Ayrıntı: `eserler/_kutuphane/AKAR_3D_Yontem_Notlari.md` §4.
- Modeller Blender'da Python betikleriyle üretilir; yöntem ve dersler `eserler/_kutuphane/AKAR_3D_Yontem_Notlari.md` içinde.
- Ayasofya pilotu (12–13 Ekim) yöntem denemesiydi, demoda ana eser değil.
- Tüm modeller **temsili**dir; ölçüler envanter kitabı, plan ve OSM ayak izinden türetilir, kaynağı `eser.md` dosyalarında tutulur.

**Parça adları ve noktalar:**
- Parça adları .glb ile kod arasında **birebir** aynı olmalı (vurgu ve kamera hedefi listesi bunlardan oluşur). Eser başına adlar `eserler/<eser>/` altında (`eser.md` parça adları bölümü) tutulur.
- Boş noktalar (Empty) modellerde yok (22 Ekim kontrolü). Kart noktası (`Kart_*`) gerekmez: kart cümlenin vurgu parçasına bağlanır (FRONTEND notları §10.6). Akar akışı yolu (`Akar_0 … Akar_n`) da hiçbir modelde yok; çizginin modelde mi, haritada iki eserin konumu arasında mı çizileceği açık.
- **Merkez:** Kamera bu noktanın etrafında döner. Prototipte kameranın yanlış noktanın etrafında dönmesi hatası böyle çözüldü (bkz. `PROTOTIP_DERSLERI.md`). 22 Ekim: modelde boş nesne olarak tutulmaz; `Merkez` ayrılmış addır, frontend uygulama GLB'sinin sınır kutusunun yatay ortasını zemin seviyesinde alır (FRONTEND notları §9).

**Yandex 3D Türkiye'den alınan dersler:**
- Modeller elle yapılır, Yandex'te model başına en fazla 15.000 poligon; AKAR bütçesi ≤ 40.000 üçgen (§0.5).
- Işık dokuya pişirilir (light baking). AKAR'da (22 Ekim kararı): ortam gölgesi (AO) köşe rengine pişirilir, güneşi uygulama hesaplar, gerçek zamanlı gölge yok. Tam pişirme (güneş de modele) Redmi testinde FPS düşük çıkarsa yapılır. Ayrıntı: `FRONTEND_BACKEND_NOTLARI.md` §9.
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

**Haritada 3D:** Sadece vakıf eserleri 3D olacak; geri kalan şehir düz kalacak. Bütün şehir modellenmeyecek.

**"Çizgi film gibi" eleştirisi (11 Ekim):** Bir geri bildirimde stilize modelin çizgi film gibi durduğunu söyledi ve fotoğraflardan oluşan, etrafında dönülebilen gerçekçi bir görünüm önerdi. Öneri:
- Eser detayında iki görünüm olsun:
  - **Hikâye** (stilize model, "Temsili" etiketi): anlatım ve akar için.
  - **Gerçek** (fotoğraftan, "Bugünkü kayıt"): bugünkü hâl için.
- Gerçek görünüm için yollar:
  1. Telefon videosundan Gaussian splatting (Polycam, Scaniverse, KIRI, Luma; dosyalar büyük, Redmi'de test şart).
  2. Fotogrametri .glb'si (sadeleştirilerek).
  3. 24–36 fotoğrafla döndürme görünümü (en hafif, her telefonda çalışır).
  4. Google Photorealistic 3D Tiles (ücretli, kuralları sıkı, şartlar kontrol edilmeden kullanılmamalı).
- **Drone:** Türkiye'de kayıt ve izin gerekiyor; Bursa'nın tarihî çarşı bölgesi de büyük ihtimalle kısıtlı olabilir; doğrulanmalı. Yerden telefonla çekim yeterli.
- **Pilot:** etrafı açık, küçük bir eser seçilmeli (örn. bir türbe ya da mescit). Sabah erken ya da bulutlu bir günde çekilmeli.
- Henüz karar verilmedi.

---

## 10. Örnek içerik

### Ulucami anlatımı (ESKİ ÖRNEK, geçersiz)

> **20 Ekim:** Aşağıdaki cümleler ilk Figma örneğidir ve kitapla kontrol edilince değiştirildi (ör. «dördüncü padişah» envanterde yok, «bakımına ayrılırdı» kitapta yok, şadırvan kubbesi bugün kapalı). Güncel 12 cümle, kaynakları ve güven etiketleri: `eserler/ulu-cami/icerik/hikaye.md`. Figma'daki içerik (cümleler, sayılar, kaynaklar) temsilidir; gerçek içerik `eserler/*/icerik/` dosyalarından gelir.
1. "Ulucami, 1399'da Yıldırım Bayezid tarafından yaptırıldı." · Doğrulanmış
2. "Yaptıran Yıldırım Bayezid, Osmanlı'nın dördüncü padişahıdır." 
3. "Mimarının kim olduğu kesin olarak bilinmiyor."
4. "Üstünü yirmi kubbe örter." → kubbeler vurgulanır
5. "Ortadaki şadırvanın kubbesi açıktır; içeri ışık oradan düşer."
6. "Bedestenin geliri Ulucami'nin bakımına ayrılırdı." → altın akış (Bedesten → Ulucami)

Güven etiketleri cümle bazında panelde atanır; yalnız cümle 1 kesinleşmiştir (Doğrulanmış). Kaynak: Bursa Vakıf Eserleri Envanteri, Cilt 1, s. 37. Sonraki durak cümlesi: "Az ileride Koza Hanı var. 1491'de II. Bayezid tarafından yaptırıldı."

### Örnek rota: Hanlar Bölgesi Vakıf Yürüyüşü (4 durak · ~10 dk · ~0,5 km; 22 Ekim)
Ulucami (1399, Yıldırım Bayezid) → Bedesten (14. yy, Yıldırım Bayezid) → Koza Hanı (1491, II. Bayezid) → Orhan Bey Camii (1339–40, Orhan Bey). Aşağıdaki bulmaca tablosu 3 duraklı eski hâlden kalmadır; bulmaca ertelendi.

| Durak | Rol | Bulmaca fikirleri (**hepsi taslak, doğrulanmadı**) |
|---|---|---|
| Ulucami | hayrat | Kubbe sayısı · şadırvan kubbesinin özelliği · **akar bulmacası:** Bedesten gelirini Ulucami'nin bakım kalemlerine sürükle |
| Koza Hanı | akar | Kaç katlı · ipek ticaretiyle bağı · eski fotoğrafla hizalayarak fotoğraf çekme |
| Orhan Gazi Camii | hayrat | Yapım yılı (1339) · Ulucami'den daha eski mi yeni mi · **final:** üç eseri yapım sırasına diz → rozet |

- **Mekanikler:** gizli durak (çözünce haritada belirir), iki kademeli ipucu, esnek cevap, "durağı atla" (kapalı ya da ibadet vakti), cami içinde görev yok.
- ⚠️ **Bulmaca cevaplarının hiçbiri doğrulanmadı.** Sahaya gidilip her durak fotoğraflanacak; bu hem cevapları doğrular hem Geçmişi Gör için fotoğraf sağlar.

### Eğitici mini özellik fikirleri (telefonda hafif çalışan)
- Akar sürükle-bırak şeması
- Dokununca açılan yapı parçaları diyagramı (kubbe, minare, şerefe, revak)
- 1580 → 1732 → 1826 zaman şeridi
- Terim kartları (akar, hayrat, vakfiye, mütevelli)
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

Diğer hackathon çalışmalarında görülen aşırı optimize yaklaşımlar değerlendirildi: fikir alınabilir, ancak kapsam riski vardır.

---

## 13. Riskler, hassasiyetler, doğrulanacaklar

### Doğrulanacaklar
- **Vakıf Katılım ortaklık yapısı:** Vakıf Katılım 2015'te VGM ile II. Bayezid, I. Mahmud, II. Mahmud ve Murat Paşa vakıflarınca kuruldu (kuruluş tarihindeki yapı; güncel ortaklık doğrulanmalı). Rota duraklarından Koza Hanı II. Bayezid'in yaptırdığı bir eser; bu vakıfla bağı doğrulanırsa sunumun güçlü cümlesi olur. **Doğrulanmadan söylenmez.**
- **Ulucami ve Bedesten vakfiyesinin yayımlanmış bir transkripsiyonu var mı?** (VGM arşivi, DergiPark; mentorlara sorulabilir.) Gerçek rakam bulunamazsa **uydurulmaz**; sadece akışın yapısı "Tarihsel çıkarım" etiketiyle gösterilir.
- Hero ve rota eserleri (Ulucami, Bedesten, Koza Hanı, Orhan Gazi Camii) sponsorun ham veri paketinde var mı? Yoksa yedek bir hero seçilir.
- Bulmaca cevapları, ziyaret saatleri, mimari detaylar.
- Supabase e-posta gönderim sınırı.

### Hassasiyetler
- Oyunda "yatırım, getiri, kâr, bağış, faiz" kelimeleri **kullanılmaz**.
- "Vakıf = katılım bankacılığı" benzetmesi kurulmaz. 16. yüzyıldaki para vakıfları ve faiz tartışması hassas bir konu.
  - Güvenli bağ kurumsal olanı: Vakıf Katılım'ın ana ortağı VGM, yani bu eserleri bugün yöneten kurum.
- Camilerde oyunlaştırma dili sade olacak, cami içinde görev olmayacak. "Ele geçirildi" değil "keşfedildi".
- Yıldırım Bayezid'in kendi döneminden gerçek portresi yok; portre görseli "Temsili" etiketli olur.
- Ulucami'nin mimarı kesin bilinmiyor; kesinmiş gibi yazılmaz.
- Kamera üstüne eski fotoğraf bindirmeye "AR" / "tam AR" denmez; düğmenin adı «Kamerayı aç».
- Rotaya vakıf eseri olmayan yapılar girerse "çevredeki tarihî yapılar" diye ayrılır.
- Tarihler ve yapıtlar kitapla doğrulanmadan metne girmez; her cümlede kaynak ve sayfa gösterilir.
- Çekimlerde ibadet saatlerine ve fotoğraftaki insanların mahremiyetine saygı (yüzler bulanıklaştırılmalı).

### En büyük risk: kapsam
- Figma'da 121 ekran var (20 Ekim), finale ~2,5 hafta kaldı. Bulmaca ve Birlikte Gez ekranları ertelendi, kapsam dışı.
- Frontend tek kişide (ürün ve frontend sorumlusu); harita ve 3D tasarım sorumlusunda.
- Birinciliği az ama kusursuz çalışan ürün getirir.
- İlk ekip toplantısında **"Finalde kesin çalışacak 5 şey"** listesi çıkarılmalı. Demo yolu omurga olsun; Birlikte Gez, rota oluşturucu ve rozetler ikinci sırada.

---

## 14. Final demosu (3–4 dakika, planlanan)

Harita → Ulucami → fotoğraflı anlatım, sonra 3D'ye geçiş (kartlar, kubbe vurgusu) → akar akışı (Bedesten → Ulucami) → Geçmişi Gör → İz Bırak ("onay bekliyor") → yönetim panelinde onay ve yeni eser ekleme (haritada anında görünür).

- Sahnede konum çalışmayacağı için **demo modu / Evden gez** kullanılacak.
- Hanlar Bölgesi'nde çekilmiş kısa bir saha videosu da gösterilecek (saha günü yapılabilirse).
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
3. Harita: renk yönü ve 3 seviyeli Figma ekranları (tasarım sorumlusu).
4. Masaüstü anlatım: sol panel mi, altyazı modu mu?
5. Atlayarak sona gelen "tamamlandı" sayılsın mı?
6. Gerçek görünüm (fotoğraftan 3D) eklenecek mi; eklenirse hangi yöntemle?
7. Saha günü: dört durağın (Ulucami, Bedesten, Koza Hanı, Orhan Bey Camii) fotoğrafları, eski fotoğraf açıları, bulmaca cevaplarının doğrulanması.
8. Eski görseller: Foto Atlas'tan 236 kullanılabilir Bursa fotoğrafı alındı ve eserlere bağlandı (22 Ekim, `veri/fotoatlas/`). Gravürler ayrıca aranacak; aynı alanlarla (çizer, tarih, kaynak, lisans) eklenecek.
9. Tasarım sistemi eksikleri: logo, uygulama ikonu, splash, rozet görselleri (odak halkası ve devre dışı durum Figma'da çizili).
10. Belgeler: lisans tablosu, KVKK metni, README.
11. Figma: eğitim planı onayı ya da ücretli plan kararı.
12. Kod geliştirme promptları (`veri/_arsiv/AKAR_Claude_Promptlari.md`; 22 Ekim'de `_arsiv` ile kaldırıldı, git geçmişinde, commit `ef36c58`). 22 Ekim: oradaki §8 Geçmişi Gör promptu eskidi («Tozu sil», sekmeler); geçerli tarif `FRONTEND_BACKEND_NOTLARI.md` §12.
13. Tüm izler sayfasının girişi (Keşif mi Profil mi).
14. Orhan Bey Camii (Foto Atlas'ta «Orhan Gazi Camii») fotoğrafı 25056 doğrulanacak; Koza Hanı ve Orhan Bey Camii için saha çekimi.
15. I. Murad Hüdavendigâr Külliyesi koordinatı (`veri/fotoatlas/eser_konum.csv`); Osman Gazi Türbesi ayrı eser mi?
16. Eşleştirme raporundaki 62 «olası» öneri ve otomatik alt metinler (içerik sorumlusu).
17. ~~Vakıf Katılım'dan envanter fotoğraflarının uygulamada kullanım izni (yazılı).~~ Çözüldü (20 Ekim): envanter (metin, görseller, fotoğraf arşivi) proje için verildi. Foto Atlas tarafında Foto Atlas (Caner Cangül), Mazhar Yüce Doruk Koleksiyonu ve İÜ Nadir Eserler Kütüphanesi izin verdi, Dumbarton Oaks reddetti; 5 kurumdan cevap bekleniyor (28 Ekim'de hatırlatma). Bir görsel yalnız `durum` alanı `kullanilabilir` / `kullanilabilir-yas` ise kullanılır: `veri/fotoatlas/IZIN_DURUMU.md`.
18. Rozetler kapsamda mı?
19. Bulmaca ve Birlikte Gez'in yerine ne gelecek?
20. Panelde "Kartlar" menüsünün adı "Fotoğraflar" olsun mu? (Kart artık cümlenin fotoğrafı.)

---

## 16. Üretilen dosyalar

| Dosya | İçerik |
|---|---|
| `AKAR_Basvuru.pptx / .pdf` | 3 sayfalık başvuru (gönderildi) |
| `AKAR_Takim_Plani.pdf` | 8 sayfalık ekip ikna dokümanı |
| `AKAR_Kisa_Plan.pdf`, `AKAR_Sunum.pdf` | Kısa plan, sunum özeti |
| `Ortak_Vizyon_KATMAN_Akar.docx` | KATMAN ve AKAR birleşimi |
| `AKAR_Minyatur_Yonu.docx` | Eski tasarım yönü (artık geçerli değil) |
| `AKAR_Netlestirme_Notu.docx`, `AKAR_Plan.xlsx` | Netleştirme notu, plan tablosu |
| `kilic-ali-pasa-model.zip` | .glb + .blend + Blender betiği + önizleme |
| `AKAR_ikonlar_svg.zip`, `AKAR_ikon_seti.png` | 22 özel ikon |
| `tokens.css` | Tasarım token'ları |
| `GOREV_DAGILIMI_15Ekim.md` | Kim ne yapacak (ChatGPT, içerik, 3D). 20 Ekim'de kaldırıldı; git geçmişinde (`1f977c9`) |
| `PROTOTIP_DERSLERI.md` | Prototipten çıkan kamera, çizim ve anlatım motoru dersleri |
| `AKAR_Claude_Promptlari.md` | Kod geliştirme promptları. 22 Ekim'de kaldırıldı; git geçmişinde (`ef36c58`) |

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
