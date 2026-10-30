import { expect, test, type Page } from "@playwright/test";
import { createSeed } from "../../packages/api-client/src/seed";

async function openGallery(page: Page, model: boolean) {
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
      const figures = gallery.locator("figure");
      await expect(figures).toHaveCount(3);
      await expect(figures.first().locator("img")).toHaveAttribute(
        "alt",
        "Eser fotoğrafı 2",
      );
      await expect(
        gallery.getByAltText("Yalnız hikâyeye ait fotoğraf"),
      ).toHaveCount(0);
      await expect(figures.first().locator("img")).toHaveCSS(
        "object-fit",
        "contain",
      );
      const boxes = await figures.first().evaluate((figure) => ({
        imageBottom: figure.querySelector("img")!.getBoundingClientRect()
          .bottom,
        creditTop: figure.querySelector("figcaption")!.getBoundingClientRect()
          .top,
      }));
      expect(boxes.creditTop).toBeGreaterThanOrEqual(boxes.imageBottom);
      if (isMobile && browserName === "chromium") {
        const touch = await page.context().newCDPSession(page);
        const box = (await figures.first().locator("img").boundingBox())!;
        const y = box.y + box.height / 2;
        await touch.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ x: box.x + box.width - 20, y }],
        });
        for (let step = 1; step <= 8; step++) {
          await touch.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [
              { x: box.x + (box.width - 40) * (1 - step / 8) + 20, y },
            ],
          });
        }
        await touch.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
        // Native touch momentum must settle before another navigation action.
        let previousOffset = -1;
        await expect
          .poll(
            async () => {
              const offset = await gallery.evaluate((el) => el.scrollLeft);
              const settled = offset > 0 && offset === previousOffset;
              previousOffset = offset;
              return settled;
            },
            { intervals: [100] },
          )
          .toBe(true);
        // Native momentum may advance more than one photo. Verify the actual snapped slide and
        // matching counter, then return to the first photo for deterministic button navigation.
        const index = await gallery.evaluate((el) =>
          Math.round(el.scrollLeft / el.clientWidth),
        );
        expect(index).toBeGreaterThan(0);
        expect(index).toBeLessThan(3);
        await expect(figures.nth(index).locator("img")).toBeInViewport({
          ratio: 0.9,
        });
        await expect(
          page
            .getByRole("status")
            .filter({ hasText: `Fotoğraf ${index + 1} / 3` }),
        ).toBeVisible();
        for (let current = index; current > 0; current--) {
          await page.getByRole("button", { name: "Önceki fotoğraf" }).click();
          await expect(
            page
              .getByRole("status")
              .filter({ hasText: `Fotoğraf ${current} / 3` }),
          ).toBeVisible();
        }
        await expect(
          page.getByRole("status").filter({ hasText: "Fotoğraf 1 / 3" }),
        ).toBeVisible();
        await touch.detach();
      }
      const next = page.getByRole("button", { name: "Sonraki fotoğraf" });
      await next.focus();
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("status").filter({ hasText: "Fotoğraf 2 / 3" }),
      ).toBeVisible();
      await expect(figures.nth(1).locator("img")).toBeInViewport({
        ratio: 0.3,
      });
      await next.click();
      await expect(
        page.getByRole("status").filter({ hasText: "Fotoğraf 3 / 3" }),
      ).toBeVisible();
      await expect(next).toBeDisabled();
      await expect(figures.last().locator("figcaption")).toContainText(
        "Eser envanteri kaynak kaydı",
      );
      if (isMobile) {
        expect(await gallery.evaluate((el) => el.scrollLeft)).toBeGreaterThan(
          0,
        );
        // The caption can grow naturally; the page, not a clipped fixed-height stage, holds it.
        await figures.last().locator("figcaption").scrollIntoViewIfNeeded();
        await expect(figures.last().locator("figcaption")).toBeInViewport();
        await page
          .getByRole("heading", { name: "Ulucami", exact: true })
          .scrollIntoViewIfNeeded();
        await expect(
          page.getByRole("heading", { name: "Ulucami", exact: true }),
        ).toBeInViewport();
      } else {
        await gallery.hover();
        await page.mouse.wheel(0, -2500);
        await expect.poll(() => gallery.evaluate((el) => el.scrollTop)).toBe(0);
        await page.mouse.wheel(0, 650);
        await expect
          .poll(() => gallery.evaluate((el) => el.scrollTop))
          .toBeGreaterThan(0);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (model) {
        await page
          .getByRole("button", { name: "3B model", exact: true })
          .click();
        await expect(page.locator(".model-viewer canvas")).toBeVisible();
        const fits = await page
          .locator(".media-scene")
          .evaluate(
            (el) =>
              el.getBoundingClientRect().height <=
              el.parentElement!.getBoundingClientRect().height + 1,
          );
        expect(fits).toBe(true);
        await page
          .getByRole("button", { name: "Fotoğraf", exact: true })
          .click();
        await expect(figures).toHaveCount(3);
        await expect(
          page.getByRole("button", { name: "Fotoğraf", exact: true }),
        ).toHaveCSS("background-color", "rgb(31, 43, 49)");
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
    await page.getByRole("button", { name: "Sonraki fotoğraf" }).click();
    await page.getByRole("button", { name: "Sonraki fotoğraf" }).click();
    const credit = gallery.locator("figcaption").last();
    await credit.scrollIntoViewIfNeeded();
    await expect(credit).toBeInViewport({ ratio: 0.9 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "3B model", exact: true }).click();
    await expect(page.locator(".model-viewer canvas")).toBeVisible();
  });

  test("story photos follow the sentence instead of opening the entire gallery", async ({
    page,
  }) => {
    await openGallery(page, true);
    await page.getByRole("button", { name: "Oku", exact: true }).click();
    await page.getByRole("button", { name: "Fotoğraf", exact: true }).click();
    const gallery = page.getByRole("region", {
      name: "Eser fotoğraf galerisi",
    });
    const shown = page.locator(".story-photo-main");
    await expect(shown).toHaveAttribute("alt", "Yalnız hikâyeye ait fotoğraf");
    await page.getByRole("button", { name: "Devam et", exact: true }).click();
    await expect(shown).toHaveAttribute("alt", "Eser fotoğrafı 3");
    await page.getByRole("button", { name: "Devam et", exact: true }).click();
    await expect(gallery.locator("figure")).toHaveCount(0);
    await expect(gallery.getByRole("status")).toHaveText(
      "Bu bölümün fotoğrafı bulunamadı.",
    );
    await expect(
      page.getByRole("group", { name: "Fotoğraf gezinme" }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "3B model", exact: true }).click();
    await expect(page.locator(".model-viewer canvas")).toBeVisible();
    await page.getByRole("button", { name: "Fotoğraf", exact: true }).click();
    await expect(gallery.getByRole("status")).toHaveText(
      "Bu bölümün fotoğrafı bulunamadı.",
    );
  });
}
