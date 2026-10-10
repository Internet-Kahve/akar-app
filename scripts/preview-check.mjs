import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const browser = await chromium.launch({
  channel: process.env.CI ? undefined : "chrome",
  headless: true,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  page.on("pageerror", (error) => console.error(error.message));
  await page.goto("http://127.0.0.1:3000");
  await page
    .getByRole("heading", { name: "Şehrin hikâyesine karış." })
    .waitFor();
  await mkdir("test-results", { recursive: true });
  await page.screenshot({
    path: "test-results/preview-desktop.png",
    fullPage: true,
  });
  console.log("Preview saved: test-results/preview-desktop.png");
} finally {
  await browser.close();
}
