# HideSecrets

Mask the secrets and sensitive data in a log, a HAR file, text copied from a console, or a batch of screenshots **before** you share them with colleagues or hand them to an AI assistant. Everything happens in your browser: the page cannot send anything over the Internet.

## Why

When an installation goes wrong, people send logs, console output, HAR files and screenshots so that someone can see what is blocking. These often contain passwords, tokens, keys, email addresses or names, and nobody notices.

HideSecrets finds these values, replaces them with readable placeholders (`[SECRET_1]`, `[EMAIL_2]`…) or blacks them out on images, and keeps visible what helps diagnosis: private IP addresses, ports, host names, error messages, versions.

## What it looks like

A log file: each detected value is highlighted in the text and listed on the right, where you can uncheck it.

![A log file under review: detected values highlighted in the text and listed on the right](docs/screenshot-text.jpg)

A batch of screenshots, zoomed in on one: secrets, logins and domains are blacked out, while the private IP, the key file path and the public registry stay readable.

![A batch of screenshots: file list on the left, a zoomed configuration with masked values in the middle, detections on the right](docs/screenshot-batch.jpg)

Searching a file name in the batch: an identity provider page, where the portal domain and the signed-in person's name and ID are masked.

![The file search highlighting one screenshot of an identity provider portal, with its domain and the person's name masked](docs/screenshot-search.jpg)

Leaving a category of sensitive data visible: a red reminder shows what is not masked.

![The list of categories with "Other domains" unchecked and the "Not masked" reminder](docs/screenshot-categories.jpg)

All the screenshots use invented data.

## Getting started

No installation, no dependencies.

- **For text and files** (logs, HAR, configuration): open `index.html` in a recent browser (Firefox, Chrome, Edge, Safari).
- **For screenshots**, reading the text in the image (OCR) needs the page to be served from a local web address:

  ```bash
  python3 -m http.server 8765
  ```

  then open <http://localhost:8765/>.

The "a fake .log", "a fake .har" and "a fake screenshot" buttons let you try it right away with invented data.

## How to use it

1. **Choose what to mask**: "Secrets only", or "Secrets and sensitive data" (see below).
2. **Give it some content**: paste text into the text box, drop one or more files (`.log`, `.txt`, `.har`, `.json`, images), or choose or drop a folder of screenshots.
3. **Review.** Each detected value is highlighted in the text or blacked out on the image, and listed on the right. Uncheck what should stay readable; a decision applies to every occurrence of the same value in that file. On an image, draw a rectangle to mask an area by hand, or click an area to turn it on or off.
4. **Get the result**: "Copy clean text" for pasted text, "Download clean version" for a file, or "Download all (ZIP)" when there are several. The originals are never changed.

### Choosing what to mask

- **Secrets only** (default): passwords, tokens, keys, session cookies… Secrets are always masked.
- **Secrets and sensitive data**: also email addresses, person names, logins, public IPs, the customer domain and other domains.

At the second level, a list lets you leave a whole category visible, for example the public IPs when you debug a proxy, or the domains for a certificate problem:

- every category is checked by default;
- a change applies to every file of the batch, including those already reviewed, and replaces the boxes you clicked earlier for that category. A box you click afterwards stays as an exception;
- while a category is unchecked, a red "Not masked: …" reminder stays on screen, and its values stay listed, unchecked, so you can still mask a single one.

The level and the categories are remembered in your browser.

### Reviewing many files

- **File list**: on the left, with the number of items found in each file and a ✓ once you have viewed it.
- **Moving between files**: the ← → (or ↑ ↓) keys, or the arrows above the content. The content and its detections stay on screen.
- **Search**: type part of a file name above the list. Matching files are highlighted; Enter opens the next one, Shift+Enter the previous one, Escape clears the search.
- **Zoom**: the − + buttons, the `+` `-` keys, or a trackpad pinch (⌘ + scroll). Each image opens in "Fit" (`0`), which shows the whole image without enlarging a small one; "Actual size" (`1`) shows it at the size it had on screen.
- **Moving a zoomed image**: hold space and drag (the cursor becomes a hand), or swipe with two fingers on a trackpad. Without space, a drag draws a rectangle.
- **Progress**: while images are being read, the ZIP button shows how many are done.

### A folder of screenshots

Use "Choose a screenshot folder…" or drop the folder on the page. Every image in the folder and its subfolders is read; other files (notes, documents) and hidden files are left out.

"Download all (ZIP)" then gives `<folder>-clean.zip`, holding a `<folder>-clean/` folder with the same layout and the **same file names** as the original, so each masked image can replace its original by hand. Images in GIF or BMP format come back as PNG, so their extension changes.

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

## What gets masked

| Level | What is masked | Placeholder |
|---|---|---|
| **Secrets only** | Passwords (including the French "mot de passe: …"), tokens, OAuth/OIDC client secrets, `Authorization` headers, session cookies, JWTs, PEM private keys, well-known API keys (AWS, GitHub, Slack, Google…), variables named `*_SECRET`, `*_PASSWORD`, `*_TOKEN`, named keys (`*_BASE_KEY`, `*_COOKIE_KEY`, `kek`…), passwords embedded in a URL (`postgres://user:PASSWORD@host`). On images, also long random strings with no name in front. | `[SECRET_n]` |
| **Secrets and sensitive data** | All of the above, plus email addresses | `[EMAIL_n]` |
| | person names, with the user ID shown next to them (`Jane DOE`, `JANE DOE 1234567`, `Author: Jane Doe`, `Jane's screen` in a video call) | `[PERSON_n]` |
| | logins shown as `account@machine` in shell prompts and terminal tabs (`jdoe@WS-0042`, `localadmin@WS-0042`); only a generic account on a generic machine (`admin@ubuntu-server`) stays visible | `[LOGIN_n]` |
| | public IP addresses | `[PUBLIC_IP_n]` |
| | the customer part of a product's host names, once described in the [product settings](#product-settings-optional) (`<service>.<vendor>.<customer>.<tld>`) | `[CUSTOMER_n]` |
| | any other domain that is not a well-known public service (identity provider, intranet…), as a whole host name | `[DOMAIN_n]` |

**The customer domain** is listed first, with one checkbox for all its occurrences. Once known, it is masked wherever it appears (`NO_PROXY=<vendor>.<customer>`, `sso.<customer>`…) and in every other file of the session.

**Other domains** come right after it, masked by default: any domain that is not a well-known public service (GitHub, Docker, Google, Microsoft, Let's Encrypt…) may belong to the customer, whatever their sector. Uncheck the ones that identify nobody.

**A given value always gets the same placeholder, and different values get different ones**, so you can still follow relationships in a cleaned file.

### Product settings (optional)

HideSecrets works without any settings. To make it recognize the product you install (its host names, its own public domains, the generic account names its installer uses), copy `config.example.js` to `config.local.js` next to `index.html` and put your own values in it. The page loads it if it exists. `config.local.js` is ignored by git, so it never ends up in a public repository. The test data and `tests/verify.js` use `config.example.js`, which describes an invented product.

## What stays visible

- Private, local and reserved IP addresses (`10.x`, `172.16–31.x`, `192.168.x`, `127.x`…)
- Ports, paths, versions, error messages, HTTP status codes
- Host names without a public domain (`srv-payment-01`, `postgres.fx.svc.cluster.local`) and well-known third-party domains (image registry, GitHub, Docker…)
- Identifiers that are not secret: `client_id`, service account names, UUIDs (`crontab_id=…`), Kubernetes pod names, container image names (`owner/image`), commit hashes
- Paths to key files (`private_key: /app/secrets/hub-private-key`): the path is not the key
- Values that look like code or an ordinary word (`theme=dark`, `${VARIABLE}`, `true`)

## Privacy

- A browser security rule (Content-Security-Policy) forbids the page from contacting any other site. Only its own address is allowed, to load the OCR engine from the `ocr/` folder.
- No file is sent and no data is stored. Only the masking level and the categories are remembered, in your browser.
- Exported images are re-encoded, which strips their metadata (EXIF).

You can check this yourself: open the browser's developer tools, go to the Network tab, and see that no request leaves for the outside.

## Test data

The [`examples/`](examples/) folder holds realistic files in which **every value is invented**:

| File | What it shows |
|---|---|
| [`install-answers.conf`](examples/install-answers.conf) | An installer answers file: OIDC secret, registry and database passwords, keys, connection URLs with passwords, customer domain |
| [`install-console.txt`](examples/install-console.txt) | Console output from a failing install: PostgreSQL URL with a password, `Proxy-Authorization` header, public IP, email address in a log |
| [`customer-email.txt`](examples/customer-email.txt) | An email from a customer describing their problem and pasting a secret and passwords along the way (including one written in French) |
| [`browsing.har`](examples/browsing.har) | A browser network export: credentials sent at sign-in, session cookie, access token, customer domain |

For each example, [`tests/expected/`](tests/expected/) holds the expected result at both levels. To check that the engine still produces them:

```bash
node tests/verify.js
```

The script reads the engine straight from `index.html` and reports the first difference. After an intentional change to the rules, `node tests/verify.js --update` regenerates the expected results. **Review them before committing**: they are the reference for what must be masked.

For screenshots, use the "a fake screenshot" button on the page.

## Known limitations

The tool helps you review; it does not guarantee that nothing is left. Always check the result before sharing it.

- **Screenshots**: detection depends on how well the OCR reads the image (small text, low contrast). Each image is read twice, the second time to catch light text on colored panels, which takes one to two seconds per image. Several images are read at the same time (see [Reading speed](#reading-speed)), and the one on screen is read first. Draw a rectangle over anything that was missed.
- **Person names**: found from a list of common first names, from words in capitals followed by an identifier, or after a label such as `Author:`. A name with an unusual first name and no such clue is missed. A street named after a person (`Victor Hugo Avenue`) is masked too.
- **Other domains**: a public service missing from the built-in list is masked by default; uncheck it. A domain without a usual ending (`.com`, `.fr`, `.de`…) is not detected.
- **Decisions on single values** count for one file and are lost when the page is reloaded.
- **Authentication parameters in URLs** (`state=`, `code=` in an SSO callback): not masked.
- **IPv6**: not handled. A four-part version number (`1.84.2.0`) can be mistaken for a public IP: uncheck it.
- **Very large files** (HAR files of several tens of MB): the display can slow down.

## Repository layout

```text
index.html          the page: interface and detection engine (inside <script id="engine">)
config.example.js   example product settings (copy to config.local.js, which is not published)
ocr/                Tesseract.js OCR engine and language data (English, French), with their licenses
examples/           invented test data
tests/verify.js     checks the engine against the test data
tests/expected/     expected results, per example and per level
docs/               screenshots used in this README (invented data)
LICENSE             Mozilla Public License 2.0
```

## Third-party components

The `ocr/` folder contains [Tesseract.js](https://github.com/naptha/tesseract.js) and [tesseract.js-core](https://github.com/naptha/tesseract.js-core) 7.0.0, plus the English and French language data from [tessdata](https://github.com/tesseract-ocr/tessdata). They are redistributed unchanged under the [Apache License 2.0](ocr/LICENSE). See [`ocr/NOTICE.md`](ocr/NOTICE.md) for the details and the notices of the small libraries they bundle.

## License

HideSecrets is distributed under the [Mozilla Public License 2.0](LICENSE). The third-party components in `ocr/` keep their own license (see above).
