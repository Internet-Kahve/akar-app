# Orhan Bey Hamamı / Aynalı Çarşı: Sonnet revizyon planı (v03)

19 Ekim 2026. Bu dosya hamam revizyonu için **tek giriş noktasıdır**. Önce `../_GENEL_SAHNE_STANDARDI.md` dosyasını, sonra bunu oku. "KESİN" maddeler kaynakla doğrulanmıştır; uygulanmadan tur kapanmaz.

Hedef: `3d/build/build_hamam_v02.py`'den `build_hamam_v03.py` üretmek. Kullanıcı isteği: **kubbe dizilimi, giriş cephesi ve kütle oranları kaynaklardan baştan tanımlanacak.** Yapılacaklar:

1. Kütle oranlarını Ayverdi planı ve fotoğraflarla doğrula; büyük kubbelere sekizgen kasnak ve sekizgen kurşun etek ekle.
2. Bütün kubbe ve tonozları kur: halvetler, eyvanlar, kadınlar bölümü (v02'deki "küçük kubbeler eklenmez" kararı bu turda kaldırılmıştır; kullanıcı 18 Ekim'de kubbe diziliminin baştan tanımlanmasını istedi).
3. Kuzey giriş cephesini fotoğraftaki alınlıklı, kemerli, yuvarlak pencereli hâliyle kur; doğudaki kadınlar girişini ekle.
4. Duvar ve kasnak dokularını, testere dişi saçakları ekle.
5. Paleti, zemini ve figürleri genel standarda bağla.

---

## 0. Klasör haritası: neyi oku, neyi okuma

| Yol | Durum | Not |
|---|---|---|
| `SONNET_REVIZYON_PLANI.md` | **OKU (ana)** | Bu dosya |
| `../_GENEL_SAHNE_STANDARDI.md` | **OKU (ana)** | Zemin (dikdörtgen kaide), ışık, palet, figür, teslim |
| `orhan-bey-hamami_notlar.md` | Destek | §1 kararlar, **§3 ölçü analizi** (ölçek, kubbe listesi, yön çelişkisi) |
| `eser.md` | Destek | Kaynaklı oda ölçüleri ve malzeme |
| `ref/plan/yurt2024_pdf220_plan_ayverdi.png` | **KAYNAK (P)** | Ayverdi planı, 200 dpi; çubuk 41,5 px/m, E oda ölçüleriyle **× 1,035** → 40,1 px/m. **Kuzey aşağıda, doğu solda** |
| `ref/plan/yurt2024_pdf221_plan_cetintas.png` | **KAYNAK (P-oran)** | Mevcut kütlenin kaynağı. Çubuk hatalı (49 px/m) → doğru **35,5 px/m**. **Kuzey sağda, batı yukarıda** |
| `ref/plan/yurt2024_pdf222_plan_cetintas2.png`, `vakif_1983_pdf198_plan.png` | Destek | Plan karşılaştırması (Vakıf sayfasında yalnız sol üst plan bu yapıya ait) |
| `ref/plan/yurt2024_pdf223_kesit_ayverdi.png` | **KAYNAK (P)** | Yükseklik kaynağı, **× 1,16** (E soğukluk genişliğiyle kalibre) |
| `ref/plan/yurt2024_pdf224_kesit_cetintas.png` | KAYNAK (P-oran) | Kubbe profilleri, kasnaklar |
| `ref/plan/okuma_hamam_kaynak_karsilastirma.png` | Destek | Önceki karşılaştırma (12 px/m, kuzey yukarı) |
| `ref/foto/envanter_c1_pdf105_ic_carsi_tepeden.png` | **KAYNAK (F)** | **Tepeden fotoğraf (sayfanın sağ görseli):** bütün kubbe dizilimi. Yön: Ayverdi planıyla aynı (kuzey aşağıda, doğu solda) |
| `ref/foto/envanter_c1_pdf104_havadan_kubbeler.png` | **KAYNAK (F)** | Kubbeler, kasnaklar, fenerler; sağda Koza Han (doğu) |
| `ref/foto/envanter_c1_pdf106_girisler.png` (sol görsel), `yurt2024_pdf306_giris_rozet_L90-91.jpg` | **KAYNAK (F)** | Kuzey ana giriş (alınlık, kemer, yuvarlak pencere) |
| `ref/foto/envanter_c1_pdf107_dogu_avlu_kadin_soguklugu.png`, `yurt2024_pdf309_kadin_girisi_L96-97.jpg`, `pdf310_*` | **KAYNAK (F)** | Kadın soğukluğu kasnağı ve eteği, doğu avlusu, kadınlar girişi, testere saçak |
| `ref/foto/yurt2024_pdf307_*`, `pdf308_*`, `pdf311_*`–`pdf316_*` | KAYNAK (F) | Cepheler, pencereler, testere saçak. **Levha yön etiketleri için notlar §3.4'e bak** |
| `ref/foto/yurt2024_pdf305_cekim_acilari.jpg` | Destek | Yurt'un çekim noktaları planı |
| `ref/metin/*.md` | KAYNAK | Metin çıkarımları |
| `3d/build/build_hamam_v02.py` | **KOD TEMELİ** | Kopyala → `build_hamam_v03.py` |
| `3d/build/araclar/yan_yana_hamam.py` | Araç | Bindirme; sabitleri yeni görsellere göre kalibre et |

