import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// Local demo content (`npm run dev:content`): the editorial packages of docs/documents-context, read by the same
// prepare-demo-content.py as the import, shaped as the API's site detail reaches the app (http.ts `mapSite`). No
// database or storage: the files are served from public/icerik/eserler, a link to the packages. Model placements come
// from each 3d/model.json, as in the prototype (the live API keeps the panel's placements instead).
const repo = fileURLToPath(new URL("../../../", import.meta.url));
const content = join(repo, "docs/documents-context");
const target = fileURLToPath(new URL("../public/icerik/", import.meta.url));
mkdirSync(target, { recursive: true });
const link = join(target, "eserler");
if (!existsSync(link) && !lstatSync(link, { throwIfNoEntry: false })) symlinkSync(relative(target, join(content, "eserler")), link);
const manifestPath = join(mkdtempSync(join(tmpdir(), "akar-icerik-")), "manifest.json");
execFileSync("python3", [join(repo, "services/api/scripts/prepare-demo-content.py"), "--content", content, "--output", manifestPath], { stdio: ["ignore", "ignore", "inherit"] });
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

const src = (file) => "/icerik/" + file.split("/").map(encodeURIComponent).join("/");
const photo = (p, extra = {}) => ({ id: p.id, src: src(p.file), alt: p.alt, title: p.title, titleEn: p.titleEn ?? "", description: p.description, sourceId: p.sourceId ?? "", license: p.license, trust: p.trust, ...extra });
const credited = (p, trust) => photo({ ...p, title: p.alt, description: p.credit, trust });

/** Distinct node then mesh names of a GLB's JSON chunk, as the server's `media.glb-parts` job stores them. */
function glbParts(path) {
  const bytes = readFileSync(path);
  const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString("utf8"));
  return [...new Set([...(gltf.nodes ?? []), ...(gltf.meshes ?? [])].map((x) => x.name).filter((n) => n?.trim()))];
}

/** Task keys stay inside the mock client, like the server's `site_task_answers`. */
const taskKeys = {};
const sites = manifest.sites.map((s) => {
  const media = new Map([...s.photos.map((p) => [p.id, photo(p)]), ...s.bookPhotos.map((b) => [b.id, photo(b)])]);
  const used = new Set([s.coverPhotoId, ...s.stories.map((x) => x.photoId)]);
  const gallery = s.photos.filter((p) => p.galleryPosition !== null).sort((a, b) => a.galleryPosition - b.galleryPosition);
  let model;
  if (s.model) {
    const folder = s.model.file.split("/")[1];
    const info = JSON.parse(readFileSync(join(content, "eserler", folder, "3d/model.json"), "utf8"));
    const file = join(content, s.model.file);
    model = {
      name: s.model.name, bytes: statSync(file).size, src: src(s.model.file), parts: glbParts(file), trust: s.model.trust, triangles: null,
      ...(s.model.coverGroups.length && { coverGroups: s.model.coverGroups }),
      ...(info.ic_parcalar?.length && { interiorParts: info.ic_parcalar }),
      placement: { lng: s.coordinates[0], lat: s.coordinates[1], headingDeg: info.yaw ?? 0, frontDeg: info.on_yonu ?? null, scale: 1, altitudeM: 0,
        anchorNode: info.ana_parca || null, hiddenPoints: [], keptPoints: [] },
    };
  }
  for (const t of s.tasks) taskKeys[t.id] = t.kind === "quiz" ? { correctIndex: t.correctIndex, correctText: t.details.correctText } : { doneText: t.details.doneText };
  return {
    id: s.id, name: s.name, city: s.city, district: s.district ?? "", year: s.year, architect: s.architect, kind: s.kind, coordinates: s.coordinates,
    minutes: s.minutes, description: s.description, status: "published", source: s.source, tier: s.tier,
    stories: s.stories.map(({ photoId, sourceId, camera, interior, routeOnly, flow, ...x }) => ({
      ...x, ...(photoId && { photoId }), ...(sourceId && { sourceId }), ...(camera && { camera }), ...(interior && { interior }), ...(routeOnly && { routeOnly }), ...(flow && { flow }),
    })),
    photos: gallery.map((p) => media.get(p.id)),
    sources: s.sources,
    sections: s.sections.map(({ chapterId, photos, ...x }) => ({
      ...x, ...(chapterId && { chapterId }),
      ...(photos.length && { photos: photos.map((p) => ({ photo: media.get(p.id), alt: p.alt, ...(p.aspect !== null && { aspect: p.aspect }) })) }),
    })),
    ...(s.chapters.length && {
      chapters: s.chapters.map(({ reading: { camera, quotes, ...reading }, ...x }) => ({ ...x, ...reading, quotes: quotes.map(({ text, by }) => ({ text, ...(by && { by }) })), ...(camera && { camera }) })),
    }),
    ...(s.aboutCoverPhotoId && { aboutCover: media.get(s.aboutCoverPhotoId) }),
    storyPhotos: s.photos.filter((p) => used.has(p.id)).map((p) => media.get(p.id)),
    historyImages: s.historyImages.map((h) => ({
      id: h.id, photo: photo({ ...h, title: h.caption, description: h.credit }), caption: h.caption, dateLabel: h.dateLabel, sourceId: h.sourceId, trust: h.trust,
      ...(h.viewpoint && { viewpoint: h.viewpoint }),
      ...(h.present && { presentPhoto: credited(h.present, "verified"), presentAngleMatch: h.present.angleMatch }),
    })),
    ...(s.sampleTraces.length && {
      sampleTraces: s.sampleTraces.map((t) => ({ id: t.id, author: t.author, text: t.text, photo: credited(t, "representative"), addedOn: t.addedOn,
        ...(t.historyImageId && { historyImageId: t.historyImageId }), ...(t.angleMatch && { angleMatch: t.angleMatch }) })),
    }),
    ...(s.partCards.length && {
      partCards: s.partCards.map(({ photoIds, sourceId, ...c }) => ({ ...c, photos: photoIds.map((id) => media.get(id)), ...(sourceId && { sourceId }) })),
    }),
    ...(s.tasks.length && {
      tasks: s.tasks.map((t) => ({
        id: t.id, kind: t.kind, title: t.title, prompt: t.prompt, trust: t.trust,
        ...(t.photoId && { photo: media.get(t.photoId) }), ...(t.part && { part: t.part }), ...(t.source && { source: t.source }),
        ...(t.kind === "quiz"
          ? { quiz: { options: t.details.options, hints: t.details.hints, wrongText: t.details.wrongText, fromHome: t.details.fromHome } }
          : { field: { onSite: t.details.onSite, fromHome: t.details.fromHome } }),
      })),
    }),
    ...(s.badges.length && { badges: s.badges }),
    ...(s.patron && { patron: s.patron }),
    ...(s.role && { role: s.role }),
    ...(s.relatedSiteId && { relatedSiteId: s.relatedSiteId }),
    ...(typeof s.displayOrder === "number" && { displayOrder: s.displayOrder }),
    ...(s.coverPhotoId && { coverPhotoId: s.coverPhotoId }),
    ...(model && { model }),
  };
});
writeFileSync(join(target, "demo-content.json"), JSON.stringify({ sites, routes: manifest.routes, cities: manifest.cities, taskKeys }));
console.log(`demo content: ${sites.length} sites, ${sites.filter((s) => s.model).length} models → ${relative(repo, target)}`);
