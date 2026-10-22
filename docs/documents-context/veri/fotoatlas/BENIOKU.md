# Foto Atlas klasörü · BENİOKU

> Bu klasör, Foto Atlas'tan alınan eski fotoğraf kayıtlarını, izin durumlarını ve **Geçmişi Gör** özelliğinin kullanacağı hazır veriyi tutar. Son güncelleme: 22 Ekim 2026.
>
> İzinlerin ayrıntısı (hangi kurum, ne zaman, ne dedi) için: **`IZIN_DURUMU.md`**. Bu dosya klasörün nasıl kullanılacağını anlatır.

## Kısaca

- Foto Atlas'taki 10.214 kaydın tamamı, sahibi Caner Cangül'ün izniyle **bir kez** alındı (`tum.json`). Uygulama Foto Atlas'a canlı bağlanmaz; görseller `cdn.fotoatlas.net`'ten gösterilmez. Foto Atlas ileride Kültür Envanteri'ne taşınacak.
- Sadece `durum` alanı **`kullanilabilir`** ya da **`kullanilabilir-yas`** olan kayıtlar kullanılır. Bursa'da şu an **236** kayıt (181'inde çekim noktası var).
- Bu 236 fotoğrafın **56'sı 17 vakıf eserine** bağlandı (65 bağlantı; bazı fotoğraflar iki eseri gösteriyor). Uygulamaya giden paket: **`cikti/`**.
- Her görselde **kaynak satırı** gösterilir: fotoğrafçı · asıl kaynak (arşiv no) · Foto Atlas aracılığıyla. ND lisanslı fotoğraf kırpılmaz.

## Klasörde ne var

### Kaynak veri ve izinler (elle tutulur)

| Dosya | Ne işe yarar | Dokunulur mu |
|---|---|---|
| `tum.json` | 10.214 kaydın hepsi: konum, yön, görüş açısı, fotoğrafçı, tarih, asıl arşiv, lisans, `durum`, `kaynakSatiri` | Elle **düzenlenmez**; sadece `durum_guncelle.py` değiştirir |
| `IZIN_DURUMU.md` | İzin kuralları, durum etiketleri, kurumların cevapları | Cevap gelince elle güncellenir |
| `kurum-izin-listesi.csv` | 99 kurum, karar ve cevap sütunları | `durum_guncelle.py` günceller |
| `durum_guncelle.py` | Kurumdan cevap gelince o kurumun kayıtlarının durumunu değiştirir | Çalıştırılır |

### Geçmişi Gör hazırlığı

| Dosya | Ne işe yarar | Dokunulur mu |
|---|---|---|
| `gecmisi_gor_uret.py` | Fotoğrafları eserlerle eşler, küçültür, `cikti/` ve raporu üretir | Çalıştırılır |
| `eser_konum.csv` | Eser listesi: slug, ad, Foto Atlas'ta geçen yazımları (`adlar`, `\|` ile ayrılır), koordinat, koordinatın kaynağı | Yeni eser / koordinat **buraya** eklenir |
| `eslesme_elle.csv` | Elle kararlar: `onay`, `ret`, `ic-mekan`. Betiğin önerisinden önce gelir | **İçerik sorumlusu** yazar |
| `gorseller/orijinal/` + `gorseller/manifest.json` | 236 fotoğrafın tam boy aslı (JPEG, bir tanesi WebP, ~136 MB); manifest her dosyanın kaynak adresini ve baytını tutar | **Silinmez.** Betik buradan çalışır |

### Betiklerin ürettikleri (elle düzenlenmez, her çalıştırmada baştan yazılır)

| Dosya | Ne işe yarar |
|---|---|
| `tum-liste.csv` | `tum.json`'un Excel'de açılan hâli (`il` ve `durum` sütunuyla filtrele) |
| `eslesme_raporu.md` | Eser başına fotoğraf sayısı, **emin olunamayan öneriler**, indirilmesi gerekenler |
| `cikti/gecmisi-gor.json` | Eser → eski fotoğraflar verisi. Frontend'in alacağı dosya |
| `cikti/gorseller/` | Esere bağlı 56 fotoğrafın küçültülmüş hâli: `fa-<id>.webp` (uzun kenar 1600 px) ve `fa-<id>_k.webp` (400 px önizleme) |

### Silinebilir

`__pycache__/` (Python önbelleği), `.DS_Store` (Mac), `_inceleme_rota.jpg` (fotoğrafları gözle kontrol için yapılmış küçük resim sayfası; içerik sorumlusu baktıktan sonra).

> **Git:** `gorseller/orijinal/` 136 MB; repoya konmaz, ekip Drive'ında durur. `docs/documents-context/.gitignore` bu klasörü ve `_inceleme_rota.jpg`'yi dışarıda tutar (22 Ekim 2026; `__pycache__/` zaten dışarıda). `gorseller/manifest.json` ve `cikti/` repoda kalır: manifest hangi dosyanın nereden indiğini söyler; Drive'a erişimi olmayan, asılları bu adreslerden yeniden indirebilir.

