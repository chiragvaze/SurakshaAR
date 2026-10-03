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

## D-021 — Phase 2 toolchain (Milestone 1)
- Unity **2022.3.62f3** (changeset 96770f904ca7), latest 2022.3 LTS at install time. Installed via the Unity Hub CLI with only these modules: Android Build Support, Android SDK & NDK Tools, and OpenJDK.
- The bundled toolchain is OpenJDK 11.0.14.1, NDK r23b, SDK platforms 34/35/36, build-tools 34.0.0 and Gradle 7.5.1. **Android Studio is not required**, and is not installed because of disk-space limits.
- Packages: AR Foundation **5.1.6**, ARCore XR Plugin **5.1.6**, XR Plug-in Management 4.4.1, XR Core Utils 2.5.2, XR Legacy Input Helpers 2.1.10.
- Built-in render pipeline; no URP.

## D-022 — Camera pose via legacy TrackedPoseDriver; scene generated by an editor script
- AR Foundation 5.1 pulls in the Input System package. The project keeps the legacy Input Manager: touch comes from `Input.touches`, and the AR Camera uses `UnityEngine.SpatialTracking.TrackedPoseDriver` (Generic XR Device / Color Camera). Switching input backends in batch mode needs an editor restart, and ARF 5.1 supports the legacy driver.
- `AR_Trainer.unity`, its prefabs and its materials are generated by `unity-ar/Assets/Editor/SurakshaBuild.cs` (menu **SurakshaAR**, or `unity-ar/build.sh`). The editor script also configures the Player and XR settings: min API 29, ARM64, IL2CPP, OpenGLES3 only, no shadows, ARCore loader, and ARCore marked Required. This makes the setup reproducible without hand-edited scene YAML.

## D-023 — Web-side AR error callback (`window.SurakshaAR.onARError`)
The Android shell reports "AR closed without a result" through `window.SurakshaAR.onARError(code)`. After `ar_unsupported`, `camera_denied` or `launch_failed`, the web app's next Start uses the browser trainer, so a worker is never blocked by AR. A user closing AR simply returns them to the briefing. No attempt is ever created from an error.

## D-024 — Unity content is exported from the web sources, never hand-copied
`web-app/tools/export-unity-content.js` (`npm run export:unity`) writes `unity-ar/Assets/Resources/SurakshaContent.json` from:
- `docs/25_SCENARIO_CONTENT.json`: IDs, correct answers, titles;
- `web-app/js/i18n/strings.js`: prompts, options, "why" text, plus the `ar.*`, `assess.*`, `result.*` and `module.*` UI strings.

Text is kept per language (en/hi/sat) and Unity applies the same sat → hi → en fallback at runtime. `web-app/tests/unity-content.test.js` fails if the file is stale.

The file is loaded with `Resources.Load`, not from StreamingAssets as `11_UNITY_AR_SPEC.md` suggested. This is a synchronous, reliable load from inside the APK/AAR, with no UnityWebRequest over `jar:` URLs.

## D-025 — Hindi/Santali text in AR is rendered by Android, not Unity
Unity's legacy Text and TextMeshPro cannot shape Devanagari: matras and conjuncts render incorrectly. All AR text (prompts, option labels, feedback, buttons) is therefore laid out by Android's text engine. `Assets/Plugins/Android/SurakshaNative.java` renders it to a PNG, and Unity shows it as a texture (`NativeText`, `UIText`). The editor falls back to Unity text, which is fine for English only.

## D-026 — Voice via offline Android text-to-speech
There are no recorded audio assets yet. Voice instructions use Android `TextToSpeech`:
- en-IN or hi-IN voice;
- Santali text currently falls back to Hindi and uses the Hindi voice;
- if the voice or engine is missing, the trainer is text-only.

This fits the documented fallback "Hindi audio, then text-only". A mute button is always shown. The TTS `<queries>` entry is added via `Assets/Plugins/Android/SurakshaQueries.androidlib`. Recorded mono OGG audio can replace TTS later without changing the engine.

