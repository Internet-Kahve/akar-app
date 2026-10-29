import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { and, eq, inArray, like, notInArray, sql } from "drizzle-orm";
import { validateCityMap, validateCityScene, validateSite, type CityRecord, type HeritageSite, type HeritageRoute, type Trust } from "@akar/domain";
import { slugify } from "../modules/catalog/service.ts";
import { loadConfig } from "../config.ts";
import type { Tx } from "../platform/idempotency.ts";
import { countTriangles, partNames, readGlbJson } from "../modules/media/glb.ts";
import { storageFromConfig } from "../modules/media/storage-config.ts";
import { createDb } from "./client.ts";
import { loadCatalog } from "./seed.ts";
import { cities, historyAngleMatches, historyImages, media, siteAboutChapters, siteBadges, siteMedia, sitePartCardPhotos, sitePartCards, siteSampleTraces, siteSectionPhotos, siteSections, siteTaskAnswers, siteTasks, sites, type AboutReading, type FieldTaskDetails, type HistoryAngleMatch, type QuizTaskDetails } from "./schema/index.ts";

/**
 * A photograph the visitor sees with its credit line and licence word for word (§11.47): the present-day pair of an
 * archive photograph, or the photograph of a team-made İz Bırak sample.
 */
type CreditedPhoto = { id: string; file: string; alt: string; credit: string; license: string };
type PresentPhoto = CreditedPhoto & { angleMatch: HistoryAngleMatch };
type SampleTrace = CreditedPhoto & {
  author: string; text: string; addedOn: string;
  /** The site's archive photograph (`ArchiveEntry.id`) this shows the same view of; null = none. */
  historyImageId: string | null; angleMatch: HistoryAngleMatch | null;
};
type ArchiveEntry = { id: string; file: string; caption: string; dateLabel: string; alt: string; license: string; credit: string; trust: Trust; sourceId: string; present?: PresentPhoto | null };
type BookPhoto = { id: string; file: string; alt: string; title: string; description: string; license: string; trust: Trust; sourceId: string };
type ContentTask = {
  id: string; kind: "quiz" | "field"; title: string; prompt: string; photoId: string | null; part: string | null; source: string | null; trust: Trust;
  /** Quiz only: index of the right option (stored server-side in `site_task_answers`). */
  correctIndex: number | null;
  details: QuizTaskDetails | FieldTaskDetails;
};
type ContentBadge = { id: string; title: string; text: string; condition: "story" | "task"; taskId: string | null; onSiteLabel: boolean };
type ContentSite = Omit<HeritageSite, "photos" | "model" | "historyImages" | "sampleTraces" | "partCards" | "chapters" | "aboutCover" | "sections" | "tasks" | "badges"> & {
  photos: Array<NonNullable<HeritageSite["photos"]>[number] & { file: string; galleryPosition: number | null }>;
  model: NonNullable<HeritageSite["model"]> & { file: string };
  historyImages: ArchiveEntry[];
  /** Team-made İz Bırak samples (`gecmisi-gor/izler.json`, §11.47); empty for a site without any. */
  sampleTraces: SampleTrace[];
  sections: Array<{
    id: string; kind: "history" | "architecture" | "waqf"; title: string; body: string; trust: Trust; sourceId: string;
    chapterId: string | null; photos: Array<{ id: string; aspect: number | null; alt: string }>;
  }>;
  chapters: Array<{ id: string; title: string; kind: "history" | "architecture" | "waqf"; reading: AboutReading }>;
  /** Book photographs that are not gallery photographs; the others resolve to `photos`. */
  bookPhotos: BookPhoto[];
  aboutCoverPhotoId: string | null;
  partCards: Array<{ id: string; parts: string[]; title: string; body: string; photoIds: string[]; trust: Trust; sourceId: string }>;
  /** `icerik/gorevler.json` (§11.44); empty for a site without one. */
  tasks: ContentTask[];
  badges: ContentBadge[];
};
type ContentCity = Omit<CityRecord, "siteCount">;
type Manifest = { version: number; sites: ContentSite[]; routes: HeritageRoute[]; retireSiteIds: string[]; cities: ContentCity[] };
const MIME: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".glb": "model/gltf-binary" };

