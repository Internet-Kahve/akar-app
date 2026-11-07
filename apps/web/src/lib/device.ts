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

/** A phone or a tablet: the pointer is a finger. */
export function touchScreen(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

/**
 * The site's 3D viewer, the app's showcase: 2 on a computer and an iPhone, 1.5 on other phones, 1.25 on a modest one.
 * An Android phone at 2 drew four times the pixels of a 1 for little the eye could see on its small dense screen and
 * stuttered (Muhammed, 6 Nov 2026: «telefon eskisinden daha çok kasıyor»), so it is back where it was before 5 Nov.
 */
export function modelPixelRatio(): number {
  const ratio = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const apple = typeof navigator !== "undefined" && isAppleTouch(navigator.userAgent, navigator.maxTouchPoints);
  return Math.min(ratio, modelRatioCap({ modest: modestDevice(), apple, touch: touchScreen() }));
}
export function modelRatioCap(d: { modest: boolean; apple: boolean; touch: boolean }): number {
  if (d.modest) return 1.25;
  if (d.apple || !d.touch) return 2;
  return 1.5;
}

/**
 * Antialiasing on the map: on a computer only. The map draws all the time it moves, and four samples a pixel on a
 * phone's 2× canvas was the heaviest thing added on 5 Nov; a phone's dense screen hides most of the steps anyway.
 */
export function mapAntialias(d: { modest: boolean; touch: boolean }): boolean {
  return !d.modest && !d.touch;
}

/**
 * Pixels the 3D viewer draws while the model moves: the eye cannot read the difference in motion, the GPU can (5 Nov 2026,
 * «kasıyor»). At rest it goes straight back to `modelPixelRatio`, so what is looked at stays as sharp as before.
 */
export function modelMotionRatio(still: number, modest: boolean): number {
  return Math.min(still, modest ? 1 : 1.5);
}
