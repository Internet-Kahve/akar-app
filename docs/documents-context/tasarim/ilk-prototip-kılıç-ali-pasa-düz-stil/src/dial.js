// Circular rotation dial (shared by the map and the 3D detail view).
// Only the UI lives here: markup, pointer / keyboard input, the knob and
// placement. The owner decides what a bearing means and moves its camera.
//
//   - Drag anywhere on the dial: the pointer's angle (clockwise from K = north) is the requested bearing.
//   - Tap the centre button: reset. − / + buttons: zoom.
//   - Keyboard (role="slider"): ←/↓ and →/↑ turn by 15°, − / + zoom.
import { icon } from './icons.js';

const COMPASS = ['Kuzey', 'Kuzeydoğu', 'Doğu', 'Güneydoğu', 'Güney', 'Güneybatı', 'Batı', 'Kuzeybatı'];
const STEP = 15;

const FACE = (() => {
  const at = (deg, r) => [50 + Math.sin(deg * Math.PI / 180) * r, 50 - Math.cos(deg * Math.PI / 180) * r].map(v => v.toFixed(2));
  let ticks = '';
  for (let d = 0; d < 360; d += 30) {
    const major = d % 90 === 0, [x1, y1] = at(d, major ? 32.5 : 35), [x2, y2] = at(d, 37.5);
    ticks += `<line class="dial-tick${major ? ' major' : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }
  const letters = ['K', 'D', 'G', 'B'].map((l, i) => { const [x, y] = at(i * 90, 27.5); return `<text class="dial-letter${i ? '' : ' north'}" x="${x}" y="${y}">${l}</text>`; }).join('');
  return `<svg class="dial-face" viewBox="0 0 100 100" aria-hidden="true"><circle class="dial-ring" cx="50" cy="50" r="41"/>${ticks}${letters}</svg>`;
})();

const norm = d => ((d % 360) + 360) % 360;

/**
 * @param {{
 *   onGrab: () => void,              // any touch / key / button on the dial: stop automatic camera moves
 *   onTurn: (deg: number) => void,   // requested bearing, 0–360 clockwise from north
 *   onZoom: (dir: 1 | -1) => void,
 *   onReset: () => void,
 *   resetLabel?: string,
 * }} o
 */
export function createDial(o) {
  const el = document.createElement('div');
  el.className = 'dial-wrap';
  el.hidden = true;
  el.innerHTML = `
    <div class="dial-box">
      <div class="dial" role="slider" tabindex="0" aria-label="Görünümü döndür" aria-valuemin="0" aria-valuemax="359" aria-valuenow="0">
        ${FACE}
        <div class="dial-rot" aria-hidden="true"><span class="dial-knob"></span></div>
      </div>
      <button type="button" class="dial-reset" aria-label="${o.resetLabel || 'Varsayılan görünüme dön'}">${icon('reset', 18, 2.2)}</button>
    </div>
    <div class="dial-zoom">
      <button type="button" class="icon-btn" data-zoom="-1" aria-label="Uzaklaştır">${icon('minus', 20)}</button>
      <button type="button" class="icon-btn" data-zoom="1" aria-label="Yakınlaştır">${icon('plus', 20)}</button>
    </div>`;
  const box = el.querySelector('.dial-box'), dial = el.querySelector('.dial'), knob = el.querySelector('.dial-rot');

  let shown = -1, pending = null;   // knob bearing on screen; last requested bearing not yet reached
  const turn = deg => { pending = norm(deg); o.onTurn(pending); };

  // Pointer: drag anywhere on the dial; a tap on the centre without moving resets.
  let drag = null, lastPointerReset = 0;
  const polar = e => {
    const r = box.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    return { deg: norm(Math.atan2(dx, -dy) * 180 / Math.PI), d: Math.hypot(dx, dy), R: r.width / 2 };
  };
  box.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    e.preventDefault();
    const p = polar(e);
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false, center: p.d < p.R * 0.42 };
    box.setPointerCapture(e.pointerId);
    box.classList.add('active');
    o.onGrab();
    if (!drag.center) turn(p.deg);
  });
  box.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 6) drag.moved = true;
    const p = polar(e);
    if ((drag.moved || !drag.center) && p.d > p.R * 0.15) turn(p.deg);   // ignore the unstable very centre
  });
  const endDrag = (e, cancelled) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!cancelled && drag.center && !drag.moved) { lastPointerReset = performance.now(); o.onGrab(); o.onReset(); }
    drag = null;
    box.classList.remove('active');
  };
  box.addEventListener('pointerup', e => endDrag(e, false));
  box.addEventListener('pointercancel', e => endDrag(e, true));
  box.addEventListener('dblclick', e => e.preventDefault());
  // Keyboard / assistive tech activates the centre button with a click (pointer taps are handled above).
  el.querySelector('.dial-reset').addEventListener('click', () => {
    if (performance.now() - lastPointerReset > 500) { o.onGrab(); o.onReset(); }
  });
  dial.addEventListener('keydown', e => {
    const step = { ArrowRight: STEP, ArrowUp: STEP, ArrowLeft: -STEP, ArrowDown: -STEP }[e.key];
    if (step) { e.preventDefault(); o.onGrab(); turn((pending ?? shown) + step); }
    else if (e.key === '+' || e.key === '=' || e.key === '-') { e.preventDefault(); o.onGrab(); o.onZoom(e.key === '-' ? -1 : 1); }
  });
  el.querySelectorAll('[data-zoom]').forEach(b => { b.onclick = () => { o.onGrab(); o.onZoom(+b.dataset.zoom); }; });

  return {
    el,
    /** Show the current bearing on the knob (call whenever the view turns, for any reason). */
    setKnob(deg) {
      deg = norm(deg);
      if (pending != null && Math.abs(((deg - pending + 540) % 360) - 180) < 0.5) pending = null;
      if (Math.abs(deg - shown) < 0.2) return;
      shown = deg;
      knob.style.transform = `rotate(${deg.toFixed(1)}deg)`;
      const n = Math.round(deg) % 360;
      if (dial.getAttribute('aria-valuenow') !== String(n)) {
        dial.setAttribute('aria-valuenow', n);
        dial.setAttribute('aria-valuetext', `${COMPASS[Math.round(deg / 45) % 8]}, ${n}°`);
      }
    },
    /** Forget a requested bearing (e.g. a scripted camera move took over). */
    cancel() { pending = null; },
    /**
     * Centre the dial vertically on the right edge, in the free band from `top` down to the first
     * obstacle (a {left, right, top} rect in viewport px) that shares its column. Drops the zoom row,
     * then hides itself, rather than overlap anything.
     */
    place({ top, height, obstacles = [] }) {
      el.hidden = false;
      el.classList.remove('no-zoom');
      const left = el.offsetLeft, right = left + el.offsetWidth;
      let bottom = height - 12;
      for (const r of obstacles) if (r && r.right > left - 8 && r.left < right + 8) bottom = Math.min(bottom, r.top - 12);
      let need = el.offsetHeight;
      if (bottom - top < need) { el.classList.add('no-zoom'); need = el.offsetHeight; }
      if (bottom - top < need) { el.hidden = true; return; }
      el.style.top = `${Math.round(top + (bottom - top - need) / 2)}px`;
    },
    get dragging() { return !!drag; },
  };
}
