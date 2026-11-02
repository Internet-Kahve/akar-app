"use client";
import { useState } from "react";
import { readPreference, writePreference } from "../lib/preferences";
import { useI18n } from "./i18n";

/**
 * A first-time hint (Muhammed, 3 Nov 2026: «Figma'ya ilk girince, Instagram gibi, uygulama ne yaptığını anlatsın»):
 * one short sentence where it matters, shown once on this device and gone at «Tamam». It never covers what the
 * visitor needs: only its own button takes a tap.
 */
export function CoachTip({ id, text, place }: { id: string; text: string; place: "top" | "above-card" | "above-site-card" }) {
  const { t } = useI18n();
  const key = `akar.ipucu.${id}`;
  const [shown, setShown] = useState(() => typeof window !== "undefined" && !readPreference(key));
  if (!shown) return null;
  return (
    <div className={`coach-tip ${place}`} role="status">
      <p>{text}</p>
      <button
        onClick={() => {
          writePreference(key, "1");
          setShown(false);
        }}
      >
        {t("tip.ok")}
      </button>
    </div>
  );
}
