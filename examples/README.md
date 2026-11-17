# Examples

Everything here is invented: identities, domains (`example.*`), passwords, keys and numbers. Nothing works anywhere.

| Folder | What it is for |
|---|---|
| [`cases/`](cases/) | Small files, one subject each (a kubeconfig, a netrc file, a German mail, private IP addresses…). Each rule is shown on its own, with the look-alikes that must stay visible. `node tests/verify.js` compares what the engine masks with [`tests/expected/`](../tests/expected/), so these files are the reference for what is detected. |
| [`demo/`](demo/) | A realistic batch to drop on the page in one gesture: long files of many formats, a network capture and screenshots for the OCR. It shows the tool on a whole folder. The text files are also checked by the tests; the screenshots are checked by eye. See its [README](demo/README.md). |

To add a case, put the file in `cases/` and run `node tests/verify.js --update`, then read the new file in `tests/expected/` once.
