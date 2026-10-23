export type SiteKind =
  "cami" | "cesme" | "hamam" | "han" | "bedesten" | "egitim" | "turbe";
export type Trust = "verified" | "inferred" | "representative";
export interface SiteSource {
  id: string;
  title: string;
  kind: "book" | "article" | "archive" | "web" | "field";
  author: string;
  year: string;
  page: string;
  url: string;
  trust: Trust;
}
export interface SitePhoto {
  id: string;
  src: string;
  alt: string;
  title: string;
  titleEn: string;
  description: string;
  sourceId: string;
  license: string;
  trust: Trust;
}
export interface SiteModel {
  name: string;
  bytes: number;
  src: string;
  parts: string[];
  trust: Trust;
}
export interface StoryBlock {
  id: string;
  title: string;
  text: string;
  simple: string;
  trust: Trust;
  textEn?: string;
  photoId?: string;
  sourceId?: string;
  showCard?: boolean;
  highlights?: string[];
}
export interface HistoryImage {
  id: string;
  photo: SitePhoto;
  presentPhoto?: SitePhoto;
  caption: string;
  dateLabel: string;
  sourceId: string;
  trust: Trust;
}
export interface HeritageSite {
  id: string;
  name: string;
  city: string;
  district: string;
  year: string;
  architect: string;
  kind: SiteKind;
  coordinates: [number, number];
  minutes: number;
  description: string;
  status: "published" | "draft";
  stories: StoryBlock[];
  source: string;
  tier: "Hero" | "Tier 2" | "Tier 1";
  editorVersion?: 2;
  nameEn?: string;
  descriptionEn?: string;
  patron?: string;
  era?: string;
  address?: string;
  role?: "akar" | "hayrat" | "both";
  relatedSiteId?: string;
  photos?: SitePhoto[];
  sources?: SiteSource[];
  coverPhotoId?: string;
  model?: SiteModel;
  historyImages?: HistoryImage[];
  storyPhotos?: SitePhoto[];
  sections?: Array<{
    id: string;
    kind: "history" | "architecture" | "waqf";
    title: string;
    body: string;
    trust: Trust;
    sourceId: string;
  }>;
}
export interface HeritageRoute {
  id: string;
  name: string;
  description: string;
  siteIds: string[];
  minutes: number;
  distance: string;
  theme: string;
  nameEn?: string;
  status?: "draft" | "published";
}
export type Role = "user" | "editor" | "moderator" | "admin";
/** Points an approved memory earns and loses again when it is removed; the API's `memory.approved` ledger value. */
export const MEMORY_POINTS = 25;
export interface Memory {
  id: string;
  siteId: string;
  text: string;
  photo?: string;
  status: "pending" | "approved" | "rejected";
  reason?: string | undefined;
  createdAt: string;
  author: string;
}
export interface Snapshot {
  version: 1;
  sites: HeritageSite[];
  /** The current user's own memories (every status). */
  memories: Memory[];
  /** Moderation queue for staff; absent when `memories` is the whole local list (demo). */
  moderationQueue?: Memory[];
  /** Approved memories of published sites that are not in `memories`; absent in the demo. */
  publicMemories?: Memory[];
  savedIds: string[];
  routeIds: string[];
  /** Guest stops retained on this device because they could not be moved to the account. */
  pendingRouteCount?: number;
  visitedIds: string[];
  readIds: string[];
  quizIds: string[];
  points: number;
  name: string;
  catalogRoutes?: HeritageRoute[];
  /** Role of the signed-in user (`user` for a guest); absent in the demo, where the visitor runs the whole panel. */
  role?: Role;
}
export type Command =
  | { type: "save"; siteId: string }
  | { type: "route"; siteId: string }
  | { type: "visit" | "read"; siteId: string }
  | { type: "set-route"; siteIds: string[] }
  | { type: "memory"; memory: Memory }
  | { type: "delete-memory"; id: string }
  | { type: "admin-delete-memory"; id: string }
  | {
      type: "moderate";
      id: string;
      status: "approved" | "rejected";
      reason?: string;
    }
  | { type: "site"; site: HeritageSite }
  | { type: "catalog-routes"; routes: HeritageRoute[] }
  | { type: "photo"; photo: SitePhoto; source: SiteSource }
  | { type: "import-sites"; sites: HeritageSite[] };
