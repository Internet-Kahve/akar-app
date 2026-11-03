import { expect, test } from "@playwright/test";

/** The city button's ▾ lists the cities; a pick takes the map there at once (Muhammed, 3 Nov 2026). */
test.skip(({ isMobile }) => !isMobile, "the city button over the map is the phone's; a wide screen picks in its header");
test("the city button opens the cities and a pick takes the map there", async ({ page }) => {
  // The map and its first city have to come in before the jump (and a cold server compiles first).
  test.setTimeout(60_000);
  await page.goto("/#view=map");
  await expect(page.locator(".opening")).toHaveCount(0, { timeout: 12000 });
  await expect.poll(() => page.evaluate(() => !!window.akarMap?.loaded()), { timeout: 25000 }).toBe(true);
  const button = page.locator(".city-pick");
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  const menu = page.getByRole("menu");
  await expect(menu.getByRole("menuitemradio", { name: "Bursa" })).toHaveAttribute("aria-checked", "true");
  await menu.getByRole("menuitemradio", { name: "Konya" }).click();
  await expect(menu).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => (window.akarMap!.isMoving() ? 0 : window.akarMap!.getCenter().lng)), { timeout: 10000 })
    .toBeGreaterThan(32);
});
