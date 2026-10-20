# Eserler ve 3D üretim

Her eser kendi klasöründe tutulur. Önce `eser.md`, ardından varsa eserin notları ve üretim README'si okunur. Klasör adları eser kimliğini taşır; il bilgisi eser belgesinde yer alır.

- [Modelleme yöntemi](_kutuphane/AKAR_3D_Yontem_Notlari.md)
- [Üretim rehberi](_kutuphane/BENIOKU.md)
- [Çalışma sırası](_kutuphane/CALISMA_SIRASI.md)
- [Tür şablonları](../veri/bursa/sablonlar/README.md)
- [Ortak stil](../veri/bursa/sablonlar/_ortak_stil.md)
- [Ulucami modelinin güncel notları](ulu-cami/3d/README.md)

Esere özel referanslar tek `ref/` klasöründe toplanır: `ref/foto/` (fotoğraflar), `ref/plan/` (rölöve, plan, kesit, cephe çizimleri), `ref/metin/` (PDF metin çıkarımları), `ref/maket/` (maket ve başka 3D model görüntüleri; ölçü için kullanılmaz) ve her türev dosyanın kaynak PDF/sayfa kaydı `ref/kaynak_dizini.json`. 19 Ekim 2026 itibarıyla Ulu Cami, Koza Han, Yıldırım Bayezid Bedesteni, Orhan Bey Camii (`orhan-bey-kulliyesi/`), Orhan Bey Hamamı ve Emir Hanı bu düzende; Ulu Cami v23 teslim edildi (planı silindi); diğerlerinde sıradaki tur için `SONNET_REVIZYON_PLANI.md` var. Ortak sahne kuralları: [Genel sahne standardı](_GENEL_SAHNE_STANDARDI.md). Üretim klasörlerindeki `build/`, `blend/`, `export/` ve `kontrol/` birbirini tamamlar; tek başına GLB dosyasını taşımak üretim kaynağını taşımaz. Ortak kaynak belgeleri `../veri/bursa/` altındadır.

## Orhan Bey Külliyesi ile ilişkili eserler

- [Külliye ve cami üretimi](orhan-bey-kulliyesi/eser.md)
- [Orhan Bey Hamamı / Aynalı Çarşı](orhan-bey-hamami/eser.md)
- [Emir Hanı](emir-han/eser.md)
- [Orhan Gazi İmareti (yıkık, temsili)](orhan-gazi-imareti/eser.md)
- [Orhan Gazi Türbesi](orhan-gazi-turbesi/eser.md)
- [Yarhisar Orhan Gazi Hamamı — ayrı eser](aday-eserler/orhan-gazi-hamami-yarhisar/eser.md)

## Akar–hayrat bağı için eklenenler (19 Ekim 2026)

- [Orhan Gazi Türbesi](orhan-gazi-turbesi/eser.md): kaynak hazır, `SONNET_REVIZYON_PLANI.md` (v01) var.
- [Yarhisar Orhan Gazi Çeşmesi](yarhisar-orhan-gazi-cesmesi/eser.md) (Yenişehir): ölçülü çizim ve plan var, `SONNET_REVIZYON_PLANI.md` (v01) var.
- [Orhan Gazi İmareti](orhan-gazi-imareti/eser.md): yıkık (1936); 3D yok, yalnız hikâye kartı.
- [II. Bayezid Külliyesi, İstanbul](istanbul-bayezid-kulliyesi/eser.md): Koza Han'ın gelirinin gittiği yer; 3D yok, yalnız hikâye kartı.
