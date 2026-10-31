import { expect, test, type Page } from "@playwright/test";
import { createSeed } from "../packages/api-client/src/seed";
import { triangleGlb } from "./support/triangle-glb";

/** Ulucami with a one-part model named like the real task's part, so the 3D pick can be driven by a click. */
async function openUlucami(page: Page) {
  const snapshot = createSeed();
  const site = snapshot.sites[0]!;
  site.model = {
    src: "/task-model.glb",
    name: "Task model",
    bytes: 0,
    parts: ["Tac_Kapi"],
    trust: "representative",
  };
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(
    (data) => localStorage.setItem("akar-demo-bursa-v1", JSON.stringify(data)),
    snapshot,
  );
  await page.route("**/task-model.glb", (route) =>
    route.fulfill({
      contentType: "model/gltf-binary",
      body: triangleGlb("Tac_Kapi"),
    }),
  );
  await page.goto("/#view=detail&site=ulu-cami");
  return errors;
}

const puzzleRow = (page: Page) => page.getByRole("button", { name: /^Bulmaca/ });

test("the question can be retried, hints come one by one, a right answer earns the badge, and no point is mentioned; the field task is finished from home by tapping the part", async ({
  page,
}) => {
  const errors = await openUlucami(page);
  await puzzleRow(page).click();
  const quiz = page.getByRole("dialog", { name: "Bulmaca" });
  await expect(quiz).toContainText("Ulucami'nin ahşap minberi hangi teknikle");
  await expect(quiz.getByRole("button", { name: "Cevapla" })).toBeDisabled();
  await expect(quiz.locator(".gv-ipucu-metin")).toHaveCount(0);
  await quiz.getByRole("radio", { name: "Çini" }).click();
  await quiz.getByRole("button", { name: "Cevapla" }).click();
  // A wrong answer opens the next hint on its sheet.
  await expect(quiz.locator(".gv-sayfa")).toContainText("Tam değil, bir daha bak");
  await expect(quiz.locator(".gv-sayfa")).toContainText("İpucu 1 açıldı:");
  await quiz.getByRole("button", { name: "Tekrar dene" }).click();
  await expect(quiz.locator(".gv-ipucu-metin")).toHaveCount(1);
  await expect(quiz.locator(".gv-ipucu-metin")).toContainText("çivi ya da tutkal yok");
  await quiz.getByRole("button", { name: "İpucu 2" }).click();
  await expect(quiz.locator(".gv-ipucu-metin")).toHaveCount(2);

  await quiz.getByRole("radio", { name: "Kündekâri" }).click();
  await quiz.getByRole("button", { name: "Cevapla" }).click();
  const sheet = quiz.locator(".gv-sayfa");
  await expect(sheet).toContainText("Doğru! Kündekâri.");
  await expect(sheet).toContainText("Kündekâri: ahşap parçalar çivi, tutkal");
  await expect(sheet).toContainText("Kaynak: E cilt-1 PDF s.27");
  await expect(sheet).toContainText("Doğrulanmış");
  await expect(sheet).toContainText("Rozet profiline eklendi");
  expect((await quiz.innerText()).toLocaleLowerCase("tr-TR")).not.toMatch(/puan/);

  await quiz.getByRole("button", { name: /Sonraki görev · 2\/2/ }).click();
  const field = page.getByRole("dialog", { name: "Saha görevi" });
  await expect(field).toContainText("Sahaflar Kapısı");
  await field.getByRole("button", { name: "3D modelde bul" }).click();
  await expect(field).toHaveCount(0);
  const bar = page.locator(".task-pick-bar");
  await expect(bar).toContainText("3D modelde Sahaflar Kapısı'na dokun.");
  await expect(page.locator(".model-status")).toHaveCount(0);
  const canvas = page.locator(".model-viewer canvas");
  await expect(canvas).toBeVisible();
  await canvas.click();
  await expect(bar).toHaveCount(0);
  const done = page.getByRole("dialog", { name: "Saha görevi" });
  await expect(done.locator(".gv-sayfa")).toContainText("Buldun! Sahaflar Kapısı.");
  await expect(done.locator(".gv-sayfa")).toContainText("Ulucami'ye üç kapıdan girilir");
  await expect(done.locator(".gv-sayfa")).toContainText("Rozet profiline eklendi");
  // From home: no «Yerinde» tag in the result.
  await expect(done.locator(".gv-yerinde")).toHaveCount(0);
  // Finishing returns to the site, whose row shows the progress.
  await done.getByRole("button", { name: /sayfasına dön/ }).click();
  await expect(done).toHaveCount(0);
  await expect(puzzleRow(page)).toContainText("2 görevin hepsi tamam");
  expect(errors).toEqual([]);
});

test("on site the position decides: too far gets a friendly message, near the site finishes the task with the «Yerinde» tag", async ({
  page,
  context,
}) => {
  const errors = await openUlucami(page);
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 40.2, longitude: 29.1 });

  await puzzleRow(page).click();
  const dialog = page.getByRole("dialog", { name: "Bulmaca" });
  await dialog.getByRole("button", { name: "Bu soruyu atla" }).click();
  const field = page.getByRole("dialog", { name: "Saha görevi" });
  await field.getByRole("button", { name: "Buradayım" }).click();
  await expect(page.getByText("yakınında görünmüyorsun")).toBeVisible();

  await context.setGeolocation({ latitude: 40.184, longitude: 29.0619 });
  await field.getByRole("button", { name: "Buradayım" }).click();
  await expect(field.locator(".gv-sayfa")).toContainText("Ulucami'ye üç kapıdan girilir");
  await expect(field.locator(".gv-yerinde")).toContainText("Yerinde");
  await expect(field.locator(".gv-sayfa")).toContainText("Rozet profiline eklendi");
  expect(errors).toEqual([]);
});

test("Escape closes the puzzle back to the site", async ({
  page,
}) => {
  await openUlucami(page);
  await puzzleRow(page).click();
  const dialog = page.getByRole("dialog", { name: "Bulmaca" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(puzzleRow(page)).toBeFocused();
});
