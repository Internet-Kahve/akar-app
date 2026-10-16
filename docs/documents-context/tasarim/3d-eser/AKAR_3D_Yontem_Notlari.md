# AKAR · 3D Eser Modelleme · Yöntem Notları ve Dersler

Claude Code için. Kaynak: Ayasofya pilotu (12–13 Ekim 2026, ~19 tur) ve Bursa Ulucami (13 Ekim). Kuralların kısa hâli akar-3d-model skill'inde; bu dosya nedenlerini anlatır.
Ayrıntılı ölçü/karar geçmişi: `3d-eser/ayasofya/ayasofya_notlar.md` (§1–§27).

## 1. Ayasofya'nın son durumu (KAPANDI, v19)

- Dosyalar (13 Ekim temizliğinden sonra): `ayasofya_v19.blend`, `ayasofya_notlar.md`, `export/` içindeki iki .glb ve atlas. Ara betikler silindi; tekrar kullanılabilir kod `_kutuphane/akar3d.py` içinde.
    `export/ayasofya_v19_normal.glb` (2K atlas, 1,06 MB), `export/ayasofya_v19_hafif.glb` (1K, 0,58 MB).
- 25 592 üçgen, 23 parça (adlı), 2 malzeme, 29 draw call.
- Redmi 9T (Adreno 610) testi: her ayarda ≈60 FPS (2K, PR 2,75 dahil). %1 yavaş kare 2K'da 47,7.
  Draco + 2K çözme ilk açılışta ≈1 sn; 1K'da 0,1 sn.