## D-027 — AR app permissions
An `IPostGenerateGradleAndroidProject` hook (`Assets/Editor/StripInternetPermission.cs`) removes the INTERNET permission that Unity injects. The AR trainer uses no network features.

Final permissions: CAMERA (AR) and VIBRATE (haptic tick on a correct answer).

## D-028 — Single-APK integration: WebView shell + Unity as a Library (Milestone 4)
- **App:** `android-shell/` produces `com.surakshaar.app`. `MainActivity` hosts the unchanged `web-app/`: Gradle copies it into `assets/web`, and `WebViewAssetLoader` serves it at `https://appassets.androidplatform.net/assets/web/`. This is a secure origin with localStorage, no `file://` and no network.
- **Unity process:** Unity runs in `ARUnityActivity`, a subclass of `UnityPlayerActivity`, in its own process (`:unity`). `UnityPlayerActivity.onDestroy()` ends its process, and the separate process keeps the WebView and its storage alive. Verified on device: the main PID was unchanged across AR sessions.
- **Result handoff:** the result returns through `setResult()` / `registerForActivityResult`, which works across processes.
- **Two-app fallback:** the documented deep-link fallback (D-009) was **not needed**; the Unity-as-a-Library integration works.
- **Permissions:** CAMERA and VIBRATE only. The Unity export's own launcher activity is removed with `tools:node="remove"`.

## D-029 — Building without Android Studio
`android-shell/build.sh` uses only what Unity 2022.3.62f3's Android support installs:
- OpenJDK 11, the SDK (platforms 34–36, build-tools 34.0.0), and NDK r23b;
- Gradle 7.5.1, run from `gradle-launcher-7.5.1.jar` because Unity ships no `bin/gradle` script;
- AGP 7.4.2, the same version as Unity's export.

Build settings that had to be pinned:
- `buildToolsVersion '34.0.0'`: AGP would otherwise require the uninstalled 30.0.3.
- `-Pandroid.aapt2FromMavenOverride`: uses Unity's aapt2 instead of downloading one.
- `local.properties` with `sdk.dir` only: the Unity library sets `ndkPath`, and AGP rejects both being set (CXX1100).
- The nested `unityLibrary:*.androidlib` modules are included explicitly.

Downloaded once at build time: the Kotlin Gradle plugin 1.8.22 and `androidx.activity`/`androidx.webkit`. AGP 7.4.2 was already cached by Unity.

## D-030 — Web briefing creates a browser session only for the browser trainer
With the Android shell, Start launches AR and no longer creates a web assessment session first. Closing AR therefore never leaves a phantom "In progress" card. Without the shell, or after AR is unusable (D-023), the browser trainer behaves as before.

## D-031 — Signing for the SIH prototype (Milestone 5)
- **Demo / sideload (current):** the APK is signed with the Android **debug key** from Unity's JDK/SDK toolchain (`assembleDebug`). This is adequate for installing on demo phones with `adb install` or by copying the APK. No store, no upload.
- **Store distribution (not done):** needs a dedicated release keystore kept outside the repository, `assembleRelease` with a real `signingConfig`, and Play App Signing.
- **Decision:** no production key is created for the prototype, and nothing is uploaded. Debug-signed builds must not be presented as production releases.
- **Update (P3-M2, 2026-09-30):**
  - The validated sideload APK is now the **release** build, signed with a **local, non-production prototype key** (D-035), instead of the debug key.
  - Store distribution is still not done: no production key, no Play App Signing, nothing uploaded.

