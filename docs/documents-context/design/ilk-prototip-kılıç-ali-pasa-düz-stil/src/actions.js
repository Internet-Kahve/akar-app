// After-story actions: Geçmişi Gör (before/after slider), İz Bırak (local
// memory record, "Onay bekliyor"), Bulmaca (placeholder), Birlikte Gez (share link with a room code).
// Each opens a modal inside the detail view; nothing leaves the device.

import { icon } from './icons.js';

const STORE_KEY = 'vakif.memories.v1';
const esc = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

// Simple mosque silhouette shared by both placeholder "images".
const SILHOUETTE = `<path d="M40 128V96h22V82a28 28 0 0 1 56 0v14h22v32z M128 128V40l3-14 3 14v88z M86 54v-8" />`;

function modal(root, title, body) {
  const wrap = document.createElement('div');
  wrap.className = 'm-wrap';
  wrap.innerHTML = `
    <div class="m-box sheet" role="dialog" aria-modal="true" aria-labelledby="m-title">
      <header><h3 id="m-title">${esc(title)}</h3><button type="button" class="icon-btn m-x" aria-label="Kapat">${icon('close', 20)}</button></header>
      <div class="m-body">${body}</div>
    </div>`;
  root.appendChild(wrap);
  const cleanups = [];
  const close = () => { cleanups.forEach(f => f()); wrap.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  wrap._close = close;
  wrap.querySelector('.m-x').onclick = close;
  wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
  wrap.querySelector('.m-x').focus({ preventScroll: true });
  return { el: wrap, close, onClose: f => cleanups.push(f) };
}

// ---------------------------------------------------------------------------

function openPast(root) {
  const m = modal(root, 'Geçmişi Gör', `
    <div class="ba" style="--p:50%">
      <div class="ba-img ba-now" role="img" aria-label="Yer tutucu: bugünkü görünüm">
        <svg viewBox="0 0 180 150" aria-hidden="true"><rect x="0" y="128" width="180" height="22" class="road"/>${SILHOUETTE}</svg>
        <span class="ba-label">Bugün</span>
      </div>
      <div class="ba-img ba-then" role="img" aria-label="Yer tutucu: gravür">
        <svg viewBox="0 0 180 150" aria-hidden="true"><path class="sea" d="M0 132h180M0 138h180M0 144h180"/>${SILHOUETTE}</svg>
        <span class="ba-label">Gravür</span>
      </div>
      <span class="ba-ph">Yer tutucu</span>
      <span class="ba-handle" aria-hidden="true"></span>
      <input type="range" min="0" max="100" value="50" aria-label="Gravür ile bugün arasında kaydır">
    </div>
    <p class="m-note">İki görsel de <b>yer tutucudur</b>. Gerçek gravür ve bugünkü fotoğraf, kaynaklarıyla birlikte eklenecek.</p>`);
  const ba = m.el.querySelector('.ba');
  m.el.querySelector('input').oninput = e => ba.style.setProperty('--p', `${e.target.value}%`);
}

// ---------------------------------------------------------------------------

function loadMemories() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch { return []; }
}
function saveMemories(list) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); return true; }
  catch {                                       // quota: keep the records, drop the thumbnails
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list.map(r => ({ ...r, photo: r.photo && { ...r.photo, thumbnail: null } })))); return true; }
    catch { return false; }
  }
}
const uuid = () => crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** Downscale to a small JPEG data URL so the record can live in localStorage. */
async function thumbnail(file, max = 480) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return { dataUrl: c.toDataURL('image/jpeg', 0.72), width: img.naturalWidth, height: img.naturalHeight };
  } finally { URL.revokeObjectURL(url); }
}

const memoryCard = r => `
  <article class="mem">
    ${r.photo?.thumbnail ? `<img src="${r.photo.thumbnail}" alt="İz fotoğrafı">` : '<div class="mem-noimg" aria-hidden="true"></div>'}
    <div><p>${esc(r.text)}</p>
      <span class="mem-status">${r.status === 'pending' ? 'Onay bekliyor' : esc(r.status)}</span>
      <time datetime="${r.createdAt}">${new Date(r.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
    </div>
  </article>`;

