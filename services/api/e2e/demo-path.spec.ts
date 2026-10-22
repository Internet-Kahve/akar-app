import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { expect, test, type Browser, type Page } from "@playwright/test";

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
  const ready = await fetch(`${API}/ready`).catch(() => null);
  expect(ready?.ok, "API kapalı: önce repo kökünde `npm run api`").toBe(true);
  const mail = await fetch(`${MAILPIT}/api/v1/info`).catch(() => null);
  expect(mail?.ok, "Mailpit (yerel Supabase) kapalı: `npm run api`").toBe(true);
});

/** Signs in through the real e-mail code flow; the code is read from Mailpit. */
async function signIn(page: Page, email: string) {
  const dialog = page.getByRole("dialog").filter({ has: page.getByRole("heading", { name: "Giriş yap" }) });
  await dialog.getByRole("textbox", { name: "E-posta" }).fill(email);
  await dialog.getByRole("button", { name: "Kod gönder" }).click();
  await expect(dialog.getByText(`${email} adresine 6 haneli bir kod gönderdik.`)).toBeVisible();
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
      const code = /\b(\d{6})\b/.exec(message.Text as string)?.[1];
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
  await page.getByRole("textbox", { name: "Eser, şehir veya rota ara" }).fill(name);
  await page.locator(".site-card-main").filter({ hasText: name }).first().click();
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
}

async function openProfile(page: Page) {
  await page.getByRole("button", { name: "Mirasım profilini aç" }).click();
  await expect(page.getByRole("heading", { name: "Mirasım", level: 1 })).toBeVisible();
}

async function guestPage(browser: Browser) {
  const context = await browser.newContext();
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
  await moderator.page.getByRole("button", { name: "Demo yönetim paneli" }).click();
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