export const kindLabels: Record<SiteKind, string> = {
  cami: "Cami",
  cesme: "Çeşme",
  hamam: "Hamam",
  han: "Han",
  bedesten: "Bedesten",
  egitim: "Eğitim",
  turbe: "Türbe",
};
export const trustLabels: Record<Trust, string> = {
  verified: "Doğrulanmış",
  inferred: "Tarihsel çıkarım",
  representative: "Temsili içerik",
};
export function normalize(text: string) {
  return text
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("ı", "i");
}
export function filterSites(
  sites: HeritageSite[],
  query: string,
  kind = "all",
  savedIds?: string[],
) {
  const term = normalize(query.trim());
  return sites.filter(
    (s) =>
      s.status === "published" &&
      (kind === "all" || s.kind === kind) &&
      (!savedIds || savedIds.includes(s.id)) &&
      normalize(`${s.name} ${s.city} ${s.district} ${s.architect}`).includes(
        term,
      ),
  );
}
export function validateSite(site: HeritageSite) {
  if (site.editorVersion === 2 && site.status === "published") {
    const errors = publicationIssues(site);
    if (errors.length) throw new Error(errors.join(" "));
  }
  if (
    site.editorVersion !== 2 &&
    (!site.name.trim() || !site.city.trim() || !site.description.trim())
  )
    throw new Error("Ad, şehir ve açıklama zorunludur.");
  const [lng, lat] = site.coordinates;
  if (
    !Number.isFinite(lng) ||
    !Number.isFinite(lat) ||
    Math.abs(lng) > 180 ||
    Math.abs(lat) > 90
  )
    throw new Error("Geçerli enlem ve boylam gir.");
  if (site.status === "published" && !site.source.trim())
    throw new Error("Yayınlamak için kaynak bilgisi ekle.");
}
/** Used by both the editor checklist and the mock command boundary. */
export function publicationIssues(site: HeritageSite): string[] {
  const issues: string[] = [];
  if (!site.name.trim() || !site.city.trim() || !site.description.trim())
    issues.push("Ad, şehir ve kısa tanım (TR) zorunludur.");
  const [lng, lat] = site.coordinates;
  if (
    !Number.isFinite(lng) ||
    !Number.isFinite(lat) ||
    Math.abs(lng) > 180 ||
    Math.abs(lat) > 90
  )
    issues.push("Geçerli enlem ve boylam gir.");
  const sources = site.sources ?? [];
  const photos = site.photos ?? [];
  if (!sources.length || sources.some((s) => !s.title.trim()))
    issues.push("En az bir başlıklı kaynak ekle.");
  if (!photos.some((p) => p.id === site.coverPhotoId))
    issues.push("Kapak fotoğrafı seç.");
  if (
    photos.some(
      (p) =>
        !p.src ||
        !p.alt.trim() ||
        !p.license.trim() ||
        !sources.some((s) => s.id === p.sourceId),
    )
  )
    issues.push("Her fotoğrafta alt metin, lisans ve kaynak zorunludur.");
  if (!site.stories.length) issues.push("En az bir hikâye cümlesi ekle.");
  site.stories.forEach((story, i) => {
    if (!story.text.trim()) issues.push(`${i + 1}. cümlenin metni eksik.`);
    if (!sources.some((s) => s.id === story.sourceId))
      issues.push(`${i + 1}. cümleye kaynak bağla.`);
    if (!photos.some((p) => p.id === story.photoId))
      issues.push(`${i + 1}. cümleye fotoğraf bağla.`);
    if (story.highlights?.some((part) => !site.model?.parts.includes(part)))
      issues.push(`${i + 1}. cümlede modelde bulunmayan vurgu var.`);
  });
  return issues;
}
const toggle = (ids: string[], id: string) =>
  ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
/** Approved memories of a site as a visitor sees them: own and public ones, each id once. */
export function approvedMemories(state: Snapshot, siteId: string): Memory[] {
  const seen = new Set<string>();
  return [...state.memories, ...(state.publicMemories ?? [])].filter((m) => {
    if (m.siteId !== siteId || m.status !== "approved" || seen.has(m.id))
      return false;
    seen.add(m.id);
    return true;
  });
}
/**
 * What a user may do with one memory in the UI. The server enforces the same rules (§11.17, §11.18);
 * the UI only hides what would fail.
 */
