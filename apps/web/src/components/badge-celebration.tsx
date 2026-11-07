"use client";
import { stillMotion } from "../lib/access";
import { useEffect, useId, useRef, useState } from "react";
import type { HeritageSite } from "@akar/domain";
import type { AchievementId, BadgeEntry } from "../lib/badges";
import { badgeInLang } from "../lib/task-text";
import { AchievementMedal, BadgeMedal } from "./badge-medal";
import { Localized, useI18n } from "./i18n";

export type Celebrated = { kind: "badge"; entry: BadgeEntry } | { kind: "achievement"; id: AchievementId };

/** Confetti pieces: fixed positions (no randomness on render), coloured from the medals' palette. */
const CONFETTI = Array.from({ length: 22 }, (_, i) => ({
  x: ((i * 37) % 100) - 50,
  delay: (i % 7) * 0.09,
  spin: ((i * 53) % 360) - 180,
  colour: ["#e6b53c", "#c4513c", "#2aa3a0", "#3d6fb6", "#46a06f", "#c96a88"][i % 6],
}));

/**
 * The moment a badge or an achievement is earned: full screen, the medal floats in on a ring of light with a little
 * confetti and, where the device has it, a short vibration. Several in a row are shown one after another. With
 * `prefers-reduced-motion` nothing moves (CSS) and the device does not vibrate. Loaded only when something is earned.
 */
export default function BadgeCelebration({
  items,
  onClose,
  onCollection,
  onShare,
}: {
  items: Celebrated[];
  onClose: () => void;
  onCollection: () => void;
  onShare?: ((item: Celebrated) => void) | undefined;
}) {
  const { lang, t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [index, setIndex] = useState(0);
  const item = items[Math.min(index, items.length - 1)]!;
  const last = index >= items.length - 1;
  useEffect(() => {
    // Focus goes back to where it was when the window closes.
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.focus?.();
    };
  }, []);
  useEffect(() => {
    const still = stillMotion();
    if (!still && typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.([24, 60, 36]);
  }, [index]);
  const next = () => (last ? onClose() : setIndex((i) => i + 1));
  let title: string, name: React.ReactNode, site: HeritageSite | null = null, medal: React.ReactNode;
  if (item.kind === "badge") {
    const { badge, english } = badgeInLang(item.entry.badge, lang);
    title = t("celebrate.badge");
    name = <span lang={lang === "en" && !english ? "tr" : undefined}>{badge.title}</span>;
    site = item.entry.site;
    medal = <BadgeMedal badge={item.entry.badge} tier={item.entry.tier} earned size={176} eager />;
  } else {
    title = t("celebrate.achievement");
    name = t(`achievement.${item.id}.title`);
    medal = <AchievementMedal id={item.id} done size={160} />;
  }
  return (
    <dialog ref={ref} className="celebration" aria-labelledby={titleId} onCancel={onClose}>
      <div className="celebration-stage" key={index} onClick={next}>
        <i className="celebration-rays" aria-hidden="true" />
        <i className="celebration-ring" aria-hidden="true" />
        <span className="celebration-confetti" aria-hidden="true">
          {CONFETTI.map((c, i) => (
            <i key={i} style={{ ["--x" as string]: `${c.x}vw`, ["--d" as string]: `${c.delay}s`, ["--r" as string]: `${c.spin}deg`, background: c.colour }} />
          ))}
        </span>
        <span className="celebration-medal">{medal}</span>
      </div>
      <div className="celebration-text">
        <p className="celebration-kicker" id={titleId}>
          {title}
          {items.length > 1 && <span> · {index + 1}/{items.length}</span>}
        </p>
        <h2>{name}</h2>
        {item.kind === "badge" ? (
          <p>
            <span className={`tier-chip tier-${item.entry.tier}`}>{t(`badge.tier.${item.entry.tier}`)}</span>{" "}
            {site && <Localized tr={site.name} en={site.nameEn} />}
          </p>
        ) : (
          <p>{t(`achievement.${item.id}.text`)}</p>
        )}
        <div className="celebration-actions">
          <button className="btn celebration-ok" onClick={next} autoFocus>
            {last ? t("celebrate.ok") : t("celebrate.next")}
          </button>
          {onShare && (
            <button className="btn secondary" onClick={() => onShare(item)}>
              {t("badge.share")}
            </button>
          )}
          <button className="text-btn" onClick={onCollection}>
            {t("celebrate.collection")}
          </button>
        </div>
      </div>
    </dialog>
  );
}
