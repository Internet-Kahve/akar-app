# Yıldırım Bayezid Bedesteni · 3d üretim klasörü

Yalnız **son sürüm** tutulur. Eski sürümlerin değerleri ve kararları aşağıdaki tabloda ve `../bedesten_notlar.md` "Ek: Geçmiş kayıt" bölümündedir.

## Güncel sürüm: v06 (21 Ekim 2026)

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
