# Claude Code · Ulucami v02 — detay + renk + çıkış

ÖN KOŞUL: v01e2 kabul edildi, notlara "GEOMETRİ DONDURMA v01e2" yazıldı. Kütleye (plan, kotlar, kubbe profili, çatı, minare kütlesi ve yeri) DOKUNMA; sadece ekle.
build/build_v02.py = build/build_v01e2.py + detay. Yeni ölçüler P tablosuna "D_" önekiyle eklensin.
Referans: ref-maket (maket, özellikle Miniaturk_... ve cephe yakın planları), ref-foto, ref/ulu-cami_plan_ayverdi.png (kapı ve pencere yerleri).
Bütçe: toplam ≤ 30 000 üçgen, draw call < 50. Pencere ve kemerler cephe başına TEK nesnede birleşsin.

## 1. Cephe düzeni (4 cephe)
- Taban: tüm cephelerde 1,2 m yüksek, 0,08 m dışa çıkıntılı açık mermer bant (Mermer_Bant).
- Saçak altı: duvar üstünde 0,4 m yüksek, 0,15 m çıkıntılı taş silme (Silme_Ust).
- Sağır kemerler: her bölmede İKİ uzun sivri kemerli niş, duvardan 0,25 m içeri. Alt kot 1,4 m, kemer tepesi duvar kotunun ≈ 1,5 m altı. Nişler arası ve köşelerde düz duvar şeridi (maketteki gibi). Plan duvardaki payanda çıkıntılarını gösteriyor; nişleri payandaların arasına yerleştir.
- Üst pencere: her nişin üst yarısında sivri kemerli pencere (gen. ≈ 1,6 m, yük. ≈ 3,2 m), koyu dolgu + açık mermer söve (A.pencere, duvardan ≥ 3 cm önde).
- Alt pencere: her nişin altında dikdörtgen pencere (≈ 1,3 × 1,9 m), mermer çerçeve, üstünde küçük sivri boşaltma kemeri.
- Hedef sayı yaklaşık 32 üst, 26 alt (envanter). Kapı ve minare önüne gelen nişlerde pencere yok; sayı birkaç adet sapabilir, raporla.

## 2. Taç kapı (kuzey cephe ortası) — Tac_Kapi
- Cepheden 1,2 m öne çıkan beyaz mermer blok, gen. ≈ 7 m, yük. ≈ 13 m (maketten kontrol et).
- Ortada derin sivri kemerli niş (gen. ≈ 3,4 m), nişin üstünde 4–5 kademeli basit mukarnas taklidi (içe doğru kademeli prizmalar).
- Niş dibinde dikdörtgen kapı (≈ 2,2 × 3,6 m, koyu ahşap rengi).
- Önünde plandaki gibi geniş basamaklar (6 basamak, kenarları kademeli).
- Yan kapılar: doğu ve batı cephesinde planda görülen yerde birer basit sivri kemerli kapı (Kapi_Dogu, Kapi_Bati), mermer çerçeve.

## 3. Kubbe ve kasnak detayı
- Kubbe yivleri: 24 segmentte tek sıra noktaları 0,06 m içeri çek (dikiş/yiv izlenimi). Kapalı mesh bozulmasın.
- Kasnak pencereleri: her kasnakta 8 küçük sivri kemerli pencere (her 3 yüzde bir), gen. 0,7 m, yük. 1,2 m, kasnaktan 3 cm önde koyu dolgu.
- Kasnak üstünde, kubbe saçağının altında ince koyu gölge bandı yok; renk farkı yeterli.

## 4. Minare detayı
- Gövdede 3 ince taş bilezik (her ~1/4 boyda), 0,25 m yük., 0,05 m çıkıntı.
- Şerefe korkuluğuna 0,15 m'lik üst ve alt silme.
- Batı minare: plandaki çapraz merdiven geçidi (kaideyi cepheye bağlayan alçak kütle, ≈ 2 m gen., kaide yüksekliğinde).

## 5. Renk ve ışık (son palet)
A.palet ile:
| ad | hex | nerede |
|---|---|---|
| duvar | #CDB592 | cephe |
| nis | #B9A07E | sağır kemer içi (bir ton koyu) |
| mermer | #EEEAE2 | taban bandı, söveler, taç kapı, kaideler, şerefe |
| pencere | #3E4851 | pencere ve kapı boşlukları |
| ahsap | #6B4A33 | kapı kanatları |
| kasnak | #E2C77E | kasnaklar |
| kubbe | #B9C2CC | kubbeler |
| cati | #9AA3AD | çatı |
| alem_kursun | #6B7480 | kubbe alemleri |
| tugla | #9C5A45 | minare gövdeleri |
| bant_koyu | #5E6670 | batı minare kaide bantları |
Sonra `A.ao_vertex(samples=32)`.

## 6. Kontrol ve çıkış
- kontrol_hepsi → GECTI true. Çakışma listesinde örtülen pencere varsa kaydır/sil.
- Görseller: v02_kuzey_orto.png (maketle yan yana), v02_hava_kuzeybati.png, v02_tac_kapi.png (yakın), v02_kubbe_yakin.png, v02_dogu.png.
- Dışa aktar: `export/ulu-cami_v02.glb` (Draco). Boyut ≤ 1 MB değilse raporla.
- Parça listesi notlarda güncellensin (yeni: Mermer_Bant, Silme_Ust, Cephe_Kuzey/Guney/Dogu/Bati (nişler+pencereler), Tac_Kapi, Kapi_Dogu, Kapi_Bati, Kasnak_Pencereleri).
Kısa rapor, DUR.
