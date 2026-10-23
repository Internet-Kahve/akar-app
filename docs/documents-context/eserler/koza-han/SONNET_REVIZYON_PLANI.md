# Koza Han ve Koza Han Mescidi: Sonnet revizyon planı (v03)

18 Ekim 2026. Bu dosya Koza Han revizyonu için **tek giriş noktasıdır**. Önce `../_GENEL_SAHNE_STANDARDI.md` dosyasını, sonra bunu oku. "KESİN" maddeler kaynakla doğrulanmıştır; uygulanmadan tur kapanmaz.

Hedef: `3d/build/build_v02o.py`'den `build_v03.py` üretmek. Yapılacaklar:

1. Kanat/avlu oranını rölöveye göre düzelt.
2. Mescidi Güler 2020 rölövesine göre yeniden kur.
3. Avluya taş döşeme yollar ve çimenlik ekle.
4. İç Koza'yı basit kütle olarak ekle.
5. Paleti, zemini ve figürleri genel standarda bağla.

v01b'deki "geometri dondurma" bu tur için **kullanıcı kararıyla kaldırılmıştır**; kütle değişir.

---

## 0. Klasör haritası: neyi oku, neyi okuma

| Yol | Durum | Not |
|---|---|---|
| `SONNET_REVIZYON_PLANI.md` | **OKU (ana)** | Bu dosya |
| `../_GENEL_SAHNE_STANDARDI.md` | **OKU (ana)** | Zemin, ışık, palet, figür, teslim kuralları |
| `koza-han_notlar.md` | Destek | §1 güncel kararlar, §2 kaynaklar, **§3 ölçü analizi**, §4 alt birimler. Sondaki "Ek: Geçmiş kayıt" değerleri **geçersiz**. |
| `eser.md` | Destek | Kaynaklı ölçü tablosu. «Dış ölçü (2)», «Kanat derinliği», «Avlu ölçüsü (2)», «Avlu mescidi (5)» satırları güncel. |
| `ref/plan/canbakis_pdf045_koza-han_plani_demiralp2021.png` | **KAYNAK (P-oran)** | Alt/üst kat planı, ölçeksiz; avlu 38 × 46 ile ölçeklenir. Mescit yönü bu çizimde ters, kullanma (§2.3). |
| `ref/plan/guler2020_pdf020…022_*` | **KAYNAK (P)** | Mescit alt kat planı, batı cephesi, üst kat planı, A–A kesiti; ölçek çubuklu ve kotlu |
| `ref/plan/alan-baskanligi_pdf021_vaziyet.jpg` | KAYNAK | Koza Han + İç Koza konumu |
| `ref/foto/kozahan_arsiv_010_havadan_dik_tum_yapi.jpg` | **KAYNAK (F)** | 2024 dik drone fotoğrafı: oran, çatı bantları, mescit yönü |
| `ref/foto/kozahan_arsiv_042…043_*`, `mescit_*`, `Kozahan Mescid.jpg`, `guler2020_pdf014_*` | KAYNAK (F) | Mescit görünüşü, merdiven, kubbe |
| `ref/foto/avlu2026_*`, `canbakis_pdf047_havadan_dik_avlu.jpg` | KAYNAK (F) | Avlu zemini, çim tarhları, ağaçlar |
| `ref/foto/portal_*`, `pencere_ref.webp`, `baca_ref.webp`, `avlu_ust_kat_*`, `havadan_1.webp` | Destek | v02 detay turlarının referansları; portal, pencere ve baca **korunur** |
| `ref/plan/tasarim_*` | Destek | Tasarım sorumlusunun portal çizimleri (dokularda kullanılıyor) |
| `ref/metin/*.md` | KAYNAK | Metin çıkarımları; kaynak ve sayfa başlıklı |
| `ref/kaynak_dizini.json` | Kayıt | Her dosyanın kaynağı, sayfası, SHA-256 değeri |
| `3d/build/build_v02o.py` | **KOD TEMELİ** | P tablosu ve bütün geometri. Kopyala → `build_v03.py`. |
| `3d/build/doku/doku_uret.py` | Kod | Doku karoları; renkleri §5'e göre değişir |
| `3d/README.md` | Destek | Sürüm geçmişi, bilinen sınırlar |
| `ref/maket/model3d_*` | **KULLANMA (ölçü)** | Başka 3D model görüntüleri; ölçü kaynağı değil |

