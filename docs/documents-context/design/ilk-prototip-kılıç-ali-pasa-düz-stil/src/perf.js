// Device tier. "low" = pixel ratio 1, no MSAA, no backdrop blur on the UI panels.
// Override for testing with ?low=1 or ?low=0.
const q = new URLSearchParams(location.search).get('low');
const mem = navigator.deviceMemory || 8;
const cores = navigator.hardwareConcurrency || 8;

export const LOW_END = q != null ? q === '1' : mem <= 4 || cores <= 4;
export const PIXEL_RATIO = LOW_END ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
export const REDUCE_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (LOW_END) document.documentElement.classList.add('low');
