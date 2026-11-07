"use client";
import { stillMotion } from "../lib/access";
import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { sized } from "../lib/image-size";
import { ChevronLeft, ChevronRight, Square, Volume2, X } from "lucide-react";
import type { PartCard, SiteSource } from "@akar/domain";
import type { MessageKey } from "../lib/messages";
import { cardSpeech } from "../lib/story-text";
import { pickTextNarration } from "../lib/story-voice";
import { Localized, useI18n } from "./i18n";
import { TrustTag } from "./side-sheet";
import { track } from "../lib/usage";
import { useCountOpen } from "../lib/use-count-open";
import { useVoice } from "./voice";

/** A model node name as a visitor reads it ("Tac_Kapi" → "Tac Kapi"). */
export const partLabel = (part: string) => part.replace(/_/g, " ");

/** Tells the story to stop speaking: two voices never overlap. */
export const PART_VOICE_EVENT = "akar:part-voice";

/**
 * Plays the card's text in the visitor's voice: the recording when there is one, else the browser voice (never
 * silence). Stops when the card closes or the voice changes.
 */
function useCardVoice(card: PartCard, siteId: string | undefined) {
  const voice = useVoice();
  const [playing, setPlaying] = useState(false),
    [error, setError] = useState<MessageKey | "">(""),
    recording = useRef<HTMLAudioElement | null>(null);
  const clip = pickTextNarration(card, voice.lang, voice.gender);
  useEffect(() => {
    if (!playing) return;
    let stopped = false;
    const speak = () => {
      if (!("speechSynthesis" in window)) {
        setError("site.speechUnsupported");
        setPlaying(false);
        return;
      }
      const spoken = cardSpeech(card, voice.lang);
      const utterance = new SpeechSynthesisUtterance(spoken.text);
      utterance.lang = spoken.lang === "en" ? "en-US" : "tr-TR";
      utterance.onend = () => setPlaying(false);
      utterance.onerror = (e) => {
        if (e.error !== "interrupted" && e.error !== "canceled") {
          setError("site.speechFailed");
        }
        setPlaying(false);
      };
      window.speechSynthesis.speak(utterance);
    };
    const player = clip ? (recording.current ??= new Audio()) : null;
    if (clip && player) {
      player.src = clip.url;
      player.onended = () => setPlaying(false);
      player.onerror = () => {
        if (!stopped) speak();
      };
      player.play().catch((e: unknown) => {
        if (!stopped && !(e instanceof DOMException && e.name === "AbortError")) speak();
      });
    } else speak();
    return () => {
      stopped = true;
      if (player) {
        player.onended = null;
        player.onerror = null;
        player.pause();
      }
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [playing, card, clip, voice.lang]);
  return {
    playing,
    error,
    recorded: Boolean(clip),
    toggle: () => {
      setError("");
      if (!playing) {
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
        window.dispatchEvent(new Event(PART_VOICE_EVENT));
        if (siteId) track("narration.play", siteId, voice.lang);
      }
      setPlaying((p) => !p);
    },
  };
}

/** 3D part card: photos sliding sideways on top, the text scrolling under them, a voice button. */
export function PartCardDialog({
  card,
  sources,
  siteId,
  onClose,
}: {
  card: PartCard;
  sources: SiteSource[];
  /** The site of the card, for usage counts (§11.72); absent in the admin preview. */
  siteId?: string | undefined;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const content = lang === "en" ? "tr" : undefined;
  const ref = useRef<HTMLDialogElement>(null),
    strip = useRef<HTMLDivElement>(null),
    titleId = useId();
  const [shown, setShown] = useState(0);
  const listen = useCardVoice(card, siteId);
  useCountOpen(siteId && card.id, () => track("part_card.open", siteId, card.id));
  const source = sources.find((s) => s.id === card.sourceId);
  const count = card.photos.length;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.focus({ preventScroll: true });
    };
  }, []);
  function goTo(index: number) {
    const box = strip.current;
    if (!box) return;
    const next = Math.max(0, Math.min(count - 1, index));
    box.scrollTo({
      left: next * box.clientWidth,
      behavior: stillMotion() ? "auto" : "smooth",
    });
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
                <img src={sized(photo.src, 560)} alt={photo.alt} loading="lazy" decoding="async" />
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
            <h2 id={titleId}>
              <Localized tr={card.title} en={card.titleEn} />
            </h2>
            <TrustTag
              trust={card.trust}
              quote={card.body}
              sources={source ? [{ title: source.title }] : []}
            />
          </div>
          {card.body.trim() && (
            <button
              className="round-btn pk-ses"
              aria-pressed={listen.playing}
              aria-label={listen.playing ? t("site.stopAudio") : t("site.listenCard")}
              onClick={listen.toggle}
            >
              {listen.playing ? <Square size={18} /> : <Volume2 size={20} />}
            </button>
          )}
        </div>
        <div className="pk-metin">
          <p>
            <Localized tr={card.body} en={card.bodyEn} />
          </p>
          {listen.playing && !listen.recorded && <small className="muted">{t("site.cardVoiceBrowser")}</small>}
          {listen.error && (
            <p role="alert" className="error">
              {t(listen.error)}
            </p>
          )}
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
