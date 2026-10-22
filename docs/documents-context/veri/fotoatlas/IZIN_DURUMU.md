# Foto Atlas verisi ve görsel izin durumu

> Bu klasörü okuyan agent ya da takım arkadaşı için: Foto Atlas'tan alınan eski fotoğraf kayıtları burada. Bir görseli uygulamada kullanmadan önce `tum.json`'daki `durum` alanına bak. Sadece `kullanilabilir` ve `kullanilabilir-yas` olanlar kullanılır, her birinde `kaynakSatiri` gösterilir. Durum değiştirmek için dosyaları elle düzenleme, `durum_guncelle.py` betiğini kullan (aşağıda).

Son güncelleme: 21 Ekim 2026 (Dumbarton Oaks cevabı işlendi)

## Veri

- Kaynak: fotoatlas.net herkese açık API. Caner Cangül'ün (Foto Atlas sahibi) izniyle **21.10.2026'da tek seferlik** çekildi.
- **Uygulama Foto Atlas'a canlı bağlanmayacak.** Foto Atlas ileride Kültür Envanteri'ne taşınacak, API değişecek. Veri ve seçilen görsellerin kopyası projede tutulur. Görseller `cdn.fotoatlas.net`'ten doğrudan gösterilmez.
- Her kayıtta `fotoAtlasId` var. Kültür Envanteri'ne geçişte eşleştirme için saklanır.

| Dosya | İçerik |
|---|---|
| `tum.json` | 10.214 kaydın hepsi (konum, yön, fotoğrafçı, tarih, asıl arşiv, lisans, `durum`). Uygulama bunu kullanır |
| `tum-liste.csv` | Aynı veri, Excel'de açılır. Bursa için `il`, kullanılabilirler için `durum` sütununu filtrele |
| `kurum-izin-listesi.csv` | 99 kurum, her satırda bir kurum. Karar, e-posta, gönderim ve cevap sütunları |
| `durum_guncelle.py` | Kurumdan cevap gelince durumları güncelleyen betik |

Alanlar: `yon` derece cinsinden, 0 = kuzey, saat yönünde artar. `cekimNoktasi: null` = Foto Atlas'ta konum işaretlenmemiş. `tahmini-konum` etiketli kayıtların konumu yaklaşık.

## Durum etiketleri (`durum` alanı)

| Durum | Anlamı | Tümü | Bursa |
|---|---|---|---|
| `kullanilabilir` | Kesin: açık lisans (CC0, CC BY, CC BY-SA, PDM), ticari olmayan lisans (CC BY-NC) ya da yazılı izin | 2.614 | 166 |
| `kullanilabilir-yas` | Büyük ihtimalle kamu malı: fotoğrafçı bilinmiyor ve fotoğraf 1955 veya öncesine ait | 1.892 | 3 |
| `izin-bekleniyor` | Kuruma e-posta atıldı, cevap bekleniyor | 3.175 | 387 |
| `belirsiz` | Lisans yok. Fotoğrafçı belli ise ölüm yılına bak: 1955 veya öncesinde öldüyse kullanılabilir | 1.709 | 63 |
| `kullanma` | Her hakkı saklı ya da 1956 sonrası ve fotoğrafçısı bilinmiyor | 824 | 24 |

Kurallar:
- Her görselde `kaynakSatiri` gösterilir: fotoğrafçı · asıl kaynak (arşiv no) · Foto Atlas aracılığıyla.
- **ND** lisanslı fotoğraflarda kırpma ve düzenleme yapılmaz (`durumNotu` alanında yazıyor).
- `kullanilabilir-yas` genel kurala dayanır: Türkiye'de fotoğraf, fotoğrafçının ölümünden sonra 70 yıl korunur. Fotoğrafçı bilinmiyorsa süre yayından itibaren 70 yıldır. Kesin hukuki görüş değil. Biri itiraz ederse fotoğraf kaldırılır.

## Yazılı izinler

