/**
 * The text of the two legal pages the app shows in a dialog (it was `public/aydinlatma.html` and `lisanslar.html`:
 * a new tab, white in the night theme). Same words; the licence page now lists who gave which photographs.
 * `public/aydinlatma.html` stays as the plain privacy-policy address given to Google's sign-in screen: when
 * `KVKK_DOC` changes, write the same words there.
 * Only an institution's name, scope and credit line go in here: the e-mail addresses and the names of the people
 * who answered stay in `docs/documents-context/veri/fotoatlas/IZIN_DURUMU.md`.
 */
export type LegalBlock =
  | { kind: "p"; text: string; tone?: "draft" }
  | { kind: "h"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "table"; head: string[]; rows: string[][] };

export type LegalDoc = { title: string; blocks: LegalBlock[] };

export const KVKK_DOC: LegalDoc = {
  title: "Kişisel verilerin korunması aydınlatma metni",
  blocks: [
    { kind: "p", tone: "draft", text: "Taslak. Bu metin hukuki onaydan geçmemiştir. Köşeli parantezli alanlar yayımlanmadan önce doldurulacaktır." },
    { kind: "h", text: "Veri sorumlusu" },
    { kind: "p", text: "[Veri sorumlusunun adı], [adres]. İletişim: [e-posta]. AKAR, KÖK&KOD Hackathon'u kapsamında İnternet Kahve ekibi tarafından geliştirilmektedir." },
    { kind: "h", text: "Hangi verileri, neden işliyoruz?" },
    {
      kind: "table",
      head: ["Veri", "Amaç", "Hukuki sebep (taslak)"],
      rows: [
        ["E-posta adresi ve oturum bilgisi (giriş yaparsan)", "Hesabı açmak, kayıtlı rota ve ilerlemeni saklamak", "Hizmetin sunulması"],
        ["Google ile girersen Google'ın bize verdiği ad, e-posta adresi ve profil fotoğrafı adresi", "Hesabını açmak ve seni tanımak; Google hesabındaki başka hiçbir bilgiye erişmeyiz", "Hizmetin sunulması"],
        ["İz Bırak: anı metni ve eklediğin fotoğraf", "Moderasyon incelemesi; onaylanırsa herkese açık yayımlama", "Açık rıza"],
        ["Rıza kaydı: tarih ve gösterilen metnin sürümü", "Rızanın verildiğini gösterebilmek", "Hukuki yükümlülük ve meşru menfaat"],
        ["Kayıtlı eserler, rota, görev ve rozetler", "Kişisel ilerlemeni göstermek", "Hizmetin sunulması"],
        ["Görünen ad ve seçtiğin figür (giriş yaparsan)", "Profilinde, paylaşım kartında ve onaylı anılarında göstermek", "Hizmetin sunulması"],
        ["Haftanın Gezgini: görünen ad, figür ve haftalık puan", "Yalnız sen «Listede görün» seçeneğini açarsan herkese açık haftalık listede göstermek. Varsayılan kapalıdır, istediğin an kapatırsın; e-posta ve hesap kimliği listede yer almaz.", "Açık rıza"],
      ],
    },
    { kind: "h", text: "Cihazında kalanlar" },
    {
      kind: "list",
      items: [
        "Dil, tema, kontrast, yazı boyutu ve ipucu tercihleri yalnız tarayıcında saklanır, bize gönderilmez.",
        "Giriş yapmadan seçtiğin görünen ad ve figür yalnız tarayıcında kalır.",
        "Paylaşım kartı cihazında çizilir; kartta e-posta ya da başka kişisel veri yoktur, kartı nereye paylaşacağına sen karar verirsin.",
        "Fotoğrafın yüklenmeden önce cihazında yeniden çizilir; konum ve cihaz bilgisi (EXIF) gönderilmez.",
        "Kullanım istatistikleri yalnız günlük toplam sayaç olarak tutulur; kişiyle ilişkilendirilmez.",
        "Kamera ve konum izni yalnız ilgili özelliği kullandığında istenir. Konum, saha görevi sırasında doğrulama için kullanılır.",
      ],
    },
    { kind: "h", text: "Kimlere aktarılır?" },
    { kind: "p", text: "Veriler barındırma ve kimlik doğrulama hizmeti aldığımız sağlayıcılarda (Vercel, Supabase) saklanır. API ve veritabanı Frankfurt'tadır, yani veriler yurt dışına aktarılır. [Aktarımın hukuki dayanağı yazılacak.] Google ile girişi seçersen giriş Google üzerinden yapılır; Google'ın kendi gizlilik koşulları geçerlidir. Onaylanan anılar herkese açık görünür." },
    { kind: "h", text: "Ne kadar saklanır?" },
    { kind: "p", text: "[Saklama süresi yazılacak.] Hesabını sildiğinde hesabın, anıların, fotoğrafların, kayıtlı rotaların, puanların ve Haftanın Gezgini listesindeki yerin hemen silinir. Reddedilen ya da yayından kaldırılan anının fotoğrafı silinir." },
    { kind: "h", text: "Hakların" },
    { kind: "p", text: "KVKK madde 11 uyarınca verilerinin işlenip işlenmediğini öğrenebilir, düzeltilmesini ya da silinmesini isteyebilir, işlemeye itiraz edebilirsin. Açık rızanı her zaman geri alabilirsin; bu, önceki işlemleri etkilemez. Anını kendin silebilir, profilindeki «Hesabımı ve verilerimi sil» düğmesiyle hesabını silebilirsin. Diğer başvurular için: [e-posta]." },
    { kind: "h", text: "In English (summary)" },
    { kind: "p", text: "Draft, not yet legally reviewed. We process your email and session if you sign in, the memory and photo you submit (moderation and, if approved, publishing, with your explicit consent) and your saved progress. If you sign in with Google, we receive only your name, email address and profile picture address from Google and use them to create and recognise your account; we access nothing else in your Google account. Your display name, figure and weekly points appear on the public «Traveller of the Week» list only if you turn it on (off by default); never your e-mail. Preferences stay in your browser. Photos are redrawn on your device so location and device data are not sent. Data is hosted with Vercel and Supabase; the API and database are in Frankfurt. You can delete your memories, and your account from your profile." },
  ],
};

