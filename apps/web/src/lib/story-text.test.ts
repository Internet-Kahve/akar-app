import assert from "node:assert/strict";
import test from "node:test";
import { cardSpeech } from "./story-text";

test("a part card is read in English only where its English body is written", () => {
  assert.deepEqual(cardSpeech({ body: "Kubbe", bodyEn: "Dome" }, "en"), { text: "Dome", lang: "en" });
  assert.deepEqual(cardSpeech({ body: "Kubbe", bodyEn: "  " }, "en"), { text: "Kubbe", lang: "tr" });
  assert.deepEqual(cardSpeech({ body: "Kubbe" }, "en"), { text: "Kubbe", lang: "tr" });
  assert.deepEqual(cardSpeech({ body: "Kubbe", bodyEn: "Dome" }, "tr"), { text: "Kubbe", lang: "tr" });
});
