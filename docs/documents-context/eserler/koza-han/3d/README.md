# Koza Han: 3D üretim klasörü

Güncel sürüm **v14** (21 Ekim 2026). v13 blend, GLB ve kontrol dosyaları 21 Ekim 2026'da **silindi**; v13 bilgisi: (19 Ekim 2026; betik `build/build_v13.py` + `build/figur_yerlesim_v13.py`, GLB `export/koza-han_v13.glb` (yalnız yapı: `Cevre_*`, `Olcek_Insan_*`, `Avlu_Agac` ve `Avlu_Cim` 20 Ekim 2026'da çıkarıldı, 0,55 MB) ve `_sunum.glb` (çevre, ağaç ve figürlü), render'lar `kontrol/v13/`: varsayılan render listesinin 22 karesi + `kontrol_0…7`, `build/render_v13.py` ile v13 blend'inden alındı; modele dokunmaz: `Blender -b blend/koza-han_v13.blend --python build/render_v13.py [-- ad,ad]`). Üretim: `KOZA_FIGUR=1 blender -b --python build/build_v13.py` (`KOZA_RENDER=havadan,...` ile render listesi daraltılabilir). Ağaç dokuları `build/doku/yaprak_*.png` ve `agac_govde.png`; üreticisi ve UV kuralı `../../_kutuphane/agac_doku.py`. Aşağıdaki «İçerik» bölümü v02o döneminden kalmadır. Bu klasörde yalnızca son sürüm tutulur; önceki sürümler aşağıdaki tabloda kayıtlıdır, ayrıntılı karar metinleri `../koza-han_notlar.md` sonundaki "Geçmiş kayıt" ekinde. Sıradaki tur v03'ün talimatı `../SONNET_REVIZYON_PLANI.md` dosyasında.

## İçerik

