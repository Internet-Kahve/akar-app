# Prompt: yedi eserde 3D parça adları ve birleştirmeler (29 Ekim 2026)

Kullanım: Blender eşitlemesi (§53, `PROMPT_blend_kaynagi_esitle_7_eser.md`) BİTTİKTEN sonra aşağıdaki kod bloğunu 3D üretim ajanına (akar-3d-model) olduğu gibi ver. İş Blender'da yapılır; kaynak artık blend + malzeme-paleti.json.

## Neden

- Eser detay sayfası `<glb>_sunum.glb`'yi açar; sahnenin kökündeki her mesh düğümü ayrı bir tıklanabilir parçadır.
- Kartı (`icerik/parcalar.md`) yalnız Ulucami'de var. Diğer altı eserde kart yok, bu yüzden her küçük parça (silme, baca, dikiş, kubbe) adıyla ayrı ayrı seçiliyor.
- Kullanıcının gördüğü örnekler:
  - Koza Han'da mescidin gövdesi ile kubbesi ayrı seçiliyor.
  - Mescit gövdesi seçilince yan avludaki (develik) yuvarlak nesne de seçiliyor; bu nesne yanlışlıkla mescitle aynı mesh'e birleştirilmiş.
  - Çatıdaki parçalar tek tek seçiliyor.
- Web tarafında bu oturumda iki şey yapıldı (test-redmi9t-v2/app.js):
  1. Bir kartın bütün parçaları birlikte seçilir ve vurgulanır. Örneğin Ulucami'de dört cephe ile pencere girintileri tek kart olduğu için artık birlikte yanar.
  2. `3d/model.json`'a `"tiklanmaz": [...]` listesi eklenebilir. Bu listedeki parçalar, eserin kartı olmasa da tıklanmaz.

## Prompt

