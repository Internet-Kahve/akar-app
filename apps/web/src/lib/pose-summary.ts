import type { CameraPose } from "@akar/domain";

/** The prototype's distance words (§11.39) against the distance at which the whole model fits. */
const DISTANCES: Array<[number, string]> = [
  [0.42, "yakın"],
  [0.62, "orta"],
  [0.85, "çatı"],
  [0.95, "bütün yapı"],
];
export const distanceWord = (d: number) =>
  DISTANCES.reduce((best, x) => (Math.abs(x[0] - d) < Math.abs(best[0] - d) ? x : best))[1];

/**
 * The zoom a pose stands at, as the editor made it with the wheel or two fingers: «1,0×» = the whole model in view,
 * «2,1×» = twice as close. The words above group many zooms into one; this tells two of them apart.
 */
export const zoomText = (d: number) => `${(1 / Math.max(d, 0.01)).toFixed(1).replace(".", ",")}×`;

/** «Merkez · 354° · eğim 30° · orta · yakınlaştırma 1,6×»: a pose as the panel lists it. */
export function poseSummary(pose: CameraPose | null | undefined) {
  if (!pose) return "";
  return `${pose.target ?? "Merkez"} · ${Math.round(pose.azimuthDeg)}° · eğim ${Math.round(pose.elevationDeg)}° · ${distanceWord(pose.distance)} · yakınlaştırma ${zoomText(pose.distance)}`;
}
