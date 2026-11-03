import { expect, test, type Page } from "@playwright/test";
import { createSeed } from "../../packages/api-client/src/seed";

export async function openGallery(page: Page, model: boolean) {
  const snapshot = createSeed();
  const site = snapshot.sites[0]!;
  if (!model) delete site.model;
  site.photos = [1, 2, 3].map((n) => ({
    id: `gallery-${n}`,
    src: `/gallery-photo-${n}.svg`,
    alt: `Eser fotoğrafı ${n}`,
    title: `Görsel ${n}`,
    titleEn: "",
    description: "",
    sourceId: "gallery-source",
    license: `Fotoğraf ${n} kullanım izni. ${"Uzun kaynak ve lisans açıklaması. ".repeat(5)}`,
    trust: "verified" as const,
  }));
  site.coverPhotoId = "gallery-2";
  site.sources = [
    {
      id: "gallery-source",
      title: "Eser envanteri kaynak kaydı",
      author: "",
      year: "",
      page: "",
      url: "",
      kind: "archive",
      trust: "verified",
    },
  ];
  site.storyPhotos = [
    {
      ...site.photos[0]!,
      id: "story-only",
      alt: "Yalnız hikâyeye ait fotoğraf",
    },
  ];
  site.stories = site.stories.slice(0, 3).map((story, i) => ({
    ...story,
    photoId: i === 2 ? "missing-story-photo" : i ? "gallery-3" : "story-only",
  }));
  await page.addInitScript(
    (data) => localStorage.setItem("akar-demo-bursa-v1", JSON.stringify(data)),
    snapshot,
  );
  await page.route("https://tiles.openfreemap.org/**", (route) =>
    route.abort(),
  );
  await page.route("**/gallery-photo-*.svg", (route) => {
    const portrait = route.request().url().endsWith("1.svg");
    return route.fulfill({
      contentType: "image/svg+xml",
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="${portrait ? 800 : 2400}" height="${portrait ? 1800 : 1200}"><rect width="100%" height="100%" fill="${portrait ? "#517b72" : "#b8ac83"}"/><text x="50%" y="50%" text-anchor="middle" font-size="80" fill="white">${portrait ? "Portre" : "Manzara"}</text></svg>`,
    });
  });
  await page.goto("/#view=detail&site=ulu-cami");
  if (model)
    await page.getByRole("button", { name: "Fotoğraf", exact: true }).click();
}

