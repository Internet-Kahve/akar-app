import { expect, test } from "@playwright/test";
import { createSeed } from "../packages/api-client/src/seed";

/** Ulucami's three demo badges: its story (earned), Kündekâri (not yet) and Sahaflar Kapısı (earned at the site). */
async function openProfile(page: import("@playwright/test").Page) {
  const snapshot = createSeed();
  const site = snapshot.sites.find((s) => s.id === "ulu-cami")!;
  snapshot.readIds = [site.id];
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript((data) => {
    localStorage.setItem("akar-demo-bursa-v1", JSON.stringify(data));
    localStorage.setItem("akar.ipucu.profil.avatar", "1");
    localStorage.setItem("akar.ipucu.masa.profil.avatar", "1");
  }, {
    ...snapshot,
    siteProgress: {
      tasks: [],
      badges: [
        { badgeId: "ulu-hikaye", siteId: site.id, onSite: false, earnedAt: "2026-11-01T09:00:00Z" },
        { badgeId: "ulu-sahaflar", siteId: site.id, onSite: true, earnedAt: "2026-11-03T09:00:00Z" },
      ],
    },
  });
  await page.goto("/#view=profile");
  return page.locator(".profile-badges");
}

test("badges are medals with their own picture and tier; one not earned is a grey silhouette that says how to earn it", async ({ page }) => {
  const shelf = await openProfile(page);
  const story = shelf.getByRole("button", { name: /Ulucami'yi dinledin/ });
  await expect(story.locator(".medal")).toHaveClass(/tier-bronze/);
  await expect(story.locator("img")).toHaveAttribute("src", "/rozetler/ulu-hikaye.webp");
  await expect(story.locator("img")).toHaveAttribute("loading", "lazy");
  const gold = shelf.getByRole("button", { name: /Sahaflar Kapısı/ });
  await expect(gold.locator(".medal")).toHaveClass(/tier-gold/);
  const locked = shelf.getByRole("button", { name: /Kündekâri/ });
  await expect(locked.locator(".medal")).toHaveClass(/locked/);
  await expect(locked).toContainText("Görev:");
  // Every medal's picture is there: no broken image on the shelf.
  const broken = await shelf.locator("img").evaluateAll((imgs) => imgs.filter((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth === 0).length);
  expect(broken).toBe(0);

  await gold.click();
  const card = page.getByRole("dialog", { name: "Sahaflar Kapısı" });
  await expect(card.locator(".tier-chip.tier-gold")).toHaveText("Altın");
  await expect(card).toContainText("Yerinde");
  await expect(card).toContainText("3 Kasım 2026 tarihinde kazandın");
  await card.getByRole("button", { name: "Pencereyi kapat" }).click();

  await locked.click();
  const howTo = page.getByRole("dialog", { name: "Kündekâri" });
  await expect(howTo).toContainText("Nasıl kazanılır");
  await expect(howTo).not.toContainText("tarihinde kazandın");
});

test("achievements are measured from the state: the first story is done, the rest show how far along", async ({ page }) => {
  await openProfile(page);
  const list = page.locator(".profile-achievements");
  await expect(list.locator("li.done")).toContainText(["İlk hikâye"]);
  await expect(list.getByRole("progressbar", { name: "Koleksiyon tamam" })).toHaveAttribute("aria-valuenow", "2");
});

test("a badge without its own picture falls back to its kind's, never a broken image", async ({ page }) => {
  const snapshot = createSeed();
  const site = snapshot.sites.find((s) => s.id === "ulu-cami")!;
  site.badges = [{ id: "yepyeni-rozet", title: "Yepyeni", text: "Yeni", condition: "story", taskId: null, onSiteLabel: false }];
  await page.addInitScript((data) => localStorage.setItem("akar-demo-bursa-v1", JSON.stringify(data)), snapshot);
  await page.goto("/#view=profile");
  const img = page.locator(".profile-badges .medal img");
  await expect(img).toHaveAttribute("src", "/rozetler/_hikaye.webp");
  await expect.poll(() => img.evaluate((i) => (i as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
});
