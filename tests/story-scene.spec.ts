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
    // The last sentence, about the whole building: the story ends turning the model, as it began.
    sentence(5, {}),
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
  await page.getByRole("button", { name: /^(Oku|Hikâyeyi başlat|Hikâyeyi yeniden izle)$/ }).filter({ visible: true }).first().click();
  // A phone opens on the one-sentence card; these checks read the numbered list (☰).
  const list = page.getByRole("button", { name: "Cümle listesini aç" });
  if (await list.isVisible()) await list.click();
  await expect(page.locator(".model-canvas canvas")).toBeVisible();
  return errors;
}

const next = (page: Page) =>
  page.getByRole("button", { name: "Sonraki bölüm", exact: true }).dispatchEvent("click");
const tour = (page: Page) => page.locator(".model-canvas");

test("the model turns on the story's first and last sentences about the whole building, holds in between, and a touch stops it", async ({
  page,
}) => {
  const errors = await openStory(page);
  await expect(tour(page)).toHaveAttribute("data-tour", "on");
  // A sentence in the middle holds the model, highlighted or not (Muhammed, 2 Nov).
  await next(page);
  await expect(page.locator(".current .story-text")).toContainText("Cümle 1");
  await expect(tour(page)).toHaveAttribute("data-tour", "off");
  await next(page);
  await expect(page.locator(".current .story-text")).toContainText("Cümle 2");
  await expect(tour(page)).toHaveAttribute("data-tour", "off");
  for (let i = 0; i < 3; i++) await next(page);
  await expect(page.locator(".current .story-text")).toContainText("Cümle 5");
  await expect(tour(page)).toHaveAttribute("data-tour", "on");
  // Pressing the model stops the turn where the visitor took over.
  const canvas = page.locator(".model-canvas canvas");
  await canvas.dragTo(canvas, {
    sourcePosition: { x: 120, y: 200 },
    targetPosition: { x: 170, y: 200 },
  });
  await expect(tour(page)).toHaveAttribute("data-tour", "off");
  expect(errors).toEqual([]);
});

test("the turn waits for the model to be drawn", async ({ page }) => {
  const gate = Promise.withResolvers<void>();
  const errors = await openStory(page, gate.promise);
  await expect(page.locator(".current .story-text")).toContainText("Cümle 0");
  await expect(tour(page)).not.toHaveAttribute("data-tour", "on");
  gate.resolve();
  await expect(tour(page)).toHaveAttribute("data-tour", "on");
  expect(errors).toEqual([]);
});

test("with reduced motion the model does not turn", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openStory(page);
  await expect(page.locator(".current .story-text")).toContainText("Cümle 0");
  await expect(tour(page)).not.toHaveAttribute("data-tour", "on");
});

test("the photo card stays clear of the model, is dragged away and opens the part card or the photograph", async ({
  page,
  isMobile,
}) => {
  // A phone docks the card along the stage's foot (3 Nov 2026): not moved, not sized.
  test.skip(isMobile, "the phone's photo card is docked");
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
  await expect(page.locator(".current .story-text")).toContainText("Cümle 3");
  // Within a pixel: the y can land on either side of a half pixel.
  await expect
    .poll(async () => Math.abs(((await card.boundingBox())?.y ?? 0) - placed))
    .toBeLessThan(1);
  await card.click();
  await expect(page.locator(".about-lightbox")).toBeVisible();
  await page.locator(".about-lightbox-close").click();
  await expect(page.locator(".about-lightbox")).toHaveCount(0);
  await next(page);
  await expect(card).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("the photo card's corner sizes it, the keyboard steps it, and both stay on this device", async ({ page, isMobile }) => {
  // A phone docks the card along the stage's foot (3 Nov 2026): not moved, not sized.
  test.skip(isMobile, "the phone's photo card is docked");
  await openStory(page);
  await next(page);
  await next(page);
  const card = page.locator(".story-photo-card");
  const handle = card.getByRole("button", { name: /Kartın boyutu/ });
  await expect(handle).toHaveAccessibleName("Kartın boyutu: yüzde 100");
  const before = (await card.boundingBox())!;
  const h = (await handle.boundingBox())!;
  // Wide: dragged right, the card widens; a phone's strip at the bottom grows upward.
  const wide = page.viewportSize()!.width >= 1000;
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
  await page.mouse.down();
  await page.mouse.move(h.x + h.width / 2 + (wide ? 96 : 0), h.y + h.height / 2 - (wide ? 0 : 29), { steps: 4 });
  await page.mouse.up();
  await expect(handle).toHaveAccessibleName("Kartın boyutu: yüzde 130");
  const after = (await card.boundingBox())!;
  expect(wide ? after.width : after.height).toBeGreaterThan((wide ? before.width : before.height) * 1.2);
  // No dialog opened from the handle.
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await handle.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(handle).toHaveAccessibleName("Kartın boyutu: yüzde 120");
  // Kept for the next story on this device.
  await page.reload();
  // The story reopens where it was: on a phone as the one-sentence card (no «Oku» there), its list behind ☰.
  const read = page.getByRole("button", { name: /^(Oku|Hikâyeyi başlat|Hikâyeyi yeniden izle)$/ }).filter({ visible: true }).first();
  const list = page.getByRole("button", { name: "Cümle listesini aç" });
  await expect(page.locator(".story-panel").or(read).first()).toBeVisible();
  if (await read.isVisible()) await read.click();
  if (await list.isVisible()) await list.click();
  await next(page);
  await next(page);
  await expect(card.getByRole("button", { name: /Kartın boyutu/ })).toHaveAccessibleName("Kartın boyutu: yüzde 120");
  // A double click puts it back.
  await card.getByRole("button", { name: /Kartın boyutu/ }).dblclick();
  await expect(card.getByRole("button", { name: /Kartın boyutu/ })).toHaveAccessibleName("Kartın boyutu: yüzde 100");
});
