import { expect, test } from "@playwright/test";

/**
 * First steps on a phone (Muhammed, 3 Nov 2026): one hint per screen, once; a site with a model opens on its
 * photographs and the hint shows where the 3D is. A fresh device, nothing seen yet.
 */
test.skip(({ isMobile }) => !isMobile, "the first-time hints are the phone's");
test.use({ storageState: { cookies: [], origins: [] } });

test("the map shows a finger on a tap once; the first touch puts it away for good", async ({ page }) => {
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort());
  await page.goto("/#view=map");
  await expect(page.locator(".opening")).toHaveCount(0, { timeout: 12000 });
  const tip = page.locator(".coach-tip");
  await expect(tip).toContainText("Bir esere dokun");
  // A finger and a few words; its only button is ✕.
  await expect(tip.locator(".coach-finger")).toBeVisible();
  await expect(tip.getByRole("button")).toHaveCount(1);
  await expect(tip.getByRole("button", { name: "Kapat" })).toBeVisible();
  await page.waitForTimeout(800);
  await page.mouse.click(20, 200);
  await expect(tip).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".opening")).toHaveCount(0, { timeout: 12000 });
  await expect(page.locator(".coach-tip")).toHaveCount(0);
});

test("no photo-or-3D question: the hint over the Fotoğraf / 3D switch says where to change it", async ({ page }) => {
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort());
  await page.goto("/#view=detail&site=ulu-cami");
  // No question card (6 Nov 2026): the hint over Fotoğraf / 3D says it instead.
  const tip = page.locator(".coach-tip");
  await expect(tip).toContainText("Fotoğraf ya da 3D", { timeout: 12000 });
  await expect(page.getByText("Eseri nasıl görmek istersin?")).toHaveCount(0);
  await expect(page.locator(".scene-media-switch").first()).toBeVisible();
});
