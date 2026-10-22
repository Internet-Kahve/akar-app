import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRDracoMeshCompression } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import { PNG } from 'pngjs';
import fs from 'fs';

export const lin = v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
export const srgb = v => v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
export const hex2s = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
export const hex2lin = h => hex2s(h).map(v => lin(v / 255));
export const lin2hex = c => '#' + c.slice(0, 3).map(v => Math.round(Math.min(1, Math.max(0, srgb(v))) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
export const s2hex = c => '#' + c.map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
export const hsvV = h => Math.max(...hex2s(h)) / 255;

export async function makeIO() {
  return new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(), 'draco3d.encoder': await draco3d.createEncoderModule() });
}

// ---------- doku işleme ----------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const MORTAR = hex2s('#E9DFCB');
function classify(r, g, b, a) {
  if (a < 10) return 'skip';
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx ? (mx - mn) / mx : 0;
  if (mx < 30) return 'black';
  if (dist([r, g, b], MORTAR) < 10) return 'mortar';
  if (mn > 210 && sat < 0.07) return 'white';
  if (b > r + 15 && mx < 150) return 'window';
  if (mx < 110 && g >= r - 4) return 'iron';
  if (mx < 110 && r >= g && sat > 0.25) return 'darkwood';
  if (dist([r, g, b], hex2s('#7A5134')) < 30) return 'door';
  if (r > g * 1.25 && sat > 0.35 && mx >= 120) return 'brick';
  if (r >= g && g >= b && sat > 0.1 && sat <= 0.36 && mx >= 150) return 'tan';
  return 'keep';
}
const GAIN = { window: ['#3E4A55', '#5A6672'], iron: ['#36413F', '#4B5654'], darkwood: ['#4E3427', '#6B4A3A'] };
function gainOf(a, b) { const A = hex2s(a), B = hex2s(b); return [B[0] / A[0], B[1] / A[1], B[2] / A[2]]; }

