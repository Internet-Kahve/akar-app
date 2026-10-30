# Prompt: yedi eserde fotoğraftan renk ve AO pişirme (28 Ekim 2026)

Kullanım: aşağıdaki kod bloğunu 3D üretim ajanına (akar-3d-model) olduğu gibi ver. İş iki aşamalıdır; 1. aşama bitince ajan durur, kullanıcı onaylayınca 2. aşamaya geçer.

## Neden

- 21 Ekim'deki karar (`eserler/_kutuphane/PROMPT_yumusak_palet_ve_pisirme.md`, `_GENEL_SAHNE_STANDARDI.md` §3): bütün modeller pastel, büyük yüzeylerde V ≥ 0,80, AO köşe renginde ve hafif (en koyu ≥ 0,80).
- 28 Ekim'de kullanıcı bu kararı değiştirdi: haritada modeller soluk ve «garip» duruyor. Ulucami'de dron fotoğraflarıyla ölçüldü (`eserler/ulu-cami/3d/kontrol/renk-olcumu_2026-10-28.png`): kurşun doğru, ama kasnak, duvar taşı ve minare tuğlası fotoğraftan çok açık; tuğla fazla turuncu.
- Kararlar (kullanıcı onayladı, 28 Ekim, `docs/documents-context/yaptiklarim-2.md` §37):
  1. Renkler fotoğraftan ölçülür (Mapbox'un «sembolik gerçekçilik» yaklaşımı: tanınır, gerçeğe yakın; modelde ek doygunluk artırımı yok).
  2. Blender'da yalnız AO (glTF `occlusionTexture`) ve yumuşak yer gölgesi pişirilir. Güneşin yönü pişirilmez (ileride gündüz/gece görünümü için web'de kalır).
  3. Web'de gerçek zamanlı gölge ve kenar çizgisi kapanacak; ışık ≈ 1–1,4 aralığına inecek (bu web işi bu prompt'un kapsamında değil).

## Prompt

