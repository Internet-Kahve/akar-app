/**
 * How much the phone can draw (2 Nov 2026, «uygulama telefonda çok kasıyor»). A device with 4 GB of memory or less,
 * or four cores or fewer, is «modest» (the Redmi 9T the team tests on is one): the map and the 3D draw fewer pixels
 * and no real-time shadows there. Browsers that do not tell (Safari has no `deviceMemory`) count by their cores.
 */
export function modestDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return (memory !== undefined && memory <= 4) || (navigator.hardwareConcurrency ?? 8) <= 4;
}

/** Pixels the map draws per CSS pixel: at most 2 (phones report up to 3.5), 1.5 on a modest device. */
export function mapPixelRatio(): number {
  const ratio = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  return Math.min(ratio, modestDevice() ? 1.5 : 2);
}

/** The site's 3D viewer: 1.5 as before, 1.25 on a modest device. */
export function modelPixelRatio(): number {
  const ratio = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  return Math.min(ratio, modestDevice() ? 1.25 : 1.5);
}
