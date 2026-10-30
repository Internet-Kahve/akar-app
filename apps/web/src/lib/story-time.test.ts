import assert from "node:assert/strict";
import test from "node:test";
import { clock, sentenceSeconds, storySeconds } from "./story-time";

test("clock writes minutes and seconds", () => {
  assert.equal(clock(0), "0:00");
  assert.equal(clock(65.4), "1:05");
});

test("a sentence takes at least two seconds", () => {
  assert.equal(sentenceSeconds("Kısa"), 2);
  assert.equal(sentenceSeconds("x".repeat(140)), 10);
  assert.equal(storySeconds([{ text: "x".repeat(140) }, { text: "a" }]), 12);
});
