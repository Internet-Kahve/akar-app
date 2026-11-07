"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flag,
  Footprints,
  LocateFixed,
  MapPin,
  Pencil,
  Plus,
  Share2,
  ShieldCheck,
  SkipForward,
  Route,
  UserRound,
  X,
} from "lucide-react";
import {
  kindCategory,
  normalize,
  type HeritageRoute,
  type HeritageSite,
  type PersonalRoute,
  type SiteCategory,
} from "@akar/domain";
import { cityCase } from "../lib/place-names";
import { siteMeta } from "../lib/site-meta";
import { legDistance, legMinutes, walkingLeg } from "../lib/route-walking";
import type { BadgeEntry } from "../lib/badges";
import { badgeInLang } from "../lib/task-text";
import { formatDistance } from "../lib/walk-position";
import { SiteArtwork } from "./site-artwork";
import { BadgeMedal } from "./badge-medal";
import { Back, Notice, Tag } from "./ui";
import { Localized, useI18n } from "./i18n";

export type ExploreTab = "sites" | "routes";
export type PlaceMode = "home" | "near";

/** Over the map: the city, a button that opens the list of cities (3 Nov 2026: role chips and «Evden gez» gone). */
/**
 * The city over the map; its ▾ opens the other cities, and a pick takes the map there at once (Muhammed, 3 Nov 2026:
 * «diğer şehirlere ışınlanılsın»). The last line shows the whole country.
 */
export function MapChips({
  city,
  cities,
  onCity,
  onCities,
  whole = false,
}: {
  city: string;
  /** The map looks at the whole country: the button shows it in red. */
  whole?: boolean;
  cities: string[];
  onCity: (name: string) => void;
  onCities: () => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", away, true);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("pointerdown", away, true);
      window.removeEventListener("keydown", key);
    };
  }, [open]);
  return (
    <div className="map-chips" ref={root}>
      <button
        className={`chip city-only city-pick${whole ? " ulke" : ""}`}
        onClick={() => setOpen(!open)}
        title={t("header.cities")}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <i className="city-motif" aria-hidden="true" />
        {city}
        <ChevronDown size={15} aria-hidden="true" className={open ? "turned" : undefined} />
      </button>
      {open && (
        <div className="city-menu" role="menu" aria-label={t("header.cities")}>
          {cities.map((name) => (
            <button
              key={name}
              role="menuitemradio"
              aria-checked={name === city}
              onClick={() => {
                setOpen(false);
                if (name !== city) onCity(name);
              }}
            >
              <span>{name}</span>
              {name === city && <Check size={16} aria-hidden="true" />}
            </button>
          ))}
          <button
            role="menuitem"
            className="city-menu-all"
            onClick={() => {
              setOpen(false);
              onCities();
            }}
          >
            {t("map.wholeCountry")}
          </button>
        </div>
      )}
    </div>
  );
}

/** One tap keeps only that role; later taps add or remove; an empty set means all of them again. */
export function toggleCategory(
  active: Set<SiteCategory>,
  category: SiteCategory,
  all: readonly SiteCategory[],
) {
  const next = active.size === all.length ? new Set<SiteCategory>() : new Set(active);
  if (active.size === all.length) next.add(category);
  else if (next.has(category)) next.delete(category);
  else next.add(category);
  return next.size ? next : new Set(all);
}

function SiteRow({
  routeIndex,
  site,
  live,
  selected,
  showModelTag,
  onPick,
  onRoute,
  onOpen,
  onHover,
}: {
  routeIndex: number;
  site: HeritageSite;
  live: boolean;
  selected: boolean;
  showModelTag: boolean;
  onPick: () => void;
  onRoute: () => void;
  /** Goes straight to the site's page; without it (a route being built) the row's button adds the site instead. */
  onOpen?: () => void;
  onHover: (id: string | undefined) => void;
}) {
  const { t, text } = useI18n();
  return (
    <li
      className={`site-row${selected ? " selected" : ""}`}
      onPointerEnter={(e) => e.pointerType === "mouse" && onHover(site.id)}
      onPointerLeave={() => onHover(undefined)}
    >
      <button className="site-row-main" onClick={onPick}>
        <SiteArtwork site={site} live={live} />
        <span>
          <strong><Localized tr={site.name} en={site.nameEn} /></strong>
          <small>
            <i className={`dot ${kindCategory[site.kind]}`} />
            {siteMeta(site)}
          </small>
          {showModelTag && site.model && <em>3D</em>}
        </span>
      </button>
      {onOpen ? (
        <button className="site-row-add" aria-label={t("explore.openSite", { name: text(site.name, site.nameEn) })} onClick={onOpen}>
          <ChevronRight size={18} />
        </button>
      ) : (
        <button
          className="site-row-add"
          aria-pressed={routeIndex > 0}
          aria-label={t("explore.addSite", { name: text(site.name, site.nameEn) })}
          onClick={onRoute}
        >
          {routeIndex > 0 ? <span>★{routeIndex}</span> : <Plus size={16} />}
        </button>
      )}
    </li>
  );
}

