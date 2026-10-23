# Vercel ve Supabase demo ortamı — 23 Ekim 2026

## Aktif kaynaklar

| Bileşen                     | Kurulum                                                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Web                         | [akar.tamerakdeniz.com](https://akar.tamerakdeniz.com), Vercel `akar-app`, `apps/web`                                  |
| API                         | [akar-api.vercel.app](https://akar-api.vercel.app/ready), Vercel `akar-api`, `services/api`, Node 24, Frankfurt `fra1` |
| Veritabanı / Auth / Storage | `akar-demo-frankfurt`, Supabase Free, `eu-central-1`                                                                   |
| SMTP                        | Hostinger, `info@tamerakdeniz.com`, `smtp.hostinger.com:465`; şifre yalnız Supabase'de                                 |
| Bakım                       | Supabase Cron `akar-maintenance`, dakikada bir korumalı `/internal/jobs/run` çağrısı                                   |

Web ve API `main`den otomatik dağıtılır. #34–#37 birleştirildi; geçici geçiş dalları silindi. Yeni dağıtımda iki projenin aynı merge commitinden READY olduğunu ve özel web domaininin yeni sürüme bağlandığını kontrol et.

Migration'lar `0000`–`0010` uygulandı. Canlı katalog yedi eser ve üç rota içerir. 94 tekil Storage nesnesi yaklaşık 73,5 MiB tutar; model, fotoğraf, tarihî görsel ve hikâye ayrıntıları [içerik rehberinde](../content/DEMO-CONTENT.md). `media` herkese açık, `uploads` özeldir. Yerel mock seed'i canlı katalog üzerine çalıştırma.

API transaction pooler üzerinden iki bağlantılık havuz kullanır; TLS zinciri ve hostname Supabase CA ile doğrulanır. Migration session pooler üzerinden ayrı çalıştırılır. Sırlar yalnız API Production ortamındadır; web yalnız API adresi, Supabase adresi ve publishable key alır. Kurulum sırası ve tüm değişkenler [API README](../../services/api/README.md#yayına-alma) içinde.

## Doğrulanan durum

#37 merge commit'i `3f0af96` için web/API READY; tüm GitHub kontrolleri başarılıydı. Canlı doğrulamada:

- `/ready` ve katalog `200`; web üzerinden API erişimi başarılı.
- 94 Storage nesnesi erişilebilir; yedi GLB masaüstünde, model/arşiv/hikâye mobil emülasyonda açıldı; sayfa hatası görülmedi.
- Kaynaklı eser açıklamaları ve arşiv lisansları görüntülendi.
- Son üç otomatik bakım çağrısı `200`, zaman aşımı yok. Anahtarsız çağrı önceki kurulum testinde `401` döndü.
- Hostinger e-postasıyla gerçek OTP girişi ve ilk yöneticinin panel erişimi kullanıcı tarafından doğrulandı.
- Yerel/CI testleri: 196 API, 51 domain/istemci, 23 web ve 6 API/Auth tarayıcı testi başarılı; kapsam dışı 1 web ve 2 quiz senaryosu atlandı.

Bu bir tarihli doğrulama kaydıdır; güncel dağıtım sonucunu Vercel/GitHub üzerinden kontrol et.

## Sunum öncesi

- Gerçek telefon donanımında modeli, sesli okumayı ve ağ koşullarını prova et; mobil otomasyon cihaz performansı ölçümü değildir.
- Hazır sekizinci eseri panelden ekleme/yayımlama akışını prova et. Orhan Gazi Türbesi anlatımı ve profesyonel ses kayıtları bu pakette yoktur.
- Supabase Auth ve Hostinger gönderim kotalarını panellerde kontrol et; yoğun giriş için ikisini birlikte planla. Katalog gezmek giriş gerektirmez.
- İki Storage kovasının toplam kullanımını ve indirme trafiğini kontrol et; ziyaretçi yüklemeleri için pay bırak.

## Eski bağlantıların durumu

Aktif kod ve dağıtım yeni Frankfurt projesine bağlıdır. Boş İrlanda Supabase projesi duraklatıldı; silinmedi. Eski Render hizmetinin bulut panelinden kapatılması doğrulanmadı; uygulama ona bağlı değildir. Bu rapor eski hesapların veya verilerin silindiği anlamına gelmez.
