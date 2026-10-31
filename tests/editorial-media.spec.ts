import { expect, test } from "@playwright/test";
import { createSeed } from "../packages/api-client/src/seed";
import { triangleGlb } from "./support/triangle-glb";

test("part cards and story interiors work without reloading the model between sentences", async ({
  page,
}) => {
  const snapshot = createSeed();
  const site = snapshot.sites[0]!;
  site.model = {
    src: "/story-model.glb",
    name: "Story model",
    bytes: 0,
    parts: ["Roof"],
    coverGroups: [["Roof"]],
    trust: "representative",
  };
  site.partCards = [
    {
      id: "roof-card",
      title: "Örtü kartı",
      body: "Örtünün kaynaklı açıklaması.",
      parts: ["Roof"],
      photos: [],
      trust: "verified",
    },
  ];
  site.stories = site.stories.slice(0, 2).map((story, i) => ({
    ...story,
    id: `story-${i}`,
    interior: i === 1,
    camera: { target: "Roof", azimuthDeg: 0, elevationDeg: 20, distance: 0.95 },
  }));
  const errors: string[] = [];
  let downloads = 0;
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(
    (data) => localStorage.setItem("akar-demo-bursa-v1", JSON.stringify(data)),
    snapshot,
  );
  await page.route("**/story-model.glb", (route) => {
    downloads++;
    return route.fulfill({
      contentType: "model/gltf-binary",
      body: triangleGlb("Roof"),
    });
  });
  await page.goto("/#view=detail&site=ulu-cami");
  await expect(page.locator(".model-status")).toHaveCount(0);
  const canvas = page.locator(".model-viewer canvas");
  await expect(canvas).toBeVisible();
  await expect(
    page.getByRole("button", { name: "İçini göster" }),
  ).toBeVisible();
  await canvas.click();
  await expect(page.getByRole("dialog", { name: "Örtü kartı" })).toContainText(
    "Örtünün kaynaklı açıklaması.",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "İçini göster" }).click();
  await expect(
    page.getByRole("button", { name: "Dışını göster" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Dışını göster" }).click();
  await page.getByRole("button", { name: "Oku", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "İçini göster" }),
  ).toBeVisible();
  const storyDownloads = downloads;
  await canvas.evaluate((el) =>
    el.setAttribute("data-story-canvas", "retained"),
  );
  await page.getByRole("button", { name: "Sonraki bölüm", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Dışını göster" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(canvas).toHaveAttribute("data-story-canvas", "retained");
  expect(downloads).toBe(storyDownloads);
  expect(errors).toEqual([]);
});

test("model survives its loading state, photo switch and uncropped archive retain attribution", async ({
  page,
  request,
}) => {
  const snapshot = createSeed(),
    site = snapshot.sites[0]!;
  const photo = {
    id: "editorial-photo",
    src: "/test-photo.svg",
    alt: "Tarihî cami",
    title: "Arşiv fotoğrafı",
    titleEn: "",
    description: "Fotoğrafçı · Örnek arşiv · Foto Atlas aracılığıyla",
    sourceId: "archive-source",
    license: "CC BY-NC-ND",
    trust: "verified" as const,
  };
  site.model = {
    src: "/test-model.glb",
    name: "Test model",
    bytes: 0,
    parts: [],
    trust: "representative",
  };
  site.photos = [photo];
  site.coverPhotoId = photo.id;
  site.historyImages = [
    {
      id: "archive-1",
      photo,
      caption: "Ulucami arşivi",
      dateLabel: "1890–1900",
      sourceId: photo.sourceId,
      trust: "verified",
    },
  ];
  site.historyImages.push({
    ...site.historyImages[0]!,
    id: "archive-2",
    dateLabel: "1930",
  });
  site.sections = [
    {
      id: "section-1",
      kind: "history",
      title: "Tarihçe",
      body: "Kaynaklı tarihçe metni.",
      trust: "verified",
      sourceId: photo.sourceId,
    },
  ];
  site.sources = [
    {
      id: photo.sourceId,
      title: photo.description,
      kind: "archive",
      author: "Fotoğrafçı",
      year: "1900",
      page: "",
      url: "https://archive.example/item",
      trust: "verified",
    },
  ];
  await page.addInitScript(
    (data) => localStorage.setItem("akar-demo-bursa-v1", JSON.stringify(data)),
    snapshot,
  );
  await page.route("**/test-model.glb", (route) =>
    route.fulfill({ contentType: "model/gltf-binary", body: triangleGlb() }),
  );
  await page.route("**/test-photo.svg", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#49684d"/></svg>',
    }),
  );
  await page.goto("/#view=detail&site=ulu-cami");
  await expect(page.locator(".model-viewer canvas")).toBeVisible();
  await expect(page.locator(".model-status")).toHaveCount(0);
  // Regression: React previously removed the imperative canvas when the status text disappeared.
  await expect(page.locator(".model-viewer canvas")).toBeVisible();
  await page.getByRole("button", { name: "Fotoğraf", exact: true }).click();
  await expect(page.locator(".scene-photo")).toHaveAttribute("alt", photo.alt);
  await page.getByRole("button", { name: "Eser hakkında" }).click();
  await expect(
    page.getByRole("dialog").getByText("Kaynaklı tarihçe metni."),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /^Geçmişi Gör/ }).click();
  await expect(page.locator(".archive-photo img")).toBeVisible();
  await expect(page.locator(".archive-photo img")).toHaveCSS(
    "object-fit",
    "contain",
  );
  await expect(page.locator(".archive-credit")).toHaveText(photo.description);
  await expect(page.getByText("CC BY-NC-ND", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Arşiv kaydını aç" }),
  ).toHaveAttribute("href", "https://archive.example/item");
  await page.locator(".archive-timeline button").nth(1).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".archive-photo figcaption")).toContainText("1930");
  const decoder = await request.get("/draco/draco_decoder.wasm");
  expect(decoder.ok()).toBe(true);
  expect((await decoder.body()).subarray(0, 4).toString("hex")).toBe(
    "0061736d",
  );
});
