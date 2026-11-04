import { expect, test, type Page } from "@playwright/test";
import { createSeed } from "../packages/api-client/src/seed";

/**
 * «Eser hakkında» read aloud (Muhammed, 2 Nov 2026): the voice says what is highlighted, a chapter's Dinle starts at
 * its title, a tapped paragraph goes on from there, and back crosses into the chapter before.
 * The browser's voice is replaced by one that notes what it is given and ends at once.
 */
async function openReading(page: Page) {
  const snapshot = createSeed();
  const site = snapshot.sites[0]!;
  site.chapters = [1, 2, 3].map((n) => ({
    id: `chapter-${n}`,
    title: `Bölüm ${n}`,
    kind: "history",
    summary: [],
    figures: [],
    quotes: [],
    timeline: [],
    terms: [],
    interior: false,
    focusParts: [],
  }));
  site.sections = site.chapters.flatMap((chapter, i) =>
    [1, 2].map((k) => ({
      id: `section-${i}-${k}`,
      title: chapter.title,
      body: `Bölüm ${i + 1}, paragraf ${k}.`,
      sourceId: "",
      trust: "verified" as const,
      chapterId: chapter.id,
    })),
  );
  await page.addInitScript((data) => {
    localStorage.setItem("akar-demo-bursa-v1", JSON.stringify(data));
    const said: string[] = [];
    (window as unknown as { said: string[] }).said = said;
    // Each part ends after a moment, long enough for the test to see it highlighted and act on it.
    const voice = {
      speaking: false, pending: false, paused: false,
      getVoices: () => [], cancel() {}, pause() {}, resume() {}, addEventListener() {}, removeEventListener() {},
      speak(u: { text: string; onend?: () => void }) {
        said.push(u.text);
        setTimeout(() => u.onend?.(), 1500);
      },
    };
    Object.defineProperty(window, "speechSynthesis", { value: voice, configurable: true });
    (window as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance = class {
      text: string;
      constructor(text: string) {
        this.text = text;
      }
    };
  }, snapshot);
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort());
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#view=detail&site=ulu-cami");
  await page.getByRole("button", { name: "Eser hakkında" }).click();
  return page.getByRole("dialog", { name: "Eser hakkında", exact: true });
}
const said = (page: Page) => page.evaluate(() => (window as unknown as { said: string[] }).said);

test("a chapter's Dinle starts at its title; a tapped paragraph goes on from there; back crosses chapters", async ({ page }) => {
  const reading = await openReading(page);
  await reading.locator("[data-chapter='1'] .about-chapter-listen").click();
  // Chapter 2 opens with its title, then its first paragraph, which is highlighted while the title is read.
  await expect.poll(async () => (await said(page))[0]).toBe("Bölüm 2");
  await expect(reading.locator(".about-reading-now").first()).toHaveText("Bölüm 2, paragraf 1.");
  await expect.poll(async () => (await said(page))[1]).toBe("Bölüm 2, paragraf 1.");
  // A tap on another chapter's paragraph goes on from it.
  await reading.locator(".about-p", { hasText: "Bölüm 3, paragraf 2." }).click();
  await expect.poll(async () => (await said(page)).at(-1)).toBe("Bölüm 3, paragraf 2.");
  const player = page.getByRole("region", { name: /Sesli okuma|okuma/ });
  await expect(player).toContainText("Bölüm 3");
  // Back twice: the paragraph before (its chapter's first, so the title first), then the last paragraph of the
  // chapter before.
  const before = (await said(page)).length;
  await player.getByRole("button", { name: /Önceki paragraf/ }).click();
  await expect.poll(async () => (await said(page)).slice(before, before + 2)).toEqual(["Bölüm 3", "Bölüm 3, paragraf 1."]);
  await player.getByRole("button", { name: /Önceki paragraf/ }).click();
  await expect.poll(async () => (await said(page)).at(-1)).toBe("Bölüm 2, paragraf 2.");
  await expect(player).toContainText("Bölüm 2");
});