## D-032 — Known issue: ARCore native crash when camera permission is first denied (Milestone 5)
- **What happened:** on a fresh install, denying the very first camera prompt caused one native crash (SIGSEGV) inside Google's `libarcore_c.so` (Google Play Services for AR). It was in the isolated `:unity` process, about 11 s after the denial.
- **Recovery:** Android then restarted the app, as it does after a permission change. The web app reloaded with all data intact. The next denied launch showed our "camera permission needed" message and returned `camera_denied`, and the web app fell back to the on-screen trainer.
- **Why:** XR Plug-in Management initializes ARCore at startup (`InitManagerOnStart`) while our bootstrap is still requesting the permission.
- **Fix (after the freeze):** initialize the XR loader manually only after the camera permission is granted. It is not changed during the freeze: it alters Unity's startup order, and the failure is contained and recoverable.
- **Status after P3-M1 (2026-09-30): still OPEN.**
  - It was not triggered during P3-M1, because camera permission was granted before the demo.
  - A related limitation also remains: after `camera_denied`, the web app keeps using the on-screen trainer until the app restarts (D-023). There is no in-app "try AR again".
  - The planned fix is Phase 3 Milestone 2 (P3-M2), which has not started.
- **Status after P3-M2 (release build): still OPEN.**
  - It was not exercised: the camera was granted in advance, and camera denial was deliberately not tested.
  - "P3-M2" ended up being used for the release-build validation (D-035). This fix is still pending, as a later milestone that has not been numbered yet.
- **P3-M3 investigation (read-only): DEFERRED, still OPEN.** See D-036.

## D-033 — P3-M1: full demo journey validated offline on the phone (2026-09-30)
- **Result: PASS.** The complete 26-step demo journey ran as one continuous session.
- **Device and build:**
  - Redmi Note 11, Android 13, Google Play Services for AR 1.56.
  - The installed APK was `com.surakshaar.app` 0.4.0-m4. Its SHA-256 matched the `phase2-complete` build byte for byte.
- **Setup:**
  - App storage was cleared and the camera permission was granted before the run.
  - The Hindi TTS voice was available and heard.
  - Airplane mode was ON with Wi-Fi OFF, and there was no active network.
- **Physically verified for the first time inside the APK:**
  - the supervisor dashboard;
  - **Simulate +7 Days** (risk rises, workers turn red);
  - Refresher Due;
  - the Home Retention Guard card;
  - **Reset time**.
- **No code changes were needed.** The `phase2-complete` implementation was used unchanged.
- **Observed but deliberately deferred:** the offline-cache (service-worker) registration fails inside the APK (D-034). It is non-blocking.
- **D-032 stays open.**
- Full results: `12_ANDROID_BUILD_SPEC.md`, section "Phase 3 Milestone 1 (P3-M1) validation".

## D-034 — Known issue: the offline-cache (service-worker) registration fails inside the APK (P3-M1)
- **What happens:** at every launch, the web app registers `sw.js` because the page is served over `https://appassets.androidplatform.net`. Precaching then fails, and the WebView console logs `Uncaught (in promise) TypeError: Failed to execute 'addAll' on 'Cache': Request failed`.
- **Impact:** none observed. The page is served from inside the APK by `WebViewAssetLoader`, so the app loads and works fully offline without the service worker. No error is shown to the user.
- **Consequence:** the service-worker offline cache is **not** functional inside the APK and must not be described as working there. It still serves its original purpose for phone-browser/PWA runs over http(s).
- **Stale comments:** comments in `web-app/js/app.js` and `web-app/sw.js` say the service worker is not used for Android assets. That no longer matches the Milestone 4 `https://appassets…` origin.
- **Decision:** non-blocking technical debt. It is not fixed in the documentation-only P3 update. A fix belongs in a later code milestone, for example not registering the service worker when running inside the Android shell.
- **Status after P3-M2 (release build): still OPEN.**
  - The release WebView does not forward console messages to logcat, so the error could not be observed there. It is **not** shown to be gone, and the code path is unchanged.
  - The release app loaded and worked fully offline (D-035).

## D-035 — P3-M2: release build validated offline on the phone (2026-09-30)
- **Result: PASS.** The release APK behaves the same as the validated debug APK (P3-M1, D-033).
- **Changes:** build configuration only; no product code.
  - `app/build.gradle`: an optional release `signingConfig`, read from a `keystore.properties` file given with `-PsurakshaarSigning`. Without it, release still falls back to the debug key.
  - `build.sh`: a `release` option that requires `SURAKSHAAR_SIGNING`.
  - Root `.gitignore`: `*.p12`, `*.jks`, `*.keystore`, `keystore.properties`.
