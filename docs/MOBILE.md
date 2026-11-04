# AKAR mobil

Mevcut Next.js arayüzü Capacitor 8 ile iOS ve Android içine statik olarak paketlenir. `server.url`, uzak sayfa yükleme veya ayrı bir React Native arayüzü kullanılmaz. Harita tile'ları, canlı katalog, medya ve hesap işlemleri internet gerektirir; tam çevrimdışı kullanım desteklenmez.

## 1.1.0 · derleme 2

4 Kasım 2026 tarihli mobil güncelleme, `origin/main` üzerindeki `c3382c0` sürümünü içerir: daha hafif harita/3D çizimi, hazır ışıklandırmalı harita modelleri, telefon kartları ve hikâye akışları, erişilebilirlik ayarları ve güncel içerik desteği. Android `versionCode` ve iOS `CURRENT_PROJECT_VERSION` 2, iki platformun görünen sürümü 1.1.0'dır. Uygulama kimliği ve Android debug imzası korunduğundan önceki telefon kurulumu veri silmeden güncellenebilir.

Mobil paket Next sunucusu çalıştırmadığı için katalog fotoğrafları `https://akar.tamerakdeniz.com/_next/image` üzerinden küçültülür; yerel blob/data görselleri bu sunucuya gönderilmez. Harita fotoğraf pinleri, canvas için gereken pikselleri Capacitor HTTP ile küçük görseller olarak okur. Bu kullanım tüm ağ isteklerini değiştirmez. Diğer API çağrıları mevcut CORS ve kimlik doğrulama yolunu kullanır. Haritaya geri dönüş mobilde tanıtım sayfasına yönlendirmez ve sayfayı yeniden yüklemez.

## Yapı ve kurulum

- `apps/web`: ortak arayüz ve cihaz köprüleri.
- `apps/mobile`: Capacitor ayarı, Xcode/SPM ve Android/Gradle projeleri.
- İlk uygulama kimliği: `com.tamerakdeniz.akar`. Mağaza kaydı açılmadan önce sahiplik/ekip ve kalıcı kimlik birlikte kesinleştirilmeli.
- Asgari proje hedefleri iOS 15 ve Android API 24; derleme hedefi Android API 36. Bu alt sınırlar gerçek cihazlarda doğrulanmış destek beyanı değildir.
- Node 24, Xcode 26+, Android Studio/SDK 36, JDK 21 gerekir. Sürümler kilit dosyasından kurulur: `npm ci`.

Canlı sürüm:

```sh
cp apps/web/.env.mobile.example apps/web/.env.mobile.local
# Canlı web ile aynı PUBLIC Supabase URL ve anon/publishable anahtarını doldur.
npm run mobile:sync
npm run mobile:ios
npm run mobile:android
```

`.env.mobile.local` Git dışında kalır. Değerler derleme sırasında pakete gömülür; service-role veya sunucu sırrı kullanılmaz. Eksik ayarlar ve HTTP adresleri derlemeyi durdurur. Build çıktısı `apps/web/.next-mobile`; Next ara dosyaları `.next` içinde olduğundan normal web build ile aynı anda çalıştırma. `public/icerik` yerel içerik bağlantısı varsa paketlemeyi durdurur.

İzole örnek verilerle cihaz denemesi:

```sh
npm run mobile:build:demo
npm run sync -w @akar/mobile
```

Bu mod gerçek hesaba bağlanmaz. `mobile:test` de bu modu kullanır ve çıktı paketini değiştirir; canlı kurulumdan önce tekrar `mobile:sync` çalıştır.

## Canlı API bağlantısı

API'de `MOBILE_CLIENTS_ENABLED=1` ayarı, mevcut `CORS_ORIGINS` değerlerini koruyarak **iki tam origin** ekler:

```text
capacitor://localhost,https://localhost
```

