"use client";
import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { ArrowRight, Camera, ChevronLeft, History, MapPin } from "lucide-react";
import {
  type HeritageSite,
  type HistoryImage,
  type SampleTrace,
} from "@akar/domain";
import { pairOf, type HistoryPair } from "../lib/history-pair";
import { seenFrom } from "../lib/viewpoint";
import { HistoryCamera } from "./history-camera";
import { TrustTag } from "./side-sheet";
import { Notice, Tag } from "./ui";
import { ViewpointMap } from "./viewpoint-map";
import { Localized, useI18n } from "./i18n";

const KEY_STEPS: Record<string, number> = {
  ArrowLeft: -5,
  ArrowDown: -5,
  ArrowRight: 5,
  ArrowUp: 5,
};

/**
 * Old and present-day photograph on top of each other, the old one cut at the handle (0 % = only today, 100 % = only
 * the old one). Both are fitted whole into the box (`contain`), never cropped; a handle you drag or move with the
 * arrow keys.
 */
function HistoryCompare({
  image,
  pair,
}: {
  image: HistoryImage;
  pair: HistoryPair;
}) {
  const { t, lang } = useI18n();
  const content = lang === "en" ? "tr" : undefined;
  const box = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(50);
  const place = (clientX: number) => {
    const rect = box.current?.getBoundingClientRect();
    if (rect?.width)
      setSplit(Math.min(100, Math.max(0, Math.round(((clientX - rect.left) / rect.width) * 100))));
  };
  const onKey = (event: KeyboardEvent) => {
    const step = KEY_STEPS[event.key];
    const next =
      step !== undefined
        ? split + step
        : event.key === "Home"
          ? 0
          : event.key === "End"
            ? 100
            : null;
    if (next === null) return;
    event.preventDefault();
    setSplit(Math.min(100, Math.max(0, next)));
  };
  return (
    <div
      ref={box}
      className="history-compare"
      style={{ "--split": `${split}%` } as CSSProperties}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        place(event.clientX);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          place(event.clientX);
      }}
    >
      <img
        className="history-compare-layer"
        src={pair.photo.src}
        alt={pair.photo.alt}
        draggable={false}
      />
      <img
        className="history-compare-layer history-compare-old"
        src={image.photo.src}
        alt={image.photo.alt}
        draggable={false}
      />
      <span className="history-compare-label old">
        <span lang={content}>{image.dateLabel}</span>
      </span>
      <span className="history-compare-label today">
        <span>
          {t("site.today")} · {pair.by}
        </span>
        {pair.example && <Tag tone="gold">{t("site.example")}</Tag>}
      </span>
      <div
        className="history-compare-handle"
        role="slider"
        tabIndex={0}
        aria-label={t("site.compareSlider")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={split}
        aria-valuetext={t("site.oldPercent", { pct: split })}
        onKeyDown={onKey}
      >
        <span aria-hidden="true">‹ ›</span>
      </div>
    </div>
  );
}

