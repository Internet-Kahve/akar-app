import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { expect, test, type Browser, type BrowserContextOptions, type Page } from "@playwright/test";
import { triangleGlb } from "../../../tests/support/triangle-glb.ts";

const API = "http://127.0.0.1:4000";
const MAILPIT = "http://127.0.0.1:54324";
const REPO = fileURLToPath(new URL("../../..", import.meta.url));
const MEMORY_SITE = { id: "ulu-cami", name: "Ulucami" };
// 1×1 PNG: the API checks the file's first bytes, so the upload has to be a real image.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test.beforeAll(async () => {
  let ready = await fetch(`${API}/ready`).catch(() => null);
  // Desktop and mobile share localhost's guest quota. A fast preceding project (or a local rerun)
  // can exhaust it before the next project signs in. Wait at setup, never retry a failed assertion
  // or relax the application's rate limit. Reset is seconds until the current window ends.
  const remaining = ready?.headers.get("x-ratelimit-remaining");
  const reset = Number(ready?.headers.get("x-ratelimit-reset"));
  if (remaining !== null && remaining !== undefined && Number(remaining) < 250 && reset > 0 && reset <= 60) {
    await sleep(reset * 1000 + 100);
    ready = await fetch(`${API}/ready`).catch(() => null);
  }
  expect(ready?.ok, "API kapalı: önce repo kökünde `npm run api`").toBe(true);
  const mail = await fetch(`${MAILPIT}/api/v1/info`).catch(() => null);
  expect(mail?.ok, "Mailpit (yerel Supabase) kapalı: `npm run api`").toBe(true);
});

/** Signs in through the real e-mail code flow; the code is read from Mailpit. */
async function signIn(page: Page, email: string) {
  const dialog = page.getByRole("dialog").filter({ has: page.getByRole("heading", { name: "Giriş yap" }) });
  await dialog.getByRole("textbox", { name: "E-posta" }).fill(email);
  await dialog.getByRole("button", { name: "Kod gönder" }).click();
  await expect(dialog.getByRole("textbox", { name: "Doğrulama kodu" })).toBeVisible();
  await dialog.getByRole("textbox", { name: "Doğrulama kodu" }).fill(await otpFor(email));
  await dialog.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.getByText("Giriş yaptın.")).toBeVisible();
  await expect(dialog).toBeHidden();
}

async function otpFor(email: string): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const search = await (await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`)).json();
    const id = search.messages?.[0]?.ID as string | undefined;
    if (id) {
      const message = await (await fetch(`${MAILPIT}/api/v1/message/${id}`)).json();
      const code = /\b(\d{6,12})\b/.exec(message.Text as string)?.[1];
      if (code) return code;
    }
    await sleep(250);
  }
  throw new Error(`Mailpit'te ${email} için kod yok`);
}

