import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { and, eq, inArray, like } from "drizzle-orm";
import { validateCityScene, validateSite, type CityScene, type HeritageSite, type HeritageRoute, type Trust } from "@akar/domain";
import { loadConfig } from "../config.ts";
import { countTriangles, partNames, readGlbJson } from "../modules/media/glb.ts";
import { storageFromConfig } from "../modules/media/storage-config.ts";
import { createDb } from "./client.ts";
import { loadCatalog } from "./seed.ts";
import { cities, historyImages, media, siteAboutChapters, siteMedia, sitePartCardPhotos, sitePartCards, siteSectionPhotos, siteSections, sites, type AboutReading } from "./schema/index.ts";

type ArchiveEntry = { id: string; file: string; caption: string; dateLabel: string; alt: string; license: string; credit: string; trust: Trust; sourceId: string };
type BookPhoto = { id: string; file: string; alt: string; title: string; description: string; license: string; trust: Trust; sourceId: string };
type ContentSite = Omit<HeritageSite, "photos" | "model" | "historyImages" | "partCards" | "chapters" | "aboutCover" | "sections"> & {
  photos: Array<NonNullable<HeritageSite["photos"]>[number] & { file: string; galleryPosition: number | null }>;
  model: NonNullable<HeritageSite["model"]> & { file: string };
  historyImages: ArchiveEntry[];
  sections: Array<{
    id: string; kind: "history" | "architecture" | "waqf"; title: string; body: string; trust: Trust; sourceId: string;
    chapterId: string | null; photos: Array<{ id: string; aspect: number | null; alt: string }>;
  }>;
  chapters: Array<{ id: string; title: string; kind: "history" | "architecture" | "waqf"; reading: AboutReading }>;
  /** Book photographs that are not gallery photographs; the others resolve to `photos`. */
  bookPhotos: BookPhoto[];
  aboutCoverPhotoId: string | null;
  partCards: Array<{ id: string; parts: string[]; title: string; body: string; photoIds: string[]; trust: Trust; sourceId: string }>;
};
type Manifest = { version: number; sites: ContentSite[]; routes: HeritageRoute[]; retireSiteIds: string[]; cities: Array<{ name: string; scene: CityScene }> };
const MIME: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".glb": "model/gltf-binary" };

/** The default is a local validation/size report. --apply explicitly enables Storage and DB writes. */
export async function importDemoContent(manifestFile: string, contentRoot: string, apply: boolean, env: NodeJS.ProcessEnv = process.env) {
  const manifest = JSON.parse(await readFile(manifestFile, "utf8")) as Manifest;
  if (manifest.version !== 1 || manifest.sites.length !== 7) throw new Error("Expected the reviewed seven-site manifest (version 1)");
  for (const city of manifest.cities) {
    if (!manifest.sites.some((s) => s.city === city.name)) throw new Error(`City ${city.name} has no site in the manifest`);
    validateCityScene(city.scene);
  }
  const root = await realpath(contentRoot);
  const files = new Map<string, { body: Buffer; key: string; mime: string }>();
  const mediaFiles = new Map<string, string>();
  const triangles = new Map<string, number>();
  for (const site of manifest.sites) {
    validateSite({ ...site, historyImages: [], partCards: [], chapters: [], sections: site.sections.map(({ chapterId: _chapter, photos: _photos, ...section }) => section) });
    const ids = new Set(site.photos.map((p) => p.id));
    if (!ids.has(site.coverPhotoId ?? "") || site.stories.some((s) => !ids.has(s.photoId ?? ""))) throw new Error(`Unresolved photographs: ${site.id}`);
    if (site.partCards.some((c) => c.photoIds.some((p) => !ids.has(p)))) throw new Error(`Unresolved part card photographs: ${site.id}`);
    const chapterIds = new Set(site.chapters.map((c) => c.id));
    const bookIds = new Set([...ids, ...site.bookPhotos.map((p) => p.id)]);
    if (site.aboutCoverPhotoId !== null && !ids.has(site.aboutCoverPhotoId)) throw new Error(`Unresolved about cover photograph: ${site.id}`);
    if (site.sections.some((s) => (s.chapterId !== null && !chapterIds.has(s.chapterId)) || s.photos.some((p) => !bookIds.has(p.id)))) throw new Error(`Unresolved chapter or section photographs: ${site.id}`);
    for (const item of [...site.photos, ...site.bookPhotos, ...site.historyImages, { ...site.model, id: `${site.id}-model` }]) {
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
  }
  const unique = new Map([...files.values()].map((f) => [f.key, f]));
  const report = { sites: manifest.sites.length, objects: unique.size, bytes: [...unique.values()].reduce((n, f) => n + f.body.length, 0), applied: apply };
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
      await loadCatalog(tx, { sites: manifest.sites.map(({ historyImages: _history, sections: _sections, partCards: _parts, chapters: _chapters, bookPhotos: _book, aboutCoverPhotoId: _about, ...site }) => site), routes: manifest.routes });
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
          await tx.insert(historyImages).values({ id: h.id, siteId: site.id, position, mediaId: h.id, caption: h.caption,
            dateLabel: h.dateLabel, sourceId: h.sourceId, trust: h.trust });
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
        for (const id of [...site.photos.map((p) => p.id), `${site.id}-model`]) {
          const file = files.get(mediaFiles.get(id)!)!;
          // Shared content-addressed files are seed-managed (storage_key stays null); deleting one site must not delete another's photo.
          await tx.update(media).set({ bytes: file.body.length, ...(id.endsWith("-model") ? { triangles: triangles.get(id)!, partsStatus: "done" as const, license: "AKAR ekip üretimi · temsili model" } : {}) }).where(eq(media.id, id));
        }
      }
      await tx.update(sites).set({ status: "draft" }).where(and(inArray(sites.id, manifest.retireSiteIds), like(sites.sourceSummary, "15 Ekim AKAR ürün notları%")));
      // loadCatalog created the city rows from the sites; the scene comes from the city record (§11.42).
      for (const city of manifest.cities) await tx.update(cities).set({ scene: city.scene }).where(eq(cities.name, city.name));
    });
  } finally { await pool.end(); }
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { values } = parseArgs({ options: { manifest: { type: "string" }, content: { type: "string" }, apply: { type: "boolean", default: false } } });
  if (!values.manifest || !values.content) throw new Error("Use --manifest <json> --content <docs/documents-context> [--apply]");
  console.log(JSON.stringify(await importDemoContent(values.manifest, values.content, values.apply)));
}
