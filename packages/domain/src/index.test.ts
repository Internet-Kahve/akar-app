import test from "node:test";
import assert from "node:assert/strict";
import {
  reduceSnapshot,
  categoriesOf,
  categoryLabels,
  filterSites,
  kindCategory,
  offeredKinds,
  siteCategories,
  siteKinds,
  validateCityIdentity,
  validateSite,
  memoryPermissions,
  mapCloseSrc,
  mapModelSrc,
  modelFileFor,
  nightPartsMissing,
  partsMissing,
  type HeritageSite,
  type Memory,
} from "./index";
import { createSeed } from "../../api-client/src/seed";
test("Turkish search normalizes dotted I and filters by type", () => {
  const state = createSeed();
  assert.equal(filterSites(state.sites, "KOZA HANI").length, 1);
  assert.equal(filterSites(state.sites, "çeşme", "cesme").length, 1);
  assert.equal(filterSites(state.sites, "", "cami", []).length, 0);
});
test("repeat visit and read commands never duplicate points", () => {
  let state = createSeed();
  for (let i = 0; i < 3; i++)
    for (const type of ["visit", "read"] as const)
      state = reduceSnapshot(state, { type, siteId: "ulu-cami" });
  assert.equal(state.points, 115);
  assert.equal(state.visitedIds.length, 1);
});
test("memory is pending, approval is idempotent, rejection requires a reason", () => {
  const memory: Memory = {
    id: "memory-1",
    siteId: "ulu-cami",
    text: "Avluda güzel bir sabah.",
    status: "approved",
    createdAt: "2026-10-10",
    author: "Gezgin",
  };
  let state = reduceSnapshot(createSeed(), { type: "memory", memory });
  assert.equal(state.memories[0].status, "pending");
  assert.equal(state.points, 0);
  assert.throws(
    () =>
      reduceSnapshot(state, {
        type: "moderate",
        id: memory.id,
        status: "rejected",
      }),
    /Ret nedeni/,
  );
  for (let i = 0; i < 3; i++)
    state = reduceSnapshot(state, {
      type: "moderate",
      id: memory.id,
      status: "approved",
    });
  assert.equal(state.points, 25);
  assert.equal(state.memories[0].status, "approved");
});
test("draft may lack source, publishing and coordinates are validated", () => {
  const site = {
    ...createSeed().sites[0],
    source: "",
    status: "draft" as const,
  };
  assert.doesNotThrow(() => validateSite(site));
  assert.throws(() => validateSite({ ...site, status: "published" }), /kaynak/);
  assert.throws(
    () => validateSite({ ...site, coordinates: [28, 91] }),
    /enlem/,
  );
});
test("updates do not mutate previous snapshots; routes deduplicate and reject unknown sites", () => {
  const original = createSeed();
  const next = reduceSnapshot(original, {
    type: "save",
    siteId: "ulu-cami",
  });
  assert.equal(original.savedIds.length, 0);
  assert.equal(next.savedIds.length, 1);
  const route = reduceSnapshot(next, {
    type: "set-route",
    siteIds: ["bad", "ulu-cami", "ulu-cami"],
  });
  assert.deepEqual(route.routeIds, ["ulu-cami"]);
});

test("photo publications require valid cover, licenses and cue references; drafts remain editable", () => {
  const site = {
    ...createSeed().sites[0],
    editorVersion: 2 as const,
    status: "draft" as const,
    photos: [],
    sources: [],
  };
  assert.doesNotThrow(() =>
    validateSite({ ...site, name: "", description: "" }),
  );
  assert.throws(
    () => validateSite({ ...site, status: "published" }),
    /Kapak fotoğrafı/,
  );
  const source = {
    id: "source",
    title: "Demo archive",
    kind: "archive" as const,
    author: "",
    year: "",
    page: "",
    url: "",
    trust: "representative" as const,
  };
  const photo = {
    id: "photo",
    src: "data:image/png;base64,demo",
    alt: "Test photo",
    title: "",
    titleEn: "",
    description: "",
    license: "CC0",
    sourceId: source.id,
    trust: "representative" as const,
  };
  const complete = {
    ...site,
    status: "published" as const,
    coverPhotoId: photo.id,
    photos: [photo],
    sources: [source],
    stories: [{ ...site.stories[0], sourceId: source.id, photoId: photo.id }],
  };
  assert.doesNotThrow(() => validateSite(complete));
  assert.throws(
    () => validateSite({ ...complete, photos: [{ ...photo, license: "" }] }),
    /lisans/,
  );
  assert.throws(
    () =>
      validateSite({
        ...complete,
        stories: [{ ...complete.stories[0], sourceId: "missing" }],
      }),
    /kaynak bağla/,
  );
  assert.throws(
    () =>
      validateSite({
        ...complete,
        stories: [{ ...complete.stories[0], highlights: ["missing"] }],
      }),
    /vurgu/,
  );
});

