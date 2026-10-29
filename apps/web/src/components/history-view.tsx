"use client";
import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { ArrowRight, History } from "lucide-react";
import {
  trustLabels,
  type HeritageSite,
  type HistoryImage,
  type SampleTrace,
} from "@akar/domain";
import { pairOf, type HistoryPair } from "../lib/history-pair";
import { Back, Notice, Tag } from "./ui";

/** Said under the photographs when the present-day one was not taken from exactly the old one's point. */
const NEAR_ANGLE = "Yakın açı: iki fotoğraf birebir aynı noktadan çekilmedi.";
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
        <span>{image.dateLabel}</span>
      </span>
      <span className="history-compare-label today">
        <span>Bugün · {pair.by}</span>
        {pair.example && <Tag tone="gold">Örnek</Tag>}
      </span>
      <div
        className="history-compare-handle"
        role="slider"
        tabIndex={0}
        aria-label="Eski ve bugünkü fotoğrafı karşılaştır"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={split}
        aria-valuetext={`Eski %${split}`}
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
  return (
    <section className="sample-traces" aria-labelledby="sample-traces-title">
      <h2 id="sample-traces-title">İz Bırak örnekleri</h2>
      <p className="muted">
        Ekibin örnek olarak hazırladığı katkılar; ziyaretçi anısı değildir.
      </p>
      <div className="sample-trace-list">
        {traces.map((trace) => {
          const index = images.findIndex((i) => i.id === trace.historyImageId);
          return (
            <article className="card sample-trace" key={trace.id}>
              <img src={trace.photo.src} alt={trace.photo.alt} loading="lazy" />
              <div className="sample-trace-meta">
                <Tag tone="gold">Örnek</Tag>
                <strong>{trace.author}</strong>
              </div>
              <p>{trace.text}</p>
              <p className="sample-trace-credit">{trace.photo.description}</p>
              {index >= 0 && (
                <button
                  className="btn secondary"
                  onClick={() => onShow(index)}
                >
                  Eski fotoğrafı göster
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
  onBack,
  onMemory,
}: {
  site: HeritageSite;
  onBack: () => void;
  onMemory: () => void;
}) {
  const [selected, setSelected] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const images = site.historyImages ?? [];
  const image = images[selected] ?? images[0];
  const source = site.sources?.find((s) => s.id === image?.sourceId);
  const pair = image ? pairOf(site, image) : null;
  const traces = site.sampleTraces ?? [];
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
      <Back onClick={onBack} />
      <div className="row between">
        <div>
          <small className="eyebrow">AYNI YER, BAŞKA BİR ZAMAN</small>
          <h1>Geçmişi Gör</h1>
          <p className="muted">{site.name}</p>
        </div>
        {image && <Tag tone={image.trust}>{trustLabels[image.trust]}</Tag>}
      </div>
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
                <figcaption>
                  {image.dateLabel} · {image.caption}
                </figcaption>
              </figure>
              {pair?.angleMatch === "near" && (
                <p className="history-near">{NEAR_ANGLE}</p>
              )}
            </div>
            <aside className="card">
              <History size={28} />
              <h2>{image.caption}</h2>
              <p>{image.dateLabel}</p>
              <p className="archive-credit">
                {image.photo.description || source?.title}
              </p>
              <p className="muted">{image.photo.license}</p>
              {pair && (
                <p className="archive-credit-today">
                  <small>Bugünkü fotoğraf</small>{" "}
                  {pair.photo.description}
                </p>
              )}
              {source?.url && /^https?:\/\//.test(source.url) && (
                <a href={source.url} target="_blank" rel="noreferrer">
                  Arşiv kaydını aç ↗
                </a>
              )}
              {!pair && (
                <Notice>
                  Bu fotoğrafın bugünkü eş görüntüsü henüz eklenmedi.
                </Notice>
              )}
              <button className="btn secondary full" onClick={onMemory}>
                Bu açıdan fotoğrafın var mı?
                <ArrowRight size={16} />
              </button>
            </aside>
          </div>
          <div
            className="timeline archive-timeline"
            aria-label="Arşiv fotoğrafları"
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
                  {item.dateLabel}
                  {pairOf(site, item) && (
                    <>
                      <i className="history-pair-dot" aria-hidden="true" />
                      <span className="sr-only">, bugünkü eşi var</span>
                    </>
                  )}
                </strong>
                <small>{item.caption}</small>
              </button>
            ))}
          </div>
          {samples}
        </>
      ) : (
        <>
          <div className="card">
            <History size={32} />
            <h2>Bu eserin eski görüntüsü henüz yok</h2>
            <p>Kaynağı bilinen eski fotoğraflar eklendiğinde burada görünecek.</p>
            <button className="btn secondary" onClick={onMemory}>
              Bir fotoğraf paylaş
              <ArrowRight size={16} />
            </button>
          </div>
          {samples}
        </>
      )}
    </main>
  );
}
