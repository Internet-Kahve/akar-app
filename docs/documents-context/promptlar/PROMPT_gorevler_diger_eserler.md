# Görev: Ulucami'deki bulmaca, saha görevi ve rozetleri öbür 6 esere de ekle

Sen AKAR adlı bir hackathon projesinde çalışıyorsun (KÖK&KOD, 42 Türkiye × Vakıf Katılım; final 7–8 Kasım 2026). AKAR, Bursa'daki vakıf eserlerini harita, 3D model, sesli hikâye ve eski fotoğraflarla anlatan bir web uygulaması.

**Ulucami'de bu iş yapıldı ve referans o.** Uygulamada her eserin kendi bulmacası, saha görevi ve rozetleri olabiliyor. Bunlar eser başına tek bir veri dosyasından geliyor: `icerik/gorevler.json`. Kod hazır ve genel çalışıyor. **Senin işin yalnız veri yazmak:** öbür 6 eser için `gorevler.json` hazırlamak. Kod değiştirmen gerekmiyor. Kodda bir eksik bulursan önce raporla.

Her adımda neyi neden yaptığını kısaca yaz. **Uydurma bilgi yasak.** Her soru ve her açıklama, eserin kendi kaynaklı metninden (§3) gelmeli ve sayfa kodunu taşımalı. Kesin bir doğru cevabı olmayan bilgiden soru yapma.

---

## 1. Kesin kurallar

1. **Dokunma:**
   - `DC/design/test-redmi9t/` (v1), `akar-app/apps/`, `services/`, `packages/`.
   - Ulucami'nin dosyaları; yalnız referans olarak oku.
   - `app.js`, `app.css`, `hazirla.py`.
2. **Puan yok, süre yok, seviye yok, ceza yok.** Yanlış cevap yalnız sıradaki ipucunu açar.
3. **İbadet yeri ve türbe içinde görev yok.** Saha görevi yapının dışında ya da herkese açık bir geçitte, avluda veya çarşıda yapılır. Cami ve türbe için görev yeri dış cephe ya da avlu olur.
4. **Her görevin evden çözülebilen bir yolu olacak.** Soru fotoğrafa bakarak çözülür; saha görevi evden 3D modelde bir parçaya dokunarak.
5. **Dil:** «ele geçirdin» değil, «keşfettin / buldun». Para, kazanç, yatırım, getiri, bağış, faiz gibi kelimeler kullanılmaz; sponsor bir katılım bankası.
6. **Eser sayfasında görünmeyen bir şeyi rozet koşulu yapma.**
7. **Dosya silme.** Gereksiz bir şey olursa `_eski/` alt klasörüne taşı ve raporda yaz.

---

## 2. Yollar

Kök klasör `akar-app/docs/documents-context/`. Aşağıda kısaca **DC** diyeceğim.

| Ne | Yol |
|---|---|
| **Referans** (biçim, ton, uzunluk) | `DC/eserler/ulu-cami/icerik/gorevler.json` |
| Bu iş hakkında açıklama | `DC/design/test-redmi9t-v2/BENIOKU.md` → «Bulmaca, saha görevi, rozetler ve profil» bölümü |
| Eserin kaynaklı metni (sorular buradan) | `DC/eserler/<eser>/icerik/eser-hakkinda.md`. Her paragrafın sonunda kaynak kodu var (ör. `E cilt-1 PDF s.25`) ve bir güven etiketi |
| Eserin fotoğrafları | `DC/eserler/<eser>/icerik/fotograflar.md` + `icerik/foto/` |
| Eserin hikâyesi (varsa) | `DC/eserler/<eser>/icerik/hikaye.md` |
| Eserin 3D modeli | `DC/eserler/<eser>/3d/model.json` → `glb` adı; dosya `3d/export/<glb>_sunum.glb` |
| Envanter kitapları (gerekirse doğrulamak için) | `DC/veri/kaynak_pdf/bursa-envanteri-cilt-1/2/3.pdf` (yerelde varsa) |

**Eserler:** `yildirim-bayezid-bedesteni`, `koza-han`, `orhan-bey-kulliyesi`, `orhan-bey-hamami`, `emir-han`, `orhan-gazi-turbesi`.

---