## İzin gelince ne yapılır

Hep aynı sıra, bu klasörde terminalden:

```
python3 durum_guncelle.py --kurum "<asilKaynak adı>" --durum kullanilabilir --not "Kim, ne zaman, hangi kanal" --deneme
python3 durum_guncelle.py --kurum "<asilKaynak adı>" --durum kullanilabilir --not "Kim, ne zaman, hangi kanal"
python3 gecmisi_gor_uret.py
```

- Kurum adlarını görmek için: `python3 durum_guncelle.py --liste`. Reddettiyse `--durum kullanma`.
- `gecmisi_gor_uret.py`, yeni kullanılabilir olmuş ama görseli `gorseller/orijinal/` içinde olmayan kayıtları raporun **"İndirilmesi gerekenler"** bölümüne yazar. Bunlar tarayıcıdan (Foto Atlas `/wp-json/fa/image/{id}` → `featured_media.full`) indirilip `fa-<id>.<uzantı>` adıyla `gorseller/orijinal/`'e konur, betik tekrar çalıştırılır.
- Durumu `kullanma`'ya düşen fotoğrafın küçük kopyası `cikti/gorseller/`'den **kendiliğinden silinir**.
- `IZIN_DURUMU.md`'deki "Cevap beklenenler" tablosu elle güncellenir.

Betik sadece bu klasöre yazar; `apps/` ve `packages/` klasörlerine dokunmaz. Gerekli: Python 3.9+, Pillow (WebP destekli).

## Eşleştirme nasıl yapılıyor

Betik her fotoğraf için iki şeye bakar:

1. **Ad:** eserin adı ya da yazımlarından biri (`eser_konum.csv` → `adlar`) fotoğrafın başlığında veya Foto Atlas konularında geçiyor mu? Büyük-küçük harf ve Türkçe karakter farkı gözetilmez.
2. **Konum:** eser, fotoğrafçının baktığı koninin içinde mi (yön ± görüş açısının yarısı + 10°, en fazla 2,5 km) ya da çekim noktası eserin 60 m yakınında mı?

| Ad | Konum | Sonuç |
|---|---|---|
| tutuyor | tutuyor | **kesin** → `cikti/`'ye girer |
| tutuyor | tutmuyor / konum yok | **olası** → raporda, karar bekler |
| tutmuyor | eser konide ve 250 m içinde | **olası** (sadece adı hiçbir esere uymayan fotoğraflarda) |
| — | — | `eslesme_elle.csv`'de `onay` → girer, `ret` → girmez |

Bursa merkezdeki eserler sadece Bursa fotoğraflarıyla, İznik eserleri sadece İznik fotoğraflarıyla eşleşir.

### `eslesme_elle.csv` nasıl yazılır

```
fotoAtlasId,eser,karar,not
25044,ulu-cami,onay,İç görünüm; görsele bakıldı
24956,orhan-bey-kulliyesi,ret,Yenişehir'deki cami, Bursa merkezdeki değil
14290,,ic-mekan,Başlık «Bursa Ulu Cami» ama iç mekân
```

`eser` sütunu `eser_konum.csv`'deki **slug**'dır. `ic-mekan` satırında eser boş kalabilir.

## `cikti/gecmisi-gor.json` içinde ne var

```
{
  "eserler": {
    "ulu-cami": {
      "ad": "Ulucami",
      "konum": [40.1838059, 29.0618995],
      "fotograflar": [ { ...aşağıdaki alanlar... } ]   // tarihe göre sıralı
    }
  }
}
```

