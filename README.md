# Akar

**İnternet Kahve · KÖK&KOD Hackathon 2026**

Geçmişi gör. Hikâyesini dinle. İzini bırak.

Figma tasarımlarından geliştirilmiş, web öncelikli kültürel miras uygulaması. İlk demo bölgesi İstanbul / Tophane. Bu sürüm frontend ve yerel mock servis içerir; sunucu, gerçek kullanıcı hesabı veya doğrulanmış ziyaret altyapısı içermez.

## Çalıştırma

Node.js 22+ (geliştirmede 24.14.1) ve npm gerekir.

```sh
npm ci
npm run dev
```

[http://127.0.0.1:3000](http://127.0.0.1:3000) adresini aç. Harita tile'ları için internet gerekir; yüklenemezse şematik görünüm ve eser listesi kullanılabilir. Google Chrome, Playwright testlerinin varsayılan tarayıcısıdır.

```sh
npm run typecheck
npm test
npm run test:e2e
npm run build
npm start
```

## Çalışan akışlar

- Türkçe arama, eser türü filtresi, favoriler, harita pinleri ve mobil yerleşim.
- Üç hazır rota, kendi rotasına eser ekleme/çıkarma, sıralı duraklar ve demo ziyaret durumu.
- Eser detayları, kaynak/durum paneli, bölümlü hikâye, sade anlatım, cihaz üzerinden Türkçe sesli okuma ve hız seçimi.
- Temsili mimari sahnede hikâye noktaları; genel akar → hayrat ilişkisi.
- Açıklamalı üç soruluk kültür bulmacası, tekrar puanını engelleyen iş kuralları.
- Anı ve isteğe bağlı fotoğraf gönderimi, onay bekleyen katkılar, onay/ret ve yaşayan hafıza.
- Demo ziyaretleri, profil puanları, kazanılan rozetler, yüksek kontrast ve büyük metin.
- Demo yönetim panelinde eser ekleme/düzenleme, hikâye bölüm düzenleme, taslak/yayın durumu ve moderasyon.
- Geçmişi Gör için klavye destekli karşılaştırma kaydırıcısı ve tarih seçimi. **Gerçek arşiv görselleri henüz yoktur.**

Veriler aynı tarayıcıda `akar-demo-v1` anahtarıyla localStorage'da tutulur. Birden fazla cihaz arasında senkronizasyon yoktur. Mirasım → Demo verilerini sıfırla ile başlangıca dönülür. Fotoğraflar yerel depolama kotasına tabidir; kota hatasında işlem kaydedilmiş gibi gösterilmez.

## Proje yapısı

```text
apps/web/                 Next.js App Router, web arayüzü, MapLibre harita
packages/domain/          Platform bağımsız tipler, doğrulama ve iş kuralları
packages/api-client/      AkarClient sözleşmesi, mock servis, örnek veriler
packages/design-tokens/   Figma Çini paleti, CSS ve mobil için TypeScript tokenları
tests/                    Masaüstü / mobil uçtan uca testler
docs/                     Yol haritası, API handoff, kaynak ve kapsam notları
```

Bu repo frontend, gelecekteki mobil uygulama ve backend için tek monorepo olarak kullanılacak; yeni repo şu aşamada gerekli değil. Backend ekibi çalışmaya başladığında `services/api` altında kendi uygulamasını ekleyecek.

Gelecekte `apps/mobile` altında Expo uygulaması aynı domain ve servis paketlerini kullanabilir. Web UI bileşenleri DOM/CSS içerir ve React Native'de doğrudan kullanılamaz. Mobil ekranlar platforma uygun yazılacaktır.

## Tasarım ve sınırlar

Güncel kaynak [Akar Figma dosyası](https://www.figma.com/design/Bd3m8xYrCiVK6440POHN39/akar-app?node-id=0-1). Renkler, temel navigasyon, sol panel/harita yapısı ve ana ekran akışları korundu. Wireframe yer tutucuları temsili çizimlerle tamamlandı. Figma ikonları `apps/web/public/figma` altında yereldir; çalışırken geçici Figma URL'lerine ihtiyaç yoktur.

Bu sürümde **3D model, tarihî fotoğraf, gerçek geofence, profesyonel ses kaydı, e-posta doğrulama, çok kullanıcılı birlikte gezme ve gerçek API bağlantısı yoktur**. Bunlar tamamlanmış gibi sunulmaz. Harita eğimi, gerçek 3D yapı modeli anlamına gelmez. Rota çizgisi durakları birleştiren şemadır; yürünebilir yol tarifi değildir.

- [Repo düzeni ve ekip sınırları](docs/REPOSITORY-STRATEGY.md)
- [Katkı ve branch akışı](CONTRIBUTING.md)
- [Yol haritası ve kapsam](docs/ROADMAP.md)
- [Backend entegrasyon sözleşmesi](docs/API-HANDOFF.md)
- [Figma eşlemesi ve içerik kaynakları](docs/DESIGN-SOURCES.md)
- [Doğrulama raporu](docs/VERIFICATION.md)