/** Tasks and badges of one site: photographs and model parts resolve, answer keys and badge conditions are consistent. */
function validateTasks(site: ContentSite, photoIds: Set<string>): void {
  const fail = (what: string, ...ids: string[]): never => { throw new Error(`${what}: ${[site.id, ...ids].join(" ")}`); };
  const taskIds = new Set(site.tasks.map((t) => t.id));
  if (taskIds.size !== site.tasks.length || new Set(site.badges.map((b) => b.id)).size !== site.badges.length) fail("Duplicate task or badge id");
  for (const task of site.tasks) {
    const where = task.id;
    if (task.photoId !== null && !photoIds.has(task.photoId)) fail("Unresolved task photograph", where);
    if (task.part !== null && !site.model.parts.includes(task.part)) fail("Task part is not a model part", where, task.part);
    if (task.kind === "quiz") {
      const d = task.details as QuizTaskDetails;
      if (!Array.isArray(d.options) || d.options.length < 2 || d.options.length > 6) fail("Quiz needs 2-6 options", where);
      if (!Number.isInteger(task.correctIndex) || task.correctIndex! < 0 || task.correctIndex! >= d.options.length) fail("Quiz answer is not an option", where);
    } else {
      const d = task.details as FieldTaskDetails;
      if (task.correctIndex !== null) fail("Field task has an answer key", where);
      if (!Number.isInteger(d.onSite.radiusM) || d.onSite.radiusM <= 0) fail("Field task radius", where);
      if (d.fromHome && !site.model.parts.includes(d.fromHome.part)) fail("Task part is not a model part", where, d.fromHome.part);
    }
  }
  for (const badge of site.badges) {
    if ((badge.condition === "task") !== (badge.taskId !== null) || (badge.taskId !== null && !taskIds.has(badge.taskId))) fail("Badge condition", badge.id);
  }
}

const ANGLE_MATCHES: readonly string[] = historyAngleMatches;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Present-day photographs and İz Bırak samples of one site (§11.47): each photograph has its credit line, licence and
 * description (shown to visitors as written), angle matches are known words, a sample's archive photograph is one of
 * the site's own.
 */
function validateHistoryExtras(site: ContentSite): void {
  const fail = (what: string, ...ids: string[]): never => { throw new Error(`${what}: ${[site.id, ...ids].join(" ")}`); };
  const credited = (p: CreditedPhoto) => { if (!p.credit.trim() || !p.license.trim() || !p.alt.trim()) fail("Photograph without credit line, licence or description", p.id); };
  for (const present of site.historyImages.flatMap((h) => (h.present ? [h.present] : []))) {
    credited(present);
    if (!ANGLE_MATCHES.includes(present.angleMatch)) fail("Unknown angle match", present.id);
  }
  const history = new Set(site.historyImages.map((h) => h.id));
  for (const t of site.sampleTraces) {
    credited(t);
    if (!t.author.trim() || !t.text.trim()) fail("Sample trace without author or text", t.id);
    if (!DAY.test(t.addedOn) || Number.isNaN(Date.parse(t.addedOn))) fail("Sample trace date is not YYYY-MM-DD", t.id);
    if (t.historyImageId !== null && !history.has(t.historyImageId)) fail("Sample trace names no archive photograph of the site", t.id, t.historyImageId);
    if (t.angleMatch !== null && !ANGLE_MATCHES.includes(t.angleMatch)) fail("Unknown angle match", t.id);
  }
}

/** Present-day photographs and sample traces become `media` rows keyed by their ids, so no id may repeat another photograph's. */
function checkExtraMediaIds(manifest: Manifest): void {
  const taken = new Set(manifest.sites.flatMap((s) => [`${s.id}-model`, ...[...s.photos, ...s.bookPhotos, ...s.historyImages].map((x) => x.id)]));
  for (const id of manifest.sites.flatMap((s) => [...s.historyImages.flatMap((h) => (h.present ? [h.present.id] : [])), ...s.sampleTraces.map((t) => t.id)])) {
    if (taken.has(id)) throw new Error(`Media id used twice: ${id}`);
    taken.add(id);
  }
}

