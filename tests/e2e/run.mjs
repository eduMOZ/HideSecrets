#!/usr/bin/env node
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
// End-to-end leak tests for screenshots, in real browsers, with the page's real OCR.
//
// For each template of templates/ and each variant (scale, theme, text size, image format):
//   1. render it twice, the second time with the secrets' letters transparent: the difference is the exact ink of each secret;
//   2. drop the image on index.html (level "Secrets and sensitive data") and let it read and mask the image;
//   3. download the clean image, as a user would;
//   4. check that every secret's ink is under a mask, that each mask is really painted in the download, that reading the
//      download again finds no piece of a secret, and that the text marked to stay visible is not masked.
// The demo screenshots of examples/demo are checked the same way, their truth being the text to find in what the OCR read.
//
//   node run.mjs                      smoke: the base variant of each template and the demos, in Chromium
//   node run.mjs --full               four more variants per template
//   node run.mjs --browsers=chromium,firefox
//   node run.mjs --only=ticket        one template (or demo)
//   node run.mjs --record             also write the OCR replays of tests/replay/ (base variants, Chromium)
//   node run.mjs --dump               write every image's OCR replay to out/replay/, to study a miss
//
// Results: out/report.html, out/results.json. Accepted misses: known-misses.json on macOS, known-misses.linux.json on Linux (the run
// fails on a new miss, and on macOS also on a listed miss that no longer happens).
import { chromium, firefox } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { TEMPLATES, DEMOS, variants } from './templates.mjs';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '..', '..');
const { loadEngine } = require('../lib/engine.js');
const { ocrHash, judge } = require('../lib/replay.js');
const engine = loadEngine();

const argv = process.argv.slice(2), has = (f) => argv.includes(f);
const opt = (n, d) => { const a = argv.find((x) => x.startsWith('--' + n + '=')); return a ? a.slice(n.length + 3) : d; };
const FULL = has('--full'), RECORD = has('--record'), DUMP = has('--dump'), ONLY = opt('only', ''), BROWSERS = opt('browsers', 'chromium').split(',');
const OUT = path.join(here, 'out'), REPLAY = path.join(root, 'tests', 'replay');
// The OCR reads a page drawn by Chromium on macOS and on Linux with other misreadings, so the accepted misses are kept per system:
// known-misses.json (macOS, where the page is developed) and known-misses.linux.json (the GitHub runners, whose results repeat run after run).
const LINUX = process.platform === 'linux', KNOWN_FILE = LINUX ? 'known-misses.linux.json' : 'known-misses.json';
const KNOWN = JSON.parse(fs.readFileSync(path.join(here, KNOWN_FILE), 'utf8'));
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// ---------- A static server for the repository ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.wasm': 'application/wasm',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.gz': 'application/octet-stream' };
function serve() {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p === '/') p = '/index.html';
    if (p === '/config.local.js') p = '/config.example.js';   // the invented product of the tests, never the local settings
    const f = path.join(root, p);
    if (!f.startsWith(root + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok(srv)));
}

