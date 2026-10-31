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
    maxVisibleModels: 10,
  });
  assert.deepEqual(await c.refreshCatalog(), await c.getSnapshot());
});

test("mock: a placement is saved whole and survives a reload, saving the site keeps it, hiding it keeps the values, and bad values and sites without a model are refused", async () => {
  const s = storage();
  const c = createMockClient(s);
  const before = (await c.getSnapshot()).sites.find(
    (x) => x.id === "ulu-cami",
  )!;
  const placement = {
    ...before.model!.placement!,
    headingDeg: 180,
    altitudeM: 2.5,
    anchorNode: "Govde",
    hiddenPoints: [{ lng: 29.06, lat: 40.18 }],
    visible: true,
  };
  await c.dispatch({ type: "map-placement", siteId: "ulu-cami", placement });
  assert.deepEqual(await c.getMapPlacement("ulu-cami"), placement);
  assert.deepEqual(
    await createMockClient(s).getMapPlacement("ulu-cami"),
    placement,
  );

  // The editor's copy of the model still has the old placement: saving the site does not bring it back.
  const saved = await c.saveSite({ ...before, description: "Yeni açıklama" });
  assert.equal(saved.site.model?.placement?.headingDeg, 180);

  // Hidden: kept with its values; the map draws only placements that are not hidden.
  await c.dispatch({
    type: "map-placement",
    siteId: "ulu-cami",
    placement: { ...placement, visible: false },
  });
  assert.deepEqual(await c.getMapPlacement("ulu-cami"), {
    ...placement,
    visible: false,
  });

  await assert.rejects(
    c.dispatch({
      type: "map-placement",
      siteId: "ulu-cami",
      placement: { ...placement, scale: 11 },
    }),
    /Ölçek/,
  );
  const bare = (await c.getSnapshot()).sites.find((x) => !x.model)!;
  await assert.rejects(
    c.dispatch({
      type: "map-placement",
      siteId: bare.id,
      placement,
    }),
    /3B modeli yok/,
  );
  await assert.rejects(
    c.dispatch({ type: "map-placement", siteId: "yok", placement }),
    /bulunamadı/,
  );
  assert.equal(await c.getMapPlacement(bare.id), null);
});

test("mock: a draft site with a model can be placed", async () => {
  const c = createMockClient(storage());
  const draft = {
    ...(await c.getSnapshot()).sites.find((x) => x.id === "ulu-cami")!,
    id: "taslak",
    status: "draft" as const,
  };
  delete draft.model!.placement;
  const { site } = await c.saveSite(draft);
  assert.equal(site.model?.placement, undefined);
  await c.dispatch({
    type: "map-placement",
    siteId: "taslak",
    placement: {
      lng: 29.06,
      lat: 40.18,
      headingDeg: 0,
      scale: 1,
      altitudeM: 0,
      anchorNode: null,
      hiddenPoints: [],
      keptPoints: [],
      visible: true,
    },
  });
  assert.equal((await c.getMapPlacement("taslak"))?.lat, 40.18);
});

test("mock: Ulucami carries two tasks and three badges, and no answer key or success text anywhere in the snapshot", async () => {
  const snapshot = await createMockClient(storage()).getSnapshot();
  const site = snapshot.sites.find((x) => x.id === "ulu-cami")!;
  assert.deepEqual(
    site.tasks?.map((t) => [t.id, t.kind]),
    [
      ["ulu-soru-kundekari", "quiz"],
      ["ulu-saha-sahaflar", "field"],
    ],
  );
  assert.deepEqual(
    site.badges?.map((b) => [b.id, b.condition, b.taskId, b.onSiteLabel]),
    [
      ["ulu-hikaye", "story", null, false],
      ["ulu-kundekari", "task", "ulu-soru-kundekari", false],
      ["ulu-sahaflar", "task", "ulu-saha-sahaflar", true],
    ],
  );
  const text = JSON.stringify(snapshot);
  assert.ok(!text.includes("correctIndex"));
  assert.ok(!text.includes("Kündekâri: ahşap parçalar"));
  assert.ok(!text.includes("kuzeyde Sahaflar Kapısı, doğuda"));
  assert.equal(
    snapshot.sites.filter((x) => x.tasks).length,
    1,
    "only Ulucami has tasks",
  );
});

test("mock: a wrong answer earns nothing and can be retried; the right one earns the task badge once and lasts across clients", async () => {
  const s = storage(),
    c = createMockClient(s);
  const wrong = await c.answerSiteTask("ulu-soru-kundekari", 1);
  assert.deepEqual(
    [wrong.correct, wrong.correctText, wrong.earnedBadges],
    [false, null, []],
  );
  assert.match(wrong.wrongText ?? "", /Tekrar dene/);
  assert.deepEqual(await c.getSiteProgress(), { tasks: [], badges: [] });
  const right = await c.answerSiteTask("ulu-soru-kundekari", 0);
  assert.equal(right.correct, true);
  assert.match(right.correctText ?? "", /Kündekâri/);
  assert.equal(right.wrongText, null);
  assert.deepEqual(
    right.earnedBadges.map((b) => b.id),
    ["ulu-kundekari"],
  );
  assert.deepEqual(
    (await c.answerSiteTask("ulu-soru-kundekari", 0)).earnedBadges,
    [],
    "a held badge is not earned again",
  );
  const progress = await createMockClient(s).getSiteProgress();
  assert.deepEqual(
    progress.tasks.map((t) => [t.taskId, t.siteId, t.onSite]),
    [["ulu-soru-kundekari", "ulu-cami", false]],
  );
  assert.deepEqual(
    progress.badges.map((b) => [b.badgeId, b.onSite]),
    [["ulu-kundekari", false]],
  );
  await assert.rejects(c.answerSiteTask("ulu-soru-kundekari", 4), /şık/);
  await assert.rejects(c.answerSiteTask("ulu-saha-sahaflar", 0), /soru değil/);
  await assert.rejects(c.answerSiteTask("yok", 0), /bulunamadı/);
  // No points anywhere.
  assert.equal((await c.getSnapshot()).points, 0);
});