- `build/build_v02o.py`: üretim betiği. Bütün ölçüler en üstteki `P` sözlüğünde; her değerin yanında kaynak harfi (E/W/O/F/T/K). Eksenler +X doğu, +Y kuzey, +Z yukarı; orijin ana avlunun ortası.
- `build/doku/`: doku karoları ve üreticisi `doku_uret.py` (`uv run --no-project --python 3.12 --with pillow python doku_uret.py`). Portal köşeliği `../ref/plan/tasarim_portal_kose.png` çiziminden okunur. v02o şu dokuları kullanır: `almasik`, `kesme_tas`, `korkuluk`, `pencere`, `petek`, `petek_korkuluk`, `baca`, `portal_on_v02m`.
- `build/araclar/`: `blender_yukle.py <sürüm>` (açık Blender'a yükler; MCP for Blender eklentisi gerekir), `yan_yana.py` (render ile referansı yan yana birleştirir).
- `blend/koza-han_v02o.blend`, `export/koza-han_v02o.glb` (Draco, 492 KB).
- `kontrol/v02o/`: render'lar, `kontrol_rapor.json`, referansla yan yana görseller.

Üretim: `blender -b --python 3d/build/build_v02o.py` (Blender 5.2). Betik sonunda kontrol, AO, Draco GLB ve render'ları yazar.

## Sürüm geçmişi

| Sürüm | Değişiklik (16 Ekim 2026) | Üçgen |
|---|---|---|
| v01 | Kütle: gövde, revak, çatı, baca, portal, mescit, avlu zemini. Kanat 6,85 m = (OSM dış 59,7 × 51,7 − avlu 46 × 38) / 2 | 7 416 |
| v01b | Kubbe sırası avlu tarafında, dışa eğimli çatı, portal üstünde 3 kubbe; kütle donduruldu | 7 642 |
| v02 | Revak kemerleri, avlu cephesi kapıları, dış pencereler, kat silmesi, portal çerçevesi, mescit kemer ve pencereleri, AO | 19 426 |
| v02b | Üst kat dış pencereleri eşit aralıklı, dikdörtgen, sivri tuğla alınlıklı | 25 122 |
| v02c | Kanat çatısı üç bant: saçak şeridi + baca, beşik tonoz, kubbe sırası + korkuluk duvarı | 26 060 |
| v02d | Kubbe/baca düzeni, portal burmalı silme ve mavi çini alan | 28 910 |
| v02e | Pencere dokusu, almaşık duvar karosu, fotoğraftan renkler | 27 890 |
| v02f | Avlu üst katı kesme taş ayak ve sivri kemer, beyaz korkuluk; tuğla tonu açıldı | 27 986 |
| v02g | Avlu kemeri kubbe sayısına eşitlendi | 26 882 |
| v02h | Portal yüzü fotoğraftaki gibi (halat, kakma, yıldız örgüsü); kubbe/kemer 9 ve 11 | 27 266 |
| v02i | Bacalar: tuğla gövde, sivri açıklıklar, piramit külah | 28 274 |
| v02j | Mescit: çan etekli kurşun kubbe, alem, mermer merdiven ve taban, petekli alınlık | 29 098 |
| v02k | Mescit merdiveni korkuluğu ve merdiven altı boşluğu | 29 138 |
| v02l | Portal köşeliği tasarım çiziminden; merdiven korkuluğu petek şebeke | 29 138 |
| v02m | Portal kiremit örgüsü; kapı kemer tepesi 7,8 m | 29 274 |
| v02n | Yön düzeltmesi: portal kısa kenarda (dış 51,7 × 59,7, avlu 38 × 46); portal kubbeleri | 29 446 |
| v02o | Portal kütlesi 18 × 4,8 m (tasarım krokisi); UV katman hatası düzeltildi | 29 450 |
| v03–v11 | Bu tabloya işlenmedi; değişiklikler `build/build_v13.py` dosyasının ilk satırında sürüm sürüm yazılı. | — |
| v12 | 19 Ekim 2026. Kaide **oval** oldu (Ulu Cami v22 gibi; kullanıcı kararı, genel standarttaki dikdörtgen kaidenin yerine). Revak kemer köşeliklerindeki ince siyah düşey çizgiler giderildi. Oval: yapı köşelerine (han, portal, İç Koza, çevre ağaçları) 6 m pay konarak hesaplanan en küçük alanlı elips; merkez (18,21; 5,79), yarı eksenler 80,75 × 57,50 m, büyük eksen 17,2° eğik, kalınlık 0,6, üst pah 0,15. Önce R 72 m daire denendi; arkada boşluk, önde sınır bıraktığı için kullanıcı eğik ovali seçti. Cevre_Doseme kaide kenarından 1,5 m içeride kesildi. GLB'lerde orijin = kaide merkezi (yapı dışa aktarımda −18,21; −5,79 kaydırıldı); betik ve blend dünya koordinatları değişmedi. Çizgi nedeni: köşelik paneli ayağa 3 cm gömülüydü, gömülü köşeler AO pişiriminde siyah kalıyordu. Gömülme 2 mm'ye indirildi (han revakı ve İç Koza revakı). | 45 866 |
| v13 | 19 Ekim 2026. Yalnız ağaç dokusu (kullanıcı isteği): Orhan Bey Camii v06'daki yaprak dokusu (karo 1,3 m, `#7FA35B` `#93B46A` `#6E9450`) `Avlu_Agac` ve `Cevre_Agac_01–08` taçlarına; gövdelere tahta/kabuk dokusu (karo 0,6 × 1,2 m, ortalama `#7A634B`, silindirik eşleme). Doku AO çarpımından sonra bağlanır (doku × AO). Geometri v12 ile aynı (37 nesne, köşe/yüz/malzeme özeti eşit). | 45 866 |
| v14 | 21 Ekim 2026. Yalnız renk ve pişirilmiş ışık (21 Ekim 2026, ortak palet; `_GENEL_SAHNE_STANDARDI.md` §3): kurşun #BCC2C6 (kullanıcı kararı; önce #D6DADD, sonra #C3C9CD denendi; kurşun için V ≥ 0,80 ölçütü dışı), renk malzemede, köşe rengi gri AO (en koyu ≥ 0,80). Geometri aynı; yöntem `_kutuphane/palet_v2/`. Kontrol: `kontrol/v14/`. Blend eski sürümün orijinalinden `build/build_*.py` ile üretildi, GLB'ler bu blend'den dışa aktarıldı (Blender Draco; sıfır alanlı üçgenler Draco'da atılır, kabul). Avlu zemini dokusu uygulama modelinde #D2C3A4 ortalamasına açıldı (V ≥ 0,80; standart §1'deki #B3A590'dan sapma, kullanıcı kararı). | — |
| v15 | 28 Ekim 2026. Fotoğraftan ölçülen renk (`_kutuphane/malzeme-paleti.json`; ölçüm `_kutuphane/RENK_OLCUM_RAPORU.md`). Köşe rengi AO'su kaldırıldı; AO ikinci UV `UV_AO`'ya pişirildi (glTF occlusionTexture, texCoord 1). Yeni `Yer_Golgesi` düzlemi (unlit, alpha blend). Geometri ve parça adları v14 ile aynı (doğrulandı). Betik `build/build_v15.py` → `_kutuphane/renk_ao_v3/`. Renk (F): Duvar_Almasik #DCC8A6→#8E887F; Tugla #CF7F55→#8E6A4E; Baca_Tugla #D07F54→#8E6A4E; Disli_Tugla #D69063→#8E6A4E. AO 1024 px, 0,5 + 0,5 × AO, en koyu 0.5, kullanılan ortanca 0.8. Uygulama GLB 828 → 1247 KB. | v14 ile aynı (+ Yer_Golgesi 2) |
| v16 | 28 Ekim 2026 (gece). 21 Ekim pastel renkleri geri (kullanıcı: fotoğraf renkleri haritada cansız; ton ayarı web'de): her malzeme v14 sürümündeki aynı adlı malzemenin rengi ve dokusu (fark 0 ton; v14'deki köşe rengi gri AO idi, çarpılmadı). Değişen: Mermer_Beyaz #E6E2D6→#F5F4F0; Duvar_Almasik #8E887F→#DCC8A6; Baca_Tugla #8E6A4E→#D07F54; Tugla #8E6A4E→#CF7F55; Disli_Tugla #8E6A4E→#D69063. Pişmiş AO v15'den, yeniden pişirilmedi: 1024 px tek kanal JPEG q80 (263 → 163 KB). Yer_Golgesi çıkarıldı (web çiziyor). Uygulama GLB 1248 → 899 KB (pastel v14: 829 KB). Geometri v15 ile aynı (Draco sıfır alanlı üçgenleri attı; kutu aynı). Betik `_kutuphane/renk_ao_v3/pastel_kucuk.mjs`. Kontrol `kontrol/v16/`. | v15 ile aynı |
| v16 | v16: blend kaynağı GLB ile eşitlendi (29 Ekim 2026). GLB artık Blender'dan üretiliyor: `build/build_v16.py` → `_kutuphane/blend_hat/` (renk ve doku yalnız `malzeme-paleti.json`'dan; Yer_Golgesi yok; AO tek kanal JPEG). Doğrulama a–g geçti (`kontrol/v16/esitleme.png`). Düzeltilen hata (uygulama ve sunum): v15/v16'da Govde_Dis ve Ic_Koza dokuları (Duvar_Almasik, Moloz, Disli_Tugla, Pencere_Izgara) texCoord 1'i, yani UV_AO'yu kullanıyordu; desen bozuktu. Artık texCoord 0 (v14'teki doku UV'si); ışıksız render v14 ile %0,001 farklı. | aynı |
| v17 | v17: kök parça bölünüşü sadeleştirildi (29 Ekim 2026): 15 → 9 parça (Avlu_Revak, Avlu_Zemin, Cati, Cephe, Govde_Dis, Ic_Koza, Mescit, Portal, Revak_Kubbeleri). Adımlar: ayrıldı: Avlu_Mescit → Ic_Koza (115 yüz) İç Koza (ikinci avlu) ortasındaki 12 kenarlı mermer havuz (build_v13.py: «Street View 04», ölçüler T) yanlışlıkla mescide birleştirilmişti; ikinci avlunun parçası.; birleşti: Avlu_Mescit, Mescit_Kubbe, Mescit_Dikis → Mescit; birleşti: Avlu_Revak, Avlu_Cephe → Avlu_Revak; birleşti: Avlu_Zemin, Avlu_Halka → Avlu_Zemin; birleşti: Cephe, Silme_Kat → Cephe; birleşti: Cati, Baca → Cati; ad: Kubbe_Avlu → Revak_Kubbeleri. Renk, doku, AO ve toplam üçgen (38298) aynı; referanslar yeni adlara çevrildi (eksik 0). Plan `_kutuphane/blend_hat/parca_plan.json`; ayrıntı `kontrol/v17/parca_envanteri.md`, `tiklama_haritasi.png`. | aynı |

