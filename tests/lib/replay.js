/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
// OCR replay: what the OCR read on a screenshot (words, boxes, per-character boxes), recorded once by tests/e2e, and the
// truth about that screenshot (where each secret's ink is, which text must stay visible). Running regionsFromOcr on the
// recorded words checks the whole image path after OCR, in Node, without a browser.
//
// A record (tests/replay/*.json):
//   { name, width, height, level: 'sensitive' | 'secret', ocr: '<hash of ocr/>', lines: [[{ text, bbox, syms }]],
//     truth: { secrets: [{ id, kind, text, boxes: [{x0, y0, x1, y1}] }], keeps: [{ id, text, boxes }] }
//          or { secretStrings: ['…'], keepStrings: ['…'] }   (a screenshot made by hand: found in the OCR text) }
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Hash of the OCR engine and its language data: a record made with another OCR may read differently
function ocrHash(root) {
  const dir = path.join(root, 'ocr'), h = crypto.createHash('sha256');
  fs.readdirSync(dir).filter((n) => /\.(js|wasm|gz)$/.test(n)).sort().forEach((n) => { h.update(n); h.update(fs.readFileSync(path.join(dir, n))); });
  return h.digest('hex').slice(0, 12);
}

// Pixels of a box that no rectangle covers (the box shrunk by 1 px: anti-aliasing at its edge)
function uncovered(box, rects) {
  const b = { x0: box.x0 + 1, y0: box.y0 + 1, x1: box.x1 - 1, y1: box.y1 - 1 };
  if (b.x1 <= b.x0 || b.y1 <= b.y0) return 0;
  let n = 0;
  for (let y = b.y0; y < b.y1; y++) {
    const iv = rects.filter((r) => r.y <= y && y < r.y + r.h).map((r) => [r.x, r.x + r.w]).sort((p, q) => p[0] - q[0]);
    let x = b.x0;
    for (const [a, z] of iv) {
      if (a > x) n += Math.max(0, Math.min(a, b.x1) - x);
      x = Math.max(x, z);
      if (x >= b.x1) break;
    }
    if (x < b.x1) n += b.x1 - x;
  }
  return n;
}
// Share of a box under the rectangles
function coveredShare(box, rects) {
  const area = (box.x1 - box.x0) * (box.y1 - box.y0);
  return area > 0 ? 1 - uncovered({ x0: box.x0 - 1, y0: box.y0 - 1, x1: box.x1 + 1, y1: box.y1 + 1 }, rects) / area : 0;
}

// Where a string sits in the OCR words (spaces ignored, as the OCR may add or drop them): one box per line and per
// occurrence, from the OCR's box of each character. null when the OCR did not read it.
// One character as the OCR may read it: any case, no accent, look-alikes merged (0 O @, 1 l I |). Keeps the length.
function canon(ch) {
  const c = ch.normalize('NFD')[0].toLowerCase();
  return '0o@'.includes(c) ? '0' : '1li|'.includes(c) ? '1' : c;
}
function stringBoxes(ctx, lines, str) {
  const needle = [...str.replace(/\s+/g, '')].map(canon).join('');
  for (const tight of [true, false]) {
    const t = ctx.ocrText(lines, tight), text = ctx.fixSharpS(t.text);
    let compact = '';
    const map = [], boxes = [];
    for (let i = 0; i < text.length; i++) if (!/\s/.test(text[i])) { compact += canon(text[i]); map.push(i); }
    for (let k = compact.indexOf(needle); k >= 0 && needle; k = compact.indexOf(needle, k + needle.length)) {
      const byLine = {};
      map.slice(k, k + needle.length).forEach((i) => {
        const sp = t.spans.find((s) => s.s <= i && i < s.e);
        if (!sp) return;
        const j = i - sp.s, cw = (sp.b.x1 - sp.b.x0) / (sp.e - sp.s);
        const x = sp.sy ? sp.sy[j] : [sp.b.x0 + cw * j, sp.b.x0 + cw * (j + 1)];
        const L = byLine[sp.line] || (byLine[sp.line] = { x0: x[0], x1: x[1], y0: sp.b.y0, y1: sp.b.y1 });
        L.x0 = Math.min(L.x0, x[0]); L.x1 = Math.max(L.x1, x[1]); L.y0 = Math.min(L.y0, sp.b.y0); L.y1 = Math.max(L.y1, sp.b.y1);
      });
      Object.values(byLine).forEach((L) => boxes.push({ x0: Math.floor(L.x0), y0: Math.floor(L.y0), x1: Math.ceil(L.x1), y1: Math.ceil(L.y1) }));
    }
    if (boxes.length) return boxes;
  }
  return null;
}

// The truth of a record as boxes: { secrets: [{ id, boxes }], keeps: [{ id, boxes }] }
function truthBoxes(ctx, rec) {
  if (rec.truth.secrets) return rec.truth;
  const as = (s, pre) => ({ id: pre + s, text: s, boxes: stringBoxes(ctx, rec.lines, s) });
  return { secrets: rec.truth.secretStrings.map((s) => as(s, 'string:')), keeps: (rec.truth.keepStrings || []).map((s) => as(s, 'keep:')) };
}

// The masks the page draws for these OCR words, as whole-pixel rectangles
function maskRects(ctx, rec, regions) {
  const rs = regions || ctx.regionsFromOcr(rec.lines, { sensitive: rec.level === 'sensitive' });
  return rs.filter((r) => r.checked).map((r) => ctx.pixelRect(r, rec.width || 1e6, rec.height || 1e6));
}

// What is wrong: secrets left (partly) visible, text to keep that got masked, truth the OCR did not read
function judge(ctx, rec, regions) {
  const rects = maskRects(ctx, rec, regions), truth = truthBoxes(ctx, rec), problems = [];
  truth.secrets.forEach((s) => {
    if (!s.boxes) { problems.push({ id: s.id, what: 'not read by the OCR' }); return; }
    // a letter counts as visible when more than 12% of its box is left uncovered (a one-pixel sliver of an edge reads as nothing)
    const vis = s.boxes.filter((b) => uncovered(b, rects) > 0.12 * (b.x1 - b.x0) * (b.y1 - b.y0));
    if (vis.length) problems.push({ id: s.id, what: 'visible', px: vis.reduce((n, b) => n + uncovered(b, rects), 0), area: s.boxes.reduce((n, b) => n + (b.x1 - b.x0) * (b.y1 - b.y0), 0) });
  });
  (truth.keeps || []).forEach((k) => {
    if (!k.boxes) return;
    const share = Math.max(...k.boxes.map((b) => coveredShare(b, rects)));
    if (share > 0.1) problems.push({ id: k.id, what: 'masked look-alike', share: Math.round(share * 100) });
  });
  return { problems, rects, truth };
}

module.exports = { ocrHash, uncovered, coveredShare, stringBoxes, truthBoxes, maskRects, judge };