/** Token without e-mail for API-side setup; also records the staff invite when a role is given. */
function tokenFor(email: string, role: "user" | "editor" | "moderator" | "admin"): string {
  return execFileSync("npm", ["run", "-s", "api:token", "--", "--email", email, "--role", role], {
    cwd: REPO,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

async function openSite(page: Page, name: string) {
  // The page under the opening screen takes no input until the map is drawn (§11.49).
  await expect(page.locator(".opening")).toHaveCount(0);
  await page.getByRole("textbox", { name: "Eser, şehir veya rota ara" }).fill(name);
  await page.locator(".site-card-main").filter({ hasText: name }).first().click();
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
}

async function openProfile(page: Page) {
  await page.getByRole("button", { name: "Mirasım profilini aç" }).click();
  await expect(page.getByRole("heading", { name: "Mirasım", level: 1 })).toBeVisible();
}

async function guestPage(browser: Browser, options?: BrowserContextOptions) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  await page.goto("/");
  return { context, page };
}

test("guest writes a photo memory, a moderator approves it, a new guest reads it, the moderator takes it down, the author deletes it", async ({
  browser,
}) => {
  const run = randomUUID().slice(0, 8);
  const userEmail = `e2e-user-${run}@akar.test`;
  const moderatorEmail = `e2e-mod-${run}@akar.test`;
  const text = `E2E anısı ${run}: avludaki şadırvanın sesi.`;
  tokenFor(moderatorEmail, "moderator"); // records the role; the moderator signs in through the UI below

  // 1. Guest writes a memory with a photo; sending asks for sign-in (e-mail code), the form survives, the resend
  //    uploads the photo and the memory goes to moderation.
  const visitor = await guestPage(browser);
  const errors: string[] = [];
  visitor.page.on("pageerror", (e) => errors.push(e.message));
  await openSite(visitor.page, MEMORY_SITE.name);
  await visitor.page.getByRole("button", { name: "İz Bırak", exact: true }).click();
  const form = visitor.page.getByRole("dialog").filter({ has: visitor.page.getByRole("heading", { name: "İz Bırak" }) });
  await form.getByLabel("Anı fotoğrafı").setInputFiles({ name: "iz.png", mimeType: "image/png", buffer: PNG });
  await expect(form.getByAltText("Paylaşılacak fotoğrafın önizlemesi")).toBeVisible();
  await form.getByRole("textbox", { name: "Anın" }).fill(text);
  await form.getByRole("checkbox").check();
  await form.getByRole("button", { name: "Onaya gönder" }).click();
  await signIn(visitor.page, userEmail);
  await expect(form.getByRole("textbox", { name: "Anın" })).toHaveValue(text);
  await form.getByRole("button", { name: "Onaya gönder" }).click();
  await expect(visitor.page.getByText("Hikâyeye sen de katıldın.")).toBeVisible();
  await visitor.page.getByRole("button", { name: "Keşfe dön" }).click();

  // Pending memories stay out of the public feed.
  const pending = await (await fetch(`${API}/v1/sites/${MEMORY_SITE.id}/memories`)).json();
  expect(pending.items.map((m: { text: string }) => m.text)).not.toContain(text);

  // 2. Moderator signs in from Mirasım and approves it in the panel.
  const moderator = await guestPage(browser);
  await openProfile(moderator.page);
  await moderator.page.getByRole("button", { name: "Giriş yap" }).click();
  await signIn(moderator.page, moderatorEmail);
  await moderator.page.getByRole("button", { name: "Yönetim paneli" }).click();
  await moderator.page.locator(".admin-nav").getByRole("button", { name: /Katkılar/ }).click();
  const card = moderator.page.locator(".moderation-card").filter({ hasText: text });
  await expect(card.getByText("Fotoğraf + anı")).toBeVisible();
  await card.getByRole("button", { name: "Onayla" }).click();
  // It leaves "Bekleyen" and is listed under "Onaylanan" with its photo.
  await expect(card).toBeHidden();
  await moderator.page.locator(".admin-tabs").getByRole("button", { name: /Onaylanan/ }).click();
  await expect(card.getByText("Fotoğraf + anı")).toBeVisible();

  // 3. A new guest sees the approved memory with its published photo.
  const reader = await guestPage(browser);
  await openSite(reader.page, MEMORY_SITE.name);
  await reader.page.getByRole("button", { name: /Yaşayan hafıza/ }).click();
  const memory = reader.page.locator(".memory-public").filter({ hasText: text });
  await expect(memory).toBeVisible();
  const photo = memory.getByRole("img", { name: "Ziyaretçinin eser fotoğrafı" });
  await expect(photo).toHaveAttribute("src", /\/object\/public\/media\//);
  // The src is set when the card renders; the browser fetches the file afterwards.
  await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);

  // 4. The moderator takes the memory down from the public card (no report needed); only an admin sees "Kalıcı sil".
  await moderator.page.goto("/");
  await openSite(moderator.page, MEMORY_SITE.name);
  await moderator.page.getByRole("button", { name: /Yaşayan hafıza/ }).click();
  const published = moderator.page.locator(".memory-public").filter({ hasText: text });
  await expect(published.getByRole("button", { name: "Kalıcı sil" })).toHaveCount(0);
  const photoUrl = await published.getByRole("img", { name: "Ziyaretçinin eser fotoğrafı" }).getAttribute("src");
  await published.getByRole("button", { name: "Yayından kaldır" }).click();
  const takedown = moderator.page.getByRole("dialog", { name: "Yayından kaldır" });
  await takedown.getByRole("radio", { name: "Uygunsuz içerik" }).check();
  await takedown.getByRole("button", { name: "Yayından kaldır" }).click();
  await expect(published).toBeHidden();
  const feed = await (await fetch(`${API}/v1/sites/${MEMORY_SITE.id}/memories`, { cache: "no-store" })).json();
  expect(feed.items.map((m: { text: string }) => m.text)).not.toContain(text);
  // The published photo file is gone from public storage.
  expect((await fetch(photoUrl!)).ok).toBe(false);

  // 5. The author sees the reason in Paylaşımlarım and deletes the memory for good.
  await visitor.page.goto("/");
  await openProfile(visitor.page);
  const own = visitor.page.locator(".memory-row").filter({ hasText: text });
  await expect(own).toContainText("Uygunsuz içerik");
  await own.getByRole("button", { name: "Sil", exact: true }).click();
  await visitor.page.getByRole("dialog", { name: "Anı silinsin mi?" }).getByRole("button", { name: "Evet, sil" }).click();
  await expect(own).toHaveCount(0);

  expect(errors).toEqual([]);
  await Promise.all([visitor.context.close(), moderator.context.close(), reader.context.close()]);
});

test("a guest's saved site and Rotam move into the account at sign-in; Rotam then changes in the account", async ({ browser }) => {
  const email = `e2e-rotam-${randomUUID().slice(0, 8)}@akar.test`;
  const { context, page } = await guestPage(browser);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  // 1. As a guest: save the site and add it to Rotam (kept on the device).
  await openSite(page, MEMORY_SITE.name);
  const save = page.getByRole("button", { name: "Eseri kaydet" });
  await save.click();
  await expect(save).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Rotama ekle" }).click();
  await expect(page.getByRole("button", { name: "Rotamdan çıkar" })).toBeVisible();

  // 2. Sign in: both move into the account.
  await page.goto("/");
  await openProfile(page);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await signIn(page, email);
  const auth = { authorization: `Bearer ${tokenFor(email, "user")}` };
  const account = async () => {
    const [route, passport] = await Promise.all(
      ["/v1/me/route", "/v1/me/passport"].map(async (p) => (await fetch(`${API}${p}`, { headers: auth })).json()),
    );
    return { route: route.siteIds, saved: passport.saved };
  };
  await expect.poll(account).toEqual({ route: [MEMORY_SITE.id], saved: [MEMORY_SITE.id] });

  // 3. After a reload the account's lists are shown; removing the stop writes the account's Rotam.
  await page.goto("/");
  await openSite(page, MEMORY_SITE.name);
  await expect(page.getByRole("button", { name: "Eseri kaydet" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Rotamdan çıkar" }).click();
  await expect(page.getByRole("button", { name: "Rotama ekle" })).toBeVisible();
  await expect.poll(account).toEqual({ route: [], saved: [MEMORY_SITE.id] });

  expect(errors).toEqual([]);
  await context.close();
});

test("an admin deletes another visitor's approved memory permanently from the public card", async ({ browser }) => {
  const run = randomUUID().slice(0, 8);
  const adminEmail = `e2e-admin-${run}@akar.test`;
  const author = tokenFor(`e2e-user-${run}@akar.test`, "user");
  const admin = tokenFor(adminEmail, "admin");
  const text = `E2E anısı ${run}: kalıcı silinecek.`;
  const call = async (token: string, path: string, body: unknown) => {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "idempotency-key": randomUUID() },
      body: JSON.stringify(body),
    });
    expect(res.ok, `${path} ${res.status}`).toBe(true);
    return res.json();
  };
  const created = await call(author, "/v1/memories", {
    siteId: MEMORY_SITE.id,
    text,
    kvkkConsent: true,
    kvkkTextVersion: "e2e",
  });
  await call(admin, `/v1/admin/memories/${created.id}/decision`, { status: "approved" });

  const page = (await guestPage(browser)).page;
  await openProfile(page);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await signIn(page, adminEmail);
  await page.goto("/");
  await openSite(page, MEMORY_SITE.name);
  await page.getByRole("button", { name: /Yaşayan hafıza/ }).click();
  const card = page.locator(".memory-public").filter({ hasText: text });
  await card.getByRole("button", { name: "Kalıcı sil" }).click();
  await page.getByRole("dialog", { name: "Anı kalıcı silinsin mi?" }).getByRole("button", { name: "Evet, kalıcı sil" }).click();
  await expect(card).toHaveCount(0);

  const mine = await (await fetch(`${API}/v1/me/memories`, { headers: { authorization: `Bearer ${author}` } })).json();
  expect(mine.items.map((m: { id: string }) => m.id)).not.toContain(created.id);
  await page.context().close();
});

test("guest quiz: a wrong answer can be retried, the right one shows the explanation", async ({ browser }) => {
  const editor = tokenFor(`e2e-editor-${randomUUID().slice(0, 8)}@akar.test`, "editor");
  const routes = await (await fetch(`${API}/v1/routes`)).json();
  const quizId = (routes.items as { stops: { quizId: string | null }[] }[])
    .flatMap((r) => r.stops.map((s) => s.quizId))
    .find((id): id is string => id !== null);
  test.skip(!quizId, "Yayındaki hiçbir rota durağında bulmaca yok; panelden bir durağa bulmaca bağla.");
  const admin = await (await fetch(`${API}/v1/admin/quizzes/${quizId}`, { headers: { authorization: `Bearer ${editor}` } })).json();
  const site = await (await fetch(`${API}/v1/sites/${admin.siteId}`)).json();
  const keys = await (
    await fetch(`${API}/v1/admin/quizzes?siteId=${admin.siteId}&limit=100`, { headers: { authorization: `Bearer ${editor}` } })
  ).json();
  const answerOf = new Map<string, { options: string[]; correctIndex: number; explanation: string }>(
    keys.items.map((q: { question: string; options: string[]; correctIndex: number; explanation: string }) => [q.question, q]),
  );

  const { context, page } = await guestPage(browser);
  await openProfile(page);
  await page.getByLabel("Deneysel arayüzleri göster").check();
  await openSite(page, site.name);
  await page.getByRole("button", { name: "Bulmaca", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(/^Bulmaca 1 \//)).toBeVisible();

  const question = (await dialog.locator(".quiz-question").textContent())!;
  const key = answerOf.get(question)!;
  const wrong = key.options.findIndex((_, i) => i !== key.correctIndex);
  await dialog.locator(".quiz-option").nth(wrong).click();
  await dialog.getByRole("button", { name: "Cevabı kontrol et" }).click();
  await expect(dialog.getByText("Olmadı, bir daha dene ya da cevabı göster.")).toBeVisible();
  await expect(dialog.locator(".quiz-option").nth(wrong)).toBeDisabled();
  await dialog.locator(".quiz-option").nth(key.correctIndex).click();
  await dialog.getByRole("button", { name: "Cevabı kontrol et" }).click();
  await expect(dialog.getByText(`Doğru! ${key.explanation}`, { exact: false })).toBeVisible();
  await context.close();
});

test("live guests and ordinary accounts cannot open the content studio", async ({ page }) => {
  await page.goto("/#view=profile");
  await expect(page.getByRole("heading", { name: "Mirasım", level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: /yönetim paneli/i })).toHaveCount(0);
  await expect(page.getByText("Deneysel arayüzleri göster")).toHaveCount(0);
  await expect(page.getByText("İnteraktif demo", { exact: true })).toHaveCount(0);
  await page.goto("/#view=admin");
  await expect(page.getByText("Yönetim paneline erişmek için yetkili hesabınla giriş yap.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Yeni eser", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await signIn(page, `e2e-ui-user-${randomUUID().slice(0, 8)}@akar.test`);
  await expect(page.getByText("Bu hesabın yönetim yetkisi bulunmuyor.")).toBeVisible();
  await openProfile(page);
  await expect(page.getByRole("button", { name: /yönetim paneli/i })).toHaveCount(0);
});

for (const role of ["editor", "moderator", "admin"] as const) {
  test(`live ${role} sees only supported studio controls and loses access on sign-out`, async ({ page }) => {
    const email = `e2e-ui-${role}-${randomUUID().slice(0, 8)}@akar.test`;
    tokenFor(email, role);
    await page.goto("/#view=profile");
    await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
    await signIn(page, email);
    await page.getByRole("button", { name: "Yönetim paneli", exact: true }).click();
    const nav = page.locator(".admin-nav");
    await expect(nav.getByRole("button", { name: "İçe aktar", exact: true })).toHaveCount(0);
    if (role === "moderator") {
      await expect(page.getByRole("heading", { name: "Yaşayan hafızayı yönet" })).toBeVisible();
      await expect(nav.getByRole("button", { name: /^Eserler/ })).toHaveCount(0);
      await expect(nav.getByRole("button", { name: "Rotalar", exact: true })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Yeni eser", exact: true })).toHaveCount(0);
    } else {
      await expect(page.getByRole("button", { name: "Yeni eser", exact: true })).toBeVisible();
      await expect(nav.getByRole("button", { name: "Katkılar", exact: true })).toHaveCount(role === "admin" ? 1 : 0);
      await page.getByRole("button", { name: "Yeni eser", exact: true }).click();
      await page.getByRole("button", { name: "6 Yayın", exact: true }).click();
      await expect(page.getByText("Yayınladığın değişiklikler kaydedilir ve eserin herkese açık sayfasında görünür.")).toBeVisible();
      await expect(page.getByText(/Sunucuya veri gönderilmez/)).toHaveCount(0);
    }
    await expect(page.locator("body")).not.toHaveText(/Demo paneli/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await openProfile(page);
    await page.getByRole("button", { name: "Çıkış yap", exact: true }).click();
    await expect(page.getByRole("button", { name: "Yönetim paneli", exact: true })).toHaveCount(0);
    await page.goto("/#view=admin");
    await expect(page.getByText("Yönetim paneline erişmek için yetkili hesabınla giriş yap.")).toBeVisible();
  });
}

test("live visits require location and only display success after server verification", async ({ page, context }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: {
      getCurrentPosition: (_success: unknown, failure: (error: { code: number }) => void) => failure({ code: 1 }),
    } });
  });
  await page.goto("/");
  await openSite(page, MEMORY_SITE.name);
  await page.getByRole("button", { name: "Yanındayım", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Yanındayım", exact: true });
  await expect(dialog.getByText(/Konum izni vererek/)).toBeVisible();
  await expect(dialog.getByText(/Simülasyon/)).toHaveCount(0);
  await dialog.getByRole("button", { name: "Ziyareti doğrula", exact: true }).click();
  await expect(page.locator(".toast.fault")).toContainText("konum izni vermelisin");
  await expect(dialog.getByText("Ziyaretin doğrulandı", { exact: true })).toHaveCount(0);
  // Restore the real browser geolocation provider; the local API decides proximity.
  await page.evaluate(() => { Reflect.deleteProperty(navigator, "geolocation"); });
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 41, longitude: 29, accuracy: 10 });
  await dialog.getByRole("button", { name: "Ziyareti doğrula", exact: true }).click();
  await expect(page.locator(".toast.fault")).toContainText("esere yaklaşmalısın");
  await expect(dialog.getByText("Ziyaretin doğrulandı", { exact: true })).toHaveCount(0);
  const site = await (await fetch(`${API}/v1/sites/${MEMORY_SITE.id}`)).json();
  await context.setGeolocation({ latitude: site.coordinates[1], longitude: site.coordinates[0], accuracy: 10 });
  await dialog.getByRole("button", { name: "Ziyareti doğrula", exact: true }).click();
  await expect(dialog.getByText("Ziyaretin doğrulandı", { exact: true })).toBeVisible();
});


test("live photo metadata editing preserves imported licenses and excludes unsupported file replacement", async ({ page }, testInfo) => {
  const email = `e2e-photo-editor-${randomUUID().slice(0, 8)}@akar.test`;
  tokenFor(email, "editor");
  // Only this browser's catalog response is enriched: no fabricated media is written to the API.
  await page.route(`${API}/v1/site-details*`, async (route) => {
    const response = await route.fetch();
    const catalog = await response.json();
    const site = catalog.items.find((item: { id: string }) => item.id === MEMORY_SITE.id);
    if (site) {
      site.coverMediaId = "test-photo";
      site.photoIds = ["test-photo"];
      site.sources = [{ id: "test-source", title: "Test arşivi", kind: "archive", author: "", year: "", page: "", url: "", trust: "verified" }];
      site.media = [{ id: "test-photo", kind: "photo", url: `data:image/png;base64,${PNG.toString("base64")}`, alt: "Test fotoğrafı", title: "Test fotoğrafı", titleEn: null, description: "", license: "Arşiv kullanım izni", sourceId: "test-source", trust: "verified", parts: [] }];
    }
    await route.fulfill({ response, json: catalog });
  });
  await page.goto("/#view=profile");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await signIn(page, email);
  await page.getByRole("button", { name: "Yönetim paneli", exact: true }).click();
  await page.locator(".admin-nav").getByRole("button", { name: "Kartlar ve fotoğraflar", exact: true }).click();
  await page.locator(".photo-option").filter({ hasText: "Test fotoğrafı" }).click();
  const dialog = page.getByRole("dialog", { name: "Fotoğrafı düzenle", exact: true });
  await expect(dialog.getByRole("combobox", { name: "Lisans", exact: true })).toHaveValue("Arşiv kullanım izni");
  await expect(dialog.getByRole("combobox", { name: "Fotoğraf kaynağı", exact: true })).toBeDisabled();
  await expect(dialog.locator('input[type="file"]')).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "Yeni kaynak ekle", exact: true })).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "Fotoğrafı güncelle", exact: true })).toBeEnabled();
  await expect(dialog.getByText(/Dosya veya kaynak değişikliği için/)).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("photo-editor.png"), fullPage: true });
});

