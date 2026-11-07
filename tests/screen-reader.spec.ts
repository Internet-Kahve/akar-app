import { expect, test } from "@playwright/test";

const polite = '[data-live="polite"]';

test("one polite and one assertive region are in the page from the start", async ({ page }) => {
  await page.goto("/#view=map");
  await expect(page.locator(polite)).toHaveCount(1);
  await expect(page.locator('[data-live="assertive"]')).toHaveCount(1);
  await expect(page.locator(polite)).toHaveAttribute("aria-live", "polite");
});

test("a display change in the menu is spoken once and focus returns with Esc", async ({ page, isMobile }) => {
  test.skip(isMobile, "the menu is checked on a wide screen");
  await page.goto("/#view=map");
  const open = page.getByRole("button", { name: "Görünüm ve erişilebilirlik" });
  await open.click();
  await expect(page.getByLabel("Yüksek kontrast")).toBeFocused();
  await page.getByLabel("Hareketi azalt").check();
  await expect(page.locator(polite)).toHaveText("Hareket azaltıldı.");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  // The visible toast has no live role of its own: nothing is read twice.
  await expect(page.locator(".toast[role]")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(open).toBeFocused();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
});

test("the keyboard reaches the site list from the map", async ({ page, isMobile }) => {
  test.skip(isMobile, "the phone's list lives in its sheet");
  await page.goto("/#view=map");
  // The shell is inert while the opening screen is up.
  await page.locator(".site-row").first().waitFor();
  const link = page.getByRole("link", { name: "Eserleri liste olarak gör" });
  await expect(link).toBeEnabled();
  await expect(async () => {
    await link.focus();
    await expect(link).toBeFocused({ timeout: 500 });
  }).toPass();
  await expect(link).toBeInViewport();
  await page.screenshot({ path: "test-results/a11y-map-list-link.png" });
  await link.press("Enter");
  await expect(page.locator("#site-list")).toBeFocused();
  await expect(page).toHaveURL(/#view=map$/);
});
