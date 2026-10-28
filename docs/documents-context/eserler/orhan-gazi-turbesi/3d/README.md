# Orhan Gazi Türbesi: 3D üretim klasörü

Güncel sürüm **v02** (21 Ekim 2026; v01 blend, GLB ve kontrol dosyaları **silindi**). Bu klasörde yalnızca son sürüm tutulur; sürümler aşağıdaki tabloda kayıtlıdır, kararlar ve kanıtlar `../orhan-gazi-turbesi_notlar.md` §1 ve `kontrol/v01/kontrol_ozeti.md` içinde.

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

Her sürümde açık/manifold olmayan kenar 0, ≥ 0,3 m çakışma 0, 8 yönden arka yüz kırmızı oranı 0 (GECTI).

## Bilinen sınırlar (v01)

- Yükseklik kaynağı yok: bütün kotlar fotoğraftan (F), plan genişliği ölçek alınarak; yöntemler `kontrol/v01/olcu_dogrulama.json` içinde.
- Sundurma saçağı fotoğraftakinden sade; çevre donatısı (tabela, saksı, anıt mezar parmaklığı) yok.
- Ağaç yaprak dokusu bazı düşey yüzlerde çizgi gibi uzuyor (ortak `agac_doku.py` eşlemesi).
- Kapı kanatlarının alt köşelerinde ince koyu üçgen (B'den kalma, onaylı).
- `kontrol/v01/kutle_havadan`, `kutle_kuzey` ve `detay_havadan` eski (kuzeybatı/kuzey) kamera çözümüyle alındı; görüntü kare gövdenin simetrisi yüzünden aynı.
