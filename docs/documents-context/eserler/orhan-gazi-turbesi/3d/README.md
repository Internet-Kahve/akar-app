# Orhan Gazi Türbesi: 3D üretim klasörü

Güncel sürüm **v01** (19 Ekim 2026). Bu klasörde yalnızca son sürüm tutulur; sürümler aşağıdaki tabloda kayıtlıdır, kararlar ve kanıtlar `../orhan-gazi-turbesi_notlar.md` §1 ve `kontrol/v01/kontrol_ozeti.md` içinde.

## İçerik

- `build/build_v01.py`: üretim betiği. Bütün ölçüler en üstteki `P` sözlüğünde; her değerin yanında kaynak harfi (P/E/W/F/T/K). Eksenler +X doğu, +Y kuzey, +Z yukarı; orijin gövde karesinin ortası, zemin z = 0; giriş güneyde.
- `build/kontrol_v01.py`: fotoğrafla yan yana görseller ve plan bindirme (PIL; `uv run --no-project --python 3.12 --with pillow python build/kontrol_v01.py A|B|C`).
- `build/doku_uret_v01.py`: şebeke, hol camı, kurşun dikiş ve taş döşeme dokuları. Ağaç dokuları (`yaprak_*.png`, `agac_govde.png`) `../../_kutuphane/agac_doku.py doku "#3F7A5C"` ile üretilir.
- `blend/orhan-gazi-turbesi_v01.blend` (dokular paketli).
- `export/orhan-gazi-turbesi_v01.glb` (zeminsiz, figürler dahil, Draco, 0,26 MB; orijin yapı merkezi) ve `export/orhan-gazi-turbesi_v01_sunum.glb` (daire kaideli, 0,28 MB; orijin kaide merkezi).
- `kontrol/v01/`: render'lar, yan yana görseller, `kontrol_ozeti.md`, `kontrol_rapor.json`, `renkler.json`, `olcu_dogrulama.json`, `kontrol_0…7.png` (arka yüz).

Üretim (Blender 5.2): `blender -b --python 3d/build/build_v01.py`
- `OGT_ASAMA=A|B|C`: A kütle, B + detay, C (varsayılan) + renk, kaide, çevre, figür, AO.
- `OGT_TESLIM=1`: blend, iki GLB, `kontrol_hepsi`, `renkler.json`, `kontrol_rapor.json` yazar. Yoksa GLB'ler yalnız `kontrol/_tmp/` altına deneme olarak yazılır.
- `OGT_RENDER=ad1,ad2` render listesini daraltır (`none`: render yok); `OGT_ORNEK=24` Cycles örnek sayısı.
- Geçici dosyalar `kontrol/_tmp/` altında; tur sonunda silinir.

## Sürüm geçmişi

| Sürüm | Değişiklik | Üçgen |
|---|---|---|
| v01 | 19 Ekim 2026. Sıfırdan ilk sürüm (`SONNET_REVIZYON_PLANI.md` §1–§6; plan dosyası tur sonunda silindi). **Kütle (onay A):** 16,80 m kare gövde (E), saçak 8,03, içbükey metal çatı eteği, kasnak Ø 8,40 / korniş Ø 8,80, kubbe tepesi 14,30 + alem 1,20 (F), güneyde giriş holü 6,00 × 3,20 ve iki sütunçeli sundurma (F). **Detay (onay B):** 11 yuvarlak kemerli pencere (söve, kilit taşı, alfa kesmeli beyaz şebeke), dilimli kemerli mermer söveli kapı, köşe pilastrları ve silmeler, 48 konsollu kasnak kornişi; kasnakta pencere yok. **C:** cephe #E9DFC6; daire kaide (merkez 4,29; −1,56, R 20,78 = en küçük çember 17,78 + 3 m), taş döşeme + doğu ve kuzey çimi (%7,9), 4 ağaç (çınar, iki manolya, sedir), 4 figür (`akar3d.insan`), vertex AO (taban 0,70; Kubbe ve Kasnak 0,85). Draw call 30 için lünet camı kaldırıldı, lento, hol döşemesi ve kilit taşı ortak malzemeye geçti. Köşe pilastrları L biçiminde iki ince kutu (gömülme ≤ 2 mm). Arsiv havadan fotoğraflarının kamera çözümü doğuya döndürüldü (bkz. notlar §1). Draw call 30, GLB 0,26 / 0,28 MB, şebeke alphaMode MASK. | 10 642 |

Her sürümde açık/manifold olmayan kenar 0, ≥ 0,3 m çakışma 0, 8 yönden arka yüz kırmızı oranı 0 (GECTI).

## Bilinen sınırlar (v01)

- Yükseklik kaynağı yok: bütün kotlar fotoğraftan (F), plan genişliği ölçek alınarak; yöntemler `kontrol/v01/olcu_dogrulama.json` içinde.
- Sundurma saçağı fotoğraftakinden sade; çevre donatısı (tabela, saksı, anıt mezar parmaklığı) yok.
- Ağaç yaprak dokusu bazı düşey yüzlerde çizgi gibi uzuyor (ortak `agac_doku.py` eşlemesi).
- Kapı kanatlarının alt köşelerinde ince koyu üçgen (B'den kalma, onaylı).
- `kontrol/v01/kutle_havadan`, `kutle_kuzey` ve `detay_havadan` eski (kuzeybatı/kuzey) kamera çözümüyle alındı; görüntü kare gövdenin simetrisi yüzünden aynı.
