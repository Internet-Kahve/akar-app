"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { AVATAR_KEY, AVATARS, avatarById, resolveAvatar, type AvatarFigure } from "../lib/avatars";
import { readPreference, writePreference } from "../lib/preferences";
import { useI18n } from "./i18n";

const listeners = new Set<() => void>();
let chosen: string | null = null;

/** The profile picture kept on this device; a chance figure the first time, kept from then on. */
export function useAvatar(): [AvatarFigure, (id: string) => void] {
  const id = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => {
      if (chosen === null) {
        const figure = resolveAvatar(readPreference(AVATAR_KEY));
        chosen = figure.id;
        writePreference(AVATAR_KEY, figure.id);
      }
      return chosen;
    },
    () => AVATARS[0]!.id,
  );
  const set = (next: string) => {
    if (!avatarById(next)) return;
    chosen = next;
    writePreference(AVATAR_KEY, next);
    listeners.forEach((l) => l());
  };
  return [avatarById(id) ?? AVATARS[0]!, set];
}

/** A figure's miniature in a round frame; its coloured first letter stands in until the picture loads. */
export function Avatar({ figure, size = 36, className = "" }: { figure: AvatarFigure; size?: number; className?: string }) {
  const { t, text } = useI18n();
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [figure.id]);
  const name = text(figure.name, figure.nameEn);
  return (
    <span
      className={`figure-avatar ${className}`.trim()}
      style={{ width: size, height: size, ["--figure" as string]: figure.colour, fontSize: size * 0.42 }}
      role="img"
      aria-label={t("profile.avatarAlt", { name })}
    >
      {broken ? (
        <b aria-hidden="true">{figure.name.slice(0, 1)}</b>
      ) : (
        <img src={`/avatarlar/${figure.id}.webp`} alt="" draggable={false} onError={() => setBroken(true)} />
      )}
    </span>
  );
}