## 3. Eser başına ne hazırlanacak

`DC/eserler/<eser>/icerik/gorevler.json`. Ulucami'deki dosyayla **alan adları ve sırası birebir aynı** olsun. `_aciklama` metnini eserine uyarlayarak koru.

### 3.1 Bir soru (`"tur": "soru"`)

- **4 şık.** Bir tanesi doğru (`dogru` = sıfırdan başlayan sıra numarası). Öbür üçü inandırıcı ama kaynağa göre açıkça yanlış olsun; ör. başka bir yapı tekniği, başka bir malzeme, başka bir sayı. Şaka şık koyma.
- **Konu seçimi:** Ziyaretçinin fotoğrafa bakarak ya da hikâyeyi dinleyerek bilebileceği bir şey. Eserin en öğretici özelliğini seç; ör. yapının işlevi, örtü sistemi, avludaki yapı, bir teknik terim, vakıf ilişkisi.
- **Soru yapılmayacak bilgiler:**
  - Güven etiketi «Tarihsel çıkarım» ya da «Temsili» olan paragraflar.
  - «Rivayete göre», «denir», «olabilir» diye geçen her bilgi.
  - Kaynakların birbirini tutmadığı sayılar.
- **`ipuclari`:** 2 tane. Birincisi yönlendirir (ör. «fotoğrafta tavana bak»), ikincisi neredeyse söyler (ör. «cevap şu harfle başlıyor»). Fotoğrafta görünmeyen bir şeyi ipucu yapma.
- **`dogru_metin`:** 1–2 cümle. Kaynaklı metinden, sade bir dille. Yeni bilgi ekleme.
- **`gorsel`:** Sorunun cevabının **görüldüğü** fotoğraf. `fotograflar.md` listesindeki bir dosya adı olsun ve `icerik/foto/` içinde gerçekten bulunsun.
- **`kaynak`:** Paragrafın kaynak kodu, aynen. **`guven`:** «Doğrulanmış».

### 3.2 Bir saha görevi (`"tur": "saha"`)

- **Konu:** Yapının dışında ya da açık alanında, gidince bulunabilen belirgin bir öğe. Örnekler: ana kapı, avludaki şadırvan veya mescit, bir cephe, kubbe sayısı görünen bir yer.
- **`yerinde.yap`:** Ziyaretçinin ne yapacağını tek cümlede anlatır. «Buradayım»a dokunacağı yazsın. `konum_yaricap_m` 80 olsun. Eserler birbirine çok yakınsa ve bir eserin dışına çıkmadan görev yapılamıyorsa 60–120 arası bir değer seç ve gerekçesini raporda yaz.
- **`evden.parca`:** 3D modeldeki **üst düzey bir nesnenin adı**, birebir. Adı tahmin etme; §4'teki yöntemle listeden seç. O nesne sorulan öğeyi gerçekten göstermeli. Uygun bir nesne yoksa saha görevinin konusunu modelde bulunan bir öğeye göre değiştir.
- **`evden.yap`:** «3D modelde <öğe>'ye dokun.»
- **`tamam_metin`:** 1–2 cümle, kaynaklı metinden. **`gorsel`:** O öğenin fotoğrafı. **`kaynak`**, **`guven`:** Soru için yazılan kurallarla aynı.

### 3.3 Rozetler

| Rozet | Koşul | Ne zaman |
|---|---|---|
| Hikâye rozeti | `{"hikaye_bitti": true}` | **Yalnız eserin `hikaye.md` dosyası varsa.** Orhan Gazi Türbesi'nde hikâye yok, bu rozet olmayacak. |
| Soru rozeti | `{"gorev": "<soru id>"}` | Her eserde |
| Saha rozeti | `{"gorev": "<saha id>"}` | Her eserde. Ulucami'deki gibi `"yerinde_etiketi": true` |