Eksenler: +X doğu, +Y kuzey, +Z yukarı. Mevcut betikte ölçüler Çetintaş plan biriminde × `olcek` (1,38).

---

## 1. KESİN: kütle ve oranlar

- **Plan kütlesi korunur** (v01: Çetintaş × 1,38 → yığma hamam ≈ 37,7 × 35,3). Oda ölçüleri E ile ±%3 tutarlı.
- **Doğrulama (yeni):** `ust_orto` render'ını Ayverdi planına (40,1 px/m, 180° döndürülmüş → kuzey yukarı) ve tepeden fotoğrafa (`envanter_c1_pdf105`, aynı döndürme) bindir. Erkek ve kadın soğukluğu, ılıklık, sıcaklık merkezleri ±0,5 m.
- Ayverdi planı batıda yalnız ≈ 4 m'lik açık gri bir şerit gösterir; Çetintaş planı burada iki tonozlu oda çizer (su deposu ve külhan bölgesi; E PDF 105–107). v01 kararı korunur: bu iki oda alçak kütle olarak kalır. Fark notlarda.
- **Çarşı ekleri** (1958 sonrası kuzey ve batı dükkân sıraları, ince çizgili alanlar) modele girmez. İstisna: §3'teki kuzey giriş önü bloğu.

## 2. KESİN: kubbe ve tonoz dizilimi

Kaynak: Ayverdi planındaki kesikli daireler (P), Yurt PDF 77 (çaplar), E PDF 106–107, tepeden fotoğraf `envanter_c1_pdf105` (F). Merkezleri **Ayverdi planından ölç** (40,1 px/m), listeyle karşılaştır, tablo olarak yaz.

