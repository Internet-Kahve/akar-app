"use client";
import { useEffect, useRef, useState } from "react";
import {
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
import type { AdminHealth, AkarClient, ModerationPage } from "@akar/api-client";
import { Modal, Notice, Tag } from "./ui";
import { Localized, useI18n } from "./i18n";
import { SiteEditor } from "./admin-site-editor";
import { RouteAdmin, PhotoAdmin, ImportAdmin } from "./admin-collections";
import { MemoryActions } from "./memory-actions";
import { AdminMembers } from "./admin-members";
import { AdminHealthAlert } from "./admin-health";
import { AdminMapSettings } from "./admin-map-settings";
type Commit = (command: Command) => Promise<boolean>;
export function Profile({
  state,
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
  onSite: (id: string) => void;
  onAdmin: () => void;
  canManage: boolean;
  onReset: () => void;
  experimental: boolean;
  onExperimentalChange: (enabled: boolean) => void;
  commit: Commit;
  /** Present only when connected to the real API; `email` is `null` for a guest. */
  auth?: { email: string | null; onSignIn: () => void; onSignOut: () => void };
}) {
  const { lang, t } = useI18n();
  const tr = lang === "en" ? "tr" : undefined;
  const [contrast, setContrast] = useState(
      () =>
        typeof document !== "undefined" &&
        document.documentElement.dataset.contrast === "high",
    ),
    [large, setLarge] = useState(
      () =>
        typeof document !== "undefined" &&
        document.documentElement.dataset.textSize === "large",
    );
  const firstSite = state.sites.find((s) => s.status === "published");
  const badges = [
    { name: t("badge.firstStory"), earned: state.readIds.length > 0 },
    { name: t("badge.firstStep"), earned: state.visitedIds.length > 0 },
    { name: t("badge.curious"), earned: state.quizIds.length > 0 },
    {
      name: t("badge.contributor"),
      earned: state.memories.some((m) => m.status === "approved"),
    },
    { name: t("badge.wanderer"), earned: state.visitedIds.length >= 3 },
    { name: t("badge.collector"), earned: state.readIds.length >= 5 },
  ];
  return (
    <main id="main-content" tabIndex={-1} className="profile-page">
      <div className="page-intro">
        <small className="eyebrow">{t("profile.eyebrow")}</small>
        <h1>{t("profile.title")}</h1>
        <p>{t("profile.lead")}</p>
      </div>
      <div className="profile-grid">
        <aside>
          <div className="profile-card">
            <div className="avatar large">G</div>
            <h2>{state.name}</h2>
            {auth ? (
              auth.email ? (
                <>
                  <p className="muted account-email">{auth.email}</p>
                  <button className="text-btn" onClick={auth.onSignOut}>
                    {t("profile.signOut")}
                  </button>
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
            <label>
              {t("profile.contrast")}
              <input
                type="checkbox"
                checked={contrast}
                onChange={(e) => {
                  setContrast(e.target.checked);
                  document.documentElement.dataset.contrast = e.target.checked
                    ? "high"
                    : "normal";
                }}
              />
            </label>
            <label>
              {t("profile.largeText")}
              <input
                type="checkbox"
                checked={large}
                onChange={(e) => {
                  setLarge(e.target.checked);
                  document.documentElement.dataset.textSize = e.target.checked
                    ? "large"
                    : "normal";
                }}
              />
            </label>
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
          <div className="stat-grid">
            {[
              {
                icon: BookOpen,
                n: state.readIds.length,
                label: t("profile.statStories"),
              },
              {
                icon: MapPin,
                n: state.visitedIds.length,
                label: auth ? t("profile.statVerified") : t("profile.statDemo"),
              },
              {
                icon: MessageSquare,
                n: state.memories.length,
                label: t("profile.statMemories"),
              },
            ].map(({ icon: Icon, n, label }) => (
              <div className="card stat" key={label}>
                <Icon size={21} />
                <strong>{n}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          {experimental && (
            <div className="card">
              <div className="row between">
                <h3>{t("profile.badges")}</h3>
                <Tag>
                  {badges.filter((b) => b.earned).length} / {badges.length}
                </Tag>
              </div>
              <div className="badges">
                {badges.map((b) => (
                  <div key={b.name} className={b.earned ? "earned" : ""}>
                    <img
                      src={`/figma/${b.earned ? "718a4" : "b8133"}.svg`}
                      alt=""
                    />
                    <span>{b.name}</span>
                    <small>{b.earned ? t("profile.earned") : t("profile.locked")}</small>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="card">
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
