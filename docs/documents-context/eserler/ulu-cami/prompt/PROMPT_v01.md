# Claude Code · Ulucami v01 (kütle turu)

akar-3d-model skill'ini yükle. Proje kökü: akar-app-baglam/

Önce oku: 3d-eser/AKAR_3D_Yontem_Notlari.md ve 3d-eser/bursa/ulu-cami/ulu-cami_notlar.md (ölçüler, renkler, parça listesi, tur planı orada). Notlarla çelişen bir şey görürsen uygulamadan sor.

Bu tur TEK konu: kütle (v01).
1. OSM'den Ulucami ayak izini al (Overpass, 40.1840 / 29.0619 civarı, building + building:part). Ölçüsünü ve kuzeye göre açısını yaz. 60 × 48 m ile karşılaştır.
2. ref-img3/unnamed.webp üzerinde cephe genişliği = 60 m alarak duvar, kasnak (uç / ara / orta), kubbe yükselişi ve minare boyunu ölç. Notlardaki tahmin tablosunu bu ölçülerle değiştir.
3. 3d-eser/bursa/ulu-cami/build_v01.py yaz (_kutuphane/akar3d.py kullan, ornek_test.py örnek). Parçalar: Govde, Cati, Kasnaklar_20, Kubbeler_20, Sadirvan_Fener, Minare_1, Minare_2, Zemin, Merkez. Pencere, taç kapı ve silme YOK.
   - 5 × 4 ızgara, bölme ≈ 12 m, kubbe Ø 11 m. Doğu–batı 5 sütunda ortadaki en yüksek, uçtakiler en alçak; 4 sıra aynı profil.
   - Açık kubbe: orta sütun, kuzeyden 2. sıra. Kabuğu kapalı, fener tepesine oturur.
   - Kubbe kasnağın üstüne oturur (prism top=False + dome cap=False, aynı halka). Havada ya da dolguyla duran parça yok.
   - Minareler A.minare() ile, kuzeybatı ve kuzeydoğu köşede.
4. Çalıştır: blender -b --python 3d-eser/bursa/ulu-cami/build_v01.py → ulu-cami_v01.blend, kontrol/v01_*.png
5. kontrol_hepsi + kuzeyden ve havadan (kuzeybatıdan) birer render; REF3 fotoğraflarıyla yan yana koy.

Rapor skill'deki şablonla, kısa. Ölçtüğün oranları tablo olarak ver. Sonra DUR, v02'ye geçme.
