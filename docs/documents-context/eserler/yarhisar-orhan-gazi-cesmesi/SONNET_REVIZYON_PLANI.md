# Yarhisar Orhan Gazi Çeşmesi: Sonnet üretim planı (v01)

19 Ekim 2026. **Tek giriş noktası.** Önce `../_GENEL_SAHNE_STANDARDI.md`, sonra bu dosyayı, sonra `yarhisar-orhan-gazi-cesmesi_notlar.md` ve `eser.md` dosyalarını oku. Model sıfırdan yapılacak; küçük bir yapı, tek tur.

Eksenler: +X doğu, +Y kuzey, +Z yukarı. Ön cephe −Y (kesin yön kaynakta yok). Orijin: plan merkezi, zemin z = 0.

## 1. Ölçek ve kütle (onay A)

- **Plan (P):** `ref/plan/yurt2024_pdf236_cizim40_plan_ayaz.png`, ölçek çubuğu 0–2 m. Ölçek, çubuğun 739 px = 2 m olmasından gelir (369,5 px/m). Dış dikdörtgen, niş ve iç dikdörtgen (tekne) bu ölçekle alınır. Kendin yeniden ölç ve `olcu_dogrulama.json`'a yaz.
- **Görünüş (P, çubuksuz):** `ref/plan/yurt2024_pdf236_cizim39_on_gorunus_ayaz.png`. Dış genişliği plandaki dış genişliğe eşitleyerek ölçekle (H). Bütün yükseklikleri buradan al:
  - toplam yükseklik
  - kemer üzengi ve tepe
  - ayna
  - sekiler
  - tekne
- **Karşılaştırma:** Metindeki değerlerle karşılaştır: niş 1,30 × 1,20; seki 0,63 (W) ya da yaklaşık 1 m (E); tekne 0,85; duvar 0,50. Çizimden çıkan değer esastır. Farkları tabloyla yaz.
- **Kütle:**
  - moloz taş gövde (yanlarda hafif eğik dış yüzler, çizimdeki gibi)
  - niş
  - iki seki
  - tekne
  - düz üst örtü
- **Onay A:** `on_orto.png` Çizim 39 ile üst üste, `ust_orto.png` Çizim 40 ile üst üste, ölçü çizgili → göster, onay bekle.

## 2. Detay ve doku (onay B)

- **Taş örgüsü:** Çizim 39'daki taşları doku karosu olarak çiz (`doku/on_cephe.png`). Moloz taş ve kemerdeki ışınsal tuğlalar ile aynadaki yatay tuğla dizileri bu dokuda olsun. Rengi fotoğraftan al.
- **Kemer:** taş kemer yayı biraz kabartma olsun (2–3 cm).
- **Ayna:** ortada sivri oymalı bardaklık nişi, sağda tek musluk (metal).
- **Tekne ve sekiler:** taş, aşınmış kenarlar; fotoğraftaki yosun lekeleri doku olarak (abartma).
- **Onay B:** fotoğrafla yan yana `on_cephe.png` (`ref/foto/yurt2024_pdf380_levha223_on_cephe.png` açısı) ve `arsiv_aci.png` (`ref/foto/arsiv_cesme_ve_cami.jpg` açısı, cami olmadan) → göster, onay bekle.

## 3. Zemin, çevre, figür (onay C)

- **Kaide:** DAİRE (standart §1). Çeşme + döşeme + figürleri saran en küçük çember + 3 m pay; 0,6 m kalınlık, 0,15 m üst pah. Üstü parke taşı döşeme (`#B3A590`, derz `#A69A86`). Örnek kod: `../koza-han/3d/build/build_v12.py`.
- **Ağaç:** arkada 1 ağaç (fotoğraftaki gibi). Örnek: `../ulu-cami/3d/build/v23_cevre.py`.
- **Figür:** 1–2 figür (`_kutuphane/akar3d.py` `insan(...)`): biri sekide oturuyor. Ölçek için önemli: çeşme küçük, figür onu boy olarak aşmalı.
- **Onay C:** `havadan.png` ve 3 sunum açısı → göster, onay bekle.

## 4. Ortak kurallar

1. Gömülme: Parçaları birbirine en fazla 2 mm göm; daha fazlası AO'da siyah çizgi bırakır.
2. Açıklık: Niş içinde havada asılı parça kalmasın.
3. Kontrol: Siyah kare ya da şerit için yakın render al.
4. Kitabe: Kitabe yok.
5. Geçici dosyalar: Geçici dosyalar `3d/kontrol/_tmp/` içinde; tur bitince sil. Başka bir eserin klasörüne yazma.

## 5. Parça adları

`Govde`, `Kemer`, `Ayna`, `Musluk`, `Sekiler`, `Tekne`, `Ust_Ortu`, `Cevre_Agac_01`, `Olcek_Insan_NN`. Tur sonunda `eser.md` tablosu .glb'deki adlarla karşılaştırılır.

## 6. Teslim (v01)

1. **Çıktılar:**
   - `3d/build/build_v01.py` (bütün ölçüler en üstte `P` sözlüğünde, kaynak harfiyle)
   - `3d/blend/yarhisar-orhan-gazi-cesmesi_v01.blend`
   - `3d/export/yarhisar-orhan-gazi-cesmesi_v01.glb` (zeminsiz)
   - `3d/export/yarhisar-orhan-gazi-cesmesi_v01_sunum.glb` (kaideli)
   - `3d/kontrol/v01/`
2. **Bütçe:** ≤ 5 000 üçgen (figür ve ağaç dahil); GLB ≤ 0,5 MB.
3. **Kontrol dosyaları:** `olcu_dogrulama.json` (çizim ölçümleri ve metinle farklar), `renkler.json`, `kontrol_ozeti.md`.
4. **Kapanış (kullanıcı açıkça onayladıktan sonra):**
   - `3d/README.md` yazılır.
   - Notlar §1'e uygulanan değerler eklenir.
   - Bu dosya silinir.
