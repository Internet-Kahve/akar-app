import {
  defaultMapSettings,
  validatePlacement,
  validateSite,
  type AboutChapter,
  type AngleMatch,
  type SiteBadge,
  type CameraPose,
  type HistoryViewpoint,
  type StoryFlow,
  type Command,
  type HeritageRoute,
  type CityRecord,
  type HeritageSite,
  type MapPlacement,
  type MapSettings,
  type Memory,
  type Role,
  type SiteKind,
  type SitePhoto,
  type SiteSource,
  type SiteTask,
  type Snapshot,
  type StoryBlock,
  type StoryNarration,
  type Trust,
  type UserPreferences,
} from "@akar/domain";
import type {
  AdminHealth,
  AdminMember,
  MemberPage,
  AkarClient,
  NarrationRun,
  TranslationRun,
  SiteProgress,
  SiteTaskAnswerResult,
  SiteTaskCompleteInput,
  SiteTaskCompletion,
  PlayableQuiz,
  QuizAnswerResult,
  StorageAdapter,
} from "./index";
import { demoRegion } from "./seed";

/** Error body of the API (`CONTRACTS.md` §3) or a transport failure (`status` 0, `code` `NETWORK_ERROR`). */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: Record<string, string[]>;
  readonly requestId: string;
  constructor(init: {
    status: number;
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
    requestId?: string;
  }) {
    super(init.message);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.fieldErrors = init.fieldErrors ?? {};
    this.requestId = init.requestId ?? "";
  }
}

/** The command cannot be expressed through the HTTP API with the data it carries. Nothing was sent. */
export class UnsupportedCommandError extends Error {
  readonly commandType: Command["type"];
  constructor(commandType: Command["type"], message: string) {
    super(message);
    this.name = "UnsupportedCommandError";
    this.commandType = commandType;
  }
}

export interface HttpClientOptions {
  baseUrl: string;
  storage?: StorageAdapter;
  /** Bearer token of the signed-in user; `null` means guest. Read on every request. */
  getToken?: () => string | null | Promise<string | null>;
  /** Called when the server answers 401 to a request that carried the token. GET reads retry once as guest; mutations fail. */
  onUnauthorized?: () => void;
  fetch?: typeof fetch;
  /** Device position for `visit`; the API verifies the geofence server-side. Without it `visit` is unsupported. */
  locate?: () => Promise<{ coordinates: [number, number]; accuracyM: number }>;
  /** KVKK consent the user gave for a memory submission (`POST /v1/memories` requires it). `null` = no consent. */
  getMemoryConsent?: () =>
    { textVersion: string } | null | Promise<{ textVersion: string } | null>;
  /** Photo upload progress: 0..1 while ticket → PUT → complete runs, `null` when it ends (success or failure). */
  onUploadProgress?: (fraction: number | null) => void;
}

export const httpStorageKey = "akar-http-v1";
const CONCURRENCY = 6;
/** Most site ids one `GET /v1/memories` request may name (`FEED_SITE_IDS_MAX` server-side). */
const FEED_SITE_IDS_MAX = 100;
/** Licence stated for files the panel uploads; the editor states the trust level. */
const CONTRIBUTOR_LICENSE = "Katkı sahibi izniyle";
/** A new model's part names come from a server job: polled this often, this long apart (~20 s). */
const MODEL_PARTS_ATTEMPTS = 20;
const MODEL_PARTS_WAIT_MS = 1000;
/** Most stops "Rotam" may hold (`MY_ROUTE_MAX` server-side). */
const MY_ROUTE_MAX = 100;
/** Points the server awards per receipt action (CONTRACTS §6); used only to show pending guest points. */
const receiptPoints: Record<string, number> = {
  "story.complete": 15,
  "quiz.correct": 20,
  "visit.verified": 100,
};

interface StoredReceipt {
  receipt: string;
  action: string;
  subjectId: string;
}
interface LocalState {
  deviceId: string;
  receipts: StoredReceipt[];
  saved: string[];
  route: string[];
}

// ── DTOs: only the fields the client reads ───────────────────────────────────
interface Page<T> {
  items: T[];
  nextCursor: string | null;
}
interface MediaDto {
  id: string;
  kind: "photo" | "model" | "audio";
  url: string;
  alt: string;
  title: string;
  titleEn: string | null;
  description: string;
  license: string;
  sourceId: string | null;
  trust: Trust;
  parts: string[];
  /** Triangle count of a model; absent on older API versions. */
  triangles?: number | null;
  /** "İçini göster" groups of a model; absent on older API versions. */
  coverGroups?: string[][];
}
interface SiteSummaryDto {
  id: string;
}
interface SiteDetailDto {
  id: string;
  name: string;
  nameEn: string | null;
  kind: string;
  city: { id: string; name: string };
  district: string | null;
  year: string;
  coordinates: [number, number];
  minutes: number;
  /** Map draw priority (§11.48), absent on older API versions; null = unranked. */
  displayOrder?: number | null;
  tier: HeritageSite["tier"];
  description: string;
  descriptionEn: string | null;
  architect: string;
  patron: string | null;
  era: string | null;
  address: string | null;
  role: HeritageSite["role"] | null;
  relatedSiteId: string | null;
  sourceSummary: string;
  editorVersion: 2 | null;
  coverMediaId: string | null;
  stories: Array<{
    id: string;
    title: string;
    text: string;
    textEn: string | null;
    simple: string;
    trust: Trust;
    photoId: string | null;
    sourceId: string | null;
    showCard: boolean | null;
    highlights: string[];
    camera: CameraPose | null;
    /** Absent on older API versions. */
    interior?: boolean;
    /** Absent on older API versions. */
    routeOnly?: boolean;
    flow?: StoryFlow | null;
    /** Server-side only fields the domain does not carry; kept as they are on a story save. */
    cardId?: string | null;
    /** English simple text and the status (machine draft or reviewed) of the English texts; absent on older API versions. */
    simpleEn?: string | null;
    textEnStatus?: "machine" | "reviewed" | null;
    simpleEnStatus?: "machine" | "reviewed" | null;
    /** AI voice-overs that match the current text; absent on older API versions. */
    narrations?: Array<{ variant: "text" | "simple"; lang: "tr" | "en"; voice: "female" | "male"; mediaId: string }>;
  }>;
  sections?: Array<{
    id: string;
    kind: "history" | "architecture" | "waqf";
    title: string;
    body: string;
    trust: Trust;
    sourceId: string | null;
    /** Absent on older API versions. */
    chapterId?: string | null;
    /** Book photographs after the paragraph; `mediaId` resolves in `media`. Absent on older API versions. */
    photos?: Array<{ mediaId: string; aspect: number | null; alt: string }>;
  }>;
  /** Absent on older API versions. */
  aboutCoverMediaId?: string | null;
  /** Absent on older API versions. */
  chapters?: Array<{
    id: string;
    title: string;
    kind: "history" | "architecture" | "waqf";
    summary: string[];
    figures: AboutChapter["figures"];
    quotes: Array<{ text: string; by: string | null }>;
    timeline: AboutChapter["timeline"];
    terms: AboutChapter["terms"];
    camera: CameraPose | null;
    interior: boolean;
    focusParts: string[];
  }>;
  cards: Array<{ mediaId: string }>;
  historyImages: Array<{
    id?: string;
    mediaId: string;
    presentMediaId: string | null;
    caption?: string;
    dateLabel?: string;
    sourceId?: string | null;
    trust?: Trust;
    /** Absent on older API versions. */
    presentAngleMatch?: AngleMatch | null;
    viewpoint?: HistoryViewpoint | null;
  }>;
  /** Team-made İz Bırak samples; absent on older API versions. */
  sampleTraces?: Array<{
    id: string;
    author: string;
    text: string;
    /** Resolves in `media`. */
    mediaId: string;
    historyImageId: string | null;
    angleMatch: AngleMatch | null;
    addedOn: string;
  }>;
  /** Absent on older API versions. */
  partCards?: Array<{
    id: string;
    parts: string[];
    title: string;
    body: string;
    photoIds: string[];
    sourceId: string | null;
    trust: Trust;
  }>;
  /** Absent on older API versions. */
  tasks?: Array<{
    id: string;
    kind: "quiz" | "field";
    title: string;
    prompt: string;
    /** A site photograph; resolves in `media`. */
    photoId: string | null;
    part: string | null;
    source: string | null;
    trust: Trust;
    quiz?: NonNullable<SiteTask["quiz"]>;
    field?: NonNullable<SiteTask["field"]>;
  }>;
  /** Absent on older API versions. */
  badges?: SiteBadge[];
  media: MediaDto[];
  /** Where the model stands on the map; `null` when not shown, absent on older API versions. */
  placement?: MapPlacement | null;
  /** Explicit gallery relationship; absent on older API versions. */
  photoIds?: string[];
  sources: SiteSource[];
}
/** `AdminSiteDetail.mapPlacement`: the saved placement in every case (also while hidden); `lng`/`lat` are null while the model stands on the site's own location. */
interface AdminPlacementDto extends Omit<MapPlacement, "lng" | "lat"> {
  lng: number | null;
  lat: number | null;
  visible: boolean;
  updatedAt: string;
}
/** `AdminSiteDetail`: the public detail plus status; a draft may lack type and location. */
interface AdminSiteDetailDto extends Omit<
  SiteDetailDto,
  "kind" | "coordinates"
