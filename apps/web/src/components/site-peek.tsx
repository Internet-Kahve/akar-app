"use client";
import { useRef, useState } from "react";
import {
  BookmarkPlus,
  BookOpenText,
  ChevronRight,
  Headphones,
  Puzzle,
  X,
} from "lucide-react";
import type { HeritageSite } from "@akar/domain";
import { SiteArtwork } from "./site-artwork";
import { TrustTag } from "./side-sheet";
import { siteMeta } from "../lib/site-meta";
import { Localized, useI18n } from "./i18n";

/** A downward swipe of this length closes the card on a phone. */
const CLOSE_SWIPE_PX = 60;

/**
 * The short card of a picked site: a preview before the site page. It offers what comes next for this visitor:
 * listening while the story is new, then the site page, the open tasks or the next unfinished site.
 */
export function SitePeek({
  site,
  live,
  finished,
  openTasks,
  next,
  saved,
  onOpen,
  onListen,
  onTasks,
  onNext,
  onRoute,
  onClose,
}: {
  site: HeritageSite;
  live: boolean;
  finished: boolean;
  openTasks: number;
  next?: HeritageSite;
  saved: boolean;
  onOpen: () => void;
  onListen: () => void;
  onTasks: () => void;
  onNext: (id: string) => void;
  onRoute: () => void;
  onClose: () => void;
}) {
  const { t, text } = useI18n();
  const start = useRef<number | null>(null),
    [offset, setOffset] = useState(0);
  const listenFirst = !finished && site.stories.length > 0;
  const route = (
    <button
      className="round-btn plain"
      aria-label={saved ? t("site.removeRoute") : t("site.addRoute")}
      aria-pressed={saved}
      onClick={onRoute}
    >
      <BookmarkPlus size={20} />
    </button>
  );
  return (
    <article
      className="site-peek"
      style={offset ? { transform: `translateY(${offset}px)`, transition: "none" } : undefined}
      onPointerDown={(e) => {
        if (!(e.target as HTMLElement).closest("button")) start.current = e.clientY;
      }}
      onPointerMove={(e) => {
        if (start.current === null) return;
        const moved = Math.max(0, e.clientY - start.current);
        if (moved > 6 && !e.currentTarget.hasPointerCapture(e.pointerId))
          e.currentTarget.setPointerCapture(e.pointerId);
        setOffset(moved);
      }}
      onPointerUp={(e) => {
        if (start.current === null) return;
        const moved = e.clientY - start.current;
        start.current = null;
        setOffset(0);
        if (moved > CLOSE_SWIPE_PX && matchMedia("(max-width: 899.98px)").matches) onClose();
      }}
      onPointerCancel={() => {
        start.current = null;
        setOffset(0);
      }}
    >
      <button className="peek-close" aria-label={t("common.close")} onClick={onClose}>
        <X size={18} />
      </button>
      {/* As the prototype's card top: photo, name and line are one area that opens the site; the name is its button. */}
      <div className="peek-head" onClick={onOpen}>
        <div className="peek-photo">
          <SiteArtwork site={site} live={live} />
        </div>
        <div>
          <h3>
            <button aria-label={t("peek.openPage", { name: text(site.name, site.nameEn) })}>
              <Localized tr={site.name} en={site.nameEn} />
            </button>
          </h3>
          <p className="peek-meta">{siteMeta(site)}</p>
          <TrustTag trust={site.sources?.length ? "verified" : "representative"} quote={text(site.description, site.descriptionEn)} />
        </div>
      </div>
      <p className="peek-text"><Localized tr={site.description} en={site.descriptionEn} /></p>
      {listenFirst ? (
        <>
          <div className="peek-actions">
            <button className="btn" onClick={onListen}>
              <Headphones size={20} />
              {t("site.listen", { minutes: site.minutes })}
            </button>
            {route}
          </div>
          <button className="peek-more" onClick={onOpen}>
            {t("peek.explore")}
            <ChevronRight size={16} />
          </button>
        </>
      ) : (
        <>
          <div className="peek-actions">
            <button className="btn" onClick={onOpen}>
              <BookOpenText size={20} />
              {t("peek.explore")}
            </button>
            {route}
          </div>
          {openTasks > 0 ? (
            <button className="peek-more" onClick={onTasks}>
              <Puzzle size={16} />
              {t(openTasks === 1 ? "peek.puzzleOne" : "peek.puzzle", { count: openTasks })}
              <ChevronRight size={16} />
            </button>
          ) : (
            next && (
              <button className="peek-more" onClick={() => onNext(next.id)}>
                {t("peek.next")} <Localized tr={next.name} en={next.nameEn} />
                <ChevronRight size={16} />
              </button>
            )
          )}
        </>
      )}
    </article>
  );
}
