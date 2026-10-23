# Akar

**İnternet Kahve · KÖK&KOD Hackathon 2026**

Geçmişi gör. Hikâyesini dinle. İzini bırak.

Bursa / Hanlar Bölgesi için web öncelikli kültürel miras demosu. Canlı sürümde yedi eser, kaynaklı fotoğraflar, temsili GLB modelleri, tarihî görüntüler, e-posta koduyla giriş ve moderasyon bulunur.

**[Canlı demo](https://akar.tamerakdeniz.com)** · [API sağlık kontrolü](https://akar-api.vercel.app/ready) · [Doküman rehberi](docs/README.md)

## Mimari

| Bileşen                  | Konum / hizmet                                                     |
| ------------------------ | ------------------------------------------------------------------ |
| Web                      | `apps/web` · Next.js / React · Vercel `akar-app`                   |
| API                      | `services/api` · Fastify / Drizzle · Vercel `akar-api`, Frankfurt  |
| Veritabanı, giriş, medya | Supabase PostgreSQL/PostGIS, Auth, Storage · Frankfurt             |
| Periyodik işler          | Supabase Cron → korumalı API bakım ucu                             |
| Ortak kod                | `packages/domain`, `packages/api-client`, `packages/design-tokens` |

Web ve API ayrı dağıtılır; üretim dalı `main`dir. Sırlar Git'te tutulmaz. Kurulum ve ortam değişkenleri: [API rehberi](services/api/README.md#yayına-alma), [canlı ortam kaydı](docs/deployment/2026-10-23-cloud-migration.md).

## Yerelde çalıştırma

Node.js sürümü `.nvmrc` içindedir (**24**). İlk kurulum:

```sh
nvm use
npm ci
```

Yalnız arayüz geliştirmek için Docker veya bulut hesabı gerekmez:

```sh
npm run dev
```

[127.0.0.1:3000](http://127.0.0.1:3000) yerel mock istemcisini kullanır; verisi aynı tarayıcıda saklanır. Bu mod canlı hesaba veya Storage'a bağlanmaz. Harita tile'ları için internet gerekir.

Gerçek API/Auth/Storage akışı için Docker ve Supabase CLI kurulu olmalı. İki terminalde:

```sh
# Terminal 1: yerel veritabanı, Supabase, migration, örnek veri ve API
npm run api

# Terminal 2: yerel API'ye bağlı web
npm run dev:api
```

Web [127.0.0.1:3001](http://127.0.0.1:3001), giriş e-postaları [Mailpit](http://127.0.0.1:54324) üzerinden açılır. `dev:api` bağlantıları otomatik sağlar. Elle yapılandırma için [web ortam örneği](apps/web/.env.example); roller ve ayrıntılı akışlar için [test rehberi](docs/TESTING.md).

## Kontroller

```sh
npm run check -- --web --build       # Docker gerektirmeyen web kontrolü
npm run check -- --build             # Web + API + OpenAPI + derlemeler; Docker gerekir
npm run check -- --web --e2e         # Masaüstü/mobil web tarayıcı testleri
npm run test:e2e:api                 # Yerel API/Supabase açıkken gerçek giriş ve moderasyon
```

Yerel web testleri Google Chrome kullanır; yönetim tablosunun WebKit regresyonu için ilk çalıştırmadan önce `npx playwright install webkit` gerekir. Web CI tarayıcıları hazır Playwright imajından çalıştırır. Gerçek API tarayıcı testleri yerelde Chromium, CI’da runner’ın hazır Chrome’unu kullanır. PR/main kontrolleri web, API ve gerçek API tarayıcı akışlarını doğrular. [Katkı rehberi](CONTRIBUTING.md) komut kapsamını açıklar.

## İçerik ve sınırlar

- Canlı katalog: 7 eser, 7 temsili model, 58 eser fotoğrafı, 36 tarihî fotoğraf eşleşmesi, 59 hikâye adımı; 94 tekil Storage nesnesi, yaklaşık 73,5 MiB.
- Kaynak/lisans metinleri ve yeniden aktarım yöntemi: [demo içerik rehberi](docs/content/DEMO-CONTENT.md). Yerel mock seed'i canlı katalog üzerine çalıştırma.
- Orhan Gazi Türbesi'nin anlatımı henüz yoktur. Diğer eserler tarayıcının Türkçe sesli okumasını kullanır; profesyonel ses kaydı bulunmaz.
- Rota çizgileri şematiktir; yürüyüş yol tarifi değildir. Modeller tarihsel rekonstrüksiyon olarak sunulmaz.
- Native mobil uygulama henüz eklenmedi. Mobil web çalışır; gelecekteki React Native uygulaması ortak domain/API paketlerini kullanabilir, web bileşenleri doğrudan native'e taşınmaz.

`docs/documents-context` ekip tarafından tutulan içerik/tasarım kaynaklarıdır. Canlı dosyalar Storage'dan sunulur; kaynak arşivi derleme, biçimlendirme ve CI çalışma kapsamından ayrıdır. Git geçmişindeki eski büyük dosyaları baştan indirmemek için yeni klonda `git clone --filter=blob:none https://github.com/Internet-Kahve/akar-app.git` kullanılabilir; geçmiş korunur, gereken dosyalar indirilir.
