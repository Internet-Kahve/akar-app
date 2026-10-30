# Görev: Geçmişi Gör'deki «bugünkü eş» ve örnek İz Bırak'ı Ulucami dışındaki eserlere de ekle

Sen AKAR adlı bir hackathon projesinde çalışıyorsun (KÖK&KOD, 42 Türkiye × Vakıf Katılım; final 7–8 Kasım 2026). AKAR, Bursa'daki vakıf eserlerini harita, 3D model, sesli hikâye ve eski fotoğraflarla anlatan bir web uygulaması.

**Ulucami'de bu iş yapıldı ve referans o.** Senin işin, aynı yöntemi aynı dosya biçimleriyle öbür eserlere uygulamak. Kod yazman gerekmiyor: uygulama ve hazırlık betiği zaten genel çalışıyor, yani her eser için yalnız **veri** üreteceksin. Kodda bir eksik bulursan önce raporla, sonra yalnız esere özel olmayan küçük bir düzeltme yap.

Her adımda neyi neden yaptığını kısaca yaz. Uydurma eşleştirme, uydurma kullanıcı, uydurma bilgi yasak. Emin olmadığın eşleştirmeyi ekleme; eklemediğin her adayı raporda gerekçesiyle yaz. **Az ama doğru eş, çok ama zorlama eşten iyidir.**

---

## 1. Ne yapılacak (kısaca)

Geçmişi Gör'de eski bir fotoğraf seçilince, aynı yerden ve yakın açıdan çekilmiş **bugünkü** bir fotoğraf varsa ikisi kaydırıcıyla karşılaştırılıyor. Bu ekran Figma'da «A1b · eşi var» olarak tasarlandı ve uygulamada çalışıyor. Bugünkü fotoğraf iki kaynaktan gelir:

1. **Admin eşi** (`bugunku-esler.json`): Envanter fotoğraf arşivinden, eski fotoğrafla aynı ya da yakın açıdan çekilmiş fotoğraf.
2. **Örnek İz Bırak katkısı** (`izler.json`): «Kullanıcı da bugünkü eşi üretebilir» akışını gösteren, onaylanmış bir katkı. Ekipten gelir ve arayüzde «Örnek katkı» diye işaretlenir.

Kural: Admin eşi varsa o gösterilir. Yoksa o fotoğrafa bağlı onaylanmış en yeni katkı gösterilir. İkisi de yoksa ekran eşsiz hâliyle kalır.

---

## 2. Proje yapısı ve kesin kurallar

Kök klasör `akar-app/docs/documents-context/`. Aşağıda kısaca **DC** diyeceğim.

| Ne | Yol |
|---|---|
| **Referans (oku, değiştirme)** | `DC/eserler/ulu-cami/gecmisi-gor/`: `bugunku-esler.json`, `izler.json`, `bugun/`, `izler/`, `kontrol/eslesme.jpg` |
| Eski fotoğraflar (eser başına) | `DC/eserler/<eser>/gecmisi-gor/gecmisi-gor.json` + `gorseller/fa-<id>.webp`, `fa-<id>_k.webp` |
| Eski fotoğrafları üreten betik | `DC/veri/fotoatlas/gecmisi_gor_uret.py` (+ `BENIOKU.md`, `IZIN_DURUMU.md`, `eslesme_raporu.md`, `eslesme_elle.csv`) |
| Görsel üretici (kırpar, küçültür, genişlik/yükseklik yazar) | `DC/scripts/content/bugunku_es_uret.py`. Eser adı almaz, bütün eserleri tarar |
| Eserin uygulama fotoğrafları ve arşivdeki asılları | `DC/eserler/<eser>/icerik/fotograflar.md`: her satırda arşiv yolu, başlık, alt metin, lisans; ayrıca varsa `icerik/kitap-fotograflari.md` |
| Envanter fotoğraf arşivi (asıllar) | `DC/veri/bursa-foto/…` + `DC/veri/bursa-foto/_manifest.csv` (zip numarası buradan) |
| Prototip | `DC/design/test-redmi9t-v2/` (`hazirla.py`, `app.js`, `sunucu.sh`, `BENIOKU.md`) |
| Veri modeli | `DC/FRONTEND_BACKEND_NOTLARI.md` (`gecmisi_gor`, `katki`, `gorsel`) |