| # | Mekân | Örtü | Ölçü | Kot (zemin 0) | Kaynak |
|---|---|---|---|---|---|
| 1 | **Erkek soğukluğu** (kuzeybatı) | kare gövde → **sekizgen kasnak** (tromplu) → kasnak üstünde 2 sıra testere dişi tuğla saçak → **sekizgen düz yüzlü kurşun etek** (kasnak yüzlerinden 0,45 m taşar, ≈ 22°) → kubbe → **aydınlık feneri** | iç 11,95 × 11,86; kasnak yüzden yüze ≈ gövde − 2 × 0,3 | kasnak üstü 8,6; tepe 16,2; fener 17,2 (v01). Kare gövde üstü (kasnak başlangıcı) **Ayverdi kesitinden oku** (× 1,16); beklenen ≈ 6,5–7,0 | E PDF 106; P/K; F `pdf104`, `pdf316` |
| 2 | **Kadın soğukluğu** (kuzeydoğu) | 1 ile aynı kurgu (sekizgen kasnak, Türk üçgenli); kasnakta **3 pencere**; aydınlık feneri | iç 10,35 × 10,35 | kasnak üstü 7,5, tepe 14,1 (v01, T); Çetintaş kesitiyle (pdf224) doğrula | E PDF 107; F `pdf107`, `pdf309` |
| 3 | Erkek ılıklığı | **yuvarlak (silindir) kasnak** → kubbe | iç 6,60 × 6,45 | tepe 9,2 (v01) | E PDF 106 «yuvarlak kasnaklı» |
| 4 | Ilıklık halveti (ılıklığın doğusu) | küçük kubbe | Ø 3,80 | tepe ≈ 7,4 (T) | W Yurt PDF 77 |
| 5 | Sıcaklık orta mekânı | sekizgen kasnak (üstünde tek sıra üçgen diş) → kubbe, fil gözleri | Ø 5,0 | tepe 9,5 (v01) | W Yurt PDF 77–78 |
| 6–9 | Erkek sıcaklığı 4 köşe halveti | küçük kubbe (prizmatik üçgen kuşaklı), üstte tek sıra kare diş, **küçük konik fener**, fil gözleri | ≈ 3,40 × 3,60 | tepe ≈ 7,6 (T) | E PDF 107; W Yurt PDF 77–78; F `pdf104` |
| 10–12 | Sıcaklık eyvanları (3 sekili + 1 giriş) | **beşik tonoz**, kurşun | ≈ 3,60 × 3,30 | sırt ≈ 7,0 (T) | E PDF 106–107; W Yurt PDF 77 |
| 13 | Kadın sıcaklığı | küçük kubbe | 3,50 × 4,20 | tepe ≈ 7,4 (T) | E PDF 107 |
| 14–15 | Kadın halvetleri | küçük kubbe, konik fener | ≈ 3,5 | tepe ≈ 7,4 (T) | E PDF 107; F tepeden (sol sütunda 3 küçük kubbe) |
| — | Usturalık, hela, batı odaları (su deposu) | düz kurşun dam veya beşik tonoz | | 5,6 (v01) | E; P |

- Küçük kubbeler: alçak kütle damından (5,6) 0,3–0,4 m alçak kasnak + kubbe; kurşun etek dudağı 0,15 taşar; kubbe dilim sayısı 16.
- Fil gözü: sıcaklık ve halvet kubbelerinde koyu cam noktalar (doku ya da küçük disk), v02'deki düzen.
- Toplam: **2 büyük + 1 orta (ılıklık) + 1 sıcaklık + 4 erkek halveti + 1 ılıklık halveti + 1 kadın sıcaklığı + 2 kadın halveti = 12 kubbe** ve 3–4 tonoz. Tepeden fotoğrafta say ve tutarsızlık varsa bana bildir.

## 3. KESİN: giriş cepheleri

### 3.1 Kuzey ana giriş (erkekler bölümü)
Kaynak: E PDF 106 «Yuvarlak kemerli giriş, **üç sıra kırmızı ve beyaz tuğla ile bir sıra küfeki taş** kullanılarak örülmüştür. Çift kanatlı ahşap-çelik büyük bir kapı ... Kapının üzerinde, **yan yana dizilmiş dikine tuğlalarla örülerek yapılmış yuvarlak bir pencere**»; F `envanter_c1_pdf106` (sol), `yurt2024_pdf306` (Levha 90–91).