// ---------- In the template page ----------
// The truth: for each secret, boxes around its ink (about one per letter); the same for each text to keep.
// a: the screenshot; b: the same with the secrets' letters transparent; c: with the kept texts' letters transparent.
async function pageTruth({ a, b, c, dpr }) {
  const load = (b64) => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = 'data:image/png;base64,' + b64; });
  const imgs = await Promise.all([load(a), load(b), load(c)]);
  const W = imgs[0].naturalWidth, H = imgs[0].naturalHeight;
  const px = (img) => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, W, H).data; };
  const [da, db, dc] = imgs.map(px), shot = document.getElementById('shot').getBoundingClientRect();
  const rects = (el) => [...el.getClientRects()].filter((r) => r.width > 0 && r.height > 0).map((r) => ({
    x0: Math.max(0, Math.floor((r.left - shot.left) * dpr)), y0: Math.max(0, Math.floor((r.top - shot.top) * dpr)),
    x1: Math.min(W, Math.ceil((r.right - shot.left) * dpr)), y1: Math.min(H, Math.ceil((r.bottom - shot.top) * dpr)) }));
  // Each pixel of ink belongs to the element whose line box holds it and whose line is closest: line boxes overlap,
  // and the descenders of one line reach into the next one's box. Consecutive columns of ink make one box (about a letter).
  const inkBoxes = (els, other) => {
    const all = [];
    els.forEach((el, si) => rects(el).forEach((r) => all.push({ si, r, cy: (r.y0 + r.y1) / 2 })));
    const m = Math.ceil(2 * dpr), cols = all.map(() => new Map());
    all.forEach((A, k) => {
      const near = all.filter((B) => B !== A && B.r.x0 - m < A.r.x1 + m && B.r.x1 + m > A.r.x0 - m && B.r.y0 - m < A.r.y1 + m && B.r.y1 + m > A.r.y0 - m);
      for (let y = Math.max(0, A.r.y0 - m); y < Math.min(H, A.r.y1 + m); y++) for (let x = Math.max(0, A.r.x0 - m); x < Math.min(W, A.r.x1 + m); x++) {
        const i = (y * W + x) * 4, d = Math.max(Math.abs(da[i] - other[i]), Math.abs(da[i + 1] - other[i + 1]), Math.abs(da[i + 2] - other[i + 2]));
        if (d <= 48) continue;
        const dist = Math.abs(y - A.cy) + (x < A.r.x0 || x >= A.r.x1 ? 1000 : 0);
        if (near.some((B) => x >= B.r.x0 - m && x < B.r.x1 + m && y >= B.r.y0 - m && y < B.r.y1 + m && Math.abs(y - B.cy) + (x < B.r.x0 || x >= B.r.x1 ? 1000 : 0) < dist)) continue;
        const cc = cols[k].get(x); if (cc) { cc[0] = Math.min(cc[0], y); cc[1] = Math.max(cc[1], y + 1); } else cols[k].set(x, [y, y + 1]);
      }
    });
    const boxes = cols.map((cm) => {
      const xs = [...cm.keys()].sort((p, q) => p - q), out = [];
      xs.forEach((x) => { const cc = cm.get(x), o = out[out.length - 1]; if (o && x === o.x1) { o.x1 = x + 1; o.y0 = Math.min(o.y0, cc[0]); o.y1 = Math.max(o.y1, cc[1]); } else out.push({ x0: x, x1: x + 1, y0: cc[0], y1: cc[1] }); });
      return out;
    });
    return els.map((el, si) => [].concat(...all.map((A, k) => A.si === si ? boxes[k] : [])));
  };
  const seen = {}, id = (k, t) => { const key = k + ':' + t; seen[key] = (seen[key] || 0) + 1; return seen[key] > 1 ? key + '#' + seen[key] : key; };
  const sEls = [...document.querySelectorAll('[data-s]')], kEls = [...document.querySelectorAll('[data-k]')];
  const sBoxes = inkBoxes(sEls, db), kBoxes = inkBoxes(kEls, dc);
  const secrets = sEls.map((el, i) => { const text = el.textContent.trim(); return { id: id(el.dataset.s, text), kind: el.dataset.s, text, boxes: sBoxes[i] }; });
  const keeps = kEls.map((el, i) => { const text = el.textContent.trim(); return { id: id('keep', text), text, boxes: kBoxes[i] }; });
  return { width: W, height: H, secrets, keeps };
}
async function pageEncode({ a, type, q }) {
  const i = await new Promise((ok, ko) => { const im = new Image(); im.onload = () => ok(im); im.onerror = ko; im.src = 'data:image/png;base64,' + a; });
  const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; c.getContext('2d').drawImage(i, 0, 0);
  const blob = await new Promise((ok) => c.toBlob(ok, 'image/' + type, q));
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let s = ''; for (let k = 0; k < bytes.length; k += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(k, k + 0x8000));
  return btoa(s);
}

async function render(browser, base, t, v) {
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1200 }, deviceScaleFactor: v.scale });
  const page = await ctx.newPage();
  await page.goto(`${base}/tests/e2e/templates/${t.name}.html?theme=${v.theme}&size=${v.size}`);
  await page.evaluate(() => document.fonts.ready);
  const shot = page.locator('#shot');
  const a = await shot.screenshot({ type: 'png', animations: 'disabled' });
  await page.evaluate(() => document.body.classList.add('hide-secrets'));
  const b = await shot.screenshot({ type: 'png', animations: 'disabled' });
  await page.evaluate(() => { document.body.classList.remove('hide-secrets'); document.body.classList.add('hide-keeps'); });
  const c = await shot.screenshot({ type: 'png', animations: 'disabled' });
  await page.evaluate(() => document.body.classList.remove('hide-keeps'));
  const truth = await page.evaluate(pageTruth, { a: a.toString('base64'), b: b.toString('base64'), c: c.toString('base64'), dpr: v.scale });
  const image = v.format === 'png' ? a : Buffer.from(await page.evaluate(pageEncode, { a: a.toString('base64'), type: v.format, q: v.format === 'jpeg' && t.name === 'scan' ? 0.6 : 0.8 }), 'base64');
  await ctx.close();
  return { image, truth };
}

