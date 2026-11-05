"use client";
import { Avatar, useAvatar } from "./avatar";
import { AvatarPicker } from "./avatar-picker";
import { AchievementMedal, BadgeMedal } from "./badge-medal";
import { BadgeCard, useHowToEarn } from "./badge-card";
import { achievements as measureAchievements, badgeEntries, type BadgeEntry } from "../lib/badges";
import { LegalDialog, type LegalKind } from "./legal-dialog";
import { AccessControls } from "./access-menu";
import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  BookOpen,
  MapPin,
  MessageSquare,
  Plus,
  Pencil,
  Check,
  X,
  ArrowRight,
  Shield,
  RotateCcw,
  Map as MapIcon,
  BarChart3,
  Camera,
} from "lucide-react";
import {
  memoryPermissions,
  type Command,
  type HeritageSite,
  type MapPlacement,
  type MapSettings,
  type Role,
  type Snapshot,
} from "@akar/domain";
import type { AdminHealth, AkarClient, ModerationPage, SiteProgress } from "@akar/api-client";
import { Modal, Motif, Notice, Tag } from "./ui";
import { Localized, useI18n } from "./i18n";
import { badgeInLang } from "../lib/task-text";
import { ConfirmDialog, MemoryActions } from "./memory-actions";
import dynamic from "next/dynamic";

