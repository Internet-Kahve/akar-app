# AKAR · Yapılacaklar

*29 Ekim 2026'da yazıldı. Ayrıntılı geçmiş: `yaptiklarim-2.md`. Bir iş bitince buradan silinir ya da «Bitti» altına taşınır.*

## Entegrasyon (30 Ekim 2026)

Prototip `apps/web`'e taşındı ve `docs` içinden kaldırıldı. Üründe olan: buzlu tema, il kimliği, üst çubuk, Eserler | Rotalar paneli, rol çipleri, konum kipi, kısa kart, pusula, mobil alt sayfa, karşılama, kaynak detayı, Vakıf nedir?, anlatım listesi ve oynatıcı, «Yalnız rotada», altın gelir yolu, tebrik kartı, Geçmişi Gör çekim haritası ve kamera, 3D açılamazsa kartı, tanıtım sayfası (`/tanitim`).

Kalan farklar:
- `cam` (gece) teması bağlanmadı; harita stili `design/harita/akar-style-cam.json`.
- Rota çizgisi hâlâ pinlerde numara; sekiz köşeli yıldız işaretleri yok.
- Harita pinleri rol rengi + tür simgesi yerine Figma pin görselleri; `medrese` pini kodla çiziliyor.
- Adresler `#view=…&site=…`; prototipin `#/eser/<id>` biçimi yok.
- «Bir hata mı gördün? Bildir» yalnız teşekkür gösteriyor, bildirim kaydı yok (`POST /reports` gerekir).
- İngilizce içerik dosyaları içe aktarılmıyor; dil seçici var, çeviri olan alanlar değişmiyor.
- Puan defteri ürün tarafında duruyor (tasarım puansız); karar bekliyor.
- `route_only`, `flow`, `viewpoint` alanları ayrı PR'da; migration canlıya uygulanmadan birleştirilmez. Altın gelir yolu, «Yalnız rotada» ve çekim haritası veri gelince açılır.

## Şu anki durum (bir bakışta)

- **İçerik paketi** (prototip kaldırıldı, tasarım `apps/web`'de): 11 eser, 3 il (Bursa 9, Konya 1, Hatay 1), 4 rol (Dinî, Ticari, Su, Eğitim); 7 eser 3D modelli, 4 eser yalnız fotoğraf (30 Ekim gece); asıl tema buzlu (30 Ekim). Yedi eserin hepsinde parça kartı, bulmaca/rozet (30 Ekim'de onaylandı), «Eser hakkında» tam metin + okuma düzeni + kitap fotoğrafları. Geçmişi Gör: Ulucami 21, Koza Han 6, Orhan Bey Camii 5, Türbe 5; Bedesten, Emir Hanı, Hamam'da Foto Atlas kaydı yok. Masaüstünde ve Redmi 9T'de denendi (29 Ekim): sorun yok.
- **Modeller:** pastel renkler + pişmiş AO, yer gölgesi web'de. Toplam ≈ 2,7 MB.
- **Harita önizlemesi:** `design/harita/akar-harita-onizleme-v3.html` (ışık/renk paneli, «Pişmiş» hazır ayarı).
- **Git:** `docs` dalında commit var, **push edilmedi**.

## 1. Hemen

| # | İş | Kim | Not |
|---|---|---|---|
| 1 | `git push origin docs` | Muhammed (terminal) | Bu bağlantıdan push yapılamıyor (sanal makinede SSH anahtarı yok). Sonra PR: https://github.com/Internet-Kahve/akar-app/pull/new/docs |
| 2 | ~~Blender eşitleme~~ bitti (29 Ekim, commit fe54390). Sıradaki: parça sadeleştirme | 3D ajanı → Claude | Prompt: `promptlar/PROMPT_parca_sadelestirme_7_eser.md`. Bitince tıklama haritalarına bak; kartı olmayan eserde parçaya dokununca ne görüneceğine karar ver. |
| 3 | ~~Redmi 9T denemesi~~ yapıldı (29 Ekim, Muhammed): sorun yok. | — | — |
| 4 | ~~Diğer 6 esere bulmaca, Geçmişi Gör ve 3D parça kartları~~ yapıldı (30 Ekim gece, Claude; `yaptiklarim-2.md` §75). Görevler 30 Ekim'de onaylandı. Kalan: bugünkü eş / örnek iz (Koza Han, Orhan Bey Camii, Türbe) | Talha | Ayrıntı aşağıda. |

