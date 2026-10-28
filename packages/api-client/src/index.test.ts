import test from "node:test";
import assert from "node:assert/strict";
import {
  createMockClient,
  createSeed,
  demoStorageKey,
  type StorageAdapter,
} from "./index";
function storage(): StorageAdapter {
  const values = new Map<string, string>();
  return {
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => {
      values.set(k, v);
    },
    removeItem: (k) => {
      values.delete(k);
    },
  };
}
test("progress survives a new client and reset clears progress", async () => {
  const s = storage(),
    a = createMockClient(s);
  await a.dispatch({ type: "visit", siteId: "ulu-cami" });
  const b = createMockClient(s);
  assert.equal((await b.getSnapshot()).points, 100);
  await b.reset();
  assert.equal((await createMockClient(s).getSnapshot()).points, 0);
});
test("invalid saved state recovers without crashing", async () => {
  const s = storage();
  s.setItem("akar-demo-bursa-v1", "{broken");
  assert.equal((await createMockClient(s).getSnapshot()).sites.length, 6);
  s.setItem("akar-demo-bursa-v1", JSON.stringify({ version: 1, sites: [] }));
  assert.equal((await createMockClient(s).getSnapshot()).sites.length, 6);
});
test("storage failure is reported and does not pretend a mutation succeeded", async () => {
  const c = createMockClient({
    getItem: () => null,
    setItem: () => {
      throw new Error("quota");
    },
    removeItem: () => {},
  });
  await assert.rejects(
    c.dispatch({ type: "visit", siteId: "ulu-cami" }),
    /depolaması/,
  );
  assert.equal((await c.getSnapshot()).points, 0);
});

test("Bursa demo does not load or overwrite the previous Istanbul demo", async () => {
  const s = storage();
  const previous = JSON.stringify({
    ...createSeed(),
    points: 250,
    savedIds: ["kilic-ali-pasa"],
  });
  s.setItem("akar-demo-v1", previous);
  const client = createMockClient(s);
  const initial = await client.getSnapshot();
  assert.equal(initial.points, 0);
  assert.deepEqual(initial.savedIds, []);
  assert.ok(initial.sites.every((site) => site.city === "Bursa"));
  await client.dispatch({ type: "save", siteId: "ulu-cami" });
  assert.equal(s.getItem("akar-demo-v1"), previous);
  assert.ok(s.getItem(demoStorageKey));
  assert.deepEqual((await createMockClient(s).getSnapshot()).savedIds, [
    "ulu-cami",
  ]);
});

test("mock quizzes: wrong answer unlocks the hint, one award per quiz, reveal blocks points, state survives a reload", async () => {
  const s = storage();
  const a = createMockClient(s);
  const quizzes = await a.getQuizzes("ulu-cami");
  assert.deepEqual(
    quizzes.map((q) => q.id),
    ["ulu-cami:quiz-1", "ulu-cami:quiz-2", "ulu-cami:quiz-3"],
  );
  assert.ok(quizzes.every((q) => q.hint === null && !q.solved));
  assert.equal(JSON.stringify(quizzes).includes("correct"), false);
  const wrong = await a.answerQuiz("ulu-cami:quiz-1", 2);
  assert.deepEqual([wrong.correct, wrong.awarded], [false, 0]);
  assert.ok(wrong.hint);
  const right = await a.answerQuiz("ulu-cami:quiz-1", 0);
  assert.deepEqual([right.correct, right.awarded], [true, 20]);
  assert.ok(right.explanation);
  assert.deepEqual(right.snapshot.quizIds, ["ulu-cami"]);
  assert.equal((await a.answerQuiz("ulu-cami:quiz-1", 0)).awarded, 0);
  const revealed = await a.revealQuiz("ulu-cami:quiz-2");
  assert.equal(revealed.correctOption, "Topluma hizmet sunmaya");
  assert.equal((await a.answerQuiz("ulu-cami:quiz-2", 1)).awarded, 0);
  const b = createMockClient(s);
  const again = await b.getQuizzes("ulu-cami");
  assert.deepEqual(
    again.map((q) => [q.solved, q.revealed, q.hint !== null]),
    [
      [true, false, true],
      [true, true, false],
      [false, false, false],
    ],
  );
  assert.equal((await b.getSnapshot()).points, 20);
  assert.deepEqual(await b.getQuizzes("missing"), []);
  await b.reset();
  assert.ok(
    (await createMockClient(s).getQuizzes("ulu-cami")).every((q) => !q.solved),
  );
});

test("a snapshot saved before quizzes existed still loads", async () => {
  const s = storage();
  s.setItem(demoStorageKey, JSON.stringify({ ...createSeed(), points: 40 }));
  const client = createMockClient(s);
  assert.equal((await client.getSnapshot()).points, 40);
  assert.ok((await client.getQuizzes("ulu-cami")).every((q) => !q.solved));
});
test("demo sites with a model carry a placement; the mock serves default map settings", async () => {
  const c = createMockClient(storage());
  const { sites } = await c.getSnapshot();
  const placed = sites.filter((s) => s.model?.placement);
  assert.deepEqual(
    placed.map((s) => s.id),
    ["ulu-cami", "bedesten", "koza-han", "orhan-gazi"],
  );
  for (const { model } of placed) {
    assert.ok(model!.src.startsWith("/demo-models/") && model!.triangles! > 0);
    const p = model!.placement!;
    // Inside the demo region, a few tens of metres from the marker.
    assert.ok(
      Math.abs(p.lng - 29.062) < 0.005 && Math.abs(p.lat - 40.185) < 0.005,
    );
    assert.ok(p.headingDeg >= 0 && p.headingDeg < 360 && p.scale === 1);
  }
  assert.deepEqual(await c.getMapSettings(), {
    modelMinZoom: 16,
    maxVisibleModels: 5,
  });
  assert.deepEqual(await c.refreshCatalog(), await c.getSnapshot());
});
