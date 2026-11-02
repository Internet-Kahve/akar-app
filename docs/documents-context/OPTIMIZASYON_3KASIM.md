# Telefon performansı — 3 Kasım 2026

**Dal:** `muhammedtalay/mobil-optimizasyon` (main 2be3e8d'den).
**Neden:** uygulama telefonda çok kasıyordu (Muhammed).
**Tanıtım sayfasına dokunulmadı** (`public/tanitim/`).

## Nasıl ölçüldü

Üretim derlemesi (`next build`, demo içerik) üzerinde Playwright kullanıldı. Ayarlar:
- 390 × 844, piksel oranı 2,75 (orta sınıf Android);
- CPU 4 kat yavaş, ağ «hızlı 4G»;
- her ekran 15 saniye yüklendi, ardından 5 saniye boşta beklendi.

Test tarayıcısı yazılım GPU'su kullanıyor. Ekran kartı yükü (çizim hızı) bu yüzden ölçülemedi; o kısım koddan değerlendirildi. Gerçek telefonda doğrulanmalı.

| Ekran | Önce | Sonra |
|---|---|---|
| Harita açılışı, indirilen | 16,9 MB (görsel 11,6 MB) | 5,6 MB (görsel 0,27 MB) |
| Eser detayı 3D, indirilen | 4,1 MB | 2,5 MB |
| Harita, boşta CPU (yükleme bitince) | %0 | %0 |
| Ziyaretçinin JS'i (sıkıştırılmış) | 0,89 MB | 0,87 MB |

Sayfalar yüklenmeyi bitirince boşta işlemci serbest; arka planda sürekli dönen bir döngü yok. Kasma iki yerden geliyordu:
- **yükleme anı:** büyük fotoğraflar ve shader derleme;
- **hareket:** ekran kartı yükü (piksel oranı, buzlu cam, gölgeler).

## Yapılanlar (bu dal)

1. **Fotoğraflar gösterildikleri boyutta** (`lib/image-size.ts → sized`).
   - Listedeki 64 px küçük resimler için 2400 px'lik, 1,1–1,5 MB'lık asıllar iniyordu.
   - Artık Next'in görsel küçültücüsünden (`/_next/image`), gösterim genişliğinin yaklaşık iki katında geliyorlar: liste, kısa kart, detay, galeri, hikâye, parça kartı, açı fotoğrafı, Geçmişi Gör, Yaşayan hafıza, Rotam, karşılama, bulmaca.
   - `next.config.ts`'te Supabase deposu (`*.supabase.co/storage/v1/object/public/**`) izinli adres olarak eklendi.
   - Ekran dışındakiler `loading="lazy"` ve `decoding="async"` ile yükleniyor.
2. **Mobilde buzlu cam yok.** Bulanıklık, altında harita ya da model her kıpırdadığında yeniden hesaplanıyordu. Mobilde aynı yüzeyler temanın neredeyse opak `--glass-solid` rengini kullanıyor; masaüstünde cam duruyor.
3. **Cihaza göre çizim** (`lib/device.ts`). Bellek ≤ 4 GB ya da çekirdek ≤ 4 ise cihaz «sade» sayılıyor (Redmi 9T bu gruba giriyor).
   - **Harita:** piksel oranı en çok 2, sade cihazda 1,5. Telefonlar 3,5'e kadar bildiriyor; çizilen piksel yarıdan fazla azaldı.
   - **Haritadaki modeller:** sade cihazda canlı gölge yok. Zemindeki pişmiş gölge kalıyor.
   - **Eser 3D'si:** sade cihazda piksel oranı 1,25, kenar yumuşatma ve canlı gölge yok.
4. **Shader derlemesi ilk çizimden önce ve arka planda** (`compileAsync`).
   - Eser 3D'si ilk çizimde shader'ları eş zamanlı derliyordu; yavaşlatılmış CPU'da bu sayfayı 1,7–3,3 sn donduruyordu.
   - Artık derleme bitene kadar yükleme kartı açık kalıyor.
   - Test tarayıcısı paralel derlemeyi desteklemediği için kazanç burada görünmüyor; Android Chrome'da `KHR_parallel_shader_compile` çoğunlukla var.
5. **Yönetim paneli ayrı parçalarda** (`next/dynamic`). Yaklaşık 186 KB kaynak kod ziyaretçinin ilk indirmesinden çıktı. Sıkıştırılmış hâlde kazanç küçük: yaklaşık 20 KB.
6. **Eser kartı çizim sırasında DOM ölçmüyor.** «Tam açık mı» hesabı her React çiziminde düzen okuyordu; artık yalnız kart yüksekliği değişince ölçüyor.

## Önerilen, başkasına bağlı (Burak / Tamer)

1. **Storage önbelleği.** Supabase dosyaları `cache-control: private, no-cache` dönüyor; telefon aynı fotoğrafı ve modeli her ziyarette yeniden doğruluyor.
   - Dosyalar içerik özetiyle adlandırıldığı için (`<sha256>.jpg`) hiç değişmez.
   - `services/api/src/modules/media/storage-s3.ts → PutObjectCommand`'a `CacheControl: "public, max-age=31536000, immutable"` eklenmeli.
   - Mevcut dosyaların başlıkları bir kerelik yeniden yazılmalı (kopyala-üzerine yaz ya da yeniden aktarım).
2. **Küçük sürümler kaynakta.** Bu dal canlıda Vercel'in görsel küçültmesini kullanıyor.
   - Vercel planının görsel küçültme kotası kontrol edilmeli. Katalogda yaklaşık 350 fotoğraf var, her biri 2–3 genişlikte isteniyor.
   - Kalıcı çözüm: içe aktarmada 480 px ve 1600 px WebP sürümler üretip Storage'a koymak. Ya da Supabase'in görsel dönüşümü (ücretli planda).
3. **Haritadaki modeller 3,8 MB.** Harita açılışında yedi modelin uygulama GLB'si iniyor.
   - Seçenekler: daha düşük ayrıntılı harita sürümleri (3D ekibi), ya da yalnız görünen modellerin harita çizildikten sonra yüklenmesi (bizde, bir sonraki iş).
4. **Yazı tipleri 277 KB** (Inter'in dört kalınlığı, `latin-ext` dahil, ve Cormorant). Tek değişken Inter dosyasıyla yarıya inebilir; önbelleğe alındıkları için öncelik düşük.

## Doğrulama

- `npm run typecheck` temiz; `npm test` 198/198.
- Playwright tam tur 130 geçti, 6 atlandı (masaüstü + mobil). Masaüstü görünüm değişmedi.
- **Gerçek telefonda deneme şart:** harita kaydırma, eser 3D, hikâye, gece teması.
