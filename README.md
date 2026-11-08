# Akar

**İnternet Kahve · KÖK&KOD Hackathon 2026**

Geçmişi gör. Hikâyesini dinle. İzini bırak.

Akar, kültürel mirası harita, etkileşimli 3B modeller, kaynaklı hikâyeler ve geçmiş–bugün karşılaştırmalarıyla keşfetmeyi sağlayan web uygulamasıdır. Bursa / Hanlar Bölgesi odağında başlayan içerik yapısı birden fazla şehir, eser ve rotayı destekler; masaüstü ve mobil tarayıcılarda çalışır.

**[Canlı demo](https://akar.tamerakdeniz.com)** · [API sağlık kontrolü](https://akar-api.vercel.app/ready) · [Doküman rehberi](docs/README.md)

## Kullanım alanları

- **Kültür gezisi:** Haritada eserleri arama ve filtreleme, yakın eserleri bulma, hazır veya kişisel rotalarla keşfetme ve harita uygulamasında yürüyüş tarifi açma.
- **Uzaktan keşif ve öğrenme:** Eserlerin 3B modellerini ve mimari parçalarını inceleme, Türkçe/İngilizce hikâyeleri dinleme veya okuma, tarihî görselleri bugünkü görünümlerle karşılaştırma.
- **Katılımcı deneyim:** Görev ve bulmacaları tamamlama, rozet ve puan toplama, isteğe bağlı haftalık sıralamaya katılma ve «İz Bırak» ile moderasyondan geçen anı/fotoğraf paylaşma.
- **Sorulara kaynaklı yanıt:** Yapay zekâ asistanıyla yayımlanmış eser içeriği hakkında konuşma ve yerel bilgi yetersizse web kaynaklarından destek alma.
- **İçerik yönetimi:** Yetkili panelinden şehir, eser, rota, hikâye, fotoğraf, model, kamera açısı, seslendirme ve görevleri düzenleme; içerik içe aktarma ve anıları denetleme.

## Teknolojiler ve projedeki rolleri

Ana barındırma ve veri altyapısı **Vercel + Supabase** üzerindedir: Next.js web ve Fastify API Vercel’de, PostgreSQL/PostGIS, Auth ve Storage Supabase’de çalışır. Fastify, Drizzle ve Zod bu hizmetler üzerinde çalışan uygulama kütüphaneleridir; ayrı barındırma hizmetleri değildir. AWS SDK, Supabase Storage’ın S3 uyumlu arayüzüne bağlanır; ayrıca AWS S3 kullanıldığı anlamına gelmez. Docker, Testcontainers ve Playwright geliştirme/test araçlarıdır.

| Teknoloji                                   | Nasıl kullanılıyor, hangi sorunu çözüyor?                                                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TypeScript**                              | Web, API ve ortak paketlerde veri tiplerini paylaşarak katmanlar arasındaki sözleşme hatalarını geliştirme sırasında yakalar.                            |
| **Node.js 24 + npm workspaces**             | Web, API ve ortak paketleri tek depoda çalıştırıp bağımlılıkların ve geliştirme komutlarının birlikte yönetilmesini sağlar.                              |
| **Next.js 16 + React 19**                   | Tanıtım sayfasını, keşif ekranlarını ve yönetim panelini bileşenlerle kurar; sayfa sunumu ve etkileşimli arayüz durumunu yönetir.                        |
| **CSS + ortak tasarım tokenları**           | Renk, ölçü, gündüz/gece teması ve mobil düzenleri ortaklaştırarak ekranların tutarlı görünmesini sağlar.                                                 |
| **Lucide React + Fontsource**               | Arayüz ikonlarını ve yerel sunulan Inter/Cormorant Garamond yazı tiplerini sağlayarak görsel dili tutarlı tutar.                                         |
| **MapLibre GL JS + OpenFreeMap**            | Eserleri, şehirleri ve rotaları etkileşimli vektör harita üzerinde göstererek konumsal keşfi sağlar.                                                     |
| **Three.js + GLB/glTF + Draco**             | Eser modellerini haritada ve detay ekranında çizip parça seçimi, kamera geçişleri ve sıkıştırılmış model yüklemeyi sağlar.                               |
| **Fastify**                                 | Katalog, kullanıcı, medya ve yönetim işlemlerini tek HTTP API üzerinden sunarak web ile sunucu sorumluluklarını ayırır.                                  |
| **Zod + OpenAPI/Swagger**                   | İstek ve yanıt şemalarını doğrulayıp API belgesini aynı tanımlardan üreterek sözleşmenin koddan kopmasını önler.                                         |
| **Drizzle ORM + PostgreSQL + PostGIS**      | İlişkisel içerik ve kullanıcı verisini tipli sorgularla yönetir; konum, yakınlık ve mesafe sorgularını veritabanında çözer.                              |
| **Supabase Auth + jose**                    | E-posta kodu ve Google ile oturum açmayı sağlar; API, imzalı JWT'leri doğrulayarak kullanıcı ve rol denetimi yapar.                                      |
| **Supabase Storage + AWS SDK for S3**       | Fotoğraf, model ve ses dosyalarını imzalı yükleme adresleriyle depolayarak büyük dosyaların API istek gövdesinden geçmesini önler.                       |
| **Supabase Cron + kalıcı iş kuyruğu**       | Model işleme, içe aktarma ve temizlik işlerini veritabanında saklayıp bakım çağrılarıyla sürdürerek sunucu kapanınca işlerin kaybolmasını önler.         |
| **openrouteservice**                        | Rota durakları arasındaki yürüme yollarını hesaplayıp saklayarak mesafe, süre ve harita çizgisini gerçek yaya güzergâhına dayandırır.                    |
| **OpenStreetMap / Overpass / Nominatim**    | Envanter içe aktarımında eser adlarını konumlarla eşleştirerek elle koordinat girme ihtiyacını azaltır.                                                  |
| **Deepgram + Web Speech API**               | Türkçe/İngilizce ses kayıtları üretir; kayıt bulunmadığında veya oynatılamadığında tarayıcı sesiyle anlatımı sürdürür.                                   |
| **Google Gemini + Google Search grounding** | İngilizce çeviri ve eser asistanını destekler; asistan önce katalog metinlerini, gerekirse kaynak bağlantılarıyla web aramasını kullanır.                |
| **Python içerik betikleri**                 | Kaynak metinleri ve eser klasörlerini işleyip aktarım manifestleri üreterek editoryal arşivi uygulamanın veri biçimine dönüştürür.                       |
| **Vercel + esbuild**                        | Web ve API'yi ayrı dağıtır; API ile ortak paketleri sunucusuz çalışacak bir çıktıda birleştirir.                                                         |
| **Docker + Supabase CLI + Testcontainers**  | Yerel Auth/Storage ortamını ve gerçek PostGIS test veritabanlarını kurarak bulut verisine dokunmadan geliştirme ve entegrasyon testi yapılmasını sağlar. |
| **Node.js test runner + tsx + Playwright**  | İş kurallarını, API davranışlarını ve masaüstü/mobil tarayıcı akışlarını sınayarak regresyonları yakalar.                                                |
| **GitHub Actions + Prettier**               | PR ve ana dal kontrollerini otomatik çalıştırır, kaynak dosyalarının biçimini ortaklaştırır.                                                             |

Harici servis gerektiren özellikler ilgili API anahtarları ve içerik yapılandırıldığında çalışır; yalnız arayüz geliştirmek için bu servislerin tamamını kurmak gerekmez.

## Mimari ve depo düzeni

Web, uygulama verisine ortak API istemcisi üzerinden erişir; giriş Supabase Auth, medya sunumu Supabase Storage üzerinden yürür. Fastify API, PostgreSQL/PostGIS'e bağlanır ve yetkilendirme ile iş kurallarını uygular. Web ve API ayrı Vercel projeleri olarak dağıtılır.

```text
Tarayıcı → Next.js web (Vercel: akar-app)
         → Fastify API (Vercel: akar-api) → Drizzle / pg → Supabase PostgreSQL + PostGIS
         → Supabase Auth (oturum açma)
         → Supabase Storage (medya okuma / imzalı yükleme)

Fastify API → Gemini / Deepgram / openrouteservice (yapılandırıldığında)
Supabase Cron → korumalı Fastify bakım ucu → veritabanındaki bekleyen işler
```

Katalog ve yönetim işlemleri tarayıcıdan doğrudan Supabase tablolarına gönderilmez; Fastify API üzerinden yürür. Cron kurulum betiği Supabase’den API’ye periyodik çağrı tanımlar; kuyruk için ayrıca Redis veya ayrı bir kuyruk servisi kullanılmaz.

| Konum                    | Sorumluluk                                                                      |
| ------------------------ | ------------------------------------------------------------------------------- |
| `apps/web`               | Next.js uygulaması, harita/3B deneyimi ve yönetim paneli                        |
| `services/api`           | Fastify API, veritabanı şemaları/migration'ları, entegrasyonlar ve bakım işleri |
| `packages/domain`        | Ortak veri modeli, doğrulamalar ve saf iş kuralları                             |
| `packages/api-client`    | Aynı arayüzü uygulayan yerel mock ve HTTP istemcileri                           |
| `packages/design-tokens` | Paylaşılan tasarım değişkenleri                                                 |
| `tests`                  | Web tarayıcı testleri; gerçek API E2E testleri `services/api/e2e` içinde        |
| `scripts`                | Kontrol, lisans ve içerik yardımcıları                                          |
| `docs`                   | Kurulum, mimari, API sözleşmesi, içerik kaynakları ve tarihli çalışma notları   |

Dağıtım ayarları: [API rehberi](services/api/README.md#yayına-alma). Mimari ayrıntıları: [veri modeli](docs/final/MIMARI.md), [repo stratejisi](docs/REPOSITORY-STRATEGY.md). [23 Ekim 2026 dağıtım kaydı](docs/deployment/2026-10-23-cloud-migration.md) tarihli ortam kaydıdır.

## Yerelde çalıştırma

Node.js sürümü `.nvmrc` içindedir (**24**). Komutları repo kökünden çalıştır:

```sh
nvm use
npm ci
```

### Yalnız arayüz

```sh
npm run dev
```

[127.0.0.1:3000](http://127.0.0.1:3000), `NEXT_PUBLIC_API_URL` tanımlı değilse yerel mock istemcisini kullanır; yerel değişiklikler aynı tarayıcıda saklanır. Docker veya bulut hesabı gerekmez, harita altlığı için internet gerekir.

Kaynak arşivindeki model ve metinlerle yerel içerik önizlemesi için `npm run dev:content` kullanılabilir; bu komut Python 3 ve `docs/documents-context` altındaki içerik dosyalarını da gerektirir.

### Gerçek API, giriş ve dosya yükleme

Docker (veya OrbStack) çalışıyor, Supabase CLI kurulu olmalı. İki terminal aç:

```sh
# Terminal 1: veritabanı, Supabase, migration, örnek veri ve API
npm run api

# Terminal 2: yerel API'ye bağlı web
npm run dev:api
```

| Hizmet                      | Yerel adres                                       |
| --------------------------- | ------------------------------------------------- |
| API'ye bağlı web            | [127.0.0.1:3001](http://127.0.0.1:3001)           |
| API / Swagger               | [127.0.0.1:4000/docs](http://127.0.0.1:4000/docs) |
| Giriş e-postaları (Mailpit) | [127.0.0.1:54324](http://127.0.0.1:54324)         |
| Supabase Studio             | [127.0.0.1:54323](http://127.0.0.1:54323)         |

`api` yerel ortamı hazırlar; `dev:api` web bağlantı değişkenlerini otomatik sağlar. Elle yapılandırma için [web ortam örneği](apps/web/.env.example) ve [API ortam örneğini](services/api/.env.example), roller ve test senaryoları için [test rehberini](docs/TESTING.md) kullan.

Asistan/çeviri için Gemini, kayıt üretimi için Deepgram, yürüyüş hesaplama için `ROUTING_API_KEY` gerekir; model üretme/düzenleme entegrasyonu ayrıca harici model çalıştırıcı ister. Anahtarlar sunucu ortamında tutulur; `NEXT_PUBLIC_*` değişkenlerine yalnız herkese açık bağlantı bilgileri ve Supabase publishable/anon anahtarı konur.

## Kontroller

```sh
npm run check -- --web --build       # Web tip kontrolü, birim testleri ve üretim derlemesi
npm run check -- --build             # Web + API testleri, OpenAPI güncelliği ve derlemeler; Docker gerekir
npm run check -- --web --e2e          # Web kontrolleri + masaüstü/mobil tarayıcı testleri
npm run test:e2e:api                  # Yerel API/Supabase açıkken gerçek giriş ve moderasyon
```

Yerel web E2E testleri kurulu Google Chrome'u, web CI ise Playwright imajındaki Chromium'u kullanır. Gerçek API E2E testleri yerelde Chromium, CI'da Chrome kullanır; yerel Chromium kurulumu için `npx playwright install chromium` çalıştırılabilir. Güncel web test yapılandırmasında ayrı WebKit projesi yoktur.

GitHub Actions web, API ve gerçek API tarayıcı akışlarını ayrı iş akışlarında denetler. Katkı ve doğrulama kuralları [CONTRIBUTING.md](CONTRIBUTING.md) içindedir.

## İçerik ve sınırlar

- Bu README depodaki uygulama yeteneklerini anlatır; canlı eser/model/ses sayısı ve özelliklerin kullanılabilirliği yayımlanan içerik ile servis ayarlarına bağlıdır.
- Hikâye ve görseller kaynak/güven bilgisi taşır; çıkarım ve temsili içerik işaretlenir, 3B modeller tarihsel rekonstrüksiyon garantisi vermez.
- Türkçe/İngilizce arayüz ve içerik desteği vardır; çeviri veya ses kaydı her eserde bulunmayabilir, makine çevirileri editoryal inceleme gerektirir.
- Hesaplanmış yürüyüş yolları kullanılır; yolu henüz hesaplanmamış duraklar şematik bağlanır ve adım adım yönlendirme harici harita uygulamasında açılır.
- Tam çevrimdışı kullanım sunulmaz; harita, uzaktaki medya, gerçek hesap işlemleri ve asistan ağ bağlantısı gerektirir.
- iOS/Android uygulaması aynı arayüzü Capacitor ile cihaz içine paketler. Kurulum, derleme ve yayın öncesi doğrulamalar: [mobil rehber](docs/MOBILE.md).
- Kaynak ve lisans kayıtları: [içerik rehberi](docs/content/DEMO-CONTENT.md), [lisanslar](docs/LISANSLAR.md). Yerel mock seed'i canlı editoryal kataloğun üzerine çalıştırılmamalıdır.


`docs/documents-context` içerik/tasarım kaynak arşividir; standart uygulama derlemesi ve CI kapsamından ayrıdır. Büyük geçmiş dosyalarını baştan indirmeden klonlamak için:

```sh
git clone --filter=blob:none https://github.com/Internet-Kahve/akar-app.git
```
