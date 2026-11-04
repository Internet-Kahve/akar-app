"use client";
import { useRef } from "react";
import { sized } from "../lib/image-size";
import { ArrowDown, ArrowUp, ChevronLeft, GripVertical, MapPin, Plus, Pointer, Trash2, X } from "lucide-react";
import type { HeritageSite, PersonalRoute } from "@akar/domain";
import { useI18n } from "./i18n";

export type RouteDraft = { id: string; name: string; siteIds: string[] };

/** Walking estimate: 4.5 km/h as the crow flies, plus five minutes at each stop. */
const routeLength = (stops: HeritageSite[]) => {
  const rad = Math.PI / 180;
  const km = stops.slice(1).reduce((sum, site, i) => {
    const a = stops[i]!.coordinates,
      b = site.coordinates;
    const h =
      Math.sin(((b[1] - a[1]) * rad) / 2) ** 2 +
      Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(((b[0] - a[0]) * rad) / 2) ** 2;
    return sum + 12742 * Math.asin(Math.sqrt(h));
  }, 0);
  return { km, minutes: Math.ceil((km / 4.5) * 60 + stops.length * 5) };
};

/**
 * Rotam, built in the side panel (Muhammed, 2 Nov 2026: it opened as a separate bar over the map with its buttons
 * elsewhere, while the panel stood beside it unused). The panel shows the route being built: which route and its
 * name, the numbered stops (drag, ↑ ↓, remove), the estimate, and Vazgeç / Kaydet fixed at its foot. Stops are
 * added from the map's pins and the short card, as before; the map draws the route as it grows.
 */
export function RouteBuilder({ draft, routes, sites, busy, onChange, onSave, onCancel, onDelete }: {
  draft: RouteDraft; routes: PersonalRoute[]; sites: HeritageSite[]; busy: boolean;
  onChange: (draft: RouteDraft) => void; onSave: () => void; onCancel: () => void; onDelete: () => void;
}) {
  const { t, text } = useI18n();
  const drag = useRef<string | null>(null);
  const stops = draft.siteIds.flatMap((id) => sites.find((site) => site.id === id) ?? []);
  const { km, minutes } = routeLength(stops);
  const move = (id: string, target: number) => {
    const ids = draft.siteIds.filter((item) => item !== id);
    ids.splice(target, 0, id);
    onChange({ ...draft, siteIds: ids });
  };
  const cover = (site: HeritageSite) =>
    [...(site.storyPhotos ?? []), ...(site.photos ?? [])].find((p) => p.id === site.coverPhotoId) ?? site.photos?.[0];
  return (
    <section className="route-builder" aria-label={t("route.build")}>
      <header className="rb-head">
        <button className="round-btn plain" aria-label={t("route.cancel")} disabled={busy} onClick={onCancel}>
          <ChevronLeft size={18} />
        </button>
        <h2>{t(draft.id ? "route.editTitle" : "route.build")}</h2>
        {draft.id && (
          <button className="round-btn plain rb-delete" aria-label={t("route.delete")} disabled={busy} onClick={onDelete}>
            <Trash2 size={17} />
          </button>
        )}
      </header>
      <div className="rb-fields">
        {/* Which route: only when the visitor already has one to choose from. */}
        {routes.some((route) => route.siteIds.length > 0 || route.id === draft.id && !!draft.id) && <label>
          <span>{t("route.choose")}</span>
          <select value={draft.id} disabled={busy} onChange={(event) => {
            const route = routes.find((route) => route.id === event.target.value);
            onChange(route ? { ...route, siteIds: [...route.siteIds] } : { id: "", name: t("route.new"), siteIds: [] });
          }}>
            <option value="">{t("route.new")}</option>
            {routes.map((route) => <option key={route.id} value={route.id}>{route.name}</option>)}
          </select>
        </label>}
        <label>
          <span>{t("route.name")}</span>
          <input maxLength={80} value={draft.name} disabled={busy} onChange={(event) => onChange({ ...draft, name: event.target.value })} />
        </label>
      </div>
      {stops.length > 0 && (
        <p className="rb-summary" aria-live="polite">
          {t("route.summary", { count: stops.length, minutes, km: km.toFixed(1) })}
        </p>
      )}
      {stops.length ? (
        <ol className="rb-stops">
          {stops.map((site, index) => {
            const photo = cover(site);
            return (
              <li key={site.id} data-route-stop={site.id}>
                <button className="rb-drag" aria-label={t("route.reorder", { name: text(site.name, site.nameEn) })}
                  onPointerDown={(event) => { drag.current = site.id; event.currentTarget.setPointerCapture(event.pointerId); }}
                  onPointerMove={(event) => {
                    if (!drag.current) return;
                    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-route-stop]")?.dataset.routeStop;
                    if (target && target !== drag.current) move(drag.current, draft.siteIds.indexOf(target));
                  }}
                  onPointerUp={() => { drag.current = null; }}
                  onPointerCancel={() => { drag.current = null; }}>
                  <GripVertical size={16} />
                </button>
                <b className="rb-no" aria-hidden="true">{index + 1}</b>
                {photo ? <img src={sized(photo.src, 48)} alt="" loading="lazy" decoding="async" /> : <span className="rb-img"><MapPin size={16} /></span>}
                <span className="rb-name">
                  {text(site.name, site.nameEn)}
                  <small>{site.year}</small>
                </span>
                <span className="rb-tools">
                  <button aria-label={t("route.up")} disabled={busy || index === 0} onClick={() => move(site.id, index - 1)}><ArrowUp size={15} /></button>
                  <button aria-label={t("route.down")} disabled={busy || index === stops.length - 1} onClick={() => move(site.id, index + 1)}><ArrowDown size={15} /></button>
                  <button aria-label={t("route.remove")} disabled={busy} onClick={() => onChange({ ...draft, siteIds: draft.siteIds.filter((id) => id !== site.id) })}><X size={15} /></button>
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        // No stop yet (Muhammed, 3 Nov 2026: «tatlı bir uyarı, artıya bas»): a finger taps a pin's «+», as on the map.
        <div className="rb-coach" role="status">
          <span className="rb-coach-art" aria-hidden="true">
            <span className="rb-coach-pin">
              <MapPin size={22} />
              <i className="rb-coach-plus"><Plus size={11} strokeWidth={3} /></i>
            </span>
            <span className="rb-coach-finger"><Pointer size={22} strokeWidth={1.8} /></span>
          </span>
          <span className="rb-coach-text">
            <b>{t("route.emptyTitle")}</b>
            <small>{t("route.emptySub")}</small>
          </span>
        </div>
      )}
      {stops.length > 1 && <p className="rb-hint">{t("route.hintShort")}</p>}
      <footer className="rb-foot">
        <button className="btn secondary" disabled={busy} onClick={onCancel}>{t("route.cancel")}</button>
        <button className="btn" disabled={busy || !draft.name.trim() || !stops.length} onClick={onSave}>{t("route.save")}</button>
      </footer>
    </section>
  );
}
