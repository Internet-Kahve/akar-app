import assert from "node:assert/strict";
import test from "node:test";
import type { Memory, SampleTrace } from "@akar/domain";
import { memoryTraces, relativeDay, traceInitial } from "./memory-traces";

const memory = (id: string, createdAt: string, status: Memory["status"] = "approved"): Memory => ({
  id,
  siteId: "s",
  text: id,
  status,
  createdAt,
  author: "Ada",
});
const sample: SampleTrace = {
  id: "ornek",
  author: "AKAR ekibi",
  text: "Örnek",
  addedOn: "2026-10-28",
  photo: { src: "a.webp", alt: "Foto", description: "Künye" } as SampleTrace["photo"],
  historyImageId: "h1",
};

test("the visitor's own traces come first, then the rest from newest to oldest", () => {
  const rows = memoryTraces({
    sample: [sample],
    own: [memory("eski-benim", "2026-01-01"), memory("yeni-benim", "2026-02-01", "pending")],
    approved: [memory("eski-benim", "2026-01-01"), memory("baska", "2026-10-30")],
  });
  assert.deepEqual(
    rows.map((r) => r.id),
    ["yeni-benim", "eski-benim", "baska", "ornek"],
  );
  assert.equal(rows[0]?.state, "pending");
  assert.equal(rows[3]?.state, "sample");
  assert.equal(rows[3]?.historyImageId, "h1");
});

test("a refused trace of the visitor is not listed", () => {
  const rows = memoryTraces({ sample: [], own: [memory("red", "2026-01-01", "rejected")], approved: [] });
  assert.equal(rows.length, 0);
});

test("relative days read as the prototype's", () => {
  const now = new Date("2026-10-31T12:00:00Z").getTime();
  assert.equal(relativeDay("2026-10-28T12:00:00Z", "tr", now), "3 gün önce");
  assert.equal(relativeDay("2026-10-31T10:00:00Z", "tr", now), "bugün");
  assert.equal(relativeDay("2026-10-28T12:00:00Z", "en", now), "3 days ago");
  assert.equal(relativeDay("2024-01-15", "tr", now), "Ocak 2024");
  assert.equal(relativeDay("yok", "tr", now), "");
});

test("the avatar is the name's first letter in Turkish capitals", () => {
  assert.equal(traceInitial(" ilke"), "İ");
  assert.equal(traceInitial("  "), "–");
});
