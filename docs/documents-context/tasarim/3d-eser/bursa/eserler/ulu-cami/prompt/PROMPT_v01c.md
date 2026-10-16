# Claude Code · Ulucami v01c (kütle düzeltmesi 2)

v01b'nin üstüne build_v01c.py. Hâlâ kütle turu: pencere, taç kapı, silme YOK.

1. PLAN ÖLÇÜSÜ DEĞİŞİYOR (önceki yönerge hatalıydı).
   OSM 70,5 × 60,3 (uzun kenar doğu–batı) ve envanter "69 × 55" birbirini tutuyor; 60 × 48 yalnız öğrenci ödevinde.
   Yeni plan: doğu–batı 70 m (5 bölme × 14 m), kuzey–güney 56 m (4 bölme × 14 m). Kubbe Ø 11 m kalır (envanter).
   Fotoğraf ölçeğini yeniden hesapla: cephe 70 m = 1040 px → 14,9 px/m. Duvar, çatı, kasnak, kubbe ve minare yüksekliklerini bu ölçekle güncelle.
   Notlardaki ölçü tablosuna yaz: "60 × 48 (ödev) yerine OSM + envanter".

2. MİNARELER YANLIŞ YERDE. İkisi de KUZEY cephede (5 kubbeli, 70 m'lik, taç kapının olduğu cephe), bu cephenin iki ucunda: kuzeybatı ve kuzeydoğu köşe.
   Şu an doğu/batı cephesinin uçlarındalar (çapraz duruyor). Kuzey cepheden bakınca iki minare cephenin sağında ve solunda görünmeli (ref-img3/unnamed.webp gibi).

3. ÇATI ORTAYA DOĞRU YÜKSELİYOR. Şu an çatı tek kotta, orta sütunun kasnağı uzun ve çıplak kaldığı için orta kubbe fotoğraftakinden uzun görünüyor.
   Doğrusu: her bölmenin çatı kotu sütuna göre değişir; uç sütunlar en alçak, ara sütunlar daha yüksek, orta sütun en yüksek (basamaklı yükselen çatı, ref-img3/509433933_...jpg'de görülüyor).
   Görünen kasnak yüksekliği 5 sütunda da yaklaşık aynı ve kısa olsun. Kubbe tepelerinin toplam kotu v01b'deki gibi kalabilir (yeni ölçekle); farkı çatı versin, kasnak değil.
   Bölmeler arasındaki kot farkı çatıda kısa düşey ya da eğimli geçişle çözülsün; açık kenar kalmasın.

4. RENKLER:
   - Minarenin alemi altın OLMAYACAK. Alem minarenin başlığıyla aynı renk/malzeme.
   - Kubbe alemleri metalik koyu kurşun: çatının koyusu (yaklaşık #6B7480). Palete "alem_kursun" olarak ekle.

Sonunda: kontrol_hepsi (GECTI true), v01c_kuzey.png, v01c_hava_kuzeybati.png ve kuzey cepheye tam karşıdan v01c_kuzey_orto.png (ref-img3/unnamed.webp ile yan yana koy). Kısa rapor, DUR.
