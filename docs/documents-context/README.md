# AKAR · Proje bağlamı ve üretim dosyaları

> 23 Ekim, 2 Kasım ve 4 Kasım temizlikleri (ayrıntı: [Klasör yapısı](KLASOR_YAPISI.md)): kaldırılan dosyalara ait bağlantılar Git geçmişindeki sürüme gider. Güncel içerik: 11 eser (Bursa 9, Konya 1, Hatay 1), bunların yedisi 3D modelli; Kütahya yakında.

Ürün belgeleri, tasarım varlıkları, kaynak verisi ve eserlerin 3D üretimi burada tutulur. Uygulama Türkiye geneli için kurulu, içeriğin çoğu şimdilik Bursa'da. Uygulama kodu aynı reponun `apps/` ve `packages/` klasörlerindedir.

## Nereden başlamalı?

1. [Tam bağlam](AKAR_Tam_Baglam.md): ürün kararları; güncel bölümlerden başlayın.
2. [Frontend/backend notları](FRONTEND_BACKEND_NOTLARI.md): kapsam, şema ve ekran kuralları.
3. [İçerik yöntemi](ICERIK_YONTEMI.md): eser hikâyeleri, fotoğraf seçimi ve kaynak kuralları.
4. [Birleştirme notu](BIRLESTIRME_NOTU_MOBIL_OPTIMIZASYON.md) ve [devir notu](DEVIR_3KASIM.md): son iş, canlıya çıkarken yapılacaklar. Ekip düzeyindeki açık işler: [Yapılacaklar](YAPILACAKLAR.md).
5. Hackathon: `hackathon/` klasörü (başvuru, şartname, envanter bilgi notu) Git dışındadır, yerelde ya da ekip arşivinde bulunur. [Rehberin Git arşivi](https://github.com/Internet-Kahve/akar-app/blob/1e618ae135192d882a395ec41049b0b91badf03c/docs/documents-context/hackathon/README.md).

Tarihli çalışma notları: [Entegrasyon](ENTEGRASYON_29EKIM.md) (`BACKEND-DECISIONS` atıf yapar), [Prototip dersleri](PROTOTIP_DERSLERI.md).

## Hangi dosya nerede?

| Klasör | İçerik |
| --- | --- |
| Kök dizindeki `.md` belgeleri | Ürün bağlamı, teknik notlar, içerik yöntemi ve prototip dersleri |
| `design/` | Kaynak ikonlar, desenler, logo ve harita stili denemesi |
| `eserler/` | Eser kimliği, içerik, Geçmişi Gör paketi ve 3D dosyaları (`ref/`, `3d/blend`, `build`, `kontrol` Git dışında) |
| `veri/` | Şehir kayıtları ve rotalar (uygulama okur), CSV'ler, Bursa kaynakları; envanter PDF'leri ve fotoğraf arşivleri Git dışında |
| `hackathon/` | Yarışma belgeleri ve başvuru (Git dışında) |

- [Klasör kuralları ve ayrıntılı yapı](KLASOR_YAPISI.md)
- [Veri rehberi](veri/BENIOKU.md)
- [Eser ve modelleme rehberi](eserler/README.md)
- [Tasarım rehberi](design/README.md)

Belgelerde kod biçiminde yazılan `eserler/...`, `veri/...`, `design/...` yolları bu klasöre göredir. Tıklanabilir bağlantılar bulundukları dosyaya göredir. Tarihli kararlar, eski promptlar ve arşivler geçmiş durumu anlatabilir; güncel model için eserin kendi klasöründeki notlara bakın.

## Güncel teknik referans

23 Ekim 2026: uygulama Next.js + Fastify + PostgreSQL/PostGIS ve Supabase Auth/Storage kullanır. [Teknik kararlar](../BACKEND-DECISIONS.md) ve [API sözleşmesi](../../services/api/CONTRACTS.md) güncel kaynaktır. [PR incelemesi takip planı](../reviews/PR-FIXES-2026-10-23.md) arşiv/geçmiş ve içerik kontrolünün kapanış ölçütlerini içerir.
