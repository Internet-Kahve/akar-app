# Ulu Cami: 3D üretim klasörü

Güncel sürüm **v32** (29 Ekim 2026; kubbe ve çatıda kurşun ek dokusu, Bedesten gibi; aşağıda). Önceki: **v31** (29 Ekim 2026; levhalar fotoğraftan çeşitlendi, yalnız sunumda). Daha önce: **v30** (29 Ekim 2026; iç mekân ayrıntısı yalnız sunumda). Önceki not: güncel sürüm **v27** (27 Ekim 2026; v26 + iç mekân: boş gövde, payeler, kemerler, mihrap, minber, yazısız levhalar; «Kubbeleri kaldır» için). **v26 dosyaları silinmedi:** `design/test-redmi9t/` (v1 prototipi) hâlâ v26'yı açıyor; v1 bırakılınca silinebilir. Bu klasörde normalde yalnızca son sürüm tutulur; önceki sürümler aşağıdaki tabloda kayıtlıdır. Kaynaklar `../ref/` altında, model kararları `../ulu-cami_notlar.md` içinde.

## İçerik

**v32 (29 Ekim 2026) · kubbe ve çatıda kurşun ek dokusu (Bedesten gibi)**

- `build/build_v32.py` → `build/doku_cati_v32.py` (doku) → `build/build_v32_cati.py` (Blender, v31 blend'ini açar, `blend/ulu-cami_v32.blend` olarak kaydeder) → `_kutuphane/blend_hat/uret.py`. Geometri, parça adları ve iç mekân v31 ile aynı; yalnız `Kubbe.001` (19 kubbe) ve `Cati` malzemesine doku ve UV. Harita ve sunum GLB'si ikisi de değişti (dış görünüş).
- **Doku** `build/doku_cati_v32/kursun_ek.png` (128 × 128, tekrar eden karo = 4 dilim × 4 levha sırası): beyaz zemin üstünde koyu ek çizgisi, `kursun` rolüyle çarpılır (Bedesten `Kubbe` malzemesiyle aynı doku × renk düğümü). Dilim ekinin koyuluğu Bedesten maskesinden okunur (0,718); levha sırası eki daha açık; levha başına hafif ton farkı 0,95–1,00 (F 09: yer yer yenilenmiş levhalar; dağılım T). İki malzeme aynı resmi kullanır (+1 doku, < 1 KB).
- **Kubbe UV'si:** her kubbe için u = azimut × 48 / 2π (meridyen ekleri; F 04 tepeden ışınsal, F 09 sık dilim; **sayı yaklaşık, T**), v = etekten yay boyu / 1,2 m (levha sırası; F 09, **T**).
- **Çatı UV'si:** eğimli yüzlerde ekler eğim doğrultusunda 0,6 m arayla (Bedesten bant çatısı gibi; F 09 sağ alt), levha sırası 1,2 m; düz yüzlerde x yönünde.
- **Sayılar** (v31 → v32): harita 90 254 üçgen (aynı), 760 → 755 KB, 97 çizim çağrısı (aynı), doku 7 → 8; sunum 119 834 üçgen (aynı), 1683 → 1679 KB, 128 çizim çağrısı (aynı), doku 15 → 16. Dış eşitlik (harita ↔ sunum): en çok %0,024. Kurşunun görünen ortalama rengi ek çizgileri yüzünden 188,194,198 → 182,188,192 (doğrulamanın b adımı bu yüzden «değişti» der; beklenen). c, d geçti.
- **Kontrol:** `kontrol/v32/cati.png` (foto 09 ve 04 | v31 | v32, yaklaşık açı), `dis_esitlik.png`, `kursun_ek_doku.png`, `parca_dogrulama.json`, `blend_rapor.json`.

**v31 (29 Ekim 2026) · levhalar fotoğraftaki gibi çeşitli ve ayrıntılı**

- `build/build_v31.py` → `build/doku_ic_v31.py` (atlas) → `build/build_v31_ic.py` (Blender, v30 blend'ini açar, `blend/ulu-cami_v31.blend` olarak kaydeder) → `_kutuphane/blend_hat/uret.py`. Yalnız `Levhalar` değişti; ad aynı, hâlâ `ic_parcalar`'da. v30 dosyalarına dokunulmadı.
- **Sorun (v30):** 64 levha 3 hücreli atlastan besleniyordu, ikisi vav (22, 07); içeride her yönde vav görünüyordu.
- **Atlas** `build/doku_ic_v31/levhalar.jpg` (2048 × 1024, JPEG q80, 479 KB) v30 atlasının yerine geçti; doku sayısı aynı (15). 18 farklı levha + 1 taç hücresi + 3 düz renk bloğu (çerçeve, taç yanı, madalyon kenarı). Her hücre fotoğraf kırpması: eğik çekilenler dört köşeden dikdörtgene düzleştirildi; açık zeminlilerde ışık eğimi düzlendi ve zemin `levha_zemin` tonuna çekildi; kenara ince `levha_cerceve` çizgisi. Kaynak ve kırpma koordinatları `build/doku_ic_v31/kaynak.json`; numaralı atlas `kontrol/v31/levha_atlas.png`. Yazı üretilmedi, çizilmedi.
- **Geometri:** levha yüzeyden 2,5 cm önde ince plaka (ön yüz fotoğraf, yan yüzler koyu çerçeve; v30'daki 5 cm kutu yerine). Boyu hücrenin en/boy oranından (payede en çok 1,7 × 2,5 m, üst kenar +5,6). Paye ve duvar payesi levhalarının üstünde silme ve oymalı taç: siluet 23'teki tepelikten (önden çekim; 27 ve 02'dekilerle aynı biçim), 3 cm alçak poligonlu ekstrüzyon; ön yüz taç fotoğrafı, yan ve arka `levha_tac` (27'den ölçüldü). Madalyon: daire (r 0,75), koyu zemin fotoğraftan, altın kenar halkası `madalyon_altin` (29'dan). Taç ve madalyon da aynı atlas malzemesinde; ayrı parça ve malzeme yok (`Levha_Taclari` gerekmedi). Levhalar 8968 üçgen, tek malzeme.
- **Dağıtım** (`kontrol/v31/ic_rapor.json → dagitim`): vav yalnız iki yerde — 07 kıble duvarında mihrabın sağında (batı büyük levha, yeri doğru) ve 22 tek paye yüzünde (paye −6,425 / 12,8, orta nefe bakan yüz; **yeri T**). Aynı payenin dört yüzü farklı; karşılıklı bakan iki yüzde aynı levha yok; bir hücre en çok 8 kez. Kıble duvarının doğudaki büyük levhası 29'daki tevhid istifi (**T**). Duvarlara 14 yatay levha (kapı üstü kotunda, +8,0; F 20) ve 6 madalyon (+10,5; F 29): **sayı ve yerler temsili (T)**. İç duvarda pencere kemeri modellenmediği için «kemer üstü» levhalar kapı ve pencere üstü kotuna kondu.
- **Atlananlar:** 29'daki tuğra biçimli yazı (sol kenarda kesik, üstünden avize telleri geçiyor); 25'teki yeşil zeminli büyük levha ve 34'teki kıble duvarı yazıları (kırpılabilir bütün parça yok). 27'deki «mennan» levhasının sağ alt köşesinde önündeki ahşap kürsünün bir parçası kaldı (fotoğrafta levhanın önünde).

| No | Hücre | Tür | Kaynak ve kırpma (px) | Kullanım | Yer |
|---|---|---|---|---|---|
| 0 | `vav_22` | vav | `22_hat-levha-buyuk.jpg` dikdörtgen (0,0)–(1973,2400) | 1 | paye |
| 1 | `vav_07` | vav | `07_hat-vav.jpg` dikdörtgen (120,60)–(2210,1800) | 1 | kıble büyük |
| 2 | `tevhid_29` | dikey istif (tevhid) | `29_ic-kubbe-paye.jpg` dörtgen (1248,908) (1483,996) (1617,1483) (1285,1429) | 7 | kıble büyük, paye |
| 3 | `daire_29` | daire istif | `29_ic-kubbe-paye.jpg` dörtgen (983,1018) (1137,921) (1131,1381) (915,1477) | 7 | duvar payesi, paye |
| 4 | `mennan_27` | dikey/kare istif | `27_ic-paye-levhalar.jpg` dörtgen (23,1298) (428,1216) (432,1864) (23,2039) | 7 | duvar payesi, paye |
| 5 | `paye_sol_27` | dikey/kare istif | `27_ic-paye-levhalar.jpg` dikdörtgen (735,998)–(872,1186) | 6 | duvar payesi, paye |
| 6 | `paye_sag_27` | dikey/kare istif | `27_ic-paye-levhalar.jpg` dikdörtgen (1494,998)–(1629,1190) | 7 | duvar payesi, paye |
| 7 | `paye_on_02` | dikey/kare istif | `02_ic-genel.jpg` dörtgen (1215,923) (1307,917) (1307,1097) (1215,1130) | 7 | paye |
| 8 | `paye_yan_02` | dikey/kare istif | `02_ic-genel.jpg` dörtgen (1091,912) (1178,927) (1178,1083) (1091,1048) | 7 | duvar payesi, paye |
| 9 | `istif_23` | yatay istif (payede) | `23_minber-yandan.jpg` dikdörtgen (461,622)–(1154,1068) | 7 | duvar payesi, paye |
| 10 | `buyuk_20` | yatay yazı | `20_hat-duvar.jpg` dikdörtgen (37,59)–(2373,1053) | 3 | duvar (yatay) |
| 11 | `kucuk_20` | yatay yazı | `20_hat-duvar.jpg` dikdörtgen (827,1147)–(1595,1475) | 3 | duvar (yatay) |
| 12 | `cubuklu_21` | çerçeveli, camlı yatay | `21_hat-levha.jpg` dikdörtgen (0,0)–(2400,875) | 3 | duvar (yatay) |
| 13 | `siyah_27` | koyu zeminli yatay | `27_ic-paye-levhalar.jpg` dikdörtgen (1059,884)–(1310,985) | 2 | duvar (yatay) |
| 14 | `kusak_27` | koyu zeminli yatay | `27_ic-paye-levhalar.jpg` dörtgen (1989,1201) (2322,1323) (2322,1443) (1989,1290) | 3 | duvar (yatay) |
| 15 | `kucuk_34` | küçük yatay (payede) | `34_ic-genel-2.jpg` dikdörtgen (1565,412)–(1696,483) | 7 | duvar payesi, paye |
| 16 | `madalyon_29` | yuvarlak madalyon | `29_ic-kubbe-paye.jpg` dikdörtgen (381,883)–(549,1001) | 3 | duvar (madalyon) |
| 17 | `madalyon_27` | yuvarlak madalyon | `27_ic-paye-levhalar.jpg` dikdörtgen (1143,723)–(1217,797) | 3 | duvar (madalyon) |
| T | `tac_23` | taç (tepelik) | `23_minber-yandan.jpg` dikdörtgen (456,198)–(1162,566) | 62 | paye ve duvar payesi levhalarının üstü |

- **Sayılar** (v30 → v31): sunum 112 402 → 119 834 üçgen, 1282 → 1683 KB, çizim çağrısı 130 → 128, doku 15 → 15; harita 90 254 → 90 254 üçgen, 760 → 760 KB, 97 çizim çağrısı (değişmedi; v30 haritasıyla görüntü farkı %0,000). Dış eşitlik (harita ↔ sunum): en çok %0,057.
- **Yeni renk rolleri:** `levha_zemin` #D9BEA8 (beş fotoğrafın krem ortancası), `levha_cerceve` #140E02 (20), `levha_tac` #654433 (27), `madalyon_altin` #977B4B (29).
- **Kontrol:** `kontrol/v31/levhalar.png` (27, 29 ile yaklaşık aynı açı: model | fotoğraf | v30; payelerin arasından mihraba geniş görüntü), `levha_atlas.png`, `ic_detay.png`, `dis_esitlik.png`, `tiklama_haritasi.png`, `parca_dogrulama.json` (c, d geçti), `ic_rapor.json`, `blend_rapor.json`.

**v30 (29 Ekim 2026) · iç mekân ayrıntısı, eser başına iki model**

- `build/build_v30.py` → `build/doku_ic_v30.py` (dokular) → `build/build_v30_ic.py` (Blender, v29 blend'ini açar) → `_kutuphane/blend_hat/uret.py`. Sahne `blend/ulu-cami_v30.blend`.
- **İki model:** `export/ulu-cami_v30_sunum.glb` (eser detayı: dış + iç + zemin/ağaç/insan) ve `export/ulu-cami_v30.glb` (harita: iç parçalar yok). Yalnız sunumda olan parçalar `model.json → ic_parcalar`: Levhalar, Mihrap, Minber, Ic_Zemin, Muezzin_Mahfili, Avizeler, Kemer_Kalem_Isi. Payeler, Kemerler ve Ic_Sadirvan_Havuz havuzun cam kubbesinden dışarıdan göründüğü için haritada da var.
- **Sayılar** (v29 → v30): sunum 97 496 → 112 402 üçgen, 844 → 1282 KB, çizim çağrısı 125 → 130, doku 11 → 15 (ilk v30: 107 068 üçgen, 1268 KB, 129 çağrı); harita 92 008 → 90 254 üçgen, 768 → 760 KB, çizim çağrısı 103 → 97, doku 6 → 7. Dış eşitlik (harita ↔ sunum, aynı kamera, zemin/ağaç/insan gizli): en çok %0,051.
- **Kontrol:** `kontrol/v30/ic_detay.png`, `dis_esitlik.png`, `tiklama_haritasi.png`, `parca_dogrulama.json` (c, d geçti), `ic_rapor.json`, `blend_rapor.json`.

| Parça | Eklenen | Kaynak |
|---|---|---|
| `Mihrap` (yeniden) | Ön yüz fotoğraf dokusu (kavsara, köşelikler, dört friz); 1,80 m niş; 8 sıra yaldızlı mukarnas; iki sütunçe ve başlıkları | Ölçü 5,13 × 8,11, 0,29 m çıkıntı: E cilt-1 PDF 27–28, Ürgen s.8. Doku: `icerik/foto/06_mihrap.jpg` (bütün; fotoğraf genişliği mihrap genişliğine eşlendi, T). «Sekiz sıra stalaktit, sütunçeler»: Vakıf Abideler 1983 s.187 (ref/metin/vakif_1983.md PDF 102); E cilt-1 PDF 30 (dört friz, sütunçeler). Niş genişliği ve mukarnas kotları 06'dan oranla (T). |
| `Minber` (yeniden) | Kündekâri yan aynalar, 21 basamak, korkuluk, köşk (direk, friz, çatı), dört yüzlü külah, alem, taç kapı ve kanatları | Ölçü: Ürgen PDF 20 çizimi (Gülay Apa; ölçek çubuğundan): boy 6,2, genişlik 1,53, köşk +5,2–8,3, külah +9,4, alem +10,0, kapı +3,4. Biçim: `05_minber.jpg`, `23`, `30`. Basamak sayısı T. **Düzeltme (29 Ekim, kullanıcı):** renk `05`'in aydınlık yüzlerinden yeniden ölçüldü (kundekari_zemin #623E0E, kundekari_cita #925A00; ilk ölçüm gece gölgesindendi); yan aynada üçgen, köşk altında dikdörtgen yaldız çerçeve çizgisi (`minber_altin`, `05`). |
| `Ic_Sadirvan_Havuz` | Bölmenin mermer döşemesi; çevresinde ahşap korkuluk, eksenlerde 1,6 m geçit (yükseklik 0,7 T) | `03_ic-sadirvan-havuz.jpg`, `28_ic-havuz-ustten.jpg`. Havuz, 16 musluk, taşlar ve üç çanaklı fıskiye v23'ten (Vakıf Abideler 1983). |
| `Ic_Zemin` (yeniden) | Bütün harem halı (kodla karo 2,4 m; saf bandı doğu–batı); mihrap önü bölmesinde sınır şeridi | Renk: `34_ic-genel-2.jpg` ölçümü. Karo boyu ve motif sıklığı T. |
| `Levhalar` | Levha zeminlerine fotoğraf dokusu | `22_hat-levha-buyuk.jpg`, `23_minber-yandan.jpg` (payedeki levha), `07_hat-vav.jpg` (kıble duvarında mihrabın sağındaki vav; yeri doğru). Paye levhalarında 22 ve 23 sırayla: **yerleri temsili**. |
| `Kemer_Kalem_Isi` (yeni) | Kemerlerin iki yüzünde kenar çizgisi (0,07 m) ve rumi bandı (0,30 m, düz ton) | `26_ic-kemerler.jpg` (ölçüm). Motif çizilmedi. |
| `Muezzin_Mahfili` (yeni) | 4,75 × 4,70 asma kat (+3,38), dokuz sekizgen direk (0,18 × 3 m): mermer pabuç, farsîli mermer kaide, silme bilezik, akantuslu başlık (yaprak çizilmedi, genişleyen sekizgen); 0,24 çevre ve ara kirişler, kiriş altı silme, saçaklı döşeme, kiriş altında tavan tahtası; asma katta ve alt kat maksuresinde 0,52 korkuluk (alt kuşak, ara kuşak, sık dik çubuk, küpeşte; dik kesim oyma motifi çizilmedi), köşe ve ara korkuluk babaları; 12 basamaklı merdiven (2,80 m, 1,22 genişlik) ve eğik korkuluğu, payenin kuzeyinde geçit ve korkuluğu. Alt kat girişinin yeri (batı yüz, 0,9 m) ve kaide boyu T | Ürgen PDF 12 (metin), PDF 14 (korkuluk 0,52, tavan, oyma), `25` (biçim), PDF 13 (`ref/plan/urgen_pdf013_muezzin_mahfili_plan.jpg`); E cilt-1 PDF 31. Konum: «mihrabın karşısındaki iki payeden batıdakine» → mihrap önü paye sırasının batı payesi; asma kat payenin batısında (`25`, `34`'te minberin sağında). **Belirsiz.** |
| `Avizeler` (yeni) | Havuz dışındaki 19 kubbe bölmesinde halka avize (Ø 2,4, +3,0), dört askı ve zincir | `02_ic-genel.jpg`, `25`, `34`. Çap, kot ve sayı T; renk ölçülmedi (mukarnas_altin rolü). |
| `Govde` | İç döşeme yüzü 5 cm aşağı ve halı dokusu (haritada cam kubbeden görünen döşeme) | — |
| `Olcek_Insanlar` | On ölçek insanı tek nesne (çizim çağrısı) | — |

Dokular (JPEG q80; `build/doku_ic_v30/kaynak.json`): `hali.jpg` 512 px 10 KB (kod), `kundekari.jpg` 512 px 15 KB (kod, çıta 18 px: `design/desenler/desen.py` Hankin 4.8.8, 72°), `mihrap.jpg` 1024 × 736 282 KB (06 kırpma), `levhalar.jpg` 768 × 512 96 KB (22, 23, 07 kırpma). Yeni renk rolleri (`malzeme-paleti.json`): hali_zemin, hali_desen, kemer_kalem, kemer_bant, kundekari_zemin, kundekari_cita, minber_altin, mukarnas_altin, mahfil_ceviz.

**Atlananlar:** kubbe içleri (göbek ve kuşak): Ulucami'nin çatısında kasnak ağzı yok (yalnız havuzun cam kubbesi açık); kubbe içi yalnız içeriden, aşağıdan görülür. Kapıların iç yüzü: iç görünüşe dair kaynak yok. Hünkâr mahfili (güneydoğu köşe, 1862): ölçü ve fotoğraf yok. Vaaz kürsüleri ve minberin bugünkü cam koruması: iş emrinde yok. Paye kalem işi bantları: mevcut koyu başlık bandı (v27) dışında fotoğrafta ayrı bant seçilmedi.

**Sınır aşımları:** sunumda çizim çağrısı 129 (sınır 80) ve doku 15 (sınır 8); v29'da zaten 125 ve 11'di (dış ve ağaç malzemeleri). Dışı değiştirmeden indirilemedi; iç mekân 4 yeni doku ve 9 yeni malzeme ekledi.

**v27 (27 Ekim 2026)**

- `blend/ulu-cami_v27.blend`, `export/ulu-cami_v27.glb` (yapı, 92 008 üçgen, 0,57 MB, Draco), `export/ulu-cami_v27_sunum.glb` (0,65 MB). Haritadaki konum v26 ile aynı (Govde düğümü aynı yerde).
- `build/build_v27.py`: v26 blend'ini açar (dokunmaz). Govde'nin kapağını ve şadırvan boşluğunu siler; 2,5 m duvarın iç yüzünü, duvar üstünü ve halı zemini ekler. Yeni parçalar: `Payeler` (12 kare paye, 2,2 m, envanter C1 PDF s.26 + 14 duvar payesi, stilize), `Kemerler` (31 sivri kemer, üzengi 7,0, kilit 12,6 m, T), `Mihrap` (5,13 × 8,11 m, 0,29 m çıkıntı, Ürgen; renk stilize), `Minber` (mihrabın batısında, ölçü T), `Levhalar` (her payenin dört yüzünde, duvar payelerinde ve mihrabın iki yanında; envanter «payelerin her yüzüne … esmâ-i hüsnâ»). **Levhalarda yazı yok**: koyu çerçeve + krem zemin; gerçek yazı uygulamada fotoğraf kartıyla.
- Kalkan parçalar (uygulama sırayla kaldırır): `Alemler`, `Sadirvan_Iskeleti` → `Kubbeler_19`, `Sadirvan_Kubbe`, `Kasnak_Pencereleri` → `Cati`. Ad ve geometrileri v26 ile aynı.
- Kontrol: `kontrol/v27/` (dışarıdan kapalı görünüş, kubbeler kalkık üstten ve yarı yolda, mihrap–minber, paye–levha, renkli iki görüntü, tarayıcı akışı, `kontrol_rapor.json`). Yeni parçaların hepsi kapalı hacim (manifold olmayan kenar 0); Govde de kapalı.
- Draco: bpy paketinde Blender'ın Draco köprüsü olmadığı için GLB'ler `build/glb_draco.mjs` ile sıkıştırıldı (glb_temizle.mjs ayarları). Mac'teki Blender'da `build_v27.py` doğrudan Draco ile yazar.
- Bilinen sınırlar: iç duvarlarda pencere yok (dışarıdan pencereler aynı); duvar payeleri, kemer yüksekliği ve minber ölçüsü tahmin (T); müezzin mahfili eklenmedi (Ürgen: «mihrabın karşısındaki iki payeden batıdakine yaslanmıştır»); kubbe içleri yok, kubbeler kalkınca içerisi kemer ızgarasıyla görünür.

**v26**

- `blend/ulu-cami_v26.blend`: düzenlenebilir son sahne.
- `export/ulu-cami_v26.glb`: uygulama modeli, yalnız yapı (ağaç, figür, zemin yok), Draco, 0,83 MB, 87 280 üçgen, 26 nesne.
- `export/ulu-cami_v26_sunum.glb`: daire kaide, avlu döşemesi, ağaçlar ve figürlerle sunum, 0,59 MB.
- `kontrol/v26/`: dört yön, havadan, eski/yeni karşılaştırma, 8 yakın çekim, `kontrol_rapor.json`, `renkler.json`, `_blend_sayim.json`.
- `build/build_v26.py`: v25 blend'ini açıp `_kutuphane/palet_v2/` ile yalnız rengi ve pişirilmiş ışığı değiştirir (ayar `palet_v2/ayar/ulu-cami.json`). Girdisi olan v25 blend'i silindiği için baştan çalıştırmak için v25'i git geçmişinden almak gerekir.

v25 dönemindeki dosyaların kaydı:

- `blend/ulu-cami_v25.blend`: düzenlenebilir son sahne (dokular paketli). — **silindi** (21 Ekim 2026; yerine v26)
- `export/ulu-cami_v25.glb`: cami, avlu yapıları ve iç şadırvan; **ağaç ve figür yok** (20 Ekim 2026'da çıkarıldı), zeminsiz, dünya koordinatlı, Draco, 0,57 MB. uygulama GLB'sinden çevre (`Cevre_*`) ve insan figürleri (`Olcek_Insan_*`) çıkarıldı; bunlar yalnız `_sunum.glb`'de. Sürüm numarası değişmedi. Kural ve betik: `eserler/_GENEL_SAHNE_STANDARDI.md` §5.5, `eserler/_kutuphane/glb_temizle.mjs`. Yeni sürümde son adım olarak tekrar çalıştır. — **silindi** (21 Ekim 2026; yerine v26)
- `export/ulu-cami_v25_sunum.glb`: daire kaide, avlu döşemesi, ağaçlar ve figürlerle sunum; orijin daire merkezi (0,55; 4,61). — **silindi** (21 Ekim 2026; yerine v26)
- `kontrol/v25/`: `build/render_v25.py` ile alınan 21 görsel (5 sunum, 7 fotoğrafla yan yana, `dort_yon`, `ust_orto`, 5 yakın çekim), `kontrol_ozeti.md` (fotoğraf karşılaştırması, v24'te bulunan 6 hatanın v25'teki durumu, GLB boyutu ve adları), `kontrol_rapor.json` (ağaç yüz sayıları, geometri değişmedi, draw call, GLB), `olcu_dogrulama.json` (v24 turunda yazıldı: kaide dairesi ve kenar payları; geometri aynı olduğu için geçerli). `kontrol/v24/` kaldırıldı. — **silindi** (21 Ekim 2026; yerine v26)
- `build/render_v25.py`: v25 blend'inden render seti (açılar `render_v24.py` ile aynı; modele dokunmaz). `Blender -b blend/ulu-cami_v25.blend --python build/render_v25.py [-- yan,sunum,genel,yakin]`.
- `build/`: geometriyi üreten referans betikler (`build_v25.py`: v24 blend'ini açıp yalnız ağaç malzemelerine doku bağlar ve ağaçlara UV yazar, `-- A|R`; doku ve UV kuralı `../../_kutuphane/agac_doku.py`) (`akar3d.py` kütüphanesi `../../_kutuphane/` altındadır; `build/` içindeki kopya eskidir, kullanılmaz):
  - `build_v24.py`: v23 blend'ini açıp yalnız `Zemin_Kaide`'yi daire olarak yeniden üretir, kontrol, GLB ve render'ları yazar (`-- A|R|R23`).
  - `build_v23.py`: v23'ün ana betiği (`-- A|B|C|D` aşama harfi). Dikey ölçek, minareler, palet, şebeke alpha-cutout, taç kapı mukarnası, kaide ve figür yerleşimi.
  - `v23_avlu.py`: avlu şadırvanı, mermer çeşme, iç şadırvan. `v23_cevre.py`: kaide, çınar, servi, tarh.
  - `build_v16.py`, `build_v20_kubbe_taban.py`, `build_v20.py`, `v20_cevre.py`: bina gövdesi, cepheler, kubbeler ve eski çevre (v16–v20; ayrıntı aşağıda). `doku/`: şebeke, ızgara, taş ve tuğla dokuları; v25'ten beri `yaprak_7FA35B/93B46A/6E9450/3F7A5C.png` ve `agac_govde.png` (üretici `_kutuphane/agac_doku.py`).

`build_v23.py` girdi olarak v22 blend'ini açıyordu; v22 dosyaları silindiği için betik baştan çalıştırılamaz, v23 blend'i de v24 ile silindi. `build_v23.py`, `v23_avlu.py`, `v23_cevre.py` referans kod olarak kalır; `build_v24.py` girdi olarak v23 blend'ini ister (silindi); yeniden çalıştırmak için v23'ü git geçmişinden almak gerekir. `build_v25.py` de girdi olarak v24 blend'ini ister (v25 ile silindi); çalışan sahne `blend/ulu-cami_v25.blend`.

## Sürüm geçmişi

| Sürüm | Değişiklik | Önemli değerler (kaynak türü) | Kontrol |
|---|---|---|---|
| v16 | Sunum kaidesi yaklaşık %20 genişletildi. Bina geometrisi Claude v02c'den türetildi ve kullanıcı referanslarıyla geliştirildi. | Kaide elips yarıçapları 51 × 46 → 61 × 55; çim 59,8 × 53,8; gölge 63 × 57. Plan 68,7 × 55,0 (P, Ayverdi). Kubbe ve duvar yükseklikleri maketten (M). | 67 906 üçgen |
| v17 | Kuzey avlusuna `Avlu_Sadirvan_Dogu`, `Avlu_Sadirvan_Bati`, `Avlu_Mermer_Cesme` ve taş döşeli ön avlu eklendi. | Merkezler (±15, −39) ve (0, −39) (T, stilize). Saçak Ø 6,3, direk çemberi Ø 5,3, boy 7,35 (F). Çeşme 2,70 × 1,15 = yükseklik × gövde genişliği (E, yorum). Kaynaklar: Envanter C1 PDF 38–39, Canbakış PDF 54, Kitabeler PDF 124–127. | 93 802 üçgen; v16 meshleri SHA-256 ile değişmedi |
| v18 | Şadırvan soğan kubbesi 1 m yükseltildi; dışa taşan metal etek eklendi. | Boy 8,35; etek R 3,40; korniş R 3,42; alt korniş 2,98; direk R 2,65 (kullanıcı yönlendirmesi) | — |
| v19 | 19 kubbe ve cam şadırvan kubbesi 22,5° döndürüldü; sekizgen kasnakların düz yüzü kuzeye bakıyor. | Merkezler ve tepe kotları korundu | 95 082 üçgen |
| v20 | Şadırvan soğanları düşeyde × 1,25; 20 kubbenin eteği ve kasnağı büyütüldü; grup zemine ortalandı; 2 ağaç ve 6 figür eklendi. | Şadırvan boyu 9,17. Kubbe etek R 6,15 → 6,65, kasnak R 6,00 → 6,55 (F: `../ref/foto/2018_05_bursa2.webp` ve kullanıcı fotoğrafları). Zemin #F5F2EA. Figür boyları 1,78 / 1,74 / 1,65 / 1,68 / 1,12 / 1,28. | 104 330 üçgen (kaide hariç) |
| v21 | Yalnızca zemin renkleri değişti. | Zemin ve kaide #D6D0C4, avlu #C4B9A7 | — |
| v22 | Zemin bir ton koyulaştırıldı (kullanıcı onayı). | Zemin #C4BDAF, avlu #B3A590 | — |
| v23 | VGM rölövesine göre dikey ölçek; minareler; palet; yeni avlu şadırvanları, çeşme ve iç şadırvan; şebekeler gerçek delik; taç kapı 11 sıra mukarnas; dikdörtgen kaide; 10 figür; çınar, servi, tarh. | Gövde kotları v22 × 0,786: saçak 13,6, köşe kubbe 19,81 (P). Minare tepeleri 47,90 / 47,89; batı kaide tepesi 8,70, doğu 4,20 (kullanıcı), gövdeler buna göre uzadı (T). Şadırvan boyu 9,55 (zeminden), direk R 2,75, saçak R 3,45; çeşme 2,70 × 1,15 (E, F); iç şadırvan Ø 6,5, 16 musluk (P, F). Kaide 86,6 × 89,6 m, 8 m pay, 1,5 m köşe pahı, 0,6 m kalınlık. Palet standart §3 (19 kubbe `#939FA8` ve minare tuğlası `#986B4D` kullanıcı kararıyla v22'de kaldı). | 91 812 üçgen; mesh temiz, 8 yönde arka yüz 0; figürler 4 192, ağaçlar 280 üçgen |
| v24 | Yalnız kaide: dikdörtgen → **daire**. Başka nesne, palet ve parça adı değişmedi. | Daire merkezi (0,55; 4,61), en küçük çevreleyen çember R 47,37 + pay **8 m** = **R 55,37 m** (pay kullanıcı kararı; genel standartta 3 m). Kalınlık 0,6, üst pah 0,15, üst #C4BDAF, yan #A39A8B, üst kot −0,02. Döşeme ve bina kenara 8,0 m, ağaç ve figürler ≥ 12,7 m: kesme ve taşıma gerekmedi. Sunum GLB'de yapı daire merkezine kaydırıldı; blend koordinatları aynı. **Silinen:** `Zemin_Kaide` (dikdörtgen, 44 üçgen); **yeniden üretilen:** `Zemin_Kaide` (572 üçgen). | 91 812 üçgen (kaidesiz) + kaide 572; 41 mesh SHA-256 v23'le aynı, ana GLB v23'le bayt bayt aynı; kaide mesh temiz, 8 yönde arka yüz 0 |
| v25 | Yalnız ağaç dokusu (kullanıcı isteği): Orhan Bey Camii v06'daki yaprak dokusu çınar ve serviye, gövde ve dallara tahta/kabuk dokusu. Geometri, palet, kaide ve parça adları v24 ile aynı. | Yaprak karosu 1,3 m, dünya konumundan (x + 0,6·y, z) (Orhan v06 ile aynı); renkler `#7FA35B` `#93B46A` `#6E9450`, servi `#3F7A5C`. Gövde karosu 0,6 × 1,2 m (64 × 128 px), ortalama `#7A634B` (standart §3), gövdede silindirik, dallarda uzun kenar boyunca eşleme. | 42 mesh SHA-256 v24'le aynı (yalnız UV eklendi); draw call 113 (değişmedi) |
| v27 | 27 Ekim 2026. İç mekân (yukarıdaki bölüm). Dış görünüş v26 ile aynı; Govde dolu kutudan boş kabuğa çevrildi. | Paye aksları x ±6,425 / ±19,025, y 0 / ±12,8 (kubbe merkezlerinin ortaları); duvar payesi aksları x ±31,375, y ±25,6; iç duvar ±31,85 × ±25,0 | 92 008 üçgen (uygulama); yeni parçalar manifold |
| v28 | Fotoğraftan ölçülen renk (`_kutuphane/malzeme-paleti.json`; ölçüm `_kutuphane/RENK_OLCUM_RAPORU.md`). Köşe rengi AO'su kaldırıldı; AO ikinci UV `UV_AO`'ya pişirildi (glTF occlusionTexture, texCoord 1). Yeni `Yer_Golgesi` düzlemi (unlit, alpha blend). Geometri ve parça adları v27 ile aynı (doğrulandı). Betik `build/build_v28.py` → `_kutuphane/renk_ao_v3/`. | Renk (F): Tas_Orgusu_Hafif #E5D0AE→#AF9A7D; Tas_Orgusu_Nis #CFBB97→#9E8A6C; Minare_Tugla_Derzi #CF7F55→#8E6A4E. AO 2048 px, 0,5 + 0,5 × AO, en koyu 0.5, kullanılan ortanca 0.74. Uygulama GLB 557 → 1348 KB. | `kontrol/v28/` |
| v29 | 28 Ekim 2026 (gece). 21 Ekim pastel renkleri geri (kullanıcı: fotoğraf renkleri haritada cansız; ton ayarı web'de): her malzeme v27 sürümündeki aynı adlı malzemenin rengi ve dokusu (fark 0 ton; v27'deki köşe rengi gri AO idi, çarpılmadı). Değişen: Sad_Mermer #E6E2D6→#F5F4F0; Tas_Orgusu_Hafif #AF9A7D→#E5D0AE; Tas_Orgusu_Nis #9E8A6C→#CFBB97; Mermer #E6E2D6→#F5F4F0; Kasnak.001 #D2B276→#F2E2A8; Minare_Kaide_Mermer #E6E2D6→#F5F4F0; Minare_Tugla_Derzi #8E6A4E→#CF7F55; Ic_Mermer #E6E2D6→#F5F4F0. Pişmiş AO v28'den, yeniden pişirilmedi: 1024 px tek kanal JPEG q80 (487 → 117 KB). Yer_Golgesi çıkarıldı (web çiziyor). Uygulama GLB 1349 → 768 KB (pastel v27: 558 KB). Geometri v28 ile aynı (Draco sıfır alanlı üçgenleri attı; kutu aynı). Betik `_kutuphane/renk_ao_v3/pastel_kucuk.mjs`. Kontrol `kontrol/v29/`. | AO 1024 px, 768 KB | `kontrol/v29/` |
| v29 | v29: blend kaynağı GLB ile eşitlendi (29 Ekim 2026). GLB artık Blender'dan üretiliyor: `build/build_v29.py` → `_kutuphane/blend_hat/` (renk ve doku yalnız `malzeme-paleti.json`'dan; Yer_Golgesi yok; AO tek kanal JPEG). Doğrulama a–g geçti (`kontrol/v29/esitleme.png`). | — | `kontrol/v29/` |
| v30 | 29 Ekim 2026. İç mekân ayrıntısı yalnız sunum GLB'sinde; harita GLB'si iç mekânsız (`model.json → ic_parcalar`). Ayrıntı ve kaynaklar yukarıdaki v30 bölümünde. | Sunum 97 496 → 112 402 üçgen, 844 → 1282 KB, çizim çağrısı 125 → 130, doku 11 → 15 (minber ve mahfil düzeltmesi dahil); harita 92 008 → 90 254 üçgen, 768 → 760 KB; dış eşitlik ≤ %0,051 | `kontrol/v30/` |
| v31 | 29 Ekim 2026. Levhalar fotoğraftaki gibi: 18 farklı levha (atlas 2048 × 1024, fotoğraf kırpması), ince levha + koyu çerçeve, oymalı taç, duvarlara yatay levha ve madalyon (yerler T); vav yalnız iki yerde. Yalnız sunum GLB'si; harita v30 ile aynı. Ayrıntı yukarıdaki v31 bölümünde. | Sunum 112 402 → 119 834 üçgen, 1282 → 1683 KB, çizim çağrısı 130 → 128, doku 15; harita 90 254 üçgen, 760 KB (değişmedi); dış eşitlik ≤ %0,057 | `kontrol/v31/` |
| v32 | 29 Ekim 2026. Kubbe ve çatıda kurşun ek dokusu (Bedesten gibi): kubbede 48 dilim eki ve levha sıraları, çatıda eğim yönünde ekler (sayılar T). Harita ve sunum. Ayrıntı yukarıdaki v32 bölümünde. | Üçgen ve çizim çağrısı aynı; harita 760 → 755 KB, doku 7 → 8; sunum 1683 → 1679 KB, doku 15 → 16; dış eşitlik ≤ %0,024 | `kontrol/v32/` |
| v26 | 21 Ekim 2026. Yalnız renk ve pişirilmiş ışık (21 Ekim 2026, ortak palet; `_GENEL_SAHNE_STANDARDI.md` §3): kurşun #BCC2C6 (kullanıcı kararı; önce #D6DADD, sonra #C3C9CD denendi; kurşun için V ≥ 0,80 ölçütü dışı), renk malzemede, köşe rengi gri AO (en koyu ≥ 0,80). Geometri aynı; yöntem `_kutuphane/palet_v2/`. Kontrol: `kontrol/v26/`. Blend eski sürümün orijinalinden `build/build_*.py` ile üretildi, GLB'ler bu blend'den dışa aktarıldı (Blender Draco; sıfır alanlı üçgenler Draco'da atılır, kabul). | — |

v16–v20'de açık/manifold olmayan kenar, 0,3 m eşikli çakışma ve 8 yönden arka yüz kontrolleri geçti (raporlar silinen sürüm klasörlerindeydi); v23'te mesh ve arka yüz kontrolleri geçti (`kontrol/v23/olcu_dogrulama.json`). Mobil performans hiçbir sürümde ölçülmedi. Eski dosya adlarında `gpt_` öneki vardı; 18 Ekim'de kaldırıldı.

## Bilinen sınırlar (v25; bina v23'ten değişmedi)

- Minare tepe kotu rölövedeki bölüm toplamından değil, alemin altındaki ince uçla birlikte 47,90 m'ye ayarlı; kaideler kısaldığı için gövde uzunlukları T (batı 19,4, doğu 24,2 m).
- Taç kapıda fotoğraftaki yan nişler yok (foto 001'de görünmüyor). Mukarnas stilize (11 sıra, 88 hücre).
- Şadırvan üçüncü bölmesi ve platform yüksekliği (0,30 m) tahmin. Kuzey/güney bölmeleri açık: ikinci giriş T.
- GLB'de şebeke delikleri alpha (BLEND); bazı görüntüleyicilerde kenar sıralaması görülebilir.
- Batı kapısında kapı kanadı sol alt kenarı çerçeveye göre hafif kaçık.
- Renk denetimi: kaide yan yüzü, 19 kubbe, minare tuğlası ve avlu taşı V < 0,72 (standart, kullanıcı kararı veya v22 onayı gereği).
- Stilize model. Kitabe yazıları uydurulmadı.

## Gece varyantı (31 Ekim 2026, ulu-cami_v32'den)

`export/night/ulu-cami_v32_night.glb` (uygulama, 1,45 MB) ve `export/night/ulu-cami_v32_night_sunum.glb` (2,41 MB). Üretim `_kutuphane/gece/` içinden: `blender -b --python gece_uret.py -- ayar/ulu-cami.json hepsi` (ayrıntı `_kutuphane/gece/BENIOKU.md`). Sahne `blend/ulu-cami_v32_night.blend`, kontrol `kontrol/night/` (repoda değil).

Işık köşe rengine pişirilmiş, malzemeler `KHR_materials_unlit`; parça adları ve düğüm konumları gündüzle aynı, `model.json` ayarları geçerli. Doku WebP (`EXT_texture_webp`), normal yok. Uygulama modeli üçgen 90 254 → 102 074. Haritaya bağlı değil; telefonda ölçülmedi. Model sürümü değişirse `ayar/ulu-cami.json` içindeki `dosya` güncellenip yeniden üretilir.
