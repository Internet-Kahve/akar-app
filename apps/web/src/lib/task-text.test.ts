import test from "node:test";
import assert from "node:assert/strict";
import type { SiteTask } from "@akar/domain";
import { answerText, taskInLang } from "./task-text";

const quiz: SiteTask = {
  id: "t1",
  kind: "quiz",
  title: "Minberin sırrı",
  titleEn: "The secret of the minber",
  prompt: "Minber neden yapılmıştır?",
  promptEn: "What is the minber made of?",
  trust: "verified",
  quiz: {
    options: ["Ceviz", "Mermer"],
    optionsEn: ["Walnut", "Marble"],
    hints: ["Ağaç"],
    hintsEn: ["A tree"],
    wrongText: "Tekrar dene",
    fromHome: true,
  },
};

test("a quiz is English only when its options match the Turkish ones item for item", () => {
  const en = taskInLang(quiz, "en");
  assert.equal(en.english, true);
  assert.deepEqual(en.task.quiz!.options, ["Walnut", "Marble"]);
  assert.equal(en.task.quiz!.wrongText, "Tekrar dene");

  // An option's place is its answer: a shorter English list must not be shown.
  const short = taskInLang({ ...quiz, quiz: { ...quiz.quiz!, optionsEn: ["Walnut"] } }, "en");
  assert.equal(short.english, false);
  assert.equal(short.task.title, "Minberin sırrı");

  assert.equal(taskInLang(quiz, "tr").task.title, "Minberin sırrı");
});

test("a field task needs the English of each way it can be done", () => {
  const field: SiteTask = {
    ...quiz,
    kind: "field",
    quiz: undefined,
    field: { onSite: { text: "Kapıya git", textEn: "Go to the door", radiusM: 50 }, fromHome: { text: "Kapıya dokun", part: "Kapi" } },
  };
  assert.equal(taskInLang(field, "en").english, false);
  const both = taskInLang({ ...field, field: { ...field.field!, fromHome: { ...field.field!.fromHome!, textEn: "Tap the door" } } }, "en");
  assert.equal(both.task.field!.fromHome!.text, "Tap the door");
});

test("an answer text falls back to the Turkish one", () => {
  assert.deepEqual(answerText("en", "Doğru", "Right"), { text: "Right", english: true });
  assert.deepEqual(answerText("en", "Doğru", null), { text: "Doğru", english: false });
  assert.deepEqual(answerText("tr", "Doğru", "Right"), { text: "Doğru", english: false });
});
