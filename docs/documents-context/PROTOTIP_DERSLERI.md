# AKAR · Prototipten çıkan teknik dersler

*Kaynak: İstanbul/Kılıç Ali Paşa prototipi (vanilla JS + three.js + MapLibre). Prototip kodu `design/ilk-prototip` klasöründe; ürün React + TypeScript ile yeniden yazılıyor. Bu belge, yeniden yazarken tekrar edilmemesi gereken tasarım kararlarını ve tuzakları toplar. Güncel şema ve kurallar: `FRONTEND_BACKEND_NOTLARI.md`.*

---

## 1. Koordinat çerçevesi
- Her eser kendi **yerel çerçevesinde** modellenir: birim metre, orijin = yapının taban izi merkezi, +y yukarı, +z kıble yönü.
- Haritadaki model ile detay sahnesi aynı çerçeveyi kullanır. Çerçeveden Mercator'a dönüşüm tek bir matriste yapılır (yaw döndürmesi + 90° X dönüşü + metre başına Mercator ölçeği).
- Hikâye verisindeki tüm kamera konumu, hedef ve kart `anchor` değerleri bu çerçevede **metredir**. Bu yüzden model yeniden ölçeklenirse hikâye verisi bozulur; ölçek değişmez kalmalı.
- Coğrafi koordinattan yerel çerçeveye çeviri küçük mesafeler için eşdikdörtgen yaklaşımla yapılır (onlarca metre için yeterli).
- Çok yapılı kompleksler (cami + hamam + çeşme) için ayrıca bir `CENTER` noktası tanımlanır; orbit pivotu odur.

## 2. Çizim döngüsü: sürekli değil, talep üzerine
- Sürekli `requestAnimationFrame` döngüsü yok. Animasyonlar bir kümeye eklenir; küme boşalınca çizim durur.
- Statik bir değişiklikten sonra çizimi tetiklemek gerekir; aksi hâlde ekran güncellenmez.
- Sonsuz dönen efekt (örn. akan sikkeler) çizim döngüsünü açık tutar. Bölüm değişince temizlenmelidir.
- Performans kuralları: gerçek zamanlı gölge yok (altına "blob" gölge düzlemi), `pixelRatio ≤ 1,5`, düşük donanımda 1 ve MSAA kapalı, sahne kapanınca tüm GPU kaynakları `dispose`.
- `prefers-reduced-motion` açıkken tüm geçişler anında olur, deniz animasyonu donar.

## 3. Kamera sistemi (en ince kısım)
- **Kural 1:** Kamera `position` ile `controls.target` **birlikte** hareket ettirilir; yalnız `lookAt` kullanılmaz. Aksi hâlde pivot ile bakılan nokta ayrışır ve kullanıcı dokununca görüntü zıplar.
- **Kural 2:** Her yeni hareket bir `token` artırır; eski geçiş kendi token'ı eşleşmeyince durur (iptal mekanizması).
- Geçiş süresince kontroller kapalı, sonunda açılır. Uzun hareketlerde hafif yay (`lift`) çizilir; ease-in-out cubic.
- `free` bayrağı: kullanıcı kompleksin etrafında serbest mi? Serbestken pivot, merkezden en çok ~24 m yatay ve 2–20 m yükseklikte tutulur; ufkun altına inilmez (polar 0,25–1,38); mesafe 20–240 m.
- **Hikâye çekimi tutulurken kullanıcı sürüklerse** kamera önce pivotu merkeze çeker (`recenter`), böylece döndürme denizin değil binaların etrafında olur.
- Kullanıcı hikâye sırasında sahneyi tutarsa anlatım durmaz; sadece kamera merkeze döner ve sonraki bölüm kamerayı yeniden alır.
- Alt panel sahneyi kapatmasın diye `camera.setViewOffset` ile sahne panel yüksekliğinin ~%42'si kadar (en çok ekranın %25'i) yukarı kaydırılır. Panel boyutu değişince (`ResizeObserver`) yeniden hesaplanır.
- Çift dokunuşla zoom engellenir.
- ⚠️ Kadran çalışırken OrbitControls'un damping momentumunu sıfırlamak için iç alanlara (`_sphericalDelta`, `_panOffset`) dokunuldu. Bunlar public API değildir; three.js sürümü yükseltilirse kırılabilir.

## 4. Döndürme kadranı
- UI ile anlam ayrıdır: kadran yalnızca arayüz (pointer/klavye, çentikler, yerleşim) ve `onGrab / onTurn(deg) / onZoom / onReset` callback'lerini üretir; açının ne demek olduğuna sahibi (harita ya da detay) karar verir.
- Topuz açısı = pivottan bakıldığında kameranın pusula yönü. Model +z ekseni kıbleye baktığı için dönüşüm `bearing = kıble − θ` biçimindedir.
- Merkez dokunuşu = varsayılan görünüme dön; merkezin en iç %15'i yok sayılır (açı kararsız).
- Erişilebilirlik: `role="slider"`, `aria-valuetext` ("Kuzeydoğu, 45°"), klavyede ±15°.
- Yerleşim: sağ kenarda dikey ortada; yer yoksa önce zoom satırı, sonra kadranın kendisi gizlenir. Hiçbir şeyin üstüne binmez. 96 px, küçük ekranda 64 px.

