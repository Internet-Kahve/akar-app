#!/usr/bin/env node
/**
 * Draws the 28 site badges and the three fallbacks as game medals and writes them to `public/rozetler/<id>.webp`
 * (256 × 256, under 20 KB each). Each badge has its own shape, colours and emblem, taken from what the badge is
 * about in `docs/documents-context/eserler/<site>/icerik/gorevler.json`; no medal carries readable lettering.
 * The tier (bronze / silver / gold) is not in the picture: one badge can be earned from home and later at the site,
 * so the screen draws the tier's ring around it.
 *
 * Run from the repo root: `node apps/web/scripts/draw-badges.mjs` (uses the `sharp` that Next.js installs). With
 * `--sheet <file.png>` it also writes a contact sheet of every medal for review. A painted medal with the same file
 * name can replace any of these later (prompts: `docs/ROZET-PROMPTLARI.md`).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "rozetler");
const OL = "#2b1d14"; // outline: dark walnut ink, like the avatars' contour
const C = {
  stone: "#f1e4c3",
  stoneShade: "#d2bd8e",
  marble: "#f7f2e6",
  brick: "#b5523b",
  brickDark: "#8a3a28",
  lead: "#8193a8",
  leadLight: "#b3c4d4",
  wood: "#a0612f",
  woodDark: "#6e3c1a",
  woodLight: "#c98a4e",
  tile: "#2aa3a0",
  navy: "#1f3d6e",
  gold: "#e6b53c",
  goldDark: "#a8771a",
  water: "#62b8dc",
  waterDark: "#2f7fa6",
  green: "#4f9a5a",
  greenDark: "#2e6a3a",
  red: "#c4513c",
  pink: "#f2b7c4",
  white: "#fffaf0",
  shadowInk: "#3a2416",
};

/* --------------------------------------------------------------------------------------------- shapes */
const R = 112;
const poly = (n, r, rot = -Math.PI / 2, f = () => r) =>
  Array.from({ length: n }, (_, i) => {
    const a = rot + (i * 2 * Math.PI) / n;
    const rr = f(i, a);
    return `${(128 + rr * Math.cos(a)).toFixed(1)},${(128 + rr * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
const SHAPES = {
  medallion: `<circle cx="128" cy="128" r="${R}"/>`,
  octagon: `<polygon points="${poly(8, R + 4, -Math.PI / 2 + Math.PI / 8)}"/>`,
  hexagon: `<polygon points="${poly(6, R + 6)}"/>`,
  shield: `<path d="M128 12 L226 40 V118 C226 186 178 228 128 246 C78 228 30 186 30 118 V40 Z"/>`,
  rosette: `<polygon points="${poly(96, R, -Math.PI / 2, (i) => R - 9 + 9 * Math.cos((i * 2 * Math.PI * 12) / 96))}"/>`,
  seal: `<polygon points="${poly(32, R + 4, -Math.PI / 2, (i) => (i % 2 ? R - 10 : R + 4))}"/>`,
  arch: `<path d="M34 244 V122 Q34 44 128 12 Q222 44 222 122 V244 Z"/>`,
  lobed: `<polygon points="${poly(96, R, -Math.PI / 4, (i) => R - 7 + 7 * Math.cos((i * 2 * Math.PI * 8) / 96))}"/>`,
};

const PALETTES = {
  lapis: ["#3d6fb6", "#1b355f", "#f4e8c8", "#dcc690"],
  turquoise: ["#2fb0aa", "#135a58", "#f5ead0", "#d9c896"],
  coral: ["#d4614a", "#7a2a1e", "#f6e9cf", "#e0c896"],
  emerald: ["#46a06f", "#1d4a33", "#f4ead0", "#d7c793"],
  plum: ["#9b5689", "#4a1f43", "#f6ead2", "#dec79a"],
  ochre: ["#e09a36", "#7d4a10", "#fbefd4", "#e6cd96"],
  navy: ["#2f5996", "#132848", "#f3e7c9", "#d9c38c"],
  rose: ["#c96a88", "#6b2c44", "#f8ebd6", "#e3c89c"],
  teal: ["#2e8f8a", "#123f45", "#f2e7cc", "#d6c48f"],
  crimson: ["#b33a3a", "#5c1717", "#f6e8cc", "#dec392"],
};

/* --------------------------------------------------------------------------------------------- helpers */
const s = (w = 4) => `stroke="${OL}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const rect = (x, y, w, h, fill, sw = 4, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${s(sw)} ${extra}/>`;
/** A pointed (Ottoman) arch opening, base at `by`, springing at `sy`, peak at `py`. */
const archPath = (cx, w, by, sy, py) => {
  const x0 = cx - w / 2,
    x1 = cx + w / 2,
    k = (sy - py) * 0.55;
  return `M${x0} ${by} V${sy} C${x0} ${sy - k} ${cx - w * 0.12} ${py + 4} ${cx} ${py} C${cx + w * 0.12} ${py + 4} ${x1} ${sy - k} ${x1} ${sy} V${by} Z`;
};
const arch = (cx, w, by, sy, py, fill, sw = 4) => `<path d="${archPath(cx, w, by, sy, py)}" fill="${fill}" ${s(sw)}/>`;
/** A lead dome with its finial; `r` the radius, sitting on `by`. */
const dome = (cx, by, r, sw = 4) =>
  `<path d="M${cx - r} ${by} A${r} ${r * 0.95} 0 0 1 ${cx + r} ${by} Z" fill="url(#lead)" ${s(sw)}/>` +
  `<path d="M${cx - r * 0.55} ${by - r * 0.55} A${r * 0.7} ${r * 0.6} 0 0 1 ${cx - r * 0.05} ${by - r * 0.9}" fill="none" stroke="${C.white}" stroke-width="${Math.max(1.5, r / 7)}" stroke-linecap="round" opacity=".7"/>` +
  `<line x1="${cx}" y1="${by - r * 0.95}" x2="${cx}" y2="${by - r * 0.95 - Math.max(5, r * 0.45)}" ${s(Math.max(2, sw - 1))}/>` +
  `<circle cx="${cx}" cy="${by - r * 0.95 - Math.max(5, r * 0.45)}" r="${Math.max(1.8, r / 8)}" fill="${C.gold}" ${s(1.5)}/>`;
const minaret = (x, by, h, w = 9) =>
  `<path d="M${x - w / 2} ${by} V${by - h} H${x + w / 2} V${by} Z" fill="${C.stone}" ${s(3.5)}/>` +
  `<rect x="${x - w / 2 - 3}" y="${by - h * 0.62}" width="${w + 6}" height="4" fill="${C.stoneShade}" ${s(2.5)}/>` +
  `<path d="M${x - w / 2 - 1} ${by - h} L${x} ${by - h - w * 2.4} L${x + w / 2 + 1} ${by - h} Z" fill="url(#lead)" ${s(3.5)}/>`;
const sparkle = (x, y, r, fill = C.white, op = 0.95) =>
  `<path d="M${x} ${y - r} Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r} Z" fill="${fill}" opacity="${op}"/>`;
const tulip = (x, y, sc = 1, fill = C.red) =>
  `<g transform="translate(${x} ${y}) scale(${sc})"><path d="M0 14 V2" ${s(2.5)} fill="none"/><path d="M0 4 C-7 2 -8 -6 -6 -12 L-2 -7 L0 -14 L2 -7 L6 -12 C8 -6 7 2 0 4 Z" fill="${fill}" ${s(2.5)}/></g>`;
const star = (cx, cy, r1, r2, n, fill, sw = 3, rot = -Math.PI / 2) => {
  const pts = Array.from({ length: n * 2 }, (_, i) => {
    const a = rot + (i * Math.PI) / n,
      r = i % 2 ? r2 : r1;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
  return `<polygon points="${pts}" fill="${fill}" ${s(sw)}/>`;
};
/** Ornamental pages and covers carry a medallion and borders, never lines that read as script. */
const shemse = (cx, cy, rx, ry, fill = C.gold) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${s(2.5)}/><path d="M${cx} ${cy - ry - 5} V${cy - ry} M${cx} ${cy + ry} V${cy + ry + 5}" ${s(2.5)}/><circle cx="${cx}" cy="${cy}" r="${Math.min(rx, ry) * 0.35}" fill="${C.red}" ${s(2)}/>`;

/* --------------------------------------------------------------------------------------------- emblems */
// Every emblem is drawn around (0, 0) inside about ±60.
const E = {
  /* Alaaddin Bey Çeşmesi */
  "abc-hikaye": () =>
    rect(-46, -44, 92, 96, "url(#stone)") +
    `<path d="${archPath(0, 66, 40, -2, -38)}" fill="${C.red}" ${s(4)}/>` +
    `<path d="${archPath(0, 46, 40, 4, -24)}" fill="#7a5638" ${s(3.5)}/>` +
    [-26, -14, 14, 26].map((x) => `<line x1="${x}" y1="${x < 0 ? -8 : -8}" x2="${x * 0.72}" y2="-2" stroke="${C.white}" stroke-width="3"/>`).join("") +
    `<path d="M0 6 V12" ${s(3)}/><rect x="-5" y="10" width="10" height="5" rx="2" fill="${C.gold}" ${s(2.5)}/>` +
    `<path d="M0 15 C-2 22 2 26 0 34" stroke="${C.water}" stroke-width="5" fill="none" stroke-linecap="round"/>` +
    `<path d="M-30 34 H30 L24 48 H-24 Z" fill="${C.stoneShade}" ${s(4)}/><ellipse cx="0" cy="36" rx="22" ry="3.5" fill="${C.water}"/>`,
  "abc-sivri-kemer": () => {
    const segs = 9;
    let out = `<path d="${archPath(0, 104, 52, 6, -56)}" fill="${C.red}" ${s(5)}/>`;
    // voussoirs: alternating light and red blocks on the arch ring
    for (let i = 0; i < segs; i++) {
      if (i % 2) continue;
      const a0 = Math.PI + (i * Math.PI) / segs,
        a1 = Math.PI + ((i + 1) * Math.PI) / segs;
      const p = (a, r) => `${(r * Math.cos(a)).toFixed(1)} ${(6 + r * 1.15 * Math.sin(a)).toFixed(1)}`;
      out += `<path d="M${p(a0, 52)} L${p(a1, 52)} L${p(a1, 34)} L${p(a0, 34)} Z" fill="${C.marble}" ${s(2.5)}/>`;
    }
    out += `<path d="${archPath(0, 66, 52, 10, -32)}" fill="#6a4a30" ${s(4)}/>`;
    out += `<path d="M0 -6 C10 8 12 16 12 22 A12 12 0 0 1 -12 22 C-12 16 -10 8 0 -6 Z" fill="${C.water}" ${s(3.5)}/><path d="M-5 18 A6 6 0 0 0 -1 26" stroke="${C.white}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    return out;
  },
  /* Emir Hanı */
  "emir-hikaye": () =>
    rect(-56, -30, 112, 78, "url(#stone)") +
    `<rect x="-58" y="-36" width="116" height="8" fill="${C.brick}" ${s(3.5)}/>` +
    [-42, -26, 26, 42].map((x) => arch(x, 11, -2, -16, -24, "#6a4a30", 3)).join("") +
    [-42, -26, 26, 42].map((x) => arch(x, 11, 38, 24, 16, "#6a4a30", 3)).join("") +
    `<line x1="-56" y1="8" x2="56" y2="8" stroke="${C.brick}" stroke-width="5"/>` +
    arch(0, 30, 48, 4, -22, "#5a3a22", 4) +
    `<path d="${archPath(0, 18, 48, 14, -6)}" fill="${C.woodDark}" ${s(2.5)}/>` +
    tulip(-66, 30, 0.9) +
    tulip(66, 30, 0.9),
  "emir-tas-tugla": () => {
    let out = `<path d="${archPath(0, 120, -10, -30, -60)}" fill="none" stroke="${OL}" stroke-width="16"/><path d="${archPath(0, 120, -10, -30, -60)}" fill="none" stroke="${C.brick}" stroke-width="9"/>`;
    for (const x of [-48, 48]) {
      let y = -26;
      out += `<rect x="${x - 18}" y="-28" width="36" height="84" fill="${C.stone}" ${s(4)}/>`;
      for (let i = 0; i < 4; i++) {
        out += `<rect x="${x - 18}" y="${y}" width="36" height="12" fill="url(#stone)" ${s(2.5)}/>`;
        y += 12;
        out += `<rect x="${x - 18}" y="${y}" width="36" height="4.5" fill="${C.brick}" ${s(1.8)}/><rect x="${x - 18}" y="${y + 4.5}" width="36" height="4.5" fill="${C.brickDark}" ${s(1.8)}/>`;
        y += 9;
      }
    }
    out += `<path d="M-30 56 H30" ${s(4)}/>`;
    return out;
  },
  "emir-avlu": () => {
    let out = `<rect x="-58" y="-58" width="116" height="116" rx="6" fill="url(#stone)" ${s(4)}/>`;
    for (let i = 0; i < 5; i++) {
      const p = -46 + i * 23;
      out += `<circle cx="${p}" cy="-46" r="7" fill="url(#lead)" ${s(2.5)}/><circle cx="${p}" cy="46" r="7" fill="url(#lead)" ${s(2.5)}/>`;
      if (i > 0 && i < 4) out += `<circle cx="-46" cy="${p}" r="7" fill="url(#lead)" ${s(2.5)}/><circle cx="46" cy="${p}" r="7" fill="url(#lead)" ${s(2.5)}/>`;
    }
    out += `<rect x="-34" y="-34" width="68" height="68" fill="#cfe0b8" ${s(3)}/>`;
    out += `<polygon points="${[...Array(8)].map((_, i) => `${(26 * Math.cos(Math.PI / 8 + (i * Math.PI) / 4)).toFixed(1)},${(26 * Math.sin(Math.PI / 8 + (i * Math.PI) / 4)).toFixed(1)}`).join(" ")}" fill="${C.marble}" ${s(4)}/>`;
    out += `<circle cx="0" cy="0" r="17" fill="${C.water}" ${s(3)}/><circle cx="0" cy="0" r="5" fill="${C.marble}" ${s(2)}/>`;
    out += [0, 1, 2, 3].map((i) => `<path d="M0 -4 Q${8 * Math.cos(i * 1.57)} ${-12 + 4 * Math.sin(i * 1.57)} ${12 * Math.cos(i * 1.57)} ${10 * Math.sin(i * 1.57)}" stroke="${C.white}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`).join("");
    return out;
  },
  /* İnebey (Eyne Bey) Medresesi */
  "ebm-hikaye": () =>
    rect(-58, -6, 116, 54, "url(#stone)") +
    dome(0, -6, 30) +
    dome(-40, -6, 13) +
    dome(40, -6, 13) +
    `<line x1="-58" y1="14" x2="58" y2="14" stroke="${C.brick}" stroke-width="4"/>` +
    arch(0, 34, 48, 12, -8, "#6a4a30", 4) +
    [-40, 40].map((x) => arch(x, 14, 40, 26, 18, "#6a4a30", 3)).join(""),
  "ebm-kutuphane": () =>
    `<path d="M-46 30 L46 54 M46 30 L-46 54" ${s(7)}/><path d="M-46 30 L46 54 M46 30 L-46 54" stroke="${C.woodLight}" stroke-width="3.5" stroke-linecap="round"/>` +
    `<path d="M0 -10 C-18 -22 -40 -22 -58 -16 V30 C-40 24 -18 24 0 34 Z" fill="${C.marble}" ${s(4)}/>` +
    `<path d="M0 -10 C18 -22 40 -22 58 -16 V30 C40 24 18 24 0 34 Z" fill="${C.marble}" ${s(4)}/>` +
    `<path d="M-52 -10 C-36 -15 -18 -14 -6 -6 V24 C-18 18 -36 18 -52 22 Z" fill="none" stroke="${C.gold}" stroke-width="2.5"/>` +
    `<path d="M52 -10 C36 -15 18 -14 6 -6 V24 C18 18 36 18 52 22 Z" fill="none" stroke="${C.gold}" stroke-width="2.5"/>` +
    shemse(-28, 4, 10, 7) +
    shemse(28, 4, 10, 7) +
    `<path d="M0 34 V44" ${s(3)}/><path d="M-2 40 L-8 58 L0 52 L8 58 L2 40" fill="${C.red}" ${s(2.5)}/>` +
    sparkle(-40, -40, 8) +
    sparkle(44, -44, 6),
  /* Habib-i Neccar Camii */
  "hnc-hikaye": () =>
    rect(-46, -2, 82, 52, "url(#stone)") +
    dome(-5, -2, 32) +
    minaret(48, 50, 82, 11) +
    arch(-5, 26, 50, 24, 6, "#6a4a30", 4) +
    [-34, 24].map((x) => arch(x, 10, 34, 20, 13, "#6a4a30", 3)).join(""),
  "hnc-yasin": () =>
    `<g opacity=".9">${[...Array(12)].map((_, i) => { const a = (i * Math.PI) / 6; return `<line x1="${(30 * Math.cos(a)).toFixed(1)}" y1="${(-6 + 30 * Math.sin(a)).toFixed(1)}" x2="${(58 * Math.cos(a)).toFixed(1)}" y2="${(-6 + 58 * Math.sin(a)).toFixed(1)}" stroke="${C.gold}" stroke-width="4" stroke-linecap="round"/>`; }).join("")}</g>` +
    `<path d="M-40 40 L40 58 M40 40 L-40 58" ${s(7)}/><path d="M-40 40 L40 58 M40 40 L-40 58" stroke="${C.woodLight}" stroke-width="3.5" stroke-linecap="round"/>` +
    `<rect x="-34" y="-36" width="68" height="76" rx="4" fill="${C.greenDark}" ${s(4)}/>` +
    `<rect x="-27" y="-29" width="54" height="62" rx="2" fill="none" stroke="${C.gold}" stroke-width="2.5"/>` +
    shemse(0, 2, 15, 20) +
    [-21, 21].map((x) => [-23, 27].map((y) => `<path d="M${x} ${y} l${x < 0 ? 7 : -7} 0 M${x} ${y} l0 ${y < 0 ? 7 : -7}" stroke="${C.gold}" stroke-width="2.5" stroke-linecap="round"/>`).join("")).join(""),
  /* Karatay Medresesi */
  "kar-hikaye": () =>
    dome(16, -6, 30) +
    `<rect x="-56" y="-6" width="112" height="56" fill="url(#stone)" ${s(4)}/>` +
    `<rect x="-26" y="-50" width="52" height="100" fill="${C.marble}" ${s(4)}/>` +
    `<rect x="-20" y="-44" width="40" height="94" fill="none" stroke="${C.navy}" stroke-width="3"/>` +
    arch(0, 28, 50, 0, -30, C.tile, 3.5) +
    [...Array(4)].map((_, r) => [...Array(4 - r)].map((_, i) => `<path d="M${-9 + i * 6 + r * 3} ${-16 + r * 7} l3 -5 l3 5" fill="none" stroke="${C.white}" stroke-width="2"/>`).join("")).join("") +
    arch(0, 16, 50, 26, 14, C.woodDark, 3),
  "kar-cini": () => {
    let out = `<circle cx="0" cy="0" r="58" fill="${C.navy}" ${s(4)}/>`;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      out += star(44 * Math.cos(a), 44 * Math.sin(a), 11, 5, 8, C.white, 2.2, a);
    }
    out += star(0, 0, 40, 24, 8, C.tile, 4, -Math.PI / 2 + Math.PI / 8);
    out += star(0, 0, 22, 13, 8, C.white, 3, -Math.PI / 2 + Math.PI / 8);
    out += `<circle cx="0" cy="0" r="8" fill="${C.navy}" ${s(2.5)}/>`;
    out += `<path d="M-30 -24 Q-24 -32 -14 -34" stroke="${C.white}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`;
    return out;
  },
  /* Koza Han */
  "koza-hikaye": () =>
    rect(-58, -32, 116, 82, "url(#stone)") +
    [-44, -22, 22, 44].map((x) => arch(x, 14, -4, -18, -26, "#6a4a30", 3)).join("") +
    [-44, -22, 0, 22, 44].map((x) => arch(x, 14, 38, 24, 16, "#6a4a30", 3)).join("") +
    `<line x1="-58" y1="6" x2="58" y2="6" stroke="${C.brick}" stroke-width="5"/>` +
    `<rect x="-14" y="-12" width="28" height="18" fill="${C.marble}" ${s(3)}/>` +
    dome(0, -12, 14),
  "koza-kosk-mescit": () =>
    `<ellipse cx="0" cy="54" rx="54" ry="6" fill="${C.shadowInk}" opacity=".25"/>` +
    `<rect x="-42" y="6" width="84" height="46" fill="url(#stone)" ${s(4)}/>` +
    [-24, 0, 24].map((x) => arch(x, 18, 52, 30, 18, "#5d4630", 3.5)).join("") +
    `<rect x="-46" y="0" width="92" height="8" fill="${C.marble}" ${s(3.5)}/>` +
    `<rect x="-30" y="-26" width="60" height="28" fill="${C.marble}" ${s(4)}/>` +
    [-16, 0, 16].map((x) => arch(x, 8, -4, -14, -20, C.navy, 2.5)).join("") +
    dome(0, -26, 28) +
    sparkle(-46, -36, 7) +
    sparkle(48, -24, 5),
  "koza-on-dort-basamak": () => {
    let out = `<rect x="18" y="-58" width="38" height="44" fill="${C.marble}" ${s(4)}/>` + arch(37, 18, -14, -36, -46, C.navy, 3);
    out += `<path d="M-58 56 L18 -14 L18 56 Z" fill="${C.stoneShade}" ${s(4)}/>`;
    for (let i = 0; i < 14; i++) {
      const x = -58 + i * (76 / 14),
        y = 56 - (i + 1) * (70 / 14);
      out += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(76 / 14 + 0.6).toFixed(1)}" height="${(70 / 14 + 0.6).toFixed(1)}" fill="${i % 2 ? C.marble : "#e9e2d2"}" stroke="${OL}" stroke-width="1.6"/>`;
    }
    out += `<path d="M-58 56 L18 -14" ${s(4)} fill="none"/><path d="M-62 56 H58" ${s(4)}/>`;
    out += `<path d="M-50 44 L22 -24" stroke="${C.gold}" stroke-width="3" stroke-linecap="round"/>`;
    return out;
  },
  /* Orhan Bey Hamamı */
  "obh-hikaye": () =>
    rect(-58, 6, 116, 44, "url(#stone)") +
    dome(-28, 6, 26) +
    dome(26, 6, 22) +
    [[-40, -6], [-28, -14], [-16, -6], [16, -4], [26, -12], [36, -4]].map(([x, y]) => star(x, y, 3.6, 1.6, 6, C.white, 1.5)).join("") +
    [-36, -6, 24].map((x) => `<path d="M${x} -40 C${x - 8} -46 ${x + 8} -52 ${x} -58" stroke="${C.white}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"/>`).join("") +
    arch(0, 22, 50, 32, 18, "#6a4a30", 3.5),
  "obh-aynali": () =>
    `<rect x="-6" y="30" width="12" height="28" rx="4" fill="${C.wood}" ${s(4)}/>` +
    `<circle cx="0" cy="-6" r="46" fill="${C.gold}" ${s(5)}/>` +
    [...Array(16)].map((_, i) => { const a = (i * Math.PI) / 8; return `<circle cx="${(46 * Math.cos(a)).toFixed(1)}" cy="${(-6 + 46 * Math.sin(a)).toFixed(1)}" r="4" fill="${C.red}" ${s(1.8)}/>`; }).join("") +
    `<circle cx="0" cy="-6" r="35" fill="url(#mirror)" ${s(4)}/>` +
    `<path d="${archPath(0, 30, 22, -6, -30)}" fill="none" stroke="${C.white}" stroke-width="3" opacity=".7"/>` +
    `<path d="M-22 -26 L-6 -36 M-26 -14 L2 -32" stroke="${C.white}" stroke-width="4" stroke-linecap="round" opacity=".85"/>`,
  "obh-uc-giris": () =>
    rect(-58, -26, 116, 76, "url(#stone)") +
    `<rect x="-60" y="-34" width="120" height="10" fill="${C.brick}" ${s(3.5)}/>` +
    arch(-36, 26, 50, 8, -12, C.woodDark, 4) +
    arch(0, 32, 50, 0, -22, C.woodDark, 4) +
    arch(36, 26, 50, 8, -12, C.woodDark, 4) +
    [-36, 0, 36].map((x) => `<line x1="${x}" y1="${x ? 2 : -8}" x2="${x}" y2="50" stroke="${C.wood}" stroke-width="2.5"/>`).join("") +
    [-36, 0, 36].map((x) => `<circle cx="${x + 5}" cy="30" r="2.6" fill="${C.gold}" ${s(1.5)}/>`).join(""),
  /* Orhan Bey Camii */
  "obc-hikaye": () =>
    rect(-58, -4, 108, 54, "url(#stone)") +
    dome(-30, -4, 22) +
    dome(16, -4, 22) +
    minaret(54, 50, 84, 10) +
    `<rect x="-62" y="18" width="112" height="6" fill="${C.brick}" ${s(3)}/>` +
    [-46, -24, -2, 20, 40].map((x) => arch(x, 14, 50, 36, 28, "#6a4a30", 3)).join(""),
  "obc-alci-mihrap": () => {
    let out = `<path d="${archPath(0, 104, 58, -6, -62)}" fill="${C.marble}" ${s(5)}/>`;
    out += `<path d="${archPath(0, 78, 58, 0, -44)}" fill="#efe6d2" ${s(3.5)}/>`;
    // seven rows of muqarnas cells in the hood
    for (let r = 0; r < 7; r++) {
      const y = -32 + r * 6.2,
        half = 6 + r * 4.3,
        n = r + 1;
      for (let i = 0; i < n; i++) {
        const x = -half + (i + 0.5) * ((2 * half) / n);
        out += `<path d="M${(x - half / n).toFixed(1)} ${(y + 6).toFixed(1)} Q${x.toFixed(1)} ${(y - 2).toFixed(1)} ${(x + half / n).toFixed(1)} ${(y + 6).toFixed(1)}" fill="${r % 2 ? C.gold : "#f7efdc"}" stroke="${OL}" stroke-width="1.5"/>`;
      }
    }
    out += `<rect x="-30" y="12" width="60" height="46" fill="#d9ccb0" ${s(3)}/>`;
    out += `<g transform="translate(0 40)"><path d="M0 12 C-14 10 -18 -2 -14 -10 C-8 -4 -4 -2 0 -14 C4 -2 8 -4 14 -10 C18 -2 14 10 0 12 Z" fill="${C.gold}" ${s(2.5)}/><path d="M0 12 V-6" stroke="${C.goldDark}" stroke-width="2"/></g>`;
    return out;
  },
  "obc-ikiz-kemer": () =>
    `<rect x="-60" y="-50" width="120" height="104" rx="4" fill="url(#stone)" ${s(4)}/>` +
    arch(-24, 40, 54, 0, -38, "#5d4630", 4) +
    arch(24, 40, 54, 0, -38, "#5d4630", 4) +
    `<path d="${archPath(-24, 40, 54, 0, -38)}" fill="none" stroke="${C.brick}" stroke-width="3" transform="translate(0 -4)" opacity=".0"/>` +
    `<rect x="-5" y="2" width="10" height="52" fill="${C.marble}" ${s(3.5)}/>` +
    `<path d="M-12 -6 H12 L7 4 H-7 Z" fill="${C.gold}" ${s(3)}/>` +
    `<rect x="-9" y="50" width="18" height="6" fill="${C.marble}" ${s(3)}/>` +
    [-24, 24].map((x) => `<path d="${archPath(x, 40, 2, 0, -38)}" fill="none" stroke="${C.brick}" stroke-width="3"/>`).join(""),
  /* Orhan Gazi Türbesi */
  "ogt-nilufer": () =>
    `<ellipse cx="0" cy="34" rx="58" ry="16" fill="${C.water}" ${s(4)}/>` +
    `<path d="M-50 34 A26 10 0 1 1 -2 38 L-22 32 Z" fill="${C.green}" ${s(3.5)}/>` +
    `<path d="M14 40 A22 8 0 1 0 54 36 L34 36 Z" fill="${C.greenDark}" ${s(3)}/>` +
    [-70, -40, -14, 14, 40, 70].map((d) => `<path d="M0 22 C${d * 0.35} 14 ${d * 0.55} -10 ${d * 0.22} -34 C${d * 0.05} -14 ${-d * 0.05} 6 0 22 Z" fill="${Math.abs(d) > 50 ? C.pink : C.white}" ${s(3)}/>`).join("") +
    `<path d="M0 22 C-6 4 -6 -18 0 -42 C6 -18 6 4 0 22 Z" fill="${C.white}" ${s(3)}/>` +
    `<circle cx="0" cy="12" r="6" fill="${C.gold}" ${s(2.5)}/>`,
  "ogt-tek-kubbe": () =>
    `<path d="M-46 4 H46 V52 H-46 Z" fill="url(#stone)" ${s(4)}/>` +
    `<path d="M-40 4 L-46 -4 H46 L40 4" fill="${C.stoneShade}" ${s(3.5)}/>` +
    dome(0, -4, 40) +
    arch(0, 22, 52, 28, 14, C.woodDark, 3.5) +
    [-30, 30].map((x) => arch(x, 12, 36, 22, 14, C.navy, 3)).join("") +
    tulip(-58, 42, 1) +
    tulip(58, 42, 1),
  /* Ulucami */
  "ulu-hikaye": () => {
    let out = minaret(-56, 52, 92, 9) + minaret(56, 52, 92, 9);
    out += rect(-46, 4, 92, 48, "url(#stone)");
    for (const x of [-34, -17, 0, 17, 34]) out += dome(x, -6, 9, 3);
    for (const x of [-34, -17, 0, 17, 34]) out += dome(x, 4, 9, 3);
    out += arch(0, 22, 52, 32, 18, C.woodDark, 3.5);
    out += [-30, 30].map((x) => arch(x, 10, 38, 26, 20, "#6a4a30", 2.5)).join("");
    return out;
  },
  "ulu-kundekari": () => {
    let out = `<rect x="-56" y="-56" width="112" height="112" rx="8" fill="${C.woodDark}" ${s(4)}/>`;
    const pieces = [];
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + Math.PI / 8;
      const cx = 40 * Math.cos(a),
        cy = 40 * Math.sin(a);
      pieces.push(`<polygon points="${[0, 1, 2, 3, 4, 5].map((k) => { const b = a + (k * Math.PI) / 3; return `${(cx + 11 * Math.cos(b)).toFixed(1)},${(cy + 11 * Math.sin(b)).toFixed(1)}`; }).join(" ")}" fill="${C.woodLight}" ${s(2.5)}/>`);
    }
    out += pieces.join("");
    out += star(0, 0, 36, 22, 8, C.wood, 4, -Math.PI / 2);
    out += `<polygon points="${[...Array(8)].map((_, i) => { const a = -Math.PI / 2 + Math.PI / 8 + (i * Math.PI) / 4; return `${(20 * Math.cos(a)).toFixed(1)},${(20 * Math.sin(a)).toFixed(1)}`; }).join(" ")}" fill="${C.woodLight}" ${s(3)}/>`;
    out += star(0, 0, 10, 5, 8, C.gold, 2.5);
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 4;
      out += `<line x1="${(22 * Math.cos(a)).toFixed(1)}" y1="${(22 * Math.sin(a)).toFixed(1)}" x2="${(36 * Math.cos(a)).toFixed(1)}" y2="${(36 * Math.sin(a)).toFixed(1)}" stroke="${C.woodDark}" stroke-width="2"/>`;
    }
    for (const [x, y] of [[-48, -48], [48, -48], [-48, 48], [48, 48]]) out += star(x, y, 7, 3.5, 4, C.woodLight, 2, Math.PI / 4);
    out += `<path d="M-40 -46 L-22 -46" stroke="${C.white}" stroke-width="3" opacity=".5" stroke-linecap="round"/>`;
    return out;
  },
  "ulu-sahaflar": () =>
    `<rect x="-44" y="-58" width="88" height="116" fill="${C.marble}" ${s(4)}/>` +
    `<rect x="-36" y="-50" width="72" height="108" fill="none" stroke="${C.stoneShade}" stroke-width="4"/>` +
    arch(0, 50, 58, 0, -40, "#d9ccb0", 4) +
    [...Array(3)].map((_, r) => [...Array(3 - r)].map((_, i) => `<path d="M${-14 + i * 10 + r * 5} ${-24 + r * 8} q5 -7 10 0" fill="none" stroke="${C.goldDark}" stroke-width="2"/>`).join("")).join("") +
    arch(0, 30, 58, 16, 0, C.woodDark, 3.5) +
    `<line x1="0" y1="10" x2="0" y2="58" stroke="${C.wood}" stroke-width="2.5"/>` +
    `<g transform="translate(-58 40)">${[["#2f5996", -10, 22], [C.red, -3, 24], [C.greenDark, 4, 20]].map(([f, x, h]) => `<rect x="${x}" y="${18 - h}" width="7" height="${h}" rx="1.5" fill="${f}" ${s(2.2)}/>`).join("")}<rect x="-14" y="18" width="30" height="5" fill="${C.wood}" ${s(2.2)}/></g>` +
    `<g transform="translate(58 44) rotate(-10)"><rect x="-12" y="-4" width="24" height="8" rx="1.5" fill="${C.gold}" ${s(2.2)}/><rect x="-10" y="-12" width="22" height="8" rx="1.5" fill="${C.red}" ${s(2.2)}/></g>`,
  /* Yıldırım Bayezid Bedesteni */
  "bed-hikaye": () => {
    let out = rect(-60, 0, 120, 50, "url(#stone)");
    for (let i = 0; i < 7; i++) out += dome(-51 + i * 17, 0, 8.5, 3);
    out += `<line x1="-60" y1="16" x2="60" y2="16" stroke="${C.brick}" stroke-width="4"/>`;
    out += arch(0, 24, 50, 32, 18, C.woodDark, 3.5);
    out += [-44, -24, 24, 44].map((x) => arch(x, 9, 42, 30, 24, "#6a4a30", 2.5)).join("");
    return out;
  },
  "bed-on-dort-kubbe": () => {
    let out = `<rect x="-60" y="-34" width="120" height="68" rx="5" fill="url(#stone)" ${s(4)}/>`;
    for (let r = 0; r < 2; r++)
      for (let i = 0; i < 7; i++) {
        const x = -51 + i * 17,
          y = -15 + r * 30;
        out += `<circle cx="${x}" cy="${y}" r="7.6" fill="url(#leadTop)" ${s(2.6)}/><circle cx="${x - 2.4}" cy="${y - 2.4}" r="2.2" fill="${C.white}" opacity=".8"/>`;
      }
    out += [-34, -17, 0, 17, 34, 51, -51].slice(0, 6).map((x, i) => `<rect x="${-42.5 + i * 17 - 2.5}" y="-2.5" width="5" height="5" fill="${C.stoneShade}" ${s(1.6)}/>`).join("");
    out += sparkle(-48, -46, 8) + sparkle(50, 48, 7);
    return out;
  },
  "bed-dort-kapi": () => {
    let out = `<rect x="-56" y="-58" width="112" height="116" rx="4" fill="url(#stone)" ${s(4)}/>`;
    out += arch(0, 76, 58, -6, -50, C.woodDark, 4.5);
    out += `<path d="${archPath(0, 66, 58, -2, -42)}" fill="${C.wood}" ${s(3)}/>`;
    out += `<line x1="0" y1="-40" x2="0" y2="58" ${s(3)}/>`;
    for (let y = -14; y <= 50; y += 14) for (const x of [-24, -10, 10, 24]) out += `<circle cx="${x}" cy="${y}" r="2.4" fill="${C.gold}" ${s(1.3)}/>`;
    out += `<circle cx="-7" cy="18" r="6" fill="none" stroke="${OL}" stroke-width="5"/><circle cx="-7" cy="18" r="6" fill="none" stroke="${C.gold}" stroke-width="2.6"/>`;
    out += `<circle cx="7" cy="18" r="6" fill="none" stroke="${OL}" stroke-width="5"/><circle cx="7" cy="18" r="6" fill="none" stroke="${C.gold}" stroke-width="2.6"/>`;
    return out;
  },
  /* Fallbacks for a badge without its own picture */
  _hikaye: () =>
    `<path d="M0 -20 C-18 -32 -40 -32 -58 -26 V26 C-40 20 -18 20 0 30 Z" fill="${C.marble}" ${s(4)}/>` +
    `<path d="M0 -20 C18 -32 40 -32 58 -26 V26 C40 20 18 20 0 30 Z" fill="${C.marble}" ${s(4)}/>` +
    shemse(-28, -2, 11, 8) +
    shemse(28, -2, 11, 8) +
    `<path d="M0 30 V40" ${s(3)}/><path d="M-2 36 L-8 54 L0 48 L8 54 L2 36" fill="${C.red}" ${s(2.5)}/>` +
    tulip(-40, -46, 1.1) +
    tulip(40, -46, 1.1, C.gold),
  _gorev: () =>
    `<circle cx="0" cy="0" r="50" fill="${C.marble}" ${s(4)}/>` +
    star(0, 0, 46, 12, 4, C.navy, 3.5) +
    star(0, 0, 32, 9, 4, C.gold, 3, -Math.PI / 4) +
    `<circle cx="0" cy="0" r="7" fill="${C.red}" ${s(3)}/>`,
  _saha: () =>
    `<ellipse cx="0" cy="54" rx="26" ry="6" fill="${C.shadowInk}" opacity=".3"/>` +
    `<path d="M0 54 C-10 34 -40 10 -40 -14 A40 40 0 0 1 40 -14 C40 10 10 34 0 54 Z" fill="${C.red}" ${s(5)}/>` +
    `<circle cx="0" cy="-14" r="22" fill="${C.marble}" ${s(4)}/>` +
    tulip(0, -12, 1.3),
};

