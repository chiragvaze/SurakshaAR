# SurakshaAR — Suraksha Drishti

**SIH 2026 · PS 26041 — AR-Based Vocational Training Simulator for Industrial Safety in Jharkhand's Mining & Manufacturing Sector**

Offline-first safety training prototype:
- Hindi / Santali / English
- Fire & Explosion and Gas Leak & Confined Space modules
- scored assessments
- a locally signed QR certificate that can be verified without network
- a Retention Guard with a +7-day demo
- a seeded supervisor dashboard

The specification lives in [`docs/`](docs/README.md). Start with [`docs/00_MASTER_SPEC.md`](docs/00_MASTER_SPEC.md).

## Status

| Phase | Scope | State |
|---|---|---|
| 1 | Web/business layer (`web-app/`) | Implemented |
| 2 | Unity AR (`unity-ar/`) | Not started |
| 3 | Android shell, APK, release (`android-shell/`) | Not started |

## Run the web app (Phase 1)

Requires Node.js 20+. The app itself has no runtime dependencies.

```bash
cd web-app
npm install        # dev-only: jsqr, used by tests to decode generated QR codes
npm start          # http://127.0.0.1:5173
npm test           # unit + integration tests (node:test)
```

To test on a phone on the same Wi-Fi, run `npm run start:lan` and open `http://<computer-LAN-IP>:5173/`.

The app also runs by opening `web-app/index.html` directly (`file://`), which is how it will load inside the Android WebView.

After the page has loaded, the whole flow works without network: language → worker → training → result → certificate → verify. When the app is served from `localhost`, a service worker also allows offline reloads.

### Demo path
1. **Start Training** → choose a language → enter worker name and ID.
2. **Fire & Explosion** → Start → answer 3 steps → Result.
3. **Get Certificate** → QR + certificate code.
4. **Verify this certificate** → **Verify** → `VALID`.
5. **Change 1 character (demo)** → **Verify** → `INVALID`.
6. **Gas Leak & Confined Space**: same engine, same flow.
7. Home → **Supervisor dashboard** → **Simulate +7 Days** → risk and status rise, `Refresher Due` appears.

## ⚠ Security disclosure: demo signature only

Certificates are signed with **HMAC-SHA256 using a secret embedded in the app** (first 16 hex characters). This demonstrates tamper detection only: changing any character makes verification fail.

**It is not real security.** Anyone can extract the secret from the app and forge certificates.

A production system must:
- sign server-side with an asymmetric key (the private key never ships to devices);
- verify with the public key;
- use HTTPS, key management, an audit trail and revocation.

See [`docs/04_SECURITY.md`](docs/04_SECURITY.md) and [`docs/09_CERTIFICATE_QR.md`](docs/09_CERTIFICATE_QR.md). No real credentials or API keys are in this repository.

## Privacy

Only the worker name and worker ID are collected. Everything is stored on the device (`localStorage` key `sa_v1`), and nothing is sent anywhere. See [`docs/16_PRIVACY.md`](docs/16_PRIVACY.md).

## Repository layout

```text
docs/       specification, decision log, scenario content (source of truth)
web-app/    Phase 1 web/business layer (vanilla HTML/CSS/JS)
```
