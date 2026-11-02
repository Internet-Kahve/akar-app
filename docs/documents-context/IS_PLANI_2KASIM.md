# İş planı — 2 Kasım 2026 (Muhammed'in istekleri)

**Dal:** `muhammedtalay/mobil-kart-performans` (main 1b958b4'ten).
**Yöntem:** maddeler sırayla yapılır. Her madde bitince ekran görüntüsü ve test sonucu gösterilir, Muhammed onay verince ayrı commit atılır. Push yok. Commit ve PR metinlerinde araç imzası ya da ortak yazar satırı olmaz.
**Kıyas:** prototip `.prototip/docs/documents-context/design/test-redmi9t-v2/` (8090), Kılıç Ali Paşa prototipi `.prototip/docs/documents-context/design/ilk-prototip-kılıç-ali-pasa-düz-stil/`, mobil ekran görüntüleri `../mobile/` (3 adet, 1 Kasım 23:18–23:19).

## 0. Gece temasındaki düzeltmeler — yapıldı (1739a95, b07a349)

Canlı denetimde bulunan ve düzeltilen dört sorun (2 Kasım):

- [x] Sayfa açıkken geceye geçince harita gündüz boyasında ve gündüz modelleriyle kalıyordu (`lib/map-theme.ts`: `load` yerine `idle`).
- [x] Gece modellerinde «parçaları göster», seçim ve vurgu parlamıyordu (`model-viewer.tsx`: ışıksız malzemede renk parlıyor).
- [x] Gece karşılamasında AKAR logosu görünmüyordu (`theme.css`).
- [x] Mobil karşılamaya ve rozet tebrik sahnesine şehir deseni eklendi (`design.css`). Tebrik sahnesi ekranda henüz görülmedi.

Gece parlaması Muhammed'in isteğiyle mavi (açık gök mavisi), yanan altın pencerelere zıt.

Bildirilecek: dokümanlarda ve `services/api/src/config.ts` / `config.test.ts` içinde örnek olarak geçen `akar.vercel.app` bizim adresimiz değil (açınca spam sayfası çıkıyor). Tamer'e iletilecek.


## Durum (2 Kasım akşam)

| Madde | Durum | Commit |
|---|---|---|
| 1 · Ulucami mahyalı gece modeli | yapıldı; canlıya içerik aktarımıyla gelir (Tamer) | b79dd9e |
| 2 · «Parçaları göster» rastgele ve uzak sıra | yapıldı | faa1b5c |
| 10 · «Sade anlatım» kalktı, TR/EN ve ses düğmeleri daire; hikâye modunda harita akışı kalktı | yapıldı | d3f8682, 30048a3 |
| 3 · Koza Han z-fighting | yapıldı: görünür çakışma ≈ 98 → 4 m² (kalanlar parçaların kendi içinde, blend'den yeniden üretimde) | 694ce95 |
| 4 · Mobil eser kartı = `mobile/` ekranları | yapıldı; 390 × 844'te prototiple aynı ölçü; e2e `tests/site-card-mobile.spec.ts` | 71b96ab |
| 9 · Hikâye fotoğraf kartı boyutlandırılır, yeri ve boyutu saklanır | yapıldı | ca64023 |
| 8 · Rotam sol panelde | yapıldı; e2e `tests/route-builder.spec.ts` | 07f9740 |
| 5 · Açı okları: 7 eserde 26 açı (`model.json → foto_acilari`, `tahmini` işaretli olanlar panelden düzeltilecek) | yapıldı; içe aktarma da okuyor (API testi Docker ister, çalıştırılmadı) | c340bdf |
| 11 · Eser hakkında sesi: dokunulan paragraftan sürer, geri bölüm atlar | yapıldı; e2e `tests/about-voice.spec.ts` | 858f542 |
| 6 · Akar/hayrat akışı eserin kendi sahnesinde (Kılıç Ali Paşa `story.js flow`) | yapıldı: eş model yanında, altın tüp + sikkeler + etiket, kamera geri çekilir; modeli yoksa kapak fotoğrafı, katalog dışı yer adıyla | 2d751f7 |
| 7 · Panelden akış: 3D/fotoğraf seçimi, eşin yeri, kamera, dış yere fotoğraf | **bekliyor**: `StoryFlow`'a alan (ör. `display`, `photoId`, `labels[]`, `camera`) ve API doğrulaması gerekir — Burak ile | — |

Notlar:
- Prototipte yay boyunca üç etiket sırayla belirir («Bakım · Aydınlatma · Görevliler»); üründe içerikte tek etiket var. Madde 7'de `labels[]` ile eklenebilir.
- `akar.vercel.app` (dokümanlarda ve `services/api/src/config.ts` örneklerinde) spam sitesi; Tamer'e bildirilecek.
- Yerelde 3002'de başka bir çalışma kopyasının (`akar-eser-hakkinda`) dev sunucusu açık; «Eser hakkında» üzerinde paralel iş varsa `about-reading.tsx` birleşmesinde çakışma olabilir.

## 1. Ulucami gece modeli: mahyalı v2

- [ ] `eserler/ulu-cami/3d/model.json` → `"glb_gece": "night/ulu-cami_v32_night_v2"`.
- [ ] `node apps/web/scripts/prepare-demo-content.mjs` çalıştırılır. Parça adları gündüzle aynı kalmalı; birim testi bunu denetliyor.
- [ ] Haritada ve eser detayında gece görüntüsüne bakılır (yazı iki yandan okunuyor mu, ışıltı fazla mı).
- [ ] Commit'e dahil olanlar: `mahya_ekle.py`, `_kutuphane/gece/ayar/ulu-cami.json`, iki v2 GLB, `kontrol/night/mahya_v2_*.png`.
- **Canlı:** içerik yeniden aktarılınca gelir (Tamer).

## 2. Gece/gündüz «Dokun» (parçaları göster) anlaşılır olsun

- [ ] **Gece:** madde 0'daki düzeltmeyle parlama geldi. Telefon ekranında yeterince belirgin mi diye bakılır; değilse gece parlama düzeyi ve rengi ayrı ayarlanır (`HOVER_GLOW` / `PICK_GLOW`).
- [ ] **Sıra rastgele olsun:** şu an parçalar kart sırasıyla yanıyor, yan yana duran parçalar art arda yanınca tek parça gibi görünüyor. Sıra her basışta karıştırılır; art arda yanan iki parça mümkünse birbirinden uzak seçilir (parçaların sahnedeki merkezlerine göre). Yer: `model-viewer.tsx`, `model-show-parts` düğmesinin `animate` döngüsü.
- [ ] Hareket azaltmada hepsi bir kez birlikte yanar (bugünkü gibi).

## 3. Koza Han'da z-fighting

- [ ] Yakın ve uzak açıda titreyen yüzeyler bulunur: revak, kubbe ve çatı birleşimleri, avlu zemini ile şadırvan tabanı.
- [ ] Kaynağa göre düzeltilir: üst üste binen yüzeyler Blender'da ayrılır ya da silinir (`eserler/koza-han/3d/blend`, Blender MCP). Kod tarafında yalnız yakın düzlem (`camera.near`) ve gerekirse `polygonOffset` denenir.
- [ ] GLB yeniden üretilirse parça adları korunur (`parcalar.md`, `hikaye.md`, `gorevler.json`, `model.json → ortu_gruplari`). §3'teki «kubbe ve çatılar tek parça, şadırvan ayrı» isteğiyle birlikte yapılabilir.
- [ ] Gece GLB'si de aynı geometriyle yeniden üretilir.

## 4. Mobil eser detayı = `mobile/` ekran görüntüleri

Görüntülerdeki davranış:
- Kapalı: alttan 12 px içeride yüzen cam kart. Kartta ad, «Kısa hikâye · 1 dk», Dinle | Oku ve kartın altında silikleşerek kesilen «Eser hakkında» bulunur. Kartın üstündeki ˄ yukarı çekilebileceğini gösterir.
- Yarı ve tam açık: kart yukarı çekilir, Keşfet listesi görünür; en altta yıl, süsleme ve kısa metin yer alır. Tutamakta ˅ belirir.
- «3D model · Temsili» ve «İçini göster» kartın hemen üstünde durur, kartla birlikte iner ve kalkar.
- Üstte «‹ Harita», [Fotoğraf | 3D], parçalar düğmesi ve altında «Sürükle: döndür · İki parmak: yakınlaştır · Dokun: parça» ipucu hapı.

İş (ayrıntı `PROTOTIP_AKTARIM.md` §3 madde 6):
- [ ] Prototip (8090) ve ürün 390×844'te ölçülür: kapalı, yarı ve tam açık konum, köşe, gölge, silik geçiş, eşikler, fiske. Farklar listelenip gösterilir.
- [ ] Haritadaki alt sayfayla aynı sürükleme kodu kullanılır; ikinci bir sürükleme mantığı yazılmaz.
- [ ] Hareket azaltma desteklenir; klavye ve ekran okuyucuyla açılıp kapanabilir. Masaüstü değişmez.
- [ ] E2e: kapalı ve açık durum, sürükleme, «Temsili» ve «İçini göster»in kartla birlikte hareketi.

## 5. Eser detayında açı okları (‹ İçini göster ›)

- [ ] 3D'de «İçini göster»in iki yanında ‹ › okları bulunur. Her basış kamerayı bir sonraki kayıtlı açıya kaydırır (3–4 açı).
- [ ] Her açıya bir galeri fotoğrafı bağlıdır. Fotoğraf görünümünde aynı oklar o açının fotoğrafına geçer.
- [ ] Altyapı zaten var: `photoCameras` (domain, API, admin «Fotoğraf açıları») ve kodda ‹ › gezintisi (`model-viewer.tsx`). Ancak hiçbir eserde açı girilmemiş.
- [ ] **İlk doldurma:** 7 modelli eserin her birine 3–4 açı (ön, yan, üst, avlu ya da iç). Fotoğrafla açıkça eşleşenler eşleştirilir, kalanlara rastgele bir galeri fotoğrafı konur. Bunlar `model.json`'a (ya da içerik paketinde uygun bir alana) yazılır ve rastgele olanlar işaretlenir; Muhammed panelden değiştirir.
- [ ] Panel: açı ekleme, silme, sıralama ve fotoğraf seçme çalışıyor mu, uçtan uca denenir.

## 6. Akar / hayrat akışı eserin kendi sahnesinde

Kılıç Ali Paşa prototipindeki gibi: akar cümlesinde ayrı harita açılmaz. Eserin 3D sahnesinde gelir kaynağı (ör. Bedesten) yanında belirir, aralarında altın bir yay ve sikkeler akar, kamera biraz geri çekilir. Cümle bitince kaynak kaybolur, kamera geri döner.

- [ ] Referans incelenir: hamam ile caminin yan yana gelişi, kamera hareketi, yayın biçimi ve süreleri.
- [ ] Sahne: ikinci model aynı sahneye yüklenir (kaynak eserin GLB'si, küçük ölçekte, belirlenen tarafta). Altın yay ve sikkeler çizilir, kamera kadrajı iki modeli içine alır. Kartta «Bedesten → Ulucami» yazar.
- [ ] Kaynağın 3D'si yoksa fotoğraf kartı kullanılır. Örneğin Koza Han'dan İstanbul'daki bir camiye giden gelirde camiye fotoğraf eklenir.
- [ ] Fotoğraflı (3D'siz) eserde aynı yay fotoğrafın üstünde gösterilir.
- [ ] Bugünkü `story-flow-map.tsx` (harita üstünde yay) ne olacak: kaldırılsın mı, yedek mi kalsın? Karar Muhammed'in.
- [ ] Hem hayrat (gelir alan) hem akar (gelir getiren) eserde çalışır.
- [ ] **Panel:** hikâye cümlesinin akışında şunlar seçilir: kaynak ve hedef eser (ya da katalog dışı bir yer, ad ve fotoğrafla), gösterim biçimi (3D model ya da fotoğraf), kaynağın sahnedeki yeri ve yönü, kamera açısı (önizlemede «açıyı kaydet»), kart metni, kaynak ve güven. Yer: `admin-site-editor.tsx` Hikâye adımı. API'deki `story_blocks.flow` yetmezse genişletilir; bu Burak/Tamer ile konuşulur.

## 7. Panel: akış ve açılarda eser fotoğrafı ya da modeli seçmek

- [ ] Akış (madde 6) ve açı (madde 5) kayıtlarında görsel kaynağı seçilebilir: kataloğun bir eserinin modeli, bir eserin galeri fotoğrafı ya da yeni yüklenen bir fotoğraf (`admin-photo-dialog.tsx` yeniden kullanılır).

## 8. Rotam: soldaki panele entegre

Bugün rota kurucu ayrı bir yerde açılıyor ve düğmeleri başka yerlerde çıkıyor, oysa solda zaten panel var.
- [ ] Rota kurma ve düzenleme tümüyle sol panelde (mobilde alt sayfada) yapılır: ad, durak listesi (sürükleyerek sıralama, çıkarma), toplam süre ve mesafe, Kaydet ve Vazgeç panelin altında yapışık durur. Haritada rota çizgisi ve numaralı yıldızlar canlı güncellenir.
- [ ] Haritadaki «+» rozetiyle eklenen durak panel listesine anında düşer.
- [ ] Önce tasarım önerisi hazırlanır (masaüstü ve mobil), Muhammed onaylarsa kodlanır. Yerler: `route-builder.tsx`, `akar-app.tsx` (`openRouteBuilder`), `explore-panel.tsx`.
- [ ] E2e: rota oluştur, durak ekle, çıkar, sırala, kaydet, sil.

## 9. Hikâye (anlatım) kartı: taşınabilir ve boyutlandırılabilir

- [ ] Masaüstünde kart başlığından sürüklenerek taşınır, köşesinden büyütülüp küçültülür; en küçük ve en büyük sınırı olur, ekran dışına çıkamaz.
- [ ] Mobilde alt sayfa yüksekliği sürüklemeyle ayarlanır (madde 4'ün sürükleme kodu).
- [ ] Konum ve boyut cihazda saklanır (`localStorage`, hata durumunda varsayılana döner). «Sıfırla» ile ilk hâline gelir.
- [ ] Klavyeyle de taşınıp boyutlandırılabilir (ok tuşları ve odak). Hareket azaltmada animasyon olmaz.
- [ ] Yer: `story-panel.tsx`, `.story-card`.

## 10. Anlatım: «Sade anlatım» kalksın, TR/EN ve kadın/erkek düğmeleri belirginleşsin

- [ ] «Sade anlatım» onay kutusu kaldırılır (`story-panel.tsx`, `site.simpleMode`). Kullanıldığı başka yer varsa temizlenir.
- [ ] Dil (TR/EN) ve ses (kadın/erkek) düğmeleri küçük, yumuşak, daire biçimli ve belirgin olur: dolu zemin, seçili durum açıkça farklı, 36 px dokunma alanı korunur. Gece ve gündüzde okunur olmalı (`.story-voice-compact`, `design.css` `.story-voice`).

## 11. Eser hakkında: ses doğru yerden başlasın, metinle eşleşsin

- [ ] Bir bölümde «Dinle»ye basınca ses o bölümün başlığından başlar. Okunan paragraf vurgulanır, sayfa onu takip eder. Başlıklar, metinler ve sesler birbirine doğru eşleşir.
- [ ] Bugünkü durum ölçülür: hangi bölümde başka yerden başlıyor, ses dosyası mı (varsa) yoksa tarayıcı sesi mi kullanılıyor, paragraf indeksi metinle uyuşuyor mu (`about-reading.tsx` `setVoice`, `speechSynthesis`).
- [ ] Ara başlıklar, alıntılar ve rakam kartları okuma sırasında atlanır ya da doğru sırada okunur; hangisi olacağı belirlenir.
- [ ] E2e: 2. bölümde Dinle → doğru başlık ve paragraf vurgulanır.

## Sonra (önceki listeden)

- Telefon performansı (`YAPILACAKLAR.md` §5): harita piksel oranı, lazy görseller, panelin ziyaretçi paketinden ayrılması, gece modelinin yalnız gece inmesi, fotoğraf boyutu ve önbellek önerisi (Burak/Tamer).
- Eser detayı masaüstü başlığı yeniden düzen (`PROTOTIP_AKTARIM.md` §3 madde 3).
- Parça kartlarına mimari bilgi (§3 madde 5).
- Bitince 390 px'te prototiple ekran ekran kalan farklar listesi.

## Önerilen sıra

0 → 1 → 2 → 10 → 3 → 4 → 9 → 8 → 5 → 11 → 6 + 7.
Önce hızlı ve görünür düzeltmeler gelir. Ardından mobil kart (4) ve hikâye kartı (9) gelir; ikisi aynı sürükleme koduna dayanıyor. Akış (6, 7) en büyük iş olduğu ve API'ye dokunabileceği için sonda.
