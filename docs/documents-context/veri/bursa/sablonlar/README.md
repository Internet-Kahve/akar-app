# Bursa · eser şablonları

Her eser türü için doldurulacak bir şablon. Claude bu dosyayı okuyup Blender'da modeli kurar. Önce `_ortak_stil.md`'yi oku.

| Dosya | Tür | Satır (eser-turleri.csv) |
|---|---|---|
| `cami.md` | cami, mescit | 203 |
| `turbe.md` | türbe | 64 |
| `han.md` | han | 32 |
| `hamam.md` | hamam | 28 |
| `medrese.md` | medrese, mektep | 21 |
| `kulliye.md` | külliye (birleşim) | 13 |
| `cesme.md` | çeşme | 11 |
| `tekke_imaret.md` | tekke, zaviye, imaret | 15 |
| `bedesten.md` | bedesten | 3 |

## Nasıl kullanılır
1. Eser için şablonu `eserler/<eser>/eser.md` olarak kopyala.
2. Bildiğin alanları doldur. Bilmediğin alanı **boş bırak**, uydurma. Kaynak sütununa P/E/H/W/O/M/F/T yaz.
3. Stil bölümünde vurguları seviyeleriyle (1 ana, 2 ikincil, 3 küçük) ve doku yerlerini yaz.
4. Claude'a: "akar-3d-model skill'ini yükle, bursa/<eser>/eser.md'yi oku ve kütle turunu yap."

## Kaynak kuralları

`H` hesap: kitaptaki değerlerden türetilir; formül ve girdilerin cilt/PDF sayfası Not alanına yazılır. Öncelik P > E > H > W > O > M > F > T.

**Bir hücre = bir kaynak = bir sayfa.** Ayrı sayfalardan gelen bilgiler ayrı satırlara bölünür; eser-turleri.csv tarihî bilgi veya ölçü kaynağı değildir.
