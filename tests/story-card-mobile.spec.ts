import { expect, test } from "@playwright/test";

/**
 * The story on a phone (Muhammed, 3 Nov 2026): one sentence on a small card. A tap on its right goes on, on its left
 * third goes back; one sound button; ▾ folds the card; the scene ends above it.
 */
test.skip(({ isMobile }) => !isMobile, "the one-sentence card is the phone's");

test.beforeEach(async ({ page }) => {
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort());
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#view=detail&site=ulu-cami");
  await page.getByRole("button", { name: /^(Oku|Hikâyeyi başlat|Hikâyeyi yeniden izle)$/ }).filter({ visible: true }).first().click();
  await expect(page.locator(".story-panel.kart")).toBeVisible();
});

test("taps on the photograph's right and left move through the sentences", async ({ page }) => {
  const count = page.locator(".story-count");
  await expect(count).toHaveText(/^1 \//);
  // As an Instagram story: a tap on the picture, not on the card (3 Nov 2026).
  const tapAt = async (share: number) => {
    const stage = (await page.locator(".main-stage").boundingBox())!;
    await page.mouse.click(stage.x + stage.width * share, stage.y + stage.height * 0.55);
  };
  await tapAt(0.85);
  await expect(count).toHaveText(/^2 \//);
  await tapAt(0.85);
  await expect(count).toHaveText(/^3 \//);
  await tapAt(0.1);
  await expect(count).toHaveText(/^2 \//);
});

test("the card has one round sound button and no transport, rate, modes or Oku", async ({ page }) => {
  const card = page.locator(".story-panel.kart");
  await expect(card.getByRole("button", { name: /Sesi aç/ })).toBeVisible();
  await expect(card.locator(".story-transport, .story-rate, .story-mode-link, .story-mode")).toHaveCount(0);
  await expect(card).not.toContainText("Doğrulanmış");
});

test("☰ opens all the sentences: one picked is told, the list gives way to the card", async ({ page }) => {
  await page.getByRole("button", { name: "Cümle listesini aç" }).click();
  const list = page.locator(".story-panel.liste");
  await expect(list).toBeVisible();
  await expect(list.locator(".story-mode, .story-transport, .story-rate")).toHaveCount(0);
  await list.locator(".story-list li").nth(3).getByRole("button").click();
  await expect(page.locator(".story-panel.kart .story-count")).toHaveText(/^4 \//);
});

test("▾ folds the card and the scene grows; ▴ brings it back", async ({ page }) => {
  const stage = page.locator(".main-stage");
  const before = (await stage.boundingBox())!.height;
  await page.getByRole("button", { name: "Kartı gizle" }).click();
  await expect(page.locator(".story-card-body")).toHaveCount(0);
  await expect.poll(async () => (await stage.boundingBox())!.height).toBeGreaterThan(before + 40);
  // The scene ends above the card: nothing of the model hides behind it.
  const card = (await page.locator(".story-panel.kart").boundingBox())!;
  expect((await stage.boundingBox())!.y + (await stage.boundingBox())!.height).toBeLessThanOrEqual(card.y + 1);
  await page.getByRole("button", { name: "Kartı aç" }).click();
  await expect(page.locator(".story-card-body")).toBeVisible();
});
