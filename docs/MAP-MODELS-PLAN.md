# Haritada 3B modeller: plan

Tarih: 24 Eki 2026, ekip görüşleriyle güncellendi 28 Eki 2026. Durum: **onaylandı, uygulanıyor** (karar: [§11.35](BACKEND-DECISIONS.md)). Ekip yorumları: Muhammed Talay (Redmi 9T prototipi, `docs/documents-context/design/test-redmi9t/`), Tamer Akdeniz (API sözleşmesi ve üçgen sayımı).

## Amaç

Yönetim panelinden bir eserin GLB modeli yüklenir, haritadaki yeri ve duruşu (konum, yön, ölçek, yükseklik) ayarlanır, kaydedilir. Kod değişikliği ya da yeniden dağıtım olmadan bütün ziyaretçilerin 3B haritasında görünür. Modelin altında kalan OSM binaları çizilmez; otomatik kural yanılırsa editör panelden düzeltir.

## Bugün olan

| Konu             | Durum                                                                                                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GLB yükleme      | Var: editör ve yönetici, imzalı yükleme, 5 MiB sınırı, ilk bayt denetimi (`services/api/src/modules/media/magic.ts`). Panelde eser düzenleyicide `.glb` seçimi var.     |
| Model ve eser    | Her eserin tek modeli var (§11.2). Model yalnız hikâye ekranında açılıyor (`apps/web/src/components/model-viewer.tsx`, three.js + Draco).                               |
| Harita           | MapLibre; eğik görünüm ve OSM binalarının düz 3B blokları (`apps/web/public/harita/akar-style.json`, `building_3d`). Eserler HTML işaretçisi. Haritada GLB yok.         |
| Harita ayarları  | `modelMinZoom` (16) ve `maxVisibleModels` (5) veritabanında, yönetici değiştirir (§11.4, `GET /v1/map-settings`). Web ve `@akar/api-client` bu ayarları henüz okumuyor. |
| Yerleşim bilgisi | Yok: modelin haritadaki konumu, yönü, ölçeği, yüksekliği tutulmuyor.                                                                                                    |
| Model sınırı     | Yalnız dosya boyutu; üçgen sınırı yok (§11.34, bu planla değişir).                                                                                                      |
| Prototip         | Talay'ın prototipi (22 Eki) yedi modeli haritada gösteriyor, OSM binalarını kendi katmanında çiziyor; panel yok, yerleşim kodda elle yazılı.                            |

## Kapsam kararları

1. **Haritadaki her model bir esere aittir.** Katalogda karşılığı olmayan serbest model yok. Modele dokunan ziyaretçi o eserin kartını açar; yayın akışı eserin kendi akışıdır.
2. **Eser başına tek model (§11.2) korunur.** Hikâye ekranındaki model ile haritadaki model aynı dosyadır.
3. **Yetki bugünkü içerik kuralını izler:** model yükleme ve yerleştirme editör ve yönetici; harita ayarları yalnız yönetici.
4. **Güncelleme dakikalar içinde:** anlık bildirim yok. İstemci açılışta, 5 dakikada bir ve sekme yeniden öne geldiğinde katalogu yeniden okur (değişiklik yoksa 304).
5. **İşaretçi kalır.** Modele dokunmak da işaretçiye dokunmak gibi eserin kartını açar.
6. **OSM'de eksik binalar** (eski çarşıda çizilmemiş bloklar) başka kaynaktan doldurulmaz; harita OSM'de ne varsa onu çizer.

## Sınırlar

| Sınır                                 | Değer                                              | Nerede                                           |
| ------------------------------------- | -------------------------------------------------- | ------------------------------------------------ |
| Dosya boyutu                          | 5 MiB (bugünkü)                                    | `complete`                                       |
| Üçgen sayısı                          | **139.152** = bugün elimizdeki en ağır model × 1,5 | `complete`; aşan dosya Türkçe mesajla reddedilir |
| Aynı anda haritada model              | `maxVisibleModels` (5), yönetici değiştirir        | istemci                                          |
| Modelin yüklenmeye başladığı yakınlık | `modelMinZoom` (16), yönetici değiştirir           | istemci                                          |

En ağır model ölçümü (24 Eki, `docs/documents-context/eserler/*/3d/export/`, Draco): `ulu-cami_v26_sunum.glb` 92.768 üçgen.

**Üçgen sayımı** (GLB'nin JSON bölümünden; Draco'lu dosyada da sayılar orada durur): sahnedeki her düğümün kullandığı ağın her çizim parçası, düğüm tekrarları dahil. Parçanın eleman sayısı N, `indices` varsa onun `count`'u, yoksa `POSITION` accessor'ının `count`'u:

