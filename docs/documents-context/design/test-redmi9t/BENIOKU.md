# Redmi 9T prototipi ve performans testi

22 Ekim 2026. Bu klasörde iki sayfa var:

- **`index.html` · prototip.** Figma `akar-yeni`deki mobil (390 px) ve masaüstü (≥ 900 px) keşif, eser ve anlatım ekranlarının çalışan hâli; içerik gerçek (`eserler/*/icerik/`). Yönetim paneli yok.
- **`test.html` · performans testi** (21 Ekim). Yedi uygulama GLB'si haritada; tek model görüntüleyici, 10 sn FPS testi ve sonuç tablosu.

## Çalıştırma

Telefon ve bilgisayar aynı Wi-Fi'de olmalı. Bilgisayarda:

```bash
bash docs/documents-context/design/test-redmi9t/sunucu.sh
```

Betik önce `hazirla.py` ile içerik paketini üretir, sonra telefonda açılacak adresi yazar (`http://192.168.x.x:8080`; test sayfası `/test.html`). Telefonun Chrome'unda o adresi aç. Sayfa MapLibre ve three.js'i internetten (unpkg, jsDelivr) alır, telefonda internet olmalı; ilk açılış birkaç saniye sürebilir. Durdurmak için `Ctrl+C`.

Betik yalnız bu klasörün sayfalarını, harita stilini, 14 GLB'yi (7 normal + 7 sunum), `veri.json`'u ve küçültülmüş eser fotoğraflarını paylaşır; reponun başka dosyaları paylaşılmaz.

## İçerik paketi (`hazirla.py`)

- Altı eserin `icerik/hikaye.md` (cümle, fotoğraf, kart, vurgu, kaynak, güven + açı önerisi tablosu), `fotograflar.md` ve `eser-hakkinda.md` dosyalarını okur; Orhan Gazi Türbesi'nde yalnız fotoğraf ve «Eser hakkında» var.
- Kimlik bilgileri (ad, yıl, yaptıran) envanterden, betiğin başındaki `ESERLER` tablosunda. Rota: Hanlar Bölgesi Vakıf Yürüyüşü, 4 durak.
- Fotoğraflar `sips` ile uzun kenar 1280 px'e küçültülür; `.onbellek/` (Git dışında) ikinci çalıştırmada yeniden kullanılır. Elle: `python3 hazirla.py <klasör>`.
- **Haritada yerleşim düzeltmesi (`OSM_DUZELTME`):** 22 Ekim'de her model tepeden OSM bina sınırlarıyla karşılaştırıldı ve 1–11 m kaydırıldı (Ulucami 10,6 m doğuya, Bedesten 6,1 m doğu / 3,9 m güney …). Emir Hanı için seçilen OSM çokgeni başka bir binaydı; han uydu görüntüsünde ölçülüp konumu doğrudan yazıldı (eskisinin 48 m doğusu). Yedi modelin izi uydu görüntüsüyle karşılaştırıldı. Modelin **ana gövdesinin** ortası bu noktaya oturur (`app.js` `ANA_PARCA`: Koza Han'da `Govde_Dis`, Ulucami'de `Govde` …); İç Koza, avlu yapıları ve şadırvanlar kutuyu kaydırmaz.
- **Yön (`yaw`):** OSM yön açısı 90°'ye indirgendiği için 180° belirsiz kalır. Ulucami modelinde kuzey cephesi (taç kapı, minareler) +z'de, yani güneye bakıyordu; 22 Ekim'de 180° çevrildi (−6 → 174, `test.html` dahil).

## Prototipte neler var

