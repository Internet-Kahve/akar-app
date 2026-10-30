import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

/**
 * End-to-end run against the real API, locally or in the isolated API browser E2E workflow (local Supabase,
 * the API on :4000 and Mailpit). Start `npm run api` first; the web app in API mode (:3001) is started if needed.
 * Run from the repository root: `npm run test:e2e:api`.
 */
export default defineConfig({
  testDir: ".",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://127.0.0.1:3001",
    // The first-visit card covers the map.
    storageState: {
      cookies: [],
      origins: [{ origin: "http://127.0.0.1:3001", localStorage: [{ name: "akar.karsilama", value: "1" }] }],
    },
    // Bundled Chromium locally; opt into the hosted runner's preinstalled Chrome in CI.
    channel: process.env.AKAR_E2E_BROWSER_CHANNEL === "chrome" ? "chrome" : undefined,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } },
    {
      name: "mobile",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: {
    command: "npm run dev:api",
    cwd: fileURLToPath(new URL("../../..", import.meta.url)),
    url: "http://127.0.0.1:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