test("map settings follow delayed reads without overwriting an edited field", async ({ page }) => {
  const email = `e2e-map-admin-${randomUUID().slice(0, 8)}@akar.test`;
  tokenFor(email, "admin");
  let releaseFirstRead = () => {};
  const firstRead = new Promise<void>((resolve) => { releaseFirstRead = resolve; });
  let settings = { maxVisibleModels: 7, modelMinZoom: 18 };
  await page.route(`${API}/v1/map-settings`, async (route) => {
    await firstRead;
    await route.fulfill({ json: settings });
  });
  await page.goto("/#view=admin");
  await page.getByRole("main").getByRole("button", { name: "Giriş yap", exact: true }).click();
  await signIn(page, email);
  await page.getByRole("button", { name: "Harita ayarları", exact: true }).click();
  const models = page.getByLabel("Aynı anda en çok model");
  const zoom = page.getByLabel("Modellerin yüklendiği yakınlaştırma");
  await expect(models).toBeVisible();
  releaseFirstRead();
  await expect(models).toHaveValue("7");
  await expect(zoom).toHaveValue("18");
  await expect(page.getByRole("button", { name: "Kaydet", exact: true })).toBeDisabled();

  await models.fill("9");
  settings = { maxVisibleModels: 6, modelMinZoom: 19 };
  const refreshed = page.waitForResponse(`${API}/v1/map-settings`);
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await refreshed;
  // Only the touched field belongs to the draft; untouched fields follow the server.
  await expect(models).toHaveValue("9");
  await expect(zoom).toHaveValue("19");
  let submitted: unknown;
  await page.route(`${API}/v1/admin/map-settings`, async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ json: submitted });
  });
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(page.getByText("Harita ayarları kaydedildi.")).toBeVisible();
  expect(submitted).toEqual({ maxVisibleModels: 9, modelMinZoom: 19 });
  await expect(page.getByRole("button", { name: "Kaydet", exact: true })).toBeDisabled();
});

