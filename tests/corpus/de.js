/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
// German leak corpus: invented values in the phrasings of support chats, mails, terminals and settings.
//
// A case is a list of parts: plain text, V(value) for a value that must be masked, K(text) for text that must
// stay visible. ocrOnly: a reading only an OCR makes, checked on the synthetic screenshot and not as text. The level says from which masking level a value must be masked: "secret" values at both levels,
// "sensitive" values at the "Secrets and sensitive data" level only. Every value here is invented.
'use strict';

const V = (s) => ({ v: s });
const K = (s) => ({ k: s });

// "{v}" in a pattern is the value; a pattern may span several lines
function fill(pattern, value) {
  const out = [], bits = pattern.split('{v}');
  bits.forEach((b, i) => { if (b) out.push(b); if (i < bits.length - 1) out.push(V(value)); });
  return out;
}
function each(cat, level, patterns, values, file) {
  const res = [];
  patterns.forEach((p) => values.forEach((v) => res.push({ cat, level, parts: fill(p, v), file })));
  return res;
}
function one(cat, level, parts, file) { return { cat, level, parts, file }; }

const PASSWORDS = ['Demo!Wald72#Blau', 'Wolke!73Fluss#28', 'Regen!63Bäume#91', 'Sommer2024!Geheim', 'Tannen7Zapfen!4', 'Straße9!Demo', 'kX7#mQ2!pL9z'];
const CODES = ['482913', '771204', '90817364'];
const RECOVERY = ['4826-1937', '5831-9264'];
const URL_PASSWORDS = ['Demo%23Datenbank72', 'Demo%40Zugang%2184', 'Geheim2024x', 'Wald!72Blau'];
const TOKENS = ['demo_DE8qR4m2', 'demo_Rettung4nW8', 'demoX7kP2mQ9rL4vB8'];
const LOGINS = ['j.weiss', 'm.mueller', 'k.schroeder2', 'jweiss86'];
const PEOPLE = [['Jörg', 'Weiß'], ['Franziska', 'Groß'], ['Käthe', 'Weiß'], ['Sören', 'Groß'], ['Özlem', 'Şahin'], ['Marlene', 'Müller']];
const DATES = ['07.12.1988', '1986-03-23', '3.4.1975', '23. März 1986', '3. Oktober 1979'];

