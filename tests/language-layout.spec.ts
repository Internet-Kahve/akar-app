import { expect, test, type Page } from "@playwright/test";
import { createSeed } from "../packages/api-client/src/seed";

/** Ulucami with a photograph, so its scene shows the «Fotoğraf | 3D» switch. */
async function withPhoto(page: Page) {
  const snapshot = createSeed();
  const site = snapshot.sites.find((s) => s.id === "ulu-cami")!;
  site.photos = [
    { id: "p1", src: "/lang-photo.svg", alt: "Eser fotoğrafı", title: "Görsel", titleEn: "", description: "", sourceId: "", license: "İzinli", trust: "verified" as const },
  ];
  site.coverPhotoId = "p1";
  await page.addInitScript((data) => localStorage.setItem("akar-demo-bursa-v1", JSON.stringify(data)), snapshot);
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort());
  await page.route("**/lang-photo.svg", (route) =>
    route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="100%" height="100%" fill="#b8ac83"/></svg>' }),
  );
}

/** The sliding pill sits exactly on the pressed button. */
async function pillOnPressed(page: Page) {
  const box = page.locator(".scene-media-switch").first();
  await expect
    .poll(() =>
      box.evaluate((el: HTMLElement) => {
        const on = el.querySelector<HTMLElement>("[aria-pressed=true]")!;
        const w = parseFloat(el.style.getPropertyValue("--pill-w"));
        const x = parseFloat(el.style.getPropertyValue("--pill-x"));
        return Math.abs(w - on.offsetWidth) <= 1 && Math.abs(x - on.offsetLeft) <= 1;
      }),
    )
    .toBe(true);
}

test("the photo/3D switch's pill follows its labels when the language changes", async ({ page, isMobile }) => {
  test.skip(isMobile, "a phone's site page hides the header, so its language cannot change there");
  await withPhoto(page);
  await page.goto("/#view=detail&site=ulu-cami");
  const box = page.locator(".scene-media-switch").first();
  await expect(box.getByRole("button")).toHaveCount(2);
  await pillOnPressed(page);
  await page.locator(".lang-switch").first().click();
  await expect(box.getByRole("button", { name: "Photo", exact: true })).toBeVisible();
  await pillOnPressed(page);
  await box.getByRole("button", { name: "Photo", exact: true }).click();
  await pillOnPressed(page);
  await page.locator(".lang-switch").first().click();
  await expect(box.getByRole("button", { name: "Fotoğraf", exact: true })).toBeVisible();
  await pillOnPressed(page);
});
