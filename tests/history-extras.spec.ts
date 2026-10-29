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
async function openHistory(page: Page) {
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

test("the archive's present-day pair is a slider, both photographs whole, with each credit line word for word and the near-angle note", async ({
  page,
}) => {
  const errors = await openHistory(page);
  const slider = page.getByRole("slider", {
    name: "Eski ve bugünkü fotoğrafı karşılaştır",
  });
  await expect(slider).toHaveAttribute("aria-valuenow", "50");
  await expect(slider).toHaveAttribute("aria-valuetext", "Eski %50");
  await expect(page.locator(".history-compare-label.old")).toHaveText("1875–84");
  await expect(page.locator(".history-compare-label.today")).toHaveText("Bugün · AKAR arşivi");
  await expect(page.locator(".history-compare .tag")).toHaveCount(0);
  await expect(page.locator(".history-compare-layer")).toHaveCount(2);
  await fits(page, ".history-compare-layer:not(.history-compare-old)");
  await fits(page, ".history-compare-old");
  await expect(page.locator("aside .archive-credit")).toHaveText(OLD_CREDIT);
  await expect(page.locator(".archive-credit-today")).toHaveText(`Bugünkü fotoğraf ${PAIR_CREDIT}`);
  await expect(page.getByText("CC BY-NC-ND 4.0", { exact: true })).toBeVisible();
  await expect(page.locator(".history-near")).toHaveText(
    "Yakın açı: iki fotoğraf birebir aynı noktadan çekilmedi.",
  );
  await expect(page.getByText("henüz eklenmedi")).toHaveCount(0);

  await slider.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(slider).toHaveAttribute("aria-valuenow", "45");
  await page.keyboard.press("End");
  await expect(slider).toHaveAttribute("aria-valuetext", "Eski %100");
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuenow", "100");
  await page.keyboard.press("Home");
  await expect(slider).toHaveAttribute("aria-valuenow", "0");

  const box = (await page.locator(".history-compare").boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2, { steps: 4 });
  await page.mouse.up();
  const value = Number(await slider.getAttribute("aria-valuenow"));
  expect(value).toBeGreaterThanOrEqual(74);
  expect(value).toBeLessThanOrEqual(76);
  expect(errors).toEqual([]);
});

test("without the archive's pair the newest linked sample stands in, tagged «Örnek»; a photograph with neither has no comparison", async ({
  page,
}) => {
  await openHistory(page);
  await page.locator(".archive-timeline button").nth(1).click();
  await expect(page.locator(".history-compare-label.today")).toContainText("Bugün · AKAR ekibi");
  await expect(page.locator(".history-compare-label.today .tag")).toHaveText("Örnek");
  await expect(page.locator(".archive-credit-today")).toHaveText(`Bugünkü fotoğraf ${TRACE_CREDIT}`);
  await expect(page.locator(".history-near")).toHaveCount(0);

  await page.locator(".archive-timeline button").nth(2).click();
  await expect(page.getByRole("slider")).toHaveCount(0);
  await expect(page.locator(".archive-photo > img")).toBeVisible();
  await fits(page, ".archive-photo > img");
  await expect(page.getByText("Bu fotoğrafın bugünkü eş görüntüsü henüz eklenmedi.")).toBeVisible();

  const dots = page.locator(".archive-timeline .history-pair-dot");
  await expect(dots).toHaveCount(2);
  await expect(page.locator(".archive-timeline button").first()).toContainText("bugünkü eşi var");
});

test("the team's samples are listed with the «Örnek» tag, their credit line word for word and uncropped photographs; the linked one shows its archive photograph", async ({
  page,
}) => {
  await openHistory(page);
  const cards = page.locator(".sample-trace");
  await expect(page.getByRole("heading", { name: "İz Bırak örnekleri" })).toBeVisible();
  await expect(cards).toHaveCount(2);
  await expect(cards.locator(".tag")).toHaveText(["Örnek", "Örnek"]);
  await expect(cards.locator(".sample-trace-credit")).toHaveText([TRACE_CREDIT, TRACE_CREDIT]);
  await expect(cards.first()).toContainText("AKAR ekibi");
  await expect(cards.first()).toContainText("Örnek katkı 1");
  await fits(page, ".sample-trace img");
  await expect(cards.nth(1).getByRole("button")).toHaveCount(0);

  await cards.first().getByRole("button", { name: "Eski fotoğrafı göster" }).click();
  await expect(page.locator(".archive-timeline button").nth(1)).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".archive-photo figcaption")).toContainText("Tarih bilinmiyor");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
});