### Talha'nın işleri (7 eserin hepsi Ulucami seviyesine)

**Ulucami neredeyse hazır ve ana referans.** Diğer altı eserde (Bedesten, Koza Han, Orhan Bey Camii, Orhan Bey Hamamı, Emir Hanı, Orhan Gazi Türbesi) aynı üç iş yapılacak. Her işte biçim, ton ve uzunluk Ulucami'nin dosyasından alınır. Metin yalnız kaynaktan; kaynak sayfa kodu ve güven etiketi her kayıtta.

| İş | Ulucami'deki referans | Diğer eserlerde yazılacak dosya | Prompt (`promptlar/`) |
|---|---|---|---|
| Bulmaca, saha görevi, rozetler | `eserler/ulu-cami/icerik/gorevler.json` | `eserler/<eser>/icerik/gorevler.json` | `PROMPT_gorevler_diger_eserler.md` |
| Geçmişi Gör (eski fotoğraflar, bugünkü eş, örnek iz) | `eserler/ulu-cami/gecmisi-gor/` | `eserler/<eser>/gecmisi-gor/` | `PROMPT_gecmisi_gor_diger_eserler.md` |
| 3D parça kartları (parçaya dokununca açılan kart) | `eserler/ulu-cami/icerik/parcalar.md` | `eserler/<eser>/icerik/parcalar.md` (başlangıç: `parcalar_taslak.md`) | `PROMPT_parca_kartlari_diger_eserler.md` |

Notlar:
- **Parça adları 29 Ekim'de sadeleşti** (Koza Han'da `Mescit` tek parça vb.). Görev ve kartlarda adlar `model.json → glb` dosyasından okunur; eski adlar kullanılmaz. Prompt'lardaki küçük betik adları modelden listeler.
- **Kart dosyası etkisi:** `parcalar.md` olan eserde yalnız kartı olan parça tıklanır. Hikâyede vurgulanan parçaların kartı olsun.
- **Geçmişi Gör:** Bedesten, Emir Hanı ve Hamam için Foto Atlas'ta kayıt yok; yalnız rapor (izin durumu §4).
- **Sıra önerisi (demo için):** önce Koza Han ve Bedesten (jüri haritada en çok bunlara tıklar), sonra diğerleri.
- Her iş bitince raporu Claude'a getir. Sorular ve kartlar envanter metniyle karşılaştırılır, sonra commit.

## 2. Tasarım

- [x] **Su ve Eğitim kategorileri, Konya ve Hatay** (30 Ekim gece): İnebey Medresesi, Alaaddin Bey Çeşmesi, Karatay Medresesi, Habib-i Neccar Camii; yalnız fotoğrafla. Kalan: koordinatların uydu ile doğrulanması, görevlerin gözden geçirilmesi, istenirse 3D.

- [x] **Asıl tema buzlu** (30 Ekim, Talha): prototipte varsayılan; ürüne taşınacak (`ENTEGRASYON_29EKIM.md` §5.13). Deneme tonları (`sicak`, `il`, `bant`) ve kullanılmayan tema dosyaları temizlenebilir.

