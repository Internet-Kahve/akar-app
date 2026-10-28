# AKAR · Yapılacaklar

*29 Ekim 2026'da yazıldı. Ayrıntılı geçmiş: `yaptiklarim-2.md`. Bir iş bitince buradan silinir ya da «Bitti» altına taşınır.*

## Şu anki durum (bir bakışta)

- **Prototip** (`design/test-redmi9t-v2/`): harita + 7 eser 3D, «Eser hakkında» okuma düzeni (yalnız Ulucami), Geçmişi Gör (Ulucami), bulmaca/rozet (Ulucami), rota. Masaüstü tarayıcıda sınandı; **telefonda hiç denenmedi**.
- **Modeller:** pastel renkler + pişmiş AO, yer gölgesi web'de. Toplam ≈ 2,7 MB.
- **Harita önizlemesi:** `design/harita/akar-harita-onizleme-v3.html` (ışık/renk paneli, «Pişmiş» hazır ayarı).
- **Git:** `docs` dalında commit var, **push edilmedi**.

## 1. Hemen

| # | İş | Kim | Not |
|---|---|---|---|
| 1 | `git push origin docs` | Muhammed (terminal) | Bu bağlantıdan push yapılamıyor (sanal makinede SSH anahtarı yok). Sonra PR: https://github.com/Internet-Kahve/akar-app/pull/new/docs |
| 2 | ~~Blender eşitleme~~ bitti (29 Ekim, commit fe54390). Sıradaki: parça sadeleştirme | 3D ajanı → Claude | Prompt: `_promptlar/PROMPT_parca_sadelestirme_7_eser.md`. Bitince tıklama haritalarına bak; kartı olmayan eserde parçaya dokununca ne görüneceğine karar ver. |
| 3 | Redmi 9T denemesi | Muhammed | Aşağıdaki kontrol listesi. |
| 4 | Diğer 6 esere bulmaca, Geçmişi Gör ve 3D parça kartları | Talha | Ayrıntı aşağıda: «Talha'nın işleri». |

### Talha'nın işleri (7 eserin hepsi Ulucami seviyesine)

**Ulucami neredeyse hazır ve ana referans.** Diğer altı eserde (Bedesten, Koza Han, Orhan Bey Camii, Orhan Bey Hamamı, Emir Hanı, Orhan Gazi Türbesi) aynı üç iş yapılacak. Her işte biçim, ton ve uzunluk Ulucami'nin dosyasından alınır. Metin yalnız kaynaktan; kaynak sayfa kodu ve güven etiketi her kayıtta.

| İş | Ulucami'deki referans | Diğer eserlerde yazılacak dosya | Prompt (`design/test-redmi9t-v2/_promptlar/`) |
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

### Redmi 9T kontrol listesi

`bash docs/documents-context/design/test-redmi9t-v2/sunucu.sh` → telefonda yazılan adres (aynı Wi-Fi).

- [ ] Açılış süresi (ilk açılış ve ikinci açılış, saniye)
- [ ] Harita: kaydırma ve eğme akıcı mı; 7 model görünüyor mu; yer gölgesi; pin etiketleri birbirine binmeden çıkıyor mu
- [ ] Küre görünümü (uzaklaş) ve şehre geri dönüş
- [ ] Eser 3D: döndürme, «İçini göster», parça kartı, «Tıklanabilir parçalar» düğmesi
- [ ] Eser hakkında: kaydırma, sekmeler, «Tam metni oku», fotoğraf şeridi kaydırma, fotoğraf büyütme
- [ ] Geçmişi Gör kaydırıcısı (Ulucami)
- [ ] Bulmaca ve rozet; «Buradayım» (konum yerel ağda çalışmaz, https gerekir — beklenen)
- [ ] Ses (Dinle)
- [ ] Takılma/ısınma var mı; varsa hangi ekranda

## 2. Tasarım