export function processTexture(buf, spec) {
  const p = PNG.sync.read(Buffer.from(buf)); const n = p.width * p.height, d = p.data;
  const cls = new Array(n);
  const acc = { brick: [0, 0, 0, 0], tan: [0, 0, 0, 0], nonm: [0, 0, 0, 0], mort: [0, 0, 0, 0], all: 0 };
  for (let i = 0; i < n; i++) {
    const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2], a = d[i * 4 + 3];
    const c = classify(r, g, b, a); cls[i] = c; if (c === 'skip') continue; acc.all++;
    const t = c === 'mortar' ? acc.mort : acc.nonm; t[0] += r; t[1] += g; t[2] += b; t[3]++;
    if (c === 'brick' || c === 'tan') { const q = acc[c]; q[0] += r; q[1] += g; q[2] += b; q[3]++; }
  }
  const mode = spec.tex;
  const clampG = (g, lo, hi) => Math.min(hi, Math.max(lo, g));
  if (mode === 'lead') {
    // baskın rengi bul
    const cnt = new Map(); for (let i = 0; i < n; i++) { if (cls[i] === 'skip') continue; const k = d[i * 4] << 16 | d[i * 4 + 1] << 8 | d[i * 4 + 2]; cnt.set(k, (cnt.get(k) || 0) + 1); }
    const dom = [...cnt.entries()].sort((a, b) => b[1] - a[1])[0][0]; const D = [dom >> 16, dom >> 8 & 255, dom & 255];
    for (let i = 0; i < n; i++) { if (cls[i] === 'skip') continue; for (let c = 0; c < 3; c++) { const ratio = Math.min(1, d[i * 4 + c] / D[c]); d[i * 4 + c] = Math.round(255 * Math.pow(ratio, 1.6)); } }
  } else if (mode === 'tint') {
    const T = hex2s(spec.target);
    const g = [0, 1, 2].map(c => clampG((T[c] * acc.all - acc.mort[c]) / Math.max(1, acc.nonm[c]), 0.6, 1.45));
    for (let i = 0; i < n; i++) { const c = cls[i]; if (c === 'skip' || c === 'mortar') continue; for (let k = 0; k < 3; k++) d[i * 4 + k] = Math.min(255, Math.round(d[i * 4 + k] * g[k])); }
  } else { // classes
    const bt = hex2s(spec.brick || '#CF7F55');
    const bg = acc.brick[3] ? [0, 1, 2].map(c => clampG(bt[c] / (acc.brick[c] / acc.brick[3]), 0.8, 1.7)) : [1, 1, 1];
    const tt = spec.tan ? hex2s(spec.tan) : null;
    const tg = tt && acc.tan[3] ? [0, 1, 2].map(c => clampG(tt[c] / (acc.tan[c] / acc.tan[3]), 0.8, 1.7)) : null;
    const W = hex2s('#F5F4F0'), I = hex2s('#4B5654');
    for (let i = 0; i < n; i++) {
      const c = cls[i]; let g = null;
      if (c === 'black') { d[i * 4] = I[0]; d[i * 4 + 1] = I[1]; d[i * 4 + 2] = I[2]; continue; }
      if (c === 'white') { d[i * 4] = W[0]; d[i * 4 + 1] = W[1]; d[i * 4 + 2] = W[2]; continue; }
      if (GAIN[c]) g = gainOf(...GAIN[c]); else if (c === 'brick') g = bg; else if (c === 'tan') g = tg;
      if (g) for (let k = 0; k < 3; k++) d[i * 4 + k] = Math.min(255, Math.round(d[i * 4 + k] * g[k]));
    }
  }
  // etkin ortalama (alfa ağırlıklı)
  let s = [0, 0, 0], w = 0; for (let i = 0; i < n; i++) { const a = d[i * 4 + 3] / 255; w += a; for (let k = 0; k < 3; k++) s[k] += d[i * 4 + k] * a; }
  return { png: PNG.sync.write(p), mean: s.map(v => v / Math.max(w, 1e-9)), opaque: w / n };
}

export function texMean(buf) {
  const p = PNG.sync.read(Buffer.from(buf)); const n = p.width * p.height, d = p.data; let s = [0, 0, 0], w = 0;
  for (let i = 0; i < n; i++) { const a = d[i * 4 + 3] / 255; w += a; for (let k = 0; k < 3; k++) s[k] += d[i * 4 + k] * a; }
  return { mean: s.map(v => v / Math.max(w, 1e-9)), opaque: w / n };
}

// ---------- geometri yardımcıları ----------
export function worldMat(node) { return node.getWorldMatrix(); }
export function xf(m, p) { return [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]]; }

export function nodeStats(doc) {
  const out = {};
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh(); if (!mesh) continue; const M = worldMat(node);
    let v = 0, t = 0; const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; const tmp = [0, 0, 0];
    for (const p of mesh.listPrimitives()) {
      const pos = p.getAttribute('POSITION'); v += pos.getCount(); t += (p.getIndices() ? p.getIndices().getCount() : pos.getCount()) / 3;
      for (let i = 0; i < pos.getCount(); i++) { pos.getElement(i, tmp); const w = xf(M, tmp); for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], w[k]); mx[k] = Math.max(mx[k], w[k]); } }
    }
    out[node.getName()] = { v, t, mn, mx };
  }
  return out;
}

export async function writeDraco(io, doc, file) {
  await doc.transform(prune({ keepLeaves: true }));
  const ext = doc.getRoot().listExtensionsUsed().find(e => e.extensionName === 'KHR_draco_mesh_compression') || doc.createExtension(KHRDracoMeshCompression); ext.setRequired(true);
  ext.setEncoderOptions({ method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER, quantizationBits: { POSITION: Number(process.env.QP || 14), NORMAL: 10, COLOR: 8, TEX_COORD: 12, GENERIC: 12 } });
  await io.write(file, doc);
}
