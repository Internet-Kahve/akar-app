# AKAR · Klasör yapısı

17 Ekim 2026, güncelleme 22 Ekim, 2 Kasım ve 4 Kasım 2026. Giriş: [README](README.md).

```text
documents-context/
├── README.md
├── KLASOR_YAPISI.md
├── AKAR_Tam_Baglam.md
├── FRONTEND_BACKEND_NOTLARI.md
├── ICERIK_YONTEMI.md         Eser içeriği (hikâye, fotoğraf, kaynak) kuralları
├── ICERIK_INGILIZCE.md        İngilizce içerik dosyalarının biçimi
├── ENTEGRASYON_29EKIM.md     Prototipten ürüne veri/şema kararları (BACKEND-DECISIONS bunlara atıf yapar)
├── DEVIR_3KASIM.md           Son işin devir notu: performans, ipuçları, pişirme
├── BIRLESTIRME_NOTU_MOBIL_OPTIMIZASYON.md  Birleştirme ve canlıya çıkış adımları
├── YAPILACAKLAR.md           Ekip düzeyinde açık işler
├── PROTOTIP_DERSLERI.md
├── hackathon/                Yarışma PDF'leri ve rehber (Git dışında)
├── design/
│   ├── README.md
│   ├── ikonlar/
│   ├── desenler/
│   ├── logo/
│   └── harita/
├── eserler/
│   ├── README.md
│   ├── _kutuphane/           Ortak Blender yardımcıları ve yöntem
│   ├── ulu-cami/
│   ├── yildirim-bayezid-bedesteni/
│   ├── ayasofya/             Önceki pilot (sürüm klasörleri v20–v24; Git dışında)
│   ├── aday-eserler/         Henüz işlenmemiş 30 aday eser (eser.md + ref; Git dışında)
│   ├── _GENEL_SAHNE_STANDARDI.md  Renk, ışık, zemin kuralları
│   └── <eser>/               eser.md, eser.json, notlar, icerik/, gecmisi-gor/, 3d/export (`model.json` adındaki GLB'ler ve `_sunum` sürümleri; ref/, 3d/blend, build, kontrol Git dışında)
└── veri/
    ├── BENIOKU.md
    ├── kaynak_pdf/           Vakıf Katılım envanter PDF'leri (Git dışında; ekibe kısıtlı Drive'dan)
    ├── metin/
    ├── eserler_taslak.csv
    ├── sehir/                Şehir kayıtları: kimlik, sahne, harita (uygulama okur)
    ├── rota/                 Editoryal rotalar (uygulama okur)
    ├── bursa/                Ortak kaynaklar, kararlar, denetim ve şablonlar
    ├── bursa-foto/           Envanter fotoğrafları ve manifest (Git dışında)
    ├── fotoatlas/            Foto Atlas eski fotoğrafları, izinler, betikler (Git dışında; uygulama paketi eserler/<eser>/gecmisi-gor/)
    └── vakıf-eserleri-envanteri/  Büyük yerel kaynak arşivi (Git dışında)
```

## Yerleştirme kuralları

- Ürünün tamamına ilişkin belgeler doğrudan `documents-context/` kökünde, yarışma belgeleri `hackathon/` altında tutulur.
- Tek esere ait kaynak ve modeller `eserler/<eser>/` altında birlikte kalır. Ortak PDF ve veri kaynakları `veri/bursa/` altında tutulur; eser notundan kaynak gösterilir.
- `eser.md` kimlik, ölçü ve kaynakların giriş noktasıdır. Model kararları eserin notlarında veya üretim klasörünün README'sinde tutulur.
- Üretim dizininin adı `3d/` olur (araç adı taşımaz; 22 Ekim 2026 itibarıyla modeli olan yedi eserin hepsi bu düzende: Ulu Cami, Koza Han, Bedesten, Orhan Bey Camii, Orhan Bey Hamamı, Emir Hanı, Orhan Gazi Türbesi. `claude/` ya da `gpt/` adlı dizin kalmadı). Yalnız son sürüm tutulur; sürüm geçmişi `3d/README.md` içinde yazılı kalır. İçlerinde `build/` betikleri, `blend/` kaynak sahneleri, `export/` GLB teslimleri, `kontrol/` render ve raporlar bulunur. Sırf standart olsun diye boş klasör açılmaz.
- Ortak modelleme yardımcıları `eserler/_kutuphane/`; tür şablonları `veri/bursa/sablonlar/` altındadır.
- `design/` tasarım kaynakları ve tarihli referanslar içindir. Çalışan arayüz kodu burada tutulmaz; `apps/web` altındadır. İçerik okuyucuları `services/api/scripts/`, içerik araçları `scripts/content/` altındadır.
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

## Eser klasörü: `icerik/` (30 Ekim 2026, yedi eserde aynı)

Yalnız fotoğraflı dört eserde (İnebey Medresesi, Alaaddin Bey Çeşmesi, Karatay Medresesi, Habib-i Neccar Camii) `3d/`, `parcalar.md` ve `eser-hakkinda-okuma.md` yok; fotoğraflar `foto/kitap/` içinde (envanter kitabından). Hatay kitabının metni `scripts/content/envanter_metni_cikar_hatay.py` ile çıkarılır.

| Dosya | Ne | Uygulama okur mu |
| --- | --- | --- |
| `hikaye.md` | Hikâye cümleleri, 3D açıları, «Akar akışı», «Yalnız rotada» | evet |
| `fotograflar.md` + `foto/` | Galeri fotoğrafları ve künyeleri | evet |
| `eser-hakkinda.md` | Envanter metninin tamamı (kitaptan birebir), bölümlü | evet |
| `eser-hakkinda-okuma.md` | Okuma katmanı: özet, rakam, alıntı, zaman, terim, 3D açısı | evet |
| `kitap-fotograflari.md` + `foto/kitap/` | Envanter kitabındaki fotoğraflar ve yerleri | evet |
| `parcalar.md` | 3D parça kartları | evet |
| `gorevler.json` | Bulmaca, saha görevi, rozetler | evet |
| `en/` | İngilizce karşılıklar (`ICERIK_INGILIZCE.md`) | evet (varsa) |

## 2 Kasım 2026 temizliği

Biten iş emirleri (`promptlar/`), eski 3D revizyon planları (`eserler/*/SONNET_REVIZYON_PLANI.md`), `icerik/_eski/` taslakları, `eserler/ulu-cami/3d/kart_onerisi_v30.md`, prototipin tarihli kaydı (`design/PROTOTIP_KAYDI.md`), `PROTOTIP_URUN_FARKI.md` (`PROTOTIP_AKTARIM.md` §2 de Git geçmişinde) ve çalışma günlüğü `yaptiklarim-2.md` çalışma ağacından kaldırıldı; hepsi Git geçmişinde (commit `f7df24c` ve öncesi). Eski belgelerdeki bu dosyalara bağlantılar tarihsel kayıttır.

## 4 Kasım 2026 temizliği

Kullanılmayan eski GLB sürümleri ile biten iş notları (`IS_PLANI_2KASIM.md`, `MOBIL_SADELIK_3KASIM.md`, `OPTIMIZASYON_3KASIM.md`, `PISIRME_ISTEMI_*.md`, `PROTOTIP_AKTARIM.md`), 14–15 Ekim denetim raporları (`veri/bursa/denetim/`), eski kararlar ve 3D aday listesi, `eser-hakkinda-ozet.md` dosyaları ve eski istemler çalışma ağacından kaldırıldı; hepsi Git geçmişinde. Her eserde yalnız `model.json` içinde adı geçen GLB'ler ve onların `_sunum` sürümleri kalır.
