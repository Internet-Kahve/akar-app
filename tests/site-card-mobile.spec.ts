import { expect, test, type Page } from "@playwright/test";

/**
 * The phone's site card (prototype `#eser-alt`; Muhammed's `mobile/` screenshots, 1 Nov 2026): a floating card that
 * opens closed, rises to all its content when its handle is tapped or dragged, and carries «3D model · Temsili» and
 * «İçini göster» along its top edge.
 */
test.skip(({ isMobile }) => !isMobile, "the floating card is the phone's");

const card = (page: Page) => page.locator(".workspace.on-site .side-panel");
const grip = (page: Page) => page.getByRole("button", { name: /Eser bilgisini (aç|kapat)/ });
const box = async (page: Page, selector: string) => (await page.locator(selector).first().boundingBox())!;

test.beforeEach(async ({ page }) => {
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort());
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#view=detail&site=ulu-cami");
  await expect(grip(page)).toBeVisible();
});

test("the card lies closed along the screen's foot, the name and «Hikâyeyi başlat»", async ({ page }) => {
  const c = await box(page, ".workspace.on-site .side-panel");
  const viewport = page.viewportSize()!;
  // The screen's width, on its foot (3 Nov 2026).
  expect(Math.round(c.x)).toBe(0);
  expect(Math.round(c.width)).toBe(viewport.width);
  expect(Math.round(viewport.height - c.y - c.height)).toBe(0);
  await expect(grip(page)).toHaveAttribute("aria-expanded", "false");
  await expect(card(page).getByRole("heading", { name: "Ulucami" })).toBeInViewport();
  const start = await box(page, ".detail-panel .hikaye-basla");
  expect(start.y + start.height).toBeLessThan(c.y + c.height);
  // One way into the story; nothing fades below it.
  await expect(page.locator(".detail-panel .ikili")).toBeHidden();
  await expect(card(page).getByRole("button", { name: /Geçmişi Gör/ })).not.toBeInViewport();
});

test("the handle opens the card all the way and closes it, by tap and by keyboard", async ({ page }) => {
  const closed = (await box(page, ".workspace.on-site .side-panel")).height;
  await grip(page).click();
  await expect(grip(page)).toHaveAttribute("aria-expanded", "true");
  const open = (await box(page, ".workspace.on-site .side-panel")).height;
  expect(open).toBeGreaterThan(closed + 200);
  expect(open).toBeLessThanOrEqual(page.viewportSize()!.height * 0.75 + 1);
  await expect(card(page).getByRole("button", { name: /Geçmişi Gör/ })).toBeInViewport();
  await grip(page).click();
  await expect(grip(page)).toHaveAttribute("aria-expanded", "false");
  await grip(page).focus();
  await page.keyboard.press("Enter");
  await expect(grip(page)).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Space");
  await expect(grip(page)).toHaveAttribute("aria-expanded", "false");
});

test("dragging the handle leaves the card where it is let go", async ({ page }) => {
  const g = await box(page, ".card-grip");
  const before = (await box(page, ".workspace.on-site .side-panel")).height;
  await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2 - i * 20);
  await page.mouse.up();
  const after = (await box(page, ".workspace.on-site .side-panel")).height;
  expect(after).toBeGreaterThan(before + 150);
  expect(after).toBeLessThan(before + 250);
});

test("«3D model · Temsili» and «İçini göster» ride on the card's top edge", async ({ page }) => {
  const label = page.locator(".detail-scene .model-label");
  await expect(label).toBeVisible();
  const gap = async () => (await box(page, ".workspace.on-site .side-panel")).y - ((await label.boundingBox())!.y + (await label.boundingBox())!.height);
  const closedGap = await gap();
  expect(closedGap).toBeGreaterThanOrEqual(6);
  expect(closedGap).toBeLessThanOrEqual(14);
  const closedTop = (await label.boundingBox())!.y;
  await grip(page).click();
  await expect(grip(page)).toHaveAttribute("aria-expanded", "true");
  // It moved up with the card and kept its distance.
  expect((await label.boundingBox())!.y).toBeLessThan(closedTop - 200);
  expect(Math.abs((await gap()) - closedGap)).toBeLessThanOrEqual(2);
});

test("scrolling the closed card's content raises it a little, enough to scroll, not all the way", async ({ page }) => {
  const c = await box(page, ".workspace.on-site .side-panel");
  await page.mouse.move(c.x + c.width / 2, c.y + c.height - 30);
  await page.mouse.wheel(0, 120);
  await expect(grip(page)).toHaveAttribute("aria-expanded", "true");
  await expect.poll(async () => (await box(page, ".workspace.on-site .side-panel")).height).toBeGreaterThan(c.height + 120);
  const risen = (await box(page, ".workspace.on-site .side-panel")).height;
  expect(risen).toBeLessThan(c.height + 180);
  // From there the content scrolls inside the card.
  await page.mouse.wheel(0, 300);
  await expect.poll(() => page.evaluate(() => document.querySelector(".workspace.on-site .side-panel")!.scrollTop)).toBeGreaterThan(0);
});

test("the content fades out at the card's foot, also once the page has settled", async ({ page }) => {
  await page.waitForTimeout(1500);
  const { g, edge } = await page.evaluate(() => {
    const panel = document.querySelector<HTMLElement>(".workspace.on-site .side-panel")!;
    const body = panel.querySelector<HTMLElement>(".detail-panel")!;
    const padding = parseFloat(getComputedStyle(panel).paddingBottom) || 0;
    return { g: parseFloat(body.style.getPropertyValue("--g")), edge: panel.clientHeight + panel.scrollTop - body.offsetTop - padding };
  });
  expect(Math.abs(g - edge)).toBeLessThanOrEqual(2);
});
