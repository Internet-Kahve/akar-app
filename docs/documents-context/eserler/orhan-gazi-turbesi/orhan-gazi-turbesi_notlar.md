# Orhan Gazi Türbesi: model notları

19 Ekim 2026. Kaynaklı kimlik ve ölçü kaydı `eser.md` içinde, uygulama içeriği `icerik/` içinde, üretim talimatı `SONNET_REVIZYON_PLANI.md` içinde. Bu dosya kararları ve kaynak incelemesini toplar.

## 0. Kaynak durumu

| Kaynak | Dosya | Ne verir |
|---|---|---|
| E Envanter Cilt 2, PDF 115–117 | `ref/metin/envanter_c2.md` | Tarih, 16,80 × 16,80 m, duvar 1,30 m, dört sütunlu orta kubbe, pencere sayıları, giriş sundurması, sandukalar |
| P Yurt 2024, PDF 224 (Yavaş 2007'den) | `ref/plan/yurt2024_pdf224_plan_yavas.png` | Plan: duvarlar, pencere ve kapı açıklıkları, dört sütun, orta kubbe dairesi, tonoz çizgileri |
| W Yurt 2024, PDF 82–84 | `ref/metin/yurt2024.md` | Giriş güneyde; malzeme ve süsleme |
| F Yurt 2024 Levha 111–151 (PDF 317–339) | `ref/foto/yurt2024_pdf3xx_*.jpg`, anahtar planlar `ref/plan/yurt2024_pdf317_*`, `_pdf326_*` | Cepheler, giriş sundurması, kapı alınlığı, pencere kilit taşı, iç kubbe ve sütunlar |
| F Vakıf Katılım arşivi (Türbeler Klasörü) | `ref/foto/arsiv_*.jpg` | Havadan dış görünüş, tepeden (Osman ve Orhan Gazi türbeleri yan yana), iç mekân |

**Yükseklik kaynağı yok.** Kesit ya da cephe çizimi bulunamadı. Bütün yükseklikler fotoğraftan, plan genişliği ölçek alınarak ölçülecek (F).

## 1. Kararlar

| # | Konu | Karar | Kaynak |
|---|---|---|---|
| 1 | Dış ölçü | 16,80 × 16,80 m, duvar 1,30 m | E PDF 116 |
| 2 | Plan ölçeği | Plan çizimi, dış kenar 16,80 m alınarak ölçeklenir. Ölçek çubuğu kaba bakışta %10–15 farklı görünüyor; bu fark notlara yazılır | P PDF 224 + E |
| 3 | Giriş yönü | Güney. Dilimli kemerli kapı ve iki yanında birer pencere | W Yurt PDF 83; plan |
| 4 | Pencereler | Kuzey, doğu, batıda üçer; güneyde iki. Yuvarlak kemerli, mermer söveli, demir şebekeli | E PDF 116; W PDF 83 |
| 5 | Örtü (dış) | Kasnak üzerinde metal (kurşun) kaplı kubbe. Kasnak pencere sayısı fotoğraftan sayılır | W PDF 83; F |
| 6 | İç mekân | Modelde iç mekân yok; kapı ve pencereler koyu. İç mekânı fotoğraf kartları gösterir | Genel standart |
| 7 | Giriş sundurması | Güney önünde, iki sütunçeli sundurma ve dikdörtgen giriş holü (restorasyonda yeniden yapıldı). Fotoğraflarda ahşap çerçeveli, kemerli camlı bir hol görünüyor | E PDF 117; F PDF 318, 320, 325 |
| 8 | Cephe rengi | Açık krem sıvalı ya da boyalı taş görünüm; köşe pilastrları ve silmeler aynı tonun bir koyusu | F arşiv; renkler.json'a yazılacak |
| 9 | Komşu yapı | Osman Gazi Türbesi (sekizgen) modele girmez | — |

### Uygulanan değerler (v01, 19 Ekim 2026)

Bütün ölçüler `3d/build/build_v01.py` içindeki `P` sözlüğünde, kaynak harfiyle; ölçüm yöntemleri `3d/kontrol/v01/olcu_dogrulama.json` içinde.

| # | Konu | Uygulanan | Kaynak / gerekçe |
|---|---|---|---|
| 10 | Gövde | 16,80 × 16,80 m kare, duvar 1,30 | E. Plan çizimi K–G %5, tepeden fotoğraf %12 uzun gösteriyordu; dört cephenin karşıdan fotoğrafında (cephe / pencere eksen aralığı 2 × 4,15 m) K–G ile D–B farkı %3 (gürültü içinde). Plan çiziminin ölçek çubuğu E'den %20 farklı. |
| 11 | Plan ölçeği | Dış kenar = 16,80 m; x 59,7, y 62,8 px/m; pencere eksenleri 0 ve ±4,15 m, kapı açıklığı 2,20 m | P (PDF 224) + E. Ölçek çubuğu dış ölçüyü 20,22 × 21,27 m gösteriyor (%20–27 büyük); çubuk kullanılmadı. |
| 12 | Kotlar | Subasman 0,65 · friz 6,77 · korniş 7,17 · saçak 8,03 · çatı eteği/kasnak 9,80 · kasnak bandı üstü 10,25 · kasnak kornişi 11,10 · kubbe tabanı 11,40 · kubbe tepesi 14,30 · alem 1,20 | F (Levha 121 ölçeği 40,7 px/m; arsiv fotoğrafları) |
| 13 | Kasnak ve kubbe | Kasnak bandı Ø 8,40, korniş Ø 8,80 (48 konsol); kubbe gövdesi Ø 7,25; **kasnakta pencere yok** (görülen siyah kutular projektör) | F |
| 14 | Pencere ve kapı | Pencere net 1,69 × eşik 0,78 → kemer tepesi 3,97, söve 0,25; kapı net 1,50, kanat 2,42, dilimli kemer tepesi 3,36 | F (Levha 112, 113, 117, 121) |
| 15 | Giriş holü ve sundurma | Hol 6,00 × 3,20 m, **eksende**; saçak 5,10–5,60; sundurma 1,35 derin, sütun aksı 2,60; hol kapısı **içe açık** | F. Tepeden fotoğrafta hol 1,4–1,75 m batıda görünüyor; bu, ana çatının görüntü merkezinin doğusunda kalmasından gelen yükseklik kayması. Levha 111'de hol ortası pencere ortasından < 0,05 m sapıyor. Levha 112'de kanatlar holün içinde. |
| 16 | Cephe rengi | Cephe #E9DFC6; pilastr ve silme #ECEAE4; söve #D5D6D2; şebeke beyaz #F1EFEA; kurşun #C3C9CD | F + standart §3; sapmalar `3d/kontrol/v01/renkler.json` |
| 17 | Arsiv fotoğraflarının yönü | `arsiv_dis_guneybati_havadan` (adına rağmen) ve `arsiv_havadan_kuzey` (adına rağmen) **ikisi de doğudan** çekilmiş; ön cephe = doğu cephesi | Önündeki çim ve beyaz levha tepeden fotoğrafta doğu şeridinde, kırmızı çatılı evler doğuda; anıt mezar parmaklığı doğu cephesinin güney ucunda (anahtar plan açı 5, Levha 116). Kare gövde 90° simetrik olduğundan onay A/B'de kuzeybatı/kuzey çözümü aynı hatayı veriyordu; C'de düzeltildi. |
| 18 | Çevre | Daire kaide merkez (4,29; −1,56), R 20,78 m (en küçük çember 17,78 + 3 m), kalınlık 0,6, üst pah 0,15; taş döşeme; doğu çim şeridi (11,6–15,1 m doğuda, y −3,5…7,7) ve kuzey çimi; çim %7,9 | Standart §1; F tepeden + Levha 120–121 |
| 19 | Ağaçlar | Cevre_Agac_01 çınar (0,10; −14,50) hol ekseninde · 02 manolya (10,00; 13,00) kuzeydoğu · 03 manolya (−1,50; 12,40) kuzey · 04 **sedir (12,00; −11,00) güneydoğu** | F: sedir Levha 111 sağ üstte, Levha 116 sol üstte, arsiv fotoğraflarında solda (ilk talimattaki «batıda sedir» fotoğraflarla çelişiyordu). Manolya: Levha 120, 121, 122. Çınar: Levha 111. |
| 20 | Figürler | 4 figür (`akar3d.insan`): hol eşiğine çıkan kadın, yürüyen erkek, yürüyen kadın ve çocuk; hepsi girişe | Standart §4 |

## 2. Açık konular

- ~~Kasnak pencere sayısı ve kubbe yüksekliği~~: v01'de çözüldü (pencere yok; kubbe tepesi 14,30 m, §1 #12–13).
- ~~Sundurmanın derinliği ve yüksekliği~~: v01'de çözüldü (§1 #15).
- Kitapta yeniden yapım yılı iki farklı: 1863 (PDF 116) ve 1868 (PDF 117). Modeli etkilemiyor; içerikte yıl verilmedi.