Eksenler: +X doğu, +Y kuzey (portal), +Z yukarı; orijin ana avlunun ortası (mescit ekseni). Mevcut nesneler: `Govde_Dis`, `Cephe_Kuzey/Guney/Dogu/Bati`, `Avlu_Revak`, `Avlu_Cephe`, `Silme_Kat`, `Cati`, `Kubbe_Avlu`, `Baca`, `Portal`, `Avlu_Mescit`, `Avlu_Zemin`, `Zemin`, `Zemin_Golge`.

---

## 1. KESİN: kanat derinliği ve dış ölçü

v02o'da dış ölçü OSM'den (51,7 × 59,7), avlu föyden (38 × 46) alınmış. Kanat 6,85 m kalmış; bu derinliğe 3,40 m revak ve odalar sığmıyor. Kullanıcının "duvarlar çok ince, avlu çok geniş" gözleminin nedeni bu. İki bağımsız kaynak kanadı ≈ 13 m gösteriyor (`koza-han_notlar.md` §3):

| Ölçü | Kaynak | v02o | **v03** |
|---|---|---|---|
| Açık avlu (kısa × uzun) | E: föy N19 «46 x 38 metre iç ölçü» | 38 × 46 | **38,0 × 46,0** (değişmez) |
| Kanat (dış duvar dış yüzü → avlu kenarı) | H: Demiralp planı 13,0; F: dik foto 12,7 | 6,85 | **13,0** |
| Dış ölçü | H | 51,7 × 59,7 | **64,0 × 72,0** (`dis_dx`, `dis_dy`) |
| Revak derinliği (net) | E: föy «yaklaşık 3.40 metre»; plan 3,35 | 3,0 | **3,40** |
| Revak ayağı (avlu tarafı, derinlik) | H: plan ≈ 1,6 | 0,9 | **1,6** (±0,3) |
| Oda derinliği (net) | H: plan ≈ 5,6 | ≈ 3,85 | **5,6** |
| Dış duvar / oda–revak duvarı | H: plan ≈ 1,4 / ≈ 1,0 | — | **1,4 / 1,0** |

Kanat toplamı: 1,4 + 5,6 + 1,0 + 3,4 + 1,6 = **13,0 m**. Avlu kenarı = revak ayaklarının avluya bakan yüzü.

**Değişmeyenler:** kat yükseklikleri (alt 5,0, üst 4,5; T), kubbe ve avlu kemeri sayısı (kısa kenar 9, uzun 11, köşe 4), portal kütlesi (18 × 4,8 m; plan 18,3 × 4,8 ile uyumlu) ve portal yüzünün bütün ayrıntıları (halat, örgü, köşelik, kapı 7,8 m), pencere ve baca tipleri.

**Dış cephe oda ritmi** (P-oran, plan): her cephede **11 normal oda + 2 köşe odası**. Oda adımı kısa kenarda ≈ 4,5 m, uzun kenarda ≈ 4,35 m. Föye göre üst katta **her odada dışa açılan 2 pencere** var (E: «Üst katta her odanın dışa açılan ikişer penceresi bulunmakta»). Pencere tipi, alınlık ve eşit aralık kuralı v02b–v02e'deki gibi; adım = oda adımı / 2. `cephe_oda_x`/`cephe_oda_y` buna göre yeniden hesaplanır. Kuzey cephede portal kütlesinin kapladığı odalarda dış pencere yoktur; portal önü ve yan pencere kuralları v02o'daki gibi.

