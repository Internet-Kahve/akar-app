/**
 * Profile pictures (4 Nov 2026): six figures of Ottoman history, painted as miniatures (`/avatarlar/<id>.webp`,
 * made from `internet-kahve/profil-avatarlari/PROMPTLAR.md`). A visitor gets one by chance at the first visit and
 * can pick another from the profile; the choice stays on the device. Until a figure's picture is in place its
 * coloured circle with the first letter stands in.
 */
export type AvatarFigure = {
  id: string;
  name: string;
  nameEn: string;
  /** The figure's colour: the profile cover and the circle's ring. */
  colour: string;
};

/* Women and men alternate, so the picker's grid (three across) does not leave the women in one row. */
export const AVATARS: AvatarFigure[] = [
  { id: "kosem-sultan", name: "Kösem Sultan", nameEn: "Kösem Sultan", colour: "#3f8a64" },
  { id: "evliya-celebi", name: "Evliya Çelebi", nameEn: "Evliya Çelebi", colour: "#2f7f86" },
  { id: "fatih", name: "Fatih Sultan Mehmed", nameEn: "Mehmed the Conqueror", colour: "#a23b3b" },
  { id: "mimar-sinan", name: "Mimar Sinan", nameEn: "Architect Sinan", colour: "#4a6fa5" },
  { id: "mihrimah-sultan", name: "Hürrem Sultan", nameEn: "Hürrem Sultan", colour: "#b85c7a" },
  { id: "hezarfen", name: "Hezarfen Ahmed Çelebi", nameEn: "Hezarfen Ahmed Çelebi", colour: "#d08a2e" },
];

export const AVATAR_KEY = "akar.avatar";

export const avatarById = (id: string | null | undefined): AvatarFigure | undefined => AVATARS.find((a) => a.id === id);

/** A figure by chance; `random` is injected so the choice can be tested. */
export const randomAvatar = (random: () => number = Math.random): AvatarFigure =>
  AVATARS[Math.min(AVATARS.length - 1, Math.floor(random() * AVATARS.length))]!;

/** The figure kept on the device, or a chance one when none is kept (or the kept id is no longer known). */
export const resolveAvatar = (stored: string | null, random: () => number = Math.random): AvatarFigure =>
  avatarById(stored) ?? randomAvatar(random);
