# HideSecrets

Mask the secrets and sensitive data in a log, a HAR file, text copied from a console, or a batch of screenshots **before** you share them with colleagues or hand them to an AI assistant. Everything happens in your browser: the page cannot send anything over the Internet.

**Try it now, nothing to install: <https://edumoz.github.io/HideSecrets/>** (the page is served by GitHub Pages, screenshots included). GitHub serves the page; the files you drop and the text you paste stay in your browser. That online copy has no [product settings](#product-settings-optional), and it is made for a computer with a mouse (see [Known limitations](#known-limitations)). To recognize your own product, or to be sure of the exact code that runs, use a local copy: see [Getting started](#getting-started).

## Why

When an installation goes wrong, people send logs, console output, HAR files and screenshots so that someone can see what is blocking. These often contain passwords, tokens, keys, email addresses or names, and nobody notices.

HideSecrets finds these values, replaces them with readable placeholders (`[SECRET_1]`, `[EMAIL_2]`…) or blacks them out on images, and keeps visible what helps diagnosis: private IP addresses, ports, host names, error messages, versions.

## What it looks like

The home page: choose what to mask and which categories of sensitive data, then drop files or an archive, paste text, or paste a screenshot. The box **Words to always mask** takes a project, customer or site name that nothing else can guess.

![The home page: masking level, categories of sensitive data and the drop zone](docs/screenshot-home.webp)

A log file: each detected value is highlighted in the text and listed on the right, where you can uncheck it.

![A log file under review: detected values highlighted in the text and listed on the right](docs/screenshot-text.webp)

A screenshot of an invented support session: secrets, names, contact details, bank and card numbers, devices and paths are blacked out, and the detections are listed on the right. The file list on the left keeps every file of the batch one click away.

![A screenshot under review: masked values on the image, detections listed on the right](docs/screenshot-image.webp)

Before and after, on the same invented screenshot: the original on the left, the version to share on the right.

![The same invented screenshot before and after masking](docs/screenshot-before-after.webp)

All the screenshots use invented data.

## Getting started

No installation, no dependencies.

- **Online**: open <https://edumoz.github.io/HideSecrets/>. Text, files and screenshots all work there (the OCR is served with the page). It always runs the latest version of the `main` branch.
- **For text and files** (logs, HAR, configuration, archives): open `index.html` in a recent browser (Firefox, Chrome, Edge, Safari).
- **For screenshots**, reading the text in the image (OCR) needs the page to be served from a local web address:

  ```bash
  python3 -m http.server 8765
  ```

  then open <http://localhost:8765/>.

The "a fake .log", "a fake .har" and "a fake screenshot" buttons let you try it right away with invented data, and the [`examples/demo/`](examples/demo/) folder can be dropped on the page to try a whole batch.

## How to use it

