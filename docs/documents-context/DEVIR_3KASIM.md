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

## İpucu sıraları (`akar-app.tsx`, «First-time hints»)

Her ipucu bir kez gösterilir; cihazda `akar.ipucu.<id>` olarak saklanır. Bir ipucu açıkken ilk dokunuş yalnız onu kapatır (`swallow`); gösterdiği düğmeye basmak çalışır (`pressSpot`). Hedefi ekranda olmayan ipucu bu sefer atlanır, hedef çıkınca gösterilir (`TipRow`). Hepsinde × var.

| Ekran | Telefon | Masaüstü |
|---|---|---|
| Harita | harita: «Bir esere dokun» | masa.harita: «Bir esere tıkla» |
| Kısa kart | kart: «Yukarı kaydır, eseri aç» (spot) | – |
| Eser sayfası | detay: «Aşağı kaydır» (kart açık, üstü karanlık) → d.parca: parça düğmesi → d.parcaya: «Şimdi bir parçaya dokun» | masa.detay: «Hikâyeyi buradan başlat» → masa.foto: Fotoğraf/3D → masa.parca → masa.parcaya |
| Hikâye | hikaye: «Sağa dokun» (sahte geçiş) → cevir: «Sağa doğru çevir» (3D) ya da yakinlas: «İki parmakla yakınlaştır» (foto) | masa.hikaye: «‹ › ya da ← →» → masa.cevir (3D) |
| Geçmişi Gör | g.foto → g.kiyas → g.bugun → g.serit → g.nereden | aynısı, `masa.` önekiyle |

Testlerin cihazında hepsi görülmüş sayılır (`playwright.config.ts`, storageState); ilk adımların kendi testi `tests/first-steps-mobile.spec.ts`.

## Bekleyenler

- **Pişmiş harita modelleri (Blender):** başka bir yapay zekâya istem verildi. Ulucami gündüz dosyası geldi: `eserler/ulu-cami/3d/export/ulu-cami_v32_harita_pisik.glb`. Betikler `_kutuphane/blend_hat/pisik*.{py,mjs}`; bunlar bu dalda commit'li değil. Gece dosyası ve doğrulama raporu gelince uygulama tarafı yapılacak:
  - `model.json → glb_harita_pisik` / `glb_gece_harita_pisik` alanları demo içeriğe aktarılacak (`services/api/scripts/prepare-demo-content.py`, `apps/web/scripts/prepare-demo-content.mjs`);
  - harita o dosyayı kullanacak, ışık ve gölge kapatılacak (`lib/map-models.ts`);
  - eser sayfası «bir kez çiz» ile kalacak.
- **Burak / Tamer:**
  - Storage dosyalarına `cache-control: immutable`;
  - canlı içeriğin yeniden aktarımı (`import-demo`);
  - panelde akış ayarları.
- **Gerçek telefonda bakılacaklar:**
  - iOS Safari'de sayfanın yakınlaşmaması;
  - kart sürükleme akıcılığı;
  - gölgenin maliyeti;
  - fotoğraflı pinlerin okunurluğu.
