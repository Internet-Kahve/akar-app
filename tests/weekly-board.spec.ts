import { expect, test } from "@playwright/test";
import { createSeed } from "../packages/api-client/src/seed";

test("Haftanın Gezgini lists only real travellers: nobody yet says so; the visitor appears only after turning it on", async ({ page }) => {
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
  // No made-up rows (6 Nov 2026): nobody on the list yet, and it says so.
  await expect(board).not.toContainText("Örnek");
  await expect(board.locator(".board-empty")).toContainText("Bu hafta listede kimse yok");
  await expect(board.locator(".board-me")).toHaveText("Listede görünmüyorsun · bu hafta 200 puan");
  await expect(board).not.toContainText("@");

  const toggle = board.getByRole("switch", { name: /Listede görün/ });
  await expect(toggle).not.toBeChecked();
  await toggle.check();
  await expect(board.locator(".board-me")).toHaveText("Senin sıran: 1. · 200 puan");
  await expect(board.locator(".board-champion")).toContainText("Ayşe");
  await expect(board.locator(".board-empty")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".weekly-board").getByRole("switch", { name: /Listede görün/ })).toBeChecked();
  const box = await page.locator(".weekly-board .board-toggle").boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
});
