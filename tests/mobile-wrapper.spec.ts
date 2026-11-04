import { expect, test } from "@playwright/test";

test("the native bundle opens the map and returns to its bare address without reloading", async ({ page }) => {
  test.skip(!test.info().project.name.endsWith("-web"), "static mobile export only");
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator(".opening")).toHaveCount(0);
  await expect(page).not.toHaveURL(/tanitim/);
  await page.evaluate(() => {
    document.documentElement.dataset.mobileNavigationProbe = "kept";
    location.hash = "view=detail&site=ulu-cami";
  });
  await expect(page.locator(".detail-panel")).toBeVisible();
  await page.goBack();
  await expect(page.locator(".detail-panel")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-mobile-navigation-probe", "kept");
});
