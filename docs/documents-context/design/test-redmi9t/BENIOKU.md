# Redmi 9T test sayfası

21 Ekim 2026. Harita AKAR haritası (`design/harita/akar-style.json`, AKAR pinleri ve kümeleri). Yedi yapı, **uygulama GLB'leri** (yalnız yapı), haritanın üzerinde gerçek konumlarında ve 1 birim = 1 m ölçeğinde çizilir (MapLibre özel katmanı + three.js). Pine dokununca o yapı ayrı bir görüntüleyicide açılır. Amaç, yeni sürümlerin telefonda nasıl çalıştığını ölçmek: haritada tüm yapılar birlikteyken FPS, tek model yükleme süresi, üçgen ve draw call sayısı, 10 saniyelik FPS testi.

## Çalıştırma

Telefon ve bilgisayar aynı Wi-Fi'de olmalı. Bilgisayarda:

```bash
bash docs/documents-context/design/test-redmi9t/sunucu.sh
```

Betik telefonda açılacak adresi yazar (`http://192.168.x.x:8080`). Telefonun Chrome'unda o adresi aç. Sayfa harita ve three.js kütüphanelerini internetten (unpkg, jsDelivr) alır, telefonda internet olmalı. Durdurmak için `Ctrl+C`.

Betik yalnız bu sayfayı, harita stilini ve 14 GLB'yi (7 normal + 7 sunum) paylaşır; reponun başka dosyaları paylaşılmaz.

## Test adımları

1. Haritayı kaydır, yakınlaştır (yapılar zoom 14,5'ten itibaren görünür) ve «Eğik harita» ile yatır; sol üstteki «Harita FPS»e bak. «Yapılar: kapalı» ile aynı hareketi yapısız dene; fark, 7 yapının (~197 bin üçgen) haritaya maliyetidir.
2. Bir pine dokun. Parmakla döndür, iki parmakla yakınlaştır.
3. «10 sn test»: kamera 10 saniye döner; ortalama, %1 düşük ve en düşük FPS yazılır. Ortalama 50 üstü iyi, 25–50 sınırda, 25 altı zayıf (belgedeki Hafif sürüme geçiş eşiği).
4. Aynı modeli **Yapı** (uygulama dosyası) ve **Sunum** (çevre, ağaç, figür, kaide) ile dene. Piksel oranını 1 / 1,5 / tam ve kenar yumuşatmayı değiştirerek farkı gör.
5. «Sonuçlar» → «Kopyala»: cihaz bilgisi ve bütün ölçümler tek metin olarak kopyalanır.

## Notlar

- Orhan Bey Camii, Emir Hanı ve Orhan Bey Hamamı'nın pin konumları OSM bina merkezlerinden alındı (yalnız konum); Ulucami, Bedesten, Koza Han ve Orhan Gazi Türbesi konumları `veri/bursa/osm_secilen.csv`'den.
- Yerleşim: her yapının kutusunun yatay merkezi, OSM merkezine oturtulur; taban zemine konur. Yön: Ulucami, Bedesten, Koza Han ve türbe için OSM `yon_derece` değerinden; Orhan Bey Camii, Hamam ve Emir Hanı için haritadaki bina izine bakılarak (kırmızı bina çizgisiyle üst üste getirilip denetlendi). Yapıların ölçüsü planlardan, konumu OSM'den geldiği için bina izleriyle birkaç metre fark olabilir (Ulucami modeli OSM izinden büyük, plan ölçüsüne göre).
- «Yapılar» açıkken stilin kendi 3D bina katmanı gizlenir, aynı binalar iki kez çizilmesin.
- **Işık seçici** (yumuşak · açık · canlı · koyu): yapıların haritadaki görünümü. Varsayılan «yumuşak»: güçlü gökyüzü ışığı, malzeme renkleri biraz beyaza çekilmiş, modellere pişirilmiş (`COLOR_0`) koyu AO'nun gücü yarıya yakın kısılmış; amaç açık renkli haritada koyu kalmamak (Yandex 3D benzeri). Değerler `index.html` içindeki `ISIKLAR` tablosunda. Not: three.js r155'ten beri ışık şiddetleri eskisine göre π kat zayıf hesaplanır, eski örneklerdeki değerler koyu çıkar. Bu ayarlar yalnız haritadaki yapıları etkiler; pine dokununca açılan görüntüleyici ayrı ışıkla çizilir.
- Sayfa geliştirme bilgisayarında SwiftShader (yazılımsal GPU) ile sınandı: işlev doğru, ama oradaki FPS değerleri telefonu temsil etmez.