## 5. Anlatım (hikâye) motoru
**Veri:** her bölümde en çok bir kamera çekimi, bir kart, bir efekt, bir güven etiketi.
```jsonc
{ "id": "...", "text": "...",
  "camera": { "position": [x,y,z], "target": [x,y,z], "orbit": true },
  "card":   { "title": "...", "body": "...", "anchor": [x,y,z], "trust": "...", "placeholder": true },
  "effect": { "type": "highlight", "target": "..." } | { "type": "flow", "from": [..], "to": [..], "labels": [..] },
  "trust":  "Doğrulanmış" | "Tarihsel çıkarım" | "Temsili canlandırma" }
```
Üründe bu liste veritabanından gelir ve her cümle önceki cümlenin **tam sahne durumuna** göre çözülür (bkz. `FRONTEND_BACKEND_NOTLARI.md`).

**`activate(i)` sırası:** önceki bölümün `cleanup()`'ı (kart ve efekt kaldırılır, kendi geometri/materyali `dispose`) → listede aktif öğe işaretlenir → kamera geçişi → kart (CSS2D, altı 3B noktaya oturur, altın sap) → efekt.

**Efektler**
- *Vurgu (highlight):* hedef geometrinin üstüne `polygonOffset` ile öne itilmiş şeffaf altın kopya; opaklık ~2,4 sn nabız atar, sonra sabitlenir. Sonsuz döngü yok. Paylaşılan geometri `dispose` edilmez; yalnız efektin kendi ürettiği edilir.
- *Akış (flow):* iki nokta arasında ortası ~14 m yükseltilmiş Bézier eğrisi; altın tüp `setDrawRange` ile ~2,2 sn'de çizilir, etiketler çizgi oraya ulaşınca belirir, sonra sikkeler eğri boyunca döner.

**Dinle modu**
- Prototipte `speechSynthesis` (tr-TR, hız 0,95) kullanıldı. Ürün için **cümle başına ses dosyası** öneriliyor; aşağıdaki tuzaklar yine de geçerli kalır (otomatik ilerleme yedeği için).
- iOS: kilit açmak için dokunuş bağlamında boş bir utterance hemen konuşturulur.
- Sesler geç yüklenebilir: `voiceschanged` en çok ~1,5 sn beklenir.
- Türkçe ses yoksa zamanlı otomatik ilerleme: `max(5 sn, metin uzunluğu × 55 ms)`.
- `pause()` Android'de güvenilmez; duraklatma = iptal, oynatma = bölümü baştan başlat.
- Geç gelen eski callback'ler yanlış ilerletmesin diye `token` sayacı kullanılır; Chrome'un bekleyen utterance'ı çöpe atmaması için referans tutulur.

**Oku modu:** liste kaydırılır; `IntersectionObserver` (`rootMargin: -46% 0 -46% 0`) listenin dikey ortasındaki ince bandı kesen öğeyi aktif bölüm yapar. Dinle ↔ Oku geçişinde mevcut bölüm korunur.

**Bitiş:** ✕, "Hikâye bitti · Devam" ya da Dinle'de son bölümün bitmesi aynı sonu tetikler: ses durur, kamera serbest bırakılır, kompleksin geniş görünümüne uçulur, hikâye sonrası eylemleri açılır.

## 6. Görsel stil
- Tüm binalar tek materyal setini paylaşır: 3 basamaklı toon gölgeleme + vertex color, sabit piksel kalınlıklı "inverted hull" kontur (renk, yüzeyin koyu tonu; siyah mürekkep yok), 30° eşikli kenar çizgileri, yumuşak blob gölge.
- Parçalar `box / cyl / dome / semiDome / arch` gibi yardımcılarla üretilir ve tek buffer'da birleştirilir.
- Not: Ürünün stil yönü Blender'da üretilen düşük poligonlu .glb'lere geçti (bkz. `eserler/`); bu bölüm yalnız sahne mantığı için referanstır.

## 7. Bilinen sınırlar (prototipte)
1. Detay görünümü tek eserde sabitlenmişti; sahne tanımı (modeller, merkez, intro/geniş kamera, hikâye dosyası, vurgu hedefleri) eser başına **parametre** olmalı.
2. Bulmaca, Geçmişi Gör görselleri ve gravür kartı yer tutucuydu.
3. İz Bırak yalnız `localStorage`; sunucu/moderasyon yoktu.
4. Birlikte Gez linki üretiliyor ama oda senkronu yoktu.
5. Hamamın konumu ve ada/deniz sahnesi temsilîydi; ölçüler tahminiydi.
6. Haritada yalnız Latin alfabeli etiketler (`name:tr` / `name:latin`); POI etiketleri rota duraklarıyla çakışınca gizleniyordu.
