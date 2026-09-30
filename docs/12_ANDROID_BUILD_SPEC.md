# Android Build Specification

## Shell
- Kotlin
- Android Studio
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
