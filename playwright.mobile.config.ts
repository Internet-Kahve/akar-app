import { defineConfig, devices } from "@playwright/test";

/** Exercise the exact exported assets, without a Next.js server. Native device checks remain separate. */
export default defineConfig({
  testDir: "./tests",
  testMatch: [
    "flows.spec.ts",
    "history-extras.spec.ts",
    "about-reading.spec.ts",
  ],
  // Map internals are deliberately not exposed by production exports.
  grep: /discovery, story, memory|responsive layouts|a link to a site|a trust tag|route search|chapter reading|archive|team's samples/,
  // The app gives a slow map 8 seconds before allowing discovery without tiles.
  expect: { timeout: 12000 },
  workers: 1,
  outputDir: "test-results/mobile-wrapper",
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    locale: "tr-TR",
    trace: "retain-on-failure",
    storageState: {
      cookies: [],
      origins: [
        {
          origin: "http://127.0.0.1:4173",
          localStorage: [{ name: "akar.karsilama", value: "1" }],
        },
      ],
    },
  },
  projects: [
    {
      name: "android-web",
      use: {
        ...devices["Pixel 7"],
        channel: process.env.CI ? undefined : "chrome",
      },
    },
    { name: "ios-web", use: { ...devices["iPhone 13"] } },
  ],
  webServer: {
    command:
      "python3 -m http.server 4173 --bind 127.0.0.1 --directory apps/web/.next-mobile",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
  },
});