export function photoGalleryTests() {
  for (const model of [true, false]) {
    test(`all site photos are reachable and credits stay below the image (${model ? "model switch" : "photos only"})`, async ({
      page,
      isMobile,
      browserName,
    }, info) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.emulateMedia({ reducedMotion: "reduce" });
      await openGallery(page, model);
      const gallery = page.getByRole("region", {
        name: "Eser fotoğraf galerisi",
      });
      // The site's photographs; the last tile, «Fotoğrafını ekle», is not one of them.
      const figures = gallery.locator("figure:not(.ekle)");
      await expect(figures).toHaveCount(3);
      await expect(figures.first().locator("img")).toHaveAttribute(
        "alt",
        "Eser fotoğrafı 2",
      );
      await expect(
        gallery.getByAltText("Yalnız hikâyeye ait fotoğraf"),
      ).toHaveCount(0);
      await expect(figures.first().locator("img")).toHaveCSS("object-fit", "cover");
      await expect(gallery).toHaveCSS("grid-template-rows", /.+ .+/);
      if (!model) await expect(page.getByRole("group", { name: "Görünüm" })).toHaveCount(0);
      if (isMobile && browserName === "chromium") {
        const touch = await page.context().newCDPSession(page);
        const box = (await gallery.boundingBox())!;
        const y = box.y + Math.min(box.height / 2, 100);
        await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: box.x + box.width - 25, y }] });
        for (let step = 1; step <= 8; step++) await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: box.x + box.width - 25 - step * 30, y }] });
        await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await expect.poll(() => gallery.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
        await touch.detach();
      }
      await figures.last().getByRole("button").click();
      const lightbox = page.getByRole("dialog", { name: "Fotoğraf", exact: true });
      await expect(lightbox).toContainText("Eser envanteri kaynak kaydı");
      await expect(lightbox).toContainText("Fotoğraf 3 kullanım izni");
      await expect(lightbox.getByRole("img", { name: /^Eser fotoğrafı/ })).toHaveAttribute("alt", "Eser fotoğrafı 3");
      await lightbox.getByRole("button", { name: "Sonraki fotoğraf" }).focus();
      await page.keyboard.press("Enter");
      await expect(lightbox.getByRole("img", { name: /^Eser fotoğrafı/ })).toHaveAttribute("alt", "Eser fotoğrafı 2");
      await page.keyboard.press("ArrowLeft");
      await expect(lightbox.getByRole("img", { name: /^Eser fotoğrafı/ })).toHaveAttribute("alt", "Eser fotoğrafı 3");
      await page.keyboard.press("Escape");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (model) {
        // Both halves, including the selected half, toggle the whole switch.
        await page.getByRole("button", { name: "Fotoğraf", exact: true }).click();
        await expect(page.locator(".model-viewer canvas")).toBeVisible();
        await page.getByRole("button", { name: "3D", exact: true }).click();
        await expect(figures).toHaveCount(3);
        await expect(page.getByRole("button", { name: "Fotoğraf", exact: true })).toHaveAttribute("aria-pressed", "true");
      }
      await page.screenshot({
        path: `test-results/${info.project.name}-${browserName}-gallery-${model}.png`,
        fullPage: true,
      });
      expect(errors).toEqual([]);
    });
  }

  test("gallery controls and long credits remain reachable on small screens", async ({
    page,
    isMobile,
  }) => {
    await page.setViewportSize(
      isMobile ? { width: 320, height: 568 } : { width: 1024, height: 600 },
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openGallery(page, true);
    const gallery = page.getByRole("region", {
      name: "Eser fotoğraf galerisi",
    });
    await gallery.locator("figure:not(.ekle)").last().getByRole("button").click();
    const lightbox = page.getByRole("dialog", { name: "Fotoğraf", exact: true });
    const credit = lightbox.locator("p");
    await expect(credit).toContainText("Uzun kaynak ve lisans açıklaması");
    await credit.scrollIntoViewIfNeeded();
    await expect(credit).toBeInViewport();
    await page.keyboard.press("Escape");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "3D", exact: true }).click();
    await expect(page.locator(".model-viewer canvas")).toBeVisible();
  });

  test("story photos follow the sentence instead of opening the entire gallery", async ({
    page,
  }) => {
    await openGallery(page, true);
    await page.getByRole("button", { name: "Oku", exact: true }).click();
    await expect(page.getByRole("button", { name: "Fotoğraf", exact: true })).toHaveAttribute("aria-pressed", "true");
    const gallery = page.getByRole("region", {
      name: "Eser fotoğraf galerisi",
    });
    const shown = page.locator(".story-photo-main");
    await expect(shown).toHaveAttribute("alt", "Yalnız hikâyeye ait fotoğraf");
    await page.getByRole("button", { name: "Sonraki bölüm", exact: true }).click();
    await expect(shown).toHaveAttribute("alt", "Eser fotoğrafı 3");
    await page.getByRole("button", { name: "Sonraki bölüm", exact: true }).click();
    await expect(gallery.locator("figure")).toHaveCount(0);
    await expect(gallery.getByRole("status")).toHaveText(
      "Bu bölümün fotoğrafı bulunamadı.",
    );
    await expect(
      page.getByRole("group", { name: "Fotoğraf gezinme" }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "3D", exact: true }).click();
    await expect(page.locator(".model-viewer canvas")).toBeVisible();
    await page.getByRole("button", { name: "Fotoğraf", exact: true }).click();
    await expect(gallery.getByRole("status")).toHaveText(
      "Bu bölümün fotoğrafı bulunamadı.",
    );
  });
}
