import { test, expect } from "@playwright/test";

test("admin finds a member, confirms a role change and removes access on desktop and mobile", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#view=admin");
  await page
    .getByRole("button", { name: "Üyeler ve roller", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Üyeler ve roller" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "yonetici@example.com için rolü düzenle",
    }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", {
      name: "bekleyen@example.com için rolü düzenle",
    }),
  ).toBeDisabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByLabel("E-posta ile üye ara").fill("uye@example.com");
  await page.getByRole("button", { name: "Ara", exact: true }).click();
  const row = page.getByRole("row").filter({ hasText: "uye@example.com" });
  await expect(row).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(2);
  await row.getByRole("button", { name: "Rolü düzenle", exact: false }).click();
  const dialog = page.getByRole("dialog", { name: "Üye rolünü değiştir" });
  await expect(
    dialog.getByRole("button", { name: "Değişikliği onayla" }),
  ).toBeDisabled();
  await dialog.getByLabel("Yeni rol").selectOption("admin");
  await expect(dialog.getByText(/diğer üyeleri yönetebilecek/)).toBeVisible();
  // Selecting alone never commits a role; cancellation leaves the row unchanged.
  await dialog.getByRole("button", { name: "Vazgeç" }).click();
  await expect(row.getByText("Üye", { exact: true })).toBeVisible();
  await row.getByRole("button").click();
  await dialog.getByLabel("Yeni rol").selectOption("admin");
  await dialog.getByRole("button", { name: "Değişikliği onayla" }).click();
  await expect(dialog).toBeHidden();
  await expect(row.getByText("Yönetici", { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    "Yönetici olarak güncellendi",
  );
  await page.screenshot({
    path: `test-results/${info.project.name}-admin-members.png`,
    fullPage: true,
  });
  await row.getByRole("button").click();
  await dialog.getByLabel("Yeni rol").selectOption("user");
  await expect(dialog.getByText(/hesabı ve katkıları korunacak/)).toBeVisible();
  await dialog.getByRole("button", { name: "Değişikliği onayla" }).click();
  await expect(row.getByText("Üye", { exact: true })).toBeVisible();
  await page.getByLabel("E-posta ile üye ara").fill("bulunamayan@akar.test");
  await page.getByRole("button", { name: "Ara", exact: true }).click();
  await expect(page.getByText("Aramana uygun üye bulunamadı.")).toBeVisible();
  expect(errors).toEqual([]);
});