test("tasks and badges: options, answer key, unique ids and a task badge naming one of the site's tasks", () => {
  const base = { ...createSeed().sites[0], editorVersion: 2 as const, status: "draft" as const, tasks: [], badges: [] };
  const quiz = {
    id: "q",
    kind: "quiz" as const,
    title: "Soru",
    prompt: "Hangisi?",
    trust: "verified" as const,
    quiz: { options: ["A", "B"], hints: [], wrongText: "Yanlış", fromHome: false, correctIndex: 1, correctText: "Doğru" },
  };
  const badge = { id: "b", title: "Rozet", text: "Metin", condition: "task" as const, taskId: "q", onSiteLabel: false };
  assert.doesNotThrow(() => validateSite({ ...base, tasks: [quiz], badges: [badge] }));
  // A public quiz carries no answer key: not an error here.
  const { correctIndex: _key, ...unkeyed } = quiz.quiz;
  assert.doesNotThrow(() => validateSite({ ...base, tasks: [{ ...quiz, quiz: unkeyed }] }));
  assert.throws(() => validateSite({ ...base, tasks: [{ ...quiz, quiz: { ...quiz.quiz, correctIndex: 2 } }] }), /Doğru seçenek/);
  assert.throws(() => validateSite({ ...base, tasks: [{ ...quiz, quiz: { ...quiz.quiz, options: ["A"] } }] }), /2–6/);
  assert.throws(() => validateSite({ ...base, tasks: [quiz, quiz] }), /tekrar/);
  assert.throws(() => validateSite({ ...base, tasks: [quiz], badges: [{ ...badge, taskId: "missing" }] }), /rozet/);
  assert.throws(() => validateSite({ ...base, tasks: [quiz], badges: [{ ...badge, condition: "story", taskId: "q" }] }), /rozet/);
  assert.throws(() => validateSite({ ...base, tasks: [quiz], badges: [badge, badge] }), /Rozet kimlikleri/);
});

test("about chapters and paragraphs: titles and texts, unique ids, a paragraph in one of the chapters, no blank reading item, the English reading matches the Turkish one", () => {
  const chapter = {
    id: "c1",
    title: "Tarihçe",
    kind: "history" as const,
    summary: ["Özet."],
    figures: [{ value: "1491", label: "yıl", evidence: "1491'de" }],
    quotes: [{ text: "Söz" }],
    timeline: [],
    terms: [],
    interior: false,
    focusParts: [],
  };
  const section = { id: "s1", kind: "history" as const, title: "Tarihçe", body: "Metin.", trust: "verified" as const, sourceId: "", chapterId: "c1" };
  const base = { ...createSeed().sites[0], editorVersion: 2 as const, status: "draft" as const, chapters: [chapter], sections: [section] };
  assert.doesNotThrow(() => validateSite(base));
  assert.doesNotThrow(() => validateSite({ ...base, chapters: [], sections: [{ ...section, chapterId: undefined }] }));
  assert.throws(() => validateSite({ ...base, chapters: [chapter, chapter] }), /Bölüm kimlikleri/);
  assert.throws(() => validateSite({ ...base, sections: [section, section] }), /Paragraf kimlikleri/);
  assert.throws(() => validateSite({ ...base, chapters: [{ ...chapter, title: " " }] }), /başlığı olmalı/);
  assert.throws(() => validateSite({ ...base, sections: [{ ...section, body: "" }] }), /paragrafın/);
  assert.throws(() => validateSite({ ...base, sections: [{ ...section, chapterId: "yok" }] }), /bölümüne/);
  assert.throws(() => validateSite({ ...base, chapters: [{ ...chapter, summary: [""] }] }), /boş alan/);
  const en = { summary: ["Summary."], figures: [{ value: "1491", label: "year", evidence: "in 1491" }], quotes: [{ text: "Word" }], timeline: [], terms: [] };
  assert.doesNotThrow(() => validateSite({ ...base, chapters: [{ ...chapter, readingEn: en }] }));
  assert.throws(() => validateSite({ ...base, chapters: [{ ...chapter, readingEn: { ...en, quotes: [] } }] }), /aynı sayıda/);
  assert.throws(() => validateSite({ ...base, chapters: [{ ...chapter, readingEn: { ...en, summary: [" "] } }] }), /eksiksiz/);
});