function openTrace(root, { placeId, storyId }) {
  const mine = () => loadMemories().filter(r => r.placeId === placeId);
  const m = modal(root, 'İz Bırak', `
    <form class="trace" novalidate>
      <label class="photo-pick">
        <input type="file" accept="image/*" capture="environment">
        <span class="photo-prev" aria-hidden="true"></span>
        <span class="photo-txt">${icon('photo', 18)}<span>Fotoğraf seç</span></span>
      </label>
      <label class="mem-label" for="mem-text">Kısa bir hatıra</label>
      <textarea id="mem-text" maxlength="280" rows="3" placeholder="Bu yapıyla ilgili bir anınız…" required></textarea>
      <div class="mem-row"><span class="mem-count">0 / 280</span><button type="submit" class="btn btn-primary">Gönder</button></div>
      <p class="m-note">Paylaşımlar yayınlanmadan önce incelenir. Şimdilik yalnızca bu cihazda saklanır.</p>
    </form>
    <div class="mem-list">${mine().reverse().map(memoryCard).join('')}</div>`);
  const form = m.el.querySelector('form'), input = form.querySelector('input'), text = form.querySelector('textarea');
  const prev = form.querySelector('.photo-prev'), count = form.querySelector('.mem-count');
  let file = null, prevUrl = null;
  m.onClose(() => prevUrl && URL.revokeObjectURL(prevUrl));
  input.onchange = () => {
    file = input.files[0] || null;
    if (prevUrl) URL.revokeObjectURL(prevUrl);
    prevUrl = file ? URL.createObjectURL(file) : null;
    prev.style.backgroundImage = prevUrl ? `url(${prevUrl})` : '';
    form.querySelector('.photo-txt span').textContent = file ? 'Fotoğrafı değiştir' : 'Fotoğraf seç';
  };
  text.oninput = () => { count.textContent = `${text.value.length} / 280`; };
  form.onsubmit = async e => {
    e.preventDefault();
    const body = text.value.trim();
    if (body.length < 3) { text.focus(); text.classList.add('err'); return; }
    form.querySelector('button[type=submit]').disabled = true;
    let photo = null;
    if (file) {
      const t = await thumbnail(file).catch(() => null);
      photo = { name: file.name, type: file.type, size: file.size, width: t?.width ?? null, height: t?.height ?? null, thumbnail: t?.dataUrl ?? null, remoteUrl: null };
    }
    // Shaped like the server record it will become; only `sync` changes on upload.
    const record = {
      schema: 'vakif.memory/1',
      id: uuid(),
      placeId, storyId,
      createdAt: new Date().toISOString(),
      text: body,
      photo,
      author: { kind: 'anonymous', displayName: null },
      status: 'pending',
      moderation: { status: 'pending', reviewedAt: null, reviewer: null, note: null },
      sync: { state: 'local', remoteId: null, uploadedAt: null },
    };
    const all = loadMemories(); all.push(record);
    const saved = saveMemories(all);
    form.outerHTML = `<div class="trace-done"><span class="done-ic">${icon('check', 20)}</span><h4>Teşekkürler</h4><p>İziniz kaydedildi${saved ? '' : ' (bu oturum için)'}.</p></div>`;
    m.el.querySelector('.mem-list').insertAdjacentHTML('afterbegin', memoryCard(record));
  };
}

// ---------------------------------------------------------------------------

function roomCode() {
  const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', b = crypto.getRandomValues(new Uint8Array(6));
  return [...b].map(x => A[x % A.length]).join('');
}

function openTogether(root, { storyId }) {
  const code = roomCode(), url = new URL(location.href);
  url.search = ''; url.hash = '';
  url.searchParams.set('oda', code);
  url.searchParams.set('hikaye', storyId);
  const link = url.toString();
  const m = modal(root, 'Birlikte Gez', `
    <p class="room-code" aria-label="Oda kodu ${code.split('').join(' ')}">${code}</p>
    <input class="room-link" type="text" readonly value="${esc(link)}" aria-label="Paylaşım linki">
    <div class="mem-row">
      <button type="button" class="btn btn-secondary m-copy">${icon('copy', 18)}<span>Kopyala</span></button>
      ${navigator.share ? `<button type="button" class="btn btn-primary m-share">${icon('share', 18)}<span>Paylaş</span></button>` : ''}
    </div>
    <p class="m-note">Arkadaşların bu linkle aynı anlatımı seninle birlikte dinleyebilir (yakında).</p>
    <p class="m-note">Konum paylaşılmaz; yalnızca anlatım eşlenir.</p>`);
  const copy = m.el.querySelector('.m-copy');
  copy.onclick = async () => {
    try { await navigator.clipboard.writeText(link); copy.innerHTML = `${icon('check', 18)}<span>Kopyalandı</span>`; }
    catch { m.el.querySelector('.room-link').select(); }
  };
  const share = m.el.querySelector('.m-share');
  if (share) share.onclick = () => navigator.share({ title: 'Birlikte Gez', text: `Oda kodu: ${code}`, url: link }).catch(() => {});
}

// ---------------------------------------------------------------------------

function openPuzzle(root) {
  modal(root, 'Bulmaca', `
    <p class="m-note">Bu yapının hikâyesine dayanan bulmaca <b>yakında</b> burada olacak.</p>`);
}

// ---------------------------------------------------------------------------

/** Close whichever action modal is open inside `root` (runs its cleanups). */
export function closeActions(root) { root.querySelector('.m-wrap')?._close(); }

export function openAction(kind, root, ctx) {
  closeActions(root);
  if (kind === 'past') openPast(root);
  else if (kind === 'trace') openTrace(root, ctx);
  else if (kind === 'puzzle') openPuzzle(root);
  else if (kind === 'together') openTogether(root, ctx);
}
