"use client";
import { useMemo, useState, type FormEvent } from "react";
import { ArrowRight, BookOpen, Check, ChevronRight, MapPin, Pencil, Share2, X } from "lucide-react";
import { DISPLAY_NAME_MAX, displayNameProblem, normalizeDisplayName, type HeritageSite, type Snapshot } from "@akar/domain";
import { featuredBadges, type BadgeEntry, type BadgeTier } from "../lib/badges";
import { levelOf } from "../lib/levels";
import { badgeInLang } from "../lib/task-text";
import { BadgeMedal } from "./badge-medal";
import { useHowToEarn } from "./badge-card";
import { Localized, useI18n } from "./i18n";
import { Modal } from "./ui";

/* ------------------------------------------------------------------------------------------------ name */

/**
 * The display name with a pencil: 2–24 characters once trimmed, checked here with the server's rule; the server
 * (or, for a guest, the device) saves it. Its error, if any, is shown under the field.
 */
export function NameEditor({ name, onRename }: { name: string; onRename: (name: string) => Promise<void> }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const problem = displayNameProblem(draft);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (problem) return setError(t(`name.problem.${problem}`, { max: DISPLAY_NAME_MAX }));
    const next = normalizeDisplayName(draft);
    if (next === name) return setEditing(false);
    setBusy(true);
    setError("");
    try {
      await onRename(next);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("name.failed"));
    } finally {
      setBusy(false);
    }
  };
  if (!editing)
    return (
      <div className="profile-name">
        <h2>{name}</h2>
        <button
          className="round-btn plain profile-name-edit"
          aria-label={t("name.edit")}
          onClick={() => {
            setDraft(name);
            setError("");
            setEditing(true);
          }}
        >
          <Pencil size={16} />
        </button>
      </div>
    );
  return (
    <form className="profile-name editing" onSubmit={submit} noValidate>
      <label className="sr-only" htmlFor="profile-name-input">
        {t("name.label")}
      </label>
      <input
        id="profile-name-input"
        value={draft}
        maxLength={DISPLAY_NAME_MAX + 8}
        autoComplete="nickname"
        autoFocus
        aria-invalid={!!error}
        aria-describedby="profile-name-help"
        onChange={(e) => {
          setDraft(e.target.value);
          setError("");
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            setEditing(false);
          }
        }}
      />
      <button className="round-btn" type="submit" aria-label={t("name.save")} disabled={busy}>
        <Check size={18} />
      </button>
      <button className="round-btn plain" type="button" aria-label={t("name.cancel")} onClick={() => setEditing(false)}>
        <X size={18} />
      </button>
      <p id="profile-name-help" className={error ? "error" : "muted"} role={error ? "alert" : undefined}>
        {error || t("name.help", { max: DISPLAY_NAME_MAX })}
      </p>
    </form>
  );
}

/* ----------------------------------------------------------------------------------------------- level */

/** Level title and the bar to the next one, from the server's score. */
export function LevelBar({ points }: { points: number }) {
  const { t } = useI18n();
  const level = levelOf(points);
  return (
    <div className="level-bar">
      <div className="level-head">
        <span className="level-badge" aria-hidden="true">
          {level.number}
        </span>
        <b>{t(`level.${level.id}`)}</b>
        <span className="muted">{t("level.points", { points })}</span>
      </div>
      <div
        className="level-track"
        role="progressbar"
        aria-label={t("level.progress")}
        aria-valuemin={0}
        aria-valuemax={level.next ?? level.have}
        aria-valuenow={level.have}
        aria-valuetext={level.next === null ? t("level.max") : t("level.toNext", { left: level.next - level.have })}
      >
        <i style={{ width: `${Math.round(level.fraction * 100)}%` }} />
      </div>
      <small className="muted">{level.next === null ? t("level.max") : t("level.toNext", { left: level.next - level.have })}</small>
    </div>
  );
}

/* ----------------------------------------------------------------------------------------------- badges */

function MedalTile({ entry, onOpen }: { entry: BadgeEntry; onOpen: (entry: BadgeEntry) => void }) {
  const { lang, t } = useI18n();
  const howToEarn = useHowToEarn();
  const { badge, english } = badgeInLang(entry.badge, lang);
  return (
    <button className={`medal-tile ${entry.held ? "earned" : "locked"}`} onClick={() => onOpen(entry)} aria-label={t("badge.open", { title: badge.title })}>
      <BadgeMedal badge={entry.badge} tier={entry.tier} earned={!!entry.held} size={76} />
      <b lang={english || lang === "tr" ? undefined : "tr"}>{badge.title}</b>
      <small>{entry.held ? <Localized tr={entry.site.name} en={entry.site.nameEn} /> : howToEarn(entry)}</small>
    </button>
  );
}

