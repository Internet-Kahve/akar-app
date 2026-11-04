import { expect, test } from "@playwright/test";

/** The list's › goes straight to the site's page (Muhammed, 4 Nov 2026); routes are added from the site's card. */
test("the list's › opens the site's page", async ({ page, isMobile }) => {
  test.skip(isMobile, "the list is the wide screen's");
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort());
  await page.goto("/#view=map");
  await expect(page.locator(".opening")).toHaveCount(0, { timeout: 12000 });
  await page.getByRole("button", { name: "Ulucami eserini aç" }).click();
  await expect(page.getByRole("heading", { name: "Ulucami", level: 1 })).toBeVisible();
  await expect(page).toHaveURL(/view=detail/);
});
