// Full-screen detail view: the Kılıç Ali Paşa complex (mosque, hamam) and
// Tophane Çeşmesi on a sand island in a teal sea. Created when opened, fully
// disposed when closed. Renders on demand: frames run only during camera
// tweens, while the orbit controls are moving (incl. damping), or while a
// story animation runs.
//
// Camera rule: every move goes through flyTo()/recenter(), which animate
// camera.position AND controls.target together (never lookAt alone), so the
// orbit pivot is always what the camera is looking at. When the user takes
// over after a story shot, the pivot glides back to the complex centre, and
// while the user is in control the pivot is clamped near the complex.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { buildMosque, addLights, disposeMosque, HALL, C } from './mosque.js';
import { buildHamam, HAMAM } from './hamam.js';
import { buildFountain } from './fountain.js';
import { createStory } from './story.js';
import { openAction, closeActions } from './actions.js';
import STORY from './stories/kilic-ali-pasa.json';
import { MOSQUE, FOUNTAIN, toLocal } from './stops.js';
import { PIXEL_RATIO, LOW_END, REDUCE_MOTION } from './perf.js';
import { sheetHandle } from './ui.js';
import { icon, ORNAMENT } from './icons.js';
import { createDial } from './dial.js';

const MODES = [['listen', 'Dinle'], ['read', 'Oku']];
const AFTER = [['past', 'Geçmişi Gör'], ['trace', 'İz Bırak'], ['puzzle', 'Bulmaca'], ['together', 'Birlikte Gez']];
const tile = ([k, label], cls = 'btn-tile') => `
        <button type="button" class="${cls}" data-k="${k}">${icon(k, 22, 1.8)}<span>${label}</span></button>`;

// Scene layout (metres, mosque frame). The fountain sits at its real OSM offset
// from the mosque; the hamam's position is illustrative (see README).
const F = toLocal(FOUNTAIN.lngLat);
const F_YAW = THREE.MathUtils.degToRad(MOSQUE.qiblaAzimuth - FOUNTAIN.azimuth);
/** Orbit pivot for free viewing: centre of mosque, hamam and fountain, a little above ground. */
const CENTER = new THREE.Vector3((0 + HAMAM.x + F.x) / 3, 8, (HALL.z + HAMAM.z + F.z) / 3);
const FREE_R = 24;                 // the pivot may wander this far (horizontally) from CENTER
const FREE_DIST = [70, 200];       // orbit distance range after a recenter
const ISLAND_R = 60;

const ease = k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const around = (sph, t = CENTER) => new THREE.Vector3().setFromSpherical(sph).add(t);
// Default views look roughly along the hamam–fountain line from the fountain side, from fairly high up,
// so all three buildings fit a portrait screen (fountain in front, mosque, hamam behind it).
const INTRO_TO = new THREE.Spherical(170, 1.0, Math.PI * 0.68);
const INTRO_FROM = new THREE.Spherical(420, 0.6, INTRO_TO.theta + 0.9);
const WIDE = new THREE.Spherical(185, 0.95, Math.PI * 0.7);         // story end: whole complex

/**
 * @param {{stop: {id:string, name:string, sub:string}, onBack:()=>void, onNext:()=>void}} opts
 * @returns {{ show:()=>void, close:()=>Promise<void> }}
 */
