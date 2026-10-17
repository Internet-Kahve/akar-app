# Claude Code · Ulucami v01b (kütle düzeltmesi)

Hâlâ kütle turu. Pencere, taç kapı, silme YOK. v01'in üstüne build_v01b.py.

Sorularının cevabı:
1. Plan 60 × 48 kalsın. OSM'in uzun ekseni kuzey–güney: 60,3 m doğu–batı = 5 × 12 m, tutuyor. Fazla ~22 m büyük ihtimalle kuzeydeki avlu/taşra sofası. Poligonun neresinde olduğuna bak, notlara tek satır yaz; modeli değiştirme.
2. Kasnak ve kubbeyi her bölmede tek kapalı mesh yap. Kasnaklar_20 parçası kalkar, kasnaklar Kubbeler_20'nin içinde (ayrı malzeme: kasnak sarısı).
3. Kasnak ve kubbe 16 kenar, aynı halka.

Muhammed'in düzeltmeleri:
4. Açık kubbenin üstündeki büyük fener/uç KALKSIN. Sadirvan_Fener parçası silinir.
   O kubbe ayrı nesne olsun: Sadirvan_Kubbe (vurgu için). Diğer 19 kubbe Kubbeler_19 olarak kalır. Delik açma.
5. TÜM 20 kubbenin tepesine ince, sivri bir alem ekle (kubbeye 5 cm gömülü). Hepsi tek nesne: Alemler.
6. Çatı düz levha değil. Her bölmede kasnağın dibinden bölme kenarlarına doğru aşağı eğimli kurşun çatı (alçak piramit/kırma), bölmeler arasında oluk çizgisi; dış kenarda saçağa iner. Eğim ≈ 15–20°. Kasnak bu eğimli çatının üstünden çıkar.
7. Minareler:
   - Daha kalın. Gövde çapını ref-img3/unnamed.webp'den ölç (17,3 px/m); ölçemezsen gövde Ø ≈ 4,5 m, kaide daha geniş.
   - Konum: kaide kuzey cepheyle aynı hizada, köşeye bitişik (fotoğrafla kontrol et).
   - Külah koni DEĞİL: şerefenin üstünde kısa üst gövde, sonra daralıp genişleyen oval/soğanımsı bir profil (genişle → daral → genişle → sivri uç) ve alem. G.lathe ile profil olarak yap; ref-img3 ve ref-mg2'deki minare tepelerine bak.
   - Gövde tuğla rengi, kaide ve şerefe açık taş.

Parça listesi (yeni): Govde, Cati, Kubbeler_19, Sadirvan_Kubbe, Alemler, Minare_1, Minare_2, Zemin, Merkez.

Sonunda: kontrol_hepsi (GECTI true olmalı), v01b_kuzey.png ve v01b_hava_kuzeybati.png, ayrıca bir minareye yakın render (v01b_minare.png). Notlardaki parça listesini güncelle. Kısa rapor, DUR.
