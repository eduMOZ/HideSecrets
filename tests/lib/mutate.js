/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
// Synthetic OCR: lays a corpus case out as the words and boxes an OCR engine would return, with the reading
// errors seen on real screenshots, so that the whole image path (gluing words, detection, rectangles) can be
// checked in Node without a browser.
//
// A case becomes a list of characters, each with a role: "v" (value to mask), "k" (text to keep), "t" (other).
// A split marker { split: px } ends a word without a space character: the OCR saw a gap that is not a space,
// or Tesseract's boxes of two words almost touch.
'use strict';

function toChars(c, nl) {
  const out = [];
  c.parts.forEach((p, pi) => {
    const s = typeof p === 'string' ? p : (p.v !== undefined ? p.v : p.k), role = typeof p === 'string' ? 't' : (p.v !== undefined ? 'v' : 'k');
    for (const ch of s) {
      if (ch === '\n' && nl) { for (const x of nl) out.push({ ch: x, role: 't', part: pi }); continue; }
      out.push({ ch, role, part: pi });
    }
  });
  return out;
}
const textOf = (chars) => chars.map((x) => x.split !== undefined ? '' : x.ch).join('');

// ---------- Fonts: advance widths in em ----------
const SANS = (() => {
  const w = {}, set = (chars, v) => { for (const ch of chars) w[ch] = v; };
  set("il|!.,:;'", 0.28); set('jftrI/()[]{}-"`', 0.34); set('sczxyvkJ*', 0.5);
  set('abdeghnopqu?_$#+=<>~^0123456789äöüé', 0.556); set('ABEFKPSTVXYZLÄÖÜ', 0.667);
  set('CDGHNOQRU&ß', 0.722); set('mMw', 0.833); set('%W', 0.9); set('@', 1.0); set(' ', 0.278);
  return (ch) => w[ch] || 0.6;
})();
const MONO = () => 0.6;
const FONTS = { sans: SANS, mono: MONO };
const PX = 20, LINE = 30;

// Lays the characters out; returns the OCR lines (words with boxes and per-character boxes) and each character's box
function layout(chars, fontName, opts) {
  const adv = (ch) => FONTS[fontName](ch) * PX, withSyms = !opts || opts.syms !== false;
  const lines = [[]], glyphs = new Array(chars.length);
  let x = 10, li = 0, word = null;
  const y0 = () => 10 + li * LINE, endWord = () => {
    if (word && word.syms.length) {
      const b = { x0: word.syms[0][0], x1: word.syms[word.syms.length - 1][1], y0: y0(), y1: y0() + PX };
      const w = { text: word.text, bbox: b, conf: 90 };
      if (withSyms) w.syms = word.syms.map((s) => [s[0], s[1]]);
      lines[li].push(w);
    }
    word = null;
  };
  chars.forEach((c, i) => {
    if (c.split !== undefined) { endWord(); x += c.split; return; }
    if (c.ch === '\n') { endWord(); lines.push([]); li++; x = 10; return; }
    if (c.ch === '\r') return;
    if (c.ch === ' ' || c.ch === '\t') { endWord(); x += adv(' ') * (c.ch === '\t' ? 4 : 1); return; }
    const a = adv(c.ch), s = [x + 0.08 * a, x + 0.92 * a];
    if (!word) word = { text: '', syms: [] };
    word.text += c.ch; word.syms.push(s);
    glyphs[i] = { li, x0: s[0], x1: s[1], y0: y0(), y1: y0() + PX };
    x += a;
  });
  endWord();
  return { lines: lines.filter((l, i) => l.length || i < lines.length - 1), glyphs };
}

