# Envanter verisinden çıkarılanlar (13 Ekim 2026, taslak)

- `veri/kaynak_pdf/` (Vakıf Katılım kitapları) ve `veri/metin/` Git dışındadır; proje için izinli, ekibe kısıtlı Drive klasöründen verilir (22 Ekim 2026).
- `veri/metin/*.txt`: her cildin düz metni (pdftotext). PDF'leri yeniden çevirmeye gerek yok.
- `veri/eserler_taslak.csv`: otomatik çıkarılan eser listesi — il, ilçe, cilt, sayfa, ad, ad_en, tür, adres_ham.
  - Kapsam: Konya 252 / 289, Bursa 285 / 385, Hatay 76 / 117 (Hatay yalnız içindekilerden, ilçe ve adres yok).
  - Eksik ve hatalı satırlar var (başlık biçimi farklı olan kayıtlar kaçtı, "Diğer" türleri elle bakılmalı).
  - Sayfa numaraları PDF sayfasıdır (Hatay'da kitap sayfasından yaklaşık).
- Koordinat yok: konum yalnız adres metni olarak var, haritaya koymak için geocoding gerekir.
- Kütahya (141 eser) bilgi notunda geçiyor ama kitabı klasörde yok.

- `veri/bursa/bursa_eserler.csv`: Bursa'nın ayrıntılı listesi (408 satır; cilt, sayfa, ilçe, ad, tür, rol, ölçü sayısı, kubbe geçişi, metin uzunluğu, adres). Kitap 385 diyor; ad + ilçe aynı olan yalnız 2 satır var (22 Ekim 2026), kalan farkın nedeni kontrol edilecek.
- `veri/bursa/bursa_3d_adaylari.md`: 3D aday eserler ve ana hikâye önerisi (Ulucami + Bedesten).
- Uygulama şeması ve içe aktarma kuralları: `FRONTEND_BACKEND_NOTLARI.md`.

- `veri/fotoatlas/`: Foto Atlas'tan alınan 10.214 eski fotoğraf kaydı (konum, yön, kaynak, lisans, izin durumu). Önce `fotoatlas/IZIN_DURUMU.md` dosyasını oku; sadece `durum` alanı `kullanilabilir` / `kullanilabilir-yas` olanlar kullanılır. (21 Ekim 2026) 22 Ekim: Bursa'daki 236 kullanılabilir fotoğraf indirildi, 56'sı 17 esere bağlandı; Geçmişi Gör paketi `fotoatlas/cikti/`, klasör rehberi `fotoatlas/BENIOKU.md`.
