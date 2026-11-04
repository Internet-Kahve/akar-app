# Lisanslar ve kaynaklar

Şartname §5.1.2, §8 ve §10 için. Yazılım tablosunu `node scripts/lisans-tablosu.mjs` üretir; ziyaretçi için özeti `/lisanslar.html`.

## Doğrudan kullanılan yazılım

| Paket | Sürüm | Lisans |
|---|---|---|
| @aws-sdk/client-s3 | 3.1153.0 | Apache-2.0 |
| @aws-sdk/s3-request-presigner | 3.1153.0 | Apache-2.0 |
| @fastify/cors | 11.3.1 | MIT |
| @fastify/helmet | 13.2.0 | MIT |
| @fastify/rate-limit | 11.2.1 | MIT |
| @fastify/swagger | 9.9.2 | MIT |
| @fastify/swagger-ui | 6.1.2 | MIT |
| @fontsource/cormorant-garamond | 5.3.0 | OFL-1.1 |
| @fontsource/inter | 5.3.0 | OFL-1.1 |
| @supabase/supabase-js | 2.118.0 | MIT |
| @vercel/functions | 3.10.3 | Apache-2.0 |
| drizzle-orm | 0.45.4 | Apache-2.0 |
| fastify | 5.12.7 | MIT |
| fastify-type-provider-zod | 7.0.0 | MIT |
| jose | 6.2.13 | MIT |
| lucide-react | 0.468.0 | ISC |
| maplibre-gl | 6.15.0 | BSD-3-Clause |
| next | 16.4.2 | MIT |
| pg | 8.23.1 | MIT |
| react | 19.3.0 | MIT |
| react-dom | 19.3.0 | MIT |
| three | 0.186.1 | MIT |
| zod | 4.6.7 | MIT |

## Yazı tipleri

| Yazı tipi | Lisans | Nerede |
|---|---|---|
| Inter | SIL OFL 1.1 | Uygulama |
| Cormorant Garamond | SIL OFL 1.1 | Uygulama |
| Geist | SIL OFL 1.1 | Tanıtım sayfası |

## Harita

| Kaynak | Lisans ve atıf |
|---|---|
| OpenStreetMap verisi | ODbL 1.0, «© OpenStreetMap katkıda bulunanlar» |
| OpenFreeMap (tile, yazı, sprite) | Ücretsiz hizmet; OpenMapTiles şeması, BSD-3 ve CC-BY 4.0 |
| Natural Earth (`ne2_shaded`) | Kamu malı |

Haritadaki atıf düğmesi açıktır (`attributionControl`).

## İçerik

| İçerik | Durum |
|---|---|
| Envanter kitap metinleri, fotoğrafları | Vakıf Katılım; proje için verildi |
| Foto Atlas eski fotoğrafları | Kayıt başına izin: `veri/fotoatlas/IZIN_DURUMU.md`; yalnız kullanılabilir olanlar |
| 3D modeller | Ekip üretimi; «Temsili» etiketiyle |
| Temsili görseller (Geçmişi Gör) | Yapay üretim; «Temsili görsel» etiketiyle |
| Seslendirme, İngilizce taslak | Deepgram ve Gemini ile üretildi (`BACKEND-DECISIONS` §11.56); hizmet koşulları Burak'ta doğrulanmalı |
| İngilizce içerik (`icerik/en/`) | Ekip çevirisi, yapay zekâ desteğiyle; insan gözden geçirmesi bekliyor |

## Açık kalanlar

- KVKK metni taslak (`apps/web/src/lib/kvkk.ts`); veri sorumlusu ve iletişim bilgisi organizasyonla netleşmeli.
- Deepgram, Gemini ve görsel üretim aracının ticari kullanım koşulları ekipçe teyit edilmeli.
