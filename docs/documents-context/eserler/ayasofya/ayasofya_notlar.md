# Ayasofya · 3D notları (Adım 1)

_Hazırlayan: Claude · 2026-10-12 · durum: **tasarım sorumlusunun onayını bekliyor** (henüz modelleme yok)_

Kısaltmalar: **B‑D ekseni** = binanın kendi ekseni (narteks → apsis). Bu notta "doğu / batı / KD / GB" gibi
yön adları, aksi yazılmadıkça **binanın kendi geleneksel yönleridir** (apsis = "doğu"). Gerçek pusula yönleri için §4'e bakın.

---

## 1. Kaynak envanteri (89 dosya)

| Grup | Dosyalar | Ne işe yarar |
|---|---|---|
| **Gerçek fotoğraf, gün ışığı** | 62, 66 (=68, aynı dosya), 69, 70, 71 | Renk paleti ve oranlar. 62/66/69/70 hepsi yaklaşık **güney/güneybatıdan**: solda iki batı (Sinan) minaresi, sağda tuğla GD minaresi. 71 duvar ve payanda yakın çekimi. |
| **Gerçek fotoğraf, havadan (iStock)** | 72, 73 (=77, aynı dosya), 74, 75, 76, 78, 79, 80, 81 | Çatı yerleşimi, külliye yapıları, meydan. **Yalnızca referans**: filigranlı, uygulamaya giremez. |
| **Planlar** | 64 (şematik, TR etiketli), 65 (= Wikimedia "Aya Sophia Floor Plan.svg", numaralı lejant), 67 (PlanetWare, **30 m ölçek çubuklu**) | Oranlar için ana kaynaklar 65 ve 67. 67'deki ölçek çubuğuyla ölçtüklerim OSM ile ±2 m içinde tutuyor (§3). |
| **Kesit** | 63 (B‑D boyuna kesit, 19. yy gravürü, apsis tarafı kesik) | Yükseklik oranları: kubbe, yarım kubbeler, galeri katı. Ölçek yok; kubbe çapı ölçek alınarak oranlandı. |
| **3D market modeli A**: dokulu, kırmızı sıva | 1–11 | Cephe görünümleri (1 batı, 2/8/10/11 yan cepheler), havadan (4, 7), detay (3, 5, 6). **Yalnızca referans.** |
| **3D market modeli B**: gri/pembe, külliyeli | 12–36, 54, "SS 6.45.07" (Navtrex) | Türbeler, sıbyan mektebi, avlu duvarları, payanda kütleleri. Kütle okuması için en iyi model. **Yalnızca referans.** |
| **Model B'nin wireframe görüntüleri** | 37–52; 53 = UV atlas | Poligon yoğunluğu fikri verir (bizim bütçemizin çok üstünde). 42 üstten görünüm. |
| **Yontulmuş gri model** | 55–61 (57 üstten) | Kütle sadeleştirme örneği. "Yandex 3D" görünümüne en yakın referans bu. |
| **Pembe kil model ekran görüntüleri** | SS 6.30.44 → 6.31.37 (8 adet; 6.31.20 üstten) | Kütle sadeleştirme örneği. |

### Elimizde olan görünümler / eksikler
- ✅ **Güney cephe** (fotoğraf): bol (62, 66, 69, 70).
- ✅ **Üst / havadan**: plan 65 ve 67, havadan fotoğraflar, model üst görünümleri (42, 57, SS 6.31.20).
- ✅ **B‑D kesit**: 63.
- ⚠️ **Kuzey cephe**: gerçek fotoğraf **yok**, yalnızca 3D modeller var.
- ⚠️ **Doğu / apsis cephesi**: gerçek fotoğraf **yok**. Havadan 76 ve 80'de uzaktan kısmen görünüyor.
- ⚠️ **Batı / narteks cephesi**: yerden gerçek fotoğraf **yok**. Yalnızca model 1 ve havadan 74 ile 78 var.
- ⚠️ **Minare yakın çekimi**: ayrı fotoğraf yok. 69 ve 70'te şerefe ile külah yeterince okunuyor.
- ❌ **Enine (K‑G) kesit**: yok.
- ❌ **Ölçülü cephe çizimi**: yok.

İstenirse eklenebilecekler: kuzey cephe ve apsis cephesinden birer gün ışığı fotoğrafı, bir de K‑G kesit.

---

## 2. Temel ölçüler (her sayının kaynağı yanında)