export function ExplorePanel({
  tab,
  onTab,
  mode,
  city,
  sites,
  total,
  routes,
  allSites,
  live,
  query,
  routeIds,
  visitedIds,
  selectedId,
  onHover,
  onPick,
  onRoute,
  onOpenRoute,
  onOpen,
  onCustomRoute,
  personalRoutes = [],
  onOpenPersonal,
  onCities,
  onClearFilters,
  categories,
  categoryCount,
  activeCategory,
  onCategory,
}: {
  tab: ExploreTab;
  onTab: (tab: ExploreTab) => void;
  mode: PlaceMode;
  city: string;
  sites: HeritageSite[];
  total: number;
  routes: HeritageRoute[];
  allSites: HeritageSite[];
  live: boolean;
  query: string;
  routeIds: string[];
  visitedIds: string[];
  selectedId?: string | undefined;
  /** The row under the mouse, or `undefined` once it leaves: the map marks that site's pin. */
  onHover: (id: string | undefined) => void;
  onPick: (id: string) => void;
  onRoute: (id: string) => void;
  onOpenRoute: (id: string) => void;
  /** Straight to a site's page from the list; left out while a route is being built. */
  onOpen?: (id: string) => void;
  onCustomRoute: () => void;
  /** The visitor's own routes with stops: cards like the city's routes, marked as theirs (6 Nov 2026). */
  personalRoutes?: PersonalRoute[];
  onOpenPersonal?: (id: string) => void;
  onCities: () => void;
  onClearFilters: () => void;
  /** The kinds of site in this list, with how many of each, whatever is chosen now. */
  categories: readonly SiteCategory[];
  categoryCount: (category: SiteCategory | null) => number;
  /** The kind the list and the map are narrowed to; `null` for all. */
  activeCategory: SiteCategory | null;
  onCategory: (category: SiteCategory | null) => void;
}) {
  const { t } = useI18n();
  const shown = routes.filter((r) =>
    normalize(r.name).includes(normalize(query)),
  );
  const heading = (noun: "routes" | "sites") =>
    mode === "near"
      ? t(noun === "routes" ? "explore.nearRoutes" : "explore.nearSites")
      : t(noun === "routes" ? "explore.cityRoutes" : "explore.citySites", {
          city,
          cityIn: cityCase(city),
        });
  const someModelMissing = allSites.some((s) => !s.model);
  return (
    <div className="explore">
      {/* Two tabs as one switch: a press anywhere on it turns to the other tab. */}
      <div className="explore-tabs" role="tablist" data-tab={tab}>
        <button
          role="tab"
          aria-selected={tab === "sites"}
          onClick={() => onTab(tab === "sites" ? "routes" : "sites")}
        >
          {t("explore.tabSites")}
        </button>
        <button
          role="tab"
          aria-selected={tab === "routes"}
          onClick={() => onTab(tab === "sites" ? "routes" : "sites")}
        >
          {t("explore.tabRoutes")}
        </button>
      </div>
      {tab === "routes" ? (
        <>
          {/* A phone has no tabs (3 Nov 2026): back to the sites from here. */}
          <button className="narrow-only explore-back" onClick={() => onTab("sites")}>
            <ChevronLeft size={16} />
            {t("explore.tabSites")}
          </button>
          {/* Rotalarım first, with the way to a new one as its last card (Muhammed, 7 Nov 2026: the big card at the foot
              outweighed the routes and covered the last one on a phone); the city's routes below, under their heading. */}
          <section className="route-cards mine" aria-label={t("route.mine")}>
            <h3 className="route-mine-heading">{t("route.mine")}</h3>
              {personalRoutes
                .filter((p) => p.siteIds.length)
                .map((p) => (
                  <button className="route-card mine" key={p.id} onClick={() => onOpenPersonal?.(p.id)}>
                    <span className="route-card-text">
                      <strong>{p.name}</strong>
                      <small>{t("explore.myRouteLine", { count: p.siteIds.length })}</small>
                      <em className="route-mine-tag">
                        <UserRound size={12} aria-hidden="true" />
                        {t("explore.myRouteTag")}
                      </em>
                    </span>
                    <span className="route-card-stops" aria-hidden="true">
                      {p.siteIds.slice(0, 4).map((id) => (
                        <SiteArtwork key={id} site={allSites.find((s) => s.id === id)} live={live} />
                      ))}
                    </span>
                    <ChevronRight size={18} className="route-card-go" />
                  </button>
                ))}
            <button className="route-new" onClick={onCustomRoute}>
              <span className="route-new-plus" aria-hidden="true"><Plus size={18} strokeWidth={2.4} /></span>
              <span className="route-card-text">
                <strong>{t("explore.custom")}</strong>
                <small>
                  {routeIds.length
                    ? t(routeIds.length === 1 ? "explore.customWaitingOne" : "explore.customWaiting", { count: routeIds.length })
                    : t("explore.customEmpty")}
                </small>
              </span>
            </button>
          </section>
          <div className="explore-heading">
            <h2>{heading("routes")}</h2>
          </div>
          <div className="route-cards">
            {shown.map((r) => {
              const stops = r.siteIds.filter((id) =>
                visitedIds.includes(id),
              ).length;
              return (
                <button
                  className="route-card"
                  key={r.id}
                  onClick={() => onOpenRoute(r.id)}
                >
                  <span className="route-card-text">
                    <strong><Localized tr={r.name} en={r.nameEn} /></strong>
                    <small>
                      {[t(r.siteIds.length === 1 ? "explore.stopCountOne" : "explore.stopCount", { count: r.siteIds.length }), ...routeTail(r, t)].join(" · ")}
                    </small>
                    {stops > 0 && (
                      <em className="going">{t("common.continueProgress", { done: stops, total: r.siteIds.length })}</em>
                    )}
                  </span>
                  {/* Its stops, a few small photographs side by side: what the walk passes by. */}
                  <span className="route-card-stops" aria-hidden="true">
                    {r.siteIds.slice(0, 4).map((id) => (
                      <SiteArtwork key={id} site={allSites.find((s) => s.id === id)} live={live} />
                    ))}
                  </span>
                  <ChevronRight size={18} className="route-card-go" />
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="explore-heading">
            <h2 className="wide-only">
              {heading("sites")} · {sites.length}
            </h2>
            <button className="wide-only explore-all" onClick={onCities}>
              {t("explore.seeAll", { total })}
            </button>
            <button className="narrow-only explore-city" onClick={onCities}>
              {t(sites.length === 1 ? "explore.narrowSitesOne" : "explore.narrowSites", {
                city,
                count: sites.length,
                suffix: mode === "near" ? t("explore.nearSuffix") : "",
              })}
            </button>
            {/* A phone has no tabs (3 Nov 2026): the city's routes are one tap away. */}
            {routes.length > 0 && (
              <button className="narrow-only explore-routes" onClick={() => onTab("routes")}>
                <Route size={15} />
                {t("explore.tabRoutes")}
                <ChevronRight size={15} />
              </button>
            )}
          </div>
          {categories.length > 1 && (
            <div className="kind-filter" role="group" aria-label={t("explore.filterLabel")}>
              <button aria-pressed={!activeCategory} onClick={() => onCategory(null)}>
                {t("explore.filterAll")} <small>{categoryCount(null)}</small>
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  aria-pressed={activeCategory === c}
                  onClick={() => onCategory(activeCategory === c ? null : c)}
                >
                  <i className={`dot ${c}`} />
                  {t(`category.${c}`)} <small>{categoryCount(c)}</small>
                </button>
              ))}
            </div>
          )}
          {query &&
            shown.map((r) => (
              <button
                key={r.id}
                className="search-route-result"
                onClick={() => onOpenRoute(r.id)}
              >
                <Route size={18} />
                <span>
                  <strong><Localized tr={r.name} en={r.nameEn} /></strong>
                  <small>{t("explore.routeResult", { count: r.siteIds.length })}</small>
                </span>
                <ArrowRight size={16} />
              </button>
            ))}
          <ul className="site-rows">
            {sites.map((site) => (
              <SiteRow
                routeIndex={routeIds.indexOf(site.id) + 1}
                key={site.id}
                site={site}
                live={live}
                selected={site.id === selectedId}
                showModelTag={someModelMissing}
                onPick={() => onPick(site.id)}
                onRoute={() => onRoute(site.id)}
                onOpen={onOpen ? () => onOpen(site.id) : undefined}
                onHover={onHover}
              />
            ))}
            {!sites.length && !(query && shown.length) && (
              <li className="empty-state">
                <p>{t("explore.empty")}</p>
                <button className="btn secondary" onClick={onClearFilters}>
                  {t("explore.clearFilters")}
                </button>
              </li>
            )}
          </ul>
          {sites.length < total && (
            <p className="muted explore-count narrow-only">{t(total === 1 ? "explore.totalOne" : "explore.total", { total })}</p>
          )}
        </>
      )}
    </div>
  );
}

/** A route's time and length, each only once known (a route without walking data has neither: no «~0 dk ·»). */
function routeTail(route: HeritageRoute, t: ReturnType<typeof useI18n>["t"]) {
  return [route.minutes > 0 ? t("route.minutes", { minutes: route.minutes }) : "", route.distance].filter(Boolean);
}

/** A route being walked, as the panel shows it: where the visitor is and what they did with each stop. */
export interface RouteWalkState {
  /** The stop the visitor is at; `sites.length` once the walk is over. */
  at: number;
  doneIds: string[];
  skippedIds: string[];
}

/** The walk followed by the visitor's position: the distance to the stop they are at, and the visit there. */
export interface RouteWalkLocation {
  on: boolean;
  /** Metres to the stop; `null` until a position has come. */
  distance: number | null;
  /** Close enough for the API to verify the visit. */
  near: boolean;
  error?: string | undefined;
  /** The stop's visit is already verified. */
  visited: boolean;
}

/** What a finished walk earned, for its finish card. */
export interface RouteWalkSummary {
  done: number;
  total: number;
  /** Points won since the walk began; unknown for a walk begun before this was counted. */
  points?: number | undefined;
  /** Badges of the route's stops earned since the walk began. */
  badges: BadgeEntry[];
  /** Stops whose story is not finished and that were not visited: what the route's badge still needs. */
  openIds: string[];
  routeBadge?: { title: string; url?: string; alt?: string; earned: boolean } | undefined;
}

/**
 * Where the visitor is against the stop (7 Nov 2026): asked for once («Uzaklığı göster»), then the distance as they
 * walk («Ulucami'ye 120 m»), and at the stop «Ziyaretini doğrula», the visit that earns the most points and counts
 * for the route's badge. The demo has no position check, so it offers its simulated visit at any distance.
 */
function WalkLocation({
  live,
  location,
  onFollow,
  onVisit,
}: {
  live: boolean;
  location: RouteWalkLocation;
  onFollow: (on: boolean) => void;
  onVisit: () => Promise<void>;
}) {
  const { lang, t } = useI18n();
  const [busy, setBusy] = useState(false);
  const canVisit = !location.visited && (location.near || !live);
  return (
    <div className="walk-location" aria-live="polite">
      {!location.on ? (
        <button className="text-btn walk-locate" onClick={() => onFollow(true)}>
          <LocateFixed size={15} aria-hidden="true" />
          {t("walk.locate")}
        </button>
      ) : location.error ? (
        <p className="muted walk-distance">{location.error}</p>
      ) : (
        <p className={`walk-distance${location.near ? " near" : ""}`}>
          <MapPin size={15} aria-hidden="true" />
          {location.distance === null
            ? t("walk.locating")
            : location.near
              ? t("walk.atStop")
              : t("walk.distanceTo", { distance: formatDistance(location.distance, lang) })}
          <button className="text-btn walk-locate-off" onClick={() => onFollow(false)}>{t("walk.locateOff")}</button>
        </p>
      )}
      {location.visited ? (
        <p className="walk-visited"><ShieldCheck size={15} aria-hidden="true" /> {t("visit.verified")}</p>
      ) : (
        canVisit && (
          <button
            className="btn secondary full walk-visit"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onVisit();
              } finally {
                setBusy(false);
              }
            }}
          >
            <MapPin size={16} aria-hidden="true" />
            {busy ? t("visit.verifying") : live ? t("walk.verifyVisit") : t("visit.demoComplete")}
          </button>
        )
      )}
    </div>
  );
}