- **Key:**
  - Local PKCS12 keystore, alias `surakshaar-sih-prototype` (RSA-2048, valid until 2054, CN marked "not production").
  - Stored at `%USERPROFILE%\.surakshaar-signing\`, outside the repository and outside OneDrive.
  - No password is in any tracked file. It is not a store key and not production signing (D-031).
- **APK:**
  - `app-release.apk`: 22,798,055 bytes, SHA-256 `e69b2216…d9276fd0`.
  - `com.surakshaar.app` 0.4.0-m4 (version unchanged), arm64-v8a, minSdk 29.
  - CAMERA and VIBRATE only; not debuggable; APK Signature Scheme v2.
- **Install:** it could not be installed over the debug build (`INSTALL_FAILED_UPDATE_INCOMPATIBLE`, signatures differ), so the debug build was uninstalled first.
  - A phone moving between debug and release builds must always uninstall first, which also deletes the app's saved data.
- **Validation:**
  - Redmi Note 11, Android 13, ARCore 1.56, Hindi TTS; airplane mode ON, Wi-Fi OFF.
  - The 24-step smoke test passed: Fire and Gas 100, certificate, QR, VALID / INVALID / VALID, dashboard, +7 days, Refresher Due, Reset time. Persistence after a cold relaunch also passed.
  - Web 72/72, shell 6/6, Unity 26/26.
- **Differences from P3-M1:** none functional.
  - Cold start and AR start-up were the same or slightly faster.
  - Release-only: WebView debugging and console logging are off, as intended for a non-debug build.
- **Still open:** D-032 and D-034.

## D-036 — P3-M3: D-032 fix deferred; Santali stays on the fallback (2026-09-30)
Investigation and decision only. **No product code changed**, and the P3-M2 release APK (SHA-256 `e69b2216…d9276fd0`) stays the known-good build.

### D-032: DEFER (Option B)
**Start-up sequence, from the code:**
1. `XRGeneralSettings` (XR Management 4.4.1, `InitManagerOnStart = true`, set by `SurakshaBuild.cs`) calls `InitializeLoaderSync()` as soon as the Unity player loads.
2. `ARCoreLoader.Initialize()` creates the 11 ARCore subsystems. The `ARCoreSessionSubsystem` provider's constructor calls the native `UnityARCore_session_construct(...)`.
3. So a native ARCore session exists before the scene runs.
4. `ARBootstrap.Start()` then asks for the camera (`Permission.RequestUserPermission`). Only after a grant does it run `ARSession.CheckAvailability()` and set `session.enabled = true`, which is when the session resumes.
5. On a denial, `controller.Fail("ar.err.cameraDenied", "camera_denied")` shows the message. **Back to app** then calls `ARUnityActivity.cancelAR` → `finish()`.
6. The web app (`bridge.js`) marks AR as unusable until the app is reloaded (D-023).

**Crash evidence (Milestone 5 tombstone):**
- SIGSEGV `SEGV_MAPERR` on thread `Thread-23` of `com.surakshaar.app:unity`, at 10:01:25.4, with a process uptime of 16 s.
- All app-side frames are inside Google's closed-source `libarcore_c.so` (frames #00–#07), on an ARCore-owned worker thread (`__pthread_start`). There are no Unity or app frames.
- It happened about 9 s after the denial, while the Settings app's permission screen was open (10:01:27.5), and about 1 s before the system killed the main app for **PERMISSION CHANGE** (10:01:26).
- The next denied launch showed the message and returned `camera_denied` **without** crashing.

**Most likely cause:**
- Most likely trigger: Google's ARCore reacting to the camera permission being changed in Settings, with a constructed but never-resumed native session sitting in the backgrounded `:unity` process.
- Not proven: the first-denial / start-up-order explanation in D-032. Only one crash was ever observed, and the faulting code can't be inspected.

**Why defer:**
- The candidate fix is to turn off `InitManagerOnStart` and start the XR loader by hand after a grant. That changes the start-up of **every** AR launch, including the proven camera-granted path.
- The AR Foundation managers (camera, plane, raycast, anchor) bind to their subsystems when they are enabled, so they would also need re-enabling after a manual start.
- That is not a small, low-risk change, and it can't be tested reliably because the crash was never reproduced.

**Workaround (proven in P3-M1 and P3-M2):** grant the camera permission before launching AR. The fix is recommended for after the hackathon.

### Santali: NO APPROVED CONTENT (Option B)
**Found in the repository:**
- web `sat` dictionary: 1 string, `home.greeting` = `जोहार, {name}`;
- `25_SCENARIO_CONTENT.json`: 2 module titles, `आग आर विस्फोट` and `गैस रिसाव आर सीमित ठाँव`;
- the language-picker label `ᱥᱟᱱᱛᱟᱲᱤ · संताली`;
- `SurakshaContent.json`: 69 Santali slots, of which only the 2 titles are filled. The other 67 are empty and fall back to Hindi by design.
- There are no audio assets.

**Approval evidence:** none. There is no native-speaker approval, reviewer, source or sign-off anywhere. D-018 describes the existing strings only as "reasonable confidence", and `08_LOCALIZATION.md` still requires native-speaker review.

**Decision:**
- Nothing is added or changed, and no Santali safety wording is invented or machine-translated.
- The fallback (sat → hi → en), the Hindi voice for Santali (D-026) and the home-screen "under review" notice stay as they are.
- Santali stays a documented known limitation. **For the demo, present in Hindi.**

## D-037 — P3-M4: submission package preparation started (2026-09-30)
- **Scope:** documentation and checklists only. **No product implementation changes**, and no APK was rebuilt.
- **Known-good build:** still the P3-M2 release APK, SHA-256 `e69b221623d34397c86dec0a4be369f7040384da12dc5353d0eb7c83d9276fd0` (D-035).
- **Carried over:** D-032 stays deferred and open, D-034 stays open, and Santali stays deferred with the Hindi fallback (D-036).
- **Done in P3-M4:**
  - evaluator-facing README;
  - demo runbook, presentation constraints and final demo-phone checklist (`19_DEMO_SCRIPT.md`);
  - final submission checklist (`17_DEPLOYMENT.md`);
  - factual status corrections.
- **Dashboard:** **not currently deployed.** No deployment configuration exists, the GitHub repository is **private**, and GitHub Pages is not enabled.
  - Smallest path: the owner makes the repository public (also a stated submission requirement), then `web-app/` is published with a Pages workflow or a `gh-pages` branch.
  - Nothing was published: this is an outward-facing change that needs the owner's approval.
- **Remaining work (P3-M5):**
  - final demo phone preparation;
  - a timed rehearsal and the demo video;
  - the dashboard URL and public repository, if approved;
  - the final freeze.
- **Update (same day):** the owner made the repository public, and the dashboard was deployed to GitHub Pages (D-038). P3-M4 is now COMPLETE: PASS.

## D-038 — P3-M4: the existing static web app is published on GitHub Pages (2026-09-30)
- **Public dashboard: https://chiragvaze.github.io/SurakshaAR/#/dashboard.** This is the URL reported by GitHub for the deployment and verified live.
- **How:**
  - Pages source is **GitHub Actions**. `.github/workflows/pages.yml` publishes only `web-app/index.html`, `sw.js`, `css/` and `js/`, the same file set as the APK.
  - There is no build step, no new dependencies and no new frontend tooling.
  - The first run, `36751977536` for commit `7439947`, succeeded.
- **No product code changed:**
  - All paths are relative, and the hash routes and service worker work unchanged under the `/SurakshaAR/` subpath.
  - The APK was not rebuilt. The P3-M2 release APK (`e69b2216…d9276fd0`) stays the known-good build.
- **Verified live** (headless Edge 154):
  - Home, CSS and scripts load. The service worker activates on the HTTPS origin and precaches 28 files.
  - The dashboard shows 8 seeded workers.
  - +7 days: 5 Red, 8 Refresher due. Reset time restores the baseline.
  - No console errors.
- **Scope:** the public site shows **seeded demo data only**, stored in each visitor's browser. It is **not** the phone's data and does not sync with the APK. No cloud sync exists (D-003, D-004).
- **D-034 is unchanged:** it concerns the APK's WebView only. On GitHub Pages, the service worker works as designed.

## D-039 — FINAL FREEZE: SurakshaAR SIH 2026 final frozen prototype (2026-09-30)
- **P3-M5: PASS.** Phase 3 is **COMPLETE / FINAL FREEZE**. Final tag: `v1.0.0-sih-final`. No further development.
- **Authoritative release APK** (unchanged since P3-M2, not rebuilt):
  - `app-release.apk`, `com.surakshaar.app` 0.4.0-m4 (versionCode 4);
  - 22,798,055 bytes, SHA-256 `e69b221623d34397c86dec0a4be369f7040384da12dc5353d0eb7c83d9276fd0`;
  - arm64-v8a, minSdk 29, targetSdk 34;
  - CAMERA and VIBRATE only, no INTERNET, not debuggable;
  - APK Signature Scheme v2 with the local prototype key (not production or store signing).
  - The checksum was verified again at the freeze.
- **Physical validation:** Redmi Note 11 (2201117TI), Android 13, Google Play Services for AR 1.56, in airplane mode with Wi-Fi off. The installed APK's SHA-256 matched the release.
- **Timed rehearsal on the release APK:** all 27 steps passed, in about **3 min 43 s** from the icon tap to Reset time.
  - Fire 100 → certificate → QR → VALID → INVALID → VALID → Gas 100 → dashboard → +7 days → Refresher Due → Reset time.
  - Timings: first frame 1.2 s; AR camera ready 4.9 s (Fire) and 3.6 s (Gas). Fire's automatic placement took about 18 s after tapping Start; Gas took about 8 s.
  - **No blocking issues.** There were 0 crashes or ANRs.
- **Final phone state:**
  - release APK only, camera granted, Hindi selected;
  - demo worker Ramesh Kumar / JH-2001 ready, with no attempts or certificates;
  - airplane mode ON.
- **Public dashboard:** https://chiragvaze.github.io/SurakshaAR/#/dashboard, verified over HTTPS.
  - 8 seeded workers; +7 days gives 5 Red and 8 Refresher due; Reset time restores the baseline.
  - It holds seeded data only, with no sync with phones.
- **Automated tests:** web 72/72, shell 6/6, Unity 26/26 (P3-M5).
- **Known limitations, unchanged and not fixed:**
  - **D-032** is deferred (grant camera permission before launching AR).
  - **D-034** remains open for the APK only.
  - **Santali** remains the Hindi fallback (D-036).
  - **Certificate signing** remains demo-only.
  - **One physical device** remains the tested hardware.
- **Not part of the freeze:** the 3–5 minute demo video, which the team records using the sequence prepared in P3-M5.

## D-040 — Post-freeze milestone: Local Role-Based Dashboard Prototype (2026-10-01)
- **Scope:** a separate management mode in the web app with three roles: Trainer, Mine Safety Officer and Contractor.
  - Routes: `#/manage` (role selection) and `#/manage/<trainer|officer|contractor>?view=<tab>`.
  - The worker flow is unchanged, apart from a "Management portal (prototype)" link on Welcome and Home.
