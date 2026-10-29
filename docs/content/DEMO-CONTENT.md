# Bursa demo içerik paketi

Kaynak: `docs/documents-context/eserler/` altındaki eser paketleri (`eser.json`, `3d/model.json`, `icerik/`, `gecmisi-gor/`); okuyucular `design/test-redmi9t-v2/hazirla.py` içinde (§11.38). Şehrin 3B ışığı ve eser sahnesi zemini `veri/sehir/<şehir>.json` dosyasından (`harita_isik`, `kimlik.sahne_ust / sahne_alt`, §11.42). Ham çalışma arşivi uygulama paketine alınmaz.

- 7 eser, 7 Draco sıkıştırmalı GLB; modeller temsili olarak etiketlenir.
- 58 kaynaklı eser fotoğrafı, 36 tarihî fotoğraf eşleşmesi, 59 hikâye adımı.
- Aynı içeriğin tek kopyasıyla 115 Storage nesnesi: 99.782.371 bayt (95,16 MiB; 29 Ekim paketi).
- Güncel eser fotoğraflarının izin/künye alanları `icerik/fotograflar.md` dosyalarından, tarihî fotoğrafların kaynak/lisans alanları `gecmisi-gor.json` dosyalarından aynen aktarılır.
- Arşiv görselleri kırpılmadan gösterilir. Eşlenmiş bugünkü fotoğraf yokken karşılaştırma varmış gibi sunulmaz. Dış arşiv/CDN'den hotlink yapılmaz.
- Bedesten ve Orhan Bey Camii mevcut `bedesten` / `orhan-gazi` kimliklerini korur. Ziyaretçi kayıtları korunur; kurmaca çeşme/mektep kayıtları silinmeden taslağa alınır.
- Orhan Gazi Türbesi paketinde anlatım henüz yoktur; fotoğraf, model ve tarihî görseller kullanılabilir. Diğer altı eserin anlatımı tarayıcının Türkçe sesli okumasını kullanır; hazır ses dosyası bu pakette bulunmuyor.

## Yeniden hazırlama ve aktarım

İçerik paketini çalışma ağacına alın veya ayrı bir klasörde hazırlayın. İlk komut yalnız manifest üretir; ikinci komut yalnız yerel doğrulama ve boyut raporu verir:

```sh
python3 services/api/scripts/prepare-demo-content.py \
  --content docs/documents-context --output /tmp/akar-demo-content.json
node --import tsx services/api/src/db/import-demo.ts \
  --manifest /tmp/akar-demo-content.json --content docs/documents-context
```

Uygulamak için API'nin `DATABASE_URL`, `DATABASE_SSL_CA` ve `STORAGE_*` ayarlarını güvenli ortamdan sağlayıp ikinci komuta `--apply` ekleyin. Sırlar manifestte veya Git'te tutulmaz.

Bu komut editoryal paketin yeniden yayımlanmasıdır: bu yedi eserin katalog alanlarını günceller. Panelde yapılmış yeni editoryal düzenlemeler varsa önce pakete aktarın ve katalog yedeği alın. Ziyaretçi ilerlemesi/kullanıcı tablolarına dokunmaz.

Dosyalar önce içerik özetiyle adlandırılmış nesnelere yüklenir. Aynı baytlar yeniden yüklenmez. Ardından tüm katalog ilişkileri tek veritabanı işlemi içinde güncellenir; hata olursa katalog değişmez. Ortak dosyalar seed yönetimindedir: bir eserin kaldırılması başka bir eserin kullandığı dosyayı silemez. Yeni bir paket eski dosyaları kendiliğinden silmez; temizlik öncesinde kullanım kontrolü yapılmalıdır.

## Doğrulama

- 196 API ve 51 domain/istemci testi başarılı.
- Yeni aktarım testi: bayt tekilleştirme, tekrar çalıştırma, kaynakların korunması ve son eserde hata oluştuğunda tüm işlemin geri alınması.
- 23 web tarayıcı testi ve 6 gerçek API/Auth tarayıcı testi başarılı (kapsam dışı 1 web ve 2 quiz senaryosu atlandı).
- Masaüstü/mobil tarayıcı regresyonu: model yükleme sonrası canvas korunması, fotoğraf geçişi, arşiv lisansı ve yerel Draco çözücüsü.
- Web üretim derlemesi ve API/web tür kontrolleri başarılı.
