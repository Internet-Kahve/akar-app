# AKAR · 3D Eser Modelleme · Yöntem Notları ve Dersler

Kaynak: Ayasofya pilotu (12–13 Ekim 2026, v01–v19, ~19 tur). Bir sonraki eser bu notla başlar.
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
   Sıra: önce ölçülü kaynak (rölöve, envanter ölçüleri, OSM, 3D model) → görseller yalnız kontrol.
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
   Muhammed üstlendi, kaynak linki notlara yazılmalı.)

## 4. Teknik hedefler (doğrulandı)

- Bütçe: Normal ≤ 40k üçgen; 25k Redmi'de 60 FPS. Hafif ayrı sadeleştirme gerekmiyor.
- Dosya: ≤ 1 MB hedef. Draco iyi ama 2K dokuyla çözme ≈1 sn; doku küçükse sorun yok.
- Draw call: parça adları (cue) için nesneler ayrı; 29 draw call sorun değil.
- Parça adlandırma: `Kubbe_Ana`, `Kubbe_Yarim_*`, `Kubbe_Kucuk_*`, `Minare_N`, `Payanda_*`, `Turbe_*` …
  Uygulama dokunma/vurgu bu adlara bağlı.
- Palet (canlı): kubbe/çatı #8B96B0 · duvar #E3B09B · pencere #88B4DE · tuğla #D97E51 ·
  taş #D6CCBC · minare taşı #E6D6BE · alem #DCA320.

## 5. Yeni eser için başlangıç kontrol listesi

1. Eseri envanterden seç; kitaptaki tarif + ölçüleri tabloya dök (`_cikti/metin/*.txt`).
2. OSM ayak izi + varsa 3D model / rölöve topla. Görseller: kitap fotoğrafları (yalnız referans).
3. Parça listesi ve adları → onay.
4. Kütle turu (kapalı hacimler) → oran kontrolü (ölçülü kaynakla) → detay turu.
5. Her turda: arka yüz kontrol render'ı + üçgen sayısı + kısa rapor.
6. Renk: düz palet malzemeleri + hafif AO. Atlas yalnız detay için.
7. Dışa aktar → test sayfası (Redmi) → kabul.

## 6. Sıradaki: Bursa (13 Ekim)

- Eserler: **Ulucami** (hayrat, ana) + **Bedesten** (akar, Ulucami'ye gelir sağlar), sonra Koza Hanı. Aday tablosu: `veri/bursa/bursa_3d_adaylari.md`.
- Klasör: `3d-eser/bursa/<eser>/`, referanslar `3d-eser/bursa/ref/` + `links.md` (her model için kaynak linki ve lisans notu).
- Başlarken: `_kutuphane/akar3d.py` (palet, kapalı hacimler, pencere, minare, `kontrol_hepsi`, `ao_vertex`, `disa_aktar`). Her tur `kontrol_hepsi` raporu ve arka yüz render'ı olmadan kabul edilmez.
- Parça adları uygulamada vurgu listesi olur: panel bunları .glb'den okur. Örnek: `Kubbeler_20`, `Sadirvan_Kubbe`, `Minare_1`, `Minare_2`, `Ana_Kapi`, `Mihrap_Duvari`, `Son_Cemaat`.
- Ulucami için kitapta ölçü az (3 geçiş): OSM ayak izi + 3D referans model gerekli. Orijinal fotoğraflar Vakıf Katılım'dan istenecek.
