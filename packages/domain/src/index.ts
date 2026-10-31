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
/** Where the site's model stands on the map (the API's public `SiteDetail.placement`). */
export interface MapPlacement {
  lng: number;
  lat: number;
  /** Clockwise from north, 0 ≤ x < 360. */
  headingDeg: number;
  /**
   * The way the main façade (the entrance) faces, clockwise from north, 0 ≤ x < 360. The map's sun stands in front
   * of it, a little to the left, so the front is lit (content: `3d/model.json → on_yonu`). Absent or `null`: the
   * city's light direction.
   */
  frontDeg?: number | null;
  /** 1 = one model unit is one metre. */
  scale: number;
  /** Metres added on top of the model resting on the ground. */
  altitudeM: number;
  /** Model part the base point is computed from; `null` = every part that is not presentation scenery. */
  anchorNode: string | null;
  /** One point of each OSM building the editor removed by hand. */
  hiddenPoints: Array<{ lng: number; lat: number }>;
  /** One point of each automatically hidden OSM building the editor asked back. */
  keptPoints: Array<{ lng: number; lat: number }>;
  /**
   * Panel only: `false` = saved but not drawn on the visitors' map (the public API returns no placement then).
   * Absent means shown.
   */
  visible?: boolean;
}
/** `GET /v1/map-settings`: values the administrator tunes. */
export interface MapSettings {
  /** The map loads models from this zoom level up. */
  modelMinZoom: number;
  /** Most models drawn at the same time. */
  maxVisibleModels: number;
}
/** Used until the settings are read, and by the demo. */
export const defaultMapSettings: MapSettings = {
  modelMinZoom: 16,
  maxVisibleModels: 10,
};
/** Light of the 3D models of a city, on the map and in the site viewer (decision §11.42). */
export interface SceneLight {
  /** Hemisphere (ambient) light intensity. */
  ambient: number;
  /** Sun (directional) light intensity. */
  sun: number;
  /** Fill light from the opposite side. */
  fill: number;
  /** Sun direction: degrees clockwise from north. */
  azimuthDeg: number;
  /** Sun height above the horizon in degrees. */
  elevationDeg: number;
  /** Material colour saturation multiplier (1 = unchanged). */
  saturation: number;
  /** Opacity of the soft ground shadow drawn under each model (0 = none). */
  groundShadow: number;
}
/** City record `scene` (`GET /v1/cities`): model light and the site viewer's background gradient. */
export interface CityScene {
  light: SceneLight;
  /** Viewer background, top and bottom of a vertical gradient, `#RRGGBB`. */
  backgroundTop: string;
  backgroundBottom: string;
}
/** Used for a city without a saved scene, and until the cities are read. */
export const defaultCityScene: CityScene = {
  light: {
    ambient: 2.3,
    sun: 1.3,
    fill: 0.5,
    azimuthDeg: 216,
    elevationDeg: 46,
    saturation: 1,
    groundShadow: 0,
  },
  backgroundTop: "#DCE3E4",
  backgroundBottom: "#C3CBCD",
};
const HEX_COLOUR = /^#[0-9A-Fa-f]{6}$/;
/** Throws on values the renderer cannot use; ranges are wide on purpose (designers tune them). */
export function validateCityScene(scene: CityScene) {
  const l = scene.light;
  const ranges: Array<[keyof SceneLight, number, number]> = [
    ["ambient", 0, 10],
    ["sun", 0, 10],
    ["fill", 0, 10],
    ["azimuthDeg", 0, 360],
    ["elevationDeg", 0, 90],
    ["saturation", 0, 3],
    ["groundShadow", 0, 1],
  ];
  for (const [key, min, max] of ranges)
    if (
      typeof l[key] !== "number" ||
      !Number.isFinite(l[key]) ||
      l[key] < min ||
      l[key] > max
    )
      throw new Error(`Sahne ışığı ${key} ${min}–${max} arasında olmalı`);
  if (
    !HEX_COLOUR.test(scene.backgroundTop) ||
    !HEX_COLOUR.test(scene.backgroundBottom)
  )
    throw new Error("Sahne zemini #RRGGBB biçiminde olmalı");
}
/**
 * City record `identity` (`GET /v1/cities`, §11.49): what the loading screens take from the city
 * (`veri/sehir/<şehir>.json → kimlik`). `null` = the screens stay neutral; no city name or pattern lives in the code.
 */
