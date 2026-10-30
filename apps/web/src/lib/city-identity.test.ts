import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { CityIdentity } from "@akar/domain";
import { identityStyle } from "./city-identity";
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