/* --------------------------------------------------------------------------------------------- the medal list */
/** id → [shape, palette]. Neighbours on the profile (same site) get different shapes and colours. */
const MEDALS = {
  "abc-hikaye": ["medallion", "teal"],
  "abc-sivri-kemer": ["arch", "coral"],
  "emir-hikaye": ["octagon", "ochre"],
  "emir-tas-tugla": ["shield", "crimson"],
  "emir-avlu": ["rosette", "emerald"],
  "ebm-hikaye": ["medallion", "navy"],
  "ebm-kutuphane": ["seal", "plum"],
  "hnc-hikaye": ["hexagon", "emerald"],
  "hnc-yasin": ["lobed", "teal"],
  "kar-hikaye": ["shield", "lapis"],
  "kar-cini": ["octagon", "turquoise"],
  "koza-hikaye": ["medallion", "ochre"],
  "koza-kosk-mescit": ["lobed", "lapis"],
  "koza-on-dort-basamak": ["hexagon", "rose"],
  "obh-hikaye": ["rosette", "coral"],
  "obh-aynali": ["medallion", "plum"],
  "obh-uc-giris": ["shield", "ochre"],
  "obc-hikaye": ["octagon", "emerald"],
  "obc-alci-mihrap": ["arch", "navy"],
  "obc-ikiz-kemer": ["seal", "crimson"],
  "ogt-nilufer": ["rosette", "rose"],
  "ogt-tek-kubbe": ["shield", "teal"],
  "ulu-hikaye": ["octagon", "emerald"],
  "ulu-kundekari": ["hexagon", "ochre"],
  "ulu-sahaflar": ["arch", "lapis"],
  "bed-hikaye": ["medallion", "crimson"],
  "bed-on-dort-kubbe": ["octagon", "navy"],
  "bed-dort-kapi": ["seal", "turquoise"],
  _hikaye: ["medallion", "ochre"],
  _gorev: ["octagon", "lapis"],
  _saha: ["shield", "emerald"],
};