**Kesin kurallar:**
1. `DC/design/test-redmi9t/` (v1), `akar-app/apps/` ve `services/` klasörlerine **dokunma**.
2. `gecmisi-gor.json` dosyalarını **elle düzenleme**. Onları `gecmisi_gor_uret.py` üretiyor; elle yazılan her şey bir sonraki çalıştırmada silinir.
3. `eslesme_elle.csv`'ye **yazma**. Eski fotoğrafın esere ait olup olmadığına içerik sorumlusu karar verir. Sen yalnız önerini raporda yaz.
4. Ulucami'nin dosyalarını **değiştirme**; yalnız referans olarak oku.
5. Asıl fotoğraflara dokunma. Görselleri yalnız `bugunku_es_uret.py` üretir; elle küçültme ya da kırpma yapma.
6. Dosya silme. Gereksiz bir şey olursa `_eski/` alt klasörüne taşı ve raporda yaz.
7. Kodda esere özel değer olmayacak. Eser adı, dosya adı ya da Foto Atlas numarası yazma.
8. Yapay zekâyla görsel üretme ya da fotoğrafı yapay zekâyla «hizalama».
9. Eski fotoğrafı kırpma, renklendirme, düzeltme. `duzenlenebilir: false` olan eski fotoğrafa hiçbir koşulda dokunulmaz.

---

## 3. Eserlerin durumu (28 Ekim 2026'da kontrol edildi)

| Eser (klasör) | Eski fotoğraf | Yapılacak |
|---|---|---|
| `koza-han` | 5 | Eş ve örnek iz |
| `orhan-bey-kulliyesi` | 5 | Eş ve örnek iz |
| `orhan-gazi-turbesi` | 5 | Eş ve örnek iz |
| `yildirim-bayezid-bedesteni` | 0 | Yalnız rapor (§7) |
| `emir-han` | 0 | Yalnız rapor (§7) |
| `orhan-bey-hamami` | 0 | Yalnız rapor (§7) |

Eski fotoğraflar (Foto Atlas no · tarih · başlık). Hepsi dış mekân ve `duzenlenebilir: true`:

- **Koza Hanı:** 49845 · 1862 · Bursa Ulu Cami ve Çevresi Genel Görünümü · 46272 · 1908–34 · Koza Hanı · 47770 · 1908–34 · Koza Han Mescidi · 47774 · 1908–34 · Koza Han Mescidi · 64741 · 1945 öncesi · Kozahan
- **Orhan Bey Külliyesi:** 15211 · 1890–1900 · Bursa Ulu Cami ve Çevresi · 45758 · 1908–34 · Gazi Orhan Bey Camii · 47428 · 1908–34 · Gazi Orhan Bey Camii · 47618 · 1909–34 · Gazi Orhan Bey Camii · 25056 · tarih bilinmiyor · Bursa'da Belediye Dairesi
- **Orhan Gazi Türbesi:** 34618 · 1870–90 · Yeşil Cami'den Bursa Görünümü · 423 · 1890'lar · Osman ve Orhan Gazi Türbeleri · 13053 · 1890–1900 · Osman ve Orhan Gazi Türbeleri · 65257 · 1894 · Orhan Gazi Türbesi · 65262 · 1935–40 · Tophane Saat Kulesinden Bursa'ya Bakış

Bu listeyi başlangıç olarak kullan, ama işe başlamadan önce her eserin `gecmisi-gor.json` dosyasını yeniden oku. Betik bu arada yeniden çalıştırılmış ve sayılar değişmiş olabilir. **Değiştiyse dosyadaki hâli esas al.**

