import { expect, test } from "@playwright/test";
import { createSeed } from "../packages/api-client/src/seed";

test("Haftanın Gezgini in the demo: sample rows tagged «Örnek», the first and a podium; the visitor appears only after turning it on", async ({ page }) => {
  const snapshot = createSeed();
  snapshot.points = 200;
  snapshot.name = "Ayşe";
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript((data) => {
    if (!localStorage.getItem("akar-demo-bursa-v1")) localStorage.setItem("akar-demo-bursa-v1", JSON.stringify(data));
    for (const id of ["profil.avatar", "masa.profil.avatar", "profil.ad", "masa.profil.ad"]) localStorage.setItem(`akar.ipucu.${id}`, "1");
  }, snapshot);
  await page.goto("/#view=profile");
  const board = page.locator(".weekly-board");
  await expect(board.getByRole("heading", { name: "Haftanın Gezgini" })).toBeVisible();
  await expect(board).toContainText("Örnek");
  await expect(board.locator(".board-champion")).toContainText("Elif");
  await expect(board.locator(".board-podium li")).toHaveCount(3);
  await expect(board.locator(".board-me")).toHaveText("Listede görünmüyorsun · bu hafta 200 puan");
  await expect(board).not.toContainText("@");

  const toggle = board.getByRole("switch", { name: /Listede görün/ });
  await expect(toggle).not.toBeChecked();
  await toggle.check();
  await expect(board.locator(".board-me")).toHaveText("Senin sıran: 3. · 200 puan");
  await expect(board.locator(".board-podium")).toContainText("Ayşe");
  await page.reload();
  await expect(page.locator(".weekly-board").getByRole("switch", { name: /Listede görün/ })).toBeChecked();
  const box = await page.locator(".weekly-board .board-toggle").boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
});