test("cancelling a field task ignores its delayed completion", async ({ page }) => {
  await page.route(`${API}/v1/site-details?*`, async (route) => {
    const response = await route.fetch();
    const catalog = await response.json();
    const site = catalog.items.find((s: { id: string }) => s.id === "ulu-cami");
    site.tasks = [{
      id: "delayed-field-task", kind: "field", title: "Geciken görev", prompt: "Kapıya dokun.",
      photoId: null, part: null, source: null, trust: "representative",
      field: { onSite: { text: "Kapının önüne gel.", radiusM: 80 }, fromHome: { text: "Kapıya dokun.", part: "Tac_Kapi" } },
    }];
    site.media = [{ id: "task-model", kind: "model", url: "/delayed-task.glb", parts: ["Tac_Kapi"], title: "Görev modeli", trust: "representative" }];
    await route.fulfill({ response, json: catalog });
  });
  await page.route("**/delayed-task.glb", (route) => route.fulfill({ contentType: "model/gltf-binary", body: triangleGlb("Tac_Kapi") }));
  let release = () => {};
  const pending = new Promise<void>((resolve) => { release = resolve; });
  const path = `${API}/v1/site-tasks/delayed-field-task/complete`;
  await page.route(path, async (route) => {
    await pending;
    await route.fulfill({ json: { doneText: "Kapı bulundu.", onSite: false, earnedBadges: [] } });
  });
  try {
    await page.goto("/#view=detail&site=ulu-cami");
    await page.getByRole("button", { name: "Geciken görev" }).click();
    await page.getByRole("button", { name: "Evden yap", exact: true }).click();
    await expect(page.locator(".model-status")).toHaveCount(0);
    const request = page.waitForRequest(path);
    await page.locator(".model-viewer canvas").click();
    await request;
    await page.locator(".task-pick-bar").getByRole("button", { name: "Vazgeç" }).click();
    await expect(page.locator(".task-pick-bar")).toHaveCount(0);
    const response = page.waitForResponse(path);
    release();
    await (await response).finished();
    // Let the fetch continuation and React commit run before asserting the dialog stays dismissed.
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await expect(page.getByRole("dialog", { name: "Geciken görev" })).toHaveCount(0);
    await expect(page.locator(".task-pick-bar")).toHaveCount(0);
  } finally {
    release();
  }
});

