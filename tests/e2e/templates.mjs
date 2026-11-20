/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
// The screenshots the end-to-end tests make and mask. Every person, value and company is invented.

// HTML templates in templates/: data-s="kind" marks a value to mask, data-k a text that must stay visible
export const TEMPLATES = [
  { name: 'terminal', theme: 'dark' },   // the German demo terminal, rebuilt
  { name: 'ticket' },                    // the German demo support ticket (two columns), rebuilt
  { name: 'mail' },
  { name: 'chat' },
  { name: 'settings' },
  { name: 'table' },
  { name: 'devtools', theme: 'dark' },
  { name: 'editor' },
  { name: 'scan', format: 'jpeg' },
  { name: 'diagnose', theme: 'dark' },   // a support session in a terminal: German »…« quotes, JSON, an .ini file, a note with an address and a phone number
  { name: 'handover' }                   // a customer's mail with a spelled-out phone number and birth date, a password in two parts, a share link
];

// Screenshots made by hand (examples/demo/screenshots): their truth is the text to find in what the OCR read
export const DEMOS = [
  { name: 'demo-german-terminal', file: 'examples/demo/screenshots/german-terminal.webp',
    secretStrings: ['m.mueller@bereitstellung-01', 'Marlene Müller', 'marlene.mueller@example.org', '203.0.113.91', 'Demo!Wald72#Blau', 'Demo%40Zugang%2184',
      'Sören Groß', 'soeren.gross@example.com', '+49 30 00000000', 'KUNDE-DEMO-00819', 'demo_Geheimnis8qR4m7', '5831-9264', '7042-1683', 'Demo%23Datenbank72',
      'ZGVtbw==', 'RGVtb09ubHkhNDI=', 'BEISPIELWERK\\sgross', 'demo_Anmeldung7xM2', 'demo_Status8rQ4', 'demo_Sitzung9pK3', '2001:db8:91::7', 'demo_Rettung4nW8',
      'Käthe Weiß', 'kaethe.weiss@example.net', '07.12.1988', 'Musterstraße 27, 00000 Beispielstadt', 'Regen!63Bäume#91', 'Gänseblümchen', 'DEMO-SN-DE-8Q31-7M42', 'kaethe.weiss'],
    keepStrings: ['Version=2.14.3 Port=8443', 'client_id: kundenportal', 'Status=200 Dauer=5831ms', 'Laufzeit 42 Sekunden'] },
  { name: 'demo-german-ticket', file: 'examples/demo/screenshots/german-support-ticket.webp',
    secretStrings: ['Jörg Weiß', 'j.weiss', 'joerg.weiss+hilfe@example.org', '+49 30 00000000', '23. März 1986', 'MIT-DEMO-00842', 'Franziska Groß', 'Wolke!73Fluss#28',
      '4826-1937', 'BER-LT-JWEISS-07', 'Schneeflöckchen', '18 Beispielgasse, Wohnung 4', '00000 Musterstadt', 'Personalbogen_Jörg_Weiß_1986-03-23', 'Özlem Şahin',
      'oezlem.sahin@example.net', 'demo_DE8qR4m2', 'KD-DEMO-7391', 'DE89 3704 0044 0532 0130 00', '4242 4242 4242 4242', 'DEMO-DE-7M42-9Q18', '02:11:22:33:44:55', '198.51.100.82'],
    keepStrings: ['Version 4.12.3', 'HTTP-Status 200', 'Bearbeitungszeit 427 ms', '#4827'] }
];

const AXES = { scale: [1, 1.5, 2], theme: ['light', 'dark'], size: [13, 15, 17], format: ['png', 'jpeg', 'webp'] };
function rng(seed) {   // small seeded generator: the same variants on every run
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}
const nameOf = (v) => `x${v.scale}-${v.theme}-${v.size}px-${v.format}`;

// smoke: the base rendering of each template; full: four more, drawn from the axes
export function variants(t, full, extra = 4) {
  const base = { scale: 1, theme: t.theme || 'light', size: 15, format: t.format || 'png' };
  const list = [base], seen = new Set([nameOf(base)]), r = rng(t.name);
  for (let tries = 0; full && list.length < 1 + extra && tries < 100; tries++) {
    const v = Object.fromEntries(Object.entries(AXES).map(([k, vals]) => [k, vals[Math.floor(r() * vals.length)]]));
    if (t.name === 'scan') v.theme = 'light';
    if (!seen.has(nameOf(v))) { seen.add(nameOf(v)); list.push(v); }
  }
  return list.map((v) => ({ ...v, name: nameOf(v) }));
}