| Alan | Açıklama |
|---|---|
| `fotoAtlasId` | Foto Atlas kimliği. **Saklanmalı**: Kültür Envanteri'ne geçişte eşleştirme bununla yapılacak |
| `gorsel`, `kucuk` | `gorseller/fa-<id>.webp` ve `_k.webp` (bu JSON'a göre göreli yol) |
| `genislik`, `yukseklik` | Büyük görselin piksel boyutu |
| `baslik` | Foto Atlas başlığı |
| `altMetin`, `altMetinTaslak` | Otomatik alt metin; `altMetinTaslak: true` ise içerik sorumlusu düzeltmeli |
| `tarih.enErken`, `tarih.enGec`, `tarih.etiket` | Ekranda yazılacak hazır etiket: `1862`, `1875–85`, `1930'lar`, `1945 öncesi`, `Tarih bilinmiyor` |
| `fotografci`, `asilKaynak`, `asilArsivId`, `asilArsivUrl`, `fotoAtlasUrl` | Künye |
| `kaynakSatiri` | **Her görselin altında gösterilecek satır** (İÜ fotoğraflarında NEKYA numarasıyla) |
| `lisans`, `lisansNotu` | Lisans adı ya da izin türü ve açıklaması |
| `duzenlenebilir` | `false` = ND lisans: kırpma ve "ekranı doldur" kapalı |
| `cekimNoktasi`, `yon`, `gorusAcisi` | "Nereden çekildi?" haritası: nokta + koni (yön 0 = kuzey, saat yönünde) |
| `icMekan` | `true` ise kamera açılırken saygı notu gösterilir (namaz vakitleri, yüz çekme, flaş) |
| `eslesme`, `eserMesafesiM` | `kesin` ya da `elle`; çekim noktasının esere uzaklığı |

## Kim ne yapacak

**Frontend**
- Tek girdi `cikti/gecmisi-gor.json` + `cikti/gorseller/`. Kendi `public/` klasörünüze kopyalayın; JSON'u elle değiştirmeyin, değişiklik betikten gelir.
- `kaynakSatiri` her görselde görünür; `duzenlenebilir: false` ise kırpma yok; `icMekan: true` ise kamera açılışında not.
- Tasarım: Figma'daki Geçmişi Gör ekranları (mobil A1, A2, A1b, D, D2 ve durum ekranları; masaüstü karşılıkları). Masaüstünde kamera yok; "Nereden çekildi?" kartında tek satır bilgi var.

**Backend**
- Veri, `FRONTEND_BACKEND_NOTLARI.md`'deki `gorsel` ve `gecmisi_gor` tablolarına taşınır. Kaynak ve lisans zorunlu, alt metin zorunlu; içe aktarılan kayıt taslak gelir.
- `fotoAtlasId` alanı tutulmalı. Panelde konum ve yön elle düzeltilebilir ("elle düzeltildi" etiketi).

**İçerik sorumlusu**
- `eslesme_raporu.md`'deki emin olunamayan önerilere bak, kararları `eslesme_elle.csv`'ye yaz, betiği çalıştır.
- **25056** (İÜ, "Bursa'da Belediye Dairesi") Orhan Gazi Camii olarak onaylandı ama "DOĞRULANACAK": solda görünen caminin Orhan Camii olduğunu kontrol et.
- `altMetinTaslak: true` olan alt metinleri düzelt.
- I. Murad Hüdavendigâr Külliyesi'nin koordinatı yok (OSM'de bulunamadı); `eser_konum.csv`'ye girilince 6 fotoğrafı otomatik bağlanır.

## Şu anki durum (22 Ekim 2026)

| Eser | Fotoğraf |
|---|---|
| Ulucami | 18 (6'sı iç mekân) |
| Yeşil Külliyesi | 7 |
| Orhan Gazi Türbesi | 5 |
| Osman Gazi Türbesi, Yıldırım Bayezid Külliyesi, Muradiye Külliyesi, Eski Kaplıca, Yeni Kaplıca, Nilüfer Hatun İmareti | 4'er |
| Koza Hanı, Orhan Bey Külliyesi (Orhan Gazi Camii), Irgandı Köprüsü | 2'şer |
| Pirinç Hanı, Kayhan Camii, Emir Sultan Külliyesi, Şehadet Camii, Eşrefzade Camii | 1'er |

**Rota eserleri için önerilen fotoğraflar** (ilk açılacak / kamera için / iç mekân):
- Ulucami: **14239** (1875–86, Tophane'den, net) · **65828** (1970–89, Atatürk Caddesi'nden sokak seviyesi; bugün aynı yerden çekilebilir) · **15226** (1890–1900, şadırvan).
- Koza Hanı: **64741** (1945 öncesi, yakın plan) · 49845 (1862 panorama). Az; envanter fotoğrafları ya da saha çekimiyle desteklenmeli.
- Orhan Gazi Camii: **25056** (doğrulanacak) · 15211 (1890–1900, uzaktan).

Fotoğrafı olmayan eserler (Bedesten, Emir Hanı, Aynalı Çarşı, hanlar vb.) uygulamada "Bu eserin eski görüntüsü henüz yok" ekranını gösterir.

## İzinler (özet)

| Kaynak | Durum |
|---|---|
| Açık lisans (CC0, CC BY, CC BY-SA, PDM, CC BY-NC) | Kullanılır; ND'de kırpma yok |
| Mazhar Yüce Doruk Koleksiyonu | Yazılı izin (Caner Cangül, Telegram, 21.10.2026) |
| İÜ Nadir Eserler Kütüphanesi, Yıldız Albümleri | İzin verdi (22.10.2026, nadirkut@istanbul.edu.tr). Kaynakta "Nadir Eserler Kütüphanesi Yıldız Albümleri" + **NEKYA ve demirbaş numarası** (ör. NEKYA90762/18) yazılmalı; `kaynakSatiri` bunu içeriyor |
| Dumbarton Oaks (Artamonoff) | Reddetti → `kullanma` |
| Diğer beklenenler | `IZIN_DURUMU.md` → "Cevap beklenenler" |

Telegram ve e-posta yazışmalarının ekran görüntüleri lisans tablosunun yanında saklanmalı.