test("an admin finds a newly registered member, grants admin access and revokes it", async ({ browser, viewport, isMobile, hasTouch }, info) => {
  const run = randomUUID().slice(0, 8);
  const adminEmail = `e2e-member-admin-${run}@akar.test`;
  const memberEmail = `e2e-member-${run}@akar.test`;
  tokenFor(adminEmail, "admin");
  const member = await guestPage(browser, { viewport, isMobile, hasTouch });
  const admin = await guestPage(browser, { viewport, isMobile, hasTouch });
  try {
    // A genuine new account: no profile row and no API-side role setup.
    await member.page.goto("/#view=admin");
    await member.page.getByRole("main").getByRole("button", { name: "Giriş yap", exact: true }).click();
    await signIn(member.page, memberEmail);
    await expect(member.page.getByText("Bu hesabın yönetim yetkisi bulunmuyor.")).toBeVisible();

    await admin.page.goto("/#view=admin");
    await admin.page.getByRole("main").getByRole("button", { name: "Giriş yap", exact: true }).click();
    await signIn(admin.page, adminEmail);
    await admin.page.getByRole("button", { name: "Üyeler ve roller", exact: true }).click();
    await admin.page.getByLabel("E-posta ile üye ara").fill(memberEmail);
    await admin.page.getByRole("button", { name: "Ara", exact: true }).click();
    const row = admin.page.getByRole("row").filter({ hasText: memberEmail });
    await expect(row.getByText("Üye", { exact: true })).toBeVisible();
    await expect(admin.page.getByRole("row")).toHaveCount(2);
    await row.getByRole("button").click();
    const dialog = admin.page.getByRole("dialog", { name: "Üye rolünü değiştir" });
    await dialog.getByLabel("Yeni rol").selectOption("admin");
    await dialog.getByRole("button", { name: "Değişikliği onayla" }).click();
    await expect(row.getByText("Yönetici", { exact: true })).toBeVisible();
    await admin.page.screenshot({ path: `test-results/${info.project.name}-real-admin-members.png`, fullPage: true });
    // Same signed-in account; no token replacement or sign-in is required.
    await member.page.reload();
    await expect(member.page.getByRole("button", { name: "Üyeler ve roller", exact: true })).toBeVisible();

    await row.getByRole("button").click();
    await dialog.getByLabel("Yeni rol").selectOption("user");
    await dialog.getByRole("button", { name: "Değişikliği onayla" }).click();
    await expect(row.getByText("Üye", { exact: true })).toBeVisible();
    await member.page.reload();
    await expect(member.page.getByText("Bu hesabın yönetim yetkisi bulunmuyor.")).toBeVisible();
    await expect(member.page.getByRole("button", { name: "Üyeler ve roller", exact: true })).toHaveCount(0);
  } finally {
    await member.context.close();
    await admin.context.close();
  }
});
