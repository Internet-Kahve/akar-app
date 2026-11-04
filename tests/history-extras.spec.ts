import { expect, test, type Page } from "@playwright/test";
import type { HistoryImage, SampleTrace, SitePhoto } from "@akar/domain";
import { createSeed } from "../packages/api-client/src/seed";

const OLD_CREDIT =
  "Fotoğraf: Sébah&Joaillier · Getty Research Institute Digital Collections (96.R.14(A28)) · Foto Atlas aracılığıyla";
const PAIR_CREDIT = "Fotoğraf: Bursa Vakıf Eserleri Envanteri";
const TRACE_CREDIT =
  "Fotoğraf: Bursa Vakıf Eserleri Envanteri (örnek katkı olarak gösteriliyor)";

const photo = (id: string, description: string, license: string): SitePhoto => ({
  id,
  src: `/${id}.svg`,
  alt: `${id} alt metni`,
  title: id,
  titleEn: "",
  description,
  sourceId: "",
  license,
  trust: "verified",
});
const image = (
  id: string,
  dateLabel: string,
  extra: Partial<HistoryImage> = {},
): HistoryImage => ({
  id,
  photo: photo(`old-${id}`, OLD_CREDIT, "CC BY-NC-ND 4.0"),
  caption: `Eski fotoğraf ${id}`,
  dateLabel,
  sourceId: "",
  trust: "verified",
  ...extra,
});

/** Ulucami with three archive photographs: one with the archive's pair, one with only a sample, one with neither. */
async function openHistory(page: Page, longArchive = false, motion = false) {
  // The handle's opening sway would move it under the assertions; it has a test of its own.
  if (!motion) await page.emulateMedia({ reducedMotion: "reduce" });
  const snapshot = createSeed();
  const site = snapshot.sites[0]!;
  site.historyImages = [
    image("a", "1875–84", {
      presentPhoto: photo("now-a", PAIR_CREDIT, "Proje için verildi"),
      presentAngleMatch: "near",
    }),
    image("b", "Tarih bilinmiyor"),
    image("c", "1930"),
  ];
  if (longArchive) {
    site.historyImages.push(...Array.from({ length: 18 }, (_, index) => image(`extra-${index}`, "1930", {
      presentPhoto: photo(`now-extra-${index}`, PAIR_CREDIT, "Proje için verildi"),
      presentAngleMatch: "same",
    })));
  }
  const sample = (id: string, extra: Partial<SampleTrace> = {}): SampleTrace => ({
    id,
    author: "AKAR ekibi",
    text: `Örnek katkı ${id}`,
    photo: photo(`iz-${id}`, TRACE_CREDIT, "Proje için verildi"),
    addedOn: "2026-10-28",
    ...extra,
  });
  site.sampleTraces = [
    sample("1", { historyImageId: "b", angleMatch: "same" }),
    sample("2"),
  ];
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="#49684d"/></svg>';
  await page.route(/\/(old-|now-|iz-)[^/]*\.svg$/, (route) =>
    route.fulfill({ contentType: "image/svg+xml", body: svg }),
  );
  await page.addInitScript(
    (data) => localStorage.setItem("akar-demo-bursa-v1", JSON.stringify(data)),
    snapshot,
  );
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#view=history&site=ulu-cami");
  await expect(
    page.getByRole("heading", { name: "Geçmişi Gör", level: 1 }),
  ).toBeVisible();
  return errors;
}

const fits = (page: Page, selector: string) =>
  expect(page.locator(selector).first()).toHaveCSS("object-fit", "contain");

/** The selected photograph's place in its box (it is fitted whole, so it may leave blurred bands beside it). */
const photoBox = (page: Page) =>
  page.locator(".gg-foto").evaluate((box) => {
    const img = box.querySelector<HTMLImageElement>(".ana")!,
      r = box.getBoundingClientRect(),
      w = Math.min(r.width, (r.height * img.naturalWidth) / img.naturalHeight);
    return { left: r.x, right: r.right, photoLeft: r.x + (r.width - w) / 2, width: w, y: r.y + r.height / 2 };
  });

test("the archive's present-day pair is a slider, both photographs whole, with each credit line and the near-angle note", async ({
  page,
}) => {
  const errors = await openHistory(page);
  const slider = page.getByRole("slider", { name: "Eski ve bugünkü fotoğrafı karşılaştır" });
  await expect(slider).toHaveAttribute("aria-valuenow", "50");
  await expect(slider).toHaveAttribute("aria-valuetext", "Eski %50");
  await expect(page.locator(".gg-k-etiket").first()).toHaveText("1875–84");
  await expect(page.locator(".gg-k-etiket.sag")).toHaveText("Bugün · AKAR arşivi");
  await fits(page, ".gg-foto .b-ana");
  await fits(page, ".gg-foto .ana");
  await expect(page.locator(".gg-meta")).toHaveText("1875–84 · Sébah&Joaillier");
  await expect(page.locator(".gg-kaynak")).toHaveText(
    "Getty Research Institute Digital Collections (96.R.14(A28)) · Foto Atlas aracılığıyla · CC BY-NC-ND · Bugünkü fotoğraf: Bursa Vakıf Eserleri Envanteri",
  );
  await expect(page.locator(".gg-yakin")).toHaveText("Yakın açı: iki fotoğraf birebir aynı noktadan çekilmedi.");

  await slider.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(slider).toHaveAttribute("aria-valuenow", "45");
  await page.keyboard.press("End");
  await expect(slider).toHaveAttribute("aria-valuetext", "Eski %100");
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuenow", "100");
  await page.keyboard.press("Home");
  await expect(slider).toHaveAttribute("aria-valuenow", "0");

  const photo = await photoBox(page);
  await page.mouse.move(photo.photoLeft + photo.width * 0.25, photo.y);
  await page.mouse.down();
  await page.mouse.move(photo.photoLeft + photo.width * 0.75, photo.y, { steps: 4 });
  await page.mouse.up();
  const value = Number(await slider.getAttribute("aria-valuenow"));
  expect(value).toBeGreaterThanOrEqual(74);
  expect(value).toBeLessThanOrEqual(76);
  expect(errors).toEqual([]);
});