/**
 * The end of a walk (7 Nov 2026): what it earned (points, the stops' badges, the route's badge or what that still
 * needs), a share card, and the way back. «Tamamladım» alone earns nothing: points and badges come from a stop's
 * story or a visit at the site, so the stops still open are listed here.
 */
function WalkFinished({
  sites,
  finished,
  summary,
  onSite,
  onShare,
  onExit,
  onRestart,
}: {
  sites: HeritageSite[];
  finished: number;
  summary?: RouteWalkSummary | undefined;
  onSite: (id: string) => void;
  onShare?: (() => void) | undefined;
  onExit: () => void;
  onRestart: () => void;
}) {
  const { lang, t, text } = useI18n();
  const open = summary ? sites.filter((s) => summary.openIds.includes(s.id)) : [];
  const route = summary?.routeBadge;
  return (
    <section className="walk-here walk-finished" aria-live="polite">
      <span className="walk-finished-flag" aria-hidden="true"><Flag size={26} /></span>
      <h2>{t("walk.finished")}</h2>
      <p className="muted">{t("walk.finishedCount", { done: finished, total: sites.length })}</p>
      {/* Nothing won yet says nothing: the stops still open below say how to win. */}
      {summary && ((summary.points ?? 0) > 0 || summary.badges.length > 0 || route?.earned) && (
        <dl className="walk-earned">
          {summary.points !== undefined && (
            <div><dd>+{summary.points}</dd><dt>{t("walk.points")}</dt></div>
          )}
          <div><dd>{summary.badges.length + (route?.earned ? 1 : 0)}</dd><dt>{t("walk.badges")}</dt></div>
        </dl>
      )}
      {route && (
        <div className={`walk-route-badge${route.earned ? " earned" : ""}`}>
          <img src={route.url ?? "/rozetler/_hikaye.webp"} alt={route.alt ?? ""} width={56} height={56} />
          <span>
            <strong>{route.title}</strong>
            <small className="muted">{route.earned ? t("walk.routeBadgeEarned") : t("walk.routeBadgeOpen", { count: open.length })}</small>
          </span>
        </div>
      )}
      {summary && summary.badges.length > 0 && (
        <ul className="walk-badges" aria-label={t("walk.badgesEarned")}>
          {summary.badges.map((e) => (
            <li key={e.badge.id}>
              <BadgeMedal badge={e.badge} tier={e.tier} earned size={44} eager />
              <span>{badgeInLang(e.badge, lang).badge.title}</span>
            </li>
          ))}
        </ul>
      )}
      {open.length > 0 && (
        <div className="walk-open-stops">
          <p className="muted">{t("walk.openStops")}</p>
          <ul>
            {open.map((s) => (
              <li key={s.id}>
                <button className="text-btn" onClick={() => onSite(s.id)}>
                  {text(s.name, s.nameEn)} <ArrowRight size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {onShare && (
        <button className="btn secondary full walk-share" onClick={onShare}>
          <Share2 size={17} aria-hidden="true" />
          {t("walk.share")}
        </button>
      )}
      <button className="btn full" onClick={onExit}>{t("walk.close")}</button>
      <button className="text-btn route-home" onClick={onRestart}>{t("route.again")}</button>
    </section>
  );
}

/** A route's page in the panel. */
export function RoutePreview({
  route,
  custom,
  sites,
  live,
  visitedIds,
  walk,
  onBack,
  onClose,
  onSite,
  onStart,
  onStep,
  onDone,
  onSkip,
  onExitWalk,
  onEdit,
  summary,
  onShare,
  location,
  onFollow,
  onVisit,
}: {
  route?: HeritageRoute | undefined;
  custom: boolean;
  sites: HeritageSite[];
  live: boolean;
  visitedIds: string[];
  location?: RouteWalkLocation | undefined;
  onFollow?: (on: boolean) => void;
  onVisit?: () => Promise<void>;
  onBack: () => void;
  /** Takes the route off the map altogether. */
  onClose: () => void;
  onSite: (id: string) => void;
  onStart: () => void;
  /** Set while this route is walked: the panel shows the steps and the stop the visitor is at (7 Nov 2026). */
  walk?: RouteWalkState | undefined;
  /** Set once the walk is over. */
  summary?: RouteWalkSummary | undefined;
  onShare?: () => void;
  onStep?: (index: number) => void;
  onDone?: () => void;
  onSkip?: () => void;
  onExitWalk?: () => void;
  /** One of the visitor's own routes: a pencil beside the close button takes it to the builder (7 Nov 2026). */
  onEdit?: (() => void) | undefined;
}) {
  const { lang, t } = useI18n();
  const tr = lang === "en" ? "tr" : undefined;
  const done = sites.filter((s) => visitedIds.includes(s.id)).length;
  if (walk && sites.length)
    return (
      <RouteWalk route={route} custom={custom} sites={sites} live={live} walk={walk} onSite={onSite}
        onStep={onStep ?? (() => {})} onDone={onDone ?? (() => {})} onSkip={onSkip ?? (() => {})}
        onExit={onExitWalk ?? (() => {})} onRestart={onStart} summary={summary} onShare={onShare}
        location={location} onFollow={onFollow} onVisit={onVisit} />
    );
  return (
    <div className="route-page">
      <button className="route-close" aria-label={t("route.close")} title={t("route.close")} onClick={onClose}>
        <X size={18} />
      </button>
      {onEdit && (
        <button className="route-close route-edit" aria-label={t("route.editTitle")} title={t("route.editTitle")} onClick={onEdit}>
          <Pencil size={17} />
        </button>
      )}
      <Back onClick={onBack}>{t("route.all")}</Back>
      <div className="route-cover">
        <SiteArtwork site={sites[0]} live={live} />
        {custom && <Tag>{t("route.tagCustom")}</Tag>}
      </div>
      <h1>{route ? <Localized tr={route.name} en={route.nameEn} /> : t("route.customTitle")}</h1>
      <p className="muted">
        {t(sites.length === 1 ? "explore.stopCountOne" : "explore.stopCount", { count: sites.length })}{" "}
        {route && routeTail(route, t).map((x) => `· ${x} `)}
      </p>
      <p>
        {route?.description ? <span lang={tr}>{route.description}</span> : t("route.defaultDescription")}
      </p>
      {route?.badge && (
        // What finishing it earns, before the walk begins (7 Nov 2026), as the finish card shows it at the end.
        <div className="walk-route-badge route-page-badge">
          <img src={route.badge.url ?? "/rozetler/_hikaye.webp"} alt={route.badge.alt ?? ""} width={56} height={56} />
          <span>
            <small className="muted">{t("route.badgeFor")}</small>
            <strong>{route.badge.title}</strong>
            <small className="muted">{t("route.badgeHow")}</small>
          </span>
        </div>
      )}
      <div className="route-stop-list">
        {sites.map((s, i) => {
          const next = sites[i + 1];
          const leg = next && walkingLeg(route, s.id, next.id);
          // Only curated routes carry walking data; Rotam (custom) stays a straight line without a note per leg.
          const schematic = !!next && !leg && !custom && !!route?.walking;
          return (
            <Fragment key={s.id}>
              <button onClick={() => onSite(s.id)}>
                <span
                  className={`stop-number ${visitedIds.includes(s.id) ? "visited" : ""}`}
                >
                  {visitedIds.includes(s.id) ? <Check size={15} /> : i + 1}
                </span>
                <span>
                  <strong><Localized tr={s.name} en={s.nameEn} /></strong>
                  <small>{s.year}</small>
                </span>
                <ArrowRight size={15} />
              </button>
              {(leg || schematic) && (
                <small className="route-leg muted">
                  <Footprints size={13} aria-hidden="true" />
                  {leg
                    ? t("route.legWalk", { minutes: legMinutes(leg), distance: legDistance(leg) })
                    : t("route.legSchematic")}
                </small>
              )}
            </Fragment>
          );
        })}
      </div>
      {sites.length === 0 ? (
        <Notice>{t("route.emptyNotice")}</Notice>
      ) : (
        <>
          <Notice>
            {t("route.schematic")}
          </Notice>
          <button className="btn full" onClick={onStart}>
            <Footprints size={18} />
            {done === sites.length
              ? t("route.again")
              : done
                ? t("common.continueProgress", { done, total: sites.length })
                : t("route.start")}
          </button>
          <button className="text-btn route-home" onClick={onStart}>
            {t("route.fromHome")}
          </button>
        </>
      )}
    </div>
  );
}

/**
 * Walking a route in the panel (Muhammed, 7 Nov 2026: «rotayı başlat dediğinde rota başlasın ama aynı panelden devam
 * etsin»): the steps along the top, the stop the visitor is at with the walk to it, and three ways on: done (to the
 * next), skip, or any step tapped. The map beside it flies to each stop.
 */
function RouteWalk({
  route,
  custom,
  sites,
  live,
  walk,
  onSite,
  onStep,
  onDone,
  onSkip,
  onExit,
  onRestart,
  summary,
  onShare,
  location,
  onFollow,
  onVisit,
}: {
  route?: HeritageRoute | undefined;
  custom: boolean;
  sites: HeritageSite[];
  live: boolean;
  walk: RouteWalkState;
  location?: RouteWalkLocation | undefined;
  onFollow?: ((on: boolean) => void) | undefined;
  onVisit?: (() => Promise<void>) | undefined;
  onSite: (id: string) => void;
  onStep: (index: number) => void;
  onDone: () => void;
  onSkip: () => void;
  onExit: () => void;
  onRestart: () => void;
  summary?: RouteWalkSummary | undefined;
  onShare?: (() => void) | undefined;
}) {
  const { t, text } = useI18n();
  const here = sites[walk.at];
  const last = walk.at === sites.length - 1;
  const before = sites[walk.at - 1];
  const leg = here && before && walkingLeg(route, before.id, here.id);
  const finished = sites.filter((s) => walk.doneIds.includes(s.id)).length;
  const title = route ? text(route.name, route.nameEn) : t("route.customTitle");
  return (
    <div className="route-page route-walk">
      <button className="route-close" aria-label={t("walk.exit")} title={t("walk.exit")} onClick={onExit}>
        <X size={18} />
      </button>
      <span className="walk-kicker">{t("walk.on")}</span>
      <h1>{title}</h1>
      <ol className="walk-steps" aria-label={t("walk.steps")}>
        {sites.map((s, i) => {
          const isDone = walk.doneIds.includes(s.id);
          const skipped = !isDone && walk.skippedIds.includes(s.id);
          return (
            <li key={s.id} className={`${i === walk.at ? "now" : ""}${isDone ? " done" : ""}${skipped ? " skipped" : ""}`}>
              <button
                aria-label={t("walk.goTo", { n: i + 1, name: text(s.name, s.nameEn) })}
                aria-current={i === walk.at ? "step" : undefined}
                onClick={() => onStep(i)}
              >
                <span className="walk-step-dot">{isDone ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : i + 1}</span>
                <span className="walk-step-name">{text(s.name, s.nameEn)}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {here ? (
        <section className="walk-here" aria-live="polite">
          <p className="muted walk-count">
            {t("walk.stopOf", { at: walk.at + 1, total: sites.length })}
            {leg && (
              <>
                {" · "}
                <Footprints size={13} aria-hidden="true" />
                {t("route.legWalk", { minutes: legMinutes(leg), distance: legDistance(leg) })}
              </>
            )}
          </p>
          <button className="walk-here-card" onClick={() => onSite(here.id)}>
            <SiteArtwork site={here} live={live} />
            <span>
              <strong><Localized tr={here.name} en={here.nameEn} /></strong>
              <small className="muted">{here.year}</small>
              <span className="walk-open">{t("walk.open")} <ArrowRight size={14} aria-hidden="true" /></span>
            </span>
          </button>
          {location && onFollow && onVisit && (
            <WalkLocation live={live} location={location} onFollow={onFollow} onVisit={onVisit} />
          )}
          <div className="walk-actions">
            <button className="btn full" onClick={onDone}>
              {last ? <Flag size={18} aria-hidden="true" /> : <Check size={18} aria-hidden="true" />}
              {last ? t("walk.finish") : t("walk.done")}
            </button>
            {!last && (
              <button className="btn secondary walk-skip" onClick={onSkip}>
                <SkipForward size={16} aria-hidden="true" />
                {t("walk.skip")}
              </button>
            )}
          </div>
        </section>
      ) : (
        <WalkFinished sites={sites} finished={finished} summary={summary} onSite={onSite} onShare={onShare} onExit={onExit} onRestart={onRestart} />
      )}
      {here && (
        <button className="text-btn route-home" onClick={onExit}>
          {t("walk.exit")}
        </button>
      )}
    </div>
  );
}
