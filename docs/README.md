# Doküman rehberi

## Güncel çalışma rehberleri

| Konu                                     | Belge                                                                         |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| Kurulum, mimari, canlı demo              | [Ana README](../README.md)                                                    |
| Commit, PR ve kontrol komutları          | [Katkı rehberi](../CONTRIBUTING.md)                                           |
| Yerel API/Auth/Storage ve test akışları  | [Test rehberi](TESTING.md)                                                    |
| API ayarları, migration ve dağıtım       | [API README](../services/api/README.md)                                       |
| Canlı Vercel/Supabase kaynakları         | [Dağıtım kaydı](deployment/2026-10-23-cloud-migration.md)                     |
| Eser, model, fotoğraf ve yeniden aktarım | [İçerik rehberi](content/DEMO-CONTENT.md)                                     |
| API şeması ve modül kuralları            | [OpenAPI](api/openapi.json), [modül sözleşmesi](../services/api/CONTRACTS.md) |
| Monorepo ve ekip sorumlulukları          | [Repo düzeni](REPOSITORY-STRATEGY.md)                                         |
| Kararların gerekçeleri                   | [Backend karar kaydı](BACKEND-DECISIONS.md)                                   |

## Tarihli plan ve incelemeler

[İlk yol haritası](ROADMAP.md), [frontend yenileme planı](FRONTEND-REFRESH.md), [ilk doğrulama raporu](VERIFICATION.md), [backend başlangıç planı](BACKEND-PLAN.md) ve [tasarım notları](DESIGN-SOURCES.md) yazıldıkları tarihteki durumu anlatır. Eksik özellik listeleri güncel canlı sürümün kapsamı değildir. Aktif kurulum için yukarıdaki rehberleri kullan.

`documents-context/` eser üretim dosyalarını, lisans/kaynak kayıtlarını ve tasarım prototiplerini saklar. `reviews/` tarihli incelemeler içindir; buradaki raporlar test komutu veya kurulum talimatı yerine geçmez. Üretilen OpenAPI dosyası elle düzenlenmez.
