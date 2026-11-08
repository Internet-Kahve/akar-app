# Orhan Bey Camii · hikâye

19 Ekim 2026. Kaynak önceliği: Bursa Vakıf Eserleri Envanteri (Vakıf Katılım'ın sağladığı kaynak). `E cilt-N PDF s.X` = envanter kitabının **PDF sayfası**. Güven sütunu **öneridir**; son kararı Muhammed verir. Vurgu adları `3d/export/orhan-bey-camii_v07.glb` içindeki nesne adlarıdır (22 Ekim 2026'da kontrol edildi). Seçim kuralları: `../../../ICERIK_YONTEMI.md`.

Rota eseri: 8 cümle (~1 dk). 30 Ekim 2026 (model v11, iç mekân): 7. cümlenin vurgusu dıştaki `Cami_Mihrap`'tan alçı mihrabın kendisine (`Ic_Mihrap`) alındı ve «İç mekân (3D)» sütunu eklendi; yalnız 7. cümlede «evet» (örtü kalkar). Sütunun anlamı: `../../ulu-cami/icerik/hikaye.md`. Klasör adı `orhan-bey-kulliyesi`; içerik caminindir. Hamam ve Emir Hanı kendi klasörlerinde.

| # | Cümle (TR) | Fotoğraf | Kart | Vurgu (3D) | Kaynak | Güven (öneri) | İç mekân (3D) |
|---|---|---|---|---|---|---|---|
| 1 | Orhan Camii'ni, Osman Bey'in oğlu Orhan Bey yaptırdı. | 01_dis-havadan.jpg | hayır | Kubbe_Ana | E cilt-1 PDF s.96 | Doğrulanmış | hayır |
| 2 | Cami, külliyesiyle birlikte 1339–40 yılında inşa edildi. | 04_tepeden.jpg | hayır | — | E cilt-1 PDF s.96 | Doğrulanmış | hayır |
| 3 | Külliyeden bugüne cami, Emir Hanı ve Orhan Hamamı ulaştı. | 04_tepeden.jpg | hayır | — | E cilt-1 PDF s.96 | Doğrulanmış | hayır |
| 4 | 1360 tarihli vakfiyeyle Orhan Hamamı, külliyenin imaretine vakfedildi. | 10_akar-orhan-hamami.jpg | evet | — | E cilt-1 PDF s.97, s.104 | Doğrulanmış | hayır |
| 5 | 1413'teki Karaman kuşatmasında yanan cami, 1417'de yeniden yapıldı. | 09_cumle-kapisi.jpg | evet | Cami_SonCemaat | E cilt-1 PDF s.97 | Doğrulanmış | hayır |
| 6 | Son cemaat yerinin yanları, ikişer kemerle dışarıya açılır. | 05_revak-ikiz-kemer.jpg | hayır | Cami_SonCemaat | E cilt-1 PDF s.98 | Doğrulanmış | hayır |
| 7 | Alçı mihrabı, Bursa'da sonra yapılan sultan camilerine örnek oldu. | 03_mihrap.jpg | evet | Ic_Mihrap | E cilt-1 PDF s.102 | Doğrulanmış | evet |
| 8 | Avludaki şadırvan, 2020–2023 restorasyonunda özgün haline kavuşturuldu. | 08_avlu-sadirvan.jpg | hayır | Sadirvan | E cilt-1 PDF s.103 | Doğrulanmış | hayır |

## Notlar

- **Cümle 4 (akar):** Vakfiye (C1 s.97) «Eski Bedesten, bedestenin bitişiğindeki ve çevresindeki dükkânlar, odalar, evler ile Bıçakçılar Hamamı, Orhan Gazi İmareti'ne vakfedilmiştir»; C1 s.104 «Bıçakçılar Hamamı (Orhan Hamamı)». Fotoğraf hamamın girişidir, başlığında «Orhan Bey Hamamı» yazar.
- **Cümle 5:** Cümle kapısı üzerindeki onarım kitabesi H. 740 / 1339-40 ile H. 820 / 1417 tarihlerini verir (C1 s.97). Kart fotoğrafı kapıyı gösterir.
- **Cümle 7:** Kitap «selatin camileri» der; cümlede «sultan camileri» olarak sadeleştirildi. «Muhteşem» gibi övgüler alınmadı.
- **Cümle 8:** Şadırvan v06'da modele eklendi (`Sadirvan`); vurgu bu parçaya bağlandı. Fotoğraf modelin de gösterdiği dış görünüş olduğu için kart «hayır» yapıldı (20 Ekim 2026).
- **Vurgu adları** `orhan-bey-camii_v06.glb`'den (v07'de aynı, 22 Ekim 2026): `Kubbe_Ana`, `Cami_SonCemaat`, `Revak_Kemerler`, `Cami_Mihrap`, `Sadirvan`. İlk dördü v05'teki adlarla aynı.

## Açı

Hedef parça, azimut (0 = kuzeyden bakış), eğim ve uzaklık (1 = bütün model kadrajda, küçüldükçe yakın). 4 Kasım 2026: fotoğraflara ve tanıtım sayfasına göre yakın ve alçak açılar.

| # | Hedef | Azimut | Eğim | Uzaklık |
|---|---|---|---|---|
| 1 | Merkez | 13° | 26° | 0.5 |
| 2 | Kubbe_Ana | 40° | 40° | 0.45 |
| 3 | Merkez | 300° | 30° | 0.55 |
| 4 | Merkez | 120° | 30° | 0.6 |
| 5 | Cami_SonCemaat | 50° | 10° | 0.15 |
| 6 | Cami_SonCemaat | 240° | 8° | 0.16 |
| 7 | Ic_Mihrap | 13° | 10° | 0.1 |
| 8 | Sadirvan | 180° | 3° | 0.2 |
## Akar akışı

Bu cümlelerde anlatım sahnesi kenara çekilir, haritada gelir veren yapıdan gelir alana altın bir yay çizilir (`design/test-redmi9t-v2/app.js` → `akisUygula`). Hayrat sütununa eser kimliği ya da «enlem, boylam» yazılır. Etikete yalnız kaynağın söylediği yazılır; envanterde olmayan gider kalemleri (bakım, aydınlatma vb.) eklenmez.

| # | Akar (gelir veren) | Hayrat (gelir alan) | Hayrat adı | Etiket | Kaynak | Güven |
|---|---|---|---|---|---|---|
| 4 | orhan-bey-hamami | orhan-bey-kulliyesi | Orhan Gazi İmareti (bugün yok) | 1360 vakfiyesi · gelir → imarete | E cilt-1 PDF s.97, s.104 | Doğrulanmış |

İmaret günümüze ulaşmadı ve yeri kitapta yok (C1 s.96); yay külliyenin bugünkü camisine çizilir, kart «Orhan Gazi İmareti (bugün yok)» der.
