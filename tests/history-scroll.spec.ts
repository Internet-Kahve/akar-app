import { expect, test } from "@playwright/test";
import { createSeed } from "../packages/api-client/src/seed";

/**
 * «Aşağı kaydırdım, yukarı çıkılmıyor; aşağı inince atıyor» (Muhammed, 4 Nov 2026). On a phone a finger going up or down
 * always moves the page, on the photograph too, and the page keeps its length as the photograph gets smaller.
 */
test("one finger scrolls the See the Past page both ways, from the photograph too, without a jump", async ({ page, context, isMobile }) => {
  test.skip(!isMobile, "the phone's page");
  const snapshot = createSeed();
  const site = snapshot.sites[0]!;
  const photo = (n: number) => ({ id: `eski-${n}`, src: "/history-old.svg", alt: "Eski", title: "Eski", titleEn: "", description: "", sourceId: "", license: "Proje için verildi", trust: "verified" as const });
  site.historyImages = [1, 2, 3].map((n) => ({ id: `h-${n}`, photo: photo(n), caption: "Eski görünüm", dateLabel: "1900", sourceId: "", trust: "verified" as const }));
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort());
  await page.route("**/history-old.svg", (route) =>
    route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#987"/></svg>' }),
  );
  await page.addInitScript((data) => {
    localStorage.setItem("akar.karsilama", "1");
    localStorage.setItem("akar-demo-bursa-v1", JSON.stringify(data));
    for (const id of ["foto", "kiyas", "bugun", "serit", "nereden"]) localStorage.setItem(`akar.ipucu.g.${id}`, "1");
  }, snapshot);
  await page.goto(`/#view=history&site=${site.id}`);
  const box = page.locator(".gg-kaydir");
  await expect(page.locator(".gg-foto")).toBeVisible({ timeout: 15000 });
  const cdp = await context.newCDPSession(page);
  const swipe = async (x: number, from: number, to: number) => {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: from }] });
    for (let i = 1; i <= 12; i++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: from + ((to - from) * i) / 12 }] });
      await page.waitForTimeout(16);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForTimeout(400);
  };
  const measure = () => box.evaluate((el) => ({ top: el.scrollTop, height: el.scrollHeight }));
  const start = await measure();
  await swipe(195, 700, 400);
  const down = await measure();
  expect(down.top).toBeGreaterThan(100);
  // The page's length does not change as the photograph gets smaller.
  expect(Math.abs(down.height - start.height)).toBeLessThan(2);
  const frame = await page.locator(".gg-foto").boundingBox();
  await swipe(195, frame!.y + 30, frame!.y + frame!.height - 10);
  expect((await measure()).top).toBeLessThan(down.top);
});
