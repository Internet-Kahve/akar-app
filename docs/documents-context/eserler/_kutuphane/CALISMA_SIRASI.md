# Claude Code komutları

> **15 Ekim değişikliği (önce bunu oku):**
> - Ulucami **v02c** hazır (`eserler/ulu-cami/claude/`). yeni iş: v02c'yi `eser.md`'deki Palet/Vurgu ile karşılaştır, gerekirse v02d.
> - Yeni eserlerde **B1 (kaynak turu) yapılmış sayılır**: 32 eser için `eser.md` hazır (ölçüler, kaynak kodları P/E/H/W/O/M/F/T, Palet, Vurgu). Doğrudan B2 (kütle turu): "eser.md'yi oku, ölçüler orada; boş hücre = tür varsayılanı, VARSAYIM olarak işaretle". Stil için `bursa/sablonlar/_ortak_stil.md` + ilgili tür şablonu.
> - Sıra: Ulucami (güncelle) → Bedesten → Koza Han → küçük türbe (örn. Orhan Gazi Türbesi). Diğer eserler final sonrası.
> - Kod yolu: `build_v02c.py` taşıma sonrası düzeltildi; ilk iş Blender'da çalıştırıp doğrula.

Claude Code'a (Opus) yapıştıracağın hazır komutlar. `<...>` olan yerleri doldur.
Her turdan sonra Claude Code DURUR; sen `kontrol/vNN/` içindeki render'lara bakıp bir sonraki komutu verirsin.

---

## B. Yeni bir eser (ör. Bedesten)

**B0. Sen hazırlarsın (15–30 dk).** Klasör: `eserler/<eser>/` (eser.md orada)
- `ref-foto/` gerçek fotoğraflar (en önemlisi: ana cepheye karşıdan bir tane, havadan bir tane)
- `ref-maket/` varsa maket fotoğrafları · `ref-model/` varsa başka 3D model görüntüleri
- PDF/makaleler → `veri/bursa/`, linkler → `veri/bursa/links.md`
- Gözüne çarpan 3–5 karakteristik özelliği not et.

**B1. Kaynak turu (model yok):**
```
akar-3d-model skill'ini yükle, eserler/_kutuphane/AKAR_3D_Yontem_Notlari.md'yi oku.
Eser: <eser adı>, klasör eserler/<eser>/ (Ulucami'deki klasör düzenini kullan: build/, blend/, kontrol/vNN/, export/, prompt/).
Bu tur model kurma, sadece kaynak turu:
1. veri/metin'de envanterdeki bölümü bul, ölçüleri tabloya dök.
2. ref/ altındaki PDF'lerde plan, kesit, cephe çizimi ara; bulursan PNG olarak ref/'e çıkar. Planda kuzeyin yönünü yaz.
3. OSM ayak izini al.
4. Kaynakları önceliğe göre karşılaştır (plan > envanter > OSM > maket > foto); 2 m'den fazla çelişki varsa listele.
5. Fotoğraf/maketten yükseklikleri ölç (plan genişliği ölçek).
6. <eser>_notlar.md yaz: klasör düzeni, ölçü tablosu, renkler, parça listesi önerisi, tur planı.
Benim gözlemlerim:
- <gözlem 1>
- <gözlem 2>
- <gözlem 3>
Sonunda sorularını sor ve DUR.
```
Sen: soruları cevapla, parça listesini onayla.

**B2. Kütle turu:**
```
Notlara göre v01 kütle turunu yap. Bütün ölçüler build/build_v01.py başında P tablosunda. Pencere ve süs yok.
Tur içinde referansla aynı ölçekte bindirme yap, en fazla 2 kez P'den düzelt.
Sonunda: kontrol_hepsi, ana cephe ortografik render referans fotoğrafla yan yana, havadan render, en sorunlu parçaya yakın render. DUR.
```

**B3. Kütle düzeltmesi (gerekirse, en fazla 2 kez):**
```
v01b: <neyin yanlış olduğu ve nasıl olması gerektiği, madde madde>. İşaretli görsel: <dosya yolu>. Değişmeyenler: <dokunulmayacaklar>. Sonunda aynı render'lar. DUR.
```
İpucu: "güzel değil" yerine "minare kaidesi cepheden öne çıkmalı" gibi ölçülebilir yaz; ekran görüntüsünü işaretle.

**B4. Dondurma:**
```
Kütle kabul. Notlara "GEOMETRİ DONDURMA vNN" yaz ve bu oturumdaki kararları "Kararlar" başlığına ekle.
```

**B5. Detay + renk + çıkış:**
```
v02 detay turu: pencereler, kapılar, silmeler, eserin karakteristik süslemeleri, son palet ve ao_vertex, export/<eser>_v02.glb.
Kütleye dokunma. eserler/ulu-cami/prompt/PROMPT_v02.md'yi örnek al. Sonunda kontrol_hepsi ve 4 render. DUR.
```

**B6. Teslim:** `.glb` → `belgeler` branch'i, PR.

---

## C. Kısa komutlar

**Yeni oturuma geçerken:**
```
akar-3d-model skill'ini yükle. eserler/<eser>/<eser>_notlar.md'yi ve build/ içindeki son betiği oku. Kaldığımız yer: <son tur ve sıradaki iş>.
```
**Claude Code bir şeyi 2 turdur düzeltemiyorsa:**
```
Dur. Sadece şu tek konuya bak: <konu>. İşaretli görsel: <dosya>. Başka hiçbir şeye dokunma.
```
**Kaynaklar çelişiyorsa:** plan > envanter > OSM > maket > fotoğraf. Emin değilsen Claude Code'a sor dedirt: "Kaynaklar çelişiyor, ikisini yan yana göster, ben seçeyim."
