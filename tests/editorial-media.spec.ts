import { expect, test } from "@playwright/test";
import { createSeed } from "../packages/api-client/src/seed";

function triangleGlb() {
  const data = Buffer.alloc(36);
  [0, 0, 0, 1, 0, 0, 0, 1, 0].forEach((v, i) => data.writeFloatLE(v, i * 4));
  const doc = JSON.stringify({
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
    materials: [{ doubleSided: true }],
    buffers: [{ byteLength: data.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: data.length }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: "VEC3",
        min: [0, 0, 0],
        max: [1, 1, 0],
      },
    ],
  });
  const json = Buffer.from(doc.padEnd(Math.ceil(doc.length / 4) * 4, " "));
  const result = Buffer.alloc(28 + json.length + data.length);
  result.writeUInt32LE(0x46546c67, 0);
  result.writeUInt32LE(2, 4);
  result.writeUInt32LE(result.length, 8);
  result.writeUInt32LE(json.length, 12);
  result.writeUInt32LE(0x4e4f534a, 16);
  json.copy(result, 20);
  result.writeUInt32LE(data.length, 20 + json.length);
  result.writeUInt32LE(0x004e4942, 24 + json.length);
  data.copy(result, 28 + json.length);
  return result;
}

test("model survives its loading state, photo switch and uncropped archive retain attribution", async ({
  page,
  request,
}) => {
  const snapshot = createSeed(),
    site = snapshot.sites[0]!;
  const photo = {
    id: "editorial-photo",
    src: "/test-photo.svg",
    alt: "Tarihî cami",
    title: "Arşiv fotoğrafı",
    titleEn: "",
    description: "Fotoğrafçı · Örnek arşiv · Foto Atlas aracılığıyla",
    sourceId: "archive-source",
    license: "CC BY-NC-ND",
    trust: "verified" as const,
  };
  site.model = {
    src: "/test-model.glb",
    name: "Test model",
    bytes: 0,
    parts: [],
    trust: "representative",
  };
  site.photos = [photo];
  site.coverPhotoId = photo.id;
  site.historyImages = [
    {
      id: "archive-1",
      photo,
      caption: "Ulucami arşivi",
      dateLabel: "1890–1900",
      sourceId: photo.sourceId,
      trust: "verified",
    },
  ];
  site.historyImages.push({
    ...site.historyImages[0]!,
    id: "archive-2",
    dateLabel: "1930",
  });
  site.sections = [
    {
      id: "section-1",
      kind: "history",
      title: "Tarihçe",
      body: "Kaynaklı tarihçe metni.",
      trust: "verified",
      sourceId: photo.sourceId,
    },
  ];
  site.sources = [
    {
      id: photo.sourceId,
      title: photo.description,
      kind: "archive",
      author: "Fotoğrafçı",
      year: "1900",
      page: "",
      url: "https://archive.example/item",
      trust: "verified",
    },
  ];
  await page.addInitScript(
    (data) => localStorage.setItem("akar-demo-bursa-v1", JSON.stringify(data)),
    snapshot,
  );
  await page.route("**/test-model.glb", (route) =>
    route.fulfill({ contentType: "model/gltf-binary", body: triangleGlb() }),
  );
  await page.route("**/test-photo.svg", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#49684d"/></svg>',
    }),
  );
  await page.goto("/#view=detail&site=ulu-cami");
  await expect(page.locator(".model-viewer canvas")).toBeVisible();
  await expect(page.locator(".model-status")).toHaveCount(0);
  // Regression: React previously removed the imperative canvas when the status text disappeared.
  await expect(page.locator(".model-viewer canvas")).toBeVisible();
  await page.getByRole("button", { name: "Fotoğraf", exact: true }).click();
  await expect(page.locator(".scene-photo")).toHaveAttribute("alt", photo.alt);
  await page.getByRole("button", { name: "Eser hakkında" }).click();
  await expect(
    page.getByRole("dialog").getByText("Kaynaklı tarihçe metni."),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Geçmişi Gör", exact: true }).click();
  await expect(page.locator(".archive-photo img")).toBeVisible();
  await expect(page.locator(".archive-photo img")).toHaveCSS(
    "object-fit",
    "contain",
  );
  await expect(page.locator(".archive-credit")).toHaveText(photo.description);
  await expect(page.getByText("CC BY-NC-ND", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Arşiv kaydını aç" }),
  ).toHaveAttribute("href", "https://archive.example/item");
  await page.locator(".archive-timeline button").nth(1).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".archive-photo figcaption")).toContainText("1930");
  const decoder = await request.get("/draco/draco_decoder.wasm");
  expect(decoder.ok()).toBe(true);
  expect((await decoder.body()).subarray(0, 4).toString("hex")).toBe(
    "0061736d",
  );
});
