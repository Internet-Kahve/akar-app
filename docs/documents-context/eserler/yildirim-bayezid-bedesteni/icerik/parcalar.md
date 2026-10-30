# Yıldırım Bayezid Bedesteni · 3D parça kartları

30 Ekim 2026. 3D modelde bir parçaya dokununca açılan kartların içeriği. Uygulama bu tabloyu `services/api/scripts/editorial_reader.py` ile okur; üründe aynı alanlar `parca_bilgi` tablosuna karşılık gelir. Biçim, ton ve uzunluk Ulucami'deki kartlarla aynı (`ulu-cami/icerik/parcalar.md`); başlangıç noktası 29 Ekim taslağı (`_eski/parcalar_taslak.md`).

**Kural:** Kartı olan parça tıklanır, kartı olmayan tıklanmaz. Bir parçayı tıklanabilir yapmak için bu tabloya bir satır eklemek ya da var olan satırın «Parçalar» hücresine parçanın model adını yazmak yeter; kod değişmez.

Kaynak önceliği `ICERIK_YONTEMI.md` ile aynı: önce Bursa Vakıf Eserleri Envanteri (`E cilt-N PDF s.X` = envanter kitabının PDF sayfası; metnin tamamı `eser-hakkinda.md`'de), sonra eserin notlarındaki kaynaklı bilgiler. Metinler envanter metniyle tek tek karşılaştırıldı; kaynakta olmayan bilgi yazılmadı. Fotoğraflar `foto/` klasöründen (`fotograflar.md` listesi); fotoğraf hücresi boşsa kart, eserin kapak fotoğrafını gösterir. Parça adları `3d/export/bedesten_v11_sunum.glb` dosyasının üst düzey nesne adlarıyla birebir karşılaştırıldı (30 Ekim 2026).

Sütunlar: **Parçalar** = modeldeki nesne adları (virgülle; hepsi aynı kartı açar) · **Fotoğraflar** = sırayla, kartta yana kaydırılır; ilki kapaktır.

| Parçalar | Başlık | Metin | Fotoğraflar | Kaynak | Güven |
|---|---|---|---|---|---|
| Govde, Ic_Duvarlar | Bedesten | Osmanlı'nın yapılan ilk bedesteni olan yapıyı, şehir hızla bir ticaret merkezine dönüşünce Yıldırım Bayezid yaptırdı; sonraki bütün Osmanlı bedestenlerine örnek oldu. Ulucami'nin yakınına kurulan bedesten hem vakfa gelir sağladı hem çarşı dokusunun çekirdeği oldu. İnşasında taş ve tuğla birlikte kullanıldı. | 01_dis-havadan-ulucami-ile.jpg, 04_dis-havadan-ulucami-yonu.jpg | E cilt-2 PDF s.29 | Doğrulanmış |
| Kubbeler, Govde_Ortu, Kubbe_Ici, Pandantifler | On dört kubbe | Bedestenin iç ölçüleri 15,00 × 56,50 metre olan merkez mekânının üstü, altı ayağa oturan on dört kubbeyle örtülüdür. Yapı plan bakımından İstanbul ve özellikle Edirne Bedesteni'ne benzer. | 03_tepeden-14-kubbe.jpg, 06_kubbeler-yakindan.jpg | E cilt-2 PDF s.29 | Doğrulanmış |
| Payeler, Kemerler | Altı ayak | On dört kubbe, merkez mekânın ortasında sıralanan altı ayağa oturur. Ticari mekânlar, mahzenlerin önünde ve bu taşıyıcı ayakların çevresinde düzenlenen dükkânlardan oluşur. | 02_ic-kuyumcular.jpg | E cilt-2 PDF s.29 | Doğrulanmış |
| Ic_Dukkanlar | Otuz iki mahzen | Ticari mekânlar, doğu-batı yönünde sıralanmış 32 mahzen ile bunların önündeki dükkânlardan oluşur; hepsinin üstü yuvarlak tonozla örtülüdür. Bedesten bugün de büyük ölçüde kuyumcu atölyelerine ev sahipliği yapar. | 02_ic-kuyumcular.jpg | E cilt-2 PDF s.29 | Doğrulanmış |
| Dukkanlar | Çevredeki dükkânlar | Bedestenin çevresinde bugün 68 dükkân vardır, ama bunlar yapının ilk düzenine ait değildir. Kapılardan birinin üstündeki «Bedesten Kuyumcular Çarşısı» tabelası, yapının bugünkü kullanımını gösterir. | 07_dis-duvar-kuyumcular.jpg, 05_carsi-icinde.jpg | E cilt-2 PDF s.29 | Doğrulanmış |
| Kapilar | Dört kapı | Bedestene dört cephedeki kapılardan girilir; her kapı kubbeyle örtülü bir giriş mekânına açılır. Batı kapısının üst kısmında boyayla yazılmış «Bedesten» ibaresi vardır. | 05_carsi-icinde.jpg | E cilt-2 PDF s.29 | Doğrulanmış |
| Kitabe | Kelime-i tevhit yazısı | Envantere göre bedestenin güney kapısının üstünde girift kûfi hatla «kelime-i tevhit» yazılıdır. Ekinci'nin 2025 tarihli tezi bu yazıyı bugün şadırvanın doğusundaki ayağın batı yüzünde gösterir; güney kapısındaki yerini eski kayıtlardan aktarır. |  | E cilt-2 PDF s.29; Ekinci 2025 PDF 85 | Doğrulanmış |
| Ic_Sokak, Sadirvan | Şadırvan ve iç avlu | Merkezde, avlu düzenine uygun konumlanmış fıskiyeli bir şadırvan vardır. 1958 Kapalıçarşı Yangını'nda ağır hasar görüp kullanılmaz hâle gelen bedesten, 1960'ta özgün mimarisine sadık kalınarak kapsamlı biçimde onarıldı. | 02_ic-kuyumcular.jpg | E cilt-2 PDF s.29 | Doğrulanmış |

## Kartı olmayan (tıklanmayan) parçalar

`Zemin`, `Zemin_*`, `Olcek_*` (zemin ve ölçek figürleri). Bütün yapı parçalarının kartı var.

## Notlar

- Evliya Çelebi'nin bedestenin dört cephesinin kuyumcular çarşısıyla çevrili olduğu anlatımı (s.29) «Tarihsel çıkarım» olduğu için kartlara alınmadı; «Eser hakkında» sayfasında tam metinde var.
- Dükkân sayısı: envanter bugün 68 der; Ekinci 2025 ve Vakıf Abideleri planlarda 56 dükkân ve 32 mahzen sayar (`bedesten_notlar.md`). Kartta envanter sayısı verildi.
- Kitabenin bugünkü yeri (`bedesten_notlar.md` «Kitabe bugün güney kapısında mı?») 2026'da yerinde doğrulanmadı. Arşivde kapı ve kitabe fotoğrafı yok; kitabe kartı kapak fotoğrafını gösterir.
