"use client";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { sized } from "../lib/image-size";
import { Camera, ChevronDown, ChevronLeft, ChevronRight, History, Image as ImageIcon, MapPin, MapPinOff } from "lucide-react";
import type { HeritageSite, HistoryImage } from "@akar/domain";
import { pairOf, type HistoryPair } from "../lib/history-pair";
import { presentCredit, shortLicense, splitCredit } from "../lib/history-credit";
import { genitive } from "../lib/place-names";
import { seenFrom } from "../lib/viewpoint";
import { useWide } from "./about-reading";
import { HistoryCamera } from "./history-camera";
import { TrustTag } from "./side-sheet";
import { ViewpointMap } from "./viewpoint-map";
import { Localized, useI18n } from "./i18n";

const KEY_STEPS: Record<string, number> = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5 };
/** Width over height of each photograph once seen: the phone's box keeps it while the next one loads. */
const ratios = new Map<string, number>();

/** What the İz Bırak form opens with when the visitor comes from the camera. */
export interface MemoryDraft {
  photo: string;
  sameAngle: string;
}

/** How far the handle sways each way when a paired photograph opens, in % of the photograph, and for how long. */
const NUDGE = { reach: 8, ms: 1400, delay: 500 };

/**
 * The photograph box (prototype `.gg-foto`): the old photograph fitted whole over its own blurred copy; with a
 * present-day pair it becomes a slider (old on the left, today on the right, a handle you drag or move with the keys).
 * The handle moves over the photograph only, never over the blurred bands beside it, and sways once when it opens.
 */
