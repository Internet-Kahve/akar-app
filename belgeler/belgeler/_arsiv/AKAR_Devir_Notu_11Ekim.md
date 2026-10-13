# AKAR — Devir notu (11 Ekim 2026)

> Bu not 9 Ekim notunun yerini alır. Renk paleti, Figma dosyası ve birçok UX kararı o tarihten sonra değişti.

## 1. Proje ve takım
- **Yarışma:** KÖK&KOD / ROOT&CODE Hackathon (42 Türkiye × Vakıf Katılım × Bilişim Vadisi).
- **Takım:** "İnternet Kahve", 57 takım arasından finale kalan 25 takımdan biri.
- **Takvim:** Online geliştirme 8 Kasım'a kadar sürüyor. **Yüz yüze final 7–8 Kasım.**
- **Roller:**
  - Muhammed: kaptan, UX/UI, harita tasarımı, 3D
  - Burak: mimari ve güvenlik
  - Mustafa: ürün yönetimi ve frontend (Figma'dan kodlayacak)
  - Talha: veri ve doğrulama
- **GitHub:** `Internet-Kahve` organizasyonu.

**AKAR nedir?**
Vakıf eserlerini haritada keşfettiren, mobil öncelikli bir PWA. Fikrin özü: hayrat yapıları (cami, çeşme, medrese…) halka ücretsiz hizmet verir. Akar yapıları (hamam, han, dükkân…) gelir getirir ve bu gelir hayratın bakımını ve görevlilerini karşılar. Yapılar bu sistem sayesinde yüzyıllarca ayakta kaldı.

**Ana akış:**
1. Haritada bir esere dokunulur.
2. "Hikâyeyi başlat" ile anlatım başlar. Hikâye cümle cümle anlatılır (Dinle/Oku). Her cümle 3D sahnede kamerayı, vurguyu ya da kartı değiştirir.
3. Hikâye sonrası: Geçmişi Gör (gravür ve bugün), Bulmaca, İz Bırak (moderasyonlu), rotadaysa sonraki durak.

Ayrıca profil, puan ve rozet var. Yönetim panelinde eser ekleme/düzenleme, cue düzenleyici ve moderasyon bulunuyor; panel şartnamede zorunlu.

**Projenin farkı:** Her cümlenin bir güven etiketi (Doğrulanmış / Tarihsel çıkarım / Temsili) ve kaynağı var. Bu, şartnamedeki 5.1.3 maddesine cevap veriyor. Jüri "neden yapay zekâ yok?" diye sorarsa cevap da bu.

**Demo:**
- Hero eser: Kılıç Ali Paşa Külliyesi (cami, hamam ve Tophane Çeşmesi tek .glb'de, yaklaşık 5.900 üçgen).
- Rota: Tophane Vakıf Yürüyüşü.
- Demo yolu: harita → Kılıç Ali Paşa → 3D'li anlatım → akar akışı → Geçmişi Gör → bulmaca → İz Bırak → panelde onay.

## 2. Teknik
- **Yığın:** Vite + React + TypeScript (PWA) · MapLibre + OpenFreeMap · three.js (.glb, CSS2DRenderer kartlar) · Supabase (Postgres, Auth, Storage, RLS) · Netlify.
- **Anlatım motoru:** Bir cue listesi. Her cümlenin başlangıç saniyesi, metni, güven etiketi, kaynağı ve sahne durumu (kamera, kart ve vurgu hedefi) var. Cue bir değişiklik emri değil, sahnenin tam durumunu tarif ediyor. Dinle ve Oku aynı `sahne.uygula()` fonksiyonunu çağırıyor. Cümle başına ayrı ses dosyası öneriliyor.
- **Giriş:** Şifre yok.
  - Google ile giriş (ana yol).
  - **E-posta ile 6 haneli kod**, link değil: `signInWithOtp({ email })` → `verifyOtp({ email, token, type: "email" })`. E-posta şablonunda `{{ .Token }}` kullanılacak, kodun geçerlilik süresi 600 sn.
  - Supabase'in kendi e-posta servisi büyük ihtimalle sadece ekip üyelerinin adreslerine gönderiyor (doğrulanmalı). Bu yüzden **Resend SMTP** bağlanacak.
- **Harita verisi:** OSM etiketleri `name` yerine bir dil alanına (`name:tr`) bağlanacak. Böylece ileride çoklu dil (`name:en`, `name:ku`…) kolay olur.

## 3. Figma
- **Güncel dosya:** https://www.figma.com/design/uHF60LM3Ib0ouFcSwvpUbH (ikinci hesap, Starter plan).
- **MCP kotası:** Ayda 6 çağrı; bu ayın kotası büyük ihtimalle bitti. Eski dosya 2ZMn… artık kullanılmıyor.
- **Sayfa düzeni (tek sayfa):**
  - Kapak
  - 00 · Tasarım Sistemi (Frontend)
  - Kullanıcı akışları
  - Demo yolu
  - **📱 Mobil (390×844, 45 ekran):** 1 Açılış ve keşif → 2 Rotalar → 3 Eser ve anlatım → 4 Etkileşim → 5 Hesap ve bilgi → 6 Ortak parçalar
  - **🖥 Masaüstü (1440×900, 27 ekran):** aynı sıra
  - **🛠 Yönetim paneli (5 ekran)**
- **Adlandırma:** "WF · / B ·" mobil, "D ·" masaüstü, "WF · Panel /" yönetim paneli. Her ekranın altında "Not / <ad>" metni var.
- **Değişkenler:** "AKAR · Renkler" (color/*, trust/*, pin/*) ve "AKAR · Ölçüler" (space/*, radius/*). Code syntax `var(--x)`.
- **Text style'lar:** Başlık/XL, Başlık/L (Cormorant), Başlık/M, Gövde/Büyük, Gövde/Normal, Gövde/Vurgu, Etiket.
- **Bileşenler:**
  - ikon/* (22 adet)
  - Süsleme / altın çizgi
  - Pusula (K/D/G/B)
  - Harita pini (Durum: Normal/Seçili/Tamamlandı/Gizli; İkon: instance swap)
  - Harita lejantı
  - **Panel sekmesi** (Durum: Açık ◀ / Kapalı ▶)
- **MCP ile çalışırken:**
  - `use_figma` çağrısından önce figma-use skill'i yüklenmeli.
  - İşler büyük, try/catch'li tek çağrılarda toplanmalı.
  - Başka dosyadan kopyalanan şeylerde değişkenler yeniden bağlanmalı.
  - Text düzenlemeden önce `loadFontAsync` çağrılmalı.

## 4. Tasarım sistemi (tokens.css ile birebir)
**Renkler**

| Grup | Değerler |
|---|---|
| Temel | bg #F3F5F5 · surface #FFFFFF · text #141B2B · text-muted #4A5466 · border #DAE1E2 |
| Ana renk | primary #25477B · primary-dark #1B355C · primary-light #E6ECF5 · on-primary #FFF |
| Vurgu ve hata | gold #C9A13B (sadece dekor ve ikon, yazıda kullanılmaz) · gold-text #8A6A16 · error #B3261E (sadece hata) |
| Güven etiketleri | Doğrulanmış #1E6B4A / #E3F2EA · Tarihsel çıkarım #8A5A00 / #FBEFD6 · Temsili #5B4E86 / #ECE8F5 |
| Pinler | dini #2E7D32 · su #2A6FB0 · eğitim #25477B · akar #9A5B2E |

**Pin renkleri** eserin vakıftaki rolünü gösterir:
- Dinî (cami, mescit, türbe, tekke, zaviye): hayrat
- Su (çeşme, sebil, su kemeri, sarnıç): hayrat
- Eğitim ve sosyal (medrese, mektep, kütüphane, imaret, darüşşifa, köprü, külliye): hayrat
- Akar (hamam, han, bedesten, arasta, dükkân)

Veri modelinde kendi güven etiketiyle birlikte bir "vakıf rolü" alanı olacak.

**Pin:**
- Biçim: sivri kemer, 40×48. Yol: `M20 1.5C26 5 33 11 33.5 20V33Q33.5 35.5 31.5 37L22 45.5Q20 47.2 18 45.5L8.5 37Q6.5 35.5 6.5 33V20C7 11 14 5 20 1.5Z`
- İçinde --on-primary renkli, 16–18 px tür ikonu var.
- Durumlar: Seçili = 1,25× büyük ve altın halka. Tamamlandı = altın ✓. Gizli = beyaz zemin, kesik kenar ve "?".

**Ölçüler:** space 4 / 8 / 12 / 16 / 24 / 32 · radius 8 / 12 / 16 / 999.

**Yazı:**
- Inter (400, 500, 600).
- Cormorant Garamond SemiBold sadece 22 px ve üstü başlıklarda. Rakamlar için `lining-nums` şart, yoksa "1" küçük "ı" gibi görünüyor.

**Süsleme (altın çizgi) sadece şu yerlerde:** eser kartı ve Eser detay başlığının altı, Hikâye sonrası, Eser hakkında bölüm araları, Profil, Rota tamamlandı, İlk açılış.

**İkonlar:**
- Genel arayüz: Lucide (`lucide-react`, size 20, strokeWidth 2, gap 8). Dinle → Headphones, Oku → BookOpen.
- AKAR'a özel ikonlar: içi dolu, sade SVG'ler. Ayrıca `AKAR_ikonlar_svg.zip` olarak teslim edildi.

**Eski tasarımdan alınanlar:** serif başlıklar, altın süsleme, ikon+yazı butonlar, pusula, "Yapının hikâyesi · 9 bölüm" satırı, "‹ Harita" butonu.
**Alınmayanlar:** teal ve krem renkler, terracotta Temsili etiketi, eski harita renkleri.

## 5. UX kararları
**Kartlar ve butonlar**
- Keşif ve Rota kartlarında tek buton var: "Hikâyeyi başlat · X dk". Varsayılan mod Dinle. Kullanıcı Oku'yu seçtiyse bu sessizce hatırlanır.
- Eser detayında Dinle ve Oku ayrı butonlar.
- Kart durumları:
  - Başlanmadı → "Hikâyeyi başlat"
  - Yarıda kaldı → "Devam et · 5/9"
  - Bitti → "Tekrar göz at" (Hikâye sonrası'na gider)

**Giriş**
- Google Haritalar mantığı: kullanıcı önce misafir olarak gezer.
- Giriş sadece şunlarda gerekir: İz Bırak, beğeni, kalıcı puan/rozet, cihazlar arası rota.
- Giriş isteği ilk hikâye bitince bir kez çıkar. "Şimdi değil" denirse ilk rozette tekrar çıkar.
- Misafirken kazanılan ilerleme hesaba taşınır.

**Profil**
- Profile arama çubuğundaki avatardan girilir; avatara basınca menü açılır, ayarlar oradan.
- "İstanbul ▾" seçicisi alttaki sheet satırında durur ve haritayı takip eder.

**Kapsamda olanlar**
- Rota oluşturucu ("Bana rota oluştur": süre + ilgi alanları) ve Birlikte Gez kapsamda.
- Mimar Sinan portresi Temsili etiketli, bilginin kendisi Doğrulanmış.

**Anlatım ekranları**
- Dinle ve Oku aynı arayüz. Oku'da ses yok, Boşluk ya da ↓ ile ilerlenir.
- **Çıkış:** Her anlatım ekranında sol üstte ✕ var, masaüstünde Esc de çalışıyor.
  - Ses durur, ilerleme kaydedilir, kullanıcı geldiği ekrana döner. Onay sorulmaz.
  - Mobilde geri tuşu ya da geri kaydırma aynı işi yapar.
- **Geçme:**
  - Sonraki cümle: ileri butonu, Boşluk ya da ↓.
  - Üstteki ilerleme çubuğunun parçaları tıklanabilir, o bölüme atlar. Son parça Hikâye sonrası'nı açar.
  - Rotada ✕ basınca rota haritasına dönülür, orada "Sonraki durak" butonu var.
  - Ekrana sağ/sol dokunarak geçme özelliği **yok**, çünkü 3D'yi döndürme hareketiyle çakışır.
  - Atlayarak sona gelen de "tamamlandı" sayılsın mı? Önerimiz: son cümleye ulaşan tamamlamış sayılır. Ekip karar verecek.
- **Masaüstü anlatım için iki seçenek:**
  - Mevcut: 420 px sol panelde metin, sağda 3D.
  - **Alternatif "Altyazı":** panel kapalı, 3D tam genişlik. Altta ortada yarı saydam altyazı kutusu: en fazla 2 satır, 20 px, güven etiketi, kaynak, kontroller ve "Metni aç" butonu. Sol üstte "✕ Eser adı". Kamera kadrajın alt %20'sini boş bırakır.
  - Karar verilmedi.
- **Panel sekmesi:** Yandex'teki gibi sol panelin sağ kenarında ◀ / ▶ sekmesi. Sol paneli olan 19 masaüstü ekranın hepsinde var.

## 6. Harita (sıradaki iş, Muhammed yapıyor)
- **Karar önerisi:** Tek bir Türkiye haritası olsun, şehir şehir ayrı harita olmasın. Ama uygulama kullanıcının şehrinden açılsın; demoda Karaköy'den.
- **Üç seviye:**
  - Türkiye: şehir baloncukları ("İstanbul · 42")
  - Şehir: grup baloncukları ("Karaköy · 6")
  - Sokak: 4 renkli pinler
- Gruplama için MapLibre'de hazır ayar var (`cluster: true`).
- Konum izni vermeyen ya da "Evden gez" ile giren İstanbul'dan başlar.
- **Maputnik'te stil:** OSM'deki restoran, market gibi POI işaretleri kapatılacak, sadece bizim pinlerimiz öne çıkacak.
- **Grup baloncuğu:** lacivert daire ve içinde sayı. Pin renkleri karışmayacak.
- **Figma'ya eklenecek:** Türkiye, şehir ve sokak seviyesinde birer ekran.
- **Karar bekleyen:** Harita renk yönü (Kâğıt / Sakin gri / Çini). Muhammed önceki harita renk önerilerini iki kez beğenmedi.

## 7. Elle yapılacak küçük düzeltmeler (Figma)
1. "D · Anlatım / Oku": ✕ butonu "Kaydırarak oku" yazısına yakın. Yazı "Kaydırarak" diye kısaltılmalı.
2. "D · E-posta kodu": arka plan düz lacivert. Karartma katmanının altına "D · Keşif / Ana" ekranının kopyası konmalı.
3. Mobildeki B · Anlatım ekranlarının sol üstüne ✕ eklenmeli.
4. Dinle ve Oku ekranlarındaki "Tam ekran 3D" butonu panel sekmesiyle aynı işi yapıyor, silinebilir.

## 8. Açık işler
- **Ekip toplantısı:** "Finalde kesin çalışacak 5 şey" listesi. Demo yolu omurga olsun; Birlikte Gez, rota oluşturucu ve rozetler ikinci sırada.
- **Veri seti:** Henüz görülmedi. Format, eser listesi ve görsel lisansı öğrenilmeli. Hero eserler ve rota buna göre kesinleşecek.
- **3D:**
  - Hero model.
  - Model parça adları cue'lardaki sahne adlarıyla aynı olmalı: Kubbe_Ana, Minare, Hamam, Cesme, Kart_*, Akar_0–4, Merkez.
  - Performans bütçesi: model başına en fazla 15.000 üçgen, gölge yok, ışık dokuya pişirilmiş. Zayıf cihaz için yedek görüntü.
- **Görseller:** logo, uygulama ikonu, splash, rozet görselleri ve adları.
- **Tasarım sistemi:** odak halkası (focus ring) ve devre dışı (disabled) buton durumu eklenecek.
- **Belgeler:** lisans tablosu (görsel, font, ikon, ses), KVKK metni.
- **İçerik:** Bulmaca cevapları ve hikâye bilgileri sahada ya da kaynakla doğrulanacak. Demo senaryosu güncellenecek.
- **Figma:** Eğitim planı için 42'nin onayı bekleniyor.

## 9. Riskler
- **En büyük risk kapsam:** yaklaşık 77 ekran var, 4 hafta kaldı, frontend tek kişide, harita ve 3D Muhammed'de.
- **Şartname:** Çalışan MVP zorunlu. Erişilebilirlik çalışan üründe olmalı (5.1.4). Lisanslar takımın sorumluluğunda.