// ---------- Reading errors ----------
const MUT = {
  // OCR splits "postgresql://…" into "postgresql" and "://…" with a gap of most of a character
  'split before ://': (chars) => {
    const out = [];
    chars.forEach((c, i) => {
      if (c.ch === ':' && chars[i + 1] && chars[i + 1].ch === '/' && chars[i + 2] && chars[i + 2].ch === '/') out.push({ split: 0.8 * 0.6 * PX });
      out.push(c);
    });
    return out.length > chars.length ? [out] : [];
  },
  // Tesseract's boxes of two words almost touch (1 px), so the gap looks smaller than a space: one variant per space
  'tight gap': (chars) => chars.map((c, i) => c.ch === ' ' ? i : -1).filter((i) => i >= 0).slice(0, 8)
    .map((i) => chars.map((c, j) => j === i ? { split: 1 } : c)),
  // The sharp s read as B
  'ß read as B': (chars) => chars.some((c) => c.ch === 'ß') ? [chars.map((c) => c.ch === 'ß' ? Object.assign({}, c, { ch: 'B' }) : c)] : [],
  // "_" read as a gap inside a value
  '_ read as gap': (chars) => chars.some((c) => c.ch === '_' && c.role === 'v') ? [chars.flatMap((c) => c.ch === '_' && c.role === 'v' ? [{ split: 0.5 * 0.556 * PX }] : [c])] : [],
  // A space where there is none, before a punctuation sign inside a value
  'space before punctuation': (chars) => {
    const i = chars.findIndex((c, k) => k > 0 && c.role === 'v' && chars[k - 1].role === 'v' && /[@.:=_#!%]/.test(c.ch));
    return i < 0 ? [] : [chars.slice(0, i).concat([{ ch: ' ', role: 't' }], chars.slice(i))];
  },
  // Look-alike characters inside a value
  'look-alikes': (chars) => {
    const map = { O: '0', 0: 'O', l: '1', 1: 'l', I: 'l', S: '5' };
    const i = chars.findIndex((c) => c.role === 'v' && map[c.ch]);
    return i < 0 ? [] : [chars.map((c, k) => k === i ? Object.assign({}, c, { ch: map[c.ch] }) : c)];
  },
  // Umlauts lost (ü read as u, ö as é)
  'umlauts lost': (chars) => chars.some((c) => /[äöü]/.test(c.ch)) ? [chars.map((c) => /[äöü]/.test(c.ch) ? Object.assign({}, c, { ch: { ä: 'a', ö: 'é', ü: 'u' }[c.ch] }) : c)] : [],
  // Two words read as one (Tesseract missed the space): one variant per space before the first value
  'words merged': (chars) => {
    const first = chars.findIndex((c) => c.role === 'v');
    return chars.map((c, i) => c.ch === ' ' && i < first ? i : -1).filter((i) => i >= 0).slice(-2).map((i) => chars.filter((c, j) => j !== i));
  },
  // A page with columns: the value is read on the line after its label
  'value on next line': (chars) => {
    const i = chars.findIndex((c) => c.role === 'v');
    if (i <= 0 || chars[i - 1].ch !== ' ') return [];
    return [chars.slice(0, i - 1).concat([{ ch: '\n', role: 't' }], chars.slice(i))];
  }
};
// The errors the engine must survive (hard failures); the others are only reported
const HARD = new Set(['split before ://', 'tight gap', 'ß read as B']);

// Which value characters stay uncovered, and which kept characters get covered, once regionsFromOcr has run
function checkRegions(chars, glyphs, regions) {
  const covers = (g, r) => r.y <= g.y0 + 1 && r.y + r.h >= g.y1 - 1 && r.x <= g.x0 + 0.01 && r.x + r.w >= g.x1 - 0.01;
  const touches = (g, r) => r.y < g.y1 && r.y + r.h > g.y0 && Math.min(r.x + r.w, g.x1) - Math.max(r.x, g.x0) > 0.3 * (g.x1 - g.x0);
  const missed = [], masked = [];
  chars.forEach((c, i) => {
    const g = glyphs[i];
    if (!g || c.split !== undefined) return;
    if (c.role === 'v' && !regions.some((r) => covers(g, r))) missed.push(i);
    if (c.role === 'k' && regions.some((r) => touches(g, r))) masked.push(i);
  });
  return { missed, masked };
}

module.exports = { toChars, textOf, layout, MUT, HARD, checkRegions };
