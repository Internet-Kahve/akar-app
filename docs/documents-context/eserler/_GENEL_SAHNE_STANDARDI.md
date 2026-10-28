# Genel sahne standardı: renk, ışık, zemin (tüm Bursa eserleri)

18 Ekim 2026. Her eserin `SONNET_REVIZYON_PLANI.md` dosyası bu dosyaya dayanır. Bu dosyadaki kurallar **kesin kuraldır**. Eser planı açıkça başka bir değer vermedikçe buradaki değerler kullanılır.

**Benchmark:** Ulu Cami v22 (`ulu-cami/3d/kontrol/v22/v22_genel.png`). Açık, sıcak ve temiz bir görünümü var. Diğer eserler bu görünüme getirilir. Şu anki sorunları şunlar: koyu yeşil disk, koyu kahve/bordo tuğla, mat gri kubbeler ve şeftali rengi arka plan (Koza Han v02o, Bedesten v02c, Orhan v05, Hamam v02).

`veri/bursa/sablonlar/_ortak_stil.md` dosyasındaki ilkeler (düz renk, en çok 3 ton, foto doku yok, sınırlı doku) geçerlidir. **Renk değerleri** ise bu dosyadakilerle değişmiştir: `_ortak_stil.md` §2'deki tuğla #873B24 ile #AD4327 arası, çim #A0B46C ve arka plan #F6D0AB artık kullanılmaz.

---

## 1. Zemin ve kaide (tüm eserlerde aynı)

| Rol | Hex | Malzeme | Not |
|---|---|---|---|
| Ana zemin / kaide üstü | `#C4BDAF` | rough 0,90, metal 0 | Kullanıcı onaylı (Ulu v22). Sıcak, açık greige taş. Yapıyı öne çıkarır ve gölgeyi taşır. |
| Avlu / döşeme alanı | `#B3A590` | rough 0,85 | Kullanıcı onaylı (Ulu v22). Yapıya ait avlu, yol ve döşeme. |
| Döşeme derzi | `#A69A86` | rough 0,90 | İnce çizgi şeridi (≈ 4 cm). Ana zeminden 1 mm yüksekte. Aynı düzlemde z-fighting yapmaz. |
| Kaide yan yüzü | `#A39A8B` | rough 0,90 | Kaide kalınlığı 0,6 m. Üst kenarda 0,15 m pah. |
| Çim / yeşil alan | `#9DB86A` (ana), `#8BAA5E` (gölge tonu) | rough 0,95 | **Yalnızca leke ya da tarh olarak.** Bütün kaideyi kaplamaz. Yüzeyin en çok %25'i. |
| Toprak / ağaç dibi | `#A5845F` | rough 0,95 | Ağaç çanakları, tarh kenarı. |
| Tarh bordürü (alçak taş) | `#D2C3A4` | rough 0,80 | 0,25–0,40 m yüksek, 0,25 m kalın. |

