# Mobil sadelik — 3 Kasım 2026 (gece)

**Dal:** `muhammedtalay/mobil-optimizasyon`.
**Kaynak:** Muhammed'in listesi ve `../mobile-revize/` (11 ekran görüntüsü, canlı site, 3 Kasım 00:24–00:26).
**İlke:** Apple kadar basit, her ekranda tek iş. Her yer anlaşılır olsun, kasmasın. **Tanıtım sayfasına dokunulmaz.**

Ekran görüntülerinde görülen sorunlar:
- Hikâyede fotoğraf, «büyüt» düğmesiyle bütün ekranı kaplıyor.
- Kart ekranın yarısını tutuyor; altında Oku, ‹ ⏸ › ve 1× düğmeleri var; her cümlede «Doğrulanmış» etiketi.
- Haritanın üstünde Bursa, Evden gez, Dini, Su… çip satırı; altta Eserler | Rotalar sekmeleri.
- Rotalar listesi kalabalık; pinler küçük ve ne olduklarını söylemiyor.

## Yapılacaklar (sırayla)

1. **Kaldırılacaklar:** «Doğrulanmış» etiketleri ve yazıları (her yerden); «Yanındayım»; harita üstündeki rol çipleri ve «Evden gez». Yalnız il düğmesi kalır, yanında açılabildiğini gösteren ▾. Hikâyedeki fotoğrafı tam ekran yapan düğme (`story-photo-fill`).
2. **Harita yalnız Türkiye:** Türkiye dışına kaydırılamaz, belli bir seviyeden fazla uzaklaşılamaz.
3. **Hikâye sade:**
   - Ekranın sağına dokun: sonraki cümle; soluna dokun: önceki (Instagram hikâyesi gibi).
   - Altta yalnız ses düğmesi (çal / durdur) ve otomatik ilerleme; Dinle | Oku, ‹ ›, 1× kalkar.
   - Kart küçük. Tutamak çizgisi yerine ▾/▴ ok: basınca kart gizlenir ve açılır.
   - Fotoğraf ve model kartın üstünde kalır; görsel hiçbir zaman ekranı kaplamaz.
4. **Haritadan esere, Instagram gibi:**
   - Esere dokunulunca alttaki kart yalnız küçük fotoğraf ve ad gösterir (Dinle | Oku kalkar).
   - Kart yukarı çekilince ya da dokununca eser sayfası açılır.
   - Eser sayfasında kart aşağı çekilince haritaya dönülür. Hızlı ve akıcı olmalı.
5. **Eserler | Rotalar:** sekmeler kalkar. Altta «Bursa · 9 eser» listesi, rotalar tek bir «Rotalar ›» bağlantısıyla açılır, daha sade bir rota listesiyle.
6. **İlk kullanımda kısa rehber** (Instagram / Figma gibi): ilk girişte ekranın ilgili yerinde bir iki cümlelik ipuçları ve bir kerelik «Fotoğraf mı, 3D mi?» seçimi. Bir kez gösterilir, cihazda hatırlanır.
7. **Donma:** eser sayfası zayıf telefonda fotoğrafla açılır, 3D ancak istenince yüklenir. Seçim (6) hatırlanır.
8. **Pinler:** eserin küçük fotoğrafı ve rengiyle anlaşılır pin.
9. **Yakınlaştırma:** sayfa değil fotoğraf yakınlaşır (fotoğraf görüntüleyicide iki parmakla).

## Durum

Hepsi yapıldı (3 Kasım gecesi). Tanıtım sayfasına dokunulmadı.

1. ✓ «Doğrulanmış» etiketi hiçbir yerde görünmüyor (`TrustTag` doğrulanmışta boş). «Yanındayım» panelden ve eser sayfasından kalktı. Harita üstünde yalnız il düğmesi var, yanında ▾. `story-photo-fill` kalktı.
2. ✓ Harita yalnız Türkiye: sınırlar dışına kaydırılmıyor, en fazla 4. seviyeye uzaklaşılıyor, dünya kopyaları yok.
3. ✓ Hikâye kartı küçüldü:
   - Kartın sağ üçte ikisine dokun: sonraki cümle; sol üçte birine: önceki.
   - Altta sayaç, tek ses düğmesi (çalar/durdurur, otomatik ilerler) ve cümle listesi.
   - ▾/▴ ile kart katlanıyor; sahne kartın üstünde bitiyor.
4. ✓ Haritadan esere:
   - Telefonda kısa kart yalnız küçük fotoğraf, ad ve tek satır gösteriyor; ayrıca rotaya ekleme düğmesi ve ›.
   - Kart yukarı çekilince ya da dokununca eser sayfası açılıyor; aşağı çekilince kapanıyor.
   - Eser sayfasında kart aşağı çekilince parmağı izliyor, yeterince çekilince haritaya dönülüyor.
5. ✓ Telefonda sekme yok. «Bursa · 9 eser» satırının yanında «Rotalar ›», rotalarda «‹ Eserler». Rota kartları sade: ad, uzunluk, durakların küçük fotoğrafları. Boş kişisel rota listelenmiyor.
6. ✓ İlk kullanım: dört ekranda birer cümlelik ipucu var (harita, kısa kart, eser sayfası, hikâye; `coach-tip.tsx`). Her biri bir kez görünüyor, «Tamam»la kapanıyor. Modeli olan eser ilk açıldığında «Fotoğraflar mı, 3D model mi?» diye soruyor. Seçim cihazda saklanıyor (`akar.gorunum`).
7. ✓ Donma: telefonda seçim yapılana kadar eser fotoğraflarla açılıyor, model indirilmiyor (testte doğrulandı: soru açıkken hiç GLB isteği yok).
8. ✓ Pinler eserin kendi fotoğrafını gösteriyor: yuvarlak, rengi türünün rengi. Fotoğrafı olmayan eser ve rota durakları eski pinde kalıyor.
9. ✓ Fotoğraf görüntüleyicide iki parmakla fotoğraf yakınlaşıyor (1–5×). Büyütülmüşken sürükleniyor, çift dokunuşla büyüyüp küçülüyor, büyütülmemişken yana kaydırınca fotoğraf değişiyor. Telefonda uygulama sayfası yakınlaşmıyor; harita ve 3D kendi yakınlaştırmalarını kullanıyor.

**Gerçek telefonda bakılacaklar:**
- iOS Safari'de sayfa yakınlaşması (`touch-action: pan-x pan-y`);
- kartı çekme akıcılığı;
- fotoğraflı pinlerin okunurluğu.