| `mode`                     | Üçgen                    |
| -------------------------- | ------------------------ |
| 4 `TRIANGLES` (varsayılan) | N / 3 (aşağı yuvarlanır) |
| 5 `TRIANGLE_STRIP`         | max(N − 2, 0)            |
| 6 `TRIANGLE_FAN`           | max(N − 2, 0)            |
| 0–3 nokta ve çizgi         | 0                        |

Tanımsız `mode` değeri ya da eksik accessor dosyayı reddettirir. Kaynak: [glTF 2.0, Meshes](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#meshes).

Draw call ve doku boyutu için sınır konmaz.

## Veri ve API (backend)

**Migration `0014`:**

- `media.triangles` (integer, model için dolu). Mevcut modeller için tek seferlik doldurma betiği (dosya okunur, sayılır).
- `site_map_placements`: eser başına bir satır.
  - `site_id` (birincil anahtar, eser silinince silinir)
  - `location` (nokta; boşsa eserin konumu)
  - `heading_deg` (0–360, kuzeyden saat yönünde)
  - `scale` (0,1–10, varsayılan 1)
  - `altitude_m` (−50–200, varsayılan 0)
  - `anchor_node` (metin, boş olabilir): modelin "ana parçası"; taban noktası bu parçadan hesaplanır (aşağıda)
  - `hidden_points` (jsonb, varsayılan `[]`): elle gizlenen OSM binaları, `[{ lng, lat }]`, en çok 50
  - `kept_points` (jsonb, varsayılan `[]`): otomatik gizlenip geri istenen binalar, aynı biçim, en çok 50
  - `visible` (haritada göster), `updated_by`, `updated_at`

**Okuma (herkese açık):** yeni uç yok. `SiteDetail.model` (`/v1/site-details`, `/v1/sites/:id`) iki alan kazanır: `triangles` ve `placement` (`{ lng, lat, headingDeg, scale, altitudeM, anchorNode, hiddenPoints, keptPoints }`). `placement` yalnız eser yayındayken, modeli varken ve `visible` açıkken döner. Bu okumalar zaten `public, no-cache` (§11.24).

**Okuma (panel):** yönetici detayı (`/v1/admin/sites/:id`, `/v1/admin/site-details`) kayıtlı yerleşimi **her durumda** `visible` ile birlikte döner. Böylece "gizle → paneli yeniden aç → yerleşimi koruyarak tekrar göster" akışı çalışır.

**Yazma (panel, editör):**

- `PUT /v1/admin/sites/:id/map-placement`: bütün alanlar birlikte. Audit (`site.map-placement`), `Idempotency-Key`.
- Konum, eserin şehri dışındaysa 400. Modeli olmayan esere yerleşim 409. Gizle/geri al noktaları da eserin şehri içinde olmalı.
- Yerleşim eserin model kaydından ayrı durur: model değiştirildiğinde yerleşim korunur.

**Yükleme:** `complete` GLB'nin JSON bölümünü okur (`media/glb.ts`), üçgeni yukarıdaki tabloya göre sayar, sınırı aşarsa reddeder ve `media.triangles` yazar.

## İstemci (`@akar/api-client`, `@akar/domain`)

- `SiteModel` tipine `triangles` ve `placement`. Demo (mock) istemci aynı alanları üretir.
- `GET /v1/map-settings` okunur ve web'e verilir.
- Yerleşim kaydı için yeni komut (`dispatch`).
- Katalog 5 dakikada bir ve sekme yeniden öne geldiğinde yeniden okunur.

## Web (harita ve panel)

**Modelin taban noktası (kodla hesaplanır, panel ve harita aynı fonksiyonu kullanır):**

- Sunum parçaları (`Zemin*`, `Cevre*`, `Olcek*`, `Avlu_Agac`, `Avlu_Cim`) hesaba katılmaz.
- `anchor_node` doluysa ve modelde o adda parça varsa yatay merkez o parçanın sınır kutusundan, yoksa kalan parçaların kutusundan alınır. Avlu, yan yapı ve şadırvanlar merkezi kaydırmaz.
- Yükseklik: modelin en alt noktası zemine (y = 0) oturur; `altitude_m` buna eklenir.

**Harita katmanı:**

- MapLibre özel katmanı (`CustomLayerInterface`) içinde three.js, haritayla aynı WebGL bağlamı. Model `MercatorCoordinate.fromLngLat` ile konuma, `meterInMercatorCoordinateUnits` ile metre ölçeğine oturtulur.
- Yükleyici hikâye ekranındakiyle aynı: `GLTFLoader` + `DRACOLoader` (`/draco/`).
- Yalnız `modelMinZoom` ve üstünde, ekran merkezine en yakın `maxVisibleModels` model yüklenir; görünümden çıkan model bellekten atılır.
- Modele dokunmak eserin kartını açar.

**OSM binaları (prototipteki çözüm):** harita karoları bu bölgede binaları birleşik gruplar (MultiPolygon) hâlinde verir ve kalıcı kimlik taşımaz; stilin `building_3d` katmanında tek binayı süzgeçle gizlemek mümkün değildir.

- Stilin `building_3d` katmanı kapatılır. Yüklenen karolardaki binalar (`querySourceFeatures`) tek tek çokgenlere ayrılır, karo sınırında iki kez gelenler ayıklanır, kendi `fill-extrusion` katmanımızda aynı renk ve yükseklikle çizilir.
- **Otomatik kural:** ortası (köşelerin ortalaması) bir modelin taban izine (yön ile döndürülmüş sınır kutusu + 3 m pay) düşen ve alanı taban izinin 1,6 katından küçük bina çizilmez. Büyük çarşı çatıları kalır.
- **Elle düzeltme:** `hidden_points` noktalarından birini içeren bina gizlenir; `kept_points` noktalarından birini içeren bina otomatik kurala rağmen çizilir. Karo sınırında ikiye bölünen binada nokta yalnız bir parçayı tutar; panel önizlemesinde görülür, gerekirse ikinci nokta eklenir.

**Panel:** eser düzenleyicide "Haritada göster" bölümü, kaydetmeden önce haritada canlı önizleme:

1. **OSM binasına oturt:** editör eserin OSM binasına tıklar; model o binanın ortasına oturur, yönü binanın uzun kenarına göre ayarlanır.
2. **Sürükle:** modelin ortasındaki tutamaçla konum düzeltilir.
3. **90° döndür:** her tıklamada `heading_deg` + 90 (OSM yönü 90°'ye indirgendiği için doğru yön dört seçenekten biridir).
4. **İnce ayar:** yön kaydırıcısı, ok tuşlarıyla 0,5 m adım, yükseklik sayı alanı.
5. **Ana parça:** modeldeki parça adlarını listeleyen açılır liste (`anchor_node`).
6. **Uydu altlığı:** harita uyduya çevrilir, model yarı saydam olur; OSM çokgeni yanlış binadaysa doğru yer buradan ölçülür.
7. **Binalar:** binaya tıklayınca "Gizle / Geri göster"; kaydedilince gizlenecek binalar kırmızı yarı saydam görünür.
8. **Gelişmiş:** ölçek (varsayılan 1, kilitli), görünürlük.

Üçgen sayısı model satırında gösterilir.

## 3B ekibi için dışa aktarma kuralı

Tek kural: **1 birim = 1 metre.** Başlangıç noktası ve zemin kodla hesaplandığı için dışa aktarmada şart değildir. Ana gövde parçasının adı tutarlı olursa (`Govde`, `Govde_Dis` …) panelde seçmek kolaylaşır.

## Başlangıç verisi

Prototipteki yerleşimler (OSM ve uyduya göre düzeltilmiş konum ve yön, `hazirla.py` `OSM_DUZELTME`) ve ana parçalar (`app.js` `ANA_PARCA`: Ulucami ve Bedesten `Govde`, Koza Han `Govde_Dis`, Orhan Bey `Cami_Govde`, Emir Hanı `Emir_Hani`, Orhan Gazi Türbesi `Govde`) canlıya panelden girilir.

## Uygulama sırası

1. API: migration `0014`, üçgen sayımı ve sınırı, yerleşim ucu, `SiteDetail` ve yönetici detayı alanları, OpenAPI, karar kaydı. Migration canlı veritabanına PR birleştirilmeden önce uygulanır.
2. Web A: `@akar/api-client` + `@akar/domain` (tipler, harita ayarları, yenileme), taban noktası fonksiyonu, harita model katmanı, OSM bina katmanı ve gizleme kuralı.
3. Web B: panel yerleşim bölümü (yerleşim komutu dahil).
4. Başlangıç verisinin panelden girilmesi, telefonda uçtan uca deneme.

## Kapsam dışı

Katalog dışı serbest modeller, eser başına birden çok model, ayarlanabilir rol yetkileri, draw call ve doku sınırı, anlık bildirim, ayrıntı düzeyi (LOD) sürümleri, OSM dışı bina kaynakları, cihazda performans ölçümü (sorun görülürse ele alınır).
