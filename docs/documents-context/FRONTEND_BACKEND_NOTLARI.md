# AKAR · Frontend ve backend notları

*13 Ekim 2026, güncelleme 15 Ekim 2026 (bkz. §0 ve §10). Ekip için. Figma: `akar-app` (https://www.figma.com/design/Bd3m8xYrCiVK6440POHN39/akar-app). 15 Ekim ekranları bu Figma dosyasına da eklendi; PNG kopyaları: `design/ekranlar-15ekim/`. Bu not ile çelişen eski bir belge varsa bu not geçerlidir.*

## 0. 15 Ekim: kesin kapsam ve fotoğraf/3D görünümü (önce bunu oku)

**Kesin yapılacaklar.** Kodlamaya başlamadan önce bilinsin; bunlar finalde olacak:
- **Yeni harita:** `design/harita/akar-style.json` ve Figma'daki harita tasarımı (renkler, etiketler, eğik 3D görünüm). OSM raster karodan bu stile geçilir (§9).
- **Yeni ikonlar ve pinler:** `design/ikonlar/` (AKAR ikon seti), Figma'daki harita pini (kemer + ikon, vakıf rolü rengi) ve rota durağı yıldızı (§6).
- **Rotalar:** rota listesi, rota önizleme, Rotam, rota aktif / vardın, rota tamamlandı, **Bana rota oluştur**.
- **Esere basınca açılan bütün sayfalar:** eser seçili kartı, eser detay (Fotoğraf ve 3D), Eser hakkında, Kaynak detayı, Hikâye sonrası, Giriş isteği.
- **Dinle / Oku anlatımı:** fotoğraf ve 3D görünümüyle (§10).
- **Geçmişi Gör.**
- **İz Bırak + Yaşayan hafıza** (moderasyonla, §2 kural 7).
- **Profil:** girişli ve misafir, e-posta kodu, KVKK aydınlatma metni.
- Keşif, arama, filtre, şehir seçici, konum izni ve yönetim paneli (şartname zorunlu).

**Şimdilik yapılmayacaklar:** **Bulmaca** ve **Birlikte Gez** (Odaya katıl dahil). Bunlar değişebilir; yerlerine başka özellikler gelebilir. Figma'daki ekranları ve "Hikâye sonrası"ndaki kutuları yer tutucu sayılsın, koda bağlanmasın. `bulmaca` tablosu da beklemede.

**Kesin değil, karar bekliyor:** Rozetler (rozet bildirimi dahil).

**Figma'da tasarımı hazır, şimdilik öncelik değil (20 Ekim):** Bulmaca (doğru/yanlış dahil), Birlikte Gez ve Odaya katıl, rozet bildirimi ve puan gösterimi (Profil, Giriş isteği, Rota tamamlandı), Hikâye sonrasındaki Bulmaca ve Birlikte Gez kutuları, panelde Rota düzenle'deki bulmaca satırı. Bunlar Figma'da çizili olarak durur; kodlanmaz, önceliği ekipçe konuşulunca açılır. Figma ile bu belge arasında çelişki sayılmaz.

**Figma'daki örnek içerik temsilidir:** cümleler, tarihler, eser ve rota sayıları, süreler, kaynak adları. Gerçek içerik `eserler/*/icerik/` dosyalarından gelir.

**Fotoğraf + 3D görünümü (yeni).** Her eserin 3D modeli olmayacak. Bu yüzden anlatım her eserde fotoğrafla çalışır, modeli olan eserde üstüne 3D görünüm eklenir. İkisi aynı cümle listesini kullanır. Panelde her cümleye bir fotoğraf bağlanır; fotoğrafın bilgisi 3D'de kart olarak da kullanılır. Ayrıntı, ölçüler ve ikonlar: §10.

## 0.1 13 Ekim: kısaca ne değişti

- **Şehir Bursa.** İstanbul/Karaköy (Kılıç Ali Paşa) örneği bırakıldı. Neden: Vakıf Katılım'ın envanter kitapları geldi ve en çok veri Bursa'da.
- **Ana hikâye:** Ulucami (hayrat) + Bedesten (akar). Kitapta yazıyor: Bedesten, Yıldırım Bayezid tarafından Ulucami'ye gelir sağlamak için yaptırıldı (Bursa Envanteri, Cilt 1). Sonra Koza Hanı.
- **Örnek rota:** Hanlar Bölgesi Vakıf Yürüyüşü: Ulucami → Koza Hanı → Orhan Gazi Camii. Durak listesi kesin değil, Bedesten'in eklenmesi düşünülüyor.
- **Veri:** Bursa 385 eser (3 cilt), Konya 289 (2 cilt), Hatay 117 (1 cilt). Kütahya 141 eser bilgi notunda geçiyor ama kitabı henüz yok. İzmir/Manisa hazırlanıyor.
- **Ayasofya 3D pilotu kapandı** (yöntem denemesiydi, demoda ana eser değil). Dersler: `eserler/_kutuphane/AKAR_3D_Yontem_Notlari.md`.
- **Yönetim paneli tek akış oldu.** Yeni eser adım adım ekleniyor, 3D önizleme hep sağda (bkz. §3).
- **Tasarım:** şehir desenleri, şehir aksanı rengi, rota durağı yıldızı (bkz. §6).

## 1. Veri modeli (Supabase / Postgres)

Metin alanları dil anahtarlı: `{ tr: "...", en: "..." }`. Her tarihî cümlenin güven etiketi (`dogrulanmis | tarihsel_cikarim | temsili`) ve kaynağı vardır.

| Tablo | Önemli alanlar | Not |
|---|---|---|
| `eser` | slug, il, ilce, ad{tr,en}, tur, rol (`hayrat`/`akar`), yapim_yili (metin: "1399"), yaptiran, mimar, donem, adres, konum (lat, lng), kisa_tanim{tr,en}, kapak_gorsel_id, seviye (`tier1`/`tier2`/`hero`), durum (`taslak`/`yayinda`), konum_kaynagi (`osm`/`adres`/`elle`), ilgi_etiketleri[] (Bana rota oluştur), erisilebilirlik[] (ör. merdivensiz giriş), ziyaret_notu{tr,en} | Konum envanterde yok, adresten geocoding ile bulunacak; bulunamayan panelde elle yerleştirilir. Etiketler türden bağımsız (20 Ekim) |
| `akar_bagi` | kaynak_eser_id → hedef_eser_id, aciklama, kaynak_id | Ör. Bedesten → Ulucami "gelir sağlar". Çoka çok |
| `model` | eser_id, dosya (Storage yolu, sürümlü), dosya_hafif (isteğe bağlı, zayıf cihaz), boyut, ucgen, parcalar[] (.glb'den okunan ad listesi), guven, acilis_acisi_id, yon_derece (haritada kuzeye göre dönüş), olcek (1 = metre) | Bir eserin birden çok sürümü olabilir; eski sürüm silinmez |
| `kaynak` | tur (`kitap`/`belge`/`arsiv_foto`/`web`), baslik, yayinci, yil, sayfa_turu (`pdf`/`kitap`), baglanti/dosya, kullanim_izni, guven | Ortak liste. `eser_kaynak` ile esere bağlanır. **Sayfa burada değil** (20 Ekim): aynı kitap farklı cümlelerde farklı sayfayla anılır |
| `cumle_kaynak`, `paragraf_kaynak` | cumle_id / paragraf_id, kaynak_id, sayfa | 20 Ekim. Cümle ve paragrafın kaynağı + sayfası. Kaynak eserin `eser_kaynak` listesinden seçilir. Bir cümleye birden çok kaynak bağlanabilir (Kaynak detayı ekranı); en az biri zorunlu |
| `eser_paragraf` | eser_id, bolum (`tarihce`/`mimari`/`vakif_akar`), sira, metin{tr,en}, guven | 20 Ekim. «Eser hakkında» ekranının içeriği; kaynak `paragraf_kaynak` ile |
| `hikaye` | eser_id (1'e 1), durum | Her eserin tek hikâyesi var |
| `hikaye_cumle` | hikaye_id, sira, metin{tr,en}, guven, **kaynak: `cumle_kaynak` (en az 1, zorunlu)**, ses{tr,en} (dosya + süre), **gorsel_id (zorunlu, 15 Ekim)**, **kart_goster (bool, varsayılan false)**, aci_id (boş olabilir), vurgu[] (parça adları), akar_akisi (bool), gravur_id | Bu tablo "cue" listesidir. `kart_id` kalktı: kart artık cümlenin fotoğrafıdır, `kart_goster` açıksa 3D'de kart olarak çıkar |
| `kamera_aci` | model_id, ad ("Açı_03"), azimut, egim, mesafe, hedef (parça adı ya da "Merkez"), kucuk_resim | Panelde "Açıyı kaydet" ile oluşur |
| ~~`kart`~~ | 15 Ekim: kaldırıldı. Başlık, kısa metin, kaynak ve güven `gorsel` tablosunda | Kart = cümlenin fotoğrafı (bkz. `hikaye_cumle.kart_goster`) |
| `gorsel` | sahibi_eser_id, dosya, alt_metin{tr,en} (**zorunlu**), baslik{tr,en}, kisa_metin{tr,en}, **lisans (zorunlu)**, **kaynak_id (zorunlu)**, guven | Kapak, cümle fotoğrafı, gravür, eski fotoğraf. Bilgisi bir kez girilir; aynı fotoğraf eserin başka cümlesinde de seçilebilir ("Havuzdan seç") |
| `rota`, `rota_durak` | rota: il, ad{tr,en}, kisa{tr,en}, gorsel_id, tema[], zorluk, rozet, durum · durak: rota_id, sira, eser_id | Süre ve mesafe kayıt edilmez, hesaplanır |
| `bulmaca` (**beklemede**, §0) | rota_durak_id ya da eser_id, soru{tr,en}, secenekler[3], dogru, aciklama, kaynak_id | Durak başına 1 soru |
| `gecmisi_gor` | eser_id, eski_gorsel_id, tarih, kaynak_id, lisans, hizalama (kamera_aci gibi) | |
| `katki` | eser_id, kullanici, metin, gorsel, durum (`beklemede`/`onaylandi`/`reddedildi`), red_sebebi | RLS: beklemede kayıt herkese kapalı |

## 2. Backend kuralları (doğrulama)

1. **Kaynaksız cümle yayınlanamaz.** Cümlenin `cumle_kaynak` kaydı yoksa eser "Yayınla" yapılamaz. Aynı kural «Eser hakkında» paragrafları için de geçerli.
2. **Modelde olmayan parça yayını durdurur.** Cümledeki `vurgu[]` ya da açının `hedef` adı, modelin `parcalar[]` listesinde yoksa o cümle hatalı sayılır.
3. **Model güncellenince** yeni parça listesi okunur. Kaybolan adlar varsa ilgili cümleler işaretlenir ("model değişti, kontrol et").
4. **Eksik İngilizce engel değil**, sadece uyarı. TR ile yayınlanabilir.
5. **İçe aktarma:** gelen her kayıt `taslak` + `tier1` olur, hiçbiri otomatik yayınlanmaz. Var olan eserle eşleşme ad + ilçe ile yapılır; eşleşirse sadece boş alanlar doldurulur.
6. **Görselde alt metin zorunlu.**
7. **Katkı (İz Bırak)** moderasyonsuz yayınlanmaz; EXIF/konum bilgisi temizlenir.
8. **Her cümlede fotoğraf zorunlu** (15 Ekim). 3D modeli olan eserde de: fotoğraf görünümünde o cümle boş kalmasın.
9. **Fotoğrafta kaynak ve lisans zorunlu**, alt metin zorunlu (kural 6). Eksikse eser yayınlanamaz.
10. `kart_goster`, `aci_id` ve `vurgu[]` yalnız modeli olan eserde anlamlıdır. Model yoksa panel bu alanları göstermez, backend de boş kabul eder.

## 3. Yönetim paneli akışı (Figma → "🛠 Yönetim paneli")

**0 · Giriş (20 Ekim):** Şifre yok. Google ile devam et ya da e-posta kodu (6 hane, 10 dk). Kayıt yok; panel kullanıcılarını Yönetici davet eder. Roller: **Yönetici** (her şey) · **Editör** (içerik ve yayın) · **Moderatör** (yalnız katkılar). Tablo: `panel_kullanici` (kullanici_id, rol, davet_eden, durum `davet`/`aktif`).

**1 · Eser ekleme akışı:** Giriş → Eser listesi → **+ Yeni eser** →

| Adım | Ne yapılıyor |
|---|---|
| 1 Model | .glb yüklenir, önizleme sağda açılır ve her adımda orada kalır. Parça adları okunur. 3D yoksa "Fotoğrafla devam et". |
| 2 Bilgiler | Ad TR/EN, tarih, yaptıran, mimar, il/ilçe, tür, hayrat/akar, akar bağı, adres, tanım, kapak + alt metin. İçe aktarılan eserde dolu gelir. |
| 3 Kaynaklar | «Bu eserin kaynakları» ortak listeden seçilir ya da yeni girilir. Hikâyede her cümle kaynağını bu listeden seçer; sayfa cümleye yazılır. |
| 4 Hikâye | Her cümle tek satır: **Cümle · Fotoğraf · Kart · Açı · Vurgu** (ayrıntı aşağıda ve §10.7). 3D'siz eserde sadece **Cümle · Fotoğraf**. |
| 5 Yayın | Eksik listesi. Engelleyenler (kaynak, fotoğraf, fotoğrafın lisansı, vurgu) ve engellemeyenler (EN) ayrı. |

**Hikâye satırı nasıl çalışıyor (15 Ekim):**
- **Fotoğraf:** Her cümleye bir fotoğraf. Boş hücrede "+ Fotoğraf" → Fotoğraf ekle penceresi: Yeni fotoğraf / Havuzdan seç (eserin daha önce yüklenmiş fotoğrafları) · görsel + alt metin · başlık TR/EN · kısa metin · kaynak · lisans · güven. Bu bilgi bir kez girilir.
- **Kart:** Satır başına aç/kapa. Açıksa bu cümlenin fotoğrafı 3D ile anlatımda modelin üstünde kart olarak çıkar (içerik fotoğrafın bilgisi). Görünüşü radio dairesi, davranışı checkbox (§10.7).
- **Açı:** Sağdaki model döndürülür → "Açıyı kaydet" → satırda küçük bir daire (açının küçük resmi) çıkar. Daireye basınca model o açıya döner. Açı kaydedilmemiş cümle bir önceki cümlenin açısında kalır.
- **Vurgu:** Modelden okunan parça listesi. Seçilen parça önizlemede parlar.
- Satıra tıklayınca altında ses (TR/EN), **Bu cümlenin kaynağı** + **Sayfa** ve güven alanları açılır.
- 20 Ekim: Figma'daki sütun düzeni geçerlidir (fotoğrafı olmayan hücrede «+ Fotoğraf», basınca hücre fotoğraf olur). §10.7'deki genişlikler yön göstericidir.
- Önizlemenin üstünde **3D | Fotoğraf** geçişi var: iki görünümü de buradan kontrol edersin.

**2 · Ortak ekranlar:** Kartlar (tüm fotoğraflar eser eser gruplu, nerede kullanıldığı yazılı; kart = fotoğraf olduğu için adının "Fotoğraflar" olması öneriliyor, karar açık). 20 Ekim: Figma'da ekran bu modele göre düzenlendi: ad şimdilik «Kartlar», liste kartı kapalı olanlar dahil bütün fotoğrafları gösterir, üstte «Tümü · Kart olarak kullanılanlar · Lisans eksik» filtresi, her satırda «● Kart / ○ Kart değil» ve kullanıldığı cümleler, ayrıntı panelinde alt metin, kaynak, lisans ve güven etiketi. Ayrı «Kart_*» kaydı ve «birden çok eserde kullanılır» ibaresi kalktı · Rota düzenle (duraklar sürüklenir, süre ve mesafe otomatik, durak eserlerinin Geçmişi Gör kayıtları sayılır; bulmaca ertelendi) · İçe aktar (dosya → alan eşleme → doğrulama → taslak olarak içe al) · Katkı moderasyonu.

**3 · Eser düzenleme (20 Ekim):** Listeden yayındaki esere tıklayınca açılır. Sekmeler yeni eser adımlarıyla aynı sırada: Model · Bilgiler · Kaynaklar · Eser hakkında · Fotoğraflar · Hikâye · Geçmişi Gör · Yayın. Model, Bilgiler, Kaynaklar, Hikâye ve Yayın adım ekranlarının aynısıdır. Ek sekmeler: **Eser hakkında** (paragraf + güven + kaynak/sayfa), **Fotoğraflar** (eserin fotoğraf havuzu, galeri sırası, kapak), **Geçmişi Gör** (eski görsel, tarih, lisans, bugünkü eş; esere bağlı). Model sekmesinde sürüm listesi, Normal/Hafif dosya, parça farkı uyarısı ve harita yerleşimi (yön, ölçek). Yayındaki eserde değişiklikler «Yayınla»ya kadar taslakta durur.

**4 · Diğer ekranlar (20 Ekim):** Rotalar listesi → Rota düzenle (rota bilgileri: görsel, şehir, zorluk, tema; duraklar; süre ve mesafe otomatik; Bulmaca ertelendi) · Kaynaklar (ortak liste) · Kullanıcılar ve roller (davet) · Katkı moderasyonu → ret nedeni penceresi (sabit liste + Diğer, zorunlu).

Sol menü: Eserler · Rotalar · Kartlar · Katkılar · İçe aktar · Kaynaklar · Kullanıcılar. (Hikâye ve eserin kaynakları eserin içinde.)

## 4. Anlatım motoru (frontend)

- **İki görünüm, tek liste:** Fotoğraf görünümü her eserde, 3D görünümü sadece modeli olan eserde. Görünüm değişince liste, cümle ve ses yerinde kalır; sadece sahne değişir (§10).
- Oynatıcıya giden liste **çözülmüş tam durum** listesidir: her cümle için sahne = önceki cümlenin sahnesi + bu cümlenin dolu alanları. Veritabanında açı boş olabilir, oynatıcıda asla boş değildir. Fotoğraf her cümlede dolu gelir (§2 kural 8); 3D'de kart yalnız `kart_goster` açık cümlede görünür. Böylece ileri/geri atlamak ya da ortadan başlamak sorunsuz çalışır.
- `sahne.uygula(durum)`: kamera (azimut, eğim, mesafe, hedef) 0,8 sn geçiş; `prefers-reduced-motion` açıksa anında.
- Açı kaydı (panel): OrbitControls'tan azimut, eğim, mesafe ve hedef alınır; canvas'tan ~96 px küçük resim alınır.
- Vurgu: parça adıyla mesh bulunur, rengi altına kaydırılır ya da dış çizgi (outline) alır. `emissive` kullanılmaz, modeller ışıksız malzemeyle geliyor (bkz. §9).
- Ses: cümle başına ayrı dosya. Başlangıç saniyeleri ses sürelerinden otomatik hesaplanır; altyazı metinden gelir.

## 5. Medya ve yedekleme (ses, metin, görsel)

- **Storage yolları:**
  - `modeller/<eser-slug>/<eser-slug>_v<N>.glb`
  - `ses/<eser-slug>/<dil>/cumle-<NN>.mp3`
  - `gorsel/<eser-slug>/...`, `kart/<anahtar>/...`
- Metinler veritabanında, dil anahtarlı. Ses ve görsel dosyaları Storage'da, kaydı tabloda.
- **Yedek:** Supabase'in kendi yedeğine güvenmeyelim (plana göre değişiyor, doğrulanmalı). Önerim: panelde "Dışa aktar" ile eser + hikâye + kart + rota JSON'u, haftada bir ve finalden önce mutlaka, repoya `veri/yedek/` altına. Storage dosyalarının bir kopyası da ekip Drive'ında dursun.
- **Model sürümleri silinmez.** Açılar ve vurgular eski modelin parça adlarına göre kaydedilmiş olabilir.
- **Çevrimdışı (PWA):** Rota başlatılınca o rotadaki model, ses ve görseller service worker ile önbelleğe alınır.

## 6. Tasarım dosyaları (`design/`)

| Yer | İçerik |
|---|---|
| `tokens.css` | Renk, ölçü, yazı. 13 Ekim'de şehir rengi, desen sınıfları, ilçe etiketi, rota durağı ve yükleniyor animasyonu eklendi |
| `desenler/` | Bursa (8 kollu yıldız), Konya (12 kollu gülbezek) karoları ve AKAR amblemi; `desen.py` ile yeniden üretilir; `BENIOKU.md` |
| `ikonlar/` | AKAR SVG ikon seti (currentColor) |
| `harita/` | MapLibre stili `akar-style.json` ve önizleme |
| `karsilastirma/` | Figma ↔ kod karşılaştırması (13 ekran + 15 Ekim'de 6 yeni karşılaştırma, `KARSILASTIRMA.md`) |
| `ekranlar-15ekim/` | Fotoğraf/3D görünümü ve panel Hikâye ekranları, PNG 2x (m = mobil, d = masaüstü, p = panel). Ölçüler §10 |

**Şehir aksanı (`--sehir-aksan`):** `data-sehir="bursa|konya"` ile değişir. Bursa #22566E, Konya #2F6E71.
- Kullanıldığı yerler: rota çizgisi, durak yıldızı, şehir bandı ve deseni, ilerleme çubuğu, rozet, seçili şehir, 3D yükleniyor amblemi.
- **Değişmeyenler:** butonlar, yazı, linkler (`--primary`), harita pinleri (vakıf rolü renkleri) ve güven etiketleri.

**Rota durağı:** 8 kollu yıldız, haritada 36 px, listede 28 px. Durumlar: varsayılan · sıradaki (altın halka) · tamamlandı (altın, ✓) · gelecek (dış çizgi). Yıldız başka yerde kullanılmaz. Figma bileşeni: "Rota durağı".

**Desenler:** Sadece ilk açılış, şehir kapağı/seçici, 3D yükleniyor, eser detay başlığı (%6–10), boş durumlar ve rozetler. **Haritada desen yok.**

**Harita kontrolleri (masaüstü):** sağ kenarda dikey ortada, yukarıdan aşağı + / − · konum · 3D dairesi.

## 7. 3D

- Bütçe: Normal ≤ 40k üçgen, dosya ≤ 1 MB (Draco). Redmi 9T'de 25k üçgen her ayarda ~60 FPS ölçüldü.
- Renk düz malzemeden (palet), ışık hafif AO. Büyük tek atlas mobilde bulanık çıktı, kullanılmıyor.
- Parça adları uygulamanın vurgu ve kamera hedefi listesidir; .glb'deki adlarla birebir aynı olmalı (ör. `Kubbeler_19`, `Sadirvan_Kubbe`, `Minare_1`).
- Kademe: Normal → Hafif (ilk 2 sn FPS < 25 ise sessizce) → Görsel (WebGL yoksa ya da hata).
- Durum (20 Ekim): Ulucami v25, Bedesten v05, Koza Han v13, Orhan Bey Camii v06, Orhan Bey Hamamı v04, Emir Hanı v03, Orhan Gazi Türbesi v01 hazır (`eserler/<eser>/3d/export/`). Yöntem: `eserler/_kutuphane/AKAR_3D_Yontem_Notlari.md`.

## 8. Hareket ve etkileşim (küçük ama önemli)

Uygulamanın "akışkan" hissi bu ayrıntılardan gelir. Hepsi `prefers-reduced-motion` açıkken kısalır (≤ 80 ms solma) ya da anında olur. Süreler ve eğriler `tokens.css` → `--sure-*`, `--egri-*`.

**Genel kurallar**
- Sadece `transform` ve `opacity` canlandırılır (`height`, `top`, `width` değil). Redmi 9T'de 60 FPS bunu gerektirir.
- Animasyon hiçbir zaman dokunmayı engellemez: kullanıcı ortada tekrar dokunursa yeni hareket oradan başlar.
- 300 ms'den kısa yüklemelerde hiçbir yükleniyor göstergesi çıkmaz (göz kırpması olmasın).
- Kütüphane önerisi: React için `motion` (eski adı framer-motion). Sürükleme, yay (spring) ve "layout" animasyonunu tek pakette verir. Yeni paket olduğu için ekipte karar verilsin.

**1 · Alt sayfa (bottom sheet) — mobil**
- Üç durak noktası: kapalı (~180 px, tutamak + sekmeler görünür), yarım (%50), tam (%92).
- Parmağı birebir takip eder, gecikme yok. Bırakınca hıza göre en yakın noktaya **yayla** oturur; hızlı fırlatma bir sonraki noktaya atlar.
- İçerik tam açıkken listede kaydırma yapılır; liste en üstteyken aşağı çekilince sayfa iner (kaydırma ile sürükleme çakışmasın).
- Sayfa tam açıldıkça arkadaki harita hafifçe kararır (%0 → %20).

**2 · Liste → eser kartı dönüşümü (pine ya da satıra dokununca)**
- Kart bir anda belirmez. Açık olan alt sayfa **aynı kutu olarak** kartın boyuna daralır (layout animasyonu, `--sure-3`).
- Eski içerik 120 ms'de solar, yeni içerik (görsel, ad, tarih, güven, buton) 160 ms gecikmeyle 8 px aşağıdan gelir.
- Aynı anda harita seçilen pine yumuşak kayar (`easeTo`, `--sure-4`; pin kartın üstünde kalacak kadar `padding`). Pin 1 → 1,25 büyür, altın halka alır.
- × ile kapatınca her şey tersine döner, liste eski kaydırma yerine geri gelir.

**3 · 3D / pusula dairesi**
- Dokununca ya da basılı tutunca daire **1 → 1,35 büyür** (yay), kullanıcı rahat çevirsin diye. Çevirirken büyük kalır; bırakınca 600 ms sonra eski boyuna döner.
- Büyürken ekrandan taşmaz (`transform-origin` sağ alt).
- Çevirirken harita ya da model aynı anda döner; "K" işareti hep kuzeyi gösterir. Çift dokunma kuzeye sıfırlar.
- 2D ↔ 3D: harita eğimi 0 → 60° (`--sure-4`), daire etiketi solarak değişir.

**4 · Düğmeler ve dokunma**
- Basınca `scale(.97)` + renk koyulaşır (`--sure-1`), bırakınca geri.
- Titreşim (`navigator.vibrate(10)`, sadece destekleyen cihazda) yalnız önemli anlarda: durağa varış, bulmaca doğru, rozet. Her dokunuşta değil.

**5 · Hikâye (anlatım)**
- Cümle değişince metin solarak değişir (`--sure-2`), aktif satır vurgusu yukarı/aşağı kayarak gelir.
- Kamera 800 ms yumuşak geçer ve cümlenin sesi başlamadan ~300 ms önce harekete başlar.
- Kart açılırken 0,92 → 1 büyür + solarak gelir (240 ms).
- Vurgulanan parça iki kez hafifçe nabız atar, sonra sabit parlak kalır.
- İlerleme çubuğu parçaları dolarak ilerler, zıplamaz.

**6 · Rota**
- Rota açılınca çizgi ilk duraktan sona doğru **çizilerek** gelir (~800 ms), yıldızlar sırayla 60 ms arayla belirir.
- Durak tamamlanınca yıldız altına döner, küçük bir parıltı.
- Varış şeridi ("Vardın · Ulucami") üstten yayla iner. 30 m'de kısa titreşim. Birkaç saniye sonra küçülür ama kaybolmaz.

**7 · Diğer**
- **Eserler / Rotalar sekmesi (alt sayfa):** Rotalar'a basınca beyaz hap sağa kayar (240 ms, `--egri`). İçerik bir anda değişmez: iki liste yan yana tek bir şeritte durur, şerit sola kayar (Eserler sola çıkar, Rotalar sağdan gelir). Eserler'e basınca tersi.
  - Liste üstünde parmakla sağa/sola kaydırmak da sekmeyi değiştirir. Hap ve şerit parmağı takip eder; bırakınca yarıyı geçtiyse ya da hızlı fırlatıldıysa diğer sekmeye oturur, geçmediyse geri döner.
  - Yön kilidi: hareketin ilk ~10 px'i yataysa sekme kayar, dikeyse alt sayfa sürüklenir ya da liste kayar. İkisi aynı anda olmaz.
  - Her sekme kendi kaydırma yerini hatırlar.
  - Uygulama: `overflow: hidden` bir kap, içinde iki panelli şerit; `transform: translateX(0)` ↔ `translateX(-100%)`. Hap da `translateX` ile kayar. `width`/`left` canlandırılmaz.
  - `prefers-reduced-motion`: kayma yok, içerik 80 ms solarak değişir.
  - Erişilebilirlik: `role="tablist"` / `role="tab"` / `role="tabpanel"`, ←/→ tuşlarıyla geçiş, görünmeyen panel `inert`.
- Arama: odaklanınca alt sayfa yarıya iner, klavye açılınca içerik klavyenin üstünde kalır.
- Masaüstü sol panel aç/kapa: `translateX` (280 ms); harita `map.resize()` animasyon bitince çağrılır.
- Toast: alttan 16 px kayarak gelir, 3 sn kalır, kaydırınca kapanır.
- Yükleniyor: AKAR amblemi çizgi çizgi çizilir (`.amblem-yukleniyor`); listelerde iskelet kart (1,2 sn parıltı).

## 9. Harita ve 3D dosyaları nasıl kullanılır

**Harita (`design/harita/`)**
- `akar-style.json`: MapLibre stil dosyası (v8, 58 katman). Anahtar gerekmez: vektör karolar, yazı tipleri ve ikonlar OpenFreeMap'ten, alçak zoomda kabartma Natural Earth'ten, 81 il merkezi dosyanın içinde (`il_merkezleri`).
  ```js
  import maplibregl from "maplibre-gl";
  const map = new maplibregl.Map({
    container: "harita",
    style: "/harita/akar-style.json",   // public/harita/ altına kopyala
    center: [29.0619, 40.1840],          // Bursa, Ulucami civarı
    zoom: 16
  });
  ```
- Renkler tokens.css ile aynı. Bina katmanında `building_3d` var: eğik (3D) görünümde binalar yükselir.
- Etiketler TR/EN (`name:tr`, `name:en`).
- Eserler ayrı bir GeoJSON kaynağı olarak eklenir: `map.addSource("eserler", { type: "geojson", data, cluster: true, clusterRadius: 40, clusterMaxZoom: 15 })`. Her özelliğin `rol`, `tur`, `durum` alanı pin rengini ve ikonunu seçer.
- Pin görselleri: önizleme dosyasındaki `PINS` tanımı (kemer + ikon SVG'si) `map.addImage("pin-…", …, { pixelRatio: 2 })` ile eklenir; ikonların kaynağı `design/ikonlar/`.
- `akar-harita-onizleme.html`: tarayıcıda çift tıkla aç. Stili, pinleri ve kümeleri canlı gösterir; yukarıdaki kodun çalışan örneği. "Stili indir" düğmesi değiştirilmiş stili JSON olarak verir.
- **Kodda şu an OSM raster karo kullanılıyor; bu stil dosyasına geçilmeli.**

**3D (`eserler/`)**
- Uygulamanın kullanacağı dosyalar sadece `.glb`'ler (20 Ekim düzeni: `eserler/<eser>/3d/export/<eser>_vN.glb` uygulama dosyası; `<eser>_vN_sunum.glb` kaide, zemin, ağaç ve figürlü sunum kopyası, uygulamada kullanılmaz. Uygulama dosyasında **çevre (`Cevre_*`) ve insan figürü (`Olcek_Insan_*`) yok**, yalnız yapı (20 Ekim 2026; kural: `eserler/_GENEL_SAHNE_STANDARDI.md` §5.5). Ör. `ulu-cami_v25.glb`. Parça adları iki dosyada aynı ve hikâyelerdeki Vurgu adlarıyla eşleşiyor, 20 Ekim'de 6 eserde kontrol edildi). `.blend` ve `_kutuphane/` modelleme içindir, frontend'e girmez.
- Ayasofya pilot modelidir: demoda gösterilmez ama three.js görüntüleyiciyi kurmak ve parça adlarıyla vurgu denemek için kullanılabilir. Bursa modelleri gelince aynı kod çalışır.
- Yükleme (Draco sıkıştırmalı):
  ```js
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
  import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
  const draco = new DRACOLoader().setDecoderPath("/draco/"); // three/examples/jsm/libs/draco/gltf/ → public/draco/
  const loader = new GLTFLoader().setDRACOLoader(draco);
  const gltf = await loader.loadAsync(url);
  const parcalar = [];
  gltf.scene.traverse(o => { if (o.isMesh) parcalar.push(o.name); }); // panelin "Vurgu" listesi bu
  ```
- Ölçek metre, yukarı ekseni Y (glTF standardı). Bursa modellerinde kural: orijin yapının zemin ortası (Ayasofya pilotunda kontrol edilmedi). Haritaya koyarken `model.yon_derece` ile döndürülür.
- Kademe: önce `_vN.glb`; ilk 2 sn FPS < 25 ise varsa Hafif sürüme geç (şimdilik üretilmiyor, panelde isteğe bağlı); WebGL yoksa ya da hata olursa kapak görseli (Görsel kademe).
- Vurgu: modeller ışıksız (unlit) malzemeyle çıkıyor (`KHR_materials_unlit`). three.js bunu `MeshBasicMaterial` olarak yükler, bu malzemede `emissive` yoktur. Bu yüzden vurgu iki yoldan biriyle yapılır:
  - Renk: malzeme klonlanır, rengi altına doğru kaydırılır; vurgu bitince eski malzemeye dönülür.
    ```js
    const ALTIN = new THREE.Color("#C9A13B");
    const eski = mesh.material;
    mesh.material = eski.clone();
    mesh.material.color.lerp(ALTIN, 0.5);   // nabız için 0.3 ↔ 0.6 arası canlandırılabilir
    // bitince: mesh.material.dispose(); mesh.material = eski;
    ```
  - Dış çizgi: `OutlinePass` (postprocessing) ya da parçanın biraz büyütülmüş, ters yüzlü (`side: THREE.BackSide`) altın kopyası. Postprocessing telefonda pahalı; önce renk yolunu deneyin.
- Performans: gerçek zamanlı gölge yok, sadece değişince çiz (render on demand), `pixelRatio` ≤ 1,5, sahne kapanınca `dispose`.

## 10. Fotoğraf ve 3D görünümü (15 Ekim)

Ekranlar: ekip Figma dosyası `akar-app` ve PNG kopyaları `design/ekranlar-15ekim/` (m = mobil 390×844, d = masaüstü 1440×900, p = panel). Kodla farkları: `design/karsilastirma/` 14–19. Aşağıdaki ölçüler, ikonlar ve buton yerleri bu ekranlardan alındı, kodda olduğu gibi kullanılabilir. Tabloda olmayan bir ayrıntıda ekrandaki hâli esas alın.

### 10.1 Kurallar
- Her eserin fotoğrafı var, 3D modeli olmayabilir. Varsayılan görünüm **Fotoğraf**.
- Modeli olan eserde sağ üstte **Fotoğraf | 3D** seçicisi çıkar. Modeli olmayan eserde seçici hiç görünmez (yer tutmaz).
- Seçici eser detayında da anlatımda da **aynı bileşen, aynı yerde**. Eser detayında sadece üst alanı değiştirir (inceleme). Anlatımda sahneyi değiştirir; cümle, ilerleme ve ses kaldığı yerden devam eder.
- Fotoğraf görünümünde her cümlenin fotoğrafı ekranda. 3D görünümünde kamera açısı + vurgu + kart. Kart yalnız `kart_goster` açık cümlede çıkar; içeriği o cümlenin fotoğrafı ve bilgisidir.
- Öneri: seçim oturum boyunca hatırlansın. Eser detayında 3D'ye geçen, anlatıma da 3D ile girer.

### 10.2 Ortak bileşenler

**İkonlar:** arayüz ikonları `lucide-react` (kodda kurulu, 0.468). AKAR ikon seti (`design/ikonlar/`) sadece pin, eser türü ve güven etiketi için.

| Bileşen | Ölçü | Görünüm | İkon | Metin |
|---|---|---|---|---|
| **Görünüm seçici** | Kap: iç boşluk 3, öğe arası 2, tam yuvarlak. Öğe: iç boşluk mobil 12×8, masaüstü 14×9; ikon 16, ikon–yazı arası 6. Yazı Inter Semi Bold 13 | **Açık zemin** (eser detay, 3D anlatım): kap `#FFFFFF` %95 + 1 px `#DAE1E2`; seçili öğe `#25477B`, yazı ve ikon beyaz. **Koyu zemin** (fotoğraflı anlatım): kap `#141B2B` %55 + 1 px beyaz %18; seçili öğe beyaz, yazı ve ikon `#141B2B` | `Image`, `Box` | "Fotoğraf", "3D" |
| **Yuvarlak düğme** (✕, ekranı doldur, galeri okları) | Mobil 40, masaüstü 44; ikon 18, ortada | Seçiciyle aynı açık/koyu kural | `X`, `Expand` / `Shrink`, `ChevronLeft` / `ChevronRight` | Yok. `aria-label` zorunlu: "Kapat", "Ekranı doldur", "Sığdır", "Önceki fotoğraflar", "Sonraki fotoğraflar" |
| **İlerleme çubuğu** | Cümle/bölüm sayısı kadar parça; yükseklik 3, parça arası 4, köşe 2 | Fotoğrafta iz beyaz %30, dolu beyaz. 3D'de iz beyaz, dolu `#25477B` | Yok | Yok |
| **Güven etiketi** (fotoğrafın üstünde ve fotoğraflı ekranlarda) | Mevcut bileşen, %85 ölçek | Opaklık %75 | Mevcut | Mevcut |
| **Fotoğraf künyesi** | Inter Regular 10 (mobil), 11 (masaüstü) | Beyaz %70–75; fotoğrafın sağ altında, güven etiketiyle aynı hizada | Yok | `gorsel.kaynak`tan, ör. "Fotoğraf: Bursa Vakıf Eserleri Envanteri" |

Seçici bir `role="radiogroup"`: iki öğe `role="radio"`, ←/→ ile geçiş.

### 10.3 Eser detay

**Mobil (m01 fotoğraf, m02 3D)**

| Öğe | Yer | İkon |
|---|---|---|
| "‹ Harita" | Sol üst, x 16, y 16, yükseklik 44 (değişmedi) | İkon yok, metin "‹  Harita" |
| Görünüm seçici | Sağ üst, sağdan 16, "‹ Harita" ile dikey ortalı | `Image`, `Box` |
| Galeri | y 72, yükseklik 478, kenar 16, kare arası 8, köşe 16 | — |
| Alt kart | y 566 (galerinin 16 px altı). İçerik değişmedi | — |
| Dinle · 4 dk | Kartta, birincil (dolu `#25477B`) | `Headphones` + metin |
| Oku | Kartta, ikincil | `Book` + metin |
| Sonraki durak: Koza Hanı → | Kartta, çerçeveli, tam genişlik | İkon yok (→ metnin parçası) |

- **Galeri düzeni** Google Haritalar'daki gibi tekrar eder: büyük (262×478) → üst üste iki küçük (180×235) → büyük → … Yatay kaydırılır (`scroll-snap`). Sağda bir sonraki sütunun ucu görünür, devamı olduğu anlaşılır.
- İlk fotoğrafın sol altında güven etiketi (kenardan 12).
- Fotoğrafa dokununca tam ekran görüntüleyici açılır (öneri; Figma'da çizilmedi).
- **3D (m02):** üst alan 3D sahne. "Sürükle: döndür · İki parmak: yakınlaştır" ipucu üstte ortada (`Move` ikonu). "3D model · Temsili" etiketi kartın hemen üstünde, solda.

**Masaüstü (d01 fotoğraf, d02 3D)**
- Sol panel değişmedi (420 px).
- Galeri sağ alanın tamamı (1019×835), iç boşluk 24. Büyük kare 560×787, küçük kare 340×389, arası 8, köşe 16.
- Sağda dikey ortada **›** düğmesi (44, `ChevronRight`), sağdan 24. Solda **‹** (`ChevronLeft`) ilk sayfada gizli, kaydırınca çıkar. Fare tekeriyle yatay kaydırma da çalışsın (öneri).
- Görünüm seçici sağ üstte: y 96, sağdan 24.

### 10.4 Anlatım: üst bölüm

**Mobil (m03–m10)**

| Öğe | Yer | Gizlenir mi |
|---|---|---|
| İlerleme çubuğu | x 16–374, y 12 (tam genişlik) | **Hayır**, hep görünür |
| ✕ | Sol, x 16, y 28, 40×40, `X` | Evet |
| Ekranı doldur / Sığdır | Sağ, sağdan 16, y 28, 40×40, `Expand` / `Shrink`. **Sadece fotoğraf görünümünde** | Evet |
| Görünüm seçici | Tam ekran düğmesinin 8 px solunda, onunla dikey ortalı. 3D'de tam ekran düğmesi olmadığı için sağdan 16 | Evet |

**Masaüstü (d03–d08)**
- ✕ sol panelde, eski yerinde (gizlenmez).
- İlerleme çubuğu sağ alanın üstünde: x 445–1416, y 81.
- Seçici ve tam ekran düğmesi: y 96, sağdan 24, aralarında 8.

**Kontrollerin gizlenmesi (m05, d05)**
- Anlatım oynarken 3 sn dokunma, fare hareketi ya da tuş yoksa ✕, seçici ve tam ekran düğmesi solarak gizlenir (`opacity`, `--sure-2`).
- Tek dokunuş, fare hareketi, klavye odağı ya da anlatımın bitmesi onları geri getirir. Duraklatılmışken gizlenmezler.
- İlerleme çubuğu ve alttaki oynatıcı/hikâye kartı hiç gizlenmez.
- Gizliyken ilk dokunuş sadece kontrolleri gösterir, altındaki bir düğmeye basılmış sayılmaz.
- `prefers-reduced-motion`: solma yok, anında.

### 10.5 Anlatım: fotoğraf sahnesi
- **Varsayılan: Sığdır** (m03, m06, m07, d03, d06). Fotoğraf orijinal oranında, kırpılmaz.
- **Arka plan aynı fotoğrafın bulanık hâli:** aynı görsel arkada bir kez daha, `object-fit: cover`, `filter: blur(48px)` (masaüstü 64px), kenarda hale olmasın diye `transform: scale(1.2)`; üstünde siyah %30. Ayrı dosya gerekmez.
- **Fotoğraf alanı (mobil):** hikâye kartı kapalıyken y 0–568, fotoğraf dikeyde ortada. Dinle açık ve Oku'da y 0–360, fotoğraf alta yaslı. **Masaüstü:** sağ alan, üstte ve altta 40 boşluk, ortada.
- **Ekranı doldur** (m04, d04): `object-fit: cover`, bütün alan. Seçim hatırlanır (localStorage, ör. `akar.fotoKip`).
- Üstte siyahtan saydama geçiş (%45 → %0; mobil 110 px, masaüstü 140 px), üst kontroller her fotoğrafta okunsun.
- Fotoğrafın sol altında güven etiketi, sağ altında künye (§10.2).
- Cümle değişince fotoğraf çapraz solarak değişir (`--sure-3`). Peş peşe aynı fotoğraf gelirse değişmez.
- Sağa/sola kaydırarak cümle geçme fotoğrafta da yok (Tam Bağlam §5).

### 10.6 Anlatım: 3D sahnesi (m08–m10, d07, d08)
- Üst bölüm aynı düzen, açık zemin. Tam ekran düğmesi yok.
- Kart: cümlede `kart_goster` açıksa o cümlenin fotoğrafı, başlığı ve kısa metni modeldeki bir noktaya bağlı kart olur (§4).
- **Kartın bağlandığı nokta:** cümlenin ilk vurgu parçası (`vurgu[0]`); vurgu yoksa açının hedefi; o da yoksa `Merkez`. Kart ayrı bir `Kart_*` noktası istemez. Modelde aynı adda bir `Kart_*` boş nesnesi varsa (eski modeller) o kullanılabilir, zorunlu değil.

### 10.7 Panel · 4 Hikâye (p01–p03)
- **Tek satır:** Cümle | Fotoğraf | Kart | Açı | Vurgu. Satır yüksekliği 72, sütun arası 8. Genişlikler 212 | 112 | 60 | 96 | 88.
- **Fotoğraf hücresi:** 28×28 küçük resim (köşe 6) + başlık. Boşsa "+ Fotoğraf" düğmesi → Fotoğraf ekle penceresi (p02).
- **Kart hücresi:** görünüşü radio dairesi (18 px; açıkken `#25477B` halka + nokta). Davranışı satır başına aç/kapa, yani kodda `<input type="checkbox">` ya da `role="switch"`. `radio` kullanılmasın: "gruptan tek seçim" demek, ekran okuyucuya yanlış bilgi verir. Fotoğrafı olmayan satırda devre dışı (%35).
- Seçili satırın altında: Kaynak, Güven etiketi, Ses TR/EN, Metin EN + altyazı. En altta küçük gri tek satır: "Kaynak ve lisans her fotoğrafta zorunlu; yüklerken bir kez girilir."
- Önizlemenin üstünde sağda **3D | Fotoğraf** geçişi.
- **3D'siz eser (p03):** Model adımında .glb yüklenmediyse Kart, Açı ve Vurgu sütunları gizlenir: Cümle (380) | Fotoğraf (212). Önizleme fotoğraftır; altında "Cümleyi oynat ▶" ve "Baştan oynat".
- **Fotoğraf ekle penceresi (p02):** Yeni fotoğraf / Havuzdan seç · görsel yükle (alt metin zorunlu) · Başlık TR / EN · Kısa metin (TR) · Kaynak (eserin listesinden) · Lisans · Güven etiketi (Doğrulanmış / Tarihsel çıkarım / Temsili) · İptal / Fotoğrafı ekle.

## 11. Açık işler ve doğrulanacaklar

- Rota durakları kesinleşmeli (Bedesten eklenecek mi?).
- Envanterdeki adreslerden geocoding; konumu bulunamayanlar elle düzeltilecek.
- `veri/bursa/bursa_eserler.csv` 408 satır, kitap 385 diyor: tekrarlar temizlenecek.
- Vakıf Katılım'dan seçili eserlerin orijinal fotoğrafları ve kitapların görsel kimlik dosyaları istenecek.
- Ulucami/Bedesten 3D referans modelleri (3D Warehouse / Sketchfab) aranacak; lisans notu `veri/bursa/links.md`.
- İngilizce metinler ve sesler.
- Kararlar: mobil alt menü, logo (bkz. `design/karsilastirma/KARSILASTIRMA.md`). Bulmaca biçimi kararı Bulmaca beklemeye alındığı için ertelendi (§0).
- Vakıf Katılım'dan envanter fotoğraflarının uygulamada kullanım izni yazılı alınmalı; lisans alanı buna göre doldurulur.
- Panelde "Kartlar" menüsünün adı: "Fotoğraflar" olsun mu?
- Rozetler kapsamda mı? (§0)
- Bulmaca ve Birlikte Gez'in yerine ne gelecek?
- 20 Ekim, Figma karşılaştırmasından çıkan veri modeli kararları:
  - **Sayfa numarası cümle–kaynak bağında durmalı.** `kaynak.sayfa` yerine bağ tablosunda `sayfa` ve sayfa türü (PDF / kitap). Aynı kitap farklı cümlelerde farklı sayfayla anılıyor.
  - **Bir cümlenin birden çok kaynağı olabilir.** Figma Kaynak detayı 3–4 kaynak gösteriyor; `hikaye_cumle.kaynak_id` tek. En az bir kaynak zorunlu kalacak şekilde çoka çok bağ.
  - **Akar bağı** (`akar_bagi`) kaynak, güven etiketi ve akış kalemleri (bakım, aydınlatma, görevliler) taşımalı; Figma'da bu kalemler Akar akışı ve Rota tamamlandı ekranlarında var.
  - Yayın kuralları (§2) Tier 1 / Tier 2 / Hero'ya göre ayrı çalışır: Tier 1'in hikâyesi ve cümle fotoğrafı yoktur.