İlki iOS, ikincisi Android içindir. `services/api/src/config.ts` yalnız `capacitor://localhost` özel şemasını kabul eder; wildcard veya keyfî custom origin kabul etmez. Kod düzeltmesi ve ortam ayarı API dağıtımında birlikte uygulanmalıdır. Mevcut web origin'lerini silme. Bayrak varsayılan olarak kapalıdır; geri okunamayan mevcut listeyi değiştirmeden açılabilir. Bu değişiklik istemciye yetki vermez; API'nin mevcut token/rol kontrolleri geçerlidir.

4 Kasım 2026'da kullanıcı onayıyla Production ortamına `MOBILE_CLIENTS_ENABLED=1` eklendi ve [PR #98](https://github.com/Internet-Kahve/akar-app/pull/98) yayımlandı (`9e2187b`). Canlı `https://akar-api.vercel.app` üzerinde mevcut web origin'i `https://akar.tamerakdeniz.com` ve iki mobil origin için `/ready`, `/v1/sites` GET istekleri 200, `/v1/me/saved/x` PUT ön uçuşu 204 ve doğru `Access-Control-Allow-Origin` ile doğrulandı. Liste dışı `https://untrusted.invalid` için CORS izni dönmedi. Bu kontrol kimlik doğrulanmış PUT işlemi yapmaz; gerçek OTP oturum testi cihaz kabulünün parçasıdır.

## Cihaz davranışı

- Mobil paket doğrudan uygulamayı açar; web sürümünün tanıtım sayfasına yönlendirmesi korunur.
- Konum, cihazda Capacitor Geolocation ile; tarayıcıda mevcut geolocation API ile istenir. İzin yalnız kullanıcı konum gerektiren işlemi başlatınca çıkar. Arka plan konumu kullanılmaz.
- Tarihî fotoğraf kamerası canlı önizleme/üst üste görüntü için WebView `getUserMedia` kullanır. iOS ve Android kamera izinleri tanımlıdır. Ekran kapanırken geç tamamlanan izin isteğinin akışı durdurulur; uygulama gizlenince kamera bırakılır.
- Fotoğraf paylaşımı cihazda önbellek dosyası ve işletim sistemi paylaşım menüsü kullanır. Android alıcısının dosyayı geç okuması ihtimali nedeniyle paylaşım dönüşünde dosya hemen silinmez; işletim sisteminin önbelleğindedir.
- Android geri tuşu önce açık dialog'u, sonra kamera/uygulama katmanını kapatır; iç ekranda geçmişe veya haritaya döner. Haritada uygulamayı arka plana alır.
- Ön plana dönüşte katalog yenilenir; sistem çubuklarının yazı rengi açık/koyu temayı izler. Mevcut safe-area CSS'i kullanılır.
- iOS Filesystem gereksinimi için `PrivacyInfo.xcprivacy` kaynaklara eklenmiştir. Bu dosya mağaza gizlilik anketinin yerine geçmez.

## Doğrulama

```sh
npm run typecheck
npm test
npm run typecheck -w @akar/api
node --import tsx --test services/api/src/config.test.ts
npm run build
npm run test:e2e
npm run mobile:test
```

`mobile:test`, Next sunucusu olmadan gerçek statik çıktıyı Chromium/Pixel ve WebKit/iPhone profilleriyle çalıştırır. Keşif, hikâye, anı, profil, arşiv, galeri ve duyarlı yerleşim akışlarını kapsar. Yerelde Chrome ve Playwright WebKit kurulu olmalı (`npx playwright install webkit`). Tarayıcı emülasyonu, yerel eklenti veya fiziksel cihaz doğrulaması değildir.

4 Kasım 2026 doğrulama durumu:

