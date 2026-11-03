"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Footprints,
  Plus,
  Route,
} from "lucide-react";
import {
  kindCategory,
  normalize,
  type HeritageRoute,
  type HeritageSite,
  type SiteCategory,
} from "@akar/domain";
import { cityCase } from "../lib/place-names";
import { siteMeta } from "../lib/site-meta";
import { SiteArtwork } from "./site-artwork";
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
}: {
  city: string;
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
        className="chip city-only city-pick"
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
  onHover,
}: {
  routeIndex: number;
  site: HeritageSite;
  live: boolean;
  selected: boolean;
  showModelTag: boolean;
  onPick: () => void;
  onRoute: () => void;
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
      <button
        className="site-row-add"
        aria-pressed={routeIndex > 0}
        aria-label={t("explore.addSite", { name: text(site.name, site.nameEn) })}
        onClick={onRoute}
      >
        {routeIndex > 0 ? <span>★{routeIndex}</span> : <Plus size={16} />}
      </button>
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
  onCustomRoute,
  onCities,
  onClearFilters,
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
  onCustomRoute: () => void;
  onCities: () => void;
  onClearFilters: () => void;
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
          <div className="explore-heading">
            {/* A phone has no tabs (3 Nov 2026): back to the sites from here. */}
            <button className="narrow-only explore-back" onClick={() => onTab("sites")}>
              <ChevronLeft size={16} />
              {t("explore.tabSites")}
            </button>
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
                      {t("explore.routeLine", { count: r.siteIds.length, minutes: r.minutes, distance: r.distance })}
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
          {/* A new route (Muhammed, 3 Nov 2026: «rezalet, değiştirelim»): a clear card, a small walk drawn on it. */}
          <button className="custom-route yeni" onClick={onCustomRoute}>
            <svg className="cr-art" viewBox="0 0 64 44" aria-hidden="true">
              <path d="M8 34 C 20 34, 18 12, 32 14 S 46 30, 56 10" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 4" strokeLinecap="round" />
              <circle cx="8" cy="34" r="4.5" />
              <circle cx="32" cy="14" r="4.5" />
              <circle cx="56" cy="10" r="4.5" className="cr-new" />
            </svg>
            <span>
              <strong>{t("explore.custom")}</strong>
              <small>
                {routeIds.length
                  ? t(routeIds.length === 1 ? "explore.customWaitingOne" : "explore.customWaiting", { count: routeIds.length })
                  : t("explore.customEmpty")}
              </small>
            </span>
            <span className="cr-plus" aria-hidden="true"><Plus size={20} strokeWidth={2.4} /></span>
          </button>
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

/** A route's page in the panel. */
export function RoutePreview({
  route,
  custom,
  sites,
  live,
  visitedIds,
  onBack,
  onSite,
  onStart,
}: {
  route?: HeritageRoute | undefined;
  custom: boolean;
  sites: HeritageSite[];
  live: boolean;
  visitedIds: string[];
  onBack: () => void;
  onSite: (id: string) => void;
  onStart: () => void;
}) {
  const { lang, t } = useI18n();
  const tr = lang === "en" ? "tr" : undefined;
  const done = sites.filter((s) => visitedIds.includes(s.id)).length;
  return (
    <div className="route-page">
      <Back onClick={onBack}>{t("route.all")}</Back>
      <div className="route-cover">
        <SiteArtwork site={sites[0]} live={live} />
        <Tag>{custom ? t("route.tagCustom") : t("route.tagCurated")}</Tag>
      </div>
      <h1>{custom ? t("route.customTitle") : route && <Localized tr={route.name} en={route.nameEn} />}</h1>
      <p className="muted">
        {t(sites.length === 1 ? "explore.stopCountOne" : "explore.stopCount", { count: sites.length })}{" "}
        {route && t("route.metaTail", { minutes: route.minutes, distance: route.distance })}
      </p>
      <p>
        {route?.description ? <span lang={tr}>{route.description}</span> : t("route.defaultDescription")}
      </p>
      <div className="route-stop-list">
        {sites.map((s, i) => (
          <button key={s.id} onClick={() => onSite(s.id)}>
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
        ))}
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
