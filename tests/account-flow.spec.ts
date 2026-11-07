import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import { expect, test, type Page } from "@playwright/test";

let bundle: string;
let css: string;
const user = {
  id: "00000000-0000-0000-0000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: "ayse@example.test",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-01-01T00:00:00Z",
};
const session = {
  access_token: "test-access",
  refresh_token: "test-refresh",
  token_type: "bearer",
  expires_in: 3600,
  user,
};

test.beforeAll(async () => {
  const result = await build({
    entryPoints: ["tests/support/account-flow.tsx"],
    bundle: true,
    write: false,
    platform: "browser",
    format: "iife",
    jsx: "automatic",
    define: {
      "process.env.NODE_ENV": '"test"',
      "process.env.NEXT_PUBLIC_API_URL": '"http://127.0.0.1:3000/account-api"',
      "process.env.NEXT_PUBLIC_SUPABASE_URL":
        '"http://127.0.0.1:3000/account-auth"',
      "process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY": '"test-anon"',
      "process.env.NEXT_PUBLIC_DEMO_CONTENT": '""',
    },
  });
  bundle = result.outputFiles[0]!.text;
  css = (
    await Promise.all(
      [
        "packages/design-tokens/tokens.css",
        "apps/web/src/app/globals.css",
        "apps/web/src/app/design.css",
        "apps/web/src/app/theme.css",
        "apps/web/src/app/badges.css",
      ].map((path) => readFile(path, "utf8")),
    )
  ).join("\n");
});

async function setup(page: Page) {
  const state = { points: 180, failBoard: false, boardReads: 0, boardAuth: "" };
  await page.addInitScript(() => {
    const get = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key) {
      return key.startsWith("akar.ipucu.") ? "1" : get.call(this, key);
    };
  });
  await page.route(/^http:\/\/127\.0\.0\.1:3000\/(\?.*)?$/, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<html lang="tr"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/account-harness.css"><div id="root"></div><script src="/account-harness.js"></script></html>',
    }),
  );
  await page.route("**/account-harness.js", (route) =>
    route.fulfill({ contentType: "text/javascript", body: bundle }),
  );
  await page.route("**/account-harness.css", (route) =>
    route.fulfill({ contentType: "text/css", body: css }),
  );
  await page.route("**/account-auth/auth/v1/**", (route) =>
    route.fulfill({
      json: route.request().url().includes("/user") ? user : session,
    }),
  );
  await page.route("**/account-api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace(
      "/account-api",
      "",
    );
    const auth = route.request().headers().authorization;
    let json: unknown = { items: [], nextCursor: null };
    if (path === "/v1/me")
      json = {
        id: user.id,
        role: "user",
        displayName: "Ayşe",
        leaderboardVisible: true,
        preferences: { siteLang: "tr", voiceLang: null, voiceGender: null },
      };
    if (path === "/v1/me/passport")
      json = {
        points: state.points,
        saved: [],
        read: [],
        visited: [],
        quizzesSolved: [],
      };
    if (path === "/v1/me/route") json = { siteIds: [] };
    if (path === "/v1/me/site-progress") json = { tasks: [], badges: [] };
    if (path === "/v1/map-settings") json = {};
    if (path === "/v1/leaderboard/week") {
      state.boardReads++;
      state.boardAuth = auth ?? "";
      if (state.failBoard)
        return route.fulfill({
          status: 503,
          json: { error: { code: "UNAVAILABLE", message: "Try again" } },
        });
      json = {
        weekStart: "2026-11-01T21:00:00.000Z",
        items: [
          { rank: 1, name: "Deniz", avatarId: null, points: 360 },
          { rank: 2, name: "Ece", avatarId: null, points: 240 },
        ],
        me: auth
          ? {
              rank: state.points > 0 ? 12 : null,
              points: state.points,
              visible: true,
            }
          : null,
      };
    }
    await route.fulfill({ json });
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  return state;
}

async function passwordSignIn(page: Page) {
  const dialog = page.getByRole("dialog", { name: "Giriş yap", exact: true });
  await dialog.getByLabel("E-posta", { exact: true }).fill(user.email);
  await dialog.getByLabel("Şifre", { exact: true }).fill("test-password");
  await dialog.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/#view=map$/);
}

