# Repo düzeni ve ekip çalışması

## Karar: tek repo, ayrı uygulamalar

Akar bu aşamada **Internet-Kahve/akar-app** reposunda bir monorepo olarak geliştirilir. Hackathon sürecinde ek bir frontend veya backend reposu gerekli değil. Ortak ürün sözleşmeleri ve demo akışları tek yerde izlenir; uygulamalar ayrı başlatılır ve ayrı deploy edilir.

| Konum                    | Sorumluluk                                                           | Şu anki durum                                     |
| ------------------------ | -------------------------------------------------------------------- | ------------------------------------------------- |
| `apps/web`               | Next.js frontend, UI, harita, tarayıcı adaptörleri                   | Mevcut                                            |
| `apps/mobile`            | Expo / React Native, mobil UI ve cihaz API'leri                      | Mobil aşamasında oluşturulacak                    |
| `services/api`           | Backend, auth, veritabanı, moderasyon, sunucu puan/ziyaret kuralları | Backend ekibi uygulamaya başladığında oluşturacak |
| `packages/domain`        | TypeScript veri modelleri, frontend iş kuralları                     | Mevcut                                            |
| `packages/api-client`    | API arayüzü, mock veri ve ileride HTTP adaptörü                      | Mevcut                                            |
| `packages/design-tokens` | Ortak renk ve ölçüler                                                | Mevcut                                            |
| `docs`                   | Ürün, tasarım ve frontend/backend sözleşmeleri                       | Mevcut                                            |
| `.github/workflows`      | Otomatik doğrulama                                                   | Frontend CI mevcut                                |

Planlanan klasörler boş servis varmış izlenimi vermek için eklenmez. Backend framework'ünü bu repo düzeni belirlemez. FastAPI seçilirse `services/api` kendi Python bağımlılık dosyalarını kullanır; Node tabanlı backend seçilirse bağımsız paket olarak yapılandırılır. `services/*` bugün npm workspaces'e ekli değildir.

## Backend ekibinin başlangıcı

1. Bu repoyu clone et ve `feat/api-foundation` gibi bir branch aç.
2. Backend uygulamasını `services/api` altında oluştur; kendi kurulum/test komutlarını dokümante et.
3. [API-HANDOFF.md](API-HANDOFF.md) üzerinden endpoint, auth, kaynak/medya ve hata formatını frontend ile kesinleştir.
4. OpenAPI çıktısını `docs/api/openapi.json` gibi sürümlenebilir bir dosyada tut. Python backend, TypeScript paketini çalıştırmaz; taraflar API şemasını paylaşır. İstemci tipleri daha sonra bu şemadan üretilebilir.
5. Frontend `createMockClient` yerine HTTP adaptörünü bağlar. Puan/rol/geofence/moderasyon kurallarının yetkili uygulaması sunucuda olmalıdır.
6. Backend CI işi ve backend deployment'ı bağımsız eklenir. Frontend build'ine backend sunucusunu zorunlu bağımlılık yapmayın.

Frontend'e backend anahtarları konulmaz; ortam değişkenlerinin yalnızca örnek isimleri commit edilir. Gerçek veri, medya ve sırlar repo dışı servislerde tutulur.

## Ekip iş akışı

- `main`: çalışan ortak sürüm.
- Yeni geliştirmeler: `feat/map-filters`, `feat/api-visits`, `fix/mobile-navigation` gibi konu branch'leri.
- Değişiklikler PR üzerinden incelenir; CI geçtiğinde birleştirilir.
- Mevcut aktarım, ilk README geçmişini koruyan mantıksal commitlerle yapıldı. Sonraki geliştirmelerde bütün özelliği tek büyük commit yapmak yerine bağımlılık sırasına göre küçük değişiklikler tercih edilir.
- Branch protection ayarları otomatik değiştirilmedi. Takım kararıyla PR ve `Frontend CI / web` başarılı kontrol zorunluluğu açılabilir.

## Ne zaman ayrı repo?

Backend için ayrı erişim izinleri, bağımsız ürün/ekip sahipliği veya başka uygulamalara sunulan bağımsız bir API oluşursa `Internet-Kahve/akar-api` gibi ayrı repo mantıklı olabilir. O noktada backend geçmişi korunarak ayrılır; API şeması ve tip dağıtımı sürümlenir. Şimdilik bu koordinasyon maliyetine gerek yok.

Frontend ve backend ayrı repolara alınırsa aynı çalışma dizinine iki farklı `origin` bağlanmaz. Her repo ayrı checkout ve kendi remote'unu kullanır. Bugün yalnızca `akar-app` mevcut olduğundan yerel projenin `origin` adresi bu repodur.

## Yerel bağlantı

```sh
git remote -v
git fetch origin
git switch main
git pull --ff-only
```

Başka ekip üyesi için:

```sh
git clone https://github.com/Internet-Kahve/akar-app.git
cd akar-app
nvm use
npm ci
npm run dev
```