Bugünkü hâliyle (giriş, 1958 sonrası eklenen kuzey dükkân sırasının içinden geçer):
- **Giriş önü bloğu** (`Hamam_Giris`): erkek soğukluğu kuzey duvarının ortasında, ≈ 7,0 m geniş, 4,0 m derin (T), saçak ≈ 5,6.
- **Üçgen alınlık:** iki yana eğimli; kenarlarında 2 sıra tuğla dişli silme; tepesi ≈ 7,6 (T; fotoğraf oranıyla düzelt).
- **Kapı:** yuvarlak kemer, açıklık ≈ 2,6, kemer tepesi ≈ 3,9 (T). Kemer bandı 0,5: kemer taşları **3 tuğla + 1 küfeki** sırayla, radyal. Çift kanatlı koyu kapı `#7A5134` + cam üstlük. Önünde 2–3 basamak aşağı (zemin sokaktan alçak, F).
- **Yuvarlak pencere:** alınlıkta, kapının üstünde, Ø ≈ 1,3, merkez ≈ 5,3; çevresinde radyal dikine tuğla halkası (0,25); içinde demir şebeke (alpha-cutout ya da çubuk).
- Duvar: almaşık (1 sıra taş + 2–3 sıra tuğla), fotoğraftaki gibi.
- Modern metal saçak, tabelalar ve «ESKİ AYNALI ÇARŞI» yazısı **modellenmez**.

### 3.2 Doğu: kadınlar girişi ve avlu
Kaynak: F `envanter_c1_pdf107`, `yurt2024_pdf309` (Levha 96–97).
- Kadın soğukluğunun güneydoğusunda alçak giriş bloğu (≈ 4,5 × 3,0, saçak 4,2; T); tuğla kemerli taş çerçeveli kapı (1,2 × 2,4), üstünde tuğla boşaltma kemeri.
- Hamamla Koza Han arasındaki avlu: taş döşeme `#B3A590`.

### 3.3 Pencereler
Kuzey ve doğu cephelerinde yuvarlak kemerli pencereler; tuğla kemer bandı, ahşap doğrama (F Levha 102–103, 106–108). Yer ve sayıyı Ayverdi planındaki açıklıklardan al.

## 4. KESİN: duvar, kasnak, saçak

| Konu | v02 | **v03** | Kaynak |
|---|---|---|---|
| Beden duvarı | düz renk `#E2B7A4` | kaba yontu/moloz taş + seyrek yatay tuğla hatıl dokusu (`duvar_moloz.png`); pencere ve kapı kemerleri tuğla | E PDF 106 «kesme taş»; W Yurt PDF 78 «moloz taş»; F (fotoğraflar kaba yontu taş gösteriyor) |
| Kasnaklar | yok / tuğla bant | **3 sıra tuğla + 1 sıra kesme taş** almaşık (`kasnak_almasik.png`; taş 0,30, tuğla 3 × 0,07) | E PDF 106; E Vakıf PDF 198; W Yurt PDF 78; F |
| Saçaklar | tek tuğla bandı | kubbe eteklerinde ve beden duvarlarında **2 sıra testere dişi tuğla** (iki basamaklı bant + `kirpi.png`, Orhan Bey Camii ile aynı doku) | W Yurt PDF 78; F Levha 98–99, 104–105, 110 |
| Fenerler | silindir | büyük kubbelerde küçük silindir fener + kurşun kapak; küçük kubbelerde konik kurşun fener (Ø 0,6, h 0,5) | E PDF 107; F `pdf104` |

## 5. KESİN: renk, zemin, figür

| Malzeme | v02 hex | **v03 hex** |
|---|---|---|
| Duvar | `#E2B7A4` | moloz dokusu, ortalama ≈ `#C8B49A` (taş üçlüsü küfeki + kesme taş; V ≥ 0,72 kontrolü) |
| Tuğla | `#C6755B` | `#C0683F` / `#CF7F55` / `#A65535` |
| Küfeki (kemer taşları) | — | `#E6D8BA` |
| Kubbe, tonoz, dam | `#A8AEC1` | kurşun `#C3C9CD`, ek çizgisi `#98A1A8` |
| Kapı | `#6B4A3A` | `#7A5134` |
| Pencere camı | koyu | `#3E4A55`; demir `#36413F` |
| Zemin_Cim, Zemin_Golge | | **sil** |

