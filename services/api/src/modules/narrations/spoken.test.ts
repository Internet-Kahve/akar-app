import assert from "node:assert/strict";
import { test } from "node:test";
import { cardinal, narrationHash, ordinal, plainSpokenText, spokenText, turkishSpokenText } from "./spoken.ts";

test("cardinals: year-style numbers, round numbers, scales", () => {
  const cases: [number, string][] = [
    [0, "sıfır"],
    [7, "yedi"],
    [10, "on"],
    [100, "yüz"],
    [200, "iki yüz"],
    [1000, "bin"],
    [1001, "bin bir"],
    [2000, "iki bin"],
    [1399, "bin üç yüz doksan dokuz"],
    [1400, "bin dört yüz"],
    [1923, "bin dokuz yüz yirmi üç"],
    [10_000, "on bin"],
    [100_000, "yüz bin"],
    [1_000_000, "bir milyon"],
    [2_500_000, "iki milyon beş yüz bin"],
    [1_000_000_001, "bir milyar bir"],
  ];
  for (const [n, words] of cases) assert.equal(cardinal(n), words, String(n));
  assert.equal(cardinal(1e12), null);
});

test("ordinals turn the last word: 13 → on üçüncü", () => {
  assert.equal(ordinal(13), "on üçüncü");
  assert.equal(ordinal(1), "birinci");
  assert.equal(ordinal(4), "dördüncü");
  assert.equal(ordinal(20), "yirminci");
  assert.equal(ordinal(100), "yüzüncü");
  assert.equal(ordinal(1000), "bininci");
  assert.equal(ordinal(1399), "bin üç yüz doksan dokuzuncu");
});

test("apostrophe suffixes join the number words: 1399'da → bin üç yüz doksan dokuzda", () => {
  const cases: [string, string][] = [
    ["1399'da", "bin üç yüz doksan dokuzda"],
    ["Cami 1399'da açıldı.", "Cami bin üç yüz doksan dokuzda açıldı."],
    ["1400'lerde", "bin dört yüzlerde"],
    ["1400’lerde", "bin dört yüzlerde"],
    ["1990'lı yıllar", "bin dokuz yüz doksanlı yıllar"],
    ["1491'e kadar", "bin dört yüz doksan bire kadar"],
    ["1453'ten sonra", "bin dört yüz elli üçten sonra"],
    ["10'u", "onu"],
    ["2'si", "ikisi"],
    ["100'lük", "yüzlük"],
    ["3'üncü", "üçüncü"],
    ["14'üncü yüzyıl", "on dördüncü yüzyıl"],
    ["4'e", "dörde"],
    ["4'te", "dörtte"],
    ["4'ü", "dördü"],
    ["1304'ten beri", "bin üç yüz dörtten beri"],
    ["1304'ü", "bin üç yüz dördü"],
  ];
  for (const [input, expected] of cases) assert.equal(turkishSpokenText(input), expected, input);
});

test("an ordinal dot before a lower-case word reads as an ordinal: 13. yüzyıl → on üçüncü yüzyıl", () => {
  assert.equal(turkishSpokenText("13. yüzyıl"), "on üçüncü yüzyıl");
  assert.equal(turkishSpokenText("14. yüzyılın başında"), "on dördüncü yüzyılın başında");
  assert.equal(turkishSpokenText("1. kat ve 2. avlu"), "birinci kat ve ikinci avlu");
  assert.equal(turkishSpokenText("XV. yüzyıl"), "on beşinci yüzyıl");
  assert.equal(turkishSpokenText("XIV. asırda"), "on dördüncü asırda");
});

test("a dot before a capital letter or the end ends the sentence: the number stays a cardinal", () => {
  assert.equal(turkishSpokenText("Han 1491 yılında yapıldı."), "Han bin dört yüz doksan bir yılında yapıldı.");
  assert.equal(turkishSpokenText("Yapı 1399. Sonra yandı."), "Yapı bin üç yüz doksan dokuz. Sonra yandı.");
  assert.equal(turkishSpokenText("Yapı 1399."), "Yapı bin üç yüz doksan dokuz.");
});

test("thousands dots, decimals, percent and abbreviations", () => {
  assert.equal(turkishSpokenText("1.250 metre"), "bin iki yüz elli metre");
  assert.equal(turkishSpokenText("3,5 metre"), "üç virgül beş metre");
  assert.equal(turkishSpokenText("3,05 metre"), "üç virgül sıfır beş metre");
  assert.equal(turkishSpokenText("%50 ve 20%"), "yüzde elli ve yüzde yirmi");
  assert.equal(turkishSpokenText("M.Ö. 1200"), "milattan önce bin iki yüz");
  assert.equal(turkishSpokenText("3-4 yıl"), "üç-dört yıl");
});

test("digits glued to letters and numbers beyond the limit stay as they are", () => {
  assert.equal(turkishSpokenText("A4 kâğıdı ve 3B model"), "A4 kâğıdı ve 3B model");
  assert.equal(turkishSpokenText("1000000000000 kez"), "1000000000000 kez");
});

test("text without numbers only has its whitespace collapsed", () => {
  assert.equal(turkishSpokenText("  Ulucami,  Yıldırım\nBayezid  yaptırdı. "), "Ulucami, Yıldırım Bayezid yaptırdı.");
  assert.equal(plainSpokenText(" The  mosque\n was built "), "The mosque was built");
  assert.equal(spokenText("en", "Built in 1399."), "Built in 1399.");
  assert.equal(spokenText("tr", "1399'da"), "bin üç yüz doksan dokuzda");
});

test("the hash changes with the spoken text and with the voice model", () => {
  const a = narrationHash("flux-dilek-tr", "bin üç yüz");
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.equal(a, narrationHash("flux-dilek-tr", "bin üç yüz"));
  assert.notEqual(a, narrationHash("flux-dilek-tr", "bin dört yüz"));
  assert.notEqual(a, narrationHash("flux-mehmet-tr", "bin üç yüz"));
});
