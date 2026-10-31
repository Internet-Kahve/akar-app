"use client";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Headphones,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import type { HeritageSite, StoryBlock } from "@akar/domain";
import { sentenceSeconds, storySeconds, clock } from "../lib/story-time";
import { writePreference } from "../lib/preferences";
import { useWide } from "./about-reading";
import { SourceLink, TrustTag } from "./side-sheet";
import { storyText } from "../lib/story-text";
import type { MessageKey } from "../lib/messages";
import { Localized, useI18n } from "./i18n";

const RATES = [1, 1.25, 1.5];
/** Scroll events this long after a wheel or a finger still belong to the visitor (momentum). */
const HAND_SCROLL_MS = 900;

/**
 * The numbered sentences with the player under them; listening moves through them by itself. On a phone the
 * list is a sheet under the scene, and listening shows one sentence on a card over it.
 */
export function StoryPanel({
  site,
  index,
  onIndex,
  onClose,
  onComplete,
  startListening = false,
  lang = "tr",
}: {
  site: HeritageSite;
  index: number;
  onIndex: (n: number) => void;
  onClose: () => void;
  onComplete: () => void;
  startListening?: boolean;
  lang?: "tr" | "en";
}) {
  const { t } = useI18n();
  const wide = useWide();
  const [listen, setListen] = useState(startListening),
    [listOpen, setListOpen] = useState(!startListening),
    [playing, setPlaying] = useState(startListening),
    [rate, setRate] = useState(1),
    [simple, setSimple] = useState(false),
    [error, setError] = useState<MessageKey | "">(""),
    list = useRef<HTMLOListElement>(null),
    // Only the visitor's own scrolling picks a sentence; a scroll that follows the sentence never does.
    scrolledByHand = useRef(0),
    pickedByScroll = useRef(false),
    // The end of the speech and a tap can both reach the last sentence's end.
    finished = useRef(false);
  const stories = site.stories;
  const block = stories[index] ?? stories[0]!;
  const last = index >= stories.length - 1;
  function go(next: number) {
    if (next < stories.length) onIndex(Math.max(0, next));
    else if (!finished.current) {
      finished.current = true;
      onComplete();
    }
  }
  const advance = useRef(go);
  advance.current = go;
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
    if (!playing) return;
    if (!("speechSynthesis" in window)) {
      setError("site.speechUnsupported");
      setPlaying(false);
      return;
    }
    const spoken = storyText(block, simple, lang);
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
    return () => window.speechSynthesis.cancel();
  }, [playing, block, rate, index, lang, simple]);
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
  const shownNow = storyText(block, simple, lang);
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
        <button aria-label={t("site.prevPart")} disabled={index === 0} onClick={() => go(index - 1)}>
          <SkipBack size={18} />
        </button>
        <button
          className="story-play"
          aria-label={playing ? t("site.stopAudio") : t("site.startAudio")}
          onClick={() => {
            if (!listen) setListen(true);
            setPlaying(!playing);
          }}
        >
          {playing ? <Pause size={22} /> : <Play size={22} />}
        </button>
        <button aria-label={last ? t("site.finishStory") : t("site.nextPart")} onClick={() => go(index + 1)}>
          <SkipForward size={18} />
        </button>
      </div>
      <button
        className="story-rate"
        aria-label={t("site.speechRate", { rate })}
        onClick={() => setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length]!)}
      >
        {rate}x
      </button>
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
  if (card)
    return (
      <div className="story-panel kart">
        <button className="story-grip" aria-label={t("site.storyOpenList")} onClick={() => setListOpen(true)}>
          <i />
        </button>
        <div className="story-card-top">
          {position}
          <TrustTag trust={block.trust} quote={block.text} sources={sourceOf(block)} />
        </div>
        <p className="story-card-text">
          <Localized tr={shownNow.tr} en={shownNow.en} />
        </p>
        {(current || site.source) && (
          <SourceLink
            label={
              <>
                {t("site.sourceLabel")} {current?.title ?? site.source}
                {current?.detail ? ` · ${current.detail}` : ""}
              </>
            }
            trust={block.trust}
            quote={block.text}
            sources={sourceOf(block)}
          />
        )}
        {problem}
        {player}
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
        <div className="story-mode" role="group" aria-label={t("site.storyMode")}>
          <button aria-pressed={listen} onClick={() => chooseMode(true)}>
            <Headphones size={16} />
            {t("site.listenMode")}
          </button>
          <button aria-pressed={!listen} onClick={() => chooseMode(false)}>
            <BookOpen size={16} />
            {t("site.read")}
          </button>
        </div>
        <span className="story-lang">{lang.toUpperCase()}</span>
        {position}
      </div>
      <label className="switch-label story-simple">
        <input type="checkbox" checked={simple} onChange={(e) => setSimple(e.target.checked)} />
        {t("site.simpleMode")}
      </label>
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
          const shown = storyText(s, simple, lang);
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
