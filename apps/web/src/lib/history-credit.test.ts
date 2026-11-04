import assert from "node:assert/strict";
import test from "node:test";
import { presentCredit, shortLicense, splitCredit } from "./history-credit";

test("splitCredit takes the photographer out of «Fotoğraf: X · rest»", () => {
  assert.deepEqual(
    splitCredit("Fotoğraf: Alfred de Moustier · Getty Research Institute Digital Collections (96.R.14 (PP9_007)) · Foto Atlas aracılığıyla"),
    { by: "Alfred de Moustier", rest: "Getty Research Institute Digital Collections (96.R.14 (PP9_007)) · Foto Atlas aracılığıyla" },
  );
  assert.deepEqual(splitCredit("SALT Araştırma · Foto Atlas aracılığıyla"), { by: null, rest: "SALT Araştırma · Foto Atlas aracılığıyla" });
  assert.deepEqual(splitCredit("Fotoğraf: · SALT"), { by: null, rest: "SALT" });
  assert.deepEqual(splitCredit("Fotoğraf: Fotoğrafçı Bilinmiyor · SALT"), { by: null, rest: "SALT" });
});

test("shortLicense keeps a word or two", () => {
  assert.equal(shortLicense("CC0 1.0 Public Domain"), "CC0");
  assert.equal(shortLicense("CC BY-SA 4.0"), "CC BY-SA");
  assert.equal(shortLicense("Kamu malı (süresi doldu)"), "Kamu malı");
  assert.equal(shortLicense("SALT yazılı izni"), "Yazılı izin");
});

test("presentCredit drops the «Fotoğraf:» lead", () => {
  assert.equal(presentCredit("Fotoğraf: AKAR ekibi, 2026"), "AKAR ekibi, 2026");
  assert.equal(presentCredit("AKAR ekibi"), "AKAR ekibi");
});
