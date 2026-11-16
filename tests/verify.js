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
vm.runInContext(engine[1] + ';this.detect = detect; this.sanitize = sanitize;', ctx);

const update = process.argv.includes('--update');
const examplesDir = path.join(root, 'examples');
const expectedDir = path.join(__dirname, 'expected');
const LEVELS = { secret: false, sensitive: true };
let mismatches = 0;

for (const name of fs.readdirSync(examplesDir).sort()) {
  const text = fs.readFileSync(path.join(examplesDir, name), 'utf8');
  for (const level of Object.keys(LEVELS)) {
    const actual = ctx.sanitize(text, ctx.detect(text, name, { sensitive: LEVELS[level] }));
    const file = path.join(expectedDir, name + '.' + level + '.txt');
    const label = (name + ' (' + level + ')').padEnd(42);
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

if (!update) {
  console.log(mismatches ? '\n' + mismatches + ' mismatch(es).' : '\nAll results match.');
  process.exit(mismatches ? 1 : 0);
}
