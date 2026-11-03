"use client";
import { ArrowUp, MousePointer2, Pointer, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { readPreference, writePreference } from "../lib/preferences";
import { useI18n } from "./i18n";

/** What the finger (or, on a wide screen, the cursor) shows: a tap, a swipe up or down, taps on the right, a turn. */
export type CoachGesture = "tap" | "swipe-up" | "swipe-down" | "tap-sides" | "turn" | "click";

type Rect = { x: number; y: number; w: number; h: number };
const rectsOf = (selector: string, pad: number): Rect[] =>
  [...document.querySelectorAll<HTMLElement>(selector)]
    .filter((el) => el.offsetParent !== null || getComputedStyle(el).position === "fixed")
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.height > 0)
    .map((r) => ({ x: r.left - pad, y: r.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 }));

/** The rectangles of `selector`, followed as the page moves (layout settling, a sheet gliding, a resize). */
function useRects(selector: string | undefined, pad = 8) {
  const [rects, setRects] = useState<Rect[]>([]);
  useEffect(() => {
    if (!selector) return;
    let frame = 0;
    const measure = () => {
      const next = rectsOf(selector, pad);
      setRects((old) => (JSON.stringify(old) === JSON.stringify(next) ? old : next));
    };
    const loop = () => {
      measure();
      frame = window.setTimeout(loop, 250);
    };
    loop();
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(frame);
      window.removeEventListener("resize", measure);
    };
  }, [selector, pad]);
  return rects;
}

const rounded = ({ x, y, w, h }: Rect, r = 16) =>
  `M${x + r},${y}h${w - 2 * r}a${r},${r} 0 0 1 ${r},${r}v${h - 2 * r}a${r},${r} 0 0 1 -${r},${r}h-${w - 2 * r}a${r},${r} 0 0 1 -${r},-${r}v-${h - 2 * r}a${r},${r} 0 0 1 ${r},-${r}z`;

/**
 * The screen darkened but for what matters (Muhammed, 3 Nov 2026: «o iki buton ve ipucu haricinde diğer kısımların
 * üzerinde siyah opaklık»): the elements of `holes` stay lit, an arrow can point at `arrowTo`. It takes no touch:
 * the lit elements are pressed as ever.
 */
export function Spotlight({ holes, arrowTo, children }: { holes: string; arrowTo?: string; children?: ReactNode }) {
  const lit = useRects(holes);
  const target = useRects(arrowTo, 0)[0];
  if (typeof document === "undefined") return null;
  const w = window.innerWidth;
  const h = window.innerHeight;
  return createPortal(
    <>
      <div className="spotlight" aria-hidden="true">
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <path fillRule="evenodd" d={`M0,0H${w}V${h}H0Z ${lit.map((r) => rounded(r)).join(" ")}`} />
        </svg>
        {target && (
          <span className="spotlight-arrow" style={{ left: target.x + target.w / 2, top: target.y + target.h + 6 }}>
            <ArrowUp size={26} strokeWidth={2.6} />
          </span>
        )}
      </div>
      {children}
    </>,
    document.body,
  );
}

/**
 * A first-time hint (Muhammed, 3 Nov 2026: «Instagram, Subway Surfers gibi; buton değil, kısa bir yazı, parmak resmi,
 * hareket»): a finger doing what to do, and a few words, where it matters. Shown once on this device; the visitor's
 * first touch anywhere puts it away for good.
 * - `spot`: the screen darkens but for these elements; `arrowTo` gets an arrow.
 * - `needs`: shown only while this element is on screen; never there, the hint passes without being seen.
 * - `swallow`: that first touch does nothing else (a story's first tap does not skip its first sentence);
 *   `pressSpot` lets a press on the lit element through.
 * - `onDone`: called once it is put away, for the next hint in a row.
 */
