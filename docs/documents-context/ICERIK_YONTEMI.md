# İçerik hazırlama yöntemi (`eserler/*/icerik/`)

19 Ekim 2026. Görev: `GOREV_DAGILIMI_15Ekim.md` → «Talha (içerik)». Bu dosya her eserin `icerik/` klasöründeki seçimlerin **neye göre** yapıldığını anlatır. Eser bazındaki ayrıntılar ve çelişkiler her dosyanın «Notlar» ve «Kaynak notu» bölümlerinde.

## 1. Kapsam

| Eser | Klasör | Tür | Hikâye | Eser hakkında | Fotoğraf |
|---|---|---|---|---|---|
| Ulucami | `ulu-cami/` | hero | 12 cümle | ~340 kelime | 12 + 1 akar |
| Yıldırım Bayezid Bedesteni | `yildirim-bayezid-bedesteni/` | hero | 10 cümle | ~260 kelime | 6 |
| Koza Han | `koza-han/` | hero | 12 cümle | ~300 kelime | 7 + 1 kitabe |
| Orhan Bey Camii | `orhan-bey-kulliyesi/` | rota | 8 cümle | ~175 kelime | 8 + 2 (yalnız hikâye) |
| Orhan Bey Hamamı | `orhan-bey-hamami/` | rota | 8 cümle | ~190 kelime | 5 |
| Emir Hanı | `emir-han/` | rota | 8 cümle | ~210 kelime | 6 |
| Orhan Gazi Türbesi | `orhan-gazi-turbesi/` | diğer (3D yok) | yok (görev dosyası: «hikâye yok») | ~95 kelime | 5 |

**Yapılmayanlar:**
- **`ayasofya/`:** Klasördeki notlar Sinan minarelerinden ve İstanbul'daki yapıdan söz ediyor; Bursa vakıf envanterinde değil. İçerik hazırlanmadı. Bu bir İznik Ayasofya çalışmasıysa söylemen yeterli; o zaman envanter Cilt 3 metni gerekir (`veri/metin/` altında yok).
- **`aday-eserler/` (27 eser):** Henüz eser klasörü düzenine alınmadılar; görev sırasına göre en son («kalan eserler», yalnız Eser hakkında + 3–5 fotoğraf). İstenirse aynı yöntemle yapılır.
- **Rota sırası:** Kesinleşmediği için «sonraki durak» cümlesi yalnız Ulucami'de var (Koza Han). Diğerlerinde kapanış cümlesi «bugün» bilgisidir.

## 2. Kaynak

