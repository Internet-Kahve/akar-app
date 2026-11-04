# PR metni

**Başlık:** feat(web): mobil sadelik ve performans, pişmiş harita modelleri, yeni tanıtım, İngilizce içerik

## Özet

Telefonda uygulamayı sadeleştirir ve hızlandırır, haritayı pişmiş model dosyalarına geçirir, ipuçlarını ve açıları yeniler, tanıtım sayfasını değiştirir, içeriği İngilizceye çevirir, erişilebilirlik ve KVKK eksiklerini kapatır.

**Birleştirmeden önce okuyun:** `docs/documents-context/BIRLESTIRME_NOTU_MOBIL_OPTIMIZASYON.md`
Ayrıntılı rapor: `docs/final/RAPOR.md`

## Neler değişti

- **Performans:** pişmiş harita dosyaları (7 eser), yakın zoomda sunum modeli, parça birleştirme, boyutuna göre fotoğraf, tek seferlik gölge.
- **Telefon:** yeni hikâye ve eser kartı, dokunarak ilerleme, sekmeler ve çipler kalktı, tek yuvarlak dil düğmesi.
- **İpuçları:** baştan yazıldı; ziyaretçi dokunmadan geçmez.
- **Açılar:** yedi eserde içeriden yakın açılar. Panelde kaydedilen açı hemen yazılır ve yer değiştirmez (`exact`).
- **Tanıtım:** `/tanitim` yeni sayfa.
- **İngilizce:** 11 eserin içeriği (`icerik/en/`); uzman incelemesi bekliyor.
- **Erişilebilirlik ve filtre:** kontrast, yazı boyutu, tür filtresi, telefon kartında kaynak düğmesi.
- **KVKK ve lisans:** taslak aydınlatma sayfası, hesap silme, fotoğrafta EXIF temizliği, lisans tablosu.
- **Temizlik:** eski GLB sürümleri ve biten notlar kaldırıldı, README'ler güncellendi.

## API ve canlı

- Bu daldan yeni migration yok; `exact` jsonb içinde.
- API sözleşmesinde kırıcı değişiklik yok: `distance` alt sınırı 0,05, `exact` isteğe bağlı.
- Canlı API `mapBaked`, `hideClosedInterior`, `imagined` alanlarını henüz taşımıyor; bunlar olmadan hız kazancı ve iç mekân gizleme canlıda görünmez.
- Temsilî görseller `imagined` taşınmadan aktarılmamalı.
- **Yeni açılar aktarımla kendiliğinden gelmez** (§11.70). Hikâye açıları `--replace-story-views` ister, bu seçenek panel kayıtlarını da siler. Fotoğraf açıları için seçenek yok.
- Birleştirince `import-demo`, sonra Storage önbellek başlığı.

## Bilinen sınırlar

- Ölçü sınırlarının tamamını iki temada yalnız Orhan Bey Hamamı geçti; öbürleri bilerek açıldı.
- Ziyaret akışı bağlı değil, «Bildir» kayıt tutmuyor.
- Aydınlatma metni taslak; hukuki onay ve boş alanlar bekliyor.
- `services/api/e2e/demo-path.spec.ts` içindeki ziyaret testi atlanıyor.

## Test

- [x] Tip kontrolü ve 210 birim testi
- [x] Playwright masaüstü ve telefon: 151 geçti, 31 atlandı
- [x] Otomatik erişilebilirlik taraması (5 ekran)
- [ ] API testleri (`npm run check`, Docker gerekli)
- [ ] Panelde açı kaydı kabul denemesi
- [ ] Gerçek telefon ve VoiceOver
- [ ] Çevirilerin incelenmesi
