# Haritada 3B modeller: plan (taslak, ekip görüşüne açık)

Tarih: 24 Eki 2026. Durum: **öneri**. Ekip üzerinde anlaştığında uygulamaya geçilir; kararlar o zaman [backend karar kaydına](BACKEND-DECISIONS.md) işlenir.

## Amaç

Yönetim panelinden bir eserin GLB modeli yüklenir, haritadaki yeri ve duruşu (konum, yön, ölçek, yükseklik) ayarlanır, kaydedilir. Kod değişikliği ya da yeniden dağıtım olmadan bütün ziyaretçilerin 3B haritasında görünür. Sınırlar telefonları ve depolamayı korur.

## Bugün olan

| Konu             | Durum                                                                                                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GLB yükleme      | Var: editör ve yönetici, imzalı yükleme, 5 MiB sınırı, ilk bayt denetimi (`services/api/src/modules/media/magic.ts`). Panelde eser düzenleyicide `.glb` seçimi var.     |
| Model ve eser    | Her eserin tek modeli var (§11.2). Model yalnız hikâye ekranında açılıyor (`apps/web/src/components/model-viewer.tsx`, three.js + Draco).                               |
| Harita           | MapLibre; eğik görünüm ve OSM binalarının düz 3B blokları (`apps/web/public/harita/akar-style.json`, `building_3d`). Eserler HTML işaretçisi. Haritada GLB yok.         |
| Harita ayarları  | `modelMinZoom` (16) ve `maxVisibleModels` (5) veritabanında, yönetici değiştirir (§11.4, `GET /v1/map-settings`). Web ve `@akar/api-client` bu ayarları henüz okumuyor. |
| Yerleşim bilgisi | Yok: modelin haritadaki konumu, yönü, ölçeği, yüksekliği tutulmuyor.                                                                                                    |
| Model sınırı     | Yalnız dosya boyutu; üçgen sınırı yok (§11.34).                                                                                                                         |

## Kapsam kararları

1. **Haritadaki her model bir esere aittir.** Katalogda karşılığı olmayan serbest model yok. Modele dokunan ziyaretçi o eserin kartını ve hikâyesini açar; yayın akışı eserin kendi akışıdır. Eser kaydı olmayan bir yapı için önce panelden eser oluşturulur (panelde zaten var).
2. **Eser başına tek model (§11.2) korunur.** Hikâye ekranındaki model ile haritadaki model aynı dosyadır; ayrı "hafif" sürüm yok.
3. **Yetki bugünkü içerik kuralını izler:** model yükleme ve yerleştirme editör ve yönetici; harita ayarları yalnız yönetici. Rol planı ekipte henüz konuşulmadı; değişirse API'de tek satır (`requireRole`) değişir. Ayarlanabilir yetki tablosu bu işin kapsamında değil.
4. **Güncelleme anlık değil, dakikalar içinde:** sunucudan anlık bildirim (websocket) yok; API Vercel'de sunucusuz çalışıyor. İstemci açılışta ve aralıklarla yeniden okur (aşağıda).

## Sınırlar

| Sınır                                 | Değer                                              | Nerede                                           |
| ------------------------------------- | -------------------------------------------------- | ------------------------------------------------ |
| Dosya boyutu                          | 5 MiB (bugünkü)                                    | `complete`                                       |
| Üçgen sayısı                          | **139.152** = bugün elimizdeki en ağır model × 1,5 | `complete`; aşan dosya Türkçe mesajla reddedilir |
| Aynı anda haritada model              | `maxVisibleModels` (5), yönetici değiştirir        | istemci                                          |
| Modelin yüklenmeye başladığı yakınlık | `modelMinZoom` (16), yönetici değiştirir           | istemci                                          |

En ağır model ölçümü (24 Eki, `docs/documents-context/eserler/*/3d/export/`, Draco): `ulu-cami_v26_sunum.glb` 92.768 üçgen. Diğerleri 8.282–46.292 üçgen, 0,13–0,81 MB. Sayım: her düğümün kullandığı ağdaki üçgen çizim parçalarının `indices` sayısı / 3 (dizin yoksa `POSITION` / 3), düğüm tekrarları dahil. Draco'lu dosyada da bu sayılar GLB'nin JSON bölümünde durur, dosyanın tamamını indirmeye gerek yoktur.

Draw call, doku boyutu ve ekranda toplam üçgen bütçesi için sınır konmaz. Cihaz testinde (Redmi 9T) sorun görülürse yeniden ele alınır.

## Veri ve API (backend)

**Migration `0014`:**

- `media.triangles` (integer, model için dolu). Mevcut modeller için tek seferlik doldurma (bayt okunur, sayılır).
- `site_map_placements`: eser başına bir satır. `site_id` (birincil anahtar, eser silinince silinir), `location` (boşsa eserin konumu), `heading_deg` (0–360, kuzeyden saat yönünde), `scale` (0,1–10), `altitude_m` (−50–200), `visible` (haritada göster), `updated_by`, `updated_at`.