export function createDetailView({ stop, onBack, onNext }) {
  // ---------- DOM ----------
  const root = document.createElement('section');
  root.id = 'detail';
  root.setAttribute('aria-label', `${stop.name} — 3B canlandırma`);
  root.innerHTML = `
    <div class="sky"></div>
    <canvas aria-label="${stop.name}, hamam ve Tophane Çeşmesi üç boyutlu model; döndürmek için sürükleyin"></canvas>
    <button class="btn btn-float d-back" type="button">${icon('back', 20)}<span>Harita</span></button>
    <div class="d-hint">${icon('rotate', 16)}<span>Sürükle: döndür · İki parmak: yakınlaştır</span></div>
    <div class="d-sheet sheet">
      <h2 class="title">${stop.name}</h2>
      <div class="d-head"><p class="d-meta">${stop.sub}</p><span class="chip t-rep">Temsili canlandırma</span></div>
      ${ORNAMENT}
      <div class="sheet-body">
        <p class="d-lead">Yapının hikâyesi · ${STORY.length} bölüm</p>
        <div class="d-modes">${tile(MODES[0], 'btn btn-primary')}${tile(MODES[1], 'btn btn-secondary')}</div>
        <div class="d-after" hidden>
          <div class="d-acts">${AFTER.map(a => tile(a)).join('')}</div>
          <p class="d-again">Hikâyeyi yeniden: <button type="button" class="link" data-k="listen">Dinle</button> · <button type="button" class="link" data-k="read">Oku</button></p>
        </div>
        <button class="btn btn-ghost d-next" type="button"><span>Sonraki durak</span>${icon('next', 18)}</button>
      </div>
    </div>`;
  document.body.appendChild(root);
  const canvas = root.querySelector('canvas'), sheet = root.querySelector('.d-sheet'), hint = root.querySelector('.d-hint');
  root.querySelector('.d-back').onclick = onBack;
  root.querySelector('.d-next').onclick = onNext;
  const ctx = { placeId: stop.id, storyId: stop.id };
  sheet.querySelectorAll('button[data-k]').forEach(b => {
    const k = b.dataset.k;
    b.onclick = () => (k === 'listen' || k === 'read' ? startStory(k) : openAction(k, root, ctx));
  });
  sheetHandle(sheet, () => resize());

  // ---------- three.js ----------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !LOW_END, alpha: true, powerPreference: 'default' });
  renderer.setPixelRatio(PIXEL_RATIO);
  renderer.setClearColor(0x000000, 0);
  // HTML cards anchored to model points (only the current segment's are in the scene)
  const labels = new CSS2DRenderer();
  labels.domElement.className = 'd-labels';
  canvas.after(labels.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 1, 3000);
  addLights(scene).position.set(-45, 70, -55);

  const mosque = buildMosque({ detail: 'high' });
  const kit = mosque.userData.kit;
  kit.hull.uniforms.uPx.value = 0.75 * PIXEL_RATIO;
  const hamam = buildHamam(kit);
  const fountain = buildFountain({ detail: 'high', kit, x: F.x, z: F.z, ry: F_YAW });
  scene.add(mosque, hamam, fountain);
  fountain.updateMatrixWorld();
  if (import.meta.env.DEV) {
    const tri = mosque.userData.triangles + hamam.userData.triangles + fountain.userData.triangles;
    console.info(`[detail models] ${tri | 0} triangles (fountain ${fountain.userData.triangles | 0})`);
  }

  // sand island with a thin gold rim; a paved square under the fountain
  const islandMat = new THREE.MeshToonMaterial({ color: C.sand, gradientMap: kit.grad });
  const rimMat = new THREE.MeshBasicMaterial({ color: C.gold });
  const pavingMat = new THREE.MeshToonMaterial({ color: C.paving, gradientMap: kit.grad });
  scene.add(
    new THREE.Mesh(new THREE.CylinderGeometry(ISLAND_R, ISLAND_R + 2, 3, 64).translate(0, -1.5, 0), islandMat),
    new THREE.Mesh(new THREE.CylinderGeometry(ISLAND_R + 0.15, ISLAND_R + 0.15, 0.35, 64, 1, true).translate(0, -0.2, 0), rimMat),
    new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 0.1, 28).translate(F.x, 0.02, F.z), pavingMat),
  );

  // muted teal sea with a lighter shallow band and small, sparse wave marks
  const water = new THREE.Mesh(new THREE.CircleGeometry(260, 64).rotateX(-Math.PI / 2).translate(0, -2.2, 0), new THREE.ShaderMaterial({
    uniforms: { t: { value: 0 }, fw: { value: new THREE.Vector2(0, 1) } },   // fw: camera forward on the ground
    vertexShader: 'varying vec2 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `varying vec2 vW; uniform float t; uniform vec2 fw;
      void main(){
        float r = length(vW);
        vec3 c = mix(vec3(.553, .749, .741), vec3(.47, .68, .675), smoothstep(80., 260., r));
        c = mix(c, vec3(.72, .86, .84), smoothstep(76., ${ISLAND_R + 1}., r) * .6);
        // at most one "︵︵" mark per 22 × 16 m cell, at a hashed spot, drifting slightly;
        // turned to face the camera so the humps always point up on screen
        vec2 cell = vec2(22., 16.), p = vW / cell, id = floor(p), f = fract(p);
        float h = fract(sin(dot(id, vec2(12.9898, 78.233))) * 43758.5453);
        vec2 q0 = (f - vec2(.3 + .4 * h, .3 + .4 * fract(h * 7.))) * cell;
        vec2 q = vec2(dot(q0, vec2(-fw.y, fw.x)), -dot(q0, fw));
        q.x += .6 * sin(t * .5 + h * 6.28);
        float m = 0.;
        for (int k = 0; k < 2; k++) {
          vec2 qq = q - vec2(float(k) * 2.6 - 1.3, 0.);
          float d = abs(length(qq) - 1.2), aa = fwidth(d);
          m = max(m, (1. - smoothstep(.12, .12 + aa + .04, d)) * step(0., -qq.y));
        }
        m *= step(.4, h) * smoothstep(${ISLAND_R + 8}., ${ISLAND_R + 16}., r) * (1. - smoothstep(170., 250., r));
        gl_FragColor = vec4(mix(c, vec3(.83, .92, .9), m * .85), 1.);
      }`,
  }));
  scene.add(water);

  // ---------- controls ----------
  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(CENTER);
  controls.enablePan = true;
  controls.screenSpacePanning = false;   // pan slides the pivot over the ground, then gets clamped (see clampPivot)
  controls.panSpeed = 0.6;
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.rotateSpeed = 0.7;
  controls.zoomSpeed = 0.8;
  controls.minDistance = 20;
  controls.maxDistance = 240;
  controls.minPolarAngle = 0.25;
  controls.maxPolarAngle = 1.38;   // never below the horizon
  controls.enabled = false;        // until the fly-in ends

  // ---------- render loop (on demand) ----------
  let raf = 0, disposed = false;
  const anims = new Set();          // camera tweens and story animations: fn(now) -> keep running?
  function frame(now) {
    raf = 0;
    if (disposed) return;
    let more = false;
    for (const a of anims) { if (a(now)) more = true; else anims.delete(a); }
    if (controls.enabled && controls.update()) more = true;
    if (cam.free) clampPivot();
    syncDial();
    if (!REDUCE_MOTION) water.material.uniforms.t.value = now / 1000;
    water.material.uniforms.fw.value.set(controls.target.x - camera.position.x, controls.target.z - camera.position.z).normalize();
    kit.setResolution(renderer.domElement.width, renderer.domElement.height);
    renderer.render(scene, camera);
    labels.render(scene, camera);
    if (more) kick();
  }
  const kick = () => { if (!raf && !disposed) raf = requestAnimationFrame(frame); };
  const animate = fn => { anims.add(fn); kick(); };

  // ---------- camera ----------
  // `token` cancels a running tween when a newer one starts. `free` = the user
  // orbits around the complex (pivot clamped); false while a story shot holds.
  // `scripted` changes only when a scripted shot (intro / flyTo) starts; it cancels the dial's follower.
  const cam = { token: 0, scripted: 0, free: false };
  const _d = new THREE.Vector3(), _o = new THREE.Vector3();
  function setFree(on) { cam.free = on; controls.minDistance = on ? 45 : 20; }

  /** Tween camera.position and controls.target together; a gentle arc over long moves. */
  function flyTo(position, target, { dur = 1700, orbit = false, free = false } = {}) {
    const id = ++cam.token;
    cam.scripted++;
    setFree(false);
    controls.enabled = false;
    controls.autoRotate = false;
    const p0 = camera.position.clone(), t0 = controls.target.clone();
    const p1 = new THREE.Vector3(...position), t1 = new THREE.Vector3(...target);
    const lift = Math.min(18, p0.distanceTo(p1) * 0.12);
    if (REDUCE_MOTION) dur = 0;
    let start = -1;
    animate(now => {
      if (id !== cam.token) return false;
      if (start < 0) start = now;
      const k = dur ? Math.min(1, (now - start) / dur) : 1, e = ease(k);
      camera.position.lerpVectors(p0, p1, e);
      camera.position.y += Math.sin(Math.PI * e) * lift;
      controls.target.lerpVectors(t0, t1, e);
      camera.lookAt(controls.target);
      if (k < 1) return true;
      controls.enabled = true;
      controls.autoRotate = orbit && !REDUCE_MOTION;
      controls.update();
      if (free) setFree(true);
      return false;
    });
  }

  /**
   * Glide the pivot back to CENTER (moving the camera with it, so the view
   * direction is kept) and ease the distance into FREE_DIST. Incremental, so
   * the user can keep dragging while it runs.
   */
  function recenter(dur = 900, distRange = FREE_DIST) {
    const id = ++cam.token;
    controls.enabled = true;
    controls.autoRotate = false;
    const t0 = controls.target.clone(), r0 = camera.position.distanceTo(t0);
    const r1 = THREE.MathUtils.clamp(r0, ...distRange);
    if (REDUCE_MOTION) dur = 0;
    let start = -1;
    animate(now => {
      if (id !== cam.token) return false;
      if (start < 0) start = now;
      const k = dur ? Math.min(1, (now - start) / dur) : 1, e = ease(k);
      _o.subVectors(camera.position, controls.target).setLength(THREE.MathUtils.lerp(r0, r1, e));
      controls.target.lerpVectors(t0, CENTER, e);
      camera.position.copy(controls.target).add(_o);
      camera.lookAt(controls.target);
      if (k < 1) return true;
      setFree(true);
      return false;
    });
  }

  /** Stop any scripted move and hand the camera to the user where it is. */
  function releaseCamera() {
    cam.token++;
    controls.enabled = true;
    controls.autoRotate = false;
  }

  /** Keep the orbit pivot near the complex (pan / damping can't drag it away). */
  function clampPivot() {
    _d.subVectors(controls.target, CENTER);
    _d.y = 0;
    const over = _d.length() - FREE_R;
    const dy = THREE.MathUtils.clamp(controls.target.y, 2, 20) - controls.target.y;
    if (over <= 0 && !dy) return;
    if (over > 0) _d.setLength(over); else _d.set(0, 0, 0);
    _d.y = -dy;
    controls.target.sub(_d);
    camera.position.sub(_d);
  }

  controls.addEventListener('change', kick);
  controls.addEventListener('start', () => {
    hint.style.opacity = 0;
    controls.autoRotate = false;
    // The user grabbed the view while a story shot was holding (e.g. looking out to sea):
    // bring the pivot back to the complex so the drag orbits the buildings, not the water.
    if (!cam.free) recenter();
    kick();
  });

  // intro: fly in from far away; also a tween of position + target
  camera.position.copy(around(REDUCE_MOTION ? INTRO_TO : INTRO_FROM));
  camera.lookAt(CENTER);
  function intro() {
    const id = ++cam.token, sph = new THREE.Spherical();
    cam.scripted++;
    let start = -1;
    animate(now => {
      if (id !== cam.token) return false;
      if (start < 0) start = now;
      const k = REDUCE_MOTION ? 1 : Math.min(1, (now - start) / 1500), e = 1 - Math.pow(1 - k, 3);
      const L = THREE.MathUtils.lerp;
      sph.set(L(INTRO_FROM.radius, INTRO_TO.radius, e), L(INTRO_FROM.phi, INTRO_TO.phi, e), L(INTRO_FROM.theta, INTRO_TO.theta, e));
      controls.target.copy(CENTER);
      camera.position.copy(around(sph));
      camera.lookAt(controls.target);
      if (k < 1) return true;
      controls.enabled = true;
      setFree(true);
      controls.update();
      return false;
    });
  }

  // No double-click / double-tap zoom or text selection on the canvas (avoids accidental jumps).
  canvas.addEventListener('dblclick', e => e.preventDefault());

  // ---------- rotation dial ----------
  // The knob shows the compass bearing of the camera as seen from the complex centre ("Merkez"),
  // so dragging around the dial orbits the complex. UI in dial.js; the camera side lives here.
  const Q = MOSQUE.qiblaAzimuth;          // model +z points to this compass bearing
  const toTheta = bearing => THREE.MathUtils.degToRad(Q - bearing);
  const toBearing = theta => Q - THREE.MathUtils.radToDeg(theta);
  const wrapPi = a => Math.atan2(Math.sin(a), Math.cos(a));
  const _sph = new THREE.Spherical();
  /** Current camera bearing (degrees, clockwise from north) as seen from the orbit pivot. */
  const camBearing = () => toBearing(Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z));

  // Smoothed follower: eases the orbit's azimuth / distance toward the dial's targets each frame.
  // A scripted shot (story flyTo, reset) cancels it.
  const orbit = { theta: null, radius: null, running: false };
  function follow() {
    if (orbit.running) { kick(); return; }
    orbit.running = true;
    const gen = cam.scripted;
    animate(() => {
      if (gen !== cam.scripted) { orbit.running = false; orbit.theta = orbit.radius = null; dial.cancel(); return false; }
      _sph.setFromVector3(_o.subVectors(camera.position, controls.target));
      let done = true;
      if (orbit.theta != null) {
        const diff = wrapPi(orbit.theta - _sph.theta);
        if (Math.abs(diff) > 0.002 && !REDUCE_MOTION) { _sph.theta += diff * 0.3; done = false; } else { _sph.theta = orbit.theta; orbit.theta = null; }
      }
      if (orbit.radius != null) {
        const diff = orbit.radius - _sph.radius;
        if (Math.abs(diff) > 0.2 && !REDUCE_MOTION) { _sph.radius += diff * 0.25; done = false; } else { _sph.radius = orbit.radius; orbit.radius = null; }
      }
      camera.position.copy(controls.target).add(_o.setFromSpherical(_sph));
      camera.lookAt(controls.target);
      if (done) orbit.running = false;
      return !done;
    });
  }

  /**
   * The user touched the dial: stop the story's automatic camera, kill orbit inertia, and make sure
   * we orbit "Merkez" (a story shot may be aimed at the sea; a pan may have nudged the pivot).
   */
  function takeOver() {
    hint.style.opacity = 0;
    if (story.active) story.pause();
    // OrbitControls has no public API to stop damping momentum; zero its pending deltas.
    controls._sphericalDelta?.set(0, 0, 0);
    controls._panOffset?.set(0, 0, 0);
    controls.autoRotate = false;
    if (!cam.free) recenter(600);
    else if (controls.target.distanceTo(CENTER) > 0.5) recenter(500, [controls.minDistance, controls.maxDistance]);
    controls.enabled = true;
  }

  const dial = createDial({
    onGrab: takeOver,
    onTurn: deg => { orbit.theta = toTheta(deg); follow(); },
    onZoom: dir => {
      const r = orbit.radius ?? camera.position.distanceTo(controls.target);
      orbit.radius = THREE.MathUtils.clamp(r * (dir > 0 ? 0.8 : 1.25), 45, controls.maxDistance);
      follow();
    },
    onReset: () => flyTo(around(INTRO_TO).toArray(), CENTER.toArray(), { dur: 1100, free: true }),
  });
  root.appendChild(dial.el);
  const syncDial = () => dial.setKnob(camBearing());

  /** Dial band: below the back button / hint, above the bottom sheet or story panel (a centred column, docked to the bottom). */
  function layoutDial(w, h, bottom) {
    const back = root.querySelector('.d-back');
    const ow = bottom.offsetWidth;
    dial.place({
      top: Math.max(back.offsetTop + back.offsetHeight, hint.offsetTop + hint.offsetHeight) + 12,
      height: h,
      obstacles: [{ left: (w - ow) / 2, right: (w + ow) / 2, top: h - bottom.offsetHeight }],   // offsets: immune to the slide-in transform
    });
  }

  // ---------- story ----------
  const story = createStory({
    root, scene, segments: STORY, animate, kick: () => kick(), flyTo, releaseCamera,
    glazeTargets: {
      hamam: [[hamam.userData.mainGeo]],
      fountain: [[fountain.userData.mainGeo, fountain.matrixWorld.clone()]],
    },
    onLayout: () => resize(),
    onEnd: () => {
      sheet.hidden = false;
      sheet.querySelector('.d-modes').hidden = true;
      sheet.querySelector('.d-lead').hidden = true;
      sheet.querySelector('.d-after').hidden = false;
      resize();
      // back to a wide view of the whole complex, pivot on its centre
      flyTo(around(WIDE).toArray(), CENTER.toArray(), { dur: 2000, free: true });
    },
  });
  function startStory(mode) {
    closeActions(root);
    hint.style.opacity = 0;
    sheet.hidden = true;
    story.start(mode);
  }

  // ---------- size (keep the scene centred above the bottom sheet / story panel) ----------
  function resize() {
    const w = root.clientWidth, h = root.clientHeight;
    renderer.setSize(w, h, false);
    labels.setSize(w, h);
    camera.aspect = w / h;
    camera.fov = w < h ? 46 : 36;
    const bottom = sheet.hidden ? story.panel : sheet;
    const lift = Math.min(bottom.offsetHeight * 0.42, h * 0.25);
    camera.setViewOffset(w, h, 0, lift, w, h);
    camera.updateProjectionMatrix();
    layoutDial(w, h, bottom);
    kick();
  }
  window.__detail = { camera, controls, center: CENTER, cam };   // handy for debugging in the console, like window.__map
  const ro = new ResizeObserver(resize);
  ro.observe(root);
  ro.observe(sheet);          // sheet / panel height changes (collapse, after-story actions, font load) move the dial
  ro.observe(story.panel);
  resize();

  return {
    /** Start the fade + camera fly-in. */
    show() {
      requestAnimationFrame(() => root.classList.add('in'));
      intro();
      root.querySelector('.d-back').focus({ preventScroll: true });
    },
    /** Fade out, then release every GPU resource and the DOM. */
    close() {
      root.classList.remove('in');
      return new Promise(res => setTimeout(() => {
        disposed = true;
        cancelAnimationFrame(raf);
        anims.clear();
        story.dispose();
        closeActions(root);
        ro.disconnect();
        controls.dispose();
        disposeMosque(mosque);   // geometries + the shared kit (toon, hull, lines, blob shadow)
        scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });   // incl. hamam, fountain, island, sea
        [islandMat, rimMat, pavingMat, water.material].forEach(m => m.dispose());
        renderer.dispose();
        renderer.forceContextLoss();
        root.remove();
        delete window.__detail;
        res();
      }, REDUCE_MOTION ? 0 : 560));
    },
  };
}
