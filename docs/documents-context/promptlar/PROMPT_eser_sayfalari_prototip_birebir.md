# PROMPT — Eser sayfalarının tümü prototiple birebir (31 Ekim 2026)

Bu dosyayı Claude Code'a olduğu gibi ver. Önce bu dosyayı, sonra `AGENTS.md` ve `CONTRIBUTING.md`'yi okusun.

---

AKAR projesi (KÖK&KOD, İnternet Kahve). Repo kökü: `akar-app`.
Önce `AGENTS.md` ve `CONTRIBUTING.md`'yi oku, sonra `docs/documents-context/` altındaki `ENTEGRASYON_29EKIM.md` ve `YAPILACAKLAR.md`'ye göz at.

## KURALLAR
- Commit yazarı yerel git kimliği. Commit, dal ve mesajlarda araç/ajan markası ya da `Co-Authored-By` olmayacak.
- `git add -A` / `git add .` yok; dosyaları adıyla ekle.
- Dosya silme yok.
- PR açma. İş bitince commit edip kendi dalına push et; PR'ı ekip sonra açacak.
- `apps/web/public/tanitim/` altına dokunma (başkasının işi).
- **Esere, şehre ya da rotaya özel değer koda yazılmaz.** Her şey veri dosyalarından gelir (`docs/documents-context/eserler/<eser>/…`, `eser.json`, `3d/model.json`). Yeni eser kod değişmeden eklenebilmeli.
- Arayüz metinleri koda gömülmez: `apps/web/src/lib/messages/site.ts` ve `shell.ts` kataloğuna TR + EN olarak eklenir (`t("…")`). `tr ? "…" : "…"` yazma.
- Ortak tipi (`packages/domain`) değiştirirsen frontend/backend sözleşmesini de güncelle ve raporda yaz.