**Çatı bantları** (F: dik foto, `kozahan_arsiv_010`; dıştan avluya): saçak şeridi 0,8 → **cephe boyunca beşik tonoz (kabarık) ≈ 5,0 m genişlik**, tepesinde dış baca sırası (oda başına 1) → **vadi ≈ 1,6 m**, kubbe başına 1 baca → **kubbe sırası ≈ 4,8 m** (kubbe tabanı ≈ 4,2 × 4,5, yuvarlağa yakın) → avlu korkuluğu. Toplam ≈ 13,0 m (saçak 0,8 + tonoz 5,0 + vadi 1,6 + kubbe 4,8 + avlu korkuluğu ≈ 0,8). Köşelerde v02o'daki köşe kubbesi ve köşe bacası düzeni korunur. Tonoz yüksekliği genişlikle orantılı artar: ≈ 1,6 m (T).

**Doğu geçidi:** doğu cephesinde İç Koza'ya açılan 3,66 m genişliğinde geçit (E: C2 PDF 9 «3,66 m genişliğinde bir geçişle»). Konumu: geçit, İç Koza avlusunun ekseninde (§4).

Doğrulama: `olcu_dogrulama.json` içinde dış 64,0 ± 0,1 × 72,0 ± 0,1, avlu 38,0 × 46,0, kanat 13,0. `yan_yana_havadan_dik.png`: aynı ölçekte üstten ortografik render ile `kozahan_arsiv_010` fotoğrafı yan yana; avlu/kanat oranı ±%5.

## 2. KESİN: Koza Han Mescidi (yeniden kur)

Kaynak: Güler 2020 rölövesi (P) — `ref/plan/guler2020_pdf020_mescit_alt_kat_plani.png` (83,2 px/m), `…pdf021_mescit_bati_cephesi.png` (48 px/m), `…pdf021_mescit_ust_kat_plani.png` (66,8 px/m), `…pdf022_mescit_AA_kesiti.png` (96 px/m). Metin: `ref/metin/envanter_c1_mescit.md` (E, C1 PDF 195), `ref/metin/guler2020.md`. Fotoğraf: `kozahan_arsiv_042`, `_043`, `mescit_1…4`, `guler2020_pdf014_mescit_fotograf10.jpg`.

### 2.1 Kotlar (kesit ve cephedeki kot etiketleri; z = avlu zemini)

| z (m) | Eleman |
|---|---|
| 0,00 | Avlu zemini; havuzun çevresinde mermer döşeme |
| 0,78 | Havuz kenarı (16 kenarlı şadırvan havuzu) ve ayak kaidelerinin üstü |
| 2,00 | Alt kat kemer üzengisi; orta ayağın mukarnas başlığı |
| ≈ 2,9 | Yuvarlak kemerlerin tepesi |
| 3,50 | Üst kat döşemesi; kemer kuşağının üstü (kesme taş bant) |
| 5,00 / 5,27 | Pencere üstü / sivri alınlık başlangıcı (kot etiketleri; kesitte pencere 3,57–4,93, alınlık ≈ 5,2–5,9) |
| 5,96 | Kapı üstü (yorum) |
| 6,98 | Saçak ve kubbe eteği |
| ≈ 9,6 | Kubbe tepesi |
| ≈ 10,5 | Alem tepesi |

v02o: alt 4,0, gövde 3,6, kubbe 2,8 (T). v03'te alt kat = üst kat ≈ 3,5 m; fotoğraflarda da iki kat eşit görünür.

