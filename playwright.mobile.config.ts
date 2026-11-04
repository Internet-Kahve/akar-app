import { defineConfig, devices } from "@playwright/test";

/** Exercise the exact exported assets, without a Next.js server. Native device checks remain separate. */
export default defineConfig({
  testDir: "./tests",
  testMatch: [
    "flows.spec.ts",
    "mobile-wrapper.spec.ts",
    "history-extras.spec.ts",
    "about-reading.spec.ts",
    "first-steps-mobile.spec.ts",
    "site-card-mobile.spec.ts",
    "story-card-mobile.spec.ts",
  ],
  // Map internals are deliberately not exposed by production exports.
  grep: /discovery, story, memory|responsive layouts|a link to a site|a trust tag|route search|chapter reading|archive|team's samples|first-steps-mobile|site-card-mobile|story-card-mobile|mobile-wrapper/,
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
          localStorage: [
            { name: "akar.karsilama", value: "1" },
            { name: "akar.gorunum", value: "model" },
            { name: "akar.ipucu.harita", value: "1" },
            { name: "akar.ipucu.kart", value: "1" },
            { name: "akar.ipucu.detay", value: "1" },
            { name: "akar.ipucu.hikaye", value: "1" },
            { name: "akar.ipucu.cevir", value: "1" },
            { name: "akar.ipucu.parca", value: "1" },
            { name: "akar.ipucu.masa.harita", value: "1" },
            { name: "akar.ipucu.masa.detay", value: "1" },
            { name: "akar.ipucu.masa.hikaye", value: "1" },
            { name: "akar.ipucu.d.foto", value: "1" },
            { name: "akar.ipucu.d.parca", value: "1" },
            { name: "akar.ipucu.d.parcaya", value: "1" },
            { name: "akar.ipucu.yakinlas", value: "1" },
            { name: "akar.ipucu.masa.cevir", value: "1" },
            { name: "akar.ipucu.masa.foto", value: "1" },
            { name: "akar.ipucu.masa.parca", value: "1" },
            { name: "akar.ipucu.masa.parcaya", value: "1" },
            { name: "akar.ipucu.g.foto", value: "1" },
            { name: "akar.ipucu.g.kiyas", value: "1" },
            { name: "akar.ipucu.g.bugun", value: "1" },
            { name: "akar.ipucu.g.serit", value: "1" },
            { name: "akar.ipucu.g.nereden", value: "1" },
            { name: "akar.ipucu.masa.g.foto", value: "1" },
            { name: "akar.ipucu.masa.g.kiyas", value: "1" },
            { name: "akar.ipucu.masa.g.bugun", value: "1" },
            { name: "akar.ipucu.masa.g.serit", value: "1" },
            { name: "akar.ipucu.masa.g.nereden", value: "1" },
            // The story speaks by default (3 Nov 2026); the tests' device has turned it off.
            { name: "akar.ses", value: "0" },
          ],
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
