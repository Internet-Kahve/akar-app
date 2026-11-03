import { expect, test } from "@playwright/test";

/** Rotam is built in the side panel (on a phone, in its sheet), not in a bar over the map (Muhammed, 2 Nov 2026). */
test("Rotam opens in the panel with the site as its first stop, and closes back to the list", async ({ page }) => {
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort());
  await page.goto("/#view=map");
  await expect(page.locator(".opening")).toHaveCount(0, { timeout: 12000 });
  await page.getByRole("textbox", { name: "Eser, şehir veya rota ara" }).fill("Ulucami");
  await page.locator(".site-row-main").filter({ hasText: "Ulucami" }).click();
  await expect(page.locator(".site-peek h3")).toHaveText("Ulucami");
  await page.locator(".site-peek").getByRole("button", { name: "Rotama ekle" }).click();

  const builder = page.locator(".side-panel").getByRole("region", { name: "Rota oluştur" });
  await expect(builder).toBeVisible();
  await expect(builder.getByRole("heading")).toBeVisible();
  // The panel shows the route instead of the list: one numbered stop with its estimate.
  await expect(page.locator(".side-panel .site-row")).toHaveCount(0);
  await expect(builder.locator(".rb-stops li")).toHaveCount(1);
  await expect(builder.locator(".rb-stops li")).toContainText("Ulucami");
  await expect(builder.locator(".rb-summary")).toContainText("1 durak");
  await expect(builder.getByRole("button", { name: "Kaydet" })).toBeInViewport();
  // A stop leaves the list; the empty state shows how to add one.
  await builder.getByRole("button", { name: "Rotadan çıkar" }).click();
  await expect(builder.locator(".rb-stops li")).toHaveCount(0);
  // A finger tapping a pin's «+» (3 Nov 2026); nothing to save yet.
  await expect(builder.locator(".rb-coach")).toContainText("«+» rozetine dokun");
  await expect(builder.getByRole("button", { name: "Kaydet" })).toBeDisabled();
  // Vazgeç gives the panel back to the list.
  await builder.getByRole("button", { name: "Vazgeç" }).last().click();
  await expect(page.getByRole("region", { name: "Rota oluştur" })).toHaveCount(0);
  await expect(page.locator(".side-panel .site-row").first()).toBeVisible();
});
