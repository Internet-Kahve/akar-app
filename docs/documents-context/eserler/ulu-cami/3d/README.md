# Ulu Cami: 3D üretim klasörü

Güncel sürüm **v27** (27 Ekim 2026; v26 + iç mekân: boş gövde, payeler, kemerler, mihrap, minber, yazısız levhalar; «Kubbeleri kaldır» için). **v26 dosyaları silinmedi:** `design/test-redmi9t/` (v1 prototipi) hâlâ v26'yı açıyor; v1 bırakılınca silinebilir. Bu klasörde normalde yalnızca son sürüm tutulur; önceki sürümler aşağıdaki tabloda kayıtlıdır. Kaynaklar `../ref/` altında, model kararları `../ulu-cami_notlar.md` içinde.

## İçerik

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
