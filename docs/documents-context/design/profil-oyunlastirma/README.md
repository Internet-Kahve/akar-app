# Profil oyunlaştırma · ekran görüntüleri ve notlar

5 Kasım 2026, dal `talha/profil-oyunlastirma`. Uygulama içinden alınan ekran görüntüleri (Playwright, demo modu) ve işin özeti. Telefon 390×780, masaüstü 1280×800; `day` gündüz, `night` gece teması. Dosyalar boyut için WebP'ye çevrildi.

## Klasörler

| Klasör | Aşama | İçerik |
|---|---|---|
| `A-rozetler/` | A · Rozetler | `sheet`: 28 rozet + 3 yedek görselin toplu görünümü. `shelf-*`: profildeki rozetler (kazanılmış/gri siluet). `card-*`: büyük rozet kartı, `card-locked-*`: kazanılmamış rozet kartı. `ach-*`: başarımlar. `celebrate-*`: kazanma kutlaması (`-mid-` animasyon ortası; gece görüntüleri hareket azaltılmış). `profile-*`: profilin üst kısmı. |
| `B-paylasim/` | B · Paylaşım | `card-badge`, `card-ach`, `card-week`: 1080×1920 hikâye kartları (indirilen dosya). `cards`: üçü yan yana. `share-dialog-*`, `share-week-*`: paylaşım penceresi (dosya paylaşımı olmayan tarayıcıda indirme yolu). |
| `C-profil/` | C · Profil düzeni | `c-top-*`: ad, figür, seviye ve XP çubuğu. `c-discovered-*`, `c-badges-*`: yatay kart şeritleri. `c-collection-*`: koleksiyon ekranı (ilerleme, seviye ve eser süzgeci). `c-name-*`: ad düzenleme ve doğrulama hatası. |
| `D-liderlik/` | D · Haftanın Gezgini | `d-board-on-*`: ziyaretçi listede (kendi sırası, kendi figürü). `d-board-off-*`: listede değil (varsayılan). Demo verisi «Örnek» etiketli. |

`A-rozetler/` içindeki profil görüntüleri Aşama C'den önce alındı: rozetler o zaman alt alta ızgaradaydı, şimdi şerit + koleksiyon (`C-profil/`).

## Kurallar (kısa)

- **Rozet seviyesi:** hikâye rozeti bronz, görev rozeti gümüş, `onSiteLabel` rozeti yerinde kazanılınca altın. Seviye görselde değil, ekranda çizilir (`apps/web/src/lib/badges.ts`).
- **Seviye:** puan defteri toplamından. Yolcu 0, Gezgin 60, Kâşif 200, Seyyah 450, Bilge Seyyah 800 (`apps/web/src/lib/levels.ts`).
- **Görünen ad:** kırpılır, 2–24 karakter, bağlantı/telefon/küfür/ekip adı yok. Uygulama ve sunucu aynı kuralı kullanır (`displayNameProblem`, `packages/domain`).
- **Hafta:** Pazartesi 00:00 Europe/Istanbul (`istanbulWeekStart`, `packages/domain`).
- **Liderlik:** isteğe bağlı, varsayılan kapalı; yalnız görünen ad, figür, haftalık puan. E-posta ve kimlik yok. Karar: `docs/BACKEND-DECISIONS.md` §11.74.
- Para, ödül, sandık, şans, süreli baskı, seri kaybetme yok.

## Nasıl doğrulandı

- `npm run typecheck` (web + API), `npm test` (236), `npm run build`, `npm run test:e2e` (son tam koşu: 165 geçti; düşen iki test seçici düzeltmesiyle geçti).
- Yeni birim testleri: rozet seviyesi, başarımlar, hafta sınırı, satır kaydırma, seviye, ad kuralı, api-client ad/figür/liste.
- Yeni e2e: `tests/badges.spec.ts`, `tests/profile-game.spec.ts`, `tests/weekly-board.spec.ts`; `site-tasks` ve `flows` kutlamaya göre güncellendi.

## Açık kalanlar

- **API testleri ve migration çalıştırılmadı:** bu bilgisayarda Docker yok. `npm run check` ile doğrulanmalı (`docs/API-HANDOFF.md`, 5 Kasım notları).
- **KVKK:** aydınlatma metni güncellendi (`apps/web/src/lib/legal-content.ts`); hukuki kontrol gerekiyor.
- iPhone Safari'de HTTPS üzerinden gerçek paylaşım menüsü denenmedi; yalnız indirme yolu test edildi.
- Canlı listede boş durum («Bu hafta ilk sen ol») yalnız kodda; API olmadan ekran görüntüsü alınamadı.
- Rozet görselleri kodla çizildi (`apps/web/scripts/draw-badges.mjs`); boyamalı sürüm için promptlar `docs/ROZET-PROMPTLARI.md`.
- Haritadaki pin tıklaması ve telefon kart sürükleme testleri ara sıra düşüyor (tekrar koşuda geçiyor); bu işle ilgisiz.
