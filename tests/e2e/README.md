# Screenshot leak tests (end to end)

These tests check what a user would get: a screenshot dropped on `index.html`, read by the page's own OCR, masked, and downloaded. They run in real browsers (Chromium and Firefox, through Playwright). Every person, value and company in them is invented.

For each screenshot:

1. A template of [`templates/`](templates/) is rendered, with every value to mask marked `data-s="kind"` and every text that must stay visible marked `data-k`. It is rendered three times: as is, with the secrets' letters transparent, and with the kept texts' letters transparent. The differences give the exact ink of each secret and of each kept text.
2. The image is dropped on the page at the "Secrets and sensitive data" level, and the page reads and masks it as usual.
3. The clean image is downloaded with the page's own button.
4. The checks:
   - every letter of every secret is under a mask (a one-pixel sliver of an edge is tolerated);
   - every mask is really painted in the download;
   - reading the download again finds no piece of a secret where it was;
   - no text marked to stay visible is masked.

The two German demo screenshots of [`examples/demo/screenshots/`](../../examples/demo/screenshots/) are checked the same way. Their truth is the list of values to find in what the OCR read, in [`templates.mjs`](templates.mjs).

## Running them

```bash
cd tests/e2e
npm ci
npx playwright install chromium firefox
npm test                                  # one variant of each screenshot, in Chromium
node run.mjs --full --browsers=chromium,firefox
node run.mjs --only=ticket                # one screenshot
npm run record                            # also rewrite the OCR replays of tests/replay/
```

The report is written to `out/report.html` (each image after masking, and what is wrong with it), with `out/results.json`.

## What the variants change

`--full` adds four renderings per template, drawn with a fixed seed from:

- display scale: 1, 1.5 or 2;
- theme: light or dark;
- text size: 13, 15 or 17 px;
- image format: PNG, JPEG or WebP.

The fonts (Noto Sans, Noto Sans Mono and Noto Serif) come from npm, so the letters are the same on every machine. The way a system draws their edges is not (macOS and Linux differ), and the OCR then reads some words differently: see Accepted misses.

## Replays

`npm run record` saves what the OCR read on each base variant (words, their boxes and the box of each character) with the truth, in [`tests/replay/`](../replay/). `node tests/verify.js` masks those words again in Node, without a browser, on every push. It catches a change to the engine that would uncover a secret the OCR did read.

Record again when the OCR changes: `verify.js` says so when a replay was made with another build of `ocr/`.

## Accepted misses

The OCR misreads a page drawn on macOS and on Linux in different places, so each system has its own list of the misses accepted for now, each with its reason: [`known-misses.json`](known-misses.json) for macOS, where the page is developed, and [`known-misses.linux.json`](known-misses.linux.json) for the GitHub runners (their results repeat run after run). A run fails on a new miss. On macOS it also fails on a listed miss that no longer happens, so that list can only shrink; on Linux a miss that no longer happens is only reported, because a change to the page may fix a miss before a Linux run has seen it. The Linux list covers the smoke variants only: the nightly full run is report-only until every variant is listed (download its `out/` artifact to see the misses). Each image is read on a fresh page, because the OCR keeps some state from one image to the next. That keeps the results independent of the order the images are read in.

## Adding a screenshot

Copy a template, keep `base.css` and `template.js`, and mark the values with `data-s` and the look-alikes with `data-k`. Use invented data only, with `example.org`, `example.net` or `example.com` domains. Add it to `TEMPLATES` in [`templates.mjs`](templates.mjs), run it, and read the report.