function PhotoBox({
  image,
  pair,
  index,
  count,
  wide,
  sourceTitle,
  onStep,
}: {
  image: HistoryImage;
  pair: HistoryPair | null;
  sourceTitle: string;
  index: number;
  count: number;
  wide: boolean;
  onStep: (step: number) => void;
}) {
  const { t, lang, text } = useI18n();
  const content = lang === "en" ? "tr" : undefined;
  // `pos`: the handle's place across the photograph itself, 0 = its left edge, 100 = its right edge.
  const [pos, setPos] = useState(50),
    [shown, setShown] = useState(""),
    [ratio, setRatio] = useState(() => ratios.get(image.photo.src) ?? 1.3),
    [size, setSize] = useState({ w: 0, h: 0 });
  const box = useRef<HTMLDivElement>(null),
    start = useRef<number | null>(null),
    dragging = useRef(false),
    sideways = useRef<number | null>(null),
    touched = useRef(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setSize({ w: entry!.contentRect.width, h: entry!.contentRect.height }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  // The photograph is fitted whole (`contain`): its width in the box, and its left edge in % of the box.
  const photoW = size.w ? Math.min(size.w, size.h * ratio) : 0,
    edge = size.w ? ((size.w - photoW) / 2 / size.w) * 100 : 0,
    split = edge + (pos * (100 - 2 * edge)) / 100;
  const clamp = (v: number) => Math.min(100, Math.max(0, Math.round(v)));
  const place = (el: HTMLElement, x: number) => {
    touched.current = true;
    const r = el.getBoundingClientRect(),
      w = Math.min(r.width, r.height * ratio);
    if (w) setPos(clamp(((x - r.left - (r.width - w) / 2) / w) * 100));
  };
  const loaded = shown === image.photo.src;
  // Each photograph opens with the line in the middle, so both sides show.
  useEffect(() => {
    touched.current = false;
    setPos(50);
  }, [image.id]);
  useEffect(() => {
    // Once the photograph is in, the handle sways right, left and back, so the visitor sees it can be moved.
    if (!pair || !loaded || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const timer = setTimeout(() => {
      const t0 = performance.now();
      const step = (now: number) => {
        if (touched.current) return;
        const t = Math.min(1, (now - t0) / NUDGE.ms);
        setPos(50 + NUDGE.reach * Math.sin(2 * Math.PI * t) * Math.sin(Math.PI * t));
        if (t < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    }, NUDGE.delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [pair, loaded]);
  const onKey = (event: KeyboardEvent) => {
    const step = KEY_STEPS[event.key];
    const now = Math.round(pos);
    const next = step !== undefined ? now + step : event.key === "Home" ? 0 : event.key === "End" ? 100 : null;
    if (next === null) return;
    event.preventDefault();
    event.stopPropagation();
    touched.current = true;
    setPos(clamp(next));
  };
  return (
    <div
      ref={box}
      className={`gg-foto${pair ? " esli" : ""}`}
      style={{ "--ayrim": `${split}%`, "--oran": ratio } as CSSProperties}
      onPointerDown={(e) => {
        // On a phone a finger on the line moves it; a swipe elsewhere goes to the next photograph, as on any other, and a
        // tap there puts the line there (Muhammed, 4 Nov 2026: «sağa kaydıramıyorum»).
        const r = e.currentTarget.getBoundingClientRect();
        const onLine = wide || e.pointerType === "mouse" || Math.abs(e.clientX - (r.left + (split / 100) * r.width)) < 56;
        if (pair && onLine && !(e.target as HTMLElement).closest("button")) {
          // A finger going up or down scrolls the page (`touch-action: pan-y`, then the browser cancels this touch);
          // only one going sideways moves the line. A mouse takes hold at once.
          dragging.current = true;
          sideways.current = e.pointerType === "mouse" ? null : e.clientX;
          if (e.pointerType === "mouse") {
            e.preventDefault();
            place(e.currentTarget, e.clientX);
          }
          e.currentTarget.setPointerCapture(e.pointerId);
          return;
        }
        start.current = e.clientX;
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        if (sideways.current !== null) {
          if (Math.abs(e.clientX - sideways.current) < 4) return;
          sideways.current = null;
        }
        place(e.currentTarget, e.clientX);
      }}
      onPointerCancel={() => {
        dragging.current = false;
        start.current = null;
      }}
      onPointerUp={(e) => {
        if (dragging.current) {
          dragging.current = false;
          // A tap on the photograph puts the line there.
          if (sideways.current !== null) place(e.currentTarget, e.clientX);
          return;
        }
        if (start.current === null || wide) return;
        const dx = e.clientX - start.current;
        start.current = null;
        if (Math.abs(dx) > 40) onStep(dx < 0 ? 1 : -1);
        else if (pair && Math.abs(dx) < 10 && !(e.target as HTMLElement).closest("button")) place(e.currentTarget, e.clientX);
      }}
    >
      {pair && (
        <div className="gg-bugun-kat">
          <img className="b-bulanik" src={sized(pair.photo.src, 96)} alt="" draggable={false} decoding="async" />
          <img className="b-ana" src={pair.photo.src} alt={pair.photo.alt} draggable={false} />
        </div>
      )}
      <div className="gg-eski-kat">
        <img className="bulanik" src={sized(image.photo.src, 96)} alt="" draggable={false} decoding="async" />
        <img
          className="ana"
          src={image.photo.src}
          alt={image.photo.alt}
          draggable={false}
          style={{ opacity: loaded ? 1 : 0 }}
          onLoad={(e) => {
            setShown(image.photo.src);
            const img = e.currentTarget;
            if (!img.naturalHeight) return;
            ratios.set(image.photo.src, img.naturalWidth / img.naturalHeight);
            setRatio(img.naturalWidth / img.naturalHeight);
          }}
        />
      </div>
      {pair && (
        <>
          <span className="gg-k-etiket" lang={content}>
            {image.dateLabel}
          </span>
          <span className="gg-k-etiket sag">
            {t("gg.todayBy", { by: pair.by })}
            {pair.example && ` · ${t("site.sampleTrace")}`}
          </span>
          <div
            className="gg-k-tutamak"
            role="slider"
            tabIndex={0}
            aria-label={t("site.compareSlider")}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pos)}
            aria-valuetext={t("site.oldPercent", { pct: Math.round(pos) })}
            onKeyDown={onKey}
          >
            <span aria-hidden="true">‹ ›</span>
          </div>
        </>
      )}
      <span className="gg-sayac">
        {index + 1} / {count}
      </span>
      <span className="gg-guven">
        <TrustTag trust={image.trust} quote={text(image.caption, image.captionEn)} sources={sourceTitle ? [{ title: sourceTitle }] : []} />
      </span>
      {wide && (
        <>
          <button className="yuvarlak gg-ok" style={{ left: 16 }} aria-label={t("gg.prev")} onClick={() => onStep(-1)}>
            <ChevronLeft size={18} />
          </button>
          <button className="yuvarlak gg-ok" style={{ right: 16 }} aria-label={t("gg.next")} onClick={() => onStep(1)}>
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </div>
  );
}

export function HistoryView({
  site,
  sites,
  start = 0,
  onBack,
  onMemory,
  onSite,
}: {
  site: HeritageSite;
  /** Every published site: the map names them and shows their old photographs; a site with none may stand in another's view. */
  sites: HeritageSite[];
  /** The photograph it opens at (another site's «Uzaktan görünüyor» row). */
  start?: number;
  onBack: () => void;
  /** Opens İz Bırak; from the camera with the shot and its «same angle» label. */
  onMemory: (draft?: MemoryDraft) => void;
  /** Opens another site's See the Past at one of its photographs. */
  onSite: (id: string, index: number) => void;
}) {
  const { t, lang, text } = useI18n();
  const content = lang === "en" ? "tr" : undefined;
  const wide = useWide();
  const name = text(site.name, site.nameEn);
  const images = site.historyImages ?? [];
  const [index, setIndex] = useState(() => Math.min(Math.max(0, start), Math.max(0, images.length - 1))),
    [camera, setCamera] = useState(false),
    [whereHidden, setWhereHidden] = useState(false);
  const strip = useRef<HTMLDivElement>(null),
    whereRef = useRef<HTMLDivElement>(null),
    mapRef = useRef<HTMLDivElement>(null);
  const count = images.length;
  const image = images[index];
  const pair = image ? pairOf(site, image, lang) : null;
  const select = (next: number) => setIndex(((next % count) + count) % count);
  useEffect(() => {
    // The selected thumbnail is centred in the strip itself (scrollIntoView would also move the page sideways).
    const s = strip.current,
      b = s?.children[index] as HTMLElement | undefined;
    if (!s || !b) return;
    const sr = s.getBoundingClientRect(),
      br = b.getBoundingClientRect();
    s.scrollTo({
      left: s.scrollLeft + br.left - sr.left - (s.clientWidth - br.width) / 2,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [index]);
  useEffect(() => {
    // «Nereden çekildi?» and its map may sit below the screen (a long title, a low window, the phone's flow): a pill
    // then points down to them, until half the map is in sight.
    const el = mapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setWhereHidden(!entry!.isIntersecting), { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [wide, count]);
  useEffect(() => {
    if (camera) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, [role=slider]") || document.querySelector("[role=dialog]")) return;
      if (e.key === "Escape") onBack();
      else if (count && e.key === "ArrowRight") setIndex((i) => (i + 1) % count);
      else if (count && e.key === "ArrowLeft") setIndex((i) => (i - 1 + count) % count);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [camera, count, onBack]);
  const head = (
    <div className="gg-bas">
      <button className="ikon-btn" aria-label={t("gg.back")} onClick={onBack}>
        <ChevronLeft size={18} />
      </button>
      <div className={wide ? "gg-baslik serif-baslik" : "gg-baslik"}>
        <h1>{t("site.historyTitle")}</h1>
        <small>{name}</small>
      </div>
    </div>
  );
  const share = (
    <button className="btn cerceve tam" onClick={() => onMemory()}>
      {t("site.shareOldPhoto")}
    </button>
  );
  if (!image) {
    const far = seenFrom(site, sites);
    const empty = (
      <div className="gg-bos">
        <ImageIcon size={40} />
        <h2>{t("site.noArchiveTitle")}</h2>
        <span>{t("gg.noArchiveBody")}</span>
      </div>
    );
    const list = far.length > 0 && (
      <div className="gg-uzak">
        <b className="gg-uzak-bas">{t("site.farViewsTitle")}</b>
        {wide && <small className="soluk">{t("gg.farSeen", { name })}</small>}
        {far.map((v) => (
          <button
            key={v.image.id}
            className="gg-uzak-satir"
            onClick={() => onSite(v.site.id, v.site.historyImages!.indexOf(v.image))}
          >
            <img src={sized(v.image.photo.src, 96)} alt="" loading="lazy" decoding="async" />
            <div>
              <b><Localized tr={v.image.caption} en={v.image.captionEn} /></b>
              <small>{t("gg.farRow", { date: v.image.dateLabel, m: v.distance })}</small>
            </div>
          </button>
        ))}
      </div>
    );
    return wide ? (
      <main id="main-content" tabIndex={-1} className="gg gg-d">
        {head}
        <div className="gg-izgara">
          <div className="gg-sol">{empty}</div>
          <aside className="gg-kart">
            {list || (
              <>
                <b className="gg-uzak-bas">{t("site.farViewsTitle")}</b>
                <small className="soluk">{t("gg.farNone")}</small>
              </>
            )}
            <div style={{ marginTop: "auto" }}>{share}</div>
          </aside>
        </div>
      </main>
    ) : (
      <main id="main-content" tabIndex={-1} className="gg gg-m gg-m-bos">
        {head}
        <div className="gg-kaydir">
          {empty}
          {list}
        </div>
        <div className="gg-bos-alt">{share}</div>
      </main>
    );
  }
  const { by, rest } = splitCredit(image.photo.description);
  const interior = (i: HistoryImage) => !!i.viewpoint?.interior;
  const withoutToday = images.filter((i) => !pairOf(site, i, lang)).length;
  const photo = (
    <PhotoBox
      key={image.id}
      image={image}
      pair={pair}
      index={index}
      count={count}
      wide={wide}
      sourceTitle={site.sources?.find((s) => s.id === image.sourceId)?.title ?? ""}
      onStep={(step) => select(index + step)}
    />
  );
  const near = pair?.angleMatch === "near" && <p className="gg-yakin">{t("site.nearAngle")}</p>;
  const info = (
    <div id="gg-bilgi">
      <h2 className="gg-ad">
        <Localized tr={image.caption} en={image.captionEn} />
      </h2>
      <div className="gg-meta" lang={content}>
        {image.dateLabel} · {by ?? t("gg.photographerUnknown")}
      </div>
      <div className="gg-kaynak" lang={content}>
        {rest} · {shortLicense(image.photo.license)}
        {pair && ` · ${t(pair.photo.trust === "representative" && !pair.example ? "site.presentImagined" : "site.presentPhoto")}: ${presentCredit(pair.photo.description)}`}
      </div>
    </div>
  );
  const today = pair ? (
    <div className="gg-bugun var">
      <span className="gb-ik">
        <History size={18} />
      </span>
      <div>
        <b>{t("site.todayExists")}</b>
        <small>{t("site.todayCompare")}</small>
      </div>
      <button className="metin-btn" onClick={() => setCamera(true)}>
        {t("gg.takeAnother")}
      </button>
    </div>
  ) : (
    <div className="gg-bugun yok">
      <span className="gb-ik">
        <Camera size={18} />
      </span>
      <div>
        <b>{t("site.todayMissing")}</b>
        <small>
          {t(interior(image) ? "gg.todayInterior" : image.viewpoint ? "site.todayLocate" : "site.todayUnknown")}
        </small>
      </div>
      <button className="btn ana tam" onClick={() => setCamera(true)}>
        <Camera size={18} />
        {t("site.takeToday")}
      </button>
    </div>
  );
  const thumbs = (
    <>
      <div className="gg-serit-bas">
        <b>{wide ? `${t("gg.oldPhotos")} · ${count}` : t("gg.oldPhotos")}</b>
        {!wide && <span className="soluk">{t("gg.photoCount", { n: count })}</span>}
      </div>
      {withoutToday > 0 && (
        <p className="gg-cagri">
          <Camera size={14} />
          {withoutToday === count ? t("gg.callAll") : t("gg.callSome", { n: withoutToday })}
        </p>
      )}
      <div className="gg-serit" ref={strip}>
        {images.map((item, k) => {
          const paired = !!pairOf(site, item, lang);
          return (
            <button key={item.id} aria-current={k === index} onClick={() => select(k)}>
              <img src={sized(item.photo.src, 128)} alt="" loading="lazy" decoding="async" />
              {!paired && (
                <i className="gg-cek-isaret" title={t("gg.noToday")}>
                  <Camera size={11} />
                </i>
              )}
              <b lang={content}>{item.dateLabel}</b>
              <span>
                {t(interior(item) ? "gg.typeInterior" : "gg.typePhoto")}
                {paired && (
                  <>
                    <i className="gg-bugunu-var" title={t("site.hasPresentPair")} />
                    <span className="gizli-metin">, {t("site.hasPresentPair")}</span>
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
  const where = (
    <div className="gg-nereden" ref={whereRef}>
      <span className="pin">
        <MapPin size={18} />
      </span>
      <div>
        <b>{t("site.whereFrom")}</b>
        <small>
          {image.viewpoint ? t(wide ? "gg.whereSub" : "gg.whereSubOpen") : t("gg.whereUnknown")}
        </small>
      </div>
    </div>
  );
  const located = !!image.viewpoint;
  const toWhere = located && whereHidden && (
    <button
      className="gg-nereye"
      onClick={() =>
        whereRef.current?.scrollIntoView({
          block: "start",
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        })
      }
    >
      <MapPin size={16} />
      {t("site.whereFrom")}
      <ChevronDown size={16} />
    </button>
  );
  const map = (
    <>
      <div className="gg-harita-kap" ref={mapRef}>
        <div style={{ visibility: located ? "visible" : "hidden", height: "100%" }}>
          <ViewpointMap site={site} sites={sites} images={images} selected={index} onSelect={select} />
        </div>
        {!located && (
          <div className="gg-bilinmiyor">
            <MapPinOff size={36} />
            <b>{t("gg.unknownTitle")}</b>
            <span>{t("gg.unknownBody")}</span>
          </div>
        )}
      </div>
      <div className="gg-lejant" style={{ visibility: located ? "visible" : "hidden" }}>
        <span>
          <i className="yesil" />
          {lang === "tr" ? t("gg.legendOwn", { name: genitive(name) }) : t("gg.legendOwn", { name })}
        </span>
        <span>
          <i />
          {t(wide ? "gg.legendOther" : "gg.legendOtherShort")}
        </span>
      </div>
    </>
  );
  const cameraView = camera && (
    <HistoryCamera
      site={site}
      image={image}
      wide={wide}
      onClose={() => setCamera(false)}
      onSend={(shot, sameAngle) => {
        setCamera(false);
        onMemory({ photo: shot, sameAngle });
      }}
    />
  );
  if (wide)
    return (
      <main id="main-content" tabIndex={-1} className="gg gg-d">
        {head}
        <div className="gg-izgara">
          <div className="gg-sol">
            {photo}
            {near}
            {thumbs}
          </div>
          <aside className="gg-kart">
            {info}
            <hr />
            {where}
            <div className="gg-kart-harita">{map}</div>
            <p className="gg-not">{t("gg.alignNote")}</p>
          </aside>
        </div>
        {toWhere}
        {cameraView}
      </main>
    );
  return (
    <main id="main-content" tabIndex={-1} className="gg gg-m gg-akis">
      {head}
      <div
        className="gg-kaydir"
        // The photograph gets smaller with the scroll, one pixel for one, and the page keeps its length (design.css):
        // a sudden change of height moved the page under the finger, and at the foot it could not settle.
        onScroll={(e) => e.currentTarget.style.setProperty("--gg-kaydir", `${e.currentTarget.scrollTop}px`)}
      >
        {photo}
        {near}
        {thumbs}
        {info}
        {today}
        <section className="gg-yer">
          {where}
          {map}
        </section>
      </div>
      {toWhere}
      {cameraView}
    </main>
  );
}
