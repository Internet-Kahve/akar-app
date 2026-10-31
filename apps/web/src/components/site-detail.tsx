"use client";
import { useState } from "react";
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Headphones,
  History,
  MessageCircle,
  Puzzle,
} from "lucide-react";
import type { HeritageSite, SiteTask } from "@akar/domain";
import type { SiteProgress } from "@akar/api-client";
import { readingMinutes, wordCount } from "../lib/about-reading";
import { siteMeta } from "../lib/site-meta";
import { Localized, useI18n } from "./i18n";
import { Modal, Notice } from "./ui";
import { SiteTasks } from "./site-tasks";

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
  onTask,
  nextStop,
  onNextStop,
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
  onTask: (task: SiteTask) => void;
  /** On a route: the stop after this one (the prototype's «Sonraki durak»). */
  nextStop?: HeritageSite;
  onNextStop?: (id: string) => void;
}) {
  const { t } = useI18n();
  const [tasksOpen, setTasksOpen] = useState(false);
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
              <img src={cover.src} alt="" />
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
        <button className="ky" onClick={onHistory}>
          <span className="ky-ik">
            {oldest ? (
              <span className="ky-foto">
                <img src={oldest.photo.src} alt="" />
                {cover && <img className="bugun" src={cover.src} alt="" />}
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
              <span className="ky-yuzler">
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
        <button className="ky" onClick={() => setTasksOpen(true)}>
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
      {nextStop && onNextStop && (
        <button
          className="btn secondary full detail-next-stop"
          onClick={() => onNextStop(nextStop.id)}
        >
          {t("completion.nextStop", { name: nextStop.name })}
          <ArrowRight size={16} />
        </button>
      )}
      {tasksOpen && (
        <Modal title={t("site.puzzle")} onClose={() => setTasksOpen(false)}>
          <SiteTasks
            site={site}
            progress={progress}
            onOpen={(task) => {
              setTasksOpen(false);
              onTask(task);
            }}
          />
        </Modal>
      )}
    </>
  );
}