- [x] **Figma güncellemesi** (29 Ekim, `promptlar/PROMPT_figma_guncelle_29ekim.md`): dokuz madde işlendi, Claude ekran görüntülerinden kontrol etti. Kalan küçük düzeltmeler (mobil geri düğmesi, sekme solması, lejant) ikinci prompt'la verildi.
- [ ] **3D eser ekranı, masaüstünde sol panelin alt yarısı boş** (karar bekliyor): kısa künye (yaptıran, malzeme, envanter sayfası) ya da «İçini göster / parçalara dokun» ipucu.
- [ ] **Pin çakışması:** düzeltildi (etiket yer bulamazsa öbür yana geçer, önemli eser önce çizilir, yakında pin küçülür) ama **etiketler test ortamında çizilemedi** (yazı tipi indirilemiyor). Gerçek haritada ve Redmi'de bak.
- [x] **Diğer eserlerin kapak fotoğrafı:** 30 Ekim'de altı esere de yazıldı (envanterin açılış fotoğrafı; Türbe'de galeride olmadığı için dış fotoğraf).
- [ ] **Ulucami ana referans.** Tasarım, UX kararları ve veri biçimi için örnek Ulucami. Diğer eserlerde bir şey eksikse Ulucami'deki karşılığına bakılır. Bunlar: okuma düzeni, parça kartları, «İçini göster», görev, Geçmişi Gör, kapak.
- [x] **Eser hakkında okuma düzeni** yedi eserde (30 Ekim): envanter metninin tamamı + `eser-hakkinda-okuma.md` + kitap fotoğrafları.
- [ ] **Kitap fotoğraflarının alt metinleri** (altı eser, geçici: «s. N, k. fotoğraf») ve arşivdeki yüksek çözünürlüklü asıllarla eşleştirme (Ulucami'deki gibi).
- [ ] **Renk ince ayarı:** pastel renkler biraz açık bulunursa önizleme v3 sağ panelinde «Renk parlaklığı / Doygunluk» → «Ayarları kopyala» → `veri/sehir/bursa.json → harita_isik`.

## 2b. Figma'da olup prototipte olmayanlar (29 Ekim taraması)

Figma `akar-yeni` ekranları prototiple tek tek karşılaştırıldı. Düğüm numaraları Figma'daki ekranlardır.

**Demo için önerilen (prototipe eklenecek):** Hepsi yapıldı (29 Ekim akşamı; `yaptiklarim-2.md` §66, §67).
1. ✅ **Anlatım · Akar akışı** (karar: haritada altın yay; veri `hikaye.md` «## Akar akışı») (D 1:2893, B 80:3004): «Yıldırım Bayezid, Ulucami'ye gelir sağlamak için Bedesten'i yaptırdı» cümlesinde harita Bedesten → Ulucami kesik çizgisini gösterir. Vakıf hikâyesinin özü; jüri için en önemli eksik.
2. ✅ **İlk açılış karşılama kartı** (D 1:4042, WF 1:5616): şehir deseni şeridi, «Şehrin hikâyesine karış.», üç madde (Dinle ya da oku · Geçmişini gör · Vakfı anla), «Evden gez» / «Konumumu kullan», «Vakıf nedir? ›». Yükleme ekranından sonra yalnız ilk girişte.
3. ✅ **3D açılamadı / görsel kademe** (D 1:4853, 1:4911; B 1:7802, 1:7840): 3D açılmazsa gravür/fotoğrafa düşer, üstte «3D açılamadı, görsellerle gösteriliyor · Yeniden dene». Zayıf cihazda «Bu cihazda 3D ağır kaldı» (bu kısım yapılmadı).
4. ✅ **Kaynak detayı** (D 1:3193, WF 1:7027): «Kaynak: … ›» dokununca kitap, sayfa ve güven bilgisi.
5. ✅ **Evden gez kipi ve konum seçimi** (D 1:4428, 1:4685; WF 1:5742, 1:7694): «Yakınımda ▾» menüsünde «Evden gez»; liste «Bursa'daki eserler», mesafe yok.

**Üründe zaten olan (prototipe eklemeye gerek yok, ürün ekibi Figma'ya göre bitirir):**
- İz Bırak akışı (1:3328, 1:3364, 1:3409; WF 1:7236, 1:7254, 1:7267, 108:2856).
- Yaşayan hafıza (82:2735, 86:2733; WF 108:2765, 108:2807).
- Giriş, e-posta kodu, KVKK, avatar menüsü, girişli profil (1:3055, 1:3816, 80:2930, 1:2065; WF 1:6960, 1:7672, 1:7544, 1:7372).
- Rota akışı: Rotam, Rota aktif, Vardın, Rota tamamlandı, Tüm rotalar, Bana rota oluştur, Rota önerisi (1:2447, 1:2494, 80:2764, 80:2826, 1:3938, 80:2557, 80:2668; WF karşılıkları).
- Arama ekranı ve sonuç yok (1:2141, 1:4522; WF 1:5925).
- Tüm eserler + filtre (1:2296; WF 1:6065, 1:6119).
- Bağlantı yok ve durum ekranları (1:4577, 1:7615).

**Bilinçli fark (değiştirme):**
- Şehir seçici (WF 1:5839): prototipte küre görünümü.
- Anlatım altyazı düzeni (1:2730): alternatif; panel düzeni seçildi.
- Birlikte Gez (1:3500; WF 1:7330, 1:7355): üründe de deneysel; kapsam kararı bekliyor.

**Tersi (prototipte olup Figma'da olmayan, Figma'ya işlenecek):** hikâye bitince tebrik kartı (Hikâye sonrası 1:2991 / 1:6925 yerine), TR \| EN dil seçici.

**Çakışma (çözüldü, 29 Ekim):** Figma'da «Giriş isteği (hikâye bitince)» var; prototipte hikâye bitince tebrik kartı çıkıyor. Karar: misafirse tebrik kartının altında «Rozetlerini kaybetme · Giriş yap» satırı; iki ayrı pencere üst üste açılmaz. Figma'ya da işlenmeli.

## 3. Ekip notları (frontend / backend)

«En son hazırlarız» denmişti; ürün (`apps/web`) prototipteki düzeltmeleri kullanmıyor. Yazılacak not (`docs/` altında) şunları kapsamalı:

- [ ] Veri dosyaları ve alanları: `eserler/<eser>/eser.json` (hakkinda_kapak dahil), `3d/model.json`, `veri/sehir/*.json` (`kimlik`: renk, desen, 3D sahne zemini; `harita_isik`), `veri/rota/*.json`, `icerik/gorevler.json` (görev/rozet şeması), `gecmisi-gor/*.json`
- [ ] GLB kuralları: AO `occlusionTexture.texCoord = 1`, köşe rengi yok, «Yer_Golgesi» yok, boyut sınırı, parça adları = hikâye vurgu adları
- [ ] Haritadaki model katmanı: ışık `harita_isik`'ten, web yer gölgesi (kodla üretilen doku), taban izi ve OSM bina kaldırma kuralı (ürünle aynı: merkezi taban izi + 3 m içinde ve alanı taban izinin 1,6 katından küçük bina gizlenir; ENTEGRASYON §4), küre
- [ ] Zemin titremesi (z-fighting) düzeltmesi ve model kuralı (zemin katmanları arası ≥ 3 cm)
- [ ] Stil: `design/harita/akar-style-ozel-v2.json`

## 4. Jüri ve sunum (ekip işi; Claude yardım edebilir)

Değerlendirme: tasarım ve teknik güçlü; **zayıf yanlar bütünlük/demo ve etki hikâyesi.**

- [ ] **«Bu Vakıf Katılım için neden önemli?»** Etki hikâyesi: akar kavramı (vakfı yaşatan gelir yapıları; han, bedesten, hamam), vakıf mirasının görünürlüğü, ziyaretçiyi esere getirme, ölçülebilir hedefler (ziyaret, okuma, rota tamamlama).
- [ ] **Sürdürülebilirlik:** içerik envanterden veri hattıyla geliyor; yeni şehir = yeni klasör (Konya ve Hatay'da ilk eser 30 Ekim'de kodsuz eklendi; Kütahya «Yakında»); maliyet ve bakım.
- [ ] **Demo senaryosu (≈ 3 dk):** harita → Ulucami 3D → İçini göster → Eser hakkında → Geçmişi Gör → bulmaca/rozet → rota. Jüri Ulucami dışına tıklarsa ne görecek? (bkz. 1.4 ve 2.)
- [ ] **Yedek demo videosu:** internet ya da cihaz sorununa karşı ekran kaydı.
- [ ] Fotoğraf izinleri/lisans: Foto Atlas ND kayıtlar kırpılmaz; SALT için yazılı izin; Bedesten/Emir/Hamam eski fotoğrafları (bkz. `yaptiklarim-2.md` §27).

## 5. Teknik borç

- [ ] Modellerde zemin katmanlarını ayır (≥ 3 cm) — `yaptiklarim-2.md` §22.
- [x] Kaynak artık Blender + `malzeme-paleti.json` (eşitleme bitti); `renk_ao_v3/` yeniden kullanılmaz.
- [ ] `design/test-redmi9t-v2/.onbellek/` içindeki geçici dosyalar (`_zemin_denemesi_*`, `_yedek_*`) silinebilir (git dışında).
- [ ] `test.html` (performans testi) MapLibre 4.7'de kaldı.
- [ ] v1 önizleme (`design/harita/akar-harita-onizleme.html`): döndürünce süzülmemiş OSM 3D katmanı açılıyor (v2/v3'te düzeltildi). v1 kullanılmıyorsa önemsiz.
- [ ] `design/ilk-prototip-kılıç-ali-pasa-düz-stil/` (157 MB) repoda değil; kimin olduğu ekiple konuşulacak.
