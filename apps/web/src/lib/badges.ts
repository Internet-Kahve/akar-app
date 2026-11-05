import type { HeritageSite, Memory, SiteBadge } from "@akar/domain";
import type { SiteProgress } from "@akar/api-client";

/**
 * Badge tiers (5 Nov 2026). The tier is not a property of the badge but of how it was earned, so the picture
 * (`/rozetler/<id>.webp`) carries no tier and the screen draws the tier's ring around it:
 * - bronze: a story badge;
 * - silver: a task badge (a question, or a field task done from home);
 * - gold: a badge with `onSiteLabel`, earned at the site. One earned from home turns gold when the task is done there.
 */
export type BadgeTier = "bronze" | "silver" | "gold";
export type HeldBadge = SiteProgress["badges"][number];

export function badgeTier(badge: Pick<SiteBadge, "condition" | "onSiteLabel">, held?: Pick<HeldBadge, "onSite"> | null): BadgeTier {
  if (badge.condition === "story") return "bronze";
  return badge.onSiteLabel && held?.onSite ? "gold" : "silver";
}

/** An earned badge that is still silver but turns gold when its task is done at the site. */
export const canTurnGold = (badge: Pick<SiteBadge, "condition" | "onSiteLabel">, held?: Pick<HeldBadge, "onSite"> | null): boolean =>
  badge.condition === "task" && badge.onSiteLabel && !held?.onSite;

/** Badges drawn for the 4 Nov 2026 content (`apps/web/scripts/draw-badges.mjs`); any other falls back to its kind's picture. */
export const BADGE_ART = new Set([
  "abc-hikaye",
  "abc-sivri-kemer",
  "emir-hikaye",
  "emir-tas-tugla",
  "emir-avlu",
  "ebm-hikaye",
  "ebm-kutuphane",
  "hnc-hikaye",
  "hnc-yasin",
  "kar-hikaye",
  "kar-cini",
  "koza-hikaye",
  "koza-kosk-mescit",
  "koza-on-dort-basamak",
  "obh-hikaye",
  "obh-aynali",
  "obh-uc-giris",
  "obc-hikaye",
  "obc-alci-mihrap",
  "obc-ikiz-kemer",
  "ogt-nilufer",
  "ogt-tek-kubbe",
  "ulu-hikaye",
  "ulu-kundekari",
  "ulu-sahaflar",
  "bed-hikaye",
  "bed-on-dort-kubbe",
  "bed-dort-kapi",
]);

/** The kind's picture: a story, a field task (earned at a place), or a question. */
export function fallbackBadgeArt(badge: Pick<SiteBadge, "condition" | "onSiteLabel">): string {
  if (badge.condition === "story") return "/rozetler/_hikaye.webp";
  return badge.onSiteLabel ? "/rozetler/_saha.webp" : "/rozetler/_gorev.webp";
}

export function badgeArt(badge: Pick<SiteBadge, "id" | "condition" | "onSiteLabel">): string {
  return BADGE_ART.has(badge.id) ? `/rozetler/${badge.id}.webp` : fallbackBadgeArt(badge);
}

/** Every badge of the published sites, with what the visitor holds of it. */
export interface BadgeEntry {
  badge: SiteBadge;
  site: HeritageSite;
  held: HeldBadge | undefined;
  tier: BadgeTier;
}
export function badgeEntries(sites: HeritageSite[], progress: SiteProgress): BadgeEntry[] {
  const held = new Map(progress.badges.map((b) => [b.badgeId, b]));
  return sites
    .filter((site) => site.status === "published")
    .flatMap((site) =>
      (site.badges ?? []).map((badge) => {
        const own = held.get(badge.id);
        return { badge, site, held: own, tier: badgeTier(badge, own) };
      }),
    );
}

/**
 * Earned first, newest first; then the rest in site order. Gold before silver before bronze among badges earned
 * at the same moment, so the profile's strip opens on the best of the latest.
 */
export function featuredBadges(entries: BadgeEntry[], count: number): BadgeEntry[] {
  const rank: Record<BadgeTier, number> = { gold: 0, silver: 1, bronze: 2 };
  const earned = entries
    .filter((e) => e.held)
    .sort((a, b) => b.held!.earnedAt.localeCompare(a.held!.earnedAt) || rank[a.tier] - rank[b.tier]);
  return [...earned, ...entries.filter((e) => !e.held)].slice(0, count);
}

/* ------------------------------------------------------------------------------------------- achievements */

/**
 * Achievements over the sites (5 Nov 2026): each is measured from what the visitor's state already holds, and none
 * gives points. One that cannot be reached with the published content (no Bursa sites, no akar–hayrat pair) is left out.
 */
export type AchievementId = "first-story" | "whole-site" | "half-bursa" | "akar-hayrat" | "first-on-site" | "first-memory" | "all-badges";
export interface Achievement {
  id: AchievementId;
  done: boolean;
  /** How far along: `[have, need]`, `have` capped at `need`. */
  progress: [number, number];
}

/** The founding story of the project: Ulucami (hayrat) and the Bedesten whose income kept it (akar). */
const PAIR_HAYRAT = "ulu-cami";
const PAIR_AKAR = ["yildirim-bayezid-bedesteni", "bedesten"];

export function achievements(input: {
  sites: HeritageSite[];
  readIds: string[];
  memories: Pick<Memory, "status">[];
  progress: SiteProgress;
}): Achievement[] {
  const published = input.sites.filter((s) => s.status === "published");
  const ids = new Set(published.map((s) => s.id));
  const read = new Set(input.readIds.filter((id) => ids.has(id)));
  const held = new Set(input.progress.badges.map((b) => b.badgeId));
  const step = (id: AchievementId, have: number, need: number): Achievement => ({
    id,
    done: have >= need,
    progress: [Math.min(have, need), need],
  });
  const out: Achievement[] = [step("first-story", read.size, 1)];

  const withBadges = published.filter((s) => s.badges?.length);
  if (withBadges.length) {
    // Progress towards the site closest to complete, in its own badge count.
    const closest = withBadges.reduce((a, b) => (count(b) / b.badges!.length > count(a) / a.badges!.length ? b : a));
    out.push(step("whole-site", count(closest), closest.badges!.length));
  }

  const bursa = published.filter((s) => s.city.trim().toLocaleLowerCase("tr") === "bursa");
  if (bursa.length >= 2) out.push(step("half-bursa", bursa.filter((s) => read.has(s.id)).length, Math.ceil(bursa.length / 2)));

  const akar = PAIR_AKAR.find((id) => ids.has(id));
  if (ids.has(PAIR_HAYRAT) && akar) out.push(step("akar-hayrat", [PAIR_HAYRAT, akar].filter((id) => read.has(id)).length, 2));

  if (published.some((s) => s.badges?.some((b) => b.onSiteLabel)))
    out.push(step("first-on-site", input.progress.badges.some((b) => b.onSite) ? 1 : 0, 1));

  out.push(step("first-memory", input.memories.some((m) => m.status === "approved") ? 1 : 0, 1));

  const all = withBadges.flatMap((s) => s.badges!);
  if (all.length) out.push(step("all-badges", all.filter((b) => held.has(b.id)).length, all.length));
  return out;

  function count(site: HeritageSite) {
    return site.badges!.filter((b) => held.has(b.id)).length;
  }
}

/** Achievements done now that were not done before: what a celebration announces. */
export const newlyDone = (before: Achievement[], after: Achievement[]): Achievement[] =>
  after.filter((a) => a.done && !before.find((b) => b.id === a.id)?.done);
