# Görev dağılımı — 15 Ekim 2026 (finaller 7–8 Kasım)

## Durum
Hazır: 32 eser için eser.md (ölçü, kaynak kodları, stil rengi, vurgu), şablonlar, `_ortak_stil.md`, KARARLAR_14Ekim.md.
Hazır değil: hiçbir 3D model. Pilot yok. Bazı yükseklikler yok (tür varsayılanı + VARSAYIM).

## ChatGPT
1. (çalışıyor) Tüm W satırlarının URL + birebir alıntı doğrulaması (~70 satır). Çıktı: tablo (eser, satır, URL açılıyor mu, alıntı sayfada var mı, düzeltme).
2. Boş yükseklik / kubbe çapı alanları için web taraması (yalnız W kaynağı; bulamazsa "bulunamadı" yazsın, uydurmasın).
3. Koza Han cilt-2 s.12 planından ölçek hesabı (PDF sayfası görsel olarak verilirse): ahır avlusu 22×30 mi 28×30 mu.

## Talha (içerik)

Her eser için üç şey hazırlanır: **hikâye** (dinlenen/okunan cümleler), **Eser hakkında** (okunan uzun metin) ve **fotoğraflar**. Hepsi eserin kendi klasörüne konur, panele bu dosyalardan girilir.

### Sıra
1. Hero: Ulucami (`ulu-cami/`), Bedesten (`yildirim-bayezid-bedesteni/`), Koza Han (`koza-han/`).
2. Rota eserleri (Hanlar Bölgesi; rota kesinleşince).
3. Kalan eserler: sadece Eser hakkında ve galeri fotoğrafları, hikâye yok.

### Klasör düzeni
Her eser klasörüne `icerik/` alt klasörü açılır. 3D dosyalarına (`claude/`, `ref-foto/`…) dokunulmaz.

```text
tasarim/3d-eser/bursa/eserler/ulu-cami/icerik/
├── hikaye.md          cümleler + her cümlenin fotoğrafı
├── eser-hakkinda.md   Tarihçe · Mimari · Vakıf ve akar
├── fotograflar.md     seçilen fotoğrafların bilgisi ve galeri sırası
└── foto/              seçilen fotoğrafların KOPYASI (01_dis-havadan.jpg …)
```

Fotoğraflar `veri/bursa-foto/` içinden **kopyalanır**, taşınmaz. Ulucami için `I. ve II. Cilt - Osmangazi/Ulucamii Klasörü/`, Bedesten ve Koza Han için `…/Ticari Yapılar Klasörü/`. Diğerleri: `veri/bursa-foto/README.md` tablosu. Klasör adları tahmindir; fotoğrafın o esere ait olduğunu gözle kontrol et.

### Kaynak kodu
`eser.md` ile aynı yazım: `E cilt-1 PDF s.25` (envanter kitabı, **PDF sayfası**), `W` + URL, `H` (hesap; girdilerini yaz). Bilgiyi önce `eser.md`'deki alıntılardan al, orada yoksa `veri/metin/` altındaki kitap metninden.

**Kaynağı olmayan cümle yazılmaz.** "Doğrulanmamış" diye bir etiket yok, panel de kaynaksız cümleyi yayınlamıyor. Kaynak bulunamazsa cümle çıkarılır.

**Güven etiketi** önerisi her cümleye ve her paragrafa yazılır, son kararı Muhammed verir:
- **Doğrulanmış:** kitapta açıkça yazıyor.
- **Tarihsel çıkarım:** kitap "düşünülmektedir, tahmin edilmektedir" diyor ya da birkaç bilgiden çıkarılıyor.
- **Temsili:** görsel canlandırma (portre, 3D).

### 1. Hikâye (`hikaye.md`)
- **Uzunluk:** hero 8–12 cümle (~1,5–2 dk), rota eseri 5–8 cümle.
- **Cümle:** tek bilgi, en fazla ~20 kelime (sesli 6–8 sn). Sade Türkçe, abartı yok ("muhteşem", "en güzel" yok). Övgü kaynakta varsa sahibine verilir: "Evliya Çelebi … diye anar."
- **Akış:**
  1. Kim, ne zaman yaptırdı.
  2. Neden yaptırdı.
  3. Dışarıdan ne görülür.
  4. İçeride ne var.
  5. **Vakıf/akar bağı** (her hikâyede en az bir cümle; projenin ana fikri).
  6. Bugün / sonraki durak.