## DURUM
- Dal: `feat/harita-prototip` üzerinden açtığın kendi dalın. Harita ekranı ve **eser detay paneli** prototiple eşlendi (son commit). Bunları geri alma, üzerine çalış.
- Detay panelinin yeni bileşeni: `apps/web/src/components/site-detail.tsx`. Neyin nereye taşındığı ve Burak/Tamer notları: proje notu «AKAR_Detay_Ekrani_Notlari_31Ekim» (Muhammed'den iste) — özetle: Görevler → «Bulmaca» satırı + pencere; İz bırak → «Yaşayan hafıza» penceresi → «Bir anı bırak»; altta «Rotama ekle / Yanındayım» kaldırıldı, rotadaysa «Sonraki durak».

## ÇALIŞTIRMA
- Ürün (gerçek içerikle): repo kökünde `npm run dev:content` → http://127.0.0.1:3000
  - Düz `npm run dev` örnek veriyle (6 eser) açılır; prototiple karşılaştırma için KULLANMA.
- Prototip `docs` dalında: `docs/documents-context/design/test-redmi9t-v2/` (`index.html`, `app.js`, `app.css`, `temalar.css`).
  - Ayrı bir kopyada aç: `git worktree add ../akar-proto origin/docs`, sonra o kopyada `bash docs/documents-context/design/test-redmi9t-v2/sunucu.sh 8091`
  - Adres: http://localhost:8091/index.html?tema=buzlu#/ (ürüne **buzlu** tema taşınıyor).
- Playwright ile ölçüm:
  - Chromium bayrakları: `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`
  - Sayfa: `locale="tr-TR"` (yoksa ürün İngilizce açılır), `device_scale_factor=2`.
  - Açılış kartını atlamak için iki tarafta da: `add_init_script("localStorage.setItem('akar.karsilama','1')")`
  - İki boyutta karşılaştır: masaüstü 1512×772 ve telefon 390×844.

## AMAÇ: ESER SAYFALARININ TAMAMI PROTOTİPLE BİREBİR
Önce Ulucami, sonra diğer 6 Bursa eserinde aynı kontrol. Her ekranı **düğmesine kadar tek tek** karşılaştır; görünüş, metin, sıralama, durumlar (boş / yükleniyor / bitti / hata), etkileşim ve geçişler dahil.

1. **3D parça kartı** — modelde bir parçaya dokununca açılan büyük kart (prototip `app.js` → `parcaKartAc`, `parcaSecildi`, `pkSesBaslat`): üstte yana kayan fotoğraflar, altta kayan metin, ses düğmesi (çalarken durdur ikonu, anlatım konuşuyorsa onu susturur), kapatma, parça adı etiketi (`#parca-ad`), «Tıklanabilir parçaları göster» düğmesinin yanıp sönmesi, «İçini göster» düğmesinin konumu (masaüstü / telefon).
2. **Dinle / Oku ekranı** (hikâye anlatımı) — tüm detaylar: cümle cümle ilerleme, ilerleme çubukları, oynat/duraklat/ileri/geri, sade anlatım seçeneği, her cümlenin fotoğrafı ve «Kart» fotoğrafların 3D üstünde kart olarak gösterimi, «3D ile anlat» geçişi, kamera açıları (prototip `aci({ azimut, egim, uzaklik })`), hikâye bitince tamamlandı kartı ve «Sonraki durak», görseller ve künyeleri.
3. **Eser hakkında** — birebir: kapak, bölüm listesi, okuma süresi ve derinlik çubukları, «Kitaptan» özetleri, rakam kartları, alıntılar, kaynaklar, yanda 3D/fotoğraf, güven etiketi (TrustTag = prototipteki `.guven`: nokta + ⓘ, dokununca «Bu bilgi nereden geliyor?»). Envanter PDF metni baştan sona eksiksiz olmalı.
4. **Yaşayan hafıza** — birebir. Bu sayfa ürüne henüz taşınmadı (prototip `docs` dalı, commit `f87457d`; `app.js` → `hafizaIzleri`, `izGoreli`, `izKunye`, `#/hafiza/<eser>`). Şu an üründe yalnız bir pencere var (`akar-app.tsx` → `overlay === "memories"`). Prototipteki sayfayı kur: izlerin sırası (önce kullanıcınınki, sonra yeniden eskiye), «3 gün önce» gibi göreli tarih, baş harf avatarları, künye satırı («Ziyaretçi fotoğrafı · ad · tarih · İnceleniyor / Örnek katkı»), İz Bırak akışı. Detay panelindeki «Yaşayan hafıza» satırı bu sayfaya gitsin.
5. **Bulmaca (oyun)** — birebir: prototipteki bulmaca ekranı ve görevler (soru, ipucu, saha görevi «Evden yap / Buradayım», 3D'de parçaya dokunma, rozet kazanma, tamamlandı durumları, ilerleme halkası `bulmacaHalka`). Şu an üründe görevler bir pencerede liste olarak açılıyor (`site-detail.tsx` → `SiteTasks`); prototipteki akışa getir. Bir görev bitince kullanıcının listeye geri döndüğünden emin ol.

Bunlarla bağlantılı her şeyi de kontrol et: Geçmişi Gör'e geçiş, Fotoğraf | 3D seçici, galeri ve okları, «3D model · Temsili» etiketi, ipucu yazısı, tam ekran fotoğraf, klavye (Esc, Tab) ve erişilebilirlik adları.

## YÖNTEM (gözle değil, ölçerek)
1. Her bileşen için iki sayfada da `getComputedStyle` dök: background, backdrop-filter, box-shadow, border, radius, font, line-height, padding, kutu ölçüleri. Prototipin CSS'i `app.css` + `temalar.css` (buzlu tema kuralları `[data-tema]` altında). Ürününki `apps/web/src/app/design.css` + `globals.css` + `packages/design-tokens/tokens.css`.
2. Değerleri birebir taşı, sonra yeniden ölç. Kutu ölçüleri piksel piksel aynı olmalı.
3. Renkte aynı noktalardan piksel örnekle.
4. 3D'de aynı açıdan çek, bölge bölge ortalama parlaklık ölç (PIL `ImageStat`); iki görüntünün farkını (`ImageChops.difference`) eşikle ve farkın nerede toplandığına bak.
5. Her ekran için yan yana ekran görüntüsü kaydet. «Aynı» demeden önce ölç.
6. Taşma kontrolü: her ekranda `scrollWidth > clientWidth` olan kap kalmasın (yatay kaydırma çubuğu).

## BİLİNEN TUZAKLAR (yeniden araştırma)
- CSS değişkeni tanımlandığı yerde çözülür. Şehir rengi `.app-shell` üzerine yazılıyor; `--sehir-aksan`'dan türeyen yeni token'ı `:root`'ta bırakma, `tokens.css`'teki gibi `.app-shell`'e de yaz.
- Detay ekranında `.side-panel` dolgusu 0. Panelin `::after` süs bandı negatif kenar boşluğuyla taşar; yeni bir öğe ekleyince yatay taşmayı ölç.
- 3D'de zemin yüzeyleri birkaç mm arayla duruyor: `apps/web/src/lib/ground-layers.ts` (`liftGroundLayers`) bunları ayırıyor ve kamera `near/far` yarıçapa göre. Yeni bir 3D sahne kurarsan ikisini de kullan, yoksa avluda titreşen çizgiler çıkar.
- Ürün three.js 0.186, prototip 0.160. 0.186'da `PCFSoftShadowMap` yok (PCF'e düşer). Farkın sürümden mi geldiğini ayırmak için prototipi Playwright'ta `route` ile three@0.186.1'e yönlendirerek aç.
- Buzlu cam: iç içe `backdrop-filter`'da tarayıcı içtekini bulanıklaştırmaz. Prototipte buzlu panelin içindeki öğenin üründeki karşılığı bulanıklıksız olmalı. Test tarayıcısı GPU'suz; Muhammed'in ekran görüntüleriyle de doğrula.
- Ürünün genel `button:active { transform: translateY(1px) }` kuralı basınca kaydırır; prototipte kıpırdamayan yerlerde kapat.
- Ziyaret (`visit`) şu an hiçbir yerden kaydedilmiyor (Yanındayım kaldırıldı, otomatik kayıt Burak'ın işi). Buna bağlı rozet/ilerleme boş görünürse hata sayma, raporda yaz.
- Örnek veri bekleyen e2e testleri `dev:content` açıkken başarısız olur; bu uygulama hatası değildir.

## BİTİRİNCE
- `npm run typecheck` ve `npm test` (157 test geçiyordu; yeni mantık eklediysen birim testini de yaz).
- E2E: `dev:content` sunucusunu kapat, sonra `CI=1 npx playwright test` (örnek veriyle kendi sunucusunu açar). Değişen akışların testlerini yeni akışa göre güncelle; eski koddan beri kırık olan `admin-layout` ve «naming a city» testlerini ayrıca belirt.
- Rapor: değişen dosyalar, her ekran için «aynı / farklı kalan» listesi ve yan yana ekran görüntüleri.
- Kendi dalına commit et (yerel git kimliğiyle) ve `git push -u origin <dal>`. **PR açma.**
