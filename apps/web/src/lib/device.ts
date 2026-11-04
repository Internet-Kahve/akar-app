/**
 * How much the phone can draw (2 Nov 2026, «uygulama telefonda çok kasıyor»). A device with 4 GB of memory or less,
 * or four cores or fewer, is «modest» (the Redmi 9T the team tests on is one): the map and the 3D draw fewer pixels
 * and no real-time shadows there. Browsers that do not tell (Safari has no `deviceMemory`) count by their cores.
 */
export function modestDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  // An iPhone/iPad has the strongest phone GPUs but tells Safari's core count only (a capped 2–4): it is not «modest»
  // (4 Nov 2026: an iPhone 13 drew the model in coarse steps, no antialiasing, at a third of its screen's pixels).
  if (isAppleTouch(navigator.userAgent, navigator.maxTouchPoints)) return false;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return (memory !== undefined && memory <= 4) || (navigator.hardwareConcurrency ?? 8) <= 4;
}

/** iPhone, iPod or iPad (iPadOS 13+ calls itself a Mac, but a Mac has no touch points). */
export function isAppleTouch(userAgent: string, touchPoints = 0): boolean {
  return /iPhone|iPod|iPad/.test(userAgent) || (/Macintosh/.test(userAgent) && touchPoints > 1);
}

/** Pixels the map draws per CSS pixel: at most 2 (phones report up to 3.5), 1.5 on a modest device. */
export function mapPixelRatio(): number {
  const ratio = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  return Math.min(ratio, modestDevice() ? 1.5 : 2);
}

/** The site's 3D viewer: 1.5 as before, 1.25 on a modest device, 2 on an iPhone (its screen is 3× and Safari scales up). */
export function modelPixelRatio(): number {
  const ratio = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const apple = typeof navigator !== "undefined" && isAppleTouch(navigator.userAgent, navigator.maxTouchPoints);
  return Math.min(ratio, modestDevice() ? 1.25 : apple ? 2 : 1.5);
}