export function CoachTip({
  id,
  text,
  place,
  gesture,
  spot,
  arrowTo,
  needs,
  swallow = false,
  pressSpot = false,
  waitMs = 1600,
  onDone,
  onSkip,
}: {
  id: string;
  text: string;
  place: "map" | "above-card" | "above-site-card" | "stage" | "under-spot";
  gesture: CoachGesture;
  spot?: string;
  arrowTo?: string;
  needs?: string;
  /** How long `needs` may take to come before the hint passes. */
  waitMs?: number;
  swallow?: boolean;
  /** With `swallow`: a press on the lit element is not swallowed (it is what the hint asks for). */
  pressSpot?: boolean;
  onDone?: () => void;
  /** `needs` is not on screen: passed over this time, not marked seen (it comes when its element does). */
  onSkip?: () => void;
}) {
  const { t } = useI18n();
  const closeLabel = t("common.close");
  const key = `akar.ipucu.${id}`;
  const [shown, setShown] = useState(() => typeof window !== "undefined" && !readPreference(key));
  const done = () => {
    writePreference(key, "1");
    setShown(false);
    onDone?.();
  };
  // It shows once its element is on screen. An element that does not come (no parts to tap on this site) passes the
  // hint without its ever having shown, never a dark screen pointing at nothing.
  const [present, setPresent] = useState(!needs);
  useEffect(() => {
    if (!shown || !needs) return;
    const gaveUpAt = Date.now() + waitMs;
    const timer = setInterval(() => {
      if (document.querySelector(needs)) {
        clearInterval(timer);
        setPresent(true);
      } else if (Date.now() > gaveUpAt) {
        clearInterval(timer);
        if (onSkip) {
          setShown(false);
          onSkip();
        } else done();
      }
    }, 100);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, needs]);
  useEffect(() => {
    if (!shown || !present) return;
    document.body.dataset.coach = id;
    // A moment's grace, so the touch that opened this screen does not put its hint away.
    let armed = false;
    const arm = setTimeout(() => (armed = true), 700);
    const away = (e: Event) => {
      // Waiting behind the photo-or-3D question (design.css hides it meanwhile): that answer is not its touch.
      if (!armed || document.querySelector(".view-choice")) return;
      // The lit element itself still works (the parts button): its press is what the hint asks for.
      const onSpot = pressSpot && !!spot && !!(e.target as Element | null)?.closest?.(spot);
      if (swallow && !onSpot) {
        e.stopPropagation();
        e.preventDefault();
        // The rest of that touch (its up and click) goes nowhere either. No more than that: the hint's ✕ leaves the
        // page under the finger, so that touch may end in no click at all, and the visitor's next press must work.
        if (e.type === "pointerdown") {
          const eat = (ev: Event) => {
            ev.stopPropagation();
            ev.preventDefault();
          };
          const stop = () => {
            window.removeEventListener("pointerup", stop, true);
            window.removeEventListener("pointercancel", stop, true);
            window.removeEventListener("pointerup", eat, true);
            setTimeout(() => window.removeEventListener("click", eat, true), 350);
          };
          window.addEventListener("pointerup", eat, true);
          window.addEventListener("click", eat, true);
          window.addEventListener("pointerup", stop, true);
          window.addEventListener("pointercancel", stop, true);
        }
      }
      done();
    };
    window.addEventListener("pointerdown", away, true);
    window.addEventListener("wheel", away, { capture: true, passive: true });
    window.addEventListener("keydown", away, true);
    return () => {
      clearTimeout(arm);
      if (document.body.dataset.coach === id) delete document.body.dataset.coach;
      window.removeEventListener("pointerdown", away, true);
      window.removeEventListener("wheel", away, true);
      window.removeEventListener("keydown", away, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, present, key, swallow, pressSpot, spot]);
  const spotRect = useRects(shown && place === "under-spot" ? spot : undefined)[0];
  if (!shown || !present) return null;
  const Icon = gesture === "click" ? MousePointer2 : Pointer;
  const tip = (
    <div
      className={`coach-tip ${place} ${gesture}`}
      role="status"
      style={
        place === "under-spot" && spotRect
          ? {
              // Centred under the lit element (over it when there is no room), kept on screen.
              left: Math.min(window.innerWidth - 170, Math.max(170, spotRect.x + spotRect.w / 2)),
              ...(spotRect.y + spotRect.h + 150 < window.innerHeight
                ? { top: spotRect.y + spotRect.h + 14 }
                : { top: Math.max(12, spotRect.y - 136) }),
            }
          : undefined
      }
    >
      <span className="coach-finger" aria-hidden="true">
        <i className="coach-ring" />
        <Icon size={30} strokeWidth={1.8} />
      </span>
      <p>{text}</p>
      <button className="coach-close" aria-label={closeLabel} onClick={done}>
        <X size={14} strokeWidth={2.6} />
      </button>
    </div>
  );
  return spot ? (
    <Spotlight holes={spot} arrowTo={arrowTo}>
      {tip}
    </Spotlight>
  ) : (
    tip
  );
}

export type TipProps = Omit<Parameters<typeof CoachTip>[0], "onDone" | "onSkip"> & {
  /** Comes only once this element is on screen («the model is drawn»), however long that takes; never otherwise. */
  when?: string;
  /** Answers the visitor's own step («Şimdi bir parçaya dokun» once the parts are lit): not counted in `TIPS_PER_VISIT`. */
  follows?: boolean;
  /** A click on this does what the hint would teach: done by the visitor, the hint is never shown. */
  doneBy?: string;
};

/** Hints shown on one visit to a screen; the rest wait for the next visit, so a screen is never a tour to sit through. */
const TIPS_PER_VISIT = 2;
/** The pause before a hint: the screen shows itself first, and the next hint reads as a new one. */
const TIP_REST_MS = 500;

/**
 * Hints in a row (3 Nov 2026: «her bölüm sırayla tanıtılsın»), by what the visitor is doing (4 Nov 2026: «çeşitli
 * senaryolar var»): the first not yet seen whose moment has come shows; put away, the next comes after a breath. What the
 * visitor already did is not taught. At most `TIPS_PER_VISIT` on a visit. Not mounted while a card is open (`akar-app`).
 */
export function TipRow({ tips, onDone }: { tips: TipProps[]; onDone?: () => void }) {
  const [, setTick] = useState(0);
  const [skipped] = useState(() => new Set<string>());
  const [resting, setResting] = useState(true);
  const [seen, setSeen] = useState(0);
  const open = tips.filter((tip) => !skipped.has(tip.id) && !readPreference(`akar.ipucu.${tip.id}`));
  // Once its moment has come it stays come: the parts glow for a second only, the hint stays until it is put away.
  const [met] = useState(() => new Set<string>());
  for (const tip of open)
    if (tip.when && typeof document !== "undefined" && document.querySelector(tip.when)) met.add(tip.id);
  const within = (tip: TipProps) => tip.follows || seen < TIPS_PER_VISIT;
  const current = open.find((tip) => within(tip) && (!tip.when || met.has(tip.id)));
  const waiting = !current && open.some((tip) => tip.when && within(tip));
  // Nothing left for this visit, but for what waits on its moment.
  const over = !resting && !open.some((tip) => !tip.when && within(tip));
  useEffect(() => {
    if (over) onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);
  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(() => setTick((n) => n + 1), 300);
    return () => clearInterval(timer);
  }, [waiting]);
  useEffect(() => {
    if (!resting) return;
    const timer = setTimeout(() => setResting(false), TIP_REST_MS);
    return () => clearTimeout(timer);
  }, [resting]);
  const doneByKey = tips.map((tip) => `${tip.id}\n${tip.doneBy ?? ""}`).join("\n");
  useEffect(() => {
    const did = (e: Event) => {
      for (const tip of tips)
        if (tip.doneBy && !readPreference(`akar.ipucu.${tip.id}`) && (e.target as Element | null)?.closest?.(tip.doneBy)) {
          writePreference(`akar.ipucu.${tip.id}`, "1");
          setTick((n) => n + 1);
        }
    };
    window.addEventListener("click", did, true);
    return () => window.removeEventListener("click", did, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneByKey]);
  if (!current || resting) return null;
  const { when: _when, follows, doneBy: _doneBy, ...tip } = current;
  return (
    <CoachTip
      key={tip.id}
      {...tip}
      onDone={() => {
        if (!follows) setSeen((n) => n + 1);
        setResting(true);
      }}
      onSkip={() => {
        skipped.add(tip.id);
        setTick((n) => n + 1);
      }}
    />
  );
}
