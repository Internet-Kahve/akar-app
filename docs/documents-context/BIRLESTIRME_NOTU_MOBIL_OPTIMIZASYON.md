# Birleştirme notu: `muhammedtalay/mobil-optimizasyon`

4 Kasım 2026. Burak için: dalı `main`'e alırken ve canlıya çıkarken yapılacaklar. Ayrıntılı geçmiş: [DEVIR_3KASIM.md](DEVIR_3KASIM.md).

## Özet

- `main` `4b3ce88` (eksik parça uyarısı) bu dala birleştirildi; `packages/domain/src/index.ts` ve testindeki çakışmalar çözüldü, iki tarafın eklemeleri de duruyor. PR'dan önce `git fetch` ile `main`'e yeniden bak.
- **Veritabanı göçü yok.** Şema bu dalda değişmedi; aşağıdaki canlı alanlar için göç gerekecek.
- **Kırıcı API değişikliği yok.** Web, yeni alanlar gelmezse eski yolda çalışır: harita sunum dosyasını gösterir, iç mekân gizlenmez, «Temsili görsel» etiketi çıkmaz.
- Yeni ortam değişkeni yok.

## Dalın API tarafına dokunduğu yerler

| Dosya | Değişiklik |
|---|---|
| `services/api/src/modules/admin-catalog/sites-schemas.ts`, `docs/api/openapi.json` | Kamera `distance` alt sınırı 0,1'den 0,05'e indi (yakın açılar) |
| `services/api/scripts/prepare-demo-content.py` | `hikaye.md` «Açı» tablosunda uzaklık artık sayı da olabilir (`0.06`) |
| `services/api/scripts/history_extras.py` | Geçmişi Gör çiftine `imagined` (`temsili`) eklendi |
| `services/api/e2e/demo-path.spec.ts` | Uygulamadan kalkan «Yanındayım» düğmesinin testi `test.skip`; API'deki ziyaret doğrulaması duruyor |

## Canlıda görünmesi için API'ye eklenecekler

Bunlar bu dalda **yok**. Demo içerikte (`prepare-demo-content.mjs`) çalışıyorlar, canlı API taşımıyor.

### 1. `SiteModel.mapBaked` (`{ day?, night? }`): hız kazancının asıl kaynağı

- Yedi eserde `3d/model.json`: `pisik_onay: true`, `glb_harita_pisik`, `glb_gece_harita_pisik`.
- `prepare-demo-content.py` bu dosyaları manifeste yazmalı, `import-demo.ts` `nightFile` gibi Storage'a yüklemeli, API ve `packages/api-client/src/http.ts` (`mapSite`) taşımalı.
- Yalnız `pisik_onay` olan eserde açılır. Web tarafı hazır: `mapModelSrc`, `mapCloseSrc` (`packages/domain/src/index.ts`).
- Gelmezse canlıda harita eskisi gibi sunum dosyasını indirir, hız kazancı olmaz.

### 2. `SiteModel.hideClosedInterior` (boolean)

- Kaynak: `model.json` `ic_gizle` (Ulu Cami, Orhan Gazi Türbesi, Bedesten).
- `interiorParts` ile aynı yoldan taşınabilir: `schema/media.ts`, `catalog/schemas.ts`, `catalog/service.ts`, `http.ts`.

### 3. Geçmişi Gör `imagined`

- `history_extras.py` üretiyor, web okuyor (`apps/web/src/lib/history-pair.ts`). `services/api/src` ve `openapi.json` içinde henüz yok.
- Temsili görseller yapay üretimdir, etiket **gösterilmeden yayımlanmamalı**. Alan taşınana kadar 15 temsili görseli canlıya aktarma ya da alanı aktarımla birlikte ekle.

## Birleştirdikten sonra sırayla

1. `npm run check` (Docker açık). Bu dalda API testleri son API değişikliklerinden sonra çalıştırılmadı.
2. `node apps/web/scripts/prepare-demo-content.mjs`: içerik üretilebiliyor mu ve dosya eksik mi?
3. Yukarıdaki üç alan ve gerekiyorsa göç.
4. Canlı içeriği yeniden aktar (`import-demo`). Temsili görseller ve pişmiş dosyalar böyle gelir. **Yeni açılar kendiliğinden gelmez:** aşağıdaki «Açılar ve panel» bölümüne bak.
5. Storage dosyalarına `cache-control: immutable`.
6. Canlıda bak: harita Network sekmesinde `*_harita_pisik.glb` iniyor mu, 17,5 zoomda `*_sunum.glb` geliyor mu, ikisi arasında bina kararıyor mu?

