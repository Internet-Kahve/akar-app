# AKAR · Proje bağlamı ve üretim dosyaları

> 23 Ekim temizliği: kaldırılan çalışma dosyalarına ait bağlantılar Git geçmişindeki doğrulanmış sürüme gider. Güncel demo içeriği yedi eserle sınırlıdır.

Ürün belgeleri, tasarım referansları, kaynak verisi ve eserlerin 3D üretimi burada tutulur. Güncel ürün odağı Bursa'dır. Uygulama kodu aynı reponun `apps/` ve `packages/` klasörlerindedir.

## Nereden başlamalı?

1. [Tam bağlam](AKAR_Tam_Baglam.md): ürün kararları; güncel bölümlerden başlayın.
2. [Frontend/backend notları](FRONTEND_BACKEND_NOTLARI.md): kapsam, şema ve ekran kuralları.
3. [İçerik yöntemi](ICERIK_YONTEMI.md): eser hikâyeleri, fotoğraf seçimi ve kaynak kuralları.
4. [Hackathon rehberi · Git arşivi](https://github.com/Internet-Kahve/akar-app/blob/1e618ae135192d882a395ec41049b0b91badf03c/docs/documents-context/hackathon/README.md): başvuru ve yarışma kaynakları.

## Hangi dosya nerede?

| Klasör | İçerik |
| --- | --- |
| Kök dizindeki `.md` belgeleri | Ürün bağlamı, teknik notlar, içerik yöntemi ve prototip dersleri |
| `design/` | Ekranlar, ikonlar, desenler, harita stili ve eski prototip referansı |
| `eserler/` | Eser kimliği, ölçüler, referanslar ve 3D üretim dosyaları |
| `veri/` | Envanter PDF'leri, çıkarılmış metinler, CSV'ler ve ortak Bursa kaynakları |
| Git arşivindeki `hackathon/` | Çalışma ağacından kaldırılan yarışma belgeleri ve başvuru |

- [Klasör kuralları ve ayrıntılı yapı](KLASOR_YAPISI.md)
- [Veri rehberi](veri/BENIOKU.md)
- [Eser ve modelleme rehberi](eserler/README.md)
- [Tasarım rehberi](design/README.md)

Belgelerde kod biçiminde yazılan `eserler/...`, `veri/...`, `design/...` yolları bu klasöre göredir. Tıklanabilir bağlantılar bulundukları dosyaya göredir. Tarihli kararlar, eski promptlar ve arşivler geçmiş durumu anlatabilir; güncel model için eserin kendi klasöründeki notlara bakın.

## Güncel teknik referans

23 Ekim 2026: uygulama Next.js + Fastify + PostgreSQL/PostGIS ve Supabase Auth/Storage kullanır. [Teknik kararlar](../BACKEND-DECISIONS.md) ve [API sözleşmesi](../../services/api/CONTRACTS.md) güncel kaynaktır. [PR incelemesi takip planı](../reviews/PR-FIXES-2026-10-23.md) arşiv/geçmiş ve içerik kontrolünün kapanış ölçütlerini içerir.
