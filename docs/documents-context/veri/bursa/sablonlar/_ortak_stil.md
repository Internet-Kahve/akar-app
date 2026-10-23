# Ortak stil kuralları (tüm Bursa eserleri)

Referans dili: düz renkli, izometrik vektör illüstrasyonlar. Önceki `3d-eser/stil-ref/` klasörü mevcut çalışma ağacında bulunmuyor. Hedef: **3B modelde aynı dil**.

## 1. İlkeler
1. **Düz renk, 2–3 ton.** Her yüzey aydınlık / orta / gölge olmak üzere en çok 3 tonda. Fotoğraf dokusu yok, kontur çizgisi yok.
2. **Vurgu hiyerarşisi:** vurgu sayısı sınırlı değil, ama her vurgunun seviyesi var (1 ana, 2 ikincil, 3 küçük). Ana vurgu en doygun ve en abartılı; seviye düştükçe doygunluk ve detay azalır. Böylece her şey aynı anda bağırmaz.
3. **Doku azdır.** Tuğla, taş derzi, kabartma sadece belirli yerlerde (ör. minare gövdesi, kaide bandı). Duvarın tamamına kaplanmaz. Gerekirse ince çizgi bandı olarak.
4. **Gerçek ölçü, sade yüzey.** Oranlar plan ve envantere uyar, yüzey sadeleşir. Bu, modelin "temsili canlandırma" olduğunu gösterir.
5. **Kaide:** her model düz, yumuşak bir zemin diskinde durur: üstünde çim lekesi, altında pembe gölge elipsi. Ağaçlar yuvarlak ya da servi, en fazla 6 adet.
6. Kamera: izometrik bakışa yakın (yükseklik ≈ 30–35°, yatay ≈ 45°). Gölge yok, ışık sabit ve yumuşak.

## 2. Referans görsellerden örneklenen renkler (başlangıç önerisi)
| Rol | Hex | Nerede görülüyor |
|---|---|---|
| Arka plan | #F6D0AB | tüm referanslar |
| Zemin gölgesi | #E29B87 | eserin altındaki elips |
| Çim | #A0B46C · #91B278 · #84B693 | kaide |
| Ağaç (koyu) | #1A8070 · #416555 | servi, yuvarlak ağaç |
| Krem / beyaz taş | #F2F3E5 · #E9E3D3 | minare gövdesi, kilise cephesi |
| Lavanta-mavi (kubbe, külah) | #A8AEC1 · #8D8FA8 · #61719A | Sultanahmet, Yeni Cami |
| Lacivert (koyu kubbe, pencere) | #415072 · #425177 | pencere, koyu kubbeler |
| Kurşun mavi-gri | #95AEBA · #6E95A8 | Süleymaniye, çatılar |
| Tuğla kırmızı | #873B24 · #AD4327 · #C6755B | Kariye, Fener Lisesi |
| Pembe-kahve taş | #C39482 · #E2B7A4 · #BC8D7E | kale, saray, kütüphane |
| Zeytin yeşili (çatı) | #5E8072 · #94B191 | kilise çatıları |

Hex değerleri referans görsellerin baskın renklerinden otomatik örneklendi; son karar tasarım sorumlusunun.
Şehir kimliği: Bursa için renk modele değil **kaide ve arayüz vurgusuna** eklenir.

## 3. Tür bazlı stil özeti
| Tür | Baskın ton | Vurgu önerisi | Doku önerisi |
|---|---|---|---|
| Cami | krem duvar, lavanta kubbe, beyaz minare | kubbeler, minare külahı, taç kapı | tuğla yalnız minare gövdesinde; cephede ince nişler |
| Türbe | krem gövde, lavanta kubbe ya da külah | kubbe / külah | yok ya da tek ince bant |
| Han | pembe-kahve taş, terakota çatı | avlu içi mescit, giriş portali | taş-tuğla almaşık yalnız portalde ve bir bantta |
| Hamam | krem, kurşun mavi-gri kubbe | kubbe grubu, külhan bacası | kubbe üstünde fil gözü delikleri (koyu nokta) |
| Medrese | pembe-kahve, mavi kemer içleri | dershane kubbesi, revak kemerleri | kemerlerde tek sıra renk bandı |
| Bedesten | pembe-kahve gövde, kurşun kubbeler | kubbe sırası | gövde üstünde tek yatay çizgi |
| Çeşme | krem taş, mavi pano | pano ve çeşme gözü | yok |

## 4. Yasaklar
- Fotoğraf dokusu, gerçekçi tuğla/taş kaplama, ışık pişirmesi (hafif vertex AO hariç).
- Eserin gerçekte olmayan süsünü eklemek. Şüpheli yeri sade bırak.
