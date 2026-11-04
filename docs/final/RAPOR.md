# AKAR · Mobil optimizasyon dalı raporu

Dal: `muhammedtalay/mobil-optimizasyon`. 4 Kasım 2026. `main` (`b13bc4b`) bu dala birleştirildi; dalda 49 commit, 315 dosya değişikliği var.

## Durum özeti
- **Hazır:** Aşağıdaki işler dalda ve push edildi.
- **Canlıda değil:** PR birleşip içerik aktarılmadan canlı site değişmez.
- **Yapılmayan denemeler:** API testleri (Docker kapalı), gerçek telefon, VoiceOver, çevirilerin insan incelemesi.

## 1. Performans
- Fotoğraflar gösterildiği boyutta iniyor; cihaza göre piksel oranı; telefonda buzlu cam yok.
- Harita önce, modeller sonra; aynı malzemeli parçalar birleşiyor; görüş dışındaki modeller bellekte bekliyor.
- Gölge model başına bir kez çiziliyor. Yönetim paneli ayrı parça olarak yükleniyor. Harita eser sayfasının arkasında bekliyor.
- **Pişmiş harita dosyaları:** Yedi eser gündüz ve gece ışığı dokuya pişmiş dosya kullanıyor, 17,5 zoomda sunum modeline geçiyor. Ulu Cami ölçümü: indirme 1,72 → 0,78 MB, kare (yazılımsal GPU) 150 → 75 ms, 8 modelde çizim çağrısı 272 → 16. Doku belleği arttı (10 → 23 MB). Telefonda ölçülmedi.
- **Sınır:** Ölçü sınırlarının tamamını iki temada yalnız Orhan Bey Hamamı geçti. Öbürleri güneş parlaması, Orhan Camii gecesi kafes saydamlığı, Koza Han 3,6 cm kutu farkı yüzünden kaldı; Muhammed'in kararıyla açıldı. Sınır gevşetilmedi.
- **Yakın zoomda kararma giderildi:** Pişmiş modeller gölge bayrağını açık bırakıyordu, yakın modelin gölgesi yanlış derinlik aralığında çiziliyordu. Yanlış çizim 45'ten 0'a indi.
- Kapalı iç mekân, örtü kapalıyken çizilmiyor (Ulu Cami, Bedesten, Türbe).

## 2. Telefon arayüzü
- Sekmeler, «Doğrulanmış», «Yanındayım», karşılama kartı ve harita çipleri kalktı. Üstte şehir menüsü.
- Dil tek yuvarlak düğme; aramaya basınca yalnız profil kalıyor.
- Hikâye: üstte model, ortada fotoğraf, altta katlanır küçük kart; dokunarak ilerleme; tek ses düğmesi; ☰ sayfası.
- Harita → kısa kart → eser sayfası ve geri dönüş kaydırmayla. Fotoğrafta iki parmak yakınlaştırma. Fotoğraflı pinler.
- Şehir menüsü: bütün Türkiye seçiliyken kırmızı. Rotaya kapatma düğmesi.

## 3. İpuçları
Baştan yazıldı. Telefon ve masaüstü ayrı; ekran başına bir ipucu; ziyaretçi dokunmadan geçmez; kapatan dokunuş cümle atlatmaz; yapılmış şey öğretilmez; 3D ipuçları model çizilince gelir.

## 4. Hikâye, açılar, ses
- Yedi eserde hikâye ve fotoğraf açıları içeriye ve yakına alındı. Yakın açılar duvarın arkasında kalmıyor; avize kamerayı engellemiyor; açık iç mekâna ışık eklendi.
- Ulu Cami 7. cümle (şadırvan) istenen açıda.
- **Panel:** «Açıyı kaydet» hemen sunucuya yazıyor. Kaydedilen açı `exact` taşıyor, duvar denetimi onu oynatmıyor; önizlemede kaydırma kapalı.
- Kayıtlı sesler demo içerikte de çalıyor, varsayılan erkek ses. Her cümlede fotoğraf ya da hareket var.
- Telefon kartında çok küçük «Kaynak» düğmesi.
- Akar akışı denendi: Bedesten yanına geliyor, altın gelir yolu çiziliyor.

