import { useSyncExternalStore } from "react";
import { readPreference, writePreference } from "./preferences";
import { THEME_KEY as KEY } from "./theme-boot";

/** Day is the frosted theme; night the dark one (`[data-theme="night"]` in tokens.css, 1 Nov 2026). */
export type Theme = "day" | "night";
/** Browser bar colour of each theme (the `--bg` token). */
const BAR: Record<Theme, string> = { day: "#EDEEEA", night: "#161D27" };
/** Map style of each theme: the same layers, sources and layout; only paint differs. */
export const MAP_STYLES: Record<Theme, string> = {
  day: "/harita/akar-style.json",
  night: "/harita/akar-style-gece.json",
};
export const storedTheme = (): Theme =>
  readPreference(KEY) === "night" ? "night" : "day";
/** The theme the page shows now. */
export const currentTheme = (): Theme =>
  typeof document !== "undefined" && document.documentElement.dataset.theme === "night"
    ? "night"
    : "day";
const listeners = new Set<(theme: Theme) => void>();
/** Calls `listener` on every theme change; returns the unsubscribe. */
export function subscribeTheme(listener: (theme: Theme) => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}
export function applyTheme(theme: Theme) {
  if (theme === "night") document.documentElement.dataset.theme = "night";
  else delete document.documentElement.dataset.theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", BAR[theme]);
  writePreference(KEY, theme);
  for (const listener of listeners) listener(theme);
}
/** The current theme, re-rendering on change; the day theme on the server. */
export const useTheme = () =>
  useSyncExternalStore(subscribeTheme, currentTheme, () => "day" as const);