- **Data:** no new copy of worker or training data.
  - `js/services/management.js` builds every figure from `sa_v1` through the existing `SA.retention.dashboardRows()` (risk formula, thresholds, 7-day refresher), `SA.scoring` and `SA.certificate.verify()` at logical time. So +7 days and Reset time move every role's view.
  - The role session and module assignments live in a separate, validated key, `sa_mgmt_v1`. `store.js` and `sa_v1` are unchanged.
- **Security:** role selection is a prototype convenience, **not authentication** (no credentials). Certificate signing and verification are unchanged (demo HMAC).
- **Near-miss:** a labelled "Near-Miss Reports — Prototype" placeholder only. There are no records, no upload and no fabricated data.
- **Language:** the management UI is English-only for now (`SA.MGMT_STRINGS` via `SA.i18n.tFor`). The worker app's Hindi tables gain only the two link labels.
- **CSP:** the bars set their width with `element.style`, not a style attribute, because the dev server's strict CSP (`style-src 'self'`) blocks the latter.
- **Not changed:** Unity, the Android shell, Gradle, permissions, signing, package or version. The frozen `v1.0.0-sih-final` release APK (`e69b2216…d9276fd0`) does **not** contain this milestone; a new APK build is needed to ship it.
- **Tests:** web 86/86 (72 existing + 14 new, with a minimal fake DOM so the role screens render in Node), shell 6/6, Unity 26/26. A real-browser (headless Edge) end-to-end pass covered all three roles, assignments, role switching, Logout and +7/Reset, plus the full existing worker flow.