Kaynak kısaltmaları:
- **[EN‑WP]** en.wikipedia.org/wiki/Hagia_Sophia (2026-10-12'de okundu)
- **[TR‑WP]** tr.wikipedia.org/wiki/Ayasofya
- **[OSM]** OpenStreetMap `building:part` geometrileri (way 109862851 ve çevresi; ODbL). OSM yükseklik etiketleri haritacıların tahminidir, bu yüzden hepsi **doğrulanmadı**.
- **[P67]** 67.jpg planında 30 m ölçek çubuğuyla benim ölçümüm (±1–2 m)
- **[K63]** 63.jpg kesitinde, kubbe çapı = 32 m kabul edilerek benim ölçümüm
- **[DHA]** dha.com.tr, 27.04.2026, VGM açıklaması

| Ölçü | Değer | Kaynak | Durum |
|---|---|---|---|
| Ana kubbe çapı | 32,6 m | [EN‑WP] gövde metni ("32.6 metres in diameter") | ✔ |
|  | 31 m (dış) | [EN‑WP] bilgi kutusu | ✔, kaynaklar arası fark var |
|  | iç çap 30,80–32,6 m (kubbe deforme, iki eksen) | [TR‑WP] | ✔ |
|  | 33,0 m (poligon) / ~32 m | [OSM] / [P67] | çapraz kontrol |
|  | **→ Modelde 32 m** | — | öneri |
| Kubbe tepe yüksekliği (iç, zeminden) | 55,6 m | [EN‑WP], [TR‑WP] | ✔ |
| Kubbe tepe yüksekliği (dış, alem hariç) | ~58 m | [K63] | **doğrulanmadı** |
|  | 56 m | [OSM] | **doğrulanmadı** |
| Kubbe eteği / kasnak üstü (dış) | ~40–43 m | [OSM] min_height 40, [K63] ~43 | **doğrulanmadı** |
| Kubbe kasnağı pencere sayısı | 40 pencere, 40 kaburga | [TR‑WP] | ✔ |
| Yarım kubbe çapı (doğu, batı) | ana kubbeyle aynı çap | [EN‑WP] ("identical diameter to the central dome") | ✔, ama sayı yok |
|  | 33 m poligon, tepe 39 m, etek 23 m | [OSM] | **doğrulanmadı** |
| Yarım kubbe merkezleri arası mesafe | 37,1 m | [OSM] | **doğrulanmadı** |
| Küçük yarım kubbeler (eksedra, 4 adet) | ~12,5 m çap, tepe ~30 m | [OSM] | **doğrulanmadı** |
| Apsis yarım kubbesi | ~12,5 m çap, tepe ~30 m | [OSM] | **doğrulanmadı** |
| Ana gövde (narteks hariç) | 77,6 × 75,3 m | [OSM] (bina ekseninde ölçüldü) | **doğrulanmadı** |
|  | ~75 × 76 m | [P67] | çapraz kontrol |
| Ana gövde + narteks + dış narteks | ~100 × 75 m | [OSM] + [P67] | **doğrulanmadı** |
|  | "100 × 70 m" | [TR‑WP] | ✔ |
|  | 82 × 73 m | [EN‑WP] bilgi kutusu | ✔, tanımı belirsiz |
| Gövde saçak / galeri çatısı | 25 m, orta blok 31 m, timpan duvarları 36 m | [OSM] | **doğrulanmadı** |
| Narteks çatısı / dış narteks çatısı | 25 m / 9 m | [OSM] | **doğrulanmadı** |
| Payanda sayısı | 24 (Bizans ve Osmanlı karışık) | [TR‑WP], [EN‑WP] | ✔ |
| Payanda ölçüleri | — | yok | **doğrulanmadı** |
| Batı minareleri (KB + GB, Selim II / Mimar Sinan) | 60 m (her biri) | [EN‑WP] ("Both are 60 m in height") | ✔ |
| KD minaresi (ince, taş) | 65 m | [DHA] (VGM açıklaması) | ✔ |
| GD minaresi (tuğla) | — | yok | **doğrulanmadı** (fotoğraflarda batı minarelerinden kısa görünüyor) |
| Minare yükseklikleri (hepsi) | 72 m | [OSM] | **güvenilmez**: dördü de aynı, yer tutucu |
| Minare gövde çapı (kaide) | ~3,6–4,1 m | [OSM] | **doğrulanmadı** |
| Sıbyan Mektebi yüksekliği | 12 m | [OSM] | **doğrulanmadı** |
| Türbeler | Selim II 16 m; Murad III ve Mehmed III 17 m | [OSM] | **doğrulanmadı** |

**Minare atribüsyonu (anlatı için önemli):**
- **KD minaresi**: [EN‑WP] II. Bayezid diyor; [DHA] son halini Selim II dönemine bağlıyor. Kaynaklar çelişiyor.
- **GD tuğla minare**: [EN‑WP] Fatih ya da II. Bayezid dönemi diyor. Bir TR ansiklopedi yazarı Sinan'a bağlıyor. **Tartışmalı.**
- **Batı çifti**: Selim II / Mimar Sinan ([EN‑WP]).

---

## 3. Renk paleti (gün ışığı fotoğraflarından ölçülen medyan renkler)

Örnekler 62, 69 ve 70'ten (gün ışığı), zemin 74'ten alındı. 69 akşamüstü ışığında çekildiği için turuncuya kaçıyor, ağırlığı düşük tutuldu. Değerler düz boya rengidir; ışık ve AO ayrıca bake edilecek, bu yüzden hafif açık tutuldu.

| Rol | Ölçülen | **Önerilen hex** | Not |
|---|---|---|---|
| Duvar (sıvalı gövde, somon‑pembe) | 70 #e7bba5, #f4cbb4 · 62 #d3c0ba · 69 #e4c09b | **#E2BEA8** | Ana renk |
| Payanda (taş, hafif sarı) | 70 #e7d0b9 | **#E3CDB5** | Gövdeden ayrışsın diye |
| Kubbe ve yarım kubbe (kurşun) | 69 #d0dde7 · 70 #d3dce1 · 62 #e4e4e5 | **#D3DBE0** | Açık, hafif mavi gri |
| Kasnak (pencereli koyu bant) | 69 #6c6f71 · 70 #4e5e6d | **#5A646D** | Kubbeyi gövdeden ayırır, uzaktan okunuyor |
| Alt çatılar (kurşun) | 69 #b5b7ba, #c1c4c9 · 70 #c8d4dc | **#C3CBD1** | |
| Minare taşı (KD, KB, GB) | 70 #f2e4d3 · 62 #d5d1ca · 69 #f6daae | **#E6DCCD** | |
| Minare tuğlası (GD) | 70 #e3a478 (güneşli) · 69 #f58d49 (akşam) | **#C8805A** | Benim ayarım: güneşli ölçüm koyulaştırıldı. **Onay lazım.** |
| Minare külahı (kurşun) | 70 #7a8b9a · 69 #858789 | **#7E8892** | |
| Timpan kemer içi (kırmızı vurgu) | 69 #952d1e · 62 #8f4039 | **#92362B** | İsteğe bağlı, cue vurgusu için de iyi |
| Alem (altın) | ölçülmedi | **#D4A938** | **doğrulanmadı**, fotoğraf izlenimi |
| Zemin (meydan taşı) | 74 #aba8a7 | **#B4B0AA** | |

---

## 4. Gerçek yönelim

- **Bina ekseni** (narteks → apsis, yarım kubbe merkezleri arası): **122,7°** (DGD yönü). Kaynak: [OSM] building:part 776067031 → 776067030.
- Çapraz kontrol: 67.jpg planındaki kuzey oku ≈ 120° veriyor. 64 (≈135°) ve 65 (≈140°) şematik oklar daha kaba, onları kullanmıyorum.
- Not: Kıble İstanbul'dan ~151°. Mihrabın eksenden sağa kaydırılmış olmasının nedeni bu açı farkı. Planlarla uyumlu.
- **Ana kubbe merkezi**: 41.008524 K, 28.980054 D [OSM].
- **Blender karşılığı**: B‑D eksenini önce +X boyunca modellersem, binayı **Z ekseninde −32,7°** döndürmek gerekir (+Y = gerçek kuzey).
- ⚠️ **"Dört köşe" adları ile gerçek yönler aynı değil.** Bina ~33° dönük olduğu için geleneksel adlarla pusula yönleri şöyle eşleşiyor:

| Geleneksel ad | Gerçek konum (ana kubbeden) | Bina eksenindeki yeri (u = apsise doğru, v = "kuzeye") |
|---|---|---|
| KD minaresi | **doğuda** | u +52,5, v +39,2 |
| GD minaresi (tuğla) | **güneyde** | u +42,7, v −33,4 |
| KB minaresi | **kuzeyde** | u −53,7, v +39,9 |
| GB minaresi | **batıda** | u −54,0, v −32,6 |

Türbeler, Sıbyan Mektebi ve Şadırvan hepsi binanın "güney" (v−) tarafında, bahçede:

| Yapı | Bina eksenindeki yeri | Boyut |
|---|---|---|
| Türbe Selim II | u +12, v −71 | ~21 × 29 m (revakla) |
| Türbe Mehmed III | u +34, v −78 | |
| Türbe Murad III | u −6, v −86 | |
| Şehzadeler Türbesi | u −16, v −78 | ~9 m |
| Sıbyan Mektebi | u −39, v −91 | ~11 × 11 m |
| Şadırvan | u −63, v −67 | |

(Bu konumların hepsi [OSM] kaynaklı, ±1–2 m.)

---

## 5. Önerilen parça listesi (onay bekliyor)

| Ad | İçerik | Tahmini üçgen (Normal) |
|---|---|---|
| `Zemin` | Plinth / döşeme levhası (gövde + bahçe + türbeler) | 50 |
| `Avlu` | Bahçe çevre duvarları ve giriş tarafı alçak duvarlar. **Öneri:** Ayasofya'da klasik revaklı avlu yok, "Avlu" = güney bahçe ve çevre duvarı | 300 |
| `Merkez` | Gövde blokları, galeri çatıları, K‑G timpan duvarları, merdiven kuleleri | 1 500 |
| `Kubbe_Ana` | Kasnak (40 pencere dişi) + kubbe + alem | 1 200 |
| `Kubbe_Yarim_Dogu` / `Kubbe_Yarim_Bati` | Büyük yarım kubbeler | 2 × 400 |
| `Kubbe_Kucuk_KD` / `_KB` / `_GD` / `_GB` | 4 eksedra yarım kubbesi | 4 × 150 |
| `Kubbe_Kucuk_Apsis` | Apsis yarım kubbesi | 150 |
| `Payanda_Kuzey` / `_Guney` / `_Dogu` / `_Bati` | 24 payanda, cephe başına tek mesh | 4 × 300 |
| `Narteks` | İç ve dış narteks birlikte | 400 |
| `Minare_1` … `Minare_4` | Kaide, gövde, şerefe(ler), külah, alem | 4 × 600 |
| `Turbe_Selim2`, `Turbe_Murad3`, `Turbe_Mehmed3`, `Turbe_Sehzadeler` | Sekizgen/altıgen gövde + kubbe | 4 × 400 |
| `Turbe_Mustafa1_Ibrahim` | Eski vaftizhane, gövdenin GB köşesine bitişik | 300 |
| `Sibyan_Mektebi` | | 300 |
| `Sadirvan` | | 300 |
| **Toplam** | | **≈ 12 300** (≤ 15 000; ~2 700 yedek) |

**Minare numaralandırması (önerim, kronolojik):**
- `Minare_1` = GD tuğla (Fatih / II. Bayezid, tartışmalı)
- `Minare_2` = KD ince taş (II. Bayezid; 65 m)
- `Minare_3` = KB (Selim II / Sinan, 60 m)
- `Minare_4` = GB (Selim II / Sinan, 60 m)

---

## 6. Açık sorular (tasarım sorumlusu)

1. **Parça listesi**: yukarıdaki yeni adlar (`Kubbe_Kucuk_*` son ekleri, `Payanda_<cephe>`, `Turbe_*` adları, `Kubbe_Kucuk_Apsis`) uygun mu?
2. **Payandalar**: cephe başına 4 mesh mi, yoksa cue için tek tek mi (`Payanda_01`…`24`)? Tek tek olursa üçgen bütçesi aynı kalır ama obje sayısı artar.
3. **Orijin noktası**: talimat "footprint merkezi" diyor. Gövde + narteks merkezi, ana kubbe ekseninin ~9 m batısına düşüyor. Cue kameraları için **ana kubbe ekseni** daha temiz olur. Hangisi?
4. **Kapsam**: türbeler ve sıbyan mektebi dahil edilirse zemin ~150 × 140 m'ye çıkar ve telefonda bina küçük görünür. Hepsi dahil mi, yoksa yalnızca Selim II türbesi + Sıbyan + Şadırvan mı?
5. **Tuğla minare rengi** #C8805A ve **iki minare atribüsyonu** (KD, GD): anlatıda hangi versiyonu kullanacağız?
6. **Eksik görünümler**: kuzey ve apsis cephesinden gerçek fotoğraf ekleyebilir misin?

---

## 7. Onaylanan kararlar (Adım 1 sonrası, tasarım sorumlusu)

- Parça adları onaylandı. Cue eşleşmesi önekle: `Minare` → dördü, `Minare_2` → tek.
- Payandalar cephe başına **4 mesh** (`Payanda_Kuzey/Guney/Dogu/Bati`, her biri 6 payanda).
- **Orijin = ana kubbe ekseni** (OSM 41.008524 K, 28.980054 D), zemin seviyesi. +Y gerçek kuzey, bina Z ekseninde **−32,68°** döndürülmüş (köşeler dönüşten sonra pişirildi, nesne transformları identity).
- Kapsam: ana yapı + `Sibyan_Mektebi` + `Sadirvan` + `Turbe_Selim2`; diğer türbeler tek mesh `Turbe_Diger`.
- Palet onaylandı (tuğla minare `#C8805A`).

### Minare numarası ↔ konum eşlemesi

| Ad | Geleneksel konum | Gerçek pusula konumu (kubbeden) | Yükseklik | Malzeme | Kaynak / durum |
|---|---|---|---|---|---|
| `Minare_1` | GD, tuğla | **güney** | 54 m (modelde) | tuğla `#C8805A` | **doğrulanmadı**; kaynak yok, fotoğrafta batı çiftinden kısa görünüyor |
| `Minare_2` | KD, ince | **doğu** | 65 m | taş | DHA / VGM |
| `Minare_3` | KB | **kuzey** | 60 m | taş | EN‑WP (Selim II / Sinan) |
| `Minare_4` | GB | **batı** | 60 m | taş | EN‑WP (Selim II / Sinan) |

## 8. v01 kaba kütle: varsayımlar (hepsi **doğrulanmadı**, OSM tahminlerinden)

- Gövde 25 m, galeri bandı 31 m, kubbe altı blok 41 m, timpan duvarları 36 m.
- Kasnak r 18,5 m (41–46 m), ana kubbe taban r 16,5 m, yükselti 12 m → tepe 58 m, alem ~61,8 m.
- Yarım kubbeler: r 16,5 m, yay noktası 29 m, tepe 39 m, merkezleri ±19,5 m.
- Narteks 25 m, dış narteks 9 m (OSM). `Zemin` levhası 146 × 162 m kapsıyor (türbeler ve Sıbyan için pay bırakıldı).
- Payandalar şematik takoz; gerçek yerleşimleri doğrulanmadı (Batı grubu narteks uç duvarlarına yerleştirildi).
- Yarım dairesel apsis, K‑G köşe eksedraları ve küçük kubbeler v01'de yok (sonraki adımlar).

---

## 9. v02: OSM geometrisinden model (yöntem değişikliği)

**Veri / atıf:** © OpenStreetMap contributors, Open Database License (ODbL) 1.0, https://www.openstreetmap.org/copyright.
Overpass API (overpass-api.de), veri zamanı 2026-10-12T16:48:52Z. Ham yanıt: `osm_parts.json` (163 öğe: 159 way, 3 node, 1 relation).
Model orijini ve +Y kuzey: OSM koordinatları ana kubbe merkezine (41.008524 K, 28.980054 D) göre metreye çevrildi; döndürme gerekmedi.
Üretim betiği: `build_v02.py` (yeniden üretilebilir; blend'i bu betik kurar).

**Kullanılan parça sayısı: 57 OSM way** (ana bina `building:part` = 49 + türbe/Sıbyan/Şadırvan/Şehzadeler = 8) → 23 mesh.
Ana bina outline'ı (way 109862851) modellenmedi: tüm külliyeyi (~154 × 149 m) kapsayan kaba çokgen, yerine `building:part` parçaları kullanıldı.

**Dışarıda bırakılanlar:** kapsam dışı yakın yapılar (Hagia Irene çevresi 776243839–43, Bâb-ı Hümâyûn, III. Ahmed Çeşmesi, Muvakkithane 109738924, relation üyesi 776274478 ve 109864688, komşu binalar). Avlu için OSM'de veri yok (`Avlu` yok).

### Eşleme (OSM → bizim adlar)
| Ad | OSM way'ler |
|---|---|
| `Merkez` | 776020497 (0–25), 776020492 (25–31), 776020498 (24–41), 776020495/96 (25–36), 776067026/27 (3,5 m küçük kubbecikler) |
| `Narteks` | 776067034 (skillion 25 m, eğim yönü 302,9°), 776067033 (9 m) |
| `Kubbe_Ana` | 776067032 (kubbe 40→55,6), 305585921 (kasnak 40–46) |
| `Kubbe_Yarim_Dogu` / `_Bati` | 776067030 / 776067031 (tam daire kubbe → ana kubbeden dışarı bakan yarısı kesildi) |
| `Kubbe_Kucuk_KD/KB/GD/GB` | 776086649 / 776067025 / 776086648 / 776067024 (bina eksenine göre u,v işaretiyle) |
| `Kubbe_Kucuk_Apsis` | 776086647 (sekizgen, 31 m) + 776067023 (kubbe) |
| `Minare_1` GD tuğla (gerçek: güney) | 776020489 gövde + 776020481 kaide + 335371713 şerefe |
| `Minare_2` KD (gerçek: doğu) | 776020488 + 776211441 + 335371715 |
| `Minare_3` KB (gerçek: kuzey) | 776020490 + 776020482 + 335371711 |
| `Minare_4` GB (gerçek: batı) | 776020491 + 776020483 + 227758675 |
| `Payanda_*` (16 parça) | yüksekliği olmayan 776086635/37–44/46 ve 12 m'lik 776020484–87, 776067028/29; cephe = parça merkezinin bina eksenindeki yönü |
| `Turbe_Selim2` | 709381141 + kubbesi 776211439 |
| `Turbe_Diger` | 109836394 + 776211438 (Mehmed III), 109836395 + 776211440 (Murad III), 132277807 (Şehzadeler), 776086636 (Mustafa I / İbrahim, eski vaftizhane) |
| `Sibyan_Mektebi` | 109738926 |
| `Sadirvan` | 109738930 (`building=roof`; node 5663545921 ile konum örtüşüyor) |

### Kaynaklı değerlere göre yapılan düzeltmeler
| Parça | OSM | Düzeltme | Gerekçe |
|---|---|---|---|
| Ana kubbe tepe (776067032) | 56 m | **55,6 m** (`roof:height` 16 → 15,6) | EN/TR Vikipedi: zeminden 55,6 m. Fark 0,4 m; not: bu rakam genelde iç tepe olarak anılır, dış tepenin ~58 m olduğu (K63 ölçümüm) doğrulanmadı |
| `Minare_3` KB, `Minare_4` GB | 72 m | **60 m** | EN Vikipedi (Selim II / Sinan, "both 60 m"). Gövde ve şerefe z ölçeği 0,833; kaide dokunulmadı |
| `Minare_2` KD | 72 m | **65 m** | DHA / VGM açıklaması (27.04.2026) |
| Ana kubbe çapı | 33,0 m | değiştirilmedi | EN Vikipedi 32,7–33,5 aralığı ve 32,6 m ile uyumlu |

### Düzeltilemeyen / varsayılan değerler (hepsi doğrulanmadı)
- `Minare_1` tuğla: OSM'de 72 m, kaynak yok → **72 m korundu**. Dört minarenin hepsinin OSM'de aynı 72 m olması yer tutucu olduğunu düşündürüyor; üçü kaynakla çürütüldü, bu yüzden bu değer de şüpheli. Kaynak bulunana kadar işaretli.
- 11 destek/payanda bloğunda (776086635/37–44/46, 776086636) `height` yok → **12 m** varsayıldı (komşu 12 m'lik bloklarla aynı).
- 335371715 (KD şerefe): yükseklik yok → diğer üç minare gibi 50–52 m (sonra 0,903 ile ölçeklendi).
- 776067023 apsis kubbesi: yükseklik yok → taban 31 m, yükselti = yarıçap.
- 132277807 Şehzadeler: gövde 6 m + kubbe 4 m. 109738930 Şadırvan: 6 m.
- Yarım kubbe kesim düzlemi: tam daire merkezi (ana kubbeye dik, apsis yönünde). OSM daireleri tam çember olduğu için gerçek kesim yeri tahmini.

### Sayılar (Normal)
Pah 0,25 m (açı sınırı 35°) uygulandı. Toplam **5 273 üçgen** (bütçe 40 000, Hafif 12 000): Kubbe_Ana 587, Merkez 696, Turbe_Diger 901, Turbe_Selim2 345, Kubbe_Yarim_* 2 × 304, Minare_1–4 ≈ 240, Payanda_* 495, Kubbe_Kucuk_* 520, Narteks 60, Sibyan 30, Sadirvan 62, Zemin 10.

---

## 10. v03: detay turu (OSM kütlesi + referanslardan mimari formlar)

Üretim: `build_v03.py` (model) + `render_v03.py` (ışık, kamera, render). v02'deki kaynaklı düzeltmeler (kubbe 55,6 m; minareler 60/60/65 m) aynen korunuyor.
**Eklenenler OSM'de olmayan, fotoğraf/plan referanslarından türetilmiş formlardır; ölçüleri doğrulanmadı.**

| Madde | Yapılan | Not |
|---|---|---|
| Timpan kemerleri | `Merkez` kubbe altı bloğunun K ve G yüzlerine 19 m açıklıklı yarım daire kemer girintisi (1,3 m derin, içi `#92362B`) + içinde 3 sıra mavi pencere (6/5/3) | Boolean ile gerçek girinti. D ve B kemerler yarım kubbelerin arkasında kaldığı için dışta ayrı geometri yok |
| Kasnak | r = 17,8 m, 40 kemerli pencere (gerçek girinti) + aralarında 40 payanda dişi | OSM çokgeni r ≈ 19 m idi; yerine 40 kenarlı |
| Kubbe | Taban 46 m, tepe 55,6 m (kaynaklı), yükselti 9,6 m → sığ (v02'de 15,6 m). Tepede altın alem | Tepe değişmedi, yalnızca basıklaştı |
| Eksedra yarım kubbeleri | 4 adet, OSM'deki 12,5 m dairenin dışa bakan yarısı; büyük yarım kubbeye yaslanan taraf kesik | OSM tepesi 30 m galeri bandının (31 m) altında kalıp görünmüyordu → taban 29,5 m, tepe ≈ 35,7 m (**doğrulanmadı**) |
| Apsis | OSM sekizgeninin dış yarısı (yarım gövde, 31 m) + yarım kubbe, kesit yüzü kapatıldı | Kubbe yüksekliği etiketi yok (yarım küre varsayıldı) |
| Merdiven kulesi kubbeleri | OSM'nin 2 topu (776067026/27) kaldırıldı; kubbe altı bloğun 4 köşesine 4 adet sekizgen kule (41→45 m) + 2,4 m kubbe | Konum ve boyut fotoğraftan (62, 69), **doğrulanmadı** |
| Çatılar | Galeri gövdesi ve bandı: kalça (hip) çatı, 1,6 m / 1,2 m eğim; narteks: skillion kurşun; hepsi `#C3CBD1` | Kubbeler `#D3DBE0`, narteks çatısı da kurşun gri |
| Payandalar | Üst yüzey eğik (ana kütleden dışa doğru 0,5 + 0,22·h m, en çok 3 m düşer), tepe kurşun | Yükseklikleri hâlâ varsayılan 12 m |
| Pencereler | `#A8C4DE`: yüzey (yaklaşık 0,07 m dışa) kemerli pencereler gövde, galeri bandı, narteks, türbe ve Sıbyan cephelerinde; kasnak ve timpanlarda gerçek girinti | Payanda ve minare kaidesi önündekiler atlandı |
| Minareler | Batı çifti (`Minare_3`, `Minare_4`) 2 şerefe (0,54 H ve 0,70 H), `Minare_1`/`2` tek şerefe; külah 12,5 m (tuğla 14 m); tepe altın alem 2,3 m | Toplam yükseklik (alem dahil) aynı: 60 / 65 / 60 m, tuğla 72 m. Şerefe konumları görsellerden, **doğrulanmadı** |
| Işık | Güneş `#FFDBAD` benzeri sıcak (RGB 1,0/0,86/0,68), 2,5 W/m², 3,5° yumuşaklık; gök ışığı nötr-soğuk, 0,30; AO açık (fast GI) | Kubbe ve çatılar gri okuyor, zemin sıcak taş `#B4B0AA` |

**Hâlâ yok (sonraki tur adayları):** kubbe kaburgaları, yarım kubbelerde pencere sırası, payanda formlarının gerçek şekli (veri yok), D/B kemerlerin dış görünümü, Avlu, Muvakkithane, kapılar.

**Üçgen sayısı (Normal): 14 148** (bütçe 40 000). Kubbe_Ana 6 072 (pah + 40 girinti), Merkez 2 049, Turbe_Diger 1 025, Minare_3/4 634 + 634, Minare_1/2 394 + 394, Turbe_Selim2 419, Narteks 389, Kubbe_Yarim_* 360 + 360, Kubbe_Kucuk_* 134–172, Payanda_* 495, Sibyan 86, Sadirvan 62, Zemin 10.

---

## 11. v04: cephe derinliği (Yandex karşılaştırmasıyla)

Üretim: `build_v04.py`, `render_v04.py`. Karşılaştırma: `renders/v04_karsilastirma.png` (sol: `yandex-ref` #4, sağ: `Cam_Karsilastirma`, yerden ~28° yüksek, narteks tarafından).

**Yapılanlar**
- Kasnak: duvar ve dişler `#E2BEA8`, 40 mavi `#A8C4DE` kemerli pencere (girinti), 40 diş, alt ve üst silme. Kubbede 40 ince kaburga (`#C3CBD1`).
- K/G büyük kemerler: 21,6 m açıklık, 1,4 m girinti, 1,5 m genişliğinde taş arşivolt, içi duvar tonunda (kırmızı değil), 3 sıra (6/6/3) mavi pencere.
- Cephe: kat silmeleri (gövde 3 seviye, bant, kasnak, kule), pencere çevresi çerçeveleri (0,2 m çıkıntı), üst sırada kör kemerler.
- Çatılar: N/S galeri çatıları sırtlı (kenar 23,4 m, sırt 27,4 m, iç 25 m). Kubbe altı blok köşelerinde 4 belirgin merdiven kulesi (r 3,2 m, 41→47 m, kubbe + alem).
- Narteks: batı cephesinde 9 kemerli revak (2,2 m derin), 5 kapı, çerçeveler; üst katlarda 2 sıra büyük pencere.

**Karşılaştırmadan sonra aynı turda yapılan düzeltmeler**
- Narteks cephesi düzdü (3 küçük kapı) → 9 kemerli derin revak.
- Batı timpan kemeri hiç okunmuyordu → D ve B yüzlerine yarım daire kemer girintisi + arşivolt + 2 sıra pencere. Bunun için büyük yarım kubbeler 39 → 33 m'ye indirildi (OSM'den sapma, doğrulanmadı).

**Kalan farklar (Yandex ↔ AKAR)**
1. Yan yapılar: Yandex'te kuzey ve güney yüzlerde çok sayıda kademeli alçak hacim, rampa ve revak var. Bizde yalnızca takoz payandalar. OSM verisi yok.
2. Payandalar: Yandex'te kemerlere kadar yükselen iri kütleler. Bizde 12 m varsayımlı alçak takozlar.
3. Narteks üst katı: Yandex'te cephe boyunca yan yana mavi camlı kemer şeridi. Bizde ayrı küçük pencereler.
4. Renk ve ışık: Yandex'te duvarlar soluk pembe-gri, kubbe belirgin koyu gri. Bizde duvar daha doygun şeftali. Paleti değiştirmedim (onaylı hex).
5. Bağlam: Yandex'te zemin yok, harita üstünde. Bizde bej plaka. Bu bir render tercihi.

**Üçgen sayısı (Normal): 28 494** (bütçe 40 000). Kubbe_Ana 10 874, Merkez 7 793, Narteks 3 253, Turbe_Diger 1 505, Turbe_Selim2 683, Minare 394/394/634/634, Sibyan 278, Kubbe_Yarim 360 + 360, Payanda 495, Kubbe_Kucuk 134–172, Sadirvan 62, Zemin 10.

---

## 12. v05: form turu (süsleme yok; kütle, kademe, çıkıntı)

Üretim: `build_v05.py`, `render_v05.py`. Cephe adları bina eksenine göredir: **Kuzey = +v yüzü** (gerçekte KD), **Güney = −v** (GB), **Doğu = apsis (+u)**, **Batı = narteks (−u)**. Referans eşlemesi (model A, ortografiğe yakın): Kuzey 11.jpg, Güney 10.jpg, Doğu 2.jpg, Batı 1.jpg. Dosyalar: `renders/v05_cephe_{kuzey,guney,dogu,bati}.png` (ikinci geçiş), `*_ilk.png` (düzeltme öncesi).

### Kararlar
1. **Payanda kuleleri.** OSM'nin 25–36 m'lik iki uzun şeridi (776020495/96) kaldırıldı. Yerine kemerin iki yanında 4 kule: 3 kademe (7,8 × 14,3 m → 6,8 × 10,1 m → 5,6 × 5,7 m; 23,4 → 33 → 39 → 43,4 m), her kademede pencere ve kornişle, tepede 8 köşeli küçük kule + kubbe + alem (46 → 51 m). Kule iç yüzü kemer yüzeyine bitişik, kuzey ve güney yüzünde birer çift. Kaynak: kesit 63 (pier genişliği), model A 1/10/11.jpg. Ölçüler görsel orantıdan, **doğrulanmadı**.
2. **Büyük kuzey/güney kemerler.** Kesit 63: kubbe 520 px = 32,6 m → 15,95 px/m; kemer 370–870 px = 31 m açıklık, yay noktası 23,7 m, tepe 39,2 m. v04'te 21,6 m idi; tam açıklık (R 15,5 m) yapıldı.
3. **Yarım kubbe yüksekliği (karar).** Kesit 63'te yarım kubbe tepesi 285–300 px → (925−290)/15,95 ≈ **39,8 m**, yay (kemer başlangıcı) 548 px → **23,6 m**; yükselti ≈ 16 m. Bu OSM'nin değerine (23→39) çok yakındır; Yandex'teki alçak oran kullanılmadı. v04'teki 33 m geri alındı: yay 23,8 m, tepe 39,8 m. Ayrıca kesitte eksedra yarım kubbe tepeleri 450 px → 29,8 m (OSM 30 ile aynı) ve galeri çatısı çizgisi ≈ 34 m; bu yüzden eksedra kubbeleri dışarıdan büyük ölçüde çatı altında kalıyor. Görünür kalsın diye v04'teki taban yükseltmesi (29,5 m) korundu (**doğrulanmadı**).
4. **Doğu (apsis) ucu.** OSM sekizgeni + tek blok yerine plan 65/67 ve model A 2.jpg'ye göre üç kademe: A yarım elips 11 × 24 m (0–14 m, 3 büyük kemerli pencere girintisi), B 8 × 16,5 m (14–23 m, pencere sırası), C çokgen apsis (7 köşe, R 7,6 m, 23–30 m, kubbe tepesi 37 m) ve arkasında 34,5 m'lik kütle. En uç nokta u = 49,3 m (OSM 43,9). Plan 67 ölçüsüne göre apsis genişliği ≈ 14,8 m, çıkıntısı ≈ 7 m: C kademesi buna uyar; A ve B referans fotoğraf orantısından, **doğrulanmadı**.
5. **Yan hacimler.** 16 payanda/destek bloğu (10 yüksekliksiz + 6 × 12 m) kademeli: alt kademe %62, üst kademe %78 küçültülmüş, üstü uzun olanlarda tonoz, kareye yakınlarda küçük kubbe. I. Mustafa ve I. İbrahim Türbesi: sekizgen gövde 8 m, 8 çıkıntı (her biri küçük kubbeli), merkezi tambur 13 m + kubbe 5 m (plan 65 #13). Yuvarlak yapı: `Skeuophylakion` (OSM 776274478) gövde 21 m + konik çatı 26,5 m, yeni parça adı. Yükseklikler **doğrulanmadı**.

### Dikkat
- OSM'de yüksekliği olmayan parçaların yükseklikleri hâlâ varsayım (12 / 21 / 6 / 8 m).
- Doğu uç kademeleri ve kule kademeleri referans fotoğraf orantısından (ölçek yok).

### Kalan form farkları (ikinci karşılaştırma sonrası)
- **Batı:** referansta narteks ön duvarı tek parça ve yüksek (≈ 23 m), ortada iki dev kemerli pencere. Bizde 9 m'lik revak + üstünde ikinci duvar. Minare kaideleri referansta çok daha kalın ve yüksek (pyramidal taban ≈ 25 m); bizde 21–31 m OSM kaidesi ama ince.
- **Kuzey:** referansta orta kısım yarım daire konçlar halinde kat kat yükseliyor (3 kademe) ve kemer o kadar belirgin değil; bizde düz galeri bandı. Alt duvarda referansta 2 sıra × ≈ 14 pencere, bizde tek sıra.
- **Güney:** referansta türbeler/ön yapılar ana gövdeye çok yakın ve alçak; bizde OSM konumları gereği ~25 m uzakta. Orta kısımda referansta büyük girişli (kapı) kapalı kaide yok.
- **Doğu:** referansta apsis ve iki yanında simetrik çıkıntı daha geniş (lower tier ~ 60 % genişlik); bizde 48 m. Yan kanatlarda alçak revaklı yapılar yok.
- Kubbe: referansta kubbe daha basık ve koyu; bizde onaylı renk.

**Üçgen sayısı: 32 320** (bütçe 40 000). Kubbe_Ana 6 152 (v04'te 10 874; kaburgalardan pah kaldırıldı), Merkez 7 385, Narteks 3 253, Payanda_Guney 2 760, Payanda_Kuzey 2 729, Turbe_Diger 2 673, Kubbe_Kucuk_Apsis 1 569.

## 13. v06 (sade form turu — süs yok, sağır masif hacimler)

Üçgen: 20 794 (Normal bütçe 40 000). `build_v06.py`, `render_v06.py`, `ayasofya_v06.blend`.

Yapılanlar
1. N/S payanda kuleleri (4): tek parça, sağır, düz tepe (36,5 m) + sade silme, dış yüzde tek dar pencere. Kademe, pencere sıraları, küçük kubbe ve alem kaldırıldı. Küçük kubbeli kule yalnız kubbe tabanının 4 köşesinde (r 3,2 m, 41→47 m).
2. Batı timpanı: batı duvarı u=−37,2 (yarım kubbe batı ucu −34,8 + 2 m girinti payı); 23,6 m açıklıklı yarım elips kemer (21 → yay 29 → tepe 35,5 m), içinde 2 sıra pencere (5 + 7). İki yanında 2 masif kule (41,8 m). Eski çok katlı pencereli batı duvarı kaldırıldı: batıda gövde 17–17,5 m'ye indirildi, galeri bandı/platform/yamaçlar batıdan kısaltıldı (u=−20,9).
3. Narteks: dış = 9 m düz duvar + 10 kalın takoz + 5 küçük kemerli açıklık; iç = 19,5 m düz, üst katta 2 büyük kemerli pencere (7 m). 9 çıkıntılı tonoz bloğu kaldırıldı.
4. 4 eğimli köşe payandası (9 × 11 m, duvarda 17,5–20 m → dışta 4 m).
5. Pencereler: kör kemerli bölmelerde gruplu (3'lü / 2'li), kasnak dışında düz sıra yok; destek blokları tek kademe, uzun yüz başına en çok 1 pencere.
6. Renk: kubbe + tüm çatılar (minare külahı dahil) #9A9DA6, duvar #E3C3B6, payanda/kuleler/minare kaidesi krem (#E3CDB5 / #E6DCCD). Kubbe kaburga derinliği 0,35 → 0,175 m.

Kaynak/doğrulama
- Referans: model A 1.jpg, 2.jpg, 10.jpg, 11.jpg, fotoğraf 62/70, yandex_ref #2, #4. Kule, kemer, takoz, eğimli payanda ölçüleri görsel orantıdan: doğrulanmadı.
- Dış kemer açıklığı (24 m, model A 1/10.jpg) ile iç büyük kemer açıklığı (31 m, kesit 63) farklıdır: N/S kemerler kesit 63'e göre 31 m bırakıldı, batı kemeri dış görünüme göre 23,6 m; iki kaynak çelişmez ama tek kemerde birleştirilmedi.
- Batı eksedra kubbeleri (Kubbe_Kucuk_KB/GB) batı kulelerinin ve timpan duvarının gerisinde kalıyor, batıdan görünmez (gerçek binada da böyle).

## 14. v07 (yalnız doğu / apsis cephesi)

Üçgen: 21 910 (v06: 20 794). `build_v07.py`, `render_v07.py`, `ayasofya_v07.blend`. Batı, kuzey, güney cepheler v06 ile aynı (yalnız doğuda: Merkez, Payanda_Dogu, Kubbe_Yarim_Dogu, Kubbe_Kucuk_KD/GD/Apsis değişti).

Kademe sırası (aşağıdan yukarı): apsis + 2 eksedra (tepe ≈ 21 m) → büyük doğu yarım kubbesi (23,8 → 39,8 m) → ana kubbe.
- Apsis: 5 yüzlü çokgen, R 7 m, merkez u=37 (en uç 44 m; OSM 43,9), duvar 15,5 m, 3 büyük kemerli pencere (ortadaki 3 yüz), üstünde yarım kubbe (tepe 21 m).
- Eksedralar KD/GD: OSM merkezleri, R ≈ 6,3 m, kavisli duvar bandı 0→15 m, 4 küçük kemerli pencere, yarım kubbe (tepe ≈ 21 m); büyük yarım kubbeye bakan taraf kesik.
- Büyük doğu yarım kubbe: etekte yarım silindir bandı R 16 m, 0→23,8 m, 7 küçük kemerli pencere.
- Doğu bölgesinde gövde/platform/galeri bandı u=19,4'te kesildi (eskiden 38,3'e uzanıp yarım kubbeyi gömüyordu); N/S şeritler (|v| 22,7–37,8) aynen duruyor.
- Alçak arkadlı kanatlar (2): 9,5 × 6 m, 7,5 m, 5 kemerli açıklık.
- Kaldırılanlar: v05/v06 doğu A/B kademeleri (yarım elips) ve 34,5 m arka kütle.

Doğrulanmadı: tüm yükseklik ve yarıçap değerleri (yandex_ref #1/#5 ve model A 2.jpg orantısı).

## 15. v08 — yöntem değişikliği: img-ref2 (aynı modelin render'ları) esas, OSM ikincil

Blueprint (yalnız viewport, render'a girmez; koleksiyon `REF_Blueprint`, kurulum `blueprint08.py`):
- `Ref_Plan_13` (13.webp): perspektif üstten görünüş (kamera ≈330 m). 7 eşleşmeden (türbe/kuleçik/kubbe) en küçük kareler: zemin ölçeği 6,24 px/m, ana kubbe ekseni zemin noktası piksel (833, 386), rms ≈ 12 px ≈ 2 m. Kubbe halkası (z≈46) planda 231 px = 32 m çıkıyor (7,2 px/m, perspektif büyütmesi 1,16×); zemin ölçeğinde 37 m görünür — çelişki yok.
- `Ref_Bati_8`, `Ref_Dogu_4`, `Ref_Kuzey_6`, `Ref_Guney_2`: dik düzlemler, modelin arkasında (o cepheden bakınca model önde, görüntü arkada). Ölçek: kubbe halkası px / 32 m; dikey hizalama: alem ucu. Bu görüntüler perspektif; yakın kütleler (galeri, minareler) kubbe düzleminden ≈1,2× büyük görünür → düzlemler yaklaşıktır.
- 13.webp ile OSM ayak izleri (minareler, türbeler, kuleler) birebir örtüşüyor: referans model OSM planıyla kurulmuş. Farklar: orta blok (referansta ≈ 36 × 34 m, OSM 40 × 45), batı eksedraları (referansta u≈−22…−25, v≈±25; OSM v≈±14).

Batı referans kamerası (8.webp) 5 denklemle çözüldü: galeri tabanı (y 955), kasnak tabanı z=40 (y 380), alem ucu (y 197), kubbe halkası 32 m = 265 px, W minare aralığı 72,5 m = 708 px → kubbe eksenine 219,3 m batıda, 155,6 m yükseklikte, 32,3° aşağı, f = 2020 px. Bu kamerayla render ile referans bindirilince kubbe, W minareler ve galeri oturuyor (renders/v08_bati_karsilastirma.png). Çözümden alem ucu z ≈ 63,9 m çıktı (modelde 59,8).

Batıda yapılanlar (v06–v07'deki batı timpanı/kuleleri/alçaltma geri alındı — ref 8, 31, 29, 7'de timpan yok, yarım daire lünet var):
1. Gövde 23,4 m / platform 25 / bant 25–31 m batıya (u −39,3) kadar (OSM). Bant batı yüzünde kurşun çerçeveli yarım daire lünet (9,4 m, 25→29,7 m).
2. Batı yarım kubbe yay 23 → tepe 39 m (OSM min 23 / h 39), bant (31 m) arkasından görünür: etekte 8 m'lik başlık; ref 8'deki başlık genişliği (≈26 m) ile uyumlu.
3. Batı eksedraları (KB/GB): referans konumuna (u −25, v ±24,7) taşındı; kasnak 23,4→25,4 + kubbe, tepe 30 m (OSM h=30).
4. Narteks: iç = OSM skillion 21 → 25 m; batı yüzde 2 sıra kemerli pencere (alt 11,2–14,4; üst 15,8–19), payandalar arası gruplu. Dış = 9 m revak, payandalar arası kemerli açıklıklar (3,6 m).
5. 6 payanda (OSM 12 m): duvar ucunda 18,3 → dış uçta 12 m, tepe dışa doğru iner. (ref 8/31'de 4 orta payanda net; uçtaki 2 ek OSM'den.)
6. Kaideler: gövde taş (krem) + piramit; yanlarında 4 taş kütle (17 / 14,5 m) — ref 7/29'daki gömülü görünüm.
7. Kuleler: OSM şerit konumları (u −19,5…−11,8 ve 10,4…18,1; v 22,7…37,4/−36,2), 36 m — v05–v07'de ≈4,5 m dışarıdaydı. N/S kemer açıklığı buna göre 22 m'ye indirildi (kesit 63'ün 31 m'si iç ölçü).
8. 2 batı kuleciği (−35,6; ±10,3; r 1,7): silindir 29,8→34 + kubbe → 36 m.

Referansta var, modelde farklı / sorular: bkz. rapor (minare boyu 72 m ↔ kaynaklı 60 m; kaide ≈10 m ↔ OSM 7,5 m; kule rengi tuğla; kasnak çapı).

## 16. v09 — güney cephesi (img-ref2: 2, 27, 10, 25, 30, wf1/wf2); türbe/şadırvan/sıbyan değişmedi

tasarım sorumlusu kararları (v08 sonrası): minare boyu 60 m kaynaklı kalır; Sinan minareleri ref kalınlığında; tuğla kuleler duvar tonu, krem yalnız taş kütlelerde; kasnak çapı en sona.

Ref 2 kamerası (18 denklem: alem ucu, 4 minare ucu, 3 türbe kubbesi, kubbe halkası uçları; en küçük kareler, rms ≈ 7 px): konum yerel (−18,4; −202,9; 45,9), yaw −6,35°, pitch 21,7° aşağı, f = 1457 px, asal nokta (482; 992) px. Çözümden uç yükseklikleri: Sinan çifti ≈78 m, tuğla ≈68, KD ≈66 (alem dahil) — kaynaklı 60/72/65 ile farklı; karar gereği 60 m kaldı (ref'te minareler bu yüzden uzun görünür).

Yapılanlar:
1. Minare_3/4: gövde Ø 4,1 → 6,2 m, kaide 7,5 → 10,4 m, şerefe oranlı.
2. Kuleler: duvar tonu (#E3C3B6), zeminden 36 m, güney yüzde madalyon; güney yüzü v −34,5 (OSM −36,2; plan 13 ≈ −33).
3. Güney timpan: 22 m açıklık, 2 sıra pencere (7 küçük + 3 büyük).
4. Kemerin altında 2 tonozlu koy (11 × 9 m; güneye bakan 8,6 m'lik büyük kemerli pencere, altında 3 küçük pencere) + her koyda küçük kubbe (Ø 7,4; tepe ≈29,7 m).
5. Güney kanat 25 → 15 m (ref 2/27/10: kutu değil, güneye inen çatılar); güney yüzdeki bölme grupları kaldırıldı.
6. Güney eksedralar (GB, GD): ref konumlarına (−25; −24,7) ve (28; −25,5), kasnak 15 m'den, 2 sıra pencere, tepe 30 m.
7. Destek blokları (OSM 776086639–42): tepesi güneye inen çatılı kütleler (16–20 → 9–11 m); 639 ince taş levha.
8. SW alçak ek yapılar (OSM'de yok): tuğla bina (u −76…−58; v −44,5…−23,5), revak, 3 basamaklı teras (u −54…−40; v −60…−47).

Referansta net görülmeyen / doğrulanmadı: SW ek yapı sınırları ve revak direk sayısı; koy derinliği (8,9 m); güney kanat yüksekliği (15 m, ref kanadın tepe çatı çizgisinden); destek blok yükseklikleri; madalyon boyu.

## 17. v10 — kuzey cephesi (img-ref2: 6, 32, 12, 5, 7); türbe/şadırvan/sıbyan değişmedi

tasarım sorumlusu kararları (v09 sonrası): kaide 10 m (6 m gövde içindi); revak 7 direk ve güney kanat 15 m kalır — DOĞRULANMADI; koyların güney yüzü iki sıra pencere; güney timpanın altında iki büyük kemerli pencere; Minare_1 eski incelik, rengi biraz açık tuğla.

Ref 6 kamerası (12 denklem; en küçük kareler, rms ≈ 4,5 px): konum yerel (8,7; 269,4; 20,0), yaw 187,4° (−v yönü), pitch 13,4°, f = 2261 px, asal nokta (995; 1256) px. Minare uç yükseklikleri güney çözümünden alındı (Sinan 78, tuğla 67,7, KD 66 m; alem 63,9) — çözümün öz-tutarlılığı güney ve batı çözümleriyle uyuşuyor.

Güneyde düzeltmeler: koylar (K ve G): büyük kemerli pencere z 11,7–22,6 m (9,6 m açıklık, ızgaralı), altında lünet (3,8–8,6) ve 3 küçük pencere; duvar 22,9 m; küçük kubbe tepesi 31,7 m. Minare_1: geometri v05'ten beri değişmedi (OSM gövde ≈3,5 × 3,7 m; kalınlaştırma yalnız Minare_3/4); renk #C8805A → #D9A084.

Kuzeyde:
1. Kanat 23,4 → 17 m; kemer/koy şeridi (u −11,8…10,4) kanat gövdesinden boş (güneyde de uygulandı).
2. Koylar (2) + küçük kubbeler: güneydeki ile aynı (v 31,6).
3. Yanal tonozlu tuğla koylar: u 22,7…36 ve −30,5…−20,5; yüzde 4 sıra × 3 kemerli pencere; tonoz tepesi ≈19,7 m.
4. Taş payandalar (OSM 776086646/44/43): tepesi dışa inen çatılı kütleler (17,5/17 → 9/10 m); 643 ince levha (u −0,2…3,0).
5. Kuleler: kuzey yüzü v 35 (plan 13: ≈35), madalyon K+G.
6. KD eksedra (28; +25,5) — GD ile simetrik; doğu yığını (v07) doğu turunda yeniden kurulacak.
7. Skeuophylakion: taş sekizgen, kubbeli, 9 m + 3,8 m (ref 6/5/12); konum plan 13'ten (43,5; 46), OSM 776274478 (30,2; 50,4) ile ≈13 m farklı.

Doğrulanmadı / sorular: NE kaide çevresi taş kütleler (ref 6'da görünüyor, ölçü okunmuyor — eklenmedi); kuzey yüzü v 37,8 kanat yüzü ile koy yüzü v 31,6 farkı; yanal koy satır yükseklikleri; Skeuophylakion boyutları.

## 18. v11 — doğu cephesi (img-ref2: 4, 11, 5, 3); türbe/şadırvan/sıbyan değişmedi

tasarım sorumlusu kararları (v10 sonrası): KD kaide çevresi taş kütleler (17 / 14,5 m); kanat yüzü koy yüzüyle aynı (v ≈ 31,6); taş payanda ve kaide rengi #D6D0C6 (tüm cephelerde); Sinan minareleri ince/uzun okunsun (toplam 60 m, kaide 10 m aynı); doğu yığını baştan.

Ref 4 kamerası (12 denklem; rms ≈ 10 px — ZAYIF): konum yerel (175,4; −29,7; 57,2), yaw −63,9°, pitch 13,1°, f = 1167 px, asal nokta (1316; 611) px. Ref 4 doğudan düz değil, güneydoğudan eğik bakıyor (minare çiftleri x'te üst üste biniyor); çözüm bunu veriyor. Bindirmede çekirdek (kubbe, apsis, koylar, taş kütleler) oturuyor, sol türbe grubunun ölçeği uyuşmuyor (türbeler bu turda değişmedi).

Yapılanlar:
1. Tüm cephelerde taş/kaide rengi #D6D0C6; kanat yüzleri ±31,6 m; taş payandalar bu yüze bitişik.
2. Sinan minareleri: gövde Ø 5,8 m, şerefe halkası yarıçap +0,9 m (ince balkon), sekizgen geçiş 10 → 6 m (kaide tepesi 31 → 27 m); kaide 10,4 m ve toplam 60 m aynı.
3. KD kaide: 2 taş kütle (17 / 14,5 m).
4. Doğu yığını baştan: apsis 5 yüzlü, R 9 m (en uç u 47,4), duvar 20 m, 2 sıra pencere, yarım kubbe tepesi 26 m; büyük doğu yarım kubbe R 13,2 m (v07: 16,5; kuzey/güneyden taşıyordu), kasnak 0→31 m + 9 pencere, kubbe tepesi 38,5 m; iki eksedra = doğuya bakan tonozlu tuğla koy (10,5 × 12 m, 2 pencere) + arkada küçük kubbe (tepe 26 m).
5. 776086637/38 taş kütle, çatı doğuya iner.

Doğrulanmadı: apsis/koy/kasnak ölçüleri (ref 4/11 oranı), kasnak çapı (ayrı tur), doğu taş kütle yükseklikleri, ref 4/11'deki apsis yanı ince taş levhalar (eklenmedi).

## 19. v12 — oran ve düzeltme turu (yeni cephe yok)

Yöntem: ref 2/4/6/8 (+11) üzerinde piksel okuma (alem ucu, 4 minare ucu, kubbe halkası uçları, zemin noktaları, blok çatı kenarı); 5 kameranın ortak en küçük kareler çözümü (OSM/plan 13 yatay konumları sabit). Alem ucu serbest çözümde mutlak yükseklikler 54–67 m arasında oynuyor (zayıf), ORANLAR kararlı → oran esas alındı, model alem ucu 59,8 m'de tutuldu.

Oran tablosu (ref ortalaması | v11 | v12):
- minare ucu / alem ucu: Sinan 1,234 (1,23–1,28) | 1,00 | 1,234; tuğla 1,040 (1,04–1,08) | 1,20 | 1,040; KD 1,049 (1,05–1,10) | 1,09 | 1,05.
- kubbe halkası (z 46) Ø: ref 32,9–33,4 m | 33,0 | 33,0. Kasnak gövdesi/halka: ref 0,95 (Ø ≈31,3 m) | 1,08 (35,6 m) | 0,95 (31,4 m).
- kaide kare (blok çatı kenarı) genişliği: ref 34,7 (G) / 36,9 (K) / 37,6 (B), ort. 36,4 m | OSM 40,3 × 45,5 | DEĞİŞMEDİ (soru). Halka/blok: ref 0,91 | 0,82 / 0,73.
- Sinan minaresi (ref 6 NW, ref 8 SW ort.): alem+hilal %6,5; külah %11,2–12,5; gövde+şerefe %41; geçiş (piramit) %13,5; kaide bloğu %27; şerefe 1 adet @0,64–0,68 H; gövde/kaide genişliği 0,57–0,72 (ort. 0,64). v11: %3,8 / %20,8 / %30 / %10 / %35; 2 şerefe; 0,56. v12: %6,5 / %11,5 / %41 / %13,6 / %28,5; 1 şerefe @0,66; 0,63.

Yapılanlar: kasnak r 17,8 → 15,7 m; kubbe yükselti 9,6 → 8,9 (tepe 54,9; alem 4,9); minareler 73,8 / 62,2 / 62,8 m, tek şerefe, ince balkon, külah/alem ref oranı, Sinan gövde Ø 6,6, geçiş 10 m; köşe kuleleri (4) silindi; doğu: apsis 2 sıra × 5, kasnak 7, apsis yanı 2 küçük kubbe (3 pencere), eksedra koyu 2 ızgaralı pencere, büyük kasnak 9; mavi büyük paneller kaldırıldı.

Kamera px hataları (tahmin–ölçü): ref 2: alem 7,7 / SW 2,5 / NW 5,1 / SE 5,1 / NE 0,9 (rms 3,7); ref 6: 2,9 / 4,3 / 9,9 / 8,2 / 15,8 (rms 7,2); ref 4: 10,5 / 7,0 / 21,0 / 12,8 / 22,5 (rms 12,3 — ZAYIF); ref 8: 11,3 / 6,1 / 2,5 / 4,4 (rms 5,2); ref 11: 19,4 / 9,2 / 13,9 / 4,7 / 5,5 (rms 8,1). Ref 6 ve 4: negatif pitch + büyük asal nokta kayması (kaydırmalı lens benzeri).

Not (minare boyu): boylar artık kaynaklı 60/65 m'den değil ref modelin oranından geliyor; bilinçli stilizasyon. Kartta/anlatımda gerçek yükseklik verilecekse kaynaklı değer kullanılmalı.

### Bindirme değerlendirmesi (13 Ekim, sohbet tarafı) — tasarım sorumlusu kabulü bekliyor
- Oturan: kubbe, kasnak, timpanlar, Sinan minareleri (ref 2/6/8), apsis ve doğu pencere sıraları (ref 4).
- Sorunlu: ref 4 ve ref 6 çözümlerinde asal nokta görüntü dışında (cy −20 ve −152 px) → çözüm dejenere (eğim ↔ kaydırma takası). Ref 4'te kameraya yakın öğeler (GD tuğla minarenin kaidesi, zemin, sol türbeler) tutmuyor. Ref 11 kaba.
- Tuğla (GD) ve KD minareleri ref 2/4'te ≈20–25 px yana kayık; kamera düzelmeden taşınmamalı.
- Ref 11 yakın plan: kubbe kaidesinde köşe kulesi YOK; yalnız kubbenin batısında, ≈±11 m yanal konumda 2 ince tuğla silindir + kurşun kubbe var → modeldeki 2 batı kuleciğiyle aynı öğe olabilir (doğrulanacak). Kaide üstü düz kurşun gri.
- Üçgen sayısı v12: 25 034 (terminal raporu).

### v12 soruları — tasarım sorumlusu kararları (13 Ekim)
- Doğu cephesi v12 kabul. Mutlak ölçek değişmez (alem ucu 59,8 m; kubbe tepesi 54,9 m gerçek ≈55,6 m ile uyumlu).
- Köşe silindirleri: kubbe kaidesinde köşe kulesi YOK. Ref 27'de kuzeyde görünen "ince tuğla silindirler" = 4 payanda kulesinin tepesi (yatay yarım silindir başlık, ekseni K–G, madalyon uç yüzünde; ref 27 önde güney kulelerde aynı). Ref 11'de batıda görünenler = mevcut 2 batı kuleciği (plan 13'te batı yarım kubbenin iki yanındaki gri küçük kubbeler). → v13'te doğrulanıp uygulanacak.
- Kaide kare genişliği: v13'te önce plan 13 üzerinde ölçülüp raporlanacak, uygulama ayrı karar.

## 20. v13 — kamera düzeltme + kule başlıkları (dar tur)

Üçgen (Normal): 25 074 (v12: 25 034). Dosyalar: build_v13.py, render_v13.py, blueprint13.py (v08 blueprint kurulumunun aynısı; blueprint08.py klasör düzenlemesinde kaybolmuş, yeniden yazıldı), ayasofya_v13.blend.

ADIM 1 — asal noktası (763,5; 540)'a sabit kameralar. Serbest: konum, yaw, pitch, f (+ roll denendi). Nokta sayıları: ref 4 = 20 (5 alem/minare ucu, kubbe halkası x-uçları, NE minare tabanı, 4 şerefe, 4 külah tabanı, büyük yarım kubbe tepesi, apsis kubbe tepesi, 3 türbe kubbesi), ref 2 = 6, ref 6 = 7, ref 8 = 5, ref 11 = 6 (minare ucu yükseklikleri v12'den: Sinan 73,8; tuğla 62,2; KD 62,8).
rms (px): eski kamera (v12) aynı noktalarda | serbest-merkez yeniden | sabit-merkez | sabit+roll
 ref 2: 3,9 | 3,8 | 12,2 | 11,4 (roll −1,0°)
 ref 4: 104,7* | 20,1 | 24,5 | 23,6 (−1,4°)    (*eski kamera türbe noktalarını yakalamıyor; v12'nin kendi 10 noktasındaki rms 12,3 idi)
 ref 6: 7,5 | 7,5 | 12,9 | 11,7 (+0,9°)
 ref 8: 5,3 | 5,3 | 11,7 | 11,2 (+1,1°)
 ref 11: 8,8 | 8,8 | 17,5 | 14,4 (−6,7°)
Kural (sabit ≤ eski + 2 px): hiçbirinde sağlanmadı → v12 kameraları TUTULDU. Neden: referanslar görüntü merkezli (asal nokta ortada) kamerayla uyuşmuyor; muhtemelen kırpılmış/ölçeklenmiş render. Roll da düzeltmiyor. Nokta bazında hata: sabit çözümde ref 2 SE 27, SW 17 px; ref 6 NW taban 31 px; ref 4 türbe 53–55 px.
Ref 4'te serbest-merkez çözüm bile 20 px (türbe tepeleri 35–52 px) → ref 4'ün türbe tarafı ile minare/alem tarafı aynı kameraya sığmıyor (türbelerin OSM yatay konumu ya da benim türbe pikselleri belirsiz). Ref 4 doğu geometrisinin kontrolünde güvenilir değil.

ADIM 2 — GD tuğla (SE) ve KD (NE) konum sapması, v12 kameralarıyla (ref 2, 4, 6, 8, 11), uç noktası (z = minare boyu) ve taban (NE: ref 4; tuğla tabanı ref'te görünmüyor):
 SE: ref 2 0,01 m | ref 4 0,56 | ref 6 0,73 | ref 11 0,31 → en küçük kareler (du,dv) = (0,02; −0,40) m.
 NE: ref 2 0,04 | ref 4 0,96 (taban 0,93) | ref 6 0,03 | ref 8 0,70 (ters yön) | ref 11 0,44 → (0,19; −0,93) m.
 Hiçbiri "≥1,5 m ve ≥2 refte aynı yön" değil → konumlara DOKUNULMADI. (Uyarı: uç noktaları kameranın çözümünde kullanıldığı için döngüsel; ama yön ve büyüklük tutarlı değil.)
 İstenmeyen ek bulgu (Sinan, dokunulmadı): NW ref 4 −2,3 m, ref 11 −1,9 m (−v yönü); SW ref 4 −3,0 m, ref 6 −1,0 m, ref 11 −0,6 m → NW/SW −v yönünde 0,7–0,9 m (LSQ) kayık görünüyor, ama ref 2/8'de ≈0.

ADIM 3 — kule başlıkları: Okuma DOĞRULANDI. Ref 27: kuzey kulelerin tepesi tuğla yarım silindir (eksen K–G); ref 8 (batıdan, uç görünüm) ve ref 11 (doğudan): "dikdörtgen + yarım daire" silüeti; ref 32/6: madalyon dış uç yüzünde (z ≈ 31–32 m, Ø ≈ 4,5 m). Uygulama: 4 kule, gövde z = 0 → 28,15; üstü yarım silindir yarıçap 3,85 m (çap = kule genişliği 7,7 m), tepe 36 m (değişmedi); yüzey tuğla duvar tonu (#E3C3B6); madalyon merkezi z 31,8, r 2,2.
 Çelişki notu: ref 8 ve 11'de başlığın üst yüzü kurşun-gri (kurşun örtülü), yalnız alt gövde tuğla; ref 27'de eğri yüzey tuğla. tasarım sorumlusunun talimatı (tuğla) uygulandı; gri örtü istenirse tek malzeme değişikliği.

ADIM 4 — batı kulecikleri: plan 13 (kalibrasyon: yer ölçeği 6,24 px/m, perspektif h = 330 m): K (−36,2; +11,6), G (−36,5; −11,3), yarıçap ≈ 2,2 m. Model (−35,6; ±10,3; r 1,7). Fark u 0,6–0,9, v 1,0–1,3 m (< 1,5) → konum DEĞİŞMEDİ; yarıçap 0,5 m farkı da eşik altı. Boy: ref 8 (u = −36,4 sabit) → K tepe z 27,9 (v 11,0), taban 20,6; G tepe 29,3 (v −15,5 !), taban 22,5. Yükseklik farkı: ref'e göre tepe ≈ 28–29 m, modelde 36 m; gövde+kubbe boyu 7,3 / 6,8 m (model 6,2). G'nin v değeri plan ve K ile çelişiyor (−15,5 vs −11,3) → ref 8 pikseli/kamerası güvenilmez. Mutlak z (ref 8 kamerasından) ±3 m belirsiz ve bantla çakışıyor (aşağıdaki soru) → UYGULANMADI.

ADIM 5 — kaide kare (blok çatı kenarı z ≈ 41), plan 13'te köşeler (725;238)–(985;481) px: u 260 px, v 243 px. Perspektif düzeltmeyle: u ≈ 36,5 m, v ≈ 34,1 m (halka Ø 33 m oranından: 36,6 × 34,2). Merkez dome ekseninden (−0,3; −0,6) ≈ ±0,5 m. Ref ölçümleri (v12): u 34,7 (G) / 36,9 (K), v 37,6 (ref 8, zayıf kamera). Öneri: 36,5 (u) × 34 (v) [model: 40,3 × 45,5]. Etki (UYGULANMADI): N/S yüzler v ±22,7 → ±17; kuleler (şu an v 22,7–35) şu an bloğun dışında duruyor, 5,7 m içeri kayar; timpan açıklığı 22 m sabit (u −11 … 11 → blok yarı genişliği 18,2 m: kenarlarda 7 m pier — kule genişliği 7,7 ile uyumlu); kanat yüzü 31,6 ve koylar aynı kalır; doğu/batı yüz u −20,9/19,4 → −18,6/17,9 (batıda lünet ve 17 m'lik kanat boyu 2,3 m kısalır); kubbe kasnak r 15,7 blok içinde kalır (yarı genişlik 17).

## 21. v14 — img-ref3 çapraz kontrol (yalnız ölçüm; geometri ve .blend DEĞİŞMEDİ)
(İstekte "§20" yazıyordu; §20 v13'e ait olduğu için §21 olarak eklendi.)

ADIM 1 — kameralar (hagiasophia01–04; asal nokta serbest; v13 geometrisi + OSM yatay konum; bilinmeyenler: 4 kamera × 8 + alem/Sinan/tuğla/KD yükseklikleri + blok yarı genişlikleri + blok çatı z):
- Nokta: alem ucu + 4 minare ucu (altın küre tepeleri; piksel okuma ±3 px) + blok çatı köşeleri (02: 3, 03: 3, 04: 3; 01'de çatı köşesi net değil). 
- Çözüm A (OSM xy sabit): rms 10,3 px. Nokta hataları (px): 01 alem 3,3 / GB 1,5 / KB 1,8 / GD 0,8 / KD 2,5 · 02 alem 18,2 / KD 2,1 / GD 24,3 / KB 11,3 / GB 23,1 / köşeler 11,2–44,3 · 03 alem 17,0 / KB 9,6 / GB 5,5 / KD 14,0 / GD 10,8 / köşeler 4,2–7,5 · 04 alem 16,6 / GD 9,1 / KD 2,7 / GB 3,6 / KB 7,0 / köşeler 7,2–21,7.
- Çözüm B (minare xy ±6 m serbest): rms 6,8 px; xy kayması GB (+6,0; +3,9), KB (+0,3; −4,1), GD (+5,0; +0,7), KD (+1,4; −4,9) m (sınıra yakın) → ref3 planı OSM ile birebir değil ya da çözüm kötü koşullu. Mutlak yükseklikler iki çözümde farklı (alem ucu 61,4 / 48,8 m) → MUTLAK ÖLÇEK ÖLÇÜLEMEZ; yalnız oranlar kullanılır.
- Güvenilirlik: 02–04'te pitch 43–54°, f 1140–8650 px dalgalı → kamera zayıf. 01 iyi (rms ≈ 2,5).

ADIM 2 — oranlar: bkz. rapor tablosu. Özet: minare ucu / alem ucu ref3: Sinan 1,15–1,23; tuğla 1,12–1,14; KD 1,13–1,14 (dört uç neredeyse aynı çizgide). ref2: 1,234 / 1,040 / 1,049. v13: ref2 değerleri.
Ölçülemeyenler: kubbe halkası Ø, kasnak/halka, kubbe yükseltisi (kasnak payandaları halkayı örtüyor, uç noktalar okunamadı); batı kuleciklerinin konumu/boyu (çözüm A: tepe z 32, taban 23, x kalıntısı 15 px; B: 17/8, 37 px → belirsiz).
Kaide çatı karesi (çatı kenarı, çıkıntı dahil): A 49,3 × 44,5 m (z 44,7), B 46,4 × 41,3 m (z 30,2) → z kararsız; ref2 plan 13: 36,5 × 34 m; v13 duvar: 40,3 × 45,5. Platform kenar taşması ref3'te açıkça var (çatı/silme duvar yüzünden taşıyor; ölçüsü okunmadı).
Kule başlığı: ref3 01/02/03'te yarım silindir başlık (K–G ekseni) var; genişlik ≈ kule genişliği; dış uç yüzünde rozet (madalyon) VAR; yan yüzler tuğla, eğri üst yüz kurşun-gri (kiremit dokulu). Yüksekliği ölçülemedi.

ADIM 4 — sadeleştirme (wireframe01–04 + doku renderları):
- GEOMETRİ (wire'da var): ana kubbe + ~32 meridyen/halka kaburga, kasnak payandaları ve aralarındaki kemerli boşluklar (kasnak pencereleri kemer geometrisi, ızgaralı iç panel), yarım kubbeler, tonoz çatılar (kıvrımlı), minare gövdesi (≈12 kenar), şerefe halkası, külah, alem küreleri, payanda blokları ve eğimli payandalar, kule başlıkları (yarım silindir), türbe/kuleciklerin kubbeleri.
- DOKU (wire'da yok, düz yüzey): duvar pencereleri (tüm pencere sıraları, ızgaralar), kemerli kör nişler, korniş/silme (yalnız kaba çıkıntı olarak çok az), kiremit/kurşun örtüsü, tuğla/taş desenleri, minare flütleri (gövde dikey kanalları), madalyon rozetleri, kapılar.
- v13'te geometri olup ref3'te doku: pencere/kör kemer/kapı yüzleri 4 655 üçgen (%18,6: Pencere 3 409, Kor_Kemer 1 246); silme + kemer çerçevesi + madalyon (Payanda malzemesi, Payanda_* nesneleri hariç) 6 046 üçgen (%24,1); Merkez'de Payanda 2 048, Kubbe_Ana'da 960 (kasnak dişleri + silme). Toplam ≈ 10 700 üçgen (%43) doku adayı. Kaburgalar (Kubbe_Ana Cati_Kursun 1 920) ref3'te de geometri → kalır; v13'te kaburga derinliği 0,175 m, doku turunda normal-map düşünülebilir.

## 22. v15 — DAE şablonuyla düzeltme (img-ref5; yalnız ölçü şablonu)
Lisans: tasarım sorumlusu, 3D Warehouse modelinin (img-ref5/Kopyası+as2) kullanım sorumluluğunu üstlendi. STL ve A.skp kullanılmadı. DAE ağı modele kopyalanmadı; REF_DAE koleksiyonunda yalnız şablon (hide_render, glb dışa aktarmaya girmez); tüm parçalar bizim kodumuzla kurulu (build_v15.py).

Hizalama (ref5_dae_olcu.glb, tek mesh, 135 016 üçgen, 11 611 bağlı bileşen; sınırlar x 0–104,5 / y −34–98,8 / z 0–64,2 beklenen gibi):
- Eksen: DAE (56,7; 43,2) → bizim (−0,3; −0,6); DAE +x = apsis = +u (yaw −32,68° ile bina eksenine). Zemin z 0.
- Yatay ölçek: DAE kubbe halkası Ø ≈ 25,0 m (yarıçap 12,5–12,65) → 33,0/25,0 = **1,32** (%5 içinde değil → uygulandı). Düşey ölçek: alem ucu 52,7 → 59,8 ⇒ **1,135** (kural). Yani DAE yatayda %24 küçük/ düşeyde %12 küçük modellenmiş (anizotrop).
- Kontrol: DAE batı çifti aralığı 55,4 × 1,32 = 73,1 m (OSM 72,5 → +0,6; beklenen fark çözüldü). DAE minare xy (hizalı) − OSM: GB (−52,0; −39,0) vs (−53,9; −32,8): −2,1 / −6,2 · KB (−51,5; +35,5) vs (−53,6; +39,8): +2,1 / −4,3 · KD (57,5; +38,5) vs (52,4; +39,2): +5,1 / −0,7 · GD (57,5; −39,0) vs (42,8; −33,6): **+14,7 / −5,4**. OSM/plan 13 esas kaldı (istisna).
- rms (yükseklik alanı farkı, bina alanında): çatı yükseklik haritası karşılaştırmasında v13 örtüşme alanı DAE ile %93 (11 584 m² ↔ 12 360 m²); kubbe ve blok yüzü bindirmede ≈0–2 m oturuyor (renders/v15_fark_once.png).

Fark tablosu özeti (DAE'ye göre; eşik plan > 1,0 m, yükseklik > 1,5 m):
- Minare ucu/alem ucu (DAE 64,2 / 61,0 / 61,5 ÷ 52,7): Sinan 1,218 (v13 1,234; fark 1,0 m, eşik altı ama v15'te 72,8 m'ye güncellendi); tuğla 1,158 (v13 1,040; fark 7,1 m) → 69,2 m; KD 1,167 (v13 1,049; fark 7,1 m) → 69,8 m. Hepsi uygulandı.
- Kule başlığı tepesi 39,6 (v13 36,0: 3,6 m) → UYGULANDI; eğri üst yüz Cati_Kursun, yan/uç yüzler tuğla, madalyon aynı.
- Batı kulecikleri: DAE (−39,0; ±13,0), tepe 34,2 (v13 (−35,6; ±10,3), 36,0) → UYGULANDI.
- Kuzey/güney koy kubbeleri: DAE tepe 24,0 (v13 31,7: 7,7 m) → UYGULANDI (u −5,5 ve 5,5, v ±26–27,5).
- Doğu eksedralar (KD/GD): DAE (29,0; ∓27,0), tepe 24,0 (v13 (27,5; ∓22,5), 26) → UYGULANDI; batı eksedralar (KB/GB): DAE (−27,0; ±27,0), 24,0 (v13 (−25; ±24,7), 30) → UYGULANDI.
- Kaide kare: DAE blok çatısı 34,2 × 34,2 m (u −17,1…17,1, v −17,1…17,1), duvarlar u ±16,2 / v ±15,3, taşkın ≈1,8 m; N/S timpan duvarı v ±15,3, açıklık 23,8 m (v13: duvar ±22,7). v13 çatı 40,3 × 45,5. UYGULANMADI (çok parçalı: kuleler, timpanlar, koylar, kanatlar, kasnak kaydığı için dur-ve-sor).
- DAE'de olup bizde olmayan: v ±36,5, z 22,1'de 8 küçük kubbe (u −27, −6, 5,5, 28,5 her yanda); v ±(37), z 39,6 ve 34,9 m yüksek N/S dış duvar (u −35…+20) — bizde bu duvar 25 m; batıda 4 arkadlı tonoz sırası (z 15,3, u −75…−61, v ±(5–9) ve ±(41–47)). Bizde olup DAE'de olmayan: Skeuophylakion'un konumu (DAE'de (45,6; 46; z 21,6…)), 2 koy kubbesi z 31,7 (indirildi).
- Yarım kubbeler/exedra tepe z: DAE doğu/batı büyük yarım kubbe tepeleri kule/blok gölgesinde ayrı tepe vermiyor (ölçülemedi).

Uygulanmayanlar (sorulacak): kaide kare yeniden kuruluşu (yukarı), N/S dış duvar 39,6 m, 8 küçük kubbe, batı arkadlı tonoz sırası.


## 23. v16 — kaide kare, kuleler, 8 küçük kubbe, batı tonoz sırası, doğu orta yığın (DAE hizası aynen: yatay 1,32 / düşey 1,135)
Üçgen (Normal): 24 143. Dosyalar: build_v16.py, ayasofya_v16.blend, export/ayasofya_v16_normal.glb (Draco, 23 parça).

Kararlar: GD minare xy OSM'de, Sinan oranı 1,218 (v15). Doğu yığın DAE esas.

Uygulananlar (hepsi "DAE'ye göre, doğrulanmadı"):
1. Kaide: duvar 32,4 × 32,4 (u ±16,2, v ±16,2; v15: OSM 40,3 × 45,5), çatı/silme levhası 34,2 × 34,2 (z 39,8–41,4; taşkın 0,9 m), N/S kemer yüzü ±15,3 (girinti 0,9), kemer açıklığı 23,8 (R 11,9). Orta çekirdek/platform/bant bloğun içinden çıkarıldı (u −16,2…16,2); kanatlar, koylar ve tonozlar blok yüzüne (±16,2) bağlandı.
2. Kuleler: u −16,0 / 15,5, genişlik 5,6, v 16,2 → K 36,3 / G 37,6, başlık tepe 39,6 (başlık yarıçapı 2,8).
3. 8 küçük kubbe: u −27, −6, 5,5, 28,5; v ±36,5; r 3,5; tepe 22,1 (mevcut koy kubbeleri v ±25,6'da → ≥ 10 m, taşınmadı, yeni eklendi; gövde zeminden).
4. Batı tonoz sırası: 4 tonoz 9 × 4,4, tepe 15,3, u −75…−66, v +14,2 / +7,0 / −5,7 / −13,9 (Payanda_Bati içinde).
5. UYGULANMADI (bilerek): K/G dış duvar "v ±36,9, u −35…+19,8, 39,6 m" — DAE'de 55 m genişliğinde pencereli düzlem; ref 2/6 (ikisi) ön planda timpan/koy/kule görüyor, düz duvar yok. Kuleler 39,6'ya çıkarıldı (aynı çizgi). Sorulacak.

Doğu orta yığın fark tablosu (v15 → DAE → v16; u,v yerel; z tepe):
- Büyük doğu yarım kubbe: R 13,2 / kasnak 31 / tepe 38,5 / 9 pencere z 26–28,4 → R 14,8 (u 19,5…34,3), kasnak 32,6, tepe 38,3, 5 pencere z 30,4–32,6 (açı 0, ±30, ±62) → aynı.
- Eksedra yarım kubbeleri (KD/GD): (29,0; ∓27,0) tepe 24 → DAE: (24,7; ±14,3) R 6,3 kasnak 15→25 (3 pencere z 22,5–24,7, açı 1°, 50°, 106° dışa) tepe 29,0 → aynı. (29; ±26,5) tepe 24,0 koy kubbesi KD/GD içinde kaldı.
- Apsis yanı küçük kubbeler (31,5; ±8,6) tepe ≈26,6: DAE'de YOK → silindi.
- Apsis: 5 yüz, R 9 (merkez 38,4), duvar 22,5, 2 sıra × 5 pencere (2,2 m), kasnak yok, kubbe tepe 27,7 → DAE: R 11,6 (merkez 35,8; uç u 47,4), duvar 22,7, orta yüzde 2 sıra pencere (4,6 m geniş; z 1,6–8,5 ve 10,3–17,2), kasnak 22,7→25,0 + 8 küçük pencere (z 22,9–24,4), kubbe 25,0→28,7 → aynı.
- Doğu koy (u 27,5–38): v15: v 15–27, 15 m + tonoz 20, 2 pencere → DAE: v 13–35, duvar u=38'de 22,3 m, üst sıra 3 pencere (z 15,4–19,5), alt sıra 1 (K) / 2 (G) büyük → aynı.
Renders: v16_fark.png, v16_dogu.png (ref 11 ve ref 4 kameraları + DAE tel), v16_ref2.png.
Not: "tasarım sorumlusunun ekran görüntüsündeki açı" dosya olarak verilmedi; ref 4 ve ref 11 çözülmüş kameraları kullanıldı.

## 24. v17 — yan kubbeler, galeri çatıları, kanat yüzü ±36,3, batı eksedralar
Üçgen (Normal): 23 799. build_v17.py, ayasofya_v17.blend, export/ayasofya_v17_normal.glb (Draco, 23 parça). DAE hizası aynı (1,32 / 1,135).

DAE ölçümü (hizalı): galeri çatısı z 22,1 (blok yüzü) → 17,6 (dış yüz v ±36,3) eğimli, eğim dışa. Kubbe sıraları: v ≈ ±26,5: R 5,2–5,3, tepe 24,1 (taban ≈ 22,1); v ±36,3–36,6: yarım kubbe, R 5,6, taban 17,6, tepe 22,1–22,4 (merkez dış duvar yüzünde, yarısı bina tarafında).
Uygulananlar:
1. v16'daki 8 zemin silindiri silindi.
2. Kanat yüzü ±31,6 → ±36,3; koylar, doğu koyu, taş payandalar (va/vb2), kule ucu (K 36,3 / G 37,6) bu yüze hizalı. Kanat gövdeleri DAE eğimli galeri çatısı olarak kuruldu (22,1 → 17,6); lane_gable çatıları kaldırıldı. Kanat yüksekliği artık K=G (v16: 17 / 15).
3. Yan kubbeler, yanda 4: u −27 ve 28,5 → galeri çatısı dış ucunda yarım kubbe (R 5,6, kasnak 0,6 + kubbe 3,9 → tepe 22,1; çatıya gömülü taban); u −6 ve 5,5 → koy tonozu üstünde R 5,2, tepe 24,1 (v ±26,7; v16'da R 3,7, v 25,6). Eski doğu (29; ±26,5) kubbesi ve batı KB/GB (−27; ±27) kubbeleri silindi → aynı u'da iki kubbe yok. DAE'de u −27 ve 28,5'te ayrıca v ±26,5 sırası (tepe 24,1) var; 4/yan kuralı için eklenmedi (istenirse tek satır).
4. Batı eksedralar: (−24,7; ±14,3), R 6,3, kasnak 15→25, tepe 29,0, 3 pencere (doğunun aynası). Kubbe_Kucuk_KB/GB içinde.
Çakışma kontrolü (tasarım + görsel; sayısal ışın testi yapılmadı): yarım kubbeler eğimli çatı üstünde ve ±36,3 yüzünde yarısı kesik; dış yarı boş. Koy kubbeleri koy tonozunun üstünde (taban 22,9). Eksedralar gövde gövdesi (23,4) ile birleşir; kubbe 25–29 arası çıkıntı yapar. Taş payandalar (Payanda_Kuzey/Guney) v ±36,3'ten başlar; kubbe yarım diskleri onların üstünde kalmaz (u −27: payanda u −22…−7: boş; u 28,5: boş).
Bilinen sorun: u −6 / 5,5'te DAE'nin eğimli çatısı koy tonozlarıyla yer değiştirdi (koy ref 2/6'dan, çatı DAE'den) → ikinci sıra yarım kubbeleri o u'larda yok.


## 25. v18 — çakışma düzeltmesi, türbeler (DAE), dondurma
Üçgen (Normal): 25 044. build_v18.py, ayasofya_v18.blend, export/ayasofya_v18_normal.glb (Draco, 23 parça). Kararlar: u −6/5,5 koy tonozları ve büyük kemerli pencereler kalır (ref 2); DAE ikinci sıra (v ±26,5) eklenmedi.

Çakışma testi (check18.py): mathutils.bvhtree; her parçanın gevşek adaları (≥12 yüz) ayrı; "kubbe/kasnak/silindir" adaları (Kubbe_Kursun malzemeli ya da düzgün halka prizma) başka adanın içine ≥0,3 m giriyor mu: köşe-içeride testi (3 eksen oy çokluğu) + en yakın yüzeye mesafe.
ÖNCE (v17): 50 çift, en derin 8,4 m. İlk 14: 
- 8.40  verts_in 16/32 | A=Kubbe_Kucuk_GB L(-24.7,-14.3) r6.3 z 15.0–25.0 n16 | B=Merkez L(-27.8,0.0) z 0.0–23.4 n17
- 8.40  verts_in 16/32 | A=Kubbe_Kucuk_KB L(-24.7,14.3) r6.3 z 15.0–25.0 n16 | B=Merkez L(-27.8,0.0) z 0.0–23.4 n17
- 6.74  verts_in 8/32 | A=Kubbe_Kucuk_GB L(-24.7,-14.3) r6.3 z 15.0–25.0 n16 | B=Kubbe_Yarim_Bati L(-22.3,-0.2) z 23.0–39.0 n189
- 6.64  verts_in 46/97 | A=Kubbe_Kucuk_GB L(-24.7,-14.3) r6.2 z 25.0–29.0 n96 | B=Kubbe_Yarim_Bati L(-22.3,-0.2) z 23.0–39.0 n189
- 6.38  verts_in 8/32 | A=Kubbe_Kucuk_KB L(-24.7,14.3) r6.3 z 15.0–25.0 n16 | B=Kubbe_Yarim_Bati L(-22.3,-0.2) z 23.0–39.0 n189
- 6.28  verts_in 40/97 | A=Kubbe_Kucuk_KB L(-24.7,14.3) r6.2 z 25.0–29.0 n96 | B=Kubbe_Yarim_Bati L(-22.3,-0.2) z 23.0–39.0 n189
- 4.43  verts_in 8/32 | A=Kubbe_Kucuk_KD L(24.7,14.3) r6.3 z 15.0–25.0 n16 | B=Kubbe_Yarim_Dogu L(27.5,-0.0) z 0.0–32.6 n21
- 4.36  verts_in 34/97 | A=Kubbe_Kucuk_KD L(24.7,14.3) r6.2 z 25.0–29.0 n96 | B=Kubbe_Yarim_Dogu L(27.5,-0.0) z 0.0–32.6 n21
- 4.33  verts_in 4/200 | A=Kubbe_Yarim_Bati L(-22.3,-0.2) r17.0 z 23.0–39.0 n189 | B=Kubbe_Kucuk_KB L(-24.7,14.3) z 15.0–25.0 n16
- 4.32  verts_in 34/97 | A=Kubbe_Kucuk_GD L(24.7,-14.3) r6.2 z 25.0–29.0 n96 | B=Kubbe_Yarim_Dogu L(27.5,-0.0) z 0.0–32.6 n21
- 4.32  verts_in 4/200 | A=Kubbe_Yarim_Bati L(-22.3,-0.2) r17.0 z 23.0–39.0 n189 | B=Kubbe_Kucuk_GB L(-24.7,-14.3) z 15.0–25.0 n16
- 4.30  verts_in 6/32 | A=Kubbe_Kucuk_GB L(-24.7,-14.3) r6.3 z 15.0–25.0 n16 | B=Merkez L(-25.6,-26.2) z 0.0–22.1 n17
- 4.30  verts_in 6/32 | A=Kubbe_Kucuk_KB L(-24.7,14.3) r6.3 z 15.0–25.0 n16 | B=Merkez L(-25.6,26.3) z 0.0–22.1 n17
- 4.26  verts_in 10/32 | A=Kubbe_Kucuk_GD L(24.7,-14.3) r6.3 z 15.0–25.0 n16 | B=Kubbe_Yarim_Dogu L(27.5,-0.0) z 0.0–32.6 n21
… kalan: eksedra–koy/apsis (2,5–3,5 m), taş payandalar–apsis/narteks (1,7–3,9 m), türbe lobları–ana sekizgen (1,0–1,2 m), Skeuophylakion–taş kütle (0,9 m), yarım kubbe kasnak–çatı (0,6 m).
SONRA (v18): 0 çift (≥0,3 m).
Düzeltmeler: eksedralar (KD/GD/KB/GB) büyük yarım kubbeye bakan yarısı kesildi (yarım kubbe) ve tabanları gövde/çatı üstüne alındı (doğu 22,5; batı 23,2); batı büyük yarım kubbe DAE simetrisine (R 14,8, merkez −19,5, kasnak 23,2→32,6, tepe 38,3; v17 OSM R 16,5); doğu koy DAE eğimli galeri çatısı + doğu duvarı (u=38, 22,3 m); yan yarım kubbe kasnağı çatı eğimini izliyor (taban gömülmesi ≤ 0,1), tepe 22,2; doğu taş blok 637 v başı 12; batı kaide taş kütlesi v 38; Skeuophylakion R 6,2 → 5,3; türbe lobları R 1,5 / gömülme 0,3; 776086640 u başı −19,4.
KB/GB eksedra–gövde (v17 raporu): 8,4 m derin; artık eksedra gövde üstünde (taban 23,2, 1,8 m kasnak + kubbe) ve dış yarısı.
Not: test yalnız kubbe/kasnak/silindir adaları için; gövde–gövde prizma birleşimleri (Merkez içi kanat/çekirdek) bilerek birleşik.

Türbeler (DAE): Murat (33,5; −85,1) ve Mehmed (−4,0; −91,9): DAE gövde 14,5 m (OSM 17), kasnak 14,5–16, kubbe tepe 21,2 (OSM 23), 3 sıra pencere (z 2–4,8 / 6–8,8 / 10–12,8). Selim (13,3; −74,5): DAE tepe 21,2 (v17 20,0; fark 1,2 < 1,5), gövde 14,5 (16; fark 1,5) → biçim aynı, pencere 3 sıra. xy OSM. DAE'de karşılığı olmayan (dokunulmadı): Şehzadeler (132277807), I. Mustafa–I. İbrahim (776086636; DAE'de (−37,5; −50/−45,5) z 17,6 iki küçük kubbe var, ≈8 m farklı) — listelendi.

GEOMETRİ DONDURULDU (v18)

## 26. v19 — doku turu A: canlı palet + ışık pişirme, tek atlas (geometri v18, değişmedi)
Başlangıç dosyası: ayasofya_v18.blend (v18b yoktu; v18 donmuş geometri). Betik: bake_v19.py (build dosyalarına dokunulmadı). Çıktı: ayasofya_v19.blend, export/ayasofya_v19_normal.glb, export/ayasofya_v19_hafif.glb, export/atlas/atlas_2k.png, atlas_1k.png (+ atlas_raw_2k.png denoise öncesi). Doku/atlas kopyalanmadı; tamamı kendi render'ımızdan pişirildi.

Karar kapanışı: "Skeuophylakion" adı ONAYLANDI (tasarım sorumlusu). Türbeler duvar renginde (#E3B09B).

Son palet (başlangıç değerleri korundu, ±%10 ayarı gerekmedi): kubbe/çatı/külah #8B96B0 · duvar/türbe #E3B09B · pencere #88B4DE · tuğla minare #D97E51 · taş/kaide #D6CCBC · minare taşı #E6D6BE · alem #DCA320 · ek: kör kemer #C99580, kapı #8A5A3A, zemin #C8BFB0. Specular IOR düşük (0,15), roughness 0,85 (pişmeye yansıma karışmasın).
Işık (Cycles): güneş 3,0 (sıcak 1,0/0,90/0,76), açısı 9° (yumuşak gölge), gök (0,74/0,82/1,0) × 1,0; 128 örnek, bounce 6/diffuse 4, COMBINED, margin 4 px. EEVEE önizlemeleri eski/yeni palet için 2,5 + 0,3 ile.
UV: "BakeUV", tüm bina parçaları tek ortak atlas, Lightmap Pack (BOX_DIV 48, MARGIN 0,2; blender 5.2'de PREF_IMG_PX_SIZE/NEW_UVLAYOUT operatör parametresi yok → 2048 görüntü + 4 px bake margin ile). Nesneler ve adlar ayrı. 11 538 çokgen.
Denoise: kompozitör (Denoise düğümü, 5.2'de node group); ham↔denoise ortalama mutlak fark 5,6/255.
Sorunlar/çözümler:
- Tonoz uç kapakları (9 köşeli) iç yüze bakıyor, siyah pişiyordu → sarma yönü düzeltildi (yalnız yüz sırası; geometri aynı). Düzeltilen yüz sayıları betik çıktısında (Narteks 9, Payanda_Bati vb.). Genel "içeride mi" sezgisi kapalı prizmaları bozdu → kaldırıldı.
- Hâlâ ışık almayan texeller (atlasın ≈%45'i; gizli alt/iç yüzler) → gölge tabanı: texel ≥ albedo × 0,58 (kodlanmış uzay). Böylece hiçbir görünür yüz siyaha düşmüyor, gölgeler rengini koruyor.
- Atlas verimi düşük: Lightmap Pack her çokgene ayrı hücre verdiği için küçük pencere/silme yüzleri ve görünmeyen alt yüzler yer kaplıyor (kullanılan texel ≈%55). Doku çözünürlüğü geniş duvarlarda ≈2,3 m/texel (2K). Düzeltmek için gizli yüzleri atlamak ya da Smart UV gerekir (geometri dondurulduğundan yapılmadı).
- Kubbe/çatı rengi gökten mavi/lila kayıyor (palet #8B96B0 + gök mavisi): istenen "canlı" etkiyi veriyor; fazla bulunursa gök rengi nötrleştirilir.
Malzeme: tek "Atlas" (Background→Emission benzeri, glTF'de KHR_materials_unlit; BakeUV) + "Alem_Altin" (#DCA320). Alem'li parçalar: Kubbe_Ana, Minare_1–4, Skeuophylakion.
Dışa aktarım (Draco, JPEG kalite 85, Y-up, REF_* ve Zemin hariç): normal 1,22 MB (atlas 2K), hafif 0,63 MB (atlas 1K). Üçgen: 25 034 (Normal; v18 ile aynı; hafif aynı geometri — Hafif ≤12 000 hedefi bu turda karşılanmıyor: yalnız atlas 1K). Draw call: 23 mesh, 29 primitive (6 parçada Alem ayrı slot), 2 malzeme → 29 draw call (malzeme birleştirilirse 2'ye iner).
Önizleme: renders/v19_palet.png (eski/yeni + 300 px), renders/v19_bake.png (ışıksız pişmiş doku, KB/KD/GB/GD).
Not (v18b): istenen "ayasofya_v18b.blend / build_v18b.py" disk üzerinde YOK (tüm Desktop/akar altında arandı). v19 ayasofya_v18.blend üzerinde pişirildi. bake_v19.py artık kaynak dosyayı parametre alıyor: `Blender -b --python bake_v19.py -- 3.0 1.0 2048 128 full ayasofya_v18b.blend`. v18b gelince yeniden pişirilecek; "v18b üzerinde yeniden pişirildi" satırı o zaman eklenecek.

## 25b. v18b — kusur düzeltmeleri (v18 + build_v18b.py; kütle/yükseklik/konum değişmedi)
Dosyalar: build_v18b.py, ayasofya_v18b.blend, renders/v18b_kontrol.png, fix18b_rapor.json (liste). Üçgen (Normal): 25 602 (v18: 25 044; +558: kapatılan kapaklar, alem gövdesi, çerçeve yüzleri).
1. Alem: minarelerde profil sürekli (taban halkası külah ucunda, boşluk 0; eski profil 3 m boyun yoktu → top havada kalıyordu); Kubbe_Ana alemi tabanı kubbe tepesinde (54,8); Skeuophylakion alemi 0,6 m havadaydı → kubbe tepesine (12,8) indirildi. Türbe kubbelerinde alem yok.
2. Açık kabuklar: hacim adası (≥6 yüz) 200; açık sınır kenarı 3 662 → 3 526; açık ada 190 → 190 (hepsi gizli alt kapaklar: zemin altı, aşağı bakan ya da başka kütle içinde — 176 döngü bilerek açık, çünkü dışarıdan görünmez). Görünen açık döngü KAPATILAN: 17 (düzlemde, dışarıdan görünen; duvar rengi): eksedra/yarım kubbe kesik yüzleri, galeri çatısı ucundaki yarım kubbeler, minare şerefe/kasnak halkaları, kule başlığı alt kapakları. Manifold olmayan kenar 49 (üst üste binen prizmalar; değişmedi).
3. Normaller: hacim adalarında dışa çevrilen yüz 55; pencere/çerçeve/silme küçük yüzlerinde ters yönlü 445 yüz dışa çevrildi (uygulamada tek taraflı çizim → delik/görünmezlikti).
4. Pencere/kör kemer ışın testi (her pencere için 9 örnek; "içeride", önde ≤0,5 m engel, arkasında ≤0,5 m duvar yok): >%20 kötü olanlar aynı duvarda yatay kaydırıldı (±0,5…8 m) ya da yer yoksa silindi: kaydırılan 15, silinen 10. Not: eğri (silindir) duvarlarda teğet kaydırma duvardan uzaklaştığı için kabul edilmedi (arkada 0,5 m duvar şartı) → o pencereler silindi. Kaynak düzeltme: eksedra silmesi 24,2→24,65 ve pencereler 22,9–23,9 (silme pencerelerin üstünü örtüyordu). Liste fix18b_rapor.json "pencere" alanında (nesne, işlem, konum, oran, kayma).
Yöntem notu: parite testi üst üste binen prizmalarda yanıltıcıydı (iki katının kesişimi "dışarıda" çıkıyordu) → "ilk çarpılan yüz arkası ise içeridedir" testi kullanıldı.

## 26 (güncelleme). v19 — v18b üzerinde yeniden pişirildi
"v18b üzerinde yeniden pişirildi." Betik: bake_v19.py (kaynak ayasofya_v18b.blend). Parametreler: güneş 2,4 (0,96-ton sıcak beyaz 1,0/0,96/0,90, 9°), gök NÖTR BEYAZ × 0,8, 128 örnek, COMBINED + margin 4 px, denoise kompozitörde.
- Gök nötr: lit kubbe/çatı texel medyanı #8A93AB (hedef #8B96B0; lila kayma yok). İlk deneme (gün 3,0 / gök 1,0) #9BA5C0 çıktı → %10 parlak → 2,4/0,8'e düşürüldü.
- Atlas verimi: görünmeyen yüzler (aşağı bakan, kütle içinde kalan; 1 858 yüz = %15,7) tek köşe texeline (gölgeli duvar tonu) toplandı; görünen 9 968 yüz Smart UV (66°) + average_islands_scale + pack_islands (UV pay 2 px; bake extend 4 px). texel yoğunluğu: ESKİ (Lightmap Pack): p10/p50/p90 = 3,1 / 8,3 / 16,2 px/m (yüz başına eşit hücre → büyük duvarlar 3 px/m, küçük süsler 16 px/m); YENİ: 4,0 / 4,4 / 4,7 px/m (±%8, eşit yoğunluk); atlas kullanımı %49,8 (görünen yüz). 4 px UV payı yoğunluğu 4,0'a düşürürdü (p50 4,0; kullanım %31) → 2 px payda 4,4 px/m. Hafif (1K): 2,2 px/m.
- Gölge tabanı: texel ≥ albedo × 0,58 (kodlanmış uzay): %37 texel (gizli iç yüzler).
- Hafif: sadeleştirme YOK; aynı geometri + 1K atlas.
- Dosyalar: ayasofya_v19_normal.glb 0,98 MB, ayasofya_v19_hafif.glb 0,55 MB, atlas_2k.png 5,1 MB, atlas_1k.png 1,4 MB. Üçgen 25 592 (Zemin hariç). Draw call: 23 mesh, 29 primitive (6 parçada alem ayrı), 2 malzeme.

### v19 son düzeltme (tasarım sorumlusu isteği)
1. Gizli yüzlerin UV'si köşe texeli yerine aynı nesnedeki EN YAKIN GÖRÜNÜR yüzün UV merkezine bağlandı (1 427 yüz) → siyah/koyu dikişler büyük ölçüde gitti. Görsel kontrolde 3–4 yerde (kuzeydoğu/güneydoğu görünümlerinde kasnak–payanda birleşimleri) ≈1 px ince koyu çizgi kalıyor: görünür sayılan ama komşu kütle içinde kalan yüzlerin kenar texelleri.
2. UV pack payı 4 px'e döndürüldü (bake extend 4 px). texel yoğunluğu p10/p50/p90 = 3,2 / 3,5 / 3,7 px/m (±%8; 2K), atlas kullanımı %31,6; Hafif (1K) 1,8 px/m. (2 px payda 4,4 px/m idi.)
3. Üçgen 25 592 (Zemin hariç). export/ayasofya_v19_normal.glb 1,06 MB, ayasofya_v19_hafif.glb 0,58 MB. Çatı texel medyanı #82879D (görünen+gizli yüzler birlikte örneklendi; yalnız ışık alan görünür çatılar için önceki ölçüm #8A93AB ≈ hedef #8B96B0).
4. Atlas dosyaları: export/atlas/atlas_2k.png, atlas_1k.png.

AYASOFYA KAPANDI (v19)

## 27. Kapanış — Redmi testi ve bilinen kusurlar (13 Ekim, tasarım sorumlusu kararıyla kapatıldı)

Redmi 9T (Adreno 610, Chrome): v19 2K ve 1K, PR 1,5 ve 2,75, Standart/Lambert → hepsi ≈60 FPS.
2K: 1032 KB, ilk çözme ≈1 sn (sonraki 0,18 sn); 1K: 563 KB, çözme 0,1 sn. %1 yavaş kare 2K'da 47,7.

Düzeltilmeden kalan kusurlar (telefon ekran görüntüleri, tasarım sorumlusu):
1. Doku bulanık (3,5 px/m; yakın çekimde çamurlu).
2. Pencere kenarlarında ve kütle birleşimlerinde siyah çizgiler (decal z-fighting + atlas dikişi).
3. Küçük yarım kubbelerin (eksedra, galeri ucu) içi görünüyor; v18b "kapatıldı" raporuna rağmen.
4. Çatı rengi #82879D (hedef #8B96B0).

Ayasofya yöntem pilotu olarak kapandı; demoda ana eser değil. Dersler ve yeni eser kontrol listesi:
`eserler/_kutuphane/AKAR_3D_Yontem_Notlari.md`. Eski başlangıç prompt'u (`AKAR_3D_Baslangic_Prompt.md`) geçersiz.

## 28. Arşiv temizliği (13 Ekim)
tasarım sorumlusu onayıyla silindi: img-ref, img-ref2–5, yandex-ref, v01–v18 render'ları, ara .blend/.glb'ler, build_v12–v18,
render_v12/13, blueprint13, scene15. Kalan: build_v18b.py (+ osm_parts.json) ile geometri, bake_v19.py ile doku
yeniden üretilebilir; son dosyalar ayasofya_v18b/v19.blend ve export/ altında. Notlardaki ref numaraları artık arşivde yok.


## 29. v20 — ayrıntılı referans uyarlaması (19 Ekim 2026)

Kullanıcının referansa mümkün olduğunca yaklaşma isteğiyle ayrı v20 üretildi. Kaynak DAE ağı ve 11 dokusu doğrudan aktarıldı; üst üste ön/arka yüzler temizlendi. 67.289 üçgen, 19 malzeme, yaklaşık 3,01 MB GLB. Eski v19 değişmedi. v20 tek mesh: eski parça adlarına bağlı cue eşleştirmeleri bu sürümde henüz yok. Üretim, görseller, kaynak kopyası ve doğrulama raporları `v20/` altında; ayrıntılar `v20/README.md`.

## 30. v21 — çatı ve türbe revizyonu (20 Ekim 2026)

`v21/ayasofya_v21.blend` ve `v21/ayasofya_v21.glb` üretildi. Çatı üst yüzeyleri kesilerek örtüşmeler azaltıldı; ana kubbe ve üç türbe yeniden kuruldu; minare şerefe silmeleri eklendi. Referans fotoğraf araştırması ve teknik sınırlar `v21/README.md` içinde. Bu sürüm tüm mimari detaylar için kapanış/onay anlamına gelmez; kaynak payanda ve cephe oranları tamamen yeniden modellenmedi. V19 ve V20 korunur.
