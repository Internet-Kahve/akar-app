import assert from "node:assert/strict";
import test from "node:test";
import { cityCase } from "./place-names";

test("cityCase follows the last vowel and the last consonant", () => {
  assert.equal(cityCase("Bursa"), "Bursa'da");
  assert.equal(cityCase("Bursa", true), "Bursa'dan");
  assert.equal(cityCase("Hatay"), "Hatay'da");
  assert.equal(cityCase("Kütahya", true), "Kütahya'dan");
  assert.equal(cityCase("Sivas"), "Sivas'ta");
  assert.equal(cityCase("İzmit"), "İzmit'te");
});
