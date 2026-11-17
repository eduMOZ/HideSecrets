#!/usr/bin/env node
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
// Checks that the detection engine gives the expected results on the examples.
//
//   node tests/verify.js            compare each example, at both levels, with its expected result
//   node tests/verify.js --update   regenerate the expected results (review them before committing)
//
// The engine is read straight from index.html, so the tests run exactly the code of the page.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const engine = html.match(/<script id="engine">([\s\S]*?)<\/script>/);
if (!engine) { console.error('Engine not found in index.html'); process.exit(2); }
const ctx = {};
vm.createContext(ctx);
// The tests use the example product settings (an invented product), as config.local.js would in the page
vm.runInContext(fs.readFileSync(path.join(root, 'config.example.js'), 'utf8'), ctx);
// The archive reader needs a few browser APIs, which Node provides as globals
Object.assign(ctx, { Blob, DecompressionStream, TextDecoder, atob });
vm.runInContext(engine[1] + ';this.detect = detect; this.sanitize = sanitize; this.readArchive = readArchive;', ctx);

const update = process.argv.includes('--update');
const examplesDir = path.join(root, 'examples');
const expectedDir = path.join(__dirname, 'expected');
// "private" = the sensitive level with the Private IP option on; it is only checked on the examples that need it
const LEVELS = { secret: {}, sensitive: { sensitive: true }, private: { sensitive: true, privateIps: true } };
const PRIVATE_EXAMPLES = new Set(['network-private.txt']);
let mismatches = 0;

