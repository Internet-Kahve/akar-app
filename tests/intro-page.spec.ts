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
});