function medal(id) {
  const [shape, paletteName] = MEDALS[id];
  const [base, dark, field, fieldDark] = PALETTES[paletteName];
  const body = SHAPES[shape];
  // clipPath takes shapes only (no <g>), so the scale goes on the shape itself.
  const scaled = (k) => body.replace(/^<(\w+)/, `<$1 transform="translate(128 128) scale(${k}) translate(-128 -128)"`);
  const inner = scaled(0.78);
  const emblem = E[id]();
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="256" height="256" viewBox="0 0 256 256">
<defs>
  <radialGradient id="body" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="${base}" stop-opacity="1"/><stop offset=".55" stop-color="${base}"/><stop offset="1" stop-color="${dark}"/></radialGradient>
  <radialGradient id="field" cx="42%" cy="36%" r="70%"><stop offset="0" stop-color="${field}"/><stop offset="1" stop-color="${fieldDark}"/></radialGradient>
  <linearGradient id="stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.stone}"/><stop offset="1" stop-color="${C.stoneShade}"/></linearGradient>
  <linearGradient id="lead" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.leadLight}"/><stop offset="1" stop-color="${C.lead}"/></linearGradient>
  <radialGradient id="leadTop" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="${C.leadLight}"/><stop offset="1" stop-color="${C.lead}"/></radialGradient>
  <linearGradient id="mirror" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8f4fb"/><stop offset=".5" stop-color="#9cc7de"/><stop offset="1" stop-color="#5b8fb0"/></linearGradient>
  <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <clipPath id="clip">${body}</clipPath>
  <clipPath id="clipInner">${inner}</clipPath>
