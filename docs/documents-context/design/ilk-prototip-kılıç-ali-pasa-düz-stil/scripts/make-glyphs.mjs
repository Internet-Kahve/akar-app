// Generates MapLibre SDF glyph PBFs for the map label fonts
// (Inter for streets/places, Cormorant only for monument names).
// OpenFreeMap only serves Noto Sans glyphs, so we build our own from the
// @fontsource WOFF files (OFL licensed) and ship them in public/fonts.
// Output matches the fontnik/TinySDF convention MapLibre expects:
// 24px em, 3px buffer, 8px radius, 0.25 cutoff.
import fs from 'node:fs';
import path from 'node:path';
import opentype from 'opentype.js';
import { PbfWriter } from 'pbf';

const SIZE = 24, BUFFER = 3, RADIUS = 8, CUTOFF = 0.25;
const FS = 'node_modules/@fontsource';
const STACKS = {
  'Cormorant SemiBold': ['cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff', 'cormorant-garamond/files/cormorant-garamond-latin-ext-600-normal.woff'],
  'Inter Medium': ['inter/files/inter-latin-500-normal.woff', 'inter/files/inter-latin-ext-500-normal.woff'],
  'Inter SemiBold': ['inter/files/inter-latin-600-normal.woff', 'inter/files/inter-latin-ext-600-normal.woff'],
};
const RANGES = [0, 256, 7680, 8192]; // Latin-1, Latin Ext-A/B (Turkish ğ ı ş İ), Latin Ext Additional, punctuation

const load = f => { const b = fs.readFileSync(path.join(FS, f)); return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };

function flatten(cmds) {
  const segs = []; let sx = 0, sy = 0, x = 0, y = 0;
  const line = (nx, ny) => { segs.push([x, y, nx, ny]); x = nx; y = ny; };
  for (const c of cmds) {
    if (c.type === 'M') { x = sx = c.x; y = sy = c.y; }
    else if (c.type === 'L') line(c.x, c.y);
    else if (c.type === 'Q') { const x0 = x, y0 = y; for (let i = 1; i <= 8; i++) { const t = i / 8, u = 1 - t; line(u * u * x0 + 2 * u * t * c.x1 + t * t * c.x, u * u * y0 + 2 * u * t * c.y1 + t * t * c.y); } }
    else if (c.type === 'C') { const x0 = x, y0 = y; for (let i = 1; i <= 10; i++) { const t = i / 10, u = 1 - t; line(u*u*u*x0 + 3*u*u*t*c.x1 + 3*u*t*t*c.x2 + t*t*t*c.x, u*u*u*y0 + 3*u*u*t*c.y1 + 3*u*t*t*c.y2 + t*t*t*c.y); } }
    else if (c.type === 'Z') { if (x !== sx || y !== sy) line(sx, sy); }
  }
  return segs;
}

function sdfGlyph(font, code) {
  const g = font.charToGlyph(String.fromCodePoint(code));
  const advance = Math.round(g.advanceWidth * SIZE / font.unitsPerEm);
  const segs = flatten(g.getPath(0, 0, SIZE).commands);
  if (!segs.length) return { id: code, width: 0, height: 0, left: 0, top: -26, advance };
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [ax, ay, bx, by] of segs) { x0 = Math.min(x0, ax, bx); x1 = Math.max(x1, ax, bx); y0 = Math.min(y0, ay, by); y1 = Math.max(y1, ay, by); }
  const left = Math.floor(x0), topY = Math.floor(y0);
  const width = Math.ceil(x1) - left, height = Math.ceil(y1) - topY;
  const W = width + 2 * BUFFER, H = height + 2 * BUFFER, bitmap = new Uint8Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const px = left - BUFFER + i + 0.5, py = topY - BUFFER + j + 0.5;
    let d2 = Infinity, wind = 0;
    for (const [ax, ay, bx, by] of segs) {
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
      const t = l2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2)) : 0;
      const ex = ax + t * dx - px, ey = ay + t * dy - py; d2 = Math.min(d2, ex * ex + ey * ey);
      if (ay <= py) { if (by > py && dx * (py - ay) - (px - ax) * dy > 0) wind++; }
      else if (by <= py && dx * (py - ay) - (px - ax) * dy < 0) wind--;
    }
    const d = Math.sqrt(d2) * (wind !== 0 ? -1 : 1);
    bitmap[j * W + i] = Math.max(0, Math.min(255, Math.round(255 - 255 * (d / RADIUS + CUTOFF))));
  }
  return { id: code, bitmap, width, height, left, top: -topY - 26, advance };
}

for (const [name, files] of Object.entries(STACKS)) {
  const fonts = files.map(load);
  const dir = path.join('public/fonts', name); fs.mkdirSync(dir, { recursive: true });
  for (const start of RANGES) {
    const end = start + 255, glyphs = [];
    for (let c = start; c <= end; c++) {
      const f = fonts.find(f => f.charToGlyphIndex(String.fromCodePoint(c)) > 0);
      if (f) glyphs.push(sdfGlyph(f, c));
    }
    const pbf = new PbfWriter();
    pbf.writeMessage(1, (_, p) => {
      p.writeStringField(1, name); p.writeStringField(2, `${start}-${end}`);
      for (const g of glyphs) p.writeMessage(3, (_, q) => {
        q.writeVarintField(1, g.id); if (g.bitmap) q.writeBytesField(2, g.bitmap);
        q.writeVarintField(3, g.width); q.writeVarintField(4, g.height);
        q.writeSVarintField(5, g.left); q.writeSVarintField(6, g.top); q.writeVarintField(7, g.advance);
      });
    });
    fs.writeFileSync(path.join(dir, `${start}-${end}.pbf`), pbf.finish());
    console.log(name, `${start}-${end}`, glyphs.length, 'glyphs');
  }
}