test("mock: a field task is done on site only near the site (badge marked «yerinde»), or from home by the named part", async () => {
  const c = createMockClient(storage());
  assert.deepEqual(
    await c.completeSiteTask("ulu-saha-sahaflar", {
      mode: "onSite",
      coordinates: [29.07, 40.19],
    }),
    { done: false, reason: "tooFar" },
  );
  assert.deepEqual(
    await c.completeSiteTask("ulu-saha-sahaflar", {
      mode: "fromHome",
      part: "Cati",
    }),
    { done: false, reason: "wrongPart" },
  );
  assert.deepEqual(await c.getSiteProgress(), { tasks: [], badges: [] });
  const home = await c.completeSiteTask("ulu-saha-sahaflar", {
    mode: "fromHome",
    part: "Tac_Kapi",
  });
  assert.equal(home.done, true);
  if (!home.done) return;
  assert.equal(home.onSite, false);
  assert.match(home.doneText, /Sahaflar Kapısı/);
  assert.deepEqual(
    home.earnedBadges.map((b) => b.id),
    ["ulu-sahaflar"],
  );
  // 60 m north of the site point is inside the 80 m radius: the held badge becomes «yerinde».
  const near = await c.completeSiteTask("ulu-saha-sahaflar", {
    mode: "onSite",
    coordinates: [29.0619, 40.18454],
    accuracyM: 10,
  });
  assert.equal(near.done && near.onSite, true);
  assert.deepEqual(near.done && near.earnedBadges, []);
  const progress = await c.getSiteProgress();
  assert.deepEqual(
    progress.tasks.map((t) => t.onSite),
    [true],
  );
  assert.deepEqual(
    progress.badges.map((b) => b.onSite),
    [true],
  );
  // The accuracy radius is forgiven up to 50 m.
  const edge = createMockClient(storage());
  assert.deepEqual(
    await edge.completeSiteTask("ulu-saha-sahaflar", {
      mode: "onSite",
      coordinates: [29.0619, 40.1849],
      accuracyM: 0,
    }),
    { done: false, reason: "tooFar" },
  );
  assert.equal(
    (
      await edge.completeSiteTask("ulu-saha-sahaflar", {
        mode: "onSite",
        coordinates: [29.0619, 40.1849],
        accuracyM: 500,
      })
    ).done,
    true,
  );
});

test("mock: finishing the story earns the story badge once; reset clears the badges", async () => {
  const c = createMockClient(storage());
  await c.dispatch({ type: "read", siteId: "bedesten" });
  assert.deepEqual((await c.getSiteProgress()).badges, []);
  await c.dispatch({ type: "read", siteId: "ulu-cami" });
  await c.dispatch({ type: "read", siteId: "ulu-cami" });
  assert.deepEqual(
    (await c.getSiteProgress()).badges.map((b) => b.badgeId),
    ["ulu-hikaye"],
  );
  await c.reset();
  assert.deepEqual(await c.getSiteProgress(), { tasks: [], badges: [] });
});
test("mock: savePreferences merges the given keys, null clears one, a missing key stays", async () => {
  const c = createMockClient(storage());
  assert.deepEqual(await c.savePreferences({ siteLang: "en" }), { siteLang: "en", voiceLang: null, voiceGender: null });
  assert.deepEqual(await c.savePreferences({ voiceLang: "tr", voiceGender: "male" }), { siteLang: "en", voiceLang: "tr", voiceGender: "male" });
  assert.deepEqual(await c.savePreferences({ voiceGender: null }), { siteLang: "en", voiceLang: "tr", voiceGender: null });
  assert.deepEqual(await c.savePreferences({}), { siteLang: "en", voiceLang: "tr", voiceGender: null });
});
test("mock: translate marks empty English as machine draft and leaves written English; narrate records nothing", async () => {
  const c = createMockClient(storage());
  const site = (await c.getSnapshot()).sites.find((s) => s.stories.length > 1)!;
  const [first, second] = site.stories;
  await c.saveSite({
    ...site,
    stories: site.stories.map((s) =>
      s.id === first!.id ? { ...s, textEn: "Written", simpleEn: "Plain" } : { ...s, textEn: "", simpleEn: "" },
    ),
  });
  const one = await c.translateSite(site.id, second!.id);
  assert.equal(one.translated, 1);
  const done = one.site.stories.find((s) => s.id === second!.id)!;
  assert.equal(done.textEnStatus, "machine");
  assert.match(done.textEn!, /^\[EN draft\] /);
  assert.equal(one.site.stories.find((s) => s.id === first!.id)!.textEn, "Written");
  const all = await c.translateSite(site.id);
  assert.equal(all.site.stories.find((s) => s.id === second!.id)!.textEn, done.textEn);
  assert.equal(all.site.stories.find((s) => s.id === first!.id)!.textEnStatus, undefined);
  const voices = await c.narrateSite(site.id);
  assert.deepEqual([voices.generated, voices.skipped, voices.stale], [0, 0, 0]);
  await assert.rejects(c.narrateSite(site.id, "no-such"));
});
