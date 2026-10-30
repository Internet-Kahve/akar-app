# Emir Hanı · 3D parça kartları

30 Ekim 2026. 3D modelde bir parçaya dokununca açılan kartların içeriği. Uygulama bu tabloyu `hazirla.py` ile okur; üründe aynı alanlar `parca_bilgi` tablosuna karşılık gelir. Biçim, ton ve uzunluk Ulucami'deki kartlarla aynı (`ulu-cami/icerik/parcalar.md`); başlangıç noktası 29 Ekim taslağı (`_eski/parcalar_taslak.md`).

**Kural:** Kartı olan parça tıklanır, kartı olmayan tıklanmaz. Bir parçayı tıklanabilir yapmak için bu tabloya bir satır eklemek ya da var olan satırın «Parçalar» hücresine parçanın model adını yazmak yeter; kod değişmez.

Kaynak önceliği `ICERIK_YONTEMI.md` ile aynı: önce Bursa Vakıf Eserleri Envanteri (`E cilt-N PDF s.X` = envanter kitabının PDF sayfası; metnin tamamı `eser-hakkinda.md`'de), sonra eserin notlarındaki kaynaklı bilgiler. Metinler envanter metniyle tek tek karşılaştırıldı; kaynakta olmayan bilgi yazılmadı. Fotoğraflar `foto/` klasöründen (`fotograflar.md` listesi); fotoğraf hücresi boşsa kart, eserin kapak fotoğrafını gösterir. Parça adları `3d/export/emir-hani_v08_sunum.glb` dosyasının üst düzey nesne adlarıyla birebir karşılaştırıldı (30 Ekim 2026).

Sütunlar: **Parçalar** = modeldeki nesne adları (virgülle; hepsi aynı kartı açar) · **Fotoğraflar** = sırayla, kartta yana kaydırılır; ilki kapaktır.

| Parçalar | Başlık | Metin | Fotoğraflar | Kaynak | Güven |
|---|---|---|---|---|---|
| Emir_Hani | Han ve odaları | Yaklaşık 45 × 45 metrelik iki katlı hanın alt katında 36, üst katında 38 oda vardır. Penceresiz alt kat odaları kervanların getirdiği malların korunduğu depolardı; üst kattakiler tüccarların konakladığı, ocaklı odalardır. Duvarlar iki sıra tuğla ve bir sıra küfeki taşıyla almaşık örülmüştür. Bugün üstü kurşunla kaplıdır; bir dönem kiremitle örtüldüğü bilinir. | 01_havadan-ulucami-ile.jpg, 06_ust-kat-revak.jpg | E cilt-1 PDF s.108, s.109 | Doğrulanmış |
| Girisler | Girişler ve kantar peykeleri | Hanın biri Ulucami avlusundan, öbürü Kapalı Çarşı tarafından iki girişi vardır. Şehirde alınıp satılan mallar bu handa tartılırdı; Bursa'nın fethinden 1781'e kadar kullanılan kantarlar için yapılan peykeler bugün de girişte görülebilir. Çarşı kantarı burada olduğu için han «Bahar Kapanı» diye de anılırdı. |  | E cilt-1 PDF s.108, s.109 | Doğrulanmış |
| Avlu_Revaklari | Revaklar | Avlu, kesme taş ve tuğladan geniş ayaklara oturan revaklarla çevrilidir. Güney kanadın alt revakında kemerler yarım daire, öbür yönlerde ve üst katta sivridir; güney revakının ayakları da ötekilerden farklı olarak kesme taştandır. Bugün üst katta kitapçılar, dinî malzeme satıcıları ve kuyumcular, alt katta yeme-içme yerleri vardır. | 03_revak-ayaklar.jpg, 05_revak-dukkanlar.jpg, 06_ust-kat-revak.jpg | E cilt-1 PDF s.108, s.109 | Doğrulanmış |
| Han_Avlu, Sadirvan | Avlu ve şadırvan | Revaklarla çevrili orta avlu yaklaşık 650 metrekaredir. Fıskiyeli şadırvanı ve tarihî çınarların gölgelediği avlusuyla han, bugün de çay ve kahve eşliğinde sohbet edilen bir buluşma yeridir. | 02_avlu-sadirvan.jpg, 04_avlu-cinarlar.jpg | E cilt-1 PDF s.108, s.109 | Doğrulanmış |

## Kartı olmayan (tıklanmayan) parçalar

`Zemin_*`, `Cevre_*`, `Olcek_*` (zemin, ağaç ve ölçek figürleri; yapıya ait değil). Emir Hanı modelinde iç mekân yok; «İçini göster» düğmesi görünmez (`model.json`'da `ortu_gruplari` yok).

## Notlar

- Girişlerin fotoğrafı arşivde yok; kart kapak fotoğrafını gösterir. Girişlerin yönü envanterde yazmıyor; model notlardaki seçimi izler (`emir-han_notlar.md` §Girişler). Kartta yön verilmedi.
- Ölçü: envanter «yaklaşık 45 × 45 m»; Vakıf 1983 yayını 46 × 50 m (3D'de bu kullanılıyor). Kartta envanterdeki ölçü verildi.
