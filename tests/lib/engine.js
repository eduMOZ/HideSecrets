/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
// Loads the detection engine straight from index.html, so the tests run exactly the code of the page.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..', '..');

function loadEngine() {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const engine = html.match(/<script id="engine">([\s\S]*?)<\/script>/);
  if (!engine) throw new Error('Engine not found in index.html');
  const ctx = {};
  vm.createContext(ctx);
  // The tests use the example product settings (an invented product), as config.local.js would in the page
  vm.runInContext(fs.readFileSync(path.join(root, 'config.example.js'), 'utf8'), ctx);
  // The archive reader needs a few browser APIs, which Node provides as globals
  Object.assign(ctx, { Blob, DecompressionStream, TextDecoder, atob });
  // Top-level functions of the engine (detect, sanitize, regionsFromOcr, fixSharpS…) become properties of ctx
  vm.runInContext(engine[1], ctx);
  return ctx;
}

module.exports = { loadEngine, root };
