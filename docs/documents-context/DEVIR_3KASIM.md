# Devir notu: 3 Kasım 2026 (mobil sadelik ve performans)

**Dal:** `muhammedtalay/mobil-optimizasyon` (main `2be3e8d`'den). **Push edilmedi**; Muhammed onaylayınca atılacak.
**Tanıtım sayfasına dokunulmadı** (`public/tanitim/`).
Ayrıntılı geçmiş:
- `OPTIMIZASYON_3KASIM.md`: performans ölçümleri;
- `MOBIL_SADELIK_3KASIM.md`: ilk sadelik listesi (9 madde, hepsi bitti).

## Telefonda deneme

- Mac'te üretim derlemesi `.next-telefon`, port 3005, ağa açık. Başlatma komutu (`apps/web` içinde):
  `NEXT_PUBLIC_DEMO_CONTENT=1 NEXT_DIST_DIR=.next-telefon npx next build && NEXT_PUBLIC_DEMO_CONTENT=1 NEXT_DIST_DIR=.next-telefon npx next start -p 3005 -H 0.0.0.0`
- Adres: `http://<Mac IP>:3005/#view=map` (son IP `192.168.1.91`; `ipconfig getifaddr en0`).
- İpuçlarını baştan görmek için gizli sekme kullan.
- Ekran görüntüsü için ikinci bir derleme: `.next-bak`, port 3008.

## Bu dalda yapılanlar (özet, commit sırasıyla)

1. **Performans:**
   - fotoğraflar gösterildiği boyutta (`lib/image-size.ts`);
   - telefonda buzlu cam yok;
   - cihaza göre piksel oranı (`lib/device.ts`);
   - shader derleme ilk çizimden önce;
   - yönetim paneli ayrı parça;
   - harita önce, modeller sonra; aynı malzemeli parçalar birleşiyor (`lib/model-merge.ts`).
2. **Sadelik:**
   - «Doğrulanmış», «Yanındayım», karşılama kartı ve harita çipleri kalktı; yalnız «Bursa ▾» var;
   - harita yalnız Türkiye.
3. **Hikâye (telefon):**
   - fotoğrafa ya da modele dokunarak ilerleme: sağ ileri, sol üçte bir geri;
   - tam genişlik alt kart: ☰, ‹, yuvarlak ses, ›, sayaç;
   - ☰ sayfası: cümleler, otomatik oynat, hız, kadın/erkek ses, dil;
   - fotoğraf kartı sahnenin altında;
   - hikâye fotoğrafı iki parmakla yakınlaşıyor.
4. **Haritadan esere:**
   - kısa kart yalnız foto, ad ve ›; yukarı çek ya da dokun → eser sayfası;
   - eser sayfasında kartı aşağı çek → harita;
   - harita eser sayfasının arkasında gizli bekliyor, geri dönüş yaklaşık 0,1 sn.
5. **Telefonda sekme yok:** «Rotalar ›» bağlantısı ve sade rota kartları; «Yeni rota oluştur» kartı; rota kurucuda parmaklı «+ rozetine dokun» yönlendirmesi.
6. **İlk kullanım:**
   - bir kerelik «Fotoğraflar mı, 3D mi?» sorusu; spot ışığı ve üstteki düğmeleri gösteren ok; cevap gelene kadar model inmiyor;
   - ipuçları `components/coach-tip.tsx` içinde: `CoachTip`, `TipRow`, `Spotlight`. Liste aşağıda.
7. **Pinler:** eserin kendi fotoğrafı, yuvarlak, tür renginde çerçeve (`lib/map-pins.ts`, `photoPinImage`).
8. **Fotoğraf görüntüleyici:** iki parmakla 1–5× (`ZoomPhoto`, `about-reading.tsx`); telefonda sayfa yakınlaşmıyor.
9. **Eser kartı:**
   - tam genişlik, soluklaşma yok;
   - tek «Hikâyeyi başlat» (masaüstünde de; Dinle | Oku kalktı);
   - «Eser hakkında» şehir renginde, motifli.
10. **Şehir menüsü:** «Bursa ▾» şehirleri açar, seçilen şehre uçar; «Bütün Türkiye» de var.
11. **Harita modelleri:**
    - görüş dışına çıkan model bellekte bekliyor (`parked`, en çok 8);
    - modeller 0,5 sn'de belirip kayboluyor;
    - zoom eşiğinde 0,5 kademe pay;
    - sade telefonda aynı anda 8 model;
    - yüklenirken yerinde dönen halka (`model-ring`);
    - telefonda küre yok; yakınlaşınca 3D, uzaklaşınca 2D.
12. **Gölge:**
    - eser 3D'sinde ve haritada bir kez çiziliyor, yalnız model değişince yeniden;
    - sade telefonda da açık: 1024 px eser sayfasında, 512 px haritada.
13. **Kart davranışı:**
    - bırakılan kart en yakın durağa oturuyor (fiske bir sonrakine);
    - yarıda kalmış kart 1,8 sn sonra yerine dönüyor;
    - sürüklerken React yeniden çizmiyor (`--sheet-h` doğrudan yazılıyor).
14. **Açı fotoğrafı (telefon):** kart ekranın dibine iniyor, fotoğraf alt yarıyı kaplıyor.
15. **Yükleniyor:** motif bir kez çiziliyor, sonra dönüyor; yanında dönen bir halka var.
16. **Hikâye sesi:** varsayılan açık (`akar.ses`); ipuçları bitene kadar bekliyor (`hold`).
17. **Masaüstü hikâye:** üstte yalnız × ve sayaç; altta ‹ [ses] ›, hız, TR ve ♀/♂.
18. **Geçmişi Gör:** telefonda foto alanı sabit yükseklikte; sayfa yana kaymıyor.
19. **Düğme basma efekti:** `translate` ile, `transform` ile değil. Ortalanmış düğmeler artık kaymıyor; parça kartı oklarında üst yarı çalışmıyordu.

20. **Harita güneşi:** eser sayfasıyla aynı (cepheden 40°, yükseklik 50°, gündüz güç 2,1; `MAP_LIGHT` ikisinin ortak kaynağı).

21. **Kapalı iç mekân:** eser sayfasında örtü kapalıyken iç parçalar çizilmiyor (`lib/interior.ts`). Örtü açılınca, kamera binaya girince ya da söz o parçadaysa geri geliyor. Eser başına açılır: `model.json` içinde `"ic_gizle": true` (Ulu Cami, Bedesten, Orhan Gazi Türbesi). Koza Han ve Orhan Bey Camii bilerek dışarıda; biri açıkta görünüyor, diğerinde görüntü farkı büyük. Canlı API bu alanı (`SiteModel.hideClosedInterior`) henüz taşımıyor.

22. **Yakın zoom:** pişmiş model yakınlaşma 17,5'te sunum modeline geçer, 17'nin altında döner (`CLOSE_ZOOM`, `lib/map-models.ts`). Biri öbürünün üzerine belirir, sonra eskisi kalkar.

## İpucu sıraları (`akar-app.tsx`, «First-time hints»)

**Senaryo kuralları (4 Kasım):** Rozet kartı, bulmaca, üst katman ya da giriş açıkken ipucu çıkmaz; kapanınca kısa aradan sonra gelir. Hikâyeyi başlatan birine «Hikâyeyi başlat» ipucu çıkmaz (`openStory`). Düğmeye kendi basan kişiye o düğmenin ipucu çıkmaz (`doneBy`). 3D ipuçları model gerçekten çizilince gelir (`.model-canvas[data-drawn]`, `when`). Masaüstünde «Bugününü sen çek» yok. Telefonda da fotoğraf/3D düğmesi ipucu var (`d.foto`).

Her ipucu bir kez gösterilir; cihazda `akar.ipucu.<id>` olarak saklanır. Bir ziyarette en çok 2 ipucu çıkar, kalanı sonraki ziyarete kalır; aralarında 0,5 sn ara vardır. «Şimdi bir parçaya dokun» yalnız parça düğmesine basılınca gelir (`when`) ve sayıya girmez. Bir ipucu açıkken ilk dokunuş yalnız onu kapatır (`swallow`); gösterdiği düğmeye basmak çalışır (`pressSpot`). Hedefi ekranda olmayan ipucu hiç görünmeden atlanır, hedef çıkınca gösterilir (`TipRow`). Hepsinde × var.

| Ekran | Telefon | Masaüstü |
|---|---|---|
| Harita | harita: «Bir esere dokun» | masa.harita: «Bir esere tıkla» |
| Kısa kart | kart: «Yukarı kaydır, eseri aç» (spot) | – |
| Eser sayfası | detay: «Aşağı kaydır» (kart açık, üstü karanlık) → d.parca: parça düğmesi → d.parcaya: «Şimdi bir parçaya dokun» | masa.detay: «Hikâyeyi buradan başlat» → masa.foto: Fotoğraf/3D → masa.parca → masa.parcaya |
| Hikâye | hikaye: «Sağa dokun» (sahte geçiş) → cevir: «Sağa doğru çevir» (3D) ya da yakinlas: «İki parmakla yakınlaştır» (foto) | masa.hikaye: «‹ › ya da ← →» → masa.cevir (3D) |
| Geçmişi Gör | g.foto → g.kiyas → g.bugun → g.serit → g.nereden | aynısı, `masa.` önekiyle |

Testlerin cihazında hepsi görülmüş sayılır (`playwright.config.ts`, storageState); ilk adımların kendi testi `tests/first-steps-mobile.spec.ts`.

## 4 Kasım gecesi eklenenler

- **Tanıtım sayfası:** `/tanitim` artık `public/tanitim2/index.html`. Başlık, fotoğraf, «Haritayı aç»; dört ekran; kullanıcının kendi gezdiği Ulucami modeli; eski/bugün kaydırıcısı; «Akar ne demek?». Kaydırmaya bağlı hareket yok. Eski uzun sayfa `/tanitim/yeni/` adresinde duruyor; üç boyutlu kitaplığı ve model dosyası yeni sayfada da kullanılıyor, silinmedi.
- **Sesler:** kayıtlar canlı API'de, demo içerikte yoktu; bu yüzden makine sesi okuyordu. `prepare-demo-content.mjs` metni aynı olan kayıtları canlıdan alıyor (227 metin). Tarayıcı sesi engellerse kayıt sonraki dokunuşu bekliyor.
- **Hikâye (telefon):** üstte model, ekranın %30'u fotoğraf, altta küçük kart. Fotoğrafı olan her cümle fotoğrafını gösterir; olmayanda model döner.
- **Açılar:** `hikaye.md` «## Açı» tablosu ve `model.json` `foto_acilari` yenilendi; uzaklık sayı olabilir (panel en az 0,05). Fotoğraflarla birebir değil, göz kararı yakın. Panelden ince ayar yapılabilir.
- **Geçmişi Gör:** 15 temsili görsel (`scripts/content/temsili_es_uret.mjs`), «Temsili görsel» etiketiyle. Canlıda görünmesi için `import-demo` ve `temsili` bilgisinin taşınması gerekir.
- **Pişmiş Ulucami:** dördüncü denemede 16 karenin 6'sı ölçüyü geçti. Yakın zoomda sunum modeline geçildiği için dosya 17,5'e kadar kullanılır; 440 m'de fark küçük. `pisik_onay` satırı commit edilmedi, karar Muhammed'in.
- **Tanıtım sayfası, ikinci tur:** Türkiye başlığı, şehir halkası ve şehir kartları (renkler `identity.accent`), Bursa deseni, gece fotoğrafı, TR/EN (`akar.dil`), gece teması (`akar.tema`), kaydırmalı Ulucami turu, gerçek kayıtlarla «İster dinle, ister oku».
- **Harita:** şehir düğmesi masaüstünde de harita üstünde, açılır; bütün Türkiye'de kırmızı. Rota kapatma: rota sayfasında ✕, haritada «Rotayı kapat».
- **Pişirme:** Ulucami ve kalan altı eser Muhammed'in onayıyla açık (`pisik_onay`), harita yedi modelde de pişmiş dosyayı yüklüyor. Ölçüde iki temada yalnız Orhan Bey Hamamı geçti. Bedesten, Emir Han, Koza Han ve Orhan Gazi Türbesi gündüz güneş parlamasında (renk sapması %0,68–1,15, sınır %0,5), Orhan Bey Camii gece şebeke ve korkuluk saydamlığında (%0,87) kaldı; Koza Han'ın kutusu 3,6 cm farklı (sınır 1 cm). Sınırlar gevşetilmedi, uzak görünümdeki bu fark bilerek kabul edildi. Ölçümler: her eserin `3d/kontrol/<sürüm>_pisik/rapor.json`. Araç düzeltmesinden önce ölçülen Ulucami yeniden ölçülmedi. İstem: `PISIRME_ISTEMI_DIGER_ESERLER.md`.
- **Canlıya aktarılacak alanlar (Burak):** `mapBaked`, `hideClosedInterior`, `temsili`, yeni açılar.

## Pişirme ölçümü (3 Kasım)

Ulucami, ana dosya `ulu-cami_v32`, 1170×2000 piksel, birleştirme sonrası. Yazılımsal GPU telefon değildir; oranlar yol göstericidir.

| | Mevcut, gölgeli | Pişmiş |
|---|---|---|
| Kare, tek model, yazılımsal GPU | 150 ms | 75 ms |
| Kare, 4 model, yazılımsal GPU | 209 ms | 130 ms |
| Kare, 8 model, Apple M4 | 8,8 ms | 6,2 ms |
| İşlemci, 8 model, M4 | 1,6 ms | 0,4 ms |
| Çizim çağrısı, 8 model | 272 | 16 |
| İlk kare, tek model, yazılımsal GPU | 1300 ms | 280 ms |
| Geometri belleği, model başına | 7 MB | 3 MB |
| Doku belleği, model başına | 10 MB | 23 MB (daha kötü) |
| İndirme, gündüz / gece | 1,72 / 2,44 MB (harita sunum dosyasını indirir) | 0,78 / 0,94 MB |

Denenen alternatifler (Lambert malzeme, tepe noktası rengiyle malzeme birleştirme) yakın sonuç vermedi: kare süresi en iyi 145 ms, çizim çağrısı en az 21.

## Bekleyenler

- **Pişmiş harita modelleri:** yedi eserde açık (`model.json` içinde `"pisik_onay": true`, sonra `prepare-demo-content.mjs`). Canlı API bu alanı (`SiteModel.mapBaked`) henüz taşımıyor: Burak'ın eklemesi gerekir, yoksa canlıda eski yol sürer.
- **Burak / Tamer:**
  - Storage dosyalarına `cache-control: immutable`;
  - canlı içeriğin yeniden aktarımı (`import-demo`);
  - panelde akış ayarları.
- **Gerçek telefonda bakılacaklar:**
  - iOS Safari'de sayfanın yakınlaşmaması;
  - kart sürükleme akıcılığı;
  - gölgenin maliyeti;
  - fotoğraflı pinlerin okunurluğu.