Uzaktan çekilmiş panoramalar (49845, 15211, 34618, 65262) ve «Belediye Dairesi» (25056) gibi fotoğraflarda eser küçük ya da kenarda. Bunlar için arşivde aynı açıdan bir fotoğraf bulunması pek olası değil; bulamazsan zorlama.

---

## 4. Dosya biçimleri: Ulucami'dekiyle birebir aynı

Önce `DC/eserler/ulu-cami/gecmisi-gor/bugunku-esler.json` ve `izler.json` dosyalarını oku. Alan adları, alan sırası ve `_aciklama` metni aynı olsun, yalnız eser değişsin.

### 4.1 `DC/eserler/<eser>/gecmisi-gor/bugunku-esler.json`

```json
{
  "_aciklama": "(Ulucami'deki açıklamanın aynısı)",
  "esler": [
    {
      "fotoAtlasId": 46272,
      "gorsel": "bugun/es-46272.webp",
      "kucuk": "bugun/es-46272_k.webp",
      "aciBenzerligi": "yakin",
      "aciNotu": "Bir iki cümle: ne aynı, ne farklı (yükseklik, yön, uzaklık, kırpma).",
      "kaynakDosya": "veri/bursa-foto/<klasör>/<asıl dosya>",
      "kirpma": { "x": 0, "y": 0, "w": 0, "h": 0 },
      "kaynakSatiri": "Fotoğraf: Bursa Vakıf Eserleri Envanteri",
      "lisans": "Vakıf Katılım, Bursa Vakıf Eserleri Envanteri fotoğraf arşivi (zip -NNN). Proje için verildi; kullanılabilir.",
      "ekleyen": "AKAR ekibi",
      "eklendi": "2026-10-28"
    }
  ]
}
```

- **`genislik` ve `yukseklik` alanlarını sen yazma.** Onları `bugunku_es_uret.py` yazar.
- **`aciBenzerligi`:**
  - `"ayni"`: çekim noktası ve bakış yönü gözle aynı; aynı mimari öğeler kadrajda benzer yerde.
  - `"yakin"`: aynı cephe ve aynı yöne bakış var, ama yükseklik, uzaklık ya da eksen belirgin farklı.
  - Bundan uzaksa **ekleme.** «Aynı yapı» olması yetmez; açı tutmalı.
- **`kirpma`:** Asıl dosyanın piksel koordinatlarıyla verilir. **Oranı eski fotoğrafın oranına eşit olmalı** ki kaydırıcıda iki görsel üst üste otursun. Eski fotoğrafın oranını `gorseller/fa-<id>.webp`'nin boyutundan hesapla. Yalnız bugünkü fotoğraf kırpılır.
- **`lisans`:** Zip numarasını `_manifest.csv`'den asıl dosya adına göre bul. Numarasını bulamadığın fotoğrafı kullanma.
- **Görselin kaynağı:** Yalnız envanter arşivi. Eserin `icerik/fotograflar.md` dosyasındaki arşiv yollarına öncelik ver; o eserin fotoğrafı olduğu orada doğrulanmış. Gerekirse aynı arşiv klasöründeki öbür fotoğraflara da bak. Bunlar Ticari Yapılar, Orhan Bey Külliyesi, Türbeler gibi klasörler ve dosya adları numaralı. Bir dosyanın hangi esere ait olduğundan emin değilsen kullanma.

### 4.2 `DC/eserler/<eser>/gecmisi-gor/izler.json`

Ulucami'deki `iz-ulu-001` kaydıyla aynı biçim. Kimlik `iz-<eser kısaltması>-001` olsun, ör. `iz-koza-001`.