### 2.2 Alt kat: ayaklar, kemerler, havuz
- **8 ayak**, merkezleri R = **3,27 m** çemberinde, sekizgenin köşelerinde. Kesit: plan çiziminde dışa sivri **beşgen**, ≈ 0,66 m (envanter "altıgen" der; P seçildi). Alt ≈ 1,0 m beyaz mermer (`#ECEAE4`, F: fotoğraflar), üstü kesme taş. v02o: R 3,6, altıgen r 0,45.
- Ayaklar arasında 8 **yuvarlak kemer** (E: «yuvarlak kemerlere oturmaktadır»), üzengi 2,00, tepe ≈ 2,9; kemer kuşağı 2,9–3,50 kesme taş. Kemerler açık; içeriden şadırvan görünür (fotoğraflar).
- **Orta ayak:** havuz ortasında sekizgen gövde (Ø ≈ 0,5; basamaklı kaide Ø ≈ 0,85; P: kesit ve alt kat planı), 2,00'de mukarnas başlık (E: «sekiz kenarlı, stalaktik başlıklı bir ayak»), her yüzünde bir boru (E). Başlık üstte tavana (üst kat döşemesi) bağlanır.
- **Havuz:** 16 kenarlı (E: «on altıgen şekilli bir şadırvan»), dış Ø ≈ **5,65 m**, kenar 0,78 m, cidar 0,20; alt kenarlarda musluklar (E); su `#8CC3C6` kenardan 0,12 aşağıda. v02o'daki R 4,6 havuz ayakların dışına taşıyordu; **havuz ayak çemberinin içinde kalır**.
- Taban: ayakların dış yüzünden (Ø ≈ 6,7) 0,5 m taşan 16 kenarlı mermer döşeme halkası (Ø ≈ 7,7; h 0,15).

### 2.3 Üst kat ve yön
- **Gövde:** düzgün sekizgen, dış Ø **6,78 m** yüzden yüze, duvar 0,66 m, 3,50–6,98. Kesme taş, açık krem (`#E6D8BA` ana, `#D8C6A2` derz tonu); fotoğraflarda bütün mescit açık renk kesme taş.
- **Yön (KESİN):** sekizgenin düz yüzleri han eksenlerine paralel (K, D, G, B). **Kapı ve merdiven kuzeybatı köşegen yüzünde**, **mihrap güneydoğu köşegen yüzünde** (kıble; dışta penceresiz). Kaynak: F, `kozahan_arsiv_010` dik foto. Portal kuzeyde, İç Koza doğuda iken merdiven kuzeybatıya uzanıyor. v02o'da kapı kuzey yüzündeydi; bu değişir.
- **Pencereler:** kalan 6 yüzde 1'er (E: «Diğer altı köşede ise alçı pencereler»): dikdörtgen ≈ 0,55 × 1,35 m (z ≈ 3,57–4,93; P, kesit), dışta demir parmaklık, üstünde sivri kemerli alınlık (z ≈ 5,2–5,9), içi beşgen petek şebeke (E: «beşgenlerden oluşan petekle bezenmiştir»). Mevcut `petek.png` ve `pencere.png` dokuları kullanılır.
- **Kapı:** kuzeybatı yüzünde ahşap kapı (`#7A5134`), 3,50–5,96, genişlik ≈ 1,0 m; önünde merdiven sahanlığı.
- **Saçak:** 6,98'de 0,10 m kalın, ≈ 0,16 m taşan korniş.

