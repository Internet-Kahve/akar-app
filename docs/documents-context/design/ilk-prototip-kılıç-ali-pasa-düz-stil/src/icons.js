// Lucide icons (ISC) as inline SVG strings, plus the one decorative miniature motif.
// Only the icons imported here end up in the bundle.
import {
  ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, Copy, Footprints, Headphones,
  History, ImagePlus, Minus, Pause, Play, Plus, Puzzle, Rotate3d, RotateCcw, Share2, SkipBack, SkipForward, Users, X,
} from 'lucide';

const NODES = {
  next: ArrowRight, read: BookOpen, check: Check, back: ChevronLeft, prev: ChevronLeft, fwd: ChevronRight,
  copy: Copy, trace: Footprints, listen: Headphones, past: History, photo: ImagePlus, pause: Pause, play: Play,
  rotate: Rotate3d, reset: RotateCcw, minus: Minus, plus: Plus, puzzle: Puzzle, share: Share2, skipBack: SkipBack, skipFwd: SkipForward, together: Users, close: X,
};

const attrs = a => Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ');

/** `<svg>` markup for a named icon; decorative (aria-hidden) — label the button instead. */
export function icon(name, size = 20, stroke = 2) {
  const children = NODES[name].map(([tag, a]) => `<${tag} ${attrs(a)}/>`).join('');
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${children}</svg>`;
}

/** Thin gold rule with a small çintemani (three discs over two waves) — used sparingly as a divider. */
export const ORNAMENT = `<div class="orn" aria-hidden="true"><svg viewBox="0 0 40 14" width="40" height="14">
  <g fill="currentColor"><circle cx="20" cy="3.2" r="2.1"/><circle cx="15.6" cy="7.6" r="2.1"/><circle cx="24.4" cy="7.6" r="2.1"/></g>
  <path d="M8 11.5c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0 4 1.6 6 0" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
</svg></div>`;
