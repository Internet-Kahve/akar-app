# fotograflar.md'ye 15–35 numaralı fotoğrafların satırlarını ekler (28 Ekim 2026). Var olan satırlara dokunmaz; iki kez çalışırsa ikinci kez eklemez.
import csv, os
DC = os.path.expanduser('~/mnt/internet-kahve/akar-app/docs/documents-context')
ARSIV = 'veri/bursa-foto/I. ve II. Cilt - Osmangazi/Ulucamii Klasörü/'
man = {r['dosya']: r['zip'] for r in csv.DictReader(open(os.path.join(DC, 'veri/bursa-foto/_manifest.csv'), encoding='utf-8'))}
L = [  # dosya, arşiv adı, başlık, kısa metin, alt metin, kaynak
 ('15_tac-kapi-mukarnas.jpg', 'DJI_20241027174601_0258_D_ODAK.jpg', 'Taç kapının kavsarası', 'On bir sıra mukarnaslı mermer kavsara.', 'Ulucami taç kapısının mukarnaslı mermer kavsarası, yakından.', 'Ürgen s.10'),
 ('16_dis-yan-cephe.jpg', 'DJI_20241208084026_0291_D_ODAK.jpg', 'Yan cephe', 'Taş cephe, sivri kemerli pencereler ve bir giriş kapısı.', 'Ulucami\'nin taş örgülü yan cephesi; sivri kemerli pencereler, merdivenli bir kapı ve minare kaidesi.', 'E cilt-1 PDF s.25'),
 ('17_dis-havadan-cevre.jpg', 'DJI_20241201091838_0510_D_ODAK.jpg', 'Ulucami ve çevresi', 'Ulucami ve çevresindeki çarşı, havadan.', 'Ulucami\'nin havadan görünüşü; yirmi kubbe, iki minare ve çevresindeki çarşı çatıları.', '—'),
 ('18_minare-kulah.jpg', 'DJI_20241205174837_0085_D_ODAK.jpg', 'Minare külahı', 'Külahlar son yangından sonra taştan yapıldı.', 'Ulucami minarelerinden birinin taş külahı ve alemi, gün batımında.', 'E cilt-1 PDF s.34'),
 ('19_minareler-aksam.jpg', 'DJI_20241205174916_0088_D_ODAK.jpg', 'İki minare', 'Gövdeleri tuğla, kaideleri mermer.', 'Ulucami\'nin iki minaresi ve kubbeleri, akşam ışığında.', 'E cilt-1 PDF s.34'),
 ('20_hat-duvar.jpg', 'DJI_20241209231739_0003_D_ODAK.jpg', 'Duvarda hat yazısı', 'Duvarlara yazılmış hat yazılarından biri.', 'Ulucami\'nde kemerlerin üstünde duvara yazılmış büyük siyah hat yazısı.', 'E cilt-1 PDF s.26, s.31'),
 ('21_hat-levha.jpg', 'DJI_20241209232301_0013_D_ODAK.jpg', 'Hat levhası', 'Çerçeveli hat levhalarından biri.', 'Ulucami\'nde krem zemin üzerine siyah yazılı, çerçeveli bir hat levhası.', 'E cilt-1 PDF s.31'),
 ('22_hat-levha-buyuk.jpg', 'DJI_20241210012016_0208_D_ODAK.jpg', 'Hat levhası', 'İç mekândaki büyük hat levhalarından biri.', 'Ulucami\'nde büyük harfli, kırmızı süslemeli bir hat levhası.', 'E cilt-1 PDF s.31'),
 ('23_minber-yandan.jpg', 'DJI_20241210010423_0173_D_ODAK.jpg', 'Minber, yandan', 'Kündekâri tekniğiyle yapılmış minberin yan yüzü.', 'Ulucami minberinin geçmeli ahşap yan yüzü ve arkadaki payede bir levha.', 'E cilt-1 PDF s.27'),
 ('24_mihrap-kose.jpg', 'DJI_20241210023107_0243_D_ODAK.jpg', 'Mihrap süslemesi', 'Köşelikte yeşil, mor ve altın yaldızlı süsleme.', 'Ulucami mihrabının köşesindeki altın yaldızlı bitkisel süsleme ve yazı kuşağı.', 'Ürgen s.7'),
 ('25_mihrap-minber.jpg', 'DJI_20241210052139_0371_D_ODAK.jpg', 'Mihrap ve minber', 'Kıble duvarında mihrap ve yanında minber.', 'Ulucami\'nin kıble duvarı; solda mihrap, ortada ahşap minber.', 'E cilt-1 PDF s.27, s.30'),
 ('26_ic-kemerler.jpg', 'DJI_20241210035234_0288_D_ODAK-3.jpg', 'Kemerler', 'Payeler sivri kemerlerle birbirine bağlanır.', 'Ulucami\'nin içinde payeleri birbirine bağlayan sivri kemerler, uzun bir sıra hâlinde.', 'Ürgen s.5'),
 ('27_ic-paye-levhalar.jpg', 'DJI_20241210050233_0334_D_ODAK.jpg', 'Payeler ve levhalar', 'Payelerin yüzlerinde hat levhaları.', 'Ulucami\'nin içinde kare payeler ve üzerlerindeki hat levhaları.', 'E cilt-1 PDF s.26'),
 ('28_ic-havuz-ustten.jpg', 'DJI_20241210051038_0350_D_ODAK-2.jpg', 'Havuz, yukarıdan', 'Açık kubbenin altındaki havuz.', 'Ulucami\'nin ortasındaki mermer havuz ve çevresindeki payeler, yukarıdan.', 'E cilt-1 PDF s.33'),
 ('29_ic-kubbe-paye.jpg', 'ERD05124 kopya-2a.jpg', 'Kubbelerin içi', 'Kubbeler ve onları taşıyan payeler.', 'Ulucami\'nde aşağıdan bakınca kubbelerin içi, kemerler ve payelerdeki levhalar.', 'E cilt-1 PDF s.26'),
 ('30_minber-kible.jpg', 'ERD04998 kopya-2.jpg', 'Minber', 'Kıble duvarı önündeki ahşap minber.', 'Ulucami\'nin ahşap minberi ve arkasındaki kıble duvarı.', 'E cilt-1 PDF s.27'),
 ('31_avlu-sadirvan-2.jpg', 'ERD04751 kopya.jpg', 'Avlu şadırvanı', 'Ahşap direkli, soğan kubbeli şadırvan.', 'Ulucami\'nin kuzey avlusundaki ahşap direkli, soğan kubbeli şadırvan.', 'E cilt-1 PDF s.39'),
 ('32_avlu-sadirvan-ic.jpg', 'ERD04834 kopya.jpg', 'Şadırvanın içi', 'Mermer tekne ve musluklar.', 'Avlu şadırvanının içi; mermer tekne, musluklar ve oturma taşları.', '—'),
 ('33_avlu-cesme.jpg', 'ERD04829 kopya.jpg', 'Avlu çeşmesi', 'Kuzey avlusundaki mermer çeşme.', 'Ulucami\'nin kuzey avlusundaki kemerli mermer çeşme.', 'E cilt-1 PDF s.39'),
 ('34_ic-genel-2.jpg', 'ERD05007 kopya.jpg', 'İbadet alanı', 'Yaklaşık 3500 m²\'lik ibadet bölümü.', 'Ulucami\'nin halı kaplı geniş ibadet alanı ve payeler.', 'E cilt-1 PDF s.25'),
 ('35_dis-havadan-gece-2.jpg', 'DJI_20241205180241_0133_D_ODAK.jpg', 'Gece', 'Ulucami ve çevresi, gece.', 'Ulucami\'nin ve çevresindeki caddenin gece havadan görünüşü.', '—'),
]
yol = os.path.join(DC, 'eserler/ulu-cami/icerik/fotograflar.md')
s = open(yol, encoding='utf-8').read()
bas, notlar = s.split('\n## Notlar', 1)
ek = []
for dosya, ad, baslik, kisa, alt, kaynak in L:
    if f'`{dosya}`' in s:
        continue
    z = man.get('I. ve II. Cilt - Osmangazi/Ulucamii Klasörü/' + ad, '')
    zno = z.rsplit('-', 1)[-1].replace('.zip', '') if z else '?'
    ek.append(f'| `{dosya}` | `{ARSIV}{ad}` | — | {baslik} | {kisa} | {alt} | {kaynak} (fotoğraf: envanter arşivi) | Vakıf Katılım, Bursa Vakıf Eserleri Envanteri fotoğraf arşivi (zip -{zno}). Proje için verildi; kullanılabilir. | Doğrulanmış | 28 Ekim 2026: 3D parça kartı için eklendi; galeriye girmez. |')
s = bas.rstrip('\n') + '\n' + '\n'.join(ek) + '\n\n## Notlar' + notlar
if ek and '15–35' not in notlar:
    s = s.rstrip('\n') + '\n- **15–35 (28 Ekim 2026):** 3D parça kartları için arşivden eklendi (`icerik/parcalar.md`). Galeri sırası «—»: galeriye girmez, yalnız kartlarda görünür. Hat levhalarının başlığında yazının ne dediği yazılmadı (okuma doğrulanmadı). Taç kapı kavsarası (15) ve yan cephe (16) için çekim yeri fotoğraf sırasından ve görüntüden çıkarıldı; hangi cephe olduğu belirtilmedi.\n'
open(yol, 'w', encoding='utf-8').write(s)
print('eklenen', len(ek))
