import { test, expect } from "@playwright/test";

test.use({ locale: "en-US" });

test("an English browser gets the English site, Turkish-only content is marked, and the choice stays on the device", async ({
  page,
}) => {
  await page.goto("/#view=detail&site=koza-han");
  await expect(page.locator(".opening")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  const search = page.locator(".global-search input");
  await expect(search).toHaveAttribute("placeholder", "Search sites, cities or routes");
  // The demo catalog has no English site names: the Turkish name shows with its tag.
  const heading = page.getByRole("heading", { name: /Koza Hanı/, level: 1 });
  await expect(heading).toBeVisible();
  await expect(heading.locator(".lang-fallback")).toHaveText("Turkish");

  // A phone hides the top bar on a site's page: the switch is used on the map.
  await page.evaluate(() => {
    location.hash = "view=map";
  });
  await page.getByRole("group", { name: "Dil / Language" }).getByRole("button", { name: "TR" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "tr");
  await expect(search).toHaveAttribute("placeholder", "Eser, şehir veya rota ara");
  await page.evaluate(() => {
    location.hash = "view=detail&site=koza-han";
  });
  await expect(heading).toBeVisible();
  await expect(heading.locator(".lang-fallback")).toHaveCount(0);

  await page.reload();
  await expect(page.locator(".opening")).toHaveCount(0);
  await expect(search).toHaveAttribute("placeholder", "Eser, şehir veya rota ara");
});
