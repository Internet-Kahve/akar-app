import { expect, test } from "@playwright/test";

test("the intro page's footer ends with the KVKK notice and the licences, which open over the map as the app's own texts", async ({ page }) => {
  await page.goto("/tanitim");
  const footer = page.locator("footer");
  await expect(footer).toContainText("Vakıf Katılım");
  await expect(footer).toContainText("OpenStreetMap");
  const kvkk = footer.getByRole("link", { name: "KVKK aydınlatma metni" });
  await expect(kvkk).toBeVisible();
  // The legal links are the last thing on the page.
  expect(await footer.locator(".yasal").evaluate((nav) => nav === nav.parentElement!.lastElementChild)).toBe(true);
  expect((await kvkk.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await kvkk.click();
  const notice = page.getByRole("dialog", { name: "Kişisel verilerin korunması aydınlatma metni" });
  await expect(notice).toBeVisible();
  await notice.getByRole("button", { name: "Pencereyi kapat" }).click();
  await expect(notice).toHaveCount(0);
  await expect(page).not.toHaveURL(/belge=/);

  await page.goto("/#view=map&belge=lisanslar");
  await expect(page.getByRole("dialog", { name: "Lisanslar ve kaynaklar" })).toBeVisible();
  await expect(page).toHaveURL(/#view=map&belge=lisanslar$/);
});

test("the footer reads in English when the page is in English", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("akar.dil", "en"));
  await page.goto("/tanitim");
  const footer = page.locator("footer");
  await expect(footer.getByRole("link", { name: "Privacy notice (KVKK)" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Licences and sources" })).toBeVisible();
  await expect(footer).toContainText("İnternet Kahve team");
});
