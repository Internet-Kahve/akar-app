import { expect, test } from "@playwright/test";
import { createSeed } from "../packages/api-client/src/seed";

test("profile uses catalog badges, saved places and persistent language preferences", async ({ page }) => {
  const snapshot = createSeed();
  const site = snapshot.sites[0]!;
  site.badges = [{ id: "catalog-story", title: "Katalog rozeti", text: "Hikâyeyi tamamla", condition: "story", taskId: null, onSiteLabel: false }];
  snapshot.savedIds = [site.id];
  await page.addInitScript((data) => localStorage.setItem("akar-demo-bursa-v1", JSON.stringify(data)), {
    ...snapshot,
    siteProgress: { tasks: [], badges: [{ badgeId: "catalog-story", siteId: site.id, onSite: false, earnedAt: "2026-10-31" }] },
  });
  await page.goto("/#view=profile");
  await expect(page.locator(".profile-badges .medal-tile.earned")).toContainText("Katalog rozeti");
  await expect(page.locator(".profile-saved .list-row")).toContainText(site.name);
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.getByRole("heading", { name: "My heritage" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "My heritage" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator(".profile-saved .list-row").click();
  await expect(page.locator(".side-panel h1")).toContainText(site.nameEn || site.name);
});
