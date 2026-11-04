import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    // The site language follows the browser (§11.57); the suite reads the Turkish texts.
    locale: "tr-TR",
    // The first-visit card covers the map; only its own test goes without this.
    storageState: {
      cookies: [],
      origins: [
        {
          origin: "http://127.0.0.1:3000",
          // First-time steps seen (welcome, hints, the photo-or-3D question): each has its own test.
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
    channel: process.env.CI ? undefined : "chrome",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
