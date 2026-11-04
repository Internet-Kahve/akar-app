"use client";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  List,
  Volume2,
  VolumeX,
  Play,
  X,
} from "lucide-react";
import type { HeritageSite, StoryBlock } from "@akar/domain";
import { sentenceSeconds, storySeconds, clock } from "../lib/story-time";
import { readPreference, writePreference } from "../lib/preferences";
import { track } from "../lib/usage";
import { useCountOpen } from "../lib/use-count-open";
import { useWide } from "./about-reading";
import { PART_VOICE_EVENT } from "./part-card";
import { SourceLink, TrustTag } from "./side-sheet";
import { storyText } from "../lib/story-text";
import { pickNarration, type VoiceGender } from "../lib/story-voice";
import type { Lang } from "../lib/i18n";
import type { MessageKey } from "../lib/messages";
import { Localized, useI18n } from "./i18n";

const RATES = [1, 1.25, 1.5];
/** Scroll events this long after a wheel or a finger still belong to the visitor (momentum). */
const HAND_SCROLL_MS = 900;

/**
 * The numbered sentences with the player under them; listening moves through them by itself. On a phone the
 * list is a sheet under the scene, and listening shows one sentence on a card over it.
 */
/**
 * A tap on the story's photograph or model (akar-app, the stage on a phone): `detail` is +1 (on) or -1 (back), as an
 * Instagram story moves on a tap on its picture (Muhammed, 3 Nov 2026: «sağa sola basma kartta değil fotoğrafta»).
 */
export const STORY_STEP_EVENT = "akar:hikaye-adim";

