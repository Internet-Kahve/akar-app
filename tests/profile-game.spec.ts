import { expect, test, type Page } from "@playwright/test";
import { createSeed } from "../packages/api-client/src/seed";

async function openProfile(page: Page, extra: Record<string, string> = {}) {
  const snapshot = createSeed();
  const published = snapshot.sites.filter((s) => s.status === "published");
  snapshot.readIds = published.map((s) => s.id);
  snapshot.points = 130;
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(
    ([data, extra]) => {
      if (!localStorage.getItem("akar-demo-bursa-v1")) localStorage.setItem("akar-demo-bursa-v1", JSON.stringify(data));
      for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, v);
    },
    [
      { ...snapshot, siteProgress: { tasks: [], badges: [{ badgeId: "ulu-hikaye", siteId: "ulu-cami", onSite: false, earnedAt: "2026-11-01T09:00:00Z" }] } },
      extra,
    ] as const,
  );
  await page.goto("/#view=profile");
  return published;
}
const noTips = {
  "akar.ipucu.profil.avatar": "1",
  "akar.ipucu.masa.profil.avatar": "1",
  "akar.ipucu.profil.ad": "1",
  "akar.ipucu.masa.profil.ad": "1",
};

test("the level and its bar come from the score; the name is edited with the pencil, checked, and kept", async ({ page }) => {
  await openProfile(page, noTips);
  await expect(page.locator(".level-head")).toContainText("Gezgin");
  await expect(page.locator(".level-head")).toContainText("130 puan");
  await expect(page.getByRole("progressbar", { name: "Seviye ilerlemesi" })).toHaveAttribute("aria-valuetext", "Sonraki seviyeye 70 puan");

  await page.getByRole("button", { name: "Adını değiştir" }).click();
  const field = page.getByRole("textbox", { name: "Görünen ad" });
  await field.fill("A");
  await page.getByRole("button", { name: "Adı kaydet" }).click();
  await expect(page.locator("#profile-name-help")).toHaveText("Ad en az 2 karakter olmalı.");
  await field.fill("x".repeat(25));
  await page.getByRole("button", { name: "Adı kaydet" }).click();
  await expect(page.locator("#profile-name-help")).toHaveText("Ad en fazla 24 karakter olabilir.");
  await field.fill("Akar Ekibi");
  await page.getByRole("button", { name: "Adı kaydet" }).click();
  await expect(page.locator("#profile-name-help")).toContainText("ekibe ayrıldı");
  await field.fill("   Seyyah   Ayşe  ");
  await page.getByRole("button", { name: "Adı kaydet" }).click();
  await expect(page.locator(".profile-name h2")).toHaveText("Seyyah Ayşe");
  await page.reload();
  await expect(page.locator(".profile-name h2")).toHaveText("Seyyah Ayşe");
  // Every control here is at least 44 px to the touch.
  const edit = await page.getByRole("button", { name: "Adını değiştir" }).boundingBox();
  expect(Math.min(edit!.width, edit!.height)).toBeGreaterThanOrEqual(44);
});

test("badges and discovered sites are rows of cards; «Tümünü gör» opens the collection with progress and filters, and all the sites", async ({ page }) => {
  const published = await openProfile(page, noTips);
  const discovered = page.locator(".profile-discovered");
  await expect(discovered.locator(".discovered-card")).toHaveCount(Math.min(5, published.length));
  if (published.length > 5) {
    await discovered.getByRole("button", { name: "Tümünü gör" }).click();
    const all = page.getByRole("dialog", { name: "Keşfettiklerim" });
    await expect(all.locator(".discovered-card")).toHaveCount(published.length);
    await all.getByRole("button", { name: "Pencereyi kapat" }).click();
  }

  await page.locator(".profile-badges").getByRole("button", { name: "Tümünü gör" }).click();
  const collection = page.getByRole("dialog", { name: "Rozet koleksiyonu" });
  await expect(collection.locator(".collection-progress")).toContainText("1/3 rozet");
  await expect(collection.locator(".medal-tile")).toHaveCount(3);
  await collection.getByRole("button", { name: "Bronz" }).click();
  await expect(collection.locator(".medal-tile")).toHaveCount(1);
  await collection.getByRole("button", { name: "Kazanılmadı" }).click();
  await expect(collection.locator(".medal-tile")).toHaveCount(2);
  await collection.getByRole("button", { name: "Altın" }).click();
  await expect(collection).toContainText("Bu süzgeçte rozet yok.");
  await collection.getByRole("button", { name: "Tümü" }).click();
  await collection.getByLabel("Esere göre").selectOption({ label: "Ulucami" });
  await expect(collection.locator(".medal-tile")).toHaveCount(3);
  // A badge opens its card above the collection.
  await collection.getByRole("button", { name: /Kündekâri/ }).click();
  await expect(page.getByRole("dialog", { name: "Kündekâri" })).toContainText("Nasıl kazanılır");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("first visit: after the figure, the next visit's hint points at the pencil", async ({ page }) => {
  await openProfile(page, { "akar.ipucu.profil.avatar": "1", "akar.ipucu.masa.profil.avatar": "1" });
  await expect(page.getByText("Kalemle adını değiştir")).toBeVisible({ timeout: 10_000 });
});