/** A few badges in a row (the latest earned first), and «Tümünü gör» for the whole collection. */
export function BadgeStrip({ entries, onOpen, onAll }: { entries: BadgeEntry[]; onOpen: (entry: BadgeEntry) => void; onAll: () => void }) {
  const { t } = useI18n();
  const shown = featuredBadges(entries, 6);
  return (
    <div className="strip-wrap">
      <div className="strip medal-strip">
        {shown.map((entry) => (
          <MedalTile key={entry.badge.id} entry={entry} onOpen={onOpen} />
        ))}
      </div>
      {entries.length > 0 && (
        <button className="see-all" onClick={onAll}>
          {t("profile.seeAll")} <ChevronRight size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

type TierFilter = "all" | BadgeTier | "locked";

/** Every badge, with progress and filters by tier and by site. */
export function BadgeCollection({ entries, onOpen, onClose }: { entries: BadgeEntry[]; onOpen: (entry: BadgeEntry) => void; onClose: () => void }) {
  const { t, text } = useI18n();
  const [tier, setTier] = useState<TierFilter>("all");
  const [siteId, setSiteId] = useState("");
  const sites = useMemo(() => [...new Map(entries.map((e) => [e.site.id, e.site])).values()], [entries]);
  const earned = entries.filter((e) => e.held).length;
  const shown = entries.filter(
    (e) => (!siteId || e.site.id === siteId) && (tier === "all" || (tier === "locked" ? !e.held : e.held && e.tier === tier)),
  );
  const tiers: TierFilter[] = ["all", "bronze", "silver", "gold", "locked"];
  return (
    <Modal title={t("collection.title")} onClose={onClose} wide className="badge-collection">
      <div className="collection-progress">
        <b>{t("collection.progress", { earned, total: entries.length })}</b>
        <span className="achievement-bar" role="progressbar" aria-valuemin={0} aria-valuemax={entries.length} aria-valuenow={earned} aria-label={t("collection.title")}>
          <i style={{ width: `${entries.length ? (earned / entries.length) * 100 : 0}%` }} />
        </span>
      </div>
      <div className="collection-filters">
        <div className="chip-row" role="group" aria-label={t("collection.byTier")}>
          {tiers.map((value) => (
            <button key={value} className="filter-chip" aria-pressed={tier === value} onClick={() => setTier(value)}>
              {value === "all" ? t("collection.all") : value === "locked" ? t("collection.locked") : t(`badge.tier.${value}`)}
            </button>
          ))}
        </div>
        <label className="collection-site">
          <span className="sr-only">{t("collection.bySite")}</span>
          <select value={siteId} onChange={(e) => setSiteId(e.target.value)}>
            <option value="">{t("collection.allSites")}</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {text(s.name, s.nameEn)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {shown.length ? (
        <div className="medal-grid">
          {shown.map((entry) => (
            <MedalTile key={entry.badge.id} entry={entry} onOpen={onOpen} />
          ))}
        </div>
      ) : (
        <p className="muted collection-empty">{t("collection.empty")}</p>
      )}
    </Modal>
  );
}

/* --------------------------------------------------------------------------------------------- discovered */

function coverOf(site: HeritageSite): string | undefined {
  const photos = site.photos ?? [];
  return (photos.find((p) => p.id === site.coverPhotoId) ?? photos[0])?.src;
}

function DiscoveredCard({ site, visited, live, onSite }: { site: HeritageSite; visited: boolean; live: boolean; onSite: (id: string) => void }) {
  const { t } = useI18n();
  const cover = coverOf(site);
  return (
    <button className="discovered-card" onClick={() => onSite(site.id)}>
      <span className="discovered-cover" aria-hidden="true">
        {cover ? <img src={cover} alt="" loading="lazy" decoding="async" /> : <BookOpen size={28} />}
      </span>
      <strong>
        <Localized tr={site.name} en={site.nameEn} />
      </strong>
      <small>
        {t("profile.storyDone")}
        {visited && (
          <span className="discovered-visit">
            <MapPin size={12} aria-hidden="true" /> {live ? t("profile.visitVerified") : t("profile.visitDemo")}
          </span>
        )}
      </small>
    </button>
  );
}

/** «Keşfettiklerim»: the sites whose story was finished, as cards in a row; «Tümünü gör» opens the whole list. */
export function DiscoveredStrip({ state, live, onSite, onStart }: { state: Snapshot; live: boolean; onSite: (id: string) => void; onStart?: (() => void) | undefined }) {
  const { t } = useI18n();
  const [all, setAll] = useState(false);
  const read = state.readIds.flatMap((id) => {
    const site = state.sites.find((s) => s.id === id);
    return site ? [site] : [];
  });
  if (!read.length)
    return (
      <div className="empty-inline">
        <BookOpen size={26} />
        <p>{onStart ? t("profile.firstStory") : t("profile.noSites")}</p>
        {onStart && (
          <button className="text-btn" onClick={onStart}>
            {t("profile.start")} <ArrowRight size={15} />
          </button>
        )}
      </div>
    );
  const latest = [...read].reverse();
  return (
    <div className="strip-wrap">
      <div className="strip discovered-strip">
        {latest.slice(0, 5).map((site) => (
          <DiscoveredCard key={site.id} site={site} visited={state.visitedIds.includes(site.id)} live={live} onSite={onSite} />
        ))}
      </div>
      {read.length > 5 && (
        <button className="see-all" onClick={() => setAll(true)}>
          {t("profile.seeAll")} <ChevronRight size={16} aria-hidden="true" />
        </button>
      )}
      {all && (
        <Modal title={t("profile.discovered")} onClose={() => setAll(false)} wide className="discovered-all">
          <p className="muted">{t("profile.discoveredCount", { count: read.length })}</p>
          <div className="discovered-grid">
            {latest.map((site) => (
              <DiscoveredCard
                key={site.id}
                site={site}
                visited={state.visitedIds.includes(site.id)}
                live={live}
                onSite={(id) => {
                  setAll(false);
                  onSite(id);
                }}
              />
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

/** The share shortcut for the week, shown when the week has badges. */
export function ShareWeekButton({ onShare }: { onShare: () => void }) {
  const { t } = useI18n();
  return (
    <button className="share-week" onClick={onShare}>
      <Share2 size={16} aria-hidden="true" />
      {t("profile.shareWeek")}
    </button>
  );
}
