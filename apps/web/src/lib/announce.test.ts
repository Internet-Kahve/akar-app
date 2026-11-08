import assert from "node:assert/strict";
import test from "node:test";
import {
  announce,
  REPEAT_WINDOW_MS,
  resetAnnouncements,
  shouldAnnounce,
  subscribeAnnouncements,
  type Announcement,
} from "./announce";

test("empty text is never spoken; new text always is", () => {
  assert.equal(shouldAnnounce(null, "  ", 0), false);
  assert.equal(shouldAnnounce(null, "Kaydedildi", 0), true);
  assert.equal(shouldAnnounce({ message: "Kaydedildi", at: 0 }, "Silindi", 10), true);
});

test("the same text inside the repeat window is one announcement, after it a new one", () => {
  const previous = { message: "Rotam'a eklendi", at: 1000 };
  assert.equal(shouldAnnounce(previous, "Rotam'a eklendi", 1000 + REPEAT_WINDOW_MS - 1), false);
  assert.equal(shouldAnnounce(previous, "Rotam'a eklendi", 1000 + REPEAT_WINDOW_MS), true);
});

test("announce reaches every listener once, with its politeness, until it unsubscribes", () => {
  resetAnnouncements();
  const heard: Announcement[] = [];
  const stop = subscribeAnnouncements((a) => heard.push(a));
  announce("Giriş yaptın.", "polite", 0);
  announce("Giriş yaptın.", "polite", 10);
  announce("Bağlantı koptu.", "assertive", 20);
  stop();
  announce("Duyulmaz", "polite", 5000);
  assert.deepEqual(
    heard.map(({ message, politeness }) => [message, politeness]),
    [
      ["Giriş yaptın.", "polite"],
      ["Bağlantı koptu.", "assertive"],
    ],
  );
  assert.ok(heard[1]!.id > heard[0]!.id);
});