test("the handle moves over the photograph only, never over the blurred bands beside it", async ({ page }) => {
  await openHistory(page);
  const slider = page.getByRole("slider");
  const photo = await photoBox(page);
  const handleX = async () => (await page.locator(".gg-k-tutamak").boundingBox())!.x + 1;
  await page.mouse.move(photo.photoLeft + 20, photo.y);
  await page.mouse.down();
  // Past the photograph's edge (into the blurred band, or out of the box where the photograph fills it).
  await page.mouse.move(Math.max(1, photo.left - 10), photo.y, { steps: 4 });
  await page.mouse.up();
  await expect(slider).toHaveAttribute("aria-valuenow", "0");
  expect(Math.abs((await handleX()) - photo.photoLeft)).toBeLessThanOrEqual(1);
  await page.mouse.move(photo.photoLeft + 20, photo.y);
  await page.mouse.down();
  await page.mouse.move(Math.min(page.viewportSize()!.width - 1, photo.right + 10), photo.y, { steps: 4 });
  await page.mouse.up();
  await expect(slider).toHaveAttribute("aria-valuenow", "100");
  expect(Math.abs((await handleX()) - (photo.photoLeft + photo.width))).toBeLessThanOrEqual(1);
});

test("the handle sways once when a paired photograph opens, and not when the visitor asks for less motion", async ({ page }) => {
  await openHistory(page, false, true);
  const slider = page.getByRole("slider");
  const seen = new Set<string>();
  for (let i = 0; i < 20; i++) {
    seen.add((await slider.getAttribute("aria-valuenow"))!);
    await page.waitForTimeout(100);
  }
  expect(seen.size).toBeGreaterThan(2);
  await expect(slider).toHaveAttribute("aria-valuenow", "50");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(slider).toHaveAttribute("aria-valuenow", "50");
  await page.waitForTimeout(1200);
  await expect(slider).toHaveAttribute("aria-valuenow", "50");
});

test("without the archive's pair the newest linked sample stands in as «Örnek katkı»; a photograph with neither has no comparison", async ({
  page,
}) => {
  await openHistory(page);
  await page.locator(".gg-serit button").nth(1).click();
  await expect(page.locator(".gg-k-etiket.sag")).toHaveText("Bugün · AKAR ekibi · Örnek katkı");
  await expect(page.locator(".gg-kaynak")).toContainText(`Bugünkü fotoğraf: ${TRACE_CREDIT.replace("Fotoğraf: ", "")}`);
  await expect(page.locator(".gg-yakin")).toHaveCount(0);

  await page.locator(".gg-serit button").nth(2).click();
  await expect(page.getByRole("slider")).toHaveCount(0);
  await fits(page, ".gg-foto .ana");
  if (page.viewportSize()!.width < 900) await expect(page.getByText("Bu açının bugünkü hali yok")).toBeVisible();

  await expect(page.locator(".gg-serit .gg-bugunu-var")).toHaveCount(2);
  await expect(page.locator(".gg-serit button").first()).toContainText("bugünkü eşi var");
  await expect(page.locator(".gg-serit .gg-cek-isaret")).toHaveCount(1);
  await expect(page.locator(".gg-cagri")).toHaveText("1 tanesinin bugünkü hali yok; ilkini sen çek.");
});

test("the arrow keys move through the photographs and Escape goes back to the site", async ({ page }) => {
  await openHistory(page);
  await expect(page.locator(".gg-sayac")).toHaveCount(1);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".gg-sayac")).toHaveText("3 / 3");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".gg-serit button").first()).toHaveAttribute("aria-current", "true");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "Geçmişi Gör", level: 1 })).toHaveCount(0);
});

test("a long archive scrolls inside its strip without widening the viewport", async ({ page }) => {
  await openHistory(page, true);
  await expect(page.locator(".gg-serit button")).toHaveCount(21);
  const width = page.viewportSize()!.width;
  if (width < 900) {
    const strip = await page.locator(".gg-serit").boundingBox();
    const place = await page.locator(".gg-yer").boundingBox();
    expect(strip!.y).toBeLessThan(place!.y);
  }
  expect(await page.evaluate(() => innerWidth)).toBe(width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  await page.locator(".gg-serit button").last().click();
  await expect(page.locator(".gg-serit button").last()).toHaveAttribute("aria-current", "true");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
});

test("closing the archive camera while permission is pending stops the late camera stream", async ({ page }) => {
  // The current UI intentionally offers camera capture only at phone widths.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: () => new Promise((resolve) => {
        document.documentElement.dataset.cameraPending = "true";
        window.addEventListener("test:camera-permission", () => resolve({
          getTracks: () => [{ stop: () => { document.documentElement.dataset.cameraStopped = "true"; } }],
        }), { once: true });
      }) },
    });
  });
  const errors = await openHistory(page);
  await page.getByRole("button", { name: /Sen de çek/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-camera-pending", "true");
  await page.getByRole("button", { name: "Kamerayı kapat", exact: true }).click();
  await expect(page.locator(".kam")).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new Event("test:camera-permission")));
  await expect(page.locator("html")).toHaveAttribute("data-camera-stopped", "true");
  expect(errors).toEqual([]);
});