## Açılar ve panel: mutlaka çalışmalı

Panelde açı ayarlama ve kaydetme bu dalın zorunlu şartı. Editör bir açıyı kaydettiyse hikâye açıldığında aynı açı görünmeli ve aktarma onu ezmemeli.

**Bu dalda değişenler**

- Yedi eserde `icerik/hikaye.md` «Açı» tabloları ve `3d/model.json` `foto_acilari` yenilendi. Açılar içeriye ve yakına alındı; uzaklık sayı olabilir, alt sınır 0,05.
- «Açıyı kaydet» artık hemen sunucuya yazar (`saveAngle`, `admin-site-editor.tsx`). Önceden yalnız taslağı değiştiriyor, «kaydedildi» yazıyordu. Bu kayıt taslağın tamamını gönderir, yani o anda bekleyen diğer düzenlemeler de birlikte kaydedilir.
- Hata olursa panelde «Açı kaydedilemedi» yazar ve kayıt tamamlanmamış sayılır.
- Yakın açılar (`distance` < 0,4, hedef parça var) çarpışma denetiminden geçer (`aim`, `model-viewer.tsx`). Önünde duvar olan açıda kamera engelin önüne gelir, gerekirse çevresinde boş görüş arar. Açık iç mekâna ayrı ışık eklendi.

**Aktarma kuralı: yeni açılar canlıya kendiliğinden gelmez**

- §11.70 gereği `import-demo` var olan cümlenin `camera`, `highlights`, `interior`, `showCard` alanlarını **korur**.
- Dosyadaki yeni hikâye açıları için `--replace-story-views` gerekir. Bu seçenek paneldeki kayıtları da ezer. Önce canlıda elle kaydedilmiş açı var mı bakın; varsa korunacakları not alın. Kararı Muhammed ile verin.
- Galeri fotoğrafı açıları (`site_media.camera`) da korunur ve bunun için `--replace-*` seçeneği yok. Yeni `foto_acilari` yalnız açısı boş fotoğraflara gelir; öbürleri için panelden kayıt ya da ek iş gerekir.

**Bilinen risk**

Çarpışma denetimi panelden kaydedilen açıda da çalışır, çünkü dosya ile panel açısını ayırmaz. Kamerayı parça ile arasında bir engel kalacak yere koyan editör, yeniden açınca farklı bir konum görebilir. Bu durum kodu okuyarak bulundu, canlı denenmedi. Görülürse panelden gelen açıda denetimi kapatmak gerekir.

**Elle kabul denemesi (otomatik testi yok)**

Panelden hikâyeye kayıt akışını deneyen bir tarayıcı testi bu dalda yok. Birleştirip yayımladıktan sonra canlı panelde:

1. Bir hikâye cümlesinde açıyı değiştirip «Açıyı ve vurguyu kaydet» de. Genel kaydet ya da yayınla düğmesine basma.
2. Sayfayı yenile; panel aynı açıyı göstermeli.
3. Hikâyeyi başka bir tarayıcıda aç; o cümle aynı açıyla gelmeli.
4. İçten bir açıyı ve engele yakın bir açıyı da dene (yukarıdaki risk).
5. Aktarmayı `--replace-story-views` olmadan yeniden çalıştır; kayıt durmalı.
6. Fotoğraf açısı için de 1–3'ü tekrarla.

Demo içerik modunda (`NEXT_PUBLIC_DEMO_CONTENT`, API yok) panel kayıtları yalnız o tarayıcıda kalır (`panelKey`, `packages/api-client/src/index.ts`).

## İpuçları

- Baştan yazıldı: `components/coach-tip.tsx` (`CoachTip`, `TipRow`, `Spotlight`), sıralar `akar-app.tsx`. Tam liste: DEVIR notu, «İpucu sıraları».
- Telefon ve masaüstü ayrı. Her ipucu cihazda bir kez gösterilir (`akar.ipucu.<id>`), bir ziyarette ekran başına bir tane çıkar.
- Ziyaretçi dokunmadan ipucu geçmez, ipucunu kapatan dokunuş hikâyede cümle atlatmaz.
- Ziyaretçinin zaten yaptığı şey öğretilmez (`doneBy`), kart ya da bulmaca açıkken ipucu çıkmaz, 3D ipuçları model çizilince gelir.
- Yeni ipucu kimliği eklerseniz `playwright.config.ts` içindeki `storageState` listesine de ekleyin, yoksa testler takılır.