</defs>
<g transform="translate(0 6)" fill="${C.shadowInk}" opacity=".28">${body}</g>
<g fill="url(#body)" stroke="${OL}" stroke-width="7" stroke-linejoin="round">${body}</g>
<g transform="translate(128 128) scale(.9) translate(-128 -128)" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3">${body}</g>
<g fill="url(#field)" stroke="${OL}" stroke-width="5" stroke-linejoin="round">${inner}</g>
<g clip-path="url(#clipInner)">
  <g transform="translate(128 134) scale(1.2)"><g transform="translate(3 5)" opacity=".22" fill="${C.shadowInk}">${emblem.replace(/fill="[^"]*"/g, `fill="${C.shadowInk}"`).replace(/stroke="[^"]*"/g, `stroke="${C.shadowInk}"`)}</g>${emblem}</g>
</g>
<g transform="translate(128 128) scale(.78) translate(-128 -128)" fill="none" stroke="${OL}" stroke-width="6.4" stroke-linejoin="round">${body}</g>
<g clip-path="url(#clip)"><ellipse cx="92" cy="40" rx="96" ry="44" fill="url(#gloss)" transform="rotate(-18 92 40)"/></g>
${sparkle(196, 54, 11)}${sparkle(214, 80, 5, "#fff", 0.8)}
</svg>`;
}

const sheetArg = process.argv.indexOf("--sheet");
await mkdir(OUT, { recursive: true });
const sizes = [];
for (const id of Object.keys(MEDALS)) {
  const svg = medal(id);
  const webp = await sharp(Buffer.from(svg)).webp({ quality: 82, alphaQuality: 90, effort: 6 }).toBuffer();
  if (webp.length >= 20_000) throw new Error(`${id}: ${webp.length} bytes, over 20 KB`);
  await writeFile(join(OUT, `${id}.webp`), webp);
  sizes.push([id, webp.length]);
}
console.log(sizes.map(([id, n]) => `${id.padEnd(24)} ${(n / 1024).toFixed(1)} KB`).join("\n"));

if (sheetArg > 0) {
  const ids = Object.keys(MEDALS),
    cols = 8,
    cell = 200;
  const rows = Math.ceil(ids.length / cols);
  const tiles = await Promise.all(
    ids.map(async (id, i) => ({
      input: await sharp(Buffer.from(medal(id))).resize(cell - 10, cell - 10).png().toBuffer(),
      left: (i % cols) * cell + 5,
      top: Math.floor(i / cols) * cell + 5,
    })),
  );
  await sharp({ create: { width: cols * cell, height: rows * cell, channels: 4, background: process.argv.includes("--dark") ? "#1d1a17" : "#f6efe2" } })
    .composite(tiles)
    .png()
    .toFile(process.argv[sheetArg + 1]);
}
