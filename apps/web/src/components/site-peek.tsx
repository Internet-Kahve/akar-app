"use client";
import { useEffect, useRef, useState } from "react";
import {
  BookmarkPlus,
  BookOpen,
  BookOpenText,
  ChevronRight,
  ChevronUp,
  Headphones,
  Puzzle,
  X,
} from "lucide-react";
import type { HeritageSite } from "@akar/domain";
import { SiteArtwork } from "./site-artwork";
import { TrustTag } from "./side-sheet";
import { siteMeta } from "../lib/site-meta";
import { PHONE_LAYOUT, useMedia } from "../lib/use-media";
import { Localized, useI18n } from "./i18n";

/** A downward swipe of this length closes the card on a phone; an upward one opens the site's page. */
const CLOSE_SWIPE_PX = 60;
const OPEN_SWIPE_PX = 40;

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
  onRead,
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
  /** «Oku»: the short story to read, as on the site's page. */
  onRead: () => void;
  onTasks: () => void;
  onNext: (id: string) => void;
  onRoute: () => void;
  onClose: () => void;
}) {
  const { t, text } = useI18n();
  const start = useRef<number | null>(null),
    card = useRef<HTMLElement>(null),
    [offset, setOffset] = useState(0);
  // The map's controls stand just above the card on a phone (prototype `--kart-h`): its height is measured.
  useEffect(() => {
    const el = card.current;
    if (!el) return;
    const root = document.documentElement.style;
    const observer = new ResizeObserver(() => root.setProperty("--peek-h", `${el.offsetHeight}px`));
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.removeProperty("--peek-h");
    };
  }, []);
  const phone = useMedia(PHONE_LAYOUT);
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
  // A phone (Muhammed, 3 Nov 2026): the card only says which site it is, a small photograph and the name; pulled up
  // or tapped it opens the site's page, as a story opens. Listening and reading are on that page.
  if (phone)
    return (
      <article
        ref={card}
        className="site-peek compact"
        style={offset ? { transform: `translateY(${offset}px)`, transition: "none" } : undefined}
        onPointerDown={(e) => {
          if (!(e.target as HTMLElement).closest("button")) start.current = e.clientY;
        }}
        onPointerMove={(e) => {
          if (start.current === null) return;
          const raw = e.clientY - start.current;
          if (Math.abs(raw) > 6 && !e.currentTarget.hasPointerCapture(e.pointerId))
            e.currentTarget.setPointerCapture(e.pointerId);
          setOffset(raw > 0 ? raw : Math.max(-80, raw * 0.6));
        }}
        onPointerUp={(e) => {
          if (start.current === null) return;
          const moved = e.clientY - start.current;
          start.current = null;
          setOffset(0);
          if (moved > CLOSE_SWIPE_PX) onClose();
          else if (moved < -OPEN_SWIPE_PX || Math.abs(moved) < 6) onOpen();
        }}
        onPointerCancel={() => {
          start.current = null;
          setOffset(0);
        }}
      >
        <span className="peek-up" aria-hidden="true">
          <ChevronUp size={16} />
        </span>
        <div className="peek-photo">
          <SiteArtwork site={site} live={live} />
        </div>
        <div className="peek-name">
          <h3>
            <Localized tr={site.name} en={site.nameEn} />
          </h3>
          <p className="peek-meta">{siteMeta(site)}</p>
        </div>
        {route}
        <button className="peek-go" aria-label={t("peek.explore")} onClick={onOpen}>
          <ChevronRight size={20} />
        </button>
        <button className="peek-close" aria-label={t("common.close")} onClick={onClose}>
          <X size={16} />
        </button>
      </article>
    );
  return (
    <article
      ref={card}
      className="site-peek"
      style={offset ? { transform: `translateY(${offset}px)`, transition: "none" } : undefined}
      onPointerDown={(e) => {
        if (!(e.target as HTMLElement).closest("button")) start.current = e.clientY;
      }}
      onPointerMove={(e) => {
        if (start.current === null) return;
        // Down closes; on a phone up opens the site's page (it follows the finger a little, as a hint).
        const raw = e.clientY - start.current;
        const moved = raw > 0 ? raw : phone ? Math.max(-80, raw * 0.6) : 0;
        if (Math.abs(raw) > 6 && !e.currentTarget.hasPointerCapture(e.pointerId))
          e.currentTarget.setPointerCapture(e.pointerId);
        setOffset(moved);
      }}
      onPointerUp={(e) => {
        if (start.current === null) return;
        const moved = e.clientY - start.current;
        start.current = null;
        setOffset(0);
        if (moved > CLOSE_SWIPE_PX && phone) onClose();
        else if (moved < -OPEN_SWIPE_PX && phone) onOpen();
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
            <div className="ikili" role="group" aria-label={t("site.shortStory")}>
              <button className="ik-sol" onClick={onListen}>
                <Headphones size={20} />
                {t("site.listen", { minutes: site.minutes })}
              </button>
              <button className="ik-sag" onClick={onRead}>
                <BookOpen size={20} />
                {t("app.read")}
              </button>
            </div>
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
