import { expect, test } from "@playwright/test";

test("model placement: rotate and nudge, save, reopen with the values kept, hide and keep the placement", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // The form is what is under test; the preview map works offline too (it says so).
  await page.route("https://tiles.openfreemap.org/**", (r) => r.abort());
  await page.route("https://server.arcgisonline.com/**", (r) => r.abort());
  await page.goto("/#view=admin");
  await page.getByRole("button", { name: "Ulucami düzenle" }).click();

  const section = page.getByRole("region", { name: "Haritada göster" });
  await expect(section).toBeVisible();
  await expect(page.getByText("87.280 üçgen")).toBeVisible();
  await expect(section.getByText("Yön: 174°")).toBeVisible();

  await section.getByRole("button", { name: "90° döndür" }).click();
  await expect(section.getByText("Yön: 264°")).toBeVisible();
  const position = section.getByText(/^Konum:/);
  const before = await position.textContent();
  await section.getByRole("button", { name: "Kuzeye 0,5 m" }).click();
  await expect(position).not.toHaveText(before!);
  const nudged = await position.textContent();
  // Arrow keys move the model too.
  await section.getByRole("group", { name: /Yerleşim önizlemesi/ }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(position).toHaveText(before!);
  await page.keyboard.press("ArrowUp");
  await expect(position).toHaveText(nudged!);
  await section.getByLabel("Yükseklik (m)").fill("3");
  await expect(section.getByLabel("Ana parça")).toHaveValue("Govde");
  await section.getByLabel("Ana parça").selectOption("Minare_1");
  const anchor = "Minare_1";
  await expect(section.getByText("Kaydedilmemiş yerleşim")).toBeVisible();

  await section.getByRole("button", { name: "Yerleşimi kaydet" }).click();
  await expect(section.getByText("Yerleşim kaydedildi.")).toBeVisible();
  await expect(section.getByText("Kaydedilmemiş yerleşim")).toHaveCount(0);

  // Leave and reopen: everything is still there.
  await page.locator(".editor-header .back").click();
  await page.getByRole("button", { name: "Ulucami düzenle" }).click();
  await expect(section.getByText("Yön: 264°")).toBeVisible();
  await expect(position).toHaveText(nudged!);
  await expect(section.getByLabel("Yükseklik (m)")).toHaveValue("3");
  await expect(section.getByLabel("Ana parça")).toHaveValue(anchor);

  // Scale is locked until asked for; "visible" off keeps the placement.
  await section.getByText("Gelişmiş").click();
  await expect(section.getByLabel("Ölçek")).toBeDisabled();
  await section.getByLabel(/Ölçeği değiştir/).check();
  await expect(section.getByLabel("Ölçek")).toBeEnabled();
  await section.getByLabel(/Ölçeği değiştir/).uncheck();
  await section.getByLabel("Ziyaretçilerin haritasında göster").uncheck();
  await section.getByRole("button", { name: "Yerleşimi kaydet" }).click();
  await expect(section.getByText("Yerleşim kaydedildi.")).toBeVisible();
  const stored = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("akar-demo-bursa-v1")!).sites.find(
        (s: { id: string }) => s.id === "ulu-cami",
      ).model.placement,
  );
  expect(stored).toMatchObject({
    visible: false,
    headingDeg: 264,
    altitudeM: 3,
    anchorNode: anchor,
  });

  await page.locator(".editor-header .back").click();
  await page.getByRole("button", { name: "Ulucami düzenle" }).click();
  await section.getByText("Gelişmiş").click();
  await expect(
    section.getByLabel("Ziyaretçilerin haritasında göster"),
  ).not.toBeChecked();
  await expect(section.getByText("Yön: 264°")).toBeVisible();
  await expect(position).toHaveText(nudged!);

  // Shown again, the same values are drawn.
  await section.getByLabel("Ziyaretçilerin haritasında göster").check();
  await section.getByRole("button", { name: "Yerleşimi kaydet" }).click();
  await expect(section.getByText("Yerleşim kaydedildi.")).toBeVisible();
  expect(errors).toEqual([]);
});

test("a new site's placement is saved once the site and its model are saved", async ({
  page,
}) => {
  await page.route("https://tiles.openfreemap.org/**", (r) => r.abort());
  await page.goto("/#view=admin");
  await page.getByRole("button", { name: "Yeni eser", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Haritada göster" }),
  ).toHaveCount(0);
  await page
    .getByLabel("Model dosyası")
    .setInputFiles("apps/web/public/demo-models/bedesten.glb");

  const section = page.getByRole("region", { name: "Haritada göster" });
  await expect(section).toBeVisible();
  await expect(
    section.getByText(/önce eseri taslak olarak kaydet/),
  ).toBeVisible();
  await expect(
    section.getByRole("button", { name: "Yerleşimi kaydet" }),
  ).toBeDisabled();
  await section.getByRole("button", { name: "90° döndür" }).click();
  await expect(section.getByText("Yön: 90°")).toBeVisible();

  // Saving the site also sends the placement that was still open.
  await page.getByRole("button", { name: "2 Bilgiler" }).click();
  await page
    .getByLabel("Ad (TR)", { exact: true })
    .fill("Yerleşim deneme hanı");
  await page.getByRole("button", { name: "1 Model" }).click();
  await page.getByRole("button", { name: "Taslak kaydet" }).click();
  await expect(
    page.getByText("Taslak bu tarayıcıya kaydedildi."),
  ).toBeVisible();
  await expect(section.getByText("Yerleşim kaydedildi.")).toBeVisible();
  await expect(
    section.getByText(/önce eseri taslak olarak kaydet/),
  ).toHaveCount(0);
  await expect(
    section.getByRole("button", { name: "Yerleşimi kaydet" }),
  ).toBeEnabled();
  await expect(section.getByText("Kaydedilmemiş yerleşim")).toHaveCount(0);

  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("akar-demo-bursa-v1")!).sites.find(
      (s: { name: string }) => s.name === "Yerleşim deneme hanı",
    ),
  );
  expect(stored.status).toBe("draft");
  expect(stored.model.placement).toMatchObject({
    headingDeg: 90,
    visible: true,
  });
});
