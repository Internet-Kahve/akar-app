import { useEffect, useRef, useState } from "react";
import { Headphones, Pause } from "lucide-react";
import { trustLabels, type PartCard, type SiteSource } from "@akar/domain";
import type { MessageKey } from "../lib/messages";
import { cardSpeech } from "../lib/story-text";
import { pickCardNarration } from "../lib/story-voice";
import { Localized, useI18n } from "./i18n";
import { Modal, Tag } from "./ui";
import { useVoice } from "./voice";

/** A model node name as a visitor reads it ("Tac_Kapi" → "Tac Kapi"). */
export const partLabel = (part: string) => part.replace(/_/g, " ");

/**
 * Plays the card's text in the visitor's voice: the recording when there is one, else the browser voice (never
 * silence). Stops when the card closes or the voice changes.
 */
function useCardVoice(card: PartCard) {
  const voice = useVoice();
  const [playing, setPlaying] = useState(false),
    [error, setError] = useState<MessageKey | "">(""),
    recording = useRef<HTMLAudioElement | null>(null);
  const clip = pickCardNarration(card, voice.lang, voice.gender);
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
      setPlaying((p) => !p);
    },
  };
}

/** 3D part card: photo strip (first = cover), text, trust and source; the text can be listened to. */
export function PartCardDialog({
  card,
  sources,
  onClose,
}: {
  card: PartCard;
  sources: SiteSource[];
  onClose: () => void;
}) {
  const [shown, setShown] = useState(0);
  const { t, lang } = useI18n();
  const listen = useCardVoice(card);
  const source = sources.find((s) => s.id === card.sourceId);
  return (
    <Modal title={<Localized tr={card.title} en={card.titleEn} />} onClose={onClose}>
      {card.photos.length > 0 && (
        <div className="part-card-photos">
          <div
            className="part-card-strip"
            onScroll={(e) => {
              const strip = e.currentTarget;
              setShown(Math.round(strip.scrollLeft / (strip.clientWidth || 1)));
            }}
          >
            {card.photos.map((photo) => (
              <figure key={photo.id}>
                <img src={photo.src} alt={photo.alt} />
                <figcaption>
                  {photo.title} · {photo.license}
                </figcaption>
              </figure>
            ))}
          </div>
          {card.photos.length > 1 && (
            <span className="part-card-count" aria-hidden="true">
              {shown + 1} / {card.photos.length}
            </span>
          )}
        </div>
      )}
      <p className="part-card-body">
        <Localized tr={card.body} en={card.bodyEn} />
      </p>
      {card.body.trim() && (
        <div className="part-card-listen">
          <button className="btn secondary" aria-pressed={listen.playing} onClick={listen.toggle}>
            {listen.playing ? <Pause size={16} /> : <Headphones size={16} />}
            {listen.playing ? t("site.stopAudio") : t("site.listenMode")}
          </button>
          {listen.playing && !listen.recorded && (
            <small className="muted">{t("site.cardVoiceBrowser")}</small>
          )}
        </div>
      )}
      {listen.error && (
        <p role="alert" className="error">
          {t(listen.error)}
        </p>
      )}
      <Tag tone={card.trust}>{trustLabels[card.trust]}</Tag>
      {source && <p className="muted part-card-source">
          {t("site.sourceLabel")} <span lang={lang === "en" ? "tr" : undefined}>{source.title}</span>
        </p>}
    </Modal>
  );
}
