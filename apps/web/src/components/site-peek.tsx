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
  const start = useRef<number | null>(null),
    [offset, setOffset] = useState(0);
  const listenFirst = !finished && site.stories.length > 0;
  const route = (
    <button
      className="round-btn plain"
      aria-label={saved ? "Rotamdan çıkar" : "Rotama ekle"}
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
      <button className="peek-close" aria-label="Kapat" onClick={onClose}>
        <X size={18} />
      </button>
      <div className="peek-head">
        <button className="peek-photo" aria-label={`${site.name} sayfasını aç`} onClick={onOpen}>
          <SiteArtwork site={site} live={live} />
        </button>
        <div>
          <h3>
            <button onClick={onOpen}>{site.name}</button>
          </h3>
          <p className="peek-meta">{siteMeta(site)}</p>
          <TrustTag trust={site.sources?.length ? "verified" : "representative"} quote={site.description} />
        </div>
      </div>
      <p className="peek-text">{site.description}</p>
      {listenFirst ? (
        <>
          <div className="peek-actions">
            <button className="btn" onClick={onListen}>
              <Headphones size={18} />
              Dinle · {site.minutes} dk
            </button>
            {route}
          </div>
          <button className="peek-more" onClick={onOpen}>
            Eseri incele
            <ChevronRight size={16} />
          </button>
        </>
      ) : (
        <>
          <div className="peek-actions">
            <button className="btn" onClick={onOpen}>
              <BookOpenText size={18} />
              Eseri incele
            </button>
            {route}
          </div>
          {openTasks > 0 ? (
            <button className="peek-more" onClick={onTasks}>
              <Puzzle size={16} />
              Bulmaca · {openTasks} görev
              <ChevronRight size={16} />
            </button>
          ) : (
            next && (
              <button className="peek-more" onClick={() => onNext(next.id)}>
                Sonraki eser: {next.name}
                <ChevronRight size={16} />
              </button>
            )
          )}
        </>
      )}
    </article>
  );
}
