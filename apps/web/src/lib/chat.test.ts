import assert from "node:assert/strict";
import test from "node:test";
import { CHAT_HISTORY_MAX, CHAT_TURN_MAX, chatHistory } from "./chat";

test("history keeps the latest turns in order and cuts a long answer to what the API accepts", () => {
  const turns = Array.from({ length: 13 }, (_, i) => ({
    role: i % 2 ? ("assistant" as const) : ("user" as const),
    text: i === 12 ? "x".repeat(CHAT_TURN_MAX + 300) : `m${i}`,
  }));
  const sent = chatHistory(turns);
  assert.equal(sent.length, CHAT_HISTORY_MAX);
  assert.equal(sent[0]!.text, "m3");
  assert.equal(sent.at(-1)!.text.length, CHAT_TURN_MAX);
});

test("blank turns are left out (the API refuses an empty one)", () => {
  assert.deepEqual(chatHistory([{ role: "user", text: "  " }, { role: "assistant", text: " ok " }]), [
    { role: "assistant", text: "ok" },
  ]);
});
