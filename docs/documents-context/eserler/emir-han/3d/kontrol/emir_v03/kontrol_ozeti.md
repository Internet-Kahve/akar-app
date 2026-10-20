# Emir Hanı v03 · son kontrol özeti (19 Ekim 2026)

Betik: `build/build_emir_v03.py` (`EMIR_ASAMA=SON`; Ulu Cami `render_v24.py` düzeni betiğin sonunda). Görseller 19 Ekim'de `build/render_emir_v03.py` ile v03 blend'inden yeniden alındı (aynı kameralar; önceki görsellerle piksel düzeyinde aynı, `kontrol_0…7` arka yüz oranı yine 0). Onaylar: A (kütle, arazi), B (revak, giriş), C (avlu, renk, figür) kullanıcı tarafından verildi.

## Teknik denetim (`kontrol_rapor.json`, `olcu_dogrulama.json`, `renkler.json`)
| Konu | Sonuç | Sınır |
|---|---|---|
| Üçgen | 16 710 (han 12 034, şadırvan + ağaç 1 256, figür 3 420) | 24 000 (17 000 / 2 500 / 4 000) ✔ |
| Draw call | 40 | ≤ 40 ✔ |
| GLB | `emir-hani_v03.glb` 156 432 B (0,156 MB); `_sunum.glb` 165 640 B; Draco açık | ≤ 1 MB ✔ |
| Açık / manifold olmayan kenar | 0 | ✔ |
| Çakışma (≥ 0,3 m) | yok | ✔ |
| Arka yüz kırmızı oranı, 8 yön | 0 | ✔ |
| Geçit açıklıklarında yabancı yüz (kuzey, güney) | 0 | ✔ |
| Ölçü (mesh'ten) | dış 46,00 × 50,00; avlu 25,50 × 25,50; kanat 10,25 / 12,25; 7 göz, adım 3,643 | ✔ |
| Sayım | 38 oda, 38 pencere (34 + 2 × 2), 2 penceresiz GD oda, 38 baca | E PDF 108–109 ✔ |
| Kaide | daire, merkez (0; 0), R 37,39 (en küçük çember 34,39 + 3), üst +4,0, alt −0,6, pah 0,15 | standart §1 ✔ |
| Figür boyu (ölçülen) | 1,59–1,76 ayakta/yürüyen; oturan 1,21 | Ulu ölçeği ✔ |

Palet sapmaları (kullanıcı «görsellere göre uyarla»): kurşun #AEB6BC, tuğla #B06A4A, korkuluk beyaz #EDEBE6 — gerekçeler `renkler.json`.

## Ulu Cami v24 hatalarının denetimi
| Ulu hatası | Emir Hanı v03 | Bakılan görsel |
|---|---|---|
| 1. Kapı kanadının çerçeveden taşması | Yok. Kapı kanadı modellenmedi (açık geçitler); oda kapıları duvardan 4 cm önde kapalı levha, çerçeve dışına çıkan parça yok | `yakin_kapi_kuzey`, `yakin_kapi_guney`, `yakin_korkuluk` |
| 2. Havuz tabanında siyah şerit | Yok. Cidar basamağa tam oturur, kenar kapağı ortak köşesiz, fıskiye tek dönel profil; şadırvan AO tabanı 0,90 | `yakin_sadirvan_taban` |
| 3. Silme köşelerinde siyah kareler | Yok. Kat silmeleri köşede üst üste binmez (D–B kısaltıldı), kemer köşelikleri ayağa 2 mm girer; köşe ayakları L biçimli | `yakin_revak_kose` |
| 4. Çeşme köşelerinde siyah noktalar | Yok. Şadırvan panoları 6 mm önde, gömülü küçük parça yok | `yakin_sadirvan_taban`, `yakin_figurler` |
| Havada parça / z-fighting | Görülmedi (çatı alt yüzü duvar tepesiyle aynı kotta; dekorlar 4 cm önde) | `havadan`, `dort_yon`, `sunum_*` |

## Fotoğrafla karşılaştırma (`yan_yana_*`)
- **havadan_vakif** (Vakıf 1983 PDF 176, Ulu Cami batı minaresinden): kütle, kırma kurşun çatı, dış çatı bandındaki baca sırası ve avlu ağaçları uyuyor. Uymayan: fotoğrafta bacalar seyrek ve dış kenara daha yakın; çevre yapılar yok.
- **guney_ulucami / dis_cephe** (1578509455 / 543): sokaktan tek kat, moloz taş, tuğla sivri alınlıklı küçük pencereler, kirpi saçak uyuyor. Uymayan: bacalar fotoğrafta daha yüksek (≈ 1,8–2 m; plan 1,2 m kullanıldı); pencere söveleri fotoğrafa göre açık renk.
- **kuzey_giris** (Emir-Hani-1): yükseltilmiş blok, tuğla kemer + alınlık, kesme taş kemer, rampa ve peykeler, levha yeri uyuyor. Uymayan: fotoğraftaki kemer daha basık; levha yazısı yok (kural gereği).
- **avlu_ici / avlu_genel** (Emir-Hani-4, emirhan-bursa-ulucami2): iki kat revak, beyaz korkuluk, şadırvan, çınar/sedir/palmiye uyuyor. Uymayan: alt kat önlerindeki tenteler, şemsiye ve masalar modellenmedi (plan §5); ağaçlar stilize.

## Görsel listesi
`havadan.png`, `ust_orto.png` (ölçü çizgili), `dort_yon.png` (üst: kuzey, doğu; alt: güney, batı), `sunum_01_guneybati` … `sunum_05_sadirvan`, `yan_yana_*` (6), `guney_revak`, `yakin_*` (revak köşesi, korkuluk, kuzey/güney kapı, geçit içi, pencere-baca, şadırvan tabanı, figürler, giriş figürleri, ağaç yaprak dokusu).

## GLB nesne adları
`emir-hani_v03.glb` (19 düğüm): Avlu_Revaklari, Bacalar, Cevre_Agac_01, Cevre_Agac_02, Cevre_Agac_03, Cevre_Agac_04, Dis_Cephe, Emir_Hani, Girisler, Han_Avlu, Olcek_Insan_01 … Olcek_Insan_08, Sadirvan.
`_sunum.glb` ek: Zemin_Kaide, Zemin_Sokak.

Hikâye ekranı adları: **Emir_Hani ✔, Han_Avlu ✔, Avlu_Revaklari ✔, Sadirvan ✔, Dis_Cephe ✔, Bacalar ✔**. v02'deki `Sacak` ve `Agaclar` artık yok: kirpi saçak `Dis_Cephe` (dış) ve `Avlu_Revaklari` (avlu) içinde; ağaçlar `Cevre_Agac_01–04`.

## Bilinen sınırlar
- Baca yüksekliği plandaki 1,2 m; fotoğraflar daha yüksek gösteriyor (kullanıcı kararı bekleniyor).
- Kuzey girişteki iç merdivenler (20'şer basamak) görünmediği için modellenmedi.
- bpy 5.2 modülünde Draco yok; sıkıştırma `gltf-transform draco` ile yapıldı (masaüstü Blender'da doğrudan çalışır).