// ---------- In HideSecrets ----------
async function openTool(browser, base) {
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1400, height: 1000 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('hidesecrets.level', 'sensitive'); localStorage.setItem('hidesecrets.speed', 'quiet'); } catch (e) { /* none */ } });
  const page = await ctx.newPage();
  page.on('dialog', (d) => d.accept());
  await page.goto(base + '/index.html');
  // Keep what the OCR read and the rectangles computed from it (the page calls the global regionsFromOcr)
  await page.evaluate(() => {
    const orig = window.regionsFromOcr;
    window.__caps = [];
    window.regionsFromOcr = function (lines, o) { const r = orig(lines, o); window.__caps.push({ lines: JSON.parse(JSON.stringify(lines)), regions: JSON.parse(JSON.stringify(r)), sensitive: !!(o && o.sensitive) }); return r; };
  });
  return { ctx, page };
}
const MIME = { png: 'image/png', jpeg: 'image/jpeg', jpg: 'image/jpeg', webp: 'image/webp' };
async function maskImage(tool, name, buf) {
  const { page } = tool, ext = path.extname(name).slice(1).toLowerCase();
  await page.evaluate(() => { window.__caps = []; document.getElementById('clear').click(); });
  await page.setInputFiles('#file', { name, mimeType: MIME[ext], buffer: buf });
  await page.waitForFunction(() => window.__caps.length > 0 && ![...document.querySelectorAll('.frow .st')].some((e) => /reading/.test(e.textContent)), null, { timeout: 240000 });
  await page.waitForTimeout(400);   // a customer domain found late re-runs the masks once
  const cap = await page.evaluate(() => window.__caps[window.__caps.length - 1]);
  await page.evaluate(() => { const r = document.querySelector('.frow'); if (r && !r.classList.contains('cur')) r.click(); });   // the only file is shown already
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('#dl')]);
  return { cap, exported: fs.readFileSync(await dl.path()) };
}
// In the download: is each mask painted, and what does the OCR read there now?
async function inspectExport(page, exported, mime, regions) {
  return page.evaluate(async ({ b64, mime, regions }) => {
    const bin = atob(b64), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const blob = new Blob([u8], { type: mime }), url = URL.createObjectURL(blob);
    const img = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = url; });
    const W = img.naturalWidth, H = img.naturalHeight, c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, W, H).data;
    const unpainted = regions.filter((r) => r.checked).map((r) => {
      const q = window.pixelRect(r, W, H); let dark = 0;
      for (let y = q.y; y < q.y + q.h; y++) for (let xx = q.x; xx < q.x + q.w; xx++) { const i = (y * W + xx) * 4; if (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11 < 40) dark++; }
      return { r: q, share: q.w * q.h ? dark / (q.w * q.h) : 1 };
    }).filter((p) => p.share < 0.97);
    if (!window.__reocr) {
      const base = new URL('ocr/', location.href).href;
      window.__reocr = await window.Tesseract.createWorker('eng+fra+deu', 1, { workerPath: base + 'worker.min.js', corePath: base, langPath: base, gzip: true });
    }
    const res = await window.__reocr.recognize(blob, {}, { blocks: true });
    const words = [];
    (res.data.blocks || []).forEach((b) => b.paragraphs.forEach((p) => p.lines.forEach((l) => l.words.forEach((w) => words.push({ text: w.text, bbox: w.bbox })))));
    URL.revokeObjectURL(url);
    return { width: W, height: H, unpainted, words };
  }, { b64: exported.toString('base64'), mime, regions });
}

// ---------- Judging ----------
// Letters and digits only, accents and look-alikes folded: what a reader could still make out
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ß/g, 'ss')
  .replace(/[0o]/g, 'o').replace(/[1il|]/g, 'l').replace(/5/g, 's').replace(/[^a-z0-9]/g, '');