export interface CityIdentity {
  /** The city's colour (`kimlik.zemin`, `#RRGGBB`): its name on the opening screen and its pattern on a light ground. */
  accent: string;
  /** Pattern tile (`kimlik.desen`): the name of an SVG file served from `/desenler/`, e.g. `desen-bursa-sekiz-yildiz.svg`. */
  pattern: string;
  /** Colour of the pattern on a ground in `accent` (`kimlik.desen_renk`, `#RRGGBB`). */
  patternColour: string;
  /**
   * Size of the tile against the standard tile width (`kimlik.desen_olcek`); absent = 1. A tile holding several
   * repeats of its motif (Hatay's) is drawn larger so its lines keep the width of the others.
   */
  patternScale?: number;
}
/** The range a pattern scale may take. */
export const CITY_PATTERN_SCALE = { min: 0.25, max: 8 };
/** A pattern file name: lower-case words joined by hyphens, `.svg`; never a path, so it can sit in a URL or a CSS value. */
export const CITY_PATTERN_FILE = /^[a-z0-9][a-z0-9-]*\.svg$/;
/** Throws on an identity the loading screens cannot draw. */
export function validateCityIdentity(identity: CityIdentity) {
  if (!HEX_COLOUR.test(identity.accent) || !HEX_COLOUR.test(identity.patternColour))
    throw new Error("Şehir renkleri #RRGGBB biçiminde olmalı");
  if (typeof identity.pattern !== "string" || !CITY_PATTERN_FILE.test(identity.pattern))
    throw new Error("Şehir deseni küçük harfli bir .svg dosya adı olmalı");
  const scale = identity.patternScale;
  if (
    scale !== undefined &&
    (typeof scale !== "number" || !Number.isFinite(scale) || scale < CITY_PATTERN_SCALE.min || scale > CITY_PATTERN_SCALE.max)
  )
    throw new Error(`Desen ölçeği ${CITY_PATTERN_SCALE.min} ile ${CITY_PATTERN_SCALE.max} arasında bir sayı olmalı`);
}
/** City record `map` (`GET /v1/cities`, §11.45): where the map opens in this city; the globe marker sits at `center`. */
export interface CityMapView {
  /** `[lng, lat]`. */
  center: [number, number];
  zoom: number;
  /** Opening zoom on a wide screen; `null` = `zoom`. */
  zoomDesktop: number | null;
}
/** City record `inventory`: the city's Vakıf Eserleri Envanteri, shown for a city with no site in the app yet. */
export interface CityInventory {
  name: string | null;
  publisher: string | null;
  year: number | null;
  /** Sites documented in the inventory (not the app's published sites). */
  siteCount: number | null;
}
/** `GET /v1/cities` item. */
export interface CityRecord {
  id: string;
  name: string;
  /** Published sites in the app. */
  siteCount: number;
  /** The map opens at this city's `map` (at most one city). */
  isDefault: boolean;
  /** `null` = not on the globe, never the opening city. */
  map: CityMapView | null;
  inventory: CityInventory | null;
  scene: CityScene | null;
  /** The city's look on the opening screen and the 3D loading card (§11.49); `null` = neutral screens. */
  identity: CityIdentity | null;
}
/** Below this map zoom the map shows cities instead of site pins and models (globe view, §11.45). */
export const CITY_MARKER_MAX_ZOOM = 9;
/** Throws on a view the map cannot open. */
export function validateCityMap(map: CityMapView) {
  const [lng, lat] = map.center ?? [];
  if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng! < -180 || lng! > 180 || lat! < -85 || lat! > 85)
    throw new Error("Şehir merkezi [boylam, enlem] olmalı");
  for (const z of [map.zoom, map.zoomDesktop ?? map.zoom])
    if (!Number.isFinite(z) || z < CITY_MARKER_MAX_ZOOM || z > 22)
      throw new Error(`Şehir açılış yakınlığı ${CITY_MARKER_MAX_ZOOM}–22 arasında olmalı`);
}
export interface SiteModel {
  name: string;
  bytes: number;
  src: string;
  parts: string[];
  trust: Trust;
  /** Triangle count the server counted on upload; `null` or absent when unknown. */
  triangles?: number | null;
  /** "İçini göster": part-name groups lifted top to bottom (first group first); absent or empty = no button. */
  coverGroups?: string[][];
  /**
   * Interior parts of the presentation file (`3d/model.json → ic_parcalar`): the map leaves them out, as the
   * prototype's map file has none. Absent or empty = the map draws every part but the scenery.
   */
  interiorParts?: string[];
  /** `null` or absent when the model is not placed on the map or its placement is hidden. */
  placement?: MapPlacement | null;
}
/**
 * 3D camera pose of a story sentence: looks at `target` (a model part; null = model centre) from
 * `azimuthDeg` (0 = from the north, clockwise) and `elevationDeg`; `distance` 1 = whole model fits the view.
 */
