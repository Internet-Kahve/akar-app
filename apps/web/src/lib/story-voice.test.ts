import assert from "node:assert/strict";
import test from "node:test";
import type { StoryNarration } from "@akar/domain";
import { pickNarration, voiceFromAccount } from "./story-voice";

const clip = (variant: StoryNarration["variant"], lang: StoryNarration["lang"], voice: StoryNarration["voice"]): StoryNarration => ({
  variant,
  lang,
  voice,
  url: `https://cdn.test/${variant}-${lang}-${voice}.mp3`,
});
const block = {
  simple: "sade",
  simpleEn: "plain",
  narrations: [clip("text", "tr", "female"), clip("simple", "tr", "female"), clip("text", "en", "male"), clip("simple", "en", "male")],
};

test("the recording follows voice language, gender and the simple switch", () => {
  assert.equal(pickNarration(block, "tr", "female", false)?.variant, "text");
  assert.equal(pickNarration(block, "tr", "female", true)?.variant, "simple");
  assert.equal(pickNarration(block, "en", "male", true)?.lang, "en");
});

test("no recording for the chosen voice leaves the browser voice", () => {
  assert.equal(pickNarration(block, "tr", "male", false), undefined);
  assert.equal(pickNarration({ simple: "", simpleEn: "", narrations: [] }, "tr", "female", false), undefined);
  assert.equal(pickNarration({ simple: "", simpleEn: "" }, "en", "female", true), undefined);
});

test("the simple switch reads the plain recording where the simple wording is empty", () => {
  const plain = { simple: " ", simpleEn: "", narrations: [clip("text", "tr", "female"), clip("text", "en", "female")] };
  assert.equal(pickNarration(plain, "tr", "female", true)?.variant, "text");
  assert.equal(pickNarration(plain, "en", "female", true)?.variant, "text");
});

test("an account's voice wins; a key it has not chosen keeps the device's", () => {
  assert.deepEqual(voiceFromAccount({ voiceLang: "en", voiceGender: null }, { lang: "tr", gender: "male" }), { lang: "en", gender: "male" });
  assert.deepEqual(voiceFromAccount({ voiceLang: null, voiceGender: null }, { lang: null, gender: null }), { lang: null, gender: null });
});
