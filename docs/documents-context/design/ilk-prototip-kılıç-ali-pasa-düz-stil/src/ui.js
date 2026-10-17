// DOM chrome around the map: progress bar, stop card, markers, toasts, sheet handles.
import { STOPS } from './stops.js';
import { icon } from './icons.js';

const $ = id => document.getElementById(id);

export function initChrome() {
  $('prevStop').innerHTML = icon('prev', 22);
  $('nextStop').innerHTML = icon('fwd', 22);
  $('cardCta').innerHTML = `${icon('rotate', 14)}<span>3B aç</span>`;
  $('progBar').setAttribute('aria-valuemax', STOPS.length);
  // Progress track: one dot per stop on a thin rounded line.
  $('progBar').innerHTML = `<span class="prog-fill"></span>${STOPS.map((_, i) =>
    `<i style="left:${(i / (STOPS.length - 1)) * 100}%"></i>`).join('')}`;
}

export function setProgress(i) {
  $('progCount').textContent = `${i + 1} / ${STOPS.length}`;
  const bar = $('progBar');
  bar.querySelector('.prog-fill').style.width = `${(i / (STOPS.length - 1)) * 100}%`;
  [...bar.querySelectorAll('i')].forEach((el, j) => { el.classList.toggle('done', j < i); el.classList.toggle('on', j === i); });
  bar.setAttribute('aria-valuenow', i + 1);
}

export function setCard(i, { onOpen, onPrev, onNext }) {
  const s = STOPS[i], body = $('cardBody');
  $('cardNum').textContent = i + 1;
  $('cardTitle').textContent = s.name;
  $('cardSub').textContent = s.sub;
  $('cardCta').hidden = !s.has3d;
  $('cardTag').hidden = !s.model;
  body.classList.toggle('tappable', s.has3d);
  body.disabled = !s.has3d;
  body.onclick = s.has3d ? onOpen : null;
  $('prevStop').disabled = i === 0;
  $('nextStop').disabled = i === STOPS.length - 1;
  $('prevStop').onclick = onPrev;
  $('nextStop').onclick = onNext;
}

export function markerElement(i, onTap) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'stop-marker';
  el.innerHTML = `<span>${i + 1}</span>`;
  el.setAttribute('aria-label', `Durak ${i + 1}: ${STOPS[i].name}`);
  el.addEventListener('click', e => { e.stopPropagation(); onTap(i); });
  return el;
}

export function setMarkerStates(els, active) {
  els.forEach((el, j) => { el.classList.toggle('active', j === active); el.classList.toggle('done', j < active); });
}

let toastTimer;
export function toast(msg) {
  const t = $('toast');
  t.hidden = true; void t.offsetWidth; // restart the animation
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 1600);
}

/**
 * Drag handle on top of a bottom sheet: swipe down collapses (hides `.sheet-body`),
 * swipe up expands, a tap toggles. `onChange` runs after every change.
 */
export function sheetHandle(sheet, onChange) {
  const h = document.createElement('button');
  h.type = 'button';
  h.className = 'handle';
  h.setAttribute('aria-label', 'Paneli daralt / genişlet');
  h.setAttribute('aria-expanded', 'true');
  sheet.prepend(h);
  const set = collapsed => {
    if (sheet.classList.contains('collapsed') === collapsed) return;
    sheet.classList.toggle('collapsed', collapsed);
    h.setAttribute('aria-expanded', String(!collapsed));
    onChange?.();
  };
  let y0 = null;
  h.addEventListener('pointerdown', e => { y0 = e.clientY; h.setPointerCapture(e.pointerId); });
  h.addEventListener('pointerup', e => {
    if (y0 == null) return;
    const dy = e.clientY - y0; y0 = null;
    if (dy > 24) set(true); else if (dy < -24) set(false); else set(!sheet.classList.contains('collapsed'));
  });
  h.addEventListener('pointercancel', () => { y0 = null; });
  h.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set(!sheet.classList.contains('collapsed')); } });
  h.addEventListener('click', e => e.preventDefault());   // pointerup already handled it
  return { set };
}
