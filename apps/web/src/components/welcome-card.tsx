"use client";
import { useEffect, useId, useRef } from "react";
import { Headphones, History, House, Landmark, MapPin } from "lucide-react";
import type { CSSProperties } from "react";
import type { HeritageSite } from "@akar/domain";
import { Motif } from "./ui";

const POINTS = [
  { Icon: Headphones, title: "Dinle ya da oku", text: "Her eserin kısa, kaynaklı hikâyesi" },
  { Icon: History, title: "Geçmişini gör", text: "Eski fotoğrafı bugünle karşılaştır" },
  { Icon: Landmark, title: "Vakfı anla", text: "Bu yapıyı yüzyıllardır ne ayakta tuttu?" },
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
        <p className="welcome-kicker">Vakıf eserlerini keşfet</p>
        <h2 id={titleId}>Şehrin hikâyesine karış.</h2>
        <p className="welcome-lead">Geçmişi gör. Hikâyesini dinle. İzini bırak.</p>
        <Motif />
        <ul>
          {POINTS.map(({ Icon, title, text }) => (
            <li key={title}>
              <span>
                <Icon size={18} />
              </span>
              <div>
                <b>{title}</b>
                <small>{text}</small>
              </div>
            </li>
          ))}
        </ul>
        <div className="welcome-actions">
          <button className="btn" onClick={onHome}>
            <House size={18} />
            Evden gez
          </button>
          <button className="btn secondary" onClick={onNear}>
            <MapPin size={18} />
            Konumumu kullan
          </button>
        </div>
        <div className="welcome-foot">
          <small>Konumun sadece cihazında kullanılır.</small>
          <button className="text-btn" onClick={onWaqf}>
            Vakıf nedir? ›
          </button>
        </div>
      </section>
    </dialog>
  );
}
