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
  // The tasks open from the panel's «Bulmaca» row.
  await page.getByRole("button", { name: /^Bulmaca/ }).click();
  await expect(page.getByRole("heading", { name: "Görevler" })).toBeVisible();
  return errors;
}

test("the question can be retried, hints come one by one, a right answer earns the badge, and no point is mentioned; the field task is finished from home by tapping the part", async ({
  page,
}) => {
  const errors = await openUlucami(page);
  const earned = page.locator(".badge-item.earned");
  await expect(page.locator(".badge-item.locked")).toHaveCount(3);
  await expect(earned).toHaveCount(0);

  await page.getByRole("button", { name: /Minberin sırrı/ }).click();
  const quiz = page.getByRole("dialog", { name: "Minberin sırrı" });
  await expect(quiz).toContainText("Ulucami'nin ahşap minberi hangi teknikle");
  await quiz.getByRole("button", { name: /Çini/ }).click();
  await quiz.getByRole("button", { name: "Cevabı kontrol et" }).click();
  await expect(quiz).toContainText("Tekrar dene.");
  await expect(quiz.getByRole("alert")).toHaveCount(0);
  await expect(quiz.getByRole("button", { name: /Çini/ })).toBeDisabled();

  await expect(quiz.locator(".hint")).toHaveCount(0);
  await quiz.getByRole("button", { name: /İpucu al \(1\/2\)/ }).click();
  await expect(quiz.locator(".hint")).toHaveCount(1);
  await expect(quiz.locator(".hint")).toContainText("çivi ya da tutkal yok");
  await quiz.getByRole("button", { name: /İpucu al \(2\/2\)/ }).click();
  await expect(quiz.locator(".hint")).toHaveCount(2);
  await expect(quiz.getByRole("button", { name: /İpucu al/ })).toHaveCount(0);

  await quiz.getByRole("button", { name: /Kündekâri/ }).click();
  await quiz.getByRole("button", { name: "Cevabı kontrol et" }).click();
  await expect(quiz).toContainText("Kündekâri: ahşap parçalar çivi, tutkal");
  await expect(quiz).toContainText("Kaynak: E cilt-1 PDF s.27");
  await expect(quiz).toContainText("Doğrulanmış");
  await expect(quiz).toContainText("Yeni rozet: Kündekâri");
  expect((await quiz.innerText()).toLocaleLowerCase("tr-TR")).not.toMatch(
    /puan/,
  );
  await quiz.getByRole("button", { name: "Tamam" }).click();
  // The task window replaced the list; the list opens again from the row.
  await page.getByRole("button", { name: /^Bulmaca/ }).click();
  await expect(earned).toHaveCount(1);
  await expect(earned).toContainText("Kündekâri");
  await expect(
    page.getByRole("button", { name: /Minberin sırrı.*Tamamlandı/ }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Sahaflar Kapısı/ }).click();
  const field = page.getByRole("dialog", { name: "Sahaflar Kapısı" });
  await expect(field).toContainText("Caminin kuzey cephesindeki mermer taç kapı");
  await field.getByRole("button", { name: "Evden yap" }).click();
  await expect(field).toHaveCount(0);
  const bar = page.locator(".task-pick-bar");
  await expect(bar).toContainText("3D modelde Sahaflar Kapısı'na dokun.");
  await expect(page.locator(".model-status")).toHaveCount(0);
  const canvas = page.locator(".model-viewer canvas");
  await expect(canvas).toBeVisible();
  await canvas.click();
  await expect(bar).toHaveCount(0);
  const done = page.getByRole("dialog", { name: "Sahaflar Kapısı" });
  await expect(done).toContainText("Ulucami'ye üç kapıdan girilir");
  await expect(done).toContainText("Yeni rozet: Sahaflar Kapısı");
  // From home: no «Yerinde» tag in the result.
  await expect(done.locator(".task-result-meta")).not.toContainText("Yerinde");
  expect((await done.innerText()).toLocaleLowerCase("tr-TR")).not.toMatch(
    /puan/,
  );
  await done.getByRole("button", { name: "Tamam" }).click();
  await page.getByRole("button", { name: /^Bulmaca/ }).click();
  await expect(earned).toHaveCount(2);
  await expect(page.locator(".badge-item.earned", { hasText: "Yerinde" })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("on site the position decides: too far gets a friendly message, near the site finishes the task and marks the badge «Yerinde»", async ({
  page,
  context,
}) => {
  const errors = await openUlucami(page);
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 40.2, longitude: 29.1 });

  await page.getByRole("button", { name: /Sahaflar Kapısı/ }).click();
  const field = page.getByRole("dialog", { name: "Sahaflar Kapısı" });
  await field.getByRole("button", { name: "Buradayım" }).click();
  await expect(field).toContainText("yakınında görünmüyorsun");
  await expect(field.getByRole("alert")).toHaveCount(0);
  await expect(page.locator(".badge-item.earned")).toHaveCount(0);

  await context.setGeolocation({ latitude: 40.184, longitude: 29.0619 });
  await field.getByRole("button", { name: "Buradayım" }).click();
  await expect(field).toContainText("Ulucami'ye üç kapıdan girilir");
  await expect(field.locator(".task-result-meta")).toContainText("Yerinde");
  await expect(field).toContainText("Yeni rozet: Sahaflar Kapısı");
  await field.getByRole("button", { name: "Tamam" }).click();
  await page.getByRole("button", { name: /^Bulmaca/ }).click();
  await expect(
    page.locator(".badge-item.earned", { hasText: "Yerinde" }),
  ).toHaveCount(1);
  expect(errors).toEqual([]);
});