```
AKAR 3D: yedi eserin parça yapısını sadeleştir ve düzelt. Renk, doku, AO ve görünüm DEĞİŞMEZ. Değişen yalnızca sahnenin kökündeki parçaların bölünüşü ve adları.

ÖNCE OKU
- docs/documents-context/yaptiklarim-2.md §31 (kurallar), §53 (eşitleme), §55
- design/test-redmi9t-v2/app.js: Sahne3D (yukle, grup, tiklanir) ve sunumEk kuralı (Zemin*, Cevre*, Olcek* ile model.json sunum_ek tıklanmaz)
- eserler/ulu-cami/icerik/parcalar.md (örnek kart tablosu ve «kartı olmayan parçalar» bölümü)
- Her eserin parça adlarının geçtiği yerler:
  - icerik/hikaye.md («Vurgu (3D)» sütunu)
  - icerik/eser-hakkinda*.md (3D okuma satırları)
  - icerik/parcalar.md
  - icerik/gorevler.json
  - 3d/model.json (ana_parca, ortu_gruplari, sunum_ek)

İLKE
Kökteki her parça, ziyaretçinin dokunup «bu ne?» diye soracağı ve ileride kendi kartı olabilecek bir birim olmalı. Örnekler: mescit, kubbe(ler), portal, revak, şadırvan, minare. Böyle bir birim olmayan parçalar için iki yol var:
  (a) En yakın anlamlı parçaya birleştirilir (Blender'da join; malzemeler korunur, malzeme sayısı değişmez).
  (b) Kendi başına kalması gerekiyorsa (örneğin örtü grubu ya da hikâye vurgusu için) model.json «tiklanmaz» listesine yazılır.
Yanlış birleşmiş geometri (birbirinden uzak, ilgisiz iki nesnenin tek mesh'te olması) ayrılır ve doğru parçaya verilir.

ESER BAŞINA
1. Envanter (değişiklikten önce): kökteki her parça için ad, üçgen sayısı, sınır kutusu ve bağlantısız ada sayısı. Ayrıca parçanın adının hangi dosyalarda geçtiğini çıkar (yukarıdaki listeden). Bu tabloyu 3d/kontrol/<yeni sürüm>/parca_envanteri.md olarak yaz.
2. Yanlış birleşme taraması: bir mesh'in adaları birbirinden yapı boyutunun %15'inden uzaksa raporla ve incele. Bilinen örnek: Koza Han Avlu_Mescit içindeki, develik avlusunda duran yuvarlak nesne. Bu nesneyi ayır; ne olduğunu rölöve ve fotoğraftan bul, uygun ada ver ya da ait olduğu parçaya kat.
3. Sadeleştirme önerisi: eski ad → yeni ad (ya da «birleşti → X», ya da «tiklanmaz»). Koza Han için beklenen yön:
   - Avlu_Mescit + Mescit_Kubbe + Mescit_Dikis → Mescit
   - Çatı ile ilgili ince parçalar (Baca, Silme_Kat vb.) ya ait oldukları ana parçaya birleşir ya da tiklanmaz olur
   - Kubbe_Avlu'nun ne olduğu adında açık olmalı
   Diğer beş eser (Bedesten, Orhan Bey Camii, Orhan Bey Hamamı, Emir Hanı, Orhan Gazi Türbesi) için aynı ilkeyle karar ver; kararının gerekçesini tabloda tek satırla yaz.
4. ULUCAMİ ÖZEL: Ulucami'nin parçalarının çoğu kartlarda, hikâyede ve «İçini göster» gruplarında kullanılıyor.
   - parcalar.md, hikaye.md, ortu_gruplari ve eser-hakkinda okuma satırlarında geçen hiçbir ad değişmez, birleşmez, silinmez.
   - Yalnız hiçbir yerde geçmeyen parçalar (örn. Mermer_Bant, Silme_Ust) için karar verilebilir: «tiklanmaz» kalsın ya da Govde/cepheye birleşsin.
   - Şüphede değiştirme, raporla.
5. Blender'da uygula: yeni blend sürümü açılır, eskiler silinmez. Build betiğinin yeni sürümü aynı bölünüşü üretir. Hem uygulama hem sunum GLB'si dışa aktarılır; Draco ve glb_temizle.mjs her zamanki gibi.
   - Uygulama GLB'si ile sunum GLB'sinin yapı parçalarının adları birebir aynı olmalı (harita ana_parca'yı uygulama GLB'sinde arar).
6. Referansları yeni adlara çevir: hikaye.md Vurgu sütunu, eser-hakkinda okuma satırları, parcalar.md, gorevler.json, model.json (ana_parca, ortu_gruplari, sunum_ek). Metinlere dokunma, yalnız ad listeleri değişir.
7. model.json'a «tiklanmaz» ekle (gerekiyorsa). _aciklama'ya tek cümle: «tiklanmaz: kartı olmayan eserlerde de tıklanmayan süs/taşıyıcı parçalar (29 Ekim 2026).»
8. Kart taslağı (içerik ekibi için, uygulamaya bağlanmaz):
   - Kartı olmayan altı eser için icerik/parcalar_taslak.md yaz.
   - Sütunlar yalnız şunlar: Parçalar | Önerilen başlık | Not. Metin YAZMA.
   - parcalar.md ADIYLA DOSYA AÇMA: o dosya varsa kartsız parçalar tıklanmaz olur ve kartlar boş görünür.

DOĞRULAMA (her eser, sayıyla)
a) Tıklama haritası: aynı kameradan, her kök parça ayrı düz renkle boyanmış render. Önce/sonra yan yana; kontrol/<sürüm>/tiklama_haritasi.png. (Kullanıcı bunu görerek karar verecek.)
b) Toplam üçgen ve köşe sayısı önceki sürümle aynı (yalnız birleştirme/ayırma yapıldı). Malzeme sayısı ve görünen renkler aynı. Aynı kameradan normal render'da fark gözle seçilmez.
c) Referans denetimi (betik): hikaye, okuma, parcalar(.md/_taslak), gorevler, model.json'da geçen her parça adı yeni uygulama VE sunum GLB'sinde var. Eksik ad sıfır.
d) Kök parça sayısı önce → sonra (sunum ekleri Zemin*/Cevre*/Olcek* hariç).

SONUÇ
- Yeni sürümler (ör. Ulucami v30, Bedesten v09, Koza Han v17, Orhan Bey Camii v10, Orhan Bey Hamamı v08, Emir Hanı v08, Orhan Gazi Türbesi v05). Ulucami'de hiçbir değişiklik gerekmediyse sürüm açma.
- model.json glb alanları yeni sürüme; python3 docs/documents-context/design/harita/modelleri-gom.py.
- 3d/README.md sürüm satırı; yaptiklarim-2.md en altına yeni madde.

KURALLAR
- apps/ ve frontend/backend koduna dokunma; test-redmi9t/ (v1) değişmez; app.js'e dokunma.
- git komutu çalıştırma; blend/build repoya girmez (Drive).
- Uydurma ad yok: bir parçanın ne olduğu kaynaktan (rölöve, envanter, fotoğraf) bulunamazsa adı tarifle ver (ör. «Develik_Yuvarlak_Yapi») ve raporda «belirsiz» diye işaretle.

RAPOR: eser başına ad eşleme tablosu (eski → yeni / birleşti / tiklanmaz), kök parça sayısı önce → sonra, yanlış birleşme bulguları, referans denetimi sonucu.
```