- **Keşif haritası:** AKAR stili; OSM binaları 3D (harita eğikken), bizim modellerimiz gerçek konumlarında üstlerinde. Modellerin altında kalan OSM binaları çizilmez (aynı yapı iki kez görünmesin); modelden çok büyük olanlar (ör. Kapalıçarşı çatısı) kalır. Harita karoları bu bölgede binaları birleşik gruplar hâlinde verdiği için stilin `building_3d` katmanı kapalıdır; binalar tek tek ayrılıp `akar-bina-3d` katmanında aynı renk ve yükseklikle çizilir. Pine ya da modele dokununca eser kartı; Dinî / Su / Eğitim / Akar süzgeci; arama; 2D/3D, yakınlaştırma, konum.
- **Eserler ve Rotalar** (mobilde sürüklenebilir alt sayfa, masaüstünde sol panel); en alt durakta yalnız Eserler | Rotalar ve «Bursa ▾» satırı görünür; sayfa tutamaktan ya da bu başlıktan sürüklenir. Mobil eser kartı aşağı kaydırılınca kapanır. **Rota önizleme** (haritada çizgi ve yıldızlar, 4 durak, ilerleme).
- **Eser detayı:** Fotoğraf galerisi | 3D. 3D'de **sunum GLB'si** (zemin, ağaçlar, ölçek insanları) haritadaki yönle açılır (azimut 0 = kuzey); kadraj ve tıklanabilir parçalar yalnız yapının kendisidir (`Zemin*`, `Cevre*`, `Olcek*`, `Avlu_Agac`, `Avlu_Cim` hariç). Haritada normal GLB kalır. 3D'de parçaya dokununca parça hafif sarı olur ve adı yazılır (tekrar dokununca söner). Seçicinin yanındaki **parmak ikonlu düğme** tıklanabilir bütün parçaları çok soluk sarıyla hızlıca yakıp söndürür (fotoğraf görünümündeyse önce 3D'ye geçer).
- **Anlatım:** Dinle (tarayıcının Türkçe sesiyle, `speechSynthesis`) ve Oku (liste kaydırıldıkça sahne değişir). Fotoğraf görünümünde her cümlenin fotoğrafı; 3D görünümünde hikâyedeki açı (azimut, eğim, hedef), vurgu (altın) ve kart. İlerleme çubuğu, ✕ / Esc, Boşluk / ↓, hız 1–1,5x, ekranı doldur / sığdır.
- **Hikâye sonrası** ve **Eser hakkında** (paragraf başına güven etiketi ve kaynak).
- **Geçmişi Gör** (Figma A1, A2, «eski görüntü yok», «çekim yeri bilinmiyor» ve masaüstü W karşılıkları): Foto Atlas'tan eski fotoğraflar, tarih şeridi, kaynak satırı ve lisans; «Nereden çekildi?» haritasında çekim noktası ve görüş konisi (eserin fotoğrafları yeşil, diğerleri gri; noktaya dokununca o fotoğraf seçilir). Fotoğrafı olmayan eserlerde (Bedesten, Hamam, Emir Hanı) başka fotoğraflarda uzaktan göründüğü yerler listelenir. Giriş: eser detayındaki «Geçmişi Gör» bağlantısı ve hikâye sonrası. Veri: `eserler/<eser>/gecmisi-gor/` (hazirla.py `gg/` altına kopyalar).
- **Kamera (D) ve Çekildi (D2):** eski fotoğraf canlı görüntünün üstünde yarı saydam (kaydırıcıyla Eski ↔ Bugün; iki parmakla büyüt/kaydır), çekince Kaydırıcı | Yan yana karşılaştırma; iç mekân fotoğrafında «İç mekândasın» notu. Tarayıcı kamerayı yalnız https'te açar: telefonda yerel ağ adresinden (http) «Kameraya izin verilmedi» ekranı çıkar, «Galeriden seç» ile fotoğraf seçilip karşılaştırma yine denenebilir. Bilgisayarda `localhost` ile kamera çalışır. İz Bırak gönderimi prototipte yok.

## Bilinen sınırlar

- Ses, cihazın Türkçe TTS sesine bağlı; ses yoksa ya da `onend` gelmezse cümle tahmini süreyle ilerler. Gerçek ses dosyaları yok.
- Mesafe ve süre (~10 dk, 0,5 km) hesaptır; kullanıcının konumuna göre mesafe gösterilmez.
- Bugünkü eşi olan fotoğraf (A1b kaydırıcısı) henüz veride yok. İz Bırak, Yaşayan hafıza, Profil, giriş ekranları prototipte yok.
- `test.html` eski yerleşimi (kutu ortası, düzeltmesiz OSM noktası) kullanır; yalnız performans ölçümü içindir.

## Performans testi (`test.html`)

1. Haritayı kaydır, yakınlaştır (yapılar zoom 14,5'ten itibaren görünür) ve «Eğik harita» ile yatır; sol üstteki «Harita FPS»e bak. «Yapılar: kapalı» ile aynı hareketi yapısız dene; fark, 7 yapının (~199 bin üçgen) haritaya maliyetidir.
2. Bir pine dokun. Parmakla döndür, iki parmakla yakınlaştır.
3. «10 sn test»: kamera 10 saniye döner; ortalama, %1 düşük ve en düşük FPS yazılır. Ortalama 50 üstü iyi, 25–50 sınırda, 25 altı zayıf.
4. Aynı modeli **Yapı** ve **Sunum** ile dene; piksel oranını ve kenar yumuşatmayı değiştir.
5. «Sonuçlar» → «Kopyala»: cihaz bilgisi ve bütün ölçümler tek metin olarak kopyalanır.

**Işık seçici** (yeni palet · yumuşak · açık · canlı · koyu) yalnız test sayfasında; varsayılan «yeni palet» prototip ve frontend'in başlangıç değeriyle aynı (`FRONTEND_BACKEND_NOTLARI.md` §9). Her iki sayfa da geliştirme bilgisayarında SwiftShader (yazılımsal GPU) ile sınandı: işlev doğru, FPS değerleri telefonu temsil etmez.
