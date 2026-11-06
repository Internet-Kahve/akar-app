"use client";
import { Check, X } from "lucide-react";
import type { HeritageSite } from "@akar/domain";
import { useI18n } from "./i18n";

/**
 * The route being walked (Muhammed, 6 Nov 2026: «şuan rotadasın tarzı şeyler olsun»): a strip over the map with the
 * stop the visitor is at, a dot for each stop (seen ones ticked) that also takes them there, and a way out.
 */
export function WalkStrip({
  sites,
  at,
  seenIds,
  onStop,
  onExit,
}: {
  sites: HeritageSite[];
  at: number;
  seenIds: string[];
  onStop: (index: number) => void;
  onExit: () => void;
}) {
  const { t, text } = useI18n();
  const here = sites[at];
  if (!here) return null;
  return (
    <div className="walk-strip" role="status" aria-label={t("walk.aria", { at: at + 1, total: sites.length, name: text(here.name, here.nameEn) })}>
      <span className="walk-kicker">{t("walk.on")}</span>
      <b className="walk-now">
        {at + 1}/{sites.length} · {text(here.name, here.nameEn)}
      </b>
      <span className="walk-dots">
        {sites.map((site, i) => {
          const seen = seenIds.includes(site.id);
          return (
            <button
              key={site.id}
              className={`${i === at ? "now" : ""}${seen ? " seen" : ""}`}
              aria-label={t("walk.goTo", { n: i + 1, name: text(site.name, site.nameEn) })}
              aria-current={i === at ? "step" : undefined}
              onClick={() => onStop(i)}
            >
              {seen ? <Check size={10} strokeWidth={3} aria-hidden="true" /> : i + 1}
            </button>
          );
        })}
      </span>
      <button className="walk-exit" aria-label={t("walk.exit")} title={t("walk.exit")} onClick={onExit}>
        <X size={16} />
      </button>
    </div>
  );
}
