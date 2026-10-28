"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Search,
  ChevronDown,
  MapPin,
  Route,
  Landmark,
  Compass,
  Bookmark,
  Clock3,
  Footprints,
  Headphones,
  BookOpen,
  History,
  MessageSquare,
  X,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Coffee,
  Puzzle,
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
  defaultMapSettings,
  filterSites,
  kindLabels,
  trustLabels,
  normalize,
  type Command,
  type HeritageSite,
  type MapPlacement,
  type MapSettings,
  type Role,
  type Snapshot,
} from "@akar/domain";
import { HeritageMap } from "./heritage-map";
import { Architecture, Scene } from "./scene";
import { HistoryView } from "./history-view";
import { StoryPanel } from "./story-panel";
import { MemoryModal, QuizModal, VisitModal } from "./interaction-modals";
import { Profile, Admin } from "./profile-admin";
import { MemoryActions } from "./memory-actions";
import { SignInModal } from "./sign-in-modal";
import { Modal, Tag, Notice, Back, Motif } from "./ui";
import { describeError, needsSignIn } from "../lib/errors";
import { apiUrl, getSupabase } from "../lib/supabase";
import { setUploadProgress } from "../lib/upload-progress";
type View =
  | "map"
  | "sites"
  | "routes"
  | "detail"
  | "story"
  | "profile"
  | "admin"
  | "history";
type Overlay =
  | "memory"
  | "quiz"
  | "together"
  | "visit"
  | "about"
  | "memories"
  | "city"
  | "reset"
  | null;
