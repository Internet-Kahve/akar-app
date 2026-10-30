import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { validateCityIdentity, type CityIdentity } from "@akar/domain";
import { identityStyle } from "./city-identity";
import { EMBLEM_PATH, EMBLEM_VIEW_BOX } from "./emblem";

const repo = new URL("../../../../", import.meta.url);
const design = new URL("docs/documents-context/design/desenler/", repo);
const served = new URL("apps/web/public/desenler/", repo);
const cityFiles = new URL("docs/documents-context/veri/sehir/", repo);

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

test("the pattern tiles served by the web app are the design files, byte for byte", () => {
  const files = readdirSync(design).filter((f) => f.endsWith(".svg"));
  assert.ok(files.length >= 3, files.join());
  for (const file of files)
    assert.ok(
      readFileSync(new URL(file, served)).equals(readFileSync(new URL(file, design))),
      `${file} differs from design/desenler`,
    );
});

test("every city record names a pattern file the web app serves, and its identity is whole and drawable", () => {
  let named = 0;
  for (const file of readdirSync(cityFiles).filter((f) => f.endsWith(".json"))) {
    const kimlik = JSON.parse(readFileSync(new URL(file, cityFiles), "utf8")).kimlik ?? {};
    const { zemin, desen, desen_renk: desenRenk } = kimlik;
    if (!zemin && !desen && !desenRenk) continue;
    assert.ok(zemin && desen && desenRenk, `${file}: kimlik needs zemin, desen and desen_renk together`);
    validateCityIdentity({ accent: zemin, pattern: desen, patternColour: desenRenk });
    assert.ok(readFileSync(new URL(desen, served)).length > 0, `${file}: ${desen} is not served`);
    named++;
  }
  assert.ok(named >= 2, "Bursa and Konya have an identity");
});

test("the inline emblem is the one of design/desenler/amblem-akar-yildiz.svg", () => {
  const svg = readFileSync(new URL("amblem-akar-yildiz.svg", served), "utf8");
  assert.equal(/ d="([^"]+)"/.exec(svg)?.[1], EMBLEM_PATH);
  const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1]?.split(/\s+/).map(Number);
  assert.deepEqual(viewBox, EMBLEM_VIEW_BOX.split(" ").map(Number));
});
