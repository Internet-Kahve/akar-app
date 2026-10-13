# AKAR · Klasör yapısı (13 Ekim 2026'da düzenlendi)

```
akar-app-baglam/
├── belgeler/                 Proje bağlamı (yapay zekâlar ve ekip için önce bunlar okunur)
│   ├── AKAR_Tam_Baglam.md     Projenin tam bağlamı
│   ├── PROJE_REHBERI.md       Kod devir rehberi
│   ├── AKAR_Claude_Promptlari.md
│   ├── AKAR_Devir_Notu_13Ekim.md  Son durum (yeni yapay zekâ oturumu buradan başlar)
│   ├── FRONTEND_BACKEND_NOTLARI.md  Ekip için güncel şema, panel akışı, kurallar (13 Ekim)
│   ├── hackathon/             Başvuru, KÖK&KOD bilgi notu, şartname
│   └── _arsiv/                Eskimiş devir notları
├── veri/                     Vakıf Katılım envanter verisi
│   ├── kaynak_pdf/            Bursa (3 cilt), Konya (2 cilt), Hatay kitapları
│   ├── metin/                 Ciltlerin düz metni (PDF'i tekrar çevirmeye gerek yok)
│   ├── eserler_taslak.csv     3 ilin otomatik eser listesi (taslak)
│   ├── bursa/                 bursa_eserler.csv (ayrıntılı liste) + bursa_3d_adaylari.md
│   └── BENIOKU.md
├── tasarim/
│   ├── karsilastirma/         Figma ↔ kod karşılaştırması (13 ekran + KARSILASTIRMA.md)
│   ├── tokens.css             Renk, ölçü, yazı token'ları
│   ├── ikonlar/               AKAR SVG ikon seti
│   ├── desenler/              Şehir desenleri + AKAR amblemi (SVG, desen.py)
│   └── harita/                MapLibre stili (akar-style.json) ve önizleme
├── 3d-eser/
│   ├── AKAR_3D_Yontem_Notlari.md   Yeni eserler buradan başlar
│   ├── _kutuphane/            akar3d.py (Blender yardımcı kütüphanesi) + ornek_test.py
│   ├── ayasofya/              Pilot (KAPANDI, v19). Klasör adı build betiklerinde yazılı: değiştirmeyin.
│   └── _arsiv/                Eskimiş başlangıç prompt'u
```

Eski → yeni yol: `sources/maps` → `tasarim/harita`, `sources/tokens.css` → `tasarim/tokens.css`,
`sources/AKAR_ikonlar_svg` → `tasarim/ikonlar`, `figma-ekranlar` → `tasarim/figma-ekranlar`,
`vakıf-katılım-sources/*.pdf` → `veri/kaynak_pdf` (hackathon belgeleri → `belgeler/hackathon`),
`vakıf-katılım-sources/_cikti/*` → `veri/`.
