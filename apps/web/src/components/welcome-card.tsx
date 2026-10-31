"use client";
import { useEffect, useId, useRef } from "react";
import { Headphones, History, House, Landmark, MapPin } from "lucide-react";
import type { CSSProperties } from "react";
import type { HeritageSite } from "@akar/domain";
import { Motif } from "./ui";
import { useI18n } from "./i18n";
import type { MessageKey } from "../lib/messages";

const POINTS: { Icon: typeof Headphones; title: MessageKey; text: MessageKey }[] = [
  { Icon: Headphones, title: "welcome.listenTitle", text: "welcome.listenText" },
  { Icon: History, title: "welcome.pastTitle", text: "welcome.pastText" },
  { Icon: Landmark, title: "welcome.waqfTitle", text: "welcome.waqfText" },
];

/** First visit only: what the app does, and whether to start from home or from the visitor's position. */
export function WelcomeCard({
  site,
  style,
  onHome,
  onNear,
  onWaqf,
  onDismiss,
}: {
  site?: HeritageSite;
  style: CSSProperties;
  onHome: () => void;
  onNear: () => void;
  onWaqf: () => void;
  onDismiss: () => void;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null),
    titleId = useId();
  const photo = site?.photos?.find((p) => p.id === site.coverPhotoId) ?? site?.photos?.[0];
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="welcome"
      style={style}
      aria-labelledby={titleId}
      onCancel={onDismiss}
    >
      <section>
        <div className="welcome-band" aria-hidden="true" />
        {photo && (
          <div className="welcome-photo">
            <img src={photo.src} alt={photo.alt} />
          </div>
        )}
        <img className="welcome-logo" src="/logo/logo-web.png" alt="AKAR" width={800} height={237} />
        <p className="welcome-kicker">{t("welcome.kicker")}</p>
        <h2 id={titleId}>{t("welcome.title")}</h2>
        <p className="welcome-lead">{t("welcome.lead")}</p>
        <Motif />
        <ul>
          {POINTS.map(({ Icon, title, text }) => (
            <li key={title}>
              <span>
                <Icon size={18} />
              </span>
              <div>
                <b>{t(title)}</b>
                <small>{t(text)}</small>
              </div>
            </li>
          ))}
        </ul>
        <div className="welcome-actions">
          <button className="btn" onClick={onHome}>
            <House size={18} />
            {t("place.home")}
          </button>
          <button className="btn secondary" onClick={onNear}>
            <MapPin size={18} />
            {t("place.near")}
          </button>
        </div>
        <div className="welcome-foot">
          <small>{t("welcome.privacy")}</small>
          <button className="text-btn" onClick={onWaqf}>
            {t("welcome.waqfLink")}
          </button>
        </div>
      </section>
    </dialog>
  );
}