| Kurum | Kapsam | Kim / nerede | Tarih |
|---|---|---|---|
| Foto Atlas | Kayıtları kaynak göstererek kullanma, veriyi tek seferlik çekme | Caner Cangül, Foto Atlas Telegram grubu | 20–21.10.2026 |
| Mazhar Yüce Doruk Koleksiyonu | 126 fotoğraf (118'i Bursa) | Caner Cangül: "Sakıncası olmaz", Telegram | 21.10.2026 |
| Vakıf Katılım envanter kitapları | Sponsorun verisi, uygulamada kullanılabilir | Takım kararı | — |

Telegram mesajlarının ekran görüntüleri lisans tablosunun yanında saklanacak.

## Cevap beklenenler

| Kurum | Fotoğraf (Bursa) | E-posta | Gönderim | Ne soruldu |
|---|---|---|---|---|
| Dumbarton Oaks (Artamonoff) | 347 (23) | library@doaks.org | 21.10 19:24 | **Cevap geldi (21.10, Bettina Smith): kullanılamaz.** CC lisansı sadece eski sitenin metni için; fotoğraflar bağış senedi olmadan verilmiş, izin veremiyorlar. 347 kayıt `kullanma` yapıldı. Alternatif: Byzantine Institute fotoğrafları CC0 (HOLLIS Images'ta MSBZ004 araması, çoğu İstanbul) |
| İÜ Nadir Eserler Kütüphanesi (Yıldız Albümleri) | 760 (67) | iubilgi@istanbul.edu.tr | 21.10 19:25 | Türkiye fotoğrafları için kullanım izni / başvuru süreci |
| Médiathèque du patrimoine (Albert Gabriel) | 1.544 (240) | mediatheque.patrimoine@culture.gouv.fr | 21.10 19:27 | Türkiye fotoğrafları için kullanım izni ve prosedür |
| Deutsche Fotothek | 306 (0) | Deutsche.Fotothek@slub-dresden.de | 21.10 19:31 | Helbig (her hakkı saklı) ve lisanssız eski fotoğraflar |
| İstanbul Araştırmaları Enstitüsü (Arif Hikmet Koyunoğlu) | 138 (68) | bilgi@iae.org.tr, cc kutuphane@iae.org.tr | 21.10 19:43 | Kullanım izni ve kaynak satırı. Koyunoğlu 1982'de öldüğü için telifli |
| British School at Athens (SPHS) | 430 (12) | archive@bsa.ac.uk | 21.10 19:44 (19:54'te tekrar gitmiş) | Kullanım izni ve kaynak satırı |
| Koç Üniversitesi Yayınları (Artamonoff hak sahibi sorusu) | Artamonoff 347 (23) | kup@ku.edu.tr | 21.10 akşam | 2013 Artamonoff kitabı için izni kimden aldılar, mirasçılara nasıl ulaşılır |

- 21.10: Foto Atlas'a (Caner Cangül, Telegram) Artamonoff kayıtlarındaki CC BY-NC-SA bilgisinin yanlış olduğu, Dumbarton Oaks cevabının ekran görüntüsüyle bildirildi.

Takip:
- **28 Ekim**: cevap gelmeyenlere kısa bir hatırlatma. İÜ'den cevap gelmezse kütüphane daire başkanlığının adresine yaz. Médiathèque'ten gelmezse fotoğraf bölümü sorumlusuna yaz (adresi service-public.gouv.fr rehberinde).
- Cevap gelince `kurum-izin-listesi.csv` dosyasında `cevap` sütununu doldur. İzin geldiyse o kurumun kayıtlarını `kullanilabilir` yap.
- Gmail'de mediatheque adresine 22.10.2060'a zamanlanmış yanlış bir e-posta duruyordu (Deutsche Fotothek metni). İptal edilmeli.

## Cevap gelince ne yapılır

Bu klasörde terminalden çalıştır. Önce `--deneme` ile ne değişeceğine bak, sonra `--deneme` olmadan çalıştır:

```
python3 durum_guncelle.py --kurum "BSA SPHS Image Collection" --durum kullanilabilir --not "İzin verdi, 02.11.2026 e-posta" --deneme
python3 durum_guncelle.py --kurum "BSA SPHS Image Collection" --durum kullanilabilir --not "İzin verdi, 02.11.2026 e-posta"
```

- İzin geldiyse `--durum kullanilabilir`, reddettiyse `--durum kullanma`. `--not` alanına kim, ne zaman, hangi kanaldan yaz.
- Betik sadece `izin-bekleniyor` olan kayıtları değiştirir. Açık lisanslı kayıtlar korunur.
- `tum.json`, `tum-liste.csv` ve `kurum-izin-listesi.csv` birlikte güncellenir. Bu dosyadaki "Cevap beklenenler" tablosuna da cevabı elle ekle.
- Kurum adını tam yazmak gerekir. Bütün adları görmek için: `python3 durum_guncelle.py --liste`

Bekleyen altı kurumun betikteki adları:

| Kurum | `--kurum` değeri |
|---|---|
| Dumbarton Oaks | `Dumbarton Oaks Research Library and Collection` |
| İÜ Nadir Eserler | `İstanbul Üniversitesi Nadir Eserler Kütüphanesi` |
| Médiathèque du patrimoine | `Ministère de la Culture (France)` |
| Deutsche Fotothek | `Deutsche Fotothek` |
| İstanbul Araştırmaları Enstitüsü | `İstanbul Araştırmaları Enstitüsü` |
| British School at Athens | `BSA SPHS Image Collection` |

Dumbarton Oaks "CC BY-NC-SA bütün koleksiyona geçerli" derse durum `kullanilabilir` olur, not alanına lisansı yaz. ND/NC kuralları geçerli kalır.

## Jüriye anlatım

"Foto Atlas'taki 10.214 kaydın tamamını, sahibinin izniyle aldık. Lisansı açık olanları ve yaşı nedeniyle kamu malı olanları kullanıyoruz (4.579 kayıt). Telifli arşivler için altı kuruma izin talebi gönderdik, cevap bekliyoruz. Her görselde fotoğrafçı ve asıl arşiv yazılı. Uygulama veriyi kendi içinde tutuyor, Foto Atlas'a bağımlı değil."