test("inventory imports never publish or overwrite duplicates and fail atomically", () => {
  const initial = createSeed();
  const fresh = { ...initial.sites[0], id: "new", name: "Yeni eser" };
  const next = reduceSnapshot(initial, {
    type: "import-sites",
    sites: [fresh, { ...fresh, id: "duplicate" }],
  });
  assert.equal(next.sites.length, initial.sites.length + 1);
  assert.equal(next.sites.at(-1)?.status, "draft");
  assert.throws(
    () =>
      reduceSnapshot(initial, {
        type: "import-sites",
        sites: [
          fresh,
          { ...fresh, id: "invalid", name: "Bad", coordinates: [29, 91] },
        ],
      }),
    /enlem/,
  );
  assert.equal(initial.sites.length, 6);
});

test("shared photo updates all referencing sites and preserves unrelated media", () => {
  const state = createSeed();
  const source = {
    id: "s",
    title: "Archive",
    kind: "archive" as const,
    author: "",
    year: "",
    page: "",
    url: "",
    trust: "representative" as const,
  };
  const photo = {
    id: "p",
    src: "data:image/png;base64,test",
    alt: "Old alt",
    title: "",
    titleEn: "",
    description: "",
    sourceId: "s",
    license: "CC0",
    trust: "representative" as const,
  };
  state.sites[0].photos = [photo];
  state.sites[1].photos = [photo];
  const next = reduceSnapshot(state, {
    type: "photo",
    photo: { ...photo, alt: "New alt" },
    source,
  });
  assert.equal(next.sites[0].photos?.[0].alt, "New alt");
  assert.equal(next.sites[1].photos?.[0].alt, "New alt");
  assert.equal(state.sites[0].photos[0].alt, "Old alt");
});
function pendingMemory(photo?: string) {
  const memory: Memory = {
    id: "m1",
    siteId: "ulu-cami",
    text: "Avludaki şadırvanın sesi.",
    status: "pending",
    createdAt: "2026-10-22T10:00:00.000Z",
    author: "Gezgin",
    ...(photo && { photo }),
  };
  return reduceSnapshot(createSeed(), { type: "memory", memory });
}
test("taking down an approved memory keeps text and reason, drops the photo and takes the points back once", () => {
  let state = reduceSnapshot(pendingMemory("data:image/png;base64,AAAA"), {
    type: "moderate",
    id: "m1",
    status: "approved",
  });
  assert.equal(state.points, 25);
  assert.throws(
    () =>
      reduceSnapshot(state, {
        type: "moderate",
        id: "m1",
        status: "rejected",
        reason: "  ",
      }),
    /Ret nedeni/,
  );
  for (let i = 0; i < 2; i++)
    state = reduceSnapshot(state, {
      type: "moderate",
      id: "m1",
      status: "rejected",
      reason: " Uygunsuz içerik ",
    });
  const [m] = state.memories;
  assert.deepEqual(
    [m?.status, m?.reason, m?.photo, m?.text, state.points],
    ["rejected", "Uygunsuz içerik", undefined, "Avludaki şadırvanın sesi.", 0],
  );
  // Rejection is final: a later approval changes nothing and pays nothing.
  state = reduceSnapshot(state, {
    type: "moderate",
    id: "m1",
    status: "approved",
  });
  assert.deepEqual([state.memories[0]?.status, state.points], ["rejected", 0]);
});
test("deleting removes the record in any status and takes approval points back once", () => {
  for (const type of ["delete-memory", "admin-delete-memory"] as const) {
    let state = reduceSnapshot(pendingMemory(), {
      type: "moderate",
      id: "m1",
      status: "approved",
    });
    state = reduceSnapshot(state, { type: "visit", siteId: "ulu-cami" });
    assert.equal(state.points, 125);
    state = reduceSnapshot(state, { type, id: "m1" });
    assert.deepEqual([state.memories.length, state.points], [0, 100]);
    assert.throws(
      () => reduceSnapshot(state, { type, id: "m1" }),
      /bulunamadı/,
    );
    // A pending memory carries no points.
    const pending = reduceSnapshot(pendingMemory(), { type, id: "m1" });
    assert.deepEqual([pending.memories.length, pending.points], [0, 0]);
  }
});
test("memory permissions: a moderator never decides their own memory, an admin may, only an admin purges others'", () => {
  const none = { remove: false, decide: false, takedown: false, purge: false };
  assert.deepEqual(memoryPermissions("user", "approved", false), none);
  assert.deepEqual(memoryPermissions("editor", "pending", false), none);
  assert.deepEqual(memoryPermissions("user", "rejected", true), {
    ...none,
    remove: true,
  });
  assert.deepEqual(memoryPermissions("moderator", "pending", false), {
    ...none,
    decide: true,
  });
  assert.deepEqual(memoryPermissions("moderator", "approved", false), {
    ...none,
    takedown: true,
  });
  assert.deepEqual(memoryPermissions("moderator", "approved", true), {
    ...none,
    remove: true,
  });
  assert.deepEqual(memoryPermissions("moderator", "pending", true), {
    ...none,
    remove: true,
  });
  assert.deepEqual(memoryPermissions("admin", "approved", false), {
    ...none,
    takedown: true,
    purge: true,
  });
  assert.deepEqual(memoryPermissions("admin", "approved", true), {
    ...none,
    remove: true,
    takedown: true,
  });
  assert.deepEqual(memoryPermissions("admin", "pending", true), {
    ...none,
    remove: true,
    decide: true,
  });
});
const elsewhere = (site: HeritageSite, id: string, city: string, kind: HeritageSite["kind"]): HeritageSite => ({
  ...site,
  id,
  name: `${city} ${kind}`,
  city,
  kind,
});
test("the filter row offers only kinds that have a published site, in the city the search points at", () => {
  const sites = createSeed().sites;
  // The demo Bursa has a mosque, a fountain, an inn, a bedesten and a school, but no tomb or bath.
  assert.deepEqual(offeredKinds(sites, ""), ["cami", "cesme", "han", "bedesten", "egitim"]);
  // A draft is not a site a visitor can reach.
  const drafted = sites.map((s) => (s.kind === "cesme" || s.kind === "egitim" ? { ...s, status: "draft" as const } : s));
  assert.deepEqual(offeredKinds(drafted, ""), ["cami", "han", "bedesten"]);
  // A second city: an empty search points at both, a search for one site or one city only at its city.
  const both = [...sites, elsewhere(sites[0]!, "konya-turbe", "Konya", "turbe")];
  assert.deepEqual(offeredKinds(both, ""), ["cami", "turbe", "cesme", "han", "bedesten", "egitim"]);
  assert.deepEqual(offeredKinds(both, "Konya"), ["turbe"]);
  assert.deepEqual(offeredKinds(both, "Ulucami"), ["cami", "cesme", "han", "bedesten", "egitim"]);
  assert.deepEqual(offeredKinds(both, "yok böyle bir eser"), []);
});
test("every kind belongs to a category; the legend lists only categories with a site and calls the income one «Ticari (akar)»", () => {
  for (const kind of siteKinds) assert.ok(siteCategories.includes(kindCategory[kind]), kind);
  assert.equal(categoryLabels.akar, "Ticari (akar)");
  assert.notEqual(categoryLabels.akar, "Akar");
  const sites = createSeed().sites;
  assert.deepEqual(categoriesOf(sites), ["dini", "su", "egitim", "akar"]);
  const real = sites.filter((s) => !s.id.endsWith("-demo"));
  assert.deepEqual(categoriesOf(real), ["dini", "akar"]);
  assert.deepEqual(categoriesOf([]), []);
  // Hamam, han and bedesten are income buildings; cami and türbe religious.
  assert.deepEqual(
    categoriesOf(real.filter((s) => s.kind === "han" || s.kind === "bedesten")),
    ["akar"],
  );
  const unknown = { ...sites[0]!, kind: "tekke" } as unknown as HeritageSite;
  assert.deepEqual(categoriesOf([unknown]), []);
});
test("a city identity needs two #RRGGBB colours and a pattern file name that cannot be a path", () => {
  const identity = { accent: "#22566E", pattern: "desen-bursa-sekiz-yildiz.svg", patternColour: "#A4D8E0" };
  validateCityIdentity(identity);
  assert.throws(() => validateCityIdentity({ ...identity, accent: "petrol" }), /#RRGGBB/);
  assert.throws(() => validateCityIdentity({ ...identity, patternColour: "#A4D8E" }), /#RRGGBB/);
  for (const pattern of ["", "desen.png", "../desen.svg", "desenler/desen.svg", "Desen.svg", 'a".svg', "a b.svg", ".svg", "-a.svg"])
    assert.throws(() => validateCityIdentity({ ...identity, pattern }), /\.svg dosya adı/, pattern);
});
test("a pattern scale is optional and, when given, a number from 0.25 to 8", () => {
  const identity = { accent: "#7A6340", pattern: "desen-hatay-yildiz-kafes.svg", patternColour: "#DBCDB5" };
  validateCityIdentity({ ...identity, patternScale: 4.3 });
  validateCityIdentity({ ...identity, patternScale: 0.25 });
  for (const patternScale of [0, 0.2, 9, Number.NaN, Number.POSITIVE_INFINITY, "4" as unknown as number])
    assert.throws(() => validateCityIdentity({ ...identity, patternScale }), /Desen ölçeği/, String(patternScale));
});
test("an emblem is optional, an .svg file name like the pattern; its small cut needs the emblem", () => {
  const identity = { accent: "#3D8285", pattern: "desen-konya-yildiz-gecme.svg", patternColour: "#E8DD7A" };
  validateCityIdentity({ ...identity, emblem: "amblem-konya.svg", emblemSmall: "amblem-konya-kalin.svg" });
  validateCityIdentity({ ...identity, emblem: "amblem-bursa.svg" });
  for (const emblem of ["../amblem.svg", "Amblem.svg", "amblem.png", ""])
    assert.throws(() => validateCityIdentity({ ...identity, emblem }), /amblemi/, emblem);
  assert.throws(() => validateCityIdentity({ ...identity, emblemSmall: "amblem-konya-kalin.svg" }), /amblemle birlikte/);
});
test("the night theme shows a site's night file when it has one, the day model otherwise", () => {
  const day = { name: "Gündüz", bytes: 1, src: "/gunduz.glb", parts: ["Kubbe"], trust: "representative" as const };
  const night = { name: "Gece", bytes: 1, src: "/gece.glb", parts: ["Kubbe"] };
  assert.equal(modelFileFor(day, "night").src, "/gunduz.glb");
  assert.equal(modelFileFor({ ...day, night }, "day").src, "/gunduz.glb");
  assert.equal(modelFileFor({ ...day, night }, "night").src, "/gece.glb");
});
test("a night file is checked against the part names the content uses, not against mesh names", () => {
  const seed = createSeed().sites[0];
  const site: HeritageSite = {
    ...seed,
    stories: [{ ...seed.stories[0], highlights: ["Kubbe"], camera: { target: "Minare", azimuthDeg: 0, elevationDeg: 20, distance: 1 } }],
    partCards: [{ id: "kart", parts: ["Kubbe"], title: "Kubbe", body: "", photos: [], trust: "verified" }],
    tasks: [],
    chapters: [],
    model: {
      name: "Model", bytes: 1, src: "/gunduz.glb", trust: "representative",
      // "Kubbe.001" is a mesh name: the editor reads node names only, so it must not count as missing.
      parts: ["Kubbe", "Kubbe.001", "Minare", "Avlu"],
      coverGroups: [["Avlu"]],
      night: { name: "Gece", bytes: 1, src: "/gece.glb", parts: ["Kubbe", "Avlu", "Fener"] },
    },
  };
  assert.deepEqual(nightPartsMissing(site), ["Minare"]);
  assert.deepEqual(nightPartsMissing({ ...site, model: { ...site.model!, night: { ...site.model!.night!, parts: [] } } }), []);
});

test("the map draws a baked file where there is one, and the site's own file otherwise", () => {
  const night = { name: "gece", bytes: 1, src: "/gece.glb", parts: [] };
  const day = { name: "gündüz", bytes: 1, src: "/gunduz.glb", parts: [], trust: "representative" } as Parameters<typeof mapModelSrc>[0];
  assert.equal(mapModelSrc(day, "day"), "/gunduz.glb");
  assert.equal(mapModelSrc({ ...day, night }, "night"), "/gece.glb");
  const baked = { ...day, night, mapBaked: { day: "/p.glb", night: "/pg.glb" } };
  assert.equal(mapModelSrc(baked, "day"), "/p.glb");
  assert.equal(mapModelSrc(baked, "night"), "/pg.glb");
  // Baked by day only: the night keeps its own file, never the day's baked light.
  assert.equal(mapModelSrc({ ...day, night, mapBaked: { day: "/p.glb" } }, "night"), "/gece.glb");
  // Close up a baked model gives way to the lit file of its theme; a lit model has nothing to give way to.
  assert.equal(mapCloseSrc(baked, "day"), "/gunduz.glb");
  assert.equal(mapCloseSrc(baked, "night"), "/gece.glb");
  assert.equal(mapCloseSrc(day, "day"), undefined);
});

test("a replaced model reports each part the content still names, with every place using it; unknown parts report nothing", () => {
  const seed = createSeed().sites[0];
  const site: HeritageSite = {
    ...seed,
    stories: [
      { ...seed.stories[0], highlights: ["Kubbe"], camera: { target: "Minare", azimuthDeg: 0, elevationDeg: 20, distance: 1 } },
      { ...seed.stories[0], highlights: ["Minare"] },
    ],
    partCards: [{ id: "kart", parts: ["Minare"], title: "Minare", body: "", photos: [], trust: "verified" }],
    tasks: [],
    chapters: [],
    model: { name: "Gündüz", bytes: 1, src: "/gunduz.glb", parts: ["Kubbe"], trust: "representative", coverGroups: [["Avlu"]] },
  };
  assert.deepEqual(partsMissing(site, ["Kubbe"]), [
    { part: "Minare", usedIn: ["Hikâye cümlesi 1", "Hikâye cümlesi 2", "Parça kartı «Minare»"] },
    { part: "Avlu", usedIn: ["İçini göster"] },
  ]);
  assert.deepEqual(partsMissing(site, []), []);
});

test("display names: 2–24 characters once trimmed, no links or slurs, no team names; ordinary names pass", async () => {
  const { displayNameProblem, normalizeDisplayName } = await import("./index.ts");
  assert.equal(normalizeDisplayName("  Ayşe   Nur  "), "Ayşe Nur");
  for (const ok of ["Ayşe Nur", "Işık", "Kemal", "Gökçe", "Çağrı Ö.", "Evliya'nın izinde", "Ali-Rıza", "Mehmet 1453", "Seyyah_34", "Zeynep"])
    assert.equal(displayNameProblem(ok), null, ok);
  assert.equal(displayNameProblem(" A "), "short");
  assert.equal(displayNameProblem("x".repeat(25)), "long");
  assert.equal(displayNameProblem("a".repeat(24)), null);
  assert.equal(displayNameProblem("www.site.com/x"), "characters");
  for (const link of ["www.site.com", "site.com", "Benim Site.com.tr", "akar.io", "WWW.ornek.NET"]) assert.equal(displayNameProblem(link), "characters", link);
  for (const ok of ["Ali K.", "Dr. Ayşe", "A. Rıza", "Ece.Nur"]) assert.equal(displayNameProblem(ok), null, ok);
  assert.equal(displayNameProblem("@hesap"), "characters");
  assert.equal(displayNameProblem("05321234567"), "characters");
  assert.equal(displayNameProblem("Akar Ekibi"), "reserved");
  assert.equal(displayNameProblem("ADMIN"), "reserved");
  for (const bad of ["or0spu", "Orospu çocuğu", "amk", "AQ", "s1kt1r git", "pezevenkadam", "Fuck you"])
    assert.equal(displayNameProblem(bad), "inappropriate", bad);
});
