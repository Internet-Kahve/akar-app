import { expect, test, type Page } from "@playwright/test";
import { createSeed } from "../packages/api-client/src/seed";
import { triangleGlb } from "./support/triangle-glb";

/**
 * Hints in a row (3 Nov 2026): at most two on one visit to a screen, the rest on the next visit, and the hint that
 * answers the visitor's own step waits for that step. A device that has seen nothing but the photo-or-3D question.
 */
test.use({ storageState: { cookies: [], origins: [] } });

/** The site's page with a model and one part card; with `parts: false`, a model without any. */
async function open(page: Page, parts = true, modelServed?: Promise<void>) {
  const snapshot = createSeed();
  const site = snapshot.sites[0]!;
  site.model = { src: "/hint-model.glb", name: "Model", bytes: 0, parts: ["Roof"], trust: "representative" };
  site.partCards = parts
    ? [{ id: "roof-card", title: "Örtü", body: "Örtünün açıklaması.", parts: ["Roof"], photos: [], trust: "verified" }]
    : [];
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort());
  await page.route("**/hint-model.glb", async (route) => {
    await modelServed;
    await route.fulfill({ contentType: "model/gltf-binary", body: triangleGlb("Roof") });
  });
  await page.addInitScript((data) => {
    localStorage.setItem("akar.karsilama", "1");
    localStorage.setItem("akar.gorunum", "model");
    localStorage.setItem("akar-demo-bursa-v1", JSON.stringify(data));
  }, snapshot);
  await page.goto(`/#view=detail&site=${site.id}`);
  await expect(page.locator(".model-canvas canvas")).toBeVisible({ timeout: 15000 });
}

const seen = (page: Page, ...ids: string[]) =>
  page.addInitScript((list) => list.forEach((id) => localStorage.setItem(`akar.ipucu.${id}`, "1")), ids);
/** No hint in this long, watched all along: one that flashes for a moment is caught too. */
async function noTip(page: Page, ms = 2500) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    await expect(tip(page)).toHaveCount(0);
    await page.waitForTimeout(100);
  }
}
const tip = (page: Page) => page.locator(".coach-tip");
const close = async (page: Page) => {
  await page.waitForTimeout(800);
  await tip(page).getByRole("button", { name: "Kapat" }).click();
};

test("one hint on a visit, the next on the next visit", async ({ page, isMobile }) => {
  test.skip(isMobile, "the wide screen's row");
  await open(page);
  await expect(tip(page)).toContainText("Hikâyeyi buradan başlat", { timeout: 15000 });
  await close(page);
  await noTip(page, 1500);
  await page.reload();
  await expect(tip(page)).toContainText("Fotoğraf ya da 3D", { timeout: 15000 });
});

test("«now tap a part» waits until the parts are lit", async ({ page, isMobile }) => {
  test.skip(!isMobile, "the phone's row");
  await seen(page, "d.foto");
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
  await seen(page, "detay", "d.foto");
  await open(page, false);
  await noTip(page);
});

test("a story seen through: no hint over the card, none offering the story again, and then the next thing", async ({ page, isMobile }) => {
  await seen(page, "hikaye", "cevir", "yakinlas", "masa.hikaye", "masa.cevir", "detay");
  await open(page);
  await page.getByRole("button", { name: /^Hikâyeyi başlat$/ }).filter({ visible: true }).first().click({ force: true });
  await expect(page.locator(".story-panel")).toBeVisible();
  for (let i = 0; i < 8; i++) await page.getByRole("button", { name: "Sonraki bölüm", exact: true }).dispatchEvent("click");
  await page.getByRole("button", { name: "Hikâyeyi tamamla" }).dispatchEvent("click");
  const finished = page.getByRole("dialog");
  await expect(finished).toContainText("Hikâye tamamlandı");
  // The card is what this moment is about.
  await noTip(page);
  await finished.getByRole("button", { name: "Devam et" }).click();
  await expect(tip(page)).toContainText(isMobile ? "Fotoğraf ya da 3D" : "Fotoğraf ya da 3D", { timeout: 15000 });
  await expect(tip(page)).not.toContainText("Hikâye");
  if (!isMobile) await expect(page.locator(".coach-tip", { hasText: "Hikâyeyi buradan başlat" })).toHaveCount(0);
});

test("what is said about the model waits for the model", async ({ page }) => {
  await seen(page, "d.foto", "masa.detay", "masa.foto");
  let serve = () => {};
  const served = new Promise<void>((resolve) => (serve = resolve));
  const opened = open(page, true, served);
  await page.waitForTimeout(3000);
  await noTip(page, 2500);
  serve();
  await opened;
  await expect(tip(page)).toContainText("parçaları gör", { timeout: 15000 });
});

test("what the visitor did on their own is not taught afterwards", async ({ page, isMobile }) => {
  test.skip(isMobile, "the wide screen's row");
  await seen(page, "masa.detay", "masa.foto");
  await open(page);
  // Before its hint has come in, the visitor presses the parts button.
  await page.locator(".detail-scene .model-show-parts").click();
  expect(await page.evaluate(() => localStorage.getItem("akar.ipucu.masa.parca"))).toBe("1");
  await expect(tip(page)).toContainText("Şimdi bir parçaya tıkla", { timeout: 15000 });
  await close(page);
  await page.reload();
  await expect(page.locator(".model-canvas[data-drawn]")).toHaveCount(1, { timeout: 15000 });
  await noTip(page, 5000);
});

test("nothing tells the phone's visitor to go back before they have done anything", async ({ page, isMobile }) => {
  test.skip(!isMobile, "the phone's row");
  await seen(page, "d.foto");
  await open(page);
  await expect(tip(page)).toContainText("parçaları gör", { timeout: 15000 });
  await expect(page.locator(".coach-tip", { hasText: "Aşağı kaydır" })).toHaveCount(0);
});

test("the wide screen never tells to take today's photograph", async ({ page, isMobile }) => {
  test.skip(isMobile, "the phone has the camera");
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort());
  await page.addInitScript(() => localStorage.setItem("akar.karsilama", "1"));
  await page.goto("/#view=history&site=ulu-cami");
  const end = Date.now() + 7000;
  while (Date.now() < end) {
    await expect(page.locator(".coach-tip", { hasText: "bugününü" })).toHaveCount(0);
    await page.waitForTimeout(100);
    const shown = tip(page).getByRole("button", { name: "Kapat" });
    if (await shown.count()) await shown.click({ timeout: 1000 }).catch(() => {});
  }
});

test("putting away the story's hint never skips a sentence", async ({ page, isMobile }) => {
  test.skip(isMobile, "the wide screen's › button is under the hint");
  await seen(page, "masa.detay", "masa.foto", "masa.parca", "masa.cevir");
  await open(page);
  await page.getByRole("button", { name: /^Hikâyeyi başlat$/ }).filter({ visible: true }).first().click();
  await expect(tip(page)).toContainText("ile ilerle", { timeout: 15000 });
  const before = await page.locator(".story-panel").innerText();
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Sonraki bölüm", exact: true }).first().click();
  await expect(tip(page)).toHaveCount(0);
  await page.waitForTimeout(300);
  expect(await page.locator(".story-panel").innerText()).toBe(before);
});
