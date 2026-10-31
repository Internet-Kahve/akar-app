import assert from "node:assert/strict";
import test from "node:test";
import { detectLang, localize, translate } from "./i18n";

test("any Turkish browser language means Turkish, everything else English", () => {
  assert.equal(detectLang(["en-US", "tr-TR"]), "tr");
  assert.equal(detectLang(["TR"]), "tr");
  assert.equal(detectLang(["de-DE", "en"]), "en");
  assert.equal(detectLang([]), "en");
});

test("English content falls back to the Turkish original and says so", () => {
  assert.deepEqual(localize("en", "Ulu Cami", "Grand Mosque"), { text: "Grand Mosque", fallback: false });
  assert.deepEqual(localize("en", "Ulu Cami", "  "), { text: "Ulu Cami", fallback: true });
  assert.deepEqual(localize("en", "Ulu Cami", undefined), { text: "Ulu Cami", fallback: true });
  assert.deepEqual(localize("tr", "Ulu Cami", "Grand Mosque"), { text: "Ulu Cami", fallback: false });
  assert.deepEqual(localize("en", "", null), { text: "", fallback: false });
});

test("placeholders are filled and unknown ones are left visible", () => {
  assert.equal(translate("en", "header.search"), "Search sites, cities or routes");
  assert.equal(translate("tr", "toast.routeAdded", { name: "Bedesten" }), "Bedesten Rotam'a eklendi");
  assert.match(translate("en", "toast.routeAdded"), /\{name\}/);
});
