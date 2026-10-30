import { expect, test, type Page } from "@playwright/test";
import { createSeed } from "../packages/api-client/src/seed";
import { triangleGlb } from "./support/triangle-glb";

const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#49684d"/></svg>';

/** Five sentences: two about the whole building, one with a part and its card, one with a photograph only, one with neither. */
async function openStory(page: Page, modelServed?: Promise<void>) {
  const snapshot = createSeed();
  const site = snapshot.sites[0]!;
  site.model = {
    src: "/story-model.glb",
    name: "Story model",
    bytes: 0,
    parts: ["Roof"],
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
  site.photos = [
    {
      id: "story-photo",
      src: "/story-photo.svg",
      alt: "Avlu",
      title: "Avlu",
      titleEn: "",
      description: "Kubbeler on iki kare payeye oturur.",
      sourceId: "",
      license: "Proje için verildi",
      trust: "verified",
    },
  ];
  site.coverPhotoId = "story-photo";
  const camera = {
    target: null,
    azimuthDeg: 0,
    elevationDeg: 30,
    distance: 0.95,
  };
  const story = site.stories[0]!;
  const sentence = (i: number, extra: object) => ({
    ...story,
    id: `story-${i}`,
    photoId: "story-photo",
    title: `Cümle ${i}`,
    text: `Cümle ${i} metni.`,
    simple: `Cümle ${i} metni.`,
    camera,
    interior: false,
    showCard: false,
    highlights: [],
    ...extra,
  });
  site.stories = [
    sentence(0, {}),
    sentence(1, {}),
    sentence(2, {
      showCard: true,
      highlights: ["Roof"],
      camera: { ...camera, target: "Roof" },
    }),
    sentence(3, { showCard: true }),
    sentence(4, { highlights: ["Roof"] }),
  ];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/story-model.glb", async (route) => {
    await modelServed;
    await route.fulfill({
      contentType: "model/gltf-binary",
      body: triangleGlb("Roof"),
    });
  });
  await page.route(/\.svg$/, (route) =>
    route.fulfill({ contentType: "image/svg+xml", body: SVG }),
  );
  await page.addInitScript(
    (data) => localStorage.setItem("akar-demo-bursa-v1", JSON.stringify(data)),
    snapshot,
  );
  await page.goto("/#view=detail&site=ulu-cami");
  await page.getByRole("button", { name: "Oku", exact: true }).click();
  await expect(page.locator(".model-canvas canvas")).toBeVisible();
  return errors;
}

const next = (page: Page) =>
  page.getByRole("button", { name: "Devam et", exact: true }).click();
const tour = (page: Page) => page.locator(".model-canvas");

test("a sentence about the whole building turns the model, a highlighted one holds it, a touch stops it", async ({
  page,
}) => {
  const errors = await openStory(page);
  await expect(tour(page)).toHaveAttribute("data-tour", "on");
  await next(page);
  await expect(page.locator(".story-text")).toContainText("Cümle 1");
  await expect(tour(page)).toHaveAttribute("data-tour", "on");
  await next(page);
  await expect(page.locator(".story-text")).toContainText("Cümle 2");
  await expect(tour(page)).toHaveAttribute("data-tour", "off");
  await next(page);
  await expect(tour(page)).toHaveAttribute("data-tour", "on");
  // Pressing the model stops the turn where the visitor took over.
  const canvas = page.locator(".model-canvas canvas");
  await canvas.dragTo(canvas, {
    sourcePosition: { x: 40, y: 40 },
    targetPosition: { x: 80, y: 40 },
  });
  await expect(tour(page)).toHaveAttribute("data-tour", "off");
  expect(errors).toEqual([]);
});

test("the turn waits for the model to be drawn", async ({ page }) => {
  const gate = Promise.withResolvers<void>();
  const errors = await openStory(page, gate.promise);
  await expect(page.locator(".story-text")).toContainText("Cümle 0");
  await expect(tour(page)).not.toHaveAttribute("data-tour", "on");
  gate.resolve();
  await expect(tour(page)).toHaveAttribute("data-tour", "on");
  expect(errors).toEqual([]);
});

test("with reduced motion the model does not turn", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openStory(page);
  await expect(page.locator(".story-text")).toContainText("Cümle 0");
  await expect(tour(page)).not.toHaveAttribute("data-tour", "on");
});

test("the photo card stays clear of the model, is dragged away and opens the part card or the photograph", async ({
  page,
}) => {
  const errors = await openStory(page);
  const card = page.locator(".story-photo-card");
  await expect(card).toHaveCount(0);
  await next(page);
  await next(page);
  await expect(card).toBeVisible();
  const scene = (await page.locator(".media-scene").boundingBox())!;
  const box = (await card.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(scene.x);
  expect(box.x + box.width).toBeLessThanOrEqual(scene.x + scene.width);
  expect(box.y + box.height).toBeLessThanOrEqual(scene.y + scene.height);
  // A tap opens the part card of what is highlighted.
  await card.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Örtü kartı");
  await dialog.getByRole("button", { name: "Kapat" }).click();
  await expect(dialog).toHaveCount(0);
  // A drag moves it and opens nothing.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y - 40, { steps: 4 });
  await page.mouse.up();
  await expect(card).toHaveClass(/placed/);
  expect((await card.boundingBox())!.y).toBeLessThan(box.y);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  // The next card stays where the visitor left it; with no part card it opens the photograph.
  const placed = (await card.boundingBox())!.y;
  await next(page);
  await expect(page.locator(".story-text")).toContainText("Cümle 3");
  await expect
    .poll(async () => Math.round((await card.boundingBox())?.y ?? 0))
    .toBe(Math.round(placed));
  await card.click();
  await expect(page.locator(".about-lightbox")).toBeVisible();
  await page.locator(".about-lightbox-close").click();
  await expect(page.locator(".about-lightbox")).toHaveCount(0);
  await next(page);
  await expect(card).toHaveCount(0);
  expect(errors).toEqual([]);
});
