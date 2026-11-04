import { expect, test } from "@playwright/test";
import { openGallery } from "./helpers/photo-gallery";

/** Two fingers zoom the photograph in the viewer, not the page (Muhammed, 3 Nov 2026). */
test.skip(({ isMobile }) => !isMobile, "pinching is the phone's");
test.use({ hasTouch: true });

test("a pinch zooms the photograph; the page keeps its scale", async ({ page, context }) => {
  await openGallery(page, true);
  await page.locator(".galeri-f").first().click();
  const photo = page.locator(".about-lightbox .zoom-photo");
  await expect(photo).toBeVisible();
  const box = (await photo.boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const cdp = await context.newCDPSession(page);
  const touch = (type: string, points: [number, number][]) =>
    cdp.send("Input.dispatchTouchEvent", { type, touchPoints: points.map(([x, y], id) => ({ x, y, id })) } as never);
  await touch("touchStart", [[cx - 30, cy], [cx + 30, cy]]);
  for (let i = 1; i <= 8; i++) await touch("touchMove", [[cx - 30 - i * 10, cy], [cx + 30 + i * 10, cy]]);
  await touch("touchEnd", []);
  await expect.poll(() => photo.evaluate((e) => /scale\(([\d.]+)\)/.exec(e.style.transform)?.[1] ?? "1").then(Number)).toBeGreaterThan(2);
  expect(await page.evaluate(() => window.visualViewport?.scale ?? 1)).toBe(1);
});