- Örnek katkı, **admin eşi olmayan** bir eski fotoğrafa bağlanır (`ayniAciFotoAtlasId`). Böylece «admin eşi yoksa onaylı katkı gösterilir» kuralı ekranda görünür.
- **Fotoğrafın kaynağı:**
  - Ekipten biri o noktada gerçekten fotoğraf çektiyse ve dosya `DC/eserler/<eser>/gecmisi-gor/izler/_ham/` içindeyse onu kullan. O zaman `kaynakSatiri` = «Fotoğraf: AKAR ekibi (örnek katkı)».
  - Yoksa arşivden bir fotoğraf kullanabilirsin. O zaman `kullanici` = «AKAR ekibi», `ornek` = true, `kaynakSatiri` = «Fotoğraf: Bursa Vakıf Eserleri Envanteri (örnek katkı olarak gösteriliyor)».
- **Uydurma bir kişi adı yazma** (ör. «Zeynep A.»). Arşiv fotoğrafını bir ziyaretçinin çektiği gibi sunma.
- **Yüz:** Fotoğrafta tanınabilir yüz olmasın. Varsa başka fotoğraf seç.
- **`metin`:** Kısa ve gerçek olsun. Fotoğrafta görülmeyen bir şeyi yazma.
- Uygun ikinci bir eski fotoğraf yoksa o eserde örnek iz **olmasın**. Bunu raporda yaz.

### 4.3 Eser başına hedef

| | Hedef | Zorunlu mu |
|---|---|---|
| Admin eşi | 1–3 güçlü eş | Hayır. Arşivde açı tutan fotoğraf yoksa 0 olabilir. |
| Örnek iz | 1 | Hayır. Uygun eski fotoğraf yoksa 0. |
| Bir eski fotoğrafa | en çok 1 admin eşi | Evet |
| Aynı bugünkü fotoğraf | birden çok eski fotoğrafa verilmez | Evet |

---

## 5. Eşleştirme yöntemi (Ulucami'de böyle yapıldı)

1. **Eski fotoğraflara bak.** Her biri için konuyu, çekim yerini ve yönünü not et. `gecmisi-gor.json`'daki `cekimNoktasi`, `yon`, `gorusAcisi` alanlarını ve fotoğrafın kendisini kullan.
2. **Adaylara bak.** Önce eserin `icerik/fotograflar.md` listesindeki asıllara, sonra aynı arşiv klasöründeki öbür fotoğraflara. Drone ve yüksek çekimler yerden çekilmiş eski fotoğraflarla genelde tutmaz; tutmuyorsa ekleme.
3. **Bir aday için karar ver:** `ayni`, `yakin` ya da ekleme. Kırpma dikdörtgenini, eski fotoğrafın kadrajına yaklaşacak ve oranı tutacak biçimde seç.
4. **Veriyi yaz** (`bugunku-esler.json`, `izler.json`). Sonra `python3 DC/scripts/content/bugunku_es_uret.py` ile görselleri üret. Betik bütün eserleri tarar; Ulucami'nin görselleri yeniden yazılır ama içerik değişmez.
5. **Kontrol sayfası üret:** `DC/eserler/<eser>/gecmisi-gor/kontrol/eslesme.jpg`. Ulucami'deki gibi her satırda solda eski, sağda bugünkü (kırpılmış) fotoğraf olsun; altında no, `aciBenzerligi` ve kısa gerekçe yazsın. Örnek iz de ayrı bir satırda olsun. Bu sayfa yalnız kontrol içindir, uygulamaya girmez.

---

## 6. Test

