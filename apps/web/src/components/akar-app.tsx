"use client";
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
  X,
  Check,
  Users,
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
import { HeritageMap, type MapFlight } from "./heritage-map";
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
import { WelcomeCard } from "./welcome-card";
import { Cities } from "./city-scenes";
import { OPENING_MAX_MS, OpeningScreen } from "./loading-screens";
import { Scene } from "./scene";
import { HistoryView } from "./history-view";
import { LivingMemory } from "./living-memory";
import { firstOpenTask, SitePuzzle } from "./site-puzzle";
import { StoryPanel, StoryProgress } from "./story-panel";
import { StoryFlowMap } from "./story-flow-map";
import { CompletionCard } from "./completion-card";
import { AboutModal, useWide } from "./about-reading";
import { MemoryModal, QuizModal, VisitModal } from "./interaction-modals";
import { Profile, Admin } from "./profile-admin";
import { SignInModal } from "./sign-in-modal";
import { Modal, Notice } from "./ui";
import {
  isFieldTask,
  TaskPickBar,
  useSiteProgress,
  type FieldDone,
  type FieldTask,
} from "./site-tasks";
import { describeError, needsSignIn } from "../lib/errors";
import { apiUrl, demoContentUrl, getSupabase } from "../lib/supabase";
import { setUploadProgress } from "../lib/upload-progress";
import { locateOnce } from "../lib/locate";
import {
  clampSheet,
  settleSheet,
  SHEET_TAP_PX,
  toggleSheet,
} from "../lib/bottom-sheet";
import { cityIdentityStyle } from "../lib/city-identity";
import { distanceM, NEAR_CITY_MAX_M, nearestFirst } from "../lib/nearby";
import { cityCase } from "../lib/place-names";
import { deviceLang, LANGS, localize, saveDeviceLang, translate, type Lang } from "../lib/i18n";
import type { MessageKey } from "../lib/messages";
import { readPreference, writePreference } from "../lib/preferences";
import { LangProvider, Localized } from "./i18n";
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
/** Share of a phone's height the panel takes on a site's page; the scene stays above it. */
const SITE_SHEET = 0.46;
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
    [welcome, setWelcome] = useState(false),
    [completion, setCompletion] = useState<{ earned: SiteBadge[] } | null>(null),
    [waqf, setWaqf] = useState(false),
    [sheetHeight, setSheetHeight] = useState(0),
    [sheetDragging, setSheetDragging] = useState(false),
    [routeId, setRouteId] = useState<string>(),
    [collapsed, setCollapsed] = useState(false),
    [overlay, setOverlay] = useState<Overlay>(null),
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
    window.addEventListener("hashchange", readLocation);
    return () => {
      window.removeEventListener("hashchange", readLocation);
      subscription?.unsubscribe();
    };
  }, [load, t]);
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
          t("toast.newBadge", { titles: badges.map((b) => b.title).join(", ") }),
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
  // «Yalnız rotada» sentences lead to the next stop: they are read only on a route.
  const storySite = useMemo(() => {
    if (!site) return undefined;
    const stories = site.stories.filter((s) => !s.routeOnly || !!routeId);
    return stories.length ? { ...site, stories } : undefined;
  }, [site, routeId]);
  const storyBlock = view === "story" ? storySite?.stories[storyIndex] : undefined;
  const flowEnds = useMemo(() => {
    const flow = storyBlock?.flow;
    if (!flow) return null;
    const at = (id: string | null) =>
      state.sites.find((s) => s.id === id)?.coordinates;
    const from = at(flow.fromSiteId),
      to = flow.toPoint ?? at(flow.toSiteId);
    const fromName = state.sites.find((s) => s.id === flow.fromSiteId)?.name;
    return from && to && fromName ? { from, to, fromName } : null;
  }, [storyBlock, state.sites]);
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
  const cityName = activeCity?.name ?? cities[0] ?? "Bursa";
  // The list shows the city the map looks at; a search reaches every city.
  const listed = useMemo(() => {
    const here = query
      ? filtered
      : filtered.filter((s) => !s.city || s.city === cityName);
    return nearPoint ? nearestFirst(here, nearPoint) : byDisplayOrder(here);
  }, [filtered, query, cityName, nearPoint]);
  const chipCategories = useMemo(() => categoriesOf(published), [published]);
  const peekSite = published.find((s) => s.id === peekId);
  const pageCity = view === "detail" || view === "story" ? site?.city : undefined;
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
  // The opening screen goes once the map is drawn; with no map to wait for (a site, the profile, the panel) or no data
  // to wait for, as soon as the page can show something.
  const openingDone =
    mapDrawn ||
    openingLate ||
    !!loadError ||
    (ready && !(showMap && !isDetail));
  const openingCity = cityRecords.find((c) => c.isDefault);
  /** A pick on the map or in the list: the map goes there and the short card opens. */
  function pickSite(id: string) {
    setPeekId(id);
  }
  function selectSite(id: string) {
    setStoryIndex(0);
    go("detail", id);
  }
  function openStory(listen = false, index?: number, id = siteId) {
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
  function closeWelcome() {
    writePreference("akar.karsilama", "1");
    setWelcome(false);
  }
  function changeLanguage(next: Lang) {
    setLang(next);
    saveDeviceLang(next);
    if (state.preferences)
      void client.current?.savePreferences({ siteLang: next }).catch(() => {});
    if (next === "en" && published.some((s) => !s.nameEn))
      setToast(translate(next, "lang.fallbackNotice"));
  }
  async function toggleRoute(id: string) {
    const target = published.find((s) => s.id === id);
    const name = target
      ? text(target.name, target.nameEn)
      : t("profile.siteFallback");
    const inRoute = state.routeIds.includes(id);
    if (await commit({ type: "route", siteId: id }))
      setToast(t(inRoute ? "toast.routeRemoved" : "toast.routeAdded", { name }));
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
  // First visit on the map only: someone arriving by a shared link is not stopped.
  useEffect(() => {
    if (
      !opening &&
      ready &&
      showMap &&
      !isDetail &&
      !window.location.hash.slice(1) &&
      !readPreference("akar.karsilama")
    )
      setWelcome(true);
  }, [opening, ready, showMap, isDetail]);
  // The sheet's lowest stop shows the handle, the tabs and the heading line.
  const sheet = useRef<HTMLElement>(null),
    sheetDrag = useRef<{
      y: number;
      height: number;
      handle: boolean;
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
  useEffect(() => {
    if (!ready || wide) return;
    setSheetHeight(
      isDetail ? Math.round(innerHeight * SITE_SHEET) : sheetLowest(),
    );
  }, [ready, isDetail, wide]);
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
          <button
            className="city-chip"
            title={t("header.cities")}
            onClick={() => {
              if (view !== "map") go("map");
              setFlight((f) => ({ key: (f?.key ?? 0) + 1, to: "globe" }));
            }}
          >
            <i className="city-motif" aria-hidden="true" />
            {cityName}
          </button>
        </div>
        <div className="lang-switch" role="group" aria-label={t("lang.switch")}>
          {LANGS.map((l) => (
            <button
              key={l}
              lang={l}
              aria-pressed={lang === l}
              onClick={() => changeLanguage(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          className={`profile-button ${view === "profile" ? "active" : ""}`}
          aria-label={t("header.profile")}
          onClick={() => go("profile")}
        >
          <span className="avatar">
            {(account?.email?.[0] ?? "G").toLocaleUpperCase(lang === "en" ? "en" : "tr")}
          </span>
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
              live={live}
              mapSettings={mapSettings}
              saveMapSettings={saveMapSettings}
            />
            </LangProvider>
          )}
          {view === "history" && site && (
            <HistoryView
              key={site.id}
              site={site}
              sites={published}
              onBack={() => go("detail", site.id)}
              onMemory={() => setOverlay("memory")}
              onSite={selectSite}
            />
          )}
          {view === "memories" && site && (
            <LivingMemory
              key={site.id}
              site={site}
              state={state}
              onBack={() => go("detail", site.id)}
              onAdd={() => setOverlay("memory")}
              onHistory={() => go("history", site.id)}
              onAbout={() => setOverlay("about")}
            />
          )}
          {showMap && (
            <main
              id="main-content"
              tabIndex={-1}
              style={
                sheetHeight
                  ? ({ "--sheet-h": `${sheetHeight}px` } as CSSProperties)
                  : undefined
              }
              className={`workspace ${collapsed ? "panel-collapsed" : ""} ${isDetail ? "on-site" : "on-map"} ${peekSite && !isDetail ? "peeking" : ""}`}
            >
              <aside
                ref={sheet}
                className={`side-panel${sheetDragging ? " dragging" : ""}`}
                aria-label={t("app.panelAria")}
                hidden={collapsed}
                onPointerDown={(e) => {
                  const target = (e.target as HTMLElement).closest(
                    isDetail
                      ? ".sheet-grip"
                      : ".sheet-grip, .explore-tabs, .explore-heading",
                  );
                  if (!target) return;
                  sheetDrag.current = {
                    y: e.clientY,
                    height: sheetHeight,
                    handle: target.classList.contains("sheet-grip"),
                    moved: false,
                  };
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
                  setSheetHeight(
                    clampSheet(
                      drag.height + drag.y - e.clientY,
                      sheetLowest(),
                      innerHeight,
                    ),
                  );
                }}
                onPointerUp={(e) => {
                  const drag = sheetDrag.current;
                  sheetDrag.current = null;
                  if (!drag) return;
                  setSheetDragging(false);
                  const lowest = sheetLowest();
                  if (drag.moved)
                    setSheetHeight(
                      settleSheet(
                        drag.height + drag.y - e.clientY,
                        lowest,
                        innerHeight,
                      ),
                    );
                  else if (drag.handle)
                    setSheetHeight(toggleSheet(drag.height, lowest, innerHeight));
                }}
                onPointerCancel={() => {
                  sheetDrag.current = null;
                  setSheetDragging(false);
                }}
              >
                <div className="sheet-grip" aria-hidden="true" />
                {isDetail && site ? (
                  view === "story" && storySite ? (
                    <StoryPanel
                      key={storySite!.id}
                      site={storySite!}
                      index={storyIndex}
                      onIndex={setStoryIndex}
                      startListening={listening}
                      lang={lang}
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
                ) : (
                  <div className="discovery-panel">
                    {routeId && showRoutes ? (
                      <RoutePreview
                        route={route}
                        custom={routeId === "custom"}
                        sites={routeSites}
                        live={live}
                        visitedIds={state.visitedIds}
                        onBack={() => setRouteId(undefined)}
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
                        }}
                        mode={place}
                        city={cityName}
                        sites={listed}
                        total={published.length}
                        routes={routes}
                        allSites={published}
                        live={live}
                        query={query}
                        routeIds={state.routeIds}
                        visitedIds={state.visitedIds}
                        selectedId={peekId}
                        onHover={setHoverId}
                        onPick={pickSite}
                        onRoute={(id) => void toggleRoute(id)}
                        onOpenRoute={(id) => {
                          setQuery("");
                          setTab("routes");
                          setRouteId(id);
                        }}
                        onCustomRoute={() => {
                          setTab("routes");
                          setRouteId("custom");
                        }}
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
                      />
                    )}
                  </div>
                )}
              </aside>
              <div className="main-stage">
                <button
                  className="panel-toggle"
                  aria-label={collapsed ? t("app.panelOpen") : t("app.panelClose")}
                  aria-expanded={!collapsed}
                  onClick={togglePanel}
                >
                  <ChevronLeft size={16} />
                </button>
                {isDetail && site ? (
                  <Scene
                    key={`${site.id}-${view}`}
                    context={view === "story" ? "story" : "detail"}
                    site={site}
                    live={live}
                    photoId={
                      view === "story"
                        ? storyBlock?.photoId
                        : undefined
                    }
                    pose={
                      view === "story"
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
                    photoCard={
                      view === "story" && storyBlock?.showCard
                    }
                    highlights={
                      view === "story"
                        ? storyBlock?.highlights
                        : undefined
                    }
                    flow={
                      !live &&
                      view === "story" &&
                      storyBlock?.id === "akar" &&
                      !flowEnds
                    }
                    onHotspot={(id) => {
                      const index = site.stories.findIndex((s) => s.id === id);
                      if (index >= 0) openStory(false, index);
                      else setOverlay("about");
                    }}
                    onPick={pick ? pickPart : undefined}
                  />
                ) : (
                  <>
                    <HeritageMap
                      sites={routeId && routeSites.length ? routeSites : filtered}
                      selectedId={peekId}
                      highlightId={hoverId}
                      finishedIds={state.readIds}
                      {...(lookCity?.identity && {
                        routeColour: lookCity.identity.accent,
                      })}
                      onSelect={pickSite}
                      onClear={() => setPeekId(undefined)}
                      onFirstDraw={() => setMapDrawn(true)}
                      onCityInView={setCityInView}
                      onLocate={chooseNear}
                      flight={flight}
                      bottomInset={peekSite ? 0 : sheetHeight}
                      routeIds={
                        routeId ? routeSites.map((s) => s.id) : state.routeIds
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
                            onTasks={() => selectSite(peekSite.id)}
                            onNext={pickSite}
                            onRoute={() => void toggleRoute(peekSite.id)}
                            onClose={() => setPeekId(undefined)}
                          />
                        )
                      }
                    />
                    <MapChips
                      mode={place}
                      city={cityName}
                      categories={chipCategories}
                      active={roles}
                      onMode={(mode) =>
                        mode === "near" ? chooseNear() : chooseHome()
                      }
                      onToggle={(category) =>
                        setRoles((current) =>
                          toggleCategory(current, category, siteCategories),
                        )
                      }
                      onCities={() =>
                        setFlight((f) => ({
                          key: (f?.key ?? 0) + 1,
                          to: "globe",
                        }))
                      }
                    />
                  </>
                )}
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
                {view === "story" && storyBlock?.flow && flowEnds && (
                  <StoryFlowMap
                    key={storyBlock.id}
                    flow={storyBlock.flow}
                    fromName={flowEnds.fromName}
                    from={flowEnds.from}
                    to={flowEnds.to}
                  />
                )}
                {pick && (
                  <TaskPickBar
                    task={pick.task}
                    hint={pick.hint}
                    onCancel={() => setPick(null)}
                  />
                )}
                {!live && !isDetail && (
                  <div className="demo-label">
                    <span />
                    {t("app.demoLabel")}
                  </div>
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
          onClose={() => setOverlay(null)}
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
      {overlay === "visit" && site && (
        <VisitModal
          live={live}
          site={site}
          visited={state.visitedIds.includes(site.id)}
          onClose={() => setOverlay(null)}
          onVisit={() => commit({ type: "visit", siteId: site.id })}
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
    <Cities.Provider value={cityRecords}>
      <SourceSheetProvider
        fallback={defaultCity?.inventory?.name ?? ""}
        report={() =>
          setToast(t("toast.reportThanks"))
        }
      >
        {shell}
        {welcome && (
          <WelcomeCard
            site={byDisplayOrder(published)[0]}
            style={cityLook}
            onHome={() => {
              closeWelcome();
              chooseHome(false);
            }}
            onNear={() => {
              closeWelcome();
              chooseNear();
            }}
            onWaqf={() => setWaqf(true)}
            onDismiss={closeWelcome}
          />
        )}
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
              closeWelcome();
              selectSite(id);
            }}
            onClose={() => setWaqf(false)}
          />
        )}
      </SourceSheetProvider>
      {opening && (
        <OpeningScreen
          cityName={openingCity?.name}
          identity={openingCity?.identity ?? null}
          done={openingDone}
          onGone={() => setOpening(false)}
        />
      )}
    </Cities.Provider>
    </LangProvider>
  );
}
