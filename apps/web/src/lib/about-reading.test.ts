import test from "node:test";
import assert from "node:assert/strict";
import type { HeritageSite } from "@akar/domain";
import { aboutInLang,
  chapterPages,
  chapterBlocks,
  dominantTrust,
  photoRatio,
  readingMinutes,
  splitTerms,
  wordCount,
} from "./about-reading";

type Section = NonNullable<HeritageSite["sections"]>[number];
const section = (id: string, body: string, extra: Partial<Section> = {}): Section => ({
  id,
  kind: "history",
  title: "Tarihçe",
  body,
  trust: "verified",
  sourceId: "src",
  ...extra,
});
const photo = (id: string) => ({
  photo: {
    id,
    src: `/${id}.jpg`,
    alt: "",
    title: "",
    titleEn: "",
    description: "",
    sourceId: "",
    license: "",
    trust: "verified" as const,
  },
  alt: id,
  aspect: 1.5,
});

test("a chapter's pages read as one range", () => {
  assert.equal(chapterPages(["Envanter Cilt 1 · s. 20, 34", "Envanter Cilt 1 · s. 26"]), "s. 20–34");
  assert.equal(chapterPages(["Envanter Cilt 1 · s. 7"]), "s. 7");
  assert.equal(chapterPages(["Ürgen s.10"]), "s. 10");
  assert.equal(chapterPages(["Web kaynağı"]), "");
});

test("terms split longest first and keep the text between them", () => {
  const terms = [
    { word: "mihrap", definition: "a" },
    { word: "mihrap duvarı", definition: "b" },
  ];
  const parts = splitTerms("Cami mihrap duvarı ve mihrap", terms);
  assert.deepEqual(
    parts.map((p) => [p.text, p.term?.definition]),
    [
      ["Cami ", undefined],
      ["mihrap duvarı", "b"],
      [" ve ", undefined],
      ["mihrap", "a"],
    ],
  );
  assert.deepEqual(splitTerms("düz metin", []), [{ text: "düz metin" }]);
});

test("a paragraph opening with a quote becomes an inscription card that takes its Mealen lines and photos", () => {
  const blocks = chapterBlocks(
    [
      section("a", "Önce bir cümle. İkinci cümle."),
      section("b", "“Besmele” Mealen: Rahman ve Rahim olan Allah adıyla"),
      section("c", "Mealen: ikinci anlam", { photos: [photo("p1")] }),
      section("d", "Sonra düz paragraf."),
    ],
    ["İkinci cümle."],
  );
  assert.equal(blocks.length, 3);
  const [first, card, last] = blocks;
  assert.equal(first!.kind, "text");
  assert.ok(first!.kind === "text" && first!.inSummary);
  assert.ok(
    card!.kind === "inscription" &&
      card!.original === "“Besmele”" &&
      card!.meaning.length === 2 &&
      card!.photos.length === 1,
  );
  assert.ok(last!.kind === "text" && !last!.inSummary);
});

test("a Mealen line after a card whose photos are placed starts its own paragraph", () => {
  const blocks = chapterBlocks(
    [
      section("a", "“Ayet”", { photos: [photo("p")] }),
      section("b", "Mealen: sonraki"),
    ],
    [],
  );
  assert.equal(blocks.length, 2);
});

test("the English page shows only when every paragraph has its English, and its inscriptions take the Meaning lines", () => {
  const chapter = {
    id: "c1",
    title: "Tarihçe",
    titleEn: "History",
    kind: "history" as const,
    summary: ["Önce bir cümle."],
    readingEn: { summary: ["First a sentence."], figures: [], quotes: [], timeline: [], terms: [] },
    figures: [],
    quotes: [],
    timeline: [],
    terms: [],
    interior: false,
    focusParts: [],
  };
  const site = {
    chapters: [chapter],
    sections: [
      section("a", "Önce bir cümle.", { chapterId: "c1", bodyEn: "First a sentence." }),
      section("b", "“Ayet”", { chapterId: "c1", bodyEn: "“Ayet”", titleEn: "History" }),
      section("c", "Mealen: anlam", { chapterId: "c1", bodyEn: "Meaning: the sense" }),
    ],
  } as unknown as HeritageSite;

  assert.equal(aboutInLang(site, "tr").english, false);
  const en = aboutInLang(site, "en");
  assert.equal(en.english, true);
  assert.equal(en.site.chapters![0]!.title, "History");
  assert.deepEqual(en.site.chapters![0]!.summary, ["First a sentence."]);
  const blocks = chapterBlocks(en.site.sections!, en.site.chapters![0]!.summary);
  assert.ok(blocks[0]!.kind === "text" && blocks[0]!.inSummary);
  assert.ok(blocks[1]!.kind === "inscription" && blocks[1]!.meaning[0] === "the sense");

  const half = { ...site, sections: [...site.sections!, section("d", "Çevrilmemiş.", { chapterId: "c1" })] };
  const tr = aboutInLang(half, "en");
  assert.equal(tr.english, false);
  assert.equal(tr.site.chapters![0]!.title, "Tarihçe");
});

test("dominant trust, reading time and photo box ratio", () => {
  const sections = [
    section("a", "bir iki", { trust: "inferred" }),
    section("b", "üç", { trust: "verified" }),
    section("c", "dört", { trust: "inferred" }),
  ];
  assert.equal(dominantTrust(sections), "inferred");
  assert.equal(wordCount(sections), 4);
  assert.equal(readingMinutes(0), 1);
  assert.equal(readingMinutes(1000), 5);
  assert.equal(photoRatio(2, undefined), 2);
  assert.equal(photoRatio(2, 1.2), 1.2);
  assert.equal(photoRatio(undefined, undefined), 1.5);
});
