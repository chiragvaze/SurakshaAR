# SurakshaAR — Suraksha Drishti

**SIH 2026 · PS 26041 — AR-Based Vocational Training Simulator for Industrial Safety in Jharkhand's Mining & Manufacturing Sector**

## Problem
Safety instruction for mining and manufacturing workers in Jharkhand is often passive and hard to repeat, and it leaves no verifiable record. SurakshaAR is a phone-based prototype built around three things:
- short, repeatable AR practice of safe actions;
- a scored assessment;
- a signed certificate that can be verified **offline**.

Supervisors also get a view of retention risk and refresher due dates. The full specification is in [`docs/`](docs/README.md); start with [`docs/00_MASTER_SPEC.md`](docs/00_MASTER_SPEC.md).

## What works (validated on a physical phone)
| Capability | State |
|---|---|
| **Fire & Explosion AR:** 3 scored steps (exit sign, CO₂ extinguisher, crawl low) | Works |
| **Gas Leak & Confined Space AR:** 3 scored steps (red leak zone, gas detector + breathing set, standby attendant) | Works |
| Scored assessment: `score = round(100 × (steps − wrong) / steps)`, pass at ≥ 70 | Works |
| **Hindi** text, including in AR, and Hindi **voice** (Android offline text-to-speech) | Works. The voice needs a Hindi TTS voice on the phone. |
| English | Works |
| **Santali** | **Limited.** Only the greeting and the two module titles are Santali; everything else falls back to Hindi (see limitations). |
| Fully **offline** operation, in airplane mode | Works |
| Certificate after a pass, with a locally generated **QR** | Works |
| **Offline verification:** VALID; one changed character gives **INVALID** (tamper detection) | Works (demo signature, see security) |
| **Retention Guard** risk score (Green / Amber / Red) on the worker's home screen | Works |
| **Supervisor dashboard:** 8 seeded workers + this phone's worker | Works inside the app. A public copy with the seeded workers is on GitHub Pages (see below). |
| **Simulate +7 Days**: risk rises and **Refresher Due** appears; **Reset time** | Works |

Not built, by design: a backend or cloud sync, live QR camera scanning, AI or PPE detection, and more safety domains (see [`docs/23_ROADMAP.md`](docs/23_ROADMAP.md)).

## Device validation
- **Phone:** Redmi Note 11 (2201117TI), **Android 13**, **Google Play Services for AR 1.56**, all tests in airplane mode with Wi-Fi off.
- **P3-M1:** the full demo journey on the debug APK.
- **P3-M2:** the same journey as a 24-step smoke test on the **release APK**.
- **Result:** every step passed. There were no crashes during the validated flow, and saved data survived AR sessions and a cold relaunch. Details: [`docs/12_ANDROID_BUILD_SPEC.md`](docs/12_ANDROID_BUILD_SPEC.md), decision log D-033 and D-035.
- **Automated tests:** web 72/72, shell 6/6, Unity 26/26.

## Public dashboard
**https://chiragvaze.github.io/SurakshaAR/#/dashboard** (site root: https://chiragvaze.github.io/SurakshaAR/)

| | Public dashboard (GitHub Pages) | APK dashboard |
|---|---|---|
| What it is | The same static `web-app/`, published by `.github/workflows/pages.yml` | The same dashboard screen, running inside the Android app |
| Workers shown | **8 seeded demo workers only** | 8 seeded workers **plus this phone's worker** and their real attempts |
| Data | Stored in the visitor's own browser | Stored on the phone |
| Sync | **None.** The two are not connected, and there is no cloud sync. | None (offline-first) |
| Simulate +7 Days / Reset time | Works | Works |

On a first visit, the site asks for a language, then opens the dashboard.

## Release APK (known-good build)
| | |
|---|---|
| File | `android-shell/app/build/outputs/apk/release/app-release.apk` (built locally; APKs are not committed) |
| Package | `com.surakshaar.app` |
| Version | `0.4.0-m4` (versionCode 4) |
| ABI | arm64-v8a |
| SDK | min 29 (Android 10), target 34 |
| Size | 22.8 MB (22,798,055 bytes) |
| Permissions | CAMERA, VIBRATE (no INTERNET) |
| Signing | **Local prototype key; NOT production or store signing** (D-031, D-035) |
| SHA-256 | `e69b221623d34397c86dec0a4be369f7040384da12dc5353d0eb7c83d9276fd0` |

Install with `adb install app-release.apk`. If a debug build is installed, uninstall it first: the signing keys differ, and uninstalling deletes the app's saved data.

## Known limitations
- **D-032 (open, deferred until after the hackathon):** on a fresh install, denying the first camera prompt can trigger a native crash in Google's ARCore. The app recovers without data loss, but after a denial AR stays unavailable until the app restarts. **Grant camera permission before launching AR.**
- **D-034 (open):** inside the APK, the web app's service-worker offline-cache registration fails. It is non-blocking: the app is loaded from the APK itself and works fully offline without it.
- **Santali** content is mostly the Hindi fallback. No native-speaker-approved Santali safety content exists, so none has been invented (D-018, D-036). **Present the demo in Hindi.**
- **Certificate signing is demo-only** (see the security disclosure below).
- **ARCore dependency:** needs an ARCore-supported phone with Google Play Services for AR installed. Installing it needs internet once.
- **Hindi TTS dependency:** without a Hindi text-to-speech voice, AR is text-only.
- **One physical phone model tested** (Redmi Note 11).
- If no floor plane is found, AR content is **placed automatically** about 3 s later. Point the phone ahead.
- **The public dashboard shows seeded demo data only.** It is not synchronised with any phone (see above).

