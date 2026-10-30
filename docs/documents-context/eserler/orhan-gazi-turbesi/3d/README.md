# Orhan Gazi Türbesi: 3D üretim klasörü

Güncel sürüm **v06** (29 Ekim 2026; iç mekân, aşağıda). Önceki not: güncel sürüm **v02** (21 Ekim 2026; v01 blend, GLB ve kontrol dosyaları **silindi**). Bu klasörde yalnızca son sürüm tutulur; sürümler aşağıdaki tabloda kayıtlıdır, kararlar ve kanıtlar `../orhan-gazi-turbesi_notlar.md` §1 ve `kontrol/v01/kontrol_ozeti.md` içinde.

## Güncel sürüm: v06 (29 Ekim 2026) · iç mekân («İçini göster» + ayrıntı; iç parçalar yalnız sunumda)

Betik `build/build_v06.py` → `build/doku_ic_v06.py` (atlas) → `build/build_v06_ic.py` (Blender, v05 blend'ini açar, dokunmaz) → `_kutuphane/blend_hat/uret.py`. **İki dosya:** sunum GLB'si dış + iç; harita GLB'si yalnız dış (`model.json → ic_parcalar`). **Kalkan gruplar** (`ortu_gruplari`): `Kubbe` + `Ic_Kubbe` → `Dehliz`. Kontrol `kontrol/v06/` (`icini_goster.png`, `ic_detay.png`, `ic_kaynak.png`, `dis_esitlik.png`, `tiklama_haritasi.png`, `doku_ic_atlas.png`, `parca_dogrulama.json`, `ic_rapor.json`, `blend_rapor.json`).

| Kök parça | Ne | Ölçü | Kaynak |
|---|---|---|---|
| `Govde` (değişti) | Katmanların yatay kapakları (subasman, friz, saçak; üstte ve altta) iç kare kesilerek halka oldu; dışarıdan görünen halka aynı | İç kare 14,20 × 14,20 | E C2 PDF 116 (16,80 kare, duvar 1,30) |
| `Kubbe` (değişti) | Aşağı bakan 54 alt kapağın yönü yukarı çevrildi: içeriden arkası döner, orta kubbe görünür. Silinmedi; geometri ve UV v05 ile aynı | — | — |
| `Ic_Duvarlar` | İç duvar yüzü, 11 pencere (içten cam ve kayıt), 22 Hereke perdesi, 11 barok alınlık, duvar üstünde zikzak kuşak, kapı iç yüzü | Pencere 1,69, eşik +0,78, tepe +3,97 (v01); perde, alınlık, kuşak kotları **T** | E C2 PDF 116 («her cephede üçer, giriş cephesinde ikişer pencere», «Hereke kumaşından perdeler», «pencere alınlıkları iri barok motiflerle»); F 02 |
| `Orta_Kubbe_Sutunlar` | 4 sütun (kare kaide, gövde, başlık, tabla), 4 sivri kemer, pandantifler, çember kuşağı | Eksenler ±3,40, gövde Ø 0,67, kaide 1,0 (P); üzengi +4,75, kemer tepesi +8,05 (**T**) | P Yurt 2024 PDF 224; E C2 PDF 116 («dört sütun üzerine … küçük bir kubbe», «sivri kemerlere oturan pandantifli kubbe»); F 02, Yurt PDF 327–329 |
| `Ic_Kubbe` (Kubbe ile kalkar) | Kısa kasnak ve orta kubbenin iç yüzü; kalem işi kartuş fotoğraf kırpması | Ø 6,00 (P plan dairesi); etek +8,80, tepe +11,80 (**T**) | E «kartuş düzeninde kalem işleri»; F Yurt 2024 PDF 333 Levha 139 (kırpma perspektifli) |
| `Dehliz` (ikinci grupta kalkar) | Orta karenin çevresinde yarım beşik tonoz (duvardaki kuşaktan orta kemer tepesine), köşelerde çapraz; çift yüzlü | Duvarda +5,65, ortada +8,05 (**T**) | E «kubbenin çevresi beşik tonozlarla örtülü dehlizli bir düzenleme»; P plandaki köşe çaprazları; F 02 |
| `Ic_Zemin` | Kırık taş döşeme (kodla); renkler ortak paletin nötr taş rolleri (`ic_zemin_koyu/tas/acik/derz`, arada `mermer`) | 14,20 × 14,20 | Desen F 05; E C2 PDF 117 («döşeme mozaik parçaları»). Fotoğraflardan ölçülen renk sıcak ışık yüzünden turuncuydu (kullanıcı düzeltmesi) |
| `Orhan_Gazi_Sandukasi` | Mermer kaide, sanduka (beşik üstlü), koyu puşide, kavuk, pirinç şebeke (köşe direkleri ve sivri tepelikler, ≈ 8 cm arayla çubuklar, kuşaklar, üst kuşakta ≈ 24 cm arayla topuzlar; ayrı malzeme `Turbe_Pirinc`, renk `pirinc_sebeke`, metalik 0,5, pürüzlülük 0,35: istenen 0,8 ortam yansıması olmayan görüntüleyicide düz yüzleri koyu gösterdi, karşılaştırma `kontrol/v06/sebeke_metal.png`) | Yer ve boyut F 05 ölçeğiyle (3,6 × 1,75 kaide); yükseklikler **T** | E C2 PDF 117 («yeşil çuha kaplı puşide», «pirinç şebeke», «mermer kaide … ortada»); F 02, 05 |
| `Sandukalar` | 20 sanduka, mermer görünümlü setler üstünde; desensiz düz kumaş örtü (`sanduka_ortu`), üstleri sivri; ahşap korkuluk | Yerler F 05 ölçeğiyle; yükseklikler **T** | E C2 PDF 117 («yirmi sanduka daha … tuğladan örülmüş ve mermer görünümlü setlerin üzerine»); F 02, 05 |

**Ölçek (F 05, kubbeden aşağı çekim):** sütun dipleri arası 6,80 m = 475 px (x) / 490 px (y); sanduka üstleri kameraya yakın olduğu için konumlar 0,90 ile merkeze çekildi (**T**). Kuzey yukarı (güneyde iki pencere ve kapı görünüyor).

**Doku:** tek atlas `build/doku_ic_v06/ic_atlas.jpg` (1024 × 1024, q80, 166 KB; kaynaklar `kaynak.json`'da). Kodla: döşeme, iç pencere, zikzak kuşak, düz renk blokları. Fotoğraf kırpması: Hereke perdesi, alınlık (F 02), kubbe kalem işi (Yurt PDF 333). Yazı yok. **Yeni renk rolleri:** `puside_koyu`, `turbe_korkuluk` (F 05); `sanduka_govde`, `sanduka_ortu`, `pirinc_sebeke`, `turbe_ic_cam` (F 02). `turbe_zemin_*` (F 05) palette kayıtlı ama kullanılmıyor. Fotoğraflar sıcak ışıkta çekilmiş; ölçüm olduğu gibi. Sütun ve kemer sarısı için ölçüm doygun çıktığından ortak `kasnak_sari_siva`, sıvalar için `krem_siva`, mermer ve pirinç için `mermer`, `musluk_pirinc` kullanıldı.

**Sayılar** (v05 → v06): harita 8 282 → 8 342 üçgen, 260 → 262 KB, 16 çizim çağrısı, 5 doku; sunum 11 618 → 29 320 üçgen, 314 → 523 KB, çizim çağrısı 32 → 43, doku 10 → 11 (8 sınırı v05'te zaten aşılmıştı: dördü ağaç dokusu; kullanıcı kabul etti). Dış eşitlik harita ↔ sunum en çok %0,001. Harita v05 ↔ v06 en büyük fark %0,063 (80°, azimut 200, yakın); öteki açılar %0,033–0,036; sınır %0,1'in altında. Referans denetimi c, d geçti.

**Belirsiz / atlanan:** sandukaların baş yönü ve kavukların yeri (yalnız Orhan Gazi'ye kavuk konuldu, batı ucuna, **T**); sanduka sahiplerinin hangisinin hangi yerde olduğu (E: altısı tanımlı, yerleri yazılı değil); sütun başlığının volütleri ve tabladaki konsollar sade kutu; avize, kandiller, levhalar ve tavan gergileri modellenmedi; pandantif ve pencere alınlıklarının kalem işi yalnız alınlık kırpmasıyla; kemerlerin bordürleri yok. Puşide fotoğraf 05'teki 2023 işlemeli örtü yerine düz koyu renk (kırpmanın üstünde avize var). Diğer sandukalardaki dokuma desen kullanıcı isteğiyle kaldırıldı (düz kumaş).

### v05 ve öncesi

## İçerik

- `build/build_v01.py`: üretim betiği. Bütün ölçüler en üstteki `P` sözlüğünde; her değerin yanında kaynak harfi (P/E/W/F/T/K). Eksenler +X doğu, +Y kuzey, +Z yukarı; orijin gövde karesinin ortası, zemin z = 0; giriş güneyde.
- `build/kontrol_v01.py`: fotoğrafla yan yana görseller ve plan bindirme (PIL; `uv run --no-project --python 3.12 --with pillow python build/kontrol_v01.py A|B|C`).
- `build/doku_uret_v01.py`: şebeke, hol camı, kurşun dikiş ve taş döşeme dokuları. Ağaç dokuları (`yaprak_*.png`, `agac_govde.png`) `../../_kutuphane/agac_doku.py doku "#3F7A5C"` ile üretilir.
- `blend/orhan-gazi-turbesi_v01.blend` (dokular paketli). — **silindi** (21 Ekim 2026; yerine v02)
- `export/orhan-gazi-turbesi_v01.glb` (zeminsiz, yalnız yapı: ağaç ve figür çıkarıldı, Draco, 0,16 MB; orijin yapı merkezi) ve `export/orhan-gazi-turbesi_v01_sunum.glb` (daire kaideli, ağaç ve figürlü, 0,28 MB; orijin kaide merkezi). — **silindi** (21 Ekim 2026; yerine v02)

**20 Ekim 2026:** uygulama GLB'sinden çevre (`Cevre_*`) ve insan figürleri (`Olcek_Insan_*`) çıkarıldı; bunlar yalnız `_sunum.glb`'de. Sürüm numarası değişmedi. Kural ve betik: `eserler/_GENEL_SAHNE_STANDARDI.md` §5.5, `eserler/_kutuphane/glb_temizle.mjs`. Yeni sürümde son adım olarak tekrar çalıştır.
- `kontrol/v01/`: render'lar, yan yana görseller, `kontrol_ozeti.md`, `kontrol_rapor.json`, `renkler.json`, `olcu_dogrulama.json`, `kontrol_0…7.png` (arka yüz). — **silindi** (21 Ekim 2026; yerine v02)

Üretim (Blender 5.2): `blender -b --python 3d/build/build_v01.py`
- `OGT_ASAMA=A|B|C`: A kütle, B + detay, C (varsayılan) + renk, kaide, çevre, figür, AO.
- `OGT_TESLIM=1`: blend, iki GLB, `kontrol_hepsi`, `renkler.json`, `kontrol_rapor.json` yazar. Yoksa GLB'ler yalnız `kontrol/_tmp/` altına deneme olarak yazılır.
- `OGT_RENDER=ad1,ad2` render listesini daraltır (`none`: render yok); `OGT_ORNEK=24` Cycles örnek sayısı.
- Geçici dosyalar `kontrol/_tmp/` altında; tur sonunda silinir.

## Sürüm geçmişi

| Sürüm | Değişiklik | Üçgen |
|---|---|---|
| v01 | 19 Ekim 2026. Sıfırdan ilk sürüm (`SONNET_REVIZYON_PLANI.md` §1–§6; plan dosyası tur sonunda silindi). **Kütle (onay A):** 16,80 m kare gövde (E), saçak 8,03, içbükey metal çatı eteği, kasnak Ø 8,40 / korniş Ø 8,80, kubbe tepesi 14,30 + alem 1,20 (F), güneyde giriş holü 6,00 × 3,20 ve iki sütunçeli sundurma (F). **Detay (onay B):** 11 yuvarlak kemerli pencere (söve, kilit taşı, alfa kesmeli beyaz şebeke), dilimli kemerli mermer söveli kapı, köşe pilastrları ve silmeler, 48 konsollu kasnak kornişi; kasnakta pencere yok. **C:** cephe #E9DFC6; daire kaide (merkez 4,29; −1,56, R 20,78 = en küçük çember 17,78 + 3 m), taş döşeme + doğu ve kuzey çimi (%7,9), 4 ağaç (çınar, iki manolya, sedir), 4 figür (`akar3d.insan`), vertex AO (taban 0,70; Kubbe ve Kasnak 0,85). Draw call 30 için lünet camı kaldırıldı, lento, hol döşemesi ve kilit taşı ortak malzemeye geçti. Köşe pilastrları L biçiminde iki ince kutu (gömülme ≤ 2 mm). Arsiv havadan fotoğraflarının kamera çözümü doğuya döndürüldü (bkz. notlar §1). Draw call 30, GLB 0,26 / 0,28 MB, şebeke alphaMode MASK. | 10 642 |
| v02 | 21 Ekim 2026. Yalnız renk ve pişirilmiş ışık (21 Ekim 2026, ortak palet; `_GENEL_SAHNE_STANDARDI.md` §3): kurşun #BCC2C6 (kullanıcı kararı; önce #D6DADD, sonra #C3C9CD denendi; kurşun için V ≥ 0,80 ölçütü dışı), renk malzemede, köşe rengi gri AO (en koyu ≥ 0,80). Geometri aynı; yöntem `_kutuphane/palet_v2/`. Kontrol: `kontrol/v02/`. Blend eski sürümün orijinalinden `build/build_*.py` ile üretildi, GLB'ler bu blend'den dışa aktarıldı (Blender Draco; sıfır alanlı üçgenler Draco'da atılır, kabul). | 8282 (değişmedi) |
| v03 | 28 Ekim 2026. Fotoğraftan ölçülen renk (`_kutuphane/malzeme-paleti.json`; ölçüm `_kutuphane/RENK_OLCUM_RAPORU.md`). Köşe rengi AO'su kaldırıldı; AO ikinci UV `UV_AO`'ya pişirildi (glTF occlusionTexture, texCoord 1). Yeni `Yer_Golgesi` düzlemi (unlit, alpha blend). Geometri ve parça adları v02 ile aynı (doğrulandı). Betik `build/build_v03.py` → `_kutuphane/renk_ao_v3/`. Renk (F): kurşun ve diğer roller aynı. AO 1024 px, 0,5 + 0,5 × AO, en koyu 0.5, kullanılan ortanca 0.53. Uygulama GLB 253 → 479 KB. | v02 ile aynı (+ Yer_Golgesi 2) |
| v04 | 28 Ekim 2026 (gece). 21 Ekim pastel renkleri geri (kullanıcı: fotoğraf renkleri haritada cansız; ton ayarı web'de): her malzeme v02 sürümündeki aynı adlı malzemenin rengi ve dokusu (fark 0 ton; v02'deki köşe rengi gri AO idi, çarpılmadı). Değişen: Cephe_Krem #F5E4C9→#E8DFCB; Mermer #E6E2D6→#F5F4F0. Pişmiş AO v03'den, yeniden pişirilmedi: 512 px tek kanal JPEG q80 (135 → 28 KB). Yer_Golgesi çıkarıldı (web çiziyor). Uygulama GLB 479 → 264 KB (pastel v02: 253 KB). Geometri v03 ile aynı (Draco sıfır alanlı üçgenleri attı; kutu aynı). Betik `_kutuphane/renk_ao_v3/pastel_kucuk.mjs`. Kontrol `kontrol/v04/`. | v03 ile aynı |
| v04 | v04: blend kaynağı GLB ile eşitlendi (29 Ekim 2026). GLB artık Blender'dan üretiliyor: `build/build_v04.py` → `_kutuphane/blend_hat/` (renk ve doku yalnız `malzeme-paleti.json`'dan; Yer_Golgesi yok; AO tek kanal JPEG). Doğrulama a–g geçti (`kontrol/v04/esitleme.png`). | aynı |
| v05 | v05: kök parça bölünüşü sadeleştirildi (29 Ekim 2026): 8 → 3 parça (Giris_Holu, Govde, Kubbe). Adımlar: birleşti: Govde, Pencereler, Pilastr_Silme → Govde; birleşti: Giris_Holu, Kapi → Giris_Holu; birleşti: Kubbe, Kasnak, Cati_Etek → Kubbe. Renk, doku, AO ve toplam üçgen (8282) aynı; referanslar yeni adlara çevrildi (eksik 0). Plan `_kutuphane/blend_hat/parca_plan.json`; ayrıntı `kontrol/v05/parca_envanteri.md`, `tiklama_haritasi.png`. | aynı |
| v06 | 29 Ekim 2026. İç mekân («İçini göster» + ayrıntı), iç parçalar yalnız sunumda: `Ic_Duvarlar`, `Ic_Zemin`, `Orta_Kubbe_Sutunlar`, `Ic_Kubbe`, `Dehliz`, `Sandukalar`, `Orhan_Gazi_Sandukasi`; gruplar [[Kubbe, Ic_Kubbe], [Dehliz]]. Harita 8 282 → 8 342 üçgen; sunum 11 618 → 26 568 üçgen, 314 → 513 KB; harita v05 ↔ v06 en çok %0,063. Ayrıntı yukarıdaki v06 bölümünde. | sunum 26 568 |

Her sürümde açık/manifold olmayan kenar 0, ≥ 0,3 m çakışma 0, 8 yönden arka yüz kırmızı oranı 0 (GECTI).

## Bilinen sınırlar (v01)

- Yükseklik kaynağı yok: bütün kotlar fotoğraftan (F), plan genişliği ölçek alınarak; yöntemler `kontrol/v01/olcu_dogrulama.json` içinde.
- Sundurma saçağı fotoğraftakinden sade; çevre donatısı (tabela, saksı, anıt mezar parmaklığı) yok.
- Ağaç yaprak dokusu bazı düşey yüzlerde çizgi gibi uzuyor (ortak `agac_doku.py` eşlemesi).
- Kapı kanatlarının alt köşelerinde ince koyu üçgen (B'den kalma, onaylı).
- `kontrol/v01/kutle_havadan`, `kutle_kuzey` ve `detay_havadan` eski (kuzeybatı/kuzey) kamera çözümüyle alındı; görüntü kare gövdenin simetrisi yüzünden aynı.