- **Bilinen kusurlar (düzeltilmeden kapatıldı):**
  1. Doku bulanık: texel yoğunluğu 3,5 px/m (1 px ≈ 28 cm). Yakın çekimde yumuşak/çamurlu.
  2. Siyah çizgiler: pencere kenarlarında, kasnak–payanda ve kütle birleşimlerinde ince koyu çizgiler.
  3. Küçük yarım kubbelerin (eksedra ve galeri ucu) içi görünüyor; açık kabuk sorunu tam çözülmedi.
  4. Çatı rengi hedeften koyu (#82879D, hedef #8B96B0).
- Kullanım: yöntem pilotu. Demoda ana eser olarak kullanılmayacak.

## 2. Görsel kalite dersleri (en önemlisi)

1. **Renk dokuya pişirilmez.** Tek atlasa "her şeyi" pişirmek mobil boyutta bulanıklık getirir.
   Yeni kural: renk = düz malzeme (palet), keskin kalır. Işık/gölge = ayrı ve düşük çözünürlüklü
   (vertex color AO ya da küçük lightmap, çarpılarak). Doku yalnız gerçekten detay olan yerlere
   (pencere ızgarası, rozet) ve küçük, tekrar eden karolar olarak.
2. **Siyahlıkların kaynağı:** (a) duvarla aynı düzlemde pencere/decal yüzleri (z-fighting),
   (b) atlas dikişlerinde renk sızması, (c) gizli/ters yüzlerin pişirmede siyah çıkması.
   Kural: decal'lar duvardan ≥ 3 cm önde ya da duvara oyulmuş; aynı düzlemde iki yüz yok.
3. **Açık kabuk yasak.** Uygulama yüzleri tek taraflı çizer; açık kubbe/kesik yüz = delik.
   Her kubbe, yarım kubbe ve kesilmiş parça kapalı hacim olarak kurulur (kesmek değil, baştan kapalı üretmek).
4. **Sayıya değil görüntüye güven.** Claude Code "düzeltildi" dediği hâlde kusurlar kaldı.
   Zorunlu kontrol: 8 yönden yörünge render'ı, arka yüzler KIRMIZI boyalı (backface highlight).
   Kırmızı piksel varsa tur bitmemiştir. Rapor bu görüntü olmadan kabul edilmez.
5. Canlı palet haritada işe yarıyor (doygunluk ≈1,6×). Gök ışığı nötr olmalı (lila kayma oldu).

## 3. Süreç dersleri

1. **Görselden kamera çözmek zayıf** (rms 5–20 px, mutlak yükseklik ±10 m oynadı). 4 tur buna gitti.
   **3D referans model (DAE, gerçek ölçek) ile ölçmek** 1 turda daha fazlasını düzeltti.
   Sıra: önce ölçülü kaynak (rölöve, envanter ölçüleri, OSM, 3D model) → görseller yalnız kontrol. Tam öncelik sırası §6.1.
2. **Envanter kitapları ölçü içeriyor** (özellikle Bursa: "5,36 m derinlik, 17,47 m genişlik").
   Yeni eserde ilk iş: kitaptan ölçü tablosu çıkarmak.
3. **Kütleden detaya:** plan → kütleler → kubbe/çatı → cephe detayı. Detaya erken girmek turları uzattı.
4. **Geometri dondurma noktası net olmalı;** dondurduktan sonra çıkan kusurlar ayrı "kusur turu"nda,
   biçim değiştirmeden düzeltilir.
5. **Tek tur = tek konu.** Karışık prompt'lar (oran + cephe + kamera) raporları uzattı.
6. Dosya sürümleri: `build_vNN.py` kodla üretim çok iyi çalıştı (geri dönüş, karşılaştırma kolay).
7. Blender 5.x: Collada (.dae) açılmıyor → trimesh ile .glb'ye çevir. Paket Blender'da Draco yoksa
   gltf-transform ile sıkıştır.
8. Lisans: market/warehouse modelleri yalnız ölçü şablonu; ağ kopyalanmaz. (DAE için sorumluluğu
   tasarım sorumlusu üstlendi, kaynak linki notlara yazılmalı.)

## 4. Teknik hedefler (doğrulandı)

- Bütçe: Normal ≤ 40k üçgen; 25k Redmi'de 60 FPS. Hafif ayrı sadeleştirme gerekmiyor.
- Dosya: ≤ 1 MB hedef. Draco iyi ama 2K dokuyla çözme ≈1 sn; doku küçükse sorun yok.
- Draw call: parça adları (cue) için nesneler ayrı; 29 draw call sorun değil.
- Parça adlandırma: `Kubbe_Ana`, `Kubbe_Yarim_*`, `Kubbe_Kucuk_*`, `Minare_N`, `Payanda_*`, `Turbe_*` …
  Uygulama dokunma/vurgu bu adlara bağlı.
- Palet: Ayasofya paleti Bursa'da kullanılmaz; Bursa paleti `bursa/sablonlar/_ortak_stil.md` ve eser.md "Stil rengi" sütunudur.

## 5. Çalışma sırası ve eser kararları

- Adım adım sıra ve hazır komutlar: `3d-eser/CALISMA_SIRASI.md`.
- Her eserin ölçüleri, kaynak kodları, stil rengi, vurgu ve parça adları: `tasarim/3d-eser/bursa/eserler/<eser>/eser.md`; model kararları (varsa): aynı klasördeki `*_notlar.md`.
- Örnek tamamlanmış eser: `tasarim/3d-eser/bursa/eserler/ulu-cami/`.

## 6. Ulucami dersleri (13 Ekim, v01–v01e2)

Kütle 7 turda oturdu; hedef 2–3 turdu. Kaybın sebepleri ve kurallar:

1. **Kaynak önceliği:** rölöve / ölçülü plan > envanter kitabı > OSM > maket > fotoğraf > yapay zekâ görseli.
   Ödev, blog gibi ikincil metinlerdeki ölçüler en altta. Ulucami'de önce ödevdeki 60 × 48 seçildi, plan 68,7 × 55 çıktı → 3 tur kayıp.
2. **İlk iş: kaynak PDF'lerin içindeki çizimleri ara** (`pdfimages -list`, sayfa sayfa bak). Ulucami'nin ölçülü planı ödevin 6. sayfasındaydı, en son bulundu.
3. **Kaynaklar 2 m'den fazla çelişirse uygulamadan önce sor.**
4. **Yükseklik kaynakta yoksa:** maketten ya da karşıdan çekilmiş fotoğraftan, plandan gelen genişlik ölçek alınarak ölçülür. Plan genişliği değişirse bütün yükseklikler yeniden ölçülür.
5. **Gözle tahmin edilen hedef oran yazma; ölç.** "Kubbe kasnağın 2 katı" tahmini yanlış çıktı; maket ölçümü kubbe ≈ kasnak gösterdi.
6. **Maket oranları abartabilir** (kubbe ve minare kalın). Biçim için maket, ölçü için plan.
7. **Yön karışıklığı:** plan çiziminde kuzeyin yönünü önce yaz (Ulucami planında kuzey aşağıda). Kuzeyden bakınca sol = doğu.
8. **tasarım sorumlusunun göz kontrolü her tur sonunda:** kuzey ortografik render + referans fotoğraf yan yana, havadan render, en sorunlu parçaya yakın render.
9. **P tablosu:** bütün ölçüler betiğin başında tek sözlükte; düzeltmeler oradan.