```
AKAR 3D: yedi uygulama modelinin YENİ SÜRÜMÜNÜ üret. Değişen: malzeme renkleri (fotoğraftan) ve AO (dokuya pişirme) + yer gölgesi düzlemi. Geometri aynı kalır.

ÖNCE OKU
- eserler/_GENEL_SAHNE_STANDARDI.md, eserler/_kutuphane/AKAR_3D_Yontem_Notlari.md, eserler/_kutuphane/BENIOKU.md
- eserler/_kutuphane/PROMPT_yumusak_palet_ve_pisirme.md (21 Ekim'in eski kararı; bu iş onun §1 renk tablosunu ve «V >= 0,80» / «köşe rengi AO >= 0,80» kurallarını GEÇERSİZ kılar)
- her eserin 3d/README.md, 3d/model.json, son build betiği
- docs/documents-context/yaptiklarim-2.md §31 (çalışma kuralları) ve §37
Yollar docs/documents-context/ altına göredir.

KAPSAM (son sürüm → yeni sürüm; eski dosyalar SİLİNMEZ, v1 prototipi eski GLB'leri kullanıyor)
Ulucami v27→v28 · Bedesten v06→v07 · Koza Han v14→v15 · Orhan Bey Camii v07→v08 · Orhan Bey Hamamı v05→v06 · Emir Hanı v05→v06 · Orhan Gazi Türbesi v02→v03
(Başlamadan her eserin export/ klasöründe son sürümü doğrula; farklıysa bir üstünü al ve raporda yaz.)

KURALLAR
- apps/ ve frontend/backend koduna dokunma. test-redmi9t/ (v1) değişmez.
- Uydurma renk yok: her hex bir fotoğraf dosyasına ve piksel bölgesine dayanır (rapor).
- Yapay zekâyla görsel üretme. Arapça yazı üretme.
- Build betiklerinde «kullanıcı kararı» yazan renkler (ör. ulu-cami build_v23 Minare_Kulah bej) fotoğrafla çelişirse DEĞİŞTİRME; raporda listele, kullanıcıya sor.
- Kodda esere özel renk sabiti yazma; renkler veriden (palet dosyası) okunur.
- Blend ve build dosyaları repoya girmez (Drive'da tutulur); git komutu çalıştırma.

========================================
1. AŞAMA: ÖLÇÜM VE RAPOR (sonunda DUR)
========================================
Ulucami ölçüldü ve karara bağlandı; onu yeniden ölçme, aşağıdaki değerleri kullan:
  Kasnak #D2B276 · Duvar taşı (Tas_Orgusu_* dokuları) ortanca #AF9A7D · Minare tuğla (Minare_Tugla_Derzi dokusu) ortanca #8E6A4E · Mermer #E6E2D6 · Kurşun #BCC2C6 (değişmez)
Diğer altı eser için:
a) Fotoğraf bul: eserler/<eser>/icerik/fotograflar.md ve veri/bursa-foto/ (Ticari Yapılar Klasörü: Koza Han, Emir Hanı, Bedesten; Orhan Bey Külliyesi Klasörü: Orhan Bey Camii, hamam orada değilse _manifest.csv'de ara; Türbeler Klasörü: Orhan Gazi Türbesi). Gündüz, dış cephe, güncel (DJI_ / ERD) fotoğraflar; gece, iç mekân, eski siyah-beyaz (Foto Atlas) kullanılmaz. Her eser için en az 3 fotoğraf, mümkünse farklı hava/saat.
b) Ölçüm yöntemi (Ulucami'de kullanılan): her malzeme rolü için fotoğrafta düz, güneşli ya da düz bulutlu bir bölge seç; gölge, ağaç, insan, tabela, pencere, ışık patlaması dışarıda. Bölgenin piksel ORTANCASINI al (ortalama değil). Her bölgeyi kırpıp gözle kontrol et; yanlış yere düşeni at. Aynı rol için 3 fotoğrafın değer aralığını ve ortancasını yaz.
c) Modelin mevcut rengi: GLB'den malzeme baseColorFactor (sRGB'ye çevir) ve dokulu malzemelerde dokunun ortanca rengi × baseColorFactor. Köşe rengi (COLOR_0) varsa onun ortalamasını da çarp (görünen renk).
d) Rapor:
   - eserler/<eser>/3d/kontrol/renk-olcumu_2026-10-28.png: satır = rol; sol fotoğraf örnekleri (hex yazılı), sağ model rengi, en sağda sonuç (aynı / açık / koyu / ton farkı). Ulucami'deki görsel örnek.
   - eserler/_kutuphane/RENK_OLCUM_RAPORU.md: eser başına tablo (rol, malzeme adları, fotoğraf dosyası + bölge, foto aralığı, ortanca, model rengi, önerilen hex), «kullanıcı kararı» çakışmaları, ölçülemeyen roller ve nedeni.
   - eserler/_kutuphane/malzeme-paleti.json ÖNERİSİ: { "rol": { "hex": "#....", "kaynak": ["dosya", ...], "malzemeler": ["Tas", "Kufeki", ...] }, ... } + "eser_istisna": { "<eser>": { "rol": "#...." } } (fotoğrafta belirgin farklı olan eserler için; ör. Koza Han almaşık duvar).
   Ortak rol önerisi: aynı rol eserler arasında ±6 ton/±0,05 açıklık içindeyse tek hex; değilse istisna.
e) DUR. Kullanıcıya özet tablo ve görsellerin yolunu ver; onay ve düzeltmeleri bekle.

========================================
2. AŞAMA: BLENDER (kullanıcı onayından sonra)
========================================
1) PALET VERİDEN
- Onaylanan eserler/_kutuphane/malzeme-paleti.json tek kaynak. Yeni build betikleri (build_vXX.py) rengi buradan okur; betikte hex sabiti kalmaz. _GENEL_SAHNE_STANDARDI.md §3 bu dosyaya yönlendirilir (tablo kopyalanmaz).
- Dokulu malzemeler (Tas_Orgusu_*, Minare_Tugla_Derzi, Duvar_Almasik, Kesme_Tas ...): dokunun desenini koru, yalnız seviyesini ayarla: dokuyu, ortancası hedef hex'e eşit olacak şekilde lineer uzayda çarp/kaydır (doygunluk hedefe göre). Yeni doku dosyası doku_palet_v3/ altına; v2 dokuları silinmez.
- baseColorFactor dokulu malzemede #FFFFFF kalır (renk dokuda).

2) AO: DOKUYA PİŞİR, KÖŞE RENGİNDEN KALDIR
- Köşe rengi AO'su ve yükseklik gradyanı (21 Ekim) KALDIRILIR: COLOR_0 ya hiç yazılmaz ya da tamamen 1,0. (İkisi birden olursa renk iki kez kararır.)
- Her model için ikinci UV: "UV_AO". Bütün yapı parçalarını birlikte seç, UV > Lightmap Pack (Share Texture Space açık, New UV Map, margin 0,02). Parça adları ve geometri değişmez; yalnız UV kanalı eklenir.
- Cycles, bake type Ambient Occlusion, örnek 128+, mesafe (World > AO distance) yapının ölçeğine göre ≈ 1,5–3 m (kemer içi ve kubbe diplerini yakalasın, büyük duvarda leke yapmasın), margin 8 px, denoise. Tek atlas: 1024 px (Ulucami, Koza Han büyükse 2048).
- Kayıt: gri tonlu JPG/WebP (glTF'in desteklediği biçim; kalite 85), dosya export/doku/<eser>_vXX_ao.jpg.
- glTF bağlantısı: her yapı malzemesinde "glTF Material Output" (glTF Settings) düğüm grubunun Occlusion girişine bu doku, UV_AO ile. Dışa aktarılan GLB'de materials[].occlusionTexture.texCoord = 1 olmalı (doğrula). three.js bunu aoMap olarak kendiliğinden okur; aoMap yalnız ortam ışığını kısar (güneşli yüz kararmaz), bu istenen davranış.
- Hedef görünüm: hafif. AO dokusunda en koyu bölgeler ≈ 0,45–0,55, büyük düz yüzeyler ≈ 0,95–1,0. Daha koyuysa mesafeyi düşür.

3) YER GÖLGESİ DÜZLEMİ
- Yeni nesne adı tam olarak "Yer_Golgesi" (web bu adı tanıyıp taban izinden hariç tutacak). Düzlem: yapının taban sınır kutusu + her yönde en çok 5 m, z = +0,02 m.
- Bu düzleme AO pişir (yapı sahnedeyken), sonra RGBA PNG'ye çevir: renk siyah, alfa = (1 − AO) × 0,15 (kullanıcının seçtiği yerdeki gölge koyuluğu 0,1–0,15), kenarlara doğru sıfıra yumuşak geçiş. 512–1024 px.
- Malzeme: KHR_materials_unlit, alpha blend, çift yüz kapalı, gölge atmaz/almaz. Tıklanabilir parça adlarıyla eşleşmez.

4) ÇIKTI
- export/<eser>_vXX.glb (uygulama) ve export/<eser>_vXX_sunum.glb (sunum: mevcut çevre/figürler aynı). Uygulama GLB'sinde çevre ve figür temizliği: GT_DIR=<kurulum> node eserler/_kutuphane/glb_temizle.mjs <glb>. Draco (ulu-cami/3d/build/glb_draco.mjs ya da gltf-transform). Uygulama GLB'si AO dokusu dahil ≤ 1,5 MB.
- Geometri doğrulaması: her mesh için köşe ve üçgen sayısı, sınır kutusu eski sürümle eşit (Yer_Golgesi hariç). Parça adları birebir aynı (hikâye Vurgu adları, model.json ana_parca, örtü grupları).
- kontrol/vXX/: aynı kameradan eski ve yeni render yan yana (havadan.png standardı); ayrıca ışıksız (flat/emission) render ile fotoğraf örneklerinin yan yana karşılaştırması; renkler.json (her malzemenin son hex'i ve kaynağı); kontrol_rapor.json (AO dokusu min/ortanca, occlusionTexture.texCoord, dosya boyutu, geometri eşitliği).
- 3d/README.md sürüm tablosuna satır.

5) UYGULAMAYA BAĞLAMA (en son, her şey doğrulanınca)
- Her eserin 3d/model.json "glb" alanını yeni sürüme çevir (diğer alanlara dokunma).
- python3 docs/documents-context/design/harita/modelleri-gom.py çalıştır (harita önizlemesi akar-harita-onizleme-v2.html yeni modelleri okusun).
- Not: test-redmi9t-v2 prototipi de model.json'dan okuduğu için yeni modellere geçer; onun ışığı henüz eski (yüksek). Bu beklenen; web ışığını ayrı oturum ayarlayacak.

KABUL ÖLÇÜTLERİ (raporda sayıyla)
a) Her malzeme rengi malzeme-paleti.json'daki hex'e eşit (dokulularda doku ortancası ±3 ton).
b) Köşe rengi yok ya da 1,0.
c) Her GLB'de occlusionTexture.texCoord = 1, AO dokusu gömülü; Yer_Golgesi unlit + blend.
d) Geometri ve parça adları eski sürümle eşit.
e) Ulucami: kasnak, duvar, minare tuğlası ölçülen fotoğraf aralığında.
f) Dosya boyutları ≤ 1,5 MB (uygulama).
Sonunda her eser için önce/sonra tablo: kurşun, taş, tuğla hex; AO min/ortanca; GLB boyutu.
Sonra docs/documents-context/yaptiklarim-2.md dosyasının en altına yeni madde ekle (numarayı dosyadaki son maddeye göre ver).
```

## Bu prompt'tan sonra (web tarafı, ayrı oturum)

- `akar-harita-onizleme-v2.html`: «Yer_Golgesi» nesnesini taban izinden (`kutu`) hariç tut; gerçek zamanlı gölge ve kenar çizgisi varsayılan kapalı; ışığı yeni renklere göre panelden ayarla (başlangıç: ortam 1,0 · güneş 1,0 · karşı 0,35; hedef güneşli duvar ≈ 1,4, gölgeli ≈ 1,0); kurşun için hafif ortam yansıması (environment map).
- Seçilen ışık değerlerini test-redmi9t-v2'ye veri olarak taşı.
