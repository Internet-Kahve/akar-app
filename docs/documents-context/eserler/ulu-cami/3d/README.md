# Ulu Cami: 3D üretim klasörü

## Pişirilmiş harita sürümü (4 Kasım 2026, dördüncü deneme)

Gündüz dosyası `export/ulu-cami_v32_harita_pisik.glb` (702 016 bayt), gece dosyası `export/night/ulu-cami_v32_night_v2_harita_pisik.glb` (862 744 bayt). İki dosyada da bina `Harita_Pisik`, zemin gölgesi `Harita_Golge` malzemesini kullanır. Her ikisi de `KHR_materials_unlit` taşır. Uygulama yakınlaşma 17,5 ve üstünde mevcut dosyaya geçer, 17'nin altında pişmiş dosyaya döner. **Kabul ölçütleri tutmadı (aşağıda). Görsel onay Muhammed’e aittir.**

**Işık ve gölge.** Değişmedi. Araçlar ışığı `apps/web/src/lib/scene-light.ts` içindeki `MAP_LIGHT` ve `MAP_NIGHT_LIGHT` tanımlarından okur. Güneşin dünya azimutu 34°, modelin yerel azimutu 220° (354 + 40 − 174), yüksekliği 50°. `ORTAM_YUMUSAT`, `PARLAMA`, `AY_KATKI`, `Harita_Golge` yönü, düğüm adları ve opak şadırvan camı da değişmedi. Atlas 2048 piksel.

| | Güneş / ay gücü | Yarımküre gücü | ACES pozlaması | Zemin gölgesi opaklığı |
|---|---:|---:|---:|---:|
| Gündüz | 2,10 | 1,15 | 1,05 | 0,30 |
| Gece | 0,85 | 0,95 | 0,90 | 0,38 |

**Ölçüm (`_kutuphane/blend_hat/pisik_olcum.mjs`).** Mevcut model, haritanın bugün çizdiği `export/ulu-cami_v32.glb` dosyasıdır; gece için `night/ulu-cami_v32_night_v2.glb` kullanılır. Uygulamanın kurulumu aynen taklit edilir: kenar yumuşatma kapalı, gündüz 1024 px gölge haritası, ışıksız gece dosyası gölgesiz. Kamera telefonun görünümüdür: 780 × 1688 px, perspektif, dikey açı 36,87°, eğim 60°. Ölçüm 440 m (yakınlaşma 17,4) ve 220 m uzaklıkta yapılır. Sekiz detay karesi vardır; her biri hedefin çevresindeki 22 m'lik kesittir. Ölçüm yalnız o karenin parçalarında yapılır:

- **keskinlik:** pişmiş ve mevcut görüntülerin Sobel enerjisi oranı
- **SSIM:** parlaklık kanalında, 11 px Gauss penceresiyle
- **parlaklık:** piksel başına oranın medyanı
- **renk sapması:** pişmiş rengin, mevcutun 5 × 5 komşuluğundaki Lab kutusunun dışında kalan piksel payı; pay L için ±10, a/b için ±8

Çıktılar `kontrol/v32_pisik/uygulama/<etiket>/` klasörüne yazılır: `uclu_*` dosyaları mevcut | pişmiş | fark karşılaştırmalarıdır, `sayfa_*` dosyaları ise tema ve uzaklık başına özet sayfalardır. Tablolar `kontrol/v32_pisik/rapor.json → uygulama_olcum.<etiket>` alanındadır. Tutulan etiketler şunlardır: `0_baslangic` (deneme 3), `1_leke_tasma_son`, `2_kafes_son` (geri alınan madde 2), `son` (teslim edilen dosyalar). `tani_*` etiketleri neden tespitinin kanıtıdır.

```sh
GT_DIR=<kurulum> node docs/documents-context/eserler/_kutuphane/blend_hat/pisik_gorsel.mjs docs/documents-context/eserler/ulu-cami/3d v32 --uygulama <etiket> [--gun=<3d'ye göre yol> --gece=<yol>]
```

**Leke ve taşmanın nedeni (madde 1).** Kırmızımsı ve kahverengi saçaklar, merdiven rıhtlarındaki şeritler ve mukarnastaki benekler atlas texellerinin kendisindeydi. Mip süzmesi kapatılınca sapma değişmedi: alt pencerede %18,8, taç kapıda %4,1. UV örtüşmesi yoktu; adalar en az 4 px aralıklıydı. Kaynak Cycles ara pişirmesiydi, çünkü dar girinti ve basamak aralarında tam ışın gölgesi taş rengini koyulaştırıyordu. Eski yansıtma bu texelleri düzeltmiyordu. Görüntüler atlasla yaklaşık 1:1 yoğunlukta çiziliyordu ve komşu-piksel süzgeci 1–3 px'lik ince şeritleri siluet sayıp eliyordu. Sunum dosyası neden değildi: uygulama kamerasından harita dosyasıyla SSIM 0,95–1,00, sapma %0 ölçüldü (`tani_sunum_mi`).