- **Öncelik:** Bursa Vakıf Eserleri Envanteri (Vakıf Katılım'ın verdiği kaynak). Metin `veri/metin/bursa-envanteri-cilt-1.txt` / `-cilt-2.txt` içinden okundu; sayfa = **PDF sayfası** (`\f` ile ayrılmış sıra + 1). Kod: `E cilt-1 PDF s.25`.
- **Başka kaynak** yalnız envanterde olmayan bir bilgi için kullanıldı ve `W` kodlu ayrı paragrafta durur. Şu an tek örnek: Koza Han'da Bursa Alan Başkanlığı envanter föyü N19 (oda sayıları, avlu ölçüsü).
- **Kaynağı olmayan cümle yazılmadı.** Örneğin Ulucami'deki «dördüncü padişah» cümlesi çıkarıldı.
- **Kitap kendi içinde çelişiyorsa** sayı ya da yıl verilmedi, çelişki «Kaynak notu»na yazıldı. Örnekler:
  - Ulucami havuzu: onikigen / on altı kenarlı
  - Koza Han açılışı: 30 Eylül 1491 / Ekim 1491 / 1505
  - Orhan Gazi Türbesi yeniden yapımı: 1863 / 1868
  - Hamam soğukluğu: iki ölçü
- **Kopyalama yok:** Kitap cümleleri kendi cümlelerimizle anlatıldı. Kısa alıntılar yalnız «Notlar» bölümünde, «…» içinde ve sayfasıyla.
- **Her kaynak kodu metinle karşılaştırıldı:** Yazılan her bilgi için ilgili sayfada anahtar kelime aratıldı ve PDF sayfası doğrulandı.

## 3. Hikâye cümleleri

- **Uzunluk:** Hero 8–12, rota 5–8 cümle. Her cümle tek bilgi ve en fazla 20 kelime; en uzun cümle 13 kelime.
- **Akış:** kim, ne zaman → neden → dışarıdan ne görülür → içeride ne var → vakıf/akar bağı → bugün.
- **Akar cümlesi:** Her hikâyede en az bir tane var. Seçilen bağlar:
  - **Ulucami ← Bedesten:** C1 s.11.
  - **Bedesten → Ulucami:** C1 s.11; C2 s.29.
  - **Koza Han → II. Bayezid'in İstanbul külliyesi:** C2 s.8.
  - **Orhan Hamamı → Orhan Gazi İmareti:** C1 s.97, s.104.
  - **Emir Hanı:** Kantar geliri hanın gelir kaynağıydı (C1 s.108). Vakfiyedeki «Eski Bedesten» = Emir Hanı bağı ise ayrı paragrafta ve **Tarihsel çıkarım** etiketiyle.
- **Abartı yok:** «Muhteşem», «en güzel» gibi kitaptaki övgüler alınmadı. Övgü kitapta bir kişiye aitse adıyla verildi (Evliya Çelebi).

## 4. Güven etiketi (öneri; karar Muhammed'in)

- **Doğrulanmış:** Bilgi kitapta açıkça yazıyor. Kitabın başkasının anlatımını aktardığı durumlar da buna dahil (ör. «Evliya Çelebi'ye göre…»).
- **Tarihsel çıkarım:** Kitap «düşünülmektedir / tahmin edilmektedir» diyor, ya da bilgi iki ayrı bilgiden çıkarılıyor. Bu paragraflar doğrulanmış bilgiyle karıştırılmadı, ayrı paragraf yapıldı. Örnekler:
  - Ulucami'nin mimar adları
  - Ulucami doğu minaresinin tamamlanma dönemi
  - Emir Hanı = «Eski Bedesten»
- **Fotoğraflarda:** Eser eşlemesi gözle kesinleşmeyen fotoğraflar «Tarihsel çıkarım» etiketli:
  - `yildirim-bayezid-bedesteni/icerik/foto/02_ic-kuyumcular.jpg`
  - `orhan-gazi-turbesi/icerik/foto/04_tepeden-iki-turbe.jpg`

## 5. Fotoğraf seçimi

1. **Kaynak:** `veri/bursa-foto/` (Vakıf Katılım arşivi, 2400 px). Fotoğraflar **kopyalandı**, asıllar yerinde. Asıl dosya yolu ve zip numarası her `fotograflar.md` tablosunda. Arşiv dışında yalnız bir görsel var: Koza Han mescit kitabesi, Talha'nın çektiği fotoğraf.
2. **Esere ait mi?** Arşiv dosya adlarında eser adı olmadığı için klasördeki bütün fotoğraflar numaralı küçük resimlerle tek tek incelendi. Eşleme kitaptaki tarife göre yapıldı:
   - **Bedesten:** iki sıra yedişer kubbe.
   - **Koza Han:** avluda sekizgen köşk mescit; Ulucami minareleriyle birlikte görünen açık renk taş revaklar.
   - **Emir Hanı:** Ulucami'nin kuzeydoğusundaki ağaçlı avlu ve fıskiyeli şadırvan.
   - **Orhan Hamamı:** «Eski Aynalı Çarşı» girişi ve üzerindeki «Orhan Bey Hamamı» levhası.
   - **Orhan Gazi Türbesi:** kare plan, her cephede üç pencere, «Nilüfer Hatun» sanduka levhası.

   Başka hanlara (Fidan, Pirinç, Bali Bey) ait olabilecek tuğla revaklı han fotoğrafları kullanılmadı.
3. **KVKK:** Seçilen her fotoğrafa tam çözünürlükte bakıldı. Tanınabilir yüz ya da plaka yok. Çok küçük, uzaktaki figürler varsa tablonun Not sütununda yazıyor.
4. **Galeri sırası:** Görev dosyasındaki gibi dış kapak → iç genel → öne çıkan detay → ikinci dış → diğer detaylar. «—» işaretli fotoğraf galeriye girmez, yalnız hikâyede ya da kartta kullanılır.
5. **Kart:**
   - **evet:** Fotoğraf 3D modelin gösteremediği bir şeyi gösteriyor (iç mekân, mihrap, minber, kitabe, başka bir yapı).
   - **hayır:** Fotoğraf modelin zaten gösterdiği dış görünüş.
6. **Akar fotoğrafı:** Akar cümlesine akar yapının fotoğrafı konur ve başlığında yapının adı yazar. Örnekler:
   - Ulucami 13 → «Yıldırım Bayezid Bedesteni, havadan»
   - Orhan Camii 10 → «Orhan Bey Hamamı»

   Akarın gelir verdiği yapının fotoğrafı arşivde yoksa hanın kendi fotoğrafı kullanıldı ve not düşüldü: Koza Han → İstanbul'daki Bayezid Külliyesi; hamam → yıkılmış imaret.
7. **Sayı eksikleri:**
   - **Bedesten:** 6 fotoğraf var, hero için 8 gerekiyor. Arşivde kapı ve kitabe fotoğrafı yok.
   - **Koza Han:** Kuzey portal fotoğrafı yok. `ref/foto/` içindeki web fotoğraflarının lisansı belirsiz olduğu için kullanılmadı.
8. **Lisans sütunu:** Her fotoğrafta «Vakıf Katılım … arşivi (zip -NNN). Yayın izni yazılı olarak teyit edilmeli» yazıyor. Arşivde fotoğrafçı adı ve lisans koşulu yok.

## 6. Vurgu (3D)

- **Ad kaynağı:** Vurgu adları `eser.md`'deki «Parça adları» tablosundan değil, **modelin kendisinden** alındı (`3d/export/*.glb` içindeki nesne adları). Tablo ile model uyuşmuyor (ör. tabloda `Kubbeler`, modelde `Kubbeler_19`). Uygulamadaki vurgu ve kamera hedefi modeldeki adlara bağlı.
- **Kullanılan modeller:**
  - `ulu-cami_v22.glb`
  - `bedesten_v03.glb`
  - `koza-han_v11.glb`
  - `orhan-bey-camii_v05.glb`
  - `orhan-bey-hamami_v02.glb`
  - `emir-hani_v02.glb`
- **Adlar değişebilir:** Bedesten v04, cami v06, hamam v03 ve Emir v03 turları adları değiştirebilir. Yeni .glb gelince `hikaye.md` tablolarındaki Vurgu sütunu yeniden kontrol edilmeli. Sonnet'e `eser.md` tablosunu modeldeki adlarla güncellemesi söylenmeli.
- **Boş bırakılan vurgu:** Cümleye karşılık gelen bir model parçası yoksa vurgu boş bırakıldı. Bu üç durumda olur:
  - iç mekân cümlesi (kart gösterir)
  - tarih ya da kişi cümlesi
  - modelde olmayan parça (ör. Orhan Camii şadırvanı)
- **Birden çok parça:** Bir cümle iki parçayı birlikte gösteriyorsa ikisi virgülle yazıldı (hamam cümle 3: erkekler ve kadınlar soğukluğu).

## 7. Açı (kamera)

- **Panel işi:** Görev dosyasındaki hikâye tablosunda Açı sütunu yok. Açı panelde model döndürülüp «Açıyı kaydet» ile kaydediliyor (`FRONTEND_BACKEND_NOTLARI.md` §4). Bu yüzden her `hikaye.md`'nin sonunda ayrı bir **«Açı önerisi»** tablosu var: hedef parça, azimut, eğim, uzaklık ve neden.
- **Azimut:** 0° kameranın kuzeyde durup güneye baktığı açıdır; değer saat yönünde artar (90° = doğudan bakış).
- **Seçim kuralları:**
  1. İlk cümlenin açısı kapak fotoğrafının yönüne yakın seçildi, böylece fotoğraftan 3D'ye geçiş tutarlı olur.
  2. Sayı ya da plan anlatan cümlede (kubbe sayısı, avlu) yüksek eğim (70–80°, tepeden) seçildi.
  3. Kapı, pencere, kemer gibi detay cümlelerinde düşük eğim (5–15°) ve yakın kadraj seçildi.
  4. Kartlı iç mekân cümlelerinde açı değişmez, bir önceki açıda kalır; böylece kamera boşuna oynamaz.
  5. Son cümlede ilk açıya dönülür.
- **Yönler:** Yön gerektiren açılar (ör. Ulucami → Bedesten yönü) harita konumundan tahmin edildi ve tabloda «doğrulanmalı» yazıyor. Bedesten'in koordinatı klasörlerde yok.

## 8. Senin ya da Muhammed'in kararı gerekenler

1. **Güven etiketleri:** Tümü öneri.
2. **Fotoğraf lisansı:** Vakıf Katılım'dan yazılı izin, varsa fotoğrafçı adı.
3. **Koza Han kitabesi:** Kitabe fotoğrafındaki altyazı kırpılmalı; fotoğraf Talha'nın, kullanım uygun mu?
4. **Ayasofya klasörü:** Hangi yapı ve içerik gerekiyor mu?
5. **Rota sırası:** Kesinleşince «sonraki durak» cümleleri eklenir.
6. **Modellerin yeni sürümleri:** Vurgu adları kontrol edilmeli (§6).
7. **İngilizce çeviri:** Türkçe onaylandıktan sonra yapılacak (görev dosyası).
