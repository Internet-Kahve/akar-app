# Ulu Cami — güncel sürüm v16

- `blend/ulu-cami_gpt_v16.blend`: düzenlenebilir sahne, paketlenmiş dokular, genişletilmiş kaide.
- `export/ulu-cami_gpt_v16.glb`: yalnız bina.
- `export/ulu-cami_gpt_v16_sunum.glb`: kaideli sunum.
- `build/build_gpt_v16.py`, `build/akar3d.py`, `build/doku/`: üretim betiği, bağımlılık ve dokular.
- `kontrol/gpt_v16/`: güncel görseller ve doğrulama raporları.
- `CEVRE_ENVANTER_NOTLARI.md`: çevre araştırması, kaynak sayfaları ve belirsizlikler.
- `REVIZYON_v16.md`: son kaide değişikliği.

20 kubbe; sekizgen kasnaklar, her kasnakta sekiz pencere; dışa açılan kubbe eteği; içbükey ana kapı; kahverengi kapılar; hafif taş örgüsü. Yanlarda dört, arkada beş geniş pencere grubu bulunur. Arka orta grubun altında pencere yoktur. Kaide yaklaşık %20 genişletildi; çevre yapıları henüz eklenmedi.

Bina 67.906 üçgen. Açık/non-manifold kenar ve sekiz yönden ters yüz bulgusu yok; >=0,3 m kaba çakışma taraması temiz. 30 bin üçgen başlangıç hedefi aşılmıştır; mobil performans ölçülmedi. Kaide gerçek avlu sınırı değildir. Fotoğrafa dayalı stilize modeldir.

Yeniden üretim: `blender -b --python build/build_gpt_v16.py`. Yerel `akar3d.py` ve üst klasördeki `ref-maket/Miniaturk_Bursa_Ulu_Cami_-_Bursa_Grand_Mosque.jpeg` gereklidir. İlk geometri Claude v02c üretim betiğinden türetilmiş, kullanıcı referanslarıyla geliştirilmiştir.

Üst klasörde eser.md, ulu-cami_notlar.md, prompt ve tüm referans klasörleri korunur.

Eski sürümler ve yedekler 17 Ekim 2026'da çalışma klasöründen geri alınabilir arşive taşındı:
/Users/ksenophon/Desktop/internet-kahve/akar-app/docs/documents-context/tasarim/3d-eser/bursa/_arsiv/ulu-cami-temizlik-20261017-004239