**Yeni yansıtma (`pisik_gorsel.html → yansitAtlas`, `pisik_yansit.mjs → yansitUygulama`).** Atlas mevcut harita dosyasından, uygulamanın ışığıyla yansıtılır. Kullanılan 29 bakış şunlardır:

- 12 bakış 30° yükseklikte (uygulama eğimi)
- 8 bakış 12° yükseklikte
- 8 bakış 55° yükseklikte
- 1 bakış tepeden

Her bakış ortografiktir, 1,6 cm/px'lik 2048 px döşemelere bölünür; toplam 215 döşeme çizilir. Texel, kendisine düşen piksellerin doğrusal ortalamasıdır. Ağırlık (n·v)² ile çarpılır. Güneşi arkasına alan bakışlar önde tutulur: ağırlık 0,25 + 0,75·cos Δaz ile çarpılır. Bunun nedeni uygulamanın güneşi ön cepheye bakanın arkasından vurdurmasıdır. Ada içinde örneği olmayan texel en çok 16 adımda komşu örnekten doldurulur. Ada dışı piramit taşırmasıyla doldurulur. Mahya texelleri ve alfası deneme 3'teki gibi kalır; gece maske eşiği 0,2'dir. WebP kalitesi 92'dir.

**Teslim tablosu (`son`, 440 m; geçen ✓).** Sütunlar: SSIM / keskinlik / parlaklık / renk sapması.

| Kare | Gündüz | Gece |
|---|---|---|
| kurşun kubbe | 0,904 / 0,85 / 1,047 / %0,04 | ✓ 0,908 / 1,54 / 1,008 / %0,13 |
| şadırvan kubbesi | 0,718 / 0,54 / 1,056 / %0,52 | 0,886 / 0,94 / 1,001 / %6,92 |
| kasnak pencereleri | 0,612 / 0,36 / 1,085 / %1,26 | 0,957 / 1,10 / 0,975 / %0,75 |
| üst cephe pencereleri | 0,920 / 0,46 / 1,054 / %0,00 | ✓ 0,958 / 1,23 / 1,010 / %0,36 |
| alt pencere parmaklıkları | ✓ 0,966 / 0,94 / 1,008 / %0,00 | ✓ 0,928 / 0,93 / 0,994 / %0,00 |
| cephe taş örgüsü | 0,942 / 0,77 / 0,999 / %0,04 | 0,940 / 0,87 / 1,000 / %0,82 |
| taç kapı | ✓ 0,955 / 0,88 / 1,000 / %0,10 | 0,914 / 0,95 / 1,002 / %0,64 |
| alem ve şerefe | ✓ 0,902 / 0,99 / 1,000 / %0,14 | 0,932 / 0,94 / 1,004 / %0,73 |

16 karenin 6'sı geçiyor; başlangıçta 1'i geçiyordu. **Kasnak gece başlangıçta geçiyordu (%0,25), madde 1 sonrası geçmiyor (%0,75).** Yalnız kasnak pencerelerini geri almak bunu düzeltmedi. Bütün gece dosyasını geri almak ise kurşun kubbe, üst cephe ve alt pencere gece karelerini kaybettirir. Karar Muhammed'indir. 220 m değerleri `rapor.json`'dadır.

Genel ölçütler (440 m, tam çerçeve, bütün bina):

| | Medyan | p10 | p90 | %25’ten koyu |
|---|---:|---:|---:|---:|
| Gündüz | 1,017 | 0,979 | 1,077 | %0,34 |
| Gece | 1,003 | 0,953 | 1,065 | %1,46 |

Yapısal doğrulama geçti: düğümler aynı, yalnız `Harita_Golge` eklendi, kutu farkı 2,4 mm, 2/2 ışıksız malzeme var. Üçgen sayısı gündüz 90 256, gece 90 420. Boyut sınırı gündüz 1100 KB, gece 1300 KB.