- **Adlar:** Kısa ve öğretici olsun (Ulucami'deki örnekler: «Kündekâri», «Sahaflar Kapısı»). Rozetin metni ne öğrenildiğini söylesin.
- **Kimlikler:** Bütün uygulamada eşsiz olmalı. Eser kısaltmasıyla başlasın: `bed-`, `koza-`, `obc-` (Orhan Bey Camii), `obh-` (Orhan Bey Hamamı), `emir-`, `ogt-` (Orhan Gazi Türbesi). Görev kimliklerinde de aynı kural geçerli: ör. `koza-soru-mescit`, `koza-saha-avlu`.

---

## 4. 3D modeldeki nesne adlarını bulma

GLB dosyası sıkıştırılmış olsa da nesne adları dosyanın başındaki JSON bölümünde açık yazılıdır. Şu betikle listele, sonra yalnız bu listedeki bir adı kullan:

```python
import json, struct, sys
b = open(sys.argv[1], 'rb').read()
n = struct.unpack_from('<I', b, 12)[0]
j = json.loads(b[20:20 + n])
kok = j['scenes'][j.get('scene', 0)]['nodes']
print('\n'.join(sorted(j['nodes'][i].get('name', '?') for i in kok if 'mesh' in j['nodes'][i])))   # yalnız geometrisi olanlar dokunulabilir
```

Çalıştırma: `python3 adlar.py DC/eserler/<eser>/3d/export/<glb>_sunum.glb`

- `Zemin*`, `Cevre*`, `Olcek*` ile başlayan adları ve `model.json`'daki `sunum_ek` listesindekileri **seçme.** Bunlar zemin, ağaç ve ölçek figürleri; yapıya ait değiller.
- Uygulama, dokunulan parçayı bu üst düzey adla tanır. Alt nesne adları işe yaramaz.

---

## 5. Test

1. `bash DC/design/test-redmi9t-v2/sunucu.sh 8081`. `hazirla.py`, bir rozet olmayan bir göreve bağlıysa hata verip durur; önce bunu düzelt.
2. Her eserde mobil (390 × 844) ve masaüstü (1440 × 900) boyutunda şunları dene:
   - Eser sayfasında «Bulmaca»ya dokun. Soru açılıyor, fotoğraf görünüyor.
   - Yanlış şık seç: sıradaki ipucu açılıyor.
   - Doğru şık seç: açıklama, kaynak ve rozet görünüyor; üstte rozet bildirimi çıkıyor.
   - Saha görevinde «3D modelde bul»a dokun. Yanlış bir parçaya dokunmak görevi bitirmiyor; doğru parçaya (`evden.parca`) dokunmak bitiriyor.
   - «Buradayım» yerel ağda konum vermez (https gerekir). «Konum alınamadı» uyarısının çıkması beklenen davranış.
3. Profil (avatar): Rozet sayısı bütün eserlerin rozetlerinin toplamı olmalı (`k / n`). Kazanılmamış rozetler soluk ve «nasıl kazanılır» yazıyor.
4. «Bu cihazdaki ilerlemeyi sil» ile sıfırla. Ulucami'nin görevleri hâlâ çalışıyor.
5. Tarayıcı konsolunda hata yok.

---

## 6. Teslim

1. **6 dosya:** `DC/eserler/<eser>/icerik/gorevler.json`.
2. **`DC/design/test-redmi9t-v2/BENIOKU.md`**: «Bulmaca, saha görevi, rozetler ve profil» bölümünün sonuna kısa bir ek. Hangi esere hangi soru ve görev eklendi, toplam rozet sayısı.
3. **Rapor (bana, düz metin), eser başına:**
   - **Soru:** soru, 4 şık, doğru cevap, kaynak kodu. Yanlış şıkların neden yanlış olduğunu bir cümleyle yaz.
   - **Saha görevi:** ne bulunacak, `evden.parca` adı, kaynak kodu.
   - **Rozetler:** adlar ve koşullar.
   - **Değerlendirip almadığın konular** ve nedenleri (ör. «rivayet olduğu için soru yapmadım»).
   - Kodda bir eksik bulduysan ne olduğu.

## 7. Yapma

- Kaynağı olmayan ya da «Tarihsel çıkarım» etiketli bilgiden soru.
- Rivayeti, tartışmalı sayıyı ya da tahmini kesin cevap gibi sunma.
- Cami ya da türbe içinde görev.
- Modelde olmayan bir nesne adı; tahminle yazılmış ad.
- Puan, süre, seviye, sıralama.
- Kod dosyalarına, v1'e, `apps/`'e ya da Ulucami dosyalarına dokunma.