/** The default is a local validation/size report. --apply explicitly enables Storage and DB writes. */
export async function importDemoContent(manifestFile: string, contentRoot: string, apply: boolean, env: NodeJS.ProcessEnv = process.env) {
  const manifest = JSON.parse(await readFile(manifestFile, "utf8")) as Manifest;
  if (manifest.version !== 1 || manifest.sites.length !== 7) throw new Error("Expected the reviewed seven-site manifest (version 1)");
  for (const city of manifest.cities) {
    // loadCatalog keys the city row a site creates by slugify(name); the record must land on that row.
    if (city.id !== slugify(city.name)) throw new Error(`City id ${city.id} does not match its name ${city.name}`);
    if (city.scene) validateCityScene(city.scene);
    if (city.map) validateCityMap(city.map);
    else if (city.isDefault) throw new Error(`Default city ${city.id} has no map view`);
  }
  if (manifest.cities.filter((c) => c.isDefault).length > 1) throw new Error("More than one default city");
  for (const site of manifest.sites)
    if (!manifest.cities.some((c) => c.name === site.city)) throw new Error(`Site ${site.id} has no city record (${site.city})`);
  checkExtraMediaIds(manifest);
  const root = await realpath(contentRoot);
  const files = new Map<string, { body: Buffer; key: string; mime: string }>();
  const mediaFiles = new Map<string, string>();
  const triangles = new Map<string, number>();
  for (const site of manifest.sites) {
    const { tasks: _tasks, badges: _badges, sampleTraces: _traces, ...validated } = site;
    validateSite({ ...validated, historyImages: [], partCards: [], chapters: [], sections: site.sections.map(({ chapterId: _chapter, photos: _photos, ...section }) => section) });
    const ids = new Set(site.photos.map((p) => p.id));
    if (!ids.has(site.coverPhotoId ?? "") || site.stories.some((s) => !ids.has(s.photoId ?? ""))) throw new Error(`Unresolved photographs: ${site.id}`);
    if (site.partCards.some((c) => c.photoIds.some((p) => !ids.has(p)))) throw new Error(`Unresolved part card photographs: ${site.id}`);
    const chapterIds = new Set(site.chapters.map((c) => c.id));
    const bookIds = new Set([...ids, ...site.bookPhotos.map((p) => p.id)]);
    if (site.aboutCoverPhotoId !== null && !ids.has(site.aboutCoverPhotoId)) throw new Error(`Unresolved about cover photograph: ${site.id}`);
    if (site.sections.some((s) => (s.chapterId !== null && !chapterIds.has(s.chapterId)) || s.photos.some((p) => !bookIds.has(p.id)))) throw new Error(`Unresolved chapter or section photographs: ${site.id}`);
    const extraPhotos = [...site.historyImages.flatMap((h) => (h.present ? [h.present] : [])), ...site.sampleTraces];
    for (const item of [...site.photos, ...site.bookPhotos, ...site.historyImages, ...extraPhotos, { ...site.model, id: `${site.id}-model` }]) {
      const file = await realpath(resolve(root, item.file));
      if (!file.startsWith(root + sep)) throw new Error("Content path leaves the supplied root");
      if (!files.has(item.file)) {
        const body = await readFile(file), extension = extname(file).toLowerCase(), mime = MIME[extension];
        if (!mime || !body.length || body.length > 50 * 1024 * 1024) throw new Error(`Unsupported content file: ${item.file}`);
        const key = `demo/content/${createHash("sha256").update(body).digest("hex")}${extension}`;
        files.set(item.file, { body, key, mime });
      }
      mediaFiles.set(item.id, item.file);
    }
    const model = files.get(site.model.file)!;
    const gltf = await readGlbJson(model.body.length, async ({ start, end }) => model.body.subarray(start, end + 1));
    site.model.parts = partNames(gltf);
    triangles.set(`${site.id}-model`, countTriangles(gltf));
    site.model.bytes = model.body.length;
    site.stories.forEach((story) => {
      // Editorial group names may be prefixes, while GLB nodes carry numbered suffixes.
      story.highlights = [...new Set((story.highlights ?? []).flatMap((prefix) => site.model.parts.filter((part) => part === prefix || part.startsWith(prefix + "_"))))];
      const target = story.camera?.target;
      if (target && !site.model.parts.includes(target)) throw new Error(`Camera target is not a model part: ${site.id} ${story.id} ${target}`);
    });
    const missing = (site.model.coverGroups ?? []).flat().filter((part) => !site.model.parts.includes(part));
    if (missing.length) throw new Error(`Cover group parts are not model parts: ${site.id} ${missing.join(", ")}`);
    const outside = site.chapters.flatMap((c) => [...c.reading.focusParts, ...(c.reading.camera?.target ? [c.reading.camera.target] : [])]).filter((part) => !site.model.parts.includes(part));
    if (outside.length) throw new Error(`Chapter parts are not model parts: ${site.id} ${[...new Set(outside)].join(", ")}`);
    const unknown = site.partCards.flatMap((c) => c.parts).filter((part) => !site.model.parts.includes(part));
    if (unknown.length) throw new Error(`Part card parts are not model parts: ${site.id} ${unknown.join(", ")}`);
    validateTasks(site, ids);
    validateHistoryExtras(site);
  }
  const unique = new Map([...files.values()].map((f) => [f.key, f]));
  const presentPhotos = manifest.sites.reduce((n, s) => n + s.historyImages.filter((h) => h.present).length, 0);
  const report = { sites: manifest.sites.length, objects: unique.size, bytes: [...unique.values()].reduce((n, f) => n + f.body.length, 0), presentPhotos, sampleTraces: manifest.sites.reduce((n, s) => n + s.sampleTraces.length, 0), applied: apply };
  if (!apply) return report;
  const config = loadConfig(env);
  const storage = storageFromConfig(config)?.media;
  if (!storage) throw new Error("Storage must be configured before --apply");
  // Upload everything first: a failed transfer must not publish broken catalogue references.
  for (const file of unique.values()) {
    const existing = await storage.head(file.key);
    if (!existing) await storage.put(file.key, file.body, file.mime);
    else if (existing.bytes !== file.body.length || existing.contentType !== file.mime) throw new Error("Content-addressed object mismatch");
  }
  for (const site of manifest.sites) {
    for (const photo of site.photos) photo.src = storage.publicUrl(files.get(photo.file)!.key);
    site.model.src = storage.publicUrl(files.get(site.model.file)!.key);
  }
  const { db, pool } = createDb(config.DATABASE_URL, 2, config.DATABASE_SSL_CA);
  try {
    await db.transaction(async (tx) => {
      await loadCatalog(tx, { sites: manifest.sites.map(({ historyImages: _history, sampleTraces: _traces, sections: _sections, partCards: _parts, chapters: _chapters, bookPhotos: _book, aboutCoverPhotoId: _about, tasks: _tasks, badges: _badges, ...site }) => site), routes: manifest.routes });
      // A present-day photograph or a sample's photograph is a `media` row of its own, credited as the file says.
      const upsertPhoto = async (p: CreditedPhoto, trust: Trust) => {
        const file = files.get(p.file)!;
        const row = { kind: "photo" as const, mime: file.mime, url: storage.publicUrl(file.key), alt: p.alt, title: p.alt, description: p.credit, license: p.license, trust, bytes: file.body.length };
        await tx.insert(media).values({ id: p.id, ...row }).onConflictDoUpdate({ target: media.id, set: row });
      };
      for (const site of manifest.sites) {
        // The seed includes every story photo; only editorial gallery entries belong in site_media.
        await tx.delete(siteMedia).where(eq(siteMedia.siteId, site.id));
        const gallery = site.photos.filter((p) => p.galleryPosition !== null).sort((a, b) => a.galleryPosition! - b.galleryPosition!);
        await tx.insert(siteMedia).values([...gallery.map((p) => p.id), `${site.id}-model`].map((mediaId, position) => ({ siteId: site.id, mediaId, position })));
        await tx.delete(historyImages).where(eq(historyImages.siteId, site.id));
        for (const [position, h] of site.historyImages.entries()) {
          const file = files.get(h.file)!;
          // A separate row per site keeps attribution and edit ownership explicit even when bytes are shared.
          const row = { kind: "photo" as const, mime: file.mime, url: storage.publicUrl(file.key), alt: h.alt, title: h.caption,
            description: h.credit, license: h.license, sourceId: h.sourceId, trust: h.trust, bytes: file.body.length };
          await tx.insert(media).values({ id: h.id, ...row }).onConflictDoUpdate({ target: media.id, set: row });
          if (h.present) await upsertPhoto(h.present, "verified");
          await tx.insert(historyImages).values({ id: h.id, siteId: site.id, position, mediaId: h.id, presentMediaId: h.present?.id ?? null, presentAngleMatch: h.present?.angleMatch ?? null,
            caption: h.caption, dateLabel: h.dateLabel, sourceId: h.sourceId, trust: h.trust });
        }
        // Samples replace the site's whole set; the archive photograph they point at was inserted just above.
        await tx.delete(siteSampleTraces).where(eq(siteSampleTraces.siteId, site.id));
        for (const [position, t] of site.sampleTraces.entries()) {
          await upsertPhoto(t, "representative");
          await tx.insert(siteSampleTraces).values({ id: t.id, siteId: site.id, position, author: t.author, text: t.text, mediaId: t.id, historyImageId: t.historyImageId, angleMatch: t.angleMatch, addedOn: t.addedOn });
        }
        for (const b of site.bookPhotos) {
          const file = files.get(b.file)!;
          const row = { kind: "photo" as const, mime: file.mime, url: storage.publicUrl(file.key), alt: b.alt, title: b.title,
            description: b.description, license: b.license, sourceId: b.sourceId, trust: b.trust, bytes: file.body.length };
          await tx.insert(media).values({ id: b.id, ...row }).onConflictDoUpdate({ target: media.id, set: row });
        }
        // Paragraph photographs cascade with their paragraph, paragraphs with their chapter.
        await tx.delete(siteSections).where(eq(siteSections.siteId, site.id));
        await tx.delete(siteAboutChapters).where(eq(siteAboutChapters.siteId, site.id));
        if (site.chapters.length) await tx.insert(siteAboutChapters).values(site.chapters.map((chapter, position) => ({ ...chapter, siteId: site.id, position })));
        if (site.sections.length) {
          await tx.insert(siteSections).values(site.sections.map(({ photos: _photos, ...section }, position) => ({ ...section, siteId: site.id, position })));
          const placed = site.sections.flatMap((section) => section.photos.map((p, position) => ({ siteId: site.id, sectionId: section.id, position, mediaId: p.id, aspect: p.aspect, alt: p.alt })));
          if (placed.length) await tx.insert(siteSectionPhotos).values(placed);
        }
        await tx.update(sites).set({ aboutCoverMediaId: site.aboutCoverPhotoId }).where(eq(sites.id, site.id));
        // Photos cascade with their card.
        await tx.delete(sitePartCards).where(eq(sitePartCards.siteId, site.id));
        for (const [position, { photoIds, ...card }] of site.partCards.entries()) {
          await tx.insert(sitePartCards).values({ ...card, siteId: site.id, position });
          if (photoIds.length) await tx.insert(sitePartCardPhotos).values(photoIds.map((mediaId, i) => ({ cardId: card.id, position: i, mediaId })));
        }
        await replaceTasks(tx, site);
        for (const id of [...site.photos.map((p) => p.id), `${site.id}-model`]) {
          const file = files.get(mediaFiles.get(id)!)!;
          // Shared content-addressed files are seed-managed (storage_key stays null); deleting one site must not delete another's photo.
          await tx.update(media).set({ bytes: file.body.length, ...(id.endsWith("-model") ? { triangles: triangles.get(id)!, partsStatus: "done" as const, license: "AKAR ekip üretimi · temsili model" } : {}) }).where(eq(media.id, id));
        }
      }
      await tx.update(sites).set({ status: "draft" }).where(and(inArray(sites.id, manifest.retireSiteIds), like(sites.sourceSummary, "15 Ekim AKAR ürün notları%")));
      // loadCatalog created the city rows of the sites; the record adds map, inventory and scene, and the cities
      // without sites (§11.45). The default moves in two steps: the unique index allows one default at a time.
      await tx.update(cities).set({ isDefault: false }).where(eq(cities.isDefault, true));
      for (const { id, map, inventory, ...city } of manifest.cities) {
        const row = {
          ...city,
          centerLng: map?.center[0] ?? null,
          centerLat: map?.center[1] ?? null,
          zoom: map?.zoom ?? null,
          zoomDesktop: map?.zoomDesktop ?? null,
          inventoryName: inventory?.name ?? null,
          inventoryPublisher: inventory?.publisher ?? null,
          inventoryYear: inventory?.year ?? null,
          inventorySiteCount: inventory?.siteCount ?? null,
        };
        await tx.insert(cities).values({ id, ...row }).onConflictDoUpdate({ target: cities.id, set: row });
      }
    });
  } finally { await pool.end(); }
  return report;
}

