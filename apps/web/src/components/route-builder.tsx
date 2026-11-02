"use client";
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Trash2 } from "lucide-react";
import type { HeritageSite, PersonalRoute } from "@akar/domain";
import { useI18n } from "./i18n";

export type RouteDraft = { id: string; name: string; siteIds: string[] };
export function RouteBuilder({ draft, routes, sites, busy, onChange, onSave, onCancel, onDelete }: {
  draft: RouteDraft; routes: PersonalRoute[]; sites: HeritageSite[]; busy: boolean;
  onChange: (draft: RouteDraft) => void; onSave: () => void; onCancel: () => void; onDelete: () => void;
}) {
  const { t, text } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const drag = useRef<string | null>(null);
  const startY = useRef(0);
  const stops = draft.siteIds.flatMap((id) => sites.find((site) => site.id === id) ?? []);
  const distance = stops.slice(1).reduce((sum, site, i) => {
    const a = stops[i]!.coordinates, b = site.coordinates, rad = Math.PI / 180;
    const h = Math.sin((b[1] - a[1]) * rad / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin((b[0] - a[0]) * rad / 2) ** 2;
    return sum + 12742 * Math.asin(Math.sqrt(h));
  }, 0);
  const move = (id: string, target: number) => {
    const ids = draft.siteIds.filter((item) => item !== id);
    ids.splice(target, 0, id);
    onChange({ ...draft, siteIds: ids });
  };
  return <section className="route-builder" aria-label={t("route.build")}>
    <button className="route-builder-grip" aria-expanded={expanded} aria-label={t("route.stops")}
      onClick={() => setExpanded(!expanded)}
      onPointerDown={(event) => { startY.current = event.clientY; event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerUp={(event) => { if (startY.current - event.clientY > 30) setExpanded(true); else if (event.clientY - startY.current > 30) setExpanded(false); }}><i /></button>
    <div className="route-builder-bar">
      <select aria-label={t("route.choose")} value={draft.id} disabled={busy} onChange={(event) => {
        const route = routes.find((route) => route.id === event.target.value);
        onChange(route ? { ...route, siteIds: [...route.siteIds] } : { id: "", name: t("route.new"), siteIds: [] });
      }}><option value="">{t("route.new")}</option>{routes.map((route) => <option key={route.id} value={route.id}>{route.name}</option>)}</select>
      <input aria-label={t("route.name")} maxLength={80} value={draft.name} disabled={busy} onChange={(event) => onChange({ ...draft, name: event.target.value })} />
      <span>{t("route.summary", { count: stops.length, minutes: Math.ceil(distance / 4.5 * 60 + stops.length * 5), km: distance.toFixed(1) })}</span>
      <button className="btn secondary" disabled={busy} onClick={onCancel}>{t("route.cancel")}</button>
      <button className="btn" disabled={busy || !draft.name.trim()} onClick={onSave}>{t("route.save")}</button>
    </div>
    {expanded && <div className="route-builder-stops">
      <p>{t("route.hint")}</p>
      <ol>{stops.map((site, index) => <li key={site.id} data-route-stop={site.id}>
        <button className="route-drag" aria-label={t("route.reorder", { name: text(site.name, site.nameEn) })}
          onPointerDown={(event) => { drag.current = site.id; event.currentTarget.setPointerCapture(event.pointerId); }}
          onPointerMove={(event) => {
            if (!drag.current) return;
            const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-route-stop]")?.dataset.routeStop;
            if (target && target !== drag.current) move(drag.current, draft.siteIds.indexOf(target));
          }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}><GripVertical size={16} /></button>
        <b>{index + 1}</b><span>{text(site.name, site.nameEn)}</span>
        <button aria-label={t("route.up")} disabled={busy || index === 0} onClick={() => move(site.id, index - 1)}><ArrowUp size={16} /></button>
        <button aria-label={t("route.down")} disabled={busy || index === stops.length - 1} onClick={() => move(site.id, index + 1)}><ArrowDown size={16} /></button>
        <button aria-label={t("route.remove")} disabled={busy} onClick={() => onChange({ ...draft, siteIds: draft.siteIds.filter((id) => id !== site.id) })}><Trash2 size={16} /></button>
      </li>)}</ol>
      {draft.id && <button className="btn secondary" disabled={busy} onClick={onDelete}>{t("route.delete")}</button>}
    </div>}
  </section>;
}
