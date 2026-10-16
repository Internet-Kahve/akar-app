// Narrated 3D story for the detail view.
//   "Dinle": speechSynthesis (tr-TR), one segment per utterance; falls back to
//            timed auto-advance when the device has no Turkish voice.
//   "Oku":   silent, scrollable transcript; the segment crossing the middle of
//            the panel (IntersectionObserver) drives the scene.
// Both modes call activate(i): camera tween (via the detail view's flyTo, which
// always moves camera.position AND controls.target) + one CSS2D card + one effect.
// Only the current segment's card/effect exists; everything is disposed on change.
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { HALL, DOME, SEMI_R, semiDome, T, C } from './mosque.js';
import { REDUCE_MOTION } from './perf.js';
import { icon } from './icons.js';
import { sheetHandle } from './ui.js';

const TRUST_CLASS = { 'Doğrulanmış': 't-ok', 'Tarihsel çıkarım': 't-inf', 'Temsili canlandırma': 't-rep' };
const esc = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
export const trustTag = t => `<span class="chip ${TRUST_CLASS[t] || 't-rep'}">${esc(t)}</span>`;

const AUTO_MS = 5000;

/**
 * @param {{
 *   root: HTMLElement, scene: THREE.Scene, animate: (fn:(now:number)=>boolean)=>void, kick: ()=>void,
 *   flyTo: (position:number[], target:number[], opts?:{orbit?:boolean})=>void, releaseCamera: ()=>void,
 *   segments: any[], glazeTargets: Record<string, [THREE.BufferGeometry, THREE.Matrix4?][]>,
 *   onEnd: ()=>void, onLayout: ()=>void,
 * }} o
 */