export function memoryPermissions(
  role: Role,
  status: Memory["status"],
  own: boolean,
) {
  // A moderator never decides their own memory (403); an admin may.
  const decides = role === "admin" || (role === "moderator" && !own);
  return {
    /** "Sil": the author deletes their own memory in any status. */
    remove: own,
    /** Approve or reject a pending memory. */
    decide: decides && status === "pending",
    /** "Yayından kaldır": reject a published memory with a reason. */
    takedown: decides && status === "approved",
    /** "Kalıcı sil": an admin deletes somebody else's published memory; own memories use "Sil". */
    purge: role === "admin" && !own && status === "approved",
  };
}
export function reduceSnapshot(state: Snapshot, command: Command): Snapshot {
  const next = structuredClone(state);
  if (
    "siteId" in command &&
    !state.sites.some(
      (s) => s.id === command.siteId && s.status === "published",
    )
  )
    throw new Error("Eser bulunamadı.");
  switch (command.type) {
    case "catalog-routes":
      if (
        command.routes.some(
          (r) =>
            !r.name.trim() ||
            new Set(r.siteIds).size !== r.siteIds.length ||
            r.siteIds.some((id) => !state.sites.some((s) => s.id === id)) ||
            (r.status === "published" &&
              (r.siteIds.length < 2 ||
                r.siteIds.some(
                  (id) =>
                    !state.sites.some(
                      (s) => s.id === id && s.status === "published",
                    ),
                ))),
        )
      )
        throw new Error(
          "Rota adı ve geçerli duraklar zorunludur. Yayın için en az iki yayındaki eser seç.",
        );
      next.catalogRoutes = structuredClone(command.routes);
      break;
    case "photo":
      if (
        !command.photo.alt.trim() ||
        !command.photo.license.trim() ||
        !command.photo.src ||
        command.photo.sourceId !== command.source.id ||
        !command.source.title.trim()
      )
        throw new Error("Fotoğrafın alt metni, lisansı ve kaynağı zorunludur.");
      next.sites.forEach((site) => {
        if (!site.photos?.some((p) => p.id === command.photo.id)) return;
        site.photos = site.photos.map((p) =>
          p.id === command.photo.id ? structuredClone(command.photo) : p,
        );
        site.sources = [
          ...(site.sources ?? []).filter((s) => s.id !== command.source.id),
          structuredClone(command.source),
        ];
      });
      break;
    case "import-sites": {
      const keys = new Set(
        next.sites.map((s) => normalize(`${s.name}|${s.district}`)),
      );
      for (const site of command.sites) {
        const key = normalize(`${site.name}|${site.district}`);
        if (keys.has(key)) continue;
        const draft = {
          ...structuredClone(site),
          status: "draft" as const,
          editorVersion: 2 as const,
        };
        validateSite(draft);
        if (!draft.name.trim())
          throw new Error("İçe aktarılan eserin adı eksik.");
        next.sites.push(draft);
        keys.add(key);
      }
      break;
    }
    case "save":
      next.savedIds = toggle(next.savedIds, command.siteId);
      break;
    case "route":
      next.routeIds = toggle(next.routeIds, command.siteId);
      break;
    case "set-route":
      next.routeIds = [...new Set(command.siteIds)].filter((id) =>
        state.sites.some((s) => s.id === id && s.status === "published"),
      );
      break;
    case "visit":
      if (!next.visitedIds.includes(command.siteId)) {
        next.visitedIds.push(command.siteId);
        next.points += 100;
      }
      break;
    case "read":
      if (!next.readIds.includes(command.siteId)) {
        next.readIds.push(command.siteId);
        next.points += 15;
      }
      break;
    case "memory":
      if (!command.memory.text.trim() || command.memory.text.length > 280)
        throw new Error("Anın 1–280 karakter olmalı.");
      if (!next.sites.some((s) => s.id === command.memory.siteId))
        throw new Error("Eser bulunamadı.");
      if (!next.memories.some((m) => m.id === command.memory.id))
        next.memories.unshift({
          ...command.memory,
          text: command.memory.text.trim(),
          status: "pending",
        });
      break;
    case "moderate": {
      const memory = next.memories.find((m) => m.id === command.id);
      if (!memory) throw new Error("Katkı bulunamadı.");
      // Rejecting an approved memory is a takedown; any other decision on a decided memory changes nothing.
      const takedown =
        memory.status === "approved" && command.status === "rejected";
      if (memory.status !== "pending" && !takedown) break;
      const reason = command.reason?.trim();
      if (command.status === "rejected" && !reason)
        throw new Error("Ret nedeni zorunludur.");
      if (takedown) next.points = Math.max(0, next.points - MEMORY_POINTS);
      memory.status = command.status;
      memory.reason = command.status === "rejected" ? reason : undefined;
      if (command.status === "approved") next.points += MEMORY_POINTS;
      // A rejection or takedown deletes the photo; the text stays for the record.
      else delete memory.photo;
      break;
    }
    case "delete-memory":
    case "admin-delete-memory": {
      // The demo has one local list, so the author's and the admin's delete are the same.
      const at = next.memories.findIndex((m) => m.id === command.id);
      const memory = next.memories[at];
      if (!memory) throw new Error("Anı bulunamadı.");
      if (memory.status === "approved")
        next.points = Math.max(0, next.points - MEMORY_POINTS);
      next.memories.splice(at, 1);
      break;
    }
    case "site":
      validateSite(command.site);
      next.sites = next.sites.some((s) => s.id === command.site.id)
        ? next.sites.map((s) => (s.id === command.site.id ? command.site : s))
        : [...next.sites, command.site];
      break;
  }
  return next;
}
