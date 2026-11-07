import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import { expect, test, type Page } from "@playwright/test";

let bundle: string;
let css: string;
test.beforeAll(async () => {
  const result = await build({
    entryPoints: ["tests/support/chat-widget.tsx"],
    bundle: true,
    write: false,
    platform: "browser",
    format: "iife",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"test"' },
  });
  bundle = result.outputFiles[0]!.text;
  css = (
    await Promise.all(
      [
        "packages/design-tokens/tokens.css",
        "apps/web/src/app/globals.css",
        "apps/web/src/app/design.css",
        "apps/web/src/app/theme.css",
      ].map((path) => readFile(path, "utf8")),
    )
  ).join("\n");
});

test.beforeEach(async ({ page }) => {
  await page.route("**/chat-harness?*", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/chat-harness.css"><div id="root"></div><script src="/chat-harness.js"></script>',
    }),
  );
  await page.route("**/chat-harness.js", (route) =>
    route.fulfill({ contentType: "text/javascript", body: bundle }),
  );
  await page.route("**/chat-harness.css", (route) =>
    route.fulfill({ contentType: "text/css", body: css }),
  );
});

const dialog = (page: Page) =>
  page.getByRole("dialog", { name: "Akar asistanı" });

async function checkLayout(page: Page) {
  const bounds = await dialog(page).evaluate((el) => {
    const rect = (selector: string) => {
      const node = el.querySelector(selector)!;
      const r = node.getBoundingClientRect();
      return {
        top: r.top,
        bottom: r.bottom,
        left: r.left,
        right: r.right,
        width: r.width,
      };
    };
    const r = el.getBoundingClientRect();
    return {
      dialog: { top: r.top, bottom: r.bottom, right: r.right, left: r.left },
      log: rect(".chat-log"),
      form: rect(".chat-form"),
      field: rect("textarea"),
      send: rect('[type="submit"]'),
      overflow: el.scrollWidth > el.clientWidth,
      messagesOverlap: [...el.querySelectorAll(".chat-log > li")].some(
        (li, i, all) =>
          i > 0 &&
          li.getBoundingClientRect().top <
            all[i - 1]!.getBoundingClientRect().bottom,
      ),
    };
  });
  expect(bounds.dialog.left).toBeGreaterThanOrEqual(0);
  expect(bounds.dialog.top).toBeGreaterThanOrEqual(0);
  expect(bounds.dialog.right).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(bounds.dialog.bottom).toBeLessThanOrEqual(page.viewportSize()!.height);
  expect(bounds.log.bottom).toBeLessThanOrEqual(bounds.form.top);
  expect(bounds.field.right).toBeLessThan(bounds.send.left);
  expect(bounds.send.width).toBeGreaterThanOrEqual(44);
  expect(bounds.overflow).toBe(false);
  expect(bounds.messagesOverlap).toBe(false);
}

test("opening shows example buttons and sends the selected question once", async ({
  page,
}) => {
  const sent: unknown[] = [];
  await page.route("**/chat-api/v1/chat", async (route) => {
    sent.push(route.request().postDataJSON());
    await route.fulfill({
      json: {
        answer: "Bursa'nın eserlerini keşfedebilirsin.",
        sources: [],
        general: false,
      },
    });
  });
  await page.goto("/chat-harness?catalog");
  const launcher = page.getByRole("button", {
    name: "Asistana sor",
    exact: true,
  });
  await expect(launcher).toHaveCSS("z-index", "0");
  const box = await launcher.boundingBox();
  if (page.viewportSize()!.width < 900) {
    expect(box!.x).toBe(16);
    expect(box!.y + box!.height).toBe(page.viewportSize()!.height - 144);
    const routes = await page.getByTestId("routes").boundingBox();
    expect(box!.y + box!.height).toBeLessThan(routes!.y);
  } else {
    expect(box!.x + box!.width).toBe(page.viewportSize()!.width - 24);
    expect(box!.y + box!.height).toBe(page.viewportSize()!.height - 32);
  }
  await launcher.click();
  await expect(
    dialog(page)
      .getByRole("group", { name: "Örnek sorular" })
      .getByRole("button"),
  ).toHaveCount(3);
  await checkLayout(page);
  const example = dialog(page).getByRole("button", {
    name: "Akar'da hangi tarihî eserleri keşfedebilirim?",
    exact: true,
  });
  await example.click();
  await expect(
    dialog(page).getByText("Bursa'nın eserlerini keşfedebilirsin."),
  ).toBeVisible();
  expect(sent).toEqual([
    {
      message: "Akar'da hangi tarihî eserleri keşfedebilirim?",
      history: [],
      lang: "tr",
    },
  ]);
  await expect(
    dialog(page).getByRole("group", { name: "Örnek sorular" }),
  ).toHaveCount(0);
  await checkLayout(page);
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toHaveCount(0);
  await expect(launcher).toBeFocused();
});