- **Mevcut 6 Ulucami cümlesi** (Tam_Baglam §10) başlangıçtır, aynen alınmaz. Her biri `eser.md`'deki kaynakla yeniden kontrol edilir. Örneğin "1399" için `E cilt-1 PDF s.19`, "Yıldırım Bayezid yaptırdı" için `s.20`; "dördüncü padişah" cümlesinin kaynağı `eser.md`'de yok, bulunmalı ya da cümle çıkmalı.

| # | Cümle (TR) | Fotoğraf | Kart | Vurgu (3D) | Kaynak | Güven (öneri) |
|---|---|---|---|---|---|---|
| 1 | Ulucami, 1399'da Yıldırım Bayezid tarafından yaptırıldı. | 01_dis-havadan.jpg | hayır | — | E cilt-1 PDF s.19, s.20 | Doğrulanmış |
| 4 | Üstünü yirmi kubbe örter. | 01_dis-havadan.jpg | hayır | Kubbeler | E cilt-1 PDF s.25 | Doğrulanmış |
| 5 | Ortadaki kubbe açıktır; altında havuzlu şadırvan vardır. | 04_ic-sadirvan.jpg | evet | Sadirvan_Kubbe | E cilt-1 PDF s.25, s.33 | Doğrulanmış |

**Cümleye fotoğraf seçme:**
- Fotoğraf cümlenin anlattığını göstersin: kubbe cümlesine kubbeleri gören havadan çekim, şadırvan cümlesine şadırvan.
- Kişi ya da soyut bilgi ("mimarı bilinmiyor") anlatan cümleye eserin genel fotoğrafı ya da kitabe/minber gibi ilgili bir detay konur.
- Akar cümlesine o akar eserin (ör. Bedesten) fotoğrafı konur, başlığında hangi yapı olduğu yazar. Başka yapının fotoğrafı bu eserinmiş gibi kullanılmaz.
- Aynı fotoğraf birkaç cümlede kullanılabilir. Fotoğraf her 1–2 cümlede bir değişsin.
- Yatay fotoğraf telefonda anlatımda daha iyi oturur, ama dikey de olur.