> {
  kind: string | null;
  coordinates: [number, number] | null;
  status: "draft" | "published";
  openingCamera: CameraPose | null;
  /** The saved placement; `null` while none was saved; absent on older API versions. */
  mapPlacement?: AdminPlacementDto | null;
  /** Per-site place inside each source ("s. 42"); the domain source has no such field. */
  sourceLinks: Array<{ sourceId: string; locator: string | null }>;
}
interface RouteDto {
  id: string;
  name: string;
  nameEn: string | null;
  description: string;
  minutes: number;
  distance: string;
  theme: string;
  stops: Array<{ site: SiteSummaryDto; quizId: string | null }>;
}
/** `AdminRoute`: drafts included; stops may name draft sites. */
interface AdminRouteDto {
  id: string;
  name: string;
  nameEn: string | null;
  description: string;
  theme: string;
  status: "draft" | "published";
  stops: Array<{
    site: SiteSummaryDto;
    quizId: string | null;
    historyImageId: string | null;
  }>;
}
interface MeDto {
  id: string;
  role: Role;
  displayName: string | null;
  /** Absent from an API older than §26. */
  preferences?: UserPreferences;
}
interface PassportDto {
  points: number;
  saved: string[];
  read: string[];
  visited: string[];
  quizzesSolved: string[];
}
interface MemoryDto {
  id: string;
  siteId: string;
  text: string;
  photo: { url: string } | null;
  status: Memory["status"];
  reason: string | null;
  createdAt: string;
  authorName?: string;
}
/** `PublicMemory`: the feed carries approved memories only and no status. */
interface FeedMemoryDto {
  id: string;
  siteId: string;
  text: string;
  authorName: string;
  photo: { url: string } | null;
  createdAt: string;
}
interface QuizStateDto {
  id: string;
  siteId: string;
  question: string;
  options: string[];
  hint: string | null;
  hintAvailable: boolean;
  revealed: boolean;
  solved: boolean;
}
interface QuizSubmitDto {
  correct: boolean;
  awarded: number;
  hint?: string;
  receipt?: string;
  explanation?: { text: string };
}
interface UploadTicketDto {
  uploadId: string;
  url: string;
  headers: Record<string, string>;
}
interface ReceiptsResponseDto {
  results: Array<{ ok: true } | { ok: false; reason: string }>;
}

const present = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

/** Public media DTO → domain photo. */
const toPhoto = (m: MediaDto): SitePhoto => ({
  id: m.id,
  src: m.url,
  alt: m.alt,
  title: m.title,
  titleEn: m.titleEn ?? "",
  description: m.description,
  sourceId: m.sourceId ?? "",
  license: m.license,
  trust: m.trust,
});

/** The recordings of a sentence with their playable address; one whose file is missing from the media list is left out. */
const mapNarrations = (
  s: SiteDetailDto["stories"][number],
  media: MediaDto[],
): StoryNarration[] =>
  (s.narrations ?? []).flatMap((n) => {
    const file = media.find((m) => m.id === n.mediaId && m.kind === "audio");
    return file
      ? [{ variant: n.variant, lang: n.lang, voice: n.voice, url: file.url }]
      : [];
  });

export function mapSite(d: SiteDetailDto): HeritageSite {
  const stories: StoryBlock[] = d.stories.map((s) => ({
    id: s.id,
    title: s.title,
    text: s.text,
    simple: s.simple,
    trust: s.trust,
    highlights: s.highlights,
    ...(present(s.camera) && { camera: s.camera }),
    ...(s.interior && { interior: true }),
    ...(s.routeOnly && { routeOnly: true }),
    ...(s.flow && { flow: s.flow }),
    ...(present(s.textEn) && { textEn: s.textEn }),
    ...(present(s.simpleEn) && { simpleEn: s.simpleEn }),
    ...(present(s.textEnStatus) && { textEnStatus: s.textEnStatus }),
    ...(present(s.simpleEnStatus) && { simpleEnStatus: s.simpleEnStatus }),
    ...(s.narrations?.length && { narrations: mapNarrations(s, d.media) }),
    ...(present(s.photoId) && { photoId: s.photoId }),
    ...(present(s.sourceId) && { sourceId: s.sourceId }),
    ...(present(s.showCard) && { showCard: s.showCard }),
  }));
  // The media list also carries card and history images; those are not site photos.
  const used = new Set<string>(
    [d.coverMediaId, ...d.stories.map((s) => s.photoId)].filter(present),
  );
  const other = new Set<string>(
    [
      ...d.cards.map((c) => c.mediaId),
      ...d.historyImages.flatMap((h) => [h.mediaId, h.presentMediaId]),
      ...(d.sampleTraces ?? []).map((t) => t.mediaId),
      ...(d.partCards ?? []).flatMap((c) => c.photoIds),
      ...(d.sections ?? []).flatMap((s) => (s.photos ?? []).map((p) => p.mediaId)),
    ].filter(present),
  );
  const gallery = d.photoIds ? new Set(d.photoIds) : null;
  const photos = d.media
    .filter(
      (m) =>
        m.kind === "photo" &&
        (gallery ? gallery.has(m.id) : used.has(m.id) || !other.has(m.id)),
    )
    .map(toPhoto);
  const aboutCover = d.aboutCoverMediaId
    ? d.media.find((m) => m.id === d.aboutCoverMediaId && m.kind === "photo")
    : undefined;
  const model = d.media.find((m) => m.kind === "model");
  return {
    id: d.id,
    name: d.name,
    city: d.city.name,
    district: d.district ?? "",
    year: d.year,
    architect: d.architect,
    // `kind` is a site_types id; the list is open-ended server-side.
    kind: d.kind as SiteKind,
    coordinates: [d.coordinates[0], d.coordinates[1]],
    minutes: d.minutes,
    description: d.description,
    status: "published",
    stories,
    source: d.sourceSummary,
    tier: d.tier,
    photos,
    sources: d.sources,
    sections: (d.sections ?? []).map(
      ({ chapterId, photos: aboutPhotos, ...section }) => {
        const placed = (aboutPhotos ?? []).flatMap((p) => {
          const m = d.media.find((x) => x.id === p.mediaId && x.kind === "photo");
          return m
            ? [
                {
                  photo: toPhoto(m),
                  alt: p.alt,
                  ...(present(p.aspect) && { aspect: p.aspect }),
                },
              ]
            : [];
        });
        return {
          ...section,
          sourceId: section.sourceId ?? "",
          ...(present(chapterId) && { chapterId }),
          ...(placed.length && { photos: placed }),
        };
      },
    ),
    ...(d.chapters?.length && {
      chapters: d.chapters.map(({ camera, quotes, ...chapter }) => ({
        ...chapter,
        quotes: quotes.map(({ text, by }) => ({
          text,
          ...(present(by) && { by }),
        })),
        ...(present(camera) && { camera }),
      })),
    }),
    ...(aboutCover && { aboutCover: toPhoto(aboutCover) }),
    storyPhotos: d.media
      .filter((m) => m.kind === "photo" && used.has(m.id))
      .map(toPhoto),
    historyImages: d.historyImages.flatMap((h) => {
      const image = d.media.find(
        (m) => m.id === h.mediaId && m.kind === "photo",
      );
      if (!image) return [];
      const current = d.media.find(
        (m) => m.id === h.presentMediaId && m.kind === "photo",
      );
      return [
        {
          id: h.id ?? h.mediaId,
          photo: toPhoto(image),
          caption: h.caption ?? image.title,
          dateLabel: h.dateLabel ?? "Tarih bilinmiyor",
          sourceId: h.sourceId ?? image.sourceId ?? "",
          trust: h.trust ?? image.trust,
          ...(h.viewpoint && { viewpoint: h.viewpoint }),
          ...(current
            ? {
                presentPhoto: toPhoto(current),
                ...(present(h.presentAngleMatch) && {
                  presentAngleMatch: h.presentAngleMatch,
                }),
              }
            : {}),
        },
      ];
    }),
    ...(d.sampleTraces?.length && {
      sampleTraces: d.sampleTraces.flatMap(({ mediaId, historyImageId, angleMatch, ...trace }) => {
        const m = d.media.find((x) => x.id === mediaId && x.kind === "photo");
        return m
          ? [
              {
                ...trace,
                photo: toPhoto(m),
                ...(present(historyImageId) && { historyImageId }),
                ...(present(angleMatch) && { angleMatch }),
              },
            ]
          : [];
      }),
    }),
    ...(d.partCards?.length && {
      partCards: d.partCards.map(({ photoIds, sourceId, ...card }) => ({
        ...card,
        photos: photoIds.flatMap((id) => {
          const m = d.media.find((x) => x.id === id && x.kind === "photo");
          return m ? [toPhoto(m)] : [];
        }),
        ...(present(sourceId) && { sourceId }),
      })),
    }),
    ...(d.tasks?.length && {
      tasks: d.tasks.map(({ photoId, part, source, quiz, field, ...task }) => {
        const m = photoId
          ? d.media.find((x) => x.id === photoId && x.kind === "photo")
          : undefined;
        return {
          ...task,
          ...(m && { photo: toPhoto(m) }),
          ...(present(part) && { part }),
          ...(present(source) && { source }),
          ...(quiz && { quiz }),
          ...(field && { field }),
        };
      }),
    }),
    ...(d.badges?.length && { badges: d.badges }),
    ...(d.editorVersion === 2 && { editorVersion: 2 as const }),
    ...(present(d.nameEn) && { nameEn: d.nameEn }),
    ...(present(d.descriptionEn) && { descriptionEn: d.descriptionEn }),
    ...(present(d.patron) && { patron: d.patron }),
    ...(present(d.era) && { era: d.era }),
    ...(present(d.address) && { address: d.address }),
    ...(present(d.role) && { role: d.role }),
    ...(present(d.relatedSiteId) && { relatedSiteId: d.relatedSiteId }),
    ...(typeof d.displayOrder === "number" && { displayOrder: d.displayOrder }),
    ...(present(d.coverMediaId) && { coverPhotoId: d.coverMediaId }),
    ...(model && {
      model: {
        name: model.title || model.id,
        // The public media DTO carries no byte size.
        bytes: 0,
        src: model.url,
        parts: model.parts,
        trust: model.trust,
        triangles: model.triangles ?? null,
        ...(model.coverGroups?.length && { coverGroups: model.coverGroups }),
        placement: d.placement ?? null,
      },
    }),
  };
}