test("site entry sends its context; a source opens the referenced site and starts its own context", async ({
  page,
}) => {
  const sent: Record<string, unknown>[] = [];
  await page.route("**/chat-api/v1/chat", async (route) => {
    sent.push(route.request().postDataJSON());
    await route.fulfill({
      json: {
        answer: "Koza Han ile bağlantılı bir hikâye.",
        general: true,
        sources: [
          {
            kind: "story",
            siteId: "koza-han",
            title: "Koza Han'ın hikâyesi",
            source: { title: "Bursa Envanteri", page: "s. 12" },
          },
        ],
      },
    });
  });
  await page.goto("/chat-harness?site=ulu-cami");
  await page.getByRole("button", { name: /Bu eserle ilgili soru sor/ }).click();
  await expect(
    dialog(page).getByText("Ulucami hakkında soruyorsun."),
  ).toBeVisible();
  await dialog(page)
    .getByRole("button", {
      name: "Bu eser ne zaman, kim tarafından yaptırıldı?",
      exact: true,
    })
    .click();
  const sources = dialog(page).getByRole("list", { name: "Kaynaklar" });
  await expect(sources).toContainText("Bursa Envanteri, s. 12");
  await expect(dialog(page).getByText("Genel bilgi")).toBeVisible();
  expect(sent[0]).toMatchObject({ siteId: "ulu-cami", history: [] });
  await sources
    .getByRole("button", { name: "Koza Han'ın hikâyesi · Esere git" })
    .click();
  await expect(dialog(page)).toHaveCount(0);
  await expect(page).toHaveURL(/#view=detail&site=koza-han$/);
  await expect(
    page.getByRole("heading", { name: "Koza Hanı", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Bu eserle ilgili soru sor/ }).click();
  await expect(
    dialog(page).getByText("Koza Hanı hakkında soruyorsun."),
  ).toBeVisible();
  await dialog(page)
    .getByRole("button", {
      name: "Bu eserin vakıfla ilişkisi nedir?",
      exact: true,
    })
    .click();
  await expect(
    dialog(page).getByText("Koza Han ile bağlantılı bir hikâye."),
  ).toBeVisible();
  expect(sent[1]).toMatchObject({ siteId: "koza-han", history: [] });
});

test("long replies and source labels stay separate from the composer on a narrow, short screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await page.route("**/chat-api/v1/chat", (route) =>
    route.fulfill({
      json: {
        answer: "Uzun bir tarih anlatısı. ".repeat(100) + "x".repeat(200),
        general: true,
        sources: [
          {
            kind: "about",
            siteId: "koza-han",
            title: "KozaHan".repeat(30),
            source: { title: "BursaEnvanteri".repeat(20), page: "s. 123" },
          },
        ],
      },
    }),
  );
  await page.goto("/chat-harness?catalog");
  await page.getByRole("button", { name: "Asistana sor", exact: true }).click();
  await checkLayout(page);
  await dialog(page)
    .getByRole("button", {
      name: "Vakıf eserleri şehir yaşamını nasıl etkiledi?",
      exact: true,
    })
    .click();
  await expect(dialog(page).locator(".chat-msg.assistant")).toHaveCount(1);
  await checkLayout(page);
  await expect(dialog(page).getByRole("textbox")).toBeInViewport();
  await expect(
    dialog(page).getByRole("button", { name: "Gönder", exact: true }),
  ).toBeInViewport();
  await page.screenshot({ path: test.info().outputPath("chat-narrow.png") });
});

