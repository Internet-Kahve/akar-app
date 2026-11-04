import assert from "node:assert/strict";
import test from "node:test";
import { dailySeries, lastDays, sentenceFunnel } from "./usage-stats";

test("lastDays counts Istanbul days, both ends included", () => {
  // 22:30 UTC on 31 Dec is already 1 Jan in Istanbul (UTC+3).
  assert.deepEqual(lastDays(7, new Date("2026-12-31T22:30:00Z")), {
    from: "2026-12-26",
    to: "2027-01-01",
  });
  assert.deepEqual(lastDays(1, new Date("2026-03-01T12:00:00Z")), {
    from: "2026-03-01",
    to: "2026-03-01",
  });
});

test("dailySeries has one point per day, zero where nothing was counted, other events ignored", () => {
  const series = dailySeries(
    {
      from: "2026-02-27",
      to: "2026-03-02",
      daily: [
        { day: "2026-02-28", event: "app.open", guest: 2, signedIn: 1 },
        { day: "2026-02-28", event: "search", guest: 9, signedIn: 9 },
        { day: "2026-03-02", event: "app.open", guest: 0, signedIn: 4 },
      ],
    },
    "app.open",
  );
  assert.deepEqual(series, [
    { day: "2026-02-27", guest: 0, signedIn: 0 },
    { day: "2026-02-28", guest: 2, signedIn: 1 },
    { day: "2026-03-01", guest: 0, signedIn: 0 },
    { day: "2026-03-02", guest: 0, signedIn: 4 },
  ]);
});

test("sentenceFunnel orders by index, fills gaps and shares the first sentence's count", () => {
  const row = (ref: string, guest: number, signedIn = 0, event = "story.sentence") => ({
    event,
    ref,
    guest,
    signedIn,
  });
  assert.deepEqual(
    sentenceFunnel([row("2", 2), row("10", 99, 0, "part_card.open"), row("0", 3, 1)]),
    [
      { index: 0, count: 4, share: 1 },
      { index: 1, count: 0, share: 0 },
      { index: 2, count: 2, share: 0.5 },
    ],
  );
  assert.deepEqual(sentenceFunnel([row("1", 5)]), [
    { index: 0, count: 0, share: null },
    { index: 1, count: 5, share: null },
  ]);
});
