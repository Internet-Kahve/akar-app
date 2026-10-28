# Görev: Ulucami · Geçmişi Gör'e «bugünkü eş» fotoğrafları ve bir örnek İz Bırak katkısı ekle

Sen AKAR adlı bir hackathon projesinde çalışıyorsun (KÖK&KOD, 42 Türkiye × Vakıf Katılım; final 7–8 Kasım 2026). AKAR, Bursa'daki vakıf eserlerini harita, 3D model, sesli hikâye ve eski fotoğraflarla anlatan bir web uygulaması. Bu görevde yalnız **Ulucami**'nin **Geçmişi Gör** ekranıyla uğraşacaksın.

Her adımda neyi neden yaptığını kısaca yaz. Emin olmadığın her eşleştirmeyi «yakın açı» olarak işaretle ya da hiç ekleme; uydurma eşleştirme, uydurma kullanıcı ya da uydurma bilgi yasak.

---

## 1. Amaç

Geçmişi Gör ekranında eski bir fotoğraf seçildiğinde, aynı yerden ve aynı açıdan çekilmiş **bugünkü** bir fotoğraf varsa, ikisi bir **kaydırıcıyla** karşılaştırılabilsin (Figma'daki «eşi var, kaydırıcı» ekranı). Bugünkü fotoğraf iki kaynaktan gelir:

1. **Admin eşi (birkaç tane):** Vakıf Katılım'ın envanter fotoğraf arşivinden, eski fotoğrafla aynı ya da çok yakın açıdan çekilmiş fotoğraflar. Ekibin seçip eklediği eşlerdir.
2. **Kullanıcı katkısı (bir tane, örnek):** Bir kullanıcının kamerada eski fotoğrafı hizalayıp çektiği ve moderasyondan geçmiş bir «İz Bırak» katkısı. Bu, «kullanıcı da bugünkü eşi üretebilir» akışını gösterir.

Kural (veri modelinden): Bir eski fotoğrafın admin eşi varsa o gösterilir. Yoksa onaylanmış en yeni «aynı açı» katkısı gösterilir. Hiçbiri yoksa ekran bugünkü gibi (eşsiz) kalır.

---

## 2. Proje yapısı ve kesin kurallar

Kök klasör: `akar-app/docs/documents-context/` (aşağıda **DC**).

| Ne | Yol |
|---|---|
| Çalışacağın prototip | `DC/design/test-redmi9t-v2/` (`app.js`, `app.css`, `hazirla.py`, `sunucu.sh`, `BENIOKU.md`) |
| Ulucami eski fotoğrafları (Foto Atlas) | `DC/eserler/ulu-cami/gecmisi-gor/gecmisi-gor.json` + `gorseller/fa-<id>.webp` ve `fa-<id>_k.webp` |
| Bu json'u üreten betik | `DC/veri/fotoatlas/gecmisi_gor_uret.py` (+ `BENIOKU.md`, `IZIN_DURUMU.md`) |
| Ulucami uygulama fotoğrafları (bilgileriyle) | `DC/eserler/ulu-cami/icerik/foto/` + `icerik/fotograflar.md` (35 fotoğraf) |
| Envanter fotoğraf arşivi (asıllar, 2400 px) | `DC/veri/bursa-foto/I. ve II. Cilt - Osmangazi/Ulucamii Klasörü/` (111 fotoğraf) + `DC/veri/bursa-foto/_manifest.csv` (zip numarası) |
| Veri modeli ve kurallar | `DC/FRONTEND_BACKEND_NOTLARI.md` §1 (`gecmisi_gor`, `katki`, `gorsel` tabloları), §12 |
| Figma | dosya `HGTgq5vRXVqhVO9TcR9wBe` (akar-yeni) |

**Kesin kurallar:**

1. **`DC/design/test-redmi9t/` (v1) klasörüne dokunma.** Yalnız `test-redmi9t-v2` ve aşağıda adı geçen veri dosyaları değişir.
2. **`akar-app/apps/` ve `services/` klasörlerine dokunma.** Oralar başka ekip üyelerinin kodu.
3. **Kodda esere özel değer olmayacak.** `app.js` ve `hazirla.py` içine «ulu-cami», bir fotoğraf adı ya da bir Foto Atlas numarası yazma. Her şey veri dosyalarından okunur. Aynı yöntem yarın Koza Han'da veri dosyası ekleyerek çalışmalı.
4. **`gecmisi-gor.json` dosyasını elle düzenleme.** O dosyayı `gecmisi_gor_uret.py` üretiyor; elle eklediğin her şey bir sonraki çalıştırmada silinir. Yeni bilgiler **ayrı dosyalara** gider (bkz. §4).
5. **Asıl fotoğraflara dokunma.** Arşivden yalnız kopyalayıp küçült.
6. **Dosya silme.** Silmen gereken bir şey olursa `_eski/` alt klasörüne taşı ve raporda yaz.
7. Lisans: Envanter arşivi ve fotoğrafları Vakıf Katılım proje için verdi, kullanılabilir. Künye her zaman «Fotoğraf: Bursa Vakıf Eserleri Envanteri». Eski fotoğrafların künyesi ve lisansı `gecmisi-gor.json`'daki gibi kalır. `duzenlenebilir: false` olan eski fotoğraf kırpılmaz ve «ekranı doldur» yapılmaz.

---

## 3. Mevcut durum (kontrol edildi, 28 Ekim 2026)

Ulucami'de 21 eski fotoğraf var. Hiçbirinin bugünkü eşi yok. Prototip, eşi olan fotoğraf için kaydırıcıyı henüz göstermiyor (`app.js` içinde «Bugünkü eşi olan fotoğraf (A1b) henüz yok» notu var). İz Bırak gönderimi ve Yaşayan hafıza prototipte yok; «İz Bırak» düğmesi yalnız bir uyarı (toast) gösteriyor.

Eski fotoğraflar (Foto Atlas no · tarih · iç mekân mı · başlık):

| no | tarih | iç | başlık |
|---|---|---|---|
| 49845 | 1862 | – | Bursa Ulu Cami ve Çevresi Genel Görünümü |
| 41844 | 1865–75 | iç | Bursa Ulu Cami İçinden Görünüm |
| 34618 | 1870–90 | – | Yeşil Cami'den Bursa Görünümü |
| 14239 | 1875–86 | – | Bursa Ulu Cami ve Çevresi |
| 14276 | 1875–85 | iç | Bursa Ulu Cami Minberi |
| 14286 | 1875–84 | iç | Bursa Ulu Cami Mihrabı |
| 14290 | 1875–85 | iç | Bursa Ulu Cami |
| 13048 | 1890–1900 | – | Bursa Ulu Cami ve Çevresi |
| 15211 | 1890–1900 | – | Bursa Ulu Cami ve Çevresi |
| 15226 | 1890–1900 | iç | Bursa Ulu Cami İçinden Görünüm |
| 69125 | 1900 | – | Ulu Camii Avlusu |
| 42727 | 1908–34 | – | Bursa Ulu Cami Caddeden Görünümü |
| 47170 | 1908–34 | – | Üftade Tepesinden Ulu Cami Yönü |
| 47954 | 1908–34 | – | Bursa Ulu Cami Güneyden Görünümü |
| 65824 | 1930'lar | – | Bakırcılar Çarşısından Ulu Camii |
| 65141 | 1935–39 | – | Üftade'den Bakış |
| 65534 | 1947 | – | Atatürk Caddesi ve Ulu Camii, İsmet İnönü Ziyareti |
| 65828 | 1970–89 | – | Atatürk Caddesi ve Ulu Camii |
| 65438 | 1989 | – | Tophane Yamaçlarından Ulu Camii |
| 25044 | bilinmiyor | iç | Bursa Ulu Cami İç Görünümü |
| 66080 | bilinmiyor | – | Okçu Baba Türbesinden Ulu Camii ve Bursa Genel Görünüş |

---

## 4. Veri: iki yeni dosya (eser başına)

### 4.1 `DC/eserler/ulu-cami/gecmisi-gor/bugunku-esler.json` (admin eşleri)

```json
{
  "_aciklama": "Eski fotoğrafların bugünkü eşleri (ekip seçti). gecmisi-gor.json'u üreten betik bu dosyaya dokunmaz. Görseller bugun/ klasöründe.",
  "esler": [
    {
      "fotoAtlasId": 14276,
      "gorsel": "bugun/es-14276.webp",
      "kucuk": "bugun/es-14276_k.webp",
      "genislik": 1600, "yukseklik": 1200,
      "aciBenzerligi": "ayni",
      "aciNotu": "Aynı yan açıdan, merdiven ve köşk aynı yerde; bugünkü fotoğraf biraz daha geniş.",
      "kaynakDosya": "veri/bursa-foto/I. ve II. Cilt - Osmangazi/Ulucamii Klasörü/<asıl dosya adı>",
      "kirpma": { "x": 0, "y": 0, "w": 2400, "h": 1800 },
      "kaynakSatiri": "Fotoğraf: Bursa Vakıf Eserleri Envanteri",
      "lisans": "Vakıf Katılım, Bursa Vakıf Eserleri Envanteri fotoğraf arşivi (zip -0NN). Proje için verildi; kullanılabilir.",
      "ekleyen": "AKAR ekibi",
      "eklendi": "2026-10-28"
    }
  ]
}
```

- `aciBenzerligi`: `"ayni"` ya da `"yakin"`. **«ayni»** yalnız şu durumda: çekim noktası ve bakış yönü gözle aynı, aynı mimari öğeler kadrajda benzer yerde. Yükseklik, mercek ya da yön belirgin farklıysa **«yakin»**. Bundan da uzaksa **ekleme**.
- `kirpma`: Bugünkü fotoğrafı eski fotoğrafın kadrajına yaklaştırmak için asıl dosyadan kesilen dikdörtgen (piksel). Oran eski fotoğrafın oranına eşit olmalı ki kaydırıcıda iki görsel üst üste otursun. Yalnız **bugünkü** fotoğraf kırpılır; eski fotoğrafa dokunulmaz. Kırpma gerekmiyorsa bu alanı koyma.
- Görsel üretimi: `gecmisi_gor_uret.py`'deki küçültme ayarlarının aynısını kullan (WebP, uzun kenar ve kalite o betikteki gibi; `_k` küçüğü de aynı). Bu ayarları betikten oku, tahmin etme.
- Lisans satırındaki zip numarasını `_manifest.csv`'den al (dosya adına göre).

### 4.2 `DC/eserler/ulu-cami/gecmisi-gor/izler.json` (kullanıcı katkıları, İz Bırak)

```json
{
  "_aciklama": "İz Bırak katkıları. Üründe katki tablosu; prototipte yalnız onaylanmış örnekler. ornek=true olan kayıt gerçek bir kullanıcıdan değil, ekipten gelir ve arayüzde «Örnek katkı» diye işaretlenir.",
  "izler": [
    {
      "id": "iz-ulu-001",
      "kullanici": "AKAR ekibi",
      "ornek": true,
      "metin": "Eski fotoğrafı kameraya bindirip aynı yerden çektim.",
      "gorsel": "izler/iz-ulu-001.webp",
      "kucuk": "izler/iz-ulu-001_k.webp",
      "durum": "onaylandi",
      "tarih": "2026-10-28",
      "ayniAciFotoAtlasId": 69125,
      "aciBenzerligi": "yakin",
      "kaynakSatiri": "Fotoğraf: AKAR ekibi (örnek katkı)"
    }
  ]
}
```

**Örnek katkının fotoğrafı (önemli, dürüstlük):**

- En iyisi: ekipten biri gerçekten o noktaya gidip çektiği bir fotoğraf. Bu dosya `DC/eserler/ulu-cami/gecmisi-gor/izler/_ham/` içinde varsa onu kullan.
- Yoksa: envanter arşivinden uygun bir fotoğrafı kullanabilirsin, **ama** o zaman `kullanici` = «AKAR ekibi», `ornek` = true, `kaynakSatiri` = «Fotoğraf: Bursa Vakıf Eserleri Envanteri (örnek katkı olarak gösteriliyor)». Uydurma bir kişi adı (ör. «Zeynep A.») **yazma**; arşiv fotoğrafını bir kullanıcının çektiği gibi sunma.
- Örnek katkının eşleştiği eski fotoğraf, admin eşi **olmayan** bir fotoğraf olmalı. Böylece kural (admin eşi yoksa onaylı katkı) ekranda görünür.
- Fotoğrafta tanınabilir yüz olmasın (moderasyon kuralı 7). Varsa başka fotoğraf seç.
- Hangisini yaptığını raporda açıkça yaz.

---

## 5. Eşleştirme: nasıl yapılacak

1. **Önce bütün eski fotoğraflara bak** (`gorseller/fa-*.webp`). Her biri için konu (cephe, iç mekân, minber, avlu…), çekim yeri ve yönü hakkında kısa bir not çıkar. `gecmisi-gor.json`'daki `cekimNoktasi`, `yon`, `icMekan` alanlarını kullan.
2. **Sonra adaylara bak:** önce `icerik/foto/` (35 fotoğraf; açıklamaları `fotograflar.md`'de), sonra arşivdeki 111 fotoğraf.
3. **Her eski fotoğraf için en fazla bir eş seç.** Kalite > sayı: **4–6 güçlü eş** yeterli. Zorla eşleştirme yapma.
4. **Bir kontrol sayfası üret:** `DC/eserler/ulu-cami/gecmisi-gor/kontrol/eslesme.jpg`. Her satırda solda eski, sağda bugünkü (kırpılmış hâli), altında no, `aciBenzerligi` ve kısa gerekçe olsun. Rapora ekle.

**Başlangıç adayları.** Bunları ben ön inceleme olarak buldum; **her birini kendin gözle doğrula**, uymuyorsa ekleme:

| Eski | Konu | Aday (arşiv dosyası → varsa `icerik/foto` adı) | Beklenen |
|---|---|---|---|
| 14276 Minber | Minber, yandan | `DJI_20241210010423_0173_D_ODAK.jpg` (23_minber-yandan), `ERD04999 kopya.jpg` (05_minber), `ERD04998 kopya-2.jpg` (30_minber-kible) | ayni ya da yakin |
| 14286 Mihrap | Mihrap, önden | `ERD05161-Geliştirilmiş-NR kopya-2.jpg`, `DJI_20241210023213_0247_D_ODAK.jpg` (06_mihrap, yakın çekim) | yakin (eski geniş, 06 çok yakın) |
| 14290, 15226, 41844, 25044 | İç mekân: havuz korkuluğu önde, arkada kıble duvarı | `DJI_20241210051038_0350_D_ODAK-2.jpg` (28_ic-havuz-ustten), `ERD05081.jpg` (03), `DJI_20241210050406_0339_D_ODAK.jpg`, `DJI_20241210052139_0371_D_ODAK.jpg` (25) | yakin; en iyi tutanı seç, dördüne aynı fotoğrafı verme |
| 69125 Avlu | Avlu şadırvanı ve kapı | `ERD04721 kopya.jpg` (10_avlu-sadirvan), `ERD04751 kopya.jpg` (31) | yakin |
| 47954 Güneyden | Güney/yan cephe, sokaktan | `DJI_20241208084026_0291_D_ODAK.jpg` (16_dis-yan-cephe) | yalnız aynı cepheyse |
| Tepeden genel görünümler (49845, 14239, 13048, 15211, 66080 …) | Şehir ve Uludağ ile cami | Drone fotoğrafları (`…0387…`, `…0417…`, `…0510…`) | Çoğunlukla **uymaz** (yükseklik ve yön farklı). Yalnız yön ve kadraj gerçekten tutarsa yakin |

---

## 6. `hazirla.py` (yalnız v2)

- `gecmis_oku(eid, cikti)` her eski fotoğrafa şunu eklesin: `bugun` = admin eşi (varsa), yoksa o fotoğrafa bağlı onaylanmış (`durum == "onaylandi"`), en yeni tarihli iz. Alanlar: `gorsel`, `kucuk` (kopyalanmış yollar), `aciBenzerligi`, `kaynakSatiri`, `kim` («AKAR arşivi» ya da kullanıcı adı), `ornek` (bool), `tur` (`"admin"` | `"katki"`).
- Görselleri `gecmisi-gor` görselleriyle aynı biçimde `gg/<eser>/` altına kopyala.
- İzlerin tamamını ayrıca `e.izler` listesine koy (ileride Yaşayan hafıza için).
- Dosyalar yoksa hiçbir şey eklenmez; diğer eserler bugünkü gibi çalışır.
- Bu dosyaları da kod içinde adla değil, eserin `gecmisi-gor/` klasöründen bul (kural 3).

## 7. Arayüz (`app.js`, `app.css`; yalnız v2)

Figma (dosya `HGTgq5vRXVqhVO9TcR9wBe`):

- **Mobil:** `A1b · Geçmişi Gör / eşi var (kaydırıcı)` node `89:2732`. Karşılaştırma için mevcut `A1 · Geçmişi Gör / harita kapalı` `66:2508`.
- **Masaüstü:** `W · Geçmişi Gör / eşi var, kaydırıcı (A1b)` node `97:3046`. Mevcut A1 masaüstü `97:2768`.
- İleride (bu görevde değil): `WF · Yaşayan hafıza (revize)` `108:2765`, `D · Yaşayan hafıza (revize)` `82:2735`.

Davranış:

1. Seçili eski fotoğrafın `bugun` alanı varsa ana görsel alanı **kaydırıcıya** dönüşür: solda eski, sağda bugün; ortada sürüklenen tutamak (Figma'daki «‹ ›» yuvarlağı); dokunarak ve klavyeyle (←/→, `role="slider"`, `aria-valuetext` «Eski %60») kullanılabilir.
2. Üst köşe etiketleri: solda eski fotoğrafın tarihi (ör. «1930'lar»), sağda «Bugün · AKAR arşivi» ya da katkıysa «Bugün · <kullanıcı>». `ornek: true` ise etikete «Örnek katkı» de eklenir.
3. `aciBenzerligi == "yakin"` ise görselin altında küçük bir not: «Yakın açı: iki fotoğraf birebir aynı noktadan çekilmedi.»
4. Kaynak satırı Figma'daki gibi ikinci kaynakla uzar: «… · Bugünkü fotoğraf: <kaynakSatiri>».
5. Alttaki «Eski fotoğraflar» şeridinde eşi olan küçük resimlerin köşesinde küçük bir «Bugünü var» işareti (Figma'da yoksa sade bir nokta ya da ikon; bunu raporda belirt).
6. Eşi olmayan fotoğrafta ekran **bugünkü gibi** kalır; mevcut «Kamerayı aç» ve «İz Bırak» düğmeleri değişmez.
7. Masaüstü ve mobilde aynı veri, Figma'daki iki düzen.
8. Eski fotoğraf `duzenlenebilir: false` ise kaydırıcıda da kırpılmaz (sığdır); bugünkü görsel ona göre hizalanır.
9. Erişilebilirlik: iki görselin de `alt` metni olsun (eskinin `altMetin`i; bugünküne «Bugünkü görünüm: <eski başlık>»). Kaydırıcı klavyeyle çalışsın, odak halkası görünsün, `prefers-reduced-motion`'a uysun.

## 8. Test ve teslim

1. `bash DC/design/test-redmi9t-v2/sunucu.sh 8081` ile aç. Ulucami → Geçmişi Gör'de eşi olan her fotoğrafı mobil (390 × 844) ve masaüstü (1440 × 900) boyutunda dene: kaydırıcı, etiketler, kaynak satırı, klavye.
2. Eşi olmayan bir fotoğrafın ve başka bir eserin (ör. Koza Han) Geçmişi Gör ekranının **değişmediğini** doğrula.
3. Tarayıcı konsolunda hata olmasın.
4. `BENIOKU.md`'ye kısa bir «Geçmişi Gör · bugünkü eşler» bölümü ekle: dosyalar, kural, eklenen eşlerin listesi.
5. Rapor (bana, düz metin):
   - Eklenen eşler: eski no → bugünkü dosya, `ayni`/`yakin`, bir cümle gerekçe.
   - Bakıp **eklemediğin** adaylar ve nedeni.
   - Örnek katkı: hangi eski fotoğrafa bağlı, fotoğraf nereden geldi (ekip çekimi mi, arşiv mi).
   - Değiştirdiğin dosyaların listesi.
   - Kontrol sayfası `kontrol/eslesme.jpg`.

## 9. Yapma

- Uydurma kullanıcı adı, uydurma tarih, uydurma tarihî bilgi.
- Yalnız «aynı yapı» olduğu için eşleştirme; açı tutmuyorsa ekleme.
- Eski fotoğrafı kırpmak, renklendirmek, düzeltmek.
- Yapay zekâyla görsel üretmek ya da fotoğrafı yapay zekâyla «hizalamak».
- v1'e, `apps/`'e, `services/`'e ya da `gecmisi-gor.json`'a dokunmak.
- Kodda esere özel değer.
