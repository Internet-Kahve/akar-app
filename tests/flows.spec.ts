import { test, expect } from "@playwright/test";
test("discovery, story, memory moderation and persistence form one complete flow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Şehrin hikâyesine karış." }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Eser, şehir veya rota ara" })
    .fill("Kılıç");
  await expect(page.locator(".site-card")).toHaveCount(2);
  await page
    .locator(".site-card-main")
    .filter({ hasText: "Kılıç Ali Paşa Camii" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Kılıç Ali Paşa Camii", level: 1 }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Eseri kaydet", exact: true }).click();
  await page.getByRole("button", { name: "Rotama ekle", exact: true }).click();
  await page.getByRole("button", { name: "Oku", exact: true }).click();
  await page.getByLabel("Sade anlatım").check();
  for (let i = 0; i < 8; i++)
    await page.getByRole("button", { name: "Devam et", exact: true }).click();
  await page.getByRole("button", { name: "Hikâyeyi tamamla" }).click();
  await page.getByRole("button", { name: "Yanındayım", exact: true }).click();
  await page.getByRole("button", { name: "Demo ziyaretini tamamla" }).click();
  await expect(
    page.getByRole("heading", { name: "Demo ziyareti pasaportunda" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pencereyi kapat" }).click();
  await page.getByRole("button", { name: "İz Bırak", exact: true }).click();
  await page
    .getByLabel("Anın", { exact: true })
    .fill("Avludaki ışığı ve sessizliği hatırlayacağım.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Onaya gönder" }).click();
  await expect(page.getByText("Hikâyeye sen de katıldın.")).toBeVisible();
  await page.getByRole("button", { name: "Pencereyi kapat" }).click();
  await page.getByRole("button", { name: "Yaşayan hafıza" }).click();
  await expect(page.getByText("İlk iz senin olsun.")).toBeVisible();
  await page.getByRole("button", { name: "Pencereyi kapat" }).click();
  await page.getByRole("button", { name: "Mirasım profilini aç" }).click();
  await expect(page.getByText("115 keşif puanı")).toBeVisible();
  await page.getByRole("button", { name: "Demo yönetim paneli" }).click();
  await page
    .locator(".admin-nav")
    .getByRole("button", { name: /Katkılar/ })
    .click();
  await page.getByRole("button", { name: "Onayla", exact: true }).click();
  await page
    .locator(".admin-tabs")
    .getByRole("button", { name: /Onaylanan/ })
    .click();
  await expect(
    page.getByText("Avludaki ışığı ve sessizliği hatırlayacağım."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mirasım profilini aç" }).click();
  await expect(page.getByText("140 keşif puanı")).toBeVisible();
  await page.reload();
  await expect(page.getByText("140 keşif puanı")).toBeVisible();
  expect(errors).toEqual([]);
});
test("admin adds an artifact and new content is discoverable", async ({
  page,
}) => {
  await page.goto("/#view=admin");
  await page.getByRole("button", { name: "Yeni eser" }).click();
  await page.getByLabel("Ad", { exact: true }).fill("Demo Vakıf Kütüphanesi");
  await page
    .getByLabel("Kısa açıklama")
    .fill("Yeni eser akışını doğrulayan örnek kayıt.");
  await page.getByLabel("Kaynak / atıf").fill("Ekip demo verisi");
  await page
    .getByRole("combobox", { name: "Durum", exact: true })
    .selectOption("published");
  await page.getByRole("button", { name: "Değişiklikleri kaydet" }).click();
  await expect(
    page.getByRole("cell", { name: "Demo Vakıf Kütüphanesi 0 hikâye bölümü" }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Eser, şehir veya rota ara" })
    .fill("Kütüphane");
  await expect(page.locator(".site-card-main")).toContainText(
    "Demo Vakıf Kütüphanesi",
  );
});
test("quiz explains answers, awards once, history slider and dialogs are keyboard accessible", async ({
  page,
}) => {
  await page.goto("/#view=detail&site=kilic-ali-pasa");
  await page.getByRole("button", { name: "Bulmaca", exact: true }).click();
  for (const answer of [
    "Gelir sağlayan yapı",
    "Topluma hizmet sunmaya",
    "Kaynak doğrulaması bekleyen örnek olarak",
  ]) {
    await page.getByRole("button", { name: new RegExp(answer) }).click();
    await page.getByRole("button", { name: "Cevabı kontrol et" }).click();
    await expect(page.getByText(/Doğru!/)).toBeVisible();
    await page.getByRole("button", { name: /Sonraki soru|Sonucu gör/ }).click();
  }
  await expect(
    page.getByRole("heading", { name: "3 / 3 doğru cevap" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Geçmişi Gör", exact: true }).click();
  const slider = page.getByRole("slider");
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("51");
  await page.getByRole("button", { name: "Mirasım profilini aç" }).click();
  await expect(page.getByText("20 keşif puanı")).toBeVisible();
});
test("responsive layouts do not overflow and Figma assets load locally", async ({
  page,
}, info) => {
  await page.goto("/");
  await expect(page.locator(".route-card")).toHaveCount(3);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/${info.project.name}-discovery.png`,
    fullPage: true,
  });
  await page.goto("/#view=detail&site=kilic-ali-pasa");
  await expect(
    page.getByRole("heading", { name: "Kılıç Ali Paşa Camii", level: 1 }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/${info.project.name}-detail.png`,
    fullPage: true,
  });
  const assets = await page
    .locator('img[src^="/figma/"]')
    .evaluateAll((images) =>
      images.map((i) => ({
        loaded:
          (i as HTMLImageElement).complete &&
          (i as HTMLImageElement).naturalWidth > 0,
        width: (i as HTMLImageElement).width,
      })),
    );
  expect(assets.length).toBeGreaterThan(0);
  expect(assets.every((a) => a.loaded && a.width > 0)).toBe(true);
});

test("route search opens a usable route and selection persists", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "Eser, şehir veya rota ara" })
    .fill("Sinan’ın İzinde");
  await page.getByRole("button", { name: /Sinan’ın İzinde Rota/ }).click();
  await expect(
    page.getByRole("heading", { name: "Sinan’ın İzinde", level: 1 }),
  ).toBeVisible();
  await expect(page.locator(".route-stop-list button")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Rotayı başlat", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Rotamdan çıkar", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Rotamdan çıkar", exact: true }),
  ).toBeVisible();
});
test("map failure keeps the artifact discovery usable", async ({ page }) => {
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.abort(),
  );
  await page.goto("/");
  await expect(page.locator(".fallback-note")).toContainText(
    "Şematik konum görünümü",
  );
  await page
    .locator(".fallback-pin")
    .filter({ hasText: "Kılıç Ali Paşa Camii" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Kılıç Ali Paşa Camii", level: 1 }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Oku", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Bir kaptanın izi" }),
  ).toBeVisible();
});
