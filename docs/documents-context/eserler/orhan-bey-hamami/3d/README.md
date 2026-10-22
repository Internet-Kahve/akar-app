# Orhan Bey Hamamı · 3d üretim klasörü

Yalnız **son sürüm** tutulur. Eski sürüm kararları aşağıda ve `../orhan-bey-hamami_notlar.md` (§1 güncel kararlar, "Ek: Geçmiş kayıt") içindedir.

## Güncel sürüm: v04 (19 Ekim 2026, kullanıcı onaylı; v03 + güney kapısı ayrıntısı)

| Dosya | İçerik |
|---|---|
| `build/build_hamam_v04.py` | Blender üretim betiği (v03 betiği + `Hamam_Giris` kapı ayrıntısı; `build_hamam_v03.py` referans kod olarak duruyor); ölçüler `P` sözlüğünde, her satırda kaynak harfi. Kütüphane: `eserler/_kutuphane/akar3d.py` |
| `build/cevre_v03.py` | Çınar ve en küçük çember (Orhan Bey Camii v06 `cevre_v06.py`'den yerel kopya) |
| `build/doku/doku_uret_v03.py` | `duvar_moloz.png`, `kasnak_almasik.png`, `kirpi.png`, `kubbe_dilim_v03.png`, `sebeke_alfa.png`, `avlu.png`, `yaprak_notr.png` (`agac_govde_notr.png`: `_kutuphane/agac_doku.py --notr`). Eski `doku_uret.py` ve karoları v02 geçmişi için duruyor |
| `build/araclar/yan_yana_hamam.py` | Bindirmeler (üst orto ↔ Ayverdi planı, doğu kesit ↔ Ayverdi kesiti ve Plan 13) ve fotoğraf karşılaştırmaları; v03 kalibrasyonu |
| `blend/orhan-bey-hamami_v04.blend` | Sahne — **silindi** (21 Ekim 2026; yerine v05) |
| `export/orhan-bey-hamami_v04.glb` | Uygulama modeli, kaidesiz, yalnız yapı (avlu döşemesi `Cevre_Doseme`, ağaç ve figürler çıkarıldı), Draco, 122 KB. Orijin = kaide merkezi — **silindi** (21 Ekim 2026; yerine v05) |
| `export/orhan-bey-hamami_v04_sunum.glb` | Kaide, güney sokak seti, çevre, ağaç ve figürlerle, 264 KB — **silindi** (21 Ekim 2026; yerine v05) |

**20 Ekim 2026:** uygulama GLB'sinden çevre (`Cevre_*`) ve insan figürleri (`Olcek_Insan_*`) çıkarıldı; bunlar yalnız `_sunum.glb`'de. Sürüm numarası değişmedi. Kural ve betik: `eserler/_GENEL_SAHNE_STANDARDI.md` §5.5, `eserler/_kutuphane/glb_temizle.mjs`. Yeni sürümde son adım olarak tekrar çalıştır.
| `kontrol/hamam_v04/` | Render'lar (kapı yakın çekimleri dahil), bindirmeler, fotoğrafla yan yana (`python araclar/yan_yana_hamam.py hamam_v04`), `kontrol_rapor.json` (GECTI), `olcu_dogrulama.json`, `renkler.json` — **silindi** (21 Ekim 2026; yerine v05) |

Çalıştırma: `/Applications/Blender.app/Contents/MacOS/Blender -b --python docs/documents-context/eserler/orhan-bey-hamami/3d/build/build_hamam_v04.py` (`HAMAM_RENDER=A,B,C` ile render seti seçilir).

Nesneler: `Hamam_Sogukluk_Erkek`, `Hamam_Sogukluk_Kadin`, `Hamam_Sicaklik` (alçak kütle), `Kubbe_Sogukluk_Erkek`, `Kubbe_Sogukluk_Kadin`, `Kubbe_Iliklik`, `Kubbe_Sicaklik`, `Kubbe_Halvetler` (8 küçük kubbe + kadın tarafı kırma damı ve parapeti), `Hamam_Giris` (güney alınlıklı blok; kapı, saçak, rozet pencere ve tabela yazıları dahil), `Hamam_Giris_Kadin`, `Hamam_Detay` (saçaklar, fenerler ve cam külahlar, pencereler, kuzey kapısı), `Cevre_Doseme`, `Cevre_Agac_01`, `Olcek_Insan_01`–`06`; sunum dosyasında ayrıca `Zemin_Kaide`, `Zemin_Set`.

Bütçe: 17 742 üçgen (v03: 14 742; fark güney kapısı, `Hamam_Giris` 1 488 → 4 488), 39 draw call; kontrol: açık/manifold olmayan kenar 0, çakışma 0, kırmızı oranı 8 yönde 0.

## Sürüm geçmişi

| Sürüm | Tarih | Konu | Önemli değerler / karar |
|---|---|---|---|
| v01 | 17 Ekim | Kütle | Çetintaş planı × 1,38 (E oda ölçüleriyle kalibre), yükseklikler Ayverdi kesiti × 1,16; erkek soğukluğu duvar 8,6 / tepe 16,2 / fener 17,2; kadın 7,5 / 14,1 (T); alçak kütle 5,6; çarşı ekleri hariç. Donduruldu |
| v02 | 17 Ekim | Detay, renk, GLB | Kuzey giriş (yuvarlak kemer, yuvarlak pencere), saçak bantları, fil gözleri. Kabul edildi; 19 Ekim denetiminde kubbe dizilimi ve giriş cephesi kaynaklarla eksik bulundu |
| v03 | 19 Ekim | Kütle, kubbe dizilimi, girişler, doku, sahne | Plan Ayverdi (40,1 px/m), batı ucu su deposu şeridinde (külhan odası çıkarıldı). Yükseklikler Ayverdi kesiti kendi çubuğuyla (v01'in × 1,16'sı hatalıydı): alçak dam 4,9, erkek saçak 7,6 / tepe 14,5 / fener 15,2; kadın saçak 8,3 (F) / tepe 13,2 (T). 12 kubbe, eyvan tonozu yok; küçük kubbelerde cam külah; kadın tarafında parapetli kırma dam. Alınlıklı giriş güneyde (web araştırması: tepeden fotoğraf, Flickr, TDV), kuzeyde düz cepheli kapı; +3,3 m güney sokak seti. Moloz / almaşık / kirpi dokuları, daire kaide R 27,5, 6 figür, 1 ağaç |
| v04 | 19 Ekim | Güney giriş kapısı ayrıntısı (kullanıcı isteği; kullanıcı onayladı; v03 blend, GLB ve kontrol dosyaları silindi) | `build/build_hamam_v04.py` = v03 + yalnız `Hamam_Giris` kapı ayrıntısı (F Levha 90–91, Aydın 2017 foto 33): oval rozet pencere (cam 0,90 × 0,54, radyal tuğla halka, ferforje şebeke), süt beyazı cam saçak (3,7 × 0,95 m, duvarda 3,50 / önde 3,28) + 4 ferforje konsol + kıvrımlı friz, siyah kasalı camlı kapı ve ışınsal tepe camı, «ESKİ AYNALI ÇARŞI» tabelası (altın harf, mesh) ve «↓ COVERED BAZAAR ↓» kırmızı levhası, iki duvar feneri, üzengi taşları, sağda boş metal levha (yazısı okunmuyor). Harfler `Hamam_Giris` içinde, nesne adları değişmedi. 17 742 üçgen (`Hamam_Giris` 1 488 → 4 488), 39 draw call, GLB 252 KB; kontrol GECTI. Render ve karşılaştırmalar `kontrol/hamam_v04/` (yeni: `guney_kapi_yakin`, `guney_rozet_yakin`, `yan_yana_guney_kapi_foto33`, `yan_yana_guney_rozet_L91`) |
| v05 | 21 Ekim | Ortak palet ve yumuşak pişirme | Yalnız renk ve pişirilmiş ışık (21 Ekim 2026, ortak palet; `_GENEL_SAHNE_STANDARDI.md` §3): kurşun #BCC2C6 (kullanıcı kararı; önce #D6DADD, sonra #C3C9CD denendi; kurşun için V ≥ 0,80 ölçütü dışı), renk malzemede, köşe rengi gri AO (en koyu ≥ 0,80). Geometri aynı; yöntem `_kutuphane/palet_v2/`. Kontrol: `kontrol/hamam_v05/`. Blend eski sürümün orijinalinden `build/build_*.py` ile üretildi, GLB'ler bu blend'den dışa aktarıldı (Blender Draco; sıfır alanlı üçgenler Draco'da atılır, kabul). | — |