Her sürümde açık/manifold olmayan kenar 0, ≥ 0,3 m çakışma 0, 8 yönden arka yüz kırmızı oranı 0 (GECTI). v02o: 48 draw call. Mobil performans ölçülmedi.

## Bilinen sınırlar (v02o)

- Kanat 6,85 m ve dış 51,7 × 59,7 m (OSM). Plan ve dik hava fotoğrafı kanadı ≈ 13 m, dışı ≈ 64 × 72 m gösteriyor; düzeltme v03 planının §1 bölümünde.
- Mescit ölçüleri tahmin (T); kapı kuzey yüzde. Güler 2020 rölövesi ve hava fotoğrafıyla düzeltme v03'te.
- Avlu zemini düz; çim diski koyu yeşil; tuğla ve kurşun tonları koyu. Genel sahne standardına geçiş v03'te.
- Üçgen bütçesi 30 000 sınırında; v03 bütçesi planda yeniden tanımlanır.

## v03 çalışma notları (taslak; v03 kabul edilince sürüm geçmişine işlenecek)

- Avlu parke derzi: genel standardın «ana zeminden 1 mm yüksekte derz şeridi» kuralı bu eserde **doku olarak uygulanmıştır** (`build/doku/parke.png`, 0,4 m karo, derz `#A69A86`). Geometrik derz avlu üçgen bütçesini (≤ 2 500) aşırdığı için yapılmadı; kullanıcı kararı (18 Ekim 2026).
- İç Koza avlusuna ağaç konmadı (plan §4'te isteğe bağlıydı); çınar sayısı 4.
- İç Koza ekseni han doğu revakındaki bir kemer gözüne hizalandı: kuzey kenar hanın kuzeyinden 3,14 m güneyde (plan ≈ 4,5 ± 3 m; kullanıcı kabulü).
- `kozahan_arsiv_010` kuzeye göre çekilmemiş (portal fotoğrafın sağ kenarında); karşılaştırma için 90° sola döndürülür, oranlar `kontrol/v03/oran_kontrolu.json` içinde.
- Mescit merdiveni: 4,94 m sahanlık dahil (ilk denemede sahanlık üstüne eklenmişti), yanlarda yere inen dolu duvar, mescit tarafında kemerli boşluk, iki sıra yuvarlak delikli korkuluk, 4 çift dikme (kaynak: rölöve batı cephesi, üst kat planı, foto 043).
