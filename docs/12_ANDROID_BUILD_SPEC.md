# Android Build Specification

## Shell
- Kotlin
- Android Studio (originally planned; not used or required: the shell builds with Unity's bundled toolchain, see D-029)
- WebView
- JavaScript interface
- Unity as Library

## Manifest/permissions
Camera permission is required for AR.

## Build
- Android 10+ / API 29+
- IL2CPP
- ARM64
- OpenGLES3
- no Vulkan

## Integration order
1. Build/export Unity library.
2. Copy into Android project.
3. Copy web app assets.
4. Configure WebView + bridge.
5. Gradle assemble release.
6. Install on physical ARCore phone.
7. Test offline.

As implemented: Gradle reads the Unity export from `../unity-ar/Builds/AndroidExport` and copies `../web-app` into the build assets. Nothing is copied by hand. All seven steps are done. `assembleRelease` was built and validated on the phone in P3-M2 (D-035), signed with a local, non-production key.

## Device
Phase 2/3 needs a physical ARCore-capable Android device.

Enable:
- Developer Options
- USB debugging

## No required cloud credentials
No Firebase, Google Cloud API key, Supabase, Vuforia or other service credential is required for the prototype.

## Implementation status (Milestone 4)
Build steps, with no Android Studio (see `24_DECISION_LOG.md` D-029):
```bash
unity-ar/build.sh export      # Unity -> unity-ar/Builds/AndroidExport (unityLibrary)
android-shell/build.sh test   # JVM unit tests (BridgeContract)
android-shell/build.sh        # -> android-shell/app/build/outputs/apk/debug/app-debug.apk
SURAKSHAAR_SIGNING=<local keystore.properties> android-shell/build.sh release   # P3-M2 -> .../apk/release/app-release.apk
```

The APK is `com.surakshaar.app`: minSdk 29, targetSdk 34, compileSdk 36, arm64-v8a only, about 25 MB. It requests CAMERA and VIBRATE only.

## Milestone 5 validation (2026-09-30, Redmi Note 11, Android 13, airplane mode ON)
- **Build:** reproduced from the repository with `unity-ar/build.sh export` then `android-shell/build.sh` (Unity toolchain only; the ID-only rewrite of `AR_Trainer.unity` was restored). APK 25,284,700 bytes, CAMERA and VIBRATE only.
- **Clean install:** both `com.surakshaar.artrainer` and `com.surakshaar.app` were uninstalled, then the APK was installed fresh. First launch opened the Welcome screen with empty localStorage.
- **Network:** airplane mode was on with Wi-Fi off and "Active default network: none" throughout. **No network dependency was encountered.**
- **Offline flows:**
  - Fire 100: AR → Result → certificate → QR → VALID; one-character tamper gave INVALID.
  - Gas 100: same flow, VALID and then INVALID.
  - Gas 67: NOT PASSED, no certificate issued.
- **Persistence:** after closing and reopening the app, the worker, language, 3 attempts and 2 certificates (still VALID) were intact.
- **Performance, measured from SurfaceFlinger presented frames:**
  - Fire: about 9 min continuous, 29.8–29.9 fps.
  - Gas: over 3 min continuous, 29.8–29.9 fps.
  - Isolated single-sample dips: 25.9 during AR start-up and one 20.1 reading, each recovering immediately.
  - No degradation over time. AR process memory stayed at 360–411 MB with no upward trend. No visual artifacts.
- **Error paths:**
  - Camera denied: physically tested (see D-032).
  - AR exit/cancel: physically tested.
  - Unsupported device and launch failure: code-reviewed and unit-tested; not physically testable on an ARCore-certified phone.
- **Signing:** debug key for sideload/demo (D-031).

## Phase 3 Milestone 1 (P3-M1) validation (2026-09-30), COMPLETE: PASS
Validation only; no code was changed. The frozen `phase2-complete` APK was used. Decision entry: D-033.

- **Device:** Redmi Note 11, Android 13, Google Play Services for AR 1.56.
- **APK:** `com.surakshaar.app` 0.4.0-m4. SHA-256 byte-identical to the `phase2-complete` build.
- **Setup:**
  - App storage cleared.
  - Camera permission granted before the run.
  - Hindi TTS voice available and heard.
- **Network:** airplane mode ON, Wi-Fi OFF and no active network, checked at the start, after Gas and at the end.
- **Journey:** the full 26-step demo journey passed as one continuous run:
  language → worker → Fire AR → Result → certificate → QR → VALID → tamper → INVALID → VALID → Gas AR → dashboard → +7 days → Refresher Due → Reset time.
- **Fire:** Hindi, all 3 answers correct, score 100, result returned to the web app.
- **Gas:** Hindi, all 3 answers correct, score 100, result returned to the web app.
- **Certificate:**
  - Ramesh Kumar / JH-2001, Fire & Explosion, score 100, valid 365 days, QR displayed.
  - Verified VALID, then one changed character gave INVALID (signature mismatch), then **Use Last Certificate** gave VALID again.
- **Dashboard (first physical verification inside the APK):** works, with 9 workers (8 seeded plus this phone's worker).
- **Simulate +7 Days:**
  - This phone's worker went from 0 Green to 35 Amber.
  - Red count went from 2 to 5 (JH-1003, JH-1004 and JH-1008 became red).
  - Refresher Due went from 2 workers to all 9.
  - The Home Retention Guard card showed Amber, risk 35, Refresher Due.
  - Every value matched the risk formula.
- **Reset time:** every row and tile returned to its exact pre-simulation value, and the Reset button became disabled again.
- **Startup timing:**
  - Cold start to the Welcome screen: about 1.8 s.
  - Second cold start to Home: about 2.0 s.
- **AR start-up timing:**
  - First usable AR view: Fire about 5.2 s, Gas about 4.1 s after tapping Start. About 4 s of this is Unity's startup screen.
  - No floor plane was found, so the automatic placement fallback placed the content in both runs.
  - No hangs, crashes or freezes. The `:unity` process exits after Finish are normal (D-028).
- **Persistence:**
  - The data survived both AR sessions.
  - After a forced close and cold relaunch, the worker, both attempts, the certificate (still VALID) and time offset 0 were all intact.
- **Automated tests:** web 72/72, shell 6/6 and Unity 26/26, both before and after the run.
- **Observed issues:**
  - The offline-cache (service-worker) registration fails inside the APK, logging `Failed to execute 'addAll' on 'Cache'`. It is non-blocking (D-034).
  - The saved language was found set to English after the Gas run. Most likely the top-bar language button was tapped; Fire and Gas both ran in Hindi.
- **Not covered by P3-M1:**
  - the release build (since covered by P3-M2, below);
  - the camera-denial path (D-032 is still open);
  - Santali;
  - other phone models.

## Phase 3 Milestone 2 (P3-M2) release build validation (2026-09-30), COMPLETE: PASS
No product code was changed. Only build configuration changed: an optional release `signingConfig` in `app/build.gradle`, a `release` option in `build.sh`, and signing patterns in `.gitignore`. Decision entry: D-035.

- **Build:**
  - `SURAKSHAAR_SIGNING=<keystore.properties> android-shell/build.sh release`, using Unity's toolchain only. `BUILD SUCCESSFUL` in 4m41s.
  - It reused the `phase2-complete` Unity export (`unity-ar/Builds/AndroidExport`). Unity was not re-exported.
- **APK:** `android-shell/app/build/outputs/apk/release/app-release.apk`
  - 22,798,055 bytes. SHA-256 `e69b221623d34397c86dec0a4be369f7040384da12dc5353d0eb7c83d9276fd0`.
  - `com.surakshaar.app`, versionCode 4, versionName 0.4.0-m4 (unchanged). minSdk 29, targetSdk 34, arm64-v8a only.
  - Permissions: CAMERA and VIBRATE only (no INTERNET). Not debuggable.
- **Size:** smaller than the debug APK's 25,284,700 bytes, because the debug build includes extra debugging data. `minifyEnabled` stays false.
- **Signing:**
  - APK Signature Scheme v2, verified with `apksigner`.
  - One signer: `CN=SurakshaAR SIH 2026 Prototype (not production), O=SurakshaAR, C=IN`. Certificate SHA-256 `fe718abc…8d5cff1d`. It is **not** the Android Debug key.
  - This is a local prototype key. It is not a Play Store key, not Play App Signing, and not a production key.
- **Keystore:**
  - PKCS12, alias `surakshaar-sih-prototype`, RSA-2048, valid until 2054.
  - Kept on the development machine at `%USERPROFILE%\.surakshaar-signing\`, outside the repository and outside OneDrive.
  - The passwords live only in the local `keystore.properties`. Nothing secret is in tracked files, and `*.p12`, `*.jks`, `*.keystore` and `keystore.properties` are git-ignored.
- **Install:**
  - `adb install -r` over the debug build was refused with `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, because the signatures differ.
  - The debug build was uninstalled, then the release APK was installed. The on-device SHA-256 matched the built APK.
  - Storage was cleared and the camera permission granted before the first launch.
- **Device:** Redmi Note 11 (2201117TI), Android 13, Google Play Services for AR 1.56. The Hindi TTS voice was usable (log) and heard.
- **Network:** airplane mode ON, Wi-Fi OFF and no active network throughout.
- **Smoke test:** all 24 steps passed.
  - Fire (Hindi) 100 → certificate → QR → VALID → one-character tamper → INVALID → Use Last Certificate → VALID. The on-screen payload's HMAC was recomputed independently on the computer and matched.
  - Gas (Hindi) 100.
  - Dashboard: 9 workers; 4 Green, 3 Amber, 2 Red, 2 Refresher due.
  - After +7 days: 0 Green, 4 Amber, 5 Red, 9 Refresher due. The Home Retention Guard showed Amber 35 / Refresher Due.
  - Reset time returned exactly to the baseline, with Reset disabled again.
- **Also exercised by the tester:**
  - AR **Exit** twice (`user_closed`): returned to the briefing, no attempt saved, and a clean restart afterwards.
  - One extra Fire run, which scored 100.
- **Persistence:** after a forced close and cold relaunch, the worker, language, attempts, time offset 0 and the certificate (still VALID) were all intact.
- **Stability:** no crash or ANR lines in the log. Every `:unity` exit was the normal exit after closing AR.
- **Automated tests:** web 72/72, shell 6/6 and Unity 26/26 after the change.
- **Timing, compared with P3-M1 (debug):**
  - Cold-start first frame: 0.95 s and 0.76 s (P3-M1: 1.35 s).
  - Time until the Welcome screen had fully rendered could not be measured: release WebViews expose no in-page timing, and the Welcome screen was confirmed visible by a screenshot within 6.5 s.
  - First usable AR view: Fire 5.0 s; Gas 4.0 s and 3.6 s (P3-M1: 5.2 s / 4.1 s).
  - Automatic placement was used every time.
- **Differences from P3-M1:**
  - No functional differences.
  - Expected release-only difference: WebView debugging is off (`BuildConfig.DEBUG` is false), so console messages are not forwarded to logcat and in-page state cannot be inspected with DevTools.
  - As a result, the D-034 service-worker error could not be observed in the release build. The code path is unchanged, so D-034 stays open.
