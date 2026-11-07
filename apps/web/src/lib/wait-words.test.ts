import assert from "node:assert/strict";
import test from "node:test";
import { nextWaitIndex, waitWords, type WaitGroup } from "./wait-words";

test("each wait has its own words in both languages, short and ending in an ellipsis", () => {
  for (const group of ["map", "model", "story", "save"] as WaitGroup[]) {
    const tr = waitWords(group, "tr");
    const en = waitWords(group, "en");
    assert.ok(tr.length >= 6, group);
    assert.equal(tr.length, en.length, group);
    for (const w of [...tr, ...en]) {
      assert.ok(w.text.endsWith("…"), w.text);
      assert.ok(w.text.length <= 40, w.text);
    }
  }
});

test("building words belong to the 3D model only: a site with photographs alone never shows them", () => {
  const notModel = (["map", "story", "save"] as WaitGroup[]).flatMap((g) => waitWords(g, "tr").map((w) => w.text));
  for (const word of ["Kubbe", "iskele", "Harç", "Taşlar", "Âlem"]) assert.ok(!notModel.some((t) => t.includes(word)), word);
});

test("the next word is never the one showing", () => {
  for (let i = 0; i < 50; i++) {
    const current = i % 7;
    const next = nextWaitIndex(7, current);
    assert.notEqual(next, current);
    assert.ok(next >= 0 && next < 7);
  }
  assert.equal(nextWaitIndex(1, 0), 0);
  assert.equal(nextWaitIndex(5, 4, () => 0), 0);
});