export interface CameraPose {
  label?: string;
  target: string | null;
  azimuthDeg: number;
  elevationDeg: number;
  distance: number;
}
export interface StoryBlock {
  id: string;
  title: string;
  text: string;
  simple: string;
  trust: Trust;
  textEn?: string;
  /** English of `simple`. */
  simpleEn?: string;
  photoId?: string;
  sourceId?: string;
  showCard?: boolean;
  highlights?: string[];
  /** Absent = keep the previous sentence's view. */
  camera?: CameraPose;
  /** "İç mekân (3D)": the model's cover groups lift for this sentence. */
  interior?: boolean;
  /** "Yalnız rotada": read only when the site was opened from a route (it leads to the next stop). */
  routeOnly?: boolean;
  /** "Akar akışı": this sentence shows the income road of the waqf on the map. */
  flow?: StoryFlow;
}
/** A waqf's income road: from the site that earns to the site (or a place outside the catalog) it supports. */
export interface StoryFlow {
  fromSiteId: string;
  toSiteId: string | null;
  /** `[lng, lat]` of a target that is no site in the app. */
  toPoint: [number, number] | null;
  /** Second line of the card, e.g. a building that no longer stands. */
  toName: string;
  /** The card's title, as the source words it. */
  label: string;
  source: string;
  trust: Trust;
}
/** How close a present-day photograph's view is to the old one: the same point and direction, or close but not the same point. */
export type AngleMatch = "same" | "near";
/** Where an old photograph was taken from and which way it looks. */
export interface HistoryViewpoint {
  lng: number;
  lat: number;
  /** Clockwise from north. */
  bearingDeg: number;
  /** Width of the view. */
  fieldDeg: number;
  /** Taken inside a place of worship: the camera asks for respect first. */
  interior: boolean;
}
export interface HistoryImage {
  id: string;
  photo: SitePhoto;
  /** Absent when the place of the shot is not known. */
  viewpoint?: HistoryViewpoint;
  /** The same view today. Its credit line is `description` and is shown word for word. */
  presentPhoto?: SitePhoto;
  /** Set with `presentPhoto`; `near` makes the screen say the two were not taken from exactly the same point. */
  presentAngleMatch?: AngleMatch;
  caption: string;
  dateLabel: string;
  sourceId: string;
  trust: Trust;
}
/**
 * İz Bırak sample (decision §11.47): a photograph and a sentence the team wrote, credited to a name («AKAR ekibi»), not
 * to an account. It is not a visitor's memory (no moderation, quota or points) and the screen always tags it «Örnek».
 */
