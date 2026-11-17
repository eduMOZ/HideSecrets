# Third-party components in this folder

The files in this folder are not part of HideSecrets itself. They are redistributed unchanged, under their own license.

| Files | Component | Version | License |
|---|---|---|---|
| `tesseract.min.js`, `worker.min.js` | [Tesseract.js](https://github.com/naptha/tesseract.js) | 7.0.0 | Apache License 2.0 |
| `tesseract-core-*.js`, `tesseract-core-*.wasm` | [tesseract.js-core](https://github.com/naptha/tesseract.js-core) | 7.0.0 | Apache License 2.0 |
| `eng.traineddata.gz`, `fra.traineddata.gz`, `deu.traineddata.gz` | English, French and German language data from [tessdata_fast](https://github.com/tesseract-ocr/tessdata_fast), compressed with gzip, otherwise unchanged | | Apache License 2.0 |

- [`LICENSE`](LICENSE) is the text of the Apache License 2.0, as shipped with Tesseract.js.
- `tesseract.min.js` and `worker.min.js` also bundle small libraries under the MIT and BSD-3-Clause licenses. Their notices are in [`tesseract.min.js.LICENSE.txt`](tesseract.min.js.LICENSE.txt) and [`worker.min.js.LICENSE.txt`](worker.min.js.LICENSE.txt), as published with Tesseract.js.
