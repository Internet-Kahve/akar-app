"use client";
import { ArrowRight, MapPin, Share2 } from "lucide-react";
import type { HeritageSite } from "@akar/domain";
import { canTurnGold, type BadgeEntry } from "../lib/badges";
import { badgeInLang, taskInLang } from "../lib/task-text";
import { BadgeMedal } from "./badge-medal";
import { Localized, useI18n } from "./i18n";
import { Modal } from "./ui";

/** How a badge is earned, in a sentence: the story, or the task that earns it (and the gold it can turn). */
export function useHowToEarn() {
  const { lang, t } = useI18n();
  return (entry: BadgeEntry) => {
    if (entry.badge.condition === "story") return t("profile.badgeStory");
    const task = entry.site.tasks?.find((x) => x.id === entry.badge.taskId);
    return t("profile.badgeTask", { title: task ? taskInLang(task, lang).task.title : entry.badge.title });
  };
}

/** The badge opened large: its picture, name, what it is about, the site, when it was earned, and Paylaş. */
export function BadgeCard({
  entry,
  onClose,
  onSite,
  onShare,
}: {
  entry: BadgeEntry;
  onClose: () => void;
  onSite: (site: HeritageSite) => void;
  /** Absent until sharing is offered for this badge (earned only). */
  onShare?: (() => void) | undefined;
}) {
  const { lang, t } = useI18n();
  const howToEarn = useHowToEarn();
  const { badge, english } = badgeInLang(entry.badge, lang);
  const tr = lang === "en" && !english ? "tr" : undefined;
  const held = entry.held;
  const date = held && new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(held.earnedAt));
  return (
    <Modal title={<span lang={tr}>{badge.title}</span>} onClose={onClose} className={`badge-card tier-${entry.tier}`}>
      <div className="badge-card-stage">
        <i className="badge-card-rays" aria-hidden="true" />
        <BadgeMedal badge={entry.badge} tier={entry.tier} earned={!!held} size={168} eager />
      </div>
      <p className="badge-card-tier">
        <span className={`tier-chip tier-${entry.tier}`}>{t(`badge.tier.${entry.tier}`)}</span>
        {held?.onSite && entry.badge.onSiteLabel && (
          <span className="tier-chip on-site">
            <MapPin size={13} aria-hidden="true" />
            {t("site.onSiteTag")}
          </span>
        )}
      </p>
      {held ? (
        <>
          <p className="badge-card-text" lang={tr}>{badge.text}</p>
          <p className="muted badge-card-date">{t("badge.earnedOn", { date: date! })}</p>
          {canTurnGold(entry.badge, held) && <p className="badge-card-hint">{t("badge.goldHint")}</p>}
        </>
      ) : (
        <div className="badge-card-howto">
          <b>{t("badge.howTo")}</b>
          <p>{howToEarn(entry)}</p>
          {canTurnGold(entry.badge, held) && <p className="badge-card-hint">{t("badge.goldHint")}</p>}
        </div>
      )}
      <div className="badge-card-actions">
        <button className="btn secondary" onClick={() => onSite(entry.site)}>
          <Localized tr={entry.site.name} en={entry.site.nameEn} />
          <ArrowRight size={16} aria-hidden="true" />
        </button>
        {held && onShare && (
          <button className="btn" onClick={onShare}>
            <Share2 size={16} aria-hidden="true" />
            {t("badge.share")}
          </button>
        )}
      </div>
    </Modal>
  );
}
