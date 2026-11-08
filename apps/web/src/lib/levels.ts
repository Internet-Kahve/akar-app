/**
 * Levels (5 Nov 2026): a title and a bar from the total score. The score only ever comes from the server's points
 * ledger (`Snapshot.points`; the demo's mock keeps the same values); the app never adds to it. Thresholds are set so
 * the first story and a few tasks reach «Gezgin», and a site visited in person moves a level on.
 */
export const LEVELS = [
  { id: "yolcu", min: 0 },
  { id: "gezgin", min: 60 },
  { id: "kasif", min: 200 },
  { id: "seyyah", min: 450 },
  { id: "bilge", min: 800 },
] as const;
export type LevelId = (typeof LEVELS)[number]["id"];

export interface LevelState {
  id: LevelId;
  /** 1-based. */
  number: number;
  /** Points within this level and needed for the next; `next` is null at the last level. */
  have: number;
  next: number | null;
  /** 0–1 along the bar (1 at the last level). */
  fraction: number;
}

export function levelOf(points: number): LevelState {
  const score = Number.isFinite(points) ? Math.max(0, Math.floor(points)) : 0;
  let i = 0;
  while (i + 1 < LEVELS.length && score >= LEVELS[i + 1]!.min) i++;
  const level = LEVELS[i]!;
  const upper = LEVELS[i + 1];
  if (!upper) return { id: level.id, number: i + 1, have: score - level.min, next: null, fraction: 1 };
  const span = upper.min - level.min;
  return { id: level.id, number: i + 1, have: score - level.min, next: span, fraction: (score - level.min) / span };
}
