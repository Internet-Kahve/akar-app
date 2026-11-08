/**
 * One place that speaks to screen readers. Every dynamic change worth hearing (a saved route, an error, a site that
 * opened) goes through `announce`; `LiveRegion` (components/live-region.tsx) renders the two regions once, so the
 * same message is never read twice by two overlapping `role="status"` boxes.
 *
 * - "polite": waits until the reader finishes (results, confirmations, view changes).
 * - "assertive": interrupts (errors the visitor must act on).
 */
export type Politeness = "polite" | "assertive";

export interface Announcement {
  message: string;
  politeness: Politeness;
  /** Bumps on every accepted announcement, so the region can re-render the same text deliberately. */
  id: number;
}

/** The same text within this window is one announcement (a toast and its effect firing together). */
export const REPEAT_WINDOW_MS = 1500;

type Listener = (announcement: Announcement) => void;
const listeners = new Set<Listener>();
let last: { message: string; at: number } | null = null;
let counter = 0;

/** True when `message` should be spoken: not empty and not the same text as the one just spoken. */
export function shouldAnnounce(
  previous: { message: string; at: number } | null,
  message: string,
  now: number,
): boolean {
  const text = message.trim();
  if (!text) return false;
  return !previous || previous.message !== text || now - previous.at >= REPEAT_WINDOW_MS;
}

export function announce(message: string, politeness: Politeness = "polite", now = Date.now()) {
  const text = message.trim();
  if (!shouldAnnounce(last, text, now)) return;
  last = { message: text, at: now };
  const announcement = { message: text, politeness, id: ++counter };
  listeners.forEach((listener) => listener(announcement));
}

export function subscribeAnnouncements(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Test helper: forget the last message. */
export function resetAnnouncements() {
  last = null;
}
