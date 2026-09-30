# Official Demo Script

Target length: 3–5 minutes.

## 1. Language
Choose Hindi or Santali.

## 2. Fire AR
- camera opens;
- scan floor;
- tap to place;
- voice instruction;
- 3D hazard/scenario objects;
- worker selects safe actions;
- score appears.

## 3. Gas AR
Repeat the same engine with Gas & Confined Space.

## 4. Certificate
Pass -> signed certificate with QR.

## 5. Offline verification
Turn on airplane mode.
Verify -> VALID.
Change one character.
Verify -> INVALID.

## 6. Dashboard
Show seeded workers, scores and risk.

## 7. Retention
Use +7 days.
Show risk increase and `Refresher Due`.

Anything not needed for these seven steps is secondary.

## Demo runbook (P3-M4 submission package)
This order was run end-to-end offline on the Redmi Note 11 with the debug APK (P3-M1, D-033). It was run again as a 24-step smoke test on the **release APK** (P3-M2, D-035). The timed rehearsal on the release APK passed in P3-M5, taking about 3 min 43 s with no blocking issues (D-039). The demo video is recorded by the team.

### Presentation constraints
- **Use the release APK:** `app-release.apk`, SHA-256 `e69b221623d34397c86dec0a4be369f7040384da12dc5353d0eb7c83d9276fd0`.
- **Grant camera permission before launching AR.** Denying it can crash ARCore (D-032, deferred), and AR then stays off until the app restarts.
- Google Play Services for AR must be installed and enabled. Installing or updating it needs internet, so do this before going offline.
- A Hindi text-to-speech voice must be available, otherwise AR is text-only.
- **Airplane mode can stay ON** for the whole demo; nothing needs the network.
- **Automatic AR placement may be used.** Point the phone ahead. If no floor plane is found, the content is placed automatically about 3 s later.
- **About 4 s of Unity startup screen** after tapping Start is expected. Talk over it.
- **Don't tap the language button** (文A, top bar) mid-demo: it changes the saved language.
- **Present in Hindi.** Santali is mostly the Hindi fallback (D-036).

### Demo order (target 3–5 minutes)
| # | Action | What to show |
|---|---|---|
| 1 | Launch SurakshaAR | Welcome screen, cold start about 1–2 s |
| 2 | **प्रशिक्षण शुरू करें** → **हिन्दी** | Language choice |
| 3 | Enter the worker name and ID → Continue | Worker profile (name + ID only) |
| 4 | **आग और विस्फोट** (Fire) → Start | AR camera view; Hindi voice |
| 5 | Exit sign → CO₂ → Crawl low → **Finish** (not "Train again") | Score **100**, Passed |
| 6 | **प्रमाणपत्र लें** (Get Certificate) | Certificate details. It is only created on request. |
| 7 | — | **QR** code |
| 8 | Verify → **Verify** | **VALID** ("no internet used") |
| 9 | **Change 1 character (demo)** | Tamper |
| 10 | **Verify** | **INVALID**, signature mismatch |
| 11 | **Use Last Certificate** → **Verify** | **VALID** again |
| 12 | Home → **गैस रिसाव और सीमित स्थान** (Gas) → Start → red leak zone → detector + breathing set → standby attendant → Finish | Same engine, score 100 |
| 13 | Home → supervisor dashboard | 9 workers; Green / Amber / Red tiles |
| 14 | **Simulate +7 Days** | "today + 7 days" |
| 15 | — | Risk increase: red count goes from 2 to 5 |
| 16 | Home (optional) | **Refresher Due** on the dashboard and on the Home Retention Guard card |
| 17 | Dashboard → **Reset time** | Back to today, so the next run starts clean |

### Final demo-phone checklist
Complete this just before the demo. Do not reset the test phone until the final demo phone is chosen.
- [ ] The release APK is installed. Run `adb shell pm path com.surakshaar.app` and compare its `sha256sum` with `e69b2216…d9276fd0`.
- [ ] The package is `com.surakshaar.app`, and **no debug build** is installed. `adb shell dumpsys package com.surakshaar.app` must not show `DEBUGGABLE` in `pkgFlags`.
- [ ] App storage is cleared (Settings → Apps → SurakshaAR → Storage → Clear storage, or `adb shell pm clear com.surakshaar.app`). This clears demo data, the +7 offset and the saved language.
- [ ] The camera permission is granted **after** clearing, because clearing removes it (Settings → Apps → SurakshaAR → Permissions → Camera → Allow).
- [ ] Google Play Services for AR is installed and enabled.
- [ ] The Hindi TTS voice is available.
- [ ] Airplane mode is ON and Wi-Fi is OFF.
- [ ] Optional: the app is opened once to confirm the Welcome screen, with language and worker left for the live demo. Alternatively, pre-select Hindi and pre-create the demo worker, and start the demo at Home.
- [ ] The certificate flow is ready: nothing is issued until **Get Certificate** is tapped during the demo.
- [ ] The dashboard is reachable from Home, below the modules. This is the APK dashboard, with the phone's data.
- [ ] Leftover test files are removed if not needed: for example `/sdcard/p3m2cs/` timing screenshots from P3-M2.
- [ ] The known-good APK copy is kept on the computer, and not deleted.

### Presenter notes
- **Finish** returns the score to the app; **Train again** restarts AR, and **Exit** leaves AR without saving an attempt.
- The QR is verified on the same phone. Scanning it with another phone's camera only shows the text payload.
- The certificate signature is demo-only (an HMAC secret inside the app). Say so if asked.
- **Public dashboard for evaluators:** https://chiragvaze.github.io/SurakshaAR/#/dashboard
  - It opens in any browser, and asks for a language on the first visit.
  - It shows the **8 seeded workers only**, with working Simulate +7 Days and Reset time.
  - It is **not** the phone's data, and it is not synchronised with the APK. Use the APK dashboard in the live demo.