**Madde 2 (kafes) geri alındı.** Görünürlük, 29 bakış yönünden ışın atılarak hesaplandı. Görünür yüzey yalnız 18 704 m²; 36 093 m² hiçbir yönden görünmüyor (iç mekân, cephe arkası, kafes arkası cam). Görünmeyen yüzlere 0,03 ölçek verilince kafes 2,56 cm/px'e indi (gece 2,36), diğer görünür yüzler yaklaşık 10 cm/px'te kaldı. Örneklenen texel sayısı 0,83 M'den 1,64 M'ye çıktı. Cephe taş gece karesi geçti. Ancak yeni UV düzeni mahyayı yeniden örnekledi ve kurşun kubbe gece karesi bozuldu: SSIM 0,908 → 0,873. Dört yol denendi: eşik (0,2 / 0,27 / 0,35 / 0,45 / 0,5), dokudan aktarım, hale yansıtması ve deneme 3 mahyası. Hiçbiri kareyi geri getirmedi. Dosyalar, blend'ler ve günlük `yedek/pisik_deneme4_madde2_kafes/` altındadır. `build/pisir_harita.py` bu düzeni üretir: `KAFES_CM`, `GIZLI_UV_OLCEK`.

**Neden tutmuyor, atlasın gerçek sınırı.** 440 m'de telefon pikseli 17,3 cm'dir, dik cephede yaklaşık 20 cm. Atlas görünür yüzlerde yaklaşık 9–10 cm/px'tir, yani ekran çözünürlüğünün üstündedir. Madde 2'de örneklenen texeller iki katına çıktı ve kafes 2,6 cm/px'e indi, ama aşağıdaki kareler değişmedi:

- **Şadırvan (gündüz ve gece):** Mevcut camda %40 saydamlık var; iç mekân ve kasnak paralaksla görünüyor. Opak tek dokuda bu yalnız bir yönden doğru olabilir.
- **Kurşun kubbe ve üst cephe (gündüz parlaklığı +%5):** Güneş parlaması görünüşe bağlı ve ışıksız dokuda sabit.
- **Kasnak ve üst cephe kafesleri (gündüz keskinlik 0,36–0,46):** Mevcutta alfa maskeli kafes en-yakın mip süzmesiyle çiziliyor. 440 m'de delikler kırık, örtüşmeli bir desen oluşturuyor; doğru süzülmüş atlas bu kenar enerjisini üretmez. Atlas süzmesi de denendi (NEAREST_MIPMAP_NEAREST, LINEAR_MIPMAP_NEAREST); değişmedi.
- **Cephe taşı (gündüz keskinlik 0,77):** Mevcuttaki NEAREST süzmeli taş dokusu daha sert görünüyor.
- **Gece renk sapmaları (%0,6–0,8):** Taç kapı, alem ve kasnak karelerinde ince parlak çizgilerde ve mahya kenarında görülüyor.

Gereken piksel sayısı: 220 m'de bile ekran çözünürlüğüne yaklaşmak için 18 704 m² yaklaşık 4 cm/px ister. %59 dolulukla bu yaklaşık 20 M texel eder, oysa 2048² 4,2 M texeldir. 4096² atlas 4,3 cm/px verir. Bu ölçüm karelerinin sorunu çözünürlük değil, görünüşe bağlılık ve mevcut modelin süzme biçimidir.

**Üretim.** Teslim dosyaları deneme 3 dosyalarından türetildi: `yedek/pisik_deneme3_2026-11-04/` (UV düzeni, Cycles tabanı ve mahya). Önce bu dosyalar `export/` altına kopyalanır, sonra repo kökünden şu komut çalıştırılır:

```sh
GT_DIR=<gltf-transform + draco3dgltf + sharp> node docs/documents-context/eserler/_kutuphane/blend_hat/pisik_gorsel.mjs docs/documents-context/eserler/ulu-cami/3d v32 --yansit-uygulama --uygulama son
GT_DIR=<...> node docs/documents-context/eserler/_kutuphane/blend_hat/pisik_dogrula.mjs docs/documents-context/eserler/ulu-cami/3d v32
```

Sonuç belirlenimcidir. SHA-256 değerleri: gündüz `8948931c…cb66a`, gece `01e51ac6…50c9d`. Tam pişirme (`blender -b --python-exit-code 1 --python docs/documents-context/eserler/ulu-cami/3d/build/pisir_harita.py -- hepsi`) madde 2 düzenini üretir. Bu pişirme `blend/*_harita_pisik_cycles.glb` dosyasını yazar ve yansıtmayı o dosyadan başlatır. Gece mahyası için `--mahya-kaynak=mevcut` gerekir.

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
