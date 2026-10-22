# AKAR · Klasör yapısı

17 Ekim 2026, güncelleme 22 Ekim 2026. Giriş: [README](README.md).

```text
documents-context/
├── README.md
├── KLASOR_YAPISI.md
├── AKAR_Tam_Baglam.md
├── FRONTEND_BACKEND_NOTLARI.md
├── ICERIK_YONTEMI.md         Eser içeriği (hikâye, fotoğraf, kaynak) kuralları
├── PROTOTIP_DERSLERI.md
├── hackathon/                Yarışma PDF'leri ve rehber
├── design/
│   ├── README.md
│   ├── tokens.css
│   ├── ikonlar/
│   ├── desenler/
│   ├── harita/
│   ├── ekranlar-15ekim/
│   ├── karsilastirma/
│   ├── test-redmi9t/         Telefon prototipi (Figma ekranları, gerçek içerik) + performans testi
│   └── ilk-prototip-…/       Eski uygulama; tasarım referansı
├── eserler/
│   ├── README.md
│   ├── _kutuphane/           Ortak Blender yardımcıları ve yöntem
│   ├── ulu-cami/
│   ├── yildirim-bayezid-bedesteni/
│   ├── ayasofya/             Önceki pilot (sürüm klasörleri v20–v24)
│   ├── aday-eserler/         Henüz işlenmemiş 30 aday eser (eser.md + ref)
│   ├── _GENEL_SAHNE_STANDARDI.md  Renk, ışık, zemin kuralları
│   └── <eser>/               eser.md, notlar, icerik/, ref/, 3d/
└── veri/
    ├── BENIOKU.md
    ├── kaynak_pdf/           Vakıf Katılım envanter PDF'leri (Git dışında; ekibe kısıtlı Drive'dan)
    ├── metin/
    ├── eserler_taslak.csv
    ├── bursa/                Ortak kaynaklar, kararlar, denetim ve şablonlar
    ├── bursa-foto/           Envanter fotoğrafları ve manifest
    ├── fotoatlas/            Foto Atlas eski fotoğrafları, izinler, Geçmişi Gör paketi (BENIOKU.md)
    ├── panorama-test/        Panorama denemesi ve atıf
    └── vakıf-eserleri-envanteri/  Büyük yerel kaynak arşivi (Git dışında)
```

## Yerleştirme kuralları

- Ürünün tamamına ilişkin belgeler doğrudan `documents-context/` kökünde, yarışma belgeleri `hackathon/` altında tutulur.
- Tek esere ait kaynak ve modeller `eserler/<eser>/` altında birlikte kalır. Ortak PDF ve veri kaynakları `veri/bursa/` altında tutulur; eser notundan kaynak gösterilir.
- `eser.md` kimlik, ölçü ve kaynakların giriş noktasıdır. Model kararları eserin notlarında veya üretim klasörünün README'sinde tutulur.
- Üretim dizininin adı `3d/` olur (araç adı taşımaz; 22 Ekim 2026 itibarıyla modeli olan yedi eserin hepsi bu düzende: Ulu Cami, Koza Han, Bedesten, Orhan Bey Camii, Orhan Bey Hamamı, Emir Hanı, Orhan Gazi Türbesi. `claude/` ya da `gpt/` adlı dizin kalmadı). Yalnız son sürüm tutulur; sürüm geçmişi `3d/README.md` içinde yazılı kalır. İçlerinde `build/` betikleri, `blend/` kaynak sahneleri, `export/` GLB teslimleri, `kontrol/` render ve raporlar bulunur. Sırf standart olsun diye boş klasör açılmaz.
- Ortak modelleme yardımcıları `eserler/_kutuphane/`; tür şablonları `veri/bursa/sablonlar/` altındadır.
- `design/` arayüz tasarımı içindir. Eski prototip canlı uygulama değildir; referans olarak korunur.
- CSV'ler doğrulanmadan yayın verisi sayılmaz. Model sürümünün varlığı, doğrulama veya mobil performans testinin geçtiği anlamına gelmez.
- Büyük kaynak arşivinin yerelde bulunması Git'te takip edildiği anlamına gelmez. Mevcut ignore kuralları korunur.
- Dosya taşınırken ilgili Markdown bağlantıları ve Python göreli yolları birlikte kontrol edilir. Tarihsel arşiv yolları geçmiş kayıt olarak kalabilir.

## Önceki yolların karşılığı

| Önceki yol | Güncel yol |
| --- | --- |
| `belgeler/` içindeki ürün ve görev belgeleri | `documents-context/` kökü |
| `tasarim/` (arayüz dosyaları) | `design/` |
| `tasarim/3d-eser/bursa/eserler/` | `eserler/` |
| `tasarim/3d-eser/ayasofya/` | `eserler/ayasofya/` |
| `3d-eser/_kutuphane/` ve yöntem rehberleri | `eserler/_kutuphane/` |
| `3d-eser/bursa/ref/` | `veri/bursa/` |
| `3d-eser/bursa/sablonlar/` | `veri/bursa/sablonlar/` |
