"use client";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { sized } from "../lib/image-size";
import { Scaling } from "lucide-react";
import type { PartCard, SitePhoto, SiteSource } from "@akar/domain";
import { Lightbox, useWide } from "./about-reading";
import { Localized, useI18n } from "./i18n";
import { PartCardDialog } from "./part-card";
import { clampCardScale, resizedCardScale } from "../lib/story-scene";

/** A press that moves less than this (px) is a tap, not a drag. */
const DRAG_SLOP = 6;
const EDGE = 8;

export type CardPlace = { left: number; top: number };
/** Size steps of the keyboard's ← → (and − +) on the size handle. */
const SCALE_STEP = 0.1;

/**
 * The sentence's photograph beside the model: it never covers what is highlighted, the visitor can drag it
 * elsewhere (`place`; the model then takes the whole canvas), and a tap opens the part card of the highlighted
 * part, or the photograph itself where there is none. Its corner handle sizes it (`scale`, Muhammed 2 Nov 2026);
 * a double click on the handle puts the card back where and how it was.
 */
export function StoryPhotoCard({
  photo,
  card,
  sources,
  place,
  onPlace,
  scale,
  onScale,
  onReset,
}: {
  photo: SitePhoto;
  card?: PartCard;
  sources: SiteSource[];
  place: CardPlace | null;
  onPlace: (place: CardPlace) => void;
  scale: number;
  onScale: (scale: number) => void;
  onReset: () => void;
}) {
  const wide = useWide();
  const [open, setOpen] = useState(false);
  const { t, text, lang } = useI18n();
  const press = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
    moved: boolean;
  } | null>(null);
  const dragged = useRef(false);
  const box = useRef<HTMLDivElement>(null);
  const down = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button) return;
    const el = box.current!;
    dragged.current = false;
    press.current = {
      x: e.clientX,
      y: e.clientY,
      left: el.offsetLeft,
      top: el.offsetTop,
      moved: false,
    };
  };
  const move = (e: PointerEvent<HTMLButtonElement>) => {
    const start = press.current;
    const el = box.current!;
    const stage = el.offsetParent as HTMLElement | null;
    if (!start || !stage) return;
    const dx = e.clientX - start.x,
      dy = e.clientY - start.y;
    if (!start.moved) {
      if (Math.hypot(dx, dy) < DRAG_SLOP) return;
      start.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    onPlace({
      left: Math.min(
        Math.max(EDGE, start.left + dx),
        stage.clientWidth - el.offsetWidth - EDGE,
      ),
      top: Math.min(
        Math.max(EDGE, start.top + dy),
        stage.clientHeight - el.offsetHeight - EDGE,
      ),
    });
  };
  const up = () => {
    dragged.current = !!press.current?.moved;
    press.current = null;
  };
  // The size handle: its drag sets the scale; a placed card stays inside the stage as it grows.
  const sizing = useRef<{ x: number; y: number; scale: number } | null>(null);
  const keepInside = () =>
    requestAnimationFrame(() => {
      const el = box.current,
        stage = el?.offsetParent as HTMLElement | null;
      if (!el || !stage || !place) return;
      const left = Math.min(Math.max(EDGE, el.offsetLeft), stage.clientWidth - el.offsetWidth - EDGE);
      const top = Math.min(Math.max(EDGE, el.offsetTop), stage.clientHeight - el.offsetHeight - EDGE);
      if (left !== el.offsetLeft || top !== el.offsetTop) onPlace({ left, top });
    });
  // A place kept from another window size may fall outside this stage: bring it in, now and on every resize.
  const keepInsideRef = useRef(keepInside);
  keepInsideRef.current = keepInside;
  useEffect(() => {
    const frame = keepInsideRef.current();
    const resize = () => keepInsideRef.current();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);
  const sizeDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    sizing.current = { x: e.clientX, y: e.clientY, scale };
  };
  const sizeMove = (e: PointerEvent<HTMLButtonElement>) => {
    const start = sizing.current;
    if (!start) return;
    onScale(resizedCardScale(start.scale, wide, e.clientX - start.x, e.clientY - start.y, !place));
  };
  const sizeUp = () => {
    sizing.current = null;
    keepInside();
  };
  const sizeKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = ["ArrowRight", "ArrowUp", "+", "="].includes(e.key)
      ? SCALE_STEP
      : ["ArrowLeft", "ArrowDown", "-"].includes(e.key)
        ? -SCALE_STEP
        : 0;
    if (e.key === "Home") {
      e.preventDefault();
      onReset();
    } else if (step) {
      e.preventDefault();
      onScale(clampCardScale(scale + step));
      keepInside();
    }
  };
  return (
    <>
      <div
        ref={box}
        className={`story-photo-card${place ? " placed" : ""}`}
        style={{ ...place, "--kart-s": scale } as CSSProperties}
      >
        <button
          type="button"
          className="story-photo-open"
          aria-label={t(card ? "site.photoCardOpenPart" : "site.photoCardEnlarge", {
            title: text(photo.title, photo.titleEn),
          })}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onClick={() => {
            // A drag ends in a click; skip that one, keyboard opens after it.
            if (dragged.current) dragged.current = false;
            else setOpen(true);
          }}
        >
          <img src={sized(photo.src, 1024)} alt="" draggable={false} decoding="async" />
          <span>
            <strong>
              <Localized tr={photo.title} en={photo.titleEn} />
            </strong>
            {photo.description && (
              <small lang={lang === "en" ? "tr" : undefined}>{photo.description}</small>
            )}
          </span>
        </button>
        <button
          type="button"
          className="story-photo-size"
          aria-label={t("site.photoCardSize", { percent: Math.round(scale * 100) })}
          title={t("site.photoCardSizeHint")}
          onPointerDown={sizeDown}
          onPointerMove={sizeMove}
          onPointerUp={sizeUp}
          onPointerCancel={sizeUp}
          onDoubleClick={onReset}
          onKeyDown={sizeKey}
        >
          <Scaling size={14} aria-hidden="true" />
        </button>
      </div>
      {open &&
        (card ? (
          <PartCardDialog
            card={card}
            sources={sources}
            onClose={() => setOpen(false)}
          />
        ) : (
          <Lightbox
            photos={[
              {
                src: photo.src,
                alt: photo.alt,
                caption: [text(photo.title, photo.titleEn), photo.license]
                  .filter(Boolean)
                  .join(" · "),
              },
            ]}
            index={0}
            onIndex={() => {}}
            onClose={() => setOpen(false)}
          />
        ))}
    </>
  );
}