// The content studio is for the team only: its screens come in their own chunks when an admin opens them, not with
// every visitor's first download (3 Nov 2026; ~186 KB of source the map never used).
const SiteEditor = dynamic(() => import("./admin-site-editor").then((m) => m.SiteEditor), { ssr: false });
const RouteAdmin = dynamic(() => import("./admin-collections").then((m) => m.RouteAdmin), { ssr: false });
const PhotoAdmin = dynamic(() => import("./admin-collections").then((m) => m.PhotoAdmin), { ssr: false });
const ImportAdmin = dynamic(() => import("./admin-collections").then((m) => m.ImportAdmin), { ssr: false });
const AdminMembers = dynamic(() => import("./admin-members").then((m) => m.AdminMembers), { ssr: false });
const AdminHealthAlert = dynamic(() => import("./admin-health").then((m) => m.AdminHealthAlert), { ssr: false });
const AdminMapSettings = dynamic(() => import("./admin-map-settings").then((m) => m.AdminMapSettings), { ssr: false });
const AdminStats = dynamic(() => import("./admin-stats").then((m) => m.AdminStats), { ssr: false });
type Commit = (command: Command) => Promise<boolean>;
export function Profile({
  state,
  progress,
  onBack,
  onLanguage,
  onSite,
  onAdmin,
  canManage,
  onReset,
  experimental,
  onExperimentalChange,
  auth,
  commit,
}: {
  state: Snapshot;
  progress: SiteProgress;
  onBack: () => void;
  onLanguage: (lang: "tr" | "en") => void;
  onSite: (id: string) => void;
  onAdmin: () => void;
  canManage: boolean;
  onReset: () => void;
  experimental: boolean;
  onExperimentalChange: (enabled: boolean) => void;
  commit: Commit;
  /** Present only when connected to the real API; `email` is `null` for a guest. */
  auth?: { email: string | null; onSignIn: () => void; onSignOut: () => void; onDelete: () => Promise<boolean> };
}) {
  const { lang, t } = useI18n();
  const [erasing, setErasing] = useState(false);
  const [legal, setLegal] = useState<LegalKind | null>(null);
  const [picking, setPicking] = useState(false);
  const [figure, setFigure] = useAvatar();
  const tr = lang === "en" ? "tr" : undefined;
  const firstSite = state.sites.find((s) => s.status === "published");
  const [openBadge, setOpenBadge] = useState<BadgeEntry | null>(null);
  const howToEarn = useHowToEarn();
  const badges = badgeEntries(state.sites, progress);
  const earnedCount = badges.filter((b) => b.held).length;
  const feats = measureAchievements({ sites: state.sites, readIds: state.readIds, memories: state.memories, progress });
  return (
    <main id="main-content" tabIndex={-1} className="profile-page">
      <header className="profile-heading">
        <button className="round-btn" onClick={onBack} aria-label={t("common.backToExplore")}><ChevronLeft size={20} /></button>
        <h1>{t("profile.title")}</h1>
      </header>
      <div className="profile-grid">
        <aside>
          <div className="profile-card">
            <div className="profile-hero" style={{ ["--figure" as string]: figure.colour }}>
              <div className="profile-cover" aria-hidden="true" />
              <button className="profile-avatar-btn" onClick={() => setPicking(true)} aria-label={t("profile.avatarChange")}>
                <Avatar figure={figure} size={96} />
                <span className="profile-avatar-edit" aria-hidden="true"><Camera size={14} /></span>
              </button>
              <h2>{state.name}</h2>
              <p className="profile-figure"><Localized tr={figure.name} en={figure.nameEn} /></p>
              <dl className="profile-stats">
                <div><dd>{earnedCount}</dd><dt>{t("profile.statBadges")}</dt></div>
                <div><dd>{state.readIds.length}</dd><dt>{t("profile.statSites")}</dt></div>
                <div><dd>{progress.tasks.length}</dd><dt>{t("profile.statTasks")}</dt></div>
              </dl>
            </div>
            {picking && <AvatarPicker current={figure.id} onPick={(id) => { setFigure(id); setPicking(false); }} onClose={() => setPicking(false)} />}
            <div className="profile-motif"><Motif /></div>
            {auth ? (
              auth.email ? (
                <>
                  <p className="muted account-email">{auth.email}</p>
                  <button className="text-btn" onClick={auth.onSignOut}>
                    {t("profile.signOut")}
                  </button>
                  <button className="text-btn danger" onClick={() => setErasing(true)}>
                    {t("profile.deleteAccount")}
                  </button>
                  {erasing && (
                    <ConfirmDialog
                      title={t("profile.deleteTitle")}
                      confirm={t("profile.deleteConfirm")}
                      onClose={() => setErasing(false)}
                      onConfirm={auth.onDelete}
                    >
                      <p>{t("profile.deleteText")}</p>
                    </ConfirmDialog>
                  )}
                </>
              ) : (
                <>
                  <p className="muted">
                    {t("profile.guest")}
                  </p>
                  <button className="btn" onClick={auth.onSignIn}>
                    {t("common.signIn")}
                  </button>
                </>
              )
            ) : (
              <p className="muted">{t("profile.demo")}</p>
            )}
          </div>
          <div className="settings card">
            <h3>{t("profile.settings")}</h3>
            <div className="profile-language" role="group" aria-label={t("profile.language")}>
              {(["tr", "en"] as const).map((language) => <button key={language} aria-pressed={lang === language} onClick={() => onLanguage(language)}>{language === "tr" ? "Türkçe" : "English"}</button>)}
            </div>
            {!auth && (
              <>
                <label>
                  {t("profile.experimental")}
                  <input
                    type="checkbox"
                    checked={experimental}
                    onChange={(event) =>
                      onExperimentalChange(event.target.checked)
                    }
                  />
                </label>
                <p className="muted">
                  {t("profile.experimentalNote")}
                </p>
              </>
            )}
            <AccessControls />
            <button className="text-btn" onClick={() => setLegal("kvkk")}>{t("profile.notice")}</button>
            <button className="text-btn" onClick={() => setLegal("licenses")}>{t("profile.licenses")}</button>
            {legal && <LegalDialog kind={legal} onClose={() => setLegal(null)} />}
            {canManage && (
              <button className="text-btn" onClick={onAdmin}>
                <Shield size={16} />
                {auth ? t("profile.admin") : t("profile.demoAdmin")}
                <ArrowRight size={15} />
              </button>
            )}
            {!auth && (
              <button className="text-btn danger" onClick={onReset}>
                <RotateCcw size={16} />
                {t("profile.reset")}
              </button>
            )}
          </div>
        </aside>
        <div className="profile-main">
          <section className="card profile-badges">
            <div className="row between"><h3>{t("profile.badges")}</h3><span>{earnedCount} / {badges.length}</span></div>
            {badges.length ? <div className="medal-grid">
              {badges.map((entry) => {
                const { badge, english } = badgeInLang(entry.badge, lang);
                return <button key={badge.id} className={`medal-tile ${entry.held ? "earned" : "locked"}`} onClick={() => setOpenBadge(entry)} aria-label={t("badge.open", { title: badge.title })}>
                  <BadgeMedal badge={entry.badge} tier={entry.tier} earned={!!entry.held} size={76} />
                  <b lang={english ? undefined : tr}>{badge.title}</b>
                  <small>{entry.held ? <Localized tr={entry.site.name} en={entry.site.nameEn} /> : howToEarn(entry)}</small>
                </button>;
              })}
            </div> : <p className="muted">{t("profile.noBadges")}</p>}
            {openBadge && <BadgeCard entry={badges.find((b) => b.badge.id === openBadge.badge.id) ?? openBadge} onClose={() => setOpenBadge(null)} onSite={(site) => { setOpenBadge(null); onSite(site.id); }} />}
          </section>
          <section className="card profile-achievements">
            <h3>{t("profile.achievements")}</h3>
            <ul className="achievement-list">
              {feats.map((a) => (
                <li key={a.id} className={a.done ? "done" : ""}>
                  <AchievementMedal id={a.id} done={a.done} size={52} />
                  <span>
                    <b>{t(`achievement.${a.id}.title`)}</b>
                    <small>{t(`achievement.${a.id}.text`)}</small>
                    {!a.done && a.progress[1] > 1 && (
                      <span className="achievement-bar" role="progressbar" aria-valuemin={0} aria-valuemax={a.progress[1]} aria-valuenow={a.progress[0]} aria-label={t(`achievement.${a.id}.title`)}>
                        <i style={{ width: `${(a.progress[0] / a.progress[1]) * 100}%` }} />
                        <em>{t("profile.achievementProgress", { have: a.progress[0], need: a.progress[1] })}</em>
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section className="card profile-saved">
            <h3>{t("profile.saved")}</h3>
            {state.savedIds.length ? state.sites.filter((site) => state.savedIds.includes(site.id)).map((site) =>
              <button className="list-row" key={site.id} onClick={() => onSite(site.id)}><Localized tr={site.name} en={site.nameEn} /><ArrowRight size={17} /></button>
            ) : <p className="muted">{t("profile.noneSaved")}</p>}
          </section>
          <div className="card profile-discovered">
            <h3>{t("profile.discovered")}</h3>
            {state.readIds.length === 0 ? (
              <div className="empty-inline">
                <BookOpen size={26} />
                <p>
                  {firstSite
                    ? t("profile.firstStory")
                    : t("profile.noSites")}
                </p>
                {firstSite && (
                  <button
                    className="text-btn"
                    onClick={() => onSite(firstSite.id)}
                  >
                    {t("profile.start")} <ArrowRight size={15} />
                  </button>
                )}
              </div>
            ) : (
              state.readIds.map((id) => (
                <button
                  className="list-row"
                  key={id}
                  onClick={() => onSite(id)}
                >
                  <span>
                    <strong>
                      {(() => {
                        const s = state.sites.find((x) => x.id === id);
                        return s && <Localized tr={s.name} en={s.nameEn} />;
                      })()}
                    </strong>
                    <small>
                      {t("profile.storyDone")}{" "}
                      {state.visitedIds.includes(id)
                        ? auth
                          ? `· ${t("profile.visitVerified")}`
                          : `· ${t("profile.visitDemo")}`
                        : ""}
                    </small>
                  </span>
                  <ArrowRight size={17} />
                </button>
              ))
            )}
          </div>
          <div className="card">
            <h3>{t("profile.shared")}</h3>
            {!state.memories.length ? (
              <p className="muted">{t("profile.noneShared")}</p>
            ) : (
              state.memories.map((m) => (
                <div className="memory-row" key={m.id}>
                  <div>
                    <strong>
                      {(() => {
                        const s = state.sites.find((x) => x.id === m.siteId);
                        return s && <Localized tr={s.name} en={s.nameEn} />;
                      })()}
                    </strong>
                    <p lang={tr}>{m.text}</p>
                    {m.reason && <small className="error" lang={tr}>{m.reason}</small>}
                    <div className="memory-actions">
                      {/* Paylaşımlarım is the author's own list: only "Sil", whatever the role. */}
                      <MemoryActions
                        memory={m}
                        siteName={
                          state.sites.find((s) => s.id === m.siteId)?.name ??
                          t("profile.siteFallback")
                        }
                        role="user"
                        own
                        commit={commit}
                      />
                    </div>
                  </div>
                  <Tag tone={m.status === "approved" ? "success" : "muted"}>
                    {m.status === "pending"
                      ? t("memory.pendingTag")
                      : m.status === "approved"
                        ? t("profile.published")
                        : t("profile.rejected")}
                  </Tag>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
export function Admin({
  state,
  commit,
  role,
  loadHealth,
  loadModeration,
  loadMembers,
  changeMemberRole,
  currentUserId,
  saveSite,
  loadPlacement,
  savePlacement,
  narrateSite,
  translateSite,
  live,
  mapSettings,
  saveMapSettings,
  loadStats,
  loadSiteStats,
}: {
  state: Snapshot;
  commit: Commit;
  role: Role;
  loadHealth: () => Promise<AdminHealth>;
  loadModeration: AkarClient["getModerationPage"];
  loadMembers: AkarClient["getMembers"];
  changeMemberRole: AkarClient["setMemberRole"];
  currentUserId: string;
  saveSite: (site: HeritageSite) => Promise<HeritageSite>;
  loadPlacement: AkarClient["getMapPlacement"];
  savePlacement: (siteId: string, placement: MapPlacement) => Promise<void>;
  narrateSite: AkarClient["narrateSite"];
  translateSite: AkarClient["translateSite"];
  live: boolean;
  mapSettings: MapSettings;
  saveMapSettings: (settings: MapSettings) => Promise<MapSettings>;
  loadStats: AkarClient["getUsageStats"];
  loadSiteStats: AkarClient["getSiteUsageStats"];
}) {
  const canEdit = role === "editor" || role === "admin";
  const [page, setPage] = useState<ModerationPage>({
    items: [],
    nextCursor: null,
  });
  const [pageBusy, setPageBusy] = useState(false);
  const [pageError, setPageError] = useState("");
  const pageGeneration = useRef(0);
  const [pageRevision, setPageRevision] = useState(0);
  const queue = live ? page.items : (state.moderationQueue ?? state.memories);
  const ownIds = new Set(state.memories.map((m) => m.id));
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [tab, setTab] = useState<
      | "sites"
      | "memories"
      | "routes"
      | "photos"
      | "import"
      | "members"
      | "map"
      | "stats"
    >(canEdit ? "sites" : "memories"),
    [filter, setFilter] = useState<"pending" | "approved" | "rejected">(
      "pending",
    ),
    [query, setQuery] = useState(""),
    [editing, setEditing] = useState<HeritageSite | null>(null),
    [reject, setReject] = useState<string>(),
    [reason, setReason] = useState(""),
    [health, setHealth] = useState<AdminHealth | null>(null),
    [healthFailed, setHealthFailed] = useState(false);
  const seesHealth = role === "moderator" || role === "admin";
  useEffect(() => {
    const generation = ++pageGeneration.current;
    if (!live || !seesHealth || tab !== "memories") return;
    setPage({ items: [], nextCursor: null });
    setPageBusy(true);
    setPageError("");
    loadModeration(filter)
      .then(
        (next) => {
          if (generation === pageGeneration.current) setPage(next);
        },
        (error) => {
          if (generation === pageGeneration.current)
            setPageError(
              error instanceof Error ? error.message : "Katkılar yüklenemedi.",
            );
        },
      )
      .finally(() => {
        if (generation === pageGeneration.current) setPageBusy(false);
      });
    return () => {
      pageGeneration.current++;
    };
  }, [live, seesHealth, tab, filter, state, loadModeration, pageRevision]);
  async function moreMemories() {
    if (pageBusy || !page.nextCursor) return;
    const generation = pageGeneration.current;
    setPageBusy(true);
    setPageError("");
    try {
      const next = await loadModeration(filter, page.nextCursor);
      if (generation === pageGeneration.current)
        setPage((previous) => ({
          items: [
            ...new Map(
              [...previous.items, ...next.items].map((m) => [m.id, m]),
            ).values(),
          ],
          nextCursor: next.nextCursor,
        }));
    } catch (error) {
      if (generation === pageGeneration.current)
        setPageError(
          error instanceof Error ? error.message : "Katkılar yüklenemedi.",
        );
    } finally {
      if (generation === pageGeneration.current) setPageBusy(false);
    }
  }
  const visibleQueue = live ? queue : queue.filter((m) => m.status === filter);
  // Re-read after every state change: a decision or deletion changes the pending count.
  useEffect(() => {
    if (!seesHealth) return;
    let cancelled = false;
    loadHealth().then(
      (h) => {
        if (cancelled) return;
        setHealth(h);
        setHealthFailed(false);
      },
      () => !cancelled && setHealthFailed(true),
    );
    return () => {
      cancelled = true;
    };
  }, [seesHealth, loadHealth, state]);
  function newSite() {
    setEditing({
      id: crypto.randomUUID(),
      name: "",
      city: "Bursa",
      district: "",
      year: "",
      architect: "",
      kind: "cami",
      coordinates: [29.0619, 40.184],
      minutes: 15,
      description: "",
      source: "",
      stories: [],
      status: "draft",
      tier: "Tier 1",
    });
  }
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={`admin-page ${navCollapsed ? "admin-nav-collapsed" : ""}`}
    >
      <button
        className="admin-nav-toggle"
        aria-label={
          navCollapsed ? "Yönetim menüsünü aç" : "Yönetim menüsünü kapat"
        }
        aria-expanded={!navCollapsed}
        onClick={() => setNavCollapsed(!navCollapsed)}
      >
        <img src="/figma/b280b.svg" alt="" />
      </button>
      <aside className="admin-nav" hidden={navCollapsed}>
        <span className="eyebrow">AKAR · İÇERİK STÜDYOSU</span>
        {canEdit && (
          <>
            <button
              className={tab === "sites" ? "active" : ""}
              disabled={!!editing}
              onClick={() => setTab("sites")}
            >
              <BookOpen size={18} />
              Eserler<Tag>{state.sites.length}</Tag>
            </button>
            <button
              disabled={!!editing}
              className={tab === "routes" ? "active" : ""}
              onClick={() => setTab("routes")}
            >
              <MapPin size={18} />
              Rotalar
            </button>
            <button
              disabled={!!editing}
              className={tab === "photos" ? "active" : ""}
              onClick={() => setTab("photos")}
            >
              <BookOpen size={18} />
              Kartlar ve fotoğraflar
            </button>
          </>
        )}
        {seesHealth && (
          <button
            className={tab === "memories" ? "active" : ""}
            disabled={!!editing}
            onClick={() => setTab("memories")}
          >
            <MessageSquare size={18} />
            Katkılar
            {!live && (
              <Tag>{queue.filter((m) => m.status === "pending").length}</Tag>
            )}
          </button>
        )}
        {role === "admin" && (
          <button
            disabled={!!editing}
            className={tab === "members" ? "active" : ""}
            onClick={() => setTab("members")}
          >
            <Shield size={18} />
            Üyeler ve roller
          </button>
        )}
        {role === "admin" && (
          <button
            disabled={!!editing}
            className={tab === "map" ? "active" : ""}
            onClick={() => setTab("map")}
          >
            <MapIcon size={18} />
            Harita ayarları
          </button>
        )}
        {role === "admin" && (
          <button
            disabled={!!editing}
            className={tab === "stats" ? "active" : ""}
            onClick={() => setTab("stats")}
          >
            <BarChart3 size={18} />
            İstatistikler
          </button>
        )}
        {!live && canEdit && (
          <button
            disabled={!!editing}
            className={tab === "import" ? "active" : ""}
            onClick={() => setTab("import")}
          >
            <Plus size={18} />
            İçe aktar
          </button>
        )}
        <Notice>
          {live
            ? "Sunucu paneli. Değişiklikler hesabının yetkileriyle kaydedilir."
            : "Demo paneli. Değişiklikler bu tarayıcıda saklanır."}
        </Notice>
      </aside>
      <div className="admin-body">
        {seesHealth && (
          <AdminHealthAlert
            health={health}
            failed={healthFailed}
            onPending={
              editing
                ? undefined
                : () => {
                    setTab("memories");
                    setFilter("pending");
                  }
            }
          />
        )}
        {editing ? (
          <SiteEditor
            key={editing.id}
            site={editing}
            sites={state.sites}
            catalogRoutes={state.catalogRoutes}
            onClose={() => setEditing(null)}
            onSave={saveSite}
            loadPlacement={loadPlacement}
            savePlacement={savePlacement}
            narrateSite={narrateSite}
            translateSite={translateSite}
            live={live}
          />
        ) : tab === "members" && role === "admin" ? (
          <AdminMembers
            loadMembers={loadMembers}
            changeRole={changeMemberRole}
            currentUserId={currentUserId}
            live={live}
          />
        ) : tab === "map" && role === "admin" ? (
          <AdminMapSettings
            settings={mapSettings}
            onSave={saveMapSettings}
            live={live}
          />
        ) : tab === "stats" && role === "admin" ? (
          <AdminStats
            loadStats={loadStats}
            loadSiteStats={loadSiteStats}
            live={live}
          />
        ) : tab === "routes" ? (
          <RouteAdmin state={state} commit={commit} />
        ) : tab === "photos" ? (
          <PhotoAdmin state={state} commit={commit} live={live} />
        ) : tab === "import" ? (
          <ImportAdmin state={state} commit={commit} />
        ) : (
          <section className="admin-main">
            <div className="row between">
              <div>
                <small className="eyebrow">İNTERNET KAHVE</small>
                <h1>
                  {tab === "sites" ? "Eserler" : "Yaşayan hafızayı yönet"}
                </h1>
              </div>
              {tab === "sites" && (
                <button className="btn" onClick={newSite}>
                  <Plus size={17} />
                  Yeni eser
                </button>
              )}
            </div>
            {tab === "sites" ? (
              <>
                <input
                  className="admin-search"
                  placeholder="Eser ara…"
                  aria-label="Panelde eser ara"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Eser</th>
                        <th>Şehir</th>
                        <th>Dönem</th>
                        <th>Seviye</th>
                        <th>Durum</th>
                        <th>
                          <span className="sr-only">Düzenle</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.sites
                        .filter((s) =>
                          s.name
                            .toLocaleLowerCase("tr")
                            .includes(query.toLocaleLowerCase("tr")),
                        )
                        .map((s) => (
                          <tr key={s.id}>
                            <td>
                              <strong>{s.name}</strong>
                              <small>{s.stories.length} hikâye bölümü</small>
                            </td>
                            <td>{s.city}</td>
                            <td>{s.year || "—"}</td>
                            <td>
                              <Tag>{s.tier}</Tag>
                            </td>
                            <td>
                              <Tag
                                tone={
                                  s.status === "published" ? "success" : "muted"
                                }
                              >
                                {s.status === "published"
                                  ? "Yayında"
                                  : "Taslak"}
                              </Tag>
                            </td>
                            <td>
                              <button
                                className="icon-btn"
                                aria-label={`${s.name} düzenle`}
                                onClick={() => setEditing(s)}
                              >
                                <Pencil size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
                <div className="segmented admin-tabs">
                  {(["pending", "approved", "rejected"] as const).map((s) => (
                    <button
                      key={s}
                      className={s === filter ? "active" : ""}
                      onClick={() => setFilter(s)}
                    >
                      {s === "pending"
                        ? "Bekleyen"
                        : s === "approved"
                          ? "Onaylanan"
                          : "Reddedilen"}{" "}
                      {!live && (
                        <>· {queue.filter((m) => m.status === s).length}</>
                      )}
                    </button>
                  ))}
                </div>
                {pageError && (
                  <div role="alert">
                    {pageError}{" "}
                    <button
                      disabled={pageBusy}
                      onClick={() => setPageRevision((n) => n + 1)}
                    >
                      Yeniden dene
                    </button>
                  </div>
                )}
                {pageBusy && <p role="status">Katkılar yükleniyor…</p>}
                {!visibleQueue.length && !pageBusy ? (
                  <div className="empty-state">
                    <Shield size={36} />
                    <h3>Bu listede katkı yok</h3>
                    <p>
                      Eser sayfasındaki İz Bırak ile yeni bir katkı
                      oluşturabilirsin.
                    </p>
                  </div>
                ) : (
                  visibleQueue.map((m) => {
                    const own = ownIds.has(m.id);
                    const can = memoryPermissions(role, m.status, own);
                    return (
                      <div className="card moderation-card" key={m.id}>
                        {m.photo && (
                          <img
                            className="memory-photo"
                            src={m.photo}
                            alt="Ziyaretçi katkısı"
                          />
                        )}
                        <div className="grow">
                          <small>
                            {state.sites.find((s) => s.id === m.siteId)?.name} ·{" "}
                            {m.author}
                          </small>
                          <p>{m.text}</p>
                          <Tag>{m.photo ? "Fotoğraf + anı" : "Sadece anı"}</Tag>
                          {m.reason && <p className="error">{m.reason}</p>}
                        </div>
                        <div className="moderation-actions">
                          <div className="row">
                            {can.decide && (
                              <>
                                <button
                                  className="btn"
                                  onClick={() =>
                                    void commit({
                                      type: "moderate",
                                      id: m.id,
                                      status: "approved",
                                    })
                                  }
                                >
                                  <Check size={15} />
                                  Onayla
                                </button>
                                <button
                                  className="btn secondary"
                                  onClick={() => {
                                    setReject(m.id);
                                    setReason("");
                                  }}
                                >
                                  <X size={15} />
                                  Reddet
                                </button>
                              </>
                            )}
                            <MemoryActions
                              variant="button"
                              memory={m}
                              siteName={
                                state.sites.find((s) => s.id === m.siteId)
                                  ?.name ?? "Eser"
                              }
                              role={role}
                              own={own}
                              commit={commit}
                            />
                          </div>
                          {can.takedown && (
                            <small>
                              Yayından kaldırırken ret nedeni seçmek zorunlu
                            </small>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                {live && page.nextCursor && (
                  <button
                    className="btn secondary"
                    disabled={pageBusy}
                    onClick={() => void moreMemories()}
                  >
                    Daha fazla katkı yükle
                  </button>
                )}
              </>
            )}
          </section>
        )}
      </div>
      {reject && (
        <Modal title="Katkıyı reddet" onClose={() => setReject(undefined)}>
          <label className="field">
            Ret nedeni
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Kullanıcıya açıklanacak nedeni yaz…"
            />
          </label>
          <div className="modal-actions">
            <button
              className="btn"
              disabled={!reason.trim()}
              onClick={async () => {
                if (
                  await commit({
                    type: "moderate",
                    id: reject,
                    status: "rejected",
                    reason,
                  })
                )
                  setReject(undefined);
              }}
            >
              Nedeniyle reddet
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