export function createStory(o) {
  const { root, scene, animate, segments } = o;

  // ---------- transcript panel ----------
  const panel = document.createElement('div');
  panel.className = 's-panel sheet';
  panel.hidden = true;
  panel.innerHTML = `
    <div class="s-top">
      <div class="seg" role="tablist" aria-label="Anlatım biçimi">
        <button type="button" role="tab" data-mode="listen">${icon('listen', 16)}Dinle</button>
        <button type="button" role="tab" data-mode="read">${icon('read', 16)}Oku</button>
      </div>
      <span class="s-status" aria-live="polite"></span>
      <button type="button" class="icon-btn s-close" aria-label="Hikâyeyi bitir">${icon('close', 18)}</button>
    </div>
    <ol class="s-list sheet-body">${segments.map((s, i) => `
      <li data-i="${i}"><span class="s-num">${i + 1}</span><div><p>${esc(s.text)}</p>${trustTag(s.trust)}</div></li>`).join('')}
      <li class="s-end"><button type="button" class="btn btn-primary s-done">Hikâye bitti · Devam ${icon('next', 18)}</button></li>
    </ol>
    <div class="s-ctrl">
      <button type="button" class="icon-btn s-prev" aria-label="Önceki bölüm">${icon('skipBack', 20)}</button>
      <button type="button" class="icon-btn s-play" aria-label="Duraklat">${icon('pause', 22)}</button>
      <button type="button" class="icon-btn s-next" aria-label="Sonraki bölüm">${icon('skipFwd', 20)}</button>
    </div>`;
  root.appendChild(panel);
  sheetHandle(panel, () => o.onLayout());
  const list = panel.querySelector('.s-list'), items = [...list.querySelectorAll('li[data-i]')];
  const status = panel.querySelector('.s-status'), playBtn = panel.querySelector('.s-play');

  // ---------- scene state for the current segment ----------
  let current = -1, mode = null, cleanup = null;
  let detached = false;   // the user took the camera (rotation dial) mid-segment; play re-attaches it
  const gold = new THREE.Color(C.gold);

  function makeCard(card) {
    const el = document.createElement('div');
    el.className = 's-card' + (card.placeholder ? ' s-card-ph' : '');
    el.innerHTML = card.placeholder
      ? `<div class="s-ph-frame" role="img" aria-label="Yer tutucu görsel"><span>Yer tutucu</span></div><b>${esc(card.title)}</b>${trustTag(card.trust)}`
      : `${trustTag(card.trust)}<b>${esc(card.title)}</b>${card.body ? `<p>${esc(card.body)}</p>` : ''}`;
    const obj = new CSS2DObject(el);
    obj.position.set(...card.anchor);
    obj.center.set(0.5, 1);               // card sits above its anchor; CSS draws the stem
    scene.add(obj);
    requestAnimationFrame(() => el.classList.add('on'));
    return () => scene.remove(obj);       // CSS2DObject removes its element on 'removed'
  }

  // Gold glaze that fades in over existing geometry, then holds (no endless loop).
  function glaze(geos) {
    const mat = new THREE.MeshBasicMaterial({ color: '#f2c64a', transparent: true, opacity: 0, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const group = new THREE.Group();
    geos.forEach(([g, m]) => { const mesh = new THREE.Mesh(g, mat); if (m) mesh.applyMatrix4(m); group.add(mesh); });
    scene.add(group);
    let start = -1, alive = true;
    animate(now => {
      if (!alive) return false;
      if (start < 0) start = now;
      const t = REDUCE_MOTION ? 99 : (now - start) / 1000;
      mat.opacity = t < 2.4 ? Math.min(1, t * 2) * (0.62 + 0.2 * Math.sin(t / 2.4 * Math.PI * 5)) : 0.78;
      return t < 2.4;
    });
    return { dispose(owned) { alive = false; scene.remove(group); mat.dispose(); owned.forEach(g => g.dispose()); } };
  }

  function highlight(target) {
    if (o.glazeTargets[target]) {                       // a whole building (shared geometry: nothing to dispose)
      const h = glaze(o.glazeTargets[target]);
      return () => h.dispose([]);
    }
    // main dome (slightly enlarged so it sits on top) + the two semi-domes
    const domeY = DOME.base + DOME.drumH;
    const domeGeo = new THREE.SphereGeometry(DOME.r * 1.02, 32, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    const parts = [[domeGeo, T(0, domeY, HALL.z)]], owned = [domeGeo];
    for (const s of [-1, 1]) {
      const [shell, cap] = semiDome(SEMI_R * 1.02, 16, 6);
      cap.dispose(); owned.push(shell);
      parts.push([shell, T(0, HALL.h + 0.6, HALL.z + s * DOME.r, s > 0 ? 0 : Math.PI)]);
    }
    const h = glaze(parts);
    return () => h.dispose(owned);
  }

  // Revenue flow: a gold tube drawn from the hamam to the mosque, with a darker-gold rim,
  // with coins travelling along it and labels appearing as it passes them.
  function flow(fx) {
    const a = new THREE.Vector3(...fx.from), b = new THREE.Vector3(...fx.to);
    const mid = a.clone().lerp(b, 0.5); mid.y += 14;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const SEG = 64, RAD = 6;
    const tube = new THREE.TubeGeometry(curve, SEG, 0.5, RAD, false);
    const rim = new THREE.TubeGeometry(curve, SEG, 0.78, RAD, false);
    const goldMat = new THREE.MeshBasicMaterial({ color: gold });
    const inkMat = new THREE.MeshBasicMaterial({ color: '#a8781f', side: THREE.BackSide });
    const coinGeo = new THREE.SphereGeometry(0.9, 10, 6);
    const coinMat = new THREE.MeshBasicMaterial({ color: '#fff1b8' });
    const group = new THREE.Group();
    const coins = [0, 1, 2].map(() => new THREE.Mesh(coinGeo, coinMat));
    group.add(new THREE.Mesh(rim, inkMat), new THREE.Mesh(tube, goldMat), ...coins);
    coins.forEach(c => { c.visible = false; });
    scene.add(group);

    const labels = fx.labels.map((text, i) => {
      const el = document.createElement('div');
      el.className = 's-flow-label';
      el.textContent = text;
      const obj = new CSS2DObject(el);
      const t = 0.28 + i * 0.26;
      obj.position.copy(curve.getPoint(t)).add(new THREE.Vector3(0, 2.2, 0));
      obj.center.set(0.5, 1);
      obj.userData.t = t;
      scene.add(obj);
      return obj;
    });

    const drawMs = REDUCE_MOTION ? 0 : 2200;
    let start = -1, alive = true;
    animate(now => {
      if (!alive) return false;
      if (start < 0) start = now;
      const k = drawMs ? Math.min(1, (now - start) / drawMs) : 1;
      const n = Math.floor(k * SEG) * RAD * 6;
      tube.setDrawRange(0, n); rim.setDrawRange(0, n);
      labels.forEach(l => l.element.classList.toggle('on', k >= l.userData.t));
      if (k < 1 || REDUCE_MOTION) return k < 1;
      coins.forEach((c, i) => {                         // only once the line is drawn
        const t = ((now - start - drawMs) / 2600 + i / 3) % 1;
        c.visible = true;
        c.position.copy(curve.getPoint(t));
      });
      return true;
    });
    return () => {
      alive = false;
      labels.forEach(l => scene.remove(l));
      scene.remove(group);
      [tube, rim, coinGeo].forEach(g => g.dispose());
      [goldMat, inkMat, coinMat].forEach(m => m.dispose());
    };
  }

  function activate(i) {
    if (i === current) return;
    current = i;
    detached = false;
    const seg = segments[i];
    items.forEach((li, j) => { li.classList.toggle('on', j === i); li.toggleAttribute('aria-current', j === i); });
    if (mode === 'listen') {
      const li = items[i];
      list.scrollTo({ top: li.offsetTop - list.offsetTop - (list.clientHeight - li.offsetHeight) / 2, behavior: REDUCE_MOTION ? 'auto' : 'smooth' });
    }
    panel.querySelector('.s-prev').disabled = i === 0;
    panel.querySelector('.s-next').disabled = i === segments.length - 1;
    if (cleanup) cleanup();
    const undo = [];
    o.flyTo(seg.camera.position, seg.camera.target, { orbit: !!seg.camera.orbit });
    if (seg.card) undo.push(makeCard(seg.card));
    if (seg.effect?.type === 'highlight') undo.push(highlight(seg.effect.target));
    if (seg.effect?.type === 'flow') undo.push(flow(seg.effect));
    cleanup = () => { undo.forEach(f => f()); cleanup = null; };
    o.kick();
  }

  // ---------- Dinle: speech, or timed fallback ----------
  const synth = window.speechSynthesis;
  let voice = null, voiceChecked = false, playing = false, token = 0, timer = 0, utter = null;

  const pickVoice = () => (synth?.getVoices() || []).find(v => /^tr([-_]|$)/i.test(v.lang)) || null;
  function loadVoice() {
    if (voiceChecked || !synth) { voiceChecked = true; return Promise.resolve(voice); }
    voice = pickVoice();
    if (voice) { voiceChecked = true; return Promise.resolve(voice); }
    return new Promise(res => {
      const done = () => { clearTimeout(t); synth.removeEventListener('voiceschanged', done); voice = pickVoice(); voiceChecked = true; res(voice); };
      const t = setTimeout(done, 1500);
      synth.addEventListener('voiceschanged', done);
    });
  }

  function stopAudio() {
    token++;
    clearTimeout(timer);
    if (synth && (synth.speaking || synth.pending)) synth.cancel();
    utter = null;
  }

  function speak(i) {
    stopAudio();
    activate(i);
    const tok = token;
    const after = () => { if (tok === token && playing) advance(); };
    if (voice) {
      utter = new SpeechSynthesisUtterance(segments[i].text);   // kept referenced: Chrome GCs pending utterances
      utter.lang = 'tr-TR'; utter.voice = voice; utter.rate = 0.95;
      utter.onend = after;
      utter.onerror = e => { if (e.error !== 'interrupted' && e.error !== 'canceled') after(); };
      synth.speak(utter);
    } else {
      timer = setTimeout(after, Math.max(AUTO_MS, segments[i].text.length * 55));
    }
  }

  function advance() {
    if (current < segments.length - 1) speak(current + 1);
    else { setPlaying(false); timer = setTimeout(() => finish(), 900); }
  }

  function setPlaying(on) {
    playing = on;
    playBtn.innerHTML = icon(on ? 'pause' : 'play', 22);
    playBtn.setAttribute('aria-label', on ? 'Duraklat' : 'Oynat');
  }

  // Pause = stop the utterance (speechSynthesis.pause() is unreliable on Android); resume restarts the segment
  // and, if the user had taken the camera, flies back to the segment's shot.
  let voiceStatus = '';
  playBtn.onclick = () => {
    if (playing) { stopAudio(); setPlaying(false); return; }
    if (detached && current >= 0) {
      const c = segments[current].camera;
      o.flyTo(c.position, c.target, { orbit: !!c.orbit });
      detached = false;
    }
    if (voiceStatus) status.textContent = voiceStatus;
    setPlaying(true);
    speak(current < 0 ? 0 : current);
  };
  const step = d => {
    const i = Math.max(0, Math.min(segments.length - 1, current + d));
    if (playing) speak(i); else activate(i);
  };
  panel.querySelector('.s-prev').onclick = () => step(-1);
  panel.querySelector('.s-next').onclick = () => step(1);
  items.forEach((li, i) => li.addEventListener('click', () => {
    if (mode !== 'listen') return;
    if (playing) speak(i); else activate(i);
  }));

  // ---------- Oku: IntersectionObserver on the transcript ----------
  let io = null;
  function observe() {
    io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) activate(+e.target.dataset.i);
    }, { root: list, rootMargin: '-46% 0px -46% 0px', threshold: 0 });
    items.forEach(li => io.observe(li));
  }

  // ---------- modes ----------
  async function start(m, from = 0) {
    end(false);
    mode = m;
    panel.hidden = false;
    panel.dataset.mode = m;
    panel.querySelectorAll('.seg button').forEach(b => b.setAttribute('aria-selected', b.dataset.mode === m));
    o.onLayout();
    current = -1;
    if (m === 'listen') {
      // Unlock speech inside the tap (iOS needs the first speak() in a user gesture).
      if (synth && !voiceChecked) { try { synth.speak(new SpeechSynthesisUtterance('')); } catch { /* ignore */ } }
      activate(from);
      status.textContent = 'Ses hazırlanıyor…';
      await loadVoice();
      if (mode !== 'listen') return;
      status.textContent = voiceStatus = voice ? 'Türkçe ses' : 'Türkçe ses yok · otomatik ilerleme';
      setPlaying(true);
      speak(from);
    } else {
      status.textContent = 'Kaydırarak okuyun';
      list.scrollTop = 0;
      const li = items[from];
      if (from > 0) list.scrollTop = li.offsetTop - list.offsetTop - (list.clientHeight - li.offsetHeight) / 2;
      activate(from);
      observe();
    }
  }

  function end(toMenu = true) {
    stopAudio();
    setPlaying(false);
    io?.disconnect(); io = null;
    if (cleanup) cleanup();
    o.releaseCamera();                     // cancel a running shot; the caller decides where the camera goes next
    current = -1;
    mode = null;
    items.forEach(li => li.classList.remove('on'));
    if (toMenu) { panel.hidden = true; o.onEnd(); }
  }
  function finish() { if (mode) end(true); }

  panel.querySelectorAll('.seg button').forEach(b => { b.onclick = () => { if (b.dataset.mode !== mode) start(b.dataset.mode, Math.max(0, current)); }; });
  panel.querySelector('.s-close').onclick = () => end(true);
  panel.querySelector('.s-done').onclick = () => end(true);

  return {
    panel,
    start,
    get active() { return !!mode; },
    /**
     * The user grabbed the camera (rotation dial): stop the automatic camera. In Dinle this also
     * pauses the narration, so the play button resumes both; in Oku the next segment re-attaches it.
     */
    pause() {
      if (!mode) return;
      detached = true;
      if (mode === 'listen' && playing) {
        stopAudio();
        setPlaying(false);
        status.textContent = 'Duraklatıldı · devam için oynat';
      }
    },
    dispose() { end(false); panel.remove(); },
  };
}