// Every text file under examples/, folders included (examples/demo/); images are for the OCR, checked by hand
function walk(dir, rel) {
  return fs.readdirSync(dir, { withFileTypes: true }).sort((x, y) => x.name.localeCompare(y.name))
    .flatMap((e) => e.isDirectory() ? walk(path.join(dir, e.name), rel + e.name + '/') : [rel + e.name]);
}
const SKIP = /\.(png|jpe?g|webp|gif|bmp)$|(^|\/)README\.md$/i;
for (const rel of walk(examplesDir, '').filter((n) => !SKIP.test(n))) {
  const name = path.basename(rel), flat = rel.replace(/\//g, '__');   // expected results are kept flat: demo__app-events.json.secret.txt
  const text = fs.readFileSync(path.join(examplesDir, rel), 'utf8');
  for (const level of Object.keys(LEVELS).filter((l) => l !== 'private' || PRIVATE_EXAMPLES.has(name))) {
    const actual = ctx.sanitize(text, ctx.detect(text, name, LEVELS[level]));
    const file = path.join(expectedDir, flat + '.' + level + '.txt');
    const label = (flat + ' (' + level + ')').padEnd(42);
    if (update) {
      fs.mkdirSync(expectedDir, { recursive: true });
      fs.writeFileSync(file, actual);
      console.log('written   ' + label);
      continue;
    }
    if (!fs.existsSync(file)) { console.log('MISSING   ' + label); mismatches++; continue; }
    const expected = fs.readFileSync(file, 'utf8');
    if (expected === actual) { console.log('ok        ' + label); continue; }
    mismatches++;
    const e = expected.split('\n'), a = actual.split('\n');
    const i = e.findIndex(function (line, k) { return line !== a[k]; });
    const n = i < 0 ? e.length : i;
    console.log('MISMATCH  ' + label + ' line ' + (n + 1));
    console.log('   expected: ' + (e[n] === undefined ? '(end of file)' : e[n]));
    console.log('   actual:   ' + (a[n] === undefined ? '(end of file)' : a[n]));
  }
}

// ---------- Archives: built in memory, then read back by the engine ----------
const zlib = require('zlib');
function crc32(b) { return zlib.crc32 ? zlib.crc32(b) : (function () { let c = ~0; for (const x of b) { c ^= x; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1; } return ~c >>> 0; })(); }
function makeZip(entries) {   // entries: { name, data, deflate, flags }
  const parts = [], central = []; let offset = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name), raw = Buffer.from(e.data), body = e.deflate ? zlib.deflateRawSync(raw) : raw;
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(e.flags || 0, 6); lh.writeUInt16LE(e.deflate ? 8 : 0, 8);
    lh.writeUInt32LE(crc32(raw), 14); lh.writeUInt32LE(body.length, 18); lh.writeUInt32LE(raw.length, 22); lh.writeUInt16LE(name.length, 26);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(e.flags || 0, 8); ch.writeUInt16LE(e.deflate ? 8 : 0, 10);
    ch.writeUInt32LE(crc32(raw), 16); ch.writeUInt32LE(body.length, 20); ch.writeUInt32LE(raw.length, 24); ch.writeUInt16LE(name.length, 28); ch.writeUInt32LE(offset, 42);
    parts.push(lh, name, body); central.push(Buffer.concat([ch, name])); offset += 30 + name.length + body.length;
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, cd, end]);
}
function tarHeader(name, size, type, ustar) {
  const h = Buffer.alloc(512); h.write(name.slice(0, 100), 0); h.write('0000644\0', 100); h.write(size.toString(8).padStart(11, '0') + '\0', 124);
  h.write(type, 156); if (ustar) h.write('ustar\0', 257);
  return h;
}
function makeTar(entries) {   // entries: { name, data }; names over 100 characters use a GNU long-name record
  const parts = [];
  for (const e of entries) {
    const data = Buffer.from(e.data), pad = (b) => Buffer.concat([b, Buffer.alloc((512 - b.length % 512) % 512)]);
    if (e.name.length > 100) { const ln = Buffer.from(e.name + '\0'); parts.push(tarHeader('././@LongLink', ln.length, 'L'), pad(ln)); }
    parts.push(tarHeader(e.name, data.length, '0'), pad(data));
  }
  parts.push(Buffer.alloc(1024));
  return Buffer.concat(parts);
}
async function archiveTests() {
  const eq = (label, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    console.log((ok ? 'ok        ' : 'MISMATCH  ') + label.padEnd(42));
    if (!ok) { mismatches++; console.log('   expected: ' + JSON.stringify(want)); console.log('   actual:   ' + JSON.stringify(got)); }
  };
  // Words typed in the page are masked whole-word, any case, longest first
  {
    const t = 'Orion and ORION-2 and Orionis; project-aurora ok';
    const out = ctx.sanitize(t, ctx.detect(t, 'x.txt', { sensitive: true, terms: ['orion', 'Project-Aurora'] }));
    eq('terms: whole word, any case', out, '[CUSTOMER_1] and [CUSTOMER_1]-2 and Orionis; [CUSTOMER_2] ok');
  }
  {   // a listed word wins over a labeled detail with the very same span
    const t = 'project_id: orion-staging-48213';
    const out = ctx.sanitize(t, ctx.detect(t, 'x.txt', { sensitive: true, terms: ['orion-staging-48213'] }));
    eq('terms: win a tie with a labeled detail', out, 'project_id: [CUSTOMER_1]');
  }
  {   // titles, greetings and signatures, in the three languages; a team name signs no person
    const cases = [
      ['Bonjour Madame Dupont, voici le dossier.', 'Bonjour Madame [PERSON_1], voici le dossier.'],
      ['Cordialement,\nJean Martin\n', 'Cordialement,\n[PERSON_1]\n'],
      ['Best regards,\nMaria Garcia', 'Best regards,\n[PERSON_1]'],
      ['Mit freundlichen Grüßen\nErika Mustermann', 'Mit freundlichen Grüßen\n[PERSON_1]'],
      ['Hallo Anna,', 'Hallo [PERSON_1],'],
      ['Dear customer,\nThanks\nSupport team', 'Dear customer,\nThanks\nSupport team'],
      ['Grüße\nTeam Support', 'Grüße\nTeam Support'],
      ['password is required here', 'password is required here'],
      ['Das Passwort muss acht Zeichen lang sein.', 'Das Passwort muss acht Zeichen lang sein.']
    ];
    cases.forEach(([t, want]) => eq('language: ' + t.split('\n')[0].slice(0, 28), ctx.sanitize(t, ctx.detect(t, 'x.txt', { sensitive: true })), want));
  }
  {   // the sharp s, misread by the OCR as B or R, is restored for the detection
    eq('ocr: sharp s', ['WeiB', 'GroR', 'StraBe', 'GrüBen', 'heiBt', 'Bob', 'demoBxyz', 'WEB'].map(ctx.fixSharpS), ['Wei\u00df', 'Gro\u00df', 'Stra\u00dfe', 'Grü\u00dfen', 'hei\u00dft', 'Bob', 'demoBxyz', 'WEB']);
  }
  const view = (r) => ({ entries: r.entries.map((e) => [e.path, Buffer.from(e.data).toString()]).sort(), skipped: r.skipped.map((k) => k.path + ' ' + k.why).sort() });
  const longName = 'deep/' + 'd'.repeat(60) + '/' + 'f'.repeat(50) + '.log';
  const zip = makeZip([
    { name: 'logs/app.log', data: 'password=Fake-Zip-Pass-1\n'.repeat(50), deflate: true },
    { name: 'notes.txt', data: 'stored entry' },
    { name: 'folder/', data: '' },
    { name: '__MACOSX/._notes.txt', data: 'noise' },
    { name: 'logs/._app.log', data: 'macOS metadata' },
    { name: '../../evil.txt', data: 'path is cleaned' },
    { name: 'locked.txt', data: 'x', flags: 1 }
  ]);
  const z = view(await ctx.readArchive('bundle.zip', new Uint8Array(zip)));
  eq('zip: entries (stored, deflated, cleaned path)', z.entries.map((e) => e[0]), ['evil.txt', 'logs/app.log', 'notes.txt']);
  eq('zip: deflated content intact', z.entries.find((e) => e[0] === 'logs/app.log')[1], 'password=Fake-Zip-Pass-1\n'.repeat(50));
  eq('zip: encrypted entry reported, not read', z.skipped, ['locked.txt password-protected']);
  const tgz = zlib.gzipSync(makeTar([{ name: 'a/readme.txt', data: 'hello' }, { name: longName, data: 'long name' }]));
  const t = view(await ctx.readArchive('support.tar.gz', new Uint8Array(tgz)));
  eq('tar.gz: entries, long name', t.entries, [['a/readme.txt', 'hello'], [longName, 'long name']]);
  const g = view(await ctx.readArchive('app.log.gz', new Uint8Array(zlib.gzipSync('token=fake_gz_token_1234'))));
  eq('gz: one compressed log', g.entries, [['app.log', 'token=fake_gz_token_1234']]);
  ctx.ARCHIVE_MAX_BYTES = 100;
  const big = await ctx.readArchive('bomb.gz', new Uint8Array(zlib.gzipSync(Buffer.alloc(100000)))).then(() => 'read', (e) => e.message);
  eq('gz: size limit stops a bomb', /too large/.test(big), true);
  ctx.ARCHIVE_MAX_BYTES = 512 * 1024 * 1024;
  const bad = await ctx.readArchive('x.zip', new Uint8Array(Buffer.from('not a zip at all, just text'))).then(() => 'read', (e) => e.message);
  eq('zip: garbage is refused', bad, 'not a zip file');
}

archiveTests().then(function () {
  if (!update) {
    console.log(mismatches ? '\n' + mismatches + ' mismatch(es).' : '\nAll results match.');
    process.exit(mismatches ? 1 : 0);
  }
});
