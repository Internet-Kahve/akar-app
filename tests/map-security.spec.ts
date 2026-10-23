import { expect, test } from "@playwright/test";

test("map attribution preserves its source credit and removes adjacent event attributes", async ({
  page,
}) => {
  await page.route("**/harita/akar-style.json", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        version: 8,
        sources: {
          fixture: {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  properties: {},
                  geometry: { type: "Point", coordinates: [29.0619, 40.184] },
                },
              ],
            },
            attribution:
              '<a href="https://example.com" onclick="window.attributionExecuted=true" onmouseover="window.attributionExecuted=true">Fixture credit</a>',
          },
        },
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#f7f3e8" },
          },
          { id: "fixture", type: "circle", source: "fixture" },
        ],
      }),
    }),
  );
  const worker = page.waitForResponse((response) =>
    response.url().endsWith("/maplibre/maplibre-gl-worker.mjs"),
  );
  await page.goto("/");
  expect((await worker).ok()).toBe(true);
  const attribution = page.locator(".maplibregl-ctrl-attrib-inner");
  await expect(attribution).toContainText("Fixture credit");
  await expect(attribution.locator("[onclick], [onmouseover]")).toHaveCount(0);
  await attribution.locator("a").dispatchEvent("mouseover");
  expect(
    await page.evaluate(() =>
      Boolean(
        (window as Window & { attributionExecuted?: boolean })
          .attributionExecuted,
      ),
    ),
  ).toBe(false);
});
