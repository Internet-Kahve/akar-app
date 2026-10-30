import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { expect, test, type Page } from "@playwright/test";
import { createSeed } from "../packages/api-client/src/seed";
import { triangleGlb } from "./support/triangle-glb";

/** The demo's own city record: the screens must say what it says, not what the code remembers. */
const BURSA = { name: "Bursa", pattern: "/desenler/desen-bursa-sekiz-yildiz.svg", accent: "rgb(34, 86, 110)" };

/** A map style that is only a background: the map draws at once, offline. Held back until `release` when a test needs the opening screen. */
async function holdMap(page: Page) {
  const gate = Promise.withResolvers<void>();
  await page.route("**/harita/akar-style.json", async (route) => {
    await gate.promise;
    await route.fulfill({
      json: { version: 8, sources: {}, layers: [{ id: "bg", type: "background", paint: { "background-color": "#f3f1ed" } }] },
    });
  });
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort());
  return gate.resolve;
}

test("the opening screen names the default city and draws its pattern from the city record, and leaves when the map is drawn", async ({ page }) => {
  const release = await holdMap(page);
  await page.goto("/");
  const opening = page.locator(".opening");
  await expect(opening).toBeVisible();
  await expect(opening).toHaveAttribute("role", "status");
  await expect(opening.locator(".opening-brand")).toHaveText("AKAR");
  await expect(opening.locator(".opening-city")).toHaveText(BURSA.name);
  await expect(opening.locator(".opening-note")).toHaveText("Vakıf eserleri yükleniyor");
  await expect(opening.locator(".opening-city")).toHaveCSS("color", BURSA.accent);
  // The design's rule: the pattern behind a title or a loading screen is 6–10 % (it fades in to that).
  const pattern = opening.locator(".city-pattern");
  await expect(pattern).toHaveCSS("background-color", BURSA.accent);
  await expect
    .poll(async () => Number(await pattern.evaluate((el) => getComputedStyle(el).opacity)))
    .toBeGreaterThanOrEqual(0.06);
  expect(Number(await pattern.evaluate((el) => getComputedStyle(el).opacity))).toBeLessThanOrEqual(0.1);
  expect(await pattern.evaluate((el) => getComputedStyle(el).maskImage)).toContain(BURSA.pattern);
  // The tile is a file the app serves.
  const tile = await page.request.get(BURSA.pattern);
  expect(tile.ok()).toBe(true);
  expect(tile.headers()["content-type"]).toContain("image/svg+xml");
  // Behind the screen the page waits: nothing to tab into.
  await expect(page.locator(".app-shell")).toHaveJSProperty("inert", true);

  release();
  await expect(opening).toHaveCount(0);
  await expect(page.locator(".app-shell")).toHaveJSProperty("inert", false);
  await expect(page.locator(".map-canvas canvas")).toBeVisible();
});

test("the emblem is drawn stroke by stroke, and stands drawn when the visitor asks for less motion", async ({ page }) => {
  const release = await holdMap(page);
  await page.goto("/");
  const stroke = page.locator(".opening .emblem path");
  await expect(stroke).toHaveAttribute("pathLength", "1");
  await expect(stroke).toHaveCSS("animation-name", "emblem-draw");
  await expect(stroke).toHaveCSS("animation-duration", "2.6s");
  release();
  await expect(page.locator(".opening")).toHaveCount(0);

  await page.emulateMedia({ reducedMotion: "reduce" });
  const still = await holdMap(page);
  await page.goto("/");
  const drawn = page.locator(".opening .emblem path");
  await expect(drawn).toHaveCSS("animation-name", "none");
  await expect(drawn).toHaveCSS("stroke-dashoffset", "0px");
  still();
  await expect(page.locator(".opening")).toHaveCount(0);
});

test("the opening screen does not wait for a map that is not on the page", async ({ page }) => {
  await holdMap(page); // never released: a map that does not draw
  await page.goto("/#view=profile");
  await expect(page.getByRole("heading", { name: "Mirasım", level: 1 })).toBeVisible();
  await expect(page.locator(".opening")).toHaveCount(0);
});

/** A GLB of `size` bytes: the one-triangle model with a longer BIN chunk. */
function glbOfSize(size: number) {
  const glb = triangleGlb();
  const binHeader = 20 + glb.readUInt32LE(12);
  const out = Buffer.concat([glb, Buffer.alloc(size - glb.length)]);
  out.writeUInt32LE(out.length, 8);
  out.writeUInt32LE(out.length - binHeader - 8, binHeader);
  return out;
}

const TOTAL = 1_677_720; // 1,6 MB, a multiple of 4
const SENT = Math.floor(TOTAL * 0.62);

/**
 * A model server that sends 62 % of the file and holds the rest until `release`, with or without announcing the
 * length: the browser's response stream is what the card reads.
 */
