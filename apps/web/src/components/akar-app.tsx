"use client";
import { Avatar, useAvatar } from "./avatar";
import { RouteBuilder, type RouteDraft } from "./route-builder";
import type { PersonalRoute } from "@akar/domain";
import { flushSync } from "react-dom";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  ArrowRight,
  Search,
  MapPin,
  Route,
  Headphones,
  ChevronLeft,
  ChevronUp,
  X,
  Check,
  Users,
  Moon,
  Sun,
} from "lucide-react";
import {
  createHttpClient,
  createMockClient,
  createSeed,
  routes as seedRoutes,
  type AkarClient,
} from "@akar/api-client";
import {
  approvedMemories,
  categoriesOf,
  defaultMapSettings,
  filterSites,
  kindCategory,
  modelFileFor,
  siteCategories,
  type Command,
  type HeritageSite,
  type MapPlacement,
  type MapSettings,
  type CityRecord,
  type Role,
  type SiteBadge,
  type SiteCategory,
  type Snapshot,
} from "@akar/domain";
import { HeritageMap, PEEK_INSET, type MapFlight } from "./heritage-map";
import { AccessMenu } from "./access-menu";
import {
  ExplorePanel,
  MapChips,
  RoutePreview,
  toggleCategory,
  type ExploreTab,
  type PlaceMode,
} from "./explore-panel";
import { SiteDetail } from "./site-detail";
import { SitePeek } from "./site-peek";
import { SourceSheetProvider, WaqfSheet } from "./side-sheet";
import { Cities } from "./city-scenes";
import { OPENING_MAX_MS, OpeningScreen } from "./loading-screens";
import { Scene } from "./scene";
import { HistoryView, type MemoryDraft } from "./history-view";
import { memoryTraces } from "../lib/memory-traces";
import { flushUsageOnHide, setUsageClient, track } from "../lib/usage";
import { useCountOpen } from "../lib/use-count-open";
import { LivingMemory } from "./living-memory";
import { firstOpenTask, SitePuzzle } from "./site-puzzle";
import { STORY_STEP_EVENT, StoryPanel, StoryProgress } from "./story-panel";
import { CompletionCard } from "./completion-card";
import { AboutModal, useWide } from "./about-reading";
import { PHONE_LAYOUT, useMedia } from "../lib/use-media";
import { TipRow, type TipProps } from "./coach-tip";
import type { FlowCompanion } from "../lib/flow-companion";
import { MemoryModal, QuizModal } from "./interaction-modals";
import { Profile, Admin } from "./profile-admin";
import { SignInModal, takeGoogleSignIn } from "./sign-in-modal";
import { Modal, Notice } from "./ui";
import {
  isFieldTask,
  TaskPickBar,
  useSiteProgress,
  type FieldDone,
  type FieldTask,
} from "./site-tasks";
import { describeError, needsSignIn } from "../lib/errors";
import { badgeInLang } from "../lib/task-text";
import { apiUrl, demoContentUrl, getSupabase } from "../lib/supabase";
import { setUploadProgress } from "../lib/upload-progress";
import { locateOnce } from "../lib/locate";
import {
  clampSheet,
  mapSheetStops,
  settleSheet,
  SHEET_TAP_PX,
  SITE_CARD_PEEK,
  siteCardStops,
  toggleSheet,
  type SheetStops,
} from "../lib/bottom-sheet";
import { cityIdentityStyle } from "../lib/city-identity";
import { distanceM, NEAR_CITY_MAX_M, nearestFirst } from "../lib/nearby";
import { cityCase } from "../lib/place-names";
import { deviceLang, LANGS, localize, saveDeviceLang, translate, type Lang } from "../lib/i18n";
import type { MessageKey } from "../lib/messages";
import { readPreference, writePreference } from "../lib/preferences";
import { deviceVoice, saveDeviceVoice, voiceFromAccount, type VoiceChoice, type VoiceGender } from "../lib/story-voice";
import { applyTheme, useTheme } from "../lib/theme";
import { LangProvider, Localized } from "./i18n";
import { VoiceProvider } from "./voice";
import { byDisplayOrder, siteMeta } from "../lib/site-meta";
type View =
  | "map"
  | "sites"
  | "routes"
  | "detail"
  | "story"
  | "profile"
  | "admin"
  | "history"
  | "memories";
type Overlay =
  | "memory"
  | "quiz"
  | "together"
  | "visit"
  | "about"
  | "reset"
  | null;
