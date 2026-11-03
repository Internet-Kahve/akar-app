"use client";
import { ArrowUp, MousePointer2, Pointer } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { readPreference, writePreference } from "../lib/preferences";

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
  onDone,
}: {
  id: string;
  text: string;
  place: "map" | "above-card" | "above-site-card" | "stage" | "under-spot";
  gesture: CoachGesture;
  spot?: string;
  arrowTo?: string;
  needs?: string;
  swallow?: boolean;
  /** With `swallow`: a press on the lit element is not swallowed (it is what the hint asks for). */
  pressSpot?: boolean;
  onDone?: () => void;
}) {
  const key = `akar.ipucu.${id}`;
  const [shown, setShown] = useState(() => typeof window !== "undefined" && !readPreference(key));
  const done = () => {
    writePreference(key, "1");
    setShown(false);
    onDone?.();
  };
  // A hint about an element that is not on screen (no parts to tap on this site) passes.
  useEffect(() => {
    if (!shown || !needs) return;
    const timer = setTimeout(() => {
      if (!document.querySelector(needs)) done();
    }, 1600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, needs]);
  useEffect(() => {
    if (!shown) return;
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
        // The rest of that touch (its up and click) goes nowhere either.
        const eat = (ev: Event) => {
          ev.stopPropagation();
          ev.preventDefault();
        };
        window.addEventListener("pointerup", eat, { capture: true, once: true });
        window.addEventListener("click", eat, { capture: true, once: true });
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
  }, [shown, key, swallow, pressSpot, spot]);
  const spotRect = useRects(shown && place === "under-spot" ? spot : undefined)[0];
  if (!shown) return null;
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
