"use client";
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  Flag,
  Footprints,
  SkipForward,
  ChevronRight,
  Headphones,
  History,
  MessageCircle,
  Navigation,
  Play,
  Puzzle,
} from "lucide-react";
import { sized } from "../lib/image-size";
import { useEffect, useRef, useState } from "react";
import type { HeritageSite, RouteLeg } from "@akar/domain";
import { appleWalkUrl, googleWalkUrl, isAppleMobile, legDistance, legMinutes } from "../lib/route-walking";
import type { SiteProgress } from "@akar/api-client";
import { readingMinutes, wordCount } from "../lib/about-reading";
import { siteMeta } from "../lib/site-meta";
import { Localized, useI18n } from "./i18n";
import { Notice } from "./ui";

function Depth({ minutes }: { minutes: number }) {
  return (
    <span className="derinlik" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <i
          key={n}
          className={
            n <= Math.min(5, Math.max(1, Math.round(minutes / 3))) ? "d" : ""
          }
        />
      ))}
    </span>
  );
}

export function SiteDetail({
  site,
  saved,
  read,
  progress,
  memoryCount,
  onBack,
  onSave,
  onStory,
  onAbout,
  onHistory,
  onMemories,
  onPuzzle,
  onChat,
  nextStop,
  nextLeg,
  onNextStop,
  walkStep,
  onSkip,
  onFinish,
}: {
  site: HeritageSite;
  saved: boolean;
  read: boolean;
  progress: SiteProgress;
  memoryCount: number;
  onBack: () => void;
  onSave: () => void;
  onStory: (listen?: boolean) => void;
  onAbout: () => void;
  onHistory: () => void;
  onMemories: () => void;
  onPuzzle: () => void;
  onChat?: (() => void) | undefined;
  /** On a route: the stop after this one (the prototype's «Sonraki durak»). */
  nextStop?: HeritageSite | undefined;
  /** Stored walking path to `nextStop`; `null`/absent = schematic (§11.79). */
  nextLeg?: RouteLeg | null | undefined;
  onNextStop?: (id: string) => void;
  /** Set while a route is walked: where this stop is on it, and its ways on besides the next stop. */
  walkStep?: { at: number; total: number; doneIds: string[]; ids: string[] } | undefined;
  onSkip?: () => void;
  onFinish?: () => void;
}) {
  const { t } = useI18n();
  // Apple Maps is offered on iPhone/iPad only; read after mount so server and client render alike.
  const [apple, setApple] = useState(false);
  useEffect(() => setApple(isAppleMobile()), []);
  const nextCover = nextStop && ([...(nextStop.storyPhotos ?? []), ...(nextStop.photos ?? [])].find((p) => p.id === nextStop.coverPhotoId) ?? nextStop.photos?.[0]);
  const cover =
    [...(site.storyPhotos ?? []), ...(site.photos ?? [])].find(
      (p) => p.id === site.coverPhotoId,
    ) ?? site.photos?.[0];
  const history = site.historyImages ?? [];
  const oldest = [...history].sort(
    (a, b) =>
      (parseInt(a.dateLabel) || Infinity) - (parseInt(b.dateLabel) || Infinity),
  )[0];
  const minutes = readingMinutes(wordCount(site.sections ?? []));
  const tasks = site.tasks ?? [];
  const done = tasks.filter((task) =>
    progress.tasks.some((p) => p.taskId === task.id),
  ).length;
  const allDone = tasks.length > 0 && done === tasks.length;
  const traces = site.sampleTraces ?? [];
  const count = traces.length + memoryCount;
  const sections = site.chapters?.length || site.sections?.length || 0;
  const oldestYear = oldest ? parseInt(oldest.dateLabel) : NaN;
  const initial = (name: string) =>
    name.trim().slice(0, 1).toLocaleUpperCase("tr") || "–";
  const fullText = minutes > 0 && (
    <button
      className="tam-kart desenli"
      onClick={onAbout}
      aria-label={t("site.fullTextAria", { minutes })}
    >
      <span className="tk-yazi">
        <small>{t("site.fullText")}</small>
        <b>{t("site.about")}</b>
        <span className="tk-alt">
          {t("site.fullTextMeta", { minutes, count: sections })}
          <Depth minutes={minutes} />
        </span>
      </span>
      <span className="tk-ok">
        <ArrowRight size={20} />
      </span>
    </button>
  );
  return (
    <>
      <header className="eb-bas desenli">
        <button className="back-to-map" onClick={onBack}>
          <span>
            <ChevronLeft size={16} />
          </span>
          {t("app.map")}
        </button>
        <button
          className="detail-save round-btn plain"
          aria-label={t("app.save")}
          aria-pressed={saved}
          onClick={onSave}
        >
          <Bookmark size={19} fill={saved ? "currentColor" : "none"} />
        </button>
        <div className="eb-govde">
          {cover && (
            <div className="eb-foto">
              <img src={sized(cover.src, 96)} alt="" decoding="async" />
            </div>
          )}
          <div>
            <h1 className="panel-baslik">
              <Localized tr={site.name} en={site.nameEn} />
            </h1>
            <div className="panel-meta">{siteMeta(site)}</div>
          </div>
        </div>
      </header>
      {/* Phone: the year and patron come after Keşfet, above the ornament and the summary (prototype `.ea-detay .meta`). */}
      <div className="detail-meta-end">{siteMeta(site)}</div>
      <div className="detail-ornament" aria-hidden="true">
        <span />
        <svg width="24" height="12" viewBox="0 0 24 12">
          <path
            d="M0 6h7m10 0h7M12 1l4 5-4 5-4-5z"
            fill="none"
            stroke="currentColor"
          />
          <circle cx="12" cy="6" r="1" fill="currentColor" />
        </svg>
        <span />
      </div>
      <p className="detail-summary">
        <Localized tr={site.description} en={site.descriptionEn} />
      </p>
      {site.stories.length > 0 ? (
        <div className="hikaye-blok">
          <div className="hb-bas">
            {t("site.shortStoryMeta", { minutes: site.minutes })}
            <Depth minutes={site.minutes} />
          </div>
          {/* A phone (3 Nov 2026): one way in; the story's own sound button reads it aloud. */}
          <button className={`hikaye-basla${read ? " bitti" : ""}`} onClick={() => onStory()}>
            <Play size={18} fill="currentColor" />
            {t(read ? "site.storyAgain" : "site.storyStart")}
          </button>
          <div className="ikili" role="group" aria-label={t("site.shortStory")}>
            <button
              className={`ik-sol${read ? " bitti" : ""}`}
              onClick={() => onStory(true)}
              aria-label={read ? t("site.listenDone") : undefined}
            >
              <Headphones size={20} />
              {t("site.listenOnly")}
              {read && (
                <span className="bitti-tik" title={t("site.storyDone")}>
                  <Check size={12} />
                </span>
              )}
            </button>
            <button className="ik-sag" onClick={() => onStory()}>
              <BookOpen size={20} />
              {t("app.read")}
            </button>
          </div>
          {fullText}
        </div>
      ) : (
        <div className="hikaye-blok">
          <Notice>{t("site.noStoryYet")}</Notice>
          {fullText}
        </div>
      )}
      <div className="kesif-bas" id="detail-explore">
        {t("site.explore")}
      </div>
      <nav className="kesif-yollari" aria-labelledby="detail-explore">
        {onChat && (
          <button className="ky" onClick={onChat}>
            <span className="ky-ik">
              <span className="ky-daire">
                <MessageCircle size={22} />
              </span>
            </span>
            <span className="ky-yazi">
              <b>{t("chat.askSite")}</b>
              <small>{t("chat.askSiteNote")}</small>
            </span>
            <ChevronRight className="ky-ok" size={18} />
          </button>
        )}
        <button className="ky" onClick={onHistory}>
          <span className="ky-ik">
            {oldest ? (
              <span className="ky-foto">
                <img src={sized(oldest.photo.src, 64)} alt="" loading="lazy" decoding="async" />
                {cover && <img className="bugun" src={sized(cover.src, 64)} alt="" loading="lazy" decoding="async" />}
              </span>
            ) : (
              <span className="ky-daire">
                <History size={22} />
              </span>
            )}
          </span>
          <span className="ky-yazi">
            <b>{t("site.history")}</b>
            <small>
              {!history.length
                ? t("site.historyNone")
                : oldestYear
                  ? t("site.historyFrom", { count: history.length, year: oldestYear })
                  : t(history.length === 1 ? "site.historyCountOne" : "site.historyCount", { count: history.length })}
            </small>
          </span>
          <ChevronRight className="ky-ok" size={18} />
        </button>
        <button className="ky" onClick={onMemories}>
          <span className="ky-ik">
            {traces.length ? (
              <span className="ky-yuzler" aria-hidden="true">
                {traces.slice(0, 3).map((trace) => (
                  <i key={trace.id}>{initial(trace.author)}</i>
                ))}
              </span>
            ) : (
              <span className="ky-daire">
                <MessageCircle size={22} />
              </span>
            )}
          </span>
          <span className="ky-yazi">
            <b>{t("site.memories")}</b>
            <small>
              {count
                ? t("site.memoriesRow", { count })
                : t("site.memoriesRowNone")}
            </small>
          </span>
          <ChevronRight className="ky-ok" size={18} />
        </button>
        <button className="ky" onClick={onPuzzle}>
          <span className="ky-ik">
            <span className={`detail-task-ring${allDone ? " bitti" : ""}`}>
              <svg viewBox="0 0 48 48" aria-hidden="true">
                <circle cx="24" cy="24" r="21" />
                <circle
                  cx="24"
                  cy="24"
                  r="21"
                  pathLength="1"
                  style={{
                    strokeDashoffset: tasks.length
                      ? 1 - done / tasks.length
                      : 1,
                  }}
                />
              </svg>
              {allDone ? <Check size={19} /> : <Puzzle size={19} />}
            </span>
          </span>
          <span className="ky-yazi">
            <b>{t("site.puzzle")}</b>
            <small>
              {!tasks.length
                ? t("site.puzzleRowNone")
                : allDone
                  ? t("site.puzzleRowAll", { count: tasks.length })
                  : t("site.puzzleRow", { count: tasks.length, done })}
            </small>
          </span>
          <ChevronRight className="ky-ok" size={18} />
        </button>
      </nav>
      {/* The route's way on (7 Nov 2026): where the walk is, the next stop with the walk to it and one way there in
          the phone's maps, then the same «Tamamladım, sıradaki» / «Atla» as the route panel. */}
      {((nextStop && onNextStop) || (walkStep && onFinish)) && (
        <section className="detail-next" aria-label={t("walk.nextLabel")}>
          {walkStep && (
            <header className="dn-head">
              <span className="walk-kicker">{t("walk.on")}</span>
              <span className="dn-count">{walkStep.at + 1}/{walkStep.total}</span>
              <span className="dn-dots" aria-hidden="true">
                {walkStep.ids.map((id, i) => (
                  <i key={id} className={`${i === walkStep.at ? "now" : ""}${walkStep.doneIds.includes(id) ? " done" : ""}`} />
                ))}
              </span>
            </header>
          )}
          {nextStop && onNextStop ? (
            <>
              <div className="dn-stop">
                {nextCover ? <img src={sized(nextCover.src, 96)} alt="" loading="lazy" decoding="async" /> : <span className="dn-img" />}
                <span className="dn-text">
                  <small>{t("walk.nextLabel")}</small>
                  <b><Localized tr={nextStop.name} en={nextStop.nameEn} /></b>
                  {nextLeg && (
                    <span className="dn-leg">
                      <Footprints size={13} aria-hidden="true" />
                      {t("route.legWalk", { minutes: legMinutes(nextLeg), distance: legDistance(nextLeg) })}
                    </span>
                  )}
                </span>
                <a
                  className="round-btn dn-maps"
                  href={apple ? appleWalkUrl(nextStop.coordinates) : googleWalkUrl(nextStop.coordinates)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("walk.directions")}
                  title={t("walk.directions")}
                >
                  <Navigation size={17} />
                </a>
              </div>
              <button className="btn full dn-go" onClick={() => onNextStop(nextStop.id)}>
                {walkStep ? <Check size={18} aria-hidden="true" /> : null}
                {walkStep ? t("walk.done") : t("completion.nextStop", { name: nextStop.name })}
                {!walkStep && <ArrowRight size={16} />}
              </button>
              {walkStep && onSkip && (
                <button className="text-btn dn-skip" onClick={onSkip}>
                  <SkipForward size={15} aria-hidden="true" />
                  {t("walk.skip")}
                </button>
              )}
            </>
          ) : (
            <button className="btn full dn-go" onClick={onFinish}>
              <Flag size={18} aria-hidden="true" />
              {t("walk.finish")}
            </button>
          )}
        </section>
      )}
      <MoreBelow label={t("site.moreBelow")} />
    </>
  );
}