async function slowModel(announceLength: boolean) {
  const body = glbOfSize(TOTAL);
  const released = Promise.withResolvers<void>();
  const server: Server = createServer((_req, res) => {
    res.writeHead(200, {
      "Content-Type": "model/gltf-binary",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
      ...(announceLength && { "Content-Length": String(body.length) }),
    });
    res.write(body.subarray(0, SENT));
    void released.promise.then(() => res.end(body.subarray(SENT)));
  });
  const listening = Promise.withResolvers<void>();
  server.listen(0, "127.0.0.1", listening.resolve);
  await listening.promise;
  const { port } = server.address() as AddressInfo;
  return {
    src: `http://127.0.0.1:${port}/model.glb`,
    release: released.resolve,
    close: async () => {
      released.resolve();
      server.closeAllConnections();
      const closed = Promise.withResolvers<void>();
      server.close(() => closed.resolve());
      await closed.promise;
    },
  };
}

async function openUlucamiWithModel(page: Page, src: string) {
  const snapshot = createSeed();
  snapshot.sites[0]!.model = { src, name: "Yavaş model", bytes: 0, parts: [], trust: "representative" };
  await page.addInitScript((data) => localStorage.setItem("akar-demo-bursa-v1", JSON.stringify(data)), snapshot);
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort());
  await page.goto("/#view=detail&site=ulu-cami");
}

test("the 3D card tells the percentage and the megabytes of the download itself, over the city's pattern; the panel stays usable and the card follows into the story", async ({ page }) => {
  const model = await slowModel(true);
  try {
    await openUlucamiWithModel(page, model.src);
    const card = page.locator(".model-loading");
    await expect(card.locator(".model-loading-title")).toHaveText("3D model yükleniyor · %62");
    await expect(card.locator(".model-loading-note")).toHaveText(
      "1,0 MB / 1,6 MB. Bu sırada Dinle ya da Oku ile başlayabilirsin; model gelince sahne kendiliğinden açılır.",
    );
    const bar = card.getByRole("progressbar", { name: "3D model yükleniyor" });
    await expect(bar).toHaveAttribute("aria-valuenow", "62");
    await expect(card.locator(".model-loading-emblem path")).toHaveAttribute("pathLength", "1");
    // The city's pattern (from its record) is behind the card, faint.
    const pattern = page.locator(".model-viewer .city-pattern");
    await expect(pattern).toHaveCount(1);
    expect(await pattern.evaluate((el) => getComputedStyle(el).maskImage)).toContain(BURSA.pattern);
    await expect(pattern).toHaveCSS("opacity", "0.08");
    // The scene's background is the city's (§11.42), under the pattern.
    await expect(page.locator(".model-viewer")).toHaveCSS("background-image", /linear-gradient/);

    // The panel beside the scene works while the model comes: «Oku» opens the story.
    await page.getByRole("button", { name: "Oku", exact: true }).click();
    await expect(page).toHaveURL(/view=story/);
    const storyCard = page.locator(".model-loading");
    await expect(storyCard.locator(".model-loading-title")).toHaveText("3D model yükleniyor · %62");
    await expect(storyCard.locator(".model-loading-note")).toHaveText(
      "1,0 MB / 1,6 MB. Model gelince sahne kendiliğinden açılır.",
    );

    model.release();
    await expect(page.locator(".model-loading")).toHaveCount(0);
    await expect(page.locator(".model-viewer .city-pattern")).toHaveCount(0);
    await expect(page.locator(".model-viewer canvas")).toBeVisible();
    await expect(page.locator(".model-status")).toHaveCount(0);
  } finally {
    await model.close();
  }
});

test("a response without a length gives a bar without a percentage and the megabytes read", async ({ page }) => {
  const model = await slowModel(false);
  try {
    await openUlucamiWithModel(page, model.src);
    const card = page.locator(".model-loading");
    await expect(card.locator(".model-loading-note")).toHaveText(
      "1,0 MB indirildi. Bu sırada Dinle ya da Oku ile başlayabilirsin; model gelince sahne kendiliğinden açılır.",
    );
    await expect(card.locator(".model-loading-title")).toHaveText("3D model yükleniyor");
    const bar = card.getByRole("progressbar", { name: "3D model yükleniyor" });
    await expect(bar).not.toHaveAttribute("aria-valuenow", /.*/);
    await expect(bar).toHaveClass(/unknown/);
    model.release();
    await expect(page.locator(".model-loading")).toHaveCount(0);
    await expect(page.locator(".model-viewer canvas")).toBeVisible();
  } finally {
    await model.close();
  }
});

test("a model that cannot be loaded takes the card away and says so", async ({ page }) => {
  await page.route("**/missing-model.glb", (route) => route.fulfill({ status: 404, body: "yok" }));
  await openUlucamiWithModel(page, "/missing-model.glb");
  await expect(page.locator(".model-status")).toHaveText("3B model yüklenemedi. Fotoğraflardan devam edebilirsin.");
  await expect(page.locator(".model-loading")).toHaveCount(0);
});