test("a guest opens sign-in over the map; after signing in the icon opens the profile and shows others and their own score", async ({
  page,
}, testInfo) => {
  await page.clock.install();
  const state = await setup(page);
  await page.goto("/#view=map");
  await expect(page.locator(".opening")).toHaveCount(0);
  await page.getByRole("button", { name: "Mirasım profilini aç" }).click();
  const dialog = page.getByRole("dialog", { name: "Giriş yap", exact: true });
  await expect(dialog).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("map-sign-in.png") });
  await expect(page.locator(".map-keep")).toBeVisible();
  await expect(page).toHaveURL(/#view=map$/);
  await dialog.getByRole("button", { name: "Vazgeç" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator(".map-keep")).toBeVisible();
  await page.getByRole("button", { name: "Mirasım profilini aç" }).click();
  await passwordSignIn(page);
  await page.getByRole("button", { name: "Mirasım profilini aç" }).click();
  await expect(
    page.getByRole("heading", { name: "Mirasım", exact: true }),
  ).toBeVisible();
  const board = page.locator(".weekly-board");
  await expect(board.locator(".board-champion")).toContainText("Deniz");
  await expect(board.locator(".board-champion")).toContainText("360 puan");
  await expect(board.locator(".board-podium")).toContainText("Ece");
  await expect(board.locator(".board-me")).toHaveText(
    "Senin sıran: 12. · 180 puan",
  );
  expect(state.boardAuth).toBe("Bearer test-access");
  state.points = 195;
  await board.getByRole("button", { name: "Puanları yenile" }).click();
  await expect(board.locator(".board-me")).toContainText("195 puan");
  state.points = 210;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(board.locator(".board-me")).toContainText("210 puan");
  state.failBoard = true;
  await board.getByRole("button", { name: "Puanları yenile" }).click();
  await expect(board).toContainText("Liste yüklenemedi.");
  await expect(board.locator(".board-me")).toHaveCount(0);
  state.failBoard = false;
  await board.getByRole("button", { name: "Yeniden dene" }).click();
  await expect(board.locator(".board-me")).toContainText("210 puan");
  state.points = 225;
  await page.clock.fastForward(31_000);
  await expect(board.locator(".board-me")).toContainText("225 puan");
  await board.screenshot({ path: testInfo.outputPath("leaderboard.png") });
  state.points = 0;
  await board.getByRole("button", { name: "Puanları yenile" }).click();
  await expect(board.locator(".board-me")).toHaveText(
    "Bu hafta 0 puan · Puan kazanınca sıran görünür.",
  );
});

test("Google uses a persistent callback marker and its token return finishes on the map", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/#view=map");
  await expect(page.locator(".opening")).toHaveCount(0);
  await page.getByRole("button", { name: "Mirasım profilini aç" }).click();
  await page.route("**/account-auth/auth/v1/authorize?**", async (route) => {
    const requested = new URL(route.request().url());
    expect(requested.searchParams.get("redirect_to")).toBe(
      "http://127.0.0.1:3000/?auth=callback",
    );
    await route.fulfill({
      contentType: "text/html",
      body: '<script>location.replace("/?auth=callback#access_token=test-access&refresh_token=test-refresh&token_type=bearer&expires_in=3600")</script>',
    });
  });
  await page.getByRole("button", { name: "Google ile devam et" }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3000/#view=map");
  await expect(page.locator(".opening")).toHaveCount(0);
  await page.getByRole("button", { name: "Mirasım profilini aç" }).click();
  await expect(
    page.getByRole("heading", { name: "Mirasım", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Mirasım", exact: true }),
  ).toBeVisible();
});

test("signing in from a guest profile returns to the map and reloads the personal score on the next profile visit", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/#view=profile");
  const board = page.locator(".weekly-board");
  await expect(board.locator(".board-champion")).toContainText("Deniz");
  await expect(board.locator(".board-me")).toHaveCount(0);
  await board
    .getByRole("button", { name: "Giriş yap, sen de listede görün" })
    .click();
  await passwordSignIn(page);
  await expect(page.locator(".opening")).toHaveCount(0);
  await expect(page.locator(".map-return")).toHaveCount(0);
  await page.getByRole("button", { name: "Mirasım profilini aç" }).click();
  await expect(board.locator(".board-me")).toHaveText(
    "Senin sıran: 12. · 180 puan",
  );
});
