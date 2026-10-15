# AKAR · Klasör yapısı

14 Ekim 2026, güncelleme 15 Ekim (ikinci güncelleme). Başlangıç ve okuma sırası: `README.md`.

```text
documents/
├── README.md
├── KLASOR_YAPISI.md
├── belgeler/
│   ├── AKAR_Tam_Baglam.md             Ürün bağlamı; güncel kararlar §0.5
│   ├── FRONTEND_BACKEND_NOTLARI.md     Şema, panel ve yayın kuralları
│   ├── PROTOTIP_DERSLERI.md            Eski prototipten kalan kamera/hikâye dersleri
│   ├── GOREV_DAGILIMI_15Ekim.md        Kim ne yapacak (ChatGPT / Talha / Claude)
│   ├── hackathon/                     Üç kaynak PDF ve okuma rehberi
│   └── _arsiv/                        Eski promptlar
├── veri/
│   ├── BENIOKU.md                     Kapsam ve bilinen hatalar
│   ├── kaynak_pdf/                    Altı envanter kitabı
│   ├── metin/                         Kitapların çıkarılmış metinleri
│   ├── eserler_taslak.csv              613 ham kayıt
│   ├── bursa/                         408 ham kayıt ve 3D adayları
│   └── bursa-foto/                    Bursa kitap fotoğrafları (~1975) + _manifest.csv
└── tasarim/
    ├── tokens.css
    ├── ikonlar/  desenler/  harita/  karsilastirma/
    ├── ekranlar-15ekim/               Fotoğraf/3D ve panel Hikâye ekranları (21 PNG)
    ├── ilk-prototip-kılıç-ali-pasa-düz-stil/   Eski prototip (referans)
    └── 3d-eser/
        ├── BENIOKU.md                 Güncel durum ve üretim rehberi
        ├── AKAR_3D_Yontem_Notlari.md
        ├── CALISMA_SIRASI.md
        ├── _kutuphane/                Blender yardımcıları (akar3d.py)
        ├── stil-ref/                  Ortak görsel referanslar
        ├── ayasofya/                  Kapanmış pilot
        └── bursa/
            ├── KARARLAR_14Ekim.md     11 çelişkinin kararları
            ├── eser-turleri.csv
            ├── osm_secilen.csv        Seçilen OSM ayak izleri (çapraz kontrol)
            ├── sablonlar/             _ortak_stil.md + 9 tür şablonu
            ├── ref/                   Ortak Bursa kaynakları (Ulucami planı vb.)
            ├── denetim/               GPT denetim raporları + URL–alıntı denetimi
            ├── eserler/               32 eser, her biri eser.md (+ gerekirse model)
            │   └── ulu-cami/          eser.md + ref-* + claude/ (build, blend, export v02c, kontrol)
            └── _arsiv/                Yedekler, ham OSM, eski planlar (silinebilir)
```

## Düzen kuralları

- Eser verisi `tasarim/3d-eser/bursa/eserler/<eser>/eser.md` içindedir; model dosyaları aynı klasörde (şimdilik yalnız Ulucami'de `claude/`).
- `eser.md` kaynak kodları: P, E, H, W, O, M, F, T. Boş hücre = tür varsayılanı (VARSAYIM).
- Kaynaklar ve düzenlenebilir asıl dosyalar korunur; eski karar belgeleri `_arsiv/` altındadır.
- Kurulum dosyaları, otomatik yedekler ve önbellekler eklenmez.
- CSV'ler taslaktır; temizlenmeden yayın verisi sayılmaz.