export interface SampleTrace {
  id: string;
  author: string;
  text: string;
  /** Its credit line is `description` and is shown word for word. */
  photo: SitePhoto;
  /** Day it was added, `YYYY-MM-DD`. */
  addedOn: string;
  /** The archive photograph (`HistoryImage.id`) it shows the same view of. */
  historyImageId?: string;
  /** Set with `historyImageId`. */
  angleMatch?: AngleMatch;
}
/** 3D part card: tapping any of `parts` (model node names) opens it; they are highlighted together. */
export interface PartCard {
  id: string;
  parts: string[];
  title: string;
  body: string;
  /** Photo strip in order; the first is the cover. May be empty. */
  photos: SitePhoto[];
  sourceId?: string;
  trust: Trust;
}
/**
 * Site task (decision §11.44), a question or a field task. The public shape carries no answer key:
 * the server (or the mock client) checks answers, the part and the position.
 */
export interface SiteTask {
  id: string;
  kind: "quiz" | "field";
  title: string;
  /** Quiz: the question; field: the task text. */
  prompt: string;
  /** One of the site's photographs. */
  photo?: SitePhoto;
  /** Model part the task is about. */
  part?: string;
  /** Where the content comes from (book and page), as plain text. */
  source?: string;
  trust: Trust;
  quiz?: {
    options: string[];
    /** Revealed one by one, on demand. */
    hints: string[];
    /** Shown after a wrong answer (the player may try again). */
    wrongText: string;
    /** Whether the question can be answered without being at the site. */
    fromHome: boolean;
  };
  field?: {
    /** Done at the site: the visitor's position must be within `radiusM` of the site. */
    onSite: { text: string; radiusM: number };
    /** Done from home: tapping `part` on the 3D model. `null` = on site only. */
    fromHome: { text: string; part: string } | null;
  };
}
/** Badge of a site: earned by finishing the story or by one of the site's tasks. */
export interface SiteBadge {
  id: string;
  title: string;
  text: string;
  condition: "story" | "task";
  /** The task that earns it; `null` for a story badge. */
  taskId: string | null;
  /** Show a «Yerinde» tag when it was earned at the site. */
  onSiteLabel: boolean;
}
/** A book photograph placed after a paragraph of "Eser hakkında"; `aspect` = width / height of the file as printed (absent = unknown). */
export interface AboutPhoto {
  photo: SitePhoto;
  aspect?: number;
  alt: string;
}
/**
 * "Eser hakkında" chapter (one `## heading` of the inventory text) with its reading layer. Everything in it is
 * quoted verbatim from the chapter's paragraphs; the paragraphs themselves are `HeritageSite.sections` with this `id` as `chapterId`.
 */
