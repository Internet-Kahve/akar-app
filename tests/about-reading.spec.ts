import { expect, test } from "@playwright/test";
import { createSeed } from "../packages/api-client/src/seed";

test("chapter reading, book photos and the site gallery remain usable together", async ({
  page,
  isMobile,
}) => {
  const snapshot = createSeed();
  const site = snapshot.sites[0]!;
  const photo = {
    id: "reading-photo",
    src: "/reading-photo.svg",
    alt: "Kitap fotoğrafı",
    title: "Kitap",
    titleEn: "",
    description: "",
    sourceId: "reading-source",
    license: "Kaynak arşivi izni",
    trust: "verified" as const,
  };
  site.photos = [photo];
  site.coverPhotoId = photo.id;
  site.sources = [
    {
      id: "reading-source",
      title: "Okuma testi kaynağı",
      author: "",
      year: "",
      page: "",
      url: "",
      kind: "archive",
      trust: "verified",
    },
  ];
  site.chapters = [1, 2, 3].map((n) => ({
    id: `chapter-${n}`,
    title: `Bölüm ${n}`,
    kind: "history",
    summary: [`Bölüm ${n} özeti.`],
    figures: [],
    quotes: [],
    timeline: [],
    terms: [],
    interior: false,
    focusParts: [],
    camera: { target: null, azimuthDeg: 0, elevationDeg: 40, distance: 100 },
  }));
  site.sections = site.chapters.map((chapter, i) => ({
    id: `section-${i}`,
    title: chapter.title,
    body: `Bölüm ${i + 1} tam kaynak metni.`,
    sourceId: "reading-source",
    trust: "verified",
    chapterId: chapter.id,
    photos: [{ photo, aspect: "4:3", alt: `Bölüm ${i + 1} kitap fotoğrafı` }],
  }));
  await page.addInitScript(
    (data) => localStorage.setItem("akar-demo-bursa-v1", JSON.stringify(data)),
    snapshot,
  );
  await page.route("https://tiles.openfreemap.org/**", (route) =>
    route.abort(),
  );
  await page.route("**/reading-photo.svg", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#517b72"/></svg>',
    }),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#view=detail&site=ulu-cami");
  await page.getByRole("button", { name: "Fotoğraf", exact: true }).click();
  await page.getByRole("button", { name: "Eser hakkında" }).click();
  const reading = page.getByRole("dialog", {
    name: "Eser hakkında",
    exact: true,
  });
  await expect(reading).toBeVisible();
  await expect(reading.locator(".model-viewer canvas")).toHaveCount(
    isMobile ? 0 : 1,
  );
  await reading
    .getByRole("navigation", { name: "Bölümler" })
    .getByRole("button", { name: "Bölüm 3", exact: true })
    .click();
  const chapter = reading.locator("#about-chapter-chapter-3");
  await expect(chapter.getByRole("heading")).toBeInViewport();
  await chapter.getByRole("button", { name: /Tam metni oku/ }).click();
  await expect(chapter.getByText("Bölüm 3 tam kaynak metni.")).toBeVisible();
  await chapter.locator(".about-photo").first().click();
  const photoDialog = page.getByRole("dialog", {
    name: "Fotoğraf",
    exact: true,
  });
  await expect(
    photoDialog.getByRole("img", { name: "Bölüm 3 kitap fotoğrafı" }),
  ).toBeVisible();
  await expect(photoDialog).toContainText("Kaynak arşivi izni");
  await photoDialog.getByRole("button", { name: "Kapat", exact: true }).click();
  await expect(reading).toBeVisible();
  await reading
    .getByRole("button", { name: /^Geri: / })
    .click();
  await expect(
    page.getByRole("region", { name: "Eser fotoğraf galerisi" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