1. **Choose what to mask**: "Secrets only", or "Secrets and sensitive data" (see below).
2. **Give it some content**: paste text into the text box, **paste a screenshot** (⌘V / Ctrl+V anywhere on the page), drop one or more files or archives (see [Accepted files](#accepted-files)), or choose or drop a folder.
3. **Review.** Each detected value is highlighted in the text or blacked out on the image, and listed on the right. Uncheck what should stay readable; a decision applies to every occurrence of the same value in that file. On an image, draw a rectangle to mask an area by hand, or click an area to turn it on or off. **Point at a mask** (or at its row in the list) to see what it hides: the mask fades out while the pointer is on it, the matching row is highlighted, and nothing is unchecked. This is only on screen: the downloaded image always has its masks.
4. **Get the result**: "Copy clean text" for pasted text, "Download clean version" for a file, or "Download all (ZIP)" when there are several. The originals are never changed. In a batch, the text files share one numbering: `[SECRET_2]` is the same value in every file, so a reader can follow it from one file to the next.

### Choosing what to mask

- **Secrets only** (default): passwords, tokens, keys, session cookies… Secrets are always masked.
- **Secrets and sensitive data**: also email addresses, person names, logins, public IPs, phone numbers, IBAN and card numbers, devices and locations, user names in paths, the customer domain and other domains.

At the second level, a list lets you leave a whole category visible, for example the public IPs when you debug a proxy, or the domains for a certificate problem:

- the categories are grouped (people, network and company, devices and money), every one is checked by default except the optional **Private IP addresses**, and **All** / **None** change them all at once (All includes the option);
- a change applies to every file of the batch, including those already reviewed, and replaces the boxes you clicked earlier for that category. A box you click afterwards stays as an exception;
- while a category is unchecked, a red "Not masked: …" reminder stays on screen, and its values stay listed, unchecked, so you can still mask a single one. The optional box is the exception: while it is off, private addresses are neither detected nor listed, and there is no reminder.

The level and the categories are remembered in your browser.

### Words to always mask

Nothing in a log says that `Orion` is a customer or `project-aurora` a code name, so the tool cannot guess them. List them in the box **Words to always mask** on the home page and every occurrence is masked as `[CUSTOMER_n]`.

- One entry per line, or separated by commas or semicolons. Case does not matter, and an entry can be several words (`Beispielbetrieb Nord`).
- An entry matches whole words only: `Orion` is masked in `Orion-staging-48213` and in `orion.log`, not inside `Orionis`. Entries shorter than two characters are ignored, and the first 200 are used.
- The list applies at the level **Secrets and sensitive data** (see above), and it is not affected by the people categories; only unchecking **Customer domain and listed terms** (group Network and company) turns it off. It wins over a detection of the same length, so a listed name is not relabeled as something else.
- It is remembered in this browser only (local storage), never sent anywhere. To share a list with a team or a customer, put it in `terms` of [`config.local.js`](#product-settings-optional) instead.
- It is the way to hide company and customer names in any language: they carry no label, so nothing else finds them.

### Words to never mask

The mirror of the box above: a public domain or a name that identifies nobody, which you want to keep readable in every file without unchecking it each time. Type it in the box **Words to never mask** (same format as the other box), or click **Never mask** on a row of the list (the button shows when you point at the row).

- **The whole value must match**, in any case: `docs.example.org` keeps `docs.example.org` readable, not `jane@docs.example.org` and not `example.org`. A domain also covers its subdomains: `example.org` keeps `docs.example.org` and `files.example.org` readable. `*.example.org` and `.example.org` mean `example.org`.
- **It never applies to secrets.** A password, a token or a key stays masked even if you list it. It only applies to sensitive data (names, e-mail addresses, logins, IPs, domains, devices…), so it needs the level **Secrets and sensitive data**.
- **A word that is also in Words to always mask** (or in the `terms` of the [product settings](#product-settings-optional)) stays masked.
- **Nothing disappears from the list.** A value kept readable stays listed on the right, unchecked, with a note that names the entry that keeps it and a **Remove from list** button to mask it again. While the list is not empty, a red "Not masked: words you listed to never mask" reminder stays on screen, like for a category you turned off.
- Adding or removing a word replaces what you decided by hand on its values in the files already open.
- It is remembered in this browser only (local storage). To share a list of public domains with a team, put it in `publicDomains` of the product settings.

### Reviewing many files

- **File list**: on the left, with the number of items found in each file and a ✓ once you have viewed it.
- **Choosing what goes in the ZIP**: every file has a checkbox, checked by default. Uncheck a file you do not need (a screenshot of nothing, a log of another service): it is struck through, and it stays out of the ZIP. A count above the list ("3 of 5 files are in the ZIP") and the ZIP button ("Download 3 of 5 files (ZIP)") keep track. **Exclude all** and **Include all** change every file at once; while a search is active they become **Exclude matches** and **Include matches** and only touch the matching files, so "exclude everything, then check the three you want" and "exclude every `.png`" are both quick. A file left out does not hold the ZIP back while its image is still being read, it does not take a number in the shared numbering (the `[SECRET_n]` of the other files have no gap), and you can still download it alone with "Download clean version".
- **Moving between files**: the ← → (or ↑ ↓) keys, or the arrows above the content. The content and its detections stay on screen.
- **Search**: type part of a file name above the list. Matching files are highlighted; Enter opens the next one, Shift+Enter the previous one, Escape clears the search.
- **Zoom**: the − + buttons, the `+` `-` keys, or a trackpad pinch (⌘ + scroll). Each image opens in "Fit" (`0`), which shows the whole image without enlarging a small one; "Actual size" (`1`) shows it at the size it had on screen.
- **Moving a zoomed image**: hold space and drag (the cursor becomes a hand), or swipe with two fingers on a trackpad. Without space, a drag draws a rectangle.
- **Progress**: while images are being read, the ZIP button shows how many of the images that go in it are done. The images you left out are read last.
- **An image that could not be read** (the text reader failed, or the page was opened by double-clicking the file) has nothing masked unless you draw a rectangle. Such an image is left out of the ZIP, after a confirmation that lists it, and downloading it alone asks first, so that an unmasked copy is never exported by mistake.

### Accepted files

- **Text**: logs (`.log`, rotated `.log.1`), `.txt`, `.har`, `.json`/`.jsonl`, `.env` and other settings files (`.yaml`, `.toml`, `.ini`, `.conf`, `.properties`), Terraform (`.tf`, `.tfvars`, `.tfstate`), PEM keys and certificates, shell scripts and shell history, `.sql` dumps, `.csv`/`.tsv`, e-mails (`.eml`), `.xml`, notebooks (`.ipynb`), `.md`, and files known by name (`.npmrc`, `.netrc`, `.pypirc`, `.git-credentials`, `kubeconfig`, `credentials`, `known_hosts`…).
- **Images**: PNG, JPEG, WebP, GIF, BMP.
- **Archives**: `.zip`, `.tar.gz` / `.tgz`, `.tar`, and a compressed single file such as `app.log.gz`. A support bundle is opened in the page; every text file and image inside is reviewed like a file you dropped. Anything else in the archive (a PDF, a database, a binary) is **listed under the drop zone and left out of the cleaned ZIP**: look at that list, such files may hold secrets. Encrypted and ZIP64 archives, archives inside archives, and archives above 5,000 files or 512 MB once unpacked are refused or left out.
- **Anything else** is skipped, with a message. A binary file with a text extension (for example a Keynote `.key`) is shown as "unreadable" and is not exported.

The cleaned ZIP of an archive keeps the layout and file names: `<archive>-clean/…`.

### A folder

Use "Choose a folder…" or drop the folder on the page. Everything the folder and its subfolders hold is read: images, text files (logs, XML, JSON, configuration, scripts… see [Accepted files](#accepted-files)) and archives. Hidden files are left out, except the ones known by name (`.env`, `.npmrc`…). Any other file (a PDF, a database, a binary) is **listed under the drop zone and left out of the cleaned ZIP**: look at that list, such files may hold secrets.

Every file of the folder is checked for the ZIP; uncheck the ones you do not want in it (see [Reviewing many files](#reviewing-many-files)). "Download all (ZIP)", or "Download n of m files (ZIP)" when some are left out, then gives `<folder>-clean.zip`, holding a `<folder>-clean/` folder with the same layout and the **same file names** as the original, so each cleaned file can replace its original by hand. Images in GIF or BMP format come back as PNG, so their extension changes.

Files dropped one by one go into the ZIP as `masked-screenshots/<name>` for images and `<name>-clean.<ext>` for text files. Pasted text is copied, not zipped.

### Reading speed

Reading the text in a screenshot is the slow part: one to several seconds per image. HideSecrets reads several images at the same time, one OCR worker per processor core. While images are waiting, a **Reading speed** setting appears above the file list:

- **Automatic** (default): as many workers as there are cores minus one, at most 8, so that the computer stays usable.
- **Quiet**: 2 images at a time. Slower, but the fans stay calmer and other applications stay responsive.
- **Maximum**: cores minus one, at most 12. Fastest, and the computer will get warm.

The **Pause** button stops starting new images (the ones being read finish first); **Resume** continues. The time spent paused is not counted. The choice of speed is remembered in your browser.

When the last image is read, the line under the file list shows how long the batch took, for example `307 read in 3 min 37 s (0.71 s per image, 8 workers)`.

Measured on a 16-inch MacBook Pro (Apple M5 Pro, 48 GB) with a folder of 307 screenshots:

| Workers | Time for 307 screenshots | Per image |
|---|---|---|
| 4 | 6 min 36 s | 1.29 s |
| 8 | 3 min 37 s | 0.71 s |

Doubling the workers made the batch 1.8 times faster. Reading the same folder with a single worker would take roughly 25 minutes (an estimate, not a measurement). On a computer with fewer cores the gain stops at the number of cores, and each worker holds its own copy of the OCR engine in memory; if the computer struggles, choose Quiet.

## Languages

HideSecrets reads **English, French and German**, all at once: a file that mixes them (a German mail quoting an English log) is read in each language. What depends on a language is the words that label a value (`password`, `mot de passe`, `Passwort`), the titles and greetings before a name (`Mr`, `Madame`, `Herr`), the closing formulas before a signature (`Best regards`, `Cordialement`, `Mit freundlichen Grüßen`), the names of identity documents and numbers written in groups (`Steuer-ID`, `Sozialversicherungsnummer`), month names in dates, the first names, and the national phone formats. Everything else (IP addresses, IBAN, cards, tokens, domains, MAC addresses) is the same in every language.

| | English | French | German |
|---|---|---|---|
| Secrets, one-time and recovery codes, door and Wi-Fi codes | yes | yes | yes |
| Birth date, address, identity documents, labeled numbers | yes | yes | yes |
| Names after a label, a title, a greeting or a closing | yes | yes | yes |
| Phone numbers in national format | North American | French | German |
| Screenshots (OCR) | yes | yes | yes |
| How much it has been tested | most of the examples and screenshots | most of the examples and screenshots | a fixture ([`german.txt`](examples/cases/german.txt)), a leak corpus of about 470 phrasings checked as text and as synthetic screenshots with OCR reading errors ([`tests/corpus/de.js`](tests/corpus/de.js)), and eleven screenshots masked in real browsers ([`tests/e2e`](tests/e2e/README.md)) |

"Yes" means the rule exists, not that the three languages have the same depth. English and French have been exercised the longest, on the whole example set. German has the deepest automated tests for screenshots, but it is newer in real use: expect more misses and more look-alikes taken for values, and report them.

**Reading screenshots.** The OCR engine ships with the language data of the three languages (`ocr/*.traineddata.gz`, about 4.5 MB in all) and loads them together. With German added, `ß`, `ä`, `ö` and `ü` are read correctly (without it, `Grüßen` came out as `GrüBen`), and English and French are read exactly as before, at the same speed. To read fewer languages, or others, list them in `config.local.js`: `ocrLanguages: ['eng', 'fra']`.

**Adding a language.** All the words live in one block, `LANGS`, at the top of the engine in `index.html`: one entry per language, each a list of short regular-expression fragments. Copy the `de` entry, translate the lists (the comment above it says what each one is for), add a few first names, and add a fixture such as [`examples/german.txt`](examples/cases/german.txt) with the values that must be masked and the look-alikes that must stay visible. `node tests/verify.js --update` writes the expected result, and you read it once to check it. No other code changes. For the screenshots, also drop the language's file from [tessdata_fast](https://github.com/tesseract-ocr/tessdata_fast) (`xxx.traineddata`, gzipped) in `ocr/` and add its code to `ocrLanguages`. A language that writes with another alphabet (Greek, Cyrillic, Arabic, Chinese…) and its names are only found after a label, because the "capital letter" clue does not exist in those scripts.

A new language is ready to publish when: its fixture masks every value it lists and keeps the look-alikes visible (read the expected files once, line by line); a leak corpus `tests/corpus/<code>.js`, built like the German one, passes; the existing English, French and German fixtures are unchanged by `node tests/verify.js`; a screenshot in that language (invented data) has been read in the page with its OCR data loaded; the table above says how much it was tested.

**Limits of the multilingual design.**
- **All languages are always on.** There is no language choice: a word that is a label, a title or a first name in one language is also read as such in the others, so a word can be taken for a value in a language you did not expect. Uncheck the detection, or turn the category off.
- **The interface is in English only.** Only the data being read is multilingual.
- **Without a clue, nothing is masked.** National identity numbers, postal addresses and birth dates are found only after a label in one of the three languages. Company and customer names stay visible in every language unless you list them in **Words to always mask**.
- **Names are found from a list of first names**, built mainly from English and French names, with about a hundred German ones added; an unusual first name needs a label, a title, a greeting or a closing before it.
- **Phone formats** are North American, French and German, plus the international form. Another national format is found only as an international number or after a label.
- **Screenshots**: a language whose data is not loaded in the OCR engine is read badly (accents and `ß` come out wrong, and the labels are then not recognized). Pages with columns are read less reliably than single-column pages, in any language.
- **Other languages and scripts** are not covered until someone adds them (see below). Another alphabet (Greek, Cyrillic, Arabic, Chinese…) only gets names after a label, because the "capital letter" clue does not exist there.

## What gets masked

| Level | What is masked | Placeholder |
|---|---|---|
| **Secrets only** | Passwords (including the French "mot de passe: …"), tokens, OAuth/OIDC client secrets, `Authorization` headers, session cookies, JWTs, PEM private keys, well-known API keys (AWS, GitHub, Slack, Google…), variables named `*_SECRET`, `*_PASSWORD`, `*_TOKEN`, named keys (`*_BASE_KEY`, `*_COOKIE_KEY`, `kek`…), passwords embedded in a URL (`postgres://user:PASSWORD@host`). Also: every value of a Kubernetes `Secret`, private key data in a kubeconfig, `.netrc` passwords, passwords on a command line (`curl -u user:PASSWORD`, `--password`, `mysql -pPASSWORD`, `sshpass -p`), SQL (`IDENTIFIED BY '…'`, the sensitive columns of an `INSERT`), the `password` column of a CSV, password hashes (bcrypt, argon2, crypt), license keys, PGP private keys, PIN codes, the answer to a security question (`Die Antwort auf die Sicherheitsfrage ist »…«`), a password written as several strings (`"Demo" + "Only"`) or given in two pieces in a sentence (`verwenden Sie zunächst Herbstlaub! und hängen 6047 an`), a door or Wi-Fi code given in a sentence (`le code pour entrer demain est 7391#`), one-time codes (`Your verification code is 482913`, `OTP: 771204`), tokens in the path of a reset, invite, verification or share link (`https://host/s/<token>`, also with escaped slashes in JSON), tracking cookies (`_ga`, `_gid`…), a password on the line(s) under `Mot de passe :`, long tokens in a link (`?code=…`, `state=`, `invite=` when they mix letters and digits). A value with JSON escapes (`\u0021`) is masked whole, and JSON written with `\u…` escapes (`api\u005fkey`, `name\u0040example\u002eorg`) is read decoded. Also: passwords and passphrases with spaces between quotes (French « », German »…« and „…“ too: `Die Entsperrphrase lautet »Sieben grüne Blätter!«`), the `"value"` of a secret event, Terraform outputs marked `"sensitive": true`, secrets in a YAML block, recovery and backup codes (`Ersatzcodes`, `Notfallcodes`…), and base64 bodies of a HAR that hide a secret. On images, also long random strings with no name in front. **A secret found once is masked wherever it comes back in the same text** (a password typed twice, a code repeated in the body of a mail). | `[SECRET_n]` |
| **Secrets and sensitive data** | All of the above, plus email addresses, also when written to dodge robots (`name [at] example [dot] org`), cut by the end of a line, or encoded in a link (`name%40example.com`) | `[EMAIL_n]` |
| | person names, with the user ID shown next to them (`Jane DOE`, `JANE DOE 1234567`, `Author: Jane Doe`, a chat header (`Jane Doe 09:41` alone on a line), `From:` / `To:` / `À :` headers, a name before an address in angle brackets (`Jane Doe <jane@example.org>`), the fields `operator`, `manager` and `requested by`, a first or last name given by its field (`"vorname":"Franziska"`, `nachname: Österreich`), the name after `c/o`, the name behind a `jane.doe@` address (masked wherever it is written, even without its accents), `my name is …`, particles such as `d'Aubigné`; once a name is found, its words are masked everywhere in the same file, even alone, `Jane's screen` in a video call; a name inside a file name, when it is found in the file or starts with a known first name (`Personalbogen_Jörg_Weiß_1986-03-23.pdf`: the whole name of the file, extension aside); the value of `Alias:` or `Nickname:` in any script) | `[PERSON_n]` |
| | logins shown as `account@machine` in shell prompts and terminal tabs, and Windows accounts (`ATELIER\jdoe`) (`jdoe@WS-0042`, `localadmin@WS-0042`); only a generic account on a generic machine (`admin@ubuntu-server`) stays visible. A login given by its label (`Benutzername lautet j.weiss`, `username: j.doe42`, `?user=j.weiss`) is masked when it has a dot or a digit, as a person's does (also an account named in a sentence: `Sein Konto lautet r.weissgaerber`); once found, a login is masked wherever it comes back (`ATELIER\jdoe`, then `"benutzer":"jdoe"`); a login in quotes after its label is masked when it is made of letters only (`"benutzer":"foesterreich"`); service accounts (`svc_deploy`, `terraform-runner`) and plain words (`username: required`) stay visible | `[LOGIN_n]` |
| | public IP addresses, IPv4 and IPv6 (loopback, link-local and private addresses stay visible) | `[PUBLIC_IP_n]` |
| | private IP addresses (`10.x`, `172.16–31.x`, `192.168.x`, `100.64.x`, `169.254.x`, IPv6 `fe80::` and `fd…`), **only if you tick the optional "Private IP addresses" box** (off by default); loopback, `0.0.0.0`, netmasks and multicast are never masked | `[PRIVATE_IP_n]` |
| | phone numbers, also spelled out (`zéro six, douze, trente-quatre…`, `null null eins fünf eins…`): international (`+44 7700 900123`), French (`01 99 00 12 34`, `0612345678`), German (`0171 1234567`, `(089) 123456`), North American (`(555) 010-0199`, `+1 (202) 555-0138`) | `[PHONE_n]` |
| | IBANs (checksum verified), bank card numbers (known card prefix and Luhn checksum), and the security code and expiry date of a card when a label names them (`card_cvv=…`, `expiry: 12/30`) | `[BANK_n]` |
| | devices and locations: MAC addresses, labeled serial numbers (`Serial number: …`, `Seriennr.: …`, `device_serial=…`, `S/N`, `service tag`, IMEI), devices named by a label (`Gerätename: NB-MUELLER-0815`, `Rechner: NB-RW-019`, `Das Gerät heißt …`, `computer name: …`), a machine name holding a person's name found in the file (`BER-LT-JWEISS-07`), GPS coordinates, decimal or degrees-minutes-seconds | `[DEVICE_n]` |
| | birth dates (also written out in a sentence with `geboren`: `am neunten Oktober neunzehnhundertvierundachtzig geboren`; the same date written another way elsewhere in the text is masked too, `4. Mai 1979` then `1979-05-04` in a file name), postal addresses (also under a label standing alone on its line, as in a contact card, or ending a sentence (`… an meine Privatanschrift:`), with the recipient's lines before the street), identity documents, employee numbers, tickets and booking references, cloud account, tenant, subscription and project ids (also the account inside an ARN), only when a label names them (`Passeport : 00AA00000`, `dossier Q7X9LM`, `birth_date=…`, `date of birth: …`, `Naissance : 07 décembre 1988`, `born on March 3rd, 1990`, `address="42 rue …"`; `ip_address`, `email address` and the like are left alone) | `[PERSONAL_n]` |
| | the user name in a path: `/Users/jdoe/…`, `/home/jdoe/…`, `C:\Users\jdoe\…`, `\\server\homes\jdoe\…` (`root`, `runner`, `Shared`… stay visible) | `[USERNAME_n]` |
| | the customer part of a product's host names, once described in the [product settings](#product-settings-optional) (`<service>.<vendor>.<customer>.<tld>`) | `[CUSTOMER_n]` |
| | any other domain that is not a well-known public service (identity provider, intranet…), as a whole host name | `[DOMAIN_n]` |

**In screenshots**, a table is read with its header: under a column titled with a label (`Benutzername`, `Geburtsdatum`, `IBAN`, `Passwort`…), every cell is masked with the kind the header gives, even a value that nothing else would reveal (a login without a dot, a date). A page with two columns that the OCR ran together (a ticket and its side panel) is cut at its gutter, so that a label stays above its value and no mask runs across both columns.

**The customer domain** is listed first, with one checkbox for all its occurrences. Once known, it is masked wherever it appears (`NO_PROXY=<vendor>.<customer>`, `sso.<customer>`…) and in every other file of the session.

**Other domains** come right after it, masked by default: any domain that is not a well-known public service (GitHub, Docker, Google, Microsoft, Let's Encrypt…) may belong to the customer, whatever their sector. Uncheck the ones that identify nobody.

**A given value always gets the same placeholder, and different values get different ones**, so you can still follow relationships in a cleaned file.

### Product settings (optional)

HideSecrets works without any settings. To make it recognize the product you install (its host names, its own public domains, the generic account names its installer uses), copy `config.example.js` to `config.local.js` next to `index.html` and put your own values in it. The page loads it if it exists. `config.local.js` is ignored by git, so it never ends up in a public repository. The settings can also list **internal domain endings** that are not on the usual list (`extraTlds`: `.corp`, `.intranet`…) and **words to mask wherever they appear** (`terms`: a project, customer or site name that shows up in comments and free text, which nothing else can guess). The same words can also be typed in the page, in the box **Words to always mask** under the categories (one per line or separated by commas, any case, remembered in this browser). The words are masked together with the customer domain and share its checkbox. The test data and `tests/verify.js` use `config.example.js`, which describes an invented product.

## What stays visible

- Private, local and reserved IP addresses (`10.x`, `172.16–31.x`, `192.168.x`, `127.x`…), unless you tick the optional "Private IP addresses" box
- Ports, paths, versions, error messages, HTTP status codes
- Host names without a public domain (`srv-payment-01`, `postgres.fx.svc.cluster.local`) and well-known third-party domains (image registry, GitHub, Docker…)
- Identifiers that are not secret: `client_id`, service account names, UUIDs (`crontab_id=…`), Kubernetes pod names, container image names (`owner/image`), commit hashes
- Paths to key files (`private_key: /app/secrets/hub-private-key`): the path is not the key
- Values that look like code or an ordinary word (`theme=dark`, `${VARIABLE}`, `true`)
- What you list in [Words to never mask](#words-to-never-mask) (sensitive data only, never a secret)

## Privacy

- A browser security rule (Content-Security-Policy) forbids the page from contacting any other site. Only its own address is allowed, to load the OCR engine from the `ocr/` folder.
- No file is sent and no data is stored. Only the masking level, the categories and the two lists of words (to always mask, to never mask) are remembered, in your browser.
- Exported images are re-encoded, which strips their metadata (EXIF).

You can check this yourself: open the browser's developer tools, go to the Network tab, and see that no request leaves for the outside.

## Test data

The [`examples/demo/`](examples/demo/) folder is a demo kit you can drop on the page (text files of many formats, a network capture and screenshots, see its [README](examples/demo/README.md)). The files of [`examples/cases/`](examples/cases/) are smaller, one subject each, and are what the tests check (see the [`examples/` README](examples/README.md)). **Every value is invented**:

| File | What it shows |
|---|---|
| [`install-answers.conf`](examples/cases/install-answers.conf) | An installer answers file: OIDC secret, registry and database passwords, keys, connection URLs with passwords, customer domain |
| [`install-console.txt`](examples/cases/install-console.txt) | Console output from a failing install: PostgreSQL URL with a password, `Proxy-Authorization` header, public IP, email address in a log |
| [`german.txt`](examples/cases/german.txt) | The same kinds of data in German: a support mail with titles, closing formula, tax and insurance numbers, phone formats, one-time codes, and look-alikes that stay visible |
| [`customer-email.txt`](examples/cases/customer-email.txt) | An email from a customer describing their problem and pasting a secret and passwords along the way (including one written in French) |
| [`directory-and-cloud.txt`](examples/cases/directory-and-cloud.txt) | LDAP/Active Directory entries (DN, `uid=`, SID, `sAMAccountName`), labeled cloud accounts (tenant, subscription, account, project, ARN), one-time codes, recovery codes, reset links, `git@host:path`; `client_id`, `uidNumber` and `default` stay visible |
| [`browsing.har`](examples/cases/browsing.har) | A browser network export: credentials sent at sign-in, session cookie, access token, customer domain |
| [`kubernetes.yaml`](examples/cases/kubernetes.yaml) | A kubeconfig (key data, token) and a Kubernetes `Secret`; a `ConfigMap` and a public certificate stay readable |
| [`commands.sh`](examples/cases/commands.sh) | Commands from a shell history: `curl -u`, `--password`, `mysql -p`, `sshpass`, an API key header, an exported token |
| [`netrc.conf`](examples/cases/netrc.conf) | A `.netrc` file, in its two layouts |
| [`users.csv`](examples/cases/users.csv) | A CSV export: the password column, e-mail addresses, phone numbers |
| [`dump.sql`](examples/cases/dump.sql) | A SQL dump: `IDENTIFIED BY`, `WITH PASSWORD`, password hashes and tokens in an `INSERT` |
| [`diagnostic-notes.txt`](examples/cases/diagnostic-notes.txt) | Hard cases: a name with no capital letters, an address written with `[at]`, a birth date with the month in letters, a PIN, a security answer, a password split in two strings, JSON escapes, coordinates in degrees, a network share; and look-alikes that stay visible |
| [`proxy.pac`](examples/cases/proxy.pac) | A proxy auto-config file: domains written as suffixes (`.example.test`, `*.corp.example.test`), an internal ending, a listed project name; a public service and a private address stay visible |
| [`chat-export.txt`](examples/cases/chat-export.txt) | A chat and a contact card: names with particles found from chat headers and mail headers then masked everywhere, a phone number spelled out, an e-mail cut over two lines and encoded in a link, a door code, a security answer, a password on two lines, a passport and a booking number, an address under its label, a Windows account; and look-alikes that stay visible |
| [`app.env`](examples/cases/app.env) | A settings file with `SECRET_KEY`, `JWT_SECRET_KEY`, `SECRET_KEY_BASE` and a session secret; `PRIMARY_KEY=id` and `SORT_KEY=created_at` stay readable |
| [`network-private.txt`](examples/cases/network-private.txt) | Private, loopback, CGNAT and link-local addresses, IPv4 and IPv6, netmasks and a version number: visible by default, masked with the private IP option (checked in `tests/expected/` as the `.private.txt` result) |
| [`personal-data.txt`](examples/cases/personal-data.txt) | Phone numbers, IBAN, cards, serial number, MAC, IPv6, GPS, paths with a user name, a license key, and values that must stay visible |

For each text example, demo folder included, [`tests/expected/`](tests/expected/) holds the expected result at both levels. To check that the engine still produces them:

```bash
node tests/verify.js
```

The script reads the engine straight from `index.html` and reports the first difference. After an intentional change to the rules, `node tests/verify.js --update` regenerates the expected results. **Review them before committing**: they are the reference for what must be masked.

The same script also builds small archives in memory (zip, tar.gz, gz) and checks that the reader unpacks them, cleans their paths, reports encrypted entries and stops an oversized one.

It also runs two checks aimed at leaks rather than at the expected text:

- **Leak corpora** ([`tests/corpus/`](tests/corpus/)): invented values in realistic phrasings, and look-alikes that must stay visible. Every character of every value must be masked:
  - as text, at the levels that must mask it, with LF and CRLF line endings;
  - as a synthetic screenshot, laid out as OCR words in a monospace and a proportional font, with the reading errors seen on real screenshots ([`tests/lib/mutate.js`](tests/lib/mutate.js)).

  `node tests/verify.js --report` prints, for each kind of value, how it survives each reading error, the ones not yet enforced included.
- **OCR replays** ([`tests/replay/`](tests/replay/)): what the OCR read on real screenshots, recorded by the end-to-end tests, masked again in Node.

**Screenshots, end to end** ([`tests/e2e/`](tests/e2e/README.md)): invented screenshots are rendered in Chromium and Firefox, dropped on the page, read by its OCR, masked and downloaded. The download is then checked: every secret under a mask, every mask painted, nothing readable left, and the look-alikes visible. They run in CI on changes to the page or the OCR, and every night. To run them locally:

```bash
cd tests/e2e && npm ci && npx playwright install chromium firefox && npm test
```

## Known limitations

The tool helps you review; it does not guarantee that nothing is left. Always check the result before sharing it.

- **Phones and tablets**: not designed for touch yet. The page expects a mouse and a keyboard: on an image, a drag draws a rectangle (it takes over the finger's scroll), moving a zoomed image needs the space key, and pointing at a mask to see what it hides has no touch equivalent. Use a computer.

- **Screenshots**: detection depends on how well the OCR reads the image (small text, low contrast). Each image is read twice, the second time to catch light text on colored panels, which takes one to two seconds per image; a picture that mixes light text on dark and dark text on light (a line selected in a terminal) is read a third time on a copy where those bands are inverted. A page with columns (a ticket and its side panel, a chat and its profile card) confuses the usual reading, which runs the columns together and garbles some lines: when it leaves several words of low confidence, the image is read once more in a mode that looks for text wherever it is, and, if the page has a clear gutter, the columns are then read one under the other, so that a label stays above its value. Several images are read at the same time (see [Reading speed](#reading-speed)), and the one on screen is read first. Text smaller than about 14 pixels is read badly (a lost `@`, `_`, `.` or `&`, whole words missing): the tests show it at 13 pixels. Take the capture larger, or zoom in before capturing. Draw a rectangle over anything that was missed.
- **Public values** (a certificate fingerprint, an ACME challenge, a PKCE `code_challenge`) stay visible on purpose. A name glued inside a file name (`dossier_Jane_Doe_1987-09-21.tar.gz`) is recognized only when the same name appears elsewhere in the file, or when it starts with a known first name.
- **OCR reading errors**: the engine tolerates the common ones, which the tests reproduce:
  - a space before `://` or after `//`, or two words glued together;
  - a colon lost after a label, or a cookie's header misread;
  - a label and its value read as two separate blocks (a form, a profile card);
  - `ß` read as `B` (or `R` inside a word: `GroBmann`, `WeiRgarber`), `0` read as `O` or `8` as `B` in an IBAN, `cl` read as `d`;
  - a `0` read as `@` (`NB-RW-@19`, `%4@`), a scheme read as `postgresq]://`, a closing `«` read as `e` (`Eisbäre.`), a space put after a symbol inside a password (`Demo! Föhn73#Grün`), the escaped slashes of a link in JSON cut from `https:`;
  - a secret variable's name misread by one letter (`DB_PASSHORT=…`);
  - a word's box that stops short of its letters, or one read twice too tall;
  - `ü` read as `ii` (`Schliissel`), a label's colon read as `®`, a `!` read as `|`, a `_` lost between two names (`JôrgWeiß`);
  - OCR noise (`|`, `~`, `EEE` read on a border) next to a value, and specks read as lines of one or two characters across the image (`5 … 5`), which would join a sentence's rows to other panels;
  - the line of a postcode read on the same row as a word of the panel beside it (`Gestern 00000 Beispielstadt`).

  Others are not caught. Two panels side by side with a narrow gutter (a mail list beside a message) are read as one text, row by row: a value that spans two rows (a date written out in words) can be cut by the other panel's words between them. A dot lost in `l.hoffmann` makes it look like a word. Letters read wrong inside a label hide what it names (`SMTP_KENNWORT=` read as `SMTP_KENNWORIE`). A label or a value the OCR did not read at all leaves nothing to find. The OCR's German data has no `İ` or `ı`: a name with them is read wrong (`İlker Yılmaz` comes out as `ofa ker Yilmaz`); in an address block the recipient's lines are masked anyway, unless they name a company. The tests list such cases in [`tests/e2e/known-misses.json`](tests/e2e/known-misses.json).
- **Tables in screenshots**: only a table whose header row the OCR reads as labels is read by column; without a header, or with its header misread, its cells are read as text, and only what text rules find is masked (names, e-mail addresses, IBANs).
- **Person names**: found from a list of common first names, from words in capitals followed by an identifier, or after a label such as `Author:`. A name with an unusual first name and no such clue is missed. A street named after a person (`Victor Hugo Avenue`) is masked too.
- **Other domains**: a public service missing from the built-in list is masked by default; uncheck it. A domain without a usual ending (`.com`, `.fr`, `.de`…) is not detected: list its ending in `extraTlds` of your product settings. Domains written as a suffix (`.example.com`, `*.example.com`, as in proxy auto-config files) are detected like the others.
- **Decisions on single values** count for one file and are lost when the page is reloaded. To keep a value readable everywhere, and for good, list it in [Words to never mask](#words-to-never-mask).
- **Authentication parameters in URLs** (`state=`, `code=` in an SSO callback): masked only when the value is long and mixes letters and digits, so that `code=200` or `state=ready` stay readable.
- **Chat headers**: a name alone on a line with a time is taken for a person (`Scheduled Backup 02:00` too): uncheck it, or turn the category off.
- **A four-part version number** (`1.84.2.0`) can be mistaken for a public IP: uncheck it.
- **Not detected**: national identity numbers, postal addresses and birth dates that no label (or, for a birth date, the word `geboren`) announces, and any value with no clue around it. A short plain word is never chased through a text as a login (`info`). Phone-number patterns can match some long numbers: uncheck them, or turn the category off.
- **Documents** (PDF, Word, Excel, PowerPoint), Outlook `.msg` mail files (save the mail as `.eml` or paste its text), video, network captures and password-manager exports are not read. Do not share them through this tool.
- **Encoded text**: terminal colors, quoted-printable mail (`=3D`, lines cut with `=`) and simple HTML tags are read through before the rules apply. A mail part in base64 is decoded and read; if a secret is inside, the whole encoded part is masked (not just the secret). Other encodings (a secret written in hexadecimal or base64 inside a log line, for example) are not decoded.
- **Very short passwords** (three characters or fewer) in a connection URL are not masked.
- **Very large files** (HAR files of several tens of MB): the display can slow down.

## Repository layout

```text
index.html          the page: interface, detection engine and archive reader (inside <script id="engine">)
config.example.js   example product settings (copy to config.local.js, which is not published)
assets/               the logo (header) and the page icons
ocr/                Tesseract.js OCR engine and language data (English, French, German), with their licenses
examples/           invented test data: cases/ (one subject per file, checked by the tests) and demo/ (a realistic batch to drop on the page)
tests/verify.js     checks the engine against the test data, the leak corpora and the OCR replays
tests/expected/     expected results, per example and per level
tests/corpus/       leak corpora: invented values in realistic phrasings, per language
tests/lib/          the engine loader, synthetic screenshots with OCR reading errors, replay checks
tests/replay/       what the OCR read on real screenshots, with the truth about them
tests/e2e/          screenshot tests in real browsers (Playwright), with their templates
docs/               screenshots used in this README (invented data)
LICENSE             Mozilla Public License 2.0
```

## Third-party components

The `ocr/` folder contains [Tesseract.js](https://github.com/naptha/tesseract.js) and [tesseract.js-core](https://github.com/naptha/tesseract.js-core) 7.0.0, plus the English, French and German language data from [tessdata_fast](https://github.com/tesseract-ocr/tessdata). They are redistributed unchanged under the [Apache License 2.0](ocr/LICENSE). See [`ocr/NOTICE.md`](ocr/NOTICE.md) for the details and the notices of the small libraries they bundle.

## The logo

`assets/logo.png` is the logo of the project, shown in the header. The page icon (`assets/favicon.svg`, `assets/favicon-48.png`, `assets/apple-touch-icon.png`) is the same drawing on a soft background. Replace these files to change them.

## License

HideSecrets is distributed under the [Mozilla Public License 2.0](LICENSE). The third-party components in `ocr/` keep their own license (see above).
