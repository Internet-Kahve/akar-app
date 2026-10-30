# AKAR · İngilizce içerik: dosya biçimi ve uygulamaya bağlanması (29 Ekim 2026)

**Durum:** Altyapı hazır, çeviri yok. Dil seçici (TR \| EN) bütün içeriği bu dosyalardan okur. Çevirisi olan metin İngilizce, olmayan Türkçe görünür. EN seçiliyken eksik varsa kullanıcıya bir kez söylenir.

**Kim için:** çevirmen (içerik ekibi) ve ürün ekibi (Tamer, Burak).

## Neden ayrı dosyalar

- Türkçe dosyalara (`hikaye.md`, `parcalar.md` …) sütun eklenmez. Ürünün içe aktarması ve eski betikler o dosyaları sütun sırasına göre okuyor; yeni sütun onları bozar.
- Çeviri tek bir klasörde toplanır: `eserler/<eser>/icerik/en/`. Çevirmen yalnız oraya yazar.
- Her satır Türkçe kayda **anahtarla** bağlanır: cümle numarası, kartın parça adları, fotoğraf dosya adı, bölüm başlığı. Sıra değişse de eşleşme bozulmaz. Eşleşmeyen satırı `hazirla.py` uyarıyla bildirir, sessizce atlamaz.

## Dosyalar

| Ne | Dosya | Biçim | Anahtar |
|---|---|---|---|
| Eser adı, kısa tanıtım | `eserler/<eser>/eser.json` | `"ad_en"`, `"uzun_ad_en"`, `"kisa_en"` alanları | aynı kayıt |
| Hikâye cümleleri | `icerik/en/hikaye.md` | `\| # \| Cümle (EN) \|` | cümle numarası (`hikaye.md`'deki #) |
| 3D parça kartları | `icerik/en/parcalar.md` | `\| Parçalar \| Başlık (EN) \| Metin (EN) \|` | «Parçalar» hücresi, Türkçedekiyle birebir |
| Fotoğraf başlıkları | `icerik/en/fotograflar.md` | `\| Dosya \| Başlık (EN) \| Kısa metin (EN) \| Alt metin (EN) \|` | dosya adı |
| Eser hakkında | `icerik/en/eser-hakkinda.md` | `## <Türkçe başlık> \| <English title>`, altında paragraflar (boş satırla ayrılır) | Türkçe bölüm başlığı. Paragraf sayısı Türkçedekiyle aynı olmalı; değilse bölüm atlanır ve uyarı verilir |

**Kaynak ve güven:** Kaynak (`E cilt-1 PDF s.25`) ve güven etiketi Türkçe kayıttan gelir, çeviride tekrar yazılmaz. Çeviri anlamı değiştirmez, yeni bilgi eklemez.

**Okuma katmanı:** «Eser hakkında»daki özet, rakam, alıntı, zaman çizelgesi ve terimler Türkçe kitap metninden birebir seçmedir. Bu yüzden İngilizcede gösterilmez; İngilizce tam metin düz görünür. 3D açıları iki dilde de çalışır.

**Ses:** Anlatımda ve parça kartında gösterilen metin İngilizceyse ses de İngilizce okunur (`en-US`); değilse Türkçe.

## Prototipte nasıl çalışıyor

- `hazirla.py` → `en_oku()`: bulunan çeviriyi Türkçe kaydın yanına `<alan>_en` olarak yazar (`metin_en`, `baslik_en`, `kisa_en`, `alt_en`). Eser başına kaç alan bulunduğunu `en_alan` olarak yazar.
- `app.js` → `dilVeri()`: dil değişince kayıtların görünen alanı o dildeki metinle değiştirilir; Türkçesi `_tr`'de saklanır. Bütün ekranlar (harita pinleri, kartlar, anlatım, parça kartı, galeri, Eser hakkında) tek yerden dile bağlanır.
- Seçim cihazda saklanır (`akar.dil`).
- `<html lang>`: içerik tamamen İngilizceyse `en`, karışıksa `tr`.

## Ürüne karşılık

Ürünün veritabanında İngilizce alanların bir kısmı zaten var:

| İçerik | Ürün alanı | Durum |
|---|---|---|
| Eser adı, tanıtım | `sites.nameEn`, `descriptionEn` | var |
| Hikâye cümlesi | `story_blocks.text_en` | var |
| Hikâye sesi (İngilizce) | `narrations` (`lang=en`, §11.56) | var |
| Kart (hikâye kartı) | `cards.title_en`, `body_en` | var |
| Fotoğraf | `SitePhoto.titleEn` | var |
| **Parça kartı** | yeni tablo `site_parts` (ENTEGRASYON §5.1): `title_en`, `body_en` | eklenmeli |
| **Eser hakkında bölümü** | `site_sections`: `title_en`, `body_en` | eklenmeli |
| Görev ve rozet | `quizzes` … `_en` alanları | eklenmeli (prototipte henüz dile bağlı değil) |
| Arayüz yazıları (düğmeler, başlıklar) | i18n sözlüğü | ürün kararı (prototipte çevrilmedi) |

İçe aktarma (`prepare-demo-content.py`) `icerik/en/` dosyalarını okuyup bu alanlara yazmalı. Prototipteki `en_oku()` örnek alınabilir.
