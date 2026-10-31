# Yıldırım Bayezid Bedesteni · 3d üretim klasörü

Yalnız **son sürüm** tutulur. Eski sürümlerin değerleri ve kararları aşağıdaki tabloda ve `../bedesten_notlar.md` "Ek: Geçmiş kayıt" bölümündedir.

## Güncel sürüm: v11 (29 Ekim 2026) · iç mekân ayrıntısı (yalnız sunum GLB'si)

v10 + ayrıntılı iç mekân. **İki dosya:** sunum GLB'si dış + iç; harita GLB'si yalnız dış (`model.json → ic_parcalar`). Dış görünüş v10 ile aynı. Betik `build/build_v11.py` → `build/doku_ic_v11.py` (dokular) → `build/build_v11_ic.py` (Blender, v10 blend'ini açar, dokunmaz) → `_kutuphane/blend_hat/uret.py`. Kontrol `kontrol/v11/` (`ic_detay.png`, `dis_esitlik.png`, `tiklama_haritasi.png`, `doku_ic_atlas.png`, `doku_zemin_tas.png`, `parca_dogrulama.json`, `ic_rapor.json`, `blend_rapor.json`).

**Kalkan gruplar:** `Kubbeler` + `Kubbe_Ici` → `Govde_Ortu`. **ic_parcalar:** `Ic_Duvarlar`, `Payeler`, `Kemerler`, `Kubbe_Ici`, `Pandantifler`, `Ic_Dukkanlar`, `Ic_Sokak`, `Kitabe`, `Sadirvan`.

| Kök parça | Ne | Ölçü | Kaynak |
|---|---|---|---|
| `Ic_Duvarlar` (yeni; Govde'den ayrıldı) | Salonun iç duvar yüzü ve 4 iç kapı ağzı; almaşık/tuğla dokusu | Karo yatayda 8,0 m; üzengi (+2,2) altı 2 sıra tuğla + 1 sıra beyaz kesme taş, üstü tuğla örgü | W: Ekinci 2025 PDF 98 («zeminden kapıların üzengi seviyesine kadar iki sıra tuğla ile bir sıra beyaz kesme taş … üç sıra tuğla ile bir sıra kırmızı kesme taş»); PDF 99 «beden duvarlarında tuğla ile taşın almaşık örgüsü»; F 02 (kemer aynasında tuğla). Fotoğrafta kırmızı taş sırası seçilmiyor; her dördüncü tuğla sırası biraz açık (**T**) |
| `Kemerler` (ad aynı) | + 18 duvar kemeri (kuzey/güney 7'şer, doğu/batı 2'şer), sıvalı alın | Alın 0,30, duvardan 0,10 önde (**T**); üzengi +5,00 | F 02, Alan Başkanlığı föyü s.8 (tuğla dolgulu duvar kemerleri, sıvalı alın) |
| `Pandantifler` (yeni) | 14 bölmede kemer üstlerinden kubbe eteği çemberine küresel köşe üçgenleri + çember kuşağı; çift yüzlü (yukarıdan sırtı görünür) | Kuşak 0,12 (**T**); çember bölmenin iç dairesi | F 02, Alan Başkanlığı föyü s.8 (sıvalı pandantif ve kuşak); W PDF 96 (açıklık 6,50–6,90) |
| `Kubbe_Ici` (yeni; Kubbeler ile kalkar) | 14 kubbenin sıvalı iç yüzü + kuşaktan eteğe kısa kasnak; yalnız içe bakar | Ø 6,70, etek +9,95 | W PDF 96, 99 (kubbe içleri sıvalı); F 02. Kubbeler'in aşağı bakan alt kapağı (14 yüz, dışarıdan görünmez) silindi |
| `Ic_Dukkanlar` (ad aynı) | 32 mahzen ağzı **bugünkü** camekân cephesiyle: yazısız tabela bandı, vitrin, altın raf sıraları, doğrama, alt panel | 2,90 × 3,30, duvardan 0,15 önde (**T**) | F 02, Alan Başkanlığı föyü s.8; W PDF 99 (2007 alüminyum doğramalar) |
| `Kitabe` (yeni) | Kelime-i Tevhid kitabesi, şadırvanın doğusundaki ayağın (x = +4,04) batı yüzünde; ön yüz fotoğraf kırpması | 0,70 × 0,33, ortası +3,90, 2 cm önde (**T**: fotoğraftaki taş sıralarına göre) | W: Ekinci 2025 PDF 85 «Kitabe günümüzde, şadırvanın doğusunda kalan ayağın batı yüzünde bulunmaktadır»; F PDF 85 Fotoğraf 2 (`ref/foto/ekinci2025_pdf085_kitabe.png`, piksel 512–1056 × 372–628; `build/doku_ic_v11/kaynak.json`) |
| `Ic_Sokak` (ad aynı) | Taş levha döşeme dokusu (sıralı dikdörtgen levhalar, üç ton, derz) | Karo 4 × 4 m | F 02; W PDF 103 (bugün mermer) |
| `Sadirvan` (ad aynı) | On iki yüzlü mermer havuz: profilli taban, yüzlerde çerçeveli panolar, üst kapak; profilli orta sütun, tas, 4 pirinç musluk | Ø 2,10 ve 0,90 v10'dan; tas +1,08–1,38 (**T**) | F: Ekinci PDF 96 Fotoğraf 3; Alan Başkanlığı föyü s.8 |

**Dokular** (kodla üretilen desen, renkler fotoğraftan ölçüldü; yazı yok): `build/doku_ic_v11/ic_atlas.jpg` (1024 × 1024, q80, 266 KB: üstte iç duvar şeridi, altta solda camekân cephesi, sağda kitabe kırpması; `Ic_Duvar` malzemesi iç duvar, camekân ve kitabede ortak) ve `zemin_tas.jpg` (512 × 512, q80, 18 KB). **Yeni renk rolleri** (`_kutuphane/malzeme-paleti.json`, kaynak bölgeleriyle): `bedesten_ic_tugla`, `bedesten_ic_derz`, `ic_zemin_tas`, `ic_zemin_acik`, `ic_zemin_koyu`, `ic_zemin_derz`, `camekan_tabela`, `camekan_vitrin`, `camekan_altin`, `camekan_taban` (F 02) ve `musluk_pirinc` (PDF 96). Yeni malzemeler: `Ic_Zemin_Tas`, `Pandantif_Siva` (krem_siva, çift yüzlü), `Sad_Pirinc`.

**Sayılar** (v10 → v11): harita 25 814 → 23 314 üçgen, 197 → 179 KB, çizim çağrısı 23 → 16, doku 6; sunum 30 950 → 64 296 üçgen, 240 → 632 KB, çizim çağrısı 36 → 40, doku 6 → 8. Dış eşitlik harita ↔ sunum en çok %0,006; harita v10 ↔ v11 en çok %0,003. Referans denetimi c, d geçti (b: üçgen ve malzeme adları bilerek değişti).

**Atlanan / belirsiz:** Ayak çevresindeki camekân dükkânları **gerçekte var** (2007'de altı ayağın çevresine eklendi; W Ekinci PDF 99, F 02) ama bilerek modellenmedi: yukarıdan koyu kutu gibi okunuyor, «altı ayak» vurgusunu ve kitabeyi örtüyordu (kullanıcıyla 29 Ekim 2026'da gözden geçirildi). Ayaklar düz kesme taş rengi; taş derzleri (F PDF 85) doku sınırı (8) yüzünden yok. kubbe içinde kalem işi yok (kaynakta yok; düz sıva). Bugünkü asma katlar, tabelalardaki yazılar, aydınlatma ve dükkân içleri modellenmedi. Taş döşeme düzeni temsili (fotoğraf eğik, levha ölçüleri **T**). Kuzey ve güney giriş mekânlarının içi ve mahzenlerin derinliği hâlâ yok. `ref/foto/ekinci2025_pdf098_duvar_dokusu.png` dosyası adına rağmen 1960 kubbe onarımı fotoğrafı; duvar dokusu için kullanılmadı.

### v10 (29 Ekim 2026) · iç mekân («İçini göster»)

v09 + iç mekân. Dış görünüş v09 ile aynı (örtü yerindeyken normal görüntü farkı %0,009). Betik `build/build_v10.py` → `build/build_v10_ic.py` (Blender, v09 blend'ini açar, dokunmaz) → `_kutuphane/blend_hat/uret.py`. Sahne `blend/bedesten_v10.blend`, uygulama `export/bedesten_v10.glb` (25 814 üçgen, 197 KB; v09: 20 088, 160 KB), sunum `export/bedesten_v10_sunum.glb` (30 950 üçgen). Kontrol `kontrol/v10/` (`icini_goster.png`, `ic_kaynak.png`, `tiklama_haritasi.png`, `parca_dogrulama.json`, `ic_rapor.json`, `blend_rapor.json`).

**Kalkan gruplar** (`model.json → ortu_gruplari`, yukarıdan aşağı): `Kubbeler` → `Govde_Ortu`.

| Kök parça | Ne | Ölçü | Kaynak |
|---|---|---|---|
| `Govde_Ortu` (yeni, kalkar) | v09'da `Dukkanlar`'a katılmış gövde çatısı levhası (+9,95 → +10,25) ayrıldı; 14 kubbenin altında kasnak ağzı | Ø 6,70 m (kubbe eteği Ø 7,40 olduğu için dışarıdan görünmez) | W: Ekinci 2025 PDF 96 «kubbe açıklıkları 6,50–6,90» (ortası) |
| `Govde` (değişti) | Kapak (+10,0) silindi; 1,50 m duvarın iç yüzü; duvar üstü halkası eski kapağın malzemesi ve UV'siyle; 4 iç kapı açıklığı | Salon iç 56,50 × 15,00; kapı 3,0 m, üzengi 2,2, tepe 3,7 | E: C2 PDF 29 «iç ölçüler 15,00 × 56,50»; kapı ölçüleri v05 dış kapı (P Gabriel geçit 3,0; yükseklik T) |
| `Payeler` | 6 kare ayak, başlıklı | 1,80 × 1,80; başlık 2,00 × 2,00, +4,75–5,00; yerleri kubbe ızgarası (x = ±4,04 / ±12,11 / ±20,18, y = 0) | P: Ayverdi 1966 planı (`ref/plan/ekinci2025_pdf097_*`) ≈ 1,75–1,80; W: Ekinci PDF 97 «restorasyondan sonra bütün ayaklar … aynı boyutta»; başlık P: Gabriel kesiti (`ref/plan/gabriel_kesit_1m_izgara.png`) +4,8–5,1 |
| `Kemerler` | Boyunda 7, enine 12 yarım daire kemer; ayak üstü dolgu; hepsi örtü altına (+9,95) kadar | Üzengi +5,00; kalınlık 1,80; kilit +8,1–8,6 (açıklığa göre) | P: Gabriel kesiti (üzengi ≈ +5,0, iç kilit ≈ +7,9–8,3, duvar üstü +10,0); F: `ref/foto/alan-baskanligi_pdf008_ic_mahzen-dukkanlar.jpg` (sıvalı yuvarlak kemerler) |
| `Ic_Dukkanlar` | 32 mahzen ağzı: kuzey ve güney duvarında 8 + giriş + 8 | Adım 3,14 m (giriş bölmesi ±3,10); açıklık 2,30 × 2,60 (T) | W: Ekinci PDF 96 «kuzey ve güney taraflarda karşılıklı 32 mahzen … 2,70 × 2,00»; P: Gabriel planı (yarım duvarda 8 mahzen, giriş bölmesi ≈ 6,2 m); F: Alan Başkanlığı föyü s.8 (bugün camekân) |
| `Ic_Sokak` | Salon döşemesi | 56,50 × 15,00; üstü +0,03 (Govde tabanından 3 cm) | W: Ekinci PDF 103 «zeminin döşemesi … mermer ile değiştirilmiştir» |
| `Sadirvan` | Merkezde on iki yüzlü havuz, ortada sütun ve tas | Ø 2,10, yükseklik 0,90 (T); tas +1,15–1,40 (T) | P: Ayverdi 1966 planında merkezde Ø ≈ 2,1 daire; W: Ekinci PDF 96 ve 102 («restorasyon sürecinde … kuzey ve güney kapılarının açıldığı merkeze»); F: Ekinci PDF 96 Fotoğraf 3 (`ref/foto/ekinci2025_pdf096_sadirvan.png`) |

Malzemeler (doku yok; renk `_kutuphane/malzeme-paleti.json`): `Ic_Duvar`, `Ic_Tas` → duvar; `Ic_Siva` (kemer, kasnak ağzı) → krem_siva; `Ic_Mermer` (döşeme, şadırvan) → mermer; `Ic_Aciklik` (mahzen ve kapı ağzı) → **yeni rol `aciklik` #3E4A55** (v05'teki dükkân açıklığı rengi). Yeni parçalarda pişmiş AO yok; yüksekliğe göre hafif köşe rengi (Ulucami v27 gibi). Kemer uçları duvara 5 cm gömülü, açıklık levhaları duvardan 6 cm önde (aynı düzlemde yüz yok).

**Belirsiz / sade bırakılan:** mahzen ağızlarının yüksekliği ve genişliği (T; bugün camekân); iç duvarlarda pencere ve duvar kemerleri yok (fotoğrafta duvar kemerleri tuğla dolgulu; modellenmedi); pandantif ve kubbe içi yok (kubbe kalkınca kasnak ağzından kemer ızgarası görünür); ayakların çevresindeki 2007 camekân dükkânları ve eski ahşap sekiler modellenmedi; ayak ölçüsü 1960 sonrası Ayverdi planından okundu (Gabriel'de ayaklar farklı boyda); kuzey ve güney giriş mekânlarının (kubbeli) içi yok; iç zemin dışarıyla aynı kotta (Gabriel kesitinde dış sokak güneyde yükseliyor, model düz).

### v09 (29 Ekim 2026)

Kök parça sadeleştirme; ayrıntı aşağıdaki tabloda.

## Güncel sürüm öncesi: v06 (21 Ekim 2026)

v05 + ortak palet ve yumuşak pişirme; geometri ve parça adları aynı. Betik `build/build_v06.py` (v05 blend'ini açar, `_kutuphane/palet_v2/` ile yalnız rengi ve pişirilmiş ışığı değiştirir; ayar `palet_v2/ayar/bedesten.json`), sahne `blend/bedesten_v06.blend`, uygulama modeli `export/bedesten_v06.glb` (yalnız yapı, Draco, 0,17 MB, 20 088 üçgen, 8 nesne), sunum `export/bedesten_v06_sunum.glb` (kaide, figür), render'lar `kontrol/v06/`. v05 blend'i silindiği için `build_v06.py`'yi baştan çalıştırmak için v05'i git geçmişinden almak gerekir.

### v05 (19 Ekim 2026)

Betik `build/build_v05.py`, sahne `blend/bedesten_v05.blend`, uygulama modelleri `export/bedesten_v05.glb` (zeminsiz, yalnız yapı: figürler 20 Ekim 2026'da çıkarıldı, bkz. `_GENEL_SAHNE_STANDARDI.md` §5.5) ve `export/bedesten_v05_sunum.glb` (kaideli, figürlü), render'lar `kontrol/v05/`. Aşağıdaki dosya tablosu ve «Bilinen sorunlar» v03 dönemindendir; v04'te giderildi.

### Dosyalar (v03 döneminin kaydı güncellendi; eski sürüm dosyaları silindi)

| Dosya | İçerik |
|---|---|
| `build/build_v05.py` | Blender üretim betiği (v03'ten türedi, v03 ve v04 dosyaları 20 Ekim 2026'da silindi); bütün ölçüler en üstte `P` sözlüğünde, kaynak harfiyle. Kütüphane: `eserler/_kutuphane/akar3d.py` |
| `build/doku/` | `almasik.png`, `kubbe_dilim.png`, `pencere.png` ve bunları üreten `doku_uret.py` |
| `blend/bedesten_v05.blend` | Sahne — **silindi** (21 Ekim 2026; yerine v06) |
| `export/bedesten_v05.glb`, `_sunum.glb` | Uygulama modeli (yalnız yapı, Draco) ve sunum (kaide, figür) — **silindi** (21 Ekim 2026; yerine v06) |
| `kontrol/v05/` | Render'lar ve kontrol raporları (v03 ve v04 `kontrol/` klasörleri silindi) — **silindi** (21 Ekim 2026; yerine v06) |

Nesneler: `Govde`, `Kubbeler`, `Cati`, `Sacak`, `Pencereler`, `Kapilar`, `Dukkanlar`, `Dukkan_Kapilari`, `Girisler`, `Gecitler`, `Ic_Bedesten_Sokagi`. Üçgen: 14 956. Eksenler +X doğu, +Y kuzey; orijin salonun ortası.

**Bilinen sorunlar (v04'te düzeltilecek, bkz. `../SONNET_REVIZYON_PLANI.md`):** gövde ile dükkânlar arasındaki açık "İç Bedesten Sokağı" ve ayrı dış halka kaynaklarla çelişir (dört planın dördü bitişik bant gösterir); 80 dükkân modülü (kaynak 56); beşik çatılı yüksek girişler (kaynak: kubbeli giriş mekânı); kubbe tepesi 13,5 (kaynak 14,20); koyu ve mavi palet; yeşil zemin diski ve pembe gölge.

## Sürüm geçmişi

| Sürüm | Tarih | Konu | Önemli değerler / karar |
|---|---|---|---|
| v01 | 16 Ekim | Kütle | Gabriel planı (P) ile dış 70,4 × 32,8; 2 × 7 kubbe |
| v01b | 16 Ekim | Kubbe yüksekliği | Kubbe dolgunlaştırıldı (tepe 13,5, F); kütle donduruldu |
| v02 | 16 Ekim | Detay, renk, GLB | Pencere, kapı, saçak, dükkân kepenkleri; kubbe dilim dokusu |
| v02b | 17 Ekim | Kaynak denetimi | Gövde 59,5 × 18,0 (E iç ölçü + P duvar), saçak +10,0 (P kesit), alçak bant +5,0 (F) |
| v02c | 17 Ekim | Dış dükkân duvarı | Almaşık doku dükkân duvarlarına |
| v03 | 17 Ekim | Sokak ve halka | Açık İç Bedesten Sokağı, ayrı dış halka (83,3 × 48), yükseltilmiş beşik çatılı girişler. 18 Ekim denetiminde kaynaklarla çeliştiği görüldü |
| v04 | 18–19 Ekim | Bitişik bant, 56 dükkân, standart palet | Ayrıntı `build/build_v05.py` başlığındaki v04 notlarında; kaide yuvarlatılmış dikdörtgen (8 m pay, köşe R 10) |
| v05 | 19 Ekim | Oval kaide, koyu kubbe (kullanıcı kararı) | Kaide yumuşak köşeli oval (süperelips n = 3), taş şeridin köşesinden 5 m pay, yarı eksenler 55,25 × 31,81 m; n = 2 elips de denendi, uçlarda fazla boşluk bıraktı. Kubbe #858D93 (ek #6B7379; F ekinci2025 pdf084 havadan 2024), gövde çatısı #9AA2A8 (v04: #AEB6BC ve #C3C9CD, çok açıktı). Bant çatısı #AEB6BC kaldı (fotoğrafta açık metal). Kubbe V 0,58 < 0,72: standart §3 «eskimiş kurşun» satırı, kullanıcı onaylı |
| v06 | 21 Ekim | Ortak palet ve yumuşak pişirme | Yalnız renk ve pişirilmiş ışık (21 Ekim 2026, ortak palet; `_GENEL_SAHNE_STANDARDI.md` §3): kurşun #BCC2C6 (kullanıcı kararı; önce #D6DADD, sonra #C3C9CD denendi; kurşun için V ≥ 0,80 ölçütü dışı), renk malzemede, köşe rengi gri AO (en koyu ≥ 0,80). Geometri aynı; yöntem `_kutuphane/palet_v2/`. Kontrol: `kontrol/v06/`. Blend eski sürümün orijinalinden `build/build_*.py` ile üretildi, GLB'ler bu blend'den dışa aktarıldı (Blender Draco; sıfır alanlı üçgenler Draco'da atılır, kabul). | — |
| v07 | 28 Ekim | Fotoğraf rengi + pişmiş AO + yer gölgesi | Fotoğraftan ölçülen renk (`_kutuphane/malzeme-paleti.json`; ölçüm `_kutuphane/RENK_OLCUM_RAPORU.md`). Köşe rengi AO'su kaldırıldı; AO ikinci UV `UV_AO`'ya pişirildi (glTF occlusionTexture, texCoord 1). Yeni `Yer_Golgesi` düzlemi (unlit, alpha blend). Geometri ve parça adları v06 ile aynı (doğrulandı). Betik `build/build_v07.py` → `_kutuphane/renk_ao_v3/`. Renk (F): Duvar #E3DDBE→#AF9A7D; Tugla #CF7F55→#8E6A4E. AO 1024 px, 0,5 + 0,5 × AO, en koyu 0.5, kullanılan ortanca 0.75. Uygulama GLB 167 → 796 KB. |
| v08 | 28 Ekim | Pastel renk geri, pişmiş AO küçük, yer gölgesi yok | 28 Ekim 2026 (gece). 21 Ekim pastel renkleri geri (kullanıcı: fotoğraf renkleri haritada cansız; ton ayarı web'de): her malzeme v06 sürümündeki aynı adlı malzemenin rengi ve dokusu (fark 0 ton; v06'deki köşe rengi gri AO idi, çarpılmadı). Değişen: Duvar #AF9A7D→#E3DDBE; Kitabe #E6E2D6→#F5F4F0; Tugla #8E6A4E→#CF7F55. Pişmiş AO v07'den, yeniden pişirilmedi: 512 px tek kanal JPEG q80 (182 → 38 KB). Yer_Golgesi çıkarıldı (web çiziyor). Uygulama GLB 796 → 161 KB (pastel v06: 168 KB). Geometri v07 ile aynı (Draco sıfır alanlı üçgenleri attı; kutu aynı). Betik `_kutuphane/renk_ao_v3/pastel_kucuk.mjs`. Kontrol `kontrol/v08/`. |
| v08 | 29 Ekim | Blend kaynağı eşitlendi | v08: blend kaynağı GLB ile eşitlendi (29 Ekim 2026). GLB artık Blender'dan üretiliyor: `build/build_v08.py` → `_kutuphane/blend_hat/` (renk ve doku yalnız `malzeme-paleti.json`'dan; Yer_Golgesi yok; AO tek kanal JPEG). Doğrulama a–g geçti (`kontrol/v08/esitleme.png`). |
| v09 | 29 Ekim | Parça yapısı sadeleştirildi | v09: kök parça bölünüşü sadeleştirildi (29 Ekim 2026): 8 → 4 parça (Dukkanlar, Govde, Kapilar, Kubbeler). Adımlar: birleşti: Govde, Pencereler → Govde; birleşti: Dukkanlar, Dukkan_Kapilari, Cati, Sacak → Dukkanlar. Renk, doku, AO ve toplam üçgen (20088) aynı; referanslar yeni adlara çevrildi (eksik 0). Plan `_kutuphane/blend_hat/parca_plan.json`; ayrıntı `kontrol/v09/parca_envanteri.md`, `tiklama_haritasi.png`. |
| v10 | 29 Ekim | İç mekân («İçini göster») | `Govde_Ortu` ayrıldı (kasnak ağızları Ø 6,70); Govde içi boşaldı; yeni `Payeler`, `Kemerler`, `Ic_Dukkanlar`, `Ic_Sokak`, `Sadirvan`. `ortu_gruplari` [[Kubbeler], [Govde_Ortu]]. Üçgen 20 088 → 25 814 (sunum 25 224 → 30 950); uygulama GLB 160 → 197 KB (+%24). Dış görünüş farkı %0,009. Referans denetimi c, d geçti. Kaynaklar yukarıdaki tabloda. Kontrol `kontrol/v10/`. |
| v11 | 29 Ekim | İç mekân ayrıntısı (yalnız sunum) | Harita yalnız dış (`ic_parcalar`); yeni `Ic_Duvarlar`, `Pandantifler`, `Kubbe_Ici`, `Kitabe`; `Kemerler`'e duvar kemerleri; camekân cepheleri, taş döşeme ve almaşık iç duvar dokusu; ayrıntılı şadırvan. Harita 25 814 → 23 314 üçgen, 197 → 179 KB; sunum 30 950 → 64 296 üçgen, 240 → 632 KB, doku 8, çizim çağrısı 40; ayak camekânları yok (bilerek). Dış eşitlik ≤ %0,006. c, d geçti. Kontrol `kontrol/v11/`. |

## Gece varyantı (31 Ekim 2026, v06'dan)

> **Eski sürümden üretildi:** girdi v06 (main: v11). Yeni sürümlerin gece dosyası yok; `ayar` dosyasındaki `dosya` güncellenip yeniden üretilmelidir. Mobil bütçe henüz ölçülmedi.

`export/night/bedesten_v06_night.glb` (uygulama, 0,26 MB) ve `export/night/bedesten_v06_night_sunum.glb` (0,34 MB). Sahne `blend/bedesten_v06_night.blend`, kontrol `kontrol/night/`. Üretim: `blender -b --python eserler/_kutuphane/gece/gece_uret.py -- ayar/bedesten.json hepsi` (`_kutuphane/gece/` içinden; ayrıntı `_kutuphane/gece/BENIOKU.md`). Işık köşe rengine pişirilmiş, malzemeler `KHR_materials_unlit`; parça adları ve düğüm konumları gündüzle aynı, `yaw` ve `kaydirma_m` geçerli. Duvarlar ışık geçişi için bölündü (20 088 → 35 086 üçgen). Haritaya bağlanmadı; `model.json` hâlâ gündüz dosyasını gösterir.