test("a failed example can be retried and guests cannot send questions", async ({
  page,
}) => {
  await page.goto("/chat-harness?guest");
  await page.getByRole("button", { name: "Asistana sor", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Asistanı kullanmak için giriş yap.",
  );
  await expect(dialog(page)).toHaveCount(0);
  await page.route("**/chat-api/v1/chat", (route) =>
    route.fulfill({
      status: 503,
      json: {
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Asistan yapılandırılmamış.",
        },
      },
    }),
  );
  await page.goto("/chat-harness?catalog");
  await page.getByRole("button", { name: "Asistana sor", exact: true }).click();
  await dialog(page)
    .getByRole("button", {
      name: "Vakıf eserleri şehir yaşamını nasıl etkiledi?",
      exact: true,
    })
    .click();
  await expect(dialog(page).getByRole("alert")).toHaveText(
    "Asistan şu an kullanılamıyor.",
  );
  await expect(dialog(page).getByRole("textbox")).toHaveValue(
    "Vakıf eserleri şehir yaşamını nasıl etkiledi?",
  );
  await checkLayout(page);
});

test("web citations appear below the answer as small safe links and search suggestions stay isolated", async ({
  page,
}) => {
  await page.route("**/chat-api/v1/chat", (route) =>
    route.fulfill({
      json: {
        answer:
          "Yerel envanter bilgisi, müzenin restorasyon kaydıyla desteklendi.",
        general: true,
        sources: [
          {
            kind: "about",
            siteId: "ulu-cami",
            title: "Ulu Cami",
            source: {
              title: "Bursa Envanteri",
              page: "s. 42",
              url: "https://example.org/inventory",
            },
          },
          {
            kind: "web",
            siteId: null,
            title: "Müze restorasyon kaydı",
            url: "https://museum.example/history",
            source: null,
          },
          {
            kind: "web",
            siteId: null,
            title: "Invalid link",
            url: "javascript:alert(1)",
            source: null,
          },
        ],
        searchSuggestions:
          '<div>Google arama önerileri</div><script>parent.document.body.dataset.injected="yes"</script>',
      },
    }),
  );
  await page.goto("/chat-harness?catalog");
  await page.getByRole("button", { name: "Asistana sor", exact: true }).click();
  await dialog(page)
    .getByRole("group", { name: "Örnek sorular" })
    .getByRole("button")
    .first()
    .click();
  const sources = dialog(page).getByRole("list", { name: "Kaynaklar" });
  await expect(
    sources.getByRole("link", { name: "Müze restorasyon kaydı" }),
  ).toHaveAttribute("href", "https://museum.example/history");
  await expect(
    sources.getByRole("link", { name: "Bursa Envanteri" }),
  ).toHaveAttribute("href", "https://example.org/inventory");
  await expect(sources.getByRole("link", { name: "Invalid link" })).toHaveCount(
    0,
  );
  await expect(
    sources.getByRole("link", { name: "Müze restorasyon kaydı" }),
  ).toHaveCSS("font-size", "12px");
  await expect(
    dialog(page).getByText("Web kaynaklarıyla desteklendi"),
  ).toBeVisible();
  await expect(dialog(page).locator("iframe")).toHaveAttribute(
    "sandbox",
    "allow-popups allow-popups-to-escape-sandbox",
  );
  await expect(page.locator("body")).not.toHaveAttribute(
    "data-injected",
    "yes",
  );
  await checkLayout(page);
  await page.screenshot({ path: test.info().outputPath("chat-sources.png") });
});

test("launcher switches sides at the mobile breakpoint and leaves the collapsed map panel clear", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/chat-harness?catalog");
  const launcher = page.getByRole("button", {
    name: "Asistana sor",
    exact: true,
  });
  await expect(launcher).toHaveCSS("left", "16px");
  const box = await launcher.boundingBox();
  const panel = await page.locator(".side-panel").boundingBox();
  expect(box!.y + box!.height + 12).toBeLessThanOrEqual(panel!.y);
  await page.screenshot({
    path: test.info().outputPath("chat-mobile-position.png"),
  });
  await page.setViewportSize({ width: 1200, height: 900 });
  await expect(launcher).toHaveCSS("right", "24px");
});
