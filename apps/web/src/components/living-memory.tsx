"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { approvedMemories, type HeritageSite, type Snapshot } from "@akar/domain";
import { memoryTraces, relativeDay, traceInitial, type MemoryFilter, type Trace } from "../lib/memory-traces";
import type { MessageKey } from "../lib/messages";
import { Localized, useI18n } from "./i18n";

const FILTERS: Array<{ id: MemoryFilter; label: MessageKey }> = [
  { id: "all", label: "memoryPage.newest" },
  { id: "photo", label: "memoryPage.withPhoto" },
  { id: "angle", label: "memoryPage.sameAngle" },
  { id: "mine", label: "memoryPage.mine" },
];

function TraceCard({ trace, site }: { trace: Trace; site: HeritageSite }) {
  const { t, lang } = useI18n();
  const content = lang === "en" ? "tr" : undefined;
  const angle = trace.historyImageId
    ? site.historyImages?.find((h) => h.id === trace.historyImageId)
    : undefined;
  const parts = [
    trace.photo ? t("memoryPage.visitorPhoto") : t("memoryPage.visitorNote"),
    trace.author,
    relativeDay(trace.date, lang),
  ];
  const state =
    trace.state === "pending"
      ? t("memoryPage.reviewing")
      : trace.state === "sample"
        ? t("site.sampleTrace")
        : null;
  return (
    <article className={`hm-iz${trace.photo ? " fotolu" : ""}`}>
      {trace.photo && <img src={trace.photo} alt={trace.alt || t("memories.photoAlt")} />}
      <div className="hm-iz-yazi">
        <div className="hm-kim">
          <span className="hm-avatar" aria-hidden="true">
            {traceInitial(trace.author)}
          </span>
          <b lang={content}>{trace.author}</b>
          <time dateTime={trace.date}>{relativeDay(trace.date, lang)}</time>
        </div>
        <p lang={content}>{trace.text}</p>
        {angle && (
          <span className="hm-aci">
            {/\d/.test(angle.dateLabel)
              ? t("memoryPage.angleWith", { date: angle.dateLabel })
              : t("memoryPage.angleOld")}
          </span>
        )}
        <small className="hm-kunye">
          <span lang={content}>{parts.join(" · ")}</span>
          {state && (
            <>
              {" · "}
              <span className={trace.state === "pending" ? "hm-inceleniyor" : undefined}>{state}</span>
            </>
          )}
        </small>
        {trace.credit && (
          <small className="hm-kunye" lang={content}>
            {trace.credit}
          </small>
        )}
      </div>
    </article>
  );
}

/** «Yaşayan hafıza»: the visitor's own traces first, then everyone's from newest to oldest. */
export function LivingMemory({
  site,
  state,
  onBack,
  onAdd,
  onHistory,
  onAbout,
}: {
  site: HeritageSite;
  state: Snapshot;
  onBack: () => void;
  onAdd: () => void;
  onHistory: () => void;
  onAbout: () => void;
}) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<MemoryFilter>("all");
  const traces = useMemo(
    () =>
      memoryTraces({
        sample: site.sampleTraces ?? [],
        own: state.memories.filter((m) => m.siteId === site.id),
        approved: approvedMemories(state, site.id),
      }),
    [site, state],
  );
  const shown = traces.filter(
    (trace) =>
      filter === "all" ||
      (filter === "photo" && !!trace.photo) ||
      (filter === "angle" && !!trace.historyImageId) ||
      (filter === "mine" && trace.own),
  );
  const own = traces.filter((trace) => trace.own);
  const name = <Localized tr={site.name} en={site.nameEn} />;
  return (
    <main id="main-content" tabIndex={-1} className="hm-sayfa">
      <div className="hm-ic">
        <button className="back-to-map" onClick={onBack}>
          <span>
            <ChevronLeft size={16} />
          </span>
          {name}
        </button>
        <nav className="hm-yol" aria-label={t("memoryPage.path")}>
          <span>{t("memoryPage.sites")}</span>
          <ChevronRight size={13} />
          <span>{name}</span>
          <ChevronRight size={13} />
          <span aria-current="page">{t("site.memories")}</span>
        </nav>
        <h1 className="hm-baslik">{t("site.memories")}</h1>
        <p className="hm-sayi">
          {traces.length ? t("memoryPage.count", { count: traces.length }) : t("memoryPage.none")}
        </p>
        <div className="hm-duzen">
          <div className="hm-akis">
            <div className="hm-filtre" role="group" aria-label={t("memoryPage.filters")}>
              {FILTERS.map((item) => (
                <button key={item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>
                  {t(item.label)}
                </button>
              ))}
            </div>
            {shown.length ? (
              shown.map((trace) => <TraceCard key={trace.id} trace={trace} site={site} />)
            ) : (
              <div className="hm-bos">
                <h2>{t(filter === "all" ? "memories.emptyTitle" : "memoryPage.noMatch")}</h2>
                {filter === "all" && <p>{t("memories.emptyText")}</p>}
              </div>
            )}
          </div>
          <aside className="hm-yan">
            <div className="hm-kart">
              <h2>{t("memoryPage.yours")}</h2>
              <p>{t("memoryPage.yoursText")}</p>
              <button className="btn full hm-ekle" onClick={onAdd}>
                <Plus size={17} />
                {t("memories.add")}
              </button>
              {own.some((trace) => trace.state === "pending") && (
                <small className="hm-inceleniyor">{t("memoryPage.pendingNote")}</small>
              )}
            </div>
            <div className="hm-kart hm-baglanti">
              <h2>{t("memoryPage.onThisSite")}</h2>
              <button onClick={onHistory}>
                {t("site.history")}
                <ChevronRight size={16} />
              </button>
              <button onClick={onAbout}>
                {t("site.about")}
                <ChevronRight size={16} />
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