- **Kaide:** dikdörtgen, her yönde 8 m pay (standart §1). Kuzeyde sokak döşemesi; doğuda Koza Han'a kadar avlu döşemesi. Çim yok (çarşı dokusu). Ağaç yalnız fotoğrafta görülen yere (doğu avlusundaki tek ağaç, `envanter_c1_pdf104`).
- Komşu yapılar (Koza Han, Emir Hanı) modele girmez.
- **Figürler:** ortak set `eserler/_kutuphane/akar3d.py` → `insan(...)`, yeniden çizme. 6 figür: kuzey girişinde 3 (biri çocuk), doğu avlusunda 2, kadınlar girişinde 1; en az 2'si kadın.

## 6. Ortak kurallar (Koza Han turundan çıkan dersler)

1. Açıklıklarda (kapı, pencere, geçit) açıklık hacmiyle kesişen bütün nesneleri temizle; havada asılı parça kalmasın; saçak ve silmeler kemerlerin üstünden geçmesin.
2. Şebeke ve parmaklıklar gerçek boşluk (alpha-cutout ya da çubuk); tek yüze boyalı daire yok.
3. Yazı ve tabela yok.
4. Fotoğraf yönünü bilinen öğeden çıkar (Koza Han doğuda, büyük kubbeler kuzeyde); modeli döndürme.
5. Geçici dosyalar `3d/kontrol/_tmp/` içinde; tur bitince sil.

## 7. Teslim (v03)

1. `3d/build/build_hamam_v03.py`:
   - `build_hamam_v02.py`'den kopya; `SURUM = "hamam_v03"`, P tablosu güncellenir (kaynak harfiyle).
   - Çıktılar: `3d/blend/orhan-bey-hamami_v03.blend`, `3d/export/orhan-bey-hamami_v03.glb` (kaidesiz), `..._v03_sunum.glb` (kaideli), `3d/kontrol/hamam_v03/`.
2. Bütçe: toplam ≤ 18 000 üçgen (hamam ≤ 14 000, figür ≤ 4 000). Draw call ≤ 40. GLB ≤ 1 MB.
3. **Onay adımları (beni beklemeden geçme):**
   - A. Kubbe dizilimi (§1–§2): `ust_orto.png` ↔ Ayverdi planı ve tepeden fotoğraf bindirmesi, kubbe listesi tablosu (merkez, Ø, tepe), `havadan.png` (`envanter_c1_pdf104` açısı) ile yan yana, `dogu_orto` ↔ Ayverdi kesiti → göster, onay bekle.
   - B. Giriş cepheleri (§3): `kuzey_giris.png` (`yurt2024_pdf306` açısı) ve `dogu_avlu.png` (`envanter_c1_pdf107` açısı) ile yan yana → göster, onay bekle.
   - C. Doku, saçak, renk, zemin, figürler: `havadan.png`, `kubbe_yakin.png` (`yurt2024_pdf310` ile) → göster, onay bekle.
4. `3d/kontrol/hamam_v03/olcu_dogrulama.json`: oda iç ölçüleri (E ile fark), kubbe listesi, kasnak kotları, giriş bloğu ölçüleri, figür boyları.
5. Genel standart §5 denetimleri (`renkler.json`).
6. **Kapanış (kullanıcı v03'ü açıkça onayladıktan sonra):** `3d/README.md`'ye v03 satırı ve güncel sürüm; v02 blend, GLB, `kontrol/hamam_v02/`, `build_hamam_v02.py` silinir (`doku/`, `araclar/` kalır); notlar §1 güncellenir; bu dosya silinir.
