export type SiteKind = "cami" | "cesme" | "hamam" | "egitim";
export type Trust = "verified" | "inferred" | "representative";
export interface StoryBlock {
  id: string;
  title: string;
  text: string;
  simple: string;
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
}
export interface HeritageRoute {
  id: string;
  name: string;
  description: string;
  siteIds: string[];
  minutes: number;
  distance: string;
  theme: string;
}
export interface Memory {
  id: string;
  siteId: string;
  text: string;
  photo?: string;
  status: "pending" | "approved" | "rejected";
  reason?: string;
  createdAt: string;
  author: string;
}
export interface Snapshot {
  version: 1;
  sites: HeritageSite[];
  memories: Memory[];
  savedIds: string[];
  routeIds: string[];
  visitedIds: string[];
  readIds: string[];
  quizIds: string[];
  points: number;
  name: string;
}
export type Command =
  | { type: "save"; siteId: string }
  | { type: "route"; siteId: string }
  | { type: "visit" | "read" | "quiz"; siteId: string }
  | { type: "set-route"; siteIds: string[] }
  | { type: "memory"; memory: Memory }
  | {
      type: "moderate";
      id: string;
      status: "approved" | "rejected";
      reason?: string;
    }
  | { type: "site"; site: HeritageSite };
export const kindLabels: Record<SiteKind, string> = {
  cami: "Cami",
  cesme: "Çeşme",
  hamam: "Hamam",
  egitim: "Eğitim",
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
  if (!site.name.trim() || !site.city.trim() || !site.description.trim())
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
const toggle = (ids: string[], id: string) =>
  ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
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
    case "quiz":
      if (!next.quizIds.includes(command.siteId)) {
        next.quizIds.push(command.siteId);
        next.points += 20;
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
      if (memory.status !== "pending") break;
      if (command.status === "rejected" && !command.reason?.trim())
        throw new Error("Ret nedeni zorunludur.");
      memory.status = command.status;
      memory.reason = command.reason;
      if (command.status === "approved") next.points += 25;
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
