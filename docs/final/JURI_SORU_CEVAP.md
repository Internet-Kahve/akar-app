# Jüri soruları ve cevapları

Rakamlar bu dalın içeriğinden ve belgelerinden alındı. Sahnede emin olmadığınız şeyi «bilmiyorum, bakarım» deyin.

## Vakıf ve içerik (Vakıf Katılım, VGM)
**İçeriğin doğruluğunu kim onaylıyor?** Her hikâye cümlesi envanter kitabının sayfasına bağlı ve güven etiketi taşıyor. Çıkarım ve temsilî olanlar işaretli. Uygulamada «Kaynak» düğmesiyle görülür. İngilizce metinler yapay zekâ desteğiyle çevrildi, henüz uzman incelemesinden geçmedi; bunu saklamayın.

**Fotoğraf ve metin hakları?** Envanter metin ve fotoğrafları Vakıf Katılım tarafından proje için verildi. Foto Atlas'ta kayıt başına izin durumu tutuluyor. Temsilî görseller yapay üretim ve etiketli. Tablo: `docs/LISANSLAR.md`.

**«Akar» ne demek, neden bu ad?** Akar, vakfa gelir getiren mülktür. Bedesten'in geliri Ulu Cami'yi yaşatır; uygulama bu bağı 3D'de altın yolla gösterir.

**Modeller gerçeğe uygun mu?** Temsilî. Ölçüler rölöve ve kaynaklardan alındı ama birebir rölöve değil; arayüzde «Temsili» yazıyor.

## Teknik (Bilişim Vadisi)
**11 eserden 385'e nasıl çıkılır?** Panel ve içe aktarma hattı var. Temel kart için hikâye ve 3D gerekmez; modeli olmayan eser fotoğrafla açılır. Bursa'nın ham listesi var, ama koordinat ve doğrulama iş istiyor. Başvurudaki «tüm eserler haritada» cümlesini bu yüzden katmanlı içerik olarak açıklayın.

**3D ağır değil mi?** Harita için pişmiş dosya kullanılıyor. Ulu Cami'de indirme 1,72 MB'tan 0,78 MB'a, 8 modelde çizim çağrısı 272'den 16'ya indi (ölçüm: `DEVIR_3KASIM.md`). Doku belleği ise arttı (10'dan 23 MB'a). Ölçümler yazılımsal GPU ve M4'te, telefonda değil.

**Mimari?** Bkz. [MIMARI.md](MIMARI.md): Next.js, Fastify, Supabase; ortak domain paketi.

**Test?** Birim testler ve masaüstü ile telefonda Playwright; API için ayrı testler. Son sayıları raporda.

**Güvenlik?** Sınırda Zod doğrulama, dosya türü içerikten denetlenir, RLS, hız sınırı, kullanıcı katkısı onaydan geçer.

**Harita hizmeti kesilirse?** OpenFreeMap'e bağlıyız; kesilirse altlık gelmez, eser listesi ve sayfaları çalışır. Çevrimdışı modumuz yok.

## Kullanıcı ve KVKK
**Kişisel veri?** E-posta (giriş yapanda), anı ve fotoğraf (açık rızayla), rıza kaydı. Tercihler tarayıcıda kalır. Fotoğraf yüklenmeden önce cihazda yeniden çizilir, EXIF gitmez. Hesap ve veriler profilden silinir. Aydınlatma metni **taslak**, hukuki onay almadı.

**Erişilebilirlik?** Sesli anlatım ve metin birlikte, yüksek kontrast, üç yazı boyutu, klavye, alt metin. Otomatik taramada ana ekranlarda WCAG A/AA ihlali çıkmadı. [VoiceOver denemesinin sonucunu buraya yazın.]

**Neden ikinci kez açılır?** Rota, görevler, rozetler, Yaşayan Hafıza. Zayıf yan: ziyaret kaydı bağlı değil; bunu dürüstçe söyleyin.

## Takım
Şartname her üyenin ürünü anlatabilmesini istiyor (§5.2.3). Herkes en az şunları bilmeli: akar ne demek, veri nereden geliyor, yeni eser nasıl eklenir, en zayıf yanımız ne.