/** Height the phone's map controls need above the sheet: chips (110), the controls (194) and their margins. */
const CONTROLS_ROOM = 110 + 194 + 32;
/** The height of a story's photograph on a phone (design.css `.story-photo-card`: 30% of the screen, the stage's foot). */
const storyPhotoPhoneHeight = () => (typeof window === "undefined" ? 0 : Math.round(window.innerHeight * 0.3));
/** A sheet left between its stops this long, untouched, goes to the nearest one. */
const SHEET_IDLE_MS = 1800;
/** Pulled this far below its closed height, the site's card goes back to the map. */
const CARD_CLOSE_PULL = 70;
/** How far a scroll on the closed site card raises it: enough for its content to scroll. */
const CARD_SCROLL_RISE = 150;
/** The catalog is read again this often, and whenever the tab comes back to the front. */
const CATALOG_REFRESH_MS = 5 * 60_000;
export function AkarApp() {
  const [state, setState] = useState<Snapshot>(createSeed),
    [ready, setReady] = useState(false),
    [snapshotRevision, setSnapshotRevision] = useState(0),
    [experimental, setExperimental] = useState(false),
    [view, setView] = useState<View>("map"),
    [siteId, setSiteId] = useState("ulu-cami"),
    [query, setQuery] = useState(""),
    [roles, setRoles] = useState<Set<SiteCategory>>(
      () => new Set(siteCategories),
    ),
    [tab, setTab] = useState<ExploreTab>("sites"),
    [place, setPlace] = useState<PlaceMode>("home"),
    [nearPoint, setNearPoint] = useState<[number, number] | null>(null),
    [peekId, setPeekId] = useState<string>(),
    [hoverId, setHoverId] = useState<string>(),
    [cityInView, setCityInView] = useState<CityRecord | null>(null),
    [flight, setFlight] = useState<MapFlight>(),
    [lang, setLang] = useState<Lang>("tr"),
    [voice, setVoice] = useState<VoiceChoice>({ lang: null, gender: null }),
    [completion, setCompletion] = useState<{ earned: SiteBadge[] } | null>(null),
    [waqf, setWaqf] = useState(false),
    [sheetHeight, setSheetHeight] = useState(0),
    [sheetDragging, setSheetDragging] = useState(false),
    theme = useTheme(),
    [routeId, setRouteId] = useState<string>(),
    [collapsed, setCollapsed] = useState(false),
    [overlay, setOverlay] = useState<Overlay>(null),
    // See the Past opened from another site's «Uzaktan görünüyor» row starts at that photograph.
    [historyStart, setHistoryStart] = useState(0),
    // İz Bırak opened from the camera starts with the shot and its «same angle» label.
    [memoryDraft, setMemoryDraft] = useState<MemoryDraft | null>(null),
    [storyIndex, setStoryIndex] = useState(0),
    [listening, setListening] = useState(false),
    [toast, setToast] = useState(""),
    [fault, setFault] = useState(""),
    [loadError, setLoadError] = useState(""),
    [account, setAccount] = useState<{ id: string; email: string } | null>(
      null,
    ),
    // `null` = closed; the string says why the dialog opened ("" = user asked).
    [signIn, setSignIn] = useState<string | null>(null);
  const [routeDraft, setRouteDraft] = useState<RouteDraft | null>(null);
  const [personalRoutes, setPersonalRoutes] = useState<PersonalRoute[]>([]);
  const [routeBusy, setRouteBusy] = useState(false);
  const [routeSite, setRouteSite] = useState<string>();
  useEffect(() => {
    if (!ready || tab !== "routes") return;
    let active = true;
    void client.current?.getPersonalRoutes().then((routes) => { if (active) setPersonalRoutes(routes); }).catch(() => {});
    return () => { active = false; };
  }, [ready, tab, account]);
  const [puzzle, setPuzzle] = useState<{ start: number; found?: FieldDone } | null>(null);
  const [pick, setPick] = useState<{ task: FieldTask; hint: string } | null>(
    null,
  );
  const [mapSettings, setMapSettings] =
    useState<MapSettings>(defaultMapSettings);
  const [cityRecords, setCityRecords] = useState<CityRecord[]>([]);
  // The opening screen (§11.49) stays until the map is first drawn; `mapDrawn` says so, `openingLate` gives up waiting.
  const [opening, setOpening] = useState(true),
    [mapDrawn, setMapDrawn] = useState(false),
    [openingLate, setOpeningLate] = useState(false);
  const wide = useWide();
  const [avatarFigure] = useAvatar();
  // The bottom sheet and the floating site card follow the CSS's phone layout (900 px), not `wide` (1000 px).
  const phone = useMedia(PHONE_LAYOUT);
  const client = useRef<AkarClient | null>(null),
    loaded = useRef(false),
    consent = useRef<{ textVersion: string } | null>(null),
    accountId = useRef<string | null | undefined>(undefined);
  const pickBusy = useRef<typeof pick>(null);
  const currentPick = useRef(pick);
  currentPick.current = pick;
  const langRef = useRef(lang);
  langRef.current = lang;
  // Stable, so callbacks and effects can speak the current language without depending on it.
  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) =>
      translate(langRef.current, key, vars),
    [],
  );
  const text = (tr: string, en?: string | null) => localize(lang, tr, en).text;
  // Content without an English twin stays Turkish and says so.
  const tr = lang === "en" ? "tr" : undefined;
  const live = !!apiUrl;
  const role: Role = state.role ?? (live ? "user" : "admin");
  const canManage = !live || (!!account && role !== "user");
  const showExperimental = !live && experimental;
  /** A guest plays the tasks freely, but nothing is stored and no badge is earned; the demo has no sign-in. */
  const guestPlayer = live && !account;
  const { progress, refresh: refreshProgress } = useSiteProgress(
    client,
    ready,
    account?.id ?? null,
    snapshotRevision,
  );
  /**
   * Map settings and city records (§11.42, §11.45) are a refinement: when one cannot be read the map
   * opens at the demo region and the viewer keeps the values it has.
   */
  const loadMapSettings = useCallback(async () => {
    const c = client.current;
    if (!c) return;
    await Promise.all([
      c.getMapSettings().then(setMapSettings, () => {}),
      c.getCities().then(setCityRecords, () => {}),
    ]);
  }, []);
  const load = useCallback(async () => {
    if (!client.current) return;
    if (!loaded.current) setLoadError("");
    try {
      const snapshot = await client.current.getSnapshot();
      setState(snapshot);
      // Signed in (§11.57): the account's language wins; an account without one takes this device's.
      const account = snapshot.preferences;
      if (account?.siteLang) {
        setLang(account.siteLang);
        saveDeviceLang(account.siteLang);
      } else if (account)
        void client.current.savePreferences({ siteLang: langRef.current }).catch(() => {});
      // The same for the story voice: the account's choice wins, a key it has not chosen keeps this device's.
      if (account) {
        const merged = voiceFromAccount(account, deviceVoice());
        setVoice(merged);
        saveDeviceVoice(merged);
      }
      // Signing in may redeem guest story receipts while loading the snapshot. Read badges again
      // afterwards, so an earlier auth-event read cannot hide the newly transferred story badge.
      setSnapshotRevision((revision) => revision + 1);
      loaded.current = true;
      setReady(true);
      void loadMapSettings();
    } catch (e) {
      const message = describeError(e, t("error.dataFailed"), langRef.current);
      if (loaded.current) setFault(message);
      else setLoadError(message);
    }
  }, [loadMapSettings, t]);
  /** Background re-read of the catalog (new, moved or removed models); a failure is not worth a message. */
  const refreshCatalog = useCallback(async () => {
    if (!client.current || !loaded.current) return;
    try {
      const [snapshot] = await Promise.all([
        client.current.refreshCatalog(),
        loadMapSettings(),
      ]);
      setState(snapshot);
    } catch {}
  }, [loadMapSettings]);
  useEffect(() => {
    let storage: Storage | undefined;
    try {
      storage = window.localStorage;
    } catch {}
    const supabase = apiUrl ? getSupabase() : null;
    client.current = apiUrl
      ? createHttpClient({
          baseUrl: apiUrl,
          ...(storage && { storage }),
          getToken: async () =>
            (await supabase?.auth.getSession())?.data.session?.access_token ??
            null,
          onUnauthorized: () => {
            void supabase?.auth.signOut({ scope: "local" });
            setToast(t("toast.sessionExpired"));
          },
          getMemoryConsent: () => consent.current,
          onUploadProgress: setUploadProgress,
          locate: () =>
            locateOnce({
              unsupported: t("verify.unsupported"),
              denied: t("verify.denied"),
              timeout: t("verify.timeout"),
              failed: t("verify.failed"),
            }),
        })
      : createMockClient(storage, demoContentUrl);
    setUsageClient(client.current);
    const stopUsageFlush = flushUsageOnHide();
    void load();
    // The opening screen names the default city and draws its pattern: its record is read beside the catalog, not after it.
    void client.current.getCities().then(setCityRecords, () => {});
    // The first event only reports the stored session; later changes (sign-in,
    // sign-out, rejected token) re-read the state for the new identity.
    const subscription = supabase?.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setAccount(user ? { id: user.id, email: user.email ?? "" } : null);
      const previous = accountId.current;
      accountId.current = user?.id ?? null;
      if (previous !== undefined && previous !== accountId.current) {
        setState((current) => ({ ...current, role: "user" }));
        setTimeout(() => void load(), 0);
      }
    }).data.subscription;
    const readLocation = () => {
      setPuzzle(null);
      setPick(null);
      setPeekId(undefined);
      const p = new URLSearchParams(location.hash.slice(1));
      const v = p.get("view");
      if (
        v &&
        [
          "map",
          "sites",
          "routes",
          "detail",
          "story",
          "profile",
          "admin",
          "history",
          "memories",
        ].includes(v)
      )
        setView(v as View);
      else setView("map");
      if (p.get("site")) setSiteId(p.get("site")!);
    };
    readLocation();
    // Back to the bare address (the browser's back from the map to the introduction): the introduction is another
    // page, so load it (layout INTRO_BOOT), as the introduction reloads into the app on a link to a view.
    const followHash = () => {
      if (location.pathname === "/" && !/(^|[#&])view=/.test(location.hash)) location.reload();
      else readLocation();
    };
    window.addEventListener("hashchange", followHash);
    return () => {
      window.removeEventListener("hashchange", followHash);
      subscription?.unsubscribe();
      stopUsageFlush();
    };
  }, [load, t]);
  // Once per page load; the client effect above re-runs on a language change.
  useEffect(() => track("app.open"), []);
  useEffect(() => {
    if (!ready) return;
    const timer = setInterval(() => void refreshCatalog(), CATALOG_REFRESH_MS);
    const refocus = () => {
      if (document.visibilityState === "visible") void refreshCatalog();
    };
    document.addEventListener("visibilitychange", refocus);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refocus);
    };
  }, [ready, refreshCatalog]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  // A map that never draws must not hold the opening screen for ever.
  useEffect(() => {
    const t = setTimeout(() => setOpeningLate(true), OPENING_MAX_MS);
    return () => clearTimeout(t);
  }, []);
  const go = useCallback((next: View, id?: string) => {
    setView(next);
    setHistoryStart(0);
    setCollapsed(false);
    if (id) setSiteId(id);
    setPeekId(undefined);
    setOverlay(null);
    setPuzzle(null);
    setPick(null);
    const p = new URLSearchParams({ view: next });
    if (id) p.set("site", id);
    window.location.hash = p.toString();
  }, []);
  /** Runs a command; resolves to the error message, or `null` on success. */
  const run = useCallback(async (command: Command) => {
    try {
      if (!client.current) return t("error.unavailable");
      setState(await client.current.dispatch(command));
      return null;
    } catch (e) {
      const message = describeError(e, t("error.failed"), langRef.current);
      if (needsSignIn(e)) setSignIn(message);
      else setFault(message);
      return message;
    }
  }, [t]);
  const commit = useCallback(
    async (command: Command) => (await run(command)) === null,
    [run],
  );
  /** A finished task: the badges it earned are announced and the progress is read again. */
  const taskFinished = useCallback(
    (badges: SiteBadge[]) => {
      if (badges.length)
        setToast(
          t("toast.newBadge", { titles: badges.map((b) => badgeInLang(b, langRef.current).badge.title).join(", ") }),
        );
      void refreshProgress();
    },
    [refreshProgress, t],
  );
  const closeOverlay = useCallback(() => setOverlay(null), []);
  const signInForBadges = () => setSignIn(t("toast.badgesSignIn"));
  /** The tap of pick mode: the part goes to the server; a wrong one keeps the model waiting. */
  async function pickPart(part: string) {
    const current = pick;
    if (!current || pickBusy.current === current || !client.current) return;
    const identity = accountId.current;
    const stillCurrent = () =>
      currentPick.current === current && accountId.current === identity;
    pickBusy.current = current;
    try {
      const result = await client.current.completeSiteTask(current.task.id, {
        mode: "fromHome",
        part,
      });
      if (!stillCurrent()) return;
      if (result.done) {
        setPick(null);
        setPuzzle({
          start: Math.max(0, (site?.tasks ?? []).findIndex((x) => x.id === current.task.id)),
          found: result,
        });
        if (site && !progress.tasks.some((p) => p.taskId === current.task.id)) track("task.complete", site.id, current.task.id);
        taskFinished(result.earnedBadges);
      } else
        setPick({
          ...current,
          hint: t("toast.wrongPart"),
        });
    } catch (e) {
      if (stillCurrent())
        setPick({
          ...current,
          hint: describeError(e, t("error.taskFailed"), langRef.current),
        });
    } finally {
      if (pickBusy.current === current) pickBusy.current = null;
    }
  }
  const loadPlacement = useCallback<AkarClient["getMapPlacement"]>(
    async (siteId) => {
      if (!client.current) throw new Error("İşlem şu an yapılamıyor.");
      return client.current.getMapPlacement(siteId);
    },
    [],
  );
  // Not through `run`: the editor shows the error next to the values it refused.
  const savePlacement = useCallback(
    async (siteId: string, placement: MapPlacement) => {
      if (!client.current) throw new Error("İşlem şu an yapılamıyor.");
      setState(
        await client.current.dispatch({
          type: "map-placement",
          siteId,
          placement,
        }),
      );
    },
    [],
  );
  const saveSite = useCallback(async (site: HeritageSite) => {
    if (!client.current) throw new Error("İşlem şu an yapılamıyor.");
    const result = await client.current.saveSite(site);
    setState(result.snapshot);
    return result.site;
  }, []);
  // The new snapshot makes the site list and the editor's site agree; the editor shows the returned site.
  const narrateSite = useCallback<AkarClient["narrateSite"]>(
    async (siteId, target) => {
      if (!client.current) throw new Error("İşlem şu an yapılamıyor.");
      const run = await client.current.narrateSite(siteId, target);
      setState(run.snapshot);
      return run;
    },
    [],
  );
  const translateSite = useCallback<AkarClient["translateSite"]>(
    async (siteId, target) => {
      if (!client.current) throw new Error("İşlem şu an yapılamıyor.");
      const run = await client.current.translateSite(siteId, target);
      setState(run.snapshot);
      return run;
    },
    [],
  );
  const loadModeration = useCallback<AkarClient["getModerationPage"]>(
    async (status, cursor) => {
      if (!client.current) throw new Error("İşlem şu an yapılamıyor.");
      return client.current.getModerationPage(status, cursor);
    },
    [],
  );
  const loadMembers = useCallback<AkarClient["getMembers"]>(
    async (query, page) => {
      if (!client.current) throw new Error("İşlem şu an yapılamıyor.");
      return client.current.getMembers(query, page);
    },
    [],
  );
  const changeMemberRole = useCallback<AkarClient["setMemberRole"]>(
    async (userId, role, expectedRole) => {
      if (!client.current) throw new Error("İşlem şu an yapılamıyor.");
      return client.current.setMemberRole(userId, role, expectedRole);
    },
    [],
  );
  const loadHealth = useCallback(async () => {
    if (!client.current) throw new Error("İşlem şu an yapılamıyor.");
    return client.current.getAdminHealth();
  }, []);
  const loadStats = useCallback<AkarClient["getUsageStats"]>(async (range) => {
    if (!client.current) throw new Error("İşlem şu an yapılamıyor.");
    return client.current.getUsageStats(range);
  }, []);
  const loadSiteStats = useCallback<AkarClient["getSiteUsageStats"]>(
    async (siteId, range) => {
      if (!client.current) throw new Error("İşlem şu an yapılamıyor.");
      return client.current.getSiteUsageStats(siteId, range);
    },
    [],
  );
  /** Admin panel: the saved values become this tab's map settings at once. */
  const saveMapSettings = useCallback(async (next: MapSettings) => {
    if (!client.current) throw new Error("İşlem şu an yapılamıyor.");
    const saved = await client.current.setMapSettings(next);
    setMapSettings(saved);
    return saved;
  }, []);
  const signOut = () => {
    void getSupabase()?.auth.signOut();
    setToast(t("toast.signedOut"));
  };
  const site = state.sites.find(
    (s) => s.id === siteId && s.status === "published",
  );
  const memoryCount = site ? approvedMemories(state, site.id).length : 0;
  // The site's gallery ends with its visitors' photographs (Yaşayan hafıza), as the prototype's.
  const visitorPhotos = site
    ? memoryTraces({
        sample: site.sampleTraces ?? [],
        own: state.memories.filter((m) => m.siteId === site.id),
        approved: approvedMemories(state, site.id),
      }).flatMap((trace) =>
        trace.photo
          ? [{ id: trace.id, src: trace.photo, alt: trace.alt || t("memories.photoAlt"), author: trace.author, state: trace.state }]
          : [],
      )
    : [];
  // Back from a site's page to the map, by any way (its back button, the browser's, a link): the map shows that site,
  // wherever the map was before (a site of Hatay opened from the list must not come back to Bursa).
  const lastView = useRef(view);
  useEffect(() => {
    const from = lastView.current;
    lastView.current = view;
    if (view !== "map" || !["detail", "history", "memories"].includes(from) || !site) return;
    setFlight((f) => ({ key: (f?.key ?? 0) + 1, to: "site", point: site.coordinates }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);
  // «Yalnız rotada» sentences lead to the next stop: they are read only on a route.
  const storySite = useMemo(() => {
    if (!site) return undefined;
    const stories = site.stories.filter((s) => !s.routeOnly || !!routeId);
    return stories.length ? { ...site, stories } : undefined;
  }, [site, routeId]);
  const storyBlock = view === "story" ? storySite?.stories[storyIndex] : undefined;
  // A sentence about the income road: the other building of the road comes beside the site in its own scene
  // (its model in the page's theme, else its cover photograph; a place outside the catalogue by its name alone).
  const flowCompanion = useMemo((): FlowCompanion | undefined => {
    const road = storyBlock?.flow;
    if (!road || !site) return undefined;
    const otherId = road.fromSiteId === site.id ? road.toSiteId : road.fromSiteId;
    const other = state.sites.find((s) => s.id === otherId);
    const cover = other && ([...(other.storyPhotos ?? []), ...(other.photos ?? [])].find((p) => p.id === other.coverPhotoId) ?? other.photos?.[0]);
    const name = other?.name ?? road.toName;
    return {
      ...(other?.model && { src: modelFileFor(other.model, theme).src }),
      ...(cover && { photo: cover.src }),
      name,
      label: road.label || name,
      incoming: road.fromSiteId !== site.id,
    };
  }, [storyBlock, site, state.sites, theme]);
  const filtered = useMemo(
    () =>
      filterSites(state.sites, query).filter((s) =>
        roles.has(kindCategory[s.kind]),
      ),
    [state.sites, query, roles],
  );
  const published = useMemo(
    () => state.sites.filter((s) => s.status === "published"),
    [state.sites],
  );
  const routes = (state.catalogRoutes ?? (live ? [] : seedRoutes)).filter(
    (r) => r.status !== "draft",
  );
  const cities = [...new Set(published.map((s) => s.city))];
  const defaultCity = cityRecords.find((c) => c.isDefault);
  const activeCity = cityInView ?? defaultCity ?? null;
  // Zoomed out to the country the map looks at no one city: the button and the list say so.
  const [wholeCountry, setWholeCountry] = useState(false);
  const cityName = wholeCountry ? t("map.country") : (activeCity?.name ?? cities[0] ?? "Bursa");
  // The list shows the city the map looks at; a search reaches every city.
  const listed = useMemo(() => {
    const here = query
      ? filtered
      : wholeCountry
        ? filtered
        : filtered.filter((s) => !s.city || s.city === cityName);
    return nearPoint ? nearestFirst(here, nearPoint) : byDisplayOrder(here);
  }, [filtered, query, cityName, nearPoint, wholeCountry]);
  const chipCategories = useMemo(() => categoriesOf(published), [published]);
  // The same list before the kind is chosen: what the kind filter counts.
  const beforeKind = useMemo(() => {
    const all = filterSites(state.sites, query);
    return query || wholeCountry ? all : all.filter((s) => !s.city || s.city === cityName);
  }, [state.sites, query, cityName, wholeCountry]);
  const listCategories = useMemo(() => categoriesOf(beforeKind), [beforeKind]);
  const activeCategory = roles.size === 1 ? [...roles][0]! : null;
  const peekSite = published.find((s) => s.id === peekId);
  // Usage counts (§11.72), once per opening. A site counts when its card or one of its pages (detail, story, history,
  // memories) comes up, and again only after it was left; the page of the same site after its card is not a second view.
  useCountOpen(
    !ready ? undefined : ["detail", "story", "history", "memories"].includes(view) ? site?.id : view === "map" ? peekSite?.id : undefined,
    (id) => track("site.view", id),
  );
  useCountOpen(ready && view === "history" ? site?.id : undefined, (id) => track("history.open", id));
  useCountOpen(ready && overlay === "about" ? site?.id : undefined, (id) => track("about.open", id));
  // The search filters as it is typed: a query of 2+ characters that stays a second counts once.
  useEffect(() => {
    if (query.trim().length < 2) return;
    const settled = setTimeout(() => track("search"), 1000);
    return () => clearTimeout(settled);
  }, [query]);
  // Google sends the page away and back: the sign-in is counted when the session arrives and the visitor had just left for Google.
  const accountKey = account?.id;
  useEffect(() => {
    if (accountKey && takeGoogleSignIn()) track("account.sign_in", undefined, "returning");
  }, [accountKey]);
  // A page of a site (its detail, story, «Geçmişi Gör», «Yaşayan hafıza») belongs to the site's city: the chip's
  // name, colour and emblem are that city's, whatever city the map was last left in.
  const pageCity = ["detail", "story", "history", "memories"].includes(view) ? site?.city : undefined;
  const lookCity =
    cityRecords.find((c) => c.name === pageCity) ?? activeCity;
  const cityLook = cityIdentityStyle(lookCity?.identity ?? null);
  const route = routes.find((r) => r.id === routeId);
  const routeSites = (
    routeId === "custom" ? state.routeIds : (route?.siteIds ?? [])
  )
    .map((id) => published.find((s) => s.id === id))
    .filter((s): s is HeritageSite => !!s);
  const nextStop = routeId
    ? routeSites[routeSites.findIndex((s) => s.id === siteId) + 1]
    : undefined;
  const isDetail = ["detail", "story"].includes(view),
    showMap = !["profile", "admin", "history", "memories"].includes(view),
    showRoutes = tab === "routes" && !query;
  // Back to the map from a site (or the profile, the panel…): the map is built anew, and until its first view has
  // come in its buildings and models stand flat or missing. The opening screen covers that, as at the start.
  const onMapView = showMap && !isDetail;
  const [mapReturn, setMapReturn] = useState(false),
    [mapSettled, setMapSettled] = useState(false),
    [returnLate, setReturnLate] = useState(false);
  const wasOnMap = useRef(showMap);
  const stageTap = useRef<{ x: number; y: number; at: number } | null>(null);
  // Geçmişi Gör, part by part (3 Nov 2026): the old photograph, the comparison, «Bugününü sen çek», the strip,
  // «Nereden çekildi?». A part not on this page (no comparison here) comes another time.
  // Each screen's own list: the wide screen has no «take today's» (the phone's camera), so it never hears of it.
  const historyTips = (touch: boolean): TipProps[] => [
    { id: `${touch ? "" : "masa."}g.foto`, text: t(touch ? "tip.histPhoto" : "tip.histPhotoWide"), place: "under-spot", gesture: touch ? "tap-sides" : "click", spot: ".gg-foto" },
    { id: `${touch ? "" : "masa."}g.kiyas`, text: t("tip.histCompare"), place: "under-spot", gesture: "turn", spot: ".gg-foto.esli", needs: ".gg-foto.esli .gg-k-tutamak", pressSpot: true, swallow: true },
    ...(touch ? [{ id: "g.bugun", text: t("tip.histToday"), place: "under-spot", gesture: "tap", spot: ".gg-bugun", needs: ".gg-bugun", pressSpot: true, swallow: true } as const] : []),
    { id: `${touch ? "" : "masa."}g.serit`, text: t("tip.histStrip"), place: "under-spot", gesture: touch ? "tap" : "click", spot: ".gg-serit", needs: ".gg-serit", pressSpot: true, swallow: true },
    { id: `${touch ? "" : "masa."}g.nereden`, text: t("tip.histWhere"), place: "under-spot", gesture: touch ? "tap" : "click", spot: ".gg-nereye", needs: ".gg-nereye", pressSpot: true, swallow: true },
  ];
  const storyModel = view === "story" && !!storySite?.model && readPreference("akar.gorunum") !== "photo";
  // While the story's first-time hints are still to be seen, it waits to speak.
  // The row is over (each hint seen, or passed over for now): the story speaks.
  const [storyTipsOver, setStoryTipsOver] = useState(false);
  useEffect(() => {
    if (view !== "story") setStoryTipsOver(false);
  }, [view]);
  const storyHold =
    view === "story" &&
    !storyTipsOver &&
    (phone ? ["hikaye", storyModel ? "cevir" : "yakinlas"] : ["masa.hikaye", ...(storyModel ? ["masa.cevir"] : [])]).some(
      (id) => !readPreference(`akar.ipucu.${id}`),
    );
  useEffect(() => {
    // Back from a site the map was kept (`map-keep`): only a map built anew needs the cover.
    const back = showMap && onMapView && !wasOnMap.current && !opening;
    wasOnMap.current = showMap;
    if (!back) return;
    setMapReturn(true);
    setMapSettled(false);
    setReturnLate(false);
    const timer = setTimeout(() => setReturnLate(true), OPENING_MAX_MS);
    return () => clearTimeout(timer);
  }, [showMap, onMapView, opening]);
  // The opening screen goes once the map is drawn; with no map to wait for (a site, the profile, the panel) or no data
  // to wait for, as soon as the page can show something.
  const openingDone =
    mapDrawn ||
    openingLate ||
    !!loadError ||
    (ready && !(showMap && !isDetail));
  // A link straight to a site of another city opens on that city, not on the default one.
  const openingCity = cityRecords.find((c) => c.name === pageCity) ?? cityRecords.find((c) => c.isDefault);
  /**
   * On a phone the sheet and the short card are one surface (prototype `yuzeyGecis`): when one gives way to the other
   * it turns into it. A card that stays open for another site changes in place.
   */
  function changePeek(id: string | undefined) {
    const update = () => setPeekId(id);
    if (wide || !peekId === !id || matchMedia("(prefers-reduced-motion: reduce)").matches || !document.startViewTransition)
      return update();
    const root = document.documentElement;
    root.classList.add("vt-yuzey");
    const turn = document.startViewTransition(() => flushSync(update));
    turn.ready.catch(() => {});
    turn.updateCallbackDone.catch(() => {});
    void turn.finished.catch(() => {}).finally(() => root.classList.remove("vt-yuzey"));
  }
  /** A pick on the map or in the list: the map goes there and the short card opens. */
  function pickSite(id: string) {
    changePeek(id);
  }
  function selectSite(id: string) {
    setStoryIndex(0);
    go("detail", id);
  }
  function closeRoute() {
    setRouteId(undefined);
    if (state.routeIds.length) void commit({ type: "set-route", siteIds: [] });
  }
  function openStory(listen = false, index?: number, id = siteId) {
    // Whoever has started a story needs no hint to start one.
    writePreference("akar.ipucu.masa.detay", "1");
    const kept = Number(readPreference(`akar.ilerleme.${id}`));
    setStoryIndex(index ?? (Number.isInteger(kept) ? kept : 0));
    setListening(listen);
    go("story", id);
  }
  function chooseHome(fly = true) {
    setPlace("home");
    setNearPoint(null);
    writePreference("akar.konum", "home");
    if (fly) setFlight((f) => ({ key: (f?.key ?? 0) + 1, to: "home" }));
  }
  /** The position is used here and only here: it never leaves the device. */
  function chooseNear() {
    const centre = (activeCity ?? defaultCity)?.map?.center;
    void locateOnce({
      unsupported: t("locate.unsupportedHome"),
      denied: t("locate.deniedHome", { city: cityName }),
      timeout: t("locate.failedHome", { city: cityName }),
      failed: t("locate.failedHome", { city: cityName }),
    }).then(
      ({ coordinates: point }) => {
        if (centre && distanceM(centre, point) > NEAR_CITY_MAX_M) {
          setToast(
            t("locate.outside", { city: cityName }),
          );
          chooseHome();
          return;
        }
        setPlace("near");
        setNearPoint(point);
        writePreference("akar.konum", "near");
        setFlight((f) => ({ key: (f?.key ?? 0) + 1, to: "point", point }));
      },
      (e) => {
        setToast(describeError(e, t("locate.failedShort"), lang));
        chooseHome(false);
      },
    );
  }
  function changeLanguage(next: Lang) {
    setLang(next);
    saveDeviceLang(next);
    if (state.preferences)
      void client.current?.savePreferences({ siteLang: next }).catch(() => {});
    if (next === "en" && published.some((s) => !s.nameEn))
      setToast(translate(next, "lang.fallbackNotice"));
  }
  /** The visitor's voice for the story player: kept on this device, and on the account when signed in. */
  function changeVoice(choice: { lang?: Lang; gender?: VoiceGender }) {
    const next = { ...voice, ...choice };
    setVoice(next);
    saveDeviceVoice(next);
    if (state.preferences)
      void client.current
        ?.savePreferences({
          ...(choice.lang && { voiceLang: choice.lang }),
          ...(choice.gender && { voiceGender: choice.gender }),
        })
        .catch(() => {});
  }
  async function openRouteBuilder(siteId?: string) {
    try {
      const routes = await client.current!.getPersonalRoutes();
      setPersonalRoutes(routes);
      setRouteSite(siteId);
      const target = siteId ? routes.find((route) => route.isDefault) : undefined;
      setRouteDraft({ id: target?.id ?? "", name: target?.name ?? t("route.new"), siteIds: target ? [...new Set([...target.siteIds, siteId!])] : siteId ? [siteId] : [] });
      setRouteId(undefined);
      setTab("sites");
      changePeek(undefined);
    } catch { setToast(t("route.failed")); }
  }
  async function saveRouteDraft() {
    if (!routeDraft || routeBusy) return;
    setRouteBusy(true);
    try {
      const api = client.current!;
      let route = routeDraft.id ? personalRoutes.find((route) => route.id === routeDraft.id)! : await api.createPersonalRoute(routeDraft.name);
      setRouteDraft({ ...routeDraft, id: route.id });
      setPersonalRoutes((routes) => [...routes.filter((item) => item.id !== route.id), route]);
      const before = new Set(route.siteIds);
      if (route.name !== routeDraft.name.trim()) route = await api.renamePersonalRoute(route.id, routeDraft.name);
      if (route.isDefault) {
        if (!await commit({ type: "set-route", siteIds: routeDraft.siteIds })) return;
      } else await api.setPersonalRouteStops(route.id, routeDraft.siteIds);
      setPersonalRoutes(await api.getPersonalRoutes());
      setState(await api.getSnapshot());
      for (const id of routeDraft.siteIds) if (!before.has(id)) track("my_route.add", id);
      setRouteDraft(null);
      setToast(t("route.saved"));
    } catch { setToast(t("route.failed")); }
    finally { setRouteBusy(false); }
  }
  async function deleteRouteDraft() {
    if (!routeDraft?.id || routeBusy) return;
    setRouteBusy(true);
    try {
      await client.current!.deletePersonalRoute(routeDraft.id);
      setPersonalRoutes(await client.current!.getPersonalRoutes());
      setState(await client.current!.getSnapshot());
      setRouteDraft(null);
    } catch { setToast(t("route.failed")); }
    finally { setRouteBusy(false); }
  }
  async function toggleRoute(id: string) {
    if (routeDraft) {
      if (!routeBusy) setRouteDraft({ ...routeDraft, siteIds: routeDraft.siteIds.includes(id) ? routeDraft.siteIds.filter((item) => item !== id) : [...routeDraft.siteIds, id].slice(0, 100) });
      return;
    }
    const target = published.find((s) => s.id === id);
    const name = target
      ? text(target.name, target.nameEn)
      : t("profile.siteFallback");
    const inRoute = state.routeIds.includes(id);
    if (await commit({ type: "route", siteId: id })) {
      if (!inRoute) track("my_route.add", id);
      setToast(t(inRoute ? "toast.routeRemoved" : "toast.routeAdded", { name }));
    }
  }
  function togglePanel() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      sessionStorage.setItem("akar-panel", String(next));
    } catch {}
  }
  useEffect(() => {
    try {
      setCollapsed(sessionStorage.getItem("akar-panel") === "true");
    } catch {}
    setLang(deviceLang());
    setVoice(deviceVoice());
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  // A route's page shows the whole route on the map.
  const routeStops = routeSites.map((s) => s.id).join();
  useEffect(() => {
    if (routeId && routeSites.length)
      setFlight((f) => ({
        key: (f?.key ?? 0) + 1,
        to: "route",
        points: routeSites.map((s) => s.coordinates),
      }));
  }, [routeId, routeStops]);
  useEffect(() => {
    if (view === "routes" || view === "sites")
      setTab(view === "routes" ? "routes" : "sites");
  }, [view]);
  // The sheet's lowest stop shows the handle, the tabs and the heading line.
  const sheet = useRef<HTMLElement>(null),
    sheetDrag = useRef<{
      y: number;
      height: number;
      handle: boolean;
      /** The last two moves, for the speed at the end (a flick). */
      lastY?: number;
      lastAt?: number;
      speed?: number;
      /** The height followed by the finger, written straight to the page (no render per move). */
      live?: number;
      frame?: number;
      moved: boolean;
    } | null>(null);
  const sheetLowest = () => {
    const head = sheet.current?.querySelector<HTMLElement>(".explore-heading");
    return head?.offsetHeight
      ? Math.round(
          head.getBoundingClientRect().bottom -
            sheet.current!.getBoundingClientRect().top +
            8,
        )
      : 128;
  };
  /**
   * A site's card on a phone (prototype `#eser-alt`, the `mobile/` screenshots): a floating card. Closed, it shows
   * the name, «Kısa hikâye» and Dinle | Oku, and 44 px of what follows, fading out; it opens to all its content, at
   * most 75 % of the screen. The same drag as the map's sheet moves it.
   */
  const siteCard = view === "detail" && phone;
  const cardLowest = () => {
    const panel = sheet.current;
    // Dinle | Oku closes the top part; a site without a story ends it with its notice.
    // A phone's card closes right under «Hikâyeyi başlat», nothing half shown below it (3 Nov 2026).
    const start = panel?.querySelector<HTMLElement>(".detail-panel .hikaye-basla");
    if (panel && start && start.offsetParent) {
      const bottomPad = parseFloat(getComputedStyle(panel).paddingBottom) || 0;
      return Math.round(start.getBoundingClientRect().bottom - panel.getBoundingClientRect().top + panel.scrollTop + bottomPad + 14);
    }
    const top =
      panel?.querySelector<HTMLElement>(".detail-panel .ikili") ??
      panel?.querySelector<HTMLElement>(".detail-panel .hikaye-blok > :first-child");
    if (!panel || !top) return 194;
    const bottomPad = parseFloat(getComputedStyle(panel).paddingBottom) || 0;
    return Math.round(top.getBoundingClientRect().bottom - panel.getBoundingClientRect().top + panel.scrollTop + bottomPad + SITE_CARD_PEEK);
  };
  const cardContent = () => {
    const panel = sheet.current;
    const body = panel?.querySelector<HTMLElement>(".detail-panel");
    if (!panel || !body) return 0;
    return body.offsetTop + body.scrollHeight + (parseFloat(getComputedStyle(panel).paddingBottom) || 0);
  };
  const sheetStops = (): SheetStops =>
    siteCard
      ? siteCardStops(cardLowest(), cardContent(), innerHeight)
      : mapSheetStops(sheetLowest(), innerHeight);
  // The card's top part, measured once laid out: the model is framed above it, and it is where the card closes.
  const [cardClosed, setCardClosed] = useState(0);
  const cardClosedRef = useRef(0);
  cardClosedRef.current = cardClosed;
  // Fully open, the card shows its end and fades no more. Measured when the card's height changes, not on every
  // render: reading layout while rendering forced the browser to lay the page out again each time.
  const [cardFull, setCardFull] = useState(false);
  useEffect(() => {
    if (!siteCard || !sheet.current) return setCardFull(false);
    setCardFull(sheetHeight >= siteCardStops(cardClosed, cardContent(), innerHeight).highest - 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteCard, sheetHeight, cardClosed]);
  useEffect(() => {
    if (!ready || wide) return;
    if (!siteCard) {
      if (!isDetail) setSheetHeight(sheetLowest());
      return;
    }
    const frame = requestAnimationFrame(() => {
      const lowest = cardLowest();
      setCardClosed(lowest);
      setSheetHeight(lowest);
      sheet.current?.scrollTo({ top: 0 });
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isDetail, siteCard, wide, siteId]);
  // The card's lower edge: its content fades out there (prototype `eaSis`, `--g`), not under a white cover.
  const fadeCard = useCallback(() => {
    const panel = sheet.current;
    const body = panel?.querySelector<HTMLElement>(".detail-panel");
    if (!panel || !body) return;
    const visible = panel.clientHeight + panel.scrollTop - body.offsetTop - (parseFloat(getComputedStyle(panel).paddingBottom) || 0);
    body.style.setProperty("--g", `${Math.round(visible)}px`);
  }, []);
  useEffect(() => {
    if (!siteCard) return;
    // The height moves over 280 ms: follow it.
    const start = performance.now();
    let frame = requestAnimationFrame(function step() {
      fadeCard();
      if (performance.now() - start < 340) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [sheetHeight, siteCard, fadeCard]);
  // Fonts and photographs arrive after the first measure and move the content: the fading edge and the closed
  // height follow (the fade sometimes sat above the card's foot until the card was touched).
  useEffect(() => {
    const panel = sheet.current,
      body = panel?.querySelector<HTMLElement>(".detail-panel");
    if (!siteCard || !panel || !body) return;
    const observer = new ResizeObserver(() => {
      fadeCard();
      const before = cardClosedRef.current,
        lowest = cardLowest();
      if (!before || Math.abs(before - lowest) <= 1) return;
      cardClosedRef.current = lowest;
      setCardClosed(lowest);
      // A closed card stays closed at its new height; one the visitor moved stays where it is.
      setSheetHeight((h) => (Math.abs(h - before) <= 2 ? lowest : h));
    });
    observer.observe(panel);
    observer.observe(body);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteCard, siteId, fadeCard]);
  // Scrolling the closed card's content (wheel down, or a finger pushing it up) raises the card to where it scrolls,
  // smoothly, instead of doing nothing until its handle is pulled.
  const cardTouch = useRef<number | null>(null);
  const openCardForScroll = () => {
    if (sheetHeight > cardClosed + 8) return;
    // Only a little: enough for the content to scroll (Muhammed, 2 Nov 2026), not all the way up.
    setSheetHeight(Math.min(sheetStops().highest, cardClosed + CARD_SCROLL_RISE));
    setCardRising(true);
  };
  // That rise glides a little slower and softer than a drag's settle.
  const [cardRising, setCardRising] = useState(false);
  // A sheet left between its stops (a scroll's rise, a resize) goes, after a moment with no touch and its content at
  // the top, to its nearest stop, gliding (Muhammed, 3 Nov 2026: «yarım duruyor; kendiliğinden yerine dönsün»).
  useEffect(() => {
    if (wide || sheetDragging) return;
    const panel = sheet.current;
    let timer = 0;
    const later = () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (sheetDrag.current || (panel && panel.scrollTop > 4)) return;
        const stops = sheetStops();
        const goal = settleSheet(sheetHeight, stops);
        if (Math.abs(goal - sheetHeight) > 6) {
          setCardRising(true);
          setSheetHeight(goal);
        }
      }, SHEET_IDLE_MS);
    };
    later();
    panel?.addEventListener("scroll", later, { passive: true });
    panel?.addEventListener("pointerdown", later);
    return () => {
      clearTimeout(timer);
      panel?.removeEventListener("scroll", later);
      panel?.removeEventListener("pointerdown", later);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetHeight, sheetDragging, wide, view]);
  useEffect(() => {
    if (!cardRising) return;
    const timer = setTimeout(() => setCardRising(false), 520);
    return () => clearTimeout(timer);
  }, [cardRising]);
  // A route opens the sheet at 58 % and gives the earlier height back when it closes; a tab keeps the height
  // (the prototype's `altH`): Eserler | Rotalar must not drop the sheet the visitor pulled up.
  const heightBeforeRoute = useRef<number | null>(null);
  useEffect(() => {
    if (!ready || wide || isDetail) return;
    if (routeId) {
      heightBeforeRoute.current ??= sheetHeight;
      setSheetHeight(Math.round(innerHeight * 0.58));
      sheet.current?.scrollTo({ top: 0 });
    } else if (heightBeforeRoute.current !== null) {
      setSheetHeight(heightBeforeRoute.current);
      heightBeforeRoute.current = null;
    }
    // Only a route opening or closing moves the sheet; its own height is read, not followed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, wide, isDetail, routeId]);
  // Building Rotam on a phone: the sheet rises so the stops and Kaydet are in reach; it drops back when done.
  const building = !!routeDraft;
  useEffect(() => {
    if (!ready || wide || isDetail) return;
    if (building) setSheetHeight((h) => Math.max(h, Math.round(innerHeight * 0.62)));
    else setSheetHeight(sheetLowest());
    sheet.current?.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [building]);
  // At its lowest stop the sheet keeps showing the new tab's heading line, whose height may differ.
  const lowestShown = useRef(0);
  useEffect(() => {
    if (!ready || wide || isDetail || routeId) return;
    const frame = requestAnimationFrame(() => {
      const lowest = sheetLowest();
      setSheetHeight((h) => (h <= Math.max(lowestShown.current, lowest) + 4 ? lowest : h));
      lowestShown.current = lowest;
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);
  // On a phone a sheet pulled high leaves the map's controls no room under the chips: they fade out until it is lower.
  const crowded =
    !wide && !isDetail && !peekSite && typeof innerHeight === "number" && sheetHeight + CONTROLS_ROOM > innerHeight;
  const shell = (
    <div
      className="app-shell"
      style={cityLook}
      inert={opening && !openingDone}
    >
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        {t("header.skip")}
      </a>
      <header className="topbar">
        <button
          className="brand"
          onClick={() => {
            setRouteId(undefined);
            setQuery("");
            go("map");
          }}
          aria-label={t("header.home")}
        >
          <img
            className="brand-logo"
            src="/logo/logo-web.png"
            alt=""
            width={800}
            height={237}
          />
          <img
            className="brand-mark"
            src="/logo/isaret-a-96.png"
            alt=""
            width={91}
            height={96}
          />
        </button>
        <div className="global-search">
          <Search size={18} />
          <input
            aria-label={t("header.search")}
            placeholder={t(wide ? "header.search" : "header.searchShort")}
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!["map", "sites", "routes"].includes(view)) go("sites");
            }}
          />
          {query && (
            <button
              className="small-icon"
              aria-label={t("header.clearSearch")}
              onClick={() => setQuery("")}
            >
              <X size={15} />
            </button>
          )}
          {pageCity && <button
            className="city-chip"
            title={t("header.cities")}
            onClick={() => {
              if (view !== "map") go("map");
              setFlight((f) => ({ key: (f?.key ?? 0) + 1, to: "globe" }));
            }}
          >
            <i className="city-motif" aria-hidden="true" />
            {pageCity}
          </button>}
        </div>
        {/* One switch: a press anywhere on it turns to the other language, and the thumb slides there. */}
        <div className="lang-switch" role="group" aria-label={t("lang.switch")} data-lang={lang}>
          {LANGS.map((l) => (
            <button
              key={l}
              lang={l}
              aria-pressed={lang === l}
              onClick={() => changeLanguage(LANGS.find((other) => other !== lang) ?? l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <AccessMenu />
        <button
          className="theme-switch"
          aria-label={t(theme === "night" ? "theme.toDay" : "theme.toNight")}
          title={t(theme === "night" ? "theme.toDay" : "theme.toNight")}
          onClick={() => applyTheme(theme === "night" ? "day" : "night")}
        >
          {theme === "night" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button
          className={`profile-button ${view === "profile" ? "active" : ""}`}
          aria-label={t("header.profile")}
          onClick={() => go("profile")}
        >
          <Avatar figure={avatarFigure} size={36} />
        </button>
      </header>
      {!ready ? (
        <main className="loading" aria-busy={!loadError}>
          {loadError ? (
            <>
              <p role="alert" className="error">
                {loadError}
              </p>
              <button className="btn" onClick={() => void load()}>
                {t("common.retry")}
              </button>
            </>
          ) : (
            t("app.loading")
          )}
        </main>
      ) : (
        <>
          {view === "profile" && (
            <Profile
              state={state}
              progress={progress}
              onBack={() => go("map")}
              onLanguage={changeLanguage}
              experimental={showExperimental}
              canManage={canManage}
              onExperimentalChange={setExperimental}
              onSite={selectSite}
              onAdmin={() => go("admin")}
              onReset={() => setOverlay("reset")}
              commit={commit}
              auth={
                live
                  ? {
                      email: account?.email ?? null,
                      onSignIn: () => setSignIn(""),
                      onSignOut: signOut,
                      onDelete: async () => {
                        const done = await commit({ type: "delete-account" });
                        if (done) {
                          void getSupabase()?.auth.signOut({ scope: "local" });
                          setToast(t("toast.accountDeleted"));
                        }
                        return done;
                      },
                    }
                  : undefined
              }
            />
          )}
          {!!state.pendingRouteCount && (
            <Notice>
              {t("app.pendingRoute", { count: state.pendingRouteCount })}
            </Notice>
          )}
          {view === "admin" && !canManage && (
            <main id="main-content" tabIndex={-1} className="profile-page">
              <h1>{t("admin.title")}</h1>
              <Notice>
                {account
                  ? t("admin.noRights")
                  : t("admin.signInNeeded")}
              </Notice>
              {!account && (
                <button className="btn" onClick={() => setSignIn("")}>
                  {t("common.signIn")}
                </button>
              )}
            </main>
          )}
          {view === "admin" && canManage && (
            <LangProvider lang="tr">
            <Admin
              key={`${account?.id ?? "local"}-${role}`}
              state={state}
              commit={commit}
              role={role}
              loadHealth={loadHealth}
              loadModeration={loadModeration}
              loadMembers={loadMembers}
              changeMemberRole={changeMemberRole}
              currentUserId={account?.id ?? "demo-admin"}
              saveSite={saveSite}
              loadPlacement={loadPlacement}
              savePlacement={savePlacement}
              narrateSite={narrateSite}
              translateSite={translateSite}
              live={live}
              mapSettings={mapSettings}
              saveMapSettings={saveMapSettings}
              loadStats={loadStats}
              loadSiteStats={loadSiteStats}
            />
            </LangProvider>
          )}
          {view === "history" && site && (
            <HistoryView
              key={site.id}
              site={site}
              sites={published}
              start={historyStart}
              onBack={() => go("detail", site.id)}
              onMemory={(draft) => {
                setMemoryDraft(draft ?? null);
                setOverlay("memory");
              }}
              onSite={(id, index) => {
                go("history", id);
                setHistoryStart(index);
              }}
            />
          )}
          {view === "memories" && site && (
            <LivingMemory
              key={site.id}
              site={site}
              sites={published}
              state={state}
              role={role}
              commit={commit}
              onBack={() => go("detail", site.id)}
              onAdd={() => setOverlay("memory")}
              onHistory={() => go("history", site.id)}
              onListen={() => openStory(true, 0, site.id)}
              onSite={(id, memory) => go(memory ? "memories" : "detail", id)}
            />
          )}
          {showMap && (
            <main
              id="main-content"
              tabIndex={-1}
              style={
                sheetHeight
                  ? ({
                      "--sheet-h": `${sheetHeight}px`,
                      ...(cardClosed && { "--card-closed": `${cardClosed}px` }),
                    } as CSSProperties)
                  : undefined
              }
              className={`workspace ${collapsed ? "panel-collapsed" : ""} ${isDetail ? "on-site" : "on-map"} ${peekSite && !isDetail ? "peeking" : ""} ${crowded ? "controls-crowded" : ""}`}
            >
              {/* A started route stays on the map after its page: it needs its own way off (Muhammed, 4 Nov 2026). */}
              {onMapView && !wholeCountry && !routeId && !routeDraft && !peekSite && state.routeIds.length > 0 && (
                <button className="route-off" onClick={closeRoute}>
                  <X size={16} />
                  {t("route.close")}
                </button>
              )}
              {routeId && showRoutes && !isDetail && (
                <button className="round-btn route-mobile-back" aria-label={t("route.all")} onClick={() => setRouteId(undefined)}>
                  <ChevronLeft size={20} />
                </button>
              )}
              <aside
                ref={sheet}
                className={`side-panel${sheetDragging ? " dragging" : ""}${cardRising ? " rising" : ""}${cardFull ? " full" : ""}`}
                onScroll={siteCard ? fadeCard : undefined}
                onWheel={siteCard ? (e) => { if (e.deltaY > 4) openCardForScroll(); } : undefined}
                onTouchStart={
                  siteCard
                    ? (e) => {
                        const onHandle = (e.target as HTMLElement).closest(".sheet-grip, .panel-baslik");
                        cardTouch.current = onHandle ? null : e.touches[0]!.clientY;
                      }
                    : undefined
                }
                onTouchMove={
                  siteCard
                    ? (e) => {
                        const start = cardTouch.current;
                        if (start === null || start - e.touches[0]!.clientY < 12) return;
                        cardTouch.current = null;
                        openCardForScroll();
                      }
                    : undefined
                }
                aria-label={t("app.panelAria")}
                hidden={collapsed}
                onPointerDown={(e) => {
                  const target = (e.target as HTMLElement).closest(
                    isDetail
                      ? ".sheet-grip, .detail-panel .panel-baslik"
                      : ".sheet-grip, .explore-tabs, .explore-heading",
                  );
                  if (!target) return;
                  const handle = target.classList.contains("sheet-grip");
                  sheetDrag.current = {
                    y: e.clientY,
                    height: sheetHeight,
                    handle,
                    moved: false,
                  };
                  // The handle is the sheet's top edge: the first move upward already leaves the sheet, so it holds
                  // the pointer at once (it has no buttons inside whose clicks this would take).
                  if (handle) e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  const drag = sheetDrag.current;
                  if (!drag || Math.abs(drag.y - e.clientY) < SHEET_TAP_PX)
                    return;
                  if (!drag.moved) {
                    drag.moved = true;
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setSheetDragging(true);
                  }
                  const wanted = drag.height + drag.y - e.clientY;
                  const stops = sheetStops();
                  // Smooth on a phone (3 Nov 2026: «çekerken kasıyor»): the finger moves the sheet by its CSS height
                  // alone, once a frame; the app renders again only when it is let go.
                  drag.live = clampSheet(wanted, stops);
                  const space = e.currentTarget.closest<HTMLElement>(".workspace");
                  if (space && !drag.frame)
                    drag.frame = requestAnimationFrame(() => {
                      drag.frame = 0;
                      if (drag.live !== undefined) space.style.setProperty("--sheet-h", `${drag.live}px`);
                    });
                  if (drag.lastY !== undefined && drag.lastAt !== undefined && e.timeStamp > drag.lastAt)
                    drag.speed = (drag.lastY - e.clientY) / (e.timeStamp - drag.lastAt);
                  drag.lastY = e.clientY;
                  drag.lastAt = e.timeStamp;
                  // A site's card pulled below its closed height follows the finger down: let go far enough, back to
                  // the map (as a story closes).
                  if (siteCard)
                    e.currentTarget.style.transform =
                      wanted < stops.lowest ? `translateY(${Math.round((stops.lowest - wanted) * 0.8)}px)` : "";
                }}
                onPointerUp={(e) => {
                  const drag = sheetDrag.current;
                  sheetDrag.current = null;
                  if (!drag) return;
                  setSheetDragging(false);
                  if (drag.frame) cancelAnimationFrame(drag.frame);
                  const stops = sheetStops();
                  e.currentTarget.style.transform = "";
                  if (siteCard && drag.moved && drag.height + drag.y - e.clientY < stops.lowest - CARD_CLOSE_PULL) {
                    go("map");
                    return;
                  }
                  if (drag.moved) {
                    const goal = settleSheet(drag.height + drag.y - e.clientY, stops, drag.speed ?? 0);
                    // Written to the page too: back where it started, the state does not change and would not.
                    e.currentTarget.closest<HTMLElement>(".workspace")?.style.setProperty("--sheet-h", `${goal}px`);
                    setSheetHeight(goal);
                  }
                  else if (drag.handle)
                    setSheetHeight(toggleSheet(drag.height, stops));
                }}
                onPointerCancel={(e) => {
                  const drag = sheetDrag.current;
                  sheetDrag.current = null;
                  setSheetDragging(false);
                  e.currentTarget.style.transform = "";
                  if (drag?.frame) cancelAnimationFrame(drag.frame);
                  if (drag?.live !== undefined) setSheetHeight(settleSheet(drag.live, sheetStops()));
                }}
              >
                {siteCard ? (
                  // The card's handle: a tap, Enter or Space opens it all the way or closes it; the arrow says which.
                  <button
                    type="button"
                    className="sheet-grip card-grip"
                    aria-expanded={sheetHeight > cardClosed + 8}
                    aria-label={t(sheetHeight > cardClosed + 8 ? "site.cardClose" : "site.cardOpen")}
                    onClick={(e) => {
                      // A pointer's tap is handled on pointer up (with the drag); only the keyboard's click is left here.
                      if (e.detail === 0) setSheetHeight((h) => toggleSheet(h, sheetStops()));
                    }}
                  >
                    <ChevronUp size={14} aria-hidden="true" />
                  </button>
                ) : (
                  <div className="sheet-grip" aria-hidden="true" />
                )}
                {isDetail && site ? (
                  view === "story" && storySite ? (
                    <StoryPanel
                      key={storySite!.id}
                      site={storySite!}
                      index={storyIndex}
                      onIndex={setStoryIndex}
                      startListening={listening}
                      lang={lang}
                      voiceLang={voice.lang ?? lang}
                      voiceGender={voice.gender ?? "male"}
                      onVoice={changeVoice}
                      hold={storyHold}
                      onClose={() => go("detail", site.id)}
                      onComplete={async () => {
                        if (await commit({ type: "read", siteId: site.id })) {
                          writePreference(`akar.ilerleme.${site.id}`, "0");
                          const fresh = await refreshProgress();
                          go("detail", site.id);
                          setCompletion({
                            earned: (site.badges ?? []).filter((b) =>
                              fresh.includes(b.id),
                            ),
                          });
                        }
                      }}
                    />
                  ) : (
                    <div className="detail-panel">
                      <SiteDetail site={site} saved={state.savedIds.includes(site.id)} read={state.readIds.includes(site.id)} progress={progress} memoryCount={memoryCount}
                        onBack={() => go("map")} onSave={() => void commit({ type: "save", siteId: site.id })}
                        onStory={openStory} onAbout={() => setOverlay("about")} onHistory={() => go("history", site.id)}
                        onMemories={() => go("memories", site.id)} onPuzzle={() => setPuzzle({ start: firstOpenTask(site.tasks ?? [], progress) })}
                        nextStop={nextStop} onNextStop={selectSite} />
                    </div>
                  )
                ) : isDetail && !site ? (
                  <div className="empty-state">
                    <h2>{t("app.notFound")}</h2>
                    <button className="btn" onClick={() => go("map")}>
                      {t("common.backToExplore")}
                    </button>
                  </div>
                ) : routeDraft && view === "map" ? (
                  // Rotam is built in the panel (the map beside it shows the route as it grows).
                  <RouteBuilder draft={routeDraft} routes={personalRoutes} sites={published} busy={routeBusy} onChange={(next) => setRouteDraft(routeSite && next.id !== routeDraft.id ? { ...next, siteIds: [...new Set([...next.siteIds, routeSite])] } : next)} onSave={() => void saveRouteDraft()} onCancel={() => { setRouteDraft(null); setRouteSite(undefined); }} onDelete={() => void deleteRouteDraft()} />
                ) : (
                  <div className="discovery-panel">
                    {/* The visitor's own routes; an empty one (no stops yet) says nothing worth a line. */}
                    {showRoutes && !routeId && personalRoutes.some((p) => p.siteIds.length) && <section className="personal-route-list" aria-label={t("route.mine")}>
                      <h3>{t("route.mine")}</h3>
                      {personalRoutes.filter((p) => p.siteIds.length).map((personal) => <button key={personal.id} className="btn secondary" onClick={() => {
                        setRouteDraft({ ...personal, siteIds: [...personal.siteIds] }); setRouteSite(undefined); setTab("sites"); setRouteId(undefined);
                      }}>{personal.name} · {personal.siteIds.length}</button>)}
                    </section>}
                    {routeId && showRoutes ? (
                      <RoutePreview
                        route={route}
                        custom={routeId === "custom"}
                        sites={routeSites}
                        live={live}
                        visitedIds={state.visitedIds}
                        onBack={() => setRouteId(undefined)}
                        onClose={closeRoute}
                        onSite={selectSite}
                        onStart={async () => {
                          const ids = routeSites.map((s) => s.id);
                          if (await commit({ type: "set-route", siteIds: ids })) {
                            selectSite(
                              ids.find((id) => !state.visitedIds.includes(id)) ??
                                ids[0]!,
                            );
                            setToast(t("toast.routeReady"));
                          }
                        }}
                      />
                    ) : (
                      <ExplorePanel
                        tab={tab}
                        onTab={(next) => {
                          setTab(next);
                          setRouteId(undefined);
                          if (next === "routes") setQuery("");
                          // A phone opens its sheet on the routes, so they and «Yeni rota oluştur» are in sight.
                          if (next === "routes" && phone) setSheetHeight(Math.max(sheetHeight, sheetStops().open));
                        }}
                        mode={place}
                        city={cityName}
                        sites={listed}
                        total={published.length}
                        routes={routes}
                        allSites={published}
                        live={live}
                        query={query}
                        routeIds={routeDraft?.siteIds ?? state.routeIds}
                        visitedIds={state.visitedIds}
                        selectedId={peekId}
                        onHover={setHoverId}
                        onPick={pickSite}
                        onRoute={(id) => void toggleRoute(id)}
                        onOpen={routeDraft ? undefined : (id) => go("detail", id)}
                        onOpenRoute={(id) => {
                          track("route.open", undefined, id);
                          setQuery("");
                          setTab("routes");
                          setRouteId(id);
                        }}
                        onCustomRoute={() => void openRouteBuilder()}
                        onCities={() =>
                          setFlight((f) => ({
                            key: (f?.key ?? 0) + 1,
                            to: "globe",
                          }))
                        }
                        onClearFilters={() => {
                          setQuery("");
                          setRoles(new Set(siteCategories));
                        }}
                        categories={listCategories}
                        categoryCount={(c) =>
                          c ? beforeKind.filter((s) => kindCategory[s.kind] === c).length : beforeKind.length
                        }
                        activeCategory={activeCategory}
                        onCategory={(c) => setRoles(new Set(c ? [c] : siteCategories))}
                      />
                    )}
                  </div>
                )}
              </aside>
              <div
                className="main-stage"
                // A phone's story moves on a tap on its photograph or model, as an Instagram story does: the left third
                // goes back, the rest on. A drag (turning the model) or a press on a button is not a tap.
                onPointerDown={(e) => {
                  stageTap.current = phone && view === "story" ? { x: e.clientX, y: e.clientY, at: e.timeStamp } : null;
                }}
                onPointerUp={(e) => {
                  const tap = stageTap.current;
                  stageTap.current = null;
                  if (!tap || Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 10 || e.timeStamp - tap.at > 400) return;
                  if ((e.target as HTMLElement).closest("button, a, input, dialog, .story-photo-card, .model-view-photo, .story-progress, [data-zoomed]"))
                    return;
                  const box = e.currentTarget.getBoundingClientRect();
                  window.dispatchEvent(
                    new CustomEvent(STORY_STEP_EVENT, { detail: e.clientX < box.left + box.width / 3 ? -1 : 1 }),
                  );
                }}
              >
              {view === "detail" && site && (
                // The phone's way back over the photographs or the model (prototype `.gorus-ust .geri`); the wide
                // screen has the panel's own «‹ Harita».
                <button className="detail-mobile-back" onClick={() => go("map")}>
                  <ChevronLeft size={16} />
                  {t("app.map")}
                </button>
              )}

                <button
                  className="panel-toggle"
                  aria-label={collapsed ? t("app.panelOpen") : t("app.panelClose")}
                  aria-expanded={!collapsed}
                  onClick={togglePanel}
                >
                  <ChevronLeft size={16} />
                </button>
                {isDetail && site && (
                  <Scene
                    key={`${site.id}-${view}`}
                    context={view === "story" ? "story" : "detail"}
                    companion={flowCompanion}
                    // Phone: the scene fills the screen behind the floating card; the model stays above it closed.
                    frameBottom={
                      siteCard && cardClosed
                        ? cardClosed + 12
                        : // A story's photograph card lies along the stage's foot on a phone: the model is framed above it.
                          phone && view === "story" && storyBlock?.photoId
                          ? storyPhotoPhoneHeight() + 24
                          : 0
                    }
                    site={site}
                    live={live}
                    photoId={
                      view === "story"
                        ? storyBlock?.photoId
                        : undefined
                    }
                    // The income road's sentence: the companion takes the camera back to show both buildings.
                    pose={
                      view === "story" && !flowCompanion
                        ? storySite?.stories
                            .slice(0, storyIndex + 1)
                            .findLast((s) => s.camera)?.camera
                        : undefined
                    }
                    interior={
                      view === "story"
                        ? (storyBlock?.interior ?? false)
                        : undefined
                    }
                    // Every sentence with a photograph shows it (Muhammed, 4 Nov 2026: «ilk cümlelerin fotoğrafları olmuyor»).
                    photoCard={
                      view === "story" && !!storyBlock?.photoId
                    }
                    highlights={
                      view === "story"
                        ? storyBlock?.highlights
                        : undefined
                    }
                    flow={
                      !live &&
                      view === "story" &&
                      storyBlock?.id === "akar"
                    }
                    onHotspot={(id) => {
                      const index = site.stories.findIndex((s) => s.id === id);
                      if (index >= 0) openStory(false, index);
                      else setOverlay("about");
                    }}
                    turn={
                      !flowCompanion &&
                      (view !== "story" ||
                        storyIndex === 0 ||
                        storyIndex === (storySite?.stories.length ?? 1) - 1 ||
                        // With no photograph to look at, the model never stands still.
                        !storyBlock?.photoId)
                    }
                    visitors={view === "detail" ? visitorPhotos : []}
                    onAddPhoto={() => setOverlay("memory")}
                    onPick={pick ? pickPart : undefined}
                  />
                )}
                {/* The map stays behind a site's page (hidden, still), so back from the site it is there at once, not
                    built anew (Muhammed, 3 Nov 2026: «geri butonuna basıyorum zar yükleniyor»). */}
                <div className={`map-keep${isDetail && site ? " parked" : ""}`} inert={isDetail && !!site}>
                    <HeritageMap
                      resting={isDetail && !!site}
                      sites={routeId && routeSites.length ? routeSites : filtered}
                      selectedId={peekId}
                      highlightId={hoverId}
                      finishedIds={state.readIds}
                      {...(lookCity?.identity && {
                        routeColour: lookCity.identity.accent,
                      })}
                      onSelect={routeDraft ? (id) => void toggleRoute(id) : pickSite}
                      buildingRoute={!!routeDraft}
                      onOpen={selectSite}
                      onClear={() => changePeek(undefined)}
                      onFirstDraw={() => setMapDrawn(true)}
                      onSettled={() => setMapSettled(true)}
                      onCityInView={setCityInView}
                      onWholeCountry={setWholeCountry}
                      onLocate={chooseNear}
                      flight={flight}
                      bottomInset={peekSite ? PEEK_INSET : sheetHeight}
                      insetDragging={sheetDragging}
                      routeIds={
                        routeDraft?.siteIds ?? (routeId ? routeSites.map((s) => s.id) : state.routeIds)
                      }
                      collapsed={collapsed}
                      mapSettings={mapSettings}
                      focusCity={
                        cityRecords.find((c) => c.name === query.trim())?.name
                      }
                      peek={
                        peekSite && (
                          <SitePeek
                            site={peekSite}
                            live={live}
                            finished={state.readIds.includes(peekSite.id)}
                            openTasks={
                              (peekSite.tasks ?? []).filter(
                                (t) =>
                                  !progress.tasks.some((p) => p.taskId === t.id),
                              ).length
                            }
                            next={published.find(
                              (s) =>
                                s.id !== peekSite.id &&
                                !state.readIds.includes(s.id),
                            )}
                            saved={state.routeIds.includes(peekSite.id)}
                            onOpen={() => selectSite(peekSite.id)}
                            onListen={() => openStory(true, 0, peekSite.id)}
                            onRead={() => openStory(false, 0, peekSite.id)}
                            onTasks={() => selectSite(peekSite.id)}
                            onNext={pickSite}
                            onRoute={() => void (state.routeIds.includes(peekSite.id) ? toggleRoute(peekSite.id) : openRouteBuilder(peekSite.id))}
                            onClose={() => changePeek(undefined)}
                          />
                        )
                      }
                    />
                    <MapChips
                      whole={wholeCountry}
                      city={cityName}
                      cities={cityRecords.filter((c) => c.map).map((c) => c.name)}
                      onCity={(name) => setFlight((f) => ({ key: (f?.key ?? 0) + 1, to: "city", name }))}
                      onCities={() =>
                        setFlight((f) => ({
                          key: (f?.key ?? 0) + 1,
                          to: "globe",
                        }))
                      }
                    />
                </div>
                {view === "story" && storySite && !wide && (
                  <button
                    className="round-btn story-stage-close"
                    aria-label={t("site.closeStory")}
                    onClick={() => go("detail", site!.id)}
                  >
                    <X size={18} />
                  </button>
                )}
                {view === "story" && storySite && (
                  <StoryProgress
                    stories={storySite.stories}
                    index={storyIndex}
                    onIndex={setStoryIndex}
                  />
                )}
                {pick && (
                  <TaskPickBar
                    task={pick.task}
                    hint={pick.hint}
                    onCancel={() => setPick(null)}
                  />
                )}
              </div>
            </main>
          )}
        </>
      )}
      {puzzle && site && client.current && (
        <SitePuzzle
          key={`${site.id}-${puzzle.start}-${puzzle.found ? "found" : "open"}`}
          site={site}
          client={client.current}
          progress={progress}
          guest={guestPlayer}
          wide={wide}
          start={puzzle.start}
          found={puzzle.found}
          onClose={() => setPuzzle(null)}
          onDone={taskFinished}
          onSignIn={signInForBadges}
          onPick={(task) => {
            if (isFieldTask(task)) setPick({ task, hint: "" });
            setPuzzle(null);
          }}
          onBadges={() => go("profile")}
          onToast={setToast}
        />
      )}
      {overlay === "memory" && site && (
        <MemoryModal
          site={site}
          live={live}
          initialPhoto={memoryDraft?.photo}
          sameAngle={memoryDraft?.sameAngle}
          onClose={() => {
            setOverlay(null);
            setMemoryDraft(null);
          }}
          onSubmit={async (memory, accepted) => {
            consent.current = accepted;
            try {
              return await run({ type: "memory", memory });
            } finally {
              consent.current = null;
            }
          }}
        />
      )}
      {showExperimental && overlay === "quiz" && site && client.current && (
        <QuizModal
          site={site}
          client={client.current}
          onClose={() => setOverlay(null)}
          onSnapshot={setState}
        />
      )}
      {overlay === "about" && site && (
        <AboutModal
          site={site}
          onClose={closeOverlay}
          onStory={() => {
            setOverlay(null);
            openStory(true);
          }}
          onHistory={() => go("history", site.id)}
          onPuzzle={() => {
            setOverlay(null);
            setPuzzle({ start: firstOpenTask(site.tasks ?? [], progress) });
          }}
        />
      )}
      {showExperimental && overlay === "together" && (
        <Modal title={t("site.together")} onClose={() => setOverlay(null)}>
          <div className="empty-state">
            <Users size={40} />
            <h3>{t("together.title")}</h3>
            <p>{t("together.text")}</p>
            <button className="btn" onClick={() => openStory(true)}>
              <Headphones size={18} />
              {t("together.open")}
            </button>
          </div>
        </Modal>
      )}
      {overlay === "reset" && (
        <Modal
          title={t("reset.title")}
          onClose={() => setOverlay(null)}
        >
          <p>{t("reset.text")}</p>
          <div className="modal-actions">
            <button className="btn secondary" onClick={() => setOverlay(null)}>
              {t("common.cancel")}
            </button>
            <button
              className="btn"
              onClick={async () => {
                try {
                  if (client.current) {
                    setState(await client.current.reset());
                    void refreshProgress();
                  }
                  setOverlay(null);
                  setToast(t("toast.resetDone"));
                } catch (e) {
                  setFault(describeError(e, t("error.resetFailed"), lang));
                }
              }}
            >
              {t("profile.reset")}
            </button>
          </div>
        </Modal>
      )}
      {signIn !== null && (
        <SignInModal
          reason={signIn}
          onClose={() => setSignIn(null)}
          onSignedIn={() => {
            setSignIn(null);
            setToast(t("toast.signedIn"));
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
          <button
            className="small-icon"
            aria-label={t("toast.close")}
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {fault && (
        <div className="toast fault" role="alert">
          {fault}
          <button
            className="small-icon"
            aria-label={t("toast.faultClose")}
            onClick={() => setFault("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
  return (
    <LangProvider lang={lang}>
    <VoiceProvider value={{ lang: voice.lang ?? lang, gender: voice.gender ?? "male" }}>
    <Cities.Provider value={cityRecords}>
      <SourceSheetProvider
        fallback={defaultCity?.inventory?.name ?? ""}
        report={() =>
          setToast(t("toast.reportThanks"))
        }
      >
        {shell}
        {completion && site && (
          <CompletionCard
            site={site}
            style={cityLook}
            chapters={site.stories.length}
            earned={completion.earned}
            owned={progress.badges.map((b) => b.badgeId)}
            openTasks={
              (site.tasks ?? []).filter(
                (t) => !progress.tasks.some((p) => p.taskId === t.id),
              ).length
            }
            nextStop={nextStop}
            guest={guestPlayer}
            onClose={() => setCompletion(null)}
            onTasks={() => {
              setCompletion(null);
              setPuzzle({ start: firstOpenTask(site.tasks ?? [], progress) });
            }}
            onNextStop={(id) => {
              setCompletion(null);
              selectSite(id);
            }}
            onProfile={() => {
              setCompletion(null);
              go("profile");
            }}
            onSignIn={() => {
              setCompletion(null);
              signInForBadges();
            }}
          />
        )}
        {waqf && (
          <WaqfSheet
            sites={published}
            inventory={defaultCity?.inventory?.name ?? ""}
            onSite={(id) => {
              setWaqf(false);
              selectSite(id);
            }}
            onClose={() => setWaqf(false)}
          />
        )}
      </SourceSheetProvider>
      {/* First-time hints (3 Nov 2026): a finger (a cursor on a wide screen) doing what to do and a few words, once
          each, in rows; most darken the screen but for what they are about. Phone and wide screen each their own. */}
      {!opening && !mapReturn && !completion && !overlay && !puzzle && signIn === null && (phone ? (
        view === "map" && !peekSite && !routeDraft ? (
          <TipRow key="t-harita" tips={[{ id: "harita", text: t("tip.map"), place: "map", gesture: "tap" }]} />
        ) : view === "map" && peekSite ? (
          <TipRow key="t-kart" tips={[{ id: "kart", text: t("tip.peek"), place: "above-card", gesture: "swipe-up", spot: ".site-peek" }]} />
        ) : siteCard ? (
          <TipRow
            key="t-detay"
            wait={3500}
            tips={[
              { id: "d.foto", text: t("tip.switchWide"), place: "under-spot", gesture: "tap", spot: ".detail-scene .scene-media-switch, .galeri-arac .scene-media-switch", arrowTo: ".detail-scene .scene-media-switch, .galeri-arac .scene-media-switch", needs: ".scene-media-switch.kayan", doneBy: ".scene-media-switch", pressSpot: true, swallow: true },
              { id: "d.parca", text: t("tip.parts"), place: "under-spot", gesture: "tap", spot: ".detail-scene .model-show-parts", arrowTo: ".detail-scene .model-show-parts", when: ".detail-scene .model-canvas[data-drawn] ~ .model-show-parts", doneBy: ".model-show-parts", swallow: true, pressSpot: true },
              { id: "d.parcaya", text: t("tip.aPart"), place: "stage", gesture: "tap", spot: ".detail-scene .model-canvas", when: '.detail-scene .model-show-parts[aria-pressed="true"]', follows: true, swallow: true, pressSpot: true },
              // Going back is told once the visitor has done something here: a part looked at, a story heard.
              ...(state.readIds.length || readPreference("akar.ipucu.d.parcaya")
                ? [{ id: "detay", text: t("tip.detail"), place: "above-site-card", gesture: "swipe-down", spot: ".workspace.on-site .side-panel" } as const]
                : []),
            ]}
          />
        ) : view === "story" ? (
          <TipRow
            key="t-hikaye"
            max={2}
            onDone={() => setStoryTipsOver(true)}
            // The story's own two, in this order (Muhammed, 3 Nov 2026: «sırası önemli»): the tap on the right
            // first, then turning the model (or, on a photograph, the pinch). The parts are the site page's.
            tips={[
              { id: "hikaye", text: t("tip.story"), place: "stage", gesture: "tap-sides", swallow: true },
              storyModel
                ? { id: "cevir", text: t("tip.turn"), place: "stage", gesture: "turn", spot: ".main-stage .model-canvas", needs: ".main-stage .model-canvas[data-drawn]", waitMs: 8000, swallow: true }
                : { id: "yakinlas", text: t("tip.pinch"), place: "stage", gesture: "tap", spot: ".main-stage .story-photo", needs: ".main-stage .story-photo .zoom-photo", swallow: true },
            ]}
          />
        ) : view === "history" ? (
          <TipRow key="t-gecmis" tips={historyTips(true)} />
        ) : null
      ) : (
        view === "map" && !peekSite && !routeDraft ? (
          <TipRow key="m-harita" tips={[{ id: "masa.harita", text: t("tip.mapWide"), place: "map", gesture: "click" }]} />
        ) : view === "detail" ? (
          <TipRow
            key="m-detay"
            wait={3500}
            tips={[
              { id: "masa.detay", text: t("tip.detailWide"), place: "under-spot", gesture: "click", spot: ".detail-panel .hikaye-basla" },
              { id: "masa.foto", text: t("tip.switchWide"), place: "under-spot", gesture: "click", spot: ".detail-scene .scene-media-switch, .galeri-arac .scene-media-switch", arrowTo: ".detail-scene .scene-media-switch, .galeri-arac .scene-media-switch", needs: ".scene-media-switch", doneBy: ".scene-media-switch", pressSpot: true, swallow: true },
              { id: "masa.parca", text: t("tip.partsWide"), place: "under-spot", gesture: "click", spot: ".detail-scene .model-show-parts", arrowTo: ".detail-scene .model-show-parts", when: ".detail-scene .model-canvas[data-drawn] ~ .model-show-parts", doneBy: ".model-show-parts", swallow: true, pressSpot: true },
              { id: "masa.parcaya", text: t("tip.aPartWide"), place: "stage", gesture: "click", spot: ".detail-scene .model-canvas", when: '.detail-scene .model-show-parts[aria-pressed="true"]', follows: true, swallow: true, pressSpot: true },
            ]}
          />
        ) : view === "story" ? (
          <TipRow
            key="m-hikaye"
            max={2}
            onDone={() => setStoryTipsOver(true)}
            tips={[
              { id: "masa.hikaye", text: t("tip.storyWide"), place: "under-spot", gesture: "click", spot: ".story-panel .story-transport", swallow: true },
              ...(storyModel
                ? [{ id: "masa.cevir", text: t("tip.turnWide"), place: "stage", gesture: "turn", spot: ".main-stage .model-canvas", needs: ".main-stage .model-canvas[data-drawn]", waitMs: 8000, swallow: true } as const]
                : []),
            ]}
          />
        ) : view === "history" ? (
          <TipRow key="m-gecmis" tips={historyTips(false)} />
        ) : null
      ))}
      {mapReturn && !opening && (
        <OpeningScreen
          cityName={openingCity?.name}
          identity={openingCity?.identity ?? null}
          done={mapSettled || returnLate || !onMapView}
          onGone={() => setMapReturn(false)}
        />
      )}
      {opening && (
        <OpeningScreen
          cityName={openingCity?.name}
          identity={openingCity?.identity ?? null}
          done={openingDone}
          onGone={() => setOpening(false)}
        />
      )}
    </Cities.Provider>
    </VoiceProvider>
    </LangProvider>
  );
}