function readAgain(secret, words) {   // a piece of the secret (5 characters, or all of a shorter one) read again where the secret was
  const v = norm(secret.text), n = Math.min(5, v.length);
  if (!v) return null;
  // a word read where the secret was: on its line, and at least half of the word over the secret (not a label beside it)
  const inside = (w, b) => { const cy = (w.bbox.y0 + w.bbox.y1) / 2, ov = Math.min(w.bbox.x1, b.x1) - Math.max(w.bbox.x0, b.x0); return cy >= b.y0 - 2 && cy <= b.y1 + 2 && ov >= 0.5 * (w.bbox.x1 - w.bbox.x0); };
  const near = words.filter((w) => secret.boxes.some((b) => inside(w, b)));
  const got = norm(near.map((w) => w.text).join(''));
  for (let i = 0; i + n <= v.length; i++) if (got.includes(v.slice(i, i + n))) return near.map((w) => w.text).join(' ');
  return null;
}
async function check(tool, item) {
  const { cap, exported } = await maskImage(tool, item.file, item.image);
  const rec = { name: item.id, width: item.truth.width, height: item.truth.height, level: 'sensitive', lines: cap.lines, truth: item.truth.truth || item.truth };
  const ex = await inspectExport(tool.page, exported, MIME[path.extname(item.file).slice(1)], cap.regions);
  rec.width = rec.width || ex.width; rec.height = rec.height || ex.height;
  const { problems, truth } = judge(engine, rec, cap.regions);
  // a secret read again in the download is a leak even when the geometry looked right
  truth.secrets.forEach((s) => {
    if (!s.boxes) return;
    const again = readAgain(s, ex.words);
    if (again) { const p = problems.find((q) => q.id === s.id); if (p) p.read = again; else problems.push({ id: s.id, what: 'read again in the download', read: again }); }
  });
  ex.unpainted.forEach((u) => problems.push({ id: 'mask@' + u.r.x + ',' + u.r.y, what: 'mask not painted in the download', share: Math.round(u.share * 100) }));
  return { problems, exported, cap, rec, sensitive: cap.sensitive, regions: cap.regions.filter((r) => r.checked).length };
}

