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
    .fill("Ulucami");
  await expect(page.locator(".site-card")).toHaveCount(1);
  await page.locator(".site-card-main").filter({ hasText: "Ulucami" }).click();
  await expect(
    page.getByRole("heading", { name: "Ulucami", level: 1 }),
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
  await expect(
    page.getByRole("button", { name: /Ulucami Hikâye tamamlandı/ }),
  ).toBeVisible();
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
  await expect(
    page.getByText("Avludaki ışığı ve sessizliği hatırlayacağım."),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Avludaki ışığı ve sessizliği hatırlayacağım."),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("admin photo wizard publishes complete content and persists shared images", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#view=admin");
  await page.getByRole("button", { name: "Yeni eser", exact: true }).click();
  await page.getByRole("button", { name: "Yayınla", exact: true }).click();
  await expect(
    page.getByText("Kapak fotoğrafı seç.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Yayınla ve çık" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "2 Bilgiler" }).click();
  await page
    .getByLabel("Ad (TR)", { exact: true })
    .fill("Demo Vakıf Kütüphanesi");
  await page
    .getByLabel("Kısa tanım (TR)")
    .fill("Yeni eser akışını doğrulayan örnek kayıt.");
  await page
    .getByRole("button", { name: "Kapak fotoğrafı seç", exact: true })
    .click();
  await page.getByLabel("Fotoğraf dosyası").setInputFiles({
    name: "bad.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("invalid"),
  });
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "JPG, PNG veya WebP",
  );
  const photo = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 600;
    c.height = 400;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#22566e";
    ctx.fillRect(0, 0, 600, 400);
    ctx.fillStyle = "#f5f2ea";
    ctx.font = "30px sans-serif";
    ctx.fillText("Demo arşiv görseli", 130, 200);
    return c.toDataURL("image/png").split(",")[1];
  });
  await page.getByLabel("Fotoğraf dosyası").setInputFiles({
    name: "demo.png",
    mimeType: "image/png",
    buffer: Buffer.from(photo, "base64"),
  });
  await expect(page.locator(".upload-preview")).toBeVisible();
  await page
    .getByLabel("Alt metin (zorunlu)")
    .fill("Mavi zeminde demo arşiv başlığı");
  await page.getByLabel("Başlık (TR)", { exact: true }).fill("Arşiv görseli");
  await page
    .getByRole("combobox", { name: "Lisans", exact: true })
    .selectOption("Kendi çekimim");
  await page
    .getByRole("textbox", { name: /^Yeni kaynak başlığı/ })
    .fill("Ekip demo arşivi");
  await page
    .getByRole("button", { name: "Fotoğrafı ekle", exact: true })
    .click();
  await expect(page.locator(".cover-picker img")).toHaveAttribute(
    "alt",
    "Mavi zeminde demo arşiv başlığı",
  );
  await page.getByRole("button", { name: "4 Hikâye" }).click();
  await page.getByRole("button", { name: "Cümle ekle" }).click();
  await page
    .getByLabel("Cümle (TR)", { exact: true })
    .fill("Bu örnek cümle bir fotoğraf ve bir kaynakla birlikte yayınlanır.");
  await page
    .getByRole("button", { name: "Fotoğrafı değiştir", exact: true })
    .click();
  await page.getByRole("button", { name: /Havuzdan seç/ }).click();
  await page.locator(".photo-option").click();
  await page
    .getByRole("button", { name: "Fotoğrafı ekle", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Taslak kaydet", exact: true })
    .click();
  await expect(
    page.getByText("Taslak bu tarayıcıya kaydedildi."),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Demo Vakıf Kütüphanesi düzenle" })
    .click();
  await page.getByRole("button", { name: "5 Yayın" }).click();
  await expect(page.getByText("Türkçe içerik yayın için hazır.")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/${info.project.name}-admin-publish.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Yayınla ve çık" }).click();
  await page
    .locator(".admin-nav")
    .getByRole("button", { name: "Kartlar ve fotoğraflar" })
    .click();
  await page.locator(".photo-option").click();
  await page.getByLabel("Alt metin (zorunlu)").fill("Güncellenen ortak görsel");
  await page.getByRole("button", { name: "Fotoğrafı güncelle" }).click();
  await page
    .getByRole("textbox", { name: "Eser, şehir veya rota ara" })
    .fill("Kütüphane");
  await expect(page.locator(".site-card-main img")).toHaveAttribute(
    "alt",
    "Güncellenen ortak görsel",
  );
  await page.locator(".site-card-main").click();
  await expect(page.locator(".scene-photo")).toHaveAttribute(
    "alt",
    "Güncellenen ortak görsel",
  );
  await page.getByRole("button", { name: "Oku", exact: true }).click();
  await expect(page.locator(".story-text")).toContainText(
    "bir fotoğraf ve bir kaynakla",
  );
  await page.reload();
  await expect(page.locator(".scene-photo")).toHaveAttribute(
    "alt",
    "Güncellenen ortak görsel",
  );
  expect(errors).toEqual([]);
});
test("deferred features are hidden and the empty archive remains keyboard accessible", async ({
  page,
}) => {
  await page.goto("/#view=detail&site=ulu-cami");
  await expect(
    page.getByRole("heading", { name: "Ulucami", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Bulmaca", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Birlikte Gez", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Eser hakkında" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Geçmişi Gör", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Bu eserin eski görüntüsü henüz yok" }),
  ).toBeVisible();
  await expect(page.getByRole("slider")).toHaveCount(0);
  await page.getByRole("button", { name: "Bir fotoğraf paylaş" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Mirasım profilini aç" }).click();
  await expect(page.getByRole("heading", { name: "Mirasım" })).toBeVisible();
  await expect(page.getByText("Keşif rozetlerin")).toHaveCount(0);
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
  await page.goto("/#view=detail&site=ulu-cami");
  await expect(
    page.getByRole("heading", { name: "Ulucami", level: 1 }),
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
    .fill("Akar ve Hayrat");
  await page.getByRole("button", { name: /Akar ve Hayrat Rota/ }).click();
  await expect(
    page.getByRole("heading", { name: "Akar ve Hayrat", level: 1 }),
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
  // Use a deterministic tile failure without depending on the provider's style.
  await page.route("**/harita/akar-style.json", (route) =>
    route.fulfill({
      json: {
        version: 8,
        sources: {
          offline: {
            type: "raster",
            tiles: ["https://tiles.openfreemap.org/unavailable/{z}/{x}/{y}.png"],
            tileSize: 256,
          },
        },
        layers: [{ id: "offline", type: "raster", source: "offline" }],
      },
    }),
  );
  await page.route("https://tiles.openfreemap.org/**", (route) =>
    route.abort(),
  );
  await page.goto("/");
  // MapLibre can emit load after error. Markers prove that load was handled;
  // the fallback must still be present instead of disappearing during a click.
  await expect(page.locator(".map-marker")).toHaveCount(6);
  await expect(page.locator(".fallback-note")).toContainText(
    "Harita yüklenemedi · Şematik konum görünümü",
  );
  await page.locator(".fallback-pin").filter({ hasText: "Ulucami" }).click();
  await expect(
    page.getByRole("heading", { name: "Ulucami", level: 1 }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Oku", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Bursa’da bir başlangıç" }),
  ).toBeVisible();
});

test("experimental UI can be inspected without enabling it for the main journey", async ({
  page,
}) => {
  await page.goto("/#view=profile");
  await page.getByLabel("Deneysel arayüzleri göster").check();
  await expect(page.getByText("Keşif rozetlerin")).toBeVisible();
  await page.getByRole("button", { name: /Keşfe başla/ }).click();
  await page.getByRole("button", { name: "Bulmaca", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Birlikte Gez", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Senkron sesli tur");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Mirasım profilini aç" }).click();
  await page.getByLabel("Deneysel arayüzleri göster").uncheck();
  await expect(page.getByText("Keşif rozetlerin")).toHaveCount(0);
});

test("desktop narration layouts preserve the active story and player instance", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "desktop", "Desktop comparison only");
  await page.goto("/#view=detail&site=ulu-cami");
  await page.getByRole("button", { name: "Oku", exact: true }).click();
  await page.getByRole("button", { name: "Devam et", exact: true }).click();
  const text = await page.locator(".story-text").innerText();
  await page
    .locator(".story-panel")
    .evaluate((el) => el.setAttribute("data-player-check", "same"));
  await page.getByRole("button", { name: "Altyazı", exact: true }).click();
  await expect(page.locator(".workspace")).toHaveClass(/story-subtitle/);
  await expect(page.locator(".story-text")).toHaveText(text);
  await expect(page.locator(".story-panel")).toHaveAttribute(
    "data-player-check",
    "same",
  );
  await page.screenshot({
    path: "test-results/desktop-narration-subtitle.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Panel", exact: true }).click();
  await expect(page.locator(".story-text")).toHaveText(text);
  await page.screenshot({
    path: "test-results/desktop-narration-panel.png",
    fullPage: true,
  });
});

test("admin imports drafts and persists route stop order", async ({ page }) => {
  await page.goto("/#view=admin");
  await page
    .locator(".admin-nav")
    .getByRole("button", { name: "İçe aktar" })
    .click();
  await page.getByLabel("Envanter dosyası").setInputFiles({
    name: "inventory.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify([
        {
          ad: "Test Çeşmesi",
          ilce: "Osmangazi",
          tur: "Çeşme",
          enlem: 40.184,
          boylam: 29.06,
        },
        { ad: "Konumsuz eser", ilce: "Osmangazi", tur: "cami" },
      ]),
    ),
  });
  await page.getByLabel("Envanter kaynağı").fill("Test envanteri");
  await expect(page.getByText("1 hazır", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Taslak olarak içe aktar (1)" })
    .click();
  await expect(
    page.getByText("1 eser taslak olarak içe aktarıldı."),
  ).toBeVisible();
  await page
    .locator(".admin-nav")
    .getByRole("button", { name: /Eserler/ })
    .click();
  await expect(
    page.getByRole("row").filter({ hasText: "Test Çeşmesi" }),
  ).toContainText("Taslak");
  await page
    .locator(".admin-nav")
    .getByRole("button", { name: "Rotalar", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Akar ve Hayrat rotasını düzenle" })
    .click();
  const before = await page.locator(".admin-stops strong").allTextContents();
  await page
    .getByRole("button", { name: /yukarı taşı/ })
    .last()
    .click();
  await expect(page.locator(".admin-stops strong").first()).not.toHaveText(
    before[0],
  );
  await page.getByRole("button", { name: "Yayınla", exact: true }).click();
  await expect(page.getByText("Rota kaydedildi.")).toBeVisible();
  await page.reload();
  await page
    .locator(".admin-nav")
    .getByRole("button", { name: "Rotalar", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Akar ve Hayrat rotasını düzenle" })
    .click();
  await expect(page.locator(".admin-stops strong").first()).not.toHaveText(
    before[0],
  );
});

test("map markers stay attached during animated zoom and panel resize", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  // Isolate projection/DOM positioning from external tile availability; use real MapLibre.
  await page.route("**/harita/akar-style.json", (route) =>
    route.fulfill({
      json: {
        version: 8,
        sources: {},
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#F5F2EA" },
          },
        ],
      },
    }),
  );
  await page.goto("/");
  await expect(page.locator(".map-marker")).toHaveCount(6);
  const measure = () =>
    page.evaluate(async () => {
      let worst = 0,
        frames = 0;
      const until = performance.now() + 700;
      while (performance.now() < until) {
        await new Promise(requestAnimationFrame);
        const canvas = document
          .querySelector(".map-canvas")!
          .getBoundingClientRect();
        for (const el of document.querySelectorAll<HTMLElement>(
          ".map-marker",
        )) {
          const match = el.style.transform.match(
            /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/,
          );
          if (!match) throw new Error("MapLibre marker projection is missing");
          const rect = el.getBoundingClientRect();
          worst = Math.max(
            worst,
            Math.abs(
              rect.left + rect.width / 2 - canvas.left - Number(match[1]),
            ),
            Math.abs(rect.bottom - canvas.top - Number(match[2])),
          );
        }
        frames++;
      }
      return { worst, frames };
    });
  const zoom = measure();
  await page.getByRole("button", { name: "Yakınlaştır", exact: true }).click();
  const sample = await zoom;
  expect(sample.frames).toBeGreaterThan(5);
  expect(sample.worst).toBeLessThan(1.1);
  const out = measure();
  await page.getByRole("button", { name: "Uzaklaştır", exact: true }).click();
  expect((await out).worst).toBeLessThan(1.1);
  await page.getByRole("button", { name: "Paneli kapat", exact: true }).click();
  expect((await measure()).worst).toBeLessThan(1.1);
  await page.getByRole("button", { name: "Paneli aç", exact: true }).click();
  const pin = page.getByRole("button", { name: "Ulucami haritada aç" });
  await pin.click();
  await expect(
    page.getByRole("heading", { name: "Ulucami", level: 1 }),
  ).toBeVisible();
});