- Web/API tip kontrolleri, 202 birim testi, 6 API yapılandırma testi ve web/API üretim derlemeleri geçti. API değişikliğinin PR kontrolleri de geçti.
- Statik mobil pakette Chromium ve WebKit ile 22 test geçti; geç tamamlanan kamera izninden sonra akışın durdurulması dahil.
- Web E2E çalışmasında 131 test geçti, 6 test atlandı. Kamera testinin masaüstü profilindeki tek hatası, testin telefon genişliğini açıkça seçmesiyle düzeltildi; ilgili test iki profilde yeniden çalıştırıldı ve geçti. Tam paket bu düzeltmeden sonra yeniden çalıştırılmadı.
- Son canlı ayarlarla `mobile:sync` tamamlandı. iOS Simulator derlemesi başarılı; uygulama iPhone 17 Pro / iOS 26.5 simülatörüne kuruldu ve başlatıldı. Canlı katalog/giriş akışı simülatör arayüzünde ve fiziksel cihazda henüz doğrulanmadı.
- Android ana Google Maven adresinde alınan HTTP 404, Google'ın alternatif dağıtım adresiyle aşıldı. Bağımlılık sürümleri değiştirilmeden `assembleDebug` başarılı oldu (215 görev); canlı ayarlarla debug APK üretildi. Kullanılan isteğe bağlı init dosyası ve USB kurulum komutları aşağıdadır.

Yerel derleme (önce `mobile:sync`):

```sh
cd apps/mobile/android
ANDROID_HOME="$HOME/Library/Android/sdk" ./gradlew assembleDebug
# Çıktı: app/build/outputs/apk/debug/app-debug.apk
```

Google Maven ana adresi bu ağda 404 döndürürse aynı sürümleri Google'ın alternatif dağıtım adresinden indirmek için isteğe bağlı init dosyasını kullan:

```sh
# apps/mobile/android içinde:
ANDROID_HOME="$HOME/Library/Android/sdk" ./gradlew \
  --init-script ../../../scripts/android-google-maven.init.gradle assembleDebug
```

USB hata ayıklama açık ve bilgisayar yetkilendirilmiş telefon için `adb devices -l` çıktısından cihaz kimliğini seç. Ardından `adb -s <cihaz-kimliği> install -r app/build/outputs/apk/debug/app-debug.apk` ile kur; `adb -s <cihaz-kimliği> shell am start -n com.tamerakdeniz.akar/.MainActivity` ile aç. Telefonun kurulum onayını kabul et. `-r` mevcut uygulama verilerini koruyarak günceller; imza uyuşmazlığında verileri silerek kaldırma işlemini otomatik yapma.

```sh
xcodebuild -project apps/mobile/ios/App/App.xcodeproj -scheme App \
  -configuration Debug -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath /tmp/akar-mobile-ios CODE_SIGNING_ALLOWED=NO build
```

## Telefon kabulü ve yayın öncesi kalanlar

Gerçek iPhone ve Android'de aşağıdakiler tamamlanmadan "hatasız" veya mağazaya hazır denmez:

1. Canlı katalog, e-posta OTP, uygulama kapanıp açılınca oturum, çıkış, rol sınırları.
2. Konum izni verme/reddetme, yaklaşık konum, servis kapalı, ziyaret doğrulaması.
3. Kamera izni, galeriden dosya, paylaşma/iptal, yükleme ve moderasyon; arka plana geçiş/dönüş.
4. Harita ve GLB/WebGL düşük bellek davranışı; Türkçe/İngilizce sesli okuma ve mevcut ses kayıtları. Web Speech desteği cihazda ayrıca ölçülmeli.
5. Çentik, sistem çubukları, klavye, yatay ekran, büyük yazı; Android geri tuşu ve iOS gezinme.
6. İnternet kesilmesi, yeniden bağlanma, soğuk açılış ve güncelleme sonrası veri/oturum.
7. Kalıcı uygulama kimliği, AKAR uygulama ikonu ve açılış görselleri (şimdilik platform şablonları), sürüm numaraları, imzalama ve mağaza kayıtları.
8. TestFlight/Play internal test dağıtımı, gizlilik beyanları, hesap silme akışı ve mağaza incelemesi.

Kaynaklar: [Capacitor ortam kurulumu](https://capacitorjs.com/docs/getting-started/environment-setup), [App API](https://capacitorjs.com/docs/apis/app), [Geolocation](https://capacitorjs.com/docs/apis/geolocation), [Filesystem](https://capacitorjs.com/docs/apis/filesystem), [Share](https://capacitorjs.com/docs/apis/share). Next statik export davranışı kurulu sürümün `node_modules/next/dist/docs/01-app/02-guides/static-exports.md` rehberine göre uygulanır.