- [ ] **Figma güncellemesi** (prototipte yapıldı, Figma'da eski):
  - 3D eser sahnesi zemini: Bursa tonuna çalan gri geçiş (#DDE4E5 → #A7B4B7)
  - Eser hakkında: geri düğmesi kapağın sol üst köşesinde; aşağıda sekme çubuğunda «‹ Ulucami»; sekme şeridinde solma + ‹ › okları; bölüm başlığı fotoğraftan önce; alıntı üstündeki altın süs yok; fotoğraflar kırpılmadan (kendi oranında); fotoğraf şeridinde «1 / 4» sayacı ve oklar; «büyüt» simgesi; kapakta akşam fotoğrafı (envanter s.19)
  - Galeri fotoğrafları tıklanır (ışık kutusu)
  - Harita: filtre «Ticari (akar)», boş filtreler gizli, listede «3D» etiketi yok
- [ ] **3D eser ekranı, masaüstünde sol panelin alt yarısı boş** (karar bekliyor): kısa künye (yaptıran, malzeme, envanter sayfası) ya da «İçini göster / parçalara dokun» ipucu.
- [ ] **Pin çakışması:** düzeltildi (etiket yer bulamazsa öbür yana geçer, önemli eser önce çizilir, yakında pin küçülür) ama **etiketler test ortamında çizilemedi** (yazı tipi indirilemiyor). Gerçek haritada ve Redmi'de bak.
- [ ] **Diğer eserlerin kapak fotoğrafı:** `eser.json → hakkinda_kapak` yalnız Ulucami'de (envanterdeki açılış fotoğrafı). Diğer 6 eser için envanterdeki açılış fotoğrafı bulunup yazılmalı.
- [ ] **Ulucami ana referans.** Tasarım, UX kararları ve veri biçimi için örnek Ulucami. Diğer eserlerde bir şey eksikse Ulucami'deki karşılığına bakılır. Bunlar: okuma düzeni, parça kartları, «İçini göster», görev, Geçmişi Gör, kapak.
- [ ] **Eser hakkında okuma düzeni yalnız Ulucami'de** (`icerik/eser-hakkinda-okuma.md`: özet, rakam, alıntı, zaman çizelgesi, 3D açıları). Diğer eserlerde tam metin düz görünüyor. En azından Koza Han ve Bedesten için yapılmalı (demo).
- [ ] **Renk ince ayarı:** pastel renkler biraz açık bulunursa önizleme v3 sağ panelinde «Renk parlaklığı / Doygunluk» → «Ayarları kopyala» → `veri/sehir/bursa.json → harita_isik`.

## 3. Ekip notları (frontend / backend)

«En son hazırlarız» denmişti; ürün (`apps/web`) prototipteki düzeltmeleri kullanmıyor. Yazılacak not (`docs/` altında) şunları kapsamalı:

- [ ] Veri dosyaları ve alanları: `eserler/<eser>/eser.json` (hakkinda_kapak dahil), `3d/model.json`, `veri/sehir/*.json` (`kimlik`: renk, desen, 3D sahne zemini; `harita_isik`), `veri/rota/*.json`, `icerik/gorevler.json` (görev/rozet şeması), `gecmisi-gor/*.json`
- [ ] GLB kuralları: AO `occlusionTexture.texCoord = 1`, köşe rengi yok, «Yer_Golgesi» yok, boyut sınırı, parça adları = hikâye vurgu adları
- [ ] Haritadaki model katmanı: ışık `harita_isik`'ten, web yer gölgesi (kodla üretilen doku), taban izi ve OSM bina kaldırma kuralı (modele değen bina bütünüyle gider, 3 m pay), küre
- [ ] Zemin titremesi (z-fighting) düzeltmesi ve model kuralı (zemin katmanları arası ≥ 3 cm)
- [ ] Stil: `design/harita/akar-style-ozel-v2.json`

## 4. Jüri ve sunum (ekip işi; Claude yardım edebilir)

Değerlendirme: tasarım ve teknik güçlü; **zayıf yanlar bütünlük/demo ve etki hikâyesi.**

- [ ] **«Bu Vakıf Katılım için neden önemli?»** Etki hikâyesi: akar kavramı (vakfı yaşatan gelir yapıları; han, bedesten, hamam), vakıf mirasının görünürlüğü, ziyaretçiyi esere getirme, ölçülebilir hedefler (ziyaret, okuma, rota tamamlama).
- [ ] **Sürdürülebilirlik:** içerik envanterden veri hattıyla geliyor; yeni şehir = yeni klasör (Konya, Hatay, Kütahya «Yakında»); maliyet ve bakım.
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