## D-041 — Post-freeze: Suraksha Drishti UI/UX redesign (2026-10-01)
- **Scope:** a premium, unified design system across the worker app, the web dashboard and the Unity AR HUD, on branch `ui-redesign` (phased commits). The full map and status are in `docs/26_UI_REDESIGN.md`.
- **Architecture unchanged:** vanilla JS app in the WebView, Unity AR library and local storage.
  - No React, Tailwind, backend, Firebase, TFLite, Vosk or Vuforia was introduced. These systems do not exist in this repository, and the redesign does not pretend they do.
  - Scoring, retention, certificate signing and verification, the bridge contract and `sa_v1` are unchanged.
- **Honest local versions** of requested features that need missing systems, each labelled on screen:
  - **PPE Check:** a manual self-check. "Not sure" goes to a trainer review queue; nobody is failed automatically.
  - **Safety Coach:** answers only from the approved training content. It is not an AI model, and voice input is disabled.
  - **SOS:** two steps, logged on the phone with an audit entry. It never claims an alert was sent, and tells the worker to get help in person.
  - **Near-miss:** reports are stored on the device only, with no photos. Officers track Open / Investigating / Resolved.
  - **Zone clearance:** a demo rule (a valid certificate and no refresher due).
  - **Haadsa Replay / Pressure Drill:** practice only; nothing is scored or stored.
  - **Planned languages:** Khortha, Nagpuri, Ho and Mundari are listed but cannot be selected (D-018).
