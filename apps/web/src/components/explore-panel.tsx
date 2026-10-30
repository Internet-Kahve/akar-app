"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Footprints,
  House,
  MapPin,
  Navigation,
  Plus,
  Route,
} from "lucide-react";
import {
  categoryHints,
  categoryLabels,
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

export type ExploreTab = "sites" | "routes";
export type PlaceMode = "home" | "near";

/** Dropdown of the place mode and the role filters over the map. */
export function MapChips({
  mode,
  city,
  categories,
  active,
  onMode,
  onToggle,
  onCities,
}: {
  mode: PlaceMode;
  city: string;
  categories: SiteCategory[];
  active: Set<SiteCategory>;
  onMode: (mode: PlaceMode) => void;
  onToggle: (category: SiteCategory) => void;
  onCities: () => void;
}) {
  const [open, setOpen] = useState(false),
    box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  const option = (
    value: PlaceMode,
    Icon: typeof House,
    title: string,
    text: string,
  ) => (
    <button
      role="menuitemradio"
      aria-checked={mode === value}
      onClick={() => {
        setOpen(false);
        onMode(value);
      }}
    >
      <Icon size={18} />
      <span>
        <b>{title}</b>
        <small>{text}</small>
      </span>
      {mode === value && <Check size={16} />}
    </button>
  );
  return (
    <div className="map-chips" ref={box}>
      <button className="chip city-only" onClick={onCities} title="Şehirler">
        <i className="city-motif" aria-hidden="true" />
        {city}
      </button>
      <button
        className="chip dark"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {mode === "near" ? <Navigation size={14} /> : <House size={14} />}
        {mode === "near" ? "Yakınımda" : "Evden gez"}
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="place-menu" role="menu">
          {option("near", MapPin, "Konumumu kullan", "Yakınındaki eserler önce gelir")}
          {option("home", House, "Evden gez", `Konum gerekmez, ${cityCase(city, true)} başlar`)}
        </div>
      )}
      {categories.map((category) => (
        <button
          key={category}
          className="chip"
          aria-pressed={active.has(category)}
          title={categoryHints[category]}
          onClick={() => onToggle(category)}
        >
          <i className={`dot ${category}`} />
          {categoryLabels[category]}
        </button>
      ))}
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
  site,
  live,
  selected,
  showModelTag,
  onPick,
  onRoute,
}: {
  site: HeritageSite;
  live: boolean;
  selected: boolean;
  showModelTag: boolean;
  onPick: () => void;
  onRoute: () => void;
}) {
  return (
    <li className={`site-row${selected ? " selected" : ""}`}>
      <button className="site-row-main" onClick={onPick}>
        <SiteArtwork site={site} live={live} />
        <span>
          <strong>{site.name}</strong>
          <small>
            <i className={`dot ${kindCategory[site.kind]}`} />
            {siteMeta(site)}
          </small>
          {showModelTag && site.model && <em>3D</em>}
        </span>
      </button>
      <button
        className="site-row-add"
        aria-label={`${site.name} Rotama ekle`}
        onClick={onRoute}
      >
        <Plus size={16} />
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
  onPick: (id: string) => void;
  onRoute: (id: string) => void;
  onOpenRoute: (id: string) => void;
  onCustomRoute: () => void;
  onCities: () => void;
  onClearFilters: () => void;
}) {
  const shown = routes.filter((r) =>
    normalize(r.name).includes(normalize(query)),
  );
  const heading = (noun: string) =>
    mode === "near" ? `Yakınındaki ${noun}` : `${cityCase(city)}ki ${noun}`;
  const someModelMissing = allSites.some((s) => !s.model);
  return (
    <div className="explore">
      <div className="explore-tabs" role="tablist" data-tab={tab}>
        <button
          role="tab"
          aria-selected={tab === "sites"}
          onClick={() => onTab("sites")}
        >
          Eserler
        </button>
        <button
          role="tab"
          aria-selected={tab === "routes"}
          onClick={() => onTab("routes")}
        >
          Rotalar
        </button>
      </div>
      {tab === "routes" ? (
        <>
          <div className="explore-heading">
            <h2>{heading("rotalar")}</h2>
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
                  <SiteArtwork
                    site={allSites.find((s) => r.siteIds.includes(s.id))}
                    live={live}
                  />
                  <span>
                    <strong>{r.name}</strong>
                    <small>
                      {r.siteIds.length} durak · ~{r.minutes} dk · {r.distance}
                    </small>
                    <em className={stops ? "going" : ""}>
                      {stops
                        ? `Devam et · ${stops} / ${r.siteIds.length}`
                        : "Başlanmadı"}
                    </em>
                  </span>
                </button>
              );
            })}
          </div>
          <button className="custom-route" onClick={onCustomRoute}>
            <Route size={20} />
            <span>
              <strong>Kendi rotanı oluştur</strong>
              <small>
                {routeIds.length
                  ? `${routeIds.length} eser seni bekliyor`
                  : "Merak ettiğin yerleri bir araya getir"}
              </small>
            </span>
            <Plus size={18} />
          </button>
        </>
      ) : (
        <>
          <div className="explore-heading">
            <h2 className="wide-only">
              {heading("eserler")} · {sites.length}
            </h2>
            <button className="narrow-only explore-city" onClick={onCities}>
              {city} ▾ · {sites.length} eser
              {mode === "near" ? " yakında" : ""}
            </button>
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
                  <strong>{r.name}</strong>
                  <small>Rota · {r.siteIds.length} durak</small>
                </span>
                <ArrowRight size={16} />
              </button>
            ))}
          <ul className="site-rows">
            {sites.map((site) => (
              <SiteRow
                key={site.id}
                site={site}
                live={live}
                selected={site.id === selectedId}
                showModelTag={someModelMissing}
                onPick={() => onPick(site.id)}
                onRoute={() => onRoute(site.id)}
              />
            ))}
            {!sites.length && !(query && shown.length) && (
              <li className="empty-state">
                <p>Sonuç yok. Yazımı kontrol et ya da filtreleri temizle.</p>
                <button className="btn secondary" onClick={onClearFilters}>
                  Filtreleri temizle
                </button>
              </li>
            )}
          </ul>
          {sites.length < total && (
            <p className="muted explore-count">Toplam {total} eser</p>
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
  const done = sites.filter((s) => visitedIds.includes(s.id)).length;
  return (
    <div className="route-page">
      <Back onClick={onBack}>Tüm rotalar</Back>
      <div className="route-cover">
        <SiteArtwork site={sites[0]} live={live} />
        <Tag>{custom ? "SENİN ROTAN" : "KÜRATÖRLÜ KEŞİF"}</Tag>
      </div>
      <h1>{custom ? "Kendi hikâyeni çiz" : route?.name}</h1>
      <p className="muted">
        {sites.length} durak {route && `· ~${route.minutes} dk · ${route.distance}`}
      </p>
      <p>
        {route?.description ??
          "Seçtiğin eserleri sırayla keşfet. Her durak yeni bir hikâye."}
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
              <strong>{s.name}</strong>
              <small>
                {[s.year, `${s.minutes} dk`].filter(Boolean).join(" · ")}
              </small>
            </span>
            <ArrowRight size={15} />
          </button>
        ))}
      </div>
      {sites.length === 0 ? (
        <Notice>Başlamak için bir eser aç ve “Rotama ekle”yi seç.</Notice>
      ) : (
        <>
          <Notice>
            Durakları birleştiren çizgi şematiktir; yürüyüş yol tarifi değildir.
          </Notice>
          <button className="btn full" onClick={onStart}>
            <Footprints size={18} />
            {done === sites.length
              ? "Rotayı yeniden keşfet"
              : done
                ? `Devam et · ${done} / ${sites.length}`
                : "Rotayı başlat"}
          </button>
        </>
      )}
    </div>
  );
}