// ---------- Run ----------
const results = [];
const srv = await serve(), base = 'http://127.0.0.1:' + srv.address().port;
let failed = 0;
const knownHit = new Set();
try {
  for (const bname of BROWSERS) {
    const browser = await ({ chromium, firefox })[bname].launch();
    const items = [];
    for (const t of TEMPLATES.filter((x) => !ONLY || x.name === ONLY)) for (const v of variants(t, FULL)) items.push({ kind: 'template', t, v, id: t.name + '/' + v.name });
    for (const d of DEMOS.filter((x) => !ONLY || x.name === ONLY)) items.push({ kind: 'demo', d, id: d.name + '/original' });
    for (const it of items) {
      const t0 = Date.now();
      // a fresh page for each image: the OCR keeps some state from one image to the next, and a result must not depend on the order
      const tool = await openTool(browser, base);
      try {
        if (it.kind === 'template') {
          const r = await render(browser, base, it.t, it.v);
          it.image = r.image; it.truth = r.truth; it.file = it.t.name + '.' + (it.v.format === 'jpeg' ? 'jpg' : it.v.format);
        } else {
          it.image = fs.readFileSync(path.join(root, it.d.file)); it.file = path.basename(it.d.file);
          it.truth = { truth: { secretStrings: it.d.secretStrings, keepStrings: it.d.keepStrings } };
        }
        const res = await check(tool, it);
        if (!res.sensitive) res.problems.push({ id: 'level', what: 'the page did not mask at the sensitive level' });
        const fresh = res.problems.filter((p) => { const key = it.id + '|' + p.id; if (KNOWN[key]) { knownHit.add(key); return false; } return true; });
        failed += fresh.length;
        const safe = it.id.replace(/[^A-Za-z0-9._-]+/g, '_') + '.' + bname;
        fs.writeFileSync(path.join(OUT, safe + '.orig.' + path.extname(it.file).slice(1)), it.image);
        fs.writeFileSync(path.join(OUT, safe + '.clean.' + path.extname(it.file).slice(1)), res.exported);
        results.push({ browser: bname, id: it.id, file: safe, secrets: (res.rec.truth.secrets || res.rec.truth.secretStrings).length, regions: res.regions, problems: res.problems, fresh: fresh.length, ms: Date.now() - t0 });
        console.log((fresh.length ? 'LEAK      ' : 'ok        ') + (bname + ' ' + it.id).padEnd(56) + ' ' + res.problems.length + ' problem(s), ' + fresh.length + ' new, ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
        fresh.forEach((p) => console.log('   ' + p.id + ': ' + p.what + (p.px ? ' (' + p.px + ' px of ' + p.area + ')' : '') + (p.share !== undefined ? ' (' + p.share + '%)' : '') + (p.read ? ' — read: ' + JSON.stringify(p.read) : '')));
        if (DUMP) {   // every image's OCR words and truth, to study a miss with tests/lib/replay.js (not checked in)
          fs.mkdirSync(path.join(OUT, 'replay'), { recursive: true });
          fs.writeFileSync(path.join(OUT, 'replay', safe + '.json'), JSON.stringify({ name: it.id, browser: bname, ocr: ocrHash(root), width: res.rec.width, height: res.rec.height, level: 'sensitive', lines: res.cap.lines, truth: res.rec.truth }) + '\n');
        }
        if (RECORD && bname === 'chromium' && (it.kind === 'demo' || it.v.name === variants(it.t, false)[0].name)) {
          fs.mkdirSync(REPLAY, { recursive: true });
          const out = { name: it.id, browser: bname, ocr: ocrHash(root), width: res.rec.width, height: res.rec.height, level: 'sensitive', lines: res.cap.lines, truth: res.rec.truth };
          fs.writeFileSync(path.join(REPLAY, it.id.replace(/\//g, '__') + '.json'), JSON.stringify(out) + '\n');
        }
      } catch (e) {
        failed++;
        results.push({ browser: bname, id: it.id, error: String(e && e.stack || e) });
        console.log('ERROR     ' + (bname + ' ' + it.id).padEnd(56) + ' ' + (e && e.message || e));
      } finally { await tool.ctx.close(); }
    }
    await browser.close();
  }
} finally { srv.close(); }

// A listed miss that no longer happens must leave the list (only when its template ran in every browser of the list)
const ran = new Set(results.map((r) => r.id));
Object.keys(KNOWN).filter((k) => !k.startsWith('_')).forEach((k) => {
  const [id] = k.split('|');
  if (ran.has(id) && !knownHit.has(k)) {
    // On Linux a change to the page may fix a miss that no run on a Linux machine has seen yet: the list is only a note to shrink then
    if (LINUX) console.log('fixed     ' + k + ' no longer happens: remove it from ' + KNOWN_FILE);
    else { failed++; console.log('FIXED     ' + k + ' no longer happens: remove it from ' + KNOWN_FILE); }
  }
});

// ---------- Report ----------
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const rows = results.map((r) => {
  const ext = r.file ? fs.readdirSync(OUT).find((n) => n.startsWith(r.file + '.clean.')) : null;
  const probs = r.error ? '<pre>' + esc(r.error) + '</pre>' : (r.problems.length ? '<ul>' + r.problems.map((p) => '<li' + (KNOWN[r.id + '|' + p.id] ? ' class="known"' : '') + '><b>' + esc(p.id) + '</b>: ' + esc(p.what) +
    (p.px ? ' (' + p.px + ' px)' : '') + (p.read ? ' — read again: <code>' + esc(p.read) + '</code>' : '') + (KNOWN[r.id + '|' + p.id] ? ' <i>(known: ' + esc(KNOWN[r.id + '|' + p.id]) + ')</i>' : '') + '</li>').join('') + '</ul>' : 'no problem');
  return '<section class="' + (r.error || r.fresh ? 'bad' : 'good') + '"><h2>' + esc(r.browser + ' · ' + r.id) + '</h2><p>' + (r.secrets || 0) + ' secrets, ' + (r.regions || 0) + ' masks' + (r.ms ? ', ' + (r.ms / 1000).toFixed(1) + ' s' : '') + '</p>' + probs +
    (ext ? '<img src="' + esc(ext) + '" alt="">' : '') + '</section>';
}).join('\n');
fs.writeFileSync(path.join(OUT, 'report.html'), '<!doctype html><meta charset="utf-8"><title>Screenshot leak report</title><style>body{font:14px system-ui,sans-serif;margin:16px;background:#fff;color:#111}' +
  'section{border:1px solid #ccc;border-radius:8px;padding:8px 12px;margin:12px 0}.bad{border-color:#c00}.good h2{color:#060}.bad h2{color:#c00}h2{font-size:16px;margin:4px 0}' +
  'img{max-width:100%;border:1px solid #ddd}.known{color:#777}code{background:#f3f3f3;padding:0 4px}</style><h1>Screenshot leak report</h1><p>' +
  results.length + ' images, ' + failed + ' new problem(s).</p>' + rows);
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 1));
console.log('\n' + results.length + ' image(s), ' + failed + ' new problem(s). Report: ' + path.relative(process.cwd(), path.join(OUT, 'report.html')));
process.exit(failed ? 1 : 0);
