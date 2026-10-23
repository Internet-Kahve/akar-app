import { test, expect } from "@playwright/test";

// WebKit needs the hidden table heading contained by its horizontal scroller.
test.use({
  browserName: "webkit",
  channel: async ({}, use) => {
    await use(undefined);
  },
});

test("admin tables scroll locally without widening the page and keep edit controls reachable", async ({
  page,
}) => {
  await page.goto("/#view=admin");
  await expect(
    page.getByRole("heading", { name: "Eserler", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const edit = page.locator(".table-wrap td button").first();
  await edit.focus();
  await expect(edit).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
