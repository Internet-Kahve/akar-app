import test from "node:test";
import assert from "node:assert/strict";
import type { HeritageSite } from "@akar/domain";
import { chapterPages,
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