### 2.4 Kubbe (KESİN, kesit)
- Gövdeden dar: kubbe gövdesinin en geniş Ø ≈ **5,6 m** (z ≈ 7,5). Tabanında dışa açılan **çan eteği**: eteğin alt kenarı z 6,98'de Ø ≈ **7,1 m**, içbükey profille gövdeye bağlanır (kesitte belirgin).
- Yükseliş: 6,98 → ≈ 9,6 (2,6 m). Profil yarım küreye yakın, tepede hafif basık.
- Kurşun kaplı (E), açık kurşun `#C3C9CD`, 24 düşey dikiş (`#98A1A8`, 0,03 m kabarık). Alem: pirinç `#C9A13B`, boğumlu, 9,6 → 10,5, tepede hilal (v02j'deki alem korunur).
- v02o kubbesi gövde genişliğindeydi ve basıktı; bu değişir.

### 2.5 Merdiven (KESİN)
- Kuzeybatı yüzündeki kapıya **dik**, düz tek kol; dışa doğru (kuzeybatıya) iner. Tamamı beyaz mermer (E: «On dört basamaklı mermer merdiven»).
- **14 basamak**: rıht 0,25 m (3,50 / 14), basamak derinliği ≈ 0,35 m, yatay uzunluk ≈ **4,94 m** (P, üst kat planı); toplam genişlik **2,47 m** (korkuluklar dahil), net ≈ 2,0 m.
- Korkuluk: iki yanda ≈ 0,9 m, mermer, **geometrik şebekeli** (E). Mevcut `petek_korkuluk.png` dokusu kullanılır.
- Merdiven altı: batı cephesi çiziminde (`pdf021_mescit_bati_cephesi`) merdivenin altında **kemerli boşluk** ve dolu taş yüzey var; v02k'deki çeyrek elips boşluk korunur, ölçüsü yeni uzunluğa göre ayarlanır. Üst kat planında merdivenin iki yanında 4 çift dikme görülür; modelde gerekmez.
- Sahanlık: kapı önünde ≈ 1,2 × 2,47 m, z 3,50.

Bütçe: mescit ≤ 5 000 üçgen. Kontrol: `yan_yana_mescit_kesit.png` (yandan ortografik render ile `guler2020_pdf022` yan yana, kotlar çizili), `yan_yana_mescit_foto.png` (`kozahan_arsiv_043` açısı).

## 3. KESİN: avlu zemini ve peyzaj

Kaynak: F, `ref/foto/avlu2026_*` (2026 avlu fotoğrafları), `canbakis_pdf047_havadan_dik_avlu.jpg`, `kozahan_arsiv_010`. Fotoğraflarda gri parke taş döşeme, mescit çevresinde dairesel desen, mescide giden yollar, kenarlarda alçak ahşap çitli çim tarhları ve çınarlar görülüyor. Aşağıdaki yerleşim bu fotoğraflardan stilize edilmiştir (F/T); kesin ölçülü değildir.

- **Döşeme:** bütün avlu parke taş, `#B3A590` (genel standart avlu rengi), ince derz karosu `#A69A86` (0,4 m kare ızgara, 1 mm kabarık). `Avlu_Zemin` krem `#E9E3D3` kaldırılır.
- **Mescit halkası:** mescit merkezli Ø 16 m daire, kenarında 0,3 m açık taş bordür (`#D2C3A4`); içi daire desenli parke (aynı renk, radyal derz).
- **Yollar:** halkadan dört yöne 3,5 m genişlikte yol: kuzeyde portal kapısına, güneyde güney kapısına (E: föy «güneydeki açık alana … kapıları»), doğuda İç Koza geçidine (3,66 m), batıda batı revak ortasına. Yol kenarları 0,2 m bordür (`#D2C3A4`).
- **Çim tarhları:** yolların ayırdığı dört çeyrekte birer tarh; revak ayaklarından 3,0 m içeride (dolaşım payı), köşeleri 1,5 m pahlı. Çim `#9DB86A`. Tarh çevresinde 0,45 m alçak ahşap çit (`#7A5134`, dikme + iki kayıt, düşük poligon).
- **Ağaçlar:** genel standart en çok 6. Çeyrek tarhlarda 4 çınar (yuvarlak taç, yaprak `#7FA35B`/`#93B46A`, gövde `#7A634B`, h ≈ 12 m). Taçlar revak kubbelerini kapatmasın; taç Ø ≤ 7 m.
- Bütçe: avlu ≤ 2 500 üçgen.

## 4. KESİN: İç Koza Hanı (basit kütle, yeni)

Kullanıcı kararı (18 Ekim): yalnız kütle; ayrıntı yok. Kaynaklar: E: C2 PDF 9–10, 21 (`ref/metin/envanter_c2.md`); E: föy N19; H: vaziyet planı (`ref/plan/alan-baskanligi_pdf021_vaziyet.jpg`, Koza Han ayak iziyle ölçeklendi); F: `kozahan_arsiv_010`.

| Özellik | Değer | Kaynak |
|---|---|---|
| Konum | Hanın **doğu cephesine bitişik** (x = +32,0'dan doğuya); kuzey kenarı hanın kuzey cephesinden ≈ 4,5 m güneyde | E (C2 PDF 9: «han binasına doğudan bitişiktir»); H (vaziyet) |
| Dış ayak izi | ≈ **44 (doğu–batı) × 49 (kuzey–güney) m**, basitleştirilmiş dikdörtgen | H (vaziyet; ±3 m) |
| Açık avlu | **22 × 30 m** (doğu–batı × kuzey–güney), ayak izinin ortasında | E: C2 PDF 10 ve föy «22 x 30»; C2 PDF 21 «28 × 30» der (çelişki; iki kaynak seçildi); vaziyette ≈ 24 × 32 |
| Kat | Tek kat, saçak ≈ 4,5 m (T) | E: «Tek katlı olan ahır yapısı» |
| Avlu tarafı | Kemerli revak: kuzey, batı ve güney kenarlarda açık sivri kemerler; **doğu kenarındaki kemerler örülmüş** (dolu duvar, kemer izi dokuda) | E: C2 PDF 21 «doğu cephesindeki kemerlerin … sonradan örülerek duvarla kapatıldığı»; 18 paye |
| Çatı | Kanatlar üzerinde avluya ve dışa eğimli kırma çatı, kiremit `#C26B43` | E: «ahşap çatılı ve kiremit örtülü kemerleri» |
| Duvar | Almaşık, ana hanla aynı malzeme | T |
| Geçit | Hanın doğu duvarında 3,66 m açıklık → İç Koza avlusunun batı kenarına | E |

- Nesne adı `Ic_Koza`; ayrı seçilebilir. Ana handan düşük ve sade kalır; vurgu yok. Bütçe ≤ 3 000 üçgen.
- Avlusu düz taş döşeme (`#B3A590`); içinde mescit/şadırvan yok (E: C2 PDF 21 fotoğrafı). İsteğe bağlı 1 çınar (vaziyet planında ağaç işaretleri var). Ağaç toplamı 6'yı geçmez.

## 5. KESİN: renk, doku ve zemin (genel standarda geçiş)

| Malzeme / doku | v02o | **v03** | Not |
|---|---|---|---|
| `almasik.png` (dış duvar, alt kat avlu cephesi, revak ayakları) | pembe-gri taş + kızıl tuğla | taş `#D8C6A2` / `#E6D8BA`, tuğla `#C0683F` / `#CF7F55`, harç `#E9DFCB` | `doku_uret.py → almasik()` renkleri değişir. Karo ortalaması `#CFA986` ± %8. Canbakış: alt kat moloz taş + tuğla, üst kat kesme taş almaşık. |
| `kesme_tas.png` (üst kat avlu yüzü, mescit gövdesi) | `#D8D2C6` gri | `#E6D8BA` ana, `#D8C6A2` ikinci ton | Mescit ve avlu üst katı açık krem |
| `Duvar_Almasik` taban rengi | `#C9BCA5` | `#CFA986` | |
| `Cati_Kursun` (tonoz, kubbeler, portal kubbeleri) | `#9AA1A6` | `#C3C9CD` | Genel standart kurşun |
| `Sacak` | `#6E7275` | `#AEB6BC` | Geniş yüzey V ≥ 0,72 |
| `Kursun` (mescit kubbesi) | `#B4BCC2` | `#C3C9CD` + dikiş `#98A1A8` | |
| `Tugla`, `Baca_Tugla` | `#C97C60` | `#C0683F` | `baca.png` aynı tonla yeniden üretilir; baca külahı `#8E9498` |
| `Mermer_Beyaz` | `#F4F2EE` | `#ECEAE4` | |
| `Kapi` (boşluk/cam) | `#1E1F21` | `#3E4A55` | `pencere.png` siyah cam → `#3E4A55`; parmaklık `#36413F` |
| `Ahsap` | `#6B4A33` | `#7A5134` | |
| `Cini_Mavi` (portal köşeliği) | `#4F9BD0` | **değişmez** | Vurgu; tasarım çizimi |
| `Portal_On` | `#D9CDB6` | `#E2D1AF` | Doku renkleri açık kesme taşa çekilir |
| `Avlu_Zemin` | `#E9E3D3` | `#B3A590` + derz | §3 |
| `Zemin` (kaide diski) | çim `#A0B46C` | **`#C4BDAF`**, yan yüz `#A39A8B` | Genel standart §1 |
| `Zemin_Golge` (pembe elips) | var | **silinir** | Genel standart |

Işık ve render ayarları genel standart §2'deki gibidir (Ulu Cami ayarları). Şeftali arka plan kaldırılır, kontrol render'ları saydam olur. AO tabanı 0,70.

## 6. KESİN: insan figürleri

Genel standart §4'e göre **10 figür**: portal önünde 2; avluda yollarda yürüyen 3; mescit altında şadırvan taburesi yanında oturan 1 (abdest pozu); mescit merdiveninde çıkan 1; üst kat galerisinde korkuluk önünde 2; İç Koza avlusunda 1. Dördü kadın siluetinde, biri çocuk. Bütçe ≤ 6 000 üçgen.

## 7. Teslim (v03)

1. `3d/build/build_v03.py` (`build_v02o.py`'den kopya; `SURUM = "v03"`, başlık yorumu ve P tablosu güncellenir; her yeni değerin yanında kaynak harfi). Çıktılar: `3d/blend/koza-han_v03.blend`, `3d/export/koza-han_v03.glb`, `3d/export/koza-han_v03_sunum.glb` (kaideli), `3d/kontrol/v03/`. Dokular `doku_uret.py` ile yeniden üretilir.
2. Üçgen bütçesi: toplam ≤ 48 000 (han ≤ 32 000, mescit ≤ 5 000, İç Koza ≤ 3 000, avlu ≤ 2 500, figürler ≤ 6 000). Draw call ≤ 60.
3. Zorunlu render'lar:
   - `havadan.png` (standart kamera)
   - `yan_yana_havadan_dik.png` (§1)
   - `yan_yana_mescit_kesit.png` ve `yan_yana_mescit_foto.png` (§2)
   - `avlu_genel.png` (`avlu2026` fotoğraflarına yakın açı)
   - `ic_koza.png` (doğudan)
   - `portal.png` (değişmediğini göster)
4. `3d/kontrol/v03/olcu_dogrulama.json`: dış ölçü, avlu, kanat; mescit kotları (0,78 / 2,00 / 3,50 / 6,98 / tepe), ayak çemberi, gövde Ø, kubbe etek Ø, merdiven basamak/uzunluk/genişlik ve kapı yüzü yönü; İç Koza ayak izi; figür boyları.
5. Genel standart §5'teki mesh, arka yüz ve renk denetimleri.
6. **Kapanış (Sonnet yapar, kullanıcı v03'ü kabul ettikten sonra):**
   - `3d/README.md`: sürüm geçmişine v03 satırı (uygulanan değerler, plandan sapmalar ve nedenleri, üçgen); "Güncel sürüm" ve "İçerik" bölümleri v03'e göre. Ayrı rapor dosyası açılmaz.
   - v02o'nun blend, GLB ve `kontrol/v02o/` dosyaları ile `build_v02o.py` silinir (yalnız son sürüm tutulur; `doku/` ve `araclar/` kalır).
   - `koza-han_notlar.md` §1: "v03" durumuna geçen satırlar güncellenir; mescit kot tablosu, avlu yerleşimi ve İç Koza değerleri kısa alt bölüm olarak eklenir.
   - `eser.md`: yalnız yeni kaynak ölçüsü varsa kaynak harfiyle işlenir; model değerleri yazılmaz.
   - Son adım: bu dosya (`SONNET_REVIZYON_PLANI.md`) silinir.