- **New keys:** `sa_ui_v1` (display preferences) and `sa_safety_v1` (safety records), both validated on load.
- **Unity:** visual-only HUD restyle (TrainerHUD.cs). The export was rebuilt; EditMode tests 26/26.
- **Android shell:** light window theme plus an optional `setDarkTheme(boolean)` bridge call for the system bars. No permission, signing, package or version changes.
- **Device validation (Redmi Note 11, Android 13, airplane mode, debug build):**
  - install and launch work;
  - the light status bar follows the theme;
  - Fire AR and Gas AR both scored 100 with the restyled HUD, and both results reached the web app (shell log + stored attempts);
  - Home showed readiness 100%;
  - certificate and Passport QR work;
  - theme toggle and SOS cancel work;
  - no crashes.
  - One bug was found and fixed: AR results carry no start time, so the result screen showed "Time taken 1 s". It now shows "—".
- **Not changed:** the frozen `v1.0.0-sih-final` release APK (`e69b2216…d9276fd0`) does not contain the redesign; shipping it needs a new release build. D-032, D-034, Santali and demo-only signing are unchanged.

## D-042 — Post-freeze: Santali localisation and offline Santali voice (2026-10-03)
- **Scope:** Santali (`sat`) becomes a selectable language across the worker app and the AR trainer, using the existing i18n system (no second framework). Details: [`SANTALI_LOCALIZATION.md`](SANTALI_LOCALIZATION.md). This supersedes the Santali part of D-036.
- **Script:** Ol Chiki. The three earlier Devanagari Santali strings (greeting, two module titles) were converted. Digits stay Latin.
- **Text:**
  - `web-app/js/i18n/santali.js` covers **all 448 worker-app keys**, with explicit fallback keys (none).
  - The wording is a **provisional AI draft**. Every key is `native-review-required`, and `REVIEW_LOG` is empty because no native review has happened. Tests forbid claiming a review without a record.
  - `npm run santali:sheet` generates the reviewer sheet `docs/santali-review.csv`.
