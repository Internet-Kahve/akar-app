# Repo düzeni ve ekip çalışması

Akar, **Internet-Kahve/akar-app** içinde bir monorepodur. Web ve API aynı sözleşmeleri paylaşır, ayrı Vercel projelerine dağıtılır.

| Konum                       | Sorumluluk                                                          |
| --------------------------- | ------------------------------------------------------------------- |
| `apps/web`                  | Next.js arayüzü, harita, tarayıcı adaptörleri                       |
| `services/api`              | Fastify, auth doğrulama, PostGIS, moderasyon, medya ve kalıcı işler |
| `packages/domain`           | Platform bağımsız tipler ve iş kuralları                            |
| `packages/api-client`       | HTTP ve yerel mock istemcileri                                      |
| `packages/design-tokens`    | Ortak renk ve ölçüler                                               |
| `tests`, `services/api/e2e` | Web ve gerçek API tarayıcı testleri                                 |
| `docs/documents-context`    | İçerik ekibinin kaynakları ve tasarım prototipleri                  |
| `.github/workflows`         | Frontend CI, API CI, API browser E2E                                |

`apps/mobile` henüz yoktur. React Native uygulaması eklendiğinde domain/API/token paketlerini paylaşabilir; web UI bileşenleri DOM/CSS içerir.

## Günlük akış

1. `main`i güncelle, konu dalı aç; adlandırma ve kontroller [CONTRIBUTING.md](../CONTRIBUTING.md) içinde.
2. API değiştiğinde HTTP adaptörünü ve sözleşmeyi birlikte kontrol et. Şema kaynağı API'dir; `npm run openapi -w @akar/api` çıktısı commit edilir.
3. Migration üretimi ve uygulanması açık bir adımdır; sunucu açılışı/dağıtım migration çalıştırmaz.
4. PR kontrolleri geçince birleştir. `main` web ve API üretim dağıtımlarını tetikler.
5. Birleşmiş konu dalını sil; ekip üyesinin birleşmemiş commitlerini temizleme kapsamına alma.

Frontend'e sunucu sırları konulmaz. Yerel `.env`, Vercel bağlantı dosyaları, test çıktıları ve bağımlılıklar Git dışında kalır. Tek kök `package-lock.json` çalışma paketlerinin bağımlılıklarını yönetir; içerik arşivindeki eski prototipler workspace değildir.

## Yeni klon

```sh
git clone --filter=blob:none https://github.com/Internet-Kahve/akar-app.git
cd akar-app
nvm use
npm ci
npm run dev
```

Kısmi klon eski büyük medya sürümlerini gerektiğinde indirir; commit geçmişini silmez. CI kaynak arşivini sparse checkout ile dışarıda bırakır; Docker bağlamı da yalnız API'nin ihtiyaç duyduğu dosyaları içerir.

İçerik paketini düzenleme/yayımlama: [DEMO-CONTENT.md](content/DEMO-CONTENT.md). Kurulum: [README](../README.md), testler: [TESTING.md](TESTING.md).