## 3D modeller

- Model geometrisine dokunulmadı; sunum ve gece dosyaları aynı. Yeni olan yedi eserin pişmiş harita dosyaları (gündüz ve gece, `*_harita_pisik.glb`) ve pişirme araçları (`eserler/_kutuphane/blend_hat/pisik*`).
- Harita 17,5 zoomda sunum dosyasına geçer, 17'nin altında pişmiş dosyaya döner (`CLOSE_ZOOM`, `map-models.ts`).
- Kapalı iç mekân: `ic_gizle` olan eserde örtü kapalıyken iç parçalar çizilmez (`lib/interior.ts`).
- Yakın zoomdaki kararma giderildi (`e819efb`): pişmiş model gölge çizimi istemez.

## Tanıtım sayfası

- `/tanitim` artık `public/tanitim2/index.html`, tek dosya; TR/EN ve gece teması sayfanın içinde (`akar.dil`, `akar.tema`).
- Giriş: gündüz beyaz, gece siyah zemin; dünya görselleri `medya/dunya-gun.webp`, `dunya-gece.webp`; hareketli şehir madalyonları.
- Bölümler: ekranlar, kaydırmalı Ulucami turu, «İster dinle, ister oku» (canlıdaki kayıtları çalar), eski ve bugün karşılaştırması, «Akar ne demek?».
- Şehirlerin eser sayıları sayfaya elle yazılı (Bursa 9, Konya 1, Hatay 1). İçerik değişirse güncelleyin.
- Ekran görüntüleri (`medya/ekran-*.webp`) elle üretildi; arayüz değişirse eskir.

## Çakışma çıkabilecek yerler

En çok değişen dosyalar:

- `apps/web/src/components/akar-app.tsx`, `story-panel.tsx`, `explore-panel.tsx`, `model-viewer.tsx`, `scene.tsx`
- `apps/web/src/lib/map-models.ts`, `apps/web/src/app/design.css`
- `tests/flows.spec.ts`, `playwright.config.ts`

`design.css` ve `akar-app.tsx` çakışırsa dalın halini esas alın, `main`'deki yeni satırları üzerine ekleyin. İpucu ve kart davranışları bu dosyalara yayılmış durumda.

Silinen web bileşeni: `welcome-card.tsx`. `main`'de ona dokunan yeni iş varsa dikkat.

## Davranış değişiklikleri

- `/tanitim` artık `public/tanitim2/index.html`. Eski sayfa `/tanitim/yeni/`, küre kitaplığı ve model dosyası oradan da kullanılıyor; silme.
- `next.config.ts`: Supabase Storage görselleri `next/image` ile (`qualities: [75]`).
- Karşılama kartı, «Doğrulanmış» rozeti, «Yanındayım», harita çipleri kalktı. Telefonda sekme yok.
- Testlerin cihazında ipuçları görülmüş sayılır (`playwright.config.ts`, `storageState`). Yeni ipucu eklerseniz listeye de ekleyin.
- Panel: demo içerik modunda düzenlemeler tarayıcıda kalır (`packages/api-client/src/index.ts`, `panelKey`). Canlıda API'ye gider.

## Bilerek bırakılanlar

- Yedi pişmiş eserden ölçü sınırlarının tamamını iki temada yalnız Orhan Bey Hamamı geçti; öbürleri Muhammed'in kararıyla açık. Sayılar DEVIR notunda ve her eserin 3D README'sinde.
- `kontrol/` Git'te değil; ölçüm raporları ve karşılaştırma görüntüleri yalnız Muhammed'in Mac'inde.
- Eski GLB sürümleri çalışma ağacından kaldırıldı (`925fee5`). Yalnız `model.json` içinde adı geçenler ve `_sunum` sürümleri kaldı. Canlı Storage'daki eski dosyalara dokunulmadı.
- Birkaç açı (Türbe içi, Bedesten) hâlâ fotoğrafla birebir değil; panelden ayarlanabilir.

## Test durumu

- Tam tarayıcı testi `3bffaf2`'de: 149 geçti, 27 atlandı.
- Birleştirmeden sonra tip kontrolü ve 209 birim testi geçti; önceki commit'lerde tarayıcıda harita, akış, ipucu, şehir menüsü, tanıtım ve hikâye testleri geçti.
- API testleri ve gerçek telefon denemesi yapılmadı.
