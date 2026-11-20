/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
// Runs a leak corpus (tests/corpus/*.js) through the engine, twice:
// - as text: every character of a value must be inside a detection, LF and CRLF, at the levels that must mask it;
// - as a synthetic screenshot (tests/lib/mutate.js): the same, through regionsFromOcr, in a monospace and a
//   proportional font, with and without the OCR reading errors. Every value character must be under a rectangle.
// Text marked to stay visible must never be masked.
'use strict';
const { toChars, textOf, layout, MUT, HARD, checkRegions } = require('./mutate');

const LEVEL_OPTS = { secret: {}, sensitive: { sensitive: true } };
const levelsFor = (c) => c.cat === 'keep' ? ['secret', 'sensitive'] : c.level === 'secret' ? ['secret', 'sensitive'] : ['sensitive'];
const show = (chars, idx) => {   // the characters at idx, grouped in runs: "Demo!Wald72", "Blau"
  const runs = []; let cur = '', last = -2;
  idx.forEach((i) => { if (i !== last + 1 && cur) { runs.push(cur); cur = ''; } cur += chars[i].ch; last = i; });
  if (cur) runs.push(cur);
  return runs.map((r) => JSON.stringify(r)).join(', ');
};
const oneLine = (s) => JSON.stringify(s.length > 110 ? s.slice(0, 107) + '…' : s);

function runCorpus(ctx, name, corpus, known, report) {
  const failures = [], stats = {}, knownHit = new Set(), seen = new Set();
  let checks = 0;
  const tally = (c, variant, ok) => {
    const k = c.cat + '\u0000' + variant.replace(/#\d+$/, '');
    stats[k] = stats[k] || { cat: c.cat, variant: variant.replace(/#\d+$/, ''), ok: 0, n: 0, fails: [] };
    stats[k].n++; if (ok) stats[k].ok++;
    return stats[k];
  };
  const record = (c, variant, hard, res, chars, text) => {
    checks++;
    const ok = !res.missed.length && !res.masked.length, st = tally(c, variant, ok);
    if (ok) return;
    const key = variant + '|' + textOf(toChars(c));
    if (seen.has(key)) return;
    seen.add(key);
    const why = (res.missed.length ? 'value left visible: ' + show(chars, res.missed) : '') +
      (res.masked.length ? (res.missed.length ? '; ' : '') + 'look-alike masked: ' + show(chars, res.masked) : '');
    if (st.fails.length < 3) st.fails.push(oneLine(text) + ' -> ' + why);
    if (!hard) return;
    if (known[key]) { knownHit.add(key); return; }
    failures.push('corpus ' + name + ' [' + variant + '] ' + c.cat + ': ' + oneLine(text) + '\n   ' + why);
  };

  corpus.forEach((c) => {
    const levels = levelsFor(c);
    // ---- as text ----
    for (const [nlName, nl] of c.ocrOnly ? [] : [['LF', '\n'], ['CRLF', '\r\n']]) {
      const chars = toChars(c, nl), text = textOf(chars);
      for (const level of levels) {
        const dets = ctx.detect(text, c.file || 'notes.txt', LEVEL_OPTS[level]);
        const cov = new Uint8Array(text.length);
        dets.forEach((d) => { for (let i = d.start; i < d.end; i++) cov[i] = 1; });
        const res = { missed: [], masked: [] };
        chars.forEach((ch, i) => {
          if (ch.role === 'v' && !/\s/.test(ch.ch) && !cov[i]) res.missed.push(i);
          if (ch.role === 'k' && cov[i]) res.masked.push(i);
        });
        record(c, 'text ' + level + (nlName === 'CRLF' ? ' CRLF' : ''), true, res, chars, text);
      }
    }
    // ---- as a synthetic screenshot ----
    const level = levels[0], opts = LEVEL_OPTS[c.cat === 'keep' ? 'sensitive' : level];
    const base = toChars(c);
    const variants = [['clean', base]];
    Object.keys(MUT).forEach((m) => MUT[m](base).forEach((v, k) => variants.push([m + '#' + k, v])));
    variants.forEach(([vname, chars]) => {
      const mut = vname.replace(/#\d+$/, ''), hard = vname === 'clean' || HARD.has(mut);
      (hard ? ['mono', 'sans'] : ['sans']).forEach((font) => {
        const { lines, glyphs } = layout(chars, font);
        const regions = ctx.regionsFromOcr(lines, opts);
        record(c, 'ocr ' + font + ' ' + vname, hard, checkRegions(chars, glyphs, regions), chars, textOf(chars));
      });
    });
  });

  // A known miss that no longer happens must leave the list
  Object.keys(known).forEach((k) => { if (!knownHit.has(k)) failures.push('corpus ' + name + ': known miss no longer happens, remove it from the list: ' + k.slice(0, 120)); });

  const lines = [];
  if (report) {
    lines.push('', 'Coverage of corpus ' + name + ' (cases passed / tried; reading errors not marked hard are only reported):');
    const rows = Object.values(stats).sort((a, b) => a.cat.localeCompare(b.cat) || a.variant.localeCompare(b.variant));
    rows.forEach((r) => {
      const hard = /^text/.test(r.variant) || /clean$/.test(r.variant) || [...HARD].some((h) => r.variant.endsWith(h));
      lines.push('  ' + (r.ok === r.n ? 'ok  ' : 'MISS') + ' ' + r.cat.padEnd(13) + ' ' + r.variant.padEnd(36) + ' ' + String(r.ok).padStart(4) + ' / ' + r.n + (hard ? '' : '  (reported only)'));
      if (r.ok !== r.n) r.fails.forEach((f) => lines.push('         ' + f));
    });
  }
  return { failures, checks, cases: corpus.length, knownCount: Object.keys(known).length, reportLines: lines };
}

module.exports = { runCorpus };
