"use client";
import { Pointer } from "lucide-react";
import { useEffect, useState } from "react";
import { readPreference, writePreference } from "../lib/preferences";

/** What the finger shows: a tap, a swipe up or down, taps on the right and left. */
export type CoachGesture = "tap" | "swipe-up" | "swipe-down" | "tap-sides";

/**
 * A first-time hint (Muhammed, 3 Nov 2026: «Instagram, Subway Surfers gibi; buton değil, kısa bir yazı, parmak resmi,
 * hareket»): a finger doing what to do, and a few words, where it matters. Shown once on this device; the visitor's
 * first touch anywhere puts it away for good. It never blocks a tap (no buttons, it takes no touch itself).
 */
export function CoachTip({
  id,
  text,
  place,
  gesture,
}: {
  id: string;
  text: string;
  place: "map" | "above-card" | "above-site-card" | "stage";
  gesture: CoachGesture;
}) {
  const key = `akar.ipucu.${id}`;
  const [shown, setShown] = useState(() => typeof window !== "undefined" && !readPreference(key));
  useEffect(() => {
    if (!shown) return;
    // A moment's grace, so the touch that opened this screen does not put its hint away.
    let armed = false;
    const arm = setTimeout(() => (armed = true), 700);
    const away = () => {
      // Waiting behind the photo-or-3D question (design.css hides it meanwhile): that answer is not its touch.
      if (!armed || document.querySelector(".view-choice")) return;
      writePreference(key, "1");
      setShown(false);
    };
    window.addEventListener("pointerdown", away, true);
    window.addEventListener("wheel", away, { capture: true, passive: true });
    return () => {
      clearTimeout(arm);
      window.removeEventListener("pointerdown", away, true);
      window.removeEventListener("wheel", away, true);
    };
  }, [shown, key]);
  if (!shown) return null;
  return (
    <div className={`coach-tip ${place} ${gesture}`} role="status">
      <span className="coach-finger" aria-hidden="true">
        <i className="coach-ring" />
        <Pointer size={30} strokeWidth={1.8} />
      </span>
      <p>{text}</p>
    </div>
  );
}