/** The panel's placement: the saved one with `visible`, on the site's own location where none was stored. */
const mapAdminPlacement = (
  p: AdminPlacementDto,
  at: [number, number],
): MapPlacement => ({
  lng: p.lng ?? at[0],
  lat: p.lat ?? at[1],
  headingDeg: p.headingDeg,
  scale: p.scale,
  altitudeM: p.altitudeM,
  anchorNode: p.anchorNode,
  hiddenPoints: p.hiddenPoints,
  keptPoints: p.keptPoints,
  visible: p.visible,
});

/** Panel view of an admin detail. A draft without a type shows "cami"; one without a location shows `placeholder` (decision log §11.23). */
const mapAdminSite = (
  d: AdminSiteDetailDto,
  placeholder: [number, number],
): HeritageSite => {
  const at = d.coordinates ?? placeholder;
  const site = mapSite({ ...d, kind: d.kind ?? "cami", coordinates: at });
  return {
    ...site,
    status: d.status,
    // The panel sees the placement also while it is hidden (`visible: false`).
    ...(site.model &&
      d.mapPlacement !== undefined && {
        model: {
          ...site.model,
          placement: d.mapPlacement
            ? mapAdminPlacement(d.mapPlacement, at)
            : null,
        },
      }),
  };
};

const mapRoute = (r: RouteDto): HeritageRoute => ({
  id: r.id,
  name: r.name,
  description: r.description,
  siteIds: r.stops.map((s) => s.site.id),
  minutes: r.minutes,
  distance: r.distance,
  theme: r.theme,
  status: "published",
  ...(present(r.nameEn) && { nameEn: r.nameEn }),
});

/** Panel view of a draft route. Duration and distance are computed only for published routes; the panel recomputes both when it saves. */
const mapAdminRoute = (r: AdminRouteDto): HeritageRoute => ({
  id: r.id,
  name: r.name,
  description: r.description,
  siteIds: r.stops.map((s) => s.site.id),
  minutes: 0,
  distance: "",
  theme: r.theme,
  status: r.status,
  ...(present(r.nameEn) && { nameEn: r.nameEn }),
});

const mapMemory = (m: MemoryDto, author: string): Memory => ({
  id: m.id,
  siteId: m.siteId,
  text: m.text,
  status: m.status,
  reason: m.reason ?? undefined,
  createdAt: m.createdAt,
  author: m.authorName ?? author,
  ...(m.photo && { photo: m.photo.url }),
});

async function toApiError(res: Response): Promise<ApiError> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = undefined;
  }
  const e =
    body && typeof body === "object" && "error" in body
      ? body.error
      : undefined;
  if (
    e &&
    typeof e === "object" &&
    "code" in e &&
    typeof e.code === "string" &&
    "message" in e &&
    typeof e.message === "string"
  ) {
    return new ApiError({
      status: res.status,
      code: e.code,
      message: e.message,
      fieldErrors:
        "fieldErrors" in e && e.fieldErrors && typeof e.fieldErrors === "object"
          ? Object.fromEntries(
              Object.entries(e.fieldErrors).map(([k, v]) => [
                k,
                Array.isArray(v) ? v.map(String) : [],
              ]),
            )
          : {},
      requestId:
        "requestId" in e && typeof e.requestId === "string" ? e.requestId : "",
    });
  }
  return new ApiError({
    status: res.status,
    code: `HTTP_${res.status}`,
    message: `Sunucu beklenmeyen bir yanıt verdi (HTTP ${res.status}).`,
  });
}

const feedToMemory = (m: FeedMemoryDto): Memory =>
  mapMemory({ ...m, status: "approved", reason: null }, m.authorName);

const networkError = () =>
  new ApiError({
    status: 0,
    code: "NETWORK_ERROR",
    message:
      "Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.",
  });

function decodeDataUrl(
  url: string,
): { mime: string; bytes: Uint8Array<ArrayBuffer> } | null {
  const m = /^data:([^;,]+);base64,(.*)$/s.exec(url);
  if (!m?.[1] || m[2] === undefined) return null;
  let bin: string;
  try {
    bin = atob(m[2]);
  } catch {
    return null;
  }
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { mime: m[1], bytes };
}

/** PUT with byte progress; `fetch` cannot report upload progress. */
function xhrPut(
  url: string,
  headers: Record<string, string>,
  body: Uint8Array<ArrayBuffer>,
  onProgress: (fraction: number) => void,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) onProgress(e.loaded / e.total);
    };
    xhr.onerror = () => reject(networkError());
    xhr.onabort = () => reject(networkError());
    xhr.onload = () =>
      resolve(
        xhr.status >= 200 && xhr.status < 300
          ? new Response(null, { status: 204 })
          : new Response(xhr.responseText, { status: xhr.status }),
      );
    xhr.send(body);
  });
}

async function pool<T, R>(
  items: T[],
  limit: number,
  run: (item: T) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await run(items[i] as T);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return out;
}

interface Catalog {
  sites: HeritageSite[];
  raw: Map<string, SiteDetailDto>;
  routes: HeritageRoute[];
  /** Quiz id → site id: every quiz of the published routes plus the ones the user solved. */
  quizSite: Map<string, string>;
  /** Quiz ids of the published routes per site, in route and stop order. */
  siteQuizzes: Map<string, string[]>;
  /** Approved memories of everyone, for the published sites. */
  feed: Memory[];
  stale: Set<string>;
  routesStale: boolean;
  feedStale: boolean;
}
interface UserState {
  signedIn: boolean;
  role: MeDto["role"];
  name: string;
  /** The account's preferences; null for a guest (the device keeps them). */
  preferences: UserPreferences | null;
  savedIds: string[];
  /** "Rotam": the account's when signed in, the device's for a guest. */
  routeIds: string[];
  readIds: string[];
  visitedIds: string[];
  quizIds: string[];
  points: number;
  /** Own memories only. */
  memories: Memory[];
  /** Moderation panel lists (pending, approved, rejected); empty unless moderator or admin. */
  queue: Memory[];
}

