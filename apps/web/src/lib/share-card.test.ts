import assert from "node:assert/strict";
import test from "node:test";
import { badgesThisWeek, istanbulWeekStart, shareFileName, weekRange, wrapLines } from "./share-card";

test("the week starts on Monday 00:00 in Istanbul, whatever the UTC day", () => {
  // Wednesday 5 Nov 2026, 12:00 Istanbul
  assert.equal(istanbulWeekStart(new Date("2026-11-05T09:00:00Z")).toISOString(), "2026-11-01T21:00:00.000Z");
  // Monday 00:30 in Istanbul is still Sunday 21:30 UTC: already the new week
  assert.equal(istanbulWeekStart(new Date("2026-11-08T21:30:00Z")).toISOString(), "2026-11-08T21:00:00.000Z");
  // Sunday 23:59 in Istanbul belongs to the week before
  assert.equal(istanbulWeekStart(new Date("2026-11-08T20:59:00Z")).toISOString(), "2026-11-01T21:00:00.000Z");
  // Monday 00:00 exactly is the start
  assert.equal(istanbulWeekStart(new Date("2026-11-01T21:00:00Z")).toISOString(), "2026-11-01T21:00:00.000Z");
});

test("badges of this week only, newest first", () => {
  const b = (badgeId: string, earnedAt: string) => ({ badgeId, siteId: "s", onSite: false, earnedAt });
  const now = new Date("2026-11-05T09:00:00Z");
  const week = badgesThisWeek({ tasks: [], badges: [b("old", "2026-11-01T20:59:59Z"), b("mon", "2026-11-01T21:00:00Z"), b("wed", "2026-11-05T08:00:00Z"), b("next", "2026-11-08T21:00:00Z")] }, now);
  assert.deepEqual(week.map((x) => x.badgeId), ["wed", "mon"]);
});

test("the week's range reads in the language", () => {
  assert.equal(weekRange(new Date("2026-11-05T09:00:00Z"), "tr"), "2–8 Kasım");
  assert.equal(weekRange(new Date("2026-11-05T09:00:00Z"), "en"), "2–8 November");
  assert.equal(weekRange(new Date("2026-10-29T09:00:00Z"), "tr"), "26 Ekim – 1 Kasım");
});

test("lines wrap by width and the last one ends in an ellipsis when cut", () => {
  const measure = (s: string) => s.length * 10;
  assert.deepEqual(wrapLines("Orhan Bey Camii'ni dinledin", 120, 3, measure), ["Orhan Bey", "Camii'ni", "dinledin"]);
  assert.deepEqual(wrapLines("Bir iki üç dört beş", 70, 2, measure), ["Bir iki", "üç dör…"]);
  assert.deepEqual(wrapLines("Kündekâri", 40, 2, measure), ["Kündekâri"]);
  assert.deepEqual(wrapLines("  ", 100, 2, measure), []);
});

test("file names carry what is shared, never a person", () => {
  assert.equal(shareFileName("rozet", "ulu-kundekari"), "akar-rozet-ulu-kundekari.png");
  assert.equal(shareFileName("hafta", "2026-11-02"), "akar-hafta-2026-11-02.png");
  assert.equal(shareFileName("basarim", "../x"), "akar-basarim-x.png");
});
