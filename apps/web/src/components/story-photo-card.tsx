"use client";
import { useRef, useState, type PointerEvent } from "react";
import type { PartCard, SitePhoto, SiteSource } from "@akar/domain";
import { Lightbox } from "./about-reading";
import { Localized, useI18n } from "./i18n";
import { PartCardDialog } from "./part-card";

/** A press that moves less than this (px) is a tap, not a drag. */
const DRAG_SLOP = 6;
const EDGE = 8;

export type CardPlace = { left: number; top: number };

/**
 * The sentence's photograph beside the model: it never covers what is highlighted, the visitor can drag it
 * elsewhere (`place`; the model then takes the whole canvas), and a tap opens the part card of the highlighted
 * part, or the photograph itself where there is none.
 */
export function StoryPhotoCard({
  photo,
  card,
  sources,
  place,
  onPlace,
}: {
  photo: SitePhoto;
  card?: PartCard;
  sources: SiteSource[];
  place: CardPlace | null;
  onPlace: (place: CardPlace) => void;
}) {
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
  const down = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button) return;
    const el = e.currentTarget;
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
    const el = e.currentTarget;
    const stage = el.offsetParent as HTMLElement | null;
    if (!start || !stage) return;
    const dx = e.clientX - start.x,
      dy = e.clientY - start.y;
    if (!start.moved) {
      if (Math.hypot(dx, dy) < DRAG_SLOP) return;
      start.moved = true;
      el.setPointerCapture(e.pointerId);
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
  return (
    <>
      <button
        type="button"
        className={`story-photo-card${place ? " placed" : ""}`}
        style={place ?? undefined}
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
        <img src={photo.src} alt="" draggable={false} />
        <span>
          <strong>
            <Localized tr={photo.title} en={photo.titleEn} />
          </strong>
          {photo.description && (
            <small lang={lang === "en" ? "tr" : undefined}>{photo.description}</small>
          )}
        </span>
      </button>
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
