"use client";
import { useEffect, useId, useRef } from "react";
import { Award, Check, ChevronRight, Puzzle, X } from "lucide-react";
import type { CSSProperties } from "react";
import type { HeritageSite, SiteBadge } from "@akar/domain";

/** After the last sentence: the badge just earned, the site's other badges and what comes next. */
export function CompletionCard({
  site,
  style,
  chapters,
  earned,
  owned,
  openTasks,
  nextStop,
  guest,
  onClose,
  onTasks,
  onNextStop,
  onProfile,
  onSignIn,
}: {
  site: HeritageSite;
  style: CSSProperties;
  chapters: number;
  /** Badges this listening earned. */
  earned: SiteBadge[];
  /** Ids of every badge the visitor holds. */
  owned: string[];
  openTasks: number;
  nextStop?: HeritageSite | undefined;
  guest: boolean;
  onClose: () => void;
  onTasks: () => void;
  onNextStop: (id: string) => void;
  onProfile: () => void;
  onSignIn: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  const badges = site.badges ?? [];
  const headline = earned[0];
  const holds = (b: SiteBadge) => owned.includes(b.id);
  return (
    <dialog
      ref={ref}
      className="completion"
      style={style}
      aria-labelledby={titleId}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section>
        <button className="completion-close" aria-label="Kapat" onClick={onClose}>
          <X size={18} />
        </button>
        <div className="completion-stage" aria-hidden="true">
          <i className="completion-rays" />
          <span className="completion-badge">
            <Award size={44} />
          </span>
        </div>
        <div className="completion-body">
          <span className="completion-done">
            <Check size={14} />
            Hikâye tamamlandı · {chapters} / {chapters} bölüm
          </span>
          <h2 id={titleId}>
            {headline ? `Rozet kazandın: ${headline.title}` : `${site.name} hikâyesini bitirdin`}
          </h2>
          {headline && <p>{headline.text}</p>}
          {badges.length > 0 && (
            <>
              <h3>
                {site.name}&rsquo;nin rozetleri {badges.filter(holds).length} / {badges.length}
              </h3>
              <ul className="completion-badges">
                {badges.map((b) => (
                  <li key={b.id} className={earned.includes(b) ? "new" : holds(b) ? "held" : ""}>
                    <Award size={18} />
                    <b>{b.title}</b>
                    {earned.includes(b) ? (
                      <small>Şimdi kazandın</small>
                    ) : (
                      !holds(b) && <small>{b.text}</small>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="completion-actions">
            {openTasks > 0 && (
              <button className="btn" onClick={onTasks}>
                <Puzzle size={18} />
                Bulmacayı çöz · {openTasks} görev
              </button>
            )}
            {nextStop && (
              <button
                className={`btn${openTasks > 0 ? " secondary" : ""}`}
                onClick={() => onNextStop(nextStop.id)}
              >
                Sonraki durak: {nextStop.name}
                <ChevronRight size={17} />
              </button>
            )}
            <button className="btn secondary" onClick={onClose}>
              Devam et
            </button>
          </div>
          <button className="text-btn completion-all" onClick={onProfile}>
            Bütün rozetlerime bak ›
          </button>
          {guest && (
            <p className="completion-guest">
              Rozetlerini kaybetme ·{" "}
              <button className="text-btn" onClick={onSignIn}>
                Giriş yap
              </button>
            </p>
          )}
        </div>
      </section>
    </dialog>
  );
}