export function createHttpClient(opts: HttpClientOptions): AkarClient {
  const base = opts.baseUrl.replace(/\/+$/, "");
  const doFetch: typeof fetch = opts.fetch ?? ((...a) => fetch(...a));
  const storage = opts.storage;

  // ── local (guest) state ────────────────────────────────────────────────────
  const freshLocal = (): LocalState => ({
    deviceId: crypto.randomUUID(),
    receipts: [],
    saved: [],
    route: [],
  });
  const readLocal = (): LocalState => {
    try {
      const raw = storage?.getItem(httpStorageKey);
      const v = raw ? (JSON.parse(raw) as Partial<LocalState>) : undefined;
      if (typeof v?.deviceId === "string")
        return {
          deviceId: v.deviceId,
          receipts: Array.isArray(v.receipts) ? v.receipts : [],
          saved: Array.isArray(v.saved) ? v.saved : [],
          route: Array.isArray(v.route) ? v.route : [],
        };
    } catch {
      /* Corrupt storage starts a fresh local state. */
    }
    return freshLocal();
  };
  let local = readLocal();
  const writeLocal = (next: LocalState) => {
    try {
      storage?.setItem(httpStorageKey, JSON.stringify(next));
    } catch {
      throw new Error("Tarayıcı depolaması dolu veya kapalı.");
    }
    local = next;
  };
  try {
    // Persist a generated device id so a reload keeps the same guest identity.
    storage?.setItem(httpStorageKey, JSON.stringify(local));
  } catch {
    /* A failing write surfaces on the first mutation. */
  }

  // ── transport ──────────────────────────────────────────────────────────────
  let rejected: string | null = null;
  const token = async () => {
    const t = (await opts.getToken?.()) ?? null;
    return t === rejected ? null : t;
  };
  async function send(
    method: string,
    path: string,
    init: {
      query?: Record<string, string | number>;
      body?: unknown;
      cache?: RequestCache;
    } = {},
  ): Promise<Response> {
    const auth = await token();
    const headers: Record<string, string> = { accept: "application/json" };
    if (auth) headers.authorization = `Bearer ${auth}`;
    else headers["x-device-id"] = local.deviceId;
    if (method !== "GET") headers["idempotency-key"] = crypto.randomUUID();
    if (init.body !== undefined) headers["content-type"] = "application/json";
    const qs = init.query
      ? `?${new URLSearchParams(Object.entries(init.query).map(([k, v]) => [k, String(v)]))}`
      : "";
    let res: Response;
    try {
      res = await doFetch(`${base}${path}${qs}`, {
        method,
        headers,
        ...(init.cache && { cache: init.cache }),
        ...(init.body !== undefined && { body: JSON.stringify(init.body) }),
      });
    } catch {
      throw networkError();
    }
    if (res.status === 401 && auth) {
      // Expired or invalid token: the server rejects even public reads with it.
      rejected = auth;
      opts.onUnauthorized?.();
      if (method === "GET") return send(method, path, init);
    }
    if (!res.ok) throw await toApiError(res);
    return res;
  }
  const call = async <T>(
    method: string,
    path: string,
    init?: {
      query?: Record<string, string | number>;
      body?: unknown;
      cache?: RequestCache;
    },
  ): Promise<T> => {
    const res = await send(method, path, init);
    return (res.status === 204 ? undefined : await res.json()) as T;
  };
  const pages = async <T>(
    path: string,
    query: Record<string, string> = {},
    cache?: RequestCache,
  ) => {
    const out: T[] = [];
    let cursor: string | null = null;
    do {
      const page: Page<T> = await call("GET", path, {
        query: { ...query, limit: 100, ...(cursor && { cursor }) },
        ...(cache && { cache }),
      });
      out.push(...page.items);
      cursor = page.nextCursor;
    } while (cursor);
    return out;
  };

  // ── catalog (site and route data, shared across dispatches) ────────────────
  let catalogLoad: Promise<Catalog> | undefined;
  const loadRoutes = async () => {
    const dtos = (await call<{ items: RouteDto[] }>("GET", "/v1/routes")).items;
    const quizSite = new Map<string, string>();
    const siteQuizzes = new Map<string, string[]>();
    for (const r of dtos)
      for (const s of r.stops) {
        if (!s.quizId || quizSite.has(s.quizId)) continue;
        quizSite.set(s.quizId, s.site.id);
        siteQuizzes.set(s.site.id, [
          ...(siteQuizzes.get(s.site.id) ?? []),
          s.quizId,
        ]);
      }
    return { routes: dtos.map(mapRoute), quizSite, siteQuizzes };
  };
  /** Approved memories of the given sites, all pages; the server takes at most `FEED_SITE_IDS_MAX` ids per request. */
  const loadFeed = async (
    siteIds: string[],
    cache?: RequestCache,
  ): Promise<Memory[]> => {
    const out: Memory[] = [];
    for (const ids of chunk(siteIds, FEED_SITE_IDS_MAX))
      for (const m of await pages<FeedMemoryDto>(
        "/v1/memories",
        { siteIds: ids.join(",") },
        cache,
      ))
        out.push(feedToMemory(m));
    return out;
  };
  const fetchCatalog = async (): Promise<Catalog> => {
    const details = await pages<SiteDetailDto>("/v1/site-details");
    const [routes, feed] = await Promise.all([
      loadRoutes(),
      loadFeed(details.map((d) => d.id)),
    ]);
    return {
      sites: details.map(mapSite),
      raw: new Map(details.map((d) => [d.id, d])),
      feed,
      stale: new Set<string>(),
      routesStale: false,
      feedStale: false,
      ...routes,
    };
  };
  const loadCatalog = (): Promise<Catalog> => {
    catalogLoad ??= fetchCatalog();
    catalogLoad.catch(() => {
      catalogLoad = undefined;
    });
    return catalogLoad;
  };
  const refreshSite = async (id: string) => {
    const cat = await loadCatalog();
    // Stale until the read succeeds: any failure other than "gone" leaves it to be reloaded.
    cat.stale.add(id);
    let d: SiteDetailDto;
    try {
      d = await call<SiteDetailDto>(
        "GET",
        `/v1/sites/${encodeURIComponent(id)}`,
      );
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 404)) throw e;
      // Unpublished or removed: the site is gone.
      cat.raw.delete(id);
      cat.sites = cat.sites.filter((s) => s.id !== id);
      cat.stale.delete(id);
      return;
    }
    cat.raw.set(id, d);
    cat.sites = cat.sites.map((s) => (s.id === id ? mapSite(d) : s));
    cat.stale.delete(id);
  };
  const refreshFeed = async () => {
    const cat = await loadCatalog();
    cat.feedStale = true;
    // Runs right after a write: always ask the server. The feed is `public, no-cache` (§11.24), so
    // browsers revalidate anyway; the request option keeps it so whatever the server sends.
    cat.feed = await loadFeed(
      cat.sites.map((s) => s.id),
      "no-cache",
    );
    cat.feedStale = false;
  };
  const refreshRoutes = async () => {
    const cat = await loadCatalog();
    cat.routesStale = true;
    Object.assign(cat, await loadRoutes());
    cat.routesStale = false;
  };

  // ── drafts (editor and admin only; per identity) ───────────────────────────
  let drafts:
    | {
        key: string | null;
        raw: Map<string, AdminSiteDetailDto>;
        /** Re-read after a failed refresh, before anything is served. */
        stale: Set<string>;
        /** Draft routes; published ones come from the public catalog. */
        routes: HeritageRoute[];
        routesStale: boolean;
      }
    | undefined;
  /** Each page includes ordered stops in bulk; no per-route detail requests. */
  const loadDraftRoutes = async () =>
    (await pages<AdminRouteDto>("/v1/admin/routes", { status: "draft" })).map(
      mapAdminRoute,
    );
  const refreshDraftRoutes = async () => {
    if (!drafts) return;
    drafts.routesStale = true;
    drafts.routes = await loadDraftRoutes();
    drafts.routesStale = false;
  };
  /** Where a draft without a location is shown; kept per id so a save compares against what the editor saw. */
  const placeholders = new Map<string, [number, number]>();
  const placeholderOf = (
    cat: Catalog,
    d: AdminSiteDetailDto,
  ): [number, number] => {
    let p = placeholders.get(d.id);
    if (!p) {
      // Centre of the city's published sites; the demo region when the city has none.
      const peers = cat.sites.filter((s) => s.city === d.city.name);
      const mean = (axis: 0 | 1) =>
        peers.reduce((n, s) => n + s.coordinates[axis], 0) / peers.length;
      p = peers.length ? [mean(0), mean(1)] : demoRegion.center;
      placeholders.set(d.id, p);
    }
    return p;
  };
  async function ensureDrafts(
    u: UserState,
  ): Promise<Map<string, AdminSiteDetailDto>> {
    if (!u.signedIn || (u.role !== "editor" && u.role !== "admin")) {
      drafts = undefined;
      return new Map();
    }
    const key = await token();
    if (!drafts || drafts.key !== key) {
      const [items, routes] = await Promise.all([
        pages<AdminSiteDetailDto>("/v1/admin/site-details", {
          status: "draft",
        }),
        loadDraftRoutes(),
      ]);
      drafts = {
        key,
        raw: new Map(items.map((d) => [d.id, d])),
        stale: new Set(),
        routes,
        routesStale: false,
      };
    }
    if (drafts.routesStale) await refreshDraftRoutes();
    for (const id of [...drafts.stale]) await refreshAdminSite(id);
    return drafts.raw;
  }
  /** Re-reads one site after a panel write and files it under published or drafts. */
  async function refreshAdminSite(id: string) {
    const cat = await loadCatalog();
    drafts?.stale.add(id);
    const d = await call<AdminSiteDetailDto>(
      "GET",
      `/v1/admin/sites/${encodeURIComponent(id)}`,
    );
    if (d.status === "published") {
      // A published site always has type and location (database CHECK).
      const pub = d as SiteDetailDto;
      const site = mapSite(pub);
      cat.raw.set(id, pub);
      cat.sites = cat.sites.some((s) => s.id === id)
        ? cat.sites.map((s) => (s.id === id ? site : s))
        : [...cat.sites, site];
      drafts?.raw.delete(id);
    } else {
      cat.raw.delete(id);
      cat.sites = cat.sites.filter((s) => s.id !== id);
      drafts?.raw.set(id, d);
    }
    cat.stale.delete(id);
    drafts?.stale.delete(id);
  }

  // ── receipts ───────────────────────────────────────────────────────────────
  /** Redeems stored guest receipts. Every item the server answers is dropped (accepted or rejected, `revealed` included); only a failed request keeps them. */
  async function redeemReceipts() {
    if (!local.receipts.length || !(await token())) return;
    for (const batch of chunk(local.receipts, 100)) {
      const res = await call<ReceiptsResponseDto>("POST", "/v1/me/receipts", {
        body: { receipts: batch.map((r) => r.receipt) },
      });
      const answered = new Set(
        batch.filter((_, i) => res.results[i] !== undefined),
      );
      writeLocal({
        ...local,
        receipts: local.receipts.filter((r) => !answered.has(r)),
      });
    }
  }
  const chunk = <T>(a: T[], n: number) =>
    Array.from({ length: Math.ceil(a.length / n) }, (_, i) =>
      a.slice(i * n, (i + 1) * n),
    );
  const storeReceipt = (
    receipt: string | undefined,
    action: string,
    subjectId: string,
  ) => {
    const known = local.receipts.some(
      (r) => r.action === action && r.subjectId === subjectId,
    );
    if (receipt && !known)
      writeLocal({
        ...local,
        receipts: [...local.receipts, { receipt, action, subjectId }],
      });
  };

  /**
   * Moves the device's saved sites and "Rotam" into the account after sign-in (§11.30), then clears them
   * locally. Saves the account lacks are added one by one (a site unpublished since is skipped); the
   * device's stops follow the account's, each once, up to the limit. Returns the account's lists after it.
   */
  async function adoptLocal(
    cat: Catalog,
    saved: string[],
    route: string[],
  ): Promise<{ saved: string[]; route: string[] }> {
    if (!local.saved.length && !local.route.length) return { saved, route };
    const published = new Set(cat.sites.map((s) => s.id));
    const added = (
      await pool(
        local.saved.filter((id) => !saved.includes(id)),
        CONCURRENCY,
        async (id) => {
          try {
            await call("PUT", `/v1/me/saved/${encodeURIComponent(id)}`);
            return id;
          } catch (e) {
            if (e instanceof ApiError && e.status === 404) return null;
            throw e;
          }
        },
      )
    ).filter((id): id is string => id !== null);
    const merged = [
      ...new Set([...route, ...local.route.filter((id) => published.has(id))]),
    ].slice(0, MY_ROUTE_MAX);
    const nextRoute =
      merged.length === route.length
        ? route
        : (
            await call<{ siteIds: string[] }>("PUT", "/v1/me/route", {
              body: { siteIds: merged },
            })
          ).siteIds;
    writeLocal({
      ...local,
      saved: [],
      route: local.route.filter((id) => !nextRoute.includes(id)),
    });
    // The passport lists saved sites newest first.
    return { saved: [...added.reverse(), ...saved], route: nextRoute };
  }

  // ── user state ─────────────────────────────────────────────────────────────
  let user: UserState | undefined;
  async function loadUserOnce(cat: Catalog): Promise<UserState> {
    // A failed redemption keeps the receipts; they are retried on the next load.
    await redeemReceipts().catch(() => undefined);
    // The same subject can hold at most one receipt; duplicates count once.
    const pending = local.receipts.filter(
      (r, i) =>
        local.receipts.findIndex(
          (x) => x.action === r.action && x.subjectId === r.subjectId,
        ) === i,
    );
    const subjects = (action: string) =>
      pending.filter((r) => r.action === action).map((r) => r.subjectId);
    const pendingPoints = pending.reduce(
      (n, r) => n + (receiptPoints[r.action] ?? 0),
      0,
    );
    const quizSites = subjects("quiz.correct").map(
      (id) => cat.quizSite.get(id) ?? id,
    );
    const union = (...lists: string[][]) => [...new Set(lists.flat())];
    if (!(await token())) {
      return {
        signedIn: false,
        role: "user",
        name: "Gezgin",
        preferences: null,
        savedIds: local.saved,
        routeIds: local.route,
        readIds: subjects("story.complete"),
        visitedIds: subjects("visit.verified"),
        quizIds: quizSites,
        points: pendingPoints,
        memories: [],
        queue: [],
      };
    }
    const [me, passport, own, account] = await Promise.all([
      call<MeDto>("GET", "/v1/me"),
      call<PassportDto>("GET", "/v1/me/passport"),
      pages<MemoryDto>("/v1/me/memories"),
      call<{ siteIds: string[] }>("GET", "/v1/me/route"),
    ]);
    // A failed move keeps the device's lists; it is retried on the next load. A rejected token is not a
    // failed move: `loadUser` continues as a guest.
    const lists = await adoptLocal(cat, passport.saved, account.siteIds).catch(
      (e: unknown) => {
        if (e instanceof ApiError && e.status === 401) throw e;
        return { saved: passport.saved, route: account.siteIds };
      },
    );
    const name = me.displayName ?? "Gezgin";
    // Only the first pending page belongs to the snapshot. Other tabs and older pages are requested on demand.
    const queue =
      me.role === "moderator" || me.role === "admin"
        ? (
            await call<{ items: MemoryDto[] }>("GET", "/v1/admin/memories", {
              query: { status: "pending", limit: 25 },
              cache: "no-store",
            })
          ).items
        : [];
    const solved = await pool(
      passport.quizzesSolved,
      CONCURRENCY,
      async (id) => {
        const known = cat.quizSite.get(id);
        if (known) return known;
        const quiz = await call<{ siteId: string }>(
          "GET",
          `/v1/quizzes/${encodeURIComponent(id)}`,
        );
        cat.quizSite.set(id, quiz.siteId);
        return quiz.siteId;
      },
    );
    return {
      signedIn: true,
      role: me.role,
      name,
      preferences: me.preferences ?? {
        siteLang: null,
        voiceLang: null,
        voiceGender: null,
      },
      savedIds: lists.saved,
      routeIds: lists.route,
      readIds: union(passport.read, subjects("story.complete")),
      visitedIds: union(passport.visited, subjects("visit.verified")),
      quizIds: union(solved, quizSites),
      points: passport.points,
      memories: own.map((m) => mapMemory(m, name)),
      queue: queue.map((m) => mapMemory(m, m.authorName ?? name)),
    };
  }
  async function loadUser(cat: Catalog): Promise<UserState> {
    try {
      return await loadUserOnce(cat);
    } catch (e) {
      // The token was rejected and dropped meanwhile: continue as a guest.
      if (e instanceof ApiError && e.status === 401 && !(await token()))
        return loadUserOnce(cat);
      throw e;
    }
  }
  /** Identity (token) the cached `user` belongs to; a different token never reuses it. */
  let userKey: string | null = null;
  async function ensureUser(cat: Catalog, force = false): Promise<UserState> {
    const key = await token();
    if (user && !force && userKey === key) return user;
    user = undefined;
    const loaded = await loadUser(cat);
    userKey = await token();
    return loaded;
  }

  async function build(reloadUser: boolean): Promise<Snapshot> {
    const cat = await loadCatalog();
    // Reads that failed after a successful admin write are redone before anything is served.
    if (cat.routesStale) await refreshRoutes();
    if (cat.feedStale) await refreshFeed();
    for (const id of [...cat.stale]) await refreshSite(id);
    user = await ensureUser(cat, reloadUser);
    const draftRaw = await ensureDrafts(user);
    const published = new Set(cat.sites.map((s) => s.id));
    // `memories` stays the user's own; the public feed only adds what is not already theirs.
    const own = new Set(user.memories.map((m) => m.id));
    const snapshot: Snapshot = {
      version: 1,
      sites: [
        ...cat.sites,
        ...[...draftRaw.values()].map((d) =>
          mapAdminSite(d, placeholderOf(cat, d)),
        ),
      ],
      memories: user.memories,
      role: user.role,
      ...(user.signedIn &&
        (user.role === "moderator" || user.role === "admin") && {
          moderationQueue: user.queue,
        }),
      publicMemories: cat.feed.filter(
        (m) => published.has(m.siteId) && !own.has(m.id),
      ),
      savedIds: user.savedIds.filter((id) => published.has(id)),
      routeIds: user.routeIds.filter((id) => published.has(id)),
      pendingRouteCount: user.signedIn ? local.route.length : 0,
      visitedIds: user.visitedIds,
      readIds: user.readIds,
      quizIds: user.quizIds,
      points: user.points,
      name: user.name,
      ...(user.preferences && { preferences: user.preferences }),
      catalogRoutes: [...cat.routes, ...(drafts?.routes ?? [])],
    };
    return structuredClone(snapshot);
  }

  // ── commands ───────────────────────────────────────────────────────────────
  const toggled = (ids: string[], id: string, desired: boolean) =>
    desired ? [...new Set([...ids, id])] : ids.filter((x) => x !== id);

  /** Uploads a data-URL file (ticket, PUT, complete) and returns the new media id. */
  async function uploadMedia(
    kind: "photo" | "model",
    dataUrl: string,
    metadata: Record<string, unknown>,
  ): Promise<string> {
    const file = decodeDataUrl(dataUrl);
    if (!file)
      throw new Error(
        kind === "photo"
          ? "Fotoğraf geçerli bir dosya değil."
          : "Model geçerli bir GLB dosyası değil.",
      );
    const progress = opts.onUploadProgress;
    try {
      const ticket = await call<UploadTicketDto>("POST", "/v1/media/uploads", {
        body: {
          kind,
          // Browsers label a .glb differently or not at all; the server checks the bytes.
          contentType: kind === "model" ? "model/gltf-binary" : file.mime,
          bytes: file.bytes.length,
        },
      });
      progress?.(0);
      const url = new URL(ticket.url, `${base}/`).toString();
      let put: Response;
      try {
        if (progress && !opts.fetch && typeof XMLHttpRequest !== "undefined") {
          put = await xhrPut(url, ticket.headers, file.bytes, progress);
        } else {
          put = await doFetch(url, {
            method: "PUT",
            headers: ticket.headers,
            body: file.bytes,
          });
        }
      } catch (e) {
        throw e instanceof ApiError ? e : networkError();
      }
      if (!put.ok) throw await toApiError(put);
      progress?.(1);
      const media = await call<{ id: string }>(
        "POST",
        `/v1/media/uploads/${encodeURIComponent(ticket.uploadId)}/complete`,
        { body: metadata },
      );
      progress?.(1);
      return media.id;
    } finally {
      progress?.(null);
    }
  }

  const same = (a: unknown, b: unknown) =>
    JSON.stringify(a) === JSON.stringify(b);

  /** The details step (`PATCH .../info` fields) of a domain site, in the API's shape. */
  const infoOf = (s: HeritageSite) => ({
    name: s.name,
    nameEn: s.nameEn ?? null,
    typeId: s.kind,
    year: s.year,
    architect: s.architect,
    patron: s.patron ?? null,
    era: s.era ?? null,
    address: s.address ?? null,
    role: s.role ?? null,
    relatedSiteId: s.relatedSiteId ?? null,
    description: s.description,
    descriptionEn: s.descriptionEn ?? null,
    minutes: s.minutes,
    district: s.district || null,
    tier: s.tier,
  });

  /**
   * Panel ids of records created here → server ids. The editor keeps its own id while it stays
   * open, so a second save of a new site or route updates the record instead of creating another.
   */
  const createdIds = new Map<string, string>();
  // Keep completed uploads across failed later steps, scoped to the authenticated session and file content.
  const completedUploads = new Map<string, { src: string; id: string }>();
  let uploadsToken: string | null = null;
  async function editorUpload(
    key: string,
    kind: "photo" | "model",
    src: string,
    metadata: Record<string, unknown>,
  ) {
    const currentToken = await token();
    if (currentToken !== uploadsToken) {
      completedUploads.clear();
      uploadsToken = currentToken;
    }
    const cached = completedUploads.get(key);
    if (cached?.src === src) {
      // Metadata may have changed after a partially successful save.
      await call("PATCH", `/v1/admin/media/${encodeURIComponent(cached.id)}`, {
        body: metadata,
      });
      return cached.id;
    }
    const id = await uploadMedia(kind, src, metadata);
    completedUploads.set(key, { src, id });
    return id;
  }

  /** Re-reads a site after a voice-over or translation request and returns it with the new snapshot. */
  async function reloadAdminSite(id: string) {
    await refreshAdminSite(id);
    const snapshot = await build(false);
    const site = snapshot.sites.find((s) => s.id === id);
    if (!site) throw new Error("Eser yeniden okunamadı.");
    return { site, snapshot };
  }

  async function updateSite(input: HeritageSite) {
    validateSite(input);
    let site = { ...input, id: createdIds.get(input.id) ?? input.id };
    const cat = await loadCatalog();
    const draftRaw = user ? await ensureDrafts(user) : new Map();
    const pub = cat.raw.get(site.id);
    let draft = pub ? undefined : draftRaw.get(site.id);
    // Unknown id: a new site. Its pin is always sent: the editor placed it (unlike §11.23's placeholder).
    const fresh = !pub && !draft;
    if (fresh) {
      draft = await call<AdminSiteDetailDto>("POST", "/v1/admin/sites", {
        body: { ...infoOf(site), city: site.city },
      });
      createdIds.set(input.id, draft.id);
      site = { ...site, id: draft.id };
    }
    // What the editor was shown: a draft's missing location is the placeholder (§11.23).
    const shownAt: [number, number] = pub
      ? pub.coordinates
      : (draft!.coordinates ??
        (fresh ? site.coordinates : placeholderOf(cat, draft!)));
    const cur = pub ? mapSite(pub) : mapAdminSite(draft!, shownAt);
    const info: Record<string, unknown> = {};
    const now = infoOf(site),
      before = infoOf(cur);
    for (const key of Object.keys(now) as (keyof typeof now)[])
      if (!same(now[key], before[key])) info[key] = now[key];
    // A draft without a type shows "cami"; its type is sent on every save (§11.23).
    if (draft?.kind === null) info.typeId = site.kind;
    const path = `/v1/admin/sites/${encodeURIComponent(site.id)}`;
    try {
      // City goes with the other details (§11.26): the server takes the city's name.
      if (site.city !== cur.city) info.city = site.city;
      if (Object.keys(info).length)
        await call("PATCH", `${path}/info`, { body: info });
      // An unmoved placeholder is no location: the server keeps refusing to publish it.
      if (fresh || !same(site.coordinates, shownAt))
        await call("PUT", `${path}/location`, {
          body: { coordinates: site.coordinates },
        });
      await saveContent(site, cur, path);
      if (site.status === "published" && !pub)
        await call("POST", `${path}/publish`);
      if (site.status === "draft" && pub)
        await call("POST", `${path}/unpublish`);
    } catch (e) {
      // Earlier steps may have been saved (e.g. info before a refused publish): show them.
      await refreshAdminSite(site.id).catch(() => undefined);
      throw e;
    }
    await refreshAdminSite(site.id);
  }

  const photoMetadata = (p: SitePhoto) => ({
    alt: p.alt,
    title: p.title,
    titleEn: p.titleEn || null,
    description: p.description,
    license: p.license,
    sourceId: p.sourceId || null,
    trust: p.trust,
  });

  /**
   * Waits for the server to read a new model's part names (a background job), which story
   * highlights are checked against.
   */
  async function modelParts(path: string, modelId: string) {
    for (let attempt = 0; attempt < MODEL_PARTS_ATTEMPTS; attempt++) {
      const d = await call<AdminSiteDetailDto>("GET", path);
      if (d.media.find((m) => m.id === modelId)?.parts.length) return;
      await new Promise((r) => setTimeout(r, MODEL_PARTS_WAIT_MS));
    }
    throw new Error(
      "Modelin parça adları henüz okunmadı. Vurgulu cümleler ve parça kartları için birkaç saniye sonra yeniden kaydet.",
    );
  }

  /**
   * Sources, photos, model, story and part cards of an editor save, through the wizard's step endpoints. Order
   * follows the references: sources before the photos and sentences citing them, files before the
   * lists naming them, the model (and its part names) before the highlights. Each step is skipped
   * when unchanged. A new file is a data URL: it is uploaded and its domain id mapped to the media id.
   */
  async function saveContent(
    site: HeritageSite,
    cur: HeritageSite,
    path: string,
  ) {
    const photos = site.photos ?? [];
    const sourcesChanged = !same(site.sources ?? [], cur.sources ?? []);
    // The placement has its own command; a stale copy on the model is no model change.
    const modelChanged = !same(
      site.model && { ...site.model, placement: undefined },
      cur.model && { ...cur.model, placement: undefined },
    );
    const photosChanged =
      !same(photos, cur.photos ?? []) || site.coverPhotoId !== cur.coverPhotoId;
    const storiesChanged = !same(site.stories, cur.stories);
    const partCardsChanged = !same(site.partCards ?? [], cur.partCards ?? []);
    if (
      !sourcesChanged &&
      !modelChanged &&
      !photosChanged &&
      !storiesChanged &&
      !partCardsChanged
    )
      return;
    // What the domain site does not carry: source locators, story cards and audio.
    const before = await call<AdminSiteDetailDto>("GET", path);

    if (sourcesChanged) {
      const locators = new Map(
        before.sourceLinks.map((l) => [l.sourceId, l.locator]),
      );
      await call("PUT", `${path}/sources`, {
        body: {
          sources: (site.sources ?? []).map((s) => ({
            ...s,
            locator: locators.get(s.id) ?? null,
          })),
        },
      });
    }

    const uploaded = new Map<string, string>();
    const mediaId = (photoId: string) => uploaded.get(photoId) ?? photoId;
    const oldPhotos = new Map((cur.photos ?? []).map((p) => [p.id, p]));
    for (const p of photos) {
      const old = oldPhotos.get(p.id);
      if (p.src.startsWith("data:"))
        uploaded.set(
          p.id,
          await editorUpload(
            `${site.id}:photo:${p.id}`,
            "photo",
            p.src,
            photoMetadata(p),
          ),
        );
      // A photo is shared: its details change wherever it is used (as the "photo" command does).
      else if (old && !same(photoMetadata(p), photoMetadata(old)))
        await call("PATCH", `/v1/admin/media/${encodeURIComponent(p.id)}`, {
          body: photoMetadata(p),
        });
    }

    if (modelChanged) {
      const model = site.model;
      const linked = before.media.find((m) => m.kind === "model");
      if (!model) {
        await call("PUT", `${path}/model`, { body: { mediaId: null } });
      } else if (model.src.startsWith("data:")) {
        // The opening camera belongs to the old model; a new one starts without it.
        const id = await editorUpload(`${site.id}:model`, "model", model.src, {
          title: model.name,
          license: CONTRIBUTOR_LICENSE,
          trust: model.trust,
        });
        await call("PUT", `${path}/model`, { body: { mediaId: id } });
        if (
          site.stories.some((s) => s.highlights?.length) ||
          (partCardsChanged && site.partCards?.length)
        )
          await modelParts(path, id);
      } else if (linked && model.trust !== linked.trust) {
        await call(
          "PATCH",
          `/v1/admin/media/${encodeURIComponent(linked.id)}`,
          {
            body: { trust: model.trust },
          },
        );
      }
    }

    if (photosChanged)
      await call("PUT", `${path}/media`, {
        body: {
          photoIds: photos.map((p) => mediaId(p.id)),
          coverPhotoId: site.coverPhotoId ? mediaId(site.coverPhotoId) : null,
        },
      });

    // A replaced photo keeps its domain id in the sentences but has a new media id.
    const remapped = site.stories.some(
      (s) => s.photoId !== undefined && uploaded.has(s.photoId),
    );
    if (storiesChanged || remapped) {
      const kept = new Map(before.stories.map((s) => [s.id, s]));
      await call("PUT", `${path}/stories`, {
        body: {
          blocks: site.stories.map((s) => {
            const k = kept.get(s.id);
            return {
              id: s.id,
              title: s.title,
              text: s.text,
              textEn: s.textEn || null,
              simpleEn: s.simpleEn || null,
              simple: s.simple,
              trust: s.trust,
              photoId: s.photoId ? mediaId(s.photoId) : null,
              sourceId: s.sourceId || null,
              showCard: s.showCard ?? null,
              highlights: s.highlights ?? [],
              cardId: k?.cardId ?? null,
              camera: s.camera ?? null,
              interior: s.interior ?? false,
              routeOnly: s.routeOnly ?? false,
              flow: s.flow ?? null,
            };
          }),
        },
      });
    }

    // Last: the cards name model parts, gallery and story photos and the site's sources, all saved above.
    const cardsRemapped = (site.partCards ?? []).some((c) =>
      c.photos.some((p) => uploaded.has(p.id)),
    );
    if (partCardsChanged || cardsRemapped)
      await call("PUT", `${path}/part-cards`, {
        body: {
          cards: (site.partCards ?? []).map((c) => ({
            id: c.id,
            parts: c.parts,
            title: c.title,
            body: c.body,
            photoIds: c.photos.map((p) => mediaId(p.id)),
            trust: c.trust,
            sourceId: c.sourceId || null,
          })),
        },
      });
  }

  async function updateRoutes(input: HeritageRoute[]) {
    const cat = await loadCatalog();
    if (user) await ensureDrafts(user);
    const known = [...cat.routes, ...(drafts?.routes ?? [])];
    const routes = input.map((r) => ({
      ...r,
      id: createdIds.get(r.id) ?? r.id,
    }));
    const ids = new Set(routes.map((r) => r.id));
    if (known.some((c) => !ids.has(c.id)))
      throw new UnsupportedCommandError(
        "catalog-routes",
        "Rota silme API üzerinden yapılamıyor; rotayı yayından kaldırmak için taslak olarak kaydet.",
      );
    // A route lives in one city and its stops in that city (`setStops`): a new one takes its first stop's.
    const cityOf = (siteId: string) =>
      cat.raw.get(siteId)?.city.id ?? drafts?.raw.get(siteId)?.city.id;
    const fresh = routes.filter((r) => !known.some((c) => c.id === r.id));
    if (fresh.some((r) => !r.siteIds[0] || !cityOf(r.siteIds[0])))
      throw new UnsupportedCommandError(
        "catalog-routes",
        "Yeni rotanın şehri ilk durağından belirlenir; kaydetmeden önce en az bir durak seç.",
      );
    // An empty English name clears it: the API takes `null`, never empty text.
    const nameEnOf = (r: HeritageRoute) => r.nameEn?.trim() || null;
    try {
      for (const route of routes) {
        let r = route;
        let cur = known.find((c) => c.id === r.id);
        const isNew = !cur;
        if (!cur) {
          const created = await call<AdminRouteDto>(
            "POST",
            "/v1/admin/routes",
            {
              body: {
                name: r.name,
                nameEn: nameEnOf(r),
                description: r.description,
                theme: r.theme,
                cityId: cityOf(r.siteIds[0]!),
              },
            },
          );
          // A fresh route's id is still the panel's own (never mapped before).
          createdIds.set(r.id, created.id);
          cur = mapAdminRoute(created);
          r = { ...r, id: created.id };
        }
        const id = encodeURIComponent(r.id);
        const patch: Record<string, unknown> = {};
        if (r.name !== cur.name) patch.name = r.name;
        if (nameEnOf(r) !== nameEnOf(cur)) patch.nameEn = nameEnOf(r);
        if (r.description !== cur.description)
          patch.description = r.description;
        if (r.theme !== cur.theme) patch.theme = r.theme;
        if (Object.keys(patch).length)
          await call("PATCH", `/v1/admin/routes/${id}`, { body: patch });
        if (!same(r.siteIds, cur.siteIds)) {
          // Stop quizzes and archive images are not in the domain route: keep the server's.
          const stops: AdminRouteDto["stops"] = isNew
            ? []
            : (await call<AdminRouteDto>("GET", `/v1/admin/routes/${id}`))
                .stops;
          const extras = new Map(stops.map((s) => [s.site.id, s]));
          await call("PUT", `/v1/admin/routes/${id}/stops`, {
            body: {
              stops: r.siteIds.map((siteId) => ({
                siteId,
                quizId: extras.get(siteId)?.quizId ?? null,
                historyImageId: extras.get(siteId)?.historyImageId ?? null,
              })),
            },
          });
        }
        const status = r.status ?? "published";
        if (status !== (cur.status ?? "published"))
          await call(
            "POST",
            `/v1/admin/routes/${id}/${status === "published" ? "publish" : "unpublish"}`,
          );
      }
    } catch (e) {
      // Earlier steps may have been saved (e.g. a new route before refused stops): show them.
      await refreshRoutes().catch(() => undefined);
      await refreshDraftRoutes().catch(() => undefined);
      throw e;
    }
    await refreshRoutes();
    await refreshDraftRoutes();
  }

  /** Replaces "Rotam": the account's (one PUT, the server's answer is kept) or the device's for a guest. */
  async function setRoute(siteIds: string[]) {
    if (await token()) {
      const res = await call<{ siteIds: string[] }>("PUT", "/v1/me/route", {
        body: { siteIds },
      });
      user!.routeIds = res.siteIds;
      return;
    }
    writeLocal({ ...local, route: siteIds });
    user!.routeIds = siteIds;
  }

  async function run(command: Command): Promise<boolean> {
    const cat = await loadCatalog();
    user = await ensureUser(cat);
    if (
      "siteId" in command &&
      // A placement is also saved for drafts, which the published catalog does not list.
      command.type !== "map-placement" &&
      !cat.sites.some((s) => s.id === command.siteId)
    )
      throw new Error("Eser bulunamadı.");
    switch (command.type) {
      case "save": {
        const desired = !user.savedIds.includes(command.siteId);
        if (await token()) {
          await call(
            desired ? "PUT" : "DELETE",
            `/v1/me/saved/${encodeURIComponent(command.siteId)}`,
          );
          return true;
        }
        writeLocal({
          ...local,
          saved: toggled(local.saved, command.siteId, desired),
        });
        return true;
      }
      case "route":
        await setRoute(
          toggled(
            user.routeIds,
            command.siteId,
            !user.routeIds.includes(command.siteId),
          ),
        );
        return false;
      case "set-route":
        await setRoute(
          [...new Set(command.siteIds)].filter((id) =>
            cat.sites.some((s) => s.id === id),
          ),
        );
        return false;
      case "read": {
        if (user.readIds.includes(command.siteId)) return false;
        const done = await call<{ receipt?: string }>(
          "POST",
          `/v1/stories/${encodeURIComponent(command.siteId)}/complete`,
        );
        storeReceipt(done.receipt, "story.complete", command.siteId);
        return true;
      }
      case "visit": {
        if (!opts.locate)
          throw new UnsupportedCommandError(
            "visit",
            "Ziyareti doğrulamak için konum gerekir; konum izni bu sürümde bağlı değil.",
          );
        if (user.visitedIds.includes(command.siteId)) return false;
        const pos = await opts.locate();
        const done = await call<{ verified: boolean; receipt?: string }>(
          "POST",
          "/v1/visits/verify",
          {
            body: {
              siteId: command.siteId,
              coordinates: pos.coordinates,
              accuracyM: pos.accuracyM,
            },
          },
        );
        if (!done.verified)
          throw new Error("Ziyareti doğrulamak için esere yaklaşmalısın.");
        storeReceipt(done.receipt, "visit.verified", command.siteId);
        return true;
      }
      case "memory": {
        if (!(await token()))
          throw new Error("Anı eklemek için giriş yapmalısın.");
        const consent = await opts.getMemoryConsent?.();
        if (!consent)
          throw new UnsupportedCommandError(
            "memory",
            "Anı göndermeden önce KVKK aydınlatma metnini onaylamalısın.",
          );
        const site = cat.sites.find((s) => s.id === command.memory.siteId);
        const photo = command.memory.photo;
        const mediaId = photo
          ? await uploadMedia("photo", photo, {
              alt: `${site?.name ?? "Eser"} için paylaşılan fotoğraf`,
              // Editors and admins must state licence and trust; visitors send only `alt`.
              ...((user.role === "editor" || user.role === "admin") && {
                license: CONTRIBUTOR_LICENSE,
                trust: "representative",
              }),
            })
          : undefined;
        await call("POST", "/v1/memories", {
          body: {
            siteId: command.memory.siteId,
            text: command.memory.text.trim(),
            ...(mediaId && { mediaId }),
            kvkkConsent: true,
            kvkkTextVersion: consent.textVersion,
          },
        });
        return true;
      }
      case "moderate":
        await call(
          "POST",
          `/v1/admin/memories/${encodeURIComponent(command.id)}/decision`,
          {
            body:
              command.status === "rejected"
                ? { status: "rejected", reason: command.reason?.trim() ?? "" }
                : { status: "approved" },
          },
        );
        // The decision may add a memory to the public feed or take one out of it.
        await refreshFeed();
        return true;
      case "delete-memory":
      case "admin-delete-memory":
        await call(
          "DELETE",
          `${command.type === "delete-memory" ? "/v1/me/memories" : "/v1/admin/memories"}/${encodeURIComponent(command.id)}`,
        );
        // The memory leaves the public feed; the points are re-read with the user.
        await refreshFeed();
        return true;
      case "site":
        await updateSite(command.site);
        return false;
      case "map-placement": {
        validatePlacement(command.placement);
        const p = command.placement;
        const id = createdIds.get(command.siteId) ?? command.siteId;
        await call(
          "PUT",
          `/v1/admin/sites/${encodeURIComponent(id)}/map-placement`,
          {
            body: {
              lng: p.lng,
              lat: p.lat,
              headingDeg: p.headingDeg,
              scale: p.scale,
              altitudeM: p.altitudeM,
              anchorNode: p.anchorNode,
              hiddenPoints: p.hiddenPoints,
              keptPoints: p.keptPoints,
              visible: p.visible ?? true,
            },
          },
        );
        // The answer is the admin detail; the catalog entry (and the visitor's placement in it) is re-read.
        await refreshAdminSite(id);
        return false;
      }
      case "catalog-routes":
        await updateRoutes(command.routes);
        return false;
      case "photo": {
        const cur = [...cat.raw.values()].find((d) =>
          d.media.some((m) => m.id === command.photo.id),
        );
        const known = cur?.sources.find((s) => s.id === command.source.id);
        if (!cur || !known || !same(known, command.source))
          throw new UnsupportedCommandError(
            "photo",
            "Fotoğrafın kaynağını eklemek ya da değiştirmek için eserin kaynak listesi güncellenmeli; bu komut yalnızca fotoğraf bilgisini günceller.",
          );
        const p = command.photo;
        await call("PATCH", `/v1/admin/media/${encodeURIComponent(p.id)}`, {
          body: {
            alt: p.alt,
            title: p.title,
            titleEn: p.titleEn || null,
            description: p.description,
            license: p.license,
            sourceId: p.sourceId,
            trust: p.trust,
          },
        });
        await refreshSite(cur.id);
        return false;
      }
      case "import-sites":
        throw new UnsupportedCommandError(
          "import-sites",
          "İçe aktarma sunucuda envanter CSV'sinden yapılır; hazır eser listesi gönderilemez.",
        );
    }
  }

  // One operation at a time: toggles read the cache the previous operation left behind.
  let queue: Promise<unknown> = Promise.resolve();
  /** The catalog re-read in flight; timers and tab focus share it instead of stacking requests. */
  let refreshing: Promise<Snapshot> | undefined;
  const enqueue = <T>(task: () => Promise<T>): Promise<T> => {
    const result = queue.then(task);
    queue = result.catch(() => undefined);
    return result;
  };
  const quizPath = (quizId: string) =>
    `/v1/quizzes/${encodeURIComponent(quizId)}`;
  return {
    getSnapshot: () => enqueue(() => build(true)),
    refreshCatalog: () =>
      (refreshing ??= enqueue(async () => {
        // Swap only after the whole read succeeded: a failed refresh keeps what the visitor sees.
        catalogLoad = Promise.resolve(await fetchCatalog());
        return build(false);
      }).finally(() => {
        refreshing = undefined;
      })),
    getMapSettings: async () => {
      const s = await call<Partial<MapSettings>>("GET", "/v1/map-settings");
      return {
        modelMinZoom: Number.isFinite(s.modelMinZoom)
          ? s.modelMinZoom!
          : defaultMapSettings.modelMinZoom,
        maxVisibleModels: Number.isFinite(s.maxVisibleModels)
          ? s.maxVisibleModels!
          : defaultMapSettings.maxVisibleModels,
      };
    },
    setMapSettings: (settings) =>
      call<MapSettings>("PUT", "/v1/admin/map-settings", { body: settings }),
    savePreferences: async (patch) => {
      const saved = await call<UserPreferences>("PUT", "/v1/me/preferences", {
        body: patch,
      });
      // The server returns the whole object; keep the cached account state in step with it.
      if (user?.signedIn) user = { ...user, preferences: saved };
      return saved;
    },
    // An API from before §11.49 sends no `identity`: the loading screens stay neutral.
    getCities: async () =>
      (
        await call<{
          items: Array<
            Omit<CityRecord, "identity"> &
              Partial<Pick<CityRecord, "identity">> & { routeCount: number }
          >;
        }>("GET", "/v1/cities")
      ).items.map(({ routeCount: _routes, identity, ...city }) => ({
        ...city,
        identity: identity ?? null,
      })),
    // Live state, not queued behind commands: the editor reads it when it opens.
    getMapPlacement: async (siteId) => {
      const id = createdIds.get(siteId) ?? siteId;
      const d = await call<AdminSiteDetailDto>(
        "GET",
        `/v1/admin/sites/${encodeURIComponent(id)}`,
        { cache: "no-store" },
      );
      return d.mapPlacement
        ? mapAdminPlacement(d.mapPlacement, d.coordinates ?? [0, 0])
        : null;
    },
    getModerationPage: (status, cursor) =>
      enqueue(async () => {
        const page = await call<{
          items: MemoryDto[];
          nextCursor: string | null;
        }>("GET", "/v1/admin/memories", {
          query: { status, limit: 25, ...(cursor && { cursor }) },
          cache: "no-store",
        });
        return {
          items: page.items.map((m) => mapMemory(m, m.authorName ?? "Gezgin")),
          nextCursor: page.nextCursor,
        };
      }),
    dispatch: (command) =>
      enqueue(async () => {
        const reload = await run(command);
        return build(reload);
      }),
    narrateSite: (siteId, storyBlockId) =>
      enqueue(async () => {
        const id = createdIds.get(siteId) ?? siteId;
        const counts = await call<Omit<NarrationRun, "site" | "snapshot">>(
          "POST",
          `/v1/admin/sites/${encodeURIComponent(id)}/narrations`,
          { body: storyBlockId ? { storyBlockId } : {} },
        );
        return { ...counts, ...(await reloadAdminSite(id)) };
      }),
    translateSite: (siteId, storyBlockId) =>
      enqueue(async () => {
        const id = createdIds.get(siteId) ?? siteId;
        const counts = await call<Omit<TranslationRun, "site" | "snapshot">>(
          "POST",
          `/v1/admin/sites/${encodeURIComponent(id)}/translate`,
          { body: storyBlockId ? { storyBlockId } : {} },
        );
        return { ...counts, ...(await reloadAdminSite(id)) };
      }),
    saveSite: (input) =>
      enqueue(async () => {
        await run({ type: "site", site: input });
        const snapshot = await build(false);
        const id = createdIds.get(input.id) ?? input.id;
        const site = snapshot.sites.find((s) => s.id === id);
        if (!site) throw new Error("Kaydedilen eser yeniden okunamadı.");
        return { site, snapshot };
      }),
    reset: () =>
      enqueue(() => {
        // Local guest state only: no server mutation. The device id is kept.
        writeLocal({
          deviceId: local.deviceId,
          receipts: [],
          saved: [],
          route: [],
        });
        catalogLoad = undefined;
        user = undefined;
        drafts = undefined;
        return build(true);
      }),
    getQuizzes: (siteId) =>
      enqueue(async (): Promise<PlayableQuiz[]> => {
        const cat = await loadCatalog();
        const states = await pool(
          cat.siteQuizzes.get(siteId) ?? [],
          CONCURRENCY,
          async (id) => {
            try {
              return await call<QuizStateDto>("GET", quizPath(id));
            } catch (e) {
              // Unpublished since the routes were read: not playable.
              if (e instanceof ApiError && e.status === 404) return null;
              throw e;
            }
          },
        );
        return states.filter(present).map((q) => ({
          id: q.id,
          siteId: q.siteId,
          question: q.question,
          options: q.options,
          hint: q.hintAvailable ? q.hint : null,
          solved: q.solved,
          revealed: q.revealed,
        }));
      }),
    answerQuiz: (quizId, choice) =>
      enqueue(async (): Promise<QuizAnswerResult> => {
        const cat = await loadCatalog();
        user = await ensureUser(cat);
        const res = await call<QuizSubmitDto>(
          "POST",
          `${quizPath(quizId)}/submit`,
          { body: { choice } },
        );
        // Only guests get a receipt; its points stay pending until sign-in.
        storeReceipt(res.receipt, "quiz.correct", quizId);
        return {
          correct: res.correct,
          awarded:
            res.awarded +
            (res.receipt ? (receiptPoints["quiz.correct"] ?? 0) : 0),
          hint: res.hint ?? null,
          explanation: res.explanation?.text ?? null,
          // A wrong answer changes no points; a right one is re-read from the server.
          snapshot: await build(res.correct),
        };
      }),
    revealQuiz: (quizId) =>
      enqueue(async () => {
        const cat = await loadCatalog();
        user = await ensureUser(cat);
        const res = await call<{ correctOption: string }>(
          "POST",
          `${quizPath(quizId)}/reveal`,
        );
        return {
          correctOption: res.correctOption,
          snapshot: await build(false),
        };
      }),
    // Optional auth: a signed-in user's token earns badges, a guest plays without storing anything.
    answerSiteTask: (taskId, choice) =>
      call<SiteTaskAnswerResult>(
        "POST",
        `/v1/site-tasks/${encodeURIComponent(taskId)}/answer`,
        { body: { choice } },
      ),
    completeSiteTask: async (taskId, input) => {
      const body =
        input.mode === "onSite"
          ? {
              mode: "onSite",
              lat: input.coordinates[1],
              lng: input.coordinates[0],
              ...(input.accuracyM !== undefined && {
                accuracyM: input.accuracyM,
              }),
            }
          : { mode: "fromHome", part: input.part };
      try {
        const done = await call<{
          doneText: string;
          onSite: boolean;
          earnedBadges: SiteBadge[];
        }>(
          "POST",
          `/v1/site-tasks/${encodeURIComponent(taskId)}/complete`,
          { body },
        );
        return { done: true, ...done };
      } catch (e) {
        // Not a failed request: the visitor is too far away or tapped another part.
        if (
          e instanceof ApiError &&
          e.status === 422 &&
          (e.code === "TOO_FAR" || e.code === "WRONG_PART")
        )
          return {
            done: false,
            reason: e.code === "TOO_FAR" ? "tooFar" : "wrongPart",
          };
        throw e;
      }
    },
    getSiteProgress: async () =>
      (await token())
        ? call<SiteProgress>("GET", "/v1/me/site-progress", {
            cache: "no-store",
          })
        : { tasks: [], badges: [] },
    // Live state, not queued behind commands: the panel re-reads it after each one.
    getMembers: (query, page) =>
      call<MemberPage>("GET", "/v1/admin/users", {
        query: { query, page, pageSize: 25 },
        cache: "no-store",
      }),
    setMemberRole: (userId, role, expectedRole) =>
      call<AdminMember>(
        "PUT",
        `/v1/admin/users/${encodeURIComponent(userId)}/role`,
        { body: { role, expectedRole } },
      ),
    getAdminHealth: () =>
      call<AdminHealth>("GET", "/v1/admin/health", { cache: "no-store" }),
  };
}
