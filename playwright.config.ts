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
          localStorage: [{ name: "akar.karsilama", value: "1" }],
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
