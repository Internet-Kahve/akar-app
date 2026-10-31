"use client";
import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { ChevronLeft, ChevronRight, Square, Volume2, X } from "lucide-react";
import type { PartCard, SiteSource } from "@akar/domain";
import { useI18n } from "./i18n";
import { TrustTag } from "./side-sheet";

/** A model node name as a visitor reads it ("Tac_Kapi" → "Tac Kapi"). */
export const partLabel = (part: string) => part.replace(/_/g, " ");

/** Tells the story to stop speaking: two voices never overlap. */
export const PART_VOICE_EVENT = "akar:part-voice";

/** 3D part card: photos sliding sideways on top, the text scrolling under them, a voice button. */
export function PartCardDialog({
  card,
  sources,
  onClose,
}: {
  card: PartCard;
  sources: SiteSource[];
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const content = lang === "en" ? "tr" : undefined;
  const ref = useRef<HTMLDialogElement>(null),
    strip = useRef<HTMLDivElement>(null),
    titleId = useId();
  const [shown, setShown] = useState(0),
    [speaking, setSpeaking] = useState(false);
  const source = sources.find((s) => s.id === card.sourceId);
  const count = card.photos.length;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      previous?.focus({ preventScroll: true });
    };
  }, []);
  function goTo(index: number) {
    const box = strip.current;
    if (!box) return;
    const next = Math.max(0, Math.min(count - 1, index));
    box.scrollTo({
      left: next * box.clientWidth,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }
  function voice() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (speaking) {
      setSpeaking(false);
      return;
    }
    window.dispatchEvent(new Event(PART_VOICE_EVENT));
    const utterance = new SpeechSynthesisUtterance(`${card.title}. ${card.body}`);
    utterance.lang = "tr-TR";
    utterance.onend = utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }
  return (
    <dialog
      ref={ref}
      className="parca-kart-arka"
      aria-labelledby={titleId}
      onCancel={onClose}
      onClick={(e: MouseEvent<HTMLDialogElement>) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        goTo(shown + (e.key === "ArrowRight" ? 1 : -1));
      }}
    >
      <section className="parca-kart">
        {count > 0 && (
          <div
            className="pk-fotolar"
            ref={strip}
            onScroll={(e) => {
              const box = e.currentTarget;
              setShown(Math.round(box.scrollLeft / (box.clientWidth || 1)));
            }}
          >
            {card.photos.map((photo) => (
              <figure key={photo.id}>
                <img src={photo.src} alt={photo.alt} />
                <figcaption lang={content}>{photo.title}</figcaption>
              </figure>
            ))}
          </div>
        )}
        {count > 1 && (
          <>
            <div className="pk-nokta" role="group" aria-label={t("site.partPhotos")}>
              {card.photos.map((photo, i) => (
                <button
                  key={photo.id}
                  type="button"
                  className={i === shown ? "on" : ""}
                  aria-label={t("site.photoCounter", { n: i + 1, total: count })}
                  aria-current={i === shown || undefined}
                  onClick={() => goTo(i)}
                >
                  <i />
                </button>
              ))}
            </div>
            <button
              type="button"
              className="round-btn pk-ok sol"
              aria-label={t("site.prevPhoto")}
              disabled={shown <= 0}
              onClick={() => goTo(shown - 1)}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="round-btn pk-ok sag"
              aria-label={t("site.nextPhoto")}
              disabled={shown >= count - 1}
              onClick={() => goTo(shown + 1)}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
        <button className="round-btn pk-kapat" aria-label={t("site.closeCard")} onClick={onClose}>
          <X size={18} />
        </button>
        <div className="pk-bas">
          <div>
            <h2 id={titleId} lang={content}>
              {card.title}
            </h2>
            <TrustTag
              trust={card.trust}
              quote={card.body}
              sources={source ? [{ title: source.title }] : []}
            />
          </div>
          <button
            className="round-btn pk-ses"
            aria-pressed={speaking}
            aria-label={speaking ? t("site.stopAudio") : t("site.listenCard")}
            onClick={voice}
          >
            {speaking ? <Square size={18} /> : <Volume2 size={20} />}
          </button>
        </div>
        <div className="pk-metin">
          <p lang={content}>{card.body}</p>
          {source && (
            <div className="pk-kaynak">
              {t("site.sourceLabel")} <span lang={content}>{source.title}</span>
            </div>
          )}
          {card.photos[shown]?.license && (
            <div className="pk-kunye" lang={content}>
              {card.photos[shown]!.license}
            </div>
          )}
        </div>
      </section>
    </dialog>
  );
}