1. `bash DC/design/test-redmi9t-v2/sunucu.sh 8081` ile aç. Hazırlık betiği `hazirla.py` her eserin `bugunku-esler.json` ve `izler.json` dosyasını kendisi okur.
2. Değişen her eserde **Geçmişi Gör**'ü mobil (390 × 844) ve masaüstü (1440 × 900) boyutunda aç ve şunları kontrol et:
   - Eşi olan fotoğrafta kaydırıcı çıkıyor; tutamak sürükleniyor ve klavyede ←/→ çalışıyor.
   - Üst etiketler doğru: solda eski fotoğrafın tarihi, sağda «Bugün · AKAR arşivi» ya da «Bugün · AKAR ekibi · Örnek katkı».
   - `yakin` olanlarda «Yakın açı» notu var.
   - Kaynak satırı ikinci kaynakla uzuyor.
   - İki görsel üst üste oturuyor (oran tutuyor).
   - Eşi olmayan fotoğrafın ekranı değişmedi.
3. **Ulucami'nin Geçmişi Gör ekranı değişmedi.**
4. Eski fotoğrafı olmayan üç eserin (Bedesten, Emir Hanı, Orhan Bey Hamamı) ekranı eskisi gibi; «eski görüntü henüz yok» ya da «uzaktan görünüyor» durumu bozulmadı.
5. Tarayıcı konsolunda hata yok.

---

## 7. Eski fotoğrafı olmayan eserler: yalnız rapor

Bedesten, Emir Hanı ve Orhan Bey Hamamı (Aynalı Çarşı) için Foto Atlas'ta kesin eşleşmiş eski fotoğraf yok. Bu yüzden bugünkü eş de örnek iz de **eklenemez.** Eski fotoğraf yokken «bugünkü eş» olmaz.

Yine de şunu yap ve raporla:

- `DC/veri/fotoatlas/eslesme_raporu.md` dosyasının «Emin olunamayanlar» bölümünde bu üç esere ait öneri var mı?
- Varsa her biri için şunları yaz: Foto Atlas no, başlık, tarih, fotoğrafa bakınca eser gerçekten görünüyor mu, önerin (`onay` / `ret` / `ic-mekan`). İçerik sorumlusu bunu `eslesme_elle.csv`'ye kendisi yazacak.
- Koza Hanı için de aynısını yap: raporda «47676 Koza Han Mescidi (1908–34), ad tutuyor, konum yok» önerisi var.
- **Kendin `eslesme_elle.csv`'ye yazma, `gecmisi_gor_uret.py`'yi çalıştırma.**

---

## 8. Teslim

1. **`DC/design/test-redmi9t-v2/BENIOKU.md`**: «Geçmişi Gör · bugünkü eşler» başlıklı bir bölüm varsa ona kısa bir ek yap; yoksa bu başlıkla kısa bir bölüm aç. Yazacakların: dosyalar (`bugunku-esler.json`, `izler.json`, `bugunku_es_uret.py`), gösterim kuralı, hangi esere kaç eş ve kaç örnek iz eklendiği.
2. **Rapor (bana, düz metin):**
   - Eser başına eklenen eşler: eski no → asıl dosya, `ayni`/`yakin`, bir cümle gerekçe.
   - Eser başına örnek iz: hangi eski fotoğrafa bağlı, fotoğraf nereden geldi (ekip çekimi mi, arşiv mi).
   - Bakıp **eklemediğin** adaylar ve nedenleri.
   - §7'deki öneriler (içerik sorumlusu için).
   - Oluşturduğun ya da değiştirdiğin bütün dosyaların listesi.
   - Kontrol sayfalarının yolları.
   - Kodda bir eksik bulduysan ne olduğu ve ne yaptığın.

## 9. Yapma

- Uydurma kullanıcı adı, tarih, tarihî bilgi.
- Yalnız «aynı yapı» olduğu için eşleştirme.
- Bir eserin arşiv fotoğrafını başka bir eserin eşi olarak kullanma.
- Eski fotoğrafa dokunma; `gecmisi-gor.json`'u ya da `eslesme_elle.csv`'yi elle düzenleme.
- Yapay zekâyla görsel üretme ya da hizalama.
- v1'e, `apps/`'e, `services/`'e ya da Ulucami dosyalarına dokunma.
- Kodda esere özel değer.
