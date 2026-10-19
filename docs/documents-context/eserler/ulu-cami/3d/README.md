# Ulu Cami: 3D üretim klasörü

Güncel sürüm **v23** (19 Ekim 2026). Bu klasörde yalnızca son sürüm tutulur; önceki sürümler aşağıdaki tabloda kayıtlıdır. Kaynaklar `../ref/` altında, model kararları `../ulu-cami_notlar.md` içinde.

## İçerik

- `blend/ulu-cami_v23.blend`: düzenlenebilir son sahne (dokular paketli).
- `export/ulu-cami_v23.glb`: cami, avlu yapıları, iç şadırvan, ağaçlar ve figürler (zeminsiz, Draco).
- `export/ulu-cami_v23_sunum.glb`: kaide ve avlu döşemesiyle sunum.
- `kontrol/v23/`: `olcu_dogrulama.json` (ölçüler, mesh ve arka yüz sonuçları), `renkler.json`, `havadan.png`, `v23_genel.png`, `yan_yana_*.png` (foto 095, 096, 105, 009), `minare_olcu.png`, `ust_cam_fener.png`, yakın çekimler ve `sunum_*.png`.
- `build/`: geometriyi üreten referans betikler (`akar3d.py` kütüphanesi `../../_kutuphane/` altındadır; `build/` içindeki kopya eskidir, kullanılmaz):
  - `build_v23.py`: v23'ün ana betiği (`-- A|B|C|D` aşama harfi). Dikey ölçek, minareler, palet, şebeke alpha-cutout, taç kapı mukarnası, kaide ve figür yerleşimi.
  - `v23_avlu.py`: avlu şadırvanı, mermer çeşme, iç şadırvan. `v23_cevre.py`: kaide, çınar, servi, tarh.
  - `build_v16.py`, `build_v20_kubbe_taban.py`, `build_v20.py`, `v20_cevre.py`: bina gövdesi, cepheler, kubbeler ve eski çevre (v16–v20; ayrıntı aşağıda). `doku/`: şebeke, ızgara, taş ve tuğla dokuları.

`build_v23.py` girdi olarak v22 blend'ini açıyordu; teslimden sonra v22 dosyaları silindiği için betik baştan çalıştırılamaz. Referans kod olarak kalır; çalışan sahne `blend/ulu-cami_v23.blend`.

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

v16–v20'de açık/manifold olmayan kenar, 0,3 m eşikli çakışma ve 8 yönden arka yüz kontrolleri geçti (raporlar silinen sürüm klasörlerindeydi); v23'te mesh ve arka yüz kontrolleri geçti (`kontrol/v23/olcu_dogrulama.json`). Mobil performans hiçbir sürümde ölçülmedi. Eski dosya adlarında `gpt_` öneki vardı; 18 Ekim'de kaldırıldı.

## Bilinen sınırlar (v23)

- Minare tepe kotu rölövedeki bölüm toplamından değil, alemin altındaki ince uçla birlikte 47,90 m'ye ayarlı; kaideler kısaldığı için gövde uzunlukları T (batı 19,4, doğu 24,2 m).
- Taç kapıda fotoğraftaki yan nişler yok (foto 001'de görünmüyor). Mukarnas stilize (11 sıra, 88 hücre).
- Şadırvan üçüncü bölmesi ve platform yüksekliği (0,30 m) tahmin. Kuzey/güney bölmeleri açık: ikinci giriş T.
- GLB'de şebeke delikleri alpha (BLEND); bazı görüntüleyicilerde kenar sıralaması görülebilir.
- Batı kapısında kapı kanadı sol alt kenarı çerçeveye göre hafif kaçık.
- Renk denetimi: kaide yan yüzü, 19 kubbe, minare tuğlası ve avlu taşı V < 0,72 (standart, kullanıcı kararı veya v22 onayı gereği).
- Stilize model. Kitabe yazıları uydurulmadı.