export interface AboutChapter {
  id: string;
  title: string;
  kind: "history" | "architecture" | "waqf";
  /** Sentences picked from the text, shown before it. */
  summary: string[];
  /** Number cards: `value` (e.g. "1399"), short `label`, `evidence` = the phrase in the text. */
  figures: Array<{ value: string; label: string; evidence: string }>;
  quotes: Array<{ text: string; by?: string }>;
  timeline: Array<{ year: string; evidence: string }>;
  /** Words in the chapter text that open a definition when tapped. */
  terms: Array<{ word: string; definition: string }>;
  /** Desktop 3D view while this chapter is read; absent = leave the model as it is. */
  camera?: CameraPose;
  /** The model's cover groups lift while this chapter is read. */
  interior: boolean;
  /** Model parts lit while this chapter is read; empty = the whole building. */
  focusParts: string[];
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
  /**
   * Priority of the site's pin on the map (`eser.json` `sira`, §11.48): the smaller, the earlier it is drawn and
   * labelled. Absent = unranked, after every ranked site.
   */
  displayOrder?: number;
  relatedSiteId?: string;
  photos?: SitePhoto[];
  sources?: SiteSource[];
  coverPhotoId?: string;
  model?: SiteModel;
  historyImages?: HistoryImage[];
  /** İz Bırak samples in order; absent or empty = none. */
  sampleTraces?: SampleTrace[];
  /** With cards, only their parts are tappable; absent or empty = every part shows its name. */
  partCards?: PartCard[];
  /** Tasks in order; absent or empty = the site has none. */
  tasks?: SiteTask[];
  /** Badges in order; absent or empty = the site has none. */
  badges?: SiteBadge[];
  storyPhotos?: SitePhoto[];
  /** Cover photograph of "Eser hakkında"; absent = the gallery cover. */
  aboutCover?: SitePhoto;
  /** Reading chapters in order; absent or empty = the sections are shown as plain paragraphs under their titles. */
  chapters?: AboutChapter[];
  sections?: Array<{
    id: string;
    kind: "history" | "architecture" | "waqf";
    title: string;
    body: string;
    trust: Trust;
    sourceId: string;
    /** `AboutChapter.id`, absent when the paragraph belongs to no chapter. */
    chapterId?: string;
    /** Book photographs shown after this paragraph, in order. */
    photos?: AboutPhoto[];
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
/** Site language and narration voice of an account; `null` = not chosen yet. Mirrors `GET /v1/me` `preferences`. */
export interface UserPreferences {
  siteLang: "tr" | "en" | null;
  voiceLang: "tr" | "en" | null;
  voiceGender: "female" | "male" | null;
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
  /** The signed-in account's preferences; absent for a guest (kept on the device) and in the demo. */
  preferences?: UserPreferences;
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
  /** Saves the whole placement of a site's model (the site and its model must already be saved). */
  | { type: "map-placement"; siteId: string; placement: MapPlacement }
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
/** Every site kind in the order the filter row lists them. */
export const siteKinds: readonly SiteKind[] = [
  "cami",
  "turbe",
  "cesme",
  "hamam",
  "han",
  "bedesten",
  "egitim",
];
/** What a pin's colour means on the map: the waqf category of the site (API `role_categories`). */
export type SiteCategory = "dini" | "su" | "egitim" | "akar";
/** Categories in the order the map legend lists them. */
export const siteCategories: readonly SiteCategory[] = [
  "dini",
  "su",
  "egitim",
  "akar",
];
/** The category of each kind, as the `site_types` rows have it. */
export const kindCategory: Record<SiteKind, SiteCategory> = {
  cami: "dini",
  turbe: "dini",
  cesme: "su",
  egitim: "egitim",
  hamam: "akar",
  han: "akar",
  bedesten: "akar",
};
/** «Akar» alone was taken for the app's name (§11.48), so the income category says what it is. */
export const categoryLabels: Record<SiteCategory, string> = {
  dini: "Dinî",
  su: "Su",
  egitim: "Eğitim",
  akar: "Ticari (akar)",
};
export const categoryHints: Record<SiteCategory, string> = {
  dini: "Cami, mescit, türbe",
  su: "Çeşme, sebil, hamam suyu",
  egitim: "Medrese, mektep",
  akar: "Vakfa gelir getiren yapılar: han, bedesten, hamam, dükkân",
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
/**
 * The kinds the filter row offers (§11.48): those with a published site in the city the search points at, so a
 * chip never leads to an empty list. An empty search points at every city. Listed in `siteKinds` order.
 */
export function offeredKinds(sites: HeritageSite[], query: string): SiteKind[] {
  const cities = new Set(filterSites(sites, query).map((s) => s.city));
  const here = sites.filter((s) => s.status === "published" && cities.has(s.city));
  return siteKinds.filter((kind) => here.some((s) => s.kind === kind));
}
/** The categories these sites belong to, in `siteCategories` order; the map legend lists only these (§11.48). */
export function categoriesOf(sites: HeritageSite[]): SiteCategory[] {
  const present = new Set<SiteCategory | undefined>(
    sites.map((s) => kindCategory[s.kind]),
  );
  return siteCategories.filter((c) => present.has(c));
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
  validatePartCards(site);
}
/**
 * The API's refusals for part cards, so the demo client answers the same: a title, a part, only parts of the model (none
 * without a model; a model whose part names are not read yet cannot be checked) and a source of the site. Photos are not
 * checked here: a card may show a photograph that is not in `site.photos` (the API lists it through the card itself).
 */
function validatePartCards(site: HeritageSite) {
  const cards = site.partCards ?? [];
  if (cards.some((c) => !c.title.trim() || !c.parts.length))
    throw new Error("Her parça kartının başlığı ve en az bir parçası olmalı.");
  const modelParts = site.model?.parts ?? [];
  const unknown = cards
    .flatMap((c) => c.parts)
    .filter((p) =>
      site.model ? modelParts.length && !modelParts.includes(p) : true,
    );
  if (unknown.length)
    throw new Error(
      `Modelde olmayan parça: ${[...new Set(unknown)].join(", ")}.`,
    );
  const sourceIds = new Set((site.sources ?? []).map((s) => s.id));
  if (cards.some((c) => c.sourceId && !sourceIds.has(c.sourceId)))
    throw new Error("Kart kaynağı eserin kaynakları arasında olmalı.");
}
/** Value ranges of a placement; the API refuses the same ones (`MapPlacementBody`). */
export const placementLimits = {
  scale: { min: 0.1, max: 10 },
  altitudeM: { min: -50, max: 200 },
  anchorNodeLength: 200,
  points: 50,
} as const;
/** The panel's first check of a placement before it is sent; the server checks the city's bounds too. */
export function validatePlacement(p: MapPlacement) {
  const within = (x: number, min: number, max: number) =>
    Number.isFinite(x) && x >= min && x <= max;
  if (!within(p.lng, -180, 180) || !within(p.lat, -90, 90))
    throw new Error("Geçerli enlem ve boylam gir.");
  if (!Number.isFinite(p.headingDeg) || p.headingDeg < 0 || p.headingDeg >= 360)
    throw new Error("Yön 0 ile 360 derece arasında olmalı.");
  if (
    p.frontDeg != null &&
    (!Number.isFinite(p.frontDeg) || p.frontDeg < 0 || p.frontDeg >= 360)
  )
    throw new Error("Ön cephe yönü 0 ile 360 derece arasında olmalı.");
  const { scale, altitudeM, anchorNodeLength, points } = placementLimits;
  if (!within(p.scale, scale.min, scale.max))
    throw new Error(`Ölçek ${scale.min} ile ${scale.max} arasında olmalı.`);
  if (!within(p.altitudeM, altitudeM.min, altitudeM.max))
    throw new Error(
      `Yükseklik ${altitudeM.min} ile ${altitudeM.max} metre arasında olmalı.`,
    );
  if ((p.anchorNode?.length ?? 0) > anchorNodeLength)
    throw new Error("Ana parça adı çok uzun.");
  for (const list of [p.hiddenPoints, p.keptPoints])
    if (
      list.length > points ||
      list.some((x) => !within(x.lng, -180, 180) || !within(x.lat, -90, 90))
    )
      throw new Error(
        `Gizle ve geri göster listeleri en çok ${points} nokta tutar.`,
      );
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
    if (story.camera?.target && !site.model?.parts.includes(story.camera.target))
      issues.push(`${i + 1}. cümlenin kamera hedefi modelde yok.`);
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
    command.type !== "map-placement" &&
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
    case "site": {
      validateSite(command.site);
      const incoming = structuredClone(command.site);
      const before = state.sites.find((s) => s.id === incoming.id);
      // The placement is saved by its own command; saving the site never rewrites it.
      if (incoming.model) {
        if (before?.model?.placement)
          incoming.model.placement = structuredClone(before.model.placement);
        else delete incoming.model.placement;
      }
      next.sites = before
        ? next.sites.map((s) => (s.id === incoming.id ? incoming : s))
        : [...next.sites, incoming];
      break;
    }
    case "map-placement": {
      const site = next.sites.find((s) => s.id === command.siteId);
      if (!site) throw new Error("Eser bulunamadı.");
      if (!site.model)
        throw new Error(
          "Eserin 3B modeli yok; haritada yerleşim için önce model bağla.",
        );
      validatePlacement(command.placement);
      site.model.placement = structuredClone(command.placement);
      break;
    }
  }
  return next;
}
