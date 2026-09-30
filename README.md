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
| 1 | Web/business layer (`web-app/`) | Complete |
| 2 | Unity AR (`unity-ar/`) and single-APK Android shell (`android-shell/`) | Complete, frozen at git tag `phase2-complete` |
| 3 | Validation, release and demo | In progress. **P3-M1 (full demo-journey validation on the phone): COMPLETE, PASS. P3-M2 (release build validation): COMPLETE, PASS.** Pending: the D-032 fix, Santali approval, documentation cleanup, the dashboard URL, a timed rehearsal, the demo video and the final freeze. |

**P3-M1 (2026-09-30):** the complete demo journey was run offline on a physical Redmi Note 11 (Android 13, ARCore 1.56) with the frozen APK, in airplane mode:
- language → worker → Fire AR (Hindi, 100) → certificate → QR → VALID → tamper → INVALID → VALID;
- Gas AR (Hindi, 100);
- supervisor dashboard → **Simulate +7 Days** (risk rises, Refresher Due) → **Reset time**.

**P3-M2 (2026-09-30):** a **release** APK signed with a local, non-production key passed the same journey offline on the same phone, with no behavioral differences.

Details: [`docs/12_ANDROID_BUILD_SPEC.md`](docs/12_ANDROID_BUILD_SPEC.md) and [`docs/24_DECISION_LOG.md`](docs/24_DECISION_LOG.md) (D-033, D-035). Milestone status: [`docs/21_PHASE_PLAN.md`](docs/21_PHASE_PLAN.md).

## Android app (Phase 2)

`com.surakshaar.app` is a single APK:
- a Kotlin WebView shell hosting `web-app/`;
- Unity AR (Unity 2022.3, AR Foundation/ARCore 5.1) as a library, running in its own process.

It needs Android 10+ (API 29) with ARCore, and asks only for **Camera** and **Vibrate**. It builds with the JDK/SDK/NDK/Gradle bundled with Unity's Android Build Support; **Android Studio is not required**.

```bash
unity-ar/build.sh export      # Unity -> unity-ar/Builds/AndroidExport
android-shell/build.sh test   # shell unit tests
android-shell/build.sh        # debug APK -> android-shell/app/build/outputs/apk/debug/app-debug.apk
SURAKSHAAR_SIGNING=<path to keystore.properties> android-shell/build.sh release
                              # release APK -> android-shell/app/build/outputs/apk/release/app-release.apk
```

- **Install:** with `adb install -r <apk>`. Debug and release builds are signed with different keys, so **uninstall first** when switching between them (this deletes the app's saved data).
- **Signing:** the validated release APK (P3-M2, D-035) uses a **local, non-production** prototype key.
  - The keystore and its `keystore.properties` (`storeFile`, `storePassword`, `keyAlias`, `keyPassword`) are kept outside the repository and are never committed.
  - Without `SURAKSHAAR_SIGNING`, Gradle signs a release build with the debug key.
  - There is no store/Play signing setup (D-031).
- **Demo checklist:** see the demo runbook in [`docs/19_DEMO_SCRIPT.md`](docs/19_DEMO_SCRIPT.md). It covers clearing storage, pre-granting the camera, ARCore and the Hindi voice, and airplane mode.

## Run the web app in a browser (Phase 1)

Requires Node.js 20+. The app itself has no runtime dependencies.

```bash
cd web-app
npm install        # dev-only: jsqr, used by tests to decode generated QR codes
npm start          # http://127.0.0.1:5173
npm test           # unit + integration tests (node:test)
```

To test on a phone on the same Wi-Fi, run `npm run start:lan` and open `http://<computer-LAN-IP>:5173/`.

The app also runs by opening `web-app/index.html` directly (`file://`). Inside the Android app it is instead served from the APK's own assets at `https://appassets.androidplatform.net/assets/web/` (D-028).

After the page has loaded, the whole flow works without network: language → worker → training → result → certificate → verify. When the app is served from `localhost`, a service worker also allows offline reloads. Inside the APK the service-worker registration fails, and it doesn't need to work: the app loads from the APK and works offline without it (known issue D-034).

### Demo path
1. **Start Training** → choose a language → enter worker name and ID.
2. **Fire & Explosion** → Start → answer 3 steps → Result.
3. **Get Certificate** → QR + certificate code.
4. **Verify this certificate** → **Verify** → `VALID`.
5. **Change 1 character (demo)** → **Verify** → `INVALID`.
6. **Gas Leak & Confined Space**: same engine, same flow.
7. Home → **Supervisor dashboard** → **Simulate +7 Days** → risk and status rise, `Refresher Due` appears → **Reset time**.

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
docs/           specification, decision log, scenario content (source of truth)
web-app/        web/business layer (vanilla HTML/CSS/JS); the dashboard is #/dashboard
unity-ar/       Unity AR trainer (Fire and Gas on one shared scenario engine)
android-shell/  Kotlin WebView shell + Unity as a Library -> single APK
```

## Known issues and limitations

- **D-032 (open):** on a fresh install, denying the first camera prompt can trigger a native ARCore crash. It recovers without data loss. After a camera denial, AR stays unavailable until the app restarts. **Grant the camera before a demo.**
- **D-034:** the service-worker offline-cache registration fails inside the APK. It is non-blocking: the app loads from the APK and works offline without it.
- The release APK is signed with a **local, non-production** key (D-035). It is not store/production signing (D-031).
- **Santali** is mostly shown in Hindi: only the greeting and module titles are Santali, pending native-speaker review (D-018).
- Certificate signing is **demo-only** (see the security disclosure above).
- The phone needs **Google Play Services for AR** installed (installing it needs internet once) and a **Hindi text-to-speech voice**. If the voice is missing, AR is text-only.
- If no floor plane is found, the AR content is **placed automatically** about 3 s later. Point the phone ahead.
- Only **one physical phone model** has been tested: the Redmi Note 11, Android 13.