**Kart (sadece 3D'si olan eserde):**
- "Evet": fotoğraf 3D modelin gösteremediği bir şeyi gösteriyorsa (iç mekân, minber, hat, kitabe, eski fotoğraf).
- "Hayır": fotoğraf modelin zaten gösterdiği dış görünüşse.

**Vurgu:** modeldeki parça adı (`eser.md` Vurgu tablosu). Bilinmiyorsa boş bırak, 3D tarafı doldurur.

### 2. Eser hakkında (`eser-hakkinda.md`)
Uygulamadaki ekranın bölümleri sabittir (Figma "Eser hakkında"): **Tarihçe · Mimari · Vakıf ve akar**, en altta **Kaynaklar** listesi.

| Eser | Tarihçe | Mimari | Vakıf ve akar | Toplam |
|---|---|---|---|---|
| Hero | 100–150 kelime | 100–150 | 60–100 | 250–400 (~2 dk okuma) |
| Rota eseri | 60–100 | 60–100 | 30–60 | 150–250 |
| Diğer | 40–60 | 40–60 | biliniyorsa 1–2 cümle | 80–120 |

**Bölümlere ne yazılır:**
- **Tarihçe:** yaptıran, yıl, mimar (biliniyorsa), önemli olaylar (deprem, yangın, restorasyon yılları).
- **Mimari:** plan, ölçü, kubbe/minare, malzeme ve öne çıkan iç unsurlar (mihrap, minber, hat). Sayılar `eser.md`'den alınır.
- **Vakıf ve akar:** kim vakfetti, hangi gelir hangi yapıya gitti. Bilgi yoksa bölüm boş kalır, tahminle doldurulmaz.

**Yazım kuralları:**
- **Etiket:** her paragrafa tek güven etiketi. Çıkarım cümleleri doğrulanmış bilgiyle aynı paragrafa konmaz, ayrı paragraf olur.
- **Kaynak:** her paragrafın sonuna kaynak kodları yazılır, ör. `[E cilt-1 PDF s.25, s.33]`. En altta kaynak listesi.
- **Hikâyeden farkı:** hikâye kısa ve görsel, Eser hakkında ayrıntılı (isimler, tarihler, ölçüler). Hikâye cümleleri aynen tekrar edilmez.
- **Kopyalama:** kitaptan uzun pasaj kopyalanmaz, kendi cümlelerinle anlatılır. Kısa alıntı tırnak içinde ve sayfasıyla verilir.
- **İngilizce:** sonra, Türkçe onaylandıktan sonra.

### 3. Fotoğraflar (`fotograflar.md` + `foto/`)
- **Sayı:** hero 8–12, rota eseri 5–8, diğer eserler 3–5.
- **Galeri sırası** (eser detay sayfası; düzen: büyük → üst üste iki küçük → büyük):
  1. Eseri tanıtan dış görünüş (havadan ya da ana cephe). Bu aynı zamanda kapak.
  2. İç mekân genel.
  3. Öne çıkan detay (mihrap, minber, şadırvan, taç kapı).
  4. İkinci dış açı.
  5. Diğer detaylar.
- **Kalite:**
  - Net, düz (eğri değil), aşırı karanlık ya da patlak değil.
  - Ana konu kadrajın ortasında olsun (galeri kareleri kenarları kırpıyor).
  - **Tanınabilir insan yüzü ya da plaka olan fotoğraf seçilmez** (KVKK).
  - Aynı açıdan iki fotoğraf varsa iyisi seçilir.
- **Dosya adı:** `foto/` içinde `NN_konu.jpg` (`01_dis-havadan.jpg`, `04_ic-sadirvan.jpg`). Asıl dosya adı tabloda yazar.

| Dosya | Asıl dosya (veri/bursa-foto/…) | Galeri sırası | Başlık (TR) | Kısa metin (TR, 1 cümle) | Alt metin (ne görünüyor) | Kaynak | Lisans | Güven | Not (cephe, kalite) |
|---|---|---|---|---|---|---|---|---|---|
| 01_dis-havadan.jpg | …/Ulucamii Klasörü/DJI_….jpg | 1 | Ulucami, havadan | Yirmi kubbeli cami ve çevresi. | Kurşun kaplı yirmi kubbe, iki minare, arkada şehir ve dağ. | Bursa Vakıf Eserleri Envanteri, Cilt 1 (fotoğraf arşivi) | Vakıf Katılım, yazılı izin bekleniyor | Doğrulanmış | kuzeybatıdan, gün batımı, çok iyi |

- **Başlık + kısa metin:** 3D'de kart olarak görünen yazı budur.
- **Alt metin:** görme engelli kullanıcı için zorunludur.
- **Galeri sırası:** boş bırakılırsa fotoğraf sadece anlatımda kullanılır.

### Bitince
Her eser için `icerik/` hazır olunca Muhammed'e haber ver. Muhammed güven etiketlerini onaylar, sonra panele girilir. Panelde her satır `hikaye.md` ile aynıdır: Cümle · Fotoğraf · Kart · Açı · Vurgu.

## Talha'nın Claude'u (3D, Blender)
- Mevcut: Ulucami v02c (`tasarim/3d-eser/bursa/eserler/ulu-cami/claude/export/ulu-cami_v02c.glb`, 29.192 üçgen) ve Ayasofya pilotu.
- İlk iş: `build_v02c.py` yolları taşıma sonrası düzeltildi (yedek: `.bak_yol`); Blender'da çalıştırıp doğrula.
- Sonra: Ulucami'yi eser.md'deki yeni Palet/Vurgu (15 Ekim) ile karşılaştır, gerekirse v02d; ardından Bedesten, Koza Han (hero üçlüsü), sonra küçük türbe.
- Girdi: ilgili eser.md + sablonlar/ + `_ortak_stil.md`. Kaynaksız ölçü VARSAYIM; flat renk, ≤3 ton; hero ≤40k üçgen.
- Çıktı: .glb + kısa not (hangi ölçü hangi kaynaktan).

## Muhammed (karar)
- Hikâye cümleleri 2–6 için güven etiketi.
- `belgeler/_silinecek/` klasörünü sil (içinde kişisel veri var).
- Koza Han doğu duvarı kemerleri: kapalı (günümüz) kullanılacak mı? Öneri: kapalı.