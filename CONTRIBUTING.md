# Akar'a katkı

Repo: [Internet-Kahve/akar-app](https://github.com/Internet-Kahve/akar-app).

## Kurulum

Node sürümü `.nvmrc` içindedir. Repo kökünden `npm ci` ve `npm run dev` çalıştır. Ortak paketler npm workspaces ile bağlanır; `apps/web` içinde ayrıca `npm install` çalıştırmak gerekmez.

## Değişiklik gönderme

Bu repoda çalışma branch’leri için `tamerakdeniz/` ön eki kullanılır. Commit yazarı ve committer kimliği mevcut Tamer Akdeniz Git ayarlarıdır.

```sh
git switch main
git pull --ff-only
git switch -c tamerakdeniz/ozellik-adi
# Değişikliği uygula.
npm run typecheck
npm test
npm run build
# Kullanıcı akışı değiştiyse:
npm run test:e2e
git add <ilgili-dosyalar>
git commit -m "feat(scope): describe the change"
git push -u origin tamerakdeniz/ozellik-adi
```

PR açıklamasında davranış değişikliğini, nasıl doğrulandığını ve bilinen sınırlarını yaz. Ortak API tipini değiştirdiğinde frontend/backend sözleşmesini de güncelle. Commit kimliğini kendi `git config user.name` ve `user.email` ayarlarınla kullan.

## Kontroller

`Frontend CI` main push ve PR'larında temiz kurulum, tip kontrolü, birim testleri, build ve masaüstü/mobil Playwright testleri çalıştırır. Playwright işi `mcr.microsoft.com/playwright` imajında çalışır (tarayıcılar imajla gelir); `@playwright/test` sürümü değişince `.github/workflows/ci.yml` içindeki imaj etiketi de aynı sürüme çekilir. CI, Playwright Chromium kullanır; yerel testlerin varsayılanı kurulu Google Chrome'dur. E2E testleri `127.0.0.1:3000` üzerinde dev sunucuyu başlatır; yerelde zaten açıksa onu kullanır.

`npm run check` web/API tip kontrollerini, birim/entegrasyon testlerini ve `docs/api/openapi.json` güncelliğini denetler; API testleri için Docker gerekir.

- Yalnız web: `npm run check -- --web` (Docker gerekmez).
- Üretim derlemeleri de dahil: `npm run check -- --build` (web + Vercel API).
- Web için hızlı PR kontrolü: `npm run check -- --web --build --e2e`.
- Gerçek giriş/Storage/moderasyon: yerel API/Supabase açıkken `npm run test:e2e:api`.

`--e2e` web testlerini ekler; gerçek API E2E ayrı komuttur. Docker imajı CI'da doğrulanır. `npm run format` uygulama, paket, test ve rehberleri biçimlendirir; içerik prototipleri, üretilen OpenAPI/migration dosyaları ve kişisel inceleme çıktıları `.prettierignore` ile dışarıda kalır.

- Ekran kodu: `apps/web/src`.
- Veri modeli ve saf iş kuralları: `packages/domain`.
- Mock/HTTP sınırı: `packages/api-client`.
- Renk/ölçü tokenları: `packages/design-tokens`.
- Mimari ve backend başlangıcı: [repo stratejisi](docs/REPOSITORY-STRATEGY.md).

`node_modules`, `.next`, test ekran görüntüleri, kişisel dosyalar, `.env` ve geçici medya indirme adresleri commit edilmez. `package-lock.json` bağımlılık değişikliğinde güncellenir ve commit edilir.