/** The team's İz Bırak samples: tagged «Örnek», each photograph with its credit line word for word. */
function SampleTraces({
  traces,
  images,
  onShow,
}: {
  traces: SampleTrace[];
  images: HistoryImage[];
  onShow: (index: number) => void;
}) {
  const { t, lang } = useI18n();
  const content = lang === "en" ? "tr" : undefined;
  return (
    <section className="sample-traces" aria-labelledby="sample-traces-title">
      <h2 id="sample-traces-title">{t("site.sampleTitle")}</h2>
      <p className="muted">{t("site.sampleNote")}</p>
      <div className="sample-trace-list">
        {traces.map((trace) => {
          const index = images.findIndex((i) => i.id === trace.historyImageId);
          return (
            <article className="card sample-trace" key={trace.id}>
              <img src={trace.photo.src} alt={trace.photo.alt} loading="lazy" />
              <div className="sample-trace-meta">
                <Tag tone="gold">{t("site.example")}</Tag>
                <strong>{trace.author}</strong>
              </div>
              <p lang={content}>{trace.text}</p>
              <p className="sample-trace-credit" lang={content}>
                {trace.photo.description}
              </p>
              {index >= 0 && (
                <button
                  className="btn secondary"
                  onClick={() => onShow(index)}
                >
                  {t("site.showOldPhoto")}
                  <ArrowRight size={16} />
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function HistoryView({
  site,
  sites,
  onBack,
  onMemory,
  onSite,
}: {
  site: HeritageSite;
  /** Every published site: a site with no old photograph may stand in another's view. */
  sites: HeritageSite[];
  onBack: () => void;
  onMemory: () => void;
  onSite: (id: string) => void;
}) {
  const { t, lang } = useI18n();
  const content = lang === "en" ? "tr" : undefined;
  const [selected, setSelected] = useState(0),
    [camera, setCamera] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const images = site.historyImages ?? [];
  const image = images[selected] ?? images[0];
  const source = site.sources?.find((s) => s.id === image?.sourceId);
  const pair = image ? pairOf(site, image, lang) : null;
  const traces = site.sampleTraces ?? [];
  const farViews = image ? [] : seenFrom(site, sites);
  const samples = traces.length > 0 && (
    <SampleTraces
      traces={traces}
      images={images}
      onShow={(index) => {
        setSelected(index);
        stage.current?.scrollIntoView({ block: "start" });
      }}
    />
  );
  return (
    <main id="main-content" tabIndex={-1} className="history-page">
      <header className="history-head">
        <button className="round-btn" aria-label={t("site.backToSite")} onClick={onBack}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1>{t("site.historyTitle")}</h1>
          <p className="muted">
            <Localized tr={site.name} en={site.nameEn} />
          </p>
        </div>
        {image && (
          <>
            <span className="history-count">
              {selected + 1} / {images.length}
            </span>
            <TrustTag
              trust={image.trust}
              quote={image.caption}
              sources={source ? [{ title: source.title }] : []}
            />
          </>
        )}
      </header>
      {image ? (
        <>
          <div className="history-grid" ref={stage}>
            <div className="history-stage">
              <figure className="archive-photo">
                {pair ? (
                  <HistoryCompare key={image.id} image={image} pair={pair} />
                ) : (
                  <img src={image.photo.src} alt={image.photo.alt} />
                )}
                <figcaption lang={content}>
                  {image.dateLabel} · {image.caption}
                </figcaption>
              </figure>
              {pair?.angleMatch === "near" && (
                <p className="history-near">{t("site.nearAngle")}</p>
              )}
            </div>
            <aside className="card">
              <History size={28} />
              <h2 lang={content}>{image.caption}</h2>
              <p lang={content}>{image.dateLabel}</p>
              <p className="archive-credit" lang={content}>
                {image.photo.description || source?.title}
              </p>
              <p className="muted" lang={content}>
                {image.photo.license}
              </p>
              {pair && (
                <p className="archive-credit-today">
                  <small>{t("site.presentPhoto")}</small>{" "}
                  <span lang={content}>{pair.photo.description}</span>
                </p>
              )}
              {source?.url && /^https?:\/\//.test(source.url) && (
                <a href={source.url} target="_blank" rel="noreferrer">
                  {t("site.openArchive")}
                </a>
              )}
              {!pair && (
                <Notice>
                  {t("site.noPresentPair")}
                </Notice>
              )}
              <h3 className="history-where">
                <MapPin size={16} />
                {t("site.whereFrom")}
              </h3>
              {image.viewpoint ? (
                <ViewpointMap images={images} selected={image} />
              ) : (
                <p>{t("site.noViewpoint")}</p>
              )}
              <button className="btn full" onClick={() => setCamera(true)}>
                <Camera size={17} />
                {t("site.openCamera")}
              </button>
              <button className="btn secondary full" onClick={onMemory}>
                {t("site.haveAnglePhoto")}
                <ArrowRight size={16} />
              </button>
            </aside>
          </div>
          <div
            className="timeline archive-timeline"
            aria-label={t("site.archivePhotos")}
          >
            {images.map((item, index) => (
              <button
                key={item.id}
                aria-pressed={selected === index}
                className={selected === index ? "active" : ""}
                onClick={() => setSelected(index)}
              >
                <img src={item.photo.src} alt="" loading="lazy" />
                <strong>
                  <span lang={content}>{item.dateLabel}</span>
                  {pairOf(site, item, lang) && (
                    <>
                      <i className="history-pair-dot" aria-hidden="true" />
                      <span className="sr-only">, {t("site.hasPresentPair")}</span>
                    </>
                  )}
                </strong>
                <small lang={content}>{item.caption}</small>
              </button>
            ))}
          </div>
          {samples}
        </>
      ) : (
        <>
          <div className="card">
            <History size={32} />
            <h2>{t("site.noArchiveTitle")}</h2>
            <p>{t("site.noArchiveBody")}</p>
            <button className="btn secondary" onClick={onMemory}>
              {t("site.shareOldPhoto")}
            </button>
          </div>
          {farViews.length > 0 && (
            <section className="far-views">
              <h2>{t("site.farViewsTitle")}</h2>
              {farViews.map((v) => (
                <button key={v.image.id} onClick={() => onSite(v.site.id)}>
                  <img src={v.image.photo.src} alt={v.image.photo.alt} loading="lazy" />
                  <span>
                    <strong>
                      <Localized tr={v.site.name} en={v.site.nameEn} />
                    </strong>
                    <small>
                      <span lang={content}>{v.image.dateLabel}</span> ·{" "}
                      {t("site.distanceAway", { m: v.distance })}
                    </small>
                  </span>
                  <ArrowRight size={16} />
                </button>
              ))}
            </section>
          )}
          {samples}
        </>
      )}
      {camera && image && (
        <HistoryCamera
          site={site}
          image={image}
          onClose={() => setCamera(false)}
          onMemory={() => {
            setCamera(false);
            onMemory();
          }}
        />
      )}
    </main>
  );
}