export function StoryPanel({
  site,
  index,
  onIndex,
  onClose,
  onComplete,
  startListening = false,
  lang = "tr",
  voiceLang,
  voiceGender,
  onVoice,
  hold = false,
}: {
  site: HeritageSite;
  index: number;
  onIndex: (n: number) => void;
  onClose: () => void;
  onComplete: () => void;
  startListening?: boolean;
  lang?: "tr" | "en";
  /** The voice the visitor listens to (language and gender of the recordings). */
  voiceLang: Lang;
  voiceGender: VoiceGender;
  onVoice: (choice: { lang?: Lang; gender?: VoiceGender }) => void;
  /** A first-time hint is on screen: the story waits (no voice, no autoplay) until it is put away (3 Nov 2026). */
  hold?: boolean;
}) {
  const { t } = useI18n();
  const wide = useWide();
  // The sound is on unless the visitor turned it off (Muhammed, 3 Nov 2026: «ses default olarak açık olsun»).
  const soundKept = () => startListening || readPreference("akar.ses") !== "0";
  const [listen, setListen] = useState(soundKept),
    // A phone always starts on the one-sentence card; the whole list is a tap away (☰).
    [listOpen, setListOpen] = useState(() => !startListening && matchMedia("(min-width: 1000px)").matches),
    [folded, setFolded] = useState(false),
    cardRef = useRef<HTMLDivElement>(null),
    [playing, setPlayingState] = useState(soundKept),
    [rate, setRate] = useState(1),
    // Autoplay: with the sound off the sentences still move on by themselves, at about the time each takes to read.
    [auto, setAutoState] = useState(() => readPreference("akar.otomatik") === "1"),
    [error, setError] = useState<MessageKey | "">(""),
    list = useRef<HTMLOListElement>(null),
    // Only the visitor's own scrolling picks a sentence; a scroll that follows the sentence never does.
    scrolledByHand = useRef(0),
    pickedByScroll = useRef(false),
    // The end of the speech and a tap can both reach the last sentence's end.
    finished = useRef(false),
    // One element for every recording: a browser that let the first tap start it lets it play on.
    recording = useRef<HTMLAudioElement | null>(null);
  const stories = site.stories;
  const block = stories[index] ?? stories[0]!;
  const last = index >= stories.length - 1;
  function go(next: number) {
    if (next < stories.length) onIndex(Math.max(0, next));
    else if (!finished.current) {
      finished.current = true;
      track("story.complete", site.id);
      onComplete();
    }
  }
  const advance = useRef(go);
  advance.current = go;
  // The visitor's own switch is kept; the story's end or an error stopping it is not a choice.
  const setPlaying = (next: boolean | ((p: boolean) => boolean)) => setPlayingState(next);
  const chooseSound = (next: boolean) => {
    writePreference("akar.ses", next ? "1" : "0");
    if (next && !listen) setListen(true);
    setPlayingState(next);
  };
  const setAuto = (next: boolean) => {
    writePreference("akar.otomatik", next ? "1" : "0");
    setAutoState(next);
  };
  useEffect(() => {
    if (!auto || playing || hold) return;
    const timer = setTimeout(
      () => advance.current(index + 1),
      Math.max(3500, (sentenceSeconds(block.text) * 1000) / rate),
    );
    return () => clearTimeout(timer);
  }, [auto, playing, index, block, rate, hold]);
  useEffect(() => {
    const step = (e: Event) => advance.current(index + ((e as CustomEvent<number>).detail < 0 ? -1 : 1));
    window.addEventListener(STORY_STEP_EVENT, step);
    return () => window.removeEventListener(STORY_STEP_EVENT, step);
  }, [index]);
  // The scene ends above the card (model and photograph are never behind it): the card's height, as it changes.
  useEffect(() => {
    const el = cardRef.current,
      space = el?.closest<HTMLElement>(".workspace");
    if (!el || !space) return;
    const note = () => space.style.setProperty("--story-card-h", `${Math.round(el.getBoundingClientRect().height)}px`);
    note();
    const observer = new ResizeObserver(note);
    observer.observe(el);
    return () => {
      observer.disconnect();
      space.style.removeProperty("--story-card-h");
    };
  });
  // The ☰ list opens on the sentence being told.
  useEffect(() => {
    if (!listOpen || wide) return;
    (list.current?.children[index] as HTMLElement | undefined)?.scrollIntoView({ block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listOpen]);
  // Usage (§11.72): the story opened, each sentence that becomes the current one, and a listening that starts.
  useCountOpen(site.id, (id) => track("story.start", id));
  useCountOpen(String(index), (n) => track("story.sentence", site.id, Number(n)));
  const countedVoice = useRef<Lang | null>(null);
  useEffect(() => {
    if (!playing) countedVoice.current = null;
    else if (countedVoice.current !== voiceLang) {
      countedVoice.current = voiceLang;
      track("narration.play", site.id, voiceLang);
    }
  }, [playing, voiceLang, site.id]);
  useEffect(() => {
    writePreference(`akar.ilerleme.${site.id}`, String(index));
    if (pickedByScroll.current) {
      pickedByScroll.current = false;
      return;
    }
    const item = list.current?.children[index] as HTMLElement | undefined;
    if (!item || !list.current) return;
    list.current.scrollTo({
      top: item.offsetTop - list.current.offsetTop - 12,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [index, site.id]);
  useEffect(() => {
    const quiet = () => setPlaying(false);
    window.addEventListener(PART_VOICE_EVENT, quiet);
    return () => window.removeEventListener(PART_VOICE_EVENT, quiet);
  }, []);
  useEffect(() => {
    if (!playing || hold) return;
    let stopped = false;
    let retry: (() => void) | null = null;
    // No recording for this voice, or one that fails: the browser voice reads the sentence, never silence.
    const speak = () => {
      if (!("speechSynthesis" in window)) {
        setError("site.speechUnsupported");
        setPlaying(false);
        return;
      }
      const spoken = storyText(block, false, voiceLang);
      const utterance = new SpeechSynthesisUtterance(spoken.text);
      utterance.lang = spoken.lang === "en" ? "en-US" : "tr-TR";
      utterance.rate = rate;
      utterance.onend = () => advance.current(index + 1);
      utterance.onerror = (e) => {
        if (e.error !== "interrupted" && e.error !== "canceled") {
          setError("site.speechFailed");
          setPlaying(false);
        }
      };
      window.speechSynthesis.speak(utterance);
    };
    const clip = pickNarration(block, voiceLang, voiceGender, false);
    const player = clip ? (recording.current ??= new Audio()) : null;
    if (clip && player) {
      player.src = clip.url;
      player.defaultPlaybackRate = rate;
      player.playbackRate = rate;
      player.onended = () => advance.current(index + 1);
      player.onerror = () => {
        if (!stopped) speak();
      };
      player.play().catch((e: unknown) => {
        if (stopped || (e instanceof DOMException && e.name === "AbortError")) return;
        // The browser wants a touch before it plays sound: the recording waits for the next touch, never the machine voice.
        if (e instanceof DOMException && e.name === "NotAllowedError") {
          retry = () => {
            if (!stopped) void player.play().catch(() => {});
          };
          window.addEventListener("pointerdown", retry, { once: true, capture: true });
        } else speak();
      });
    } else speak();
    return () => {
      stopped = true;
      if (retry) window.removeEventListener("pointerdown", retry, { capture: true });
      if (player) {
        player.onended = null;
        player.onerror = null;
        player.pause();
      }
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [playing, block, rate, index, voiceLang, voiceGender, hold]);
  useEffect(() => {
    const keys = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (document.querySelector("dialog[open]") || target.closest("input, textarea, select"))
        return;
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowUp") {
        e.preventDefault();
        advance.current(index - 1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        advance.current(index + 1);
      } else if (e.key === " " && target.tagName !== "BUTTON") {
        e.preventDefault();
        if (listen) setPlaying((p) => !p);
        else advance.current(index + 1);
      }
    };
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  }, [index, listen, onClose]);
  const handScroll = () => {
    scrolledByHand.current = performance.now() + HAND_SCROLL_MS;
  };
  const clip = listen
    ? pickNarration(block, voiceLang, voiceGender, false)
    : undefined;
  const nextVoiceLang = voiceLang === "tr" ? "en" : "tr";
  const languageAvailable = stories.some((story) => pickNarration(story, nextVoiceLang, voiceGender, false));
  const voiceLabel = t(voiceGender === "female" ? "site.voiceFemale" : "site.voiceMale");
  const voiceControls = (
    <div className="story-voice-compact" role="group" aria-label={t("site.voiceLangLabel")}>
      <button
        className="story-lang"
        aria-label={t("site.voiceLanguage", { lang: voiceLang.toUpperCase() })}
        title={languageAvailable ? t("site.voiceLanguage", { lang: voiceLang.toUpperCase() }) : t("site.voiceUnavailable")}
        disabled={!languageAvailable}
        onClick={() => onVoice({ lang: nextVoiceLang })}
      >{voiceLang.toUpperCase()}</button>
      <button
        aria-label={t("site.voiceSelected", { voice: voiceLabel })}
        title={t("site.voiceSelected", { voice: voiceLabel })}
        onClick={() => onVoice({ gender: voiceGender === "female" ? "male" : "female" })}
      ><span aria-hidden="true">{voiceGender === "female" ? "♀" : "♂"}</span></button>
    </div>
  );
  const elapsed = stories
    .slice(0, index)
    .reduce((sum, s) => sum + sentenceSeconds(s.text), 0);
  const card = !wide && !listOpen;
  const chooseMode = (next: boolean) => {
    setListen(next);
    setListOpen(!next);
    if (!next) setPlaying(false);
    writePreference("akar.mod", next ? "dinle" : "oku");
  };
  const sourceOf = (s: StoryBlock) =>
    (site.sources ?? [])
      .filter((source) => source.id === s.sourceId)
      .map((source) => ({
        title: source.title,
        ...(source.page && { detail: t("site.pageShort", { page: source.page }) }),
      }));
  const current = sourceOf(block)[0];
  const shownNow = storyText(block, false, lang);
  // One round sound button in the middle: on, the story reads itself aloud and moves on by itself; off, it stops.
  const sound = (
    <button
      className={`story-sound${playing ? " on" : ""}`}
      aria-pressed={playing}
      aria-label={t(playing ? "site.soundOff" : "site.soundOn")}
      onClick={() => chooseSound(!playing)}
    >
      {playing ? <Volume2 size={22} /> : <VolumeX size={22} />}
    </button>
  );
  const player = (
    <div className="story-player">
      {wide ? (
        <span className="story-clock">
          {clock(elapsed / rate)} / {clock(storySeconds(stories) / rate)}
        </span>
      ) : (
        <button className="story-mode-link" onClick={() => chooseMode(!listen)}>
          {listen ? t("site.read") : t("site.listenMode")}
        </button>
      )}
      <div className="story-transport">
        <button className="story-step-wide" aria-label={t("site.prevPart")} disabled={index === 0} onClick={() => go(index - 1)}>
          <ChevronLeft size={26} />
        </button>
        {sound}
        <button className="story-step-wide" aria-label={last ? t("site.finishStory") : t("site.nextPart")} onClick={() => go(index + 1)}>
          <ChevronRight size={26} />
        </button>
      </div>
      <div className="story-player-end">
        <button
          className="story-rate"
          aria-label={t("site.speechRate", { rate })}
          onClick={() => setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length]!)}
        >
          {rate}x
        </button>
        {voiceControls}
      </div>
    </div>
  );
  const problem = error && (
    <p role="alert" className="error">
      {t(error)}
    </p>
  );
  const position = (
    <span className={card ? "sayac story-count" : "sr-only story-count"}>
      {index + 1} / {stories.length}
    </span>
  );
  // ‹ and › beside it (3 Nov 2026): where a tap on the picture is not at hand (the income road's map), and for anyone
  // who looks for them.
  const foot = (
    <div className="story-card-foot">
      {listOpen ? (
        <span className="story-foot-side" />
      ) : (
        <button className="story-all" aria-label={t("site.storyOpenList")} onClick={() => setListOpen(true)}>
          <List size={20} />
        </button>
      )}
      <button className="story-step" aria-hidden="true" tabIndex={-1} disabled={index === 0} onClick={() => go(index - 1)}>
        <ChevronLeft size={24} />
      </button>
      {sound}
      <button className="story-step" aria-hidden="true" tabIndex={-1} onClick={() => go(index + 1)}>
        <ChevronRight size={24} />
      </button>
      <span className="story-count">{index + 1} / {stories.length}</span>
    </div>
  );
  // The ☰ sheet's settings: autoplay, the speed, the voice (its language and gender).
  const settings = (
    <div className="story-settings">
      <button className={`story-chip${auto ? " on" : ""}`} aria-pressed={auto} onClick={() => setAuto(!auto)}>
        <Play size={14} fill={auto ? "currentColor" : "none"} />
        {t("site.autoplay")}
      </button>
      <button
        className="story-chip"
        aria-label={t("site.speechRate", { rate })}
        onClick={() => setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length]!)}
      >
        {rate}×
      </button>
      <button
        className="story-chip"
        aria-label={t("site.voiceSelected", { voice: voiceLabel })}
        onClick={() => onVoice({ gender: voiceGender === "female" ? "male" : "female" })}
      >
        <span aria-hidden="true">{voiceGender === "female" ? "♀" : "♂"}</span>
        {voiceLabel}
      </button>
      {languageAvailable && (
        <button
          className="story-chip"
          aria-label={t("site.voiceLanguage", { lang: voiceLang.toUpperCase() })}
          onClick={() => onVoice({ lang: nextVoiceLang })}
        >
          {voiceLang.toUpperCase()}
        </button>
      )}
    </div>
  );
  // A phone's whole list (☰): the sentences and the same sound button; no modes, no transport (3 Nov 2026).
  if (!wide && listOpen)
    return (
      <div className="story-panel liste" ref={cardRef}>
        <div className="story-list-head">
          <b>{t("site.storyListTitle")}</b>
          <button className="story-list-close" aria-label={t("site.storyCloseList")} onClick={() => setListOpen(false)}>
            <X size={18} />
          </button>
        </div>
        {settings}
        {problem}
        <button className="sr-only" aria-label={t("site.prevPart")} disabled={index === 0} onClick={() => go(index - 1)} />
        <button className="sr-only" aria-label={last ? t("site.finishStory") : t("site.nextPart")} onClick={() => go(index + 1)} />
        <ol className="story-list" ref={list}>
          {stories.map((s, i) => {
            const shown = storyText(s, false, lang);
            return (
              <li key={s.id} className={i === index ? "current" : ""}>
                <button
                  aria-current={i === index ? "step" : undefined}
                  aria-label={t("site.storyPartLabel", { n: i + 1, title: s.title || shown.text.slice(0, 40) })}
                  onClick={() => {
                    onIndex(i);
                    setListOpen(false);
                  }}
                >
                  <span>{i + 1}</span>
                  <p className="story-text">
                    <Localized tr={shown.tr} en={shown.en} />
                  </p>
                </button>
              </li>
            );
          })}
        </ol>
        {foot}
      </div>
    );
  // Phone (Muhammed, 3 Nov 2026, «Instagram hikâyesi gibi, Spotify'dan da basit»): one sentence on a small card.
  // A tap on the card's left third goes back, anywhere else on to the next. One sound button: on, the story reads
  // itself aloud and moves on by itself; off, it stops. ▾ folds the card away so the model and photograph show whole.
  if (card)
    return (
      <div className={`story-panel kart${folded ? " folded" : ""}${block.photoId ? " fotolu" : ""}`} ref={cardRef}>
        <button
          className="story-fold"
          aria-expanded={!folded}
          aria-label={t(folded ? "site.storyCardOpen" : "site.storyCardFold")}
          onClick={() => setFolded(!folded)}
        >
          {folded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {/* The taps are on the picture (STORY_STEP_EVENT); for a screen reader and the keyboard, the same two steps. */}
        <button className="sr-only" aria-label={t("site.prevPart")} disabled={index === 0} onClick={() => go(index - 1)} />
        <button className="sr-only" aria-label={last ? t("site.finishStory") : t("site.nextPart")} onClick={() => go(index + 1)} />
        {!folded && (
          <div className="story-card-body">
            <p className="story-card-text" aria-live="polite">
              <Localized tr={shownNow.tr} en={shownNow.en} />
            </p>
            {(current || site.source) && (
              <SourceLink
                mini
                label={`${current?.title ?? site.source}${current?.detail ? ` · ${current.detail}` : ""}`}
                trust={block.trust}
                quote={block.text}
                sources={sourceOf(block)}
              />
            )}
          </div>
        )}
        {problem}
        {foot}
      </div>
    );
  return (
    <div className="story-panel">
      {!wide && (
        <button className="story-grip" aria-label={t("site.storyCloseList")} onClick={() => setListOpen(false)}>
          <i />
        </button>
      )}
      <div className="story-bar">
        <button className="round-btn" onClick={onClose} aria-label={t("site.closeStory")}>
          <X size={18} />
        </button>
        {/* Wide screens (3 Nov 2026): the bar keeps only ✕ and the count; the sound sits between ‹ and › below. */}
        <span className="story-bar-gap" />
        {position}
      </div>
      {listen && !clip && <p className="story-voice-note">{t("site.voiceBrowser")}</p>}
      {problem}
      <ol
        className="story-list"
        ref={list}
        onWheel={handScroll}
        onTouchMove={handScroll}
        onScroll={(e) => {
          // In reading mode the sentence at the middle of the list leads the scene.
          if (listen || performance.now() > scrolledByHand.current) return;
          const box = e.currentTarget,
            middle = box.getBoundingClientRect().top + box.clientHeight / 2;
          let closest = index,
            distance = Infinity;
          Array.from(box.children).forEach((child, i) => {
            const r = child.getBoundingClientRect(),
              d = Math.abs(r.top + r.height / 2 - middle);
            if (d < distance) {
              distance = d;
              closest = i;
            }
          });
          if (closest !== index) {
            pickedByScroll.current = true;
            onIndex(closest);
          }
        }}
      >
        {stories.map((s, i) => {
          const shown = storyText(s, false, lang);
          return (
            <li key={s.id} className={i === index ? "current" : ""}>
              <button
                aria-current={i === index ? "step" : undefined}
                aria-label={t("site.storyPartLabel", {
                  n: i + 1,
                  title: s.title || shown.text.slice(0, 40),
                })}
                onClick={() => onIndex(i)}
              >
                <span>{i + 1}</span>
                <p className="story-text">
                  <Localized tr={shown.tr} en={shown.en} />
                </p>
              </button>
              <div className="story-sentence-foot">
                <TrustTag trust={s.trust} quote={s.text} sources={sourceOf(s)} />
              </div>
            </li>
          );
        })}
      </ol>
      {player}
    </div>
  );
}

/** The story's progress over the stage: one part per sentence, each one a way there. */
export function StoryProgress({
  stories,
  index,
  onIndex,
}: {
  stories: StoryBlock[];
  index: number;
  onIndex: (n: number) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="story-progress" role="group" aria-label={t("site.storyProgress")}>
      {stories.map((s, i) => (
        <button
          key={s.id}
          className={i <= index ? "done" : ""}
          aria-label={t("site.goToPart", { n: i + 1 })}
          onClick={() => onIndex(i)}
        />
      ))}
    </div>
  );
}
