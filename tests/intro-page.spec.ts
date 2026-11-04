import { expect, test } from "@playwright/test";

/** The introduction (4 Nov 2026): says what AKAR is, shows it, sends to the map; nothing moves with the scroll. */
test("the introduction says what AKAR is and leads to the map", async ({ page }) => {
  await page.goto("/tanitim2/index.html");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Türkiye'nin vakıf eserlerini haritada keşfet.");
  const open = page.getByRole("link", { name: /Haritayı aç/ }).first();
  await expect(open).toHaveAttribute("href", "/#view=map");
  const compare = page.getByRole("slider", { name: /karşılaştır/ });
  await compare.fill("20");
  await expect(page.locator("#kiyas")).toHaveAttribute("style", /--ayrim:\s*20%/);
  const width = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(width).toBeLessThanOrEqual(0);
  // English and the night theme, as in the app.
  await page.locator("#dil").click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("on the map");
  await expect(page.getByRole("link", { name: /Open the map/ }).first()).toBeVisible();
  await page.locator("#tema").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
});

test("the introduction's sample story goes between listening and reading", async ({ page }) => {
  await page.route(/\.mp3|\/media\/audio\//, (route) => route.abort());
  await page.goto("/tanitim2/index.html");
  await expect(page.locator("#an-cumle")).toHaveText("Ulucami'yi Sultan Yıldırım Bayezid yaptırdı.");
  await page.locator("#an-ileri").click();
  await expect(page.locator("#an-sayac")).toHaveText("2 / 4");
  await page.locator("#an-oku").click();
  await expect(page.locator("#an-liste button")).toHaveCount(4);
  await page.locator("#an-liste button").nth(3).click();
  await expect(page.locator("#an-liste button").nth(3)).toHaveAttribute("aria-current", "true");
});
