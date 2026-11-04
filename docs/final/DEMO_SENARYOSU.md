# Final demo senaryosu

Sunum süresi organizatörden henüz gelmedi; bu akış yaklaşık 10 dakika içindir. Süre kısaysa önce 7. ve 8. adımı kısaltın. 1, 3, 5 ve 6. adımlar şartnamenin zorunlu maddelerine karşılık gelir.

| # | Süre | Ne gösterilir | Ne söylenir | Şartname |
|---|---|---|---|---|
| 1 | 30 sn | Tanıtım sayfası, sonra «Haritayı aç» | Sorun: önünden geçtiğimiz vakıf eserlerini ve onları ayakta tutan sistemi bilmiyoruz. | §1, §5.2.1 |
| 2 | 1 dk | Harita, Bursa; tür filtresi; şehir menüsünden Konya ve Hatay | Veri sınıflandırılmış, yeni şehir veriyle gelir. | §5.1.1, §5.1.2, §5.1.3 |
| 3 | 2 dk | Ulu Cami: hikâye, ses, 3D, 7. cümlede şadırvan, «Kaynak» düğmesi, parça kartı | Her cümlenin kitap sayfası var. 3D temsilî olduğunu söylüyor. | §5.1.1, §5.1.3 |
| 4 | 1 dk | Bedesten'den Ulu Cami'ye altın gelir yolu (Ulu Cami, 11. cümle) | «Akar» vakfa gelir getiren mülktür; uygulamanın adı buradan gelir. | §5.2.1, §5.2.2 |
| 5 | 1 dk | Geçmişi Gör: eski fotoğraf ve bugün kaydırıcısı, «Temsili görsel» etiketi | Doğrulanmamış içerik gerçek gibi sunulmuyor. | §5.1.3 |
| 6 | 1,5 dk | Panel: bir metni değiştir, sonucu göster; bir açı kaydet, hikâyede göster; İz Bırak, «onay bekliyor», moderasyon | İçerik kod değişmeden güncellenir, katkılar onaydan geçer. | §5.1.1, §5.1.3 |
| 7 | 1 dk | «Aa»: kontrast ve yazı boyutu; EN; gece teması | Erişilebilirlik çalışan üründe. | §5.1.4 |
| 8 | 1,5 dk | Mimari şema ve «yeni eser nasıl eklenir» | Bkz. [Mimari](MIMARI.md). | §5.1.2, §5.4 |

## Göstermeyin ya da açıkça söyleyin
- **Rota ilerlemesi ve ziyaret tikleri:** Ziyaret düğmesi yok, dolmaz. Rotayı gösterin, ilerlemeyi göstermeyin.
- **«Bildir»:** Teşekkür mesajı gösterir, kayıt tutmaz. Sorulursa «API ucu planlı» deyin.
- **Görevlerdeki «Buradayım»:** Yalnız eserin yanında çalışır. Sahnede «evden» yolunu kullanın.
- **Hesap silme:** Canlı hesapta denemeyin, geri alınmaz.
- **İngilizce ses:** Canlıda kayıt üretilmediyse tarayıcı sesi okur.

## Canlıya göre yedek
Provada ikisini de hazır tutun:
1. **Ekran kaydı:** Akışın tamamını gerçek cihazda çekin. İnternet kesilirse tek güvenli yedek budur.
2. **Yerel sürüm:**

```bash
npm run dev:content
```

Yerel sürüm API istemez, ama **harita altlığı OpenFreeMap'ten, kayıtlı sesler Supabase'den gelir**; internet yoksa harita boş kalır ve ses çalmaz. Bunu çevrimdışı yapmadım, üç günde riskli buldum. Panel düzenlemeleri yerel sürümde yalnız o tarayıcıda kalır.

## Sahneden önce
- [ ] Önceden girilmiş bir admin hesabı.
- [ ] Temiz tarayıcı profili; ipuçları açık mı kapalı mı bilinçli seçilsin.
- [ ] Canlıda migration'lar ve içerik aktarımı bitti mi? (`BIRLESTIRME_NOTU_MOBIL_OPTIMIZASYON.md`)
- [ ] Sunumu takım üyeleri yapacak (§5.4).