function cases() {
  const c = [];

  // ---------- Secrets ----------
  c.push(...each('password', 'secret', [
    'Passwort: {v}', 'Kennwort: {v}', 'Passwort = {v}', 'Kennwort lautet {v}', 'Das Passwort lautet {v}.',
    'Ihr Kennwort ist {v}', 'Vorläufiges Passwort: {v}', 'Neues Kennwort: "{v}"', 'Initialpasswort: {v}',
    'Das Kennwort für den Zugang ist {v}.', 'Kennwort für Dienstkonto svc_portal: {v}', 'Passwort für das Konto admin: {v}',
    'Bitte den Zugang mit dem vorläufigen Kennwort versuchen:\n{v}', 'Ich verwende {v} als Passwort.',
    'Zugangsdaten: admin / {v}', 'DB_PASSWORT={v}', 'Das WLAN-Passwort lautet {v}', 'Kennwort: {v} (bitte ändern)',
    '[WARN] Kennwort für Dienstkonto svc_bereitstellung: {v}'
  ], PASSWORDS));
  c.push(...each('code', 'secret', [
    'Ihr Bestätigungscode lautet {v}.', 'Bestätigungscode: {v}', 'Einmalpasswort: {v}', 'Ihre TAN lautet {v}', 'mTAN: {v}',
    'SMS-Code: {v}', 'Der Anmeldecode ist {v}', 'Verifizierungscode {v}', 'Authentifizierungscode lautet: {v}'
  ], CODES));
  c.push(...each('code', 'secret', [
    'Der Wiederherstellungscode lautet {v}.', 'Wiederherstellungscodes: {v}, 7042-1683', 'notfallcodes: ["{v}", "7042-1683"]'
  ], RECOVERY));
  c.push(...each('code', 'secret', ['PIN: {v}', 'Geheimzahl: {v}', 'PIN-Code: {v}'], ['4821', '7391']));
  c.push(...each('code', 'secret', ['Der Code für die Tür ist {v}', 'Türcode: {v}', 'Code für das Tor: {v}'], ['4711#', '2580*']));
  c.push(...each('answer', 'secret', [
    'Sicherheitsfrage: Name des ersten Haustiers? Antwort: {v}', 'Antwort auf die Sicherheitsfrage: {v}',
    'Die Sicherheitsfrage lautet: Wie hieß Ihr erstes Haustier?\nMeine Antwort ist {v}.'
  ], ['Schneeflöckchen', 'Gänseblümchen', 'Bello']));
  c.push(...each('url-password', 'secret', [
    'verbindung: "postgresql://svc_portal:{v}@db.example.net:5432/portal"', 'DATABASE_URL=mysql://app:{v}@db.example.net:3306/app',
    'Verbindungszeichenfolge: mongodb+srv://backup:{v}@cluster0.example.net/admin', 'REDIS_URL=redis://:{v}@cache.example.net:6379/0',
    'Broker: amqp://worker:{v}@mq.example.net:5672/', '[DEBUG] HTTPS_PROXY=http://svc_proxy:{v}@proxy.example.net:3128',
    'Quelle: https://deploy:{v}@git.example.net/infra.git'
  ], URL_PASSWORDS));
  c.push(...each('token', 'secret', [
    'Rücksetzlink: https://konto.example.org/reset?token={v}&user=j.weiss', '[DEBUG] Wiederherstellungslink: https://konto.example.org/reset?token={v}',
    'Sitzungscookie: portal_sitzung={v}; Secure; HttpOnly', 'client_secret: "{v}"', 'API-Schlüssel: {v}', 'Geheimer Schlüssel = {v}',
    '[TRACE] Weiterleitung: /callback?code={v}&state=demo_Status8rQ4'
  ], TOKENS));
  c.push(one('token', 'secret', ['Link: https://konto.example.org/passwort-zuruecksetzen/', V('demoX7kP2mQ9rL4vB8Zt')]));
  c.push(one('token', 'secret', ['Authorization: Bearer ', V('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkZW1vIn0.c2lnbmF0dXJlZGVtbw')]));
  c.push(one('k8s', 'secret', ['apiVersion: v1\nkind: Secret\nmetadata:\n  name: ', K('portal-zugang'), '\ntype: Opaque\ndata:\n  benutzername: ',
    V('ZGVtbw=='), '\n  kennwort: ', V('RGVtb09ubHkhNDI=')], 'secret.yaml'));

  // ---------- Logins ----------
  c.push(...each('login', 'sensitive', [
    'Mein Benutzername lautet {v}, die Adresse folgt.', 'Benutzername: {v}', 'Nutzername ist {v}', 'Anmeldename: {v}',
    'Benutzer-ID: {v}', 'Profil: https://konto.example.org/profil?user={v}', '{v}@bereitstellung-01:~/infrastruktur$ ls'
  ], LOGINS));
  c.push(one('login', 'sensitive', ['[DEBUG] Benutzerkennung: ', V('BEISPIELWERK\\sgross')]));

  // ---------- Person names ----------
  PEOPLE.forEach(([f, l]) => {
    c.push(one('name', 'sensitive', ['Ansprechpartner: ', V(f + ' ' + l)]));
    c.push(one('name', 'sensitive', ['Von: ', V(f + ' ' + l)]));
    c.push(one('name', 'sensitive', ['Mit freundlichen Grüßen\n', V(f + ' ' + l)]));
    c.push(one('name', 'sensitive', ['[INFO] Verantwortlich: ', V(f + ' ' + l), ' <', V(plainMail(f, l)), '>']));
    c.push(one('name', 'sensitive', ['Sehr geehrte Frau ', V(l), ',']));
    c.push(one('name', 'sensitive', ['Rückruf bitte bei Frau ', V(f + ' ' + l), '.']));
    c.push(one('name', 'sensitive', ['Kontoinhaber: ', V(f + ' ' + l)]));
    c.push(one('name', 'sensitive', ['Rückrufkontakt: ', V(f + ' ' + l)]));
    c.push(one('name', 'sensitive', [V(f + ' ' + l), ' 09:14']));
  });
  c.push(one('name', 'sensitive', ['Hallo ', V('Franziska'), ',']));
  c.push(one('name', 'sensitive', ['Herr Dr. ', V('Schröder-Weiß'), ' ruft zurück.']));

  // ---------- Personal details ----------
  c.push(...each('birth-date', 'sensitive', ['Geburtsdatum: {v}', 'geboren am {v}', 'Mein Geburtsdatum ist der {v}.', 'Geburtsdatum zur Testzuordnung: {v}'], DATES));
  c.push(...each('address', 'sensitive', ['Anschrift: {v}', 'Lieferadresse: {v}', 'Lieferanschrift: {v}'], ['Beispielstraße 12, 80331 Musterstadt', 'Musterweg 5a, 12345 Beispielstadt']));
  c.push(one('address', 'sensitive', ['Lieferanschrift:\n', V('Jörg Weiß'), '\n', V('18 Beispielgasse, Wohnung 4'), '\n', V('00000 Musterstadt')]));
  c.push(one('address', 'sensitive', ['Die Lieferanschrift für das Ersatzgerät:\n', V('Beispielgasse 18, Wohnung 4')]));
  c.push(...each('phone', 'sensitive', ['Telefon: {v}', 'Sie erreichen mich unter {v}, Durchwahl 427.', 'telefonnummer: "{v}"'], ['+49 30 12345678', '0171 1234567', '(089) 123456', '030 1234567']));
  c.push(...[
    ['Steuer-ID: ', '12 345 678 901'], ['Sozialversicherungsnummer: ', '12 150988 K 123'], ['Personalausweisnummer: ', 'L01X00T47'],
    ['Kundennummer: ', 'KD-DEMO-7391'], ['Die Personalnummer lautet ', 'MIT-DEMO-00842'], ['Vertragsnummer: ', 'VN-2024-88123'],
    ['Reisepassnummer: ', 'C01X00T47'], ['kundennummer: "', 'KUNDE-DEMO-00819']
  ].map(([l, v]) => one('id-number', 'sensitive', [l, V(v)])));
  c.push(...[
    ['IBAN: ', 'DE89 3704 0044 0532 0130 00'], ['IBAN ', 'DE89370400440532013000'], ['Testkarte: ', '4242 4242 4242 4242'],
    ['Kartenprüfnummer: ', '737'], ['gültig bis: ', '12/27']
  ].map(([l, v]) => one('bank', 'sensitive', [l, V(v)])));
  c.push(...[
    ['E-Mail: ', 'oezlem.sahin@example.net'], ['kontaktadresse: ', 'soeren.gross@example.com'], ['die geschäftliche Adresse ist ', 'joerg.weiss+hilfe@example.org']
  ].map(([l, v]) => one('email', 'sensitive', [l, V(v)])));
  c.push(...[
    ['Seriennummer: ', 'DEMO-DE-7M42-9Q18'], ['Geräteseriennummer: ', 'DEMO-SN-DE-8Q31-7M42'], ['MAC-Adresse: ', '02:11:22:33:44:55']
  ].map(([l, v]) => one('device', 'sensitive', [l, V(v)])));
  c.push(...each('device-name', 'sensitive', [
    'Das betroffene Gerät heißt {v}.', 'Gerätename: {v}', 'Rechnername: {v}', 'Computername ist {v}', 'Mein Laptop heißt {v}.'
  ], ['BER-LT-JWEISS-07', 'NB-MUELLER-0815', 'PC-BUCHHALTUNG-12', 'WS-4711']));
  c.push(...[
    ['Letzter Zugriff: ', '198.51.100.82'], ['[WARN] Anmeldung fehlgeschlagen von [', '2001:db8:91::7'], ['[INFO] Zielsystem: root@', '203.0.113.91']
  ].map(([l, v]) => one('ip', 'sensitive', [l, V(v)])));
  c.push(...[
    ['Datei: /home/', 'kaethe.weiss', '/Dokumente/Kundenexport.csv'], ['Gespeichert unter C:\\Users\\', 'jweiss', '\\Desktop\\notiz.txt'],
    ['[INFO] Arbeitsverzeichnis: /home/', 'marlene.mueller', '/kunden/beispielwerk']
  ].map(([a, v, b]) => one('path', 'sensitive', [a, V(v), b])));

  // ---------- Names inside file names ----------
  c.push(one('file-name', 'sensitive', [V('Personalbogen_Jörg_Weiß_1986-03-23'), '.pdf']));
  c.push(one('file-name', 'sensitive', ['Anhang: ', V('Lebenslauf_Franziska_Groß'), '.docx']));
  c.push(one('file-name', 'sensitive', ['Datei: ', V('Gehaltsabrechnung-Jörg-Weiß-2024-05'), '.pdf']));
  c.push(one('file-name', 'sensitive', ['Von: ', V('Käthe Weiß'), '\nAnhang: ', V('Vertrag_Weiss_Kaethe_2023'), '.pdf']));

  // ---------- As the OCR read real screenshots (tests/e2e): labels and values damaged on the way ----------
  c.push(one('token', 'secret', ['client_secret ', V('demo_Geheimnis8qR4m7'), '"']));                    // the colon and quote lost
  c.push(one('token', 'secret', ['dient_secret: ', V('demo_Geheimnis2wQ9z')]));                         // "cl" read as "d"
  c.push(one('token', 'secret', ['API-Schlüssel ', V('demo4f8Q2kL9xW3mZ7')]));                           // a form: no colon
  c.push(one('password', 'secret', ['Kennwort ', V('Sommer2024!Geheim')]));
  c.push(one('code', 'secret', ['notfallcodes: ["', V('5831-9264'), '", "', V('7042-1683'), '"']));       // the "]" lost
  c.push(one('code', 'secret', ['Die SMS mit der TAN ist angekommen: ', V('482913')]));
  c.push(one('token', 'secret', ['[TRACE] Sitzungscooki portal_sitzung=', V('demo_Sitzung9pK3'), '; Secure; HttpOnly']));   // "Sitzungscookie:" misread
  c.push(one('bank', 'sensitive', ['IBAN: ', V('DEB9 3704 0044 0532 0130 00')]));                       // 8 read as B
  c.push(one('bank', 'sensitive', [V('DEO2 1203 0000 0000 2020 51')]));                                  // 0 read as O
  c.push(one('login', 'sensitive', [V('m.mueller@bereitstellung-@1'), ':-/infrastruktur$ ls']));         // 0 read as @, ~ as -
  c.push(one('device-name', 'sensitive', ['Gerätename ', V('NB-MUELLER-0815')]));                        // a form: no colon
  c.push(one('name', 'sensitive', ['Jorg Weiß · Heute\nJorg ', V('weiß'), ' · 09:23']));                  // capital read as small letter
  c.push(one('url-password', 'secret', ['[DEBUG] HTTPS_PROXY=http://svc_proxy :', V('Demo%40Zugang%2184'), '@proxy.example.net:3128']));   // a space before ":"
  c.push(one('password', 'secret', ['[WARN] Kennwort fiir Dienstkonto svc_bereitstellung: ', V('Demo!Wald72#Blau')]));            // "ü" read as "ii"
  c.push(one('token', 'secret', ['dlient_secret ', V('demo_Geheimnis2wQ9z')]));
  c.push(one('token', 'secret', ['Authorization: Bearer ', V('eyJhbGciOiJIUzI1NiJ9.ey)zdWIiOiJkZW1vIn®.c2lnbmF@dXJ1ZGVtbw')]));   // symbols read in a token
  c.push(one('bank', 'sensitive', ['IBAN: ', V('DES9 3704 0044 0532 0130 00')]));                                                  // 8 read as S
  c.push(Object.assign(one('login', 'sensitive', ['Mein Benutzername ist ', V('|.hoffmann'), '.']), { ocrOnly: true }));             // "l" read as "|"
  c.push(Object.assign(one('password', 'secret', ['4 DB_PASSHORT=', V('Sommer2024!Geheim')]), { ocrOnly: true }));   // W read as H: images only
  c.push(Object.assign(one('id-number', 'sensitive', ['Sozialversicherungsnummer® ', V('12 150988 K 123')]), { ocrOnly: true }));   // ":" read as "®"
  c.push(one('token', 'secret', ['API-Schliissel: ', V('demo4f8Q2kL9xW3mZ7')]));                                                      // "ü" read as "ii"
  c.push(one('file-name', 'sensitive', ['Anhang: Bericht_', V('JanMüller'), '.pdf']));                                              // the "_" lost between two names
  c.push(Object.assign(one('token', 'secret', ['API_T0KEN=', V('demo4f8Q2kL9xW3mZ7')]), { ocrOnly: true }));
  // The "@" of a prompt read as "e"; a space after the ":" of "postgresql://" and one before the password's ":"; the capital of a first name read as "s"
  c.push(Object.assign(one('login', 'sensitive', [V('m.mueller@bereitstellung-01'), ':~/infrastruktur$ ./bereitstellen.sh --kunde beispielwerk\n', V('m.muellerebereitstellung-01'), ':~/infrastruktur$ cat kundenwerte.yaml\n']), { ocrOnly: true }));
  // An address spells ö as oe: it tells the name written with the accent
  c.push(one('name', 'sensitive', ['kontaktadresse: ', V('soeren.gross@example.com'), '\n[WARN] Anmeldung fehlgeschlagen für ', V('Sören Groß'), ' von [2001:db8:91::7]\n']));
  c.push(Object.assign(one('url-password', 'secret', ['verbindung: "postgresql: //svc_portal :', V('Demo%23Datenbank72'), '@db.example.net:5432/portal"']), { ocrOnly: true }));
  c.push(Object.assign(one('url-password', 'secret', ['verbindung: "postgresql: //svc_portal:', V('Demo%40Bach%2391'), '@daten.example.net:5432/portal"']), { ocrOnly: true }));
  c.push(Object.assign(one('name', 'sensitive', ['ansprechpartner: "', V('Sören Groß'), '"\nkontaktadresse: ', V('soeren.gross@example.com'), '\n[TRACE] Benutzerattribute: {"name":"', V('sören'), ' ', V('Groß'), '"}\n']), { ocrOnly: true }));

  // ---------- Found on screenshots of a support session (a terminal and a mail) ----------
  // German quotation marks: »…« (reversed from the French «…») and „…“
  c.push(...each('answer', 'secret', [
    'Die Antwort auf die Sicherheitsfrage ist »{v}«.', 'Falls die Sicherheitsfrage erscheint: Meine Antwort ist »{v}«.',
    'Zur Wiederherstellung des Kontos: Die Antwort ist „{v}“.', 'Die Antwort auf die Sicherheitsfrage lautet: „{v}“'
  ], ['Großmutters Garten', 'Der kleine Eisbär', 'Schneeflöckchen']));
  c.push(...each('password', 'secret', [
    'Die Entsperrphrase lautet »{v}«.', 'Die Passphrase ist „{v}“.', 'Ihr Zugangskennwort ist »{v}«.', 'Das Kennwort lautet »{v}«.'
  ], ['Sieben grüne Blätter!', 'Roter Apfel 42', 'Demo LDAP!82:gelb']));
  c.push(...each('password', 'secret', ['BindKennwort="{v}"', 'Wiederherstellungskennwort = "{v}"', 'ldap_passwort: \'{v}\''], ['Demo LDAP!82:gelb', 'Wolke 73 Fluss#28']));
  c.push(one('password', 'secret', ['Zum Entsperren verwenden Sie bitte zunächst ', V('Herbstlaub!'), ' und hängen ohne Leerzeichen ', V('6047'), ' an.']));
  c.push(one('password', 'secret', ['Nehmen Sie bitte zuerst ', V('Tannen#7'), ' und fügen Sie dahinter ', V('2291'), ' hinzu.']));
  // Labels: recovery codes, a secret, a key
  c.push(...each('code', 'secret', ['Ersatzcodes = {v}', 'Ersatzcodes: {v}'], ['4826-1937;7052-1486', '5831-9264, 7042-1683']));
  c.push(...each('token', 'secret', [
    'Environment="SCHLUESSEL={v}"', '"geheimnis":"{v}"', 'GEHEIMNIS={v}', '"zugangsdaten":{"kennung":"svc_versand","geheimnis":"{v}"}'
  ], ['demo_K8qR2m9X4p7N', 'DemoPaket!47', 'Wolke!73Fluss']));
  // A token in the path of a share link (also with escaped slashes, in JSON)
  c.push(...each('token', 'secret', [
    'Freigabelink: https://ablage.example.net/s/{v}?download=1', '"download":"https:\\/\\/ablage.example.net\\/s\\/{v}",', 'Teilen: https://freigabe.example.net/d/{v}'
  ], ['DEMO8qR2m7', 'demo_D8m2Q7', 'Xk4Rm9Qw2Lp7']));
  // A value found once is masked wherever it appears again in the same text
  c.push(one('password', 'secret', ['Kennwort: ', V('Demo!Wald72#Blau'), '\n[WARN] Anmeldung mit ', V('Demo!Wald72#Blau'), ' fehlgeschlagen']));
  c.push(one('code', 'secret', ['Ihr Bestätigungscode lautet ', V('6047'), '.\nZum Entsperren: ', V('6047'), ' an das Passwort hängen.']));
  c.push(one('login', 'sensitive', ['[DEBUG] Anmeldekennung: ', V('NORDLICHT\\foesterreich'), '\n[TRACE] Anfrage={"benutzer":"', V('foesterreich'), '"}']));
  c.push(one('birth-date', 'sensitive', ['Geboren am ', V('4. Mai 1979'), '\nDokument: /home/kunde/Personalbogen_', V('1979-05-04'), '.pdf']));
  c.push(one('birth-date', 'sensitive', ['Geburtsdatum: ', V('23.03.1986'), '\nDatei: Ausweis_', V('1986-03-23'), '_scan.pdf']));

  // Logins, devices, addresses, dates and phone numbers
  // A login in quotes after its label, with no earlier mention to learn it from: made of letters only, whatever the OCR dropped before it
  c.push(one('login', 'sensitive', ['[TRACE] Anfrage={"benutzer":"', V('foesterreich'), '"}']));
  c.push(one('login', 'sensitive', ['[TRACE] Anfrage=benutzer :"', V('foesterreich'), '"}']));               // the quote before the label lost
  c.push(one('login', 'sensitive', ['{"username": "', V('mustermann'), '", "rolle": "', K('leser'), '"}']));
  c.push(one('login', 'sensitive', ['Zugang\n  benutzer: "', V('sschmidtke'), '"']));
  // The same shape that holds no person: service accounts, generic accounts and placeholders
  c.push(one('keep-login', 'sensitive', ['"zugangsdaten":{"kennung":"', K('svc_versand'), '","benutzer":"', K('terraform-runner'), '"}']));
  c.push(one('keep-login', 'sensitive', ['{"user":"', K('admin'), '","username":"', K('required'), '","login":"', K('anonymous'), '","benutzer":"', K('changeme'), '"}']));
  c.push(one('keep-login', 'sensitive', ['benutzer = "', K('example'), '" und user: "', K('svc-deploy'), '"']));
  c.push(...each('login', 'sensitive', ['Sein Konto lautet {v}, Rechnername folgt.', 'Das Benutzerkonto ist {v}.'], ['r.weissgaerber', 'm.mueller', 'k.schroeder2']));
  c.push(...each('device', 'sensitive', ['Seriennr.: {v}', 'Seriennr {v}', 'Serien-Nr.: {v}'], ['DEMO-8Q71-M4P9', 'DEMO-DE-7M42-9Q18']));
  c.push(...each('device-name', 'sensitive', ['Rechner: {v}', 'Rechner {v}'], ['NB-RW-019', 'BER-LT-JWEISS-07']));
  c.push(...each('address', 'sensitive', ['Versand an: {v}', 'Privatanschrift: {v}', 'Bitte schicken Sie es an meine Privatanschrift: {v}'], ['Beispielstraße 12, 80331 Musterstadt', 'Musterpfad 6c, 00000 Testhausen']));
  c.push(one('address', 'sensitive', ['bitte schicken Sie das Ersatzgerät an meine Privatanschrift:\n', V('Franziska Waldmann'), '\nc/o ', V('İlker Yılmaz'), '\n',
    V('Fiktivgässchen 18b, Hinterhaus, 3. OG links'), '\n', V('00000 Beispielstadt')]));
  c.push(one('address', 'sensitive', ['bitte schicken Sie das Ersatzgerät an meine Privatanschrift:\n', V('Franziska Waldmann'), '\nc/o ', V('İlker Yılmaz'), '\n',
    V('Fiktivgässchen 18b, Hinterhaus, 3. OG links'), '\n', 'Gestern ', V('00000 Beispielstadt')]));   // a word of the list beside the text, on the same row
  c.push(one('name', 'sensitive', ['Bitte senden an c/o ', V('Müller')]));
  // As the OCR read the mail: the closing » « lost, a date cut at the end of a line, a recipient it cannot read (İ and ı are not in its German data)
  c.push(one('answer', 'secret', ['Falls die Sicherheitsfrage erscheint: Meine Antwort ist »', V('Der kleine Eisbäre'), '.']));
  c.push(one('password', 'secret', ['Die Entsperrphrase lautet »', V('Sieben grüne Blätter!'), '\nBitte nicht weitergeben.']));
  c.push(one('birth-date', 'sensitive', ['Für die Zuordnung: Ich bin am ', V('neunten Oktober\nneunzehnhundertvierundachtzig'), ' geboren.']));
  c.push(one('birth-date', 'sensitive', ['Für die Zuordnung: Ich bin am ', V('neunten Oktober neunzehnhundertvierundachtzig'), '\ngeboren. Tagsüber bin ich erreichbar.']));
  c.push(one('birth-date', 'sensitive', ['Für die Zuordnung: Ich bin am ', V('neunten Oktober neunzehnhundertvierundachtzig'), ' Nachrichten-ID: lab-msg-0082\ngeboren.']));   // a side panel read on the same row
  c.push(one('address', 'sensitive', ['bitte schicken Sie das Ersatzgerät an meine Privatanschrift:\n', V('Franziska Waldmann'), '\n', V('ofa ker Yilmaz'), '\n',
    V('Fiktivgässchen 18b, Hinterhaus, 3. OG links'), '\n', V('00000 Beispielstadt')]));
  c.push(one('address', 'sensitive', ['Lieferanschrift:\n', K('Beispielwerk GmbH'), '\n', V('Musterstraße 12'), '\n', V('80331 Musterstadt')]));
  c.push(one('birth-date', 'sensitive', ['Für die Zuordnung: Ich bin am ', V('neunten Oktober neunzehnhundertvierundachtzig'), ' geboren.']));
  c.push(one('birth-date', 'sensitive', ['Ich bin am ', V('9. Oktober 1984'), ' geboren.']));
  c.push(one('birth-date', 'sensitive', ['geboren am ', V('dritten Mai zweitausendzwei')]));
  c.push(...each('phone', 'sensitive', ['Tagsüber bin ich unter {v} erreichbar.'], [
    'null null eins fünf eins null null null null null eins zwei drei vier', 'null eins sieben eins eins zwei drei vier fünf sechs sieben', 'null null vier neun drei null eins zwei drei vier fünf sechs sieben acht'
  ]));
  c.push(one('phone', 'sensitive', ['Tagsüber bin ich unter ', V('null null eins fünf eins\nnull null null null null\neins zwei drei vier'), ' erreichbar.']));
  c.push(...each('phone', 'sensitive', ['erreichbar unter {v}.', 'Mobil: {v}'], ['+1 (202) 555-0138']));
  // Names: a name with a letter the OCR reads badly, and the first or last name given by its field
  c.push(one('name', 'sensitive', ['Guten Morgen Herr ', V('Großmann'), ',']));
  c.push(one('name', 'sensitive', ['Ansprechpartner: ', V('Björn Großmann'), '\nGuten Morgen Herr ', V('Großmann'), ',']));
  c.push(one('name', 'sensitive', ['[TRACE] Benutzerprofil={"vorname":"', V('Franziska'), '","nachname":"', V('Österreich'), '",']));
  c.push(one('name', 'sensitive', ['Zuständig: Dr. ', V('Franziska Österreich'), '\n[TRACE] Benutzerprofil={"nachname":"', V('Österreich'), '"}']));

  // ---------- A whole terminal session, as in the screenshot of a support case ----------
  c.push(one('terminal', 'sensitive', [
    '# SYNTHETISCHER TEST · sämtliche Zugangsdaten sind erfunden\n',
    V('f.oesterreich@sprungserver'), ':~/betrieb$ ./diagnose.sh --mandant nordlicht\n',
    '[INFO] Zuständige Mitarbeiterin: Dr. ', V('Franziska Österreich'), '\n',
    '[INFO] Rückfragen an ', V('franziska.oesterreich+betrieb@example.org'), '\n',
    '[INFO] Dienstversion=', K('6.4.2'), ' Port=', K('9443'), ' Wiederholungen=3\n',
    V('f.oesterreich@sprungserver'), ':~/betrieb$ systemctl show portal --property=Environment\n',
    'Environment="DIENSTKONTO=', K('svc_abgleich'), '" "ZUGANGSKENNWORT=', V('Demo!Föhn73#Grün'), '"\n',
    'Environment="VERBINDUNG=postgresql://svc_abgleich:', V('Demo%40Bach%2391'), '@daten.example.net:5432/portal"\n',
    'Environment="SCHLUESSEL=', V('demo_K8qR2m9X4p7N'), '"\n',
    V('f.oesterreich@sprungserver'), ':~/betrieb$ cat /etc/portal/anmeldung.ini\n',
    '[Verzeichnisdienst]\n',
    'Server=ldaps://verzeichnis.nordlicht.example.net:636\n',
    'BindDN=CN=svc_abgleich,OU=Dienstkonten,DC=nordlicht,DC=example,DC=net\n',
    'BindKennwort="', V('Demo LDAP!82:gelb'), '"\n',
    '[Notfallzugang]\n',
    'Wiederherstellungskennwort = "', V('Birke!64Fluss?92'), '"\n',
    'Ersatzcodes = ', V('3817-9264;7052-1486'), '\n',
    V('f.oesterreich@sprungserver'), ':~/betrieb$ kubectl logs deploy/identitaetsdienst --tail=8\n',
    '[DEBUG] Anmeldekennung: ', V('NORDLICHT\\foesterreich'), '\n',
    '[TRACE] Benutzerprofil={"vorname":"', V('Franziska'), '","nachname":"', V('Österreich'), '",\n',
    '  "elektronischePost":"', V('franziska.oesterreich@example.org'), '"}\n',
    '[TRACE] Anfrage={"client_secret":"', V('Demo\\u00210idc73'), '","benutzer":"', V('foesterreich'), '"}\n',
    '[TRACE] Weiterleitung:https://portal.example.org/cb?code=', V('demo_Z9r4M2'), '&state=', V('demo_S8q3'), '\n',
    '[TRACE] Cookie: sprache=de; sitzung=', V('demo_B7x2P9'), '; ansicht=kompakt\n',
    '[WARN] Gegenstelle=[', V('2001:db8:64::9'), ']:52177 Anmeldung fehlgeschlagen\n',
    '[INFO] Bearbeitungsdauer=', K('3817ms'), ' Status=401\n',
    V('f.oesterreich@sprungserver'), ':~/betrieb$ cat /tmp/uebergabe.txt\n',
    'Für Herrn ', V('René Weißgärber'), ' wurde ein Ersatzgerät vorbereitet.\n',
    'Versand an: ', V('René Weißgärber'), ', ', V('Musterpfad 6c, 00000 Testhausen'), '.\n',
    'Geboren am ', V('4. Mai 1979'), '; erreichbar unter ', V('+1 (202) 555-0138'), '.\n',
    'Sein Konto lautet ', V('r.weissgaerber'), ', Rechnername ', V('NB-RW-019'), '.\n',
    'Die Entsperrphrase lautet »', V('Sieben grüne Blätter!'), '«.\n',
    'Die Antwort auf die Sicherheitsfrage ist »', V('Großmutters Garten'), '«.\n',
    'Dokument: /home/', V('rene.weissgaerber'), '/Privat/Personalbogen_', V('1979-05-04'), '.pdf\n',
    V('f.oesterreich@sprungserver'), ':~/betrieb$ cat /tmp/weitergabe.json\n',
    '{"empfaenger":"', V('René Weißgärber'), '","kontakt":"', V('rene\\u0040example.org'), '",\n',
    '  "download":"https:\\/\\/ablage.example.net\\/s\\/', V('demo_D8m2Q7'), '",\n',
    '  "zugangsdaten":{"kennung":"svc_versand","geheimnis":"', V('DemoPaket!47'), '"}}\n',
    '[INFO] Prüfsumme=9e107d9d372bb6826bd81d3542a419d6\n',
    '[INFO] Freier Speicher=', K('7052MB'), ' Dateirechte=0600 Prozesskennung=', K('3817'), '\n',
    '[INFO] Vorlage: KENNWORT=${KENNWORT} Beispielwert=<nicht gesetzt>\n',
    '[INFO] Diagnose abgeschlossen. Keine Änderungen vorgenommen.\n',
    V('f.oesterreich@sprungserver'), ':~/betrieb$ '
  ]));

  // ---------- A mail from a customer, as in the screenshot of a mail client ----------
  c.push(one('mail', 'sensitive', [
    'AW: Ersatzgerät und Zugang zur Kundenumgebung\n',
    'Von: Dr. ', V('Franziska Waldmann'), '\n',
    'An: ', V('Björn Großmann'), '\n',
    'Datum: 20. November 2026, 09:18\n',
    'Guten Morgen Herr ', V('Großmann'), ',\n',
    'bitte schicken Sie das Ersatzgerät an meine Privatanschrift:\n',
    V('Franziska Waldmann'), '\n',
    'c/o ', V('İlker Yılmaz'), '\n',
    V('Fiktivgässchen 18b, Hinterhaus, 3. OG links'), '\n',
    V('00000 Beispielstadt'), '\n',
    'Für die Zuordnung: Ich bin am ', V('neunten Oktober neunzehnhundertvierundachtzig'), ' geboren.\n',
    'Tagsüber bin ich unter ', V('null null eins fünf eins\nnull null null null null\neins zwei drei vier'), ' erreichbar.\n',
    'Meine alternative Mailadresse lautet:\n', V('franziska.waldmann@example.net'), '\n',
    'Zum Entsperren verwenden Sie bitte zunächst ', V('Herbstlaub!'), ' und\nhängen ohne Leerzeichen ', V('6047'), ' an.\n',
    'Falls die Sicherheitsfrage erscheint: Meine Antwort ist »', V('Der kleine Eisbär'), '«.\n',
    'Viele Grüße\n', V('Franziska Waldmann'), '\n',
    '> Die Rücksendung läuft unter Vorgangsnummer ', V('RET-DEMO-6047'), '\n',
    '> Ihr Benutzerkonto ', V('WERKSTATT\\fwaldmann'), '\n',
    '> Freigabelink: https://freigabe.example.net/s/', V('DEMO8qR2m7'), '?download=1\n',
    '> Einmalcode zur Freigabe: ', V('6047'), '\n',
    'Geräteübergabe\n',
    'Rechner: ', V('NB-FWM-082'), '\n',
    'Seriennr.: ', V('DEMO-8Q71-M4P9'), '\n',
    'Nachrichten-ID: lab-msg-0082\n',
    'Anhanggröße: ', K('184 KB'), ' · Ansicht: 100 %'
  ]));

  // ---------- Look-alikes that stay visible ----------
  [
    'Version 4.12.3', 'HTTP-Status 200', 'Bearbeitungszeit 427 ms', '[INFO] Bereitstellung gestartet. Version=2.14.3 Port=8443',
    '[INFO] Wiederholungsversuch erfolgreich. Status=200 Dauer=5831ms', '[INFO] Prüfung abgeschlossen: 3 Replikate, 0 Fehler, Laufzeit 42 Sekunden.',
    'Das Passwort muss mindestens acht Zeichen lang sein.', 'Bitte geben Sie Ihr Passwort ein.', 'Benutzername: erforderlich',
    'Benutzername: svc_deploy', 'Bestellung vom 12.03.2024 wurde versendet.', 'Die Telefonnummer 0800 gilt als gebührenfrei.',
    'Kennwort vergessen?', 'client_id: kundenportal', 'Anmeldeportal: https://zugang.kunde-beispiel.example.com',
    '#4827 · Anmeldung nach Gerätewechsel nicht möglich', 'Die Sicherheitsfrage lautet: Wie hieß Ihr erstes Haustier?', 'PDF · 184 KB',
    'apiVersion: v1', 'Passwort ändern', 'Authorization: Bearer ${API_TOKEN}', 'Das Kennwort wurde zurückgesetzt.', '[INFO] Verbindung zum Identitätsanbieter hergestellt',
    'Code: 200', 'state=ready', 'Seite 2 von 5', 'Das Gerät ist neu.', 'Das Gerät heißt jetzt anders.', 'Hostname: srv-payment-01',
    'Anhang: Rechnung_2024-05.pdf', 'Datei: Installationsanleitung_v2.pdf', 'Cookie: theme=dark', 'Guten Morgen, seit dem Gerätewechsel kann ich mich nicht mehr anmelden.',
    'Bitte den Zugang mit dem vorläufigen Kennwort versuchen:', 'namespace: kunde-beispielwerk', 'kind: Secret', 'type: Opaque',
    'Die Antwort auf die Sicherheitsfrage ist falsch.', 'Der Rechner läuft seit 3 Tagen.', 'Rechner: erforderlich', 'Versand an: alle Kunden',
    'Das Konto lautet auf den Kunden.', 'Seriennr.: erforderlich', 'Quelle: https://docs.example.org/s/uebersicht', 'Link: https://git.example.net/files/Release2Beta',
    'Der Vertrag wurde am ersten Mai zweitausendzwanzig geschlossen.', 'Wir benötigen acht Tage und drei Wochen.', 'Prozesskennung=3817',
    'Die Entsperrphrase wurde geändert.', 'Das Geheimnis: Verschwiegenheit', 'Schlüssel: Wert', 'Bitte c/o weglassen.',
    '[INFO] Freier Speicher=7052MB Dateirechte=0600 Port=9443', 'Nehmen Sie zuerst Folie 1 und hängen Sie Folie 2 an.', 'verbindung: "postgresql://db.example.net:5432/portal"'
  ].forEach((t) => c.push(one('keep', 'secret', [K(t)])));

  return c;
}

function plainMail(f, l) {
  const fold = (s) => s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return fold(f) + '.' + fold(l) + '@example.org';
}

module.exports = { cases, V, K };