## 5. Geçmişi Gör
Kaydırma ve yana çekme düzeltildi, foto alanı küçülüyor, 15 temsilî görsel «Temsili görsel» etiketiyle eklendi.

## 6. Tanıtım sayfası (`/tanitim`)
Yeni sayfa: gündüz beyaz, gece siyah zemin; dünyanın üst yayı ve sarı Türkiye sınırı; hareketli şehir madalyonları; uygulama ekranları; kaydırmalı Ulucami turu; «İster dinle, ister oku»; eski ve bugün kaydırıcısı; «Akar ne demek?»; TR/EN.

## 7. İngilizce içerik
11 eserde: ad, tanıtım, hikâye (96 cümle), parça kartı (58), fotoğraf başlığı, «Eser hakkında» (269 paragraf), görev, rozet; rota adı. İçerik akışına bağlandı. **Çeviri yapay zekâ desteğiyle yapıldı, kitabın İngilizcesiyle karşılaştırılmadı, insan incelemesi bekliyor.** Okuma katmanı kartları İngilizcede gösterilmiyor (mevcut kural). Fotoğraf alt metni kullanılmıyor.

## 8. Erişilebilirlik ve filtre
- «Aa»: yüksek kontrast, üç yazı boyutu. Kalıcı; cihazın kontrast tercihine uyuyor.
- Tür filtresi: Tümü, Dinî, Su, Eğitim, Ticari; harita da süzülüyor.
- Otomatik tarama (axe, WCAG A/AA): harita, eser, hikâye, profil, tanıtım temiz. Ayarlar açıkken ve İngilizcede taranmadı.

## 9. KVKK ve lisans
- Aydınlatma sayfası `/aydinlatma.html` (**taslak**; veri sorumlusu, iletişim, saklama süresi, aktarım dayanağı boş). İz Bırak'tan ve profilden bağlantı.
- Profilde «Hesabımı ve verilerimi sil» (`DELETE /v1/me`), yalnız giriş yapmış kullanıcıya. Canlı hesapta denenmedi.
- Fotoğraf yüklenmeden önce cihazda yeniden çiziliyor, EXIF gitmiyor.
- `docs/LISANSLAR.md`, `/lisanslar.html`, `scripts/lisans-tablosu.mjs`.

## 10. Belgeler ve temizlik
- README'ler güncellendi. `docs/final/`: demo senaryosu, jüri soruları, mimari, bu rapor.
- Kullanılmayan GLB'ler, biten notlar, 14–15 Ekim denetim raporları, eski istemler ve `eser-hakkinda-ozet.md` dosyaları Git'ten kaldırıldı; deneme görüntüleri Çöp Kutusu'nda (documents-context 5,0 → 3,8 GB).

## Test sonuçları
| Kontrol | Sonuç |
|---|---|
| Tip kontrolü, birim | Geçti (210 test) |
| Playwright, masaüstü ve telefon | 151 geçti, 31 atlandı, 0 kaldı |
| Panel düzenleme provası (demo içerik) | Değişiklik eser sayfasına yansıdı |
| Akar akışı | Görüntüyle doğrulandı |
| API testleri | **Çalışmadı, Docker kapalı** |
| Gerçek telefon, VoiceOver | **Yapılmadı** |

Son düzeltmeden sonra yalnız aydınlatma metni ve belgeler değişti; testler onlardan önce çalıştı.

## Bilinen eksikler
1. Ziyaret akışı bağlı değil: rota tikleri dolmuyor.
2. «Bildir» kayıt tutmuyor.
3. Canlıda İngilizce ses kaydı yok.
4. Çevrimdışı demo yok; harita ve ses internet ister.
5. Canlıdaki eski panel açılarında `exact` yok.
6. Türkçe kaynakta iki sorun: «1863-186» (Orhan Camii), Koza Han için 1505/1491 (Hamam metni).
7. Birkaç açı fotoğrafla birebir değil.

## Canlıya çıkış
Adımlar: `docs/documents-context/BIRLESTIRME_NOTU_MOBIL_OPTIMIZASYON.md`. Özet: API testleri, `mapBaked`, `hideClosedInterior`, `imagined`, migration'lar, `import-demo`, yeni açılar için `--replace-story-views` kararı, önbellek başlığı.
