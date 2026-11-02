import assert from "node:assert/strict";
import test from "node:test";
import { accusative, cityCase, genitive } from "./place-names";

test("cityCase follows the last vowel and the last consonant", () => {
  assert.equal(cityCase("Bursa"), "Bursa'da");
  assert.equal(cityCase("Bursa", true), "Bursa'dan");
  assert.equal(cityCase("Hatay"), "Hatay'da");
  assert.equal(cityCase("Kütahya", true), "Kütahya'dan");
  assert.equal(cityCase("Sivas"), "Sivas'ta");
  assert.equal(cityCase("İzmit"), "İzmit'te");
});

test("genitive follows the last vowel and adds n after a vowel", () => {
  assert.equal(genitive("Ulucami"), "Ulucami'nin");
  assert.equal(genitive("Koza Hanı"), "Koza Hanı'nın");
  assert.equal(genitive("Bedesten"), "Bedesten'in");
  assert.equal(genitive("Orhan Gazi Türbesi"), "Orhan Gazi Türbesi'nin");
  assert.equal(genitive("Emir Hanı"), "Emir Hanı'nın");
  assert.equal(genitive("Orhan Bey Camii"), "Orhan Bey Camii'nin");
});

test("accusative buffers a vowel ending with y, or with n after a compound", () => {
  assert.equal(accusative("Ulucami"), "Ulucami'yi");
  assert.equal(accusative("Koza Hanı"), "Koza Hanı'nı");
  assert.equal(accusative("Bedesten"), "Bedesten'i");
  assert.equal(accusative("Orhan Gazi Türbesi"), "Orhan Gazi Türbesi'ni");
});