## Demo
The 3–5 minute demo order, presenter constraints and the final demo-phone checklist are in [`docs/19_DEMO_SCRIPT.md`](docs/19_DEMO_SCRIPT.md). The submission checklist is in [`docs/17_DEPLOYMENT.md`](docs/17_DEPLOYMENT.md).

## Architecture
```text
com.surakshaar.app (single APK)
├── Kotlin shell: MainActivity + WebView serving web-app/ from the APK's own assets
│   (https://appassets.androidplatform.net/assets/web/, WebViewAssetLoader)
├── web-app/: UI, languages, scoring, certificate + QR, verification, retention, dashboard (localStorage)
└── Unity AR trainer (Unity 2022.3, AR Foundation / ARCore 5.1) as a library, in its own ":unity" process
    Web → Android.launchAR(module, lang) → Unity → result → web re-validates and scores
```
More detail: [`docs/02_ARCHITECTURE.md`](docs/02_ARCHITECTURE.md) and [`docs/07_API_AND_BRIDGE_CONTRACTS.md`](docs/07_API_AND_BRIDGE_CONTRACTS.md), plus decisions D-028 and D-029.

## Build
Everything builds with the JDK/SDK/NDK/Gradle bundled with Unity 2022.3.62f3's Android Build Support. **Android Studio is not required.**

```bash
unity-ar/build.sh export      # Unity -> unity-ar/Builds/AndroidExport
android-shell/build.sh test   # shell unit tests
android-shell/build.sh        # debug APK -> android-shell/app/build/outputs/apk/debug/app-debug.apk
SURAKSHAAR_SIGNING=<path to keystore.properties> android-shell/build.sh release
                              # release APK -> android-shell/app/build/outputs/apk/release/app-release.apk
```
Release signing notes:
- The keystore and its `keystore.properties` (`storeFile`, `storePassword`, `keyAlias`, `keyPassword`) are kept on the developer machine, outside the repository, and are never committed.
- Without `SURAKSHAAR_SIGNING`, Gradle signs a release build with the debug key.

## Run the web app in a browser
Requires Node.js 20+. The app itself has no runtime dependencies.

```bash
cd web-app
npm install        # dev-only: jsqr, used by tests to decode generated QR codes
npm start          # http://127.0.0.1:5173
npm test           # unit + integration tests (node:test)
```

To test on a phone on the same Wi-Fi, run `npm run start:lan` and open `http://<computer-LAN-IP>:5173/`. The app also runs by opening `web-app/index.html` directly (`file://`). In a browser served from `localhost`, a service worker also allows offline reloads.

## ⚠ Security disclosure: demo signature only
Certificates are signed with **HMAC-SHA256 using a secret embedded in the app** (first 16 hex characters). This demonstrates tamper detection only: changing any character makes verification fail.

**It is not real security.** Anyone can extract the secret from the app and forge certificates. A production system must:
- sign server-side with an asymmetric key (the private key never ships to devices);
- verify with the public key;
- use HTTPS, key management, an audit trail and revocation.

See [`docs/04_SECURITY.md`](docs/04_SECURITY.md) and [`docs/09_CERTIFICATE_QR.md`](docs/09_CERTIFICATE_QR.md). No real credentials or API keys are in this repository.

## Privacy
Only the worker name and worker ID are collected. Everything is stored on the device (`localStorage` key `sa_v1`), and nothing is sent anywhere. Camera frames never leave the device. See [`docs/16_PRIVACY.md`](docs/16_PRIVACY.md).

## Status
| Phase | Scope | State |
|---|---|---|
| 1 | Web/business layer | Complete |
| 2 | Unity AR + single-APK Android shell | Complete, frozen at git tag `phase2-complete` |
| 3 | Validation, release and submission | **COMPLETE / FINAL FREEZE** (tag `v1.0.0-sih-final`). P3-M1 PASS, P3-M2 PASS, P3-M3 PASS WITH DEFERRALS, P3-M4 PASS, P3-M5 PASS. The full release demo was rehearsed in about 3 min 43 s. |

Milestones: [`docs/21_PHASE_PLAN.md`](docs/21_PHASE_PLAN.md). Decisions and known issues: [`docs/24_DECISION_LOG.md`](docs/24_DECISION_LOG.md).

## Repository layout
```text
docs/           specification, decision log, scenario content (source of truth)
web-app/        web/business layer (vanilla HTML/CSS/JS); the dashboard is #/dashboard
unity-ar/       Unity AR trainer (Fire and Gas on one shared scenario engine)
android-shell/  Kotlin WebView shell + Unity as a Library -> single APK
```