**Okuma (herkese açık):** yeni uç yok. `SiteDetail.model` (`/v1/site-details`, `/v1/sites/:id`) iki alan kazanır: `triangles` ve `placement` (`{ lng, lat, headingDeg, scale, altitudeM }`; haritada gösterilmiyorsa yok). Model haritada yalnız eser yayındaysa, modeli varsa ve `visible` açıksa görünür. Bu okumalar zaten `public, no-cache` (§11.24); değişiklik yoksa 304 ve boş gövde döner.

**Yazma (panel, editör):**

- `PUT /v1/admin/sites/:id/map-placement`: konum, yön, ölçek, yükseklik, görünürlük. Audit (`site.map-placement`), `Idempotency-Key`.
- Konum, eserin şehri dışındaysa 400. Modeli olmayan esere yerleşim 409.
- Yerleşim eserin model kaydından ayrı durur: model değiştirildiğinde yerleşim korunur.

**Yükleme:** `complete` GLB'nin JSON bölümünü okur (bugünkü parça çıkarma kodu `media/glb.ts` aynı okuyucuyu kullanıyor), üçgeni sayar, sınırı aşarsa reddeder ve `media.triangles` yazar.

## İstemci (`@akar/api-client`, `@akar/domain`)

- `SiteModel` tipine `triangles` ve `placement`. Demo (mock) istemci aynı alanları üretir.
- `GET /v1/map-settings` okunur ve web'e verilir.
- Yerleşim kaydı için yeni komut (`dispatch`).
- Katalog her 5 dakikada bir ve sekme yeniden öne geldiğinde yeniden okunur. Değişiklik yoksa üç istek de 304 döner.

## Web (harita ve panel)

**Harita katmanı:**

- MapLibre özel katmanı (`CustomLayerInterface`) içinde tek bir three.js sahnesi, haritayla aynı WebGL bağlamı. Model `MercatorCoordinate.fromLngLat` ile konuma, `meterInMercatorCoordinateUnits` ile metre ölçeğine oturtulur.
- Yükleyici hikâye ekranındakiyle aynı: `GLTFLoader` + `DRACOLoader` (`/draco/`).
- Yalnız `modelMinZoom` ve üstünde, ekran merkezine en yakın `maxVisibleModels` model yüklenir; görünümden çıkan model bellekten atılır.
- Modelin altındaki OSM bina bloğu gizlenir, yoksa ikisi iç içe çizilir.
- Modele dokunmak eserin kartını açar (işaretçiyle aynı davranış).

**Panel:** eser düzenleyicide "Haritada göster" bölümü. Haritada sürüklenebilir konum, yön ve ölçek kaydırıcıları, yükseklik alanı, kaydetmeden önce haritada canlı önizleme. Üçgen sayısı model satırında gösterilir.

## 3B ekibi için dışa aktarma kuralı

Haritada doğru oturması için her GLB:

- 1 birim = 1 metre,
- başlangıç noktası yapının taban ortası, zemin y = 0,
- ön cephe veya ana eksen −Z yönünde (yerleşimde `heading_deg` bunu çevirir).

Bugünkü dosyalar bu kurala uyuyor mu, yerleştirmeden önce bakılmalı; uymayanlar için ölçek ve yükseklik alanları düzeltme payı verir.

## Ekibe sorular

1. **OSM bina bloğunu gizleme:** panelde binaya tıklayıp kimliğini yerleşime kaydetmek mi, model çevresinde bir yarıçap mı? Bina kimliklerinin harita karolarında kalıcı olup olmadığına bakılmalı (web).
2. **Haritada hangi dosya:** normal mi, `_sunum` mu? Bugün eserin tek modeli var; hangisi yüklenirse o çizilir.
3. **Dokunma:** modele dokunmak yeterli mi, işaretçi de kalsın mı?
4. **Panel ekranını kim yapar:** harita katmanı web tarafının; panel bölümü web ya da backend tarafında yapılabilir.
5. **Yenileme aralığı:** 5 dakika uygun mu?

## Uygulama sırası (plan onaylanınca)

1. API: migration `0014`, üçgen sayımı ve sınırı, yerleşim ucu, `SiteDetail` alanları, OpenAPI, karar kaydı. Canlı veritabanına migration'ı canlı sistem sahibi uygular.
2. `@akar/api-client` + `@akar/domain`: tipler, yerleşim komutu, harita ayarları, yenileme.
3. Web: harita katmanı.
4. Web: panel yerleşim bölümü.
5. Cihaz testi (Redmi 9T): yedi eser, `maxVisibleModels` 5.

## Kapsam dışı

Katalog dışı serbest modeller, eser başına birden çok model, ayarlanabilir rol yetkileri, draw call ve doku sınırı, anlık bildirim, ayrıntı düzeyi (LOD) sürümleri.