const navigation = [
  { view: "map" as View, label: "Harita", icon: Compass },
  { view: "routes" as View, label: "Rotalar", icon: Route },
  { view: "sites" as View, label: "Eserler", icon: Landmark },
];
/** The catalog is read again this often, and whenever the tab comes back to the front. */
const CATALOG_REFRESH_MS = 5 * 60_000;
export function AkarApp() {
  const [state, setState] = useState<Snapshot>(createSeed),
    [ready, setReady] = useState(false),
    [experimental, setExperimental] = useState(false),
    [storyLayout, setStoryLayout] = useState<"panel" | "subtitle">("panel"),
    [view, setView] = useState<View>("map"),
    [siteId, setSiteId] = useState("ulu-cami"),
    [query, setQuery] = useState(""),
    [kind, setKind] = useState("all"),
    [saved, setSaved] = useState(false),
    [tab, setTab] = useState<"routes" | "sites">("routes"),
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
  const [mapSettings, setMapSettings] =
    useState<MapSettings>(defaultMapSettings);
  const client = useRef<AkarClient | null>(null),
    loaded = useRef(false),
    consent = useRef<{ textVersion: string } | null>(null),
    accountId = useRef<string | null | undefined>(undefined);
  const live = !!apiUrl;
  const role: Role = state.role ?? (live ? "user" : "admin");
  const canManage = !live || (!!account && role !== "user");
  const showExperimental = !live && experimental;
  /** Map settings are a refinement: when they cannot be read the map keeps the values it has. */
  const loadMapSettings = useCallback(async () => {
    try {
      if (client.current) setMapSettings(await client.current.getMapSettings());
    } catch {}
  }, []);
  const load = useCallback(async () => {
    if (!client.current) return;
    if (!loaded.current) setLoadError("");
    try {
      setState(await client.current.getSnapshot());
      loaded.current = true;
      setReady(true);
      void loadMapSettings();
    } catch (e) {
      const message = describeError(e, "Veriler yüklenemedi.");
      if (loaded.current) setFault(message);
      else setLoadError(message);
    }
  }, [loadMapSettings]);
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
            setToast("Oturumun sona erdi. Yeniden giriş yapabilirsin.");
          },
          getMemoryConsent: () => consent.current,
          onUploadProgress: setUploadProgress,
          locate: () =>
            new Promise((resolve, reject) => {
              if (!navigator.geolocation) {
                reject(
                  new Error("Bu cihaz konum doğrulamasını desteklemiyor."),
                );
                return;
              }
              navigator.geolocation.getCurrentPosition(
                (p) =>
                  resolve({
                    coordinates: [p.coords.longitude, p.coords.latitude],
                    accuracyM: p.coords.accuracy,
                  }),
                (error) =>
                  reject(
                    new Error(
                      error.code === 1
                        ? "Ziyareti doğrulamak için konum izni vermelisin."
                        : error.code === 3
                          ? "Konum alınması zaman aşımına uğradı. Yeniden dene."
                          : "Konum alınamadı. Konum hizmetlerini kontrol et.",
                    ),
                  ),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
              );
            }),
        })
      : createMockClient(storage);
    void load();
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
  }, [load]);
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
  const go = useCallback((next: View, id?: string) => {
    setView(next);
    setCollapsed(false);
    if (id) setSiteId(id);
    setOverlay(null);
    const p = new URLSearchParams({ view: next });
    if (id) p.set("site", id);
    window.location.hash = p.toString();
  }, []);
  /** Runs a command; resolves to the error message, or `null` on success. */
  const run = useCallback(async (command: Command) => {
    try {
      if (!client.current) return "İşlem şu an yapılamıyor.";
      setState(await client.current.dispatch(command));
      return null;
    } catch (e) {
      const message = describeError(e, "İşlem tamamlanamadı.");
      if (needsSignIn(e)) setSignIn(message);
      else setFault(message);
      return message;
    }
  }, []);
  const commit = useCallback(
    async (command: Command) => (await run(command)) === null,
    [run],
  );
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
  const signOut = () => {
    void getSupabase()?.auth.signOut();
    setToast("Çıkış yaptın.");
  };
  const site = state.sites.find(
    (s) => s.id === siteId && s.status === "published",
  );
  const filtered = useMemo(
    () =>
      filterSites(state.sites, query, kind, saved ? state.savedIds : undefined),
    [state.sites, state.savedIds, query, kind, saved],
  );
  const published = useMemo(
    () => state.sites.filter((s) => s.status === "published"),
    [state.sites],
  );
  const routes = (state.catalogRoutes ?? (live ? [] : seedRoutes)).filter(
    (r) => r.status !== "draft",
  );
  const cities = [...new Set(published.map((s) => s.city))];
  const firstStory = published.find((s) => s.stories.length > 0);
  const route = routes.find((r) => r.id === routeId);
  const routeSites = (
    routeId === "custom" ? state.routeIds : (route?.siteIds ?? [])
  )
    .map((id) => published.find((s) => s.id === id))
    .filter((s): s is HeritageSite => !!s);
  const isDetail = ["detail", "story"].includes(view),
    showMap = !["profile", "admin", "history"].includes(view),
    showRoutes =
      (view === "routes" || (view === "map" && tab === "routes")) && !query;
  function selectSite(id: string) {
    setStoryIndex(0);
    go("detail", id);
  }
  function openStory(listen = false, index = 0) {
    setStoryIndex(index);
    setListening(listen);
    go("story", siteId);
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
  }, []);
  const list = (
    <div className="site-list">
      {query &&
        routes
          .filter((r) => normalize(r.name).includes(normalize(query)))
          .map((r) => (
            <button
              key={r.id}
              className="search-route-result"
              onClick={() => {
                setQuery("");
                setRouteId(r.id);
                go("routes");
              }}
            >
              <Route size={18} />
              <span>
                <strong>{r.name}</strong>
                <small>Rota · {r.siteIds.length} durak</small>
              </span>
              <ArrowRight size={16} />
            </button>
          ))}
      {filtered.length ? (
        filtered.map((s) => (
          <SiteCard
            live={live}
            key={s.id}
            site={s}
            saved={state.savedIds.includes(s.id)}
            visited={state.visitedIds.includes(s.id)}
            onClick={() => selectSite(s.id)}
            onSave={() => void commit({ type: "save", siteId: s.id })}
          />
        ))
      ) : query &&
        routes.some((r) =>
          normalize(r.name).includes(normalize(query)),
        ) ? null : (
        <div className="empty-state">
          <Search size={30} />
          <h3>Bu keşif henüz başlamadı.</h3>
          <p>Başka bir eser ara veya filtrelerini temizle.</p>
          <button
            className="btn secondary"
            onClick={() => {
              setQuery("");
              setKind("all");
              setSaved(false);
            }}
          >
            Filtreleri temizle
          </button>
        </div>
      )}
    </div>
  );
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        İçeriğe geç
      </a>
      <header className="topbar">
        <button
          className="brand"
          onClick={() => {
            setRouteId(undefined);
            setQuery("");
            go("map");
          }}
          aria-label="Akar ana sayfa"
        >
          <span className="brand-mark">
            <Landmark size={22} />
          </span>
          <span>
            akar<span className="brand-dot">.</span>
          </span>
        </button>
        <div className="global-search">
          <Search size={18} />
          <input
            aria-label="Eser, şehir veya rota ara"
            placeholder="Eser, şehir veya rota ara"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!["map", "sites", "routes"].includes(view)) go("sites");
            }}
          />
          {query && (
            <button
              className="small-icon"
              aria-label="Aramayı temizle"
              onClick={() => setQuery("")}
            >
              <X size={15} />
            </button>
          )}
          <button className="city-chip" onClick={() => setOverlay("city")}>
            {ready && cities.length === 1 ? cities[0] : "Şehirler"}
            <ChevronDown size={13} />
          </button>
        </div>
        <nav aria-label="Ana navigasyon">
          {navigation.map(({ view: v, label, icon: Icon }) => (
            <button
              key={v}
              className={
                view === v || (v === "map" && isDetail) ? "active" : ""
              }
              onClick={() => {
                setRouteId(undefined);
                setQuery("");
                go(v);
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
          <button
            className={view === "story" ? "active" : ""}
            disabled={!ready || !firstStory}
            onClick={() => {
              setStoryIndex(0);
              setListening(false);
              if (firstStory) go("story", firstStory.id);
            }}
          >
            <Headphones size={16} />
            Evden gez
          </button>
        </nav>
        <button
          className={`profile-button ${view === "profile" ? "active" : ""}`}
          aria-label="Mirasım profilini aç"
          onClick={() => go("profile")}
        >
          <span className="avatar">G</span>
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
                Yeniden dene
              </button>
            </>
          ) : (
            "Keşif hazırlanıyor…"
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
              {state.pendingRouteCount} durak hesabındaki rotaya taşınamadı ve
              bu cihazda korundu. Rotam en fazla 100 durak alır. Yer açtıktan
              sonra sayfayı yenileyerek yeniden deneyebilirsin.
            </Notice>
          )}
          {view === "admin" && !canManage && (
            <main id="main-content" tabIndex={-1} className="profile-page">
              <h1>Yönetim paneli</h1>
              <Notice>
                {account
                  ? "Bu hesabın yönetim yetkisi bulunmuyor."
                  : "Yönetim paneline erişmek için yetkili hesabınla giriş yap."}
              </Notice>
              {!account && (
                <button className="btn" onClick={() => setSignIn("")}>
                  Giriş yap
                </button>
              )}
            </main>
          )}
          {view === "admin" && canManage && (
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
            />
          )}
          {view === "history" && site && (
            <HistoryView
              key={site.id}
              site={site}
              onBack={() => go("detail", site.id)}
              onMemory={() => setOverlay("memory")}
            />
          )}
          {showMap && (
            <main
              id="main-content"
              tabIndex={-1}
              className={`workspace ${collapsed ? "panel-collapsed" : ""} ${view === "story" && storyLayout === "subtitle" ? "story-subtitle" : ""}`}
            >
              <aside
                className="side-panel"
                aria-label="Keşif paneli"
                hidden={collapsed}
              >
                {isDetail && site ? (
                  view === "story" && site.stories.length > 0 ? (
                    <StoryPanel
                      key={site.id}
                      site={site}
                      index={storyIndex}
                      onIndex={setStoryIndex}
                      startListening={listening}
                      layout={storyLayout}
                      onLayoutChange={setStoryLayout}
                      onClose={() => go("detail", site.id)}
                      onComplete={async () => {
                        if (await commit({ type: "read", siteId: site.id })) {
                          setToast(
                            state.readIds.includes(site.id)
                              ? "Hikâyeyi yeniden keşfettin."
                              : "Hikâye tamamlandı.",
                          );
                          go("detail", site.id);
                        }
                      }}
                    />
                  ) : (
                    <div className="detail-panel">
                      <Back onClick={() => go("map")}>Haritaya dön</Back>
                      <div className="detail-title">
                        <div className="row between">
                          <Tag>
                            {kindLabels[site.kind]} ·{" "}
                            {site.district.split(" · ")[0]}
                          </Tag>
                          <button
                            className={`icon-btn ${state.savedIds.includes(site.id) ? "saved" : ""}`}
                            aria-label="Eseri kaydet"
                            aria-pressed={state.savedIds.includes(site.id)}
                            onClick={() =>
                              void commit({ type: "save", siteId: site.id })
                            }
                          >
                            <Bookmark size={19} />
                          </button>
                        </div>
                        <h1>{site.name}</h1>
                        <p>
                          {[site.architect, site.year]
                            .filter((value) => value && value !== "—")
                            .join(" · ")}
                        </p>
                        <Tag tone="representative">
                          {site.sources?.length
                            ? "Kaynaklı içerik"
                            : "Örnek veri · doğrulama bekliyor"}
                        </Tag>
                      </div>
                      <Motif />
                      <p className="description">{site.description}</p>
                      <div className="detail-metadata">
                        <span>
                          <Clock3 size={15} />
                          {site.minutes} dk keşif
                        </span>
                        <span>
                          <BookOpen size={15} />
                          {site.stories.length} bölüm
                        </span>
                      </div>
                      {site.stories.length > 0 ? (
                        <div className="story-actions">
                          <button
                            className="btn"
                            onClick={() => openStory(true)}
                          >
                            <Headphones size={18} />
                            Hikâyeyi dinle
                          </button>
                          <button
                            className="btn secondary"
                            onClick={() => openStory()}
                          >
                            <BookOpen size={18} />
                            Oku
                          </button>
                        </div>
                      ) : (
                        <Notice>Bu eserin anlatımı henüz hazırlanmadı.</Notice>
                      )}
                      {showExperimental && (
                        <p className="muted">
                          Deneysel arayüzler açık · kapsam kararı bekleniyor
                        </p>
                      )}
                      <div className="experience-grid">
                        {[
                          {
                            icon: History,
                            label: "Geçmişi Gör",
                            action: () => go("history", site.id),
                          },
                          {
                            icon: MessageSquare,
                            label: "İz Bırak",
                            action: () => setOverlay("memory"),
                          },
                          ...(showExperimental
                            ? [
                                {
                                  icon: Puzzle,
                                  label: "Bulmaca",
                                  action: () => setOverlay("quiz"),
                                },
                                {
                                  icon: Users,
                                  label: "Birlikte Gez",
                                  action: () => setOverlay("together"),
                                },
                              ]
                            : []),
                        ].map(({ icon: Icon, label, action }) => (
                          <button key={label} onClick={action}>
                            <Icon size={21} />
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>
                      <button
                        className="detail-link"
                        onClick={() => setOverlay("about")}
                      >
                        <span>
                          <strong>Eser hakkında</strong>
                          <small>Tarihçe, mimari ve kaynaklar</small>
                        </span>
                        <ArrowRight size={17} />
                      </button>
                      <button
                        className="detail-link"
                        onClick={() => setOverlay("memories")}
                      >
                        <span>
                          <strong>Yaşayan hafıza</strong>
                          <small>
                            {approvedMemories(state, site.id).length} onaylanmış
                            anı
                          </small>
                        </span>
                        <ArrowRight size={17} />
                      </button>
                      <div className="detail-bottom">
                        <button
                          className="btn secondary"
                          onClick={async () => {
                            if (
                              await commit({ type: "route", siteId: site.id })
                            )
                              setToast(
                                state.routeIds.includes(site.id)
                                  ? "Eser rotandan çıkarıldı."
                                  : "Eser rotana eklendi.",
                              );
                          }}
                        >
                          <Route size={17} />
                          {state.routeIds.includes(site.id)
                            ? "Rotamdan çıkar"
                            : "Rotama ekle"}
                        </button>
                        <button
                          className="btn"
                          onClick={() => setOverlay("visit")}
                        >
                          <MapPin size={17} />
                          {state.visitedIds.includes(site.id)
                            ? "Ziyaretim"
                            : "Yanındayım"}
                        </button>
                      </div>
                    </div>
                  )
                ) : isDetail && !site ? (
                  <div className="empty-state">
                    <h2>Eser bulunamadı</h2>
                    <button className="btn" onClick={() => go("map")}>
                      Keşfe dön
                    </button>
                  </div>
                ) : (
                  <div className="discovery-panel">
                    {routeId && showRoutes ? (
                      <>
                        <Back onClick={() => setRouteId(undefined)}>
                          Tüm rotalar
                        </Back>
                        <div className="route-cover">
                          <SiteArtwork site={routeSites[0]} live={live} />
                          <Tag>
                            {routeId === "custom"
                              ? "SENİN ROTAN"
                              : "KÜRATÖRLÜ KEŞİF"}
                          </Tag>
                        </div>
                        <h1>
                          {routeId === "custom"
                            ? "Kendi hikâyeni çiz"
                            : route?.name}
                        </h1>
                        <p className="muted">
                          {routeSites.length} durak{" "}
                          {route && `· ${route.minutes} dk · ${route.distance}`}
                        </p>
                        <p>
                          {route?.description ??
                            "Seçtiğin eserleri sırayla keşfet. Her durak yeni bir hikâye."}
                        </p>
                        <div className="route-stop-list">
                          {routeSites.map((s, i) => (
                            <button key={s.id} onClick={() => selectSite(s.id)}>
                              <span
                                className={`stop-number ${state.visitedIds.includes(s.id) ? "visited" : ""}`}
                              >
                                {state.visitedIds.includes(s.id) ? (
                                  <Check size={15} />
                                ) : (
                                  i + 1
                                )}
                              </span>
                              <span>
                                <strong>{s.name}</strong>
                                <small>
                                  {s.year} · {s.minutes} dk
                                </small>
                              </span>
                              <ArrowRight size={15} />
                            </button>
                          ))}
                        </div>
                        {routeSites.length === 0 ? (
                          <Notice>
                            Başlamak için bir eser aç ve “Rotama ekle”yi seç.
                          </Notice>
                        ) : (
                          <>
                            <Notice>
                              Durakları birleştiren çizgi şematiktir; yürüyüş
                              yol tarifi değildir.
                            </Notice>
                            <button
                              className="btn full"
                              onClick={async () => {
                                const ids = routeSites.map((s) => s.id);
                                if (
                                  await commit({
                                    type: "set-route",
                                    siteIds: ids,
                                  })
                                ) {
                                  selectSite(
                                    ids.find(
                                      (id) => !state.visitedIds.includes(id),
                                    ) ?? ids[0],
                                  );
                                  setToast(
                                    "Rotan hazır. Durakları keşfetmeye başla.",
                                  );
                                }
                              }}
                            >
                              <Footprints size={18} />
                              {routeSites.every((s) =>
                                state.visitedIds.includes(s.id),
                              )
                                ? "Rotayı yeniden keşfet"
                                : "Rotayı başlat"}
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="discovery-intro">
                          <div className="eyebrow">
                            <span className="live-dot" />
                            BURSA’YI YENİDEN KEŞFET
                          </div>
                          <h1>
                            Şehrin hikâyesine <br />
                            karış.
                          </h1>
                          <p>Geçmişi gör. Hikâyesini dinle. İzini bırak.</p>
                        </div>
                        <div className="segmented discovery-tabs">
                          <button
                            className={showRoutes ? "active" : ""}
                            onClick={() => {
                              setQuery("");
                              setTab("routes");
                              go("map");
                            }}
                          >
                            <Route size={16} />
                            Rotalar
                          </button>
                          <button
                            className={!showRoutes ? "active" : ""}
                            onClick={() => {
                              setTab("sites");
                              go("sites");
                            }}
                          >
                            <Landmark size={16} />
                            Eserler
                          </button>
                        </div>
                        {showRoutes ? (
                          <>
                            <div className="section-heading">
                              <h2>Sana ilham verecek rotalar</h2>
                              <span>
                                {
                                  routes.filter((r) =>
                                    normalize(r.name).includes(
                                      normalize(query),
                                    ),
                                  ).length
                                }{" "}
                                rota
                              </span>
                            </div>
                            <div className="route-cards">
                              {routes
                                .filter((r) =>
                                  normalize(r.name).includes(normalize(query)),
                                )
                                .map((r, i) => (
                                  <button
                                    className="route-card"
                                    key={r.id}
                                    onClick={() => setRouteId(r.id)}
                                  >
                                    <div className={`route-art art-${i}`}>
                                      <SiteArtwork
                                        site={published.find((s) =>
                                          r.siteIds.includes(s.id),
                                        )}
                                        live={live}
                                      />
                                      <span>
                                        {String(i + 1).padStart(2, "0")}
                                      </span>
                                    </div>
                                    <div className="route-card-body">
                                      <small>{r.theme}</small>
                                      <h3>{r.name}</h3>
                                      <p>
                                        <MapPin size={12} />
                                        {r.siteIds.length} durak <i />{" "}
                                        {r.minutes} dk <i />
                                        {r.distance}
                                      </p>
                                    </div>
                                    <ArrowRight size={18} />
                                  </button>
                                ))}
                            </div>
                            <button
                              className="custom-route"
                              onClick={() => {
                                setRouteId("custom");
                                go("routes");
                              }}
                            >
                              <span className="route-circle">
                                <Route size={22} />
                              </span>
                              <span>
                                <strong>Kendi rotanı oluştur</strong>
                                <small>
                                  {state.routeIds.length
                                    ? `${state.routeIds.length} eser seni bekliyor`
                                    : "Merak ettiğin yerleri bir araya getir"}
                                </small>
                              </span>
                              <PlusIcon />
                            </button>
                            <div className="daily-note">
                              <Sparkles size={20} />
                              <p>
                                <strong>Bir yapı, diğerini yaşatır.</strong>
                                Vakıf eserlerinin görünmeyen bağlarını keşfet.
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="section-heading">
                              <h2>
                                {saved
                                  ? "Kaydettiklerin"
                                  : "Keşfedilecek eserler"}
                              </h2>
                              <button
                                className={`small-icon ${saved ? "active" : ""}`}
                                onClick={() => setSaved(!saved)}
                                aria-label="Yalnızca kaydedilenleri göster"
                                aria-pressed={saved}
                              >
                                <Bookmark size={18} />
                              </button>
                            </div>
                            <div className="filter-row">
                              {[
                                "all",
                                "cami",
                                "turbe",
                                "cesme",
                                "hamam",
                                "han",
                                "bedesten",
                                "egitim",
                              ].map((k) => (
                                <button
                                  key={k}
                                  className={kind === k ? "active" : ""}
                                  onClick={() => setKind(k)}
                                >
                                  {k === "all"
                                    ? "Tümü"
                                    : kindLabels[k as keyof typeof kindLabels]}
                                </button>
                              ))}
                            </div>
                            <p className="results-count">
                              {filtered.length} eser {query && `· “${query}”`}
                            </p>
                            {list}
                          </>
                        )}
                      </>
                    )}
                    <footer className="panel-footer">
                      <Coffee size={14} />
                      <span>İnternet Kahve</span>
                      <span>KÖK&KOD 2026</span>
                    </footer>
                  </div>
                )}
              </aside>
              <div className="main-stage">
                <button
                  className="panel-toggle"
                  aria-label={collapsed ? "Paneli aç" : "Paneli kapat"}
                  aria-expanded={!collapsed}
                  onClick={togglePanel}
                >
                  {collapsed ? (
                    <PanelLeftOpen size={18} />
                  ) : (
                    <PanelLeftClose size={18} />
                  )}
                </button>
                {isDetail && site ? (
                  <Scene
                    key={`${site.id}-${view === "story" ? storyIndex : "detail"}`}
                    site={site}
                    live={live}
                    photoId={
                      view === "story"
                        ? site.stories[storyIndex]?.photoId
                        : undefined
                    }
                    flow={
                      !live &&
                      view === "story" &&
                      site.stories[storyIndex]?.id === "akar"
                    }
                    onHotspot={(id) => {
                      const index = site.stories.findIndex((s) => s.id === id);
                      if (index >= 0) openStory(false, index);
                      else setOverlay("about");
                    }}
                  />
                ) : (
                  <HeritageMap
                    sites={filtered}
                    selectedId={undefined}
                    onSelect={selectSite}
                    routeIds={
                      routeId ? routeSites.map((s) => s.id) : state.routeIds
                    }
                    collapsed={collapsed}
                    mapSettings={mapSettings}
                  />
                )}
                {!live && (
                  <div className="demo-label">
                    <span />
                    İnteraktif demo
                  </div>
                )}
              </div>
            </main>
          )}
        </>
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
        <Modal title="Eser hakkında" onClose={() => setOverlay(null)}>
          <h3>{site.name}</h3>
          <p>{site.description}</p>
          <dl className="facts">
            <div>
              <dt>Dönem</dt>
              <dd>{site.year}</dd>
            </div>
            <div>
              <dt>Mimar</dt>
              <dd>{site.architect}</dd>
            </div>
            <div>
              <dt>Konum</dt>
              <dd>
                {site.city} · {site.district}
              </dd>
            </div>
          </dl>
          {site.sections?.map((section) => (
            <section key={section.id}>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
              <Tag tone={section.trust}>{trustLabels[section.trust]}</Tag>
              <p className="muted">
                {
                  site.sources?.find((source) => source.id === section.sourceId)
                    ?.title
                }
              </p>
            </section>
          ))}
          <h3>Kaynak ve içerik durumu</h3>
          <p>{site.source}</p>
          {!site.sources?.length && (
            <Notice>Bu kaydın kaynaklı içerik paketi henüz eklenmedi.</Notice>
          )}
        </Modal>
      )}
      {overlay === "memories" && site && (
        <Modal title="Yaşayan hafıza" onClose={() => setOverlay(null)}>
          {approvedMemories(state, site.id).length ? (
            approvedMemories(state, site.id).map((m) => (
              <article className="card memory-public" key={m.id}>
                {m.photo && (
                  <img src={m.photo} alt="Ziyaretçinin eser fotoğrafı" />
                )}
                <strong>{m.author}</strong>
                <p>{m.text}</p>
                <Tag tone="success">
                  {live ? "Onaylanmış katkı" : "Demo moderasyonunda onaylandı"}
                </Tag>
                <div className="memory-actions">
                  <MemoryActions
                    memory={m}
                    siteName={site.name}
                    role={role}
                    own={state.memories.some((x) => x.id === m.id)}
                    commit={commit}
                  />
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <MessageSquare size={36} />
              <h3>İlk iz senin olsun.</h3>
              <p>Bu eserin yaşayan hafızası, senin hikâyenle başlayabilir.</p>
            </div>
          )}
          <button className="btn full" onClick={() => setOverlay("memory")}>
            Bir anı bırak
            <ArrowRight size={17} />
          </button>
        </Modal>
      )}
      {overlay === "city" && (
        <Modal
          title="Nerede keşfetmek istersin?"
          onClose={() => setOverlay(null)}
        >
          {cities.map((city) => (
            <button
              key={city}
              className="city-option"
              onClick={() => {
                setOverlay(null);
                setQuery(city);
                setKind("all");
                setSaved(false);
                setRouteId(undefined);
                go("map");
              }}
            >
              <MapPin />
              <span>
                <strong>{city}</strong>
                <small>
                  {published.filter((s) => s.city === city).length} eser
                </small>
              </span>
              <ArrowRight />
            </button>
          ))}
          {!cities.length && <p>Henüz yayında eser yok.</p>}
          <Notice>
            Yayındaki eserleri haritada keşfedebilir, kendi rotanı
            oluşturabilirsin.
          </Notice>
        </Modal>
      )}
      {showExperimental && overlay === "together" && (
        <Modal title="Birlikte Gez" onClose={() => setOverlay(null)}>
          <div className="empty-state">
            <Users size={40} />
            <h3>Hikâyeler birlikte güzelleşir.</h3>
            <p>
              Senkron sesli tur ve oda koduyla katılım, backend aşamasında
              eklenecek. Şimdilik aynı hikâyeyi bu cihazdan birlikte
              dinleyebilirsiniz.
            </p>
            <button className="btn" onClick={() => openStory(true)}>
              <Headphones size={18} />
              Hikâyeyi aç
            </button>
          </div>
        </Modal>
      )}
      {overlay === "reset" && (
        <Modal
          title="Demo verileri sıfırlansın mı?"
          onClose={() => setOverlay(null)}
        >
          <p>
            Bu tarayıcıdaki anılar, rota, keşif ilerlemesi ve eklediğin eserler
            silinerek başlangıç örneklerine dönülecek.
          </p>
          <div className="modal-actions">
            <button className="btn secondary" onClick={() => setOverlay(null)}>
              Vazgeç
            </button>
            <button
              className="btn"
              onClick={async () => {
                try {
                  if (client.current) setState(await client.current.reset());
                  setOverlay(null);
                  setToast("Demo başlangıca döndürüldü.");
                } catch (e) {
                  setFault(describeError(e, "Demo sıfırlanamadı."));
                }
              }}
            >
              Demo verilerini sıfırla
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
            setToast("Giriş yaptın.");
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
          <button
            className="small-icon"
            aria-label="Bildirimi kapat"
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
            aria-label="Hatayı kapat"
            onClick={() => setFault("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <nav className="mobile-nav" aria-label="Mobil navigasyon">
        {navigation.map(({ view: v, label, icon: Icon }) => (
          <button
            key={v}
            className={view === v ? "active" : ""}
            onClick={() => {
              setRouteId(undefined);
              go(v);
            }}
          >
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}
        <button
          onClick={() => go("profile")}
          className={view === "profile" ? "active" : ""}
        >
          <Bookmark size={19} />
          <span>Mirasım</span>
        </button>
      </nav>
    </div>
  );
}
function PlusIcon() {
  return <span className="plus-circle">+</span>;
}
function SiteCard({
  site,
  live,
  saved,
  visited,
  onClick,
  onSave,
}: {
  site: HeritageSite;
  live: boolean;
  saved: boolean;
  visited: boolean;
  onClick: () => void;
  onSave: () => void;
}) {
  return (
    <article className="site-card">
      <button className="site-card-main" onClick={onClick}>
        <div className={`site-thumb ${site.kind}`}>
          <SiteArtwork site={site} live={live} />
        </div>
        <span>
          <small>
            {kindLabels[site.kind]} · {site.year}
          </small>
          <strong>{site.name}</strong>
          <span className="site-meta">
            <Clock3 size={12} />
            {site.minutes} dk{" "}
            {visited && <Tag tone="success">Ziyaret edildi</Tag>}
          </span>
        </span>
      </button>
      <button
        className={`small-icon ${saved ? "saved" : ""}`}
        onClick={onSave}
        aria-label={`${site.name} kaydet`}
        aria-pressed={saved}
      >
        <Bookmark size={17} />
      </button>
    </article>
  );
}

function SiteArtwork({ site, live }: { site?: HeritageSite; live: boolean }) {
  const photo =
    site?.photos?.find((p) => p.id === site.coverPhotoId) ?? site?.photos?.[0];
  if (photo)
    return (
      <img
        className="site-photo"
        src={photo.src}
        alt={photo.alt}
        loading="lazy"
      />
    );
  return live ? (
    <div className="artwork-placeholder" aria-label="Görsel eklenmedi">
      <Landmark aria-hidden="true" size={32} />
    </div>
  ) : (
    <Architecture kind={site?.kind} />
  );
}