- **Safety safeguard:** while a safety-critical key is unreviewed, the Hindi original is shown under the Santali text, on the web screens and in AR.
- **Voice:**
  - The offline pre-recorded clip pipeline is complete: manifest `santali-audio.js` (20 lines), `SA.voice` on the web, `Narrator` + `SurakshaNative.voicePlay` (MediaPlayer on APK assets) in AR.
  - **0 of 20 clips are recorded.**
  - Missing clip in AR: the Hindi text is spoken with the Hindi TTS voice, labelled "ᱥᱟᱱᱛᱟᱲᱤ ᱟᱲᱟᱝ ᱵᱟᱝ ᱨᱮᱠᱚᱨᱰ ᱟᱠᱟᱱᱟ · ᱦᱤᱱᱫᱤ ᱟᱲᱟᱝ / संताली आवाज़ रिकॉर्ड नहीं · हिन्दी आवाज़".
  - Web screens say "Santali voice not recorded yet". No TTS, speech synthesis or network is used for Santali.
  - New AR replay button (↻).
- **Management portal:** stays English-only (D-040), and works with Santali selected.
- **Android shell:**
  - `copyWebApp` now copies `audio/**/*.ogg` uncompressed (`noCompress '.ogg'`).
  - It is now a **Sync** task, so files deleted from `web-app` no longer linger in the APK. This was found when two test tones from the pipeline check stayed in a build.
  - Version `0.6.0-sat` (versionCode 6). No permission or signing changes.
- **Tests:** web 128/128 (114 + 14 new), Unity 28/28 (26 + 2 new), shell 6/6.
  - Two Unity assertions and two web assertions that encoded "Santali falls back to Hindi" now check for the provisional Santali and its review flag. The fallback mechanism itself is still tested with synthetic data.
- **Device validation (Redmi Note 11, Android 13, airplane mode):**
  - **Pipeline check:** a temporary, uncommitted build with two test tones in place of clips, signed with the same key and installed in place.
    - The web briefing tone and Play again worked.
    - In AR question 1, the tone played through MediaPlayer about 0.4 s after placement. The "Hindi voice" label disappeared while it played, and ↻ replayed it.
    - The placement hint and explanations used the Hindi voice with the label.
    - Fire AR in Santali scored 100, and the result reached the app.
    - Ol Chiki renders in the WebView and in AR (system `NotoSansOlChiki-Regular.ttf`). The Hindi lines appeared under the prompt, options and hints.
  - **Release `0.6.0-sat`** (SHA-256 `897e1c24e803e0752166bd89894b683498d68e9107dd1a0cee79473b3dcb398a`, 22,921,944 bytes, no audio files), installed in place over the pipeline build:
    - data and Santali persisted;
    - the Gas briefing showed the Hindi lines and the "not recorded" note;
    - Gas AR was run in Santali (operator-reported);
    - switching to Hindi restored Hindi, and Gas AR in Hindi used the Hindi TTS;
    - Hindi persisted after a force-stop and relaunch;
    - no crashes.
- **Not changed:** the frozen `v1.0.0-sih-final` release (`e69b2216…d9276fd0`), scoring, certificate cryptography, QR, `sa_v1`, the bridge contract.
