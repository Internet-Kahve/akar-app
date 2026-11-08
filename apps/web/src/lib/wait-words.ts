/**
 * Waiting words (Muhammed, 6 Nov 2026): while something loads, a short line from the waqf's and the builder's world
 * turns under the loading picture, as an old workshop would say it. Each group belongs to one kind of wait, so a
 * site with only photographs never hears of domes and scaffolding: the `model` words come only while a 3D model loads.
 * A gloss explains an old word in a few plain ones.
 */
export type WaitGroup = "map" | "model" | "story" | "save";
export interface WaitWord {
  text: string;
  gloss?: string;
}

const TR: Record<WaitGroup, WaitWord[]> = {
  map: [
    { text: "Vakfiyeler okunuyor…", gloss: "vakfın kuruluş belgesi" },
    { text: "Mütevelli defteri açılıyor…", gloss: "vakfı yöneten kişi" },
    { text: "Kervan hana yanaşıyor…" },
    { text: "Bedestende kepenkler açılıyor…" },
    { text: "Şehrin haritası çiziliyor…" },
    { text: "Menzil hesaplanıyor…", gloss: "yolculukta konaklama yeri" },
    { text: "Arşiv defterleri karıştırılıyor…" },
    { text: "Akar hesaplanıyor…", gloss: "vakfa gelir getiren mülk" },
    { text: "Muvakkit vakti ölçüyor…", gloss: "namaz vakitlerini hesaplayan kişi" },
  ],
  model: [
    { text: "Taşlar diziliyor…" },
    { text: "Harç karılıyor…" },
    { text: "Kalfalar iskele kuruyor…", gloss: "usta yardımcısı" },
    { text: "Mimarbaşı hesap ediyor…" },
    { text: "Kemerler kuruluyor…" },
    { text: "Kubbe örülüyor…" },
    { text: "Kurşunlar dökülüyor…", gloss: "kubbe örtüsü" },
    { text: "Âlem takılıyor…", gloss: "kubbe ya da minare tepesindeki süs" },
    { text: "Revaklar sıralanıyor…", gloss: "sütunlu, üstü örtülü geçit" },
    { text: "Mahya ışıkları yakılıyor…", gloss: "minareler arası ışıklı yazı" },
  ],
  story: [
    { text: "Meddah söze başlıyor…", gloss: "hikâye anlatıcısı" },
    { text: "Kâtip temize çekiyor…" },
    { text: "Hattat mürekkebi hazırlıyor…" },
    { text: "Nakkaş deseni çiziyor…", gloss: "süsleme ustası" },
    { text: "Kündekâri geçmeleri tutturuluyor…", gloss: "çivisiz ahşap işçiliği" },
    { text: "Şadırvana su veriliyor…" },
    { text: "Çini fırından çıkıyor…" },
  ],
  save: [
    { text: "Mühür basılıyor…" },
    { text: "Defter-i kebire işleniyor…", gloss: "büyük kayıt defteri" },
    { text: "Tezkire yazılıyor…", gloss: "resmî kısa belge" },
    { text: "Ulak yola çıktı…", gloss: "haberci" },
    { text: "Kahve pişiyor, bir sabır…" },
    { text: "Hazinedar keseyi bağlıyor…" },
  ],
};

const EN: Record<WaitGroup, WaitWord[]> = {
  map: [
    { text: "Reading the waqf deeds…" },
    { text: "Opening the trustee's ledger…" },
    { text: "A caravan pulls into the han…" },
    { text: "Shutters go up in the bedesten…" },
    { text: "Drawing the city's map…" },
    { text: "Reckoning the next stage of the road…" },
    { text: "Leafing through the archive ledgers…" },
    { text: "Counting the waqf's income…" },
    { text: "The timekeeper reads the hour…" },
  ],
  model: [
    { text: "Laying the stones…" },
    { text: "Mixing the mortar…" },
    { text: "Raising the scaffolding…" },
    { text: "The chief architect is measuring…" },
    { text: "Setting the arches…" },
    { text: "Building the dome…" },
    { text: "Casting the lead for the dome…" },
    { text: "Fixing the finial…" },
    { text: "Lining up the arcades…" },
    { text: "Lighting the mahya…" },
  ],
  story: [
    { text: "The storyteller begins…" },
    { text: "The scribe makes a fair copy…" },
    { text: "The calligrapher prepares the ink…" },
    { text: "The painter draws the pattern…" },
    { text: "Fitting the kündekâri joints…" },
    { text: "Water runs into the fountain…" },
    { text: "Tiles come out of the kiln…" },
  ],
  save: [
    { text: "Pressing the seal…" },
    { text: "Writing it into the great register…" },
    { text: "Drafting the note…" },
    { text: "The courier is on the road…" },
    { text: "The coffee is brewing, a moment…" },
    { text: "The treasurer ties the purse…" },
  ],
};

export function waitWords(group: WaitGroup, lang: "tr" | "en"): WaitWord[] {
  return (lang === "en" ? EN : TR)[group];
}

/** The next word: any but the one showing, so the line always changes. */
export function nextWaitIndex(count: number, current: number, random = Math.random): number {
  if (count < 2) return 0;
  const step = 1 + Math.floor(random() * (count - 1));
  return (current + step) % count;
}
