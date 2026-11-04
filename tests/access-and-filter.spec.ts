import { expect, test } from "@playwright/test";

test("display settings hold after a reload", async ({ page, isMobile }) => {
  test.skip(isMobile, "the same controls on both; the menu is checked on a wide screen");
  await page.goto("/#view=map");
  await page.getByRole("button", { name: "Görünüm ve erişilebilirlik" }).click();
  await page.getByLabel("Yüksek kontrast").check();
  await page.getByRole("button", { name: "Büyük", exact: true }).click();
  await page.reload();
  const root = page.locator("html");
  await expect(root).toHaveAttribute("data-contrast", "high");
  await expect(root).toHaveAttribute("data-text-size", "large");
});

test("the list narrows to a kind of site and back", async ({ page, isMobile }) => {
  test.skip(isMobile, "the phone's list opens from its sheet");
  await page.goto("/#view=map");
  const rows = page.locator(".site-row");
  const filter = page.locator(".kind-filter");
  if (!(await filter.isVisible().catch(() => false))) test.skip(true, "the seed's city has one kind");
  const before = await rows.count();
  const second = filter.getByRole("button").nth(1);
  await second.click();
  await expect(second).toHaveAttribute("aria-pressed", "true");
  expect(await rows.count()).toBeLessThan(before);
  await second.click();
  await expect(rows).toHaveCount(before);
});