- **Kaide biçimi (19 Ekim 2026, kullanıcı kararı; 18 Ekim'deki dikdörtgen kuralının yerine):** **daire kaide.** Kaide, yapıyı ve modeldeki bütün çevre öğelerini (bitişik birimler, avlu, şadırvan, ağaç, figür) saran **en küçük çember + 3 m pay**dır. Uzun kenarın kısa kenara oranı 1,5'ten büyükse (şu an yalnız Bedesten) aynı kuralla **elips** kullanılır; elips eksenleri yapının ana eksenlerine paraleldir. Yüzey z = 0, kalınlık 0,6 m, üst kenarda 0,15 m pah. Döşeme ve tarhlar kaide kenarından 1,5 m içeride kesilir. `_sunum.glb` dosyasında orijin kaide merkezidir; yapı dışa aktarımda bu merkeze kaydırılır, blend ve betik dünya koordinatları değişmez. Örnek uygulama: Koza Han v12 (`koza-han/3d/build/build_v12.py`). Ulu Cami v24'te daireye çevrildi (merkez (0,55; 4,61), R 55,37 m). **İstisna:** Ulu Cami'de pay kullanıcı kararıyla 3 m yerine 8 m'dir (v23 payı korundu); diğer eserlerde 3 m geçerlidir.
- **Koyu yeşil tam disk kaldırılır.** Koza Han, Bedesten, Orhan ve Hamam'daki `Cim` diski `#C4BDAF` zemine dönüşür. Çim yalnızca kaynakta görülen yeşil alanlara konur.
- **Pembe gölge elipsi** (`_ortak_stil` §1.5) kaldırılır. Gölgeyi ışık verir.
- **Arka plan:** kontrol render'larında `film_transparent = True`. Sunum render'larında dünya rengi açık nötr gri: `(0.80, 0.80, 0.80)`. Şeftali (#F6D0AB) arka plan kullanılmaz.

## 2. Işık ve render (Ulu Cami v16 ayarlarının aynısı)

```python
sc.render.engine = 'CYCLES'; sc.cycles.samples = 24; sc.cycles.use_denoising = True
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'   # AgX/Filmic YOK
sc.view_settings.exposure = 0.0; sc.view_settings.gamma = 1.0
w = bpy.data.worlds.new("_w"); w.use_nodes = True; sc.world = w
bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND")
bg.inputs[0].default_value = (0.80, 0.80, 0.80, 1); bg.inputs[1].default_value = 1.0
sun = bpy.data.objects.new("_sun", bpy.data.lights.new("_sun", 'SUN')); sc.collection.objects.link(sun)
sun.data.energy = 1.25; sun.data.angle = math.radians(35); sun.rotation_euler = (math.radians(50), 0, math.radians(-35))
```

- Güneş yumuşak (angle 35°). Sert, siyah gölge yok. Işık eserler arasında **değişmez**: aynı yön, aynı güç. Böylece eserler yan yana tutarlı görünür.
- **28 Ekim 2026:** köşe rengi AO'su kaldırıldı (COLOR_0 yok). AO ikinci UV `UV_AO`'ya dokuya pişirilir (glTF occlusionTexture, texCoord 1, 0,5 + 0,5 × AO) ve `Yer_Golgesi` saydam düzlemi eklenir. Hat: `_kutuphane/renk_ao_v3/`. Aşağıdaki köşe rengi kuralı eski sürümler içindir.
- **29 Ekim 2026 (geçerli):** pişmiş AO kalır ama küçük: tek kanal JPEG, kalite 80; Ulucami ve Koza Han 1024 px, diğerleri 512 px. `Yer_Golgesi` düzlemi modelden çıkarıldı; yer gölgesini web çiziyor. GLB'ler yalnız Blender'dan üretilir: her eserin `build/build_vXX.py` betiği ve `_kutuphane/blend_hat/`. `renk_ao_v3/` bir kerelik geçişti, yeniden kullanılmaz.
- Vertex AO: **21 Ekim 2026 (uygulama modelleri):** köşe rengi yalnız gri AO (R=G=B). Yönlü gölge pişirilmez. AO tabanı 0,875, kubbe/alem/kasnak ≈ 0,94, ardından yükseklik gradyanı `*= 0,92 + 0,08·y/H`; en koyu köşe ≥ 0,80 (iş emrindeki 0,84 tabanı gradyanla 0,77 verdiği için 0,875 seçildi). Renk malzemenin baseColor'unda durur. Eski değerler (0,70 / 0,85) yalnız eski sürümler içindir.
- Standart kontrol kamerası: izometriğe yakın, yükseklik açısı ≈ 32°, yatay ≈ 45°, ortografik. Kullanıcıyla karşılaştırma için her eserde `havadan.png` (1800 × 1600) bu açıdan alınır.

## 3. Ortak malzeme paleti (canlı ve aydınlık)

> **28 Ekim 2026 (kullanıcı kararı; bu bölümün tablosunun yerine geçer):** uygulama modellerinin rengi fotoğraftan ölçülür. Tek kaynak `_kutuphane/malzeme-paleti.json` (rol → hex, malzeme eşlemesi, eser istisnaları); ölçüm `_kutuphane/RENK_OLCUM_RAPORU.md`. Aşağıdaki tablo ve «V ≥ 0,80» kuralı yalnız 21 Ekim sürümleri için tarihî kayıttır. Paletin dışında kalan roller (ölçülemeyenler) mevcut renkte durur.
>
> **28 Ekim 2026, gece (geçerli; yukarıdaki kararın yerine geçer):** fotoğraf renkleri haritada cansız bulundu. 21 Ekim pastel renkleri geri geldi. `malzeme-paleti.json`'daki "hex" alanları pastel değerlerdir; fotoğraf ölçümü "foto_olcum" alanında yalnız kayıt olarak durur. Parlaklık ve doygunluk ayarı web'de yapılır (şehir kaydı `harita_isik`).

**21 Ekim 2026 (tek kaynak):** uygulama modelleri büyük yüzeyde «açık ton» sütununu, küçük ayrıntıda «ana» sütununu kullanır; kalın yazılan değerler yedi modelde aynıdır. Ek: kiremit `#D07E57`, sarı sıva `#F2E2A8`, küçük soğan kurşun `#9AA2A7`, kurşun dikiş `#98A1A8`, ahşap kapı `#7A5134`, krem sıva `#E8DFCB`, harç `#E9DFCB`, almaşık düz `#DDBD9C`. Avlu/çıplak zemin dokuları uygulama modelinde `#D2C3A4` ortalamasına açıldı (V ≥ 0,80); kullanıcı 21 Ekim 2026'da onayladı. §1'deki avlu `#B3A590` yalnız sunum/eski sürümlerde kalır, uygulama modelinde (Koza Han v14, Emir Hanı v04 ve diğerleri) geçerli olan `#D2C3A4`'tür. Geniş yüzeyde V ≥ 0,80; pencere, kapı, koyu ahşap, demir bu kuralın dışındadır. **Kurşun da bu kuralın dışındadır (kullanıcı kararı, 21 Ekim 2026):** kurşun `#BCC2C6` (V ≈ 0,78), dokulu kurşun malzemelerinde etkin V biraz daha düşüktür; diğer bütün roller için V ≥ 0,80 aynen geçerlidir.

Kural: **geniş yüzeylerde HSV V ≥ 0,72.** Pencere ve kapı boşlukları, koyu ahşap ve ince bantlar dışında hiçbir geniş yüzey V < 0,55 olamaz. Taş ve tuğlada roughness 0,70 (eski 0,85 değeri ışığı öldürüyor). Kurşunda 0,45 roughness ve 0,20 metallic.

| Rol | Ana | Açık ton | Gölge tonu | Rough / Metal | Kullanım |
|---|---|---|---|---|---|
| Küfeki / kalker taş (sıcak) | `#D8C6A2` | **`#E6D8BA` (uygulama)** | `#C4B08B` | 0,70 / 0 | Bursa erken Osmanlı taş sıraları, kesme taş cephe |
| Kesme taş (Ulu Cami cephesi) | `#D3BE98` | **`#E2D1AF` (uygulama)** | `#BFA982` | 0,70 / 0 | Ulu Cami gövdesi ve doğu minare kaidesi |
| Mermer (beyaz-gri damarlı) | `#ECEAE4` | **`#F5F4F0` (uygulama)** | `#D5D6D2` | 0,40 / 0 | Taç kapı, söve, şadırvan, çeşme, kaide kaplaması |
| Tuğla (canlı) | `#C0683F` | **`#CF7F55` (uygulama; Koza Han #CC7A52, Emir Hanı #B06A4A, Bedesten #C0683F buna birleşti)** | `#A65535` | 0,70 / 0 | Almaşık sıralar, minare gövdesi, kemer |
| Harç / derz (açık) | `#E9DFCB` | — | — | 0,90 / 0 | Tuğla arası. Açık harç tuğlayı canlı gösterir. |
| Almaşık duvar (düz renk ortalaması) | `#CFA986` | `#DDBD9C` | `#B98F6C` | 0,70 / 0 | Doku kullanılmayan uzak yüzeyler |
| Kurşun (kubbe, çatı) | **`#BCC2C6` (uygulama; yedi modelde tek değer, kullanıcı kararı 21 Ekim)** | `#BCC2C6` (büyük yüzeyde de ana ton; `#D6DADD` ve `#C3C9CD` denendi, bırakıldı) | `#AEB6BC` | 0,45 / 0,20 | Bütün kurşun kaplı kubbe ve çatılar. **Mavi/lavanta değil**, gümüşi açık gri. |
| Kurşun dikiş / kaburga | `#98A1A8` | — | — | 0,45 / 0,20 | Kubbe dilim çizgileri (geometri ya da ince şerit) |
| Eskimiş kurşun (küçük soğan kubbe) | `#7D858A` | `#9AA2A7` | `#666D72` | 0,45 / 0,25 | Yalnızca Ulu Cami avlu şadırvanları gibi fotoğrafta koyu görünen küçük örtüler |
| Kiremit | `#C26B43` | `#D07E57` | `#A85A36` | 0,75 / 0 | Kiremit çatı, Orhan revak üst bandı |
| Sarı sıva (yalnızca Ulu Cami kasnakları) | `#EBD58A` | `#F2E2A8` | `#D9C072` | 0,80 / 0 | Ulu Cami foto 009/016'da kasnaklar belirgin sarı |
| Krem sıva / boya | `#E8DFCB` | — | `#D6CBB3` | 0,80 / 0 | Şadırvan kemer panoları, saçak altı |
| Koyu ahşap | `#6B4A3A` (uygulama, en koyu) | `#6B4A3A` | — | 0,75 / 0 | Şadırvan direkleri, korkuluk |
| Ahşap kapı | `#7A5134` | — | — | 0,75 / 0 | Genel kapı kanadı |
| Pencere boşluğu / cam | `#5A6672` (uygulama, 21 Ekim; eski `#3E4A55`) | — | — | 0,30 / 0 | **Saf siyah yasak** (#1F2328 yerine) |
| Demir şebeke / parmaklık | `#4B5654` (uygulama, 21 Ekim; eski `#36413F`) | — | — | 0,60 / 0,30 | Alt pencere ızgaraları |
| Alem | `#C9A13B` | — | — | 0,35 / 0,60 | Tüm alemler |
| Su | `#8CC3C6` | — | — | 0,10 / 0 | Havuz yüzeyi |
| Ağaç yaprağı | `#7FA35B`, `#93B46A`, `#6E9450` | — | — | 0,90 / 0 | Yuvarlak ağaç. Eserde en çok 6 ağaç. |
| Servi | `#3F7A5C` | — | — | 0,90 / 0 | Servi |
| Ağaç gövdesi | `#7A634B` | — | — | 0,90 / 0 | |

**Doku kuralı:** Almaşık ve tuğla dokusu yalnızca küçük tekrar eden karo olur (≤ 128 px, 0,3–1,2 m karo). Renkleri bu tablodan alınır. Doku karosunun ortalama rengi "Almaşık düz renk" satırının ±%8'i içinde kalmalıdır. Daha koyu doku kabul edilmez.

## 4. Ölçek figürleri (insan) — tüm eserler

Ulu Cami v20'deki `Olcek_*` figürleri (renkli giysili, kaba silindirler) **kaldırılır**. Bütün eserlerde aynı figür seti kullanılır.

- **Stil:** mimari maket figürü. Yüz, el ve parmak yok. Yumuşak, sade hacimler. Tek renk gövde.
- **Renkler:** figür başına tek renk, şu üç tondan biri: `#EEE9DF` (kırık beyaz), `#D9D2C5` (açık greige), `#C9C1B3` (greige). Ten, saç ve giysi ayrımı yapılmaz. Rough 0,8.
- **Oran:** baş = boy / 7,5. Omuz genişliği 0,25 H. Bacaklar ayrı ve aşağı doğru incelir. Kollar gövdeye yakın, hafif açılı. Ayaklar küçük oval.
- **Boylar:** erkek 1,72–1,82 m, kadın 1,60–1,70 m, çocuk 1,10–1,30 m.
- **Kadın siluet:** uzun pardösü ya da etek (konik, diz altına kadar) ve baş örtüsü. Baş hacmi %10 büyük ve yuvarlak, omza inen kısa bir etek de eklenir.
- **Pozlar** (en az 4 farklı): ayakta duran, yürüyen (adım açık, bir kol önde), oturan (taburede; şadırvan önünde abdest pozu, gövde öne eğik), basamak çıkan.
- **Bütçe:** figür başına 400–800 üçgen. Kapalı ve manifold hacim. Arka yüz kırmızı testi geçmeli.
- **Ad ve koleksiyon:** `Olcek_Insan_01` … `Olcek_Insan_NN`, koleksiyon `Olcek`. Sunum GLB'sinde ayrı seçilebilir nesneler olarak kalır; uygulama GLB'sinden çıkarılır (§5, madde 5).
- **Yerleşim:** yapının işleviyle ilişkili olmalı (giriş, avlu, şadırvan, çarşı). Sayısı eser planında verilir. Figürler yapı ölçeğini okutmak içindir. Kalabalık sahne kurulmaz.

## 5. Ortak teslim ve doğrulama (her eser, her tur)

1. Üretim klasörü `<eser>/3d/` (`build/`, `blend/`, `export/`, `kontrol/<surum>/`, `README.md`). Dosya ve klasör adlarında araç adı (claude, gpt) geçmez. Betik `build_<surum>.py` adını taşır, girdi ve çıktı dosyalarını başında yazar. Yalnız son sürüm tutulur: yeni sürüm kullanıcı tarafından kabul edilince önceki sürümün blend, GLB ve kontrol dosyaları silinir. Sürüm `3d/README.md` sürüm geçmişi tablosuna bir satır olarak yazılır. Geometri üreten betikler referans kod olarak kalabilir.
2. `A.mesh_kontrol()` temiz olmalı, `A.arka_yuz_render()` kırmızı oranı 8 yönde 0. Rapor JSON'u `kontrol/<surum>/` altına yazılır.
3. Renk denetimi: kullanılan bütün malzemelerin hex/HSV listesi `kontrol/<surum>/renkler.json` dosyasına yazılır. Geniş yüzey malzemelerinde V < 0,72 olan varsa tur bitmemiştir.
4. Render seti: `havadan.png` (standart kamera), kaynak fotoğrafla aynı açıdan en az 2 karşılaştırma (`yan_yana_*.png`, solda fotoğraf, sağda render) ve ayrıntı yakın çekimleri.
5. GLB (20 Ekim 2026, kullanıcı kararı; önceki «figürler dahil» kuralının yerine): iki dosya, Draco açık.
   - `export/<eser>_<surum>.glb` = **uygulama modeli, yalnız yapı.** Zemin yok, çevre yok (`Cevre_*`: ağaç, çevre döşemesi, tarh), insan figürü yok (`Olcek_Insan_*`).
   - `export/<eser>_<surum>_sunum.glb` = **sunum:** kaide, zemin, ağaçlar ve figürler dahil. Dokunulmaz.
   - **Neden:** haritada ve anlatımda çevre ile figürler modelin %5–20'si kadar gereksiz üçgendir (Ulucami %5, Emir Hanı %20); haritanın kendi zemini ve binalarıyla çakışır; küçük ekranda figür birkaç piksel olur. Ölçek ve atmosfer gereken yer sunum dosyasıdır.
   - **Nasıl (her yeni sürümde unutma):** build betikleri normal GLB'yi hâlâ çevre ve figürlerle yazar. Teslimden önce son adım: `GT_DIR=<kurulum klasörü> node eserler/_kutuphane/glb_temizle.mjs eserler/<eser>/3d/export/<eser>_<surum>.glb` (kurulum ve ayrıntı betiğin başında). Betik modeli yeniden üretmez; adı `Cevre_` ya da `Olcek_Insan_` ile başlayan düğümleri siler, artan malzeme ve dokuyu temizler, Draco ile yeniden yazar. Silinecek bir şey yoksa dosyaya dokunmaz.
   - **Denetim:** normal GLB'de bu iki önekle başlayan nesne kalmamalı. Sunum GLB'ye betik çalıştırılmaz (betik reddeder).
   - **Ad kuralı:** çevre öğesi `Cevre_` ile başlamalı, yoksa temizleme onu görmez. İstisna: Koza Han avlusunun ağacı ve çimi (`Avlu_Agac`, `Avlu_Cim`) betikte ayrıca listelidir ve 20 Ekim 2026'da normal GLB'den çıkarıldı. Yeni eserde yeni bir önek kullanılırsa betikteki `HEDEF` ifadesine eklenir; en iyisi baştan `Cevre_` demek.
   - 20 Ekim 2026'da 7 eserin son sürümüne uygulandı (Ulucami v25, Bedesten v05, Koza Han v13, Orhan Bey Camii v06, Orhan Bey Hamamı v04, Emir Hanı v03, Orhan Gazi Türbesi v01). Kalan parçalarda köşe kayması 0 mm, parça adları ve malzemeler aynı; yalnız Draco yeniden yazımında 5 parçadan toplam 372 sıfır alanlı (görünmeyen) üçgen atıldı.
6. Yeni ölçünün her biri kaynak harfiyle yazılır: P rölöve, E envanter, W makale/web, O OSM, M maket, F fotoğraf, T tahmin. Kaynakta olmayan süs uydurulmaz.
7. **OSM yalnız konum ve yön içindir.** Harita pini ve modelin haritadaki dönüklüğü için kullanılır. Ölçü kaynağı olarak P, E, F (ölçeklenmiş plan/fotoğraf) yoksa ve yalnız son çare olarak kullanılır. Gerekçe: Ulu Cami (OSM 70,5 × 60,3 ↔ rölöve 68,7 × 55) ve Koza Han (OSM 51,7 × 59,7 ↔ plan ve foto ≈ 64 × 72) karşılaştırmalarında belirgin sapma çıktı.
