# Bursa demo içerik paketi

Kaynak: `docs/documents-context/eserler/` altındaki eser paketleri (`eser.json`, `3d/model.json`, `icerik/`, `gecmisi-gor/`); okuyucular `services/api/scripts/editorial_reader.py` içinde (§11.38). Şehrin 3B ışığı ve eser sahnesi zemini `veri/sehir/<şehir>.json` dosyasından (`harita_isik`, `kimlik.sahne_ust / sahne_alt`, §11.42). Ham çalışma arşivi uygulama paketine alınmaz.

- 11 eser (Bursa 9, Konya 1, Hatay 1), 7 Draco sıkıştırmalı GLB; modeller temsili olarak etiketlenir. Dört eser yalnız fotoğraflıdır.
- 102 kaynaklı eser fotoğrafı, 37 tarihî fotoğraf eşleşmesi, 86 hikâye adımı, 18 görev.
- Aynı içeriğin tek kopyasıyla 316 Storage nesnesi: 149.804.081 bayt (142,9 MiB; 30 Ekim paketi, #67). Bu sayılar paketi anlatır; canlı katalog aktarım yapılana dek eski paketi gösterir.
- Güncel eser fotoğraflarının izin/künye alanları `icerik/fotograflar.md` dosyalarından, tarihî fotoğrafların kaynak/lisans alanları `gecmisi-gor.json` dosyalarından aynen aktarılır.
- Arşiv görselleri kırpılmadan gösterilir. Eşlenmiş bugünkü fotoğraf yokken karşılaştırma varmış gibi sunulmaz. Dış arşiv/CDN'den hotlink yapılmaz.
- Bedesten ve Orhan Bey Camii mevcut `bedesten` / `orhan-gazi` kimliklerini korur. Ziyaretçi kayıtları korunur; kurmaca çeşme/mektep kayıtları silinmeden taslağa alınır.
- Görevler ve rozetler `icerik/gorevler.json` dosyasından okunur (§11.44; 11 eserde 18 görev). Görev fotoğrafı `fotograflar.md` listesindeki bir dosya olmalı, `parca` / `evden.parca` 3B modeldeki parça adı olmalı; aksi halde aktarım durur. Yeniden aktarım görev ve rozetleri kimliğe göre günceller, dosyadan çıkanları siler, oyuncuların ilerlemesini kimliği duranlar için korur.
- Şehir kayıtları `veri/sehir/*.json` dosyalarının hepsinden okunur (§11.45): Bursa (varsayılan, harita burada açılır) ile eseri henüz olmayan Hatay, Konya, Kütahya (kürede «Yakında»). Dosyadaki `id` şehir adının küçük harfli, Türkçe karaktersiz hâli olmalı (`Kütahya` → `kutahya`); eseri olan her şehrin kaydı olmalı ve en çok bir şehir `varsayilan` olabilir, aksi halde aktarım durur.
- Geçmişi Gör eki (§11.47): `eserler/<eser>/gecmisi-gor/bugunku-esler.json` her eski fotoğrafın bugünkü eşini `fotoAtlasId` ile bağlar (şimdilik Ulucami: 1 eş), `izler.json` dosyasından yalnız `ornek: true` ve `durum: onaylandi` kayıtlar okunur (şimdilik Ulucami: 1 örnek; diğerleri atlanır ve sayılır, gerçek ziyaretçi katkısı dosyadan değil uygulamadan gelir). Her görselin `kaynakSatiri` ve `lisans` alanı aynen saklanır; görsel, kaynak satırı, lisans ya da `aciBenzerligi` (`ayni` / `yakin`) eksikse, bağlanan fotoğraf eserde yoksa aktarım durur. Hiçbir görsel kırpılmaz.
- Eser sırası (§11.48): `eserler/<eser>/eser.json` içindeki `sira` `displayOrder` olarak okunur (pozitif tam sayı, isteğe bağlı, aynı değer birden çok eserde olabilir). Haritada pinler bu sıraya göre çizilir; `sira` yoksa eser sırasızdır (`null`), sayı değilse ya da 1'den küçükse aktarım durur. Yeniden aktarımda değer güncellenir, kaldırılan `sira` sırasızlığa döner.
- Yalnız fotoğraflı eser (§11.51): `3d/` klasörü olmayan eser modelsiz içe aktarılır; `3d/` olup `model.json` yoksa hazırlama durur. Model parçası adı geçen görev, kart ya da kamera bu eserde aktarımı durdurur. `gecmisi-gor/` paketi yoksa Geçmişi Gör boş durumunu gösterir. Eserin şehri `eser.json → il`, şehrin envanter adı kaynak ve kitap fotoğrafı lisans satırına girer; şehir kaydında `envanter_adi` yoksa hazırlama durur.
- Hikâyenin `## Yalnız rotada` cümleleri ürüne alınmaz (§11.51). Şehir kaydında `desen` yoksa şehrin kimliği boş kalır ve ekranlar nötr çizilir.
- Orhan Gazi Türbesi paketinde anlatım henüz yoktur; fotoğraf, model ve tarihî görseller kullanılabilir. Diğer altı eserin anlatımı tarayıcının Türkçe sesli okumasını kullanır; hazır ses dosyası bu pakette bulunmuyor.

## Yeniden hazırlama ve aktarım

`icerik/gorevler.json` içindeki `_taslak: true` görevlerin içerik incelemesinin tamamlanmadığını belirtir. Hazırlama betiği bu durumda mevcut manifesti değiştirmeden durur. İçerik sorumlusu incelemeyi tamamladıktan sonra `_taslak: false` yapmalıdır; alanın bulunmadığı eski onaylı paketler çalışmaya devam eder. Taslakları boş görev listesine dönüştürmek mevcut rozet ve ilerlemeleri silebileceğinden dosyalar sessizce atlanmaz.

İçerik paketini çalışma ağacına alın veya ayrı bir klasörde hazırlayın. İlk komut yalnız manifest üretir; ikinci komut yalnız yerel doğrulama ve boyut raporu verir:

```sh
python3 services/api/scripts/prepare-demo-content.py \
  --content docs/documents-context --output /tmp/akar-demo-content.json
node --import tsx services/api/src/db/import-demo.ts \
  --manifest /tmp/akar-demo-content.json --content docs/documents-context
```

Uygulamak için API'nin `DATABASE_URL`, `DATABASE_SSL_CA` ve `STORAGE_*` ayarlarını güvenli ortamdan sağlayıp ikinci komuta `--apply` ekleyin. Sırlar manifestte veya Git'te tutulmaz.

Bu komut editoryal paketin yeniden yayımlanmasıdır: paketteki eserlerin katalog alanlarını günceller. Panelde yapılmış yeni editoryal düzenlemeler varsa önce pakete aktarın ve katalog yedeği alın. Ziyaretçi ilerlemesi/kullanıcı tablolarına dokunmaz.

**Parça kartları (§11.52).** Panel parça kartlarının sahibidir: aktarım veritabanında zaten olan eserin kartlarına dokunmaz, yalnız yeni oluşturduğu eserin kartlarını yazar (`--apply` çıktısındaki `partCardsKept` kartları korunan eserleri listeler; kuru çalıştırma veritabanını okumadığı için bu alanı vermez). Kartları dosyadaki hâline getirmek için komuta `--replace-part-cards` ekleyin; bu, panelde yapılmış kart düzenlemelerini siler.

Dosyalar önce içerik özetiyle adlandırılmış nesnelere yüklenir. Aynı baytlar yeniden yüklenmez. Ardından tüm katalog ilişkileri tek veritabanı işlemi içinde güncellenir; hata olursa katalog değişmez. Ortak dosyalar seed yönetimindedir: bir eserin kaldırılması başka bir eserin kullandığı dosyayı silemez. Yeni bir paket eski dosyaları kendiliğinden silmez; temizlik öncesinde kullanım kontrolü yapılmalıdır.

## Doğrulama

- 196 API ve 51 domain/istemci testi başarılı.
- Yeni aktarım testi: bayt tekilleştirme, tekrar çalıştırma, kaynakların korunması ve son eserde hata oluştuğunda tüm işlemin geri alınması.
- 23 web tarayıcı testi ve 6 gerçek API/Auth tarayıcı testi başarılı (kapsam dışı 1 web ve 2 quiz senaryosu atlandı).
- Masaüstü/mobil tarayıcı regresyonu: model yükleme sonrası canvas korunması, fotoğraf geçişi, arşiv lisansı ve yerel Draco çözücüsü.
- Web üretim derlemesi ve API/web tür kontrolleri başarılı.
