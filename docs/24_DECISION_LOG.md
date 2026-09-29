# Decision Log

## D-001 — Web first
The business layer is built before Unity so the product journey can be tested independently of AR integration.

## D-002 — Unity only for AR
The architecture treats Unity as the AR renderer/engine, not the entire application.

## D-003 — Local-first
Training, scoring and certificate verification must not depend on network availability.

## D-004 — Seeded dashboard
A real backend is not required for the hackathon prototype.

## D-005 — Demo HMAC
Client-side HMAC is acceptable only as a demonstration mechanism and must be disclosed as non-production security.

## D-006 — Shared scenario engine
Fire and Gas must use one content/assessment engine to avoid duplicated logic.

## D-007 — +7-day simulation
The prototype demonstrates retention through logical time rather than changing the phone clock.

## D-008 — Scope protection
Advanced AI, cloud, enterprise authentication and additional domains are deferred unless the core demo is already stable.

## D-009 — Unity fallback
If library integration becomes a schedule blocker, the two-app deep-link fallback preserves the demonstrable training result flow.

## D-010 — Scenario display text lives in the i18n dictionaries (Phase 1)
`25_SCENARIO_CONTENT.json` defines module/step/option IDs, titles and correct answers, but no prompt or option wording. The JSON stays the single source of truth for structure and correct answers. Display text is keyed by those IDs in `web-app/js/i18n/strings.js` (`scn.<stepId>.prompt`, `scn.<stepId>.opt.<optionId>`, `scn.<stepId>.why`). The scenario validator rejects a module whose keys have no English text. The wording was written for the prototype and should be reviewed by a safety SME. Unity (Phase 2) should reuse the same keys.

## D-011 — Web app is vanilla JS classic scripts, zero runtime dependencies
There are no ES modules, no bundler and no runtime `fetch()`, so the same files run from `http://localhost`, `file://` and Android WebView assets (Phase 3). The scenario JSON is embedded as `web-app/js/data/scenarios.js` by `npm run sync:scenarios`, and a unit test fails if it drifts from `docs/25_SCENARIO_CONTENT.json`. The only dev dependency is `jsqr`, used by tests to independently decode generated QR codes.

## D-012 — Demo HMAC implementation details
- Demo secret: `SurakshaAR-SIH2026-HACKATHON-DEMO-SECRET-NOT-FOR-PRODUCTION` (public; HACKATHON DEMO SECURITY ONLY).
- HMAC key = UTF-8 bytes of the secret. Message = the Base64 body string exactly as it appears in the payload.
- SHA-256/HMAC are implemented in plain JS, because `crypto.subtle` is async and missing in non-secure contexts (`file://`, some WebViews). Output is tested against Node's `crypto`.

## D-013 — Certificate validity and content rules
- Validity is 365 days from issue (the docs did not set a period).
- Only scores >= 70 can be certified. A validly signed body with a lower score, an unknown module, extra keys or bad timestamps verifies as INVALID (content).
- Expiry is checked against logical prototype time (D-014).

## D-014 — Logical time is stored as an offset (`retention.demoOffsetMs`)
`05_DATA_MODEL.md` suggested `retention.demoNowMs`. A frozen "now" would stop real time and make seeded "days ago" values drift. The prototype instead stores `demoOffsetMs`, with logical now = device now + offset. "+7 days" adds 7 days (capped at 52 weeks) and "Reset time" sets the offset to 0. The device clock is never changed (consistent with D-007).

## D-015 — Retention calculation details
- `days_since` = whole days (floor) since the worker's most recent completed training attempt.
- Risk is rounded to an integer before status classification, so the displayed number and the colour always agree. Example: 41.5 becomes 42, which is Amber.
- `fails` = number of failed attempts. `score` = score of the most recent attempt.
- Refresher Due when `days_since >= 7`. Completing a refresher is itself a training attempt, so it resets `days_since` ("no completed refresher after the threshold").

## D-016 — Dashboard is a screen inside `web-app/` for Phase 1
The dashboard (`#/dashboard`) shares the retention logic and local storage with the worker app. It shows the 8 seeded workers plus this phone's worker once they have trained. No separate `dashboard/` folder was created in Phase 1. Phase 3 can deploy `web-app/` as static files and link to `#/dashboard`, or copy the screen.

## D-017 — Option display order is shuffled per attempt
The scenario JSON always lists the correct option first. To avoid a trivially gameable assessment, the engine shuffles option display order per attempt. The order is persisted with the in-progress session. Scoring is unaffected.

## D-018 — Santali text coverage
Only strings with reasonable confidence are in the `sat` dictionary: module titles from the scenario JSON and the greeting "जोहार". All other text falls back sat -> hi -> en, and a notice on the home screen says that some text is shown in Hindi. A native speaker must review and complete Santali before any public demo (see `08_LOCALIZATION.md`).

## D-019 — Certificate payload parsing
The payload `body=<base64>&sig=<16 hex>` is parsed by hand, not with `URLSearchParams`, which would turn Base64 `+` into spaces. The signature must be exactly 16 lowercase hex characters: changing its case is a tamper and yields INVALID. Whitespace/newlines in pasted text are ignored. Payloads longer than 2048 characters are rejected.

## D-020 — QR generated by a local encoder
QR codes are generated by `web-app/js/utils/qr.js` (byte mode, ECC level M, versions 1–40) and rendered as inline SVG. This involves no network and no runtime dependency. Tests decode the output with jsQR, including Hindi-name certificates.
