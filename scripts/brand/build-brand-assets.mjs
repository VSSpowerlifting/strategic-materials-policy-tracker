#!/usr/bin/env node
/**
 * Builds every Stratellar brand asset from two inputs: the mark geometry in `lib/brand-mark.ts` and the bundled
 * font files in `assets/fonts/`. Text is converted to outlines, so each SVG is a self-contained, editable vector
 * with no font dependency, and each PNG is rendered from that SVG at its real platform size.
 *
 *   npm run brand:build
 *
 * Outputs: `brand/` (masters, exports, social and document templates) and the copies the site serves
 * (`public/brand/`, `app/icon.png`, `app/apple-icon.png`, `app/favicon.ico`). Nothing here reads the clock or the
 * network, so a rebuild with the same inputs gives the same files.
 */
import * as fontkit from "fontkit";
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MARK, MARK_SMALL, markerBed } from "../../lib/brand-mark.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/* ── Brand constants ─────────────────────────────────────────────────────────────────────────────────────────── */

export const BRAND = {
  name: "Stratellar",
  descriptor: "Strategic Materials Intelligence",
  tagline: "Materials. Policy. Capital.",
  domain: "stratellar.com",
};

/* Mirrors `app/globals.css` and `docs/design/publication-tokens.json` (tests/brand-system.test.ts checks it). */
export const COLOR = {
  paper: "#f6f5f1",
  chalk: "#fbfaf7",
  plate: "#fdfdfb",
  elevated: "#eeece5",
  ink: "#1b1e21",
  slate: "#555b61",
  faint: "#61666c",
  rule: "#dbd8cf",
  ruleStrong: "#b5b1a5",
  malachite: "#1f5c4d",
  malachiteDeep: "#143f35",
  seam: "#0d211d",
  seamBed: "#143029",
  malachiteLight: "#7fb8a5",
  onMalachite: "#a3cfc0",
  mist: "#c4d7cf",
  tint: "#e6ede9",
  hematite: "#9a3324",
  ochre: "#9a6a12",
};

const FONT_FILES = {
  "spectral-400": "spectral-latin-400-normal.woff",
  "spectral-500": "spectral-latin-500-normal.woff",
  "spectral-400i": "spectral-latin-400-italic.woff",
  "archivo-400": "archivo-latin-400-normal.woff",
  "archivo-500": "archivo-latin-500-normal.woff",
  "archivo-600": "archivo-latin-600-normal.woff",
  "archivo-700": "archivo-latin-700-normal.woff",
  "mono-500": "jetbrains-mono-latin-500-normal.woff",
};

/* ── Small helpers ───────────────────────────────────────────────────────────────────────────────────────────── */

const r = (n) => Math.round(n * 100) / 100;
const fonts = new Map();
function font(key) {
  if (!fonts.has(key)) fonts.set(key, fontkit.openSync(join(ROOT, "assets", "fonts", FONT_FILES[key])));
  return fonts.get(key);
}

/** Outline `text` with its baseline at y = 0 and its origin at x = 0. `tracking` is in em. */
function outline(key, text, size, tracking = 0) {
  const f = font(key);
  const run = f.layout(text);
  const s = size / f.unitsPerEm;
  let x = 0;
  let d = "";
  run.glyphs.forEach((glyph, i) => {
    const pos = run.positions[i];
    d += glyph.path.scale(s, -s).translate(x + pos.xOffset * s, -pos.yOffset * s).toSVG();
    x += pos.xAdvance * s + tracking * size;
  });
  return { d, width: x - tracking * size, glyphs: run.glyphs.length, capHeight: f.capHeight * s, xHeight: f.xHeight * s };
}

/** A placed, outlined line of text. `anchor` is start, middle or end. */
function text(key, str, size, { x = 0, y = 0, fill = COLOR.ink, tracking = 0, anchor = "start" } = {}) {
  const o = outline(key, str, size, tracking);
  const dx = anchor === "middle" ? -o.width / 2 : anchor === "end" ? -o.width : 0;
  return `<path fill="${fill}" transform="translate(${r(x + dx)} ${r(y)})" d="${o.d}"/>`;
}
const widthOf = (key, str, size, tracking = 0) => outline(key, str, size, tracking).width;

/** Tracking (em) that sets `str` to exactly `target` wide. */
function trackingFor(key, str, size, target) {
  const o = outline(key, str, size, 0);
  return (target - o.width) / ((o.glyphs - 1) * size);
}

