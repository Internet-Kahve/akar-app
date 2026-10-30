"use client";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  ChevronRight,
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
import { TrustTag } from "./side-sheet";

const RATES = [1, 1.25, 1.5];
/** Scroll events this long after a wheel or a finger still belong to the visitor (momentum). */
const HAND_SCROLL_MS = 900;

function SourceLine({ site, block }: { site: HeritageSite; block: StoryBlock }) {
  const source = site.sources?.find((s) => s.id === block.sourceId);
  const title = source?.title || site.source;
  return title ? (
    <p className="story-source-line">
      Kaynak: {title}
      {source?.page ? ` · s. ${source.page}` : ""}
    </p>
  ) : null;
}

/** The numbered sentences with the player under them. Listening moves through the sentences by itself. */
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
  const [listen, setListen] = useState(startListening),
    [playing, setPlaying] = useState(startListening),
    [rate, setRate] = useState(1),
    [simple, setSimple] = useState(false),
    [error, setError] = useState(""),
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
      setError(
        "Bu tarayıcı sesli okumayı desteklemiyor. Metinden devam edebilirsin.",
      );
      setPlaying(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(
      simple ? block.simple || block.text : block.text,
    );
    utterance.lang = lang === "en" ? "en-US" : "tr-TR";
    utterance.rate = rate;
    utterance.onend = () => advance.current(index + 1);
    utterance.onerror = (e) => {
      if (e.error !== "interrupted" && e.error !== "canceled") {
        setError("Ses başlatılamadı. Okuma modundan devam edebilirsin.");
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
  return (
    <div className="story-panel">
      <div className="story-bar">
        <button
          className="round-btn"
          onClick={onClose}
          aria-label="Hikâyeyi kapat"
        >
          <X size={18} />
        </button>
        <div className="story-mode" role="group" aria-label="Anlatım biçimi">
          <button
            aria-pressed={listen}
            onClick={() => {
              setListen(true);
              writePreference("akar.mod", "dinle");
            }}
          >
            <Headphones size={15} />
            Dinle
          </button>
          <button
            aria-pressed={!listen}
            onClick={() => {
              setListen(false);
              setPlaying(false);
              writePreference("akar.mod", "oku");
            }}
          >
            <BookOpen size={15} />
            Oku
          </button>
        </div>
        <span className="story-count">
          {index + 1} / {stories.length}
        </span>
      </div>
      <label className="switch-label story-simple">
        <input
          type="checkbox"
          checked={simple}
          onChange={(e) => setSimple(e.target.checked)}
        />
        Sade anlatım
      </label>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
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
        {stories.map((s, i) => (
          <li key={s.id} className={i === index ? "current" : i < index ? "passed" : ""}>
            <button
              aria-current={i === index ? "step" : undefined}
              aria-label={`${i + 1}. bölüm: ${s.title || s.text.slice(0, 40)}`}
              onClick={() => onIndex(i)}
            >
              <span>{i + 1}</span>
              <p className="story-text">
                {simple ? s.simple || s.text : s.text}
              </p>
            </button>
            {i === index && (
              <div className="story-sentence-foot">
                <TrustTag
                  trust={s.trust}
                  quote={s.text}
                  sources={(site.sources ?? [])
                    .filter((source) => source.id === s.sourceId)
                    .map((source) => ({
                      title: source.title,
                      ...(source.page && { detail: `s. ${source.page}` }),
                    }))}
                />
                <SourceLine site={site} block={s} />
              </div>
            )}
          </li>
        ))}
      </ol>
      <div className="story-player">
        <span className="story-clock">
          {clock(elapsed / rate)} / {clock(storySeconds(stories) / rate)}
        </span>
        <div className="story-transport">
          <button
            aria-label="Önceki bölüm"
            disabled={index === 0}
            onClick={() => go(index - 1)}
          >
            <SkipBack size={20} />
          </button>
          {listen ? (
            <button
              className="story-play"
              aria-label={playing ? "Sesi durdur" : "Sesli okumayı başlat"}
              onClick={() => setPlaying(!playing)}
            >
              {playing ? <Pause size={22} /> : <Play size={22} />}
            </button>
          ) : (
            <button
              className="story-play"
              aria-label={last ? "Hikâyeyi tamamla" : "Devam et"}
              onClick={() => go(index + 1)}
            >
              <ChevronRight size={22} />
            </button>
          )}
          <button
            aria-label="Sonraki bölüm"
            onClick={() => go(index + 1)}
          >
            <SkipForward size={20} />
          </button>
        </div>
        <button
          className="story-rate"
          aria-label={`Ses hızı ${rate}x`}
          onClick={() =>
            setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length]!)
          }
        >
          {rate}x
        </button>
      </div>
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
  return (
    <div className="story-progress" role="group" aria-label="Hikâye ilerlemesi">
      {stories.map((s, i) => (
        <button
          key={s.id}
          className={i <= index ? "done" : ""}
          aria-label={`${i + 1}. bölüme git`}
          onClick={() => onIndex(i)}
        />
      ))}
    </div>
  );
}
