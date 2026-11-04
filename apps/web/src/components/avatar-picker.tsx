"use client";
import { Check } from "lucide-react";
import { AVATARS } from "../lib/avatars";
import { Avatar } from "./avatar";
import { Localized, useI18n } from "./i18n";
import { Modal } from "./ui";

/** The six figures to pick a profile picture from. */
export function AvatarPicker({ current, onPick, onClose }: { current: string; onPick: (id: string) => void; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <Modal title={t("profile.avatarTitle")} onClose={onClose} className="avatar-picker">
      <p className="muted">{t("profile.avatarHint")}</p>
      <div className="avatar-grid" role="radiogroup" aria-label={t("profile.avatarTitle")}>
        {AVATARS.map((figure) => (
          <button
            key={figure.id}
            role="radio"
            aria-checked={figure.id === current}
            className={figure.id === current ? "chosen" : ""}
            onClick={() => onPick(figure.id)}
          >
            <Avatar figure={figure} size={84} />
            <span>
              <Localized tr={figure.name} en={figure.nameEn} />
            </span>
            {figure.id === current && <i className="chosen-mark" aria-hidden="true"><Check size={14} /></i>}
          </button>
        ))}
      </div>
      <small className="muted">{t("profile.avatarFigure")}</small>
    </Modal>
  );
}
