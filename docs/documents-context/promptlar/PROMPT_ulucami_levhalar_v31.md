# Ulucami v31 · levhaları fotoğraftaki gibi çeşitlendir ve ayrıntılandır (3D)

29 Ekim 2026. v30 onaylandı. Bu iş v31 olarak yapılır; v30 dosyalarına dokunma, v30 blend'ini açıp `ulu-cami_v31.blend` olarak kaydet.

## Sorun

v30'da 62 paye levhası + 2 büyük levha, `build/doku_ic_v30/levhalar.jpg` atlasındaki **3 hücreden** besleniyor (22, 23, 07). Hücre 0 (22) ve hücre 2 (07) ikisi de **vav**. Sonuç: içeride hangi duvara bakılsa vav görünüyor. Gerçekte Ulucami'de vav birkaç tanedir; payelerdeki levhaların çoğu farklı istifler, yatay yazılar ve yuvarlak madalyonlardır.

## Kaynak fotoğraflar (`eserler/ulu-cami/icerik/foto/`)

Önce bunlara bak, levha türlerini çıkar:
- `27_ic-paye-levhalar.jpg`: payelerde dikey levhalar; her levhanın üstünde oymalı, kahve-altın **taç (tepelik)**; levhalar ayrı tahta değil, payenin yüzüne çizilmiş gibi düz ve geniş.
- `29_ic-kubbe-paye.jpg`: aynı payenin farklı yüzlerinde farklı levhalar (dikey istif, daire istif); sol duvarda siyah zeminli yuvarlak madalyon; sol altta büyük tuğra biçimli yazı.
- `20_hat-duvar.jpg`: kemerlerin üstünde **yatay** büyük levha ve altında küçük yatay levha; ince koyu çerçeve.
- `21_hat-levha.jpg`, `22_hat-levha-buyuk.jpg`, `23_minber-yandan.jpg`, `02_ic-genel.jpg`, `34_ic-genel-2.jpg`, `26_ic-kemerler.jpg`: ek levha ve yer bilgisi.
- `07_hat-vav.jpg`: kıble duvarında mihrabın sağındaki vav; yeri doğru, **tek** kalsın.

## İstenen

1. **Yeni atlas** `build/doku_ic_v31/levhalar.jpg`: fotoğraflardan **en az 10 farklı levha** kırp (dikey istif, daire istif, yatay yazı, yuvarlak madalyon, iki vav). Perspektifi düzelt (dört köşeden düzleştir), ışık farkını eşitle, zemin kremini aynı tona çek. Boyut en çok 2048 × 1024, JPEG q80. Doku sayısı artmasın: eski atlasın yerine geçer. Her hücrenin kaynağını ve kırpma koordinatını `build/doku_ic_v31/kaynak.json`'a yaz.
2. **Dağıtım kuralı:**
   - Vav yalnız iki yerde: kıble duvarındaki (07, yeri doğru) ve 22'nin büyük vavı (tek paye yüzü; yeri bilinmiyorsa T).
   - Aynı payenin dört yüzü birbirinden farklı. Yan yana iki payenin karşılıklı yüzlerinde aynı levha olmasın. Bir hücre en çok 8 kez kullanılsın.
   - Kemer üstlerine ve duvarlara yatay levhalar (20), duvarlara birkaç yuvarlak madalyon (29). Sayı ve yerler temsili (T). README'de böyle yaz.
3. **Ayrıntı (geometri):**
   - Paye levhasının üstüne **taç**: oymalı tepeliğin siluetini 27'den çıkar, alçak poligonlu ekstrüzyon ya da alfa-maskeli düzlem (alphaMode MASK) yap. Renk `kundekari_cita` / `minber_altin` yakını; yeni renk gerekirse 27'den ölç, paletteki rolü ekle.
   - Levhaların çerçevesi ince koyu çizgi (20'deki gibi), paye yüzünden çok az önde (2–3 cm); kalın tahta kutu değil.
   - Madalyonlar daire, siyah ya da koyu zemin, altın kenar.
4. **Yapay zekâyla Arapça hat üretme**, yazıyı elle çizme. Yalnız fotoğraf kırpması kullan. Fotoğrafta bulunmayan yazı olmaz.
5. **Sınırlar:**
   - Sunum en çok 139 152 üçgen (v30: 112 402), doku 15'i geçmesin, çizim çağrısı 130'dan çok artmasın (taç ve madalyon için malzemeleri birleştir).
   - Harita GLB'si değişmesin (Levhalar `ic_parcalar`'da). Dış eşitlik ≤ %0,06.
   - Parça adları aynı kalsın (`Levhalar`); taç ayrı parça olacaksa `Levha_Taclari` adıyla `ic_parcalar`'a ekle.
6. **Kontrol** `kontrol/v31/`:
   - `levhalar.png`: alçak açıdan, kemerler gizli değil; 27 ve 29 ile aynı açıdan yan yana (model | fotoğraf). Bir de payelerin arasından mihraba bakan geniş görüntü.
   - `ic_detay.png`, `dis_esitlik.png`, `tiklama_haritasi.png`, `parca_dogrulama.json` (c, d geçmeli).
   - Atlasın kendisi ve hücre numaraları: `levha_atlas.png`.
7. **Kayıt:** `model.json` → `ulu-cami_v31`, README v31 bölümü ve sürüm tablosu (**tablo satırını da** güncel sayılarla yaz; v30'da üst bölüm güncellenmiş ama tablo satırı eski kalmıştı), palet, `yaptiklarim-2.md` yeni madde. Kartlara (`parcalar.md`) dokunma.

Commit yapma; bitince raporla: kaç farklı levha, her birinin kaynağı, kaç kez kullanıldığı, sayılar, kontrol görselleri.