export const LICENSES_DOC: LegalDoc = {
  title: "Lisanslar ve kaynaklar",
  blocks: [
    { kind: "h", text: "Eser metinleri ve fotoğrafları" },
    {
      kind: "list",
      items: [
        "Vakıf Katılım: Vakıf Eserleri Envanteri kitaplarının metin ve görselleri ile envanter fotoğraf arşivi. Proje için verildi, uygulamada kullanılabilir. Kitap sayfalarına «E cilt-N PDF s.X» kodlarıyla atıf yapılır.",
        "3D modeller: ekip üretimi, «Temsili» olarak işaretlidir.",
        "Temsili görseller yapay olarak üretilmiştir ve «Temsili görsel» etiketiyle gösterilir.",
        "Rozet görselleri yapay olarak üretilmiştir: ekip, eserin içeriğine göre yazılımla çizdi; gerçek bir nesneyi ya da yazıyı göstermez.",
        "Seslendirme: yapay ses (Deepgram). İngilizce metinler: ekip çevirisi, yapay zekâ desteğiyle.",
      ],
    },
    { kind: "h", text: "Eski fotoğraflar (Geçmişi Gör)" },
    {
      kind: "p",
      text: "Eski fotoğraflar Foto Atlas kayıtlarından alındı; kayıtlar Foto Atlas'ın izniyle tek seferlik çekildi ve uygulama Foto Atlas'a canlı bağlanmaz. Yalnız açık lisanslı, kamu malı olan ya da sahibinden yazılı izin alınan fotoğraflar kullanılır. Her fotoğrafın yanında fotoğrafçı ve asıl arşiv yazar.",
    },
    {
      kind: "table",
      head: ["Kaynak", "İzin kapsamı", "Kredi satırı"],
      rows: [
        ["Foto Atlas", "Kayıtları kaynak göstererek kullanma, veriyi tek seferlik alma", "Fotoğrafçı · asıl arşiv · Foto Atlas aracılığıyla"],
        ["Mazhar Yüce Doruk Koleksiyonu", "Koleksiyondaki fotoğraflar (Foto Atlas sahibi aracılığıyla onaylandı)", "Mazhar Yüce Doruk Koleksiyonu · Foto Atlas aracılığıyla"],
        ["İstanbul Üniversitesi Nadir Eserler Kütüphanesi (Yıldız Albümleri)", "Yazılı izin, 22 Ekim 2026", "Nadir Eserler Kütüphanesi Yıldız Albümleri, NEKYA ve demirbaş numarası"],
        ["Médiathèque du patrimoine et de la photographie (Albert Gabriel)", "Yazılı izin, 22 Ekim 2026", "© Ministère de la Culture (France), Fonds Albert Gabriel INHA, Médiathèque du patrimoine et de la photographie"],
        ["Suna ve İnan Kıraç Vakfı İstanbul Araştırmaları Enstitüsü (Arif Hikmet Koyunoğlu)", "Yazılı izin, 23–24 Ekim 2026: seçilen 10 fotoğraf, ücretsiz, değiştirilmeden", "Envanter numarası · Suna ve İnan Kıraç Vakfı İstanbul Araştırmaları Enstitüsü Arif Hikmet Koyunoğlu Fotoğraf Koleksiyonu"],
        ["Deutsche Fotothek", "Yazılı izin, 28 Ekim 2026: yalnız 7–8 Kasım 2026 finalinde kullanım için", "© Deutsche Fotothek / fotoğrafçı adı"],
      ],
    },
    { kind: "p", text: "Bir fotoğrafın sahibi itiraz ederse fotoğraf kaldırılır." },
    { kind: "h", text: "Harita" },
    {
      kind: "list",
      items: [
        "Harita verisi: © OpenStreetMap katkıda bulunanlar (ODbL 1.0).",
        "Harita hizmeti: OpenFreeMap, OpenMapTiles şeması.",
        "Kabartma: Natural Earth (kamu malı).",
      ],
    },
    { kind: "h", text: "Yazılım" },
    {
      kind: "list",
      items: [
        "Next.js, React, Fastify, Zod, Drizzle ORM, Supabase JS, three.js: MIT / Apache-2.0",
        "MapLibre GL JS: BSD-3-Clause",
        "Lucide: ISC",
      ],
    },
    { kind: "h", text: "Yazı tipleri" },
    { kind: "list", items: ["Inter, Cormorant Garamond, Geist: SIL Open Font License 1.1"] },
  ],
};
