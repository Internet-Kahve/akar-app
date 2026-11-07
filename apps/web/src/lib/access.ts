import { writePreference } from "./preferences";

/** How large the reading panels are drawn; the map and the 3D stay as they are. */
export type TextSize = "normal" | "large" | "xlarge";
export const TEXT_SIZES: readonly TextSize[] = ["normal", "large", "xlarge"];
const CONTRAST_KEY = "akar.kontrast";
const SIZE_KEY = "akar.yazi";
const MOTION_KEY = "akar.hareket";

/**
 * Runs in <head> before the page paints (layout.tsx), so a visitor's choice holds from the first frame. A visitor who
 * has not chosen follows the device's «more contrast». Kept in step with `setContrast`, `setTextSize`
 * and `setReducedMotion`.
 */
export const ACCESS_BOOT = `try{var d=document.documentElement,c=localStorage.getItem("${CONTRAST_KEY}"),s=localStorage.getItem("${SIZE_KEY}");if(c==="high"||(c===null&&matchMedia("(prefers-contrast: more)").matches))d.dataset.contrast="high";if(s==="large"||s==="xlarge")d.dataset.textSize=s;if(localStorage.getItem("${MOTION_KEY}")==="reduced")d.dataset.motion="reduced"}catch(e){}`;

export const highContrast = () =>
  typeof document !== "undefined" && document.documentElement.dataset.contrast === "high";
export const textSize = (): TextSize => {
  const size = typeof document !== "undefined" ? document.documentElement.dataset.textSize : undefined;
  return size === "large" || size === "xlarge" ? size : "normal";
};
export function setContrast(on: boolean) {
  document.documentElement.dataset.contrast = on ? "high" : "normal";
  writePreference(CONTRAST_KEY, on ? "high" : "normal");
}
export function setTextSize(size: TextSize) {
  document.documentElement.dataset.textSize = size;
  writePreference(SIZE_KEY, size);
}

/** «Hareketi azalt» chosen in the app; the device's own setting is read by `stillMotion`. */
export const reducedMotionChosen = () =>
  typeof document !== "undefined" && document.documentElement.dataset.motion === "reduced";
export function setReducedMotion(on: boolean) {
  document.documentElement.dataset.motion = on ? "reduced" : "full";
  writePreference(MOTION_KEY, on ? "reduced" : "full");
}
/** True when nothing should fly or glide: the visitor asked here, or the device asks for reduced motion. */
export function stillMotion(): boolean {
  if (reducedMotionChosen()) return true;
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}
