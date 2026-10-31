import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { CityIdentity } from "@akar/domain";
import { cityIdentityStyle, identityStyle } from "./city-identity";
import { EMBLEM_PATH, EMBLEM_VIEW_BOX } from "./emblem";

const repo = new URL("../../../../", import.meta.url);
const served = new URL("apps/web/public/desenler/", repo);

const bursa: CityIdentity = {
  accent: "#22566E",
  pattern: "desen-bursa-sekiz-yildiz.svg",
  patternColour: "#A4D8E0",
};

test("a city's identity becomes the colour and pattern properties of a loading screen; without one the screen stays neutral", () => {
  assert.deepEqual(identityStyle(bursa), {
    "--city-accent": "#22566E",
    "--city-pattern": 'url("/desenler/desen-bursa-sekiz-yildiz.svg")',
  });
  assert.deepEqual(identityStyle(null), {});
  // A record the renderer cannot draw is never put into a style.
  assert.deepEqual(identityStyle({ ...bursa, pattern: '");} x{' }), {});
  assert.deepEqual(identityStyle({ ...bursa, accent: "url(https://x.test)" }), {});
});

test("the inline emblem is the one of design/desenler/amblem-akar-yildiz.svg", () => {
  const svg = readFileSync(new URL("amblem-akar-yildiz.svg", served), "utf8");
  assert.equal(/ d="([^"]+)"/.exec(svg)?.[1], EMBLEM_PATH);
  const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1]?.split(/\s+/).map(Number);
  assert.deepEqual(viewBox, EMBLEM_VIEW_BOX.split(" ").map(Number));
});

test("the shell takes the city's colour and motif, and stays neutral without them", () => {
  assert.deepEqual(cityIdentityStyle(null), {});
  const style = cityIdentityStyle({
    accent: "#22566E",
    pattern: "desen-bursa-sekiz-yildiz.svg",
    patternColour: "#A4D8E0",
  }) as Record<string, string>;
  assert.equal(style["--sehir-aksan"], "#22566E");
  assert.equal(style["--sehir-acik"], "#A4D8E0");
  assert.equal(style["--sehir-desen"], 'url("/desenler/desen-bursa-sekiz-yildiz.svg")');
  assert.equal(style["--sehir-desen-olcek"], undefined);
});

test("a city's pattern scale reaches both the loading screens and the shell; an impossible one leaves the city neutral", () => {
  const hatay: CityIdentity = { accent: "#7A6340", pattern: "desen-hatay-yildiz-kafes.svg", patternColour: "#DBCDB5", patternScale: 4.3 };
  assert.equal((identityStyle(hatay) as Record<string, string>)["--city-pattern-scale"], "4.3");
  assert.equal((cityIdentityStyle(hatay) as Record<string, string>)["--sehir-desen-olcek"], "4.3");
  assert.deepEqual(cityIdentityStyle({ ...hatay, patternScale: 40 }), {});
});