/**
 * Brings the site's tasks, answer keys and badges to the manifest. Rows are upserted by id and only the vanished ones
 * are deleted, so a player's progress survives for every task or badge that is still there (the foreign keys cascade
 * only for the vanished). Positions are parked below zero first: the (site, position) unique key would otherwise
 * refuse a reorder.
 */
async function replaceTasks(tx: Tx, site: ContentSite): Promise<void> {
  await tx.update(siteTasks).set({ position: sql`-${siteTasks.position} - 1` }).where(eq(siteTasks.siteId, site.id));
  await tx.update(siteBadges).set({ position: sql`-${siteBadges.position} - 1` }).where(eq(siteBadges.siteId, site.id));
  for (const [position, { correctIndex, photoId, ...task }] of site.tasks.entries()) {
    const row = { ...task, siteId: site.id, position, mediaId: photoId };
    await tx.insert(siteTasks).values(row).onConflictDoUpdate({ target: siteTasks.id, set: row });
    if (correctIndex === null) await tx.delete(siteTaskAnswers).where(eq(siteTaskAnswers.taskId, task.id));
    else await tx.insert(siteTaskAnswers).values({ taskId: task.id, correctIndex }).onConflictDoUpdate({ target: siteTaskAnswers.taskId, set: { correctIndex } });
  }
  for (const [position, badge] of site.badges.entries()) {
    const row = { ...badge, siteId: site.id, position };
    await tx.insert(siteBadges).values(row).onConflictDoUpdate({ target: siteBadges.id, set: row });
  }
  const badgeIds = site.badges.map((b) => b.id), taskIds = site.tasks.map((t) => t.id);
  await tx.delete(siteBadges).where(badgeIds.length ? and(eq(siteBadges.siteId, site.id), notInArray(siteBadges.id, badgeIds)) : eq(siteBadges.siteId, site.id));
  await tx.delete(siteTasks).where(taskIds.length ? and(eq(siteTasks.siteId, site.id), notInArray(siteTasks.id, taskIds)) : eq(siteTasks.siteId, site.id));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { values } = parseArgs({ options: { manifest: { type: "string" }, content: { type: "string" }, apply: { type: "boolean", default: false } } });
  if (!values.manifest || !values.content) throw new Error("Use --manifest <json> --content <docs/documents-context> [--apply]");
  console.log(JSON.stringify(await importDemoContent(values.manifest, values.content, values.apply)));
}
