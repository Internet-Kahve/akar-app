import { expect, test, type Page } from "@playwright/test";
import { createSeed } from "../packages/api-client/src/seed";
import { triangleGlb } from "./support/triangle-glb";

/**
 * Hints in a row (3 Nov 2026): at most two on one visit to a screen, the rest on the next visit, and the hint that
 * answers the visitor's own step waits for that step. A device that has seen nothing but the photo-or-3D question.
 */
test.use({ storageState: { cookies: [], origins: [] } });

/** The site's page with a model and one part card; with `parts: false`, a model without any. */
async function open(page: Page, parts = true) {
  const snapshot = createSeed();
  const site = snapshot.sites[0]!;
  site.model = { src: "/hint-model.glb", name: "Model", bytes: 0, parts: ["Roof"], trust: "representative" };
  site.partCards = parts
    ? [{ id: "roof-card", title: "Örtü", body: "Örtünün açıklaması.", parts: ["Roof"], photos: [], trust: "verified" }]
    : [];
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort());
  await page.route("**/hint-model.glb", (route) => route.fulfill({ contentType: "model/gltf-binary", body: triangleGlb("Roof") }));
  await page.addInitScript((data) => {
    localStorage.setItem("akar.karsilama", "1");
    localStorage.setItem("akar.gorunum", "model");
    localStorage.setItem("akar-demo-bursa-v1", JSON.stringify(data));
  }, snapshot);
  await page.goto(`/#view=detail&site=${site.id}`);
  await expect(page.locator(".model-canvas canvas")).toBeVisible({ timeout: 15000 });
}

const tip = (page: Page) => page.locator(".coach-tip");
const close = async (page: Page) => {
  await page.waitForTimeout(800);
  await tip(page).getByRole("button", { name: "Kapat" }).click();
};

test("two hints on a visit, the others on the next one", async ({ page, isMobile }) => {
  test.skip(isMobile, "the wide screen's row of four");
  await open(page);
  await expect(tip(page)).toContainText("Hikâyeyi buradan başlat", { timeout: 15000 });
  await close(page);
  await expect(tip(page)).toContainText("Fotoğraf ya da 3D");
  await close(page);
  await page.waitForTimeout(1500);
  await expect(tip(page)).toHaveCount(0);
  await page.reload();
  await expect(tip(page)).toContainText("Buna tıkla, parçaları gör", { timeout: 15000 });
});

test("«now tap a part» waits until the parts are lit", async ({ page, isMobile }) => {
  test.skip(!isMobile, "the phone's row");
  await page.addInitScript(() => localStorage.setItem("akar.ipucu.detay", "1"));
  await open(page);
  await expect(tip(page)).toContainText("Buna dokun, parçaları gör", { timeout: 15000 });
  // Put away without pressing: nothing tells to tap a part that is not lit.
  await close(page);
  await page.waitForTimeout(1500);
  await expect(tip(page)).toHaveCount(0);
  // The visitor presses it later on their own: now it comes.
  await page.locator(".detail-scene .model-show-parts").click();
  await expect(tip(page)).toContainText("Şimdi bir parçaya dokun");
});

test("a hint whose button this site does not have never shows", async ({ page, isMobile }) => {
  test.skip(!isMobile, "the phone's row");
  await page.addInitScript(() => localStorage.setItem("akar.ipucu.detay", "1"));
  await open(page, false);
  let seen = false;
  const end = Date.now() + 2500;
  while (Date.now() < end) {
    if (await tip(page).count()) seen = true;
    await page.waitForTimeout(100);
  }
  expect(seen).toBe(false);
});
