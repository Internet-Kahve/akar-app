import { build } from "esbuild";
import { expect, test, type Route } from "@playwright/test";

let bundle: string;
test.beforeAll(async () => {
  const result = await build({
    entryPoints: ["tests/support/site-progress.tsx"],
    bundle: true,
    write: false,
    platform: "browser",
    format: "iife",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"test"' },
  });
  bundle = result.outputFiles[0]!.text;
});

const result = (badgeId: string) => ({
  tasks: [],
  badges: [
    {
      badgeId,
      siteId: "ulu-cami",
      onSite: false,
      earnedAt: "2026-10-30T00:00:00Z",
    },
  ],
});

for (const action of [
  "Refresh",
  "Sign out",
  "Switch account",
  "Snapshot loaded",
]) {
  test(`delayed progress cannot replace a newer ${action}`, async ({
    page,
  }) => {
    await page.route("**/progress-harness", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<div id="root"></div><script src="/progress-harness.js"></script>',
      }),
    );
    await page.route("**/progress-harness.js", (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: bundle,
      }),
    );
    let count = 0;
    let pending: Route | undefined;
    await page.route("**/progress?*", async (route) => {
      count++;
      if (count === 2) {
        pending = route;
        return;
      }
      await route.fulfill({ json: result(count === 1 ? "initial" : "latest") });
    });
    await page.goto("/progress-harness");
    const badges = page.getByLabel("Badges");
    await expect(badges).toHaveText("initial");
    await page.getByRole("button", { name: "Refresh", exact: true }).click();
    await expect.poll(() => !!pending).toBe(true);
    await page.getByRole("button", { name: action, exact: true }).click();
    const expected = action === "Sign out" ? "none" : "latest";
    await expect(badges).toHaveText(expected);
    await pending!.fulfill({ json: result("stale-private-badge") });
    await expect(page.getByLabel("Settled refreshes")).toHaveText(
      action === "Refresh" ? "2" : "1",
    );
    await expect(badges).toHaveText(expected);
  });
}
