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

## D-032 — Known issue: ARCore native crash when camera permission is first denied (Milestone 5)
- **What happened:** on a fresh install, denying the very first camera prompt caused one native crash (SIGSEGV) inside Google's `libarcore_c.so` (Google Play Services for AR). It was in the isolated `:unity` process, about 11 s after the denial.
- **Recovery:** Android then restarted the app, as it does after a permission change. The web app reloaded with all data intact. The next denied launch showed our "camera permission needed" message and returned `camera_denied`, and the web app fell back to the on-screen trainer.
- **Why:** XR Plug-in Management initializes ARCore at startup (`InitManagerOnStart`) while our bootstrap is still requesting the permission.
- **Fix (after the freeze):** initialize the XR loader manually only after the camera permission is granted. It is not changed during the freeze: it alters Unity's startup order, and the failure is contained and recoverable.