function wrap(key, str, size, max) {
  const lines = [];
  let line = "";
  for (const word of str.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (line && widthOf(key, next, size) > max) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Largest size from `sizes` at which `str` wraps into `maxLines` or fewer. */
function fit(key, str, sizes, max, maxLines, { maxHeight = Infinity, leading = 1.12 } = {}) {
  for (const size of sizes) {
    const lines = wrap(key, str, size, max);
    if (lines.length <= maxLines && lines.length * size * leading <= maxHeight) return { size, lines };
  }
  const size = sizes[sizes.length - 1];
  return { size, lines: wrap(key, str, size, max) };
}

function block(key, lines, size, { x, y, leading = 1.12, fill, anchor }) {
  return lines.map((line, i) => text(key, line, size, { x, y: y + i * size * leading, fill, anchor })).join("");
}

/** The mark (or any geometry built by `markerBed`) placed at x, y and scaled to `height`. */
function mark(geometry, { x = 0, y = 0, height, bed = COLOR.ink, marker = COLOR.malachite }) {
  const s = height / geometry.height;
  const paths = geometry.shapes.map((shape) => `<path fill="${shape.role === "marker" ? marker : bed}" d="${shape.d}"/>`).join("");
  return `<g transform="translate(${r(x)} ${r(y)}) scale(${r(s * 1000) / 1000})">${paths}</g>`;
}
const markWidth = (geometry, height) => (geometry.width * height) / geometry.height;

function svg(width, height, body, { bg, viewBox } = {}) {
  const vb = viewBox ?? `0 0 ${r(width)} ${r(height)}`;
  const ground = bg ? `<rect width="${r(width)}" height="${r(height)}" fill="${bg}"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${r(width)}" height="${r(height)}" viewBox="${vb}">${ground}${body}</svg>\n`;
}

const written = [];
function write(rel, data) {
  const path = join(ROOT, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
  written.push(rel);
}
async function png(source, rel, { width, scale = 1 } = {}) {
  let image = sharp(Buffer.from(source), { density: 72 * scale });
  if (width) image = image.resize({ width });
  write(rel, await image.png({ compressionLevel: 9 }).toBuffer());
}
async function pngBuffer(source, size) {
  return sharp(Buffer.from(source), { density: 72 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
}

/* ── Tones ───────────────────────────────────────────────────────────────────────────────────────────────────── */

const TONES = {
  colour: { bed: COLOR.ink, marker: COLOR.malachite, word: COLOR.ink, descriptor: COLOR.slate },
  ink: { bed: COLOR.ink, marker: COLOR.ink, word: COLOR.ink, descriptor: COLOR.ink },
  reversed: { bed: COLOR.paper, marker: COLOR.malachiteLight, word: COLOR.paper, descriptor: COLOR.mist },
  paper: { bed: COLOR.paper, marker: COLOR.paper, word: COLOR.paper, descriptor: COLOR.paper },
};

/* ── Logo: mark, wordmark, lockups ───────────────────────────────────────────────────────────────────────────── */

const WORD_FONT = "spectral-500";
const WORD_TRACKING = 0.004;
const DESCRIPTOR_FONT = "archivo-500";

function markOnly(geometry, tone) {
  const t = TONES[tone];
  return svg(geometry.width, geometry.height, mark(geometry, { height: geometry.height, bed: t.bed, marker: t.marker }));
}

function wordmark(tone) {
  const t = TONES[tone];
  const size = 100;
  const o = outline(WORD_FONT, BRAND.name, size, WORD_TRACKING);
  const ascent = 76; /* top of the l and t stems at this size */
  return svg(o.width, ascent + 3, text(WORD_FONT, BRAND.name, size, { y: ascent, fill: t.word, tracking: WORD_TRACKING }));
}

/** Mark and wordmark on one line. With `descriptor`, the descriptor sits under the wordmark at the same width. */
function lockupHorizontal(tone, { descriptor = false } = {}) {
  const t = TONES[tone];
  const size = 100;
  const word = outline(WORD_FONT, BRAND.name, size, WORD_TRACKING);
  if (!descriptor) {
    const h = 90;
    const mw = markWidth(MARK, h);
    const gap = 30;
    const baseline = h / 2 + word.capHeight / 2;
    const body = mark(MARK, { height: h, bed: t.bed, marker: t.marker }) +
      text(WORD_FONT, BRAND.name, size, { x: mw + gap, y: baseline, fill: t.word, tracking: WORD_TRACKING });
    return svg(mw + gap + word.width, h, body);
  }
  const dSize = 22.5;
  const dTracking = trackingFor(DESCRIPTOR_FONT, BRAND.descriptor, dSize, word.width - 2);
  const baseline = word.capHeight + 4;
  const dBaseline = baseline + 38;
  const h = dBaseline + 6;
  const markH = dBaseline - 4;
  const mw = markWidth(MARK, markH);
  const gap = 34;
  const body = mark(MARK, { y: 4, height: markH, bed: t.bed, marker: t.marker }) +
    text(WORD_FONT, BRAND.name, size, { x: mw + gap, y: baseline, fill: t.word, tracking: WORD_TRACKING }) +
    text(DESCRIPTOR_FONT, BRAND.descriptor, dSize, { x: mw + gap + 1, y: dBaseline, fill: t.descriptor, tracking: dTracking });
  return svg(mw + gap + word.width, h, body);
}

/** Mark above the wordmark, descriptor beneath, all centred. */
function lockupStacked(tone) {
  const t = TONES[tone];
  const size = 100;
  const word = outline(WORD_FONT, BRAND.name, size, WORD_TRACKING);
  const markH = 118;
  const mw = markWidth(MARK, markH);
  const w = word.width;
  const baseline = markH + 36 + word.capHeight + 6;
  const dSize = 22.5;
  const dTracking = trackingFor(DESCRIPTOR_FONT, BRAND.descriptor, dSize, w - 2);
  const dBaseline = baseline + 40;
  const body = mark(MARK, { x: (w - mw) / 2, height: markH, bed: t.bed, marker: t.marker }) +
    text(WORD_FONT, BRAND.name, size, { y: baseline, fill: t.word, tracking: WORD_TRACKING }) +
    text(DESCRIPTOR_FONT, BRAND.descriptor, dSize, { x: 1, y: dBaseline, fill: t.descriptor, tracking: dTracking });
  return svg(w, dBaseline + 6, body);
}

/** A lockup scaled to `height` and placed inside a larger composition. */
function place(source, { x, y, height }) {
  const [, w, h] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(source);
  const inner = source.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  const s = height / Number(h);
  return { el: `<g transform="translate(${r(x)} ${r(y)}) scale(${r(s * 1000) / 1000})">${inner}</g>`, width: Number(w) * s };
}

/* ── Icons ───────────────────────────────────────────────────────────────────────────────────────────────────── */

function icon(size, { geometry = MARK, ratio = 0.54, bg = COLOR.malachite, bed = COLOR.paper, marker = COLOR.onMalachite } = {}) {
  const h = size * ratio;
  const w = markWidth(geometry, h);
  return svg(size, size, mark(geometry, { x: (size - w) / 2, y: (size - h) / 2, height: h, bed, marker }), { bg });
}

function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size === 256 ? 0 : size, 0);
    entry.writeUInt8(size === 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map((image) => image.data)]);
}

/* ── Strata artwork ──────────────────────────────────────────────────────────────────────────────────────────── */

/** The mark enlarged and cropped by the frame: the brand's only illustration device. */
function strataField({ x, y, height, bed, marker }) {
  return mark(MARK, { x, y, height, bed, marker });
}

/** The same figure with the fault moved left, for a narrow strip at the edge of a card. */
function strataEdge({ x, y, height, bed, marker }) {
  const geometry = markerBed({ width: 60, beds: [16, 8, 16], marker: 1, gap: 5, throw: 13, fault: 4.5, slant: 7, faultAt: 0.3 });
  return mark(geometry, { x, y, height, bed, marker });
}

/** A wide band of beds with the same fault, for page footers and covers. */
function strataBand({ x, y, width, height, bed, marker }) {
  const unit = height / 63;
  const geometry = markerBed({
    width: width / unit,
    beds: [16, 8, 16],
    marker: 1,
    gap: 5,
    throw: 13,
    fault: 4.5,
    slant: 7,
    faultAt: 0.68,
  });
  return mark(geometry, { x, y, height, bed, marker });
}

/* ── Social cards ────────────────────────────────────────────────────────────────────────────────────────────── */

function ogDefault() {
  const W = 1200, H = 630;
  let body = strataField({ x: 650, y: -90, height: 810, bed: COLOR.seamBed, marker: COLOR.malachite });
  body += place(lockupHorizontal("reversed"), { x: 72, y: 66, height: 46 }).el;
  const tag = fit("spectral-400", BRAND.tagline, [86, 80, 74], 560, 2);
  body += block("spectral-400", tag.lines, tag.size, { x: 70, y: 330, leading: 1.1, fill: COLOR.paper });
  body += `<rect x="72" y="514" width="56" height="3" fill="${COLOR.malachiteLight}"/>`;
  body += text("archivo-500", BRAND.descriptor, 24, { x: 72, y: 566, fill: COLOR.mist, tracking: 0.01 });
  return svg(W, H, body, { bg: COLOR.seam });
}

function ogHome() {
  const W = 1200, H = 630;
  let body = strataField({ x: 700, y: -90, height: 810, bed: COLOR.elevated, marker: COLOR.mist });
  body += place(lockupHorizontal("colour"), { x: 72, y: 66, height: 46 }).el;
  const tag = fit("spectral-400", BRAND.tagline, [86, 80, 74], 600, 2);
  body += block("spectral-400", tag.lines, tag.size, { x: 70, y: 318, leading: 1.1, fill: COLOR.ink });
  const sub = wrap("archivo-400", "Policy, public finance and industrial projects across strategic-material supply chains, linked to their sources.", 24, 600);
  body += block("archivo-400", sub, 24, { x: 72, y: 498, leading: 1.42, fill: COLOR.slate });
  return svg(W, H, body, { bg: COLOR.paper });
}

/** 1200 × 630 card for one publication. */
function researchCard({ category, date, title, author }) {
  const W = 1200, H = 630;
  let body = strataEdge({ x: 912, y: -70, height: 770, bed: COLOR.elevated, marker: COLOR.mist });
  body += place(lockupHorizontal("colour"), { x: 72, y: 64, height: 40 }).el;
  body += text("archivo-600", category, 22, { x: 72, y: 214, fill: COLOR.malachite });
  if (date) body += text("archivo-400", date, 22, { x: 72 + widthOf("archivo-600", category, 22) + 22, y: 214, fill: COLOR.slate });
  const t = fit("spectral-400", title, [68, 60, 54, 48, 44, 40], 790, 4, { maxHeight: 258, leading: 1.14 });
  body += block("spectral-400", t.lines, t.size, { x: 70, y: 214 + 30 + t.size * 0.86, leading: 1.14, fill: COLOR.ink });
  body += `<rect x="72" y="528" width="800" height="1" fill="${COLOR.ruleStrong}"/>`;
  body += text("archivo-500", author, 22, { x: 72, y: 572, fill: COLOR.slate });
  body += text("archivo-500", BRAND.descriptor, 22, { x: 872, y: 572, fill: COLOR.faint, anchor: "end" });
  return svg(W, H, body, { bg: COLOR.paper });
}

/** 1200 × 1200 announcement for feeds. */
function announcement({ label, category, title, author }) {
  const W = 1200, H = 1200;
  let body = strataBand({ x: 0, y: 880, width: 1200, height: 250, bed: COLOR.seamBed, marker: COLOR.malachite });
  body += place(lockupHorizontal("reversed"), { x: 84, y: 84, height: 54 }).el;
  body += text("archivo-600", label, 28, { x: 84, y: 300, fill: COLOR.malachiteLight });
  body += text("archivo-400", category, 28, { x: 84 + widthOf("archivo-600", label, 28) + 26, y: 300, fill: COLOR.mist });
  const t = fit("spectral-400", title, [96, 88, 80, 72, 64], 1030, 5);
  body += block("spectral-400", t.lines, t.size, { x: 82, y: 300 + 50 + t.size * 0.86, leading: 1.12, fill: COLOR.paper });
  body += text("archivo-500", author, 26, { x: 84, y: 838, fill: COLOR.mist });
  return svg(W, H, body, { bg: COLOR.seam });
}

function linkedinCompanyBanner() {
  /* LinkedIn overlays the company logo on the lower-left corner. Keep that corner clear at every export size. */
  const W = 2256, H = 382;
  let body = strataEdge({ x: 1840, y: -210, height: 800, bed: COLOR.seamBed, marker: COLOR.malachite });
  body += text("spectral-400", BRAND.tagline, 92, { x: 560, y: 196, fill: COLOR.paper });
  body += text("archivo-500", `${BRAND.descriptor}`, 34, { x: 564, y: 272, fill: COLOR.malachiteLight, tracking: 0.01 });
  body += text("archivo-400", BRAND.domain, 34, { x: 564 + widthOf("archivo-500", BRAND.descriptor, 34, 0.01) + 40, y: 272, fill: COLOR.mist });
  return svg(W, H, body, { bg: COLOR.seam });
}

function linkedinPersonalBanner() {
  /* LinkedIn profile background: 1584 × 396. The profile photo covers the lower left. */
  const W = 1584, H = 396;
  let body = strataEdge({ x: 1262, y: -150, height: 700, bed: COLOR.seamBed, marker: COLOR.malachite });
  body += place(lockupHorizontal("reversed"), { x: 400, y: 86, height: 50 }).el;
  body += text("spectral-400", BRAND.tagline, 62, { x: 398, y: 246, fill: COLOR.paper });
  body += text("archivo-500", BRAND.descriptor, 24, { x: 400, y: 306, fill: COLOR.malachiteLight, tracking: 0.01 });
  return svg(W, H, body, { bg: COLOR.seam });
}

/* ── Document templates (US Letter at 150 dpi) ───────────────────────────────────────────────────────────────── */

const PAGE = { w: 1275, h: 1650, margin: 112 };

function sheetRule(y, { x = PAGE.margin, width = PAGE.w - 2 * PAGE.margin, colour = COLOR.ruleStrong } = {}) {
  return `<rect x="${x}" y="${y}" width="${width}" height="1.5" fill="${colour}"/><rect x="${x}" y="${y - 7}" width="1.5" height="15" fill="${colour}"/>`;
}

function publicationCover({ series, title, standfirst, author, date }) {
  const { w, h, margin } = PAGE;
  let body = place(lockupHorizontal("colour", { descriptor: true }), { x: margin, y: 100, height: 82 }).el;
  body += sheetRule(240);
  body += text("archivo-600", series, 27, { x: margin, y: 470, fill: COLOR.malachite });
  const t = fit("spectral-400", title, [104, 94, 84, 74], w - 2 * margin, 5);
  body += block("spectral-400", t.lines, t.size, { x: margin - 3, y: 470 + 52 + t.size * 0.86, leading: 1.1, fill: COLOR.ink });
  const afterTitle = 470 + 52 + t.size * 0.86 + (t.lines.length - 1) * t.size * 1.1;
  if (standfirst) {
    const s = wrap("spectral-400", standfirst, 34, w - 2 * margin - 120);
    body += block("spectral-400", s, 34, { x: margin, y: afterTitle + 92, leading: 1.36, fill: COLOR.slate });
  }
  body += strataBand({ x: margin, y: 1232, width: w - 2 * margin, height: 170, bed: COLOR.ink, marker: COLOR.malachite });
  body += sheetRule(1486);
  body += text("archivo-500", author, 25, { x: margin, y: 1538, fill: COLOR.ink });
  body += text("archivo-400", date, 25, { x: w - margin, y: 1538, fill: COLOR.slate, anchor: "end" });
  return svg(w, h, body, { bg: COLOR.paper });
}

function letterhead() {
  const { w, h, margin } = PAGE;
  let body = place(lockupHorizontal("colour", { descriptor: true }), { x: margin, y: 92, height: 78 }).el;
  body += text("archivo-500", BRAND.domain, 21, { x: w - margin, y: 160, fill: COLOR.slate, anchor: "end" });
  body += sheetRule(226, { colour: COLOR.rule });
  body += sheetRule(1528, { colour: COLOR.rule });
  body += mark(MARK, { x: margin, y: 1556, height: 26 });
  body += text("archivo-500", BRAND.name, 19, { x: margin + 40, y: 1576, fill: COLOR.ink });
  body += text("archivo-400", BRAND.descriptor, 19, { x: margin + 40 + widthOf("archivo-500", BRAND.name, 19) + 14, y: 1576, fill: COLOR.faint });
  body += text("archivo-400", "Page 1", 19, { x: w - margin, y: 1576, fill: COLOR.faint, anchor: "end" });
  return svg(w, h, body, { bg: COLOR.plate });
}

function documentCover({ kind, title, preparedFor, date }) {
  const { w, h, margin } = PAGE;
  let body = strataBand({ x: 0, y: 1120, width: w, height: 300, bed: COLOR.seamBed, marker: COLOR.malachite });
  body += place(lockupHorizontal("reversed", { descriptor: true }), { x: margin, y: 100, height: 82 }).el;
  body += text("archivo-600", kind, 27, { x: margin, y: 470, fill: COLOR.malachiteLight });
  const t = fit("spectral-400", title, [104, 94, 84, 74], w - 2 * margin, 4);
  body += block("spectral-400", t.lines, t.size, { x: margin - 3, y: 470 + 52 + t.size * 0.86, leading: 1.1, fill: COLOR.paper });
  body += text("archivo-500", preparedFor, 25, { x: margin, y: 1538, fill: COLOR.paper });
  body += text("archivo-400", date, 25, { x: w - margin, y: 1538, fill: COLOR.mist, anchor: "end" });
  return svg(w, h, body, { bg: COLOR.seam });
}

/* ── Review sheets ───────────────────────────────────────────────────────────────────────────────────────────── */

function conceptSheet() {
  const INK = COLOR.ink, MAL = COLOR.malachite;
  const flat = (geometry) => ({ w: geometry.width, h: geometry.height, body: mark(geometry, { height: geometry.height }) });
  const first = flat(markerBed({ width: 56, beds: [12, 5, 9], marker: 1, gap: 5, throw: 17, fault: 4.5, slant: 6 }));
  const section = (() => {
    let y = 0, body = "";
    [9, 4, 13, 5, 10].forEach((bed, i) => { body += `<rect y="${r(y)}" width="56" height="${bed}" fill="${i === 3 ? MAL : INK}"/>`; y += bed + 3.75; });
    return { w: 56, h: 56, body };
  })();
  const unconformity = (() => {
    let body = `<rect width="56" height="9" fill="${INK}"/><rect y="14" width="56" height="5" fill="${MAL}"/><clipPath id="uc"><rect y="25" width="56" height="31"/></clipPath><g clip-path="url(#uc)">`;
    for (let k = -6; k < 12; k++) body += `<path fill="${INK}" d="M${k * 13} 60L${k * 13 + 34} 20H${k * 13 + 41.5}L${k * 13 + 7.5} 60Z"/>`;
    return { w: 56, h: 56, body: `${body}</g>` };
  })();
  const fold = (() => {
    let body = "";
    [5, 11, 17].forEach((ra, i) => {
      const rb = 22 - ra, pts = [];
      for (let t = -25; t >= -270; t -= 5) pts.push([28 + ra * Math.cos((t * Math.PI) / 180), 17 + ra * Math.sin((t * Math.PI) / 180)]);
      for (let t = -90; t <= 155; t += 5) pts.push([28 + rb * Math.cos((t * Math.PI) / 180), 39 + rb * Math.sin((t * Math.PI) / 180)]);
      body += `<polyline fill="none" stroke="${i === 1 ? MAL : INK}" stroke-width="3.6" points="${pts.map((p) => `${r(p[0])},${r(p[1])}`).join(" ")}"/>`;
    });
    return { w: 56, h: 56, body };
  })();
  const star = (() => {
    const q = 6.5, pts = [[28, 0], [28 + q, 28 - q], [56, 28], [28 + q, 28 + q], [28, 56], [28 - q, 28 + q], [0, 28], [28 - q, 28 - q]];
    let body = `<clipPath id="st"><polygon points="${pts.map((p) => p.join(",")).join(" ")}"/></clipPath><g clip-path="url(#st)">`;
    for (let y = 0; y < 56; y += 7) body += `<rect y="${y}" width="56" height="4.6" fill="${y === 21 ? MAL : INK}"/>`;
    return { w: 56, h: 56, body: `${body}</g>` };
  })();
  const selected = flat(MARK);
  const concepts = [
    ["A", "Marker Bed (first drawing)", "Correlated beds thrown across a fault. The right idea, too open: it broke up below 24 px.", first],
    ["B", "Section", "A measured stratigraphic section. Solid, but any stack of bars could be anyone's.", section],
    ["C", "Unconformity", "Flat beds over tilted beds. Distinct at size; the diagonals alias in small icons.", unconformity],
    ["D", "S-fold", "Three beds folded into an S. Reads as a generic multi-line monogram.", fold],
    ["E", "Meridian", "A four-point star cut from strata. Rejected: it reads as an AI sparkle.", star],
    ["A9", "Marker Bed (selected)", "Denser beds, one marker pitch of throw. Holds from 16 px to a cover.", selected],
  ];
  const CW = 800, CH = 560;
  const word = outline(WORD_FONT, BRAND.name, 46, WORD_TRACKING);
  let body = "";
  concepts.forEach(([key, name, note, m], i) => {
    const x = (i % 3) * CW, y = Math.floor(i / 3) * CH;
    const chosen = key === "A9";
    let g = `<g transform="translate(${x} ${y})"><rect x=".5" y=".5" width="${CW - 1}" height="${CH - 1}" fill="${chosen ? COLOR.plate : COLOR.paper}" stroke="${chosen ? COLOR.malachite : COLOR.rule}" stroke-width="${chosen ? 2 : 1}"/>`;
    g += text("archivo-600", `${key}  ${name}`, 20, { x: 40, y: 56 }) + text("archivo-400", note, 14.5, { x: 40, y: 84, fill: COLOR.faint });
    g += `<g transform="translate(70 140) scale(${r(230 / Math.max(m.w, m.h))})">${m.body}</g>`;
    g += `<g transform="translate(400 190)"><g transform="scale(${r(52 / m.h)})">${m.body}</g>${text(WORD_FONT, BRAND.name, 46, { x: (m.w * 52) / m.h + 22, y: 44, tracking: WORD_TRACKING })}</g>`;
    g += `<g transform="translate(400 290)"><rect width="${r(word.width + 130)}" height="90" fill="${COLOR.seam}"/><g transform="translate(22 22) scale(${r(46 / m.h)})">${m.body.replaceAll(INK, COLOR.paper).replaceAll(MAL, COLOR.malachiteLight)}</g></g>`;
    [48, 32, 24, 16].reduce((xx, px) => {
      g += `<g transform="translate(${xx} ${430 + (48 - px)}) scale(${r(px / Math.max(m.w, m.h))})">${m.body}</g>`;
      return xx + px + 28;
    }, 400);
    body += `${g}</g>`;
  });
  return svg(CW * 3, CH * 2, body, { bg: COLOR.paper });
}

function brandOverview() {
  const W = 2400, H = 1680, M = 96;
  let body = text("archivo-600", "Stratellar brand system", 30, { x: M, y: 96 });
  body += text("archivo-400", "Mark, lockups, colour and type. Built by scripts/brand/build-brand-assets.mjs.", 22, { x: M, y: 134, fill: COLOR.faint });
  /* Lockups on the three grounds. */
  const panel = (x, y, w, h, bg, source, height) => {
    const placed = place(source, { x: 0, y: 0, height });
    return `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" fill="${bg}" stroke="${COLOR.rule}"/>${place(source, { x: (w - placed.width) / 2, y: (h - height) / 2, height }).el}</g>`;
  };
  body += panel(M, 190, 720, 330, COLOR.plate, lockupHorizontal("colour", { descriptor: true }), 96);
  body += panel(M + 744, 190, 720, 330, COLOR.seam, lockupHorizontal("reversed", { descriptor: true }), 96);
  body += panel(M + 1488, 190, 720, 330, COLOR.malachite, lockupHorizontal("paper", { descriptor: true }), 96);
  body += panel(M, 544, 472, 400, COLOR.plate, lockupStacked("colour"), 230);
  body += panel(M + 496, 544, 472, 400, COLOR.seam, lockupStacked("reversed"), 230);
  body += panel(M + 992, 544, 472, 400, COLOR.plate, lockupHorizontal("ink"), 70);
  body += panel(M + 1488, 544, 348, 400, COLOR.plate, markOnly(MARK, "colour"), 190);
  body += panel(M + 1860, 544, 348, 400, COLOR.plate, markOnly(MARK_SMALL, "colour"), 150);
  body += text("archivo-400", "Mark, 24 px and above", 18, { x: M + 1488, y: 974, fill: COLOR.faint });
  body += text("archivo-400", "Small mark, 12 to 23 px", 18, { x: M + 1860, y: 974, fill: COLOR.faint });
  /* Icons at size. */
  let ix = M;
  for (const size of [180, 96, 48, 32, 16]) {
    const geometry = size <= 16 ? MARK_SMALL : MARK;
    const source = icon(size, { geometry, ratio: size <= 16 ? 0.62 : 0.54 });
    body += `<g transform="translate(${ix} ${1020 + (180 - size)})">${source.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "")}</g>`;
    ix += size + 36;
  }
  body += text("archivo-400", "App icon and favicon: 180, 96, 48, 32, 16 px", 18, { x: M, y: 1238, fill: COLOR.faint });
  /* Colour. */
  const swatches = [
    ["Paper", COLOR.paper], ["Plate", COLOR.plate], ["Ink", COLOR.ink], ["Slate", COLOR.slate], ["Rule", COLOR.ruleStrong],
    ["Malachite", COLOR.malachite], ["Malachite deep", COLOR.malachiteDeep], ["Seam", COLOR.seam], ["Malachite light", COLOR.malachiteLight],
    ["Mist", COLOR.mist], ["Hematite", COLOR.hematite], ["Ochre", COLOR.ochre],
  ];
  swatches.forEach(([name, hex], i) => {
    const x = M + (i % 6) * 184, y = 1290 + Math.floor(i / 6) * 180;
    body += `<rect x="${x}" y="${y}" width="160" height="96" fill="${hex}" stroke="${COLOR.rule}"/>`;
    body += text("archivo-500", name, 17, { x, y: y + 122 }) + text("mono-500", hex, 15, { x, y: y + 146, fill: COLOR.faint });
  });
  /* Type. */
  const tx = M + 1240;
  body += text("spectral-400", BRAND.tagline, 66, { x: tx, y: 1090 });
  body += text("archivo-400", "Display and editorial: Spectral 300 / 400 / 500", 18, { x: tx, y: 1128, fill: COLOR.faint });
  body += text("spectral-400i", "A stated rationale is not evidence of effect.", 34, { x: tx, y: 1212, fill: COLOR.slate });
  body += text("archivo-400", "Editorial emphasis: Spectral italic", 18, { x: tx, y: 1246, fill: COLOR.faint });
  body += text("archivo-600", "Financing by instrument and status", 30, { x: tx, y: 1330 });
  body += text("archivo-400", "Loans, guarantees and equity are counted apart, in the source's own currency.", 22, { x: tx, y: 1368, fill: COLOR.slate });
  body += text("archivo-400", "Interface and reading text: Archivo 400 / 500 / 600 / 700", 18, { x: tx, y: 1402, fill: COLOR.faint });
  body += text("archivo-500", "1,250,000.00   71.0   2027–2031   10 Jan 2027", 30, { x: tx, y: 1484 });
  body += text("archivo-400", "Numerals: Archivo, tabular lining figures", 18, { x: tx, y: 1518, fill: COLOR.faint });
  body += text("mono-500", "fin-jp-jare-lynas-2023-equity", 24, { x: tx, y: 1592, fill: COLOR.slate });
  body += text("archivo-400", "Identifiers: JetBrains Mono 500", 18, { x: tx, y: 1626, fill: COLOR.faint });
  return svg(W, H, body, { bg: COLOR.paper });
}

/* ── Catalogue ───────────────────────────────────────────────────────────────────────────────────────────────── */

/* Titles, categories, dates and bylines as published on /research. */
/** Research cards an `opengraph-image` route reads from `public/brand/social/research/`. */
export const SERVED_RESEARCH_CARDS = [
  "china-export-control-suspension-extension",
  "hemerdon-financing",
  "antimony-supply-resilience",
  "tungsten-supply-security",
];

export const RESEARCH_CARDS = [
  { slug: "china-export-control-suspension-extension", category: "Policy Research", date: "November 9, 2026", author: "Benjamin Yang",
    title: "China Extends the Suspension of Six Export-Control Announcements Through January 10, 2027" },
  { slug: "escondida-copper", category: "Strategy & Finance", date: "5 November 2026 cutoff", author: "Benjamin Yang",
    title: "Goldman Sachs’ Copper Outlook and BHP’s $6 Billion Escondida Decision" },
  { slug: "hemerdon-financing", category: "Strategy & Finance", date: "5 November 2026", author: "Benjamin Yang",
    title: "Inside Tungsten West’s £71 Million Restart Financing" },
  { slug: "antimony-supply-resilience", category: "Strategy & Finance", date: "4 November 2026", author: "Benjamin Yang",
    title: "U.S. Antimony Supply Resilience, 2027–2031" },
  { slug: "tungsten-supply-security", category: "Policy Research", date: "3 November 2026", author: "Benjamin Yang",
    title: "Tungsten Supply Security" },
];

/* ── Build ───────────────────────────────────────────────────────────────────────────────────────────────────── */

async function main() {
  /* Logo masters. */
  for (const tone of Object.keys(TONES)) {
    write(`brand/logo/stratellar-mark-${tone}.svg`, markOnly(MARK, tone));
    write(`brand/logo/stratellar-mark-small-${tone}.svg`, markOnly(MARK_SMALL, tone));
    write(`brand/logo/stratellar-lockup-horizontal-${tone}.svg`, lockupHorizontal(tone));
    write(`brand/logo/stratellar-lockup-horizontal-descriptor-${tone}.svg`, lockupHorizontal(tone, { descriptor: true }));
    write(`brand/logo/stratellar-lockup-stacked-${tone}.svg`, lockupStacked(tone));
    await png(markOnly(MARK, tone), `brand/logo/png/stratellar-mark-${tone}.png`, { width: 1024 });
    await png(lockupHorizontal(tone), `brand/logo/png/stratellar-lockup-horizontal-${tone}.png`, { width: 1600 });
    await png(lockupHorizontal(tone, { descriptor: true }), `brand/logo/png/stratellar-lockup-horizontal-descriptor-${tone}.png`, { width: 1600 });
    await png(lockupStacked(tone), `brand/logo/png/stratellar-lockup-stacked-${tone}.png`, { width: 1200 });
  }
  write("brand/logo/stratellar-wordmark-ink.svg", wordmark("ink"));
  write("brand/logo/stratellar-wordmark-paper.svg", wordmark("paper"));
  await png(wordmark("ink"), "brand/logo/png/stratellar-wordmark-ink.png", { width: 1600 });
  await png(wordmark("paper"), "brand/logo/png/stratellar-wordmark-paper.png", { width: 1600 });

  /* Icons. */
  write("brand/icons/stratellar-icon.svg", icon(512));
  write("brand/icons/stratellar-icon-small.svg", icon(64, { geometry: MARK_SMALL, ratio: 0.62 }));
  for (const size of [1024, 512, 192, 180, 96, 48, 32]) await png(icon(size), `brand/icons/stratellar-icon-${size}.png`);
  await png(icon(16, { geometry: MARK_SMALL, ratio: 0.62 }), "brand/icons/stratellar-icon-16.png");
  await png(icon(512, { ratio: 0.42 }), "brand/icons/stratellar-icon-maskable-512.png");
  const favicon = ico([
    { size: 16, data: await pngBuffer(icon(16, { geometry: MARK_SMALL, ratio: 0.62 }), 16) },
    { size: 32, data: await pngBuffer(icon(32, { ratio: 0.6 }), 32) },
    { size: 48, data: await pngBuffer(icon(48, { ratio: 0.56 }), 48) },
  ]);
  write("brand/icons/favicon.ico", favicon);
  write("app/favicon.ico", favicon);
  await png(icon(512), "app/icon.png");
  await png(icon(180), "app/apple-icon.png");
  await png(icon(192), "public/brand/icon-192.png");
  await png(icon(512), "public/brand/icon-512.png");
  await png(icon(512, { ratio: 0.42 }), "public/brand/icon-maskable-512.png");
  write("public/brand/stratellar-mark.svg", markOnly(MARK, "colour"));
  write("public/brand/stratellar-lockup.svg", lockupHorizontal("colour", { descriptor: true }));
  write("public/brand/stratellar-lockup-reversed.svg", lockupHorizontal("reversed", { descriptor: true }));

  /* Social. */
  write("brand/social/og-default.svg", ogDefault());
  await png(ogDefault(), "brand/social/og-default.png");
  await png(ogDefault(), "public/brand/social/og-default.png");
  write("brand/social/og-home.svg", ogHome());
  await png(ogHome(), "brand/social/og-home.png");
  for (const card of RESEARCH_CARDS) {
    write(`brand/social/research/${card.slug}.svg`, researchCard(card));
    await png(researchCard(card), `brand/social/research/${card.slug}.png`);
    // Only cards a route serves are published. FI002 previews with the default card, so its card stays under brand/.
    if (SERVED_RESEARCH_CARDS.includes(card.slug)) {
      await png(researchCard(card), `public/brand/social/research/${card.slug}.png`);
    }
  }
  write("brand/social/linkedin-profile.svg", icon(800, { ratio: 0.46 }));
  await png(icon(800, { ratio: 0.46 }), "brand/social/linkedin-profile-800.png");
  await png(icon(400, { ratio: 0.46 }), "brand/social/linkedin-profile-400.png");
  write("brand/social/linkedin-company-banner.svg", linkedinCompanyBanner());
  await png(linkedinCompanyBanner(), "brand/social/linkedin-company-banner-2256x382.png");
  await png(linkedinCompanyBanner(), "brand/social/linkedin-company-banner-1128x191.png", { width: 1128 });
  await png(linkedinCompanyBanner(), "brand/social/linkedin-company-banner-1512x256.png", { width: 1512 });
  write("brand/social/linkedin-personal-banner.svg", linkedinPersonalBanner());
  await png(linkedinPersonalBanner(), "brand/social/linkedin-personal-banner-1584x396.png");

  /* Templates. Placeholder copy shows where each field goes and how long it may run. */
  const announcementTemplate = announcement({ label: "New research", category: "Series and number", title: "Publication title, set in Spectral on up to five lines", author: "Author name" });
  write("brand/templates/research-announcement-1200x1200.svg", announcementTemplate);
  await png(announcementTemplate, "brand/templates/research-announcement-1200x1200.png");
  const cardTemplate = researchCard({ category: "Series and number", date: "Publication date", title: "Publication title, set in Spectral on up to four lines", author: "Author name" });
  write("brand/templates/research-card-1200x630.svg", cardTemplate);
  await png(cardTemplate, "brand/templates/research-card-1200x630.png");
  const coverTemplate = publicationCover({ series: "Series and number", title: "Publication title, set in Spectral on up to five lines", standfirst: "One-sentence standfirst that states the finding, the instrument and the period it covers.", author: "Author name", date: "Publication date" });
  write("brand/templates/publication-cover-letter.svg", coverTemplate);
  await png(coverTemplate, "brand/templates/publication-cover-letter.png");
  write("brand/templates/letterhead-letter.svg", letterhead());
  await png(letterhead(), "brand/templates/letterhead-letter.png");
  const docCover = documentCover({ kind: "Document type", title: "Document title on up to four lines", preparedFor: "Prepared for: recipient", date: "Date" });
  write("brand/templates/document-cover-letter.svg", docCover);
  await png(docCover, "brand/templates/document-cover-letter.png");


  /* Review sheets. */
  write("brand/concepts/logo-concepts.svg", conceptSheet());
  await png(conceptSheet(), "brand/concepts/logo-concepts.png");
  write("brand/brand-overview.svg", brandOverview());
  await png(brandOverview(), "brand/brand-overview.png");

  console.log(`Wrote ${written.length} brand files.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
