# Demo files

Everything here is invented: identities, domains (`example.*`), passwords (`demo_…`), keys and numbers. Nothing works anywhere.

**To try it:** open HideSecrets, choose "Choose a folder…" and pick this folder, or drop it on the page. Text files, a network capture and screenshots are all read at once; then use "Download all (ZIP)" to get `demo-clean.zip`.

The text files are also checked by `node tests/verify.js`, which compares what the engine masks with `tests/expected/` (both levels). The screenshots are for the OCR, which runs in the browser: check them by eye.

| File | Hard cases it holds |
|---|---|
| `app-startup.env` | A startup log in a `.env` file: JDBC, MongoDB, AMQP and search URLs with passwords (`%40`-encoded), a signing key, a `passphrase` in JSON, names in quotes and in a `manager` field, an employee number, `/home/<user>/` paths |
| `login-attempts.xml` | A gateway log: login body, `Authorization`, cookies, `Set-Cookie`, SSO callback with `code` and `state`, an IPv6 source, a recovery link |
| `app-events.json` | JSON lines with keys written `api_key`, an e-mail and a phone number written with `@` and ` `, JSON inside a string, a password on two lines, a Windows account `LAB\\name`, MAC, serial, a security question and backup codes, and templates that must stay visible (`${APP_PASSWORD}`, `<REDACTED>`) |
| `backup-job.conf` | Passwords and passphrases with spaces between quotes, `sshpass -p`, repository URLs with passwords, a phone number, a person's name in a file name |
| `lab-session.log` | A terminal session: a kubeconfig, a Kubernetes `Secret`, OIDC logs (client secret, `state`, `code`, `nonce`, tokens), an IPv6 server |
| `deploy-diagnostics.txt` | A long diagnostic: Git and Docker credentials, Terraform variables and outputs (`"sensitive": true`), a YAML block secret, an nginx-style `password "…"`, an access log; and public values that stay visible (certificate fingerprint, ACME challenge) |
| `network-capture.har` | A network capture: login form, JWT, cookies, OAuth `state`, `nonce` and `code` in the query and in the parameters, a body kept in base64, a WebSocket message; and a PKCE `code_challenge` and cache validators that stay visible |
| `screenshots/*.jpg` | The same kind of content as images: a support export, incident notes (an alias in Chinese, an address written with `[at]`, an e-mail with spaced letters) and a terminal |