/**
 * On a wide screen the site's panel runs below the window and nothing said so (Muhammed, 7 Nov 2026): while there is
 * more under the fold its foot fades and a small «Devamı ↓» shows; a press scrolls a screen down. It goes once the
 * visitor has scrolled or the panel's end is in sight. Pinned to the foot of the panel that scrolls (`.side-panel`).
 */
function MoreBelow({ label }: { label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const scroller = ref.current?.closest<HTMLElement>(".side-panel");
    if (!scroller) return;
    // Anything cut off at the foot counts (7 Nov 2026: with only the last row cut, 80 px of slack hid the hint).
    const check = () => setShow(scroller.scrollTop < 24 && scroller.scrollHeight - scroller.clientHeight > 8);
    check();
    const resize = new ResizeObserver(check);
    resize.observe(scroller);
    if (scroller.firstElementChild) resize.observe(scroller.firstElementChild);
    scroller.addEventListener("scroll", check, { passive: true });
    return () => {
      resize.disconnect();
      scroller.removeEventListener("scroll", check);
    };
  }, []);
  return (
    <div ref={ref} className={`more-below${show ? " on" : ""}`} aria-hidden={!show}>
      <button
        tabIndex={show ? 0 : -1}
        onClick={(e) => {
          const scroller = e.currentTarget.closest<HTMLElement>(".side-panel");
          scroller?.scrollBy({ top: scroller.clientHeight * 0.7, behavior: "smooth" });
        }}
      >
        {label}
        <ChevronDown size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
