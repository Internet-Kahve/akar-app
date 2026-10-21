import {
  validateSite,
  type Command,
  type HeritageRoute,
  type HeritageSite,
  type Memory,
  type SiteKind,
  type SitePhoto,
  type SiteSource,
  type Snapshot,
  type StoryBlock,
  type Trust,
} from "@akar/domain";
import type { AkarClient, StorageAdapter } from "./index";

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
}

export const httpStorageKey = "akar-http-v1";
const CONCURRENCY = 6;
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
  }>;
  cards: Array<{ mediaId: string }>;
  historyImages: Array<{ mediaId: string; presentMediaId: string | null }>;
  media: MediaDto[];
  sources: SiteSource[];
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
interface MeDto {
  id: string;
  role: "user" | "editor" | "moderator" | "admin";
  displayName: string | null;
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

export function mapSite(d: SiteDetailDto): HeritageSite {
  const stories: StoryBlock[] = d.stories.map((s) => ({
    id: s.id,
    title: s.title,
    text: s.text,
    simple: s.simple,
    trust: s.trust,
    highlights: s.highlights,
    ...(present(s.textEn) && { textEn: s.textEn }),
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
    ].filter(present),
  );
  const photos = d.media
    .filter((m) => m.kind === "photo" && (used.has(m.id) || !other.has(m.id)))
    .map(toPhoto);
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
    ...(d.editorVersion === 2 && { editorVersion: 2 as const }),
    ...(present(d.nameEn) && { nameEn: d.nameEn }),
    ...(present(d.descriptionEn) && { descriptionEn: d.descriptionEn }),
    ...(present(d.patron) && { patron: d.patron }),
    ...(present(d.era) && { era: d.era }),
    ...(present(d.address) && { address: d.address }),
    ...(present(d.role) && { role: d.role }),
    ...(present(d.relatedSiteId) && { relatedSiteId: d.relatedSiteId }),
    ...(present(d.coverMediaId) && { coverPhotoId: d.coverMediaId }),
    ...(model && {
      model: {
        name: model.title || model.id,
        // The public media DTO carries no byte size.
        bytes: 0,
        src: model.url,
        parts: model.parts,
        trust: model.trust,
      },
    }),
  };
}

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
  quizSite: Map<string, string>;
  stale: Set<string>;
  routesStale: boolean;
}
interface UserState {
  signedIn: boolean;
  role: MeDto["role"];
  name: string;
  savedIds: string[];
  readIds: string[];
  visitedIds: string[];
  quizIds: string[];
  points: number;
  memories: Memory[];
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
    init: { query?: Record<string, string | number>; body?: unknown } = {},
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
    init?: { query?: Record<string, string | number>; body?: unknown },
  ): Promise<T> => {
    const res = await send(method, path, init);
    return (res.status === 204 ? undefined : await res.json()) as T;
  };
  const pages = async <T>(path: string, query: Record<string, string> = {}) => {
    const out: T[] = [];
    let cursor: string | null = null;
    do {
      const page: Page<T> = await call("GET", path, {
        query: { ...query, limit: 100, ...(cursor && { cursor }) },
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
    for (const r of dtos)
      for (const s of r.stops) if (s.quizId) quizSite.set(s.quizId, s.site.id);
    return { routes: dtos.map(mapRoute), quizSite };
  };
  const loadCatalog = (): Promise<Catalog> => {
    catalogLoad ??= (async () => {
      const summaries = await pages<SiteSummaryDto>("/v1/sites");
      const [details, routes] = await Promise.all([
        pool(summaries, CONCURRENCY, (s) =>
          call<SiteDetailDto>("GET", `/v1/sites/${encodeURIComponent(s.id)}`),
        ),
        loadRoutes(),
      ]);
      return {
        sites: details.map(mapSite),
        raw: new Map(details.map((d) => [d.id, d])),
        stale: new Set<string>(),
        routesStale: false,
        ...routes,
      };
    })();
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
  const refreshRoutes = async () => {
    const cat = await loadCatalog();
    cat.routesStale = true;
    Object.assign(cat, await loadRoutes());
    cat.routesStale = false;
  };

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
        savedIds: local.saved,
        readIds: subjects("story.complete"),
        visitedIds: subjects("visit.verified"),
        quizIds: quizSites,
        points: pendingPoints,
        memories: [],
      };
    }
    const [me, passport, own] = await Promise.all([
      call<MeDto>("GET", "/v1/me"),
      call<PassportDto>("GET", "/v1/me/passport"),
      pages<MemoryDto>("/v1/me/memories"),
    ]);
    const name = me.displayName ?? "Gezgin";
    const queue =
      me.role === "moderator" || me.role === "admin"
        ? await pages<MemoryDto>("/v1/admin/memories", { status: "pending" })
        : [];
    const memories = new Map<string, Memory>();
    for (const m of queue)
      memories.set(m.id, mapMemory(m, m.authorName ?? name));
    for (const m of own) memories.set(m.id, mapMemory(m, name));
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
      savedIds: passport.saved,
      readIds: union(passport.read, subjects("story.complete")),
      visitedIds: union(passport.visited, subjects("visit.verified")),
      quizIds: union(solved, quizSites),
      points: passport.points,
      memories: [...memories.values()],
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
    for (const id of [...cat.stale]) await refreshSite(id);
    user = await ensureUser(cat, reloadUser);
    const published = new Set(cat.sites.map((s) => s.id));
    const snapshot: Snapshot = {
      version: 1,
      sites: cat.sites,
      memories: user.memories,
      savedIds: user.savedIds.filter((id) => published.has(id)),
      routeIds: local.route.filter((id) => published.has(id)),
      visitedIds: user.visitedIds,
      readIds: user.readIds,
      quizIds: user.quizIds,
      points: user.points,
      name: user.name,
      catalogRoutes: cat.routes,
    };
    return structuredClone(snapshot);
  }

  // ── commands ───────────────────────────────────────────────────────────────
  const toggled = (ids: string[], id: string, desired: boolean) =>
    desired ? [...new Set([...ids, id])] : ids.filter((x) => x !== id);

  async function uploadPhoto(
    dataUrl: string,
    alt: string,
    role: MeDto["role"],
  ): Promise<string> {
    const file = decodeDataUrl(dataUrl);
    if (!file) throw new Error("Fotoğraf geçerli bir dosya değil.");
    const ticket = await call<UploadTicketDto>("POST", "/v1/media/uploads", {
      body: { kind: "photo", contentType: file.mime, bytes: file.bytes.length },
    });
    let put: Response;
    try {
      put = await doFetch(new URL(ticket.url, `${base}/`).toString(), {
        method: "PUT",
        headers: ticket.headers,
        body: file.bytes,
      });
    } catch {
      throw networkError();
    }
    if (!put.ok) throw await toApiError(put);
    const media = await call<{ id: string }>(
      "POST",
      `/v1/media/uploads/${encodeURIComponent(ticket.uploadId)}/complete`,
      {
        // Editors and admins must state licence and trust; visitors send only `alt`.
        body: {
          alt,
          ...((role === "editor" || role === "admin") && {
            license: "Katkı sahibi izniyle",
            trust: "representative",
          }),
        },
      },
    );
    return media.id;
  }

  const same = (a: unknown, b: unknown) =>
    JSON.stringify(a) === JSON.stringify(b);

  async function updateSite(site: HeritageSite) {
    validateSite(site);
    const cat = await loadCatalog();
    const raw = cat.raw.get(site.id);
    if (!raw)
      throw new UnsupportedCommandError(
        "site",
        "Yeni eser oluşturmak için şehir bilgisi gerekir; bu işlem şimdilik API üzerinden yapılamıyor.",
      );
    const cur = mapSite(raw);
    const locked = [
      "stories",
      "photos",
      "sources",
      "model",
      "coverPhotoId",
      "city",
    ] as const;
    if (locked.some((k) => !same(cur[k], site[k])))
      throw new UnsupportedCommandError(
        "site",
        "Hikâye, fotoğraf, kaynak, model ve şehir değişiklikleri adım adım API uçlarıyla yapılır; bu komut yalnızca eser bilgilerini ve konumu günceller.",
      );
    const info: Record<string, unknown> = {};
    const field = (key: string, now: unknown, before: unknown) => {
      if (!same(now, before)) info[key] = now;
    };
    field("name", site.name, cur.name);
    field("nameEn", site.nameEn ?? null, cur.nameEn ?? null);
    field("typeId", site.kind, cur.kind);
    field("year", site.year, cur.year);
    field("architect", site.architect, cur.architect);
    field("patron", site.patron ?? null, cur.patron ?? null);
    field("era", site.era ?? null, cur.era ?? null);
    field("address", site.address ?? null, cur.address ?? null);
    field("role", site.role ?? null, cur.role ?? null);
    field(
      "relatedSiteId",
      site.relatedSiteId ?? null,
      cur.relatedSiteId ?? null,
    );
    field("description", site.description, cur.description);
    field(
      "descriptionEn",
      site.descriptionEn ?? null,
      cur.descriptionEn ?? null,
    );
    field("minutes", site.minutes, cur.minutes);
    field("district", site.district || null, cur.district || null);
    field("tier", site.tier, cur.tier);
    const id = encodeURIComponent(site.id);
    if (Object.keys(info).length)
      await call("PATCH", `/v1/admin/sites/${id}/info`, { body: info });
    if (!same(site.coordinates, cur.coordinates))
      await call("PUT", `/v1/admin/sites/${id}/location`, {
        body: { coordinates: site.coordinates },
      });
    if (site.status === "draft")
      await call("POST", `/v1/admin/sites/${id}/unpublish`);
    await refreshSite(site.id);
  }

  async function updateRoutes(routes: HeritageRoute[]) {
    const cat = await loadCatalog();
    const ids = new Set(routes.map((r) => r.id));
    if (
      routes.some((r) => !cat.routes.some((c) => c.id === r.id)) ||
      cat.routes.some((c) => !ids.has(c.id))
    )
      throw new UnsupportedCommandError(
        "catalog-routes",
        "Rota ekleme ve silme API üzerinden yapılamıyor (kimliği sunucu üretir, şehir bilgisi gerekir); yalnızca var olan rotalar güncellenir.",
      );
    for (const r of routes) {
      const cur = cat.routes.find((c) => c.id === r.id) as HeritageRoute;
      const id = encodeURIComponent(r.id);
      const patch: Record<string, unknown> = {};
      if (r.name !== cur.name) patch.name = r.name;
      if ((r.nameEn ?? null) !== (cur.nameEn ?? null))
        patch.nameEn = r.nameEn ?? null;
      if (r.description !== cur.description) patch.description = r.description;
      if (r.theme !== cur.theme) patch.theme = r.theme;
      if (Object.keys(patch).length)
        await call("PATCH", `/v1/admin/routes/${id}`, { body: patch });
      if (!same(r.siteIds, cur.siteIds)) {
        const full = await call<{
          stops: Array<{
            site: { id: string };
            quizId: string | null;
            historyImageId: string | null;
          }>;
        }>("GET", `/v1/admin/routes/${id}`);
        const extras = new Map(full.stops.map((s) => [s.site.id, s]));
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
      if (r.status === "draft")
        await call("POST", `/v1/admin/routes/${id}/unpublish`);
    }
    await refreshRoutes();
  }

  async function run(command: Command): Promise<boolean> {
    const cat = await loadCatalog();
    user = await ensureUser(cat);
    if ("siteId" in command && !cat.sites.some((s) => s.id === command.siteId))
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
      case "route": {
        const desired = !local.route.includes(command.siteId);
        writeLocal({
          ...local,
          route: toggled(local.route, command.siteId, desired),
        });
        return false;
      }
      case "set-route":
        writeLocal({
          ...local,
          route: [...new Set(command.siteIds)].filter((id) =>
            cat.sites.some((s) => s.id === id),
          ),
        });
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
      case "quiz":
        throw new UnsupportedCommandError(
          "quiz",
          "Bulmaca cevabı sunucuda kontrol edilir; bu komut seçilen şıkkı taşımadığı için gönderilemez.",
        );
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
          ? await uploadPhoto(
              photo,
              `${site?.name ?? "Eser"} için paylaşılan fotoğraf`,
              user.role,
            )
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
        return true;
      case "site":
        await updateSite(command.site);
        return false;
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
  const enqueue = <T>(task: () => Promise<T>): Promise<T> => {
    const result = queue.then(task);
    queue = result.catch(() => undefined);
    return result;
  };
  return {
    getSnapshot: () => enqueue(() => build(true)),
    dispatch: (command) =>
      enqueue(async () => {
        const reload = await run(command);
        return build(reload);
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
        return build(true);
      }),
  };
}
