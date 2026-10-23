# Vercel ve Supabase demo kurulumu — 23 Ekim 2026

## Kaynaklar

| Bileşen | Kurulum |
| --- | --- |
| Web | [akar.tamerakdeniz.com](https://akar.tamerakdeniz.com), Vercel `akar-app`, `apps/web` |
| API | [akar-api.vercel.app](https://akar-api.vercel.app), Vercel `akar-api`, `services/api`, Node 24, Frankfurt `fra1` |
| Veritabanı / Auth / Storage | `akar-demo-frankfurt`, Supabase Free, `eu-central-1` |
| SMTP | Hostinger, `info@tamerakdeniz.com`, `smtp.hostinger.com:465`; şifre yalnız Supabase'de |
| İlk yönetici | Tamer'in hesabı OTP ile giriş yaptı; veritabanındaki `admin` rolü ve panel erişimi doğrulandı |

Supabase migration'ları `0000`–`0010` uygulandı. Örnek katalogda altı eser ve üç rota var.
Seed dosyası gerçek fotoğraf, ses veya GLB içermez. Sunum medyası ayrıca panelden yüklenmeli.
`media` kovası herkese açık, `uploads` kovası özeldir. Dosya yüklemesi imzalı URL ile doğrudan Storage'a gider.

API, transaction pooler üzerinden iki bağlantılık havuz kullanır; TLS sertifika zinciri ve hostname
Supabase CA ile doğrulanır. Migration'lar session pooler üzerinden elle uygulanır.
Sırlar yalnız API Production ortamında bulunur; web'e yalnız API adresi, Supabase adresi ve publishable key verilir.

Üretim branch'i hâlâ `main`; bu demo dağıtımları incelemedeki `tamerakdeniz/vercel-api` dalından yapılmıştır.
PR #35, PR #34 üzerine kuruludur; değişiklikler main'e alınmadan eski main'i yeniden dağıtmak bu kurulumu geri alır.

## Doğrulama

API üretim commit'i `e9d6113`, web üretim commit'i `423f811` olarak doğrulandı.
API ve web dağıtımları READY; `/ready` ve katalog `200`, izin verilen web origin'i için CORS doğru.
Bakım çağrısı anahtarsız `401`, geçerli anahtarla `200` döndü. Supabase Vault ve dakikalık
`akar-maintenance` işi etkin; 15:07 ve 15:08 (Türkiye saati) otomatik çağrıları `200` döndü.
Son API dağıtımında yapılan hata/fatal log taramasında kayıt bulunmadı.

- Hostinger e-postası kullanıcıya ulaştı; gerçek OTP girişi ve admin yetkisinin alınması doğrulandı.
- Mobil web görünümü yeni API üzerinden yüklendi; altı eser ve üç rota canlı veritabanından okunuyor.
- 195 API testi başarılı; web ve API TypeScript kontrolleri başarılı.
- Derlenen Vercel handler'ı, `require(ESM)` kapalıyken gerçek veritabanına bağlanıp katalog okuyabildi.
- 1 MiB imzalı Storage yükleme ve okuma testi başarılı; doğrulama dosyaları kaldırıldı.
- Supabase giriş ve kayıt e-postaları OTP kodunu gösterir. Projedeki 8 haneli kod ayarı korunur;
  web alanı hem eski hem yeni uzunlukları kabul eder.

## Sunum öncesi

- Gerçek eser dosyalarıyla panelden ekleme/yükleme akışını prova et.
- 6–7 eserin fotoğraf, ses ve GLB dosyalarını yükle; örnek katalog dosyaların yerine geçmez.
- Hostinger hPanel'de posta kutusunun gönderim limitini kontrol et. Ücretsiz/deneme kutularında
  günlük limit 100 olabilir; Business Starter için belgelenen limit 1000/gündür. Güncel hesap kotası esas alınır.
- Supabase'in özel SMTP sonrası varsayılan e-posta sınırı saatte 30'dur. Sunumda yoğun giriş bekleniyorsa
  hem bu sınırı hem Hostinger kotasını birlikte planla. Katalog gezmek giriş gerektirmez.
- 7–8 eser × en çok 50 MB = 350–400 MB kalıcı medya; geçici dosyalar ve ziyaretçi fotoğrafları için pay bırak.
  Depolama ile indirme trafiği ayrı kotalardır.

Hostinger kota kaynağı: https://www.hostinger.com/support/4625828-parameters-and-limits-of-hostinger-email/

## Eski bağlantılar

Kod ve aktif dağıtım ayarları yeni projeyi kullanır. Önce oluşturulan boş İrlanda Supabase projesi
silinmedi, duraklatıldı. Eski Render hizmetinin bulut panelinden kapatılması bu kurulumda doğrulanmadı;
uygulama artık ona bağlı değildir. Eski projelerdeki veriler otomatik silinmedi.
