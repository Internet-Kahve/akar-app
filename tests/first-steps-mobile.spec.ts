import { expect, test } from "@playwright/test";

/**
 * First steps on a phone (Muhammed, 3 Nov 2026): one hint per screen, once, and the photo-or-3D question the first
 * time a site with a model opens. A fresh device, nothing seen yet.
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

test("a site with a model asks once: photographs or 3D; meanwhile no 3D loads", async ({ page }) => {
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort());
  let glb = 0;
  page.on("request", (r) => { if (/\.glb/.test(r.url())) glb++; });
  await page.goto("/#view=detail&site=ulu-cami");
  const choice = page.getByRole("group", { name: "Eseri nasıl görmek istersin?" });
  await expect(choice).toBeVisible({ timeout: 12000 });
  expect(glb).toBe(0);
  await choice.getByRole("button", { name: /3D model/ }).click();
  await expect(choice).toHaveCount(0);
  await expect(page.locator(".model-canvas canvas")).toBeVisible();
  await page.reload();
  await expect(page.locator(".model-canvas canvas")).toBeVisible({ timeout: 12000 });
  await expect(page.getByRole("group", { name: "Eseri nasıl görmek istersin?" })).toHaveCount(0);
});
