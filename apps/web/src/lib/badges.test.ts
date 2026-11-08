import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import type { HeritageSite, SiteBadge } from "@akar/domain";
import { BADGE_ART, achievements, badgeArt, badgeEntries, badgeTier, canTurnGold, fallbackBadgeArt, featuredBadges, newlyDone } from "./badges";

const badge = (id: string, condition: "story" | "task", onSiteLabel = false): SiteBadge => ({
  id,
  title: id,
  text: id,
  condition,
  taskId: condition === "task" ? `${id}-task` : null,
  onSiteLabel,
});
const site = (id: string, badges: SiteBadge[], city = "Bursa", status: "published" | "draft" = "published") =>
  ({ id, name: id, city, status, badges }) as unknown as HeritageSite;
const held = (badgeId: string, onSite = false, earnedAt = "2026-11-05T10:00:00Z") => ({ badgeId, siteId: "x", onSite, earnedAt });

test("tier: story is bronze, a task silver, a field task done at the site gold", () => {
  assert.equal(badgeTier(badge("a", "story")), "bronze");
  assert.equal(badgeTier(badge("a", "story"), { onSite: true }), "bronze");
  assert.equal(badgeTier(badge("b", "task")), "silver");
  assert.equal(badgeTier(badge("b", "task"), { onSite: true }), "silver", "a question has no on-site label: never gold");
  assert.equal(badgeTier(badge("c", "task", true)), "silver");
  assert.equal(badgeTier(badge("c", "task", true), { onSite: false }), "silver");
  assert.equal(badgeTier(badge("c", "task", true), { onSite: true }), "gold");
  assert.equal(canTurnGold(badge("c", "task", true), { onSite: false }), true);
  assert.equal(canTurnGold(badge("c", "task", true), { onSite: true }), false);
  assert.equal(canTurnGold(badge("b", "task"), { onSite: false }), false);
});

test("every drawn badge has its file, under 20 KB; an unknown badge falls back to its kind's picture", () => {
  const dir = join(import.meta.dirname, "..", "..", "public", "rozetler");
  assert.equal(BADGE_ART.size, 28);
  for (const id of [...BADGE_ART, "_hikaye", "_gorev", "_saha"]) {
    const file = join(dir, `${id}.webp`);
    assert.ok(existsSync(file), file);
    assert.ok(statSync(file).size < 20_000, `${id} is over 20 KB`);
  }
  assert.equal(badgeArt(badge("ulu-kundekari", "task")), "/rozetler/ulu-kundekari.webp");
  assert.equal(badgeArt(badge("yeni-hikaye", "story")), "/rozetler/_hikaye.webp");
  assert.equal(badgeArt(badge("yeni-saha", "task", true)), "/rozetler/_saha.webp");
  assert.equal(fallbackBadgeArt(badge("yeni-soru", "task")), "/rozetler/_gorev.webp");
});

test("entries skip drafts; featured puts the newest earned first, then the rest in order", () => {
  const sites = [site("s1", [badge("a", "story"), badge("b", "task", true)]), site("s2", [badge("c", "task")]), site("d", [badge("z", "story")], "Bursa", "draft")];
  const entries = badgeEntries(sites, { tasks: [], badges: [held("c", false, "2026-11-04T00:00:00Z"), held("b", true, "2026-11-05T00:00:00Z")] });
  assert.deepEqual(entries.map((e) => e.badge.id), ["a", "b", "c"]);
  assert.deepEqual(entries.map((e) => e.tier), ["bronze", "gold", "silver"]);
  assert.deepEqual(featuredBadges(entries, 2).map((e) => e.badge.id), ["b", "c"]);
  assert.deepEqual(featuredBadges(entries, 5).map((e) => e.badge.id), ["b", "c", "a"]);
});

test("achievements are measured from the state and only offered when reachable", () => {
  const sites = [
    site("ulu-cami", [badge("u1", "story"), badge("u2", "task", true)]),
    site("yildirim-bayezid-bedesteni", [badge("b1", "story")]),
    site("koza-han", [badge("k1", "story")]),
    site("karatay", [badge("r1", "story")], "Konya"),
  ];
  const empty = achievements({ sites, readIds: [], memories: [], progress: { tasks: [], badges: [] } });
  assert.deepEqual(empty.map((a) => a.id), ["first-story", "whole-site", "half-bursa", "akar-hayrat", "first-on-site", "first-memory", "all-badges"]);
  assert.ok(empty.every((a) => !a.done));
  assert.deepEqual(empty.find((a) => a.id === "half-bursa")!.progress, [0, 2]);

  const later = achievements({
    sites,
    readIds: ["ulu-cami", "yildirim-bayezid-bedesteni", "gone"],
    memories: [{ status: "pending" }, { status: "approved" }],
    progress: { tasks: [], badges: [held("u1"), held("u2", true), held("b1")] },
  });
  const by = Object.fromEntries(later.map((a) => [a.id, a]));
  assert.equal(by["first-story"]!.done, true);
  assert.equal(by["whole-site"]!.done, true);
  assert.equal(by["half-bursa"]!.done, true, "2 of 3 Bursa sites; Konya does not count");
  assert.equal(by["akar-hayrat"]!.done, true);
  assert.equal(by["first-on-site"]!.done, true);
  assert.equal(by["first-memory"]!.done, true);
  assert.deepEqual(by["all-badges"]!.progress, [3, 5]);
  assert.deepEqual(newlyDone(empty, later).map((a) => a.id), ["first-story", "whole-site", "half-bursa", "akar-hayrat", "first-on-site", "first-memory"]);

  const noPair = achievements({ sites: [site("koza-han", [])], readIds: [], memories: [], progress: { tasks: [], badges: [] } });
  assert.deepEqual(noPair.map((a) => a.id), ["first-story", "first-memory"]);
});
