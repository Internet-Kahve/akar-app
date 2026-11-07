import { expect, test } from "@playwright/test";

/** A camera the editor placed is saved at once. That the story leaves it where it is: `looksForFreeView`. */
test("the panel's angle, zoom and highlight are saved at once", async ({ page, isMobile }) => {
  test.skip(isMobile, "the content studio is a wide-screen tool");
  await page.route("https://tiles.openfreemap.org/**", (r) => r.abort());
  await page.goto("/#view=admin");
  await page.getByRole("button", { name: "Ulucami düzenle" }).click();
  await page.getByRole("button", { name: /Hikâye/ }).first().click();
  const save = page.getByRole("button", { name: /Açıyı, yakınlaştırmayı ve vurguyu kaydet/ });
  await expect(save).toBeVisible();
  // The model may still be loading: the panel says so rather than saving nothing.
  await expect(async () => {
    await save.click();
    await expect(page.getByText(/kaydedildi:.*yakınlaştırma \d+,\d×/)).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 30000 });
  // Written straight away: nothing waits behind the general save, and it can be taken back.
  await expect(page.getByRole("button", { name: /Geri al/ })).toBeVisible();
});
